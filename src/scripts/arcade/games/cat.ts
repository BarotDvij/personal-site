// Trap the Cat: block hex tiles until the cat has nowhere left to run.

import type { Api, Game, GameModule } from '../types';
import { text } from '../../pixelfont';

const N = 11;
const CW = 13;
const RH = 11;
const TOP = 14;
const W = N * CW + 8;
const H = N * RH + TOP + 6;

function create(api: Api): Game {
  const { ctx } = api;
  const blocked: boolean[] = Array(N * N).fill(false);
  let cat = [5, 5];
  let moves = 0;
  let done = false;
  let hover = -1;
  let t = 0;

  const idx = (x: number, y: number) => y * N + x;
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < N && y < N;
  const edge = (x: number, y: number) => x === 0 || y === 0 || x === N - 1 || y === N - 1;
  const neighbors = (x: number, y: number): [number, number][] => {
    const odd = y % 2 === 1;
    const d = odd
      ? [[0, -1], [1, -1], [-1, 0], [1, 0], [0, 1], [1, 1]]
      : [[-1, -1], [0, -1], [-1, 0], [1, 0], [-1, 1], [0, 1]];
    return d.map(([dx, dy]) => [x + dx, y + dy] as [number, number]).filter(([nx, ny]) => inside(nx, ny));
  };
  const center = (x: number, y: number) => [4 + x * CW + (y % 2 ? CW / 2 : 0) + CW / 2, TOP + 3 + y * RH + RH / 2];

  // Start with a few random blocks, never on the cat.
  let start = 0;
  while (start < 9) {
    const i = Math.floor(Math.random() * N * N);
    if (i !== idx(5, 5) && !blocked[i]) {
      blocked[i] = true;
      start++;
    }
  }

  // Breadth-first search to the nearest edge tile.
  function nextStep(): [number, number] | null {
    const [cx, cy] = cat;
    const prev = new Map<number, number>();
    const seen = new Set([idx(cx, cy)]);
    const queue: [number, number][] = [[cx, cy]];
    while (queue.length) {
      const [x, y] = queue.shift()!;
      if (edge(x, y) && !(x === cx && y === cy)) {
        let cur = idx(x, y);
        while (prev.get(cur) !== idx(cx, cy)) cur = prev.get(cur)!;
        return [cur % N, Math.floor(cur / N)];
      }
      for (const [nx, ny] of neighbors(x, y)) {
        const j = idx(nx, ny);
        if (blocked[j] || seen.has(j)) continue;
        seen.add(j);
        prev.set(j, idx(x, y));
        queue.push([nx, ny]);
      }
    }
    const open = neighbors(cx, cy).filter(([x, y]) => !blocked[idx(x, y)]);
    return open.length ? open[Math.floor(Math.random() * open.length)] : null;
  }

  function play(i: number) {
    if (done || blocked[i] || i === idx(cat[0], cat[1])) return;
    blocked[i] = true;
    moves++;
    api.setScore(moves);
    api.sound.blip();
    if (edge(cat[0], cat[1])) {
      done = true;
      api.over('The cat escaped!');
      return;
    }
    const step = nextStep();
    if (!step) {
      done = true;
      api.over(`Trapped in ${moves} moves!`, true);
      return;
    }
    cat = step;
  }

  function hit(px: number, py: number) {
    let best = -1, dist = 999;
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const [cx, cy] = center(x, y);
        const d = Math.hypot(px - cx, py - cy);
        if (d < dist) { dist = d; best = idx(x, y); }
      }
    return dist < 7 ? best : -1;
  }

  return {
    update(dt) {
      t += dt;
    },
    pointer(x, y, kind) {
      const i = hit(x, y);
      if (kind === 'move') hover = i;
      if (kind === 'down' && i >= 0) play(i);
    },
    render() {
      ctx.fillStyle = '#1f3a2a';
      ctx.fillRect(0, 0, W, H);
      text(ctx, 'TRAP THE CAT', 4, 4, '#e8c547');
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++) {
          const i = idx(x, y), [cx, cy] = center(x, y);
          ctx.fillStyle = blocked[i] ? '#7b4a2a' : i === hover ? '#9be07a' : '#6cc46a';
          ctx.fillRect(cx - 5, cy - 4, 10, 8);
          ctx.fillRect(cx - 4, cy - 5, 8, 10);
          if (blocked[i]) {
            ctx.fillStyle = '#4d2f1c';
            ctx.fillRect(cx - 3, cy - 1, 6, 2);
          }
        }
      // The cat, with a tail flick
      const [cx, cy] = center(cat[0], cat[1]);
      const flick = !api.reduced && Math.floor(t / 400) % 2;
      ctx.fillStyle = '#2a2233';
      ctx.fillRect(cx - 4, cy - 3, 8, 6);
      ctx.fillRect(cx - 4, cy - 6, 2, 3);
      ctx.fillRect(cx + 2, cy - 6, 2, 3);
      ctx.fillRect(cx + 4, cy + (flick ? -2 : 0), 2, 3);
      ctx.fillStyle = '#e8c547';
      ctx.fillRect(cx - 2, cy - 2, 1, 1);
      ctx.fillRect(cx + 1, cy - 2, 1, 1);
    },
  };
}

const mod: GameModule = { width: W, height: H, pad: 'none', best: 'low', create };
export default mod;
