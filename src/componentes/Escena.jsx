// Composición de las pantallas v3: arriba la escena (mundo ilustrado + cabecera + voz de Garúa), abajo el suelo
// arenoso con lo que se lee y se toca. Las pantallas sin mundo usan <Plana>.
import { DESCRIPCION } from '../datos/climas.js'
import { BordeSuelo, Mundo } from '../mundo/Mundo.jsx'
import Garua from '../mundo/Garua.jsx'

// clima: el cielo; hy: la línea del horizonte en el lienzo de 375; garua: { estado, tam, x, y, animacion, etiqueta }
// (x, y = distancia de Garúa al borde derecho y al suelo, como en las pantallas de diseño)
export function Escena({ clima = 'nublado', hy = 300, suelo, flores = 'inicio', brillo, mar, lluvia, noche, capas, garua, cabecera, children, className = '', alto }) {
  return (
    <div className={`escena paisaje paisaje--${clima} ${className}`} style={alto ? { minHeight: alto } : undefined}>
      <Mundo clima={clima} hy={hy} suelo={suelo} flores={flores} brillo={brillo} mar={mar} lluvia={lluvia} noche={noche} capas={capas}
        descripcion={DESCRIPCION[clima] ?? undefined} />
      {cabecera}
      <div className="escena__cuerpo">{children}</div>
      {garua && (
        <Garua estado={garua.estado} tam={garua.tam ?? 150} animacion={garua.animacion ?? 'flotar'} etiqueta={garua.etiqueta}
          className={`escena__garua ${garua.className ?? ''}`}
          style={{ right: garua.x ?? 24, bottom: garua.y ?? 24, left: garua.izq, top: garua.arriba, ...garua.style }} />
      )}
    </div>
  )
}

export function Suelo({ children, matas = true, className = '' }) {
  return (
    <section className={`suelo ${className}`}>
      <BordeSuelo matas={matas} />
      {children}
    </section>
  )
}

// Pantalla completa: escena + suelo, con espacio para la navegación si la hay
export function Pantalla({ children, nav = false, plana = false, className = '', etiqueta, ...props }) {
  return (
    <main className={`pant ${nav ? 'pant--nav' : ''} ${plana ? 'pant--plana' : ''} ${className}`} aria-label={etiqueta} {...props}>
      {children}
    </main>
  )
}
