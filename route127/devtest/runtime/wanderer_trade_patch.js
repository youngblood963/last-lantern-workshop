/* DEVTEST wanderer trading: wealth, private cash balances, source-aware resale. */
(()=>{'use strict';if(!location.pathname.includes('/route127/devtest/'))return;
const wealth=level=>Math.min(25000,Math.round(120*Math.pow(1.11,Math.max(0,(Number(level)||1)-1))));
const oldInv=v52Inventory;
v52Inventory=function(w){
 const inv=oldInv(w),profile=v50Profile(w);
 if(!inv.devEconomyV1){
  inv.bolts=Math.max(inv.bolts,wealth(profile.level));
  inv.devEconomyV1=true;inv.devEconomyDay=Number(day)||1;
 }
 const now=Number(day)||1,elapsed=Math.max(0,now-(inv.devEconomyDay||now));
 if(elapsed){inv.bolts=Math.min(wealth(profile.level),inv.bolts+elapsed*Math.ceil(wealth(profile.level)*.08));inv.devEconomyDay=now;}
 return inv;
};
const oldMenu=v53SaleMenu;
v53SaleMenu=function(){
 const q=player.flags.v53Sale;if(!q)return oldMenu();
 add('SELL '+q.name+(q.stolen?' (STOLEN)':'')+' — '+q.available+' AVAILABLE — '+q.unit+' BOLTS EACH','system');
 if(q.mode==='custom'){add('Enter a quantity from 1 to '+q.available+'.','system');return;}
 if(q.mode==='confirm'){add('Sell '+q.qty+' for '+q.qty*q.unit+' Bolts?','system');v53Choices(['CONFIRM SALE','CANCEL SALE']);return;}
 v53Choices(['SELL 1',...(q.available>=5?['SELL 5']:[]),'SELL ALL','CUSTOM AMOUNT','CANCEL SALE']);
};
const oldConfirm=v53SaleCommand;
v53SaleCommand=function(cmd){
 const q=player.flags.v53Sale;
 if(cmd==='confirm sale'&&q?.merchant){
  const w=wandererByName(q.merchant);
  const i=player.pack.find(i=>i.name===q.name&&i.type===q.type&&!!i.stolen===!!q.stolen);
  if(i?.stolenFrom===q.merchant){
   add(w.name+' recognizes the item you stole from them and refuses to buy it.','danger');
   delete player.flags.v53Sale;delete player.flags.v50Sale;
   v50Trade(w);return true;
  }
  if(w&&v52Inventory(w).bolts<q.qty*q.unit){
   add(w.name+" doesn't have enough Bolts to purchase that item.",'system');
   delete player.flags.v53Sale;delete player.flags.v50Sale;
   v50Trade(w);return true;
  }
 }
 return oldConfirm.apply(this,arguments);
};
const oldPick=v52Pickpocket;
v52Pickpocket=function(w,inTown){
 const before=player.pack.map(i=>({item:i,qty:i.qty})),cash=player.bolts;
 const result=oldPick.apply(this,arguments);
 let gained=false;
 for(const i of player.pack){
  const old=before.find(x=>x.item===i);
  const diff=i.qty-(old?.qty||0);
  if(diff<=0||!i.stolen)continue;
  gained=true;
  if(old&&old.qty>0){
   i.qty-=diff;player.pack.push({...i,qty:diff,stolenFrom:w.name});
  }else i.stolenFrom=w.name;
 }
 if(player.bolts>cash)gained=true;
 if(gained){gainXp(5+2*v50Profile(w).level);add('PICKPOCKET SUCCESS — XP EARNED','reward');}
 return result;
};
globalThis.DevtestWandererTrade={wealth};
})();