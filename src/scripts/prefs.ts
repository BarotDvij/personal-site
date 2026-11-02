// Visitor preferences. The inline bootstrap in Base.astro applies the same
// rules before first paint, so keep the two in sync.

export type Mode = 'cv' | 'city';
export type ThemePref = 'system' | 'light' | 'dark';
export type MotionPref = 'system' | 'full' | 'reduced';
export type SoundPref = 'off' | 'on';

export interface Prefs {
  mode: Mode;
  theme: ThemePref;
  motion: MotionPref;
  sound: SoundPref;
}

const KEY = 'dvij.prefs';
const DEFAULTS: Prefs = { mode: 'cv', theme: 'system', motion: 'system', sound: 'off' };

const media = (q: string) => typeof matchMedia === 'function' && matchMedia(q).matches;

export function load(): Prefs {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...DEFAULTS, ...raw };
  } catch {
    return { ...DEFAULTS };
  }
}

export function save(p: Prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Private windows can block storage. Preferences then last for the visit only.
  }
}

export const resolvedTheme = (p: Prefs) =>
  p.theme === 'system' ? (media('(prefers-color-scheme: dark)') ? 'dark' : 'light') : p.theme;

export const resolvedMotion = (p: Prefs) =>
  p.motion === 'system' ? (media('(prefers-reduced-motion: reduce)') ? 'reduced' : 'full') : p.motion;

export function apply(p: Prefs) {
  const d = document.documentElement.dataset;
  d.mode = p.mode;
  d.theme = resolvedTheme(p);
  d.motion = resolvedMotion(p);
  d.sound = p.sound;
  document.dispatchEvent(new CustomEvent('prefs:change', { detail: p }));
}

export function update(patch: Partial<Prefs>) {
  const next = { ...load(), ...patch };
  save(next);
  apply(next);
  return next;
}

// Follow OS changes while the visitor is on "system".
export function watchSystem() {
  if (typeof matchMedia !== 'function') return;
  for (const q of ['(prefers-color-scheme: dark)', '(prefers-reduced-motion: reduce)']) {
    matchMedia(q).addEventListener('change', () => apply(load()));
  }
}
