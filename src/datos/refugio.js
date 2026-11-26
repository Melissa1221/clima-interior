// Refugio: herramientas de autocuidado de 1 a 3 minutos para momentos de estrés (RF-42, HU-30).
// No es terapia ni diagnostica. Cada técnica lleva una línea honesta sobre su evidencia (validación 03 §5.3).
import { hayRiesgo } from './riesgo.js'

export const TECNICAS = {
  // Respiración lenta (~6 por minuto) y suspiro cíclico: metaanálisis de RCT (Fincham 2023) y un RCT (Balban 2023).
  // No se usa 4-7-8 ni la cuadrada: casi no tienen respaldo.
  respirar: { titulo: 'Respirar con la lluvia', duracion: '1 min', evidencia: 'Con respaldo de estudios.' },
  // 5-4-3-2-1: práctica clínica muy usada, SIN ensayos controlados. Se dice tal cual.
  tierra: { titulo: '5-4-3-2-1: volver al presente', duracion: '2 min', evidencia: 'Muy usada por psicólogos, con poca investigación formal.' },
  // Dividir la tarea: lo que más mencionan los propios estudiantes (01 §3); evidencia moderada contra la procrastinación.
  tarea: { titulo: 'Partir la tarea', duracion: '2 min', evidencia: 'Lo que más dicen los estudiantes que les sirve.' },
  // Autocompasión: metaanálisis de 27 RCT (Ferrari 2019), sobre programas completos, no el ejercicio suelto.
  amiga: { titulo: '¿Qué le dirías a alguien que quieres?', duracion: '2 min', evidencia: 'Autocompasión: con respaldo moderado.' },
}
export const ORDEN_TECNICAS = ['respirar', 'tierra', 'tarea', 'amiga']

// Ritmos de respiración, en segundos por fase. Lenta: 4 s inhalar + 6 s exhalar = 6 por minuto.
// Suspiro cíclico: dos inhalaciones seguidas por la nariz y una exhalación larga por la boca.
export const RITMOS = {
  lenta: { nombre: 'Lenta', fases: [['Inhala…', 4], ['Exhala…', 6]], ciclos: 6 },
  suspiro: { nombre: 'Suspiro cíclico', fases: [['Inhala…', 2], ['Un poco más…', 1], ['Exhala lento…', 6]], ciclos: 7 },
}
export const duracionRitmo = (id) => RITMOS[id].fases.reduce((s, [, seg]) => s + seg, 0) * RITMOS[id].ciclos

// Orden aproximado de los climas, de más pesado a más despejado. Sirve para comparar antes y después
// con palabras de clima; no es una escala clínica y nunca se muestra como número.
export const ESCALA = { tormenta: 0, lluvia: 1, niebla: 2, nublado: 3, soleado: 4 }
const POR_VALOR = Object.fromEntries(Object.entries(ESCALA).map(([k, v]) => [v, k]))
export const cambioDeClima = (antes, despues) => (ESCALA[despues] ?? 0) - (ESCALA[antes] ?? 0)
export const climaPromedio = (climas) => POR_VALOR[Math.round(climas.reduce((s, c) => s + ESCALA[c], 0) / climas.length)]

// Se ofrece (nunca se impone) tras un check-in pesado. Con riesgo, nunca: va la pantalla de crisis.
const EMOCIONES_DE_ESTRES = ['ansiedad', 'preocupación', 'frustración']
export function debeOfrecerRefugio({ clima, emociones = [], texto = '' }) {
  if (hayRiesgo(texto)) return false
  return clima === 'tormenta' || clima === 'lluvia' || [].concat(emociones ?? []).some((e) => EMOCIONES_DE_ESTRES.includes(e))
}

// Lo que ayudó, por técnica: veces, clima típico antes y después y cambio medio (en pasos de clima)
export function resumenRefugios(refugios = []) {
  const validos = refugios.filter((r) => TECNICAS[r.tecnica] && ESCALA[r.antes] !== undefined && ESCALA[r.despues] !== undefined)
  return ORDEN_TECNICAS.map((tecnica) => {
    const suyos = validos.filter((r) => r.tecnica === tecnica)
    if (!suyos.length) return null
    const cambio = suyos.reduce((s, r) => s + cambioDeClima(r.antes, r.despues), 0) / suyos.length
    return {
      tecnica, veces: suyos.length, cambio,
      antes: climaPromedio(suyos.map((r) => r.antes)), despues: climaPromedio(suyos.map((r) => r.despues)),
    }
  }).filter(Boolean)
}

// La técnica que más despejó el cielo, con al menos 2 usos y una mejora real. Sin datos suficientes, ninguna.
export function mejorTecnica(refugios) {
  const candidatas = resumenRefugios(refugios).filter((t) => t.veces >= 2 && t.cambio > 0)
  return candidatas.sort((a, b) => b.cambio - a.cambio || b.veces - a.veces)[0] ?? null
}

// La favorita va primero; el resto, en su orden de siempre
export const ordenarTecnicas = (favorita) =>
  favorita && TECNICAS[favorita] ? [favorita, ...ORDEN_TECNICAS.filter((t) => t !== favorita)] : ORDEN_TECNICAS

// Cómo se describe el cambio, sin números ni juicios. Si empeoró, se acompaña y se ofrece hablar con alguien.
export function fraseDeCambio(antes, despues) {
  const d = cambioDeClima(antes, despues)
  if (d > 0) return 'Tu cielo se despejó un poco. Bien por darte este momento.'
  if (d === 0) return 'Tu cielo sigue igual, y está bien: a veces un rato no alcanza. Puedes volver cuando quieras.'
  return 'Hoy se siente más pesado. Hablar con alguien de confianza puede ayudar; la Línea 113 (opción 5) también escucha, gratis.'
}

export function fraseResumen({ veces, cambio }) {
  const usos = veces === 1 ? '1 vez' : `${veces} veces`
  if (cambio >= 0.5) return `${usos} · suele despejar tu cielo`
  if (cambio > -0.5) return `${usos} · lo deja más o menos igual`
  return `${usos} · no parece ayudarte mucho`
}
