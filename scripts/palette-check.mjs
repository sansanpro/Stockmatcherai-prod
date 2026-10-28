#!/usr/bin/env node
// Tests palette directions with instruments instead of opinion:
//   - converts OKLCH tokens to sRGB (reducing chroma until the color is displayable)
//   - WCAG 2 contrast for every text pairing the app uses (AA: 4.5:1 for text)
//   - color-blindness simulation (Machado et al. 2009, full severity) for protanopia,
//     deuteranopia and tritanopia, then the smallest perceptual distance (OKLab ΔE) between
//     colors that must stay tellable apart: the 7 causes, and proof vs things to know vs cautions.
// Usage: node scripts/palette-check.mjs [docs/phase0/palettes.json]
// Writes docs/phase0/tokens.json, docs/phase0/palette-report.md and docs/phase0/swatches.html
import { readFileSync, writeFileSync } from 'node:fs';

const src = process.argv[2] ?? 'docs/phase0/palettes.json';
const { directions, roles } = JSON.parse(readFileSync(src, 'utf8'));
const outDir = 'docs/phase0';

// --- color math ---
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function oklabToLinear([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}
function linearToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}
const oklchToLab = ([L, C, H]) => [L, C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180)];
const inGamut = (rgb) => rgb.every(v => v >= -1e-4 && v <= 1 + 1e-4);
// Keep lightness and hue; lower chroma until the color fits in sRGB
function fit([L, C, H]) {
  let c = C;
  while (c > 0 && !inGamut(oklabToLinear(oklchToLab([L, c, H])))) c -= 0.002;
  return [L, Math.max(0, +c.toFixed(3)), H];
}
const linearOf = (lch) => oklabToLinear(oklchToLab(lch)).map(v => Math.min(1, Math.max(0, v)));
const hexOfLinear = (lin) => '#' + lin.map(v => Math.round(toGamma(v) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const luminance = (lin) => 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const CVD = {
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
};
const simulate = (lin, m) => m.map(row => Math.min(1, Math.max(0, row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2])));
const deltaE = (a, b) => Math.hypot(...linearToOklab(a).map((v, i) => v - linearToOklab(b)[i]));

// --- tokens ---
// A family (primary, semantic, cause, premium, donation) is a hue plus a deep tone for text;
// the other tones are derived so every family behaves the same way on screen.
function family({ h, deep: [L, C] }) {
  return {
    deep: fit([L, C, h]),                                   // text, icons, chip labels
    ink: fit([Math.max(0.3, L - 0.1), C * 0.9, h]),          // text on soft fills
    bright: fit([Math.min(0.72, L + 0.13), C * 1.05, h]),    // graphics, accents
    soft: fit([0.9, Math.min(C * 0.4, 0.08), h]),            // badge fills
    border: fit([0.87, Math.min(C * 0.45, 0.08), h]),
    tint: fit([0.955, Math.min(C * 0.25, 0.045), h]),         // card headers, boxes
  };
}
function build(d) {
  const t = {
    base: fit(d.base), surface: fit(d.surface), surface2: fit(d.surface2), border: fit(d.border),
    text: fit(d.text), text2: fit(d.text2), text3: fit(d.text3), text4: fit(d.text4),
    ...(d.highlight ? { highlight: fit(d.highlight) } : {}),
  };
  const families = { primary: family(d.primary), positive: family(d.positive), info: family(d.info), caution: family(d.caution), premium: family(d.premium), donation: family(d.donation) };
  const causes = Object.fromEntries(Object.entries(d.causes).map(([k, v]) => [k, family(v)]));
  return { t, families, causes };
}
const fmt = ([L, C, H]) => `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${H})`;

// --- tests ---
const results = {};
const tokensOut = {};
for (const [id, d] of Object.entries(directions)) {
  const { t, families, causes } = build(d);
  const lin = (lch) => linearOf(lch);
  const white = [1, 1, 1];
  const checks = [];
  const add = (label, fg, bg, need = 4.5) => checks.push({ label, ratio: contrast(lin(fg), lin(bg)), need });
  for (const k of ['text', 'text2', 'text3', 'text4']) for (const bg of ['base', 'surface', 'surface2']) add(`${k} on ${bg}`, t[k], t[bg]);
  add('primary text on base', families.primary.deep, t.base);
  add('primary text on surface', families.primary.deep, t.surface);
  checks.push({ label: 'white on primary (buttons)', ratio: contrast(white, lin(families.primary.deep)), need: 4.5 });
  if (t.highlight) add('text on highlight', t.text, t.highlight);
  for (const [name, f] of [...Object.entries(families), ...Object.entries(causes)]) {
    add(`${name} deep on its tint`, f.deep, f.tint);
    add(`${name} ink on its soft`, f.ink, f.soft);
    add(`text3 on ${name} tint`, t.text3, f.tint);
    add(`${name} deep on surface`, f.deep, t.surface);
  }
  const failing = checks.filter(c => c.ratio < c.need);

  // Color blindness: smallest distance in each group that must stay distinct
  const groups = {
    'causes (chip text)': Object.fromEntries(Object.entries(causes).map(([k, f]) => [k, lin(f.deep)])),
    'causes (card headers)': Object.fromEntries(Object.entries(causes).map(([k, f]) => [k, lin(f.tint)])),
    'proof / things to know / caution': { proof: lin(families.positive.deep), things_to_know: lin(families.info.deep), caution: lin(families.caution.deep) },
    'proof / things to know / caution boxes': { proof: lin(families.positive.tint), things_to_know: lin(families.info.tint), caution: lin(families.caution.tint) },
  };
  const cvd = {};
  for (const [g, colors] of Object.entries(groups)) {
    cvd[g] = {};
    for (const [mode, m] of [['normal', null], ...Object.entries(CVD)]) {
      const sim = Object.fromEntries(Object.entries(colors).map(([k, v]) => [k, m ? simulate(v, m) : v]));
      let min = Infinity, pair = '';
      const keys = Object.keys(sim);
      for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
        const e = deltaE(sim[keys[i]], sim[keys[j]]);
        if (e < min) { min = e; pair = `${keys[i]} vs ${keys[j]}`; }
      }
      cvd[g][mode] = { min, pair };
    }
  }
  results[id] = { name: d.name, rationale: d.rationale, checks, failing, cvd };

  const hex = (lch) => ({ oklch: fmt(lch), hex: hexOfLinear(lin(lch)) });
  tokensOut[id] = {
    name: d.name,
    ...Object.fromEntries(Object.entries(t).map(([k, v]) => [k, hex(v)])),
    ...Object.fromEntries(Object.entries(families).map(([k, f]) => [k, Object.fromEntries(Object.entries(f).map(([tone, v]) => [tone, hex(v)]))])),
    causes: Object.fromEntries(Object.entries(causes).map(([k, f]) => [k, Object.fromEntries(Object.entries(f).map(([tone, v]) => [tone, hex(v)]))])),
  };
}
writeFileSync(`${outDir}/tokens.json`, JSON.stringify(tokensOut, null, 2) + '\n');

// --- report ---
const grade = (e) => (e >= 0.1 ? 'clear' : e >= 0.05 ? 'fair' : 'poor');
const md = [`# Palette test results\n\nGenerated by \`node scripts/palette-check.mjs\` from \`${src}\`. Contrast is WCAG 2 (AA text needs 4.5:1). Color-blindness distances are the smallest OKLab ΔE between any two colors in a group after simulation (Machado 2009, full severity): clear ≥ 0.10, fair 0.05 to 0.10, poor < 0.05. Chips and boxes also carry an icon and a label, so color is never the only cue.\n`];
for (const [id, r] of Object.entries(results)) {
  const min = Math.min(...r.checks.map(c => c.ratio));
  md.push(`## ${r.name}\n\n${r.rationale}\n\n**Contrast:** ${r.checks.length - r.failing.length} of ${r.checks.length} pairings pass AA; lowest ${min.toFixed(2)}:1.${r.failing.length ? ` Failing: ${r.failing.map(f => `${f.label} (${f.ratio.toFixed(2)})`).join('; ')}.` : ''}\n`);
  md.push('| Group | Normal | Protanopia | Deuteranopia | Tritanopia |\n|---|---|---|---|---|');
  for (const [g, modes] of Object.entries(r.cvd)) {
    md.push(`| ${g} | ${['normal', 'protanopia', 'deuteranopia', 'tritanopia'].map(m => `${modes[m].min.toFixed(3)} ${grade(modes[m].min)} (${modes[m].pair})`).join(' | ')} |`);
  }
  md.push('');
}
writeFileSync(`${outDir}/palette-report.md`, md.join('\n'));

// --- swatches page (for a screenshot) ---
const sw = (label, hex, fg = '#000') => `<div class="sw" style="background:${hex};color:${fg}"><b>${label}</b><span>${hex}</span></div>`;
const sections = Object.entries(tokensOut).map(([id, tk]) => `
<section><h2>${tk.name}</h2><div class="row">
${sw('base', tk.base.hex, tk.text.hex)}${sw('surface', tk.surface.hex, tk.text.hex)}${sw('surface2', tk.surface2.hex, tk.text.hex)}${sw('text', tk.text.hex, '#fff')}${sw('primary', tk.primary.deep.hex, '#fff')}${tk.highlight ? sw('highlight', tk.highlight.hex, tk.text.hex) : ''}
${sw('proof', tk.positive.tint.hex, tk.positive.deep.hex)}${sw('things to know', tk.info.tint.hex, tk.info.deep.hex)}${sw('big swings', tk.caution.tint.hex, tk.caution.deep.hex)}${sw('premium', tk.premium.deep.hex, '#fff')}${sw('support', tk.donation.deep.hex, '#fff')}
</div><div class="row">${Object.entries(tk.causes).map(([k, c]) => sw(k.replace('_', ' '), c.tint.hex, c.deep.hex)).join('')}</div></section>`).join('');
writeFileSync(`${outDir}/swatches.html`, `<!doctype html><meta charset="utf-8"><style>body{font:13px -apple-system,sans-serif;margin:16px;background:#fff}h2{font-size:16px;margin:18px 0 6px}.row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}.sw{width:118px;height:64px;border-radius:10px;padding:8px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;border:1px solid #0001}.sw span{font:11px ui-monospace,monospace;opacity:.85}</style>${roles ? '' : ''}${sections}`);

for (const [id, r] of Object.entries(results)) {
  const cvdWorst = Math.min(...Object.values(r.cvd).flatMap(m => Object.values(m).map(x => x.min)));
  console.log(`${id.padEnd(9)} contrast ${r.checks.length - r.failing.length}/${r.checks.length} pass (lowest ${Math.min(...r.checks.map(c => c.ratio)).toFixed(2)}) · color-blind worst ΔE ${cvdWorst.toFixed(3)}`);
  for (const f of r.failing) console.log(`    fail: ${f.label} ${f.ratio.toFixed(2)}`);
}
