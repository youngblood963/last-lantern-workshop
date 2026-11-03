/* Route 127 — Rusty Lantern interior artwork (presentation only).
 * Scopes bar framing exclusively to Jen's existing bar artwork.
 * No gameplay, menu, save, or casino changes.
 */
(function () {
  'use strict';
  if (typeof GraphicalUI === 'undefined') return;

  const previousModel = GraphicalUI.model;
  const barStates = new Set(['jen', 'jenDrinks', 'jenTalk']);
  GraphicalUI.model = function () {
    const model = previousModel.call(this);
    if (typeof stage !== 'undefined' && stage === 'mercy' &&
        typeof mercyLocation !== 'undefined' && barStates.has(mercyLocation) &&
        !(typeof player !== 'undefined' && player?.flags?.port55Casino)) {
      model.art = 'assets/locations/rusty_lantern_bar.png';
      model.title = 'The Rusty Lantern — Jen’s Bar';
    }
    return model;
  };

  // Existing graphics.css covers and vertically crops wide art panels.
  // Anchor this picture to the top so Jen's face and hair remain visible.
  // Leave every other location's image framing unchanged.
  const style = document.createElement('style');
  style.dataset.route127BarHeadroom = 'v2';
  style.textContent = `
    body.full-graphics .gfx-frame .gfx-art .gfx-image[src*="rusty_lantern_bar.png"] {
      object-fit: cover !important;
      object-position: center top !important;
    }
  `;
  document.head.appendChild(style);

  if (typeof GraphicalUI.schedule === 'function') GraphicalUI.schedule();
})();
