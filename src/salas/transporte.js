import { validarMensaje } from './mensaje.js'

// Capa de transporte de las salas. Igual que la capa LLM, la interfaz no sabe cuál se usa:
//  - "servidor": WebSocket al relé de server/salas.mjs (varios dispositivos). Se activa con VITE_SALAS_URL.
//  - "local": BroadcastChannel entre pestañas del mismo navegador (demo sin servidor).
// Ambos validan cada mensaje al enviar y al recibir (RNF-13): lo que no cumple el esquema se descarta.

export function transporteLocal(codigo) {
  const canal = new BroadcastChannel(`clima-interior:sala:${codigo}`)
  let alMensaje = () => {}
  canal.onmessage = (e) => validarMensaje(e.data) && alMensaje(e.data)
  return {
    tipo: 'local',
    enviar: (m) => validarMensaje(m) && canal.postMessage(m),
    alMensaje: (cb) => { alMensaje = cb },
    alCerrar: () => {},
    cerrar: () => canal.close(),
  }
}

export function transporteServidor(codigo, url, { crear = false } = {}) {
  const ws = new WebSocket(`${url}?sala=${encodeURIComponent(codigo)}${crear ? '&crear=1' : ''}`)
  const cola = []
  let alMensaje = () => {}
  let alCerrar = () => {}
  ws.onopen = () => { while (cola.length) ws.send(cola.shift()) }
  ws.onmessage = (e) => {
    try {
      const m = JSON.parse(e.data)
      if (validarMensaje(m)) alMensaje(m)
    } catch {
      // mensaje roto: se ignora
    }
  }
  ws.onclose = (e) => alCerrar(e.code, e.reason)
  return {
    tipo: 'servidor',
    enviar(m) {
      if (!validarMensaje(m)) return false
      const txt = JSON.stringify(m)
      if (ws.readyState === WebSocket.OPEN) ws.send(txt)
      else cola.push(txt)
      return true
    },
    alMensaje: (cb) => { alMensaje = cb },
    alCerrar: (cb) => { alCerrar = cb },
    cerrar: () => ws.close(),
  }
}

export function crearTransporte(codigo, opciones) {
  const url = import.meta.env?.VITE_SALAS_URL
  return url ? transporteServidor(codigo, url, opciones) : transporteLocal(codigo)
}
