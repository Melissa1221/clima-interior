import { describe, it, expect } from 'vitest'
import { saludo } from '../src/datos/saludo.js'

describe('saludo según la hora, no según el tema (B6)', () => {
  it.each([[10, '¿Cómo va tu cielo hoy?'], [15, '¿Cómo va tu cielo hoy?'], [19, 'Buenas noches, ¿cómo va tu cielo?'], [2, 'Buenas noches, ¿cómo va tu cielo?']])(
    'a las %i h', (h, t) => expect(saludo(h)).toBe(t))
})
