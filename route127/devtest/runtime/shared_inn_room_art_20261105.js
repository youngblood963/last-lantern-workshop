/* WO49 — DEVTEST only: shared Solace/Seaport rented-room artwork.
 * One uploaded asset for both inns. Pure presentation: no rent, rest,
 * chest, quest, save, or navigation changes.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
 const previousModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const model=previousModel.apply(this,args);
  const solaceRoom=stage==='mercy'&&
   (mercyLocation==='jenRoom'||mercyLocation==='jenRoomChest')&&
   !!player.flags?.rustyRoomOwned&&!player.flags?.port55Casino;
  const seaportRoom=stage==='r6Room'&&!!player.flags?.r6AnchorRoomOwned;
  if(solaceRoom||seaportRoom){
   // Uploaded filename is inn-room.png (hyphen), not inn_room.png.
   model.art='../devtest/assets/locations/inn-room.png?v=wo49-shared-inn';
   model.title=solaceRoom?'The Rusty Lantern — Your Room':'The Rusty Anchor — Your Room';
  }
  return model;
 };
})();
