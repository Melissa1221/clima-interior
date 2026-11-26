// Refugio (RF-42, HU-30): herramientas de autocuidado de 1 a 3 minutos para un momento de estrés. No es terapia.
// Journey nuevo (R1): «Necesito un respiro» empieza a respirar tras una cuenta de 3 s, sin preguntas antes.
// Cómo estabas y cómo quedaste se pregunta al final y es opcional; sin primer uso completo no se guarda nada.
// Pantallas: journey-nuevo 04a, 04b, 05 y v3 refinada grupo B (B02 a B06).
import { useEffect, useRef, useState } from 'react'
import Icono from '../componentes/Icono.jsx'
import { Boton, Campo, ElegirClima, Enlace, Progreso, tabRadio, teclasRadio } from '../componentes/Ui.jsx'
import { Escena, Suelo } from '../componentes/Escena.jsx'
import { Mundo } from '../mundo/Mundo.jsx'
import Garua from '../mundo/Garua.jsx'
import { CLIMAS, climaEfectivo } from '../datos/climas.js'
import { RITMOS, TECNICAS, duracionRitmo, fraseDeCambio, ordenarTecnicas } from '../datos/refugio.js'
import { crearGrabacion, decir } from '../voz/stt.js'
import { sistemaPideMenosMovimiento, vibrar } from '../datos/accesibilidad.js'
import { hayRiesgo } from '../datos/riesgo.js'
import { agregarPaso, alternarPaso, borrarTarea, cambiarQue, leerTarea, quitarPaso } from '../datos/tarea.js'

const fechaLocal = (d) => d.toLocaleDateString('en-CA')
const etiquetaDe = (id) => CLIMAS.find((c) => c.id === id)?.etiqueta ?? ''
const ICONO_TECNICA = { respirar: 'respiro', tierra: 'eye', tarea: 'tasks', amiga: 'amiga' }
const CUENTA = 3

// Dictado corto dentro del Refugio (reusa la Web Speech API del check-in). Nada de lo dicho se guarda.
function useDictado({ voz, onRiesgo }) {
  const rec = useRef(null)
  const [escuchando, setEscuchando] = useState(false)
  const [oido, setOido] = useState('')
  useEffect(() => () => rec.current?.abort?.(), [])
  function empezar(alTerminar) {
    if (!voz.disponible) return
    setOido('')
    rec.current = crearGrabacion({
      local: voz.local,
      alTexto: (t) => { setOido(t); if (hayRiesgo(t)) { rec.current?.abort?.(); onRiesgo() } },
      alError: () => setEscuchando(false),
      alTerminar: (t) => { setEscuchando(false); alTerminar?.(t) },
    })
    try { rec.current.start(); setEscuchando(true) } catch { setEscuchando(false) }
  }
  const parar = () => { rec.current?.stop?.(); setEscuchando(false) }
  const cancelar = () => { rec.current?.abort?.(); rec.current = null; setEscuchando(false); setOido('') }
  return { escuchando, oido, empezar, parar, cancelar }
}

// Respirar con la lluvia: cuenta de 3 s y luego respiración lenta (4 s / 6 s) o suspiro cíclico.
// Garúa crece al inhalar y se encoge al exhalar. Con movimiento reducido nada se anima: queda el texto
// y, si está activa, una vibración corta en cada cambio.
function Respirar({ cabecera, preferencias, capas, onTerminar, onOtra, onMasAyuda }) {
  const [ritmo, setRitmo] = useState('lenta')
  const [cuenta, setCuenta] = useState(CUENTA)
  const [cambiando, setCambiando] = useState(false)
  const [paso, setPaso] = useState({ ciclo: 0, fase: 0 })
  const [terminado, setTerminado] = useState(false)
  // B5: también si lo pide el sistema aunque no se haya activado en la app (si no, Garúa cambiaba de tamaño a saltos)
  const reducido = preferencias.movimientoReducido || sistemaPideMenosMovimiento()
  const r = RITMOS[ritmo]
  const corriendo = cuenta === 0 && !terminado

  // La cuenta se detiene mientras se elige otro ritmo
  useEffect(() => {
    if (cuenta === 0 || cambiando) return
    const t = setTimeout(() => setCuenta((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cuenta, cambiando])

  useEffect(() => {
    if (!corriendo) return
    const [texto, seg] = r.fases[paso.fase]
    if (preferencias.describirEnVoz) decir(texto.replace('…', ''))
    if (reducido) vibrar(preferencias, 40)
    const t = setTimeout(() => {
      const siguienteFase = (paso.fase + 1) % r.fases.length
      const ciclo = paso.ciclo + (siguienteFase === 0 ? 1 : 0)
      if (ciclo >= r.ciclos) { setTerminado(true); return }
      setPaso({ ciclo, fase: siguienteFase })
    }, seg * 1000)
    return () => clearTimeout(t)
  }, [corriendo, paso]) // eslint-disable-line react-hooks/exhaustive-deps

  const [guia, seg] = r.fases[paso.fase]
  const inhala = corriendo && !guia.startsWith('Exhala')
  const escala = !corriendo || reducido ? 0.86 : inhala ? (paso.fase === 0 ? 1.08 : 1.14) : 0.78
  const minutos = Math.max(1, Math.round(duracionRitmo(ritmo) / 60))
  const resumen = `${r.nombre} · ${r.ciclos} respiraciones · ${minutos} min`
  // M5: elegir un ritmo no cierra el panel (se puede comparar); «Listo» o Escape lo cierran y la cuenta vuelve a empezar
  const cerrarRitmo = () => { setCambiando(false); setCuenta(CUENTA); setPaso({ ciclo: 0, fase: 0 }) }
  useEffect(() => {
    if (!cambiando) return
    const alTecla = (e) => { if (e.key === 'Escape') cerrarRitmo() }
    document.addEventListener('keydown', alTecla)
    return () => document.removeEventListener('keydown', alTecla)
  }, [cambiando])

  return (
    <Escena clima="lluvia" hy={660} suelo={812} flores="journey" brillo={[188, 400]} mar={false} capas={capas} cabecera={cabecera}
      className="escena--respiro" alto="100dvh">
      <div className={`respiro ${cambiando ? 'respiro--cambiando' : ''}`} data-fase={corriendo ? (inhala ? 'inhala' : 'exhala') : 'quieto'}>
        {cuenta > 0 ? (
          <div className="respiro__textos">
            <p className="etiqueta">Respirar con la lluvia</p>
            <h1 className="display-xl respiro__ponte">Acomódate.</h1>
            <p className="cuerpo-l" aria-live="polite">{cambiando ? 'Elige tu ritmo' : `Empezamos en ${cuenta}…`}</p>
          </div>
        ) : terminado ? (
          <div className="respiro__textos">
            <h1 className="display-l" role="status">Listo.</h1>
            <p className="cuerpo-l">Respira normal un momento.</p>
          </div>
        ) : (
          <div className="respiro__textos">
            <p className="sr">Respirar con la lluvia</p>
            <h1 className="display-xl respiro__guia" aria-live="polite">{guia}</h1>
            <p className="cuerpo-l">{inhala ? 'por la nariz' : 'por la boca, lento'} · {seg} segundos</p>
          </div>
        )}
        <div className="respiro__garua">
          {cuenta > 0 && (
            <svg className="respiro__aro" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="48" className="respiro__aro-fondo" />
              <circle cx="50" cy="50" r="48" className="respiro__aro-avance" pathLength="1"
                style={{ strokeDashoffset: 1 - (CUENTA - cuenta + 1) / CUENTA }} />
            </svg>
          )}
          <div className="respiro__nube" style={{ transform: `scale(${escala})`, transitionDuration: reducido ? '0ms' : `${corriendo ? seg : 0.6}s` }}>
            <Garua estado={corriendo && !inhala && !reducido ? 'exhala' : 'inhala'} tam={300} animacion="ninguna" />
          </div>
        </div>
        <div className="respiro__pie">
          {cuenta > 0 && !cambiando && (
            <>
              <p className="cuerpo">{resumen}</p>
              <div className="fila-enlaces">
                <Enlace icono="sliders" onClick={() => setCambiando(true)}>Cambiar ritmo</Enlace>
                <Enlace onClick={onOtra}>Elegir otra cosa</Enlace>
              </div>
            </>
          )}
          {cambiando && (
            <div className="ritmos">
              <div className="lista ritmos__lista" role="radiogroup" aria-label="Tipo de respiración" onKeyDown={teclasRadio}>
                {Object.entries(RITMOS).map(([id, { nombre, descripcion }], i) => (
                  <button key={id} type="button" role="radio" aria-checked={ritmo === id} tabIndex={tabRadio(ritmo === id, i, true)} className="fila fila--radio" onClick={() => setRitmo(id)}>
                    <span className="radio-marca" aria-hidden="true" />
                    <span className="fila__textos"><span className="fila__titulo">{nombre}</span><small className="fila__desc">{descripcion}</small></span>
                  </button>
                ))}
              </div>
              <Boton tipo="linea" onClick={cerrarRitmo}>Listo</Boton>
              <Enlace onClick={onOtra}>Elegir otra cosa</Enlace>
            </div>
          )}
          {corriendo && (
            <>
              <Progreso paso={paso.ciclo + 1} total={r.ciclos} etiqueta={`Respiración ${paso.ciclo + 1} de ${r.ciclos}`} />
              <p className="cuerpo">Respiración {paso.ciclo + 1} de {r.ciclos} · {minutos} min</p>
              <Boton tipo="linea" onClick={onTerminar}>Terminar</Boton>
            </>
          )}
          {terminado && <Boton onClick={onTerminar}>Seguir</Boton>}
          <Enlace onClick={onMasAyuda}>Necesito más ayuda</Enlace>
        </div>
      </div>
    </Escena>
  )
}

// B02 · ¿Qué te vendría bien? La favorita solo cambia el orden de la lista
function Elegir({ cabecera, capas, favorita, onElegir, onMasAyuda }) {
  return (
    <>
      <Escena clima="nublado" hy={150} suelo={230} flores="simples" brillo={[300, 80]} mar={false} capas={capas} cabecera={cabecera} alto={230}
        garua={{ estado: 'curiosa', tam: 92, izq: 22, x: 'auto', y: 26 }}>
        <h1 className="burbuja burbuja--derecha display-s">¿Qué te vendría bien?</h1>
      </Escena>
      <Suelo matas={false}>
        <p className="meta">Cada una dura poco y puedes dejarla cuando quieras.</p>
        <ul className="lista tecnicas">
          {ordenarTecnicas(favorita).map((id) => (
            <li key={id}>
              <button type="button" className="fila tecnica" onClick={() => onElegir(id)}>
                <span className="fila__icono"><Icono nombre={ICONO_TECNICA[id]} tam={22} /></span>
                <span className="fila__textos">
                  <span className="fila__titulo">{TECNICAS[id].titulo}</span>
                  <small className="fila__desc">{TECNICAS[id].duracion} · {TECNICAS[id].evidencia}</small>
                  {id === favorita && <small className="tecnica__tuya"><Icono nombre="check" tam={14} />Te ayudó antes</small>}
                </span>
                <span className="fila__chev"><Icono nombre="chev" tam={20} /></span>
              </button>
            </li>
          ))}
        </ul>
        <Enlace onClick={onMasAyuda} className="centrado">Necesito más ayuda</Enlace>
      </Suelo>
    </>
  )
}

// B03 · 5-4-3-2-1 (grounding). Práctica clínica muy usada, SIN ensayos controlados (validación 03 §1): se dice así.
const SENTIDOS = [
  [5, 'cosas que ves', 'Mira a tu alrededor sin apuro: colores, formas, la luz.'],
  [4, 'cosas que oyes', 'Sonidos cerca y lejos, aunque sean pequeños.'],
  [3, 'cosas que puedes tocar', 'Tu ropa, la mesa, tus pies en el piso.'],
  [2, 'cosas que hueles', 'O dos olores que te gusten, si no notas ninguno.'],
  [1, 'cosa que saboreas', 'O un sabor que te guste recordar.'],
]

function Tierra({ cabecera, capas, voz, onRiesgo, onTerminar }) {
  const [i, setI] = useState(0)
  const dictado = useDictado({ voz, onRiesgo })
  const [n, que, pista] = SENTIDOS[i]
  const siguiente = () => {
    dictado.cancelar()
    if (i + 1 >= SENTIDOS.length) onTerminar()
    else setI(i + 1)
  }
  return (
    <>
      <Escena clima="niebla" hy={330} suelo={400} flores="ninguna" brillo={[188, 160]} mar={false} capas={capas} cabecera={cabecera} alto={340}>
        <div className="tierra__arriba">
          <Progreso paso={i + 1} total={SENTIDOS.length} etiqueta={`Paso ${i + 1} de ${SENTIDOS.length}`} />
          <p className="meta" aria-hidden="true">Paso {i + 1} de {SENTIDOS.length}</p>
          <div className="tierra__garua">
            <span className="anillos anillos--quietos" aria-hidden="true"><i className="anillo anillo--2" /><i className="anillo anillo--1" /></span>
            <Garua estado="quieta" tam={120} animacion="ninguna" />
          </div>
        </div>
      </Escena>
      <Suelo matas={false}>
        <h1 className="display-m" aria-live="polite"><span className="sr">Paso {i + 1} de {SENTIDOS.length}: </span>{n} {que}</h1>
        <p className="cuerpo">{pista} Dilos en voz alta o solo piénsalos.</p>
        {dictado.escuchando && <p className="cap" aria-live="polite"><span className="rec" aria-hidden="true" />Te escucho…</p>}
        {dictado.oido && <p className="cap">«{dictado.oido}»</p>}
        <div className="pila">
          <Boton onClick={siguiente}>{i + 1 >= SENTIDOS.length ? 'Terminar' : 'Listo'}</Boton>
          {voz.disponible && !dictado.escuchando && <Boton tipo="linea" icono="mic" onClick={() => dictado.empezar()}>Decirlo en voz alta</Boton>}
          {dictado.escuchando && <Boton tipo="linea" onClick={dictado.parar}>Ya lo dije</Boton>}
        </div>
        <p className="cap"><Icono nombre="info" tam={16} />{TECNICAS.tierra.evidencia} No se guarda lo que digas.</p>
      </Suelo>
    </>
  )
}

// B04 · Partir la tarea: lo que más dicen los estudiantes que les sirve (01 §3). La lista queda en el teléfono.
function Tarea({ cabecera, capas, voz, onRiesgo, onTerminar }) {
  const [tarea, setTarea] = useState(leerTarea)
  const [nuevo, setNuevo] = useState('')
  const dictado = useDictado({ voz, onRiesgo })
  const revisar = (t) => { if (hayRiesgo(t)) { onRiesgo(); return false } return true }
  function agregar(texto = nuevo) {
    if (!texto.trim() || !revisar(texto)) return
    setTarea((t) => agregarPaso(t, texto))
    setNuevo('')
  }
  const hechos = tarea.pasos.filter((p) => p.hecho).length
  return (
    <>
      <Escena clima="nublado" hy={90} suelo={150} flores="ninguna" brillo={[300, 40]} mar={false} capas={capas} cabecera={cabecera} alto={150}
        garua={{ estado: 'pensando', tam: 70, x: 40, y: 12 }} />
      <Suelo matas={false} className="suelo--form">
        <h1 className="sr">Partir la tarea</h1>
        <Campo id="tarea-que" multilinea etiqueta="¿Qué tienes que hacer?" value={tarea.que} placeholder="Estudiar para el parcial de IA" maxLength={120}
          onChange={(e) => setTarea((t) => cambiarQue(t, e.target.value))} onBlur={(e) => revisar(e.target.value)} />
        {tarea.pasos.length > 0 && (
          <>
            <div className="tarea__cabeza">
              <p className="meta" role="status">{hechos} de {tarea.pasos.length} pasos hechos</p>
              <Enlace onClick={() => { if (window.confirm('¿Borrar la lista? No se puede deshacer.')) setTarea(borrarTarea()) }}>Borrar la lista</Enlace>
            </div>
            <ul className="lista pasos" aria-label="Pasos pequeños">
              {tarea.pasos.map((p, i) => (
                <li key={`${i}-${p.texto}`} className={p.hecho ? 'paso paso--hecho' : 'paso'}>
                  <label>
                    <input type="checkbox" checked={p.hecho} onChange={() => setTarea((t) => alternarPaso(t, i))} />
                    <span className="paso__textos"><span className="paso__texto">{p.texto}</span>{i === 0 && <small>Primer paso · unos 15 min</small>}</span>
                  </label>
                  <button type="button" className="ib ib--plano" aria-label={`Quitar «${p.texto}»`} onClick={() => setTarea((t) => quitarPaso(t, i))}>
                    <Icono nombre="close" tam={20} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        <form className="agregar" onSubmit={(e) => { e.preventDefault(); agregar() }}>
          <Campo id="tarea-paso" multilinea etiqueta={tarea.pasos.length ? 'Otro paso pequeño' : 'Un primer paso de unos 15 minutos'} value={nuevo}
            placeholder={tarea.pasos.length ? 'Algo chiquito' : 'Leer la primera página'} maxLength={140} onChange={(e) => setNuevo(e.target.value)} />
          <div className="agregar__botones">
            <Boton type="submit" tipo="linea" icono="plus" disabled={!nuevo.trim()}>Agregar paso</Boton>
            {voz.disponible && (dictado.escuchando
              ? <button type="button" className="ib" aria-label="Ya lo dije" onClick={dictado.parar}><Icono nombre="pause" tam={20} /></button>
              : <button type="button" className="ib" aria-label="Dictar un paso" onClick={() => dictado.empezar((t) => agregar(t))}><Icono nombre="mic" tam={20} /></button>)}
          </div>
        </form>
        {dictado.escuchando && <p className="cap" aria-live="polite">{dictado.oido ? `«${dictado.oido}»` : 'Te escucho…'}</p>}
        <Boton onClick={onTerminar}>Listo por ahora</Boton>
        <p className="cap cap--centro"><Icono nombre="lock" tam={16} />Se queda en tu teléfono hasta que la borres.</p>
      </Suelo>
    </>
  )
}

// B05 · ¿Qué le dirías a alguien que quieres? (autocompasión). Si viene de una trampa, usa la frase de la persona. No se guarda.
function Amiga({ cabecera, capas, frase, onRiesgo, onTerminar }) {
  const [texto, setTexto] = useState('')
  const [leer, setLeer] = useState(false)
  function seguir() {
    if (hayRiesgo(texto)) return onRiesgo()
    if (!leer) return setLeer(true)
    onTerminar()
  }
  return (
    <Escena clima="nublado" hy={700} suelo={812} flores="simples" brillo={[300, 120]} mar={false} capas={capas} cabecera={cabecera} className="escena--tarjeta">
      <Garua estado="comprensiva" tam={96} className="tarjeta__garua" />
      <section className="tarjeta" aria-labelledby="amiga-titulo">
        <h1 id="amiga-titulo" className="sr">{TECNICAS.amiga.titulo}</h1>
        {!leer ? (
          <>
            <p className="meta">{frase ? 'Imagina que alguien que quieres te dice' : 'Imagina que alguien que quieres está pasando por lo mismo que tú.'}</p>
            {frase && <blockquote className="cita">«{frase}»</blockquote>}
            <p className="cuerpo">¿Qué le dirías? Seguro no le hablarías tan duro.</p>
            <hr className="hr" />
            <label htmlFor="amiga-texto" className="meta">Lo que le dirías · no se guarda</label>
            <textarea id="amiga-texto" className="area" rows={4} value={texto} onChange={(e) => setTexto(e.target.value)}
              placeholder="Estudiaste un montón. Una nota no dice quién eres." />
            <Boton onClick={seguir}>Seguir</Boton>
          </>
        ) : (
          <>
            <p className="cita" role="status">{texto.trim() ? `«${texto.trim()}»` : 'Piensa en esas palabras amables.'}</p>
            <p className="cuerpo">Ahora prueba decírtelo a ti, con el mismo cariño.</p>
            <Boton onClick={seguir}>Listo</Boton>
          </>
        )}
        <p className="cap cap--centro"><Icono nombre="info" tam={16} />{TECNICAS.amiga.evidencia}</p>
      </section>
    </Escena>
  )
}

// 05 · ¿Cómo quedaste? Opcional: si no se eligen los dos climas, no se guarda nada
function Despues({ cabecera, capas, antes, despues, setAntes, setDespues, onListo, onOtra, onSaltar }) {
  return (
    <>
      <Escena clima={despues ?? 'nublado'} hy={300} suelo={380} flores="journey" brillo={[280, 220]} capas={capas} cabecera={cabecera}
        garua={{ estado: 'contenta-suave', tam: 128, x: 32, y: 26 }}>
        <h1 className="burbuja display-m">¿Cómo quedaste?</h1>
      </Escena>
      <Suelo>
        <p className="etiqueta" id="antes-lbl">Antes</p>
        <ElegirClima valor={antes} onElegir={setAntes} etiqueta="Cómo estabas antes" />
        <p className="etiqueta" id="ahora-lbl">Ahora</p>
        <ElegirClima valor={despues} onElegir={setDespues} etiqueta="Cómo estás ahora" />
        <p className="cap"><Icono nombre="lock" tam={16} />Es opcional. Si no eliges, no se guarda nada.</p>
        <Boton onClick={onListo}>Listo</Boton>
        <div className="fila-enlaces fila-enlaces--extremos">
          <Enlace onClick={onOtra}>Otra técnica</Enlace>
          <Enlace onClick={onSaltar}>Saltar</Enlace>
        </div>
      </Suelo>
    </>
  )
}

function MiniCielo({ clima, capas }) {
  return (
    <span className={`mini-cielo paisaje--${clima}`}>
      <Mundo clima={clima} hy={70} suelo={96} flores="ninguna" brillo={[60, 40]} mar={false} capas={capas} />
    </span>
  )
}

// B06 · Tu respiro: antes → después en dos cielos pequeños y en palabras
function Resumen({ cabecera, capas, antes, despues, guardado, guardable, onVolver, onEmpezar }) {
  const hubo = antes && despues
  const frase = hubo ? fraseDeCambio(antes, despues) : 'Bien por darte este momento.'
  const titulo = hubo ? frase.split('.')[0] : 'Bien por darte este momento'
  return (
    <>
      <Escena clima={despues ?? 'nublado'} hy={300} suelo={380} flores="journey" brillo={[300, 200]} capas={capas} cabecera={cabecera}
        garua={{ estado: 'contenta-suave', tam: 128, x: 24, y: 28 }}>
        <h1 className="burbuja display-m">{titulo}</h1>
      </Escena>
      <Suelo>
        {hubo && (
          <div className="antes-despues">
            <div><p className="meta">Antes</p><MiniCielo clima={antes} capas={capas} /><p className="cap"><Icono nombre={antes} tam={16} />{etiquetaDe(antes)}</p></div>
            <Icono nombre="arrow" tam={22} className="antes-despues__flecha" />
            <div><p className="meta">Ahora</p><MiniCielo clima={despues} capas={capas} /><p className="cap"><Icono nombre={despues} tam={16} />{etiquetaDe(despues)}</p></div>
            <p className="sr">De {etiquetaDe(antes).toLowerCase()} a {etiquetaDe(despues).toLowerCase()}.</p>
          </div>
        )}
        <p className="cuerpo" role="status">{hubo ? frase.split('.').slice(1).join('.').trim() || frase : ''} Contarle a alguien de confianza cómo te sientes también ayuda.</p>
        <Boton onClick={onVolver}>Volver al inicio</Boton>
        {guardado && <p className="cap cap--centro"><Icono nombre="lock" tam={16} />Solo se guardó el clima de antes y de después.</p>}
        {!guardable && (
          <p className="cap cap--centro">¿Quieres guardar cómo te va? <Enlace onClick={onEmpezar}>Empezar</Enlace></p>
        )}
      </Suelo>
    </>
  )
}

const TITULOS = { cuenta: null, respirar: null, elegir: 'Un respiro', tierra: 'Volver al presente', tarea: 'Partir la tarea', amiga: '¿Qué le dirías a alguien que quieres?', despues: null, resumen: 'Tu respiro' }

// cabecera(opciones) arma la cabecera de la app (cerrar/volver + ayuda contextual + «Ayuda ya»)
export default function Refugio({ cabecera, preferencias, voz = { disponible: false }, favorita, inicial, guardable = true,
  onPaso, onGuardar, onSalir, onRiesgo, onMasAyuda, onEmpezar }) {
  const [paso, setPaso] = useState(inicial?.tecnica ?? 'respirar')
  const [antes, setAntes] = useState(null)
  const [despues, setDespues] = useState(null)
  const [tecnica, setTecnica] = useState(inicial?.tecnica ?? 'respirar')
  const [guardado, setGuardado] = useState(false)
  const inicio = useRef(Date.now())
  const pregunto = useRef(false) // M4: «¿Cómo quedaste?» se pregunta una sola vez por visita al Refugio

  useEffect(() => { onPaso?.(paso) }, [paso]) // eslint-disable-line react-hooks/exhaustive-deps

  const ir = (p) => { setPaso(p); window.scrollTo?.(0, 0) }
  const elegirTecnica = (id) => { setTecnica(id); ir(id) }
  // Al terminar una técnica: la primera vez, «¿Cómo quedaste?»; si ya se preguntó, directo al resumen
  function terminar() {
    if (pregunto.current) return listo()
    pregunto.current = true
    ir('despues')
  }
  function listo() {
    if (antes && despues && guardable && !guardado) {
      onGuardar({ fecha: fechaLocal(new Date()), tecnica, antes, despues, segundos: Math.round((Date.now() - inicio.current) / 1000) })
      setGuardado(true)
    }
    ir('resumen')
  }
  const capas = preferencias.capas
  const cielo = (c) => (c ? climaEfectivo(c, preferencias) : c)
  const enTecnica = ['tierra', 'tarea', 'amiga'].includes(paso)
  const cab = cabecera({
    izquierda: enTecnica ? 'volver' : 'cerrar',
    etiquetaIzquierda: enTecnica ? 'Elegir otra técnica' : 'Salir del respiro',
    onIzquierda: enTecnica ? () => ir('elegir') : onSalir,
    titulo: TITULOS[paso],
  })

  if (paso === 'respirar') {
    return <Respirar cabecera={cab} preferencias={preferencias} capas={capas} onTerminar={terminar} onOtra={() => ir('elegir')} onMasAyuda={onMasAyuda} />
  }
  if (paso === 'elegir') return <Elegir cabecera={cab} capas={capas} favorita={favorita} onElegir={elegirTecnica} onMasAyuda={onMasAyuda} />
  if (paso === 'tierra') return <Tierra cabecera={cab} capas={capas} voz={voz} onRiesgo={onRiesgo} onTerminar={terminar} />
  if (paso === 'tarea') return <Tarea cabecera={cab} capas={capas} voz={voz} onRiesgo={onRiesgo} onTerminar={terminar} />
  if (paso === 'amiga') return <Amiga cabecera={cab} capas={capas} frase={inicial?.frase} onRiesgo={onRiesgo} onTerminar={terminar} />
  if (paso === 'despues') {
    return <Despues cabecera={cab} capas={capas} antes={antes} despues={despues} setAntes={setAntes} setDespues={setDespues}
      onListo={listo} onOtra={() => ir('elegir')} onSaltar={() => ir('resumen')} />
  }
  return <Resumen cabecera={cab} capas={capas} antes={cielo(antes)} despues={cielo(despues)} guardado={guardado} guardable={guardable}
    onVolver={onSalir} onEmpezar={onEmpezar} />
}
