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
- [x] Keyboard-only walkthrough of both modes (tab through buildings, Enter opens, Escape closes and returns focus, PageDown warps)
- [x] Reduced motion check (OS setting respected, override in Settings, city renders a still frame)
- [x] Console free of errors

## Phase 6: Performance
- [x] JS and CSS bundle sizes: Wiki JS 2.3 KB gz, City JS 15 KB gz (lazy), CSS 18 KB, page weight 69 KB
- [x] Lighthouse mobile. Wiki: 99 perf, 100 a11y, 100 best practices, 100 SEO. City: 100 / 100 / 100 / 100
- [x] City frame times: 60 fps (p95 16.8 ms) at 1x, 4x, and 6x CPU throttling

## Phase 7: Polish and extras
- [x] Favicon, meta description, Open Graph image (rendered from the city)
- [x] 404 page in the city style ("This lot is still empty")
- [x] Pixel transition between modes
- [x] Easter egg (Konami code)
- [x] README with how to run, deploy, and edit content
- [x] Webring widget slot ready (stays off until the webring PR is merged)

## Phase 8: Depth (added after phases 1 to 7 finished)
- [x] Guided tour: Next and Previous buttons in building panels walk the whole city in order
- [x] Cross-links: each Wiki role and project gets a "See it in the city" link that flies to its building
- [x] Deep links like `/#tour/genledge` open the city on a specific building
- [x] Data Lake opens a "Pipelines" panel summarizing the data work across roles
- [x] Day/night and sound quick toggles in the HUD
- [x] Street life on the high tier: walkers and a delivery truck
- [x] A/B billboard animates a winner; construction crane hook bobs
- [x] Touch: horizontal swipe pans the city on phones
- [x] Print stylesheet for the Wiki (recruiters print)
- [x] JSON-LD Person data, sitemap, robots.txt
- [x] CI: GitHub Actions runs type check and build on every push
- [x] Final regression pass: screenshots, keyboard walkthrough, deep links, touch swipe. Zero console errors
- [x] Content integrity tests (6) in CI so editing profile.json can't silently break the city
- [x] Photo slot (`photo.src` in profile.json) and `public/media/` ready for your media
- [x] Webring PR drafted in `docs/WEBRING.md` (not submitted)
- [x] Phone layout: lead paragraph and stats before the infobox, compact header

## Not doing without you
- Opening a pull request, merging to `main`, or touching the live domain
- Submitting the uwaterloo.network webring PR (needs your photo and approval)
- Writing your headline or personal details in final form (drafts are marked)

## What needs you next
1. Connect Vercel (vercel.com/new, import the repo) to get a live preview URL for this branch
2. Review on your phone and laptop, then tell me what to change
3. Headline: replace the draft in `content/profile.json`
4. Spice: hobbies, fun facts, taste
5. Media: square portrait, Go Lime ad footage, CityScapes and Urban Marble screenshots
6. Confirm the Urban Marble stack (Mapbox or CesiumJS)
7. When happy: merge `feat/scaffold` into `main`, point dvijbarot.wiki at Vercel, submit the webring PR

## Decision log
- Headline is a draft built from your LinkedIn post. Marked `headlineDraft: true` in profile.json.
- Swap Robotics and OCC appear in the Wiki only, not in the City.
- Urban Marble stack left as-is with a `todo` flag until you confirm Mapbox vs CesiumJS.
- Wiki copy avoids pronouns and uses "Barot" in encyclopedia style.
- Warp pipes use an original teal and data pipes an original copper. No Nintendo colors, sprites, sounds, or fonts.
- Packet colors follow the lens of the district they come from.
- Bug fixed: changing theme or sound on a deep-linked city visit used to drop you back to the article. Preference changes now keep the current view.
- The Pipelines panel pulls bullets from profile.json automatically by keyword (dbt, Snowflake, Airbyte, Glue, ingestion...), excluding CRM "pipeline accuracy" lines.
- Wiki roles and projects link into the city with "See it in Dvij City". Swap Robotics and OCC have no building, so no link.
