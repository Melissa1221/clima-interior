// Historial y detalle del día.
import { test, expect } from './base.js'

test('dos registros el mismo día cuentan como un día y el detalle muestra los dos (A3)', async ({ page }) => {
  await page.goto('/')
  for (const clima of ['Lluvia', 'Soleado']) {
    await page.getByRole('radio', { name: new RegExp(clima) }).click()
    await page.getByRole('button', { name: 'Guardar así' }).click()
    const ahoraNo = page.getByRole('button', { name: 'Ahora no' })
    if (await ahoraNo.isVisible()) await ahoraNo.click()
    await page.getByRole('button', { name: 'Hasta mañana' }).click()
  }
  await page.getByRole('button', { name: /Historial/ }).click()
  await expect(page.getByText('1 día registrado')).toBeVisible()
  const dia = page.locator('.calendario button')
  await expect(dia).toHaveCount(1)
  await expect(dia).toHaveAttribute('aria-label', /despejado/)
  await expect(dia).toHaveAttribute('aria-label', /2 registros/)
  await dia.click()
  await expect(page.getByText('2 registros este día')).toBeVisible()
  await expect(page.locator('.detalle__registro')).toHaveCount(2)
  await expect(page.locator('.detalle__registro').first()).toContainText('Lluvia')
  await expect(page.locator('.detalle__registro').last()).toContainText('Soleado')
})

test('el historial de ejemplo no mezcla tus respiros reales (M1)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('clima-interior:perfil', JSON.stringify({
    primerUso: { completo: true, edad: 'adulto' }, preferencias: { tema: 'claro' },
    registros: [{ fecha: new Date().toLocaleDateString('en-CA'), hora: '10:00', clima: 'nublado', emocion_declarada: null }],
    refugios: [{ fecha: new Date().toLocaleDateString('en-CA'), tecnica: 'respirar', antes: 'lluvia', despues: 'nublado', segundos: 60 }],
  })))
  await page.goto('/')
  await page.getByRole('button', { name: /Historial/ }).click()
  await expect(page.getByRole('heading', { name: 'Lo que te ayudó' })).toBeVisible()
  await page.getByRole('button', { name: /ejemplo/i }).click()
  await expect(page.getByText(/datos simulados/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Lo que te ayudó' })).toHaveCount(0)
})

test('los días del calendario miden 44 px o más a 375 px (B3)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await page.getByRole('button', { name: /Historial/ }).click()
  await page.getByRole('button', { name: 'Mirar 30 días de ejemplo' }).click()
  const tamanos = await page.$$eval('.calendario .dia__cielo', (els) => els.map((e) => Math.min(e.getBoundingClientRect().width, e.getBoundingClientRect().height)))
  expect(Math.min(...tamanos)).toBeGreaterThanOrEqual(44)
  const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(desborde).toBeLessThanOrEqual(0)
})
