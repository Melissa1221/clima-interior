// Privacidad: aviso antes de grabar (S07), lo que la app sabe de ti (S40) y privacidad y datos (S42).
import Paisaje from '../componentes/Paisaje.jsx'
import Icono from '../componentes/Icono.jsx'
import { Aviso, Boton, FilaAjuste } from '../componentes/Ui.jsx'
import { MOTIVOS_DICTADO } from '../datos/privacidad.js'

// S07 · Antes de grabar: recomendaciones y qué pasa con el audio. Si no se puede dictar, solo queda escribir.
export function AntesDeGrabar({ clima, estado, onGrabar, onEscribir }) {
  const recomendaciones = [
    ['personas', 'Busca un lugar donde no grabes a otras personas sin querer.'],
    ['candado', 'Evita decir nombres completos de otras personas.'],
    ['borrar', 'Tu audio se borra en cuanto obtenemos el texto.'],
    ['mic', 'Verás un indicador rojo mientras el micrófono esté activo.'],
  ]
  return (
    <Paisaje clima={clima}>
      <div className="atenuado" aria-hidden="true" />
      <section className="hoja-privacidad" aria-labelledby="antes-titulo">
        <h1 id="antes-titulo">Antes de grabar</h1>
        {recomendaciones.map(([icono, texto]) => (
          <p key={icono} className="recomendacion"><Icono nombre={icono} /><span>{texto}</span></p>
        ))}
        {estado !== 'ok' && <Aviso tipo="error" titulo="Por ahora no podemos grabar">{MOTIVOS_DICTADO[estado]}</Aviso>}
        {estado === 'ok' && <Boton icono="mic" onClick={onGrabar}>Empezar a grabar</Boton>}
        <Boton tipo={estado === 'ok' ? 'secundario' : 'primario'} icono="texto" onClick={onEscribir}>Prefiero escribir</Boton>
      </section>
    </Paisaje>
  )
}

// S40 · Lo que Clima Interior sabe de ti: cada dato se apaga y deja de usarse desde el siguiente check-in
export function SabeDeMi({ perfil, onCambio, onPrivacidad, onAccesibilidad }) {
  const { personalizacion: p, ritmo, registros } = perfil
  return (
    <section className="pantalla pantalla--con-pestanas">
      <div className="pantalla__cuerpo pantalla__cuerpo--junto">
        <h1>Lo que Clima Interior sabe de ti</h1>
        <p className="pie">Apaga cualquier dato y dejará de usarse desde el siguiente check-in.</p>
        <FilaAjuste titulo="Preferencias del paisaje" descripcion="Paleta cálida · intensidad media." activo={p.paisaje} onCambio={(v) => onCambio({ paisaje: v })} />
        <FilaAjuste titulo="Tu ritmo" activo={p.ritmo} onCambio={(v) => onCambio({ ritmo: v })}
          descripcion={ritmo.horaHabitual ? `Sueles registrar a las ${ritmo.horaHabitual}:00.` : 'Aún no hay registros suficientes para conocer tu ritmo.'} />
        <FilaAjuste titulo="Emociones que elegiste" activo={p.elegidas} onCambio={(v) => onCambio({ elegidas: v })}
          descripcion={`${registros.length} ${registros.length === 1 ? 'registro' : 'registros'}. Siempre tienen prioridad.`} />
        <FilaAjuste titulo="Emociones que propuso la IA" activo={p.propuestas} onCambio={(v) => onCambio({ propuestas: v })}
          descripcion={p.propuestas ? 'Se usan solo como apoyo: nunca reemplazan lo que elegiste.' : 'Apagado: ya no se usan en reflexiones ni paisajes.'} />
        <FilaAjuste titulo="Cómo te habla el asistente" descripcion="Frases más cortas." activo={p.tono} onCambio={(v) => onCambio({ tono: v })} />
        <div className="fila-botones">
          <Boton tipo="secundario" onClick={onAccesibilidad}>Accesibilidad</Boton>
          <Boton tipo="secundario" icono="candado" onClick={onPrivacidad}>Privacidad</Boton>
        </div>
      </div>
    </section>
  )
}

function EnlaceFila({ icono, titulo, descripcion, onClick }) {
  return (
    <button type="button" className="enlace-fila" onClick={onClick}>
      <Icono nombre={icono} />
      <span className="enlace-fila__textos"><strong>{titulo}</strong><small>{descripcion}</small></span>
      <Icono nombre="siguiente" />
    </button>
  )
}

// S42 · Privacidad y datos: permisos, dónde se genera la reflexión, exportar y eliminar
export function PrivacidadYDatos({ privacidad, onCambio, onExportar, onEliminar, onDemo }) {
  return (
    <section className="pantalla pantalla--con-pestanas">
      <div className="pantalla__cuerpo pantalla__cuerpo--junto">
        <h1>Privacidad y datos</h1>
        <FilaAjuste titulo="Grabar mi voz" descripcion="El audio se borra al obtener el texto." activo={privacidad.grabarVoz} onCambio={(v) => onCambio({ grabarVoz: v })} />
        <FilaAjuste titulo="Transcribir en internet" activo={privacidad.transcribirEnInternet} onCambio={(v) => onCambio({ transcribirEnInternet: v })}
          descripcion={privacidad.transcribirEnInternet ? 'Ahora: en internet, solo mientras dictas.' : 'Ahora: en este dispositivo.'} />
        <div className="tarjeta-lista" role="group" aria-labelledby="donde-reflexion">
          <strong id="donde-reflexion">Dónde se genera la reflexión</strong>
          <div className="segmentos" role="radiogroup" aria-labelledby="donde-reflexion">
            <button type="button" role="radio" aria-checked={!privacidad.iaEnInternet} onClick={() => onCambio({ iaEnInternet: false })}>En este dispositivo</button>
            <button type="button" role="radio" aria-checked={privacidad.iaEnInternet} onClick={() => onCambio({ iaEnInternet: true })}>En internet</button>
          </div>
        </div>
        <EnlaceFila icono="descargar" titulo="Exportar resumen para tu psicóloga o psicólogo" descripcion="PDF con climas y emociones que elegiste." onClick={onExportar} />
        <EnlaceFila icono="borrar" titulo="Eliminar todos mis datos" descripcion="Del dispositivo, la caché y la cola de sincronización." onClick={onEliminar} />
        <EnlaceFila icono="calendario" titulo="Modo demo" descripcion="Restablecer o salir de los 30 días simulados." onClick={onDemo} />
      </div>
    </section>
  )
}
