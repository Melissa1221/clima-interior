// Voz a texto con Web Speech API (RF-05). Si el navegador no la soporta o el micrófono
// está bloqueado, la interfaz ofrece escribir sin perder el clima elegido (RF-08, RF-10).
export function sttDisponible() {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
}

export function crearGrabacion({ alTexto, alError, alTerminar }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  const rec = new SR()
  rec.lang = 'es-PE'
  rec.continuous = true
  rec.interimResults = true
  let texto = ''
  rec.onresult = (e) => {
    texto = Array.from(e.results).map((r) => r[0].transcript).join(' ')
    alTexto(texto)
  }
  rec.onerror = (e) => alError(e.error)
  rec.onend = () => alTerminar(texto)
  return rec
}

// Texto a voz (RF-03, RF-09). Siempre va acompañado del texto visible en pantalla.
export function decir(texto) {
  if (!('speechSynthesis' in window)) return
  const u = new SpeechSynthesisUtterance(texto)
  u.lang = 'es-PE'
  speechSynthesis.cancel()
  speechSynthesis.speak(u)
}
