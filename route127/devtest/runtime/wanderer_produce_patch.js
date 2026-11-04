/* DEVTEST — common produce in persistent wanderer inventories.
   Uses existing game food definitions; one-time seed per wanderer, no stock resurrection. */
(()=>{'use strict';if(!location.pathname.includes('/route127/devtest/'))return;
const fruit=['Fresh Apple','Fresh Pear','Fresh Berries'];
const vegetables=['Fresh Carrot','Fresh Potato','Fresh Tomato','Fresh Cabbage'];
const original=v52Inventory;
v52Inventory=function(w){
 const inv=original.apply(this,arguments);
 if(!inv||inv.devProduceSeeded)return inv;
 // Do not alter existing stocked items or replenish items that were purchased or stolen.
 inv.devProduceSeeded=true;
 if(Math.random()>=.55)return inv;
 const kind=Math.random()<.5?fruit:vegetables;
 const name=kind[Math.floor(Math.random()*kind.length)];
 if(!inv.items.some(i=>i.name===name)){
  inv.items.push({name,type:'consumable',qty:1+Math.floor(Math.random()*3),
    price:Math.max(3,Math.min(12,5+Math.floor((Number(w.level)||1)/10))),
    trade:true});
 }
 const profile=typeof v50Profile==='function'?v50Profile(w):null;
 if(profile)profile.stock=inv.items.filter(i=>i.trade);
 return inv;
};
})();