# Route 127 v55.2 — QA report

## Executed automated tests
- Node `--check` on all game JavaScript: PASS.
- `QA_EVIDENCE/v552-targeted.cjs`: 28 state assertions PASS. Covers legacy initialization, liberation, reward uniqueness, full-pack pending/claim, art replay without state mutation, purchase prices/duplicate protection, pet switching, Ferret conservation and dead/empty targets, patrol movement/presence and zero-turn behavior, finale once-only.
- `QA_EVIDENCE/v551-targeted.cjs`: 11 assertions PASS.
- `QA_EVIDENCE/seaport-static-test.cjs`: 15 integration/source assertions PASS.
- `QA_EVIDENCE/factory-random-loot-test.cjs`: PASS.

## Defects addressed
1. Kaiden's patrol location was displayed but he had no actual presence at the indicated stop. Added accessible patrol-stop menus and location gating.
2. Mia's casino reused Jen's heading and some BACK/TOWN routes. Fixed return destination and heading, added casino-context restoration on load.
3. Full-pack Cutlass pending queue lacked a player-accessible claim action. Added claim option.
4. No liberation ANSI scene existed. Added one-time terminal character art and non-mutating replay.

## Known limitations / not certified
- No full browser playthrough was performed, as requested. No targeted live browser interactions were completed. Casino payouts and turn handling were inherited from the existing engine and were not comprehensively replayed in a browser.
- State-level tests are stubs and cannot certify real DOM rendering, scrolling, mobile fit, hotkey behavior, animation timing, or save/load from actual browser storage.
- Historical saves with Seaport already liberated before v55.2 may not automatically display the art; replay remains available from the quest interface.
- Some existing v55.1 pet passive effects and casino save/reload edge cases require deeper end-to-end QA; the targeted assertions do not exhaustively cover all requested exploit scenarios.
- No new level-10 general ANSI generation system was implemented; the art is an event-only preview.

## Manual verification recommended
1. Defeat fishermen, free residents, confirm colored character art appears exactly once and chapter ending follows Kaiden/Mia conversations.
2. Visit all four patrol stops as cumulative turns advance; check Kaiden dialogue and quest completion.
3. From Mia, play each gambling game, exit from menu and game, save/load mid-casino, then visit Jen.
4. Fill pack before liberation, claim Cutlass later, save/load, verify no duplicate.
5. Confirm art replay and readable mobile layout; test navigation/quest hotkeys.

Status: **development candidate; not fully browser-certified or complete against every v55.2 QA requirement**.
