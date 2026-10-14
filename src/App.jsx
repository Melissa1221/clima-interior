import { useEffect, useRef, useState } from 'react'
import { proponerEmociones, proveedorActivo } from './llm/index.js'
import { crearGrabacion, decir, sttDisponible } from './voz/stt.js'
import { leerPerfil, guardarRegistro } from './datos/perfil.js'
import { hayRiesgo, RECURSOS } from './datos/riesgo.js'

const CLIMAS = [
  { id: 'soleado', etiqueta: 'Soleado', icono: '☀️' },
  { id: 'nublado', etiqueta: 'Nublado', icono: '⛅' },
  { id: 'lluvia', etiqueta: 'Lluvia', icono: '🌧️' },
  { id: 'tormenta', etiqueta: 'Tormenta', icono: '⛈️' },
  { id: 'niebla', etiqueta: 'Niebla', icono: '🌫️' },
]
const DESCRIPCION = {
  soleado: 'Cielo despejado, luz cálida y viento suave.',
  nublado: 'Cielo cubierto, luz tenue y poco viento.',
  lluvia: 'Lluvia suave y constante, nubes bajas.',
  tormenta: 'Nubes densas, viento fuerte y lluvia intensa.',
  niebla: 'Niebla espesa que deja ver poco el horizonte.',
}
const SEG_SUGERIR_CIERRE = 60

// Los 30 días del periodo demo, incluidos los que no tienen registro (RF-43: sin rachas que castiguen)
function treintaDias(registros) {
  const porFecha = Object.fromEntries(registros.map((r) => [r.fecha, r]))
  const inicio = new Date(`${registros[0].fecha}T12:00:00`)
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(inicio)
    d.setDate(d.getDate() + i)
    const fecha = d.toISOString().slice(0, 10)
    return { fecha, r: porFecha[fecha] }
  })
}

// Capa decorativa del cielo: sol, nubes y viento según el clima (RF-01)
const CIELO = {
  inicio: { sol: true, nubes: 2, viento: 3 },
  soleado: { sol: true, nubes: 1, viento: 2 },
  nublado: { sol: true, nubes: 4, viento: 2 },
  lluvia: { sol: false, nubes: 5, viento: 1, lluvia: true },
  tormenta: { sol: false, nubes: 6, viento: 4, lluvia: true },
  niebla: { sol: true, nubes: 3, viento: 5, niebla: true },
}
const NUBES = [[30, 120, 1], [250, 170, 0.8], [60, 250, 1.2], [300, 60, 0.9], [150, 320, 1], [330, 280, 0.7]]

function Cielo({ clima }) {
  const c = CIELO[clima || 'inicio']
  return (
    <svg className="cielo" viewBox="0 0 400 420" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
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

function Paisaje({ clima, children }) {
  return (
    <div className={`paisaje paisaje--${clima || 'inicio'}`} role="img"
      aria-label={clima ? DESCRIPCION[clima] : 'Cielo de inicio'}>
      <Cielo clima={clima} />
      {children}
    </div>
  )
}

function saludo() {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export default function App() {
  const [perfil, setPerfil] = useState(leerPerfil)
  const [pantalla, setPantalla] = useState('inicio')
  const [clima, setClima] = useState(null)
  const [texto, setTexto] = useState('')
  const [grabando, setGrabando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const [propuesta, setPropuesta] = useState(null)
  const [elegidas, setElegidas] = useState([])
  const [demo, setDemo] = useState(null)
  const [errorMic, setErrorMic] = useState(null)
  const rec = useRef(null)
  const consulta = useRef(0) // invalida respuestas del LLM que llegan después de salir

  useEffect(() => {
    if (!grabando) return
    const t = setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [grabando])

  function guardar(extra = {}) {
    const ahora = new Date()
    const registro = {
      fecha: ahora.toISOString().slice(0, 10),
      hora: ahora.toTimeString().slice(0, 5),
      clima,
      emocion_declarada: extra.emociones?.length ? extra.emociones : null,
      emocion_inferida: propuesta?.emociones.map((e) => e.nombre) ?? null,
      transcripcion: texto || null,
    }
    setPerfil((p) => guardarRegistro(p, registro))
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
    const r = await proponerEmociones(texto)
    if (id !== consulta.current) return
    setPropuesta(r)
    setElegidas([])
    setPantalla('emociones')
  }

  async function abrirDemo() {
    const res = await fetch('/demo/registros-30-dias.json')
    setDemo(await res.json())
    setPantalla('semana')
  }

  const reiniciar = () => {
    detenerMic()
    consulta.current++
    setErrorMic(null)
    setClima(null); setTexto(''); setPropuesta(null); setElegidas([]); setPantalla('inicio')
  }

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
          </section>
          {perfil.registros.at(-1) && (
            <p className="ayer">Último registro: {DESCRIPCION[perfil.registros.at(-1).clima]}</p>
          )}
          <section className="hoja">
            <p className="hoja__titulo">¿Qué clima hay hoy?</p>
            <div className="climas" role="radiogroup" aria-label="Clima del día">
              {CLIMAS.map((c) => (
                <button key={c.id} role="radio" aria-checked={clima === c.id}
                  className={clima === c.id ? 'clima activo' : 'clima'} onClick={() => setClima(c.id)}>
                  <span aria-hidden="true">{c.icono}</span>{c.etiqueta}
                </button>
              ))}
            </div>
            <div className="contar">
              <button className="mic-grande" disabled={!clima} onClick={empezarGrabacion} aria-label="Contar mi día por voz"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg></button>
              <div>
                <h2>Contar mi día</h2>
                <p className="pequeno">Más o menos 1 minuto. Puedes cambiar a texto cuando quieras.</p>
              </div>
            </div>
            <div className="fila">
              <button className="secundario" disabled={!clima} onClick={escribir}>✎ Escribir</button>
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
                  {e.nombre}
                </button>
              ))}
            </div>
            <p className="reflexion">{propuesta.reflexion}
              <button className="enlace" onClick={() => decir(propuesta.reflexion)} aria-label="Escuchar la reflexión">🔊</button>
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

      {pantalla === 'semana' && demo && (
        <section className="tarjeta historial">
          <h2>Tus últimos 30 días</h2>
          <p className="rotulo">Modo demo: datos simulados, no son de una persona real</p>
          <ol className="calendario">
            {treintaDias(demo).map(({ fecha, r }) => (
              <li key={fecha} className={r ? `dia paisaje--${r.clima}` : 'dia dia--vacio'}
                title={r ? `${fecha}: ${r.clima}, ${r.emocion_declarada ?? 'no sé'}` : `${fecha}: sin registro`}>
                <span className="sr">
                  {r ? `${fecha}: ${DESCRIPCION[r.clima]} Emoción: ${r.emocion_declarada ?? 'no sé'}` : `${fecha}: sin registro, cielo despejado`}
                </span>
              </li>
            ))}
          </ol>
          <p className="pequeno">Los días sin registro no aparecen como fallo: el cielo sigue despejado.</p>
          <button className="secundario" onClick={reiniciar}>Volver al inicio</button>
        </section>
      )}

      {(pantalla === 'inicio' || pantalla === 'semana') && (
        <nav className="nav" aria-label="Secciones">
          <button aria-current={pantalla === 'inicio' ? 'page' : undefined} onClick={reiniciar}><span>⌂</span>Inicio</button>
          <button aria-current={pantalla === 'semana' ? 'page' : undefined} onClick={abrirDemo}><span>▦</span>Historial</button>
        </nav>
      )}
      <footer className="pie">LLM activo: {proveedorActivo().nombre}</footer>
    </main>
  )
}
