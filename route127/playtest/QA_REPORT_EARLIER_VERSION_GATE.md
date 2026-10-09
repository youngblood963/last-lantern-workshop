# Route 127 v33 — Deployed QA report

Test date: October 8, 2026 (America/New_York).

Target: https://lastlanternworkshop.com/route127/playtest/

**Stopped at the required version gate.** The browser page title displayed `Route 127 — Playtest v32` on initial navigation and after one refresh. No gameplay commands were entered. No deployed files were modified. This verifies the displayed identification only; the underlying build was not independently identified.

## Version check

| Test | Result | Evidence |
|---|---|---|
| Deployed game identifies itself as v33 after at most one refresh | FAIL | `Route 127 — Playtest v32` both before and after refresh |

## Prioritized confirmed failure

**HIGH — V33-DEPLOY-01: deployed page identifies itself as v32.** Blocks the requested v33 QA session; this is a deployment/version-identification failure, not a confirmed gameplay progression bug.

- Location/state: opening title screen at the target URL; command field visible.
- Displayed text: `ROUTE 127 // LOCAL NODE`, `NO SIGNAL`, opening Route 127 title. Browser title: `Route 127 — Playtest v32`.
- Commands: none. Browser action: refresh once.
- Expected: displayed v33 identification.
- Actual: v32 identification persists after refresh.
- Reproduction: open target URL; inspect browser title; refresh once; inspect title again.
- Console errors: not inspected; no console error is established for this failure.
- Recommended fix: verify the intended v33 package is published to this exact path, ensure the HTML version label and loaded asset versions agree, and check deployment/cache behavior. The cause is unconfirmed; do not assume this is only a stale label.

No CRITICAL, MEDIUM, or LOW gameplay bugs were confirmed because testing stopped before gameplay. No usability conclusions were drawn.

## Complete test matrix

Every UNTESTED item below was blocked by the required version gate. No feature is considered working based on code or a previous version's results.

| Area | Test | Result |
|---|---|---|
| Menus and hotkeys | Numbered context actions | UNTESTED |
| Menus and hotkeys | Every displayed numbered choice | UNTESTED |
| Menus and hotkeys | S Status | UNTESTED |
| Menus and hotkeys | I Inventory | UNTESTED |
| Menus and hotkeys | M Map/GPS | UNTESTED |
| Menus and hotkeys | Q Quests | UNTESTED |
| Menus and hotkeys | V Save | UNTESTED |
| Menus and hotkeys | H Help | UNTESTED |
| Menus and hotkeys | B Back | UNTESTED |
| Menus and hotkeys | Conflicting hotkeys | UNTESTED |
| Menus and hotkeys | New encounter numbered choices | UNTESTED |
| Menus and hotkeys | Billboard | UNTESTED |
| Menus and hotkeys | Carousel horse | UNTESTED |
| Menus and hotkeys | Wheelbarrow and other encounters | UNTESTED |
| Menus and hotkeys | Unsupported commands preserve encounter | UNTESTED |
| Menus and hotkeys | Combat choices after attacks/healing/items | UNTESTED |
| Menus and hotkeys | Console trim()/hotkeyLine() errors | UNTESTED |
| Menus and hotkeys | Duplicate menu instructions | UNTESTED |
| Travel and gates | Introduction | UNTESTED |
| Travel and gates | House to Solace | UNTESTED |
| Travel and gates | Continuous road-turn numbering | UNTESTED |
| Travel and gates | Counter continues leaving Solace | UNTESTED |
| Travel and gates | Both town gates | UNTESTED |
| Travel and gates | Previously blocked gate initiates travel | UNTESTED |
| Travel and gates | Gate destinations | UNTESTED |
| Travel and gates | Reverse travel toward house | UNTESTED |
| Travel and gates | Fork in both directions | UNTESTED |
| Travel and gates | No additional fork-entry turn | UNTESTED |
| Travel and gates | GPS accuracy | UNTESTED |
| Travel and gates | Road counter save/load | UNTESTED |
| Travel and gates | 24-hour road counter reset | UNTESTED |
| Relay quest | Tim/Jen/Murphy dialogue | UNTESTED |
| Relay quest | Unlock and visit station | UNTESTED |
| Relay quest | All four components | UNTESTED |
| Relay quest | Fourth component obtainable | UNTESTED |
| Relay quest | Required gate/route | UNTESTED |
| Relay quest | Return to station | UNTESTED |
| Relay quest | Install all four components | UNTESTED |
| Relay quest | Quest completion | UNTESTED |
| Relay quest | Quest progress save/load | UNTESTED |
| Relay quest | Short scrambled-line effect | UNTESTED |
| Death and recovery | YOU HAVE FALLEN | UNTESTED |
| Death and recovery | Rescue narrative | UNTESTED |
| Death and recovery | Last settlement respawn | UNTESTED |
| Death and recovery | Approximately 50% HP | UNTESTED |
| Death and recovery | Return travel cost plus two | UNTESTED |
| Death and recovery | Equipment/inventory preservation | UNTESTED |
| Death and recovery | Quest item/progress preservation | UNTESTED |
| Death and recovery | Insufficient turns handling | UNTESTED |
| Death and recovery | Free fast-travel exploit check | UNTESTED |
| Town and NPCs | Purchases/services | UNTESTED |
| Town and NPCs | Advertised numbered actions | UNTESTED |
| Town and NPCs | Full first greetings | UNTESTED |
| Town and NPCs | Short repeat greetings | UNTESTED |
| Town and NPCs | Wandering NPC locations | UNTESTED |
| Town and NPCs | Wandering NPC dialogue | UNTESTED |
| Town and NPCs | Correct Back destination | UNTESTED |
| Town and NPCs | Bulletin board | UNTESTED |
| Gameplay regression | Combat/enemy damage | UNTESTED |
| Gameplay regression | Healing/consumables | UNTESTED |
| Gameplay regression | Inventory/equipment | UNTESTED |
| Gameplay regression | Random encounters/discoveries | UNTESTED |
| Gameplay regression | Bank deposits/withdrawals | UNTESTED |
| Gameplay regression | Save/load state | UNTESTED |
| Gameplay regression | Quest tracking | UNTESTED |
| Gameplay regression | Map/GPS | UNTESTED |
| Gameplay regression | Daily turns | UNTESTED |
| Gameplay regression | Reverse travel | UNTESTED |
| Gameplay regression | Crashes/softlocks | UNTESTED |
| Gameplay regression | Turn deductions | UNTESTED |
| Gameplay regression | Duplicated rewards | UNTESTED |

## Continuation

Publish or correct the v33 deployment, then repeat the version check before gameplay. Prioritize both gates and obtaining/installing all four Relay components. The Relay quest has **not passed**. Health, inventory, equipment, Bolts, turns, location, and quest save/load persistence remain unverified in v33.

