# Autonomous Build Checklist

Working branch: `feat/scaffold`. Every finished item is committed and pushed.
Decisions made without asking are logged at the bottom so they are easy to review and reverse.

## Phase 1: Foundation
- [x] Astro + self-hosted fonts (Inter Tight, Silkscreen). GSAP removed: the city runs on plain canvas, so it was dead weight
- [x] Content file `content/profile.json` (single source of truth for both modes)
- [x] Preferences module (mode, theme, motion, sound) with pre-paint bootstrap
- [x] Chiptune sound effects synthesized in code (no audio files)
- [x] Adaptive quality: hardware hint, then measured frame times

## Phase 2: Dvij City (Journey mode v1)
- [x] World map: 6 districts, 22 structures, pipe routes
- [x] Pixel art drawn in code with day and night palettes and a 3x5 pixel font
- [x] Engine: camera, wheel, drag, keyboard, integer pixel scaling
- [x] Accessible overlay buttons for every building (keyboard and screen reader)
- [x] Building panels filled from profile.json
- [x] HUD: district name, score ticker, minimap with warp, settings, back to article
- [x] Welcome box, warp pipes, animated data packets, beacons, clouds

## Phase 3: The Wiki (CV mode)
- [x] Original wiki-style article (no Wikipedia branding)
- [x] Infobox, contents, career, projects, approach, skills, education
- [x] Footnote citations linking to proof (Devpost, GitHub)
- [x] Talk tab = contact, View history tab = timeline
- [x] "View as" lens filter
- [x] Light and dark themes

## Phase 4: Wiring
- [x] Settings dialog shared by both modes
- [x] Mode switching with lazy-loaded city (CV mode ships no city code)
- [x] `#tour` deep link opens the city directly

## Phase 5: QA
- [x] Build passes with no errors
- [x] Screenshot review: wiki light/dark, city day/night, phone width, panel open
- [ ] Keyboard-only walkthrough of both modes
- [ ] Reduced motion check
- [x] Console free of errors

## Phase 6: Performance
- [ ] JS and CSS bundle sizes reported
- [ ] Lighthouse mobile scores reported
- [ ] Measured city frame times on a throttled CPU

## Phase 7: Polish and extras
- [ ] Favicon, meta description, Open Graph image
- [ ] 404 page in the city style
- [ ] Pixel transition between modes
- [ ] Easter egg (Konami code)
- [ ] README with how to run, deploy, and edit content
- [ ] Webring widget slot ready (stays off until the webring PR is merged)

## Not doing without you
- Opening a pull request, merging to `main`, or touching the live domain
- Submitting the uwaterloo.network webring PR (needs your photo and approval)
- Writing your headline or personal details in final form (drafts are marked)

## Decision log
- Headline is a draft built from your LinkedIn post. Marked `headlineDraft: true` in profile.json.
- Swap Robotics and OCC appear in the Wiki only, not in the City.
- Urban Marble stack left as-is with a `todo` flag until you confirm Mapbox vs CesiumJS.
- Wiki copy avoids pronouns and uses "Barot" in encyclopedia style.
- Warp pipes use an original teal and data pipes an original copper. No Nintendo colors, sprites, sounds, or fonts.
- Packet colors follow the lens of the district they come from.
