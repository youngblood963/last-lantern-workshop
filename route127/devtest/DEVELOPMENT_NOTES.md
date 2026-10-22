# R11 playtest improvements

See R11_CHANGELOG.md and R11_QA.md for current changes, tested behavior, balance choices, and the unresolved global ownership backend dependency.

# R10 — All-road encounter balance

Shared 50/20/15/10/5 category selection after an 80% trigger roll; quiet cards excluded; curated geographic pools; progression-scaled middle-road threats; saved repetition history; post-liberation wanderer availability safeguard. Recruitment unchanged. See ROAD_BALANCE_QA_R10.md and ROAD_SCENARIO_AUDIT_R10.md. 12,000 segments and 2,352 choice cases passed automated integration QA.

# Route 127 — Development Notes

## Current build — v55.5 R7 — 2026-10-20

R7 is a focused follow-up to R6. This section supersedes earlier banking fees and current-build manifests; historical bodies below are preserved. Save schema 38 remains. banking_identity.js loads after final_polish.js. Player: 14 JS + index.html/styles.css + two PNGs = 18 files. Development adds the two existing QA HTML pages, these three master documents and one evidence archive = 24. Only app.js differs between editions: Player hard-false QA_BUILD and blank QA access code.

### Banking rules and persistence

- Shared local bank account per permanent local character ID. Deposits/withdrawals and item storage have no bank transfer fees. portBankFee is retained only as a zero-return compatibility shim; no fee-discount math remains.
- One active daily rate: no hire/Amii/aptitude1 =1%; aptitude2=1.5%; 3=2%; 4=2.5%; 5=3%. Visiting Amii does not stack or replace a better staffed Seaport rate. Seaport staff remains gated by liberation and hiring.
- Interest uses complete UTC calendar periods [00:00, next 00:00), independent of device display time zone. Newly migrated bank balances start as principal with zero current-period basis; no retroactive windfall. Deposits made during a period join the next period's snapshot. Example: deposit Oct20 23:59 → eligible Oct21 00:00 → first payment Oct22 00:00. Deposits just after midnight can wait nearly 48h for first payment. Existing eligible funds still pay at the next boundary.
- principal and earned interest are separate. basis=min(eligible principal,5000); daily credit=floor(basis*rateBasisPoints/10000). No fractional carry. Maximum 150/day. Multiple elapsed days are calculated without compounding, honoring saved current/next period rate. Aptitude changes are observed at game-command boundaries and affect next period, never previous earnings.
- Withdraw earned interest first, then principal. Principal withdrawal lowers this period's basis immediately; redeposit cannot restore it during the current period. Remaining principal above 5,000 can still leave basis capped at5,000. Explicitly withdrawing and redepositing interest is an ordinary new deposit, subject to the same wait; automatic interest never becomes principal.
- The durable browser registry route127-local-accounts-v1 contains balances, period cursor, current/next rate, revision, last payment, current name/history and carried-wallet value at financial commit. A single storage write commits a transfer/rename before changing live character values; failed writes charge no fee. Account period cursor prevents normal repeat payments on reload or same-ID slot change.
- Older same-ID financial snapshots reconcile to the latest local bank/name and wallet-at-commit when revision is stale. Other save progress remains selected. Distinct legacy slots are kept distinct, even if their names match; ambiguity is not resolved by silently merging characters. Old pre-ID localStorage snapshot is backed up before migration. If durable migration fails, banking stays disabled until manual resave succeeds.
- All regular game commands acquire the shared Web Lock where supported, so financial/rate/name mutations across same-origin tabs serialize. A single-page queue fallback remains available for older browsers, with an explicit single-tab warning. This is not a cross-device or anti-cheat authority; a client clock or registry can be edited. Player interest is clearly labeled LOCAL-ONLY and no global balances are launched.

### Names and stable identity

- 500 carried Bolts per confirmed successful change; cancel, invalid/current/reserved/local-conflict name, insufficient cash and failed commit cost zero. Both banks show current/proposed name and explicit confirm/cancel. Seaport needs actual staffed bank service.
- Rename validation: 3–20 ASCII characters, first a letter, remaining letters/digits/spaces/apostrophes/hyphens; no doubled spaces or repeated apostrophe/hyphen punctuation, basic reserved/system/NPC and unsuitable-word filtering. This is a modest local validation policy, not comprehensive moderation. Known local records/slots prevent rename collisions; backend global uniqueness is NOT implemented.
- characterId is an opaque local-UUID, stable across UI name changes and new snapshots/slot copies. It is explicitly local, not a trusted server ID. Unknown historic ID fields are preserved as legacyCharacterId, not automatically claimed remotely. Existing sw- prototype identities/tokens are not imported or converted to real accounts.
- Inventory, progression, pets, bank, ownership and crime stay on the same saved player object; changing handle does not clear them. New bulletin messages retain authorId plus byline-at-posting. Existing messages are historical and are not reassigned based on name. Current wanted notices use current handle. Casino round journal and overnight seed now key by immutable local ID; R6 legacy casino journal data is read compatibly.

### Backend inventory and next safe checkpoint

| Asset | Verified now | Authentication / gap |
| --- | --- | --- |
| route127-api.youngblood963.workers.dev | HTTP200 root health | Production Worker bundle, ownership/config and D1 binding not inspected; no writes |
| route127-dev-api.youngblood963.workers.dev | HTTP200 dev health; public /players query returns one historical test record | Public metadata query is not account auth; exact deployed code/schema unknown |
| D1 route127-world / route127-dev | Historical names supplied in work order | Database IDs, binding, schema/migrations and current permissions unverified; none created or modified |
| Dev Worker registration source | Recovered existing FIXED ZIP, one JS file expecting DB/players.auth_hash | Prototype client-issued ID and possession-token update ownership; no trusted game-state authority, real account association or demonstrated server uniqueness |
| Shared World Probe | Current GitHub source and live LLW page reachable | Public GET /players scanner only; no immutable-ID ownership lookup demonstration |
| shared-world-dev.js adapter | Current GitHub source recovered; live dev-game HTML does not load it | Old key is slot:name and would change after rename; not included in R7 runtime or re-enabled |
| Current R7 game | Permanent local ID, offline bank/name flows tested | No remote adapter, registration, cloud save or authoritative server economy enabled |

Repository reference: https://github.com/youngblood963/last-lantern-workshop/tree/main/route127/devtest . Existing probe: https://lastlanternworkshop.com/route127/devtest/SHARED_WORLD_PROBE.html . Endpoint reads and source hashes are retained in packed audit evidence; health does not prove D1 topology or deployed-source equivalence.

Exact blocker: authenticated Cloudflare account/deployment/D1 access and checked-in Worker config + SQL/migrations are unavailable here. Required manual setup/access names only: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN (least-privilege Worker/D1 development access), and Worker binding DB mapped to the existing route127-dev. Do not add these to browser code or ZIPs. Provision nothing new by default.

Next authorized development checkpoint: obtain/recover existing deployment source, wrangler configuration and D1 migrations; inspect authenticated dev binding/schema read-only first. Then design account authentication/authorization, server-issued immutable player IDs with explicit opt-in mapping from local IDs, atomic unique-name ownership and a server-time/idempotent banking ledger. Only after that can current game plus probe demonstrate authenticated dev registration/lookup. Client level/location metadata must remain untrusted and cannot grant currency/items. Reconnection must not overwrite local progress or silently adopt the old test character. No production cutover/public launch is approved; present a safe plan before any such action. This work performs zero remote writes/deployments and does not create a second backend.

No PvP, global Legendary ownership, endless Factory or unrelated content was added. Stop here for human playtest; cloud identity/saving remains explicitly unfinished.

## Current build — v55.5 R6 — 2026-10-20

This section supersedes earlier current-build manifests and counts; historical bodies below remain intact. Baseline: Luna ANSI overhaul R5, SHA-256 listed in the evidence metadata. Save schema remains 38; no resets. final_polish.js loads after stabilization.js. Normal runtime is 13 JS + index.html + styles.css + two PNGs = 17 files. Development adds QA_MODE.html, PLAYTEST.html, these three maintained docs and one packed archive = 23 files. Player differs only by hard-false QA_BUILD and blank QA access code in app.js; no QA page, reports, tests, archive or secrets.

- r6Road saves active leg (west/coast), position, direction, pending encounter/index and serial. Junction choices cost zero, moves use existing spendTurn. West leg 6; coast 5. Coastal death recovery retains existing Solace respawn and now accounts for the entire coast position plus six-step inland distance. Niko's existing second chance is retained. Service/Lower Access navigation stays on original branch state.
- Repeat selector: Fire 4%, combat 25%, discovery 25%, salvage 16%, hazard 12%, lore 12%, quiet 6%, before existing wanderer dispatch and story encounters. Reuse original combat/choice systems. Safe fire bypass costs no extra turn beyond the already-paid step; careful path risks at most 8 HP, never the last HP, for 1 Scrap; Cloth path consumes 1 ordinary Cloth for 1 Wire. Outcome resolves once.
- Boss 1/3 ordinary supplies and 5% Rare gear; boss 2 Rare; boss 4 Rare with 10% replacement Epic. Gear draws from existing weapon/armor rarity pools, no new gear. Old award markers are honored; basement still needs all three supervisors.
- Tier times: Common 30s, Uncommon 60s, Rare 120s, Epic 240s, Legendary 480s. Only existing recipes offered; no invented Legendary catalog. Workshop aptitude applies its existing 0–8% time reduction. Quest charge remains 30s guaranteed. Existing jobs retain saved endsAt; changing recipes does not retroactively restart timers. Cancellation destroys already-committed inputs, requires confirmation.
- Mia room uses actual Jen behavior: permanent ownership for 500 Bolts; no rent expiration or renewal fee exists in this build. Both use shared ten-stack inn transfer/rest logic; separate Anchor chest in flags and original rustyRoomChest retained for Solace. Daily rest is shared 100/75/50/25/0% max-HP effectiveness across inns, never adds turns. This avoids switching towns to reset diminishing returns.
- Captain: ordered automatic holds 6→5→4; five dice/three throws; unqualified score 0; scoring pair can reroll; Mia uses same rolls, stops at 8+. Highest score wins equal stakes, tie pushes.
- Poker: shuffled 52-card unique deck, five cards each, player replaces up to three once. Full ranking including wheel straight and rank kickers. Mia retains made straight or better; otherwise retains rank groups and replaces up to three low singletons. Win 2× total return, tie 1×.
- Crabs: Captain Claws 30%/3×, Pinchy Pete 25%/3×, Sir Snaps-a-Lot 20%/4×, Rusty Bucket 15%/6×, Admiral Crabcakes 10%/9×. Total return includes stake; expected returns 90/75/80/90/90%, so house edges 10/25/20/10/10%. Cosmetic paths never affect the preselected winner or payment. Reduced motion shows final lanes immediately.
- Knives: 1600ms triangle cycle, position from performance.now at instant keyboard/pointer input, independent of render frame count. Distance from center ≤.045/.13/.25 awards 50/25/10; else 0. Five throws, max250. Aim >10s = miss; hidden tab/loaded active timing session forfeits rather than granting free frozen aim. Mia per-throw distribution 20% miss/35%10/30%25/15%50; revealed, not adaptive. Both equal stakes; winner takes pot, tie refunds. Real physical-device latency remains human QA.
- Transactions debit before rendering and settle once before cosmetic effects. Per-round browser ledger restores latest state for ordinary save/reload; local files/storage are not an anti-cheat security boundary. Blackjack continues the existing shared game engine.
- Future advanced weapon times (minutes/hours), global leaderboards, Legendary projects, endless Factory, major lore rewrite and further expansion remain deferred. Stop after handoff and await human feedback.

## Current build — v55.5 R5 — 2026-10-20

Use the R5 runtime manifest below, not the historical 15-file R4 allowlist. Continue updating only these three master documents. The full approved work order is retained inside the evidence archive at WORK_ORDERS/Route127_Forge_Work_Order_Oct20_Seaport_Factory.md. New implementation is in stabilization.js, loaded after recruitment.js; existing modules retain the authoritative base systems.

### Persistent decisions and compatibility

- Save schema remains 38. R5 adds namespaced flags, no character reset. Old completed Chapter One saves remain completed and are not forced into credits; the Credits control replays them. Legacy prepared charges/cleared-road/final-component states are honored.
- Existing charge architecture had one generic component from the Foreman, not four named charge items. The minimal approved replacement uses **existing** Cloth, Electronics, Wire and Scrap Metal in Shipping Office (floor 1), Maintenance Workshop (floor 2), Observation Room (floor 3) and Underground Storage (basement). These are dedicated, deterministic charge reserves in flags, not random drops, not miniboss loot, and not duplicate spendable materials. Parts are secured/consumed into the 30-second job; Foreman plus three supervisors still required before arming. Completed old charge states migrate safely.
- The initial worn backpack remains 8 slots until its existing 10-slot upgrade; Pack Mule adds 2 while active (10→12 for the upgraded pack). Existing Cheeseburger jackpot's permanent +6 remains intact. Buying the backpack upgrades the underlying bag even while Mule is active. Switching away from Mule retains excess items but blocks all new intake, including stack additions, until space is freed.
- Loot decisions persist in flags with a saved physical return context. Replacing discards the selected entire stack after confirmation; equipped and quest items are protected, and Rare/Epic/Legendary candidates carry an explicit warning. Full-pack paid purchases fail without payment. Existing boss auto-equipment/bank protection is retained.
- Occupied Seaport has two top options; liberated town has five. Market has the four staffable buildings, immediate Pet Store and Return. Kaiden can be found from Town Streets while retaining his patrol state. Recruitment unlocks on liberation, not terminal completion. Workshop terminal stays accessible while the business is vacant.
- Credits do not mutate replay state or inventory. Completion is committed/autosaved before the overlay opens. Key/tap skips to the thank-you screen; continue returns to regular play. Reload does not replay automatically. Reduced motion shows scrollable static credits and suppresses the running gag.
- Rusty uses shared gear prices/protection, item typing, capacity and inventory routines, a finite saved 500-Bolt starting wallet plus purchases, daily refill stock and a 20% markup on base prices. He is at the Factory entrance; Rusty Anchor remains Mia's separate Seaport tavern.
- East Road originally had 44 discovery-only entries. All now have distinct approaches; eight existing combat entries are appended, preserving old numeric indices. The existing 30% wanderer opportunity with a two-step cooldown remains unchanged; random discovery streaks can still occur naturally.

### Backlog and distribution

Next priority is hands-on natural pacing/combat and Level 8–10 presentation, not new systems. Endless Factory descent, global leaderboards and globally unique Legendary armor remain backlog only. Corvette fast travel, multiplayer/global ownership and unapproved repair mechanics remain out of scope.

Player: exactly the following 16 runtime files. Development: those files plus QA_MODE.html, PLAYTEST.html, the three master docs and DEVELOPMENT_ARCHIVE/HISTORICAL_QA.zip (22 loose files). Do not recursively distribute development content as Player. Historical evidence remains packed; new test evidence is inside that same archive. No separate per-build report files are distributed loose.

| R5 runtime file | SHA-256 |
| --- | --- |
| `app.js` | `0dd06b6dd8c918acf8acd1f206b537a8079ecb7d9e914866275873540c1655d9` |
| `casino.js` | `2309c958c807585ea25603ca0890189f0300000683510494676a7e45651d47be` |
| `consolidation.js` | `6acda09198ede9a28a2241e6d64635cd519eb0340b32e54212c730436d9889eb` |
| `crime.js` | `5db0f6b849c0bfb9243bc21c3687d0ff21c5c6c0aa8f2cfcc323c2da69f03318` |
| `expansion.js` | `624762d96dcad2156021eece188538504516e33cf7cfc1392dfa54087232ab77` |
| `factory.js` | `e2e4a0a59f39181622af2394c0091d1fb034c9e7864c988137e979bb9a9c89f9` |
| `index.html` | `44a682d65b979e85c6fe3ea598eb41f56b6351c7122f7fc132ef3037e4668dee` |
| `polish.js` | `169bea769b474eb7afd5136abde04751eb8728bfc001f11d25902633c5503cc7` |
| `recruitment.js` | `ad29b45e4ad6434b0c656cadb3c53f10f8f81f741751d0ddb1f98194b54425b7` |
| `seaport.js` | `02ca9306d6356b35efd0175564b5f93d6aad9f6915817120548873925a4fbc67` |
| `seaport_liberation.png` | `35ab22bf3fe99e3c6cdf125998c450ee93a56efcdc4c9e331fea7b58a4f5e6dd` |
| `styles.css` | `a1aec4e656af7a2f06c2a83855a49beaa93e966a137cc248eec558990ad31e4b` |
| `transmission.png` | `e46c600316d6e0d76699497bf4ecc018b7f583081d9456fac6b9444840876e5b` |
| `v55.js` | `d2b8931e56d3fdb2da2dbd5b0adc43264558689d09a9a7bbc52e7ede2569e5a6` |
| `wanderer_fix.js` | `f8349652562fcb863a9ed1b8adde801712773aac98d2e069f9a478979a5007af` |
| `stabilization.js` | `2d0685cf7214445802c7d49bbd9d42900634a3b79f3cf3420042f8a8e9f44f10` |


## Current documentation and packaging policy — 2026-10-20

This policy supersedes older maintenance instructions that name QA_REPORT.md. Historical excerpts below are reference records, not current implementation/deployment instructions. This cleanup does not change the R4 game or authorize a deployment.

### Three maintained documents

- CHANGELOG.md: add version/date changes and relevant packaging changes.
- QA_HISTORY.md: append test scope, environment, results, discovered bugs, resolutions, evidence references and explicit unverified areas.
- DEVELOPMENT_NOTES.md: maintain current decisions, roadmap and outstanding issues, followed by historical design/work-tracking records.

Update these documents in place. Do not generate new standalone build notes, work orders, QA reports or cleanup summaries with each rebuild. Put future result summaries in QA_HISTORY.md; add raw evidence to the development-only archive when genuinely needed. Do not alter tests just to rename documentation references. This is a documented maintenance policy; no build automation is added or changed.

### Current decisions and outstanding work

- R4 recruitment and staffing unlock only after `player.flags.seaport55.freed === true`; no player-facing recruitment or staffing hints before liberation. The full current R4 state model and balance table are retained below.
- Preserve save schema 38, per-player state, pet ownership/prices, Factory balance, existing travel/progression prerequisites and one-time rewards.
- Outstanding: actual browser/mobile recruitment and service checks, saved contexts, natural economy/candidate/restock pacing, broader long-term progression and Level 8–10 visual checks. Earlier automated progression does not establish natural difficulty or timing.
- Retain all older checklists and status qualifications as dated historical evidence. Later R1/R2/R3/R4 entries supersede earlier gaps; no speculative gameplay fixes are part of this cleanup.

### Package contents and evidence recovery

| Category | Before | After normal extraction |
| --- | ---: | ---: |
| Production runtime files | 15 | 15 |
| Current QA entry/checklist pages | 2 | 2 |
| Maintained Markdown documents | 3 | 3 |
| Loose historical evidence, tests and placeholder | 99 | 0 |
| Development evidence archive | 0 | 1 |
| **Total files** | **119** | **21** |

The 99 archived originals are preserved inside `DEVELOPMENT_ARCHIVE/HISTORICAL_QA.zip`. The reduction is in loose files, not lost evidence. Expanding that archive restores the original QA_EVIDENCE/, audit/, PRIOR_BUILD_NOTES/ and empty TEST paths. Do not expand it into a Player distribution or count this as a storage-byte reduction: images dominate package size and the outer ZIP already compressed evidence.

To recover evidence, extract HISTORICAL_QA.zip into a separate writable copy of this cleaned game directory, with the game files at the same root. Run any selected historical suite from that game root, for example `node QA_EVIDENCE/recruitment-regression.cjs`. Some older harnesses depend on the working directory or generate result files; restored paths preserve that behavior. The prior PLAYTEST.html in PRIOR_BUILD_NOTES/v52_1 is historical; root PLAYTEST.html is the unchanged current checklist. Its embedded old-version wording is retained because this task does not modify QA tools.

### Routine Player distribution allowlist

Package only the following 15 files, using their current bytes. Exclude CHANGELOG.md, QA_HISTORY.md, DEVELOPMENT_NOTES.md, QA_MODE.html, PLAYTEST.html, DEVELOPMENT_ARCHIVE/, restored QA_EVIDENCE/, audit/, PRIOR_BUILD_NOTES/, and TEST. Do not recursively ZIP the development directory to produce a Player release. There was no packaging script in the supplied ZIP to update; this allowlist is the maintained distribution rule, not a claim of automated enforcement.

| Runtime file | Unchanged SHA-256 |
| --- | --- |
| `app.js` | `2fc25d765541030fc7240d5f16e785f3abb624b5acdd8bec10d752437b1c88b9` |
| `casino.js` | `2309c958c807585ea25603ca0890189f0300000683510494676a7e45651d47be` |
| `consolidation.js` | `3f7fcfe08b5ed7349b1203b3983d72c06a5e2db6cc683807db7060797671f553` |
| `crime.js` | `5db0f6b849c0bfb9243bc21c3687d0ff21c5c6c0aa8f2cfcc323c2da69f03318` |
| `expansion.js` | `0078d0f736e0609beebb9c1bce0802a716701600db83a1f31f566f74c6f570b6` |
| `factory.js` | `7b992385399c265d8b85787edf94caab89c973d9f057ac9fb258261a795c21cd` |
| `index.html` | `49d10f8d96e03ddf58d0df420a5103cc37c03de4d634abe10eb03169e1a58e2f` |
| `polish.js` | `169bea769b474eb7afd5136abde04751eb8728bfc001f11d25902633c5503cc7` |
| `recruitment.js` | `7d41d938abf85d87c76e897f7368f1951c8ed0c604d0c20cef682886e09fbeaf` |
| `seaport.js` | `02ca9306d6356b35efd0175564b5f93d6aad9f6915817120548873925a4fbc67` |
| `seaport_liberation.png` | `35ab22bf3fe99e3c6cdf125998c450ee93a56efcdc4c9e331fea7b58a4f5e6dd` |
| `styles.css` | `0043140e462f808e64cdc9c0c0223f54174d954aed25be0b4e3ebade35b52716` |
| `transmission.png` | `e46c600316d6e0d76699497bf4ecc018b7f583081d9456fac6b9444840876e5b` |
| `v55.js` | `4fb1985b7b3542693cf55fad1858070ef4599e6c324caad034c2f9582dccf4b6` |
| `wanderer_fix.js` | `f8349652562fcb863a9ed1b8adde801712773aac98d2e069f9a478979a5007af` |

### Cleanup scope

Only the three master documents and archive organization changed. index.html, all eleven production JavaScript files, styles.css, both PNG assets, current QA pages, all automated test scripts and historical evidence are preserved byte-for-byte. No game version/cache token changes, test execution, functional changes or deployment were performed.

## Retained design decisions, roadmap and work tracking

The following is the complete historical body of the supplied DEVELOPMENT_NOTES.md, unchanged. It includes the current R4 design/balance details and earlier source-attributed work tracking. In particular, references to QA_REPORT.md in historical policy now resolve to QA_HISTORY.md; source-named legacy reports are retained excerpts, not documents to recreate.


## Current implementation — v55.5 R4 — 2026-10-19

Recruitment and all four staffed businesses are implemented. The sole unlock is the existing `player.flags.seaport55.freed` liberation flag. Do not add a separate level, quest or chapter-completion gate. Before liberation there must be no player-facing recruitment or staffing hints, including on Inspect and building labels.

State remains per player: `flags.seaportStaff` stores hired identities, assignments and stock; `wandererState[name].seaportAptitudes` and `.seaportInspected` retain hidden traits and disclosure. The existing save schema remains version 38. No shared/global ownership records or separate persistence service were introduced. Recruited wanderers stay alive and retain inventory but are excluded from road/town appearance selection. Confirmation contexts revalidate payment, presence and ownership.

### Balance decisions

| System | Rule |
| --- | --- |
| Aptitudes | 1 novice, 3 capable, 5 expert; stable individual traits, exposed by Inspect after unlock |
| Hire | 60 + 10 × saved wanderer level Bolts, once; every hire confirmed |
| Clinic | 5–6 HP per Bolt in 0.25-point steps, ceil cost for needed healing; partial treatment limited by funds; full treatment clears death streak |
| Clinic Bandage | 12–8 Bolts with increasing Medicine |
| Store | 0–8% lower buy/higher sell prices; whole-Bolt rounding; equipped, quest and Legendary sale protection; each sale confirmed |
| Store stock | Energy Bars 8, Bandages 6, Tents 3, Scrap 8, Wire 6, Cloth 6 per existing refill period; remaining stock persists |
| Workshop | Existing CRAFT_RECIPES and shared v49MurphyJob; 0–8% nominal time reduction rounded up to whole seconds, original material/Bolt cost and success chance |
| Bank | Existing shared personal bankBolts/stash; free deposits/item storage, 4–0 Bolt withdrawal handling fee from carried Bolts; fee displayed before amount entry |
| Staffing | One building per hired survivor. Confirm replacements/unassignments; previous worker returns to available roster, with no refund or additional hiring charge |

The workshop does not invent durability or upgrades absent from existing systems. Use the established Inventory equipment actions. New transactions autosave. Bank fees are included before the existing manual transaction checkpoint; failed transfers roll the fee back.

### Outstanding verification

- Brief actual browser/mobile play of recruitment, staffing and service menus, including saved contexts.
- Natural pricing, candidate availability and daily restock pacing through play.
- Existing unrelated progression/balance coverage gaps remain historical; do not treat old checklist statuses as a new work order.

Continue updating only these three consolidated documents. Development includes evidence/tests and QA entry points; Player contains only runtime assets. No deployment is authorized by this assignment.

## Historical R3 maintenance policy — 2026-10-19

Maintain CHANGELOG.md, QA_REPORT.md and DEVELOPMENT_NOTES.md. Do not add version-specific reports or work orders. Development includes these documents, QA entry points and technical evidence; Player contains runtime files only. No website deployment was performed.

## Historical R3 priorities (recruitment superseded by R4)

1. Brief browser/mobile verification of pets and Factory-to-Seaport progression.
2. Decide future scope for recruitment and staffed Seaport services; currently unimplemented, not certified complete.
3. Evaluate natural pacing and levels 8–10 through hands-on play before expanding systems.

## Preserved design decisions

Retain save schema, pet prices/ownership, Factory balance, progression prerequisites and one-time rewards. Road threats remain one-time encounters; repeated travel is not a new reward-farming system. Story edits explain existing destinations and captivity without a world-lore rewrite.

## Historical decisions and work tracking

The legacy checklist below is historical evidence, not a fresh instruction to expand R3. Later R1/R2/R3 results supersede stale pending claims. Historical deployment directions are references only; this assignment prohibits deployment.

### Source: V55_CHANGELOG_QA.md

## Prices and assumptions
Scrap Rat 75, Crow 75, Cat 90, Dog 105, Ferret 230 Bolts. **Provisional:** exact level 8–10 player wealth distribution has not been measured, so pricing is not yet empirically validated.

### Source: V55_5_INTERIM_QA.md

## Remaining work
- The other v55.5 work-order requirements have NOT been implemented or certified.
- The duplicate-menu cause is not conclusively isolated; the applied guard is a narrow candidate fix only.
- Do not deploy as a Player release.


### Source: V55_5_CONTINUATION_QA.md

## Incomplete requirements
The majority of the original 31-area work order remains unimplemented, including multi-enemy combat, full encounter reward audit and repeat protection, expanded wanderers, Solace guard and NPC quest additions, accessories, Niko and Cheeseburger, player-room rest scaling, gambling gating, random equipment drop distribution, and end-to-end factory/Seaport regression testing. Do not distribute this as the completed v55.5 Player build.

## Additional continuation — Johnny interaction menu
- Added a dedicated Johnny's Trading Post front menu with `VIEW STOCK`, `SELL ITEMS`, `TALK`, and `BACK` choices.
- Stock and sales remain routed through the existing vendor/selling systems; the TALK option opens Johnny's existing dialogue and quest interactions.
- Added `QA_EVIDENCE/v555-johnny-main-menu-test.cjs`.
- Verification: 6/6 Johnny menu assertions passed; all JavaScript files passed `node --check`; all existing `*test.cjs` / `*targeted.cjs` / runtime test scripts passed when run from the development directory.
- Still not release-ready: full browser interaction testing and substantial original work-order requirements remain outstanding.

## Additional continuation work — accessory equipment slot and test harness
- Added a single accessory equipment slot with six approved accessories (three Common, three Uncommon).
- Accessory DEF bonuses contribute to armor defense; accessory damage bonuses contribute to weapon range.
- Added accessories to Mara's rotating stock and purchase-price table; inventory selection supports EQUIP.
- Equipped accessories are excluded from ordinary selling and banking, and accessory ownership is serialized in character saves. Legacy saves without the field migrate to `accessory: null`.
- Added `QA_EVIDENCE/v555-accessory-slot-test.cjs`; 9/9 assertions passed for item definitions, equipped bonuses, save snapshot round-trip, and sale/stash protection.
- Repaired four legacy automated test harnesses (`consolidation-qa.cjs`, `crime-qa.cjs`, `expansion-qa.cjs`, `legacy-qa.cjs`) to load `seaport.js`, where `portCommand()` is defined. The failure was in harness script loading, not in the game's HTML script order.
- Verification after these changes: all JavaScript files pass `node --check`; all 40 available `QA_EVIDENCE/*.cjs` scripts pass when run from the development directory.
- Limitations: accessory browser interaction and actual browser save/load are not yet verified. This remains a development continuation, not a release candidate.


### Source: V55_5_WORK_ORDER_CHECKLIST.md

# Route 127 v55.5 — 31-Section Work-Order Checklist

Status legend: **PASS** = implementation and targeted tests evidenced in this workspace; **PARTIAL** = some implementation exists but the complete requirement is not verified; **OPEN** = not completed/verified. This checklist intentionally distinguishes source edits from browser/release validation.

1. Game-wide duplicate menu rendering — **PARTIAL** (single-output guard exists; browser-wide transition matrix still needed).
2. Zero-turn QA access — **PARTIAL** (QA gate/replenishment code and targeted tests exist; Player-build exclusion and browser verification remain).
3. Relay Station component tracking — **PARTIAL** (quest-storage inventory display and acquisition logic exist; all four source conditions/install flow require full integration test).
4. ANSI color rendering — **PARTIAL** (fixed early-game NPC/wanderer highlighting to color only the bounded leading name instead of random letters across the full dialogue; 6 source assertions pass. Full browser-level color/rarity matrix still required).
5. Encounter reward audit — **PARTIAL** (several passive XP and combat rewards adjusted; full branch-by-branch audit remains).
6. Encounter repetition — **PARTIAL** (recent-encounter weighting/cooldown logic exists; statistical spawn-distribution testing remains).
7. Wanderer levels — **PARTIAL** (level-weighting logic and tests exist; cast/progression/persistence integration not fully verified).
8. Security Drone — **PARTIAL** (fight/circle/move outcomes adjusted; browser test still needed).
9. Highway Robbers — **PARTIAL** (individual enemy HP/loot, capped attacks, escape rules and runtime tests exist; broader save/load/combat integration remains).
10. Gang Lookout — **PARTIAL** (reinforcement round and multi-enemy state tests exist; full reward/retaliation browser validation remains).
11. Yardman — **PARTIAL** (55 HP, standard/heavy damage, miss chance and runtime tests exist; quest/reward integration still needs end-to-end test).
12. Other encounter improvements — **PARTIAL** (multiple encounters changed; not every named encounter/branch audited).
13. Solace Gate — **PARTIAL** (five approved gate dialogue choices now route; choosing fight starts a turn-costing guard combat. One-time Jen rescue on death uses normal recovery penalties and preserves bounty state. 8 source assertions pass; browser combat/death flow and gate access regression remain).
14. Tim — **PARTIAL** (seven-option Talk menu, Old Badge hand-in, Trouble at the Old House and Terrible Billy bounty contracts now exist. Terrible Billy can be accepted from Work, hunted during a road encounter, defeated for proof, and turned in once for 140 XP/100 Bolts; journal state is tracked. Both bounty contracts still need browser/save-load idempotency testing).
15. Jen — **PARTIAL** (Talk categories/routing and Last Call preserved; implemented Unpaid Tab with 12-Bolt cost and one-time XP/Bolt reward, plus A Familiar Face dialogue quest; source assertions pass, but browser flow and save/load idempotency still need runtime verification).
16. Johnny — **PARTIAL** (four-option main menu added and tested; all quest/stock regressions still need browser validation).
17. Murphy — **PARTIAL** (workshop/Talk menus added and tested; crafting and quest end-to-end regression remains).
18. Wayne — **PARTIAL** (Talk categories/routing and existing quests preserved; full clinic/quest browser validation remains).
19. Amii — **PARTIAL** (Talk options added; Niko/Alex pet/reward interactions not verified).
20. Wanderer interactions — **PARTIAL** (deduplication, Browse Wares, theft/bounty persistence exist; full interaction matrix remains).
21. Selling interface — **PARTIAL** (quantity sales, confirmation, overflow and equipped/quest protections exist; rare/epic confirmation and all merchant routes need integration coverage).
22. Rusty Lantern player room — **PARTIAL** (purchase/rest/chest logic and targeted tests exist; complete browser/save/attack-safety verification remains).
23. Gambling — **PARTIAL** (level/location gating, payout guards and tests exist; end-to-end game/payout coverage remains).
24. Accessories — **PARTIAL** (one slot, six accessory definitions, equip flow, bonuses, Mara rotation and sale protection added; browser/load/save test still required).
25. Niko rewards — **PARTIAL** (Pet Niko grants one randomized, once-per-character reward with pending delivery if pack is full; Pet Alex is harmless; 12 targeted assertions pass. Collar critical-hit, max-HP, and once/day Second Chance effects have targeted tests; browser validation remains).
26. Cheeseburger — **PARTIAL** (5% per slot spin grants once-per-character pet and +6 pack slots; no vendor/trade path; 6 targeted assertions pass. Global uniqueness is not claimed without shared-world ownership infrastructure; browser/save-load verification remains).
27. Random equipment drops — **PARTIAL** (ordinary encounter victories now roll equipment at 55% Common / 30% Uncommon / 13% Rare / 2% Epic; weapon/armor pools only; full-pack drops persist for later claiming. 9 source assertions pass; 100,000-roll distribution and pending-drop save/load tests pass; full browser encounter integration remains).
28. Factory crafting progression — **PARTIAL** (Iron Reaper recipe added at Level 6 with 18–27 damage, 8 Scrap, 4 Wire, 3 Cloth, 75 Bolts, 30-second timer and 90% success; 10 targeted assertions pass. Bleed combat effect and active-job save/load have runtime coverage; full browser craft test remains).
29. Day/night cycle — **PARTIAL** (hour thresholds and turn advancement inspected; 10 new source assertions confirm DARK/DAWN/DAY/DUSK boundaries, invalid turn-count rejection, no overspending, and retained night combat/XP bonuses. Runtime turn-boundary and zero-turn town interaction tests remain).
30. Service Road and Solace navigation — **PARTIAL** (reverse/return fixes exist; added `QA_EVIDENCE/v555-service-road-navigation-test.cjs` with 10 source assertions for turn cost, duplicate menu options, depth boundaries, insufficient-turn guards, and return routing. Browser travel-cost matrix remains).
31. Solace town navigation — **PARTIAL** (legacy visible typed-command prompts require browser audit; hidden typed command compatibility must be preserved).

**Separate release deliverable:** Automated QA complete; manual browser testing NOT VERIFIED — MANUAL BROWSER TEST REQUIRED. See V55_5_FINAL_QA_REPORT.md.

## Latest work in this workspace
- Fixed four legacy QA harnesses to load `seaport.js`, where `portCommand()` is defined. The affected harnesses now run successfully rather than failing with a harness-only `ReferenceError`.
- Implemented the accessory equipment slot and six approved accessories; accessory bonuses feed defense/damage calculations, Mara's rotating inventory includes them, and equipped accessories are protected from sales.
- Added `QA_EVIDENCE/v555-accessory-slot-test.cjs` (9 assertions).
- Implemented Amii’s Pet Niko/Pet Alex interactions. Niko’s one-time weighted reward table supports pending delivery when the backpack is full; Alex’s reaction causes no damage. Added `QA_EVIDENCE/v555-niko-rewards-test.cjs` (12 assertions).
- Implemented Cheeseburger as a 5% per-slot-spin, once-per-character jackpot; grants +6 backpack slots and is not sold by the pet vendor. Added `QA_EVIDENCE/v555-cheeseburger-jackpot-test.cjs` (6 assertions). Global uniqueness remains unavailable without shared-world ownership infrastructure.
- Added the Level 6 Iron Reaper blueprint with the approved materials, cost, damage, timer, and success chance. Added `QA_EVIDENCE/v555-iron-reaper-blueprint-test.cjs` (10 assertions); the optional bleed effect is recorded as weapon metadata but is not yet applied by combat.

## Latest continuation pass — 2026-10-15
- Implemented the approved random equipment rarity distribution for ordinary encounter victories only. Guaranteed quest and boss rewards remain untouched. Equipment is selected from matching weapon/armor rarity pools; if the backpack is full, the item is stored in `player.flags.pendingEquipmentDrops` and can be claimed with `CLAIM EQUIPMENT`.
- Added `QA_EVIDENCE/v555-random-equipment-drop-test.cjs` (9 source assertions).
- Regression testing exposed two isolated combat harnesses that extract `handleCombat` without loading app-level helper declarations. The encounter drop hook now checks that the helper exists before invoking it, preserving browser behavior while allowing the extracted handler tests to remain isolated.
- Re-ran the previously failing Gang Lookout and Highway Robbers runtime suites: 7/7 and 8/8 assertions passed. Full QA_EVIDENCE suite count and release checklist remain in progress; this is not a release sign-off.

## Latest continuation pass — ANSI color span boundaries
- Fixed early progression name coloring in `app.js`: NPC and wanderer dialogue now applies the highlight only to the bounded leading name token instead of randomly coloring letters throughout the entire line. This specifically addresses the reported Hollis dialogue color leakage while preserving general early-game color evolution and equipment rarity coloring.
- Added `QA_EVIDENCE/v555-ansi-name-boundaries-test.cjs` (6 source assertions).
- Validation: all 45 `QA_EVIDENCE/*.cjs` scripts passed; all top-level JavaScript files passed `node --check`. Browser visual validation remains outstanding.

## Latest continuation pass — Tim Talk menu
- Replaced Tim's legacy Small Talk menu with the approved seven-option Talk menu and preserved the Old Badge hand-in as a separate available action.
- Routed Bounties to the existing wanted board, Pay Off Bounty to the existing fine-settlement system, and Relay Station to the existing unlock flow. Collect Bounty remains informational until a valid contract/proof system exists; no false payout is granted.
- Added `QA_EVIDENCE/v555-tim-talk-menu-test.cjs` (8 assertions). Updated the older consolidation test to assert the new approved menu labels.
- Validation: all 46 `QA_EVIDENCE/*.cjs` scripts passed with `TERM=xterm`; all top-level JavaScript files passed `node --check`.

## Latest continuation pass — Solace Gate
- Implemented the five approved gate choices: abandoned terminal, trade, Relay Station, passing through, and picking a fight.
- Picking a fight starts a level-scaled gate guard combat and charges the normal one-turn town fight cost.
- Added a one-time Jen rescue line for death during gate-guard combat; the normal death travel/recovery penalties still apply, and the existing bounty state is not cleared.
- Added `QA_EVIDENCE/v555-solace-gate-dialogue-test.cjs` (8 source assertions).
- Validation: the new 8/8 source assertions passed, all available `QA_EVIDENCE/*.cjs` scripts passed, and `app.js` passed `node --check`. Browser validation remains outstanding.

## Latest continuation pass — Jen side quests
- Added Unpaid Tab and A Familiar Face options to Jen’s dialogue menu. Both use per-character quest flags and appear in active/completed quest journal sections.
- Unpaid Tab checks the player can afford 12 Bolts before charging; completion pays 20 Bolts and 25 XP. A Familiar Face has a one-time 30 XP / 10 Bolt completion reward.
- Added `QA_EVIDENCE/v555-jen-extra-quests-test.cjs` (10 source assertions). Browser interaction and save/load checks remain outstanding.

## Latest continuation pass — Tim bounty contract
- Implemented Tim's Trouble at the Old House contract using the existing Wayne/house-squatter progression. Players accept the contract from Tim's Work topic, defeat the existing squatter to obtain proof, and return to Tim to claim 100 XP and 75 Bolts. The contract state appears in active/completed quest journal sections and is set to complete before rewards are granted to prevent repeated collection.
- Added `QA_EVIDENCE/v555-tim-old-house-bounty-test.cjs` (10 source assertions).
- Validation: 10/10 new assertions passed; all 49 `QA_EVIDENCE/*.cjs` suites passed; top-level JavaScript syntax checks passed. Browser/save-load integration remains outstanding; Terrible Billy is still unimplemented.

## Latest continuation pass — Terrible Billy bounty
- Implemented Tim's Terrible Billy contract as a character-flagged quest: accept from Tim's Work topic, use HUNT TERRIBLE BILLY during a road encounter, fight a named Level 5 raider, and return proof to Tim.
- Victory marks proof; Collect Bounty transitions proof to done before awarding 140 XP and 100 Bolts, preventing repeat payout. Added active/completed quest-journal entries.
- Added `QA_EVIDENCE/v555-terrible-billy-bounty-test.cjs` (10 source assertions); 10/10 passed.
- Validation: all 50 `QA_EVIDENCE/*.cjs` tests passed when run from the development directory; all top-level JavaScript files passed `node --check`. Four legacy scripts fail if launched from another working directory because they use relative file paths; this is a harness invocation limitation, not a gameplay failure. Browser combat and save/load verification remain outstanding.

## Latest continuation pass — Day/night audit
- Added `QA_EVIDENCE/v555-day-night-boundaries-test.cjs` (10 source assertions). Confirmed phase boundaries: DARK before 06:00, DAWN 06:00–07:59, DAY 08:00–16:59, DUSK 17:00–19:59, DARK from 20:00. Confirmed turn spending rejects invalid counts and overspending, advances world hour by actual spent turns, and retains night combat damage and XP bonuses.
- Validation: day/night assertions passed 10/10; all top-level JavaScript files passed syntax checks. The full QA_EVIDENCE suite is being rerun from the development directory because four legacy tests use working-directory-relative file paths.

## Latest continuation pass — Service Road navigation
- Added `QA_EVIDENCE/v555-service-road-navigation-test.cjs` (10 source assertions) covering branch return costs, duplicate Walk Back menu output, fast-return gating, one-turn step-back behavior, depth cap, and fork reverse choice.
- Validation: test passed 10/10; runtime browser route traversal and save/load testing remain outstanding.

## Latest continuation pass — Service Road and Niko’s Collar
- Added `QA_EVIDENCE/v555-service-road-navigation-test.cjs` (10 assertions) for branch costs, duplicate Walk Back output, insufficient-turn checks, return routing, depth cap, and reverse-direction option.
- Implemented Niko’s Collar max-HP delta on accessory equip/swap and a once-per-game-day Second Chance that leaves the player at 1 HP before normal death penalties; added `QA_EVIDENCE/v555-niko-collar-effects-test.cjs` (8 source assertions).
- Validation: both new tests passed (18/18 assertions); broader suite and syntax checks are being rerun. Critical-hit bonus remains to implement, and browser/save-load validation is outstanding.

## Latest continuation pass — Niko's Collar critical hit
- Wired the approved 2% critical chance into the main `handleCombat` player attack path, using a 1.5× base-damage multiplier and explicit critical-hit feedback. The effect only applies while Niko's Collar is equipped; other equipment retains its existing damage behavior.
- Extended `QA_EVIDENCE/v555-niko-collar-effects-test.cjs` with source assertions for equipped-only gating, randomized chance, damage multiplier, and combat feedback.
- Validation is pending targeted suite execution; browser/save-load verification remains outstanding.

- Continued Task 28: activated Iron Reaper's optional 10% bleed chance in the main combat path (3 bonus damage on proc) and added four targeted assertions. Browser crafting/combat validation remains outstanding.

## Latest continuation pass — Relay component flow audit
- Added `QA_EVIDENCE/v555-relay-component-flow-test.cjs` (12 source assertions) covering durable four-part state, legacy-save defaults, duplicate-acquisition prevention, component count, inventory display outside pack slots, all four component labels, acquisition guards for Johnny/Yard/Lower Access Road/east equipment rack, and installation gating.
- Validation: Relay flow test passed 12/12. This is source-level coverage; the four acquisition routes and install sequence still require browser/save-load integration tests.

## Latest continuation pass — Iron Reaper bleed runtime test
- Added `QA_EVIDENCE/v555-iron-reaper-bleed-runtime-test.cjs` to execute the real extracted combat handler with deterministic random values.
- Verified bleed proc adds exactly +3 damage and feedback, no-proc preserves base damage, and non-Iron-Reaper weapons never trigger the effect.
- Validation: 7/7 runtime assertions passed. Full crafting timer/success/failure and save/load integration remain outstanding.

## Latest continuation pass — Iron Reaper crafting runtime
- Added `QA_EVIDENCE/v555-iron-reaper-crafting-runtime-test.cjs`, which loads the real game modules and exercises Murphy's recipe command flow.
- Verified Level 6 recipe selection, exact 8 Scrap / 4 Wire / 3 Cloth / 75 Bolt consumption, successful completion after timer expiry, failed crafting consuming materials without granting the weapon, and the Level 6 gate.
- Validation: 14/14 runtime assertions passed. This improves Task 28 coverage; save/reload during active crafting and browser UI verification remain outstanding.
- Follow-up: extended `v555-iron-reaper-crafting-runtime-test.cjs` to exercise the actual saveGame/loadGame path with an active Iron Reaper job. The job key, consumed materials, and Bolt balance survive reload. Craft runtime suite now passes 20/20 assertions; full browser UI validation remains outstanding.

## Latest continuation pass — Random equipment drop runtime validation
- Added `QA_EVIDENCE/v555-random-equipment-runtime-test.cjs` (12 assertions) exercising the actual rarity roller at every threshold boundary: 0/54.999 Common, 55/84.999 Uncommon, 85/97.999 Rare, and 98/99.999 Epic.
- Verified full-pack equipment is held in pending drops and can be claimed after pack capacity is restored.
- Validation: 12/12 runtime assertions passed. Task 27 still needs larger statistical sampling and broader encounter/save-load integration.

## Latest continuation pass — Random equipment rarity statistical sampling
- Added `QA_EVIDENCE/v555-rarity-statistical-test.cjs` to exercise the actual rarity roller with a reproducible seeded PRNG across 100,000 equipment drops.
- Observed Common 55,035 (55.035%), Uncommon 30,246 (30.246%), Rare 12,779 (12.779%), Epic 1,940 (1.940%), all within ±1 percentage point of the approved 55/30/13/2 targets.
- Validation: new test passed all four distribution assertions; all 58 `QA_EVIDENCE/*.cjs` scripts passed from the development directory; all top-level JS files passed syntax checks.
- Task 27 remains partially validated pending actual encounter integration, save/load of pending drops, and browser UI verification.

## Latest continuation — Pending random equipment save/load integration
- Extended `QA_EVIDENCE/v555-random-equipment-runtime-test.cjs` to execute real `saveGame(2)` / `loadGame(2)` with a pending full-backpack equipment drop, then claim it exactly once after making room.
- Validation: 17/17 random-equipment runtime assertions passed; all 58 QA_EVIDENCE `.cjs` scripts passed; all top-level JavaScript files passed syntax checks.
- Task 27 still needs browser UI verification and encounter end-to-end sampling; not release complete.

- Continuation: repaired Niko Collar Second Chance combat softlock by routing through existing flee handling instead of clearing combatState while leaving stage=combat; updated targeted regression assertion. Browser verification still required.

## Latest continuation — Niko Second Chance runtime regression
- Added `QA_EVIDENCE/v555-niko-second-chance-runtime.cjs` exercising the extracted live `tryNikoSecondChance` function in a controlled VM, including lethal rescue at 1 HP, retreat transition out of combat, same-day one-use guard, next-day reset, unequipped collar, and nonlethal states.
- All 59 QA scripts pass from the development directory; all top-level JavaScript syntax checks pass.
- Task 25 remains PARTIAL until real browser combat and save/load testing verifies recovery routes for each combat source.

## Continuation checkpoint — full QA runner stability
- Re-ran all 61 QA_EVIDENCE scripts under a 5-second-per-script watchdog. Three harnesses printed successful assertions but retained application timers, causing the process to time out. Added explicit process termination *after* completed synchronous assertions to those three harnesses; no gameplay source changes were made.
- Re-ran all 61 scripts: **61/61 passed, zero timeouts/failures**. All top-level JavaScript files passed `node --check`.
- This is a targeted automated suite result, not full browser QA or release sign-off. All 31 work-order statuses remain unchanged.

## Continuation checkpoint — QA suite verification
- Re-ran the entire current QA_EVIDENCE directory using a per-script watchdog: **61/61 passed**, zero failures.
- Ran `node --check` against every top-level `.js` file: all passed.
- Reviewed Task 25 Second Chance routing: the live implementation delegates to `handleCombat("flee")`, which contains source-specific return paths; targeted tests cover ten sources and persistence, but browser validation is still required.
- Updated task descriptions 25, 27, and 28 to reflect completed targeted runtime tests rather than stale earlier implementation gaps. No release-ready claim or ZIP packaging.

## Continuation checkpoint — live day/night runtime
- Added `QA_EVIDENCE/v555-day-night-runtime-test.cjs` exercising the actual `spendTurns`, `timePhase`, and `isDark` functions in an isolated VM. Covered DUSK→DARK transition, turn accounting, overspending, invalid/zero turn costs, midnight rollover, QA mode and all four day phases (19 assertions).
- Full automated regression: **62/62 QA scripts passed**, zero timeouts/failures using 6-second per-script watchdog; top-level JavaScript syntax checks passed.
- Task 29 remains PARTIAL pending browser end-to-end turn/clock and zero-turn town interaction verification. Task 31 remains OPEN pending full browser and release verification.

## Continuation checkpoint — Service Road live menu runtime
- Added `QA_EVIDENCE/v555-service-road-runtime-test.cjs` evaluating the actual `branchReturnCost`, `serviceRoadChoices`, and `branchLandmarkChoices` functions in an isolated VM. 23 assertions cover depth-scaled fast-return costs, one Walk Back per menu, return availability, consumed landmark visibility, and maintenance-yard completion gating.
- Full automated regression: **63/63 QA scripts passed**, zero failures with six-second per-script watchdog; top-level JavaScript syntax checks passed.
- Task 30 remains PARTIAL pending actual browser travel and turn-cost integration, especially exhausted-turn and save/load scenarios. Task 31 remains OPEN.

## Continuation — Encounter repetition runtime coverage
- Added `QA_EVIDENCE/v555-encounter-repetition-runtime-test.cjs` exercising live `rerollRoad`, `rememberEncounter`, history migration and both encounter pools: 261 assertions passed, including 250 randomized uniqueness runs, fresh-before-recent selection, level gating and duplicate history suppression.
- Full QA suite: 64/64 scripts passed with per-script timeout; all top-level JavaScript syntax checks passed.
- Task 6 remains PARTIAL pending browser encounter sequencing and save/load history checks. No gameplay code changes were required.


### Source: V55_5_R1_CHANGELOG_QA.md

## Manual deployment

Extract the chosen archive into the existing devtest directory, preserving the included runtime filenames and images. Development includes QA_MODE.html and evidence; Player excludes QA entry points, test harnesses and historical development files. Both contain identical production runtime bytes.

Start a NEW GAME in an empty save slot rather than continuing an older character. On the Development QA page, enter TESTING, then the existing QA access code, when turn-limit bypass is needed. TEST OFF restores normal limits. Verify the complete Factory → Forge → dynamite → obstruction → Seaport → liberation → save/load sequence. Use a hard refresh to pick up the new asset query token; do not assume refreshing fixes any quest state by itself.


