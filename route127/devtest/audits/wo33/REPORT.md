# WO33 — Enemy scaling audit and repair

Base: `4155ac8` on `main`. November 6, 2026. Scope: DEVTEST ONLY. The final response supplies the resulting local commit hash. No push or deployment was performed.

## A. Audit findings

The pre-repair findings are recorded in [AUDIT.md](AUDIT.md). [source_inventory.json](source_inventory.json) inventories the 112 scripts loaded by the real Devtest entry and 102 combat/scaling references. Unused standalone Devtest engine copies were not treated as active gameplay.

- Fixed early/east/coast definitions and Factory rooms kept old enemy levels, HP and attack values. Level 8 players could face obsolete low-level opponents.
- Newer regional, WO7/WO8 and R18 fights usually assigned player level and fractions of the player HP curve, while raw attack often stayed at 1–5. Armor erased most of these attacks.
- Selective pressure modifiers covered only some opponents. Enemy fractional HP eventually became very large relative to weapon damage, producing long but harmless late-game fights.
- The lookout replaces its enemy array with fixed 24-HP reinforcements mid-fight. Entry normalization alone missed this path.
- Economy purses depend on combat stats. Using repaired stats in reward valuation would have changed Bolts despite the scope restriction.
- The actual HP curve is milestone-based (100/180/350/900/1700/2750/4000 at levels 1/5/10/20/30/40/50). It is not +10 per level. Player progression was preserved. The loaded encounter mix is already 40% combat and remains unchanged.

## B. Repairs and balancing changes

- `runtime/enemy_scaling_wo33.js`: a guarded adapter loaded immediately after shared `app.js`. Later encounter wrappers pass their final specifications through it. Standard levels use the requested 5/10/20/30/20/10/5 weights, combine clamped weights at levels 1/50, and stay within player ±3. Every member shares the generated encounter level.
- Regional weight tilt favors lower levels on North/West roads and higher levels in Industrial/Lowlands/East/Seaport. HP multipliers range from .90 to 1.10. Enemy species and authored attack/durability still affect outcomes.
- HP is based on a canonical uncommon weapon at the generated enemy level, authored durability bounded to .75–1.40, and a whole-encounter budget of 3.6 nominal hits. Miniboss/boss budgets are 6/8 hits before identity and regional adjustments. Group HP is apportioned by original member shares; member attack is divided by attackerCount^.65. Component machines retain a single retaliation.
- Raw attack is calculated against canonical armor and the existing damage conversion at the actual generated level. Base rate .075 tapers to 80% at low levels; boss/miniboss attack uses .85 of that rate. Selective legacy level pressure is disabled on normalized fights to avoid double scaling. The engine still applies armor, tactics, special attacks and its existing 25% nighttime raw modifier.
- Wardens retain their authored Devtest player+8/minimum-12 exception. Static modifiers based on the Warden level limit early spikes: HP .35→.95 and attack .30→1 across enemy levels 12→50. Armor adaptation, stun and stimulant mechanics remain.
- Lookout reinforcements receive one shared budget at the existing generated level, once, before their first retaliation.
- `runtime/enemy_reward_compat_wo33.js`: original-stat snapshots preserve existing purse valuation. XP and loot logic are unchanged.
- `index.html`: loads the two adapters only through Devtest. Harness changes supply the missing MutationObserver browser stub and allow explicit baseline comparison. No gameplay, UI, equipment, healing, XP, loot, frequency, quest, wanderer or save code outside Devtest was edited.

Documented scripted exclusions: Yardman tutorial (level 2 and its slow heavy swings/misses); tournament fights (bare fists, no-healing rounds, last stand); Signal Hunters generator defense (integrity timer tied to its existing HP); one-HP Pink Elephant joke; all wanderer combat. These retain existing stats and mechanics. Other fixed-location/quest starts use the normalizer. Existing in-progress saved fights are not rewritten; normalization applies when a new fight starts.

## C. Before and after

Full-health, level-appropriate **common** gear, daylight; all ordinary fixtures equally represented. Healing includes combat plus immediate recovery toward 80% HP. Figures are cumulative damage received as a fraction of starting maximum HP, not net HP after healing.

| Player level | Turns before → after | HP damage before → after | Healing items before → after | Wins before → after |
|---|---:|---:|---:|---:|
| 5 | 5.14 → 4.71 | 14.1% → 28.2% | 0.33 → 0.81 | 100.0% → 100.0% |
| 8 | 5.44 → 4.70 | 8.5% → 27.5% | 0.16 → 0.78 | 100.0% → 100.0% |
| 15 | 6.20 → 4.48 | 4.5% → 25.2% | 0.09 → 0.69 | 100.0% → 100.0% |
| 30 | 8.31 → 4.41 | 3.4% → 22.9% | 0.10 → 0.58 | 100.0% → 100.0% |
| 50 | 11.80 → 4.30 | 3.4% → 21.0% | 0.10 → 0.49 | 100.0% → 100.0% |

## D. Healing, survival and tails

Method: each baseline/final matrix executes **1,036,800 battles**: 96 fixtures × 9 levels × 5 profiles × day/night × 120 deterministic seeds. Levels: 1, 5, 8, 10, 15, 20, 30, 40, 50. Fixtures include legacy and full static catalog variants, all 32 regional designs, Factory enemy types/floors and four supervisors, coastal approach fights, dog/rat/wolf packs, Warden and component-machine bosses. Trial seed = 127 + playerLevel×100003 + trialIndex×997 + fixtureIndex×7919.

The real `handleCombat`, retaliation, weapon/armor definitions and `useItem` execute. Presentation, autosaves, XP awards and post-victory quest routing are stubbed to isolate trials; this is a combat simulation, not a browser or campaign playthrough. Sequential targeting is the baseline decision policy. Enemies still use their actual special mechanics; the simulation does not claim optimal tactics.

Profiles: common gear at current level; common gear five levels behind; rare gear where available (common fallback otherwise); scarce supplies (two Energy Bars); wounded start (40% HP, no carried healing). Normal fresh trials carry two Bandages and two Energy Bars; boss trials carry four Bandages. Healing is considered below 28% HP during combat and afterward until 80% HP or supplies run out. Finite real victory drops can supply additional recovery items; no unlimited healing is granted. Attacks are counted as turns; item actions are reported separately because item use does not provoke retaliation.

| Level | Day damage mean / P95 | Day healing mean / P95 | In combat / recovery mean | Night damage mean / P95 | Night healing mean / P95 |
|---|---:|---:|---:|---:|---:|
| 5 | 28.2% / 62.2% | 0.81 / 2 | 0.03 / 0.78 | 39.3% / 84.4% | 1.26 / 4 |
| 8 | 27.5% / 57.8% | 0.78 / 2 | 0.02 / 0.76 | 38.4% / 79.1% | 1.24 / 3 |
| 15 | 25.2% / 48.5% | 0.69 / 2 | 0.01 / 0.68 | 35.2% / 65.6% | 1.10 / 2 |
| 30 | 22.9% / 43.5% | 0.58 / 1 | 0.00 / 0.58 | 32.5% / 58.9% | 1.00 / 2 |
| 50 | 21.0% / 37.2% | 0.49 / 1 | 0.00 / 0.49 | 30.0% / 51.0% | 0.89 / 2 |

| Level | Boss turns | Day damage / healing mean | Night damage / healing mean | Day / night wins |
|---|---:|---:|---:|---:|
| 5 | 10.66 | 94.1% / 3.02 | 121.9% / 3.62 | 99.3% / 86.2% |
| 8 | 10.40 | 78.3% / 2.85 | 106.2% / 3.55 | 100.0% / 100.0% |
| 15 | 9.94 | 72.5% / 2.65 | 97.9% / 3.43 | 100.0% / 100.0% |
| 30 | 10.06 | 68.7% / 2.40 | 94.1% / 3.20 | 100.0% / 100.0% |
| 50 | 9.93 | 61.4% / 2.17 | 84.2% / 3.06 | 100.0% / 100.0% |

Damage above 100% means HP lost across healing and subsequent hits. P95 is the empirical 95th percentile of individual trials, not a confidence bound. Boss aggregates combine Factory minibosses/Foreman, Warden and component bosses; testing high-tier bosses at player level 1/5 is deliberate stress testing, not an intended unlock/progression claim.

**Material limits and concerns:**

- Fresh daytime ordinary wins are 100%, above the suggested 85–95%. This is reported, not hidden or force-tuned into deaths: consistent 15–35% damage cannot also kill 5–15% of full-health players without introducing a separate severe tail. Wounded/poor-gear profiles expose risk instead.
- Nighttime raw damage +25% can produce more than 25% extra final damage because armor is subtracted afterward. The engine behavior is preserved.
- At level 8, ordinary night fights with gear five levels behind average 68.2% damage, 2.42 items and 99.2% wins. That loadout is costly to sustain; it should not be presented as ordinary equal-equipment balance.
- Wounded/no-carried-healing night wins are level 1: 53.2%, level 8: 60.9%, level 50: 80.4%. Do not assume players begin every fight fully restored.
- Night Warden trials use all four Bandages on average at level 8; 79.2% of those wins end below the 80% recovery goal after exhausting supplies. Wardens are an explicitly dangerous scripted exception, not a sustainable ordinary encounter. Level-1 attempts against minimum-level-12 Wardens remain lethal stress cases.
- Ordinary level-5 night P95 damage is 84.4% with P95 healing 4. Strong/high-level regional tails remain dangerous even though mean daylight results fit the guidelines.
- Ordinary daytime recovery shortfalls at levels 5/8 are 0.8% / 0.4%; late-level shortfalls are negligible. Boss night recovery shortfalls remain higher and are recorded per fixture.
- Scripted exclusions and all quest variants were audited through their shared entry paths, but not every possible tactical choice or campaign state was simulated. No live difficulty adjustment exists.

## E. Tuning iterations

| Checkpoint | Adjustment / observation |
|---|---|
| Baseline | Fixed levels become irrelevant at high player levels. Fractional HP causes long fights while armor eliminates raw damage. The final baseline uses the same 96 fixtures and loadouts as final. |
| Iteration 1 (`iteration1.json`, 20 seeds/cell) | Introduced weighted levels, authored identity and group budgets; 4 nominal HP hits, attack .08, boss/miniboss 11/8 nominal hits and 1.45/1.20 attack multipliers. Fresh ordinary level-1 mean loss 40.5%; sampled level-8 boss wins only 21.2%. Rejected. |
| Iteration 2 (`iteration2.json`, 40 seeds/cell) | HP budget 3.6; attack .075 with early-level taper; bosses/minibosses 8/6 nominal hits. Ordinary level-8 daytime loss about 26.8%, but night bosses still strained four mixed items. |
| Iteration 3 (`iteration3.json`, 120 seeds/cell) | Expanded static catalog coverage and made boss trials explicitly carry four Bandages. Kept standard budgets; tested 93 fixtures. This loadout/fixture expansion means its aggregates must not be compared as a pure coefficient-only experiment. |
| Special probe (`special_probe.json`) | Added real Warden/Road Eater/combine entry paths. Wardens with +8 levels had 0% sampled daytime wins at levels 5/8/15; ordinary shared boss budgets were unsuitable. |
| Special tuning (`special_tuned.json`, `special_final.json`) | Applied static Warden-level HP/attack curves and reduced boss/miniboss attack coefficients. Initial curves still produced extreme early Warden/night tails; reduced early Warden durability and attack again, while allowing higher-level Wardens to keep strength. |
| Final (`final.json`, 120 seeds/cell) | 96 fixtures; ordinary parameters unchanged after iteration 2. Boss/miniboss attack .85; Warden HP .35→.95, attack .30→1 across enemy levels 12–50. New reinforcement handling retains the generated level and original reward valuation. Representative ordinary daylight means fit duration/damage/healing guidance; boss and stressed-player tails are explicitly documented above. |

All checkpoint JSON includes sample counts and per-fixture/profile/day-night aggregates. Earlier probes have different fixture counts/loadouts; the before/after table uses only matched final matrices.

## F. Testing and Git

**Passing:**

- `node route127/devtest/tests/wo33_scaling.cjs`: 2,966 level/stat checks across all levels/regions; 100,000 seeded level draws; exact neutral weights and boundary merging; regional tilt; immutable progression/gear/healing/encounter pools; original XP/Bolts for legacy and all regional designs; 40% combat mix; group totals/roles; nighttime; guard exclusions; one-time reinforcement conversion; actual Warden armor/stimulant and component-disable behavior.
- `node route127/devtest/tests/devtest_harness.cjs`: real Devtest bootstrap, shared engine order, guarded URL and isolated storage.
- `node route127/devtest/tests/presentation_formatting.cjs`: both existing WO31 presentation/accounting groups pass.
- `node route127/devtest/tests/wo33_combat_regressions.cjs`: executes the existing WO21 2,000 Yardman battle assertions and saved-state checks, plus existing WO18 direct/menu percentage healing and no-retaliation assertions verbatim, isolated from unrelated failing assertions.
- Final/baseline seeded matrices complete without exceptions or 150-turn timeouts.

**Existing broad suite failures, reproduced with WO33 disabled:**

- `r11_integrity.cjs`: stale equipment sale fixture, Grinder’s Cutter actual 102 versus expected 31.
- `road_balance.cjs`: scenario fixture assumes every combat scene exposes a static spec; dereferences undefined `.action` on a newer resolver-driven scene. The suite also retains the old 50% category expectation, while the current runtime is 40%. Its assertions were not changed.
- Full WO18 via `wo33_existing_suite.cjs wo18`: old presentation assertion fails before the combat checks. The isolated combat assertion blocks pass.
- Full WO21 via `wo33_existing_suite.cjs wo21`: Yardman combat checks pass, then unrelated Relay servo/yard assertion fails. Same result with WO33 disabled.

These were not labeled passing or repaired by changing unrelated systems. Devtest-only MutationObserver stubs permit initialization without changing any original assertions.

Reproduce matrices:

```bash
node route127/devtest/tests/wo33_simulation.cjs --baseline
node route127/devtest/tests/wo33_simulation.cjs
```

Optional `WO33_SAMPLES`, `WO33_LEVELS`, `WO33_ONLY` and `WO33_OUTPUT` select deterministic probes. `WO33_BASELINE=1 node route127/devtest/tests/wo33_existing_suite.cjs wo21` disables only the two WO33 adapters for the broad-suite baseline comparison.

All changed tracked paths are under `route127/devtest/`. Playtest, Production, shared gameplay files and deployment configuration remain byte-for-byte unchanged relative to `4155ac8`. Commit is local on main; no push/deployment was attempted.
