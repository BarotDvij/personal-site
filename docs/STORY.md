# The story behind dvijbarot.wiki

A running list of the personal threads woven into this site. Material for the launch post.

## Why it looks the way it does

### Efficiency as a value
Modern software is bloated (it takes more computing power to run Chrome than it did to land on the moon). 16-bit games and Wikipedia are both famous for doing a lot with very little, so the site copies their discipline:
- The Wiki ships about 2 KB of JavaScript. The City adds about 15 KB, and only when you open it.
- The whole city is drawn in code. No sprite sheets, no audio files (sound effects are synthesized).
- 60 fps even on a CPU slowed 6x. Lighthouse 99 to 100 across the board.
- It's a static site on a CDN, so it handles any number of visitors with no server to fall over.

### Wikipedia
Reading Wikipedia articles was a favourite pastime growing up. Wikipedia was one of the first donations set up after earning a paycheque, and there was once an account for making occasional edits. The default view is a wiki article, on a `.wiki` domain.

### Super Mario
One of the first games ever played. The green warp pipes (classic colors #a4cb0e and #008c00) are the city's way of getting around.

### Undertale
The game that made gaming click. The underground layer of the city is a nod to it. An NPC inspired by Sans is planned (idea in progress).

### City planning and public transit
A long-time passion, and the reason the site is a city at all. Both 1st-place hackathon projects (CityScapes and Urban Marble) were interactive city maps.

### Kitchener City Hall
- Helped pass a bylaw at Kitchener City Hall to allow fireworks during Diwali
- Volunteered at City Hall for the JA Fish Tank camp in high school
- As HSC President, set up a food bank drive with the City of Kitchener

In the city, City Hall holds this civic history, and AltaML gets its own building: a furniture store, since the client was Hauser, a furniture company.

### Data pipelines
A lot of the work has been data engineering, so the city's underground is literally plumbing: copper pipelines with packets flowing into the warehouse.

### Online games growing up
No console or gaming PC growing up, so the gaming was browser games. Planned minigames come from these:
- Tetris
- Red Ball (side-scroller with puzzles)
- Fireboy and Watergirl
- Run 2 (Coolmath auto-runner)
- Chat Noir (trap-the-cat puzzle)
- Tennis (Pong-like)
- Tank Trouble
- Chess

## Build facts worth mentioning
- Built in one autonomous session from a brief, a content file, and a list of constraints
- Two views from one content file: the Wiki for recruiters, the City for explorers
- Every building opens real work, and a guided tour walks all of them
- Keyboard accessible, respects reduced motion, works on phones
- Content tests in CI make sure every building points at real content
