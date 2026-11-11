// Ayudas de accesibilidad que no dependen de React, para poder probarlas (RF-32 a RF-36).

// El sistema operativo pide menos movimiento: la app arranca con el paisaje estático (S05)
export function sistemaPideMenosMovimiento() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Modo predecible: respuestas de 80 palabras como máximo (S46)
export function limitarPalabras(texto, max = 80) {
  const palabras = texto.trim().split(/\s+/)
  return palabras.length <= max ? texto.trim() : `${palabras.slice(0, max).join(' ')}…`
}

// Todo sonido tiene aviso visual; los errores y alertas además vibran si la persona lo dejó activo (RF-36, RNF-08)
export function vibrar(preferencias, patron = [120, 60, 120]) {
  if (!preferencias?.vibrar) return false
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false
  return navigator.vibrate(patron)
}

// Control por voz (S46, S51): una orden dicha al final del dictado. Devuelve la orden y el texto sin ella.
const ORDENES = [['salir por hoy', 'salir'], ['terminar', 'terminar'], ['pausar', 'pausar'], ['ayuda', 'ayuda']]
const sinTildes = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function detectarOrden(texto) {
  const limpio = sinTildes(texto).replace(/[\s.,;:!?¡¿«»"]+$/g, '')
  for (const [frase, orden] of ORDENES) {
    if (limpio === frase || limpio.endsWith(` ${frase}`)) {
      const sobra = texto.replace(/[\s.,;:!?¡¿«»"]+$/g, '')
      return { orden, texto: sobra.slice(0, sobra.length - frase.length).replace(/[\s,;:]+$/g, '') }
    }
  }
  return { orden: null, texto }
}

// Sonificación breve del clima (S46): una nota corta por clima, nunca intensa. Sin WebAudio no hace nada.
const NOTAS = { soleado: [523, 659], nublado: [392, 349], lluvia: [330, 294], tormenta: [196], niebla: [262], neutral: [262, 330] }

export function sonificarClima(clima, preferencias) {
  if (preferencias?.modoNeutral && clima === 'tormenta') clima = 'neutral' // sin sonidos intensos (RF-34)
  const Ctx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
  if (!Ctx || !NOTAS[clima]) return false
  const ctx = new Ctx()
  NOTAS[clima].forEach((hz, i) => {
    const osc = ctx.createOscillator()
    const vol = ctx.createGain()
    const t = ctx.currentTime + i * 0.28
    osc.frequency.value = hz
    vol.gain.setValueAtTime(0.0001, t)
    vol.gain.exponentialRampToValueAtTime(0.06, t + 0.05)
    vol.gain.exponentialRampToValueAtTime(0.0001, t + 0.26)
    osc.connect(vol).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.3)
  })
  setTimeout(() => ctx.close?.(), NOTAS[clima].length * 300 + 200)
  return true
}
