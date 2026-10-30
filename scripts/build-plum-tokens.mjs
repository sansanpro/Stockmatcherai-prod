#!/usr/bin/env node
// Writes src/styles/tokens.css with the plum and coral palette (adopted 2026-10-30 from the owner's
// mockups): a plum card header with a coral glow, coral as the one brand color, warm white and light
// peach in light mode, and a warm plum-black in dark mode, which follows the iPhone's setting.
// Before writing, it checks every text pairing the app uses for WCAG AA (4.5:1) in both modes and
// exits non-zero if any fails. Usage: node scripts/build-plum-tokens.mjs
// (scripts/build-cream-tokens.mjs still writes the previous cream palette.)
import { writeFileSync } from 'node:fs';

// deep = text and icons, ink = text on soft, bright = graphics, vivid = bands, soft = badges, border,
// tint = boxes, light = text and icons on the plum header (the same in both modes)
const LIGHT = {
  surfaces: {
    base: '#FFF8F4', // warm white
    surface: '#FFFFFF',
    surface2: '#FDEFE7', // light peach tiles
    border: '#F2E0D6',
    text: '#1E1418',
    text2: '#574850',
    text3: '#65555C',
    text4: '#6F5F66',
    highlight: '#E2603A', // coral
    shadow: '#3B1830', // plum
    'on-primary': '#FFFFFF',
    'plum-1': '#33142A',
    'plum-2': '#5A2540',
    glow: '#F0785A',
    'gain-on-plum': '#7EE08A',
  },
  families: {
    primary: { deep: '#B8441F', ink: '#923416', bright: '#E8643C', vivid: '#F9D2C2', soft: '#FBDCCF', border: '#F6C9B6', tint: '#FEEEE6' },
    positive: { deep: '#2F6B33', ink: '#24532A', bright: '#3E8A44', vivid: '#E3F1E2', soft: '#DDEEDC', border: '#C6E0C4', tint: '#EEF7ED' }, // Proof, gains
    info: { deep: '#875610', ink: '#6B4510', bright: '#D99A2B', vivid: '#FBEBC8', soft: '#FAE3B5', border: '#F0D49A', tint: '#FDF3DE' }, // Things to know
    caution: { deep: '#A3361A', ink: '#7E2A14', bright: '#D0503A', vivid: '#FAD6CB', soft: '#FADCD2', border: '#F3C3B4', tint: '#FDECE6' }, // Big swings
    premium: { deep: '#B8441F', ink: '#923416', bright: '#E8643C', vivid: '#F9D2C2', soft: '#FBDCCF', border: '#F6C9B6', tint: '#FEEEE6' },
    donation: { deep: '#A3304A', ink: '#7E2238', bright: '#C2455F', vivid: '#F7D3DA', soft: '#F7D9DF', border: '#F0C2CB', tint: '#FBE4E7' },
  },
  causes: {
    beat_cancer: { deep: '#A3304A', ink: '#7E2238', bright: '#D2557A', vivid: '#FBE4E7', soft: '#FBE4E7', border: '#F0C2CB', tint: '#FDF1F3', light: '#F7B8CB' },
    live_healthier: { deep: '#A33A22', ink: '#7E2C18', bright: '#E0704E', vivid: '#FCE6DC', soft: '#FCE6DC', border: '#F0C6B3', tint: '#FEF2EC', light: '#FFC2A8' },
    clean_energy: { deep: '#3B6A2A', ink: '#2C5220', bright: '#6AA84F', vivid: '#E6EFDB', soft: '#E6EFDB', border: '#C7DAB2', tint: '#F2F7EC', light: '#BDE3A3' },
    keeping_safe: { deep: '#2C5288', ink: '#1F3D68', bright: '#5E86C4', vivid: '#E2EAF5', soft: '#E2EAF5', border: '#C0D1E8', tint: '#F0F4FA', light: '#B9CFF2' },
    mental_health: { deep: '#1D6359', ink: '#154A43', bright: '#3FA392', vivid: '#DDF0EC', soft: '#DDF0EC', border: '#B5DCD3', tint: '#EEF8F6', light: '#A6E3D6' },
    clean_food: { deep: '#735512', ink: '#57400D', bright: '#C2952E', vivid: '#F6EDD6', soft: '#F6EDD6', border: '#E8D6A8', tint: '#FBF6EA', light: '#F2D58C' },
    clean_water: { deep: '#1B5A7A', ink: '#13435C', bright: '#3F92BB', vivid: '#DDEEF7', soft: '#DDEEF7', border: '#B4D6E8', tint: '#EEF6FB', light: '#A9D8F0' },
  },
};

// Warm plum-black, lighter coral. Text tones flip to light; boxes become dark tints.
const DARK = {
  surfaces: {
    base: '#1A0F15',
    surface: '#24151C',
    surface2: '#33212B',
    border: '#432E39',
    text: '#F6ECEA',
    text2: '#DCCBCD',
    text3: '#C6B3B6',
    text4: '#B5A1A6',
    highlight: '#FF9B76',
    shadow: '#000000',
    'on-primary': '#2A1018',
    'plum-1': '#2E1226',
    'plum-2': '#4E2038',
    glow: '#F0785A',
    'gain-on-plum': '#7EE08A',
  },
  families: {
    primary: { deep: '#FF9B76', ink: '#FFB89C', bright: '#FF9B76', vivid: '#5A2A22', soft: '#4F2620', border: '#6E3A2C', tint: '#3A1C1D' },
    positive: { deep: '#8FD694', ink: '#A9E2AD', bright: '#6CC172', vivid: '#1F3A24', soft: '#22402A', border: '#335A3A', tint: '#1B2E1F' },
    info: { deep: '#F2C46B', ink: '#F7D48E', bright: '#E0A840', vivid: '#3E2E12', soft: '#45331A', border: '#5E4622', tint: '#2E2312' },
    caution: { deep: '#FFA28B', ink: '#FFBBA9', bright: '#F07A5E', vivid: '#4A2018', soft: '#4A221B', border: '#6E3426', tint: '#331816' },
    premium: { deep: '#FF9B76', ink: '#FFB89C', bright: '#FF9B76', vivid: '#5A2A22', soft: '#4F2620', border: '#6E3A2C', tint: '#3A1C1D' },
    donation: { deep: '#F59AB0', ink: '#F9B7C7', bright: '#E5708C', vivid: '#4A1C28', soft: '#4A1F2B', border: '#6E2E3F', tint: '#331520' },
  },
  causes: {
    beat_cancer: { deep: '#F7A9BE', ink: '#FAC2D1', bright: '#D2557A', vivid: '#4A1C28', soft: '#4A1F2B', border: '#6E2E3F', tint: '#2E1520', light: '#F7B8CB' },
    live_healthier: { deep: '#FFB396', ink: '#FFC8B2', bright: '#E0704E', vivid: '#4A2318', soft: '#4A261C', border: '#6E3A2A', tint: '#2E1A16', light: '#FFC2A8' },
    clean_energy: { deep: '#B2DC96', ink: '#C6E6B0', bright: '#6AA84F', vivid: '#22381A', soft: '#263E1E', border: '#3A5A2C', tint: '#1A2616', light: '#BDE3A3' },
    keeping_safe: { deep: '#AFC7F0', ink: '#C4D6F5', bright: '#5E86C4', vivid: '#1C2A44', soft: '#1F2E4A', border: '#33466A', tint: '#171E2C', light: '#B9CFF2' },
    mental_health: { deep: '#99DCCD', ink: '#B4E6DA', bright: '#3FA392', vivid: '#173A34', soft: '#1A3F38', border: '#2C5C52', tint: '#14261F', light: '#A6E3D6' },
    clean_food: { deep: '#EFCD7E', ink: '#F4DA9E', bright: '#C2952E', vivid: '#3A2E12', soft: '#403216', border: '#5C4A22', tint: '#272010', light: '#F2D58C' },
    clean_water: { deep: '#9DD0EC', ink: '#B7DCF1', bright: '#3F92BB', vivid: '#16334A', soft: '#19384F', border: '#2C516A', tint: '#13212C', light: '#A9D8F0' },
  },
};

// WCAG 2 contrast
const lum = (h) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const mix = (fg, bg, alpha) => '#' + [1, 3, 5].map(i => {
  const v = Math.round(parseInt(fg.slice(i, i + 2), 16) * alpha + parseInt(bg.slice(i, i + 2), 16) * (1 - alpha));
  return v.toString(16).padStart(2, '0');
}).join('');

function pairs(P) {
  const s = P.surfaces, out = [];
  const add = (name, fg, bg, min = 4.5) => out.push({ name, fg, bg, min });
  for (const t of ['text', 'text2', 'text3', 'text4']) for (const b of ['base', 'surface', 'surface2']) add(`${t} on ${b}`, s[t], s[b]);
  add('on-primary on primary', s['on-primary'], P.families.primary.deep);
  add('on-primary on primary-ink (pressed)', s['on-primary'], P.families.primary.ink);
  for (const [fam, f] of Object.entries(P.families)) {
    for (const b of ['base', 'surface', 'surface2']) add(`${fam}-deep on ${b}`, f.deep, s[b]);
    add(`${fam}-deep on its tint`, f.deep, f.tint);
    add(`${fam}-ink on its soft`, f.ink, f.soft);
    add(`${fam}-ink on its vivid`, f.ink, f.vivid);
  }
  for (const [c, f] of Object.entries(P.causes)) {
    add(`${c} deep on surface`, f.deep, s.surface);
    add(`${c} deep on its tint`, f.deep, f.tint);
    add(`${c} ink on its soft`, f.ink, f.soft);
    add(`${c} text on its vivid`, s.text, f.vivid);
    // On the plum header the chip is the cause's bright tone at 20% over plum
    for (const p of ['plum-1', 'plum-2']) add(`${c} light on its chip (${p})`, f.light, mix(f.bright, s[p], 0.2));
  }
  for (const p of ['plum-1', 'plum-2']) {
    add(`white on ${p}`, '#FFFFFF', s[p]);
    add(`white 75% on ${p}`, mix('#FFFFFF', s[p], 0.75), s[p]);
    add(`gain on the pill (${p})`, s['gain-on-plum'], mix('#000000', s[p], 0.25));
    add(`white 85% on the pill (${p})`, mix('#FFFFFF', s[p], 0.85), mix('#000000', s[p], 0.25));
  }
  return out;
}

let failed = 0;
for (const [mode, P] of [['light', LIGHT], ['dark', DARK]]) {
  const results = pairs(P).map(p => ({ ...p, r: ratio(p.fg, p.bg) }));
  const bad = results.filter(p => p.r < p.min);
  const low = results.reduce((a, b) => (a.r < b.r ? a : b));
  console.log(`${mode}: ${results.length - bad.length}/${results.length} pairings pass AA, lowest ${low.r.toFixed(2)} (${low.name})`);
  for (const b of bad) console.log(`  ✗ ${b.name}: ${b.r.toFixed(2)} (${b.fg} on ${b.bg})`);
  failed += bad.length;
}
if (failed) { console.error(`\n${failed} pairing(s) fail; tokens.css not written`); process.exit(1); }

const rgb = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(' ');
const block = (P, indent) => {
  const line = (name, hex) => `${indent}--${name}: ${rgb(hex)}; /* ${hex} */`;
  const out = [`${indent}/* Surfaces and text */`];
  for (const [k, v] of Object.entries(P.surfaces)) out.push(line(k, v));
  out.push(`${indent}/* Families */`);
  for (const [fam, tones] of Object.entries(P.families)) for (const [tone, v] of Object.entries(tones)) out.push(line(`${fam}-${tone}`, v));
  out.push(`${indent}/* Causes */`);
  for (const [c, tones] of Object.entries(P.causes)) for (const [tone, v] of Object.entries(tones)) out.push(line(`cause-${c.replace(/_/g, '-')}-${tone}`, v));
  return out;
};
const css = [
  `/* Generated by scripts/build-plum-tokens.mjs: the plum and coral palette, light and dark.
   Colors are "R G B" triplets so Tailwind's opacity modifiers work and iOS 15.0 web views render them.
   Dark mode follows the system setting. Edit the script, not this file. */`,
  ':root {', ...block(LIGHT, '  '), '}',
  '@media (prefers-color-scheme: dark) {', '  :root {', ...block(DARK, '    '), '  }', '}',
];
writeFileSync('src/styles/tokens.css', css.join('\n') + '\n');
console.log('wrote src/styles/tokens.css (plum and coral, light and dark)');
