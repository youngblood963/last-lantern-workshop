/* DEVTEST: recover combat-item menus that have run out of consumables.
 * The underlying fight and turn economy are untouched.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
 const available=()=>Array.isArray(player?.pack)&&player.pack.some(i=>Number(i.qty)>0&&
   ['Bandage','Energy Bars','Reinforced Bandage','Wild Honey'].includes(i.name));
 // Restore both saved/stale combat-items stages and a current fight whose
 // last consumable was just used, without triggering another enemy attack.
 function recover(){
  if(stage!=='combatItems'||available()||!combatState)return false;
  inventoryMode=null;
  stage='combat';
  // Rebuild genuine engine bindings instead of inventing graphical buttons.
  numberedChoices={};
  currentHotkeys={};
  add('NO USABLE COMBAT ITEMS — BACK TO COMBAT.','system');
  renderCombatMenu();
  return true;
 }
 const sync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  recover();
  return sync.apply(this,args);
 };
 const choices=GraphicalUI.choices;
 GraphicalUI.choices=function(...args){
  recover();
  const rows=choices.apply(this,args);
  // Combat Items always has an actual Back command, even if the legacy
  // key map is overwritten by an output writer during a menu update.
  if(stage==='combatItems'&&!rows.some(r=>r.command==='back'||r.command==='b'))
   return [...rows,{key:'b',command:'back',label:'Back to Combat'}];
  return rows;
 };
 globalThis.Route127CombatItemsEscape=Object.freeze({recover});
})();