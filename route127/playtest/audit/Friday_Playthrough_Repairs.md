# Friday playthrough repair pass

Scope: route127/playtest, based on commit 138322ea28d9e96b36cac60773d9444ea37785f7.

## Confirmed defects repaired

- **Signal-cabinet trap:** its sole return option was plain one-line text, so the
  choice renderer created no numeric or hotkey binding. It now has an explicit
  Back binding. Tested before/after Relay diagnostics and after saving/loading
  inside the cabinet. Existing road positions and movement costs are preserved.
- **Scrap Yard trap:** the same singleton-menu defect occurred after the final
  maintenance-yard search. Its return option now remains clickable too.
- **Rat Racing:** the level-5 Solace menu offered the game while the handler
  rejected it outside Seaport. The advertised level-5 option now opens the
  existing game. Rat selection, wager, settlement and repeat-settlement safety
  use the original casino implementation; other casino games retain their code.
- **Crazy Steve:** the news queue accepted only legacy road-stage names and
  rejected Lantern travel. It now accepts a real pending Lantern road encounter,
  restores the actual stage immediately, and keeps the original seen/queue flags.
  It does not interrupt combat, consume a turn, or trigger from free menu visits.
- **Relay component accessibility:** the Factory module's legacy search handler
  was not exposed on the new exterior menus. Both Factory exterior menus now
  offer Search Equipment Rack after diagnostics. The existing durable component
  flags and single-award rules remain authoritative.
- **Relay clues:** all four component routes and required actions are recorded
  in the active journal and appended to Relay-parts conversations.
- **Legacy craft labels:** display-only cleanup removes suffixes such as
  `(Forge Common04)` while keeping saved item names and action commands intact.
  No executable Nudge action was found in the pre-patch shipped content; an exact
  internal `nudge` command is excluded from graphical choice labels defensively.

## Conservative tuning

- Random encounter targets: combat 40%, wanderers 20%, exploration 20%, salvage
  12%, environment 8%. The existing selector still renormalizes over eligible
  categories. Scripted fights and fixed quest markers are unaffected.
- Automatic badge/belt quest interruptions leave four eligible ordinary road
  scenes between awards, up from two. Explicit offers and discovered clues are
  unchanged. Johnny's fixed quest has not been made longer or harder.
- Standard material resale bids (Bolts per unit): Scrap Metal 4, Wire 4, Cloth 3,
  Rope 4, Fuel 6, Electronics 9, Chemicals 6, Tempered Steel 16, Uncommon Electrical
  Parts 12, Explosive Components 8, Small Animal Bones 2, Animal Bones 3, Large
  Animal Bones 4, Animal Hide 4, Animal Fat 2, Glass 2, Water 1, Glue 5.
  Merchant funds, protected-item rules and final sale confirmation still apply.
- Weapon/equipment resale calculations and consumable bids are unchanged.
  Healing quantities, rates and use rules are unchanged.
- Backpack capacity was already increased to 12/16 slots in WO17. Existing
  name/type/stolen-state stack merging remains in place. Broader drop tuning and
  Johnny's quest difficulty remain design-review items rather than added grind.

## Validation

- `node route127/playtest/tests/playthrough_repairs.cjs`
- `node route127/playtest/tests/input_dialogs.cjs`
- `node route127/playtest/tests/wo17.cjs`

The dependency-free simulated-DOM checks cover real command routing, persistence,
movement costs, quest-component claims, casino accounting, news state, pacing,
prices, healing, and action/display separation. They are not browser/mobile visual
checks; the owner performs those checks.
