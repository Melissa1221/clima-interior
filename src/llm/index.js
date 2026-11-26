import { validarRespuesta, RESPALDO_LOCAL, EMOCIONES_VALIDAS } from './contrato.js'
import * as proveedores from './proveedores.js'
import { emocionesPorReglas, esLocal, reflexionPorReglas, urlOllama } from './proveedores.js'
import { detectarTrampas, estaEnElRelato, TIPOS_TRAMPA } from '../datos/trampas.js'

// RNF-19 pide ≤10 s en p95; se deja margen para que Gemini pruebe dos modelos
const TIEMPO_MAX_MS = 14000

export function proveedorActivo() {
  return proveedores[import.meta.env.VITE_LLM_PROVIDER] || proveedores.mock
}

// «Usar IA en internet» apagado: los proveedores en la nube se reemplazan por un Ollama en este equipo, solo si se
// configuró y su URL es localhost/127.0.0.1; si no, van directo a las reglas, sin intentar ninguna conexión (M9).
// Cada proveedor declara `enInternet`; uno que no lo declare se trata como si saliera a internet.
export function proveedorSegunPermiso(iaEnInternet, activo = proveedorActivo(), env = import.meta.env) {
  if (iaEnInternet || activo.enInternet === false) return activo
  const url = urlOllama(env)
  return url && esLocal(url) ? proveedores.ollama : proveedores.reglas
}

// Los modelos devuelven "Cansancio", " calma " o emociones fuera de la lista.
// Se pasan a minúsculas y se descartan las que no están en la lista; la reflexión se conserva.
// Las trampas fuera de la lista, repetidas o con una frase que la persona no dijo se descartan (máx. 2).
export function normalizar(r, texto) {
  if (!r || typeof r !== 'object' || !Array.isArray(r.emociones)) return r
  const vistas = new Set()
  const emociones = r.emociones
    .filter((e) => e && typeof e.nombre === 'string')
    .map((e) => ({ ...e, nombre: e.nombre.toLowerCase().trim() }))
    .filter((e) => EMOCIONES_VALIDAS.includes(e.nombre) && !vistas.has(e.nombre) && vistas.add(e.nombre))
    .slice(0, 4)
  const reflexion = typeof r.reflexion === 'string' ? r.reflexion.trim() : r.reflexion
  if (r.trampas === undefined) return { ...r, emociones, reflexion }
  const tipos = new Set()
  const trampas = (Array.isArray(r.trampas) ? r.trampas : [])
    .filter((t) => t && typeof t.frase === 'string' && typeof t.tipo === 'string')
    .map((t) => ({ tipo: t.tipo.toLowerCase().trim(), frase: t.frase.trim() }))
    .filter((t) => TIPOS_TRAMPA.includes(t.tipo) && !tipos.has(t.tipo) && tipos.add(t.tipo))
    .filter((t) => texto === undefined || estaEnElRelato(t.frase, texto))
    .slice(0, 2)
  return { ...r, emociones, reflexion, trampas }
}

// Punto único de entrada. Si el proveedor falla, tarda o responde fuera del esquema,
// se devuelve la reflexión local y la app sigue funcionando (RNF-23).
export async function proponerEmociones(texto, { proveedor = proveedorActivo(), tiempoMax = TIEMPO_MAX_MS, contexto = {} } = {}) {
  let reloj
  try {
    const r = await Promise.race([
      proveedor.proponerEmociones(texto, contexto),
      new Promise((_, rej) => { reloj = setTimeout(() => rej(new Error('tiempo agotado')), tiempoMax) }),
    ])
    const normal = normalizar(r, texto)
    if (validarRespuesta(normal) && normal.reflexion) {
      // Un modelo que no conoce el campo `trampas` no lo manda: se usa el detector por reglas
      return { ...normal, trampas: normal.trampas ?? detectarTrampas(texto), proveedor: proveedor.nombre }
    }
    console.warn(`LLM ${proveedor.nombre}: respuesta fuera del esquema`, r)
  } catch (err) {
    console.warn(`LLM ${proveedor.nombre}: ${err.message}`)
  } finally {
    clearTimeout(reloj)
  }
  // Sin IA igual se proponen emociones por palabras clave, para que el usuario tenga qué elegir
  const emociones = emocionesPorReglas(texto)
  return { ...RESPALDO_LOCAL, emociones, reflexion: reflexionPorReglas(emociones, { ...contexto, texto }), trampas: detectarTrampas(texto) }
}
