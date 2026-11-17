/* DEVTEST ONLY — keep the GLOBAL Maintenance Box in all other regions.
 * CAUSEWAY is a scenic overlay on the coastal encounter pool. Exclude
 * this one encounter at selection time; preserve its canonical identity,
 * mechanics, art, and eligibility everywhere else. Existing pending
 * encounters are not rewritten or discarded.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'
   ||typeof r10Candidates!=='function'
   ||typeof r10Pool!=='function'
   ||typeof route127CurrentRegion!=='function')return;
 const previous=r10Candidates;
 r10Candidates=function(legacyPool,kind){
  const candidates=previous.apply(this,arguments);
  const state=typeof lanternState==='function'?lanternState():null;
  if(!state?.currentEdgeId||route127CurrentRegion(state)!=='CAUSEWAY')return candidates;
  const pool=r10Pool(legacyPool);
  return candidates.filter(index=>pool[index]?.title!=='MAINTENANCE BOX');
 };
 globalThis.Route127CausewayMaintenanceBoxPolicy=Object.freeze({
  exclude:'MAINTENANCE BOX',region:'CAUSEWAY',scope:'new encounter selection'
 });
})();