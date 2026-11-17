/* DEVTEST: home crafting, ordinary craft resale, rarity gates. */
(()=>{'use strict';if(!location.pathname.includes('/route127/devtest/'))return;
// Seaport's liberation reward has a stable inventory name and authored combat stats.
GEAR['Harbor Guard Cutlass']??={type:'weapon',rarity:'rare',min:19,max:26,
 description:'A cutlass awarded for liberating Seaport.'};
const oldSell=v48SellPrice;
v48SellPrice=function(item){
 if(!v48Ordinary(item)||item.unique||item.protected||protectedUniqueEquipment(item.name)||
    GEAR[item.name]?.questOnly||GEAR[item.name]?.rarity==='legendary')return 0;
 const result=oldSell.apply(this,arguments);
 if(result>0)return result;
 const values={'Reinforced Bandage':8,'Wasteland Stew':5,'Roadhouse Hash':4,'Preserved Meat':3,'Preserved Vegetables':3};
 if(Object.hasOwn(values,item.name))return values[item.name];
 // Unpriced ingredients registered for cooking use the existing low-tier food payout.
 return ['material','consumable'].includes(item.type)&&r18FoodKind(item.name)?V48_LOOT_PRICES['Raw Rat Meat']:0;
};
const appendChoices=lanternAppendChoices;
lanternAppendChoices=function(labels){
 if(stage==='house'&&labels.length===1&&labels[0]==='EXPLORE ROADS')return;
 return appendChoices.apply(this,arguments);
};
const solaceExit='↓ S — SOLACE';
showHouseChoices=function(){
 ensureHousing();
 const quest=player.flags.houseQuest;
 const choices=player.flags.houseOwned?['OPEN STORAGE BOX','CRAFTING']:['SEARCH BATHROOM CABINET','CHECK FIREPLACE'];
 if(!player.flags.houseOwned){
  if(quest==='active')choices.push('INVESTIGATE OCCUPATION');
  if(quest==='cleared')choices.push('LIFT FLOORBOARD');
  choices.push('CHECK PACK');
 }
 r5DirectChoices([...choices,solaceExit]);
 outputQueue=outputQueue.then(()=>{if(stage==='house')delete currentHotkeys.b;});
};
const oldMenu=r11CraftMenu,oldCraft=r11CraftCommand;
r11CraftMenu=function(where){
 const last=r11Learned;
 r11Learned=function(key){return key==='pipe'?false:last.apply(this,arguments);};
 try{return oldMenu.call(this,where||player.flags.r11Bench||'murphy');}
 finally{r11Learned=last;}
};
r11CraftCommand=function(cmd){
 if(['back','b'].includes(cmd)&&player.flags.r11Bench==='home'){
  stage='house';return arriveHouse(true);
 }
 if(/^craft rusted pipe$/i.test(cmd)){
  add('Common weapons are no longer crafted. Existing equipment is preserved.','system');return r11CraftMenu();
 }
 return oldCraft.apply(this,arguments);
};
const oldCore=handleCommandCore;
handleCommandCore=async function(raw){
 const cmd=String(r5Mapped(raw)||'').trim().toLowerCase();
 if(!busy&&stage==='house'&&[solaceExit.toLowerCase(),'head to solace'].includes(cmd))return oldCore.call(this,'head south — solace');
 if(!busy&&stage==='house'&&player.flags.houseOwned&&cmd==='crafting'){
  return r11CraftMenu('home');
 }
 return oldCore.apply(this,arguments);
};
for(const r of Object.values(CRAFT_RECIPES)){
 const rarity=r.rarity||GEAR[r.name]?.rarity||'common';
 if(rarity==='uncommon')r.chance=Math.min(r.chance,.85);
 if(rarity==='rare')r.chance=Math.min(r.chance,.70);
 if(rarity==='epic'){r.chance=Math.min(r.chance,.50);r.minLevel=Math.max(25,r.minLevel||1);}
}
const oldBlueprint=r11Blueprint;
r11Blueprint=function(source){
 if(Number(player.level||1)<20){
  const known=player.flags.r11Learned||{},saved=known.keeperCoat;
  known.keeperCoat=true;
  try{return oldBlueprint.apply(this,arguments);}
  finally{if(saved===undefined)delete known.keeperCoat;else known.keeperCoat=saved;}
 }
 return oldBlueprint.apply(this,arguments);
};
})();