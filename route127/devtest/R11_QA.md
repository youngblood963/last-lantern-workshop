# Route 127 R11 — QA and implementation notes

Baseline: the supplied Route127_R10_25_Wanderers_Rebalanced_Development(1).zip.

## Result

Automated functional/browser checks passed. Desktop and phone-width layouts were inspected in Chromium, including computed ANSI colors, poker cards and the knife-throw button. No browser runtime errors occurred in the suite. Both HTTP QA and direct-file player entrypoints loaded. This is a development/playtest build; the shared-server dependency below remains unresolved.

## Verified behavior

| Area | Result / evidence |
| --- | --- |
| Combat HP | A 58-HP target taking 28 damage displays 30/58 HP. A two-member group separately shows the group total. Solo and multi-enemy combat tested. Old saves without individual maximum HP show accurate remaining HP without inventing a maximum. |
| Crab racing | Numbered crab selection works before betting; 10, 20, 50, custom 7 and BET ALL settled correctly. Shared weighted race draw utility follows the existing predetermined-race model. |
| Captain’s Dice | Standard/all-in wagers, held versus scoring dice colors, STAND and settlement tested; rules preserved. |
| Pirate’s Poker | Standard/all-in wagers, DRAW 1 3, hand ranking, skull/swords backs and settlement tested. Cards fit a 390-pixel viewport. |
| Knife throwing | Stronger Mia distribution; all-in, five timing throws, forfeiture on leaving, and an actual browser click on the throwing button tested. Existing timing mechanic retained. |
| Blackjack | Existing engine/cards used; deal/stand/settlement tested. No luck adjustment to Blackjack rules or payouts. |
| Casino persistence | Silent automatic checkpoints, confirming explicit SAVE 1, older-slot rollback protection, no repeated settlement and preservation of later 37-Bolt earnings tested. The journal records casino debits/credits rather than copying unrelated quest earnings across rollback. |
| Mia’s bar and room | Beer 3/+5 HP, Shot 5/+10, House Special 8/+15; refusal dialogue; one 500-Bolt room purchase and free re-entry verified. Full long-term room/rest economy was not exhaustively balanced. |
| Boards | Docks board, Top 3 Wanted, Top 5 Notorious and shared traveler-post storage exercised. Both boards use the same underlying saved crime records and announcement source. |
| Sales | Immediate Common/Uncommon equipment sales at ordinary vendors and the staffed Seaport store; Rare/Epic quote/confirmation; equipped/quest/Legendary protections retained. Every original equipment sale price and vendor buying price compared against an R10 fixture. |
| Factory rewards | All four bosses tested on base and upgrade rolls, full-pack bank fallback and repeated-call protection. Exactly one equipment item per new first-clear claim. Existing recorded boss claims remain claimed; no automatic second grant. |
| Pets | Saved Scrap Rat purchase survived load; automatic purchase/equip checkpoint added. Scrap Dog save identifier migrates to Rust Hound. Pet rarity mapping checked. No saved-purchase data-loss bug reproduced. Loading an older manual save still restores that older progress. |
| Wanderers | 25 exact approved levels; 25 distinct new-profile outfit combinations, inventory fingerprints and aptitude rows. Personalized dialogue supplied. Saved profiles retain existing equipment, stock and previously generated aptitudes. Actual theft removed inventory, and save/load did not restock it. |
| Quests | All three post-liberation quests accepted/investigated/turned in; rewards and duplicate turn-in protection checked. Gambler forgiveness path tested end to end; repayment/work alternatives use the same guarded quest transition. Searches cost one existing travel turn and work in either coast-road direction. |
| Crafting | Rare recipe starts with an absolute 30-minute deadline; save/load preserves that exact deadline; elapsed-job collection gives one item and no travel charge. Configurations also verified for 30 seconds, 2 minutes, 8 hours and 12 hours. Existing R10 jobs retain original deadlines/results. |
| Blueprints | Found blueprint becomes permanently learned and survives serialization. No purchase entry. Tutorial recipes remain accessible; old level-6+ trained saves retain their existing Iron Reaper access. Found recipes still require introductory workbench training before crafting. |
| Recruitment | Before-liberation wanderer/docks screens contain no recruitment, staffing or new quest prompts. recruitment.js and road_balance.js are byte-identical to the supplied baseline. New aptitude rows apply only when no prior aptitudes exist. |
| Crazy Steve | Ask/fight triggers level-1/1-HP pink elephant; victory grants the Board once; repeated claim refused; a different local owner is denied until expiry; 31-day reclaim invalidates former ownership. Armor gives DEF 15 and +20 maximum HP only when equipped. Mia’s special dialogue tested. |
| Luck | 40% becomes 50%; 40,000 seeded equal-race draws confirmed approximately 31.25% versus 25% base for the selected racer. Bonus disappears when unequipped. Lucky returns are finite and duplicate settlement is refused. |
| Special encounter roll | 40,000 seeded eligibility rolls checked the 1% Steve threshold. Scripted junctions, boss encounters and quest interruptions remain protected. |
| Previous saves | Fixture generated by the unmodified R10 saveSnapshot implementation loads with pet ownership, renamed equipment and original craft deadline intact. Nested saved item names migrate without replenishing inventory. |
| Presentation | Chromium at 1365×900 and 390×844; no page-wide overflow, computed gold/red tones correct, pink elephant art present, named NPC/boss and Epic rarity spans present. Player entrypoint loads directly from disk with QA disabled. |

## Road regression

The unchanged R10 selector was tested with Steve’s intentional special override disabled for baseline measurement: 300 trips per direction on each of House–Solace, Solace–Factory and Factory–Seaport. That is 1,800 trips / 12,000 paid road segments. The existing suite also passed 2,352 individual choice, risk-roll, inventory-capacity and direction cases, turn costs, reverse commands, history and recruitment-availability safeguard checks.

| Direction | Paid segments | Triggered normal encounters | Combat | Wanderers | Exploration | Salvage | Environment/story | Uneventful |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| House → Solace | 2700 | 2125 | 1038 | 435 | 350 | 188 | 114 | 575 |
| Solace → House | 2700 | 2148 | 1116 | 382 | 328 | 211 | 111 | 552 |
| Solace → Factory | 1800 | 1209 | 582 | 251 | 171 | 138 | 67 | 291 |
| Factory → Solace | 1800 | 1175 | 603 | 251 | 149 | 119 | 53 | 325 |
| Factory → Seaport | 1500 | 970 | 474 | 201 | 142 | 104 | 49 | 230 |
| Seaport → Factory | 1500 | 934 | 451 | 190 | 146 | 99 | 48 | 266 |

## Explicit limits and provisional balance decisions

1. **Global Legendary authority is not implemented.** The supplied game has no shared ownership/reclaim server. R11 uses a separate local registry, stable character identity, ownership token and browser Web Lock when available. It prevents duplicate owners across saves on the same browser origin, restores the rightful local owner’s item, and reclaims after 30 real days without an ownership checkpoint. Different browsers/devices/sites have independent registries. Client clock/storage edits are not server anti-cheat. True worldwide ownership and announcements remain a backend dependency. Without Web Locks, use a single tab for this local prototype.
2. **The bounty board is local data.** Shared here means the existing character saves and posts on the same browser origin. No fabricated online leaderboard or cross-player network data is shown.
3. **Elephant’s Luck eligibility and paytable:** Dice, RPS, Slots, Rat Racing and Crab Racing receive a 25% relative win-probability increase while the Board is equipped. Lucky winning returns use 75% of their posted base return, rounded down; ties return the full stake. This is disclosed in the wager UI and keeps these fixed-odds games below a positive expected return. Blackjack, Captain’s Dice, Pirate’s Poker and Knife Throwing retain their card/strategy/timing rules and are excluded from this probability effect. This payout/eligibility choice is a balancing decision for review.
4. **Provisional blueprint rates:** 2% after ordinary combat equipment loot, 1.5% after resolving an exploration/discovery action, 2.5% after resolving salvage, 10% on a first-clear Factory boss reward. No roll on merely leaving an encounter. Tutorial access is preserved; found recipes are automatically learned, not rotating shop goods.
5. **Provisional boss upgrades:** miniboss 20% Rare / 80% Uncommon; Foreman 10% Epic / 90% Rare. Higher rarity replaces the base item. Previously recorded claims are not paid again.
6. **Crafting success:** existing 90% success retained for current recipes pending balancing. New uncommon and epic recipes make found blueprints useful. Tier durations are Common 30s / Uncommon 120s / Rare 1800s / Epic 28800s / Legendary 43200s. No craftable Legendary recipe is introduced, so unique rewards cannot be duplicated through crafting. Existing Seaport crafting-time discounts do not shorten the newly specified tier durations; staff access remains required.
7. **Mia’s knife throws:** 5% miss / 20% 10 points / 40% 25 points / 35% 50 points. The player’s timing window is unchanged.
8. **Steve’s 1% gate** is an independent rare override at eligible ordinary-road opportunities, including paid branch travel when it does not replace a fixed boss. It does not rebalance the normal category weights, add turns, or convert free junction actions into paid travel. Existing fast-return behavior remains intact.
9. Browser tests accelerate narrative delays and seed several outcomes. Real phone hardware, extended human casino balance, and a full new-character campaign were not tested. Elapsed crafting was verified by deadlines/reload and advancing a job beyond its deadline, without waiting eight actual hours.

## Reproduce

- `node tests/road_balance.cjs`
- `node tests/r11_integrity.cjs`
- Install Playwright and its Chromium browser, then run `node tests/r11_browser.cjs`. Optionally set R11_CHROMIUM to an existing Chromium executable. The test hosts the build on loopback port 8741 and also checks the file entrypoint. No external game server is used.

The included R10 save/economy fixtures were generated from the supplied unmodified baseline.
