import { describe, it, expect } from 'vitest'
import {
  validarMensaje, generarCodigo, codigoValido, normalizarCodigo, climaColectivo, mensajeDeClima,
} from '../src/salas/mensaje.js'
import { transporteLocal } from '../src/salas/transporte.js'
import { crearSala } from '../src/salas/sala.js'

const esperar = (ms = 30) => new Promise((r) => setTimeout(r, ms))

describe('esquema de mensajes (RNF-13)', () => {
  it('acepta un clima numérico', () => expect(validarMensaje(mensajeDeClima(7, 'lluvia'))).toBe(true))
  it('HU-12 Esc. 3: rechaza texto libre', () => {
    expect(validarMensaje({ tipo: 'clima', de: 7, c: 2, v: -0.4, nota: 'hoy lloré' })).toBe(false)
    expect(validarMensaje({ tipo: 'clima', de: 7, c: 'lluvia', v: -0.4 })).toBe(false)
    expect(validarMensaje({ tipo: 'clima', de: 'Ana', c: 2, v: -0.4 })).toBe(false)
    expect(validarMensaje({ tipo: 'chat', de: 7 })).toBe(false)
  })
  it('rechaza valores fuera de rango', () => {
    expect(validarMensaje({ tipo: 'clima', de: 7, c: 9, v: 0 })).toBe(false)
    expect(validarMensaje({ tipo: 'clima', de: 7, c: 1, v: 3 })).toBe(false)
  })
})

describe('código de sala (RNF-14)', () => {
  it('tiene 128 bits en base32 y no se repite', () => {
    const codigos = new Set(Array.from({ length: 200 }, generarCodigo))
    expect(codigos.size).toBe(200)
    for (const c of codigos) expect(codigoValido(c)).toBe(true)
    expect([...codigos][0].replace(/-/g, '')).toHaveLength(26)
  })
  it('acepta el código escrito en minúsculas y sin guiones', () => {
    const c = generarCodigo()
    expect(normalizarCodigo(c.toLowerCase().replace(/-/g, ' '))).toBe(c)
  })
})

describe('clima colectivo (RF-28)', () => {
  it('combina cinco climas', () => {
    const r = climaColectivo(['soleado', 'nublado', 'lluvia', 'niebla', 'soleado'])
    expect(r.clima).toBe('nublado')
    expect(r.cuenta.soleado).toBe(2)
  })
  it('sala vacía no tiene clima', () => expect(climaColectivo([])).toBeNull())
})

describe('sala entre participantes', () => {
  function unir(codigo, creador) {
    const ultimo = { estado: null }
    const sala = crearSala({ codigo, creador, transporte: transporteLocal(codigo), alCambio: (e) => { ultimo.estado = e } })
    return { sala, ultimo }
  }

  it('HU-12: quien entra tarde ve el clima de los demás, y retirar lo borra', async () => {
    const codigo = generarCodigo()
    const a = unir(codigo, true)
    await esperar()
    a.sala.compartir('lluvia')
    const b = unir(codigo, false)
    await esperar()
    expect(b.ultimo.estado.otros.map((p) => p.clima)).toEqual(['lluvia'])
    expect(b.ultimo.estado.colectivo.clima).toBe('lluvia')
    a.sala.retirar()
    await esperar()
    expect(b.ultimo.estado.otros[0].clima).toBeNull()
    a.sala.salir(); b.sala.salir()
  })

  it('HU-13: el creador expulsa y cierra; un invitado no puede', async () => {
    const codigo = generarCodigo()
    const a = unir(codigo, true)
    const b = unir(codigo, false)
    const c = unir(codigo, false)
    await esperar()
    b.sala.expulsar(a.ultimo.estado.yo.id) // un invitado no tiene permiso
    await esperar()
    expect(a.ultimo.estado.fin).toBeNull()
    a.sala.expulsar(b.ultimo.estado.yo.id)
    await esperar()
    expect(b.ultimo.estado.fin).toBe('expulsado')
    expect(c.ultimo.estado.otros).toHaveLength(1)
    a.sala.cerrar()
    await esperar()
    expect(c.ultimo.estado.fin).toBe('cerrada')
  })

  it('salas distintas no se ven', async () => {
    const a = unir(generarCodigo(), true)
    const b = unir(generarCodigo(), false)
    await esperar()
    expect(a.ultimo.estado.otros).toHaveLength(0)
    expect(b.ultimo.estado.otros).toHaveLength(0)
    a.sala.salir(); b.sala.salir()
  })
})
