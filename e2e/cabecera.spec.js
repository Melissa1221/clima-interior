// A1: los títulos de la cabecera se leen completos a 375 y 320 px (antes: «Volver al pr…», «Accesibil…»).
import { test, expect } from './base.js'

const tecnicas = async (p) => {
  await p.getByRole('button', { name: 'Necesito un respiro' }).click()
  await p.getByRole('button', { name: 'Elegir otra cosa' }).click()
}
const perfil = (p, fila) => async () => {
  await p.getByRole('button', { name: 'Perfil', exact: true }).click()
  await p.getByRole('button', { name: fila }).click()
}
const PANTALLAS = {
  'Volver al presente': async (p) => { await tecnicas(p); await p.getByRole('button', { name: /5-4-3-2-1/ }).click() },
  'Partir la tarea': async (p) => { await tecnicas(p); await p.getByRole('button', { name: /Partir la tarea/ }).click() },
  'Lo que sabe de ti': (p) => perfil(p, /Lo que sabe de ti/)(),
  Accesibilidad: (p) => perfil(p, /^Accesibilidad Movimiento/)(),
  'Eliminar mis datos': async (p) => { await perfil(p, /Mis datos/)(); await p.getByRole('button', { name: /Eliminar todos mis datos/ }).click() },
}

for (const ancho of [375, 320]) {
  for (const [titulo, ir] of Object.entries(PANTALLAS)) {
    test(`«${titulo}» se lee completo a ${ancho} px`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: 740 })
      await page.goto('/')
      await ir(page)
      const t = page.locator('.cabecera__titulo')
      await expect(t).toBeVisible()
      await expect(t).toContainText(titulo)
      const cortado = await t.evaluate((el) => el.scrollWidth > el.clientWidth + 1)
      expect(cortado).toBe(false)
    })
  }
}
