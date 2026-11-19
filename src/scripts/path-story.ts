/**
 * Scroll-driven story on /path/ (GSAP + ScrollTrigger), loaded only by that page:
 * - the line beside the stages fills as the reader scrolls, and the stage in the reading zone is marked;
 * - on wide screens, a sticky age dial counts 3 → 18 while a gold token climbs a staircase of ages, hopping onto
 *   the step of the stage being read (after "Isometric Steps" on 21st.dev).
 * With "reduce motion" on, the line is shown full and the dial is hidden (see the page markup).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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
  const stairs = root.querySelector<SVGSVGElement>('[data-stairs]');
  const ball = stairs?.querySelector<SVGElement>('[data-token]');
  const shadow = stairs?.querySelector<SVGElement>('[data-token-shadow]');
  if (!ageOut || !stairs || !ball || !shadow || !items.length) return;

  // Steps in age order, with the middle of each step's top (where the token stands), in SVG units
  const steps = [...stairs.querySelectorAll<SVGGElement>('[data-step]')].sort((a, b) => Number(a.dataset.step) - Number(b.dataset.step));
  const stepAges = steps.map((g) => Number(g.dataset.age));
  const spots = steps.map((g) => ({ x: Number(g.dataset.cx), y: Number(g.dataset.cy) }));
  const move = (x: number, y: number) => `translate(${(x - spots[0].x).toFixed(2)}px, ${(y - spots[0].y).toFixed(2)}px)`;
  let at = 0;
  const hopTo = (k: number) => {
    if (k === at) return;
    const a = spots[at], b = spots[k];
    at = k;
    steps.forEach((g, i) => g.classList.toggle('is-on', i <= k));
    for (const el of [ball, shadow]) for (const anim of el.getAnimations()) anim.cancel();
    ball.style.transform = shadow.style.transform = move(b.x, b.y);
    if (!motionOn) return;
    // One arc, higher for a longer jump; the shadow slides along the steps and fades while the token is in the air
    const lift = 9 + Math.abs(b.y - a.y) * 0.5;
    const timing = { duration: 460, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' };
    ball.animate(Array.from({ length: 11 }, (_, i) => {
      const t = i / 10;
      return { transform: move(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - Math.sin(Math.PI * t) * lift) };
    }), timing);
    shadow.animate([
      { transform: move(a.x, a.y), opacity: 1 },
      { transform: move((a.x + b.x) / 2, (a.y + b.y) / 2), opacity: 0.35, offset: 0.5 },
      { transform: move(b.x, b.y), opacity: 1 },
    ], timing);
  };
  const stepFor = (age: number) => {
    let k = 0;
    while (k < stepAges.length - 1 && age >= stepAges[k + 1] - 0.001) k++;
    return k;
  };

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
      ageOut.textContent = faDigits(Math.floor(age + 0.0001));
      hopTo(stepFor(age));
    },
  });
}
