/**
 * The home hero's box of cut paper (HeroScene.astro): its one opening, and its lean toward the pointer.
 *
 * The opening plays once, when the sheet is on screen down to its bottom edge (see the end of this file), and tells
 * the path in order (about 3.9 s):
 *   0–1.1 s    the box tips up to face the reader (done by 0.9 s) while the hills stand up, nearest first: the
 *              years come in the order the child lives them (3–6 saffron, 6–12 vermilion, 12–15 turquoise, then
 *              the dashed 15–18), each cypress springing up just after its hill; the two clouds drift in.
 *   0.64–3.2 s the cream strip is laid from the bottom edge up to the sun, a little slower each stretch, resting a
 *              beat at every age: the age's disc drops onto the hill as the strip reaches it and the name of its
 *              stretch unfolds from under the disc; at 15 and 18, the choice points, a gold ring opens once.
 *   3.4–3.9 s  the kite rises, last, as the gold ring at 18 fades.
 * Every step starts from the same first frame the page shows before the script (global.css, [data-enter]) and ends
 * on the still picture, so nothing jumps; when it ends, the animations hold their last frame and nothing moves.
 * Only transform and opacity move, except the strip's mask, which is redrawn on one sheet at a time.
 * «Reduce motion» or no script: the still picture, no opening, no lean (the inline script never closes the box).
 */
const root = document.querySelector<HTMLElement>('[data-hero-scene]');
const sheet = root?.closest<HTMLElement>('.hero-sheet');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- easing ----------
// The site's tokens (global.css): --ease-out for arrivals; --ease-in-out (as a function below) for the strip's walk
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const at = (a: number, b: number, t: number) => 3 * a * (1 - t) ** 2 * t + 3 * b * (1 - t) * t * t + t ** 3;
  return (x: number) => {
    if (x <= 0 || x >= 1) return Math.min(1, Math.max(0, x));
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 24; i++) { const v = at(x1, x2, t); if (Math.abs(v - x) < 1e-5) break; if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; }
    return at(y1, y2, t);
  };
}
const easeOut = bezier(0.23, 1, 0.32, 1);
const easeInOut = bezier(0.65, 0, 0.35, 1);
// A spring as a linear() curve (unit mass, from rest to 1): paper that stands up a touch past upright and settles
const linearOk = typeof CSS !== 'undefined' && CSS.supports('animation-timing-function', 'linear(0, 1)');
function spring(stiffness: number, damping: number) {
  const dt = 1 / 240, xs = [0];
  let x = 0, v = 0, t = 0;
  while (t < 2) {
    v += (stiffness * (1 - x) - damping * v) * dt; x += v * dt; t += dt; xs.push(x);
    if (Math.abs(1 - x) < 0.002 && Math.abs(v) < 0.02) break;
  }
  const n = xs.length - 1, steps = 40, pts: string[] = [];
  for (let i = 0; i < steps; i++) pts.push(xs[Math.round((i / steps) * n)].toFixed(3));
  return { easing: linearOk ? `linear(${pts.join(', ')}, 1)` : EASE_OUT, duration: Math.round(t * 1000) };
}
const STAND = spring(170, 19); // hills: ~4% past upright
const SPRING_UP = spring(230, 18); // cypresses: livelier, ~9%
// name strips: critically damped, no overshoot; a strip lies on its hill, and swinging past flat would take it
// through the hill's paper
const UNFOLD = spring(320, 36);

// ---------- the opening ----------
function open(root: HTMLElement) {
  root.dataset.enter = 'playing';
  const box = root.getBoundingClientRect();
  const unit = Math.max(box.width / 720, box.height / 900); // px per drawing unit
  const $ = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel);
  const $$ = <T extends Element = HTMLElement>(sel: string) => [...root.querySelectorAll<T>(sel)];
  const runs: Animation[] = [];
  const play = (el: Element | null | undefined, frames: Keyframe[], timing: KeyframeAnimationOptions) => {
    if (el) runs.push(el.animate(frames, { fill: 'both', ...timing }));
  };

  // The strip's walk: from where it comes over the bottom edge to each age in turn, then on to the sun.
  // Each stretch is a little slower than the one before; a beat's rest at every age, a longer one at 15.
  const stops = $$('.hs-stop').map((el) => ({ el, at: Number(el.dataset.at) })).sort((a, b) => a.at - b.at);
  const PATH = 640;
  const legs: { a: number; b: number; d: number; ease: (x: number) => number; rest: number }[] = [];
  const marks = [Number(root.dataset.enterFrom) || 0, ...stops.map((s) => s.at), 1];
  const durations = [260, 460, 440, 420, 340, 170];
  const rests = [90, 90, 90, 160, 70, 0];
  marks.slice(1).forEach((b, i) => legs.push({ a: marks[i], b, d: durations[i], ease: i === 0 || i === marks.length - 2 ? easeOut : easeInOut, rest: rests[i] }));
  const arrivals: number[] = []; // when the strip reaches each age (ms from the start)
  let clock = PATH;
  for (const leg of legs.slice(0, -1)) { clock += leg.d; arrivals.push(clock); clock += leg.rest; }
  const END = clock + legs[legs.length - 1].d; // the strip reaches the sun
  /** How much of the path is laid at time t (share of its length) */
  const walked = (t: number) => {
    let c = PATH;
    if (t <= c) return legs[0].a;
    for (const leg of legs) {
      if (t < c + leg.d) return leg.a + (leg.b - leg.a) * leg.ease((t - c) / leg.d);
      c += leg.d;
      if (t < c + leg.rest) return leg.b;
      c += leg.rest;
    }
    return 1;
  };
  const when = (share: number) => { // the first time the strip has reached `share`
    let lo = PATH, hi = END;
    for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (walked(m) < share) lo = m; else hi = m; }
    return hi;
  };

  // The camera: from above and a little to the right, up to face the box as the hills stand. It is done before the
  // first name unfolds: while a 3D animation runs on an ancestor, the browser draws everything under it at a lower
  // resolution, and the names would stay soft until it ended.
  play($('.hs-cam'), [
    { transform: 'rotateX(-12deg) rotateY(-6deg) scale(0.97)' },
    { transform: 'rotateX(0deg) rotateY(0deg) scale(1)' },
  ], { duration: 900, easing: EASE_OUT });

  // The hills stand up, nearest first, at shrinking gaps; each cypress springs up a moment after its hill
  const standAt: Record<string, number> = { saffron: 0, red: 150, teal: 270, far: 360 };
  for (const [id, t] of Object.entries(standAt)) {
    play($(`[data-piece="${id}"] > .hs-fold`), [{ transform: 'rotateX(75deg)' }, { transform: 'rotateX(0deg)' }], { ...STAND, delay: t });
  }
  $$('.hs-tree > svg').forEach((svg, i) => {
    const hill = i < 2 ? standAt.teal : standAt.red;
    play(svg, [
      { opacity: 0, transform: 'rotateX(85deg)' },
      { opacity: 1, offset: 0.12 },
      { opacity: 1, transform: 'rotateX(0deg)' },
    ], { ...SPRING_UP, delay: hill + 260 + (i % 2) * 70 });
  });
  $$('.hs-cloud > svg').forEach((svg, i) =>
    play(svg, [{ transform: 'translateX(22%)' }, { transform: 'translateX(0)' }], { duration: 1400, delay: 100 + i * 140, easing: EASE_OUT }),
  );

  // The strip, one sheet at a time: each sheet's mask follows the walk only while the strip crosses that sheet
  $$('.hs-path').forEach((piece) => {
    const line = piece.querySelector('.hs-line');
    const from = Number(piece.dataset.from), to = Number(piece.dataset.to);
    const t0 = when(from), t1 = to >= 1 ? END : when(to);
    const frames: Keyframe[] = [];
    const n = Math.max(2, Math.ceil((t1 - t0) / 20));
    for (let i = 0; i <= n; i++) frames.push({ strokeDashoffset: (1000 * (1 - walked(t0 + ((t1 - t0) * i) / n))).toFixed(1) });
    // forwards only: before its turn the sheet's strip stays hidden (global.css), even the stretch under nearer hills
    play(line, frames, { duration: Math.max(1, t1 - t0), delay: t0, easing: 'linear', fill: 'forwards' });
  });

  // Each age as the strip reaches it: the disc drops onto its hill, the name unfolds from under it,
  // and at the choice points a gold ring opens once
  stops.forEach(({ el }, i) => {
    const t = arrivals[i];
    play(el.querySelector('svg'), [
      { opacity: 0, transform: `translateZ(${(70 * unit).toFixed(1)}px)` },
      { opacity: 1, offset: 0.35 },
      { opacity: 1, transform: 'translateZ(0px)' },
    ], { duration: 420, delay: t - 150, easing: EASE_OUT });
    const flap = $(`[data-tag="${el.dataset.piece}"] .hs-flap`);
    const side = flap?.closest('.hs-tag-left') ? 115 : -115;
    play(flap, [{ transform: `rotateY(${side}deg)` }, { transform: 'rotateY(0deg)' }], { ...UNFOLD, delay: t + 40 });
    // the ring widens on --ease-out but stays gold for its first third, then fades evenly, so it reads as a ring;
    // gone before the next one opens
    play($(`[data-ring="${el.dataset.piece}"] > i`), [
      { opacity: 0.9, transform: 'scale(1)', easing: EASE_OUT },
      { opacity: 0.9, offset: 0.3, easing: 'linear' },
      { opacity: 0, transform: 'scale(2.1)' },
    ], { duration: 500, delay: t + 60, easing: 'linear', fill: 'forwards' });
  });

  // The kite rises last, as the ring at 18 fades: up from below left, a little past level, then steady. A gentler
  // ease-out than the token (easeOutCubic), so the rise reads over its first 300 ms instead of snapping up.
  play($('.hs-kite > svg'), [
    { opacity: 0, transform: 'translate(-14%, 18%) rotate(-14deg)' },
    { opacity: 1, offset: 0.3 },
    { transform: 'translate(0%, 0%) rotate(5deg)', offset: 0.68 },
    { opacity: 1, transform: 'translate(0%, 0%) rotate(0deg)' },
  ], { duration: 500, delay: arrivals[4] + 410, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' });

  // At rest: the finished animations stay in place, holding their end values (dropping them would redraw the cypresses
  // and the names a pixel off as the opening ends: a piece is drawn differently with an animation on it and without),
  // and the closed state, no longer needed, goes
  Promise.all(runs.map((a) => a.finished)).then(() => root.removeAttribute('data-enter'), () => {});
}

// ---------- the lean toward the pointer (a computer's mouse or pen only) ----------
// Up to 5° sideways and 3.5° up or down, as if the reader moved their head: the near sheets slide against the far
// ones. A spring follows the pointer, so the box moves with a little weight and comes back level when it leaves.
function lean(sheet: HTMLElement, tilt: HTMLElement) {
  let tx = 0, ty = 0, x = 0, y = 0, vx = 0, vy = 0, frame = 0, last = 0;
  const step = (now: number) => {
    const dt = Math.min(0.034, (now - last) / 1000 || 1 / 60);
    last = now;
    vx += ((tx - x) * 120 - vx * 19) * dt; x += vx * dt;
    vy += ((ty - y) * 120 - vy * 19) * dt; y += vy * dt;
    tilt.style.transform = `rotateX(${y.toFixed(3)}deg) rotateY(${x.toFixed(3)}deg)`;
    frame = Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(vx) + Math.abs(vy) > 0.004 ? requestAnimationFrame(step) : 0;
  };
  const go = () => { if (!frame) { last = performance.now(); frame = requestAnimationFrame(step); } };
  sheet.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const r = sheet.getBoundingClientRect();
    tx = -((e.clientX - r.left) / r.width - 0.5) * 10;
    ty = ((e.clientY - r.top) / r.height - 0.5) * 7;
    go();
  });
  sheet.addEventListener('pointerleave', () => { tx = 0; ty = 0; go(); });
}

if (root && sheet) {
  if (root.dataset.enter === 'pending') {
    root.dataset.enter = 'armed';
    // The story starts at the sheet's bottom edge (3, on the front hill), so the box opens once that edge is on screen.
    // On a phone or a tablet the sheet sits under the text with its lower part below the fold, and opens as the
    // reader scrolls to it; until then the part in view is the sky with the sun. A sheet taller than the screen opens
    // once it fills most of it; one left half in view (the reader not scrolling) opens after a few seconds anyway.
    let wait = 0;
    const go = () => { io.disconnect(); clearTimeout(wait); open(root); };
    const io = new IntersectionObserver((entries) => {
      const e = entries[entries.length - 1];
      const shown = e.intersectionRect.height;
      if (e.isIntersecting && (shown >= e.boundingClientRect.height * 0.95 - 1 || shown >= innerHeight * 0.75)) return go();
      clearTimeout(wait);
      if (e.intersectionRatio >= 0.45) wait = window.setTimeout(go, 4000);
    }, { threshold: Array.from({ length: 21 }, (_, i) => i / 20) });
    io.observe(sheet);
  }
  const tilt = root.querySelector<HTMLElement>('.hs-tilt');
  if (!reduce && tilt && matchMedia('(hover: hover) and (pointer: fine)').matches) lean(sheet, tilt);
}

// A module of its own (imported by HeroScene.astro), so its names stay out of the other page scripts' scope
export {};
