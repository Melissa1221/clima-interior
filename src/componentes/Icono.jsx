// Íconos de 24 px y trazo 2 del Figma (src/iconos). Heredan el color del texto con currentColor.
const SVGS = import.meta.glob('../iconos/*.svg', { query: '?raw', import: 'default', eager: true })

export default function Icono({ nombre, tam = 24, className = '' }) {
  const svg = SVGS[`../iconos/${nombre}.svg`]
  if (!svg) return null
  return <span className={`icono ${className}`} style={{ width: tam, height: tam }} aria-hidden="true"
    dangerouslySetInnerHTML={{ __html: svg }} />
}
