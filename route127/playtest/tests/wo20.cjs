const assert=require('node:assert/strict');
const createGame=require('./helpers/game.cjs');
(async()=>{
 for(const random of [.01,.1,.2,.3,.7,.9]){
  const {run,flush}=createGame();await flush();
  run("FocusedEntry.close();resetPlayer();player.handle='WO20';activeSaveSlot=1;busy=false;player.flags.interfaceUnlocked=true;stage='roadReady';lanternMigrate();Math.random=()=>"+random);
  await run("handleCommand('road')");await flush();
  assert.equal(run('stage'),'encounter');assert.equal(run('player.turns'),49);
  assert.equal(run('lanternState().stepIndex'),1);assert(run('lanternState().pending'));
  const choices=JSON.parse(run('JSON.stringify(numberedChoices)'));
  assert(Object.keys(choices).length>0);
  assert(!Object.values(choices).includes('continue road'),'Queued travel menu replaced encounter choices');
  assert(!Object.values(choices).includes('reverse direction'));
  const expected=JSON.parse(run("JSON.stringify(encounterChoices(currentEncounter()).split(/\\s{2,}/).filter(Boolean).map(choiceCommand))"));
  for(const choice of Object.values(choices))assert(expected.includes(choice),'Unexpected encounter command '+choice);
  run("TravelerPanels.open('inventory')");await flush();run('TravelerPanels.close()');await flush();
  assert.deepEqual(JSON.parse(run('JSON.stringify(numberedChoices)')),choices);
  assert.equal(run('player.turns'),49);assert(run('lanternState().pending'));
 }
 for(const kind of ['lanternNode','lanternRoad','lanternGate']){
  const {run,flush,ids}=createGame();await flush();
  run("FocusedEntry.close();resetPlayer();player.handle='Resume';activeSaveSlot=1;busy=false;player.flags.interfaceUnlocked=true;player.flags.mercyDiscovered=true;player.flags.solaceCheckpointSaved=true;lanternMigrate();");
  if(kind==='lanternGate')run("Object.assign(lanternState(),{nodeId:'solace',solaceAdmitted:true,selectedGate:'south'});lanternGateMenu('south')");
  else if(kind==='lanternRoad')run("lanternState().nodeId='house';lanternChoose('house--solace-upper-junction')");
  else run("lanternState().nodeId='scrap-yard';lanternNodeMenu()");
  await flush();const choices=JSON.parse(run('JSON.stringify(numberedChoices)')),turns=run('player.turns');
  run('saveGame(1)');await flush();
  run('loadGame(1)');await flush();
  assert.equal(run('stage'),kind);assert.equal(run('player.turns'),turns);
  assert.deepEqual(JSON.parse(run('JSON.stringify(numberedChoices)')),choices);
  assert(!ids.screen.textContent.includes('LOCATION RESTORED — LANTERN'));
  const heading=kind==='lanternNode'?'SCRAP YARD':kind==='lanternGate'?'SOLACE — SOUTH GATE':'Route 127 — Old House ↔ Upper Highway Junction';
  assert.equal(ids.screen.children.filter(n=>kind==='lanternRoad'?n.textContent.startsWith(heading):n.textContent===heading).length,1,'Graph scene was rendered twice on reload');
 }
 console.log('PASS graph node/road/gate reload renders once, preserves choices and movement turns');
 console.log('PASS initial road handoff retains six encounter menus, one movement charge, and backpack return bindings');
})().catch(e=>{console.error(e);process.exitCode=1;});
