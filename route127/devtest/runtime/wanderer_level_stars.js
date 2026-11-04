/* Route 127 — DEVTEST ONLY: wanderer skill progression pilot.
 * Level 1 and Level 20 must feel different. Same 4 existing staff aptitudes;
 * keep actual character IDs, levels, jobs, recruitment, combat and loot intact.
 * This wrapper only changes aptitude ratings, including older saved profiles.
 */
(() => {
  'use strict';
  if (globalThis.ROUTE127_ENV?.name !== 'DEVTEST' ||
      !/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname) ||
      typeof portAptitudes !== 'function' ||
      typeof WandererWorldExpansion === 'undefined') return;

  const KEYS = Object.freeze(['medicine','trading','mechanics','banking']);
  const VERSION = 'level-stars-v1';
  const tier = level => {
    const n = Math.min(20,Math.max(1,Math.floor(Number(level)||1)));
    if(n <= 3) return [2,1,1,1];
    if(n <= 5) return [2,2,1,1];
    if(n <= 7) return [3,2,2,1];
    if(n <= 9) return [3,3,2,2];
    if(n <= 11) return [4,3,2,2];
    if(n <= 13) return [4,4,3,2];
    if(n <= 15) return [5,4,3,3];
    if(n <= 17) return [5,5,3,3];
    if(n <= 19) return [5,5,4,3];
    return [5,5,4,4];
  };
  const previous = portAptitudes;
  portAptitudes = function(w) {
    if(!w) return previous(w);
    // Existing profile/definition level is authoritative. Never level up a wanderer here.
    const original = previous(w);
    const state = ws(w.name);
    const level = Math.max(1,Math.floor(Number(w.level)||1));
    if(state.r127AptitudeVersion === VERSION && state.r127AptitudeLevel === level)
      return state.seaportAptitudes;
    // Retain the pre-scaling save values for a future migration/revert.
    if(!state.r127OriginalAptitudes)
      state.r127OriginalAptitudes = Object.fromEntries(KEYS.map(k => [k, Number(original[k])||1]));
    const designed = WandererWorldExpansion.definition(w)?.aptitudes || state.r127OriginalAptitudes;
    const ranking = KEYS.map((key,index) => ({key,index,original:Number(designed[key])||1}))
      .sort((a,b) => b.original-a.original || a.index-b.index);
    const values = tier(level);
    state.seaportAptitudes = Object.fromEntries(ranking.map((entry,i)=>[entry.key,values[i]]));
    state.r127AptitudeVersion = VERSION;
    state.r127AptitudeLevel = level;
    return state.seaportAptitudes;
  };
  globalThis.Route127WandererStarScale = Object.freeze({version:VERSION,tier});
})();
