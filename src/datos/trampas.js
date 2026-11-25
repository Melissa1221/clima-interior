// Trampas de pensamiento (validación UX, 00-síntesis §6). La app NO afirma la trampa: la propone como pregunta
// y la persona decide si le suena. Ni dos personas se ponen de acuerdo al clasificarlas (34 %), así que esto
// es una hipótesis para conversar, nunca un diagnóstico.
//
// Este detector por reglas lo usan el proveedor simulado y el respaldo local; con un LLM real, el modelo
// devuelve `trampas` en el mismo formato y se valida contra la misma lista cerrada (src/llm/contrato.js).
import { hayRiesgo } from './riesgo.js'

// Lista cerrada. Cada trampa: cómo se nombra, la hipótesis en forma de pregunta y UNA pregunta para mirarla.
// Se habla del pensamiento, no de la persona, y sin dar por hecho el género (03-evidencia §5.1).
export const TRAMPAS = {
  catastrofizar: {
    nombre: 'Imaginar lo peor',
    hipotesis: '¿Puede ser que tu mente esté imaginando lo peor como si ya fuera seguro?',
    pregunta: '¿Qué es lo peor que podría pasar, qué es lo mejor y qué es lo más probable?',
  },
  todo_o_nada: {
    nombre: 'Todo o nada',
    hipotesis: '¿Puede ser que lo estés viendo como todo o nada, sin puntos medios?',
    pregunta: '¿Cómo se vería un resultado «bastante bien», aunque no sea perfecto?',
  },
  adivinar_futuro: {
    nombre: 'Adivinar el futuro',
    hipotesis: '¿Puede ser que tu mente esté adivinando el futuro?',
    pregunta: '¿Qué pruebas tienes de que va a pasar así? ¿Qué es lo más probable?',
  },
  leer_mente: {
    nombre: 'Leer la mente',
    hipotesis: '¿Puede ser que estés suponiendo lo que otra persona piensa?',
    pregunta: '¿Te lo dijo, o lo estás imaginando? ¿Qué otra cosa podría estar pensando?',
  },
  generalizar: {
    nombre: 'Generalizar',
    hipotesis: '¿Puede ser que una vez difícil se esté sintiendo como «siempre»?',
    pregunta: '¿Recuerdas alguna vez en que no fue así?',
  },
  etiquetarse: {
    nombre: 'Ponerse una etiqueta',
    hipotesis: '¿Puede ser que un momento difícil se esté convirtiendo en una etiqueta sobre ti?',
    pregunta: '¿Lo que pasó habla de ese momento, o de quién eres en todo?',
  },
  deberia: {
    nombre: 'Los «debería»',
    hipotesis: '¿Puede ser que te estés exigiendo un «debería» muy duro?',
    pregunta: 'Si fueras más amable contigo, ¿qué te pedirías hoy?',
  },
  filtro_mental: {
    nombre: 'Mirar solo lo que falta',
    hipotesis: '¿Puede ser que estés mirando solo lo que salió mal o lo que les sale a otros?',
    pregunta: '¿Qué sí salió bien, aunque sea algo pequeño?',
  },
  razonamiento_emocional: {
    nombre: 'Sentirlo no lo hace cierto',
    hipotesis: '¿Puede ser que, como se siente así, parezca que es verdad?',
    pregunta: 'Aparte de lo que sientes, ¿qué dicen los hechos?',
  },
  personalizar: {
    nombre: 'Cargar con toda la culpa',
    hipotesis: '¿Puede ser que estés cargando con más culpa de la que te toca?',
    pregunta: '¿Qué otras cosas influyeron, además de ti?',
  },
}

export const TIPOS_TRAMPA = Object.keys(TRAMPAS)

export const sinTildes = (t) => String(t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// Patrones en español (con formas peruanas: «jalar», «me jalan», «me botan»). Se buscan sin tildes.
// El orden importa: si una frase calza en dos, gana la primera (p. ej. «siento que igual voy a desaprobar»
// es adivinar el futuro antes que razonamiento emocional). Solo frases con forma de trampa: «siempre» o
// «todo» sueltos no cuentan, para no ver trampas en todo (contraejemplos realistas, 01 §1.11d).
const PATRONES = [
  ['catastrofizar', [
    /se (acabo|acaba|va a acabar|termino) (mi|la) (carrera|vida|u\b|universidad)/, /se derrumba todo/,
    /(mi vida|todo) (se )?(va a )?(arruin|destru|acab)/, /(es|sera) el fin( del mundo)?/,
    /me (van a )?(botar|botan|expulsar|expulsan|sacar|sacan) de la (u\b|universidad|carrera)/,
    /mis (papas|padres|viejos) me (matan|van a matar)/, /nunca voy a (egresar|terminar la carrera|acabar la carrera)/,
    /(todo|mi carrera) (esta|se fue) (perdid|arruinad)/,
  ]],
  ['adivinar_futuro', [
    /seguro (que )?(voy a|me va a|me van a|va a|me) (jalar|jalan|desaprobar|reprobar|suspender|ir mal|salir mal|fallar|quedar en blanco)/,
    /(voy a|me van a) (jalar|desaprobar|reprobar|suspender)/, /igual(mente)? voy a (desaprobar|jalar|fallar|reprobar)/,
    /no voy a (poder|aprobar|pasar|recordar|llegar|acordarme|terminar a tiempo)/, /no llego a (estudiar|terminar|acabar)/,
    /me va a ir (mal|horrible|fatal|pesimo)/, /me (voy a quedar|quedare) en blanco/,
    /ya se (que|lo que) (va a pasar|me va a ir)/, /se (que|lo) (me fue|me va a ir) (horrible|fatal|pesimo|terrible)/,
  ]],
  ['todo_o_nada', [
    /tengo que saber(lo)? todo/, /si no (lo )?se todo/, /si no (es|sale|queda) perfect/, /(o|si no) saco (20|veinte)/,
    /la cague (total|por completo|completamente)/, /todo o nada/, /(fue|es) un desastre total/,
  ]],
  ['etiquetarse', [
    /soy (un |una )?(persona )?(fracas|desastre|inutil|incapaz|idiota|tont[oa]|burr[oa]|brut[oa]|lent[oa]|un asco|lo peor)/,
    /no sirvo (para|de)/, /me siento (un |una )?(inutil|fracasad[oa]|incapaz)/, /no soy (suficiente|lo suficientemente)/,
    /no soy (buen[oa]|capaz) (para|en)/, /hay algo mal (en mi|conmigo)/,
  ]],
  ['leer_mente', [
    /(piensa|piensan|creen|cree|dira|diran) que soy/, /(va|van) a pensar que/,
    /(le|les) (va|van) a (parecer|resultar) (aburrid|tont|mal)/, /nadie (me|lo|la|nos) entiende/,
    /(el|la) (profe|profesor|profesora|jurado|asesor|asesora) (me )?(odia|tiene bronca|me tiene cruzad)/,
    /todos (me )?(miran|juzgan|se van a reir)/, /se (van a dar|dan|daran) cuenta de que no se/,
  ]],
  ['generalizar', [
    /todo me sale mal/, /nada me sale (bien)?/, /siempre (me va mal|me sale mal|fallo|me equivoco|arruino|la malogro|me pasa lo mismo)/,
    /nunca (me sale|hago nada bien|me va bien|entiendo nada|aprendo)/, /(lo intento|intento) y (lo intento y )?(sigo|siempre) (fallando|fallo)/,
    /(cada vez|siempre) que (doy|tengo) (un )?examen/,
  ]],
  ['deberia', [
    /(deberia|tendria que|tengo que) (poder|saberlo|saber hacerlo|haberlo|estar mejor|ser capaz|entenderlo ya)/,
    /no deberia (sentirme|estar) asi/, /me siento culpable (si|por|cuando) (no )?(descanso|salgo|hago algo|no estudio)/,
    /si no estudio (me siento|siento) culpa/,
  ]],
  ['filtro_mental', [
    /(solo|solamente) yo (cometo|me equivoco|fallo|no entiendo|no puedo)/, /a todo el mundo (le va bien|no le (resulta|cuesta))/,
    /(todos|los demas) (entienden|terminan|aprueban|pueden) (menos|y) yo (no)?/, /podria haber sacado mas/,
    /(aprobe|saque [0-9]+) pero (igual|podria|debi)/,
  ]],
  ['razonamiento_emocional', [
    /(siento|me siento) que no se (nada|lo que hago)/, /sensacion de que no (se|sabe|sabia)/,
    /(siento|me siento) (como )?(un |una )?impostor/, /siento que no (merezco|valgo)/, /si lo siento asi (es|debe)/,
  ]],
  ['personalizar', [
    /(es|fue|sera) (toda )?(por )?mi culpa/, /por mi culpa/, /culpa mia/, /(los|las) (decepcione|voy a decepcionar)/,
    /decepcionar a mi (familia|mama|papa|padres)/,
  ]],
]

// La cláusula del relato donde aparece la trampa, con las palabras de la persona (para citarla tal cual).
function citar(original, inicio, fin) {
  const corte = /[.;!?¡¿\n]|,\s|\s(pero|aunque|porque)\s/g
  let desde = 0
  let hasta = original.length
  for (const m of original.matchAll(corte)) {
    const p = m.index
    if (p + m[0].length <= inicio) desde = p + m[0].length
    else if (p >= fin) { hasta = p; break }
  }
  let frase = original.slice(desde, hasta).trim().replace(/^[«"'(\s]+|[»"')\s]+$/g, '')
  if (frase.length > 90) frase = original.slice(inicio, fin).trim()
  return frase
}

// Devuelve hasta `max` trampas distintas, en el orden en que aparecen en el relato.
// Si hay riesgo, devuelve [] siempre: la crisis va antes que todo (00-síntesis §8).
export function detectarTrampas(texto, { max = 2 } = {}) {
  if (!texto || hayRiesgo(texto)) return []
  // sinTildes conserva el largo cuando el texto ya viene en NFC (lo normal en teclados y dictado)
  const original = String(texto).normalize('NFC')
  const t = sinTildes(original)
  const mismoLargo = t.length === original.length
  const hallazgos = []
  for (const [tipo, patrones] of PATRONES) {
    for (const re of patrones) {
      const m = re.exec(t)
      if (!m) continue
      const fuente = mismoLargo ? original : t
      hallazgos.push({ tipo, frase: citar(fuente, m.index, m.index + m[0].length), pos: m.index })
      break
    }
  }
  return hallazgos.sort((a, b) => a.pos - b.pos).slice(0, max).map(({ tipo, frase }) => ({ tipo, frase }))
}

// ¿La frase que trae la IA está de verdad en el relato? Solo se cita lo que la persona dijo.
export const estaEnElRelato = (frase, texto) => {
  const f = sinTildes(frase).replace(/[«»"'.,;:!?¡¿]/g, '').replace(/\s+/g, ' ').trim()
  return f.length >= 4 && sinTildes(texto).replace(/[«»"'.,;:!?¡¿]/g, '').replace(/\s+/g, ' ').includes(f)
}

// Qué trampa mostrar en la tarjeta: como máximo UNA por check-in, nunca con riesgo, y nunca una que la
// persona ya descartó varias veces (si la categoría de aprendizaje está activa).
export function trampaParaMostrar(texto, trampas = [], silenciadas = []) {
  if (!texto || hayRiesgo(texto)) return null
  return trampas.find((t) => TRAMPAS[t.tipo] && !silenciadas.includes(t.tipo)) ?? null
}
