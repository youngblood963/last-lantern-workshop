# Seaport casino regression investigation

November 23, 2026. DEVTEST-only verification against `efe3e93` (PR #196); no gameplay deployment or merge.

**Finding: the animated Seaport slots were not reverted. The prior non-scenario audit incorrectly exercised/reported the legacy Captain's Dice menu because its DOM test loader skipped attributed script tags.** No slot-machine implementation, artwork, odds, payout, wager limit, or other casino game needs changing.

## Correct current graphical menu

1. Blackjack
2. Slots
3. Pirate's Poker
4. Crab Racing
5. Knife Throwing
6. Return to Mia

Slots offers **Wager 10, Wager 20, Wager 50, Back**. Captain's Dice is absent from the current graphical menu.

## History and active runtime

- November 5: `f686c64` sized the three-symbol reel windows; `bca85ac` installed the transparent strip and immediate slot choices; `3b4f2eb`/`901b953` activated results and the undistorted strip. These commits contain the completed machine and animated reel presentation.
- November 5: `3e3dac6` enabled direct rebet without Play Again.
- November 6: `2f50161` promoted the approved animated Seaport slots to PLAYTEST.
- November 15: `f2501a8` retained the artwork/settlement implementation and applied the approved DEVTEST fixed 10/20/50 stakes and matching-symbol odds adjustment.
- Later PR #177 and #178 repaired **Solace** slot/racing artwork URLs. They did not restore Captain's Dice to Seaport.
- The live DEVTEST entry executes the base legacy casino definitions, then `<script id="seaport-slots-20261105">`. That script replaces `CAPTAIN'S DICE` in `R6_GAMES` with `SLOTS`, adds the native Seaport slot settlement/command adapter, and mounts the approved animated cabinet. The later `<script id="devtest-slot-stakes-and-odds">` enforces the approved fixed stakes/odds. Subsequent wager adapters preserve the slot branch.
- Actual graphical verification confirms those inline adapters execute. The retained `r6CaptainRoll` and Captain's Dice branch in old files are dormant legacy code, not the displayed Seaport menu.
- PLAYTEST's tracked entry also contains the approved inline slot implementation with a PLAYTEST environment guard and the same game-list replacement. No source-level rollback or recent merge reverting that menu was found. This task made **no PLAYTEST changes or public character transactions**. A read-only hosted PLAYTEST HTML fetch returned HTTP 403, so hosted authenticated PLAYTEST gameplay is not claimed verified here.

## Audit root cause and correction

`tests/helpers/wo33_dom.cjs` inherits the legacy PLAYTEST DOM fixture through an in-memory source transformation. That fixture's loader regex accepted only bare `<script>` or a narrowly formatted `<script src="…">`. It skipped scripts with an `id` and other attributes, including both Seaport slot adapters and the attributed DEVTEST Options script. Consequently the previous menu traversal could still find Captain's Dice in the legacy `R6_GAMES` array. That was incomplete test execution, not evidence of a runtime rollback.

The DEVTEST helper now parses all classic script opening-tag attributes, resolves external scripts as before, executes attributed inline scripts in document order, and supplies the correct `document.currentScript` URL, ID and data attributes. The protected PLAYTEST helper is unchanged. A targeted regression requires the exact current Seaport game list, the fixed slot stakes, real settlements, duplicate protection, reload persistence and return navigation. Earlier audit totals/coverage remain historical partial-loader evidence and are explicitly marked as such; they do not certify the previously omitted slot paths.

## Graphical verification

Used a separate disposable local DEVTEST save, independent of the paused regional-stress character. The unmodified approved game implementation and original repository assets were used; only local checkpoint/observation code prepared test state.

- Entered through Mia → Gamble. The menu above appeared, with Slots replacing Captain's Dice.
- Opened each other listed game and returned without wagering in those games. No changes to Blackjack, Pirate's Poker, Crab Racing or Knife Throwing.
- Opened Slots with the existing `seaport_slot_machine.png`, `seaport_slot_reel_strip.png`, and `seaport_slots_background.png` under `route127/devtest/assets/locations/slots/`.
- Observed moving reel transforms during the spin and final aligned symbols/results. Example first spin: intermediate transforms included −838.57, −750.989 and −649.005 pixels; settled SKULL/SKULL/BOLTS transforms were −1516.67, −1516.67 and −1365 pixels.
- Played ten natural-RNG desktop spins, covering 10, 20 and 50 stakes. Every observed wallet change was `previous Bolts − stake + payout`. The final desktop spin produced SCRAP/SCRAP/SCRAP, displayed **THREE BOLT! YOU WIN!**, and returned 100 on a 10-Bolt stake: wallet 4,860 → 4,950.
- Reloaded during the visual animation of a committed 20-Bolt losing round: wallet stayed 4,970 and the same round ID/reels/payout returned. Reloaded the winning round: wallet stayed 4,950, same round ID and 100 payout; no second award.
- Navigated Slots → casino → Mia on desktop and mobile. The correct Mia menu returned.
- At 390×844, played another natural 20-Bolt spin (wallet 4,950 → 4,930, payout zero). Cabinet/reels, result and all four controls fit the viewport and remained readable. The center symbols matched SCRAP/RAT/SCRAP (Bolt/Anchor/Bolt), and the result showed NO MATCH.
- Expedition turns remained **30 throughout**. Gambling did not spend travel turns. This is turn-free transaction verification, not a separate zero-turn Waiting for Dawn test.

`natural-spins-and-reload.json` retains the desktop spin/reload observations. Screenshots show the desktop winning result and mobile settled result. Browser gameplay is separate from the deterministic supplemental test below.

## Targeted regression results

`node route127/devtest/tests/seaport-casino-runtime.cjs` — PASS:

- Exact active Seaport game list, with Slots and no Captain's Dice.
- Only 10/20/50 slot choices and wagers; rejects 1/5/25/100/1000.
- Native winning settlement at each permitted stake (controlled RNG in the isolated Node test only).
- A settled round cannot be deducted/paid a second time through the native wager handler.
- Nine save/load checks preserve wallet, turns, round ID, reels and payout.
- Slots → casino → Mia restores the correct parents without spending turns.

Also passed with the corrected loader: `wo40_seaport.cjs`, `non-scenario-panels.cjs`, `non-scenario-requirements.cjs`, `wo55_vendor_sales.cjs`; syntax and diff checks. No full playthrough or expanded casino audit.

No game repair is required. This PR repairs the audit harness, adds the targeted regression/evidence and corrects the earlier report. The regional stress test resumes from its separate preserved character after this investigation.
