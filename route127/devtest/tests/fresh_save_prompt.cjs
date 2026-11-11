const assert = require('node:assert/strict');
const {run, flush, ids} = require('./helpers/wo33_dom.cjs')();

(async () => {
  for (const mode of ['graphics', 'classic']) {
    for (const existingSave of [false, true]) {
      await flush();
      run(`
        stage = 'title';
        busy = false;
        screen.replaceChildren();
        GraphicalUI.preferred = '${mode}';
        if (${existingSave}) localStorage.setItem(SAVE_KEYS[2], JSON.stringify(saveSnapshot()));
        else localStorage.removeItem(SAVE_KEYS[2]);
        localStorage.removeItem(FACTORY_AUTOSAVE_KEY);
      `);
      await run("handleCommand('new game')");
      await flush();
      const output = ids.screen.textContent;
      assert.ok(output.includes(existingSave ? 'EXISTING SAVE DATA DETECTED.' : 'NO SAVE FOUND.'));
      assert.ok(output.includes('Start a new game in SAVE 1?'));
      assert.equal(run('stage'), 'confirmNewSlot');
    }
  }
  console.log('PASS fresh and existing save prompts in Graphics and Classic');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
