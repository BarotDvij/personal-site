# dvijbarot.wiki

Dvij Barot's personal site. Two ways in:

- **The Wiki** (default): a fast, scannable article with an infobox, citations, and a "View as" lens filter.
- **Dvij City** (`/#tour`): a 16-bit city where every building is a role or project and the copper pipes underground are data pipelines.

Both read from one file, [`content/profile.json`](content/profile.json).

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:4321. Add `#tour` to the URL to jump straight into the city.

```bash
npm run build && npm run preview
```

## Edit content

Change `content/profile.json` and both modes update.

- `experience[].journey: false` keeps a role in the Wiki only (not in the City)
- `lenses` on each item drive the Wiki's "View as" filter
- `highlights` feed the Wiki stat strip and the City's score ticker

To move or add a building, edit `STRUCTURES` in [`src/scripts/city/world.ts`](src/scripts/city/world.ts). Each structure has a `kind` (its look), a position, and a `ref` that points at a role or project in `profile.json`.

## How it's built

| Piece | Where |
|---|---|
| Page and layout | `src/pages/index.astro`, `src/layouts/Base.astro` |
| Wiki | `src/components/Wiki.astro` |
| City shell (HUD, panels) | `src/components/City.astro` |
| City engine (camera, input, loop) | `src/scripts/city/engine.ts` |
| City pixel art (drawn in code) | `src/scripts/city/art.ts` |
| City map | `src/scripts/city/world.ts` |
| Settings (view, theme, motion, sound) | `src/components/Settings.astro`, `src/scripts/prefs.ts` |
| Chiptune sound effects | `src/scripts/sfx.ts` |
| Adaptive quality | `src/scripts/quality.ts` |

### Performance rules

- The Wiki ships about 2 KB of JavaScript. The City (about 15 KB gzipped) loads only when someone opens the tour.
- The city renders at a tiny base resolution and scales up by whole numbers, so pixels stay crisp and the GPU does almost nothing.
- Static scenery is drawn once into an offscreen canvas. Each frame only blits it and draws clouds, packets, and beacons.
- Quality starts from a hardware hint, then measures real frame times and drops to a lighter tier if a device can't keep up.
- `prefers-reduced-motion` is respected, and visitors can override it in Settings.

## Deploy

Import the repo at [vercel.com/new](https://vercel.com/new). Astro is detected automatically. Each branch gets a preview URL, and `main` is production. Add `dvijbarot.wiki` under Project Settings, Domains, then copy the DNS records Vercel shows into Porkbun.

## Webring

To join [uwaterloo.network](https://www.uwaterloo.network), open a PR to `Shayaan-Azeem/waterloo.network` adding a 400×400 photo and an entry in `src/data/members.ts`. Once merged, put their widget in the footer slot (`[data-webring-slot]` in `Wiki.astro`):

```html
<script src="https://uwaterloo.network/embed.js" data-webring data-user="your-id"></script>
```
