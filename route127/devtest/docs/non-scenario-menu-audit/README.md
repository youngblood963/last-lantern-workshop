# DEVTEST non-scenario interaction audit

Reviewed against main `c1581ab` on November 23, 2026. DEVTEST changes only; no merge or deployment performed.

| Metric | Result |
|---|---:|
| Distinct published menu variants exercised | 236 |
| Conditional menu states exercised | 1,398 |
| Distinct stage/location/command combinations | 1,115 |
| Root/profile/stage/location/action combinations | 4,353 |
| Actual terminal or graphical dispatch executions | 13,403 |
| Nested state paths exercised | 1,299 |
| Invalid displayed-command failures found | 0 |
| Pure command-echo failures found | 0 |
| Redundant visible dismiss-control locations repaired | 3 |
| Requirement-feedback/compatibility families repaired | 7 |
| Remaining failures in tested paths | 0 |

These are executable finite-path coverage counts, not a claim that every possible quest combination, random outcome, item instance, or DEVTEST editor has been exhaustively tested. Variants are distinct stage/location/published-command lists; conditional states additionally distinguish selected items, transaction modes, player profiles, and tested quest gates. Commands exposed only through terminal bindings are included in action counts. Inventory quantity changes and repeated sale/storage subsets are deduplicated during traversal.

## Scope and method

The matrix uses 36 isolated entry states and three profiles: empty pack/zero Bolts, supplied pack/sufficient Bolts, and a genuinely full pack. It loads the actual DEVTEST HTML, resolves its base URL, executes its actual script chain, follows offered nested commands up to eight steps, and invokes real `handleCommand` and `GraphicalUI.dispatch` handlers. Public network access is disabled. Each action replays its path from a reset disposable character. No owner playthrough, character leveling, or public service calls are used.

Covered entry states include Solace and submenus; locked/authorized/cleared Factory and dungeon rooms; locked/liberated/staffed Seaport; shops and sales; banks and storage; room actions; inventory, Character and Journal; NPC work/conversation branches; bounty boards; gambling and exhibition wagering; recruitment and service assignment; companion and horse menus; crafting/collection and workbench tabs; House, Relay, Station Nine, depot, Ash, Silas, Caleb and Miles; town exits and connected road navigation; and Waiting for Dawn. `menu-coverage.json` lists exercised menu variants and example paths. `action-coverage.csv` lists actual executed commands and pathways.

The primary matrix initially reported 22 apparent stranded arena actions because the offline DOM suppresses interval timers. The corrected harness runs the real exhibition callbacks until the existing finish/menu restoration executes. Replacing that arena segment yields the counts above: all pass. Arena behavior, damage, odds and rewards were not changed. The corrected arena run covers 20 states/126 executions. After final transaction-feedback changes, 287 crafting/trader states and 3,103 executions were rerun successfully. An additional graphics-active run covers 58 states/648 executions, including the repaired room chest path. Supplemental runs overlap the primary coverage and are not added to its totals.

## Repairs and shared causes

| Cause | Repair and verified behavior |
|---|---|
| Failed wandering-trader purchases dropped the stock view and gave only generic currency feedback | Preserve the native buy transaction, compare current stock, append actual price/current Bolts on failure, and republish Browse Wares. Exact-funds purchases still transfer one item at the native price. |
| Native crafting gave a generic requirement failure | One shared recipe-material map feeds display and validation. Report every shortage with required/available quantities, including quest inputs and Bolts, without consuming anything. |
| Active batch crafting bypassed native crafting validation and retained its own generic failure | Reuse that material map for batch validation; report the actual quantity shortages and preserve the quantity menu. Invalid quantities get a numeric range. Costs, eligibility, deadlines and success chances are unchanged. |
| Murphy blueprint purchase feedback omitted cost/balance | Display the existing computed price and current Bolts. |
| Modification blueprint purchase feedback omitted available currency/material count | Wrap the native purchase and append its actual required/available amount on failure. |
| Staffed Seaport store/clinic purchase failures omitted balances | Read the native staffing-dependent price and append required/available Bolts. Native stock and service gates remain authoritative. |
| Approved canonical-water helper existed in DEVTEST source but was not loaded by the legacy base-relative script URL | Bind only the approved material count/consumption helpers in DEVTEST. `Clean Water` consumables and legacy `Water` materials satisfy a `Clean Water` requirement; similarly named quest/tool objects do not. Actual equipped modification installation succeeds and consumes the proper items with either approved representation. No recipes or accepted-name lists are rewritten. |
| Shared numeric-entry constructor opened an impossible form when maximum was zero | Invoke its existing cancellation path, clear pending entry, restore the parent, and explain minimum/available quantity. Valid forms keep native validation/submission. |
| Room lacked ownership of redraws | Restore the native room menu after Rest, Look Around, and graphical chest opening/closing. Previously a generic redraw could reset the location to Main Street underneath the chest. All four room actions and turns remain intact. |

Native aliases such as Small Talk/Talk plus NPC names already resolve correctly. Historical WO38/39/40 expectations were updated for current approved menu ownership and the single DEVTEST local save. These stale test expectations are not counted as game defects.

## Duplicate navigation findings

Three visible locations shared two redundant-constructor patterns:

- **Options:** header X (`Close options`) and body Close both called the same panel close operation. Keep the accessible header X.
- **Traveler Menu:** the same duplicate panel Close/X pair. Keep header X.
- **Focused numeric/text entry:** header X and Cancel both invoked the entry cancellation operation. Keep the clearly labelled Cancel; remove the redundant header button from the DOM.

The remaining controls invoke the original callbacks. Tests verify parent restoration and unchanged turns. The traversal compares navigation outcomes, flags, travel state and turn counts; no additional identical-destination navigation pairs were found in its covered menus. Distinct transaction Cancel, previous-menu Back, and building/town exits are preserved.

## Regression and visual verification

Passed suites:

- `non-scenario-menus.cjs` matrix and targeted reruns described above.
- `non-scenario-panels.cjs`: real Backpack use/drop cancellation, Character/Journal, Map open/close, Traveler Menu/Options feedback and dismiss control, room/chest return, positive/zero numeric entry, Craft/Upgrade/Modify tab navigation.
- `non-scenario-requirements.cjs`: absent/partial/sufficient crafting and trader transactions; material blueprint purchase; canonical/legacy water quantities and actual equipment modification installation; no consumption after failed requirements.
- `wo38_rusty_lantern.cjs`, `wo39_solace.cjs`, `wo40_seaport.cjs`.
- `wo54_shop_comparison.cjs`, `wo55_vendor_sales.cjs`, `wo67_vendor_clicks.cjs`.
- `camp-community.cjs`, `waiting_for_dawn.cjs`, `local-character-isolation.cjs`.
- `encounter-interaction-requirements.cjs`: targeted shared-helper regression, including Collector and Hound.
- JavaScript syntax checks and `git diff --check`.

Waiting for Dawn still has exactly News, Discussions, Feedback and Log Out. Its existing regression verifies the ticking persisted deadline, refresh, read-only discussion/stale-form gate, local feedback, saved logout/Continue and scheduled refill recovery. No public backend changes.

Representative browser verification used the real patched DEVTEST interface with disposable local preview state: desktop failed trader purchase preserves readable feedback and stock actions; Options has one accessible close action and returns to town; the 390×844 mobile custom bank form has one Cancel and returns to deposit choices with its 25 Bolts intact; room chest opens and closes to the room with all four actions and 100 turns. Screenshots are included here. Only screenshot files are cropped/compressed; no game artwork or CSS rendering is changed.

## Limits and remaining review

No unresolved defect remains in the executed paths. The matrix checks visible outcomes, control availability and dispatch parity; specialized suites assert selected transactions and navigation semantics. This does not prove every narrative reward or every hidden quest flag combination. It does not exhaust all casino RNG outcomes, all generated gear instances, arbitrary corrupt/legacy save states, every visual-editor tool, or hardware-specific browser behavior. Combat/storyline playthrough and public PLAYTEST/backend verification were outside this assignment. The artwork and existing regional/encounter rendering were not modified.

## Reproduce

```sh
MENU_DEPTH=8 MENU_ASSERT=1 MENU_REPORT=/tmp/menu-audit.json node route127/devtest/tests/non-scenario-menus.cjs
node route127/devtest/tests/non-scenario-panels.cjs
node route127/devtest/tests/non-scenario-requirements.cjs
MENU_GRAPHICS=1 MENU_ROOT=solace,factory-authorized,seaport MENU_PROFILE=supplied MENU_DEPTH=4 MENU_ASSERT=1 node route127/devtest/tests/non-scenario-menus.cjs
```

The full matrix is a targeted interaction traversal, not a full storyline playthrough. `MENU_ROOT`, `MENU_PROFILE`, `MENU_DEPTH`, `MENU_REPORT`, `MENU_PROGRESS`, and `MENU_ISSUES` allow focused reproduction. `targeted-results.json` retains supplemental run summaries.
