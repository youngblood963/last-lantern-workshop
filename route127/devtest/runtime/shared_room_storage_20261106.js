/* DEVTEST-only adapters for approved Seaport storage popup.
 * Each location keeps its own save array, ownership gate, and stack limit.
 * Old Classic BBS command workflows remain unchanged.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!globalThis.SeaportRoomChest||
    typeof handleInnRoom!=='function'||typeof showHouseStorage!=='function')return;
 const graphical=()=>typeof GraphicalUI!=='undefined'&&GraphicalUI.preference()==='graphics';
 const solace={
  valid:()=>stage==='mercy'&&mercyLocation==='jenRoom'&&player.flags?.rustyRoomOwned===true,
  get:()=>{if(!Array.isArray(player.rustyRoomChest))player.rustyRoomChest=[];return player.rustyRoomChest;},
  capacity:10,title:'RUSTY LANTERN CHEST',label:'Solace Rusty Lantern room chest'
 };
 const house={
  valid:()=>stage==='house'&&player.flags?.houseOwned===true,
  get:()=>{if(!Array.isArray(player.houseStorage))player.houseStorage=[];return player.houseStorage;},
  capacity:6,title:'WOODEN STORAGE BOX',label:'Abandoned House wooden storage box'
 };
 const nativeInn=handleInnRoom;
 handleInnRoom=function(cmd){
  const action=String(cmd||'').trim().toLowerCase();
  if(graphical()&&solace.valid()&&['chest','2'].includes(action)&&
     !document.querySelector('dialog[open]')){
   if(SeaportRoomChest.openFor(solace))return;
  }
  return nativeInn.apply(this,arguments);
 };
 const nativeHouse=showHouseStorage;
 showHouseStorage=function(mode){
  // Called when the owner selects OPEN STORAGE BOX from the house.
  // Do not enter legacy houseStorage stages in graphical mode.
  if(graphical()&&house.valid()&&(!mode||mode==='houseStorage')&&
     !document.querySelector('dialog[open]')){
   if(SeaportRoomChest.openFor(house))return;
  }
  return nativeHouse.apply(this,arguments);
 };
})();
