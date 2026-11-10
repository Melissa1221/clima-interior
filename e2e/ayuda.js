// Utilidades de las pruebas e2e.
// El navegador de pruebas no tiene micrófono: se reemplaza la Web Speech API por una falsa que
// "escucha" lo que la prueba deja en window.__dictado, o falla si window.__micFalla es verdadero.
export async function microfonoFalso(page) {
  await page.addInitScript(() => {
    class ReconocimientoFalso {
      start() {
        setTimeout(() => {
          if (window.__micFalla) {
            this.onerror?.({ error: 'not-allowed' })
            this.onend?.()
            return
          }
          const t = window.__dictado ?? ''
          this.onresult?.({ results: [[{ transcript: t }]] })
        }, 200)
      }
      stop() { setTimeout(() => this.onend?.(), 50) }
      abort() {}
    }
    window.SpeechRecognition = ReconocimientoFalso
    window.webkitSpeechRecognition = ReconocimientoFalso
  })
}

// Texto de la reflexión, sin los botones que la acompañan (🔊, Más corto)
export const leerReflexion = (page) => page.locator('.reflexion').evaluate((el) => el.firstChild.textContent.trim())
export const contarFrases = (t) => t.split(/[.?!]/).filter((f) => f.replace(/[¿¡]/g, '').trim().length > 3).length

// Check-in escrito completo. Devuelve la reflexión que propuso la IA.
export async function checkinEscrito(page, { clima = 'Nublado', texto, elegir = [], masCorto = false }) {
  await page.getByRole('radio', { name: new RegExp(clima) }).click()
  await page.getByRole('button', { name: /Escribir/ }).first().click()
  await page.getByRole('textbox').fill(texto)
  await page.getByRole('button', { name: 'Listo' }).click()
  await page.getByText('Toca las nubes que sientes tuyas').waitFor()
  const reflexion = await leerReflexion(page)
  if (masCorto) await page.getByRole('button', { name: 'Más corto' }).click()
  for (const e of elegir) await page.getByRole('button', { name: new RegExp(`^${e}`) }).click()
  await page.getByRole('button', { name: /guardar/i }).click()
  await page.getByRole('button', { name: 'Hasta mañana' }).click()
  return reflexion
}

export const leerPerfil = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('clima-interior:perfil')))
