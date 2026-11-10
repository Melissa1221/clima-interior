// Buenas prácticas de usabilidad y accesibilidad: WCAG 2.2 AA con axe, controles de 44 px y
// reflujo a 320 px sin scroll horizontal (RNF-04, RNF-05, RNF-06, RNF-09).
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { microfonoFalso } from './ayuda.js'

const PANTALLAS = {
  inicio: async () => {},
  'inicio con clima elegido': async (p) => p.getByRole('radio', { name: /Lluvia/ }).click(),
  'escribir el relato': async (p) => {
    await p.getByRole('radio', { name: /Lluvia/ }).click()
    await p.getByRole('button', { name: /Escribir/ }).click()
  },
  'grabando': async (p) => {
    await p.evaluate(() => { window.__dictado = 'hola' })
    await p.getByRole('radio', { name: /Lluvia/ }).click()
    await p.getByRole('button', { name: 'Contar mi día por voz' }).click()
    await p.getByText('Micrófono activo').waitFor()
  },
  emociones: async (p) => {
    await p.getByRole('radio', { name: /Soleado/ }).click()
    await p.getByRole('button', { name: /Escribir/ }).click()
    await p.getByRole('textbox').fill('Me reí mucho con mis amigas')
    await p.getByRole('button', { name: 'Listo' }).click()
    await p.getByText('Toca las nubes').waitFor()
  },
  riesgo: async (p) => {
    await p.getByRole('radio', { name: /Tormenta/ }).click()
    await p.getByRole('button', { name: /Escribir/ }).click()
    await p.getByRole('textbox').fill('quiero morir')
    await p.getByRole('button', { name: 'Listo' }).click()
  },
  historial: async (p) => p.getByRole('button', { name: /Historial/ }).click(),
  'lo que sé de ti': async (p) => p.getByRole('button', { name: /Tú/ }).click(),
  'sala: entrada': async (p) => p.getByRole('button', { name: /Sala/ }).click(),
  'sala: dentro': async (p) => {
    await p.getByRole('button', { name: /Sala/ }).click()
    await p.getByRole('button', { name: 'Crear una sala' }).click()
    await p.getByRole('button', { name: /Nublado/ }).click()
  },
}

for (const [nombre, ir] of Object.entries(PANTALLAS)) {
  test(`${nombre}: sin fallas WCAG 2.2 AA, controles ≥44 px y sin scroll horizontal a 320 px`, async ({ page }) => {
    await microfonoFalso(page)
    await page.setViewportSize({ width: 320, height: 720 })
    await page.goto('/')
    await ir(page)
    await page.waitForTimeout(300)

    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    const graves = violations.filter((v) => ['serious', 'critical'].includes(v.impact))
    expect(graves.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])

    const pequenos = await page.$$eval('button, a[href], input[type=checkbox]', (els) => els
      .filter((e) => e.offsetParent !== null)
      .map((e) => {
        const r = (e.closest('label') ?? e).getBoundingClientRect()
        return { t: (e.innerText || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 30), h: Math.round(r.height), w: Math.round(r.width) }
      })
      .filter((r) => r.h < 44 || r.w < 44))
    expect(pequenos).toEqual([])

    const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(desborde).toBeLessThanOrEqual(0)
  })
}

test('el check-in se puede hacer solo con teclado', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('radio', { name: /Nublado/ }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('radio', { name: /Nublado/ })).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('button', { name: /Así está bien/ }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Tu día quedó guardado' })).toBeVisible()
})
