// Garúa, la nubecita de neblina de las lomas. Cada estado es una pose aprobada de
// estudio-visual/personaje/garua-estados (exportada con scripts/exportar_garua.py), sin redibujar.
// Qué estado va en cada momento: estados-garua.md. Nunca aparece en la pantalla de crisis.
import { useId } from 'react'

const POSES = import.meta.glob('./garua/*.svg', { query: '?raw', import: 'default', eager: true })

// El clima del día como pose de Garúa (el modo neutral llega como «neutral»)
export const POSE_DE_CLIMA = { soleado: 'clima-sol', nublado: 'clima-nublado', lluvia: 'clima-lluvia', tormenta: 'clima-tormenta', niebla: 'clima-niebla', neutral: 'neutral' }

// Prefija los id para que varias Garúas convivan en una pantalla sin pisarse los degradados
function preparar(svg, p) {
  const ids = [...new Set([...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1]))].sort((a, b) => b.length - a.length)
  let s = svg
  for (const id of ids) s = s.split(`id="${id}"`).join(`id="${p}${id}"`).split(`url(#${id})`).join(`url(#${p}${id})`).split(`href="#${id}"`).join(`href="#${p}${id}"`)
  // ojos con clase para el parpadeo (el id original era «ojos»)
  s = s.replace(`id="${p}ojos"`, `id="${p}ojos" class="garua__ojos"`)
  return s.replace(/<svg([^>]*?)\swidth="[^"]*"\sheight="[^"]*"/, '<svg$1').replace('<svg', '<svg class="garua__svg" aria-hidden="true" focusable="false" overflow="visible"')
}

// animacion: 'flotar' (6 s, de reposo) · 'escuchar' (pulsa con la voz) · 'ninguna'. La respiración la mueve quien la usa.
export default function Garua({ estado = 'flotando', tam = 150, etiqueta, animacion = 'flotar', className = '', style }) {
  const p = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const svg = POSES[`./garua/${estado}.svg`] ?? POSES['./garua/flotando.svg']
  return (
    <div className={`garua garua--${animacion} ${className}`} style={{ width: tam, height: tam * (estado.startsWith('amiga-') ? 0.85 : 1), ...style }}
      role={etiqueta ? 'img' : undefined} aria-label={etiqueta} aria-hidden={etiqueta ? undefined : true} data-estado={estado}
      dangerouslySetInnerHTML={{ __html: preparar(svg, p) }} />
  )
}
