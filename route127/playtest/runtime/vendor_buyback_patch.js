/* DEVTEST: keep rare gear buyback separate from ordinary vendor stock. */
(()=>{'use strict';if(!location.pathname.includes('/route127/playtest/'))return;
const shops=new Set(['johnny','mara','jen','wayne']);
const ledger=()=>player.flags.devBuybacks||(player.flags.devBuybacks={});
const rarity=i=>GEAR[i.name]?.rarity||'common';
const base=v53SaleCommand;
v53SaleCommand=function(cmd){
 const q=player.flags.v53Sale,shop=mercyLocation;
 if(cmd!=='confirm sale'||q?.merchant||!shops.has(shop))return base.apply(this,arguments);
 const item=player.pack.find(i=>i.name===q.name&&i.type===q.type&&!!i.stolen===!!q.stolen);
 const oldQty=item?.qty||0,before=player.bolts,copy=item&&{...item};
 const result=base.apply(this,arguments);
 if(copy&&oldQty>0&&player.bolts>before&&['uncommon','rare','epic'].includes(rarity(copy))){
  const sold=Math.min(oldQty,Math.floor((player.bolts-before)/q.unit));
  if(sold>0){
   const stock=ledger()[shop]||(ledger()[shop]=[]);
   const match=stock.find(x=>x.name===copy.name&&x.type===copy.type&&!!x.stolen===!!copy.stolen);
   if(match)match.qty+=sold;
   else stock.push({...copy,qty:sold,buybackPrice:Math.max(1,q.unit*2)});
  }
 }
 return result;
};
function menu(){
 const shop=player.flags.devBuybackShop,stock=ledger()[shop]||[];
 add('VENDOR BUYBACK — '+shop.toUpperCase(),'place');
 if(!stock.length)add('No Uncommon, Rare, or Epic equipment available for buyback.','system');
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