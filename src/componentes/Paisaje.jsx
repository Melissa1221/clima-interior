import { DESCRIPCION } from '../datos/climas.js'
import { Mundo } from '../mundo/Mundo.jsx'

// Pantalla con el mundo ilustrado de fondo (RF-01): el cielo y las lomas del clima elegido.
// role="img" va solo en el dibujo: si envolviera la pantalla, el lector ocultaría los botones.
export default function Paisaje({ clima, capas, children, className = '', hy = 420, suelo, flores = 'inicio', noche = false }) {
  const id = clima && DESCRIPCION[clima] ? clima : 'inicio'
  return (
    <div className={`paisaje paisaje--${id} ${className}`}>
      <Mundo clima={id === 'inicio' ? 'nublado' : id} capas={capas} hy={hy} suelo={suelo ?? hy + 300} flores={flores} noche={noche}
        descripcion={clima ? DESCRIPCION[clima] : 'Lomas con amancaes y cielo nublado'} />
      {children}
    </div>
  )
}
