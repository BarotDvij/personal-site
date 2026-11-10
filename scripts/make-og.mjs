// Regenerates public/og.webp (the link-preview image) from the live city.
//
//   npm run dev            (in one terminal)
//   node scripts/make-og.mjs [url]
//
// It loads the site in city mode, grabs the pixel canvas, scales it 2x with no
// smoothing, and draws the name card on top in the Silkscreen font. The result
// is saved as lossless WebP (pixel art compresses far better than PNG).
// Needs Playwright (preinstalled in the cloud environment, or `npm i -D playwright`).

import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('/opt/node-tools/node_modules/playwright'));
}

let sharp;
try {
  sharp = require('sharp');
} catch {
  sharp = require('/opt/node-tools/node_modules/sharp');
}

const url = process.argv[2] || 'http://localhost:4321/';
const out = fileURLToPath(new URL('../public/og.webp', import.meta.url));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.addInitScript(() => {
  localStorage.setItem('dvij.prefs', JSON.stringify({ mode: 'city', theme: 'light', motion: 'full', sound: 'off' }));
});
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('.city-canvas');
await page.evaluate(() => document.fonts.load('16px Silkscreen'));
await page.waitForTimeout(5000); // let the fly-over intro settle

const dataUrl = await page.evaluate(() => {
  const src = document.querySelector('.city-canvas');
  const W = 1200, H = 630;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, W, H);

  // Name card: dark rim, white border, navy fill. Smaller than before so it
  // clears the "Welcome to Dvij City" banner underneath.
  const lines = [
    { text: 'DVIJ BAROT', size: 32, color: '#e8c547', spacing: 6, gap: 40 },
    { text: 'PRODUCT · DATA · AI', size: 16, color: '#d8d4e8', spacing: 3, gap: 28 },
    { text: 'DVIJBAROT.WIKI', size: 16, color: '#d8d4e8', spacing: 3, gap: 0 },
  ];
  ctx.textBaseline = 'alphabetic';
  let widest = 0;
  for (const l of lines) {
    ctx.font = `${l.size}px Silkscreen`;
    ctx.letterSpacing = `${l.spacing}px`;
    widest = Math.max(widest, ctx.measureText(l.text).width - l.spacing);
  }
  const padX = 30, padTop = 22, padBottom = 24;
  const x = 32, y = 26;
  const w = Math.round(widest) + padX * 2 + 16;
  const textH = lines.reduce((s, l) => s + l.gap, 0);
  const h = padTop + padBottom + 8 + textH + 16;
  ctx.fillStyle = '#2a2233'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
  ctx.fillStyle = '#202136'; ctx.fillRect(x + 8, y + 8, w - 16, h - 16);
  let cy = y + 8 + padTop + 24;
  for (const l of lines) {
    ctx.font = `${l.size}px Silkscreen`;
    ctx.letterSpacing = `${l.spacing}px`;
    ctx.fillStyle = l.color;
    ctx.fillText(l.text, x + 8 + padX, cy);
    cy += l.gap;
  }
  return { png: c.toDataURL('image/png'), card: { x, y, w, h } };
});

const png = Buffer.from(dataUrl.png.split(',')[1], 'base64');
writeFileSync(out, await sharp(png).webp({ lossless: true, effort: 6 }).toBuffer());
console.log(`wrote ${out}  card=${JSON.stringify(dataUrl.card)}`);
await browser.close();
