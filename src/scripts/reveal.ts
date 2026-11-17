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
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        // Also reveal anything already above the screen (anchor links, restored scroll position)
        if (en.isIntersecting || en.boundingClientRect.top < 0) {
          reveal(en.target);
          io.unobserve(en.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  targets.forEach((el) => io.observe(el));
} else {
  targets.forEach(reveal);
}
