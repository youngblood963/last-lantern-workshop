/* DEVTEST only. Owner-requested, opt-in cleanup of Steve's armor and
 * Cheeseburger (a pet, NOT an inventory food item). A reversible local backup
 * is created first. No changes to unrelated equipment or character progression.
 */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof TravelerPanels==='undefined')return;
const board="Crazy Steve's Sandwich Board";
const isBoard=n=>String(n||'').replace(/’/g,"'")===board;
const isBurger=n=>/^cheeseburger$/i.test(String(n||'').trim());
const containers=()=>[player.pack,player.stash,player.houseStorage,player.rustyRoomChest,
 player.flags?.r6AnchorRoomChest,player.flags?.r5LootQueue,player.flags?.port55PendingRewards]
 .filter(Array.isArray);
const ownsBoard=()=>isBoard(player.armor)||isBoard(player.weapon)||isBoard(player.accessory)||
 containers().some(items=>items.some(item=>isBoard(item?.name)));
const ownsBurger=()=>!!player.flags?.cheeseburgerOwned||
 (player.flags?.ownedPets||[]).some(isBurger)||isBurger(player.flags?.equippedPet)||
 containers().some(items=>items.some(item=>isBurger(item?.name)));
const owned=()=>({board:ownsBoard(),burger:ownsBurger()});
function remove(){
 const items=owned();
 if(!items.board&&!items.burger){alert('Neither item is currently held by this DEVTEST character.');return;}
 const names=[items.board?'Sandwich Board':null,items.burger?'Cheeseburger pet':null].filter(Boolean).join(' and ');
 if(!confirm('DEVTEST ONLY: remove '+names+' from this character?\nA local backup will be created first.'))return;
 try{
  const key='route127_devtest_steve_gear_backup_'+Date.now();
  const snapshot={player:JSON.parse(JSON.stringify(player)),stage,createdAt:new Date().toISOString(),
   autosave:localStorage.getItem(FACTORY_AUTOSAVE_KEY),
   casinoLedger:player.characterId?localStorage.getItem('route127-r11-casino-'+player.characterId):null,
   legendaryOwnership:localStorage.getItem('route127-local-legendary-r11-v1')};
  localStorage.setItem(key,JSON.stringify(snapshot));
  if(!localStorage.getItem(key))throw Error('Local backup could not be verified.');
  for(const items of containers()){
   for(let i=items.length-1;i>=0;i--)if(isBoard(items[i]?.name)||isBurger(items[i]?.name))items.splice(i,1);
  }
  for(const slot of ['weapon','armor','accessory']){
   if(!isBoard(player[slot]))continue;
   player[slot]=null;
   // Board gives +20 max HP only while equipped; remove that bonus once.
   player.maxHp=Math.max(1,(Number(player.maxHp)||1)-20);
   player.hp=Math.min(Number(player.hp)||1,player.maxHp);
  }
  if(items.board){
   player.flags.r127SteveBoardRetired=true;
   delete player.flags.r11BoardToken;
  }
  if(items.burger){
   const previouslyOwned=!!player.flags.cheeseburgerOwned;
   player.flags.r127CheeseburgerRetired=true;
   player.flags.cheeseburgerOwned=false;
   if(Array.isArray(player.flags.ownedPets))player.flags.ownedPets=player.flags.ownedPets.filter(n=>!isBurger(n));
   if(isBurger(player.flags.equippedPet))player.flags.equippedPet=null;
   if(previouslyOwned)player.packMax=Math.max(12,(Number(player.packMax)||12)-6);
  }
  updateHud();
  v49Autosave();
  alert(names+' removed. Your DEVTEST character was backed up locally.\nOther saves were not modified.');
 }catch(error){
  console.error('[DEVTEST equipment cleanup]',error);
  alert('Removal failed: '+error.message+'. Your saved data was not intentionally cleared.');
 }
}
const previous=TravelerPanels.options;
TravelerPanels.options=function(...args){
 const result=previous.apply(this,args);
 if(this.which!=='options'||!this.body)return result;
 const items=owned();
 if(!items.board&&!items.burger)return result;
 const panel=this.body.querySelector('.traveler-detail');
 if(!panel)return result;
 const close=[...panel.querySelectorAll('button')].find(b=>b.textContent==='Close');
 const button=this.button('Remove Sandwich Board / Cheeseburger',()=>{this.close();remove();});
 button.title='DEVTEST-only, with confirmation and a local backup.';
 panel.insertBefore(button,close||null);
 return result;
};
})();