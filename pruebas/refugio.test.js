import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  debeOfrecerRefugio, resumenRefugios, mejorTecnica, ordenarTecnicas, fraseDeCambio, fraseResumen, duracionRitmo, RITMOS, TECNICAS,
} from '../src/datos/refugio.js'
import { leerTarea, agregarPaso, alternarPaso, quitarPaso, cambiarQue, borrarTarea } from '../src/datos/tarea.js'
import {
  leerPerfil, guardarRefugio, tecnicaFavorita, registrarTrampa, trampasSilenciadas, cambiarCategoria, saltarOfertaRefugio, borrarTodo,
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

const uso = (tecnica, antes, despues) => ({ fecha: '2026-11-25', tecnica, antes, despues, segundos: 70 })

describe('cuándo se ofrece el Refugio', () => {
  it.each([
    [{ clima: 'tormenta' }, true], [{ clima: 'lluvia' }, true],
    [{ clima: 'soleado', emociones: ['ansiedad'] }, true], [{ clima: 'nublado', emociones: ['preocupación'] }, true],
    [{ clima: 'niebla', emociones: ['frustración', 'calma'] }, true],
    [{ clima: 'soleado', emociones: ['alegría'] }, false], [{ clima: 'nublado', emociones: null }, false],
  ])('%j → %s', (checkin, esperado) => expect(debeOfrecerRefugio(checkin)).toBe(esperado))

  it('con riesgo nunca ofrece técnicas, aunque sea tormenta y ansiedad (la crisis va primero)', () => {
    expect(debeOfrecerRefugio({ clima: 'tormenta', emociones: ['ansiedad'], texto: 'tuve un examen horrible y no sé si quiero seguir viviendo' })).toBe(false)
  })
})

describe('técnicas', () => {
  it('la respiración lenta va a 6 por minuto (4 s + 6 s) y dura un minuto', () => {
    expect(RITMOS.lenta.fases.map(([, s]) => s)).toEqual([4, 6])
    expect(duracionRitmo('lenta')).toBe(60)
    expect(duracionRitmo('suspiro')).toBeLessThanOrEqual(90)
  })
  it('no hay 4-7-8 ni respiración cuadrada', () => {
    for (const r of Object.values(RITMOS)) expect(r.fases.map(([, s]) => s).join('-')).not.toMatch(/^4-7-8$|^4-4-4-4$/)
  })
  it('como máximo 4 técnicas, cada una con su línea de evidencia', () => {
    expect(Object.keys(TECNICAS).length).toBeLessThanOrEqual(4)
    expect(TECNICAS.tierra.evidencia).toMatch(/poca investigación/)
  })
  it('la favorita se ofrece primero', () => {
    expect(ordenarTecnicas('tarea')).toEqual(['tarea', 'respirar', 'tierra', 'amiga'])
    expect(ordenarTecnicas(null)[0]).toBe('respirar')
  })
})

describe('antes y después', () => {
  it('resume cada técnica con climas, no con puntajes', () => {
    const r = resumenRefugios([uso('respirar', 'tormenta', 'lluvia'), uso('respirar', 'lluvia', 'nublado'), uso('tierra', 'niebla', 'niebla')])
    expect(r).toEqual([
      { tecnica: 'respirar', veces: 2, cambio: 1.5, antes: 'lluvia', despues: 'niebla' },
      { tecnica: 'tierra', veces: 1, cambio: 0, antes: 'niebla', despues: 'niebla' },
    ])
    expect(fraseResumen(r[0])).toBe('2 veces · suele despejar tu cielo')
    expect(fraseResumen(r[1])).toBe('1 vez · lo deja más o menos igual')
  })
  it('la mejor técnica necesita al menos 2 usos y una mejora', () => {
    expect(mejorTecnica([uso('tarea', 'lluvia', 'soleado')])).toBeNull()
    expect(mejorTecnica([uso('tarea', 'lluvia', 'lluvia'), uso('tarea', 'lluvia', 'lluvia')])).toBeNull()
    expect(mejorTecnica([uso('tarea', 'lluvia', 'nublado'), uso('tarea', 'lluvia', 'nublado'), uso('respirar', 'lluvia', 'niebla'), uso('respirar', 'lluvia', 'niebla')]).tecnica).toBe('tarea')
  })
  it('si empeora, acompaña y sugiere hablar con alguien, sin culpa', () => {
    expect(fraseDeCambio('nublado', 'lluvia')).toMatch(/Hablar con alguien/)
    expect(fraseDeCambio('lluvia', 'lluvia')).not.toMatch(/racha|fallaste|deberías/i)
  })
})

describe('perfil: refugios y aprendizaje', () => {
  beforeEach(() => localStorage.clear())

  it('guarda el registro {fecha, tecnica, antes, despues, segundos} y sobrevive a recargar', () => {
    guardarRefugio(leerPerfil(), uso('respirar', 'tormenta', 'lluvia'))
    expect(leerPerfil().refugios).toEqual([uso('respirar', 'tormenta', 'lluvia')])
  })
  it('aprende la técnica que más ayuda y anota el motivo', () => {
    let p = leerPerfil()
    p = guardarRefugio(p, uso('tarea', 'lluvia', 'nublado'))
    expect(tecnicaFavorita(p)).toBeNull()
    p = guardarRefugio(p, uso('tarea', 'tormenta', 'niebla'))
    expect(tecnicaFavorita(p)).toBe('tarea')
    expect(p.cambios.at(-1)).toMatchObject({ que: 'Te ofrecemos primero «Partir la tarea»', fuente: 'Fue la que más despejó tu cielo en 2 refugios' })
  })
  it('con la categoría apagada guarda el uso pero no aprende; al apagarla se olvida', () => {
    let p = guardarRefugio(guardarRefugio(leerPerfil(), uso('tarea', 'lluvia', 'nublado')), uso('tarea', 'lluvia', 'nublado'))
    p = cambiarCategoria(p, 'refugio', false)
    expect(p.refugios).toEqual([])
    expect(tecnicaFavorita(p)).toBeNull()
    p = guardarRefugio(guardarRefugio(p, uso('respirar', 'lluvia', 'soleado')), uso('respirar', 'lluvia', 'soleado'))
    expect(p.refugios).toHaveLength(2)
    expect(p.aprendido.tecnicaFavorita).toBeNull()
  })
  it('«Ahora no» guarda el día para no volver a ofrecerlo', () => {
    expect(saltarOfertaRefugio(leerPerfil(), '2026-11-25').refugioSaltado).toBe('2026-11-25')
    expect(leerPerfil().refugioSaltado).toBe('2026-11-25')
  })
  it('tras dos «No es así» a una trampa, deja de preguntarla y lo anota', () => {
    let p = registrarTrampa(leerPerfil(), 'adivinar_futuro', 'no')
    expect(trampasSilenciadas(p)).toEqual([])
    p = registrarTrampa(p, 'adivinar_futuro', 'no')
    expect(trampasSilenciadas(p)).toEqual(['adivinar_futuro'])
    expect(p.cambios.at(-1).fuente).toBe('Dijiste «No es así» 2 veces')
  })
  it('si la trampa le suele sonar, no la silencia por un descarte', () => {
    let p = registrarTrampa(registrarTrampa(leerPerfil(), 'deberia', 'si'), 'deberia', 'si')
    p = registrarTrampa(registrarTrampa(p, 'deberia', 'no'), 'deberia', 'no')
    expect(trampasSilenciadas(p)).toEqual([])
  })
  it('con la categoría de trampas apagada no guarda respuestas', () => {
    const p = registrarTrampa(cambiarCategoria(leerPerfil(), 'trampas', false), 'deberia', 'no')
    expect(p.aprendizaje.trampas).toEqual({})
  })
  it('«Eliminar todo» borra refugios y la lista de tareas', async () => {
    guardarRefugio(leerPerfil(), uso('respirar', 'lluvia', 'nublado'))
    agregarPaso(leerTarea(), 'Leer el capítulo 3')
    const p = await borrarTodo()
    expect(p.refugios).toEqual([])
    expect(leerPerfil().refugios).toEqual([])
    expect(leerTarea().pasos).toEqual([])
  })
})

describe('partir la tarea', () => {
  beforeEach(() => localStorage.clear())

  it('agrega, tacha y quita pasos, y los recuerda hasta borrarlos', () => {
    let t = cambiarQue(leerTarea(), 'Parcial de IA')
    t = agregarPaso(t, '  Repasar búsqueda A*  ')
    t = agregarPaso(t, 'Hacer 2 ejercicios')
    t = agregarPaso(t, '   ')
    t = alternarPaso(t, 0)
    expect(leerTarea()).toEqual({ que: 'Parcial de IA', pasos: [{ texto: 'Repasar búsqueda A*', hecho: true }, { texto: 'Hacer 2 ejercicios', hecho: false }] })
    quitarPaso(t, 1)
    expect(leerTarea().pasos).toHaveLength(1)
    borrarTarea()
    expect(leerTarea()).toEqual({ que: '', pasos: [] })
  })
  it('se recupera si el almacenamiento está corrupto', () => {
    localStorage.setItem('clima-interior:tarea', '{roto')
    expect(leerTarea()).toEqual({ que: '', pasos: [] })
  })
})
