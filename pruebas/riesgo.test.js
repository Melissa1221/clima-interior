import { describe, it, expect } from 'vitest'
import { hayRiesgo, RECURSOS } from '../src/datos/riesgo.js'

describe('hayRiesgo', () => {
  it.each([
    'ya no quiero seguir así', 'A veces quiero morir', 'pensé en hacerme daño', 'pense en hacerme dano',
    'quisiera desaparecer para siempre', 'NO QUIERO VIVIR', 'siento que no vale la pena vivir',
    'tuve un examen horrible y no sé si quiero seguir viviendo', 'me jalaron otra vez y no sé si puedo seguir',
  ])('detecta: %s', (t) => expect(hayRiesgo(t)).toBe(true))

  it.each([
    'me muero de risa con mi hermana', 'hoy dormí poco', 'quiero seguir estudiando', '',
    'seguro que voy a jalar el parcial', 'no sé si quiero estudiar hoy o mañana',
  ])('no marca: "%s"', (t) => expect(hayRiesgo(t)).toBe(false))
})

describe('RECURSOS', () => {
  it('incluye Bienestar Universitario UNI sin quitar 113, 106 ni 105', () => {
    expect(RECURSOS.map((r) => r.tel)).toEqual(['113', '106', '105', '014811070'])
    expect(RECURSOS.at(-1).detalle).toMatch(/gratuita/)
  })
})
