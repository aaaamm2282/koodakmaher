import { animate, inView, scroll, stagger } from 'motion';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Apple-style spring, subtle bounce (0.1-0.3) per Emil Kowalski's standards
const spring = { type: 'spring', duration: 0.5, bounce: 0.2 } as const;
const easeOut = [0.23, 1, 0.32, 1] as const;

// 1) Scroll progress bar (RTL: grows from the right)
const progress = document.getElementById('progress');
if (progress && !reduce) {
  scroll(animate(progress, { scaleX: [0, 1] }, { ease: 'linear' }));
}

if (reduce) {
  // Gentle variant: opacity-only fades, no movement, no parallax or tilt.
  inView('[data-reveal]', (el) => { animate(el, { opacity: 1 }, { duration: 0.3 }); });
  inView('[data-stagger]', (group) => { animate(group.querySelectorAll(':scope > *'), { opacity: 1 }, { duration: 0.3 }); });
} else {
  // 2) Reveal on scroll; groups stagger their children
  inView('[data-reveal]', (el) => {
    const isScale = (el as HTMLElement).dataset.reveal === 'scale';
    animate(el, isScale ? { opacity: 1, scale: 1 } : { opacity: 1, y: 0 }, { duration: 0.6, ease: easeOut });
  }, { margin: '0px 0px -10% 0px' });

  inView('[data-stagger]', (group) => {
    animate(group.querySelectorAll(':scope > *'), { opacity: [0, 1], y: [30, 0] }, { delay: stagger(0.06), ...spring });
  }, { margin: '0px 0px -10% 0px' });

  // 5) Parallax floating shapes driven by scroll
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const depth = Number(el.dataset.parallax) || 60;
    scroll(animate(el, { y: [0, -depth] }, { ease: 'linear' }), { target: el.closest('section') ?? undefined, offset: ['start start', 'end start'] });
  });

  // 6) Timeline line draws as you scroll
  const line = document.querySelector<HTMLElement>('[data-timeline-line]');
  if (line) scroll(animate(line, { scaleY: [0, 1] }, { ease: 'linear' }), { target: line.parentElement!, offset: ['start 70%', 'end 60%'] });

  // 7) Tilt + spotlight cards follow the pointer
  document.querySelectorAll<HTMLElement>('.spotlight').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty('--mx', `${x}px`);
      card.style.setProperty('--my', `${y}px`);
      if (card.dataset.tilt !== undefined && e.pointerType === 'mouse') {
        const rx = ((y / r.height) - 0.5) * -6, ry = ((x / r.width) - 0.5) * 6;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
    });
    card.addEventListener('pointerleave', () => (card.style.transform = ''));
  });

  // 8) Magnetic buttons
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = btn.getBoundingClientRect();
      animate(btn, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.3 }, { duration: 0.3 });
    });
    btn.addEventListener('pointerleave', () => animate(btn, { x: 0, y: 0 }, spring));
  });
}
