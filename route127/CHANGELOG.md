# R11 playtest improvements

See R11_CHANGELOG.md and R11_QA.md for current changes, tested behavior, balance choices, and the unresolved global ownership backend dependency.

# R10 — All-road encounter balance

Shared 50/20/15/10/5 category selection after an 80% trigger roll; quiet cards excluded; curated geographic pools; progression-scaled middle-road threats; saved repetition history; post-liberation wanderer availability safeguard. Recruitment unchanged. See ROAD_BALANCE_QA_R10.md and ROAD_SCENARIO_AUDIT_R10.md. 12,000 segments and 2,352 choice cases passed automated integration QA.

# R9 — Coast exploration and discovery

Added 17 noncombat coast scenes plus the existing fire hazard to a dedicated balanced pool alongside eight R8 combat scenarios. Added category history, resource-dependent choices, modest rewards, safe exits and directional integration QA. Recruitment unchanged. See COAST_ROAD_QA_R9.md for counts and verification.

# R8 — Factory ↔ Seaport encounter audit

Scope: coast road only; recruitment implementation unchanged.

Findings in supplied R7:
- Repeat travel already used the same random dispatcher in both directions. The reported absence of westbound fights was not reproduced in this source.
- Combat selection reused the older east-road pool without combat repeat protection. R7 already contained more than three eligible fights; perceived variety was still vulnerable to random repeats and recycled low-level threats.
- Two first-clear checkpoint fights are intentionally eastbound only. These remain one-time threats.
- Wanderers already used the shared 30% gate with a two-encounter cooldown, excluding dead/hired characters. No new spawning or recruitment framework was needed.
- Coast progress text incorrectly said Factory/Solace; arrival could leave the saved coast position one step short.

Changes:
- Eight coast-specific combat scenes: freight-car ambush, toll crew, marsh dogs, security drone, culvert crawler, cargo hijackers, seawall rifle scavenger, scrap crabs.
- Four paired enemy groups and four distinct solo threats, level 7–9, using existing combat/reward handling. Every scene offers FIGHT/BACK AWAY.
- Persist last five actually displayed coast combat titles and exclude them from subsequent combat selection. A wanderer replacing a rolled fight does not consume its history entry.
- Keep 25% combat-category selection, existing wanderer gate/cooldown, five-step travel and first-clear checkpoints. Other discovery scenes can still lead to optional fights; 25% is not the total fight probability.
- Synchronize coast position at every movement including endpoints; display the correct destination; prevent movement while an encounter is pending; apply existing roadside pet effects in both directions.


# Route 127 — Changelog

## v55.5 R7 — 2026-10-20 — Banking and permanent local identity

- Preserved R6 travel, encounters, ANSI artwork, casino, rooms, recruitment and credits. Added banking_identity.js last in the runtime manifest.
- Removed withdrawal charges and aptitude fee calculations. Amii and staffed Seaport use the same free deposit/withdrawal transaction and shared balance.
- Added explicitly LOCAL-ONLY, non-compounding interest: 1/1.5/2/2.5/3% by active bank aptitude (Amii/no hire 1%); 5,000 deposited-Bolt earning cap; floor each daily award to whole Bolts; maximum 150/day. UTC start-of-period snapshot prevents last-minute deposits earning a full day's interest. Aptitude changes begin next period.
- Added a principal/earned-interest ledger, interest-first withdrawals, persistent period cursor and financial revisions across same-ID save slots. Real Web Locks serialize same-browser tabs; old browsers explicitly warn to use one tab. No cross-device or anti-cheat guarantee is made for this local prototype.
- Added explicit 500-carried-Bolt confirm/cancel name changes at both eligible banks, input/known-local uniqueness checks, durable commit before deduction, and retained crime, notoriety, quest, equipment and pet state.
- Added opaque permanent local character UUIDs. Pre-ID saves are backed up and migrated independently by slot, never merged by matching names. New snapshots carry the ID across copies; unknown old ID values are preserved separately without silently associating prototype/cloud accounts. Storage failure blocks banking until a durable manual resave.
- Casino account keys and deterministic overnight seed now use immutable local identity. New bulletin posts carry authorId and their historical display byline; old posts are not reassigned by matching names. Wanted posters and same-ID save-selection bylines use the character's current name.
- Recovered/audited the existing dev Worker source, Probe and adapter. Production/dev health and dev listing are reachable read-only; authenticated Worker/D1 access, schema/config and current-game registration/sync remain unfinished. No remote writes, deployments, new backend or database.
- Packaged 24-file Development and 18-file Player editions. QA is hard-disabled and the access code removed in Player. All history remains in the existing three master documents and single development archive.

## v55.5 R6 — 2026-10-20 — Final demo polish

- Based on Route127_R5_ANSI_Art_Overhaul_Development.zip. Preserved Luna's colored Factory, boat, Solace and road artwork, the Foreman's art, credits and two Cheeseburger runs.
- Replaced disconnected Seaport travel with saved directional legs and a free Factory Crossroads. Solace–Factory is six steps; Factory–Seaport five. Reversals and destination choices are free. Boulder clearance gates the coastal leg. Normal encounters dispatch in either direction, independently of once-only coastal patrols.
- Added repeatable salvage, hazard, lore and quiet scenes plus Level 5 River of Fire, using the existing encounter resolution, materials, combat and wanderer cooldown. Travel remains charged; scenes cannot be repeatedly harvested in place.
- Rebalanced first-clear boss gear: first/third ordinary supplies plus 5% Rare; second one Rare; Foreman one Rare with 10% replacement Epic upgrade. XP/Bolts unchanged; prior awards untouched. Full packs bank boss equipment safely without replacing equipped gear.
- Removed installed Relay UI residue; pet management sits below Armor and is liberation-gated with compatibility for historical pet owners. Employee prompts consistently use wanderer.
- Recipes display carried ordinary materials and Bolts owned/required, shortages, rarity, success and duration. Normal tier times are 30/60/120/240/480 seconds; mechanic time modifiers remain. Quest dynamite stays guaranteed 30 seconds. Added confirmed cancellation without refunds of committed inputs.
- Three distinct supervisor pictures/names; Foreman picture reserved for Foreman. Boulder is an environmental Place Dynamite interaction with blocked/blast/open scenes, skippable cosmetic flash and immediate saved route unlock.
- Rusty Anchor offers exactly Blackjack, Captain's Dice, Pirate's Poker, Crab Racing and skill-based Knife Throwing. Added stored debit/settlement and an in-round browser journal. Solace retains Dice/RPS/Blackjack/Slots/Rat Racing.
- Mia offers the same permanent 500-Bolt room, ten-stack chest and daily diminishing rest as Jen. Separate saved chest; shared rest budget prevents town-switch full-heal resets. Extracted shared inn handler before generic bank parsing, correcting chest material commands being treated as Bolt deposits.
- Development has 23 files; Player has 17. Player hard-disables QA and omits the QA password. Historical evidence remains in the single development archive. Nothing deployed.

## v55.5 R5 — 2026-10-20 — Demo stabilization

- Repaired legacy tutorial/recipe state, exposed normal crafting at Forge, canonicalized known material names, and migrated installed Relay parts into durable quest storage without resetting quests.
- Added persistent Leave/Replace loot decisions with protected items, rarity warnings and confirmation. Paid shops reject full packs rather than charging for deferred loot. Wanderer sale errors show actual available cash.
- Added Active/Completed journal views, Rusty's entrance supply station, deterministic charge-material searches and a saved 30-second dynamite craft. Kept all three miniboss authorizations, Foreman requirement, boss rewards and optional room exploration.
- Reworked all 44 East Road discoveries and appended eight established combat scenarios; retained old encounter indices, repeat protection and wanderer cooldowns. Added compact Level 5 scenes and updated Steve's games sign.
- Rebuilt occupied/liberated Seaport and Market menus; moved investigation to docks and immediate survivor release after battle. Recruitment still unlocks only when residents are freed. The vacant Workshop terminal ends the story independently of staffing.
- Added Pack Mule at 350 Bolts with an active +2-slot bonus, safe over-capacity switching and underlying backpack upgrade accounting. Preserved existing pet abilities and permanent Cheeseburger jackpot capacity.
- Added optional 20-second credits with Syn/Forge/Luna, two running Cheeseburger passes, skip/replay, reduced motion, saved once-only completion and the requested thank-you screen.
- Shipped matching 16-file Player and 22-file Development packages; development retains the single historical/evidence archive and three maintained docs. Updated the current playtest checklist. No live deployment.


## v55.5 R4 — Documentation cleanup — 2026-10-20

- Documentation and packaging only; game version, save schema and runtime assets are unchanged.
- Maintain only CHANGELOG.md, QA_HISTORY.md and DEVELOPMENT_NOTES.md for written development history. QA_REPORT.md is retired; its complete historical body is retained in QA_HISTORY.md.
- The supplied build already contained three partly consolidated Markdown documents. Retained every existing historical entry, source attribution, design decision, checklist and verification limitation rather than replacing them with summaries.
- Packed 96 QA_EVIDENCE files, audit/results.json, the prior v52.1 playtest checklist and the empty TEST placeholder into DEVELOPMENT_ARCHIVE/HISTORICAL_QA.zip. Original paths and bytes are preserved; all 67 automated test scripts remain unchanged inside it.
- A normal extraction now contains 21 files instead of 119 (98 fewer, 82.4%). This counts the nested archive as one file; its 99 preserved members have not been deleted.
- Historical evidence remains development-only. Routine Player packages contain the 15 runtime files listed in DEVELOPMENT_NOTES.md and exclude all documentation, archives and QA entry pages.
- Verified every documentation transfer before omitting the redundant QA_REPORT.md; verified all retained runtime, QA-page and archived bytes and both ZIP integrity checks. No gameplay tests were rerun and no new gameplay certification is claimed. No website deployment.

## Retained version history

The following is the complete historical body of the supplied CHANGELOG.md, unchanged. Historical filenames identify source material already consolidated by earlier builds; they are not missing new deliverables. Later version entries supersede earlier status claims.


## v55.5 R4 — 2026-10-19 — Seaport recruitment

- Added survivor recruitment only after `player.flags.seaport55.freed === true`; before that, encounters, inspections and building screens contain no recruitment or staffing prompts.
- Liberation introduces rebuilding once. Existing liberated saves receive the same introduction on their next harbor visit.
- Added one-time, confirmed hiring for the existing named wanderers; persistent 1–5 Medicine/Trading/Mechanics/Banking aptitudes are revealed by Inspect. Existing identities, inventories and crime state remain intact.
- Hired survivors leave road/town encounter pools without being marked dead. Empty wanderer pools fall back to ordinary road encounters.
- Added numbered building assignment, confirmed replacement/unassignment, inspection and one-job-per-survivor guards. Vacant buildings display NEED TO HIRE only after liberation.
- Enabled clinic treatment/Bandages, supply buying/protected confirmed selling, existing crafting/equipment access, and shared personal Bolt/item banking.
- Added modest aptitude effects, persistent daily store stock and safe inventory/transaction guards. Existing recipe learning, level gates, ingredients, chance, timers and held-output behavior are retained.
- Connected new contexts to save/load, overlays and maps; bumped production assets to 55.5-r4. No website deployment.

## v55.5 R3 — 2026-10-19

- Fixed numeric pet equip/switch and Back handling; retained Nessa purchase/exit repairs.
- Prevented pet management becoming an overlay return loop or newly saved physical location.
- Fixed exhausted-turn harbor exits changing location and stale road position on Factory re-entry.
- Preserved five charged segments each direction, existing threat statistics/rewards, and Factory balance.
- Added distinct coast-road atmosphere in both directions and clear distress-signal motivation from Forge through the obstruction to occupied Seaport.
- Clarified Dominion affiliation, captive dialogue, and unavailable hiring/services.
- Consolidated 14 historical Markdown files into three maintained documents; no functional modules were combined.

## Historical changes

Historical entries below retain source versions and supplied dates. Where no date was stated, the source filename identifies the version; ZIP timestamps are not treated as development dates. Later entries supersede older instructions.

### Source: V55_CHANGELOG_QA.md

# Route 127 v55 — Development notes and QA

## Implemented
- Seaport fishermen introduction, investigation, combat confrontation, manual freeing of captives, and Kaiden/Mia conversations. Main quest progression uses existing player.flags and existing Main Quest display.
- Harbor Guard Cutlass rare weapon (19–26 damage), once-only liberation award, with pending reward fallback if backpack full.
- Seaport town menu and four closed, unstaffed facilities; blocked typed and numeric entries.
- Kaiden and Mia dialogue menus; pet vendor Nessa; five pet definitions and pricing; ownership and one-equipped-pet flag persisted through existing save snapshots.
- Equipment summary shows pet; MANAGE PETS command allows equipping, inspecting, and unequipping owned pets.
- Scrap Rat, Crow, Cat and Dog modest passive behaviors on the Seaport road/combat; Ferret combat-round theft deducts from the enemy's remaining Bolt reward pool.

### Source: V55_1_CHANGELOG_QA.md

# Route 127 v55.1 — Seaport completion candidate

## Changes
- Added Mia's Rusty Anchor bar menu with Small Talk, Energy Bar purchases and a link into the existing Jen casino engine. Bets and payouts use the same existing casino state and validation; returning from the casino routes back to Mia. No new gambling engine or Factory balance changes.
- Added a persistent Kaiden patrol location across Town Streets, Harbor Entrance, Market Area and Docks. It advances on lifetime-turn thresholds, without extra turn charges. Patrol location appears in the Seaport menu.
- Added one-time Chapter One completion after liberation, captive rescue, and conversations with both Kaiden and Mia *after* rescue. Finale text is stored in source, completion in player.flags.chapterOneComplete, and the quest journal shows COMPLETE with a READ CHAPTER ONE command. The game remains explorable.
- Updated Seaport objective to reflect completed chapter. Maintained existing pet and equipment logic and Factory settings.
- Fixed numeric Mia purchase label to map to the existing purchase handler.


### Source: V55_2_CHANGELOG.md

# Route 127 v55.2 — targeted integration candidate

- Seaport patrol stops now include Town Streets, Harbor Entrance, Market Area, and Docks; Kaiden is listed and interactable only at his current stop. Patrol advances on existing cumulative-turn clock and is saved under `player.flags`.
- Added Seaport stop navigation and return actions. Main Quest dialogue remains available by finding Kaiden's indicated patrol location.
- The Rusty Anchor casino uses the existing casino engine with a distinct heading. BACK / RETURN TO TOWN route back to Mia, rather than Jen; load restores Mia casino context when the Seaport casino flag is active.
- After freeing the captives, a one-time ANSI-style harbor scene appears in the terminal. The art uses monospaced text and colored CSS classes, not a PNG or literal ANSI escapes. Replay with `REPLAY HARBOR ART` through the existing quest journal, without awarding currency, XP, or items.
- Full backpack liberation reward can now be claimed from the Seaport menu once space becomes available; claim clears the pending queue.
- Existing Chapter One finale, progression, combat numbers, equipment values, and later visual evolution are unchanged.


### Source: V55_2_QA_REPORT.md

## Defects addressed
1. Kaiden's patrol location was displayed but he had no actual presence at the indicated stop. Added accessible patrol-stop menus and location gating.
2. Mia's casino reused Jen's heading and some BACK/TOWN routes. Fixed return destination and heading, added casino-context restoration on load.
3. Full-pack Cutlass pending queue lacked a player-accessible claim action. Added claim option.
4. No liberation ANSI scene existed. Added one-time terminal character art and non-mutating replay.


### Source: V55_3_CHANGELOG_QA.md

# Route 127 v55.3 — Seaport Cinematic

## Changelog
- Replaced the v55.2 character-art harbor renderer with an original locally packaged 1440×900 PNG.
- Added the editable source artwork (`seaport_liberation.svg`) in Development build only.
- Kept the original intro overlay and `transmission.png` unchanged.
- Reused the existing terminal output queue, transmission-inspired reveal styling, and existing once-only `port552ArtSeen` flag.
- Added a visible replay hint to the existing quest journal (`REPLAY HARBOR ART`).
- Image fallback text is displayed on load failure.
- Responsive sizing with preserved aspect ratio; reduced-motion CSS support.
- No changes to combat, XP, Factory, quests, pets, rewards, or the v55.2 save flag.


### Source: V55_4_CINEMATIC_ASSET_UPDATE.md

# Route 127 v55.4 — Seaport cinematic art replacement
- Replaced `seaport_liberation.png` with the newly approved original cinematic harbor painting (1586 × 992).
- Kept the existing image path and v55.3 trigger, replay, save flag, fallback, and styling intact.
- Removed obsolete vector SVG source, which no longer represented the packaged artwork.
- No game JavaScript, CSS, quests, rewards, or combat changed.
- Static QA: PNG format and asset path verified. Browser display and playthrough not performed.


### Source: V55_5_CHANGELOG.md

# Route 127 v55.5 — Changelog (release candidate)

Based on v55.4. The 31-section work order was implemented incrementally; see V55_5_WORK_ORDER_CHECKLIST.md for item-by-item implementation status.

- Added game-wide menu-output deduplication guard and QA turn-access refinements.
- Updated Relay component inventory tracking, acquisition guards, and installation gating.
- Restricted ANSI NPC-name highlighting to bounded dialogue spans.
- Rebalanced multiple road encounters, enemy rewards, reinforcements, Yardman and wanderer levels/variety.
- Expanded Solace Gate, Tim, Jen, Johnny, Murphy, Wayne and Amii interactions and quests.
- Updated wanderer trading, theft, and menu flows; protected equipment/quest items during selling.
- Added Rusty Lantern room and storage, gambling restrictions, six accessories, Niko reward and Collar effects.
- Added Cheeseburger slot jackpot and additional backpack capacity (per-character; not globally unique).
- Added weighted ordinary-encounter equipment drops with pending rewards for full packs.
- Added Level 6 Iron Reaper crafting recipe, 30-second timer and optional bleed effect.
- Audited day/night and branch navigation; expanded targeted and runtime regression suites.

**Limitations:** Browser interactions and visual appearance have not been verified in this environment. Features not end-to-end tested remain PARTIAL, not complete. This is a testable release candidate, not a fully certified stable build.


### Source: V55_5_INTERIM_QA.md

## Applied
- `consolidation.js`: v53 post-command menu fallback now checks whether numbered choices or hotkeys already exist before forcing another menu. This addresses one duplicate-menu pathway without suppressing rendered text.

## Checks
- PASS: `node --check` on all ten JavaScript files.
- FAIL: pre-existing `QA_EVIDENCE/v54-targeted-qa.cjs` reports `portCommand is not defined` in its test harness. Not proof of a game runtime failure.
- NOT VERIFIED: browser menu duplication regression, zero-turn QA access, quest installation, encounters, NPC dialogue, save/load and Seaport progression.


### Source: V55_5_CONTINUATION_QA.md

## Changes in this continuation
- Highway Robbers: throwing Bolts requires all five; escape now succeeds 60% without XP or fails 40% with 15 HP damage and no XP.
- Roach Nest: direct combat rewards increased to 25 XP and 8 Bolts; backing away no longer grants XP.
- Yardman encounter initialization: 55 HP, 7–12 normal damage, 65 XP and 28 Bolts. Heavy-swing mechanic is NOT implemented.
- Dust Over Schoolyard: pushing through now costs 10 HP.
- Security Drone: tightened fight-branch command matching so text containing 'drone' does not automatically initiate combat.


### Source: V55_5_R1_CHANGELOG_QA.md

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


### Source: Route127_v55_5_R2_Changelog.md

# Route 127 v55.5 R2 — Browser QA Repairs

October 16, 2026. Based on the R1 archive used for the completed live browser playtest.

- Fixed Nessa’s numeric pet-vendor exit and duplicate fallback menus by placing dialogue before the authoritative choices.
- Fixed numeric vendor sales treating the displayed stack quantity as part of the item name. Prices, quantity selection, confirmation, and equipped/quest/Legendary protections remain intact.
- Corrected the live map in Seaport, its submenus, the coast road, and the collapsed-overpass context, including overlays and saved locations. Existing Level 5 visibility gate is preserved.
- Corrected the harbor description between defeating the fishermen and freeing the residents.
- Show the clinic death-penalty reset notice only when healing actually clears a prior death streak.
- Refresh quick-control labels after commands complete so combat’s USE ITEM label returns to INVENTORY immediately after victory.
- Updated entry-page cache tokens to 55.5-r2 and QA title to Browser QA Repair 2.

Factory-to-Seaport prerequisites and rewards are preserved. No balance, prices, multiplayer, recruitment, or Level 8–10 evolution changes. No website deployment performed.


