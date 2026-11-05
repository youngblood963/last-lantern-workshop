/* DEVTEST-only one-tap rescue at the zero-turn camp screen.
 * Replaces the graphical Save Current choice there; leaves gameplay,
 * normal turn refills, Classic BBS and stored characters untouched.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
 const command='devtest emergency one turn';
 const label='Fucked up again, Syn? Tap for +1 Turn';
 const originalChoices=GraphicalUI.choices;
 GraphicalUI.choices=function(...args){
  const rows=originalChoices.apply(this,args);
  if(stage!=='zeroTurns'||this.preference()!=='graphics')return rows;
  const save=rows.find(x=>/^(save current|save)$/i.test(String(x.command).trim()));
  const entry={key:save?.key||String(rows.length+1),command,label};
  return save?rows.map(x=>x===save?entry:x):[...rows,entry];
 };
 const originalDispatch=GraphicalUI.dispatch;
 GraphicalUI.dispatch=async function(choice){
  if(stage==='zeroTurns'&&choice?.command===command&&this.preference()==='graphics'){
   if(busy)return false;
   if(player.turns<=0)player.turns=Math.min(Number(player.maxTurns)||150,1);
   // Restore the exact road/location preserved by noTurnsMenu.
   // This is the same path the normal daily refill uses.
   if(typeof restoreTurnLocation==='function')restoreTurnLocation();
   else {
    stage=player.flags.turnResumeStage||'between';
    player.flags.turnResumeStage='';
   }
   add('DEVTEST RESCUE — +1 TURN. Remember to enable Unlimited Turns in Options!','reward');
   if(typeof updateHud==='function')updateHud();
   if(typeof v49Autosave==='function')v49Autosave();
   if(typeof renderCurrentChoices==='function')renderCurrentChoices();
   this.sync();
   return true;
  }
  return originalDispatch.apply(this,arguments);
 };
})();
