/* Actual DEVTEST handlers, isolated saves, no network or storyline playthrough. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const create=require('./helpers/wo33_dom.cjs');let run,flush,ctx;
const walk=n=>[n,...n.children.flatMap(walk)];
const fixture=require('./fixtures/encounter-audit-items.json');
const instrumentation=`globalThis.auditRows=[...new Map([...RoadScenarioRegistry.regionalCatalog,...RoadScenarioRegistry.entries].map(row=>[row.id,row])).values()];
 globalThis.auditEncounter=null;globalThis.auditMessages=[];globalThis.auditChecks=[];globalThis.auditCalled=false;
 const auditAdd=add;add=function(text,...args){auditMessages.push(String(text??''));return auditAdd.call(this,text,...args)};
 const auditImmediate=addImmediate;addImmediate=function(text,...args){auditMessages.push(String(text??''));return auditImmediate.call(this,text,...args)};
 const auditRequirement=EncounterInteraction.requirement;EncounterInteraction.requirement=function(name,need=1,have){const result=auditRequirement.call(this,name,need,have);if(EncounterInteraction.active)auditChecks.push({name,need,have:result});return result;};
 for(const row of auditRows){const native=row.encounter.resolve;row.encounter.resolve=function(...args){auditCalled=true;return native.apply(this,args)};}
 currentEncounter=()=>auditEncounter;GraphicalUI.active=()=>true;
 `;
function boot(){({run,flush,ctx}=create());ctx.fetch=()=>{throw Error('No service access');};ctx.window.removeEventListener=()=>{};run(instrumentation);}
boot();
const fixtureTypes=fixture.map(name=>({name,type:run('v52ItemType('+JSON.stringify(name)+')')}));
const catalog=run(`auditRows.map((row,index)=>({index,id:row.id,title:row.encounter.title,regions:row.regions||[],classification:row.classification}))`);
const failures=[],cases=[],menuStates=new Map(),inventoryActions=new Set(),informationActions=new Set();
const check=(ok,message,data)=>{if(!ok){failures.push({message,...data});if(process.env.AUDIT_STOP_AT_FAILURE){console.error(JSON.stringify({message,...data,logs:run('auditMessages'),bindings:run('numberedChoices')},null,2));throw Error(message);}}};
async function drain(){
 for(const d of walk(ctx.document.body).filter(n=>n.classList?.contains('r127-scenario-results'))){const b=d.children.find(n=>n.tagName==='BUTTON');for(const fn of b?.events.click||[])await fn({currentTarget:b});}
 run('FocusedEntry.close();FocusedEntry.dismissed=null');await flush();
}
async function setup(row,mode,flags={},random=.9){
 await drain();
 const pack=mode==='empty'?[]:fixtureTypes.map(item=>({...item,qty:mode==='partial'?1:100}));
 run(`resetPlayer();player.handle='Interaction Audit';player.level=10;player.hp=10000;player.maxHp=10000;player.turns=100;player.bolts=${mode==='empty'?0:100000};player.packMax=1000;player.pack=${JSON.stringify(pack)};
  Object.assign(player.flags,${JSON.stringify(flags)});player.flags.interfaceUnlocked=true;player.flags.mercyDiscovered=true;player.flags.murphyRideLevel10Astrid=true;
  lanternMigrate();Object.assign(lanternState(),{currentEdgeId:'house--solace-upper-junction',stepIndex:1,pending:true,encounterRegion:'early',encounterIndex:0,sceneId:'audit:'+${JSON.stringify(row.id)}});lanternProject();
  stage='encounter';busy=false;commandProcessing=false;combatState=null;dailyRoadTurns=1;returnStage=null;auditEncounter=auditRows[${row.index}].encounter;Math.random=()=>${random};resultBuffer=null;outputQueue=Promise.resolve();screen.replaceChildren();numberedChoices={};currentHotkeys={};renderCurrentChoices();`);
 await flush();run('auditMessages=[];auditChecks=[];auditCalled=false');
}
function snapshot(){return run(`({stage,turns:player.turns,roadTurn,dailyRoadTurns,xp:player.xp,level:player.level,bolts:player.bolts,pack:JSON.stringify(player.pack),travel:JSON.stringify(lanternState()),flags:JSON.stringify(player.flags),choices:(auditEncounter.prompt?auditEncounter.prompt():auditEncounter.choices).split(/\\s{2,}/).filter(Boolean),logs:[...auditMessages],checks:[...auditChecks],called:auditCalled,lifecycleDone:RoadLifecycle.done(auditEncounter),resolved:!!RoadLifecycle.record(RoadLifecycle.entry(auditEncounter)?.id,false).resolved})`);}
async function execute(label,pathway){
 if(pathway==='graphical'){
  const command=run('choiceCommand('+JSON.stringify(label)+')');
  const choices=run('GraphicalUI.choices()'),choice=choices.find(row=>row.command===command);
  assert(choice,'Missing graphical binding for '+label);
  await run('GraphicalUI.dispatch('+JSON.stringify(choice)+')');
 }else await run('handleCommand('+JSON.stringify(label.toLowerCase())+')');
 await flush();
 for(const node of walk(ctx.document.body).filter(n=>n.classList?.contains('r127-scenario-results')))ctx.auditMessages.push(node.textContent);
}
function summary(before,after,label){
 const menu=new Set([...before.choices,...after.choices].map(x=>x.toLowerCase()));
 const messages=after.logs.filter(text=>text.trim()&&!text.startsWith('>')&&!text.startsWith('ASTRID >')&&!text.includes('   ')&&!/^\[\d+\]/.test(text)&&!menu.has(text.toLowerCase()));
 return messages;
}
(async()=>{
 const row=id=>catalog.find(r=>r.id===id);
 const prepare=async(id,pack=[],flags={})=>{boot();await setup(row(id),'empty',flags);run('player.pack='+JSON.stringify(pack));};
 for(const name of ['Energy Bars','Raw Rat Meat','Raw Rabbit Meat','Raw Chicken Meat','Raw Boar Meat','Raw Venison','Raw Wolf Meat']){
  await prepare('early:50',[{name,type:'consumable',qty:1}]);await execute('OFFER FOOD','graphical');assert.equal(run('player.flags.r18HoundFed'),true,name);assert.equal(run('player.pack.length'),0);
 }
 for(const pack of [[],[{name:'Energy Bars',type:'consumable',qty:0}],[{name:'Fresh Potato',type:'consumable',qty:1}]]){
  await prepare('early:50',pack);await execute('OFFER FOOD','graphical');assert.match(snapshot().logs.join(' '),/don.t have any food suitable/);assert.equal(snapshot().stage,'encounter');assert(snapshot().choices.includes('OFFER FOOD'));assert(!run('player.flags.r18HoundFed'));
 }
 for(const name of ['Bandage','Cloth']){
  await prepare('early:50',[{name,type:name==='Cloth'?'material':'consumable',qty:1}],{r18HoundMetalRemoved:true});await execute('TREAT WITH BANDAGE OR CLOTH','terminal');assert.equal(run('player.flags.r18HoundTreated'),true);
 }
 await prepare('early:50',[],{r18HoundMetalRemoved:true});await execute('TREAT WITH BANDAGE OR CLOTH','graphical');assert.match(snapshot().logs.join(' '),/don.t have a Bandage or Cloth/);assert.equal(snapshot().stage,'encounter');
 await prepare('east:17');const wax=snapshot();await execute('INSPECT THE DISPLAY','graphical');assert.match(snapshot().logs.join(' '),/human remains/);assert.equal(snapshot().stage,'encounter');assert.deepEqual(snapshot().choices,wax.choices);assert.equal(snapshot().turns,100);
 for(const qty of [0,1,9,10]){
  await prepare('east:26',[{name:'Small Animal Bones',type:'material',qty}]);await execute('LEARN SERRATED EDGE — 10 SMALL ANIMAL BONES','graphical');if(qty<10){assert.equal(snapshot().stage,'encounter');assert.match(snapshot().logs.join(' '),/need|require|have/i);assert.equal(run('player.pack[0].qty'),qty);}else {assert.equal(run("EquipmentMods.learned('serrated')"),true);assert.equal(run("r6MaterialCount('Small Animal Bones')"),0);}
 }
 await prepare('east:26',[{name:'Raw Rat Meat',type:'consumable',qty:1}]);await execute('SELL RAW MEAT FOR 3 BOLTS','graphical');assert.match(snapshot().logs.join(' '),/collector pays 3 Bolts/);
 await prepare('east:10');await execute('INSPECT FLAGS','graphical');assert.equal(snapshot().stage,'encounter');await execute('FIGHT THE HUNTERS','terminal');assert.equal(run('combatState.r18BoneKnowledge'),true);assert.equal(run('combatState.r18BoneSnareAvailable'),true);
 await prepare('east:17',[{name:'Cloth',type:'material',qty:1}]);assert.equal(run("removeItem('Cloth',2)"),false);assert.equal(run('player.pack[0].qty'),1);assert.equal(run("removeItem('Cloth',1)"),true);
 console.log('PASS: Collector retains all choices/turns; Hound seven accepted foods, zero/unaccepted food and treatment alternatives; recipe quantities 0/1/9/10; consumable meat trade; atomic quantity removal; inspected combat advantage');
})().catch(e=>{console.error(e);process.exitCode=1;});
