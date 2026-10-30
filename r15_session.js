/* R15 offline resume uses existing snapshots and keys. Online resume belongs to cloud-dev. */
(() => {
 const online=document.querySelector('script[src^="cloud-dev.js"]')&&new URLSearchParams(location.search).get('offline')!=='1';
 if(online)return;
 const previous=handleCommand;
 handleCommand=async function(raw){
  const cmd=String(raw).trim().toLowerCase();
  if(['v','save current'].includes(cmd)&&!['title','wake','handle','confirmHandle'].includes(stage)){
   try{
    const snapshot=saveSnapshot();
    localStorage.setItem(activeSaveSlot?SAVE_KEYS[activeSaveSlot]:FACTORY_AUTOSAVE_KEY,JSON.stringify(snapshot));
    add('GAME SAVED','reward');
   }catch{add('SAVE FAILED — This browser could not store your progress. Please retry.','danger');}
   return;
  }
  return previous(raw);
 };
 addEventListener('DOMContentLoaded',async()=>{
  await outputQueue;
  if(stage!=='title')return;
  const latest=newestSave();
  if(!latest?.data?.player?.handle||!latest.data.stage||['title','wake','handle','confirmHandle'].includes(latest.data.stage))return;
  try{loadGame(latest.slot);}catch{add('Your saved game could not be restored. Select a save to recover.','danger');}
 });
})();
