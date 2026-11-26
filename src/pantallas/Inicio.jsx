// S2 · Inicio (v3 «01 Inicio» + journey nuevo «03 Inicio»): elegir el cielo ya basta («Guardar así»);
// contarlo por voz o por escrito es opcional. «Necesito un respiro» siempre arriba, sin preguntas previas.
import { useLayoutEffect, useRef, useState } from 'react'
import Icono from '../componentes/Icono.jsx'
import { Boton, ElegirClima } from '../componentes/Ui.jsx'
import { Escena, Suelo } from '../componentes/Escena.jsx'
import { CLIMAS } from '../datos/climas.js'
import { POSE_DE_CLIMA } from '../mundo/Garua.jsx'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const etiquetaDe = (id) => CLIMAS.find((c) => c.id === id)?.etiqueta ?? ''

function cuando(fecha, hoy = new Date()) {
  const d = new Date(`${fecha}T12:00:00`)
  const dias = Math.round((new Date(hoy.toLocaleDateString('en-CA') + 'T12:00:00') - d) / 86400000)
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  return `el ${DIAS[d.getDay()].toLowerCase()} ${d.getDate()}`
}

// Ancho y alto de la ventana, para achicar a Garúa en teléfonos angostos o bajos
function useVista() {
  const leer = () => ({ ancho: Math.min(window.innerWidth, 480), alto: window.innerHeight })
  const [vista, setVista] = useState(leer)
  useLayoutEffect(() => {
    const alCambiar = () => setVista(leer())
    window.addEventListener('resize', alCambiar)
    return () => window.removeEventListener('resize', alCambiar)
  }, [])
  return vista
}

const ESCALA_TEXTO = { normal: 1, grande: 0.88, 'mas-grande': 0.76 }
const GARUA_X = 6
const GARUA_Y = 8

export default function Inicio({ cabecera, noche, capas, clima, climaVista, registros, notaRitmo, porTexto, predecible, tamanoTexto = 'normal', sinVoz = false,
  onElegir, onGuardar, onContar, onEscribir, onPredecible, onRespiro }) {
  const ahora = new Date()
  const ultimo = registros.at(-1)
  const primeraVez = registros.length === 0
  const pose = noche && !clima ? 'dormida' : clima ? POSE_DE_CLIMA[climaVista] : 'flotando'
  // A7: Garúa nunca queda bajo la burbuja. La burbuja deja libre la columna de Garúa y la escena crece según
  // el alto real de lo que va arriba (texto grande, noche, 320 px), medido con ResizeObserver.
  const vista = useVista()
  const bajo = vista.alto < 700
  const angosto = vista.ancho < 360
  const tam = Math.round((noche && !clima ? 168 : 150) * (bajo || angosto ? 0.66 : 1) * (ESCALA_TEXTO[tamanoTexto] ?? 1))
  const hueco = tam + GARUA_X - (angosto ? 16 : 24) + 8
  const burbuja = useRef(null)
  const [alto, setAlto] = useState(null)
  const [ancha, setAncha] = useState(true) // ancha mientras no choque con Garúa; si choca, deja libre su columna
  useLayoutEffect(() => setAncha(true), [tam, tamanoTexto, noche, vista.ancho])
  useLayoutEffect(() => {
    const b = burbuja.current
    const escena = b?.closest('.escena')
    const fila = escena?.querySelector('.fila-fecha')
    const garua = escena?.querySelector('.escena__garua')
    if (!b || !fila || !garua) return
    const medir = () => {
      const arriba = escena.getBoundingClientRect().top
      const fondoFila = fila.getBoundingClientRect().bottom - arriba
      setAlto(Math.ceil(Math.max(bajo ? 0 : 340, fondoFila + 6 + tam + GARUA_Y)))
      const rb = b.getBoundingClientRect()
      const rg = garua.getBoundingClientRect()
      if (rb.right > rg.left + tam * 0.2 && rb.bottom + 14 > rg.top + tam * 0.15) setAncha(false) // + la colita de la burbuja
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(b); ro.observe(fila); ro.observe(escena)
    return () => ro.disconnect()
  }, [tam, bajo, ancha])
  return (
    <>
      <Escena clima={climaVista ?? 'nublado'} hy={280} suelo={430} flores="journey" brillo={[310, 150]} noche={noche} capas={capas}
        cabecera={cabecera} className="escena--inicio" alto={alto ?? undefined}
        garua={{ estado: pose, tam, x: GARUA_X, y: GARUA_Y }}>
        <div className="fila-fecha">
          <p className="fecha"><span className="titulo-s">{DIAS[ahora.getDay()]} {ahora.getDate()}</span><span className="etiqueta-sm">de {MESES[ahora.getMonth()]}</span></p>
          <button type="button" className="pildora pildora--respiro" onClick={onRespiro}><Icono nombre="respiro" tam={20} />Necesito un respiro</button>
        </div>
        <h1 ref={burbuja} className="burbuja burbuja--saludo display-m" style={{ maxWidth: ancha ? 'min(240px, 78%)' : `min(240px, calc(100% - ${hueco}px))` }}>{noche ? 'Buenas noches, ¿cómo va tu cielo?' : '¿Cómo va tu cielo hoy?'}</h1>
      </Escena>
      <Suelo className="suelo--inicio">
        <h2 className="etiqueta" id="elige-cielo">Elige tu cielo de hoy</h2>
        <ElegirClima valor={clima} onElegir={onElegir} etiqueta="Elige tu cielo de hoy" />
        <div className="notas-inicio" role="status">
          {!clima && primeraVez && <p className="cap"><Icono nombre="info" tam={16} />Elegir tu cielo ya basta. Contarlo es opcional.</p>}
          {!clima && ultimo && <p className="cap"><Icono nombre={ultimo.clima} tam={16} />Último registro: {etiquetaDe(ultimo.clima)}, {cuando(ultimo.fecha)}</p>}
          {notaRitmo && <p className="cap">{notaRitmo}</p>}
          {porTexto && !sinVoz && <p className="cap"><Icono nombre="info" tam={16} />Como el micrófono falló, empezamos escribiendo. Puedes hablar cuando quieras.</p>}
        </div>
        {predecible ? (
          <Boton onClick={onPredecible} disabled={!clima}>Continuar</Boton>
        ) : (
          <div className="pila">
            <Boton icono="check" disabled={!clima} onClick={onGuardar}>Guardar así</Boton>
            <div className="fila-ctas">
              {porTexto || sinVoz ? (
                <>
                  <Boton tipo="linea" icono="pen" disabled={!clima} onClick={onEscribir}>Escribir mi día</Boton>
                  {/* M13: sin dictado en el navegador (Firefox) no se ofrece el micrófono */}
                  {!sinVoz && <Boton tipo="texto" icono="mic" disabled={!clima} onClick={onContar}>Hablar</Boton>}
                </>
              ) : (
                <>
                  <Boton tipo="linea" icono="mic" disabled={!clima} onClick={onContar} aria-label="Contar mi día por voz">Contar mi día</Boton>
                  <Boton tipo="texto" icono="pen" disabled={!clima} onClick={onEscribir}>Escribir</Boton>
                </>
              )}
            </div>
          </div>
        )}
      </Suelo>
    </>
  )
}
