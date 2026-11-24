/* DEVTEST settlement adapter. Reuses staffing, trade, drinks, post and arena handlers. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
const here=()=>lanternState()?.nodeId==='abandoned-motel'&&!lanternState()?.currentEdgeId;
const room=()=>player.flags.motelRoom||'home';
const art={vendors:'motel_general_store.png',lounge:'motel_lounge.png',jessica:'motel_security.png',pool:'motel_arena.png',rear:'motel_rear.png',mail:'motel_post_office.png',rani:'motel_accessories.png', 'general store':'motel_general_store.png',armory:'motel_armory.png',workshop:'motel_workshop.png',clinic:'motel_clinic.png',bank:'motel_bank.png'};
const mailUnlocked=()=>player.flags.r18Courier?.phase==='service';
function choices(title,labels){add(title,'place');DevtestMenuModel.publishQueued('motel-'+stage,labels,labels.at(-1),r5DirectChoices,{direct:true});}
function open(view='home'){
 if(!here())return false;
 if(view==='mail'&&!mailUnlocked())view='home';
 player.flags.motelVisited=true;player.flags.motelRoom=view;delete player.flags.motelSaleOrigin;
 stage='motel'+view[0].toUpperCase()+view.slice(1);
 render();v49Autosave();return true;
}
function render(){
 if(!here())return;
 const view=room();
 if(stage==='motelSale')return portStaffRender();
 if(view==='home')return choices('ABANDONED MOTEL',['MOTEL VENDORS','THE LOUNGE','TALK TO JESSICA','THE POOL','BEHIND THE MOTEL',...(mailUnlocked()?['MAIL ROOM']:[]),'BULLETIN BOARD','LEAVE MOTEL']);
 if(view==='vendors')return choices('MOTEL VENDORS',['GENERAL STORE','ARMORY','WORKSHOP','CLINIC','BANK',"RANI'S ACCESSORIES",'BACK']);
 if(view==='rani')return choices('RANI KAPOOR — ACCESSORIES',['SELL ITEMS','BACK']);
 if(view==='rear')return choices('BEHIND THE MOTEL',['BACK']);
 if(view==='lounge')return choices('THE LOUNGE',['BUY DRINKS','SELL ITEMS','CONVERSATION','SMALL TALK','GAMBLE','BACK']);
 if(view==='jessica')return choices('JESSICA MERCER — SECURITY',['TALK JESSICA','SMALL TALK','BOUNTIES','INSPECT JESSICA','BACK']);
 if(view==='mail'){if(!mailUnlocked())return open();return r18CourierMenu();}
}
function vendors(){return open('vendors');}
const oldNode=lanternNodeMenu;
lanternNodeMenu=function(...args){if(here())return open();return oldNode.apply(this,args);};
const oldArrive=lanternArrive;
lanternArrive=async function(id,...args){const r=await oldArrive.call(this,id,...args);if(id==='abandoned-motel'&&here()){lanternState().lastSettlement='abandoned-motel';open();}return r;};
function leave(){delete player.flags.motelRoom;delete player.flags.motelSaleOrigin;stage='lanternNode';oldNode();v49Autosave();}
const oldRender=renderCurrentChoices;
renderCurrentChoices=function(...args){if(stage==='motelRecruit')return hireDest();if(here()&&/^motel/.test(stage))return render();return oldRender.apply(this,args);};
const oldRecruitUnlocked=portRecruitUnlocked;
portRecruitUnlocked=function(){return here()&&stage==='motelSale'||oldRecruitUnlocked();};
const oldRating=portStaffRating;
portStaffRating=function(role){if(here()&&stage==='motelSale'&&role==='general store')return 1;return oldRating(role);};
function sell(){player.flags.motelSaleOrigin=stage;player.flags.portStaffUI={role:'general store',page:'sell'};stage='motelSale';portStaffRender();}
function hireDest(){choices('RECRUIT FOR WHICH SETTLEMENT?',['RECRUIT FOR MOTEL',...(player.flags.seaport55?.freed?['RECRUIT FOR SEAPORT']:[]),'BACK']);}
const oldWandererMenu=v53WandererMenu;
v53WandererMenu=function(w,road){const r=oldWandererMenu(w,road);if(player.flags.motelVisited&&portRecruitEligible(w)&&!portRecruitUnlocked()){
 const suffix=road?'':' '+w.name.toUpperCase();v53Choices(['TALK'+suffix,...(!v50Profile(w).hostile?['BROWSE WARES'+suffix]:[]),'STEAL'+(road?'':' FROM '+w.name.toUpperCase()),'INSPECT'+suffix,'RECRUIT'+suffix,'FIGHT'+suffix,road?'MOVE ON':'LEAVE']);
 }return r;};
const oldCore=handleCommandCore;
handleCommandCore=async function(raw){
 const cmd=v53Normalize(r5Mapped(raw));
 if(!busy&&player.flags.motelVisited&&['wandererRoad','mercy'].includes(stage)&&!player.flags.v50Trade&&/^recruit(?: |$)/.test(cmd)){
  const w=wandererByName(stage==='wandererRoad'?currentRoadWanderer:townWandererFocus);
  if(w&&portRecruitEligible(w)){player.flags.motelRecruit={name:w.name,origin:stage};stage='motelRecruit';return hireDest();}
 }
 if(stage==='motelRecruit'){
  const q=player.flags.motelRecruit,w=q&&wandererByName(q.name);
  if(!q||!w)return;
  if(['back','b'].includes(cmd)){delete player.flags.motelRecruit;stage=q.origin;return v53WandererMenu(w,stage==='wandererRoad');}
  const settlement=cmd==='recruit for motel'?'motel':cmd==='recruit for seaport'&&player.flags.seaport55?.freed?'seaport':null;
  if(settlement){player.flags.portHireOffer={...q,settlement};delete player.flags.motelRecruit;stage='port55Recruit';return portHireMenu();}return hireDest();
 }
 if(here()&&!busy){
  if(stage==='fallen'&&['1','get up','continue'].includes(cmd))return open();
  if(stage==='r11Drinks'&&room()==='lounge'&&['back','b'].includes(cmd))return open('lounge');
  if(stage==='motelSale'){
   if(['back','b','return to harbor','return to motel vendors'].includes(cmd))return open(player.flags.motelSaleOrigin==='motelRani'?'rani':'lounge');
   if(/^(?:sell |confirm store sale$|cancel store sale$)/.test(cmd))return portStaffServiceCommand(cmd);
   if(!/^(?:inventory|status|map|quests|save|load)(?: |$)/.test(cmd))return render();
  }
  if(/^motel/.test(stage)&&stage!=='motelSale'){
   if(['inventory','status','map','quests','save current','i','s','m','q','v'].includes(cmd)||/^(?:save|load)(?: |$)/.test(cmd))return oldCore.apply(this,arguments);
   if(stage==='motelHome'){
    const target={'motel vendors':'vendors','the lounge':'lounge','talk to jessica':'jessica','the pool':'pool','behind the motel':'rear','mail room':'mail'}[cmd];
    if(cmd==='bulletin board')return Route127Community.settlement(()=>open());
    if(cmd==='leave motel')return leave();
    if(target==='pool'){player.flags.motelRoom='pool';return Route127ArenaLobby.open('deep');}
    if(target)return open(target);
   }else if(stage==='motelVendors'){
    if(cmd==="rani's accessories")return open('rani');
    if(Object.keys(portStaffRoleDefinitions()).includes(cmd)){player.flags.motelRoom=cmd;return portStaffOpen(cmd);}
   }else if(stage==='motelRani'&&cmd==='sell items')return sell();
   else if(stage==='motelLounge'){
    if(cmd==='buy drinks')return r11Drinks();
    if(cmd==='sell items')return sell();
    if(['conversation','small talk'].includes(cmd))add('The Lounge is a place to rest between journeys.','bright');
   }else if(stage==='motelJessica'){
    const q=player.flags.motelJessica||(player.flags.motelJessica={conversations:0});
    if(cmd==='bounties')return DailyBounties.openContact('jessica');
    if(['talk jessica','small talk'].includes(cmd)){q.conversations++;add('JESSICA > Keep your eyes open out there.','bright');v49Autosave();}
    if(cmd==='inspect jessica')add('Jessica Mercer keeps watch from the former security office.','system');
   }else if(stage==='motelMail'){
    if(!mailUnlocked())return open();
    if(['return to town','back','b'].includes(cmd))return open();
    return r18CourierCommand(cmd);
   }
   if(['back','b'].includes(cmd))return open();
   return render();
  }
 }
 return oldCore.apply(this,arguments);
};
const seaportStaffRender=portStaffRender,seaportStaffService=portStaffServiceCommand;
portStaffRender=function(...args){if(here()){if(player.flags.portStaffUI?.role==='workshop'&&player.flags.portStaffUI.page==='craft')return r11CraftMenu('seaport');return settlementStaffRender.apply(this,args);}return seaportStaffRender.apply(this,args);};
portStaffServiceCommand=function(...args){if(here()){args[0]=String(args[0]).replace(/\s+—.*$/,'');return settlementStaffServiceCommand.apply(this,args);}return seaportStaffService.apply(this,args);};
const oldDirect=r5DirectChoices;
r5DirectChoices=function(labels){
 if(here()&&(/^(motel|port55Service|r11Drinks|r127ArenaLobby|r18Tournament)/.test(stage)))
  return DevtestMenuModel.publishQueued('motel-native-'+stage,labels,labels.at(-1),oldDirect,{direct:true});
 return oldDirect(labels);
};
const oldStaffChoices=portStaffChoices;
portStaffChoices=function(title,labels){if(here()){add(title,'place');return r5DirectChoices(labels);}return oldStaffChoices(title,labels);};
const oldPostalChoices=v53Choices;
v53Choices=function(labels){if(here()&&stage==='motelMail')return r5DirectChoices(labels);return oldPostalChoices(labels);};
const oldLoad=loadGame;
loadGame=function(...args){const r=oldLoad.apply(this,args);if(here()&&!combatState){
 player.flags.motelVisited=true;
 if(stage==='r127ArenaLobby'){player.flags.motelRoom='pool';Route127ArenaLobby.open('deep');}
 else if(stage==='r18Tournament')r18TournamentMenu();
 else if(stage==='port55Service')portStaffRender();
 else open(room()==='mail'&&!mailUnlocked()?'home':room());
 }return r;};
const oldModel=GraphicalUI.model;
GraphicalUI.model=function(...args){const m=oldModel.apply(this,args);if(here()&&m.active){
 const view=stage==='port55Service'?player.flags.portStaffUI?.role:room(),file=art[view];
 if(file){m.art=new URL('../devtest/assets/locations/'+file,document.baseURI).href;m.regionalSky=null;m.scenarioBackdrop=null;m.title=view==='pool'?'THE DEEP END — MOTEL POOL':view==='jessica'?'JESSICA MERCER':view==='lounge'?'THE LOUNGE':view==='rani'?"RANI'S ACCESSORIES":view==='mail'?'MOTEL MAIL ROOM':'MOTEL — '+String(view).toUpperCase();}
 }return m;};
const oldTournamentLeave=r18TournamentLeave;
r18TournamentLeave=function(...args){if(here()){delete player.flags.r18TournamentFocus;player.flags.motelRoom='pool';return Route127ArenaLobby.open('deep');}return oldTournamentLeave.apply(this,args);};
const css=document.createElement('style');css.textContent='.gfx-art.r127-motel-scene>.gfx-art-caption{z-index:20}.gfx-art .r127-motel-fighter{position:absolute;left:25%;bottom:0;width:50%;height:88%;z-index:4;display:flex;flex-direction:column;align-items:center}.r127-motel-fighter img{width:100%;height:calc(100% - 28px);object-fit:contain;min-height:0}.r127-motel-fighter span{color:white;background:#32100e;padding:3px 8px;border:1px solid #aa413b}';document.head.append(css);
const oldSync=GraphicalUI.sync;
GraphicalUI.sync=function(...args){const r=oldSync.apply(this,args),figure=this.element?.figure;if(!figure)return r;
 figure.classList.toggle('r127-motel-scene',here());
 let unit=figure.querySelector('.r127-motel-fighter');
 if(!here()||combatState?.r18TournamentKey!=='deep'){unit?.remove();return r;}
 if(!unit){unit=document.createElement('div');unit.className='r127-motel-fighter r127-road-unit';unit.append(document.createElement('img'),document.createElement('span'));figure.append(unit);}
 const index=Math.max(0,Math.min(2,combatState.r18TournamentRound||0)),image=unit.querySelector('img');image.src=new URL('../devtest/assets/fighters/'+['roadblock.png','riot.png','grizzly.png'][index],document.baseURI).href;image.alt=combatState.name;
 image.style.filter=((player.flags.worldHour||0)>=20||(player.flags.worldHour||0)<5)?'brightness(.62) saturate(.68) sepia(.12) hue-rotate(165deg)':'';
 unit.querySelector('span').textContent=combatState.name+' '+combatState.hp+'/'+combatState.maxHp+' HP';Route127CombatLayouts.applyOverlay(unit,index);return r;
};
globalThis.Route127Motel=Object.freeze({here,open,vendors,mailUnlocked,art,leave});
})();
