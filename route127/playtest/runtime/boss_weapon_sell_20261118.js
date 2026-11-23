/* DEVTEST — Factory boss reward resale compatibility.
 * Quest-only marks a drop source, not an unsellable carried weapon.
 * Do not relax protection for equipped, unique, quest, or legendary items.
 * Keep the merchant's own buyback multipliers and confirmation logic.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='PLAYTEST')return;
 const sale=v48SellPrice;
 const factoryRewards=new Set([
  'Modified Chemical Sprayer',
  'Modified Rotary Cutter',
  'Reinforced Salvage Maul',
  'Advanced Foreman Hammer'
 ]);
 v48SellPrice=function(item){
  const original=sale.apply(this,arguments);
  if(original>0||!item||!factoryRewards.has(item.name))return original;
  if(item.unique||item.protected||item.stolen&&typeof r18SaleDetected!=='function')return original;
  if(['key','quest'].includes(item.type)||!['weapon','armor'].includes(item.type))return original;
  if(item.name===player.weapon||item.name===player.armor||item.name===player.accessory)return original;
  if(!Number.isSafeInteger(Number(item.qty))||Number(item.qty)<1)return original;
  if(typeof protectedUniqueEquipment==='function'&&protectedUniqueEquipment(item.name))return original;
  const gear=GEAR[item.name];
  if(!gear||gear.rarity==='legendary')return original;
  const value=Economy.value(item.name);
  return Number.isFinite(value)&&value>0?Math.max(1,Math.floor(value*.08)):original;
 };
})();