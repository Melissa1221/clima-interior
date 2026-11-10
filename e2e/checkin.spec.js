// Flujo principal: registrar el día por voz, por texto o en 10 s, y verlo en el historial.
import { test, expect } from '@playwright/test'
import { microfonoFalso, checkinEscrito, leerPerfil, leerReflexion, contarFrases } from './ayuda.js'

test.beforeEach(async ({ page }) => {
  await microfonoFalso(page)
  await page.goto('/')
})

test('check-in rápido en 2 acciones y aparece en el historial (RNF-31, RF-40)', async ({ page }) => {
  await page.getByRole('radio', { name: /Nublado/ }).click()
  await page.getByRole('button', { name: /Así está bien/ }).click()
  await expect(page.getByRole('heading', { name: 'Tu día quedó guardado' })).toBeVisible()
  await page.getByRole('button', { name: 'Hasta mañana' }).click()
  await page.getByRole('button', { name: /Historial/ }).click()
  await expect(page.getByText('Tus 1 registro(s)')).toBeVisible()
  await expect(page.locator('.calendario .paisaje--nublado')).toHaveCount(1)
  await expect(page.locator('.calendario li')).toHaveCount(30)
  // cada día muestra su número, y el registrado su clima
  await expect(page.locator('.calendario .paisaje--nublado .dia__i')).toHaveText('⛅')
  await expect(page.locator('.calendario .dia__n').last()).toHaveText(String(new Date().getDate()))
  // se puede alternar con el ejemplo de 30 días y volver
  await page.getByRole('button', { name: 'Ver el ejemplo de 30 días' }).click()
  await expect(page.getByText(/Modo demo: datos simulados/)).toBeVisible()
  await page.getByRole('button', { name: 'Ver mis registros' }).click()
  await expect(page.getByText('Tus 1 registro(s)')).toBeVisible()
})

test('antes de elegir el clima, la app dice qué hacer', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Contar mi día por voz' })).toBeDisabled()
  await expect(page.getByText('Elige un clima para empezar.')).toBeVisible()
  await page.getByRole('radio', { name: /Soleado/ }).click()
  await expect(page.getByText('Elige un clima para empezar.')).toHaveCount(0)
})

test('check-in hablado completo en menos de 90 s (RNF-01, HU-02 a HU-05)', async ({ page }) => {
  const inicio = Date.now()
  await page.evaluate(() => { window.__dictado = 'Hoy dormí poco y estuve cansada por el examen' })
  await page.getByRole('radio', { name: /Lluvia/ }).click()
  await page.getByRole('button', { name: 'Contar mi día por voz' }).click()
  await expect(page.getByText('Micrófono activo')).toBeVisible() // RF-11: indicador visible
  await expect(page.getByText('«Hoy dormí poco y estuve cansada por el examen»')).toBeVisible()
  await page.getByRole('button', { name: /Terminar/ }).click()
  // RF-06: la transcripción se puede corregir antes de ir a la IA
  const relato = page.getByRole('textbox', { name: /Lo que entendí/ })
  await expect(relato).toHaveValue('Hoy dormí poco y estuve cansada por el examen')
  await relato.fill('Hoy dormí poco y estuve cansada por el examen, pero me fue bien')
  await page.getByRole('button', { name: 'Listo' }).click()
  // RF-12, RNF-28: emociones propuestas, rotuladas como IA y no clínicas
  await expect(page.getByText(/Propuesto por IA .* no es un consejo clínico/)).toBeVisible()
  const nubes = page.locator('.nube')
  expect(await nubes.count()).toBeGreaterThanOrEqual(3)
  expect(contarFrases(await leerReflexion(page))).toBeLessThanOrEqual(2) // RF-13
  await page.getByRole('button', { name: /^cansancio/ }).click()
  await expect(page.getByRole('button', { name: /^cansancio/ })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Guardar mi día' }).click()
  await expect(page.getByRole('heading', { name: 'Tu día quedó guardado' })).toBeVisible()
  expect(Date.now() - inicio).toBeLessThan(90_000)
  // RNF-26: lo que elige la persona y lo que propuso la IA quedan separados
  const r = (await leerPerfil(page)).registros[0]
  expect(r.emocion_declarada).toEqual(['cansancio'])
  expect(r.emocion_inferida).toContain('cansancio')
  expect(r.clima).toBe('lluvia')
})

test('micrófono bloqueado ofrece escribir sin perder el clima ni el borrador (RF-08, RF-10)', async ({ page }) => {
  await page.evaluate(() => { window.__micFalla = true })
  await page.getByRole('radio', { name: /Tormenta/ }).click()
  await page.getByRole('button', { name: 'Contar mi día por voz' }).click()
  await expect(page.getByRole('alert')).toContainText('El micrófono está bloqueado')
  await page.getByRole('textbox').fill('Lo escribo porque no funcionó el micro')
  await page.getByRole('button', { name: 'Listo' }).click()
  await expect(page.getByText('Toca las nubes que sientes tuyas')).toBeVisible()
  await expect(page.locator('.paisaje--tormenta')).toBeVisible()
})

test('frase de riesgo deriva a líneas de ayuda sin llamar a la IA (RF-14, RF-15, RNF-25)', async ({ page }) => {
  await page.getByRole('radio', { name: /Niebla/ }).click()
  await page.getByRole('button', { name: /Escribir/ }).click()
  await page.getByRole('textbox').fill('Ya no quiero vivir así')
  const inicio = Date.now()
  await page.getByRole('button', { name: 'Listo' }).click()
  await expect(page.getByRole('heading', { name: 'Mereces apoyo ahora mismo' })).toBeVisible()
  expect(Date.now() - inicio).toBeLessThan(1000)
  await expect(page.locator('a[href="tel:113"]')).toBeVisible()
  await expect(page.locator('a[href="tel:106"]')).toBeVisible()
  await expect(page.locator('a[href="tel:105"]')).toBeVisible()
  await expect(page.getByText('Toca las nubes')).toHaveCount(0)
  await expect(page.getByText('La app no contactó a nadie')).toBeVisible()
})

test('los registros sobreviven a cerrar y abrir la app (HU-08 Esc. 2, RF-21)', async ({ page }) => {
  await checkinEscrito(page, { texto: 'Día tranquilo con música', elegir: ['calma'] })
  await page.reload()
  await expect(page.getByText(/Último registro: Cielo cubierto/)).toBeVisible()
  expect((await leerPerfil(page)).registros).toHaveLength(1)
})

test('el historial de ejemplo de 30 días sigue disponible (RF-39)', async ({ page }) => {
  await page.getByRole('button', { name: /Historial/ }).click()
  await expect(page.getByText(/Modo demo: datos simulados/)).toBeVisible()
  await expect(page.locator('.calendario li')).toHaveCount(30)
})
