// Contrato común de todos los proveedores de LLM (RF-18, RNF-23).
// La interfaz solo conoce este contrato; cambiar de proveedor es cambiar VITE_LLM_PROVIDER.
//
// proponerEmociones(texto, contexto) -> { emociones: [{ nombre, confianza }], reflexion: string, trampas?: [{ tipo, frase }] }
//   - emociones: propuestas, nunca impuestas (RF-12). El usuario confirma, corrige o marca "no sé".
//   - reflexion: máximo 2 frases, no clínica (RF-13, RF-16).
//   - contexto: solo preferencias del perfil (p. ej. { frasesCortas }), nunca el diario (RF-22).
//   - trampas: opcional, 0 a 2 trampas de pensamiento de la lista cerrada, con la frase literal del relato.
//     Son hipótesis que la app pregunta, no diagnósticos. Las respuestas sin `trampas` siguen siendo válidas.
import { TIPOS_TRAMPA } from '../datos/trampas.js'

export { TIPOS_TRAMPA }

export const EMOCIONES_VALIDAS = [
  'calma', 'alegría', 'alivio', 'gratitud', 'cansancio', 'tristeza',
  'frustración', 'ansiedad', 'preocupación', 'confusión',
]

// Valida la respuesta de cualquier proveedor. Si no cumple el esquema, se usa la reflexión local (RNF-23).
export function validarRespuesta(r) {
  if (!r || !Array.isArray(r.emociones) || typeof r.reflexion !== 'string') return false
  if (r.trampas !== undefined && !validarTrampas(r.trampas)) return false
  return r.emociones.every((e) => EMOCIONES_VALIDAS.includes(e.nombre))
}

export function validarTrampas(trampas) {
  return Array.isArray(trampas) && trampas.length <= 2 &&
    trampas.every((t) => t && TIPOS_TRAMPA.includes(t.tipo) && typeof t.frase === 'string' && t.frase.trim().length > 0)
}

export const RESPALDO_LOCAL = {
  emociones: [],
  reflexion: 'Gracias por darte este minuto. Ponerle nombre a lo que sientes ya es un paso.',
  respaldo: true,
}
