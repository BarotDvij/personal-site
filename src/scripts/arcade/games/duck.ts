// Duck Flight: one training run from the flying challenge. Flap to stay up,
// dodge storm clouds, and grab seeds for bonus distance.

import type { Api, Game, GameModule } from '../types';
import { text, textWidth } from '../../pixelfont';

const W = 160;
const H = 112;
const GROUND = H - 12;

interface Thing { x: number; y: number; w: number; h: number; kind: 'cloud' | 'seed'; taken?: boolean }

function create(api: Api): Game {
  const { ctx } = api;
  let y = H / 2;
  let vy = 0;
  let dist = 0;
  let seeds = 0;
  let speed = 1.1;
  let spawn = 0;
  let t = 0;
  let flapping = false;
  let started = false;
  const things: Thing[] = [];

  const score = () => Math.floor(dist / 10) + seeds * 5;

  function addWave() {
    const gap = 34 - Math.min(12, dist / 900);
    const gapY = 16 + Math.random() * (GROUND - 32 - gap);
    if (gapY > 22) things.push({ x: W + 4, y: Math.max(4, gapY - 22), w: 22, h: 14, kind: 'cloud' });
    if (gapY + gap < GROUND - 14) things.push({ x: W + 10, y: gapY + gap, w: 22, h: 14, kind: 'cloud' });
    things.push({ x: W + 12 + Math.random() * 20, y: gapY + gap / 2 - 2, w: 4, h: 4, kind: 'seed' });
  }

  return {
    update(dt) {
      t += dt;
      const flap = flapping || api.held.has('Space') || api.held.has('ArrowUp') || api.held.has('w');
      if (!started) {
        if (!flap) return;
        started = true;
      }
      vy += flap ? -0.16 : 0.12;
      vy = Math.max(-1.8, Math.min(2, vy));
      y += vy;
      if (y < 4) { y = 4; vy = 0; }
      dist += speed;
      speed = Math.min(2.6, 1.1 + dist / 4000);
      spawn -= speed;
      if (spawn <= 0) {
        addWave();
        spawn = 70;
      }
      for (const th of things) th.x -= speed;
      while (things.length && things[0].x < -30) things.shift();
      for (const th of things) {
        const hit = 26 < th.x + th.w && 26 + 10 > th.x && y < th.y + th.h && y + 7 > th.y;
        if (!hit) continue;
        if (th.kind === 'seed' && !th.taken) {
          th.taken = true;
          seeds++;
          api.sound.blip();
        } else if (th.kind === 'cloud') {
          api.over(`Flew ${score()} points before the storm got you.`);
          return;
        }
      }
      if (y > GROUND - 8) {
        api.over(`Splashdown! ${score()} points.`);
        return;
      }
      api.setScore(score());
    },
    pointer(_x, _y, kind) {
      if (kind === 'down') flapping = true;
      if (kind === 'up') flapping = false;
    },
    render() {
      const sky = ['#86bbf2', '#a5cff6', '#c6e2f8'];
      sky.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(0, (i * GROUND) / 3, W, GROUND / 3 + 1);
      });
      // Distant hills scroll slowly
      ctx.fillStyle = '#7cb36a';
      for (let i = 0; i < 6; i++) {
        const hx = ((i * 40 - dist * 0.2) % 240 + 240) % 240 - 40;
        ctx.fillRect(hx, GROUND - 10, 36, 10);
        ctx.fillRect(hx + 6, GROUND - 14, 24, 4);
      }
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = '#7fb0ff';
      for (let x = (-dist * 0.8) % 12; x < W; x += 12) ctx.fillRect(x, GROUND + 3, 5, 1);
      for (const th of things) {
        if (th.kind === 'cloud') {
          ctx.fillStyle = '#5a5470';
          ctx.fillRect(th.x + 2, th.y, th.w - 4, th.h);
          ctx.fillRect(th.x, th.y + 3, th.w, th.h - 6);
          ctx.fillStyle = '#e8c547';
          ctx.fillRect(th.x + 9, th.y + th.h, 2, 3);
          ctx.fillRect(th.x + 8, th.y + th.h + 3, 2, 2);
        } else if (!th.taken) {
          ctx.fillStyle = '#c8743a';
          ctx.fillRect(th.x, th.y, 4, 4);
          ctx.fillStyle = '#f0a868';
          ctx.fillRect(th.x, th.y, 2, 2);
        }
      }
      // The duck
      const wingUp = !api.reduced && Math.floor(t / 110) % 2 && vy < 0.5;
      const dy = Math.round(y);
      ctx.fillStyle = '#f2c84b';
      ctx.fillRect(26, dy + 2, 9, 5);
      ctx.fillRect(32, dy - 1, 5, 4);
      ctx.fillStyle = '#f28c28';
      ctx.fillRect(37, dy + 1, 3, 2);
      ctx.fillStyle = '#2a2233';
      ctx.fillRect(34, dy, 1, 1);
      ctx.fillStyle = '#e0a830';
      ctx.fillRect(27, wingUp ? dy - 1 : dy + 4, 5, 3);
      if (!started) {
        const msg = 'HOLD SPACE OR TAP TO FLY';
        ctx.fillStyle = 'rgba(26,22,38,0.85)';
        ctx.fillRect(W / 2 - 52, 30, 104, 11);
        text(ctx, msg, W / 2 - textWidth(msg) / 2, 33, '#e8c547');
      }
      const label = `${Math.floor(dist / 10)}M`;
      text(ctx, label, W - textWidth(label) - 3, 3, '#2a2233');
      text(ctx, `SEEDS ${seeds}`, 3, 3, '#2a2233');
    },
  };
}

const mod: GameModule = { width: W, height: H, pad: 'dpad', best: 'high', create };
export default mod;
