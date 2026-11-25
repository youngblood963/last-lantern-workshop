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

The roster contains 204 item designs. The merged Backpack feature had 54 registered portraits. This continuation adds 67, bringing coverage to **121/204 complete**, with **78 pending** and **5 generator-blocked**.

### Completed in this continuation

- Weapon: 5 newly registered.
- Armor: 1 newly registered.
- Accessory: 10 newly registered.
- Consumable: 13 newly registered.
- Material: 25 newly registered.
- Quest: 11 newly registered.
- Tool: 1 newly registered.
- Valuable: 1 newly registered.

Completed non-firearm weapons: Reinforced Stick, Heavy Crossbow, Highway Reaper, The Iron Executioner, and Harbor Guard Cutlass. Additional generated items were matched to their existing catalog identities and registered through the manifest.

### Coverage by category

| Category | Complete | Pending | Generator blocked |
| --- | ---: | ---: | ---: |
| Weapon | 36 | 40 | 4 |
| Armor | 19 | 38 | 0 |
| Accessory | 10 | 0 | 0 |
| Consumable | 18 | 0 | 0 |
| Material | 25 | 0 | 1 |
| Quest | 11 | 0 | 0 |
| Tool | 1 | 0 | 0 |
| Valuable | 1 | 0 | 0 |

### Pending portraits

- **Non-firearm weapons pending (19):** Makeshift Spear, Combat Knife, Steel Pipe Maul, Tactical Crowbar, Industrial War Hammer, Steel Fang Machete, Grinder's Cutter, Reactive Prod, Balanced Hunting Knife, Yardman's Wrench, Heavy Wrench, Bluefang Hunting Knife, Devastator's Iron Pipe, Iron Reaper, Reinforced Salvage Maul, Modified Rotary Cutter, Modified Chemical Sprayer, Advanced Foreman Hammer, Worn Crowbar.
- **Firearms pending (21):** Rusted Revolver, Homemade Pistol, Sawed-Off Shotgun, Reinforced Hunting Rifle, Modified Revolver, Double-Barrel Shotgun, Restored Service Pistol, Short-Barrel Rifle, Reconditioned SMG, Precision Hunting Rifle, Modified Hunting Rifle, Ranger's Revolver, Tactical Shotgun, Military Marksman Rifle, Suppressed Service Pistol, Veteran's Assault Rifle, Dead Reckoning, Ghostline Sniper Rifle, Thunderhead Shotgun, Dominion War Rifle, Specialized Service Revolver.
- **Armor (38):** Highway Patrol Armor, Scavenger's Plated Vest, Military Surplus Vest, Reinforced Motorcycle Armor, Road Guard Chestplate, Salvaged Tactical Armor, Mechanic's Reinforced Suit, Wasteland Ranger Vest, Scrap Defender Armor, Ranger Combat Armor, Reinforced Riot Armor, Dominion Tactical Vest, Salvaged Military Plate, Seaport Marine Armor, Highway Enforcer Armor, Reinforced Combat Harness, Wasteland Recon Armor, Factory Security Armor, Armored Duster, Dominion Elite Combat Armor, Blackglass Assault Armor, Wasteland Juggernaut Plate, Tomorrow Project Recon Suit, Seaport Captain's Armor, Padded Tactical Jacket, Tempered Leather Armor, Salvaged Security Vest, Insulated Patrol Coat, Reinforced Jacket, Padded Jacket, Hardened Scavenger Coat, Highway Warden's Coat, Wraith's Reinforced Coat, Niko's Lucky Vest, Crazy Steve's Sandwich Board, Lantern Keeper’s Coat, Worn Canvas Coat, Postman's Vest.

### Blocked by generator

- **Explosive Components** (material): rejected during the earlier continuation; skipped without retry.
- **Widowmaker, Crude Shiv, Ashfall Repeater, Rim Reaper** (weapons): rejected; skipped without retry. Widowmaker is firearm-class in the catalog, but its rejected request described a spiked melee club, so no firearm portrait was created.

The generated Dead Reckoning war-hammer image was excluded because Dead Reckoning is cataloged as a rifle; it is not registered to the wrong item. No firearm portrait was registered in this continuation. All added source images were checked for a fully transparent alpha channel and converted to WebP without resizing. All newly added prompt records are marked as reconstructed summaries from the saved image titles and known subject constraints; exact wording was unavailable after the timed-out workspace became read-only. DEVTEST only; no gameplay or PLAYTEST changes.