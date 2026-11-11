# WO46 #19 — revised Red Rain surface moisture

Owner feedback: https://github.com/youngblood963/last-lantern-workshop/issues/19#issuecomment-6784557062

The approved pooling effect runs on all four Red Rain choices in Options → ENVIRONMENTAL EFFECTS and in the DEVTEST encounter. The original live rain overlay continues to work. PLAYTEST and gameplay mechanics remain unchanged.

Mouse approach, hover, click, touch, keyboard focus and focus release no longer disturb water beads, including in reduced-motion mode. The rain interaction/repulsion function was removed. Only accumulation, natural merging, gravity and runoff move the surface moisture. Lime Fog retains its separate cursor/touch/focus clearing behavior.

Rain streak lengths and thickness are multiplied by 1.7. Initial bead radii also grow 1.7×; the merged radius is capped at 6.5px to protect label clarity. Heavy-drop thresholds scale with bead size, and small runoff trails remain bounded. Particle counts, opacity, spawn rates, velocities, existing time/sky selection and button geometry are unchanged. No new rendering loop, timer, asset or dependency is introduced.

The Button Droplets ON/OFF toggle leaves normal rainfall operating in either state. The Phone width (390px) control provides a narrow single-column presentation; it does not emulate a physical mobile device. STOP, close, phase/region/scenario changes, restart and loading clean up bead state through the existing controller.

Validation: the controller suite verifies 1.7× rain dimensions with the original particle budget; gradual capped accumulation, natural merge/slide/trail, per-button isolation, normalized resize/scroll anchoring, no input-driven bead motion in normal and reduced-motion modes, toggle/playback cleanup, fog interaction, four-button live activation and unchanged player data. WO45 sky/nightfall and the 139-scenario menu regression suites are run as well.

Live desktop and 390px browser-preview findings and the deployed commit are reported separately. Physical-phone verification remains outstanding. DEVTEST is ready for owner review before any PLAYTEST promotion.
