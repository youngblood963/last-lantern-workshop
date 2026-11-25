# Backpack item portraits — DEVTEST

Selecting an item in the graphical Backpack replaces the backpack illustration with that item's individual transparent portrait. The existing preview dimensions, inventory list, descriptions and action buttons are preserved. The full object is contained, with no cropping. Closing and reopening starts with the normal backpack illustration.

The resolver uses catalog IDs across levels and follows existing modification/upgrade records for older named gear. It does not guess filenames from labels, alter item identity or introduce saved tracking flags. Only the selected portrait loads. An unavailable image, an unregistered item or a depleted stack returns to the existing backpack artwork.

## Implementation

- `runtime/backpack_item_art.js`: isolated wrapper around `TravelerPanels.art`, scoped to selected inventory items.
- `runtime/backpack_item_art_manifest.js`: explicit identities and filenames for completed artwork.
- `assets/items/*.webp`: individual generated portraits with preserved alpha. Original generation PNGs remain outside the published Git tree; WebP is a format-only conversion with no resizing or artistic edits.
- `tools/build_backpack_art.py`: reproducible manifest builder and format conversion.
- `tests/backpack-item-art.cjs`: real native Backpack selection and action regression checks.

All artwork uses the built-in image generator. Exact prompts for saved portraits are recorded in `generation-prompts.json`. This is a DEVTEST feature; no PLAYTEST entry or gameplay code is changed.

## Verification

Native tests cover stable catalog identity at levels 1, 10 and 50, older named gear modifications, switching portraits through real item selection, no inventory/stat/turn/currency changes from selection, failed-image recovery, unregistered/empty selections, panel close and consumption of the last Bandage through the existing Use command.

Desktop graphical checks confirm the shirt and pipe portraits, correct item descriptions, Drop/Cancel, Equip, default backpack restoration and close/reopen. Test characters use a separate local-storage namespace and are prepared by an unpublished local preview fixture. No owner character is used. No mobile verification has been performed.

## Artwork coverage — DEVTEST continuation

The roster contains 204 item designs. This branch adds **5** verified portraits to the **54** registered in the merged Backpack feature, for **59/204 complete**. The remaining **140 are pending** and **5 were blocked by the generator**. These images use the existing manifest and item IDs; no PLAYTEST or gameplay changes are included.

### Completed in this pass

- Non-firearm weapons (5): Reinforced Stick, Heavy Crossbow, Highway Reaper, The Iron Executioner, Harbor Guard Cutlass.

### Coverage by category

| Category | Complete | Pending | Generator blocked |
| --- | ---: | ---: | ---: |
| Weapon | 36 | 40 | 4 |
| Armor | 18 | 39 | 0 |
| Accessory | 0 | 10 | 0 |
| Consumable | 5 | 13 | 0 |
| Material | 0 | 25 | 1 |
| Quest | 0 | 11 | 0 |
| Tool | 0 | 1 | 0 |
| Valuable | 0 | 1 | 0 |

### Pending portraits

- **Weapon (40):** Makeshift Spear, Rusted Revolver, Homemade Pistol, Sawed-Off Shotgun, Reinforced Hunting Rifle, Modified Revolver, Combat Knife, Double-Barrel Shotgun, Steel Pipe Maul, Restored Service Pistol, Short-Barrel Rifle, Tactical Crowbar, Reconditioned SMG, Precision Hunting Rifle, Modified Hunting Rifle, Ranger's Revolver, Tactical Shotgun, Military Marksman Rifle, Industrial War Hammer, Steel Fang Machete, Suppressed Service Pistol, Veteran's Assault Rifle, Dead Reckoning, Ghostline Sniper Rifle, Thunderhead Shotgun, Dominion War Rifle, Grinder's Cutter, Reactive Prod, Balanced Hunting Knife, Specialized Service Revolver, Yardman's Wrench, Heavy Wrench, Bluefang Hunting Knife, Devastator's Iron Pipe, Iron Reaper, Reinforced Salvage Maul, Modified Rotary Cutter, Modified Chemical Sprayer, Advanced Foreman Hammer, Worn Crowbar.
- **Armor (39):** Highway Patrol Armor, Scavenger's Plated Vest, Military Surplus Vest, Reinforced Motorcycle Armor, Road Guard Chestplate, Salvaged Tactical Armor, Mechanic's Reinforced Suit, Wasteland Ranger Vest, Scrap Defender Armor, Ranger Combat Armor, Reinforced Riot Armor, Dominion Tactical Vest, Salvaged Military Plate, Seaport Marine Armor, Highway Enforcer Armor, Reinforced Combat Harness, Wasteland Recon Armor, Factory Security Armor, Armored Duster, Dominion Elite Combat Armor, Blackglass Assault Armor, Wasteland Juggernaut Plate, Tomorrow Project Recon Suit, Seaport Captain's Armor, Padded Tactical Jacket, Tempered Leather Armor, Salvaged Security Vest, Insulated Patrol Coat, Reinforced Jacket, Padded Jacket, Reinforced Work Vest, Hardened Scavenger Coat, Highway Warden's Coat, Wraith's Reinforced Coat, Niko's Lucky Vest, Crazy Steve's Sandwich Board, Lantern Keeper’s Coat, Worn Canvas Coat, Postman's Vest.
- **Accessory (10):** Worn Leather Wristband, Lucky Bottle Cap, Worn Belt, Scavenger's Charm, Reinforced Dog Tags, Road Warrior's Bracelet, Rusty License Plate, Niko's Collar, The River Before, Keeper's Lantern.
- **Consumable (13):** Giant Dog Bone, Roadhouse Hash, Fresh Apple, Fresh Pear, Fresh Carrot, Fresh Potato, Fresh Tomato, Fresh Cabbage, Fresh Berries, Preserved Vegetables, Preserved Meat, Wasteland Stew, Wild Honey.
- **Material (25):** Uncommon Electrical Parts, Crab Meat, Rifle Ammunition, Bear Meat, Animal Hide, Water, Glass, Glue, Cloth, Scrap Metal, Wire, Electronics, Small Animal Bones, Animal Bones, Large Animal Bones, Tempered Steel, Salt, Raw Rat Meat, Raw Rabbit Meat, Raw Bird Meat, Raw Chicken Meat, Raw Boar Meat, Raw Venison, Raw Snake Meat, Raw Wolf Meat.
- **Quest (11):** Corvette Tire, Corvette Battery, Damaged Corvette Windshield, Restored Corvette Windshield, Corvette Brake Lines, Nessa's Locket, Astrid Road Flare, Tim's Old Badge, Usable Serpentine Belt, Runner's Token, Jen's Supply Crate.
- **Tool (1):** Battered Flashlight.
- **Valuable (1):** Old World Pocket Compass.

### Blocked by generator

- **Explosive Components** (material): rejected during the preceding continuation; skipped without retry.
- **Widowmaker, Crude Shiv, Ashfall Repeater, Rim Reaper** (weapons): rejected during this continuation; skipped without retry.

The generated Dead Reckoning war-hammer image was excluded because Dead Reckoning is cataloged as a rifle; it is not registered to the wrong item. No firearm portrait was registered in this continuation. The newly registered files were checked for alpha transparency and full-object containment. Targeted Backpack verification is required before merge.