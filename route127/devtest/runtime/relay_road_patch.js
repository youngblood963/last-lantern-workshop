/* DEVTEST Relay road scenarios. Only this environment loads the patch. */
(()=>{
'use strict';
if(!location.pathname.includes('/route127/devtest/'))return;
const parts={
yard:{edge:'house--solace-upper-junction',name:'ANTENNA SERVO',scene:'An overturned maintenance van lies beside Route 127. Its antenna motor looks intact.',action:'SALVAGE ANTENNA SERVO'},
branch:{edge:'motel-interior-junction--solace',name:'SHIELDED FEED COUPLER',scene:'A roadside communications cabinet stands open. A shielded coupler remains in its housing.',action:'RECOVER FEED COUPLER'},
east:{edge:'works-junction--factory',name:'SIGNAL-CONDITIONING MODULE',scene:'Just outside the Factory, a wrecked communication truck contains a sealed signal module.',action:'RECOVER SIGNAL MODULE'}
};
const oldAward=awardRelayPart;
awardRelayPart=function(key,name){if(parts[key]&&!player.flags.relayRoadCollect){add('The Relay part is now located on Route 127, not here.','system');return false;}return oldAward.call(this,key,name);};
function active(){return player.flags.relayPartsRevealed&&player.flags.relayQuest!=='complete';}
function pending(){return player.flags.relayRoadEncounter;}
function draw(){
 const p=pending();if(!p)return;
 stage='encounter';add('RELAY COMPONENT — ROADSIDE DISCOVERY','place');add(parts[p].scene,'system');
 v53Choices([parts[p].action,'BACK AWAY']);
}
const oldShow=showEncounter;
showEncounter=function(...args){
 const g=lanternState(),edge=g?.currentEdgeId;
 if(pending()&&g?.pending)return draw();
 if(!active()||!g?.pending||!edge)return oldShow.apply(this,args);
 const key=Object.keys(parts).find(k=>parts[k].edge===edge&&!ensureRelayParts()[k]);
 if(!key)return oldShow.apply(this,args);
 const count=player.flags.relayRoadAttempts||(player.flags.relayRoadAttempts={});
 count[key]=(count[key]||0)+1;
 if(count[key]<2&&Math.random()>=.7)return oldShow.apply(this,args);
 player.flags.relayRoadEncounter=key;return draw();
};
const oldRender=renderCurrentChoices;
renderCurrentChoices=function(...args){if(pending()&&stage==='encounter'&&lanternState()?.pending)return draw();return oldRender.apply(this,args);};
function finish(take){
 const key=pending();if(!key)return;
 if(take){player.flags.relayRoadCollect=true;try{oldAward(key,parts[key].name);}finally{delete player.flags.relayRoadCollect;}}
 else add('You leave the equipment behind. It can be found on another pass.','system');
 delete player.flags.relayRoadEncounter;stage='turnComplete';completeRoadTurn();lanternSave();
}
const oldCore=handleCommandCore;
handleCommandCore=async function(raw){
 const cmd=String(r5Mapped(raw)||'').trim().toLowerCase(),key=pending();
 if(!busy&&stage==='mercy'&&mercyLocation==='murphy'&&cmd==='ask about relay parts'&&player.flags.relayQuest!=='complete'){
  add('MURPHY > Johnny has a Power Regulator. The other three components are out on the roads.','bright');
  PlaythroughRepairs.relayClues(true);
  return;
 }
 if(!busy&&key&&stage==='encounter'&&lanternState()?.pending){
  if(cmd===parts[key].action.toLowerCase())return finish(true);
  if(['back away','leave','back','move on'].includes(cmd))return finish(false);
 }
 return oldCore.apply(this,arguments);
};
if(typeof PlaythroughRepairs!=='undefined'){
 PlaythroughRepairs.rackAvailable=()=>false;
 PlaythroughRepairs.rackChoice=()=>{};
 PlaythroughRepairs.relayClues=function(force=false){
  if(!force&&!active())return;const h=ensureRelayParts();
  for(const [k,where] of [['johnny','Johnny in Solace'],['yard','Old House Road between House and Solace'],['branch','road between map Nodes 9 and 32'],['east','Route 127 just outside the Factory']])
   add((h[k]?'RECOVERED':'NEEDED')+' — '+(parts[k]?.name||'POWER REGULATOR')+': '+where,'system');
 };
}
// Use the same clues for the first reveal and the journal. The shared reveal
// still points to the former fixed pickup locations.
revealRelayParts=function(){
 ensureRelayParts();
 const f=player.flags;
 if(f.relayPartsRevealed)return;
 f.relayPartsRevealed=true;
 f.relayBranchDiscovered=true;
 add("The failures are not one problem. They're four.","bright");
 add('RELAY REPAIR — FOUR COMPONENTS REQUIRED','reward');
 PlaythroughRepairs.relayClues();
 add('QUEST UPDATED — All four clues recorded in QUESTS. LOWER ACCESS ROAD UNLOCKED.','reward');
};
globalThis.DevtestRelayRoadParts=parts;
})();
