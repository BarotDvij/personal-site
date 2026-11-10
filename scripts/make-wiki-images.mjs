// Regenerates the two pictures on the Wiki page from the live city:
//   public/city-banner.webp         whole street, day, shown in the notice at the top
//   public/city-locator-night.webp  downtown stretch at night, shown in the infobox
//
//   npm run build && npx astro preview   (in one terminal)
//   node scripts/make-wiki-images.mjs [url]
//
// The city canvas is captured at 1x (viewport as wide as the world, so the
// whole street fits), scaled 2x with no smoothing, and saved as lossless WebP.
// If the banner's size changes, update the width/height in Wiki.astro and the
// .notice-thumb img heights in global.css (0.75 of the image height on desktop,
// 0.5 on phones).

import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const load = (name) => {
  try {
    return require(name);
  } catch {
    return require(`/opt/node-tools/node_modules/${name}`);
  }
};
const { chromium } = load('playwright');
const sharp = load('sharp');

const url = process.argv[2] || 'http://localhost:4321/';
const pub = (f) => fileURLToPath(new URL(`../public/${f}`, import.meta.url));

// Keep in sync with src/scripts/city/world.ts
const WORLD_W = 2924;
const WORLD_H = 266;

// Locator crop, in world pixels: 720 x 256 around the Downtown district.
const LOCATOR = { x: 816, y: WORLD_H - 256, w: 720, h: 256 };

const browser = await chromium.launch();

async function capture(theme) {
  const ctx = await browser.newContext({
    viewport: { width: WORLD_W, height: WORLD_H },
    deviceScaleFactor: 1,
    colorScheme: theme,
  });
  await ctx.addInitScript((t) => {
    localStorage.setItem('dvij.prefs', JSON.stringify({ mode: 'city', theme: t, motion: 'full', sound: 'off' }));
  }, theme);
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('.city-canvas');
  await page.waitForTimeout(5000); // let the fly-over intro settle
  const size = await page.evaluate(() => {
    const c = document.querySelector('.city-canvas');
    return [c.width, c.height];
  });
  if (size[0] !== WORLD_W || size[1] !== WORLD_H) {
    throw new Error(`canvas is ${size.join('x')}, expected ${WORLD_W}x${WORLD_H}. Update WORLD_W/WORLD_H.`);
  }
  const dataUrl = await page.evaluate(() => document.querySelector('.city-canvas').toDataURL('image/png'));
  await ctx.close();
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

const twice = (img, w, h) => img.resize(w * 2, h * 2, { kernel: 'nearest' }).webp({ lossless: true, effort: 6 }).toBuffer();

const day = await capture('light');
writeFileSync(pub('city-banner.webp'), await twice(sharp(day), WORLD_W, WORLD_H));
console.log(`banner  ${WORLD_W * 2} x ${WORLD_H * 2}`);

const night = await capture('dark');
const { x, y, w, h } = LOCATOR;
const crop = await sharp(night).extract({ left: x, top: y, width: w, height: h }).toBuffer();
writeFileSync(pub('city-locator-night.webp'), await twice(sharp(crop), w, h));
console.log(`locator ${w * 2} x ${h * 2}`);

await browser.close();
