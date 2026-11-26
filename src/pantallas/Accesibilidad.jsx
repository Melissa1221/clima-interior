// B12 · Accesibilidad (S46). Agrupada en movimiento y color, voz y sonido, y avisos. Cada capa del clima se apaga
// por separado; el modo predecible (S47, S48) y el neutral (S49) también se activan desde el panel «Aa».
import Icono from '../componentes/Icono.jsx'
import { FilaAjuste, tabRadio, teclasRadio } from '../componentes/Ui.jsx'

const CAPAS = [['lluvia', 'Lluvia'], ['viento', 'Viento'], ['niebla', 'Niebla'], ['nubes', 'Nubes'], ['luz', 'Luz']]
const TAMANOS = [['normal', 'Normal'], ['grande', 'Grande'], ['mas-grande', 'Más grande']]
const TEMAS = [['auto', 'Automático'], ['claro', 'Claro'], ['noche', 'Noche']]

export function Accesibilidad({ cabecera, preferencias: p, onCambio, onAlternarCapa }) {
  return (
    <div className="plana">
      {cabecera}
      <section className="plana__cuerpo">
        <h2 className="etiqueta">Movimiento y color</h2>
        <ul className="lista">
          <li><FilaAjuste titulo="Movimiento reducido" descripcion="Sin destellos ni parallax. Sigue al sistema." activo={p.movimientoReducido} onCambio={(v) => onCambio({ movimientoReducido: v })} /></li>
          <li><FilaAjuste titulo="Modo neutral" descripcion="Sin tormentas ni sonidos intensos." activo={p.modoNeutral} onCambio={(v) => onCambio({ modoNeutral: v })} /></li>
          <li><FilaAjuste titulo="Modo predecible" descripcion="Una pregunta por pantalla, respuestas de 80 palabras como máximo." activo={p.modoPredecible} onCambio={(v) => onCambio({ modoPredecible: v })} /></li>
        </ul>
        <div className="grupo" role="group" aria-labelledby="capas-titulo">
          <h2 className="etiqueta" id="capas-titulo">Capas del clima (apágalas por separado)</h2>
          <div className="capas">
            {CAPAS.map(([id, etiqueta]) => (
              <button key={id} type="button" className="capa" aria-pressed={p.capas[id]} onClick={() => onAlternarCapa(id)}>
                {p.capas[id] && <Icono nombre="check" tam={16} />}{etiqueta}
              </button>
            ))}
          </div>
        </div>
        <h2 className="etiqueta" id="tam-titulo">Tamaño del texto</h2>
        <div className="segmento segmento--ancho" role="radiogroup" aria-labelledby="tam-titulo" onKeyDown={teclasRadio}>
          {TAMANOS.map(([id, nombre], i) => (
            <button key={id} type="button" role="radio" aria-checked={p.tamanoTexto === id} tabIndex={tabRadio(p.tamanoTexto === id, i, true)} onClick={() => onCambio({ tamanoTexto: id })}>{nombre}</button>
          ))}
        </div>
        <h2 className="etiqueta" id="tema-titulo">Tema</h2>
        <div className="segmento segmento--ancho" role="radiogroup" aria-labelledby="tema-titulo" onKeyDown={teclasRadio}>
          {TEMAS.map(([id, nombre], i) => (
            <button key={id} type="button" role="radio" aria-checked={p.tema === id} tabIndex={tabRadio(p.tema === id, i, true)} onClick={() => onCambio({ tema: id })}>{nombre}</button>
          ))}
        </div>
        <h2 className="etiqueta">Voz y sonido</h2>
        <ul className="lista">
          <li><FilaAjuste titulo="Describir el paisaje y sonido del clima" descripcion="Descripción hablada y sonificación breve." activo={p.describirEnVoz} onCambio={(v) => onCambio({ describirEnVoz: v })} /></li>
          <li><FilaAjuste titulo="Pistas si me quedo en silencio" descripcion="A los 12 s, en voz y en texto." activo={p.pistas} onCambio={(v) => onCambio({ pistas: v })} /></li>
          <li><FilaAjuste titulo="Comandos de voz" descripcion="«terminar», «pausar», «ayuda», «salir por hoy»." activo={p.comandosVoz} onCambio={(v) => onCambio({ comandosVoz: v })} /></li>
        </ul>
        <h2 className="etiqueta">Avisos</h2>
        <ul className="lista">
          <li><FilaAjuste titulo="Vibrar con cada aviso" descripcion="Cada sonido, también en vibración." activo={p.vibrar} onCambio={(v) => onCambio({ vibrar: v })} /></li>
        </ul>
      </section>
    </div>
  )
}
