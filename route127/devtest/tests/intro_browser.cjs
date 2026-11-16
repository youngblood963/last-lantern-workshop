const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const {resolve} = require('node:path');
const {setTimeout: delay} = require('node:timers/promises');
const {chromium} = require('playwright');

const origin = 'http://127.0.0.1:8765';
const entry = origin + '/route127/devtest/';
const repo = resolve(__dirname, '../../..');

async function play(browser, mode, skip) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && message.text().includes('Focused entry:')) errors.push(message.text());
    });

    await page.goto(entry);
    const wait = expected => page.waitForFunction(expectedStage =>
      stage === expectedStage && !busy && !commandProcessing && !FocusedEntry.working,
      expected, {timeout: 60000});
    await wait('title');
    assert.equal(await page.evaluate(() => Boolean(newestSave())), false);

    const button = name => page.getByRole('button', {name, exact: true});
    const command = async value => {
      const field = page.locator('#command');
      await field.fill(value);
      await field.press('Enter');
    };
    const choose = async (value, label, expected) => {
      if (mode === 'graphics') await button(label).click();
      else await command(value);
      await wait(expected);
    };
    const enter = async (value, expected) => {
      if (mode === 'graphics') {
        const dialog = page.getByRole('dialog');
        await dialog.getByRole('textbox').fill(value);
        await dialog.getByRole('button', {name: 'Continue', exact: true}).click();
      } else await command(value);
      await wait(expected);
    };

    if (mode === 'classic') {
      await page.getByRole('button', {name: /SWITCH TO CLASSIC BBS/}).click();
    }
    if (skip) {
      await choose('k', 'Skip Intro', 'handle');
    } else {
      await choose('n', 'New Game', 'confirmNewSlot');
      await choose('n', 'Cancel', 'title');
      await choose('n', 'New Game', 'confirmNewSlot');
      await choose('', 'Confirm', 'wake');
      await choose('l', 'LOOK AROUND', 'wake');
      await choose('s', 'stand up', 'handle');
    }
    await enter('IntroOne', 'confirmHandle');
    await choose('n', 'Change Name', 'handle');
    await enter('IntroTester', 'confirmHandle');
    await choose('', 'Confirm introtester', skip ? 'house' : 'standing');

    if (!skip) {
      await choose('c', 'check cabinet', 'standing');
      await choose('s', 'search room', 'standing');
      await choose('h', 'check pack', 'standing');
      await choose('i', 'inspect computer', 'hello');
      await enter('hi', 'listen');
      await enter('listen', 'savecoords');
      await enter('log coordinates', 'roadReady');
    }

    const state = await page.evaluate(() => ({
      mode: GraphicalUI.preference(), active: GraphicalUI.active(),
      unlocked: player.flags.interfaceUnlocked, edge: lanternState()?.currentEdgeId ?? null,
      handle: player.handle.toLowerCase(),
    }));
    assert.deepEqual(state, {mode, active: mode === 'graphics', unlocked: true, edge: null, handle: 'introtester'});
    if (mode === 'graphics') {
      const artwork = page.getByRole('img', {name: /approved environment artwork/i});
      await artwork.waitFor({state: 'visible'});
      await page.waitForFunction(() => {
        const image = document.querySelector('.gfx-image');
        return image?.complete && image.naturalWidth > 0;
      });
    }
    assert.deepEqual(errors, []);
    console.log('PASS', mode, skip ? 'skip intro' : 'full intro');
  } finally {
    await context.close();
  }
}

async function main() {
  const server = spawn('python3', ['-m', 'http.server', '8765', '--bind', '127.0.0.1'], {cwd: repo});
  let browser;
  try {
    for (let retry = 0; ; retry++) {
      try {
        assert.equal((await fetch(entry)).status, 200);
        break;
      } catch (error) {
        if (retry >= 50) throw error;
        await delay(100);
      }
    }
    browser = await chromium.launch();
    for (const mode of ['classic', 'graphics']) {
      for (const skip of [false, true]) await play(browser, mode, skip);
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
