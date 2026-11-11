// Primer uso (S01-S05): edad, permisos independientes y apagados, límites no clínicos y ajustes.
import { test, expect } from './base.js'
import { leerPerfil } from './ayuda.js'

test.use({ nuevo: true })

test('primer uso completo deja los permisos más protectores y lleva al inicio', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Empezar' }).click()
  const continuar = page.getByRole('button', { name: 'Continuar' })
  await expect(continuar).toBeDisabled()
  await page.getByRole('radio', { name: 'Tengo 18 años o más' }).click()
  await continuar.click()
  await page.getByRole('button', { name: 'Guardar mis decisiones' }).click()
  await page.getByRole('button', { name: 'Entendido' }).click()
  await page.getByRole('button', { name: 'Listo' }).click()
  await expect(page.getByRole('radio', { name: /Soleado/ })).toBeVisible()
  const p = await leerPerfil(page)
  expect(p.primerUso).toEqual({ completo: true, edad: 'adulto' })
  expect(p.privacidad).toEqual({ grabarVoz: true, transcribirEnInternet: false, iaEnInternet: false, climaCompartido: false })
})

test('se puede mirar la app con 30 días de ejemplo sin dar permisos', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Ver con 30 días de ejemplo' }).click()
  await expect(page.getByText('Modo demo: datos simulados')).toBeVisible()
  await expect(page.locator('.calendario li')).toHaveCount(30)
})
