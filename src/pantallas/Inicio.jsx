// S2 · Inicio (v3 «01 Inicio» + journey nuevo «03 Inicio»): elegir el cielo ya basta («Guardar así»);
// contarlo por voz o por escrito es opcional. «Necesito un respiro» siempre arriba, sin preguntas previas.
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

export default function Inicio({ cabecera, noche, capas, clima, climaVista, registros, notaRitmo, porTexto, predecible,
  onElegir, onGuardar, onContar, onEscribir, onPredecible, onRespiro }) {
  const ahora = new Date()
  const ultimo = registros.at(-1)
  const primeraVez = registros.length === 0
  const pose = noche && !clima ? 'dormida' : clima ? POSE_DE_CLIMA[climaVista] : 'flotando'
  return (
    <>
      <Escena clima={climaVista ?? 'nublado'} hy={280} suelo={430} flores="journey" brillo={[310, 150]} noche={noche} capas={capas}
        cabecera={cabecera} className="escena--inicio"
        garua={{ estado: pose, tam: noche && !clima ? 168 : 150, x: 6, y: 8 }}>
        <div className="fila-fecha">
          <p className="fecha"><span className="titulo-s">{DIAS[ahora.getDay()]} {ahora.getDate()}</span><span className="etiqueta-sm">de {MESES[ahora.getMonth()]}</span></p>
          <button type="button" className="pildora pildora--respiro" onClick={onRespiro}><Icono nombre="respiro" tam={20} />Necesito un respiro</button>
        </div>
        <h1 className="burbuja burbuja--saludo display-m">{noche ? 'Buenas noches, ¿cómo va tu cielo?' : '¿Cómo va tu cielo hoy?'}</h1>
      </Escena>
      <Suelo className="suelo--inicio">
        <h2 className="etiqueta" id="elige-cielo">Elige tu cielo de hoy</h2>
        <ElegirClima valor={clima} onElegir={onElegir} etiqueta="Elige tu cielo de hoy" />
        <div className="notas-inicio" role="status">
          {!clima && primeraVez && <p className="cap"><Icono nombre="info" tam={16} />Elegir tu cielo ya basta. Contarlo es opcional.</p>}
          {!clima && ultimo && <p className="cap"><Icono nombre={ultimo.clima} tam={16} />Último registro: {etiquetaDe(ultimo.clima)}, {cuando(ultimo.fecha)}</p>}
          {notaRitmo && <p className="cap">{notaRitmo}</p>}
          {porTexto && <p className="cap"><Icono nombre="info" tam={16} />Como el micrófono falló, empezamos escribiendo. Puedes hablar cuando quieras.</p>}
        </div>
        {predecible ? (
          <Boton onClick={onPredecible} disabled={!clima}>Continuar</Boton>
        ) : (
          <div className="pila">
            <Boton icono="check" disabled={!clima} onClick={onGuardar}>Guardar así</Boton>
            <div className="fila-ctas">
              {porTexto ? (
                <>
                  <Boton tipo="linea" icono="pen" disabled={!clima} onClick={onEscribir}>Escribir mi día</Boton>
                  <Boton tipo="texto" icono="mic" disabled={!clima} onClick={onContar}>Hablar</Boton>
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
