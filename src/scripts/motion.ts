import { animate, inView, scroll, stagger } from 'motion';

// One motion language for the whole site: short fade-up on entry, nothing that loops or follows the cursor.
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = [0.23, 1, 0.32, 1] as const;
const opts = { margin: '0px 0px -8% 0px' };

if (reduce) {
  inView('[data-reveal]', (el) => { animate(el, { opacity: 1 }, { duration: 0.2 }); }, opts);
  inView('[data-stagger]', (g) => { animate(g.querySelectorAll(':scope > *'), { opacity: 1 }, { duration: 0.2 }); }, opts);
} else {
  inView('[data-reveal]', (el) => { animate(el, { opacity: 1, y: 0 }, { duration: 0.5, ease }); }, opts);
  inView('[data-stagger]', (g) => {
    animate(g.querySelectorAll(':scope > *'), { opacity: 1, y: 0 }, { duration: 0.5, ease, delay: stagger(0.05) });
  }, opts);

  // Age path on /path/: the vertical line fills as the reader moves down the stages.
  const line = document.querySelector<HTMLElement>('[data-timeline-line]');
  if (line) scroll(animate(line, { scaleY: [0, 1] }, { ease: 'linear' }), { target: line.parentElement!, offset: ['start 70%', 'end 60%'] });
}
