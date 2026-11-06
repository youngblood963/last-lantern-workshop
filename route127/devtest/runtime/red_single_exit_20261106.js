/* DEVTEST — one graphical exit from Red's conversation.
 * Keep actual B keyboard handling for Classic BBS; remove only the redundant
 * graphical B BACK when RETURN TO MIA is already offered.
 * Poster confrontation keeps its own RETURN TO CONVERSATION navigation.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
 const oldChoices=GraphicalUI.choices;
 GraphicalUI.choices=function(...args){
  const rows=oldChoices.apply(this,args);
  if(stage!=='r18Red'||!this.active())return rows;
  const norm=v=>String(v||'').trim().toLowerCase();
  if(!rows.some(row=>norm(row.command)==='return to mia'))return rows;
  return rows.filter(row=>!(
   norm(row.key)==='b'&&norm(row.command)==='back'
  ));
 };
})();
