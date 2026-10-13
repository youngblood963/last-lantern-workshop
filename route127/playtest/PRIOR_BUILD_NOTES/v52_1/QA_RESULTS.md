# Route 127 v52.1 — targeted stability audit

**Result: audited playtest candidate. Not declared stable.**

## Evidence

| Verification | Result | What it establishes |
|---|---|---|
| Supplied legacy automated suite | 34/34 pass | Crafting, timers, saves, capacity, representative combat/inventory regressions |
| Supplied expansion automated suite | 28/28 pass | Equipment, relative threats, trade/helper behavior, representative quests, factory dispatch |
| New full-module crime/inventory suite | 79/79 pass | Actual app → casino → polish → expansion → crime integration with controlled state and mocked DOM |
| Original defect reproductions | Six fail on v52; six pass after repairs | Direct before/after evidence for the principal confirmed bugs |
| JavaScript syntax | Five scripts pass | Parsing only |
| ZIP integrity | Pass | Deliverable archive is readable |
| Actual browser gameplay | **Not run** | No browser keyboard, pixel/layout, or animation certification |

The older suites intentionally exercise their original module boundary and do not load crime.js. Their passing results alone are insufficient for v52. The new crime suite loads the full production script sequence and exercises the crime and shared-inventory hooks. All outputs and reproducible scripts are in QA_EVIDENCE. Tests stub narrative output, delays, context redraws and the DOM; they do not simulate a complete human playthrough.

## Confirmed bugs and repairs

| Problem in supplied v52 | Evidence/fix |
|---|---|
| First purchase initializes carried inventory after the stock deduction, then deducts again | Controlled stock of three falls to one. v52.1 relinks canonical records before purchase; exactly two remain. |
| Sale pays player without transferring goods or deducting victim cash | v52.1 conserves both goods and Bolts. Exact item matching also avoids selling a similarly named consumable. Lack of NPC funds rejects payment rather than creating currency. |
| Assault charge appears even when no turn remains to start combat | Charge now follows successful combat creation. |
| Uppercase combat victim fails mixed-case murder check | Canonical name and actual combat source determine victim/action; town murder recorded once. |
| Sticky town target can criminalize a later road kill | Crime follows the defeated combat, including saved location. Old sticky flags are ignored and cleared during combat handling. |
| Trade absorbs INSPECT/SMALL TALK/FIGHT | Existing encounter actions leave the trade parser and reach their handlers. |

Additional targeted checks found and repaired missing crime.js in QA_MODE, WANTED hidden inside early-level controls, inaccessible fine instructions through SMALL TALK, stale/incorrect victim focus, and named-road-theft mismatch. Essential residents cannot be attacked or robbed through the wanderer system.

## Inventory and persistence

The stock menu uses references to persisted carried items; quantity changes happen once. Purchases credit victim cash. Confirmed sales move one player item into victim holdings and debit victim cash. Theft and one-time combat salvage consume remaining holdings. The existing fixed combat reward is explicitly separate from carried cash and remains intact; tests verify each is awarded once. Equipment still uses the original 45% drop chance and fixed pending weapon reward; full-pack pending weapons survive save/load and cannot be claimed from a living victim.

Save/load relinks references after JSON serialization. v51-compatible fixtures omit crime/inventory additions while preserving saved stock, quests and crafting flags. Existing v52 snapshots with inconsistent stock quantities reconcile to the smaller remaining count to prevent resurrection. The old bug can already have lost stock; there is no reliable transaction history to reconstruct that loss. No real external v51 player save was supplied, so compatibility is established by fixtures and retained identifiers, not a human save validation claim.

## Crime and gameplay

Caught failed theft has the victim as its witness. In Solace it records the correct victim and establishment; on a road it raises suspicion/reacts without a bounty. There is no separate bystander visibility simulation in v52. Successful unseen theft remains unreported. Town fights keep confirmation and one-turn entry; theft keeps one turn per attempt, once per encounter; redraw/load cannot reset the attempt. Return encounters permit another attempt without regenerating holdings.

Existing charges are unchanged: attempted theft max(10, level × 8), assault max(20, level × 12), murder max(50, level × 30). Tim removes active bounty/active entries only; lifetime totals and retained history survive payment and reload. Existing history retention is the latest 100 entries, not an unlimited lifetime ledger. The Level 5 wanted-board text announces unlocked bounty hunting while explicitly saying contracts are not yet available; no contracts or additional unlock notification were added.

Tim/Murphy hand-ins, Wayne house lead, existing crafting, main-quest flags and town death are covered by representative full-module tests. Factory workshop numbers 1–5, records numbers 1–4 and leaving/returning pass the dispatcher. These are not actual browser form/keyboard tests.

## Browser limits and remaining checks

A direct Playwright launch probe found no Chromium executable. Actual browser tests were not run. WANTED visibility/style has a mocked DOM contract check only. Human verification is still required for keyboard numbers, rendered/paced menus, full quest routes, turn-refill timing, evolution appearance, death presentation and animation. Use PLAYTEST.html. No new contracts or broader witness system is claimed. No unrelated development was performed.

## Run tests

From the game folder with Node available:

```bash
node QA_EVIDENCE/legacy-qa.cjs
node QA_EVIDENCE/expansion-qa.cjs
node QA_EVIDENCE/crime-qa.cjs
node QA_EVIDENCE/confirmed-bugs-qa.cjs
```

Scripts save JSON evidence beside themselves. QA_GAME_DIR can point to a different game folder for before/after runs. Original-build comparison is recorded in confirmed-bugs-before.json; fixed results are in confirmed-bugs-after.json.
