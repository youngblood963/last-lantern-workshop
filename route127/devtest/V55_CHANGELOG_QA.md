# Route 127 v55 — Development notes and QA

## Implemented
- Seaport fishermen introduction, investigation, combat confrontation, manual freeing of captives, and Kaiden/Mia conversations. Main quest progression uses existing player.flags and existing Main Quest display.
- Harbor Guard Cutlass rare weapon (19–26 damage), once-only liberation award, with pending reward fallback if backpack full.
- Seaport town menu and four closed, unstaffed facilities; blocked typed and numeric entries.
- Kaiden and Mia dialogue menus; pet vendor Nessa; five pet definitions and pricing; ownership and one-equipped-pet flag persisted through existing save snapshots.
- Equipment summary shows pet; MANAGE PETS command allows equipping, inspecting, and unequipping owned pets.
- Scrap Rat, Crow, Cat and Dog modest passive behaviors on the Seaport road/combat; Ferret combat-round theft deducts from the enemy's remaining Bolt reward pool.

## Prices and assumptions
Scrap Rat 75, Crow 75, Cat 90, Dog 105, Ferret 230 Bolts. **Provisional:** exact level 8–10 player wealth distribution has not been measured, so pricing is not yet empirically validated.

## Automated checks
JavaScript parser syntax validation on every top-level script. Source-level review of new state and menu routes. Full automated stateful integration tests **not completed**; no browser playthrough was performed, as requested.

## Known incomplete items / required QA
- The Rusty Anchor currently has dialogue only; Jen's gambling and bar purchasing services have NOT been integrated. This is a major remaining Phase 2 requirement.
- Kaiden patrol movement is not implemented.
- Full browser testing of numeric hotkeys, saved combat state, quest ordering, and turn costs is still required.
- Test Ferret stealing with zero-Bolt enemies, defeat, escape and save/load, and confirm payout conservation in all paths.
- Validate XP/HP difficulty for level 8–10 players and actual pet prices against player wealth; no Factory balance changes intended.
- Full QA matrix, player-side functional validation and old-save migrations are not certified.
