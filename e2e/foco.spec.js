// Manejo del foco: hojas modales, cambio de pantalla y crisis (A4, A5, B1).
import { test, expect } from './base.js'

const dentroDeLaHoja = (page) => page.evaluate(() => Boolean(document.activeElement?.closest('.hoja')))

test('el foco no sale de la hoja «Aa» con Tab ni con Mayús+Tab (A4)', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Accesibilidad: texto/ }).click()
  await expect(page.getByRole('dialog', { name: 'Accesibilidad' })).toBeVisible()
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab')
    expect(await dentroDeLaHoja(page)).toBe(true)
  }
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Shift+Tab')
    expect(await dentroDeLaHoja(page)).toBe(true)
  }
  expect(await page.locator('main').evaluate((m) => m.inert)).toBe(true)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: /Accesibilidad: texto/ })).toBeFocused()
  expect(await page.locator('main').evaluate((m) => m.inert)).toBe(false)
})

test('al cambiar de pantalla el foco va al título de la pantalla nueva (A5)', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Historial/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Todavía no hay días' })).toBeFocused()
  await page.getByRole('button', { name: 'Inicio', exact: true }).click()
  await page.getByRole('button', { name: 'Necesito un respiro' }).click()
  await expect(page.getByRole('heading', { level: 1, name: /cómoda|Acomódate/ })).toBeFocused()
  await page.getByRole('button', { name: 'Elegir otra cosa' }).click()
  await expect(page.getByRole('heading', { level: 1, name: '¿Qué te vendría bien?' })).toBeFocused()
})

test('al cerrar Crisis el foco vuelve a «Ayuda ya» (A5)', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Ayuda ya/ }).click()
  await page.getByRole('button', { name: 'Volver cuando quieras' }).click()
  await expect(page.getByRole('button', { name: /Ayuda ya/ })).toBeFocused()
})
