/* DEVTEST only. Saved equipment and WO33 encounter stats remain authoritative. */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='PLAYTEST'||!/^\/route127\/playtest\/(?:index\.html)?$/.test(location.pathname))return;

 const key='wo43-danger-retaliation';
 const factors={common:1,uncommon:1.20,rare:1.40,epic:1.52,legendary:1.67};
 const previous={common:1,uncommon:1.13,rare:1.30,epic:1.46,legendary:1.60};
 const ordinary=new Map([
  ['RABID RACCOONS',1.5],['BAT COLONY',1.5],['RAT PACK',1.5],['PANTRY RAT PACK',1.5],
  ['FERAL DOG PACK',1.65],['FERAL DOG',1.65],['MOUNTAIN LIONS',1.75],
  ['LOOTERS',1.75],['PARKING LOT RAIDERS',1.75]
 ]);
 function multiplier(combat){
  if(combat?.wo33?.tier==='ordinary'&&combat.source==='encounter'){
   return ordinary.get(combat.name)||1;
  }
  if(combat?.source==='factoryFight'&&combat.wo33?.tier==='miniboss'&&combat.name==='SALVAGE KING')return 2;
  return 1;
 }
 function enabled(){return localStorage.getItem(key)==='on';}
 globalThis.WO43Balance=Object.freeze({
  enabled,multiplier,
  setEnabled(value){localStorage.setItem(key,value?'on':'off');}
 });
 function combatWeaponRange(name,bounds){
  const weapon=GEAR[name];
  const rarity=weapon?.rarity, factor=factors[rarity];
  if(weapon?.type!=='weapon'||!factor||factor===1)return bounds;
  const upgrade=player.flags?.r127EquipmentUpgrades?.[name];
  const base=GEAR[upgrade?.base]||weapon;
  const level=base.level, rank=EQUIPMENT_QUALITIES.indexOf(rarity);
  const generated=Number.isInteger(level)&&(base.id?.startsWith('weapon-')||
   /^Road Weapon L\d{2} /.test(upgrade?.base||name));
  // Generated weapons replace the old rarity additions. Fixed named weapons
  // keep their authored premium and get only the change in the WO41 factor.
  const ratio=generated?factor:factor/previous[rarity];
  return bounds.map((value,index)=>{
   const authored=index===0?base.min:base.max;
   const oldRarity=generated?rank*(index+1):0;
   return Math.round((authored-oldRarity)*ratio)+(value-authored);
  });
 }
 const range=weaponRange;
 weaponRange=function(){
  const bounds=range.apply(this,arguments);
  return stage==='combat'&&!combatState?.r18Bare?combatWeaponRange(player.weapon,bounds):bounds;
 };
 globalThis.Route127ShopWeaponRange=function(name){
  const weapon=GEAR[name],accessory=GEAR[player.accessory];
  const bounds=weapon?.type==='weapon'?[weapon.min,weapon.max]:[5,10];
  return combatWeaponRange(name,[bounds[0]+(accessory?.min||0),bounds[1]+(accessory?.max||0)]);
 };


 const retaliate=combatRetaliation, defense=armorDefense, damage=scaledEnemyDamage;
 let attackScale=1, pendingStrike=false;
 combatRetaliation=function(combat){
  const previousScale=attackScale, previousStrike=pendingStrike;
  attackScale=enabled()?multiplier(combat):1;
  pendingStrike=false;
  try{return retaliate.apply(this,arguments);}
  finally{attackScale=previousScale;pendingStrike=previousStrike;}
 };
 // The engine evaluates armorDefense immediately before each direct strike.
 // Bleed ticks and other scripted damage call scaledEnemyDamage separately.
 armorDefense=function(){
  const value=defense.apply(this,arguments);
  pendingStrike=attackScale!==1;
  return value;
 };
 scaledEnemyDamage=function(raw,armor,level){
  const scale=pendingStrike?attackScale:1;
  pendingStrike=false;
  return damage.call(this,raw*scale,armor,level);
 };
})();
