import { useEffect, useRef } from 'react'
import Icono from './Icono.jsx'

// Botón del Figma: 52 px de alto, tipos primario / secundario / fantasma / ayuda / velo
export function Boton({ tipo = 'primario', icono, children, className = '', ...props }) {
  return (
    <button className={`btn btn--${tipo} ${className}`} {...props}>
      {icono && <Icono nombre={icono} />}
      <span>{children}</span>
    </button>
  )
}

// Ayuda contextual a la izquierda y «Salir por hoy» siempre visible (RF-24, RF-34)
export function BarraSuperior({ fondo = 'claro', soloAyuda = false, onAyuda, onSalir }) {
  return (
    <header className={`barra barra--${fondo} ${soloAyuda ? 'barra--derecha' : ''}`}>
      <button className="btn-icono" onClick={onAyuda} aria-label="Ayuda contextual"><Icono nombre="ayuda" /></button>
      {!soloAyuda && <Boton tipo={fondo === 'paisaje' ? 'velo' : 'secundario'} icono="salir" onClick={onSalir}>Salir por hoy</Boton>}
    </header>
  )
}

// Interruptor de 56×32 dentro de una fila de objetivo táctil completo. El estado se ve por posición, check y relleno (RNF-06)
export function FilaAjuste({ titulo, descripcion, activo, onCambio }) {
  return (
    <button type="button" role="switch" aria-checked={activo} className="fila-ajuste" onClick={() => onCambio(!activo)}>
      <span className="fila-ajuste__textos">
        <strong>{titulo}</strong>
        {descripcion && <small>{descripcion}</small>}
      </span>
      <span className="interruptor" aria-hidden="true">
        <span className="interruptor__perilla">{activo && <Icono nombre="check" tam={16} />}</span>
      </span>
    </button>
  )
}

// Equivalente visual de toda alerta sonora; los errores se anuncian con role="alert" (RNF-03)
export function Aviso({ tipo = 'info', titulo, children, vibra = false }) {
  const icono = tipo === 'info' ? 'info' : tipo === 'exito' ? 'check' : 'alerta'
  return (
    <div className={`aviso aviso--${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <Icono nombre={icono} />
      <div className="aviso__textos"><strong>{titulo}</strong>{children && <small>{children}</small>}</div>
      {vibra && <span className="aviso__vibra"><Icono nombre="vibrar" tam={19} /><small>vibra</small></span>}
    </div>
  )
}

export function Progreso({ paso, total }) {
  return (
    <div className="progreso">
      <small id="progreso-texto">Paso {paso} de {total}</small>
      <div className="progreso__barra" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={paso} aria-labelledby="progreso-texto">
        <div className="progreso__relleno" style={{ width: `${(paso / total) * 100}%` }} />
      </div>
    </div>
  )
}

// Opción excluyente con tarjeta grande (S02)
export function Opcion({ marcada, onElegir, children }) {
  return (
    <button type="button" role="radio" aria-checked={marcada} className={marcada ? 'opcion opcion--marcada' : 'opcion'} onClick={onElegir}>
      <span className="opcion__circulo" aria-hidden="true">{marcada && <span />}</span>
      <strong>{children}</strong>
    </button>
  )
}

// Etiqueta siempre visible; foco con borde de 3 px (S43, S45)
export function Campo({ id, etiqueta, estado, ...props }) {
  return (
    <div className={`campo ${estado ? `campo--${estado}` : ''}`}>
      <label htmlFor={id}>{etiqueta}</label>
      <input id={id} {...props} />
    </div>
  )
}

// Diálogo de ayuda contextual: se cierra con Escape y devuelve el foco al botón que lo abrió
export function Ayuda({ titulo, children, onCerrar }) {
  const ref = useRef(null)
  useEffect(() => {
    const previo = document.activeElement
    ref.current?.focus()
    const alTecla = (e) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', alTecla)
    return () => { document.removeEventListener('keydown', alTecla); previo?.focus?.() }
  }, [onCerrar])
  return (
    <div className="velo" onClick={onCerrar}>
      <section className="dialogo" role="dialog" aria-modal="true" aria-labelledby="ayuda-titulo" onClick={(e) => e.stopPropagation()}>
        <h2 id="ayuda-titulo">{titulo}</h2>
        <div className="dialogo__cuerpo">{children}</div>
        <button ref={ref} className="btn btn--primario" onClick={onCerrar}><span>Entendido</span></button>
      </section>
    </div>
  )
}

// Barra de pestañas: cada una es un objetivo de 84×60 px; la activa se marca con fondo, negrita y color (no solo color)
export function Pestanas({ actual, onIr }) {
  const items = [['inicio', 'inicio', 'Inicio'], ['historial', 'calendario', 'Historial'], ['perfil', 'perfil', 'Perfil']]
  return (
    <nav className="pestanas" aria-label="Secciones">
      {items.map(([id, icono, etiqueta]) => (
        <button key={id} className="pestana" aria-current={actual === id ? 'page' : undefined} onClick={() => onIr(id)}>
          <Icono nombre={icono} />{etiqueta}
        </button>
      ))}
    </nav>
  )
}
