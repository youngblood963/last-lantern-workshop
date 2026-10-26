# R9 — Factory ↔ Seaport exploration and encounter audit

## Available rotating scenarios

| Category | Distinct scenes | Category roll before wanderer replacement |
| --- | ---: | ---: |
| Combat | 8 | 25% |
| Exploration/discovery | 4 | 23% |
| Salvage/caches | 3 | 14% |
| Environmental hazards (including existing River of Fire) | 4 | 12% |
| Environmental storytelling | 3 | 12% |
| Moral choices | 2 | 8% |
| Quiet stretches | 2 | 6% |
| Total | 26 | 100% |

Wanderers use the existing separate 30% gate when their two-encounter cooldown permits and an eligible living, unhired character exists. They replace a rolled scene, rather than adding an extra stop. Consequently the percentages above describe the category selector, not all displayed encounters. The existing two one-time eastbound checkpoint fights remain separate from this rotating pool. No new forced combat was added. Four of five movement steps have encounters; the fifth reaches the destination.

## Player choices and outcomes

- Abandoned supply truck: cab ration or cargo cable with a minor injury.
- Roadside cafe: risky pantry search or read the unpaid-meal tally.
- Smoke beyond the guardrail: recover cloth or observe the misleading silhouette safely.
- Signal hut: investigate the cabinet for wire or read tracks left by someone waiting for a train.
- Milepost cache: a few Bolts or a dressing caught above the waterline.
- Maintenance cart: wire or scrap metal.
- Drainpipe locker: force a trapped spring for a dressing or inspect its warning.
- Sinking causeway: uncertain crossing or safe curb.
- Leaking tank: wire at a health cost or circle upwind.
- Falling platform: cloth at a health cost or sheltered passage.
- Existing River of Fire: risky crossing, consume cloth for wire, or safe detour.
- Repeating signal, letters under a stone, and measuring wall: distinct investigations reveal small human stories without a payout or new main quest.
- Stranded handcart: help at a small health cost, donate a ration, assess the load, or move on.
- Injured courier: donate a bandage for 3 Bolts, ask about the satchel, point out shelter, or move on.
- Two quiet scenes offer observations without rewards.

Each scene includes an exit. Actions are mutually exclusive per encounter visit. Missing donation supplies leave the scene open for another choice. Rewards reuse existing inventory and currency handling; full packs do not gain an extra slot. Injuries on these new scenes cannot reduce health below 1. No new progression XP, quest flags, recruitment hooks, or ammunition system were added.

## Variety and scope

Coast-only selection replaces the older shared discovery draw with a deliberate category mix. Per-category history avoids the last two noncombat scenes (or last one for two-scene categories) and last five combat scenes. History records only scenes actually shown, not draws replaced by wanderers, and lives in existing saved player flags. Existing R8 combat history is honored.

Combat selection for the Solace–Factory leg is kept out of the coast-specific added pool. Completed recruitment is untouched; recruitment.js is byte-identical to the original supplied R7 archive. The main storyline is unchanged.

## QA results

All scripts loaded in shipped HTML order in a headless Node VM with a mocked DOM. Actual dispatcher, scene resolver, inventory, combat, and wanderer selection were used. The long simulation chooses safe exits for noncombat scenes; separate tests exercise their other choices.

- 300 trips east: 1,500 paid steps; 234 combat, 240 wanderers, 243 exploration, 147 salvage, 94 hazards, 114 storytelling, 75 moral choices, 53 quiet.
- 300 trips west: 1,500 paid steps; 215 combat, 209 wanderers, 228 exploration, 155 salvage, 130 hazards, 115 storytelling, 89 moral choices, 59 quiet.
- All 26 rotating scenarios actually appeared in each direction.
- 424 noncombat tests cover every new action and exit in both directions with low/high risk rolls and full/available pack capacity.
- Separate assertions verify missing supplies keep choices open; exact supply rewards, injury amounts, Bolts, donation consumption; serialized history; existing fire choices at 1 HP; combat victory/retreat/avoidance; checkpoint state; endpoint stages; one turn per movement; no added turn charge for scene actions; pending movement protection.
- R7 already dispatched random encounters westbound; the reported absence was not reproduced in that source. R9 verifies every category westbound rather than adding a separate reverse-travel path.

Run: `node tests/coast_road.cjs`

Limits: this is automated integration QA, not a browser/mobile visual playthrough or full long-term balance assessment. History serialization was checked, but a complete user-interface save/load round trip was not. Ordinary side-quest interception was disabled in the road simulation to isolate encounter dispatch.
