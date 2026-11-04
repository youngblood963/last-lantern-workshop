/* DEVTEST — Compact Solace hub. Menus only; no world graph/quest/save rewrites.
 * Six root choices; Bulletin Board intentionally separate from Shops.
 */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
const VIEWS=new Set(['town','hubShops','hubGates','hubWanderers']);
const IN_SHOP={
 'the rusty lantern':'bar',
 "johnny's trading post":'trader',
 "murphy's motor works":'workshop',
 'last chance clinic':'clinic',
 'solace savings & loan':'bank',
 'armory':'armory'
};
const present=()=>typeof wanderers!=='undefined'&&typeof wandererLocations!=='undefined'
 ?wanderers.filter(w=>wandererLocations[w.name]==='mercy'&&
   (typeof wandererAlive!=='function'||wandererAlive(w))&&
   !(typeof portIsHired==='function'&&portIsHired(w.name)))
 :[];
// The legacy town encounter exposes ONE wanderer, even if several NPCs are assigned to Solace.\nlet visibleWanderer=null;\nconst featured=()=>{const people=present();if(!people.length){visibleWanderer=null;return null;}if(visibleWanderer&&people.some(w=>w.name===visibleWanderer))return people.find(w=>w.name===visibleWanderer);visibleWanderer=people[Math.floor(Math.random()*people.length)].name;return people.find(w=>w.name===visibleWanderer);};\nconst canHub=()=>stage==='mercy'&&mercyLocation==='town'&&VIEWS.has(player.flags.solaceMenu);
function hub(){
 player.flags.solaceMenu='town';mercyLocation='town';townWandererFocus=null;
 const g=typeof lanternMigrate==='function'?lanternMigrate():null;
 if(g?.nodeId==='solace'){g.solaceAdmitted=true;g.lastSettlement='solace';}
 add('SOLACE — MAIN STREET','place');
 v53Choices(['SHOPS',...(player.flags.relayUnlocked?['RELAY STATION']:[]),
   'FIND TIM','GATES',...(featured()?['TALK TO '+featured().name.toUpperCase()]:[]),'BULLETIN BOARD',
   ...(player.flags.r18Courier?.phase==='service'?['POST OFFICE']:[])]);
}
function submenu(which){
 player.flags.solaceMenu=which;mercyLocation='town';
 if(which==='hubShops'){
  add('SOLACE — SHOPS','place');
  v53Choices(['THE RUSTY LANTERN',"JOHNNY'S TRADING POST",
   "MURPHY'S MOTOR WORKS",'LAST CHANCE CLINIC','SOLACE SAVINGS & LOAN',
   'ARMORY','BACK TO SOLACE']);
 }else if(which==='hubGates'){
  add('SOLACE — GATES','place');
  v53Choices(['NORTH GATE','SOUTH GATE','EAST GATE','WEST GATE','BACK TO SOLACE']);
 }else if(which==='hubWanderers'){
  add('SOLACE — WANDERERS','place');
  const people=present();
  if(!people.length)add('No wanderers are currently on Main Street.','system');
  v53Choices([...people.map(w=>'TALK TO '+w.name.toUpperCase()),
   ...(player.flags.r18SaltWorkersFreed?['TALK TO GIDEON']:[]),
   ...(player.flags.r18Ash?.reunionAvailable&&!player.flags.r18Ash?.reunion?['SEEK ASH SURVIVOR']:[]),
   'BACK TO SOLACE']);
 }
}
const previousMenu=mercyMenu;
mercyMenu=function(...args){
 // New Solace hub replaces the legacy endless list while preserving
 // the same underlying shop/NPC/road command handlers.
 if(stage!=='mercy'||mercyLocation!=='town')return previousMenu.apply(this,args);
 return hub();
};
const previousRender=renderCurrentChoices;
renderCurrentChoices=function(...args){
 if(canHub()){
   if(player.flags.solaceMenu==='town')return hub();
   return submenu(player.flags.solaceMenu);
 }
 return previousRender.apply(this,args);
};
const previousCore=handleCommandCore;
handleCommandCore=async function(raw){
 if(!canHub()||busy)return previousCore.apply(this,arguments);
 const typed=String(raw||'').trim().toLowerCase();
 const cmd=String(numberedChoices[typed]||currentHotkeys[typed]||typed).trim().toLowerCase();
 const view=player.flags.solaceMenu;
 if(['back','b','back to solace','return to town','town','solace'].includes(cmd)&&view!=='town')return hub();
 if(view==='town'){
  if(cmd==='shops')return submenu('hubShops');
  if(cmd==='gates')return submenu('hubGates');
  // Direct, named wanderer interactions; no redundant selection submenu.
  const nearby=present().find(w=>cmd==='talk to '+w.name.toLowerCase());
  if(nearby){currentTownWanderer=nearby.name;return previousCore.call(this,'talk to '+nearby.name.toLowerCase());}
  if(cmd==='talk to wanderer')return submenu('hubWanderers'); // legacy command compatibility
  if(cmd==='find tim')return typeof v53TimMenu==='function'?v53TimMenu():previousCore.call(this,'find tim');
  if(cmd==='relay station'&&player.flags.relayUnlocked)return previousCore.call(this,'relay station');
  if(cmd==='bulletin board')return previousCore.call(this,'bulletin board');
  if(cmd==='post office'&&player.flags.r18Courier?.phase==='service')return previousCore.call(this,'post office');
 }else if(view==='hubShops'){
  const map={...IN_SHOP,'the rusty lantern':'bar'};
  if(cmd==='the rusty lantern')return previousCore.call(this,'bar');
  if(map[cmd]&&cmd!=='post office')return previousCore.call(this,map[cmd]);
 }else if(view==='hubGates'){
  const gate=/^(north|south|east|west) gate$/.exec(cmd);
  if(gate){
   const g=typeof lanternState==='function'?lanternState():null;
   if(!g||g.nodeId!=='solace'||g.currentEdgeId){
    add('The gate map is unavailable. No travel occurred.','system');
    return submenu('hubGates');
   }
   return lanternGateMenu(gate[1]);
  }
 }else if(view==='hubWanderers'){
  if(cmd==='talk to gideon'&&player.flags.r18SaltWorkersFreed)
   return previousCore.call(this,cmd);
  if(cmd==='seek ash survivor'&&player.flags.r18Ash?.reunionAvailable&&!player.flags.r18Ash?.reunion)
   return previousCore.call(this,cmd);
  const w=present().find(x=>cmd==='talk to '+x.name.toLowerCase());
  if(w){
   currentTownWanderer=w.name;
   return previousCore.call(this,'talk to '+w.name.toLowerCase());
  }
 }
 // Preserve globals, e.g. inventory, status, quests and map.
 if(['inventory','inv','i','status','stats','s','quests','quest','q','map','m','save','v'].includes(cmd))
  return previousCore.apply(this,arguments);
 add('Choose an option or return to Solace.','system');
 return view==='town'?hub():submenu(view);
};
globalThis.Route127SolaceHub=Object.freeze({present});
})();
