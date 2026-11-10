import { CLIMAS, climaColectivo, mensajeDeClima, nuevoId, seudonimo } from './mensaje.js'

// Lógica de una sala de clima compartido (RF-26 a RF-29), independiente de React y del transporte.
// Cada participante anuncia "hola"; quien lo recibe por primera vez responde con su propio "hola"
// y su clima, así quien entra tarde ve la sala completa sin que exista un servidor con estado.
export function crearSala({ codigo, creador = false, transporte, alCambio = () => {} }) {
  const yo = { id: nuevoId(), creador }
  const otros = new Map()
  const expulsados = new Set()
  let miClima = null
  let fin = null

  const enviar = (m) => !fin && transporte.enviar(m)
  const hola = () => enviar({ tipo: 'hola', de: yo.id, creador: yo.creador ? 1 : 0 })
  const esCreador = (id) => otros.get(id)?.creador

  function terminar(motivo) {
    if (fin) return
    fin = motivo
    transporte.cerrar()
    avisar()
  }

  function estado() {
    const lista = [...otros.values()].map((p) => ({ ...p, seudonimo: seudonimo(p.id) }))
    const climas = [miClima, ...lista.map((p) => p.clima)].filter(Boolean)
    return {
      codigo,
      transporte: transporte.tipo,
      yo: { ...yo, seudonimo: seudonimo(yo.id), clima: miClima },
      otros: lista,
      colectivo: climaColectivo(climas),
      fin,
    }
  }
  const avisar = () => alCambio(estado())

  transporte.alMensaje((m) => {
    if (fin || m.de === yo.id || expulsados.has(m.de)) return
    if (m.tipo === 'hola') {
      const nuevo = !otros.has(m.de)
      otros.set(m.de, { id: m.de, creador: m.creador === 1, clima: otros.get(m.de)?.clima ?? null })
      if (nuevo) {
        hola()
        if (miClima) enviar(mensajeDeClima(yo.id, miClima))
      }
    } else if (m.tipo === 'clima') {
      const p = otros.get(m.de) ?? { id: m.de, creador: false }
      otros.set(m.de, { ...p, clima: CLIMAS[m.c] })
    } else if (m.tipo === 'retirar') {
      if (otros.has(m.de)) otros.set(m.de, { ...otros.get(m.de), clima: null })
    } else if (m.tipo === 'adios') {
      otros.delete(m.de)
    } else if (m.tipo === 'expulsar' && esCreador(m.de)) {
      if (m.a === yo.id) return terminar('expulsado')
      otros.delete(m.a)
      expulsados.add(m.a)
    } else if (m.tipo === 'cerrar' && esCreador(m.de)) {
      return terminar('cerrada')
    }
    avisar()
  })

  // Si el servidor corta la conexión, la razón dice por qué (expulsado, cerrada, caducó)
  transporte.alCerrar((codigoWs, razon) => terminar(['expulsado', 'cerrada', 'caducó', 'llena'].includes(razon) ? razon : 'desconectado'))

  hola()
  queueMicrotask(avisar)

  return {
    estado,
    compartir(clima) {
      if (!CLIMAS.includes(clima)) return
      miClima = clima
      enviar(mensajeDeClima(yo.id, clima))
      avisar()
    },
    retirar() {
      miClima = null
      enviar({ tipo: 'retirar', de: yo.id })
      avisar()
    },
    expulsar(id) {
      if (!yo.creador || !otros.has(id)) return
      enviar({ tipo: 'expulsar', de: yo.id, a: id })
      otros.delete(id)
      expulsados.add(id)
      avisar()
    },
    cerrar() {
      if (!yo.creador) return
      enviar({ tipo: 'cerrar', de: yo.id })
      terminar('cerrada')
    },
    salir() {
      enviar({ tipo: 'adios', de: yo.id })
      terminar('salí')
    },
  }
}
