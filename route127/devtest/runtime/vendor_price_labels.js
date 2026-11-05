/* DEVTEST: show actual Bolt cost on purchase/treatment buttons.
 * Presentation-only: command/key are deliberately unchanged. Prices are
 * resolved from the current live economy and stock, never hard-coded here.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
 const nativeChoices=GraphicalUI.choices;
 const norm=v=>String(v||'').trim().toLowerCase();
 const money=(command,amount)=>{
  if(!Number.isFinite(amount)||amount<0)return null;
  // Never append to commands that already display a price.
  if(/\b\d[\d,]*\s+bolts?\b/i.test(command))return null;
  return ' — '+Math.round(amount).toLocaleString('en-US')+' Bolts';
 };
 const treatCost=rating=>{
  const missing=Math.max(0,Number(player.maxHp||0)-Number(player.hp||0));
  const rate=Economy.medicalRate(rating);
  return Math.min(Math.ceil(missing/rate),Math.max(0,Number(player.bolts)||0));
 };
 const priceFor=(cmd)=>{
  if(stage==='mercy'){
   if(mercyLocation==='wayne'){
    if(cmd.startsWith('treat wounds'))return treatCost(1);
    if(cmd.startsWith('buy bandage'))return 8;
   }
   if(mercyLocation==='johnny'&&
      ['shop','johnnyStock','purchaseComplete'].includes(player.flags?.solaceMenu)){
    const goods={
     'buy energy bar':'Energy Bars','buy bandage':'Bandage',
     'buy battered flashlight':'Battered Flashlight','buy tent':'Tent'
    };
    if(goods[cmd])return johnnyPrice(goods[cmd]);
    if(cmd==='buy 16-slot backpack'&&typeof V48_BACKPACK_PRICE!=='undefined')
     return V48_BACKPACK_PRICE;
   }
   if(mercyLocation==='mara'&&cmd.startsWith('buy ')){
    const item=cmd.slice(4);
    const stock=regionalEquipmentStock('solace').slots
     .find(slot=>!slot.sold&&norm(slot.name)===item);
    if(stock)return regionalEquipmentPrice(stock.name,'solace');
   }
  }
  if(stage==='port55Service'){
   const ui=player.flags?.portStaffUI||{},role=ui.role;
   if(role==='clinic'&&ui.page==='main'){
    if(cmd==='treat wounds')return treatCost(portStaffRating('clinic'));
    if(cmd==='buy bandage')return portClinicBandagePrice();
   }
   if(role==='general store'){
    if(ui.page==='equipment'&&cmd.startsWith('buy ')){
     const stock=regionalEquipmentStock('seaport').slots
      .find(slot=>!slot.sold&&norm(slot.name)===cmd.slice(4));
     if(stock)return regionalEquipmentPrice(stock.name,'seaport');
    }
    if(ui.page==='buy'&&cmd.startsWith('buy ')){
     const item=Object.keys(portStoreStock()).find(name=>norm(name)===cmd.slice(4));
     if(item)return portStorePrice(item);
    }
   }
  }
  return null;
 };
 GraphicalUI.choices=function(...args){
  const rows=nativeChoices.apply(this,args);
  if(this.preference()!=='graphics')return rows;
  return rows.map(row=>{
   const command=String(row.command||'');
   const cost=priceFor(norm(command));
   const suffix=money(command,cost);
   if(!suffix)return row;
   // Only the label changes: the engine still receives exactly row.command.
   return {...row,label:String(row.label||command).replace(/\s*[—–-]\s*(?:2% max hp per bolt.*|\d+ bolts?\b.*)$/i,'')+suffix};
  });
 };
 globalThis.DevtestBoltLabels=Object.freeze({priceFor});
})();
