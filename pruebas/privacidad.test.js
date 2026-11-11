import { describe, it, expect } from 'vitest'
import { estadoDictado } from '../src/datos/privacidad.js'

const todo = { grabarVoz: true, transcribirEnInternet: true }
const motor = { dictado: true, local: false }

describe('estadoDictado', () => {
  it('se puede dictar con permiso de voz y de internet', () => expect(estadoDictado(todo, motor)).toBe('ok'))
  it('se puede dictar sin internet si el navegador transcribe en el dispositivo', () =>
    expect(estadoDictado({ ...todo, transcribirEnInternet: false }, { dictado: true, local: true })).toBe('ok'))
  it('no dicta si el audio saldría a internet sin permiso', () =>
    expect(estadoDictado({ ...todo, transcribirEnInternet: false }, motor)).toBe('requiere-internet'))
  it('respeta «Grabar mi voz» apagado', () => expect(estadoDictado({ ...todo, grabarVoz: false }, motor)).toBe('sin-permiso'))
  it('avisa si el navegador no tiene dictado', () => expect(estadoDictado(todo, { dictado: false, local: false })).toBe('sin-navegador'))
})
