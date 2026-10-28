import type { Page } from '@playwright/test';

// Measures the rendered screen: every visible text element's color against the solid background
// behind it (walking up to the nearest opaque fill; gradients use their base color). Text under
// 4.5:1 (or 3:1 when large: 24px, or 18.66px bold).
export interface ContrastFailure { text: string; ratio: number; need: number; color: string }

export async function measureContrast(page: Page): Promise<ContrastFailure[]> {
  const failures = await page.evaluate(() => {
    const parse = (c: string) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const lum = ({ r, g, b }: { r: number; g: number; b: number }) => { const f = (v: number) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const over = (top: { r: number; g: number; b: number; a: number }, under: { r: number; g: number; b: number }) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a) });
    const bgOf = (el: Element | null): { r: number; g: number; b: number } => {
      const layers: { r: number; g: number; b: number; a: number }[] = [];
      for (let e = el; e; e = e.parentElement) {
        const c = parse(getComputedStyle(e).backgroundColor);
        if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
      }
      let acc = { r: 255, g: 255, b: 255 };
      for (const l of layers.reverse()) acc = over(l, acc);
      return acc;
    };
    const out: { text: string; ratio: number; need: number; color: string }[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set<Element>();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement; const text = (n.textContent ?? '').trim();
      if (!el || !text || seen.has(el)) continue; seen.add(el);
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || Number(cs.opacity) === 0 || r.bottom < 0 || r.top > innerHeight) continue;
      if (el.closest('[aria-hidden="true"], button:disabled, [disabled]')) continue;
      const fg0 = parse(cs.color); if (!fg0) continue;
      const bg = bgOf(el); const fg = over(fg0, bg);
      const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a); const ratio = (hi + 0.05) / (lo + 0.05);
      const size = parseFloat(cs.fontSize); const bold = Number(cs.fontWeight) >= 700;
      const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
      if (ratio < need) out.push({ text: text.slice(0, 60), ratio: Math.round(ratio * 100) / 100, need, color: cs.color });
    }
    return out;
  });
  return failures;
}
