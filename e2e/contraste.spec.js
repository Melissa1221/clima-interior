// Contraste de los textos que van sobre la ilustración, medido en píxeles (axe no lo resuelve): ≥ 4,5:1.
import { test, expect } from './base.js'
import { contrastes } from './contraste.js'

const conTema = (tema) => async ({ page }) => {
  await page.addInitScript((t) => {
    localStorage.setItem('clima-interior:perfil', JSON.stringify({ primerUso: { completo: true, edad: 'adulto' }, preferencias: { tema: t } }))
  }, tema)
}

const TEXTOS_RESPIRO = ['.respiro .etiqueta', '.respiro__ponte', '.respiro__guia', '.respiro .cuerpo-l', '.respiro__pie .cuerpo',
  '.respiro__pie .enlace', '.cabecera .ib--plano']

for (const tema of ['noche', 'claro']) {
  test.describe(`tema ${tema}`, () => {
    test.beforeEach(conTema(tema))

    test(`respiro: los textos sobre el cielo tienen 4,5:1 o más (${tema})`, async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: 'Necesito un respiro' }).click()
      await page.locator('.respiro__ponte').waitFor()
      const cuenta = await contrastes(page, TEXTOS_RESPIRO)
      await page.locator('.respiro__guia').waitFor({ timeout: 5000 })
      const respirando = await contrastes(page, TEXTOS_RESPIRO)
      const todos = [...cuenta, ...respirando]
      expect(todos.length).toBeGreaterThan(6)
      expect(todos.filter((t) => t.razon < 4.5)).toEqual([])
    })

    test(`inicio: la fecha y la ayuda contextual tienen 4,5:1 o más (${tema})`, async ({ page }) => {
      await page.goto('/')
      const r = await contrastes(page, ['.fecha .titulo-s', '.fecha .etiqueta-sm', '.cabecera .ib--plano'])
      expect(r).toHaveLength(3)
      expect(r.filter((t) => t.razon < 4.5)).toEqual([])
    })
  })
}
