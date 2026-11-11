#!/usr/bin/env python3
"""Genera el reporte que une historias de usuario, requerimientos y código.

Entradas (única fuente de verdad):
  docs/matriz-trazabilidad.md       descripción, tipo y prioridad de cada requerimiento
  docs/historias-de-usuario.json    las 32 historias con sus escenarios
  docs/trazabilidad-codigo.json     dónde está cada requerimiento en el código y cómo se verifica

Salidas:
  docs/reporte-trazabilidad.md      con enlaces permanentes al código y capturas
  docs/reporte-trazabilidad.html    mismo contenido, listo para imprimir
  docs/reporte-trazabilidad.pdf     con --pdf (usa Chrome; ruta en CHROME_PATH)
  docs/matriz-trazabilidad.md       la columna Estado se actualiza desde el JSON

Si un enlace apunta a un archivo o símbolo que ya no existe, o si una historia y la matriz no coinciden,
el script termina con error: así el reporte no puede quedar desactualizado en silencio.

Uso: python3 scripts/generar_reporte.py [--ref main] [--pdf]
"""
import argparse, html, json, os, re, shutil, subprocess, sys
from collections import Counter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = 'https://github.com/Melissa1221/clima-interior'
ESTADOS = {'implementado': 'Implementado', 'parcial': 'Parcial', 'pendiente': 'Pendiente'}
errores = []


def ruta(*p):
    return os.path.join(RAIZ, *p)


def leer_matriz():
    reqs = {}
    for linea in open(ruta('docs/matriz-trazabilidad.md'), encoding='utf-8'):
        if re.match(r'\| (RF|RNF)-', linea):
            c = [x.strip() for x in linea.strip().strip('|').split('|')]
            reqs[c[0]] = {'desc': c[1], 'tipo': c[2], 'prioridad': c[3], 'hus': re.findall(r'HU-\d+', c[5])}
    return reqs


def buscar(archivo, aguja):
    """Línea (1-based) de la primera aparición de `aguja` en `archivo`."""
    destino = ruta(archivo)
    if not os.path.isfile(destino):
        errores.append(f'No existe {archivo}')
        return 1
    for n, linea in enumerate(open(destino, encoding='utf-8'), 1):
        if aguja in linea:
            return n
    errores.append(f'No encuentro «{aguja}» en {archivo}')
    return 1


def enlace_codigo(ref, item, ref_git):
    archivo, aguja = item.split('::', 1)
    n = buscar(archivo, aguja)
    return {'texto': f'{os.path.basename(archivo)}:{n}', 'url': f'{REPO}/blob/{ref_git}/{archivo}#L{n}', 'simbolo': aguja}


def enlace_prueba(archivo, ref_git):
    if not os.path.isfile(ruta(archivo)):
        errores.append(f'No existe la prueba {archivo}')
    cantidad = len(re.findall(r'^\s*(?:it|test)\(', open(ruta(archivo), encoding='utf-8').read(), re.M)) if os.path.isfile(ruta(archivo)) else 0
    return {'texto': f'{archivo} ({cantidad} pruebas)', 'url': f'{REPO}/blob/{ref_git}/{archivo}'}


def construir(ref_git):
    reqs = leer_matriz()
    hus = json.load(open(ruta('docs/historias-de-usuario.json'), encoding='utf-8'))
    mapa = json.load(open(ruta('docs/trazabilidad-codigo.json'), encoding='utf-8'))

    for rid in reqs:
        if rid not in mapa:
            errores.append(f'{rid} está en la matriz pero no en trazabilidad-codigo.json')
        if not reqs[rid]['hus']:
            errores.append(f'{rid} no tiene historia de usuario')
    for rid in mapa:
        if rid not in reqs:
            errores.append(f'{rid} está en trazabilidad-codigo.json pero no en la matriz')
    for h in hus:
        en_matriz = {r for r, v in reqs.items() if h['id'] in v['hus']}
        if set(h['cubre']) != en_matriz:
            errores.append(f"{h['id']}: la historia cubre {sorted(h['cubre'])} y la matriz {sorted(en_matriz)}")

    for rid, m in mapa.items():
        m['enlaces'] = [enlace_codigo(rid, c, ref_git) for c in m['codigo']]
        m['enlaces_pruebas'] = [enlace_prueba(p, ref_git) for p in m['pruebas']]
        if m['captura'] and not os.path.isfile(ruta('docs/capturas', m['captura'])):
            errores.append(f"{rid}: falta la captura docs/capturas/{m['captura']} (npm run capturas)")
        if m['estado'] == 'implementado' and not m['codigo']:
            errores.append(f'{rid} figura como implementado y no tiene código enlazado')
    return reqs, hus, mapa


def md_reporte(reqs, hus, mapa, ref_git):
    cuenta = Counter(m['estado'] for m in mapa.values())
    por_tipo = {t: Counter(mapa[r]['estado'] for r in reqs if reqs[r]['tipo'] == t) for t in ('FR', 'NFR')}
    total = len(mapa)
    o = ['# Reporte de trazabilidad: historias de usuario, requerimientos y código', '',
         'Clima Interior · Grupo 8 · CC451 Interacción Humano-Computador · UNI 2026-2', '',
         f'Cada historia de usuario (HU) se enlaza con los requerimientos que cubre (RF/RNF), el código que los implementa, '
         f'las pruebas que los verifican y una captura de la pantalla. Los enlaces apuntan a `{ref_git}` en [GitHub]({REPO}) '
         f'y se regeneran con `npm run reporte`; si algo se mueve en el código, el script falla en vez de dejar enlaces rotos.', '',
         '## Resumen de cobertura', '',
         '| Estado | Requerimientos | Funcionales (RF) | No funcionales (RNF) |', '|---|---|---|---|']
    for e, nombre in ESTADOS.items():
        o.append(f"| {nombre} | {cuenta[e]} de {total} ({round(100 * cuenta[e] / total)} %) | {por_tipo['FR'][e]} | {por_tipo['NFR'][e]} |")
    por_hu = {h['id']: Counter(mapa[r]['estado'] for r in h['cubre']) for h in hus}
    completas = [h for h in hus if por_hu[h['id']]['implementado'] == len(h['cubre'])]
    o += ['', f'**Historias completas:** {len(completas)} de {len(hus)} ({", ".join(h["id"] for h in completas)}).',
          '**Implementado** = hay código y una prueba automática o una verificación en el navegador. '
          '**Parcial** = una parte funciona y la nota dice qué falta. **Pendiente** = definido en la matriz, todavía sin código.', '']
    for h in hus:
        c = por_hu[h['id']]
        o += [f"## {h['id']}: {h['titulo']}", '', f"> {h['historia']}", '',
              f"Estado: {c['implementado']} implementados, {c['parcial']} parciales, {c['pendiente']} pendientes.", '']
        for e in h['escenarios']:
            o.append(f"- **Escenario {e['n']}: {e['titulo']}.** {e['texto']}")
        o += ['', '| Requerimiento | Estado | Código | Pruebas | Nota |', '|---|---|---|---|---|']
        capturas = []
        for rid in h['cubre']:
            m, r = mapa[rid], reqs[rid]
            cod = '<br>'.join(f"[{e['texto']}]({e['url']})" for e in m['enlaces']) or '—'
            pru = '<br>'.join(f"[{e['texto']}]({e['url']})" for e in m['enlaces_pruebas']) or '—'
            o.append(f"| **{rid}** {r['desc']} | {ESTADOS[m['estado']]} | {cod} | {pru} | {m['nota']} |")
            if m['captura'] and m['captura'] not in capturas and m['estado'] != 'pendiente':
                capturas.append((m['captura'], m['pantallas']))
        if capturas:
            o.append('')
            o.append(' '.join(f"![{n}](capturas/{n})" for n, _ in capturas[:3]))
            o.append('')
            o.append('Pantallas del Figma: ' + ', '.join(sorted({p for _, ps in capturas for p in ps})) + '.')
        o.append('')
    pend = [r for r in reqs if mapa[r]['estado'] == 'pendiente']
    o += ['## Huecos: requerimientos pendientes', '', '| Requerimiento | Historia | Por qué falta |', '|---|---|---|']
    for r in pend:
        o.append(f"| **{r}** {reqs[r]['desc']} | {', '.join(reqs[r]['hus'])} | {mapa[r]['nota']} |")
    o += ['', '## Cómo se verificó', '',
          '- `npm test`: pruebas automáticas de la capa LLM, riesgo, perfil, privacidad, exportación y accesibilidad.',
          '- `npm run capturas`: recorre la app en un navegador y regenera las capturas.',
          '- `npm run reporte`: falla si un enlace, una captura o una historia no coincide con el código o la matriz.', '']
    return '\n'.join(o)


def md_a_html(texto):
    """Conversor mínimo del Markdown que produce este script (títulos, citas, listas, tablas, imágenes, énfasis)."""
    def inline(s):
        s = html.escape(s, quote=False).replace('&lt;br&gt;', '<br>')
        s = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', r'<img alt="\1" src="\2">', s)
        s = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', s)
        s = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', s)
        return re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    out, lineas, i = [], texto.split('\n'), 0
    while i < len(lineas):
        l = lineas[i]
        if l.startswith('# '): out.append(f'<h1>{inline(l[2:])}</h1>')
        elif l.startswith('## '): out.append(f'<h2>{inline(l[3:])}</h2>')
        elif l.startswith('> '): out.append(f'<blockquote>{inline(l[2:])}</blockquote>')
        elif l.startswith('- '):
            items = []
            while i < len(lineas) and lineas[i].startswith('- '):
                items.append(f'<li>{inline(lineas[i][2:])}</li>'); i += 1
            out.append('<ul>' + ''.join(items) + '</ul>'); continue
        elif l.startswith('|'):
            filas = []
            while i < len(lineas) and lineas[i].startswith('|'):
                if not re.match(r'^\|[-| ]+\|$', lineas[i]): filas.append([c.strip() for c in lineas[i].strip('|').split('|')])
                i += 1
            t = '<table><thead><tr>' + ''.join(f'<th>{inline(c)}</th>' for c in filas[0]) + '</tr></thead><tbody>'
            t += ''.join('<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in f) + '</tr>' for f in filas[1:]) + '</tbody></table>'
            out.append(t); continue
        elif l.strip(): out.append(f'<p>{inline(l)}</p>')
        i += 1
    css = ('@page{size:A4;margin:14mm}body{font-family:"Atkinson Hyperlegible Next","Noto Sans",Arial,sans-serif;font-size:9.5pt;line-height:1.4;color:#1e2433}'
           'h1{font-size:19pt;font-family:Georgia,serif}h2{font-size:12.5pt;margin:18pt 0 4pt;padding-top:6pt;border-top:2px solid #34507a;break-after:avoid;color:#34507a}'
           'blockquote{margin:4pt 0;padding:4pt 10pt;border-left:4px solid #34507a;background:#e6eef8}table{width:100%;border-collapse:collapse;margin:6pt 0;font-size:8pt}'
           'th,td{border:1px solid #d9d3c9;padding:3pt 5pt;vertical-align:top;text-align:left}th{background:#34507a;color:#fff}tr{break-inside:avoid}'
           'code{font-size:7.5pt;background:#f1ede6;padding:0 2pt}a{color:#34507a;word-break:break-all}img{height:210px;margin:4pt 6pt 2pt 0;border:1px solid #d9d3c9;border-radius:6px}'
           'ul{margin:4pt 0;padding-left:16pt}li{margin:2pt 0}')
    return f'<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Reporte de trazabilidad</title><style>{css}</style></head><body>' + '\n'.join(out) + '</body></html>'


def actualizar_matriz(mapa):
    ruta_m = ruta('docs/matriz-trazabilidad.md')
    s = open(ruta_m, encoding='utf-8').read()
    leyenda = ('**Estado:** *Implementado* = ya funciona en la app y tiene prueba automática o verificación en el navegador. '
               '*Parcial* = una parte funciona y el reporte dice qué falta. *Pendiente* = definido, todavía sin código. '
               'El estado se actualiza solo con `npm run reporte`.')
    s = re.sub(r'\*\*Estado:\*\*[^\n]*', leyenda, s, count=1)
    def cambiar(m):
        c = m.group(0).strip().strip('|').split('|')
        rid = c[0].strip()
        if rid in mapa:
            c[6] = f' {ESTADOS[mapa[rid]["estado"]]} '
        return '|' + '|'.join(c) + '|'
    s = re.sub(r'^\| (?:RF|RNF)-.*\|$', cambiar, s, flags=re.M)
    open(ruta_m, 'w', encoding='utf-8').write(s)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ref', default='main', help='rama o commit al que apuntan los enlaces')
    ap.add_argument('--pdf', action='store_true', help='además exporta el PDF con Chrome (CHROME_PATH)')
    a = ap.parse_args()
    reqs, hus, mapa = construir(a.ref)
    if errores:
        print('Reporte NO generado:\n- ' + '\n- '.join(errores), file=sys.stderr)
        sys.exit(1)
    md = md_reporte(reqs, hus, mapa, a.ref)
    open(ruta('docs/reporte-trazabilidad.md'), 'w', encoding='utf-8').write(md)
    open(ruta('docs/reporte-trazabilidad.html'), 'w', encoding='utf-8').write(md_a_html(md))
    actualizar_matriz(mapa)
    c = Counter(m['estado'] for m in mapa.values())
    print(f"Reporte listo: {len(hus)} historias, {len(mapa)} requerimientos "
          f"({c['implementado']} implementados, {c['parcial']} parciales, {c['pendiente']} pendientes).")
    if a.pdf:
        chrome = os.environ.get('CHROME_PATH') or shutil.which('google-chrome') or shutil.which('chromium')
        if not chrome:
            sys.exit('Para --pdf define CHROME_PATH con la ruta de Chrome o Chromium.')
        destino = ruta('docs/reporte-trazabilidad.pdf')
        subprocess.run([chrome, '--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--no-pdf-header-footer',
                        f'--print-to-pdf={destino}', 'file://' + ruta('docs/reporte-trazabilidad.html')],
                       check=True, capture_output=True, timeout=120)
        print('PDF:', os.path.relpath(destino, RAIZ))


main()
