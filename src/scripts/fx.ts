/**
 * The two things on the site that follow the reader's scrolling, with no library:
 * - [data-ink]               the page's one statement, which inks in word by word as it is read (Text Reveal)
 * - [data-progress-target]   the gold reading line along the bottom of the header             (Scroll Progress)
 * The finished, still state of each one is the CSS default, so without this script nothing is missing.
 * Reduced motion keeps the statement in full ink; the reading line stays, since it only reports where the reader is.
 */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
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
