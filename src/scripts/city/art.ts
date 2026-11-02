// All Dvij City pixel art, drawn in code from small palettes.
// No sprites to download, and day/night is just a palette swap.

import {
  WORLD_W, WORLD_H, GROUND, TRUNK_Y, DEEP_Y, JUNCTION_X, DISTRICTS, LENS_COLOR,
  STRUCTURES, PIPE_PATHS, type Structure, type PipePath,
} from './world';

type Ctx = CanvasRenderingContext2D;

// ---------- 3x5 pixel font ----------

const GLYPHS: Record<string, string> = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110',
  E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101',
  I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100',
  Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111',
  '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110',
  '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010',
  '8': '111101111101111', '9': '111101111001110',
  ' ': '000000000000000', '.': '000000000000010', ':': '000010000010000', '-': '000000111000000',
  '>': '100010001010100', '%': '101001010100101', '$': '011110010011110', '!': '010010010000010',
  '/': '001001010100100', '&': '010101010101011', "'": '010010000000000', '+': '000010111010000',
};

export const textWidth = (s: string) => s.length * 4 - 1;

export function text(ctx: Ctx, s: string, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  let cx = Math.round(x);
  for (const ch of s.toUpperCase()) {
    const g = GLYPHS[ch] ?? GLYPHS[' '];
    for (let i = 0; i < 15; i++) if (g[i] === '1') ctx.fillRect(cx + (i % 3), Math.round(y) + Math.floor(i / 3), 1, 1);
    cx += 4;
  }
}

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
    warp: ['#0b4a46', '#1aa39a', '#7fe3d8'],
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
    warp: ['#063431', '#13807a', '#5cc7bd'],
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
  centeredText(ctx, label, cx, y + 2, fg);
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
      windows(ctx, p, r, x + 6, top + 18, w - 30, 14, 6, 6, 4, 4);
      rect(ctx, x + w - 20, top + 16, 14, 14, shade('#3b82f6', p));
      text(ctx, 'I', x + w - 14, top + 21, '#ffffff');
      door(ctx, x + 16);
      sign(ctx, label, cx, top - 6, '#e8c547', '#2a2233', p);
      break;
    }
    case 'monument': {
      box(ctx, x, GROUND - 18, w, 18, shade('#a49c90', p), p);
      box(ctx, x + 6, GROUND - 24, w - 12, 7, shade('#bdb5a8', p), p);
      centeredText(ctx, label, cx, GROUND - 12, shade('#3a3530', p));
      const cups: [number, number, string][] = [[cx - 34, 30, '#c9ccd6'], [cx, 42, '#f2c84b'], [cx + 34, 34, '#f2c84b']];
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
      text(ctx, '2', cx - 35, GROUND - 24 - 30 + 18, shade('#3a3530', p));
      text(ctx, '1', cx - 1, GROUND - 24 - 42 + 18, shade('#3a3530', p));
      text(ctx, '1', cx + 33, GROUND - 24 - 34 + 18, shade('#3a3530', p));
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
      sign(ctx, label, cx, top + 14, '#9b6bf2', '#ffffff', p);
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
      sign(ctx, label, cx, top + 26, '#9b6bf2', '#ffffff', p);
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
      sign(ctx, label, cx, top + 20, '#3b82f6', '#ffffff', p);
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
      sign(ctx, label, cx, top + 20, '#3b82f6', '#ffffff', p);
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
      box(ctx, x + 6, GROUND - 46, w - 40, 46, shade('#9aa3ad', p), p);
      windows(ctx, p, r, x + 12, GROUND - 40, w - 52, 24, 5, 5, 4, 4);
      const pole = shade('#e8a33a', p);
      for (let i = 0; i <= 4; i++) rect(ctx, x + 4 + i * ((w - 40) / 4), GROUND - 78, 2, 78, pole);
      for (let yy = GROUND - 78; yy < GROUND; yy += 16) rect(ctx, x + 4, yy, w - 38, 2, pole);
      rect(ctx, x + w - 22, top, 4, h, shade('#e8c547', p));
      for (let yy = top + 4; yy < GROUND; yy += 6) rect(ctx, x + w - 22, yy, 4, 1, p.outline);
      rect(ctx, x + 18, top, w - 30, 3, shade('#e8c547', p));
      rect(ctx, x + 24, top + 3, 1, 22, p.lamp);
      rect(ctx, x + 21, top + 25, 7, 5, shade('#9aa3ad', p));
      for (let i = 0; i < 3; i++) {
        rect(ctx, x + w - 36 + i * 7, GROUND - 6, 5, 6, shade('#f28c28', p));
        rect(ctx, x + w - 35 + i * 7, GROUND - 4, 3, 1, '#ffffff');
      }
      sign(ctx, label, x + 40, GROUND - 60, '#3fb950', '#ffffff', p);
      break;
    }
    case 'warp': {
      const [o, b, hi] = p.warp;
      rect(ctx, x + 2, top + 8, w - 4, h - 8, o);
      rect(ctx, x + 3, top + 8, w - 6, h - 8, b);
      rect(ctx, x + 5, top + 8, 2, h - 8, hi);
      rect(ctx, x, top, w, 9, o);
      rect(ctx, x + 1, top + 1, w - 2, 7, b);
      rect(ctx, x + 3, top + 2, 2, 5, hi);
      rect(ctx, x + 3, top, w - 6, 1, '#0a0a12');
      break;
    }
  }
}

// ---------- underground ----------

function pipe(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, p: Palette, t = 6) {
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
  if (vertical) { rect(ctx, x - 5, y - 1, 10, 3, o); rect(ctx, x - 4, y, 8, 1, b); }
  else { rect(ctx, x - 1, y - 5, 3, 10, o); rect(ctx, x, y - 4, 1, 8, b); }
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
  pipe(ctx, JUNCTION_X + 20, DEEP_Y, WORLD_W - 460, DEEP_Y, p, 5);
  for (let xx = 40; xx < WORLD_W - 20; xx += 48) flange(ctx, xx, TRUNK_Y, false, p);

  // Risers from buildings
  for (const s of STRUCTURES) {
    if (!s.riser || s.id === 'super') continue;
    const deep = s.id === 'lake';
    pipe(ctx, s.riser, GROUND + 4, s.riser, deep ? DEEP_Y : TRUNK_Y, p);
    flange(ctx, s.riser, GROUND + 14, true, p);
  }
  pipe(ctx, JUNCTION_X + 20, GROUND + 22, JUNCTION_X + 20, DEEP_Y, p, 5);

  // Warehouse junction tank
  const tx = JUNCTION_X - 26, ty = GROUND + 14;
  box(ctx, tx, ty, 72, 30, shade('#5f6b7a', p), p);
  rect(ctx, tx + 1, ty + 1, 70, 2, shade('#8f9bab', p));
  centeredText(ctx, 'WAREHOUSE', tx + 36, ty + 8, '#ffffff');
  centeredText(ctx, '36 TABLES', tx + 36, ty + 17, '#9fc7ff');
  pipe(ctx, JUNCTION_X, GROUND - 2, JUNCTION_X, ty, p);

  // Warp pipes drop into the trunk
  for (const s of STRUCTURES) {
    if (s.kind !== 'warp') continue;
    const [o, b] = p.warp;
    rect(ctx, s.x + 5, GROUND, s.w - 10, TRUNK_Y - GROUND - 3, o);
    rect(ctx, s.x + 6, GROUND, s.w - 12, TRUNK_Y - GROUND - 3, b);
  }

  // Layer labels
  text(ctx, 'DATA LAYER', 26, GROUND + 44, '#f0a868');
  text(ctx, '22 PIPELINES KEPT RUNNING', 1820, DEEP_Y + 7, '#f0a868');
}

function drawStreet(ctx: Ctx, p: Palette) {
  rect(ctx, 0, GROUND, WORLD_W, 4, p.sidewalk);
  rect(ctx, 0, GROUND + 3, WORLD_W, 1, p.curb);
  for (let xx = 0; xx < WORLD_W; xx += 12) rect(ctx, xx, GROUND + 1, 1, 2, p.curb);

  // District name plates sit in the curb so buildings never cover them.
  for (const d of DISTRICTS) {
    const label = d.name.toUpperCase().replace("'", '');
    box(ctx, d.x0 + 4, GROUND + 6, textWidth(label) + 6, 9, shade(LENS_COLOR[d.lens], p), p);
    text(ctx, label, d.x0 + 7, GROUND + 8, '#ffffff');
  }

  const lampXs = [120, 262, 538, 645, 820, 1072, 1210, 1306, 1420, 1610, 1792, 1905, 2016, 2120, 2222];
  for (const lx of lampXs) lamp(ctx, lx, p);
  for (const tx of [104, 258, 412, 966, 1500, 1520, 2010]) tree(ctx, tx, p, 1);
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
    rect(ctx, d.x0 + 3, GROUND - 26, 1, 26, p.lamp);
    rect(ctx, d.x0 + 4, GROUND - 26, 8, 5, shade(LENS_COLOR[d.lens], p));
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
