/* DEVTEST: keep vendor buyback separate from ordinary vendor stock. */
(()=>{'use strict';if(!location.pathname.includes('/route127/devtest/'))return;
// Only player-resold equipment is filtered. Generated regional/wanderer goods stay intact.
const commonEquipment=item=>{const g=GEAR[typeof item==='string'?item:item?.name];return !!g&&['weapon','armor','accessory'].includes(g.type)&&g.rarity==='common';};
function cleanRusty(s){
 if(!s?.stock)return s;
 // Rusty's generated gear is one deterministic arm plus an optional Uncommon.
 // Keep that arm's original allowance if a future catalog marks it Common.
 const arms=['Claw Hammer','Tire Iron','Reinforced Jacket'].filter(n=>GEAR[n]);
 const native=arms[Math.abs(Math.floor((Number(s.period)||0)/86400000))%arms.length];
 for(const name of Object.keys(s.stock))if(commonEquipment(name)){
  if(name===native)s.stock[name]=Math.min(1,Math.max(0,Number(s.stock[name])||0));else delete s.stock[name];
 }
 return s;
}
function cleanWanderer(inv){if(inv?.items)inv.items=inv.items.filter(i=>i.trade!==false||!commonEquipment(i));return inv;}
function migrate(){
 cleanRusty(player.flags.r5Rusty);
 for(const state of Object.values(player.wandererState||{}))if(state.profile?.v52Inventory)cleanWanderer(state.profile.v52Inventory);
 loadBuybackStock();
}
globalThis.Route127VendorBuyback=Object.freeze({allow:item=>!commonEquipment(item),commonEquipment,cleanRusty,cleanWanderer,migrate});
// Native Rusty transactions write through this stock object. Reject only an
// increase from sold Common equipment; ordinary purchases can decrement stock.
const guardedStocks=new WeakSet(),rustyStock=r5RustyStock;
r5RustyStock=function(...args){
 const s=cleanRusty(rustyStock.apply(this,args));
 if(!guardedStocks.has(s.stock)){
  s.stock=new Proxy(s.stock,{set(stock,name,value){
   if(commonEquipment(name)&&Number(value)>Number(stock[name]||0))return true;
   stock[name]=value;return true;
  }});guardedStocks.add(s.stock);
 }
 return s;
};
const inventory=v52Inventory;
v52Inventory=function(...args){return cleanWanderer(inventory.apply(this,args));};
const shops=new Set(['johnny','mara','jen','wayne']);
const rarity=item=>GEAR[item.name]?.rarity||'common';
function loadBuybackStock(){
 const stock=player.flags.devBuybacks;
 if(stock){
  for(const [shop,items] of Object.entries(stock)){
   stock[shop]=items.filter(item=>rarity(item)!=='common');
  }
 }
 return stock;
}
const ledger=()=>loadBuybackStock()||(player.flags.devBuybacks={});
const baseLoad=loadGame;
loadGame=function(...args){
 const result=baseLoad.apply(this,args);
 migrate();
 return result;
};
const base=v53SaleCommand;
v53SaleCommand=function(cmd){
 const q=player.flags.v53Sale,shop=mercyLocation;
 if(cmd!=='confirm sale'||!q||q.merchant||!shops.has(shop))return base.apply(this,arguments);
 const item=player.pack.find(i=>i.name===q.name&&i.type===q.type&&!!i.stolen===!!q.stolen);
 const oldQty=item?.qty||0,before=player.bolts,copy=item&&{...item};
 const result=base.apply(this,arguments);
 if(copy&&oldQty>0&&player.bolts>before&&rarity(copy)!=='common'){
  const sold=Math.min(oldQty,Math.floor((player.bolts-before)/q.unit));
  if(sold>0){
   const stock=ledger()[shop]||(ledger()[shop]=[]);
   const match=stock.find(x=>x.name===copy.name&&x.type===copy.type&&!!x.stolen===!!copy.stolen);
   if(match)match.qty+=sold;
   else stock.push({...copy,qty:sold,buybackPrice:Math.max(1,q.unit*2)});
  }
 }
 if(copy&&player.bolts>before)v49Autosave();
 return result;
};
function menu(){
 const shop=player.flags.devBuybackShop,stock=ledger()[shop]||[];
 add('VENDOR BUYBACK — '+shop.toUpperCase(),'place');
 if(!stock.length)add('No items available for buyback.','system');
 for(const [n,i]of stock.entries())add((n+1)+'. '+i.name+' — '+i.buybackPrice+' BOLTS','system');
 v53Choices(stock.map((i,n)=>'BUYBACK '+(n+1)).concat('CLOSE BUYBACK'));
}
const oldChoices=v53Choices;
v53Choices=function(options,...args){
 if(stage==='mercy'&&shops.has(mercyLocation)&&!player.flags.devBuybackShop&&
   Array.isArray(options)&&options.some(s=>String(s).toLowerCase()==='sell items')&&
   !options.includes('BUYBACK'))options=[...options,'BUYBACK'];
 return oldChoices.call(this,options,...args);
};
const oldCore=handleCommandCore;
handleCommandCore=async function(raw){
 const cmd=String(r5Mapped(raw)||'').trim().toLowerCase();
 if(!busy&&stage==='mercy'&&shops.has(mercyLocation)&&cmd==='buyback'){
  player.flags.devBuybackShop=mercyLocation;return menu();
 }
 if(player.flags.devBuybackShop&&stage==='mercy'){
  if(cmd==='close buyback'||cmd==='back'){
   delete player.flags.devBuybackShop;return renderCurrentChoices();
  }
  const m=/^buyback (\d+)$/.exec(cmd),shop=player.flags.devBuybackShop;
  if(m){
   const stock=ledger()[shop]||[],i=stock[Number(m[1])-1];
   if(!i)return menu();
   if(player.bolts<i.buybackPrice){add('Not enough Bolts.','system');return menu();}
   if(!addPack(i.name,i.type,1,true,!!i.stolen)){add('Backpack full.','system');return menu();}
   player.bolts-=i.buybackPrice;i.qty--;
   if(!i.qty)stock.splice(stock.indexOf(i),1);
   updateHud();if(typeof v49Autosave==='function')v49Autosave();
   add('BOUGHT BACK — '+i.name,'reward');return menu();
  }
  return menu();
 }
 return oldCore.apply(this,arguments);
};
})();