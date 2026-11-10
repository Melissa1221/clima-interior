// Personalización continua: el perfil aprende del uso y la persona controla lo que sabe (HU-08, HU-09).
import { test, expect } from '@playwright/test'
import { microfonoFalso, checkinEscrito, leerPerfil, contarFrases } from './ayuda.js'

test.beforeEach(async ({ page }) => {
  await microfonoFalso(page)
  await page.goto('/')
})

test('tres "Más corto" dejan las reflexiones en una frase y la app dice por qué (HU-08 Esc. 1, RF-22)', async ({ page }) => {
  for (let i = 0; i < 3; i++) await checkinEscrito(page, { texto: 'Mucho tráfico y estuve cansada', masCorto: true })
  const antes = await checkinEscrito(page, { texto: 'Estuve cansada todo el día', masCorto: false })
  expect(contarFrases(antes)).toBe(1)
  await page.getByRole('button', { name: /Tú/ }).click()
  await expect(page.getByText('Reflexiones de una sola frase').first()).toBeVisible()
  await expect(page.getByText(/Pediste "más corto" 3 veces/)).toBeVisible()
})

test('las emociones que eliges seguido aparecen como "tuya" aunque la IA no las proponga (RF-12, RF-21)', async ({ page }) => {
  for (let i = 0; i < 2; i++) await checkinEscrito(page, { texto: 'Me sentí aliviada al terminar', elegir: ['alivio'] })
  await page.getByRole('radio', { name: /Soleado/ }).click()
  await page.getByRole('button', { name: /Escribir/ }).click()
  await page.getByRole('textbox').fill('Día con música y tranquilo')
  await page.getByRole('button', { name: 'Listo' }).click()
  await expect(page.getByRole('button', { name: 'alivio · tuya' })).toBeVisible()
})

test('si el micrófono falla dos veces, la app empieza ofreciendo escribir', async ({ page }) => {
  await page.evaluate(() => { window.__micFalla = true })
  for (let i = 0; i < 2; i++) {
    await page.getByRole('radio', { name: /Nublado/ }).click()
    await page.getByRole('button', { name: 'Contar mi día por voz' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await page.getByRole('link', { name: /Salir por hoy/ }).click()
  }
  await page.getByRole('radio', { name: /Nublado/ }).click()
  await expect(page.getByRole('heading', { name: 'Escribir mi día' })).toBeVisible()
  await expect(page.getByText('Como el micrófono falló')).toBeVisible()
  await expect(page.getByRole('button', { name: /Hablar/ })).toBeVisible() // la voz sigue disponible
})

test('apagar las emociones inferidas las borra y no se vuelven a guardar (HU-09 Esc. 1, RF-23)', async ({ page }) => {
  await checkinEscrito(page, { texto: 'Estuve cansada', elegir: ['cansancio'] })
  await page.getByRole('button', { name: /Tú/ }).click()
  await page.getByRole('checkbox', { name: /Las emociones que propone la IA/ }).uncheck()
  await expect(page.getByText('Apagado: no lo uso ni lo guardo.')).toBeVisible()
  expect((await leerPerfil(page)).registros[0].emocion_inferida).toBeNull()
  await page.getByRole('button', { name: 'Volver al inicio' }).click()
  await checkinEscrito(page, { texto: 'Otra vez cansada' })
  expect((await leerPerfil(page)).registros[1].emocion_inferida).toBeNull()
})

test('borrar todo pide confirmación y deja el perfil vacío (RF-38)', async ({ page }) => {
  await checkinEscrito(page, { texto: 'Día normal' })
  await page.getByRole('button', { name: /Tú/ }).click()
  page.once('dialog', (d) => d.accept())
  await page.getByRole('button', { name: 'Borrar todo' }).click()
  await expect(page.getByText('Llevas 0 registro(s) guardados.')).toBeVisible()
})
