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
