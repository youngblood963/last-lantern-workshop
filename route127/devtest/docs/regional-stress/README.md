# Regional gameplay session — concluded for owner review

The owner ended the extended run; original coverage targets are withdrawn for this session. No additional regional travel was performed during finalization. The subsequent **Finalize & Deploy Gameplay Repairs** work order authorizes merge and deployment of the verified repairs to DEVTEST and PLAYTEST. See `release-verification.md` for the promotion checks.

## Actual graphical coverage

| Measure | Confirmed coverage |
| --- | --- |
| Normal travel | 271 steps |
| Unique encounters | At least 76 distinct registry titles corroborated by preserved observations; exact total unavailable |
| Combat victories | At least 85 recorded at step 259; additional victories occurred before step 271 but final aggregate was lost |
| Defeats | None observed; defeat recovery is not certified |
| Retreats | At least 4 explicitly confirmed (Big Man, fishermen, Road Eater, Warden); exact aggregate unavailable |
| Causeway crossings | 2 complete, one each direction |
| Save/reload observations | 13 desktop/mobile restorations observed |
| Platforms | Desktop majority; representative 390×844 mobile travel, combat and loot; mobile vendor/inventory check interrupted |

See `documented-encounters.json` for the conservative distinct-title list. No static registry traversal is counted as graphical gameplay. Named wanderers, combat aliases and the free announcement are excluded from that list.

Lowlands, Seaport Coast and Causeway were played, including adjoining industrial boundary roads. Both directions completed: Iron Pit–Lowlands; Iron Pit–Arena Lower; Arena Lower–Factory West; Lowlands–Broken Bridge; Broken Bridge–West Coastal; Lowlands–Factory West; Factory West–West Coastal; West Coastal–West Harbor; East Harbor–Boulder; Coastal Road–East Harbor; Watchtower–Coastal Road; East Coastal–Watchtower; Factory East–East Coastal; Factory East–Coastal Road; Industrial Junction–East Coastal; Boulder–Seaport. West Harbor→Boulder was completed in one direction. Factory–Boulder reached its final pending encounter at step 271, not yet resolved. This is not 100% road coverage.

Natural interactions included County Depot/Unit 07/Eli, Miles' letter handoff and delivery acceptance, Pete's bicycle repair and trading, limited Finn stock, full-pack purchase rejection without charge, equipment disposal confirmation, missing Bandage feedback with choices retained, hound rescue/naming and desktop companion equipping. Deliveries remain unfinished. Seaport was reached occupied; Inspect preserved the scene, Confront started combat and retreat restored the occupied harbor without liberation rewards. Liberation and post-liberation services were not completed in this run. The separate casino check is documented in PR #197 and is not counted as continuous regional gameplay.

## Confirmed repairs

1. Free Crazy Steve news no longer strands an already-paid pending Lantern encounter.
2. Wanderer Inspect/Small Talk restores canonical trade/steal choices.
3. Successful explicit Leave completes an interaction; historical Corvette saves that consumed Leave retain usable controls without another travel charge.
4. Approved Road Reapers artwork remains visible during encounter-sourced combat; verified in a later natural fight.
5. Arena lobby publishes one visible exit through the canonical menu model while preserving both native exit aliases.
6. Roadside scene captions work beyond the former region whitelist when artwork is available.
7. Manual equipment swapping uses the existing `routeKeepGear` transfer guard. Previously, returning a stronger old weapon to the pack triggered the ordinary pickup auto-upgrade and immediately replaced the manually chosen shotgun again. This shared fix covers weapon/armor swaps and both graphical/terminal paths; normal loot auto-upgrades remain enabled.

The Factory Whistle still triggers its intended combat; the drone fight concluded and travel resumed. No balance, rewards, probabilities, recipes, quest requirements, approved artwork positions, public backend or PLAYTEST files changed.

## Shotgun investigation

All four canonical catalog variants were exercised: Sawed-Off (Common), Double-Barrel (Uncommon), Tactical (Rare), Thunderhead (Epic). Twelve isolated real-engine cases cover acquisition or saved inventory, weapon classification, actual graphical Backpack Equip callbacks, weaker/stronger swapping, stack quantities, stolen provenance, native save/load and native ranged combat damage. Normal pickup auto-upgrade was separately retained.

A preliminary probe passed bare display names as item identifiers, which produced materials: real catalog instances carry level/rarity suffixes, while the UI hides those suffixes. That synthetic input was not established as a live acquisition defect. Provisional alias/stat changes were removed; no new legacy stat policy was introduced. The reproducible valid-item failure was the shared manual-swap/auto-upgrade conflict. Public PLAYTEST was not changed or live-tested for this repair.

## Targeted regression results

- `node route127/devtest/tests/regional-stress-regressions.cjs` — PASS: paid event preservation, historical Leave recovery, wanderer menus, arena exit/native aliases, Reapers presentation ownership.
- `node route127/devtest/tests/non-scenario-panels.cjs` — PASS: actual Backpack use/drop cancel/parent restoration, Character/Journal, Options feedback, numeric entry and workbench overlay navigation.
- `node route127/devtest/tests/shotgun-equipment.cjs` — PASS: 12 shotgun cases plus unchanged normal automatic pickup upgrades.

The new shotgun checks use the actual offline DOM buttons and native handlers with isolated storage; they are not a fresh hosted browser playthrough. Existing live graphical repair verification occurred during the concluded run. Test-only deterministic combat RNG does not alter shipped code.

## Save and evidence preservation limitation

**The original isolated character could not be recovered after the execution/browser environment was replaced.** The replacement workspace was empty and its browser had no previous tabs. A read-only recovery page at the identical preview origin found zero records under the isolated `route127:devtest:regionalstress:v1:` prefix. Owner/public saves were never used.

`last-confirmed-state.json` preserves the last fully observed identity, location, equipment, inventory and known progression. It is explicitly an observation manifest, **not an importable complete save**: full quest flags, encounter history, account-free storage snapshot and changes during the timed-out mobile purchase call are unavailable. No character was reset or invented to conceal the loss. Future testing needs a replacement controlled checkpoint unless the previous environment's full storage is recovered externally.

The raw event/action logs and screenshots were captured only in the former workspace and were lost with it before attachment. Consequently exact unique/victory/retreat totals cannot be reconstructed. Counts above are conservative verified values, not estimates presented as exact totals. The previously observed telemetry gap around steps 170–185 is superseded by loss of the full local logs. Prior inline screenshots remain in the conversation, but no unavailable screenshot files are linked here.

## Remaining review notes / future work

- Complete Seaport liberation, shops, bank, clinic, workshop, lodging, post-liberation NPCs, quests/bounties and recruitment/staffing in a future work order.
- Complete outstanding boundary roads and additional bridge crossings later; original numerical targets are no longer required now.
- No observed progressive slowdown in the >100-step uninterrupted stretch. Sample at step 252: ~28 MB JavaScript heap and 616 DOM nodes; this is not a leak-proof benchmark. Cold proxy downloads and preview restart failures are infrastructure observations, not production game defects.
- Swamp-dweller art loaded but appeared small/dark at saved scale under night shading. Approved positioning was preserved. Owner subsequently indicated the artwork was fine; no additional resizing was applied.
- Night fishermen/drone fights were supply-heavy for the test gear. Balance concern only; no balancing changes.
