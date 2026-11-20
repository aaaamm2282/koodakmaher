// Turns the line icons in src/components/Icon.astro into small Lottie animations that
// "draw" themselves (an animated trim path), saved to src/assets/lottie/<icon>.json.
// Run: node scripts/make-lottie.mjs   (the JSON files are committed; rerun after changing an icon)
import fs from 'node:fs';
import path from 'node:path';
import svgpath from 'svgpath';

const ICONS = ['bulb', 'hammer', 'palette', 'cpu', 'zap', 'users', 'blocks', 'pencil', 'compass', 'chat', 'wrench', 'flag'];
const COLOR = [1 / 255, 35 / 255, 122 / 255, 1]; // brand navy #01237a
const FPS = 60;
const DRAW = 54; // frames: 0.9 s
const EASE_OUT = { o: { x: [0.23], y: [1] }, i: { x: [0.32], y: [1] } }; // cubic-bezier(.23,1,.32,1)

const src = fs.readFileSync(path.resolve('src/components/Icon.astro'), 'utf8');
const icons = Object.fromEntries([...src.matchAll(/^\s{2}([a-z]+): '(.+)',$/gm)].map((m) => [m[1], m[2]]));

const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([a-z-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
const r3 = (n) => Math.round(n * 1000) / 1000;
const st = (k) => ({ a: 0, k });

/** SVG path data -> Lottie bezier shapes (one per subpath). */
function pathShapes(d) {
  const subs = [];
  let cur = null;
  const push = (x, y, ix = 0, iy = 0) => { cur.v.push([r3(x), r3(y)]); cur.i.push([r3(ix), r3(iy)]); cur.o.push([0, 0]); };
  svgpath(d).abs().unshort().unarc().iterate((seg, _i, x, y) => {
    const [cmd, ...a] = seg;
    if (cmd === 'M') { cur = { v: [], i: [], o: [], c: false }; subs.push(cur); push(a[0], a[1]); return; }
    if (cmd === 'L') return push(a[0], a[1]);
    if (cmd === 'H') return push(a[0], y);
    if (cmd === 'V') return push(x, a[0]);
    if (cmd === 'C') {
      cur.o[cur.o.length - 1] = [r3(a[0] - x), r3(a[1] - y)];
      return push(a[4], a[5], a[2] - a[4], a[3] - a[5]);
    }
    if (cmd === 'Q') {
      const c1 = [x + (2 / 3) * (a[0] - x), y + (2 / 3) * (a[1] - y)];
      const c2 = [a[2] + (2 / 3) * (a[0] - a[2]), a[3] + (2 / 3) * (a[1] - a[3])];
      cur.o[cur.o.length - 1] = [r3(c1[0] - x), r3(c1[1] - y)];
      return push(a[2], a[3], c2[0] - a[2], c2[1] - a[3]);
    }
    if (cmd === 'Z') {
      cur.c = true;
      const n = cur.v.length - 1;
      if (n > 0 && Math.abs(cur.v[n][0] - cur.v[0][0]) < 1e-3 && Math.abs(cur.v[n][1] - cur.v[0][1]) < 1e-3) {
        cur.i[0] = cur.i[n];
        cur.v.pop(); cur.i.pop(); cur.o.pop();
      }
      return;
    }
    throw new Error(`Unsupported path command ${cmd} in ${d}`);
  });
  return subs.map((k) => ({ ty: 'sh', ks: st(k) }));
}

function elementShapes(svg) {
  const out = [];
  for (const m of svg.matchAll(/<(path|circle|rect)\s([^>]*?)\/?>/g)) {
    const [tag, raw] = [m[1], m[2]];
    const at = attrs(` ${raw}`);
    if (tag === 'path') out.push(...pathShapes(at.d));
    if (tag === 'circle') { const r = Number(at.r); out.push({ ty: 'el', d: 1, p: st([Number(at.cx), Number(at.cy)]), s: st([2 * r, 2 * r]) }); }
    if (tag === 'rect') {
      const [x, y, w, h] = ['x', 'y', 'width', 'height'].map((k) => Number(at[k] ?? 0));
      out.push({ ty: 'rc', d: 1, p: st([x + w / 2, y + h / 2]), s: st([w, h]), r: st(Number(at.rx ?? 0)) });
    }
  }
  return out;
}

function lottie(name, svg) {
  const shapes = elementShapes(svg);
  const group = {
    ty: 'gr', nm: name,
    it: [
      ...shapes,
      { ty: 'st', c: st(COLOR), o: st(100), w: st(2), lc: 2, lj: 2, ml: 4 },
      { ty: 'tm', s: st(0), o: st(0), m: 1, e: { a: 1, k: [{ t: 0, s: [0], ...EASE_OUT }, { t: DRAW, s: [100] }] } },
      { ty: 'tr', p: st([0, 0]), a: st([0, 0]), s: st([100, 100]), r: st(0), o: st(100), sk: st(0), sa: st(0) },
    ],
  };
  return {
    v: '5.12.2', fr: FPS, ip: 0, op: DRAW + 1, w: 24, h: 24, nm: name, ddd: 0, assets: [],
    layers: [{
      ddd: 0, ind: 1, ty: 4, nm: name, sr: 1, ao: 0, ip: 0, op: DRAW + 1, st: 0, bm: 0,
      ks: { o: st(100), r: st(0), p: st([0, 0, 0]), a: st([0, 0, 0]), s: st([100, 100, 100]) },
      shapes: [group],
    }],
  };
}

const dir = path.resolve('src/assets/lottie');
fs.mkdirSync(dir, { recursive: true });
for (const name of ICONS) {
  if (!icons[name]) throw new Error(`Icon ${name} not found in Icon.astro`);
  const json = JSON.stringify(lottie(name, icons[name]));
  fs.writeFileSync(path.join(dir, `${name}.json`), json + '\n');
  console.log(`${name}.json  ${json.length} bytes`);
}
