const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {ctx, run, scripts} = require('./helpers/devtest.cjs')();
ctx.crypto = require('node:crypto').webcrypto;
const read = source => JSON.parse(run('JSON.stringify(' + source + ')'));
const edgeId = 'boulder-junction--seaport';
const expected = [
 'early:3', 'early:64', 'east:54', 'east:57', 'east:60', 'east:62',
 'east:64', 'east:69', 'east:70', 'east:72', 'east:73', 'east:78'
];

assert(scripts.includes('devtest/runtime/old_man_finn_causeway.js'));
assert(scripts.includes('devtest/lifecycle.js'));
run(`
 add=()=>{}; addImmediate=()=>{}; updateHud=()=>{};
 GraphicalUI.sync=()=>{}; GraphicalUI.schedule=()=>{};
 GraphicalUI.active=()=>true;
 if(typeof FocusedEntry!=='undefined')FocusedEntry.sync=()=>{};
 let causewaySeed=127;
 Math.random=()=>{causewaySeed=(Math.imul(causewaySeed,1664525)+1013904223)>>>0;return causewaySeed/4294967296;};
 const causewayEdge=LG_EDGES['${edgeId}'];
 function causewayAt(step,direction,pending=false){
  Object.assign(lanternState(),{currentEdgeId:causewayEdge.id,stepIndex:step,direction,pending,encounterRegion:'coast',encounterIndex:null});
 }
 function causewayCandidates(){
  return Object.keys(R10_WEIGHTS).flatMap(kind=>r10SelectionCandidates('coast',kind).map(index=>{
   const e=r10Pool('coast')[index], row=RoadLifecycle.entry(e);
   return {id:row.id,name:e.displayName||e.title,implementation:e.title,kind,regions:row.regions,
    lifecycle:RoadLifecycle.policy(e).lifecycle,min:e.minLevel??null,max:e.maxLevel??null};
  }));
 }
 function causewayPlayer(){
  resetPlayer();player.handle='Causeway QA';player.level=8;player.turns=100;player.bolts=1000;
  player.flags.portRoadCleared=true;lanternMigrate();
 }
 causewayPlayer();
`);
assert.equal(run('causewayEdge.distanceTurns'), 12);
let audit;
for (const direction of [1, -1]) {
 for (let step = 1; step <= 12; step++) {
  run(`causewayAt(${step},${direction});`);
  assert.equal(run('r10Geography()'), step <= 2 ? 'SEAPORT' : 'CAUSEWAY');
  if (step <= 2) continue;
  audit = read('causewayCandidates()');
  assert.deepEqual(audit.map(row => row.id).sort(), expected);
  assert(audit.every(row => row.regions.includes('CAUSEWAY')));
 }
}
console.log('Causeway candidates at level 8:', JSON.stringify(audit));
assert.deepEqual(read("RoadScenarioRegistry.regionalById.get('east:75').regions"), ['NORTH', 'WEST']);
assert.deepEqual(read("RoadScenarioRegistry.regionalById.get('east:71').regions"), ['INDUSTRIAL', 'LOWLANDS']);

// Drive actual movement and selection with the original category weights and saved history.
run(`
 const causewaySave=v49Autosave;
 function causewaySim(direction,depleted=false){
  causewayPlayer();
  if(depleted){
   Object.assign(RoadScenarioRegistry.wo2State(),{
    crabTrap:true,crabNest:true,forklift:true,wo3Drone:true,milepost:true,northernRidge:true,toxic:true
   });
   player.flags.wo7BatteryRecovered=true;
   for(const id of ['early:3','east:72'])RoadLifecycle.record(id).resolved=true;
  }
  v49Autosave=()=>{};
  const counts={}, categories={};
  try{
   for(let crossing=0;crossing<100;crossing++){
    player.turns=100; dailyRoadTurns=0;
    causewayAt(direction>0?0:12,direction);
    lanternState().nodeId=direction>0?causewayEdge.a:causewayEdge.b;
    for(let turn=0;turn<12;turn++){
     const before=player.turns;
     if(!lanternStep()||player.turns!==before-1)throw Error('Movement did not cost exactly one turn');
     const g=lanternState(), geography=r10Geography();
     if(geography==='CAUSEWAY'){
      const kind=player.flags.r10LastRoadCategory;
      categories[kind]=(categories[kind]||0)+1;
      if(kind!=='wanderer'){
       const row=RoadLifecycle.entry(currentEncounter());
       if(!row?.regions.includes('CAUSEWAY'))throw Error('Unauthorized selection: '+row?.name);
       counts[row.id]=(counts[row.id]||0)+1;
      }
     }
     if(stage==='wandererRoad')handleRoadWanderer('move on');
     else if(g.pending)completeRoadTurn();
     if(g.stepIndex===6&&!Route127OldManFinn.roadAction())throw Error('Finn unavailable');
    }
    if(lanternState().nodeId!==(direction>0?causewayEdge.b:causewayEdge.a))throw Error('Wrong arrival');
   }
   return {counts,categories};
  }finally{v49Autosave=causewaySave;}
 }
`);
for (const direction of [1, -1]) {
 const result = read(`causewaySim(${direction})`);
 assert.deepEqual(Object.keys(result.counts).sort(), expected);
 const way = direction === 1 ? 'Forward' : 'Reverse';
 console.log(way, result);
 const depleted = read(`causewaySim(${direction},true)`);
 assert.deepEqual(Object.keys(depleted.counts).sort(), ['early:64','east:54','east:62','east:64','east:78']);
 console.log(way + ' after finite rewards', depleted);
}

// Historical reward and lifecycle records must leave Fight available on a new visit.
run(`causewayPlayer();causewayAt(6,-1,true);stage='encounter';`);
for (const [index, key, opponent] of [[62, 'crabTrap', 'CRAB SWARM'], [64, 'crabNest', 'NEST GUARDIAN']]) {
 run(`RoadScenarioRegistry.wo2State().${key}=true;
  Object.assign(RoadLifecycle.record('east:${index}'),{resolved:true,claims:{FIGHT:true}});
  Object.assign(lanternState(),{encounterIndex:${index},sceneId:'crab-regression-${index}'});
 `);
 assert(run(`r10SelectionCandidates('coast','combat').includes(${index})`));
 assert.match(run('currentEncounter().prompt()'), /\bFIGHT\b/);
 assert(run('currentEncounter().description()===currentEncounter().text'));
 assert.equal(run(`RoadScenarioRegistry.wo2Award('${key}')`), false);
 run("resolveEncounter('fight')");
 assert.equal(run('combatState.name'), opponent);
 assert.equal(run('combatState.wo2Reward'), undefined);
 assert.equal(run('combatState.bolts'), 0);
 run("combatState=null;stage='encounter';");
}

(async () => {
 for (const direction of [1, -1]) {
  run(`causewayPlayer();busy=false;causewayAt(6,${direction});outputQueue=Promise.resolve();lanternRoadMenu();`);
  await run('outputQueue');
  const click = async prefix => {
   const choices = read('GraphicalUI.choices()');
   const choice = choices.find(item => item.command.startsWith(prefix));
   assert(choice, `Missing menu action ${prefix}: ${JSON.stringify(choices)}`);
   await run(`GraphicalUI.dispatch(${JSON.stringify(choice)})`);
   await run('outputQueue');
  };
  assert.equal(run('saveSnapshot().player.flags.r127FinnDiscovered'), true);
  assert.equal(run("getSaveData('auto').player.flags.r127FinnDiscovered"), true);
  await click('visit old man finn');
  assert.equal(run('stage'), 'r127FinnStore');
  const art = run('GraphicalUI.model().art');
  assert.match(art, /old_man_finn_boat\.png$/);
  const png = fs.readFileSync(path.resolve(__dirname, '../../playtest', art));
  assert.equal(png.subarray(1,4).toString(), 'PNG');
  await click('buy supplies');
  const quantity = run("player.pack.find(i=>i.name==='Bandage')?.qty||0");
  await click('buy bandage');
  assert.equal(run("player.pack.find(i=>i.name==='Bandage')?.qty||0"), quantity + 1);
  await click('back');
  await click('sell items');
  await click('sell bandage');
  await click('confirm store sale');
  assert.equal(run("player.pack.find(i=>i.name==='Bandage')?.qty||0"), quantity);
  await click('back');
  await click('return to causeway');
  assert.equal(run('stage'), 'lanternRoad');
  assert.equal(run('lanternState().stepIndex'), 6);
  assert.equal(run('player.turns'), 100);
  assert(read('GraphicalUI.choices()').some(row => row.command === 'visit old man finn'));
  assert.match(run('Route127OldManFinn.mapMarker()'), /data-old-man-finn/);
 }
 // Capture the generated SVG from each real map renderer in the headless DOM.
 run(`const makeCausewayElement=document.createElement;
  let causewayMapSvg='';
  document.createElement=function(tag){
   const el=makeCausewayElement.call(this,tag);
   el.querySelector=()=>null;
   el.showModal=()=>{el.open=true;};
   el.close=()=>{el.open=false;};
   if(tag==='figure')Object.defineProperty(el,'innerHTML',{set(value){causewayMapSvg=value;}});
   return el;
  };
  player.flags.interfaceUnlocked=true;
  busy=false;
  Route127MapOverlay.open();
 `);
 assert.match(run('causewayMapSvg'), /data-old-man-finn/);
 run(`Route127MapOverlay.close();causewayMapSvg='';showMap();`);
 await run('outputQueue');
 assert.match(run('causewayMapSvg'), /data-old-man-finn/);
 run(`delete player.flags.r127FinnDiscovered;Route127MapOverlay.open();`);
 assert.doesNotMatch(run('causewayMapSvg'), /data-old-man-finn/);
 console.log('PASS Finn graphical dispatch, art reference, buy/sell, persisted discovery, both map renderers and zero-turn visits in both directions');
})().catch(error => {console.error(error);process.exitCode=1;});
