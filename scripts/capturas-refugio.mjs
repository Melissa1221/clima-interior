// Capturas del Refugio y de las trampas de pensamiento, a 375×812, en docs/capturas/refugio/.
// Uso: npm run capturas:refugio   (usa el Chromium de Playwright: npx playwright install chromium)
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from '@playwright/test'

const PUERTO = 5197
const BASE = `http://localhost:${PUERTO}/`
const SALIDA = new URL('../docs/capturas/refugio/', import.meta.url).pathname
mkdirSync(SALIDA, { recursive: true })

const hoy = new Date().toLocaleDateString('en-CA')
const PERFIL = JSON.stringify({
  primerUso: { completo: true, edad: 'adulto' },
  registros: [{ fecha: '2026-11-20', hora: '21:30', clima: 'lluvia', emocion_declarada: ['ansiedad'], emocion_inferida: null, transcripcion: null }],
  refugios: [
    { fecha: '2026-11-18', tecnica: 'respirar', antes: 'tormenta', despues: 'lluvia', segundos: 75 },
    { fecha: '2026-11-19', tecnica: 'respirar', antes: 'lluvia', despues: 'nublado', segundos: 80 },
    { fecha: '2026-11-20', tecnica: 'tarea', antes: 'niebla', despues: 'nublado', segundos: 140 },
    { fecha: hoy, tecnica: 'tierra', antes: 'lluvia', despues: 'lluvia', segundos: 120 },
  ],
})

const servidor = spawn('npx', ['vite', '--port', String(PUERTO), '--strictPort'], {
  stdio: 'ignore', env: { ...process.env, VITE_LLM_PROVIDER: 'mock' },
})
const esperar = async () => { for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE)).ok) return } catch { /* aún no arranca */ } await new Promise((r) => setTimeout(r, 250)) } throw new Error('Vite no arrancó') }

const navegador = await chromium.launch()
const errores = []

async function pagina(perfil = PERFIL) {
  const ctx = await navegador.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, serviceWorkers: 'block' })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => errores.push(e.message))
  await p.addInitScript((v) => { if (!localStorage.getItem('clima-interior:perfil')) localStorage.setItem('clima-interior:perfil', v) }, perfil)
  await p.goto(BASE)
  await p.waitForTimeout(500)
  return p
}
const boton = async (p, nombre) => { await p.getByRole('button', { name: nombre }).first().click(); await p.waitForTimeout(350) }
const radio = async (p, nombre) => { await p.getByRole('radio', { name: new RegExp(nombre) }).first().click(); await p.waitForTimeout(250) }
const foto = async (p, nombre, opciones = {}) => { await p.waitForTimeout(450); await p.screenshot({ path: `${SALIDA}${nombre}.png`, ...opciones }); console.log('•', nombre) }

try {
  await esperar()

  // Inicio con el botón y el Refugio paso a paso
  let p = await pagina()
  await foto(p, '01-inicio')
  await boton(p, 'Necesito un respiro'); await radio(p, 'Lluvia'); await foto(p, '02-antes')
  await boton(p, 'Continuar'); await foto(p, '03-elegir')
  await boton(p, /Respirar con la lluvia/); await boton(p, 'Empezar'); await p.waitForTimeout(2600); await foto(p, '04-respirar')
  await boton(p, 'Terminar'); await radio(p, 'Nublado'); await boton(p, 'Guardar'); await foto(p, '05-antes-despues')
  await p.context().close()

  p = await pagina()
  await boton(p, 'Necesito un respiro'); await radio(p, 'Tormenta'); await boton(p, 'Continuar')
  await boton(p, /5-4-3-2-1/); await boton(p, 'Listo'); await foto(p, '06-cinco-cuatro')
  await p.context().close()

  p = await pagina()
  await boton(p, 'Necesito un respiro'); await radio(p, 'Niebla'); await boton(p, 'Continuar')
  await boton(p, /Partir la tarea/)
  await p.getByLabel('¿Qué tienes que hacer?').fill('Estudiar para el parcial de IA')
  for (const paso of ['Releer los apuntes de búsqueda A*', 'Hacer 2 ejercicios de la PC', 'Preguntarle a Vale la parte 3']) {
    await p.locator('#tarea-paso').fill(paso); await boton(p, 'Agregar')
  }
  await p.getByRole('checkbox').first().check()
  await foto(p, '07-partir-tarea')
  await p.context().close()

  // Trampa de pensamiento tras la reflexión
  p = await pagina()
  await radio(p, 'Lluvia'); await boton(p, /Escribir/)
  await p.getByRole('textbox').fill('Mañana es el parcial y seguro que voy a jalar, no me da la cabeza')
  await boton(p, 'Listo'); await p.waitForTimeout(500)
  await p.locator('.nube').first().click(); await boton(p, 'Guardar mi día')
  await foto(p, '08-trampa')
  await boton(p, 'Sí, puede ser'); await foto(p, '09-trampa-pregunta')
  await boton(p, 'Seguir'); await foto(p, '10-oferta-refugio')
  await p.context().close()

  // Crisis: gana a las trampas y muestra Bienestar UNI
  p = await pagina()
  await radio(p, 'Tormenta'); await boton(p, /Escribir/)
  await p.getByRole('textbox').fill('tuve un examen horrible y no sé si quiero seguir viviendo')
  await boton(p, 'Listo'); await foto(p, '11-crisis-bienestar')
  await p.context().close()

  // Lo que te ayudó, en el historial
  p = await pagina()
  await boton(p, 'Historial'); await p.waitForTimeout(400)
  await p.getByRole('heading', { name: 'Lo que te ayudó' }).scrollIntoViewIfNeeded()
  await foto(p, '12-lo-que-te-ayudo')
  await p.context().close()

  if (errores.length) throw new Error(`Errores en la página: ${errores.join(' | ')}`)
} finally {
  await navegador.close()
  servidor.kill()
}
