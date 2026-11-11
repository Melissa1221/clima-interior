// Graba los clips de la app y genera las placas, el guion y los subtítulos.
// Uso: npm run video:grabar   → video-salida/clips, video-salida/placas y docs/video/guion.md
// Necesita Chrome o Chromium (CHROME_PATH) y ffmpeg para el paso siguiente (npm run video:montar).
import { spawn, execSync } from 'node:child_process'
import { mkdirSync, renameSync, readdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
import { ESCENAS } from './escenas.mjs'

const RAIZ = new URL('../../', import.meta.url).pathname
const SALIDA = `${RAIZ}video-salida/`
const PUERTO = 4198
const BASE = `http://localhost:${PUERTO}/`
for (const d of ['clips', 'placas']) { rmSync(`${SALIDA}${d}`, { recursive: true, force: true }); mkdirSync(`${SALIDA}${d}`, { recursive: true }) }
mkdirSync(`${RAIZ}docs/video`, { recursive: true })

const chrome = process.env.CHROME_PATH
  || ['google-chrome', 'chromium', 'chromium-browser'].map((c) => { try { return execSync(`which ${c}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim() } catch { return '' } }).find(Boolean)
if (!chrome) throw new Error('No encuentro Chrome o Chromium: define CHROME_PATH')

// Dictado simulado para grabar sin micrófono, y un cursor visible para que se vea cada toque
const DICTADO = () => {
  class SR {
    start() { setTimeout(() => this.onresult?.({ results: [[{ transcript: 'Hoy me desperté con sueño y el tráfico me quitó energía, pero la tarde fue tranquila' }]] }), 900) }
    stop() { setTimeout(() => this.onend?.(), 30) }
    abort() {}
  }
  SR.prototype.processLocally = false
  window.SpeechRecognition = window.webkitSpeechRecognition = SR
}
const CURSOR = () => addEventListener('DOMContentLoaded', () => {
  const c = document.createElement('div')
  c.style.cssText = 'position:fixed;left:-50px;top:-50px;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:rgba(255,194,61,.55);border:2px solid #1e2433;z-index:2147483647;pointer-events:none;transition:transform 120ms'
  document.body.appendChild(c)
  addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px' }, true)
  addEventListener('mousedown', () => { c.style.transform = 'scale(.65)' }, true)
  addEventListener('mouseup', () => { c.style.transform = 'scale(1)' }, true)
})

console.log('Compilando la versión de producción…')
execSync('npx vite build', { cwd: RAIZ, stdio: 'ignore' })
const servidor = spawn('npx', ['vite', 'preview', '--port', String(PUERTO), '--strictPort'], { cwd: RAIZ, stdio: 'ignore' })
for (let i = 0; ; i++) { try { if ((await fetch(BASE)).ok) break } catch { /* aún no arranca */ } if (i > 60) throw new Error('vite preview no arrancó'); await new Promise((r) => setTimeout(r, 200)) }

const navegador = await chromium.launch({ executablePath: chrome, args: ['--no-sandbox'] })
const duraciones = {}
const fuentes = (nombre) => new URL(`../../node_modules/@fontsource-variable/${nombre}`, import.meta.url).href

try {
  // ---- clips de la app ----
  for (const e of ESCENAS.filter((x) => x.tipo === 'app')) {
    const carpeta = `${SALIDA}clips/tmp-${e.id}`
    const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, recordVideo: { dir: carpeta, size: { width: 390, height: 844 } }, serviceWorkers: e.sinConexion ? 'allow' : 'block' })
    const p = await ctx.newPage()
    p.on('pageerror', (err) => console.error(`  [${e.id}] error de la página:`, err.message))
    await p.addInitScript(DICTADO)
    await p.addInitScript(CURSOR)
    if (e.perfil) await p.addInitScript((v) => { if (!localStorage.getItem('clima-interior:perfil')) localStorage.setItem('clima-interior:perfil', v) }, e.perfil)
    await p.goto(BASE)
    const inicio = Date.now()
    await e.acciones(p)
    await p.waitForTimeout(800)
    duraciones[e.id] = (Date.now() - inicio) / 1000
    await ctx.close() // cierra y escribe el video
    renameSync(`${carpeta}/${readdirSync(carpeta)[0]}`, `${SALIDA}clips/${e.id}.webm`)
    rmSync(carpeta, { recursive: true })
    console.log(`• clip ${e.id} (${duraciones[e.id].toFixed(1)} s): ${e.titulo}`)
  }

  // ---- placas: fondo y rótulos de cada escena, con la ranura del teléfono ----
  const total = ESCENAS.length
  const html = (e) => {
    const chips = (e.requisitos ?? []).map((r) => `<span>${r}</span>`).join('')
    const izquierda = e.tipo === 'app'
      ? `<div class="num">${e.id} / ${String(total - 1).padStart(2, '0')}</div><h1>${e.titulo}</h1><p class="sub">${e.subtitulo}</p><div class="chips">${chips}</div><p class="pant">Pantallas del Figma: ${e.pantallas}</p>`
      : `<h1 class="grande">${e.titulo}</h1><p class="sub">${e.subtitulo}</p><p class="pie">${e.pie ?? ''}</p>`
    return `<!doctype html><meta charset="utf-8"><style>
      @font-face{font-family:F;src:url(${fuentes('fraunces/files/fraunces-latin-wght-normal.woff2')});font-weight:100 900}
      @font-face{font-family:A;src:url(${fuentes('atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2')});font-weight:200 800}
      *{box-sizing:border-box}body{margin:0;width:1920px;height:1080px;font-family:A,sans-serif;color:#fff;background:linear-gradient(135deg,#34507a,#1e2433);position:relative;overflow:hidden}
      .marca{position:absolute;left:96px;top:60px;font-size:26px;letter-spacing:.08em;text-transform:uppercase;opacity:.75}
      .izq{position:absolute;left:96px;top:200px;width:${e.tipo === 'app' ? 900 : 1728}px;${e.tipo === 'app' ? '' : 'top:300px;'}}
      .num{font-size:30px;opacity:.7;margin-bottom:20px}h1{font-family:F;font-weight:600;font-size:78px;line-height:1.1;margin:0 0 28px}h1.grande{font-size:124px}
      .sub{font-size:38px;line-height:1.4;margin:0 0 36px;opacity:.95}.chips span{display:inline-block;margin:0 12px 12px 0;padding:8px 18px;border-radius:999px;background:rgba(255,255,255,.16);font-size:26px;font-weight:700}
      .pant,.pie{font-size:26px;opacity:.7}.pie{margin-top:60px}
      .telefono{position:absolute;left:1190px;top:28px;width:490px;height:1024px;border-radius:44px;background:#0e121d;box-shadow:0 20px 60px rgba(0,0,0,.45)}
    </style><div class="marca">Clima Interior · Grupo 8 · CC451</div><div class="izq">${izquierda}</div>${e.tipo === 'app' ? '<div class="telefono"></div>' : ''}`
  }
  const pag = await navegador.newPage({ viewport: { width: 1920, height: 1080 } })
  for (const e of ESCENAS) {
    await pag.setContent(html(e)); await pag.waitForTimeout(400)
    await pag.screenshot({ path: `${SALIDA}placas/${e.id}.png` })
  }
  writeFileSync(`${SALIDA}duraciones.json`, JSON.stringify(duraciones, null, 1))

  // ---- guion legible ----
  const lineas = ['# Guion del video', '', 'Video sin narración: el grupo graba la voz leyendo cada bloque y la deja en `video-salida/narracion/NN.m4a` (o `.mp3`, `.wav`); `npm run video:montar` la mezcla y alarga cada escena si hace falta.', '', '| Escena | Qué se ve | Pantallas | Duración aprox. |', '|---|---|---|---|']
  for (const e of ESCENAS) lineas.push(`| ${e.id} | ${e.titulo} | ${e.pantallas ?? '—'} | ${Math.round(duraciones[e.id] ?? e.duracion)} s |`)
  lineas.push('')
  for (const e of ESCENAS) lineas.push(`## ${e.id} · ${e.titulo}`, '', `*${e.subtitulo}*`, '', `> ${e.narracion}`, '')
  writeFileSync(`${RAIZ}docs/video/guion.md`, lineas.join('\n'))
  console.log('Listo: video-salida/clips, video-salida/placas y docs/video/guion.md')
} finally {
  await navegador.close()
  servidor.kill()
}
