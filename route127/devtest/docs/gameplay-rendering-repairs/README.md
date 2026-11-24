# Gameplay and rendering repairs — DEVTEST

## Repairs

- Shared direct/numbered/graphical combat item handlers consume healing and return to combat without retaliation. Healing values, enemy stats, attack retaliation and bare-knuckle item restrictions are unchanged.
- Shared cinematic renderer measures the existing contained foreground and clips backdrop layers to its bounds. Exposed margins use the existing dark background. No artwork, dimensions, positions or saved layouts were changed; regional sprite scenes remain excluded.
- Question the Curator uses the existing informational interaction path: dialogue and encounter choices remain available without completing the road turn.
- Battery Cart hides the Corvette battery choice until the existing active/found/level quest requirements permit it. Delivered, completed and already-carried/claimed flags prevent duplicates. Ordinary salvage remains available.
- Common equipment resale is excluded from Rusty and wanderer stock additions. Existing Common resale entries are cleaned on load and stock/menu access. The existing Solace buyback policy continues to retain higher rarities. Generated merchandise, sale values, protected equipment and native Seaport/Motel sale behavior are preserved.

## Targeted regression results

`node route127/devtest/tests/gameplay-rendering-repairs.cjs` — PASS:

- 108 healing cases: four Factory bosses, Yardman, Fishermen, Motel arena, coastal and road fights; four medicines through direct, numbered and graphical dispatch. Exact HP, consumption, combat/menu state, unchanged enemy and turns checked. Normal attack retaliation and bare-knuckle healing prohibition also pass.
- Curator graphical dispatch: intended dialogue, encounter choices, pending travel and turns preserved.
- Battery Cart: inactive/active/found quest, ordinary salvage, delivered/completed states and duplicate protection.
- Rusty and Solace Common/Uncommon/Rare/Epic sales, cash and retained higher-rarity stock; legacy save cleanup; Seaport/Motel staffed store sales; wanderer generated Common stock and separate resale cleanup.
- Cinematic containment geometry and regional sprite exclusion.

`node route127/devtest/tests/motel-casino.cjs` — PASS (all five games, settlement/return dispatch, wagers, payouts, reload/duplicate-credit protections and zero-turn behavior).

`node route127/devtest/tests/motel-settlement.cjs` — PASS.

Desktop browser verification used an isolated local DEVTEST fixture with actual graphical controls: Garden dark side margins and internal sky; full regional background restored for a sprite encounter; Curator dialogue with choices retained; Foreman and Fishermen Bandage healing from 300 to 525/900 HP with unchanged enemy HP, 30 turns and combat choices restored. Mobile rendering verification was skipped at the owner's request.

![Garden: approved foreground dimensions, internal sky and dark side margins](desktop-garden.jpg)

All production changes are confined to `route127/devtest/`. PLAYTEST files and artwork assets are unchanged. No extended gameplay audit was performed.
