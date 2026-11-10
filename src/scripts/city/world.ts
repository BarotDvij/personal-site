// Dvij City layout, in world pixels. The world is drawn at a tiny base
// resolution and scaled up by whole numbers so the pixel art stays crisp.

export const WORLD_W = 3230;
export const WORLD_H = 270;
export const GROUND = 176; // y of the street surface
export const TRUNK_Y = GROUND + 58; // main underground pipeline
export const DEEP_Y = GROUND + 78; // second, deeper pipeline

export type Lens = 'marketing' | 'data' | 'pm' | 'ai' | 'dev' | 'downtown';

export const LENS_COLOR: Record<Lens | 'plaza' | 'play', string> = {
  plaza: '#e8c547',
  play: '#22b8cf',
  marketing: '#c62828', // Mixed-Use Zone red
  pm: '#f2a33a',
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
  { id: 'data', name: 'Industrial Zone', lens: 'data', x0: 200, x1: 650 },
  { id: 'ai', name: 'Downtown AI District', lens: 'ai', x0: 650, x1: 1200 },
  { id: 'commercial', name: 'City Square', lens: 'play', x0: 1200, x1: 1740 },
  { id: 'marketing', name: 'Mixed-Use Zone', lens: 'marketing', x0: 1740, x1: 2280 },
  { id: 'civic', name: 'Civic Centre', lens: 'pm', x0: 2280, x1: 2914 },
  { id: 'yard', name: 'Expansion', lens: 'dev', x0: 2914, x1: 3230 },
];

export type Ref =
  | { type: 'role'; org: string }
  | { type: 'project'; name: string }
  | { type: 'trophies' }
  | { type: 'contact' }
  | { type: 'hackathons' }
  | { type: 'pipelines' }
  | { type: 'civic' }
  | { type: 'client' }
  | { type: 'arcade' }
  | { type: 'museum' }
  | { type: 'game'; id: string }
  | { type: 'warp'; to: number };

export type Kind =
  | 'kiosk' | 'monument' | 'post' | 'shop' | 'billboard' | 'hall' | 'studio' | 'park'
  | 'tower' | 'lab' | 'marble' | 'warehouse' | 'library' | 'watertower' | 'arcade'
  | 'grocer' | 'construction' | 'warp' | 'furniture' | 'school' | 'arcadehall' | 'pond' | 'museum' | 'showroom' | 'lawn' | 'refinery' | 'hq' | 'mediahq' | 'glass'
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
}

export const STRUCTURES: Structure[] = [
  // Welcome Plaza
  { id: 'post', label: 'Post Office: about and contact', kind: 'post', x: 44, w: 72, h: 56, district: 'plaza', ref: { type: 'contact' }, text: ['POST'] },
  { id: 'warp-1', label: 'Warp pipe', kind: 'warp', x: 160, w: 22, h: 26, district: 'plaza', ref: { type: 'warp', to: 1 } },

  // Industrial Zone
  { id: 'truck', label: 'Data Truck: Block Stack', kind: 'loadtruck', x: 206, w: 32, h: 20, district: 'data', ref: { type: 'game', id: 'blocks' } },
  { id: 'lake', label: 'Data Lake: pipelines', kind: 'watertower', x: 240, w: 36, h: 96, district: 'data', ref: { type: 'pipelines' }, text: ['DATA', 'LAKE'], riser: 258 },
  { id: 'genledge', label: 'GenLedge Data Refinery', kind: 'refinery', x: 296, w: 120, h: 82, district: 'data', ref: { type: 'role', org: 'GenLedge' }, text: ['GENLEDGE'], riser: 356 },
  { id: 'super', label: 'Super.com Warehouse', kind: 'warehouse', x: 432, w: 156, h: 66, district: 'data', ref: { type: 'role', org: 'Super.com' }, text: ['SUPER.COM'], riser: 510 },
  { id: 'warp-2', label: 'Warp pipe', kind: 'warp', x: 610, w: 22, h: 26, district: 'data', ref: { type: 'warp', to: 2 } },

  // Downtown AI District
  { id: 'podium', label: 'Podium: hackathon wins', kind: 'monument', x: 690, w: 112, h: 66, district: 'ai', ref: { type: 'hackathons' }, text: ['PODIUM'] },
  { id: 'knowidea', label: 'KnowIdea Research Tower', kind: 'glass', x: 822, w: 72, h: 146, district: 'ai', ref: { type: 'role', org: 'KnowIdea Inc.' }, text: ['KNOWIDEA'], riser: 858 },
  { id: 'marble', label: 'Urban Marble Tower', kind: 'marble', x: 914, w: 48, h: 160, district: 'ai', ref: { type: 'project', name: 'Urban Marble' }, text: ['1ST'], riser: 938 },
  { id: 'altaml', label: 'AltaML x Communitech', kind: 'hq', x: 982, w: 76, h: 152, district: 'ai', ref: { type: 'role', org: 'AltaML Inc.' }, text: ['ALTAML', 'COMMUNITECH'], riser: 1020 },
  { id: 'hauser', label: 'Hauser Furniture: our enterprise client', kind: 'furniture', x: 1076, w: 68, h: 66, district: 'ai', ref: { type: 'client' }, text: ['HAUSER'] },
  { id: 'warp-3', label: 'Warp pipe', kind: 'warp', x: 1162, w: 22, h: 26, district: 'ai', ref: { type: 'warp', to: 3 } },

  // City Square
  { id: 'patio', label: 'Eco Eats Patio: Pipe Muncher', kind: 'patio', x: 1208, w: 30, h: 24, district: 'commercial', ref: { type: 'game', id: 'muncher' } },
  { id: 'ecoeats', label: 'Eco Eats Grocer', kind: 'grocer', x: 1240, w: 84, h: 56, district: 'commercial', ref: { type: 'project', name: 'Eco Eats Advisor' }, text: ['ECO EATS'], riser: 1282 },
  { id: 'arcade', label: 'Arcade Hall: play games', kind: 'arcadehall', x: 1344, w: 100, h: 94, district: 'commercial', ref: { type: 'arcade' }, text: ['ARCADE'] },
  { id: 'museum', label: 'Museum of Favourites', kind: 'museum', x: 1462, w: 132, h: 98, district: 'commercial', ref: { type: 'museum' }, text: ['MUSEUM'] },
  { id: 'halloffame', label: 'Hall of Fame: trophy case', kind: 'kiosk', x: 1612, w: 76, h: 52, district: 'commercial', ref: { type: 'trophies' }, text: ['HALL OF FAME'] },
  { id: 'warp-4', label: 'Warp pipe', kind: 'warp', x: 1708, w: 22, h: 26, district: 'commercial', ref: { type: 'warp', to: 4 } },

  // Mixed-Use Zone
  { id: 'golime', label: 'Go Lime HQ', kind: 'mediahq', x: 1780, w: 92, h: 140, district: 'marketing', ref: { type: 'role', org: 'Go Lime Inc.' }, text: ['GO LIME'], riser: 1826 },
  { id: 'occ', label: 'Ontario Chamber of Commerce', kind: 'tower', x: 1890, w: 72, h: 150, district: 'marketing', ref: { type: 'role', org: 'Ontario Chamber of Commerce' }, text: ['CHAMBER OF', 'COMMERCE'], riser: 1926 },
  { id: 'leads', label: 'Lead reporting billboard', kind: 'billboard', x: 1980, w: 96, h: 58, district: 'marketing', ref: { type: 'role', org: 'Go Lime Inc.' }, text: ['LEADS', '12 MIN > 10 S'] },
  { id: 'mower', label: 'Robot Mower: Lawn Sweeper', kind: 'lawn', x: 2094, w: 40, h: 14, district: 'marketing', ref: { type: 'game', id: 'sweeper' } },
  { id: 'swap', label: 'Swap Robotics Showroom', kind: 'showroom', x: 2134, w: 70, h: 62, district: 'marketing', ref: { type: 'role', org: 'Swap Robotics' }, text: ['SWAP ROBOTICS'] },
  { id: 'warp-5', label: 'Warp pipe', kind: 'warp', x: 2240, w: 22, h: 26, district: 'marketing', ref: { type: 'warp', to: 5 } },

  // Civic Centre
  { id: 'chess', label: 'Chess in the Park', kind: 'chesstable', x: 2288, w: 28, h: 16, district: 'civic', ref: { type: 'game', id: 'chess' } },
  { id: 'cityscapes', label: 'CityScapes Park', kind: 'park', x: 2320, w: 88, h: 44, district: 'civic', ref: { type: 'project', name: 'CityScapes' }, text: ['CITYSCAPES'] },
  { id: 'pond', label: 'Duck Pond: Duck Flight', kind: 'pond', x: 2422, w: 76, h: 30, district: 'civic', ref: { type: 'game', id: 'duck' }, text: ['DUCK POND'] },
  { id: 'cityhall', label: 'Kitchener City Hall', kind: 'hall', x: 2512, w: 112, h: 104, district: 'civic', ref: { type: 'civic' }, text: ['CITY HALL'] },
  { id: 'library', label: 'Learning Technique Library', kind: 'library', x: 2644, w: 96, h: 74, district: 'civic', ref: { type: 'project', name: 'Learning Technique Recommendation Engine' }, text: ['LIBRARY'], riser: 2692 },
  { id: 'sevenafter', label: 'SevenAfter School', kind: 'school', x: 2754, w: 96, h: 80, district: 'civic', ref: { type: 'role', org: 'SevenAfter Technologies' }, text: ['SEVENAFTER'] },
  { id: 'warp-6', label: 'Warp pipe', kind: 'warp', x: 2874, w: 22, h: 26, district: 'civic', ref: { type: 'warp', to: 6 } },

  // Expansion
  { id: 'boggle', label: 'Boggle Zen (under construction)', kind: 'arcade', x: 2954, w: 82, h: 62, district: 'yard', ref: { type: 'project', name: 'Boggle Zen' }, text: ['BOGGLE'] },
  { id: 'summit', label: 'SUMMIT (under construction)', kind: 'construction', x: 3056, w: 116, h: 108, district: 'yard', ref: { type: 'project', name: 'SUMMIT Financial Learning' }, text: ['SUMMIT'] },
  { id: 'warp-0', label: 'Warp pipe', kind: 'warp', x: 3190, w: 22, h: 26, district: 'yard', ref: { type: 'warp', to: 0 } },
];



// The warehouse junction every pipeline flows into.
export const JUNCTION_X = 510;
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
