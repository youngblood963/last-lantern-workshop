/* DEVTEST ONLY — Silas menu routing after later Seaport menu replacements.
 * His option may be visible while the current stage is a Seaport submenu.
 * Do not alter gameplay, eligibility, prices, saves, or other commands. */
(() => {
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||
    typeof handleCommand!=='function'||typeof r18FenceMenu!=='function'||
    typeof r18FenceCommand!=='function'||typeof r18FenceAllowed!=='function')return;

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
