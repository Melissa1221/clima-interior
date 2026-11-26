// Ilustración del mundo de Clima Interior: cielo, lomas, amancaes, matas, piedras y gotas.
// Port literal de los generadores aprobados (estudio-visual/pantallas-v2/proceso/build/parts.py y screens.py,
// y v3-refinada/build/v3.py): mismas curvas, mismos colores y mismos argumentos, para que la app sea idéntica
// a las pantallas de diseño. Cada función devuelve el marcado SVG como texto.

const f1 = (n) => Number(n.toFixed(1))

// Cielos del estudio de color. nublado / lluvia / niebla vienen de SKIES (screens.py); soleado y tormenta
// se derivan de los cielos de día de grupo A (SKY_DAY) con los mismos cuatro tramos.
export const CIELOS = {
  nublado: ['#B4C2CF', '#D2DBE3', '#EAECE7', '#F4EDDF'],
  lluvia: ['#7FA3BB', '#9DB8CB', '#C5D7E3', '#DCE6EA'],
  niebla: ['#D9D6D0', '#E6E2DA', '#F1EEE8', '#F6F1E6'],
  soleado: ['#A9CBE0', '#CFE2EA', '#F6E9C9', '#FBF0D9'],
  tormenta: ['#575473', '#6F6B8F', '#A9A6BE', '#D8D5E2'],
  neutral: ['#C9CED3', '#DADDE0', '#ECECE8', '#F4EFE5'],
}

// Flor de amancaes (Ismene amancaes): corona amarilla en embudo + 6 tépalos finos. Origen = base del tallo.
export function amancay(x, y, s = 1.0, rot = 0, head = 24, stem = 56) {
  const tep = (a, l, w, c) => `<path d="M0 0 C${-w} ${f1(-l * 0.35)} ${f1(-w * 0.8)} ${f1(-l * 0.75)} 0 ${-l} C${f1(w * 0.8)} ${f1(-l * 0.75)} ${w} ${f1(-l * 0.35)} 0 0Z" fill="${c}" transform="rotate(${a})"/>`
  const back = tep(-62, 34, 6, '#DDA43C') + tep(62, 34, 6, '#DDA43C') + tep(-20, 40, 6, '#E3AE47') + tep(20, 40, 6, '#E3AE47')
  const front = tep(-40, 30, 5.5, '#F4CB62') + tep(40, 30, 5.5, '#F4CB62')
  const funnel = '<path d="M-5 -2 C-7 -12 -12 -22 -17 -30 Q0 -36 17 -30 C12 -22 7 -12 5 -2Z" fill="#F6CF66"/>' +
    '<path d="M-5 -2 C-6 -12 -9 -22 -12 -30 L-4 -31 C-3 -20 -2 -10 -1 -2Z" fill="#FBE29A" opacity=".8"/>' +
    '<ellipse cx="0" cy="-30.5" rx="17" ry="5.5" fill="#C98728"/>' +
    '<path d="M-17 -30 q3 -5 6 -1 q3 -5 6 -1 q3 -5 6 0 q3 -5 6 1 q3 -4 5 1" stroke="#F8DA85" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
    '<g stroke="#8A5A12" stroke-width="1.2" stroke-linecap="round" opacity=".7"><path d="M-3 -31 l-2 -7"/><path d="M0 -31 v-8"/><path d="M3 -31 l2 -7"/></g>'
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(${rot})">
  <path d="M0 0 C-2 ${f1(-stem * 0.35)} 3 ${f1(-stem * 0.7)} 8 ${-stem}" stroke="#5E8A55" stroke-width="3.4" fill="none" stroke-linecap="round"/>
  <path d="M-1 -1 C-18 -8 -28 -22 -32 -40 C-16 -30 -6 -16 -1 -1Z" fill="#6F9C61"/>
  <path d="M1 -1 C16 -10 26 -18 36 -28 C28 -12 16 -4 1 -1Z" fill="#5E8A55"/>
  <path d="M0 -1 C-8 -10 -12 -18 -14 -26 C-6 -18 -2 -10 0 -1Z" fill="#86A872"/>
  <g transform="translate(8 ${-stem}) rotate(${head})"><ellipse cx="0" cy="2" rx="3.5" ry="5" fill="#7FA36A"/>${back}${funnel}${front}</g>
</g>`
}

export const mata = (x, y, s = 1.0, c1 = '#6F9C61', c2 = '#86A872') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="20" ry="11" fill="${c1}"/><ellipse cx="-11" cy="-4" rx="11" ry="9" fill="${c2}"/><ellipse cx="9" cy="-6" rx="12" ry="10" fill="${c2}"/><ellipse cx="6" cy="-10" rx="5" ry="3" fill="#B8D1A2" opacity=".7"/></g>`

export const piedra = (x, y, s = 1.0) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="13" ry="7" fill="#A8A08F"/><ellipse cx="-2" cy="-2.5" rx="9" ry="4" fill="#BEB6A4"/></g>`

export const gotas = (puntos, color = '#8FA7BA', op = 0.7) => puntos.map(([x, y, s = 1, o]) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -6 C2 -2 4 1 4 3.2 A4 4 0 0 1 -4 3.2 C-4 1 -2 -2 0 -6Z" fill="${color}" opacity="${o ?? op}"/>`).join('')

// Matas y granitos de arena sobre el borde del suelo (v3.tufts)
export function matitas() {
  const t = [[22, 30, 1], [36, 32, 0.7], [330, 22, 1.1], [348, 22, 0.7], [196, 30, 0.8]].map(([x, y, sc]) =>
    `<g transform="translate(${x} ${y}) scale(${sc})"><path d="M0 0 C-2 -8 -6 -12 -10 -14 C-5 -9 -3 -4 -2 0Z" fill="#7CA866"/><path d="M1 0 C1 -9 3 -15 6 -18 C4 -11 4 -5 4 0Z" fill="#6F9C61"/><path d="M3 0 C6 -6 10 -9 14 -10 C10 -6 8 -3 6 0Z" fill="#86A872"/></g>`).join('')
  return t + [[120, 36, 2.2], [150, 30, 1.6], [250, 34, 2], [282, 28, 1.4], [70, 36, 1.5]].map(([x, y, r]) =>
    `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f1(r * 0.6)}" fill="#E3D5BA"/>`).join('')
}

// Borde ondulado del suelo arenoso (screens.edge)
export const BORDE = '<path d="M0 28 V14 C60 2 120 0 190 10 C260 20 320 6 375 2 V28Z"/>'

// Las flores de Inicio (v3.inicio), relativas al horizonte
export const floresInicio = (hy) =>
  `${mata(46, hy + 84, 0.9)}${mata(352, hy + 78, 0.8, '#5F8A5A', '#6F9C61')}${mata(236, hy + 104, 0.7, '#6F9C61', '#86A872')}${piedra(262, hy + 120, 0.8)}` +
  `<ellipse cx="300" cy="${hy + 118}" rx="40" ry="6" fill="#4F7A4B" opacity=".2"/>` +
  `${amancay(298, hy + 118, 1.0, -4, -14)}${amancay(340, hy + 104, 0.66, 8, 18)}${amancay(30, hy + 96, 0.6, -8, -20)}`

// Las flores de la bienvenida y el journey nuevo (journey-nuevo/build/pantallas.py · FLOWERS)
export const floresJourney = (hy, fx = 118) =>
  `${mata(46, hy + 84, 0.9)}${mata(352, hy + 78, 0.8, '#5F8A5A', '#6F9C61')}${mata(236, hy + 104, 0.7, '#6F9C61', '#86A872')}${piedra(fx + 38, hy + 122, 0.8)}` +
  `<ellipse cx="${fx + 2}" cy="${hy + 118}" rx="40" ry="6" fill="#4F7A4B" opacity=".2"/>` +
  `${amancay(fx, hy + 124, 0.86, -6, -16)}${amancay(340, hy + 104, 0.66, 8, 18)}${amancay(30, hy + 96, 0.6, -8, -20)}`

export const floresSimples = (hy) => `${mata(40, hy + 84, 0.9)}${mata(340, hy + 80, 0.8, '#5F8A5A', '#6F9C61')}${amancay(318, hy + 104, 0.8, 0, -12)}`

// Lluvia de gotas blancas sobre el cielo (refugio y oferta)
const LLUVIA = [[30, 150, 0.55], [70, 420, 0.5], [52, 300, 0.4], [110, 520, 0.45], [330, 140, 0.55], [300, 470, 0.5], [350, 330, 0.45],
  [262, 560, 0.4], [20, 520, 0.35], [355, 560, 0.4], [96, 200, 0.35], [282, 226, 0.35], [150, 90, 0.3], [230, 96, 0.3], [18, 380, 0.4],
  [360, 420, 0.4], [128, 330, 0.25], [250, 380, 0.25], [84, 560, 0.4], [316, 280, 0.35], [196, 600, 0.3], [44, 230, 0.3], [338, 210, 0.3]]
export const gotasDeLluvia = (hasta = 640) => LLUVIA.filter(([, y]) => y < hasta).map(([x, y, o]) =>
  `<path transform="translate(${x} ${y})" d="M0 -6 C2 -2 4 1 4 3.2 A4 4 0 0 1 -4 3.2 C-4 1 -2 -2 0 -6Z" fill="#fff" opacity="${o}"/>`).join('')

// Las lomas (screens.lomas). p = prefijo de ids, para poder tener varios mundos en una misma pantalla.
export function lomas({ hy = 350, cielo = 'nublado', brillo = [300, 170], mar = true, niebla = true, extra = '', H = 812, p = 'm' } = {}) {
  const s = CIELOS[cielo] ?? CIELOS.nublado
  const g = brillo ? `<circle cx="${brillo[0]}" cy="${brillo[1]}" r="190" fill="url(#${p}sun)"/>` : ''
  const seael = mar ? `<path d="M0 ${hy - 3} C60 ${hy - 4} 140 ${hy - 4} 200 ${hy - 2} C150 ${hy + 3} 90 ${hy + 6} 0 ${hy + 8}Z" fill="#BFD0D8"/><path d="M14 ${hy + 1} h26 M62 ${hy + 2} h18" stroke="#E6EEF0" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>` : ''
  const fogel = niebla ? `<ellipse cx="70" cy="${hy - 110}" rx="150" ry="20" fill="#fff" opacity=".5" filter="url(#${p}fog)"/><ellipse cx="330" cy="${hy - 190}" rx="130" ry="16" fill="#fff" opacity=".4" filter="url(#${p}fog)"/>` : ''
  return `<defs>
<linearGradient id="${p}sky" x1="0" y1="0" x2="0" y2="${hy + 20}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${s[0]}"/><stop offset=".45" stop-color="${s[1]}"/><stop offset=".85" stop-color="${s[2]}"/><stop offset="1" stop-color="${s[3]}"/></linearGradient>
<radialGradient id="${p}sun"><stop offset="0" stop-color="#FFF4D8" stop-opacity=".85"/><stop offset="1" stop-color="#FFF4D8" stop-opacity="0"/></radialGradient>
<filter id="${p}fog" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="14"/></filter>
</defs>
<rect y="-400" width="375" height="${H + 400}" fill="${s[0]}"/><rect width="375" height="${H}" fill="url(#${p}sky)"/>${g}${fogel}${seael}
<path d="M90 ${hy + 40} C130 ${hy + 10} 170 ${hy - 2} 200 ${hy - 14} C240 ${hy - 30} 280 ${hy - 26} 305 ${hy - 16} C330 ${hy - 8} 355 ${hy - 22} 375 ${hy - 28} V${hy + 120} H90Z" fill="#BCC8C6"/>
<path d="M0 ${hy + 8} C40 ${hy + 2} 80 ${hy - 4} 130 ${hy + 6} C180 ${hy + 16} 230 ${hy + 10} 290 ${hy + 18} C320 ${hy + 22} 350 ${hy + 24} 375 ${hy + 30} V${hy + 120} H0Z" fill="#C3CEC9"/>
<ellipse cx="200" cy="${hy + 10}" rx="250" ry="16" fill="#F3F1EA" opacity=".85" filter="url(#${p}fog)"/>
<path d="M0 ${hy + 36} C70 ${hy + 14} 130 ${hy + 24} 190 ${hy + 40} C240 ${hy + 52} 300 ${hy + 32} 375 ${hy + 24} V${H} H0Z" fill="#A6C68A"/>
<path d="M0 ${hy + 36} C70 ${hy + 14} 130 ${hy + 24} 190 ${hy + 40} C240 ${hy + 52} 300 ${hy + 32} 375 ${hy + 24} V${hy + 31} C300 ${hy + 40} 240 ${hy + 60} 190 ${hy + 48} C130 ${hy + 32} 70 ${hy + 22} 0 ${hy + 44}Z" fill="#C3DBA9"/>
<path d="M150 ${H} C190 ${hy + 92} 250 ${hy + 62} 375 ${hy + 56} V${H}Z" fill="#8BB474"/>
<path d="M150 ${H} C190 ${hy + 92} 250 ${hy + 62} 375 ${hy + 56} V${hy + 62} C260 ${hy + 70} 200 ${hy + 100} 162 ${H}Z" fill="#A2C589"/>
<path d="M0 ${H} V${hy + 72} C50 ${hy + 62} 110 ${hy + 82} 150 ${hy + 122} C170 ${hy + 142} 180 ${hy + 158} 186 ${H}Z" fill="#7CA866"/>
<path d="M118 ${H} C150 ${hy + 142} 210 ${hy + 122} 262 ${hy + 114} C232 ${hy + 132} 216 ${hy + 152} 212 ${H}Z" fill="#E6D7B8"/>
${extra}`
}

// Estrellas de la noche (inicio-noche de grupo A)
export const estrellas = () => [[40, 236, 1.1, 0.7], [96, 470, 0.9, 0.5], [150, 104, 1, 0.6], [196, 232, 0.8, 0.45], [262, 92, 1.2, 0.7],
  [330, 118, 0.9, 0.55], [352, 260, 1, 0.6], [24, 420, 0.8, 0.4], [178, 470, 0.8, 0.4], [300, 440, 0.9, 0.45], [120, 250, 0.7, 0.4]]
  .map(([x, y, r, o]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#E8EDF2" opacity="${o}"/>`).join('')

// Horizonte calmo de la pantalla de crisis (v3.crisis): sin Garúa ni animación
export const horizonteCrisis = (p = 'c') => `<defs><linearGradient id="${p}cs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9E2D8"/><stop offset=".75" stop-color="#F3EEE6"/><stop offset="1" stop-color="#F6F2EB"/></linearGradient>
<linearGradient id="${p}fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6F4EF" stop-opacity="0"/><stop offset="1" stop-color="#F6F4EF"/></linearGradient></defs>
<rect width="375" height="300" fill="url(#${p}cs)"/>
<circle cx="306" cy="252" r="30" fill="#F1E0C9"/><path d="M0 250 C70 240 130 242 190 247 C250 252 310 244 375 242 V300 H0Z" fill="#DCD5C8"/>
<path d="M0 260 C90 255 200 256 375 260 V300 H0Z" fill="#E6E1D7"/>
<rect y="246" width="375" height="54" fill="url(#${p}fade)"/>`
