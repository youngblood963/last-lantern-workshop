# WO31 — Devtest equipment and graphical menu presentation

Scope: only route127/devtest. The entry uses the shared Playtest engine through its existing base URL; the new adapter loads after existing Devtest patches. No shared engine, Playtest, Production, save key, item definition, parser, transaction, balance, or artwork changes.

## Findings and fixes

- Existing cleanLabel removes Forge-prefixed suffixes and catalog instance levels, but misses bare Uncommon06/Rare04 identifiers. The graphical painter now removes these suffixes without changing raw names.
- Existing color indexing uses Object.entries(GEAR), omitting non-enumerable generated/catalog instances. The adapter indexes Object.getOwnPropertyNames(GEAR), matches the full instance first, and uses its definition's rarity. Equipment matches outrank person substrings; arbitrary visible rarity words no longer determine equipment colors.
- Equipment painting covers narrative output, vendor/trade/loot/crafting/confirmation rows, choices and Traveler panels through existing shared identity hooks. It strips inline instance metadata and redundant rarity badges while leaving separate inspection statistics, requirements and rarity fields intact.
- Common gets an explicit white span. Existing green/blue/purple/orange and person colors remain. Only matched text spans receive equipment colors; no location container styling is changed.
- Choices retain their original key/command records and run after existing Back filtering. A shared Title Case function formats graphical labels and button text, retains known abbreviations, and restores canonical equipment/person/location spelling. A scoped CSS override removes forced uppercase from graphical buttons.
- Classic mode delegates to the previous painter/choice behavior. No global gearLabel or cleanLabel changes are made.

## Files

- index.html: load Devtest adapter.
- runtime/presentation_formatting.js: formatting and scoped CSS.
- tests/presentation_formatting.cjs: loads the current Devtest parser-emitted script order using the existing DOM harness with missing browser fields supplied locally.
- WO31_AUDIT.md: this record.

## Validation

Passed: node --check runtime/presentation_formatting.js; node tests/presentation_formatting.cjs; node ../tests/site_paths.cjs (8 entries / 154 paths); git diff --check.

Regression assertions cover requested capitalization examples, bare/Forge/catalog suffixes, all five rarities including non-enumerable instances and misleading rarity badges, unchanged player/equipment descriptors during rendering, original command and hotkey records, Classic guard, real catalog purchase and sale accounting, saved-key JSON round-trip, and active graphical Back deduplication.

Existing tests/r11_integrity.cjs and tests/road_balance.cjs fail before gameplay: their stale harness omits the Devtest pathname and cannot pass environment.js's explicit-entry guard. They were not modified. No browser/mobile visual run was performed.

## Intentional exceptions / limits

Dedicated rarity, level requirement and combat-stat fields remain. Shortcut badges, IDs and abbreviations retain their case. Generic legacy Road Weapon/Road Armor names remain when the definition provides no more specific intended name; their inline level/rarity suffix is hidden. Unknown future custom abbreviations may require adding to the shared abbreviation set. No known unwanted suffix remains in the covered rendering paths; this is code-level coverage, not a visual visit to every encounter.
