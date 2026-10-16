# Route 127 v55.5 — Progression Repair 1

Date: October 16, 2026. Based on Route127_v55_5_Development(1)(1).zip.

## Changelog

- Connected Forge's existing dynamite-preparation function to his dialogue. The original requirements remain: all four Factory bosses defeated and the final Factory Charge Component recovered. Charge preparation remains once-only.
- Made QA_MODE.html load the same complete script list as the player page, including Seaport and v55. Its old v54.1 label and incomplete manifest were confirmed in the supplied archive before correction. All entry-page asset URLs now use cache token 55.5-r1.
- Routed initial combat actions through the authoritative combat-menu renderer so the consolidation layer cannot suppress them.
- Registered explicit numbered menus and combat-item actions so fallback rendering does not repeat Murphy, workshop, save/load and combat-item menus.
- Removed false dropped-item notices when equipment is banked or rewards/crafting results are held for collection. Ordinary failed pickups retain their original behavior.
- Updated defeated Factory boss-room descriptions and Inspect output. Murphy's equipment greeting no longer assumes a Rusted Pipe.
- Fixed an additional confirmed automated-test failure: normalized TALK KAIDEN commands were not accepted at his patrol stop. Also corrected harbor text after residents are freed.

No combat statistics, loot probabilities, quest prerequisites, prices or turn limits were changed. Existing art and gameplay modules are retained. The live website was not modified.

## Consolidated QA report

### Browser access and limitation

The previous live Cloud Browser session reached Level 6 and defeated the Factory bosses, but could not prepare dynamite. That evidence concerns the pre-repair deployment.

For this repair, a local HTTP server was started for the corrected files. Cloud Browser navigation to http://127.0.0.1:8765/QA_MODE.html returned ERR_CONNECTION_REFUSED. The shared-file preview was then rejected by browser security policy (only HTTP/HTTPS allowed). No workaround or deployment was attempted. Accordingly, there was **no Cloud Browser gameplay verification of the corrected build**. Visual behavior, real-time pacing, refresh behavior and deployed cache behavior remain unverified.

### Automated verification performed

The new regression harness loads the complete production script order into a Node VM with a DOM stub. It preserves the actual output queue, menu functions and command parser. Only timers are accelerated. It is not a browser or a visual rendering test.

All **11 new regression cases passed**:

1. Murphy main/Talk menus appear once and retain numeric mappings.
2. Save and load screens do not trigger duplicate fallback menus.
3. Initial combat displays one action menu; numeric Attack works.
4. Combat-item menu appears once; healing consumes one item.
5. Dynamite remains locked when a boss or final component is missing.
6. Forge prepares one charge; repeated dialogue does not duplicate it; save/load preserves it.
7. Full-pack boss weapon swaps preserve the old weapon in bank storage with accurate messages.
8. A finished bandage remains at the bench until space is freed, then collects successfully.
9. Defeated boss rooms and Inspect use cleared descriptions.
10. Full-pack ordinary equipment and liberation rewards remain pending without false dropped notices.
11. A fresh NEW GAME runs through Old House, Solace, East Road, all four Factory boss fights, Forge's charge preparation, obstruction clearance, both Seaport-road fights, fishermen combat, resident release, Mia/Kaiden dialogue and Chapter One completion. Save/load preserves all four boss victories, the cleared road, freed residents and completed chapter.

The full-route test activates the existing TESTING access flow. HP is restored directly by the automated harness before combat attacks; no boss victory or quest-completion flags are injected in that route. This verifies state progression and command routing, **not natural difficulty or pacing**. The fresh route finishes at Level 7.

Additionally, **18 existing regression scripts passed**, covering Factory behavior and loot, consolidation, legacy behavior, v54 checks, Murphy, Relay components, equipment drops, Jen/Wayne dialogue, Service Road, Solace gate, multi-enemy combat, accessory slots, Niko rewards, cinematic behavior, casino settlement and rarity statistics. Syntax and package validation also passed. Detailed results and the fresh-route transcript are in QA_EVIDENCE in the Development ZIP.

### Remaining unverified areas

- Corrected build gameplay in Cloud Browser after manual deployment.
- Actual visual/menu rendering, animation and cinematic playback.
- Natural Factory/Seaport difficulty and multi-day progression.
- Level 8–10 progression and Level 10 visual transition.
- Complete exploratory coverage of every room, side quest and daily reset.

### Demo readiness

**Ready for deployment to the private test route; not yet approved for public demo release.** The automated state/command progression reaches the demo endpoint, and no blocker remains in that tested path. A clean Cloud Browser run of the deployed repair through Seaport and Level 1–10 visual/pacing checks are still required for release confidence.

## Manual deployment

Extract the chosen archive into the existing devtest directory, preserving the included runtime filenames and images. Development includes QA_MODE.html and evidence; Player excludes QA entry points, test harnesses and historical development files. Both contain identical production runtime bytes.

Start a NEW GAME in an empty save slot rather than continuing an older character. On the Development QA page, enter TESTING, then the existing QA access code, when turn-limit bypass is needed. TEST OFF restores normal limits. Verify the complete Factory → Forge → dynamite → obstruction → Seaport → liberation → save/load sequence. Use a hard refresh to pick up the new asset query token; do not assume refreshing fixes any quest state by itself.
