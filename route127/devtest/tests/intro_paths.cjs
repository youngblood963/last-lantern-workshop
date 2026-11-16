const assert = require('node:assert/strict');
const createGame = require('./helpers/wo33_dom.cjs');

async function play(mode, skip) {
  const {run, flush, ids} = createGame();
  async function command(value, expectedStage, button) {
    if (run('Boolean(FocusedEntry.dialog)')) {
      run('FocusedEntry.field.value = ' + JSON.stringify(value));
      await run('FocusedEntry.submit()');
    } else if (mode === 'graphics' && button) {
      const action = run('FocusedEntry.legacy.children.find(el => el.textContent.toLowerCase() === ' +
        JSON.stringify(button.toLowerCase()) + ')');
      assert.ok(action, 'Missing graphical action: ' + button);
      await action.events.click[0]({preventDefault() {}, stopPropagation() {}});
    } else {
      await run('handleCommand(' + JSON.stringify(value) + ')');
    }
    await flush();
    assert.equal(run('stage'), expectedStage, value);
    assert.equal(run('busy || input.disabled'), false, value);
  }

  await flush();
  run('titleScreen(); GraphicalUI.setMode(' + JSON.stringify(mode) + ')');
  await flush();
  run('FocusedEntry.sync()');
  if (skip) {
    await command(mode === 'classic' ? 'k' : 'skip intro', 'handle', 'Skip Intro');
  } else {
    await command('new game', 'confirmNewSlot', 'New Game');
    await command('cancel', 'title', 'Cancel');
    await command('new game', 'confirmNewSlot', 'New Game');
    await command('', 'wake', 'Confirm');
    await command('look around', 'wake', 'Look Around');
    await command('stand up', 'handle', 'Stand Up');
  }

  await command('random', 'handle');
  await command('FirstName', 'confirmHandle');
  await command('change', 'handle', 'Change Name');
  await command('IntroTester', 'confirmHandle');
  await command('', skip ? 'house' : 'standing', 'Confirm introtester');
  assert.equal(run('player.handle'), 'introtester');

  if (skip) {
    assert.match(ids.screen.textContent, /coordinates are already logged/i);
  } else {
    await command('check cabinet', 'standing');
    await command('check cabinet', 'standing');
    assert.equal(run('player.pack.find(item => item.name === "Bandage").qty'), 1);
    await command('search room', 'standing');
    const bolts = run('player.bolts');
    await command('search room', 'standing');
    assert.equal(run('player.bolts'), bolts);
    await command('check pack', 'standing', 'Check Pack');
    await command('inspect computer', 'hello', 'Inspect Computer');
    await command('hi', 'listen');
    await command('listen', 'savecoords');
    await command('log coordinates', 'roadReady');
    assert.match(ids.screen.textContent, /COORDINATES LOGGED/);
  }

  assert.equal(run('GraphicalUI.preference()'), mode);
  assert.equal(run('GraphicalUI.active()'), mode === 'graphics');
  assert.equal(run('player.flags.interfaceUnlocked'), true);
  assert.equal(run('Boolean(lanternState()?.currentEdgeId)'), false);
  console.log('PASS', mode, skip ? 'skip intro' : 'full intro');
}

(async () => {
  for (const mode of ['classic', 'graphics']) {
    await play(mode, false);
    await play(mode, true);
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
