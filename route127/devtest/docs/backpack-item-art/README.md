# Backpack item portraits — DEVTEST

Selecting an item in the graphical Backpack replaces the backpack illustration with that item's individual transparent portrait. The existing preview dimensions, inventory list, descriptions and action buttons are preserved. The full object is contained, with no cropping. Closing and reopening starts with the normal backpack illustration.

The resolver uses catalog IDs across levels and follows existing modification/upgrade records for older named gear. It does not guess filenames from labels, alter item identity or introduce saved tracking flags. Only the selected portrait loads. An unavailable image, an unregistered item or a depleted stack returns to the existing backpack artwork.

## Implementation

- `runtime/backpack_item_art.js`: isolated wrapper around `TravelerPanels.art`, scoped to selected inventory items.
- `runtime/backpack_item_art_manifest.js`: explicit identities and filenames for completed artwork.
- `assets/items/*.webp`: individual generated portraits with preserved alpha. Original generation PNGs remain outside the published Git tree; WebP is a format-only conversion with no resizing or artistic edits.
- `tools/build_backpack_art.py`: reproducible manifest builder and format conversion.
- `tests/backpack-item-art.cjs`: real native Backpack selection and action regression checks.

All artwork uses the built-in image generator. Exact prompts for saved portraits are recorded in `generation-prompts.json`. The new armor prompt records are reconstructed summaries because the original wording was not available after the previous workspace became read-only. This is a DEVTEST feature; no PLAYTEST entry or gameplay code is changed.

## Verification

The existing native tests cover stable catalog identity at levels 1, 10 and 50, older named gear modifications, switching portraits through real item selection, no inventory/stat/turn/currency changes from selection, failed-image recovery, unregistered/empty selections, panel close and consumption of the last Bandage through the existing Use command.

For this continuation, the manifest was checked for duplicate IDs and its entries were mapped to the item catalog. All 38 new armor source images retained transparent alpha and were converted without resizing. The repository test runner was unavailable in the expired read-only workspace, so native Backpack selection and visual runtime checks remain pending. No CI workflow is attached to the PR.

## Artwork coverage — DEVTEST continuation

The roster contains 204 item designs. The merged Backpack feature had 54 registered portraits. This continuation has added 67 general item portraits, 38 additional armor portraits, and 15 additional non-firearm weapon portraits, bringing coverage to **174/204 complete**, with **21 pending** and **9 generator-blocked**.

### Completed in this continuation

- Weapon: 20 newly registered (5 earlier, plus 15 in this pass; all non-firearm).
- Armor: 39 newly registered in this continuation (1 in the initial pass, then 38 here).
- Accessory: 10 newly registered.
- Consumable: 13 newly registered.
- Material: 25 newly registered.
- Quest: 11 newly registered.
- Tool: 1 newly registered.
- Valuable: 1 newly registered.

### Coverage by category

| Category | Complete | Pending | Generator blocked |
| --- | ---: | ---: | ---: |
| Weapon | 51 | 21 | 8 |
| Armor | 57 | 0 | 0 |
| Accessory | 10 | 0 | 0 |
| Consumable | 18 | 0 | 0 |
| Material | 25 | 0 | 1 |
| Quest | 11 | 0 | 0 |
| Tool | 1 | 0 | 0 |
| Valuable | 1 | 0 | 0 |

### Pending portraits

- **Firearms pending (21):** Rusted Revolver, Homemade Pistol, Sawed-Off Shotgun, Reinforced Hunting Rifle, Modified Revolver, Double-Barrel Shotgun, Restored Service Pistol, Short-Barrel Rifle, Reconditioned SMG, Precision Hunting Rifle, Modified Hunting Rifle, Ranger's Revolver, Tactical Shotgun, Military Marksman Rifle, Suppressed Service Pistol, Veteran's Assault Rifle, Dead Reckoning, Ghostline Sniper Rifle, Thunderhead Shotgun, Dominion War Rifle, Specialized Service Revolver.
- **Non-firearm weapons:** none pending. Four requests were rejected by the generator and are listed below.
- **Armor:** none pending. The latest 38 completed this round are: Highway Patrol Armor, Scavenger's Plated Vest, Military Surplus Vest, Reinforced Motorcycle Armor, Road Guard Chestplate, Salvaged Tactical Armor, Mechanic's Reinforced Suit, Wasteland Ranger Vest, Scrap Defender Armor, Ranger Combat Armor, Reinforced Riot Armor, Dominion Tactical Vest, Salvaged Military Plate, Seaport Marine Armor, Highway Enforcer Armor, Reinforced Combat Harness, Wasteland Recon Armor, Factory Security Armor, Armored Duster, Dominion Elite Combat Armor, Blackglass Assault Armor, Wasteland Juggernaut Plate, Tomorrow Project Recon Suit, Seaport Captain's Armor, Padded Tactical Jacket, Tempered Leather Armor, Salvaged Security Vest, Insulated Patrol Coat, Reinforced Jacket, Padded Jacket, Hardened Scavenger Coat, Highway Warden's Coat, Wraith's Reinforced Coat, Niko's Lucky Vest, Crazy Steve's Sandwich Board, Lantern Keeper’s Coat, Worn Canvas Coat, Postman's Vest.

### Blocked by generator

- **Weapons:** Widowmaker, Crude Shiv, Ashfall Repeater, Rim Reaper, Makeshift Spear, Steel Fang Machete, Grinder's Cutter, and Iron Reaper (8): generator rejected these requests; each was skipped without retry. Widowmaker is cataloged as firearm-class, but its request described a spiked melee club.
- **Explosive Components** (material): rejected during the earlier continuation and skipped without retry.

The generated Dead Reckoning war-hammer image was excluded because Dead Reckoning is cataloged as a rifle; it is not registered to the wrong item. No firearm portrait has been registered. The 38 newly generated armor images and 15 weapon images were checked for transparent alpha, then converted to WebP without resizing.
