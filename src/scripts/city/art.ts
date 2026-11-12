// All Dvij City pixel art, drawn in code from small palettes.
// No sprites to download, and day/night is just a palette swap.

import {
  WORLD_W, WORLD_H, GROUND, TRUNK_Y, DEEP_Y, DEEP_X, JUNCTION_X, TANK_BOTTOM, DISTRICTS, LENS_COLOR,
  STRUCTURES, PIPE_PATHS, type Structure,
} from './world';

type Ctx = CanvasRenderingContext2D;

import { text, textWidth } from '../pixelfont';

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

function door(ctx: Ctx, cx: number, w = 8, h = 12, color = '#3a2a24', base = GROUND) {
  rect(ctx, cx - w / 2, base - h, w, h, color);
  rect(ctx, cx + w / 2 - 3, base - h / 2, 1, 1, '#e8c547');
}

function sign(ctx: Ctx, label: string, cx: number, y: number, bg: string, fg: string, p: Palette, force = false) {
  const w = textWidth(label) + 6;
  box(ctx, cx - w / 2, y, w, 9, bg, p);
  centeredText(ctx, label, cx, y + 2, force ? fg : ink(bg, fg));
}

// Vertical sign: letters stacked top to bottom on a narrow plate.
const vsignHeight = (label: string) => label.length * 6 + 3;
function vsign(ctx: Ctx, label: string, cx: number, y: number, bg: string, fg: string, p: Palette) {
  const w = 9, h = vsignHeight(label), x = Math.round(cx - w / 2);
  box(ctx, x, y, w, h, bg, p);
  label.split('').forEach((ch, i) => text(ctx, ch, x + 3, y + 2 + i * 6, fg));
}

// Ribbon banner: a wide centre panel with two folded tails that have V notches.
function ribbon(ctx: Ctx, label: string, cx: number, y: number, bg: string, fg: string, p: Palette) {
  const tw = textWidth(label), w = tw + 24, h = 21, tail = 18, th = 17, nd = 9;
  const x = Math.round(cx - w / 2), ty = y + 7, fill = shade(bg, p), dark = shade(mixHex(bg, '#000000', 0.25), p);
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? x - tail + 3 : x + w - 3;
    for (let c = 0; c < tail; c++) {
      const d = side < 0 ? c : tail - 1 - c;
      for (let r = 0; r < th; r++) {
        const notch = Math.max(0, nd - d) >= Math.abs(r - (th - 1) / 2) * (nd / (th / 2)) + 0.5;
        if (notch) continue;
        const edge = r === 0 || r === th - 1 || c === 0 || c === tail - 1;
        rect(ctx, x0 + c, ty + r, 1, 1, edge ? p.outline : dark);
      }
    }
  }
  box(ctx, x, y, w, h, fill, p);
  rect(ctx, x + 2, y + 2, w - 4, 1, shade(mixHex(bg, '#ffffff', 0.35), p));
  centeredText(ctx, label, cx, y + 8, ink(bg, fg));
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
    // A triangular cone of light, narrow at the bulb and widening to the ground.
    ctx.fillStyle = 'rgba(255, 220, 140, 0.16)';
    for (let k = 0; k < 21; k++) {
      const half = 1 + Math.round((k * 5) / 20);
      ctx.fillRect(x + 1 - half, GROUND - 21 + k, half * 2, 1);
    }
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

// Block Stack colours, shared by the truck bed and its falling piece.
const BLOCK_COLORS = ['#22b8cf', '#e8c547', '#9b6bf2', '#3fb950', '#e33b3b', '#3b82f6', '#f2a33a'];

function stackCell(ctx: Ctx, x: number, y: number, color: string, p: Palette) {
  rect(ctx, x, y, 3, 3, p.outline);
  rect(ctx, x, y, 2, 2, shade(color, p));
}

// A trophy cup, outlined so it reads against glass or sky. Silver stays bright by day.
function trophy(ctx: Ctx, px: number, cupY: number, metal: string, p: Palette) {
  const parts: [number, number, number, number][] = [
    [px - 4, cupY, 9, 6], [px - 6, cupY + 1, 2, 3], [px + 5, cupY + 1, 2, 3],
    [px - 1, cupY + 6, 3, 3], [px - 3, cupY + 9, 7, 2],
  ];
  for (const [rx, ry, rw, rh] of parts) rect(ctx, rx - 1, ry - 1, rw + 2, rh + 2, p.outline);
  const fill = p.night || metal !== '#c9ccd6' ? shade(metal, p) : '#aab0c4';
  for (const [rx, ry, rw, rh] of parts) rect(ctx, rx, ry, rw, rh, fill);
  rect(ctx, px - 3, cupY + 1, 2, 3, '#fff6c8');
}

// Go Lime's LED face: where it sits on the tower, in world pixels. Each LED
// cell is 2x2, so the ads are painted at half resolution.
const LED = 2;
function ledRect(s: Structure) {
  const top = GROUND - s.h;
  return { x: s.x + 8, y: top + 20, w: s.w - 16, h: GROUND - 24 - (top + 20) };
}

// ---------- buildings ----------

// Glass curtain-wall towers shared by KnowIdea and AltaML. A tower is a row of
// bays of different heights (a core with lower shoulders), all on one grid:
// mullions every 4px, floors every 7px, a diagonal sky reflection by day. At night
// whole runs of windows light up together, like offices, with the ground row
// always lit as the lobby. Title signs sit on the glass, near the top of a bay.
interface GlassStyle {
  pane: [string, string]; // day, night
  paneHi: [string, string];
  mullion: string;
  floor: string;
}
interface Bay {
  x: number; // offset from the structure's left edge, a multiple of 4
  w: number;
  rows: number; // floors
  cap?: number; // height of a pitched roof above the bay
  ant?: boolean;
  signs?: { text: string; bg: string; fg: string; litBelow?: boolean; vertical?: boolean; dx?: number }[];
}

const CELL_W = 4, CELL_H = 7;

// Which window cells are lit at night: runs of 2 to 5 along a floor, about a fifth overall.
function litCells(r: () => number, cols: number, rows: number) {
  const lit = new Set<number>();
  for (let row = 0; row < rows; row++) {
    if (row === 0) { for (let c = 0; c < cols; c++) lit.add(c); continue; }
    for (let c = 0; c < cols; c++) {
      if (r() < 0.06) {
        const len = 2 + Math.floor(r() * 4);
        for (let k = 0; k < len && c + k < cols; k++) lit.add(row * cols + c + k);
        c += len;
      }
    }
  }
  return lit;
}

function glassTower(ctx: Ctx, s: Structure, p: Palette, r: () => number, g: GlassStyle, bays: Bay[]) {
  const pane = p.night ? g.pane[1] : shade(g.pane[0], p);
  const paneHi = p.night ? g.paneHi[1] : g.paneHi[0];
  const litColor = mixHex(p.lit, g.pane[1], 0.25);
  const cols = Math.ceil(s.w / CELL_W), maxRows = Math.max(...bays.map((b) => b.rows));
  const lit = p.night ? litCells(r, cols, maxRows) : new Set<number>();
  // Outlines first and fills second, so a neighbouring bay never trims the last pixel
  // off another bay's windows: every window is the same width across the whole tower.
  for (const bay of bays) {
    const bx = s.x + bay.x, top = GROUND - bay.rows * CELL_H, cap = bay.cap ?? 0;
    for (let k = 0; k < cap; k++) {
      const inset = Math.round((k * (bay.w / 2 - 3)) / cap);
      rect(ctx, bx + inset - 1, top - 1 - k, bay.w - 2 * inset + 2, 1, p.outline);
    }
    rect(ctx, bx - 1, top - 1, bay.w + 2, bay.rows * CELL_H + 1, p.outline);
  }
  for (const bay of bays) {
    const bx = s.x + bay.x, top = GROUND - bay.rows * CELL_H, h = bay.rows * CELL_H;
    const cap = bay.cap ?? 0, mid = bx + bay.w / 2;
    for (let k = 0; k < cap; k++) {
      const inset = Math.round((k * (bay.w / 2 - 3)) / cap);
      rect(ctx, bx + inset, top - 1 - k, bay.w - 2 * inset, 1, pane);
    }
    rect(ctx, bx, top, bay.w, h, pane);
    // Windows touching a title sign stay dark, so the sign reads cleanly against the glass.
    bay.signs?.forEach((sg, i) => {
      const sw = (sg.vertical ? 9 : textWidth(sg.text) + 6), sh = sg.vertical ? vsignHeight(sg.text) : 9;
      const sx0 = mid + (sg.dx ?? 0) - sw / 2, sy0 = top + 4 + i * 11;
      for (let row = 0; row < bay.rows; row++)
        for (let c = bay.x / CELL_W; c < (bay.x + bay.w) / CELL_W; c++) {
          const cx0 = s.x + c * CELL_W, cy0 = top + row * CELL_H;
          if (cx0 < sx0 + sw && cx0 + CELL_W > sx0 && cy0 < sy0 + sh && cy0 + CELL_H > sy0) lit.delete((bay.rows - 1 - row) * cols + c);
        }
      // Some of the row right under the sign glow, like offices working late.
      const below = Math.floor((sy0 + sh - 1 - top) / CELL_H) + 1;
      if (sg.litBelow && below < bay.rows)
        for (let c = bay.x / CELL_W; c < (bay.x + bay.w) / CELL_W; c++)
          if ((c * 5 + 3) % 7 < 4) lit.add((bay.rows - 1 - below) * cols + c);
    });
    if (p.night) {
      // A lit window fills its whole cell. The mullions and floor lines are painted
      // after this, so they trim each pane to the exact border of the cell.
      for (let row = 0; row < bay.rows; row++)
        for (let c = bay.x / CELL_W; c < (bay.x + bay.w) / CELL_W; c++)
          if (lit.has((bay.rows - 1 - row) * cols + c)) rect(ctx, s.x + c * CELL_W, top + row * CELL_H, CELL_W, CELL_H, litColor);
    } else {
      for (let k = 0; k < h; k++) {
        const rx = bx + Math.round(k * 0.35) % (bay.w + 18) - 6;
        if (rx >= bx && rx + 5 <= bx + bay.w) rect(ctx, rx, top + k, 5, 1, paneHi);
      }
    }
    for (let xx = bx; xx < bx + bay.w; xx += CELL_W) rect(ctx, xx, top, 1, h, g.mullion);
    for (let row = 1; row < bay.rows; row++) rect(ctx, bx, top + row * CELL_H, bay.w, 1, g.floor);
    if (bay.ant) rect(ctx, mid, top - cap - 12, 1, 12, p.lamp);
    bay.signs?.forEach((sg, i) => {
      if (sg.vertical) vsign(ctx, sg.text, mid + (sg.dx ?? 0), top + 4 + i * 11, sg.bg, sg.fg, p);
      else sign(ctx, sg.text, mid, top + 4 + i * 11, sg.bg, sg.fg, p, true);
    });
  }
}

// Hauser Furniture showroom, the podium between the AltaML towers: a plain grey body with
// no pane lines, because the big furniture display is its window. SHOP_MIX can tint it
// towards the tower glass (0 = original grey). SHOP_MIX: 0 = cream, 1 = tower glass.
const SHOP_MIX = 0;
function furnitureShop(ctx: Ctx, x: number, w: number, h: number, label: string, p: Palette, pane: string) {
  const top = GROUND - h, cx = x + w / 2;
  const base = shade('#efe3cf', p), body = mixHex(mixHex(base, pane, SHOP_MIX), '#000000', 0.33); // 33% darker, day and night
  box(ctx, x, top, w, h, body, p);
  const wx = x + 5, wy = GROUND - 30, ww = w - 22;
  // Shop windows glow warm at night so the furniture reads against them.
  rect(ctx, wx, wy, ww, 26, p.night ? '#e6cf8f' : '#cfe6f5');
  rect(ctx, wx + 4, wy + 14, ww - 10, 6, shade('#7a4a8c', p));
  rect(ctx, wx + 3, wy + 10, 3, 10, shade('#7a4a8c', p));
  rect(ctx, wx + ww - 9, wy + 10, 3, 10, shade('#7a4a8c', p));
  rect(ctx, wx + 6, wy + 12, ww - 16, 3, shade('#9b6bb0', p));
  rect(ctx, wx + ww - 4, wy + 6, 1, 16, p.lamp);
  rect(ctx, wx + ww - 6, wy + 4, 5, 3, '#b5541c'); // deep orange-brown shade, readable against the lit window
  // Door: a darker shade of the body with a light grey knob.
  rect(ctx, x + w - 12, GROUND - 14, 8, 14, mixHex(body, '#000000', 0.35));
  rect(ctx, x + w - 7, GROUND - 7, 1, 1, '#c8ccd2');
  sign(ctx, label, cx, top + 6, '#000000', '#ffffff', p, true);
}

function drawStructure(ctx: Ctx, s: Structure, p: Palette) {
  const r = rng(s.x * 31 + s.w);
  const x = s.x, w = s.w, h = s.h, top = GROUND - h, cx = x + w / 2;
  const label = s.text?.[0] ?? '';

  switch (s.kind) {
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
      box(ctx, x + 6, GROUND - 20, w - 12, 20, p.night ? '#4d6b2a' : '#8fd14f', p);
      door(ctx, cx, 10, 14, shade('#24301f', p));
      sign(ctx, label, cx, top + 6, '#9bd23c', '#1d2a10', p);
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
      rect(ctx, x + w - 44, GROUND - 27, 1, 27, p.lamp);
      sign(ctx, label, cx, GROUND - 43, '#3fb950', '#ffffff', p);
      rect(ctx, x + w - 44, GROUND - 27, 9, 7, shade('#f2c84b', p));
      text(ctx, '1', x + w - 41, GROUND - 26, '#2a2233');
      break;
    }
    case 'glass':
      // A tall core with a lower wing on each side. The name is stacked so it fits the core.
      glassTower(ctx, s, p, r, {
        pane: ['#7fb6e6', '#1c2a4a'], paneHi: ['#b9dcf8', '#2a3c66'], mullion: shade('#4a6f96', p), floor: shade('#5d84ad', p),
      }, [
        { x: 0, w: 12, rows: 16 },
        { x: 12, w: 24, rows: Math.floor(s.h / CELL_H), ant: true, signs: [{ text: 'KNOW', bg: '#7c4ddb', fg: '#ffffff' }, { text: 'IDEA', bg: '#7c4ddb', fg: '#ffffff', litBelow: true }] },
        { x: 36, w: 16, rows: 13 },
      ]);
      break;
    case 'tower': {
      // No crown cap: the body runs straight up to the roofline.
      box(ctx, x + 8, top, w - 16, h, shade('#3c4f73', p), p);
      rect(ctx, cx, top - 16, 1, 16, p.lamp);
      // One sign per text line, in the district's colour (two lines for long names),
      // high up under the roof. Windows start a little below the last sign and run down
      // to one window's width above the stone base.
      const lines = s.text ?? [label];
      const lens = DISTRICTS.find((d) => d.id === s.district)!.lens;
      lines.forEach((line, i) => sign(ctx, line, cx, top + 3 + i * 10, LENS_COLOR[lens], '#ffffff', p));
      const winFirst = top + 12 + (lines.length - 1) * 10 + 5, winLast = GROUND - 16 - 3;
      const winRows = Math.floor((winLast - winFirst + 3) / 7);
      windows(ctx, p, r, x + 13, winLast - (winRows * 7 - 3), w - 26, winRows * 7 - 3, 3, 4, 2, 3);
      box(ctx, x, GROUND - 16, w, 16, shade('#2c3a56', p), p);
      door(ctx, cx, 12, 12, shade('#1a2236', p));
      if (s.id === 'occ') {
        const red = shade('#c62828', p);
        rect(ctx, cx + 1, top - 16, 12, 6, shade('#e8e0d0', p));
        rect(ctx, cx + 1, top - 16, 3, 6, red); // left bar
        rect(ctx, cx + 10, top - 16, 3, 6, red); // right bar, same width
        rect(ctx, cx + 6, top - 14, 2, 2, red); // small centre dot
      }
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
        const dx = x + 6 + i * ((w - 32) / 3);
        box(ctx, dx, GROUND - 24, 20, 24, shade('#4c5563', p), p);
        for (let yy = GROUND - 22; yy < GROUND; yy += 3) rect(ctx, dx + 1, yy, 18, 1, shade('#5d6676', p));
      }
      sign(ctx, label, cx, top + 20, '#fe0199', '#ffffff', p, true);
      break;
    }
    case 'library': {
      const body = shade('#d9c9a8', p);
      for (let i = 0; i < 3; i++) rect(ctx, x + i * 3, GROUND - 3 - i * 3, w - i * 6, 3, shade('#b8a888', p));
      box(ctx, x + 8, top + 18, w - 16, h - 27, body, p);
      for (let i = 0; i < 10; i++) rect(ctx, x + 6 + i * 4, top + 18 - i * 2, w - 12 - i * 8, 2, body);
      rect(ctx, x + 6, top + 17, w - 12, 2, p.outline);
      for (let i = 0; i < 4; i++) rect(ctx, x + 16 + i * ((w - 38) / 3), top + 19, 5, h - 29, shade('#f4ecd8', p));
      door(ctx, cx, 10, 14, shade('#5a4030', p), GROUND - 9); // top of the steps
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
      if (s.label.includes('under construction')) {
        const pole = shade('#e8a33a', p);
        for (let i = 0; i <= 3; i++) rect(ctx, x - 2 + i * ((w + 2) / 3), top - 6, 2, h + 6, pole);
        for (let yy = top - 6; yy < GROUND; yy += 16) rect(ctx, x - 2, yy, w + 4, 2, pole);
        for (let i = 0; i < 2; i++) {
          rect(ctx, x + w + 4 + i * 7, GROUND - 6, 5, 6, shade('#f28c28', p));
          rect(ctx, x + w + 5 + i * 7, GROUND - 4, 3, 1, '#ffffff');
        }
      }
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
          const wx = x + 8 + i * ((w - 24) / 4), wy = top + 36 + row * 16;
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
    case 'lawn': {
      // The lawn out front of the showroom, with ground-mounted solar panels.
      // The robot mower is animated in drawProps and plays Lawn Sweeper.
      for (let i = 0; i < w; i += 4) rect(ctx, x + i, GROUND - 3, 4, 3, shade(i % 8 ? '#4fa84f' : '#5fbe5a', p));
      for (const px of [x + 3, x + 21]) {
        rect(ctx, px + 7, GROUND - 12, 1, 9, p.lamp);
        for (let k = 0; k < 6; k++) rect(ctx, px + k * 2, GROUND - 14 + k, 16 - k * 2, 1, shade(k % 2 ? '#2a4f8f' : '#1f3a6b', p));
        rect(ctx, px, GROUND - 14, 16, 1, shade('#5d86c9', p));
      }
      break;
    }
    case 'showroom': {
      const bx = x, bw = w, bcx = bx + bw / 2;
      box(ctx, bx, top + 12, bw, h - 12, shade('#e8eef2', p), p);
      for (let i = 0; i < 4; i++) {
        const px = bx + 4 + i * ((bw - 8) / 4);
        rect(ctx, px, top + 4, (bw - 8) / 4 - 2, 8, shade('#1f3a6b', p));
        rect(ctx, px + 1, top + 5, (bw - 8) / 4 - 4, 1, shade('#5d86c9', p));
        rect(ctx, px + 2, top + 12, 1, 2, p.lamp);
      }
      const wx = bx + 5, wy = GROUND - 30, ww = bw - 20;
      const steel = shade('#9aa3ad', p), steelDk = shade('#5d6676', p), red = shade('#e92846', p), cyan = p.night ? '#9ff3ff' : '#22b8cf';
      rect(ctx, wx, wy, ww, 24, p.night ? '#e6cf8f' : '#cfe6f5');
      rect(ctx, wx, wy + 2, ww, 1, red); // accent stripe on the back wall
      rect(ctx, wx + 3, wy, ww - 6, 1, steelDk); // ceiling light rail
      for (let i = 0; i < 4; i++) rect(ctx, wx + 6 + i * 12, wy + 1, 6, 1, p.night ? '#ffffff' : '#ffffff');
      rect(ctx, wx, wy + 19, ww, 5, shade('#6b7480', p)); // polished floor
      rect(ctx, wx, wy + 19, ww, 1, shade('#9aa3ad', p));
      // Robot arm on a base: two links and a claw
      rect(ctx, wx + 3, wy + 16, 9, 3, steelDk);
      rect(ctx, wx + 6, wy + 8, 2, 8, steel);
      for (let k = 0; k < 6; k++) rect(ctx, wx + 7 + k, wy + 8 - (k >> 1), 1, 2, steel);
      rect(ctx, wx + 12, wy + 6, 1, 4, steelDk);
      rect(ctx, wx + 14, wy + 6, 1, 4, steelDk);
      rect(ctx, wx + 6, wy + 14, 2, 1, red);
      // Walking robot on a podium, one antenna and a glowing visor
      rect(ctx, wx + 20, wy + 16, 11, 3, shade('#d8dde3', p));
      rect(ctx, wx + 22, wy + 9, 7, 7, steel);
      rect(ctx, wx + 23, wy + 4, 5, 5, steel);
      rect(ctx, wx + 24, wy + 6, 3, 1, cyan);
      rect(ctx, wx + 25, wy + 1, 1, 3, steelDk);
      rect(ctx, wx + 25, wy, 1, 1, red);
      rect(ctx, wx + 20, wy + 10, 2, 5, steelDk);
      rect(ctx, wx + 29, wy + 10, 2, 5, steelDk);
      rect(ctx, wx + 24, wy + 12, 3, 1, red);
      // Solar panel on a stand, plus a charging pad with a small drone
      for (let k = 0; k < 4; k++) rect(ctx, wx + 35 + k * 2, wy + 9 + k, 12 - k * 2, 1, shade(k % 2 ? '#2a4f8f' : '#1f3a6b', p));
      rect(ctx, wx + 40, wy + 13, 1, 6, p.lamp);
      rect(ctx, wx + 37, wy + 3, 8, 1, steelDk);
      rect(ctx, wx + 40, wy + 4, 2, 1, cyan);
      rect(ctx, wx + 38, wy + 5, 6, 1, steel);
      door(ctx, bx + bw - 8, 8, 14, shade('#4a4f57', p));
      sign(ctx, label, bcx, top + 16, '#e92846', '#ffffff', p, true);
      break;
    }
    case 'refinery': {
      // Data refinery: files ride the conveyor in on the right, tables leave by pipe.
      const hallW = w - 40, belt = GROUND - 10, bt = top + 18; // the stacks rise 18px above the hall
      box(ctx, x, bt + 26, hallW, h - 44, shade('#6f6252', p), p);
      for (let yy = bt + 30; yy < GROUND - 2; yy += 5) rect(ctx, x + 1, yy, hallW - 2, 1, shade('#5e5244', p));
      for (let i = 0; i < hallW; i += 20) {
        for (let k = 0; k < 12; k++) rect(ctx, x + i + k, bt + 26 - k, 1, k, shade('#8a7c68', p));
        rect(ctx, x + i + 12, bt + 14, 1, 12, p.outline);
      }
      // Smokestacks of different heights with warning bands
      for (const [sx, sh] of [[x + 6, 44], [x + 22, 32]] as const) {
        box(ctx, sx, bt + 26 - sh, 8, sh, shade('#9aa3ad', p), p);
        for (let yy = bt + 29 - sh; yy < bt + 24; yy += 7) rect(ctx, sx + 1, yy, 6, 2, shade('#c8336c', p));
      }
      windows(ctx, p, r, x + 6, bt + 46, hallW - 12, 14, 6, 5, 5, 4); // two rows
      box(ctx, x + hallW - 16, GROUND - 18, 14, 18, shade('#3a3530', p), p);
      // Conveyor and intake hopper
      rect(ctx, x + hallW - 4, belt, 44, 3, shade('#3a3a44', p));
      for (let i = 0; i < 44; i += 6) rect(ctx, x + hallW - 3 + i, belt + 3, 2, 7, p.lamp);
      for (let k = 0; k < 6; k++) rect(ctx, x + w - 16 + k, belt - 22 + k * 2, 16 - k * 2, 2, shade('#9aa3ad', p));
      rect(ctx, x + w - 12, belt - 10, 8, 10, shade('#9aa3ad', p));
      sign(ctx, label, x + hallW / 2 + 14, bt + 32, '#008878', '#ffffff', p);
      break;
    }
    case 'hq': {
      // AltaML x Communitech: twin glass towers with pitched tops, stepping down to a
      // shared podium that holds the Hauser Furniture showroom. Pane lines are a lighter
      // shade of the glass so they read.
      const paneDay = '#2f5f7a', paneNight = '#16303f', lines = shade(mixHex(paneDay, '#ffffff', 0.32), p);
      const cap = 6, core = Math.floor((s.h - cap) / CELL_H);
      glassTower(ctx, s, p, r, {
        pane: [paneDay, paneNight], paneHi: ['#4a7d98', '#1f4256'], mullion: lines, floor: lines,
      }, [
        { x: 0, w: 32, rows: core, cap, signs: [{ text: 'COMMUNITECH', vertical: true, dx: -8, bg: '#f2a33a', fg: '#2a2233' }] },
        { x: 32, w: 20, rows: 16 },
        { x: s.w - 52, w: 20, rows: 16 },
        { x: s.w - 32, w: 32, rows: core, cap, signs: [{ text: s.text?.[0] ?? label, bg: '#15a6bb', fg: '#ffffff' }] },
      ]);
      furnitureShop(ctx, x + 52, s.w - 104, 48, 'HAUSER', p, p.night ? paneNight : shade(paneDay, p));
      break;
    }
    case 'arcadehall': {
      box(ctx, x, top + 16, w, h - 16, shade('#2a1f4a', p), p);
      // Marquee
      box(ctx, x + 10, top, w - 20, 18, shade('#1a1626', p), p);
      const neon = ['#e0457b', '#f2a33a', '#e8c547', '#3fb950', '#22b8cf', '#9b6bf2'];
      // Letter spacing and screen size follow the building width.
      const sp = Math.min(15, Math.floor((w - 28) / label.length));
      const lx0 = x + 10 + Math.round((w - 20 - ((label.length - 1) * sp + 5)) / 2);
      label.split('').forEach((ch, i) => text(ctx, ch, lx0 + i * sp, top + 7, neon[i % neon.length]));
      // At night these bulbs flash, drawn live in drawProps instead.
      if (!p.night) for (let i = 0; i < w - 24; i += 4) rect(ctx, x + 12 + i, top + 2, 2, 1, i % 8 ? '#e8c547' : '#ffffff');
      // Screens
      for (let i = 0; i < 4; i++) {
        const cell = (w - 20) / 4, sw = Math.min(22, Math.floor(cell) - 2);
        const sx = Math.round(x + 10 + i * cell + (cell - sw) / 2);
        box(ctx, sx, top + 22, sw, 16, shade('#120f1e', p), p);
        rect(ctx, sx + 2, top + 24, sw - 4, 10, ['#22b8cf', '#3fb950', '#e0457b', '#f2a33a'][i]);
        rect(ctx, sx + 3, top + 26, 2, 2, '#ffffff');
      }
      // Joystick sign and doors
      rect(ctx, x + 5, GROUND - 16, 14, 4, shade('#e0457b', p));
      rect(ctx, x + 11, GROUND - 24, 2, 8, shade('#9aa3ad', p));
      rect(ctx, x + 9, GROUND - 28, 6, 5, shade('#e0457b', p));
      box(ctx, x + w / 2 - 10, GROUND - 22, 20, 22, p.night ? '#3a2f6a' : '#5a4a8a', p);
      rect(ctx, x + w / 2, GROUND - 25, 1, 25, p.outline);
      if (!p.night) for (let i = 0; i < w; i += 6) rect(ctx, x + i, top + 16, 3, 2, neon[(i / 6) % neon.length]);
      break;
    }
    case 'pond': {
      const water = shade('#3b82f6', p), light = shade('#7fb0ff', p);
      // Grass at both ends so no bare gap shows between the lawn and the water.
      rect(ctx, x, GROUND - 2, 2, 2, shade('#4fa84f', p));
      rect(ctx, x + w - 2, GROUND - 2, 2, 2, shade('#4fa84f', p));
      rect(ctx, x + 6, GROUND - 4, w - 12, 4, water);
      rect(ctx, x + 2, GROUND - 3, w - 4, 3, water);
      rect(ctx, x + 10, GROUND - 3, 14, 1, light);
      rect(ctx, x + 40, GROUND - 2, 18, 1, light);
      // The ducks swim in drawProps, so they are not baked in here.
      for (const rx of [x + 2, x + w - 6]) {
        rect(ctx, rx, GROUND - 14, 1, 14, shade('#3f9a48', p));
        rect(ctx, rx + 2, GROUND - 11, 1, 11, shade('#3f9a48', p));
      }
      sign(ctx, label, cx, GROUND - h, '#22b8cf', '#ffffff', p);
      break;
    }
    case 'loadtruck': {
      // Dump truck parked under the Data Lake, cab facing out, its open bed
      // half full of Block Stack pieces. A chute drops more in (see drawProps).
      const steel = shade('#9aa3ad', p), dark = shade('#4a5260', p);
      // Chute from the bottom of the lake's tank down over the bed.
      const chuteX = x + 21;
      rect(ctx, x + w + 3, GROUND - 44, 3, 18, dark);
      rect(ctx, chuteX, GROUND - 28, x + w + 6 - chuteX, 3, dark);
      rect(ctx, chuteX, GROUND - 25, 3, 3, dark);
      rect(ctx, chuteX + 1, GROUND - 27, x + w + 4 - chuteX, 1, steel);
      // Chassis and wheels
      rect(ctx, x + 1, GROUND - 6, w - 2, 2, p.outline);
      for (const wx of [x + 3, x + 14, x + 24]) {
        rect(ctx, wx, GROUND - 4, 5, 4, p.outline);
        rect(ctx, wx + 2, GROUND - 3, 1, 1, steel);
      }
      // Cab
      box(ctx, x + 1, GROUND - 15, 9, 9, shade('#3b82f6', p), p);
      rect(ctx, x + 2, GROUND - 13, 4, 3, p.night ? '#ffd76a' : p.glass[1]);
      rect(ctx, x + 1, GROUND - 8, 1, 1, shade('#f2c84b', p));
      // Open bed with stacked pieces: a full bottom row, a row with one gap, and a ragged top.
      rect(ctx, x + 11, GROUND - 19, 21, 13, p.outline);
      rect(ctx, x + 12, GROUND - 19, 19, 12, shade('#2a2f3a', p));
      for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 6; i++) {
          if ((j === 1 && i === 3) || (j === 2 && i > 1 && i < 5)) continue;
          stackCell(ctx, x + 12 + i * 3, GROUND - 10 - j * 3, BLOCK_COLORS[(i * 3 + j * 5) % BLOCK_COLORS.length], p);
        }
      }
      rect(ctx, x + 11, GROUND - 19, 21, 1, steel);
      break;
    }
    case 'chesstable': {
      // Stone table on the park lawn with two players mid-game.
      rect(ctx, x, GROUND - 2, w + 4, 2, shade('#4fa84f', p));
      for (let i = 0; i < w + 4; i += 3) rect(ctx, x + i, GROUND - 3, 1, 1, shade('#7fd17a', p));
      const stone = shade('#b8b0a0', p), stoneDk = shade('#857d70', p);
      rect(ctx, cx - 7, GROUND - 9, 14, 2, stone);
      rect(ctx, cx - 7, GROUND - 7, 14, 1, stoneDk);
      rect(ctx, cx - 1, GROUND - 6, 3, 6, stoneDk);
      // Board edge, squares alternating, and a few pieces
      for (let i = 0; i < 10; i++) rect(ctx, cx - 5 + i, GROUND - 10, 1, 1, i % 2 ? '#f5f1e8' : '#2a2233');
      for (const [px, ph, light] of [[-4, 3, true], [-1, 2, true], [2, 4, false], [4, 2, false]] as const) {
        rect(ctx, cx + px, GROUND - 10 - ph, 1, ph, light ? '#f5f1e8' : '#2a2233');
      }
      // Stools and players
      for (const [sx, shirt, skin, face] of [[x + 2, '#e0457b', '#c98e64', 1], [x + w - 6, '#3b82f6', '#f1c7a0', -1]] as const) {
        rect(ctx, sx, GROUND - 4, 4, 1, stoneDk);
        rect(ctx, sx + 1, GROUND - 3, 2, 3, stoneDk);
        rect(ctx, sx + (face > 0 ? 0 : 1), GROUND - 14, 3, 3, shade(skin, p));
        rect(ctx, sx + (face > 0 ? 0 : 1), GROUND - 11, 3, 6, shade(shirt, p));
        rect(ctx, sx + (face > 0 ? 3 : -1), GROUND - 9, 1, 1, shade(skin, p));
        rect(ctx, sx + (face > 0 ? 2 : -1), GROUND - 5, 3, 1, shade('#2a2233', p));
      }
      break;
    }
    case 'museum': {
      const stone = shade('#e6dfcf', p), dark = shade('#b9ae96', p);
      for (let i = 0; i < 3; i++) rect(ctx, x + i * 3, GROUND - 3 - i * 3, w - i * 6, 3, dark);
      box(ctx, x + 6, top + 26, w - 12, h - 35, stone, p);
      for (let i = 0; i < 12; i++) rect(ctx, x + 4 + i * 3, top + 24 - i * 2, w - 8 - i * 6, 2, i === 0 ? dark : stone);
      rect(ctx, x + 4, top + 24, w - 8, 2, p.outline);
      // Four pillars, with a tall hanging banner centred in each of the three gaps.
      const pillarX = (i: number) => x + 9 + i * ((w - 24) / 3);
      for (let i = 0; i < 4; i++) rect(ctx, pillarX(i), top + 54, 5, h - 63, shade('#fffaf0', p));
      const banners = ['#008c00', '#e0302f', '#3b82f6'];
      for (let i = 0; i < 3; i++) {
        const mid = Math.round((pillarX(i) + 5 + pillarX(i + 1)) / 2);
        const bw2 = 12, bx2 = mid - bw2 / 2, by = top + 32, bh = 40;
        rect(ctx, bx2 - 2, by - 2, bw2 + 4, 2, shade('#7a5a1a', p)); // rod
        rect(ctx, bx2 - 1, by, bw2 + 2, bh + 1, p.outline);
        rect(ctx, bx2, by, bw2, bh - 1, shade(banners[i], p));
        // Swallow-tail: a V cut from the bottom edge, showing the wall behind.
        for (let k = 0; k < 5; k++) {
          const half = k, yy = by + bh - 5 + k;
          rect(ctx, mid - half, yy, half * 2 + 1, 1, stone);
          rect(ctx, mid - half - 1, yy, 1, 1, p.outline);
          rect(ctx, mid + half + 1, yy, 1, 1, p.outline);
        }
        rect(ctx, bx2 + 1, by + 1, 1, bh - 6, shade('#ffffff', p)); // sheen
        rect(ctx, bx2 + 3, by + 4, bw2 - 6, 1, shade('#c8a24a', p)); // gold trim
        rect(ctx, bx2 + 3, by + bh - 9, bw2 - 6, 1, shade('#c8a24a', p));
        rect(ctx, mid - 1, by + 10, 3, 3, shade('#c8a24a', p)); // emblem
        rect(ctx, mid - 2, by + 14, 5, 1, shade('#c8a24a', p));
      }
      sign(ctx, label, cx, top + 12, '#22b8cf', '#ffffff', p);
      break;
    }
    case 'pyramid': {
      // Hall of Fame: a glass pyramid on a stone plinth, the podium trophies inside.
      const plinthTop = GROUND - 19, ph = plinthTop - top, hw = w / 2 - 6;
      const glass = p.night ? '#6a5a3a' : '#cfeaf6';
      const frame = shade('#5d6676', p);
      for (let ry = 0; ry < ph; ry++) {
        const half = Math.round(((ry + 1) / ph) * hw);
        const y = top + ry;
        rect(ctx, cx - half - 1, y, half * 2 + 2, 1, p.outline);
        rect(ctx, cx - half, y, half * 2, 1, glass);
        // Diamond lattice: two families of struts parallel to the faces.
        for (let dx = -half + 1; dx < half; dx++) {
          const a = ry + dx, b = ry - dx;
          if (((a % 9) + 9) % 9 === 0 || ((b % 9) + 9) % 9 === 0) rect(ctx, cx + dx, y, 1, 1, frame);
        }
      }
      // A soft sheen down the left face
      for (let k = 6; k < ph - 4; k++) rect(ctx, cx - Math.round((k / ph) * hw) + 3, top + k, 2, 1, p.night ? '#9a8458' : '#ffffff');
      // Plinth: light slab over a dark base, with the plaque in the middle.
      box(ctx, x + 2, plinthTop, w - 4, 4, shade('#8a8f9c', p), p);
      rect(ctx, x + 3, plinthTop + 1, w - 6, 1, shade('#b4b9c4', p));
      box(ctx, x, plinthTop + 3, w, GROUND - plinthTop - 3, shade('#5f6470', p), p);
      for (let i = 6; i < w - 6; i += 4) rect(ctx, x + i, GROUND - 4, 2, 1, shade('#4a4f5a', p));
      // Glass doors either side of the plaque
      for (const dx of [x + 10, x + w - 26]) {
        box(ctx, dx, GROUND - 11, 16, 11, p.night ? '#e6cf8f' : '#cfe6f5', p);
        rect(ctx, dx + 7, GROUND - 10, 1, 10, frame);
      }
      // Pedestals 1 / 2 / 1 with gold, silver and gold cups, inside the glass.
      const peds: [number, number, string, string][] = [[cx - 22, 16, '#f2c84b', '1'], [cx, 10, '#c9ccd6', '2'], [cx + 22, 16, '#f2c84b', '1']];
      for (const [px, pH, metal, n] of peds) {
        box(ctx, px - 7, plinthTop - pH, 14, pH + 1, shade('#9aa0ad', p), p);
        rect(ctx, px - 6, plinthTop - pH + 1, 12, 1, shade('#c4c9d4', p));
        text(ctx, n, px - 1, plinthTop - pH + 4, shade('#2a2233', p));
        trophy(ctx, px, plinthTop - pH - 13, metal, p);
      }
      // Spotlights at the apex
      rect(ctx, cx - 1, top + 2, 3, 1, '#fff6c8');
      sign(ctx, label, cx, GROUND - 13, '#e8c547', '#2a2233', p, true);
      break;
    }
    case 'parksign': {
      // Wooden entrance sign that names the green space: chess, CityScapes, the pond.
      const wood = shade('#8a5a34', p), woodDk = shade('#5b3b22', p);
      rect(ctx, x + 4, GROUND - 26, 2, 26, woodDk);
      rect(ctx, x + w - 6, GROUND - 26, 2, 26, woodDk);
      rect(ctx, x + 3, GROUND - 27, 4, 1, wood);
      rect(ctx, x + w - 7, GROUND - 27, 4, 1, wood);
      box(ctx, x, GROUND - 24, w, 17, shade('#2e7d32', p), p);
      rect(ctx, x + 1, GROUND - 23, w - 2, 1, shade('#4caf50', p));
      (s.text ?? []).forEach((t, i) => centeredText(ctx, t, cx, GROUND - 21 + i * 7, '#ffffff'));
      // Flower bed at the foot of the sign
      rect(ctx, x + 1, GROUND - 2, w - 2, 2, shade('#4fa84f', p));
      for (let i = 2; i < w - 2; i += 4) rect(ctx, x + i, GROUND - 4, 2, 2, shade(['#e0457b', '#e8c547', '#ffffff'][(i / 4) % 3 | 0], p));
      break;
    }
    case 'restaurant': {
      // Eco Eats: a brick corner restaurant with a striped awning and diners in the window.
      const brick = shade('#a8503a', p), mortar = shade('#8a3f2d', p);
      const bodyTop = top + 14;
      box(ctx, x + 8, top + 2, 6, 13, shade('#7a3a2a', p), p); // chimney
      box(ctx, x, bodyTop, w, h - 14, brick, p);
      for (let yy = bodyTop + 3; yy < GROUND - 1; yy += 3) {
        rect(ctx, x + 1, yy, w - 2, 1, mortar);
        for (let xx = x + ((yy / 3) % 2 ? 3 : 7); xx < x + w - 1; xx += 8) rect(ctx, xx, yy - 2, 1, 2, mortar);
      }
      rect(ctx, x, bodyTop, w, 3, shade('#4a2a22', p)); // cornice
      sign(ctx, label, cx, top + 4, '#3fb950', '#ffffff', p, true);
      // Scalloped awning
      const ay = bodyTop + 8, ax0 = x + 2, aw = w - 4;
      rect(ctx, ax0, ay - 1, aw, 1, p.outline);
      for (let i = 0; i < aw; i++) {
        const green = Math.floor(i / 4) % 2 === 0;
        rect(ctx, ax0 + i, ay, 1, 6, shade(green ? '#2e9d48' : '#ffffff', p));
        if (i % 4 !== 0 && i % 4 !== 3) rect(ctx, ax0 + i, ay + 6, 1, 1, shade(green ? '#2e9d48' : '#ffffff', p));
      }
      // Front window with two tables, diners and pendant lamps
      const wx = x + 5, wy = ay + 11, ww = w - 30, wh = GROUND - 6 - wy;
      box(ctx, wx - 1, wy - 1, ww + 2, wh + 2, shade('#3a2a24', p), p);
      rect(ctx, wx, wy, ww, wh, p.night ? '#e6c98a' : '#d6ecf5');
      for (const tx of [wx + 12, wx + ww - 14]) {
        rect(ctx, tx + 1, wy, 1, 4, shade('#3a2a24', p));
        rect(ctx, tx - 1, wy + 4, 5, 2, shade('#e8c547', p));
        rect(ctx, tx - 4, wy + wh - 6, 11, 2, shade('#6b4428', p));
        rect(ctx, tx + 1, wy + wh - 4, 1, 4, shade('#4a2f1c', p));
        rect(ctx, tx - 7, wy + wh - 11, 3, 3, shade('#c98e64', p));
        rect(ctx, tx - 7, wy + wh - 8, 3, 5, shade('#3b82f6', p));
        rect(ctx, tx + 8, wy + wh - 11, 3, 3, shade('#f1c7a0', p));
        rect(ctx, tx + 8, wy + wh - 8, 3, 5, shade('#e0457b', p));
        rect(ctx, tx - 1, wy + wh - 7, 2, 1, '#ffffff');
        rect(ctx, tx + 2, wy + wh - 7, 2, 1, shade('#3fb950', p));
      }
      rect(ctx, wx + Math.floor(ww / 2), wy, 1, wh, shade('#3a2a24', p)); // mullion
      rect(ctx, wx - 2, GROUND - 6, ww + 4, 2, shade('#d9d2c4', p)); // sill
      // Chalkboard menu and the door
      box(ctx, x + w - 23, GROUND - 22, 7, 10, shade('#24302a', p), p);
      for (let k = 0; k < 3; k++) rect(ctx, x + w - 21, GROUND - 20 + k * 2, 3, 1, '#e8e4d8');
      door(ctx, x + w - 9, 10, 18, shade('#2e7d32', p));
      break;
    }
    case 'patio': {
      // Eco Eats patio: two umbrella tables under a string of lights.
      const wood = shade('#a06a3a', p), woodDk = shade('#6b4428', p);
      rect(ctx, x, GROUND - 26, 1, 26, p.lamp);
      rect(ctx, x + w - 1, GROUND - 26, 1, 26, p.lamp);
      for (let i = 1; i < w - 1; i++) {
        const sag = Math.round(Math.sin((i / (w - 1)) * Math.PI) * 3);
        rect(ctx, x + i, GROUND - 26 + sag, 1, 1, p.lamp);
        if (i % 5 === 2) {
          rect(ctx, x + i, GROUND - 25 + sag, 1, 1, p.night ? '#ffe9a3' : '#e8dcb0');
          if (p.night) {
            ctx.fillStyle = 'rgba(255, 220, 140, 0.25)';
            ctx.fillRect(x + i - 1, GROUND - 26 + sag, 3, 3);
          }
        }
      }
      const shirts = [['#f2a33a', '#8d5a3b'], ['#9b6bf2', '#f1c7a0']];
      [x + 12, x + w - 13].forEach((tc, n) => {
        rect(ctx, tc, GROUND - 19, 1, 19, p.lamp);
        for (let i = 0; i < 19; i++) rect(ctx, tc - 9 + i, GROUND - 20, 1, 2, shade(Math.floor(i / 4) % 2 ? '#ffffff' : '#3fb950', p));
        rect(ctx, tc - 6, GROUND - 21, 13, 1, shade('#3fb950', p));
        rect(ctx, tc - 5, GROUND - 9, 11, 2, wood);
        rect(ctx, tc - 1, GROUND - 7, 3, 7, woodDk);
        rect(ctx, tc - 3, GROUND - 10, 7, 1, '#ffffff');
        rect(ctx, tc - 2, GROUND - 11, 1, 1, shade('#e8c547', p));
        rect(ctx, tc, GROUND - 11, 1, 1, shade('#e0457b', p));
        rect(ctx, tc + 2, GROUND - 11, 1, 1, shade('#22b8cf', p));
        for (const [chx, back] of [[tc - 10, tc - 10], [tc + 6, tc + 10]]) {
          rect(ctx, chx, GROUND - 5, 5, 1, woodDk);
          rect(ctx, back, GROUND - 11, 1, 11, woodDk);
          rect(ctx, chx + (back === chx ? 4 : 0), GROUND - 4, 1, 4, woodDk);
        }
        const [shirt, skin] = shirts[n];
        rect(ctx, tc + 6, GROUND - 15, 3, 3, shade(skin, p));
        rect(ctx, tc + 6, GROUND - 12, 3, 7, shade(shirt, p));
        rect(ctx, tc + 5, GROUND - 10, 1, 1, shade(skin, p));
      });
      // Planters at each end
      for (const px of [x + 1, x + w - 6]) {
        rect(ctx, px, GROUND - 4, 5, 4, shade('#8a5a34', p));
        rect(ctx, px, GROUND - 7, 5, 3, shade('#3f9a48', p));
        rect(ctx, px + 2, GROUND - 8, 1, 1, shade('#e0457b', p));
      }
      break;
    }
    case 'mediahq': {
      // Go Lime HQ: a tower whose whole face is an LED screen, with a small
      // name sign on the roof. drawProps plays the ads on the screen.
      const bodyTop = top + 16, bx = x + 4, bw = w - 8;
      // Name sign on two short posts, lit from below at night.
      const sw = 40, sx = cx - sw / 2;
      for (const px of [sx + 8, sx + sw - 10]) rect(ctx, px, top + 12, 2, 4, shade('#5b5560', p));
      box(ctx, sx, top, sw, 13, shade('#14181c', p), p);
      centeredText(ctx, label, cx, top + 4, '#9bd23c');
      for (const lx of [sx + 3, sx + sw - 5]) {
        rect(ctx, lx, top + 13, 2, 1, p.night ? '#fff6c8' : '#9aa3ad');
        if (p.night) {
          ctx.fillStyle = 'rgba(255, 240, 180, 0.18)';
          ctx.fillRect(lx - 2, top + 2, 6, 11);
        }
      }
      // Tower shell, lime edge strips, and the dark frame around the screen.
      box(ctx, bx, bodyTop, bw, GROUND - bodyTop, shade('#1d2a22', p), p);
      rect(ctx, bx + 1, bodyTop + 1, 2, GROUND - bodyTop - 1, shade('#9bd23c', p));
      rect(ctx, bx + bw - 3, bodyTop + 1, 2, GROUND - bodyTop - 1, shade('#9bd23c', p));
      const L = ledRect(s);
      box(ctx, L.x - 1, L.y - 1, L.w + 2, L.h + 2, '#0b0f0c', p);
      // Lobby: stone base with glass doors.
      box(ctx, x, GROUND - 20, w, 20, shade('#d9d2c4', p), p);
      box(ctx, cx - 10, GROUND - 16, 20, 16, p.night ? '#e6cf8f' : '#cfe6f5', p);
      rect(ctx, cx, GROUND - 15, 1, 15, shade('#3a4a3a', p));
      for (const wx of [x + 5, x + w - 19]) box(ctx, wx, GROUND - 14, 14, 9, p.night ? '#e6cf8f' : '#cfe6f5', p);
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
  pipe(ctx, 4, TRUNK_Y, WORLD_W - 4, TRUNK_Y, p); // runs edge to edge (the pipe is 8px thick, 4px past each end point)
  pipe(ctx, DEEP_X, DEEP_Y, STRUCTURES.find((x) => x.id === 'lake')!.riser!, DEEP_Y, p, 7);
  for (let xx = 40; xx < WORLD_W - 4; xx += 48) flange(ctx, xx, TRUNK_Y, false, p);

  // Risers from buildings
  for (const s of STRUCTURES) {
    if (!s.riser || s.id === 'super') continue;
    const deep = s.id === 'lake';
    pipe(ctx, s.riser, GROUND + 4, s.riser, deep ? DEEP_Y : TRUNK_Y, p);
    flange(ctx, s.riser, GROUND + 14, true, p);
  }
  pipe(ctx, DEEP_X, TANK_BOTTOM, DEEP_X, DEEP_Y, p, 7);

  // Warehouse junction tank
  const tx = JUNCTION_X - 36, ty = GROUND + 14;
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
  // 22 safeguarded at Super.com, plus GenLedge's 2 data and 2 CI/CD pipelines.
  // Centred in the gap between the GenLedge riser and the deep line.
  const pipelinesLabel = '26 PIPELINES KEPT RUNNING';
  const gapL = STRUCTURES.find((x) => x.id === 'genledge')!.riser! + 4, gapR = DEEP_X - 3.5;
  text(ctx, pipelinesLabel, Math.round((gapL + gapR) / 2 - textWidth(pipelinesLabel) / 2), TRUNK_Y + 7, '#f0a868');
}

// Horizontal spans of everything vertical underground that a curb plate could run into.
function pipeSpans(): [number, number][] {
  const spans: [number, number][] = [];
  for (const s of STRUCTURES) {
    if (s.kind === 'warp') spans.push([s.x + 2, s.x + s.w - 2]);
    else if (s.riser && s.id !== 'super') spans.push([s.riser - 4, s.riser + 4]);
  }
  spans.push([JUNCTION_X - 4, JUNCTION_X + 4], [DEEP_X - 4, DEEP_X + 4]);
  return spans;
}

function drawStreet(ctx: Ctx, p: Palette) {
  rect(ctx, 0, GROUND, WORLD_W, 4, p.sidewalk);
  rect(ctx, 0, GROUND + 3, WORLD_W, 1, p.curb);
  for (let xx = 0; xx < WORLD_W; xx += 12) rect(ctx, xx, GROUND + 1, 1, 2, p.curb);

  // District name plates sit in the curb so buildings never cover them.
  for (const d of DISTRICTS) {
    const label = d.name.toUpperCase().replace("'", '');
    const plate = shade(LENS_COLOR[d.lens], p);
    // A name that would run under a pipe beside it stacks on two lines instead.
    const split = [label.slice(0, label.lastIndexOf(' ')), label.slice(label.lastIndexOf(' ') + 1)];
    const oneLineW = textWidth(label) + 6;
    const stacked = label.includes(' ') && (d.id === 'commercial' || pipeSpans().some(([a, b]) => a < d.x0 + 4 + oneLineW + 1 && b > d.x0 + 3));
    const lines = stacked ? split : [label];
    const pw = Math.max(...lines.map((l) => textWidth(l))) + 6;
    let px = d.x0 + 4;
    if (d.id === 'data' || d.id === 'ai') {
      // Centre this plate in the clear span between the warp pipe on its left and the copper riser on its right.
      const spans = pipeSpans();
      const left = Math.max(...spans.filter(([, b]) => b <= px).map(([, b]) => b));
      const right = Math.min(...spans.filter(([a]) => a >= left + pw).map(([a]) => a));
      px = Math.round(left + (right - left - pw) / 2);
    }
    box(ctx, px, GROUND + 6, pw, lines.length * 8 + 1, plate, p);
    lines.forEach((l, i) => text(ctx, l, px + 3, GROUND + 8 + i * 8, ink(plate)));
  }

  // Street furniture fills the gaps between buildings: lamps and trees alternate.
  const sorted = [...STRUCTURES].sort((a, b) => a.x - b.x);
  sorted.forEach((s, i) => {
    const next = sorted[i + 1];
    const gapStart = s.x + s.w, gapEnd = next ? next.x : WORLD_W;
    const gap = gapEnd - gapStart;
    if (gap < 14) return;
    const mid = Math.round(gapStart + gap / 2);
    // Overrides: no tree between GenLedge and Super.com, a lamp (not a tree) between the arcade and museum and between the warp pipe and KnowIdea.
    if (s.id === 'genledge') return;
    if (i % 2 || s.id === 'arcade' || s.id === 'warp-2') lamp(ctx, mid, p);
    else tree(ctx, mid - 5, p, 1);
  });
  // The civic green: extra trees behind the duck pond and around the park.
  // One continuous lawn from the park sign to CityScapes, so no bare gaps show between the pieces.
  const sign = STRUCTURES.find((x) => x.id === 'parksign')!, chess = STRUCTURES.find((x) => x.id === 'chess')!;
  const lawnEnd = STRUCTURES.find((x) => x.id === 'cityscapes')!.x;
  // Fill only the bare stretches: sign to chess table, and chess table to CityScapes.
  for (const [from, to] of [[sign.x + sign.w - 1, chess.x], [chess.x + chess.w + 4, lawnEnd]]) {
    rect(ctx, from, GROUND - 2, to - from, 2, shade('#4fa84f', p));
    for (let xx = from; xx < to; xx += 3) rect(ctx, xx, GROUND - 3, 1, 1, shade('#7fd17a', p));
  }
  const pond = STRUCTURES.find((x) => x.id === 'pond')!.x;
  for (const [dx, size] of [[31, 1], [45, 2], [70, 1]] as const) tree(ctx, pond + dx, p, size);
}

export function buildCityLayer(p: Palette) {
  const c = document.createElement('canvas');
  c.width = WORLD_W;
  c.height = WORLD_H;
  const ctx = c.getContext('2d')!;
  drawUnderground(ctx, p);
  drawStreet(ctx, p);
  for (const s of STRUCTURES) drawStructure(ctx, s, p);
  // Welcome banner
  ribbon(ctx, BANNER.label, BANNER.cx, BANNER.y, '#e8c547', '#2a2233', p);
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
  const sx = Math.max(24, width - 60), sy = 22;
  if (p.night) {
    const r = rng(42);
    for (let i = 0; i < width / 6; i++) {
      const starX = Math.floor(r() * width), starY = Math.floor(r() * height * 0.7);
      // Keep stars out of the moon's square so none shows through the crescent's cut-out.
      if (Math.abs(starX - (sx + 8)) <= 11 && Math.abs(starY - (sy + 8)) <= 11) continue;
      rect(ctx, starX, starY, 1, 1, p.star);
    }
  }
  // Sun or moon
  if (p.night) {
    // Waning crescent: a disk with a second, offset disk carved out of its
    // right side, so the lit sliver hugs the left edge and tapers to two tips.
    const mx = sx + 8, my = sy + 8;
    for (let yy = -10; yy <= 10; yy++)
      for (let xx = -10; xx <= 10; xx++) {
        const inMoon = xx * xx + yy * yy <= 9.5 * 9.5;
        const inCut = (xx - 5) ** 2 + (yy + 1) ** 2 <= 8.5 * 8.5;
        if (inMoon && !inCut) rect(ctx, mx + xx, my + yy, 1, 1, p.sun);
      }
  } else {
    rect(ctx, sx, sy, 14, 14, p.sun);
    rect(ctx, sx - 2, sy + 2, 18, 10, p.sun);
    rect(ctx, sx + 2, sy - 2, 10, 18, p.sun);
  }
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
const CN_TOWER_X = 915; // Downtown AI District
const WILLIS_TOWER_X = 1460; // City Square

export const parallaxPad = (viewW: number) => Math.ceil(viewW / 2) + 2;

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
  // The main pod, about 28% thicker than the first draft (12 rows, was 9).
  rect(ctx, cx - 8, pod, 17, 4, col);
  rect(ctx, cx - 6, pod + 4, 13, 3, col);
  rect(ctx, cx - 4, pod - 3, 9, 3, col);
  rect(ctx, cx - 2, pod - 5, 5, 2, col);
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

// Height of the elevated rail line in the far layer, and its silhouette colour.
export const RAIL_Y = GROUND - 66;
function farInk(p: Palette) {
  const haze = p.sky[p.sky.length - 1];
  const col = mixHex(haze, p.night ? '#04061a' : '#3d5f8f', p.night ? 0.45 : 0.3);
  return mixHex(col, p.night ? '#000000' : '#1c3358', 0.4);
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
    // Elevated high-speed rail viaduct in front of the far skyline.
    rect(ctx, 0, RAIL_Y + 6, c.width, 2, mark);
    for (let px = 12; px < c.width; px += 44) {
      rect(ctx, px, RAIL_Y + 8, 3, GROUND - RAIL_Y - 8, mark);
      rect(ctx, px - 2, RAIL_Y + 8, 7, 1, mark);
    }
  }
  return c;
}

// Left edge of a parallax layer on screen, given the street layer's origin
// (the negated camera x, or a positive offset when the world is centred).
export function parallaxX(kind: ParallaxKind, viewW: number, originX: number) {
  const f = PARALLAX[kind];
  return Math.round((1 - f) * (viewW / 2) + f * originX - parallaxPad(viewW));
}

// A bullet train silhouette that zooms along the far viaduct every so often,
// alternating direction each pass. Drawn between the far and mid layers.
const TRAIN_CARS = 4, CAR_W = 26, NOSE = 12;
const TRAIN_LEN = TRAIN_CARS * CAR_W + NOSE * 2;
const TRAIN_SPEED = 0.11; // far-layer pixels per ms
const TRAIN_REST = 9000; // ms of empty track between passes

export function drawTrain(ctx: Ctx, t: number, layerX: number, layerW: number, offsetY: number, p: Palette) {
  const run = (layerW + TRAIN_LEN * 2) / TRAIN_SPEED;
  const period = run + TRAIN_REST;
  const pass = Math.floor(t / period);
  const k = t - pass * period;
  if (k > run) return;
  const east = pass % 2 === 0;
  const d = k * TRAIN_SPEED - TRAIN_LEN;
  const x0 = Math.round(layerX + (east ? d : layerW - d - TRAIN_LEN));
  const y = Math.round(RAIL_Y + offsetY);
  const col = farInk(p);
  // Body sits on the viaduct deck (deck top is RAIL_Y + 6).
  rect(ctx, x0 + NOSE, y, TRAIN_CARS * CAR_W, 6, col);
  // Tapered noses at both ends, steps of one pixel row each.
  for (let i = 0; i < 6; i++) {
    const w = Math.round(NOSE * (1 - (5 - i) / 7));
    rect(ctx, x0 + NOSE - w, y + i, w, 1, col);
    rect(ctx, x0 + NOSE + TRAIN_CARS * CAR_W, y + i, w, 1, col);
  }
  // Car gaps and a window strip (lit at night).
  const strip = p.night ? '#ffd76a' : mixHex(col, '#ffffff', 0.25);
  rect(ctx, x0 + NOSE + 2, y + 2, TRAIN_CARS * CAR_W - 4, 1, strip);
  const gap = mixHex(col, '#ffffff', p.night ? 0.05 : 0.15);
  for (let i = 1; i < TRAIN_CARS; i++) rect(ctx, x0 + NOSE + i * CAR_W, y + 1, 1, 5, gap);
  // Pantograph spark on the leading car.
  const lead = east ? x0 + NOSE + TRAIN_CARS * CAR_W - 8 : x0 + NOSE + 6;
  rect(ctx, lead, y - 2, 3, 1, col);
  rect(ctx, lead + 1, y - 1, 1, 1, col);
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

export function preparePaths(): PreparedPath[] {
  return PIPE_PATHS.map((path) => {
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
    if (s.kind === 'glass') tops.push([s.x + s.w / 2, GROUND - s.h - 13]);
    if (s.kind === 'hq') tops.push([s.x + 16, GROUND - s.h - 2], [s.x + s.w - 16, GROUND - s.h - 2]);
    if (s.kind === 'marble') tops.push([s.x + s.w / 2 - 1, GROUND - s.h - 7]);
    if (s.kind === 'lab') tops.push([s.x + s.w / 2 - 1, GROUND - s.h + 1]);
  }
  for (const [x, y] of tops) rect(ctx, x + originX - 1, y + offsetY, 3, 2, p.night ? '#ff5a5a' : '#e33b3b');
}

// Welcome ribbon geometry, shared by the baked banner and its live shine.
const BANNER = { label: 'WELCOME TO DVIJ CITY', cx: 80, y: 66, h: 21 };
const bannerRect = () => {
  const w = textWidth(BANNER.label) + 24;
  return { x: Math.round(BANNER.cx - w / 2), y: BANNER.y, w, h: BANNER.h };
};

// A slanted glint sweeps across the welcome banner every few seconds, then a small star twinkles.
export function drawBannerShine(ctx: Ctx, t: number, originX: number, offsetY: number) {
  const { x, y, w, h } = bannerRect();
  const period = 4200, sweep = 1100;
  const k = t % period;
  const bx = x + originX, by = y + offsetY;
  if (k < sweep) {
    // Clip to the panel so the glint never spills past its edge.
    const lead = Math.round((k / sweep) * (w + h + 8)) - 4;
    ctx.save();
    ctx.beginPath();
    ctx.rect(bx + 1, by + 1, w - 2, h - 2);
    ctx.clip();
    for (let row = 1; row < h - 1; row++) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fillRect(bx + lead - row, by + row, 3, 1);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(bx + lead - row - 2, by + row, 2, 1);
    }
    ctx.restore();
  } else if (k < sweep + 500) {
    const f = Math.floor((k - sweep) / 125) % 2;
    const sx = bx + w - 10, sy = by + 3;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx, sy + 1 - f, 1, 3 + 2 * f);
    ctx.fillRect(sx - 1 - f, sy + 2, 3 + 2 * f, 1);
  }
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

// Go Lime LED wall: four ads shown on a grid of 2x2 LED cells. Each change
// is a radial pixel dissolve that spreads out from the centre, with a bright
// ring of cells at its edge, like a screen refreshing.
const ADS = { hold: 3000, change: 700 };
interface LedFace { big: HTMLCanvasElement }
let led: { key: string; faces: LedFace[]; order: Float32Array; cols: number; rows: number } | null = null;

type Icon = (c: Ctx) => void;
interface Ad { bg: string; tall: [string, string][]; icon?: Icon }

// Paint one ad at cell resolution, then enlarge it x2 with faint grid lines
// between the cells so the face reads as LEDs. LEDs glow, so no night shading.
function ledFace(ad: Ad, cols: number, rows: number) {
  const small = document.createElement('canvas');
  small.width = cols;
  small.height = rows;
  const c = small.getContext('2d')!;
  rect(c, 0, 0, cols, rows, ad.bg);
  let y0 = Math.round(rows / 2 - (ad.tall.length * 9 - 4) / 2);
  if (ad.icon) {
    c.save();
    c.translate(Math.round(cols / 2 - 11), 0);
    ad.icon(c);
    c.restore();
    y0 = 26;
  }
  const gap = ad.icon ? 6 : 9;
  // An ad with a line too wide for the screen (with a 3-cell margin each side)
  // uses the half-size font, drawn straight onto the enlarged canvas below.
  const compact = ad.tall.some(([str]) => textWidth(str) > cols - 6);
  if (!compact) ad.tall.forEach(([str, col], i) => text(c, str, Math.round((cols - textWidth(str)) / 2), y0 + i * gap, col));
  const big = document.createElement('canvas');
  big.width = cols * LED;
  big.height = rows * LED;
  const b = big.getContext('2d')!;
  b.imageSmoothingEnabled = false;
  b.drawImage(small, 0, 0, big.width, big.height);
  b.fillStyle = 'rgba(0,0,0,0.25)';
  for (let i = 1; i < cols; i++) b.fillRect(i * LED - 1, 0, 1, big.height);
  for (let j = 1; j < rows; j++) b.fillRect(0, j * LED - 1, big.width, 1);
  if (compact) ad.tall.forEach(([str, col], i) => text(b, str, Math.round((big.width - textWidth(str)) / 2), y0 * LED + 2 + i * 10, col));
  return { big };
}

function buildAds(): Ad[] {
  const white = '#ffffff', lime = '#9bd23c';
  return [
    { bg: '#1f2b3d', tall: [['LEAD', lime], ['REPORTS', lime], ['12 MIN', white], ['> 10 S', lime]] },
    {
      bg: '#0d4d3c', tall: [['BEAT THE', white], ['HEAT,', white], ['NOT YOUR', lime], ['WALLET', lime]],
      icon: (c) => {
        // Air conditioner: grille box with a fan.
        rect(c, 4, 7, 13, 14, '#d9dde2');
        rect(c, 5, 8, 11, 12, '#9aa3ad');
        for (let y = 9; y < 19; y += 2) rect(c, 6, y, 9, 1, '#d9dde2');
        rect(c, 4, 21, 13, 1, '#2a2233');
      },
    },
    {
      bg: '#1e6f2a', tall: [['$99', '#ffd23f'], ['TANKLESS', white], ['+ HEAT', white], ['PUMP', white]],
      icon: (c) => {
        // Tankless water heater with a red price badge.
        rect(c, 6, 5, 9, 17, '#f5f1e8');
        rect(c, 8, 8, 5, 3, '#2a2233');
        rect(c, 9, 9, 3, 1, lime);
        rect(c, 8, 22, 1, 2, '#9aa3ad');
        rect(c, 12, 22, 1, 2, '#9aa3ad');
        rect(c, 12, 15, 6, 5, '#e0302f');
        rect(c, 13, 17, 4, 1, white);
      },
    },
    {
      bg: '#2a6fae', tall: [['CLEAN', white], ['WATER,', white], ['EVERY', '#d6f0ff'], ['TAP', '#d6f0ff']],
      icon: (c) => {
        // A water drop.
        const rows = [[10, 1], [9, 3], [9, 3], [8, 5], [7, 7], [6, 9], [6, 9], [6, 9], [7, 7], [8, 5]];
        rows.forEach(([x, w], i) => rect(c, x, 8 + i, w, 1, '#9fd0ff'));
        rect(c, 8, 13, 1, 2, white);
      },
    },
  ];
}

function drawLedWall(ctx: Ctx, s: Structure, t: number, originX: number, offsetY: number) {
  if (typeof document === 'undefined') return;
  const L = ledRect(s);
  const cols = Math.floor(L.w / LED), rows = Math.floor(L.h / LED);
  const key = `${cols}x${rows}`;
  if (!led || led.key !== key) {
    // Each cell's turn comes from its distance to the centre, plus jitter
    // so the ring's edge is ragged and pixel-y rather than a clean circle.
    const r = rng(1108), order = new Float32Array(cols * rows);
    const mx = (cols - 1) / 2, my = (rows - 1) / 2, max = Math.hypot(mx, my);
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) order[j * cols + i] = (Math.hypot(i - mx, j - my) / max) * 0.85 + r() * 0.15;
    led = { key, cols, rows, order, faces: buildAds().map((ad) => ledFace(ad, cols, rows)) };
  }
  const { faces, order } = led;
  const each = ADS.hold + ADS.change;
  const phase = Math.max(0, t) % (each * faces.length);
  const n = Math.floor(phase / each), k = phase - n * each;
  const cur = faces[n].big, next = faces[(n + 1) % faces.length].big;
  const dx = L.x + originX, dy = L.y + offsetY;
  ctx.drawImage(cur, dx, dy);
  if (k < ADS.hold) return;
  const q = ((k - ADS.hold) / ADS.change) * 1.1;
  const flash = Math.floor(t / 60) % 2 ? '#ffffff' : '#c8f27a';
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const o = order[j * cols + i];
      if (o >= q) continue;
      const px = i * LED, py = j * LED;
      if (q - o < 0.06) rect(ctx, dx + px, dy + py, LED - 1, LED - 1, flash);
      else ctx.drawImage(next, px, py, LED, LED, dx + px, dy + py, LED, LED);
    }
  }
}

export function drawProps(ctx: Ctx, t: number, originX: number, offsetY: number, p: Palette) {
  for (const s of STRUCTURES) {
    const top = GROUND - s.h + offsetY;
    if (s.kind === 'mediahq') drawLedWall(ctx, s, t, originX, offsetY);
    if (s.kind === 'loadtruck' && t > 0) {
      // A piece drops from the chute into the gap, the row flashes clear, repeat.
      const cycle = 2600, f = (t % cycle) / cycle, k = Math.floor(t / cycle);
      const gy = GROUND + offsetY, bx = s.x + 21 + originX;
      const land = gy - 13;
      if (f < 0.55) {
        const y = gy - 22 + (f / 0.55) * (land - (gy - 22));
        stackCell(ctx, bx, Math.round(y), BLOCK_COLORS[k % BLOCK_COLORS.length], p);
      } else if (f < 0.75) {
        stackCell(ctx, bx, land, BLOCK_COLORS[k % BLOCK_COLORS.length], p);
      } else if (Math.floor(t / 120) % 2) {
        rect(ctx, s.x + 12 + originX, land, 19, 2, '#ffffff');
      }
    }
    if (s.kind === 'arcadehall' && p.night) {
      // Marquee dashes and the bulb strip chase on and off after dark.
      const neon = ['#e0457b', '#f2a33a', '#e8c547', '#3fb950', '#22b8cf', '#9b6bf2'];
      const step = Math.floor(t / 350), ax = s.x + originX;
      for (let i = 0; i < s.w - 24; i += 4) {
        const on = (i / 4 + step) % 2 === 0;
        rect(ctx, ax + 12 + i, top + 2, 2, 1, on ? (i % 8 ? '#e8c547' : '#ffffff') : shade('#3a3350', p));
      }
      for (let i = 0; i < s.w; i += 6) {
        const on = (i / 6 + step) % 2 === 0;
        rect(ctx, ax + i, top + 16, 3, 2, on ? neon[(i / 6) % neon.length] : shade('#2a1f4a', p));
      }
    }
    if (s.kind === 'construction') {
      const len = 20 + Math.round(Math.sin(t / 700) * 5);
      const hx = s.x + 24 + originX;
      rect(ctx, hx, top + 3, 1, len, p.lamp);
      rect(ctx, hx - 3, top + 3 + len, 7, 5, shade('#9aa3ad', p));
      rect(ctx, hx - 3, top + 3 + len, 7, 1, shade('#c4ccd4', p));
    }
    if (s.kind === 'lawn') {
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
    if (s.kind === 'pond') {
      // Two ducks swim end to end, 3 seconds each way, turning around at the reeds.
      const span = s.w - 16, period = 6000, gy = GROUND + offsetY;
      for (const [startPhase, dy] of [[0, -8], [0.35, -6]]) {
        const phase = (((t / period) + startPhase) % 1 + 1) % 1;
        const right = phase < 0.5;
        const off = Math.round((right ? phase * 2 : (1 - phase) * 2) * span);
        const dx = s.x + 3 + off + originX, y = gy + dy;
        const body = shade('#f2c84b', p);
        if (right) {
          rect(ctx, dx, y, 7, 4, body);
          rect(ctx, dx + 5, y - 3, 3, 3, body);
          rect(ctx, dx + 8, y - 2, 2, 1, shade('#f28c28', p));
          rect(ctx, dx + 6, y - 2, 1, 1, p.outline);
        } else {
          rect(ctx, dx + 3, y, 7, 4, body);
          rect(ctx, dx + 2, y - 3, 3, 3, body);
          rect(ctx, dx, y - 2, 2, 1, shade('#f28c28', p));
          rect(ctx, dx + 3, y - 2, 1, 1, p.outline);
        }
      }
    }
    if (s.kind === 'refinery') {
      // File crates ride the conveyor into the refinery; smoke drifts up.
      const hallW = s.w - 40, belt = GROUND + offsetY - 10;
      const labels = ['CSV', 'TSV', 'XLS', 'JSON'];
      const cycle = 2400, k = Math.floor(t / cycle) % labels.length, f = (t % cycle) / cycle;
      const crateX = Math.round(s.x + s.w - 18 - f * 34 + originX);
      rect(ctx, crateX - 1, belt - 9, 19, 9, p.outline);
      rect(ctx, crateX, belt - 8, 17, 7, shade('#c8a24a', p));
      text(ctx, labels[k], crateX + Math.floor((17 - (labels[k].length * 4 - 1)) / 2), belt - 7, '#2a2233'); // centred in the 17px crate
      if (t > 0) {
        for (const [sx, phase] of [[s.x + 10, 0], [s.x + 26, 900]]) {
          for (let i = 0; i < 3; i++) {
            const age = ((t + phase + i * 600) % 1800) / 1800;
            const r2 = 2 + Math.round(age * 3);
            ctx.fillStyle = p.night ? `rgba(150,150,170,${0.5 - age * 0.45})` : `rgba(235,235,240,${0.8 - age * 0.7})`;
            ctx.fillRect(Math.round(sx + originX - r2 / 2 + age * 6), Math.round(top - 4 - age * 22), r2, r2);
          }
        }
      }
      void hallW;
    }
  }
}
