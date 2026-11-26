// Capturas de todas las pantallas del sistema v3 refinada y del journey nuevo, a 375 × 812, en docs/capturas/v3/.
// Uso: npm run capturas   (usa el Chromium de Playwright: npx playwright install chromium)
// Levanta su propio Vite en el puerto 5182 con el LLM simulado y lo apaga al terminar.
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from '@playwright/test'

const PUERTO = Number(process.env.PUERTO ?? 5182)
const BASE = `http://localhost:${PUERTO}/`
const SALIDA = new URL('../docs/capturas/v3/', import.meta.url).pathname
mkdirSync(SALIDA, { recursive: true })

const hoy = new Date()
const dia = (n) => { const d = new Date(hoy); d.setDate(d.getDate() - n); return d.toLocaleDateString('en-CA') }
const REGISTROS = [
  [9, 'nublado', ['cansancio'], 'Día largo de clases.'], [7, 'lluvia', ['tristeza'], 'Llovió todo el día y no tuve ganas de nada.'],
  [5, 'soleado', ['alegría'], 'Salí con mis amigas al malecón.'], [4, 'niebla', ['confusión'], 'No entendí nada en la clase de IA.'],
  [2, 'tormenta', ['ansiedad'], 'Mañana es el parcial y no me da la cabeza.'], [1, 'lluvia', ['preocupación'], 'Mucho que entregar esta semana.'],
].map(([n, clima, emo, t]) => ({ fecha: dia(n), hora: '21:30', clima, emocion_declarada: emo, emocion_inferida: null, transcripcion: t }))
const PERFIL = (extra = {}) => JSON.stringify({
  primerUso: { completo: true, edad: 'adulto' },
  preferencias: { tema: 'claro' },
  avisos: { ia: true, accesibilidad: true, instalar: true },
  registros: REGISTROS,
  refugios: [{ fecha: dia(2), tecnica: 'respirar', antes: 'tormenta', despues: 'lluvia', segundos: 70 }, { fecha: dia(1), tecnica: 'respirar', antes: 'lluvia', despues: 'nublado', segundos: 80 }],
  ...extra,
})

// Micrófono simulado: dicta una frase al empezar, para capturar «Te escucho» sin micrófono real
const DICTADO = () => {
  class SR {
    start() { setTimeout(() => this.onresult?.({ results: [[{ transcript: 'Hoy me desperté con sueño y el tráfico me quitó energía' }]] }), 300) }
    stop() { setTimeout(() => this.onend?.(), 30) }
    abort() {}
    get processLocally() { return true }
    set processLocally(v) { this._l = v }
  }
  window.SpeechRecognition = SR
  window.webkitSpeechRecognition = SR
}

const servidor = spawn('npx', ['vite', '--port', String(PUERTO), '--strictPort'], { stdio: 'ignore', env: { ...process.env, VITE_LLM_PROVIDER: 'mock' } })
const esperar = async () => { for (let i = 0; i < 80; i++) { try { if ((await fetch(BASE)).ok) return } catch { /* aún no arranca */ } await new Promise((r) => setTimeout(r, 250)) } throw new Error('Vite no arrancó') }

const navegador = await chromium.launch()
const errores = []
async function pagina(perfil = PERFIL()) {
  const ctx = await navegador.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, serviceWorkers: 'block' })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => errores.push(e.message))
  await p.addInitScript(DICTADO)
  if (perfil) await p.addInitScript((v) => { if (!localStorage.getItem('clima-interior:perfil')) localStorage.setItem('clima-interior:perfil', v) }, perfil)
  await p.goto(BASE)
  await p.waitForTimeout(600)
  return p
}
const boton = async (p, nombre) => { await p.getByRole('button', { name: nombre }).first().click(); await p.waitForTimeout(350) }
const radio = async (p, nombre, grupo) => {
  const raiz = grupo ? p.getByRole('radiogroup', { name: grupo }) : p
  await raiz.getByRole('radio', { name: new RegExp(nombre) }).first().click(); await p.waitForTimeout(200)
}
const foto = async (p, nombre) => { await p.waitForTimeout(450); await p.screenshot({ path: `${SALIDA}${nombre}.png` }); console.log('•', nombre) }

try {
  await esperar()
  let p

  // Journey nuevo: bienvenida y menores
  p = await pagina(null)
  await foto(p, '01-bienvenida')
  await boton(p, 'Tengo menos de 18'); await foto(p, '02-menor')
  await p.context().close()

  // Inicio, check-in escrito, emociones, guardado con reflexión y tarjeta T1
  p = await pagina(PERFIL({ avisos: { ia: true, accesibilidad: false, instalar: true }, registros: [], refugios: [] }))
  await foto(p, '03-inicio')
  await radio(p, 'Nublado'); await foto(p, '04-inicio-elegido')
  await boton(p, 'Contar mi día por voz'); await foto(p, '05-antes-de-grabar')
  await boton(p, 'Activar micrófono'); await p.waitForTimeout(900); await foto(p, '06-te-escucho')
  await boton(p, 'Terminar'); await foto(p, '07-corregir')
  await boton(p, 'Listo'); await p.getByText('Toca las nubes').waitFor(); await foto(p, '08-emociones')
  await p.locator('.nube').first().click(); await boton(p, 'Guardar mi día'); await foto(p, '09-reflexion-y-tarjeta')
  await p.context().close()

  // Escribir, trampa y oferta del respiro
  p = await pagina()
  await radio(p, 'Lluvia'); await boton(p, /^Escribir/)
  await p.getByRole('textbox').fill('Mañana es el parcial y seguro que voy a jalar, no me da la cabeza'); await foto(p, '10-escribir')
  await boton(p, 'Listo'); await p.getByText('Toca las nubes').waitFor()
  await boton(p, 'No sé, guardar igual'); await foto(p, '11-trampa')
  await boton(p, 'No es así'); await foto(p, '12-oferta-respiro')
  await boton(p, 'Ahora no'); await foto(p, '13-guardado')
  await p.context().close()

  // Respiro: cuenta, inhala, cómo quedaste y resumen
  p = await pagina()
  await boton(p, 'Necesito un respiro'); await foto(p, '14-respiro-cuenta')
  await p.locator('.respiro__guia').waitFor({ timeout: 5000 }); await p.waitForTimeout(1500); await foto(p, '15-respiro-inhala')
  await boton(p, 'Terminar'); await radio(p, 'Tormenta', 'Cómo estabas antes'); await radio(p, 'Nublado', 'Cómo estás ahora')
  await foto(p, '16-como-quedaste')
  await boton(p, 'Listo'); await foto(p, '17-tu-respiro')
  await p.context().close()

  // Otras técnicas
  p = await pagina()
  await boton(p, 'Necesito un respiro'); await boton(p, 'Elegir otra cosa'); await foto(p, '18-elegir-tecnica')
  await boton(p, /5-4-3-2-1/); await boton(p, 'Listo'); await foto(p, '19-cinco-cuatro')
  await boton(p, 'Elegir otra técnica'); await boton(p, /Partir la tarea/)
  await p.getByLabel('¿Qué tienes que hacer?').fill('Estudiar para el parcial de IA')
  for (const paso of ['Leer la primera página', 'Hacer el resumen del tema 3']) { await p.locator('#tarea-paso').fill(paso); await boton(p, 'Agregar') }
  await p.getByRole('checkbox').first().check(); await foto(p, '20-partir-tarea')
  await boton(p, 'Elegir otra técnica'); await boton(p, /alguien que quieres/); await foto(p, '21-amiga')
  await p.context().close()

  // Crisis (botón y detector)
  p = await pagina()
  await boton(p, /Ayuda ya/); await foto(p, '22-crisis-boton')
  await p.context().close()
  p = await pagina()
  await radio(p, 'Tormenta'); await boton(p, /^Escribir/)
  await p.getByRole('textbox').fill('No sé si quiero seguir viviendo'); await boton(p, 'Listo'); await foto(p, '23-crisis-detector')
  await p.context().close()

  // Panel Aa, Salir por hoy
  p = await pagina()
  await boton(p, /Accesibilidad: texto/); await foto(p, '24-panel-aa')
  await p.keyboard.press('Escape'); await radio(p, 'Lluvia'); await boton(p, /^Escribir/); await boton(p, 'Salir por hoy'); await foto(p, '25-listo-por-hoy')
  await p.context().close()

  // Historial, detalle, vacío
  p = await pagina()
  await boton(p, 'Historial'); await foto(p, '26-historial')
  await p.locator('.calendario button').last().click(); await foto(p, '27-detalle-dia')
  await p.context().close()
  p = await pagina(PERFIL({ registros: [], refugios: [] }))
  await boton(p, 'Historial'); await foto(p, '28-historial-vacio')
  await p.context().close()

  // Perfil y ajustes
  p = await pagina()
  await boton(p, 'Perfil'); await foto(p, '29-perfil')
  await boton(p, /Lo que sabe de ti/); await foto(p, '30-lo-que-sabe')
  await boton(p, 'Volver'); await boton(p, /^Privacidad/); await foto(p, '31-privacidad')
  await boton(p, 'Volver'); await boton(p, /^Accesibilidad Movimiento/); await foto(p, '32-accesibilidad')
  await boton(p, 'Volver'); await boton(p, /Mis datos/); await foto(p, '33-mis-datos')
  await boton(p, /Eliminar todos mis datos/); await p.getByLabel('Escribe BORRAR para confirmar').fill('BORRAR'); await foto(p, '34-eliminar')
  await p.context().close()

  // Sala
  p = await pagina()
  await boton(p, 'Sala'); await foto(p, '35-sala')
  await boton(p, 'Crear una sala'); await boton(p, 'Permitir compartir mi clima'); await radio(p, 'Nublado', 'Clima que compartes'); await foto(p, '36-sala-activa')
  await p.context().close()

  // Noche
  p = await pagina(PERFIL({ preferencias: { tema: 'noche' } }))
  await foto(p, '37-inicio-noche')
  await boton(p, 'Historial'); await foto(p, '38-historial-noche')
  await boton(p, /Ayuda ya/); await foto(p, '39-crisis-noche')
  await p.context().close()

  if (errores.length) throw new Error(`Errores en la página: ${errores.join(' | ')}`)
} finally {
  await navegador.close()
  servidor.kill()
}
