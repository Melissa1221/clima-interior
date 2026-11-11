import { describe, it, expect, vi, afterEach } from 'vitest'
import { detectarOrden, limitarPalabras, vibrar, sistemaPideMenosMovimiento } from '../src/datos/accesibilidad.js'

afterEach(() => vi.unstubAllGlobals())

describe('detectarOrden', () => {
  it('reconoce «terminar» al final y lo quita del texto', () =>
    expect(detectarOrden('hoy fue un día largo terminar')).toEqual({ orden: 'terminar', texto: 'hoy fue un día largo' }))
  it('acepta mayúsculas, tildes y puntuación', () =>
    expect(detectarOrden('Estoy cansada. Salir por hoy!').orden).toBe('salir'))
  it('reconoce «pausar» y «ayuda»', () => {
    expect(detectarOrden('un momento, pausar').orden).toBe('pausar')
    expect(detectarOrden('ayuda').orden).toBe('ayuda')
  })
  it('no confunde una palabra parecida en medio de la frase', () => {
    expect(detectarOrden('quiero terminar mi tarea pronto').orden).toBe(null)
    expect(detectarOrden('necesito ayuda con mi tarea').orden).toBe(null)
  })
  it('sin orden devuelve el texto igual', () => expect(detectarOrden('día tranquilo')).toEqual({ orden: null, texto: 'día tranquilo' }))
})

describe('limitarPalabras', () => {
  it('no toca los textos cortos', () => expect(limitarPalabras('una dos tres', 80)).toBe('una dos tres'))
  it('corta en el máximo y marca que hay más', () => {
    const t = limitarPalabras(Array.from({ length: 100 }, (_, i) => `p${i}`).join(' '), 80)
    expect(t.endsWith('p79…')).toBe(true)
    expect(t.split(/\s+/)).toHaveLength(80)
  })
})

describe('vibrar', () => {
  it('vibra con el patrón si la persona lo dejó activo', () => {
    const fn = vi.fn(() => true)
    vi.stubGlobal('navigator', { vibrate: fn })
    expect(vibrar({ vibrar: true })).toBe(true)
    expect(fn).toHaveBeenCalledWith([120, 60, 120])
  })
  it('no vibra si está apagado o el dispositivo no puede', () => {
    const fn = vi.fn()
    vi.stubGlobal('navigator', { vibrate: fn })
    expect(vibrar({ vibrar: false })).toBe(false)
    expect(fn).not.toHaveBeenCalled()
    vi.stubGlobal('navigator', {})
    expect(vibrar({ vibrar: true })).toBe(false)
  })
})

describe('sistemaPideMenosMovimiento', () => {
  it('lee la preferencia del sistema', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    expect(sistemaPideMenosMovimiento()).toBe(true)
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    expect(sistemaPideMenosMovimiento()).toBe(false)
  })
})
