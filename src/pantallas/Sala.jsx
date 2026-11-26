// Clima compartido (RF-26 a RF-29, HU-12, HU-13): ves cómo está tu grupo sin nombres ni textos.
// Pantallas v3 refinada grupo B: B07 inicio de salas, B08 sala activa (cada persona es una nubecita junto a Garúa)
// y B09 gestión (quien creó la sala saca a alguien o la cierra).
import { useEffect, useRef, useState } from 'react'
import Icono from '../componentes/Icono.jsx'
import { Aviso, Boton, Enlace, ElegirClima } from '../componentes/Ui.jsx'
import { Escena, Suelo } from '../componentes/Escena.jsx'
import Garua from '../mundo/Garua.jsx'
import { CLIMAS, DESCRIPCION } from '../datos/climas.js'
import { crearSala } from '../salas/sala.js'
import { crearTransporte, modoDeSalas } from '../salas/transporte.js'
import { generarCodigo, normalizarCodigo, codigoValido, HORAS_DE_VIDA } from '../salas/mensaje.js'

const etiqueta = (id) => CLIMAS.find((c) => c.id === id)?.etiqueta ?? ''
const AMIGAS = ['amiga-base', 'amiga-lavanda', 'amiga-menta', 'amiga-durazno']
// Dónde flota cada amiga en el cielo de la sala (izquierda %, abajo px)
const SITIOS = [[6, 70], [40, 118], [70, 82], [26, 14], [56, 22], [80, 150]]

// Sin servidor de salas configurado, la sala es una demo y se dice claro antes de crearla
function AvisoDemo() {
  return (
    <Aviso titulo="Modo demo, sin servidor">
      Esta sala solo conecta pestañas de este navegador. Para usarla entre teléfonos hace falta el servidor de salas.
    </Aviso>
  )
}

const FIN = {
  'salí': 'Saliste de la sala.',
  expulsado: 'La persona que creó la sala te sacó. Tus datos no se compartieron con nadie.',
  cerrada: 'La sala se cerró. Ya no queda nada guardado de ella.',
  'caducó': 'Esa sala ya no existe o caducó.',
  llena: 'La sala está llena.',
  desconectado: 'Se perdió la conexión con la sala.',
}

function Persona({ p, i, tu }) {
  const [izq, abajo] = SITIOS[i % SITIOS.length]
  return (
    <div className="amiga" style={{ left: `${izq}%`, bottom: abajo }}>
      <Garua estado={AMIGAS[i % AMIGAS.length]} tam={78} animacion="flotar" style={{ animationDelay: `${-i * 1.3}s` }} />
      <span className="amiga__nombre">{p.seudonimo}{tu && ' · tú'}
        <small>{p.clima ? <><Icono nombre={p.clima} tam={14} />{etiqueta(p.clima)}</> : 'Sin compartir'}</small>
      </span>
    </div>
  )
}

export default function Sala({ cabecera, capas, climaHoy, codigoInicial = '', permitido = true, onPermitir = () => {}, alVolver }) {
  const [estado, setEstado] = useState(null)
  const [codigo, setCodigo] = useState(codigoInicial)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)
  const sala = useRef(null)

  useEffect(() => () => sala.current?.salir(), [])

  function entrar(cod, creador) {
    setError(null)
    sala.current = crearSala({
      codigo: cod, creador, transporte: crearTransporte(cod, { crear: creador }), alCambio: setEstado,
    })
  }

  function unirme(e) {
    e.preventDefault()
    const c = normalizarCodigo(codigo)
    if (!codigoValido(c)) return setError('El código no está completo. Son 8 letras y números, como K7QF-29XM; puedes escribirlo con o sin guion.')
    entrar(c, false)
  }

  async function copiarCodigo() {
    try {
      await navigator.clipboard.writeText(estado.codigo)
      setAviso('Código copiado')
    } catch {
      setAviso(`Tu código: ${estado.codigo}`)
    }
  }

  async function invitar() {
    const enlace = `${location.origin}${location.pathname}#sala=${estado.codigo}`
    try {
      if (navigator.share) await navigator.share({ title: 'Clima Interior', text: 'Únete a mi sala de clima', url: enlace })
      else {
        await navigator.clipboard.writeText(enlace)
        setAviso('Enlace copiado')
      }
    } catch {
      setAviso(enlace)
    }
  }

  function volver() {
    sala.current?.salir()
    sala.current = null
    setEstado(null)
    alVolver()
  }

  // B07 · Salas: crear una o unirse con un código
  if (!estado) {
    return (
      <>
        <Escena clima="nublado" hy={250} suelo={330} flores="simples" brillo={[300, 140]} mar={false} capas={capas} cabecera={cabecera({ titulo: 'Sala' })} alto={330}>
          <h1 className="burbuja display-m">Mira el cielo de tu grupo</h1>
          <div className="amigas-inicio" aria-hidden="true">
            {AMIGAS.map((a, i) => <Garua key={a} estado={a} tam={70 + (i % 2) * 14} animacion="flotar" style={{ animationDelay: `${-i * 1.5}s` }} />)}
          </div>
        </Escena>
        <Suelo matas={false}>
          {modoDeSalas() === 'local' && <AvisoDemo />}
          <p className="cap"><Icono nombre="lock" tam={16} />Solo viaja el clima del día, con un seudónimo que cambia cada vez. Nunca lo que contaste.</p>
          <Boton icono="plus" onClick={() => entrar(generarCodigo(), true)}>Crear una sala</Boton>
          <form className="unirse" onSubmit={unirme}>
            <label htmlFor="codigo" className="etiqueta">¿Te pasaron un código?</label>
            <div className="unirse__fila">
              <input id="codigo" className="entrada" value={codigo} onChange={(e) => setCodigo(e.target.value)} autoComplete="off"
                placeholder="K7QF-29XM" aria-describedby={error ? 'error-codigo' : undefined} />
              <Boton tipo="linea" type="submit" disabled={!codigo.trim()}>Unirme</Boton>
            </div>
            {error && <p id="error-codigo" role="alert" className="aviso-linea"><Icono nombre="alert" tam={16} />{error}</p>}
          </form>
        </Suelo>
      </>
    )
  }

  if (estado.fin) {
    return (
      <div className="plana">
        {cabecera({ titulo: 'Sala' })}
        <section className="plana__cuerpo plana__cuerpo--centro" role="status">
          <Garua estado="sala" tam={150} animacion="ninguna" />
          <h1 className="display-m">Fuera de la sala</h1>
          <p className="cuerpo">{FIN[estado.fin]}</p>
          <div className="pila pila--centro">
            <Boton onClick={() => { setEstado(null); sala.current = null }}>Entrar a otra sala</Boton>
            <Boton tipo="texto" onClick={volver}>Volver al inicio</Boton>
          </div>
        </section>
      </div>
    )
  }

  // B08 · Sala activa (con la gestión de B09 en la misma lista, para quien la creó)
  const { yo, otros, colectivo } = estado
  const total = otros.length + 1
  const todos = [{ ...yo, tu: true }, ...otros]
  return (
    <>
      <Escena clima={colectivo?.clima ?? 'nublado'} hy={330} suelo={420} flores="simples" brillo={[300, 200]} mar={false} capas={capas}
        cabecera={cabecera({ izquierda: 'volver', etiquetaIzquierda: 'Salir de la sala', onIzquierda: volver, titulo: `${total} ${total === 1 ? 'persona' : 'personas'}` })}
        alto={420} className="escena--sala">
        <section className="colectivo" aria-live="polite">
          <p className="meta">Clima de la sala · {total} {total === 1 ? 'persona' : 'personas'}</p>
          {colectivo
            ? <><h1 className="display-m"><Icono nombre={colectivo.clima} tam={26} />{etiqueta(colectivo.clima)}</h1><p className="cuerpo">{DESCRIPCION[colectivo.clima]}</p></>
            : <h1 className="display-s">Nadie compartió su clima todavía</h1>}
        </section>
        <div className="amigas" aria-hidden="true">
          {todos.map((p, i) => <Persona key={p.id ?? 'yo'} p={p} i={i} tu={p.tu} />)}
        </div>
      </Escena>
      <Suelo matas={false}>
        {estado.transporte === 'local' && <AvisoDemo />}
        <div className="mi-clima">
          {yo.clima ? (
            <div className="mi-clima__fila">
              <p className="fila__textos"><span className="meta">Compartes</span><span className="fila__titulo"><Icono nombre={yo.clima} tam={18} />{etiqueta(yo.clima)}</span></p>
              <Boton tipo="linea" onClick={() => sala.current.retirar()}>Retirar mi clima</Boton>
            </div>
          ) : !permitido ? (
            <>
              <p className="cap"><Icono nombre="lock" tam={16} />Compartir tu clima está apagado en Privacidad. Solo viaja el clima, nunca lo que contaste.</p>
              <Boton onClick={onPermitir}>Permitir compartir mi clima</Boton>
            </>
          ) : climaHoy ? (
            <Boton icono={climaHoy} onClick={() => sala.current.compartir(climaHoy)}>Compartir mi clima de hoy ({etiqueta(climaHoy)})</Boton>
          ) : (
            <>
              <p className="etiqueta">¿Qué clima compartes?</p>
              <ElegirClima valor={null} onElegir={(c) => sala.current.compartir(c)} etiqueta="Clima que compartes" />
            </>
          )}
        </div>

        <h2 className="etiqueta">Personas en la sala · {total}</h2>
        <ul className="lista participantes">
          <li className="fila fila--participante">
            <Garua estado={AMIGAS[0]} tam={36} animacion="ninguna" />
            <span className="fila__textos"><span className="fila__titulo">{yo.seudonimo} (tú)</span>
              <small className="fila__desc">{yo.clima ? etiqueta(yo.clima) : 'Sin compartir'}</small></span>
            {yo.creador && <small className="meta">Creaste la sala</small>}
          </li>
          {otros.map((p, i) => (
            <li key={p.id} className="fila fila--participante">
              <Garua estado={AMIGAS[(i + 1) % AMIGAS.length]} tam={36} animacion="ninguna" />
              <span className="fila__textos"><span className="fila__titulo">{p.seudonimo}</span>
                <small className="fila__desc">{p.clima ? etiqueta(p.clima) : 'sin compartir'}</small></span>
              {p.creador && <small className="meta">creó la sala</small>}
              {yo.creador && <Enlace onClick={() => sala.current.expulsar(p.id)} aria-label={`Sacar a ${p.seudonimo}`}>Sacar</Enlace>}
            </li>
          ))}
        </ul>

        <div className="codigo">
          <p className="meta">Código · caduca en {HORAS_DE_VIDA} h</p>
          <code className="codigo__valor">{estado.codigo}</code>
          <div className="fila-botones">
            <Boton tipo="linea" icono="copy" onClick={copiarCodigo} aria-label={`Copiar el código ${estado.codigo}`}>Copiar</Boton>
            <Boton tipo="linea" icono="share" onClick={invitar}>Invitar</Boton>
          </div>
          {aviso && <p className="cap" role="status">{aviso}</p>}
        </div>

        <p className="cap"><Icono nombre="lock" tam={16} />Nadie ve lo que contaste ni tus emociones.{estado.transporte === 'local'
          ? '' : ' Conectada al servidor de salas: funciona entre dispositivos.'}</p>
        <div className="pila">
          {yo.creador && <Boton tipo="linea" icono="close" onClick={() => {
            if (window.confirm('¿Cerrar la sala para todos? Se borra y nadie más podrá entrar con este código.')) sala.current.cerrar()
          }}>Cerrar sala</Boton>}
          <Boton tipo="texto" onClick={volver}>Salir</Boton>
        </div>
      </Suelo>
    </>
  )
}
