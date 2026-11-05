/* Route 127 / DEVTEST — Factory navigation and main-quest stabilization.
 * UI adapters preserve saved dungeon/room state, combat, loot, turns and original
 * factoryCommand numeric input. No map topology or production entrypoint changes.
 */
(()=>{
'use strict';
if(!/\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname))return;
if(typeof FACTORY_FLOORS==='undefined'||typeof GraphicalUI==='undefined')return;
const floors=['LOADING & RECEIVING','PRODUCTION & ASSEMBLY','CHEMICAL PROCESSING','RESTRICTED BASEMENT'];
const bossNames=['Salvage King','Grinder','The Chemist','The Foreman'];
function resultFlags(){
 const f=player.flags,d=f.factoryDungeon?.done||[];
 return {f,done:d,met:!!(f.r5ForgeBriefed||f.devForgeTalked),all:[0,1,2,3].every(n=>d.includes(n))};
}
function isChargeReady(){
 const f=player.flags;
 return !!(f.portChargePrepared&&!f.portRoadCleared&&
  (player.pack||[]).some(i=>i.name==='Prepared Dynamite Charge'&&i.qty>0));
}
function factoryChoices(){
 const st=String(stage||''),state=typeof factoryState==='function'?factoryState():null;
 if(!state||!st.startsWith('factoryDungeon'))return null;
 const entries=[];
 function push(key,command,label){entries.push({key:String(key),command:String(command),label:String(label)});}
 if(st==='factoryDungeonHub'){
  for(let i=0;i<4;i++)push(i+1,i+1,floors[i]+(state.done.includes(i)?' — CLEARED':i===3&&state.done.length<3?' — LOCKED':''));
  push(5,5,'RETURN TO FORGE — WORKSHOP');
 }else if(st==='factoryDungeonFloor'){
  const fl=FACTORY_FLOORS[state.floor];if(!fl)return null;
  push(0,0,'RETURN TO CENTRAL STAIRWELL — FREE');
  fl.rooms.forEach((room,i)=>push(i+1,i+1,room[0]+(i===fl.rooms.length-1&&state.done.includes(state.floor)?' — CLEARED':'')+
   (state.floor===0&&i===2&&typeof r18DanielAvailable==='function'&&r18DanielAvailable()?' — DANIEL LEAD':'')));
 }else if(st==='factoryDungeonRoom'){
  if(player.flags.r18DanielFocus&&typeof r18DanielAtRoom==='function'&&r18DanielAtRoom()){
   [['FREE DANIEL WITH WIRE','Free Daniel with Wire'],['NEGOTIATE RELEASE','Negotiate Release — 25 Bolts'],['FIGHT CAPTORS','Fight Captors'],['RETURN TO FACTORY ROOM','Return to Factory Room']].forEach(([cmd,label],i)=>push(i+1,cmd,label));
   return entries;
  }
  const fl=FACTORY_FLOORS[state.floor],room=fl?.rooms[state.room];if(!room)return null;
  const key=state.floor+':'+state.room,puzzle=FACTORY_PUZZLES[key];
  push(1,'inspect','INSPECT '+room[0].toUpperCase());
  if(puzzle&&!state.puzzles.includes(key))push(2,puzzle.answer,puzzle.options);
  else{
   const isBoss=state.room===fl.rooms.length-1;
   const pendingBoss=isBoss&&!state.done.includes(state.floor);
   const enemy=(!isBoss&&!state.fights[day+':'+key]&&(day*17+state.floor*31+state.room*13)%6<3);
   if(pendingBoss||enemy)push(2,'fight',pendingBoss?'FIGHT '+bossNames[state.floor].toUpperCase():'FIGHT ENEMY');
   if(!pendingBoss)push(3,'search','SEARCH ROOM — 1 TURN');
   if(typeof r18DanielAtRoom==='function'&&r18DanielAtRoom())push(4,'investigate daniel','INVESTIGATE DANIEL');
  }
  push(0,'return to floor','RETURN TO '+fl.name);
 }
 return entries;
}
// Graphical buttons need labels, but the engine still requires the original
// numeric command at hub/floor and the full textual commands in rooms.
const previousChoices=GraphicalUI.choices;
GraphicalUI.choices=function(...args){return factoryChoices()||previousChoices.apply(this,args);};
const previousDispatch=GraphicalUI.dispatch;
GraphicalUI.dispatch=async function(choice){
 if(!stage.startsWith('factoryDungeon'))return previousDispatch.call(this,choice);
 if(busy)return false;
 const available=this.choices().find(c=>c.key===choice.key&&c.command===choice.command);
 if(!available){this.sync();return false;}
 this.navOpen=false;
 await handleCommand(available.command);
 this.sync();return true;
};
// Preserve direct keyboard 0–6 movement, and allow numbered graphical commands
// for room interactions without clobbering global shortcut handling.
const oldCore=handleCommandCore;
handleCommandCore=async function(raw){
 const cmd=String(raw||'').trim().toLowerCase();
 if(!busy&&stage==='factoryDungeonRoom'&&/^\d+$/.test(cmd)){
  const c=factoryChoices()?.find(x=>x.key===cmd);
  if(c)return oldCore.call(this,c.command);
 }
 return oldCore.apply(this,arguments);
};
// Register the first real conversation with Forge as the transition milestone.
// On old saves already inside the dungeon, infer that conversation only when
// the player also read the terminal and progressed into the dungeon.
const oldForge=v49Forge;
v49Forge=function(...args){
 const was=!!player.flags.devForgeTalked;
 const result=oldForge.apply(this,args);
 player.flags.devForgeTalked=true;
 if(!was&&player.flags.relayQuest==='complete'){
  add('MAIN OBJECTIVE COMPLETE — TALK TO FORGE','reward');
  add('MAIN QUEST UPDATED — EXPLORE THE FACTORY AND RECOVER THE CHARGE COMPONENT','reward');
 }
 if(typeof v49Autosave==='function')v49Autosave();
 return result;
};
if(!player.flags.devForgeTalked&&player.flags.v49TerminalRead&&
  (String(stage).startsWith('factoryDungeon')||(player.flags.factoryDungeon?.done||[]).length)){
 player.flags.devForgeTalked=true;
}
// Existing factory dungeon unlocks its four milestones on supervisor defeat;
// the legacy final-component flag was never set by that dungeon completion.
const oldWin=factoryCombatWin;
factoryCombatWin=function(c){
 const before=resultFlags().done.slice(),result=oldWin.apply(this,arguments);
 const after=resultFlags();
 if(after.done.length>before.length){
  const newly=after.done.find(n=>!before.includes(n));
  if(newly===3&&!after.f.factoryFinalComponent){
   after.f.factoryFinalComponent=true;
   add('FINAL CHARGE COMPONENT RECOVERED — FOREMAN\'S BLASTING CONTROLS','reward');
  }
  if(after.all){
   add('MAIN QUEST UPDATED — RETURN TO FORGE TO CRAFT DYNAMITE','reward');
  }else{
   add('FACTORY QUEST UPDATED — '+after.done.length+'/4 SUPERVISORS CLEARED','reward');
  }
  if(typeof v49Autosave==='function')v49Autosave();
 }
 return result;
};
// Migration: old saves that already defeated the Foreman must not be blocked
// by the missing legacy flag. Existing prepared charges are never duplicated.
if(player.flags.factoryDungeon?.done?.includes(3)&&!player.flags.factoryFinalComponent){
 player.flags.factoryFinalComponent=true;
}
// Hide premature USE DYNAMITE in both graph navigation and old obstruction menu.
// The game-level portClearRoad verification still remains authoritative.
const originalNode=lanternNodeMenu;
lanternNodeMenu=function(...args){
 const prev=r5DirectChoices;
 r5DirectChoices=function(opts){
  if(stage==='lanternNode'&&lanternState()?.nodeId==='boulder-junction'&&!isChargeReady())
   opts=opts.filter(s=>String(s).toLowerCase()!=='use dynamite');
  return prev.call(this,opts);
 };
 try{return originalNode.apply(this,args);}
 finally{r5DirectChoices=prev;}
};
const originalBlocked=portBlockedMenu;
portBlockedMenu=function(...args){
 if(isChargeReady())return originalBlocked.apply(this,args);
 numberedChoices={};currentHotkeys={};
 add('EASTERN ROAD — COLLAPSED OVERPASS','place');
 add('The way to Seaport is blocked. Find Forge at the Factory and prepare the dynamite charge.','system');
 add('RETURN TO FORGE   INSPECT OBSTRUCTION','system');
};
// On the obstructed road, deny unsupported manual use even if text is typed.
const previousCommand=handleCommandCore;
handleCommandCore=async function(raw){
 const cmd=String(r5Mapped(raw)||'').trim().toLowerCase();
 if(!busy&&!isChargeReady()&&!player.flags.portRoadCleared&&
   ['use dynamite','place dynamite','use charge','place charge','clear road'].includes(cmd)){
  if(stage==='portObstruction'||lanternState()?.nodeId==='boulder-junction'){
   add('You need the completed charge from Forge before you can clear this road.','system');
   if(stage==='portObstruction')portBlockedMenu();return;
  }
 }
 return previousCommand.apply(this,arguments);
};
// The active journal should show the *real* four factory milestones and directions.
// It does not invent unimplemented pick-ups or change how supervisor locks work.
if(typeof Route127JournalFix!=='undefined'&&typeof TravelerPanels!=='undefined'){
 const prevJournal=TravelerPanels.journalOutput;
 TravelerPanels.journalOutput=async function(...args){
  const result=await prevJournal.apply(this,args);
  const {f,done,met,all}=resultFlags();
  if(f.relayQuest!=='complete'||f.chapterOneComplete)return result;
  const milestone=f.seaportRoute?.arrived||f.portRoadCleared?'cleared':isChargeReady()?'charged':all?'collected':met?'collecting':'meet';
  const guidance=[
   'Loading & Receiving — defeat the Salvage King for authorization 1.',
   'Production & Assembly — defeat Grinder for authorization 2.',
   'Chemical Processing — defeat the Chemist for authorization 3.',
   'Restricted Basement — after the first three, defeat the Foreman to recover the final charge component.'
  ];
  if(this.page==='active'&&milestone!=='meet'){
   const existing=this.questEntries.find(x=>x.title==='Factory — Prepare the Dynamite');
   const details=guidance.map((line,i)=>(done.includes(i)?'RECOVERED — ':'NEEDED — ')+line);
   details.unshift('Factory milestones completed: '+done.length+'/4.');
   if(milestone==='collected')details.push('All components recovered. Return to Forge in the entrance workshop to prepare dynamite.');
   if(milestone==='charged')details.push('Dynamite prepared. Head to Boulder Junction, inspect the blockage, and USE DYNAMITE.');
   if(existing)existing.details=details;
   else this.questEntries.unshift({title:'Factory — Prepare the Dynamite',details});
  }
  if(this.page==='completed'&&met&&!this.questEntries.some(x=>x.title==='Talk to Forge'))
   this.questEntries.unshift({title:'Talk to Forge',details:['Met Forge at the Factory workshop. He described the security authorizations and charge equipment.','Completed.']});
  if(this.page==='active'){
   if(milestone==='meet')this.mainObjective='Head to the Factory and talk to Forge.';
   if(milestone==='collecting')this.mainObjective='Factory — clear the supervisors and recover the final charge component ('+done.length+'/4).';
   if(milestone==='collected')this.mainObjective='Return to Forge at the Factory entrance workshop to craft dynamite.';
   if(milestone==='charged')this.mainObjective='Use the prepared dynamite at Boulder Junction to clear the Seaport road.';
  }
  return result;
 };
}
// Clear clue trail for the old plain-text quest log, without injecting rewards.
const previousQuest=showQuests;
showQuests=function(...args){
 const result=previousQuest.apply(this,args);
 const {f,done,met,all}=resultFlags();
 if(f.relayQuest==='complete'&&met&&!f.chapterOneComplete){
  add('FACTORY — PREPARE THE DYNAMITE','bright');
  floors.forEach((name,i)=>add((done.includes(i)?'RECOVERED':'NEEDED')+' — '+name+': '+bossNames[i]+' ('+(i<3?'supervisor authorization':'final charge component')+')','system'));
  if(all&&!f.portChargePrepared)add('RETURN TO FORGE — All four Factory milestones complete.','reward');
 }
 return result;
};
globalThis.DevtestFactoryStabilization={version:'2026-11-04',factoryChoices};
})();