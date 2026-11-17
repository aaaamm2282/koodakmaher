/**
 * Scroll-driven story on /path/ (GSAP + ScrollTrigger), loaded only by that page:
 * - the line beside the stages fills as the reader scrolls, and the stage in the reading zone is marked;
 * - on wide screens, a sticky age dial counts 3 → 18 and its gold marker slides down a ruler.
 * With "reduce motion" on, the line is shown full and the dial is hidden (see the page markup).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const EASE = 'power3.out'; // close to --ease-out in CSS

const faDigits = (n: number) => n.toLocaleString('fa-IR');
const mm = gsap.matchMedia();
let motionOn = !matchMedia('(prefers-reduced-motion: reduce)').matches;

mm.add({ motion: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
  const { motion } = ctx.conditions as { motion: boolean; reduce: boolean };
  motionOn = motion;
  const path = document.querySelector<HTMLElement>('[data-path]');
  if (path) setupPathLine(path, motion);
});

// /path/ on wide screens: an age dial that counts 3 → 18 as the stages scroll past
mm.add('(min-width: 1024px)', () => {
  const path = document.querySelector<HTMLElement>('[data-path]');
  if (path) setupPathDial(path);
});

function setupPathLine(root: HTMLElement, motion: boolean) {
  const list = root.querySelector<HTMLElement>('[data-path-list]')!;
  const items = gsap.utils.toArray<HTMLElement>('[data-path-item]', root);
  const line = root.querySelector<HTMLElement>('[data-timeline-line]');
  const stageOut = root.querySelector<HTMLElement>('[data-path-stage]');
  let active = -1;
  const setActive = (i: number) => {
    if (i === active) return;
    active = i;
    items.forEach((li, k) => li.classList.toggle('is-active', k === i));
    if (stageOut) stageOut.textContent = items[i]?.dataset.stage ?? '';
  };
  if (line) {
    if (motion) gsap.fromTo(line, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 60%', end: 'bottom 60%', scrub: 0.4 } });
    else gsap.set(line, { scaleY: 1 });
  }
  items.forEach((li, i) => {
    ScrollTrigger.create({ trigger: li, start: 'top 60%', end: 'bottom 60%', onToggle: (self) => self.isActive && setActive(i) });
  });
  setActive(0);
}

function setupPathDial(root: HTMLElement) {
  const list = root.querySelector<HTMLElement>('[data-path-list]')!;
  const items = gsap.utils.toArray<HTMLElement>('[data-path-item]', root);
  const ages = items.map((li) => Number(li.dataset.age));
  const ageOut = root.querySelector<HTMLElement>('[data-path-age]');
  const marker = root.querySelector<HTMLElement>('[data-path-marker]');
  const fill = root.querySelector<HTMLElement>('[data-path-fill]');
  const ruler = root.querySelector<HTMLElement>('[data-path-ruler]');
  if (!ageOut || !marker || !fill || !ruler || !items.length) return;

  const moveMarker = motionOn ? gsap.quickTo(marker, 'y', { duration: 0.35, ease: EASE }) : (v: number) => gsap.set(marker, { y: v });
  const fillTo = motionOn ? gsap.quickTo(fill, 'scaleY', { duration: 0.35, ease: EASE }) : (v: number) => gsap.set(fill, { scaleY: v });
  let starts = items.map((li) => li.offsetTop);
  ScrollTrigger.addEventListener('refreshInit', () => (starts = items.map((li) => li.offsetTop)));

  ScrollTrigger.create({
    trigger: list,
    start: 'top 60%',
    end: 'bottom 60%',
    onUpdate: (self) => {
      // Age between two stages, from the scroll position inside the list
      const y = self.progress * list.offsetHeight;
      let i = 0;
      while (i < starts.length - 1 && y >= starts[i + 1]) i++;
      const next = Math.min(i + 1, ages.length - 1);
      const span = starts[next] - starts[i] || 1;
      const t = next === i ? 1 : Math.min(1, Math.max(0, (y - starts[i]) / span));
      const age = ages[i] + (ages[next] - ages[i]) * t;
      const share = (age - ages[0]) / (ages[ages.length - 1] - ages[0]);
      ageOut.textContent = faDigits(Math.floor(age + 0.0001));
      moveMarker(share * ruler.offsetHeight);
      fillTo(share);
    },
  });
}
