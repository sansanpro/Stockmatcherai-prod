import type { CSSProperties } from 'react';
import CompanyLogo from '@/components/values/CompanyLogo';

export interface OrbitItem {
  ticker: string;
  name: string;
  logoUrl?: string | null;
}

interface CauseOrbitProps {
  emblem: string; // the cause's 3D art
  items: OrbitItem[]; // the companies circling it (up to 8 are shown)
  size?: number; // px, the width of the scene
  className?: string;
}

export const ORBIT_TILT = 68; // degrees the ring is tipped back from facing you
export const ORBIT_PERIOD = 24000; // ms for one turn
export const ORBIT_MAX = 8;

// The cause emblem with companies circling it on a tipped ring (Phase 4, docs/phase-4.md).
// Pure CSS 3D transforms: each logo runs the same keyframes, offset by a negative delay, so the
// browser's compositor moves everything and no JavaScript runs per frame. The emblem stands upright
// in the same 3D space, so logos pass behind it and in front of it. Under reduced motion the ring holds still.
const CauseOrbit = ({ emblem, items, size = 300, className = '' }: CauseOrbitProps) => {
  const shown = items.slice(0, ORBIT_MAX);
  const scene = {
    width: size,
    height: size * 0.82,
    '--orbit-r': `${Math.round(size * 0.4)}px`,
    '--orbit-tilt': `${ORBIT_TILT}deg`,
    '--orbit-period': `${ORBIT_PERIOD}ms`,
  } as CSSProperties;

  return (
    <div aria-hidden className={`cause-orbit relative mx-auto ${className}`} style={scene}>
      <div className="cause-orbit-plane">
        <div className="cause-orbit-ring" />
        <div className="cause-orbit-emblem" style={{ width: size * 0.42, height: size * 0.42 }}>
          <img src={emblem} alt="" draggable={false} className="art-3d w-full h-full select-none drop-shadow-[0_14px_18px_rgb(var(--primary-deep)/0.18)]" />
        </div>
        {shown.map((s, i) => (
          <div
            key={s.ticker}
            className="cause-orbit-item"
            style={{ '--a': `${(360 * i) / shown.length}deg`, animationDelay: `${-(ORBIT_PERIOD * i) / shown.length}ms` } as CSSProperties}
          >
            <div className="reel-pop" style={{ animationDelay: `${300 + i * 90}ms` }}>
              <CompanyLogo src={s.logoUrl} name={s.name} ticker={s.ticker} className="w-12 h-12 border-2 border-white" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CauseOrbit;
