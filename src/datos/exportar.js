// Resumen voluntario para la psicóloga o el psicólogo (S43, S44). Se arma en el teléfono y la persona decide
// con quién compartirlo. Nunca incluye lo que propuso la IA ni frases clínicas (RF-30, RNF-24).
import { CLIMAS, DESCRIPCION } from './climas.js'

export const ETIQUETA_CLIMA = Object.fromEntries(CLIMAS.map((c) => [c.id, c.etiqueta]))

const aFecha = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })
export { aFecha as fechaLarga }

export function registrosEnRango(registros, desde, hasta) {
  return registros.filter((r) => r.fecha >= desde && r.fecha <= hasta).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
}

// Rango por defecto: del primer al último registro, o los últimos 30 días si aún no hay ninguno
export function rangoPorDefecto(registros, hoy = new Date()) {
  const fechas = registros.map((r) => r.fecha).sort()
  if (fechas.length) return { desde: fechas[0], hasta: fechas.at(-1) }
  const fin = hoy.toISOString().slice(0, 10)
  const ini = new Date(hoy)
  ini.setDate(ini.getDate() - 30)
  return { desde: ini.toISOString().slice(0, 10), hasta: fin }
}

// `incluir` elige qué se agrega: clima, emociones, palabras, transcripciones
export function construirResumen(registros, { desde, hasta }, incluir) {
  const lineas = ['Resumen de Clima Interior', `Del ${aFecha(desde)} al ${aFecha(hasta)}`, `${registros.length} ${registros.length === 1 ? 'registro' : 'registros'}`, '']
  for (const r of registros) {
    lineas.push(`${aFecha(r.fecha)}, ${r.hora}`)
    if (incluir.clima && r.clima) lineas.push(`  Clima: ${ETIQUETA_CLIMA[r.clima] ?? r.clima}. ${DESCRIPCION[r.clima] ?? ''}`.trim())
    if (incluir.emociones) lineas.push(`  Emociones que eligió: ${r.emocion_declarada?.join(', ') || 'no sé'}`)
    if (incluir.palabras && r.palabras?.length) lineas.push(`  Sus tres palabras: ${r.palabras.join(', ')}`)
    if (incluir.transcripciones && r.transcripcion) lineas.push(`  Lo que contó: «${r.transcripcion}»`)
    lineas.push('')
  }
  lineas.push('Este resumen lo generó la persona desde su teléfono. No incluye propuestas de la IA, interpretaciones ni diagnósticos.')
  return lineas
}

// PDF mínimo sin dependencias: A4, Helvetica 11 pt, varias páginas. Los caracteres fuera de Latin-1 pasan a «?».
export function textoAPdf(lineas) {
  const ANCHO = 88, POR_PAGINA = 52
  const envueltas = lineas.flatMap((l) => {
    const salida = []
    let resto = l
    while (resto.length > ANCHO) {
      let corte = resto.lastIndexOf(' ', ANCHO)
      if (corte < 20) corte = ANCHO
      salida.push(resto.slice(0, corte))
      resto = '    ' + resto.slice(corte).trimStart()
    }
    salida.push(resto)
    return salida
  })
  const paginas = []
  for (let i = 0; i < envueltas.length; i += POR_PAGINA) paginas.push(envueltas.slice(i, i + POR_PAGINA))
  if (!paginas.length) paginas.push([''])

  const esc = (t) => t.replace(/[\\()]/g, '\\$&').replace(/[^\x20-\x7e\xa1-\xff]/g, (c) => (c.charCodeAt(0) < 256 ? c : '?'))
  const objetos = [] // cuerpos de objeto; el número es posición + 1
  const nuevo = (cuerpo) => objetos.push(cuerpo)
  nuevo('<< /Type /Catalog /Pages 2 0 R >>')
  nuevo(`<< /Type /Pages /Kids [${paginas.map((_, i) => `${4 + i * 2} 0 R`).join(' ')}] /Count ${paginas.length} >>`)
  nuevo('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  paginas.forEach((lineasPagina, i) => {
    const flujo = `BT /F1 11 Tf 14 TL 50 800 Td ${lineasPagina.map((l) => `(${esc(l)}) Tj T*`).join(' ')} ET`
    nuevo(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`)
    nuevo(`<< /Length ${flujo.length} >>\nstream\n${flujo}\nendstream`)
  })

  let pdf = '%PDF-1.4\n'
  const offsets = objetos.map((cuerpo, i) => {
    const pos = pdf.length
    pdf += `${i + 1} 0 obj\n${cuerpo}\nendobj\n`
    return pos
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  const bytes = new Uint8Array(pdf.length)
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff
  return bytes
}
