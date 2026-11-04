/* DEVTEST: let players choose an edible distraction. */
(()=>{'use strict';if(!location.pathname.includes('/route127/devtest/'))return;
const food=()=>player.pack.filter(i=>i.qty>0&&
 (/^(Energy Bars|Wild Honey|Preserved Meat|Preserved Vegetables|Wasteland Stew|Roadhouse Hash)$/.test(i.name)
 ||/^Raw .* Meat$/.test(i.name)||/^Fresh (Apple|Pear|Berries|Carrot|Potato|Tomato|Cabbage)$/.test(i.name)));
const prior=resolveEncounter;
resolveEncounter=function(cmd){
 const title=currentEncounter()?.title,c=String(cmd).toLowerCase();
 if(['ROACH NEST','TUNNEL RATS'].includes(title)&&
    (/lure them away|throw food/.test(c))&&!player.flags.devFoodSelected){
  if(!food().length){add('You need an edible item to distract them.','system');renderCurrentChoices();return;}
  player.flags.devFoodChoice=c;
  add('CHOOSE FOOD TO SACRIFICE','place');
  v53Choices(food().map(i=>'USE FOOD — '+i.name.toUpperCase()).concat('CANCEL FOOD'));
  return;
 }
 return prior.apply(this,arguments);
};
const oldCore=handleCommandCore;
handleCommandCore=async function(raw){
 const chosen=player.flags.devFoodChoice;
 if(!busy&&chosen&&stage==='encounter'){
  const cmd=String(r5Mapped(raw)||'').trim().toLowerCase();
  if(cmd==='cancel food'){delete player.flags.devFoodChoice;renderCurrentChoices();return;}
  if(cmd.startsWith('use food — ')){
   const i=food().find(i=>i.name.toLowerCase()===cmd.slice('use food — '.length));
   if(!i){add('That food is unavailable.','system');return;}
   delete player.flags.devFoodChoice;
   const oldHas=hasItem,oldRemove=removeItem;
   hasItem=function(name){return name==='Energy Bars'?true:oldHas.apply(this,arguments);};
   removeItem=function(name){return name==='Energy Bars'?oldRemove(i.name+(i.stolen?' (STOLEN)':''),1):oldRemove.apply(this,arguments);};
   try{player.flags.devFoodSelected=true;return prior(chosen);}
   finally{hasItem=oldHas;removeItem=oldRemove;delete player.flags.devFoodSelected;}
  }
  return;
 }
 return oldCore.apply(this,arguments);
};
const oldRender=renderCurrentChoices;
renderCurrentChoices=function(...a){
 if(player.flags.devFoodChoice&&stage==='encounter'){
  v53Choices(food().map(i=>'USE FOOD — '+i.name.toUpperCase()).concat('CANCEL FOOD'));return;
 }
 return oldRender.apply(this,a);
};
})();