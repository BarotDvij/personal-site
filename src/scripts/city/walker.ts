// The visitor's character: walks the street, opens doors, and drops into
// warp pipes. Drawn from a tiny pixel grid like everything else in the city.

import { DISTRICTS, GROUND, STRUCTURES, WORLD_W, type Structure } from './world';
import { text, textWidth } from '../pixelfont';
import type { Palette } from './art';

const SPRITE = [
  '..hhhh..',
  '.hhhhhh.',
  '.hsssss.',
  '.hssess.',
  '..ssss..',
  '.gggggg.',
  'sggggggs',
  'sggggggs',
  '.gggggg.',
  '.pppppp.',
];
const LEGS = [
  ['.pp..pp.', '.pp..pp.', '.kk..kk.'],
  ['.pp...pp', 'pp....pp', 'kk.....k'],
  ['..pppp..', '..pp.p..', '..kk.kk.'],
];
const COLORS: Record<string, string> = {
  h: '#2a1a12', s: '#c98e64', e: '#1a1626', g: '#9bd23c', p: '#2f3b5a', k: '#1a1626',
};
const HEIGHT = SPRITE.length + 3;
const WARP_TIME = 420;

export interface Walker {
  x: number;
  jump: number;
  vy: number;
  facing: 1 | -1;
  moving: boolean;
  step: number;
  warp: number;
  warpTo: number;
  poof: number;
}

export const createWalker = (): Walker => ({ x: 112, jump: 0, vy: 0, facing: 1, moving: false, step: 0, warp: 0, warpTo: -1, poof: 0 });

/** The clickable structure the character is standing in front of, if any. */
export function nearby(w: Walker): Structure | undefined {
  return STRUCTURES.find((s) => s.ref && w.x >= s.x + 2 && w.x <= s.x + s.w - 2);
}

export function startWarp(w: Walker, s: Structure) {
  if (w.warp > 0 || s.ref?.type !== 'warp') return false;
  w.warp = WARP_TIME;
  w.warpTo = s.ref.to;
  w.x = s.x + s.w / 2;
  return true;
}

export function jump(w: Walker) {
  if (w.jump === 0 && w.warp <= 0) w.vy = 2.6;
}

/** Advances the character. Returns true when it moved or animated. */
export function updateWalker(w: Walker, dir: number, run: boolean, dt: number): boolean {
  let changed = false;
  if (w.poof > 0) {
    w.poof -= dt;
    changed = true;
  }
  if (w.warp > 0) {
    w.warp -= dt;
    if (w.warp <= 0) {
      const d = DISTRICTS[w.warpTo];
      w.x = d.x0 + 36;
      w.facing = 1;
      w.poof = 300;
    }
    return true;
  }
  if (dir) {
    w.facing = dir > 0 ? 1 : -1;
    w.x = Math.max(4, Math.min(WORLD_W - 4, w.x + dir * (run ? 2.2 : 1.2) * (dt / 16.67)));
    w.step += dt;
    changed = true;
  }
  w.moving = dir !== 0;
  if (w.jump > 0 || w.vy > 0) {
    w.jump += w.vy * (dt / 16.67);
    w.vy -= 0.18 * (dt / 16.67);
    if (w.jump <= 0) {
      w.jump = 0;
      w.vy = 0;
    }
    changed = true;
  }
  return changed;
}

export function drawWalker(ctx: CanvasRenderingContext2D, w: Walker, ox: number, oy: number, p: Palette, animate: boolean) {
  const cx = Math.round(w.x + ox);
  let top = GROUND + oy - HEIGHT - Math.round(w.jump);
  const legs = !animate || !w.moving ? LEGS[0] : LEGS[1 + (Math.floor(w.step / 140) % 2)];
  const rows = [...SPRITE, ...legs];

  ctx.save();
  if (w.warp > 0) {
    // Sink into the pipe: clip everything below the pipe's lip.
    const pipeTop = GROUND + oy - 26;
    ctx.beginPath();
    ctx.rect(cx - 10, 0, 20, pipeTop);
    ctx.clip();
    top = pipeTop - HEIGHT + Math.round((1 - w.warp / WARP_TIME) * (HEIGHT + 2));
  }
  rows.forEach((row, y) => {
    for (let x = 0; x < 8; x++) {
      const ch = row[w.facing === 1 ? x : 7 - x];
      if (ch === '.') continue;
      ctx.fillStyle = p.night && ch !== 'e' ? shadeNight(COLORS[ch]) : COLORS[ch];
      ctx.fillRect(cx - 4 + x, top + y, 1, 1);
    }
  });
  ctx.restore();

  if (w.poof > 0) {
    const r = Math.round((300 - w.poof) / 40) + 4;
    ctx.fillStyle = '#ffffff';
    for (const [dx, dy] of [[-r, -6], [r, -6], [-r, -12], [r, -12], [0, -14 - r]]) ctx.fillRect(cx + dx, GROUND + oy + dy, 2, 2);
  }
}

export function drawPrompt(ctx: CanvasRenderingContext2D, w: Walker, s: Structure | undefined, ox: number, oy: number) {
  if (!s || w.warp > 0) return;
  const label = s.ref?.type === 'warp' ? 'DOWN: WARP' : 'UP: OPEN';
  const cx = Math.round(w.x + ox);
  const y = GROUND + oy - HEIGHT - 12 - Math.round(w.jump);
  const width = textWidth(label) + 6;
  ctx.fillStyle = '#2a2233';
  ctx.fillRect(cx - width / 2, y, width, 9);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - 1, y + 9, 2, 2);
  text(ctx, label, cx - width / 2 + 3, y + 2, '#e8c547');
}

function shadeNight(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number, t: number) => Math.round(c * 0.7 + t * 0.3);
  const r = mix(n >> 16, 0x0b), g = mix((n >> 8) & 255, 0x15), b = mix(n & 255, 0x38);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
