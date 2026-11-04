/* DEVTEST — quest/key items are visible exclusively in Quest Items tab.
 * They remain inside the existing quest-item storage and cost zero pack slots.
 */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof TravelerPanels==='undefined')return;
const panel=TravelerPanels;
panel.items=function(){
 const pack=Array.isArray(player?.pack)?player.pack:[];
 return pack.filter(item=>{
  const type=item.type;
  if(this.filter==='Quest Items')return type==='quest'||type==='key';
  if(type==='quest'||type==='key')return false;
  if(this.filter==='All')return true;
  if(this.filter==='Equipment')return ['weapon','armor','accessory'].includes(type);
  if(this.filter==='Supplies')return ['consumable','tool','supply','valuable'].includes(type);
  if(this.filter==='Materials')return type==='material';
  return false;
 });
};
})();
