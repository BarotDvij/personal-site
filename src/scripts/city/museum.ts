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
    title: 'Wikipedia',
    note: 'Reading articles was a favourite pastime growing up. It was one of the first donations I set up once I started earning, and I once had an account for the occasional edit. This site is a wiki because of it.',
    link: { href: 'https://www.wikipedia.org/', label: 'Visit Wikipedia' },
    art: ['..wwww..', '.w....w.', 'wk....kw', 'wk....kw', 'wk.kk.kw', 'wkk..kkw', '.w....w.', '..wwww..'],
    colors: { w: '#c9c3b6', k: '#2a2233' },
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
  intro: string;
  lines: [string, string][];
  link: { href: string; label: string };
  art: string[];
  colors: Record<string, string>;
}

export const HISTORY: Wing[] = [
  {
    title: 'Wikipedia (2001)',
    intro: 'Launched in January 2001 as a free encyclopedia that anyone can edit, it grew into one of the most visited sites in the world.',
    lines: [
      ['Engineering', 'Open-source wiki software (MediaWiki) keeps a full revision history for every page, and heavy caching lets a nonprofit serve billions of page views on a small budget.'],
      ['Product', 'Plain, text-first pages that load fast on slow connections and old devices. Nothing gets in the way of reading.'],
      ['Product management', 'Run by volunteers through talk pages, consensus, and the famous "citation needed" tag, funded by donations to the Wikimedia Foundation with no ads, and published under a free licence.'],
    ],
    link: { href: 'https://en.wikipedia.org/wiki/History_of_Wikipedia', label: 'Read the history' },
    art: ['..wwww..', '.w....w.', 'wk....kw', 'wk....kw', 'wk.kk.kw', 'wkk..kkw', '.w....w.', '..wwww..'],
    colors: { w: '#c9c3b6', k: '#2a2233' },
  },
  {
    title: 'The 16-bit era (late 1980s to mid 1990s)',
    intro: 'The Sega Genesis and the Super Nintendo brought richer colour and sound to home consoles, all running from small cartridges.',
    lines: [
      ['Engineering', 'Worlds were built from small reusable tiles and sprites, colours came from tight palettes, and whole games fit in a few megabytes or less. Tricks like the Super Nintendo\'s Mode 7 faked 3D depth on flat hardware.'],
      ['Product', 'Games taught you by letting you play, with tight controls and first levels designed so you learn without a manual.'],
      ['Product management', 'A fixed hardware budget forced hard choices about what to keep and what to cut. That constraint became a style that games still borrow today.'],
    ],
    link: { href: 'https://en.wikipedia.org/wiki/History_of_video_game_consoles_(fourth_generation)', label: 'Read the history' },
    art: ['........', '.kkkkkk.', 'kgkkkkrk', 'gggkkbkr', 'kgkkkkbk', '.kkkkkk.', '........', '........'],
    colors: { k: '#5a5566', g: '#c9c3b6', r: '#e0302f', b: '#3b82f6' },
  },
  {
    title: 'What this city borrows',
    intro: 'Both proved that limits can drive great work, and that the best things can be free for everyone.',
    lines: [
      ['Optimization', 'Every building, sprite, and font in the city is drawn in code, with no image files. The Wiki view ships about 3 KB of JavaScript (gzipped) and reads fine with it turned off, the city loads only when you ask for it, and each arcade game downloads only when you press play.'],
      ['Creativity', 'Tiles, small palettes, warp pipes, and an underground layer, all borrowed from the 16-bit playbook and used to tell a career story.'],
      ['Values', 'Free to read, with no accounts, no ads, and no tracking. Like Wikipedia, the information is here for anyone who wants it.'],
    ],
    link: { href: 'https://en.wikipedia.org/wiki/Free_content', label: 'About free content' },
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

export function museumHtml() {
  return `<p class="lead">The games and sites that shaped this city. No console growing up meant a lot of browser games, and these are the ones that stuck.</p>
    <ul class="exhibits">${EXHIBITS.map(
      (e) => `<li class="exhibit">
        <span class="frame">${pixelSvg(e.art, e.colors)}</span>
        <span class="plaque"><strong>${esc(e.title)}</strong><br>${esc(e.note)}${
          e.link ? `<br><a href="${esc(e.link.href)}" target="_blank" rel="noopener">${esc(e.link.label)}<span class="ext" aria-label="(opens in a new tab)"> ↗</span></a>` : ''
        }</span>
      </li>`,
    ).join('')}</ul>
    <h3>History Wing</h3>
    <p>Two of the biggest inspirations for this site, and what they changed for engineering, product, and product management.</p>
    ${HISTORY.map(
      (w) => `<section class="wing">
        <span class="frame">${pixelSvg(w.art, w.colors)}</span>
        <div class="plaque"><strong>${esc(w.title)}</strong><br>${esc(w.intro)}
          <dl>${w.lines.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
          <a href="${esc(w.link.href)}" target="_blank" rel="noopener">${esc(w.link.label)}<span class="ext" aria-label="(opens in a new tab)"> ↗</span></a>
        </div>
      </section>`,
    ).join('')}
    <p>Want to play instead? Games inspired by Snake, Minesweeper, Chat Noir, tennis, Tetris, Pac-Man, Duck Life, chess, and Tank Trouble are in the <button type="button" class="game-btn inline" data-goto="arcade">Arcade Hall</button>.</p>`;
}
