// Refugio (RF-42, HU-30) y trampas de pensamiento: herramientas de autocuidado, nunca terapia.
// Journey nuevo (R1): «Necesito un respiro» empieza a respirar tras una cuenta de 3 s, sin preguntas antes;
// cómo estabas y cómo quedaste se pregunta al final y es opcional. Todo corre con el proveedor simulado.
import { test, expect } from './base.js'
import { microfonoFalso, leerPerfil } from './ayuda.js'

test.beforeEach(async ({ page }) => {
  await microfonoFalso(page)
  await page.goto('/')
})

// Las otras técnicas están en «Elegir otra cosa», durante la cuenta
async function abrirTecnicas(page) {
  await page.getByRole('button', { name: 'Necesito un respiro' }).click()
  await page.getByRole('button', { name: 'Elegir otra cosa' }).click()
}

// ¿Cómo quedaste? Opcional: antes y ahora
async function quedaste(page, antes, despues) {
  if (antes) await page.getByRole('radiogroup', { name: 'Cómo estabas antes' }).getByRole('radio', { name: new RegExp(antes) }).click()
  if (despues) await page.getByRole('radiogroup', { name: 'Cómo estás ahora' }).getByRole('radio', { name: new RegExp(despues) }).click()
  await page.getByRole('button', { name: 'Listo' }).click()
}

async function checkinConTexto(page, texto, clima = 'Lluvia') {
  await page.getByRole('radio', { name: new RegExp(clima) }).click()
  await page.getByRole('button', { name: /Escribir/ }).first().click()
  await page.getByRole('textbox').fill(texto)
  await page.getByRole('button', { name: 'Listo' }).click()
}

test('a un toque desde el inicio: cuenta de 3 s, respirar con la lluvia y, al final, cómo quedaste (HU-30 Esc. 1)', async ({ page }) => {
  // gratis, sin elegir el clima del día ni responder nada antes
  await expect(page.getByRole('button', { name: 'Necesito un respiro' })).toBeEnabled()
  await page.getByRole('button', { name: 'Necesito un respiro' }).click()
  await expect(page.getByRole('heading', { name: 'Acomódate.' })).toBeVisible()
  await expect(page.getByText('Lenta · 6 respiraciones · 1 min')).toBeVisible()
  const guia = page.locator('.respiro__guia')
  await expect(guia).toHaveText('Inhala…', { timeout: 5000 })
  await expect(guia).toHaveAttribute('aria-live', 'polite')
  await expect(guia).toHaveText('Exhala…', { timeout: 6000 }) // 4 s de inhalar, luego 6 de exhalar
  await expect(page.getByText('Respiración 1 de 6', { exact: false })).toBeVisible()
  // se puede parar en cualquier momento
  await page.getByRole('button', { name: 'Terminar' }).click()
  await expect(page.getByRole('heading', { name: '¿Cómo quedaste?' })).toBeVisible()
  await expect(page.getByText('Es opcional. Si no eliges, no se guarda nada.')).toBeVisible()
  await quedaste(page, 'Tormenta', 'Lluvia')
  await expect(page.locator('.antes-despues')).toContainText('Tormenta')
  await expect(page.locator('.antes-despues')).toContainText('Lluvia')
  await expect(page.getByText('Tu cielo se despejó un poco')).toBeVisible()
  const [r] = (await leerPerfil(page)).refugios
  expect(r).toMatchObject({ tecnica: 'respirar', antes: 'tormenta', despues: 'lluvia' })
  expect(Object.keys(r).sort()).toEqual(['antes', 'despues', 'fecha', 'segundos', 'tecnica'])
  // y aparece en el historial (sin registros del diario, junto al ejemplo)
  await page.getByRole('button', { name: 'Volver al inicio' }).last().click()
  await page.getByRole('radio', { name: /Nublado/ }).click()
  await page.getByRole('button', { name: 'Guardar así' }).click()
  await page.getByRole('button', { name: 'Hasta mañana' }).click()
  await page.getByRole('button', { name: /Historial/ }).click()
  await expect(page.getByRole('heading', { name: 'Lo que te ayudó' })).toBeVisible()
  await expect(page.getByText('Te diste 1 respiro.', { exact: false })).toBeVisible()
  await expect(page.getByText('1 vez · suele despejar tu cielo')).toBeVisible()
})

test('se puede cambiar el ritmo durante la cuenta', async ({ page }) => {
  await page.getByRole('button', { name: 'Necesito un respiro' }).click()
  await page.getByRole('button', { name: 'Cambiar ritmo' }).click()
  await page.getByRole('radio', { name: /Suspiro cíclico/ }).click()
  // M5: cada ritmo se explica en una línea y «Elegir otra cosa» sigue a mano
  await expect(page.getByRole('radio', { name: /Suspiro cíclico/ })).toContainText('exhalación larga')
  await expect(page.getByRole('radio', { name: /Lenta/ })).toContainText('exhalas 6 s')
  await expect(page.getByRole('button', { name: 'Elegir otra cosa' })).toBeInViewport()
  await page.getByRole('button', { name: 'Listo' }).click()
  await expect(page.getByText('Suspiro cíclico · 7 respiraciones', { exact: false })).toBeVisible()
  // y Escape cierra sin cambiar
  await page.getByRole('button', { name: 'Cambiar ritmo' }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('radiogroup', { name: 'Tipo de respiración' })).toHaveCount(0)
  await expect(page.getByText('Suspiro cíclico · 7 respiraciones', { exact: false })).toBeVisible()
})

test('«Saltar» no guarda nada y la X vuelve al inicio', async ({ page }) => {
  await page.getByRole('button', { name: 'Necesito un respiro' }).click()
  await page.getByRole('button', { name: 'Terminar' }).click({ timeout: 6000 })
  await page.getByRole('button', { name: 'Saltar' }).click()
  await expect(page.getByRole('heading', { name: 'Bien por darte este momento' })).toBeVisible()
  expect((await leerPerfil(page)).refugios ?? []).toEqual([])
  await page.getByRole('button', { name: 'Salir del respiro' }).click()
  await expect(page.getByRole('button', { name: 'Guardar así' })).toBeVisible()
})

test('5-4-3-2-1 paso a paso, sin guardar lo que se dice', async ({ page }) => {
  await abrirTecnicas(page)
  await page.getByRole('button', { name: /5-4-3-2-1/ }).click()
  await expect(page.getByText('poca investigación formal', { exact: false })).toBeVisible()
  for (const [n, que] of [[5, 'cosas que ves'], [4, 'cosas que oyes'], [3, 'cosas que puedes tocar'], [2, 'cosas que hueles']]) {
    await expect(page.getByRole('heading', { name: `${n} ${que}` })).toBeVisible()
    await page.getByRole('button', { name: 'Listo' }).click()
  }
  await expect(page.getByRole('heading', { name: '1 cosa que saboreas' })).toBeVisible()
  await page.getByRole('button', { name: 'Terminar' }).click()
  await quedaste(page, 'Lluvia', 'Nublado')
  expect((await leerPerfil(page)).refugios[0]).toMatchObject({ tecnica: 'tierra' })
})

test('5-4-3-2-1 por voz muestra lo que entendió y no lo guarda', async ({ page }) => {
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('clima-interior:perfil'))
    localStorage.setItem('clima-interior:perfil', JSON.stringify({ ...p, privacidad: { grabarVoz: true } }))
  })
  await page.reload()
  await abrirTecnicas(page)
  await page.getByRole('button', { name: /5-4-3-2-1/ }).click()
  await page.evaluate(() => { window.__dictado = 'el café de la mañana' })
  await page.getByRole('button', { name: 'Decirlo en voz alta' }).click()
  await expect(page.getByText('«el café de la mañana»')).toBeVisible()
  expect(JSON.stringify(await leerPerfil(page))).not.toContain('café')
})

test('partir la tarea: pasos para tachar que se recuerdan', async ({ page }) => {
  await abrirTecnicas(page)
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
  await abrirTecnicas(page)
  await page.getByRole('button', { name: /Partir la tarea/ }).click()
  await expect(page.getByLabel('¿Qué tienes que hacer?')).toHaveValue('Parcial de IA')
  await expect(page.getByRole('checkbox', { name: /Repasar búsqueda A\*/ })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: /Hacer 2 ejercicios/ })).not.toBeChecked()
})

test('la técnica que más te ayudó aparece primero en la lista y lo dice', async ({ page }) => {
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('clima-interior:perfil'))
    localStorage.setItem('clima-interior:perfil', JSON.stringify({ ...p, aprendido: { tecnicaFavorita: 'tarea' } }))
  })
  await page.reload()
  await abrirTecnicas(page)
  await expect(page.locator('.tecnica').first()).toContainText('Partir la tarea')
  await expect(page.locator('.tecnica').first()).toContainText('Te ayudó antes')
})

test('con movimiento reducido la respiración no se anima: queda el texto', async ({ page }) => {
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('clima-interior:perfil'))
    localStorage.setItem('clima-interior:perfil', JSON.stringify({ ...p, preferencias: { movimientoReducido: true, tema: 'claro' } }))
  })
  await page.reload()
  await page.getByRole('button', { name: 'Necesito un respiro' }).click()
  await expect(page.locator('.respiro__guia')).toHaveText('Inhala…', { timeout: 5000 })
  const nube = page.locator('.respiro__nube')
  const antes = await nube.evaluate((el) => el.style.transform)
  await expect(page.locator('.respiro__guia')).toHaveText('Exhala…', { timeout: 6000 })
  expect(await nube.evaluate((el) => el.style.transform)).toBe(antes)
  expect(await nube.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s')
  // Garúa tampoco flota ni parpadea
  expect(await page.locator('.garua__ojos').first().evaluate((el) => getComputedStyle(el).animationName)).toBe('none')
})

test('tras un check-in con lluvia se ofrece un respiro; «Ahora no» no lo vuelve a ofrecer ese día (HU-30 Esc. 2)', async ({ page }) => {
  await page.getByRole('radio', { name: /Lluvia/ }).click()
  await page.getByRole('button', { name: 'Guardar así' }).click()
  await expect(page.getByText('¿Quieres un respiro?')).toBeVisible()
  await page.getByRole('button', { name: 'Ahora no' }).click()
  await expect(page.getByText('¿Quieres un respiro?')).toHaveCount(0)
  expect((await leerPerfil(page)).registros).toHaveLength(1) // el registro se guardó igual
  await page.getByRole('button', { name: 'Hasta mañana' }).click()
  await page.getByRole('radio', { name: /Tormenta/ }).click()
  await page.getByRole('button', { name: 'Guardar así' }).click()
  await expect(page.getByRole('heading', { name: 'Tu día quedó guardado' })).toBeVisible()
  await expect(page.getByText('¿Quieres un respiro?')).toHaveCount(0)
})

test('un día soleado y tranquilo no ofrece el respiro', async ({ page }) => {
  await page.getByRole('radio', { name: /Soleado/ }).click()
  await page.getByRole('button', { name: 'Guardar así' }).click()
  await expect(page.getByRole('heading', { name: 'Tu día quedó guardado' })).toBeVisible()
  await expect(page.getByText('¿Quieres un respiro?')).toHaveCount(0)
})

test('trampa: valida, cita la frase y pregunta; «No es así» la descarta y se aprende', async ({ page }) => {
  await checkinConTexto(page, 'Estudié toda la noche. Seguro que voy a jalar el parcial')
  await page.getByRole('button', { name: 'No sé, guardar igual' }).click()
  await expect(page.getByText('Sugerencia automática · no es un diagnóstico')).toBeVisible()
  await expect(page.locator('.trampa__frase')).toHaveText('«Seguro que voy a jalar el parcial»')
  await expect(page.getByText('Tiene sentido sentirte así')).toBeVisible()
  await expect(page.getByText('¿Puede ser que tu mente esté adivinando el futuro?')).toBeVisible()
  await expect(page.getByText(/positiv|irracional|distorsi/i)).toHaveCount(0)
  // el día ya está guardado antes de responder
  expect((await leerPerfil(page)).registros).toHaveLength(1)
  await page.getByRole('button', { name: 'No es así' }).click()
  await expect(page.getByRole('heading', { name: 'Tu día quedó guardado' })).toBeVisible()
  expect((await leerPerfil(page)).aprendizaje.trampas).toEqual({ adivinar_futuro: { si: 0, no: 1 } })
})

test('trampa: «Sí, puede ser» lleva a una pregunta y a «¿Qué le dirías a alguien que quieres?» con su frase', async ({ page }) => {
  await checkinConTexto(page, 'soy un fracaso, me fue fatal en la exposición')
  await page.getByRole('button', { name: 'No sé, guardar igual' }).click()
  await page.getByRole('button', { name: 'Sí, puede ser' }).click()
  await expect(page.getByText('No se trata de pensar bonito', { exact: false })).toBeVisible()
  await expect(page.getByRole('heading', { name: '¿Lo que pasó habla de ese momento, o de quién eres en todo?' })).toBeVisible()
  // B10: el anuncio va en su propia región, no en el h1
  await expect(page.getByRole('status').filter({ hasText: '¿Lo que pasó habla de ese momento' })).toHaveCount(1)
  await expect(page.locator('h1[role="status"]')).toHaveCount(0)
  await page.getByRole('button', { name: '¿Qué le dirías a alguien que quieres?' }).click()
  await expect(page.getByText('«soy un fracaso»')).toBeVisible()
  await page.getByLabel(/Lo que le dirías/).fill('Una expo no dice quién eres, te esforzaste')
  await page.getByRole('button', { name: 'Seguir' }).click()
  await expect(page.getByText('Ahora prueba decírtelo a ti')).toBeVisible()
  await page.getByRole('button', { name: 'Listo' }).click()
  await quedaste(page, 'Lluvia', 'Nublado')
  const p = await leerPerfil(page)
  expect(p.refugios[0]).toMatchObject({ tecnica: 'amiga', antes: 'lluvia', despues: 'nublado' })
  expect(JSON.stringify(p.refugios)).not.toContain('expo') // lo escrito no se guarda
})

test('sin trampa en el relato, no hay tarjeta', async ({ page }) => {
  await checkinConTexto(page, 'Día tranquilo con música', 'Soleado')
  await page.getByRole('button', { name: 'No sé, guardar igual' }).click()
  await expect(page.getByRole('heading', { name: 'Tu día quedó guardado' })).toBeVisible()
})

test('la crisis gana a las trampas y al refugio, y ofrece Bienestar UNI', async ({ page }) => {
  await checkinConTexto(page, 'tuve un examen horrible, seguro que voy a jalar y no sé si quiero seguir viviendo', 'Tormenta')
  await expect(page.getByRole('heading', { name: 'Mereces apoyo ahora mismo' })).toBeVisible()
  for (const tel of ['113', '106', '105', '014811070']) await expect(page.locator(`a[href="tel:${tel}"]`)).toBeVisible()
  await expect(page.getByText('Bienestar Universitario UNI')).toBeVisible()
  await expect(page.getByText('Orientación psicológica gratuita', { exact: false })).toBeVisible()
  await expect(page.getByText('¿Puede ser que')).toHaveCount(0)
  await expect(page.getByText('¿Quieres un respiro?')).toHaveCount(0)
  await expect(page.getByText('Toca las nubes')).toHaveCount(0)
})

test('una frase de riesgo dentro del refugio también lleva a la pantalla de crisis', async ({ page }) => {
  await abrirTecnicas(page)
  await page.getByRole('button', { name: /Partir la tarea/ }).click()
  await page.locator('#tarea-paso').fill('ya no quiero vivir')
  await page.getByRole('button', { name: 'Agregar' }).click()
  await expect(page.getByRole('heading', { name: 'Mereces apoyo ahora mismo' })).toBeVisible()
  await expect(page.getByText('Algo de lo que contaste nos preocupa.', { exact: false })).toBeVisible()
})

test('«Necesito más ayuda» durante el respiro lleva a la crisis', async ({ page }) => {
  await page.getByRole('button', { name: 'Necesito un respiro' }).click()
  await page.getByRole('button', { name: 'Necesito más ayuda' }).click()
  await expect(page.getByRole('heading', { name: 'Mereces apoyo ahora mismo' })).toBeVisible()
})

test('ayuda contextual distinta en cada paso del refugio', async ({ page }) => {
  await page.getByRole('button', { name: 'Necesito un respiro' }).click()
  await page.getByRole('button', { name: 'Ayuda contextual' }).click()
  await expect(page.getByRole('dialog')).toContainText('Inhala mientras Garúa crece')
  await page.getByRole('button', { name: 'Entendido' }).click()
  await page.getByRole('button', { name: 'Elegir otra cosa' }).click()
  await page.getByRole('button', { name: /Partir la tarea/ }).click()
  await page.getByRole('button', { name: 'Ayuda contextual' }).click()
  await expect(page.getByRole('dialog')).toContainText('pasos chiquitos')
})

test('partir la tarea: el campo del paso va a todo el ancho y los botones en su fila, a 320 px (A2)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await abrirTecnicas(page)
  await page.getByRole('button', { name: /Partir la tarea/ }).click()
  await page.getByLabel('¿Qué tienes que hacer?').fill('Estudiar para el parcial de Inteligencia Artificial del jueves')
  const que = await page.getByLabel('¿Qué tienes que hacer?').evaluate((el) => el.scrollHeight <= el.clientHeight + 1)
  expect(que).toBe(true) // el texto largo no se corta
  const campo = await page.locator('#tarea-paso').boundingBox()
  const boton = await page.getByRole('button', { name: 'Agregar paso' }).boundingBox()
  const suelo = await page.locator('.suelo--form').boundingBox()
  expect(campo.width).toBeGreaterThan(suelo.width * 0.85)
  expect(boton.y).toBeGreaterThanOrEqual(campo.y + campo.height)
  const lineas = await page.locator('label[for="tarea-paso"]').evaluate((el) => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight || 20)))
  expect(lineas).toBeLessThanOrEqual(2)
})

test('«¿Cómo quedaste?» se pregunta una sola vez por visita al Refugio (M4)', async ({ page }) => {
  await page.getByRole('button', { name: 'Necesito un respiro' }).click()
  await page.getByRole('button', { name: 'Terminar' }).click({ timeout: 6000 })
  await expect(page.getByRole('heading', { name: '¿Cómo quedaste?' })).toBeVisible()
  await page.getByRole('radiogroup', { name: 'Cómo estabas antes' }).getByRole('radio', { name: /Lluvia/ }).click()
  await page.getByRole('radiogroup', { name: 'Cómo estás ahora' }).getByRole('radio', { name: /Nublado/ }).click()
  await page.getByRole('button', { name: 'Otra técnica' }).click()
  await page.getByRole('button', { name: /qué le dirías/i }).click()
  await page.getByRole('button', { name: 'Seguir' }).click()
  await page.getByRole('button', { name: 'Listo' }).click()
  // no vuelve a preguntar: va directo al resumen y guarda lo que ya había respondido, una vez
  await expect(page.getByRole('heading', { name: '¿Cómo quedaste?' })).toHaveCount(0)
  await expect(page.getByText('Tu cielo se despejó un poco')).toBeVisible()
  expect((await leerPerfil(page)).refugios).toHaveLength(1)
})

test('con la oferta de respiro siguen la salida y la tarjeta de ajustes (M12)', async ({ page }) => {
  await page.getByRole('radio', { name: /Lluvia/ }).click()
  await page.getByRole('button', { name: 'Guardar así' }).click()
  await expect(page.getByRole('button', { name: 'Necesito un respiro' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '¿Te acomodo algo?' })).toBeVisible()
  await page.getByRole('button', { name: 'Hasta mañana' }).click()
  await expect(page.getByRole('button', { name: 'Guardar así' })).toBeVisible()
})

test('con movimiento reducido del sistema (sin activarlo en la app) Garúa no cambia de tamaño ni de pose (B5)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await page.getByRole('button', { name: 'Necesito un respiro' }).click()
  const nube = page.locator('.respiro__nube')
  const cuenta = await nube.evaluate((el) => el.style.transform)
  await expect(page.locator('.respiro__guia')).toHaveText('Inhala…', { timeout: 5000 })
  const inhala = await nube.evaluate((el) => [el.style.transform, el.querySelector('.garua').dataset.estado])
  await expect(page.locator('.respiro__guia')).toHaveText('Exhala…', { timeout: 6000 })
  const exhala = await nube.evaluate((el) => [el.style.transform, el.querySelector('.garua').dataset.estado])
  expect(inhala[0]).toBe(cuenta)
  expect(exhala).toEqual(inhala)
})

test('Garúa no tapa ni se pega a «Ayuda ya» en la trampa, y en «¿Qué te vendría bien?» tiene tamaño (B13)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await checkinConTexto(page, 'Estudié toda la noche. Seguro que voy a jalar el parcial')
  await page.getByRole('button', { name: 'No sé, guardar igual' }).click()
  const g = await page.locator('.trampa__garua').boundingBox()
  const a = await page.getByRole('button', { name: /Ayuda ya/ }).boundingBox()
  const separadas = g.x > a.x + a.width || g.x + g.width < a.x || g.y > a.y + a.height + 16
  expect(separadas).toBe(true)
  await page.getByRole('button', { name: 'No es así' }).click()
  await page.getByRole('button', { name: 'Hasta mañana' }).click()
  await page.getByRole('button', { name: 'Necesito un respiro' }).click()
  await page.getByRole('button', { name: 'Elegir otra cosa' }).click()
  const e = await page.locator('.escena .garua').first().boundingBox()
  expect(e.width).toBeGreaterThanOrEqual(110)
})
