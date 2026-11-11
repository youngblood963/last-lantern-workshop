// Bootstrap regression checks; execute the real environment guard unchanged.
const assert=require('node:assert/strict');
const create=require('./helpers/devtest.cjs');
const game=create();
assert.equal(game.run('window===globalThis'),true);
assert.equal(game.run('location.pathname'),'/route127/devtest/index.html');
assert.equal(game.run('document.baseURI'),'http://localhost/route127/playtest/');
assert.equal(game.run('ROUTE127_ENV.name'),'DEVTEST');
assert.equal(game.run('ROUTE127_ENV.backend'),false);
assert.equal(game.run('Object.isFrozen(ROUTE127_ENV)'),true);
assert(game.scripts.includes('devtest/r11.js'));
assert.equal(game.run('RoadScenarioRegistry.special'),null);
assert.equal(game.run('Math.random=()=>0; r11SteveRoll()'),false);
assert.deepEqual(game.scripts.slice(0,3),['devtest/runtime/environment.js','devtest/scenario_registry.js','playtest/app.js']);
for(const pathname of ['/route127/playtest/index.html','/route127/production/index.html']){
 assert.throws(()=>create({pathname}),/Devtest bootstrap refused outside its explicit entry/);
}
game.run("localStorage.setItem('wo32-check','ok')");
assert.equal(game.storage.get('route127:devtest:v1:wo32-check'),'ok');
assert.equal(game.storage.has('wo32-check'),false);
console.log('PASS: Devtest URL/base, parser script order, environment guard and isolated storage ('+game.scripts.length+' external scripts loaded)');
