/* DEVTEST Tim: explicit two-choice bribe confirmation. */
(()=>{'use strict';if(!location.pathname.includes('/route127/devtest/'))return;
const base=v53TimMenu;
v53TimMenu=function(){
 const p=player.flags.r18BribePending;
 if(mercyLocation==='tim'&&p?.lawman==='Tim'){
  player.flags.solaceMenu='tim53';
  add('TIM MERCER — BRIBE OFFER','place');
  add('Offer '+p.price+' Bolts? Success clears your bounty. Failure adds a criminal charge. No payment is taken on failure.','system');
  v53Choices(['CONFIRM BRIBE','CANCEL BRIBE']);return;
 }
 return base.apply(this,arguments);
};
const prior=handleCommandCore;
handleCommandCore=async function(raw){
 const p=player.flags.r18BribePending;
 if(!busy&&stage==='mercy'&&mercyLocation==='tim'&&p?.lawman==='Tim'){
  const cmd=String(r5Mapped(raw)||'').toLowerCase();
  if(!['confirm bribe','cancel bribe'].includes(cmd)&&
      !/^(?:save|load|inventory|status|quests|map)(?:\b|$)/.test(cmd)){
   v53TimMenu();return;
  }
 }
 return prior.apply(this,arguments);
};
})();