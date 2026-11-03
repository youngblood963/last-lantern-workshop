/* Route 127 — Rusty Lantern interior artwork (presentation only).
 * Install after all existing casino graphics scripts.
 * Applies ONLY to Jen's bar, drinks and bar conversation screens.
 * Does not modify commands, payouts, menus, gameplay, or casino art.
 */
(function () {
  'use strict';
  if (typeof GraphicalUI === 'undefined') return;

  const previousModel = GraphicalUI.model;
  const barStates = new Set(['jen', 'jenDrinks', 'jenTalk']);
  GraphicalUI.model = function () {
    const model = previousModel.call(this);
    if (typeof stage === 'undefined' || stage !== 'mercy') return model;
    if (typeof mercyLocation === 'undefined' || !barStates.has(mercyLocation)) return model;
    // Port55 uses another establishment. Don't substitute the Solace bar there.
    if (typeof player !== 'undefined' && player?.flags?.port55Casino) return model;
    model.art = 'assets/locations/rusty_lantern_bar.png';
    model.title = 'The Rusty Lantern — Jen’s Bar';
    return model;
  };

  // Handles an already-open bar on a freshly loaded page.
  if (typeof GraphicalUI.schedule === 'function') GraphicalUI.schedule();
})();
