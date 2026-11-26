// Historial (grupo A · 12 a 14): 30 días como mini cielos. Los días sin registro no son un fallo (RF-43):
// el cielo sigue despejado, sin rachas ni reproches. Cada día con registro abre su detalle.
import { useState } from 'react'
import Icono from '../componentes/Icono.jsx'
import { Boton, Enlace } from '../componentes/Ui.jsx'
import { Escena, Suelo } from '../componentes/Escena.jsx'
import { CLIMAS, DESCRIPCION } from '../datos/climas.js'
import { TECNICAS, fraseResumen, resumenRefugios } from '../datos/refugio.js'
import Garua, { POSE_DE_CLIMA } from '../mundo/Garua.jsx'

const etiquetaDe = (id) => CLIMAS.find((c) => c.id === id)?.etiqueta ?? ''
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const aFecha = (f) => new Date(`${f}T12:00:00`)
export const fechaLarga = (f, { dia = true } = {}) => {
  const d = aFecha(f)
  const t = `${d.getDate()} de ${MESES[d.getMonth()]}`
  return dia ? `${DIAS[d.getDay()][0].toUpperCase()}${DIAS[d.getDay()].slice(1)} ${t}` : t
}
// En el diario es una lista; en los datos de ejemplo, un texto
export const emocionesDe = (r) => [].concat(r.emocion_declarada ?? []).join(', ') || 'no sé'

function Transicion({ antes, despues }) {
  return (
    <span className="transicion">
      <Icono nombre={antes} tam={16} />{etiquetaDe(antes)}<Icono nombre="arrow" tam={16} className="transicion__flecha" />
      <Icono nombre={despues} tam={16} />{etiquetaDe(despues)}
      <span className="sr">: de {etiquetaDe(antes).toLowerCase()} a {etiquetaDe(despues).toLowerCase()}</span>
    </span>
  )
}

// Lo que te ayudó: cuántos respiros y cómo suele quedar el cielo con cada técnica (en climas, nunca en puntajes)
export function LoQueTeAyudo({ refugios }) {
  const resumen = resumenRefugios(refugios)
  if (!resumen.length) return null
  const n = refugios.length
  return (
    <section className="ayudo" aria-labelledby="ayudo-titulo">
      <h2 id="ayudo-titulo" className="titulo-s">Lo que te ayudó</h2>
      <p className="meta">Te diste {n === 1 ? '1 respiro' : `${n} respiros`}. Así suele quedar tu cielo con cada técnica:</p>
      <ul className="lista">
        {resumen.map((t) => (
          <li key={t.tecnica} className="fila fila--columna">
            <span className="fila__titulo">{TECNICAS[t.tecnica].titulo}</span>
            <Transicion antes={t.antes} despues={t.despues} />
            <small className="fila__desc">{fraseResumen(t)}</small>
          </li>
        ))}
      </ul>
    </section>
  )
}

// 30 días alineados por día de la semana (L a D)
function Calendario({ dias, onDia, onVacio }) {
  const hoy = new Date().toLocaleDateString('en-CA')
  const desfase = (aFecha(dias[0].fecha).getDay() + 6) % 7
  return (
    <>
      <div className="semana-dias" aria-hidden="true">{'LMMJVSD'.split('').map((d, i) => <span key={i}>{d}</span>)}</div>
      <ol className="calendario" aria-label="Últimos 30 días">
        {dias.map(({ fecha, r, registros = [] }, i) => {
          const nombre = fechaLarga(fecha)
          const estilo = i === 0 && desfase ? { gridColumnStart: desfase + 1 } : undefined
          const n = Number(fecha.slice(8))
          return (
            <li key={fecha} style={estilo} className={r ? `dia dia--${r.clima} paisaje--${r.clima}` : 'dia dia--vacio'}>
              {r ? (
                <button type="button" className="dia__cielo" onClick={() => onDia(fecha)}
                  aria-label={`${nombre}: ${DESCRIPCION[r.clima]} Emoción: ${emocionesDe(r)}${registros.length > 1 ? `. ${registros.length} registros` : ''}${fecha === hoy ? ', hoy' : ''}`}>
                  <span className={`dia__n ${fecha === hoy ? 'dia__n--hoy' : ''}`} aria-hidden="true">{n}</span>
                  <span className="dia__i" aria-hidden="true"><Icono nombre={r.clima} tam={16} /></span>
                  {registros.length > 1 && <span className="dia__varios" aria-hidden="true">{registros.length}</span>}
                </button>
              ) : (
                // B8: tocar un día vacío responde (con el puntero; para el lector ya dice «sin registro»)
                <span className="dia__cielo dia__cielo--vacio" onClick={() => onVacio?.(fecha)}>
                  <span className={`dia__n ${fecha === hoy ? 'dia__n--hoy' : ''}`} aria-hidden="true">{n}</span>
                  <span className="sr">{nombre}: sin registro, cielo despejado</span>
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </>
  )
}

export function Historial({ cabecera, dias, demo, registros, refugios, onDia, onAlternarDemo }) {
  const [vacio, setVacio] = useState(null)
  const hoy = new Date().toLocaleDateString('en-CA')
  // B14: rango corto («28 oct – 26 nov») para que la cabecera no se parta en dos líneas
  const corta = (f) => { const d = aFecha(f); return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}` }
  const rango = `${corta(dias[0].fecha)} – ${corta(dias.at(-1).fecha)}`
  const rangoLargo = `del ${fechaLarga(dias[0].fecha, { dia: false })} al ${fechaLarga(dias.at(-1).fecha, { dia: false })}`
  return (
    <div className="plana plana--cielo">
      {cabecera}
      <section className="plana__cuerpo historial" aria-labelledby="historial-titulo">
        <div className="historial__cabeza">
          <div className="fecha"><h1 id="historial-titulo" className="titulo-s">Tus últimos 30 días</h1><span className="etiqueta-sm"><span aria-hidden="true">{rango}</span><span className="sr">{rangoLargo}</span></span></div>
          {registros > 0 && <Enlace className="historial__alternar" onClick={onAlternarDemo}>{demo ? 'Mis registros' : 'Ver ejemplo'}</Enlace>}
        </div>
        <p className="meta" role="status">{demo ? 'Modo demo: datos simulados, no son de una persona real' : `${registros} ${registros === 1 ? 'día registrado' : 'días registrados'}`}</p>
        <Calendario dias={dias} onDia={onDia} onVacio={setVacio} />
        {vacio && <p className="cap" role="status"><Icono nombre="info" tam={16} />{vacio === hoy && !demo
          ? 'Hoy todavía no registras tu cielo. Puedes hacerlo en Inicio.'
          : `${fechaLarga(vacio)}: sin registro. Está bien, no es un fallo.`}</p>}
        <p className="cap"><Icono nombre="info" tam={16} />Los días sin registro no son un fallo: el cielo sigue despejado.</p>
        <LoQueTeAyudo refugios={refugios} />
      </section>
    </div>
  )
}

// 13 · Detalle de un día: todos sus registros, del primero al último (un día puede tener varios)
function Registro({ registro, clima, varios }) {
  const frase = registro.transcripcion?.match(/^[^.?!]*[.?!]?/)?.[0]?.trim()
  return (
    <article className="detalle__registro">
      <div className="detalle__clima">
        <Icono nombre={clima} tam={26} />
        <p className="fila__textos"><span className="titulo-s">{etiquetaDe(clima) || 'Cielo neutro'}</span><small className="meta">{DESCRIPCION[clima]}</small></p>
        {registro.hora && <span className="meta">{varios ? <span className="sr">Registro de las </span> : null}{registro.hora}</span>}
      </div>
      {frase && (
        <div className="detalle__bloque">
          <p className="meta">Me contaste</p>
          <blockquote className="cita">«{frase}»</blockquote>
        </div>
      )}
      <dl className="detalle__datos">
        <div><dt className="meta">Lo que sentiste</dt><dd className="cuerpo">{emocionesDe(registro)}</dd></div>
      </dl>
    </article>
  )
}

export function DetalleDia({ cabecera, capas, registros, refugios = [], neutral }) {
  const climaDe = (r) => (neutral && r.clima === 'tormenta' ? 'neutral' : r.clima)
  const clima = climaDe(registros.at(-1))
  const varios = registros.length > 1
  return (
    <>
      <Escena clima={clima} hy={200} suelo={300} flores="simples" brillo={[80, 120]} mar={false} capas={capas} cabecera={cabecera}
        garua={{ estado: POSE_DE_CLIMA[clima], tam: 130, x: 'calc(50% - 65px)', y: 12 }} alto={300} />
      <Suelo matas={false}>
        <h1 className="sr">{fechaLarga(registros[0].fecha)}</h1>
        {varios && <p className="meta">{registros.length} registros este día</p>}
        {registros.map((r, i) => <Registro key={`${r.hora}-${i}`} registro={r} clima={climaDe(r)} varios={varios} />)}
        {refugios.length > 0 && (
          <dl className="detalle__datos">
            {refugios.map((r, i) => (
              <div key={i}><dt className="meta">Tu respiro</dt><dd className="cuerpo">{TECNICAS[r.tecnica]?.titulo} <Transicion antes={r.antes} despues={r.despues} /></dd></div>
            ))}
          </dl>
        )}
      </Suelo>
    </>
  )
}

// 14 · Historial vacío: sin culpa, con la demo a un toque
export function HistorialVacio({ cabecera, onContar, onDemo, sinVoz = false }) {
  return (
    <div className="plana plana--cielo">
      {cabecera}
      <section className="plana__cuerpo vacio" aria-labelledby="vacio-titulo">
        <p className="fecha"><span className="titulo-s">Tus últimos 30 días</span></p>
        <Garua estado="historial-vacio" tam={200} className="vacio__garua" />
        <h1 id="vacio-titulo" className="display-m">Todavía no hay días</h1>
        <p className="cuerpo">Cuando cuentes tu primer día, aquí aparecerá su cielo. Sin apuro.</p>
        <div className="pila pila--centro">
          <Boton icono={sinVoz ? 'pen' : 'mic'} onClick={onContar}>Contar mi día</Boton>
          <Boton tipo="texto" onClick={onDemo}>Mirar 30 días de ejemplo</Boton>
        </div>
      </section>
    </div>
  )
}
