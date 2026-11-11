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
