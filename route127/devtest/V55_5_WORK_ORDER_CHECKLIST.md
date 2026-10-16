# Route 127 v55.5 — 31-Section Work-Order Checklist

Status legend: **PASS** = implementation and targeted tests evidenced in this workspace; **PARTIAL** = some implementation exists but the complete requirement is not verified; **OPEN** = not completed/verified. This checklist intentionally distinguishes source edits from browser/release validation.

1. Game-wide duplicate menu rendering — **PARTIAL** (single-output guard exists; browser-wide transition matrix still needed).
2. Zero-turn QA access — **PARTIAL** (QA gate/replenishment code and targeted tests exist; Player-build exclusion and browser verification remain).
3. Relay Station component tracking — **PARTIAL** (quest-storage inventory display and acquisition logic exist; all four source conditions/install flow require full integration test).
4. ANSI color rendering — **PARTIAL** (fixed early-game NPC/wanderer highlighting to color only the bounded leading name instead of random letters across the full dialogue; 6 source assertions pass. Full browser-level color/rarity matrix still required).
5. Encounter reward audit — **PARTIAL** (several passive XP and combat rewards adjusted; full branch-by-branch audit remains).
6. Encounter repetition — **PARTIAL** (recent-encounter weighting/cooldown logic exists; statistical spawn-distribution testing remains).
7. Wanderer levels — **PARTIAL** (level-weighting logic and tests exist; cast/progression/persistence integration not fully verified).
8. Security Drone — **PARTIAL** (fight/circle/move outcomes adjusted; browser test still needed).
9. Highway Robbers — **PARTIAL** (individual enemy HP/loot, capped attacks, escape rules and runtime tests exist; broader save/load/combat integration remains).
10. Gang Lookout — **PARTIAL** (reinforcement round and multi-enemy state tests exist; full reward/retaliation browser validation remains).
11. Yardman — **PARTIAL** (55 HP, standard/heavy damage, miss chance and runtime tests exist; quest/reward integration still needs end-to-end test).
12. Other encounter improvements — **PARTIAL** (multiple encounters changed; not every named encounter/branch audited).
13. Solace Gate — **PARTIAL** (five approved gate dialogue choices now route; choosing fight starts a turn-costing guard combat. One-time Jen rescue on death uses normal recovery penalties and preserves bounty state. 8 source assertions pass; browser combat/death flow and gate access regression remain).
14. Tim — **PARTIAL** (seven-option Talk menu, Old Badge hand-in, Trouble at the Old House and Terrible Billy bounty contracts now exist. Terrible Billy can be accepted from Work, hunted during a road encounter, defeated for proof, and turned in once for 140 XP/100 Bolts; journal state is tracked. Both bounty contracts still need browser/save-load idempotency testing).
15. Jen — **PARTIAL** (Talk categories/routing and Last Call preserved; implemented Unpaid Tab with 12-Bolt cost and one-time XP/Bolt reward, plus A Familiar Face dialogue quest; source assertions pass, but browser flow and save/load idempotency still need runtime verification).
16. Johnny — **PARTIAL** (four-option main menu added and tested; all quest/stock regressions still need browser validation).
17. Murphy — **PARTIAL** (workshop/Talk menus added and tested; crafting and quest end-to-end regression remains).
18. Wayne — **PARTIAL** (Talk categories/routing and existing quests preserved; full clinic/quest browser validation remains).
19. Amii — **PARTIAL** (Talk options added; Niko/Alex pet/reward interactions not verified).
20. Wanderer interactions — **PARTIAL** (deduplication, Browse Wares, theft/bounty persistence exist; full interaction matrix remains).
21. Selling interface — **PARTIAL** (quantity sales, confirmation, overflow and equipped/quest protections exist; rare/epic confirmation and all merchant routes need integration coverage).
22. Rusty Lantern player room — **PARTIAL** (purchase/rest/chest logic and targeted tests exist; complete browser/save/attack-safety verification remains).
23. Gambling — **PARTIAL** (level/location gating, payout guards and tests exist; end-to-end game/payout coverage remains).
24. Accessories — **PARTIAL** (one slot, six accessory definitions, equip flow, bonuses, Mara rotation and sale protection added; browser/load/save test still required).
25. Niko rewards — **PARTIAL** (Pet Niko grants one randomized, once-per-character reward with pending delivery if pack is full; Pet Alex is harmless; 12 targeted assertions pass. Collar critical-hit, max-HP, and once/day Second Chance effects have targeted tests; browser validation remains).
26. Cheeseburger — **PARTIAL** (5% per slot spin grants once-per-character pet and +6 pack slots; no vendor/trade path; 6 targeted assertions pass. Global uniqueness is not claimed without shared-world ownership infrastructure; browser/save-load verification remains).
27. Random equipment drops — **PARTIAL** (ordinary encounter victories now roll equipment at 55% Common / 30% Uncommon / 13% Rare / 2% Epic; weapon/armor pools only; full-pack drops persist for later claiming. 9 source assertions pass; 100,000-roll distribution and pending-drop save/load tests pass; full browser encounter integration remains).
28. Factory crafting progression — **PARTIAL** (Iron Reaper recipe added at Level 6 with 18–27 damage, 8 Scrap, 4 Wire, 3 Cloth, 75 Bolts, 30-second timer and 90% success; 10 targeted assertions pass. Bleed combat effect and active-job save/load have runtime coverage; full browser craft test remains).
29. Day/night cycle — **PARTIAL** (hour thresholds and turn advancement inspected; 10 new source assertions confirm DARK/DAWN/DAY/DUSK boundaries, invalid turn-count rejection, no overspending, and retained night combat/XP bonuses. Runtime turn-boundary and zero-turn town interaction tests remain).
30. Service Road and Solace navigation — **PARTIAL** (reverse/return fixes exist; added `QA_EVIDENCE/v555-service-road-navigation-test.cjs` with 10 source assertions for turn cost, duplicate menu options, depth boundaries, insufficient-turn guards, and return routing. Browser travel-cost matrix remains).
31. Solace town navigation — **PARTIAL** (legacy visible typed-command prompts require browser audit; hidden typed command compatibility must be preserved).

**Separate release deliverable:** Automated QA complete; manual browser testing NOT VERIFIED — MANUAL BROWSER TEST REQUIRED. See V55_5_FINAL_QA_REPORT.md.

## Latest work in this workspace
- Fixed four legacy QA harnesses to load `seaport.js`, where `portCommand()` is defined. The affected harnesses now run successfully rather than failing with a harness-only `ReferenceError`.
- Implemented the accessory equipment slot and six approved accessories; accessory bonuses feed defense/damage calculations, Mara's rotating inventory includes them, and equipped accessories are protected from sales.
- Added `QA_EVIDENCE/v555-accessory-slot-test.cjs` (9 assertions).
- Implemented Amii’s Pet Niko/Pet Alex interactions. Niko’s one-time weighted reward table supports pending delivery when the backpack is full; Alex’s reaction causes no damage. Added `QA_EVIDENCE/v555-niko-rewards-test.cjs` (12 assertions).
- Implemented Cheeseburger as a 5% per-slot-spin, once-per-character jackpot; grants +6 backpack slots and is not sold by the pet vendor. Added `QA_EVIDENCE/v555-cheeseburger-jackpot-test.cjs` (6 assertions). Global uniqueness remains unavailable without shared-world ownership infrastructure.
- Added the Level 6 Iron Reaper blueprint with the approved materials, cost, damage, timer, and success chance. Added `QA_EVIDENCE/v555-iron-reaper-blueprint-test.cjs` (10 assertions); the optional bleed effect is recorded as weapon metadata but is not yet applied by combat.


## Latest continuation pass — 2026-10-15
- Implemented the approved random equipment rarity distribution for ordinary encounter victories only. Guaranteed quest and boss rewards remain untouched. Equipment is selected from matching weapon/armor rarity pools; if the backpack is full, the item is stored in `player.flags.pendingEquipmentDrops` and can be claimed with `CLAIM EQUIPMENT`.
- Added `QA_EVIDENCE/v555-random-equipment-drop-test.cjs` (9 source assertions).
- Regression testing exposed two isolated combat harnesses that extract `handleCombat` without loading app-level helper declarations. The encounter drop hook now checks that the helper exists before invoking it, preserving browser behavior while allowing the extracted handler tests to remain isolated.
- Re-ran the previously failing Gang Lookout and Highway Robbers runtime suites: 7/7 and 8/8 assertions passed. Full QA_EVIDENCE suite count and release checklist remain in progress; this is not a release sign-off.


## Latest continuation pass — ANSI color span boundaries
- Fixed early progression name coloring in `app.js`: NPC and wanderer dialogue now applies the highlight only to the bounded leading name token instead of randomly coloring letters throughout the entire line. This specifically addresses the reported Hollis dialogue color leakage while preserving general early-game color evolution and equipment rarity coloring.
- Added `QA_EVIDENCE/v555-ansi-name-boundaries-test.cjs` (6 source assertions).
- Validation: all 45 `QA_EVIDENCE/*.cjs` scripts passed; all top-level JavaScript files passed `node --check`. Browser visual validation remains outstanding.


## Latest continuation pass — Tim Talk menu
- Replaced Tim's legacy Small Talk menu with the approved seven-option Talk menu and preserved the Old Badge hand-in as a separate available action.
- Routed Bounties to the existing wanted board, Pay Off Bounty to the existing fine-settlement system, and Relay Station to the existing unlock flow. Collect Bounty remains informational until a valid contract/proof system exists; no false payout is granted.
- Added `QA_EVIDENCE/v555-tim-talk-menu-test.cjs` (8 assertions). Updated the older consolidation test to assert the new approved menu labels.
- Validation: all 46 `QA_EVIDENCE/*.cjs` scripts passed with `TERM=xterm`; all top-level JavaScript files passed `node --check`.


## Latest continuation pass — Solace Gate
- Implemented the five approved gate choices: abandoned terminal, trade, Relay Station, passing through, and picking a fight.
- Picking a fight starts a level-scaled gate guard combat and charges the normal one-turn town fight cost.
- Added a one-time Jen rescue line for death during gate-guard combat; the normal death travel/recovery penalties still apply, and the existing bounty state is not cleared.
- Added `QA_EVIDENCE/v555-solace-gate-dialogue-test.cjs` (8 source assertions).
- Validation: the new 8/8 source assertions passed, all available `QA_EVIDENCE/*.cjs` scripts passed, and `app.js` passed `node --check`. Browser validation remains outstanding.


## Latest continuation pass — Jen side quests
- Added Unpaid Tab and A Familiar Face options to Jen’s dialogue menu. Both use per-character quest flags and appear in active/completed quest journal sections.
- Unpaid Tab checks the player can afford 12 Bolts before charging; completion pays 20 Bolts and 25 XP. A Familiar Face has a one-time 30 XP / 10 Bolt completion reward.
- Added `QA_EVIDENCE/v555-jen-extra-quests-test.cjs` (10 source assertions). Browser interaction and save/load checks remain outstanding.


## Latest continuation pass — Tim bounty contract
- Implemented Tim's Trouble at the Old House contract using the existing Wayne/house-squatter progression. Players accept the contract from Tim's Work topic, defeat the existing squatter to obtain proof, and return to Tim to claim 100 XP and 75 Bolts. The contract state appears in active/completed quest journal sections and is set to complete before rewards are granted to prevent repeated collection.
- Added `QA_EVIDENCE/v555-tim-old-house-bounty-test.cjs` (10 source assertions).
- Validation: 10/10 new assertions passed; all 49 `QA_EVIDENCE/*.cjs` suites passed; top-level JavaScript syntax checks passed. Browser/save-load integration remains outstanding; Terrible Billy is still unimplemented.


## Latest continuation pass — Terrible Billy bounty
- Implemented Tim's Terrible Billy contract as a character-flagged quest: accept from Tim's Work topic, use HUNT TERRIBLE BILLY during a road encounter, fight a named Level 5 raider, and return proof to Tim.
- Victory marks proof; Collect Bounty transitions proof to done before awarding 140 XP and 100 Bolts, preventing repeat payout. Added active/completed quest-journal entries.
- Added `QA_EVIDENCE/v555-terrible-billy-bounty-test.cjs` (10 source assertions); 10/10 passed.
- Validation: all 50 `QA_EVIDENCE/*.cjs` tests passed when run from the development directory; all top-level JavaScript files passed `node --check`. Four legacy scripts fail if launched from another working directory because they use relative file paths; this is a harness invocation limitation, not a gameplay failure. Browser combat and save/load verification remain outstanding.


## Latest continuation pass — Day/night audit
- Added `QA_EVIDENCE/v555-day-night-boundaries-test.cjs` (10 source assertions). Confirmed phase boundaries: DARK before 06:00, DAWN 06:00–07:59, DAY 08:00–16:59, DUSK 17:00–19:59, DARK from 20:00. Confirmed turn spending rejects invalid counts and overspending, advances world hour by actual spent turns, and retains night combat damage and XP bonuses.
- Validation: day/night assertions passed 10/10; all top-level JavaScript files passed syntax checks. The full QA_EVIDENCE suite is being rerun from the development directory because four legacy tests use working-directory-relative file paths.


## Latest continuation pass — Service Road navigation
- Added `QA_EVIDENCE/v555-service-road-navigation-test.cjs` (10 source assertions) covering branch return costs, duplicate Walk Back menu output, fast-return gating, one-turn step-back behavior, depth cap, and fork reverse choice.
- Validation: test passed 10/10; runtime browser route traversal and save/load testing remain outstanding.


## Latest continuation pass — Service Road and Niko’s Collar
- Added `QA_EVIDENCE/v555-service-road-navigation-test.cjs` (10 assertions) for branch costs, duplicate Walk Back output, insufficient-turn checks, return routing, depth cap, and reverse-direction option.
- Implemented Niko’s Collar max-HP delta on accessory equip/swap and a once-per-game-day Second Chance that leaves the player at 1 HP before normal death penalties; added `QA_EVIDENCE/v555-niko-collar-effects-test.cjs` (8 source assertions).
- Validation: both new tests passed (18/18 assertions); broader suite and syntax checks are being rerun. Critical-hit bonus remains to implement, and browser/save-load validation is outstanding.


## Latest continuation pass — Niko's Collar critical hit
- Wired the approved 2% critical chance into the main `handleCombat` player attack path, using a 1.5× base-damage multiplier and explicit critical-hit feedback. The effect only applies while Niko's Collar is equipped; other equipment retains its existing damage behavior.
- Extended `QA_EVIDENCE/v555-niko-collar-effects-test.cjs` with source assertions for equipped-only gating, randomized chance, damage multiplier, and combat feedback.
- Validation is pending targeted suite execution; browser/save-load verification remains outstanding.

- Continued Task 28: activated Iron Reaper's optional 10% bleed chance in the main combat path (3 bonus damage on proc) and added four targeted assertions. Browser crafting/combat validation remains outstanding.

## Latest continuation pass — Relay component flow audit
- Added `QA_EVIDENCE/v555-relay-component-flow-test.cjs` (12 source assertions) covering durable four-part state, legacy-save defaults, duplicate-acquisition prevention, component count, inventory display outside pack slots, all four component labels, acquisition guards for Johnny/Yard/Lower Access Road/east equipment rack, and installation gating.
- Validation: Relay flow test passed 12/12. This is source-level coverage; the four acquisition routes and install sequence still require browser/save-load integration tests.


## Latest continuation pass — Iron Reaper bleed runtime test
- Added `QA_EVIDENCE/v555-iron-reaper-bleed-runtime-test.cjs` to execute the real extracted combat handler with deterministic random values.
- Verified bleed proc adds exactly +3 damage and feedback, no-proc preserves base damage, and non-Iron-Reaper weapons never trigger the effect.
- Validation: 7/7 runtime assertions passed. Full crafting timer/success/failure and save/load integration remain outstanding.

## Latest continuation pass — Iron Reaper crafting runtime
- Added `QA_EVIDENCE/v555-iron-reaper-crafting-runtime-test.cjs`, which loads the real game modules and exercises Murphy's recipe command flow.
- Verified Level 6 recipe selection, exact 8 Scrap / 4 Wire / 3 Cloth / 75 Bolt consumption, successful completion after timer expiry, failed crafting consuming materials without granting the weapon, and the Level 6 gate.
- Validation: 14/14 runtime assertions passed. This improves Task 28 coverage; save/reload during active crafting and browser UI verification remain outstanding.
- Follow-up: extended `v555-iron-reaper-crafting-runtime-test.cjs` to exercise the actual saveGame/loadGame path with an active Iron Reaper job. The job key, consumed materials, and Bolt balance survive reload. Craft runtime suite now passes 20/20 assertions; full browser UI validation remains outstanding.

## Latest continuation pass — Random equipment drop runtime validation
- Added `QA_EVIDENCE/v555-random-equipment-runtime-test.cjs` (12 assertions) exercising the actual rarity roller at every threshold boundary: 0/54.999 Common, 55/84.999 Uncommon, 85/97.999 Rare, and 98/99.999 Epic.
- Verified full-pack equipment is held in pending drops and can be claimed after pack capacity is restored.
- Validation: 12/12 runtime assertions passed. Task 27 still needs larger statistical sampling and broader encounter/save-load integration.

## Latest continuation pass — Random equipment rarity statistical sampling
- Added `QA_EVIDENCE/v555-rarity-statistical-test.cjs` to exercise the actual rarity roller with a reproducible seeded PRNG across 100,000 equipment drops.
- Observed Common 55,035 (55.035%), Uncommon 30,246 (30.246%), Rare 12,779 (12.779%), Epic 1,940 (1.940%), all within ±1 percentage point of the approved 55/30/13/2 targets.
- Validation: new test passed all four distribution assertions; all 58 `QA_EVIDENCE/*.cjs` scripts passed from the development directory; all top-level JS files passed syntax checks.
- Task 27 remains partially validated pending actual encounter integration, save/load of pending drops, and browser UI verification.

## Latest continuation — Pending random equipment save/load integration
- Extended `QA_EVIDENCE/v555-random-equipment-runtime-test.cjs` to execute real `saveGame(2)` / `loadGame(2)` with a pending full-backpack equipment drop, then claim it exactly once after making room.
- Validation: 17/17 random-equipment runtime assertions passed; all 58 QA_EVIDENCE `.cjs` scripts passed; all top-level JavaScript files passed syntax checks.
- Task 27 still needs browser UI verification and encounter end-to-end sampling; not release complete.

- Continuation: repaired Niko Collar Second Chance combat softlock by routing through existing flee handling instead of clearing combatState while leaving stage=combat; updated targeted regression assertion. Browser verification still required.

## Latest continuation — Niko Second Chance runtime regression
- Added `QA_EVIDENCE/v555-niko-second-chance-runtime.cjs` exercising the extracted live `tryNikoSecondChance` function in a controlled VM, including lethal rescue at 1 HP, retreat transition out of combat, same-day one-use guard, next-day reset, unequipped collar, and nonlethal states.
- All 59 QA scripts pass from the development directory; all top-level JavaScript syntax checks pass.
- Task 25 remains PARTIAL until real browser combat and save/load testing verifies recovery routes for each combat source.

## Continuation checkpoint — full QA runner stability
- Re-ran all 61 QA_EVIDENCE scripts under a 5-second-per-script watchdog. Three harnesses printed successful assertions but retained application timers, causing the process to time out. Added explicit process termination *after* completed synchronous assertions to those three harnesses; no gameplay source changes were made.
- Re-ran all 61 scripts: **61/61 passed, zero timeouts/failures**. All top-level JavaScript files passed `node --check`.
- This is a targeted automated suite result, not full browser QA or release sign-off. All 31 work-order statuses remain unchanged.

## Continuation checkpoint — QA suite verification
- Re-ran the entire current QA_EVIDENCE directory using a per-script watchdog: **61/61 passed**, zero failures.
- Ran `node --check` against every top-level `.js` file: all passed.
- Reviewed Task 25 Second Chance routing: the live implementation delegates to `handleCombat("flee")`, which contains source-specific return paths; targeted tests cover ten sources and persistence, but browser validation is still required.
- Updated task descriptions 25, 27, and 28 to reflect completed targeted runtime tests rather than stale earlier implementation gaps. No release-ready claim or ZIP packaging.

## Continuation checkpoint — live day/night runtime
- Added `QA_EVIDENCE/v555-day-night-runtime-test.cjs` exercising the actual `spendTurns`, `timePhase`, and `isDark` functions in an isolated VM. Covered DUSK→DARK transition, turn accounting, overspending, invalid/zero turn costs, midnight rollover, QA mode and all four day phases (19 assertions).
- Full automated regression: **62/62 QA scripts passed**, zero timeouts/failures using 6-second per-script watchdog; top-level JavaScript syntax checks passed.
- Task 29 remains PARTIAL pending browser end-to-end turn/clock and zero-turn town interaction verification. Task 31 remains OPEN pending full browser and release verification.

## Continuation checkpoint — Service Road live menu runtime
- Added `QA_EVIDENCE/v555-service-road-runtime-test.cjs` evaluating the actual `branchReturnCost`, `serviceRoadChoices`, and `branchLandmarkChoices` functions in an isolated VM. 23 assertions cover depth-scaled fast-return costs, one Walk Back per menu, return availability, consumed landmark visibility, and maintenance-yard completion gating.
- Full automated regression: **63/63 QA scripts passed**, zero failures with six-second per-script watchdog; top-level JavaScript syntax checks passed.
- Task 30 remains PARTIAL pending actual browser travel and turn-cost integration, especially exhausted-turn and save/load scenarios. Task 31 remains OPEN.

## Continuation — Encounter repetition runtime coverage
- Added `QA_EVIDENCE/v555-encounter-repetition-runtime-test.cjs` exercising live `rerollRoad`, `rememberEncounter`, history migration and both encounter pools: 261 assertions passed, including 250 randomized uniqueness runs, fresh-before-recent selection, level gating and duplicate history suppression.
- Full QA suite: 64/64 scripts passed with per-script timeout; all top-level JavaScript syntax checks passed.
- Task 6 remains PARTIAL pending browser encounter sequencing and save/load history checks. No gameplay code changes were required.
