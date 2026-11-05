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
   const atMarket=currentStage==='port55Market'||currentStage==='portMarket'||
    (currentStage==='port55Stop'&&player.flags?.port55CurrentStop==='Market Area');
   if(!liberated){
    model.art='../devtest/assets/locations/seaport_occupied.png';
    model.title='Seaport — Occupied Harbor';
   }else if(atDocks){
    model.art='../devtest/seaport_liberation.png';
    model.title='Seaport — Harbor Docks';
   }else if(atMarket){
     // Dedicated Seaport outdoor market, using the existing location-art selector.
     model.art='../devtest/assets/locations/seaport_market_area.png';
     model.title='Seaport — Market Area';
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
  const armory=PORT_STAFF_ROLES.armory,originalAdd=add;
  try{
   delete PORT_STAFF_ROLES.armory;
   // Rename the one real exit in both Classic and graphical menus.
   add=function(value,cls){
    if(typeof value==='string'&&/^\\[\\d+\\] RETURN WEST$/.test(value))
     value=value.replace('RETURN WEST','RETURN TO ROAD');
    return originalAdd(value,cls);
   };
   const result=previousMenu.apply(this,args);
   for(const [key,value] of Object.entries(numberedChoices||{})){
    if(value==='return west')numberedChoices[key]='return to road';
   }
   // No second exit through a stray Back hotkey on this top-level menu.
   if(currentHotkeys?.b==='back')delete currentHotkeys.b;
   return result;
  }finally{
   add=originalAdd;
   PORT_STAFF_ROLES.armory=armory;
  }
 };
 const priorRoadExitCommand=port55Command;
 port55Command=function(cmd){
  if(stage==='seaport'&&cmd==='return to road')
   return priorRoadExitCommand.call(this,'return west');
  return priorRoadExitCommand.apply(this,arguments);
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
   if(title==='SERVICES'){
    // The hired worker's full portrait/stats are available in the roster.
    // Do not duplicate an old text-only INSPECT STAFF command in each shop.
    if(GraphicalUI.active())
     choices=choices.filter(x=>!x.startsWith('INSPECT STAFF '));
    if(player.flags?.portStaffUI?.role==='general store')
     choices=choices.filter(x=>x!=='BUY EQUIPMENT');
    // Backpack is already available in the permanent graphical sidebar.
    // Launching the legacy equipment interface from the Workshop can lose
    // its return-stage choices and strand the player on closing the panel.
    if(player.flags?.portStaffUI?.role==='workshop')
     choices=choices.filter(x=>!['MANAGE EQUIPMENT','INSPECT EQUIPMENT'].includes(x));
   }
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

/* DEVTEST staff roster picker: one clean action in the assignment menu.
 * Reuses the existing portrait-and-aptitude dossier and the existing
 * ASSIGN <name> -> CONFIRM ASSIGNMENT transaction. No save changes. */
(function(){
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||
    !location.pathname.includes('/route127/devtest/'))return;

 const earlierRender=portStaffRender;
 portStaffRender=function(...args){
  const ui=player.flags?.portStaffUI;
  if(stage==='port55Service'&&ui?.page==='assign'&&GraphicalUI.active()){
   const role=ui.role,def=PORT_STAFF_ROLES[role];
   if(def){
    add('SEAPORT — '+def.name.toUpperCase(),'place');
    add('Browse your hired wanderers to compare portraits, experience and aptitudes. Choose Assign to confirm a worker.','system');
    portStaffChoices('ASSIGN A WANDERER',['INSPECT WANDERERS','BACK']);
    return;
   }
  }
  return earlierRender.apply(this,args);
 };

 function picker(){
  const role=player.flags?.portStaffUI?.role;
  if(stage!=='port55Service'||player.flags?.portStaffUI?.page!=='assign'||!PORT_STAFF_ROLES[role])return;
  document.querySelector('.r127-roster-picker')?.close();
  if(!document.getElementById('r127-roster-picker-css')){
   const style=document.createElement('style');style.id='r127-roster-picker-css';
   style.textContent=`
   .r127-roster-picker{box-sizing:border-box;width:min(670px,94vw);max-height:85dvh;
    border:2px solid #99724d;border-radius:8px;color:#f1ddbd;
    background:#100e0c url('/route127/playtest/assets/ui/industrial-backing.png') center/100% 100% no-repeat;
    box-shadow:0 16px 55px #000e;padding:15px;font:13px/1.4 Georgia,serif}
   .r127-roster-picker::backdrop{background:#000c}
   .r127-roster-picker *{box-sizing:border-box}
   .r127-roster-head{display:flex;justify-content:space-between;align-items:center;gap:12px;
    border-bottom:1px solid #79583e;padding-bottom:10px;margin-bottom:10px}
   .r127-roster-head h2{font:700 20px Georgia,serif;color:#edc48a;margin:0}
   .r127-roster-list{max-height:62dvh;overflow-y:auto;display:grid;gap:7px}
   .r127-roster-item{display:flex;justify-content:space-between;align-items:center;gap:10px;
    border:1px solid #72553c;background:#15110ee0;padding:8px}
   .r127-roster-person{flex:1;text-align:left;min-width:0}
   .r127-roster-person strong{display:block;color:#65da7e;font-size:14px}
   .r127-roster-person span{display:block;color:#cdbba0;font-size:12px}
   .r127-roster-picker button{border:1px solid #9d8060;background:#352719;color:#f5e0be;
    font:700 12px Georgia,serif;padding:8px 10px;cursor:pointer}
   .r127-roster-picker button:disabled{opacity:.46;cursor:not-allowed}
   .r127-roster-empty{padding:15px;color:#e6cfb0}
   @media(max-width:470px){.r127-roster-item{flex-wrap:wrap}.r127-roster-person{flex-basis:100%}}
   `;
   document.head.appendChild(style);
  }
  const d=document.createElement('dialog');d.className='r127-roster-picker';
  d.setAttribute('aria-label','Hired wanderers for '+PORT_STAFF_ROLES[role].name);
  const head=document.createElement('div');head.className='r127-roster-head';
  const title=document.createElement('h2');title.textContent='HIRED WANDERERS — '+PORT_STAFF_ROLES[role].name.toUpperCase();
  const close=document.createElement('button');close.type='button';close.textContent='X — Close';
  close.addEventListener('click',()=>d.close());head.append(title,close);d.append(head);
  const list=document.createElement('div');list.className='r127-roster-list';
  const hired=[...portStaffState().hired];
  for(const name of hired){
   const w=wandererByName(name);if(!w)continue;
   const assigned=portStaffAssignment(name);
   const eligible=!assigned||assigned===role;
   const skill=PORT_STAFF_ROLES[role].skill;
   const rating=portAptitudes(w)[skill];
   const item=document.createElement('div');item.className='r127-roster-item';
   const person=document.createElement('button');person.type='button';person.className='r127-roster-person';
   const label=document.createElement('strong');
   // The established graphical identity map owns display surnames.
   // Keep short handles in commands/saves; never substitute a different
   // surname from descriptive legacy profiles (e.g. Finch/Cutter).
   label.textContent=globalThis.RouteIdentity?.wanderer?.[name]||
    (typeof RouteIdentity!=='undefined'?RouteIdentity.wanderer?.[name]:null)||name;
   const details=document.createElement('span');
   details.textContent=(w.occupation||'Wanderer')+' · '+skill.toUpperCase()+' '+rating+'/5'+
    (assigned?' · '+(assigned===role?'Currently here':'Assigned: '+PORT_STAFF_ROLES[assigned]?.name):' · Available');
   person.append(label,details);person.title='View portrait and full stats';
   person.addEventListener('click',()=>{
    const file=globalThis.Route127WandererPortraitFiles?.[name];
    if(file&&globalThis.Route127WandererInfo?.open){
     globalThis.Route127WandererInfo.open(name,
      new URL('assets/wanderers/'+file,new URL('/route127/devtest/',location.origin)).href);
    }else{
     const note=document.createElement('p');note.textContent='Portrait is not available for '+name+'.';
     item.appendChild(note);
    }
   });
   const assign=document.createElement('button');assign.type='button';
   assign.textContent=assigned===role?'REASSIGN':'ASSIGN';
   assign.disabled=!eligible;
   assign.title=eligible?'Choose this wanderer':'Already working at another business';
   assign.addEventListener('click',()=>{
    d.close();
    // Same confirmation transaction as the original numbered menu.
    portStaffServiceCommand('assign '+name.toLowerCase());
    if(typeof GraphicalUI!=='undefined')GraphicalUI.schedule();
   });
   item.append(person,assign);list.appendChild(item);
  }
  if(!list.children.length){
   const empty=document.createElement('p');empty.className='r127-roster-empty';
   empty.textContent='No hired wanderers yet. Recruit people on the road first.';
   list.appendChild(empty);
  }
  d.appendChild(list);
  d.addEventListener('close',()=>d.remove(),{once:true});
  document.body.appendChild(d);d.showModal();close.focus();
 }
 const earlierCommand=portStaffServiceCommand;
 portStaffServiceCommand=function(cmd){
  if(stage==='port55Service'&&player.flags?.portStaffUI?.page==='assign'&&
     cmd==='inspect wanderers'&&GraphicalUI.active()){
   picker();return true;
  }
  return earlierCommand.apply(this,arguments);
 };
})();

/* DEVTEST: Workshop equipment softlock repair.
 * Remove the redundant legacy inventory route (Backpack remains on the
 * graphical sidebar), and heal stale sessions that already used that route. */
(function(){
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
 const oldService=portStaffServiceCommand;
 portStaffServiceCommand=function(cmd){
  if(stage==='port55Service'&&player.flags?.portStaffUI?.role==='workshop'&&
     ['manage equipment','inspect equipment'].includes(String(cmd).toLowerCase())){
   player.flags.portStaffUI.page='main';
   portStaffRender();return true;
  }
  return oldService.apply(this,arguments);
 };
 if(typeof TravelerPanels!=='undefined'&&typeof TravelerPanels.close==='function'){
  const priorClose=TravelerPanels.close;
  TravelerPanels.close=function(...args){
   const outcome=priorClose.apply(this,args);
   if(!this.dialog&&stage==='port55Service'&&player.flags?.portStaffUI?.role==='workshop'&&
      !Object.keys(numberedChoices||{}).length){
    player.flags.portStaffUI.page='main';
    portStaffRender();
   }
   return outcome;
  };
 }
})();

/* DEVTEST: keep exactly one top-level Seaport road exit in graphics. */
(function(){
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
 const prior=GraphicalUI.choices;
 GraphicalUI.choices=function(...args){
  const rows=prior.apply(this,args);
  if(stage!=='seaport'||!this.active())return rows;
  const exiting=c=>['return west','return to road','back','b','leave','west'].includes(String(c).toLowerCase());
  const chosen=rows.find(r=>['back','b'].includes(String(r.command).toLowerCase()))||rows.find(r=>exiting(r.command));
  const remaining=rows.filter(r=>!exiting(r.command));
  if(chosen)remaining.push({...chosen,label:'RETURN TO ROAD'});
  return remaining;
 };
})();
/* DEVTEST liberated Seaport visiting wanderers.
 * Global wanderers can drift into Seaport after liberation, even if they are
 * not hired. Town Streets hosts the visitor; existing road roster and save
 * locations remain authoritative. No duplicate wanderers or new save fields. */
(function(){
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
 const liberated=()=>player.flags?.seaport55?.freed===true;
 const eligible=w=>w&&!portIsHired(w.name)&&wandererAlive(w);
 function enable(){
  if(liberated()&&!wandererSpots.includes('seaport'))wandererSpots.push('seaport');
 }
 function visitors(){
  if(!liberated())return [];
  return wanderers.filter(w=>eligible(w)&&wandererLocations[w.name]==='seaport');
 }
 function visitor(){
  const density=globalThis.Route127WandererDensity;
  if(!density)return visitors()[0]||null;
  const name=density.seaportName();
  return name?visitors().find(w=>w.name===name)||null:null;
 }
 function initialVisitor(){
  if(!liberated())return;
  const density=globalThis.Route127WandererDensity;
  if(density){
   const name=density.seaportName(),w=name&&wandererByName(name);
   if(w&&eligible(w))wandererLocations[w.name]='seaport';
   return;
  }
  if(visitors().length)return;
  const pool=wanderers.filter(w=>eligible(w)&&![currentRoadWanderer,currentTownWanderer].includes(w.name));
  if(pool.length)wandererLocations[pool[Math.floor(Math.random()*pool.length)].name]='seaport';
 }
 const origMove=moveWanderers;
 moveWanderers=function(...args){enable();return origMove.apply(this,args);};
 const origFree=port55Free;
 port55Free=function(...args){
  const result=origFree.apply(this,args);
  if(liberated()){enable();initialVisitor();}
  return result;
 };
 const origArrive=portArrive;
 portArrive=function(...args){
  enable(); // Do not reset an existing visitor on returning to town.
  if(liberated())initialVisitor();
  return origArrive.apply(this,args);
 };
 const origMenu=port55Menu;
 port55Menu=function(...args){
  enable();
  // Also populate an existing liberated save when its player is already
  // inside Seaport and the new visitor feature is first loaded.
  if(liberated())initialVisitor();
  // Narration before options: later add() calls clear graphical choice state.
  if(liberated()&&visitor())
   add('A traveler has been seen in the Town Streets.','system');
  return origMenu.apply(this,args);
 };
 const origStopMenu=port55StopMenu;
 port55StopMenu=function(...args){
  if(stage==='port55Stop'&&player.flags?.port55CurrentStop==='Town Streets'&&liberated()){
   const person=visitor();
   const patrol=port55PatrolName()==='Town Streets';
   const options=[
    ...(person?['TALK TO WANDERER — '+person.name.toUpperCase()]:[]),
    ...(patrol?['TALK KAIDEN']:[]),'RETURN TO HARBOR'];
   if(person){
    const display=(typeof RouteIdentity!=='undefined'?
       RouteIdentity.wanderer?.[person.name]:null)||person.name;
    add(display+' is visiting the fish market.','bright');
   }
   // Publish numbered choices last so the buttons remain clickable.
   port55Submenu('Town Streets',options);
   return;
  }
  return origStopMenu.apply(this,args);
 };
 function guestMenu(){
  const name=player.flags?.port55VisitingName,w=name&&wandererByName(name);
  if(!liberated()||!eligible(w)||wandererLocations[w.name]!=='seaport'){
   delete player.flags.port55VisitingName;
   delete player.flags.v50Trade;delete player.flags.v53Sale;
   currentTownWanderer=null;townWandererFocus=null;pendingTownFight=null;
   stage='port55Stop';player.flags.port55CurrentStop='Town Streets';
   return port55StopMenu();
  }
  currentTownWanderer=w.name;townWandererFocus=w.name;
  if(pendingTownFight===w.name)return v53Choices(['CONFIRM FIGHT','BACK OFF']);
  if(player.flags.v53Sale)return v53SaleMenu();
  if(player.flags.v50Trade===w.name)return v50Trade(w);
  v53WandererMenu(w,false); // The same menu Solace uses.
 }
 const origResume=port55Resume;
 port55Resume=function(...args){
  if(stage==='port55Guest')return guestMenu();
  return origResume.apply(this,args);
 };
 const originalRenderChoices=renderCurrentChoices;
 renderCurrentChoices=function(...args){
  if(stage==='port55Guest')return guestMenu();
  return originalRenderChoices.apply(this,args);
 };
 const origCommand=port55Command;
 port55Command=function(cmd){
  if(stage==='port55Stop'&&player.flags?.port55CurrentStop==='Town Streets'&&
     cmd.startsWith('talk to wanderer')){
   const w=visitor();if(!w){port55StopMenu();return true;}
   player.flags.port55VisitingName=w.name;
   stage='port55Guest';guestMenu();return true;
  }
  if(stage==='port55Guest'){
   const w=wandererByName(player.flags?.port55VisitingName);
   if(!w||!eligible(w)||wandererLocations[w.name]!=='seaport'){guestMenu();return true;}
   if(['leave','back','b','exit','return','back to town streets'].includes(cmd)){
    if(player.flags.v50Trade){delete player.flags.v50Trade;delete player.flags.v50Sale;delete player.flags.v53Sale;guestMenu();return true;}
    delete player.flags.port55VisitingName;
    currentTownWanderer=null;townWandererFocus=null;pendingTownFight=null;
    stage='port55Stop';player.flags.port55CurrentStop='Town Streets';port55StopMenu();return true;
   }
   if(cmd==='back off'&&pendingTownFight===w.name){pendingTownFight=null;guestMenu();return true;}
   if(cmd==='confirm fight'&&pendingTownFight===w.name){
    player.flags.devSeaportGuestFight=w.name;
    handleTownWanderer('confirm fight');
    if(stage!=='combat'){delete player.flags.devSeaportGuestFight;guestMenu();}
    return true;
   }
   if(player.flags.v50Trade===w.name){
    if(['leave browse wares','leave trade'].includes(cmd)){
     delete player.flags.v50Trade;delete player.flags.v50Sale;delete player.flags.v53Sale;guestMenu();return true;
    }
    if(v50TradeCommand(cmd))return true;
    guestMenu();return true;
   }
   if(cmd.startsWith('small talk')||cmd.startsWith('talk ')){
    ws(w.name);add(wandererDialogue(w),'bright');guestMenu();return true;
   }
   if(cmd.startsWith('browse wares')||cmd==='trade'){
    if(v50Profile(w).hostile){add(w.name+' refuses to trade.','system');guestMenu();return true;}
    v50Trade(w);return true;
   }
   if(cmd.startsWith('steal')){v52Pickpocket(w,true);guestMenu();return true;}
   if(cmd.startsWith('inspect')){
    v50Inspect(w);
    const portrait=globalThis.Route127WandererPortraitFiles?.[w.name];
    if(portrait&&globalThis.Route127WandererInfo?.open)
     globalThis.Route127WandererInfo.open(w.name,new URL('assets/wanderers/'+portrait,new URL('/route127/devtest/',location.origin)).href);
    guestMenu();return true;
   }
   if(cmd.startsWith('fight')){handleTownWanderer('fight '+w.name.toLowerCase());guestMenu();return true;}
   if(cmd.startsWith('recruit')){
    player.flags.portHireOffer={name:w.name,origin:'port55Guest'};
    stage='port55Recruit';portHireMenu();return true;
   }
   guestMenu();return true;
  }
  return origCommand.apply(this,arguments);
 };
 const origRecruit=portRecruitCommand;
 portRecruitCommand=function(cmd){
  const offer=player.flags?.portHireOffer;
  if(stage==='port55Recruit'&&offer?.origin==='port55Guest'){
   if(['cancel hire','back','b','cancel','exit'].includes(cmd)){
    delete player.flags.portHireOffer;stage='port55Guest';guestMenu();return true;
   }
   const hiredBefore=portIsHired(offer.name);
   const result=origRecruit.apply(this,arguments);
   if(!hiredBefore&&portIsHired(offer.name)){
    delete player.flags.port55VisitingName;
    currentTownWanderer=null;townWandererFocus=null;
    stage='port55Stop';player.flags.port55CurrentStop='Town Streets';
    port55StopMenu();
   }else if(stage==='port55Guest')guestMenu();
   return result;
  }
  return origRecruit.apply(this,arguments);
 };
 // Reuse existing Solace legal and merchant mechanics; only substitute the
 // true town location and restore the Seaport stage after merchant transactions.
 const previousCrimeLocation=v52CrimeLocation;
 v52CrimeLocation=function(...args){
  if(stage==='port55Guest'||player.flags?.devSeaportGuestFight)return 'Seaport — Town Streets';
  return previousCrimeLocation.apply(this,args);
 };
 const previousTradeCommand=v50TradeCommand;
 v50TradeCommand=function(...args){
  if(stage!=='port55Guest')return previousTradeCommand.apply(this,args);
  stage='mercy';
  try{return previousTradeCommand.apply(this,args);}
  finally{if(stage==='mercy')stage='port55Guest';}
 };
 const previousSaleCommand=v53SaleCommand;
 v53SaleCommand=function(...args){
  if(stage!=='port55Guest')return previousSaleCommand.apply(this,args);
  stage='mercy';
  try{return previousSaleCommand.apply(this,args);}
  finally{if(stage==='mercy')stage='port55Guest';}
 };
 // The native town-wanderer combat path already records assault and murder.
 // Only redirect its terminal menu back to Seaport (not Solace).
 const previousShowContext=showCurrentContext;
 showCurrentContext=function(...args){
  if(stage==='mercy'&&player.flags?.devSeaportGuestFight){
   delete player.flags.devSeaportGuestFight;
   delete player.flags.port55VisitingName;
   stage='port55Stop';player.flags.port55CurrentStop='Town Streets';
   currentTownWanderer=null;townWandererFocus=null;pendingTownFight=null;
   return port55StopMenu();
  }
  return previousShowContext.apply(this,args);
 };
 // Restore old saves at the Seaport stage without making residents appear
 // while occupied, and without requiring a new game.
 addEventListener('DOMContentLoaded',()=>{if(liberated())enable();},{once:true});
})();

/* DEVTEST: one authoritative graphical Seaport staff-label / Market menu pass.
 * Read staffing state whenever each menu is shown. Internal commands keep
 * their original short names; only player-facing labels use display surnames.
 */
(function(){
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
 const market=()=>stage==='port55Stop'&&player.flags?.port55CurrentStop==='Market Area';
 const full=name=>(typeof RouteIdentity!=='undefined'?RouteIdentity.wanderer?.[name]:null)||name;
 const roleKey=cmd=>Object.keys(PORT_STAFF_ROLES).find(role=>
  cmd===role||cmd.startsWith(role+' —'));
 const earlierStop=port55StopMenu;
 port55StopMenu=function(...args){
  if(!market())return earlierStop.apply(this,args);
  const options=Object.entries(PORT_STAFF_ROLES).map(([role,def])=>{
   const assigned=portStaffState().assignments[role];
   return def.name.toUpperCase()+' — '+(assigned?full(assigned).toUpperCase():'NEED TO HIRE');
  });
  options.push('PET STORE');
  if(port55PatrolName()==='Market Area')options.push('TALK KAIDEN');
  options.push('BACK');
  port55Submenu('Market Area',options);
 };
 const earlierCommand=port55Command;
 port55Command=function(cmd){
  if(market()&&cmd==='pet store'){
   stage='port55Vendor';port55Vendor();return true;
  }
  if(stage==='port55Vendor'&&
     ['back','b','exit','return','return to harbor'].includes(cmd)&&
     player.flags?.port55CurrentStop==='Market Area'){
   stage='port55Stop';port55StopMenu();return true;
  }
  return earlierCommand.apply(this,arguments);
 };
 // Graphical label modification never changes numbered choice commands,
 // staffing assignments or saved internal wanderer names.
 const earlierChoices=GraphicalUI.choices;
 GraphicalUI.choices=function(...args){
  const rows=earlierChoices.apply(this,args);
  if(!this.active()||!['seaport','port55Stop'].includes(stage))return rows;
  return rows.map(row=>{
   const cmd=String(row.command||'').toLowerCase();
   const role=roleKey(cmd);
   if(!role)return row;
   const def=PORT_STAFF_ROLES[role],assigned=portStaffState().assignments[role];
   return {...row,label:def.name+' — '+(assigned?full(assigned):'Need to Hire')};
  });
 };
})();

/* DEVTEST graphical navigation: hide duplicate B BACK buttons only when a
 * numbered exit already handles returning. Keep the original hotkey and
 * command mappings intact for Classic BBS and keyboard navigation. */
(function(){
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
 const previousChoices=GraphicalUI.choices;
 GraphicalUI.choices=function(...args){
  const rows=previousChoices.apply(this,args);
  if(!this.active())return rows;
  // On the two-way Seaport road, NORTH and SOUTH are the real exits.
  // The inherited B BACK has no action here; hide only its graphical button.
  const road=typeof lanternState==='function'?lanternState():null;
  if(stage==='lanternRoad'&&road?.currentEdgeId==='boulder-junction--seaport'&&
     rows.filter(r=>/^\d+$/.test(String(r.key))).length>=2){
   return rows.filter(r=>!(String(r.key).toLowerCase()==='b'&&
     /^back$/i.test(String(r.command||'').trim())));
  }
  const exits=rows.filter(r=>/^\d+$/.test(String(r.key))&&
   /^(?:back|return(?: to (?:seaport|harbor|town|road|market|docks|previous menu))?|leave(?: (?:area|shop|store))?)$/i.test(String(r.command||'').trim()));
  if(!exits.length)return rows;
  return rows.filter(r=>!(String(r.key).toLowerCase()==='b'&&
   /^(?:back|return)$/i.test(String(r.command||'').trim())));
 };
})();

/* DEVTEST presentation: location plates are neutral, wanderers stay green. */
(function(){
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
 const oldSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const r=oldSync.apply(this,args),caption=this.element?.caption;
  if(caption){
   if(stage==='port55Stop'&&player.flags?.port55CurrentStop==='Town Streets'){
    caption.replaceChildren(document.createTextNode('Seaport — Town Streets'));
    caption.style.setProperty('color','#eed8b8','important');
   }else caption.style.removeProperty('color');
  }
  return r;
 };
})();
