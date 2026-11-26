import { describe, it, expect } from 'vitest'
import { fraseMasSignificativa, reflexionDeReglas, temaDe } from '../src/datos/reflexion.js'
import { proponerEmociones } from '../src/llm/index.js'
import { reglas } from '../src/llm/proveedores.js'

describe('reflexión sin IA (M11)', () => {
  it('no agradece «este minuto» si no hubo respiro', () => {
    expect(reflexionDeReglas(undefined, { texto: 'hola' })).not.toMatch(/minuto/)
    expect(reflexionDeReglas(undefined, { texto: 'hola', respiroHoy: true })).toMatch(/minuto/)
  })
  it('retoma el tema del relato', () => {
    expect(temaDe('seguro que voy a jalar el parcial')).toBe('el parcial')
    expect(reflexionDeReglas('ansiedad', { texto: 'mañana es el parcial' })).toMatch(/lo del parcial te tuvo en tensión/)
    expect(reflexionDeReglas('preocupación', { texto: 'tengo tres entregas' })).toMatch(/^Lo de las entregas te quedó dando vueltas/)
  })
  it('el respaldo por reglas usa el relato y el respiro', async () => {
    const r = await proponerEmociones('seguro que voy a jalar el parcial', { proveedor: reglas, contexto: { respiroHoy: false } })
    expect(r.reflexion).toMatch(/parcial/)
    expect(r.reflexion).not.toMatch(/minuto/)
  })
})

describe('«Más corto» conserva la frase que más dice (M11)', () => {
  it('no se queda con la frase de cortesía', () => {
    expect(fraseMasSignificativa('Gracias por contarlo. El parcial te tuvo en tensión toda la semana.', 'mañana es el parcial'))
      .toBe('El parcial te tuvo en tensión toda la semana.')
  })
  it('prefiere la frase que retoma el relato', () => {
    expect(fraseMasSignificativa('Fue un día largo. ¿Qué te ayudaría con las entregas de mañana?', 'tengo dos entregas mañana'))
      .toBe('¿Qué te ayudaría con las entregas de mañana?')
  })
  it('con una sola frase la deja igual, y en empate se queda la primera', () => {
    expect(fraseMasSignificativa('Una sola frase.')).toBe('Una sola frase.')
    expect(fraseMasSignificativa('Uno. Dos.')).toBe('Uno.')
  })
})
