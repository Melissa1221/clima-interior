// Exportar resumen (S43, S44) y eliminar todos mis datos (S45).
import { useState } from 'react'
import { Aviso, Boton, Campo, FilaAjuste } from '../componentes/Ui.jsx'
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
export function ExportarResumen({ registros, vibrar, onListo }) {
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
    <section className="pantalla">
      <div className="pantalla__cuerpo pantalla__cuerpo--junto">
        <h1 className="titulo-2">Resumen para tu psicóloga o psicólogo</h1>
        {!sinRegistros && <p className="pie">Tú eliges qué incluir. Se genera en tu teléfono y decides con quién compartirlo.</p>}
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
            <Boton icono="calendario" onClick={() => document.getElementById('desde')?.focus()}>Elegir otras fechas</Boton>
          </>
        ) : (
          <>
            <FilaAjuste titulo="Clima de cada día" descripcion="Con descripción en texto." activo={incluir.clima} onCambio={alternar('clima')} />
            <FilaAjuste titulo="Emociones que elegiste" descripcion="Solo las que confirmaste." activo={incluir.emociones} onCambio={alternar('emociones')} />
            <FilaAjuste titulo="Tus tres palabras" activo={incluir.palabras} onCambio={alternar('palabras')} />
            <FilaAjuste titulo="Lo que contaste (transcripciones)" descripcion="Apagado por defecto." activo={incluir.transcripciones} onCambio={alternar('transcripciones')} />
            <Aviso titulo="Sin diagnósticos">El resumen no incluye propuestas de la IA, interpretaciones ni frases clínicas.</Aviso>
            <div className="acciones"><Boton icono="descargar" onClick={generar}>Generar PDF</Boton></div>
          </>
        )}
      </div>
    </section>
  )
}

// S45 · borrar es irreversible: se pide escribir BORRAR y se ofrece exportar antes
export function EliminarDatos({ onEliminar, onCancelar, onExportar }) {
  const [texto, setTexto] = useState('')
  const confirmado = texto.trim().toUpperCase() === 'BORRAR'
  return (
    <section className="pantalla">
      <div className="pantalla__cuerpo pantalla__cuerpo--junto">
        <h1>Eliminar todos mis datos</h1>
        <div className="tarjeta-lista">
          <strong>Se eliminará</strong>
          <ul>
            <li>Tus registros, paisajes y reflexiones.</li>
            <li>Tu perfil de personalización.</li>
            <li>La caché de la app en este teléfono.</li>
            <li>Los registros pendientes de sincronizar.</li>
            <li>Las copias en el servidor.</li>
          </ul>
        </div>
        <Aviso tipo="error" vibra titulo="No se puede deshacer">
          Si quieres, <button type="button" className="enlace" onClick={onExportar}>antes exporta un resumen</button>.
        </Aviso>
        <Campo id="confirmar" etiqueta="Escribe BORRAR para confirmar" value={texto} autoComplete="off" onChange={(e) => setTexto(e.target.value)} />
      </div>
      <div className="acciones">
        <Boton tipo="peligro" icono="borrar" disabled={!confirmado} onClick={onEliminar}>Eliminar todo</Boton>
        <Boton tipo="secundario" onClick={onCancelar}>Cancelar</Boton>
      </div>
    </section>
  )
}
