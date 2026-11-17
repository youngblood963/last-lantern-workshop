/* DEVTEST Relay road scenarios. Only this environment loads the patch. */
(()=>{
'use strict';
if(!location.pathname.includes('/route127/devtest/'))return;
const sceneStage='relayRoadDiscovery';
const parts={
yard:{edge:'house--solace-upper-junction',name:'ANTENNA SERVO',scene:'An overturned maintenance van lies beside Route 127. Its antenna motor looks intact.',action:'SALVAGE ANTENNA SERVO'},
branch:{edge:'motel-interior-junction--solace',name:'SHIELDED FEED COUPLER',scene:'A roadside communications cabinet stands open. A shielded coupler remains in its housing.',action:'RECOVER FEED COUPLER'},
east:{edge:'works-junction--factory',name:'SIGNAL-CONDITIONING MODULE',scene:'Just outside the Factory, a wrecked communication truck contains a sealed signal module.',action:'RECOVER SIGNAL MODULE'}
};
const oldAward=awardRelayPart;
awardRelayPart=function(key,name){if(parts[key]&&!player.flags.relayRoadCollect){add('The Relay part is now located on Route 127, not here.','system');return false;}return oldAward.call(this,key,name);};
function active(){return player.flags.relayPartsRevealed&&player.flags.relayQuest!=='complete';}
function pending(){
 const key=player.flags.relayRoadEncounter;
 const graph=lanternState();
 return graph?.pending&&Object.hasOwn(parts,key)&&parts[key].edge===graph.currentEdgeId?key:null;
}
function choices(key){
 r5DirectChoices([parts[key].action,'BACK AWAY']);
 outputQueue=outputQueue.then(()=>{
  if(stage===sceneStage&&pending()===key)currentHotkeys.b='back away';
 });
}
function open(){
 const key=pending();
 if(!key)return false;
 // Legacy saves may still carry the random encounter selected for this step.
 lanternState().encounterIndex=null;
 resumeSavedEncounter=false;
 roadTurnCharged=true;
 currentRoadWanderer=null;
 stage=sceneStage;
 add('RELAY COMPONENT — '+parts[key].name,'place');
 add(parts[key].scene,'system');
 choices(key);
 return true;
}
const oldShow=showEncounter;
showEncounter=function(...args){
 if(open())return;
 const graph=lanternState();
 if(!active()||!graph?.pending||resumeSavedEncounter)return oldShow.apply(this,args);
 const key=Object.keys(parts).find(k=>parts[k].edge===graph.currentEdgeId&&!ensureRelayParts()[k]);
 if(!key)return oldShow.apply(this,args);
 const count=player.flags.relayRoadAttempts||(player.flags.relayRoadAttempts={});
 count[key]=(count[key]||0)+1;
 if(count[key]<2&&Math.random()>=.7)return oldShow.apply(this,args);
 player.flags.relayRoadEncounter=key;
 open();
};
const oldRender=renderCurrentChoices;
renderCurrentChoices=function(...args){
 const key=pending();
 if(stage===sceneStage&&key)return choices(key);
 return oldRender.apply(this,args);
};
const oldEncounter=currentEncounter;
currentEncounter=function(...args){
 if(stage===sceneStage&&pending())return null;
 return oldEncounter.apply(this,args);
};
function finish(key,take){
 if(take)oldAward(key,parts[key].name);
 else add('You leave the equipment behind. It can be found on another pass.','system');
 delete player.flags.relayRoadEncounter;
 stage='turnComplete';
 completeRoadTurn();
}
const oldCore=handleCommandCore;
handleCommandCore=async function(raw){
 const cmd=String(r5Mapped(raw)||'').trim().toLowerCase(),key=pending();
 if(!busy&&stage==='mercy'&&mercyLocation==='murphy'&&cmd==='ask about relay parts'&&player.flags.relayQuest!=='complete'){
  add('MURPHY > Johnny has a Power Regulator. The other three components are out on the roads.','bright');
  PlaythroughRepairs.relayClues(true);
  return;
 }
 if(!busy&&stage==='mercy'&&mercyLocation==='relay'&&player.flags.relayQuest!=='complete'&&cmd.includes('inspect')){
  const diagnostic=cmd.includes('monitor')?['monitor','The monitor is dead again. A faint ozone smell hangs around the vents. A signal-conditioning board behind the display is scorched beyond repair.','Look for a replacement on Route 127 just outside the Factory.']:
   cmd.includes('antenna')?['antenna','A bank of antenna controls is frozen halfway through calibration. The ANTENNA SERVO has seized solid.','Look for a replacement on Old House Road between the House and Solace.']:
   cmd.includes('cable')?['cables','Most of the cable is brittle but intact, but the SHIELDED FEED COUPLER has burned through at the wall.','Look for a roadside communications cabinet on the road between map Nodes 9 and 32.']:null;
  if(diagnostic){
   const [system,description,clue]=diagnostic;
   add(description);add(clue,'bright');inspectRelaySystem(system);showRelayChoices();return;
  }
 }
 if(!busy&&key&&stage===sceneStage){
  if(cmd===parts[key].action.toLowerCase())return finish(key,true);
  if(['back away','leave','back','b','move on'].includes(cmd))return finish(key,false);
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
globalThis.DevtestRelayRoad={pending,open,sceneStage};
})();
