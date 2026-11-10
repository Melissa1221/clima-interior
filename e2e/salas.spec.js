// Salas de clima compartido entre dispositivos (HU-12, HU-13), con el relé WebSocket real.
import { test, expect } from '@playwright/test'

// Cada "dispositivo" es un contexto aislado: no comparte almacenamiento con los demás
async function dispositivo(browser, mensajes) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 860 } })
  const page = await ctx.newPage()
  page.on('websocket', (ws) => {
    if (!ws.url().includes(':8790')) return // solo el relé de salas (Vite también abre un websocket)
    ws.on('framesent', (f) => mensajes.push(f.payload))
    ws.on('framereceived', (f) => mensajes.push(f.payload))
  })
  await page.goto('/')
  return page
}

test('crear, invitar, compartir, retirar, sacar y cerrar una sala entre tres dispositivos', async ({ browser }) => {
  const mensajes = []
  const ana = await dispositivo(browser, mensajes)
  await ana.getByRole('button', { name: /Sala/ }).click()
  await ana.getByRole('button', { name: 'Crear una sala' }).click()
  await ana.getByRole('button', { name: /Lluvia/ }).click()
  const codigo = await ana.locator('.codigo code').innerText()
  expect(codigo.replace(/-/g, '')).toHaveLength(26) // RNF-14: 128 bits

  // Bea entra por el enlace de invitación; Ceci escribe el código a mano en minúsculas
  const bea = await dispositivo(browser, mensajes)
  await bea.goto(`/#sala=${codigo}`)
  await bea.getByRole('button', { name: 'Unirme' }).click()
  await bea.getByRole('button', { name: /Soleado/ }).click()
  const ceci = await dispositivo(browser, mensajes)
  await ceci.getByRole('button', { name: /Sala/ }).click()
  await ceci.getByLabel(/código/).fill(codigo.toLowerCase().replace(/-/g, ' '))
  await ceci.getByRole('button', { name: 'Unirme' }).click()
  await ceci.getByRole('button', { name: /Tormenta/ }).click()

  // HU-12 Esc. 1: todas ven el clima colectivo y tres seudónimos, sin nombres ni textos
  for (const p of [ana, bea, ceci]) {
    await expect(p.getByText('Clima de la sala · 3 personas')).toBeVisible()
    await expect(p.locator('.participantes li')).toHaveCount(3)
    await expect(p.locator('.participantes')).toContainText(/Nube \d{3}/)
  }
  await expect(bea.locator('.participantes')).toContainText('creó la sala')

  // HU-12 Esc. 2: retirar quita el clima de inmediato en los demás
  await bea.getByRole('button', { name: 'Retirar mi clima' }).click()
  await expect(ana.locator('.participantes')).toContainText('sin compartir')

  // HU-13: un invitado no ve los controles de moderación; la creadora saca y cierra
  await expect(bea.getByRole('button', { name: 'Sacar' })).toHaveCount(0)
  await expect(bea.getByRole('button', { name: 'Cerrar sala' })).toHaveCount(0)
  await ana.getByRole('button', { name: 'Sacar' }).last().click()
  await expect(ceci.getByText('La persona que creó la sala te sacó')).toBeVisible()
  await expect(ana.getByText('Clima de la sala · 2 personas')).toBeVisible()
  ana.once('dialog', (d) => d.accept()) // pide confirmación antes de cerrar para todos
  await ana.getByRole('button', { name: 'Cerrar sala' }).click()
  await expect(bea.getByText('La sala se cerró')).toBeVisible()

  // RNF-13: por el WebSocket solo viajaron números (y el tipo de mensaje de una lista cerrada)
  expect(mensajes.length).toBeGreaterThan(5)
  for (const txt of mensajes) {
    const m = JSON.parse(txt)
    for (const [k, v] of Object.entries(m)) {
      if (k === 'tipo') expect(['hola', 'clima', 'retirar', 'adios', 'expulsar', 'cerrar']).toContain(v)
      else expect(typeof v, `${k} en ${txt}`).toBe('number')
    }
  }
})

test('quien ya registró su día comparte su clima con un toque', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('radio', { name: /Niebla/ }).click()
  await page.getByRole('button', { name: /Así está bien/ }).click()
  await page.getByRole('button', { name: 'Hasta mañana' }).click()
  await page.getByRole('button', { name: /Sala/ }).click()
  await page.getByRole('button', { name: 'Crear una sala' }).click()
  await page.getByRole('button', { name: /Compartir mi clima de hoy \(.*Niebla\)/ }).click()
  await expect(page.getByText('Compartes:')).toContainText('Niebla')
})

test('código incompleto muestra un error que explica qué hacer', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Sala/ }).click()
  await page.getByLabel(/código/).fill('K7QF-29XM')
  await page.getByRole('button', { name: 'Unirme' }).click()
  await expect(page.getByRole('alert')).toContainText('Son 26 letras y números')
})

test('una sala que no existe o caducó no deja entrar (RF-26)', async ({ page }) => {
  await page.goto('/#sala=AAAA-AAAA-AAAA-AAAA-AAAA-AAAA-AA')
  await page.getByRole('button', { name: 'Unirme' }).click()
  await expect(page.getByText('Esa sala ya no existe o caducó.')).toBeVisible()
})
