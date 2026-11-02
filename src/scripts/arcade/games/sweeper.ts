// Bug Sweeper: clear the construction lot without digging up a bug.

import type { Api, Game, GameModule } from '../types';
import { text, textWidth } from '../../pixelfont';

const N = 10;
const BUGS = 14;
const C = 12;
const TOP = 14;
const W = N * C;
const H = N * C + TOP;
const NUM = ['', '#3b82f6', '#3fb950', '#e0457b', '#9b6bf2', '#c8743a', '#22b8cf', '#2a2233', '#7a7a7a'];

function create(api: Api): Game {
  const { ctx } = api;
  const bug: boolean[] = Array(N * N).fill(false);
  const open: boolean[] = Array(N * N).fill(false);
  const flag: boolean[] = Array(N * N).fill(false);
  let seeded = false;
  let flagMode = false;
  let time = 0;
  let done = false;
  let hit = -1;

  const idx = (x: number, y: number) => y * N + x;
  const around = (i: number) => {
    const x = i % N, y = Math.floor(i / N), out: number[] = [];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if ((dx || dy) && nx >= 0 && ny >= 0 && nx < N && ny < N) out.push(idx(nx, ny));
      }
    return out;
  };
  const count = (i: number) => around(i).filter((j) => bug[j]).length;

  // The first dig is always safe, so bugs are placed after it.
  function seed(safe: number) {
    const keepOut = new Set([safe, ...around(safe)]);
    let placed = 0;
    while (placed < BUGS) {
      const i = Math.floor(Math.random() * N * N);
      if (!bug[i] && !keepOut.has(i)) {
        bug[i] = true;
        placed++;
      }
    }
    seeded = true;
  }

  function dig(i: number) {
    if (open[i] || flag[i]) return;
    if (!seeded) seed(i);
    if (bug[i]) {
      hit = i;
      done = true;
      bug.forEach((b, j) => b && (open[j] = true));
      api.over('You dug up a bug!');
      return;
    }
    const stack = [i];
    while (stack.length) {
      const j = stack.pop()!;
      if (open[j] || flag[j]) continue;
      open[j] = true;
      if (count(j) === 0) stack.push(...around(j));
    }
    api.sound.blip();
    if (open.filter((o, j) => o && !bug[j]).length === N * N - BUGS) {
      done = true;
      api.setScore(Math.floor(time / 1000), `${Math.floor(time / 1000)}s`);
      api.over(`Lot cleared in ${Math.floor(time / 1000)}s.`, true);
    }
  }

  function toggleFlag(i: number) {
    if (open[i]) return;
    flag[i] = !flag[i];
    api.sound.blip();
  }

  return {
    update(dt) {
      if (seeded && !done) {
        time += dt;
        api.setScore(Math.floor(time / 1000), `${Math.floor(time / 1000)}s`);
      }
      if (api.pressed('f') || api.pressed('x')) flagMode = !flagMode;
    },
    pointer(x, y, kind) {
      if (done) return;
      if (y < TOP) {
        if (kind === 'down' && x > W - 44) flagMode = !flagMode;
        return;
      }
      if (kind !== 'down' && kind !== 'alt') return;
      const cx = Math.floor(x / C), cy = Math.floor((y - TOP) / C);
      if (cx < 0 || cy < 0 || cx >= N || cy >= N) return;
      const i = idx(cx, cy);
      if (kind === 'alt' || flagMode) toggleFlag(i);
      else dig(i);
    },
    render() {
      ctx.fillStyle = '#1a1626';
      ctx.fillRect(0, 0, W, H);
      const flags = flag.filter(Boolean).length;
      text(ctx, `BUGS ${BUGS - flags}`, 3, 4, '#e8c547');
      const mode = flagMode ? 'FLAG' : 'DIG';
      ctx.fillStyle = flagMode ? '#e0457b' : '#3d3560';
      ctx.fillRect(W - 44, 1, 42, 11);
      text(ctx, mode, W - 23 - Math.floor(textWidth(mode) / 2), 4, '#ffffff');
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++) {
          const i = idx(x, y), px = x * C, py = TOP + y * C;
          if (open[i]) {
            ctx.fillStyle = i === hit ? '#e0457b' : '#c9b48a';
            ctx.fillRect(px, py, C, C);
            ctx.fillStyle = '#a8946c';
            ctx.fillRect(px, py, C, 1);
            ctx.fillRect(px, py, 1, C);
            if (bug[i]) {
              ctx.fillStyle = '#2a2233';
              ctx.fillRect(px + 3, py + 4, 6, 5);
              ctx.fillRect(px + 2, py + 5, 1, 1);
              ctx.fillRect(px + 9, py + 5, 1, 1);
              ctx.fillRect(px + 2, py + 8, 1, 1);
              ctx.fillRect(px + 9, py + 8, 1, 1);
              ctx.fillRect(px + 5, py + 2, 2, 2);
            } else {
              const n = count(i);
              if (n) text(ctx, String(n), px + 4, py + 3, NUM[n]);
            }
          } else {
            ctx.fillStyle = '#7b4a2a';
            ctx.fillRect(px, py, C, C);
            ctx.fillStyle = '#9a6238';
            ctx.fillRect(px, py, C - 1, 1);
            ctx.fillRect(px, py, 1, C - 1);
            ctx.fillStyle = '#4d2f1c';
            ctx.fillRect(px + C - 1, py, 1, C);
            ctx.fillRect(px, py + C - 1, C, 1);
            if (flag[i]) {
              ctx.fillStyle = '#e8c547';
              ctx.fillRect(px + 4, py + 2, 1, 8);
              ctx.fillStyle = '#e0457b';
              ctx.fillRect(px + 5, py + 2, 4, 3);
            }
          }
        }
    },
  };
}

const mod: GameModule = { width: W, height: H, pad: 'none', best: 'low', create };
export default mod;
