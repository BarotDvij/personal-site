// The arcade cabinet: one window that runs any game from the catalog.
// Handles input, the fixed-step loop, pause, restart, best scores, and
// on-screen controls. Loaded only when a visitor starts a game.

import { gameById, type GameInfo } from './catalog';
import type { Api, Game, GameModule } from './types';
import { sfx } from '../sfx';

const html = document.documentElement;
const win = document.querySelector<HTMLDialogElement>('.arcade-window')!;
const canvas = win.querySelector<HTMLCanvasElement>('.arcade-canvas')!;
const ctx = canvas.getContext('2d', { alpha: false })!;
const titleEl = win.querySelector<HTMLElement>('.arcade-title')!;
const scoreEl = win.querySelector<HTMLElement>('[data-score]')!;
const bestEl = win.querySelector<HTMLElement>('[data-best]')!;
const overlay = win.querySelector<HTMLElement>('.arcade-overlay')!;
const helpEl = win.querySelector<HTMLElement>('.arcade-help')!;
const creditEl = win.querySelector<HTMLElement>('.arcade-credit')!;
const pad = win.querySelector<HTMLElement>('.arcade-pad')!;
const pauseBtn = win.querySelector<HTMLButtonElement>('[data-arcade-pause]')!;

let info: GameInfo | null = null;
let mod: GameModule | null = null;
let game: Game | null = null;
let raf = 0;
let last = 0;
let acc = 0;
let paused = false;
let ended = false;
let score = 0;
let scale = 1;

const held = new Set<string>();
const fresh = new Set<string>();

const STEP = 1000 / 60;

function norm(key: string) {
  if (key === ' ' || key === 'Spacebar') return 'Space';
  return key.length === 1 ? key.toLowerCase() : key;
}

const bestKey = () => `dvij.best.${info?.id}`;
function readBest(): number | null {
  try {
    const v = localStorage.getItem(bestKey());
    return v === null ? null : Number(v);
  } catch {
    return null;
  }
}
function writeBest(v: number) {
  try {
    localStorage.setItem(bestKey(), String(v));
  } catch {
    // Storage blocked: best score lasts for this visit only.
  }
}

function showBest() {
  const b = mod?.best === 'none' ? null : readBest();
  bestEl.textContent = b === null ? '' : `Best ${b}`;
}

function showOverlay(message: string, hint: string) {
  overlay.innerHTML = `<p class="ov-title"></p><p class="ov-hint"></p>`;
  overlay.querySelector('.ov-title')!.textContent = message;
  overlay.querySelector('.ov-hint')!.textContent = hint;
  overlay.hidden = false;
}

const api: Api = {
  ctx,
  w: 0,
  h: 0,
  held,
  pressed: (k) => fresh.has(k),
  setScore(n, label) {
    score = n;
    scoreEl.textContent = label ?? String(n);
  },
  over(message, won = false) {
    if (ended) return;
    ended = true;
    if (mod && mod.best !== 'none') {
      const b = readBest();
      const better = mod.best === 'high' ? b === null || score > b : won && (b === null || score < b);
      if (better && (mod.best === 'high' ? score > 0 : won)) {
        writeBest(score);
        message += ' New best!';
      }
      showBest();
    }
    won ? sfx.coin() : sfx.close();
    showOverlay(message, 'Press Enter, or tap here, to play again.');
  },
  sound: {
    blip: () => sfx.tick(),
    good: () => sfx.coin(),
    bad: () => sfx.close(),
  },
  reduced: false,
};

function fit() {
  if (!mod) return;
  const availW = Math.min(window.innerWidth - 32, 900);
  const availH = window.innerHeight - (pad.offsetParent ? 330 : 210);
  scale = Math.max(1, Math.floor(Math.min(availW / mod.width, availH / mod.height)));
  canvas.style.width = `${mod.width * scale}px`;
  canvas.style.height = `${mod.height * scale}px`;
}

function start() {
  if (!mod) return;
  ended = false;
  paused = false;
  pauseBtn.textContent = 'Pause';
  overlay.hidden = true;
  held.clear();
  fresh.clear();
  api.setScore(0);
  api.reduced = html.dataset.motion === 'reduced';
  game = mod.create(api);
  game.render();
  run();
}

// The loop stops while paused or after game over, and restarts on resume
// or replay, so an idle game draws nothing.
function run() {
  cancelAnimationFrame(raf);
  last = 0;
  acc = 0;
  fresh.clear();
  raf = requestAnimationFrame(frame);
}

function frame(now: number) {
  if (!game || paused || ended) return;
  raf = requestAnimationFrame(frame);
  const dt = last ? Math.min(100, now - last) : STEP;
  last = now;
  acc += dt;
  while (acc >= STEP) {
    game.update(STEP);
    fresh.clear();
    acc -= STEP;
    if (ended) break;
  }
  game.render();
}

function togglePause(force?: boolean) {
  if (ended || !game) return;
  paused = force ?? !paused;
  pauseBtn.textContent = paused ? 'Resume' : 'Pause';
  if (paused) showOverlay('Paused', 'Press P, or tap here, to resume.');
  else {
    overlay.hidden = true;
    run();
  }
}

// ----- input -----

const GAME_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);

function onKeyDown(e: KeyboardEvent) {
  if (!win.open) return;
  const k = norm(e.key);
  if (k === 'Escape') return; // the dialog closes itself
  if (k === 'p' && !ended) {
    togglePause();
    e.preventDefault();
    return;
  }
  if (k === 'Enter' && ended) {
    start();
    e.preventDefault();
    return;
  }
  if (GAME_KEYS.has(k)) e.preventDefault();
  if (!held.has(k)) fresh.add(k);
  held.add(k);
}

function onKeyUp(e: KeyboardEvent) {
  held.delete(norm(e.key));
}

function toGame(e: PointerEvent) {
  const r = canvas.getBoundingClientRect();
  return [((e.clientX - r.left) / r.width) * (mod?.width ?? 1), ((e.clientY - r.top) / r.height) * (mod?.height ?? 1)];
}

let swipeStart: [number, number] | null = null;
canvas.addEventListener('pointerdown', (e) => {
  if (!game || paused || ended) return;
  const [x, y] = toGame(e);
  swipeStart = [e.clientX, e.clientY];
  game.pointer?.(x, y, e.button === 2 ? 'alt' : 'down');
});
canvas.addEventListener('pointermove', (e) => {
  if (!game || paused || ended) return;
  const [x, y] = toGame(e);
  game.pointer?.(x, y, 'move');
});
canvas.addEventListener('pointerup', (e) => {
  if (!game) return;
  const [x, y] = toGame(e);
  game.pointer?.(x, y, 'up');
  if (swipeStart && game.swipe) {
    const dx = e.clientX - swipeStart[0], dy = e.clientY - swipeStart[1];
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 24) {
      game.swipe(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : dy > 0 ? 'ArrowDown' : 'ArrowUp');
    }
  }
  swipeStart = null;
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// On-screen buttons feed the same key set as the keyboard.
for (const b of pad.querySelectorAll<HTMLElement>('[data-key]')) {
  const k = b.dataset.key!;
  const down = (e: Event) => {
    e.preventDefault();
    if (ended && (k === 'Space' || k === 'Enter')) return start();
    if (!held.has(k)) fresh.add(k);
    held.add(k);
  };
  const up = () => held.delete(k);
  b.addEventListener('pointerdown', down);
  b.addEventListener('pointerup', up);
  b.addEventListener('pointerleave', up);
  b.addEventListener('pointercancel', up);
}

overlay.addEventListener('click', () => (ended ? start() : togglePause(false)));
pauseBtn.addEventListener('click', () => togglePause());
win.querySelector('[data-arcade-restart]')!.addEventListener('click', () => start());
win.querySelector('[data-arcade-close]')!.addEventListener('click', () => win.close());

win.addEventListener('close', () => {
  cancelAnimationFrame(raf);
  game = null;
  document.removeEventListener('keydown', onKeyDown, true);
  document.removeEventListener('keyup', onKeyUp, true);
  window.removeEventListener('resize', fit);
  delete html.dataset.arcade;
  document.dispatchEvent(new CustomEvent('arcade:close'));
});

// ----- open -----

export async function openGame(id: string) {
  const next = gameById(id);
  if (!next) return;
  info = next;
  titleEl.textContent = next.title;
  helpEl.textContent = next.help;
  creditEl.textContent = next.credit;
  overlay.hidden = true;
  if (!win.open) win.showModal();
  html.dataset.arcade = 'open';
  document.dispatchEvent(new CustomEvent('arcade:open'));
  showOverlay('Loading', '');

  mod = (await next.load()).default;
  if (info !== next || !win.open) return;
  api.w = canvas.width = mod.width;
  api.h = canvas.height = mod.height;
  ctx.imageSmoothingEnabled = false;
  pad.dataset.pad = mod.pad;
  fit();
  showBest();
  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('keyup', onKeyUp, true);
  window.addEventListener('resize', fit);
  sfx.start();
  start();
}
