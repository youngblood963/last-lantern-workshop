/* Devtest-only Options control. Observes the existing UI; does not patch Playtest. */
(() => {
  'use strict';
  if (globalThis.ROUTE127_ENV?.name !== 'DEVTEST') return;
  if (typeof GraphicalUI === 'undefined' || typeof updateHud !== 'function') return;

  let observedPanel = null;
  let observer = null;
  function addControl() {
    const ui = GraphicalUI;
    const panel = ui.element?.settings;
    if (!panel || !ui.optionsOpen || panel.hidden) return;
    let button = panel.querySelector('[data-devtest-unlimited]');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.dataset.devtestUnlimited = 'true';
      const close = [...panel.querySelectorAll('button')]
        .find(b => b.textContent?.includes('CLOSE OPTIONS'));
      panel.insertBefore(button, close || null);
    }
    button.textContent = 'UNLIMITED TURNS: ' + (testMode ? 'ON' : 'OFF');
    button.setAttribute('aria-pressed', String(!!testMode));
  }

  // The graphical engine reconstructs the Options panel on each sync. Observe
  // that panel rather than wrapping the engine's sync function.
  function watchPanel() {
    const panel = GraphicalUI.element?.settings;
    if (!panel || panel === observedPanel) return;
    observer?.disconnect();
    observedPanel = panel;
    observer = new MutationObserver(() => addControl());
    observer.observe(panel, { childList: true });
    addControl();
  }

  document.addEventListener('click', event => {
    const target = event.target;
    const toggle = target?.closest?.('[data-devtest-unlimited]');
    if (toggle && GraphicalUI.element?.settings?.contains(toggle)) {
      testMode = !testMode;
      updateHud();
      if (typeof updateRefillDisplay === 'function') updateRefillDisplay();
      addControl();
      return;
    }
    // Options may have just been opened and its child nodes re-created.
    if (target?.closest?.('.gfx-nav-button')) queueMicrotask(() => { watchPanel(); addControl(); });
  });

  // Installation is independent of the current game stage and whether the
  // Options panel was mounted before or after this script executed.
  watchPanel();
  document.addEventListener('DOMContentLoaded', watchPanel, { once: true });
})();
