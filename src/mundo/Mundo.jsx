// El mundo ilustrado detrás de cada pantalla: cielo del clima, lomas con amancaes y, de noche, estrellas.
// El dibujo es el de las pantallas de diseño (dibujo.js); aquí solo se ajusta al ancho del teléfono:
// queda anclado abajo (las lomas tocan el suelo) y el cielo se recorta arriba si falta alto.
import { useId } from 'react'
import { estrellas, floresInicio, floresJourney, floresSimples, gotasDeLluvia, lomas, matitas, BORDE } from './dibujo.js'

const FLORES = { inicio: floresInicio, journey: floresJourney, simples: floresSimples, ninguna: () => '' }
// Cielo que pinta cada clima (el modo neutral ya llega convertido en «neutral»)
const CIELO_DE = { soleado: 'soleado', nublado: 'nublado', lluvia: 'lluvia', tormenta: 'tormenta', niebla: 'niebla', neutral: 'neutral' }

export function Mundo({ clima = 'nublado', hy = 350, suelo, flores = 'inicio', brillo, mar = true, lluvia = false, noche = false, capas, className = '', descripcion }) {
  const p = `m${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const alto = suelo ?? hy + 150
  const cielo = CIELO_DE[clima] ?? 'nublado'
  // Capas que la persona apagó en Accesibilidad (S46): lluvia, niebla y luz
  const c = { lluvia: true, niebla: true, luz: true, ...capas }
  const conLluvia = c.lluvia && (lluvia || cielo === 'lluvia' || cielo === 'tormenta')
  let svg = lomas({ hy, cielo, brillo: c.luz ? (brillo ?? [300, 170]) : null, niebla: c.niebla, mar, extra: (FLORES[flores] ?? FLORES.inicio)(hy), H: alto + 40, p })
  if (conLluvia) svg += `<g class="mundo__lluvia">${gotasDeLluvia(alto - 40)}</g>`
  if (noche) {
    svg += `<defs><linearGradient id="${p}noche" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1D2A4D"/><stop offset=".38" stop-color="#2B3A63"/>` +
      `<stop offset=".52" stop-color="#3A4A78"/><stop offset=".7" stop-color="#2A3A55"/><stop offset="1" stop-color="#2E3D52"/></linearGradient></defs>` +
      `<rect y="-400" width="375" height="${alto + 440}" fill="url(#${p}noche)" class="mundo__noche"/><g>${estrellas()}</g>`
  }
  return (
    <svg className={`mundo ${noche ? 'mundo--noche' : ''} ${className}`} viewBox={`0 0 375 ${alto}`} preserveAspectRatio="xMidYMax slice"
      role={descripcion ? 'img' : undefined} aria-label={descripcion} aria-hidden={descripcion ? undefined : true} focusable="false"
      dangerouslySetInnerHTML={{ __html: svg }} />
  )
}

// Borde ondulado del suelo arenoso con sus matitas: va encima del contenido de abajo
export function BordeSuelo({ matas = true }) {
  return (
    <div className="borde-suelo" aria-hidden="true">
      <svg className="borde-suelo__onda" viewBox="0 0 375 28" preserveAspectRatio="none" dangerouslySetInnerHTML={{ __html: BORDE }} />
      {matas && <svg className="borde-suelo__matas" viewBox="0 0 375 40" preserveAspectRatio="xMidYMax meet" dangerouslySetInnerHTML={{ __html: matitas() }} />}
    </div>
  )
}
