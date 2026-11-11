// Escenas del video: guion (narración y títulos) y las acciones que se graban en la app.
// Es la única fuente: de aquí salen los clips, las placas, el guion y los subtítulos.
import { readFileSync } from 'node:fs'

const estados = Object.values(JSON.parse(readFileSync(new URL('../../docs/trazabilidad-codigo.json', import.meta.url), 'utf8'))).map((m) => m.estado)
const n = (e) => estados.filter((x) => x === e).length

// Perfil de ejemplo con el primer uso hecho
export const PERFIL = (extra = {}) => JSON.stringify({
  primerUso: { completo: true, edad: 'adulto' },
  registros: [
    { fecha: '2026-10-06', hora: '21:30', clima: 'nublado', emocion_declarada: ['cansancio'], emocion_inferida: ['cansancio', 'frustración'], transcripcion: 'Día largo' },
    { fecha: '2026-10-07', hora: '21:10', clima: 'lluvia', emocion_declarada: ['tristeza', 'calma'], emocion_inferida: ['tristeza'], transcripcion: 'Llovió todo el día' },
  ],
  ...extra,
})

// Ayudantes: cada toque mueve el cursor con calma para que se vea qué se está tocando
const rol = (p, tipo, nombre) => p.getByRole(tipo, { name: nombre }).first()
async function tocar(p, loc, pausa = 900) {
  const caja = await loc.boundingBox()
  await p.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2, { steps: 22 })
  await p.waitForTimeout(250)
  await loc.click()
  await p.waitForTimeout(pausa)
}
export const boton = (p, nombre, pausa) => tocar(p, rol(p, 'button', nombre), pausa)
export const radio = (p, nombre, pausa) => tocar(p, rol(p, 'radio', nombre), pausa)
export const interruptor = (p, nombre, pausa) => tocar(p, rol(p, 'switch', nombre), pausa)
export const enlace = (p, texto, pausa) => tocar(p, p.getByText(texto).first(), pausa)
export const escribir = async (p, etiqueta, texto, pausa = 1200) => {
  const campo = p.getByLabel(etiqueta)
  await tocar(p, campo, 300)
  await p.keyboard.type(texto, { delay: 45 })
  await p.waitForTimeout(pausa)
}
export const pausa = (p, ms) => p.waitForTimeout(ms)

export const ESCENAS = [
  { id: '00', tipo: 'placa', titulo: 'Clima Interior', subtitulo: 'Diario emocional generativo', pie: 'Melissa Iman Noriega · Benjamin Seminario Serna · Ivett Mera Amado',
    narracion: 'Clima Interior es un diario emocional generativo: cuentas tu día en un minuto y lo ves convertido en un clima.', duracion: 7 },
  { id: '01', tipo: 'placa', titulo: 'El problema', subtitulo: 'A muchas personas les cuesta ponerle nombre a lo que sienten', pie: 'La IA propone, la persona decide',
    narracion: 'A muchas personas les cuesta ponerle nombre a lo que sienten, y los formularios y las encuestas no ayudan. Clima Interior propone otra cosa: elegir un clima, contar el día si quieres, y decidir tú qué palabras son tuyas. La IA propone, la persona decide.', duracion: 16 },
  { id: '02', tipo: 'app', titulo: 'Primer uso y consentimiento', subtitulo: 'Edad, cuatro permisos por separado, límites y ajustes iniciales', requisitos: ['RF-37', 'RNF-28', 'RF-32'], pantallas: 'S01 a S05',
    narracion: 'La primera vez, la app te recibe sin pedirte nada: puedes mirar la demo de treinta días o empezar. Primero, tu edad, porque las emociones son un dato sensible. Después, cuatro permisos por separado, todos apagados: nada sale de tu teléfono sin tu permiso. Luego, lo que la app es y lo que no es: no diagnostica ni reemplaza a una persona profesional. Y por último, ajustes de accesibilidad desde el primer minuto.',
    acciones: async (p) => {
      await pausa(p, 3500)
      await boton(p, 'Empezar', 1500)
      await radio(p, /18 años o más/, 3500)
      await boton(p, 'Continuar', 2200)
      await interruptor(p, /Transcribir mi voz en internet/, 1800)
      await interruptor(p, /Transcribir mi voz en internet/, 2200)
      await boton(p, 'Guardar mis decisiones', 4500)
      await boton(p, 'Entendido', 2500)
      await interruptor(p, /Modo neutral/, 2500)
      await boton(p, 'Listo', 3000)
    } },
  { id: '03', tipo: 'app', perfil: PERFIL(), titulo: 'Check-in por voz, emociones y reflexión', subtitulo: 'El clima primero; contarlo es opcional', requisitos: ['RF-40', 'RF-11', 'RF-06', 'RF-12', 'RNF-26'], pantallas: 'S06, S07, S08, S15, S17, S19, S27',
    narracion: 'Para el check-in eliges el clima de hoy. Con eso basta si no tienes ganas de hablar. Si quieres contarlo, un aviso te recuerda cómo cuidamos tu privacidad. Mientras dictas, ves el micrófono activo y puedes terminar con la voz. Revisas lo que entendimos y lo corriges antes de que lo lea la IA. Entonces la IA propone emociones, siempre con su etiqueta, y tú eliges las tuyas o marcas no sé. Al guardar, lo que propuso la IA queda aparte de lo que tú elegiste.',
    acciones: async (p) => {
      await pausa(p, 2500)
      await radio(p, /Nublado/, 2500)
      await boton(p, 'Contar mi día por voz', 5500)
      await boton(p, 'Empezar a grabar', 6000)
      await boton(p, 'A texto', 4500)
      await boton(p, 'Listo', 3500)
      await boton(p, 'cansancio', 1500)
      await boton(p, 'calma', 3500)
      await boton(p, 'Guardar mi día', 5000)
      await boton(p, 'Hasta mañana', 1500)
    } },
  { id: '04', tipo: 'app', perfil: PERFIL(), titulo: 'Seguridad: señales de riesgo', subtitulo: 'Un detector independiente del modelo, antes de cualquier reflexión', requisitos: ['RF-14', 'RF-15', 'RNF-25'], pantallas: 'S22',
    narracion: 'Antes de cualquier reflexión corre un detector de riesgo, independiente del modelo. Si aparece una señal, no se reflexiona: se muestran la Línea 113, el SAMU 106 y la PNP 105. La app no contacta a nadie.',
    acciones: async (p) => {
      await pausa(p, 1500)
      await radio(p, /Lluvia/, 1500)
      await boton(p, 'Escribir', 1500)
      await escribir(p, /Lo que entendí/, 'Hoy no quiero seguir', 1500)
      await boton(p, 'Listo', 7000)
    } },
  { id: '05', tipo: 'app', perfil: PERFIL(), titulo: 'Historial de 30 días', subtitulo: 'Sin rachas ni culpa: un día sin registro no es un fallo', requisitos: ['RF-39', 'RF-43', 'RNF-32'], pantallas: 'S30',
    narracion: 'El historial muestra treinta días simulados. Los días sin registro no se marcan como fallo: el cielo sigue despejado.',
    acciones: async (p) => { await pausa(p, 1500); await boton(p, 'Historial', 9000) } },
  { id: '06', tipo: 'app', perfil: PERFIL(), titulo: 'Perfil y privacidad', subtitulo: 'Cada dato y cada permiso se apagan por separado', requisitos: ['RF-23', 'RF-37', 'RNF-11'], pantallas: 'S40, S42',
    narracion: 'En Perfil ves lo que la app sabe de ti y apagas cada dato. En Privacidad cambias los permisos y eliges dónde se genera la reflexión: en tu dispositivo o en internet.',
    acciones: async (p) => {
      await pausa(p, 1200)
      await boton(p, 'Perfil', 3000)
      await interruptor(p, /Emociones que propuso la IA/, 2200)
      await interruptor(p, /Emociones que propuso la IA/, 1800)
      await boton(p, 'Privacidad', 3500)
      await radio(p, 'En internet', 2800)
      await radio(p, 'En este dispositivo', 3000)
    } },
  { id: '07', tipo: 'app', perfil: PERFIL(), titulo: 'Exportar resumen y eliminar datos', subtitulo: 'Se genera en el teléfono, sin lo que propuso la IA', requisitos: ['RF-38', 'RNF-24'], pantallas: 'S43, S44, S45',
    narracion: 'Puedes exportar un resumen para tu psicóloga o psicólogo: tú eliges qué incluir y se genera en tu teléfono. Nunca lleva lo que propuso la IA. Si no hay registros en esas fechas, no se genera un archivo vacío. Y puedes eliminar todos tus datos, escribiendo la palabra borrar.',
    acciones: async (p) => {
      await boton(p, 'Perfil', 1200); await boton(p, 'Privacidad', 1500)
      await enlace(p, 'Exportar resumen', 4000)
      await interruptor(p, /transcripciones/, 2200)
      await p.getByLabel('Desde').fill('2026-08-01'); await p.getByLabel('Hasta').fill('2026-08-05')
      await boton(p, 'Generar PDF', 5500)
      await boton(p, 'Salir por hoy', 1200); await boton(p, 'Perfil', 1200); await boton(p, 'Privacidad', 1200)
      await enlace(p, 'Eliminar todos mis datos', 3500)
      await escribir(p, /Escribe BORRAR/, 'BORRAR', 3500)
      await boton(p, 'Cancelar', 1500)
    } },
  { id: '08', tipo: 'app', perfil: PERFIL(), titulo: 'Accesibilidad', subtitulo: 'Movimiento reducido, capas, modo neutral y modo predecible', requisitos: ['RF-32', 'RF-33', 'RF-34', 'RF-36', 'RNF-07'], pantallas: 'S46 a S49',
    narracion: 'En Accesibilidad activas movimiento reducido y apagas cada capa del clima por separado. El modo neutral muestra una tormenta como un cielo neutro, sin sonidos intensos. El modo predecible hace una pregunta por pantalla. También hay descripción hablada, vibración y órdenes de voz.',
    acciones: async (p) => {
      await boton(p, 'Perfil', 1500); await boton(p, 'Accesibilidad', 3000)
      await boton(p, 'Viento', 1800); await boton(p, 'Lluvia', 1800)
      await interruptor(p, /Movimiento reducido/, 2500)
      await interruptor(p, /Modo neutral/, 2000)
      await boton(p, 'Inicio', 1500); await radio(p, /Tormenta/, 3500)
      await boton(p, 'Perfil', 1500); await boton(p, 'Accesibilidad', 1800)
      await interruptor(p, /Modo predecible/, 2000)
      await boton(p, 'Inicio', 1500); await radio(p, /Nublado/, 1800)
      await boton(p, 'Continuar', 5000)
    } },
  { id: '09', tipo: 'app', perfil: PERFIL(), sinConexion: true, titulo: 'PWA: instalar y usar sin conexión', subtitulo: 'La ayuda en crisis también funciona sin red', requisitos: ['RF-19', 'RF-20', 'RNF-20'], pantallas: 'S54, S55',
    narracion: 'Clima Interior es una PWA: se instala en la pantalla de inicio y funciona sin conexión, incluida la ayuda en crisis.',
    acciones: async (p) => {
      await pausa(p, 1500)
      await p.evaluate(() => navigator.serviceWorker.ready) // el service worker ya cacheó la app
      await p.reload(); await pausa(p, 1500)
      await p.context().setOffline(true)
      await p.reload(); await pausa(p, 2500)
      await radio(p, /Lluvia/, 2000); await boton(p, 'Escribir', 1500)
      await escribir(p, /Lo que entendí/, 'Hoy no quiero seguir', 1200)
      await boton(p, 'Listo', 6500)
    } },
  { id: '10', tipo: 'placa', titulo: 'Trazabilidad y arquitectura', subtitulo: `${n('implementado')} de ${estados.length} requerimientos implementados, ${n('parcial')} parciales y ${n('pendiente')} pendientes`, pie: 'Reporte generado desde el código · Diagramas C4 en docs/arquitectura.md',
    narracion: `Cada historia de usuario se enlaza con sus requerimientos, el código y las pruebas en un reporte que se genera solo. Hoy, ${n('implementado')} de ${estados.length} requerimientos están implementados, ${n('parcial')} parciales y ${n('pendiente')} pendientes, y el reporte dice cuáles faltan y por qué.`, duracion: 18 },
  { id: '11', tipo: 'placa', titulo: 'Gracias', subtitulo: 'Clima Interior · Grupo 8 · CC451 Interacción Humano-Computador', pie: 'github.com/Melissa1221/clima-interior',
    narracion: 'Gracias. El código, la arquitectura y el reporte de trazabilidad están en el repositorio del proyecto.', duracion: 8 },
]
