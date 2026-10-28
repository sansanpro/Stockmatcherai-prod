#!/usr/bin/env node
// Lays screenshots out in a labeled grid, for side-by-side design reviews.
// Usage: node scripts/contact-sheet.mjs out.png <columns> <cell-width> label=path.png [label=path.png ...]
import { webkit } from '@playwright/test';
import { readFileSync } from 'node:fs';
const [out, cols, w, ...items] = process.argv.slice(2);
const cells = items.map(it => { const [label, path] = it.split('='); return `<figure><figcaption>${label}</figcaption><img src="data:image/png;base64,${readFileSync(path).toString('base64')}"></figure>`; }).join('');
const html = `<style>body{margin:8px;font:600 14px -apple-system;background:#fff}main{display:grid;grid-template-columns:repeat(${cols},${w}px);gap:10px}figure{margin:0}img{width:${w}px;border:1px solid #ddd}</style><main>${cells}</main>`;
const b = await webkit.launch(); const p = await b.newPage({ viewport: { width: cols * (+w + 10) + 16, height: 400 } });
await p.setContent(html); await p.screenshot({ path: out, fullPage: true }); await b.close();
