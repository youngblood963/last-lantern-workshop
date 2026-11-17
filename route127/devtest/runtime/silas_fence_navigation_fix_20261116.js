/* DEVTEST ONLY — Silas menu routing after later Seaport menu replacements.
 * His option may be visible while the current stage is a Seaport submenu.
 * Do not alter gameplay, eligibility, prices, saves, or other commands. */
(() => {
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||
    typeof handleCommand!=='function'||typeof r18FenceMenu!=='function'||
    typeof r18FenceCommand!=='function'||typeof r18FenceAllowed!=='function')return;

 // Give Silas the same reliable graphical choice registration as other
 // Seaport residents. Legacy menu producers may leave stale numberedChoices
 // when an appended Corvette action arrives after the fence menu.
 if(typeof GraphicalUI!=='undefined'){
  const priorChoices=GraphicalUI.choices;
  GraphicalUI.choices=function(...args){
   if(stage!=='r18Fence'||!r18FenceAllowed())return priorChoices.apply(this,args);
   const quote=player.flags.r18FenceQuote;
   const options=quote?['CONFIRM SILAS SALE','CANCEL SILAS SALE']:
    [...player.pack.filter(r18FenceEligible).map(i=>'SELL TO SILAS '+r18ItemLabel(i).toUpperCase()),
     ...(typeof CorvetteRestoration!=='undefined'&&CorvetteRestoration.state().active&&!CorvetteRestoration.state().engineDelivered?['ASK SILAS ABOUT ENGINE']:[]),
     ...(typeof CorvetteRestoration!=='undefined'&&CorvetteRestoration.state().engineQuest&&!CorvetteRestoration.state().engineDelivered?['RETURN NESSAS LOCKET']:[]),
     'RETURN TO SEAPORT'];
   numberedChoices={};
   options.forEach((label,i)=>numberedChoices[String(i+1)]=label.toLowerCase());
   currentHotkeys={b:'back'};
   return options.map((label,i)=>({key:String(i+1),command:label.toLowerCase(),label}));
  };
 }
 const previousHandleCommand=handleCommand;
 const clean=v=>String(v??'').trim().toLowerCase();
 function shownSilas(){
  return Object.values(numberedChoices||{}).some(v=>clean(v)==='silas the fence');
 }
 function resolve(raw){
  const key=clean(raw);
  const mapped=numberedChoices?.[key]??currentHotkeys?.[key];
  return clean(mapped??raw);
 }
 handleCommand=async function(raw){
  if(busy||!r18FenceAllowed())return previousHandleCommand.apply(this,arguments);
  const cmd=resolve(raw);
  // Preserve the original save/load commands and every unrelated menu.
  if(stage==='r18Fence'&&!/^(?:save|load)(?:\s|$)/.test(cmd)){
   r18FenceCommand(cmd);
   globalThis.GraphicalUI?.schedule?.();
   return true;
  }
  if((cmd==='silas the fence'||cmd==='old customs office')&&
     (stage==='seaport'||shownSilas())){
   r18FenceMenu();
   globalThis.GraphicalUI?.schedule?.();
   return true;
  }
  return previousHandleCommand.apply(this,arguments);
 };
})();
