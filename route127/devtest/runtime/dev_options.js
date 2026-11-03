/* Devtest-only graphical Options: unlimited turns. No Playtest or backend dependencies. */
(() => {
  'use strict';
  if (globalThis.ROUTE127_ENV?.name !== 'DEVTEST' ||
      !/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)) return;
  if (typeof GraphicalUI === 'undefined' || typeof updateHud !== 'function') return;
  const originalSync = GraphicalUI.sync;
  GraphicalUI.sync = function (...args) {
    const result = originalSync.apply(this, args);
    const panel = this.element?.settings;
    if (!this.optionsOpen || !panel || panel.hidden || panel.querySelector('[data-devtest-unlimited]')) return result;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.devtestUnlimited = 'true';
    button.textContent = testMode ? 'UNLIMITED TURNS: ON' : 'UNLIMITED TURNS: OFF';
    button.setAttribute('aria-pressed', String(!!testMode));
    button.addEventListener('click', () => {
      testMode = !testMode;
      updateHud();
      if (typeof updateRefillDisplay === 'function') updateRefillDisplay();
      this.sync();
    });
    const close = [...panel.querySelectorAll('button')].find(b => b.textContent?.includes('CLOSE OPTIONS'));
    panel.insertBefore(button, close || null);
    return result;
  };
  GraphicalUI.sync();
})();
