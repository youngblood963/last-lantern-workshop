# Route 127 — Demo Combat Difficulty / HP Scaling (owner note, 2026-11-06)

**Status: OPEN — design and balancing follow-up. Not implemented by the DEVTEST → PLAYTEST presentation promotion.**

Owner playtested at level 8 and found many regular combat encounters too easy, with enemy HP staying low. Source review of `route127/playtest/app.js` showed that `startCombat(spec)` initializes HP directly from `spec.hp`; some encounter specs are fixed, although selected special enemies derive HP from player level. Player maximum HP already has its own milestone scaling.

## Approved balancing direction

- Regular roadside enemies should provide **some challenge** as the player levels; avoid trivial fights at level 8 in the Factory-bound demo corridor.
- Do **not** scale all enemies exactly to the player. The player should feel genuinely stronger when revisiting earlier territory; rats and weaker opponents should remain weaker.
- Preserve different threat tiers for common opponents, elites, bosses, and regions. Factory-bound threats should generally be tougher than early Solace-road enemies.
- Avoid HP-sponge combat: balance intended rounds-to-kill against equipped weapon damage, armor, healing, multi-enemy encounters, retaliation and XP progression.
- Keep unique bosses and scripted mechanics under explicit control, rather than blindly multiplying their HP.
- Preserve save compatibility, Classic BBS, existing enemy identity, and reward logic. Audit encounters and test level 1, 5, 8, 10 and higher with appropriately-tiered gear.
- **Do not silently change gameplay scaling as part of the visual promotion**. Implement and playtest as a separate balancing work order before demo release.

Owner's guiding principle: if combat presents no challenge, weapons, equipment, healing and tactical choices lose their meaning.
