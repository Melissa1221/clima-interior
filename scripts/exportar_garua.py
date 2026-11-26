"""Exporta las poses aprobadas de Garúa (estudio-visual/personaje/garua-estados) a src/mundo/garua/.

No se redibuja nada: las poses se copian tal cual (sin <title>/<desc>, que pone la app) y las cuatro
Garúas de la sala salen del mismo generador paramétrico (garua.build) con los tintes de garua-sala.svg.
Uso: python3 scripts/exportar_garua.py [ruta a estudio-visual]
"""
import os, re, sys

EV = sys.argv[1] if len(sys.argv) > 1 else '/Users/melissaimannoriega/Documents/UNI/cl-uni/docs/2026-2/cursos/ihc/proyecto/estudio-visual'
ESTADOS = os.path.join(EV, 'personaje/garua-estados')
SALIDA = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src/mundo/garua')
os.makedirs(SALIDA, exist_ok=True)

POSES = ['flotando', 'saludo', 'escuchando', 'pensando', 'no-te-escuche', 'comprensiva', 'contenta-suave', 'inhala', 'exhala',
         'regando', 'celebracion-tranquila', 'curiosa', 'clima-sol', 'clima-nublado', 'clima-lluvia', 'clima-tormenta',
         'clima-niebla', 'dormida', 'historial-vacio', 'despedida', 'quieta', 'neutral', 'sala', 'disolviendose']

for pose in POSES:
    s = open(os.path.join(ESTADOS, f'garua-{pose}.svg')).read()
    s = re.sub(r'<title>.*?</title>|<desc>.*?</desc>', '', s, flags=re.S)
    s = re.sub(r'\s(role|aria-label)="[^"]*"', '', s)
    open(os.path.join(SALIDA, f'{pose}.svg'), 'w').write(s)

# Garúas de la sala: una por amigo (mismos tintes, ojos y boca que garua-sala.svg)
sys.path.insert(0, os.path.join(ESTADOS, 'proceso'))
from garua import build  # noqa: E402
AMIGAS = {'base': ('base', 'open', 'sonrisa'), 'lavanda': ('lavanda', 'soft', 'suave'),
          'menta': ('menta', 'feliz', 'sonrisa'), 'durazno': ('durazno', 'open', 'suave')}
for nombre, (tinte, ojos, boca) in AMIGAS.items():
    d, b = build('g', tint=tinte, ojos=ojos, boca=boca, halo=False)
    open(os.path.join(SALIDA, f'amiga-{nombre}.svg'), 'w').write(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="170" viewBox="0 0 200 170"><defs>{d}</defs>{b}</svg>')
print('ok', len(POSES) + len(AMIGAS))
