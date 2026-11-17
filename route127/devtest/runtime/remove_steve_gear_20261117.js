/* DEVTEST-only owner-invoked inventory cleanup.
 * NO automatic migration: explicit Options click + confirmation, current
 * character only. Preserves a local backup before changing owned equipment.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof TravelerPanels==='undefined')return;
 const match=name=>{
  const n=String(name||'').toLowerCase().replace(/[’]/g,"'");
  return n==="crazy steve's sandwich board"||
   /(?:^|\b)cheese\s*burger(?:\b|$)/.test(n);
 };
 const matches=()=>[
  ...(player.pack||[]).filter(x=>match(x.name)).map(x=>x.name),
  ...(player.stash||[]).filter(x=>match(x.name)).map(x=>x.name),
  ...['weapon','armor','accessory'].map(k=>player[k]).filter(match)
 ];
 function cleanup(){
  const found=matches();
  if(!found.length){alert('No Sandwich Board or Cheeseburger found on this character.');return;}
  const unique=[...new Set(found)];
  if(!confirm('DEVTEST character only: permanently remove '+unique.join(' and ')+
   ' from your equipped slots, backpack and stash? A backup will be saved in this browser first.'))return;
  try{
   // Preserve pre-change state before altering current character.
   const backup='route127_devtest_before_steve_gear_cleanup_'+Date.now();
   localStorage.setItem(backup,JSON.stringify({player,stage,savedAt:new Date().toISOString()}));
   if(!localStorage.getItem(backup))throw Error('Could not verify backup.');
   const removed=matches();
   player.pack=(player.pack||[]).filter(x=>!match(x.name));
   if(Array.isArray(player.stash))player.stash=player.stash.filter(x=>!match(x.name));
   for(const slot of ['weapon','armor','accessory']){
    const old=player[slot];
    if(!match(old))continue;
    const hpBonus=Number(GEAR?.[old]?.maxHpBonus)||0;
    player[slot]=null;
    if(hpBonus){
     player.maxHp=Math.max(1,player.maxHp-hpBonus);
     player.hp=Math.min(player.hp,player.maxHp);
    }
    if(player.flags?.r18EquippedStolen)delete player.flags.r18EquippedStolen[slot];
   }
   updateHud();
   v49Autosave();
   alert('Removed: '+[...new Set(removed)].join(', ')+
    '. Previous character state backed up locally. Other saves untouched.');
  }catch(error){console.error('DEVTEST equipment cleanup failed',error);alert('Cleanup could not complete: '+error.message);}
 }
 const prev=TravelerPanels.options;
 TravelerPanels.options=function(...args){
  const result=prev.apply(this,args);
  if(this.which!=='options'||!this.body)return result;
  const owned=matches();
  if(!owned.length)return result;
  const section=this.body.querySelector('.traveler-detail');
  if(!section)return result;
  const close=[...section.querySelectorAll('button')].find(x=>x.textContent==='Close');
  const button=this.button('Remove My Sandwich Board / Cheeseburger',()=>{
   // Close first so the saved overlay snapshot stays consistent.
   this.close();
   cleanup();
  },'danger');
  button.title='DEVTEST only. Requires confirmation and backs up this character locally.';
  section.insertBefore(button,close||null);
  return result;
 };
})();
