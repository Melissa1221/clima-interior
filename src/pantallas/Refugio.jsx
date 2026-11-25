// Refugio (RF-42, HU-30): herramientas de autocuidado de 1 a 3 minutos para un momento de estrés.
// No es terapia. Flujo: cómo estás ahora (antes) → una técnica → cómo quedaste (después) → antes y después.
// Una pregunta por pantalla, así que también sirve tal cual en el modo predecible.
import { useEffect, useRef, useState } from 'react'
import Paisaje from '../componentes/Paisaje.jsx'
import Icono from '../componentes/Icono.jsx'
import { Boton } from '../componentes/Ui.jsx'
import { CLIMAS, climaEfectivo } from '../datos/climas.js'
import { RITMOS, TECNICAS, duracionRitmo, fraseDeCambio, ordenarTecnicas } from '../datos/refugio.js'
import { decir } from '../voz/stt.js'
import { vibrar } from '../datos/accesibilidad.js'

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
              <div className="progreso__barra" role="progressbar" aria-labelledby="respiro-avance" aria-valuemin={0} aria-valuemax={r.ciclos} aria-valuenow={paso.ciclo}>
                <div className="progreso__relleno" style={{ width: `${(paso.ciclo / r.ciclos) * 100}%` }} />
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

export default function Refugio({ preferencias, favorita, inicial, onPaso, onGuardar, onSalir }) {
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
            {ordenarTecnicas(favorita).filter((id) => id === 'respirar').map((id) => (
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
