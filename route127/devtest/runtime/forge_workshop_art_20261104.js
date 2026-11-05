/* DEVTEST-only: location-state artwork for Forge, Boulder Junction and Seaport. No gameplay changes. */
(function(){
 if(typeof GraphicalUI==='undefined')return;
 const oldContext=GraphicalUI.context.bind(GraphicalUI);
 GraphicalUI.context=function(){
  const overlayStages=new Set(['inventory','inventoryItem','confirmDrop','quests','interfaceStatus','interfaceMap','interfaceSave','combatItems','r5Loot','r18HorseTravel','corvetteRescue']);
  const place=overlayStages.has(stage)?returnStage:stage;
  if(['factoryWorkshop','factoryTerminal','factoryForge','factoryBench'].includes(place))return 'factory-workshop';
  const g=typeof lanternState==='function'?lanternState():null;
  if(place==='lanternNode'&&g?.nodeId==='boulder-junction'&&!g.currentEdgeId)return 'boulder-junction-art';
  return oldContext();
 };
 const oldModel=GraphicalUI.model.bind(GraphicalUI);
 GraphicalUI.model=function(){
  const model=oldModel();
  if(model.location==='factory-workshop'){
   model.title="Forge's Workshop";
   model.art='../devtest/assets/locations/forge_workshop.png';
  }
  if(model.location==='boulder-junction-art'){
   const cleared=!!player?.flags?.portRoadCleared;
   model.title=cleared?'Boulder Junction — Road Cleared':'Boulder Junction — Road Blocked';
   model.art='../devtest/assets/locations/seaport_boulder_'+(cleared?'cleared':'blocked')+'.png';
  }
  // Seaport occupation ends only after the prisoners are freed, not merely when the fighters fall.
  const g=typeof lanternState==='function'?lanternState():null;
  const atSeaport=g?.nodeId==='seaport'&&!g.currentEdgeId;
  const currentStage=String(stage||'');
  const inSeaportMenu=currentStage==='seaport'||/^port55(?!Road)/.test(currentStage)||
   ['portMarket','portClinic','portDocks','portWatch'].includes(currentStage);
  if(model.location==='seaport'&&(atSeaport||inSeaportMenu)){
   const liberated=!!player.flags?.seaport55?.freed;
   // Harbor Docks use the separate existing liberation image; main Seaport keeps its sunset town artwork.
   const atDocks=currentStage==='port55Docks'||
    (currentStage==='port55Stop'&&player.flags?.port55CurrentStop==='Docks');
   if(!liberated){
    model.art='../devtest/assets/locations/seaport_occupied.png';
    model.title='Seaport — Occupied Harbor';
   }else if(atDocks){
    model.art='../devtest/seaport_liberation.png';
    model.title='Seaport — Harbor Docks';
   }else if(currentStage==='port55Stop'&&player.flags?.port55CurrentStop==='Town Streets'){
    // Approved waterfront fish market: fish packed on ice and street stalls.
    // Only the actual TOWN STREETS stop uses this background.
    model.art='../devtest/assets/locations/seaport_town_streets.png';
    model.title='Seaport — Town Streets';
   }else{
    model.art='assets/locations/seaport.png';
    model.title='Seaport';
   }
  }
  // Each Seaport business has a permanent empty background. The separately
  // composited full-body wanderer is shown ONLY after that role is assigned.
  if(currentStage==='port55Service'&&!!player.flags?.seaport55?.freed){
   const role=player.flags?.portStaffUI?.role;
   const shops={
    'clinic':['Clinic','seaport_clinic.png'],
    'general store':['General Store','seaport_general_store.png'],
    'workshop':['Workshop','seaport_workshop.png'],
    'bank':['Bank','seaport_bank.png'],
    'armory':['Armory','seaport_armory.png']
   };
   if(shops[role]){
    model.title='Seaport — '+shops[role][0];
    model.art='../devtest/assets/locations/'+shops[role][1];
   }
  }
  // Nessa's waterside pet shop is a dedicated scene, independent of Seaport's other venues.
  if(currentStage==='port55Vendor'&&!!player.flags?.seaport55?.freed){
   model.art='../devtest/assets/locations/seaport_nessa_pet_shop.png';
   model.title="Nessa's Pet Shop";
  }
  // Kaiden's approved dialogue portrait appears only during his post-liberation conversation.
  // Patrol routing and dialogue stay in the original game code.
  if(currentStage==='port55Kaiden'&&!!player.flags?.seaport55?.freed){
   model.art='../devtest/assets/locations/sheriff_kaiden.png';
   model.title='Sheriff Kaiden';
  }
  return model;
 };
 if(typeof GraphicalUI.schedule==='function')GraphicalUI.schedule();
})();

/* DEVTEST lawman parity: Kaiden shares Tim's non-quest law services.
 * Keep the existing Seaport quest flags, Kaiden patrol, and legacy dialogue intact. */
(function(){
 if(!location.pathname.includes('/route127/devtest/'))return;
 if(typeof port55Submenu!=='function'||typeof port55Command!=='function')return;
 const originalSubmenu=port55Submenu;
 const originalCommand=port55Command;
 let kaidenPage='main';
 const hasBounty=()=>typeof v52Crime==='function'&&Number(v52Crime().bounty)>0;
 function kaidenMenu(){
  kaidenPage='main';
  const choices=['ASK ABOUT SEAPORT','SMALL TALK','VIEW BOUNTIES',...(hasBounty()?['PAY FINE','OFFER BRIBE']:[]),'BACK'];
  originalSubmenu('Sheriff Kaiden',choices);
  currentHotkeys.b='back';
 }
 function smallTalkMenu(){
  kaidenPage='small-talk';
  originalSubmenu('Sheriff Kaiden — Small Talk',['HOW IS SEAPORT HOLDING UP?','ASK ABOUT KEEPING THE LIGHTS ON','BACK']);
  currentHotkeys.b='back';
 }
 function bribeMenu(){
  kaidenPage='bribe';
  const pending=player.flags?.r18BribePending;
  if(!pending||pending.lawman!=='Kaiden')return kaidenMenu();
  originalSubmenu('Sheriff Kaiden — Bribe Offer',['CONFIRM BRIBE','CANCEL BRIBE','BACK']);
  currentHotkeys.b='back';
 }
 port55Submenu=function(name,choices){
  if(stage==='port55Kaiden'){
   // All legacy Kaiden redraws return to the lawman menu, never the removed RETURN TO HARBOR option.
   return kaidenMenu();
  }
  return originalSubmenu.apply(this,arguments);
 };
 port55Command=function(input){
  if(stage!=='port55Kaiden'||!player.flags?.seaport55?.freed)return originalCommand.apply(this,arguments);
  const cmd=String(input||'').trim().toLowerCase();
  if(['back','b','return','exit','return to harbor'].includes(cmd)){
   if(kaidenPage!=='main'){kaidenMenu();return true;}
   kaidenPage='main';stage='seaport';port55Menu();return true;
  }
  if(kaidenPage==='bribe'){
   if(cmd==='confirm bribe'){if(typeof r18BribeConfirm==='function')r18BribeConfirm('Kaiden');kaidenMenu();return true;}
   if(cmd==='cancel bribe'){if(typeof r18BribeCancel==='function')r18BribeCancel();kaidenMenu();return true;}
   return bribeMenu(),true;
  }
  if(kaidenPage==='small-talk'){
   if(cmd==='how is seaport holding up?'||cmd==='how is seaport holding up'){
    kaidenPage='main';
    return originalCommand.call(this,'small talk');
   }
   if(cmd==='ask about keeping the lights on'){
    // The existing quest interaction belongs under Small Talk; retain its original command path.
    kaidenPage='main';
    const handled=originalCommand.call(this,cmd);
    if(handled)return true;
    // If another handler owns this quest, allow it to process the command.
    return false;
   }
   return smallTalkMenu(),true;
  }
  if(cmd==='small talk'){smallTalkMenu();return true;}
  if(cmd==='ask about seaport'){
   add('KAIDEN > The fishermen are gone, but keeping this town safe will take more than a cleared dock. People need working shops, open roads, and someone watching the harbor.','bright');
   kaidenMenu();return true;
  }
  if(cmd==='view bounties'){
   if(typeof v52Wanted==='function')v52Wanted();
   const crime=typeof v52Crime==='function'?v52Crime():{active:[]};
   if(crime.active?.length)crime.active.slice(-8).forEach(x=>add('DAY '+x.day+' — '+x.detail+' (+'+x.amount+' BOLTS)','system'));
   else add('No active warrants.','system');
   kaidenMenu();return true;
  }
  if(cmd==='pay fine'||cmd==='pay off bounty'){
   if(typeof r18LegalFine==='function')r18LegalFine('Kaiden');
   kaidenMenu();return true;
  }
  if(cmd==='offer bribe'){
   if(typeof r18BribeOffer==='function'&&r18BribeOffer('Kaiden'))bribeMenu();
   else kaidenMenu();
   return true;
  }
  // Preserve quest progression and specialized dialogue owned by the original game.
  return originalCommand.apply(this,arguments);
 };
})();

/* DEVTEST Nessa menu: Corvette's queued appended choices can displace the
 * vendor's numbered pet purchases in graphical mode. Build one atomic menu. */
(function(){
 if(!location.pathname.includes('/route127/devtest/'))return;
 if(typeof port55Vendor!=='function'||typeof port55Submenu!=='function'||typeof PORT55_PETS==='undefined')return;
 port55Vendor=function(){
  add('NESSA > These strays choose their people. Choose a pet to buy or inspect one by name.','bright');
  const pets=Object.entries(PORT55_PETS)
   .filter(([,def])=>!def.rescueOnly)
   .map(([name,def])=>name+' — '+def.rarity.toUpperCase()+' — '+def.price+' BOLTS'+
     ((player.flags.ownedPets||[]).includes(name)?' — OWNED':''));
  // Silas is a hidden character until the player has found and released him.
  // Only offer locket theft after the Corvette engine bargain is actually active.
  const silasRescued=player.flags?.r18SilasOutcome==='released';
  const engine=typeof CorvetteRestoration!=='undefined'?CorvetteRestoration.state():null;
  const quest=silasRescued
   ?['ASK NESSA ABOUT SILAS','INSPECT NESSA LOCKET',
     ...(engine?.engineQuest&&!engine?.engineDelivered&&!engine?.locketTaken?['STEAL NESSAS LOCKET']:[])]
   :[];
  port55Submenu('Pet Vendor — Nessa',[...pets,...quest,'BACK']);
  currentHotkeys.b='back';
 };
 // Do not expose or execute Silas-specific Nessa actions before Silas is rescued,
 // even when someone types the commands in Classic BBS or through an old hotkey.
 const priorCommand=port55Command;
 port55Command=function(cmd){
  const command=String(cmd||'').trim().toLowerCase();
  if(stage==='port55Vendor'&&['ask nessa about silas','inspect nessa locket','steal nessas locket'].includes(command)){
   const rescued=player.flags?.r18SilasOutcome==='released';
   const engine=typeof CorvetteRestoration!=='undefined'?CorvetteRestoration.state():null;
   if(!rescued||(command==='steal nessas locket'&&(!engine?.engineQuest||engine?.engineDelivered||engine?.locketTaken))){
    add('That option is not available.','system');port55Vendor();return true;
   }
  }
  return priorCommand.apply(this,arguments);
 };
})();

/* DEVTEST: visually composite the assigned wanderer into the open-floor Seaport
 * businesses. Read existing staffing assignments; no game or save mutations.
 * Uses exactly the same portrait files as live roadside wanderer encounters. */
(function(){
 'use strict';
 if(!location.pathname.includes('/route127/devtest/')||typeof GraphicalUI==='undefined')return;
 const roles=new Set(['clinic','general store','workshop','bank','armory']);
 const root=new URL('../devtest/assets/wanderers/',location.href);
 const style=document.createElement('style');
 style.id='r127-devtest-staffed-shop-composition';
 style.textContent=`
  body.full-graphics .gfx-art{position:relative;isolation:isolate}
  .r127-shop-worker{
   position:absolute;bottom:0;right:40%;height:87%;width:auto;
   max-width:62%;object-fit:contain;object-position:bottom center;
   z-index:3;pointer-events:none;
   filter:drop-shadow(3px 8px 6px #0009)
  }
  @media(max-width:640px){.r127-shop-worker{height:80%;right:36%;max-width:62%}}
 `;
 document.head.appendChild(style);
 let lastKey='';
 function syncStaff(){
  const figure=GraphicalUI.element?.figure;
  if(!figure)return;
  const ui=player?.flags?.portStaffUI;
  const role=stage==='port55Service'?ui?.role:null;
  const active=GraphicalUI.active()&&!figure.hidden&&roles.has(role)&&player.flags?.seaport55?.freed;
  const name=active?player.flags?.seaportStaff?.assignments?.[role]:null;
  const file=name&&globalThis.Route127WandererPortraitFiles?.[name];
  const key=file?role+':'+name+':'+file:'';
  const existing=figure.querySelector('.r127-shop-worker');
  if(key===lastKey&&existing)return;
  existing?.remove();lastKey='';
  if(!file)return; // Unstaffed shop stays empty; unknown portrait remains safely hidden.
  const img=document.createElement('img');
  img.className='r127-shop-worker';img.alt=name+' — assigned shopkeeper';
  img.decoding='async';img.draggable=false;
  img.addEventListener('error',()=>{if(img.isConnected){img.remove();lastKey='';}});
  img.src=new URL(file,root).href;
  figure.appendChild(img);
  lastKey=key;
 }
 const previousSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=previousSync.apply(this,args);
  if(!this.rendering)syncStaff();
  return result;
 };
 addEventListener('DOMContentLoaded',()=>GraphicalUI.sync(),{once:true});
})();

/* DEVTEST fifth shop — Seaport Armory.
 * Reuse Solace's regionalEquipmentStock/Text/Buy and existing Seaport hiring.
 * No new stock, aptitude, currency or save schema. */
(function(){
 'use strict';
 if(!location.pathname.includes('/route127/devtest/')||typeof PORT_STAFF_ROLES==='undefined')return;
 PORT_STAFF_ROLES.armory={name:'Armory',job:'Armorer',skill:'trading'};
 // Market Area is the Armory's only entrance. The existing main Seaport
 // menu builds its options from PORT_STAFF_ROLES, so hide the Armory only
 // during that one synchronous render (keep it registered for all staffing).
 const previousMenu=port55Menu;
 port55Menu=function(...args){
  const armory=PORT_STAFF_ROLES.armory;
  try{
   delete PORT_STAFF_ROLES.armory;
   return previousMenu.apply(this,args);
  }finally{
   PORT_STAFF_ROLES.armory=armory;
  }
 };
 // Use the existing market stop stage as the parent of staffed storefronts.
 // Never add a second Return to Seaport option beside Back.
 const previousStopMenu=port55StopMenu;
 port55StopMenu=function(...args){
  if(player.flags?.port55CurrentStop!=='Market Area')
   return previousStopMenu.apply(this,args);
  const shops=Object.entries(PORT_STAFF_ROLES).map(([role,def])=>
   def.name.toUpperCase()+' — '+
   (portStaffState().assignments[role]||'NEED TO HIRE').toUpperCase());
  const patrolHere=player.flags?.seaport55?.freed&&
   typeof port55PatrolName==='function'&&port55PatrolName()==='Market Area';
  port55Submenu('Market Area',[
   ...shops,...(patrolHere?['TALK KAIDEN']:[]),'BACK'
  ]);
 };
 const previousPortCommand=port55Command;
 port55Command=function(cmd){
  if(stage==='port55Stop'&&player.flags?.port55CurrentStop==='Market Area'){
   if(['back','b','return','exit','return to harbor','return to seaport'].includes(cmd)){
    stage='seaport';port55Menu();return true;
   }
   const role=Object.keys(PORT_STAFF_ROLES).find(k=>
    cmd===k||cmd.startsWith(k+' —'));
   if(role){portStaffOpen(role);return true;}
  }
  return previousPortCommand.apply(this,arguments);
 };
 function returnToMarket(){
  delete player.flags.portStaffUI;
  player.flags.port55CurrentStop='Market Area';
  stage='port55Stop';
  port55StopMenu();
  return true;
 }
 // Armory receives the existing Seaport weapons/armor stock, now sold by
 // the trader assigned to the Armory rather than General Store.
 const basePrice=regionalEquipmentPrice;
 regionalEquipmentPrice=function(name,region){
  if(region!=='seaport')return basePrice.apply(this,arguments);
  const g=GEAR[name];if(!g||!g.id)return 0;
  const rating=Math.max(1,portStaffRating('armory'));
  const base=(50+3*g.level)*(g.rarity==='rare'?2:1);
  return Math.max(1,Math.round(base*(1-(rating-1)*.02)));
 };
 const previousChoices=portStaffChoices;
 portStaffChoices=function(title,choices){
  // Equipment is exclusively at the Armory; keep all the General Store's
  // other services and trade bonuses untouched.
  if(stage==='port55Service'){
   if(player.flags?.portStaffUI?.role==='general store'&&title==='SERVICES')
    choices=choices.filter(x=>x!=='BUY EQUIPMENT');
   // All storefronts exit to their immediate parent, Market Area.
   choices=choices.map(x=>x==='RETURN TO HARBOR'?'BACK TO MARKET':x);
  }
  return previousChoices.call(this,title,choices);
 };
 const previousRender=portStaffRender;
 portStaffRender=function(...args){
  const ui=player.flags?.portStaffUI;
  if(stage!=='port55Service'||ui?.role!=='armory')return previousRender.apply(this,args);
  if(!portRecruitUnlocked())return previousRender.apply(this,args);
  const state=portStaffState(),assigned=state.assignments.armory;
  // The existing renderer already handles hiring, replacing and releasing
  // staff, including confirmation and the save/autosave path.
  if(['assign','unassign','replace'].includes(ui.page))
   return previousRender.apply(this,args);
  if(ui.page==='equipment'){
   add('SEAPORT — ARMORY','place');
   const stock=regionalEquipmentStock('seaport');
   for(const slot of stock.slots)add(regionalEquipmentText(slot,'seaport'),GEAR[slot.name]?.rarity||'system');
   portStaffChoices('EQUIPMENT — PRICE PER ITEM',[
    ...stock.slots.filter(slot=>!slot.sold).map(slot=>'BUY '+slot.name.toUpperCase()),
    'BACK'
   ]);
   return;
  }
  if(ui.page!=='main')ui.page='main';
  add('SEAPORT — ARMORY','place');
  if(!assigned||!portStaffRating('armory')){
   add('NEED TO HIRE — Assign a wanderer with Trading aptitude to open the armory.','system');
   portStaffChoices('STAFFING',['ASSIGN STAFF','RETURN TO HARBOR']);
   return;
  }
  const rating=portStaffRating('armory');
  add('Armorer: '+assigned+' — Trading '+rating+'/5. Existing Seaport equipment stock and daily refill apply.','bright');
  portStaffChoices('SERVICES',[
   'BROWSE EQUIPMENT','INSPECT STAFF '+assigned.toUpperCase(),
   'ASSIGN STAFF','UNASSIGN STAFF','RETURN TO HARBOR'
  ]);
 };
 const previousService=portStaffServiceCommand;
 portStaffServiceCommand=function(cmd){
  const ui=player.flags?.portStaffUI,role=ui?.role;
  if(stage!=='port55Service')return previousService.apply(this,arguments);
  if(['back to market','return to harbor','return to seaport','exit'].includes(cmd)||
     (['back','b'].includes(cmd)&&ui?.page==='main'))return returnToMarket();
  if(role==='general store'&&cmd==='buy equipment'){
   add('Weapons and armor are sold at the Seaport Armory.','system');
   portStaffRender();return true;
  }
  if(role==='armory'){
   if(ui.page==='main'&&(cmd==='browse equipment'||cmd==='buy equipment')){
    if(!portStaffRating('armory')){portStaffRender();return true;}
    ui.page='equipment';portStaffRender();return true;
   }
   if(ui.page==='equipment'&&cmd.startsWith('buy ')){
    if(portStaffRating('armory'))regionalEquipmentBuy('seaport',cmd.slice(4));
    portStaffRender();return true;
   }
  }
  return previousService.apply(this,arguments);
 };
})();
