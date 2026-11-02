# Repository root cleanup — 2026-11-02

## Evidence and scope

The accidental root game package arrived in commit `9bb4842` ("Add files via upload"). It replaced the Workshop homepage and stylesheet as well as adding game files. Those website files were subsequently restored by `5925bcb` (stylesheet) and `97f2ff3` (homepage). A later upload, `fe00229`, added another root map/cinematic note/shared-world prototype and updated the orphan root game scripts.

The restored root `index.html`, `privacy.html`, `support.html`, shared `styles.css`, project landing pages, logo, favicon, showcase images, CNAME, robots.txt, sitemap.xml, and app-ads.txt are website files and were preserved. All canonical/game/development/archive directories were preserved, including `route127/playtest/`, `route127/devtest/`, `route127/online-game/`, `route127/audit-evidence/` and the older loose files inside `route127/`.

Checks inspected quoted relative/root-relative references in tracked HTML, JavaScript, CSS, JSON and text/configuration files; HTML entry script/style order; CSS URLs; dynamic active-game artwork references; repository history; and same-name canonical counterparts with SHA-256 comparisons. The deleted root scripts have no incoming runtime references from any retained HTML entry point. References to deleted root maps/README/images are internal to the deleted root package/manifest. No retained version uses ../../ paths or root-absolute references to these copies. Identical canonical counterparts exist for the package metadata, maps, images and most scripts. Differing root app/renderer variants were retained in Git history; they are orphan upload variants, not the current playable source.

The active original offline build remains `route127/playtest/index.html`, reached from `route127/index.html`. The private Worker is a separate service and was not changed. GitHub Pages continues to serve the repository root through its existing dynamic Pages deployment; CNAME remains `lastlanternworkshop.com`. There is no checked-in workflow or bundler configuration that imports these root game copies.

## Exact removals (48 files)

- `PACKAGE_HASHES.json`
- `README.txt`
- `Route127_Approved_Map_WO5D.png`
- `Route127_Approved_Master_WO5B.png`
- `Route127_Lantern_Highway_R15.png`
- `V55_4_CINEMATIC_ASSET_UPDATE.md`
- `app.js`
- `banking_identity.js`
- `casino.js`
- `consolidation.js`
- `corvette_guard.js`
- `crime.js`
- `economy.js`
- `expansion.js`
- `factory.js`
- `final_polish.js`
- `graphics.css`
- `graphics.js`
- `lantern_map_visual.js`
- `lantern_map_visual.json`
- `lantern_world.js`
- `lantern_world_graph.js`
- `lantern_world_graph.json`
- `legacy_rewards.js`
- `lifecycle.js`
- `polish.js`
- `r11.js`
- `r15_session.js`
- `r18_ash.js`
- `r18_completion.js`
- `r18_fence.js`
- `r18_residents.js`
- `r18_tournaments.js`
- `recruitment.js`
- `regional_combat.js`
- `road_balance.js`
- `scenario_registry.js`
- `seaport.js`
- `seaport_liberation.png`
- `shared-world-dev.js`
- `stabilization.js`
- `station_nine.js`
- `transmission.png`
- `v55.js`
- `wanderer_fix.js`
- `wanderer_world_expansion.js`
- `wo7_roadside.js`
- `wo8_autonomous.js`

## Validation

`node route127/tests/site_paths.cjs` passed: eight live website/game entry points, 109 local paths, CSS dependencies, active game artwork, and retained HTML/CSS across all other versions have no references to a removed root copy. The machine-readable exact removal set is `root_cleanup_files.json` beside this report. All six active-game regression suites also pass after cleanup. No browser or mobile checks were run.

## Retained for owner review

- `wasteland-sirens-showcase.png`: appears to be a Workshop project asset. It was retained even though the current homepage does not use it; lack of a current reference does not establish an accidental game upload.
- Older loose game files inside `route127/` and nested historical builds remain as requested. Their future consolidation and stale README wording would be a separate task.
- The separate private Worker link/configuration and backend deployment are outside this static-root cleanup. No private service or data was removed.

No uncertain files were deleted. Deleting these orphan root copies does not claim that every historical build has no pre-existing missing dependency; the strict entry checks target the live website and active game, while all retained HTML/CSS versions are checked specifically against the removal set.
