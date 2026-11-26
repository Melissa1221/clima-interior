// Historial: días con registro. Un día puede tener varios registros (se guarda el clima más de una vez):
// se cuenta una vez y el detalle muestra todos, en orden.

// Fecha en la zona del usuario: con toISOString un registro de las 20:00 en Lima caía en el día siguiente
export const fechaLocal = (d) => d.toLocaleDateString('en-CA')

export const diasRegistrados = (registros) => new Set(registros.map((r) => r.fecha)).size

export const registrosDelDia = (registros, fecha) => registros.filter((r) => r.fecha === fecha)

// 30 días seguidos, incluidos los que no tienen registro (RF-43: sin rachas que castiguen).
// La demo empieza en su primer registro; el historial real termina hoy. `r` es el último registro del día.
export function treintaDias(registros, { terminaHoy = false, hoy = new Date() } = {}) {
  const porFecha = {}
  for (const r of registros) (porFecha[r.fecha] ??= []).push(r)
  const inicio = terminaHoy ? new Date(hoy) : new Date(`${registros[0].fecha}T12:00:00`)
  if (terminaHoy) inicio.setDate(inicio.getDate() - 29)
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(inicio)
    d.setDate(d.getDate() + i)
    const fecha = fechaLocal(d)
    const delDia = porFecha[fecha] ?? []
    return { fecha, r: delDia.at(-1), registros: delDia }
  })
}
