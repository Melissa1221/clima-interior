// Hojas justo a tiempo (journey nuevo §4.4): cada permiso aparece cuando se entiende por qué hace falta.
// J1 micrófono (y J3 si hay que transcribir en internet) · J2 dónde se piensa la reflexión · panel «Aa».
import Icono from '../componentes/Icono.jsx'
import { Boton, FilaAjuste, FilaLista, HojaInferior } from '../componentes/Ui.jsx'
import { MOTIVOS_DICTADO } from '../datos/privacidad.js'
import Garua from '../mundo/Garua.jsx'

// J1 · Antes de grabar. El toque en «Activar micrófono» es el consentimiento y dispara el aviso del sistema.
// estado: el de estadoDictado() con «Grabar mi voz» ya encendido; si solo se puede transcribir en internet, J3.
export function HojaMicrofono({ estado, onActivar, onInternet, onEscribir, onCerrar }) {
  if (estado === 'requiere-internet') {
    return (
      <HojaInferior titulo="¿Pasamos tu voz a texto en internet?" id="j3-titulo" onCerrar={onCerrar}>
        <div className="hoja__cuerpo">
          <p>Tu teléfono no puede pasar tu voz a texto por sí solo. Podemos hacerlo en internet; el audio no se guarda.</p>
        </div>
        <div className="pila">
          <Boton icono="mic" onClick={onInternet}>Sí, por esta vez</Boton>
          <Boton tipo="linea" icono="pen" onClick={onEscribir}>Mejor escribo</Boton>
        </div>
      </HojaInferior>
    )
  }
  return (
    <HojaInferior titulo="Antes de grabar" id="j1-titulo" onCerrar={onCerrar}
      extra={<Garua estado="escuchando" tam={72} animacion="ninguna" className="hoja__garua" />}>
      <ul className="puntos hoja__cuerpo">
        <li><Icono nombre="person" tam={20} /><span>Busca un lugar donde no grabes a nadie más.</span></li>
        <li><Icono nombre="trash" tam={20} /><span>Tu audio se borra apenas tenemos el texto.</span></li>
        <li><Icono nombre="dot" tam={20} /><span>Verás un punto mientras te escucho.</span></li>
      </ul>
      {estado === 'sin-navegador' && <p className="aviso-linea" role="alert"><Icono nombre="alert" tam={16} />{MOTIVOS_DICTADO[estado]}</p>}
      <div className="pila">
        {estado !== 'sin-navegador' && <Boton icono="mic" onClick={onActivar}>Activar micrófono</Boton>}
        <Boton tipo={estado === 'sin-navegador' ? 'solido' : 'linea'} icono="pen" onClick={onEscribir}>Prefiero escribir</Boton>
      </div>
    </HojaInferior>
  )
}

// J2 · ¿Dónde pensamos tu reflexión? Sin jerga: «en internet» o «solo en este teléfono». Por defecto, el teléfono.
export function HojaIA({ onInternet, onTelefono, onCerrar }) {
  return (
    <HojaInferior titulo="¿Dónde pensamos tu reflexión?" id="j2-titulo" onCerrar={onCerrar}>
      <div className="opciones-ia">
        <button type="button" className="opcion-ia opcion-ia--solida" onClick={onTelefono}>
          <Icono nombre="device" tam={22} />
          <span><b>Solo en este teléfono</b><small>Más simple. Nada sale de aquí.</small></span>
        </button>
        <button type="button" className="opcion-ia opcion-ia--linea" onClick={onInternet}>
          <Icono nombre="globe" tam={22} />
          <span><b>En internet, mejor respuesta</b><small>Tu texto se envía sin tu nombre para escribir la reflexión.</small></span>
        </button>
      </div>
      <p className="cap cap--centro hoja__pie">Puedes cambiarlo cuando quieras en Perfil › Privacidad.</p>
    </HojaInferior>
  )
}

// Panel «Aa»: tamaño del texto, movimiento y sonido, siempre a un toque desde la cabecera
const TAMANOS = [['normal', 'Normal', '1rem'], ['grande', 'Grande', '1.2rem'], ['mas-grande', 'Más grande', '1.4rem']]
export function HojaAa({ preferencias, onCambio, onMas, onCerrar }) {
  return (
    <HojaInferior titulo="Accesibilidad" id="aa-titulo" onCerrar={onCerrar}>
      <div className="aa">
        <div className="aa__tamano">
          <span id="aa-tamano" className="fila__titulo">Tamaño del texto</span>
          <div className="segmento" role="radiogroup" aria-labelledby="aa-tamano">
            {TAMANOS.map(([id, nombre, tam]) => (
              <button key={id} type="button" role="radio" aria-checked={preferencias.tamanoTexto === id} aria-label={nombre}
                onClick={() => onCambio({ tamanoTexto: id })} style={{ fontSize: tam }}>A</button>
            ))}
          </div>
        </div>
        <FilaAjuste icono="motion" titulo="Menos movimiento" activo={preferencias.movimientoReducido} onCambio={(v) => onCambio({ movimientoReducido: v })} />
        <FilaAjuste icono="quiet" titulo="Sin tormentas ni sonidos fuertes" activo={preferencias.modoNeutral} onCambio={(v) => onCambio({ modoNeutral: v })} />
        {onMas && <FilaLista icono="sliders" titulo="Más ajustes" onClick={onMas} />}
      </div>
    </HojaInferior>
  )
}

// Cómo cuidamos tus datos (enlace de la bienvenida): lo esencial, sin jerga
export function CuidadoDatos({ onCerrar }) {
  return (
    <HojaInferior titulo="Cómo cuidamos tus datos" id="datos-titulo" onCerrar={onCerrar}>
      <div className="hoja__cuerpo">
        <p>Lo que cuentas y el clima de cada día se guardan en este teléfono, no en una cuenta.</p>
        <p>El micrófono y la IA en internet se piden recién cuando los usas, y puedes apagarlos en Perfil › Privacidad.</p>
        <p>Las emociones son un dato sensible (Ley 29733). Si tienes menos de 18, léelo con alguien que te cuide.</p>
        <p>Puedes exportar un resumen o borrar todo cuando quieras.</p>
      </div>
      <Boton onClick={onCerrar}>Entendido</Boton>
    </HojaInferior>
  )
}

