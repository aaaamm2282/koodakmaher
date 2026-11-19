/**
 * Small interactive pieces rebuilt from the 21st.dev catalogue (docs/21st-elements.md), with no library:
 * - [data-magnetic]          a call to action that leans toward a mouse that comes near   (Magnetic Button)
 * - [data-tilt]              a panel that turns a few degrees toward the mouse, in depth   (Tilt, 3D Card Effect)
 * - [data-ink]               a statement that inks in word by word as it is read           (Text Reveal)
 * - [data-stack]             cards that settle on top of each other while scrolling        (Stacking cards)
 * - [data-progress-target]   the gold reading line along the bottom of the header          (Scroll Progress)
 * The finished, still state of each one is the CSS default, so without this script nothing is missing.
 * Reduced motion turns off everything that moves on its own or with the scroll; the reading line stays,
 * since it only reports where the reader is.
 */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// One scroll loop for everything that follows the scroll position, and only for what is on screen
type Tick = () => void;
const ticks = new Set<Tick>();
let frame = 0;
const schedule = () => {
  if (!frame && ticks.size) frame = requestAnimationFrame(() => { frame = 0; ticks.forEach((t) => t()); });
};
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', schedule);
const whileOnScreen = (el: Element, tick: Tick) => {
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting) ticks.add(tick);
    else { tick(); ticks.delete(tick); } // leave it in its last true state (fully inked, fully read…)
    schedule();
  }).observe(el);
};

// ---------- Magnetic Button ----------
// Within 72px of the button the pull starts; it never moves more than 8px across and 5px up or down.
if (finePointer && !reduce) {
  const magnets = [...document.querySelectorAll<HTMLElement>('[data-magnetic]')];
  if (magnets.length) {
    const REACH = 72;
    let x = -1e4, y = -1e4, pending = 0;
    const update = () => {
      pending = 0;
      for (const el of magnets) {
        const r = el.getBoundingClientRect();
        const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
        const gap = Math.hypot(Math.max(0, Math.abs(dx) - r.width / 2), Math.max(0, Math.abs(dy) - r.height / 2));
        if (gap > REACH) { if (el.style.translate) el.style.translate = ''; continue; }
        const pull = 1 - gap / REACH;
        el.style.translate = `${clamp(dx * 0.1 * pull, -8, 8).toFixed(1)}px ${clamp(dy * 0.2 * pull, -5, 5).toFixed(1)}px`;
      }
    };
    const later = () => { if (!pending) pending = requestAnimationFrame(update); };
    addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { x = e.clientX; y = e.clientY; later(); } }, { passive: true });
    addEventListener('scroll', later, { passive: true }); // the page moves under a still mouse
    document.addEventListener('pointerout', (e) => { if (!e.relatedTarget) { x = y = -1e4; later(); } }); // mouse left the window
  }
}

// ---------- Tilt ----------
// [data-tilt] turns up to 5 degrees toward a mouse over it: the side under the pointer comes forward, like a card
// tilted in the hand. Its [data-depth] layers drift the other way by up to that many pixels, so a deeper layer seems
// to float above the panel. It eases after the pointer and back to flat when the pointer leaves.
if (finePointer && !reduce) {
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((card) => {
    const MAX = 5;
    const layers = [...card.querySelectorAll<HTMLElement>('[data-depth]')].map((el) => ({ el, d: Number(el.dataset.depth) || 0 }));
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const step = () => {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      const still = Math.abs(tx - x) < 0.002 && Math.abs(ty - y) < 0.002;
      if (still) { x = tx; y = ty; }
      const flat = x === 0 && y === 0;
      card.style.transform = flat ? '' : `rotateX(${(y * MAX).toFixed(2)}deg) rotateY(${(-x * MAX).toFixed(2)}deg)`;
      for (const { el, d } of layers) el.style.translate = flat ? '' : `${(-x * d).toFixed(2)}px ${(-y * d).toFixed(2)}px`;
      raf = still ? 0 : requestAnimationFrame(step);
    };
    const run = () => { if (!raf) raf = requestAnimationFrame(step); };
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = card.getBoundingClientRect();
      tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      run();
    });
    card.addEventListener('pointerleave', () => { tx = ty = 0; run(); });
  });
}

// ---------- Text Reveal ----------
// --p runs 0 → 1 from the moment the first line nears the bottom of the screen until the last line is a little
// above the middle; each word's colour follows it in CSS (.ink-w), about six words at a time.
if (!reduce) {
  document.querySelectorAll<HTMLElement>('[data-ink]').forEach((el) => {
    const tick = () => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--p', clamp((innerHeight * 0.88 - r.top) / (innerHeight * 0.33 + r.height)).toFixed(3));
    };
    tick();
    whileOnScreen(el, tick);
  });
}

// ---------- Stacking cards ----------
// Each card sinks (scales from its top edge) by how far the cards after it have slid over it. Only once it is
// almost covered, with no text of it left in sight, a veil fades its visible edge toward the page, so text that
// can still be read never loses contrast. The short gold ticks beside the heading count the cards that have arrived.
document.querySelectorAll<HTMLElement>('[data-stack]').forEach((stack) => {
  const items = [...stack.querySelectorAll<HTMLElement>('[data-stack-item]')];
  const cards = items.map((li) => li.querySelector<HTMLElement>('[data-stack-card]')!);
  const veils = cards.map((c) => c.querySelector<HTMLElement>('[data-stack-veil]'));
  const marks = [...(stack.closest('[data-stack-root]') ?? stack).querySelectorAll<HTMLElement>('[data-stack-tick]')];
  if (reduce || !items.length) { marks.forEach((m) => m.classList.add('is-on')); return; }
  // Where each card sticks (its CSS top), read once and again on resize, never inside the scroll loop
  let tops: number[] = [];
  const measure = () => { tops = items.map((li) => parseFloat(getComputedStyle(li).top) || 0); };
  measure();
  addEventListener('resize', measure);
  const tick = () => {
    const rects = items.map((li) => li.getBoundingClientRect());
    let arrived = 0;
    rects.forEach((r, i) => {
      let depth = 0;
      for (let j = i + 1; j < rects.length; j++) depth += clamp((r.bottom - rects[j].top) / r.height);
      cards[i].style.transform = depth > 0 ? `scale(${(1 - depth * 0.035).toFixed(4)})` : '';
      const veil = veils[i];
      if (veil) veil.style.opacity = clamp((depth - 0.85) * 3.5, 0, 0.55).toFixed(3);
      if (r.top <= tops[i] + 2) arrived = i;
    });
    marks.forEach((m, k) => m.classList.toggle('is-on', k <= arrived));
  };
  tick();
  whileOnScreen(stack, tick);
});

// ---------- Scroll Progress ----------
// Read = from the top of the text reaching the header to its end reaching the bottom of the screen.
const target = document.querySelector<HTMLElement>('[data-progress-target]');
const bar = document.querySelector<HTMLElement>('[data-progress]');
if (target && bar) {
  const header = document.getElementById('site-header');
  bar.hidden = false;
  const tick = () => {
    const r = target.getBoundingClientRect();
    const top = header ? header.getBoundingClientRect().bottom : 0;
    bar.style.transform = `scaleX(${clamp((top - r.top) / Math.max(1, r.height - (innerHeight - top))).toFixed(4)})`;
  };
  tick();
  whileOnScreen(target, tick);
}
