# Route 127 v55.5 R2 — QA Results

## Evidence and scope

Source: the completed interactive Cloud Browser playtest of deployed v55.5 R1. That fresh run completed Old House → Solace → East Road → all four Factory bosses → Forge’s dynamite → obstruction → road to Seaport → fishermen → resident liberation → Kaiden/Mia → Chapter One completion, then save/load.

R2 corrections were verified with automated JavaScript runtime tests using the complete production script order, actual command parser, queued output and DOM stubs. Timers are accelerated. These are not browser or visual rendering tests. R2 has not been deployed or played in Cloud Browser.

## Targeted regressions — PASS

Each of the six new cases failed against the unmodified R1 baseline and passed against R2:

1. Nessa menu appears once, numbered purchase and exit work, and mappings survive save/load.
2. Numbered clinic sales recognize unequipped Common/Rare gear, enter quantity and confirmation screens, pay once, and retain equipped/quest/Legendary protections.
3. Live map identifies Seaport and its submenus, retains location through overlays and load, and identifies road position and obstruction. Below-Level-5 hiding remains intact.
4. Harbor descriptions distinguish occupied, fishermen-defeated/captives-held, and liberated states.
5. Ordinary clinic treatment omits death-reset messaging; full recovery after an actual death streak shows it; partial recovery preserves the streak without the notice.
6. Quick inventory label and command change from USE ITEM to INVENTORY immediately after Seaport combat victory.

## Preserved progression and systems — PASS

All 17 cases in QA_EVIDENCE/v555-r2-regression.cjs passed (six new and eleven preserved). The fresh-game route defeats all four Factory bosses through actual combat handlers, obtains the component, prepares exactly one charge, removes the obstruction, defeats both coast-road threats, liberates Seaport, completes Chapter One and preserves completion after save/load. Missing bosses/component still prevent charge preparation.

The full-route harness restores HP directly before attacks and uses the existing QA turn-bypass flow. It does not inject boss-victory or chapter-completion flags during progression. This establishes state/command functionality, not natural combat difficulty, visual behavior or multi-day pacing.

Additional checks cover initial combat menus, combat items, Murphy menus, save/load menu duplication, full-pack boss banking, held crafting and rewards, and cleared Factory descriptions. All 18 existing regression scripts passed, covering Factory, loot, consolidation, legacy behavior, v54, Murphy, Relay, equipment, Jen/Wayne dialogue, Service Road, Solace gate, multi-enemy combat, accessory/Niko behavior, cinematic behavior, casino settlement and rarity statistics. All ten production JavaScript files passed syntax checks.

Package validation: ZIP CRC checks; matching production bytes between Development and Player; exact matching entry-page script order; new cache tokens; asset references present; Player excludes QA entry points/test harnesses; only app.js, consolidation.js, v55.js and entry-page metadata changed from R1 runtime. Factory, seaport route, balance, styles and art bytes are unchanged.

## NOT VERIFIED / unchanged coverage gaps

- R2 live browser rendering and deployed-cache behavior, including visual appearance of corrected maps and labels.
- Character Levels 8–10 evolution and Level 10 visual transition. The R1 browser run and automated route finish at Level 7; no Level 8–10 defect was established, so no speculative correction was made.
- Seaport recruitment and staffed services. The R1 browser run showed NEED TO HIRE and did not complete hiring; this was unverified functionality, not a confirmed implementation bug.
- Every side quest, room, daily reset, death recovery and natural long-term balance.

## Readiness and deployment

R2 is ready for manual deployment to the private development route for browser regression testing. The automated Factory-to-Seaport path passes; full Level 1–10 public-demo readiness remains unverified. Do not treat the earlier successful R1 browser run as browser verification of R2.

Deploy the selected archive’s runtime files together and hard refresh to load the 55.5-r2 assets. Development provides QA_MODE.html and regression evidence; Player excludes QA tools. Existing save schema is unchanged. Recheck Nessa’s numeric exit, spare-gear sales, map labels, clinic messaging, and a fresh Factory-to-Seaport completion after deployment.
