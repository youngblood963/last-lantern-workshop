# Route 127 v53 — focused work-order delivery

**Audited playtest candidate. Automated checks pass; not declared stable.**

The work order explicitly permits A + critical B/C fixes first. This package completes the three high-priority repairs and the critical interaction, bounty, board, transaction and repeat-theft changes below. Deferred features are not claimed as fixed.

## Root causes and changed files

| File | Change and reason |
|---|---|
| app.js | Combat menu callback was not assigned back to outputQueue, allowing notification/menu timing races. Track it. Main Street now uses FIND TIM to enter his top-level service menu. |
| crime.js | Remove obsolete one-attempt gate. Check finite eligible holdings before spending a turn; exclude legendary/Blackglass items from theft. Keep existing formulas. |
| consolidation.js (new) | Canonical menus and final-state action restoration; quantity transactions; TALK/wares labels; Tim service menu; bounty/history display; board drafts; wallet refill; restock and journal guidance. |
| index.html, QA_MODE.html | Load the focused layer in the same production order and update changed-script cache versions. Both entry points remain. |
| QA_EVIDENCE, reports/checklist | Portable test evidence and explicit completed/deferred scope. |

Existing overlapping wanderer renderers produced inconsistent/duplicate choices. Crime and other narrative messages can clear shortcut maps; testing only map presence missed context/menu loss. The focused suite exercises the real command dispatcher and action renderer with notification-style map clearing, awaited queues and controlled terminal-output mocks. It is stronger evidence than isolated helper assertions, but is not a real browser test.

Vendor v48Sell formerly committed the entire stack, immediately for common items; wanderer sales committed one. Both now quote quantity 1 by default and accept explicit 1/5/all/custom with confirmation. Quantities/totals are validated at commit against exact current holdings, prices, context and funds. Canceled, stale, insufficient-funds and overflow cases do not change holdings. Wanderer cash and goods transfer together. Vendor pricing and its pre-existing unlimited shop purchasing model remain intact; no new vendor wallet system was added.

## Completed versus deferred

| Work-order item | Delivered status |
|---|---|
| A1 notifications/naked cursor | Repaired; combat, Rook murder, level-up and death action maps verified automatically. Browser pending. |
| A2 wanderer menus | One deduplicated renderer. Rook is a hostile ordinary roster member and cannot shop; Hollis is a nonhostile roster member. Both have STEAL. |
| A3 stack sales | Quantity selection and confirmation at vendors and wanderers; funds/stock/overflow protections verified. |
| B1 TALK / Tim services | Labels changed globally; old aliases accepted; preserved nested topics/quests; top-level fine payment. |
| B2 bounty display/history | Sidebar row, retained WANTED, real player handle, current/lifetime and separate history. |
| B3 board | Numbered entry/bounties/town, draft/edit/cancel/confirm, 120-character limit/count, original filter/posts/save key. Story-completion announcement removed. |
| B4 BROWSE WARES | Wanderer label only; existing road-event trade commands remain unchanged. |
| B5 finite wallets | Existing funds conserved; daily 4-Bolt capped top-up on existing clock. No preference restrictions. |
| B6 full-pack replacement | **Deferred.** Current capacity rules and pending weapon rewards remain; new replacement/sell recovery UI is not implemented. |
| B7 gear comparison/equip prompts | **Deferred.** Existing equip behavior remains. |
| B8 universal Turn Around | **Deferred.** Existing direction/reverse mechanics unchanged; no claim to fix all road narration. |
| B9 restock display | Existing refillText clock, no competing timer or discount change. |
| B10 rental interior/chest | **Deferred to content phase.** Existing 18-Bolt rental/rest service remains; no chest added. |
| B11 clear-name objective | Derived, repeatable journal guidance; disappears on payment; no XP/Bolts or separate completed-quest record. |
| B12 component expansion | Deferred as directed; no new recipes/items. |
| C repeat theft | Cap removed; real finite transfers, one turn per attempt, no XP, persistent suspicion. |
| C rarity tuning | **Deferred pending explicit numerical approval.** Legendary/Blackglass protection implemented; uncommon/rare/epic odds unchanged. |

## Theft and economy audit

Actual chance remains clamp(0.54 + (playerLevel − targetLevel)*0.045 − suspicion*0.04, 0.12, 0.78). Success raises suspicion by 1; detection raises it by 2. It persists across menu exits and saves; no automatic decay added. Harder repeat attempts reach the existing 12% lower clamp. No 5% epic cap or invented rarity multipliers were applied. Legendary protection filters theft targets only and cannot erase or block player ownership of quest equipment. Blackglass Requiem is not defined in the supplied GEAR pool; name protection also guards that future/external item without adding it to content.

No changes to bounty formulas, theft base odds, item prices, daily discounts, weapon rarity/drop chance, fixed combat reward plus carried salvage, room price/rest benefits, travel consumption or turn accrual. Explicit approved changes are repeat theft and wallet replenishment. Empty/protected-only targets return “Nothing left to steal” before charging a turn.

Wallet top-up is 4 per elapsed daily refill up to 15+3*level, matching the original maximum initial cash range. Trade proceeds above that limit are kept; no top-up is added while above cap. Reopen/re-encounter creates no money. Merchants without enough cash reject the selected sale rather than paying from nowhere. No occupation trade restrictions were justified/added.

Crime history still retains the latest 100 records with lifetime accumulated amount. Fine payment does not erase that retained history; an unlimited historical ledger was not added. Rook charges remain exactly 48 then 120, total 168. Road violence adds no Solace charge.

## Spawn audit — no rate changes

Controlled, seeded sampling (seed 12753), 100,000 trials per scenario; raw counts in spawn-sampling.json. These are model measurements, not human-session statistics.

| Scenario | Measurement |
|---|---|
| Fresh placements, all 12 alive, Main Street display | 79,914/100,000 had somebody present: 79.914%. Rook displayed 6,741 times; Hollis 6,620. |
| Isolated road gate, 30% roll only when eligible, two suppressed steps after encounter | 18,807/100,000 triggers: 18.807%. Quest/resume/announcement early-return gates excluded from this measurement. |
| Early-road actual roster selection (unseen preference/recent cooldown retained) | Rook 10,259/100,000; Hollis 14,731/100,000. |
| East-road actual roster selection | Rook 9,198/100,000; Hollis 11,749/100,000. |
| Dead Rook through 10,000 location moves | No resurrection. |

Rook and Hollis share the persistent named roster; there is no separate “named Rook versus random Hollis” spawn implementation. Rook's disposition prevents trading. Positions move on road advancement. Entering/re-rendering a town location chooses among people already assigned there; it does not generate fresh wallets. Road selection draws from alive eligible roster members rather than requiring their town-position value to be “road.” The dead victim is excluded; another nearby member can be displayed shortly afterward. replacementDay is recorded but no resurrection consumer exists in the supplied build. No spawn probabilities or cooldowns were changed.

## Verification

| Suite | Result |
|---|---|
| Supplied legacy | 34/34 |
| Supplied expansion | 28/28 |
| Full-module crime/inventory | 79/79; obsolete cap tests updated for approved repeated theft |
| New consolidation | 42/42 |
| Total | **183 passing automated assertions** |
| Syntax / required script references / ZIP integrity | Pass |
| Actual browser gameplay | **NOT RUN** — local Chromium executable absent |

Factory options 1–5 and leave/return pass full-module dispatcher tests. They were not typed through a real browser form. Visual layout, live character-counter rendering, animation pacing, a full human quest playthrough and all deferred feature flows remain unverified. PLAYTEST.html uses fresh v53 checklist state and marks human checks pending. Full-pack generic loot can still be unavailable/lost under legacy behavior; only existing pending weapon handling is preserved. Universal turn-around and safe equipment swap improvements await their deferred phase.

Run from the game folder with Node:

```bash
node QA_EVIDENCE/legacy-qa.cjs
node QA_EVIDENCE/expansion-qa.cjs
node QA_EVIDENCE/crime-qa.cjs
node QA_EVIDENCE/consolidation-qa.cjs
node QA_EVIDENCE/spawn-sampling.cjs
```

Older confirmed-bug reproduction files are historical v52/v52.1 evidence; use the four current suites above for this build. Progression stays FACTORY → ROAD TO SEAPORT → SEAPORT → POLISH → FREE LEVELS 1–10 DEMO.
