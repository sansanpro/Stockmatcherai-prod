// Shared motion values (docs/phase-0.md, motion storyboard). CSS uses the same numbers through
// --ease-out and --dur-* in index.css, and Tailwind's ease-out / duration-fast|base|slow.
export const SPRING = {
  snappy: { stiffness: 520, damping: 38 }, // swipe exits and spring-backs
  gentle: { stiffness: 260, damping: 30 }, // cards settling, sheets, art
} as const;
export type SpringConfig = { stiffness: number; damping: number };

export const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const DURATION = { fast: 120, base: 240, slow: 400, reduced: 150 } as const;

// Live, so a change in iOS settings applies without a reload
const reducedQuery = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null;
export const prefersReducedMotion = () => !!reducedQuery?.matches;

interface SpringOptions {
  from: number[];
  to: number[];
  velocity?: number[]; // units per millisecond, e.g. the finger's speed on release
  spring?: SpringConfig;
  onUpdate: (values: number[]) => void;
  onComplete?: () => void;
  // Stop early once this returns true (e.g. the card is off screen)
  done?: (values: number[]) => boolean;
}

// A damped spring (mass 1) stepped with requestAnimationFrame. Returns a function that stops it
// where it is, so a new touch can grab whatever is moving.
export function animateSpring({ from, to, velocity, spring = SPRING.gentle, onUpdate, onComplete, done }: SpringOptions) {
  const x = [...from];
  const v = from.map((_, i) => (velocity?.[i] ?? 0) * 1000); // per second
  let last = 0;
  let frame = 0;

  const step = (now: number) => {
    // Integrate in 4 ms steps; a long frame (tab in background) counts as at most 64 ms
    let dt = last ? Math.min(64, now - last) : 16;
    last = now;
    while (dt > 0) {
      const h = Math.min(4, dt) / 1000;
      for (let i = 0; i < x.length; i++) {
        v[i] += (-spring.stiffness * (x[i] - to[i]) - spring.damping * v[i]) * h;
        x[i] += v[i] * h;
      }
      dt -= 4;
    }
    const resting = x.every((xi, i) => Math.abs(xi - to[i]) < 0.5 && Math.abs(v[i]) < 20);
    if (resting) x.splice(0, x.length, ...to);
    onUpdate(x);
    if (resting || done?.(x)) {
      frame = 0;
      onComplete?.();
    } else {
      frame = requestAnimationFrame(step);
    }
  };
  frame = requestAnimationFrame(step);
  return () => { if (frame) cancelAnimationFrame(frame); frame = 0; };
}

// A plain eased tween, for reduced motion (a short cross-fade) and other fixed-length moves
export function animateTween(duration: number, onUpdate: (t: number) => void, onComplete?: () => void) {
  let start = 0;
  let frame = 0;
  const step = (now: number) => {
    if (!start) start = now;
    const t = Math.min(1, (now - start) / duration);
    onUpdate(1 - Math.pow(1 - t, 3));
    if (t < 1) frame = requestAnimationFrame(step);
    else { frame = 0; onComplete?.(); }
  };
  frame = requestAnimationFrame(step);
  return () => { if (frame) cancelAnimationFrame(frame); frame = 0; };
}
