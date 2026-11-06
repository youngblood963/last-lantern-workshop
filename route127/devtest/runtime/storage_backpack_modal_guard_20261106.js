/* DEVTEST: moving between the chest and Backpack must never stack modal
 * dialogs or leave the player on an unresponsive room screen.
 * Existing inventory commands, room state, and save data are untouched.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||
    typeof TravelerPanels==='undefined'||!globalThis.SeaportRoomChest)return;
 const oldOpen=TravelerPanels.open;
 TravelerPanels.open=function(...args){
  // The graphical sidebar remains clickable behind some chest overlays.
  // Close the chest first, then open Backpack/Character/Journal normally.
  if(SeaportRoomChest.isOpen())SeaportRoomChest.close();
  return oldOpen.apply(this,args);
 };
})();
