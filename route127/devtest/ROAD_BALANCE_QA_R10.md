# R10 — Road encounter balance and QA

Quiet encounter cards removed from all active random pools. An uneventful movement is now one short travel result, with no observation menu. Legacy scene array positions remain readable for old saves.

## Selection and scope

One shared selector now runs after scripted quest interception on the early road and both Factory road legs. An eligible random segment has an 80% encounter trigger chance. Conditional on a trigger, category weights are combat 50%, wanderer 20%, exploration/discovery 15%, salvage/supplies 10%, environmental/story 5%. Choices to avoid combat remain valid, so the combat category count is not a count of battles fought.

The existing free fork, Service Road and Lower Access Road fixed landmarks, quest interceptions and first-clear coast checkpoints retain their scripted behavior. Their movement costs are preserved. They are not eligible random rolls. Destination arrival steps on the newer road legs do not roll an encounter.

Both travel directions call the same selector. In supplied R7, repeat random dispatch already existed westbound on the newer roads; total absence was not reproduced. The older and newer selection paths used different pools and suppression rules. R10 unifies category selection, removing the directional opportunity for a different encounter mix.

## Available scenario counts

| Road | Combat | Exploration | Salvage | Environmental/story | Persistent wanderer roster |
| --- | ---: | ---: | ---: | ---: | ---: |
| House ↔ Solace | 16 | 9 | 7 | 6 | 12 |
| Solace ↔ Factory | 8 | 9 | 7 | 6 | 12 |
| Factory ↔ Seaport | 8 | 4 | 3 | 9 | 12 |

Early combat availability follows player level; at level 3 the integration run displayed 12 distinct threats. At least five established threats remain available at level 1. Early scenes retain their existing branching food, trade, warning and avoidance choices. Eight east-road variants reuse established enemies and multi-enemy combat, with level 5–7 stats and modest rewards. Coast combat stays level 7–9 and stronger than the middle leg.

## Wanderer safeguard

Existing NPC identities, death state, hiring gates, costs, aptitudes and staffing code are unchanged. Living, unhired wanderers form the road pool. With four jobs staffed, other eligible wanderers still appear. If the entire roster is dead or hired, the 20% category weight is redistributed among the other categories rather than inventing recruits.

After liberation, count eligible random road segments without an eligible wanderer, including uneventful segments. At 10 segments the base chance remains 20%; each subsequent segment adds 3 percentage points, capped at 50% of triggered encounters. Other categories shrink proportionally during the safeguard. Reset after an eligible wanderer appears. No recruitment success is guaranteed. Before liberation the safeguard remains off and the base wanderer chance is 20%. No fixed script or endpoint contributes to the dry-segment counter.

## Repetition and preservation

Recent history is saved by geographic region/category, shared across directions. Exclude up to five recent combat scenes and three recent noncombat scenes when alternatives exist. Random choice remains weighted; scenes return to circulation. recruitment.js is byte-identical to the supplied R7 archive. No main-story or hiring rules were changed.

## Measured travel QA

300 trips per direction per main-road leg; 1,800 trips total. Tests load all shipped scripts in HTML order, use real movement charges and encounter selection, and run in a Node VM with a mocked DOM.

| Direction | Segments | Triggered | Combat | Wanderers | Explore | Salvage | Environment/story | Uneventful | Unique scene cards |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| House → Solace | 2700 | 2174 | 1088 | 436 | 335 | 204 | 111 | 526 | 34 |
| Solace → House | 2700 | 2160 | 1120 | 411 | 315 | 209 | 105 | 540 | 34 |
| Solace → Factory | 1800 | 1198 | 599 | 237 | 188 | 115 | 59 | 302 | 30 |
| Factory → Solace | 1800 | 1227 | 617 | 237 | 193 | 121 | 59 | 273 | 30 |
| Factory → Seaport | 1500 | 960 | 484 | 210 | 131 | 93 | 42 | 240 | 24 |
| Seaport → Factory | 1500 | 967 | 493 | 196 | 147 | 78 | 53 | 233 | 24 |

Totals: 12,000 paid segments, 8,686 random encounters, 2,114 uneventful random rolls. Another 1,200 paid destination-arrival steps do not roll encounters.

Observed triggered distribution: combat 50.7%, wanderer 19.9%, exploration 15.1%, salvage 9.4%, environment 4.9%.

All categories triggered in each direction. All 24 coast cards and all 30 middle-road cards appeared in each direction. Early runs displayed all level-eligible cards. Quiet cards never appeared.

Additional checks passed:

- 2,352 individual choice/risk-roll/pack-capacity/direction checks across selected scenarios. Invalid-choice output fails the test, except an explicitly reported full-pack trade refusal.
- Actual battle entry/retreat and all 16 middle/coast combat victories return correctly to travel.
- Exact donation cost and reward; missing supplies leave a valid alternative. Existing full-pack limits remain in force.
- Real reverse/continue commands, zero-turn movement blocking, unchanged position on reversal, single road-progress and completion headings.
- Early-road reversal, free-fork departure, Service Road and Lower Access reverse/fast-return costs.
- Safeguard growth, cap, pre-liberation disabling, reset on an eligible meeting, and availability with all four jobs filled.
- Empty roster fallback; serialized history; save snapshot preserves current encounter; saved-encounter redraw does not reroll or increment the safeguard.

Run `node tests/road_balance.cjs`.

Limits: automated headless integration QA, not a visual browser/mobile playthrough or a complete save/load UI round trip. Scripted quest interceptions and visual scene art were disabled in long simulations to isolate random selection. Ordinary noncombat events used immediate completion during long-run sampling; every displayed choice was exercised separately. No claim of long-term progression balance from these tests.

## Scenario review

Detailed KEEP / IMPROVE / REMOVE classification and active pools are in ROAD_SCENARIO_AUDIT_R10.md. REMOVE means excluded from the random rotation; legacy definitions remain readable for saved encounters.
