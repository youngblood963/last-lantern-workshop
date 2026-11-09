/* DEVTEST — game-wide return-last policy for shared menu constructors.
 * Menu ordering is decided before numeric bindings are created, so the
 * displayed button order and keyboard numbers always agree.
 * Mia's formerly late-appended Red option is composed with its menu.
 * No quest, NPC, economy, or combat rules are changed.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
 if(typeof port55Submenu!=='function')return;

 const isExit=label=>/^(?:return(?:\s|$)|back(?:\s|$)|leave(?:\s|$)|exit(?:\s|$))/i.test(String(label).trim());
 const exitLast=options=>{
  const normal=[],exits=[];
  for(const label of options) (isExit(label)?exits:normal).push(label);
  return normal.concat(exits);
 };
 // Apply one policy to the shared menu constructors, BEFORE they allocate
 // numeric choices. This keeps Classic BBS text, numbers and graphical buttons
 // in agreement. Do not rearrange button DOM independently.
 function solaceMenu(name,options){
  if(name==='r5DirectChoices'){
   if(stage==='lanternGate')return 'solace-gate';
   if(stage==='factoryForge')return 'forge-dialogue';
   if(stage==='factoryWorkshop'&&options.includes('EXIT FACTORY'))return 'forge-workshop';
   if(stage==='r11Craft'&&['murphy','forge'].includes(player.flags.r11Bench))
    return 'solace-crafting:'+player.flags.r11Bench;
  }
  if(stage!=='mercy')return null;
  if(name==='v48Choices'&&mercyLocation==='amii'&&player.flags.solaceMenu==='bank48')
   return 'solace-bank:'+(player.flags.v55AmiiTalk?'talk':player.flags.v48BankPage);
  if(name==='v53Choices'){
   if(mercyLocation==='postOffice')return 'solace-post-office';
   if(mercyLocation==='town'&&player.flags.v53BoardDraft!==undefined)return 'solace-board-confirm';
   if((player.flags.v53Sale||player.flags.v48Shop==='sell')&&
      (['johnny','wayne','jen','mara'].includes(mercyLocation)||townWandererFocus))return 'solace-sale';
   if(mercyLocation==='tim'&&player.flags.r18BribePending?.lawman==='Tim')return 'solace-tim-bribe';
   if(townWandererFocus&&currentTownWanderer){
    if(options.includes('LEAVE'))return 'solace-wanderer';
    if(options.includes('LEAVE BROWSE WARES')&&player.flags.v50Trade===currentTownWanderer)
     return 'solace-wanderer-stock';
   }
  }
  return null;
 }
 const seaportDirectStages=new Set([
  'seaport','port55Docks','port55Market','port55Kaiden','port55Pets','r11Board',
  'r11Drinks','r11Quest','r18Red','r6Room','r6Casino','r18Fence'
 ]);
 function seaportMenu(name){
  if(name==='r5DirectChoices'&&(seaportDirectStages.has(stage)||
     stage==='r18Miles'&&player.flags.r18MilesVisit?.place==='seaport'||
     stage==='r11Craft'&&player.flags.r11Bench==='seaport'))return 'seaport:'+stage;
  if(name==='v53Choices'&&['port55Service','port55Recruit','port55Guest'].includes(stage))
   return 'seaport:'+stage;
  return null;
 }
 const seaportExits=new Set([
  'BACK TO MARKET','RETURN TO HARBOR','RETURN TO SEAPORT','RETURN TO ROAD',
  'RETURN TO DOCKS','RETURN TO MARKET','RETURN TO EQUIPMENT','RETURN FROM MILES','RETURN TO MIA','RETURN TO CONVERSATION',
  'BACK AWAY','CANCEL HIRE','CANCEL STORE SALE','CANCEL UNASSIGNMENT','CANCEL ASSIGNMENT'
 ]);
 const navigationLabels=new Set(['BACK','(B) BACK','RETURN','RETURN TO TOWN','LEAVE','LEAVE BROWSE WARES','CANCEL SALE','CANCEL BRIBE','EXIT FACTORY']);
 function wrapArrayMenu(name){
  const upstream=globalThis[name];
  if(typeof upstream!=='function')return false;
  globalThis[name]=function(options,...rest){
   const seaport=Array.isArray(options)&&seaportMenu(name);
   if(seaport&&stage==='seaport')options=options.map(label=>label==='RETURN WEST'?'RETURN TO ROAD':label);
   const id=seaport||Array.isArray(options)&&solaceMenu(name,options);
   if(id){
    const exits=options.filter(label=>navigationLabels.has(label)||seaport&&seaportExits.has(label));
    // Distinct exits can have different effects. Retain the old path for those menus.
    if(new Set(exits).size<=1)return DevtestMenuModel.publishQueued(
     id,options,exits[0],labels=>upstream.call(this,labels,...rest),
     {direct:name==='r5DirectChoices'}
    );
   }
   return upstream.call(this,name!=='v48Choices'&&Array.isArray(options)?exitLast(options):options,...rest);
  };
  return true;
 }
 wrapArrayMenu('r5DirectChoices');
 wrapArrayMenu('v53Choices');
 wrapArrayMenu('v48Choices');
 const originalSubmenu=port55Submenu;
 port55Submenu=function(name,options){
  if(!Array.isArray(options))return originalSubmenu.apply(this,arguments);
  const exits=[...new Set(options.filter(label=>navigationLabels.has(label)||seaportExits.has(label)))];
  if(exits.length>1)return originalSubmenu.call(this,name,exitLast(options));
  return DevtestMenuModel.publishQueued('seaport:'+stage+':'+name,options,exits[0],
   labels=>originalSubmenu.call(this,name,labels),{direct:true});
 };

})();
