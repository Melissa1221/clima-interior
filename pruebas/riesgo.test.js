import { describe, it, expect } from 'vitest'
import { hayRiesgo } from '../src/datos/riesgo.js'

describe('hayRiesgo', () => {
  it.each([
    'ya no quiero seguir así', 'A veces quiero morir', 'pensé en hacerme daño', 'pense en hacerme dano',
    'quisiera desaparecer para siempre', 'NO QUIERO VIVIR', 'siento que no vale la pena vivir',
  ])('detecta: %s', (t) => expect(hayRiesgo(t)).toBe(true))

  it.each([
    'me muero de risa con mi hermana', 'hoy dormí poco', 'quiero seguir estudiando', '',
  ])('no marca: "%s"', (t) => expect(hayRiesgo(t)).toBe(false))
})
