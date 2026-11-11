// Esquema de los mensajes de una sala de clima compartido (RF-26, RF-27, RNF-13, RNF-14).
// Lo usan el navegador y el servidor: un mensaje solo lleva un tipo de una lista cerrada y números.
// Nunca viaja texto libre, audio, nombres ni emociones.

export const CLIMAS = ['soleado', 'nublado', 'lluvia', 'tormenta', 'niebla']
// Valencia aproximada de cada clima, de -1 (pesado) a 1 (ligero), para el clima colectivo (RF-28)
export const VALENCIA = { soleado: 0.7, nublado: 0.1, niebla: -0.2, lluvia: -0.4, tormenta: -0.8 }
export const HORAS_DE_VIDA = 24

// Qué campos numéricos lleva cada tipo (además de "tipo" y "de")
const CAMPOS = {
  hola: ['creador'],
  clima: ['c', 'v'],
  retirar: [],
  adios: [],
  expulsar: ['a'],
  cerrar: [],
}

const esId = (n) => Number.isInteger(n) && n > 0 && n < 2 ** 32

export function validarMensaje(m) {
  if (!m || typeof m !== 'object' || Array.isArray(m)) return false
  const campos = CAMPOS[m.tipo]
  if (!campos) return false
  const claves = Object.keys(m)
  if (claves.length !== campos.length + 2 || !claves.every((k) => k === 'tipo' || k === 'de' || campos.includes(k))) return false
  if (!esId(m.de)) return false
  if (m.tipo === 'hola') return m.creador === 0 || m.creador === 1
  if (m.tipo === 'clima') return Number.isInteger(m.c) && m.c >= 0 && m.c < CLIMAS.length
    && typeof m.v === 'number' && m.v >= -1 && m.v <= 1
  if (m.tipo === 'expulsar') return esId(m.a)
  return true
}

// Código de 128 bits en base32 (Crockford, sin I/L/O/U para que no se confunda al dictarlo)
const ALFABETO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
export function generarCodigo() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  let bits = ''
  for (const b of bytes) bits += b.toString(2).padStart(8, '0')
  let codigo = ''
  for (let i = 0; i < bits.length; i += 5) codigo += ALFABETO[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)]
  return codigo.match(/.{1,4}/g).join('-')
}

export const normalizarCodigo = (c) => String(c || '').toUpperCase().replace(/[^0-9A-Z]/g, '').match(/.{1,4}/g)?.join('-') ?? ''
export const codigoValido = (c) => /^([0-9A-HJKMNP-TV-Z]{4}-){6}[0-9A-HJKMNP-TV-Z]{2}$/.test(c)

export const nuevoId = () => crypto.getRandomValues(new Uint32Array(1))[0] || 1

// Seudónimo efímero derivado del id: cambia en cada sesión y no dice nada de la persona
export const seudonimo = (id) => `Nube ${(id % 900) + 100}`

export function mensajeDeClima(de, clima) {
  return { tipo: 'clima', de, c: CLIMAS.indexOf(clima), v: VALENCIA[clima] }
}

// Clima colectivo: el clima cuya valencia está más cerca del promedio de la sala (RF-28)
export function climaColectivo(climas) {
  if (!climas.length) return null
  const promedio = climas.reduce((s, c) => s + VALENCIA[c], 0) / climas.length
  const clima = CLIMAS.reduce((mejor, c) =>
    Math.abs(VALENCIA[c] - promedio) < Math.abs(VALENCIA[mejor] - promedio) ? c : mejor)
  const cuenta = Object.fromEntries(CLIMAS.map((c) => [c, climas.filter((x) => x === c).length]))
  return { clima, valencia: Math.round(promedio * 100) / 100, cuenta }
}
