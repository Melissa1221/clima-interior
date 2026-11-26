// Exportar resumen (S43, S44) y eliminar todos mis datos (S45).
import { useState } from 'react'
import Icono from '../componentes/Icono.jsx'
import { Aviso, Boton, Campo, FilaAjuste, FilaLista } from '../componentes/Ui.jsx'
import { construirResumen, fechaLarga, rangoPorDefecto, registrosEnRango, textoAPdf } from '../datos/exportar.js'

function descargar(bytes, nombre) {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// S43 · el resumen se genera en el teléfono y la persona elige qué incluir. S44 · un rango sin registros no genera archivo vacío.
export function ExportarResumen({ cabecera, registros, vibrar, onListo, onEliminar }) {
  const [rango, setRango] = useState(() => rangoPorDefecto(registros))
  const [incluir, setIncluir] = useState({ clima: true, emociones: true, palabras: true, transcripciones: false })
  const [sinRegistros, setSinRegistros] = useState(false)
  const primero = registros.map((r) => r.fecha).sort()[0]

  function generar() {
    const elegidos = registrosEnRango(registros, rango.desde, rango.hasta)
    if (!elegidos.length || rango.desde > rango.hasta) {
      setSinRegistros(true)
      vibrar()
      return
    }
    descargar(textoAPdf(construirResumen(elegidos, rango, incluir)), `clima-interior-${rango.desde}-a-${rango.hasta}.pdf`)
    onListo()
  }

  const cambiarRango = (c) => { setRango({ ...rango, ...c }); setSinRegistros(false) }
  const alternar = (clave) => (v) => setIncluir({ ...incluir, [clave]: v })

  return (
    <div className="plana">
      {cabecera}
      <section className="plana__cuerpo">
        <h2 className="titulo-m">Resumen para tu psicóloga o psicólogo</h2>
        {!sinRegistros && <p className="meta">Tú eliges qué incluir. Se genera en tu teléfono y decides con quién compartirlo.</p>}
        <div className="fila-botones fila-botones--campos">
          <Campo id="desde" etiqueta="Desde" type="date" value={rango.desde} estado={sinRegistros ? 'revisar' : ''} onChange={(e) => cambiarRango({ desde: e.target.value })} />
          <Campo id="hasta" etiqueta="Hasta" type="date" value={rango.hasta} estado={sinRegistros ? 'revisar' : ''} onChange={(e) => cambiarRango({ hasta: e.target.value })} />
        </div>
        {sinRegistros ? (
          <>
            <Aviso tipo="error" vibra titulo="No hay registros en esas fechas">
              {primero
                ? `No vamos a generar un archivo vacío. Elige otro rango: tu primer registro es del ${fechaLarga(primero)}.`
                : 'No vamos a generar un archivo vacío. Aún no tienes registros: haz tu primer check-in.'}
            </Aviso>
            <Boton icono="historial" onClick={() => document.getElementById('desde')?.focus()}>Elegir otras fechas</Boton>
          </>
        ) : (
          <>
            <ul className="lista">
              <li><FilaAjuste titulo="Clima de cada día" descripcion="Con descripción en texto." activo={incluir.clima} onCambio={alternar('clima')} /></li>
              <li><FilaAjuste titulo="Emociones que elegiste" descripcion="Solo las que confirmaste." activo={incluir.emociones} onCambio={alternar('emociones')} /></li>
              <li><FilaAjuste titulo="Tus tres palabras" activo={incluir.palabras} onCambio={alternar('palabras')} /></li>
              <li><FilaAjuste titulo="Lo que contaste" descripcion="Transcripciones · apagado por defecto." activo={incluir.transcripciones} onCambio={alternar('transcripciones')} /></li>
            </ul>
            <p className="cap"><Icono nombre="info" tam={16} />Sin diagnósticos: no incluye propuestas de la IA ni frases clínicas.</p>
            <Boton icono="download" onClick={generar}>Generar PDF</Boton>
          </>
        )}
        {onEliminar && (
          <ul className="lista lista--peligro">
            <li><FilaLista icono="trash" titulo="Eliminar todos mis datos" descripcion="Del teléfono, la caché y el servidor." onClick={onEliminar} /></li>
          </ul>
        )}
      </section>
    </div>
  )
}

// S45 · borrar es irreversible: se pide escribir BORRAR y se ofrece exportar antes
export function EliminarDatos({ cabecera, onEliminar, onCancelar, onExportar }) {
  const [texto, setTexto] = useState('')
  const confirmado = texto.trim().toUpperCase() === 'BORRAR'
  return (
    <div className="plana">
      {cabecera}
      <section className="plana__cuerpo">
        <h2 className="display-m">¿Borrar todo?</h2>
        <p className="cuerpo">No se puede deshacer. Si quieres, <button type="button" className="enlace enlace--en-linea" onClick={onExportar}>antes exporta un resumen</button>.</p>
        <div className="tarjeta tarjeta--lista">
          <p className="meta">Se eliminará</p>
          <ul className="vinetas">
            <li>Tus registros, paisajes y reflexiones.</li>
            <li>Tu perfil de personalización.</li>
            <li>Tus respiros y tu lista de «partir la tarea».</li>
            <li>La caché de la app en este teléfono.</li>
            <li>Los registros pendientes de sincronizar.</li>
            <li>Las copias en el servidor.</li>
          </ul>
        </div>
        <Campo id="confirmar" etiqueta="Escribe BORRAR para confirmar" value={texto} autoComplete="off" estado={confirmado ? 'ok' : ''} onChange={(e) => setTexto(e.target.value)} />
        <div className="pila">
          <Boton tipo="peligro" icono="trash" disabled={!confirmado} onClick={onEliminar}>Eliminar todo</Boton>
          <Boton tipo="texto" onClick={onCancelar}>Cancelar</Boton>
        </div>
      </section>
    </div>
  )
}
