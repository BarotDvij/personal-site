// Dvij City layout, in world pixels. The world is drawn at a tiny base
// resolution and scaled up by whole numbers so the pixel art stays crisp.

export const WORLD_W = 2885;
export const WORLD_H = 266;
export const GROUND = 182; // y of the street surface
export const TRUNK_Y = GROUND + 58; // main underground pipeline
export const DEEP_Y = GROUND + 78; // second, deeper pipeline

export type Lens = 'marketing' | 'data' | 'pm' | 'ai' | 'dev' | 'downtown';

export const LENS_COLOR: Record<Lens | 'plaza' | 'play', string> = {
  plaza: '#e8c547',
  play: '#22b8cf',
  marketing: '#c62828',
  pm: '#c62828', // Civic Centre red
  ai: '#7c4ddb',
  data: '#ff6fb5', // Super.com pink
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
  { id: 'plaza', name: 'Welcome Plaza', lens: 'plaza', x0: 0, x1: 200 },
  { id: 'data', name: 'Industrial Zone', lens: 'data', x0: 200, x1: 730 },
  { id: 'ai', name: 'Downtown', lens: 'ai', x0: 730, x1: 1380 },
  { id: 'commercial', name: 'City Square', lens: 'play', x0: 1380, x1: 1824 },
  { id: 'civic', name: 'Civic Centre', lens: 'pm', x0: 1824, x1: 2567 },
  { id: 'yard', name: 'Expansion', lens: 'dev', x0: 2567, x1: 2885 },
];

export type Ref =
  | { type: 'role'; org: string }
  | { type: 'project'; name: string }
  | { type: 'trophies' }
  | { type: 'contact' }
  | { type: 'pipelines' }
  | { type: 'civic' }
  | { type: 'arcade' }
  | { type: 'museum' }
  | { type: 'game'; id: string }
  | { type: 'warp'; to: number };

export type Kind =
  | 'pyramid' | 'parksign' | 'restaurant' | 'post' | 'shop' | 'hall' | 'studio' | 'park'
  | 'tower' | 'lab' | 'marble' | 'warehouse' | 'library' | 'watertower' | 'arcade'
  | 'construction' | 'warp' | 'school' | 'arcadehall' | 'pond' | 'museum' | 'showroom' | 'lawn' | 'refinery' | 'hq' | 'mediahq' | 'glass'
  | 'loadtruck' | 'chesstable' | 'patio';

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
  tagGapScale?: number; // multiplies the gap between the hit box top and its name tag (default 1)
  tagAt?: number; // show the name tag inside the hit box, its bottom edge at this fraction of the height
}

export const STRUCTURES: Structure[] = [
  // Welcome Plaza
  { id: 'post', label: 'Post Office: about and contact', kind: 'post', x: 44, w: 72, h: 56, district: 'plaza', ref: { type: 'contact' }, text: ['POST'] },
  { id: 'warp-1', label: 'Warp pipe', kind: 'warp', x: 160, w: 22, h: 26, district: 'plaza', ref: { type: 'warp', to: 1 } },

  // Industrial Zone
  { id: 'truck', label: 'Block Stack GAME', kind: 'loadtruck', x: 206, w: 32, h: 20, district: 'data', ref: { type: 'game', id: 'blocks' } },
  { id: 'lake', label: 'Data Lake: pipelines', kind: 'watertower', x: 240, w: 36, h: 96, district: 'data', ref: { type: 'pipelines' }, text: ['DATA', 'LAKE'], riser: 258 },
  { id: 'genledge', label: 'GenLedge Data Refinery', kind: 'refinery', x: 296, w: 120, h: 100, district: 'data', ref: { type: 'role', org: 'GenLedge' }, text: ['GENLEDGE'], riser: 356 },
  { id: 'super', label: 'Super.com Warehouse', kind: 'warehouse', x: 432, w: 117, h: 62, district: 'data', ref: { type: 'role', org: 'Super.com' }, text: ['SUPER.COM'], riser: 491 },
  { id: 'mower', label: 'Lawn Sweeper GAME', kind: 'lawn', x: 566, w: 40, h: 14, district: 'data', ref: { type: 'game', id: 'sweeper' } },
  { id: 'swap', label: 'Swap Robotics Showroom', kind: 'showroom', x: 606, w: 70, h: 62, district: 'data', ref: { type: 'role', org: 'Swap Robotics' }, text: ['SWAP ROBOTICS'] },
  { id: 'warp-2', label: 'Warp pipe', kind: 'warp', x: 694, w: 22, h: 26, district: 'data', ref: { type: 'warp', to: 2 } },

  // Downtown
  { id: 'knowidea', label: 'KnowIdea Research HQ', kind: 'glass', x: 754, w: 52, h: 161, district: 'ai', ref: { type: 'role', org: 'KnowIdea Inc.' }, text: ['KNOWIDEA'], riser: 778 },
  { id: 'marble', label: 'Urban Marble Tower', kind: 'marble', x: 834, w: 48, h: 164, district: 'ai', ref: { type: 'project', name: 'Urban Marble' }, text: ['1ST'], riser: 858 },
  { id: 'patio', label: 'Pipe Muncher GAME', kind: 'patio', x: 896, w: 48, h: 28, district: 'ai', ref: { type: 'game', id: 'muncher' } },
  { id: 'ecoeats', label: 'Eco Eats Restaurant', kind: 'restaurant', x: 946, w: 84, h: 60, district: 'ai', ref: { type: 'project', name: 'Eco Eats Advisor' }, text: ['ECO EATS'], riser: 988 },
  { id: 'golime', label: 'Go Lime HQ', kind: 'mediahq', x: 1058, w: 80, h: 151, district: 'ai', ref: { type: 'role', org: 'Go Lime Inc.' }, text: ['GO LIME'], riser: 1098 },
  { id: 'altaml', label: 'AltaML x Communitech for Hauser Industries', kind: 'hq', x: 1164, w: 160, h: 174, district: 'ai', ref: { type: 'role', org: 'AltaML Inc.' }, text: ['ALTAML', 'COMMUNITECH'], riser: 1244, tagAt: 0.55 },
  { id: 'warp-3', label: 'Warp pipe', kind: 'warp', x: 1344, w: 22, h: 26, district: 'ai', ref: { type: 'warp', to: 3 } },

  // City Square
  { id: 'arcade', label: 'Arcade Hall: play games', kind: 'arcadehall', x: 1400, w: 75, h: 70, district: 'commercial', ref: { type: 'arcade' }, text: ['ARCADE'] },
  { id: 'museum', label: 'Museum of Favourites', kind: 'museum', x: 1492, w: 119, h: 92, district: 'commercial', ref: { type: 'museum' }, text: ['MUSEUM'] },
  { id: 'halloffame', label: 'Hall of Fame: hackathons and awards', kind: 'pyramid', x: 1630, w: 140, h: 85, district: 'commercial', ref: { type: 'trophies' }, text: ['HALL OF FAME'] },
  { id: 'warp-4', label: 'Warp pipe', kind: 'warp', x: 1788, w: 22, h: 26, district: 'commercial', ref: { type: 'warp', to: 4 } },

  // Civic Centre
  { id: 'occ', label: 'Ontario Chamber of Commerce', kind: 'tower', x: 1846, w: 72, h: 167, district: 'civic', ref: { type: 'role', org: 'Ontario Chamber of Commerce' }, text: ['CHAMBER OF', 'COMMERCE'], riser: 1882 },
  { id: 'cityhall', label: 'Kitchener City Hall', kind: 'hall', x: 1936, w: 112, h: 104, district: 'civic', ref: { type: 'civic' }, text: ['CITY HALL'] },
  { id: 'parksign', label: 'Urban Park', kind: 'parksign', x: 2062, w: 28, h: 26, district: 'civic', text: ['URBAN', 'PARK'] },
  { id: 'chess', label: 'Chess GAME', kind: 'chesstable', x: 2094, w: 28, h: 16, district: 'civic', ref: { type: 'game', id: 'chess' }, tagGapScale: 0.5 },
  { id: 'cityscapes', label: 'CityScapes Park', kind: 'park', x: 2130, w: 76, h: 44, district: 'civic', ref: { type: 'project', name: 'CityScapes' }, text: ['CITYSCAPES'] },
  { id: 'pond', label: 'Duck Flight GAME', kind: 'pond', x: 2206, w: 65, h: 27, district: 'civic', ref: { type: 'game', id: 'duck' }, text: ['DUCK POND'] },
  { id: 'library', label: 'Learning Technique Library', kind: 'library', x: 2301, w: 96, h: 74, district: 'civic', ref: { type: 'project', name: 'Learning Technique Recommendation Engine' }, text: ['LIBRARY'], riser: 2349 },
  { id: 'sevenafter', label: 'SevenAfter School', kind: 'school', x: 2413, w: 96, h: 80, district: 'civic', ref: { type: 'role', org: 'SevenAfter Technologies' }, text: ['SEVENAFTER'] },
  { id: 'warp-5', label: 'Warp pipe', kind: 'warp', x: 2531, w: 22, h: 26, district: 'civic', ref: { type: 'warp', to: 5 } },

  // Expansion
  { id: 'boggle', label: 'Boggle Zen (under construction)', kind: 'arcade', x: 2607, w: 82, h: 62, district: 'yard', ref: { type: 'project', name: 'Boggle Zen' }, text: ['BOGGLE'] },
  { id: 'summit', label: 'SUMMIT (under construction)', kind: 'construction', x: 2709, w: 116, h: 108, district: 'yard', ref: { type: 'project', name: 'SUMMIT Financial Learning' }, text: ['SUMMIT'] },
  { id: 'warp-0', label: 'Warp pipe', kind: 'warp', x: 2843, w: 22, h: 26, district: 'yard', ref: { type: 'warp', to: 0 } },
];



// The warehouse junction every pipeline flows into.
export const JUNCTION_X = 491; // centre of the Super.com warehouse
// Where the deep line to the Data Lake drops out of the warehouse tank: the
// side of the tank that faces the lake.
const LAKE_RISER = STRUCTURES.find((s) => s.id === 'lake')!.riser!;
export const DEEP_X = JUNCTION_X + (LAKE_RISER < JUNCTION_X ? -20 : 20);
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
      ? [[DEEP_X, TANK_BOTTOM], [DEEP_X, y], [s.riser!, y], [s.riser!, GROUND + 4]]
      : [[s.riser!, GROUND + 4], [s.riser!, y], [JUNCTION_X, y], [JUNCTION_X, TANK_BOTTOM]],
  };
});

export const districtAt = (x: number) =>
  Math.max(0, DISTRICTS.findIndex((d) => x >= d.x0 && x < d.x1));
