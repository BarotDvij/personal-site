// Block Stack: falling-block puzzle with the features competitive players
// expect: 7-bag randomizer, hold, next queue, ghost piece, wall kicks,
// lock delay, and DAS/ARR for sideways movement.

import type { Api, Game, GameModule } from '../types';
import { text } from '../../pixelfont';

const COLS = 10;
const ROWS = 20;
const C = 6;
const BX = 36;
const BY = 4;
const W = 132;
const H = ROWS * C + 8;

type Piece = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
const SHAPES: Record<Piece, number[][]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
};
const COLORS: Record<Piece, string> = {
  I: '#22b8cf', O: '#e8c547', T: '#9b6bf2', S: '#3fb950', Z: '#e0457b', J: '#3b82f6', L: '#f2a33a',
};
const KICKS = [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0], [0, 1]];
const DAS = 150;
const ARR = 40;
const LOCK = 500;

function create(api: Api): Game {
  const { ctx } = api;
  const grid: (Piece | null)[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  let bag: Piece[] = [];
  const queue: Piece[] = [];
  let cur: Piece = 'T';
  let cells: number[][] = [];
  let px = 0, py = 0;
  let hold: Piece | null = null;
  let held = false;
  let fall = 0;
  let lock = 0;
  let lockMoves = 0;
  let lines = 0;
  let score = 0;
  let dasDir = 0, dasTime = 0, arrTime = 0;
  let flash = 0;

  const level = () => Math.floor(lines / 10) + 1;
  const gravity = () => Math.max(60, 800 - (level() - 1) * 70);

  function nextFromBag(): Piece {
    if (!bag.length) {
      bag = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    }
    return bag.pop()!;
  }

  const fits = (shape: number[][], x: number, y: number) =>
    shape.every(([cx, cy]) => {
      const gx = x + cx, gy = y + cy;
      return gx >= 0 && gx < COLS && gy < ROWS && (gy < 0 || !grid[gy][gx]);
    });

  function spawn(p: Piece) {
    cur = p;
    cells = SHAPES[p].map((c) => [...c]);
    px = 3;
    py = -1;
    fall = 0;
    lock = 0;
    lockMoves = 0;
    if (!fits(cells, px, py)) {
      api.over(`Topped out. ${lines} lines, ${score} points.`);
    }
  }

  function next() {
    while (queue.length < 4) queue.push(nextFromBag());
    spawn(queue.shift()!);
    queue.push(nextFromBag());
  }

  function rotate(dir: 1 | -1) {
    if (cur === 'O') return;
    const size = cur === 'I' ? 4 : 3;
    const rotated = cells.map(([x, y]) => (dir === 1 ? [size - 1 - y, x] : [y, size - 1 - x]));
    for (const [kx, ky] of KICKS) {
      if (fits(rotated, px + kx, py + ky)) {
        cells = rotated;
        px += kx;
        py += ky;
        bumpLock();
        api.sound.blip();
        return;
      }
    }
  }

  function bumpLock() {
    if (lock > 0 && lockMoves < 15) {
      lock = 0;
      lockMoves++;
    }
  }

  function shift(dx: number) {
    if (fits(cells, px + dx, py)) {
      px += dx;
      bumpLock();
      return true;
    }
    return false;
  }

  function place() {
    for (const [cx, cy] of cells) {
      if (py + cy < 0) {
        api.over(`Topped out. ${lines} lines, ${score} points.`);
        return;
      }
      grid[py + cy][px + cx] = cur;
    }
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (grid[y].every(Boolean)) {
        grid.splice(y, 1);
        grid.unshift(Array(COLS).fill(null));
        cleared++;
        y++;
      }
    }
    if (cleared) {
      score += [0, 100, 300, 500, 800][cleared] * level();
      lines += cleared;
      flash = 200;
      cleared === 4 ? api.sound.good() : api.sound.blip();
    }
    api.setScore(score);
    held = false;
    next();
  }

  function ghostY() {
    let y = py;
    while (fits(cells, px, y + 1)) y++;
    return y;
  }

  next();

  return {
    update(dt) {
      if (flash > 0) flash -= dt;
      // Sideways movement with DAS (delay before repeat) and ARR (repeat rate)
      const left = api.held.has('ArrowLeft') || api.held.has('a');
      const right = api.held.has('ArrowRight') || api.held.has('d');
      const dir = left && !right ? -1 : right && !left ? 1 : 0;
      if (dir !== dasDir) {
        dasDir = dir;
        dasTime = 0;
        arrTime = 0;
        if (dir) shift(dir);
      } else if (dir) {
        dasTime += dt;
        if (dasTime >= DAS) {
          arrTime += dt;
          while (arrTime >= ARR) {
            arrTime -= ARR;
            if (!shift(dir)) break;
          }
        }
      }
      if (api.pressed('ArrowUp') || api.pressed('x') || api.pressed('w')) rotate(1);
      if (api.pressed('z')) rotate(-1);
      if ((api.pressed('c') || api.pressed('Shift')) && !held) {
        const swap = hold;
        hold = cur;
        held = true;
        swap ? spawn(swap) : next();
        held = true;
      }
      if (api.pressed('Space')) {
        const y = ghostY();
        score += (y - py) * 2;
        py = y;
        place();
        return;
      }
      const soft = api.held.has('ArrowDown') || api.held.has('s');
      fall += soft ? dt * 20 : dt;
      const g = gravity();
      while (fall >= g) {
        fall -= g;
        if (fits(cells, px, py + 1)) {
          py++;
          if (soft) score += 1;
        }
      }
      if (!fits(cells, px, py + 1)) {
        lock += dt;
        if (lock >= LOCK) place();
      } else {
        lock = 0;
      }
    },
    render() {
      ctx.fillStyle = '#1a1626';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = flash > 0 ? '#3d3560' : '#120f1e';
      ctx.fillRect(BX - 1, BY - 1, COLS * C + 2, ROWS * C + 2);
      const block = (gx: number, gy: number, color: string, ox = BX, oy = BY, size = C) => {
        ctx.fillStyle = color;
        ctx.fillRect(ox + gx * size, oy + gy * size, size - 1, size - 1);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(ox + gx * size, oy + gy * size, size - 1, 1);
      };
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (grid[y][x]) block(x, y, COLORS[grid[y][x]!]);
      // Ghost piece
      const gy = ghostY();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (const [cx, cy] of cells) if (gy + cy >= 0) ctx.fillRect(BX + (px + cx) * C, BY + (gy + cy) * C, C - 1, C - 1);
      for (const [cx, cy] of cells) if (py + cy >= 0) block(px + cx, py + cy, COLORS[cur]);
      // Hold and next
      text(ctx, 'HOLD', 4, 4, '#e8c547');
      if (hold) for (const [cx, cy] of SHAPES[hold]) block(cx, cy, held ? '#5a5470' : COLORS[hold], 4, 12, 6);
      text(ctx, 'NEXT', BX + COLS * C + 6, 4, '#e8c547');
      queue.slice(0, 3).forEach((p, i) => {
        for (const [cx, cy] of SHAPES[p]) block(cx, cy, COLORS[p], BX + COLS * C + 6, 12 + i * 16, 5);
      });
      text(ctx, 'LINES', 4, 40, '#b8b2cf');
      text(ctx, String(lines), 4, 47, '#ffffff');
      text(ctx, 'LEVEL', 4, 58, '#b8b2cf');
      text(ctx, String(level()), 4, 65, '#ffffff');
    },
  };
}

const mod: GameModule = { width: W, height: H, pad: 'dpad-ab', best: 'high', create };
export default mod;
