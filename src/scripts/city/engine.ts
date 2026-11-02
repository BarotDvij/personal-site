// Dvij City runtime. Loaded on demand only when a visitor takes the tour.

import {
  WORLD_W, WORLD_H, GROUND, DISTRICTS, LENS_COLOR, STRUCTURES, districtAt, type Structure,
} from './world';
import {
  PALETTES, buildCityLayer, buildSkyLayer, makeClouds, drawClouds, preparePaths,
  drawPackets, drawBeacons, drawHighlight, drawStreetLife, drawProps, type Palette,
} from './art';
import { panelFor, highlights } from './panels';
import { FrameProbe, hintTier, type Tier } from '../quality';
import { createWalker, drawPrompt, drawWalker, jump, nearby, standOn, startWarp, updateWalker } from './walker';
import { sfx } from '../sfx';

export interface City {
  start(): void;
  stop(): void;
  focusBuilding(id: string, open?: boolean): void;
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
  const walker = createWalker();
  const walkKeys = new Set<string>();
  let follow = true;
  const INTRO = 2800;
  let intro = 0;
  let introPlayed = false;
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
    follow = false;
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

  // Guided tour order: every clickable building except warp pipes.
  const tourStops = STRUCTURES.filter((s) => s.ref && s.ref.type !== 'warp');
  const countEl = panel.querySelector<HTMLElement>('.panel-count')!;
  let current: Structure | null = null;
  const buttonFor = (s: Structure) => overlay.querySelector<HTMLElement>(`[data-sid="${s.id}"]`);

  function fill(s: Structure) {
    const content = s.ref && panelFor(s.ref);
    if (!content) return false;
    current = s;
    delete panel.dataset.help;
    const lens = DISTRICTS.find((d) => d.id === s.district)!.lens;
    panel.style.setProperty('--lens', LENS_COLOR[lens]);
    panel.querySelector('.panel-kicker')!.textContent = content.kicker;
    panel.querySelector('.panel-title')!.textContent = content.title;
    panel.querySelector('.panel-body')!.innerHTML = content.html;
    countEl.textContent = `${tourStops.indexOf(s) + 1} / ${tourStops.length}`;
    panel.scrollTop = 0;
    hovered = s;
    lookAt(s.x + s.w / 2);
    history.replaceState(null, '', `#tour/${s.id}`);
    return true;
  }

  function activate(s: Structure, from: HTMLElement | null) {
    dismissWelcome();
    if (s.ref?.type === 'warp') {
      sfx.warp();
      const d = DISTRICTS[s.ref.to];
      lookAt(d.x0 + 200);
      return;
    }
    if (s.ref?.type === 'game') {
      document.dispatchEvent(new CustomEvent('arcade:launch', { detail: s.ref.id }));
      return;
    }
    if (!fill(s)) return;
    panel.returnTo = from ?? undefined;
    if (!panel.open) panel.showModal();
    sfx.open();
  }

  function step(dir: 1 | -1) {
    if (!current) return;
    const n = tourStops.length;
    const next = tourStops[(tourStops.indexOf(current) + dir + n) % n];
    fill(next);
    panel.returnTo = buttonFor(next) ?? undefined;
    sfx.tick();
  }

  panel.querySelector('[data-panel-next]')!.addEventListener('click', () => step(1));
  panel.querySelector('[data-panel-prev]')!.addEventListener('click', () => step(-1));
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });

  panel.addEventListener('close', () => {
    sfx.close();
    current = null;
    hovered = null;
    dirty = true;
    if (running) history.replaceState(null, '', '#tour');
    panel.returnTo?.focus();
  });
  panel.addEventListener('click', (e) => {
    if (e.target === panel) panel.close();
    const goto = (e.target as HTMLElement).closest<HTMLElement>('[data-goto]');
    if (goto) {
      const s = STRUCTURES.find((x) => x.id === goto.dataset.goto);
      if (s) fill(s);
      return;
    }
    const game = (e.target as HTMLElement).closest<HTMLElement>('[data-game]');
    if (game) {
      backToArcade = true;
      panel.close();
      document.dispatchEvent(new CustomEvent('arcade:launch', { detail: game.dataset.game }));
    }
  });

  // Pause the city while a game runs so the two never compete for frames.
  document.addEventListener('arcade:open', () => {
    if (running) cancelAnimationFrame(raf);
  });
  let backToArcade = false;
  document.addEventListener('arcade:close', () => {
    if (!running) return;
    last = 0;
    dirty = true;
    raf = requestAnimationFrame(frame);
    // Games started from the Arcade Hall return to its game list.
    if (backToArcade) {
      backToArcade = false;
      const hall = STRUCTURES.find((x) => x.id === 'arcade')!;
      activate(hall, buttonFor(hall));
    }
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
    endIntro();
    follow = false;
    const unit = e.deltaMode === 1 ? 16 : 1;
    const delta = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * unit;
    targetX += delta / scale;
    clampTarget();
    if (reduced()) camX = targetX;
    dismissWelcome();
    dirty = true;
  }, { passive: false });

  root.addEventListener('pointerdown', (e) => {
    endIntro();
    if ((e.target as HTMLElement).closest('.hud, .minimap, .welcome, .walk-pad, dialog')) return;
    dragStart = e.clientX;
    dragCam = camX;
    dragged = false;
  });
  window.addEventListener('pointermove', (e) => {
    if (dragStart < 0) return;
    const dx = e.clientX - dragStart;
    if (Math.abs(dx) > 6) dragged = true;
    if (dragged) {
      follow = false;
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

  const keyName = (e: KeyboardEvent) => (e.key.length === 1 ? e.key.toLowerCase() : e.key);

  function teleport(x: number) {
    walker.x = x;
    walker.jump = 0;
    walker.vy = 0;
    walker.poof = 300;
    follow = true;
  }

  function act(k: string, target: HTMLElement | null) {
    if (k === 'ArrowUp' || k === 'w') {
      const s = nearby(walker);
      if (s && s.ref?.type !== 'warp') activate(s, buttonFor(s));
      return true;
    }
    if (k === 'ArrowDown' || k === 's') {
      const s = nearby(walker);
      if (s && startWarp(walker, s)) {
        sfx.warp();
        follow = true;
      } else if (s?.kind === 'warp') {
        sfx.tick();
      }
      return true;
    }
    if (k === ' ' && !target?.closest('button:not(.bldg), a')) {
      jump(walker);
      sfx.tick();
      return true;
    }
    return false;
  }

  function onKey(e: KeyboardEvent) {
    if (!running || panel.open || html.dataset.arcade || (e.target as HTMLElement).closest('input, select, textarea, dialog')) return;
    endIntro();
    const k = keyName(e);
    // Walking keys belong to the character, so step off any focused building
    // button first. Otherwise Space would click a building across the city.
    const active = document.activeElement as HTMLElement | null;
    if (active?.classList.contains('bldg') && ['ArrowLeft', 'ArrowRight', 'a', 'd', ' ', 'ArrowDown', 's'].includes(k)) {
      active.blur();
      root.focus({ preventScroll: true });
    }
    if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'a' || k === 'd' || k === 'Shift') {
      walkKeys.add(k);
      if (k !== 'Shift') follow = true;
    } else if (act(k, e.target as HTMLElement)) {
      // handled
    } else if (k === 'PageDown' || k === 'PageUp') {
      const i = districtAt(walker.x) + (k === 'PageDown' ? 1 : -1);
      const d = DISTRICTS[Math.max(0, Math.min(DISTRICTS.length - 1, i))];
      teleport(d.x0 + 36);
      sfx.warp();
    } else if (k === 'Home') {
      teleport(36);
    } else if (k === 'End') {
      teleport(WORLD_W - 60);
    } else {
      return;
    }
    e.preventDefault();
    dismissWelcome();
    dirty = true;
  }
  document.addEventListener('keyup', (e) => walkKeys.delete(keyName(e)));
  window.addEventListener('blur', () => walkKeys.clear());

  // On-screen walking controls for touch screens.
  for (const b of root.querySelectorAll<HTMLElement>('[data-walk]')) {
    const k = b.dataset.walk!;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      endIntro();
      dismissWelcome();
      if (k === 'ArrowLeft' || k === 'ArrowRight') {
        walkKeys.add(k);
        follow = true;
      } else {
        act(k, null);
      }
    });
    const up = () => walkKeys.delete(k);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointerleave', up);
    b.addEventListener('pointercancel', up);
  }

  document.addEventListener('keydown', onKey);

  // ----- welcome -----

  let welcomed = false;
  function dismissWelcome() {
    if (welcomed) return;
    welcomed = true;
    welcome.hidden = true;
  }
  welcome.querySelector('[data-start]')?.addEventListener('click', () => {
    dismissWelcome();
    sfx.start();
    root.focus({ preventScroll: true });
  });

  // ----- controls help -----

  const HELP = `<p class="lead">Explore however you like. Every building is a role, project, or game.</p>
    <table class="controls">
      <thead><tr><th scope="col">To</th><th scope="col">Keyboard</th><th scope="col">Touch or mouse</th></tr></thead>
      <tbody>
        <tr><td>Walk</td><td><kbd>&larr;</kbd> <kbd>&rarr;</kbd> or <kbd>A</kbd> <kbd>D</kbd>, hold <kbd>Shift</kbd> to run</td><td>Arrow buttons</td></tr>
        <tr><td>Open a building</td><td><kbd>&uarr;</kbd> or <kbd>W</kbd> in front of it</td><td>Tap or click it</td></tr>
        <tr><td>Jump</td><td><kbd>Space</kbd></td><td>Jump button</td></tr>
        <tr><td>Warp</td><td>Hop onto a green pipe, then <kbd>&darr;</kbd> or <kbd>S</kbd></td><td>Jump, then Warp</td></tr>
        <tr><td>Next district</td><td><kbd>Page Up</kbd> <kbd>Page Down</kbd></td><td>Tap the map bar</td></tr>
        <tr><td>Look around</td><td>Scroll</td><td>Drag or swipe</td></tr>
        <tr><td>Guided tour</td><td><kbd>&larr;</kbd> <kbd>&rarr;</kbd> inside any building</td><td>Prev and Next</td></tr>
        <tr><td>Keyboard only</td><td><kbd>Tab</kbd> to a building, <kbd>Enter</kbd> to open, <kbd>Esc</kbd> to close</td><td></td></tr>
        <tr><td>This help</td><td><kbd>?</kbd> or <kbd>H</kbd></td><td>The ? button</td></tr>
      </tbody>
    </table>
    <h3>How the city works</h3>
    <ul>
      <li>Districts are lenses: AI, play, marketing, civic life and product, data, and building.</li>
      <li>The copper pipes underground are data pipelines. The packets are real flows of work into the warehouse.</li>
      <li>Day, night, sound, and motion live in Settings.</li>
    </ul>`;

  function showHelp() {
    dismissWelcome();
    endIntro();
    current = null;
    panel.style.setProperty('--lens', '#e8c547');
    panel.dataset.help = '';
    panel.querySelector('.panel-kicker')!.textContent = 'Help';
    panel.querySelector('.panel-title')!.textContent = 'Controls';
    panel.querySelector('.panel-body')!.innerHTML = HELP;
    panel.returnTo = (document.activeElement as HTMLElement) ?? undefined;
    if (!panel.open) panel.showModal();
    sfx.open();
  }
  for (const b of root.querySelectorAll('[data-help]')) b.addEventListener('click', showHelp);
  document.addEventListener('keydown', (e) => {
    if (!running || panel.open || html.dataset.arcade) return;
    if ((e.target as HTMLElement).closest('input, select, textarea')) return;
    if (e.key === '?' || e.key === 'h') {
      e.preventDefault();
      showHelp();
    }
  });

  // ----- HUD score ticker -----

  let scoreIndex = 0;
  let scoreTimer = 0;
  function showScore() {
    const h = highlights[scoreIndex % highlights.length];
    scoreEl.innerHTML = `<b>${h.value}</b> <span>${h.label}</span>`;
    scoreIndex++;
  }

  // ----- fly-over intro -----

  function beginIntro() {
    if (introPlayed || reduced()) return;
    introPlayed = true;
    intro = INTRO;
    welcome.hidden = true;
    overlay.style.visibility = 'hidden';
  }

  function endIntro() {
    if (!intro) return;
    intro = 0;
    overlay.style.visibility = '';
    if (!welcomed) welcome.hidden = false;
    dirty = true;
  }

  function renderIntro() {
    if (!cityLayer || !skyLayer) return;
    const k = 1 - intro / INTRO;
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    const z0 = Math.min(1, viewW / (WORLD_W + 40));
    const z = z0 + (1 - z0) * e;
    const c = WORLD_W / 2 + (camX + viewW / 2 - WORLD_W / 2) * e;
    ctx.fillStyle = palette.sky[0];
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.drawImage(skyLayer, 0, 0);
    drawClouds(ctx, clouds, palette, camX, t, viewW, offsetY);
    const dw = WORLD_W * z, dh = WORLD_H * z;
    ctx.drawImage(cityLayer, 0, 0, WORLD_W, WORLD_H, Math.round(viewW / 2 - c * z), Math.round(viewH - dh), Math.round(dw), Math.round(dh));
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
    drawProps(ctx, motion ? t : 0, ox, offsetY, palette);
    if (tier === 'high' && motion) drawStreetLife(ctx, t, ox, offsetY, viewW, palette);
    if (motion) drawBeacons(ctx, t, ox, offsetY, palette);
    drawWalker(ctx, walker, ox, offsetY, palette, motion);
    drawPrompt(ctx, walker, nearby(walker), ox, offsetY);
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

    if (intro > 0) {
      t += dt;
      intro -= dt;
      if (intro <= 0) endIntro();
      else {
        renderIntro();
        return;
      }
    }

    const dir = (walkKeys.has('ArrowRight') || walkKeys.has('d') ? 1 : 0) - (walkKeys.has('ArrowLeft') || walkKeys.has('a') ? 1 : 0);
    if (updateWalker(walker, dir, walkKeys.has('Shift'), dt)) dirty = true;
    if (follow) {
      targetX = walker.x - viewW / 2;
      clampTarget();
    }

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
      beginIntro();
      last = 0;
      raf = requestAnimationFrame(frame);
    },
    focusBuilding(id: string, open = false) {
      const s = STRUCTURES.find((x) => x.id === id);
      if (!s) return;
      endIntro();
      dismissWelcome();
      standOn(walker, s);
      lookAt(s.x + s.w / 2, true);
      if (open && s.ref) activate(s, buttonFor(s));
      else buttonFor(s)?.focus({ preventScroll: true });
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
