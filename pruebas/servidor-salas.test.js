// Prueba de integración del relé: levanta el servidor real y conecta clientes WebSocket
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { spawn } from 'node:child_process'
import WebSocket from 'ws'
import { generarCodigo } from '../src/salas/mensaje.js'

const PUERTO = 8790 + Math.floor(Math.random() * 100)
let srv
const esperar = (ms = 60) => new Promise((r) => setTimeout(r, ms))

function cliente(codigo, crear = false) {
  const ws = new WebSocket(`ws://localhost:${PUERTO}?sala=${codigo}${crear ? '&crear=1' : ''}`)
  const c = { ws, recibidos: [], cierre: null }
  ws.on('message', (d) => c.recibidos.push(JSON.parse(d)))
  ws.on('close', (code, razon) => { c.cierre = String(razon) })
  c.listo = new Promise((r) => ws.on('open', r))
  c.enviar = (m) => ws.send(JSON.stringify(m))
  return c
}

beforeAll(async () => {
  srv = spawn('node', ['server/salas.mjs'], { env: { ...process.env, PUERTO: String(PUERTO) } })
  await new Promise((r) => srv.stdout.once('data', r))
})
afterAll(() => srv.kill())

describe('relé de salas', () => {
  it('no deja entrar a una sala que no existe', async () => {
    const c = cliente(generarCodigo())
    await esperar(150)
    expect(c.cierre).toBe('caducó')
  })

  it('reenvía solo mensajes numéricos y el creador lo decide el servidor', async () => {
    const codigo = generarCodigo()
    const a = cliente(codigo, true); await a.listo
    const b = cliente(codigo); await b.listo
    a.enviar({ tipo: 'hola', de: 1, creador: 1 })
    b.enviar({ tipo: 'hola', de: 2, creador: 1 }) // miente: dice ser creador
    b.enviar({ tipo: 'clima', de: 2, c: 2, v: -0.4, nota: 'texto' }) // rechazado
    b.enviar({ tipo: 'clima', de: 3, c: 2, v: -0.4 }) // se hace pasar por otro: rechazado
    b.enviar({ tipo: 'clima', de: 2, c: 2, v: -0.4 })
    await esperar()
    expect(a.recibidos).toEqual([
      { tipo: 'hola', de: 2, creador: 0 },
      { tipo: 'clima', de: 2, c: 2, v: -0.4 },
    ])
    a.ws.close(); b.ws.close()
  })

  it('HU-13: solo el creador expulsa y cierra', async () => {
    const codigo = generarCodigo()
    const a = cliente(codigo, true); await a.listo
    const b = cliente(codigo); await b.listo
    const c = cliente(codigo); await c.listo
    a.enviar({ tipo: 'hola', de: 1, creador: 1 })
    b.enviar({ tipo: 'hola', de: 2, creador: 0 })
    c.enviar({ tipo: 'hola', de: 3, creador: 0 })
    await esperar()
    b.enviar({ tipo: 'expulsar', de: 2, a: 3 })
    await esperar()
    expect(c.cierre).toBeNull()
    a.enviar({ tipo: 'expulsar', de: 1, a: 3 })
    await esperar()
    expect(c.cierre).toBe('expulsado')
    a.enviar({ tipo: 'cerrar', de: 1 })
    await esperar()
    expect(b.cierre).toBe('cerrada')
  })
})
