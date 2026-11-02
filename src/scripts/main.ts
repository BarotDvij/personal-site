import { apply, load, resolvedTheme, update, watchSystem, type Mode, type Prefs } from './prefs';
import { sfx } from './sfx';
import type { City } from './city/engine';

const html = document.documentElement;
const cityRoot = document.getElementById('city')!;
const settings = document.getElementById('settings') as HTMLDialogElement;
const wipe = document.querySelector<HTMLElement>('.mode-wipe')!;

let city: City | null = null;

// ----- modes -----

async function enterMode(mode: Mode, opts: { focus?: boolean; target?: string } = {}) {
  if (mode === 'city') {
    if (!city) {
      const { mountCity } = await import('./city/engine');
      city = mountCity(cityRoot);
    }
    city.start();
    history.replaceState(null, '', '#tour');
    if (opts.target) city.focusBuilding(opts.target, true);
    else if (opts.focus) cityRoot.focus({ preventScroll: true });
  } else {
    city?.stop();
    if (location.hash.startsWith('#tour')) history.replaceState(null, '', location.pathname);
    if (opts.focus) document.getElementById('article')?.focus({ preventScroll: true });
  }
}

function switchMode(mode: Mode, target?: string) {
  if (html.dataset.mode === mode) return;
  const go = () => {
    update({ mode });
    window.scrollTo(0, 0);
    void enterMode(mode, { focus: true, target });
  };
  mode === 'city' ? sfx.start() : sfx.close();
  if (html.dataset.motion === 'reduced') return go();
  wipe.classList.remove('run');
  void wipe.offsetWidth;
  wipe.classList.add('run');
  setTimeout(go, 280);
}

document.addEventListener('click', (e) => {
  const el = e.target as HTMLElement;
  const modeBtn = el.closest<HTMLElement>('[data-set-mode]');
  if (modeBtn) switchMode(modeBtn.dataset.setMode as Mode);
  const cityLink = el.closest<HTMLElement>('[data-city-target]');
  if (cityLink) {
    e.preventDefault();
    switchMode('city', cityLink.dataset.cityTarget);
  }
});

// ----- HUD quick toggles -----

const soundBtn = document.querySelector<HTMLElement>('[data-toggle-sound]');
const syncToggles = () => soundBtn?.setAttribute('aria-pressed', String(html.dataset.sound === 'on'));
document.addEventListener('prefs:change', syncToggles);

document.querySelector('[data-toggle-theme]')?.addEventListener('click', () => {
  update({ theme: resolvedTheme(load()) === 'dark' ? 'light' : 'dark' });
  sfx.tick();
});
soundBtn?.addEventListener('click', () => {
  update({ sound: html.dataset.sound === 'on' ? 'off' : 'on' });
  sfx.coin();
});

// ----- settings dialog -----

let returnFocus: HTMLElement | null = null;

function syncSettings(p: Prefs) {
  for (const [name, value] of Object.entries(p)) {
    const input = settings.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`);
    if (input) input.checked = true;
  }
}

document.addEventListener('click', (e) => {
  const opener = (e.target as HTMLElement).closest<HTMLElement>('[data-open-settings]');
  if (!opener) return;
  returnFocus = opener;
  syncSettings({ ...load(), mode: html.dataset.mode as Mode });
  settings.showModal();
  sfx.tick();
});

settings.addEventListener('change', (e) => {
  const input = e.target as HTMLInputElement;
  if (input.name === 'mode') {
    settings.close();
    switchMode(input.value as Mode);
    return;
  }
  update({ [input.name]: input.value } as Partial<Prefs>);
  sfx.tick();
});

settings.addEventListener('close', () => returnFocus?.focus());
settings.addEventListener('click', (e) => {
  if (e.target === settings) settings.close();
});

// ----- wiki lens filter -----

const lensSelect = document.getElementById('lens-select') as HTMLSelectElement | null;
const lensNote = document.getElementById('lens-note');
lensSelect?.addEventListener('change', () => {
  const article = document.getElementById('article')!;
  const lens = lensSelect.value;
  article.dataset.lens = lens;
  if (lensNote) {
    lensNote.hidden = lens === 'all';
    lensNote.textContent = lens === 'all' ? '' : `Showing this article through the ${lensSelect.selectedOptions[0].text} lens. Related work is highlighted.`;
  }
});

// ----- floating tour button once the notice scrolls away -----

const notice = document.querySelector('.sitenotice');
const floatBtn = document.querySelector<HTMLElement>('.tour-float');
if (notice && floatBtn && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    floatBtn.hidden = entry.isIntersecting || html.dataset.mode === 'city';
  }).observe(notice);
}

// ----- easter egg -----

const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let progress = 0;
document.addEventListener('keydown', (e) => {
  progress = e.key === konami[progress] ? progress + 1 : e.key === konami[0] ? 1 : 0;
  if (progress === konami.length) {
    progress = 0;
    html.classList.toggle('party');
    sfx.coin();
  }
});

// ----- boot -----

const initial = load();
const [hashMode, hashTarget] = location.hash.slice(1).split('/');
if (hashMode === 'tour') initial.mode = 'city';
apply(initial);
watchSystem();
syncToggles();
if (initial.mode === 'city') void enterMode('city', { target: hashTarget });
