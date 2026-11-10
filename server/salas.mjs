// Relé de salas de clima compartido (RF-26 a RF-29, RNF-13 a RNF-15).
// No guarda diarios ni texto: solo reenvía mensajes numéricos entre quienes tienen el mismo código.
// Uso: npm run salas  (puerto 8787; cambia con PUERTO=xxxx)
import { WebSocketServer } from 'ws'
import { validarMensaje, codigoValido, HORAS_DE_VIDA } from '../src/salas/mensaje.js'

const PUERTO = Number(process.env.PUERTO || 8787)
const MAX_PARTICIPANTES = 30
const VIDA_MS = HORAS_DE_VIDA * 3600 * 1000

// codigo -> { conexiones: Set, creador: ws | null, expulsados: Set, caduca }
const salas = new Map()

function borrarSala(codigo, razon) {
  const sala = salas.get(codigo)
  if (!sala) return
  for (const ws of sala.conexiones) ws.close(4000, razon)
  clearTimeout(sala.reloj)
  salas.delete(codigo)
  console.log(`sala ${codigo.slice(0, 4)}… borrada (${razon})`)
}

const servidor = new WebSocketServer({ port: PUERTO })

servidor.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://x')
  const codigo = url.searchParams.get('sala')
  if (!codigoValido(codigo)) return ws.close(4001, 'código inválido')

  let sala = salas.get(codigo)
  const crear = url.searchParams.get('crear') === '1'
  if (!sala) {
    // Solo quien crea la sala puede abrirla; un código que no existe no se puede adivinar ni reabrir
    if (!crear) return ws.close(4004, 'caducó')
    sala = { conexiones: new Set(), creador: ws, expulsados: new Set(), caduca: Date.now() + VIDA_MS }
    sala.reloj = setTimeout(() => borrarSala(codigo, 'caducó'), VIDA_MS) // RNF-14: nada dura más de 24 h
    salas.set(codigo, sala)
  }
  if (sala.conexiones.size >= MAX_PARTICIPANTES) return ws.close(4003, 'llena')
  sala.conexiones.add(ws)
  ws.id = null

  ws.on('message', (datos) => {
    let m
    try {
      m = JSON.parse(datos)
    } catch {
      return
    }
    // Interceptor (RNF-13): todo lo que no sea el esquema numérico se descarta
    if (!validarMensaje(m)) return
    // El primer mensaje fija la identidad efímera de la conexión; nadie puede hablar por otro
    ws.id ??= m.de
    if (m.de !== ws.id || sala.expulsados.has(ws.id)) return
    // El servidor decide quién es creador, no el cliente
    if (m.tipo === 'hola') m.creador = sala.creador === ws ? 1 : 0
    if ((m.tipo === 'expulsar' || m.tipo === 'cerrar') && sala.creador !== ws) return

    const txt = JSON.stringify(m)
    for (const otro of sala.conexiones) if (otro !== ws && otro.readyState === otro.OPEN) otro.send(txt)

    if (m.tipo === 'expulsar') {
      sala.expulsados.add(m.a)
      for (const otro of sala.conexiones) if (otro.id === m.a) otro.close(4000, 'expulsado')
    }
    if (m.tipo === 'cerrar') borrarSala(codigo, 'cerrada')
  })

  ws.on('close', () => {
    sala.conexiones.delete(ws)
    if (ws.id && sala.conexiones.size) {
      const adios = JSON.stringify({ tipo: 'adios', de: ws.id })
      for (const otro of sala.conexiones) otro.send(adios)
    }
  })
})

console.log(`Relé de salas en ws://localhost:${PUERTO}`)
