// Cut-paper drawing helpers for the site's illustrations (scripts/art/make-art.mjs).
// Every shape is a list of points resampled along its outline and pushed in and out a little with smooth noise,
// so edges read as cut with scissors rather than drawn with a ruler. Same seed, same drawing.

export function rng(seed = 1) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

const f = (n) => (Math.round(n * 10) / 10).toString();

// Smooth 1-D noise along the outline: random knots every `wave` px, cosine-blended between them
function wobble(total, wave, amp, r) {
  const knots = Array.from({ length: Math.ceil(total / wave) + 2 }, () => (r() * 2 - 1) * amp);
  return (s) => {
    const i = Math.floor(s / wave), t = s / wave - i, k = (1 - Math.cos(Math.PI * t)) / 2;
    return knots[i] * (1 - k) + knots[i + 1] * k;
  };
}

// Points (closed outline) -> SVG path data with a cut edge
// `box` = [width, height] of the drawing: a segment that runs wholly outside it (the part of a hill below the frame)
// is kept straight instead of resampled, since nobody sees its edge.
export function cut(points, { amp = 1.2, step = 6, wave = 34, seed = 1, closed = true, box = null } = {}) {
  const r = rng(seed), n = points.length, segs = closed ? n : n - 1;
  let total = 0;
  for (let i = 0; i < segs; i++) { const [a, b] = [points[i], points[(i + 1) % n]]; total += Math.hypot(b[0] - a[0], b[1] - a[1]); }
  const w = wobble(total, wave, amp, r), out = [];
  let s = 0;
  for (let i = 0; i < segs; i++) {
    const [x0, y0] = points[i], [x1, y1] = points[(i + 1) % n], len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const off = box && [[x0, y0], [x1, y1]].every(([x, y]) => x < -4 || x > box[0] + 4 || y > box[1] + 4 || y < -4);
    const k = off ? 1 : Math.max(1, Math.round(len / step)), nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
    for (let j = 0; j < k; j++) {
      const t = j / k, d = off ? 0 : w(s + len * t) + (r() - 0.5) * amp * 0.25;
      out.push([x0 + (x1 - x0) * t + nx * d, y0 + (y1 - y0) * t + ny * d]);
    }
    s += len;
  }
  if (!closed) out.push(points[n - 1]);
  return 'M' + out.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + (closed ? 'Z' : '');
}

export function ellipse(cx, cy, rx, ry = rx, n = 72, rot = 0) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
  });
}

export function roundRect(x, y, w, h, rad = 8, n = 6) {
  const pts = [], c = [[x + w - rad, y + rad, -Math.PI / 2], [x + w - rad, y + h - rad, 0], [x + rad, y + h - rad, Math.PI / 2], [x + rad, y + rad, Math.PI]];
  for (const [cx, cy, a0] of c) for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * (Math.PI / 2); pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); }
  return pts;
}

export function poly(...pts) { return pts; }

// A hill: a soft bell from (x0, base) up to height `top` and down to (x1, base), closed along `floor`.
// hillY gives the height of the same hill's top edge at any x, to stand things on it.
export function hillY(x0, x1, base, top, lean = 0.5) {
  return (x) => {
    const t = Math.min(1, Math.max(0, (x - x0) / (x1 - x0)));
    const u = t < lean ? t / lean / 2 : 0.5 + (t - lean) / (1 - lean) / 2;
    return base - (base - top) * Math.pow(Math.sin(Math.PI * u), 1.35);
  };
}
export function hill(x0, x1, base, top, { floor = base + 400, lean = 0.5, n = 48 } = {}) {
  const y = hillY(x0, x1, base, top, lean), pts = [];
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * (i / n); pts.push([x, y(x)]); }
  pts.push([x1, floor], [x0, floor]);
  return pts;
}

// Catmull-Rom spline through waypoints, sampled every `step` px
export function spline(way, step = 4) {
  const out = [];
  for (let i = 0; i < way.length - 1; i++) {
    const p0 = way[i - 1] || way[i], p1 = way[i], p2 = way[i + 1], p3 = way[i + 2] || p2;
    const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), k = Math.max(2, Math.round(len / step));
    for (let j = 0; j < k; j++) {
      const t = j / k, t2 = t * t, t3 = t2 * t;
      const c = (a, b, cc, d) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(way[way.length - 1]);
  return out;
}

// A paper strip of width `w` along a centre line (points), as a closed outline
export function ribbon(line, w = 14, taper = 0) {
  const L = [], R = [];
  for (let i = 0; i < line.length; i++) {
    const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const k = 1 - taper * (i / (line.length - 1)), h = (w * k) / 2;
    L.push([line[i][0] - (dy / len) * h, line[i][1] + (dx / len) * h]);
    R.push([line[i][0] + (dy / len) * h, line[i][1] - (dx / len) * h]);
  }
  return [...L, ...R.reverse()];
}

// One paper piece. Its shadow comes from the layer it sits in (layer below), so the path is written once.
export function piece(d, fill, extra = '') {
  return `<path d="${d}" fill="${fill}"${extra}/>`;
}

// A layer of pieces lying at one height above the paper under them: a soft shadow falls down and toward the
// reading start. Filter ids carry __ID__, which the page replaces per drawing (src/components/Art.astro), so two
// drawings on one page never share an id.
export const shadows = `<defs>${[[0.8, 1.4, 0.9, 0.26], [1.4, 2.4, 1.5, 0.28], [2, 3.4, 2.2, 0.3]].map(([dx, dy, sd, op], i) =>
  `<filter id="__ID__s${i + 1}" x="-20%" y="-20%" width="140%" height="150%" color-interpolation-filters="sRGB"><feDropShadow dx="${dx}" dy="${dy}" stdDeviation="${sd}" flood-color="#0a1433" flood-opacity="${op}"/></filter>`).join('')}</defs>`;
export function layer(content, lift = 2, cls = '') {
  return `<g filter="url(#__ID__s${lift})"${cls ? ` class="${cls}"` : ''}>${content}</g>`;
}
