# WO34 DEVTEST cleanup audit

Baseline commit `221fc1aac7ce29acb469ed35d5b811472863f456`. Line references below describe that commit. Paths outside DEVTEST were inspected read-only.

| Location | Assessment and impact | Proposed change | Risk |
|---|---|---|---|
| index.html:6–7,71,73–108,356–368 | The base points to PLAYTEST. Storage isolation runs before the parser emits the shared script chain. The three shared Wanderer art/profile/skill scripts return immediately at the DEVTEST pathname. DEVTEST registers its own guarded versions. | Remove the three inert script tags from the DEVTEST entry only. Retain both sets of files. | Low |
| runtime/bat_combat_visual.js:33–35, runtime/raccoon_combat_visual.js:29–31, runtime/human_group_combat_visual.js:75–78,111–112 | Multiple sync wrappers write or clear the same inline display declaration. Each wrapper already has a scoped combat class and corresponding CSS to hide the shared panel. | Use the scoped CSS only. Remove the unused IIFE-local lookout predicate, which has no callers. | Low |
| runtime/*combat_visual.js, runtime/road_npc_art_20261109.js:9–20,30–72 | Sprite HP currently uses a full-width plate plus a separate track. Rivet preview and combat use different image boxes. Silas uses distinct approved cage and combat art. | Compact red HP labels. Match Rivet's preview box to combat. Retain Silas's two artwork states. Verify targeting, defeat, and the stock panel on an unrelated encounter. | Presentation |
| ../playtest/graphics.js:82–90, runtime/graphical_output_performance_20261104.js, runtime/menu_authority.js, runtime/return_last_menu.js | The shared UI projects commands and still owns Classic output. Late adapters filter or order visible choices. Shared sync rebuilds stock combat DOM even when a sprite layer hides it. | Preserve command registration and Classic fallback. Defer core DOM optimization until both modes and shared entry points have coverage. | Medium |
| tools/prepare.cjs:2–22 | Projection tool generates from the current PLAYTEST entry and a short DEVTEST appendix. Running it in write mode can discard DEVTEST-specific registrations. | Preserve the checked-in entry. Reconcile the generator separately after reviewing script order. | High |
| ../playtest/app.js:794–1010, runtime/environment.js:9–24, runtime/save_recovery.js:9–12 | Shared snapshot and slot compatibility paths run through DEVTEST storage isolation. Legacy aliases, old-save reads, and recovery are active compatibility surfaces. | Keep slots, keys, fallback and recovery intact. Defer any save or import/export restructuring for approval. | High |
| ../playtest/scenario_registry.js, ../playtest/lantern_world_graph.js, ../playtest/regional_navigation.js | Registry and map feed real road selection and movement. A scene missing in one sampled route may be gated, regional, global, or quest-triggered. | Preserve registry, tags, graph, and assets. Require proof across runtime, tool, archive and dynamic references before deletion. | High |
| tests/r11_integrity.cjs:9, tests/road_balance.cjs:13,44, tests/presentation_formatting.cjs | Baseline integrity expects Grinder's Cutter sale price 31 and observes 102. Road balance dereferences an undefined combat spec. Presentation passes. The first two failures predate WO34. | Report baseline failures. Avoid changing gameplay or relaxing assertions to make them pass. | High if changed |

## Entry order and ownership

The parser loads environment isolation, the scenario registry and shared engine, then the DEVTEST WO33 scaling adapter. Shared gameplay modules, registry finalization and region installation follow. The shared graphical UI and traveler panels load before the bulk of DEVTEST overrides. The last group installs the result summary, WO33 reward compatibility, then raccoon, human and roadside NPC art. The bat renderer wraps earlier in the chain. Companion, Murphy, courier, Wanderer, Forge, formatting, Nessa and casino adapters also wrap sync. Each delegates to its predecessor. Their position and runtime guards matter.

The shared engine resolves commands, encounter actions and combat in `app.js` (667 inventory, 1477 combat initialization, 1506 combat actions, 2176 encounter actions, 2893 command entry). Shared economy and quest modules augment that path. WO33 scaling and reward compatibility are separate adapters. The results summary presents rewards. It does not own their calculation. Movement and encounter selection use the shared graph, navigation and registry. DEVTEST save recovery and storage isolation sit in front of the shared slot implementation. The shared graphical renderer owns the stock enemy panel and command projection. DEVTEST sprite wrappers consume current encounter and combat state. Devtools is a separate entry into preview and seeded scenarios, so displaying an asset there alone does not establish gameplay integration.

The local test inventory includes the three requested suites, the R11 browser harness, WO33 scaling, combat regression and simulation suites, and the WO33 runner for shared suites. The R11 browser harness opens QA_MODE rather than the normal DEVTEST entry. Archived HTML, assets and unregistered copies remain uncertain pending a full reference audit. No archive or asset deletion is proposed.

## Patch and verification

Five runtime files changed: `index.html`, `runtime/bat_combat_visual.js`, `runtime/raccoon_combat_visual.js`, `runtime/human_group_combat_visual.js`, and `runtime/road_npc_art_20261109.js`. No files or art assets were removed. The entry keeps the DEVTEST Wanderer scripts and bumps the four visual script versions for cache invalidation. Stock combat panel suppression now follows the active renderer's frame class, so an inactive renderer cannot clear another renderer's inline state. The visual adapters still use the same attack commands, current HP values, and defeated-unit removal conditions.

| Check | Result |
|---|---|
| R11 integrity | Same failure before and after. Grinder's Cutter actual sale price 102, expected 31. |
| Road balance | Same failure before and after. Undefined combat spec in the suite's settlement helper. |
| Presentation formatting | Passed before and after, including Classic guard, preserved command keys, item rarity, vendor accounting and saved-key round-trip. |
| WO33 scaling and combat regressions | Passed. Includes boundary, reward, night and reinforcement checks, 2,000 Yardman battles, and existing healing behavior. |
| Temporary DOM smoke against DEVTEST entry | Passed for bat colony, raccoons, looters, Rivet and Silas. Verified HP-free preview, one HP label per rendered target, attack command dispatch, defeated-sprite removal, stock combat class cleanup and Classic transition. |
| Sprite alpha | All 20 DEVTEST enemy PNGs contain transparent pixels. |
| Browser smoke | Chromium failed at startup because the execution environment denied its process-singleton socket. Actual desktop/mobile layout, console and full playthrough acceptance remain pending. |
| Scope and deployment | Diff restricted to DEVTEST. PLAYTEST and the production site received no changes. Pages run 797 for the baseline completed successfully. WO34 remains local pending browser validation. |

Rivet's existing renderer projects only Rivet and suppresses the stock group panel. The other crew member has no sprite in this adapter. This patch preserves that baseline behavior and the shared attack commands. Review the crew display separately before declaring all group HP coverage complete. Silas deliberately keeps distinct caged and uncaged compositions.

## WO35 review against GitHub main

GitHub main was checked with `git ls-remote origin refs/heads/main` and still points to the exact baseline above. The local patch applies directly. Its five runtime paths are exactly the allowlist. The remaining files are audit documents. No runtime edits were added during review.

- `index.html` removes the shared `wanderer_live.js`, `legacy_wanderer_profiles.js` and `wanderer_level_stars.js` registrations individually. Each shared script exits on the DEVTEST pathname before accessing any mode or player state. The DEVTEST equivalents remain registered. Classic uses the same entry and pathname. Other HTML entries and PLAYTEST retain their registrations.
- `runtime/bat_combat_visual.js` and `runtime/raccoon_combat_visual.js` remove competing inline display writes. Each keeps its scoped frame class, preview composition and target index.
- `runtime/human_group_combat_visual.js` removes its inline display writes and an unreferenced IIFE-local predicate. It clears only its own active class. Individual target command routing remains intact.
- `runtime/road_npc_art_20261109.js` keeps Martha and both Silas art states and matches Rivet's preview box to combat. Rivet's second crew sprite and HP coverage remain a separate follow-up.
- All four visual adapters drop the superseded track and fill nodes and styling in favor of compact red numeric HP. The matching cache-busters are `wo34-compact-hp`. The real entry loader resolves 113 unique scripts and retains the WO33 scaling and reward adapters and all three DEVTEST Wanderer scripts.
- `tools/prepare.cjs` is an older projection from the PLAYTEST entry with a four-script DEVTEST appendix. The checked-in entry carries a much larger appendix, including WO33 reward and visual adapters, so a write-mode run could strip current integration. The generator was inspected without regenerating the entry. The direct read-only check on the sparse checkout stopped at an omitted tracked PLAYTEST asset, `transmission.png`.

The separate [baseline test diagnosis](WO35_TEST_DIAGNOSIS.md) documents the first failing fixture, the loaded valuation path and proposed test-only follow-up.

### Manual browser verification

1. From a full checkout at the local patch, run `python -m http.server 8765 --bind 127.0.0.1` at the repository root. In a disposable browser profile open `http://127.0.0.1:8765/route127/devtest/index.html`. Open the browser console and confirm the DEVTEST title and absence of script load errors. A separate localhost origin avoids writes to hosted saves.
2. Start a new slot and walk the roads through the real game. Record encounters as they roll. Cover Bat Colony, Rabid Raccoons, Looters, Parking Lot Raiders, Highway Robbers, Gang Lookout, The Hollowed, The Squatters, Gunshop Owner, The Grinder Crew and The Hanging Cage. Use encounter choices to enter combat. The Combat Visual Testing preview does not count. For Gang Lookout, check the reinforcement transition. For Silas, check the approved cage-to-combat art swap.
3. At desktop and at a mobile viewport near 390 px, capture the art before and after the fight choice. Compare sprite size and position within the scene. Before combat expect no HP. In combat expect transparent buttons and one red numeric label per displayed target. Tap a non-first sprite and confirm the intended target takes damage. Defeat it, verify removal and check that unrelated combat still shows the normal stock HP panel. Log Rivet's second member separately.
4. Check Classic toggle and keyboard commands, Solace and Seaport menus, one Back/Return at the end, inventory and a real sale, one victory with XP/Bolts/loot, and the next-turn reward-summary dismissal. Save and reload in a spare slot. To check compatibility, copy a representative pre-WO34 slot fixture into the disposable local profile, load it and verify character, inventory and quest state before and after saving a DEVTEST fork.
5. Record console errors, viewport, scene, save fixture and result for each check. Chromium here failed before navigation in `process_singleton_posix.cc:297` because socket creation returned `Operation not permitted`. Browser acceptance and deployment remain gated.

### WO35 baseline versus patch

| Suite | GitHub main baseline | Local patch |
|---|---|---|
| R11 integrity | Fails on 31 vs 102 Bolts | Same |
| Road balance | Fails on undefined Drainage Stalker spec | Same |
| Presentation formatting | Pass | Pass |
| WO33 scaling and reward compatibility | Pass | Pass |
| Existing WO33 combat regressions | Pass | Pass |
| WO33 seeded simulation, default 120 samples per cell | Completed | Completed with byte-identical JSON |
| Real browser, all listed encounters, towns, mobile and existing slots | Unverified | Unverified, browser startup blocked |

The loaded graph reports 34 nodes and 54 edges. A read-only generator check that recognized Git-tracked sparse dependencies confirmed entry drift. The generated result also carries PLAYTEST-relative styles and registration variants, so the checked-in DEVTEST entry remains the review source. No regeneration or deployment was performed.
