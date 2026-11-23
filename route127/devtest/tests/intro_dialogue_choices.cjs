const assert=require('node:assert/strict');
const create=require('./helpers/wo33_dom.cjs');
const expected=[
 ["Hello? Who's there?",'Holy shit. Someone actually answered.'],
 ['Where the hell am I?',"Somewhere you don't want to stay."],
 ['Who are you people?',"We're trying to help. That's all you need to know right now."],
 ['What happened out there?',"How much time do you have? Because we don't have much."],
 ['Fuck off.',"Well, that's a hell of a way to greet your rescuers."]
];
(async()=>{
 const {run,flush}=create();
 const panel=()=>run("document.querySelector('.terminal-shell').querySelector('.game-layout').children.find(e=>e.classList.contains('r127-intro-dialogue'))");
 for(const mode of ['graphics','classic'])for(let i=0;i<5;i++){
  run(`resetPlayer();player.handle='Intro Tester';GraphicalUI.preferred='${mode}';stage='standing';busy=false;outputQueue=Promise.resolve();`);
  await run('terminalAwakens()');await flush();
  assert.equal(run('stage'),'hello');assert.equal(run('FocusedEntry.describe()'),null);
  assert.equal(Object.keys(run('numberedChoices')).length,5);
  assert(panel().textContent.includes('SIGNAL DETECTED'));assert(panel().textContent.includes('HELLO?'));
  run("globalThis.savedIntroTypeLine=typeLine;typeLine=async()=>{throw Error('Unexpected typewriter')}");
  await run(`handleCommand('${i+1}')`);await flush();
  assert.equal(run('stage'),'listen');
  assert(panel().textContent.includes('YOU > '+expected[i][0]));assert(panel().textContent.includes('TERMINAL > '+expected[i][1]));
  assert(panel().textContent.includes("WOMAN'S VOICE"));assert.equal(run('FocusedEntry.dialog'),null);
  await run("handleCommand('invalid')");assert.equal(run('stage'),'listen');
  await run("handleCommand('listen')");assert(panel().textContent.includes('DISPLAY DRIVER FAILURE'));
  await run("handleCommand('listen')");assert(panel().textContent.includes('DESTINATION: SOLACE'));
  await run("handleCommand('listen')");assert.equal(run('stage'),'savecoords');
  assert(panel().textContent.includes('Tomorrow Project'));assert(panel().textContent.includes('Relay'));
  assert.equal(run('player.flags.interfaceUnlocked'),false);
  run("typeLine=async(text,cls)=>addImmediate(text,cls)");
  await run("handleCommand('log coordinates')");await flush();
  assert.equal(run('stage'),'roadReady');assert.equal(run('player.flags.interfaceUnlocked'),true);
  assert.equal(run('roadGoal'),'mercy');assert.equal(run('roadTripLength'),10);assert.equal(run('player.handle'),'Intro Tester');
  run('typeLine=savedIntroTypeLine');
 }
 run("resetPlayer();stage='handle';busy=false;GraphicalUI.preferred='graphics';outputQueue=Promise.resolve()");
 const name=run('FocusedEntry.describe()');assert.equal(name.key,'traveler-name');assert.equal(name.maxLength,16);
 await run("handleCommand('Test Traveler')");await flush();assert.equal(run('stage'),'confirmHandle');
 await run("handleCommand('yes')");await flush();assert.equal(run('player.handle'),'test traveler');assert.equal(run('stage'),'standing');
 run("stage='hello';numberedChoices={};renderCurrentChoices()");assert.equal(Object.keys(run('numberedChoices')).length,5);
 console.log('PASS: all five exact replies in Graphics and Classic; paused pages, no popup/typewriter, invalid-input recovery, unchanged Solace handoff, naming and menu resume');
})().catch(e=>{console.error(e);process.exitCode=1});
