const assert = require('node:assert/strict');
const createDevtest = require('./helpers/devtest.cjs');

const encounters = [
 ['yard', 'house--solace-upper-junction', 'RABID RACCOONS', 'ANTENNA SERVO', 'salvage antenna servo', 'relay_antenna_servo.png', 'overturned maintenance van'],
 ['branch', 'motel-interior-junction--solace', 'ROAD REAPERS', 'SHIELDED FEED COUPLER', 'recover feed coupler', 'relay_shielded_feed_coupler.png', 'roadside communications cabinet'],
 ['east', 'works-junction--factory', 'ROAD REAPERS', 'SIGNAL-CONDITIONING MODULE', 'recover signal module', 'relay_signal_conditioning_module.png', 'wrecked communication truck']
];

function boot() {
 const {run,ctx} = createDevtest({pathname:'/route127/devtest/?cloud=1'});
 ctx.crypto = require('node:crypto');
 run(`outputQueue=Promise.resolve();updateHud=()=>{};refreshInterfaceShortcutLabels=()=>{};
  const lines66=[];
  add=(text)=>lines66.push(String(text));
  addImmediate=(text)=>lines66.push(String(text));
  FocusedEntry.sync=()=>{};
  GraphicalUI.preference=()=> 'graphics';
  GraphicalUI.active=()=>true;
  GraphicalUI.sync=()=>{};
  GraphicalUI.schedule=()=>{};
  const load66=snapshot=>{
   const read=getSaveData;
   getSaveData=slot=>slot==='auto'?snapshot:read(slot);
   try{loadGame('auto');}finally{getSaveData=read;}
  };
 `);
 return run;
}

async function main() {
 const run = boot();
 run(`resetPlayer();player.handle='Relay Tester';player.flags.interfaceUnlocked=true;
  player.flags.relayPartsRevealed=true;
  player.flags.relayQuest='active';lanternMigrate();ensureRelayParts().johnny=true;
  Math.random=()=>0;
 `);
 for (const [key, edge, rival, title, action, art, scene] of encounters) {
  run(`Object.assign(lanternState(),{currentEdgeId:${JSON.stringify(edge)},stepIndex:0,direction:1,
    pending:false,encounterRegion:LG_EDGES[${JSON.stringify(edge)}].region,encounterIndex:null});
   lanternProject();
   const rival66_${key}=r10Pool(r10Region()).findIndex(e=>e.title.includes(${JSON.stringify(rival)}));
   const turns66_${key}=player.turns-1;
   const lifetime66_${key}=player.lifetimeTurns+1;
   lines66.length=0;
   lanternStep();`);
  if(key==='yard')assert.ok(run('rival66_'+key)>=0, 'Rabid Raccoons exists in the saved encounter pool');
  async function assertScene() {
   await run('outputQueue');
   assert.equal(run('stage'), 'relayRoadDiscovery');
   assert.equal(run('currentEncounter()'), null);
   assert.equal(run('combatState'), null);
   assert.equal(run('lanternState().encounterIndex'), null);
   assert.equal(run('GraphicalUI.model().title'), 'RELAY COMPONENT — '+title);
   assert.ok(run('GraphicalUI.model().art').endsWith('/'+art));
   assert.ok(run(`lines66.some(line=>line.includes(${JSON.stringify(scene)}))`));
   assert.deepEqual(JSON.parse(run("JSON.stringify(Object.values(numberedChoices))")), [action, 'back away']);
   const commands = JSON.parse(run("JSON.stringify(GraphicalUI.choices().map(choice=>choice.command))"));
   assert.deepEqual(commands, [action, 'back away']);
   assert.equal(run('player.turns'), run('turns66_'+key));
   assert.equal(run('player.lifetimeTurns'), run('lifetime66_'+key));
  }
  await assertScene();
  // Exercise the loader used by the cloud adapter, then legacy saves whose
  // pending random index still points at a different encounter or is missing.
  run(`const snapshot66_${key}=JSON.parse(JSON.stringify(saveSnapshot()));
   load66(snapshot66_${key});`);
  await assertScene();
  run(`snapshot66_${key}.stage='encounter';
   snapshot66_${key}.player.flags.lanternTravel.encounterIndex=Math.max(0,rival66_${key});
   load66(snapshot66_${key});`);
  await assertScene();
  run(`stage='lanternRoad';lanternState().encounterIndex=99999;lanternRoadMenu();`);
  await run('outputQueue');
  await run("GraphicalUI.dispatch(GraphicalUI.choices().find(choice=>choice.command==='resume road event'))");
  await assertScene();
  await run(`GraphicalUI.dispatch(GraphicalUI.choices().find(choice=>choice.command===${JSON.stringify(action)}))`);
  assert.equal(run(`ensureRelayParts().${key}`), true);
  assert.equal(run('lanternState().pending'), false);
  assert.equal(run('player.flags.relayRoadEncounter'), undefined);
  assert.equal(run('player.turns'), run('turns66_'+key));
  assert.equal(run('player.lifetimeTurns'), run('lifetime66_'+key));
  await run(`handleCommand(${JSON.stringify(action)})`);
  assert.equal(run('lines66.filter(line=>line==="RELAY COMPONENT RECOVERED — '+title+'").length'), 1);
 }
 assert.equal(run('relayPartCount()'), 4);
 console.log('PASS WO66 all Relay components, graphical actions, snapshot reload, manual recovery, and one-time awards');
}

main().catch(error=>{console.error(error);process.exitCode=1;});
