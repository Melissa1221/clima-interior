import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  leerPerfil, guardarRegistro, guardarAjustes, alternarCapa, borrarTodo, registrarFalloMic, pedirMasCorto,
  cambiarCategoria, emocionesFavoritas, personalizarPropuesta, contextoParaLLM, notaDeRitmo, empiezaEscribiendo,
} from '../src/datos/perfil.js'

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

describe('personalización continua', () => {
  beforeEach(() => localStorage.clear())

  it('migra un perfil antiguo sin perder registros', () => {
    localStorage.setItem('clima-interior:perfil', JSON.stringify({ registros: [{ hora: '20:00', clima: 'lluvia' }] }))
    const p = leerPerfil()
    expect(p.registros).toHaveLength(1)
    expect(p.aprendido.frasesCortas).toBe(false)
    expect(p.cambios).toEqual([])
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
    expect(leerPerfil().aprendido.frasesCortas).toBe(true)
    expect(p.cambios.at(-1).fuente).toMatch(/3 veces/)
    expect(personalizarPropuesta(p, { emociones: [], reflexion: 'Uno. Dos.' }).reflexion).toBe('Uno.')
    expect(contextoParaLLM(p).frasesCortas).toBe(true)
  })

  it('con "Cómo te habla el asistente" apagado no se acortan las reflexiones', () => {
    let p = leerPerfil()
    for (let i = 0; i < 3; i++) p = pedirMasCorto(p)
    p = cambiarCategoria(p, 'tono', false)
    expect(personalizarPropuesta(p, { emociones: [], reflexion: 'Uno. Dos.' }).reflexion).toBe('Uno. Dos.')
  })

  it('si el micrófono falla dos veces, empieza ofreciendo escribir', () => {
    let p = registrarFalloMic(leerPerfil())
    expect(empiezaEscribiendo(p)).toBe(false)
    p = registrarFalloMic(p)
    expect(empiezaEscribiendo(p)).toBe(true)
  })

  it('las emociones de la IA solo se guardan si la persona lo permite (S40)', () => {
    let p = guardarRegistro(leerPerfil(), { hora: '21:00', clima: 'lluvia', emocion_inferida: ['tristeza'] })
    expect(p.registros[0].emocion_inferida).toBeNull()
    p = cambiarCategoria(p, 'propuestas', true)
    p = guardarRegistro(p, { hora: '21:00', clima: 'lluvia', emocion_inferida: ['cansancio'], emocion_declarada: ['cansancio'] })
    expect(p.registros[1].emocion_inferida).toEqual(['cansancio'])
    expect(p.aprendizaje.aceptadasIA).toBe(1)
  })

  it('HU-09: apagar las emociones de la IA borra las guardadas', () => {
    let p = cambiarCategoria(leerPerfil(), 'propuestas', true)
    p = guardarRegistro(p, { hora: '21:00', clima: 'lluvia', emocion_inferida: ['tristeza'] })
    p = cambiarCategoria(p, 'propuestas', false)
    expect(p.registros[0].emocion_inferida).toBeNull()
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
})
