# WO21 — Yardman early Relay difficulty

Baseline: 2c7d5121909579035c6e368c3f77e61203aaec65. Forge WO20 reached Scrap Yard at level 1 with starting gear and insufficient recovery; this is a mandatory first-quest fight.

Change: Yardman level 5 → 2; normal raw damage 7–12 → 5–8; heavy raw damage 13–16 → 9–11. HP stays 55; miss chance 15%, heavy chance 20%, night multiplier 25% retained. Existing saved serviceBoss fights normalize level and damage on menu/action/retaliation without resetting current enemy HP. Other enemies, Factory bosses, base XP/reward definitions and Relay requirements unchanged.

Validation: deterministic full-engine combat, 500 seeds per level/time pair, starting Rusted Pipe/Worn Jacket, full health, no healing, levels 1 and 2. Revised: 0 defeats in 2,000 runs. Mean HP spent 33.1 day and 48.5 night. At level 1, observed revised ranges 13–56 day and 21–79 night. Baseline level-1 defeats: 2/500 day, 121/500 night. These are synthetic tests, not a browser playthrough or a guarantee for all random sequences.

Saved Yardman 41/55 HP retains 41/55 after tuning. Unrelated Foreman stats unchanged. Post-victory maintenance-yard search still awards antenna servo. Existing wo18 and playthrough_repairs suites passed. WO21 test: node tests/wo21.cjs. No browser/mobile checks.

Forge's saved character at 38 HP should heal/rest before retrying. The change makes a reasonably prepared starting character viable; it does not guarantee victory when badly injured.
