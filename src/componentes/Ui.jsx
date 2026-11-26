// Primitivas del sistema v3 refinada: botón (sólido / en línea / texto / peligro), enlace, interruptor, fila de lista,
// cabecera con «Aa» y «Ayuda ya», navegación inferior, hoja inferior, aviso, progreso, campo y fila de climas.
import { useEffect, useRef } from 'react'
import Icono from './Icono.jsx'
import { CLIMAS } from '../datos/climas.js'

const TIPOS = { primario: 'solido', solido: 'solido', secundario: 'linea', linea: 'linea', velo: 'linea', fantasma: 'texto', texto: 'texto', peligro: 'peligro' }

// Un solo sólido por pantalla; lo demás en línea o como texto subrayado
export function Boton({ tipo = 'solido', icono, children, className = '', type = 'button', ...props }) {
  const t = TIPOS[tipo] ?? 'solido'
  return (
    <button type={type} className={`b b-${t} ${className}`} {...props}>
      {icono && <Icono nombre={icono} tam={20} />}
      {t === 'texto' ? <span>{children}</span> : children}
    </button>
  )
}

// Enlace de texto (15/500 subrayado) que actúa como botón
export function Enlace({ children, className = '', icono, ...props }) {
  return (
    <button type="button" className={`enlace ${className}`} {...props}>
      {icono && <Icono nombre={icono} tam={20} />}{children}
    </button>
  )
}

// Interruptor dentro de una fila de objetivo táctil completo. El estado se ve por posición, relleno y lectura (RNF-06)
export function FilaAjuste({ titulo, descripcion, activo, onCambio, icono }) {
  return (
    <button type="button" role="switch" aria-checked={activo} className="fila fila--sw" onClick={() => onCambio(!activo)}>
      {icono && <span className="fila__icono"><Icono nombre={icono} tam={22} /></span>}
      <span className="fila__textos">
        <span className="fila__titulo">{titulo}</span>
        {descripcion && <small className="fila__desc">{descripcion}</small>}
      </span>
      <span className="sw" aria-hidden="true" />
    </button>
  )
}

// Fila de lista que lleva a otra pantalla
export function FilaLista({ icono, titulo, descripcion, onClick, chevron = true, children }) {
  return (
    <button type="button" className="fila" onClick={onClick}>
      {icono && <span className="fila__icono"><Icono nombre={icono} tam={22} /></span>}
      <span className="fila__textos">
        <span className="fila__titulo">{titulo}</span>
        {descripcion && <small className="fila__desc">{descripcion}</small>}
        {children}
      </span>
      {chevron && <span className="fila__chev"><Icono nombre="chev" tam={20} /></span>}
    </button>
  )
}

// Cabecera: a la izquierda «Aa» (pantallas raíz) o volver/cerrar, y la ayuda contextual; a la derecha «Ayuda ya»
// titulo: el nombre de la pantalla al centro; con esTitulo es el h1 de la pantalla (listas de Perfil, Sala)
export function Cabecera({ izquierda = 'aa', etiquetaIzquierda, onIzquierda, onAyuda, onAyudaYa, titulo, esTitulo = false, children }) {
  // Un título largo no cabe entre los botones (quedaba «Volver al pr…»): baja a su propia línea, completo
  const abajo = typeof titulo === 'string' && titulo.length > 12
  return (
    <header className={`cabecera ${abajo ? 'cabecera--titulo-abajo' : ''}`}>
      <div className="cabecera__izq">
        {izquierda === 'aa' && (
          <button type="button" className="ib ib-aa" aria-label="Accesibilidad: texto, movimiento y sonido" onClick={onIzquierda}>
            <span aria-hidden="true">Aa</span>
          </button>
        )}
        {(izquierda === 'volver' || izquierda === 'cerrar') && (
          <button type="button" className="ib" aria-label={etiquetaIzquierda ?? (izquierda === 'volver' ? 'Volver' : 'Cerrar')} onClick={onIzquierda}>
            <Icono nombre={izquierda === 'volver' ? 'back' : 'close'} tam={22} />
          </button>
        )}
        {onAyuda && (
          <button type="button" className="ib ib--plano" aria-label="Ayuda contextual" onClick={onAyuda}><Icono nombre="help" tam={22} /></button>
        )}
      </div>
      {titulo && (esTitulo ? <h1 className="cabecera__titulo">{titulo}</h1> : <span className="cabecera__titulo" aria-hidden="true">{titulo}</span>)}
      {children}
      {onAyudaYa && (
        <button type="button" className="ayuda-ya" onClick={onAyudaYa} aria-label="Ayuda ya: líneas de apoyo">
          <Icono nombre="phone" tam={18} />Ayuda ya
        </button>
      )}
    </header>
  )
}

// Navegación inferior: la activa se marca con tinta, peso 500 y una línea azul arriba (no solo color)
export function Pestanas({ actual, onIr }) {
  const items = [['inicio', 'Inicio'], ['historial', 'Historial'], ['sala', 'Sala'], ['perfil', 'Perfil']]
  return (
    <nav className="nav" aria-label="Secciones">
      {items.map(([id, etiqueta]) => (
        <button key={id} type="button" className="nav__item" aria-current={actual === id ? 'page' : undefined} onClick={() => onIr(id)}>
          <Icono nombre={id} tam={24} />{etiqueta}
        </button>
      ))}
    </nav>
  )
}

const ENFOCABLES = 'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Mantiene el Tab dentro de un contenedor modal: del último control vuelve al primero y al revés
export function atraparFoco(e, contenedor) {
  if (e.key !== 'Tab' || !contenedor) return
  const lista = [...contenedor.querySelectorAll(ENFOCABLES)].filter((el) => el.offsetParent !== null || el === document.activeElement)
  if (!lista.length) { e.preventDefault(); return }
  const [primero, ultimo] = [lista[0], lista.at(-1)]
  const dentro = contenedor.contains(document.activeElement)
  if (e.shiftKey && (document.activeElement === primero || document.activeElement === contenedor || !dentro)) { e.preventDefault(); ultimo.focus() }
  else if (!e.shiftKey && (document.activeElement === ultimo || !dentro)) { e.preventDefault(); primero.focus() }
}

// Hoja inferior modal: atrapa el foco (lo de atrás queda inerte), se cierra con Escape o tocando el velo
// y devuelve el foco a quien la abrió
export function HojaInferior({ titulo, id = 'hoja-titulo', onCerrar, cerrable = true, children, extra }) {
  const ref = useRef(null)
  // Se lee al renderizar: al abrirse la hoja, <main> queda inerte y el navegador le quita el foco al botón
  const previo = useRef(document.activeElement)
  useEffect(() => {
    ref.current?.focus()
    const alTecla = (e) => {
      if (e.key === 'Escape' && cerrable) onCerrar?.()
      atraparFoco(e, ref.current)
    }
    document.addEventListener('keydown', alTecla)
    return () => { document.removeEventListener('keydown', alTecla); setTimeout(() => {
      // si la hoja llevó a otra pantalla, el foco ya está en su título: no se pisa
      const a = document.activeElement
      if (!a || a === document.body || a.closest('.velo')) previo.current?.focus?.()
    }, 0) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="velo" onClick={() => cerrable && onCerrar?.()}>
      <section ref={ref} tabIndex={-1} className="hoja" role="dialog" aria-modal="true" aria-labelledby={id} onClick={(e) => e.stopPropagation()}>
        <span className="hoja__asa" aria-hidden="true" />
        <div className="hoja__cabeza">
          <h2 id={id}>{titulo}</h2>
          {extra}
          {cerrable && onCerrar && (
            <button type="button" className="ib ib--plano" aria-label="Cerrar" onClick={onCerrar}><Icono nombre="close" tam={22} /></button>
          )}
        </div>
        {children}
      </section>
    </div>
  )
}

// Ayuda contextual (RF-24) como hoja inferior, con salida a crisis siempre a mano
export function Ayuda({ titulo, children, onCerrar, onMasAyuda }) {
  return (
    <HojaInferior titulo={titulo} id="ayuda-titulo" onCerrar={onCerrar}>
      <div className="hoja__cuerpo">{children}</div>
      <div className="pila pila--centro">
        <Boton onClick={onCerrar}>Entendido</Boton>
        {onMasAyuda && <Enlace onClick={onMasAyuda}>Necesito más ayuda</Enlace>}
      </div>
    </HojaInferior>
  )
}

// Equivalente visual de toda alerta sonora; los errores se anuncian con role="alert" (RNF-03)
export function Aviso({ tipo = 'info', titulo, children, vibra = false }) {
  const icono = tipo === 'info' ? 'info' : tipo === 'exito' ? 'check' : 'alert'
  return (
    <div className={`aviso aviso--${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <Icono nombre={icono} tam={20} />
      <div className="aviso__textos"><strong className="aviso__titulo">{titulo}</strong>{children && <small>{children}</small>}</div>
      {vibra && <span className="aviso__vibra"><Icono nombre="vibrate" tam={20} /><small>vibra</small></span>}
    </div>
  )
}

// Progreso en rayitas, con su lectura para lectores de pantalla
export function Progreso({ paso, total, etiqueta }) {
  return (
    <div className="progreso">
      <div className="rayas" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={paso} aria-label={etiqueta ?? `Paso ${paso} de ${total}`}>
        {Array.from({ length: total }, (_, i) => <i key={i} className={i < paso ? 'hecho' : ''} />)}
      </div>
    </div>
  )
}

// Etiqueta siempre visible; foco con anillo azul. multilinea: textarea que crece con el texto (no lo corta)
export function Campo({ id, etiqueta, estado, multilinea = false, ...props }) {
  return (
    <div className={`campo ${estado ? `campo--${estado}` : ''}`}>
      <label htmlFor={id}>{etiqueta}</label>
      {multilinea
        ? <textarea id={id} rows={2} className="campo__area" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit() } }} {...props} />
        : <input id={id} {...props} />}
    </div>
  )
}

// Grupo de opciones (patrón radio de ARIA, M7): una sola parada de Tab; las flechas, Inicio y Fin mueven y eligen
const TECLAS_RADIO = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: 'primero', End: 'ultimo' }
export function teclasRadio(e) {
  const paso = TECLAS_RADIO[e.key]
  if (paso === undefined) return
  const radios = [...e.currentTarget.querySelectorAll('[role="radio"]')]
  const i = radios.indexOf(document.activeElement)
  if (i < 0) return
  e.preventDefault()
  const j = paso === 'primero' ? 0 : paso === 'ultimo' ? radios.length - 1 : (i + paso + radios.length) % radios.length
  radios[j].focus()
  radios[j].click()
}
// tabIndex de cada opción: la elegida (o la primera, si no hay) es la que recibe el Tab
export const tabRadio = (marcado, indice, hayMarcado) => (marcado || (!hayMarcado && indice === 0) ? 0 : -1)

// Los cinco climas como opciones excluyentes, con su ícono de línea
export function ElegirClima({ valor, onElegir, etiqueta, id }) {
  const hay = CLIMAS.some((c) => c.id === valor)
  return (
    <div className="climas" role="radiogroup" aria-label={etiqueta} id={id} onKeyDown={teclasRadio}>
      {CLIMAS.map((c, i) => (
        <button key={c.id} type="button" role="radio" aria-checked={valor === c.id} tabIndex={tabRadio(valor === c.id, i, hay)}
          className={`tok tok--${c.id}`} onClick={() => onElegir(c.id)}>
          <Icono nombre={c.id} tam={26} /><span className="tok__lbl">{c.etiqueta}</span>
        </button>
      ))}
    </div>
  )
}
