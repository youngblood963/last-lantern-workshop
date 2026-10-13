# v51 targeted audit and patch

## Applied
- Distinct characters: Solace armorer **Mara** stays Mara; former road wanderer Mara is **Tess**. Load migration retains old road Mara's state, location, encounter, and trade focus. No other wanderers renamed.
- Rented tavern room costs **18 Bolts**, up from 12. It still restores full HP, clears death streak, and grants overnight room use. Wayne remains 5 HP per Bolt; portable healing, drinks, crafting and turn behavior remain unchanged. This is a conservative first-pass price adjustment, **not** a claim that the entire healing economy is balanced.
- Fixed wanderer BUY command matching mixed-case item names against lowercase player commands. Previously the lookup could reject legitimate purchases.

## Audit observations / pending real-browser checks
- Wanderer profiles are persisted per named wanderer, with finite trade stock; friendly vs hostile trading is gated by disposition. Equipment drops are chance-based and pending drops survive full packs.
- Mara's armory uses the existing shared equipment stock and prices, preserving existing saves. Johnny's shop is limited to supplies.
- SMALL TALK is wrapped around legacy dialogue and quest handlers; automated tests exercise representative quests, but a full browser playthrough is still required.
- Numeric factory menu routes pass mocked-DOM tests, not a real browser. Relay static animation is also unverified in a real browser.
- Clinic versus room pricing now crosses over at >90 missing HP (18 Bolts versus ceil(missing HP / 5)), without accounting for room's other benefits.
- No full dungeon or Seaport changes were made. Other economic balancing is deferred until playtest feedback.

## Verification
- Node syntax check passed for app.js, expansion.js and polish.js.
- Existing legacy regression suite: 34/34 passed.
- Expansion regression suite: 28/28 passed.
- Browser tests: NOT RUN. Use PLAYTEST.html for actual gameplay verification.
