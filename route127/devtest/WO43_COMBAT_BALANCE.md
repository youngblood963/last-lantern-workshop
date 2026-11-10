# WO43 · DEVTEST combat balance

Baseline retaliation is the default. Traveler Options → **WO43 Enemy Damage** switches between Baseline and Challenge. This browser preference is namespaced to DEVTEST, independent of character saves. Challenge affects only the listed attacks and should be switched off before ordinary travel.

| Challenge mapping | Total raw retaliation |
| --- | --- |
| Ordinary WO33 Raccoons, Bat Colony, Rat Pack, Pantry Rat Pack | 350% |
| Ordinary WO33 Feral Dog, Feral Dog Pack, Mountain Lions | 300% |
| Ordinary WO33 Looters, Parking Lot Raiders | 300% |
| Factory WO33 Salvage King miniboss | 200% |
| Foreman and every other encounter | 100% |

The allowlist requires matching source and WO33 tier. Tutorial fights, arena, station defense, Wanderers, traps, retreat damage, damage-over-time ticks and other scripted fights retain their existing behavior. Retaliation applies night raw damage rounding first, Challenge raw multiplier second, and the existing armor, enemy level conversion and minimum last. This matches the sandbox's pre-armor intent, so net damage can increase by more than the raw multiplier. WO33 level sampling and HP budgets are untouched.

Combat-only generated weapon ranges remove the legacy additive rarity and apply the Common/Uncommon/Rare/Epic/Legendary factors 1.00/1.20/1.40/1.52/1.67 to the Common-equivalent range. L9 generated Rare changes from 13–20 to 15–22 before bonuses. Fixed named weapons retain their authored range and receive the ratio of the new factor to the WO41 factor to preserve authored premiums. Iron Reaper moves from 18–27 to 19–29. Accessory and Workbench bonuses remain flat. Item IDs, upgrades, saved stats, acquisition and noncombat inventory displays stay unchanged. The shared engine's existing hit and crit behavior remains authoritative. The existing exact-name bleed check still applies to unsuffixed Iron Reaper. Upgraded Iron Reaper's pre-existing missing bleed was left out of scope because WO43 leaves the special-effect handler untouched.

The actual-engine matrix used 160 fixed-seed trials per cell at levels 1, 5, 9, 15, 25, 40 and 50. It covered stock Common/Uncommon/Rare, Common and Rare armor, +6 saved gear, eligible crafted Reaper, seven encounters and two five-fight healing policies. Challenge used the allowlist above. Each chain had four Bandages total, used below 28%, with a second policy restoring toward 80% between battles using those same supplies. There were no store restocks, camps or drops during chains. With L9 Common gear, isolated Challenge deaths were 14.4% for Raccoons, 15.0% for Looters and 20.6% for Mountain Lions. At L9 every Challenge chain ended in defeat for the sampled Common/Common, Rare/Common and Rare/Rare profiles under both healing policies. All 160 Baseline chains survived for each of those profiles and policies. Keep Challenge opt-in.

Run the harnesses from DEVTEST with `node tests/wo43_balance.cjs` and `node tests/wo43_simulation.cjs`. Set `WO43_OUTPUT` to retain detailed JSON, and `N` to override trials per cell. These scripts use isolated in-memory player and storage state.
