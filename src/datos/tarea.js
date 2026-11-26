// Partir la tarea (Refugio): una lista de pasos pequeños para tachar. Vive en este dispositivo hasta que la
// persona la borre, y «Eliminar todo» la borra con el resto (todas las claves clima-interior:*).
const CLAVE = 'clima-interior:tarea'
const VACIA = { que: '', pasos: [] }

export function leerTarea() {
  try {
    const t = JSON.parse(localStorage.getItem(CLAVE))
    if (!t || typeof t !== 'object') return { ...VACIA }
    return {
      que: typeof t.que === 'string' ? t.que : '',
      pasos: Array.isArray(t.pasos) ? t.pasos.filter((p) => p && typeof p.texto === 'string').map((p) => ({ texto: p.texto, hecho: Boolean(p.hecho) })) : [],
    }
  } catch {
    return { ...VACIA }
  }
}

function guardar(tarea) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(tarea))
  } catch {
    // sin almacenamiento la lista sigue en pantalla, solo que no se recuerda
  }
  return tarea
}

export const cambiarQue = (tarea, que) => guardar({ ...tarea, que })
export function agregarPaso(tarea, texto) {
  const limpio = texto.trim().slice(0, 140)
  return limpio ? guardar({ ...tarea, pasos: [...tarea.pasos, { texto: limpio, hecho: false }] }) : tarea
}
export const alternarPaso = (tarea, i) => guardar({ ...tarea, pasos: tarea.pasos.map((p, j) => (j === i ? { ...p, hecho: !p.hecho } : p)) })
export const quitarPaso = (tarea, i) => guardar({ ...tarea, pasos: tarea.pasos.filter((_, j) => j !== i) })

export function borrarTarea() {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    // nada que borrar
  }
  return { ...VACIA }
}
