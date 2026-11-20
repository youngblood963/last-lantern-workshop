/* DEVTEST — Salt Miners rescue and Marlow's Solace shop. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;

const rescueQuestions=['WHAT HAPPENED?','WHO ARE YOU?','WHAT WILL YOU DO NOW?'];
const shopPrices=new Map([
 ['Raw Rat Meat',4],['Raw Bird Meat',5],['Raw Wolf Meat',6],['Raw Boar Meat',7],
 ['Raw Chicken Meat',6],['Raw Snake Meat',5],['Raw Venison',8],['Salt',3]
]);
const incident='Marlow > The Saltmaster and his overseer forced us to cut salt and haul it out on sleds. We worked until they told us to stop.';
const rescueActive=()=>stage==='encounter'&&player.flags.marlowRescuePending&&
 currentEncounter()?.title==='THE SALT MINERS';
const atShop=()=>stage==='mercy'&&mercyLocation==='marlow'&&player.flags.marlowRescued;
const question=label=>label.toLowerCase().replace(/\?$/,'');
const globalCommand=cmd=>/^(?:save|load|status|inventory|quests|map)(?: |$)/.test(cmd);
const say=lines=>add(lines,'man');
function rescueMenu(){
 add('SALT MINERS — THE WORKERS ARE FREE','place');
 say('Marlow > Thank you for stepping in. We thought nobody would.');
 DevtestMenuModel.publish('marlow-rescue',rescueQuestions.map(label=>[question(label),label]),{explicitBindings:true});
}
function shop(page='main'){
 stage='mercy';mercyLocation='marlow';player.flags.solaceMenu='marlow';
 player.flags.marlowShopPage=page;
 add('SOLACE — MARLOW VANCE','place');
 const menus={
  main:[['buy meats','BUY MEATS'],['learn about preservation','LEARN ABOUT PRESERVATION'],['small talk','SMALL TALK'],['back','BACK']],
  meats:[...Array.from(shopPrices,([name,price])=>['buy '+name.toLowerCase(),'BUY '+name.toUpperCase()+' — '+price+' BOLTS']),['back','BACK']],
  talk:[['what happened','WHAT HAPPENED?'],['how did you learn about meat preservation','HOW DID YOU LEARN ABOUT MEAT PRESERVATION?'],['back','BACK']]
 };
 DevtestMenuModel.publish('marlow-'+page,menus[page],{explicitBindings:true});
}

const oldCombat=handleCombat;
handleCombat=function(...args){
 const fight=combatState;
 if(!fight?.r18MarlowGuards)return oldCombat.apply(this,args);
 const finish=completeRoadTurn;
 completeRoadTurn=function(...finishArgs){
  if(combatState||stage==='fallen'||fight.hp>0||!fight.enemies?.every(enemy=>enemy.hp<=0))
   return finish.apply(this,finishArgs);
  if(player.flags.marlowRescued)return finish.apply(this,finishArgs);
  player.flags.marlowRescuePending=true;
  stage='encounter';
  rescueMenu();
  lanternSave();
 };
 try{return oldCombat.apply(this,args);}
 finally{completeRoadTurn=finish;}
};

const saltScene=eastEncounters.find(e=>e.title==='THE SALT MINERS');
const prompt=saltScene.prompt;
saltScene.prompt=function(){
 return player.flags.marlowRescuePending?rescueQuestions.join('   '):prompt.call(this);
};
const description=saltScene.description;
saltScene.description=function(){
 return player.flags.marlowRescuePending?'The freed workers gather around you. A man named Marlow Vance steps away from the sleds.':
  description?.call(this)||this.text;
};
const oldChoices=renderCurrentChoices;
renderCurrentChoices=function(...args){
 if(rescueActive())return rescueMenu();
 if(atShop())return shop(player.flags.marlowShopPage||'main');
 return oldChoices.apply(this,args);
};

const oldCore=handleCommandCore;
handleCommandCore=async function(raw){
 if(busy)return oldCore.apply(this,arguments);
 const cmd=question(r5Mapped(raw));
 if(rescueActive()){
  if(cmd==='what happened')say(incident);
  else if(cmd==='who are you')say('Marlow > Marlow Vance. I know how to pack meat in salt so it lasts when the roads go lean.');
  else if(cmd==='what will you do now'){
   say('Marlow > I’m heading to Solace. I’ll set up a little stand and put this salt to better use.');
   delete player.flags.marlowRescuePending;
   player.flags.marlowRescued=true;
   return completeRoadTurn();
  }else if(globalCommand(cmd))return oldCore.apply(this,arguments);
  return rescueMenu();
 }
 if(stage==='mercy'&&mercyLocation==='town'&&cmd==='talk to marlow'&&player.flags.marlowRescued)return shop();
 if(!atShop()||globalCommand(cmd))return oldCore.apply(this,arguments);
 const page=player.flags.marlowShopPage||'main';
 if(['back','return','back to solace'].includes(cmd)){
  if(page!=='main')return shop();
  delete player.flags.marlowShopPage;
  mercyLocation='town';player.flags.solaceMenu='town';
  return mercyMenu();
 }
 if(page==='main'){
  if(cmd==='buy meats')return shop('meats');
  if(cmd==='small talk')return shop('talk');
  if(cmd==='learn about preservation'){
   say('Marlow > Salt draws moisture out of meat. Work it in and keep the meat clean and dry, and it’ll hold longer on the road.');
   if(!r11Learned('preservedMeat')){
    player.flags.r11Learned.preservedMeat=true;
    add('BLUEPRINT LEARNED — PRESERVED MEAT','reward');
    v49Autosave();
   }
  }
 }else if(page==='talk'){
  if(cmd==='what happened')say(incident);
  if(cmd==='how did you learn about meat preservation')
   say('Marlow > My family cured meat through the lean months. I learned to use what we had and to tell when a batch had gone bad.');
 }else if(page==='meats'&&cmd.startsWith('buy ')){
  const item=[...shopPrices.keys()].find(name=>name.toLowerCase()===cmd.slice(4).split(' — ')[0]);
  if(item){
   const price=shopPrices.get(item);
   if(player.bolts<price)add('Not enough Bolts.','system');
   else if(!addPack(item,'material',1,true))add('Backpack full. No Bolts charged.','system');
   else{
    player.bolts-=price;updateHud();
    add('Purchased '+item+' for '+price+' Bolts.','reward');
    v49Autosave();
   }
  }
 }
 return shop(page);
};

const oldModel=GraphicalUI.model;
const shopArt=new URL('../devtest/assets/locations/marlow_vance_shop.png',document.baseURI).href;
GraphicalUI.model=function(...args){
 const model=oldModel.apply(this,args);
 if(atShop()){
  model.title='Marlow Vance';
  model.art=shopArt;
  model.regionalSky=null;
 }
 return model;
};
})();
