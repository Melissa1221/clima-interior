import { useEffect, useRef, useState } from 'react'
import Paisaje from '../componentes/Paisaje.jsx'
import { CLIMAS, DESCRIPCION } from '../datos/climas.js'
import { crearSala } from '../salas/sala.js'
import { crearTransporte } from '../salas/transporte.js'
import { generarCodigo, normalizarCodigo, codigoValido, HORAS_DE_VIDA } from '../salas/mensaje.js'

const icono = (id) => CLIMAS.find((c) => c.id === id)?.icono ?? '·'
const etiqueta = (id) => CLIMAS.find((c) => c.id === id)?.etiqueta ?? ''

const FIN = {
  'salí': 'Saliste de la sala.',
  expulsado: 'La persona que creó la sala te sacó. Tus datos no se compartieron con nadie.',
  cerrada: 'La sala se cerró. Ya no queda nada guardado de ella.',
  'caducó': 'Esa sala ya no existe o caducó.',
  llena: 'La sala está llena.',
  desconectado: 'Se perdió la conexión con la sala.',
}

// Clima compartido (RF-26 a RF-29, HU-12, HU-13): ves cómo está tu grupo sin nombres ni textos
export default function Sala({ climaHoy, codigoInicial = '', permitido = true, onPermitir = () => {}, alVolver }) {
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
    if (!codigoValido(c)) return setError('El código no está completo. Son 26 letras y números; puedes pegarlo con o sin guiones.')
    entrar(c, false)
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

  if (!estado) {
    return (
      <section className="tarjeta historial sala">
        <h2>Clima compartido</h2>
        <p>Mira cómo está el clima de tu grupo, sin ver lo que cada uno contó.</p>
        <p className="rotulo">Solo se comparte el clima del día con un seudónimo que cambia cada vez. Nunca tu relato ni tus emociones.</p>
        <button className="principal" onClick={() => entrar(generarCodigo(), true)}>Crear una sala</button>
        <form className="unirse" onSubmit={unirme}>
          <label htmlFor="codigo" className="hoja__titulo">¿Te pasaron un código?</label>
          <input id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} autoComplete="off"
            placeholder="K7QF-29XM-…" aria-describedby={error ? 'error-codigo' : undefined} />
          {error && <p id="error-codigo" role="alert" className="pequeno">{error}</p>}
          <button className="secundario" type="submit" disabled={!codigo.trim()}>Unirme</button>
        </form>
        <button className="enlace" onClick={volver}>Volver al inicio</button>
      </section>
    )
  }

  if (estado.fin) {
    return (
      <section className="tarjeta historial sala" role="status">
        <h2>Fuera de la sala</h2>
        <p>{FIN[estado.fin]}</p>
        <button className="principal" onClick={() => { setEstado(null); sala.current = null }}>Entrar a otra sala</button>
        <button className="secundario" onClick={volver}>Volver al inicio</button>
      </section>
    )
  }

  const { yo, otros, colectivo } = estado
  const total = otros.length + 1
  return (
    <Paisaje clima={colectivo?.clima}>
        <section className="tarjeta colectivo" aria-live="polite">
          <p className="rotulo">Clima de la sala · {total} {total === 1 ? 'persona' : 'personas'}</p>
          {colectivo
            ? <><h2>{icono(colectivo.clima)} {etiqueta(colectivo.clima)}</h2><p className="pequeno">{DESCRIPCION[colectivo.clima]}</p></>
            : <h2>Nadie compartió su clima todavía</h2>}
        </section>

      <section className="tarjeta sala sala--dentro">
        <div className="codigo">
          <p className="rotulo">Código de la sala (caduca en {HORAS_DE_VIDA} h)</p>
          <code>{estado.codigo.split('-').map((g, i) => <span key={i}>{g}</span>)}</code>
          <button className="secundario" onClick={invitar}>Invitar</button>
          {aviso && <p className="pequeno" role="status">{aviso}</p>}
        </div>

        <div className="mi-clima">
          {yo.clima ? (
            <>
              <p>Compartes: {icono(yo.clima)} {etiqueta(yo.clima)}</p>
              <button className="secundario" onClick={() => sala.current.retirar()}>Retirar mi clima</button>
            </>
          ) : !permitido ? (
            <>
              <p className="pequeno">Compartir tu clima está apagado en Privacidad. Solo viaja el clima, nunca lo que contaste.</p>
              <button className="principal" onClick={onPermitir}>Permitir compartir mi clima</button>
            </>
          ) : climaHoy ? (
            <button className="principal" onClick={() => sala.current.compartir(climaHoy)}>
              Compartir mi clima de hoy ({icono(climaHoy)} {etiqueta(climaHoy)})
            </button>
          ) : (
            <>
              <p className="hoja__titulo">¿Qué clima compartes?</p>
              <div className="climas">
                {CLIMAS.map((c) => (
                  <button key={c.id} className="clima" onClick={() => sala.current.compartir(c.id)}>
                    <span aria-hidden="true">{c.icono}</span>{c.etiqueta}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <ul className="participantes">
          <li><span aria-hidden="true">{icono(yo.clima)}</span> {yo.seudonimo} (tú){yo.creador && ' · creaste la sala'}</li>
          {otros.map((p) => (
            <li key={p.id}>
              <span aria-hidden="true">{icono(p.clima)}</span> {p.seudonimo}
              <span className="sr">{p.clima ? `, ${etiqueta(p.clima)}` : ', sin compartir'}</span>
              {p.creador && <span className="pequeno"> · creó la sala</span>}
              {yo.creador && <button className="enlace" onClick={() => sala.current.expulsar(p.id)}>Sacar</button>}
            </li>
          ))}
        </ul>

        <p className="pequeno">{estado.transporte === 'local'
          ? 'Modo demo: la sala conecta las pestañas de este navegador.'
          : 'Conectada al servidor de salas: funciona entre dispositivos.'}</p>
        <div className="fila">
          <button className="secundario" onClick={volver}>Salir</button>
          {yo.creador && <button className="secundario" onClick={() => {
            if (window.confirm('¿Cerrar la sala para todos? Se borra y nadie más podrá entrar con este código.')) sala.current.cerrar()
          }}>Cerrar sala</button>}
        </div>
      </section>
    </Paisaje>
  )
}
