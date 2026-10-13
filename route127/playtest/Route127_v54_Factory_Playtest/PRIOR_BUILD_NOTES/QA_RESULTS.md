# v50 validation

Automated: JavaScript parsing passed. Existing 34 crafting/save regression assertions and 28 expansion assertions passed. Raw results and reproducible Node VM tests are in QA_EVIDENCE. Set QA_GAME_DIR to this game directory before running either script. The legacy script writes audit/results.json; create audit first. These tests stub the DOM and output pacing.

Expansion coverage: all relative-threat thresholds; full level range; persistent gear/inventories; hostile trade refusal; Bolt/quantity deductions; sold-out and full-pack behavior; sale confirmation; single weapon recovery and full-pack pending loot; armory purchase and Johnny gear refusal; clinic scope; Tim/Murphy quest hand-ins; completed offers; Wayne house lead; saved encounter profiles; rarity boundaries; all workshop 1–5 and terminal 1–4 dispatcher routes.

Actual browser gameplay: NOT COMPLETED. No Chromium executable was available locally. Official Playwright download returned an invalid/truncated archive. The cloud Chrome browser failed to reach localhost test servers. No screenshot or browser interaction is being claimed as a passed test.

Not verified end to end: fresh gameplay path, complete Relay quest, rendered menus and keyboard numbers, leave/return factory in browser, death/respawn, overnight accumulation and level-color appearance. Use PLAYTEST.html. Unchecked boxes are deliberately pending.

Original saves and quest/crafting logic remain supported by retained identifiers and automated fixtures. A full real player save and complete main-quest playthrough still require browser validation.

## v51 targeted patch verification
- Syntax checks passed; legacy suite 34/34, expansion suite 28/28.
- Added targeted patch: road Mara -> Tess with save migration; room 18 Bolts; wanderer purchase name normalization.
- **Browser verification remains pending.** See V51_AUDIT.md and PLAYTEST.html.
