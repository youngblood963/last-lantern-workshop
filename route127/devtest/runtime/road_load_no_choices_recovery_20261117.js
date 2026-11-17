/* DEVTEST — recover a save loaded mid-road with no playable commands.
 * The navigation batch defers binding a road menu when lanternTravel.pending
 * is true. Loading lanternRoad with that flag leaves a blank button panel.
 * Re-enter its recorded encounter rather than clearing pending/spending a turn.
 * For nonpending road saves, redraw commands without changing progress.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
 const hasChoices=()=>Object.keys(numberedChoices||{}).length>0||
  Object.keys(currentHotkeys||{}).some(key=>key!=='b');
 let recovering=false;
 function recover(){
  if(recovering||stage!=='lanternRoad'||hasChoices()||busy||combatState)return false;
  const road=typeof lanternState==='function'?lanternState():null;
  if(!road?.currentEdgeId||typeof lanternEdge!=='function'||!lanternEdge())return false;
  recovering=true;
  try{
   if(road.pending){
    // The movement turn has already been charged. Resume the pending event.
    // Never call lanternStep or change stepIndex, turns or encounterIndex.
    stage='between';
    resumeSavedEncounter=true;
    add('ROAD ENCOUNTER RESTORED — resuming the current movement turn.','system');
    showEncounter();
   }else{
    add('ROAD CONTROLS RESTORED — no travel turn used.','system');
    lanternRoadMenu();
   }
   GraphicalUI.schedule?.();
   return true;
  }catch(error){
   console.error('[DEVTEST road restore] Unable to rebuild road choices',error);
   add('ROAD CONTROLS RECOVERY FAILED — your position and save were not reset.','danger');
   return false;
  }finally{recovering=false;}
 }
 const originalLoad=loadGame;
 loadGame=function(...args){
  const result=originalLoad.apply(this,args);
  // Wait for menus written via outputQueue to bind their numeric commands.
  outputQueue=outputQueue.then(()=>{
   if(stage==='lanternRoad'&&!hasChoices())recover();
  });
  return result;
 };
 // Also repair an already-loaded screen after a deployment/hot refresh.
 // Avoid polling and never interfere with a valid encounter/menu.
 setTimeout(()=>{
  if(stage==='lanternRoad'&&!hasChoices())recover();
 },1500);
 globalThis.Route127RoadLoadRecovery=Object.freeze({recover});
})();