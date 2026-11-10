import { useEffect, useRef, useState } from 'react'
import { proponerEmociones, proveedorActivo } from './llm/index.js'
import { crearGrabacion, decir, sttDisponible } from './voz/stt.js'
import {
  leerPerfil, guardarRegistro, registrarFalloMic, pedirMasCorto, personalizarPropuesta, contextoParaLLM, notaDeRitmo,
} from './datos/perfil.js'
import { hayRiesgo, RECURSOS } from './datos/riesgo.js'
import Perfil from './pantallas/Perfil.jsx'
import Sala from './pantallas/Sala.jsx'
import { CLIMAS, DESCRIPCION, Paisaje } from './componentes/Paisaje.jsx'

const SEG_SUGERIR_CIERRE = 60

// Fecha en la zona del usuario: con toISOString un registro de las 20:00 en Lima caía en el día siguiente
const fechaLocal = (d) => d.toLocaleDateString('en-CA')

// 30 días seguidos, incluidos los que no tienen registro (RF-43: sin rachas que castiguen).
// La demo empieza en su primer registro; el historial real termina hoy.
function treintaDias(registros, { terminaHoy = false } = {}) {
  const porFecha = Object.fromEntries(registros.map((r) => [r.fecha, r]))
  const inicio = terminaHoy ? new Date() : new Date(`${registros[0].fecha}T12:00:00`)
  if (terminaHoy) inicio.setDate(inicio.getDate() - 29)
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(inicio)
    d.setDate(d.getDate() + i)
    const fecha = fechaLocal(d)
    return { fecha, r: porFecha[fecha] }
  })
}

function saludo() {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}
// En el diario es una lista; en los datos de ejemplo, un texto
const emociones = (r) => [].concat(r.emocion_declarada ?? []).join(', ') || 'no sé'
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export default function App() {
  const [perfil, setPerfil] = useState(leerPerfil)
  // Un enlace de invitación (#sala=CÓDIGO) abre directo la sala
  const leerInvitacion = () => new URLSearchParams(location.hash.slice(1)).get('sala') ?? ''
  const [codigoInvitacion, setCodigoInvitacion] = useState(leerInvitacion)
  const [pantalla, setPantalla] = useState(codigoInvitacion ? 'sala' : 'inicio')
  const [clima, setClima] = useState(null)
  const [texto, setTexto] = useState('')
  const [grabando, setGrabando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const [propuesta, setPropuesta] = useState(null)
  const [elegidas, setElegidas] = useState([])
  const [demo, setDemo] = useState(null)
  const [errorMic, setErrorMic] = useState(null)
  const rec = useRef(null)
  const inicioCheckin = useRef(null) // para aprender cuánto dura tu check-in (RF-21)
  const consulta = useRef(0) // invalida respuestas del LLM que llegan después de salir

  // También si el enlace llega con la app ya abierta (p. ej. instalada como PWA)
  useEffect(() => {
    const alCambiar = () => {
      const c = leerInvitacion()
      if (!c) return
      setCodigoInvitacion(c)
      setPantalla('sala')
    }
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  useEffect(() => {
    if (!grabando) return
    const t = setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [grabando])

  function guardar(extra = {}) {
    const ahora = new Date()
    const registro = {
      fecha: fechaLocal(ahora),
      hora: ahora.toTimeString().slice(0, 5),
      clima,
      emocion_declarada: extra.emociones?.length ? extra.emociones : null,
      emocion_inferida: propuesta?.emociones.map((e) => e.nombre) ?? null,
      transcripcion: texto || null,
    }
    const segundos = inicioCheckin.current ? Math.round((Date.now() - inicioCheckin.current) / 1000) : undefined
    setPerfil((p) => guardarRegistro(p, registro, { segundos }))
    setPantalla('guardado')
  }

  function empezarGrabacion() {
    setPantalla('contar')
    if (!sttDisponible()) return
    setErrorMic(null)
    const previo = texto.trim() // volver a grabar agrega al texto, no lo borra
    rec.current = crearGrabacion({
      alTexto: (t) => setTexto(previo ? `${previo} ${t}` : t),
      alError: (e) => {
        setGrabando(false)
        setPerfil(registrarFalloMic)
        setErrorMic(e === 'not-allowed' || e === 'service-not-allowed'
          ? 'El micrófono está bloqueado. Puedes escribirlo aquí; tu clima sigue guardado.'
          : 'No pudimos escucharte. Puedes escribirlo aquí o volver a intentar.')
      },
      alTerminar: () => setGrabando(false),
    })
    try {
      rec.current.start()
      setSegundos(0)
      setGrabando(true)
    } catch {
      setErrorMic('No pudimos usar el micrófono. Puedes escribirlo aquí.')
    }
  }

  function detenerMic() {
    rec.current?.abort?.()
    rec.current = null
    setGrabando(false)
  }

  function terminarMic() {
    rec.current?.stop?.()
    setGrabando(false)
  }

  function escribir() {
    detenerMic()
    setErrorMic(null)
    setPantalla('contar')
  }

  async function listo() {
    detenerMic()
    if (hayRiesgo(texto)) return setPantalla('riesgo')
    setPantalla('pensando')
    const id = ++consulta.current
    const r = await proponerEmociones(texto, { contexto: contextoParaLLM(perfil) })
    if (id !== consulta.current) return
    setPropuesta(personalizarPropuesta(perfil, r))
    setElegidas([])
    setPantalla('emociones')
  }

  // HU-08: la persona corrige el tono; al tercer pedido el perfil lo recuerda
  function masCorto() {
    setPerfil(pedirMasCorto)
    setPropuesta((p) => ({ ...p, reflexion: p.reflexion.match(/^[^.?!]*[.?!]/)?.[0] ?? p.reflexion }))
  }

  // Historial con tus registros; si aún no hay, o si lo pides, el de ejemplo
  async function abrirHistorial(verDemo = perfil.registros.length === 0) {
    if (verDemo) {
      const res = await fetch('/demo/registros-30-dias.json')
      setDemo(await res.json())
    } else {
      setDemo(null)
    }
    setPantalla('semana')
  }

  const reiniciar = () => {
    detenerMic()
    consulta.current++
    setErrorMic(null)
    inicioCheckin.current = null
    setClima(null); setTexto(''); setPropuesta(null); setElegidas([]); setPantalla('inicio')
  }

  const ultimo = perfil.registros.at(-1)
  const climaHoy = ultimo?.fecha === fechaLocal(new Date()) ? ultimo.clima : null
  const porTexto = perfil.preferencias.entrada === 'texto' && perfil.activas.entrada

  return (
    <main className="app">
      <header className="barra">
        <a className="salir" href="#" onClick={(e) => { e.preventDefault(); reiniciar() }}>⇥ Salir por hoy</a>
      </header>

      {pantalla === 'inicio' && (
        <Paisaje clima={clima}>
          <section className="saludo">
            <h1>{saludo()}</h1>
            <p>¿Cómo fue tu día?</p>
            {notaDeRitmo(perfil) && <p className="pequeno">{notaDeRitmo(perfil)}</p>}
          </section>
          {perfil.registros.at(-1) && (
            <p className="ayer">Último registro: {DESCRIPCION[perfil.registros.at(-1).clima]}</p>
          )}
          <section className="hoja">
            <p className="hoja__titulo">¿Qué clima hay hoy?</p>
            <div className="climas" role="radiogroup" aria-label="Clima del día">
              {CLIMAS.map((c) => (
                <button key={c.id} role="radio" aria-checked={clima === c.id}
                  className={clima === c.id ? 'clima activo' : 'clima'}
                  onClick={() => { inicioCheckin.current ??= Date.now(); setClima(c.id) }}>
                  <span aria-hidden="true">{c.icono}</span>{c.etiqueta}
                </button>
              ))}
            </div>
            {porTexto && <p className="pequeno">Como el micrófono falló, empezamos escribiendo. Puedes hablar cuando quieras.</p>}
            <div className="contar">
              <button className="mic-grande" disabled={!clima} onClick={porTexto ? escribir : empezarGrabacion}
                aria-label={porTexto ? 'Escribir mi día' : 'Contar mi día por voz'}>
                {porTexto ? <span aria-hidden="true" className="icono-lapiz">✎</span> : <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>}
              </button>
              <div>
                <h2>{porTexto ? "Escribir mi día" : "Contar mi día"}</h2>
                <p className="pequeno">{porTexto ? 'Unas líneas bastan.' : 'Más o menos 1 minuto. Puedes cambiar a texto cuando quieras.'}</p>
              </div>
            </div>
            <div className="fila">
              {porTexto
                ? <button className="secundario" disabled={!clima} onClick={empezarGrabacion}>🎙️ Hablar</button>
                : <button className="secundario" disabled={!clima} onClick={escribir}>✎ Escribir</button>}
              <button className="secundario" disabled={!clima} onClick={() => guardar()}>Así está bien (10 s)</button>
            </div>
          </section>
        </Paisaje>
      )}

      {pantalla === 'contar' && grabando && (
        <Paisaje clima={clima}>
          <div className="grabando">
            <p className="pildora" aria-live="polite"><span className="punto" /> Micrófono activo · {mmss(segundos)}</p>
            <div className="reloj" style={{ '--avance': `${Math.min(segundos / SEG_SUGERIR_CIERRE, 1) * 360}deg` }}>
              <div><strong>{mmss(segundos)}</strong><span>de ~1:00</span></div>
            </div>
            {segundos >= SEG_SUGERIR_CIERRE && <p className="pildora">Ya va un minuto. Termina cuando cierres la idea.</p>}
            <p className="transcripcion" aria-live="polite">{texto ? `«${texto}»` : 'Te escucho…'}</p>
          </div>
          <section className="controles">
            <button className="ctrl" onClick={reiniciar}><span>✕</span>Cancelar</button>
            <button className="ctrl ctrl--parar" onClick={terminarMic}><span>■</span>Terminar</button>
            <button className="ctrl" onClick={escribir}><span>⌨</span>A texto</button>
          </section>
        </Paisaje>
      )}

      {pantalla === 'contar' && !grabando && (
        <Paisaje clima={clima}>
          <section className="hoja">
            {!sttDisponible() && <p role="status">Tu navegador no permite dictar. Puedes escribirlo aquí.</p>}
            {errorMic && <p role="alert">{errorMic}</p>}
            <label htmlFor="relato" className="hoja__titulo">Lo que entendí (puedes corregirlo)</label>
            <textarea id="relato" value={texto} onChange={(e) => setTexto(e.target.value)} rows={5}
              placeholder="Hoy me desperté con sueño y el tráfico me quitó energía…" />
            <button className="principal" disabled={!texto.trim()} onClick={listo}>Listo</button>
            {sttDisponible() && (
              <button className="secundario" onClick={empezarGrabacion}>🎙️ {texto.trim() ? 'Seguir hablando' : 'Hablar'}</button>
            )}
          </section>
        </Paisaje>
      )}

      {pantalla === 'pensando' && <Paisaje clima={clima}><p className="tarjeta" aria-live="polite">Mirando tu cielo…</p></Paisaje>}

      {pantalla === 'emociones' && (
        <Paisaje clima={clima}>
          <section className="tarjeta">
            <h2>Toca las nubes que sientes tuyas</h2>
            <p className="rotulo">Propuesto por IA ({propuesta.proveedor ?? 'respaldo local'}), no es un consejo clínico</p>
            <div className="nubes">
              {propuesta.emociones.map((e) => (
                <button key={e.nombre} aria-pressed={elegidas.includes(e.nombre)}
                  className={elegidas.includes(e.nombre) ? 'nube activa' : 'nube'}
                  onClick={() => setElegidas((l) => l.includes(e.nombre) ? l.filter((x) => x !== e.nombre) : [...l, e.nombre])}>
                  {e.nombre}{e.tuya && <small className="tuya"> · tuya</small>}
                </button>
              ))}
            </div>
            <p className="reflexion">{propuesta.reflexion}
              <button className="enlace" onClick={() => decir(propuesta.reflexion)} aria-label="Escuchar la reflexión">🔊</button>
              <button className="enlace" onClick={masCorto}>Más corto</button>
            </p>
            <button className="principal" onClick={() => guardar({ emociones: elegidas })}>
              {elegidas.length ? 'Guardar mi día' : 'No sé, guardar igual'}
            </button>
          </section>
        </Paisaje>
      )}

      {pantalla === 'riesgo' && (
        <section className="tarjeta riesgo" role="alert">
          <h2>Mereces apoyo ahora mismo</h2>
          <p>Algo de lo que contaste nos preocupa. Hablar con una persona puede ayudar. Estas líneas son gratuitas.</p>
          {RECURSOS.map((r) => (
            <a key={r.tel} className="recurso" href={`tel:${r.tel}`}><strong>{r.nombre}</strong><span>{r.detalle}</span></a>
          ))}
          <p className="pequeno">La app no contactó a nadie. Tú decides si llamas.</p>
          <button className="secundario" onClick={reiniciar}>Ahora no</button>
        </section>
      )}

      {pantalla === 'guardado' && (
        <Paisaje clima={clima}>
          <section className="tarjeta">
            <h2>Tu día quedó guardado</h2>
            <p>{DESCRIPCION[clima]}</p>
            <p className="pequeno">Llevas {perfil.registros.length} registro(s).
              {perfil.ritmo.horaHabitual && ` Sueles registrar a las ${perfil.ritmo.horaHabitual}:00.`}</p>
            <button className="principal" onClick={reiniciar}>Hasta mañana</button>
          </section>
        </Paisaje>
      )}

      {pantalla === 'semana' && (
        <section className="tarjeta historial">
          <h2>Tus últimos 30 días</h2>
          <p className="rotulo">{demo ? 'Modo demo: datos simulados, no son de una persona real' : `Tus ${perfil.registros.length} registro(s)`}</p>
          <ol className="calendario">
            {(demo ? treintaDias(demo) : treintaDias(perfil.registros, { terminaHoy: true })).map(({ fecha, r }) => (
              <li key={fecha} className={r ? `dia paisaje--${r.clima}` : 'dia dia--vacio'}
                title={r ? `${fecha}: ${r.clima}, ${emociones(r)}` : `${fecha}: sin registro`}>
                <span className="dia__n" aria-hidden="true">{Number(fecha.slice(8))}</span>
                {r && <span className="dia__i" aria-hidden="true">{CLIMAS.find((c) => c.id === r.clima)?.icono}</span>}
                <span className="sr">
                  {r ? `${fecha}: ${DESCRIPCION[r.clima]} Emoción: ${emociones(r)}` : `${fecha}: sin registro, cielo despejado`}
                </span>
              </li>
            ))}
          </ol>
          <p className="pequeno">Los días sin registro no aparecen como fallo: el cielo sigue despejado.</p>
          {perfil.registros.length > 0 && (
            <button className="enlace" onClick={() => abrirHistorial(!demo)}>{demo ? 'Ver mis registros' : 'Ver el ejemplo de 30 días'}</button>
          )}
          <button className="secundario" onClick={reiniciar}>Volver al inicio</button>
        </section>
      )}

      {pantalla === 'sala' && <Sala key={codigoInvitacion} climaHoy={climaHoy} codigoInicial={codigoInvitacion}
        alVolver={() => { history.replaceState(null, '', location.pathname); reiniciar() }} />}

      {pantalla === 'perfil' && <Perfil perfil={perfil} setPerfil={setPerfil} alVolver={reiniciar} />}

      {['inicio', 'semana', 'perfil', 'sala'].includes(pantalla) && (
        <nav className="nav" aria-label="Secciones">
          <button aria-current={pantalla === 'inicio' ? 'page' : undefined} onClick={reiniciar}><span>⌂</span>Inicio</button>
          <button aria-current={pantalla === 'semana' ? 'page' : undefined} onClick={() => abrirHistorial()}><span>▦</span>Historial</button>
          <button aria-current={pantalla === 'sala' ? 'page' : undefined} onClick={() => setPantalla('sala')}><span>☁</span>Sala</button>
          <button aria-current={pantalla === 'perfil' ? 'page' : undefined} onClick={() => setPantalla('perfil')}><span>◎</span>Tú</button>
        </nav>
      )}
      <footer className="pie">LLM activo: {proveedorActivo().nombre}</footer>
    </main>
  )
}
