/* Devtest-only Unlimited Turns button inside the existing INTERFACE > OPTIONS overlay.
 * No changes to the shared Playtest gameplay engine or the backend. */
(() => {
  'use strict';
  if (globalThis.ROUTE127_ENV?.name !== 'DEVTEST' ||
      !/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)) return;
  if (typeof TravelerPanels === 'undefined' || typeof GraphicalUI === 'undefined') return;

  const originalOptions = TravelerPanels.options;
  TravelerPanels.options = function (...args) {
    const result = originalOptions.apply(this, args);
    if (this.which !== 'options' || !this.body) return result;
    const panel = this.body.querySelector('.traveler-detail');
    if (!panel || panel.querySelector('[data-devtest-unlimited]')) return result;
    const button = this.button('Unlimited Turns: ' + (testMode ? 'ON' : 'OFF'), () => {
      testMode = !testMode;
      updateHud();
      if (typeof updateRefillDisplay === 'function') updateRefillDisplay();
      button.textContent = 'Unlimited Turns: ' + (testMode ? 'ON' : 'OFF');
      button.setAttribute('aria-pressed', String(testMode));
    });
    button.dataset.devtestUnlimited = 'true';
    button.setAttribute('aria-pressed', String(testMode));
    const close = [...panel.querySelectorAll('button')].find(el => el.textContent === 'Close');
    panel.insertBefore(button, close || null);
    return result;
  };
})();
