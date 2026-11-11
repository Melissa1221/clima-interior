import { useEffect, useRef, useState } from 'react'
import { proponerEmociones, proveedorActivo } from './llm/index.js'
import { crearGrabacion, decir, sttDisponible } from './voz/stt.js'
import { leerPerfil, guardarRegistro, guardarAjustes, guardarPreferencias } from './datos/perfil.js'
import { sistemaPideMenosMovimiento } from './datos/accesibilidad.js'
import { hayRiesgo, RECURSOS } from './datos/riesgo.js'
import { CLIMAS, DESCRIPCION } from './datos/climas.js'
import Paisaje from './componentes/Paisaje.jsx'
import Icono from './componentes/Icono.jsx'
import { Ayuda, BarraSuperior } from './componentes/Ui.jsx'
import { AjustesIniciales, Bienvenida, Edad, Limites, Permisos } from './pantallas/PrimerUso.jsx'

const SEG_SUGERIR_CIERRE = 60

// Pantallas con paisaje de fondo: ahí la barra superior usa el velo oscuro (contraste ≥4.5:1)
const FONDO_PAISAJE = new Set(['bienvenida', 'inicio', 'contar', 'pensando', 'emociones', 'guardado'])

// Ayuda contextual (RF-24): qué hacer en cada pantalla, sin salir del flujo
const AYUDA = {
  general: ['Cuenta cómo fue tu día en un minuto. Tú decides qué se guarda y cómo se llama lo que sientes.',
    '«Salir por hoy» está siempre arriba a la derecha: no pierdes nada de lo que ya elegiste.'],
  bienvenida: ['Clima Interior es un diario: cuentas tu día y lo ves convertido en un clima.', 'Puedes mirar la app con 30 días de ejemplo sin dar ningún permiso.'],
  edad: ['Preguntamos tu edad porque las emociones son un dato sensible según la Ley 29733.'],
  permisos: ['Cada permiso es independiente. Lo que dejes apagado no sale de tu teléfono.', 'Puedes cambiarlos cuando quieras en Perfil › Privacidad.'],
  limites: ['Clima Interior no diagnostica ni da tratamiento. Si estás en peligro, te mostramos a quién llamar.'],
  'ajustes-iniciales': ['Estos ajustes cambian cómo se ve y se escucha la app. Puedes modificarlos después en Accesibilidad.'],
  inicio: ['Elige el clima que se parece a tu día. Con eso basta si hoy no tienes ganas de hablar.',
    'Después puedes contarlo por voz o escribirlo, o guardar solo el clima.'],
  contar: ['Revisa lo que entendimos antes de que lo lea la IA y corrígelo si hace falta.'],
  emociones: ['La IA propone palabras para lo que podrías sentir. Tú eliges las tuyas o marcas «no sé».'],
}

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

function saludo() {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export default function App() {
  const [perfil, setPerfil] = useState(leerPerfil)
  const [pantalla, setPantalla] = useState(() => (perfil.primerUso.completo ? 'inicio' : 'bienvenida'))
  const [clima, setClima] = useState(null)
  const [texto, setTexto] = useState('')
  const [grabando, setGrabando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const [propuesta, setPropuesta] = useState(null)
  const [elegidas, setElegidas] = useState([])
  const [demo, setDemo] = useState(null)
  const [errorMic, setErrorMic] = useState(null)
  const [ayuda, setAyuda] = useState(null) // { titulo, parrafos } mientras el diálogo está abierto
  const [instalacion, setInstalacion] = useState(null) // evento beforeinstallprompt
  const [edad, setEdad] = useState(perfil.primerUso.edad)
  const rec = useRef(null)
  const consulta = useRef(0) // invalida respuestas del LLM que llegan después de salir

  useEffect(() => {
    const guardar = (e) => { e.preventDefault(); setInstalacion(e) }
    window.addEventListener('beforeinstallprompt', guardar)
    return () => window.removeEventListener('beforeinstallprompt', guardar)
  }, [])

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

  const cambiarAjustes = (grupo) => (cambios) => setPerfil((p) => guardarAjustes(p, grupo, cambios))
  const cambiarPreferencias = (cambios) => setPerfil((p) => guardarPreferencias(p, cambios))
  const abrirAyuda = (titulo, parrafos) => setAyuda({ titulo, parrafos })

  function instalar() {
    if (instalacion) return instalacion.prompt()
    abrirAyuda('Instalar la app', ['En Chrome o Edge, toca el botón «Instalar» de la barra de direcciones.',
      'En el celular, abre el menú del navegador y elige «Agregar a pantalla de inicio».'])
  }

  function irAAjustes() {
    // Si el sistema ya pide menos movimiento, el paisaje arranca estático (S05)
    if (sistemaPideMenosMovimiento()) cambiarPreferencias({ movimientoReducido: true })
    setPantalla('ajustes-iniciales')
  }

  function terminarPrimerUso() {
    cambiarAjustes('primerUso')({ completo: true, edad })
    setPantalla('inicio')
  }

  const reiniciar = () => {
    detenerMic()
    consulta.current++
    setErrorMic(null)
    setClima(null); setTexto(''); setPropuesta(null); setElegidas([]); setPantalla(perfil.primerUso.completo ? 'inicio' : 'bienvenida')
  }

  return (
    <main className="app" data-movimiento={perfil.preferencias.movimientoReducido ? 'reducido' : 'normal'}>
      <BarraSuperior fondo={FONDO_PAISAJE.has(pantalla) ? 'paisaje' : 'claro'} soloAyuda={pantalla === 'bienvenida'}
        onAyuda={() => abrirAyuda('Ayuda', AYUDA[pantalla] ?? AYUDA.general)} onSalir={reiniciar} />
      {ayuda && (
        <Ayuda titulo={ayuda.titulo} onCerrar={() => setAyuda(null)}>
          {ayuda.parrafos.map((t) => <p key={t}>{t}</p>)}
        </Ayuda>
      )}

      {pantalla === 'bienvenida' && (
        <Bienvenida onEmpezar={() => setPantalla('edad')} onDemo={abrirDemo} onInstalar={instalar} />
      )}
      {pantalla === 'edad' && (
        <Edad edad={edad} onElegir={setEdad} onContinuar={() => setPantalla('permisos')} />
      )}
      {pantalla === 'permisos' && (
        <Permisos privacidad={perfil.privacidad} edad={edad} onCambio={cambiarAjustes('privacidad')} onGuardar={() => setPantalla('limites')} />
      )}
      {pantalla === 'limites' && <Limites onRecursos={() => setPantalla('riesgo')} onEntendido={irAAjustes} />}
      {pantalla === 'ajustes-iniciales' && (
        <AjustesIniciales preferencias={perfil.preferencias} sistemaReducido={sistemaPideMenosMovimiento()}
          onCambio={cambiarPreferencias} onListo={terminarPrimerUso} />
      )}

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
        <nav className="pestanas" aria-label="Secciones">
          <button className="pestana" aria-current={pantalla === 'inicio' ? 'page' : undefined} onClick={reiniciar}><Icono nombre="inicio" />Inicio</button>
          <button className="pestana" aria-current={pantalla === 'semana' ? 'page' : undefined} onClick={abrirDemo}><Icono nombre="calendario" />Historial</button>
        </nav>
      )}
      <footer className="pie">LLM activo: {proveedorActivo().nombre}</footer>
    </main>
  )
}
