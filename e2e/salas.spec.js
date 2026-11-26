// Salas de clima compartido entre dispositivos (HU-12, HU-13), con el relé WebSocket real.
import { test, expect, primerUsoHecho } from './base.js'

// El permiso «compartir mi clima» arranca apagado (S03): la primera vez se pide dentro de la sala
async function compartir(page, clima) {
  await page.getByRole('button', { name: 'Permitir compartir mi clima' }).click()
  await page.getByRole('radiogroup', { name: 'Clima que compartes' }).getByRole('radio', { name: clima }).click()
}

// Cada "dispositivo" es un contexto aislado: no comparte almacenamiento con los demás
async function dispositivo(browser, mensajes) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 860 } })
  await primerUsoHecho(ctx)
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
  await ana.getByRole('button', { name: 'Sala', exact: true }).click()
  await ana.getByRole('button', { name: 'Crear una sala' }).click()
  await compartir(ana, /Lluvia/)
  const codigo = (await ana.locator('.codigo code').innerText()).trim().replace(/\s+/g, '-')
  expect(codigo.replace(/-/g, '')).toHaveLength(8) // corto para dictarlo o copiarlo (A6)

  // Bea entra por el enlace de invitación; Ceci escribe el código a mano en minúsculas
  const bea = await dispositivo(browser, mensajes)
  await bea.goto(`/#sala=${codigo}`)
  await bea.getByRole('button', { name: 'Unirme' }).click()
  await compartir(bea, /Soleado/)
  const ceci = await dispositivo(browser, mensajes)
  await ceci.getByRole('button', { name: 'Sala', exact: true }).click()
  await ceci.getByLabel(/código/).fill(codigo.toLowerCase().replace(/-/g, ' '))
  await ceci.getByRole('button', { name: 'Unirme' }).click()
  await compartir(ceci, /Tormenta/)

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
  await page.getByRole('button', { name: 'Guardar así' }).click()
  await page.getByRole('button', { name: 'Hasta mañana' }).click()
  await page.getByRole('button', { name: 'Sala', exact: true }).click()
  await page.getByRole('button', { name: 'Crear una sala' }).click()
  await expect(page.getByText('Compartir tu clima está apagado en Privacidad')).toBeVisible()
  await page.getByRole('button', { name: 'Permitir compartir mi clima' }).click()
  await page.getByRole('button', { name: /Compartir mi clima de hoy \(Niebla\)/ }).click()
  await expect(page.locator('.mi-clima')).toContainText('Compartes')
  await expect(page.locator('.mi-clima')).toContainText('Niebla')
})

test('código incompleto muestra un error que explica qué hacer', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Sala', exact: true }).click()
  await page.getByLabel(/código/).fill('K7QF-29')
  await page.getByRole('button', { name: 'Unirme' }).click()
  await expect(page.getByRole('alert')).toContainText('Son 8 letras y números')
})

test('una sala que no existe o caducó no deja entrar (RF-26)', async ({ page }) => {
  await page.goto('/#sala=AAAA-AAAA')
  await page.getByRole('button', { name: 'Unirme' }).click()
  await expect(page.getByText('Esa sala ya no existe o caducó.')).toBeVisible()
})

test('el código de la sala es corto y se copia con un toque (A6)', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await page.getByRole('button', { name: 'Sala', exact: true }).click()
  await page.getByRole('button', { name: 'Crear una sala' }).click()
  const codigo = (await page.locator('.codigo__valor').innerText()).trim()
  expect(codigo).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}$/)
  await page.getByRole('button', { name: /^Copiar el código/ }).click()
  await expect(page.getByText('Código copiado')).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(codigo)
})

test('«Salir» de una sala vuelve a la entrada de Salas, no a Inicio (B9)', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Sala', exact: true }).click()
  await page.getByRole('button', { name: 'Crear una sala' }).click()
  await expect(page.locator('.codigo__valor')).toBeVisible()
  await page.getByRole('button', { name: 'Salir', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Crear una sala' })).toBeVisible()
  await expect(page).toHaveTitle('Sala · Clima Interior')
  expect(new URL(page.url()).hash).toBe('')
})
