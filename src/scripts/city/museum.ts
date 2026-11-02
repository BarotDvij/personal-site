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
    title: 'Cricket batting games',
    note: 'Mouse-controlled batting: time the swing and send it to the boundary.',
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
    <p>Want to play instead? Games inspired by Snake, Minesweeper, Chat Noir, tennis, Tetris, Pac-Man, Duck Life, chess, and Tank Trouble are in the <button type="button" class="game-btn inline" data-goto="arcade">Arcade Hall</button>.</p>`;
}
