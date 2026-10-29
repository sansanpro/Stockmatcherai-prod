import { Capacitor } from '@capacitor/core';

// iOS text size (Dynamic Type). The app's type and spacing are in rem, so scaling the root scales
// everything. iOS reports the body size through the system font: 17 px at the default setting.
// The default keeps today's 16 px root; larger settings grow it up to MAX (1.25x), where the
// deck still fits a phone screen. Native iOS only: desktop Safari reports its own, smaller size.
const IOS_DEFAULT_BODY = 17;
const MIN = 14;
export const MAX_ROOT = 20;
export const LARGE_FROM = 18; // from here, crowded rows switch to roomier layouts (the `text-large` class)

export function rootSizeFor(bodyPx: number) {
  return Math.round(Math.min(MAX_ROOT, Math.max(MIN, (bodyPx * 16) / IOS_DEFAULT_BODY)) * 4) / 4;
}

export function setRootSize(px: number) {
  const root = document.documentElement;
  root.style.fontSize = px === 16 ? '' : `${px}px`;
  root.classList.toggle('text-large', px >= LARGE_FROM);
}

function apply() {
  const probe = document.createElement('span');
  probe.style.cssText = 'font: -apple-system-body; position: absolute; visibility: hidden';
  document.body.appendChild(probe);
  const body = parseFloat(getComputedStyle(probe).fontSize);
  probe.remove();
  if (body) setRootSize(rootSizeFor(body));
}

export function followIOSTextSize() {
  if (Capacitor.getPlatform() !== 'ios' || !Capacitor.isNativePlatform()) return;
  apply();
  // Changing the size in iOS Settings happens with the app in the background
  document.addEventListener('visibilitychange', () => { if (!document.hidden) apply(); });
}
