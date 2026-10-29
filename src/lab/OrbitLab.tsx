import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { CAUSE_ART } from '@/lib/art';
import Art3D from '@/components/onboarding/Art3D';
import type { OrbitItem } from '@/components/values/CauseOrbit';
import type { StockRecommendation } from '@/types/stock-matcher';

// Phase 4 lab (docs/phase-4.md): the recap "orbit" built three ways, measured the same way.
// Only in dev or a VITE_LAB=1 build. /lab/orbit?v=css|three|lottie|static&measure=10000&report=<url>
export interface LabVariantProps {
  emblem: string;
  size?: number;
  onFirstFrame?: () => void;
  onWork?: (ms: number) => void; // JavaScript time spent drawing one frame
}

const SAMPLE: OrbitItem[] = ['NEE', 'ENPH', 'FSLR', 'BEP', 'ORA', 'XYL', 'AWK', 'VWS'].map(t => ({
  ticker: t, name: t, logoUrl: `https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/${t}.png`,
}));

type Props = LabVariantProps & { items: OrbitItem[] };
const VARIANTS: Record<string, () => Promise<{ default: ComponentType<Props> }>> = {
  css: () => import('@/components/values/CauseOrbit').then(m => ({ default: CssVariant(m.default) })),
  three: () => import('./ThreeOrbit'),
  lottie: () => import('./LottieOrbit'),
  // The real recap with sample likes; it reaches the orbit slide after about 14 s
  recap: () => import('@/components/DailyRecap').then(m => ({ default: ({ items }: Props) => {
    const liked = items.slice(0, 5).map(s => ({ ticker: s.ticker, companyName: s.name, logoUrl: s.logoUrl, riskLevel: 'medium',
      matchedCauses: [{ cause: 'clean_energy', label: 'Clean energy & climate', icon: '☀️', exposure: 'core' }] }) as unknown as StockRecommendation);
    return <m.default liked={liked} deckSize={7} myCauses={[{ id: 'clean_energy', label: 'Clean energy & climate', tagline: '', icon: '☀️', companies: 0 }]} onClose={() => undefined} />;
  } })),
  static: async () => ({ default: ({ emblem, onFirstFrame }: Props) => { useDecoded(emblem, onFirstFrame); return <Art3D src={emblem} size={126} />; } }),
};

// CSS has no "ready" event: count the first frame once the emblem has decoded and been painted
function useDecoded(src: string, done?: () => void) {
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.decode().catch(() => undefined).then(() => requestAnimationFrame(() => requestAnimationFrame(() => done?.())));
  }, [src, done]);
}
function CssVariant(Orbit: ComponentType<Omit<Props, 'onFirstFrame' | 'onWork'>>) {
  return (p: Props) => { useDecoded(p.emblem, p.onFirstFrame); return <Orbit emblem={p.emblem} items={p.items} size={p.size} />; };
}

const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; };
const round = (x: number) => Math.round(x * 100) / 100;

const params = new URLSearchParams(window.location.search);
const variant = params.get('v') ?? 'css';
const Variant = lazy(VARIANTS[variant] ?? VARIANTS.css);

const OrbitLab = () => {
  const t0 = useRef(performance.now());
  const work = useRef<number[]>([]);
  const [status, setStatus] = useState('loading');

  const onWork = useCallback((ms: number) => { work.current.push(ms); }, []);
  const onFirstFrame = useCallback(() => {
    const ttff = performance.now() - t0.current;
    const duration = Number(params.get('measure') || 0);
    setStatus(`first frame ${Math.round(ttff)} ms`);
    if (!duration) return;
    // Warm up 1 s, then record every frame interval for `duration`
    setTimeout(() => {
      const frames: number[] = [];
      work.current = [];
      let last = 0;
      const start = performance.now();
      const tick = (t: number) => {
        if (last) frames.push(t - last);
        last = t;
        if (performance.now() - start < duration) { requestAnimationFrame(tick); return; }
        const result = {
          variant, ua: navigator.userAgent, dpr: window.devicePixelRatio,
          renderDpr: (window as unknown as { __orbitDpr?: () => number }).__orbitDpr?.() ?? null,
          ttffMs: Math.round(ttff),
          frames: { count: frames.length, p50: round(pct(frames, 0.5)), p95: round(pct(frames, 0.95)), max: round(Math.max(...frames)),
            late: frames.filter(f => f > 16.7 * 1.5).length },
          workMs: work.current.length ? { p50: round(pct(work.current, 0.5)), p95: round(pct(work.current, 0.95)) } : { p50: 0, p95: 0 },
        };
        (window as unknown as { __orbit: unknown }).__orbit = result;
        setStatus(`done: p95 ${result.frames.p95} ms`);
        const report = params.get('report');
        if (report) fetch(report, { method: 'POST', body: JSON.stringify(result) }).catch(() => undefined);
      };
      requestAnimationFrame(tick);
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-daybreak flex flex-col items-center justify-center gap-6 p-6">
      <p className="text-xs text-ink-soft">Lab: {variant} · {status}</p>
      <Suspense fallback={null}>
        <Variant emblem={CAUSE_ART[params.get('cause') ?? 'clean_energy'] ?? CAUSE_ART.clean_energy} items={SAMPLE} size={300} onFirstFrame={onFirstFrame} onWork={onWork} />
      </Suspense>
      <h2 className="text-[2.125rem] font-bold text-primary leading-[1.1] tracking-tight text-center">The Sun Chaser</h2>
    </div>
  );
};

export default OrbitLab;
