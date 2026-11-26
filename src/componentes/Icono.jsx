// Una sola familia de íconos de línea (sistema v3 refinada): viewBox 24, sin relleno, puntas y uniones redondas.
// El trazo se compensa según el tamaño para que SIEMPRE se vea de 1,75 px: stroke = 1,75 × 24 / tamaño.
// Los trazos salen tal cual de estudio-visual/pantallas-v2/v3-refinada (v3.py, grupo-a, grupo-b y journey-nuevo).
const P = {
  respiro: '<path d="M3 9h11a3 3 0 1 0-3-3"/><path d="M3 14h15a3 3 0 1 1-3 3"/><path d="M3 19h6"/>',
  mic: '<rect x="9" y="3" width="6" height="11.5" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  pen: '<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z"/><path d="M13.5 7l3 3"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.1"/>',
  pause: '<path d="M9 6v12M15 6v12"/>',
  phone: '<path d="M21 16.4v2.8a1.9 1.9 0 0 1-2.07 1.9 18.8 18.8 0 0 1-8.2-2.92 18.5 18.5 0 0 1-5.7-5.7A18.8 18.8 0 0 1 2.1 4.24 1.9 1.9 0 0 1 4 2.17h2.8a1.9 1.9 0 0 1 1.9 1.63c.12.91.34 1.8.66 2.66a1.9 1.9 0 0 1-.43 2L7.74 9.65a15.2 15.2 0 0 0 5.7 5.7l1.2-1.2a1.9 1.9 0 0 1 2-.42c.86.32 1.75.54 2.66.66A1.9 1.9 0 0 1 21 16.4z"/>',
  // clima
  soleado: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M5.4 18.6L7 17M17 7l1.6-1.6"/>',
  nublado: '<path d="M7 18.5h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7 11.2 3.7 3.7 0 0 0 7 18.5z"/>',
  lluvia: '<path d="M7 14.5h10a3.8 3.8 0 0 0 .5-7.5A5.3 5.3 0 0 0 7.3 7.6 3.5 3.5 0 0 0 7 14.5z"/><path d="M8.6 17.6l-.9 2.6M12.6 17.6l-.9 2.6M16.6 17.6l-.9 2.6"/>',
  tormenta: '<path d="M7 14.5h10a3.8 3.8 0 0 0 .5-7.5A5.3 5.3 0 0 0 7.3 7.6 3.5 3.5 0 0 0 7 14.5z"/><path d="M12.8 15.6l-2.2 3.4h3l-2 3.2"/>',
  niebla: '<path d="M4 7.5h12M7.5 12H20M4 16.5h11M10 21h7"/>',
  neutral: '<path d="M4 12h16"/><circle cx="12" cy="12" r="8.5"/>',
  // navegación
  inicio: '<path d="M3.5 18c3-4.2 6-6.4 8.8-6.4s5 1.6 8.2 4.8"/><path d="M3 20.5h18"/><circle cx="16.5" cy="6.5" r="2.5"/>',
  historial: '<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M8 3v4M16 3v4M3.5 10.5h17"/><path d="M8 14.5h.01M12 14.5h.01M16 14.5h.01"/>',
  sala: '<path d="M6 11V8.5A3.5 3.5 0 0 1 9.5 5h5A3.5 3.5 0 0 1 18 8.5V11"/><path d="M4.5 11A1.8 1.8 0 0 1 6.3 12.8V14h11.4v-1.2A1.8 1.8 0 1 1 21 12.8V18H3v-5.2A1.8 1.8 0 0 1 4.5 11z"/><path d="M6 18v2M18 18v2"/>',
  perfil: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5"/>',
  // grupo A, B y journey nuevo
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.3 6.5a8 8 0 0 1 0 11"/>',
  arrow: '<path d="M4.5 12h15M13.5 6l6 6-6 6"/>',
  out: '<path d="M14 4.5h3.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H14"/><path d="M10 8l-4 4 4 4M6 12h9"/>',
  chev: '<path d="M9.5 6l6 6-6 6"/>',
  moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.8h5V7"/><path d="M6.5 7l.9 12.2a1.8 1.8 0 0 0 1.8 1.6h5.6a1.8 1.8 0 0 0 1.8-1.6L17.5 7"/><path d="M10.2 11v6M13.8 11v6"/>',
  person: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5"/>',
  dot: '<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="7.5" opacity=".45"/>',
  globe: '<circle cx="12" cy="12" r="8.8"/><path d="M3.4 12h17.2M12 3.2c2.6 2.5 3.9 5.4 3.9 8.8s-1.3 6.3-3.9 8.8c-2.6-2.5-3.9-5.4-3.9-8.8S9.4 5.7 12 3.2z"/>',
  device: '<rect x="6.5" y="2.8" width="11" height="18.4" rx="2.6"/><path d="M10.5 17.8h3"/>',
  sliders: '<path d="M4 7.5h9M17.5 7.5H20M4 16.5h2.5M11 16.5h9"/><circle cx="15.2" cy="7.5" r="2.2"/><circle cx="8.8" cy="16.5" r="2.2"/>',
  motion: '<path d="M4 12c2.2-3 4.4-3 6.6 0s4.4 3 6.6 0"/><path d="M19.5 9.5v5"/>',
  quiet: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
  share: '<path d="M12 3.5v11"/><path d="M8 7.2l4-3.7 4 3.7"/><path d="M7.5 10.5H6.3a1.8 1.8 0 0 0-1.8 1.8v6.4a1.8 1.8 0 0 0 1.8 1.8h11.4a1.8 1.8 0 0 0 1.8-1.8v-6.4a1.8 1.8 0 0 0-1.8-1.8h-1.2"/>',
  download: '<path d="M12 3.5v11"/><path d="M8 10.8l4 3.7 4-3.7"/><path d="M4.5 16v2.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V16"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  tasks: '<path d="M3.8 6.6l1.7 1.7 3-3.1"/><path d="M3.8 12.6l1.7 1.7 3-3.1"/><path d="M12 7h8.2M12 13h8.2M12 19h8.2"/><path d="M5.6 19h.1"/>',
  amiga: '<path d="M20.5 11.5a8.3 8.3 0 0 1-12.1 7.4L3.5 20.5l1.6-4.6A8.3 8.3 0 1 1 20.5 11.5z"/><path d="M12 15.4c-2.4-1.6-3.6-2.9-3.6-4.2a1.85 1.85 0 0 1 3.6-.7 1.85 1.85 0 0 1 3.6.7c0 1.3-1.2 2.6-3.6 4.2z"/>',
  book: '<path d="M12 6.6C10.2 5.3 7.6 4.6 4 4.6v13c3.6 0 6.2.7 8 2 1.8-1.3 4.4-2 8-2v-13c-3.6 0-6.2.7-8 2z"/><path d="M12 6.6v13"/>',
  a11y: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="7.7" r="1.2"/><path d="M7.6 10.3l4.4 1 4.4-1M12 11.3v3.2l-2.3 3.6M12 14.5l2.3 3.6"/>',
  folder: '<path d="M3.5 7.5a2 2 0 0 1 2-2h3.8l2 2.2h7.2a2 2 0 0 1 2 2v8.3a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.5a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.7M12 16.9v.1"/>',
  alert: '<path d="M10.3 4.3L2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4.5M12 17.2v.1"/>',
  vibrate: '<rect x="8" y="4" width="8" height="16" rx="2"/><path d="M4.5 9v6M19.5 9v6"/>',
}

// Nombres de antes (src/iconos) → la familia nueva
const ALIAS = {
  borrar: 'trash', calendario: 'historial', candado: 'lock', descargar: 'download', empezar: 'arrow', instalar: 'download',
  salir: 'out', texto: 'pen', viento: 'respiro', ayuda: 'help', ia: 'info', siguiente: 'chev', vibrar: 'vibrate',
  alerta: 'alert', personas: 'sala', lista: 'tasks', inicio: 'inicio', perfil: 'perfil', mic: 'mic', check: 'check', info: 'info',
}

export const ICONOS = Object.keys(P)
export const grosor = (tam) => Math.round((1.75 * 24 / tam) * 100) / 100

export default function Icono({ nombre, tam = 24, className = '' }) {
  const d = P[nombre] ?? P[ALIAS[nombre]]
  if (!d) return null
  return (
    <svg className={`icono ${className}`} width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={grosor(tam)} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"
      dangerouslySetInnerHTML={{ __html: d }} />
  )
}
