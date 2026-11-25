import { useEffect, useRef, useState } from 'react'
import { proponerEmociones, proveedorActivo, proveedorSegunPermiso } from './llm/index.js'
import { crearGrabacion, decir, sttDisponible, transcripcionLocalDisponible } from './voz/stt.js'
import {
  leerPerfil, guardarRegistro, guardarAjustes, guardarPreferencias, alternarCapa, borrarTodo, registrarFalloMic, pedirMasCorto,
  personalizarPropuesta, contextoParaLLM, notaDeRitmo, empiezaEscribiendo, cambiarCategoria, restablecer,
  guardarRefugio, tecnicaFavorita, saltarOfertaRefugio, registrarTrampa, trampasSilenciadas,
} from './datos/perfil.js'
import { TRAMPAS, trampaParaMostrar } from './datos/trampas.js'
import { debeOfrecerRefugio } from './datos/refugio.js'
import { detectarOrden, limitarPalabras, sistemaPideMenosMovimiento, sonificarClima, vibrar } from './datos/accesibilidad.js'
import { estadoDictado, MOTIVOS_DICTADO } from './datos/privacidad.js'
import { hayRiesgo, RECURSOS } from './datos/riesgo.js'
import { CLIMAS, DESCRIPCION, climaEfectivo } from './datos/climas.js'
import Paisaje from './componentes/Paisaje.jsx'
import Icono from './componentes/Icono.jsx'
import { Accesibilidad } from './pantallas/Accesibilidad.jsx'
import { Aviso, Ayuda, BarraSuperior, Boton, Pestanas } from './componentes/Ui.jsx'
import { AjustesIniciales, Bienvenida, Edad, Limites, Permisos } from './pantallas/PrimerUso.jsx'
import { AntesDeGrabar, PrivacidadYDatos, SabeDeMi } from './pantallas/Privacidad.jsx'
import { EliminarDatos, ExportarResumen } from './pantallas/Datos.jsx'
import Sala from './pantallas/Sala.jsx'
import Refugio from './pantallas/Refugio.jsx'

const SEG_SUGERIR_CIERRE = 60

// Pantallas con paisaje de fondo: ahí la barra superior usa el velo oscuro (contraste ≥4.5:1)
const FONDO_PAISAJE = new Set(['bienvenida', 'antes-grabar', 'inicio', 'contar', 'pensando', 'emociones', 'guardado', 'refugio', 'trampa'])

// Pantallas con barra de pestañas y la pestaña que las contiene
const PESTANA_DE = { inicio: 'inicio', semana: 'historial', sala: 'sala', perfil: 'perfil', privacidad: 'perfil', accesibilidad: 'perfil' }

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
  emociones: ['La IA propone palabras para lo que podrías sentir. Tú eliges las tuyas o marcas «no sé».',
    'Las que dicen «tuya» son palabras que sueles elegir. «Más corto» acorta la reflexión; si lo pides seguido, la app lo recuerda.'],
  sala: ['En una sala ves el clima de tu grupo, nunca lo que cada persona contó ni sus emociones.',
    'Cada persona aparece con un seudónimo que cambia cada vez. Puedes retirar tu clima o salir cuando quieras.',
    'Quien crea la sala puede sacar a alguien o cerrarla. La sala se borra al cerrarla o a las 24 horas.'],
  perfil: ['Aquí ves lo que la app aprendió de cómo la usas y por qué cambió algo.',
    'Si apagas una categoría, también se borra lo que ya se había aprendido de ella.'],
  trampa: ['Con presión, la mente cae a veces en trampas comunes. La app solo pregunta: tú decides si te suena.',
    'Es una sugerencia automática, no un diagnóstico. Si dices «No es así», lo tomamos en cuenta y no insistimos.'],
  // Refugio (RF-42): una ayuda por paso
  'refugio:antes': ['Un respiro es una pausa corta de autocuidado. No es terapia ni reemplaza a una persona.',
    'Primero eliges cómo estás y al final cómo quedaste: así ves qué te ayuda. «Ahora no» te devuelve al inicio.'],
  'refugio:elegir': ['Cada técnica dura de 1 a 3 minutos y puedes dejarla cuando quieras.',
    'Debajo de cada una dice qué tanto respaldo tiene. Si una te ayudó antes, aparece primero.'],
  'refugio:respirar': ['Inhala mientras la nube crece y exhala, más largo, mientras se encoge. Con movimiento reducido, sigue el texto.',
    'Si te mareas, vuelve a respirar normal. «Terminar» te lleva al final sin perder nada.'],
  'refugio:tierra': ['Nombra lo que percibes, en voz alta o en tu mente, y toca «Listo». No se guarda nada de lo que digas.'],
  'refugio:tarea': ['Escribe lo que tienes pendiente y pártelo en pasos chiquitos; el primero, de unos 15 minutos.',
    'Marca cada paso al terminarlo. La lista se queda en este teléfono hasta que la borres.'],
  'refugio:amiga': ['Imagina que alguien que quieres te cuenta esto. Lo que le dirías suele ser más justo que lo que te dices.',
    'Lo que escribas aquí no se guarda.'],
  'refugio:despues': ['Elige cómo quedaste. Se guarda solo el clima de antes y de después, nunca lo que dijiste.'],
  'refugio:resumen': ['En Historial, «Lo que te ayudó» junta tus respiros, sin rachas ni metas.'],
}

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
const emocionesDe = (r) => [].concat(r.emocion_declarada ?? []).join(', ') || 'no sé'
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export default function App() {
  const [perfil, setPerfil] = useState(leerPerfil)
  const [pantalla, setPantalla] = useState(() => {
    if (!perfil.primerUso.completo) return 'bienvenida'
    return new URLSearchParams(location.hash.slice(1)).get('sala') ? 'sala' : 'inicio'
  })
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
  const [enSala, setEnSala] = useState(false) // dentro de una sala: paisaje de fondo
  const [refugio, setRefugio] = useState(null) // { tecnica?, frase? } con el que se abrió el Refugio
  const [pasoRefugio, setPasoRefugio] = useState('antes')
  const [trampa, setTrampa] = useState(null) // como máximo una tarjeta de trampa por check-in
  const [trampaSi, setTrampaSi] = useState(false)
  const rec = useRef(null)
  const orden = useRef(null) // última versión de «ejecutar orden de voz», para el dictado en curso
  const ultimaOrden = useRef(null)
  const consulta = useRef(0) // invalida respuestas del LLM que llegan después de salir
  const inicioCheckin = useRef(null) // para aprender cuánto dura tu check-in (RF-21)
  // Un enlace de invitación (#sala=CÓDIGO) abre directo la sala, también con la app ya abierta
  const leerInvitacion = () => new URLSearchParams(location.hash.slice(1)).get('sala') ?? ''
  const [codigoInvitacion, setCodigoInvitacion] = useState(leerInvitacion)

  const { preferencias, privacidad } = perfil
  const climaVista = climaEfectivo(clima, preferencias) // modo neutral: la tormenta se ve como cielo neutro (RF-34)
  const predecible = preferencias.modoPredecible

  // Pista a los 12 s de silencio: en texto, en voz y con vibración (S10, RF-35)
  useEffect(() => {
    if (!grabando || segundos !== 12 || texto || !preferencias.pistas) return
    vibrar(preferencias)
    decir('¿Sigues ahí? Puedes contarlo con pocas palabras o escribirlo.')
  }, [segundos]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const guardar = (e) => { e.preventDefault(); setInstalacion(e) }
    window.addEventListener('beforeinstallprompt', guardar)
    return () => window.removeEventListener('beforeinstallprompt', guardar)
  }, [])

  useEffect(() => {
    const alCambiar = () => {
      const c = leerInvitacion()
      if (!c || !perfil.primerUso.completo) return
      setCodigoInvitacion(c)
      setPantalla('sala')
    }
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [perfil.primerUso.completo]) // eslint-disable-line react-hooks/exhaustive-deps

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
    // El día ya quedó guardado; la trampa se pregunta después, sin bloquear nada
    setPantalla(trampa && texto && !hayRiesgo(texto) ? 'trampa' : 'guardado')
  }

  const estadoVoz = () => estadoDictado(perfil.privacidad, { dictado: sttDisponible(), local: transcripcionLocalDisponible() })

  function empezarGrabacion() {
    setPantalla('contar')
    if (estadoVoz() !== 'ok') return
    setErrorMic(null)
    const previo = texto.trim() // volver a grabar agrega al texto, no lo borra
    rec.current = crearGrabacion({
      local: !perfil.privacidad.transcribirEnInternet,
      alTexto: (t) => {
        const { orden: cual, texto: limpio } = preferencias.comandosVoz ? detectarOrden(t) : { orden: null, texto: t }
        setTexto(previo ? `${previo} ${limpio}`.trim() : limpio)
        if (cual && ultimaOrden.current !== cual) { ultimaOrden.current = cual; orden.current?.(cual) }
        else if (!cual) ultimaOrden.current = null
      },
      alError: (e) => {
        setGrabando(false)
        vibrar(preferencias)
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

  function elegirClima(id) {
    inicioCheckin.current ??= Date.now()
    setClima(id)
    if (!preferencias.describirEnVoz) return
    const visto = climaEfectivo(id, preferencias)
    decir(DESCRIPCION[visto])
    sonificarClima(visto, preferencias)
  }

  // Órdenes de voz al final del dictado: terminar, pausar, ayuda, salir por hoy (S51)
  orden.current = (cual) => {
    if (cual === 'terminar' || cual === 'pausar') terminarMic()
    else if (cual === 'salir') reiniciar()
    else if (cual === 'ayuda') abrirAyuda('Ayuda', AYUDA.contar)
  }

  function escribir() {
    detenerMic()
    setErrorMic(null)
    setPantalla('contar')
  }

  async function listo() {
    detenerMic()
    if (hayRiesgo(texto)) { vibrar(preferencias); return setPantalla('riesgo') }
    setPantalla('pensando')
    const id = ++consulta.current
    const r = await proponerEmociones(texto, {
      proveedor: proveedorSegunPermiso(perfil.privacidad.iaEnInternet),
      contexto: contextoParaLLM(perfil),
    })
    if (id !== consulta.current) return
    setPropuesta(personalizarPropuesta(perfil, r))
    setTrampa(trampaParaMostrar(texto, r.trampas, trampasSilenciadas(perfil)))
    setTrampaSi(false)
    setElegidas([])
    setPantalla('emociones')
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
  const abrirDemo = () => abrirHistorial(true)

  // HU-08: la persona corrige el tono; al tercer pedido el perfil lo recuerda
  function masCorto() {
    setPerfil(pedirMasCorto)
    setPropuesta((p) => ({ ...p, reflexion: p.reflexion.match(/^[^.?!]*[.?!]/)?.[0] ?? p.reflexion }))
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

  async function eliminarTodo() {
    vibrar(perfil.preferencias)
    setPerfil(await borrarTodo())
    setEdad(null); setClima(null); setTexto(''); setPropuesta(null); setElegidas([]); setDemo(null)
    setPantalla('bienvenida')
    abrirAyuda('Tus datos se eliminaron', ['Borramos tus registros, tu perfil y la caché de este teléfono.', 'Puedes empezar de nuevo cuando quieras.'])
  }

  function terminarPrimerUso() {
    cambiarAjustes('primerUso')({ completo: true, edad })
    setPantalla('inicio')
  }

  // Refugio: gratis, a un toque desde el inicio, o se ofrece tras un check-in pesado (RF-42)
  function abrirRefugio(inicial = {}) {
    detenerMic()
    setRefugio(inicial)
    setPasoRefugio('antes')
    setPantalla('refugio')
  }
  const alRiesgo = () => { vibrar(preferencias); setPantalla('riesgo') }

  function irAPestana(id) {
    if (id === 'inicio') return reiniciar()
    if (id === 'historial') return abrirHistorial()
    setPantalla(id)
  }

  const reiniciar = () => {
    detenerMic()
    consulta.current++
    setErrorMic(null)
    inicioCheckin.current = null
    setTrampa(null); setTrampaSi(false)
    setClima(null); setTexto(''); setPropuesta(null); setElegidas([]); setPantalla(perfil.primerUso.completo ? 'inicio' : 'bienvenida')
  }

  const porTexto = empiezaEscribiendo(perfil)
  const hoy = fechaLocal(new Date())
  const ofrecerRefugio = pantalla === 'guardado' && perfil.refugioSaltado !== hoy &&
    debeOfrecerRefugio({ clima, emociones: perfil.registros.at(-1)?.emocion_declarada, texto })
  const ultimo = perfil.registros.at(-1)
  const climaHoy = ultimo?.fecha === fechaLocal(new Date()) ? ultimo.clima : null

  return (
    <main className="app" data-movimiento={perfil.preferencias.movimientoReducido ? 'reducido' : 'normal'}>
      <BarraSuperior fondo={FONDO_PAISAJE.has(pantalla) || (pantalla === 'sala' && enSala) ? 'paisaje' : 'claro'} soloAyuda={pantalla === 'bienvenida'}
        onAyuda={() => abrirAyuda('Ayuda', (pantalla === 'refugio' ? AYUDA[`refugio:${pasoRefugio}`] : AYUDA[pantalla]) ?? AYUDA.general)} onSalir={reiniciar} />
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
        <Paisaje clima={climaVista} capas={preferencias.capas}>
          <section className="saludo">
            <h1>{saludo()}</h1>
            <p>¿Cómo fue tu día?</p>
            {notaDeRitmo(perfil) && <p className="pequeno">{notaDeRitmo(perfil)}</p>}
          </section>
          {perfil.registros.at(-1) && (
            <p className="ayer">Último registro: {DESCRIPCION[perfil.registros.at(-1).clima]}</p>
          )}
          <Boton tipo="velo" icono="viento" className="entrada-refugio" onClick={() => abrirRefugio()}>Necesito un respiro</Boton>
          <section className="hoja">
            <p className="hoja__titulo">¿Qué clima hay hoy?</p>
            <div className="climas" role="radiogroup" aria-label="Clima del día">
              {CLIMAS.map((c) => (
                <button key={c.id} role="radio" aria-checked={clima === c.id}
                  className={clima === c.id ? 'clima activo' : 'clima'} onClick={() => elegirClima(c.id)}>
                  <span aria-hidden="true">{c.icono}</span>{c.etiqueta}
                </button>
              ))}
            </div>
            {!clima && <p className="pequeno" role="status">Elige un clima para empezar.</p>}
            {porTexto && <p className="pequeno">Como el micrófono falló, empezamos escribiendo. Puedes hablar cuando quieras.</p>}
            {predecible ? (
              <Boton disabled={!clima} onClick={() => setPantalla('predecible-como')}>Continuar</Boton>
            ) : (
              <>
                <div className="contar">
                  <button className="mic-grande" disabled={!clima} onClick={porTexto ? escribir : () => setPantalla('antes-grabar')}
                    aria-label={porTexto ? 'Escribir mi día' : 'Contar mi día por voz'}>{porTexto ? <span aria-hidden="true" className="icono-lapiz">✎</span> : <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>}</button>
                  <div>
                    <h2>{porTexto ? 'Escribir mi día' : 'Contar mi día'}</h2>
                    <p className="pequeno">{porTexto ? 'Unas líneas bastan.' : 'Más o menos 1 minuto. Puedes cambiar a texto cuando quieras.'}</p>
                  </div>
                </div>
                <div className="fila">
                  {porTexto
                    ? <button className="secundario" disabled={!clima} onClick={() => setPantalla('antes-grabar')}>🎙️ Hablar</button>
                    : <button className="secundario" disabled={!clima} onClick={escribir}>✎ Escribir</button>}
                  <button className="secundario" disabled={!clima} onClick={() => guardar()}>Así está bien (10 s)</button>
                </div>
              </>
            )}
          </section>
        </Paisaje>
      )}

      {pantalla === 'contar' && grabando && (
        <Paisaje clima={climaVista} capas={preferencias.capas}>
          <div className="grabando">
            <p className="pildora" aria-live="polite"><span className="punto" /> Micrófono activo · {mmss(segundos)}</p>
            <div className="reloj" style={{ '--avance': `${Math.min(segundos / SEG_SUGERIR_CIERRE, 1) * 360}deg` }}>
              <div><strong>{mmss(segundos)}</strong><span>de ~1:00</span></div>
            </div>
            {preferencias.pistas && segundos >= 12 && !texto && <p className="pildora" role="status">¿Sigues ahí? Puedes contarlo con pocas palabras o escribirlo.</p>}
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
        <Paisaje clima={climaVista} capas={preferencias.capas}>
          <section className="hoja">
            {estadoVoz() !== 'ok' && <p role="status">{MOTIVOS_DICTADO[estadoVoz()]}</p>}
            {errorMic && <p role="alert">{errorMic}</p>}
            <label htmlFor="relato" className="hoja__titulo">Lo que entendí (puedes corregirlo)</label>
            <textarea id="relato" value={texto} onChange={(e) => setTexto(e.target.value)} rows={5}
              placeholder="Hoy me desperté con sueño y el tráfico me quitó energía…" />
            <button className="principal" disabled={!texto.trim()} onClick={listo}>Listo</button>
            {estadoVoz() === 'ok' && (
              <button className="secundario" onClick={empezarGrabacion}>🎙️ {texto.trim() ? 'Seguir hablando' : 'Hablar'}</button>
            )}
          </section>
        </Paisaje>
      )}

      {pantalla === 'predecible-como' && (
        <section className="pantalla" aria-labelledby="como-titulo">
          <div className="pantalla__cuerpo">
            <h1 id="como-titulo">¿Cómo quieres contarlo?</h1>
            <p className="cuerpo">Elige una opción. Después te haremos la siguiente pregunta.</p>
            <Boton icono="mic" onClick={() => setPantalla('antes-grabar')}>Hablar</Boton>
            <Boton tipo="secundario" icono="texto" onClick={escribir}>Escribir</Boton>
            <Boton tipo="fantasma" onClick={() => guardar()}>Guardar solo el clima</Boton>
          </div>
        </section>
      )}
      {pantalla === 'antes-grabar' && (
        <AntesDeGrabar clima={clima} estado={estadoVoz()} onGrabar={empezarGrabacion} onEscribir={escribir} />
      )}
      {pantalla === 'perfil' && (
        <SabeDeMi perfil={perfil}
          onCambio={(cambios) => setPerfil((p) => Object.entries(cambios).reduce((acc, [k, v]) => cambiarCategoria(acc, k, v), p))}
          onOlvidar={(categoria) => setPerfil((p) => restablecer(p, categoria))}
          onPrivacidad={() => setPantalla('privacidad')} onAccesibilidad={() => setPantalla('accesibilidad')} />
      )}
      {pantalla === 'privacidad' && (
        <PrivacidadYDatos privacidad={perfil.privacidad} onCambio={cambiarAjustes('privacidad')}
          onExportar={() => setPantalla('exportar')} onEliminar={() => setPantalla('eliminar')} onDemo={abrirDemo} />
      )}

      {pantalla === 'sala' && (
        <Sala key={codigoInvitacion} climaHoy={climaHoy} codigoInicial={codigoInvitacion}
          permitido={privacidad.climaCompartido} onDentro={setEnSala} onPermitir={() => cambiarAjustes('privacidad')({ climaCompartido: true })}
          alVolver={() => { history.replaceState(null, '', location.pathname); reiniciar() }} />
      )}

      {pantalla === 'accesibilidad' && (
        <Accesibilidad preferencias={preferencias} onCambio={cambiarPreferencias} onAlternarCapa={(c) => setPerfil((p) => alternarCapa(p, c))} />
      )}
      {pantalla === 'exportar' && (
        <ExportarResumen registros={perfil.registros} vibrar={() => vibrar(perfil.preferencias)} onListo={() => setPantalla('privacidad')} />
      )}
      {pantalla === 'eliminar' && (
        <EliminarDatos onEliminar={eliminarTodo} onCancelar={() => setPantalla('privacidad')} onExportar={() => setPantalla('exportar')} />
      )}

      {pantalla === 'pensando' && <Paisaje clima={climaVista} capas={preferencias.capas}><p className="tarjeta" aria-live="polite">Mirando tu cielo…</p></Paisaje>}

      {pantalla === 'emociones' && (
        <Paisaje clima={climaVista} capas={preferencias.capas}>
          <section className="tarjeta">
            {climaVista !== clima && <Aviso titulo="Modo neutral activo">Hoy tu registro generaría tormenta. Lo mostramos como cielo neutro y sin sonidos intensos.</Aviso>}
            <h2>{predecible ? '¿Cuáles de estas emociones sientes?' : 'Toca las nubes que sientes tuyas'}</h2>
            <span className="rotulo-ia"><Icono nombre="ia" tam={17} />Generado por IA · no es consejo clínico</span>
            <p className="rotulo">Propuesto por {propuesta.proveedor ?? 'respaldo local'}. Tú decides cuáles son tuyas.</p>
            <div className="nubes">
              {propuesta.emociones.map((e) => (
                <button key={e.nombre} aria-pressed={elegidas.includes(e.nombre)}
                  className={elegidas.includes(e.nombre) ? 'nube activa' : 'nube'}
                  onClick={() => setElegidas((l) => l.includes(e.nombre) ? l.filter((x) => x !== e.nombre) : [...l, e.nombre])}>
                  {e.nombre}{e.tuya && <small className="tuya"> · tuya</small>}
                </button>
              ))}
            </div>
            <p className="reflexion">{predecible ? limitarPalabras(propuesta.reflexion) : propuesta.reflexion}
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

      {pantalla === 'trampa' && trampa && (
        <Paisaje clima={climaVista} capas={preferencias.capas}>
          <section className="tarjeta" aria-labelledby="trampa-titulo">
            <span className="rotulo-ia"><Icono nombre="ia" tam={17} />Sugerencia automática · no es un diagnóstico</span>
            <h2 id="trampa-titulo">Una pregunta, si quieres</h2>
            {!trampaSi ? (
              <>
                <p className="trampa__cita">Dijiste <strong>«{trampa.frase}»</strong>.</p>
                <p className="trampa__cita">Tiene sentido que te sientas así con todo lo que tienes encima.</p>
                <p className="trampa__hipotesis">{TRAMPAS[trampa.tipo].hipotesis}</p>
                <Boton onClick={() => { setPerfil((p) => registrarTrampa(p, trampa.tipo, 'si')); setTrampaSi(true) }}>Sí, puede ser</Boton>
                <Boton tipo="secundario" onClick={() => { setPerfil((p) => registrarTrampa(p, trampa.tipo, 'no')); setPantalla('guardado') }}>No es así</Boton>
              </>
            ) : (
              <>
                <p className="trampa__cita">No se trata de pensar bonito, sino de ver si hay algo más probable.</p>
                <p className="trampa__pregunta" role="status">{TRAMPAS[trampa.tipo].pregunta}</p>
                <p className="pequeno">No hace falta responder aquí. Puedes pensarlo un momento.</p>
                <Boton tipo="secundario" onClick={() => abrirRefugio({ tecnica: 'amiga', frase: trampa.frase })}>¿Qué le dirías a una amiga?</Boton>
                <Boton onClick={() => setPantalla('guardado')}>Seguir</Boton>
              </>
            )}
          </section>
        </Paisaje>
      )}

      {pantalla === 'guardado' && (
        <Paisaje clima={climaVista} capas={preferencias.capas}>
          <section className="tarjeta">
            {climaVista !== clima && <Aviso titulo="Modo neutral activo">Tu tormenta se guardó y hoy se muestra como cielo neutro.</Aviso>}
            <span className="sello"><Icono nombre="check" /></span>
            <h2>Tu día quedó guardado</h2>
            <p>{DESCRIPCION[climaVista]}</p>
            <p className="pequeno">Llevas {perfil.registros.length} registro(s).
              {perfil.ritmo.horaHabitual && ` Sueles registrar a las ${perfil.ritmo.horaHabitual}:00.`}</p>
            {ofrecerRefugio && (
              <div className="oferta-refugio" role="group" aria-labelledby="oferta-titulo">
                <strong id="oferta-titulo">¿Te tomas un respiro?</strong>
                <p className="pequeno">Un minuto de lluvia para respirar, o partir lo que tienes pendiente. Si no, no pasa nada.</p>
                <Boton icono="viento" onClick={() => abrirRefugio()}>Necesito un respiro</Boton>
                <Boton tipo="fantasma" onClick={() => setPerfil((p) => saltarOfertaRefugio(p, hoy))}>Ahora no</Boton>
              </div>
            )}
            <button className="principal" onClick={reiniciar}>Hasta mañana</button>
          </section>
        </Paisaje>
      )}

      {pantalla === 'refugio' && (
        <Refugio key={JSON.stringify(refugio)} preferencias={preferencias} favorita={tecnicaFavorita(perfil)} inicial={refugio}
          voz={{ disponible: estadoVoz() === 'ok', local: !perfil.privacidad.transcribirEnInternet }}
          onPaso={setPasoRefugio} onGuardar={(r) => setPerfil((p) => guardarRefugio(p, r))} onSalir={reiniciar} onRiesgo={alRiesgo} />
      )}

      {pantalla === 'semana' && (demo || perfil.registros.length > 0) && (
        <section className="tarjeta historial">
          <h2>Tus últimos 30 días</h2>
          <p className="rotulo">{demo ? 'Modo demo: datos simulados, no son de una persona real' : `Tus ${perfil.registros.length} registro(s)`}</p>
          <ol className="calendario">
            {(demo ? treintaDias(demo) : treintaDias(perfil.registros, { terminaHoy: true })).map(({ fecha, r }) => (
              <li key={fecha} className={r ? `dia paisaje--${r.clima}` : 'dia dia--vacio'}
                title={r ? `${fecha}: ${r.clima}, ${emocionesDe(r)}` : `${fecha}: sin registro`}>
                <span className="dia__n" aria-hidden="true">{Number(fecha.slice(8))}</span>
                {r && <span className="dia__i" aria-hidden="true">{CLIMAS.find((c) => c.id === r.clima)?.icono}</span>}
                <span className="sr">
                  {r ? `${fecha}: ${DESCRIPCION[r.clima]} Emoción: ${emocionesDe(r)}` : `${fecha}: sin registro, cielo despejado`}
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

      {PESTANA_DE[pantalla] && <Pestanas actual={PESTANA_DE[pantalla]} onIr={irAPestana} />}
      <footer className="pie">LLM activo: {proveedorActivo().nombre}</footer>
    </main>
  )
}
