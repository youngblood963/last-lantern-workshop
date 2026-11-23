const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const createDevtest=require('./helpers/devtest.cjs');

const previous='route127:devtest:v1:';
const local='route127:devtest:local:v1:';
const publicCloud='route127:playtest:cloud:v1:';
const slot='route127_save_01_v25';
const auto='route127_factory_autosave_v42';
const physicalRecords=[
 [slot,'{"legacy":"public"}'],
 [previous+slot,'{"old":"cloud-loaded"}'],
 [previous+auto,'{"old":"cloud-autosave"}'],
 [previous+'r127-dev-pending:owner:latest','{"unsynced":true}'],
 [previous+'r127-before-cloud-load:latest','{"archive":true}'],
 [publicCloud+slot,'{"public":"unchanged"}'],
 [previous+'combat-visual-layouts-v1','{}'],
 [previous+'tomorrow-project-layout-v1','{"approved":true}']
];
function boot(initialStorage){
 const game=createDevtest({pathname:'/route127/devtest/index.html?cloud=1',initialStorage});
 game.ctx.crypto=webcrypto;
 game.ctx.document.createTextNode=text=>({textContent:text,appendData(value){this.textContent+=value;}});
 const originalQuery=game.ctx.document.querySelector;
 game.ctx.document.querySelector=selector=>{
  const node=originalQuery(selector);
  node.insertBefore=()=>{};
  if(selector==='.utility-name')node.childNodes=[{}];
  return node;
 };
 return game;
}

const first=boot(physicalRecords);
assert(!first.scripts.some(path=>/cloud-save-bootstrap\.js|cloud-dev\.js/.test(path)));
assert.equal(first.run('stage'),'title');
for(const key of [slot,auto,'r127-dev-pending:owner:latest','r127-before-cloud-load:latest']){
 assert.equal(first.ctx.localStorage.getItem(key),null);
}
assert.equal(first.ctx.localStorage.getItem('combat-visual-layouts-v1'),'{}');
assert.equal(first.ctx.localStorage.getItem('tomorrow-project-layout-v1'),'{"approved":true}');

first.run("resetPlayer();player.handle='Local Ranger';stage='house';saveGame(1)");
const saved=JSON.parse(first.storage.get(local+auto));
assert(!first.storage.has(local+slot));
assert.equal(saved.player.level,1);
assert.equal(saved.player.handle,'Local Ranger');
const second=boot([...first.storage]);
second.run('loadGame("auto")');
assert.equal(second.run('player.handle'),'Local Ranger');
assert.equal(second.run('player.level'),1);
assert(second.scripts.some(path=>path.endsWith('/dev_options.js')));
assert(second.scripts.some(path=>path.endsWith('/zero_turn_rescue.js')));

second.run('player.turns=0;testMode=true');
assert.equal(second.run('spendTurn()'),true);
assert.equal(second.run('player.turns'),0);
second.run("lanternMigrate();Object.assign(lanternState(),{nodeId:'solace',currentEdgeId:null,pending:false,solaceAdmitted:true});stage='lanternNode'");
assert.equal(second.run("lanternChoose(lanternConnections('solace')[0].id)"),true);
assert.equal(second.run('stage'),'lanternRoad');
for(const [key,value] of physicalRecords)assert.equal(second.storage.get(key),value,key);
async function startupAndReset(){
 const fresh=boot(physicalRecords);
 assert.equal(fresh.run('devtestTitleActions().join(",")'),'New Game');
 // Remove animation delays while retaining the real intro and command handling.
 fresh.ctx.setTimeout=callback=>{queueMicrotask(callback);return 1;};
 fresh.run('outputQueue=Promise.resolve();typeLine=async()=>{};add=()=>{};addImmediate=()=>{}');
 await fresh.run('handleCommandCore("new game")');
 assert.equal(fresh.run('stage'),'wake');
 await fresh.run('handleCommandCore("stand up")');
 assert.equal(fresh.run('stage'),'handle');
 await fresh.run('handleCommandCore("New Ranger")');
 await fresh.run('handleCommandCore("yes")');
 assert.equal(JSON.parse(fresh.storage.get(local+auto)).player.handle,'new ranger');
 const returning=boot([...fresh.storage]);
 assert.equal(returning.run('devtestTitleActions().join(",")'),'Continue,Reset Character');
 await returning.run('handleCommandCore("continue")');
 assert.equal(returning.run('player.handle'),'new ranger');
 returning.run('titleScreen()');
 returning.ctx.confirm=()=>false;
 await returning.run('handleCommandCore("reset character")');
 assert(returning.storage.has(local+auto));
 returning.ctx.confirm=()=>true;
 await returning.run('handleCommandCore("reset character")');
 assert(!returning.storage.has(local+auto));
 assert.equal(returning.run('devtestTitleActions().join(",")'),'New Game');
 for(const [key,value] of physicalRecords)assert.equal(returning.storage.get(key),value,key);
}
startupAndReset().then(()=>console.log('Local intro, autosave, Continue, reset and isolation passed.')).catch(error=>{console.error(error);process.exitCode=1;});
