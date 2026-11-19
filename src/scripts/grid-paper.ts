/**
 * Graph paper behind the home hero (after "Interactive Grid" on 21st.dev, docs/21st-elements.md): the squares a
 * mouse passes over are shaded pale gold and fade within about a second, like pencil rubbed out. The lines are
 * plain CSS (.grid-paper); this only paints the shaded squares on a canvas.
 * Mouse or trackpad only, never with reduced motion, and the canvas is created on the first movement, so a phone
 * or a visitor who never moves the mouse there pays nothing.
 */
export function gridPaper(paper: HTMLElement) {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const zone = paper.parentElement ?? paper;
  const FADE = 1100; // ms for a square to fade out
  const ALPHA = 0.32; // strongest shade, logo gold over paper
  const life = new Map<number, number>(); // square index → 1 when shaded, down to 0
  let canvas: HTMLCanvasElement | undefined;
  let ctx: CanvasRenderingContext2D | null = null;
  let cell = 32, cols = 0, rows = 0, width = 0, height = 0;
  let raf = 0, last = 0, lastCol = -1, lastRow = -1;

  const size = () => {
    if (!canvas || !ctx) return;
    const r = paper.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    width = r.width; height = r.height;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = getComputedStyle(paper).getPropertyValue('--color-gold').trim() || '#d9b25a';
    cell = parseFloat(getComputedStyle(paper).getPropertyValue('--cell')) || 32;
    cols = Math.ceil(width / cell); rows = Math.ceil(height / cell);
    life.clear();
  };

  const draw = (t: number) => {
    if (!ctx) return;
    const dt = last ? Math.min(64, t - last) : 16;
    last = t;
    ctx.clearRect(0, 0, width, height);
    for (const [k, v] of life) {
      const left = v - dt / FADE;
      if (left <= 0) { life.delete(k); continue; }
      life.set(k, left);
      ctx.globalAlpha = ALPHA * left * left; // fades fast at first, then lingers
      // inside the 1px lines, which sit on the left and top edge of each square
      ctx.fillRect((k % cols) * cell + 1, Math.floor(k / cols) * cell + 1, cell - 1, cell - 1);
    }
    if (life.size) raf = requestAnimationFrame(draw);
    else { raf = 0; last = 0; }
  };

  const shade = (c: number, r: number) => { if (c >= 0 && r >= 0 && c < cols && r < rows) life.set(r * cols + c, 1); };

  zone.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      paper.append(canvas);
      ctx = canvas.getContext('2d');
      size();
      new ResizeObserver(size).observe(paper);
    }
    const b = paper.getBoundingClientRect();
    const c = Math.floor((e.clientX - b.left) / cell), r = Math.floor((e.clientY - b.top) / cell);
    if (c === lastCol && r === lastRow) return;
    // A quick stroke skips squares between two events: shade the ones in between (not after a long jump)
    const steps = Math.max(Math.abs(c - lastCol), Math.abs(r - lastRow));
    if (lastCol >= 0 && steps > 1 && steps < 8) {
      for (let s = 1; s < steps; s++) shade(Math.round(lastCol + ((c - lastCol) * s) / steps), Math.round(lastRow + ((r - lastRow) * s) / steps));
    }
    shade(c, r);
    lastCol = c; lastRow = r;
    if (!raf) raf = requestAnimationFrame(draw);
  }, { passive: true });
  zone.addEventListener('pointerleave', () => { lastCol = lastRow = -1; });
}
