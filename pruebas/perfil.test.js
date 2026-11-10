import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  leerPerfil, guardarRegistro, registrarFalloMic, pedirMasCorto, cambiarCategoria, borrarTodo,
  emocionesFavoritas, personalizarPropuesta, contextoParaLLM, notaDeRitmo,
} from '../src/datos/perfil.js'

// Node 25 trae un localStorage global propio que tapa el de jsdom
const memoria = new Map()
vi.stubGlobal('localStorage', {
  getItem: (k) => memoria.get(k) ?? null,
  setItem: (k, v) => memoria.set(k, String(v)),
  removeItem: (k) => memoria.delete(k),
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

describe('personalización continua', () => {
  beforeEach(() => localStorage.clear())

  it('migra un perfil v1 sin perder registros', () => {
    localStorage.setItem('clima-interior:perfil', JSON.stringify({ registros: [{ hora: '20:00', clima: 'lluvia' }] }))
    const p = leerPerfil()
    expect(p.registros).toHaveLength(1)
    expect(p.activas.tono).toBe(true)
  })

  it('aprende las emociones que eliges y las ofrece aunque la IA no las proponga', () => {
    let p = leerPerfil()
    for (let i = 0; i < 2; i++) p = guardarRegistro(p, { hora: '21:00', clima: 'nublado', emocion_declarada: ['gratitud'] })
    expect(emocionesFavoritas(p)).toEqual(['gratitud'])
    const r = personalizarPropuesta(p, { emociones: [{ nombre: 'calma', confianza: 0.7 }], reflexion: 'Hola. Chau.' })
    expect(r.emociones.map((e) => e.nombre)).toEqual(['calma', 'gratitud'])
    expect(r.emociones[1].tuya).toBe(true)
  })

  it('HU-08: tras tres "más corto" la reflexión queda en una frase y se anota la fuente', () => {
    let p = leerPerfil()
    for (let i = 0; i < 3; i++) p = pedirMasCorto(p)
    expect(leerPerfil().preferencias.frasesCortas).toBe(true)
    expect(p.cambios.at(-1).fuente).toMatch(/3 veces/)
    expect(personalizarPropuesta(p, { emociones: [], reflexion: 'Uno. Dos.' }).reflexion).toBe('Uno.')
    expect(contextoParaLLM(p).frasesCortas).toBe(true)
  })

  it('si el micrófono falla dos veces, empieza ofreciendo escribir', () => {
    let p = registrarFalloMic(leerPerfil())
    expect(p.preferencias.entrada).toBe('voz')
    p = registrarFalloMic(p)
    expect(p.preferencias.entrada).toBe('texto')
  })

  it('HU-09: apagar las emociones inferidas borra lo guardado y no guarda nuevas', () => {
    let p = guardarRegistro(leerPerfil(), { hora: '21:00', clima: 'lluvia', emocion_inferida: ['tristeza'] })
    p = cambiarCategoria(p, 'emocionesInferidas', false)
    expect(p.registros[0].emocion_inferida).toBeNull()
    p = guardarRegistro(p, { hora: '21:00', clima: 'lluvia', emocion_inferida: ['cansancio'] })
    expect(p.registros[1].emocion_inferida).toBeNull()
    expect(p.aprendizaje.propuestasIA).toBe(0)
  })

  it('reconoce la hora habitual solo con tres registros o más', () => {
    let p = leerPerfil()
    const ahora = new Date('2026-11-10T21:15:00')
    p = guardarRegistro(p, { hora: '21:00', clima: 'soleado' })
    expect(notaDeRitmo(p, ahora)).toBeNull()
    for (let i = 0; i < 2; i++) p = guardarRegistro(p, { hora: '21:30', clima: 'soleado' })
    expect(notaDeRitmo(p, ahora)).toMatch(/hora de siempre/)
  })

  it('borrar todo deja el perfil vacío', () => {
    guardarRegistro(leerPerfil(), { hora: '21:00', clima: 'soleado' })
    expect(borrarTodo().registros).toEqual([])
    expect(leerPerfil().registros).toEqual([])
  })
})
