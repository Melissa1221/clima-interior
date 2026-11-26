// Personalización continua: el perfil aprende del uso y la persona controla lo que sabe (HU-08, HU-09).
import { test, expect } from './base.js'
import { microfonoFalso, checkinEscrito, leerPerfil, contarFrases, hablar, salirPorHoy } from './ayuda.js'

test.beforeEach(async ({ page }) => {
  await microfonoFalso(page)
  await page.goto('/')
})

test('tres "Más corto" dejan las reflexiones en una frase y la app dice por qué (HU-08 Esc. 1, RF-22)', async ({ page }) => {
  for (let i = 0; i < 3; i++) await checkinEscrito(page, { texto: 'Mucho tráfico y estuve cansada', masCorto: true })
  const antes = await checkinEscrito(page, { texto: 'Estuve cansada todo el día', masCorto: false })
  expect(contarFrases(antes)).toBe(1)
  await page.getByRole('button', { name: 'Perfil', exact: true }).click()
  await page.getByRole('button', { name: /Lo que sabe de ti/ }).click()
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
    await hablar(page)
    await expect(page.getByRole('alert')).toBeVisible()
    await salirPorHoy(page)
  }
  await page.getByRole('radio', { name: /Nublado/ }).click()
  await expect(page.getByRole('button', { name: 'Escribir mi día' })).toBeVisible()
  await expect(page.getByText('Como el micrófono falló')).toBeVisible()
  await expect(page.getByRole('button', { name: /Hablar/ })).toBeVisible() // la voz sigue disponible
})

test('las emociones de la IA solo se guardan si lo permites, y apagarlas las borra (HU-09 Esc. 1, RF-23)', async ({ page }) => {
  const ia = () => page.getByRole('switch', { name: /Emociones que propuso la IA/ })
  const abrirSabe = async () => {
    await page.getByRole('button', { name: 'Perfil', exact: true }).click()
    await page.getByRole('button', { name: /Lo que sabe de ti/ }).click()
  }
  await abrirSabe()
  await expect(ia()).toHaveAttribute('aria-checked', 'false') // apagado por defecto (S40)
  await ia().click()
  await page.getByRole('button', { name: 'Inicio', exact: true }).click()
  await checkinEscrito(page, { texto: 'Estuve cansada', elegir: ['cansancio'] })
  expect((await leerPerfil(page)).registros[0].emocion_inferida).toContain('cansancio')
  await abrirSabe()
  await expect(page.getByText(/Aceptaste alguna propuesta de la IA en 1 de 1/)).toBeVisible()
  await ia().click()
  await expect(ia()).toContainText('Apagado: no se usa ni se guarda.')
  expect((await leerPerfil(page)).registros[0].emocion_inferida).toBeNull()
  await page.getByRole('button', { name: 'Inicio', exact: true }).click()
  await checkinEscrito(page, { texto: 'Otra vez cansada' })
  expect((await leerPerfil(page)).registros[1].emocion_inferida).toBeNull()
})

test('olvidar una categoría pide confirmación y conserva el diario (RF-23)', async ({ page }) => {
  for (let i = 0; i < 3; i++) await checkinEscrito(page, { texto: 'Mucho tráfico', masCorto: true })
  await page.getByRole('button', { name: 'Perfil', exact: true }).click()
  await page.getByRole('button', { name: /Lo que sabe de ti/ }).click()
  page.once('dialog', (d) => d.accept())
  await page.getByRole('button', { name: 'Olvidar cómo te habla el asistente' }).click()
  await expect(page.getByText('Reflexiones de hasta dos frases.')).toBeVisible()
  await expect(page.getByText('Se borró: Cómo te habla el asistente')).toBeVisible()
  expect((await leerPerfil(page)).registros).toHaveLength(3)
})

test('eliminar todos los datos exige escribir BORRAR y deja la app vacía (RF-38, S45)', async ({ page }) => {
  await checkinEscrito(page, { texto: 'Día normal' })
  await page.getByRole('button', { name: 'Perfil', exact: true }).click()
  await page.getByRole('button', { name: /Mis datos/ }).click()
  await page.getByRole('button', { name: /Eliminar todos mis datos/ }).click()
  const eliminar = page.getByRole('button', { name: 'Eliminar todo' })
  await expect(eliminar).toBeDisabled()
  await page.getByLabel('Escribe BORRAR para confirmar').fill('BORRAR')
  await eliminar.click()
  await expect(page.getByText('Tus datos se eliminaron')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('clima-interior:perfil'))).toBeNull()
})

test('después del primer día guardado, «¿Te acomodo algo?» aparece una sola vez (T1)', async ({ page }) => {
  await page.getByRole('radio', { name: /Soleado/ }).click()
  await page.getByRole('button', { name: 'Guardar así' }).click()
  const t1 = page.getByRole('article', { name: '¿Te acomodo algo?' })
  await expect(t1).toBeVisible()
  await t1.getByRole('switch', { name: 'Menos movimiento' }).click()
  expect((await leerPerfil(page)).preferencias.movimientoReducido).toBe(true)
  await page.getByRole('button', { name: 'Hasta mañana' }).click()
  await page.getByRole('radio', { name: /Soleado/ }).click()
  await page.getByRole('button', { name: 'Guardar así' }).click()
  await expect(page.getByRole('heading', { name: 'Tu día quedó guardado' })).toBeVisible()
  await expect(page.getByRole('article', { name: '¿Te acomodo algo?' })).toHaveCount(0)
})

test('el panel «Aa» cambia el tamaño del texto y el movimiento desde cualquier pantalla raíz', async ({ page }) => {
  await page.getByRole('button', { name: /Accesibilidad: texto/ }).click()
  const panel = page.getByRole('dialog', { name: 'Accesibilidad' })
  await panel.getByRole('radio', { name: 'Más grande' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-texto', 'mas-grande')
  await panel.getByRole('switch', { name: 'Sin tormentas ni sonidos fuertes' }).click()
  expect((await leerPerfil(page)).preferencias).toMatchObject({ tamanoTexto: 'mas-grande', modoNeutral: true })
  await panel.getByRole('button', { name: 'Más ajustes' }).click()
  await expect(page.getByRole('heading', { name: 'Accesibilidad' })).toBeVisible()
})
