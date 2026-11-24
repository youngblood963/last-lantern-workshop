/* Public release uses real turn/save handlers in isolated, offline storage. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
const {run,flush}=require('./helpers/release_menu.cjs')();await flush();
assert.equal(run('ROUTE127_ENV.name'),'PLAYTEST');assert.equal(run('QA_BUILD'),false);assert.equal(run('testMode'),false);assert.equal(run('TURN_REFILL_AMOUNT'),30);assert.equal(run('TURN_CAP'),150);
run("resetPlayer();player.handle='Public Turn Regression';player.flags.interfaceUnlocked=true;player.flags.mercyDiscovered=true;player.flags.murphyRideLevel10Astrid=true;lanternMigrate();stage='lanternNode';player.turns=1;busy=false;commandProcessing=false");
assert(run('spendTurns(1)'));assert.equal(run('player.turns'),0);assert.equal(run('spendTurns(1)'),false);assert.equal(run('player.turns'),0);
await run("handleCommand('testing access')");await flush();assert.notEqual(run('stage'),'testingCode');assert.equal(run('testMode'),false);
run('player.flags.nextRefillAt=Date.now()-1;processRefill()');assert.equal(run('player.turns'),30);const due=run('player.flags.nextRefillAt');run('processRefill()');assert.equal(run('player.flags.nextRefillAt'),due);assert.equal(run('player.turns'),30);
run('player.turns=149;player.flags.nextRefillAt=Date.now()-1;processRefill()');assert.equal(run('player.turns'),150);
run("testMode=true;saveGame();loadGame('auto')");await flush();assert.equal(run('testMode'),false,'Save reload leaked unlimited mode');
const entry=fs.readFileSync(path.resolve(__dirname,'../../playtest/index.html'),'utf8');assert(!/dev_options\.js|regional_stress_observer|local-regional-stress|tests\/support/.test(entry));
const env=fs.readFileSync(path.resolve(__dirname,'../runtime/environment.js'),'utf8');assert(env.includes("name:playtest?'PLAYTEST':'DEVTEST'"));assert(env.includes("value:false,writable:false,configurable:false"));
console.log('PASS: PLAYTEST QA disabled, 30-turn refill/150 bank unchanged, native zero-turn spending blocked, testing access denied, refill timestamp stable, unlimited flag cleared on load, no QA observer/options in public entry');
})().catch(e=>{console.error(e);process.exitCode=1});
