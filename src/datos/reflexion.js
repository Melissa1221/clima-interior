// Reflexión sin IA, menos genérica (M11): retoma de qué habló la persona y solo agradece «este minuto»
// si de verdad hubo un respiro. «Más corto» conserva la frase que más dice, no la primera.

// De qué habló, en palabras de un estudiante (para retomarlo en la reflexión)
const TEMAS = [
  [/\bparcial(es)?\b|\bpc\s?\d?\b|pr[aá]ctica calificada/, 'el parcial'], [/ex[aá]men/, 'el examen'],
  [/entrega|trabajo grupal|informe|tarea/, 'las entregas'], [/tr[aá]fico|combi|\bbus\b|metropolitano/, 'el tráfico'],
  [/mam[aá]|pap[aá]|herman[ao]|familia/, 'tu familia'], [/amig[ao]s?|pata/, 'tus amigos'], [/clases?|curso/, 'las clases'],
]
export function temaDe(texto = '') {
  const t = texto.toLowerCase()
  return TEMAS.find(([re]) => re.test(t))?.[1] ?? null
}
// «lo del parcial», «lo de las entregas»
const loDe = (tema) => (tema.startsWith('el ') ? `lo del ${tema.slice(3)}` : `lo de ${tema}`)

export function reflexionDeReglas(emocion, { texto = '', respiroHoy = false } = {}) {
  const tema = temaDe(texto)
  const de = tema ? loDe(tema) : null
  const R = {
    cansancio: `Suena a un día que pidió mucha energía${tema ? `, con ${tema} encima` : ''}. ¿Hubo algún momento en que pudiste descansar un poco?`,
    frustración: `Algunas cosas no salieron como querías${tema ? `, sobre todo con ${tema}` : ''}. ¿Qué parte sí dependía de ti?`,
    ansiedad: `Se nota que ${de ?? 'algo'} te tuvo en tensión. ¿Qué te ayudaría a soltarlo un poco esta noche?`,
    tristeza: `Fue un día pesado${tema ? `, y ${de} pesó` : ''}. No hace falta resolverlo hoy; ya ponerle nombre ayuda.`,
    preocupación: `${de ? `${de[0].toUpperCase()}${de.slice(1)}` : 'Algo'} te quedó dando vueltas. ¿Es algo que puedes dejar anotado para mañana?`,
    alivio: 'Al final algo se acomodó. ¿Qué fue lo que más te alivió?',
    gratitud: `Hubo algo o alguien que valoraste hoy${tema === 'tu familia' || tema === 'tus amigos' ? `, quizá ${tema}` : ''}. Vale la pena recordarlo.`,
    alegría: `Hubo algo bueno en tu día${tema ? `, con ${tema}` : ''}. ¿Qué lo hizo especial?`,
    calma: 'Tu día tuvo momentos tranquilos. ¿Qué los hizo posibles?',
  }
  if (R[emocion]) return R[emocion]
  if (respiroHoy) return 'Gracias por darte este minuto. Ponerle nombre a lo que sientes ya es un paso.'
  return tema ? `Gracias por contarme ${loDe(tema)}. Ponerle nombre a lo que sientes ya es un paso.`
    : 'Gracias por contarlo. Ponerle nombre a lo que sientes ya es un paso.'
}

const GENERICAS = /gracias por|ya es un paso|vale la pena|no pasa nada|está bien/i
const palabras = (t) => new Set(t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-zñ]{5,}/g) ?? [])

// La frase que más dice: la que retoma palabras del relato y no es de cortesía. Empate: la primera.
export function fraseMasSignificativa(reflexion, relato = '') {
  const frases = reflexion.match(/[^.?!]+[.?!]+/g)?.map((f) => f.trim()) ?? [reflexion]
  if (frases.length < 2) return reflexion
  const delRelato = palabras(relato)
  const puntaje = (f) => [...palabras(f)].filter((p) => delRelato.has(p)).length * 3 - (GENERICAS.test(f) ? 4 : 0) + f.length / 100
  return frases.reduce((mejor, f) => (puntaje(f) > puntaje(mejor) ? f : mejor), frases[0])
}
