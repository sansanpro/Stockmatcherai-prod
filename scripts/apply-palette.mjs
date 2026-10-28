#!/usr/bin/env node
// Swaps a palette direction into a COPY of the app (a git worktree), so the real screens can be
// screenshotted in each direction without touching the working tree. Phase 0 tool, not the token
// system: it maps today's hard-coded colors onto the direction's tokens.
// Usage: node scripts/apply-palette.mjs <direction-id> <worktree-dir>
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const [id, root] = process.argv.slice(2);
const tk = JSON.parse(readFileSync('docs/phase0/tokens.json', 'utf8'))[id];
if (!tk || !root) { console.error('usage: apply-palette.mjs <direction> <worktree-dir>'); process.exit(1); }
const hex = (t) => t.hex;

// Today's colors -> roles in the direction
const map = {
  '#FAF6EF': hex(tk.base), '#F3ECE1': hex(tk.surface2), '#E9DFD0': hex(tk.border), '#E8DFD1': hex(tk.border), '#F0E8DD': hex(tk.surface2),
  '#1F1A15': hex(tk.text), '#5F554B': hex(tk.text2), '#6E645A': hex(tk.text3), '#8A7F74': hex(tk.text4), '#7A4A2A': hex(tk.text2),
  '#CC6A44': hex(tk.primary.bright), '#B54A22': hex(tk.primary.deep), '#8A3A18': hex(tk.primary.ink), '#FBE7DC': hex(tk.primary.tint), '#F6D3C1': hex(tk.primary.soft),
  '#EEF4E6': hex(tk.positive.tint), '#CFE0BC': hex(tk.positive.border), '#3B6A2A': hex(tk.positive.deep),
  '#FBF0DC': hex(tk.info.tint), '#EED9B0': hex(tk.info.border), '#8A5A12': hex(tk.info.deep),
  '#FDE8E1': hex(tk.caution.tint), '#F3C2B3': hex(tk.caution.border), '#9A3412': hex(tk.caution.deep),
};

const toHsl = (h) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let hue = 0, s = 0;
  if (max !== min) {
    const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    hue = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; hue *= 60;
  }
  return `${Math.round(hue)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};
const vars = {
  background: tk.base, foreground: tk.text, card: tk.surface, 'card-foreground': tk.text, popover: tk.surface, 'popover-foreground': tk.text,
  primary: tk.primary.deep, secondary: tk.surface2, 'secondary-foreground': tk.text, muted: tk.surface2, 'muted-foreground': tk.text3,
  accent: tk.primary.tint, 'accent-foreground': tk.primary.ink, border: tk.border, input: tk.border, ring: tk.primary.deep,
};

// 1. CSS variables
const cssPath = path.join(root, 'src/index.css');
let css = readFileSync(cssPath, 'utf8');
for (const [k, v] of Object.entries(vars)) css = css.replace(new RegExp(`(--${k}:)\\s*[^;]+;`), `$1 ${toHsl(v.hex)};`);
writeFileSync(cssPath, css);

// 2. Cause tones (their own block, since some share hex values with other roles today)
const chipsPath = path.join(root, 'src/components/values/CauseChips.tsx');
let chips = readFileSync(chipsPath, 'utf8');
for (const [cause, c] of Object.entries(tk.causes)) {
  chips = chips.replace(new RegExp(`(  ${cause}: \\{ header: 'bg-\\[)#[0-9A-Fa-f]{6}(\\]', text: 'text-\\[)#[0-9A-Fa-f]{6}(\\]', border: 'border-\\[)#[0-9A-Fa-f]{6}`),
    `$1${c.tint.hex}$2${c.deep.hex}$3${c.border.hex}`);
}
writeFileSync(chipsPath, chips);

// 3. Every other hard-coded color in the UI and the Tailwind config
const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = path.join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(tsx?|css)$/.test(f)) files.push(p); } };
walk(path.join(root, 'src'));
files.push(path.join(root, 'tailwind.config.ts'), path.join(root, 'index.html'));
let changed = 0;
for (const f of files) {
  if (f === chipsPath) continue;
  const before = readFileSync(f, 'utf8');
  const after = before.replace(/#[0-9A-Fa-f]{6}\b/g, (m) => map[m.toUpperCase()] ?? m);
  if (after !== before) { writeFileSync(f, after); changed++; }
}
console.log(`${id}: variables, cause tones and ${changed} files updated in ${root}`);
