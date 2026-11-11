// Perfil persistente que se actualiza con el uso (RF-21, RF-22, RF-23). Vive en el dispositivo (localStorage).
// Guarda preferencias, permisos, ritmo, errores y emociones declaradas e inferidas, y anota de dónde
// salió cada cambio que la app hizo por su cuenta.
const CLAVE = 'clima-interior:perfil'

export const PREFERENCIAS = {
  movimientoReducido: false,
  modoPredecible: false,
  modoNeutral: false,
  describirEnVoz: false,
  vibrar: true,
  pistas: true,
  comandosVoz: true,
  capas: { lluvia: true, viento: true, niebla: true, nubes: true, luz: true },
}

// Cada permiso es independiente y arranca en el valor más protector (S03, S42)
export const PRIVACIDAD = { grabarVoz: true, transcribirEnInternet: false, iaEnInternet: false, climaCompartido: false }

// Qué datos usa la personalización (S40). Apagar una categoría también borra lo aprendido de ella.
export const PERSONALIZACION = { paisaje: true, ritmo: true, elegidas: true, propuestas: false, tono: true, entrada: true }

// Nombres de las categorías que la persona puede olvidar en "Lo que sabe de ti"
export const CATEGORIAS = {
  ritmo: 'Tu ritmo',
  elegidas: 'Emociones que elegiste',
  propuestas: 'Emociones que propuso la IA',
  tono: 'Cómo te habla el asistente',
  entrada: 'Si prefieres hablar o escribir',
}

const FALLOS_MIC_PARA_TEXTO = 2
const PEDIDOS_PARA_CORTO = 3

const INICIAL = {
  registros: [],
  preferencias: PREFERENCIAS,
  privacidad: PRIVACIDAD,
  personalizacion: PERSONALIZACION,
  ritmo: { horaHabitual: null, segundosCheckin: null },
  primerUso: { completo: false, edad: null },
  // Lo que la app aprende del uso y lo que decidió por su cuenta a partir de eso
  aprendizaje: { emociones: {}, propuestasIA: 0, aceptadasIA: 0, fallosMic: 0, pedidosCorto: 0 },
  aprendido: { frasesCortas: false, entrada: 'voz' },
  cambios: [],
}

const GRUPOS = ['preferencias', 'privacidad', 'personalizacion', 'ritmo', 'primerUso', 'aprendizaje', 'aprendido']

// Mezcla un nivel de profundidad: si se agrega un ajuste nuevo, los perfiles guardados lo reciben
function combinar(base, guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {}
  const salida = { ...base, ...g }
  for (const clave of GRUPOS) salida[clave] = { ...base[clave], ...(g[clave] ?? {}) }
  salida.preferencias.capas = { ...base.preferencias.capas, ...(g.preferencias?.capas ?? {}) }
  salida.aprendizaje.emociones = { ...(g.aprendizaje?.emociones ?? {}) }
  if (!Array.isArray(salida.registros)) salida.registros = []
  if (!Array.isArray(salida.cambios)) salida.cambios = []
  return salida
}

export function perfilInicial() {
  return combinar(INICIAL, null)
}

export function leerPerfil() {
  try {
    return combinar(INICIAL, JSON.parse(localStorage.getItem(CLAVE)))
  } catch {
    return combinar(INICIAL, null)
  }
}

function persistir(perfil) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(perfil))
  } catch {
    // sin almacenamiento (modo privado) la app sigue, solo que no recuerda
  }
  return perfil
}

const anotar = (perfil, que, fuente) =>
  [...perfil.cambios, { fecha: new Date().toISOString(), que, fuente }].slice(-20)

function moda(valores) {
  const cuenta = {}
  for (const v of valores) cuenta[v] = (cuenta[v] || 0) + 1
  return Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

// Cada check-in actualiza el ritmo y lo aprendido, solo en las categorías activas
export function guardarRegistro(perfil, registro, { segundos } = {}) {
  const activas = perfil.personalizacion
  const nuevo = activas.propuestas ? registro : { ...registro, emocion_inferida: null }
  const registros = [...perfil.registros, nuevo]

  let ritmo = perfil.ritmo
  if (activas.ritmo) {
    if (Number.isFinite(segundos)) registros[registros.length - 1] = { ...nuevo, segundos }
    const duraciones = registros.map((r) => r.segundos).filter(Number.isFinite)
    ritmo = {
      horaHabitual: moda(registros.map((r) => r.hora?.slice(0, 2)).filter(Boolean)),
      segundosCheckin: duraciones.length ? Math.round(duraciones.reduce((a, b) => a + b, 0) / duraciones.length) : null,
    }
  }

  const aprendizaje = { ...perfil.aprendizaje, emociones: { ...perfil.aprendizaje.emociones } }
  const declaradas = [].concat(registro.emocion_declarada ?? [])
  if (activas.elegidas) {
    for (const e of declaradas) aprendizaje.emociones[e] = (aprendizaje.emociones[e] || 0) + 1
  }
  if (activas.propuestas && registro.emocion_inferida?.length) {
    aprendizaje.propuestasIA += 1
    if (declaradas.some((e) => registro.emocion_inferida.includes(e))) aprendizaje.aceptadasIA += 1
  }
  return persistir({ ...perfil, registros, ritmo, aprendizaje })
}

export function guardarPreferencias(perfil, preferencias) {
  return persistir({ ...perfil, preferencias: { ...perfil.preferencias, ...preferencias } })
}

// Cambia un grupo de ajustes ('privacidad', 'personalizacion', 'primerUso') sin tocar los demás
export function guardarAjustes(perfil, grupo, cambios) {
  return persistir({ ...perfil, [grupo]: { ...perfil[grupo], ...cambios } })
}

export function alternarCapa(perfil, capa) {
  const capas = { ...perfil.preferencias.capas, [capa]: !perfil.preferencias.capas[capa] }
  return guardarPreferencias(perfil, { capas })
}

// Si el micrófono falla seguido, la app empieza ofreciendo escribir (preferencia aprendida)
export function registrarFalloMic(perfil) {
  const fallosMic = perfil.aprendizaje.fallosMic + 1
  let { aprendido, cambios } = perfil
  if (perfil.personalizacion.entrada && fallosMic >= FALLOS_MIC_PARA_TEXTO && aprendido.entrada === 'voz') {
    aprendido = { ...aprendido, entrada: 'texto' }
    cambios = anotar(perfil, 'Ahora empiezas escribiendo', `El micrófono falló ${fallosMic} veces`)
  }
  return persistir({ ...perfil, aprendido, cambios, aprendizaje: { ...perfil.aprendizaje, fallosMic } })
}

// HU-08 Esc. 1: tras tres pedidos de "más corto", las reflexiones pasan a una sola frase
export function pedirMasCorto(perfil) {
  const pedidosCorto = perfil.aprendizaje.pedidosCorto + 1
  let { aprendido, cambios } = perfil
  if (perfil.personalizacion.tono && pedidosCorto >= PEDIDOS_PARA_CORTO && !aprendido.frasesCortas) {
    aprendido = { ...aprendido, frasesCortas: true }
    cambios = anotar(perfil, 'Reflexiones de una sola frase', `Pediste "más corto" ${pedidosCorto} veces`)
  }
  return persistir({ ...perfil, aprendido, cambios, aprendizaje: { ...perfil.aprendizaje, pedidosCorto } })
}

// Borra lo aprendido de una categoría, sin tocar los registros del diario
export function restablecer(perfil, categoria) {
  const base = perfilInicial()
  const p = { ...perfil, aprendizaje: { ...perfil.aprendizaje }, aprendido: { ...perfil.aprendido } }
  if (categoria === 'ritmo') p.ritmo = base.ritmo
  if (categoria === 'elegidas') p.aprendizaje.emociones = {}
  if (categoria === 'propuestas') {
    p.aprendizaje.propuestasIA = 0
    p.aprendizaje.aceptadasIA = 0
    p.registros = p.registros.map((r) => ({ ...r, emocion_inferida: null }))
  }
  if (categoria === 'entrada') {
    p.aprendizaje.fallosMic = 0
    p.aprendido.entrada = base.aprendido.entrada
  }
  if (categoria === 'tono') {
    p.aprendizaje.pedidosCorto = 0
    p.aprendido.frasesCortas = false
  }
  p.cambios = anotar(perfil, `Se borró: ${CATEGORIAS[categoria] ?? categoria}`, 'Lo pediste tú')
  return persistir(p)
}

// Apagar una categoría también borra lo que ya se había aprendido de ella (HU-09 Esc. 1)
export function cambiarCategoria(perfil, categoria, activa) {
  const p = activa || !CATEGORIAS[categoria] ? perfil : restablecer(perfil, categoria)
  const nombre = CATEGORIAS[categoria] ?? 'Preferencias del paisaje'
  const cambios = anotar(p, `${activa ? 'Activaste' : 'Apagaste'}: ${nombre}`, 'Lo cambiaste tú')
  return persistir({ ...p, personalizacion: { ...p.personalizacion, [categoria]: activa }, cambios })
}

// Las emociones que la persona elige más, para ofrecerlas aunque la IA no las proponga
export function emocionesFavoritas(perfil, n = 3) {
  if (!perfil.personalizacion.elegidas) return []
  return Object.entries(perfil.aprendizaje.emociones)
    .filter(([, veces]) => veces >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([nombre]) => nombre)
}

const frasesCortas = (perfil) => perfil.personalizacion.tono && perfil.aprendido.frasesCortas

// Aplica lo aprendido a la respuesta de la IA: suma tus palabras de siempre y acorta si lo pediste.
// La IA sigue proponiendo; la persona decide.
export function personalizarPropuesta(perfil, propuesta) {
  const emociones = [...propuesta.emociones]
  for (const nombre of emocionesFavoritas(perfil)) {
    if (!emociones.some((e) => e.nombre === nombre)) emociones.push({ nombre, confianza: 0, tuya: true })
  }
  let reflexion = propuesta.reflexion
  if (frasesCortas(perfil)) reflexion = reflexion.match(/^[^.?!]*[.?!]/)?.[0] ?? reflexion
  return { ...propuesta, emociones: emociones.slice(0, 6), reflexion }
}

// Lo que el proveedor de IA puede saber del perfil: solo el largo pedido, nunca el diario
export function contextoParaLLM(perfil) {
  return { frasesCortas: frasesCortas(perfil) }
}

// La entrada con la que conviene empezar, según lo aprendido
export const empiezaEscribiendo = (perfil) => perfil.personalizacion.entrada && perfil.aprendido.entrada === 'texto'

// Saludo que reconoce el ritmo de la persona, sin rachas ni reproches (RF-43)
export function notaDeRitmo(perfil, ahora = new Date()) {
  if (!perfil.personalizacion.ritmo || perfil.registros.length < 3 || !perfil.ritmo.horaHabitual) return null
  return String(ahora.getHours()).padStart(2, '0') === perfil.ritmo.horaHabitual
    ? 'Llegas a tu hora de siempre.'
    : null
}

// Borra todo lo que la app guardó en el dispositivo: perfil, caché y cola de sincronización (S45, RF-29)
export async function borrarTodo() {
  const claves = []
  for (let i = 0; i < localStorage.length; i++) claves.push(localStorage.key(i))
  claves.filter((k) => k?.startsWith('clima-interior:')).forEach((k) => localStorage.removeItem(k))
  try {
    if (typeof caches !== 'undefined') await Promise.all((await caches.keys()).map((k) => caches.delete(k)))
  } catch {
    // sin Cache API: no hay nada más que borrar
  }
  return combinar(INICIAL, null)
}
