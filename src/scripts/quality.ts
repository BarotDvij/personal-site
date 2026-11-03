// Adaptive quality: start from a hardware hint, then confirm by measuring
// real frame times and downgrade if the device can't keep up.

export type Tier = 'high' | 'low';

export function hintTier(): Tier {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  if (nav.connection?.saveData || cores <= 2 || memory <= 2) return 'low';
  return 'high';
}

// Collects 90 frame times, then answers once: 'low' if the 90th percentile
// frame takes longer than 28 ms. Every later call returns null.
export function frameProbe() {
  const samples: number[] = [];
  return (dt: number): Tier | null => {
    if (samples.length >= 90) return null;
    samples.push(dt);
    if (samples.length < 90) return null;
    samples.sort((a, b) => a - b);
    return samples[Math.floor(90 * 0.9)] > 28 ? 'low' : null;
  };
}
