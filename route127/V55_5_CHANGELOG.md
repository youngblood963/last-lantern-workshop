# Route 127 v55.5 — Changelog (release candidate)

Based on v55.4. The 31-section work order was implemented incrementally; see V55_5_WORK_ORDER_CHECKLIST.md for item-by-item implementation status.

- Added game-wide menu-output deduplication guard and QA turn-access refinements.
- Updated Relay component inventory tracking, acquisition guards, and installation gating.
- Restricted ANSI NPC-name highlighting to bounded dialogue spans.
- Rebalanced multiple road encounters, enemy rewards, reinforcements, Yardman and wanderer levels/variety.
- Expanded Solace Gate, Tim, Jen, Johnny, Murphy, Wayne and Amii interactions and quests.
- Updated wanderer trading, theft, and menu flows; protected equipment/quest items during selling.
- Added Rusty Lantern room and storage, gambling restrictions, six accessories, Niko reward and Collar effects.
- Added Cheeseburger slot jackpot and additional backpack capacity (per-character; not globally unique).
- Added weighted ordinary-encounter equipment drops with pending rewards for full packs.
- Added Level 6 Iron Reaper crafting recipe, 30-second timer and optional bleed effect.
- Audited day/night and branch navigation; expanded targeted and runtime regression suites.

**Limitations:** Browser interactions and visual appearance have not been verified in this environment. Features not end-to-end tested remain PARTIAL, not complete. This is a testable release candidate, not a fully certified stable build.
