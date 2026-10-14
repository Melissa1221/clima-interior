import { validarRespuesta, RESPALDO_LOCAL, EMOCIONES_VALIDAS } from './contrato.js'
import * as proveedores from './proveedores.js'
import { emocionesPorReglas, reflexionPorReglas } from './proveedores.js'

// RNF-19 pide ≤10 s en p95; se deja margen para que Gemini pruebe dos modelos
const TIEMPO_MAX_MS = 14000

export function proveedorActivo() {
  return proveedores[import.meta.env.VITE_LLM_PROVIDER] || proveedores.mock
}

// Los modelos devuelven "Cansancio", " calma " o emociones fuera de la lista.
// Se pasan a minúsculas y se descartan las que no están en la lista; la reflexión se conserva.
export function normalizar(r) {
  if (!r || typeof r !== 'object' || !Array.isArray(r.emociones)) return r
  const vistas = new Set()
  const emociones = r.emociones
    .filter((e) => e && typeof e.nombre === 'string')
    .map((e) => ({ ...e, nombre: e.nombre.toLowerCase().trim() }))
    .filter((e) => EMOCIONES_VALIDAS.includes(e.nombre) && !vistas.has(e.nombre) && vistas.add(e.nombre))
    .slice(0, 4)
  const reflexion = typeof r.reflexion === 'string' ? r.reflexion.trim() : r.reflexion
  return { ...r, emociones, reflexion }
}

// Punto único de entrada. Si el proveedor falla, tarda o responde fuera del esquema,
// se devuelve la reflexión local y la app sigue funcionando (RNF-23).
export async function proponerEmociones(texto, { proveedor = proveedorActivo(), tiempoMax = TIEMPO_MAX_MS } = {}) {
  let reloj
  try {
    const r = await Promise.race([
      proveedor.proponerEmociones(texto),
      new Promise((_, rej) => { reloj = setTimeout(() => rej(new Error('tiempo agotado')), tiempoMax) }),
    ])
    const normal = normalizar(r)
    if (validarRespuesta(normal) && normal.reflexion) return { ...normal, proveedor: proveedor.nombre }
    console.warn(`LLM ${proveedor.nombre}: respuesta fuera del esquema`, r)
  } catch (err) {
    console.warn(`LLM ${proveedor.nombre}: ${err.message}`)
  } finally {
    clearTimeout(reloj)
  }
  // Sin IA igual se proponen emociones por palabras clave, para que el usuario tenga qué elegir
  const emociones = emocionesPorReglas(texto)
  return { ...RESPALDO_LOCAL, emociones, reflexion: reflexionPorReglas(emociones) }
}
