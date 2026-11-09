/* DEVTEST — game-wide return-last policy for shared menu constructors.
 * Menu ordering is decided before numeric bindings are created, so the
 * displayed button order and keyboard numbers always agree.
 * Mia's formerly late-appended Red option is composed with its menu.
 * No quest, NPC, economy, or combat rules are changed.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
 if(typeof port55Submenu!=='function'||typeof port55MiaMenu!=='function')return;

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
 const navigationLabels=new Set(['BACK','(B) BACK','RETURN','RETURN TO TOWN','LEAVE','LEAVE BROWSE WARES','CANCEL SALE','CANCEL BRIBE','EXIT FACTORY']);
 function wrapArrayMenu(name){
  const upstream=globalThis[name];
  if(typeof upstream!=='function')return false;
  globalThis[name]=function(options,...rest){
   const id=Array.isArray(options)&&solaceMenu(name,options);
   if(id){
    const exits=options.filter(label=>navigationLabels.has(label));
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
  return originalSubmenu.call(this,name,Array.isArray(options)?exitLast(options):options);
 };

 // Replace the split R11 + R18 menu assembly in DEVTEST ONLY. The existing
 // Red dialogue/quest handler is still used; only its entry button is moved.
 port55MiaMenu=function(){
  stage='port55Mia';
  if((Number(day)||1)<(Number(player.flags.r18MiaBarredUntil)||0)){
   add('MIA > Not until day '+player.flags.r18MiaBarredUntil+'. Leave.','danger');
   return port55Submenu('The Rusty Anchor — Service Refused',['RETURN TO HARBOR']);
  }
  const choices=[
   'SMALL TALK','BUY DRINKS','GAMBLE',
   player.flags.r6AnchorRoomOwned?'GO TO ROOM':'RENT ROOM — 2000 BOLTS',
   ...(portRecruitUnlocked()?['ASK ABOUT HOUSE RULES']:[]),
   ...(typeof r18RedAllowed==='function'&&r18RedAllowed()?['TALK TO RED']:[]),
   'RETURN TO HARBOR'
  ];
  return port55Submenu('The Rusty Anchor — Mia',choices);
 };
})();
