# Dvij Barot Personal Site: Working Brief

Single source of truth for the site. Update this file instead of re-explaining in chat.

## Vision
- Design-first and aesthetics-led, not a purely technical exercise
- Shows personality and range across marketing, data, PM, AI and development
- Epic animations, transitions, sound effects, and a customizable UI for the visitor
- Cross-device performance treated as a day-one priority, never a retrofit ("optimization is a lost art")

## Core concept
- Two modes, one content file
  - **CV mode** (default, Poneesh-style): fast, scannable, recruiter-friendly, works on a phone
  - **Journey mode** (opt-in toggle, Evan-style gallery plus interactivity): five lenses (Marketer, Analyst, PM, AI, Builder), live data dashboard, terminal easter egg
- No gate or splash screen. Site opens in CV mode with a visible "Take the tour" toggle
- Visitor choice is remembered
- Settings panel: Mode, Theme, Motion, Sound

## References (studied Oct 28, 2026)
| Site | Move | Proof | Spice |
|---|---|---|---|
| evanhe.co | Gallery: huge section words beside media grids | Metrics (155M visits, 6x hackathon winner) | One human line (5K PB) |
| moelshrief.com | Whole site is a working terminal | Live GitHub heatmap | Pixel Sonic, tmux status bar |
| poneesh-portfolio.vercel.app | Classic extended CV, numbered sections | Metric-dense bullets | "Current focus" box |
| uwaterloo.network | Webring | n/a | ASCII art |

## Stack decision
- Code route (Astro or Next.js + GSAP), built and tested from cloud sessions
- Framer optional later: prototype directions in code first, then decide if the winner is worth rebuilding in Framer
- Hosting: Vercel (free custom domain support)
- Animation: GSAP + ScrollTrigger. Rive or Lottie for small interactive vectors if needed
- 3D (only if it earns its place): Three.js or Spline, lazy loaded
- Audio: Howler.js, user-initiated only, always a mute toggle

## Constraints
- Animate only transform and opacity. No animating layout properties ("T.O. = Take Off")
- Adaptive quality: start from a hint (navigator.hardwareConcurrency, navigator.deviceMemory, devicePixelRatio), then confirm by measuring real frame times during the first second and downgrade the tier if frames run slow. On low tiers scale down or drop 3D, particles and blur
- Respect prefers-reduced-motion everywhere
- Lazy load sections and heavy assets with Intersection Observer
- Move any heavy computation to a Web Worker
- Drive custom animation loops with requestAnimationFrame
- Performance budget per branch with actual numbers reported (bundle size, Lighthouse mobile score)
- Keyboard navigable, good contrast, semantic HTML

## Domains
- Owned: dvijbarot.wiki
- Recommended: register dvijbarot.com for resume/LinkedIn, point .wiki at the same site or a wiki-themed easter egg

## Webring
- uwaterloo.network requires being a UWaterloo student
- Join: add photo to public/photos/<name>.jpg (400x400), add entry to src/data/members.ts, PR to Shayaan-Azeem/waterloo.network
- Widget: `<script src="https://uwaterloo.network/embed.js" data-webring data-user="<name>"></script>`

## Open questions
- [ ] UWaterloo student? (webring eligibility)
- [ ] GitHub repo (owner/repo)
- [ ] Master resume content
- [ ] 3 to 5 projects with links and one-line outcomes
- [ ] Spice: hobbies, fun facts, photo
- [ ] Domain choice
- [ ] The earlier cloud prompt (mentions "three directions")
