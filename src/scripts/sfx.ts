// Chiptune sound effects synthesized with square and triangle waves.
// No audio files, nothing to download, and nothing plays until the visitor
// turns sound on (browsers block audio before a user gesture anyway).

let ctx: AudioContext | null = null;

const enabled = () => document.documentElement.dataset.sound === 'on';

function audio() {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function play(notes: number[], step = 0.06, type: OscillatorType = 'square', volume = 0.05) {
  if (!enabled()) return;
  const ac = audio();
  const t0 = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  notes.forEach((f, i) => osc.frequency.setValueAtTime(f, t0 + i * step));
  const end = t0 + notes.length * step;
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, end + 0.05);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(end + 0.06);
}

export const sfx = {
  open: () => play([523, 659, 784]),
  close: () => play([784, 659, 523], 0.05),
  warp: () => play([880, 740, 587, 440, 330, 247], 0.045),
  tick: () => play([1046], 0.03, 'square', 0.03),
  coin: () => play([988, 1319], 0.07, 'square', 0.04),
  start: () => play([392, 523, 659, 784, 1046], 0.07, 'triangle', 0.08),
};
