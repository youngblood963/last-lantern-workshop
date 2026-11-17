/* DEVTEST — final graphical transcript presentation guard.
 * DOM visibility only. The text/commands remain intact for Classic BBS.
 * Do not filter wanderer, narrative, quest, reward, or warning messages. */
(() => {
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='PLAYTEST'||typeof GraphicalUI==='undefined')return;
 const log=document.getElementById('screen');
 if(!log)return;
 const location=/^(?:SEAPORT|SOLACE|FACTORY|INDUSTRIAL|CENTRAL|LOWLANDS|CAUSEWAY|NORTH|EAST|WEST|RUSTY LANTERN|RUSTY ANCHOR|SCRAP YARD|ROUTE 127)\s*[—–-]\s*[A-Z0-9][A-Z0-9 '&’()./-]{1,75}$/;
 const command=/^>\s*(?:\d{1,2}|[a-z])\s*$/i;
 const important=/\b(?:QUEST|REWARD|WARNING|BOUNTY|XP|BOLTS|DAMAGE|HP|WANDERER)\b/;
 function apply(line,graphics){
  if(!line?.classList?.contains('line'))return;
  const value=(line.textContent||'').trim();
  const redundant=line.classList.contains('place')||
    command.test(value)||(location.test(value)&&!important.test(value));
  if(graphics&&redundant){
   if(line.style.getPropertyValue('display')!=='none'||line.style.getPropertyPriority('display')!=='important')
    line.style.setProperty('display','none','important');
   line.dataset.r127GraphicsHidden='true';
  }else if(line.dataset.r127GraphicsHidden==='true'){
   line.style.removeProperty('display');
   delete line.dataset.r127GraphicsHidden;
  }
 }
 function refresh(){
  const graphics=GraphicalUI.active();
  for(const line of log.children)apply(line,graphics);
 }
 const beforeSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=beforeSync.apply(this,args);
  refresh();
  return result;
 };
 const observer=new MutationObserver(records=>{
  const rows=new Set();
  for(const record of records){
   const target=record.target.nodeType===1?record.target:record.target.parentElement;
   const line=target?.closest?.('.line');if(line)rows.add(line);
   for(const n of record.addedNodes||[]){
    if(n.nodeType!==1)continue;
    if(n.classList?.contains('line'))rows.add(n);
    else for(const l of n.querySelectorAll?.('.line')||[])rows.add(l);
   }
  }
  const graphics=GraphicalUI.active();
  for(const row of rows)apply(row,graphics);
 });
 observer.observe(log,{childList:true,characterData:true,subtree:true});
 refresh();
})();
