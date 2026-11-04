/* DEVTEST: Pay for each delivery in Neither Rain Nor Ruin; protect legacy progress. */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
 const DEST=['tim','jen','docks'],BOLTS=10,XP=10;
 const original=r18CourierDeliver;
 let checking=false;
 function award(q,dest,backpay){
  if(!q||!q.delivered?.[dest])return false;
  const paid=q.initialHandoffRewards||(q.initialHandoffRewards={});
  if(paid[dest])return false;
  // Set marker before XP/Bolts changes to make repeated calls idempotent.
  paid[dest]=true;
  gainBolts(BOLTS);gainXp(XP);
  add((backpay?'POSTAL DELIVERY BACKPAY':'POSTAL HANDOFF REWARD')+
   ' — '+dest.toUpperCase()+' +'+XP+' XP / +'+BOLTS+' BOLTS','reward');
  updateHud();
  return true;
 }
 function catchUp(){
  if(checking||!player?.flags?.r18Courier)return;
  checking=true;
  try {
   const q=player.flags.r18Courier;
   // The original delivery flag is authoritative; do not reward unmade deliveries.
   for(const d of DEST)if(q.delivered?.[d])award(q,d,true);
  }finally{checking=false;}
 }
 r18CourierDeliver=function(dest,...args){
  catchUp();
  const before=r18CourierState();
  const initial=before.phase==='initial'&&DEST.includes(dest)&&!before.delivered?.[dest];
  const result=original.call(this,dest,...args);
  if(result&&initial)award(r18CourierState(),dest,false);
  return result;
 };
 const oldSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){catchUp();return oldSync.apply(this,args)};
 // Existing prior deliveries receive the same one-time handoff reward.
 catchUp();
})();
