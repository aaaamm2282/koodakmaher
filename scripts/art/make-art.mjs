// Draws the site's cut-paper illustrations into src/assets/art/*.svg (node scripts/art/make-art.mjs).
// Colours are the logo's navy and gold plus four craft-paper colours (the --color-paper-* tokens in
// src/styles/global.css). Every drawing is decoration: the page says the same things in text.
// Same seeds, same drawings: run it again after a change and commit the SVG files with this script.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cut, ellipse, roundRect, hill, hillY, spline, ribbon, piece, layer, shadows } from './paper.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, 'src/assets/art');
fs.mkdirSync(out, { recursive: true });

export const C = {
  navy: '#01237a', night: '#011a5c', gold: '#d9b25a', cream: '#f7f1e3', white: '#fffaf0',
  saffron: '#e3a93c', vermilion: '#c4482e', turquoise: '#2b9c97', leaf: '#3f7a3c', ink: '#17201c', sky: '#2a4a9e',
};
const naskh = `font-family="'Noto Naskh Arabic Variable','Noto Naskh Arabic',serif" font-weight="600"`;
const svg = (w, h, body, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"${extra}>${shadows}${body}</svg>`;

// ---------------------------------------------------------------- shared pieces
// A cypress (سرو), the Persian garden's upright tree: a tall flame whose tip bends a little, like a boteh
function cypress(x, base, h, seed, tone = C.leaf, curl = 1) {
  const w = h * 0.17, L = [], R = [];
  for (let i = 0; i <= 28; i++) {
    const t = i / 28, y = base - h * t;
    const half = w * Math.pow(Math.min(1, t / 0.1), 0.5) * Math.pow(1 - t, 0.62) * (1 + 0.25 * Math.sin(Math.PI * t));
    const bend = curl * h * 0.07 * Math.pow(t, 3);
    L.push([x + bend - half, y]); R.push([x + bend + half, y]);
  }
  return piece(cut([...R, ...L.reverse()], { seed, amp: 0.6, wave: 12, step: 4 }), tone);
}

// A kite (بادبادک) of four paper triangles, with a string and a tail of bows
function kite(cx, cy, s, seed) {
  const T = [cx, cy - 46 * s], R = [cx + 34 * s, cy - 6 * s], B = [cx, cy + 58 * s], Lf = [cx - 34 * s, cy - 6 * s], M = [cx, cy - 6 * s];
  const tail = spline([B, [cx + 10 * s, cy + 100 * s], [cx - 14 * s, cy + 140 * s], [cx + 6 * s, cy + 186 * s]], 4);
  let bows = '';
  [0.3, 0.55, 0.8].forEach((k, i) => {
    const [bx, by] = tail[Math.floor(k * (tail.length - 1))], col = i % 2 ? C.gold : C.vermilion;
    bows += piece(cut([[bx - 9 * s, by - 6 * s], [bx, by], [bx - 9 * s, by + 6 * s]], { seed: seed + 10 + i, amp: 0.4, step: 3 }), col);
    bows += piece(cut([[bx + 9 * s, by - 6 * s], [bx, by], [bx + 9 * s, by + 6 * s]], { seed: seed + 20 + i, amp: 0.4, step: 3 }), col);
  });
  const sail = [[T, R, M, C.vermilion], [R, B, M, C.saffron], [B, Lf, M, C.cream], [Lf, T, M, C.turquoise]]
    .map(([a, b, c, col], i) => piece(cut([a, b, c], { seed: seed + i, amp: 0.6, step: 5 }), col)).join('');
  return `<path d="M${tail.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}" fill="none" stroke="${C.cream}" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>` +
    layer(bows, 1) + layer(sail + `<path d="M${T.join(' ')}L${B.join(' ')}M${Lf.join(' ')}L${R.join(' ')}" stroke="${C.night}" stroke-width="1.4" opacity=".55"/>`, 2);
}

// ---------------------------------------------------------------- the home hero: the path from 3 to 18 over the hills
// Each hill is one stretch of the path and has its unit's colour: saffron 3 to 6 (kindergarten), vermilion 6 to 12
// (primary), turquoise 12 to 15 (middle school), and the far hill, dashed, 15 to 18 (still to come).
// Group classes (a-*) are the hero's entrance in global.css.
// A paper cloud: the outline of a few overlapping bumps over a flat bottom, cut as one piece
function cloud(cx, cy, w, seed, fill) {
  const bumps = [[-0.3, 0.06, 0.2], [-0.1, -0.1, 0.27], [0.16, -0.04, 0.23], [0.34, 0.08, 0.16]].map(([x, y, r]) => [cx + x * w, cy + y * w, r * w]);
  const bottom = cy + 0.2 * w, pts = [];
  for (let i = 0; i < 144; i++) {
    const a = (i / 144) * Math.PI * 2, ux = Math.cos(a), uy = Math.sin(a);
    let far = 0;
    for (const [x, y, r] of bumps) {
      const dx = cx - x, dy = cy - y, b = dx * ux + dy * uy, c = dx * dx + dy * dy - r * r, disc = b * b - c;
      if (disc >= 0) far = Math.max(far, -b + Math.sqrt(disc));
    }
    let px = cx + ux * far, py = cy + uy * far;
    if (py > bottom) { const t = (bottom - cy) / uy; px = cx + ux * t; py = bottom; }
    pts.push([+px.toFixed(1), +py.toFixed(1)]);
  }
  return piece(cut(pts, { seed, amp: 0.7, step: 6, wave: 24 }), fill);
}

// The home hero: a sheet of night-blue paper; a cream path climbs the hills from 3 (bottom, right: where reading starts)
// to 18, past the sun. 720 x 900, cut from its foot (xMidYMax slice): every age stays inside x 130-640 and below
// y 380, so all five show whole from a tall column (aspect 0.62, sides cut) to a square sheet (sky cut).
function hero() {
  const W = 720, H = 900, box = [W, H], p = [], dy = 120;
  const hill2 = (h, seed) => cut(hill(h[0], h[1], h[2] + dy, h[3] + dy, { lean: h[4], floor: H + 60, n: 40 }), { seed, amp: 1.6, step: 8, box });
  p.push(`<rect width="${W}" height="${H}" fill="${C.navy}"/>`);
  p.push(`<g class="a-cloud a-cloud-hi">${layer(cloud(560, 196, 150, 81, C.sky), 1)}</g>`);
  p.push(`<g class="a-sun">${layer(piece(cut(ellipse(176, 182 + dy, 64), { seed: 3, amp: 1.2, step: 7 }), C.gold), 2)}</g>`);
  p.push(`<g class="a-cloud" style="--d:.3s">${layer(cloud(150, 250, 132, 82, C.sky), 1)}</g>`);
  p.push(`<g class="a-kite">${kite(520, 214 + dy, 1, 51)}</g>`);
  const hFar = [-120, 330, 600, 330, 0.6], hT = [-60, 520, 760, 402, 0.5], hV = [200, 700, 840, 482, 0.5], hS = [420, 900, 880, 586, 0.42];
  const on = (h) => { const f = hillY(h[0], h[1], h[2] + dy, h[3] + dy, h[4]); return (x) => f(x); };
  p.push(`<g class="a-far"><path d="${hill2(hFar, 21)}" fill="${C.night}" stroke="${C.cream}" stroke-opacity=".6" stroke-width="2" stroke-dasharray="7 7"/></g>`);
  p.push(`<g class="a-hill" style="--d:.14s">${layer(piece(hill2(hT, 22), C.turquoise), 3)}${layer(cypress(64, on(hT)(64) + 6, 92, 62) + cypress(100, on(hT)(100) + 6, 66, 63, '#356b3a', -1), 2)}</g>`);
  p.push(`<g class="a-hill" style="--d:.24s">${layer(piece(hill2(hV, 23), C.vermilion), 3)}${layer(cypress(520, on(hV)(520) + 6, 84, 64) + cypress(552, on(hV)(552) + 6, 58, 65, '#356b3a', -1), 2)}</g>`);
  p.push(`<g class="a-hill" style="--d:.31s">${layer(piece(hill2(hS, 24), C.saffron), 3)}</g>`);
  // the path: a cream paper strip from the bottom edge up to the sun
  const way = [[650, 930], [606, 844], [532, 792], [458, 726], [390, 680], [312, 630], [236, 582], [186, 532], [156, 480], [158, 430], [172, 388]];
  p.push(`<g class="a-path">${layer(piece(cut(ribbon(spline(way, 5), 20, 0.5), { seed: 31, amp: 0.8, wave: 20, step: 5, box }), C.cream), 2)}</g>`);
  // stops on the path: ages as paper discs; the two choice points are gold. --d: when the climbing path reaches
  // each one (its reveal runs .52s + 1.1s on the in-out curve in global.css; worked out from that curve)
  const stops = [[604, 844, '۳', 0, 0.83], [458, 726, '۶', 0, 0.96], [312, 630, '۱۲', 0, 1.03], [186, 532, '۱۵', 1, 1.11], [160, 420, '۱۸', 1, 1.29]];
  stops.forEach(([x, y, t, gold, d], i) => {
    p.push(`<g class="a-stop" style="--d:${d}s">${layer(piece(cut(ellipse(x, y, 27, 27, 44), { seed: 40 + i, amp: 0.9, step: 5 }), gold ? C.gold : C.cream), 2)}` +
      `<text x="${x}" y="${y + 9}" text-anchor="middle" font-size="27" ${naskh} fill="${C.navy}">${t}</text></g>`);
  });
  return svg(W, H, p.join(''), ' preserveAspectRatio="xMidYMax slice"');
}

// ---------------------------------------------------------------- emblems of the units, 160 x 160, on the unit's paper
// Three alphabet blocks: آ on top, then ب and پ, in reading order from the right
function blocks() {
  const cube = (x, y, s, face, top, side, letter, ink, seed) => {
    const d = s * 0.28;
    return layer(
      piece(cut([[x, y], [x + s, y], [x + s + d, y - d], [x + d, y - d]], { seed, amp: 0.5, step: 5 }), top) +
      piece(cut([[x + s, y], [x + s + d, y - d], [x + s + d, y + s - d], [x + s, y + s]], { seed: seed + 1, amp: 0.5, step: 5 }), side) +
      piece(cut(roundRect(x, y, s, s, 3, 2), { seed: seed + 2, amp: 0.6, step: 5 }), face) +
      `<text x="${x + s / 2}" y="${(y + s * 0.7).toFixed(1)}" text-anchor="middle" font-size="${(s * 0.56).toFixed(1)}" ${naskh} fill="${ink}">${letter}</text>`, 2);
  };
  return svg(160, 160, cube(24, 92, 50, C.cream, '#fff8ea', '#e6dcc6', 'پ', C.navy, 1) + cube(80, 92, 50, C.vermilion, '#e0735a', '#a9422b', 'ب', C.cream, 5) + cube(52, 38, 50, C.turquoise, '#5bb7b2', '#1f7a76', 'آ', C.cream, 9));
}

function bookPencil() {
  const L = [[18, 58], [78, 66], [78, 132], [18, 124]], R = [[82, 66], [142, 58], [142, 124], [82, 132]];
  let pages = piece(cut(L, { seed: 2, amp: 0.6, step: 5 }), C.cream) + piece(cut(R, { seed: 3, amp: 0.6, step: 5 }), C.white);
  for (let i = 0; i < 5; i++) { const y = 80 + i * 10; pages += `<path d="M26 ${y - 6 + i * 0.4}L70 ${y + i * 0.4}M90 ${y + i * 0.4}L134 ${y - 6 + i * 0.4}" stroke="#9fb3d9" stroke-width="1.2"/>`; }
  const a = -0.62, len = 112, w = 13, x0 = 34, y0 = 120;
  const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux, P = (t, o) => [x0 + ux * t + nx * o, y0 + uy * t + ny * o].map((v) => +v.toFixed(1));
  const pencil = piece(cut([P(0, -w / 2), P(14, -w / 2), P(14, w / 2), P(0, w / 2)], { seed: 4, amp: 0.4, step: 4 }), '#f2b8a8') +
    piece(cut([P(14, -w / 2), P(len - 22, -w / 2), P(len - 22, w / 2), P(14, w / 2)], { seed: 5, amp: 0.4, step: 5 }), C.gold) +
    piece(cut([P(len - 22, -w / 2), P(len, 0), P(len - 22, w / 2)], { seed: 6, amp: 0.4, step: 4 }), '#f3dcb5') +
    `<path d="M${P(len - 7, -1.8).join(' ')}L${P(len, 0).join(' ')}L${P(len - 7, 1.8).join(' ')}Z" fill="${C.ink}"/>` +
    `<path d="M${P(16, 0).join(' ')}L${P(len - 24, 0).join(' ')}" stroke="#b8923e" stroke-width="1.2"/>`;
  return svg(160, 160, layer(piece(cut([[14, 62], [80, 70], [146, 62], [146, 132], [80, 140], [14, 132]], { seed: 1, amp: 0.7, step: 5 }), C.navy), 2) + layer(pages, 1) + layer(pencil, 3));
}

function compass() {
  const sq = piece(cut([[22, 134], [134, 134], [22, 30]], { seed: 1, amp: 0.7, step: 5 }), C.cream) +
    `<path d="${cut([[40, 120], [92, 120], [40, 72]], { seed: 2, amp: 0.5, step: 5 })}" fill="${C.turquoise}"/>` +
    Array.from({ length: 9 }, (_, i) => `<path d="M${30 + i * 11} 134V${i % 2 ? 127 : 124}" stroke="${C.navy}" stroke-width="1.2" opacity=".7"/>`).join('');
  const hx = 104, hy = 30;
  const legs = piece(cut([[hx - 4, hy + 6], [hx + 4, hy + 6], [hx - 18, hy + 112], [hx - 25, hy + 110]], { seed: 3, amp: 0.4, step: 5 }), C.navy) +
    piece(cut([[hx - 4, hy + 6], [hx + 4, hy + 6], [hx + 30, hy + 108], [hx + 23, hy + 110]], { seed: 4, amp: 0.4, step: 5 }), C.navy) +
    `<path d="M${hx + 26} ${hy + 108}L${hx + 28} ${hy + 120}" stroke="${C.ink}" stroke-width="2.4" stroke-linecap="round"/>` +
    piece(cut(ellipse(hx, hy + 6, 10, 10, 28), { seed: 5, amp: 0.4, step: 4 }), C.gold) +
    `<path d="M${hx} ${hy - 4}V${hy - 14}" stroke="${C.gold}" stroke-width="4" stroke-linecap="round"/>`;
  return svg(160, 160, layer(sq, 2) + layer(legs, 3));
}

// Still to come: an empty sheet drawn in dashes, in the text colour of its tile
function soon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><path d="${cut(roundRect(36, 26, 88, 112, 6, 3), { seed: 1, amp: 0.6, step: 6 })}" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="6 6" opacity=".7"/><path d="M54 62H106M54 80H106M54 98H88" stroke="currentColor" stroke-width="2" stroke-dasharray="6 6" opacity=".45"/></svg>`;
}

function speech() {
  const bubble = (x, y, w, h, tailX, dir, seed) => {
    const r = roundRect(x, y, w, h, 16, 5);
    return cut([...r.slice(0, 14), [tailX + dir * 18, y + h], [tailX + dir * 4, y + h + 22], [tailX, y + h], ...r.slice(14)], { seed, amp: 0.8, step: 5 });
  };
  return svg(160, 160,
    layer(piece(bubble(56, 22, 88, 64, 120, -1, 1), C.gold) + `<text x="100" y="66" text-anchor="middle" font-size="34" font-family="Georgia,'Times New Roman',serif" font-weight="700" fill="${C.navy}">A</text>`, 2) +
    layer(piece(bubble(16, 72, 92, 62, 40, 1, 2), C.cream) + `<text x="62" y="116" text-anchor="middle" font-size="34" ${naskh} fill="${C.navy}">الف</text>`, 3));
}

function gear() {
  const pts = [], n = 10, R = 44, r = 34;
  for (let i = 0; i < n * 4; i++) { const a = (i / (n * 4)) * Math.PI * 2, rr = i % 4 < 2 ? R : r; pts.push([66 + Math.cos(a) * rr, 70 + Math.sin(a) * rr]); }
  const g = piece(cut(pts, { seed: 1, amp: 0.5, step: 4 }), C.cream) + `<path d="${cut(ellipse(66, 70, 14, 14, 32), { seed: 2, amp: 0.4, step: 4 })}" fill="${C.leaf}"/>`;
  const a = 0.78, ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux, x0 = 76, y0 = 76, P = (t, o) => [x0 + ux * t + nx * o, y0 + uy * t + ny * o].map((v) => +v.toFixed(1));
  const [hx, hy] = P(72, 0);
  const spanner = piece(cut([P(0, -7), P(66, -7), P(66, 7), P(0, 7)], { seed: 3, amp: 0.4, step: 5 }), C.gold) +
    piece(cut(ellipse(hx, hy, 16, 16, 32), { seed: 4, amp: 0.4, step: 4 }), C.gold) +
    `<path d="M${P(78, -6).join(' ')}L${P(92, -6).join(' ')}L${P(92, 6).join(' ')}L${P(78, 6).join(' ')}Z" fill="${C.leaf}"/>`;
  return svg(160, 160, layer(g, 2) + layer(spanner, 3));
}

// ---------------------------------------------------------------- the method's three steps, 120 x 120
// Predict: a thought bubble with a question mark. Experience: a paper plane on its first flight.
// Review: a magnifier over the page where the guess was written.
function predict() {
  const b = ellipse(64, 54, 42, 32, 64);
  return svg(120, 120,
    layer(piece(cut(b, { seed: 1, amp: 0.9, step: 5 }), C.cream) + piece(cut(ellipse(30, 94, 9, 8, 24), { seed: 2, amp: 0.4, step: 4 }), C.cream) + piece(cut(ellipse(18, 108, 5, 5, 16), { seed: 3, amp: 0.3, step: 4 }), C.cream), 2) +
    `<text x="64" y="70" text-anchor="middle" font-size="46" ${naskh} fill="${C.navy}">؟</text>`);
}
function plane() {
  const m = (pts) => pts.map(([x, y]) => [120 - x, y]); // drawn flying right, mirrored to fly toward the reading direction
  const trail = spline(m([[14, 104], [34, 92], [44, 98], [56, 84], [74, 70]]), 3);
  return svg(120, 120,
    `<path d="M${trail.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}" fill="none" stroke="${C.cream}" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="5 6" opacity=".9"/>` +
    layer(piece(cut(m([[108, 18], [40, 52], [66, 62]]), { seed: 1, amp: 0.5, step: 5 }), C.white) + piece(cut(m([[108, 18], [66, 62], [74, 92]]), { seed: 2, amp: 0.5, step: 5 }), '#e6dcc6') + piece(cut(m([[108, 18], [66, 62], [60, 76]]), { seed: 3, amp: 0.4, step: 5 }), '#cfc3a8'), 3));
}
function magnifier() {
  let sheet = piece(cut(roundRect(14, 14, 66, 84, 5, 3), { seed: 1, amp: 0.6, step: 5 }), C.white);
  for (let i = 0; i < 4; i++) sheet += `<path d="M24 ${34 + i * 13}H${i === 3 ? 52 : 70}" stroke="#9fb3d9" stroke-width="1.6"/>`;
  sheet += `<path d="M25 30.5l5 5 9-10" fill="none" stroke="${C.vermilion}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  const glass = piece(cut([[86, 84], [94, 78], [112, 100], [104, 107]], { seed: 2, amp: 0.4, step: 4 }), C.navy) +
    piece(cut(ellipse(72, 66, 26, 26, 48), { seed: 3, amp: 0.6, step: 5 }), C.gold) +
    `<circle cx="72" cy="66" r="18" fill="#e9f4f3" opacity=".92"/><path d="M60 58a14 14 0 0 1 10-8" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
  return svg(120, 120, layer(sheet, 1) + layer(glass, 3));
}

// ---------------------------------------------------------------- a strip of hills for the foot of a page heading
// Wide and low; on a narrow screen its sides are cut off (xMidYMax slice), so the hills keep their shape.
function hills() {
  const W = 1600, H = 150, box = [W, H];
  const hs = [ // x0, x1, top, lean, colour: far ones first
    [-90, 470, 54, 0.55, C.turquoise], [930, 1480, 46, 0.5, C.turquoise],
    [260, 900, 80, 0.45, C.vermilion], [1290, 1720, 74, 0.5, C.vermilion],
    [-60, 330, 104, 0.5, C.saffron], [640, 1280, 98, 0.42, C.saffron],
  ];
  const shape = ([x0, x1, top, lean], i) => cut(hill(x0, x1, H + 4, top, { lean, floor: H + 30, n: 36 }), { seed: 11 + i, amp: 1.4, step: 9, box });
  const on = (i) => hillY(hs[i][0], hs[i][1], H + 4, hs[i][2], hs[i][3]);
  const trees = (i, x, h, seed) => cypress(x, on(i)(x) + 4, h, seed) + cypress(x + 26, on(i)(x + 26) + 4, h * 0.68, seed + 1, '#356b3a', -1);
  const far = hs.slice(0, 2).map((h, i) => piece(shape(h, i), h[4])).join('');
  const mid = hs.slice(2, 4).map((h, i) => piece(shape(h, i + 2), h[4])).join('');
  const near = hs.slice(4).map((h, i) => piece(shape(h, i + 4), h[4])).join('');
  return svg(W, H, layer(far, 2) + layer(trees(0, 150, 44, 31) + trees(1, 1150, 40, 33), 2) + layer(mid, 3) + layer(near, 3), ' preserveAspectRatio="xMidYMax slice"');
}

// A lower strip for the foot of every page heading (PageHero.astro): 1600 x 72, drawn whole (no tree or hilltop above
// the top edge), so it can be shown at its full height on wide screens and cut only at the sides on phones
function hillsLow() {
  const W = 1600, H = 72, box = [W, H];
  const hs = [ // x0, x1, top, lean, colour: far ones first
    [-80, 520, 20, 0.55, C.turquoise], [960, 1500, 16, 0.5, C.turquoise],
    [300, 940, 34, 0.45, C.vermilion], [1320, 1760, 30, 0.5, C.vermilion],
    [-60, 380, 46, 0.5, C.saffron], [680, 1300, 44, 0.42, C.saffron],
  ];
  const shape = ([x0, x1, top, lean], i) => cut(hill(x0, x1, H + 4, top, { lean, floor: H + 24, n: 36 }), { seed: 51 + i, amp: 1.1, step: 9, box });
  const on = (i) => hillY(hs[i][0], hs[i][1], H + 4, hs[i][2], hs[i][3]);
  // a pair of cypresses on the shoulder of each far hill, where the slope is low enough for the whole tree to show
  const trees = (i, x, h, seed) => cypress(x, on(i)(x) + 3, h, seed) + cypress(x + 15, on(i)(x + 15) + 3, h * 0.7, seed + 1, '#356b3a', -1);
  const far = hs.slice(0, 2).map((h, i) => piece(shape(h, i), h[4])).join('');
  const mid = hs.slice(2, 4).map((h, i) => piece(shape(h, i + 2), h[4])).join('');
  const near = hs.slice(4).map((h, i) => piece(shape(h, i + 4), h[4])).join('');
  return svg(W, H, layer(far, 1) + layer(trees(0, 384, 24, 71) + trees(1, 1366, 22, 73), 1) + layer(mid, 2) + layer(near, 2), ' preserveAspectRatio="xMidYMax slice"');
}

const files = {
  'hero-path.svg': hero(),
  'unit-kindergarten.svg': blocks(), 'unit-primary.svg': bookPencil(), 'unit-middle-school.svg': compass(),
  'unit-high-school.svg': soon(), 'unit-language.svg': speech(), 'unit-vocational.svg': gear(),
  'step-predict.svg': predict(), 'step-experience.svg': plane(), 'step-review.svg': magnifier(),
  'hills.svg': hills(), 'hills-low.svg': hillsLow(),
};
for (const [name, s] of Object.entries(files)) fs.writeFileSync(path.join(out, name), s + '\n');
console.log('art ->', Object.keys(files).map((n) => `${n} ${(fs.statSync(path.join(out, n)).size / 1024).toFixed(1)} KB`).join(', '));
