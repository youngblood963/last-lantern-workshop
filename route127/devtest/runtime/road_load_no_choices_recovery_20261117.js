/* DEVTEST road-choice recovery.
 * A movement turn may be paid while an event is pending, so never offer
 * Continue Road until that event is resolved. Resume it without charging turns.
 * When no event is pending, rebuild missing command bindings directly.
 * No save overwrite, travel reset or automatic movement.
 */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
let repairing=false;
const road=()=>stage==='lanternRoad'&&typeof lanternState==='function'?lanternState():null;
const valid=()=>{const g=road();return g?.currentEdgeId&&typeof lanternEdge==='function'&&!!lanternEdge()?g:null;};
const hasActions=()=>Object.values(numberedChoices||{}).some(Boolean)||Object.keys(currentHotkeys||{}).some(k=>k!=='b');
function restore(){
 const g=valid();
 if(!g||busy||commandProcessing||combatState||repairing)return false;
 if(hasActions()&&!g.pending)return false;
 repairing=true;
 try{
  if(g.pending){
   // This is the already-paid current step, not a request to advance.
   // Set the resume flag only if an encounter was already selected.
   resumeSavedEncounter=Number.isInteger(g.encounterIndex)&&g.encounterIndex>=0;
   roadTurnCharged=true;
   stage='between';
   try{
    showEncounter();
   }catch(e){
    stage='lanternRoad';
    console.error('[DEVTEST road] Current event could not be restored',e);
    // Keep the pending flag and current coordinates intact for another retry.
    add('Current road encounter could not load. Try Resume Road Event again.','danger');
   }
  }else{
   // Missing menu bindings must not force another load or re-enter an event.
   numberedChoices={'1':'continue road','2':'reverse direction'};
   currentHotkeys={};
   add('ROAD ACTIONS RESTORED — Continue Road / Reverse Direction','system');
  }
  GraphicalUI.schedule();
  return true;
 }finally{repairing=false;}
}
const oldChoices=GraphicalUI.choices;
GraphicalUI.choices=function(...args){
 const existing=oldChoices.apply(this,args);
 const g=valid();
 if(!g||existing.length||busy||combatState)return existing;
 return g.pending?
  [{key:'1',command:'resume road event',label:'Resume Road Event',r127RoadRecovery:true}]:
  [{key:'1',command:'continue road',label:'Continue Road',r127RoadRecovery:true},
   {key:'2',command:'reverse direction',label:'Reverse Direction',r127RoadRecovery:true}];
};
const oldDispatch=GraphicalUI.dispatch;
GraphicalUI.dispatch=async function(choice){
 if(choice?.r127RoadRecovery&&valid()){
  if(busy||commandProcessing)return false;
  if(valid().pending){restore();this.sync();return true;}
  await handleCommand(choice.command);this.sync();return true;
 }
 return oldDispatch.apply(this,arguments);
};
const originalLoad=loadGame;
loadGame=function(...args){
 const result=originalLoad.apply(this,args);
 // Existing redraws use outputQueue; only repair after they have settled.
 outputQueue=outputQueue.then(()=>{
  if(valid()&&!hasActions())restore();
 }).catch(err=>console.warn('[DEVTEST road] Menu redraw recovery:',err));
 return result;
};
const oldCore=handleCommand;
handleCommand=async function(...args){
 const result=await oldCore.apply(this,args);
 // A successful movement can still leave an unresolved step with no buttons.
 if(valid()&&!hasActions())restore();
 return result;
};
setTimeout(()=>{if(valid()&&!hasActions())restore();},1200);
globalThis.Route127RoadLoadRecovery=Object.freeze({restore});
})();