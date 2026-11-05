/* DEVTEST ONLY — retire King's Breaker from future Factory boss awards.
 * Keep GEAR definition intact for previously acquired equipment and saves.
 * Preserve one guaranteed boss weapon; remaining first-floor weights normalize
 * automatically in factoryRollBossWeapon (35 Dockside Cleaver / 25 Salvage Hook).
 */
(function(){
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
 if(typeof FACTORY_BOSS_LOOT==='undefined'||!Array.isArray(FACTORY_BOSS_LOOT[0]))return;
 const pool=FACTORY_BOSS_LOOT[0];
 for(let i=pool.length-1;i>=0;i--)if(pool[i]?.name==="King's Breaker")pool.splice(i,1);
 if(!pool.length)throw Error('Devtest Factory boss loot cannot be empty.');
})();
