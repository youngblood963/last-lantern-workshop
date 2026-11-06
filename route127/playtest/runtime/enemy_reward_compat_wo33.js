/* Preserve pre-WO33 reward valuation despite repaired combat statistics. */
(()=>{
 'use strict';if(!/^\/route127\/playtest\/(?:index\.html)?$/.test(location.pathname))throw Error('WO33 requires Playtest');
 const purse=Economy.purse;
 Economy.purse=function(c,e,...rest){
  const old=c.wo33?.original;
  if(!old)return purse.call(this,c,e,...rest);
  const index=c.enemies?.indexOf(e),unit=e===c?old:index>=0?old.enemies?.[index]:null;
  return purse.call(this,old,unit||{...e,level:old.level,hp:old.hp,maxHp:old.maxHp},...rest);
 };
})();
