/* DEVTEST load recovery. Never replaces, clears, or edits an existing save. */
(()=>{
'use strict';
if(!/(?:^|\/)route127\/(?:playtest|devtest)\/(?:index\.html)?$/.test(location.pathname))return;
const originalLoad=loadGame;
const rawKey=slot=>slot==='auto'?FACTORY_AUTOSAVE_KEY:SAVE_KEYS[slot];
function safeBackup(slot,data){
 try{
  const key=rawKey(slot),raw=localStorage.getItem(key);
  if(raw){
   const id='route127-recovery-backup-'+(data?.player?.characterId||'character')+'-'+(data?.savedAt||'unknown').replace(/[^a-zA-Z0-9._-]/g,'_');
   if(!localStorage.getItem(id))localStorage.setItem(id,raw);
  }
 }catch(e){console.warn('[DEVTEST recovery] Could not store a backup; original save not changed',e);}
}
loadGame=function(slot=activeSaveSlot){
 const snapshot=getSaveData(slot);
 try{return originalLoad(slot);}
 catch(error){
  console.error('[DEVTEST] Normal save load failed. Original save retained.',error);
  if(!snapshot?.player||!['encounter','between','turnComplete','questRoadComplete'].includes(snapshot.stage)||!snapshot.player.flags?.lanternTravel?.currentEdgeId){
   add('SAVE LOAD ERROR — '+String(error?.message||error),'danger');
   add('Original save was not modified. Use DevTools Console for details.','system');
   return;
  }
  safeBackup(slot,snapshot);
  // Only the transient, already-paid road encounter is skipped; equipment,
  // quests, level, currency, identities, and discovered road graph are retained.
  const repaired=JSON.parse(JSON.stringify(snapshot));
  repaired.stage='lanternRoad';
  repaired.combatState=null;
  repaired.player.flags.lanternTravel.pending=false;
  repaired.player.flags.lanternTravel.encounterIndex=null;
  const fetchOriginal=getSaveData;
  getSaveData=function(which){return String(which)===String(slot)?repaired:fetchOriginal(which);};
  try{
   const result=originalLoad(slot);
   add('DEVTEST RECOVERY — Saved character restored between road encounters.','reward');
   add('The broken pending encounter was skipped, with no movement turn charged. Original save preserved.','system');
   console.warn('[DEVTEST recovery] Character recovered from a temporary snapshot; original save unchanged.');
   return result;
  }catch(again){
   console.error('[DEVTEST recovery] Second load failed; original save retained.',again);
   add('SAVE RESTORE ERROR — '+String(again?.message||again),'danger');
   add('Your original save was not edited. Recovery backup retained when storage permitted.','system');
  }finally{getSaveData=fetchOriginal;}
 }
};
})();