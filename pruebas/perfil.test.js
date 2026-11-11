import { describe, it, expect, beforeEach, vi } from 'vitest'
import { leerPerfil, guardarRegistro, guardarAjustes, alternarCapa, borrarTodo } from '../src/datos/perfil.js'

// Node 25 trae un localStorage global propio que tapa el de jsdom
const memoria = new Map()
vi.stubGlobal('localStorage', {
  getItem: (k) => memoria.get(k) ?? null,
  setItem: (k, v) => memoria.set(k, String(v)),
  clear: () => memoria.clear(),
  removeItem: (k) => memoria.delete(k),
  key: (i) => [...memoria.keys()][i] ?? null,
  get length() { return memoria.size },
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

describe('ajustes del perfil', () => {
  beforeEach(() => localStorage.clear())

  it('arranca con los permisos más protectores', () => {
    const p = leerPerfil()
    expect(p.privacidad).toEqual({ grabarVoz: true, transcribirEnInternet: false, iaEnInternet: false, climaCompartido: false })
    expect(p.personalizacion.propuestas).toBe(false)
    expect(p.primerUso.completo).toBe(false)
  })

  it('un perfil guardado antes de los ajustes nuevos los recibe con su valor por defecto', () => {
    localStorage.setItem('clima-interior:perfil', JSON.stringify({ registros: [], preferencias: { modoNeutral: true } }))
    const p = leerPerfil()
    expect(p.preferencias.modoNeutral).toBe(true)
    expect(p.preferencias.vibrar).toBe(true)
    expect(p.preferencias.capas.lluvia).toBe(true)
  })

  it('guarda un grupo de ajustes sin tocar los demás', () => {
    let p = leerPerfil()
    p = guardarAjustes(p, 'privacidad', { iaEnInternet: true })
    expect(leerPerfil().privacidad).toMatchObject({ iaEnInternet: true, grabarVoz: true })
  })

  it('apaga y enciende una capa del clima por separado', () => {
    let p = alternarCapa(leerPerfil(), 'viento')
    expect(leerPerfil().preferencias.capas).toMatchObject({ viento: false, lluvia: true })
    p = alternarCapa(p, 'viento')
    expect(leerPerfil().preferencias.capas.viento).toBe(true)
  })

  it('borrarTodo elimina el perfil y devuelve uno vacío', async () => {
    guardarRegistro(leerPerfil(), { hora: '21:00', clima: 'lluvia' })
    localStorage.setItem('clima-interior:cola', '[1]')
    const vacio = await borrarTodo()
    expect(vacio.registros).toEqual([])
    expect(leerPerfil().registros).toEqual([])
    expect(localStorage.getItem('clima-interior:cola')).toBeNull()
  })
})
