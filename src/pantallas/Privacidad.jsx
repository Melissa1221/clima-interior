// Perfil (B10), lo que la app sabe de ti (B11, S40) y privacidad (S42). Pantallas planas de lista: la cabecera
// lleva el título y todo se agrupa en listas con divisores finos.
import Icono from '../componentes/Icono.jsx'
import { Enlace, FilaAjuste, FilaLista, teclasRadio } from '../componentes/Ui.jsx'
import { Escena, Suelo } from '../componentes/Escena.jsx'
import { CATEGORIAS, MIN_REGISTROS_RITMO, emocionesFavoritas, ritmoConocido } from '../datos/perfil.js'
import { TECNICAS } from '../datos/refugio.js'
import { TRAMPAS } from '../datos/trampas.js'

// B10 · Perfil: un menú. Cada cosa en su lugar, sin una pantalla larga de interruptores
export function Perfil({ cabecera, capas, onSabe, onPrivacidad, onAccesibilidad, onDatos, onAyuda }) {
  return (
    <>
      <Escena clima="nublado" hy={190} suelo={260} flores="simples" brillo={[300, 100]} mar={false} capas={capas} cabecera={cabecera} alto={260}
        garua={{ estado: 'contenta-suave', tam: 104, x: 20, y: 40 }}>
        <h1 className="burbuja burbuja--derecha display-s"><span className="sr">Perfil. </span>Todo lo tuyo vive en este teléfono.</h1>
      </Escena>
      <Suelo matas={false}>
        <ul className="lista">
          <li><FilaLista icono="book" titulo="Lo que sabe de ti" descripcion="Lo que aprendió de ti, y por qué." onClick={onSabe} /></li>
          <li><FilaLista icono="lock" titulo="Privacidad" descripcion="Tu voz y dónde se procesa." onClick={onPrivacidad} /></li>
          <li><FilaLista icono="a11y" titulo="Accesibilidad" descripcion="Movimiento, voz y vibración." onClick={onAccesibilidad} /></li>
          <li><FilaLista icono="folder" titulo="Mis datos" descripcion="Exportar o borrar todo." onClick={onDatos} /></li>
          <li><FilaLista icono="help" titulo="Ayuda" descripcion="Qué hacer en cada pantalla." onClick={onAyuda} /></li>
        </ul>
        <p className="cap"><Icono nombre="info" tam={16} />Clima Interior no diagnostica ni da tratamiento.</p>
      </Suelo>
    </>
  )
}

const duracion = (seg) => seg < 60 ? `${seg} s` : `${Math.floor(seg / 60)} min ${seg % 60} s`

// Qué aprendió la app de cada categoría, en palabras (RF-23)
function aprendidoDe(perfil, id) {
  const { ritmo, aprendizaje, aprendido, registros } = perfil
  if (id === 'ritmo') {
    if (!ritmoConocido(perfil)) {
      const faltan = Math.max(1, MIN_REGISTROS_RITMO - registros.length)
      return registros.length < MIN_REGISTROS_RITMO
        ? `Aún no hay registros suficientes para conocer tu ritmo (faltan ${faltan === 1 ? '1 registro' : `${faltan} registros`}).`
        : 'Todavía no se ve una hora habitual: registras a horas distintas, y está bien.'
    }
    return `Sueles registrar a las ${ritmo.horaHabitual}:00.${ritmo.segundosCheckin ? ` Tu check-in dura unos ${duracion(ritmo.segundosCheckin)}.` : ''}`
  }
  if (id === 'elegidas') {
    const fav = emocionesFavoritas(perfil)
    return fav.length ? `Sueles elegir ${fav.join(', ')}: te las ofrecemos aunque la IA no las proponga.`
      : `${registros.length} ${registros.length === 1 ? 'registro' : 'registros'}. Siempre tienen prioridad.`
  }
  if (id === 'propuestas') {
    return aprendizaje.propuestasIA ? `Aceptaste alguna propuesta de la IA en ${aprendizaje.aceptadasIA} de ${aprendizaje.propuestasIA} check-ins.`
      : 'Se usan solo como apoyo: nunca reemplazan lo que elegiste.'
  }
  if (id === 'refugio') {
    if (aprendido.tecnicaFavorita) return `Te ofrecemos primero «${TECNICAS[aprendido.tecnicaFavorita].titulo}», la que más despejó tu cielo.`
    const n = perfil.refugios.length
    return n ? `${n} ${n === 1 ? 'respiro guardado' : 'respiros guardados'} (solo el clima de antes y de después).`
      : 'Guarda el clima de antes y de después de cada respiro para ofrecerte primero lo que te sirve.'
  }
  if (id === 'trampas') {
    const silenciadas = aprendido.trampasSilenciadas.map((t) => TRAMPAS[t]?.nombre.toLowerCase()).filter(Boolean)
    return silenciadas.length ? `Ya no te preguntamos por: ${silenciadas.join(', ')}.`
      : 'Si dices «No es así» seguido a una trampa, dejamos de preguntarla.'
  }
  if (id === 'tono') return aprendido.frasesCortas ? 'Reflexiones de una sola frase.' : 'Reflexiones de hasta dos frases. Pide «Más corto» y lo recordamos.'
  return aprendido.entrada === 'texto' ? 'Empiezas escribiendo.' : 'Empiezas hablando.'
}

// B11 · Lo que la app sabe de ti: cada dato se ve, se apaga o se olvida, y cada cambio dice de dónde salió (RF-22, HU-09)
export function SabeDeMi({ cabecera, perfil, onCambio, onOlvidar }) {
  const { personalizacion: p, cambios } = perfil
  const olvidar = (id) => {
    if (window.confirm(`¿Olvidar «${CATEGORIAS[id].toLowerCase()}»? Tus registros del diario no se borran.`)) onOlvidar(id)
  }
  return (
    <div className="plana">
      {cabecera}
      <section className="plana__cuerpo">
        <p className="meta">Todo vive en este teléfono. Si apagas algo, también se borra lo que ya se aprendió de eso.</p>
        <ul className="lista">
          <li><FilaAjuste titulo="Preferencias del paisaje" descripcion="Paleta cálida · intensidad media." activo={p.paisaje} onCambio={(v) => onCambio({ paisaje: v })} /></li>
          {Object.entries(CATEGORIAS).map(([id, titulo]) => (
            <li key={id} className="sabe">
              <FilaAjuste titulo={titulo} activo={p[id]} onCambio={(v) => onCambio({ [id]: v })}
                descripcion={p[id] ? aprendidoDe(perfil, id) : 'Apagado: no se usa ni se guarda.'} />
              {p[id] && <Enlace className="sabe__olvidar" onClick={() => olvidar(id)} aria-label={`Olvidar ${titulo.toLowerCase()}`}>Olvidar</Enlace>}
            </li>
          ))}
        </ul>
        <h2 className="etiqueta">Lo que cambió por su cuenta</h2>
        {cambios.length ? (
          <ol className="lista cambios">
            {cambios.slice().reverse().map((c) => (
              <li key={c.fecha + c.que} className="fila fila--columna">
                <span className="fila__titulo">{c.que}</span>
                <small className="fila__desc">{c.fuente} · {new Date(c.fecha).toLocaleDateString('es-PE')}</small>
              </li>
            ))}
          </ol>
        ) : <p className="cap">Nada todavía. Si la app cambia algo, aquí verás por qué.</p>}
      </section>
    </div>
  )
}

// S42 · Privacidad: tu voz, dónde se escribe la reflexión (sin jerga) y la demo
export function PrivacidadYDatos({ cabecera, privacidad, onCambio, onDemo }) {
  return (
    <div className="plana">
      {cabecera}
      <section className="plana__cuerpo">
        <h2 className="etiqueta">Tu voz</h2>
        <ul className="lista">
          <li><FilaAjuste icono="mic" titulo="Grabar mi voz" descripcion="El audio se borra al obtener el texto." activo={privacidad.grabarVoz} onCambio={(v) => onCambio({ grabarVoz: v })} /></li>
          <li><FilaAjuste icono="globe" titulo="Transcribir en internet" activo={privacidad.transcribirEnInternet} onCambio={(v) => onCambio({ transcribirEnInternet: v })}
            descripcion={privacidad.transcribirEnInternet ? 'Ahora: en internet, solo mientras dictas.' : 'Ahora: en este teléfono.'} /></li>
        </ul>
        <h2 className="etiqueta" id="donde-reflexion">Dónde se escribe tu reflexión</h2>
        <div className="segmento segmento--ancho" role="radiogroup" aria-labelledby="donde-reflexion" onKeyDown={teclasRadio}>
          <button type="button" role="radio" aria-checked={!privacidad.iaEnInternet} tabIndex={privacidad.iaEnInternet ? -1 : 0} onClick={() => onCambio({ iaEnInternet: false })}>Solo en este teléfono</button>
          <button type="button" role="radio" aria-checked={privacidad.iaEnInternet} tabIndex={privacidad.iaEnInternet ? 0 : -1} onClick={() => onCambio({ iaEnInternet: true })}>En internet</button>
        </div>
        <p className="cap"><Icono nombre="info" tam={16} />{privacidad.iaEnInternet
          ? 'Tu texto se envía sin tu nombre para escribir la reflexión, y no se guarda allá.'
          : 'Más simple. Nada sale de aquí.'}</p>
        <ul className="lista">
          <li><FilaLista icono="historial" titulo="Modo demo" descripcion="Mirar o salir de los 30 días simulados." onClick={onDemo} /></li>
        </ul>
      </section>
    </div>
  )
}
