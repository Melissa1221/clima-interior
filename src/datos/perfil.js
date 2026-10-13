// Perfil persistente que se actualiza con el uso (RF-21). Vive en el dispositivo (localStorage);
// en la siguiente iteración pasa a IndexedDB con sincronización a Supabase.
const CLAVE = 'clima-interior:perfil'

const INICIAL = {
  registros: [],
  preferencias: { movimientoReducido: false, describirEnVoz: false },
  ritmo: { horaHabitual: null },
}

export function leerPerfil() {
  try {
    return { ...INICIAL, ...JSON.parse(localStorage.getItem(CLAVE)) }
  } catch {
    return INICIAL
  }
}

export function guardarRegistro(perfil, registro) {
  const registros = [...perfil.registros, registro]
  // ritmo: la hora más frecuente de registro, para sugerir el recordatorio
  const horas = registros.map((r) => r.hora.slice(0, 2))
  const horaHabitual = horas.sort((a, b) =>
    horas.filter((h) => h === b).length - horas.filter((h) => h === a).length)[0]
  const nuevo = { ...perfil, registros, ritmo: { horaHabitual } }
  localStorage.setItem(CLAVE, JSON.stringify(nuevo))
  return nuevo
}

export function guardarPreferencias(perfil, preferencias) {
  const nuevo = { ...perfil, preferencias: { ...perfil.preferencias, ...preferencias } }
  localStorage.setItem(CLAVE, JSON.stringify(nuevo))
  return nuevo
}
