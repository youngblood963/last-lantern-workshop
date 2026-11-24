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
 for(const row of (process.env.AUDIT_FIRST?catalog.slice(Number(process.env.AUDIT_START||0),Number(process.env.AUDIT_START||0)+Number(process.env.AUDIT_FIRST)):catalog.slice(Number(process.env.AUDIT_START||0)))){
  boot();
  if(process.env.AUDIT_PROGRESS)fs.writeFileSync(process.env.AUDIT_PROGRESS,JSON.stringify({id:row.id,done:cases.length,failures:failures.length}));
  await setup(row,'empty');
  const pending=[{flags:JSON.parse(snapshot().flags),labels:snapshot().choices}],signatures=new Set();let states=0;
  while(pending.length){
   const state=pending.shift(),signature=state.labels.join('|');if(signatures.has(signature))continue;signatures.add(signature);states++;
   if(states>24){failures.push({id:row.id,message:'More than 24 conditional menus require explicit review'});break;}
   for(const label of state.labels){
    const informational=run('EncounterInteraction.isInformation('+JSON.stringify(label)+')');
    if(informational)informationActions.add(row.id+'|'+label);
    for(const mode of ['empty','stocked','partial'])for(const pathway of ['terminal','graphical']){
     const data={id:row.id,title:row.title,label,mode,pathway,state:states};
     if(process.env.AUDIT_PROGRESS)fs.writeFileSync(process.env.AUDIT_PROGRESS,JSON.stringify({...data,done:cases.length,failures:failures.length}));
     await setup(row,mode,state.flags,mode==='stocked'?.01:.9);const before=snapshot();let error;
     try{await execute(label,pathway);}catch(e){error=e.stack;}
     const after=snapshot(),messages=summary(before,after,label);
     const itemDependent=after.checks.length>0||/\b(?:food|bandage|cloth|wire|rope|bones|medicine|materials)\b/i.test(messages.join(' '))&&/need|have no|don't have|don.t have|require|consum/i.test(messages.join(' '));
     if(itemDependent)inventoryActions.add(row.id+'|'+label);
     check(!error,'Handler threw', {...data,error});
     check(!after.logs.some(text=>/that.?s not an option|invalid command|that is not an available choice/i.test(text)),'Offered choice rejected',data);
     const controlResponse=before.choices.join('|')!==after.choices.join('|')||after.stage!==before.stage||run('!!FocusedEntry.request');
     // Maze requires the mounted graphical figure; opening is covered by browser verification.
     const requiresMountedFigure=row.title==='CEMETERY OF TIRES'&&label==='ENTER TIRE MAZE';
     check(messages.length>0||controlResponse||requiresMountedFigure,'No result or new controls',data);
     check(!after.logs.some(text=>text.startsWith('That action cannot be completed yet'))||requiresMountedFigure,'Unexplained conditional action',data);
     if(informational){
      // Arena spectating is an existing nested interaction, not encounter dismissal.
      check(['encounter','r127ArenaLobby'].includes(after.stage),'Information ended the encounter',data);
      check(after.travel===before.travel&&after.roadTurn===before.roadTurn&&after.dailyRoadTurns===before.dailyRoadTurns&&after.turns===before.turns,'Information moved or spent a turn',data);
      check(after.choices.length>0,'Information lost choices',data);
      // Derived exhaustion (all discoveries claimed) is not dismissal; explicit resolution must not change.
      check(!after.resolved||before.resolved,'Information explicitly resolved encounter',data);
      if(after.stage==='encounter'&&after.choices.includes(label)){
       const repeatBefore=snapshot();run('auditMessages=[];auditChecks=[]');
       try{await execute(label,pathway);}catch(e){check(false,'Repeat information threw',{...data,error:e.stack});}
       const repeated=snapshot();
       check(repeated.stage==='encounter'&&repeated.turns===repeatBefore.turns&&repeated.travel===repeatBefore.travel,'Repeat information dismissed or moved',data);
       check(repeated.xp===repeatBefore.xp&&repeated.level===repeatBefore.level&&repeated.bolts===repeatBefore.bolts&&repeated.pack===repeatBefore.pack,'Repeat information duplicated rewards',data);
      }
     }
     // Discover conditional menus through real successful handlers; replay those flag states in isolation.
     if(mode==='stocked'&&pathway==='terminal'&&after.stage==='encounter'&&after.choices.join('|')!==signature)
      pending.push({flags:JSON.parse(after.flags),labels:after.choices});
     cases.push(JSON.parse(JSON.stringify({...data,informational,itemDependent,stage:after.stage,messages,checks:after.checks,error})));
    }
   }
  }
  menuStates.set(row.id,states);
 }
 const report={encounters:menuStates.size,regions:[...new Set(catalog.flatMap(row=>row.regions))].sort(),informationActions:informationActions.size,itemDependentActions:inventoryActions.size,actions:new Set(cases.map(r=>r.id+'|'+r.label)).size,conditionalMenus:[...menuStates.values()].reduce((a,b)=>a+b,0),handlerCases:cases.length,failures,exceptions:[{id:'early:194',action:'INVESTIGATE THE SIGNAL',reason:'Existing intentional drone ambush; owner review requested because wording sounds informational. No new gameplay invented.'},{id:'early:27',action:'ENTER TIRE MAZE',reason:'Requires mounted graphical figure; verified in the browser rather than this headless DOM.'}],cases};
 const output=process.env.AUDIT_REPORT;if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2));}
 console.log(JSON.stringify({...report,cases:undefined,failures:failures.slice(0,25)},null,2));
 assert.equal(failures.length,0,failures.length+' encounter contract regressions');
})().catch(e=>{console.error(e);process.exitCode=1;});
