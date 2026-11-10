// Perfil persistente que se actualiza con el uso (RF-21, RF-22, RF-23).
// Vive en el dispositivo (localStorage). Guarda preferencias, ritmo, errores y emociones
// declaradas e inferidas, y anota de dónde salió cada cambio que la app hizo por su cuenta.
const CLAVE = 'clima-interior:perfil'
export const VERSION = 2

// Lo que la persona puede ver, apagar o restablecer en "Lo que sé de ti" (RF-23)
export const CATEGORIAS = {
  ritmo: 'Tu hora habitual y cuánto duran tus check-ins',
  emocionesDeclaradas: 'Las emociones que eliges más',
  emocionesInferidas: 'Las emociones que propone la IA',
  entrada: 'Si prefieres hablar o escribir',
  tono: 'El largo de las reflexiones',
}

const FALLOS_MIC_PARA_TEXTO = 2
const PEDIDOS_PARA_CORTO = 3

export function perfilInicial() {
  return {
    version: VERSION,
    registros: [],
    preferencias: { movimientoReducido: false, describirEnVoz: false, frasesCortas: false, entrada: 'voz' },
    ritmo: { horaHabitual: null, segundosCheckin: null },
    aprendizaje: { emociones: {}, propuestasIA: 0, aceptadasIA: 0, fallosMic: 0, pedidosCorto: 0 },
    activas: Object.fromEntries(Object.keys(CATEGORIAS).map((c) => [c, true])),
    cambios: [],
  }
}

// Une lo guardado con la forma actual: un perfil v1 (solo registros y ritmo) sigue funcionando
export function leerPerfil() {
  const base = perfilInicial()
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE)) || {}
    return {
      ...base,
      registros: Array.isArray(g.registros) ? g.registros : [],
      preferencias: { ...base.preferencias, ...g.preferencias },
      ritmo: { ...base.ritmo, ...g.ritmo },
      aprendizaje: { ...base.aprendizaje, ...g.aprendizaje },
      activas: { ...base.activas, ...g.activas },
      cambios: Array.isArray(g.cambios) ? g.cambios : [],
    }
  } catch {
    return base
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
  const { activas } = perfil
  const nuevoRegistro = activas.emocionesInferidas ? registro : { ...registro, emocion_inferida: null }
  const registros = [...perfil.registros, nuevoRegistro]

  let ritmo = perfil.ritmo
  if (activas.ritmo) {
    const conDuracion = [...registros.map((r) => r.segundos).filter(Number.isFinite), segundos].filter(Number.isFinite)
    ritmo = {
      horaHabitual: moda(registros.map((r) => r.hora?.slice(0, 2)).filter(Boolean)),
      segundosCheckin: conDuracion.length
        ? Math.round(conDuracion.reduce((a, b) => a + b, 0) / conDuracion.length) : null,
    }
    if (Number.isFinite(segundos)) registros[registros.length - 1] = { ...nuevoRegistro, segundos }
  }

  const aprendizaje = { ...perfil.aprendizaje, emociones: { ...perfil.aprendizaje.emociones } }
  const declaradas = registro.emocion_declarada || []
  if (activas.emocionesDeclaradas) {
    for (const e of declaradas) aprendizaje.emociones[e] = (aprendizaje.emociones[e] || 0) + 1
  }
  if (activas.emocionesInferidas && registro.emocion_inferida?.length) {
    aprendizaje.propuestasIA += 1
    if (declaradas.some((e) => registro.emocion_inferida.includes(e))) aprendizaje.aceptadasIA += 1
  }
  return persistir({ ...perfil, registros, ritmo, aprendizaje })
}

// Si el micrófono falla seguido, la app empieza ofreciendo escribir (preferencia aprendida)
export function registrarFalloMic(perfil) {
  const fallosMic = perfil.aprendizaje.fallosMic + 1
  let { preferencias, cambios } = perfil
  if (perfil.activas.entrada && fallosMic >= FALLOS_MIC_PARA_TEXTO && preferencias.entrada === 'voz') {
    preferencias = { ...preferencias, entrada: 'texto' }
    cambios = anotar(perfil, 'Ahora empiezas escribiendo', `El micrófono falló ${fallosMic} veces`)
  }
  return persistir({ ...perfil, preferencias, cambios, aprendizaje: { ...perfil.aprendizaje, fallosMic } })
}

// HU-08 Esc. 1: tras tres pedidos de "más corto", las reflexiones pasan a una sola frase
export function pedirMasCorto(perfil) {
  const pedidosCorto = perfil.aprendizaje.pedidosCorto + 1
  let { preferencias, cambios } = perfil
  if (perfil.activas.tono && pedidosCorto >= PEDIDOS_PARA_CORTO && !preferencias.frasesCortas) {
    preferencias = { ...preferencias, frasesCortas: true }
    cambios = anotar(perfil, 'Reflexiones de una sola frase', `Pediste "más corto" ${pedidosCorto} veces`)
  }
  return persistir({ ...perfil, preferencias, cambios, aprendizaje: { ...perfil.aprendizaje, pedidosCorto } })
}

export function guardarPreferencias(perfil, preferencias, fuente = 'Lo cambiaste tú') {
  const cambios = anotar(perfil, `Preferencias: ${Object.keys(preferencias).join(', ')}`, fuente)
  return persistir({ ...perfil, preferencias: { ...perfil.preferencias, ...preferencias }, cambios })
}

// Borra lo aprendido de una categoría, sin tocar los registros del diario
export function restablecer(perfil, categoria) {
  const base = perfilInicial()
  const p = { ...perfil, aprendizaje: { ...perfil.aprendizaje }, preferencias: { ...perfil.preferencias } }
  if (categoria === 'ritmo') p.ritmo = base.ritmo
  if (categoria === 'emocionesDeclaradas') p.aprendizaje.emociones = {}
  if (categoria === 'emocionesInferidas') {
    p.aprendizaje.propuestasIA = 0
    p.aprendizaje.aceptadasIA = 0
    p.registros = p.registros.map((r) => ({ ...r, emocion_inferida: null }))
  }
  if (categoria === 'entrada') {
    p.aprendizaje.fallosMic = 0
    p.preferencias.entrada = base.preferencias.entrada
  }
  if (categoria === 'tono') {
    p.aprendizaje.pedidosCorto = 0
    p.preferencias.frasesCortas = false
  }
  p.cambios = anotar(perfil, `Se borró: ${CATEGORIAS[categoria]}`, 'Lo pediste tú')
  return persistir(p)
}

// Apagar una categoría también borra lo que ya se había aprendido de ella (HU-09 Esc. 1)
export function cambiarCategoria(perfil, categoria, activa) {
  const p = activa ? perfil : restablecer(perfil, categoria)
  const cambios = anotar(p, `${activa ? 'Activaste' : 'Apagaste'}: ${CATEGORIAS[categoria]}`, 'Lo cambiaste tú')
  return persistir({ ...p, activas: { ...p.activas, [categoria]: activa }, cambios })
}

export function borrarTodo() {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    // nada que borrar
  }
  return perfilInicial()
}

// Las emociones que la persona elige más, para ofrecerlas aunque la IA no las proponga
export function emocionesFavoritas(perfil, n = 3) {
  if (!perfil.activas.emocionesDeclaradas) return []
  return Object.entries(perfil.aprendizaje.emociones)
    .filter(([, veces]) => veces >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([nombre]) => nombre)
}

// Aplica lo aprendido a la respuesta de la IA: suma tus palabras de siempre y acorta si lo pediste.
// La IA sigue proponiendo; la persona decide.
export function personalizarPropuesta(perfil, propuesta) {
  const emociones = [...propuesta.emociones]
  for (const nombre of emocionesFavoritas(perfil)) {
    if (!emociones.some((e) => e.nombre === nombre)) emociones.push({ nombre, confianza: 0, tuya: true })
  }
  let reflexion = propuesta.reflexion
  if (perfil.activas.tono && perfil.preferencias.frasesCortas) {
    reflexion = reflexion.match(/^[^.?!]*[.?!]/)?.[0] ?? reflexion
  }
  return { ...propuesta, emociones: emociones.slice(0, 6), reflexion }
}

// Lo que el proveedor de IA puede saber del perfil: solo el largo pedido, nunca el diario
export function contextoParaLLM(perfil) {
  return { frasesCortas: perfil.activas.tono && perfil.preferencias.frasesCortas }
}

// Saludo que reconoce el ritmo de la persona, sin rachas ni reproches (RF-43)
export function notaDeRitmo(perfil, ahora = new Date()) {
  if (!perfil.activas.ritmo || perfil.registros.length < 3 || !perfil.ritmo.horaHabitual) return null
  return String(ahora.getHours()).padStart(2, '0') === perfil.ritmo.horaHabitual
    ? 'Llegas a tu hora de siempre.'
    : null
}
