// Contrato común de todos los proveedores de LLM (RF-18, RNF-23).
// La interfaz solo conoce este contrato; cambiar de proveedor es cambiar VITE_LLM_PROVIDER.
//
// proponerEmociones(texto) -> { emociones: [{ nombre, confianza }], reflexion: string }
//   - emociones: propuestas, nunca impuestas (RF-12). El usuario confirma, corrige o marca "no sé".
//   - reflexion: máximo 2 frases, no clínica (RF-13, RF-16).

export const EMOCIONES_VALIDAS = [
  'calma', 'alegría', 'alivio', 'gratitud', 'cansancio', 'tristeza',
  'frustración', 'ansiedad', 'preocupación', 'confusión',
]

// Valida la respuesta de cualquier proveedor. Si no cumple el esquema, se usa la reflexión local (RNF-23).
export function validarRespuesta(r) {
  if (!r || !Array.isArray(r.emociones) || typeof r.reflexion !== 'string') return false
  return r.emociones.every((e) => EMOCIONES_VALIDAS.includes(e.nombre))
}

export const RESPALDO_LOCAL = {
  emociones: [],
  reflexion: 'Gracias por darte este minuto. Ponerle nombre a lo que sientes ya es un paso.',
  respaldo: true,
}
