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
