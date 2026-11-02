import { describe, expect, it } from 'vitest';
import profile from '../content/profile.json';
import { DISTRICTS, STRUCTURES, WORLD_W, WORLD_H, GROUND } from '../src/scripts/city/world';
import { panelFor } from '../src/scripts/city/panels';
import { GAMES } from '../src/scripts/arcade/catalog';

describe('content and city stay in sync', () => {
  it('every clickable building opens a real panel', () => {
    for (const s of STRUCTURES) {
      if (!s.ref || s.ref.type === 'warp') continue;
      if (s.ref.type === 'game') {
        const id = s.ref.id;
        expect(GAMES.some((g) => g.id === id), `${s.id} launches unknown game ${id}`).toBe(true);
        continue;
      }
      expect(panelFor(s.ref), `${s.id} points at missing content`).not.toBeNull();
    }
  });

  it('every role marked for the city has a building', () => {
    for (const e of profile.experience.filter((x) => x.journey)) {
      const found = STRUCTURES.some((s) => s.ref?.type === 'role' && s.ref.org === e.org);
      expect(found, `${e.org} has no building`).toBe(true);
    }
  });

  it('every project has a building', () => {
    for (const p of profile.projects) {
      const found = STRUCTURES.some((s) => s.ref?.type === 'project' && s.ref.name === p.name);
      expect(found, `${p.name} has no building`).toBe(true);
    }
  });

  it('buildings fit in the world and their district', () => {
    for (const s of STRUCTURES) {
      const d = DISTRICTS.find((x) => x.id === s.district)!;
      expect(d, `${s.id} has unknown district`).toBeTruthy();
      expect(s.x >= d.x0 && s.x + s.w <= d.x1, `${s.id} spills out of ${d.name}`).toBe(true);
      expect(s.x + s.w <= WORLD_W).toBe(true);
      expect(GROUND - s.h >= 0 && GROUND <= WORLD_H, `${s.id} is taller than the sky`).toBe(true);
    }
  });

  it('buildings in a district do not overlap', () => {
    const sorted = [...STRUCTURES].sort((a, b) => a.x - b.x);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1], cur = sorted[i];
      expect(cur.x >= prev.x + prev.w, `${prev.id} overlaps ${cur.id}`).toBe(true);
    }
  });

  it('every game has a title, credit line, and help text', () => {
    for (const g of GAMES) {
      expect(g.title && g.credit && g.help && g.blurb, `${g.id} is missing text`).toBeTruthy();
      expect(g.credit.includes('—'), `${g.id} credit uses an em dash`).toBe(false);
    }
  });

  it('warp pipes point at real districts', () => {
    for (const s of STRUCTURES) {
      if (s.ref?.type !== 'warp') continue;
      expect(DISTRICTS[s.ref.to], `${s.id} warps nowhere`).toBeTruthy();
    }
  });
});
