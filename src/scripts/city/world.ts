// Dvij City layout, in world pixels. The world is drawn at a tiny base
// resolution and scaled up by whole numbers so the pixel art stays crisp.

export const WORLD_W = 3200;
export const WORLD_H = 270;
export const GROUND = 176; // y of the street surface
export const TRUNK_Y = GROUND + 58; // main underground pipeline
export const DEEP_Y = GROUND + 78; // second, deeper pipeline

export type Lens = 'marketing' | 'data' | 'pm' | 'ai' | 'dev' | 'downtown';

export const LENS_COLOR: Record<Lens | 'plaza' | 'play', string> = {
  plaza: '#e8c547',
  play: '#22b8cf',
  marketing: '#c8336c',
  pm: '#f2a33a',
  ai: '#7c4ddb',
  data: '#2f6fd6',
  dev: '#3fb950',
  downtown: '#e0703a',
};

export interface District {
  id: string;
  name: string;
  lens: Lens | 'plaza' | 'play';
  x0: number;
  x1: number;
}

export const DISTRICTS: District[] = [
  { id: 'plaza', name: 'Welcome Plaza', lens: 'plaza', x0: 0, x1: 400 },
  { id: 'ai', name: 'AI Lab', lens: 'ai', x0: 400, x1: 800 },
  { id: 'downtown', name: 'Downtown Square', lens: 'downtown', x0: 800, x1: 1140 },
  { id: 'play', name: 'Play District', lens: 'play', x0: 1140, x1: 1560 },
  { id: 'marketing', name: 'Marketing Strip', lens: 'marketing', x0: 1560, x1: 1940 },
  { id: 'civic', name: 'Civic Center', lens: 'pm', x0: 1940, x1: 2574 },
  { id: 'data', name: 'Data District', lens: 'data', x0: 2574, x1: 2894 },
  { id: 'yard', name: "Builder's Yard", lens: 'dev', x0: 2894, x1: 3200 },
];

export type Ref =
  | { type: 'role'; org: string }
  | { type: 'project'; name: string }
  | { type: 'trophies' }
  | { type: 'contact' }
  | { type: 'hackathons' }
  | { type: 'pipelines' }
  | { type: 'civic' }
  | { type: 'arcade' }
  | { type: 'museum' }
  | { type: 'game'; id: string }
  | { type: 'warp'; to: number };

export type Kind =
  | 'kiosk' | 'monument' | 'post' | 'shop' | 'billboard' | 'hall' | 'studio' | 'park'
  | 'tower' | 'lab' | 'marble' | 'warehouse' | 'library' | 'watertower' | 'arcade'
  | 'grocer' | 'construction' | 'warp' | 'furniture' | 'school' | 'arcadehall' | 'pond' | 'museum';

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
  { id: 'post', label: 'Post Office: about and contact', kind: 'post', x: 44, w: 72, h: 56, district: 'plaza', ref: { type: 'contact' }, text: ['POST'] },
  { id: 'podium', label: 'Podium: hackathon wins', kind: 'monument', x: 140, w: 112, h: 66, district: 'plaza', ref: { type: 'hackathons' }, text: ['PODIUM'] },
  { id: 'warp-1', label: 'Warp pipe', kind: 'warp', x: 362, w: 22, h: 26, district: 'plaza', ref: { type: 'warp', to: 1 } },

  // AI Lab
  { id: 'genledge', label: 'GenLedge Tower', kind: 'tower', x: 440, w: 72, h: 146, district: 'ai', ref: { type: 'role', org: 'GenLedge' }, text: ['GENLEDGE'], riser: 476 },
  { id: 'knowidea', label: 'KnowIdea Lab', kind: 'lab', x: 530, w: 86, h: 76, district: 'ai', ref: { type: 'role', org: 'KnowIdea Inc.' }, text: ['KNOWIDEA'], riser: 573 },
  { id: 'marble', label: 'Urban Marble Tower', kind: 'marble', x: 638, w: 48, h: 160, district: 'ai', ref: { type: 'project', name: 'Urban Marble' }, text: ['1ST'] },
  { id: 'warp-2', label: 'Warp pipe', kind: 'warp', x: 762, w: 22, h: 26, district: 'ai', ref: { type: 'warp', to: 2 } },

  // Downtown Square
  { id: 'ecoeats', label: 'Eco Eats Grocer', kind: 'grocer', x: 840, w: 84, h: 56, district: 'downtown', ref: { type: 'project', name: 'Eco Eats Advisor' }, text: ['ECO EATS'], riser: 882 },
  { id: 'altaml', label: 'Hauser Furniture: AltaML', kind: 'furniture', x: 960, w: 68, h: 66, district: 'downtown', ref: { type: 'role', org: 'AltaML Inc.' }, text: ['HAUSER'], riser: 994 },
  { id: 'warp-3', label: 'Warp pipe', kind: 'warp', x: 1100, w: 22, h: 26, district: 'downtown', ref: { type: 'warp', to: 3 } },

  // Play District
  { id: 'arcade', label: 'Arcade Hall: play games', kind: 'arcadehall', x: 1178, w: 132, h: 98, district: 'play', ref: { type: 'arcade' }, text: ['ARCADE'] },
  { id: 'museum', label: 'Museum of Favourites', kind: 'museum', x: 1324, w: 92, h: 86, district: 'play', ref: { type: 'museum' }, text: ['MUSEUM'] },
  { id: 'halloffame', label: 'Hall of Fame: trophy case', kind: 'kiosk', x: 1432, w: 76, h: 52, district: 'play', ref: { type: 'trophies' }, text: ['HALL OF FAME'] },
  { id: 'warp-4', label: 'Warp pipe', kind: 'warp', x: 1524, w: 22, h: 26, district: 'play', ref: { type: 'warp', to: 4 } },

  // Marketing Strip
  { id: 'golime', label: 'Go Lime', kind: 'shop', x: 1600, w: 92, h: 96, district: 'marketing', ref: { type: 'role', org: 'Go Lime Inc.' }, text: ['GO LIME'], riser: 1646 },
  { id: 'ab', label: 'A/B test billboard', kind: 'billboard', x: 1710, w: 84, h: 70, district: 'marketing', ref: { type: 'role', org: 'Go Lime Inc.' }, text: ['A', 'B'] },
  { id: 'leads', label: 'Lead reporting billboard', kind: 'billboard', x: 1808, w: 96, h: 58, district: 'marketing', ref: { type: 'role', org: 'Go Lime Inc.' }, text: ['LEADS', '12 MIN>10 S'] },
  { id: 'warp-5', label: 'Warp pipe', kind: 'warp', x: 1910, w: 22, h: 26, district: 'marketing', ref: { type: 'warp', to: 5 } },

  // Civic Center
  { id: 'cityscapes', label: 'CityScapes Park', kind: 'park', x: 1980, w: 88, h: 44, district: 'civic', ref: { type: 'project', name: 'CityScapes' }, text: ['CITYSCAPES'] },
  { id: 'pond', label: 'Duck Pond: Duck Flight', kind: 'pond', x: 2082, w: 76, h: 30, district: 'civic', ref: { type: 'game', id: 'duck' }, text: ['DUCK POND'] },
  { id: 'library', label: 'Learning Technique Library', kind: 'library', x: 2172, w: 96, h: 74, district: 'civic', ref: { type: 'project', name: 'Learning Technique Recommendation Engine' }, text: ['LIBRARY'], riser: 2220 },
  { id: 'cityhall', label: 'Kitchener City Hall', kind: 'hall', x: 2288, w: 112, h: 104, district: 'civic', ref: { type: 'civic' }, text: ['CITY HALL'] },
  { id: 'sevenafter', label: 'SevenAfter School', kind: 'school', x: 2414, w: 96, h: 80, district: 'civic', ref: { type: 'role', org: 'SevenAfter Technologies' }, text: ['SEVENAFTER'] },
  { id: 'warp-6', label: 'Warp pipe', kind: 'warp', x: 2540, w: 22, h: 26, district: 'civic', ref: { type: 'warp', to: 6 } },

  // Data District
  { id: 'super', label: 'Super.com Warehouse', kind: 'warehouse', x: 2610, w: 156, h: 66, district: 'data', ref: { type: 'role', org: 'Super.com' }, text: ['SUPER.COM'], riser: 2688 },
  { id: 'lake', label: 'Data Lake: pipelines', kind: 'watertower', x: 2784, w: 36, h: 96, district: 'data', ref: { type: 'pipelines' }, text: ['DATA', 'LAKE'], riser: 2802 },
  { id: 'warp-7', label: 'Warp pipe', kind: 'warp', x: 2860, w: 22, h: 26, district: 'data', ref: { type: 'warp', to: 7 } },

  // Builder's Yard
  { id: 'boggle', label: 'Boggle Zen Arcade', kind: 'arcade', x: 2934, w: 82, h: 62, district: 'yard', ref: { type: 'project', name: 'Boggle Zen' }, text: ['BOGGLE'] },
  { id: 'summit', label: 'SUMMIT (under construction)', kind: 'construction', x: 3036, w: 116, h: 108, district: 'yard', ref: { type: 'project', name: 'SUMMIT Financial Learning' }, text: ['SUMMIT'] },
  { id: 'warp-0', label: 'Warp pipe', kind: 'warp', x: 3166, w: 22, h: 26, district: 'yard', ref: { type: 'warp', to: 0 } },
];



// The warehouse junction every pipeline flows into.
export const JUNCTION_X = 2688;
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
