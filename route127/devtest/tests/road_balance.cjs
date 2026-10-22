// Headless integration audit: load every shipped script in index.html order.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const path=require('path');process.chdir(path.join(__dirname,'..'));
const el=()=>({classList:{add(){},remove(){},toggle(){},contains(){return false}},style:{},dataset:{},childNodes:[{}],children:[],appendChild(){},append(){},remove(){},addEventListener(){},setAttribute(){},getAttribute(){return null},querySelector(){return el()},querySelectorAll(){return []},focus(){},scrollIntoView(){},innerHTML:'',textContent:'',value:''});
const document={querySelector:()=>el(),querySelectorAll:()=>[],getElementById:()=>el(),createElement:()=>el(),addEventListener(){},body:el(),documentElement:el(),hidden:false};
const ctx=vm.createContext({document,console,Math:Object.create(Math),Date,Set,Map,JSON,Promise,URLSearchParams,location:{search:'',href:'http://localhost/index.html'},localStorage:{getItem(){return null},setItem(){},removeItem(){}},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},performance:{now:()=>0},requestAnimationFrame(){},window:{addEventListener(){},matchMedia:()=>({matches:false})},navigator:{},confirm:()=>true});
const run=s=>vm.runInContext(s,ctx);
for(const [,file] of fs.readFileSync('index.html','utf8').matchAll(/<script src="([^?]+)\?/g)){try{run(fs.readFileSync(file,'utf8'))}catch(e){throw new Error(file+': '+e.stack)}}
run(`r11SteveRoll=()=>false;let qaLog=[];add=(s)=>qaLog.push(String(s));addImmediate=()=>{};updateHud=()=>{};r5Scene=()=>{};r5DirectChoices=()=>{};v49Autosave=()=>{};updateNewQuestRoadProgress=()=>{};showSteveAnnouncement=()=>{};questRoadEvent=()=>false;isDark=()=>false;timePhase=()=> 'DAY';renderRoadMarkerActions=()=>[];testMode=false;player.flags.portRoadCleared=true;player.turns=1000000;portArrive=()=>{portState().position=5;stage='seaport';};arriveSettlement=()=>{stage='settlement';};arriveHouse=()=>{stage='house';};mercyMenu=()=>{stage='mercy';};player.flags.seaportRoute={position:0,cleared:{2:true,4:true},seen:{},arrived:true};let seed=127;const seeded=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};Math.random=seeded;`);
const stats={};
function settle(){
 const kind=run('player.flags.r10LastRoadCategory');
 if(run('stage')==='wandererRoad'){assert(run('!!currentRoadWanderer'));run("handleRoadWanderer('move on')");}
 else if(run('stage')==='encounter'){
  if(kind==='combat'){
   run(`constSpec=currentEncounter().combat||combatSpecs[currentEncounter().title];resolveEncounter((constSpec.action||combatTriggers[currentEncounter().title]?.[0]||'fight').toLowerCase());`);
   assert.equal(run('stage'),'combat');run("handleCombat('flee')");
  }else run('completeRoadTurn()'); // every individual choice tested separately below
 }
 assert(['turnComplete','r6Road'].includes(run('stage')));
}
for(const region of ['early','east','coast'])for(const dir of [1,-1]){
 const name=region+(dir>0?'East':'West'),counts={combat:0,wanderer:0,exploration:0,salvage:0,environment:0,uneventful:0};
 const unique=new Set(),byCategory={};let segments=0;
 run(`player.level=${region==='early'?3:region==='east'?6:8};player.flags.seaport55={freed:false};`);
 for(let trip=0;trip<300;trip++){
  const tripStart=run('player.turns');
  if(region==='early')run(`startRoadTrip('${dir>0?'mercy':'house'}',9);`);
  else run(`r6Begin('${region==='east'?'west':'coast'}',${dir});`);
  let limit=0;
  while(++limit<40){
   if(region!=='early'){
    const before=run('player.turns');run('r6Move()');assert.equal(run('player.turns'),before-1);segments++;
    if(!run('r6Road().active'))break;
   }else if(run('stage')==='fork'){
    // Free junction; departing into the next road segment charges exactly once.
    const before=run('player.turns');run('spendTurn();roadTurnCharged=true;showEncounter();');assert.equal(run('player.turns'),before-1);
   }
   const kind=run('player.flags.r10LastRoadCategory');counts[kind]++;
   if(run('stage')==='encounter'){
    const title=run('currentEncounter().title');unique.add(title);(byCategory[kind]??=new Set()).add(title);
    assert(!title.includes('QUIET MILE')&&!title.includes('LONG SHADOWS')&&!title.includes('SALT WIND THROUGH'));
   }
   const before=run('player.turns');settle();assert.equal(run('player.turns'),before);
   if(region==='early'){
    run('advanceRoad()');if(['house','settlement'].includes(run('stage')))break;
   }
  }
  assert(limit<40);assert.equal(tripStart-run('player.turns'),region==='early'?9:region==='east'?6:5);
  if(region==='early')segments+=9;
 }
 const triggered=Object.entries(counts).filter(([k])=>k!=='uneventful').reduce((s,[,n])=>s+n,0);
 for(const [kind,weight] of Object.entries({combat:.5,wanderer:.2,exploration:.15,salvage:.1,environment:.05}))assert(Math.abs(counts[kind]/triggered-weight)<.04,name+' '+kind);
 assert(byCategory.combat.size>3);assert(counts.uneventful>0);
 stats[name]={segments,triggered,...counts,uniqueScenes:unique.size,uniqueByCategory:Object.fromEntries(Object.entries(byCategory).map(([k,v])=>[k,v.size]))};
}
console.log(JSON.stringify(stats,null,2));
// Test every selected scenario's choices through shared resolver, both risk outcomes,
// available/full inventory, both travel orientations, without altering recruitment.
let choiceChecks=0;
for(const region of ['early','east','coast'])for(const dir of [1,-1])for(const kind of ['combat','exploration','salvage','environment']){
 for(const index of run(`R10_POOLS.${region}.${kind}`)){
  run(`if(r6Road())r6Road().active=false;roadGoal='${region==='early'?'mercy':'east'}';if('${region}'!=='early')r6Begin('${region==='east'?'west':'coast'}',${dir});`);
  const options=run(`(r10Pool('${region}')[${index}].prompt?r10Pool('${region}')[${index}].prompt():r10Pool('${region}')[${index}].choices).split(/\\s{2,}/).filter(Boolean)`);
  for(const option of options)for(const roll of [.1,.9])for(const full of [false,true]){
   run(`if(r6Road())r6Road().active=false;roadGoal='${region==='early'?'mercy':'east'}';roadTurn=1;roadTripLength=9;roadTurnCharged=true;roadEncounterOrder=Array(9).fill(${index});if('${region}'!=='early'){r6Begin('${region==='east'?'west':'coast'}',${dir});r6Road().pos=2;r6Road().pending=true;r6Road().index=${index};}stage='encounter';player.encounterDone={};player.hp=10000;player.maxHp=10000;player.bolts=100;player.level=8;player.pack=[{name:'Energy Bars',type:'consumable',qty:2},{name:'Bandage',type:'consumable',qty:2},{name:'Cloth',type:'material',qty:2},{name:'Battered Flashlight',type:'tool',qty:1}];player.packMax=${full?4:12};Math.random=()=>${roll};`);
   const before=run('player.turns');run('qaLog=[];');run(`resolveEncounter(${JSON.stringify(option.toLowerCase().replace(/^\([a-z]\)\s*/,''))});`);assert(!run(`qaLog.some(s=>/not an option/i.test(s))`)||run(`qaLog.some(s=>/full|nothing traded/i.test(s))`),region+': rejected '+option);
   if(run('stage')==='combat')run("handleCombat('flee')");
   assert.equal(run('player.turns'),before,'choice charged turn');
   assert(['encounter','turnComplete','r6Road'].includes(run('stage')),region+': '+option+' '+run('stage'));
   if(run('stage')==='encounter')run('completeRoadTurn()');
   choiceChecks++;
  }
 }
}
// Safeguard: disabled before liberation, increases after ten eligible segments,
// resets on an eligible meeting, and remains available with four roles staffed.
run(`Math.random=seeded;player.flags.seaport55={freed:false};player.flags.r10RecruitDrySegments=30;`);assert.equal(run('r10WandererChance()'),.2);
run(`player.flags.seaport55.freed=true;player.flags.r10RecruitDrySegments=10;`);assert.equal(run('r10WandererChance()'),.2);
run('player.flags.r10RecruitDrySegments=15;');assert(Math.abs(run('r10WandererChance()')-.35)<1e-8);
run(`player.flags.seaportStaff={hired:wanderers.slice(0,4).map(w=>w.name),assignments:Object.fromEntries(Object.keys(PORT_STAFF_ROLES).map((role,i)=>[role,wanderers[i].name]))};r6Begin('coast',1);r6Road().pos=1;r6Road().pending=true;let qaRolls=[0,.1];Math.random=()=>qaRolls.length?qaRolls.shift():.5;r10PrepareEncounter();`);
assert.equal(run('stage'),'wandererRoad');assert.equal(run('player.flags.r10RecruitDrySegments'),0);assert(run('portRecruitEligible(wandererByName(currentRoadWanderer))'));assert(!run('portIsHired(currentRoadWanderer)'));
// With no living unhired wanderer the remaining categories still run, no recursion.
run(`wanderers.forEach(w=>ws(w.name).dead=true);Math.random=()=>.1;stage='encounter';r10PrepareEncounter();`);assert.equal(run('player.flags.r10LastRoadCategory'),'combat');run('wanderers.forEach(w=>ws(w.name).dead=false);');
// Saved encounter redraw does not reroll, spend, or advance safeguard/history.
run(`resumeSavedEncounter=true;player.flags.r10RecruitDrySegments=13;const savedIndex=r6Road().index;Math.random=()=>{throw Error('redraw rolled RNG');};r10PrepareEncounter();`);assert.equal(run('player.flags.r10RecruitDrySegments'),13);assert.equal(run('r6Road().index'),run('savedIndex'));run('resumeSavedEncounter=false;Math.random=seeded;');
// No immediate scene repeats with alternatives; history survives serialized flags.
run(`player.flags.r10RoadHistory={};`);
for(let i=0;i<100;i++){const index=run("r10Pick('coast','combat')");assert(!run(`(player.flags.r10RoadHistory['coast:combat']||[]).includes(eastEncounters[${index}].title)`));run(`r10Remember('coast','combat',${index});player.flags=JSON.parse(JSON.stringify(player.flags));`);}
console.log('PASS: '+choiceChecks+' scenario choice/risk/capacity/direction checks; baseline distribution, populated/empty roster, safeguard, saved-redraw and history checks.');
console.log('POOLS '+run('JSON.stringify(Object.fromEntries(Object.entries(R10_POOLS).map(([r,p])=>[r,Object.fromEntries(Object.entries(p).map(([k,ids])=>[k,ids.length]))])))'));
// Exact donation/reward behavior and every mid/coast fight's actual victory routing.
for(const region of ['east','coast'])for(const index of run(`R10_POOLS.${region}.combat`)){
 run(`r6Begin('${region==='east'?'west':'coast'}',-1);r6Road().pos=2;r6Road().pending=true;r6Road().index=${index};stage='encounter';resolveEncounter('fight');combatState.hp=1;if(combatState.enemies)combatState.enemies.forEach(e=>e.hp=0);player.hp=10000;handleCombat('attack');`);
 assert.equal(run('stage'),'r6Road');assert.equal(run('combatState'),null);
}
run(`r6Begin('coast',1);r6Road().pos=1;r6Road().pending=true;r6Road().index=R9_COAST_SCENES.find(i=>eastEncounters[i].title==='A DRESSING IN THE DUST');stage='encounter';player.encounterDone={};player.pack=[{name:'Bandage',type:'consumable',qty:1}];player.bolts=10;resolveEncounter('offer a bandage');`);assert.equal(run('player.bolts'),13);assert.equal(run("!!findItem('Bandage')"),false);
run(`r6Road().pending=true;stage='encounter';player.encounterDone={};resolveEncounter('offer a bandage');`);assert.equal(run('stage'),'encounter');run("resolveEncounter('move on')");assert.equal(run('stage'),'r6Road');
// Current and legacy coast encounter indices remain usable across this update.
run(`r6Road().pending=true;stage='encounter';`);const snapshot=run('saveSnapshot()');assert.equal(snapshot.player.flags.r6Road.index,run('r6Road().index'));
console.log('PASS: all 16 mid/coast combat victories, exact donation cost/reward, missing supplies and save snapshot.');
// Safeguard counts uneventful eligible segments too, with no guarantee at its cap.
run(`player.flags.seaport55={freed:true};player.flags.r10RecruitDrySegments=0;Math.random=()=>.99;r6Begin('coast',1);r6Road().pos=1;`);
for(let i=0;i<12;i++){run('r6Road().pending=true;r10PrepareEncounter();');assert.equal(run('player.flags.r10RecruitDrySegments'),i+1);}
assert(Math.abs(run('r10WandererChance()')-.26)<1e-8);run('player.flags.r10RecruitDrySegments=100;');assert.equal(run('r10WandererChance()'),.5);
run(`player.flags.seaport55.freed=false;r6Road().pending=true;Math.random=()=>.99;r10PrepareEncounter();`);assert.equal(run('player.flags.r10RecruitDrySegments'),0);
// Current baseline selection always excludes removed quiet cards.
assert.equal(run('Object.values(R10_POOLS.coast).flat().some(i=>eastEncounters[i].category==="quiet")'),false);
console.log('PASS: segment-based safeguard growth/cap/reset before liberation and no selectable quiet cards.');
(async()=>{
 for(const leg of ['west','coast']){
  run(`r6Begin('${leg}',1);r6Road().pos=2;busy=false;outputQueue=Promise.resolve();qaLog=[];`);const before=run('player.turns');
  await run("handleCommandCore('reverse direction')");assert.equal(run('r6Road().dir'),-1);assert.equal(run('player.turns'),before);
  run('Math.random=()=>.99;busy=false;qaLog=[];');await run("handleCommandCore('continue')");assert.equal(run('player.turns'),before-1);assert.equal(run('r6Road().pos'),1);assert.equal(run('stage'),'r6Road');
  assert.equal(run("qaLog.filter(s=>s.includes('ROAD PROGRESS')).length"),1);assert.equal(run("qaLog.filter(s=>s.includes('TURN COMPLETE')).length"),1);
  assert(run(`qaLog.some(s=>s.includes('heading WEST toward ${leg==='west'?'Solace':'the Factory'}'))`));
  run('player.turns=0;busy=false;');const pos=run('r6Road().pos');await run("handleCommandCore('continue')");assert.equal(run('r6Road().pos'),pos);assert.equal(run('player.turns'),0);run('player.turns=1000000;');
 }
 // Fixed branches: reverse steps and fast-return preserve their existing costs.
 for(const branch of ['serviceRoad','relayBranch']){
  run(`if(r6Road())r6Road().active=false;stage='${branch}';serviceRoadDepth=2;busy=false;`);let before=run('player.turns');await run("handleCommandCore('walk back')");assert.equal(run('serviceRoadDepth'),1);assert.equal(run('player.turns'),before-1);
  run(`stage='${branch}';serviceRoadDepth=2;busy=false;`);before=run('player.turns');await run("handleCommandCore('fast return')");assert.equal(run('stage'),'fork');assert.equal(run('player.turns'),before-2);
 }
 // Early-road reversal and departure from the free fork use the legacy command path.
 run(`if(r6Road())r6Road().active=false;roadGoal='mercy';roadTripLength=9;roadTurn=1;roadTurnCharged=true;stage='turnComplete';busy=false;currentHotkeys={};numberedChoices={};`);
 let beforeEarly=run('player.turns');await run("handleCommandCore('reverse direction')");assert.equal(run('roadGoal'),'house');assert.equal(run('player.turns'),beforeEarly);
 run('busy=false;Math.random=()=>.99;');await run("handleCommandCore('continue')");assert.equal(run('player.turns'),beforeEarly-1);assert.equal(run('stage'),'turnComplete');
 run(`roadGoal='mercy';roadTurn=4;roadTurnCharged=false;stage='fork';busy=false;currentHotkeys={};numberedChoices={};`);beforeEarly=run('player.turns');await run("handleCommandCore('continue to solace')");assert.equal(run('player.turns'),beforeEarly-1);assert.equal(run('stage'),'turnComplete');
 console.log('PASS: real reverse/continue commands, zero-turn blocking, direction output, single progress/completion messages, fixed branch return costs.');
})().catch(e=>{console.error(e);process.exitCode=1;});
