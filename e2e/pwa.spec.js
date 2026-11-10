// La app compilada se instala como PWA y funciona sin internet (RF-19, RF-20, RNF-20).
import { test, expect } from '@playwright/test'

test('tiene manifiesto instalable y service worker', async ({ page }) => {
  await page.goto('/')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  const manifiesto = await (await page.request.get(href)).json()
  expect(manifiesto.name).toBe('Clima Interior')
  expect(manifiesto.display).toBe('standalone')
  expect(manifiesto.icons.length).toBeGreaterThan(0)
  const activo = await page.evaluate(async () => !!(await navigator.serviceWorker.ready).active)
  expect(activo).toBe(true)
})

test('sin internet se puede registrar el día y ver las líneas de ayuda', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload() // la página queda controlada por el service worker
  await context.setOffline(true)
  await page.reload()
  await page.getByRole('radio', { name: /Lluvia/ }).click()
  await page.getByRole('button', { name: /Así está bien/ }).click()
  await expect(page.getByRole('heading', { name: 'Tu día quedó guardado' })).toBeVisible()
  await page.getByRole('button', { name: 'Hasta mañana' }).click()
  await page.getByRole('radio', { name: /Tormenta/ }).click()
  await page.getByRole('button', { name: /Escribir/ }).click()
  await page.getByRole('textbox').fill('me quiero matar')
  await page.getByRole('button', { name: 'Listo' }).click()
  await expect(page.locator('a[href="tel:113"]')).toBeVisible()
  await context.setOffline(false)
})
