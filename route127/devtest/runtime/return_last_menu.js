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
 function wrapArrayMenu(name){
  const upstream=globalThis[name];
  if(typeof upstream!=='function')return false;
  globalThis[name]=function(options,...rest){
   return upstream.call(this,Array.isArray(options)?exitLast(options):options,...rest);
  };
  return true;
 }
 wrapArrayMenu('r5DirectChoices');
 wrapArrayMenu('v53Choices');
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
