# Location restoration and scenario persistence audit — 2026-11-24

Scope: targeted source/state audit and isolated regression fixtures, with representative desktop and 390 × 760 CSS-pixel browser verification. No complete game playthrough. Publication requested for DEVTEST and PLAYTEST.

## Findings and repairs

**Location regression:** `scene_art_containment.css` excluded regional files but contained every other primary image, including permanent locations. Older `graphics.css` and `ui_stabilization_20261104.css` overrides also explicitly contained house, Solace and Seaport interiors. Filename exclusions cannot distinguish an interior from the same asset used during an encounter.

The final graphical model now classifies artwork by runtime context: location, regional, scenario, casino or other illustration. Only the direct primary image receives the location/regional `cover` rule. The rule supersedes older interior containment selectors without changing dimensions or touching sprite/editor layers. Scenario/combat context takes precedence over location identity; casino layouts keep their dedicated renderer. Cinematic sky-boundary clipping excludes location and casino roles. Regional backgrounds, sprite positions/scales, night shading, transparent terrain and casino geometry remain unchanged.

Rendering files changed:

- `route127/devtest/runtime/scene_art_containment.css` (shared stylesheet used by both entries)
- `route127/{devtest,playtest}/runtime/location_artwork_role.js`
- `route127/{devtest,playtest}/runtime/cinematic_background_bounds.js`
- `route127/{devtest,playtest}/index.html` (script wiring/cache versions)

**Persistence:** 198 current canonical catalog entries/policies audited across WEST, CENTRAL, NORTH, EAST, INDUSTRIAL, LOWLANDS, SEAPORT and CAUSEWAY, including GLOBAL assignments. Seven additional retired legacy designs were checked for exclusion from new selection. Historical aliases are not counted as additional scenarios. Inventory Assignment retains GLOBAL/REGIONAL metadata; Explicit regions lists authored overrides (including water-crossing eligibility), not a full expanded list of land regions for GLOBAL entries. Inventory and policy evidence: [CSV](scenario-inventory.csv), [JSON](scenario-inventory.json), [retired legacy definitions](retired-legacy.json).

| Current catalog classification | Count |
|---|---:|
| Repeatable — fixed | 0 |
| Repeatable — randomized | 5 |
| Repeatable — branching | 91 |
| Hybrid | 51 |
| One-time | 44 |
| Fixed-location records | 2 |
| Inactive records | 5 |
| Total | 198 |

Classification describes the primary lifecycle, not every random action/reward roll. Branching includes fixed opponents with alternate approaches. Hybrid includes conditional multi-visit progress and repeatable content with permanent sub-rewards. The inventory also retains the original explicit policy: 101 Repeatable, 45 Conditional, 45 One-time, 2 Fixed, 5 Inactive. No policy was reclassified in gameplay.

**One new confirmed defect:** **Cemetery of Tires (`early:27`)**, DEVTEST live road minigame. Its generated maze, position, hazards and deadline lived only in dialog-local variables. Recreating the dialog/reloading could create a new attempt. The existing `r18MazeScene` save object now stores the current occurrence's live attempt: grid, position, steps, phase, hazard schedules/clouds and absolute deadline. Movement/hazard changes are saved; reopening restores the attempt and does not extend its timer. A failed attempt can still use the existing Try Again action. A genuinely new eligible occurrence starts fresh. Legitimate dialog completion/abandonment clears the temporary attempt. Practice games remain isolated. Existing crate reward guard and four-tire quest cap remain authoritative.

This individual repair changes `route127/devtest/runtime/minigame_testing.js`. PLAYTEST currently uses the older text maze and does not load this DEVTEST minigame; the practice/minigame implementation was not imported into public gameplay.

**Previously confirmed defect reverified:** **The Locked Freezer (`early:32`)**. Its earlier permanent variant key was already repaired in PR #203. No further freezer changes are made here. Controlled rolls verify 60% Lisa / 40% ambush, fresh subsequent eligible visits, active-visit/opened-prisoner/combat reload stability, rescue unlock and once-only rewards, and compatibility with stale completed legacy ambush claims.

**No new shared road-engine persistence defect confirmed.** `lanternMove` issues a fresh persisted `sceneId` and clears the old road-slot choices on legitimate movement. Reload retains the pending encounter index, scene ID and combat state. `RoadLifecycle` separates permanent claims from occurrence-scoped claims. Temporary objects are replaced when their occurrence changes; retaining the previous occurrence's object until then prevents redraws/panels from accidentally rerolling an active encounter. No blanket flag deletion or broad lifecycle rewrite was introduced.

- Feral Dog (`early:17`): all four supported variants generate independently on later visits. Their native choices and four artwork selections match. Dog pack combat stays a pack after save/load. Food choices work again after a completed encounter and a fresh legitimate visit.
- Roach Nest (`early:15`) and Lone Scavenger (`early:18`): all three variants each remain stable within a visit and change on controlled new visits.
- Cold Road Camp (`early:55`): occupied/unoccupied outcomes remain visit-scoped.
- The Crab Trap (`east:62`) and Scrap Crab Nest (`east:64`): separate authored scenarios, not random variants of one scene. Swarm and Nest Guardian can both occur. Combat remains repeatable; `wo2.crabTrap`/`wo2.crabNest` prevent duplicate unique salvage.
- Mask Market, Old Pete stock, Scrap Claim disarm state, Warden identity and WO7/WO8 encounter state use occurrence keys. Conditional WO7 quest progress deliberately retains permanent records; ordinary repeatable WO7 state starts anew per occurrence.

## Permanent state and existing saves

All one-time/conditional policy definitions and legacy reward flags are unchanged. Silent Picnic's chess puzzle (`early:41`), County Work Truck/depot (`early:0`), Sunken Chapel (`east:27`) and Furnace Pit (`east:7`) intentionally retain partial progress toward finite outcomes. They were not changed into repeatable reward sources. The existing Cemetery of Tires hybrid still permits Corvette tires after the one-time crate reward, subject to its existing cap.

Main quests, Corvette discovery/delivery/timers, Lisa and other named rescues, recruitment, town liberation, bosses, discoveries, cooldowns and unique rewards remain protected by existing flags. Isolated compatibility checks preserve inventory, Bolts, XP and permanent claims while temporary visit claims change scope. No reset or reward redistribution is required. The existing freezer migration is retained. Old maze saves have no live-attempt snapshot to recover; the first attempt after this update initializes once, without clearing HP, items, rewards or quest flags.

## Targeted results

| Verification | Result |
|---|---|
| All 198 policy storage scopes, both entries | PASS — same occurrence stable, new visit claims isolated, permanent claims retained |
| Seven retired legacy designs, both entries | PASS — excluded from new random selection |
| Dog/roach/scavenger/camp controlled variants | PASS |
| Dog native graphical food choice on two visits | PASS — choice available again; one item consumed; no additional travel turn |
| Dog artwork + wounded combat public save/load | PASS — selected art/variant and enemy HP retained |
| Both crab scenarios after unique salvage claimed | PASS — correct opponents, no repeated unique salvage |
| Locked Freezer focused suite, both entries | PASS — 60/40 threshold, reloads, legacy recovery, Lisa/reward protection |
| Live maze native movement, public save/load and dialog reconstruction | PASS — same grid, position and absolute deadline; new visit resets attempt |
| Maze once-only crate, interrupted goal callback recovery and existing four-tire cap | PASS |
| Existing shifting maze suite | PASS — 100 layouts, valid shifts, smoke, timeout/retry, rescue and practice isolation |
| Existing casino suite, both entries | PASS — five games, payout/reload/commit guards and native returns |
| Previous gameplay repair suite, both entries | PASS — 108 healing cases per entry, Curator, battery gating, vendors and cinematic geometry |
| Browser: Motel exterior/general store, Factory exterior, Seaport occupied hub | PASS — desktop primary images use cover |
| Browser: Solace bank and Old House | PASS — 390 × 760 layout; primary image fills scene width/height |
| Forgotten Garden, desktop and mobile | PASS — contain retained; dynamic sky clipped within intended artwork, dark margins |
| Roulette mobile | PASS — dedicated contain rendering and complete six-action menu preserved |

Screenshots: [Motel shop desktop](motel-shop-desktop.jpg), [bank mobile](bank-mobile.jpg), [house mobile](house-mobile.jpg), [Garden desktop](garden-desktop.jpg), [Garden mobile](garden-mobile.jpg), [roulette mobile](roulette-mobile.jpg). Mobile checks use a real browser at a phone-sized CSS viewport; they are not physical-device performance tests.

Reproduce logic checks with Node:

- `node route127/devtest/tests/scenario-persistence-audit.cjs` (use `ROUTE127_RELEASE=1` for PLAYTEST)
- `node route127/devtest/tests/live-maze-persistence.cjs`
- `node route127/devtest/tests/shifting_tire_maze.cjs`
- `node route127/devtest/tests/freezer-lisa-visits.cjs` (both entries)
- `node route127/devtest/tests/motel-casino.cjs` (both entries)
- `node route127/devtest/tests/gameplay-rendering-repairs.cjs` (both entries)

The older gameplay test's console message says mobile was skipped for that earlier work order; the new representative browser checks above were performed for this work order.

## Owner-approved behavior

**The Scrap Duel (`east:11`):** its live DEVTEST throwing round explicitly forfeits remaining throws when the tab is interrupted, and persists the committed stake before play. Refresh cannot refund that wager. This is an existing anti-timing rule, rather than a permanent scenario lockout; later visits remain repeatable. Changing it into a resumable timing game would alter that rule. The owner explicitly approved retaining this behavior during this work order. No unresolved persistence-policy questions remain.

The audit does not claim exhaustive dynamic execution of every branch; coverage combines the complete registry/policy/source review with the targeted controlled regressions above.
