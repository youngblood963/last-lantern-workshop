# Route 127 v55.3 — Seaport Cinematic

## Changelog
- Replaced the v55.2 character-art harbor renderer with an original locally packaged 1440×900 PNG.
- Added the editable source artwork (`seaport_liberation.svg`) in Development build only.
- Kept the original intro overlay and `transmission.png` unchanged.
- Reused the existing terminal output queue, transmission-inspired reveal styling, and existing once-only `port552ArtSeen` flag.
- Added a visible replay hint to the existing quest journal (`REPLAY HARBOR ART`).
- Image fallback text is displayed on load failure.
- Responsive sizing with preserved aspect ratio; reduced-motion CSS support.
- No changes to combat, XP, Factory, quests, pets, rewards, or the v55.2 save flag.

## QA
- All 10 game JavaScript files: `node --check` PASS.
- 13 targeted VM assertions: PASS (pre-liberation block, once-only trigger, replay, asset reference, no turn/currency changes, fallback, etc.).
- Original `transmission.png`, `seaport.js`, `factory.js`, `casino.js`, and `polish.js`: SHA-256 identical to v55.2.
- Packaged PNG exists in both Development and Player ZIPs.
- Existing v55.2 ASCII art array and `BOAT` label removed from game presentation.

## Limitations
- The new original image is an atmospheric layered vector-style illustration rasterized to PNG, rather than a photorealistic painting. Image generation was unavailable.
- No browser or mobile rendering test was run; CSS layout and asset packaging verified statically.
- No full browser playthrough was performed.
- No save/load integration browser test was performed. The original `port552ArtSeen` flag is retained.
- The art triggers at the same liberation milestone as v55.2 (freeing the residents), not at the fishermen combat victory, to preserve the established quest sequence.
