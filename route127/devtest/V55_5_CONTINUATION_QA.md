# Route 127 v55.5 continuation — NOT RELEASE READY

Baseline: v55.5 interim Development archive (derived from v55.4).

## Changes in this continuation
- Highway Robbers: throwing Bolts requires all five; escape now succeeds 60% without XP or fails 40% with 15 HP damage and no XP.
- Roach Nest: direct combat rewards increased to 25 XP and 8 Bolts; backing away no longer grants XP.
- Yardman encounter initialization: 55 HP, 7–12 normal damage, 65 XP and 28 Bolts. Heavy-swing mechanic is NOT implemented.
- Dust Over Schoolyard: pushing through now costs 10 HP.
- Security Drone: tightened fight-branch command matching so text containing 'drone' does not automatically initiate combat.

## Verification
- PASS: `node --check` for all JavaScript source files.
- NOT RUN: full browser playthrough, behavioral regression suite, save migration test, and UI rendering checks.
- NOT VERIFIED: interim duplicate-menu guard in real browser; zero-turn QA entry; all relay components; all combat payouts.

## Incomplete requirements
The majority of the original 31-area work order remains unimplemented, including multi-enemy combat, full encounter reward audit and repeat protection, expanded wanderers, Solace guard and NPC quest additions, accessories, Niko and Cheeseburger, player-room rest scaling, gambling gating, random equipment drop distribution, and end-to-end factory/Seaport regression testing. Do not distribute this as the completed v55.5 Player build.

## Additional continuation — Johnny interaction menu
- Added a dedicated Johnny's Trading Post front menu with `VIEW STOCK`, `SELL ITEMS`, `TALK`, and `BACK` choices.
- Stock and sales remain routed through the existing vendor/selling systems; the TALK option opens Johnny's existing dialogue and quest interactions.
- Added `QA_EVIDENCE/v555-johnny-main-menu-test.cjs`.
- Verification: 6/6 Johnny menu assertions passed; all JavaScript files passed `node --check`; all existing `*test.cjs` / `*targeted.cjs` / runtime test scripts passed when run from the development directory.
- Still not release-ready: full browser interaction testing and substantial original work-order requirements remain outstanding.

## Additional continuation work — accessory equipment slot and test harness
- Added a single accessory equipment slot with six approved accessories (three Common, three Uncommon).
- Accessory DEF bonuses contribute to armor defense; accessory damage bonuses contribute to weapon range.
- Added accessories to Mara's rotating stock and purchase-price table; inventory selection supports EQUIP.
- Equipped accessories are excluded from ordinary selling and banking, and accessory ownership is serialized in character saves. Legacy saves without the field migrate to `accessory: null`.
- Added `QA_EVIDENCE/v555-accessory-slot-test.cjs`; 9/9 assertions passed for item definitions, equipped bonuses, save snapshot round-trip, and sale/stash protection.
- Repaired four legacy automated test harnesses (`consolidation-qa.cjs`, `crime-qa.cjs`, `expansion-qa.cjs`, `legacy-qa.cjs`) to load `seaport.js`, where `portCommand()` is defined. The failure was in harness script loading, not in the game's HTML script order.
- Verification after these changes: all JavaScript files pass `node --check`; all 40 available `QA_EVIDENCE/*.cjs` scripts pass when run from the development directory.
- Limitations: accessory browser interaction and actual browser save/load are not yet verified. This remains a development continuation, not a release candidate.
