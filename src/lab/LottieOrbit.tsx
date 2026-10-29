import { useEffect, useRef } from 'react';
import lottie from 'lottie-web/build/player/lottie_light';
import { ORBIT_MAX, ORBIT_PERIOD, ORBIT_TILT, type OrbitItem } from '@/components/values/CauseOrbit';
import { prefersReducedMotion } from '@/lib/motion';
import type { LabVariantProps } from './OrbitLab';

const FPS = 60;
const FRAMES = (ORBIT_PERIOD / 1000) * FPS;
const STEP = 12; // a keyframe every 12 frames (linear in between)
const TILE = 48;

const val = (k: unknown) => ({ a: 0, k });
const anim = (keys: { t: number; s: number[]; h?: 1 }[]) => ({
  a: 1,
  k: keys.map((key, i) => (i === keys.length - 1 ? { t: key.t, s: key.s } : { ...key, i: { x: [1], y: [1] }, o: { x: [0], y: [0] } })),
});

// Phase 4 prototype, option 2: a Lottie animation (vector, SVG renderer, "light" player without
// expressions). Lottie files are normally drawn in an animation tool; this one is generated from the
// same geometry as the CSS orbit so the two can be compared. Layer order is fixed in Lottie, so each logo
// is drawn twice (above and below the emblem) and the right copy is shown by depth.
export function orbitAnimation(emblem: string, items: OrbitItem[], size: number) {
  const W = size, H = Math.round(size * 0.82), cx = W / 2, cy = H / 2;
  const R = size * 0.4, tilt = (ORBIT_TILT * Math.PI) / 180, persp = 900;
  const n = items.length;
  const assets = [
    { id: 'emblem', w: Math.round(size * 0.42), h: Math.round(size * 0.42), u: '', p: emblem, e: 0 },
    ...items.map((s, i) => ({ id: `logo${i}`, w: TILE, h: TILE, u: '', p: s.logoUrl ?? '', e: 0 })),
  ];
  const top: object[] = [], bottom: object[] = [];
  let ind = 1;

  items.forEach((_, i) => {
    const pos: { t: number; s: number[] }[] = [], scale: { t: number; s: number[] }[] = [];
    const front: { t: number; s: number[]; h: 1 }[] = [];
    for (let t = 0; t <= FRAMES; t += STEP) {
      const a = (t / FRAMES) * Math.PI * 2 + (i / n) * Math.PI * 2;
      const z = R * Math.sin(a) * Math.sin(tilt);
      const k = persp / (persp - z);
      pos.push({ t, s: [cx + R * Math.cos(a) * k, cy + R * Math.sin(a) * Math.cos(tilt) * k, 0] });
      scale.push({ t, s: [k * 100, k * 100, 100] });
      front.push({ t, s: [z > 0 ? 100 : 0], h: 1 });
    }
    const holder = ind++;
    bottom.push({ ddd: 0, ind: holder, ty: 3, nm: `slot${i}`, sr: 1, ip: 0, op: FRAMES, st: 0, ao: 0,
      ks: { o: val(0), r: val(0), p: anim(pos), a: val([0, 0, 0]), s: anim(scale) } });
    for (const [list, visible] of [[top, true], [bottom, false]] as const) {
      const o = anim(front.map(f => ({ ...f, s: [visible ? f.s[0] : 100 - f.s[0]] })));
      list.push({ ddd: 0, ind: ind++, ty: 2, nm: `logo${i}`, refId: `logo${i}`, parent: holder, sr: 1, ip: 0, op: FRAMES, st: 0, ao: 0,
        ks: { o, r: val(0), p: val([0, 0, 0]), a: val([TILE / 2, TILE / 2, 0]), s: val([84, 84, 100]) } });
      list.push({ ddd: 0, ind: ind++, ty: 4, nm: `tile${i}`, parent: holder, sr: 1, ip: 0, op: FRAMES, st: 0, ao: 0,
        ks: { o, r: val(0), p: val([0, 0, 0]), a: val([0, 0, 0]), s: val([100, 100, 100]) },
        shapes: [{ ty: 'gr', it: [
          { ty: 'rc', d: 1, s: val([TILE, TILE]), p: val([0, 0]), r: val(12) },
          { ty: 'fl', c: val([1, 1, 1, 1]), o: val(100) },
          { ty: 'tr', p: val([0, 0]), a: val([0, 0]), s: val([100, 100]), r: val(0), o: val(100) },
        ] }] });
    }
  });

  const bob: { t: number; s: number[] }[] = [];
  for (let t = 0; t <= FRAMES; t += STEP) bob.push({ t, s: [cx, cy + Math.sin((t / FPS) * (1000 / 700)) * 6, 0] });
  const emblemLayer = { ddd: 0, ind: ind++, ty: 2, nm: 'emblem', refId: 'emblem', sr: 1, ip: 0, op: FRAMES, st: 0, ao: 0,
    ks: { o: val(100), r: val(0), p: anim(bob), a: val([assets[0].w / 2, assets[0].h / 2, 0]), s: val([100, 100, 100]) } };
  const ring = { ddd: 0, ind: ind++, ty: 4, nm: 'ring', sr: 1, ip: 0, op: FRAMES, st: 0, ao: 0,
    ks: { o: val(100), r: val(0), p: val([cx, cy, 0]), a: val([0, 0, 0]), s: val([100, 100, 100]) },
    shapes: [{ ty: 'gr', it: [
      { ty: 'el', d: 1, s: val([R * 2, R * 2 * Math.cos(tilt)]), p: val([0, 0]) },
      { ty: 'st', c: val([98 / 255, 60 / 255, 205 / 255, 1]), o: val(30), w: val(2), lc: 1, lj: 1, d: [{ n: 'd', nm: 'dash', v: val(6) }, { n: 'g', nm: 'gap', v: val(6) }] },
      { ty: 'tr', p: val([0, 0]), a: val([0, 0]), s: val([100, 100]), r: val(0), o: val(100) },
    ] }] };

  // Lottie draws the first layer on top
  return { v: '5.7.4', fr: FPS, ip: 0, op: FRAMES, w: W, h: H, nm: 'cause orbit', ddd: 0, assets, layers: [...top, emblemLayer, ...bottom, ring] };
}

const LottieOrbit = ({ emblem, items, size = 300, onFirstFrame, onWork }: LabVariantProps & { items: OrbitItem[] }) => {
  const host = useRef<HTMLDivElement>(null);
  const shown = items.slice(0, ORBIT_MAX);

  useEffect(() => {
    const player = lottie.loadAnimation({
      container: host.current!, renderer: 'svg', loop: true, autoplay: false,
      animationData: orbitAnimation(emblem, shown, size),
    });
    // Driven by our own frame loop so the time spent per frame can be measured
    let raf = 0, first = true, visible = true;
    const reduced = prefersReducedMotion();
    const frame = (t: number) => {
      raf = 0;
      const t0 = performance.now();
      player.goToAndStop(reduced ? 0 : ((t % ORBIT_PERIOD) / ORBIT_PERIOD) * FRAMES, true);
      onWork?.(performance.now() - t0);
      if (first) { first = false; requestAnimationFrame(() => onFirstFrame?.()); }
      if (!reduced && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const resume = () => { if (!raf && visible && !document.hidden && !reduced) raf = requestAnimationFrame(frame); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; resume(); });
    io.observe(host.current!);
    document.addEventListener('visibilitychange', resume);
    player.addEventListener('DOMLoaded', () => { raf = requestAnimationFrame(frame); });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener('visibilitychange', resume);
      player.destroy();
    };
  }, [emblem, size, shown.length, onFirstFrame, onWork]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={host} aria-hidden className="mx-auto" style={{ width: size, height: size * 0.82 }} />;
};

export default LottieOrbit;
