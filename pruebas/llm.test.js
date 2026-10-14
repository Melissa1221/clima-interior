import { describe, it, expect, vi, beforeEach } from 'vitest'
import { normalizar, proponerEmociones } from '../src/llm/index.js'
import { gemini } from '../src/llm/proveedores.js'

const ok = { emociones: [{ nombre: 'calma', confianza: 0.8 }], reflexion: 'Hoy hubo calma.' }
const prov = (fn) => ({ nombre: 'prueba', proponerEmociones: fn })

describe('normalizar', () => {
  it('pasa a minúsculas y quita espacios', () => {
    expect(normalizar({ emociones: [{ nombre: ' Cansancio ' }], reflexion: 'x' }).emociones[0].nombre).toBe('cansancio')
  })
  it('descarta emociones fuera de la lista y repetidas', () => {
    const r = normalizar({ emociones: [{ nombre: 'agotamiento' }, { nombre: 'calma' }, { nombre: 'Calma' }, { nombre: 3 }, null], reflexion: 'x' })
    expect(r.emociones.map((e) => e.nombre)).toEqual(['calma'])
  })
  it('deja como máximo 4 emociones', () => {
    const nombres = ['calma', 'alegría', 'alivio', 'gratitud', 'cansancio']
    expect(normalizar({ emociones: nombres.map((nombre) => ({ nombre })), reflexion: 'x' }).emociones).toHaveLength(4)
  })
  it('no rompe con respuestas que no son objeto', () => {
    expect(normalizar(null)).toBe(null)
    expect(normalizar('texto')).toBe('texto')
  })
})

describe('proponerEmociones', () => {
  beforeEach(() => vi.spyOn(console, 'warn').mockImplementation(() => {}))

  it('devuelve la respuesta del proveedor', async () => {
    const r = await proponerEmociones('hola', { proveedor: prov(async () => ok) })
    expect(r.proveedor).toBe('prueba')
    expect(r.emociones[0].nombre).toBe('calma')
  })
  it('usa el respaldo si el proveedor lanza un error', async () => {
    const r = await proponerEmociones('hola', { proveedor: prov(async () => { throw new Error('HTTP 503') }) })
    expect(r.respaldo).toBe(true)
  })
  it('el respaldo igual propone emociones a partir del relato', async () => {
    const r = await proponerEmociones('mucho trabajo, terminé cansada y aliviada', { proveedor: prov(async () => { throw new Error('HTTP 404') }) })
    expect(r.emociones.map((e) => e.nombre)).toEqual(['cansancio', 'alivio', 'calma'])
    expect(r.reflexion).toMatch(/energía/)
  })
  it('usa el respaldo si el proveedor tarda demasiado', async () => {
    const r = await proponerEmociones('hola', { proveedor: prov(() => new Promise(() => {})), tiempoMax: 50 })
    expect(r.respaldo).toBe(true)
  })
  it('usa el respaldo si falta la reflexión', async () => {
    const r = await proponerEmociones('hola', { proveedor: prov(async () => ({ emociones: [], reflexion: '' })) })
    expect(r.respaldo).toBe(true)
  })
  it('acepta cero emociones válidas si hay reflexión', async () => {
    const r = await proponerEmociones('hola', { proveedor: prov(async () => ({ emociones: [{ nombre: 'euforia' }], reflexion: 'Gracias.' })) })
    expect(r.respaldo).toBeUndefined()
    expect(r.emociones).toEqual([])
  })
})

describe('proveedor gemini', () => {
  const resp = (status, cuerpo) => ({ ok: status === 200, status, json: async () => cuerpo })
  const texto = (t) => ({ candidates: [{ content: { parts: [{ text: t }] } }] })
  const modelo = (n) => fetch.mock.calls[n][0].match(/models\/(.+):/)[1]

  beforeEach(() => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'clave-de-prueba')
    vi.stubEnv('VITE_GEMINI_MODELOS', 'modelo-a, modelo-b')
  })

  it('pasa al siguiente modelo si el primero está saturado', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(resp(503, { error: { message: 'saturado' } }))
      .mockResolvedValueOnce(resp(200, texto(JSON.stringify(ok))))
    expect(await gemini.proponerEmociones('hola')).toEqual(ok)
    expect([modelo(0), modelo(1)]).toEqual(['modelo-a', 'modelo-b'])
  })
  it('pasa al siguiente modelo si el primero tarda', async () => {
    const lento = Object.assign(new Error('timeout'), { name: 'TimeoutError' })
    global.fetch = vi.fn().mockRejectedValueOnce(lento).mockResolvedValueOnce(resp(200, texto(JSON.stringify(ok))))
    expect(await gemini.proponerEmociones('hola')).toEqual(ok)
  })
  it('falla con el detalle si ningún modelo responde', async () => {
    global.fetch = vi.fn().mockResolvedValue(resp(429, {}))
    await expect(gemini.proponerEmociones('hola')).rejects.toThrow('modelo-a: HTTP 429; modelo-b: HTTP 429')
  })
  it('no prueba otros modelos si la clave es inválida', async () => {
    global.fetch = vi.fn().mockResolvedValue(resp(400, { error: { message: 'API key not valid' } }))
    await expect(gemini.proponerEmociones('hola')).rejects.toThrow('HTTP 400')
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  it('lee JSON envuelto en ```json', async () => {
    global.fetch = vi.fn().mockResolvedValue(resp(200, texto('```json\n' + JSON.stringify(ok) + '\n```')))
    expect(await gemini.proponerEmociones('hola')).toEqual(ok)
  })
  it('falla con motivo si la respuesta viene bloqueada', async () => {
    global.fetch = vi.fn().mockResolvedValue(resp(200, { candidates: [{ finishReason: 'SAFETY' }] }))
    await expect(gemini.proponerEmociones('hola')).rejects.toThrow('SAFETY')
  })
  it('falla antes de llamar si no hay clave', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '')
    global.fetch = vi.fn()
    await expect(gemini.proponerEmociones('hola')).rejects.toThrow('falta VITE_GEMINI_API_KEY')
    expect(fetch).not.toHaveBeenCalled()
  })
})
