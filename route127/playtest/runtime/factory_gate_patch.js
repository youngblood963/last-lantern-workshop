/* DEVTEST: Factory stays exterior-only until the Relay quest is completed. */
(()=>{
'use strict';
if(!location.pathname.includes('/route127/playtest/'))return;
const locked=()=>player.flags.relayQuest!=='complete';
function deny(){
 add('FACTORY — AUTOMATED SECURITY','place');
 add('Steel doors block the entrance. The automated system requires Relay authorization.','danger');
 add('ACCESS DENIED — Restore the Relay Station in Solace to unlock the Factory.','system');
 const g=lanternState();
 if(g?.nodeId==='factory'&&!g.currentEdgeId)lanternNodeMenu();
}
const oldArrive=lanternArrive;
lanternArrive=async function(id){
 if(id!=='factory'||!locked())return oldArrive.apply(this,arguments);
 const g=lanternState(),e=lanternEdge();
 if(e&&typeof route127RememberRegion==='function')route127RememberRegion(g,e,id);
 g.markerContext=e?{edge:e.id,step:g.stepIndex}:null;
 Object.assign(g,{nodeId:'factory',currentEdgeId:null,stepIndex:0,pending:false,encounterIndex:null});
 if(!g.discoveredNodes.includes('factory'))g.discoveredNodes.push('factory');
 if(typeof r6Road==='function'&&r6Road())r6Road().active=false;
 deny();lanternSave();return true;
};
const oldCross=r6Crossroads;
r6Crossroads=function(...args){if(locked()){deny();return;}return oldCross.apply(this,args);};
showFactory=r6Crossroads;
const oldWorkshop=v49FactoryRoom;
v49FactoryRoom=function(...args){if(locked()){deny();return;}return oldWorkshop.apply(this,args);};
const oldCore=handleCommandCore;
handleCommandCore=async function(raw){
 const cmd=String(r5Mapped(raw)||'').trim().toLowerCase();
 const g=lanternState();
 if(!busy&&locked()&&g?.nodeId==='factory'&&!g.currentEdgeId&&
  /^(enter factory|enter the factory|enter forge|enter workshop|forge|factory)$/.test(cmd)){deny();return;}
 if(!busy&&stage==='mercy'&&mercyLocation==='relay'&&player.flags.relayQuest!=='complete'&&
  /^(install components|repair relay|stabilize relay|install|repair|stabilize)$/.test(cmd)){
  if(relayPartCount()<4){
   add('RELAY REPAIR INCOMPLETE — '+relayPartCount()+'/4 COMPONENTS RECOVERED','system');
   showRelayChoices();return;
  }
  player.flags.relayQuest='complete';
  gainXp(150);
  awardRelayEquipment();
  add('RELAY STATION — CONNECTION STABILIZED','reward');
  add('You fit the recovered components into place. The meters wake and a green signal spreads across the monitor.','system');
  add('SYN > Excellent work, '+String(player.handle||'traveler')+'! With the Relay Tower operational, I have established a connection to the Factory security system.','bright');
  add('SYN > I have overridden the entrance lockdown. The Factory doors are now accessible.','bright');
  add('FACTORY ACCESS — UNLOCKED','reward');
  add('SYN > Head to the Factory and talk to Forge.','bright');
  if(typeof syncFactoryQuest==='function')syncFactoryQuest();
  add('MAIN QUEST COMPLETE — THE RELAY STATION','reward');
  add('MAIN QUEST UPDATED — TALK TO FORGE','reward');
  if(typeof saveGame==='function')saveGame(activeSaveSlot);
  showRelayChoices();return;
 }
 return oldCore.apply(this,arguments);
};
if(typeof TravelerPanels!=='undefined'){
 const previous=TravelerPanels.journalOutput;
 TravelerPanels.journalOutput=async function(...args){
  const result=await previous.apply(this,args);
  for(const row of this.questEntries||[]){
   if(row.title!=='Restore the Relay'||player.flags.relayQuest==='complete')continue;
   const h=ensureRelayParts();
   row.details=['Components recovered: '+Object.values(h).filter(Boolean).length+'/4.',
    ...[['johnny','Power Regulator — talk to Johnny in Solace.'],
        ['yard','Antenna Servo — Old House Road between House and Solace.'],
        ['branch','Shielded Feed Coupler — Route between Nodes 9 and 32.'],
        ['east','Signal-Conditioning Module — Route 127 right outside the Factory.']]
       .map(([k,hint])=>(h[k]?'RECOVERED — ':'NEEDED — ')+hint),
    ...(Object.values(h).every(Boolean)?['Return to the Relay Station and install the four parts.']:[])];
  }
  if(player.flags.relayQuest==='complete'&&!player.flags.chapterOneComplete)
   this.mainObjective='Head to the Factory and talk to Forge.';
  return result;
 };
}
globalThis.DevtestFactoryGatePatch={version:'2026-11-04'};
})();
