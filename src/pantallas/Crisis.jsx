// C1 · Crisis (v3 «06 Apoyo ahora»): sin Garúa ni animación. Dos textos según cómo se llegó:
// por el botón «Ayuda ya» o porque el detector de riesgo (hayRiesgo) reconoció una frase. La app nunca llama por ti.
import { useEffect, useRef } from 'react'
import Icono from '../componentes/Icono.jsx'
import { Boton, atraparFoco } from '../componentes/Ui.jsx'
import { RECURSOS } from '../datos/riesgo.js'
import { horizonteCrisis } from '../mundo/dibujo.js'

const TEXTO = {
  boton: 'Hablar con una persona puede aliviar. Estas líneas atienden de verdad y son gratis.',
  detector: 'Algo de lo que contaste nos preocupa. Hablar con una persona puede aliviar.',
}
// Número grande a la izquierda de cada fila
const NUMERO = { '113': '113', '106': '106', '105': '105', '014811070': 'UNI' }
const TITULO = { '106': 'SAMU', '105': 'Policía Nacional', '014811070': 'Bienestar Universitario UNI' }

export default function Crisis({ origen = 'boton', onVolver }) {
  const titulo = useRef(null)
  const raiz = useRef(null)
  // B1: es un diálogo modal (no una alerta entera): Escape vuelve y el Tab no sale de él
  useEffect(() => {
    titulo.current?.focus()
    const alTecla = (e) => {
      if (e.key === 'Escape') onVolver?.()
      atraparFoco(e, raiz.current)
    }
    document.addEventListener('keydown', alTecla)
    return () => document.removeEventListener('keydown', alTecla)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const [principal, ...resto] = RECURSOS
  return (
    <div ref={raiz} className="crisis" role="dialog" aria-modal="true" aria-labelledby="crisis-titulo" aria-describedby="crisis-texto">
      <svg className="crisis__horizonte" viewBox="0 0 375 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: horizonteCrisis() }} />
      <div className="crisis__cabeza">
        <h1 id="crisis-titulo" ref={titulo} tabIndex={-1} className="display-l">Mereces apoyo ahora mismo</h1>
        <p id="crisis-texto" className="cuerpo" role="alert">{TEXTO[origen] ?? TEXTO.boton}</p>
      </div>
      <div className="crisis__lista">
        <a className="crisis__principal" href={`tel:${principal.tel}`} aria-label={`Llamar a la ${principal.nombre}: ${principal.detalle}`}>
          <span className="crisis__num">113</span>
          <span className="crisis__textos"><b>Salud mental · 24 h</b><small>Línea 113 · marca la opción 5</small></span>
          <span className="crisis__tel"><Icono nombre="phone" tam={20} /></span>
        </a>
        <div className="crisis__filas">
          {resto.map((r) => (
            <a key={r.tel} className="crisis__fila" href={`tel:${r.tel}`} aria-label={`Llamar a ${r.nombre}: ${r.detalle}`}>
              <span className="crisis__num">{NUMERO[r.tel] ?? r.tel}</span>
              <span className="crisis__textos"><b>{TITULO[r.tel] ?? r.nombre}</b><small>{r.detalle}</small></span>
              <span className="crisis__tel"><Icono nombre="phone" tam={20} /></span>
            </a>
          ))}
        </div>
        <p className="cap cap--centro crisis__nota"><Icono nombre="lock" tam={16} />La app no contactó a nadie. Tú decides si llamas.</p>
        <Boton tipo="linea" onClick={onVolver}>Volver cuando quieras</Boton>
      </div>
    </div>
  )
}
