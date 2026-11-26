// Refugio (RF-42, HU-30): herramientas de autocuidado de 1 a 3 minutos para un momento de estrés.
// No es terapia. Flujo: cómo estás ahora (antes) → una técnica → cómo quedaste (después) → antes y después.
// Una pregunta por pantalla, así que también sirve tal cual en el modo predecible.
import { useEffect, useRef, useState } from 'react'
import Paisaje from '../componentes/Paisaje.jsx'
import Icono from '../componentes/Icono.jsx'
import { Boton, Campo } from '../componentes/Ui.jsx'
import { CLIMAS, climaEfectivo } from '../datos/climas.js'
import { RITMOS, TECNICAS, duracionRitmo, fraseDeCambio, fraseResumen, ordenarTecnicas, resumenRefugios } from '../datos/refugio.js'
import { crearGrabacion, decir } from '../voz/stt.js'
import { vibrar } from '../datos/accesibilidad.js'
import { hayRiesgo } from '../datos/riesgo.js'
import { agregarPaso, alternarPaso, borrarTarea, cambiarQue, leerTarea, quitarPaso } from '../datos/tarea.js'

const fechaLocal = (d) => d.toLocaleDateString('en-CA')
const climaDe = (id) => CLIMAS.find((c) => c.id === id)

// Los cinco climas como opciones excluyentes (el mismo control del check-in)
function ElegirClima({ valor, onElegir, etiqueta }) {
  return (
    <div className="climas" role="radiogroup" aria-label={etiqueta}>
      {CLIMAS.map((c) => (
        <button key={c.id} role="radio" aria-checked={valor === c.id} className={valor === c.id ? 'clima activo' : 'clima'} onClick={() => onElegir(c.id)}>
          <span aria-hidden="true">{c.icono}</span>{c.etiqueta}
        </button>
      ))}
    </div>
  )
}

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

// 5-4-3-2-1 (grounding). Práctica clínica muy usada, SIN ensayos controlados (validación 03 §1): se dice así en la
// pantalla. La persona responde en voz alta, en su mente o solo toca «Listo». No se guarda nada salvo que terminó.
const SENTIDOS = [
  [5, 'cosas que ves', 'Mira a tu alrededor sin apuro: colores, formas, la luz.'],
  [4, 'cosas que oyes', 'Sonidos cerca y lejos, aunque sean pequeños.'],
  [3, 'cosas que puedes tocar', 'Tu ropa, la mesa, tus pies en el piso.'],
  [2, 'cosas que hueles', 'O dos olores que te gusten, si no notas ninguno.'],
  [1, 'cosa que saboreas', 'O un sabor que te guste recordar.'],
]

function Tierra({ voz, onRiesgo, onTerminar }) {
  const [i, setI] = useState(0)
  const dictado = useDictado({ voz, onRiesgo })
  const [n, que, pista] = SENTIDOS[i]
  const siguiente = () => {
    dictado.cancelar()
    if (i + 1 >= SENTIDOS.length) onTerminar()
    else setI(i + 1)
  }
  return (
    <section className="hoja" aria-labelledby="tierra-titulo">
      <div className="progreso">
        <small id="tierra-avance">Paso {i + 1} de {SENTIDOS.length}</small>
        <div className="progreso__barra" role="progressbar" aria-labelledby="tierra-avance" aria-valuemin={1} aria-valuemax={SENTIDOS.length} aria-valuenow={i + 1}>
          <div className="progreso__relleno" style={{ width: `${((i + 1) / SENTIDOS.length) * 100}%` }} />
        </div>
      </div>
      <p className="tierra__numero" aria-hidden="true">{n}</p>
      <h1 id="tierra-titulo" className="hoja__titulo-grande" aria-live="polite">{n} {que}</h1>
      <p className="pequeno">{pista} Puedes decirlas en voz alta o solo pensarlas.</p>
      {dictado.escuchando && <p className="pildora" aria-live="polite"><span className="punto" /> Te escucho…</p>}
      {dictado.oido && <p className="escucha">«{dictado.oido}»</p>}
      <Boton onClick={siguiente}>{i + 1 >= SENTIDOS.length ? 'Terminar' : 'Listo'}</Boton>
      {voz.disponible && !dictado.escuchando && (
        <Boton tipo="secundario" icono="mic" onClick={() => dictado.empezar()}>Decirlo en voz alta</Boton>
      )}
      {dictado.escuchando && <Boton tipo="secundario" onClick={dictado.parar}>Ya lo dije</Boton>}
      <p className="pequeno">{TECNICAS.tierra.evidencia} No se guarda lo que digas.</p>
    </section>
  )
}

// Partir la tarea: lo que más dicen los estudiantes que les sirve («hacer una lista y tacharla», 01 §3).
// El primer paso se plantea de unos 15 minutos. La lista queda en el teléfono hasta que la persona la borre.
function Tarea({ voz, onRiesgo, onTerminar }) {
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
    <section className="hoja" aria-labelledby="tarea-titulo">
      <h1 id="tarea-titulo" className="hoja__titulo-grande">Partir la tarea</h1>
      <Campo id="tarea-que" etiqueta="¿Qué tienes que hacer?" value={tarea.que} placeholder="Estudiar para el parcial de IA" maxLength={120}
        onChange={(e) => setTarea((t) => cambiarQue(t, e.target.value))} onBlur={(e) => revisar(e.target.value)} />
      {tarea.pasos.length > 0 && (
        <>
          <p className="pequeno" role="status">{hechos} de {tarea.pasos.length} pasos hechos</p>
          <ul className="pasos" aria-label="Pasos pequeños">
            {tarea.pasos.map((p, i) => (
              <li key={`${i}-${p.texto}`} className={p.hecho ? 'paso paso--hecho' : 'paso'}>
                <label>
                  <input type="checkbox" checked={p.hecho} onChange={() => setTarea((t) => alternarPaso(t, i))} />
                  <span className="paso__textos"><span className="paso__texto">{p.texto}</span>{i === 0 && <small>Primer paso · unos 15 min</small>}</span>
                </label>
                <button type="button" className="ib ib--plano" aria-label={`Quitar «${p.texto}»`} onClick={() => setTarea((t) => quitarPaso(t, i))}>
                  <Icono nombre="borrar" tam={20} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <form className="agregar" onSubmit={(e) => { e.preventDefault(); agregar() }}>
        <Campo id="tarea-paso" etiqueta={tarea.pasos.length ? 'Otro paso pequeño' : 'Un primer paso de unos 15 minutos'} value={nuevo}
          placeholder={tarea.pasos.length ? 'Algo chiquito' : 'Leer la primera página'} maxLength={140} onChange={(e) => setNuevo(e.target.value)} />
        <Boton type="submit" disabled={!nuevo.trim()}>Agregar</Boton>
      </form>
      {voz.disponible && (dictado.escuchando
        ? <Boton tipo="secundario" onClick={dictado.parar}>Ya lo dije</Boton>
        : <Boton tipo="secundario" icono="mic" onClick={() => dictado.empezar((t) => agregar(t))}>Dictar un paso</Boton>)}
      {dictado.escuchando && <p className="escucha" aria-live="polite">{dictado.oido ? `«${dictado.oido}»` : 'Te escucho…'}</p>}
      <Boton onClick={onTerminar}>Listo por ahora</Boton>
      {(tarea.pasos.length > 0 || tarea.que) && (
        <button type="button" className="enlace" onClick={() => { if (window.confirm('¿Borrar la lista? No se puede deshacer.')) setTarea(borrarTarea()) }}>
          Borrar la lista
        </button>
      )}
      <p className="pequeno">La lista se queda en este teléfono hasta que la borres.</p>
    </section>
  )
}

// ¿Qué le dirías a una amiga? (autocompasión). Si viene de una trampa, usa la frase de la persona.
// Lo escrito no se guarda: solo sirve para mirarlo y leérselo a una misma o a uno mismo.
function Amiga({ frase, onRiesgo, onTerminar }) {
  const [texto, setTexto] = useState('')
  const [leer, setLeer] = useState(false)
  function seguir() {
    if (hayRiesgo(texto)) return onRiesgo()
    if (!leer) return setLeer(true)
    onTerminar()
  }
  return (
    <section className="hoja" aria-labelledby="amiga-titulo">
      <h1 id="amiga-titulo" className="hoja__titulo-grande">{TECNICAS.amiga.titulo}</h1>
      {!leer ? (
        <>
          <p className="trampa__cita">{frase
            ? <>Imagina que una amiga o un amigo te dice: <strong>«{frase}»</strong>.</>
            : 'Imagina que una amiga o un amigo está pasando por lo mismo que tú.'}</p>
          <p className="pequeno">¿Qué le dirías? ¿Con qué tono? Seguro no le hablarías tan duro.</p>
          <label htmlFor="amiga-texto" className="hoja__titulo">Lo que le dirías (no se guarda)</label>
          <textarea id="amiga-texto" rows={4} value={texto} onChange={(e) => setTexto(e.target.value)}
            placeholder="Tranquila, tranquilo: estudiaste, y una nota no dice quién eres…" />
          <Boton onClick={seguir}>Seguir</Boton>
        </>
      ) : (
        <>
          <p className="trampa__pregunta" role="status">{texto.trim() ? `«${texto.trim()}»` : 'Piensa en esas palabras amables.'}</p>
          <p>Ahora prueba decírtelo a ti, con el mismo cariño.</p>
          <p className="pequeno">{TECNICAS.amiga.evidencia}</p>
          <Boton onClick={seguir}>Listo</Boton>
        </>
      )}
    </section>
  )
}

// Respirar con la lluvia: respiración lenta (4 s / 6 s, ~6 por minuto) o suspiro cíclico.
// La nube crece al inhalar y se encoge al exhalar; el cielo se aclara y se oscurece con ella.
// Con movimiento reducido no se anima nada: queda el texto, y una vibración corta en cada cambio si está activa.
function Respirar({ preferencias, onTerminar }) {
  const [ritmo, setRitmo] = useState('lenta')
  const [corriendo, setCorriendo] = useState(false)
  const [paso, setPaso] = useState({ ciclo: 0, fase: 0 })
  const [terminado, setTerminado] = useState(false)
  const reducido = preferencias.movimientoReducido
  const r = RITMOS[ritmo]

  useEffect(() => {
    if (!corriendo) return
    const [texto, seg] = r.fases[paso.fase]
    if (preferencias.describirEnVoz) decir(texto.replace('…', ''))
    if (reducido) vibrar(preferencias, 40)
    const t = setTimeout(() => {
      const siguienteFase = (paso.fase + 1) % r.fases.length
      const ciclo = paso.ciclo + (siguienteFase === 0 ? 1 : 0)
      if (ciclo >= r.ciclos) { setCorriendo(false); setTerminado(true); return }
      setPaso({ ciclo, fase: siguienteFase })
    }, seg * 1000)
    return () => clearTimeout(t)
  }, [corriendo, paso]) // eslint-disable-line react-hooks/exhaustive-deps

  const [guia, seg] = r.fases[paso.fase]
  const inhala = corriendo && !guia.startsWith('Exhala')
  const escala = !corriendo || reducido ? 0.8 : inhala ? (paso.fase === 0 ? 1 : 1.08) : 0.62
  const minutos = Math.round(duracionRitmo(ritmo) / 60)

  return (
    <div className="respirar" data-fase={corriendo ? (inhala ? 'inhala' : 'exhala') : 'quieto'}>
      <div className="respiro" aria-hidden="true">
        <div className="respiro__nube" style={{ transform: `scale(${escala})`, transitionDuration: reducido ? '0ms' : `${seg}s` }} />
      </div>
      <section className="hoja">
        <h1 className="hoja__titulo-grande">Respirar con la lluvia</h1>
        {!corriendo && !terminado && (
          <>
            <p className="pequeno">{RITMOS.lenta.nombre}: inhala 4 s y exhala 6 s, unas 6 veces por minuto. Puedes parar cuando quieras.</p>
            <div className="segmentos" role="radiogroup" aria-label="Tipo de respiración">
              {Object.entries(RITMOS).map(([id, { nombre }]) => (
                <button key={id} type="button" role="radio" aria-checked={ritmo === id} onClick={() => setRitmo(id)}>{nombre}</button>
              ))}
            </div>
            {ritmo === 'suspiro' && <p className="pequeno">Dos inhalaciones seguidas por la nariz y una exhalación larga por la boca.</p>}
            <p className="pequeno">{TECNICAS.respirar.evidencia} Dura más o menos {minutos} minuto{minutos === 1 ? '' : 's'}.</p>
            <Boton icono="empezar" onClick={() => { setPaso({ ciclo: 0, fase: 0 }); setCorriendo(true) }}>Empezar</Boton>
          </>
        )}
        {corriendo && (
          <>
            <p className="respiro__guia" aria-live="polite">{guia}</p>
            <div className="progreso">
              <small id="respiro-avance">Respiración {paso.ciclo + 1} de {r.ciclos}</small>
              <div className="progreso__barra" role="progressbar" aria-labelledby="respiro-avance" aria-valuemin={1} aria-valuemax={r.ciclos} aria-valuenow={paso.ciclo + 1}>
                <div className="progreso__relleno" style={{ width: `${((paso.ciclo + 1) / r.ciclos) * 100}%` }} />
              </div>
            </div>
            <Boton tipo="secundario" onClick={onTerminar}>Terminar</Boton>
          </>
        )}
        {terminado && (
          <>
            <p className="respiro__guia" role="status">Listo. Respira normal un momento.</p>
            <Boton onClick={onTerminar}>Seguir</Boton>
          </>
        )}
        {!corriendo && <p className="pequeno">Si te mareas, vuelve a respirar normal.</p>}
      </section>
    </div>
  )
}

// Al final: antes → después con dos climas pequeños, en palabras
function AntesDespues({ antes, despues }) {
  const a = climaDe(antes)
  const d = climaDe(despues)
  return (
    <div className="antes-despues">
      <div className="antes-despues__clima"><small>Antes</small><span aria-hidden="true">{a.icono}</span><strong>{a.etiqueta}</strong></div>
      <span className="antes-despues__flecha" aria-hidden="true">→</span>
      <div className="antes-despues__clima"><small>Ahora</small><span aria-hidden="true">{d.icono}</span><strong>{d.etiqueta}</strong></div>
    </div>
  )
}

export default function Refugio({ preferencias, voz = { disponible: false }, favorita, inicial, onPaso, onGuardar, onSalir, onRiesgo }) {
  const [paso, setPaso] = useState('antes')
  const [antes, setAntes] = useState(null)
  const [despues, setDespues] = useState(null)
  const [tecnica, setTecnica] = useState(inicial?.tecnica ?? null)
  const inicio = useRef(Date.now())

  useEffect(() => { onPaso?.(paso) }, [paso]) // eslint-disable-line react-hooks/exhaustive-deps

  const ir = (p) => { setPaso(p); window.scrollTo?.(0, 0) }
  const elegirTecnica = (id) => { setTecnica(id); ir(id) }
  function guardar() {
    onGuardar({ fecha: fechaLocal(new Date()), tecnica, antes, despues, segundos: Math.round((Date.now() - inicio.current) / 1000) })
    ir('resumen')
  }

  const cielo = (c) => climaEfectivo(c, preferencias)

  if (paso === 'respirar') {
    return (
      <Paisaje clima="lluvia" capas={preferencias.capas}>
        <Respirar preferencias={preferencias} onTerminar={() => ir('despues')} />
      </Paisaje>
    )
  }

  return (
    <Paisaje clima={cielo(paso === 'despues' || paso === 'resumen' ? despues ?? antes : antes)} capas={preferencias.capas}>
      {paso === 'antes' && (
        <section className="hoja" aria-labelledby="refugio-antes">
          <p className="rotulo">Un respiro · herramientas de autocuidado</p>
          <h1 id="refugio-antes" className="hoja__titulo-grande">¿Cómo estás ahora?</h1>
          <ElegirClima valor={antes} onElegir={setAntes} etiqueta="Cómo estás ahora" />
          <Boton disabled={!antes} onClick={() => ir(tecnica ?? 'elegir')}>Continuar</Boton>
          <Boton tipo="fantasma" onClick={onSalir}>Ahora no</Boton>
        </section>
      )}

      {paso === 'elegir' && (
        <section className="hoja" aria-labelledby="refugio-elegir">
          <h1 id="refugio-elegir" className="hoja__titulo-grande">¿Qué te vendría bien?</h1>
          <p className="pequeno">Cada una dura poco y puedes dejarla cuando quieras.</p>
          <div className="tecnicas">
            {ordenarTecnicas(favorita).map((id) => (
              <button key={id} type="button" className="enlace-fila tecnica" onClick={() => elegirTecnica(id)}>
                <span className="enlace-fila__textos">
                  <strong>{TECNICAS[id].titulo}</strong>
                  <small>{TECNICAS[id].duracion} · {TECNICAS[id].evidencia}</small>
                  {id === favorita && <small className="tecnica__tuya">Te ayudó antes</small>}
                </span>
                <Icono nombre="siguiente" />
              </button>
            ))}
          </div>
        </section>
      )}

      {paso === 'tierra' && <Tierra voz={voz} onRiesgo={onRiesgo} onTerminar={() => ir('despues')} />}

      {paso === 'tarea' && <Tarea voz={voz} onRiesgo={onRiesgo} onTerminar={() => ir('despues')} />}

      {paso === 'amiga' && <Amiga frase={inicial?.frase} onRiesgo={onRiesgo} onTerminar={() => ir('despues')} />}

      {paso === 'despues' && (
        <section className="hoja" aria-labelledby="refugio-despues">
          <h1 id="refugio-despues" className="hoja__titulo-grande">¿Y ahora, cómo estás?</h1>
          <ElegirClima valor={despues} onElegir={setDespues} etiqueta="Cómo estás después" />
          <p className="pequeno">Solo se guarda el clima de antes y de después, nunca lo que dijiste.</p>
          <Boton disabled={!despues} onClick={guardar}>Guardar</Boton>
        </section>
      )}

      {paso === 'resumen' && (
        <section className="hoja" aria-labelledby="refugio-resumen">
          <h1 id="refugio-resumen" className="hoja__titulo-grande">Tu respiro</h1>
          <AntesDespues antes={antes} despues={despues} />
          <p role="status">{fraseDeCambio(antes, despues)}</p>
          <p className="pequeno">Contarle a alguien de confianza cómo te sientes también ayuda.</p>
          <Boton onClick={onSalir}>Volver al inicio</Boton>
        </section>
      )}
    </Paisaje>
  )
}

// Seguimiento en el historial: cuántos respiros y cómo suele quedar el cielo con cada técnica.
// En climas y palabras, nunca en puntajes; sin rachas ni metas (RNF-32).
export function LoQueTeAyudo({ refugios }) {
  const resumen = resumenRefugios(refugios)
  if (!resumen.length) return null
  const n = refugios.length
  return (
    <section className="ayudo" aria-labelledby="ayudo-titulo">
      <h3 id="ayudo-titulo">Lo que te ayudó</h3>
      <p className="pequeno">Te diste {n === 1 ? '1 respiro' : `${n} respiros`}. Así suele quedar tu cielo con cada técnica:</p>
      <ul>
        {resumen.map((t) => {
          const a = climaDe(t.antes)
          const d = climaDe(t.despues)
          return (
            <li key={t.tecnica}>
              <strong>{TECNICAS[t.tecnica].titulo}</strong>
              <span className="ayudo__climas" aria-hidden="true">{a.icono} {a.etiqueta} → {d.icono} {d.etiqueta}</span>
              <span className="sr">En general, de {a.etiqueta.toLowerCase()} a {d.etiqueta.toLowerCase()}.</span>
              <small className="pequeno">{fraseResumen(t)}</small>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
