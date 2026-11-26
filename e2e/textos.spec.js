// Textos honestos y neutros en género (M2, M3).
import { test, expect } from './base.js'

test('eliminar mis datos no habla de servidor ni de sincronizar: todo vive en el teléfono (M2)', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Perfil', exact: true }).click()
  await page.getByRole('button', { name: /Mis datos/ }).click()
  await expect(page.locator('main')).not.toContainText(/servidor|sincroniz/i)
  await page.getByRole('button', { name: /Eliminar todos mis datos/ }).click()
  await expect(page.getByRole('heading', { name: '¿Borrar todo?' })).toBeVisible()
  await expect(page.locator('main')).not.toContainText(/servidor|sincroniz/i)
})

test('meta description y título por pantalla (M15)', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Cuenta tu día en un minuto y míralo convertido en un clima/)
  await expect(page).toHaveTitle('Inicio · Clima Interior')
  await page.getByRole('button', { name: /Historial/ }).click()
  await expect(page).toHaveTitle('Historial · Clima Interior')
  await page.getByRole('button', { name: /Ayuda ya/ }).click()
  await expect(page).toHaveTitle('Apoyo ahora · Clima Interior')
})
