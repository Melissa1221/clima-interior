import { describe, it, expect } from 'vitest'
import { registrosEnRango, rangoPorDefecto, construirResumen, textoAPdf } from '../src/datos/exportar.js'

const registros = [
  { fecha: '2026-09-08', hora: '21:10', clima: 'nublado', emocion_declarada: ['cansancio'], emocion_inferida: ['ansiedad'], transcripcion: 'día largo' },
  { fecha: '2026-09-20', hora: '08:00', clima: 'lluvia', emocion_declarada: null, emocion_inferida: ['tristeza'], transcripcion: 'llovió' },
  { fecha: '2026-10-07', hora: '22:00', clima: 'soleado', emocion_declarada: ['alegría', 'calma'], emocion_inferida: null, transcripcion: null },
]
const todo = { clima: true, emociones: true, palabras: true, transcripciones: false }

describe('registrosEnRango', () => {
  it('incluye los extremos y ordena por fecha', () =>
    expect(registrosEnRango([...registros].reverse(), '2026-09-08', '2026-09-20').map((r) => r.fecha)).toEqual(['2026-09-08', '2026-09-20']))
  it('devuelve vacío si no hay registros en esas fechas', () =>
    expect(registrosEnRango(registros, '2026-08-01', '2026-08-05')).toEqual([]))
})

describe('rangoPorDefecto', () => {
  it('va del primer al último registro', () => expect(rangoPorDefecto(registros)).toEqual({ desde: '2026-09-08', hasta: '2026-10-07' }))
  it('sin registros usa los últimos 30 días', () => {
    const r = rangoPorDefecto([], new Date('2026-10-10T12:00:00Z'))
    expect(r).toEqual({ desde: '2026-09-10', hasta: '2026-10-10' })
  })
})

describe('construirResumen', () => {
  const texto = (incl) => construirResumen(registros, { desde: '2026-09-08', hasta: '2026-10-07' }, incl).join('\n')

  it('nunca incluye lo que propuso la IA', () => {
    const t = texto({ ...todo, transcripciones: true })
    for (const inferida of ['ansiedad', 'tristeza']) expect(t).not.toContain(inferida)
  })
  it('las transcripciones salen solo si la persona las incluye', () => {
    expect(texto(todo)).not.toContain('día largo')
    expect(texto({ ...todo, transcripciones: true })).toContain('día largo')
  })
  it('respeta qué se incluye y marca «no sé» si no eligió emoción', () => {
    const t = texto({ clima: false, emociones: true, palabras: false, transcripciones: false })
    expect(t).not.toContain('Clima:')
    expect(t).toContain('Emociones que eligió: no sé')
    expect(t).toContain('Emociones que eligió: alegría, calma')
  })
  it('cierra aclarando que no hay diagnósticos', () => expect(texto(todo)).toMatch(/ni diagnósticos\.$/))
})

describe('textoAPdf', () => {
  const comoTexto = (bytes) => Array.from(bytes, (b) => String.fromCharCode(b)).join('')

  it('genera un PDF válido con tabla de referencias coherente', () => {
    const pdf = comoTexto(textoAPdf(['Hola «mundo»', 'Línea con (paréntesis) y acentos: áéíóúñ']))
    expect(pdf.startsWith('%PDF-1.4')).toBe(true)
    expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true)
    const xref = Number(pdf.match(/startxref\n(\d+)/)[1])
    expect(pdf.slice(xref, xref + 4)).toBe('xref')
    const offsets = [...pdf.slice(xref).matchAll(/(\d{10}) 00000 n/g)].map((m) => Number(m[1]))
    offsets.forEach((o, i) => expect(pdf.slice(o, o + 7)).toBe(`${i + 1} 0 obj`))
  })
  it('reparte textos largos en varias páginas', () => {
    const pdf = comoTexto(textoAPdf(Array.from({ length: 120 }, (_, i) => `Línea ${i}`)))
    expect(pdf.match(/\/Type \/Page /g)).toHaveLength(3)
  })
  it('envuelve las líneas largas sin cortar palabras de más', () => {
    const pdf = comoTexto(textoAPdf(['palabra '.repeat(40)]))
    expect(pdf.match(/ Tj T\*/g).length).toBeGreaterThan(2)
  })
})
