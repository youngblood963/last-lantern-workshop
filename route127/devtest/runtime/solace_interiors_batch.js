/* Route 127 DEVTEST: Solace interiors menu consolidation. No map/backend changes. */
(()=>{'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
let section='',murphyWork=false;
const inTown=()=>stage==='mercy';
const at=n=>inTown()&&mercyLocation===n;
const menu=(title,choices)=>{add(title,'place');v53Choices(choices);};
const backLabel='BACK';
const johnnyRoot=()=>{section='johnnyMain';johnnyMainMenu();};
const clinicRoot=()=>{section='clinicMain';player.flags.solaceMenu='clinic';menu('LAST CHANCE CLINIC',['TREAT WOUNDS — 2% MAX HP PER BOLT (MIN 5)','BUY BANDAGE — 8 BOLTS','SELL ITEMS','SMALL TALK WAYNE',backLabel]);};
const murphyRoot=()=>{section='murphyMain';player.flags.v49MurphyMenu='';murphyWork=false;murphyMainMenu();};
const murphyTalk=()=>{section='murphyTalk';player.flags.solaceMenu='murphyTalk';menu('MURPHY — SMALL TALK',['ASK ABOUT WORK','INSPECT CORVETTE PHOTO','ASK ABOUT RELAY STATION',backLabel]);};
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
  v53Choices([...choices,backLabel]);
}
const originalAdd=add;
add=function(value='',cls=''){
  const s=String(value);
  if(inTown()&&cls.includes('system')){
    // Keep original command handlers; streamline only their offered choices.
    if(at('johnny')&&s.includes('BUY ENERGY BAR')&&s.includes('BUY TENT')){
      const parts=s.split(/\s{2,}/).filter(x=>!['SMALL TALK','BUY','SELL ITEMS','SELL ALL SCRAP'].includes(x.trim().toUpperCase()));
      return originalAdd(parts.join('   '),cls);
    }
    if(at('mara')&&s.includes('BUY ')&&s.includes('(B) BACK'))return originalAdd(s.replace('(B) BACK','SELL ITEMS   (B) BACK'),cls);
    if(at('mara')&&s.includes('SMALL TALK')&&s.includes('SELL ITEMS')&&s.includes('TOWN'))return;
    if(at('johnny')&&s.includes('ASK ABOUT LOST LEDGER')&&s.includes('ASK ABOUT DEALS'))
      return originalAdd(['ASK ABOUT LOST LEDGER','ASK ABOUT ROAD',...(player.flags.relayPartsRevealed&&player.flags.relayQuest!=='complete'?['ASK ABOUT RELAY PARTS']:[]),'(B) BACK'].join('   '),cls);
    if(at('wayne')&&s.includes('ASK ABOUT LAST PATIENT')&&s.includes('ASK ABOUT INJURIES'))
      return originalAdd('ASK ABOUT LAST PATIENT   ASK ABOUT OLD HOUSE   (B) BACK',cls);
    if(at('wayne')&&s.includes('TREAT WOUNDS')&&s.includes('BUY BANDAGE')&&s.includes('BUY   SELL ITEMS'))
      return originalAdd('TREAT WOUNDS — 2% MAX HP PER BOLT (MIN 5)   BUY BANDAGE — 8 BOLTS   SELL ITEMS   SMALL TALK WAYNE   (B) BACK',cls);
    if(at('amii')&&s.includes('ASK ABOUT MISSING DEPOSIT')&&s.includes('ASK ABOUT BANKING')&&s.includes('ASK ABOUT SOLACE'))
      return originalAdd('ASK ABOUT MISSING DEPOSIT   ASK ABOUT BANKING   ASK ABOUT NIKO AND ALEX   (B) BACK',cls);
    if(at('tim')&&s.includes('ASK ABOUT SOLACE')&&s.includes('VIEW BOUNTIES')&&s.includes('COLLECT BOUNTY')){
      const wanted=v52Crime().bounty>0;
      return originalAdd(['ASK ABOUT WORK',...(wanted?['PAY FINE','OFFER BRIBE']:[]),'ASK ABOUT RELAY STATION',...(player.flags.r18BribePending?.lawman==='Tim'?['CONFIRM BRIBE','CANCEL BRIBE']:[]),'NEVER MIND'].join('   '),cls);
    }
  }
  return originalAdd(value,cls);
};
// Source-level menus whose old handlers are still called on menu redraws.
const previousMurphyMain=murphyMainMenu;
murphyMainMenu=function(){section='murphyMain';player.flags.solaceMenu='murphyMain';player.flags.v49MurphyMenu='';menu("MURPHY'S WORKSHOP",['CRAFTING RECIPES','CRAFTING','SMALL TALK',backLabel]);};
const previousJohnnyMain=johnnyMainMenu;
johnnyMainMenu=function(...args){section='johnnyMain';return previousJohnnyMain.apply(this,args);};
const previousJohnnyShop=johnnyShop;
johnnyShop=function(...args){section='johnnyStock';return previousJohnnyShop.apply(this,args);};
const previousNpc=npcTalk;
npcTalk=function(name,...args){if(['johnny','wayne','amii','tim'].includes(name))section=name+'Talk';return previousNpc.call(this,name,...args);};
const previousArmory=v50Armory;
v50Armory=function(...args){section='armory';return previousArmory.apply(this,args);};
const previousEquip=showEquipmentShop;
showEquipmentShop=function(...args){section='armory';return previousEquip.apply(this,args);};
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
const previousTim=v53TimMenu;
v53TimMenu=function(){
 section='timMain';mercyLocation='tim';townWandererFocus=null;player.flags.solaceMenu='tim53';
 const wanted=v52Crime().bounty>0;
 menu('TIM — SOLACE',['TALK TIM',...(typeof r18CourierEligible==='function'&&r18CourierEligible('tim')?['DELIVER TIM LETTER']:[]),...(player.flags.r18ClaraMet&&player.flags.r18DanielQuest!=='done'?['ASK ABOUT DANIEL']:[]),...(wanted?['PAY FINE','OFFER BRIBE']:[]),...(player.flags.r18BribePending?.lawman==='Tim'?['CONFIRM BRIBE','CANCEL BRIBE']:[]),'TOWN']);
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