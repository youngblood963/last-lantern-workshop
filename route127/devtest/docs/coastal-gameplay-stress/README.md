# Seaport and Causeway gameplay stress test — 2026-11-24

Baseline: `539fd7d900ca85d501c60a46cfb8700cbf28ce14` (Northern repairs deployed). Scope: the union of SEAPORT and CAUSEWAY eligible scenarios, their crossing, Seaport services and NPC/quest interfaces. All characters and storage were isolated from the owner's hosted account and persistent character. No balance, artwork, casino layout, travel-cost or new-content changes.

## Four confirmed repairs

| Area | ID / environment | Defect and final behavior |
| --- | --- | --- |
| Fence Artist | `early:43`, both builds | **Dismantle the Sculpture** was intercepted by inventory dismantling and returned “You aren't carrying that.” Exact authored Drop/Dismantle actions now reach their encounter handler before inventory commands. The sculpture yields one Scrap Metal and retains Enid's intended permanent consequence. Ordinary flashlight dismantling and the previously repaired Quarry Lift Drop action still work. |
| Silent Picnic | `early:41`, both builds | Searching the hollow piece for six Bolts made the fallback reward-group completion check finish the entire puzzle. Subsequent actions could be blocked, and refreshing replaced the unresolved encounter. Completion now uses the established terminal flag `r18PicnicClaimed`. Active puzzle variant, played choices, location, side reward and solved-but-unclaimed compartment survive reload. The final compartment reward remains one-time. |
| General Store Sell Items | Seaport service, DEVTEST | Any sellable valuable could throw `ReferenceError: OLD_WORLD_TREASURES is not defined`, leaving no menu. The optional catalog lookup is now guarded. Existing `v48SellPrice`, staff adjustments, catalog behavior when present, cancellation, payment and merchandise are preserved. Public PLAYTEST's existing handler did not have this exception and was regression-tested without replacement. |
| Liberation directions | Seaport liberation, DEVTEST | Old dialogue directed the player to a Workshop terminal suppressed by the current finale. It now points to Kaiden/Keeping the Lights On and the Rusty Anchor back room. PLAYTEST already gave those correct directions. Quest gates and rewards are unchanged. |

Production changes: `devtest/app.js`, `playtest/app.js` (exact command routing); both `lifecycle.js` files (Silent Picnic terminal completion); `devtest/recruitment.js` (optional catalog guard); `playtest/v55.js` (the legacy script actually loaded by DEVTEST through its existing base URL); matching index cache versions. PLAYTEST's entry uses `v55-release.js`, which already has correct directions and is unchanged. No unrelated DEVTEST features were promoted.

## Coverage

Regional membership: **62 SEAPORT + 38 CAUSEWAY = 70 distinct scenarios** (shared entries counted once). `roster.json` records IDs and membership. Causeway-specific profiles skip entries not eligible there; fixture entry asserts that the actual painted region equals the requested test region.

| Native graphical-command coverage | DEVTEST | PLAYTEST |
| --- | ---: | ---: |
| Distinct eligible scenarios | 70 | 70 |
| Branch command executions | 3,430 | 3,392 |
| Distinct scenario/command pairs | 440 | 435 |
| Scenario/profile/menu-path contexts | 878 | 860 |
| Combat victories in replayed branch fixtures | 453 | 453 |
| Combat commands | 2,550 | 2,550 |
| Errors / unresolved routing issues / truncation limits | 0 / 0 / 0 | 0 / 0 / 0 |

The harness loads the shipped entry, dispatches native graphical commands and dialog callbacks, explores nested menus, and completes real engine combats. Profiles: supplied day low/high rolls, supplied night, no supplies/no Bolts, returning level 20, Causeway day and night. Ordinary level-matched Uncommon equipment, level 10 otherwise; unlimited test movement, not invulnerability. Seven stress deaths per build are retained; no difficulty was reduced. These combat and branch totals include replayed fixtures, not continuous-play victories or movement. The final files replace only Silent Picnic's rows with the targeted post-lifecycle-repair pass; other rows come from the full region-correct pass.

Additional tests, outside those totals:

- Supplied Seaport services: **100 menu contexts, 282 distinct actions, 804 executions**, no issues/duplicates/truncations.
- Empty-pack/no-Bolts services: **58 menu contexts, 188 actions, 445 executions**, no issues/duplicates/truncations.
- Ranged weapon pass: **3 scenarios, 100 cases, 63 combat victories**, no issues: Tactical Sniper, Floodlight Sweep and Powder Monkey. This exercises successful ranged branches in addition to the no-ranged-weapon explanations in the normal pass.
- Eight targeted Coastal routing/vendor/persistence/picnic regressions (four suites for each entry) passed, as did Northern command routing/horse persistence and Industrial persistence regressions after the shared changes. Syntax and diff whitespace checks passed.

## Actual graphical gameplay

DEVTEST browser: **184 game commands, 35 distinct road scenarios with selected actions, 24 actual movement steps and 2 combat victories**. The two complete 12-step crossings were Boulder Junction → Seaport → Boulder Junction. Day, dusk and night were exercised. Controlled encounter selections/checkpoint relocations (26) are excluded from movement; dialog buttons such as Assign, deposit submission and result Continue are outside command-handler totals. Dormant encounter IDs on wanderer steps are excluded from scenario counts.

Graphical interactions included:

- Fishermen investigation/confrontation, a real attack, refresh with unchanged combat/player HP, repeated bandages without retaliation, victory, survivor release and the single auto-equipped Harbor Guard Cutlass. Ownership/staff and liberation survived reload.
- Actual recruitment, aptitude inspection and popup inspection, assignment to General Store, unassignment and reassignment to Bank. Names/sprites appeared in assigned shops; Bank retained Tess after save/load. A deposit/withdrawal of ten Bolts returned the original balance without a fee.
- General Store valuable sale failure before repair; afterward Cancel preserved supplies/currency and Confirm sold one Family Photograph for the displayed ten Bolts. No stock or price changes.
- Kaiden → Small Talk → Keeping the Lights On → Accept; Rusty Anchor back-room access, Examine Computer and the explicit missing-module explanation; Leave returned to the bar. Casino entrance showed its existing five games and Return to Mia worked. No casino mechanics were changed.
- Old Man Finn discovered naturally at crossing step six; supplies, an 18-Bolt Bandage purchase, valuable sale confirmation, return to Causeway and a repeat visit without extra movement.
- Crab Trap inspection, multi-target combat completion and crab loot; Crab Nest inspection; coastal sniper/bomber ranged requirements; pirate payment; unique windshield acquisition and a subsequent visit without another cabinet reward; freight, glass, fog, toxic cargo, seagull and cart interactions; fixed-site discovery clues and road wanderer exits.
- Fence Artist Dismantle before/after; Silent Picnic wrong move, side reward, the pre-repair refresh failure, then repaired active refresh with the same scene and remaining choices, checkmate and compartment reward.

The browser log contains four error notifications: two reports of one preflight invalid-node fixture error, and two reports of the one pre-repair vendor exception. The invalid test checkpoint was corrected before successful recruitment/assignment testing; it was not treated as a game defect. No further script exception occurred during the completed regional session. A first-arrival narrative in a prefilled liberated fixture is not evidence of a production save bug; no arrival/quest state was changed to mask it.

PLAYTEST entry browser: the two shared scenario repairs, two game commands plus controlled selections and refresh. Verified Fence Artist reward and Silent Picnic active scene/choices/currency after its side reward. This used the actual public build locally with separate storage; it was not the owner's public character. Screenshot `picnic-reload-playtest.jpg` shows the restored puzzle menu. Compressed DOM-backed event logs and native case data are included.

## Persistence and existing saves

Targeted suites verify actual Fishermen combat/health reload, one healing item consumed without retaliation, liberation and one Cutlass reward; unique Corvette windshield protection; active dog state and fresh eligible food choices; Fence Artist permanent consequence; merchant inventory/balance/staff reload; and both unresolved and completed Silent Picnic saves.

The Picnic repair also restores eligibility for older characters whose only Picnic completion record is the hollow-piece side reward. It does not clear any flags or redistribute that reward. `r18PicnicClaimed` still excludes fully completed encounters; opening the final compartment again cannot duplicate resources. No other lifecycle policy, quest, named rescue, boss, inventory, currency, XP or cooldown was reset. Scrap Duel's approved interruption-forfeit rule is unchanged.

## Limits and owner review

All 70 eligible roster entries were executed natively, but only the 35 recorded in the DEVTEST browser log were selected graphically. Not every probability, equipment level, optional quest state, freeform entry or timing-game gesture was exhausted. No mobile browser verification or new full-game/global persistence audit. Crab Trap and Crab Nest currently have authored fixed opponents, not interchangeable random crab variants; no artificial reroll system was added. Existing supplied/poor service roots cover occupied and liberated Seaport, General Store, Workshop, Clinic, Bank, Caleb and Miles; the browser additionally covers Finn, staffing, Kaiden, Mia and the finale's gated back room.

Owner review: staffing lists render Tess as “Tess Arden” while the full information panel titles her “Tess Calder.” This appears to be conflicting existing display-name metadata. Identity keys, recruitment records and naming were left unchanged rather than choosing a surname without owner direction. It did not block inspection or assignment. No other confirmed functional blocker remains in the tested paths.

## Reproduction

```sh
COASTAL_MENU_LIMIT=60 COASTAL_DEPTH=6 node route127/devtest/tests/coastal-gameplay-stress.cjs
ROUTE127_RELEASE=1 COASTAL_MENU_LIMIT=60 COASTAL_DEPTH=6 COASTAL_OUT=/tmp/coastal-release node route127/devtest/tests/coastal-gameplay-stress.cjs
node route127/devtest/tests/coastal-routing-regression.cjs
node route127/devtest/tests/coastal-vendor-regression.cjs
node route127/devtest/tests/coastal-persistence-regression.cjs
node route127/devtest/tests/coastal-picnic-regression.cjs
# Repeat the four targeted suites with ROUTE127_RELEASE=1.
MENU_ROOTS_FILE=./fixtures/coastal-menu-roots.json MENU_PROFILE=supplied MENU_GRAPHICS=1 MENU_DEPTH=6 MENU_LIMIT=180 node route127/devtest/tests/non-scenario-menus.cjs
# Repeat service roots with MENU_PROFILE=poor.
```

Preview controls and isolated-storage injection are not deployed. Full native reruns replace summary files; preserve the checked-in evidence unless intentionally refreshing it.
