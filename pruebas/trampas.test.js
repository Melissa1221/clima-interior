// Casos de prueba tomados de la validación UX (cl-uni/docs/2026-2/cursos/ihc/proyecto/validacion/01-voces-estudiantes.md §1).
// Las frases en español son literales de foros y tesis; las peruanas («jalar», «me botan») son las que pidió el equipo.
import { describe, it, expect } from 'vitest'
import { detectarTrampas, estaEnElRelato, trampaParaMostrar, TIPOS_TRAMPA, TRAMPAS } from '../src/datos/trampas.js'

const tipo = (t) => detectarTrampas(t)[0]?.tipo

describe('detectarTrampas: frases de estudiantes (01 §1)', () => {
  it.each([
    // §1.1 catastrofización
    ['#4', 'siento que se derrumba todo, que ya está', 'catastrofizar'],
    // §1.2 adivinación: #8 es el mejor caso, la evidencia la contradice y aun así lo cree
    ['#8', 'siento que no puedo, si bien soy consciente de que te acabo de decir que nunca desaprobé un final, siento que igualmente voy a desaprobar', 'adivinar_futuro'],
    ['#9', 'Los pensamientos que me surgen es que no voy a recordar lo que estudié, y me inhibo', 'adivinar_futuro'],
    ['#11', 'Pienso que no llego a estudiar todo y las cosas comienzan a salirme mal.', 'adivinar_futuro'],
    // §1.3 todo o nada
    ['#15', 'Yo me estudio todo, tengo que saber todo', 'todo_o_nada'],
    ['#16', 'siempre estudio toda la materia, si no se todo, prefiero esperar otra fecha', 'todo_o_nada'],
    // §1.4 etiquetado
    ['#20', 'alomejor no sirvo para esta carrera', 'etiquetarse'],
    ['#21', 'me siento inutil en general', 'etiquetarse'],
    ['#25', 'siento que soy una persona fracasada y que no aporto', 'etiquetarse'],
    // §1.5 lectura de mente
    ['#26', 'me parece como que le va a resultar aburrido', 'leer_mente'],
    ['#29', 'uno se pone susceptible y entonces siente que nadie lo entiende', 'leer_mente'],
    // §1.7 filtro mental
    ['#19', 'llegaste a sacar un 4 y decís ¡la pucha, podría haber sacado más!', 'filtro_mental'],
    ['#38', 'a todo el mundo no le resulta muy complicada la carrera', 'filtro_mental'],
    // §1.9 razonamiento emocional
    ['#46', 'Uno siempre tiene la sensación de que no sabe todo, de que le falta algo', 'razonamiento_emocional'],
    // §1.10 personalización
    ['#50', 'soy consciente de que si suspendo y es culpa mía y de nadie más', 'personalizar'],
    ['#51', 'miedo de decepcionar a mi familia si expreso que no soy feliz con la carrera que estudio', 'personalizar'],
  ])('%s → %s', (_, frase, esperado) => expect(tipo(frase)).toBe(esperado))
})

describe('detectarTrampas: formas peruanas', () => {
  it.each([
    ['seguro que voy a jalar el parcial de IA', 'adivinar_futuro'],
    ['ya fue, seguro me jalan en el final', 'adivinar_futuro'],
    ['si me jalan otra vez se acabó mi carrera', 'catastrofizar'],
    ['me van a botar de la u', 'catastrofizar'],
    ['soy un fracaso, no entiendo nada', 'etiquetarse'],
    ['soy un desastre en las exposiciones', 'etiquetarse'],
    ['debería poder con todo esto sola', 'deberia'],
    ['el profe piensa que soy floja', 'leer_mente'],
    ['todo me sale mal esta semana', 'generalizar'],
    ['el grupo jaló por mi culpa', 'personalizar'],
  ])('«%s» → %s', (frase, esperado) => expect(tipo(frase)).toBe(esperado))
})

describe('detectarTrampas: sin falsos positivos (01 §1.11d)', () => {
  it.each([
    'me pongo muy nervioso al rendir pruebas y a pesar de muchas entenderlas no me va bien porque me preocupa el tiempo',
    'pensé que en las dos ultimas semanas de exámenes podría estudiar todo y aprobar con nota decente',
    'Hoy dormí poco y estuve cansada por el examen',
    'siempre estudio en la biblioteca con mis amigas',
    'me fue como el ajo en el parcial, pero el viernes hay sustitutorio',
    'Día tranquilo con música',
    '',
  ])('«%s» → ninguna', (frase) => expect(detectarTrampas(frase)).toEqual([]))
})

describe('detectarTrampas: forma de la respuesta', () => {
  it('cita las palabras de la persona, no una paráfrasis', () => {
    const [t] = detectarTrampas('Estudié toda la noche. Seguro que voy a jalar, igual que el ciclo pasado.')
    expect(t).toEqual({ tipo: 'adivinar_futuro', frase: 'Seguro que voy a jalar' })
  })
  it('conserva las tildes del relato en la cita', () => {
    expect(detectarTrampas('creo que se acabó mi carrera')[0].frase).toBe('creo que se acabó mi carrera')
  })
  it('devuelve como máximo 2, en el orden del relato y sin repetir tipo', () => {
    const r = detectarTrampas('soy un fracaso. todo me sale mal. seguro que voy a jalar. soy un desastre')
    expect(r.map((x) => x.tipo)).toEqual(['etiquetarse', 'generalizar'])
  })
  it('todas las trampas tienen nombre, hipótesis en pregunta y una pregunta para mirarla', () => {
    expect(TIPOS_TRAMPA).toHaveLength(10)
    for (const t of Object.values(TRAMPAS)) {
      expect(t.hipotesis).toMatch(/^¿Puede ser que.+\?$/)
      expect(t.pregunta).toMatch(/\?$/)
      // nunca un veredicto ni «piensa positivo»
      expect(`${t.hipotesis} ${t.pregunta}`).not.toMatch(/positiv|irracional|distorsi|tienes ansiedad/i)
    }
  })
})

describe('la crisis va antes que las trampas (00-síntesis §8)', () => {
  const crisis = 'tuve un examen horrible, seguro que voy a jalar y no sé si quiero seguir viviendo'
  it('con riesgo, el detector no devuelve trampas', () => expect(detectarTrampas(crisis)).toEqual([]))
  it('con riesgo, no se muestra tarjeta aunque la IA haya traído una trampa', () => {
    expect(trampaParaMostrar(crisis, [{ tipo: 'adivinar_futuro', frase: 'seguro que voy a jalar' }])).toBeNull()
  })
  it('sin riesgo, se muestra una sola y se saltan las silenciadas', () => {
    const trampas = [{ tipo: 'etiquetarse', frase: 'soy un fracaso' }, { tipo: 'generalizar', frase: 'todo me sale mal' }]
    expect(trampaParaMostrar('soy un fracaso, todo me sale mal', trampas)).toEqual(trampas[0])
    expect(trampaParaMostrar('soy un fracaso, todo me sale mal', trampas, ['etiquetarse'])).toEqual(trampas[1])
  })
})

describe('estaEnElRelato', () => {
  it('acepta la frase aunque cambien tildes y mayúsculas', () => expect(estaEnElRelato('Seguro que voy a jalar', 'seguro que voy a jalar el parcial')).toBe(true))
  it('rechaza paráfrasis que la persona no dijo', () => expect(estaEnElRelato('voy a fracasar en todo', 'seguro que voy a jalar')).toBe(false))
})
