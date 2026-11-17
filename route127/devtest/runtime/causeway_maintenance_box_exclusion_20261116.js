/* DEVTEST ONLY — exclude Maintenance Box and both arenas on Causeway.
 * CAUSEWAY is a scenic overlay on the coastal encounter pool. Exclude
 * only these encounters at selection time; preserve their canonical identities,
 * mechanics, art, and eligibility everywhere else. Existing pending
 * encounters are not rewritten or discarded.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'
   ||typeof r10Candidates!=='function'
   ||typeof r10Pool!=='function'
   ||typeof route127CurrentRegion!=='function')return;
 const excluded=new Set(['MAINTENANCE BOX','THE FIGHTING RING','THE FORGOTTEN ARENA','TOMMY BRIGGS — POSTAL ENCOUNTER','THE FENCE ARTIST']);
 const previous=r10Candidates;
 r10Candidates=function(legacyPool,kind){
  const candidates=previous.apply(this,arguments);
  const state=typeof lanternState==='function'?lanternState():null;
  if(!state?.currentEdgeId||route127CurrentRegion(state)!=='CAUSEWAY')return candidates;
  const pool=r10Pool(legacyPool);
  return candidates.filter(index=>!excluded.has(pool[index]?.title));
 };
 globalThis.Route127CausewayMaintenanceBoxPolicy=Object.freeze({
  exclude:[...excluded],region:'CAUSEWAY',scope:'new encounter selection'
 });
})();