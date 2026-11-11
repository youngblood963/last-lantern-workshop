/* WO45 nightfall: observe existing successful clock advances only. */
(() => {
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||!globalThis.Route127Notifications)return;
 const hour=()=>Number(player.flags.worldHour??8);
 const night=h=>h>=20||h<5;
 const crosses=(before,elapsed)=>Number.isFinite(elapsed)&&elapsed>0&&Math.floor((before+elapsed-20)/24)>Math.floor((before-20)/24);
 let depth=0,pending=false,epoch=0,spentSerial=0;
 function show(){pending=false;Route127Notifications.showNightfall();GraphicalUI.sync();}
 function advance(before,elapsed){if(crosses(before,elapsed)&&night(hour())){if(depth)pending=true;else show();}}
 const oldSpend=spendTurns;
 spendTurns=function(count=1){const before=hour(),result=oldSpend.apply(this,arguments);
  if(result&&count>0){spentSerial++;advance(before,Number(count));}return result;
 };
 // Load and reset establish a baseline; neither represents elapsed game time.
 const oldLoad=loadGame;
 loadGame=function(...args){epoch++;pending=false;Route127Notifications.clearNightfall();return oldLoad.apply(this,args);};
 const oldReset=resetPlayer;
 resetPlayer=function(...args){epoch++;pending=false;Route127Notifications.clearNightfall();return oldReset.apply(this,args);};
 const oldCommand=handleCommand;
 handleCommand=async function(...args){const before=hour(),startEpoch=epoch,startSerial=spentSerial;depth++;
  try{return await oldCommand.apply(this,args);}
  finally{
   // Horse/Astrid travel writes the same clock directly rather than spendTurns.
   // These normal command transitions are observed without changing travel costs.
   if(epoch===startEpoch&&spentSerial===startSerial){const elapsed=((hour()-before)%24+24)%24;advance(before,elapsed);}
   depth--;
   if(!depth&&pending&&epoch===startEpoch)show();
  }
 };
 globalThis.Route127Nightfall=Object.freeze({crosses});
})();
