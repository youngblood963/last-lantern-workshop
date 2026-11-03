/* Route 127 — Rusty Lantern bar: uncropped cinematic framing.
 * Presentation only. Keeps the entire approved scene (Jen and bar) visible
 * without changing other locations, casino, game logic or menu sizing.
 */
(function () {
  'use strict';
  if (typeof GraphicalUI === 'undefined') return;

  const priorModel = GraphicalUI.model;
  const barStates = new Set(['jen', 'jenDrinks', 'jenTalk']);
  GraphicalUI.model = function () {
    const model = priorModel.call(this);
    if (typeof stage !== 'undefined' && stage === 'mercy' &&
        typeof mercyLocation !== 'undefined' && barStates.has(mercyLocation) &&
        !(typeof player !== 'undefined' && player?.flags?.port55Casino)) {
      model.art = 'assets/locations/rusty_lantern_bar.png';
      model.title = 'The Rusty Lantern — Jen’s Bar';
    }
    return model;
  };

  // The game art viewport is much wider than 16:9. Cover crops Jen and
  // the counter; contain displays the complete image. A subdued, blurred
  // edge-fill prevents harsh black letterbox bars at either side.
  const style = document.createElement('style');
  style.dataset.route127BarFraming = 'v3';
  style.textContent = `
    body.full-graphics .gfx-frame .gfx-art:has(> .gfx-image[src*="rusty_lantern_bar.png"]) {
      isolation: isolate;
      background: #100c08 !important;
    }
    body.full-graphics .gfx-frame .gfx-art:has(> .gfx-image[src*="rusty_lantern_bar.png"])::before {
      content: '';
      position: absolute;
      inset: -12px;
      z-index: 0;
      pointer-events: none;
      background: linear-gradient(#08060444,#08060444),
        url('assets/locations/rusty_lantern_bar.png') center center / cover no-repeat;
      filter: blur(9px) brightness(.58);
    }
    body.full-graphics .gfx-frame .gfx-art > .gfx-image[src*="rusty_lantern_bar.png"] {
      position: relative;
      z-index: 1;
      width: 100% !important;
      height: 100% !important;
      max-height: 100% !important;
      object-fit: contain !important;
      object-position: center center !important;
      background: transparent !important;
    }
    body.full-graphics .gfx-frame .gfx-art:has(> .gfx-image[src*="rusty_lantern_bar.png"]) > .gfx-art-caption {
      z-index: 2;
    }
  `;
  document.head.appendChild(style);
  if (typeof GraphicalUI.schedule === 'function') GraphicalUI.schedule();
})();
