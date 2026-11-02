import { apply, load, update, watchSystem, type Mode, type Prefs } from './prefs';
import { sfx } from './sfx';
import type { City } from './city/engine';

const html = document.documentElement;
const cityRoot = document.getElementById('city')!;
const settings = document.getElementById('settings') as HTMLDialogElement;
const wipe = document.querySelector<HTMLElement>('.mode-wipe')!;

let city: City | null = null;

// ----- modes -----

async function enterMode(mode: Mode, opts: { focus?: boolean } = {}) {
  if (mode === 'city') {
    if (!city) {
      const { mountCity } = await import('./city/engine');
      city = mountCity(cityRoot);
    }
    city.start();
    history.replaceState(null, '', '#tour');
    if (opts.focus) cityRoot.focus({ preventScroll: true });
  } else {
    city?.stop();
    if (location.hash === '#tour') history.replaceState(null, '', location.pathname);
    if (opts.focus) document.getElementById('article')?.focus({ preventScroll: true });
  }
}

function switchMode(mode: Mode) {
  if (html.dataset.mode === mode) return;
  const go = () => {
    update({ mode });
    window.scrollTo(0, 0);
    void enterMode(mode, { focus: true });
  };
  mode === 'city' ? sfx.start() : sfx.close();
  if (html.dataset.motion === 'reduced') return go();
  wipe.classList.remove('run');
  void wipe.offsetWidth;
  wipe.classList.add('run');
  setTimeout(go, 280);
}

document.addEventListener('click', (e) => {
  const target = (e.target as HTMLElement).closest<HTMLElement>('[data-set-mode]');
  if (target) switchMode(target.dataset.setMode as Mode);
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
if (location.hash === '#tour') initial.mode = 'city';
apply(initial);
watchSystem();
if (initial.mode === 'city') void enterMode('city');
