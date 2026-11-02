// Dvij City layout, in world pixels. The world is drawn at a tiny base
// resolution and scaled up by whole numbers so the pixel art stays crisp.

export const WORLD_W = 2400;
export const WORLD_H = 270;
export const GROUND = 176; // y of the street surface
export const TRUNK_Y = GROUND + 58; // main underground pipeline
export const DEEP_Y = GROUND + 78; // second, deeper pipeline

export type Lens = 'marketing' | 'data' | 'pm' | 'ai' | 'dev';

export const LENS_COLOR: Record<Lens | 'plaza', string> = {
  plaza: '#e8c547',
  marketing: '#e0457b',
  pm: '#f2a33a',
  ai: '#9b6bf2',
  data: '#3b82f6',
  dev: '#3fb950',
};

export interface District {
  id: string;
  name: string;
  lens: Lens | 'plaza';
  x0: number;
  x1: number;
}

export const DISTRICTS: District[] = [
  { id: 'plaza', name: 'Welcome Plaza', lens: 'plaza', x0: 0, x1: 400 },
  { id: 'marketing', name: 'Marketing Strip', lens: 'marketing', x0: 400, x1: 800 },
  { id: 'civic', name: 'Civic Center', lens: 'pm', x0: 800, x1: 1200 },
  { id: 'ai', name: 'AI Lab', lens: 'ai', x0: 1200, x1: 1600 },
  { id: 'data', name: 'Data District', lens: 'data', x0: 1600, x1: 2000 },
  { id: 'yard', name: "Builder's Yard", lens: 'dev', x0: 2000, x1: 2400 },
];

export type Ref =
  | { type: 'role'; org: string }
  | { type: 'project'; name: string }
  | { type: 'about' }
  | { type: 'contact' }
  | { type: 'hackathons' }
  | { type: 'pipelines' }
  | { type: 'civic' }
  | { type: 'warp'; to: number };

export type Kind =
  | 'kiosk' | 'monument' | 'post' | 'shop' | 'billboard' | 'hall' | 'studio' | 'park'
  | 'tower' | 'lab' | 'marble' | 'warehouse' | 'library' | 'watertower' | 'arcade'
  | 'grocer' | 'construction' | 'warp' | 'furniture';

export interface Structure {
  id: string;
  label: string;
  kind: Kind;
  x: number;
  w: number;
  h: number;
  district: string;
  ref?: Ref; // clickable when present
  text?: string[]; // sign or billboard text, uppercase, pixel font
  riser?: number; // x of the data pipe that feeds this building
}

export const STRUCTURES: Structure[] = [
  // Welcome Plaza
  { id: 'visitor', label: 'Visitor Center: trophy case', kind: 'kiosk', x: 34, w: 64, h: 52, district: 'plaza', ref: { type: 'about' }, text: ['INFO'] },
  { id: 'fame', label: 'Hall of Fame', kind: 'monument', x: 136, w: 112, h: 66, district: 'plaza', ref: { type: 'hackathons' }, text: ['HALL OF FAME'] },
  { id: 'post', label: 'Post Office', kind: 'post', x: 284, w: 72, h: 56, district: 'plaza', ref: { type: 'contact' }, text: ['POST'] },
  { id: 'warp-1', label: 'Warp to Marketing Strip', kind: 'warp', x: 372, w: 22, h: 26, district: 'plaza', ref: { type: 'warp', to: 1 } },

  // Marketing Strip
  { id: 'golime', label: 'Go Lime', kind: 'shop', x: 430, w: 92, h: 96, district: 'marketing', ref: { type: 'role', org: 'Go Lime Inc.' }, text: ['GO LIME'], riser: 476 },
  { id: 'ab', label: 'A/B test billboard', kind: 'billboard', x: 548, w: 84, h: 70, district: 'marketing', ref: { type: 'role', org: 'Go Lime Inc.' }, text: ['A', 'B'] },
  { id: 'leads', label: 'Lead reporting billboard', kind: 'billboard', x: 660, w: 96, h: 58, district: 'marketing', ref: { type: 'role', org: 'Go Lime Inc.' }, text: ['LEADS', '12 MIN>10 S'] },
  { id: 'warp-2', label: 'Warp to Civic Center', kind: 'warp', x: 772, w: 22, h: 26, district: 'marketing', ref: { type: 'warp', to: 2 } },

  // Civic Center
  { id: 'cityhall', label: 'Kitchener City Hall', kind: 'hall', x: 812, w: 112, h: 104, district: 'civic', ref: { type: 'civic' }, text: ['CITY HALL'] },
  { id: 'altaml', label: 'Hauser Furniture: AltaML', kind: 'furniture', x: 934, w: 68, h: 66, district: 'civic', ref: { type: 'role', org: 'AltaML Inc.' }, text: ['HAUSER'], riser: 968 },
  { id: 'sevenafter', label: 'SevenAfter Studio', kind: 'studio', x: 1010, w: 62, h: 74, district: 'civic', ref: { type: 'role', org: 'SevenAfter Technologies' }, text: ['STUDIO'] },
  { id: 'cityscapes', label: 'CityScapes Park', kind: 'park', x: 1080, w: 88, h: 44, district: 'civic', ref: { type: 'project', name: 'CityScapes' }, text: ['CITYSCAPES'] },
  { id: 'warp-3', label: 'Warp to AI Lab', kind: 'warp', x: 1172, w: 22, h: 26, district: 'civic', ref: { type: 'warp', to: 3 } },

  // AI Lab
  { id: 'genledge', label: 'GenLedge Tower', kind: 'tower', x: 1224, w: 72, h: 146, district: 'ai', ref: { type: 'role', org: 'GenLedge' }, text: ['GENLEDGE'], riser: 1260 },
  { id: 'knowidea', label: 'KnowIdea Lab', kind: 'lab', x: 1318, w: 86, h: 76, district: 'ai', ref: { type: 'role', org: 'KnowIdea Inc.' }, text: ['KNOWIDEA'], riser: 1361 },
  { id: 'marble', label: 'Urban Marble Tower', kind: 'marble', x: 1438, w: 48, h: 160, district: 'ai', ref: { type: 'project', name: 'Urban Marble' }, text: ['1ST'] },
  { id: 'warp-4', label: 'Warp to Data District', kind: 'warp', x: 1572, w: 22, h: 26, district: 'ai', ref: { type: 'warp', to: 4 } },

  // Data District
  { id: 'super', label: 'Super.com Warehouse', kind: 'warehouse', x: 1622, w: 156, h: 66, district: 'data', ref: { type: 'role', org: 'Super.com' }, text: ['SUPER.COM'], riser: 1700 },
  { id: 'library', label: 'Learning Technique Library', kind: 'library', x: 1800, w: 96, h: 74, district: 'data', ref: { type: 'project', name: 'Learning Technique Recommendation Engine' }, text: ['LIBRARY'], riser: 1848 },
  { id: 'lake', label: 'Data Lake: pipelines', kind: 'watertower', x: 1916, w: 36, h: 96, district: 'data', ref: { type: 'pipelines' }, text: ['DATA', 'LAKE'], riser: 1934 },
  { id: 'warp-5', label: "Warp to Builder's Yard", kind: 'warp', x: 1972, w: 22, h: 26, district: 'data', ref: { type: 'warp', to: 5 } },

  // Builder's Yard
  { id: 'boggle', label: 'Boggle Zen Arcade', kind: 'arcade', x: 2026, w: 82, h: 62, district: 'yard', ref: { type: 'project', name: 'Boggle Zen' }, text: ['BOGGLE'] },
  { id: 'ecoeats', label: 'Eco Eats Grocer', kind: 'grocer', x: 2128, w: 84, h: 56, district: 'yard', ref: { type: 'project', name: 'Eco Eats Advisor' }, text: ['ECO EATS'], riser: 2170 },
  { id: 'summit', label: 'SUMMIT (under construction)', kind: 'construction', x: 2236, w: 116, h: 108, district: 'yard', ref: { type: 'project', name: 'SUMMIT Financial Learning' }, text: ['SUMMIT'] },
  { id: 'warp-0', label: 'Warp back to Welcome Plaza', kind: 'warp', x: 2366, w: 22, h: 26, district: 'yard', ref: { type: 'warp', to: 0 } },
];

// The warehouse junction every pipeline flows into.
export const JUNCTION_X = 1700;
// Bottom edge of the warehouse tank, where pipelines plug in.
export const TANK_BOTTOM = GROUND + 44;

export interface PipePath {
  color: string;
  points: [number, number][];
}

const districtLens = (id: string) => DISTRICTS.find((d) => d.id === id)!.lens;

// Each data-fed building sends packets down its riser, along the trunk,
// and up into the warehouse. The lake fills from the deeper line.
export const PIPE_PATHS: PipePath[] = STRUCTURES.filter((s) => s.riser && s.id !== 'super').map((s) => {
  const deep = s.id === 'lake';
  const y = deep ? DEEP_Y : TRUNK_Y;
  return {
    color: LENS_COLOR[districtLens(s.district)],
    points: deep
      ? [[JUNCTION_X + 20, TANK_BOTTOM], [JUNCTION_X + 20, y], [s.riser!, y], [s.riser!, GROUND + 4]]
      : [[s.riser!, GROUND + 4], [s.riser!, y], [JUNCTION_X, y], [JUNCTION_X, TANK_BOTTOM]],
  };
});

export const districtAt = (x: number) =>
  Math.max(0, DISTRICTS.findIndex((d) => x >= d.x0 && x < d.x1));
