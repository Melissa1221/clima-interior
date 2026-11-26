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

test('Privacidad: segmentos cortos y sin la fila «Modo demo» (B11)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await page.getByRole('button', { name: /Perfil/ }).click()
  await page.getByRole('button', { name: /^Privacidad/ }).click()
  await expect(page.getByRole('radio', { name: 'En el teléfono' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('radio', { name: 'En internet' })).toBeVisible()
  await expect(page.getByText('Modo demo')).toHaveCount(0)
  for (const r of await page.getByRole('radio').all()) {
    const lineas = await r.evaluate((el) => {
      const rango = document.createRange()
      rango.selectNodeContents(el)
      return new Set([...rango.getClientRects()].filter((x) => x.width > 1).map((x) => Math.round(x.bottom))).size
    })
    expect(lineas).toBe(1)
  }
})
