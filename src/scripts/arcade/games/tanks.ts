// Tank Duel: two players, one keyboard. Shells bounce off walls, so watch
// your own ricochets. First to 5 rounds wins. New maze every round.

import type { Api, Game, GameModule } from '../types';
import { text, textWidth } from '../../pixelfont';

const CELL = 24;
const MW = 8;
const MH = 5;
const TOP = 10;
const W = CELL * MW;
const H = CELL * MH + TOP;
const R = 4;
const WIN = 5;
const MAX_SHELLS = 5;
const SHELL_LIFE = 6000;

interface Wall { x: number; y: number; w: number; h: number }
interface Tank { x: number; y: number; a: number; color: string; dark: string; alive: boolean; keys: { up: string; down: string; left: string; right: string; fire: string[] } }
interface Shell { x: number; y: number; vx: number; vy: number; life: number; owner: number }

function maze(): Wall[] {
  // Recursive backtracker, then knock out extra walls for loops.
  const right = Array.from({ length: MH }, () => Array(MW).fill(true));
  const down = Array.from({ length: MH }, () => Array(MW).fill(true));
  const seen = Array.from({ length: MH }, () => Array(MW).fill(false));
  const stack: [number, number][] = [[0, 0]];
  seen[0][0] = true;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const next = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const)
      .map(([dx, dy]) => [x + dx, y + dy, dx, dy] as const)
      .filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < MW && ny < MH && !seen[ny][nx]);
    if (!next.length) {
      stack.pop();
      continue;
    }
    const [nx, ny, dx, dy] = next[Math.floor(Math.random() * next.length)];
    if (dx === 1) right[y][x] = false;
    if (dx === -1) right[y][nx] = false;
    if (dy === 1) down[y][x] = false;
    if (dy === -1) down[ny][x] = false;
    seen[ny][nx] = true;
    stack.push([nx, ny]);
  }
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(Math.random() * (MW - 1)), y = Math.floor(Math.random() * (MH - 1));
    Math.random() < 0.5 ? (right[y][x] = false) : (down[y][x] = false);
  }
  const walls: Wall[] = [
    { x: 0, y: TOP, w: W, h: 2 },
    { x: 0, y: H - 2, w: W, h: 2 },
    { x: 0, y: TOP, w: 2, h: H - TOP },
    { x: W - 2, y: TOP, w: 2, h: H - TOP },
  ];
  for (let y = 0; y < MH; y++)
    for (let x = 0; x < MW; x++) {
      if (x < MW - 1 && right[y][x]) walls.push({ x: (x + 1) * CELL - 1, y: TOP + y * CELL - 1, w: 2, h: CELL + 2 });
      if (y < MH - 1 && down[y][x]) walls.push({ x: x * CELL - 1, y: TOP + (y + 1) * CELL - 1, w: CELL + 2, h: 2 });
    }
  return walls;
}

function create(api: Api): Game {
  const { ctx } = api;
  const scores = [0, 0];
  let walls: Wall[] = [];
  let shells: Shell[] = [];
  let tanks: Tank[] = [];
  let roundOver = 0;
  let banner = '';

  const hitsWall = (x: number, y: number, r: number) =>
    walls.some((w) => x + r > w.x && x - r < w.x + w.w && y + r > w.y && y - r < w.y + w.h);

  function round() {
    walls = maze();
    shells = [];
    tanks = [
      { x: CELL / 2, y: TOP + CELL / 2, a: 0, color: '#3fb950', dark: '#1f6b2c', alive: true, keys: { up: 'w', down: 's', left: 'a', right: 'd', fire: ['q'] } },
      { x: W - CELL / 2, y: H - CELL / 2, a: Math.PI, color: '#3b82f6', dark: '#1e4a9c', alive: true, keys: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', fire: ['m', '/'] } },
    ];
    roundOver = 0;
    banner = '';
  }
  round();
  api.setScore(0, 'Green 0 - 0 Blue');

  function fire(i: number) {
    const t = tanks[i];
    if (!t.alive || shells.filter((s) => s.owner === i).length >= MAX_SHELLS) return;
    const sx = t.x + Math.cos(t.a) * (R + 3), sy = t.y + Math.sin(t.a) * (R + 3);
    if (hitsWall(sx, sy, 1)) return;
    shells.push({ x: sx, y: sy, vx: Math.cos(t.a) * 1.6, vy: Math.sin(t.a) * 1.6, life: SHELL_LIFE, owner: i });
    api.sound.blip();
  }

  return {
    update(dt) {
      if (roundOver > 0) {
        roundOver -= dt;
        if (roundOver <= 0) {
          if (scores[0] >= WIN || scores[1] >= WIN) {
            api.over(scores[0] >= WIN ? `Green wins ${scores[0]} - ${scores[1]}!` : `Blue wins ${scores[1]} - ${scores[0]}!`, true);
            return;
          }
          round();
        }
      }
      tanks.forEach((t, i) => {
        if (!t.alive) return;
        const k = t.keys;
        if (api.held.has(k.left)) t.a -= 0.06;
        if (api.held.has(k.right)) t.a += 0.06;
        const move = (api.held.has(k.up) ? 0.8 : 0) - (api.held.has(k.down) ? 0.6 : 0);
        if (move) {
          const nx = t.x + Math.cos(t.a) * move, ny = t.y + Math.sin(t.a) * move;
          if (!hitsWall(nx, t.y, R)) t.x = nx;
          if (!hitsWall(t.x, ny, R)) t.y = ny;
        }
        if (k.fire.some((f) => api.pressed(f))) fire(i);
      });
      for (const s of shells) {
        s.life -= dt;
        // Move in two half-steps per axis so fast shells can't tunnel through walls.
        for (let k = 0; k < 2; k++) {
          s.x += s.vx / 2;
          if (hitsWall(s.x, s.y, 1)) {
            s.x -= s.vx / 2;
            s.vx = -s.vx;
          }
          s.y += s.vy / 2;
          if (hitsWall(s.x, s.y, 1)) {
            s.y -= s.vy / 2;
            s.vy = -s.vy;
          }
        }
        tanks.forEach((t, i) => {
          if (t.alive && Math.hypot(t.x - s.x, t.y - s.y) < R + 1 && (s.owner !== i || s.life < SHELL_LIFE - 150)) {
            t.alive = false;
            s.life = 0;
            api.sound.bad();
          }
        });
      }
      shells = shells.filter((s) => s.life > 0);
      const alive = tanks.filter((t) => t.alive);
      if (roundOver <= 0 && alive.length < 2) {
        if (alive.length === 1) {
          const winner = tanks.indexOf(alive[0]);
          scores[winner]++;
          banner = winner === 0 ? 'GREEN SCORES' : 'BLUE SCORES';
          api.sound.good();
        } else {
          banner = 'DRAW';
        }
        api.setScore(scores[0], `Green ${scores[0]} - ${scores[1]} Blue`);
        roundOver = 1800;
      }
    },
    render() {
      ctx.fillStyle = '#c9c3b6';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#d8d2c5';
      for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if ((x + y) % 2) ctx.fillRect(x * CELL, TOP + y * CELL, CELL, CELL);
      ctx.fillStyle = '#1a1626';
      ctx.fillRect(0, 0, W, TOP);
      text(ctx, `GREEN ${scores[0]}`, 3, 2, '#3fb950');
      const blue = `BLUE ${scores[1]}`;
      text(ctx, blue, W - textWidth(blue) - 3, 2, '#7fb0ff');
      ctx.fillStyle = '#2a2233';
      for (const w of walls) ctx.fillRect(w.x, w.y, w.w, w.h);
      for (const t of tanks) {
        if (!t.alive) {
          ctx.fillStyle = '#5a5470';
          ctx.fillRect(t.x - 3, t.y - 3, 6, 6);
          ctx.fillStyle = '#f28c28';
          ctx.fillRect(t.x - 1, t.y - 1, 2, 2);
          continue;
        }
        ctx.fillStyle = t.dark;
        ctx.fillRect(Math.round(t.x) - R, Math.round(t.y) - R, R * 2, R * 2);
        ctx.fillStyle = t.color;
        ctx.fillRect(Math.round(t.x) - R + 1, Math.round(t.y) - R + 1, R * 2 - 2, R * 2 - 2);
        ctx.fillStyle = t.dark;
        for (let d = 1; d <= R + 3; d++) ctx.fillRect(Math.round(t.x + Math.cos(t.a) * d) - 1, Math.round(t.y + Math.sin(t.a) * d) - 1, 2, 2);
      }
      ctx.fillStyle = '#2a2233';
      for (const s of shells) ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 1, 2, 2);
      if (banner) {
        ctx.fillStyle = 'rgba(26,22,38,0.85)';
        ctx.fillRect(W / 2 - 40, H / 2 - 6, 80, 12);
        text(ctx, banner, W / 2 - textWidth(banner) / 2, H / 2 - 2, '#e8c547');
      }
    },
  };
}

const mod: GameModule = { width: W, height: H, pad: 'none', best: 'none', create };
export default mod;
