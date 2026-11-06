# WO33 pre-repair audit — main 4155ac8

Devtest executes the shared Playtest engine through an explicit URL guard and private storage adapter. Changes must be Devtest-only runtime adapters, tests and evidence; never edit the shared engine.

Confirmed paths:
- `scenario_registry.js:combat()` contains fixed level 1–6, HP 14–38 and raw attack 1–11 definitions. The early and east road pools also clone fixed levels 5–7 and HP 44–58. No central level sampler exists.
- `app.js:resolveEncounter()` replaces dogs, rats, roaches and chickens with fractions of **player** HP, but keeps raw attacks mostly 1–8. Group size and member roles differ; all living members retaliate.
- `regional_combat.js` adds 32 regional designs, HP fractions .16–.42 split across members, levels exactly equal to the player, attacks 1–5. `wo7_roadside.js:combat()` and `wo8_autonomous.js` repeat this pattern.
- `lifecycle.js:RoadThreat` boosts only seven strong regional designs. `r18_completion.js` selectively enables an additive floor((level−1)*.35) pressure modifier, leaving other definitions behind.
- `app.js:scaledEnemyDamage()` subtracts armor **before** multiplying by baseHpForLevel(enemyLevel)/(100+10*(enemyLevel−1)). Common level-appropriate armor can erase 1–5 raw attacks; late enemy HP fractions grow much faster than player weapons.
- `factory.js` ordinary rooms retain levels 3–6, HP 30–66 and attacks 5–18. Supervisors retain authored levels 5–8 and HP 65–115. `seaport.js` approach opponents retain levels 7/8 and HP 72/92.
- `station_nine.js` caps the security unit against its old definition; hospital, WO2/3/4 tactical fights and R18 special roadside fights enter through startCombat, often with fractional HP and player level. Armor, cover, stun, bleed, component attacks and role flags must survive normalization.
- `app.js` lookout reinforcements replace the enemy array mid-fight with fixed 24 HP members; normalizing entry alone is insufficient.
- Scripted sources include serviceBoss (Yardman level 2, telegraphed heavy swings/misses), r18TournamentFight (bare fists/no healing, last stand), r18StationFight (generator integrity), r18AshFight, r18RedFight, houseBoss, jenBoss, terribleBilly, seaportLiberation and gateGuards. Devtest's encounter repair deliberately assigns Wardens player+8, minimum 12. Wanderer combats must remain unchanged.
- `Economy.prepare/purse` derives Bolts from enemy stats. Scaling inputs without preserving original valuation would violate WO33's reward restriction.
- Player HP actually uses milestones 100/180/350/900/1700/2750/4000 at levels 1/5/10/20/30/40/50. Weapons grow ~.8 damage/level, armor ~.35 defense/level. Preserve actual progression; +10 HP/level in the request is stale.
- Healing is percentage-based and does not provoke retaliation. Measure in-combat and recovery usage separately with bounded real items.

Plan: install one guarded normalizer immediately after app.js so later encounter wrappers feed their final specs into it. Preserve reward valuation with original-stat snapshots. Use canonical level-based combat budgets, authored relative durability/attack/armor and group shares. Do not inspect equipped gear, healing usage or success to set live stats. Retain documented script exceptions. Seed and execute the actual combat handler for baseline and subsequent iterations.
