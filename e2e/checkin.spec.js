// Flujo principal: registrar el día con «Guardar así», por voz o por texto, y verlo en el historial.
import { test, expect } from './base.js'
import { microfonoFalso, checkinEscrito, leerPerfil, leerReflexion, contarFrases, hablar } from './ayuda.js'

test.beforeEach(async ({ page }) => {
  await microfonoFalso(page)
  await page.goto('/')
})

test('«Guardar así»: el check-in en 2 toques aparece en el historial (RNF-31, RF-40)', async ({ page }) => {
  await page.getByRole('radio', { name: /Nublado/ }).click()
  await page.getByRole('button', { name: 'Guardar así' }).click()
  await expect(page.getByRole('heading', { name: 'Tu día quedó guardado' })).toBeVisible()
  await page.getByRole('button', { name: 'Hasta mañana' }).click()
  await page.getByRole('button', { name: /Historial/ }).click()
  await expect(page.getByText('1 día registrado')).toBeVisible()
  await expect(page.locator('.calendario .dia--nublado')).toHaveCount(1)
  await expect(page.locator('.calendario li')).toHaveCount(30)
  // cada día muestra su número, y el registrado su clima (en palabras para el lector de pantalla)
  await expect(page.locator('.calendario .dia--nublado .dia__i svg')).toHaveCount(1)
  await expect(page.locator('.calendario .dia--nublado button')).toHaveAttribute('aria-label', /Cielo cubierto/)
  await expect(page.locator('.calendario .dia__n').last()).toHaveText(String(new Date().getDate()))
  // tocar el día abre su detalle
  await page.locator('.calendario .dia--nublado button').click()
  await expect(page.getByText('Lo que sentiste')).toBeVisible()
  await page.getByRole('button', { name: 'Volver' }).click()
  // se puede alternar con el ejemplo de 30 días y volver
  await page.getByRole('button', { name: 'Ver ejemplo' }).click()
  await expect(page.getByText(/Modo demo: datos simulados/)).toBeVisible()
  await page.getByRole('button', { name: 'Ver mis registros' }).click()
  await expect(page.getByText('1 día registrado')).toBeVisible()
})

test('antes de elegir el clima, la app dice qué hacer', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Guardar así' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Contar mi día por voz' })).toBeDisabled()
  await expect(page.getByText('Elegir tu cielo ya basta. Contarlo es opcional.')).toBeVisible()
  await page.getByRole('radio', { name: /Soleado/ }).click()
  await expect(page.getByRole('button', { name: 'Guardar así' })).toBeEnabled()
})

test('check-in hablado completo en menos de 90 s (RNF-01, HU-02 a HU-05)', async ({ page }) => {
  const inicio = Date.now()
  await page.evaluate(() => { window.__dictado = 'Hoy dormí poco y estuve cansada por el examen' })
  await page.getByRole('radio', { name: /Lluvia/ }).click()
  await hablar(page)
  await expect(page.locator('.pildora--timer .rec')).toBeVisible() // RF-11: indicador visible
  await expect(page.getByText('Micrófono activo')).toBeAttached()
  await expect(page.getByText('«Hoy dormí poco y estuve cansada por el examen»')).toBeVisible()
  await page.getByRole('button', { name: 'Terminar' }).click()
  // RF-06: la transcripción se puede corregir antes de ir a la IA
  const relato = page.getByRole('textbox', { name: /Lo que entendí/ })
  await expect(relato).toHaveValue('Hoy dormí poco y estuve cansada por el examen')
  await relato.fill('Hoy dormí poco y estuve cansada por el examen, pero me fue bien')
  await page.getByRole('button', { name: 'Listo' }).click()
  // RF-12, RNF-28: emociones propuestas, rotuladas como IA y no clínicas
  await expect(page.getByText('Propuestas por IA · no es consejo clínico')).toBeVisible()
  const nubes = page.locator('.nube')
  expect(await nubes.count()).toBeGreaterThanOrEqual(3)
  await page.getByRole('button', { name: /^cansancio/ }).click()
  await expect(page.getByRole('button', { name: /^cansancio/ })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Guardar mi día' }).click()
  await expect(page.getByRole('heading', { name: 'Tu día quedó guardado' })).toBeVisible()
  // la reflexión llega al guardar, rotulada como IA y de 2 frases como máximo (RF-13)
  await expect(page.getByText('Escrita por IA · no es consejo clínico')).toBeVisible()
  expect(contarFrases(await leerReflexion(page))).toBeLessThanOrEqual(2)
  expect(Date.now() - inicio).toBeLessThan(90_000)
  // RNF-26: se guarda lo que elige la persona; lo que propuso la IA no, salvo que lo permita (S40)
  const r = (await leerPerfil(page)).registros[0]
  expect(r.emocion_declarada).toEqual(['cansancio'])
  expect(r.emocion_inferida).toBeNull()
  expect(r.clima).toBe('lluvia')
})

test('micrófono bloqueado ofrece escribir sin perder el clima ni el borrador (RF-08, RF-10)', async ({ page }) => {
  await page.evaluate(() => { window.__micFalla = true })
  await page.getByRole('radio', { name: /Tormenta/ }).click()
  await hablar(page)
  await expect(page.getByRole('alert')).toContainText('El micrófono está bloqueado')
  await page.getByRole('textbox').fill('Lo escribo porque no funcionó el micro')
  // A8: sin nada grabado no dice «Grabado · 0:00» ni «Lo que entendí», y no ofrece seguir hablando
  await expect(page.getByText('¿Cómo fue tu día?')).toBeVisible()
  await expect(page.getByText('Lo que entendí')).toHaveCount(0)
  await expect(page.getByText(/Grabado ·/)).toHaveCount(0)
  await expect(page.getByRole('button', { name: /hablando/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'Listo' }).click()
  await expect(page.getByText('Toca las nubes que sientes tuyas')).toBeVisible()
  await expect(page.locator('.paisaje--tormenta')).toBeVisible()
})

test('frase de riesgo deriva a líneas de ayuda sin llamar a la IA (RF-14, RF-15, RNF-25)', async ({ page }) => {
  await page.getByRole('radio', { name: /Niebla/ }).click()
  await page.getByRole('button', { name: /Escribir/ }).first().click()
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
  // el texto dice por qué apareció, y «Volver cuando quieras» empieza de nuevo
  await expect(page.getByText('Algo de lo que contaste nos preocupa.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Volver cuando quieras' }).click()
  await expect(page.getByRole('radio', { name: /Niebla/ })).toHaveAttribute('aria-checked', 'false')
})

test('«Ayuda ya» lleva a la crisis en 1 toque desde el inicio, el check-in y el respiro', async ({ page }) => {
  const ayudaYa = async () => {
    await page.getByRole('button', { name: /Ayuda ya/ }).click()
    await expect(page.getByRole('heading', { name: 'Mereces apoyo ahora mismo' })).toBeVisible()
    await expect(page.locator('a[href="tel:113"]')).toBeVisible()
    await expect(page.getByText('Estas líneas atienden de verdad y son gratis.', { exact: false })).toBeVisible()
    await page.getByRole('button', { name: 'Volver cuando quieras' }).click()
  }
  await ayudaYa()
  await expect(page.getByRole('button', { name: 'Guardar así' })).toBeVisible()
  // en el check-in, al volver sigue lo que se estaba escribiendo
  await page.getByRole('radio', { name: /Lluvia/ }).click()
  await page.getByRole('button', { name: /Escribir/ }).first().click()
  await page.getByRole('textbox').fill('Borrador a medias')
  await ayudaYa()
  await expect(page.getByRole('textbox')).toHaveValue('Borrador a medias')
  await page.getByRole('button', { name: 'Salir por hoy' }).click()
  await page.getByRole('button', { name: 'Volver al inicio' }).last().click()
  await page.getByRole('button', { name: 'Necesito un respiro' }).click()
  await ayudaYa()
  await expect(page.getByText(/Empezamos en|Inhala|Exhala/).first()).toBeVisible()
})

test('«Salir por hoy» despide sin reproches y no guarda nada nuevo', async ({ page }) => {
  await page.getByRole('radio', { name: /Lluvia/ }).click()
  await page.getByRole('button', { name: /Escribir/ }).first().click()
  await page.getByRole('button', { name: 'Salir por hoy' }).click()
  await expect(page.getByRole('heading', { name: 'Listo por hoy' })).toBeVisible()
  expect((await leerPerfil(page)).registros ?? []).toEqual([])
  await page.getByRole('button', { name: 'Volver al inicio' }).last().click()
  await expect(page.getByRole('button', { name: 'Guardar así' })).toBeVisible()
})

test('los registros sobreviven a cerrar y abrir la app (HU-08 Esc. 2, RF-21)', async ({ page }) => {
  await checkinEscrito(page, { texto: 'Día tranquilo con música', elegir: ['calma'] })
  await page.reload()
  await expect(page.getByText(/Último registro: Nublado, hoy/)).toBeVisible()
  expect((await leerPerfil(page)).registros).toHaveLength(1)
})

test('sin registros, el historial no culpa y ofrece el ejemplo de 30 días (RF-39)', async ({ page }) => {
  await page.getByRole('button', { name: /Historial/ }).click()
  await expect(page.getByRole('heading', { name: 'Todavía no hay días' })).toBeVisible()
  await page.getByRole('button', { name: 'Mirar 30 días de ejemplo' }).click()
  await expect(page.getByText(/Modo demo: datos simulados/)).toBeVisible()
  await expect(page.locator('.calendario li')).toHaveCount(30)
})
