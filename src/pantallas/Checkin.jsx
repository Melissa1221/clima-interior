// Check-in: escuchar, escribir o corregir el relato, emociones, reflexión y guardado, trampa de pensamiento
// y «Salir por hoy». Pantallas v3 refinada (02 Te escucho) y grupo A (07 a 11 y 15).
import Icono from '../componentes/Icono.jsx'
import { Boton, Enlace, FilaAjuste } from '../componentes/Ui.jsx'
import { Escena, Suelo } from '../componentes/Escena.jsx'
import { CLIMAS, DESCRIPCION } from '../datos/climas.js'
import { TRAMPAS } from '../datos/trampas.js'
import { limitarPalabras } from '../datos/accesibilidad.js'
import Garua from '../mundo/Garua.jsx'

const etiquetaDe = (id) => CLIMAS.find((c) => c.id === id)?.etiqueta ?? 'Cielo neutro'
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

// 02 · Te escucho: Garúa escucha, se ve lo que se va entendiendo y un solo botón sólido para terminar
export function Escuchando({ cabecera, capas, clima, segundos, texto, pista, minuto, enInternet, onTerminar, onPausar, onEscribir }) {
  return (
    <>
      <Escena clima={clima} hy={300} suelo={420} flores="simples" brillo={[188, 240]} capas={capas} cabecera={cabecera} className="escena--escucha">
        <div className="escucha__arriba">
          <p className="pildora pildora--timer" aria-live="off">
            <span className="rec" aria-hidden="true" /><span className="sr">Micrófono activo · </span>
            <b>{mmss(segundos)}</b><span className="meta">/ 1:00</span>
          </p>
          <p className="burbuja burbuja--centro display-s">Te escucho. Sin apuro.</p>
        </div>
        <div className="escucha__garua">
          <span className="anillos" aria-hidden="true"><i className="anillo anillo--3" /><i className="anillo anillo--2" /><i className="anillo anillo--1" /></span>
          <Garua estado="escuchando" tam={176} animacion="escuchar" etiqueta="Garúa te escucha" />
        </div>
      </Escena>
      <Suelo matas={false} className="suelo--escucha">
        <p className="cap"><Icono nombre="lock" tam={16} />Lo que voy entendiendo · {enInternet ? 'se transcribe en internet' : 'solo en tu teléfono'}</p>
        <p className="transcripcion" aria-live="polite">{texto ? `«${texto}»` : <span className="transcripcion__vivo">Te escucho…</span>}<span className="cursor" aria-hidden="true" /></p>
        {pista && <p className="cap" role="status">¿Sigues ahí? Puedes contarlo con pocas palabras o escribirlo.</p>}
        {minuto && <p className="cap">Ya va un minuto. Termina cuando cierres la idea.</p>}
        <div className="controles-voz">
          <button type="button" className="control-voz" onClick={onPausar}><span className="control-voz__circulo"><Icono nombre="pause" tam={22} /></span>Pausar</button>
          <div className="control-voz control-voz--parar">
            <button type="button" className="parar" onClick={onTerminar} aria-label="Terminar"><span aria-hidden="true" /></button>
            <span aria-hidden="true">Toca cuando termines</span>
          </div>
          <button type="button" className="control-voz" onClick={onEscribir}><span className="control-voz__circulo"><Icono nombre="pen" tam={22} /></span>Escribir</button>
        </div>
      </Suelo>
    </>
  )
}

// 07 · Escribir el día / 08 · Corregir la transcripción
export function Relato({ cabecera, capas, clima, climaVista, texto, onTexto, deVoz, duracion, estadoVoz, motivoVoz, errorMic, puedeHablar, onListo, onHablar }) {
  return (
    <Escena clima={climaVista} hy={560} suelo={700} flores="simples" brillo={[300, 150]} mar={false} capas={capas} cabecera={cabecera} className="escena--relato">
      <Garua estado={deVoz ? 'quieta' : 'flotando'} tam={112} className="relato__garua" />
      <section className="tarjeta relato" aria-labelledby="relato-titulo">
        {estadoVoz !== 'ok' && motivoVoz && <p className="cap" role="status"><Icono nombre="info" tam={16} />{motivoVoz}</p>}
        {errorMic && <p className="aviso-linea" role="alert"><Icono nombre="alert" tam={16} />{errorMic}</p>}
        <p className="cap">{deVoz
          ? <><Icono nombre="mic" tam={16} />Grabado · {mmss(duracion)} · solo en tu teléfono</>
          : <><Icono nombre={clima ?? 'nublado'} tam={16} />Tu cielo de hoy · {etiquetaDe(clima)}</>}</p>
        <label id="relato-titulo" htmlFor="relato" className="pregunta relato__titulo">{deVoz ? 'Lo que entendí' : '¿Cómo fue tu día?'}</label>
        {deVoz && <p className="meta">Corrígelo si algo no es así, antes de que lo lea la IA.</p>}
        <textarea id="relato" className="area" value={texto} onChange={(e) => onTexto(e.target.value)} rows={5}
          placeholder="Hoy tuve clase temprano y el tráfico me quitó energía…" />
        {!deVoz && <p className="cap">Unas líneas bastan.</p>}
      </section>
      <div className="pila pila--centro relato__acciones">
        <Boton disabled={!texto.trim()} onClick={onListo}>Listo</Boton>
        {puedeHablar && <Boton tipo="texto" icono="mic" onClick={onHablar}>{texto.trim() ? (deVoz ? 'Seguir hablando' : 'Mejor lo cuento hablando') : 'Mejor lo cuento hablando'}</Boton>}
        <p className="cap cap--centro"><Icono nombre="info" tam={16} />La IA lo leerá solo cuando toques «Listo».</p>
      </div>
    </Escena>
  )
}

// Mientras la IA piensa
export function Pensando({ cabecera, capas, clima }) {
  return (
    <Escena clima={clima} hy={520} suelo={700} flores="simples" capas={capas} cabecera={cabecera} className="escena--centro">
      <div className="pensando">
        <p className="burbuja burbuja--centro display-s" aria-live="polite">Mirando tu cielo…</p>
        <Garua estado="pensando" tam={180} etiqueta="Garúa piensa" />
      </div>
    </Escena>
  )
}

// Forma de nube de los botones de emoción (grupo A · 09)
const NUBE = 'M16 63 H144 A15 15 0 0 0 147 33 A21 21 0 0 0 116 21 A30 30 0 0 0 60 18 A21 21 0 0 0 26 31 A16 16 0 0 0 16 63 Z'

// 09 · Elegir emociones: la IA propone, la persona decide (RF-12, RNF-28)
export function Emociones({ cabecera, capas, clima, neutral, predecible, propuesta, elegidas, onAlternar, onGuardar }) {
  return (
    <>
      <Escena clima={clima} hy={250} suelo={360} flores="simples" brillo={[90, 150]} capas={capas} cabecera={cabecera} className="escena--emociones"
        garua={{ estado: 'comprensiva', tam: 132, izq: 16, x: 'auto', y: 4 }}>
        <p className="burbuja burbuja--izq burbuja--derecha display-s">Gracias por contármelo.</p>
      </Escena>
      <Suelo matas={false}>
        <h1 className="pregunta">{predecible ? '¿Cuáles de estas emociones sientes?' : 'Toca las nubes que sientes tuyas'}</h1>
        <p className="cap"><Icono nombre="info" tam={16} />Propuestas por IA · no es consejo clínico</p>
        {neutral && <p className="cap"><Icono nombre="neutral" tam={16} />Modo neutral: hoy tu registro generaría tormenta; lo mostramos como cielo neutro y sin sonidos intensos.</p>}
        <div className="nubes" role="group" aria-label="Emociones propuestas">
          {propuesta.emociones.map((e) => {
            const on = elegidas.includes(e.nombre)
            return (
              <button key={e.nombre} type="button" aria-pressed={on} className="nube" onClick={() => onAlternar(e.nombre)}>
                <svg className="nube__forma" viewBox="0 0 160 66" preserveAspectRatio="none" aria-hidden="true"><path d={NUBE} /></svg>
                <span className="nube__nombre">{e.nombre}</span>{e.tuya && <small className="nube__tuya"> · tuya</small>}
              </button>
            )
          })}
        </div>
        {predecible && <p className="meta reflexion-previa">{limitarPalabras(propuesta.reflexion)}</p>}
        <div className="pila pila--centro">
          <Boton disabled={!elegidas.length} onClick={() => onGuardar(elegidas)}>Guardar mi día</Boton>
          <Boton tipo="texto" onClick={() => onGuardar([])}>No sé, guardar igual</Boton>
        </div>
      </Suelo>
    </>
  )
}

// 10 · Reflexión de la IA y guardado · 11 · Oferta del Refugio · tarjetas justo a tiempo (T1 y T2)
export function Guardado({ cabecera, capas, clima, climaVista, emociones, reflexion, oferta, tarjeta, preferencias,
  onEscuchar, onMasCorto, onRespiro, onAhoraNo, onListo, onTarjeta }) {
  const pregunta = oferta && !reflexion
  return (
    <>
      <Escena clima={climaVista} hy={oferta ? 380 : 330} suelo={oferta ? 470 : 430} flores="inicio" brillo={[300, 200]} lluvia={oferta} capas={capas}
        cabecera={cabecera} className="escena--guardado"
        garua={{ estado: oferta ? 'clima-lluvia' : 'contenta-suave', tam: oferta ? 150 : 140, x: oferta ? 12 : 20, y: 0 }}>
        {reflexion && (
          <div className="burbuja burbuja--reflexion" role="status">
            <p className="display-s reflexion">{reflexion}</p>
            <div className="reflexion__herramientas">
              <Boton tipo="texto" icono="sound" onClick={onEscuchar} aria-label="Escuchar la reflexión">Escuchar</Boton>
              <Boton tipo="texto" onClick={onMasCorto}>Más corto</Boton>
            </div>
          </div>
        )}
        {pregunta && <p className="burbuja display-m">¿Quieres un respiro?</p>}
      </Escena>
      <Suelo>
        <h1 className="guardado__titulo"><Icono nombre="check" tam={20} />Tu día quedó guardado</h1>
        <p className="meta guardado__resumen"><Icono nombre={climaVista} tam={16} />{etiquetaDe(climaVista)}{emociones?.length ? ` · ${emociones.join(', ')}` : ''}</p>
        {climaVista !== clima && <p className="cap"><Icono nombre="neutral" tam={16} />Tu tormenta se guardó y hoy se muestra como cielo neutro.</p>}
        {reflexion && <p className="cap"><Icono nombre="info" tam={16} />Escrita por IA · no es consejo clínico</p>}
        <p className="sr">{DESCRIPCION[climaVista]}</p>
        {oferta ? (
          <div className="oferta" role="group" aria-labelledby="oferta-titulo">
            <h2 id="oferta-titulo" className="sr">¿Te tomas un respiro?</h2>
            <p className="cuerpo">Un minuto de lluvia para respirar, o partir lo que tienes pendiente. Si no, no pasa nada.</p>
            <div className="pila pila--centro">
              <Boton icono="respiro" onClick={onRespiro}>Necesito un respiro</Boton>
              <Boton tipo="texto" onClick={onAhoraNo}>Ahora no</Boton>
            </div>
          </div>
        ) : (
          <>
            {tarjeta === 'accesibilidad' && <TarjetaAjustes preferencias={preferencias} onCambio={onTarjeta.cambiar} onMas={onTarjeta.mas} onCerrar={onTarjeta.cerrar} />}
            {tarjeta === 'instalar' && <TarjetaInstalar onAgregar={onTarjeta.instalar} onCerrar={onTarjeta.cerrar} />}
            <Boton onClick={onListo} className="guardado__fin">Hasta mañana</Boton>
          </>
        )}
      </Suelo>
    </>
  )
}

// T1 · después del primer día guardado: «¿Te acomodo algo?» (una sola vez, se puede cerrar)
export function TarjetaAjustes({ preferencias, onCambio, onMas, onCerrar }) {
  return (
    <article className="tarjeta tarjeta-jit" aria-labelledby="t1-titulo">
      <div className="tarjeta-jit__cabeza">
        <h2 id="t1-titulo" className="titulo-s">¿Te acomodo algo?</h2>
        <button type="button" className="ib ib--plano" aria-label="Cerrar «¿Te acomodo algo?»" onClick={onCerrar}><Icono nombre="close" tam={22} /></button>
      </div>
      <p className="meta">Si el movimiento te marea o prefieres menos sonido, puedes cambiarlo.</p>
      <div className="tarjeta-jit__filas">
        <FilaAjuste icono="motion" titulo="Menos movimiento" activo={preferencias.movimientoReducido} onCambio={(v) => onCambio({ movimientoReducido: v })} />
        <FilaAjuste icono="quiet" titulo="Sin tormentas ni sonidos fuertes" activo={preferencias.modoNeutral} onCambio={(v) => onCambio({ modoNeutral: v })} />
      </div>
      <div className="tarjeta-jit__pie">
        <Enlace onClick={onMas}>Más ajustes</Enlace>
        <span className="cap">También en <b className="aa-mini">Aa</b>, arriba</span>
      </div>
    </article>
  )
}

// T2 · al guardar el segundo día: tenerla a un toque
export function TarjetaInstalar({ onAgregar, onCerrar }) {
  return (
    <article className="tarjeta tarjeta-jit" aria-labelledby="t2-titulo">
      <h2 id="t2-titulo" className="titulo-s">¿Me dejas en tu pantalla de inicio?</h2>
      <p className="meta">Así me abres en un toque.</p>
      <div className="fila-ctas">
        <Boton tipo="linea" icono="download" onClick={onAgregar}>Agregar</Boton>
        <Boton tipo="texto" onClick={onCerrar}>Ahora no</Boton>
      </div>
    </article>
  )
}

// 05 · Mirar un pensamiento: valida primero, cita la frase y pregunta (nunca diagnostica)
export function Trampa({ cabecera, capas, clima, trampa, respondioSi, onSi, onNo, onAmiga, onSeguir }) {
  const t = TRAMPAS[trampa.tipo]
  return (
    <Escena clima={clima} hy={620} suelo={760} flores="simples" brillo={[80, 140]} mar={false} capas={capas} cabecera={cabecera} className="escena--trampa">
      <Garua estado="curiosa" tam={104} className="trampa__garua" />
      <article className="tarjeta trampa" aria-labelledby="trampa-titulo">
        <p className="trampa__chip">Posible trampa · {t.nombre.toLowerCase()}</p>
        <p className="meta trampa__k">Me dijiste</p>
        <blockquote className="cita trampa__frase">«{trampa.frase}»</blockquote>
        {!respondioSi ? (
          <>
            <p className="cuerpo trampa__valida">Tiene sentido sentirte así con tanto encima.</p>
            <h1 id="trampa-titulo" className="pregunta trampa__pregunta">{t.hipotesis}</h1>
            <div className="pila">
              <Boton onClick={onSi}>Sí, puede ser</Boton>
              <Boton tipo="linea" onClick={onNo}>No es así</Boton>
            </div>
          </>
        ) : (
          <>
            <p className="cuerpo trampa__valida">No se trata de pensar bonito, sino de ver si hay algo más probable.</p>
            <h1 id="trampa-titulo" className="pregunta trampa__pregunta" role="status">{t.pregunta}</h1>
            <p className="meta">No hace falta responder aquí. Puedes pensarlo un momento.</p>
            <div className="pila">
              <Boton onClick={onSeguir}>Seguir</Boton>
              <Boton tipo="linea" icono="amiga" onClick={onAmiga}>¿Qué le dirías a una amiga?</Boton>
            </div>
          </>
        )}
        <p className="cap cap--centro trampa__nota"><Icono nombre="info" tam={16} />Sugerencia automática · no es un diagnóstico</p>
      </article>
    </Escena>
  )
}

// 15 · Salir por hoy: despedida sin reproches
export function Despedida({ cabecera, capas, guardadoHoy, onVolver }) {
  return (
    <>
      <Escena clima="nublado" hy={400} suelo={560} flores="inicio" brillo={[188, 300]} capas={capas} cabecera={cabecera} className="escena--despedida"
        garua={{ estado: 'despedida', tam: 190, x: 'calc(50% - 95px)', y: 8 }}>
        <div className="despedida">
          <h1 className="display-l">Listo por hoy</h1>
          <p className="cuerpo">Nada de lo que elegiste se pierde. Vuelve cuando quieras.</p>
        </div>
      </Escena>
      <Suelo>
        {guardadoHoy && <p className="cap cap--centro"><Icono nombre="lock" tam={16} />Tu clima quedó guardado solo en este teléfono.</p>}
        <Boton tipo="linea" onClick={onVolver}>Volver al inicio</Boton>
      </Suelo>
    </>
  )
}

// Modo predecible: una pregunta por pantalla (S47)
export function PredecibleComo({ cabecera, onHablar, onEscribir, onGuardar }) {
  return (
    <div className="plana">
      {cabecera}
      <section className="plana__cuerpo" aria-labelledby="como-titulo">
        <h1 id="como-titulo" className="pregunta">¿Cómo quieres contarlo?</h1>
        <p className="cuerpo">Elige una opción. Después te haremos la siguiente pregunta.</p>
        <div className="pila">
          <Boton icono="mic" onClick={onHablar}>Hablar</Boton>
          <Boton tipo="linea" icono="pen" onClick={onEscribir}>Escribir</Boton>
          <Boton tipo="texto" onClick={onGuardar}>Guardar solo el clima</Boton>
        </div>
      </section>
    </div>
  )
}
