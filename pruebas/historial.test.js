import { describe, it, expect } from 'vitest'
import { diasRegistrados, registrosDelDia, treintaDias } from '../src/datos/historial.js'

const reg = (fecha, clima, hora = '10:00') => ({ fecha, hora, clima })

describe('historial con dos registros el mismo día (A3)', () => {
  const registros = [reg('2026-11-20', 'lluvia', '09:00'), reg('2026-11-20', 'soleado', '21:00'), reg('2026-11-22', 'niebla')]
  it('cuenta días distintos, no registros', () => expect(diasRegistrados(registros)).toBe(2))
  it('el día muestra su último clima y guarda todos sus registros', () => {
    const dias = treintaDias(registros, { terminaHoy: true, hoy: new Date('2026-11-26T12:00:00') })
    expect(dias).toHaveLength(30)
    const d = dias.find((x) => x.fecha === '2026-11-20')
    expect(d.r.clima).toBe('soleado')
    expect(d.registros.map((r) => r.clima)).toEqual(['lluvia', 'soleado'])
    expect(dias.at(-1).fecha).toBe('2026-11-26')
  })
  it('el detalle trae todos los registros del día', () => {
    expect(registrosDelDia(registros, '2026-11-20').map((r) => r.hora)).toEqual(['09:00', '21:00'])
  })
})
