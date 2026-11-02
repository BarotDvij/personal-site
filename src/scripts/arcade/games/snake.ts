// Packet Snake: a data packet grows as it collects more packets in the pipes.

import type { Api, Game, GameModule } from '../types';
import { text, textWidth } from '../../pixelfont';

const C = 8;
const COLS = 20;
const ROWS = 16;
const COLORS = ['#e0457b', '#f2a33a', '#9b6bf2', '#3b82f6', '#3fb950'];
type Dir = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';
const VEC: Record<Dir, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
const KEYS: Record<string, Dir> = { ArrowUp: 'ArrowUp', w: 'ArrowUp', ArrowDown: 'ArrowDown', s: 'ArrowDown', ArrowLeft: 'ArrowLeft', a: 'ArrowLeft', ArrowRight: 'ArrowRight', d: 'ArrowRight' };

function create(api: Api): Game {
  const { ctx } = api;
  let body: [number, number][] = [[6, 8], [5, 8], [4, 8]];
  let dir: Dir = 'ArrowRight';
  const queue: Dir[] = [];
  let food: [number, number] = [14, 8];
  let eaten = 0;
  let timer = 0;
  let t = 0;
  let started = false;

  const opposite = (a: Dir, b: Dir) => VEC[a][0] === -VEC[b][0] && VEC[a][1] === -VEC[b][1];

  function turn(d: Dir) {
    started = true;
    const lastDir = queue.length ? queue[queue.length - 1] : dir;
    if (d !== lastDir && !opposite(d, lastDir) && queue.length < 2) queue.push(d);
  }

  function placeFood() {
    const free: [number, number][] = [];
    for (let y = 1; y < ROWS - 1; y++)
      for (let x = 1; x < COLS - 1; x++) if (!body.some(([bx, by]) => bx === x && by === y)) free.push([x, y]);
    food = free[Math.floor(Math.random() * free.length)];
  }

  function step() {
    if (queue.length) dir = queue.shift()!;
    const [hx, hy] = body[0];
    const nx = hx + VEC[dir][0], ny = hy + VEC[dir][1];
    const ate = nx === food[0] && ny === food[1];
    const tail = ate ? body : body.slice(0, -1);
    if (nx < 1 || ny < 1 || nx >= COLS - 1 || ny >= ROWS - 1 || tail.some(([x, y]) => x === nx && y === ny)) {
      api.sound.bad();
      api.over(`Pipe burst! ${eaten} packets.`);
      return;
    }
    body = [[nx, ny], ...tail];
    if (ate) {
      eaten++;
      api.setScore(eaten);
      api.sound.blip();
      placeFood();
    }
  }

  return {
    update(dt) {
      t += dt;
      for (const k of Object.keys(KEYS)) if (api.pressed(k)) turn(KEYS[k]);
      if (!started) return;
      timer += dt;
      const interval = Math.max(60, 130 - eaten * 3);
      if (timer >= interval) {
        timer -= interval;
        step();
      }
    },
    swipe: (d) => turn(d),
    render() {
      ctx.fillStyle = '#2b1a10';
      ctx.fillRect(0, 0, COLS * C, ROWS * C);
      ctx.fillStyle = '#3a2416';
      for (let y = 1; y < ROWS - 1; y++) for (let x = 1; x < COLS - 1; x++) if ((x + y) % 2) ctx.fillRect(x * C, y * C, C, C);
      // Copper pipe walls
      ctx.fillStyle = '#c8743a';
      ctx.fillRect(0, 0, COLS * C, C);
      ctx.fillRect(0, (ROWS - 1) * C, COLS * C, C);
      ctx.fillRect(0, 0, C, ROWS * C);
      ctx.fillRect((COLS - 1) * C, 0, C, ROWS * C);
      ctx.fillStyle = '#f0a868';
      ctx.fillRect(0, 1, COLS * C, 1);
      ctx.fillRect(0, (ROWS - 1) * C + 1, COLS * C, 1);
      ctx.fillStyle = '#4a2511';
      for (let x = 0; x < COLS * C; x += 24) {
        ctx.fillRect(x, 0, 2, C);
        ctx.fillRect(x, (ROWS - 1) * C, 2, C);
      }
      // Food blinks
      if (api.reduced || Math.floor(t / 250) % 2 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(food[0] * C + 1, food[1] * C + 1, 6, 6);
        ctx.fillStyle = '#e8c547';
        ctx.fillRect(food[0] * C + 2, food[1] * C + 2, 4, 4);
      }
      body.forEach(([x, y], i) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x * C, y * C, C, C);
        ctx.fillStyle = i === 0 ? '#9bd23c' : COLORS[i % COLORS.length];
        ctx.fillRect(x * C + 1, y * C + 1, C - 2, C - 2);
      });
      if (!started) {
        const msg = 'PRESS AN ARROW OR SWIPE';
        ctx.fillStyle = 'rgba(26,22,38,0.85)';
        ctx.fillRect(COLS * C / 2 - 52, 44, 104, 11);
        text(ctx, msg, COLS * C / 2 - textWidth(msg) / 2, 47, '#e8c547');
      }
      const label = `PACKETS ${eaten}`;
      text(ctx, label, COLS * C - textWidth(label) - 3, 2, '#2a1508');
    },
  };
}

const mod: GameModule = { width: COLS * C, height: ROWS * C, pad: 'dpad', best: 'high', create };
export default mod;
