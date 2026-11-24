# Central gameplay stress test — Phase 2

Casino repairs were committed and deployed independently in [PR #209](https://github.com/youngblood963/last-lantern-workshop/pull/209), merge `a9b90dfb674acdac4d7fdbd0e18a051edf44bc19`. GitHub Pages run `45440665733` succeeded before this phase began. See [casino desktop/mobile evidence and protected geometry](../casino-grid-alignment/README.md).

## Test method and isolation

Active native graphical command execution covered the 81 canonical scenarios eligible for CENTRAL, including GLOBAL entries. These are executed gameplay handlers, not a read-only source audit. Each branch starts an isolated character with ordinary level-15 Uncommon equipment, normal HP and a supplied or empty backpack. Four conditions: supplied daytime with controlled low/high scenario rolls, supplied nighttime, and empty daytime. Combat uses seeded uniform rolls and actual attacks/medicine until victory or native rescue; enemy HP and damage are never reduced. The native unlimited-movement mode retains 150 movement turns; normal death penalties remain enabled.

A real browser separately used an isolated local DEVTEST origin and a dedicated storage namespace. No hosted owner save was opened or modified. The existing registry/encounter engine was reached through a test-only encounter picker. Forced visits are explicitly excluded from travel counts. A local PLAYTEST entry was used only for compatibility checks. Test fixtures are not loaded by either shipped entry.

## Results

| Coverage | Result |
| --- | --- |
| Real-browser Central movement | 10 paid movement steps, plus separately identified forced visits |
| Canonical eligible scenarios executed | 81 of 81; names/IDs in [roster](roster.json) |
| Final DEVTEST scenario menu executions | 2,817 |
| Distinct scenario-command pairs | 479 |
| Scenario/profile/path contexts | 694 across four conditions; these include repeated branches under different profiles |
| Completed native combats | 260, using 2,153 combat commands |
| Native defeats | 8, at the existing level-50 Big Man; normal rescue, no balance edits |
| Real-browser combat | 1 completed nighttime dog fight; 1 Big Man defeat/rescue |
| Additional ranged branch execution | 44 cases for Blade Cart `east:24` and Road Reapers `east:33`; 13 combat completions, zero issues |
| Locations/services | 128 menus, 296 distinct actions, 122 nested paths, 1,246 executions; zero exceptions, duplicates or menu cutoffs |
| Final native scenario findings | Zero unresolved exceptions, no-responses or branch-limit cutoffs |

Counts describe separate runs and are not added together to inflate unique coverage. The service run covers native graphical and textual command paths. Browser counts do not include the 81 automated scenario selections as travel.

Service roots: Solace, Old House, road wanderer, Relay Station before/after restoration and County Maintenance Depot. Solace includes Johnny's stock/sales/dialogue, Murphy's recipes/crafting prerequisites, Wayne's clinic, Amii's bank/storage, Mara's armory, Tim, Jen's Rusty Lantern/drinks/room/casino and gate navigation. Browser play additionally visited Station Nine's garage, storage and communications office, tested Back/return-to-highway, and accepted Terrible Billy's bounty through the graphical board.

Browser actions included a Bandage purchase, custom bank deposit/withdrawal, required-field validation and All, clinic full-health feedback, truck inspection/rescue/food delivery, radio inspection and salvage, windshield recovery, maintenance salvage, library blueprint discovery, postal search, rope route, wanderer inspection/dialogue/purchase/Back/Leave, dog combat/healing/loot, death/rescue, Curator dialogue, workshop prerequisites and armory navigation. Result popups and bounty panels closed through their own controls. No persistently obstructing popup was confirmed.

## Confirmed defects and repairs

1. **Selectable buttons during command processing — shared graphical menu, all Central scenario IDs and services.** Dispatch rejected input while `commandProcessing` was true, but the renderer disabled controls for that flag only in a wanderer context. Actions could look available while the preceding dialogue was still processing. All graphical choices now acquire the existing processing lock, visibly disable during output and unlock in `finally`, including on errors. Routing still uses canonical commands for encounters/traders/wanderers and existing numeric keys for other menus. No actions are queued or replayed automatically. Browser verification observed all six shop choices disabled during clinic narration and the five correct clinic choices enabled afterward.
2. **Scrap Duel — `east:11`, PLAYTEST runtime dependency.** The public registry called `Route127RoadMinigames.watch/openRoadScrapDuel`, but the optional package is DEVTEST-only and absent from PLAYTEST. The pre-fix release run reproduced 20 exceptions across Watch, Compete and wager-confirmation paths. A shared availability guard now gives an explicit unavailable-in-this-build response, spends zero Bolts, clears an unusable pending stake and keeps Leave working. This repair deliberately does not publish the unreleased minigame package. DEVTEST's existing contest remains playable: browser Start Throw/Throw scored 25 and advanced to four throws remaining. The approved interruption-forfeit implementation is unchanged; refreshing the unstaked round returned to the encounter without a reward or charge.

Production files: `graphics.js`, `scenario_registry.js` and their cache-version references in `index.html`, in both DEVTEST and PLAYTEST. No casino mechanics, artwork, quest completion or reward rules changed in this phase.

## Persistence regressions

- All four dog variants selected distinct corresponding artwork under controlled rolls.
- Repeat dog visits restored the eligible food choice and deducted exactly one food each time. Browser visits changed from an aggressive dog to a mother/den variant.
- Browser refresh during Station Nine Discovery retained the selected encounter, collected circuit and remaining choices; salvage did not become available again.
- Browser refresh during an actual dog fight retained player HP **534/625** and enemy HP **66/87** exactly. Bandage then changed 31 to 30, restored HP to 625 and left enemy HP at 66: no retaliation. Later attacks did retaliate.
- Native public save/load retained dog variant, real attack damage and player wounds in both entries.
- Shattered Glass `east:68` retained the permanent Corvette windshield claim; a second legitimate visit did not offer or grant a duplicate windshield. Other eligible visits/choices remained intact.
- Browser rescue retained equipment and quest items, including the recovered windshield. No save migration or blanket flag clearing was introduced.

## Harness findings reviewed

The first DEVTEST pass flagged 21 dialog no-responses. Native DOM mocks did not implement the HTML submit default action or include edited input/inline feedback in comparisons. These were harness limitations, not production defects. The harness now dispatches form submit, records dialog values/feedback and treats All setting an already-zero input as idempotent. Browser custom bank input/validation/All worked. The deeper final pass used 50-menu/depth-6 limits and reached every scenario without cutoffs.

The first PLAYTEST compatibility pass found the real Scrap Duel dependency plus three idempotent All-input false positives. Targeted replay of Scrap Duel/Fighting Ring/Forgotten Arena after the repair/harness correction: 308 executions, 62 distinct commands, 76 contexts, zero issues/cutoffs. Focused processing-lock and missing-runtime tests also passed against both entries after the shared graphical repair.

## Regression commands

- `CENTRAL_MENU_LIMIT=50 CENTRAL_DEPTH=6 node route127/devtest/tests/central-gameplay-stress.cjs` — PASS, 81 scenarios / 2,817 executions.
- `CENTRAL_IDS=east:24,east:33 CENTRAL_RANGED=1 node route127/devtest/tests/central-gameplay-stress.cjs` — PASS, ranged prerequisites and success branches.
- `node route127/devtest/tests/central-command-repairs.cjs` and `ROUTE127_RELEASE=1` — PASS, visible lock, single transaction, normal routing, error unlock, missing-runtime response, no stake/charge, saved confirmation and exit.
- `node route127/devtest/tests/central-persistence-regression.cjs` and `ROUTE127_RELEASE=1` — PASS, variants/artwork, repeat choices, deductions, public reload/combat and unique claim.
- `MENU_ROOT=solace,house,wanderer,station,station-restored,depot MENU_PROFILE=supplied MENU_GRAPHICS=1 MENU_DEPTH=5 MENU_LIMIT=160 node route127/devtest/tests/non-scenario-menus.cjs` — PASS, 1,246 executions.
- `node route127/devtest/tests/motel-casino.cjs` and `ROUTE127_RELEASE=1` — PASS, all five games, payouts, 37 roulette outcomes/bet families, committed saves/reloads and native returns.
- `node route127/devtest/tests/gameplay-rendering-repairs.cjs` and `ROUTE127_RELEASE=1` — PASS, 108 healing cases, normal retaliation, Curator, Battery Cart, vendor buyback and renderer exclusions.
- `node route127/devtest/tests/casino-visual-protection.cjs` — PASS, both entries' protected roulette assembly byte-identical; Big Six differs only by approved vertical coordinate.
- `git diff --check` — PASS.

## Limits and owner review

Every Central roster entry and its offered root commands were exercised; this is not exhaustive proof of every quest history or random sequence. Full timed Scrap Duel victory, every possible score and every permanent rescue/quest ending were not replayed. Locked Freezer and the two coastal crab designs are outside this Central roster; the completed game-wide persistence audit was not repeated. The eight Big Man defeats are reported without a balance recommendation. Mobile casino checks used a real browser at a 390px viewport, not a physical phone.

**Owner review:** PLAYTEST Scrap Duel's full interactive game remains unavailable because its runtime/assets are unreleased DEVTEST content. The repaired public encounter explains that and allows leaving without payment. Publishing that game package would be a separate content release; it was not smuggled into this bug deployment. No other unresolved confirmed gameplay defect remains from these runs.

## Evidence

- [Final native summary](native-summary.json), [roster](roster.json), [service summary](services-summary.json), [ranged summary](ranged-summary.json).
- Gzip JSON/JSONL files retain detailed native commands, browser events and pre-fix/retest release observations. Use `gzip -dc` to inspect. Initial findings remain labeled as initial findings.
- [Verified clinic/location artwork](clinic-verified.jpg), [unchanged DEVTEST throwing game](scrap-duel-devtest.jpg).

The casino publication and this gameplay publication are separate commits/deployments. This phase changes only the two confirmed input/dependency defects and test evidence, in both environments; unrelated DEVTEST content remains excluded.
