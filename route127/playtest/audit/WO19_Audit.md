# WO19 code audit — 2026-11-02

Base: `4d33eeee61b907c8cfde8d8ef9d7da45360fa476`. Its GitHub Pages run 41475392006 completed successfully before this audit. This preserves the WO18 patch and the newer paused-combat traveler-panel repair/cache update.

## Active source

The marketing page `route127/index.html` links to `playtest/`. The active offline original game is `route127/playtest/index.html` and the script/style sequence it actually loads. `route127/devtest/`, `route127/online-game/`, the nested `Route127_v54_Factory_Playtest/`, and older loose files under `route127/` are separate development or historical copies. The marketing page also has a separate private Worker link; its deployment/account service is outside this offline-game audit. The older route127 README describes a previous backend handoff and is not evidence that today's playtest code is unchanged.

## Confirmed defects repaired

1. Solace gate heading became an action. `renderNumberedChoices` interpreted the combined `STATE YOUR BUSINESS   (1) ...` line as choices, assigning action 1 to the heading and shifting every real answer. Numeric input and graphical dispatch correctly delivered `state your business`, but the handler had no action for it and repeated the same line. A shared gate-dialogue renderer now emits the guard prompt separately from the five executable answers. Entry, save/load/context redraw, trade/Relay/passing responses, and combat retreat all use the same renderer. Option 1 now answers that the terminal sent the player and admits them. Trade/Relay/passing remain explained responses; admission requirements are unchanged.
2. Daniel negotiation accepted only the full price-bearing label. `choiceCommand` correctly strips `— 25 BOLTS`, delivering `negotiate release`, while `r18DanielCommand` matched only `negotiate release — 25 bolts`. The handler now accepts the canonical command and the legacy full form. The 25-Bolt requirement, blueprint checks, one-time reward, saved quest identity and alternatives remain intact.

## Safe redundancy removal

The `v55.js` combat wrapper clamped/coerced the same reward field three times before delegating. It now normalizes once with equivalent handling of numeric strings, negative values, invalid strings and absent fields. The captured downstream combat handler and all other compatibility/override chains remain in place. Earlier function definitions that are captured by later wrappers were deliberately retained.

## Validation and limits

- `node tests/wo19.cjs`: gate numeric and graphical dispatch, explained refusal, save/load and combat retreat; Daniel numeric/graphical negotiation, insufficient funds and duplicate-reward protection; all 54 roads in both directions with exact movement costs; Factory numeric floor/room selection, locked basement, puzzles, supervisor/Foreman transitions, charge parts, Forge timer and boulder; Seaport investigation/liberation and unstaffed chapter terminal; Relay diagnostics/install/requirements; default-state actions in all six original Solace NPC dialogues; combat wrapper normalization/delegation.
- Road traversal isolates encounter selection/resolution to test movement and returns independently. Progression battles use a one-HP enemy fixture to test victory routing, not difficulty. The Relay canvas effect is stubbed because this is a code-level harness. Timers are advanced by fixture timestamps rather than real waits.
- Existing suites: `wo17.cjs` (intro/Skip Intro, identity, inventory/equipment, UI overlays and saves), `wo18.cjs` (all healing items through both combat controls, no healing retaliation, upgrades and quest gates), `playthrough_repairs.cjs` (branches, Relay acquisition, vendors/material quotes and casino), `input_dialogs.cjs` (quantity/name/bank/wager routing), `identity_colors.cjs` (semantic graphical colors and full names).
- No browser or mobile checks. Layout/artwork, mobile equipment visibility and the owner's originally reported nudge appearance still require owner observation. Existing diagnostic filtering is preserved; this audit does not claim the original visual symptom was reproduced.
- This is a bounded source audit and deterministic regression pass, not proof that every encounter, save-state combination or game option is bug-free. No balance changes, new features, item identity changes or save migration were introduced.
