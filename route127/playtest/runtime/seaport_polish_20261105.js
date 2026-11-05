/* Route 127 Seaport repairs, November 5: reuse established mechanics. */
(()=>{
'use strict';
if(!/\/route127\/(playtest|devtest)\//.test(location.pathname))return;
const graphics=()=>typeof GraphicalUI!=='undefined'&&GraphicalUI.active();
const market=()=>stage==='port55Stop'&&player.flags?.port55CurrentStop==='Market Area';
const guest=()=>stage==='port55Guest'&&!!player.flags?.port55VisitingName;
const person=()=>guest()?wandererByName(player.flags.port55VisitingName):null;
function exitGuest(){
 delete player.flags.port55VisitingName;delete player.flags.v50Trade;delete player.flags.v53Sale;delete player.flags.v50Sale;
 townWandererFocus=null;currentTownWanderer=null;pendingTownFight=null;
 stage='port55Stop';player.flags.port55CurrentStop='Town Streets';port55StopMenu();
}
function guestMenu(){
 const w=person();if(!w||!wandererAlive(w)||portIsHired(w.name))return exitGuest();
 currentTownWanderer=w.name;townWandererFocus=w.name;
 if(pendingTownFight===w.name){v53Choices(['CONFIRM FIGHT','BACK OFF']);return;}
 if(player.flags.v50Trade===w.name){v50Trade(w);return;}
 v53WandererMenu(w,false);
}
const previousPort=port55Command;
port55Command=function(value){
 const cmd=String(value||'').trim().toLowerCase(),before=stage;
 if(guest()){
  const w=person();if(!w||!wandererAlive(w)||portIsHired(w.name)){exitGuest();return true;}
  if(['leave','back to town streets','exit','back','b'].includes(cmd)){
   if(player.flags.v50Trade){delete player.flags.v50Trade;delete player.flags.v50Sale;guestMenu();return true;}
   exitGuest();return true;
  }
  if(player.flags.v50Trade===w.name){
   const old=stage;stage='mercy';
   try{if(player.flags.v53Sale&&v53SaleCommand(cmd))return true;if(v50TradeCommand(cmd))return true;}
   finally{if(stage==='mercy')stage=old;}
   guestMenu();return true;
  }
  if(cmd==='back off'){pendingTownFight=null;guestMenu();return true;}
  if(cmd==='confirm fight'&&pendingTownFight===w.name){
   player.flags.seaportGuestCombat=true;
   const old=stage;stage='mercy';
   try{handleTownWanderer('confirm fight');}finally{if(stage==='mercy')stage=old;}
   if(stage!=='combat')guestMenu();return true;
  }
  if(cmd.startsWith('talk')||cmd.startsWith('small talk')){
   add(wandererDialogue(w),'bright');guestMenu();return true;
  }
  if(cmd.startsWith('browse wares')||cmd.startsWith('trade')){
   if(v50Profile(w).hostile){add('This wanderer refuses to trade.','system');guestMenu();return true;}
   v50Trade(w);return true;
  }
  if(cmd.startsWith('steal')){v52Pickpocket(w,true);guestMenu();return true;}
  if(cmd.startsWith('inspect')){v50Inspect(w);guestMenu();return true;}
  if(cmd.startsWith('fight')){
   const old=stage;stage='mercy';
   try{handleTownWanderer('fight '+w.name.toLowerCase());}finally{if(stage==='mercy')stage=old;}
   guestMenu();return true;
  }
  if(cmd.startsWith('recruit'))return previousPort.call(this,'recruit');
  guestMenu();return true;
 }
 const result=previousPort.apply(this,arguments);
 if(before==='port55Stop'&&guest()&&cmd.startsWith('talk to wanderer'))guestMenu();
 return result;
};
const oldResume=port55Resume;
port55Resume=function(...a){return guest()?guestMenu():oldResume.apply(this,a);};
const oldRender=renderCurrentChoices;
renderCurrentChoices=function(...a){return guest()?guestMenu():oldRender.apply(this,a);};
const oldTrade=v50TradeCommand;
v50TradeCommand=function(...a){
 if(!(guest()&&player.flags.v50Trade))return oldTrade.apply(this,a);
 const old=stage;stage='mercy';
 try{return oldTrade.apply(this,a);}finally{if(stage==='mercy')stage=old;}
};
const oldSale=v53SaleCommand;
v53SaleCommand=function(...a){
 if(!(guest()&&player.flags.v53Sale))return oldSale.apply(this,a);
 const old=stage;stage='mercy';
 try{return oldSale.apply(this,a);}finally{if(stage==='mercy')stage=old;}
};
const oldContext=showCurrentContext;
showCurrentContext=function(...a){
 if(player.flags?.seaportGuestCombat&&stage==='mercy'){
  delete player.flags.seaportGuestCombat;return exitGuest();
 }
 return oldContext.apply(this,a);
};
const oldCombat=handleCombat;
handleCombat=function(...a){
 const result=oldCombat.apply(this,a);
 if(player.flags?.seaportGuestCombat&&stage==='mercy'){
  delete player.flags.seaportGuestCombat;exitGuest();
 }
 return result;
};
const oldModel=GraphicalUI.model;
GraphicalUI.model=function(...a){
 const m=oldModel.apply(this,a);
 if(market()){m.location='seaport-market-area';m.title='Seaport — Market Area';m.art='../devtest/assets/locations/seaport_market_area.png';}
 return m;
};
const oldChoices=GraphicalUI.choices;
GraphicalUI.choices=function(...a){
 let rows=oldChoices.apply(this,a);if(!this.active())return rows;
 const stop=stage==='port55Docks'||stage==='port55Stop'&&['Docks','Market Area'].includes(player.flags?.port55CurrentStop);
 if(stop&&rows.some(r=>/^(return to seaport|return to harbor)$/i.test(r.command)))
  rows=rows.filter(r=>!['back','b'].includes(String(r.command).toLowerCase()));
 const g=typeof lanternState==='function'?lanternState():null;
 if(stage==='lanternNode'&&g?.nodeId==='seaport'&&rows.some(r=>/seaport/i.test(r.command)&&/reverse|south/i.test(r.command)))
  rows=rows.filter(r=>!['back','b'].includes(String(r.command).toLowerCase()));
 return rows;
};
// The graphical pet shop provides descriptions, then confirmation, while
// the native v55 purchase handler remains the only routine that spends money.
const oldVendor=port55Vendor;
port55Vendor=function(...a){
 if(!graphics())return oldVendor.apply(this,a);
 port55Submenu('Pet Vendor — Nessa',['PURCHASE PETS','RETURN TO SEAPORT']);
};
let overlay=null;
function close(){if(overlay)overlay.remove();overlay=null;if(GraphicalUI.schedule)GraphicalUI.schedule();}
function el(tag,txt){const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;return e;}
function button(label,fn,disabled=false){
 const b=el('button',label);b.type='button';b.disabled=disabled;
 b.style.cssText='font:inherit;cursor:pointer;border:1px solid #9d744c;background:#392619;color:#f0dfc3;padding:9px;margin:5px';
 b.addEventListener('click',fn);return b;
}
function openPets(){
 close();overlay=el('div');overlay.style.cssText='position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:#000d;padding:16px';
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
 const box=el('section');box.style.cssText='box-sizing:border-box;width:min(740px,100%);max-height:88vh;overflow:auto;background:#23170f;color:#f0e2cd;border:2px solid #8b6542;padding:22px';
 const title=el('h2',"NESSA'S PET SHOP — PURCHASE PETS");title.style.color='#efbd85';box.append(title);
 box.append(el('p',player.bolts+' BOLTS AVAILABLE'));
 for(const [name,p] of Object.entries(PORT55_PETS)){
  if(p.rescueOnly)continue;
  const row=el('div');row.style.cssText='border:1px solid #705038;padding:12px;margin:9px 0';
  const label=el('strong',name+' — '+p.rarity.toUpperCase()+' — '+p.price+' BOLTS');
  label.style.color=({common:'#f0e6dc',uncommon:'#70d288',rare:'#69abed',epic:'#c596fa',legendary:'#f9a74b'}[p.rarity]||'#fff');
  row.append(label,el('p',p.ability),button(port55Owned().includes(name)?'ALREADY OWNED':'SELECT PET',()=>confirmPet(name),port55Owned().includes(name)));
  box.append(row);
 }
 box.append(button('BACK TO PET SHOP',close));overlay.append(box);
 overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
 document.body.append(overlay);
}
const beforePet=port55Command;
function confirmPet(name){
 const p=PORT55_PETS[name],box=overlay?.querySelector('section');if(!p||!box)return;
 box.replaceChildren(el('h2','PURCHASE '+name.toUpperCase()+'?'),el('p',p.ability),el('p','PRICE '+p.price+' BOLTS — AVAILABLE '+player.bolts+' BOLTS'));
 box.append(button('CONFIRM PURCHASE',()=>{
  if(stage!=='port55Vendor'||port55Owned().includes(name)||player.bolts<p.price){openPets();return;}
  close();beforePet(name.toLowerCase());
 },port55Owned().includes(name)||player.bolts<p.price),button('CANCEL',openPets));
}
port55Command=function(cmd){
 const c=String(cmd||'').toLowerCase().trim();
 if(stage==='port55Vendor'&&graphics()){
  if(c==='purchase pets'){openPets();return true;}
  if(Object.keys(PORT55_PETS).some(n=>!PORT55_PETS[n].rescueOnly&&c.includes(n.toLowerCase()))){openPets();return true;}
  if(['return to seaport','return to harbor','back','b','exit'].includes(c)){
   close();stage='port55Stop';player.flags.port55CurrentStop='Market Area';port55StopMenu();return true;
  }
 }
 return beforePet.apply(this,arguments);
};
})();