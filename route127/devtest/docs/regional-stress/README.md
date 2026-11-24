# Regional graphical stress test — interrupted checkpoint

DEVTEST ONLY. **In progress, not an acceptance pass. Do not merge or deploy.**

The execution/browser environment became unavailable during a mobile vendor check. Last confirmed native lifetime travel count: **271**. The minimum 500-step assignment is unfinished.

## Actual graphical coverage

- Disposable isolated Regional Stress Ranger, initially level 15 with native catalog equipment, normal damage, healing, loot and XP. Native DEVTEST unlimited-turn switch preserves turn-consuming travel and day/night processing. Reached level 17 naturally.
- At least **85 combat victories** confirmed by the persisted observer at step 259. Later fights occurred, but their final aggregate could not be read after interruption. No confirmed player defeat. Several normal retreats, including Big Man, Road Eater and occupied-harbor fishermen.
- **Two complete Causeway crossings**, one in each direction; target ten remains unfinished.
- **13 page-open/reload observations** reached through desktop/mobile restoration; target 15 remains unfinished.
- More than 100 uninterrupted travel steps between the reload at 146 and checkpoint at 252. Sample at 252: about 28 MB JS heap, 616 DOM nodes. No observed progressive slowdown. These are samples, not a memory-leak proof.
- Desktop majority; mobile 390×844 travel, combat, loot, inventory and companion access. Mobile supply purchase check was interrupted and is not certified complete.
- Character saves restored exact location, pending encounter, HP, equipment, inventory, currency and travel count at observed checkpoints. Owner storage namespace and public services were isolated.
- Watchtower image failure followed the preview-server interruption; its approved exterior subsequently loaded correctly. This was not counted as a game defect.
- Causeway position 3 displayed bridge/water/sky correctly beneath a natural crab fight. Coast positions 1–2 used the approved coast boundary. No black bridge background observed in the completed crossings.

## Roads

Both directions completed: Iron Pit–Lowlands; Iron Pit–Arena Lower; Arena Lower–Factory West; Lowlands–Broken Bridge; Broken Bridge–West Coastal; Lowlands–Factory West; Factory West–West Coastal; West Coastal–West Harbor; East Harbor–Boulder; Coastal Road–East Harbor; Watchtower–Coastal Road; East Coastal–Watchtower; Factory East–East Coastal; Factory East–Coastal Road; Industrial Junction–East Coastal; Boulder–Seaport.

West Harbor→Boulder completed; reverse remains outstanding. The Old Service/Iron Pit, Arena Lower/Arena East, and Factory West/Factory boundary roads still need complete coverage. Factory–Boulder reached its final pending encounter at step 271 and was not yet resolved on interruption. No claim of 100% regional road coverage.

## Natural interactions exercised

Rescued and named the limping hound, then equipped it through Character→Manage Companions. County truck/depot chain used native Wire requirements, disabled Unit 07 and freed Eli. Miles' lost-letter handoff completed and three delivery items were accepted; deliveries are unfinished. Pete's bicycle repair, vendor purchases, full-pack rejection, confirmation-based spare equipment disposal, limited Finn stock, missing Bandage feedback, information actions, rescue alternatives and loot Leave Behind were exercised.

Seaport was reached occupied. Inspect Fishermen preserved the scene and exposed Confront. Normal night combat was attempted, healing consumed normally, and retreat restored the occupied docks without liberation rewards. **Liberation, post-liberation services, recruitment/staffing, regional quests and bounties remain unfinished.** Mid-level night fights were supply-heavy; this is a balance observation only, with no balance changes.

## Confirmed repairs

1. Free Crazy Steve announcement no longer strands an already-paid pending Lantern road event.
2. Wanderer Inspect/Small Talk restores the canonical trade/steal choices instead of a shortened legacy menu.
3. Explicit successful Leave completes the interaction; historical saves that recorded Leave as consumed retain a usable exit. Actual Corvette save recovery verified without another travel charge.
4. Approved Road Reapers artwork now remains during encounter-sourced combat. Replayed naturally and visually verified; screenshot captured before interruption.
5. Arena lobby publishes its canonical four choices, avoiding the duplicate visible Back while preserving native command aliases. Remaining exit verified through natural play.
6. Roadside caption uses available scene artwork outside the old region whitelist; existing special combat captions retained.

No PLAYTEST/backend files, probabilities, costs, rewards, quest requirements, turn rules or approved artwork positions changed. The observer is not loaded by any shipped entry.

## Supplemental tests

`node route127/devtest/tests/regional-stress-regressions.cjs` **PASS** before interruption: real handlers for announcement/pending-event preservation, historical Leave save recovery, wanderer menus, arena visible exit/native aliases, and Reapers approach/combat ownership. These tests supplement rather than replace actual graphical play. The Reapers model test stubs artwork readiness only; actual browser combat separately verified loaded approved PNG and regional background.

## Evidence and remaining work

Actual native event and graphical-action logs plus representative desktop/mobile screenshots were captured in the workspace. The environment went offline before final aggregation/compression and screenshot attachment; they are **not yet attached to this PR**. A local preview restart caused a native POST-telemetry gap around steps 170–185, while the separate graphical action trace and browser counters continued. Do not present the partial native log alone as complete coverage.

Swamp-dweller nighttime presentation looked very small/dark at saved layout scale. Approved images loaded; positions/scales were preserved and this remains an artwork review note.

Resume the same isolated save when the environment returns. Finish 500 steps, 150 encounters with unique/repeat accounting, ten crossings, fifteen reload checks, outstanding roads, Seaport liberation/services/quests/staffing and representative mobile vendor completion. Aggregate exact victories/retreats/unique encounters and errors, attach screenshots, recheck changed sequences, then update this report and mark ready. No public deployment or merge authorized.
