const assert=require('node:assert/strict');
const {run,flush,ids,storage}=require('./helpers/game.cjs')();
async function command(text){await run('handleCommand('+JSON.stringify(text)+')');await flush();}
async function choose(label,graphical=false){
 const choice=JSON.parse(run('JSON.stringify(GraphicalUI.choices())')).find(c=>c.command===label);
 assert(choice,'Missing displayed action: '+label);
 if(graphical){await run('GraphicalUI.dispatch('+JSON.stringify(choice)+')');await flush();}
 else await command(choice.key);
}
async function fresh(extra=''){
 await flush();run("FocusedEntry.close();resetPlayer();player.handle='Audit';activeSaveSlot=1;busy=false;numberedChoices={};currentHotkeys={};player.flags.interfaceUnlocked=true;player.flags.mercyDiscovered=true;player.flags.solaceCheckpointSaved=true;player.turns=150;player.maxHp=10000;player.hp=10000;player.bolts=5000;lanternMigrate();Math.random=()=>.5;"+extra);await flush();
}
(async()=>{
 await flush();run('GraphicalUI.mount()');
 // A heading must never consume answer 1. Exercise entry, redraw, save/load and combat retreat.
 for(const restored of [false,true]){
  await fresh("player.flags.mercyDiscovered=false;player.flags.solaceCheckpointSaved=false;lanternState().solaceAdmitted=false;stage='settlement';player.flags.solaceGateChallenge=false;renderCurrentChoices()");
  await choose('approach gate');assert.equal(run('numberedChoices[1]'),'abandoned terminal sent me');
  assert(!run("Object.values(numberedChoices).includes('state your business')"));
  if(restored){run('saveGame(1)');await flush();run('loadGame(1)');await flush();assert.equal(run('numberedChoices[1]'),'abandoned terminal sent me');}
  for(const label of ['looking to trade','looking for the relay station','just passing through']){
   const start=ids.screen.textContent.length;await choose(label);assert.equal(run('stage'),'settlement');assert(ids.screen.textContent.slice(start).includes('GUARD'));assert.equal(run('numberedChoices[1]'),'abandoned terminal sent me');
  }
  await choose('pick a fight');assert.equal(run('combatState.source'),'gateGuards');await command('back');assert.equal(run('stage'),'settlement');assert.equal(run('numberedChoices[1]'),'abandoned terminal sent me');
  await choose('abandoned terminal sent me',true);assert.equal(run('stage'),'mercy');assert(run('lanternState().solaceAdmitted'));assert(run('player.flags.solaceCheckpointSaved'));
 }
 console.log('PASS Solace gate numeric/graphical answers, explained refusals, save/load and retreat');
 // Display strips the price suffix, but both canonical and legacy commands must work.
 for(const graphical of [false,true]){
  await fresh("player.flags.r18ClaraMet=true;Object.assign(factoryState(),{floor:0,room:2});stage='factoryDungeonRoom';player.flags.r18DanielFocus=true;r18DanielMenu();player.bolts=24");
  await choose('negotiate release',graphical);assert.notEqual(run('player.flags.r18DanielQuest'),'done');assert.equal(run('player.bolts'),24);
  run('player.bolts=25');await choose('negotiate release',graphical);assert.equal(run('player.flags.r18DanielQuest'),'done');assert(run('player.flags.r11Learned.widowmaker'));assert.equal(run('player.bolts'),100);
  await command('negotiate release — 25 bolts');assert.equal(run('player.bolts'),100);
 }
 console.log('PASS Daniel negotiation through numeric/graphical routing, cost/refusal and one-time reward');
 // Walk all 108 directed roads with encounter resolution isolated; keep real movement/arrival handlers.
 await fresh("player.flags.portRoadCleared=true;globalThis.auditShowEncounter=showEncounter;showEncounter=()=>{stage='encounter'}");
 const edges=JSON.parse(run('JSON.stringify(LANTERN_WORLD_GRAPH.edges)'));let directions=0;
 for(const edge of edges)for(const [from,to] of [[edge.a,edge.b],[edge.b,edge.a]]){
  run('Object.assign(lanternState(),{nodeId:'+JSON.stringify(from)+',currentEdgeId:null,stepIndex:0,pending:false,markerContext:null,solaceAdmitted:true});player.turns=150;combatState=null;stage="lanternNode";screen.textContent="";');
  assert(run('lanternChoose('+JSON.stringify(edge.id)+')'),edge.id);
  for(let step=0;step<edge.distanceTurns;step++){await run('lanternStep()');if(run('lanternState().pending'))await run('completeRoadTurn()');await flush();}
  assert.equal(run('lanternState().nodeId'),to,edge.id+' from '+from);assert.equal(run('lanternState().currentEdgeId'),null);assert.equal(run('player.turns'),150-edge.distanceTurns);directions++;
 }
 run('showEncounter=auditShowEncounter');assert.equal(directions,108);console.log('PASS all 108 directed roads, arrivals and exact movement costs (encounters isolated)');
 // Follow the Factory displayed floor/room numbers and actual puzzle/boss transitions.
 await fresh("Object.assign(lanternState(),{nodeId:'factory',currentEdgeId:null});v49FactoryRoom()");
 await choose('enter inner factory');await command('4');assert.equal(run('stage'),'factoryDungeonHub');assert.equal(run('factoryState().floor'),-1);
 for(let floor=0;floor<4;floor++){
  await command(String(floor+1));assert.equal(run('stage'),'factoryDungeonFloor');assert.equal(run('factoryState().floor'),floor);
  const rooms=run('FACTORY_FLOORS['+floor+'].rooms.length');
  for(let room=0;room<rooms;room++){
   run('player.turns=150');await command(String(room+1));assert.equal(run('factoryState().room'),room);
   const puzzle=run('FACTORY_PUZZLES['+JSON.stringify(floor+':'+room)+']?.answer');if(puzzle)await choose(puzzle);
   if(room===rooms-1){await choose('fight');assert.equal(run('combatState.source'),'factoryFight');run('combatState.hp=1');await command('attack');assert(run('factoryState().done.includes('+floor+')'));}
   else {await choose('search');}
   await choose('return to floor');assert.equal(run('stage'),'factoryDungeonFloor');
  }
  await command('0');assert.equal(run('stage'),'factoryDungeonHub');
 }
 assert.equal(run('r5ChargeCount()'),4);assert.equal(run('factoryDone()'),4);await command('5');assert.equal(run('stage'),'factoryWorkshop');
 await choose('tomorrow project terminal');await command('1');await command('4');await choose('talk to forge');assert(run('!!player.flags.r5ChargeJob'));run('player.flags.r5ChargeJob.endsAt=0');await command('back');await choose('talk to forge');assert(run('player.flags.portChargePrepared'));
 run("Object.assign(lanternState(),{nodeId:'boulder-junction',currentEdgeId:null});lanternNodeMenu()");await flush();await choose('use dynamite');assert(run('player.flags.portRoadCleared'));assert(!run('hasItem("Prepared Dynamite Charge")'));
 console.log('PASS Factory floor/room numbers, basement lock, puzzles, four bosses/materials, Forge timer and boulder');
 // Seaport liberation and unstaffed Workshop terminal must be reachable from displayed actions.
 run("Object.assign(lanternState(),{nodeId:'seaport',currentEdgeId:null,pending:false});stage='seaport';portArrive()");await flush();await choose('harbor docks');await choose('inspect fishermen');await choose('confront fishermen');assert.equal(run('combatState.source'),'seaportLiberation');run('combatState.hp=1');await command('attack');await choose('free the survivors');assert(run('port55State().freed'));
 assert.equal(run('stage'),'seaport');await choose('market area');await choose('workshop [vacant]');await choose('tomorrow project terminal');assert(run('player.flags.chapterOneComplete'));run('r5CloseCredits()');await flush();
 console.log('PASS Seaport investigation, combat, survivor rescue and chapter terminal without staffing');
 // Relay diagnoses and installation retain the four-parts requirement and one-time rewards.
 await fresh("flashRelayStatic=()=>{};stage='mercy';player.flags.relayUnlocked=true;enterRelayStation()");
 for(const label of ['inspect monitor','inspect console','inspect antenna controls','inspect cables'])await choose(label);
 assert(run('player.flags.relayPartsRevealed'));await command('install components');assert.notEqual(run('player.flags.relayQuest'),'complete');
 run("Object.assign(ensureRelayParts(),{johnny:true,yard:true,branch:true,east:true});showRelayChoices()");await flush();await choose('install components');assert.equal(run('player.flags.relayQuest'),'complete');const reward=run('JSON.stringify(player.flags.relayEquipmentReward)');await command('install components');assert.equal(run('JSON.stringify(player.flags.relayEquipmentReward)'),reward);
 console.log('PASS Relay diagnostics, missing-part refusal, installation and repeat reward protection');
 // Exercise every displayed option in the original six NPC dialogue menus, including Back.
 for(const npc of ['jen','johnny','murphy','wayne','amii','tim']){
  await fresh("stage='mercy';npcTalk("+JSON.stringify(npc)+")");
  const options=JSON.parse(run('JSON.stringify(GraphicalUI.choices())'));
  for(const option of options){
   await fresh("stage='mercy';npcTalk("+JSON.stringify(npc)+")");
   const before=ids.screen.textContent.length;await command(option.key);
   const output=ids.screen.textContent.slice(before);assert(!/COMMAND NOT RECOGNIZED|That's not an option/.test(output),npc+': '+option.command);
   assert(output.length>0||run('mercyLocation')!==npc,npc+': '+option.command);
  }
 }
 console.log('PASS all displayed actions in six Solace NPC dialogue menus (default quest state)');
 // Compare the cleaned wrapper against its old behavior before the downstream combat chain.
 const vm=require('node:vm'),source=require('node:fs').readFileSync(require('node:path').join(__dirname,'../v55.js'),'utf8');
 const wrapper=source.match(/handleCombat=function\(cmd\)\{[^\n]+/)[0];
 for(const value of ['8',-2,'invalid',undefined]){
  const sandbox={combatState:{bolts:value},port55OldHandleCombat:cmd=>cmd};vm.runInNewContext(wrapper,sandbox);
  assert.equal(sandbox.handleCombat('delegate'),'delegate');assert.equal(sandbox.combatState.bolts,value===undefined?undefined:Math.max(0,Number(value)||0));
 }
 console.log('PASS combat wrapper delegates and preserves normalization after redundant clamps removed');
 console.log('ALL WO19 AUDIT CHECKS PASSED');
})().catch(e=>{console.error(e);process.exitCode=1});
