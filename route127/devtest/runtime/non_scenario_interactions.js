/* DEVTEST shared non-scenario command/navigation repairs. Native transactions remain authoritative. */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
 // Older trader failures returned without re-publishing their stock menu. Keep the
 // native eligibility, item transfer, stock, price and theft handling unchanged.
 const trade=v50TradeCommand;
 v50TradeCommand=function(cmd,...args){
  const name=player.flags.v50Trade,w=name&&wandererByName(name);
  const item=w&&/^buy /i.test(cmd)?v50Profile(w).stock.find(i=>i.name.toLowerCase()===cmd.slice(4).toLowerCase()):null;
  const wallet=player.bolts,quantity=item?.qty;
  const result=trade.call(this,cmd,...args);
  if(w&&/^buy /i.test(cmd)&&player.flags.v50Trade===name&&(!item||v50Profile(w).stock.find(i=>i.name===item.name)?.qty===quantity)){
   if(item&&wallet<item.price)add(`Required: ${item.price} Bolts. Available: ${wallet} Bolts.`,'system');
   v50Trade(w);
  }
  return result;
 };

 // The DEVTEST canonical water compatibility helper was present in its source copy,
 // but the legacy base URL still loaded the old material-only counter. Bind only
 // these two helpers, preserving the approved names/types and all recipe costs.
 const matchesMaterial=(item,name)=>name==='Clean Water'?
  item.name===name&&item.type==='consumable'||item.name==='Water'&&item.type==='material':
  item.name===name&&item.type==='material';
 r6MaterialCount=function(name){return player.pack.filter(i=>matchesMaterial(i,name)&&i.name!==player.weapon&&i.name!==player.armor).reduce((sum,i)=>sum+i.qty,0);};
 r6ConsumeMaterial=function(name,qty){
  const have=r6MaterialCount(name);EncounterInteraction.requirement(name,qty,have);if(have<qty)return false;
  for(const item of [...player.pack]){if(!matchesMaterial(item,name))continue;const used=Math.min(qty,item.qty);item.qty-=used;qty-=used;if(!item.qty)player.pack.splice(player.pack.indexOf(item),1);if(!qty)break;}
  return true;
 };
 const purchase=EquipmentMods.purchase;
 EquipmentMods.purchase=function(key,cost,material,...args){
  const known=EquipmentMods.learned(key),have=material?r6MaterialCount(material):player.bolts;
  const result=purchase.call(this,key,cost,material,...args);
  if(!known&&have<cost)add(`Required: ${cost} ${material||'Bolts'}. Available: ${have} ${material||'Bolts'}.`,'system');
  return result;
 };
 const service=portStaffServiceCommand;
 portStaffServiceCommand=function(cmd,...args){
  const ui=player.flags.portStaffUI,role=ui?.role,wallet=player.bolts;
  let cost;
  if(PORT_STAFF_ROLES[role]&&portStaffRating(role)>0&&/^buy /i.test(cmd)){
   if(role==='clinic'&&cmd==='buy bandage')cost=portClinicBandagePrice();
   if(role==='general store'&&ui.page==='buy'){
    const name=Object.keys(portStoreStock()).find(n=>n.toLowerCase()===cmd.slice(4));
    if(name&&portStoreStock()[name]>0)cost=portStorePrice(name);
   }
  }
  const result=service.call(this,cmd,...args);
  if(Number.isFinite(cost)&&wallet<cost)add(`Required: ${cost} Bolts. Available: ${wallet} Bolts.`,'system');
  return result;
 };
 // Shared overlay constructors already provide an accessible dismiss action.
 // Keep Cancel in entry forms and the labelled header close in traveler panels.
 const entryOpen=FocusedEntry.open;
 FocusedEntry.open=function(...args){
  const request=args[0];
  if(request?.numeric&&Number.isSafeInteger(request.max)&&request.max<(request.min||1)){
   this.dismissed=request.key;
   this.working=true;
   this.pendingCancellation=Promise.resolve().then(async()=>{
    this.manual=null;
    if(typeof request.cancel==='function')request.cancel();
    else if(request.cancel)await handleCommand(request.cancel);
    add(`No amount is available for ${request.title.toLowerCase()}. Required minimum: ${request.min||1}; available: ${request.max}.`,'system');
   }).finally(()=>{this.working=false;this.schedule();});
   return this.pendingCancellation;
  }
  const result=entryOpen.apply(this,args);
  if(this.dialog&&this.closeButton?.parentNode)this.closeButton.remove();
  return result;
 };
 const panelOptions=TravelerPanels.options;
 TravelerPanels.options=function(...args){
  const result=panelOptions.apply(this,args);
  if(['options','menu'].includes(this.which)){
   for(const button of this.body.querySelectorAll('button'))if(button.textContent==='Close')button.remove();
  }
  return result;
 };
})();
