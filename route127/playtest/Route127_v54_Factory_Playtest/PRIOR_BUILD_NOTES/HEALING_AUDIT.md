# Healing audit — current values retained

| Method | HP restored | Bolt cost | Expedition turns | Availability |
|---|---:|---:|---:|---|
| Last Chance Clinic | Up to 5 per paid Bolt; capped at missing HP | ceil(missing HP / 5), partial treatment if funds insufficient | 0 | Wayne in Solace |
| Bandage | 18 | Wayne 8; Johnny 12, daily deal 9 | 0 | Shops, road loot, starting cabinet |
| Energy Bars | 10 | Johnny 8, daily deal 6 | 0 | Starting pack, shop, road loot |
| Reinforced Bandage | 30 | Crafting: 2 Cloth, 1 Scrap Metal, 0 Bolts; 30 real seconds; 90% success | 0 | Forge tutorial; Murphy after recipe unlock |
| Beer | 5 | 3 | 0 | Tavern |
| Shot | 10 | 5 | 0 | Tavern |
| House special | 15 | 8 | 0 | Tavern |
| Rented room | Full HP; resets death penalty | 18 | 0 | Tavern; also authorizes an overnight room use |
| Level-up | 10; max HP increases by 10 | 0 | No extra turn | XP progression |
| Respawn | Half max HP, rounded; minimum 1 | Existing death/recovery penalties apply | Existing recovery travel cost | Death recovery |

All item healing caps at max HP; consumables refuse consumption at full HP. Combat consumables currently take no retaliation action. Some drink text reports nominal healing even when the missing HP is smaller. Vendor stock is daily; general consumables are not quantity limited. Wanderer consumables use existing item prices and are quantity limited.

Confirmed service-scope bug repaired: clinic treatment and clinic bandage purchases could be typed elsewhere in Solace. They now require Wayne's clinic. No healing amounts, existing prices, crafting probability, combat item turn costs, or room benefits were changed.

Proposal awaiting approval: v51 approved targeted adjustment: tavern room 12 → 18 Bolts; all other values retained. Discuss whether a room should remain instant full healing for 18 Bolts: it becomes cheaper than clinic treatment above 90 missing HP, but includes safe overnight room use and death-penalty reset. Portable items are more expensive per HP but work away from town. No recommended new numbers have been silently applied. Combat healing without retaliation is an existing tactical advantage, not a newly added mechanic. Price changes or adding action costs require approval.
