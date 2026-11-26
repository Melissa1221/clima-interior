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
      // Dictado en el dispositivo: sin esto la app pide el permiso de transcribir en internet
      get processLocally() { return this._local ?? false }
      set processLocally(v) { this._local = v }
    }
    window.SpeechRecognition = ReconocimientoFalso
    window.webkitSpeechRecognition = ReconocimientoFalso
  })
}

// Texto de la reflexión de la IA (va en la burbuja de Garúa, al guardar el día)
export const leerReflexion = (page) => page.locator('.reflexion').evaluate((el) => el.textContent.trim())
export const contarFrases = (t) => t.split(/[.?!]/).filter((f) => f.replace(/[¿¡]/g, '').trim().length > 3).length

// Check-in escrito completo. Devuelve la reflexión que propuso la IA (se lee al guardar el día).
export async function checkinEscrito(page, { clima = 'Nublado', texto, elegir = [], masCorto = false }) {
  await page.getByRole('radio', { name: new RegExp(clima) }).click()
  await page.getByRole('button', { name: /Escribir/ }).first().click()
  await page.getByRole('textbox').fill(texto)
  await page.getByRole('button', { name: 'Listo' }).click()
  await page.getByText('Toca las nubes que sientes tuyas').waitFor()
  for (const e of elegir) await page.getByRole('button', { name: new RegExp(`^${e}`) }).click()
  await page.getByRole('button', { name: elegir.length ? 'Guardar mi día' : 'No sé, guardar igual' }).click()
  await page.getByRole('heading', { name: 'Tu día quedó guardado' }).waitFor()
  const reflexion = await leerReflexion(page)
  if (masCorto) await page.getByRole('button', { name: 'Más corto' }).click()
  await page.getByRole('button', { name: 'Hasta mañana' }).click()
  return reflexion
}

// J1: la primera vez, «Contar mi día» pide el micrófono justo a tiempo; las siguientes graba directo
export async function hablar(page) {
  await page.getByRole('button', { name: 'Contar mi día por voz' }).click()
  const activar = page.getByRole('button', { name: 'Activar micrófono' })
  if (await activar.waitFor({ timeout: 600 }).then(() => true, () => false)) await activar.click()
}

// La X del check-in: «Salir por hoy» lleva a la despedida, y de ahí al inicio
export async function salirPorHoy(page) {
  await page.getByRole('button', { name: 'Salir por hoy' }).click()
  await page.getByRole('button', { name: 'Volver al inicio' }).last().click()
}

export const leerPerfil = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('clima-interior:perfil')))
