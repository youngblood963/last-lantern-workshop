# WO45 — Four-state regional skies

DEVTEST only. Dawn amendment integrated into the original WO45.

## Assets and geography

All paths below are relative to `route127/assets/regions/`. Existing engine region IDs and navigation are retained.

| Region | Engine ID | Overlay | Original dusk artwork |
|---|---|---|---|
| Central | CENTRAL | central_overlay.png | central.png |
| Industrial | INDUSTRIAL | industrial_overlay.png | industrial.png |
| Bayou | LOWLANDS | bayou_overlay.png | lowlands.png |
| Forest | WEST | forest_overlay.png | west.png |
| Northern Ridge | NORTH | northern_ridge_overlay.png | north.png |
| Farmland | EAST | farmland_overlay.png | east.png |
| Seaport Road | SEAPORT | seaport_road_overlay.png | seaport.png |

Verified shared skies: `sky_dawn.png`, `sky_day.png`, `sky_night.png`. Dawn is a valid RGB PNG, 1672 × 941. Seven overlays are RGBA, 1670 × 941 or 942. Dimensions and alpha counts plus SHA-256 integrity hashes are in `audits/wo45/alpha-audit.json`.

## Transparency findings and unresolved image defects

Every overlay contains genuine transparency. The foreground alpha commonly measures 251–253 rather than 255, creating slight background leakage. Programmatic alpha inspection was followed by compositing all seven over dawn/day/night, plus contrasting magenta and dark blue. Original dusk paintings were also inspected. No original artwork, overlay, or sky is modified by this implementation.

Northern Ridge has a visible gray/checkerboard remnant near the upper-left branches and mountain skyline. Bayou has pale sky remnants among the upper-left moss and foliage. Forest has softer, partly transparent foliage edges, with no large opaque checkerboard evident at inspection scale. Other overlays showed no large checkerboard defects in the diagnostic contact sheet; this is not a guarantee that every fine edge is perfect.

**Image repairs are deferred:** color-threshold deletion risks removing fine branches, moss, mountain snow, reflections and intentional mist. The work order explicitly permits retaining and reporting unsafe repairs. Do not describe these images as repaired or their edges as fully clean. The original uploaded files remain recoverable and unchanged. These defects require owner review and targeted masks; they are not hidden by a broad white/black color key.

## Rendering and time

`runtime/regional_sky_wo45.js` is loaded only by the guarded DEVTEST entry. It reads existing `player.flags.worldHour`; it does not change `advanceTime`, `timePhase`, `isDark`, travel, combat, saves, or region assignments.

| Time | Visual state |
|---|---|
| 05:00–06:59 | Dawn |
| 07:00–17:59 | Day |
| 18:00–19:59 | Dusk |
| 20:00–04:59 | Night |

The existing HUD/gameplay may still call 06:00 dawn or 17:00 dusk under its original rules. WO45 deliberately changes only background visuals.

Only models whose existing art exactly equals their regional dusk path receive layering. Dedicated interiors, location illustrations and scenario art remain authoritative. One inert sky element is reused beneath the scenery image; captions and encounter layers remain above it. Sky and overlay use centered cover sizing. Shared skies and overlays are cached by URL, with decoding before switching; original dusk remains the fallback while assets load or fail.

Scenery-only CSS filters: dawn brightness .94, saturation .92, sepia .16; day brightness 1.04, saturation 1.02; night brightness .65, saturation .65, sepia .12, hue rotation 165 degrees. No filter is applied at dusk or to menu/control/health-bar elements. Dawn uses the new pink/purple sunrise sky with restrained warm scenery.

Options → REGIONAL SKY PREVIEW opens a modal with seven regions and DAWN/DAY/DUSK/NIGHT. It uses local presentation variables and never changes the player's clock, region, turns or save. Image loads use revision checks so rapid selection cannot show a stale result.

## Validation

- PASS: `node route127/devtest/tests/wo45_skies.cjs`: ten boundary samples; 28 regional/time combinations; asset resolution; serialized-clock state selection; no player mutations after upstream lazy initialization; bounded cache under 200 updates; dedicated artwork exclusion; PLAYTEST entry isolation.
- PASS: `node route127/devtest/tests/roadside_repair.cjs`: 139 regional/global menus, authored actions, exit order and sprite ownership.
- Existing failure: `wo43_balance.cjs` expects LOOTERS multiplier 3, current baseline returns 1.75. Confirmed with WO45 excluded.
- Existing failure: `r11_integrity.cjs` expects Grinder's Cutter sale value 31, current baseline returns 102. Confirmed with WO45 excluded.
- PNGs decoded and all seven composited against the three new skies and solid diagnostic backgrounds. Night detail remains recognizable in those composites. Diagnostic Pillow previews approximate lighting; they are not browser screenshots.
- Browser validation remains incomplete: local Chromium launch fails at `process_singleton_posix.cc` with `socket() failed: Operation not permitted`; cloud browser cannot reach the isolated local HTTP server (`ERR_CONNECTION_REFUSED`). Desktop/mobile interaction, exact CSS layer alignment, real save/load/refresh/travel integration and screenshots require live DEVTEST verification. Do not claim these passed based on unit tests.

## Deployment

The implementation is prepared for DEVTEST publishing only. PLAYTEST files and all shared artwork remain untouched. The deployed commit and Pages outcome are reported separately after publishing. WO45 must not be promoted to PLAYTEST; graphics defects and remaining browser checks require owner review.
