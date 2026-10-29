import { useEffect, useRef } from 'react';
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, TorusGeometry, MeshStandardMaterial,
  InstancedMesh, IcosahedronGeometry, Object3D, HemisphereLight, DirectionalLight, Sprite,
  SpriteMaterial, TextureLoader, SRGBColorSpace, Vector3, Color,
} from 'three';
import CompanyLogo from '@/components/values/CompanyLogo';
import { ORBIT_MAX, ORBIT_PERIOD, ORBIT_TILT, type OrbitItem } from '@/components/values/CauseOrbit';
import { prefersReducedMotion } from '@/lib/motion';
import type { LabVariantProps } from './OrbitLab';

const rgb = (name: string) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim().split(/\s+/).map(Number);
  return new Color(v[0] / 255, v[1] / 255, v[2] / 255);
};

// Phase 4 prototype, option 1: real-time 3D with three.js. One scene: the emblem as a sprite, a lit
// ring and 36 instanced sparkles. Logos can't be WebGL textures (the logo host sends no CORS headers),
// so they are DOM tiles placed each frame from projected 3D positions, above or below the canvas by depth.
// Pauses off-screen; drops the pixel ratio when frames run long (level of detail).
const ThreeOrbit = ({ emblem, items, size = 300, onFirstFrame, onWork }: LabVariantProps & { items: OrbitItem[] }) => {
  const host = useRef<HTMLDivElement>(null);
  const tiles = useRef<(HTMLDivElement | null)[]>([]);
  const shown = items.slice(0, ORBIT_MAX);

  useEffect(() => {
    const el = host.current!;
    const w = size, h = size * 0.82;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h);
    Object.assign(renderer.domElement.style, { position: 'absolute', left: '0', top: '0', zIndex: '1' }); // keeps setSize's CSS size
    el.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(32, w / h, 0.1, 50);
    camera.position.set(0, 0, 6);
    scene.add(new HemisphereLight(0xffffff, rgb('--primary-tint'), 1.6));
    const sun = new DirectionalLight(0xffffff, 1.8);
    sun.position.set(2, 3, 4);
    scene.add(sun);

    const R = 1.25; // world units; the camera frames about ±1.6
    const ring = new Group();
    ring.rotation.x = ((90 - ORBIT_TILT) * Math.PI) / 180; // tipped back like the CSS version
    scene.add(ring);
    const torus = new Mesh(new TorusGeometry(R, 0.018, 12, 128), new MeshStandardMaterial({ color: rgb('--primary'), roughness: 0.35, metalness: 0.2, transparent: true, opacity: 0.55 }));
    torus.rotation.x = Math.PI / 2; // lie flat in the ring's plane, where the logos travel
    ring.add(torus);

    const SPARKS = 36;
    const sparks = new InstancedMesh(new IcosahedronGeometry(0.035, 0), new MeshStandardMaterial({ color: rgb('--highlight'), emissive: rgb('--highlight'), emissiveIntensity: 0.4, roughness: 0.3 }), SPARKS);
    const o = new Object3D();
    for (let i = 0; i < SPARKS; i++) {
      const a = (i / SPARKS) * Math.PI * 2 + Math.sin(i * 7.1) * 0.08;
      const rr = R + Math.sin(i * 3.3) * 0.09;
      o.position.set(Math.cos(a) * rr, Math.sin(i * 5.7) * 0.05, Math.sin(a) * rr);
      o.rotation.set(i, i * 2, 0);
      o.scale.setScalar(0.6 + ((i * 37) % 10) / 15);
      o.updateMatrix();
      sparks.setMatrixAt(i, o.matrix);
    }
    ring.add(sparks);

    const emblemTex = new TextureLoader().load(emblem, () => { ready = true; });
    emblemTex.colorSpace = SRGBColorSpace;
    const sprite = new Sprite(new SpriteMaterial({ map: emblemTex }));
    sprite.scale.setScalar(1.15);
    scene.add(sprite);

    let ready = false, first = true, running = true, visible = true, raf = 0;
    const reduced = prefersReducedMotion();
    const p = new Vector3();
    const recent: number[] = [];
    let last = 0;

    const frame = (t: number) => {
      raf = 0;
      const t0 = performance.now();
      const turn = reduced ? 0 : (t / ORBIT_PERIOD) * Math.PI * 2;
      sparks.rotation.y = -turn * 0.25; // the sparkles drift slower than the logos
      sprite.position.y = reduced ? 0 : Math.sin(t / 700) * 0.04;
      ring.updateMatrixWorld();
      // Logos: place each tile at its projected point, scaled by depth, in front of or behind the canvas
      for (let i = 0; i < shown.length; i++) {
        const tile = tiles.current[i];
        if (!tile) continue;
        const a = turn + (i / shown.length) * Math.PI * 2;
        p.set(Math.cos(a) * R, 0, Math.sin(a) * R).applyMatrix4(ring.matrixWorld);
        const front = p.z > 0;
        const depth = 6 / (6 - p.z);
        p.project(camera);
        tile.style.transform = `translate3d(${((p.x + 1) / 2) * w - 24}px,${((1 - p.y) / 2) * h - 24}px,0) scale(${depth.toFixed(3)})`;
        const z = front ? '2' : '0';
        if (tile.style.zIndex !== z) tile.style.zIndex = z;
      }
      renderer.render(scene, camera);
      onWork?.(performance.now() - t0);
      if (ready && first) { first = false; requestAnimationFrame(() => onFirstFrame?.()); }
      // Level of detail: if the median of the last 60 frames runs long, render fewer pixels
      if (last) {
        recent.push(t - last);
        if (recent.length === 60) {
          const median = [...recent].sort((x, y) => x - y)[30];
          if (median > 18 && dpr > 1) { dpr = Math.max(1, dpr - 0.5); renderer.setPixelRatio(dpr); renderer.setSize(w, h); }
          recent.length = 0;
        }
      }
      last = t;
      if (running && visible && !document.hidden && (!reduced || !ready)) raf = requestAnimationFrame(frame);
    };
    const resume = () => { if (!raf && running && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; resume(); });
    io.observe(el);
    document.addEventListener('visibilitychange', resume);
    raf = requestAnimationFrame(frame);
    (window as unknown as { __orbitDpr?: () => number }).__orbitDpr = () => dpr;

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener('visibilitychange', resume);
      renderer.dispose();
      emblemTex.dispose();
      renderer.domElement.remove();
    };
  }, [emblem, size, shown.length, onFirstFrame, onWork]);

  return (
    <div ref={host} aria-hidden className="relative mx-auto" style={{ width: size, height: size * 0.82 }}>
      {shown.map((s, i) => (
        <div key={s.ticker} ref={(n) => { tiles.current[i] = n; }} className="absolute left-0 top-0 will-change-transform">
          <CompanyLogo src={s.logoUrl} name={s.name} ticker={s.ticker} className="w-12 h-12 border-2 border-white" />
        </div>
      ))}
    </div>
  );
};

export default ThreeOrbit;
