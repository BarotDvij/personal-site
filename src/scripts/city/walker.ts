// The visitor's character: walks the street, opens doors, and drops into
// warp pipes. Drawn from a tiny pixel grid like everything else in the city.

import { GROUND, STRUCTURES, WORLD_W, type Structure } from './world';
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
export const HEIGHT = SPRITE.length + 3;
// The UP: PLAY prompt floats this far above the ground and is this thick.
export const PROMPT_TOP = HEIGHT + 12;
export const PROMPT_THICK = 9;
const WARP_TIME = 420;
const GRAVITY = 0.18;
const JUMP_SPEED = 3.4; // apex about 32px, enough to clear a 26px warp pipe

// Warp pipes form a chain from west to east. Facing right sends you to the
// next pipe, facing left to the previous one, and the ends wrap around.
const PIPES = STRUCTURES.filter((s) => s.kind === 'warp').sort((a, b) => a.x - b.x);
/** Warp pipe whose body overlaps x (with the character's half-width). */
const pipeAt = (x: number) => PIPES.find((s) => x > s.x - 3 && x < s.x + s.w + 3);
/** Height of whatever the character would stand on at x. */
const supportAt = (x: number) => pipeAt(x)?.h ?? 0;

export interface Walker {
  x: number;
  jump: number;
  vy: number;
  facing: 1 | -1;
  moving: boolean;
  step: number;
  warp: number;
  warpTo: number;
  rise: number;
  poof: number;
}

export const createWalker = (): Walker => ({ x: 112, jump: 0, vy: 0, facing: 1, moving: false, step: 0, warp: 0, warpTo: -1, rise: 0, poof: 0 });

/** True when standing on top of a warp pipe. */
export const onPipe = (w: Walker) => {
  const pipe = pipeAt(w.x);
  return !!pipe && w.vy === 0 && Math.abs(w.jump - pipe.h) < 0.5;
};

/** The structure the character can use right now: a door in front of it, or the pipe under or beside it. */
export function nearby(w: Walker): Structure | undefined {
  const pipe = PIPES.find((s) => w.x > s.x - 10 && w.x < s.x + s.w + 10);
  if (pipe) return pipe;
  return STRUCTURES.find((s) => s.ref && s.kind !== 'warp' && w.x >= s.x + 2 && w.x <= s.x + s.w - 2);
}

/** Puts the character on top of a pipe (used when jumping straight to one). */
export function standOn(w: Walker, s: Structure) {
  w.x = s.x + s.w / 2;
  w.jump = s.kind === 'warp' ? s.h : 0;
  w.vy = 0;
}

/** The pipe you would come out of from pipe s, given which way you face. */
export function destination(s: Structure, facing: 1 | -1) {
  const i = PIPES.indexOf(s);
  return PIPES[(i + facing + PIPES.length) % PIPES.length];
}

export function startWarp(w: Walker, s: Structure) {
  if (w.warp > 0 || w.rise > 0 || s.kind !== 'warp' || !onPipe(w)) return false;
  w.warp = WARP_TIME;
  w.warpTo = PIPES.indexOf(destination(s, w.facing));
  w.x = s.x + s.w / 2;
  return true;
}

export function jump(w: Walker) {
  const grounded = w.vy === 0 && Math.abs(w.jump - supportAt(w.x)) < 0.5;
  if (grounded && w.warp <= 0 && w.rise <= 0) w.vy = JUMP_SPEED;
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
      // Travel through the pipe network and rise out of the connected pipe.
      const exit = PIPES[w.warpTo];
      w.x = exit.x + exit.w / 2;
      w.jump = exit.h;
      w.vy = 0;
      w.rise = WARP_TIME;
    }
    return true;
  }
  if (w.rise > 0) {
    w.rise -= dt;
    return true;
  }
  const k = dt / 16.67;
  if (dir) {
    w.facing = dir > 0 ? 1 : -1;
    const nx = Math.max(4, Math.min(WORLD_W - 4, w.x + dir * (run ? 2.2 : 1.2) * k));
    // Pipes are solid: walk into one from the side and you stop, unless
    // you're already high enough to land on it.
    const blocker = pipeAt(nx);
    if (!blocker || pipeAt(w.x) === blocker || w.jump >= blocker.h - 0.5) w.x = nx;
    w.step += dt;
    changed = true;
  }
  w.moving = dir !== 0;
  const support = supportAt(w.x);
  if (w.vy !== 0 || w.jump > support + 0.01) {
    w.jump += w.vy * k;
    w.vy -= GRAVITY * k;
    if (w.jump <= support && w.vy <= 0) {
      w.jump = support;
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
  if (w.warp > 0 || w.rise > 0) {
    // Sinking in or rising out: clip everything below the pipe's lip.
    const pipeTop = GROUND + oy - 26;
    ctx.beginPath();
    ctx.rect(cx - 10, 0, 20, pipeTop);
    ctx.clip();
    const sunk = w.warp > 0 ? 1 - w.warp / WARP_TIME : w.rise / WARP_TIME;
    top = pipeTop - HEIGHT + Math.round(sunk * (HEIGHT + 2));
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
  if (!s || w.warp > 0 || w.rise > 0) return;
  const label =
    s.kind !== 'warp' ? (s.ref?.type === 'game' ? 'UP: PLAY' : 'UP: OPEN') : onPipe(w) ? (w.facing === 1 ? 'DOWN: WARP >' : '< DOWN: WARP') : w.jump === 0 ? 'SPACE: HOP ON' : '';
  if (!label) return;
  const cx = Math.round(w.x + ox);
  const y = GROUND + oy - HEIGHT - 12 - Math.round(w.jump);
  const width = textWidth(label) + 6;
  ctx.fillStyle = '#2a2233';
  ctx.fillRect(cx - width / 2, y, width, PROMPT_THICK);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - 1, y + PROMPT_THICK, 2, 2);
  text(ctx, label, cx - width / 2 + 3, y + 2, '#e8c547');
}

function shadeNight(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number, t: number) => Math.round(c * 0.7 + t * 0.3);
  const r = mix(n >> 16, 0x0b), g = mix((n >> 8) & 255, 0x15), b = mix(n & 255, 0x38);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
