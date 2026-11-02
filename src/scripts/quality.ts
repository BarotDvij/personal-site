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

export class FrameProbe {
  private samples: number[] = [];
  private done = false;

  constructor(private size = 90, private budgetMs = 28) {}

  // Returns 'low' once if the 90th percentile frame blows the budget.
  push(dt: number): Tier | null {
    if (this.done) return null;
    this.samples.push(dt);
    if (this.samples.length < this.size) return null;
    this.done = true;
    const sorted = [...this.samples].sort((a, b) => a - b);
    const p90 = sorted[Math.floor(sorted.length * 0.9)];
    return p90 > this.budgetMs ? 'low' : null;
  }

  reset() {
    this.samples = [];
    this.done = false;
  }
}
