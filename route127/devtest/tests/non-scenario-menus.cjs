/* Execute offered non-encounter commands and replay nested paths in isolated DEVTEST engines. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const create=require('./helpers/menu_audit.cjs'),roots=require('./fixtures/menu-audit-roots.json');
const supplies=require('./fixtures/non-scenario-items.json');
const profiles=['poor','supplied','full'];
const reports=[],menus=new Map(),issues=[],duplicates=[],truncations=[];
let game,run,flush;const globalSeen=new Set();
async function boot(root,profile,path=[]){
 if(!game||process.env.MENU_FRESH){game=create();({run,flush}=game);await flush();game.auditIntervals=new Map();let timerId=0;game.ctx.setInterval=callback=>{const id=++timerId;game.auditIntervals.set(id,callback);return id;};game.ctx.clearInterval=id=>game.auditIntervals.delete(id);run('globalThis.menuInitialWandererLocations=JSON.stringify(wandererLocations)');}
 game.auditIntervals.clear();await flush();run('FocusedEntry.close();FocusedEntry.dismissed=null;if(TravelerPanels.dialog){TravelerPanels.working=false;TravelerPanels.close();}Route127MapOverlay.close();Route127Community.close();SeaportRoomChest.close()');await flush();run("stage='mercy';GraphicalUI.sync();");game.storage.clear();
 run(`resetPlayer();wandererLocations=JSON.parse(menuInitialWandererLocations);currentTownWanderer=null;currentRoadWanderer=null;townWandererFocus=null;pendingTownFight=null;resultBuffer=null;r5Credits=null;v53PendingWandererMenu=null;v53LastMenuContext='';v53LastMenuSerial=-1;roadTurn=0;dailyRoadTurns=0;roadGoal='mercy';roadTripLength=10;roadTurnCharged=false;serviceRoadDepth=0;day=1;inventoryMode=null;resumeSavedEncounter=false;player.handle='Menu Auditor';player.level=10;player.hp=70;player.maxHp=100;player.turns=100;player.bolts=${profile==='poor'?0:10000};player.bankBolts=250;player.packMax=${profile==='full'?1:200};player.pack=${JSON.stringify(profile==='poor'?[]:supplies.map(item=>({...item,qty:profile==='full'||['weapon','armor','tool','quest'].includes(item.type)?1:100})))};
 if(${JSON.stringify(profile)}==='full')player.packMax=packSlotsUsed();
 player.flags.interfaceUnlocked=true;player.flags.mercyDiscovered=true;player.flags.murphyRideLevel10Astrid=true;player.flags.worldHour=12;
 lanternMigrate();lanternState().currentEdgeId=null;lanternState().pending=false;
 stage='mercy';mercyLocation='town';busy=false;commandProcessing=false;combatState=null;returnStage=null;screen.replaceChildren();outputQueue=Promise.resolve();GraphicalUI.active=()=>${process.env.MENU_GRAPHICS?'true':'false'};GraphicalUI.preferred=${JSON.stringify(process.env.MENU_GRAPHICS?'graphics':'classic')};numberedChoices={};currentHotkeys={};Math.random=()=>.8;
 {${root.setup}}`);
 await flush();
 for(const step of path){await run('handleCommand('+JSON.stringify(step)+')');await flush();}
 run('menuAuditMessages=[]');
}
async function finishExhibition(){
 // Execute the real timed exhibition callbacks in controlled time; the offline
 // DOM otherwise deliberately suppresses intervals. No gameplay is mocked.
 if(run("stage==='r127ArenaLobby'&&GraphicalUI.choices().length===0")){
  for(let tick=0;tick<40&&game.auditIntervals.size;tick++){for(const callback of [...game.auditIntervals.values()])callback();await flush();}
 }
}
function state(){return JSON.parse(run(`JSON.stringify({stage,location:mercyLocation,turns:player.turns,roadTurn,travel:lanternState(),pack:player.pack,bolts:player.bolts,hp:player.hp,flags:player.flags,selected:inventoryMode?.item,game:r6Round()?.game||player.flags.casino?.round?.game,choices:GraphicalUI.choices(),terminalChoices:[...Object.entries(numberedChoices),...Object.entries(currentHotkeys)].map(([key,command])=>({key,command,label:command})),messages:menuAuditMessages,modal:!!(TravelerPanels.dialog||Route127MapOverlay.dialog||FocusedEntry.dialog||Route127Community.isOpen?.()||document.body.querySelectorAll('dialog').some(d=>d.open)||document.body.querySelectorAll('[role=dialog]').length>0),entry:FocusedEntry.describe()?.key})`));}
function signature(s){
 const normalize=rows=>{const list=(rows||[]).map(c=>c.command.replace(/ ×\d+$/, ' ×QTY'));const prefix=['sell ','stash ','retrieve ','store ','withdraw ','deposit '].find(p=>list.filter(c=>c.startsWith(p)).length>5);return prefix?[prefix+'<item-list>',...list.filter(c=>!c.startsWith(prefix))]:list;};
 return JSON.stringify([s.stage,s.location,normalize(s.choices),normalize(s.terminalChoices),(['inventoryItem','confirmDrop'].includes(s.stage)?s.selected:null),(/casino/i.test(s.stage+'|'+s.location)?s.game:null),s.flags.v53Sale?.name,s.flags.portStaffUI?.role,s.flags.portStaffUI?.page,(s.flags.portStaffUI?.page==='replace'?s.flags.portStaffUI.candidate:null),(s.flags.portStaffUI?.page==='saleConfirm'?s.flags.portStaffUI.item:null),s.flags.portHireOffer?.name,s.flags.devCraftQuote?.key,(s.flags.r18FoodDraft?{key:s.flags.r18FoodDraft.key,selectedKinds:Object.keys(s.flags.r18FoodDraft.selected).sort()}:null),s.entry||'',s.modal]);
}
function meaningful(s,prior){const commands=new Set([...s.choices,...prior.choices].flatMap(c=>[c.command,c.label]).map(x=>x.toLowerCase()));return s.messages.filter(x=>x.trim()&&!/^>/.test(x)&&!/^\[\d+\]/.test(x)&&!x.includes('   ')&&!commands.has(x.toLowerCase())&&!/^\([A-Z]\) /.test(x));}
const nav=c=>/^(?:back(?: |$)|return(?: |$)|go back|cancel(?: |$)|leave(?: |$)|exit(?: |$)|never mind|town$)/i.test(c.command);
const excluded=s=>s.stage==='encounter'||s.stage==='combat'||s.stage==='fallen'||s.stage==='title'||s.stage==='handle';
(async()=>{
 const selected=process.env.MENU_ROOT?roots.filter(r=>process.env.MENU_ROOT.split(',').includes(r.id)):roots;
 for(const root of selected)for(const profile of (process.env.MENU_PROFILE?[process.env.MENU_PROFILE]:profiles)){
  game=null;const queue=[[]],seen=new Set();let count=0;
  while(queue.length){const path=queue.shift();let before;
   try{await boot(root,profile,path);before=state();}catch(e){issues.push({root:root.id,profile,path,kind:'setup',error:e.stack});continue;}
   const sig=signature(before);if(seen.has(sig)||excluded(before))continue;seen.add(sig);const conditional=JSON.stringify(Object.fromEntries(Object.entries(before.flags).filter(([k])=>/Quest$|Quests$|Bounty$|^v49RecipeBandage$|^rustyRoomOwned$|^r6AnchorRoomOwned$/.test(k))));const globalKey=profile+'|'+sig+'|'+conditional;if(globalSeen.has(globalKey))continue;globalSeen.add(globalKey);count++;
   if(count>Number(process.env.MENU_LIMIT||150)){truncations.push({root:root.id,profile,reason:'menu limit',pending:queue.length});break;}
   menus.set(root.id+'|'+profile+'|'+sig,{root:root.id,profile,path,stage:before.stage,location:before.location,choices:before.choices});
   const outcomes=[];
   const offered=new Map();for(const c of before.choices)offered.set(c.command,{...c,pathways:['graphical']});for(const c of before.terminalChoices){if(offered.has(c.command))offered.get(c.command).pathways.push('terminal');else offered.set(c.command,{...c,pathways:['terminal']});}
   for(const choice of offered.values()){
    const parity=[];
    if(process.env.MENU_PROGRESS)fs.writeFileSync(process.env.MENU_PROGRESS,JSON.stringify({root:root.id,profile,path,stage:before.stage,choice:choice.command,menus:menus.size,cases:reports.length,issues:issues.length}));
    for(const pathway of [...new Set(choice.pathways)].sort().reverse()){
     await boot(root,profile,path);const start=state();let error;
     try{if(pathway==='terminal')await run('handleCommand('+JSON.stringify(choice.command)+')');else await run('GraphicalUI.dispatch('+JSON.stringify(choice)+')');await flush();await finishExhibition();}catch(e){error=e.stack;}
     const after=state(),feedback=meaningful(after,start),data={root:root.id,profile,path,stage:start.stage,location:start.location,choice:choice.command,pathway};
     const changed=signature(after)!==signature(start)||after.bolts!==start.bolts||after.hp!==start.hp||JSON.stringify(after.pack)!==JSON.stringify(start.pack)||JSON.stringify(after.flags)!==JSON.stringify(start.flags);
     if(error)issues.push({...data,kind:'throw',error});
     if(after.messages.some(t=>/invalid command|that.?s not an option|that is not an available choice/i.test(t)))issues.push({...data,kind:'invalid',messages:feedback});
     if(!changed&&!feedback.length&&!after.modal)issues.push({...data,kind:'echo',messages:after.messages});
     if(!after.choices.length&&!after.modal&&!after.entry&&!excluded(after))issues.push({...data,kind:'stranded',after:after.stage,messages:feedback});
     if(process.env.MENU_ISSUES&&issues.length)fs.writeFileSync(process.env.MENU_ISSUES,JSON.stringify(issues,null,2));
     parity.push({pathway,result:JSON.stringify([after.stage,after.location,after.turns,after.bolts,after.hp,after.pack,after.choices.map(c=>c.command)])});
     reports.push({...data,after:after.stage,afterLocation:after.location,feedback,error});
     if(pathway==='terminal'){
      if(nav(choice))outcomes.push({choice:choice.command,destination:signature(after),turns:after.turns,startTurns:start.turns,flags:JSON.stringify(after.flags),travel:JSON.stringify(after.travel)});
      if(path.length<Number(process.env.MENU_DEPTH||7)&&!excluded(after)&&!after.modal&&!after.entry&&signature(after)!==sig)queue.push([...path,choice.command]);
     }
    }
    if(parity.length===2&&parity[0].result!==parity[1].result)issues.push({root:root.id,profile,path,choice:choice.command,kind:'dispatch-parity',parity});
   }
   for(let i=0;i<outcomes.length;i++)for(let j=i+1;j<outcomes.length;j++)if(outcomes[i].destination===outcomes[j].destination&&outcomes[i].flags===outcomes[j].flags&&outcomes[i].travel===outcomes[j].travel&&outcomes[i].turns===outcomes[j].turns)duplicates.push({root:root.id,profile,path,stage:before.stage,location:before.location,commands:[outcomes[i].choice,outcomes[j].choice]});
  }
 }
 const result={menus:menus.size,actions:new Set(reports.map(r=>r.root+'|'+r.profile+'|'+r.stage+'|'+r.location+'|'+r.choice)).size,nestedPaths:[...menus.values()].filter(m=>m.path.length).length,cases:reports.length,issues,duplicates,truncations,menuCoverage:[...menus.values()],reports};
 if(process.env.MENU_REPORT)fs.writeFileSync(process.env.MENU_REPORT,JSON.stringify(result,null,2));
 console.log(JSON.stringify({...result,issues:issues.slice(0,35),duplicates:duplicates.slice(0,30),menuCoverage:undefined,reports:undefined},null,2));
 if(process.env.MENU_ASSERT)assert.equal(issues.length+duplicates.length+truncations.length,0);
})().catch(e=>{console.error(e);process.exitCode=1;});
