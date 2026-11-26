import { useEffect, useRef, useState } from 'react'
import { proponerEmociones, proveedorActivo, proveedorSegunPermiso } from './llm/index.js'
import { crearGrabacion, decir, sttDisponible, transcripcionLocalDisponible } from './voz/stt.js'
import {
  leerPerfil, guardarRegistro, guardarAjustes, guardarPreferencias, alternarCapa, borrarTodo, registrarFalloMic, pedirMasCorto,
  personalizarPropuesta, contextoParaLLM, notaDeRitmo, empiezaEscribiendo, cambiarCategoria, restablecer,
  guardarRefugio, tecnicaFavorita, saltarOfertaRefugio, registrarTrampa, trampasSilenciadas,
} from './datos/perfil.js'
import { trampaParaMostrar } from './datos/trampas.js'
import { debeOfrecerRefugio } from './datos/refugio.js'
import { detectarOrden, sistemaPideMenosMovimiento, sonificarClima, vibrar } from './datos/accesibilidad.js'
import { debePreguntarIA, estadoDictado, MOTIVOS_DICTADO, temaEfectivo } from './datos/privacidad.js'
import { hayRiesgo } from './datos/riesgo.js'
import { DESCRIPCION, climaEfectivo } from './datos/climas.js'
import { diasRegistrados, fechaLocal, registrosDelDia, treintaDias } from './datos/historial.js'
import { Ayuda, Cabecera, Pestanas } from './componentes/Ui.jsx'
import { TemaNoche } from './componentes/Escena.jsx'
import { Bienvenida, Menor } from './pantallas/Bienvenida.jsx'
import Inicio from './pantallas/Inicio.jsx'
import { Despedida, Emociones, Escuchando, Guardado, Pensando, PredecibleComo, Relato, Trampa } from './pantallas/Checkin.jsx'
import { CuidadoDatos, HojaAa, HojaIA, HojaMicrofono } from './pantallas/Hojas.jsx'
import Crisis from './pantallas/Crisis.jsx'
import { DetalleDia, Historial, HistorialVacio } from './pantallas/Historial.jsx'
import { Accesibilidad } from './pantallas/Accesibilidad.jsx'
import { Perfil, PrivacidadYDatos, SabeDeMi } from './pantallas/Privacidad.jsx'
import { EliminarDatos, ExportarResumen } from './pantallas/Datos.jsx'
import Sala from './pantallas/Sala.jsx'
import Refugio from './pantallas/Refugio.jsx'

const SEG_SUGERIR_CIERRE = 60

// Pantallas con barra de pestañas y la pestaña que las contiene
const PESTANA_DE = {
  inicio: 'inicio', semana: 'historial', detalle: 'historial', sala: 'sala',
  perfil: 'perfil', 'perfil-sabe': 'perfil', privacidad: 'perfil', accesibilidad: 'perfil', exportar: 'perfil', eliminar: 'perfil',
}
// Pantallas raíz: a la izquierda va «Aa»; las demás llevan volver o cerrar
const RAIZ = new Set(['bienvenida', 'inicio', 'semana', 'sala', 'perfil'])
// Pantallas del check-in: la X es «Salir por hoy»
const CHECKIN = new Set(['contar', 'pensando', 'emociones', 'trampa', 'predecible-como'])
// Pantallas hijas: a dónde vuelve la flecha
const PADRE = { menor: 'bienvenida', detalle: 'semana', 'perfil-sabe': 'perfil', privacidad: 'perfil', accesibilidad: 'perfil', exportar: 'perfil', eliminar: 'exportar' }
const TITULO = { 'perfil-sabe': 'Lo que sabe de ti', privacidad: 'Privacidad', accesibilidad: 'Accesibilidad', exportar: 'Mis datos', eliminar: 'Eliminar mis datos' }

// Ayuda contextual (RF-24): qué hacer en cada pantalla, sin salir del flujo
const AYUDA = {
  general: ['Cuenta cómo va tu cielo. Elegir el clima ya basta; contarlo es opcional.',
    '«Ayuda ya», arriba a la derecha, te muestra a quién llamar en cualquier momento.'],
  bienvenida: ['Clima Interior es un diario: eliges el clima de tu día y, si quieres, lo cuentas.',
    'Puedes respirar o mirar 30 días de ejemplo sin dar ningún dato.'],
  menor: ['Las emociones son un dato sensible (Ley 29733). Respirar y ver a quién llamar no pide ningún dato.'],
  inicio: ['Elige el clima que se parece a tu día y toca «Guardar así». Con eso basta.',
    'Si quieres, cuéntalo por voz o escríbelo. «Aa», arriba a la izquierda, cambia el texto y el movimiento.'],
  contar: ['Revisa lo que entendimos antes de que lo lea la IA y corrígelo si hace falta.',
    'La X de arriba es «Salir por hoy»: no pierdes lo que ya guardaste.'],
  emociones: ['La IA propone palabras para lo que podrías sentir. Tú eliges las tuyas o tocas «No sé, guardar igual».',
    'Las que dicen «tuya» son palabras que sueles elegir.'],
  guardado: ['«Escuchar» lee la reflexión en voz alta. «Más corto» la acorta; si lo pides seguido, la app lo recuerda.'],
  semana: ['Cada cuadrito es un día. Toca uno con registro para ver su detalle.', 'Los días sin registro no son un fallo.'],
  sala: ['En una sala ves el clima de tu grupo, nunca lo que cada persona contó ni sus emociones.',
    'Cada persona aparece con un seudónimo que cambia cada vez. Puedes retirar tu clima o salir cuando quieras.',
    'Quien crea la sala puede sacar a alguien o cerrarla. La sala se borra al cerrarla o a las 24 horas.'],
  perfil: ['Aquí ves lo que la app aprendió de cómo la usas, tu privacidad, la accesibilidad y tus datos.'],
  'perfil-sabe': ['Si apagas una categoría, también se borra lo que ya se había aprendido de ella.'],
  trampa: ['Con presión, la mente cae a veces en trampas comunes. La app solo pregunta: tú decides si te suena.',
    'Es una sugerencia automática, no un diagnóstico. Si dices «No es así», lo tomamos en cuenta y no insistimos.'],
  // Refugio (RF-42): una ayuda por paso
  'refugio:respirar': ['Inhala mientras Garúa crece y exhala, más largo, mientras se encoge. Con movimiento reducido, sigue el texto.',
    'Si te mareas, vuelve a respirar normal. «Terminar» te lleva al final sin perder nada.'],
  'refugio:elegir': ['Cada técnica dura de 1 a 3 minutos y puedes dejarla cuando quieras.',
    'Debajo de cada una dice qué tanto respaldo tiene. Si una te ayudó antes, aparece primero.'],
  'refugio:tierra': ['Nombra lo que percibes, en voz alta o en tu mente, y toca «Listo». No se guarda nada de lo que digas.'],
  'refugio:tarea': ['Escribe lo que tienes pendiente y pártelo en pasos chiquitos; el primero, de unos 15 minutos.',
    'Marca cada paso al terminarlo. La lista se queda en este teléfono hasta que la borres.'],
  'refugio:amiga': ['Imagina que alguien que quieres te cuenta esto. Lo que le dirías suele ser más justo que lo que te dices.',
    'Lo que escribas aquí no se guarda.'],
  'refugio:despues': ['Si quieres, elige cómo estabas y cómo quedaste. Se guarda solo el clima de antes y de después, nunca lo que dijiste.'],
  'refugio:resumen': ['En Historial, «Lo que te ayudó» junta tus respiros, sin rachas ni metas.'],
}

const sistemaOscuro = () => typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches

export default function App() {
  const [perfil, setPerfil] = useState(leerPerfil)
  const [pantalla, setPantalla] = useState(() => {
    if (!perfil.primerUso.completo) return 'bienvenida'
    return new URLSearchParams(location.hash.slice(1)).get('sala') ? 'sala' : 'inicio'
  })
  const [clima, setClima] = useState(null)
  const [texto, setTexto] = useState('')
  const [deVoz, setDeVoz] = useState(false)
  const [grabando, setGrabando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const [propuesta, setPropuesta] = useState(null)
  const [elegidas, setElegidas] = useState([])
  const [demo, setDemo] = useState(null)
  const [detalle, setDetalle] = useState(null) // fecha del día abierto en el historial
  const [errorMic, setErrorMic] = useState(null)
  const [ayuda, setAyuda] = useState(null) // { titulo, parrafos } mientras el diálogo está abierto
  const [hoja, setHoja] = useState(null) // 'mic' | 'ia' | 'aa' | 'datos': hojas justo a tiempo
  const [crisis, setCrisis] = useState(null) // 'boton' | 'detector'
  const [porEstaVez, setPorEstaVez] = useState(false) // transcribir en internet solo en esta sesión (J3)
  const [tarjeta, setTarjeta] = useState(null) // T1 'accesibilidad' | T2 'instalar' tras guardar
  const [guardadoHoy, setGuardadoHoy] = useState(false)
  const [instalacion, setInstalacion] = useState(null) // evento beforeinstallprompt
  const [refugio, setRefugio] = useState(null) // { tecnica?, frase?, guardable } con el que se abrió el Refugio
  const [pasoRefugio, setPasoRefugio] = useState('respirar')
  const [trampa, setTrampa] = useState(null) // como máximo una tarjeta de trampa por check-in
  const [trampaSi, setTrampaSi] = useState(false)
  const [ofertaVista, setOfertaVista] = useState(false)
  const rec = useRef(null)
  const orden = useRef(null) // última versión de «ejecutar orden de voz», para el dictado en curso
  const ultimaOrden = useRef(null)
  const consulta = useRef(0) // invalida respuestas del LLM que llegan después de salir
  const inicioCheckin = useRef(null) // para aprender cuánto dura tu check-in (RF-21)
  const leerInvitacion = () => new URLSearchParams(location.hash.slice(1)).get('sala') ?? ''
  const [codigoInvitacion, setCodigoInvitacion] = useState(leerInvitacion)

  const { preferencias, privacidad } = perfil
  const climaVista = climaEfectivo(clima, preferencias) // modo neutral: la tormenta se ve como cielo neutro (RF-34)
  const predecible = preferencias.modoPredecible
  const completo = perfil.primerUso.completo
  const tema = temaEfectivo(preferencias.tema, { sistemaOscuro: sistemaOscuro() })
  const noche = tema === 'noche'

  // Tamaño del texto y tema en <html>, para que las hojas y el fondo también cambien
  useEffect(() => {
    const html = document.documentElement
    html.dataset.texto = preferencias.tamanoTexto ?? 'normal'
    html.dataset.tema = tema
    html.dataset.movimiento = preferencias.movimientoReducido ? 'reducido' : 'normal'
  }, [preferencias.tamanoTexto, preferencias.movimientoReducido, tema])

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

  // Un enlace de invitación (#sala=CÓDIGO) abre directo la sala, también con la app ya abierta
  useEffect(() => {
    const alCambiar = () => {
      const c = leerInvitacion()
      if (!c || !completo) return
      setCodigoInvitacion(c)
      setPantalla('sala')
    }
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [completo]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!grabando) return
    const t = setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [grabando])

  const ir = (p) => { setPantalla(p); window.scrollTo?.(0, 0) }
  const cambiarAjustes = (grupo) => (cambios) => setPerfil((p) => guardarAjustes(p, grupo, cambios))
  const cambiarPreferencias = (cambios) => setPerfil((p) => guardarPreferencias(p, cambios))
  const abrirAyuda = (titulo, parrafos) => setAyuda({ titulo, parrafos })
  const ayudaDePantalla = () => (pantalla === 'refugio' ? AYUDA[`refugio:${pasoRefugio}`] : AYUDA[pantalla]) ?? AYUDA.general

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
    // Tarjetas justo a tiempo, una sola vez: T1 tras el primer día guardado, T2 tras el segundo
    const n = perfil.registros.length + 1
    const t = !perfil.avisos.accesibilidad ? 'accesibilidad' : n >= 2 && !perfil.avisos.instalar && instalacion ? 'instalar' : null
    setTarjeta(t)
    setOfertaVista(false)
    setPerfil((p) => {
      const nuevo = guardarRegistro(p, registro, { segundos })
      return t ? guardarAjustes(nuevo, 'avisos', { [t]: true }) : nuevo
    })
    setGuardadoHoy(true)
    // El día ya quedó guardado; la trampa se pregunta después, sin bloquear nada
    ir(trampa && texto && !hayRiesgo(texto) ? 'trampa' : 'guardado')
  }

  // Permisos efectivos: «Sí, por esta vez» transcribe en internet solo durante esta sesión
  const privacidadEfectiva = (p = privacidad, vez = porEstaVez) => ({ ...p, transcribirEnInternet: p.transcribirEnInternet || vez })
  const estadoVoz = (p, vez) => estadoDictado(privacidadEfectiva(p, vez), { dictado: sttDisponible(), local: transcripcionLocalDisponible() })

  function empezarGrabacion(priv = privacidadEfectiva()) {
    setHoja(null)
    setPantalla('contar')
    setErrorMic(null)
    const previo = texto.trim() // volver a grabar agrega al texto, no lo borra
    rec.current = crearGrabacion({
      local: !priv.transcribirEnInternet,
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
          ? 'El micrófono está bloqueado. Puedes escribirlo aquí; tu clima sigue elegido.'
          : 'No pudimos escucharte. Puedes escribirlo aquí o volver a intentar.')
      },
      alTerminar: () => setGrabando(false),
    })
    try {
      rec.current.start()
      setSegundos(0)
      setGrabando(true)
      setDeVoz(true)
    } catch {
      setErrorMic('No pudimos usar el micrófono. Puedes escribirlo aquí.')
    }
  }

  // «Contar mi día»: si la voz ya está permitida se graba; si no, la hoja J1 (o J3) lo pide justo ahora
  function contar() {
    if (estadoVoz() === 'ok') return empezarGrabacion()
    setHoja('mic')
  }
  function activarMicrofono() {
    const p = { ...privacidad, grabarVoz: true }
    cambiarAjustes('privacidad')({ grabarVoz: true })
    if (estadoVoz(p) === 'ok') empezarGrabacion(privacidadEfectiva(p))
    // si solo se puede transcribir en internet, la misma hoja pasa a J3
  }
  function transcribirPorEstaVez() {
    setPorEstaVez(true)
    empezarGrabacion(privacidadEfectiva(privacidad, true))
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
    else if (cual === 'salir') salirPorHoy()
    else if (cual === 'ayuda') abrirAyuda('Ayuda', AYUDA.contar)
  }

  function escribir() {
    detenerMic()
    setHoja(null)
    setErrorMic(null)
    ir('contar')
  }

  async function listo(iaEnInternet = privacidad.iaEnInternet, preguntar = true) {
    detenerMic()
    if (hayRiesgo(texto)) return abrirCrisis('detector')
    // J2: la primera vez, y solo si el proveedor configurado sale a internet, se pregunta dónde pensar la reflexión
    if (preguntar && debePreguntarIA(perfil.avisos, proveedorActivo())) return setHoja('ia')
    setHoja(null)
    ir('pensando')
    const id = ++consulta.current
    const r = await proponerEmociones(texto, { proveedor: proveedorSegunPermiso(iaEnInternet), contexto: contextoParaLLM(perfil) })
    if (id !== consulta.current) return
    setPropuesta(personalizarPropuesta(perfil, r))
    setTrampa(trampaParaMostrar(texto, r.trampas, trampasSilenciadas(perfil)))
    setTrampaSi(false)
    setElegidas([])
    ir('emociones')
  }
  function decidirIA(enInternet) {
    setPerfil((p) => guardarAjustes(guardarAjustes(p, 'privacidad', { iaEnInternet: enInternet }), 'avisos', { ia: true }))
    listo(enInternet, false)
  }

  // Historial con tus registros; sin registros, la pantalla vacía ofrece la demo
  async function abrirHistorial(verDemo = false) {
    if (verDemo) {
      const res = await fetch('/demo/registros-30-dias.json')
      setDemo(await res.json())
    } else {
      setDemo(null)
    }
    ir('semana')
  }

  // HU-08: la persona corrige el tono; al tercer pedido el perfil lo recuerda
  function masCorto() {
    setPerfil(pedirMasCorto)
    setPropuesta((p) => ({ ...p, reflexion: p.reflexion.match(/^[^.?!]*[.?!]/)?.[0] ?? p.reflexion }))
  }

  function instalar() {
    setTarjeta(null)
    if (instalacion) return instalacion.prompt()
    abrirAyuda('Instalar la app', ['En Chrome o Edge, toca el botón «Instalar» de la barra de direcciones.',
      'En el celular, abre el menú del navegador y elige «Agregar a pantalla de inicio».'])
  }

  async function eliminarTodo() {
    vibrar(perfil.preferencias)
    setPerfil(await borrarTodo())
    setClima(null); setTexto(''); setPropuesta(null); setElegidas([]); setDemo(null); setGuardadoHoy(false)
    ir('bienvenida')
    abrirAyuda('Tus datos se eliminaron', ['Borramos tus registros, tu perfil y la caché de este teléfono.', 'Puedes empezar de nuevo cuando quieras.'])
  }

  // Bienvenida: un toque declara la edad y lleva al inicio (si el sistema pide menos movimiento, se respeta, S05)
  function empezar(edad) {
    setPerfil((p) => {
      const conEdad = guardarAjustes(p, 'primerUso', { completo: true, edad })
      return sistemaPideMenosMovimiento() ? guardarPreferencias(conEdad, { movimientoReducido: true }) : conEdad
    })
    ir('inicio')
  }

  // Refugio: gratis y sin preguntas, desde el inicio, la bienvenida o tras un check-in pesado (RF-42)
  function abrirRefugio(inicial = {}) {
    detenerMic()
    setRefugio({ ...inicial, guardable: completo })
    setPasoRefugio(inicial.tecnica ?? 'respirar')
    ir('refugio')
  }

  // Crisis (C1): a un toque desde cualquier pantalla; el resto de la app queda montada debajo
  function abrirCrisis(origen) {
    detenerMic()
    setHoja(null)
    setAyuda(null)
    vibrar(preferencias)
    setCrisis(origen)
  }
  function cerrarCrisis() {
    const origen = crisis
    setCrisis(null)
    if (origen === 'detector') reiniciar()
  }

  function irAPestana(id) {
    if (id === 'inicio') return reiniciar()
    if (id === 'historial') return abrirHistorial()
    ir(id)
  }

  function reiniciar() {
    detenerMic()
    consulta.current++
    setErrorMic(null); setHoja(null)
    inicioCheckin.current = null
    setTrampa(null); setTrampaSi(false); setDeVoz(false)
    setClima(null); setTexto(''); setPropuesta(null); setElegidas([])
    ir(completo ? 'inicio' : 'bienvenida')
  }

  // «Salir por hoy»: la X del check-in. No guarda nada que no se haya guardado ya.
  function salirPorHoy() {
    reiniciar()
    ir(completo ? 'despedida' : 'bienvenida')
  }

  const porTexto = empiezaEscribiendo(perfil)
  const hoy = fechaLocal(new Date())
  const ofrecerRefugio = pantalla === 'guardado' && !ofertaVista && perfil.refugioSaltado !== hoy &&
    debeOfrecerRefugio({ clima, emociones: perfil.registros.at(-1)?.emocion_declarada, texto })
  const ultimo = perfil.registros.at(-1)
  const climaHoy = ultimo?.fecha === hoy ? ultimo.clima : null
  const capas = preferencias.capas

  // Cabecera de cada pantalla: «Aa» o volver/cerrar, la ayuda contextual y «Ayuda ya»
  function cabecera(opciones = {}) {
    let izquierda = RAIZ.has(pantalla) ? 'aa' : CHECKIN.has(pantalla) ? 'cerrar' : 'volver'
    let etiqueta
    let alTocar = () => setHoja('aa')
    if (izquierda === 'cerrar') { etiqueta = 'Salir por hoy'; alTocar = salirPorHoy }
    if (izquierda === 'volver') alTocar = () => ir(PADRE[pantalla] ?? (completo ? 'inicio' : 'bienvenida'))
    if (pantalla === 'guardado' || pantalla === 'despedida') { izquierda = 'cerrar'; etiqueta = 'Volver al inicio'; alTocar = reiniciar }
    return (
      <Cabecera izquierda={opciones.izquierda ?? izquierda} etiquetaIzquierda={opciones.etiquetaIzquierda ?? etiqueta}
        onIzquierda={opciones.onIzquierda ?? alTocar} titulo={opciones.titulo ?? TITULO[pantalla]} esTitulo={opciones.esTitulo ?? Boolean(TITULO[pantalla])}
        onAyuda={() => abrirAyuda('Ayuda', ayudaDePantalla())} onAyudaYa={() => abrirCrisis('boton')} />
    )
  }
  const cab = cabecera()
  const registrosDetalle = detalle ? registrosDelDia(demo ?? perfil.registros, detalle) : []

  return (
    <TemaNoche.Provider value={noche}>
      <main className={`app ${PESTANA_DE[pantalla] && completo ? 'app--nav' : ''}`} hidden={Boolean(crisis)} aria-hidden={crisis ? true : undefined}
        data-movimiento={preferencias.movimientoReducido ? 'reducido' : 'normal'} data-pantalla={pantalla}>

        {pantalla === 'bienvenida' && (
          <Bienvenida cabecera={cab} capas={capas} onEmpezar={() => empezar('adulto')} onRespiro={() => abrirRefugio()}
            onMenor={() => ir('menor')} onDemo={() => abrirHistorial(true)} onDatos={() => setHoja('datos')} />
        )}
        {pantalla === 'menor' && <Menor cabecera={cab} capas={capas} onEmpezar={() => empezar('menor')} onRespiro={() => abrirRefugio()} />}

        {pantalla === 'inicio' && (
          <Inicio cabecera={cab} noche={noche} capas={capas} clima={clima} climaVista={climaVista} registros={perfil.registros}
            notaRitmo={notaDeRitmo(perfil)} porTexto={porTexto} predecible={predecible}
            onElegir={elegirClima} onGuardar={() => guardar()} onContar={contar} onEscribir={escribir}
            onPredecible={() => ir('predecible-como')} onRespiro={() => abrirRefugio()} />
        )}

        {pantalla === 'contar' && grabando && (
          <Escuchando cabecera={cab} capas={capas} clima={climaVista} segundos={segundos} texto={texto}
            pista={preferencias.pistas && segundos >= 12 && !texto} minuto={segundos >= SEG_SUGERIR_CIERRE}
            enInternet={privacidadEfectiva().transcribirEnInternet} onTerminar={terminarMic} onPausar={terminarMic} onEscribir={escribir} />
        )}
        {pantalla === 'contar' && !grabando && (
          <Relato cabecera={cab} capas={capas} clima={clima} climaVista={climaVista} texto={texto} onTexto={setTexto} deVoz={deVoz && Boolean(texto)}
            duracion={segundos} estadoVoz={estadoVoz()} motivoVoz={deVoz ? MOTIVOS_DICTADO[estadoVoz()] : null} errorMic={errorMic}
            puedeHablar={estadoVoz() !== 'sin-navegador'} onListo={() => listo()} onHablar={contar} />
        )}
        {pantalla === 'predecible-como' && <PredecibleComo cabecera={cab} onHablar={contar} onEscribir={escribir} onGuardar={() => guardar()} />}
        {pantalla === 'pensando' && <Pensando cabecera={cab} capas={capas} clima={climaVista} />}
        {pantalla === 'emociones' && propuesta && (
          <Emociones cabecera={cab} capas={capas} clima={climaVista} neutral={climaVista !== clima} predecible={predecible} propuesta={propuesta}
            elegidas={elegidas} onAlternar={(n) => setElegidas((l) => l.includes(n) ? l.filter((x) => x !== n) : [...l, n])}
            onGuardar={(e) => guardar({ emociones: e })} />
        )}
        {pantalla === 'trampa' && trampa && (
          <Trampa cabecera={cab} capas={capas} clima={climaVista} trampa={trampa} respondioSi={trampaSi}
            onSi={() => { setPerfil((p) => registrarTrampa(p, trampa.tipo, 'si')); setTrampaSi(true) }}
            onNo={() => { setPerfil((p) => registrarTrampa(p, trampa.tipo, 'no')); ir('guardado') }}
            onAmiga={() => abrirRefugio({ tecnica: 'amiga', frase: trampa.frase })} onSeguir={() => ir('guardado')} />
        )}
        {pantalla === 'guardado' && (
          <Guardado cabecera={cab} capas={capas} clima={clima} climaVista={climaVista} emociones={ultimo?.emocion_declarada}
            reflexion={propuesta ? (predecible ? propuesta.reflexion.split(' ').slice(0, 80).join(' ') : propuesta.reflexion) : null}
            oferta={ofrecerRefugio} tarjeta={tarjeta} preferencias={preferencias}
            onEscuchar={() => decir(propuesta?.reflexion ?? '')} onMasCorto={masCorto} onRespiro={() => abrirRefugio()}
            onAhoraNo={() => { setOfertaVista(true); setPerfil((p) => saltarOfertaRefugio(p, hoy)) }} onListo={reiniciar}
            onTarjeta={{ cambiar: cambiarPreferencias, mas: () => { setTarjeta(null); ir('accesibilidad') }, cerrar: () => setTarjeta(null), instalar }} />
        )}
        {pantalla === 'despedida' && <Despedida cabecera={cab} capas={capas} guardadoHoy={Boolean(climaHoy)} onVolver={reiniciar} />}

        {pantalla === 'refugio' && (
          <Refugio key={JSON.stringify(refugio)} cabecera={cabecera} preferencias={preferencias} favorita={tecnicaFavorita(perfil)} inicial={refugio}
            guardable={refugio?.guardable} voz={{ disponible: estadoVoz() === 'ok', local: !privacidadEfectiva().transcribirEnInternet }}
            onPaso={setPasoRefugio} onGuardar={(r) => setPerfil((p) => guardarRefugio(p, r))} onSalir={reiniciar}
            onRiesgo={() => abrirCrisis('detector')} onMasAyuda={() => abrirCrisis('boton')} onEmpezar={() => ir('bienvenida')} />
        )}

        {pantalla === 'semana' && (demo || perfil.registros.length > 0) && (
          <Historial cabecera={completo ? cab : cabecera({ izquierda: 'volver', onIzquierda: () => ir('bienvenida'), etiquetaIzquierda: 'Volver' })}
            dias={demo ? treintaDias(demo) : treintaDias(perfil.registros, { terminaHoy: true })} demo={Boolean(demo)}
            registros={diasRegistrados(perfil.registros)} refugios={perfil.refugios}
            onDia={(f) => { setDetalle(f); ir('detalle') }} onAlternarDemo={() => abrirHistorial(!demo)} />
        )}
        {pantalla === 'semana' && !demo && perfil.registros.length === 0 && (
          <HistorialVacio cabecera={cab} onContar={reiniciar} onDemo={() => abrirHistorial(true)} />
        )}
        {pantalla === 'detalle' && registrosDetalle.length > 0 && (
          <DetalleDia cabecera={cabecera({ titulo: registroDetalleTitulo(registrosDetalle[0]) })} capas={capas} registros={registrosDetalle}
            neutral={preferencias.modoNeutral} refugios={demo ? [] : perfil.refugios.filter((r) => r.fecha === detalle)} />
        )}

        {pantalla === 'perfil' && (
          <Perfil cabecera={cab} capas={capas} onSabe={() => ir('perfil-sabe')} onPrivacidad={() => ir('privacidad')}
            onAccesibilidad={() => ir('accesibilidad')} onDatos={() => ir('exportar')} onAyuda={() => abrirAyuda('Ayuda', AYUDA.general)} />
        )}
        {pantalla === 'perfil-sabe' && (
          <SabeDeMi cabecera={cab} perfil={perfil}
            onCambio={(cambios) => setPerfil((p) => Object.entries(cambios).reduce((acc, [k, v]) => cambiarCategoria(acc, k, v), p))}
            onOlvidar={(categoria) => setPerfil((p) => restablecer(p, categoria))} />
        )}
        {pantalla === 'privacidad' && (
          <PrivacidadYDatos cabecera={cab} privacidad={privacidad} onCambio={cambiarAjustes('privacidad')} onDemo={() => abrirHistorial(!demo)} />
        )}
        {pantalla === 'accesibilidad' && (
          <Accesibilidad cabecera={cab} preferencias={preferencias} onCambio={cambiarPreferencias} onAlternarCapa={(c) => setPerfil((p) => alternarCapa(p, c))} />
        )}
        {pantalla === 'exportar' && (
          <ExportarResumen cabecera={cab} registros={perfil.registros} vibrar={() => vibrar(preferencias)} onListo={() => ir('perfil')} onEliminar={() => ir('eliminar')} />
        )}
        {pantalla === 'eliminar' && <EliminarDatos cabecera={cab} onEliminar={eliminarTodo} onCancelar={() => ir('exportar')} onExportar={() => ir('exportar')} />}

        {pantalla === 'sala' && (
          <Sala key={codigoInvitacion} cabecera={cabecera} capas={capas} climaHoy={climaHoy} codigoInicial={codigoInvitacion}
            permitido={privacidad.climaCompartido} onPermitir={() => cambiarAjustes('privacidad')({ climaCompartido: true })}
            alVolver={() => { history.replaceState(null, '', location.pathname); reiniciar() }} />
        )}

        {PESTANA_DE[pantalla] && completo && <Pestanas actual={PESTANA_DE[pantalla]} onIr={irAPestana} />}
        {import.meta.env.DEV && <footer className="pie-dev">LLM activo: {proveedorActivo().nombre}</footer>}
      </main>

      {hoja === 'mic' && (
        <HojaMicrofono estado={privacidad.grabarVoz ? estadoVoz() : sttDisponible() ? 'sin-permiso' : 'sin-navegador'} onActivar={activarMicrofono} onInternet={transcribirPorEstaVez}
          onEscribir={escribir} onCerrar={() => setHoja(null)} />
      )}
      {hoja === 'ia' && <HojaIA onInternet={() => decidirIA(true)} onTelefono={() => decidirIA(false)} onCerrar={() => setHoja(null)} />}
      {hoja === 'aa' && <HojaAa preferencias={preferencias} onCambio={cambiarPreferencias} onCerrar={() => setHoja(null)}
        onMas={completo ? () => { setHoja(null); ir('accesibilidad') } : undefined} />}
      {hoja === 'datos' && <CuidadoDatos onCerrar={() => setHoja(null)} />}
      {ayuda && (
        <Ayuda titulo={ayuda.titulo} onCerrar={() => setAyuda(null)} onMasAyuda={() => abrirCrisis('boton')}>
          {ayuda.parrafos.map((t) => <p key={t}>{t}</p>)}
        </Ayuda>
      )}
      {crisis && <Crisis origen={crisis} onVolver={cerrarCrisis} />}
    </TemaNoche.Provider>
  )
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
function registroDetalleTitulo(r) {
  const d = new Date(`${r.fecha}T12:00:00`)
  return `${DIAS[d.getDay()]} ${d.getDate()}`
}
