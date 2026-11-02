// Dvij City runtime. Loaded on demand only when a visitor takes the tour.

import {
  WORLD_W, WORLD_H, GROUND, DISTRICTS, LENS_COLOR, STRUCTURES, districtAt, type Structure,
} from './world';
import {
  PALETTES, buildCityLayer, buildSkyLayer, makeClouds, drawClouds, preparePaths,
  drawPackets, drawBeacons, drawHighlight, type Palette,
} from './art';
import { panelFor, highlights } from './panels';
import { FrameProbe, hintTier, type Tier } from '../quality';
import { sfx } from '../sfx';

export interface City {
  start(): void;
  stop(): void;
}

export function mountCity(root: HTMLElement): City {
  const canvas = root.querySelector<HTMLCanvasElement>('.city-canvas')!;
  const overlay = root.querySelector<HTMLElement>('.city-overlay')!;
  const districtEl = root.querySelector<HTMLElement>('[data-hud-district]')!;
  const scoreEl = root.querySelector<HTMLElement>('[data-hud-score]')!;
  const minimap = root.querySelector<HTMLElement>('.minimap')!;
  const viewport = root.querySelector<HTMLElement>('.minimap-view')!;
  const welcome = root.querySelector<HTMLElement>('.welcome')!;
  const panel = root.querySelector<HTMLDialogElement>('.city-panel')!;
  const ctx = canvas.getContext('2d', { alpha: false })!;

  const html = document.documentElement;
  const reduced = () => html.dataset.motion === 'reduced';

  let palette: Palette = PALETTES.day;
  let cityLayer: HTMLCanvasElement | null = null;
  let skyLayer: HTMLCanvasElement | null = null;
  let tier: Tier = hintTier();
  const probe = new FrameProbe();
  const paths = preparePaths();
  const clouds = makeClouds(7);

  let scale = 3, viewW = 480, viewH = WORLD_H, offsetY = 0;
  let camX = 0, targetX = 0;
  let raf = 0, last = 0, t = 0, running = false, dirty = true;
  let hovered: Structure | null = null;
  let district = -1;

  // ----- layers -----

  function rebuild() {
    palette = html.dataset.theme === 'dark' ? PALETTES.night : PALETTES.day;
    cityLayer = buildCityLayer(palette);
    skyLayer = buildSkyLayer(palette, viewW, Math.max(1, offsetY + GROUND));
    html.dataset.tier = tier;
    dirty = true;
  }

  // ----- sizing -----

  function resize() {
    const w = root.clientWidth, h = root.clientHeight;
    // Whole-number scaling keeps pixels crisp. Narrow screens drop a step so
    // more of the street fits across.
    scale = Math.max(1, Math.min(Math.round(h / WORLD_H), Math.floor(w / 160)));
    viewW = Math.ceil(w / scale);
    viewH = Math.ceil(h / scale);
    offsetY = viewH - WORLD_H;
    canvas.width = viewW;
    canvas.height = viewH;
    canvas.style.width = `${viewW * scale}px`;
    canvas.style.height = `${viewH * scale}px`;
    ctx.imageSmoothingEnabled = false;
    for (const b of overlay.querySelectorAll<HTMLElement>('[data-sid]')) {
      const s = STRUCTURES.find((x) => x.id === b.dataset.sid)!;
      b.style.left = `${s.x * scale}px`;
      b.style.top = `${(offsetY + GROUND - s.h) * scale}px`;
      b.style.width = `${s.w * scale}px`;
      b.style.height = `${s.h * scale}px`;
    }
    root.style.setProperty('--px', `${scale}px`);
    skyLayer = buildSkyLayer(palette, viewW, Math.max(1, offsetY + GROUND));
    clampTarget();
    camX = targetX;
    dirty = true;
  }

  const maxCam = () => Math.max(0, WORLD_W - viewW);
  function clampTarget() {
    targetX = Math.min(maxCam(), Math.max(0, targetX));
  }
  const originX = () => (viewW >= WORLD_W ? Math.floor((viewW - WORLD_W) / 2) : -Math.round(camX));

  function lookAt(x: number, instant = false) {
    targetX = x - viewW / 2;
    clampTarget();
    if (instant || reduced()) camX = targetX;
    dirty = true;
  }

  // ----- overlay buttons (keyboard + screen reader access) -----

  for (const s of STRUCTURES) {
    if (!s.ref) continue;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `bldg${s.kind === 'warp' ? ' warp' : ''}`;
    b.dataset.sid = s.id;
    b.setAttribute('aria-label', s.kind === 'warp' ? s.label : `${s.label}. Open details`);
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = s.label;
    b.append(tag);
    b.addEventListener('pointerenter', () => { hovered = s; dirty = true; });
    b.addEventListener('pointerleave', () => { if (hovered === s) hovered = null; dirty = true; });
    b.addEventListener('focus', () => { hovered = s; lookAt(s.x + s.w / 2); });
    b.addEventListener('blur', () => { if (hovered === s) hovered = null; dirty = true; });
    b.addEventListener('click', () => activate(s, b));
    overlay.append(b);
  }

  function activate(s: Structure, from: HTMLElement) {
    dismissWelcome();
    if (s.ref?.type === 'warp') {
      sfx.warp();
      const d = DISTRICTS[s.ref.to];
      lookAt(d.x0 + 200);
      return;
    }
    const content = s.ref && panelFor(s.ref);
    if (!content) return;
    const lens = DISTRICTS.find((d) => d.id === s.district)!.lens;
    panel.style.setProperty('--lens', LENS_COLOR[lens]);
    panel.querySelector('.panel-kicker')!.textContent = content.kicker;
    panel.querySelector('.panel-title')!.textContent = content.title;
    panel.querySelector('.panel-body')!.innerHTML = content.html;
    panel.returnTo = from;
    panel.showModal();
    sfx.open();
  }

  panel.addEventListener('close', () => {
    sfx.close();
    panel.returnTo?.focus();
  });
  panel.addEventListener('click', (e) => {
    if (e.target === panel) panel.close();
  });

  // ----- minimap -----

  DISTRICTS.forEach((d, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'minimap-seg';
    b.style.setProperty('--seg', LENS_COLOR[d.lens]);
    b.style.flexGrow = String(d.x1 - d.x0);
    b.setAttribute('aria-label', `Go to ${d.name}`);
    b.title = d.name;
    b.addEventListener('click', () => {
      dismissWelcome();
      sfx.warp();
      lookAt((d.x0 + d.x1) / 2);
      void i;
    });
    minimap.append(b);
  });

  // ----- input -----

  let dragStart = -1, dragCam = 0, dragged = false;

  root.addEventListener('wheel', (e) => {
    if (panel.open) return;
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : 1;
    const delta = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * unit;
    targetX += delta / scale;
    clampTarget();
    if (reduced()) camX = targetX;
    dismissWelcome();
    dirty = true;
  }, { passive: false });

  root.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('.hud, .minimap, .welcome, dialog')) return;
    dragStart = e.clientX;
    dragCam = camX;
    dragged = false;
  });
  window.addEventListener('pointermove', (e) => {
    if (dragStart < 0) return;
    const dx = e.clientX - dragStart;
    if (Math.abs(dx) > 6) dragged = true;
    if (dragged) {
      targetX = dragCam - dx / scale;
      clampTarget();
      camX = targetX;
      dismissWelcome();
      dirty = true;
    }
  });
  window.addEventListener('pointerup', () => { dragStart = -1; });
  root.addEventListener('click', (e) => {
    if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; }
  }, true);

  function onKey(e: KeyboardEvent) {
    if (!running || panel.open || (e.target as HTMLElement).closest('input, select, textarea, dialog')) return;
    const step: Record<string, number> = { ArrowRight: 48, ArrowLeft: -48, d: 48, a: -48 };
    if (e.key in step) {
      targetX += step[e.key];
    } else if (e.key === 'PageDown' || e.key === 'PageUp') {
      const i = districtAt(camX + viewW / 2) + (e.key === 'PageDown' ? 1 : -1);
      const d = DISTRICTS[Math.max(0, Math.min(DISTRICTS.length - 1, i))];
      lookAt((d.x0 + d.x1) / 2);
      sfx.warp();
    } else if (e.key === 'Home') {
      targetX = 0;
    } else if (e.key === 'End') {
      targetX = maxCam();
    } else {
      return;
    }
    e.preventDefault();
    clampTarget();
    if (reduced()) camX = targetX;
    dismissWelcome();
    dirty = true;
  }
  document.addEventListener('keydown', onKey);

  // ----- welcome -----

  let welcomed = false;
  function dismissWelcome() {
    if (welcomed) return;
    welcomed = true;
    welcome.hidden = true;
  }
  welcome.querySelector('button')?.addEventListener('click', () => {
    dismissWelcome();
    sfx.start();
    overlay.querySelector<HTMLElement>('.bldg')?.focus();
  });

  // ----- HUD score ticker -----

  let scoreIndex = 0;
  let scoreTimer = 0;
  function showScore() {
    const h = highlights[scoreIndex % highlights.length];
    scoreEl.innerHTML = `<b>${h.value}</b> <span>${h.label}</span>`;
    scoreIndex++;
  }

  // ----- loop -----

  function render() {
    if (!cityLayer || !skyLayer) return;
    const ox = originX();
    ctx.fillStyle = palette.sky[0];
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.drawImage(skyLayer, 0, 0);
    const motion = !reduced();
    if (tier === 'high' || !motion) drawClouds(ctx, clouds, palette, camX, motion ? t : 0, viewW, offsetY);
    ctx.drawImage(cityLayer, ox, offsetY);
    drawPackets(ctx, paths, motion ? t : 0, tier === 'high' ? 4 : 1, ox, offsetY, viewW);
    if (motion) drawBeacons(ctx, t, ox, offsetY, palette);
    if (hovered) drawHighlight(ctx, hovered, ox, offsetY, motion ? t : 0);

    overlay.style.transform = `translate3d(${ox * scale}px, 0, 0)`;
    const total = Math.max(WORLD_W, viewW);
    viewport.style.left = `${(Math.max(0, camX) / total) * 100}%`;
    viewport.style.width = `${Math.min(1, viewW / total) * 100}%`;

    const d = districtAt(camX + viewW / 2);
    if (d !== district) {
      district = d;
      const info = DISTRICTS[d];
      districtEl.textContent = info.name;
      districtEl.style.setProperty('--lens', LENS_COLOR[info.lens]);
    }
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(100, now - last) : 16;
    last = now;
    const motion = !reduced();

    if (motion) {
      t += dt;
      const verdict = probe.push(dt);
      if (verdict === 'low' && tier !== 'low') {
        tier = 'low';
        html.dataset.tier = 'low';
      }
      camX += (targetX - camX) * Math.min(1, dt * 0.012);
      if (Math.abs(targetX - camX) < 0.25) camX = targetX;
      render();
    } else if (dirty) {
      camX = targetX;
      render();
    }
    dirty = false;
  }

  const ro = new ResizeObserver(() => { resize(); render(); });
  const onPrefs = () => { rebuild(); render(); };
  const onVisibility = () => {
    if (!running) return;
    if (document.hidden) cancelAnimationFrame(raf);
    else { last = 0; raf = requestAnimationFrame(frame); }
  };

  return {
    start() {
      if (running) return;
      running = true;
      resize();
      rebuild();
      ro.observe(root);
      document.addEventListener('prefs:change', onPrefs);
      document.addEventListener('visibilitychange', onVisibility);
      showScore();
      scoreTimer = window.setInterval(showScore, 3500);
      last = 0;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
      clearInterval(scoreTimer);
      ro.disconnect();
      document.removeEventListener('prefs:change', onPrefs);
      document.removeEventListener('visibilitychange', onVisibility);
      if (panel.open) panel.close();
    },
  };
}

declare global {
  interface HTMLDialogElement {
    returnTo?: HTMLElement;
  }
}
