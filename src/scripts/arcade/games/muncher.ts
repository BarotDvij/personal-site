// Pipe Muncher: eat every packet in the pipe network and dodge the bugs.
// Power cells turn the tables for a few seconds.

import type { Api, Game, GameModule } from '../types';
import { text } from '../../pixelfont';

const MAP = [
  '###################',
  '#........#........#',
  '#.##.###.#.###.##.#',
  '#o...............o#',
  '#.##.#.#####.#.##.#',
  '#....#...#...#....#',
  '####.###.#.###.####',
  '####.#.......#.####',
  '####.#.##G##.#.####',
  '####...#GGG#...####',
  '####.#.#####.#.####',
  '#o.......#.......o#',
  '#.##.###.#.###.##.#',
  '#........P........#',
  '###################',
];
const T = 8;
const COLS = MAP[0].length;
const ROWS = MAP.length;
const TOP = 10;
const W = COLS * T;
const H = ROWS * T + TOP;

type Dir = [number, number];
const DIRS: Record<string, Dir> = {
  ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0],
};
const BUG_COLORS = ['#e0457b', '#22b8cf', '#f2a33a'];

interface Mover { x: number; y: number; dir: Dir; speed: number; acc: number }
interface Bug extends Mover { color: string; state: 'chase' | 'scared' | 'eaten'; home: [number, number] }

function create(api: Api): Game {
  const { ctx } = api;
  const dots = new Map<number, 'dot' | 'power'>();
  let start: [number, number] = [9, 13];
  MAP.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '.') dots.set(y * COLS + x, 'dot');
      if (ch === 'o') dots.set(y * COLS + x, 'power');
      if (ch === 'P') start = [x, y];
    }),
  );
  const total = dots.size;

  let level = 1;
  let lives = 3;
  let score = 0;
  let scared = 0;
  let t = 0;
  let pauseFor = 900;
  let want: Dir = [0, 0];
  let you: Mover;
  let bugs: Bug[] = [];
  let combo = 0;

  const wall = (x: number, y: number, isBug: boolean) => {
    const ch = MAP[y]?.[x];
    if (ch === undefined) return true;
    return ch === '#' || (!isBug && ch === 'G');
  };

  function reset() {
    you = { x: start[0] * T, y: start[1] * T, dir: [0, 0], speed: 0.9 + level * 0.05, acc: 0 };
    want = [0, 0];
    bugs = BUG_COLORS.map((color, i) => ({
      x: (8 + i) * T, y: 9 * T, dir: [0, -1] as Dir, speed: 0.7 + level * 0.06, acc: 0, color, state: 'chase' as const, home: [8 + i, 9] as [number, number],
    }));
    scared = 0;
    pauseFor = 900;
  }
  reset();

  const aligned = (m: Mover) => m.x % T === 0 && m.y % T === 0;
  const tile = (m: Mover) => [Math.round(m.x / T), Math.round(m.y / T)];

  // Actors move in whole-pixel steps so they always land exactly on tile
  // centers, where turns are decided.
  function moveStep(m: Mover, isBug: boolean) {
    m.acc += m.speed;
    while (m.acc >= 1) {
      m.acc -= 1;
      if (aligned(m)) {
        const [tx, ty] = tile(m);
        if (!isBug && (want[0] || want[1]) && !wall(tx + want[0], ty + want[1], false)) m.dir = want;
        if (isBug) chooseBugDir(m as Bug, tx, ty);
        if (wall(tx + m.dir[0], ty + m.dir[1], isBug)) {
          m.acc = 0;
          return;
        }
      }
      m.x += m.dir[0];
      m.y += m.dir[1];
    }
  }

  function chooseBugDir(b: Bug, tx: number, ty: number) {
    const options = ([[0, -1], [-1, 0], [0, 1], [1, 0]] as Dir[]).filter(
      (d) => !wall(tx + d[0], ty + d[1], true) && !(d[0] === -b.dir[0] && d[1] === -b.dir[1]),
    );
    if (!options.length) {
      b.dir = [-b.dir[0], -b.dir[1]];
      return;
    }
    if (b.state === 'scared' && Math.random() < 0.8) {
      b.dir = options[Math.floor(Math.random() * options.length)];
      return;
    }
    const [yx, yy] = tile(you);
    const inPen = MAP[ty][tx] === 'G';
    const target =
      b.state === 'eaten' ? b.home : inPen ? [9, 7] : Math.random() < 0.15 ? [Math.random() * COLS, Math.random() * ROWS] : [yx, yy];
    options.sort((a, c) => Math.hypot(tx + a[0] - target[0], ty + a[1] - target[1]) - Math.hypot(tx + c[0] - target[0], ty + c[1] - target[1]));
    b.dir = b.state === 'scared' ? options[options.length - 1] : options[0];
    if (b.state === 'eaten' && tx === b.home[0] && ty === b.home[1]) {
      b.state = 'chase';
      b.speed = 0.7 + level * 0.06;
    }
  }

  function eat() {
    const [tx, ty] = tile(you);
    const key = ty * COLS + tx;
    const d = dots.get(key);
    if (!d) return;
    dots.delete(key);
    score += d === 'power' ? 50 : 10;
    api.setScore(score);
    if (d === 'power') {
      scared = 6000;
      combo = 0;
      for (const b of bugs) if (b.state !== 'eaten') { b.state = 'scared'; b.dir = [-b.dir[0], -b.dir[1]]; }
      api.sound.good();
    } else if (dots.size % 4 === 0) {
      api.sound.blip();
    }
    if (!dots.size) {
      level++;
      MAP.forEach((row, y) => [...row].forEach((ch, x) => {
        if (ch === '.') dots.set(y * COLS + x, 'dot');
        if (ch === 'o') dots.set(y * COLS + x, 'power');
      }));
      api.sound.good();
      reset();
    }
  }

  return {
    update(dt) {
      t += dt;
      for (const k of Object.keys(DIRS)) if (api.held.has(k)) want = DIRS[k];
      if (pauseFor > 0) {
        pauseFor -= dt;
        return;
      }
      if (you.dir[0] === 0 && you.dir[1] === 0 && (want[0] || want[1])) {
        const [tx, ty] = tile(you);
        if (!wall(tx + want[0], ty + want[1], false)) you.dir = want;
      }
      moveStep(you, false);
      eat();
      if (scared > 0) {
        scared -= dt;
        if (scared <= 0) for (const b of bugs) if (b.state === 'scared') b.state = 'chase';
      }
      for (const b of bugs) {
        b.speed = b.state === 'eaten' ? 2 : b.state === 'scared' ? 0.5 : 0.7 + level * 0.06;
        moveStep(b, true);
        if (Math.hypot(b.x - you.x, b.y - you.y) < 6) {
          if (b.state === 'scared') {
            b.state = 'eaten';
            combo++;
            score += 200 * combo;
            api.setScore(score);
            api.sound.good();
          } else if (b.state === 'chase') {
            lives--;
            api.sound.bad();
            if (lives <= 0) {
              api.over(`Caught! ${score} points, level ${level}.`);
              return;
            }
            reset();
            return;
          }
        }
      }
    },
    swipe(d) {
      want = DIRS[d];
    },
    render() {
      ctx.fillStyle = '#120f1e';
      ctx.fillRect(0, 0, W, H);
      text(ctx, `LIVES ${lives}`, 2, 2, '#e8c547');
      text(ctx, `LEVEL ${level}`, W - 34, 2, '#e8c547');
      text(ctx, `${total - dots.size}/${total}`, W / 2 - 12, 2, '#b8b2cf');
      MAP.forEach((row, y) =>
        [...row].forEach((ch, x) => {
          const px = x * T, py = TOP + y * T;
          if (ch === '#') {
            ctx.fillStyle = '#7a3f1c';
            ctx.fillRect(px, py, T, T);
            ctx.fillStyle = '#c8743a';
            ctx.fillRect(px + 1, py + 1, T - 2, T - 2);
          } else if (ch === 'G' && y === 8) {
            ctx.fillStyle = '#e0457b';
            ctx.fillRect(px, py + 3, T, 2);
          }
          const d = dots.get(y * COLS + x);
          if (d === 'dot') {
            ctx.fillStyle = '#f6efd0';
            ctx.fillRect(px + 3, py + 3, 2, 2);
          } else if (d === 'power' && (api.reduced || Math.floor(t / 250) % 2)) {
            ctx.fillStyle = '#9bd23c';
            ctx.fillRect(px + 1, py + 1, 6, 6);
          }
        }),
      );
      // The muncher: a packet that chomps toward its direction.
      const mouth = !api.reduced && Math.floor(t / 120) % 2;
      const yx = Math.round(you.x), yy = Math.round(you.y) + TOP;
      ctx.fillStyle = '#e8c547';
      ctx.fillRect(yx + 1, yy + 1, 6, 6);
      if (mouth) {
        ctx.fillStyle = '#120f1e';
        const [dx, dy] = you.dir[0] || you.dir[1] ? you.dir : [1, 0];
        ctx.fillRect(yx + 3 + dx * 2, yy + 3 + dy * 2, 2 + Math.abs(dx) * 2, 2 + Math.abs(dy) * 2);
      }
      for (const b of bugs) {
        const bx = Math.round(b.x), by = Math.round(b.y) + TOP;
        if (b.state === 'eaten') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bx + 2, by + 3, 1, 1);
          ctx.fillRect(bx + 5, by + 3, 1, 1);
          continue;
        }
        const blink = b.state === 'scared' && scared < 1500 && Math.floor(t / 150) % 2;
        ctx.fillStyle = b.state === 'scared' ? (blink ? '#ffffff' : '#3b4cc0') : b.color;
        ctx.fillRect(bx + 1, by + 2, 6, 5);
        ctx.fillRect(bx + 2, by + 1, 4, 1);
        ctx.fillRect(bx, by + 4, 1, 1);
        ctx.fillRect(bx + 7, by + 4, 1, 1);
        ctx.fillRect(bx + 1, by + 7, 1, 1);
        ctx.fillRect(bx + 6, by + 7, 1, 1);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx + 2, by + 3, 1, 1);
        ctx.fillRect(bx + 5, by + 3, 1, 1);
      }
      if (pauseFor > 0) text(ctx, 'READY', W / 2 - 9, TOP + 7 * T + 2, '#e8c547');
    },
  };
}

const mod: GameModule = { width: W, height: H, pad: 'dpad', best: 'high', create };
export default mod;
