// Bienvenida única (journey nuevo, S1): un toque declara la edad y lleva al inicio. Los permisos no se piden
// aquí: el micrófono y la IA en internet se piden justo cuando se usan (J1, J2), y arrancan apagados.
import { test, expect } from './base.js'
import { leerPerfil, microfonoFalso } from './ayuda.js'

test.use({ nuevo: true })

test('un toque en la bienvenida lleva al inicio con los permisos más protectores', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Hola, soy Garúa.' })).toBeVisible()
  // lo esencial legal y ético, en tres líneas
  await expect(page.getByText('Lo que cuentes se queda en tu teléfono.')).toBeVisible()
  await expect(page.getByText('no diagnostica ni reemplaza a una persona', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Tengo 18 años o más, empecemos' }).click()
  await expect(page.getByRole('radio', { name: /Soleado/ })).toBeVisible()
  await expect(page.getByText('Elegir tu cielo ya basta. Contarlo es opcional.')).toBeVisible()
  const p = await leerPerfil(page)
  expect(p.primerUso).toEqual({ completo: true, edad: 'adulto' })
  expect(p.privacidad).toEqual({ grabarVoz: false, transcribirEnInternet: false, iaEnInternet: false, climaCompartido: false })
})

test('menores de 18: pantalla propia, pueden respirar sin dar datos', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Tengo menos de 18' }).click()
  await expect(page.getByRole('heading', { name: 'Qué bueno que estés aquí' })).toBeVisible()
  await expect(page.getByText('léelo con tu mamá, papá o alguien que te cuide', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Lo leímos juntos, empezar' }).click()
  expect((await leerPerfil(page)).primerUso).toEqual({ completo: true, edad: 'menor' })
})

test('el respiro funciona sin pasar por la bienvenida y no guarda nada', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Necesito un respiro ahora' }).click()
  await expect(page.getByText('Empezamos en 3…')).toBeVisible()
  await expect(page.locator('.respiro__guia')).toHaveText('Inhala…', { timeout: 5000 })
  await page.getByRole('button', { name: 'Terminar' }).click()
  await page.getByRole('radiogroup', { name: 'Cómo estabas antes' }).getByRole('radio', { name: /Tormenta/ }).click()
  await page.getByRole('radiogroup', { name: 'Cómo estás ahora' }).getByRole('radio', { name: /Lluvia/ }).click()
  await page.getByRole('button', { name: 'Listo' }).click()
  await expect(page.getByText('¿Quieres guardar cómo te va?')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('clima-interior:perfil'))).toBeNull()
  await page.getByRole('button', { name: 'Empezar' }).click()
  await expect(page.getByRole('heading', { name: 'Hola, soy Garúa.' })).toBeVisible()
})

test('la crisis está a un toque desde la bienvenida', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Ayuda ya/ }).click()
  await expect(page.getByRole('heading', { name: 'Mereces apoyo ahora mismo' })).toBeVisible()
  await expect(page.getByText('Estas líneas atienden de verdad y son gratis.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Volver cuando quieras' }).click()
  await expect(page.getByRole('heading', { name: 'Hola, soy Garúa.' })).toBeVisible()
})

test('se puede mirar la app con 30 días de ejemplo sin dar permisos', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Ver un ejemplo' }).click()
  await expect(page.getByText('Modo demo: datos simulados')).toBeVisible()
  await expect(page.locator('.calendario li')).toHaveCount(30)
})

test('«cómo cuidamos tus datos» se lee sin salir de la bienvenida', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'cómo cuidamos tus datos' }).click()
  await expect(page.getByRole('dialog')).toContainText('Ley 29733')
  await page.getByRole('button', { name: 'Entendido' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('el micrófono se pide justo a tiempo, la primera vez que se usa (J1)', async ({ page }) => {
  await microfonoFalso(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Tengo 18 años o más, empecemos' }).click()
  await page.getByRole('radio', { name: /Nublado/ }).click()
  await page.getByRole('button', { name: 'Contar mi día por voz' }).click()
  const hoja = page.getByRole('dialog', { name: 'Antes de grabar' })
  await expect(hoja).toContainText('Tu audio se borra apenas tenemos el texto.')
  await hoja.getByRole('button', { name: 'Prefiero escribir' }).click()
  await expect(page.getByRole('textbox', { name: '¿Cómo fue tu día?' })).toBeVisible()
  expect((await leerPerfil(page)).privacidad.grabarVoz).toBe(false)
  await page.getByRole('button', { name: 'Mejor lo cuento hablando' }).click()
  await page.getByRole('button', { name: 'Activar micrófono' }).click()
  await expect(page.getByText('Micrófono activo')).toBeAttached()
  expect((await leerPerfil(page)).privacidad.grabarVoz).toBe(true)
})
