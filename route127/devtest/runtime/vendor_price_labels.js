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
     'buy energy bar':'Energy Bars','buy clean water':'Clean Water','buy bandage':'Bandage',
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
    // The Seaport Armory equipment screen belongs to the General Store role.
    // Resolve the live regional price without changing the purchase command.
    if(ui.page==='equipment'&&cmd.startsWith('buy ')){
     const stock=regionalEquipmentStock('seaport').slots
      .find(slot=>!slot.sold&&norm(slot.name)===cmd.slice(4));
     if(stock)return regionalEquipmentPrice(stock.name,'seaport');
    }
    if(role==='general store'&&ui.page==='buy'&&cmd.startsWith('buy ')){
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
   // Rusty's gameplay stock already carries real prices, but the graphical
   // menu can shorten the command to an unpriced item label.
   if(stage==='factoryRusty'&&norm(command).startsWith('buy ')){
    const requested=norm(command).slice(4).split(' —')[0].trim();
    const stock=r5RustyStock().stock;
    const name=Object.keys(stock).find(item=>norm(item)===requested);
    if(name&&stock[name]>0){
     const price=r5RustyPrice(name);
     return {...row,label:'Buy '+name+' — '+price.toLocaleString('en-US')+
      ' Bolts ('+stock[name]+' left)'};
    }
   }
   const cost=priceFor(norm(command));
   const suffix=money(command,cost);
   if(!suffix)return row;
   // Only the label changes: the engine still receives exactly row.command.
   return {...row,label:String(row.label||command).replace(/\s*[—–-]\s*(?:2% max hp per bolt.*|\d+ bolts?\b.*)$/i,'')+suffix,presentationSource:String(row.label||command).replace(/\s*[—–-]\s*(?:2% max hp per bolt.*|\d+ bolts?\b.*)$/i,'')+suffix};
  });
 };
 // Rusty's graphical menu is authoritative; decorate the visible action
 // labels after the other menu adapters have projected the command keys.
 // Preserve every actual button command and click handler.
 const previousSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=previousSync.apply(this,args);
  const armory=stage==='port55Service'&&
   player.flags?.portStaffUI?.role==='general store'&&
   player.flags?.portStaffUI?.page==='equipment'&&this.active();
  this.element?.frame?.classList.toggle('r127-seaport-armory-equipment',!!armory);
  if(armory){
   // A late-rendering menu may have reused an old label. Display the actual
   // current price for each purchasable slot without modifying its command.
   const available=regionalEquipmentStock('seaport').slots.filter(slot=>!slot.sold);
   const buttons=this.element?.choices?.querySelectorAll('.gfx-choice')||[];
   for(const button of buttons){
    const label=button.querySelector('.gfx-choice-label');
    if(!label)continue;
    const raw=label.textContent.trim().replace(/^buy\\s+/i,'').replace(/\\s+[—–-]\\s+.*$/,'');
    const item=available.find(slot=>norm(slot.name)===norm(raw));
    if(!item)continue;
    const text='Buy '+item.name+' — '+regionalEquipmentPrice(item.name,'seaport').toLocaleString('en-US')+' Bolts';
    label.textContent=text;
    button.title=text;
    button.setAttribute('aria-label',text);
   }
  }
  if(stage!=='factoryRusty'||player.flags?.r5RustyUI!=='buy'||!this.active())return result;
  const stock=r5RustyStock().stock;
  for(const button of this.element?.choices?.querySelectorAll('.gfx-choice')||[]){
   const label=button.querySelector('.gfx-choice-label');
   if(!label)continue;
   const match=label.textContent.trim().match(/^buy\s+(.+?)(?:\s+[—–-]\s+.*)?$/i);
   if(!match)continue;
   const item=Object.keys(stock).find(name=>norm(name)===norm(match[1]));
   if(!item||stock[item]<1)continue;
   const proper='Buy '+item+' — '+r5RustyPrice(item).toLocaleString('en-US')+' Bolts';
   if(label.textContent!==proper)label.textContent=proper;
   button.title=proper+' ('+stock[item]+' left)';
  }
  return result;
 };
 // Only the graphical Seaport Armory stock page: the narrative transcript
 // repeats the same entire inventory as the action buttons and is unreadable.
 // Keep underlying BBS DOM and classic mode intact for gameplay/accessibility.
 const style=document.createElement('style');
 style.textContent=`
 body.full-graphics .gfx-frame.r127-seaport-armory-equipment .gfx-narrative{display:none!important}
 body.full-graphics .gfx-frame.r127-seaport-armory-equipment .gfx-choices{min-height:0}
 `;
 document.head.append(style);
 globalThis.DevtestBoltLabels=Object.freeze({priceFor});
})();
