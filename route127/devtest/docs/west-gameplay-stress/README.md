# West gameplay stress test — 24 November 2026

## Repairs

1. **THE STRANDED FAMILY (`early:172`, WO7 `W1`)**: its initial six-action prompt contained only one verb recognized by the shared menu detector. It printed the actions without registering buttons or hotkeys, stranding graphical players. Added REPAIR, DONATE and DEMAND to the existing detector in both `app.js` builds. All six authored commands, including Leave, now appear and route normally. Existing item requirements, deductions, XP, payment and encounter completion remain unchanged. No save migration is necessary; re-rendering or loading the active encounter builds the repaired choices.
2. **Tess display surname**: standardized the three legacy profile copies to **Tess Arden**, matching the existing `identity_colors.js` mapping. Canonical `name: "Tess"`, recruitment, biography, skills, existing rolled aptitudes, inventory and both settlements' assignment keys are unchanged. Updated only the relevant script cache versions alongside the menu repair.

## Coverage

The roster is derived from the shipped registry's WEST eligibility and lifecycle policies, not filenames or road tags. The fixture asserts the native geography at the selected West road coordinate. All 82 eligible scenarios received active native graphical dispatch testing. Controlled branch selection, character preparation and test rolls are separate from travel totals.

| Native execution | DEVTEST | PLAYTEST |
| --- | ---: | ---: |
| Unique eligible scenarios | 82 | 82 |
| Graphical command cases | 3,823 | 3,767 |
| Distinct scenario/command pairs | 494 | 487 |
| Scenario/profile/menu paths | 879 | 859 |
| Combat victories, including branch replays | 364 | 364 |
| Combat commands | 2,381 | 2,381 |
| Character deaths | 8 | 8 |
| Remaining detected menu failures | 0 | 0 |
| Menu-limit truncations | 0 | 0 |

Profiles: supplied day with low and high outcome rolls; supplied night; empty inventory; returning level-20 character. Combat uses ordinary level-matched Uncommon catalog equipment and the real attack/heal engine with a seeded uniform RNG. The eight deaths are retained poor-inventory combat outcomes, not suppressed or repaired as difficulty defects. PLAYTEST and DEVTEST totals differ because their offered menus differ.

Desktop browser evidence records **40 DEVTEST commands, four actual movement steps, one Ant Swarm victory and zero script errors**, plus a separate isolated PLAYTEST Family donation and Tess profile check. The browser used all nine dedicated West scenarios (`early:172`–`early:180`), and naturally encountered Last Mail (`early:25`), Territorial Buck (`early:145`), Crawler (`early:20`) and Bishop during travel. Four movement steps include a step before controlled fixture visits; only the final three form the uninterrupted approach to Old Service Junction. Fixture selections are never counted as movement.

Actual graphical checks included Family vehicle repair and PLAYTEST food donation (Energy Bars 20 → 19, XP +48, no extra movement charge); Hunter's Trap release; Trading Post owner inspection and material donation; False Scarecrow questioning, refresh and belongings inspection; nighttime Bunker entry/reassurance; Ant Colony battle; Counterfeit Rations warning; Graveside Gambler inspection; Taxidermist dialogue and explicit missing-material feedback. Scarecrow refresh retained encounter, HP and turns. Ant combat refresh retained the identical enemy HP array and player HP; Bandage 30 → 29 restored HP 319 → 350 without changing enemy state, then combat completed and loot was awarded.

Motel browser checks covered assigned shop sprite, staffing selection/full inspection, confirm reassignment and reload, vendor roster and unstaffed Clinic explanation. All checked Tess panels say Arden. Native location/menu traversal covers Motel home, vendors, Lounge/casino entrances, Jessica, Deep End, behind the Motel, unlocked Mail Room, road destinations, Old Service Junction, Old Service Road, Scavenger Camp and Iron Pit exteriors: **54 menus, 243 distinct offered actions and 583 command checks**, with no failures, duplicates or truncations. A separate fully staffed Motel pass adds **91 menus, 212 distinct offered actions and 1,121 command checks**, including the five services and Rani; no failures, duplicates or truncations. These staff assignments are explicit isolated test fixtures, not a claim of testing every recruitment prerequisite. No community post was submitted.

## Targeted regressions

`west-repairs-regression.cjs` passes against both actual entry loaders: all six Family commands, no-supply feedback with zero consumption, exact supplied deductions, XP/completion, active reload, subsequent visit choices, fresh prisoner dialogue, canonical Tess identity and independent Motel/Seaport staffing records retained through reload.

Existing `freezer-lisa-visits.cjs`, `northern-persistence-regression.cjs` and `coastal-routing-regression.cjs` pass in both builds. These protect Freezer's 60/40 outcomes and unique Lisa reward, active-state stability, horse ownership and permanent rewards, four dog artwork variants, fresh repeatable food choices, Fence Artist command routing and ordinary inventory dismantling.

## Limits and preserved behavior

This is targeted active gameplay and branch testing, not a full playthrough. No owner save was used. Five controlled profiles do not exhaust every possible inventory, timing or quest combination. Freeform dog naming, every possible wager/value, distant quest handoffs, and future Scavenger Camp/Iron Pit interiors were not tested. Mobile was skipped under the owner's earlier instruction. Existing art placement, sky composition, casino layouts/odds, unique rewards, quest consequences and Scrap Duel's intentional interrupted-round forfeit remain unchanged. No further ambiguous West persistence behavior was identified requiring an owner decision.

Raw native cases and browser command observations are compressed alongside the roster and summary files. Screenshots show the repaired PLAYTEST Family menu and consistent Tess profile. QA controls/server remain untracked and are not loaded by either production entry.
