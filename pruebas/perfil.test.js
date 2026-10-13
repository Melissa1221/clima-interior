import { describe, it, expect, beforeEach, vi } from 'vitest'
import { leerPerfil, guardarRegistro } from '../src/datos/perfil.js'

// Node 25 trae un localStorage global propio que tapa el de jsdom
const memoria = new Map()
vi.stubGlobal('localStorage', {
  getItem: (k) => memoria.get(k) ?? null,
  setItem: (k, v) => memoria.set(k, String(v)),
  clear: () => memoria.clear(),
})

describe('perfil', () => {
  beforeEach(() => localStorage.clear())

  it('empieza vacío', () => expect(leerPerfil().registros).toEqual([]))
  it('se recupera si el almacenamiento está corrupto', () => {
    localStorage.setItem('clima-interior:perfil', '{roto')
    expect(leerPerfil().registros).toEqual([])
  })
  it('guarda registros y calcula la hora habitual', () => {
    let p = leerPerfil()
    for (const hora of ['21:10', '21:40', '08:00']) p = guardarRegistro(p, { hora, clima: 'nublado' })
    expect(leerPerfil().registros).toHaveLength(3)
    expect(leerPerfil().ritmo.horaHabitual).toBe('21')
  })
})
