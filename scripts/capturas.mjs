// Regenera las capturas de docs/capturas recorriendo la app en un navegador real.
// Uso: npm run capturas   (necesita Chrome o Chromium; ruta en CHROME_PATH si no está en el PATH)
import { spawn, execSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const PUERTO = 5199
const BASE = `http://localhost:${PUERTO}/`
const SALIDA = new URL('../docs/capturas/', import.meta.url).pathname
mkdirSync(SALIDA, { recursive: true })

const chrome = process.env.CHROME_PATH
  || ['google-chrome', 'chromium', 'chromium-browser'].map((c) => { try { return execSync(`which ${c}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim() } catch { return '' } }).find(Boolean)
if (!chrome) throw new Error('No encuentro Chrome o Chromium: define CHROME_PATH')

// Perfil de ejemplo (dos registros) con el primer uso ya hecho
const PERFIL = (extra = {}) => JSON.stringify({
  primerUso: { completo: true, edad: 'adulto' },
  registros: [
    { fecha: '2026-10-06', hora: '21:30', clima: 'nublado', emocion_declarada: ['cansancio'], emocion_inferida: ['cansancio', 'frustración'], transcripcion: 'Día largo' },
    { fecha: '2026-10-07', hora: '21:10', clima: 'lluvia', emocion_declarada: ['tristeza', 'calma'], emocion_inferida: ['tristeza'], transcripcion: 'Llovió todo el día' },
  ],
  ...extra,
})

// Dictado simulado: emite una frase al empezar, para capturar la grabación sin micrófono
const DICTADO = () => {
  class SR {
    start() { setTimeout(() => this.onresult?.({ results: [[{ transcript: 'Hoy me desperté con sueño y el tráfico me quitó energía' }]] }), 400) }
    stop() { setTimeout(() => this.onend?.(), 30) }
    abort() {}
  }
  SR.prototype.processLocally = false
  window.SpeechRecognition = window.webkitSpeechRecognition = SR
}

const servidor = spawn('npx', ['vite', '--port', String(PUERTO), '--strictPort'], { stdio: 'ignore' })
const esperar = async () => { for (let i = 0; i < 50; i++) { try { if ((await fetch(BASE)).ok) return } catch { /* aún no arranca */ } await new Promise((r) => setTimeout(r, 200)) } throw new Error('Vite no arrancó') }

const navegador = await chromium.launch({ executablePath: chrome, args: ['--no-sandbox'] })
const errores = []

async function pagina(perfil) {
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => errores.push(e.message))
  await p.addInitScript(DICTADO)
  if (perfil) await p.addInitScript((v) => { if (!localStorage.getItem('clima-interior:perfil')) localStorage.setItem('clima-interior:perfil', v) }, perfil)
  await p.goto(BASE)
  await p.waitForTimeout(500)
  return p
}
const boton = async (p, nombre) => { await p.getByRole('button', { name: nombre }).first().click(); await p.waitForTimeout(350) }
const clima = async (p, nombre) => { await p.getByRole('radio', { name: new RegExp(nombre) }).click(); await p.waitForTimeout(250) }
const foto = async (p, nombre) => { await p.waitForTimeout(450); await p.screenshot({ path: `${SALIDA}${nombre}.png` }); console.log('•', nombre) }

try {
  await esperar()

  // Primer uso, desde cero
  let p = await pagina()
  await foto(p, 'primer-uso')
  await boton(p, 'Empezar'); await p.getByRole('radio', { name: /18 años o más/ }).click(); await foto(p, 'edad')
  await boton(p, 'Continuar'); await foto(p, 'permisos')
  await boton(p, 'Guardar mis decisiones'); await foto(p, 'limites')
  await boton(p, 'Entendido'); await foto(p, 'ajustes-iniciales')
  await p.context().close()

  // Check-in
  p = await pagina(PERFIL())
  await foto(p, 'inicio')
  await boton(p, 'Ayuda contextual'); await foto(p, 'ayuda'); await boton(p, 'Entendido')
  await clima(p, 'Nublado'); await boton(p, 'Contar mi día por voz'); await foto(p, 'antes-grabar')
  await boton(p, 'Empezar a grabar'); await p.waitForTimeout(2200); await foto(p, 'grabando')
  await boton(p, 'A texto'); await foto(p, 'revision')
  await boton(p, 'Listo'); await p.waitForTimeout(600); await foto(p, 'emociones')
  await p.locator('.nube').first().click(); await boton(p, 'Guardar mi día'); await foto(p, 'guardado')
  await boton(p, 'Hasta mañana'); await boton(p, 'Historial'); await foto(p, 'semana')
  await p.context().close()

  // Riesgo
  p = await pagina(PERFIL())
  await clima(p, 'Lluvia'); await boton(p, 'Escribir')
  await p.getByLabel(/Lo que entendí/).fill('no quiero seguir'); await boton(p, 'Listo'); await foto(p, 'riesgo')
  await p.context().close()

  // Perfil, privacidad y datos
  p = await pagina(PERFIL())
  await boton(p, 'Perfil'); await foto(p, 'perfil')
  await boton(p, 'Privacidad'); await foto(p, 'privacidad')
  await p.getByText('Exportar resumen').click(); await foto(p, 'exportar')
  await p.getByLabel('Desde').fill('2026-08-01'); await p.getByLabel('Hasta').fill('2026-08-05'); await boton(p, 'Generar PDF'); await foto(p, 'sin-registros')
  await boton(p, 'Salir por hoy'); await boton(p, 'Perfil'); await boton(p, 'Privacidad')
  await p.getByText('Eliminar todos mis datos').click(); await p.getByLabel(/Escribe BORRAR/).fill('BORRAR'); await foto(p, 'eliminar')
  await p.context().close()

  // Accesibilidad
  p = await pagina(PERFIL())
  await boton(p, 'Perfil'); await boton(p, 'Accesibilidad'); await foto(p, 'accesibilidad')
  await p.context().close()

  const base = JSON.parse(PERFIL())
  p = await pagina(PERFIL({ preferencias: { ...base.preferencias, modoPredecible: true } }))
  await clima(p, 'Nublado'); await boton(p, 'Continuar'); await foto(p, 'predecible')
  await p.context().close()

  p = await pagina(PERFIL({ preferencias: { modoNeutral: true } }))
  await clima(p, 'Tormenta'); await boton(p, 'Escribir')
  await p.getByLabel(/Lo que entendí/).fill('Hoy fue un día muy pesado y tuve mucha tensión'); await boton(p, 'Listo'); await p.waitForTimeout(600); await foto(p, 'neutral')
  await p.context().close()

  // Sala de clima compartido (S34-S39): sin servidor, la sala conecta pestañas del mismo navegador
  p = await pagina(PERFIL())
  await boton(p, 'Sala'); await foto(p, 'sala-entrar')
  await boton(p, 'Crear una sala'); await boton(p, 'Permitir compartir mi clima')
  await clima(p, 'Nublado').catch(() => boton(p, /Nublado/)); await foto(p, 'sala')
  await p.context().close()

  if (errores.length) { console.error('Errores de la página:\n' + errores.join('\n')); process.exitCode = 1 }
} finally {
  await navegador.close()
  servidor.kill()
}
