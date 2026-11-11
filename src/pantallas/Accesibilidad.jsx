// Ajustes de accesibilidad (S46). Cada capa del clima se apaga por separado; el modo predecible (S47, S48) y el
// neutral (S49) se activan aquí o en los ajustes iniciales.
import Icono from '../componentes/Icono.jsx'
import { FilaAjuste } from '../componentes/Ui.jsx'

const CAPAS = [['lluvia', 'Lluvia'], ['viento', 'Viento'], ['niebla', 'Niebla'], ['nubes', 'Nubes'], ['luz', 'Luz']]

export function Accesibilidad({ preferencias: p, onCambio, onAlternarCapa }) {
  return (
    <section className="pantalla pantalla--con-pestanas">
      <div className="pantalla__cuerpo pantalla__cuerpo--junto">
        <h1>Accesibilidad</h1>
        <FilaAjuste titulo="Movimiento reducido" descripcion="Sigue la preferencia del sistema. Sin rayos, destellos ni parallax."
          activo={p.movimientoReducido} onCambio={(v) => onCambio({ movimientoReducido: v })} />
        <div className="tarjeta-lista" role="group" aria-labelledby="capas-titulo">
          <strong id="capas-titulo">Capas del clima (apágalas por separado)</strong>
          <div className="capas">
            {CAPAS.map(([id, etiqueta]) => (
              <button key={id} type="button" className="capa" aria-pressed={p.capas[id]} onClick={() => onAlternarCapa(id)}>
                {p.capas[id] && <Icono nombre="check" tam={17} />}{etiqueta}
              </button>
            ))}
          </div>
        </div>
        <FilaAjuste titulo="Modo predecible" descripcion="Una pregunta por pantalla, lenguaje literal, respuestas de 80 palabras como máximo."
          activo={p.modoPredecible} onCambio={(v) => onCambio({ modoPredecible: v })} />
        <FilaAjuste titulo="Modo neutral" descripcion="Sin tormentas ni sonidos intensos." activo={p.modoNeutral} onCambio={(v) => onCambio({ modoNeutral: v })} />
        <FilaAjuste titulo="Describir el paisaje y sonido del clima" descripcion="Descripción hablada y sonificación breve."
          activo={p.describirEnVoz} onCambio={(v) => onCambio({ describirEnVoz: v })} />
        <FilaAjuste titulo="Vibrar con cada aviso" descripcion="Todo sonido tiene aviso visual y vibración." activo={p.vibrar} onCambio={(v) => onCambio({ vibrar: v })} />
        <FilaAjuste titulo="Pistas si me quedo en silencio" descripcion="A los 12 s, en voz y en texto." activo={p.pistas} onCambio={(v) => onCambio({ pistas: v })} />
        <FilaAjuste titulo="Comandos de voz" descripcion="«terminar», «pausar», «ayuda», «salir por hoy»." activo={p.comandosVoz} onCambio={(v) => onCambio({ comandosVoz: v })} />
      </div>
    </section>
  )
}
