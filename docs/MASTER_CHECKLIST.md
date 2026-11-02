# Master Checklist

Everything in one place. `[x]` done, `[ ]` left. Items marked **(you)** need input from Dvij.

---

## V1: Foundation, Wiki, City (built)

### Built
- [x] Astro site, self-hosted fonts, one content file (`content/profile.json`) feeding both views
- [x] The Wiki: infobox, highlights, citations, career, projects, hackathons, approach, skills, education, history, contact, references
- [x] "View as" lens filter, light and dark themes, print stylesheet, phone layout
- [x] Dvij City: 6 districts, pixel art drawn in code, day and night, underground data pipes with packets
- [x] Classic green warp pipes, copper data pipes, warehouse junction, Data Lake pipelines panel
- [x] Kitchener City Hall (civic life) and Hauser Furniture (AltaML)
- [x] HUD, minimap, guided tour (Prev and Next), deep links like `/#tour/genledge`
- [x] Street life, A/B billboard, crane, chiptune sound effects, Konami easter egg
- [x] Settings: view, theme, motion, sound
- [x] Wiki city banner, "Location in Dvij City" map, floating Explore button, pixel profile icons
- [x] Accessibility: keyboard, screen reader labels, reduced motion
- [x] Performance: Lighthouse 99 to 100, 60 fps at 6x CPU throttle, 2 KB Wiki JS
- [x] 404 page, OG image, sitemap, robots, JSON-LD
- [x] CI: type check, content tests, build
- [x] Vercel connected, merged to `main`, production live

- [x] Awards section in the Wiki (hackathons, DECA, JA, BLC, school) and a trophy case in the Visitor Center

### Left from V1
- [ ] **(you)** Final headline (current one is a draft)
- [ ] **(you)** Fun facts and hobbies for the Visitor Center
- [ ] **(you)** Square portrait
- [ ] **(you)** Go Lime ad footage, CityScapes and Urban Marble screenshots
- [ ] **(you)** Urban Marble stack: Mapbox or CesiumJS
- [ ] **(you)** Where you worked with each colleague in References
- [ ] **(you)** DECA and JA International details (event, year, placement, one line)
- [ ] **(you)** The rest of the cricket games line (message cut off)
- [ ] **(you)** Connect `dvijbarot.wiki` in Vercel and add the DNS records in Porkbun
- [ ] **(you)** Approve and submit the uwaterloo.network webring PR (`docs/WEBRING.md`)
- [ ] Remove duplicate Vercel project `personal-site-ag5a`

---

## Build order (confirmed Nov 2)

**Now (autonomous):**
1. Awards section in the Wiki (with hackathons) and a trophy case in the Visitor Center
2. The Arcade: shared shell, then all games
3. Character
4. Museum of Favourites
5. Fly-over intro

**Results (Nov 2 build):** all five done. Regression suite passes with zero console errors. Lighthouse mobile: Wiki 100 / 100 / 100 / 100 (layout shift 0 after preloading fonts), City 99 / 100 / 100 / 100. City holds 60 fps at 6x CPU throttle. Each game is 1 to 3 KB gzipped and loads only when played.

**Parked until Dvij is back:** media (portrait, ads, screenshots, budget check), "Early life" section, NPC dialogue, final launch pass, domain, webring

## V2: Plan (original draft)

1. **Finish V1 content:** headline, facts, portrait, media, early life (DECA, JA)
2. **The Arcade:** offline minigames
3. **Character and NPC:** walk the city, talk to a Sans-inspired local
4. **Museum of Favourites**
5. **Launch:** final audit, domain, launch post

### V2 Phase 1: Finish V1 content
- [ ] "Early life and education" section in the Wiki with DECA and JA wins
- [ ] Trophy case in the Visitor Center or a second Hall of Fame plaque
- [ ] Portrait in the infobox
- [ ] Billboards play Go Lime ads as small compressed loops, loaded only when on screen
- [ ] Project screenshots in CityScapes and Urban Marble panels
- [ ] Media budget check: page weight and Lighthouse stay where they are

---

## The Arcade

### Shared game shell (build once)
- [x] Arcade Hall (now in the Commercial District)
- [x] Game window: pixel frame, pause, restart, close, back to city
- [x] Controls: keyboard, touch, and on-screen buttons on phones
- [x] Each game is its own file, loaded only when started
- [x] Best scores saved on the device only (no server)
- [x] Credit line under each game: "Inspired by ..., which I played growing up"
- [x] Respects reduced motion and the sound setting
- [x] Test that the city stays at 60 fps after a game closes

### Games (easy first)
- [x] Packet Snake (Snake) inside the pipes
- [x] Bug Sweeper (Minesweeper) on the construction lot
- [x] Trap the Cat (Chat Noir) in the park
- [x] Rally (Tennis / Pong) in the Arcade
- [x] Block Stack (Tetris) in the Arcade. Credit line: how competitive Tetris started in high school
- [x] Pipe Muncher (Pac-Man) maze through the pipe network
- [x] Duck Flight (one Duck Life minigame) at the park pond
- [x] Chess, two players on one device, then a simple computer opponent
- [x] Tank Duel (Tank Trouble), two players on one keyboard

---

## Character

- [x] Original pixel sprite with idle and walk animations, day and night shading
- [x] Controls: arrow keys or WASD, on-screen D-pad on phones
- [x] Camera follows the character, free scrolling still works when idle
- [x] Walk up to a door and press a key (or tap) to open that building's panel
- [x] Drop into a warp pipe with a warp animation and sound, come out in the next district
- [ ] Optional: walk the underground pipes as a second layer
- [x] Keyboard-only and screen reader paths still work without the character
- [x] Character code loads with the city, stays under about 5 KB

---

## NPC (Sans-inspired, original design)

- [ ] **(you)** What he does and says (your message was cut off)
- [ ] Original relaxed skeleton character in our own pixel style
- [ ] Location: underground, as a nod to Undertale
- [ ] Dialogue box with typewriter text and a soft blip sound
- [ ] A few lines that point to real work (pipelines, hackathons) plus jokes
- [ ] Skippable, keyboard accessible, readable by screen readers

---

## Museum of Favourites

- [x] Museum building in the city
- [x] Exhibit hall layout: framed plaques along a gallery wall
- [x] One plaque per game: our own pixel art, why it mattered, link to the original
  - [x] Super Mario (warp pipes)
  - [x] Undertale (the underground)
  - [x] Red Ball
  - [x] Fireboy and Watergirl
  - [x] Run 2
  - [x] Cricket batting games
  - [x] Henry Stickmin series
  - [x] Stickman fighting games
- [x] Plaque for Wikipedia (why the site is a wiki)
- [x] Links open in a new tab with a clear "external" marker

---

## Launch

- [x] Fly-over intro camera (zoomed-out skyline swooping to street level)
- [ ] Final Lighthouse, accessibility, and phone pass
- [ ] Domain live on `dvijbarot.wiki`
- [ ] Webring widget in the footer
- [ ] Launch post drafted from `docs/STORY.md`
