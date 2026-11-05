/* Route 127 / DEVTEST — Forge dynamite handoff hotfix.
 * Intercepts the real graphical numbered command BEFORE older command wrappers.
 * Existing four-boss saves qualify. Never consume materials or create duplicates.
 */
(()=>{'use strict';
if(!/\/route127\/playtest\/(?:index\.html)?$/.test(location.pathname))return;
const ITEM='Prepared Dynamite Charge';
const allBosses=()=>[0,1,2,3].every(n=>player.flags.factoryDungeon?.done?.includes(n));
const collectiblePartsMet=()=>{
 if(!player.flags.factoryPartsEnabled)return true; // old dungeon playthrough
 const p=player.flags.factoryDynamiteParts||{};
 return !!(p.caps&&p.compound&&p.detonator);
};
const hasCharge=()=>Array.isArray(player.pack)&&player.pack.some(i=>i.name===ITEM&&i.qty>0);
function canPrepare(){
 const f=player.flags;
 return allBosses()&&collectiblePartsMet()&&!f.portRoadCleared;
}
function prepare(){
 const f=player.flags;
 if(!canPrepare()){
  add('FORGE > The charge is not ready. Check the missing Factory objectives in your journal.','system');
  return false;
 }
 // Normalize saves made before the Foreman completion flag was introduced.
 f.factoryFinalComponent=true;
 if(!hasCharge()){
  const added=addPack(ITEM,'quest',1,true);
  if(!added){add('FORGE > I could not place the charge in your quest inventory. Nothing was consumed.','danger');return false;}
 }
 f.portChargePrepared=true;
 if(typeof v49Autosave==='function')v49Autosave();
 add('DYNAMITE PREPARED — '+ITEM.toUpperCase(),'reward');
 add('MAIN QUEST UPDATED — CLEAR THE ROAD TO SEAPORT. Take the charge to Boulder Junction.','reward');
 return true;
}
// handleCommand receives a numbered key in the graphical interface; calling
// r5Mapped(raw) inside the earlier wrapper cannot always resolve that key.
// Resolve exactly once from the visible menu mapping, then handle this command.
const previous=handleCommand;
handleCommand=async function(raw){
 const input=String(raw||'').trim().toLowerCase();
 const mapped=Object.prototype.hasOwnProperty.call(numberedChoices||{},input)
  ?String(numberedChoices[input]).trim().toLowerCase():input;
 if(stage==='factoryForge'&&mapped==='prepare dynamite'){
  const succeeded=prepare();
  if(succeeded){
   // Re-enter the existing Forge display after commit; the preparation
   // flag suppresses repeat offers and regrants.
   if(typeof v49Forge==='function')v49Forge();
  }else if(typeof v49Forge==='function')v49Forge();
  if(typeof GraphicalUI!=='undefined')GraphicalUI.schedule();
  await outputQueue;
  return;
 }
 return previous.apply(this,arguments);
};
// On reload, only repair the specific old-save case where a charge was
// marked prepared but went missing; do not touch unfinished quests.
const oldForge=v49Forge;
v49Forge=function(...args){
 const f=player.flags;
 if(f.portChargePrepared&&!f.portRoadCleared&&!hasCharge()&&canPrepare()){
  f.factoryFinalComponent=true;
  if(addPack(ITEM,'quest',1,true)){
   add('PREPARED CHARGE RESTORED TO QUEST INVENTORY','reward');
   if(typeof v49Autosave==='function')v49Autosave();
  }
 }
 return oldForge.apply(this,args);
};
globalThis.DevtestForgeHandoffFix={canPrepare,hasCharge,prepare};
})();