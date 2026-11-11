# WO46 addendum — Red Rain button droplets (#19)

The first phase is a one-button proof in Options → ENVIRONMENTAL EFFECTS. `Button Droplets` defaults ON for the first real Red Rain choice button; OFF removes only beads and leaves the original rainfall running. Lime Fog has no beads and hides the toggle. `Preview layout → Phone width (390px)` provides a narrow, single-column presentation for checking attachment and label clarity; it is not physical-device emulation.

The existing weather controller draws beads in its existing interface canvas and requestAnimationFrame loop. There are no new assets, dependencies, per-button overlays, timers or button event handlers. Buttons retain their position and normal input behavior. Beads accumulate at 1.4–2 per second, with caps of 14 for narrow buttons and 20 for wider buttons. Most form near the top edge, some on the face. Nearby beads merge by area (radius capped at 4.6px); heavier drops occasionally descend with a small translucent trail. Mouse proximity, pointer-down/touch and keyboard focus disturb nearby drops. Reduced motion shows a small static wet pattern without a new animation loop.

Positions are normalized within each button, and drawing uses current bounding rectangles relative to the weather canvas. Resizing, scrolling and narrow layout preserve attachment. The canvas clips beads to each button face, remains pointer-transparent, and uses restrained rust-colored bodies, rims and highlights. Data attributes expose bead counts for read-only DEVTEST verification; these are removed with the effect.

STOP, restart, toggle OFF, close, phase/region/encounter switch and load dispose of bead state through the existing lifecycle. Restart begins gradual accumulation again. Drawing never calls gameplay resolvers, commands, clock advancement or persistence. The private weather PRNG remains separate from gameplay rolls.

Automated tests in `tests/wo46_environment.cjs` cover accumulation limits, first-button isolation, merging, slide/trail, resize/390px/scroll anchoring, mouse/touch/focus response, pause/restart, rainfall with droplets OFF, reduced motion, fog exclusion and cleanup, alongside the existing controller tests. WO45 sky/nightfall and scenario-menu regressions are also run.

## Prototype validation and rollout

The one-button proof was deployed first as `32b2b3a` and checked in the live browser before enabling gameplay beads. Counts increased from zero to five on the first button while the other three remained dry. Clicking the wet button still invoked only its visual-preview action. The 390px layout measured 390px, with four readable 372px buttons; beads remained attached after resizing. Toggle OFF removed all bead attributes while both rainfall canvases remained. Keyboard Tab focus and scenario switching remained functional. A rain-only toggle visibility defect found on switching to fog was corrected before rollout.

Following that proof, DEVTEST gameplay enables droplets on all four choices only when the authoritative current encounter is THE RED RAIN. Preview deliberately retains its one-button comparison. A time-period change clears the current bead collection before reaccumulation; normal weather remains. Four-button accumulation and disposal are covered by the automated suite. No live rollout is made to Lime Fog or unrelated scenarios.

Physical-phone/touch visual verification remains outstanding. The 390px browser presentation is a narrow-layout check, and synthetic pointer events test touch response; neither is physical-device validation. Final deployment commit and status are reported separately. PLAYTEST remains unchanged; stop for owner review after DEVTEST publication.
