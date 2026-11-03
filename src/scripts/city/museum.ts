// Museum of Favourites: plaques for the games and sites that shaped the city.
// Every link was checked when it was added. Thumbnails are tiny pixel grids.

interface Exhibit {
  title: string;
  note: string;
  link?: { href: string; label: string };
  art: string[];
  colors: Record<string, string>;
}

export const EXHIBITS: Exhibit[] = [
  {
    title: 'Super Mario',
    note: 'One of the first games I ever played. The green warp pipes that carry you around this city are a tribute.',
    link: { href: 'https://en.wikipedia.org/wiki/Super_Mario_Bros.', label: 'Read about it' },
    art: ['gggggggg', 'gGGggggg', 'gGGggggg', '.gGggg..', '.gGggg..', '.gGggg..', '.gGggg..', '.gGggg..'],
    colors: { g: '#008c00', G: '#a4cb0e' },
  },
  {
    title: 'Undertale',
    note: 'The game that made me fall in love with the idea of gaming. The underground layer of this city is a nod to it.',
    link: { href: 'https://undertale.com/', label: 'Official site' },
    art: ['........', '.rr..rr.', 'rrrrrrrr', 'rrrrrrrr', '.rrrrrr.', '..rrrr..', '...rr...', '........'],
    colors: { r: '#e0302f' },
  },
  {
    title: 'Red Ball',
    note: 'A side-scrolling platformer with puzzles, and a staple of the browser-game years.',
    link: { href: 'https://www.coolmathgames.com/0-red-ball-4', label: 'Play it' },
    art: ['..rrrr..', '.rrrrrr.', 'rrwrrwrr', 'rrkrrkrr', 'rrrrrrrr', 'rrkkkkrr', '.rrrrrr.', '..rrrr..'],
    colors: { r: '#e0302f', w: '#ffffff', k: '#2a2233' },
  },
  {
    title: 'Fireboy and Watergirl',
    note: 'Two characters, one keyboard, and a lot of teamwork.',
    link: { href: 'https://www.coolmathgames.com/0-fireboy-and-water-girl-in-the-forest-temple', label: 'Play it' },
    art: ['..o.....', '.oo...b.', '.ooo..b.', 'oyyo.bbb', 'oyyo.bwb', '.oo..bbb', '.oo...b.', '........'],
    colors: { o: '#f28c28', y: '#e8c547', b: '#3b82f6', w: '#9fd0ff' },
  },
  {
    title: 'Run 2',
    note: 'The endless runner through space tunnels, played on Coolmath.',
    link: { href: 'https://www.coolmathgames.com/0-run-2', label: 'Play it' },
    art: ['...gg...', '..gggg..', '..gkgk..', '...gg...', '..gggg..', '.g.gg.g.', '...gg...', '..g..g..'],
    colors: { g: '#9aa3ad', k: '#2a2233' },
  },
  {
    title: 'Hanger',
    note: 'Swing from rope to rope with a ragdoll who loses a limb on every bad landing. Simple physics, endless replays.',
    link: { href: 'https://www.kongregate.com/en/games/chribbe1/hanger', label: 'Play it' },
    art: ['...y....', '...y....', '...y....', '...k....', '..kkk...', '.k.k.k..', '...k....', '..k.k...'],
    colors: { y: '#d9b878', k: '#2a2233' },
  },
  {
    title: 'Top Spinner Cricket',
    note: 'Mouse-controlled batting: time the swing and send it to the boundary.',
    link: { href: 'https://www.y8.com/games/top_spinner_cricket', label: 'Play it' },
    art: ['.......w', '......w.', '.....ww.', '....ww..', '...ww...', '..ww....', '.w....r.', 'w.....rr'],
    colors: { w: '#d9b878', r: '#e0302f' },
  },
  {
    title: 'Henry Stickmin',
    note: 'Choose a path, watch it go wrong in the funniest possible way, try again.',
    link: { href: 'https://www.innersloth.com/games/the-henry-stickmin-collection/', label: 'Official site' },
    art: ['...kk...', '...kk...', '..kkkk..', '.k.kk.k.', '...kk...', '...kk...', '..k..k..', '.k....k.'],
    colors: { k: '#2a2233' },
  },
  {
    title: 'Stickman fighting games',
    note: 'Button-mashing duels between stick figures, best with a friend on the same keyboard.',
    art: ['k......r', 'kk....rr', '.k.kk.r.', 'kkk..rrr', '.k....r.', '.k....r.', 'k.k..r.r', 'k.k..r.r'],
    colors: { k: '#2a2233', r: '#e0457b' },
  },
];

// History Wing: where the ideas behind this site came from. Facts are kept
// general and checked against the linked Wikipedia articles.

interface Wing {
  title: string;
  personal?: string; // what it means to Dvij, shown before the history
  intro: string;
  lines: [string, string][];
  links: { href: string; label: string }[];
  art: string[];
  colors: Record<string, string>;
}

// How the site is built. Shared by the museum and the Post Office.
export const BUILT: [string, string][] = [
  ['Optimization', 'Every building, sprite, and font in the city is drawn in code, with no image files. The Wiki view ships about 3 KB of JavaScript (gzipped) and reads fine with it turned off, the city loads only when you ask for it, and each arcade game downloads only when you press play.'],
  ['Creativity', 'Tiles, small palettes, warp pipes, and an underground layer, all borrowed from the 16-bit playbook and used to tell a career story.'],
  ['Values', 'Free to read, with no accounts, no ads, and no tracking. Like Wikipedia, the information is here for anyone who wants it.'],
];

export const HISTORY: Wing[] = [
  {
    title: 'Wikipedia (2001)',
    personal: 'I used to read Wikipedia for hours as a kid, and it was the first recurring donation I set up once I started earning. This site is a wiki because of it.',
    intro: 'Launched in January 2001 as a free encyclopedia that anyone can edit, it grew into one of the most visited sites in the world.',
    lines: [
      ['Engineering', 'Open-source wiki software (MediaWiki) keeps a full revision history for every page, and heavy caching lets a nonprofit serve billions of page views on a small budget.'],
      ['Product', 'Plain, text-first pages that load fast on slow connections and old devices. Nothing gets in the way of reading.'],
      ['Product management', 'Run by volunteers through talk pages, consensus, and the famous "citation needed" tag, funded by donations to the Wikimedia Foundation with no ads, and published under a free licence.'],
    ],
    links: [{ href: 'https://en.wikipedia.org/wiki/History_of_Wikipedia', label: 'Read the history' }],
    art: ['..wwww..', '.w....w.', 'wk....kw', 'wk....kw', 'wk.kk.kw', 'wkk..kkw', '.w....w.', '..wwww..'],
    colors: { w: '#c9c3b6', k: '#2a2233' },
  },
  {
    title: 'The 16-bit era (late 1980s to mid 1990s)',
    personal: 'My first console was a Game Boy. The design language of that era, with crisp pixel art, simple controls, and levels that teach you as you play, carried straight into the free browser games I grew up on.',
    intro: 'The Sega Genesis and the Super Nintendo brought richer colour and sound to home consoles, all running from small cartridges.',
    lines: [
      ['Engineering', 'Worlds were built from small reusable tiles and sprites, colours came from tight palettes, and whole games fit in a few megabytes or less. Tricks like the Super Nintendo\'s Mode 7 faked 3D depth on flat hardware.'],
      ['Product', 'Games taught you by letting you play, with tight controls and first levels designed so you learn without a manual.'],
      ['Product management', 'A fixed hardware budget forced hard choices about what to keep and what to cut. That constraint became a style that games still borrow today.'],
    ],
    links: [{ href: 'https://en.wikipedia.org/wiki/History_of_video_game_consoles_(fourth_generation)', label: 'Read the history' }],
    art: ['........', '.kkkkkk.', 'kgkkkkrk', 'gggkkbkr', 'kgkkkkbk', '.kkkkkk.', '........', '........'],
    colors: { k: '#5a5566', g: '#c9c3b6', r: '#e0302f', b: '#3b82f6' },
  },
  {
    title: 'Urban planning and walkable cities',
    personal: 'I love urban planning, walkable cities, and public transit, and that love is why this site is a city. Creators and organizations like City Beautiful, Strong Towns, and Not Just Bikes are a big part of how I got into it.',
    intro: 'The case for walkable cities is simple: daily life works better when it is reachable on foot, by bike, and by transit, not only by car.',
    lines: [
      ['Engineering', 'Transit is systems design. Lines, transfers, and frequency decide whether a city connects or splits apart.'],
      ['Product', 'Walkable streets are designed around the person on foot, with homes, shops, and work close together so a short walk covers a lot of daily life.'],
      ['Product management', 'Strong Towns argues for small, incremental changes a town can afford to maintain, instead of giant projects it can\'t.'],
      ['In this city', 'You explore on foot, the warp pipes run like a transit line between districts, and the Mixed-Use Zone puts offices, a billboard, and a showroom on one block.'],
    ],
    links: [
      { href: 'https://www.youtube.com/@CityBeautiful', label: 'City Beautiful' },
      { href: 'https://www.strongtowns.org/', label: 'Strong Towns' },
      { href: 'https://www.youtube.com/@NotJustBikes', label: 'Not Just Bikes' },
    ],
    art: ['........', 'yyyyyyyy', 'ywwywwyy', 'ywwywwyy', 'yyyyyyyy', 'yyyyyyyy', '.kk..kk.', 'gggggggg'],
    colors: { y: '#e8c547', w: '#9fd0ff', k: '#2a2233', g: '#5a5566' },
  },
  {
    title: 'What this city borrows',
    intro: 'All three proved that limits can drive great work, and that the best things can be free for everyone.',
    lines: BUILT,
    links: [{ href: 'https://en.wikipedia.org/wiki/Free_content', label: 'About free content' }],
    art: ['........', '.....y..', '.kk..y..', '.kk.kkk.', 'kkk.kkk.', 'kkkkkkkk', 'gggggggg', 'gggggggg'],
    colors: { k: '#2a2233', y: '#e8c547', g: '#3fb950' },
  },
];

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function pixelSvg(art: string[], colors: Record<string, string>) {
  const rects = art
    .flatMap((row, y) => [...row].map((ch, x) => (colors[ch] ? `<rect x="${x}" y="${y}" width="1" height="1" fill="${colors[ch]}"/>` : '')))
    .join('');
  return `<svg viewBox="0 0 8 8" width="48" height="48" aria-hidden="true" shape-rendering="crispEdges">${rects}</svg>`;
}

const extLink = (l: { href: string; label: string }) =>
  `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}<span class="ext" aria-label="(opens in a new tab)"> ↗</span></a>`;

export function museumHtml() {
  return `<p class="lead">The sites, games, and ideas behind this city. A love of urban planning, walkable cities, and public transit is the reason this site is a city at all, and the rest of it is built on the free web I grew up with.</p>
    <h3>What inspires this web city</h3>
    ${HISTORY.map(
      (w) => `<section class="wing">
        <span class="frame">${pixelSvg(w.art, w.colors)}</span>
        <div class="plaque"><strong>${esc(w.title)}</strong>${w.personal ? `<p class="why">${esc(w.personal)}</p>` : ''}<p class="intro">${esc(w.intro)}</p>
          <dl>${w.lines.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
          <p class="links">${w.links.map(extLink).join(' ')}</p>
        </div>
      </section>`,
    ).join('')}
    <h3>Favourite games</h3>
    <p>The games that shaped this city's accessibility, optimization, and childlike creativity. No console growing up meant a lot of free browser games, and these are the ones that stuck.</p>
    <ul class="exhibits">${EXHIBITS.map(
      (e) => `<li class="exhibit">
        <span class="frame">${pixelSvg(e.art, e.colors)}</span>
        <span class="plaque"><strong>${esc(e.title)}</strong><br>${esc(e.note)}${e.link ? `<br>${extLink(e.link)}` : ''}</span>
      </li>`,
    ).join('')}</ul>
    <p>Want to play instead? Games inspired by Snake, Minesweeper, Chat Noir, tennis, Tetris, Pac-Man, Duck Life, chess, and Tank Trouble are in the <button type="button" class="game-btn inline" data-goto="arcade">Arcade Hall</button>.</p>`;
}
