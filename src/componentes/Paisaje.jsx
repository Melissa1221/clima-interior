import { CIELO, DESCRIPCION, capasVisibles } from '../datos/climas.js'
import { PREFERENCIAS } from '../datos/perfil.js'

const NUBES = [[30, 120, 1], [250, 170, 0.8], [60, 250, 1.2], [300, 60, 0.9], [150, 320, 1], [330, 280, 0.7]]

// Capa decorativa del cielo: sol, nubes y viento según el clima (RF-01)
export function Cielo({ clima, capas = PREFERENCIAS.capas, descripcion }) {
  const c = capasVisibles(clima, capas)
  return (
    <svg className="cielo" viewBox="0 0 400 420" preserveAspectRatio="xMidYMin slice" role="img" aria-label={descripcion}
      aria-hidden={descripcion ? undefined : true}>
      {c.sol && <circle cx="300" cy="150" r="46" className="cielo__sol" />}
      {NUBES.slice(0, c.nubes).map(([x, y, k], i) => (
        <g key={i} className="cielo__nube" transform={`translate(${x} ${y}) scale(${k})`}>
          <ellipse cx="60" cy="20" rx="70" ry="14" /><ellipse cx="50" cy="8" rx="34" ry="16" /><ellipse cx="88" cy="10" rx="24" ry="12" />
        </g>
      ))}
      {Array.from({ length: c.viento }, (_, i) => (
        <path key={i} className="cielo__viento" d={`M ${-20 + i * 40} ${200 + i * 45} q 90 -18 180 0 t 180 0 q 20 6 6 22`} />
      ))}
      {c.lluvia && Array.from({ length: 28 }, (_, i) => (
        <line key={i} className="cielo__gota" x1={(i * 37) % 400} y1={190 + (i * 53) % 200} x2={(i * 37) % 400 - 6} y2={210 + (i * 53) % 200} />
      ))}
      {c.niebla && <rect y="230" width="400" height="190" className="cielo__niebla" />}
    </svg>
  )
}

export default function Paisaje({ clima, capas, children }) {
  const id = clima && CIELO[clima] ? clima : 'inicio'
  return (
    // role="img" va solo en el dibujo: si envolviera la pantalla, el lector ocultaría los botones
    <div className={`paisaje paisaje--${id}`}>
      <Cielo clima={id} capas={capas} descripcion={clima ? DESCRIPCION[clima] : 'Cielo de inicio'} />
      {children}
    </div>
  )
}
