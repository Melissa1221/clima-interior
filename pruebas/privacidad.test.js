import { describe, it, expect } from 'vitest'
import { debePreguntarIA, estadoDictado, temaEfectivo } from '../src/datos/privacidad.js'

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

describe('debePreguntarIA (hoja justo a tiempo)', () => {
  const nube = { enInternet: true }
  it('pregunta la primera vez si el proveedor sale a internet', () => expect(debePreguntarIA({ ia: false }, nube)).toBe(true))
  it('no vuelve a preguntar después de decidir', () => expect(debePreguntarIA({ ia: true }, nube)).toBe(false))
  it('no pregunta si el proveedor es local', () => expect(debePreguntarIA({ ia: false }, { enInternet: false })).toBe(false))
  it('un proveedor que no declara enInternet cuenta como en internet', () => expect(debePreguntarIA({ ia: false }, {})).toBe(true))
})

describe('temaEfectivo', () => {
  it('respeta lo que fija la persona', () => {
    expect(temaEfectivo('claro', { sistemaOscuro: true, hora: 23 })).toBe('claro')
    expect(temaEfectivo('noche', { hora: 10 })).toBe('noche')
  })
  it('en automático sigue al sistema y, si no, a la hora', () => {
    expect(temaEfectivo('auto', { sistemaOscuro: true, hora: 10 })).toBe('noche')
    expect(temaEfectivo('auto', { hora: 21 })).toBe('noche')
    expect(temaEfectivo('auto', { hora: 5 })).toBe('noche')
    expect(temaEfectivo('auto', { hora: 12 })).toBe('claro')
  })
})
