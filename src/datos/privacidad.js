// Reglas de consentimiento: lo que la persona deja apagado no sale del dispositivo (RF-27, RNF-11, RNF-12).

// Decide si se puede dictar antes de encender el micrófono. Devuelve el motivo si no se puede.
//   'sin-navegador'      el navegador no tiene dictado
//   'sin-permiso'        la persona apagó «Grabar mi voz»
//   'requiere-internet'  solo se puede transcribir en internet y ese permiso está apagado
export function estadoDictado(privacidad, { dictado, local }) {
  if (!dictado) return 'sin-navegador'
  if (!privacidad.grabarVoz) return 'sin-permiso'
  if (!privacidad.transcribirEnInternet && !local) return 'requiere-internet'
  return 'ok'
}

export const MOTIVOS_DICTADO = {
  'sin-navegador': 'Tu navegador no permite dictar. Puedes escribirlo.',
  'sin-permiso': 'Tienes apagado «Grabar mi voz». Puedes escribirlo o activarlo en Perfil › Privacidad.',
  'requiere-internet': 'Este navegador solo transcribe en internet. Para dictar, activa «Transcribir mi voz en internet» en Perfil › Privacidad, o escríbelo.',
}

// Hoja justo a tiempo «¿Dónde pensamos tu reflexión?» (J2): solo la primera vez que se toca «Listo» con un relato,
// y solo si el proveedor configurado sale a internet. Un proveedor que no declara `enInternet` cuenta como en internet.
export function debePreguntarIA(avisos, proveedor) {
  return !avisos?.ia && proveedor?.enInternet !== false
}

// Tema de la app: la persona puede fijarlo; en «auto» manda el sistema o, si no dice nada, la hora (19:00 a 6:00)
export function temaEfectivo(preferencia = 'auto', { sistemaOscuro = false, hora = new Date().getHours() } = {}) {
  if (preferencia === 'claro' || preferencia === 'noche') return preferencia
  return sistemaOscuro || hora >= 19 || hora < 6 ? 'noche' : 'claro'
}
