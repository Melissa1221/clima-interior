// Refugio (RF-42, HU-30) y trampas de pensamiento: herramientas de autocuidado, nunca terapia.
// Todo corre con el proveedor simulado, como en producción.
import { test, expect } from './base.js'
import { microfonoFalso, leerPerfil } from './ayuda.js'

test.beforeEach(async ({ page }) => {
  await microfonoFalso(page)
  await page.goto('/')
})

async function abrirRefugio(page, clima = 'Lluvia') {
  await page.getByRole('button', { name: 'Necesito un respiro' }).click()
  await page.getByRole('radio', { name: new RegExp(clima) }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
}

async function checkinConTexto(page, texto, clima = 'Lluvia') {
  await page.getByRole('radio', { name: new RegExp(clima) }).click()
  await page.getByRole('button', { name: /Escribir/ }).first().click()
  await page.getByRole('textbox').fill(texto)
  await page.getByRole('button', { name: 'Listo' }).click()
}

test('a un toque desde el inicio: antes, respirar con la lluvia, después (HU-30 Esc. 1)', async ({ page }) => {
  // gratis y sin elegir el clima del día primero
  await expect(page.getByRole('button', { name: 'Necesito un respiro' })).toBeEnabled()
  await abrirRefugio(page, 'Tormenta')
  await expect(page.getByRole('heading', { name: '¿Qué te vendría bien?' })).toBeVisible()
  await expect(page.locator('.tecnica')).toHaveCount(4)
  await page.getByRole('button', { name: /Respirar con la lluvia/ }).click()
  await expect(page.getByText('Con respaldo de estudios.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Empezar' }).click()
  const guia = page.locator('.respiro__guia')
  await expect(guia).toHaveAttribute('aria-live', 'polite')
  await expect(guia).toHaveText('Inhala…')
  await expect(guia).toHaveText('Exhala…', { timeout: 6000 }) // 4 s de inhalar, luego 6 de exhalar
  await expect(page.getByText('Respiración 1 de 6')).toBeVisible()
  // se puede parar en cualquier momento
  await page.getByRole('button', { name: 'Terminar' }).click()
  await expect(page.getByRole('heading', { name: '¿Y ahora, cómo estás?' })).toBeVisible()
  await page.getByRole('radio', { name: /Lluvia/ }).click()
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.locator('.antes-despues')).toContainText('Tormenta')
  await expect(page.locator('.antes-despues')).toContainText('Lluvia')
  await expect(page.getByText('Tu cielo se despejó un poco')).toBeVisible()
  const [r] = (await leerPerfil(page)).refugios
  expect(r).toMatchObject({ tecnica: 'respirar', antes: 'tormenta', despues: 'lluvia' })
  expect(Object.keys(r).sort()).toEqual(['antes', 'despues', 'fecha', 'segundos', 'tecnica'])
  // y aparece en el historial
  await page.getByRole('button', { name: 'Volver al inicio' }).click()
  await page.getByRole('button', { name: /Historial/ }).click()
  await expect(page.getByRole('heading', { name: 'Lo que te ayudó' })).toBeVisible()
  await expect(page.getByText('Te diste 1 respiro.', { exact: false })).toBeVisible()
  await expect(page.getByText('1 vez · suele despejar tu cielo')).toBeVisible()
})

test('«Ahora no» al empezar vuelve al inicio sin guardar nada', async ({ page }) => {
  await page.getByRole('button', { name: 'Necesito un respiro' }).click()
  await page.getByRole('button', { name: 'Ahora no' }).click()
  await expect(page.getByText('¿Qué clima hay hoy?')).toBeVisible()
  expect((await leerPerfil(page)).refugios ?? []).toEqual([])
})

test('5-4-3-2-1 paso a paso, sin guardar lo que se dice', async ({ page }) => {
  await abrirRefugio(page)
  await page.getByRole('button', { name: /5-4-3-2-1/ }).click()
  await expect(page.getByText('poca investigación formal', { exact: false })).toBeVisible()
  for (const [n, que] of [[5, 'cosas que ves'], [4, 'cosas que oyes'], [3, 'cosas que puedes tocar'], [2, 'cosas que hueles']]) {
    await expect(page.getByRole('heading', { name: `${n} ${que}` })).toBeVisible()
    await page.getByRole('button', { name: 'Listo' }).click()
  }
  // por voz: se ve lo que entendió, pero no se guarda
  await page.evaluate(() => { window.__dictado = 'el café de la mañana' })
  await page.getByRole('button', { name: 'Decirlo en voz alta' }).click()
  await expect(page.getByText('«el café de la mañana»')).toBeVisible()
  await page.getByRole('button', { name: 'Terminar' }).click()
  await page.getByRole('radio', { name: /Nublado/ }).click()
  await page.getByRole('button', { name: 'Guardar' }).click()
  expect(JSON.stringify(await leerPerfil(page))).not.toContain('café')
})

test('partir la tarea: pasos para tachar que se recuerdan', async ({ page }) => {
  await abrirRefugio(page, 'Niebla')
  await page.getByRole('button', { name: /Partir la tarea/ }).click()
  await page.getByLabel('¿Qué tienes que hacer?').fill('Parcial de IA')
  await expect(page.getByText('Un primer paso de unos 15 minutos')).toBeVisible()
  await page.locator('#tarea-paso').fill('Repasar búsqueda A*')
  await page.getByRole('button', { name: 'Agregar' }).click()
  await page.locator('#tarea-paso').fill('Hacer 2 ejercicios')
  await page.keyboard.press('Enter')
  await page.getByRole('checkbox', { name: /Repasar búsqueda A\*/ }).check()
  await expect(page.getByText('1 de 2 pasos hechos')).toBeVisible()
  await expect(page.getByText('Primer paso · unos 15 min')).toBeVisible()
  await page.reload()
  await abrirRefugio(page, 'Niebla')
  await page.getByRole('button', { name: /Partir la tarea/ }).click()
  await expect(page.getByLabel('¿Qué tienes que hacer?')).toHaveValue('Parcial de IA')
  await expect(page.getByRole('checkbox', { name: /Repasar búsqueda A\*/ })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: /Hacer 2 ejercicios/ })).not.toBeChecked()
})

test('la técnica que más te ayudó aparece primero y lo dice', async ({ page }) => {
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('clima-interior:perfil'))
    localStorage.setItem('clima-interior:perfil', JSON.stringify({ ...p, aprendido: { tecnicaFavorita: 'tarea' } }))
  })
  await page.reload()
  await abrirRefugio(page)
  await expect(page.locator('.tecnica').first()).toContainText('Partir la tarea')
  await expect(page.locator('.tecnica').first()).toContainText('Te ayudó antes')
})

test('con movimiento reducido la respiración no se anima: queda el texto', async ({ page }) => {
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('clima-interior:perfil'))
    localStorage.setItem('clima-interior:perfil', JSON.stringify({ ...p, preferencias: { movimientoReducido: true } }))
  })
  await page.reload()
  await abrirRefugio(page)
  await page.getByRole('button', { name: /Respirar con la lluvia/ }).click()
  await page.getByRole('button', { name: 'Empezar' }).click()
  await expect(page.locator('.respiro__guia')).toHaveText('Inhala…')
  const nube = page.locator('.respiro__nube')
  const antes = await nube.evaluate((el) => el.style.transform)
  await expect(page.locator('.respiro__guia')).toHaveText('Exhala…', { timeout: 6000 })
  expect(await nube.evaluate((el) => el.style.transform)).toBe(antes)
  expect(await nube.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s')
})

test('tras un check-in con lluvia se ofrece un respiro; «Ahora no» no lo vuelve a ofrecer ese día (HU-30 Esc. 2)', async ({ page }) => {
  await page.getByRole('radio', { name: /Lluvia/ }).click()
  await page.getByRole('button', { name: /Así está bien/ }).click()
  await expect(page.getByText('¿Te tomas un respiro?')).toBeVisible()
  await page.getByRole('button', { name: 'Ahora no' }).click()
  await expect(page.getByText('¿Te tomas un respiro?')).toHaveCount(0)
  expect((await leerPerfil(page)).registros).toHaveLength(1) // el registro se guardó igual
  await page.getByRole('button', { name: 'Hasta mañana' }).click()
  await page.getByRole('radio', { name: /Tormenta/ }).click()
  await page.getByRole('button', { name: /Así está bien/ }).click()
  await expect(page.getByRole('heading', { name: 'Tu día quedó guardado' })).toBeVisible()
  await expect(page.getByText('¿Te tomas un respiro?')).toHaveCount(0)
})

test('un día soleado y tranquilo no ofrece el respiro', async ({ page }) => {
  await page.getByRole('radio', { name: /Soleado/ }).click()
  await page.getByRole('button', { name: /Así está bien/ }).click()
  await expect(page.getByRole('heading', { name: 'Tu día quedó guardado' })).toBeVisible()
  await expect(page.getByText('¿Te tomas un respiro?')).toHaveCount(0)
})

test('trampa: valida, cita la frase y pregunta; «No es así» la descarta y se aprende', async ({ page }) => {
  await checkinConTexto(page, 'Estudié toda la noche. Seguro que voy a jalar el parcial')
  await page.getByRole('button', { name: /guardar/i }).click()
  await expect(page.getByText('Sugerencia automática · no es un diagnóstico')).toBeVisible()
  await expect(page.locator('.trampa__cita').first()).toHaveText('Dijiste «Seguro que voy a jalar el parcial».')
  await expect(page.getByText('Tiene sentido que te sientas así')).toBeVisible()
  await expect(page.getByText('¿Puede ser que tu mente esté adivinando el futuro?')).toBeVisible()
  await expect(page.getByText(/positiv|irracional|distorsi/i)).toHaveCount(0)
  // el día ya está guardado antes de responder
  expect((await leerPerfil(page)).registros).toHaveLength(1)
  await page.getByRole('button', { name: 'No es así' }).click()
  await expect(page.getByRole('heading', { name: 'Tu día quedó guardado' })).toBeVisible()
  expect((await leerPerfil(page)).aprendizaje.trampas).toEqual({ adivinar_futuro: { si: 0, no: 1 } })
})

test('trampa: «Sí, puede ser» lleva a una pregunta y a «¿Qué le dirías a una amiga?» con su frase', async ({ page }) => {
  await checkinConTexto(page, 'soy un fracaso, me fue fatal en la exposición')
  await page.getByRole('button', { name: /guardar/i }).click()
  await page.getByRole('button', { name: 'Sí, puede ser' }).click()
  await expect(page.getByText('No se trata de pensar bonito', { exact: false })).toBeVisible()
  await expect(page.getByText('¿Lo que pasó habla de ese momento, o de quién eres en todo?')).toBeVisible()
  await page.getByRole('button', { name: '¿Qué le dirías a una amiga?' }).click()
  await page.getByRole('radio', { name: /Lluvia/ }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText('«soy un fracaso»')).toBeVisible()
  await page.getByLabel(/Lo que le dirías/).fill('Una expo no dice quién eres, te esforzaste')
  await page.getByRole('button', { name: 'Seguir' }).click()
  await expect(page.getByText('Ahora prueba decírtelo a ti')).toBeVisible()
  await page.getByRole('button', { name: 'Listo' }).click()
  await page.getByRole('radio', { name: /Nublado/ }).click()
  await page.getByRole('button', { name: 'Guardar' }).click()
  const p = await leerPerfil(page)
  expect(p.refugios[0]).toMatchObject({ tecnica: 'amiga', antes: 'lluvia', despues: 'nublado' })
  expect(JSON.stringify(p.refugios)).not.toContain('expo') // lo escrito no se guarda
})

test('sin trampa en el relato, no hay tarjeta', async ({ page }) => {
  await checkinConTexto(page, 'Día tranquilo con música', 'Soleado')
  await page.getByRole('button', { name: /guardar/i }).click()
  await expect(page.getByRole('heading', { name: 'Tu día quedó guardado' })).toBeVisible()
})

test('la crisis gana a las trampas y al refugio, y ofrece Bienestar UNI', async ({ page }) => {
  await checkinConTexto(page, 'tuve un examen horrible, seguro que voy a jalar y no sé si quiero seguir viviendo', 'Tormenta')
  await expect(page.getByRole('heading', { name: 'Mereces apoyo ahora mismo' })).toBeVisible()
  for (const tel of ['113', '106', '105', '014811070']) await expect(page.locator(`a[href="tel:${tel}"]`)).toBeVisible()
  await expect(page.getByText('Bienestar Universitario UNI')).toBeVisible()
  await expect(page.getByText('Orientación psicológica gratuita', { exact: false })).toBeVisible()
  await expect(page.getByText('¿Puede ser que')).toHaveCount(0)
  await expect(page.getByText('¿Te tomas un respiro?')).toHaveCount(0)
  await expect(page.getByText('Toca las nubes')).toHaveCount(0)
})

test('una frase de riesgo dentro del refugio también lleva a la pantalla de crisis', async ({ page }) => {
  await abrirRefugio(page)
  await page.getByRole('button', { name: /Partir la tarea/ }).click()
  await page.locator('#tarea-paso').fill('ya no quiero vivir')
  await page.getByRole('button', { name: 'Agregar' }).click()
  await expect(page.getByRole('heading', { name: 'Mereces apoyo ahora mismo' })).toBeVisible()
})

test('ayuda contextual distinta en cada paso del refugio', async ({ page }) => {
  await page.getByRole('button', { name: 'Necesito un respiro' }).click()
  await page.getByRole('button', { name: 'Ayuda contextual' }).click()
  await expect(page.getByRole('dialog')).toContainText('No es terapia')
  await page.getByRole('button', { name: 'Entendido' }).click()
  await page.getByRole('radio', { name: /Lluvia/ }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: /Partir la tarea/ }).click()
  await page.getByRole('button', { name: 'Ayuda contextual' }).click()
  await expect(page.getByRole('dialog')).toContainText('pasos chiquitos')
})
