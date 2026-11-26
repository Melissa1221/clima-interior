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
