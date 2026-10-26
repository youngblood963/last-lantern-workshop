# R8 — Factory ↔ Seaport encounter audit

Scope: coast road only; recruitment implementation unchanged.

Findings in supplied R7:
- Repeat travel already used the same random dispatcher in both directions. The reported absence of westbound fights was not reproduced in this source.
- Combat selection reused the older east-road pool without combat repeat protection. R7 already contained more than three eligible fights; perceived variety was still vulnerable to random repeats and recycled low-level threats.
- Two first-clear checkpoint fights are intentionally eastbound only. These remain one-time threats.
- Wanderers already used the shared 30% gate with a two-encounter cooldown, excluding dead/hired characters. No new spawning or recruitment framework was needed.
- Coast progress text incorrectly said Factory/Solace; arrival could leave the saved coast position one step short.

Changes:
- Eight coast-specific combat scenes: freight-car ambush, toll crew, marsh dogs, security drone, culvert crawler, cargo hijackers, seawall rifle scavenger, scrap crabs.
- Four paired enemy groups and four distinct solo threats, level 7–9, using existing combat/reward handling. Every scene offers FIGHT/BACK AWAY.
- Persist last five actually displayed coast combat titles and exclude them from subsequent combat selection. A wanderer replacing a rolled fight does not consume its history entry.
- Keep 25% combat-category selection, existing wanderer gate/cooldown, five-step travel and first-clear checkpoints. Other discovery scenes can still lead to optional fights; 25% is not the total fight probability.
- Synchronize coast position at every movement including endpoints; display the correct destination; prevent movement while an encounter is pending; apply existing roadside pet effects in both directions.

Validation:
- All shipped scripts loaded in HTML order in Node VM with a mocked DOM.
- Seeded integration simulation: 300 eastbound trips / 1,500 steps produced 224 selected coast fights and 227 wanderers. 300 westbound trips / 1,500 steps produced 236 selected coast fights and 221 wanderers. All eight combat scenes appeared in each direction.
- Real shared encounter resolver and combat entry/retreat used; real wanderer selection used. Ordinary noncombat scenes were completed directly during long simulations to isolate road dispatch.
- Separate actual combat victories and avoidance paths passed for all eight added scenes; checkpoint victory/retreat state passed.
- Verified one turn per step, endpoint stages, pending movement guard and history exclusion.
- recruitment.js byte-identical to supplied archive.
- Run: node tests/coast_road.cjs

Limits: automated headless integration audit, not a graphical browser/mobile playthrough or a complete balance test. Save/load round-trip and every legacy discovery choice were not exercised. First-trip checkpoints can still add two fights; no new forced fights were added.
