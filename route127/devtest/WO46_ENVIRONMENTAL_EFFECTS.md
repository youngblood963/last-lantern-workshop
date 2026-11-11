# WO46 — Environmental animation and interactive weather

DEVTEST-only implementation in `runtime/environmental_effects_wo46.js`. Shared art, scenario definitions, gameplay calculations and PLAYTEST are unchanged.

## Controller and layers

`Route127Environment.Controller.register(name, {create, draw})` permits future effect renderers without rewriting lifecycle or input handling. A controller owns an atmospheric scenery tint, a scenery canvas, and an interface canvas. All three have `pointer-events:none` and `aria-hidden=true`. The interface canvas sits above the graphical buttons. The tint and scenery canvas remain confined to the art panel. Normal scene images and WO45 sky layers are retained.

Rain uses at most 110 scenery streaks and 85 interface streaks with varying depth, length, velocity, diagonal motion and opacity. Small-screen scenery density is reduced. Irregular lightning is restricted to scenery, starts no earlier than nine seconds, and uses a low-opacity illumination with at least eleven seconds between subsequent events. Reduced-motion mode uses a static weather frame and no lightning.

Fog uses fourteen overlapping soft radial wisps per canvas, drifting at different speeds and depths. Pointer proximity within 110 pixels of a button produces a soft, feathered 150-pixel clearing and gently displaces nearby wisps. Touch produces the same clearing, returning after 1.6 seconds. Keyboard focus clears around the button center. Mouse/touch focus is distinguished from keyboard focus so touch does not leave a permanent clearing. No event handler prevents default actions or captures gameplay input.

Each controller owns one requestAnimationFrame loop, bounded pixel density, a ResizeObserver and its listeners. Pause, hidden-page suspension, reduced-motion handling, restart, stop and replacement all use the same lifecycle. Stop cancels the pending frame, removes all weather nodes/classes, disconnects the observer and removes listeners. A WeakMap enforces one owner per presentation root. A private PRNG prevents animation from consuming gameplay random rolls.

## Registry integration

The existing registry supplies the authoritative encounter objects, labels and classifications. Live effects activate only for the matching current encounter object while `stage === 'encounter'`. Red Rain retains GLOBAL classification; Lime Fog retains LOWLANDS regional classification. Options, unrelated menus/scenarios, combat and loading clear the live weather. Returning to an unresolved matching encounter restores weather. There are no copied scenario resolvers or changes to outcomes, damage, rewards, encounter pools or saved state.

## Developer preview

Options → ENVIRONMENTAL EFFECTS opens the existing-style DEVTEST modal. Controls select the encounter, any of the seven scenery regions, and DAWN/DAY/DUSK/NIGHT. PLAY, PAUSE, RESTART and STOP operate only on this presentation. STOP removes all weather layers; the regional image remains. Close also disposes of the controller.

The preview uses the existing registry's exact four choice labels for each encounter, rendered as graphical menu buttons. Clicking them exercises weather/input behavior and updates preview status only; no resolver, command, reward, combat, turn, clock, HP or save operation runs. Preview region overrides do not change real encounter classifications.

## Automated validation

`node route127/devtest/tests/wo46_environment.cjs` passes:

- Both authoritative registry records, classifications and exact choice labels.
- Both effects across four time periods; canvas drawing.
- Mouse proximity, touch clearing/expiry, keyboard focus and release.
- Play/pause/restart/stop, hidden-page suspension and reduced motion.
- Replacement ownership and sixty repeated entry/cleanup cycles with no leftover frames, nodes or listeners.
- Player-state and resolver-function identity preservation.
- Live encounter identification and unrelated menu exclusion.

WO45 sky tests, WO45 nightfall tests and the existing 139-scenario menu suite pass. Live browser findings and deployment commit are reported separately after publication. Synthetic input tests cover touch behavior; a physical mobile device is not emulated by those tests.

## Owner testing

Check rain visibility over all four buttons, fog clearing as the cursor approaches, touch and Tab focus, both effects against all sky periods, and STOP/close cleanup. Existing image-alpha defects documented in WO45 are outside this animation change. Stop at DEVTEST; PLAYTEST promotion requires owner approval.
