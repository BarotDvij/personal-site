# Master Checklist

What is left. Items marked **(you)** need input from Dvij. Finished work is in the git history.

## Content
- [ ] **(you)** Final headline (current one is a draft, `headlineDraft: true` in profile.json)
- [ ] **(you)** Fun facts and hobbies for the Visitor Center
- [ ] **(you)** Square portrait for the infobox
- [ ] **(you)** Project screenshots for the CityScapes and Urban Marble panels
- [ ] **(you)** Urban Marble stack: Mapbox or CesiumJS (`todo` flag in profile.json)
- [ ] **(you)** Where you worked with each colleague in References
- [ ] **(you)** DECA and JA International details (event, year, placement, one line)
- [ ] **(you)** The rest of the cricket games line (message cut off)
- [ ] "Early life and education" section in the Wiki with DECA and JA wins
- [ ] Media budget check: page weight and Lighthouse stay where they are

## NPC (Sans-inspired, original design)
- [ ] **(you)** What he does and says (message cut off)
- [ ] Original pixel skeleton, underground as a nod to Undertale
- [ ] Dialogue box with typewriter text and a soft blip. Skippable, keyboard accessible, readable by screen readers
- [ ] A few lines that point to real work (pipelines, hackathons) plus jokes

## Launch
- [ ] **(you)** Connect `dvijbarot.wiki` in Vercel and add the DNS records in Porkbun
- [ ] **(you)** Approve and submit the uwaterloo.network webring PR (`docs/WEBRING.md`), then add the widget to the footer
- [ ] Remove duplicate Vercel project `personal-site-ag5a`
- [ ] Final Lighthouse, accessibility, and phone pass
- [ ] Launch post drafted from `docs/STORY.md`

## Decision log
- Swap Robotics has a showroom in the Industrial Zone and OCC has a tower beside City Hall.
- Wiki copy avoids pronouns and uses "Barot" in encyclopedia style.
- Warp pipes use the classic greens (#a4cb0e, #008c00) in our own pixel art. Data pipes are copper. No copied sprites, sounds, or fonts.
- Packet colors follow the lens of the district they come from.
- Preference changes keep the current view (a deep-linked city visit is not dropped back to the article).
- The Pipelines panel pulls bullets from profile.json by keyword (dbt, Snowflake, Airbyte, Glue, ingestion), excluding CRM "pipeline accuracy" lines.
- Wiki roles and projects link into the city with "See it in Dvij City".
