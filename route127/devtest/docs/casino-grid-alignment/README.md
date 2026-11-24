# Casino grid and alignment repair — Phase 1

Both DEVTEST and PLAYTEST use the same visual repair. Casino rules, wager options, odds, payouts and journal transactions are unchanged.

## Roulette

The desktop betting felt now extends from its existing left boundary into the unused area on the right of the scene. It uses the available scene height and larger text rather than trying to fit the painted table. The wheel's parent plane, holder, pockets, spindle, ball/orbit and animation code are unchanged. Before/after real-browser measurements agree exactly for the approved wheel assembly on desktop and at 390px mobile width. The desktop grid's left edge remains beyond the spin area's right edge.

Mobile uses a full-width portrait grid below the artwork: zero, twelve rows of three numbers, the three 2:1 column bets, then outside bets. Every cell has a minimum 44px border-box height. The existing content scroller keeps the six action buttons accessible. Number and grouped-bet badges follow actual cell positions. Desktop roulette now exposes its betting buttons as interactive controls rather than descendants of an ARIA image.

Real browser checks:

- All 49 desktop targets clicked: 37 numbers, three columns and nine outside bets; total 490 Bolts at Chip 10, then Clear Bets restored zero.
- Authoritative numbering: desktop 3/2/1 across the three horizontal rows; mobile 1/2/3 across each ascending row. 18 red, 18 black and green zero.
- No clipped button text at desktop 1363px or mobile 390px. Black, 19–36 and all three 2:1 labels readable.
- Mobile native clicks on 36, Black, 19–36 and Column 3 produced the correct four bets / 40 Bolts.
- Same-state desktop wheel holder: x371.5078, y304.7360, width269.6563, height142.7936 CSS px, identical before/after.
- Same-state mobile wheel holder: x30.6172, y342.8442, width107.8750, height57.1240 CSS px, identical before/after.
- No changes to the approved roulette wheel/pockets/ball assembly code: protected block SHA-256 `cb828273dbd02c5cfab5cf0666380a94e04ad68a9b4e046c306b7320364ff86c`.

## Big Six

Only the rotating disc's `top` changes, from 13% to 9.7%: approximately 31 artwork pixels upward. Its center now agrees with the supplied stationary backing (approximately y450 on the 941px artwork). Width 43%, height 76.4%, left 28.5%, arrow geometry, rotation origin, target angle and 4.2-second animation remain unchanged. Desktop and mobile start/settled views checked; native spins complete normally. A mobile in-flight matrix (0.609831, 0.792531, -0.792531, 0.609831) and settled matrix (0.5, 0.866025, -0.866025, 0.5) retained the same top/size/horizontal anchor. The protected-source regression verifies the entire Big Six builder is identical after normalizing this one top-coordinate change.

## Checks

- `node route127/devtest/tests/casino-visual-protection.cjs` — PASS both entries.
- `node route127/devtest/tests/motel-casino.cjs` — PASS all five games, native dispatch/returns, all 37 roulette outcomes/bet families, payout/reload/commit guards.
- `ROUTE127_RELEASE=1 node route127/devtest/tests/motel-casino.cjs` — PASS.

Screenshots: [roulette desktop](roulette-desktop.jpg), [roulette mobile](roulette-mobile.jpg), [Big Six desktop](big-six-desktop.jpg), [Big Six mobile](big-six-mobile.jpg). Mobile uses a real browser with a phone-sized viewport, not a physical handset.

This phase is published independently of the Central region stress test; it contains no unrelated DEVTEST content.

[Completed mobile spin](big-six-mobile-spin.jpg).
