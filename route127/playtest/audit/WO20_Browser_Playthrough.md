# WO20 browser playthrough and consolidated repair

Date: November 2, 2026. Baseline main: `6604cda5e55c5c76741671bff104f272762e68a3`.
GitHub Pages baseline run 41478157157 succeeded. The live index matched this checkout byte for byte.

## Browser and character

Supported CUA cloud Chrome browser (`cdp`), desktop viewport approximately 1363 × 936. Its returned browser documentation was followed; no separate browser plugin/skill was exposed in the available skill catalog. No local Chromium launch was used. Title screen opened successfully. No local-preview connection was exposed between this remote browser and the source checkout, so local repairs were checked with the code harness before one production deployment.

Normal New Game in empty Save 1, traveler `ash walker`. All three manual slots were shown empty before creation. Full house introduction, bandage/cash/pack searches and transmission were played. No grants, save editing, debug access, time changes, enemy overrides, or progression bypasses were used in the browser. Existing saves were not overwritten. Reload resumed the character through autosave; V subsequently saved its own Save 1. Safe reload milestones: Solace and Scrap Yard.

Route reached: House → Upper Highway Junction → Solace north gate → Murphy Relay inquiry → all four Relay diagnostics → Johnny Power Regulator → south gate → Works Junction → Scrap Yard → Yardman fight and retreat. Character stopped safely at Scrap Yard: level 1, 38/100 HP, 55/100 XP, 22 Bolts, 33/150 turns, one Energy Bar, Rusted Pipe and Worn Jacket. One of four Relay components recovered.

Stopping point is legitimate combat preparation, not a game blocker: Yardman retained 41/55 HP after two attacks; player lost 13 and 17 HP, with only one 10-HP food remaining. Retreated normally, used the return exit, saved and reloaded. Remaining components, completed Relay, Factory interior and Seaport were not browser-played. Do not interpret code-suite progression fixtures as browser completion.

## Confirmed repairs

1. Initial Road handoff registered encounter choices, then the queued travel menu overwrote them. Live Abandoned Sedan showed travel buttons while the encounter remained pending; the apparent Continue action instead left the encounter. Reproduced in the full-load-order harness across six normal encounter selections. Await the queued initial road menu before generating the first encounter. Movement still costs exactly one turn. No encounter pool changes.
2. Loading graph nodes rendered the scene in the base loader and again in the graph wrapper, also exposing `LOCATION RESTORED — LANTERNNODE`. Live Scrap Yard reload displayed both copies. Base loader now handles graph node/road/gate stages explicitly; wrapper retains only legacy between-segment menu recovery. Migration, projection, save keys and identities remain intact. Checked captured loader wrappers and runtime choice-renderer dispatch before removing the duplicate calls.

`app.js` and `lantern_world.js` cache versions updated together. No graphics, balance, scenario/drop rates or item definitions changed.

## Browser checks

- Title, New Game confirmation, name popup, all tested house controls and graphical activation worked.
- Solace first numbered guard answer admitted the character. South gate, Works Junction and Scrap Yard exits worked. Yardman retreat's old `Return to Fork` label returned to the actual Scrap Yard road node; no teleport or movement bypass was used.
- Backpack and Character outside combat, and Backpack/Character/Journal during combat, opened and returned to gameplay. Character showed equipped weapon and armor. Menu inspection caused no retaliation.
- Attack advanced combat and triggered an enemy reply. Bandage through Backpack restored 84→100 HP (25% maximum, capped), consumed once and left enemy HP 64/70. At full HP its Use action was absent. Energy Bar through combat Use Item restored 58→68 HP (10%) and left Yardman HP 55/55. No healing retaliation observed.
- V keyboard save worked; reload retained Scrap Yard, 38 HP, 33 turns and equipment. Other letter shortcuts and direct typed numeric keyboard entry were not exhaustively checked; graphical numbered buttons were used throughout.
- No stronger equipment was acquired, so automatic upgrades and displaced-gear retention are code-tested only.
- Console observations showed extension metadata errors, not a game JavaScript exception.

## Encounter log

No repeated specific encounter name within these 16 movement scenes. Generic WANDERER recurred at turns 7, 8 and 13 with different people. No distribution inference is justified by this small sample.

| Turns | Road and direction | Encounter names in order |
|---|---|---|
| 1–6 | Route 127, Old House → Upper Highway Junction, south | Abandoned Sedan; Fresh Meat; The Big Man; The Knife Wind; Station Nine Discovery Storyline; The Wax Museum |
| 7–10 | Route 127, Upper Highway Junction → Solace, south | Wanderer—June Whitaker; Wanderer—Bolt Ramsey; Maintenance Box; Gunshop Owner |
| 11–13 | Route 127, Solace → Works Junction, south | Payment Required; The Mask Market; Wanderer—Patch Hensley |
| 14–16 | Scrap Yard Road, Works Junction → Scrap Yard, east | The Fighting Ring; Tommy Briggs—Postal Encounter; East Road—Highway Robbers |

No movement encounters were played in reverse. Free landmark searches on Scrap Yard Road yielded five and seven Bolts plus four and five XP. Yardman initiation spent one additional turn (17 turns total spent).

## Validation

`node tests/wo20.cjs`: six initial encounter menus, one movement charge, pending-encounter Backpack return; graph node/road/gate reload exactly once, stable choices and no extra movement. Initial handoff test was run against the baseline and failed with “Queued travel menu replaced encounter choices,” then passed after repair.

Existing suites: `wo19.cjs`, `wo18.cjs`, `wo17.cjs`, `playthrough_repairs.cjs`, `input_dialogs.cjs`, `identity_colors.cjs`. These use synthetic local fixtures, including isolated movement and reduced boss health in older progression tests; they are not browser playthrough evidence. Final commit and deployment status are reported separately after publication and live verification.
