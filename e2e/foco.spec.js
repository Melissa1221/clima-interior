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

test('en los grupos de opciones las flechas mueven y eligen, y el grupo es una sola parada de Tab (M7)', async ({ page }) => {
  await page.goto('/')
  const climas = page.getByRole('radiogroup', { name: 'Elige tu cielo de hoy' })
  const tabuladas = await climas.getByRole('radio').evaluateAll((rs) => rs.filter((r) => r.tabIndex === 0).length)
  expect(tabuladas).toBe(1)
  await climas.getByRole('radio', { name: /Nublado/ }).click()
  await page.keyboard.press('ArrowRight')
  await expect(climas.getByRole('radio', { name: /Lluvia/ })).toBeFocused()
  await expect(climas.getByRole('radio', { name: /Lluvia/ })).toHaveAttribute('aria-checked', 'true')
  await page.keyboard.press('End')
  await expect(climas.getByRole('radio', { name: /Niebla/ })).toHaveAttribute('aria-checked', 'true')
  await page.keyboard.press('ArrowRight') // da la vuelta
  await expect(climas.getByRole('radio', { name: /Soleado/ })).toHaveAttribute('aria-checked', 'true')
  await page.keyboard.press('ArrowLeft')
  await expect(climas.getByRole('radio', { name: /Niebla/ })).toBeFocused()
  // panel «Aa»: tamaño del texto con flechas
  await page.getByRole('button', { name: /Accesibilidad: texto/ }).click()
  await page.getByRole('radio', { name: 'Normal' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('radio', { name: 'Grande', exact: true })).toHaveAttribute('aria-checked', 'true')
})

test('Crisis es un diálogo: la alerta es solo el párrafo y Escape vuelve (B1)', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Ayuda ya/ }).click()
  const dialogo = page.getByRole('dialog', { name: 'Mereces apoyo ahora mismo' })
  await expect(dialogo).toBeVisible()
  await expect(page.getByRole('alert')).toHaveText(/Hablar con una persona puede aliviar/)
  await expect(page.getByRole('alert')).not.toContainText('113')
  await page.keyboard.press('Escape')
  await expect(dialogo).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Ayuda ya/ })).toBeFocused()
})

test('el nombre accesible del botón «Aa» contiene «Aa», lo que se ve (B2, WCAG 2.5.3)', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /^Aa\b/ })).toBeVisible()
})
