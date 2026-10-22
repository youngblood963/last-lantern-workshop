# R11 playtest improvements

See R11_CHANGELOG.md and R11_QA.md for current changes, tested behavior, balance choices, and the unresolved global ownership backend dependency.

# R10 — All-road encounter balance

Shared 50/20/15/10/5 category selection after an 80% trigger roll; quiet cards excluded; curated geographic pools; progression-scaled middle-road threats; saved repetition history; post-liberation wanderer availability safeguard. Recruitment unchanged. See ROAD_BALANCE_QA_R10.md and ROAD_SCENARIO_AUDIT_R10.md. 12,000 segments and 2,352 choice cases passed automated integration QA.

# Route 127 — QA History

## v55.5 R7 — 2026-10-20 — Executed banking/identity verification

**115/115 automated VM cases passed:** 26 R7 banking/identity cases plus all 89 R6/preserved cases (27 R6, 13 older regression, 27 stabilization, 20 recruitment, 2 Player isolation). One copied recruitment test intentionally changes the prior four-Bolt withdrawal-fee expectation from 16 to 20 carried Bolts after withdrawing 10; the original historical script is preserved.

**26/26 actual Chromium browser checks passed:** 11 R7 and 15 R6 preservation checks, desktop 1366px and phone 320px. R7 checked both bank flows, explicit cancel/reject/confirm, exact 500-Bolt payment, permanent ID, full-day UTC cutoff in America/New_York and Asia/Tokyo contexts, bank status/overflow, offline/reconnection, and actual shared-origin two-tab Web Lock serialization. Two simultaneous deposits increased principal from 5,000 to 5,200, left carried cash 4,800, and credited only one 50-Bolt interest payment. Relaunch did not pay again. R6 browser run rechecked normal-cost bidirectional travel, crossroads/Factory exit, art, recipes, Mia room, keyboard/touch knife throwing, crab racing and credits skip/replay/continuation. No uncaught browser errors. Player checks ran with ROUTE127_QA_BUILD forcibly set true before startup and still could not enable QA because production QA_BUILD is hard false.

### Specific automated coverage

- Zero/minimum and invalid deposits; 4,999/5,000/5,001 earning cap; exact five aptitude payments 50/75/100/125/150 on 5,000; no-hire baseline; zero principal; ordinary transfers free with zero carried funds.
- 23:59 deposit: zero interest at the next midnight, then one full eligible day before payment. Exact boundary milliseconds, repeated visits, same-ID slot/reload rollback, backward local clock, and multi-day gaps. Non-compounding 1,000 principal yields 10 per full day, not interest on earlier earnings.
- Interest-first withdrawals, principal reduction lowering current basis, and redeposit waiting for the next period. Staff rating changes do not backdate the current period. Bank principal, earned interest, last payment and next UTC boundaries display consistently.
- Both name-change venues, liberation/staff gate, invalid/blank/reserved/too-long/current names, local collisions, cancel, insufficient cash, confirmed success, rapid repeated confirm, storage-write rejection without fee, and retained IDs/items/quest/pets/level/bank/crime/notoriety. Wanted posters show the new name; new bulletin bylines use it and carry stable authorId; historical bylines remain historical.
- Separate UUIDs for distinct legacy slots with identical names; same UUID across new same-character slot copies; no reuse on new game; pre-ID backup and storage-failure/manual-resave handling; corrupt ledger fails closed without deleting it.
- R6 casino ledger compatibility and invariant overnight RNG under rename. Original gameplay and save schema 38 remain intact; additional namespaced fields do not reset characters.

### Read-only backend audit results

- HTTP 200: route127-api and route127-dev-api roots at youngblood963.workers.dev; production root reports online, dev root reports development/online.
- HTTP 200: dev /players returned one historical test record with id, character_name, level, location, online and last_seen. Record contents are not packaged. This is a prototype query result, not proof of current-game sync or current player presence.
- HTTP 200: LLW SHARED_WORLD_PROBE.html references shared-world-probe.js. Current live dev-game HTML does not reference shared-world-dev.js. GitHub main contains both JS files, read in full; source hashes retained in evidence.
- Recovered Route127_DEV_Worker_Registration_FIXED.zip contains one dev Worker JS, no D1 SQL/config/migrations. It expects DB and players.auth_hash, uses client-created IDs/token hashes for prototype update ownership, publicly lists /players and accepts origin-restricted /register. Origin is not account authentication; client-supplied level/location are not authoritative game state. Exact deployed Worker bundle/schema/binding cannot be verified from health responses.
- Wrangler is unavailable, no Cloudflare credential environment variables are present, and no authenticated Cloudflare tool is available. Cloudflare integration discovery returned no matching available plugin. No authenticated Worker/D1 end-to-end write/lookup smoke test was possible. No production or dev data was written.

### Remaining limits / unfinished integration

**Cloud saving and secure online identity/banking are unfinished.** Independent devices have independent local ledgers; local time/storage are editable. Web Locks protect ordinary same-origin concurrent browser requests, not malicious clients, unsupported-browser cross-tab races or cross-device claims. Fallback browsers show a single-tab warning. Old pre-ID copies are treated as distinct because historical data cannot prove they belong to one character; they are never merged by name. Restoring an older same-ID financial revision restores the latest committed bank/name and the carried-wallet value from that financial commit, while selected save's other progress remains; this is a conservative local rollback rule, not a server ledger.

No physical Samsung, Safari/Firefox, malicious-clock-resistant yield, authenticated reconnection, server uniqueness or server registration is certified. The offline/reconnection test is local gameplay with network disabled/re-enabled; it does not demonstrate cloud sync. Browser text delays below 100ms were accelerated; R7 interest tests use a controlled UTC clock. No natural multi-day balance playthrough is claimed. Human playtest remains next.

Evidence is inside DEVELOPMENT_ARCHIVE/HISTORICAL_QA.zip at QA_EVIDENCE/R7 and BACKEND_RECOVERY. Extract VM scripts and set ROUTE127_SOURCE to the game directory to rerun. Browser harnesses need their local game/Chromium paths adjusted outside this environment. Internal screenshots are not packaged.

## v55.5 R6 — 2026-10-20 — Executed verification

**89/89 VM runtime cases passed:** 27 new R6, 13 adapted preserved regressions, 27 R5 stabilization, 20 recruitment and 2 negative Player isolation. These are deterministic state/command tests, not natural multi-day playtests. **15/15 actual Chromium checks passed** across 1366×900 and 320×900, including Player fresh opening, QA rejection, real numeric/hotkey travel with normal turns, Factory enter/exit, artwork overflow, Mia room, real keyboard/touch timing input, crab lanes/reduced motion, and credits replay/skip/continue. No uncaught browser errors in that run. Intro text delays below 100ms were accelerated; native animation frames and timing input remained real.

### Observed bugs and resolutions

- Coast dispatch was direction-locked to fixed one-time enemies; Factory arrival forced workshop state. R6 stores leg, position, direction and current encounter independently and arrives at exterior Crossroads. Six/five charged steps verified, including reverse/reload/exhaustion/repeated trips. Compatible old portRoad saves migrate without resetting quest flags. House/Service/Lower Access branch handlers remain authoritative.
- Chest commands could reach generic bank deposit logic first. Both inns now use the same isolated room handler; item transfers, separate chests, cost, rest, persistence, renewal-as-existing-permanent-ownership and exits tested. Historical Solace contents remain where they were.
- Art/late commentary could clear input maps and cause fallback duplicate menus. Decorative art now preserves mappings; direct menus bind after queued text is rendered. Desktop/mobile browser input rerun after the correction.
- Four historical test expectations changed intentionally: installed Relay line must be absent, pool is 57 rather than 52, boss gear is delivered rather than guaranteed auto-equipped weapon, return arrives at Crossroads after free destination selection. Original evidence/scripts remain intact; R6 copies encode the approved requirements rather than hiding failures.
- Ordinary crafting excludes quest/equipped material names in both display and consumption. Tier duration, held result, offline timestamps, success/failure, and confirmed cancellation checks pass.
- Casino: exact stakes, invalid/zero/overdraw, forced win/loss/tie comparisons, poker deck/rank order, Captain throw cap, Knife five-throw limit/250 maximum, actual elapsed-time scoring and repeated-input rejection, abort, and restoring earlier in-round save were tested. Old Seaport non-Blackjack tables cannot reopen through legacy parser. Casino journal covers normal in-browser save/reload, not deliberate storage/file editing.

### Seeded encounter distribution

10,000 selector draws per direction (seeded LCG; counts below). This samples the repeatable selector, **not the final incidence of scenes during natural play**: the existing 30% wanderer opportunity/cooldown, once-only patrols and endpoint arrivals further affect observed journeys. No exact appearance frequency is promised.

| Direction | Combat | Discovery | Salvage | Hazard | Lore | Quiet | River of Fire |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| East | 2455 | 2469 | 1631 | 1201 | 1217 | 653 | 374 |
| West | 2467 | 2509 | 1563 | 1204 | 1206 | 612 | 439 |

### Limits

No claim of a natural full multi-day balance run, physical Samsung testing, Safari/Firefox coverage, real long-background mobile suspension, or a cross-device frame-rate benchmark. Knife timing formula was compared independently of frame sampling, plus actual desktop keyboard and emulated-phone touch; those checks do not certify every device's latency. Browser travel spot checks are non-QA with a seeded compatible midgame state, not a fresh character walking the entire chapter. Existing credits' real 20-second timer was verified in R5; R6 reran replay/skip/continue and burger elements. Human playtest is next; no further feature work authorized after handoff.

Raw scripts/results are retained under QA_EVIDENCE/R6 in DEVELOPMENT_ARCHIVE/HISTORICAL_QA.zip. Extract scripts and set ROUTE127_SOURCE to the game directory to rerun VM cases. Browser harness references the local Chromium path/environment and must be adjusted elsewhere. Browser screenshots are internal only and are not packaged.

## v55.5 R5 — October 20 work order — current verification

This entry supersedes older R4 status/packaging entries. Development and Player are packaged locally; nothing was deployed.

### Executed results

- 27/27 focused state/command cases, 13/13 preserved regression cases, 20/20 recruitment cases, 2/2 Player isolation cases, and 1/1 fresh-opening-to-completion route: **63/63 runtime cases PASS**.
- 7/7 scoped actual Chromium browser checks PASS at 1366×900 desktop and 390×900 phone widths. Fresh opening used form input; post-fight context was deliberately seeded for a short endgame UI pass. Output typing delays were accelerated; the credits' 20-second timer was real. Browser console: no uncaught errors. Phone test used reduced motion. No horizontal document overflow in tested layouts.
- All 12 production JS modules passed node --check. Entry-page manifests and local assets match; both ZIPs and the evidence archive pass CRC checks. All 16 runtime files match across editions. Player omits QA page, checklist, documents, work orders, tests and evidence archive; negative production-mode command tests reject testing/code shortcuts.
- Baseline R4 reproduction showed v49CraftCompleted without v49RecipeBandage leaves the practice kit at 0/2 and 0/1 despite carried Scrap Metal; R4 also listed installed Relay components. Corrected by recipe migration/normal bench access and quest-storage cleanup, not by granting missing Cloth.
- One legacy regression expected victory to return to top-level Seaport; its R5 copy now expects the approved immediate Harbor Docks survivor prompt. One recruitment regression expected Clinic on the top-level menu; its R5 copy now enters Market. These are changed approved expectations, not hidden failures. Original historical scripts/evidence are unchanged in the archive.

### Requirement acceptance matrix

| # | Requirement | Status and evidence |
| --- | --- | --- |
| 1 | Crafting blocker | PASS tested — legacy completion-bit migration, exact material aliases, missing Cloth, consumption, timer, held result, save/load |
| 2 | Installed Relay parts | PASS tested — physical legacy parts transfer to durable quest flags; installed list hidden; unfinished progress retained |
| 3 | Full-pack loot | PASS tested — Leave/Replace, confirmation, quest/equipped protection, rarity warning, saved pending decision and capacity guards |
| 4 | Wanderer selling | PASS tested — Hollis identity is Hollis (occupation is metadata); zero-wallet refusal names funds; funded sale pays once; Solace sale regression passes |
| 5 | Quest journal | PASS tested — main objective first, Active/Completed views, undiscovered quests hidden, free viewing |
| 6 | Historical recheck | PASS tested, scoped — 13 preserved regression cases plus 20 recruitment cases; no blanket claim all 53 historical observations remain or were rerun |
| 7 | Rusty | PASS tested — always-accessible entrance shop, stock/funding, 20% base markup, protected sales, exact-name transaction and persistence |
| 8 | Factory access | PASS tested — three supervisors still gate basement, direct boss access unchanged, no all-room clear requirement or new challenge systems |
| 9 | Story and dynamite | PASS tested — actual fresh command route, deterministic room materials, 30-second charge, once-only collection, saved completion; no reset of old progress |
| 10 | Road overhaul | PASS tested — all 44 East discoveries revised; both low/high random branches checked, eight existing combat scenes appended without reindexing old saves; cooldown/finite pools retained |
| 11 | Level 5 ASCII | PASS tested — absent at 4/present at 5, compact scene widths, Steve board updated; actual full Level 8–10 art/pacing tour not performed |
| 12 | Occupied Seaport | PASS tested — exact two choices, Harbor Docks investigation, typed route protections, desktop/mobile |
| 13 | Victory survivor prompt | PASS tested — immediate Free/Back Away, no recruitment before actual release, no repeated battle/reward |
| 14 | Liberated/Market menus | PASS tested — exact five/six options, vacant staffing-only services, immediate Pet Store, clean vendor exit, desktop/mobile |
| 15 | Recruitment | PASS tested — all 20 adapted R4 regression cases pass, sole liberation gate and saved assignments retained |
| 16 | Pack Mule | PASS tested — 350 Bolts, active +2, no combat stat, over-capacity item retention, no new intake, upgrade/base capacity and saves |
| 17 | Workshop terminal | PASS tested — accessible while vacant, completes once and autosaves before credits; recruitment already unlocked independently |
| 18 | Credits | PASS tested — real desktop 20-second timer, phone skip/reduced motion, replay control, reload and normal controls after overlay |
| 19 | Cheeseburger gag | PASS tested — two DOM animations with opposite directions/delays, clipped viewport, reduced-motion disable; not an item or reward |
| 20 | Thank-you / continuation | PASS tested — final message, button/key continuation, replay without economy/quest mutation, save/reload |

### Limits and further playtesting

This is a replay candidate, not certification of every side quest or long-term economy. The full automated route uses authorized QA turn bypass, restores HP before attacks, and advances the clock for crafting; it finishes at Level 7. It proves real command/state progression, not natural combat difficulty or a multi-day Level 1–10 pacing run. Browser checks are scoped UI flows, not an unassisted Factory combat playthrough. Physical phone hardware, other browsers and prolonged tab suspension were not tested. Existing R4 gaps not exercised here remain historical limitations, not newly confirmed bugs. All 53 older notes are retained in the archived work order; only reproduced defects and current approved changes were implemented.

### Evidence and reproduction

Extract DEVELOPMENT_ARCHIVE/HISTORICAL_QA.zip into a writable copy of the game root. Current suites: QA_EVIDENCE/r5-stabilization.cjs, r5-existing-regressions.cjs, r5-recruitment-regression.cjs, r5-player-isolation.cjs, r5-progression.cjs. Run with Node from the game root. The browser harness r5-browser-check.cjs requires Playwright and a compatible installed Chromium; R127_CHROMIUM_PATH can select the executable. Its screenshots are local inspection outputs and are not bundled. Results, progression transcript/final state and r5-package-validation.json are in the same archive. Historical R4 suites are not claimed rerun wholesale.


## Documentation cleanup verification — 2026-10-20

This entry verifies preservation and packaging only. All gameplay test results below describe their original runs; none were rerun or upgraded to a browser pass during cleanup.

| Check | Result |
| --- | --- |
| Source ZIP integrity | PASS; 119 regular files |
| Written history transfer | PASS; all three original document bodies retained without alteration |
| Retired standalone report | QA_REPORT.md is now QA_HISTORY.md; removal follows successful content comparison |
| Retained production assets | PASS; all 15 runtime files byte-identical |
| Current QA entry/checklist pages | PASS; QA_MODE.html and PLAYTEST.html byte-identical |
| Historical archive | PASS; all 99 member paths and bytes match source |
| Automated tests | All 67 .cjs files preserved byte-for-byte; not executed or edited |
| Other archived evidence | 26 JSON files, two patches, two transcripts, one prior checklist, one empty placeholder |
| Final package integrity | PASS; outer and nested ZIP CRCs checked |
| Routine distribution policy | Runtime-only allowlist documented; historical evidence excluded |
| Browser/gameplay validation | NOT RUN; no functional changes |

### Original documentation provenance

Only the original first-line title is replaced by each new master heading; the full remaining body is transferred verbatim. The former title is recorded in the retained-history introduction. Original file SHA-256 values below refer to the uploaded files, before this cleanup.

| Original file | Master destination | Original bytes | Original SHA-256 |
| --- | --- | ---: | --- |
| `CHANGELOG.md` | `CHANGELOG.md` | 13,227 | `9f71381d369b7445af8c82f2a8c938e9d6dfc9b87b1e4c0d0626775e39fce8ed` |
| `QA_REPORT.md` | `QA_HISTORY.md` | 22,143 | `677ad8c60bd611e2d50122c8c8fb58036ce8ea3f78e159cd48723b981e698cb4` |
| `DEVELOPMENT_NOTES.md` | `DEVELOPMENT_NOTES.md` | 31,772 | `a00e3fdccfdbcb5ec81f00827dbff4736833cd980c92bd3f1b8558ab6730e3bc` |

### Evidence location and interpretation

All paths in the inventory and retained reports are relative to the game root after extracting `DEVELOPMENT_ARCHIVE/HISTORICAL_QA.zip` into that root. The original evidence paths have not been rewritten. Extract only in a separate writable development copy when investigating or running historical suites; leave the archive packed in normal development storage. Never include it in a Player release.

Evidence filenames may have been reused by earlier builds: for example v555-r2-results.json contains 19 cases including R3 cases, while the older R2 package record reports 17. Preserve both records as supplied, use the report's stated build/scope and inspect the actual data; filenames alone do not prove test date or current-build coverage. No missing historical reports or evidence are reconstructed.

The latest supplied R4 report records 20/20 recruitment runtime cases and explicitly leaves browser/mobile appearance and natural pacing unverified. Preserve those limits. Prior R3 placeholder recruitment statements are historical and superseded by R4; old OPEN/PARTIAL statuses are not new work orders.

### Archived file inventory

One nested archive holds these 99 original files. This table is the preservation manifest; no separate per-build cleanup report is required.

| Original member path | Bytes | SHA-256 |
| --- | ---: | --- |
| `PRIOR_BUILD_NOTES/v52_1/PLAYTEST.html` | 8,737 | `5a3ab33e1ec4b935e785087d46bf3ae8c360757e6ae4150838aac32bf755995a` |
| `QA_EVIDENCE/confirmed-bugs-after.json` | 521 | `44dadf66ad494ab61f895b3605c6b98bb865430e4df0935859a6cf0a3424efe0` |
| `QA_EVIDENCE/confirmed-bugs-before.json` | 1,062 | `87155d4ad1f156df07d34d585cde7f4dcbde0865b8f9f5adaea8bf478aebe82f` |
| `QA_EVIDENCE/confirmed-bugs-qa.cjs` | 4,797 | `e92357280ea5e28c884ddbdfe8244030f4b7b27ccce702728f7d04554e448b8b` |
| `QA_EVIDENCE/confirmed-bugs-results.json` | 521 | `44dadf66ad494ab61f895b3605c6b98bb865430e4df0935859a6cf0a3424efe0` |
| `QA_EVIDENCE/consolidation-qa.cjs` | 18,728 | `78e14fea1dacc5c6352537f99fe76d92c9600d2457bb8fbb54016bdcf6fa4e99` |
| `QA_EVIDENCE/consolidation-results.json` | 4,318 | `fc8bf4761db37709d35bacaf033bbf1ee887a462b1d3ab3a0821899747336902` |
| `QA_EVIDENCE/crime-qa.cjs` | 25,875 | `dd277fa076b7c7ef779c71cd3f619a0ba72d0977c825782c98a4c4e1cb106f3e` |
| `QA_EVIDENCE/crime-results.json` | 7,101 | `9a42a24eec81bede7332e4aa0eea6bbffba6c01e981d664640a15a9d7cc46943` |
| `QA_EVIDENCE/crime.patch` | 18,845 | `c6623e71637dc3a9ff883fef4616d061489f0285d3a3a7534622d7992897db4e` |
| `QA_EVIDENCE/expansion-qa.cjs` | 7,830 | `7f49d94ee2d0fd15abdbe3bd3f2d8bcb0fe98f58f971885733be6f9ba0347f5a` |
| `QA_EVIDENCE/expansion-results.json` | 2,077 | `1e620f85c45d0b98d22b4ec5446f9b5b3d86ab5e103f868a8924ee5022e25205` |
| `QA_EVIDENCE/factory-qa.cjs` | 3,562 | `2f2ef48e0aded93c1d03f5b18a0914b36f7d576c1fa892c9022f5c4919606108` |
| `QA_EVIDENCE/factory-random-loot-test.cjs` | 1,932 | `6bf45eba68cabeea86b0fde2521ad5c66687638a4171a7b1366a7474e0ea9f72` |
| `QA_EVIDENCE/factory-room-checklist.json` | 867 | `0d864c3564d25fd98653f53103243a10dde84c2543f4918fbd083f39ee03889c` |
| `QA_EVIDENCE/legacy-qa.cjs` | 11,915 | `9b05d29d60c7cefd417f2cf7bca07c9392430468dcec5ff598d47a9be0871808` |
| `QA_EVIDENCE/legacy-results.json` | 2,914 | `17fe4b9c084082d7d0374ca3149e696f9311f2490198a53b6f7c1d18c5f185b5` |
| `QA_EVIDENCE/recruitment-regression.cjs` | 21,507 | `b422c860c6f46391e31a7317d44b41133786eff9454f0c45abf604d3c365572c` |
| `QA_EVIDENCE/recruitment-results.json` | 2,557 | `699a924cb1843ffa9b1c9045a2dcc705477f1e6428386b169fc96268af5ccc78` |
| `QA_EVIDENCE/runC-browser-observations.json` | 2,061,485 | `36fc7a6721f699a863f162db8219d4f79c4e1d4d0cfcd7c4f6b971d43dcef559` |
| `QA_EVIDENCE/seaport-static-test.cjs` | 669 | `f821e8e8547f55417aa5abedecb2576c6f43952aa4c05d33b8e7d77e09541660` |
| `QA_EVIDENCE/source-scope.json` | 2,149 | `e0221aad247a2fe35255c99fece62277f9e71ae095e22ebcf7d0078e210d222e` |
| `QA_EVIDENCE/spawn-sampling.cjs` | 4,794 | `4cf156afb7eb1503c2ab18a03a076ad215bbd219d7c2e5662fe0892178e499c1` |
| `QA_EVIDENCE/spawn-sampling.json` | 1,216 | `a226df16479a9b5b32ee172d48100ffb698c8a37642f2ac8b4184de67c6ebc28` |
| `QA_EVIDENCE/v53-source-scope.json` | 1,428 | `ecbd8071f989fba883cff77096d65ff350ae4ba1a7c89bccc4fe0e5b8b4b49dc` |
| `QA_EVIDENCE/v53-targeted.patch` | 7,205 | `114eaf744e35d6e89546e4c28ded9753c3d82f54d1b56a3a6413720edd6234d5` |
| `QA_EVIDENCE/v54-audit-suites.json` | 559 | `06ee880d929acb883d85f4f1e2a2bd31d1f12f7889d3a61fd3100b2e6f4e36ca` |
| `QA_EVIDENCE/v54-package-validation.json` | 4,061 | `4bb52d235cfa1ef4bd87a15e709f2aee91ed4c3b1d5c06d0ffabeee5f27bebb2` |
| `QA_EVIDENCE/v54-targeted-qa.cjs` | 10,187 | `fece4dc887bb24d0ff0ee2d0455500c3b39e28c1710d067a82c2232079d4504c` |
| `QA_EVIDENCE/v54-targeted-results.json` | 2,422 | `97e66e4e53405930d3b2604008eb124963c0689f948379e5e54568c9e792b4ac` |
| `QA_EVIDENCE/v551-targeted.cjs` | 2,067 | `4713ee926d6df64b463663435c4b2037b2a23a5b216b90eafb34993efe2a71f1` |
| `QA_EVIDENCE/v552-targeted.cjs` | 5,358 | `cd1b67e518fb7a3d6a2c54d1c641ee7492b9d31eceff34af6d33cff767690cf0` |
| `QA_EVIDENCE/v553-cinematic-test.cjs` | 1,883 | `48eed5e7292e5426c9a6b25e46b0f6b16959ad1ea32aeb30e4c76c579ec498ec` |
| `QA_EVIDENCE/v555-accessory-slot-test.cjs` | 2,087 | `6fc46f7e13296ac44dc50c9c6502ef2addf4da84331ac23c6d1be57be9432121` |
| `QA_EVIDENCE/v555-ansi-name-boundaries-test.cjs` | 1,149 | `7e654bd0c9df9bda455c4583dcdb514d884bdd6aca3e5e7abeee188c4212d2e6` |
| `QA_EVIDENCE/v555-blackjack-level-gate.cjs` | 675 | `e122d1a157c15d180d81c8e0456e078f2c346c5da5263470924d59301951a831` |
| `QA_EVIDENCE/v555-casino-settlement-targeted.cjs` | 1,065 | `80763514f5c587f767073a33d91ea4d1f522b4e32a42e1ea5ebc88e1a4d9b82c` |
| `QA_EVIDENCE/v555-cheeseburger-jackpot-test.cjs` | 2,036 | `5d975f05badfd8f9d49fc6387353ab54415a51b310cd25d43cfb08e6d70aa7cc` |
| `QA_EVIDENCE/v555-chest-capacity-targeted.cjs` | 1,437 | `f4723340d7b003294acf61b16266750a7d25c1a0b25719cb8b2258ca1babb266` |
| `QA_EVIDENCE/v555-chest-save-targeted.cjs` | 1,691 | `f844cfca78e3ed7e50886600a939c6453627df98380b956ac36734366cda07f7` |
| `QA_EVIDENCE/v555-cleaner-battery-test.cjs` | 848 | `5bbff32a09064a32696af3121838ef752da09d928d61a3dffc300da360f16f8a` |
| `QA_EVIDENCE/v555-combat-damage-cap-test.cjs` | 1,233 | `44f28a83240ebe1f441b327546b6e6e8bef68c9232b6637d522a355c81cd0550` |
| `QA_EVIDENCE/v555-day-night-boundaries-test.cjs` | 1,250 | `5e94faffecb9cc79a7338eeac76fba8be4358edd94f3c986b1bf7faa93e229c6` |
| `QA_EVIDENCE/v555-day-night-runtime-test.cjs` | 1,948 | `3e03aed0e6a8a319cbce1f13157f9477c8cdbeb36b427076029c5c1a282e2f0f` |
| `QA_EVIDENCE/v555-encounter-level-bounds.cjs` | 826 | `1117b035d709d6ca03866c5ca8348cfac743edd25164f49d5dfc7047cbb11ede` |
| `QA_EVIDENCE/v555-encounter-repetition-runtime-test.cjs` | 2,169 | `7e4a0437da9035fc0701d9f74aa84063b10da0919bc1296c68e631fc87a2258d` |
| `QA_EVIDENCE/v555-gang-lookout-runtime-test.cjs` | 1,422 | `23537116b68e8cc88d72e812b7773e5db4abe657e94522d2df4daba8ece262b2` |
| `QA_EVIDENCE/v555-gang-lookout-structural.cjs` | 477 | `13e108f8e2e831afe2585fbe5180cd2ad6e32cdbaf0755ef8803130093759bc1` |
| `QA_EVIDENCE/v555-highway-multi-enemy-test.cjs` | 1,606 | `08e9d1f9019aace63f2751027110cf138aa3b55332948696e15d67af848d221b` |
| `QA_EVIDENCE/v555-iron-reaper-bleed-runtime-test.cjs` | 1,950 | `f787ba69e40a9376817d90e81f9c2a579c3fcaf7d6349985403ff9ebe84e06a4` |
| `QA_EVIDENCE/v555-iron-reaper-blueprint-test.cjs` | 2,677 | `5e3b5d8b1da2917f01010b14b57f108427288263730dc947d1aedc7a1e03b867` |
| `QA_EVIDENCE/v555-iron-reaper-crafting-runtime-test.cjs` | 3,734 | `dde1e7f57908b129cf0a05a2320b5b7407cb43e1111881b6332efdc70cd14747` |
| `QA_EVIDENCE/v555-jen-dialogue-routing-test.cjs` | 859 | `6e599c38b073653b96a602b92066b2017065df2b2639291434b3c54013a62457` |
| `QA_EVIDENCE/v555-jen-extra-quests-test.cjs` | 1,310 | `080a3cad96e1d8047324f458f034011e7d7269951c89cb5516f988ddeb657e5a` |
| `QA_EVIDENCE/v555-johnny-main-menu-test.cjs` | 811 | `312e040983a70f531b49c439d3577238992a746e963cf2bb297e25dc276bc56a` |
| `QA_EVIDENCE/v555-lookout-escape-reward-test.cjs` | 621 | `35697497d7673d347eab20eeadc40eb64a852fc12c71137b291504ccef7ade9e` |
| `QA_EVIDENCE/v555-murphy-workshop-menu-test.cjs` | 1,622 | `d447a1e9566bd923a715b52506fe0b18a774aeca93afb3751487c6f7d6cfc4f3` |
| `QA_EVIDENCE/v555-niko-collar-effects-test.cjs` | 2,111 | `0bebdcdad75594a603ca3f1043246205287792596fc2a5cbac780a6589244439` |
| `QA_EVIDENCE/v555-niko-retreat-routes-runtime.cjs` | 1,419 | `0baf0f7450cb086044313da42f3a6798c6528f39f17d688cadab68c28d93bd3a` |
| `QA_EVIDENCE/v555-niko-rewards-test.cjs` | 2,475 | `7e4d72f1c2455c8c9d5ab61cf124e0454c4f8b680d63b7d2e1311caadcfded87` |
| `QA_EVIDENCE/v555-niko-second-chance-persistence.cjs` | 1,819 | `05653285821fcb3e5fda15dd227ee66bc53d9ef40848802b4124e8c3adbed8bf` |
| `QA_EVIDENCE/v555-niko-second-chance-runtime.cjs` | 1,509 | `100cc5ea365f58214a960b35f777f09eb577800fdf00fd31c1aa16659d39f5fd` |
| `QA_EVIDENCE/v555-partial-sales-targeted.cjs` | 1,124 | `9fbfd30023ef54268961ccdcd8d9e2142c4593d16377f369eec4b1602e6526ef` |
| `QA_EVIDENCE/v555-peddler-economy-test.cjs` | 887 | `da4f478405d80770ef81c9c8cd357e4f4cebbb28c518ca812dfffd988d8d0e2d` |
| `QA_EVIDENCE/v555-r1-existing-regressions.json` | 14,497 | `904b7b2687241fd5e1b2bbfd05aa5c7da761eae8eae6c02614a41be5048e4a11` |
| `QA_EVIDENCE/v555-r1-final-state.json` | 227 | `21e7ed214150c9595e036217807a96e4b1c6be094f1a90df86fda2a3770e5a5e` |
| `QA_EVIDENCE/v555-r1-package-validation.json` | 1,585 | `61b9988f40c8e90268150c182a534aff9a9906caa12713b93ae1ab1b0f9451bf` |
| `QA_EVIDENCE/v555-r1-progression-transcript.txt` | 37,962 | `44501d3333d04d29217ccd59e87773d4fef798fd755bb1f6cf179137f53cdf11` |
| `QA_EVIDENCE/v555-r1-regression.cjs` | 11,681 | `7e1a7c232d209a69f056706dbd85a5daf1bedbd81cc86ab0ba4864c784d249d1` |
| `QA_EVIDENCE/v555-r1-results.json` | 1,257 | `a1db8df170b4f4cb81d2d95df861354f1679317ebf8db7f5ab2abf2e86d59e7a` |
| `QA_EVIDENCE/v555-r2-before-results.json` | 14,097 | `ffcacef30efead91ac9eb764993020e6ad4cc91a11f3c558e23e1112a84f9ecd` |
| `QA_EVIDENCE/v555-r2-existing-regressions.json` | 14,497 | `904b7b2687241fd5e1b2bbfd05aa5c7da761eae8eae6c02614a41be5048e4a11` |
| `QA_EVIDENCE/v555-r2-final-state.json` | 227 | `21e7ed214150c9595e036217807a96e4b1c6be094f1a90df86fda2a3770e5a5e` |
| `QA_EVIDENCE/v555-r2-package-validation.json` | 556 | `ac0dee55d7f1ea624f6f63390367cafccb4d1a9266000ad15adbad4298206ca6` |
| `QA_EVIDENCE/v555-r2-progression-transcript.txt` | 38,818 | `2f7c7ad783df0b5f4a4415541ee29962210cc564ca6111cd57a0e644fa3bb7da` |
| `QA_EVIDENCE/v555-r2-regression.cjs` | 18,507 | `c46dfd539f996a0aead10429aa4bf5f139e253ca08617cbe521502e9862811d6` |
| `QA_EVIDENCE/v555-r2-results.json` | 2,222 | `ff4064a12de3edf37b7dc0abd2ffe020f6d69c5a67552b93e4ed287d868f4616` |
| `QA_EVIDENCE/v555-random-equipment-drop-test.cjs` | 1,129 | `893b9a53516b760714f3c6f82885332730c8353f849ded6d47394d2b0f4c2cde` |
| `QA_EVIDENCE/v555-random-equipment-runtime-test.cjs` | 2,652 | `a9651679039226f9289d8af9e2e82c9543c49837eed66c5699abff8a2b9270e4` |
| `QA_EVIDENCE/v555-rarity-statistical-test.cjs` | 1,611 | `93d7d73e3058cebd955f8b9845820349c38c103bf711cf5fd6006defaab02038` |
| `QA_EVIDENCE/v555-rat-save-gate.cjs` | 543 | `8cd7264369295f9c27d6cb119e25e83d5b786655e863ca9e170bf32142768d15` |
| `QA_EVIDENCE/v555-relay-component-flow-test.cjs` | 2,461 | `72d145465f0792f99dbb0f8c692585ac9818dc7fc13dfb7347db81fc14bf2271` |
| `QA_EVIDENCE/v555-roach-combat-rewards-test.cjs` | 712 | `e91a7c90156c2033d30e94f18dc7a75ee903f47783c8729a2cc8dc85b18828a5` |
| `QA_EVIDENCE/v555-room-chest-targeted.cjs` | 2,054 | `99d4ff172e743a80387a0e135f55d85736396c65fae82fc3fe4f4da0433ee175` |
| `QA_EVIDENCE/v555-room-ownership-targeted.cjs` | 1,046 | `96b898e4a88d9148b48b129a25f08c083f26ef365bfc55c3547c1a658cff32c7` |
| `QA_EVIDENCE/v555-service-road-navigation-test.cjs` | 1,981 | `298032d71d52560424d18baf51d71de7c404ee65213988799c2037d80fe69396` |
| `QA_EVIDENCE/v555-service-road-runtime-test.cjs` | 2,046 | `e0abfaff011997e78d7a1bfe664aec8defe48132c575f22c538a2697b345be92` |
| `QA_EVIDENCE/v555-slot-payout-guard.cjs` | 925 | `25baacf72dc80248e0213bf7e184853a4b5f7f7e66a3b0af649d62a683118ba3` |
| `QA_EVIDENCE/v555-solace-gate-dialogue-test.cjs` | 1,346 | `9131d5011c73fbeeee9ed06acf77674d3424069546777dc5bef2e0c085b51752` |
| `QA_EVIDENCE/v555-terrible-billy-bounty-test.cjs` | 1,260 | `84406c4398cf7b2ec9085606a12c63555702e3bc41b517cba813296365230789` |
| `QA_EVIDENCE/v555-tim-old-house-bounty-test.cjs` | 1,358 | `7b3cda453835040370dbd772880a5e0fc603456513d390ddc93e549c1d3252ad` |
| `QA_EVIDENCE/v555-tim-talk-menu-test.cjs` | 1,169 | `14eded8425426526575a2ab4e6b9391ac359e9ebade596c9d1ac56da4174b9dc` |
| `QA_EVIDENCE/v555-wager-safety-targeted.cjs` | 1,081 | `d1e75ed249e6ae543b4d7d55a4e1ecf79f68cadf584611152a4ae975ad718a1d` |
| `QA_EVIDENCE/v555-wanderer-weight-test.cjs` | 936 | `c4698ab063a39e5b840dcb89a3a13897979403b31fa84d58d981b28dd21ad9d4` |
| `QA_EVIDENCE/v555-wayne-dialogue-routing-test.cjs` | 776 | `11eeda2ee592af65e2e171930000ed1909e6bdd378a00809136764a65b32be38` |
| `QA_EVIDENCE/v555-yardman-runtime-test.cjs` | 1,890 | `468f4de5461e34028c4486d47345698b4962ac0e331ad94b9fb8a19aa459dbfd` |
| `QA_EVIDENCE/v555-yardman-swing-test.cjs` | 647 | `f14b79b7933c9007e65610a0ec25f0f3ebc314fe77d20138ce273bd9ea42dc9b` |
| `TEST` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `audit/results.json` | 2,914 | `17fe4b9c084082d7d0374ca3149e696f9311f2490198a53b6f7c1d18c5f185b5` |

## Retained testing history, bugs and resolutions

Original title: **Route 127 — QA Report**. The following is its complete historical body, unchanged, including R4/R3 verification, earlier bugs, resolutions, test counts and limitations.


## v55.5 R4 — 2026-10-19 — Current targeted verification

**PASS: 20/20 focused production-script runtime cases** in `QA_EVIDENCE/recruitment-regression.cjs`; results are recorded in `QA_EVIDENCE/recruitment-results.json`.

The harness loads all eleven production JavaScript files in entry-page order and runs the real command parser, queued output, numeric selections, saveGame/loadGame and autosave with DOM/storage stubs and accelerated output timers. It tests:

1. No recruitment choices, aptitude disclosure, staffing labels or hiring notifications before residents are freed; no premature unlock after defeating enforcers alone.
2. Freeing residents unlocks immediately and introduces rebuilding once, independently of Chapter One completion.
3. Inspect reveals persistent 1–5 strengths/weaknesses after unlock.
4. Confirm/cancel, insufficient funds and repeat confirmation cannot double-hire or double-charge.
5. Recruits leave road/town pools; inventory, identity, suspicion and living status persist (80 sampled encounters).
6. Town hiring retains established Talk/Inspect/Fight/Steal/Browse Wares/Leave interactions.
7. Assignment/replacement confirmation and one-worker-one-building guards.
8. Clinic full/partial healing, exact cost, Bandage purchase and death-penalty recovery.
9. Store purchase/sale, protected items, full-pack safety and saved finite stock.
10. Modest trading bonuses and daily-clock restock.
11. Workshop recipe learning/level gates, material consumption, timer bonus, non-duplicated jobs and held full-pack outputs.
12. Shared Bolt/item bank, invalid amounts, custody, withdrawal fee and fee-inclusive manual checkpoint reload.
13. Staff, crafting, account and inventory persistence; fresh character isolation.
14. Legacy R3 save defaults and existing liberation as sole unlock.
15. Confirmed unassignment/reassignment without another hiring charge.
16. Hiring offers across save/load and interface Back.
17. Exact store item removal preserves similarly named medicine.
18. Workshop failure/collection and shared Murphy jobs; equipment overlay return.
19. Existing trade, theft, combat/crime and pet flags after unlock.
20. With every wanderer hired, ordinary road encounters remain available and consume one turn.

All eleven production JavaScript files passed syntax validation. Package verification checks entry-page script order/local assets, ZIP CRCs, exact runtime equality across editions, and Player exclusions. Factory/early-game progression suites were not repeated for this task.

**Limits:** Browser/mobile rendering was not verified: the available Playwright installation lacks Chromium. Real-time multi-day pacing and long-term economy tuning remain manual checks. Workshop offers the implemented crafting and equipment systems; the game has no gear-durability repair system to reuse. This supersedes R3's recruitment/services placeholder limitation. No public deployment was performed.

## v55.5 R3 — 2026-10-19 — Historical verification

- Complete production-script command harness: 19/19 cases passed, including numeric purchase/exit, pet equip/switch/unequip, overlays, reload, five-turn outbound/return travel, exhausted-turn exit, map locations, all four Factory bosses, charge prerequisites, liberation, one-time rewards and saved Chapter One completion.
- The two added R3 regression cases reproduce failures against the original R2 baseline.
- Supporting suites passed: pet/liberation 28 assertions, cinematic 13 assertions, Seaport integration 15 static checks, casino settlement 13 assertions. The old Seaport static test pinned an obsolete cache token; it now verifies a versioned script reference.
- Every production JavaScript file passed syntax validation. Package checks verify identical runtime bytes and local asset references in both editions.
- Automated progression restores HP and uses QA turn bypass; it does not establish natural combat balance or multi-day pacing.
- Brief browser testing was attempted, but the installed Playwright runtime has no Chromium executable. No browser/visual verification is claimed for R3.

## Historical R3 issues and limits (recruitment superseded by R4)

- Seaport hiring and staffed clinic/store/workshop/bank are placeholders in the supplied source. There is no recruitment implementation to repair; adding it is outside this maintenance scope. Menus now state this plainly.
- Return trips retain the existing one-time cleared threat model. Descriptions vary by segment/direction; no new respawn or encounter system was introduced.
- Natural difficulty, level 8–10 evolution, mobile layout, and live deployment/cache behavior remain unverified.
- Legacy saves, inventory and pet/quest flag formats are retained. Newly saving from Manage Pets records its physical return location; no save-schema migration is required.

## Historical evidence

These reports describe their original builds and are not claims that all historical suites were rerun for R3. Later verification supersedes earlier statuses.

### Source: V55_CHANGELOG_QA.md

## Automated checks
JavaScript parser syntax validation on every top-level script. Source-level review of new state and menu routes. Full automated stateful integration tests **not completed**; no browser playthrough was performed, as requested.

## Known incomplete items / required QA
- The Rusty Anchor currently has dialogue only; Jen's gambling and bar purchasing services have NOT been integrated. This is a major remaining Phase 2 requirement.
- Kaiden patrol movement is not implemented.
- Full browser testing of numeric hotkeys, saved combat state, quest ordering, and turn costs is still required.
- Test Ferret stealing with zero-Bolt enemies, defeat, escape and save/load, and confirm payout conservation in all paths.
- Validate XP/HP difficulty for level 8–10 players and actual pet prices against player wealth; no Factory balance changes intended.
- Full QA matrix, player-side functional validation and old-save migrations are not certified.

### Source: V55_1_CHANGELOG_QA.md

## QA performed
- JavaScript syntax checks: passed across all game JS.
- 11 targeted Node VM state assertions: passed, including quest completion idempotency, finale, patrol progression, Ferret eligibility, and Seaport menu.
- Static integration review: existing casino command handler is reused. No full browser playthrough performed, as instructed.

## Known limitations / manual verification required
- **Not fully certified:** live browser numeric and typed hotkeys, casino entry/exit, blackjack animation, saved gambling rounds, autosave and old-save compatibility need targeted interactive verification.
- Kaiden's patrol is represented by a changing location indicator and persistent state; he is still directly accessible through Town Streets rather than physically rendered at each patrol location. Full location-specific presence/interactions remain incomplete.
- The existing v55 pet system needs deeper dynamic tests for all five passives, vendor purchases, inventory management, and save/load, beyond the targeted Ferret checks.
- The existing v55 liberation, overflow handling, and Factory-to-Seaport travel need full automated integration regression; not certified by this patch.
- Earlier versions' Chapter One flags are absent and will initialize naturally. The previous saved Seaport 'done' stage requires re-entering a contextual NPC conversation to set the completion flag.


### Source: V55_2_QA_REPORT.md

# Route 127 v55.2 — QA report

## Executed automated tests
- Node `--check` on all game JavaScript: PASS.
- `QA_EVIDENCE/v552-targeted.cjs`: 28 state assertions PASS. Covers legacy initialization, liberation, reward uniqueness, full-pack pending/claim, art replay without state mutation, purchase prices/duplicate protection, pet switching, Ferret conservation and dead/empty targets, patrol movement/presence and zero-turn behavior, finale once-only.
- `QA_EVIDENCE/v551-targeted.cjs`: 11 assertions PASS.
- `QA_EVIDENCE/seaport-static-test.cjs`: 15 integration/source assertions PASS.
- `QA_EVIDENCE/factory-random-loot-test.cjs`: PASS.

## Known limitations / not certified
- No full browser playthrough was performed, as requested. No targeted live browser interactions were completed. Casino payouts and turn handling were inherited from the existing engine and were not comprehensively replayed in a browser.
- State-level tests are stubs and cannot certify real DOM rendering, scrolling, mobile fit, hotkey behavior, animation timing, or save/load from actual browser storage.
- Historical saves with Seaport already liberated before v55.2 may not automatically display the art; replay remains available from the quest interface.
- Some existing v55.1 pet passive effects and casino save/reload edge cases require deeper end-to-end QA; the targeted assertions do not exhaustively cover all requested exploit scenarios.
- No new level-10 general ANSI generation system was implemented; the art is an event-only preview.

## Manual verification recommended
1. Defeat fishermen, free residents, confirm colored character art appears exactly once and chapter ending follows Kaiden/Mia conversations.
2. Visit all four patrol stops as cumulative turns advance; check Kaiden dialogue and quest completion.
3. From Mia, play each gambling game, exit from menu and game, save/load mid-casino, then visit Jen.
4. Fill pack before liberation, claim Cutlass later, save/load, verify no duplicate.
5. Confirm art replay and readable mobile layout; test navigation/quest hotkeys.

Status: **development candidate; not fully browser-certified or complete against every v55.2 QA requirement**.


### Source: V55_3_CHANGELOG_QA.md

## QA
- All 10 game JavaScript files: `node --check` PASS.
- 13 targeted VM assertions: PASS (pre-liberation block, once-only trigger, replay, asset reference, no turn/currency changes, fallback, etc.).
- Original `transmission.png`, `seaport.js`, `factory.js`, `casino.js`, and `polish.js`: SHA-256 identical to v55.2.
- Packaged PNG exists in both Development and Player ZIPs.
- Existing v55.2 ASCII art array and `BOAT` label removed from game presentation.

## Limitations
- The new original image is an atmospheric layered vector-style illustration rasterized to PNG, rather than a photorealistic painting. Image generation was unavailable.
- No browser or mobile rendering test was run; CSS layout and asset packaging verified statically.
- No full browser playthrough was performed.
- No save/load integration browser test was performed. The original `port552ArtSeen` flag is retained.
- The art triggers at the same liberation milestone as v55.2 (freeing the residents), not at the fishermen combat victory, to preserve the established quest sequence.


### Source: V55_5_INTERIM_QA.md

# Route 127 v55.5 — INTERIM repair audit (NOT release-ready)

Baseline: v55.4 Development (3).


### Source: V55_5_CONTINUATION_QA.md

# Route 127 v55.5 continuation — NOT RELEASE READY

Baseline: v55.5 interim Development archive (derived from v55.4).

## Verification
- PASS: `node --check` for all JavaScript source files.
- NOT RUN: full browser playthrough, behavioral regression suite, save migration test, and UI rendering checks.
- NOT VERIFIED: interim duplicate-menu guard in real browser; zero-turn QA entry; all relay components; all combat payouts.


### Source: V55_5_FINAL_QA_REPORT.md

# Route 127 v55.5 — Final QA Report

## Automated evidence
- 64/64 QA_EVIDENCE/*.cjs scripts passed in the writable release staging copy (TERM=xterm; 12-second per-script timeout).
- 10/10 top-level JavaScript modules passed `node --check`.
- Tests include targeted source assertions, extracted runtime handler tests, deterministic save/load checks, 100,000-drop rarity sampling, combat and crafting tests. They are not a substitute for browser gameplay.
- First test run in the read-only source directory yielded 7 EACCES errors while writing JSON evidence; rerunning the unchanged tests in a writable release staging directory passed 64/64. These were filesystem permission errors, not game assertion failures.

## Browser verification
**NOT VERIFIED — MANUAL BROWSER TEST REQUIRED.** Browser execution was not available in this environment. No menu, animation, UI, end-to-end progression, or cross-browser result is claimed passed.

## Remaining risks and dependencies
- Full game-wide menu and numeric/hotkey browser matrix; all Solace NPC quest branches and gate/death flow.
- Relay four-component acquisition and final install, including save/load and duplicate-proofing.
- Full encounter reward balance, persistent wanderer interactions, theft and bounty outcomes.
- Equipment/accessory bonuses and inventory accounting after browser save/load.
- Niko Collar critical and Second Chance across all encounter types; Cheeseburger one-time jackpot and persistent extra capacity.
- Gambling payout replay protection, bank/room chest storage, and save compatibility with earlier builds.
- Factory/Seaport quest progression, Iron Reaper craft timer and equipment drops in actual browser play.
- Day/night and reverse travel in browser with exhausted turns; visual color progression.
- Cheeseburger is once per character, not globally unique: shared-world ownership backend does not exist.
- Browser checklist `PLAYTEST.html` includes the v55.5 additions and remains unchecked for testers to execute.

## Release disposition
**Packaged as a testable v55.5 release candidate with known manual verification requirements.** Do not describe unverified browser features as passed. Player ZIP excludes QA_MODE.html, QA_EVIDENCE, audit and internal development notes.


### Source: V55_5_R1_CHANGELOG_QA.md

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


### Source: Route127_v55_5_R2_QA_Report.md

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


