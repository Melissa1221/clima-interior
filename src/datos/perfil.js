// Perfil persistente que se actualiza con el uso (RF-21). Vive en el dispositivo (localStorage);
// en la siguiente iteración pasa a IndexedDB con sincronización a Supabase.
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

// Qué datos usa la personalización (S40)
export const PERSONALIZACION = { paisaje: true, ritmo: true, elegidas: true, propuestas: false, tono: true }

const INICIAL = {
  registros: [],
  preferencias: PREFERENCIAS,
  privacidad: PRIVACIDAD,
  personalizacion: PERSONALIZACION,
  ritmo: { horaHabitual: null },
  primerUso: { completo: false, edad: null },
}

// Mezcla un nivel de profundidad: si se agrega un ajuste nuevo, los perfiles guardados lo reciben
function combinar(base, guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {}
  const salida = { ...base, ...g }
  for (const clave of ['preferencias', 'privacidad', 'personalizacion', 'ritmo', 'primerUso']) {
    salida[clave] = { ...base[clave], ...(g[clave] ?? {}) }
  }
  salida.preferencias.capas = { ...base.preferencias.capas, ...(g.preferencias?.capas ?? {}) }
  if (!Array.isArray(salida.registros)) salida.registros = []
  return salida
}

export function leerPerfil() {
  try {
    return combinar(INICIAL, JSON.parse(localStorage.getItem(CLAVE)))
  } catch {
    return combinar(INICIAL, null)
  }
}

function persistir(perfil) {
  localStorage.setItem(CLAVE, JSON.stringify(perfil))
  return perfil
}

export function guardarRegistro(perfil, registro) {
  const registros = [...perfil.registros, registro]
  // ritmo: la hora más frecuente de registro, para sugerir el recordatorio
  const horas = registros.map((r) => r.hora.slice(0, 2))
  const horaHabitual = horas.sort((a, b) =>
    horas.filter((h) => h === b).length - horas.filter((h) => h === a).length)[0]
  return persistir({ ...perfil, registros, ritmo: { horaHabitual } })
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
