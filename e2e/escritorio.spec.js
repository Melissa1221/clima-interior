// M14: en escritorio la app es una columna centrada sobre un paisaje que llena la ventana.
import { test, expect } from './base.js'

test('a 1440 × 900 la columna va centrada y el fondo es un paisaje, no un vacío (M14)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const app = await page.locator('main.app').boundingBox()
  expect(Math.abs(app.x + app.width / 2 - 720)).toBeLessThanOrEqual(2)
  expect(app.width).toBeLessThanOrEqual(480)
  const fondo = await page.evaluate(() => getComputedStyle(document.body).backgroundImage)
  expect(fondo).toContain('url(')
  expect(fondo).toContain('linear-gradient')
  const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(desborde).toBeLessThanOrEqual(0)
})
