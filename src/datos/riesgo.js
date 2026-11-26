// Detector de riesgo independiente del LLM (RF-14). Corre ANTES de pedir cualquier reflexión.
// Esta versión usa reglas; la suite de frases sintéticas de riesgo está en la matriz (RNF-25).
const SENALES = [
  /no quiero (seguir|vivir)/, /quitarme la vida/, /hacerme (dano|algo)/, /suicid/, /desaparecer para siempre/,
  /quiero morir/, /me quiero matar/, /matarme/, /no vale la pena (vivir|seguir)/, /acabar con todo/,
  // Una crisis puede empezar con «me fue mal en un examen» y terminar en «no sé si puedo seguir» (validación 01, §1.11a).
  // Ante la duda se muestran recursos de más: un falso positivo cuesta menos que un falso negativo.
  /no se si (quiero|puedo) seguir/, /no (quiero|puedo) seguir viviendo/, /sin ganas de vivir/, /no tiene sentido (vivir|seguir)/,
]

// Sin tildes y en minúsculas, para que "daño" y "dano" cuenten igual
export function hayRiesgo(texto) {
  const t = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return SENALES.some((re) => re.test(t))
}

export const RECURSOS = [
  { nombre: 'Línea 113, opción 5', detalle: 'Salud mental (MINSA), las 24 horas', tel: '113' },
  { nombre: 'SAMU 106', detalle: 'Emergencia médica', tel: '106' },
  { nombre: 'PNP 105', detalle: 'Si hay violencia o peligro inmediato', tel: '105' },
  // Servicio de Orientación Psicopedagógica y Psicológica (DBU-OCBU). Contacto por confirmar: el portal solo da la central.
  { nombre: 'Bienestar Universitario UNI', detalle: 'Orientación psicológica gratuita · central (01) 481-1070', tel: '014811070' },
]
