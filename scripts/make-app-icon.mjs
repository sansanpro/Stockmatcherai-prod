#!/usr/bin/env node
// Draws the app icon (the glassy rising arrow, in the plum and coral palette) and writes every size
// the iOS asset catalog lists, plus the website favicon. Apple rounds the corners itself and App
// Store Connect rejects transparency, so the icon is full-bleed and fully opaque.
// Usage: node scripts/make-app-icon.mjs [--preview out.png]   (--preview only writes one 1024 px file)
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SET = 'ios/App/App/Assets.xcassets/AppIcon.appiconset';

// The arrow: a thick rounded zigzag and a rounded triangular head, as one shape
const shape = `
  <path d="M168 772 L392 512 L566 660 L792 352" fill="none" stroke-width="122" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M905 162 L640 262 L886 472 Z" stroke-width="46" stroke-linejoin="round"/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="plum" x1="0.1" y1="0" x2="0.75" y2="1">
      <stop offset="0" stop-color="#6B2C4C"/><stop offset="0.55" stop-color="#4A1C38"/><stop offset="1" stop-color="#2A1024"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.92" cy="0.06" r="0.85">
      <stop offset="0" stop-color="#FF7F5C" stop-opacity="0.7"/><stop offset="0.5" stop-color="#F0785A" stop-opacity="0.2"/><stop offset="1" stop-color="#F0785A" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.05"/><stop offset="0.3" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="arrow" gradientUnits="userSpaceOnUse" x1="150" y1="800" x2="900" y2="170">
      <stop offset="0" stop-color="#FFE3B8"/><stop offset="0.42" stop-color="#FFB48C"/><stop offset="0.75" stop-color="#FF8259"/><stop offset="1" stop-color="#EE5F39"/>
    </linearGradient>
    <linearGradient id="edge" gradientUnits="userSpaceOnUse" x1="150" y1="800" x2="900" y2="170">
      <stop offset="0" stop-color="#D98A4E"/><stop offset="1" stop-color="#A83A1E"/>
    </linearGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="34"/></filter>
    <!-- Glass: light catching the rounded edge of the arrow -->
    <filter id="glass" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="13" result="height"/>
      <feSpecularLighting in="height" surfaceScale="9" specularConstant="0.85" specularExponent="26" lighting-color="#FFFFFF" result="light">
        <fePointLight x="260" y="-240" z="620"/>
      </feSpecularLighting>
      <feComposite in="light" in2="SourceAlpha" operator="in" result="shine"/>
      <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="shine"/></feMerge>
    </filter>
  </defs>
  <rect width="1024" height="1024" fill="url(#plum)"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>
  <rect width="1024" height="1024" fill="url(#sheen)"/>
  <g filter="url(#soft)" transform="translate(0 56)" fill="#12040E" stroke="#12040E" opacity="0.62">${shape}</g>
  <g transform="translate(0 16)" fill="url(#edge)" stroke="url(#edge)">${shape}</g>
  <g filter="url(#glass)" fill="url(#arrow)" stroke="url(#arrow)">${shape}</g>
</svg>`;

const previewAt = process.argv.indexOf('--preview');
const work = mkdtempSync(path.join(tmpdir(), 'app-icon-'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
await page.setContent(`<!doctype html><body style="margin:0;background:#2A1024">${svg}</body>`);
// JPEG has no alpha channel at all, which is what App Store Connect needs
const jpg = path.join(work, 'icon.jpg');
await page.screenshot({ path: jpg, type: 'jpeg', quality: 100 });
await browser.close();

const sips = (...args) => execFileSync('sips', args, { encoding: 'utf8' });
const master = path.join(work, 'icon.png');
sips('-s', 'format', 'png', jpg, '--out', master);

if (previewAt !== -1) {
  writeFileSync(process.argv[previewAt + 1], readFileSync(master));
} else {
  const { images } = JSON.parse(readFileSync(`${SET}/Contents.json`, 'utf8'));
  for (const image of images.filter(i => i.filename)) {
    const px = Math.round(parseFloat(image.size) * parseInt(image.scale));
    const out = `${SET}/${image.filename}`;
    sips('-z', String(px), String(px), master, '--out', out);
    if (/hasAlpha: yes/.test(sips('-g', 'hasAlpha', out))) throw new Error(`${out} has transparency`);
  }
  console.log(`wrote ${images.length} icon sizes to ${SET}`);

  // favicon.ico: one 64 px PNG inside an ICO wrapper
  const small = path.join(work, 'favicon.png');
  sips('-z', '64', '64', master, '--out', small);
  const png = readFileSync(small);
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4); // type icon, one image
  header[6] = 64; header[7] = 64; header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14); header.writeUInt32LE(22, 18);
  writeFileSync('public/favicon.ico', Buffer.concat([header, png]));
  console.log('wrote public/favicon.ico');
}
rmSync(work, { recursive: true, force: true });
