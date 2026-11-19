/**
 * Site-wide entrance motion, kept tiny on purpose (no library): blocks fade up 12px once as they
 * enter the screen. The hidden starting state and the transition live in global.css under `.js`.
 * GSAP is loaded only by the pages that have scroll-driven pieces (see src/scripts/path-story.ts).
 */
(window as unknown as { __animReady?: boolean }).__animReady = true;

const reveal = (el: Element) => el.classList.add('is-in');

// Children of [data-stagger] come in one after another
document.querySelectorAll<HTMLElement>('[data-stagger]').forEach((group) => {
  [...group.children].forEach((child, i) => (child as HTMLElement).style.setProperty('--stagger', String(Math.min(i, 8))));
});

const targets = document.querySelectorAll('[data-reveal], [data-stagger]');
let io: IntersectionObserver | undefined;
if ('IntersectionObserver' in window) {
  io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        // Also reveal anything already above the screen (anchor links, restored scroll position)
        if (en.isIntersecting || en.boundingClientRect.top < 0) {
          reveal(en.target);
          io!.unobserve(en.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  targets.forEach((el) => io!.observe(el));
} else {
  targets.forEach(reveal);
}

// Things that are never hidden but play once on screen (a marker pass, a hand-drawn stroke, the footer name):
// they wait until they are well inside the screen, so the reader sees them happen.
const inview = document.querySelectorAll('[data-inview]');
if ('IntersectionObserver' in window) {
  const io2 = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (en.isIntersecting || en.boundingClientRect.top < 0) {
          reveal(en.target);
          io2.unobserve(en.target);
        }
      }
    },
    { rootMargin: '0px 0px -18% 0px' },
  );
  inview.forEach((el) => io2.observe(el));
} else {
  inview.forEach(reveal);
}

// Keyboard: focus never sits on something invisible. A block that has not come in yet shows at once,
// and one still fading in (a group that came in a moment ago, the hero just after load) finishes now.
const HIDDEN = '[data-reveal]:not(.is-in), [data-stagger]:not(.is-in)';
const ENTRANCE = new Set(['rise', 'fade', 'fade-in']);
document.addEventListener('focusin', (e) => {
  const target = e.target as Element;
  for (let el = target.closest?.(HIDDEN); el; el = el.parentElement?.closest(HIDDEN) ?? null) {
    el.classList.add('is-in', 'is-now');
    io?.unobserve(el);
  }
  for (let el: Element | null = target; el && el !== document.body; el = el.parentElement) {
    for (const a of el.getAnimations()) if (a instanceof CSSAnimation && ENTRANCE.has(a.animationName)) a.finish();
  }
});
