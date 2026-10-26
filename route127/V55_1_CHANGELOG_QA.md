# Route 127 v55.1 — Seaport completion candidate

## Changes
- Added Mia's Rusty Anchor bar menu with Small Talk, Energy Bar purchases and a link into the existing Jen casino engine. Bets and payouts use the same existing casino state and validation; returning from the casino routes back to Mia. No new gambling engine or Factory balance changes.
- Added a persistent Kaiden patrol location across Town Streets, Harbor Entrance, Market Area and Docks. It advances on lifetime-turn thresholds, without extra turn charges. Patrol location appears in the Seaport menu.
- Added one-time Chapter One completion after liberation, captive rescue, and conversations with both Kaiden and Mia *after* rescue. Finale text is stored in source, completion in player.flags.chapterOneComplete, and the quest journal shows COMPLETE with a READ CHAPTER ONE command. The game remains explorable.
- Updated Seaport objective to reflect completed chapter. Maintained existing pet and equipment logic and Factory settings.
- Fixed numeric Mia purchase label to map to the existing purchase handler.

## QA performed
- JavaScript syntax checks: passed across all game JS.
- 11 targeted Node VM state assertions: passed, including quest completion idempotency, finale, patrol progression, Ferret eligibility, and Seaport menu.
- Static integration review: existing casino command handler is reused. No full browser playthrough performed, as instructed.

## Known limitations / manual verification required
- **Not fully certified:** live browser numeric and typed hotkeys, casino entry/exit, blackjack animation, saved gambling rounds, autosave and old-save compatibility need targeted interactive verification.
- Kaiden's patrol is represented by a changing location indicator and persistent state; he is still directly accessible through Town Streets rather than physically rendered at each patrol location. Full location-specific presence/interactions remain incomplete.
- The existing v55 pet system needs deeper dynamic tests for all five passives, vendor purchases, inventory management, and save/load, beyond the targeted Ferret checks.
- The existing v55 liberation, overflow handling, and Factory-to-Seaport travel need full automated integration regression; not certified by this patch.
- Earlier versions' Chapter One flags are absent and will initialize naturally. The previous saved Seaport 'done' stage requires re-entering a contextual NPC conversation to set the completion flag.
