/* Route 127 DEVTEST: Solace interiors menu consolidation. No map/backend changes. */
(()=>{'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
let section='';
const inTown=()=>stage==='mercy';
const at=n=>inTown()&&mercyLocation===n;
const menu=(id,title,choices,navigation='BACK')=>{
 add(title,'place');
 DevtestMenuModel.publishLabels(id,choices,navigation);
};
const backLabel='BACK';
const johnnyRoot=()=>{section='johnnyMain';johnnyMainMenu();};
const publishClinic=()=>DevtestMenuModel.publishLabels('solace-clinic',[
 'TREAT WOUNDS — 2% MAX HP PER BOLT (MIN 5)','BUY BANDAGE — 8 BOLTS','SELL ITEMS','SMALL TALK WAYNE','(B) BACK'
],'(B) BACK');
const clinicRoot=()=>{section='clinicMain';player.flags.solaceMenu='clinic';add('LAST CHANCE CLINIC','place');return publishClinic();};
const murphyRoot=()=>{section='murphyMain';player.flags.v49MurphyMenu='';murphyMainMenu();};
const murphyTalk=()=>{section='murphyTalk';player.flags.solaceMenu='murphyTalk';menu('solace-murphy-talk','MURPHY — SMALL TALK',['ASK ABOUT WORK','INSPECT CORVETTE PHOTO','ASK ABOUT RELAY STATION',backLabel]);};
const johnnyTalk=()=>{section='johnnyTalk';npcTalk('johnny');};
const clinicTalk=()=>{section='clinicTalk';npcTalk('wayne');};
const amiiTalk=()=>{section='amiiTalk';npcTalk('amii');};
const timTalk=()=>{section='timTalk';npcTalk('tim');};
function shopList(){
  const f=player.flags;
  const learned=k=>!!f.r11Learned?.[k]||(!!f.v49RecipeBandage&&k==='bandage');
  const choices=[];
  add('MURPHY — BLUEPRINTS FOR SALE','place');
  for(const [key,price] of [['ironReaper',75],['reinforcedPipe',50],['temperedPipe',65],['keeperCoat',150],['widowmaker',200]]){
    const r=CRAFT_RECIPES[key];if(!r)continue;
    add(r.name+' — '+(learned(key)?'LEARNED':price+' BOLTS'),r.rarity||GEAR[r.name]?.rarity||'system');
    if(!learned(key))choices.push('LEARN '+r.name.toUpperCase());
  }
  if(!choices.length)add('No new blueprints available.','system');
  DevtestMenuModel.publishLabels('solace-blueprints',[...choices,backLabel],backLabel);
}
// Source-level menus whose old handlers are still called on menu redraws.
murphyMainMenu=function(){section='murphyMain';player.flags.solaceMenu='murphyMain';player.flags.v49MurphyMenu='';menu('solace-murphy',"MURPHY'S WORKSHOP",['CRAFTING RECIPES','CRAFTING','SMALL TALK',backLabel]);};
johnnyMainMenu=function(){
  section='johnnyMain';
  player.flags.solaceMenu="johnnyMain";
  add("JOHNNY'S TRADING POST","place");
  add("JOHNNY > Buying, selling, or talking? Pick your poison.","bright");
  DevtestMenuModel.publishLabels('solace-johnny',["VIEW STOCK","SELL ITEMS","TALK",...(player.flags.r18MarthaSettled?["OLD WORLD COUNTER"]:[]),"(B) BACK"], "(B) BACK");
};
johnnyShop=function(){
  section='johnnyStock';
  ensureVendorStock();player.flags.solaceMenu="shop";
  add("JOHNNY'S STOCK — PERSONAL DAILY SELECTION","place");
  add(`ENERGY BAR — RESTORE 10% MAX HP — ${johnnyPrice("Energy Bars")} BOLTS`,"system");add(`BANDAGE — RESTORE 25% MAX HP — ${johnnyPrice("Bandage")} BOLTS`,"system");
  add(`BATTERED FLASHLIGHT — 20 BOLTS`,"system");
  add(`TENT — ${johnnyPrice("Tent")} BOLTS — one use for overnight camp.`,"system");
  if(!player.flags.backpackUpgrade)add(`16-SLOT BACKPACK — ${V48_BACKPACK_PRICE} BOLTS`,"system");
  const scrap=findItem("Scrap Metal"),sq=scrap?scrap.qty:0;add(`SCRAP: ${sq} — ${sq*4} BOLTS. Stock refreshes at daily refill.`,"system");
  DevtestMenuModel.publishLabels('solace-johnny-stock',["BUY ENERGY BAR","BUY BANDAGE","BUY BATTERED FLASHLIGHT",...(player.flags.relayPartsRevealed&&player.flags.relayQuest!=="complete"?["ASK ABOUT RELAY PARTS"]:[]),"BUY TENT",...(player.flags.r18MarthaSettled?["OLD WORLD COUNTER"]:[]),...(!player.flags.backpackUpgrade?["BUY 16-SLOT BACKPACK"]:[]),"(B) BACK"], "(B) BACK");
};
const npcMenus={
 johnny:{
  intro:'Johnny folds his arms, wearing the expression of a man who could turn this conversation into a sale.',
  notice:["johnnyQuest","Johnny's Ledger"],
  choices:()=>['ASK ABOUT LOST LEDGER','ASK ABOUT ROAD',
   ...(player.flags.relayPartsRevealed&&player.flags.relayQuest!=='complete'?['ASK ABOUT RELAY PARTS']:[])]
 },
 wayne:{
  intro:"Wayne looks up like he's already preparing a sarcastic diagnosis.",
  choices:()=>['ASK ABOUT LAST PATIENT','ASK ABOUT OLD HOUSE']
 },
 amii:{
  intro:'Amii smiles. Niko thumps his tail. Alex continues conducting a background check with his eyes.',
  notice:['amiiQuest','Bank Satchel'],
  choices:()=>['ASK ABOUT MISSING DEPOSIT','ASK ABOUT BANKING','ASK ABOUT NIKO AND ALEX']
 }
};
function timDialogue(){
 section='timTalk';mercyLocation='tim';player.flags.solaceMenu='dialogue';
 const spots=["near Solace's gate, checking a repaired hinge","outside Murphy's Motor Works, talking quietly over the sound of tools","at the end of The Rusty Lantern Tavern with a tin cup in one hand","near the bank, scratching Niko behind the ears"];
 const spot=spots[Math.floor(Math.random()*spots.length)];
 add('TIM','place');
 v48NpcIntro('tim',`You find Tim ${spot}.`);
 v48NpcIntro('tim_hair',"His red hair has gone gray around the temples, but he's still moving like there are six things left to do before dark.");
 add('TIM > Hey. Settling in alright?','bright');
 const bounty=v52Crime().bounty;
 DevtestMenuModel.publishLabels('solace-dialogue:tim',[
  'ASK ABOUT WORK',...(bounty>0?['PAY FINE','OFFER BRIBE']:[]),'ASK ABOUT RELAY STATION',
  ...(player.flags.r18BribePending?.lawman==='Tim'?['CONFIRM BRIBE','CANCEL BRIBE']:[]),
  'NEVER MIND'
 ],'NEVER MIND');
 add(`TIM > Your outstanding bounty is ${bounty} Bolts. Type PAY FINE to clear it.`,'system');
}
const previousNpc=npcTalk;
npcTalk=function(name,...args){
 const npc=name.toLowerCase();
 if(inTown()&&npc==='tim')return timDialogue();
 if(!inTown()||!Object.hasOwn(npcMenus,npc))return previousNpc.call(this,name,...args);
 const {intro,notice,choices}=npcMenus[npc];
 section=npc+'Talk';mercyLocation=npc;player.flags.solaceMenu='dialogue';
 if(notice&&player.flags[notice[0]]==='recovered')add('DELIVER '+notice[1].toUpperCase()+' — available now','reward');
 add(npc.toUpperCase(),'place');
 v48NpcIntro(npc,intro);
 DevtestMenuModel.publishLabels('solace-dialogue:'+npc,[...choices(),'(B) BACK'],'(B) BACK');
};
const previousSmallTalk=smallTalk;
smallTalk=function(name,...args){
 if(inTown()&&name==='tim'&&!['locked','found'].includes(player.flags.timQuest)){
  townWandererFocus=null;mercyLocation=name;
  v50OldSmallTalk(name);
  return npcTalk(name);
 }
 if(!inTown()||!Object.hasOwn(npcMenus,name))return previousSmallTalk.call(this,name,...args);
 townWandererFocus=null;mercyLocation=name;
 v50OldSmallTalk(name);
 npcTalk(name);
 if(name==='wayne')offerHouseQuest();
};
function roomMenu(){
 mercyLocation='jenRoom';
 add('THE RUSTY LANTERN','place');
 add(`${player.name||'PLAYER'}'S ROOM`,'place');
 DevtestMenuModel.publishLabels('solace-room',['REST','CHEST','LOOK AROUND','RETURN'],'RETURN');
}
const previousInnRoom=handleInnRoom;
handleInnRoom=function(cmd){
 if(at('jenRoomChest')&&player.flags.rustyRoomOwned&&['back','b','return'].includes(cmd))return roomMenu();
 return previousInnRoom.apply(this,arguments);
};
const previousSolace=handleSolace;
handleSolace=function(cmd,...args){
 if(at('jen')&&['rent room','buy room','room'].includes(cmd)&&
    !player.flags.pendingQuest&&!player.flags.pendingQuestOffer){
  if(!player.flags.rustyRoomOwned){
   if(player.bolts<2000){add('JEN > A room of your own costs 2000 Bolts.','system');return;}
   player.bolts-=2000;player.flags.rustyRoomOwned=true;
   updateHud();add('ROOM PURCHASED — 2000 BOLTS','reward');
  }
  return roomMenu();
 }
 if(!inTown()||!['clinic','wayne','last chance clinic'].includes(cmd)||
    player.flags.pendingQuest||player.flags.pendingQuestOffer)
  return previousSolace.call(this,cmd,...args);
 section='clinicMain';player.flags.solaceMenu='clinic';mercyLocation='wayne';
 add('LAST CHANCE CLINIC','place');
 showWanderersAt('wayne');
 if(!player.flags.visited_wayne){
  player.flags.visited_wayne=true;
  add("Clean bandages, boiled instruments, labeled jars. Someone here knows what they're doing.");
  add('A tiny word has been scratched into the underside of one metal shelf: SEX.','system');
  add('Wayne notices you noticing it and says absolutely nothing.');
  add(`WAYNE > You're at ${player.hp}/${player.maxHp} HP. I've seen worse. Usually attached to smarter decisions.`,'bright');
 }else add('WAYNE > Try not to bleed on the floor.','bright');
 publishClinic();
};
const previousRender=renderCurrentChoices;
renderCurrentChoices=function(...args){
 if(at('mara')&&player.flags.solaceMenu==='equipment'&&player.flags.v48Shop!=='sell'&&
    !player.flags.v53Sale&&!player.flags.pendingQuest&&!player.flags.pendingQuestOffer&&!townWandererFocus)
  return showEquipmentShop();
 if(at('wayne')&&player.flags.solaceMenu==='clinic'&&player.flags.v48Shop!=='sell'&&
    !player.flags.pendingQuest&&!player.flags.pendingQuestOffer&&!townWandererFocus)
  return publishClinic();
 return previousRender.apply(this,args);
};
showEquipmentShop=function(){
 section='armory';
 player.flags.solaceMenu='equipment';
 add('SCRAP & STEEL ARMORY — MARA — DAILY EQUIPMENT','place');
 const stock=regionalEquipmentStock('solace');
 for(const slot of stock.slots)add(regionalEquipmentText(slot,'solace'),GEAR[slot.name]?.rarity||'system');
 DevtestMenuModel.publishLabels('solace-armory',[
  ...stock.slots.filter(slot=>!slot.sold).map(slot=>'BUY '+slot.name.toUpperCase()),
  'SELL ITEMS','(B) BACK'
 ],'(B) BACK');
};
v50Armory=function(){
 mercyLocation='mara';currentTownWanderer=null;townWandererFocus=null;player.flags.solaceMenu='equipment';
 add('MARA — SCRAP & STEEL ARMORY','place');
 add('An older woman with scarred hands checks a blade against the light. MARA > Buy something that keeps you alive. Keep the speeches short.');
 return showEquipmentShop();
};
const oldBar=mercyMenu;
mercyMenu=function(...args){section='';return oldBar.apply(this,args);};
// In DEVTEST the action router owns submenu navigation, not the legacy handlers.
const previousCore=handleCommandCore;
handleCommandCore=async function(raw){
 if(stage==='r11Craft'&&player.flags.r11Bench==='murphy'&&['b','back'].includes(String(r5Mapped(raw)).toLowerCase())){stage='mercy';mercyLocation='murphy';return murphyRoot();}
 if(!inTown()||busy)return previousCore.apply(this,arguments);
 const typed=String(raw??'').trim().toLowerCase();
 const cmd=String(numberedChoices[typed]||currentHotkeys[typed]||typed).trim().toLowerCase();
 const back=['back','b','never mind'];
 if(player.flags.v53Sale){return previousCore.apply(this,arguments);}
 if(player.flags.v48Shop==='sell'&&back.includes(cmd)){
   delete player.flags.v48Shop;delete player.flags.v48Sale;
   if(at('johnny'))return johnnyRoot();
   if(at('wayne'))return clinicRoot();
   if(at('mara')){section='armory';return v50Armory();}
   return previousCore.apply(this,arguments);
 }
 if(at('johnny')){
   if(back.includes(cmd)){
    if(section==='johnnyStock'||section==='johnnyTalk')return johnnyRoot();
    return previousCore.apply(this,arguments);
   }
   if(cmd==='view stock')return johnnyShop();
   if(cmd==='small talk'||cmd==='talk')return johnnyTalk();
 }
 if(at('wayne')){
   if(back.includes(cmd)){if(section==='wayneTalk'||section==='clinicTalk')return clinicRoot();return previousCore.apply(this,arguments);}
   if(cmd==='small talk'||cmd==='small talk wayne'||cmd==='talk to wayne')return clinicTalk();
 }
 if(at('murphy')){
   if(back.includes(cmd)){
     if(section==='murphyRecipes'||section==='murphyTalk')return murphyRoot();
     if(stage==='r11Craft')return previousCore.apply(this,arguments);
     if(section==='murphyMain')return previousCore.apply(this,arguments);
   }
   if(cmd==='crafting recipes'){section='murphyRecipes';return shopList();}
   if(cmd==='crafting'){section='murphyCraft';return r11CraftMenu('murphy');}
   if(cmd==='small talk'||cmd==='small talk murphy'||cmd==='talk'){return murphyTalk();}
   if(section==='murphyRecipes'&&cmd.startsWith('learn ')){
     const key=Object.keys(CRAFT_RECIPES).find(k=>CRAFT_RECIPES[k].name.toLowerCase()===cmd.slice(6));
     const prices={ironReaper:75,reinforcedPipe:50,temperedPipe:65,keeperCoat:150,widowmaker:200};
     if(key&&prices[key]!=null){
      const learned=player.flags.r11Learned||(player.flags.r11Learned={});
      if(learned[key])add('Blueprint already learned.','system');
      else if(player.bolts<prices[key])add('Not enough Bolts.','system');
      else{player.bolts-=prices[key];learned[key]=true;updateHud();v49Autosave();add('BLUEPRINT LEARNED — '+CRAFT_RECIPES[key].name,'reward');}
      return shopList();
     }
   }
   if(section==='murphyTalk'&&cmd==='inspect corvette photo'){
     return previousCore.call(this,'inspect corvette photo');
   }
   if(section==='murphyTalk'&&cmd==='ask about work'){add('MURPHY > Still working on the machines. Check back when there is a new job.','bright');return murphyTalk();}
   if(section==='murphyTalk'&&cmd==='ask about relay station')return previousCore.apply(this,arguments);
 }
 if(at('amii')&&back.includes(cmd)&&section==='amiiTalk'){return v48BankMain();}
 if(at('tim')){
   if(cmd==='inspect tim'||cmd==='inspect tim mercer'){return v53TimMenu();}
   if(cmd==='collect bounty')return v53TimMenu();
   if(cmd==='ask about work'||cmd==='work')return previousCore.apply(this,arguments);
   if(cmd==='never mind')return v53TimMenu();
 }
 if(at('mara')){
   if(cmd==='small talk')return showEquipmentShop();
   if(cmd==='town')return previousCore.call(this,'back');
 }
 return previousCore.apply(this,arguments);
};
v53TimMenu=function(){
 section='timMain';mercyLocation='tim';townWandererFocus=null;player.flags.solaceMenu='tim53';
 const wanted=v52Crime().bounty>0;
 menu('solace-tim','TIM — SOLACE',['TALK TIM',...(typeof r18CourierEligible==='function'&&r18CourierEligible('tim')?['DELIVER TIM LETTER']:[]),...(player.flags.r18ClaraMet&&player.flags.r18DanielQuest!=='done'?['ASK ABOUT DANIEL']:[]),...(wanted?['PAY FINE','OFFER BRIBE']:[]),...(player.flags.r18BribePending?.lawman==='Tim'?['CONFIRM BRIBE','CANCEL BRIBE']:[]),'TOWN'],'TOWN');
};
// Reward eligible NPC bounty targets at defeat, independently of reopening Tim.
const oldCombat=handleCombat;
handleCombat=function(...args){
 const defeatedSource=combatState?.source;
 const before=defeatedSource==='terribleBilly'?player.flags.terribleBillyBounty:defeatedSource==='houseBoss'?player.flags.timHouseBounty:null;
 const result=oldCombat.apply(this,args);
 const f=player.flags;
 if(before==='active'&&defeatedSource==='terribleBilly'&&f.terribleBillyBounty==='proof'){
   f.terribleBillyBounty='done';gainXp(140);gainBolts(100);add('BOUNTY PAID — TERRIBLE BILLY: +140 XP, +100 BOLTS.','reward');v49Autosave();
 }
 if(before==='active'&&defeatedSource==='houseBoss'&&f.timHouseBounty==='proof'){
   f.timHouseBounty='done';gainXp(100);gainBolts(75);add('BOUNTY PAID — OLD HOUSE: +100 XP, +75 BOLTS.','reward');v49Autosave();
 }
 return result;
};
// The inherited R11 crafting screen uses its own stage rather than mercy.
// Keep its actual recipe/timer/transaction logic, but retain location artwork.
if(typeof GraphicalUI!=='undefined'){
 const priorCraftContext=GraphicalUI.context;
 GraphicalUI.context=function(...args){
  if(stage==='r11Craft'){
   if(player.flags.r11Bench==='murphy')return 'solace-murphy';
   if(player.flags.r11Bench==='forge')return 'factory';
   if(player.flags.r11Bench==='seaport')return 'seaport';
  }
  return priorCraftContext.apply(this,args);
 };
}
})();