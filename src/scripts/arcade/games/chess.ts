// Chess with full rules (castling, en passant, promotion, check, mate,
// stalemate). Two players on one device, or play the city: a small
// alpha-beta search that thinks three moves ahead.

import type { Api, Game, GameModule } from '../types';
import { text, textWidth } from '../../pixelfont';

const S = 16;
const TOP = 12;
const W = S * 8;
const H = S * 8 + TOP;

type Color = 'w' | 'b';
type Kind = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K';
type Sq = `${Color}${Kind}` | null;
interface Move { from: number; to: number; promo?: Kind; ep?: boolean; castle?: number }
interface State { board: Sq[]; turn: Color; castle: string; ep: number }

const VALUE: Record<Kind, number> = { P: 100, N: 310, B: 330, R: 500, Q: 900, K: 0 };
const N_STEPS = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
const K_STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const ROOK = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const BISHOP = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

const SPRITES: Record<Kind, string[]> = {
  P: ['..........', '....##....', '...####...', '...####...', '....##....', '...####...', '....##....', '...####...', '..######..', '..######..'],
  R: ['..#.##.#..', '..######..', '..######..', '...####...', '...####...', '...####...', '...####...', '..######..', '.########.', '.########.'],
  N: ['....##....', '...####...', '..######..', '.###.###..', '.##..###..', '.....###..', '....####..', '...#####..', '..######..', '.########.'],
  B: ['.....#....', '....###...', '...##.##..', '...###.#..', '...#####..', '....###...', '....###...', '...#####..', '..#######.', '..#######.'],
  Q: ['.#..##..#.', '.##.##.##.', '.########.', '..######..', '..######..', '...####...', '...####...', '..######..', '.########.', '.########.'],
  K: ['....##....', '...####...', '....##....', '..######..', '.########.', '.########.', '..######..', '...####...', '..######..', '.########.'],
};

const xy = (i: number) => [i % 8, Math.floor(i / 8)];
const at = (x: number, y: number) => (x >= 0 && y >= 0 && x < 8 && y < 8 ? y * 8 + x : -1);
const other = (c: Color): Color => (c === 'w' ? 'b' : 'w');

function initial(): State {
  const back: Kind[] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  const board: Sq[] = Array(64).fill(null);
  back.forEach((k, x) => {
    board[at(x, 0)] = `b${k}`;
    board[at(x, 7)] = `w${k}`;
    board[at(x, 1)] = 'bP';
    board[at(x, 6)] = 'wP';
  });
  return { board, turn: 'w', castle: 'KQkq', ep: -1 };
}

function attacked(board: Sq[], sq: number, by: Color): boolean {
  const [x, y] = xy(sq);
  const dir = by === 'w' ? 1 : -1;
  for (const dx of [-1, 1]) if (board[at(x + dx, y + dir)] === `${by}P`) return true;
  for (const [dx, dy] of N_STEPS) if (board[at(x + dx, y + dy)] === `${by}N`) return true;
  for (const [dx, dy] of K_STEPS) if (board[at(x + dx, y + dy)] === `${by}K`) return true;
  const ray = (dirs: number[][], kinds: string) => {
    for (const [dx, dy] of dirs) {
      let cx = x + dx, cy = y + dy;
      while (at(cx, cy) >= 0) {
        const p = board[at(cx, cy)];
        if (p) {
          if (p[0] === by && kinds.includes(p[1])) return true;
          break;
        }
        cx += dx;
        cy += dy;
      }
    }
    return false;
  };
  return ray(ROOK, 'RQ') || ray(BISHOP, 'BQ');
}

function pseudo(s: State): Move[] {
  const moves: Move[] = [];
  const { board, turn } = s;
  board.forEach((p, i) => {
    if (!p || p[0] !== turn) return;
    const [x, y] = xy(i);
    const add = (to: number, extra: Partial<Move> = {}) => {
      if (to < 0) return false;
      const q = board[to];
      if (q && q[0] === turn) return false;
      moves.push({ from: i, to, ...extra });
      return !q;
    };
    switch (p[1] as Kind) {
      case 'P': {
        const dir = turn === 'w' ? -1 : 1;
        const startRow = turn === 'w' ? 6 : 1;
        const lastRow = turn === 'w' ? 0 : 7;
        const one = at(x, y + dir);
        if (one >= 0 && !board[one]) {
          moves.push({ from: i, to: one, promo: y + dir === lastRow ? 'Q' : undefined });
          const two = at(x, y + 2 * dir);
          if (y === startRow && !board[two]) moves.push({ from: i, to: two });
        }
        for (const dx of [-1, 1]) {
          const to = at(x + dx, y + dir);
          if (to < 0) continue;
          if (board[to] && board[to]![0] !== turn) moves.push({ from: i, to, promo: y + dir === lastRow ? 'Q' : undefined });
          if (to === s.ep) moves.push({ from: i, to, ep: true });
        }
        break;
      }
      case 'N':
        for (const [dx, dy] of N_STEPS) add(at(x + dx, y + dy));
        break;
      case 'K': {
        for (const [dx, dy] of K_STEPS) add(at(x + dx, y + dy));
        const row = turn === 'w' ? 7 : 0;
        const [kSide, qSide] = turn === 'w' ? ['K', 'Q'] : ['k', 'q'];
        const enemy = other(turn);
        if (y === row && x === 4 && !attacked(board, i, enemy)) {
          if (s.castle.includes(kSide) && !board[at(5, row)] && !board[at(6, row)] && !attacked(board, at(5, row), enemy))
            moves.push({ from: i, to: at(6, row), castle: 1 });
          if (s.castle.includes(qSide) && !board[at(3, row)] && !board[at(2, row)] && !board[at(1, row)] && !attacked(board, at(3, row), enemy))
            moves.push({ from: i, to: at(2, row), castle: -1 });
        }
        break;
      }
      default: {
        const dirs = p[1] === 'R' ? ROOK : p[1] === 'B' ? BISHOP : [...ROOK, ...BISHOP];
        for (const [dx, dy] of dirs) {
          let cx = x + dx, cy = y + dy;
          while (add(at(cx, cy))) {
            cx += dx;
            cy += dy;
          }
        }
      }
    }
  });
  return moves;
}

function apply(s: State, m: Move): State {
  const board = s.board.slice();
  const p = board[m.from]!;
  board[m.to] = m.promo ? (`${s.turn}${m.promo}` as Sq) : p;
  board[m.from] = null;
  if (m.ep) board[m.to + (s.turn === 'w' ? 8 : -8)] = null;
  if (m.castle) {
    const row = s.turn === 'w' ? 7 : 0;
    const [rf, rt] = m.castle === 1 ? [7, 5] : [0, 3];
    board[at(rt, row)] = board[at(rf, row)];
    board[at(rf, row)] = null;
  }
  let castle = s.castle;
  const strip = (sq: number) => {
    if (sq === 60) castle = castle.replace(/[KQ]/g, '');
    if (sq === 4) castle = castle.replace(/[kq]/g, '');
    if (sq === 63) castle = castle.replace('K', '');
    if (sq === 56) castle = castle.replace('Q', '');
    if (sq === 7) castle = castle.replace('k', '');
    if (sq === 0) castle = castle.replace('q', '');
  };
  strip(m.from);
  strip(m.to);
  const ep = p[1] === 'P' && Math.abs(m.to - m.from) === 16 ? (m.from + m.to) / 2 : -1;
  return { board, turn: other(s.turn), castle, ep };
}

function legal(s: State): Move[] {
  return pseudo(s).filter((m) => {
    const next = apply(s, m);
    const king = next.board.indexOf(`${s.turn}K`);
    return !attacked(next.board, king, next.turn);
  });
}

function inCheck(s: State) {
  return attacked(s.board, s.board.indexOf(`${s.turn}K`), other(s.turn));
}

// Material plus a nudge toward the center, from white's point of view.
function evaluate(s: State): number {
  let score = 0;
  s.board.forEach((p, i) => {
    if (!p) return;
    const [x, y] = xy(i);
    const center = p[1] === 'K' ? 0 : 6 - (Math.abs(3.5 - x) + Math.abs(3.5 - y)) * 1.5;
    const advance = p[1] === 'P' ? (p[0] === 'w' ? 6 - y : y - 1) * 4 : 0;
    const v = VALUE[p[1] as Kind] + center + advance;
    score += p[0] === 'w' ? v : -v;
  });
  return score;
}

function search(s: State, depth: number, alpha: number, beta: number): number {
  const moves = legal(s);
  if (!moves.length) return inCheck(s) ? (s.turn === 'w' ? -100000 - depth : 100000 + depth) : 0;
  if (depth === 0) return evaluate(s);
  moves.sort((a, b) => (s.board[b.to] ? VALUE[s.board[b.to]![1] as Kind] : 0) - (s.board[a.to] ? VALUE[s.board[a.to]![1] as Kind] : 0));
  if (s.turn === 'w') {
    let best = -Infinity;
    for (const m of moves) {
      best = Math.max(best, search(apply(s, m), depth - 1, alpha, beta));
      alpha = Math.max(alpha, best);
      if (alpha >= beta) break;
    }
    return best;
  }
  let best = Infinity;
  for (const m of moves) {
    best = Math.min(best, search(apply(s, m), depth - 1, alpha, beta));
    beta = Math.min(beta, best);
    if (alpha >= beta) break;
  }
  return best;
}

function bestMove(s: State): Move {
  const moves = legal(s);
  let best = moves[0], bestScore = Infinity;
  for (const m of moves.sort(() => Math.random() - 0.5)) {
    const v = search(apply(s, m), 2, -Infinity, Infinity);
    if (v < bestScore) {
      bestScore = v;
      best = m;
    }
  }
  return best;
}

function create(api: Api): Game {
  const { ctx } = api;
  let state = initial();
  let selected = -1;
  let options: Move[] = [];
  let lastMove: Move | null = null;
  let vsCity = true;
  let thinking = false;
  let done = false;

  function finishTurn() {
    const moves = legal(state);
    if (!moves.length) {
      done = true;
      if (inCheck(state)) {
        const winner = state.turn === 'w' ? 'Black' : 'White';
        api.over(`Checkmate. ${winner} wins!`, vsCity ? winner === 'White' : true);
      } else {
        api.over('Stalemate. A draw.');
      }
      return;
    }
    api.setScore(0, state.turn === 'w' ? 'White to move' : vsCity ? 'The city is thinking' : 'Black to move');
    if (vsCity && state.turn === 'b') {
      thinking = true;
      // Let the board repaint before the search runs.
      setTimeout(() => {
        if (done) return;
        const m = bestMove(state);
        state = apply(state, m);
        lastMove = m;
        thinking = false;
        api.sound.blip();
        finishTurn();
      }, 60);
    }
  }

  function play(m: Move) {
    state = apply(state, m);
    lastMove = m;
    selected = -1;
    options = [];
    api.sound.blip();
    finishTurn();
  }

  api.setScore(0, 'White to move');

  return {
    update() {
      if (api.pressed('c') && !thinking) {
        vsCity = !vsCity;
        finishTurn();
      }
    },
    pointer(px, py, kind) {
      if (kind !== 'down' || done || thinking) return;
      if (py < TOP) {
        if (px > W - 54) {
          vsCity = !vsCity;
          finishTurn();
        }
        return;
      }
      if (vsCity && state.turn === 'b') return;
      const sq = at(Math.floor(px / S), Math.floor((py - TOP) / S));
      if (sq < 0) return;
      const move = options.find((m) => m.to === sq);
      if (move) return play(move);
      const p = state.board[sq];
      if (p && p[0] === state.turn) {
        selected = sq;
        options = legal(state).filter((m) => m.from === sq);
      } else {
        selected = -1;
        options = [];
      }
    },
    render() {
      ctx.fillStyle = '#1a1626';
      ctx.fillRect(0, 0, W, H);
      text(ctx, state.turn === 'w' ? 'WHITE' : 'BLACK', 3, 3, '#e8c547');
      const mode = vsCity ? 'VS CITY' : '2 PLAYER';
      ctx.fillStyle = '#3d3560';
      ctx.fillRect(W - 54, 1, 53, 10);
      text(ctx, mode, W - 27 - Math.floor(textWidth(mode) / 2), 3, '#ffffff');
      const kingInCheck = inCheck(state) ? state.board.indexOf(`${state.turn}K`) : -1;
      for (let i = 0; i < 64; i++) {
        const [x, y] = xy(i);
        const px = x * S, py = TOP + y * S;
        ctx.fillStyle = (x + y) % 2 ? '#a8794a' : '#ead7ac';
        if (lastMove && (i === lastMove.from || i === lastMove.to)) ctx.fillStyle = (x + y) % 2 ? '#b8a043' : '#e9df8a';
        if (i === selected) ctx.fillStyle = '#e8c547';
        if (i === kingInCheck) ctx.fillStyle = '#e0457b';
        ctx.fillRect(px, py, S, S);
        const p = state.board[i];
        if (p) {
          const sprite = SPRITES[p[1] as Kind];
          const body = p[0] === 'w' ? '#fff7e6' : '#1a1626';
          const edge = p[0] === 'w' ? '#2a2233' : '#0a0810';
          for (const [color, offsets] of [
            [edge, [[-1, 0], [1, 0], [0, -1], [0, 1]]],
            [body, [[0, 0]]],
          ] as const) {
            ctx.fillStyle = color;
            for (const [ox, oy] of offsets)
              sprite.forEach((row, sy) => {
                for (let sx = 0; sx < 10; sx++) if (row[sx] === '#') ctx.fillRect(px + 3 + sx + ox, py + 3 + sy + oy, 1, 1);
              });
          }
        }
        if (options.some((m) => m.to === i)) {
          ctx.fillStyle = '#9bd23c';
          ctx.fillRect(px + 6, py + 6, 4, 4);
        }
      }
    },
  };
}

const mod: GameModule = { width: W, height: H, pad: 'none', best: 'none', create };
export default mod;
