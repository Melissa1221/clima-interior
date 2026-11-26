// M3: la app le habla a cualquier persona. Ningún texto de la interfaz (ni los datos de ejemplo) asume género.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const PROHIBIDAS = [/ponte c[oó]mod[ao]/i, /\buna amiga\b/i, /\bun amigo\b/i, /me sent[ií] (ligera|ligero|sola|solo)\b/i,
  /\bqu[eé]date tranquil[ao]\b/i, /\best[aá]s (list[ao]|segur[ao]|cansad[ao])\b/i]

function archivos(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? archivos(join(dir, e.name)) : [join(dir, e.name)]))
}

// Solo el texto que ve la persona: sin comentarios
const textoVisible = (codigo) => codigo.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n')

describe('textos neutros en género (M3)', () => {
  const fuentes = archivos('src').filter((f) => /\.(jsx?|json)$/.test(f)).concat(['public/demo/registros-30-dias.json'])
  it.each(fuentes)('%s', (f) => {
    const t = textoVisible(readFileSync(f, 'utf8'))
    for (const re of PROHIBIDAS) expect(t, `${f}: ${re}`).not.toMatch(re)
  })
})
