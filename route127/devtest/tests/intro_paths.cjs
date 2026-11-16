const assert = require('node:assert/strict');
const createGame = require('./helpers/wo33_dom.cjs');

async function play(mode, skip) {
  const {run, flush, ids} = createGame();
  async function command(value, expectedStage) {
    if (run('Boolean(FocusedEntry.dialog)')) {
      run('FocusedEntry.field.value = ' + JSON.stringify(value));
      await run('FocusedEntry.submit()');
    } else {
      await run('handleCommand(' + JSON.stringify(value) + ')');
    }
    await flush();
    assert.equal(run('stage'), expectedStage, value);
    assert.equal(run('busy || input.disabled'), false, value);
  }

  await flush();
  run('titleScreen(); GraphicalUI.setMode(' + JSON.stringify(mode) + ')');
  if (skip) {
    await command('skip intro', 'handle');
  } else {
    await command('new game', 'confirmNewSlot');
    await command('cancel', 'title');
    await command('new game', 'confirmNewSlot');
    await command('', 'wake');
    await command('look around', 'wake');
    await command('stand up', 'handle');
  }

  await command('random', 'handle');
  await command('FirstName', 'confirmHandle');
  await command('change', 'handle');
  await command('IntroTester', 'confirmHandle');
  await command('', skip ? 'house' : 'standing');
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
    await command('check pack', 'standing');
    await command('inspect computer', 'hello');
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
