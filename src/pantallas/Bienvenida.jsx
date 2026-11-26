// S1 · Bienvenida (reemplaza los 5 pasos del primer uso) y S1b · menores de 18 (06-user-journey.md §4.4).
// Lo esencial legal y ético va en tres líneas: qué es, dónde queda lo que cuentas y que no es clínico.
// Un toque declara la edad (Ley 29733: la emoción es un dato sensible) y lleva al Inicio. Respirar no pide nada.
import Icono from '../componentes/Icono.jsx'
import { Boton, Enlace } from '../componentes/Ui.jsx'
import { Escena, Suelo } from '../componentes/Escena.jsx'

export function Bienvenida({ cabecera, capas, onEmpezar, onRespiro, onMenor, onDemo, onDatos }) {
  return (
    <>
      <Escena clima="nublado" hy={226} suelo={384} flores="journey" brillo={[300, 150]} capas={capas} cabecera={cabecera} className="escena--bienvenida"
        garua={{ estado: 'saludo', tam: 176, x: 4, y: -6, etiqueta: 'Garúa saluda' }}>
        <h1 className="burbuja display-m">Hola, soy Garúa.</h1>
      </Escena>
      <Suelo className="suelo--bienvenida">
        <ul className="puntos puntos--bienvenida">
          <li><Icono nombre="nublado" tam={20} /><span>Cuéntame cómo va tu cielo. Un toque basta.</span></li>
          <li><Icono nombre="lock" tam={20} /><span>Lo que cuentes se queda en tu teléfono.</span></li>
          <li><Icono nombre="info" tam={20} /><span>Es autocuidado: no diagnostica ni reemplaza a una persona.</span></li>
        </ul>
        <div className="pila">
          <Boton onClick={onEmpezar}>Tengo 18 años o más, empecemos</Boton>
          <Boton tipo="linea" icono="respiro" onClick={onRespiro}>Necesito un respiro ahora</Boton>
        </div>
        <div className="fila-enlaces">
          <Enlace onClick={onMenor}>Tengo menos de 18</Enlace>
          <Enlace onClick={onDemo}>Ver un ejemplo</Enlace>
        </div>
        <p className="meta meta--centro">Al empezar aceptas <button type="button" className="enlace enlace--en-linea" onClick={onDatos}>cómo cuidamos tus datos</button></p>
      </Suelo>
    </>
  )
}

// Pendiente (journey §4.4): confirmar con el reglamento de la Ley 29733 si de 14 a 17 años pueden consentir solos.
export function Menor({ cabecera, capas, onEmpezar, onRespiro }) {
  return (
    <>
      <Escena clima="nublado" hy={292} suelo={452} flores="journey" brillo={[90, 160]} capas={capas} cabecera={cabecera}
        garua={{ estado: 'contenta-suave', tam: 160, x: 16, y: 0, etiqueta: 'Garúa contenta' }}>
        <h1 className="burbuja display-m">Qué bueno que estés aquí</h1>
      </Escena>
      <Suelo>
        <p className="cuerpo">Puedes respirar y ver a quién llamar sin dar ningún dato.</p>
        <p className="cuerpo">Para guardar cómo te sientes, léelo con tu mamá, papá o alguien que te cuide.</p>
        <div className="pila pila--aire">
          <Boton onClick={onEmpezar}>Lo leímos juntos, empezar</Boton>
          <Boton tipo="linea" icono="respiro" onClick={onRespiro}>Solo quiero respirar</Boton>
        </div>
      </Suelo>
    </>
  )
}
