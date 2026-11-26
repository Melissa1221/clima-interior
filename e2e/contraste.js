// Contraste medido sobre píxeles: axe no resuelve texto sobre ilustraciones (cielo, lomas, lluvia).
// Para cada selector se lee el color del texto, se vuelve transparente, se captura la pantalla y se toma
// el píxel de fondo más desfavorable de su caja (percentil 95, para que una gota suelta no mande).
const lum = ([r, g, b]) => {
  const c = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const razon = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)

export async function contrastes(page, selectores) {
  const textos = await page.evaluate((sels) => sels.flatMap((s) => [...document.querySelectorAll(s)]
    .filter((el) => el.offsetParent !== null && el.getBoundingClientRect().height > 0)
    .map((el) => {
      const r = el.getBoundingClientRect()
      const color = getComputedStyle(el).color.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number)
      return { sel: s, texto: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 40), color, caja: [r.x, r.y, r.width, r.height] }
    })), selectores)
  const estilo = await page.addStyleTag({ content: `${selectores.join(', ')} { color: transparent !important; text-decoration-color: transparent !important; }
    ${selectores.map((s) => `${s} svg`).join(', ')} { visibility: hidden !important; }` })
  await page.waitForTimeout(50)
  const png = (await page.screenshot({ scale: 'css', animations: 'disabled' })).toString('base64')
  await estilo.evaluate((n) => n.remove())
  const fondos = await page.evaluate(async ({ png, cajas }) => {
    const img = new Image()
    img.src = `data:image/png;base64,${png}`
    await img.decode()
    const lienzo = document.createElement('canvas')
    lienzo.width = img.width; lienzo.height = img.height
    const ctx = lienzo.getContext('2d')
    ctx.drawImage(img, 0, 0)
    return cajas.map(([x, y, w, h]) => {
      const x0 = Math.max(0, Math.floor(x)), y0 = Math.max(0, Math.floor(y))
      const ancho = Math.max(1, Math.min(img.width - x0, Math.ceil(w))), alto = Math.max(1, Math.min(img.height - y0, Math.ceil(h)))
      const d = ctx.getImageData(x0, y0, ancho, alto).data
      const px = []
      for (let i = 0; i < d.length; i += 4 * 3) px.push([d[i], d[i + 1], d[i + 2]])
      return px
    })
  }, { png, cajas: textos.map((t) => t.caja) })
  return textos.map((t, i) => {
    const lt = lum(t.color)
    const ls = fondos[i].map(lum).sort((a, b) => a - b)
    const claro = lt > ls[Math.floor(ls.length / 2)] // texto claro: el peor fondo es el más claro
    const peor = claro ? ls[Math.floor(ls.length * 0.95)] : ls[Math.floor(ls.length * 0.05)]
    return { texto: t.texto, sel: t.sel, razon: Math.round(razon(lt, peor) * 100) / 100 }
  })
}
