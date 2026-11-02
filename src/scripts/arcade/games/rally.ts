// Rally: tennis on the city court against a CPU opponent. First to 7.

import type { Api, Game, GameModule } from '../types';
import { text, textWidth } from '../../pixelfont';

const W = 160;
const H = 112;
const PH = 18;
const WIN = 7;

function create(api: Api): Game {
  const { ctx } = api;
  let py = H / 2, cy = H / 2;
  let bx = W / 2, by = H / 2, vx = 0, vy = 0;
  let me = 0, cpu = 0;
  let serveIn = 900;
  let dragY: number | null = null;

  function serve(towardCpu: boolean) {
    bx = W / 2;
    by = H / 2;
    const angle = (Math.random() - 0.5) * 0.8;
    const speed = 1.4;
    vx = Math.cos(angle) * speed * (towardCpu ? 1 : -1);
    vy = Math.sin(angle) * speed;
  }

  function point(mine: boolean) {
    mine ? me++ : cpu++;
    api.setScore(me, `${me} - ${cpu}`);
    mine ? api.sound.good() : api.sound.bad();
    if (me === WIN || cpu === WIN) {
      api.over(me === WIN ? `You win ${me} - ${cpu}!` : `The city wins ${cpu} - ${me}.`, me === WIN);
      return;
    }
    vx = vy = 0;
    serveIn = 700;
    bx = W / 2;
    by = H / 2;
    lastWinner = mine;
  }
  let lastWinner = false;

  return {
    update() {
      const up = api.held.has('ArrowUp') || api.held.has('w');
      const down = api.held.has('ArrowDown') || api.held.has('s');
      if (dragY !== null) py += Math.max(-2.4, Math.min(2.4, dragY - py));
      else py += (down ? 2.2 : 0) - (up ? 2.2 : 0);
      py = Math.max(PH / 2 + 4, Math.min(H - PH / 2 - 4, py));

      // CPU tracks the ball with a speed cap so it can be beaten.
      const target = vx > 0 ? by : H / 2;
      cy += Math.max(-1.5, Math.min(1.5, target - cy));
      cy = Math.max(PH / 2 + 4, Math.min(H - PH / 2 - 4, cy));

      if (serveIn > 0) {
        serveIn -= 1000 / 60;
        if (serveIn <= 0) serve(!lastWinner);
        return;
      }
      bx += vx;
      by += vy;
      if (by < 6 || by > H - 6) {
        vy = -vy;
        by = Math.max(6, Math.min(H - 6, by));
      }
      const hitPaddle = (x: number, y: number, dir: number) => {
        if (Math.abs(bx - x) < 3 && Math.abs(by - y) < PH / 2 + 2 && Math.sign(vx) === -dir) {
          const offset = (by - y) / (PH / 2);
          const speed = Math.min(3.4, Math.hypot(vx, vy) * 1.07);
          vx = Math.cos(offset * 0.9) * speed * dir;
          vy = Math.sin(offset * 0.9) * speed;
          api.sound.blip();
        }
      };
      hitPaddle(10, py, 1);
      hitPaddle(W - 10, cy, -1);
      if (bx < 0) point(false);
      else if (bx > W) point(true);
    },
    pointer(_x, y, kind) {
      if (kind === 'down' || kind === 'move') dragY = y;
      if (kind === 'up') dragY = null;
    },
    render() {
      ctx.fillStyle = '#2f6b3a';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#3a7d45';
      for (let x = 0; x < W; x += 20) ctx.fillRect(x, 0, 10, H);
      ctx.fillStyle = '#e8f0e0';
      ctx.fillRect(4, 4, W - 8, 1);
      ctx.fillRect(4, H - 5, W - 8, 1);
      ctx.fillRect(4, 4, 1, H - 8);
      ctx.fillRect(W - 5, 4, 1, H - 8);
      for (let y = 4; y < H - 4; y += 6) ctx.fillRect(W / 2, y, 1, 3);
      const score = `${me}   ${cpu}`;
      text(ctx, score, W / 2 - textWidth(score) / 2 + 1, 8, '#e8c547');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, py - PH / 2, 3, PH);
      ctx.fillStyle = '#e0457b';
      ctx.fillRect(W - 11, cy - PH / 2, 3, PH);
      ctx.fillStyle = '#e8c547';
      ctx.fillRect(Math.round(bx) - 2, Math.round(by) - 2, 4, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(bx) - 1, Math.round(by) - 2, 1, 1);
      text(ctx, 'YOU', 10, H - 12, '#ffffff');
      text(ctx, 'CITY', W - 26, H - 12, '#ffffff');
    },
  };
}

const mod: GameModule = { width: W, height: H, pad: 'dpad', best: 'none', create };
export default mod;
