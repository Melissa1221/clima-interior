// Primer uso y consentimiento (S01 a S05): nada sale del dispositivo antes del consentimiento correspondiente.
import Paisaje from '../componentes/Paisaje.jsx'
import Icono from '../componentes/Icono.jsx'
import { Aviso, Boton, FilaAjuste, Opcion, Progreso } from '../componentes/Ui.jsx'

// S01 · Bienvenida: funcionalidad principal visible, instalar y demo a un toque
export function Bienvenida({ onEmpezar, onDemo, onInstalar }) {
  return (
    <Paisaje clima="soleado">
      <section className="panel-bienvenida">
        <h1>Clima Interior</h1>
        <p className="cuerpo-grande">Cuenta cómo fue tu día en un minuto y míralo convertido en un clima. Tú decides cómo se llama lo que sientes.</p>
        <Boton icono="empezar" onClick={onEmpezar}>Empezar</Boton>
        <Boton tipo="secundario" icono="calendario" onClick={onDemo}>Ver con 30 días de ejemplo</Boton>
        <Boton tipo="fantasma" icono="instalar" onClick={onInstalar}>Instalar en mi pantalla de inicio</Boton>
        <p className="pie">No es un servicio de salud: no diagnostica ni da tratamiento.</p>
      </section>
    </Paisaje>
  )
}

// S02 · Declaración de edad (Ley 29733: la emoción es un dato sensible)
export function Edad({ edad, onElegir, onContinuar }) {
  return (
    <section className="pantalla">
      <div className="pantalla__cuerpo">
        <Progreso paso={1} total={4} />
        <h1>Antes de empezar, ¿cuántos años tienes?</h1>
        <p className="cuerpo">Lo preguntamos porque la app trata información sobre emociones, que es un dato sensible según la Ley 29733.</p>
        <div role="radiogroup" aria-label="Edad" className="grupo">
          <Opcion marcada={edad === 'adulto'} onElegir={() => onElegir('adulto')}>Tengo 18 años o más</Opcion>
          <Opcion marcada={edad === 'menor'} onElegir={() => onElegir('menor')}>Tengo menos de 18 años</Opcion>
        </div>
        <Aviso titulo="Si tienes menos de 18">
          Te pediremos que tu madre, padre o tutor lea y acepte contigo cada permiso antes de grabar o compartir.
        </Aviso>
      </div>
      <div className="acciones"><Boton disabled={!edad} onClick={onContinuar}>Continuar</Boton></div>
    </section>
  )
}

// S03 · Permisos por separado: cada uno es independiente y se puede cambiar en Perfil › Privacidad
export function Permisos({ privacidad, edad, onCambio, onGuardar }) {
  const filas = [
    ['grabarVoz', 'Grabar mi voz en el check-in', 'Solo mientras grabas, con indicador rojo. El audio se borra al obtener el texto.'],
    ['transcribirEnInternet', 'Transcribir mi voz en internet', 'Apagado: se transcribe en este dispositivo (Whisper local).'],
    ['iaEnInternet', 'Usar IA en internet para la reflexión', 'Apagado: se usa un modelo en tu dispositivo (Ollama). Nada sale del teléfono.'],
    ['climaCompartido', 'Clima compartido', 'Te lo preguntaremos cada vez que entres a una sala.'],
  ]
  return (
    <section className="pantalla">
      <div className="pantalla__cuerpo">
        <Progreso paso={2} total={4} />
        <h1>Tú decides qué se usa</h1>
        <p className="cuerpo">Cada permiso es independiente y puedes cambiarlo cuando quieras en Perfil › Privacidad.</p>
        {edad === 'menor' && <Aviso titulo="Léelo con tu madre, padre o tutor">Acepten juntos cada permiso antes de continuar.</Aviso>}
        {filas.map(([clave, titulo, descripcion]) => (
          <FilaAjuste key={clave} titulo={titulo} descripcion={descripcion} activo={privacidad[clave]} onCambio={(v) => onCambio({ [clave]: v })} />
        ))}
      </div>
      <div className="acciones"><Boton onClick={onGuardar}>Guardar mis decisiones</Boton></div>
    </section>
  )
}

// S04 · Lo que es y lo que no es (límites no clínicos, rótulo de IA y qué pasa ante una crisis)
export function Limites({ onRecursos, onEntendido }) {
  return (
    <section className="pantalla">
      <div className="pantalla__cuerpo">
        <Progreso paso={3} total={4} />
        <h1>Lo que Clima Interior es, y lo que no es</h1>
        <div className="tarjeta-lista tarjeta-lista--exito">
          <strong>Es</strong>
          <ul><li>Un diario para reconocer y nombrar lo que sientes.</li><li>Un espacio para pensar en tu día con calma.</li></ul>
        </div>
        <div className="tarjeta-lista tarjeta-lista--suave">
          <strong>No es</strong>
          <ul><li>Un diagnóstico ni un tratamiento.</li><li>Un reemplazo de una persona profesional.</li></ul>
        </div>
        <p className="cuerpo cuerpo--texto">Las reflexiones las escribe una IA y siempre llevan esta etiqueta:</p>
        <span className="rotulo-ia"><Icono nombre="ia" tam={17} />Generado por IA · no es consejo clínico</span>
        <button type="button" className="tarjeta-lista tarjeta-lista--ayuda tarjeta-boton" onClick={onRecursos}>
          <strong>Si estás en peligro</strong>
          <small>Pausamos la reflexión y te mostramos a quién llamar: Línea 113 (opción 5), SAMU 106 y PNP 105. La app nunca llama ni avisa a nadie por ti.</small>
        </button>
      </div>
      <div className="acciones"><Boton onClick={onEntendido}>Entendido</Boton></div>
    </section>
  )
}

// S05 · Ajustes iniciales: la experiencia se adapta antes del primer check-in
export function AjustesIniciales({ preferencias, sistemaReducido, onCambio, onListo }) {
  const filas = [
    ['movimientoReducido', 'Movimiento reducido', 'Sin rayos, destellos ni parallax. Puedes apagar cada capa del clima.'],
    ['modoPredecible', 'Modo predecible', 'Una pregunta por pantalla y lenguaje literal.'],
    ['modoNeutral', 'Modo neutral', 'Sin tormentas ni sonidos intensos.'],
    ['describirEnVoz', 'Describir el paisaje en voz alta', 'Con un sonido breve del clima.'],
    ['pistas', 'Pistas si me quedo en silencio', 'A los 12 s, en voz y en texto.'],
  ]
  return (
    <section className="pantalla">
      <div className="pantalla__cuerpo">
        <Progreso paso={4} total={4} />
        <h1>Ajusta la experiencia a ti</h1>
        {sistemaReducido && <Aviso titulo="Tu sistema pide menos movimiento">Por eso el paisaje será estático desde el primer momento.</Aviso>}
        {filas.map(([clave, titulo, descripcion]) => (
          <FilaAjuste key={clave} titulo={titulo} descripcion={descripcion} activo={preferencias[clave]} onCambio={(v) => onCambio({ [clave]: v })} />
        ))}
      </div>
      <div className="acciones"><Boton onClick={onListo}>Listo</Boton></div>
    </section>
  )
}
