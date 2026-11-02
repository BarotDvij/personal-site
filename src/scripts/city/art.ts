// All Dvij City pixel art, drawn in code from small palettes.
// No sprites to download, and day/night is just a palette swap.

import {
  WORLD_W, WORLD_H, GROUND, TRUNK_Y, DEEP_Y, JUNCTION_X, TANK_BOTTOM, DISTRICTS, LENS_COLOR,
  STRUCTURES, PIPE_PATHS, type Structure, type PipePath,
} from './world';

type Ctx = CanvasRenderingContext2D;

import { text, textWidth } from '../pixelfont';

export { text, textWidth };

const centeredText = (ctx: Ctx, s: string, cx: number, y: number, color: string) =>
  text(ctx, s, Math.round(cx - textWidth(s) / 2), y, color);

// ---------- palettes ----------

export interface Palette {
  night: boolean;
  sky: string[]; // top to horizon
  cloud: [string, string];
  sun: string;
  star: string;
  sidewalk: string;
  curb: string;
  earth: string[]; // topsoil to bedrock
  rock: [string, string];
  pipe: [string, string, string]; // outline, body, highlight
  warp: [string, string, string];
  glass: [string, string];
  lit: string;
  unlit: string;
  outline: string;
  lamp: string;
}

export const PALETTES: Record<'day' | 'night', Palette> = {
  day: {
    night: false,
    sky: ['#4f8fe0', '#6aa6ec', '#86bbf2', '#a5cff6', '#c6e2f8'],
    cloud: ['#ffffff', '#d7e6f5'],
    sun: '#ffe27a',
    star: '#ffffff',
    sidewalk: '#c9c3b6',
    curb: '#8f897d',
    earth: ['#7b4a2a', '#663c22', '#52301c', '#402516', '#301b10'],
    rock: ['#8d7966', '#a69380'],
    pipe: ['#4a2511', '#c8743a', '#f0a868'],
    warp: ['#0c1a08', '#008c00', '#a4cb0e'],
    glass: ['#8fc6ef', '#d6eeff'],
    lit: '#ffd76a',
    unlit: '#56708f',
    outline: '#2a2233',
    lamp: '#4a4a55',
  },
  night: {
    night: true,
    sky: ['#0b1030', '#121a45', '#1a2558', '#24306a', '#33407a'],
    cloud: ['#3b4675', '#2c3660'],
    sun: '#f4f1d0',
    star: '#e9ecff',
    sidewalk: '#5d5a54',
    curb: '#3a3833',
    earth: ['#4d2f1c', '#402716', '#331f12', '#28180e', '#1d110a'],
    rock: ['#5a4c40', '#6c5d50'],
    pipe: ['#2c160a', '#a85f2c', '#d88d50'],
    warp: ['#04100a', '#005a1c', '#6b8f1a'],
    glass: ['#2a3a5c', '#3d5280'],
    lit: '#ffd76a',
    unlit: '#232d48',
    outline: '#0c0a14',
    lamp: '#2d2d36',
  },
};

// Darken a building color toward night blue.
function shade(hex: string, p: Palette) {
  if (!p.night) return hex;
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number, t: number) => Math.round(c * 0.55 + t * 0.45);
  const r = mix(n >> 16, 0x0b), g = mix((n >> 8) & 255, 0x15), b = mix(n & 255, 0x38);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Deterministic randomness so the city looks the same on every visit.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- contrast ----------

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}

export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const DARK_INK = '#2a2233';
/** Text colour for a background: keeps the requested ink when it reads well, otherwise picks dark or white. */
export function ink(bg: string, preferred = '#ffffff') {
  if (contrast(bg, preferred) >= 4.5) return preferred;
  return contrast(bg, DARK_INK) >= contrast(bg, '#ffffff') ? DARK_INK : '#ffffff';
}

// ---------- primitives ----------

const rect = (ctx: Ctx, x: number, y: number, w: number, h: number, color: string) => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

function box(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string, p: Palette) {
  rect(ctx, x, y, w, h, p.outline);
  rect(ctx, x + 1, y + 1, w - 2, h - 2, fill);
}

function windows(
  ctx: Ctx, p: Palette, r: () => number,
  x: number, y: number, w: number, h: number,
  ww = 4, wh = 5, gx = 3, gy = 4,
) {
  const cols = Math.max(1, Math.floor((w + gx) / (ww + gx)));
  const rows = Math.max(1, Math.floor((h + gy) / (wh + gy)));
  const ox = x + Math.floor((w - (cols * (ww + gx) - gx)) / 2);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const wx = ox + i * (ww + gx), wy = y + j * (wh + gy);
      if (p.night) {
        rect(ctx, wx, wy, ww, wh, r() < 0.55 ? p.lit : p.unlit);
      } else {
        rect(ctx, wx, wy, ww, wh, p.glass[0]);
        rect(ctx, wx, wy, ww - 1, 1, p.glass[1]);
      }
    }
  }
}

function door(ctx: Ctx, cx: number, w = 8, h = 12, color = '#3a2a24') {
  rect(ctx, cx - w / 2, GROUND - h, w, h, color);
  rect(ctx, cx + w / 2 - 3, GROUND - h / 2, 1, 1, '#e8c547');
}

function sign(ctx: Ctx, label: string, cx: number, y: number, bg: string, fg: string, p: Palette) {
  const w = textWidth(label) + 6;
  box(ctx, cx - w / 2, y, w, 9, bg, p);
  centeredText(ctx, label, cx, y + 2, ink(bg, fg));
}

function tree(ctx: Ctx, x: number, p: Palette, size = 1) {
  const leaf = shade('#3f9a48', p), leafHi = shade('#6cc46a', p), trunk = shade('#6b4428', p);
  const s = size;
  rect(ctx, x + 4 * s, GROUND - 8 * s, 2 * s, 8 * s, trunk);
  rect(ctx, x + 1 * s, GROUND - 16 * s, 8 * s, 8 * s, leaf);
  rect(ctx, x, GROUND - 14 * s, 10 * s, 4 * s, leaf);
  rect(ctx, x + 2 * s, GROUND - 18 * s, 6 * s, 2 * s, leaf);
  rect(ctx, x + 2 * s, GROUND - 15 * s, 3 * s, 2 * s, leafHi);
}

function lamp(ctx: Ctx, x: number, p: Palette) {
  rect(ctx, x, GROUND - 22, 1, 22, p.lamp);
  rect(ctx, x - 1, GROUND - 24, 4, 2, p.lamp);
  rect(ctx, x, GROUND - 22, 2, 1, p.night ? '#ffe9a3' : '#d8d2b0');
  if (p.night) {
    ctx.fillStyle = 'rgba(255, 220, 140, 0.16)';
    ctx.fillRect(x - 5, GROUND - 21, 12, 21);
  }
}

// Classic green pipe: dark base with light highlight stripes on the left.
function warpBody(ctx: Ctx, x: number, y: number, w: number, h: number, p: Palette) {
  const [o, shadow, hi] = p.warp;
  rect(ctx, x, y, w, h, o);
  rect(ctx, x + 1, y, w - 2, h, shadow);
  rect(ctx, x + 2, y, 2, h, hi);
  if (w > 12) rect(ctx, x + 5, y, Math.floor((w - 8) / 3), h, hi);
  if (w > 16) rect(ctx, x + 6 + Math.floor((w - 8) / 3), y, 1, h, hi);
}

// ---------- buildings ----------

function drawStructure(ctx: Ctx, s: Structure, p: Palette) {
  const r = rng(s.x * 31 + s.w);
  const x = s.x, w = s.w, h = s.h, top = GROUND - h, cx = x + w / 2;
  const label = s.text?.[0] ?? '';

  switch (s.kind) {
    case 'kiosk': {
      box(ctx, x, top + 10, w, h - 10, shade('#f1e3c6', p), p);
      for (let i = 0; i < w; i += 8) rect(ctx, x + i, top + 6, 4, 6, shade('#e0457b', p));
      for (let i = 4; i < w; i += 8) rect(ctx, x + i, top + 6, 4, 6, shade('#fff4e0', p));
      rect(ctx, x - 2, top + 4, w + 4, 2, p.outline);
      // Trophy case in the window
      rect(ctx, x + 5, top + 16, w - 30, 16, p.night ? '#2a2240' : '#d6eeff');
      rect(ctx, x + 5, top + 28, w - 30, 1, shade('#8a6a3a', p));
      for (let i = 0; i < 5; i++) {
        // The case is lit, so trophies keep full colour at night.
        const tx = x + 8 + i * 7, gold = i % 3 === 1 ? '#c9ccd6' : '#f2c84b';
        rect(ctx, tx, top + 20, 4, 3, gold);
        rect(ctx, tx + 1, top + 23, 2, 3, gold);
        rect(ctx, tx, top + 26, 4, 2, gold);
      }
      // Gold star emblem
      rect(ctx, x + w - 20, top + 16, 14, 14, shade('#2a2233', p));
      rect(ctx, x + w - 14, top + 18, 2, 10, '#f2c84b');
      rect(ctx, x + w - 18, top + 21, 10, 2, '#f2c84b');
      rect(ctx, x + w - 16, top + 19, 6, 6, '#f2c84b');
      door(ctx, x + 16);
      sign(ctx, label, cx, top - 6, '#e8c547', '#2a2233', p);
      break;
    }
    case 'monument': {
      box(ctx, x, GROUND - 18, w, 18, shade('#a49c90', p), p);
      box(ctx, x + 6, GROUND - 24, w - 12, 7, shade('#bdb5a8', p), p);
      centeredText(ctx, label, cx, GROUND - 12, shade('#3a3530', p));
      const cups: [number, number, string][] = [[cx - 34, 42, '#f2c84b'], [cx, 30, '#c9ccd6'], [cx + 34, 42, '#f2c84b']];
      for (const [px, ph, gold] of cups) {
        box(ctx, px - 7, GROUND - 24 - ph + 14, 14, ph - 14, shade('#d9d2c4', p), p);
        const cupY = GROUND - 24 - ph;
        rect(ctx, px - 5, cupY, 10, 7, shade(gold, p));
        rect(ctx, px - 7, cupY + 1, 2, 3, shade(gold, p));
        rect(ctx, px + 5, cupY + 1, 2, 3, shade(gold, p));
        rect(ctx, px - 1, cupY + 7, 2, 4, shade(gold, p));
        rect(ctx, px - 3, cupY + 11, 6, 2, shade(gold, p));
        rect(ctx, px - 4, cupY + 1, 2, 3, '#fff6c8');
      }
      text(ctx, '1', cx - 35, GROUND - 24 - 42 + 18, shade('#3a3530', p));
      text(ctx, '2', cx - 1, GROUND - 24 - 30 + 18, shade('#3a3530', p));
      text(ctx, '1', cx + 33, GROUND - 24 - 42 + 18, shade('#3a3530', p));
      break;
    }
    case 'post': {
      box(ctx, x, top + 8, w, h - 8, shade('#b5533c', p), p);
      for (let yy = top + 12; yy < GROUND - 2; yy += 4) rect(ctx, x + 1, yy, w - 2, 1, shade('#9a4330', p));
      rect(ctx, x - 3, top + 4, w + 6, 5, shade('#5a3a3a', p));
      windows(ctx, p, r, x + 8, top + 16, w - 16, 14, 8, 8, 6, 4);
      door(ctx, cx, 10, 14);
      box(ctx, x + w - 14, GROUND - 14, 9, 14, shade('#2f6fd6', p), p);
      rect(ctx, x + w - 12, GROUND - 11, 5, 1, '#ffffff');
      sign(ctx, label, cx, top - 4, '#2f6fd6', '#ffffff', p);
      break;
    }
    case 'shop': {
      box(ctx, x, top, w, h, shade('#2f3b2b', p), p);
      rect(ctx, x + 1, top + 1, w - 2, 3, shade('#9bd23c', p));
      windows(ctx, p, r, x + 6, top + 18, w - 12, h - 46);
      for (let i = 0; i < w - 4; i += 8) rect(ctx, x + 2 + i, GROUND - 26, 4, 5, shade('#9bd23c', p));
      for (let i = 4; i < w - 4; i += 8) rect(ctx, x + 2 + i, GROUND - 26, 4, 5, shade('#f6ffe0', p));
      rect(ctx, x + 6, GROUND - 20, w - 12, 20, p.night ? '#4d6b2a' : '#bfe6ff');
      door(ctx, cx, 10, 14, shade('#24301f', p));
      sign(ctx, label, cx, top + 6, '#9bd23c', '#1d2a10', p);
      break;
    }
    case 'billboard': {
      rect(ctx, x + 10, GROUND - 26, 3, 26, shade('#5b5560', p));
      rect(ctx, x + w - 13, GROUND - 26, 3, 26, shade('#5b5560', p));
      box(ctx, x, top, w, h - 26, shade('#f5f1e8', p), p);
      const bh = h - 30;
      if (s.text?.length === 2 && s.text[0] === 'A') {
        rect(ctx, x + 2, top + 2, w / 2 - 3, bh, shade('#e0457b', p));
        rect(ctx, x + w / 2 + 1, top + 2, w / 2 - 3, bh, shade('#3b82f6', p));
        centeredText(ctx, 'A', x + w / 4, top + 2 + bh / 2 - 2, '#ffffff');
        centeredText(ctx, 'B', x + (3 * w) / 4, top + 2 + bh / 2 - 2, '#ffffff');
      } else {
        rect(ctx, x + 2, top + 2, w - 4, bh, shade('#1f2b3d', p));
        s.text?.forEach((t, i) => centeredText(ctx, t, cx, top + 8 + i * 10, i === 0 ? '#9bd23c' : '#ffffff'));
      }
      for (let i = 0; i < 3; i++) rect(ctx, x + 12 + i * ((w - 24) / 2), top - 2, 2, 2, p.lamp);
      break;
    }
    case 'hall': {
      const body = shade('#ece4d2', p), dark = shade('#b9ae96', p);
      box(ctx, x, GROUND - 8, w, 8, dark, p);
      box(ctx, x + 6, top + 34, w - 12, h - 42, body, p);
      for (let i = 0; i < 6; i++) {
        const colX = x + 14 + i * ((w - 34) / 5);
        rect(ctx, colX, top + 40, 6, h - 50, shade('#fffaf0', p));
        rect(ctx, colX + 5, top + 40, 1, h - 50, dark);
      }
      for (let i = 0; i < 14; i++) rect(ctx, x + 2 + i * 4, top + 34 - i * 1.5, w - 4 - i * 8, 2, i === 0 ? dark : body);
      rect(ctx, x + 2, top + 32, w - 4, 3, p.outline);
      rect(ctx, cx, top - 4, 1, 16, p.lamp);
      rect(ctx, cx + 1, top - 4, 9, 5, shade('#f2a33a', p));
      door(ctx, cx, 12, 18, shade('#5a4030', p));
      sign(ctx, label, cx, top + 44, '#f2a33a', '#2a2233', p);
      break;
    }
    case 'studio': {
      box(ctx, x, top + 6, w, h - 6, shade('#5c4a8a', p), p);
      windows(ctx, p, r, x + 8, top + 26, w - 16, h - 52);
      box(ctx, x + 10, top - 4, w - 20, 12, shade('#2a2233', p), p);
      text(ctx, '7', x + 15, top, '#f2a33a');
      text(ctx, 'AFTER', x + 22, top, '#ffffff');
      rect(ctx, x + 4, GROUND - 22, w - 8, 2, shade('#3d3060', p));
      door(ctx, cx, 10, 14);
      sign(ctx, label, cx, top + 12, '#f2a33a', '#2a2233', p);
      break;
    }
    case 'park': {
      rect(ctx, x, GROUND - 2, w, 2, shade('#4fa84f', p));
      for (let i = 0; i < w; i += 3) rect(ctx, x + i, GROUND - 3, 1, 1, shade('#7fd17a', p));
      tree(ctx, x + 2, p, 2);
      tree(ctx, x + w - 26, p, 2);
      tree(ctx, x + 32, p, 1);
      tree(ctx, x + 20, p, 1);
      tree(ctx, x + 50, p, 1);
      rect(ctx, cx - 7, GROUND - 6, 14, 2, shade('#8a5a34', p));
      rect(ctx, cx - 6, GROUND - 4, 1, 4, shade('#5b3b22', p));
      rect(ctx, cx + 5, GROUND - 4, 1, 4, shade('#5b3b22', p));
      rect(ctx, x + w - 44, GROUND - 22, 1, 22, p.lamp);
      sign(ctx, label, cx + 6, GROUND - 34, '#3fb950', '#ffffff', p);
      rect(ctx, x + w - 44, GROUND - 25, 7, 5, shade('#f2c84b', p));
      text(ctx, '1', x + w - 42, GROUND - 25, '#2a2233');
      break;
    }
    case 'tower': {
      box(ctx, x + 8, top + 10, w - 16, h - 10, shade('#3c4f73', p), p);
      box(ctx, x + 16, top, w - 32, 12, shade('#4b6190', p), p);
      rect(ctx, cx, top - 16, 1, 16, p.lamp);
      windows(ctx, p, r, x + 13, top + 26, w - 26, h - 50, 3, 4, 2, 3);
      box(ctx, x, GROUND - 16, w, 16, shade('#2c3a56', p), p);
      door(ctx, cx, 12, 12, shade('#1a2236', p));
      sign(ctx, label, cx, top + 14, '#7c4ddb', '#ffffff', p);
      break;
    }
    case 'lab': {
      const body = shade('#e6e2f2', p);
      box(ctx, x, top + 22, w, h - 22, body, p);
      for (let i = 0; i < 12; i++) {
        const half = Math.round(Math.sqrt(144 - (12 - i) ** 2) * 2);
        rect(ctx, cx - half, top + 10 + i, half * 2, 1, shade('#b8b0d6', p));
      }
      rect(ctx, cx - 1, top + 2, 2, 8, p.lamp);
      rect(ctx, cx - 4, top + 2, 8, 2, p.lamp);
      windows(ctx, p, r, x + 6, top + 40, w - 12, h - 56, 6, 5, 4, 4);
      door(ctx, cx, 10, 14, shade('#5c4a8a', p));
      sign(ctx, label, cx, top + 26, '#7c4ddb', '#ffffff', p);
      break;
    }
    case 'marble': {
      const m = shade('#ecebe6', p), vein = shade('#c9c6be', p);
      box(ctx, x + 6, top + 14, w - 12, h - 14, m, p);
      for (let yy = top + 20; yy < GROUND - 10; yy += 7) rect(ctx, x + 9 + ((yy * 7) % (w - 20)), yy, 6, 1, vein);
      for (let i = 0; i < 6; i++) rect(ctx, x + 10 + i, top + 14 - i * 2, w - 20 - i * 2, 2, m);
      rect(ctx, cx - 1, top - 6, 2, 10, p.outline);
      windows(ctx, p, r, x + 10, top + 30, w - 20, h - 60, 3, 4, 3, 5);
      box(ctx, x, GROUND - 14, w, 14, shade('#d8d4ca', p), p);
      for (let i = 0; i < 4; i++) rect(ctx, x + 6 + i * 11, GROUND - 13, 3, 13, m);
      sign(ctx, label, cx, top + 16, '#f2c84b', '#2a2233', p);
      break;
    }
    case 'warehouse': {
      box(ctx, x, top + 14, w, h - 14, shade('#6f7a88', p), p);
      for (let i = 0; i < w; i += 20) {
        for (let k = 0; k < 14; k++) rect(ctx, x + i + k, top + 14 - k, 1, k, shade('#8a95a3', p));
        rect(ctx, x + i + 14, top, 1, 14, p.outline);
      }
      for (let i = 0; i < 4; i++) {
        const dx = x + 10 + i * ((w - 32) / 3);
        box(ctx, dx, GROUND - 24, 20, 24, shade('#4c5563', p), p);
        for (let yy = GROUND - 22; yy < GROUND; yy += 3) rect(ctx, dx + 1, yy, 18, 1, shade('#5d6676', p));
      }
      sign(ctx, label, cx, top + 20, '#2f6fd6', '#ffffff', p);
      break;
    }
    case 'library': {
      const body = shade('#d9c9a8', p);
      for (let i = 0; i < 3; i++) rect(ctx, x + i * 3, GROUND - 3 - i * 3, w - i * 6, 3, shade('#b8a888', p));
      box(ctx, x + 8, top + 18, w - 16, h - 27, body, p);
      for (let i = 0; i < 10; i++) rect(ctx, x + 6 + i * 4, top + 18 - i * 2, w - 12 - i * 8, 2, body);
      rect(ctx, x + 6, top + 17, w - 12, 2, p.outline);
      for (let i = 0; i < 4; i++) rect(ctx, x + 16 + i * ((w - 38) / 3), top + 30, 5, h - 40, shade('#f4ecd8', p));
      door(ctx, cx, 10, 14, shade('#5a4030', p));
      sign(ctx, label, cx, top + 20, '#2f6fd6', '#ffffff', p);
      break;
    }
    case 'watertower': {
      rect(ctx, x + 6, GROUND - 46, 2, 46, p.lamp);
      rect(ctx, x + w - 8, GROUND - 46, 2, 46, p.lamp);
      for (let yy = GROUND - 40; yy < GROUND; yy += 12) rect(ctx, x + 6, yy, w - 12, 1, p.lamp);
      box(ctx, x, top, w, 52, shade('#3b82f6', p), p);
      rect(ctx, x + 2, top + 2, 3, 46, shade('#7fb0ff', p));
      for (let i = 0; i < 6; i++) rect(ctx, x + 2 + i * 2, top - 6 + i, w - 4 - i * 4, 1, shade('#2a63c8', p));
      s.text?.forEach((t, i) => centeredText(ctx, t, cx, top + 16 + i * 8, '#ffffff'));
      break;
    }
    case 'arcade': {
      box(ctx, x, top + 10, w, h - 10, shade('#1f1b2e', p), p);
      const letters = 'BOGGLE';
      const tile = ['#e0457b', '#f2a33a', '#3fb950', '#3b82f6', '#9b6bf2', '#e8c547'];
      for (let i = 0; i < 6; i++) {
        const tx = x + 6 + i * 12;
        box(ctx, tx, top, 10, 11, shade(tile[i], p), p);
        text(ctx, letters[i], tx + 4, top + 3, '#ffffff');
      }
      rect(ctx, x + 6, top + 18, w - 12, 18, p.night ? '#3a2f6a' : '#2e2a44');
      for (let i = 0; i < 3; i++) {
        const mx = x + 10 + i * 24;
        box(ctx, mx, top + 20, 16, 14, shade('#141220', p), p);
        rect(ctx, mx + 3, top + 23, 10, 6, p.night ? '#7fe3d8' : '#4fb3a8');
      }
      door(ctx, cx, 12, 16, shade('#0e0c18', p));
      break;
    }
    case 'grocer': {
      box(ctx, x, top + 12, w, h - 12, shade('#f1ead8', p), p);
      for (let i = 0; i < w; i += 8) rect(ctx, x + i, top + 18, 4, 7, shade('#3fb950', p));
      for (let i = 4; i < w; i += 8) rect(ctx, x + i, top + 18, 4, 7, shade('#ffffff', p));
      rect(ctx, x + 6, GROUND - 22, w - 30, 14, p.night ? '#4a5a3a' : '#cfeedd');
      for (let i = 0; i < 4; i++) {
        const bx = x + 6 + i * 13;
        box(ctx, bx, GROUND - 7, 11, 7, shade('#a06a3a', p), p);
        for (let k = 0; k < 4; k++) rect(ctx, bx + 2 + k * 2, GROUND - 9, 2, 2, shade(['#e0457b', '#f2a33a', '#3fb950', '#e8c547'][(i + k) % 4], p));
      }
      door(ctx, x + w - 12, 10, 14);
      sign(ctx, label, cx, top + 4, '#3fb950', '#ffffff', p);
      break;
    }
    case 'construction': {
      // Brick schoolhouse behind the scaffolding: clock tower, door, three rows of windows.
      const sx = x + 6, sw = w - 40, scx = sx + sw / 2;
      box(ctx, sx, GROUND - 46, sw, 46, shade('#b5533c', p), p);
      for (let yy = GROUND - 43; yy < GROUND - 2; yy += 4) rect(ctx, sx + 1, yy, sw - 2, 1, shade('#9a4330', p));
      rect(ctx, sx - 2, GROUND - 48, sw + 4, 3, shade('#e6dfcf', p));
      box(ctx, scx - 11, GROUND - 74, 22, 28, shade('#c46a50', p), p);
      for (let i = 0; i < 6; i++) rect(ctx, scx - 12 + i * 2, GROUND - 79 - i, 24 - i * 4, 2, shade('#4a3a52', p));
      rect(ctx, scx - 5, GROUND - 71, 10, 10, p.outline);
      rect(ctx, scx - 4, GROUND - 70, 8, 8, '#fff6dc');
      rect(ctx, scx, GROUND - 69, 1, 4, p.outline);
      rect(ctx, scx, GROUND - 66, 3, 1, p.outline);
      windows(ctx, p, r, sx + 6, GROUND - 40, sw - 12, 22, 6, 5, 4, 4);
      door(ctx, scx, 12, 14, shade('#5a4030', p));
      const pole = shade('#e8a33a', p);
      for (let i = 0; i <= 4; i++) rect(ctx, x + 4 + i * ((w - 40) / 4), GROUND - 78, 2, 78, pole);
      for (let yy = GROUND - 78; yy < GROUND; yy += 16) rect(ctx, x + 4, yy, w - 38, 2, pole);
      rect(ctx, x + w - 22, top, 4, h, shade('#e8c547', p));
      for (let yy = top + 4; yy < GROUND; yy += 6) rect(ctx, x + w - 22, yy, 4, 1, p.outline);
      rect(ctx, x + 18, top, w - 30, 3, shade('#e8c547', p));
      for (let i = 0; i < 3; i++) {
        rect(ctx, x + w - 36 + i * 7, GROUND - 6, 5, 6, shade('#f28c28', p));
        rect(ctx, x + w - 35 + i * 7, GROUND - 4, 3, 1, '#ffffff');
      }
      sign(ctx, label, x + 44, GROUND - 56, '#3fb950', '#ffffff', p);
      break;
    }
    case 'furniture': {
      box(ctx, x, top + 10, w, h - 10, shade('#efe3cf', p), p);
      rect(ctx, x - 2, top + 8, w + 4, 3, p.outline);
      for (let i = 0; i < w; i += 8) rect(ctx, x + i, top + 22, 4, 6, shade('#f2a33a', p));
      for (let i = 4; i < w; i += 8) rect(ctx, x + i, top + 22, 4, 6, shade('#fff4e0', p));
      // Display window with a sofa and a floor lamp
      const wx = x + 5, wy = GROUND - 30, ww = w - 22;
      // Shop windows glow warm at night so the furniture reads against them.
      rect(ctx, wx, wy, ww, 26, p.night ? '#e6cf8f' : '#cfe6f5');
      rect(ctx, wx + 4, wy + 14, ww - 10, 6, shade('#7a4a8c', p));
      rect(ctx, wx + 3, wy + 10, 3, 10, shade('#7a4a8c', p));
      rect(ctx, wx + ww - 9, wy + 10, 3, 10, shade('#7a4a8c', p));
      rect(ctx, wx + 6, wy + 12, ww - 16, 3, shade('#9b6bb0', p));
      rect(ctx, wx + ww - 4, wy + 6, 1, 16, p.lamp);
      rect(ctx, wx + ww - 6, wy + 4, 5, 3, p.night ? '#ffd76a' : '#f2c84b');
      door(ctx, x + w - 8, 8, 14);
      sign(ctx, label, cx, top + 12, '#f2a33a', '#2a2233', p);
      break;
    }
    case 'school': {
      const brick = shade('#b5533c', p), trim = shade('#f1e3c6', p);
      box(ctx, x, top + 20, w, h - 20, brick, p);
      for (let yy = top + 24; yy < GROUND - 2; yy += 4) rect(ctx, x + 1, yy, w - 2, 1, shade('#9a4330', p));
      // Roof and bell tower with a clock
      for (let i = 0; i < 8; i++) rect(ctx, x - 2 + i * 2, top + 20 - i * 2, w + 4 - i * 4, 2, shade('#5a3a3a', p));
      box(ctx, cx - 9, top - 4, 18, 24, trim, p);
      for (let i = 0; i < 5; i++) rect(ctx, cx - 9 + i * 2, top - 4 - i * 2, 18 - i * 4, 2, shade('#5a3a3a', p));
      rect(ctx, cx - 5, top + 2, 10, 10, '#ffffff');
      rect(ctx, cx - 5, top + 2, 10, 1, p.outline);
      rect(ctx, cx, top + 4, 1, 4, p.outline);
      rect(ctx, cx, top + 7, 3, 1, p.outline);
      rect(ctx, cx - 3, top + 14, 6, 5, shade('#e8c547', p));
      // Rows of classroom windows with white trim
      for (let row = 0; row < 2; row++)
        for (let i = 0; i < 5; i++) {
          if (row === 1 && i === 2) continue;
          const wx = x + 8 + i * ((w - 24) / 4), wy = top + 30 + row * 18;
          rect(ctx, wx - 1, wy - 1, 10, 10, trim);
          rect(ctx, wx, wy, 8, 8, p.night ? (i % 2 ? p.lit : p.unlit) : p.glass[0]);
          rect(ctx, wx + 4, wy, 1, 8, trim);
        }
      rect(ctx, cx - 9, GROUND - 4, 18, 4, shade('#b9ae96', p));
      door(ctx, cx, 12, 16, shade('#5a4030', p));
      sign(ctx, label, cx, top + 22, '#f2a33a', '#2a2233', p);
      // Flagpole
      rect(ctx, x + w - 6, top + 4, 1, 16, p.lamp);
      rect(ctx, x + w - 5, top + 4, 6, 4, shade('#e0302f', p));
      break;
    }
    case 'showroom': {
      // A lawn out front with ground-mounted solar panels (the robot mower is
      // animated in drawProps), and the showroom itself on the right.
      const lawn = 40, bx = x + lawn, bw = w - lawn, bcx = bx + bw / 2;
      for (let i = 0; i < lawn; i += 4) rect(ctx, x + i, GROUND - 3, 4, 3, shade(i % 8 ? '#4fa84f' : '#5fbe5a', p));
      for (const [px, ph] of [[x + 3, 0], [x + 21, 0]]) {
        rect(ctx, px + 7, GROUND - 12 - ph, 1, 9, p.lamp);
        for (let k = 0; k < 6; k++) rect(ctx, px + k * 2, GROUND - 14 - ph + k, 16 - k * 2, 1, shade(k % 2 ? '#2a4f8f' : '#1f3a6b', p));
        rect(ctx, px, GROUND - 14 - ph, 16, 1, shade('#5d86c9', p));
      }
      box(ctx, bx, top + 12, bw, h - 12, shade('#e8eef2', p), p);
      for (let i = 0; i < 4; i++) {
        const px = bx + 4 + i * ((bw - 8) / 4);
        rect(ctx, px, top + 4, (bw - 8) / 4 - 2, 8, shade('#1f3a6b', p));
        rect(ctx, px + 1, top + 5, (bw - 8) / 4 - 4, 1, shade('#5d86c9', p));
        rect(ctx, px + 2, top + 12, 1, 2, p.lamp);
      }
      const wx = bx + 5, wy = GROUND - 30, ww = bw - 20;
      rect(ctx, wx, wy, ww, 24, p.night ? '#e6cf8f' : '#cfe6f5');
      for (let k = 0; k < 4; k++) rect(ctx, wx + 4 + k * 2, wy + 6 + k, 20 - k * 2, 1, shade(k % 2 ? '#2a4f8f' : '#1f3a6b', p));
      rect(ctx, wx + 13, wy + 10, 1, 8, p.lamp);
      rect(ctx, wx, wy + 18, ww, 6, shade('#4fa84f', p));
      door(ctx, bx + bw - 8, 8, 14);
      sign(ctx, label, bcx, top + 16, '#c8336c', '#ffffff', p);
      break;
    }
    case 'chamber': {
      // Limestone civic front: a business building that looks toward City Hall.
      const stone = shade('#d9d2c2', p), dark = shade('#a89f8c', p);
      box(ctx, x, top + 14, w, h - 14, stone, p);
      for (let i = 0; i < 6; i++) rect(ctx, x - 2 + i, top + 14 - i * 2, w + 4 - i * 2, 2, dark);
      rect(ctx, x - 2, top + 14, w + 4, 2, p.outline);
      for (let row = 0; row < 2; row++)
        for (let i = 0; i < 4; i++) {
          const wx = x + 10 + i * ((w - 28) / 3), wy = top + 30 + row * 20;
          rect(ctx, wx - 1, wy - 1, 10, 13, dark);
          rect(ctx, wx, wy, 8, 11, p.night ? (i % 2 ? p.lit : p.unlit) : p.glass[0]);
          rect(ctx, wx, wy + 5, 8, 1, dark);
        }
      for (let i = 0; i < 2; i++) rect(ctx, cx - 16 + i * 28, GROUND - 26, 4, 26, shade('#efe9dc', p));
      rect(ctx, cx - 18, GROUND - 3, 36, 3, dark);
      door(ctx, cx, 14, 18, shade('#3a4a5a', p));
      rect(ctx, x + w - 7, top - 6, 1, 20, p.lamp);
      rect(ctx, x + w - 6, top - 6, 7, 5, shade('#2f6fd6', p));
      sign(ctx, label, cx, top + 18, '#2f6fd6', '#ffffff', p);
      break;
    }
    case 'arcadehall': {
      box(ctx, x, top + 16, w, h - 16, shade('#2a1f4a', p), p);
      // Marquee
      box(ctx, x + 10, top, w - 20, 18, shade('#1a1626', p), p);
      const neon = ['#e0457b', '#f2a33a', '#e8c547', '#3fb950', '#22b8cf', '#9b6bf2'];
      label.split('').forEach((ch, i) => text(ctx, ch, x + 22 + i * 15, top + 7, neon[i % neon.length]));
      for (let i = 0; i < w - 24; i += 4) rect(ctx, x + 12 + i, top + 2, 2, 1, i % 8 ? '#e8c547' : '#ffffff');
      // Screens
      for (let i = 0; i < 4; i++) {
        const sx = x + 10 + i * ((w - 20) / 4);
        box(ctx, sx, top + 28, 22, 18, shade('#120f1e', p), p);
        rect(ctx, sx + 3, top + 31, 16, 10, ['#22b8cf', '#3fb950', '#e0457b', '#f2a33a'][i]);
        rect(ctx, sx + 6, top + 34, 4, 2, '#ffffff');
      }
      // Joystick sign and doors
      rect(ctx, x + 12, GROUND - 30, 20, 4, shade('#e0457b', p));
      rect(ctx, x + 21, GROUND - 40, 2, 10, shade('#9aa3ad', p));
      rect(ctx, x + 19, GROUND - 44, 6, 5, shade('#e0457b', p));
      box(ctx, x + w / 2 - 14, GROUND - 26, 28, 26, p.night ? '#3a2f6a' : '#5a4a8a', p);
      rect(ctx, x + w / 2, GROUND - 25, 1, 25, p.outline);
      for (let i = 0; i < w; i += 6) rect(ctx, x + i, top + 16, 3, 2, neon[(i / 6) % neon.length]);
      break;
    }
    case 'pond': {
      const water = shade('#3b82f6', p), light = shade('#7fb0ff', p);
      rect(ctx, x + 6, GROUND - 10, w - 12, 10, water);
      rect(ctx, x + 2, GROUND - 7, w - 4, 7, water);
      rect(ctx, x + 10, GROUND - 9, 14, 1, light);
      rect(ctx, x + 40, GROUND - 6, 18, 1, light);
      for (const [dx, dy] of [[16, -14], [44, -12]]) {
        rect(ctx, x + dx, GROUND + dy, 7, 4, shade('#f2c84b', p));
        rect(ctx, x + dx + 5, GROUND + dy - 3, 3, 3, shade('#f2c84b', p));
        rect(ctx, x + dx + 8, GROUND + dy - 2, 2, 1, shade('#f28c28', p));
        rect(ctx, x + dx + 6, GROUND + dy - 2, 1, 1, p.outline);
      }
      for (const rx of [x + 2, x + w - 6]) {
        rect(ctx, rx, GROUND - 14, 1, 14, shade('#3f9a48', p));
        rect(ctx, rx + 2, GROUND - 11, 1, 11, shade('#3f9a48', p));
      }
      sign(ctx, label, cx, GROUND - 30, '#22b8cf', '#ffffff', p);
      break;
    }
    case 'museum': {
      const stone = shade('#e6dfcf', p), dark = shade('#b9ae96', p);
      for (let i = 0; i < 3; i++) rect(ctx, x + i * 3, GROUND - 3 - i * 3, w - i * 6, 3, dark);
      box(ctx, x + 6, top + 26, w - 12, h - 35, stone, p);
      for (let i = 0; i < 12; i++) rect(ctx, x + 4 + i * 3, top + 24 - i * 2, w - 8 - i * 6, 2, i === 0 ? dark : stone);
      rect(ctx, x + 4, top + 24, w - 8, 2, p.outline);
      // Framed paintings between columns
      const frames = ['#008c00', '#e0302f', '#3b82f6'];
      for (let i = 0; i < 3; i++) {
        // Evenly spaced and centred inside the building body (x + 6 .. x + w - 6).
        const fx = x + 6 + 4 + 2 + i * ((w - 12 - 8 - 18) / 2);
        box(ctx, fx - 2, top + 34, 18, 16, shade('#c8a24a', p), p);
        rect(ctx, fx, top + 36, 14, 12, shade(frames[i], p));
        rect(ctx, fx + 2, top + 38, 4, 3, '#ffffff');
      }
      for (let i = 0; i < 4; i++) rect(ctx, x + 9 + i * ((w - 24) / 3), top + 54, 5, h - 63, shade('#fffaf0', p));
      door(ctx, cx, 12, 16, shade('#5a4030', p));
      sign(ctx, label, cx, top + 12, '#22b8cf', '#ffffff', p);
      break;
    }
    case 'warp': {
      warpBody(ctx, x + 2, top + 9, w - 4, h - 9, p);
      rect(ctx, x, top, w, 10, p.warp[0]);
      warpBody(ctx, x, top + 1, w, 8, p);
      break;
    }
  }
}

// ---------- underground ----------

function pipe(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, p: Palette, t = 8) {
  const [o, b, hi] = p.pipe;
  const x = Math.min(x0, x1) - t / 2, y = Math.min(y0, y1) - t / 2;
  const w = Math.abs(x1 - x0) + t, h = Math.abs(y1 - y0) + t;
  rect(ctx, x, y, w, h, o);
  rect(ctx, x + 1, y + 1, w - 2, h - 2, b);
  if (w > h) rect(ctx, x + 1, y + 1, w - 2, 1, hi);
  else rect(ctx, x + 1, y + 1, 1, h - 2, hi);
}

function flange(ctx: Ctx, x: number, y: number, vertical: boolean, p: Palette) {
  const [o, b] = p.pipe;
  if (vertical) { rect(ctx, x - 6, y - 1, 12, 3, o); rect(ctx, x - 5, y, 10, 1, b); }
  else { rect(ctx, x - 1, y - 6, 3, 12, o); rect(ctx, x, y - 5, 1, 10, b); }
}

function drawUnderground(ctx: Ctx, p: Palette) {
  const bands = p.earth;
  const top = GROUND + 4;
  const bandH = Math.ceil((WORLD_H - top) / bands.length);
  bands.forEach((c, i) => rect(ctx, 0, top + i * bandH, WORLD_W, bandH, c));
  // Dithered band edges
  for (let i = 1; i < bands.length; i++) {
    ctx.fillStyle = bands[i];
    for (let xx = 0; xx < WORLD_W; xx += 2) ctx.fillRect(xx + (i % 2), top + i * bandH - 1, 1, 1);
  }
  const r = rng(7);
  for (let i = 0; i < 520; i++) {
    const rx = Math.floor(r() * WORLD_W), ry = Math.floor(top + 6 + r() * (WORLD_H - top - 6));
    rect(ctx, rx, ry, 2, 1, p.rock[i % 2]);
    if (i % 3 === 0) rect(ctx, rx, ry + 1, 1, 1, p.rock[0]);
  }

  // Trunk lines
  pipe(ctx, 20, TRUNK_Y, WORLD_W - 20, TRUNK_Y, p);
  pipe(ctx, JUNCTION_X + 20, DEEP_Y, STRUCTURES.find((x) => x.id === 'lake')!.riser!, DEEP_Y, p, 7);
  for (let xx = 40; xx < WORLD_W - 20; xx += 48) flange(ctx, xx, TRUNK_Y, false, p);

  // Risers from buildings
  for (const s of STRUCTURES) {
    if (!s.riser || s.id === 'super') continue;
    const deep = s.id === 'lake';
    pipe(ctx, s.riser, GROUND + 4, s.riser, deep ? DEEP_Y : TRUNK_Y, p);
    flange(ctx, s.riser, GROUND + 14, true, p);
  }
  pipe(ctx, JUNCTION_X + 20, TANK_BOTTOM, JUNCTION_X + 20, DEEP_Y, p, 7);

  // Warehouse junction tank
  const tx = JUNCTION_X - 26, ty = GROUND + 14;
  box(ctx, tx, ty, 72, 30, shade('#5f6b7a', p), p);
  rect(ctx, tx + 1, ty + 1, 70, 2, shade('#8f9bab', p));
  centeredText(ctx, 'WAREHOUSE', tx + 36, ty + 8, '#ffffff');
  centeredText(ctx, '36 TABLES', tx + 36, ty + 17, '#9fc7ff');
  pipe(ctx, JUNCTION_X, GROUND - 2, JUNCTION_X, ty, p);
  pipe(ctx, JUNCTION_X, TANK_BOTTOM, JUNCTION_X, TRUNK_Y, p);

  // Warp pipes drop into the trunk
  for (const s of STRUCTURES) {
    if (s.kind !== 'warp') continue;
    warpBody(ctx, s.x + 2, GROUND, s.w - 4, TRUNK_Y - GROUND - 4, p);
  }

  // Layer labels
  text(ctx, 'DATA LAYER', 26, GROUND + 44, '#f0a868');
  text(ctx, '22 PIPELINES KEPT RUNNING', JUNCTION_X - 140, TRUNK_Y + 7, '#f0a868');
}

function drawStreet(ctx: Ctx, p: Palette) {
  rect(ctx, 0, GROUND, WORLD_W, 4, p.sidewalk);
  rect(ctx, 0, GROUND + 3, WORLD_W, 1, p.curb);
  for (let xx = 0; xx < WORLD_W; xx += 12) rect(ctx, xx, GROUND + 1, 1, 2, p.curb);

  // District name plates sit in the curb so buildings never cover them.
  for (const d of DISTRICTS) {
    const label = d.name.toUpperCase().replace("'", '');
    const plate = shade(LENS_COLOR[d.lens], p);
    box(ctx, d.x0 + 4, GROUND + 6, textWidth(label) + 6, 9, plate, p);
    text(ctx, label, d.x0 + 7, GROUND + 8, ink(plate));
  }

  // Street furniture fills the gaps between buildings: lamps and trees alternate.
  const sorted = [...STRUCTURES].sort((a, b) => a.x - b.x);
  sorted.forEach((s, i) => {
    const next = sorted[i + 1];
    const gapStart = s.x + s.w, gapEnd = next ? next.x : WORLD_W;
    const gap = gapEnd - gapStart;
    if (gap < 14) return;
    const mid = Math.round(gapStart + gap / 2);
    if (i % 2) lamp(ctx, mid, p);
    else tree(ctx, mid - 5, p, 1);
  });
  // The civic green: extra trees behind the duck pond and around the park.
  for (const [tx, size] of [[2290, 1], [2304, 2], [2336, 1], [2352, 2], [2380, 1]] as const) tree(ctx, tx, p, size);
}

export function buildCityLayer(p: Palette) {
  const c = document.createElement('canvas');
  c.width = WORLD_W;
  c.height = WORLD_H;
  const ctx = c.getContext('2d')!;
  drawUnderground(ctx, p);
  drawStreet(ctx, p);
  for (const s of STRUCTURES) drawStructure(ctx, s, p);
  for (const d of DISTRICTS) {
    // Tall flag so it clears the street lamps (which top out at GROUND - 24).
    // At night the pole and cloth stay bright so they read against the sky.
    const pole = p.night ? '#c9cde8' : p.lamp;
    const cloth = p.night ? LENS_COLOR[d.lens] : shade(LENS_COLOR[d.lens], p);
    rect(ctx, d.x0 + 3, GROUND - 46, 1, 46, pole);
    rect(ctx, d.x0 + 3, GROUND - 48, 1, 2, p.night ? '#ffffff' : p.lamp);
    rect(ctx, d.x0 + 4, GROUND - 46, 10, 7, cloth);
    if (p.night) {
      rect(ctx, d.x0 + 4, GROUND - 46, 10, 1, '#ffffff');
      rect(ctx, d.x0 + 4, GROUND - 40, 10, 1, p.outline);
    }
  }
  // Welcome banner
  sign(ctx, 'WELCOME TO DVIJ CITY', 200, 48, '#e8c547', '#2a2233', p);
  return c;
}

// ---------- sky and live layers ----------

export function buildSkyLayer(p: Palette, width: number, height: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, width);
  c.height = Math.max(1, height);
  const ctx = c.getContext('2d')!;
  const bandH = Math.ceil(height / p.sky.length);
  p.sky.forEach((col, i) => rect(ctx, 0, i * bandH, width, bandH, col));
  for (let i = 1; i < p.sky.length; i++) {
    ctx.fillStyle = p.sky[i];
    for (let xx = 0; xx < width; xx += 2) ctx.fillRect(xx + (i % 2), i * bandH - 1, 1, 1);
    ctx.fillStyle = p.sky[i - 1];
    for (let xx = 0; xx < width; xx += 2) ctx.fillRect(xx + ((i + 1) % 2), i * bandH, 1, 1);
  }
  if (p.night) {
    const r = rng(42);
    for (let i = 0; i < width / 6; i++) rect(ctx, Math.floor(r() * width), Math.floor(r() * height * 0.7), 1, 1, p.star);
  }
  // Sun or moon
  const sx = Math.max(24, width - 60), sy = 22;
  rect(ctx, sx, sy, 14, 14, p.sun);
  rect(ctx, sx - 2, sy + 2, 18, 10, p.sun);
  rect(ctx, sx + 2, sy - 2, 10, 18, p.sun);
  if (p.night) rect(ctx, sx + 5, sy + 1, 10, 10, p.sky[0]);
  return c;
}

// ---------- parallax skyline ----------
// Two layers sit behind the street and slide slower than it, so the city has
// depth. A layer's features are laid out at (world x * speed), and the draw
// offset keeps a landmark centred on screen when the camera is over its
// district. That is how the CN Tower stays "behind" the AI Lab.

export const PARALLAX = { far: 0.25, mid: 0.55 } as const;
export type ParallaxKind = keyof typeof PARALLAX;

// World x of each landmark's district centre.
const CN_TOWER_X = 580;
const WILLIS_TOWER_X = 1458;

const parallaxPad = (viewW: number) => Math.ceil(viewW / 2) + 2;

function mixHex(a: string, b: string, t: number) {
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  const m = (s: number, e: number) => Math.round(s + (e - s) * t);
  const v = (m(x >> 16, y >> 16) << 16) | (m((x >> 8) & 255, (y >> 8) & 255) << 8) | m(x & 255, y & 255);
  return `#${v.toString(16).padStart(6, '0')}`;
}

// Toronto's CN Tower: flared base, thin shaft, a two-tier pod, then the antenna.
function cnTower(ctx: Ctx, cx: number, base: number, h: number, col: string, p: Palette) {
  const top = base - h;
  const pod = Math.round(base - h * 0.62);
  rect(ctx, cx - 1, top, 3, h, col);
  rect(ctx, cx, top - 6, 1, 6, col);
  for (let i = 0; i < 14; i++) rect(ctx, cx - 1 - Math.round(i * 0.45), base - 1 - i * 2, 3 + Math.round(i * 0.9), 2, col);
  rect(ctx, cx - 8, pod, 17, 3, col);
  rect(ctx, cx - 6, pod + 3, 13, 2, col);
  rect(ctx, cx - 4, pod - 2, 9, 2, col);
  rect(ctx, cx - 2, pod - 4, 5, 2, col);
  if (p.night) rect(ctx, cx - 6, pod + 1, 13, 1, '#ffd76a');
  // The lookout pod on the shaft below, smaller and higher up.
  rect(ctx, cx - 2, top + 8, 5, 2, col);
}

// Chicago's Willis (Sears) Tower: bundled tubes stepping up, two antennas.
function willisTower(ctx: Ctx, cx: number, base: number, h: number, col: string, p: Palette) {
  const heights = [0.58, 0.8, 1, 1, 0.5];
  const w = 6, x0 = cx - Math.round((heights.length * w) / 2);
  heights.forEach((k, i) => {
    const th = Math.round(h * k);
    rect(ctx, x0 + i * w, base - th, w, th, col);
    if (p.night) for (let y = base - th + 5; y < base - 6; y += 9) rect(ctx, x0 + i * w + 2, y, 1, 1, '#ffd76a');
  });
  for (const i of [2, 3]) rect(ctx, x0 + i * w + 2, base - h - 12, 2, 12, col);
  // Dark tube seams read as the tower's bundled shape.
  const seam = mixHex(col, '#000000', 0.25);
  for (let i = 1; i < heights.length; i++) {
    const th = Math.round(h * Math.min(heights[i], heights[i - 1]));
    rect(ctx, x0 + i * w, base - th, 1, th, seam);
  }
}

export function buildParallaxLayer(p: Palette, kind: ParallaxKind, viewW: number) {
  const f = PARALLAX[kind];
  const pad = parallaxPad(viewW);
  const c = document.createElement('canvas');
  c.width = Math.ceil(WORLD_W * f + 2 * pad);
  c.height = WORLD_H;
  const ctx = c.getContext('2d')!;
  const far = kind === 'far';
  const haze = p.sky[p.sky.length - 1];
  const col = far
    ? mixHex(haze, p.night ? '#04061a' : '#3d5f8f', p.night ? 0.45 : 0.3)
    : mixHex(haze, p.night ? '#02030f' : '#2c4a78', p.night ? 0.72 : 0.52);
  const winLit = p.night ? mixHex('#ffd76a', col, 0.45) : mixHex(col, '#ffffff', 0.3);
  const winDim = mixHex(col, p.night ? '#3b4675' : '#ffffff', p.night ? 0.25 : 0.12);

  // Landmarks only live in the far layer, and keep clear of the generic skyline.
  const landmarks = far
    ? [
        { x: Math.round(CN_TOWER_X * f + pad), clear: 16 },
        { x: Math.round(WILLIS_TOWER_X * f + pad), clear: 20 },
      ]
    : [];

  const r = rng(far ? 7 : 11);
  const minW = far ? 9 : 14, maxW = far ? 22 : 30;
  const minH = far ? 28 : 22, maxH = far ? 92 : 64;
  let x = -4;
  while (x < c.width) {
    const w = minW + Math.floor(r() * (maxW - minW));
    const h = minH + Math.floor(r() * (maxH - minH));
    const gap = far ? Math.floor(r() * 3) : 2 + Math.floor(r() * 6);
    const blocked = landmarks.some((l) => x + w > l.x - l.clear && x < l.x + l.clear);
    if (!blocked) {
      rect(ctx, x, GROUND - h, w, h, col);
      if (r() < 0.35) rect(ctx, x + 2, GROUND - h - 3, w - 4, 3, col); // stepped top
      if (r() < 0.25) rect(ctx, x + Math.floor(w / 2), GROUND - h - 8, 1, 8, col); // antenna
      if (!far) {
        for (let yy = GROUND - h + 4; yy < GROUND - 4; yy += 5) {
          for (let xx = x + 3; xx < x + w - 3; xx += 4) rect(ctx, xx, yy, 2, 2, r() < (p.night ? 0.3 : 0.5) ? winLit : winDim);
        }
      } else if (p.night) {
        for (let k = 0; k < 3; k++) rect(ctx, x + 2 + Math.floor(r() * (w - 4)), GROUND - h + 4 + Math.floor(r() * (h - 8)), 1, 1, winLit);
      }
    }
    x += w + gap;
  }
  if (far) {
    const mark = mixHex(col, p.night ? '#000000' : '#1c3358', 0.4);
    cnTower(ctx, landmarks[0].x, GROUND, 150, mark, p);
    willisTower(ctx, landmarks[1].x, GROUND, 130, mark, p);
  }
  return c;
}

// Left edge of a parallax layer on screen, given the street layer's origin
// (the negated camera x, or a positive offset when the world is centred).
export function parallaxX(kind: ParallaxKind, viewW: number, originX: number) {
  const f = PARALLAX[kind];
  return Math.round((1 - f) * (viewW / 2) + f * originX - parallaxPad(viewW));
}

export interface Cloud { x: number; y: number; w: number; speed: number }

export function makeClouds(n: number): Cloud[] {
  const r = rng(99);
  return Array.from({ length: n }, () => ({
    x: r() * 1200, y: 18 + r() * 70, w: 18 + Math.floor(r() * 26), speed: 0.004 + r() * 0.006,
  }));
}

export function drawClouds(ctx: Ctx, clouds: Cloud[], p: Palette, camX: number, t: number, viewW: number, offsetY: number) {
  const span = viewW + 120;
  for (const c of clouds) {
    const x = Math.round((((c.x - camX * 0.3 + t * c.speed) % span) + span) % span) - 60;
    const y = Math.round(c.y + offsetY);
    rect(ctx, x + 4, y, c.w - 8, 3, p.cloud[0]);
    rect(ctx, x, y + 3, c.w, 5, p.cloud[0]);
    rect(ctx, x + 2, y + 8, c.w - 4, 2, p.cloud[1]);
  }
}

interface PreparedPath { color: string; segs: { x0: number; y0: number; x1: number; y1: number; len: number }[]; total: number }

export function preparePaths(paths: PipePath[] = PIPE_PATHS): PreparedPath[] {
  return paths.map((path) => {
    const segs = [];
    let total = 0;
    for (let i = 1; i < path.points.length; i++) {
      const [x0, y0] = path.points[i - 1], [x1, y1] = path.points[i];
      const len = Math.abs(x1 - x0) + Math.abs(y1 - y0);
      segs.push({ x0, y0, x1, y1, len });
      total += len;
    }
    return { color: path.color, segs, total };
  });
}

export function drawPackets(ctx: Ctx, paths: PreparedPath[], t: number, perPath: number, originX: number, offsetY: number, viewW: number) {
  for (let pi = 0; pi < paths.length; pi++) {
    const path = paths[pi];
    for (let k = 0; k < perPath; k++) {
      let d = (t * 0.03 + (k * path.total) / perPath + pi * 37) % path.total;
      for (const s of path.segs) {
        if (d > s.len) { d -= s.len; continue; }
        const f = s.len ? d / s.len : 0;
        const x = Math.round(s.x0 + (s.x1 - s.x0) * f) + originX;
        const y = Math.round(s.y0 + (s.y1 - s.y0) * f) + offsetY;
        if (x > -4 && x < viewW + 4) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x - 2, y - 2, 4, 4);
          ctx.fillStyle = path.color;
          ctx.fillRect(x - 1, y - 1, 3, 3);
        }
        break;
      }
    }
  }
}

export function drawBeacons(ctx: Ctx, t: number, originX: number, offsetY: number, p: Palette) {
  const on = Math.floor(t / 600) % 2 === 0;
  if (!on) return;
  const tops: [number, number][] = [];
  for (const s of STRUCTURES) {
    if (s.kind === 'tower') tops.push([s.x + s.w / 2, GROUND - s.h - 17]);
    if (s.kind === 'marble') tops.push([s.x + s.w / 2 - 1, GROUND - s.h - 7]);
    if (s.kind === 'lab') tops.push([s.x + s.w / 2 - 1, GROUND - s.h + 1]);
  }
  for (const [x, y] of tops) rect(ctx, x + originX - 1, y + offsetY, 3, 2, p.night ? '#ff5a5a' : '#e33b3b');
}

export function drawHighlight(ctx: Ctx, s: Structure, originX: number, offsetY: number, t: number) {
  const x = s.x + originX - 2, y = GROUND - s.h + offsetY - 2, w = s.w + 4, h = s.h + 4;
  ctx.fillStyle = Math.floor(t / 250) % 2 ? '#ffffff' : '#e8c547';
  for (let i = 0; i < w; i += 4) { ctx.fillRect(x + i, y, 2, 1); ctx.fillRect(x + i, y + h, 2, 1); }
  for (let i = 0; i < h; i += 4) { ctx.fillRect(x, y + i, 1, 2); ctx.fillRect(x + w, y + i, 1, 2); }
}

// ---------- street life (live layer) ----------

const SHIRTS = ['#e0457b', '#3b82f6', '#f2a33a', '#9b6bf2', '#3fb950', '#e8c547'];
const SKIN = ['#f1c7a0', '#c98e64', '#8d5a3b'];

const WALKERS = Array.from({ length: 10 }, (_, i) => ({
  x: (i * 263) % WORLD_W,
  speed: (i % 2 ? 1 : -1) * (0.008 + (i % 3) * 0.003),
  shirt: SHIRTS[i % SHIRTS.length],
  skin: SKIN[i % SKIN.length],
}));

export function drawStreetLife(ctx: Ctx, t: number, originX: number, offsetY: number, viewW: number, p: Palette) {
  const y = GROUND + offsetY;
  WALKERS.forEach((w, i) => {
    const wx = ((((w.x + t * w.speed) % WORLD_W) + WORLD_W) % WORLD_W) + originX;
    if (wx < -4 || wx > viewW + 4) return;
    const x = Math.round(wx);
    const step = Math.floor(t / 200 + i) % 2;
    rect(ctx, x, y - 10, 3, 3, shade(w.skin, p));
    rect(ctx, x, y - 7, 3, 4, shade(w.shirt, p));
    rect(ctx, x + (step ? 0 : 1), y - 3, 1, 3, shade('#2a2233', p));
    rect(ctx, x + (step ? 2 : 1), y - 3, 1, 3, shade('#2a2233', p));
  });

  // Delivery truck carrying data between districts
  const span = WORLD_W + 80;
  const tx = Math.round((t * 0.035) % span) - 40 + originX;
  if (tx > -40 && tx < viewW + 10) {
    rect(ctx, tx, y - 13, 22, 11, p.outline);
    rect(ctx, tx + 1, y - 12, 20, 9, shade('#f5f1e8', p));
    text(ctx, 'DATA', tx + 3, y - 10, shade('#3b82f6', p));
    rect(ctx, tx + 22, y - 9, 7, 7, p.outline);
    rect(ctx, tx + 23, y - 8, 5, 5, shade('#3b82f6', p));
    rect(ctx, tx + 25, y - 8, 3, 2, p.night ? '#ffd76a' : p.glass[1]);
    rect(ctx, tx + 4, y - 3, 4, 3, p.outline);
    rect(ctx, tx + 21, y - 3, 4, 3, p.outline);
    if (p.night) {
      ctx.fillStyle = 'rgba(255, 230, 150, 0.25)';
      ctx.fillRect(tx + 29, y - 8, 10, 4);
    }
  }
}

export function drawProps(ctx: Ctx, t: number, originX: number, offsetY: number, p: Palette) {
  for (const s of STRUCTURES) {
    const top = GROUND - s.h + offsetY;
    if (s.kind === 'construction') {
      const len = 20 + Math.round(Math.sin(t / 700) * 5);
      const hx = s.x + 24 + originX;
      rect(ctx, hx, top + 3, 1, len, p.lamp);
      rect(ctx, hx - 3, top + 3 + len, 7, 5, shade('#9aa3ad', p));
      rect(ctx, hx - 3, top + 3 + len, 7, 1, shade('#c4ccd4', p));
    }
    if (s.kind === 'showroom') {
      // Robot mower driving back and forth across the lawn.
      const span = 24, period = 6000;
      const phase = (t % period) / period;
      const dir = phase < 0.5 ? 1 : -1;
      const off = phase < 0.5 ? phase * 2 * span : (1 - phase) * 2 * span;
      const mx = Math.round(s.x + 2 + off + originX);
      const gy = GROUND + offsetY;
      rect(ctx, mx, gy - 6, 12, 4, shade('#f2a33a', p));
      rect(ctx, mx + 2, gy - 8, 7, 2, shade('#2a2233', p));
      rect(ctx, mx + (dir > 0 ? 9 : 1), gy - 11, 1, 3, p.lamp);
      rect(ctx, mx + (dir > 0 ? 8 : 0), gy - 12, 3, 1, t > 0 && Math.floor(t / 400) % 2 ? '#e33b3b' : '#7a1f1f');
      rect(ctx, mx + 1, gy - 2, 3, 2, p.outline);
      rect(ctx, mx + 8, gy - 2, 3, 2, p.outline);
      // Freshly cut stripe behind the mower
      ctx.fillStyle = p.night ? 'rgba(160, 230, 140, 0.25)' : 'rgba(200, 255, 170, 0.45)';
      ctx.fillRect(dir > 0 ? Math.round(s.x + 2 + originX) : mx + 12, gy - 3, dir > 0 ? Math.max(0, mx - Math.round(s.x + 2 + originX)) : Math.max(0, Math.round(s.x + 2 + span + 12 + originX) - (mx + 12)), 1);
    }
    if (s.id === 'ab' && t > 0 && Math.floor(t / 1600) % 2 === 1) {
      const cx = s.x + (3 * s.w) / 4 + originX;
      rect(ctx, cx - 10, top + 4, 21, 9, p.outline);
      rect(ctx, cx - 9, top + 5, 19, 7, '#e8c547');
      text(ctx, 'WIN', cx - 5, top + 6, '#2a2233');
    }
  }
}
