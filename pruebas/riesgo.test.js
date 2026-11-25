import { describe, it, expect } from 'vitest'
import { hayRiesgo } from '../src/datos/riesgo.js'

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

