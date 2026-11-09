# WO38 Rusty Lantern pilot

Remote baseline `221fc1a`. The pilot builds on local WO34/WO35 commit `cbd4e1c`. No remote update or deployment was made.

## Action contract

The rows below are in display order. The pilot keeps the baseline command sequence and dispatch. Classic retains its existing display formatting, which can print Talk Jen where the registered command is `small talk jen`. Jen's name still passes through the existing identity formatting.

| Screen | Label and registered command | Gate and destination or effect |
|---|---|---|
| Bar | Buy Drinks → `buy drinks` | Opens the existing drinks menu. Drink prices, healing and Back use the existing handlers. |
| Bar | Gamble → `gamble` | Opens the existing casino menu. |
| Bar | Your Room → `your room` or Buy Room — 2000 Bolts → `buy room` | Owned or affordable, respectively. Purchase and charge remain in the existing handler. The owned-room choice routes through the existing `room` handler without another charge. |
| Bar | Small Talk Jen → `small talk jen` | Existing small-talk line, then Jen dialogue. |
| Bar | Talk to [visitor] → `talk to [name]` | Current town visitor only. Existing Wanderer handler. |
| Bar | Sell Items → `sell items` | Existing sale flow. |
| Bar | Return to Town → `return to town` | Solace hub. |
| Jen | Ask About Work → `ask about work` | Jen work screen. Existing pending quest offer guard applies. |
| Jen | Ask Rumors → `ask rumors` | Existing rumor handler. |
| Jen | Back → `back` | Rusty Lantern bar. Existing B binding. |
| Work | Deliver Jen's Supply Crate → `deliver jen's supply crate` or Deliver Runner's Token → `deliver runner's token` | Recovered or rescued quest state, respectively. Existing hand-in handlers. |
| Work | Ask About Missing Shipment → `ask about missing shipment` | Existing quest dialogue. |
| Work | Settle Unpaid Tab → `settle unpaid tab` | Active unpaid tab. |
| Work | Ask About Unpaid Tab → `ask about unpaid tab` | Existing quest dialogue. |
| Work | Tell Jen About the Familiar Face → `tell jen about the familiar face` | Active lead with Vale evidence. |
| Work | A Familiar Face → `a familiar face` | Existing quest dialogue. |
| Work | Ask About Daniel → `ask about daniel` | Clara met and Daniel quest incomplete. |
| Work | Ask About Wasteland Stew → `ask about wasteland stew` | Existing food readiness check. |
| Work | Deliver Jen Letter → `deliver jen letter` | Existing courier eligibility check. |
| Work | Ask About Relay Station → `ask about relay station` | Relay locked and quest in ask state. |
| Work | Back to Jen → `back to jen` | Jen dialogue. |

## Ownership and verification

- `index.html` switches the shared Jen registration to the DEVTEST pilot and loads `menu_model.js` first. The three changed runtime registrations use `v=wo38`.
- `runtime/jen_work_menu.js` deletes the global narrative/output matching rewrite. Explicit bar and Jen entry points publish choices after their existing story effects and introduction. The Jen small-talk bridge replaces the captured legacy dialogue call. Other NPCs delegate to the previous handlers. Jen's intro text is mirrored locally because shared `npcTalk` has no separate menu hook.
- `runtime/menu_model.js` supplies stable action IDs, filters gates, removes repeated commands and publishes a single designated exit last. The engine registers Classic bindings from this publication. `runtime/menu_authority.js` projects metadata onto the same live bindings for Graphical and keeps existing dispatch and other providers. Metadata is scoped to the active binding objects and has no save representation.
- `tests/wo38_rusty_lantern.cjs` boots the real DEVTEST script list in the existing DOM harness. It checks Classic and Graphical choice sequences and keys, terminal menu order, Graphical dispatch, numeric and letter input, reentry and Back destinations, room cost, no charge through Graphical and Classic owned-room selections, drink cost and healing, quest gates, and a synthetic save/load round trip.
- Presentation, WO33 scaling and combat regression suites passed. The known integrity price assertion and road-balance undefined spec still fail as documented in WO35. No expectations changed.
- Chromium failed before navigation in `process_singleton_posix.cc:297` with `socket() failed: Operation not permitted`. Actual browser parity, old player saves and mobile layout remain unverified.

## Manual browser gate

From a full checkout of the local commit, run `python -m http.server 8765 --bind 127.0.0.1` at the repository root. Open `http://127.0.0.1:8765/route127/devtest/index.html` in a disposable profile. In Solace choose Shops, then The Rusty Lantern. Verify each action sequence above and one last exit in Classic and Graphical at desktop and mobile widths. Use the displayed keys and Graphical buttons to open drinks, buy a beer while injured, return, enter Jen dialogue and work, and back out through both destinations. Test the room purchase at 2000 Bolts in a spare slot. After purchase, select Your Room in both modes and confirm there is no second charge. Try selling from the bar and leave and reenter via Solace Shops. Repeat with a copied older slot in the disposable profile. Check console errors and confirm Network shows DEVTEST's `menu_model.js?v=wo38` and `jen_work_menu.js?v=wo38-room` without the shared Jen script.
