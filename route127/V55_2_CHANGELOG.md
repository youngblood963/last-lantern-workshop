# Route 127 v55.2 — targeted integration candidate

- Seaport patrol stops now include Town Streets, Harbor Entrance, Market Area, and Docks; Kaiden is listed and interactable only at his current stop. Patrol advances on existing cumulative-turn clock and is saved under `player.flags`.
- Added Seaport stop navigation and return actions. Main Quest dialogue remains available by finding Kaiden's indicated patrol location.
- The Rusty Anchor casino uses the existing casino engine with a distinct heading. BACK / RETURN TO TOWN route back to Mia, rather than Jen; load restores Mia casino context when the Seaport casino flag is active.
- After freeing the captives, a one-time ANSI-style harbor scene appears in the terminal. The art uses monospaced text and colored CSS classes, not a PNG or literal ANSI escapes. Replay with `REPLAY HARBOR ART` through the existing quest journal, without awarding currency, XP, or items.
- Full backpack liberation reward can now be claimed from the Seaport menu once space becomes available; claim clears the pending queue.
- Existing Chapter One finale, progression, combat numbers, equipment values, and later visual evolution are unchanged.
