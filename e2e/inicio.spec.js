// Composición del Inicio en tamaños difíciles: la burbuja nunca tapa a Garúa (A7).
import { test, expect } from './base.js'

const perfil = (preferencias) => async ({ page }) => {
  await page.addInitScript((p) => {
    localStorage.setItem('clima-interior:perfil', JSON.stringify({ primerUso: { completo: true, edad: 'adulto' }, preferencias: p }))
  }, preferencias)
}

const CASOS = [
  ['320 × 568', 320, 568, { tema: 'claro' }],
  ['375 × 812, noche y texto más grande', 375, 812, { tema: 'noche', tamanoTexto: 'mas-grande' }],
  ['320 × 568, noche y texto más grande', 320, 568, { tema: 'noche', tamanoTexto: 'mas-grande' }],
  ['414 × 896, texto grande', 414, 896, { tema: 'claro', tamanoTexto: 'grande' }],
]

for (const [nombre, ancho, alto, prefs] of CASOS) {
  test.describe(nombre, () => {
    test.beforeEach(perfil(prefs))
    test(`la burbuja no tapa a Garúa (A7) · ${nombre}`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: alto })
      await page.goto('/')
      await page.waitForTimeout(300)
      const b = await page.locator('.burbuja--saludo').boundingBox()
      const g = await page.locator('.escena__garua').boundingBox()
      // la cara de Garúa: el centro de su caja (las poses tienen aire alrededor)
      const cara = { x: g.x + g.width * 0.2, y: g.y + g.height * 0.2, w: g.width * 0.6, h: g.height * 0.6 }
      const choca = b.x < cara.x + cara.w && b.x + b.width > cara.x && b.y < cara.y + cara.h && b.y + b.height + 12 > cara.y
      expect(choca).toBe(false)
      // y Garúa queda entera dentro de la escena (antes a 320 px solo se veía un ojo)
      const e = await page.locator('.escena--inicio').boundingBox()
      expect(g.x + g.width).toBeLessThanOrEqual(e.x + e.width + 1)
      expect(g.y).toBeGreaterThanOrEqual(e.y)
    })
  })
}
