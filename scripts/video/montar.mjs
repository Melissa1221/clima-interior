// Monta el video final con ffmpeg: placa de cada escena + clip del teléfono + narración (si existe) + subtítulos.
// Uso: npm run video:montar   (antes: npm run video:grabar)
// Narración opcional: video-salida/narracion/NN.m4a (o .mp3/.wav); NN es el número de escena del guion.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync, copyFileSync, rmSync } from 'node:fs'
import { ESCENAS } from './escenas.mjs'

const RAIZ = new URL('../../', import.meta.url).pathname
const S = `${RAIZ}video-salida/`
const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })
const dur = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString())
const ass = (t) => { const cs = Math.round(t * 100); const p = (n, l = 2) => String(n).padStart(l, '0'); return `${Math.floor(cs / 360000)}:${p(Math.floor(cs / 6000) % 60)}:${p(Math.floor(cs / 100) % 60)}.${p(cs % 100)}` }
const hms = (t) => { const ms = Math.round(t * 1000); const p = (n, l = 2) => String(n).padStart(l, '0'); return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}` }

rmSync(`${S}escenas`, { recursive: true, force: true }); mkdirSync(`${S}escenas`, { recursive: true })
const narracion = (id) => ['m4a', 'mp3', 'wav', 'ogg'].map((x) => `${S}narracion/${id}.${x}`).find(existsSync)

let inicio = 0
const lista = []
const srt = []
const ass_lineas = []
for (const e of ESCENAS) {
  const voz = narracion(e.id)
  const clip = `${S}clips/${e.id}.webm`
  let D = e.tipo === 'app' ? dur(clip) : e.duracion
  if (voz) D = Math.max(D, dur(voz) + 0.6) // la escena dura lo que la narración
  const salida = `${S}escenas/${e.id}.mp4`
  const entradas = ['-loop', '1', '-framerate', '30', '-i', `${S}placas/${e.id}.png`]
  let filtro = '[0:v]format=yuv420p[v]'
  if (e.tipo === 'app') {
    entradas.push('-i', clip)
    filtro = `[1:v]scale=462:1000:flags=lanczos,fps=30,tpad=stop_mode=clone:stop_duration=${D}[ph];[0:v][ph]overlay=1204:40[v]`
  }
  entradas.push(...(voz ? ['-i', voz] : ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo']))
  const idxAudio = e.tipo === 'app' ? 2 : 1
  ff([...entradas, '-filter_complex', filtro, '-map', '[v]', '-map', `${idxAudio}:a`, '-af', 'apad', '-t', String(D),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-ar', '48000', '-b:a', '160k', salida])
  lista.push(`file '${salida}'`)

  // subtítulos: la narración repartida entre las frases según su largo
  const frases = e.narracion.match(/[^.!?]+[.!?]+/g) ?? [e.narracion]
  const total = frases.reduce((a, f) => a + f.length, 0)
  let t = inicio + 0.4
  const util = D - 0.8
  for (const f of frases) {
    const largo = (f.length / total) * util
    srt.push(`${srt.length + 1}\n${hms(t)} --> ${hms(t + largo - 0.05)}\n${f.trim()}\n`)
    ass_lineas.push(`Dialogue: 0,${ass(t)},${ass(t + largo - 0.05)},Default,,0,0,0,,${f.trim()}`)
    t += largo
  }
  inicio += D
  console.log(`• escena ${e.id}: ${D.toFixed(1)} s${voz ? ' (con narración)' : ''}`)
}
writeFileSync(`${S}lista.txt`, lista.join('\n'))
writeFileSync(`${S}guion.srt`, srt.join('\n'))
mkdirSync(`${RAIZ}docs/video`, { recursive: true })
copyFileSync(`${S}guion.srt`, `${RAIZ}docs/video/guion.srt`)

ff(['-f', 'concat', '-safe', '0', '-i', `${S}lista.txt`, '-c', 'copy', `${S}sin-subtitulos.mp4`])
// Subtítulos en ASS con resolución propia (1920×1080) y confinados a la zona izquierda, fuera del teléfono
writeFileSync(`${S}guion.ass`, ['[Script Info]', 'ScriptType: v4.00+', 'PlayResX: 1920', 'PlayResY: 1080', '', '[V4+ Styles]',
  'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
  'Style: Default,Noto Sans,36,&H00FFFFFF,&H000000FF,&H99000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,1,96,860,64,1', '',
  '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text', ...ass_lineas, ''].join('\n'))
ff(['-i', `${S}sin-subtitulos.mp4`, '-vf', `ass=${S}guion.ass`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', `${S}clima-interior.mp4`])
console.log(`Listo: video-salida/clima-interior.mp4 (${Math.floor(inicio / 60)}:${String(Math.round(inicio % 60)).padStart(2, '0')})`)
