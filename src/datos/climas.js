// Climas del check-in y cómo se dibujan. Compartido por el paisaje y las pantallas de ajustes.
export const CLIMAS = [
  { id: 'soleado', etiqueta: 'Soleado', icono: '☀️' },
  { id: 'nublado', etiqueta: 'Nublado', icono: '⛅' },
  { id: 'lluvia', etiqueta: 'Lluvia', icono: '🌧️' },
  { id: 'tormenta', etiqueta: 'Tormenta', icono: '⛈️' },
  { id: 'niebla', etiqueta: 'Niebla', icono: '🌫️' },
]

export const DESCRIPCION = {
  soleado: 'Cielo despejado, luz cálida y viento suave.',
  nublado: 'Cielo cubierto, luz tenue y poco viento.',
  lluvia: 'Lluvia suave y constante, nubes bajas.',
  tormenta: 'Nubes densas, viento fuerte y lluvia intensa.',
  niebla: 'Niebla espesa que deja ver poco el horizonte.',
  neutral: 'Cielo neutro y calmo, sin lluvia ni viento fuerte.',
}

// Capas de cada clima (RF-01). Se distinguen por densidad de nubes, lluvia y viento, no solo por color (RF-02).
export const CIELO = {
  inicio: { sol: true, nubes: 2, viento: 3 },
  soleado: { sol: true, nubes: 1, viento: 2 },
  nublado: { sol: true, nubes: 4, viento: 2 },
  lluvia: { sol: false, nubes: 5, viento: 1, lluvia: true },
  tormenta: { sol: false, nubes: 6, viento: 4, lluvia: true },
  niebla: { sol: true, nubes: 3, viento: 5, niebla: true },
  neutral: { sol: true, nubes: 2, viento: 0 },
}

// Modo neutral (RF-34): una tormenta se muestra como cielo neutro y sin sonidos intensos
export function climaEfectivo(clima, preferencias) {
  return preferencias?.modoNeutral && clima === 'tormenta' ? 'neutral' : clima
}

// Las capas que la persona apagó no se dibujan (S46)
export function capasVisibles(clima, capas) {
  const c = CIELO[clima || 'inicio']
  return {
    sol: c.sol && capas.luz,
    nubes: capas.nubes ? c.nubes : 0,
    viento: capas.viento ? c.viento : 0,
    lluvia: c.lluvia && capas.lluvia,
    niebla: c.niebla && capas.niebla,
  }
}
