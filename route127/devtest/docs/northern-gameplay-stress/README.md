# Northern region gameplay stress test — 2026-11-24

Baseline: `e3592e1451b67bf606aec96712339cce5560422c` (Industrial repairs deployed).
Scope: NORTH-eligible road scenarios and Old House/Northern Ridge/East Ridge/West Ridge menus. Isolated local DEVTEST and PLAYTEST profiles; owner's hosted character and account never loaded or changed. No new content, balance, art, casino or permanent quest changes.

## Confirmed defects repaired

| Scenario | ID | Reproduction and repair |
| --- | --- | --- |
| The Quarry Lift | `east:12` | Graphical **Drop the Suspended Beam** reached the global inventory Drop handler and said “You are not carrying that.” An exact current encounter action now takes precedence over inventory Drop. Successful beam: Chain Swinger removed before combat. Failed beam: all three opponents and authored initial retaliation retained. Inventory Drop/Cancel and unavailable-item feedback remain functional. |
| The Dust Horses | `east:40` | Clear the fence, then refresh during the horse offer: saved `phase: offer` remained, but there were no usable buttons. The shared choice-line verb recognizer omitted CALM; a two-option CALM/LEAVE line therefore failed classification. Recognizing CALM restores both buttons without rerolling or clearing the offer. Reproduced in the browser and native loader, verified in both environment builds. |

Production files: each environment's `app.js` plus matching `index.html` app cache version. Identical narrow repairs applied independently; no DEVTEST-only features copied into PLAYTEST.

## Coverage and results

| Verification | DEVTEST | PLAYTEST |
| --- | ---: | ---: |
| Eligible scenarios exercised | 69 | 69 |
| Native graphical command executions | 3,500 | 3,460 |
| Distinct scenario/command pairs | 480 | 475 |
| Scenario/profile/menu-path contexts | 825 | 807 |
| Combat victories in native branch fixtures | 580 | 580 |
| Native combat commands | 3,812 | 3,812 |
| Unresolved errors / routing failures / truncation limits | 0 / 0 / 0 | 0 / 0 / 0 |

The native harness boots the shipped entry scripts, dispatches actual GraphicalUI commands and dialog callbacks, traverses nested menus, and executes real attacks and consumables. Five profiles: supplied day with low/high controlled random outcomes, supplied night, empty pack/no Bolts, returning level 15. Base equipment is ordinary level-matched Uncommon gear (level 5 otherwise); no enemy HP reduction or invulnerability. Eleven stress-test deaths per build were recorded, not repaired through balance changes. Counts include replayed branch fixtures; they are not a continuous playthrough or travel count. The initial pass had 575 victories: the beam defect then blocked five combat branches. The final pass reaches 580. CALM reload regression is verified separately after that pass; no menu-branch logic changed.

Native locations: 10 menu contexts, 42 distinct actions, 4 nested paths, 84 executions; no missing responses, duplicate choices or truncation. Old House unclaimed/occupied/owned, Northern Ridge exterior, East Ridge, West Ridge. Northern Ridge/Grand City interior remains an intentional future preview; connecting roads remain available.

Actual browser DEVTEST: **84 game commands**, **24 distinct road scenarios with selected actions**, **7 real movement steps** (Northern Ridge → East Ridge), **2 combat victories** (House Squatter and repaired Chain Gang), **0 script errors**. Controlled encounter selections/checkpoint relocations (27, including an explicit isolated-profile reset) are not counted as travel. Native storage controls, result-popup Continue and Scrap Duel Stop Watching were additionally clicked; these callbacks are not counted in command-handler totals. Tess Arden's small talk, inspection, browsing, one Bandage purchase (18 Bolts), Back and Move On were exercised on the real road traversal. A dormant registry ID attached to a wanderer step is excluded from scenario coverage.

Actual browser PLAYTEST build: both repaired scenarios, 3 game commands plus reload and encounter-selection controls. Verified horse offer buttons after refresh and beam-started combat. This is a local browser of the actual public entry, with independent test storage; not the owner's hosted character. Screenshots and DOM-backed event logs are included. Browser evidence distinguishes this small public-build regression from the larger DEVTEST session.

## Targeted regressions

Passed for both entries:

- Quarry Lift low/high outcomes, correct 2/3 opponents, preserved failed-beam retaliation, no pack deduction or additional travel turn; ordinary inventory Drop/Cancel and unavailable-item path.
- Dust Horses active phase and CALM/LEAVE choices survive native save/load and browser refresh. Ownership persists, no duplicate horse, herd-help XP and saddlebag rewards retain permanent protection; completed eligibility stays complete.
- Four dog variants select distinct artwork, an active variant survives save/load, and food choices become available again on subsequent visits with the correct item deduction.
- Old House cabinet reward once, real combat attack and exact combat/player-health restoration, house claim once (+100 quest XP), storage accounting and save/load persistence, ownership and quest completion retained; no extra travel turn. DEVTEST's existing partial-stack graphical chest and PLAYTEST's existing storage handling remain separate.
- Browser combat healing: Bandage 174→180 (clamped) and 76→121 (+45 = 25% of 180), enemy HP unchanged; attacks retain normal retaliation. House reward total was +130 XP including the authored 30 combat XP, not repeated quest rewards.
- Browser item/payment examples: Northern Poachers −6 Bolts; road Bandage purchase −18 Bolts; Chain Bridge consumes its Rope as a permanent handline. Missing Bone Collector bones give an explicit explanation and keep choices usable. Repeated Cold Road Camp information gives no second XP reward.
- Central persistence and Industrial County Truck exit regressions passed after the shared command parser changes. JavaScript syntax checks passed for both app files.

Existing saves need no migration or flag deletion. Repairs consume current saved encounter state and preserve inventory, currency, experience, owned house/horse, permanent rewards, quest outcomes and cooldowns. The owner's approved Scrap Duel interruption-forfeit rule is unchanged.

## Limits

All 69 roster entries were tested natively, but only the 24 named in the browser event log were selected graphically in this regional session. Controlled rolls sample supported branches rather than exhaust every probability, level, equipment combination or quest checkpoint. Freeform dog naming/adoption and precise timing-game aiming were not exhaustively tested; no new timing mechanics were introduced. No mobile browser pass, full game playthrough, dedicated save recovery investigation or renewed global persistence audit. Locked Freezer is outside NORTH's eligible roster and was not retested here.

## Reproduction

From repository root:

```sh
NORTHERN_MENU_LIMIT=60 NORTHERN_DEPTH=6 node route127/devtest/tests/northern-gameplay-stress.cjs
ROUTE127_RELEASE=1 NORTHERN_MENU_LIMIT=60 NORTHERN_DEPTH=6 NORTHERN_OUT=/tmp/northern-release node route127/devtest/tests/northern-gameplay-stress.cjs
node route127/devtest/tests/northern-routing-regression.cjs
node route127/devtest/tests/northern-persistence-regression.cjs
node route127/devtest/tests/northern-house-regression.cjs
ROUTE127_RELEASE=1 node route127/devtest/tests/northern-routing-regression.cjs
ROUTE127_RELEASE=1 node route127/devtest/tests/northern-persistence-regression.cjs
ROUTE127_RELEASE=1 node route127/devtest/tests/northern-house-regression.cjs
MENU_ROOTS_FILE=./fixtures/northern-menu-roots.json MENU_PROFILE=supplied MENU_GRAPHICS=1 MENU_DEPTH=6 MENU_LIMIT=180 node route127/devtest/tests/non-scenario-menus.cjs
```

`roster.json` lists all IDs and lifecycle policies; compressed case/event files contain branch-level evidence. Preview-only QA UI and storage namespaces are not included in deployed entries.
