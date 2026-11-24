# Industrial scenarios — active gameplay stress test

Continues the Central test from PR #210. Testing used isolated characters and existing game handlers; no owner save was opened or modified. Verified repairs target DEVTEST and PLAYTEST, with no unrelated content promotion.

## Coverage and results

| Test | Result |
| --- | --- |
| Industrial-eligible canonical roster | 91 scenarios, including GLOBAL/shared scenarios; 41 are not in the Central roster |
| DEVTEST scenario menu executions | 2,626 |
| Distinct DEVTEST scenario-command pairs | 512 |
| DEVTEST scenario/profile/path contexts | 645 |
| PLAYTEST compatibility executions | 2,750; 531 distinct pairs; 664 contexts |
| Road combats completed | 316 per full native entry run; 2,618 combat commands |
| Native road defeats | 9 per entry under the controlled test profiles; no balance changes |
| Factory progression | All 22 rooms, four puzzles, all four bosses, 13 combats and 313 graphical commands, in both entries |
| Factory healing / repeat-search guards | 43 ordinary Bandage uses and 22 repeated room searches checked per playthrough |
| Factory services | 18 menus, 103 distinct actions, 16 nested paths, 237 graphical/textual executions |
| Real browser DEVTEST | 56 recorded commands, two road movement steps, one Factory room entry, one completed nighttime Salvage King fight; forced encounter selections reported separately |
| Final native findings | Zero unresolved exceptions, routing failures, failed generated Leave exits or menu-limit cutoffs |

These are separate runs, not counts added together to inflate unique coverage. The browser's forced selections are not road travel. Four native scenario profiles cover supplied day with low/high scenario rolls, supplied night and empty day. Combat uses seeded uniform rolls, normal level-15 Uncommon equipment, actual attacks/healing and native victories/rescue. No enemy HP, damage, hit chance or difficulty was reduced.

The continuous Factory test provisioned 100 normal Bandages and used 43 over 13 fights. The first 30-item supply stack was insufficient for that uninterrupted sequence. This is test provisioning, not a healing or difficulty change. Movement uses the existing unlimited-turn test mode; normal items and death penalties remain active.

All names/IDs are in [roster.json](roster.json). Full command evidence is retained in compressed JSONL. Exploration uses depth six and up to 50 menus per scenario (60 for the public maze); it does not claim every possible quest history or input sequence.

## Confirmed repairs

### County Work Truck — `early:0` — both entries

**Reproduction:** Follow Tracks, then select the additional graphical **Leave** button. The shared renderer adds that generic exit because the native worker menu does not contain a bare recognized Leave/Move On. The scenario accepted Leave Worker and Move On, but not bare `leave`, so it stayed pending and printed a generic requirements failure.

**Repair:** Accept the generated `leave` command through the existing truck exit response. The normal road completion path now runs. Worker assistance, map knowledge, depot progress, resources, rewards and travel costs are unchanged.

Browser reproduction and repaired replay used the same active encounter, including a refresh. The repaired action returned to `lanternRoad` with `pending=false`, no resource change and no additional movement turn. Focused native checks cover supplied/empty packs, generated Leave before helping and existing Move On after helping.

### Cemetery of Tires — `early:27` — public entry/runtime integration

**Reproduction:** PLAYTEST's Enter Tire Maze called `Route127RoadMinigames.openMaze`, although that full-window package is DEVTEST-only. The public replay produced four real exceptions across the four profiles. A separately copied window shim also disabled the existing public directional controls.

**Repair:** Restore the earlier public text-maze encounter definition verbatim from repository commit `6f3feb225f459a5ffc2c16f535c4902ae2f498c5`, rather than publishing the unreleased DEVTEST game package. Re-enable the existing `r18_completion-release.js` controls. Preserve their 120ms input throttle. Keep the pad and graphical menu synchronized with command processing, and reuse the existing pad between moves instead of replacing buttons beneath the pointer. Both controls unlock after output, including direction-pad commands.

The existing layout selection, wall damage, 8-Bolt/level-scaled XP reward, Scrap Metal, equipment chance, one-time crate claim and Corvette tire requirements/cap remain intact. No new mechanics, assets or save flags were introduced. DEVTEST's full-window maze and its approved persistence repair remain unchanged.

A real browser entered the restored public maze, moved through its controls, refreshed with the same map/position, reached the crate, received **8 Bolts +45 XP +1 Scrap Metal** at level 15, and left to the road at **150 turns**. Native tests additionally complete a reachable goal, retain the serialized layout/position/step, recover exactly four Corvette tires, reject another tire choice, retain the unique claim after reload and prevent reward duplication. Direction-pad node identity and both sets of unlocked buttons are asserted.

## Factory and service verification

The room-by-room playthrough follows real menus and does not pre-mark bosses defeated. It checks the initially locked basement, all upper floors and room inspections, four puzzle solutions, room fights/searches/returns, the three supervisor unlocks and the Foreman. Bosses: **Salvage King, Grinder, The Chemist, The Foreman**. All first-clear inventory/progression survives public save/load. Repeating every room search grants no additional item, currency or XP.

The real browser used the Tomorrow Project terminal's Project Records, Factory Status and Personnel: Forge, returned to the workshop, spoke to Forge, entered Rusty's supply menu, bought a Bandage for the existing **22-Bolt** Factory price, returned to Forge and checked the denied basement entrance. It also tested County Truck, Last Patrol dialogue/drone inspection/Move On, Tool Crib code discovery/use and Gideon's nighttime hydraulic rescue.

The browser Salvage King fight preserved **511/625 player HP** and **198/216 boss HP** exactly through refresh. Bandage changed **31 to 30**, restored player HP to 625 and left the boss at 198: no retaliation. Later attacks triggered normal retaliation. Victory recorded supervisor authorization, first-clear equipment and 1/4 Factory progression. The screenshot shows the unchanged interior presentation and result/loot panel.

Services are tested at locked, Relay-authorized and boss-cleared checkpoints. The initial generic service root was locked by the legitimate Relay gate; it was not counted as shop coverage. Dedicated roots use existing Relay completion flags to reach the actual workshop, terminal, Forge, workbench and Rusty menus. No new quest tracking system was created.

## Persistence verification

- Repeatable Scrap Claim retains disabled traps during active save/reload, then restores eligible trap choices on a new visit.
- Tool Crib retains the discovered supervisor-code action through refresh and preserves its intentionally one-time completion. It was not converted to repeatable content.
- Gideon's hydraulic rescue deducts the existing materials, grants one named wanderer unlock, retains the Seaport liberation recruitment prerequisite and becomes ineligible after the completed rescue. Currency, XP, inventory and rescue state survive reload.
- Factory active combat, completed bosses, inventory and repeated-search guards survive reload.
- The existing DEVTEST live-maze regression passes: layout, player position and deadline persist; genuine new attempts reset; crate and Corvette tire claims remain protected.
- The restored public maze has separate movement/save/goal/unique reward/tire tests. It does not import the DEVTEST timing/hazard package.

## Checks

- `INDUSTRIAL_MENU_LIMIT=50 INDUSTRIAL_DEPTH=6 node route127/devtest/tests/industrial-gameplay-stress.cjs` — PASS, 91 / 2,626.
- Same test with `ROUTE127_RELEASE=1`, menu limit 60 — PASS, 91 / 2,750. Full replay preceded the final pad stability refinement; targeted native/browser pad checks passed afterward.
- Ranged supplements for Road Reapers `east:33` and Blade Cart `east:24` — PASS, 44 executions and 13 combat completions; missing-weapon feedback and equipped-weapon branches checked.
- `industrial-exit-regression.cjs`, both entries — PASS, truck exit and retained quest/resources/turns.
- `industrial-factory-playthrough.cjs`, both entries — PASS, 22 rooms / four bosses / 13 combats / 43 heal uses / 22 search guards.
- `industrial-persistence-regression.cjs`, both entries — PASS, repeat visit, active reload, one-time completion, named rescue and resource accounting.
- `industrial-public-maze.cjs` — PASS, native entry and pad, stable controls/unlocking, saved position, goal/reward, four-tire cap, no duplicate reward and exit.
- `live-maze-persistence.cjs` — PASS, unchanged DEVTEST game.
- `gameplay-rendering-repairs.cjs`, both entries — PASS, 108 healing combinations, attack retaliation, Curator, Battery Cart, vendor buyback and renderer exclusions.
- `ROUTE127_RELEASE=1 node route127/devtest/tests/motel-casino.cjs` — PASS, all five casino games, all 37 roulette outcomes/bet families, payouts and saved transactions after the public UI hook.
- `casino-visual-protection.cjs` — PASS, both protected roulette assemblies and Big Six coordinate contract unchanged.
- `git diff --check` — PASS.

## Limits / owner review

No additional confirmed scenario defect remains from these runs. This is targeted Industrial coverage, not another game-wide persistence audit or balance review. Random paths and all quest-history permutations are not exhaustive. Native timed-maze tests use controlled layouts/time; every random hazard pattern and full live timed-maze victory was not replayed in the browser. Desktop browser verification is included; no new Industrial mobile rendering claim is made. Casino desktop/mobile verification remains in PR #209.

The previously documented public Scrap Duel build restriction remains unchanged; its DEVTEST-only package is not included in this repair. The public tire maze is working again through its previously released implementation, so Corvette tire progression no longer depends on the absent full-window runtime.

## Files and evidence

Production changes are limited to the truck resolver and its cache versions in both entries, plus the public maze definition, `r18_completion-release.js`, `runtime/tire_maze_window.js` and their cache versions. No combat, economy, art, sky, sprite or casino files changed.

- [DEVTEST summary](native-summary.json), [PLAYTEST summary](release-summary.json), [Factory summary](factory-summary.json), [services summary](services-summary.json), [scenario roster](roster.json).
- `*.json.gz` / `*.jsonl.gz` retain detailed command runs, Factory playthroughs and local browser observations; inspect with `gzip -dc`. Initial observations and the pre-maze public failures remain clearly named.
- [Factory boss victory](factory-boss-verified.jpg), [restored public maze goal](public-maze-goal.jpg).

Both changes are submitted together for the separately authorized DEVTEST + PLAYTEST bug deployment. The final response records successful publication only after the GitHub Pages run completes.
