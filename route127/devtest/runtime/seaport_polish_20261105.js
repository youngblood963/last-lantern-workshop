/* DEVTEST AUTHORITATIVE Seaport repairs, November 5. Loaded only by Devtest. */
(()=>{
'use strict';
if(!/\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname))return;
const graphics=()=>typeof GraphicalUI!=='undefined'&&GraphicalUI.active();
const market=()=>['port55Stop','port55Market','portMarket'].includes(stage)&&player.flags?.port55CurrentStop==='Market Area'||stage==='port55Market'||stage==='portMarket'&&player.flags?.port55CurrentStop==='Market Area';
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
 if(market()){m.location='seaport-market-area';m.title='Seaport — Market Area';m.art='/route127/devtest/assets/locations/seaport_market_area.png';}
 return m;
};
const oldChoices=GraphicalUI.choices;
GraphicalUI.choices=function(...a){
 let rows=oldChoices.apply(this,a);if(!this.active())return rows;
 const stop=stage==='port55Docks'||(stage==='port55Stop'&&['Docks','Market Area'].includes(player.flags?.port55CurrentStop));
 const seaportRoad=stage==='lanternNode'&&typeof lanternState==='function'&&lanternState()?.nodeId==='seaport';
 // Remove either numbered BACK or the B hotkey. Previous pass checked
 // only the command and required a specific return label; these menus
 // may publish BACK as a numbered choice instead.
 if(stop){
  const hasExit=rows.some(r=>/^(return to (?:seaport|harbor)|back)$/i.test(String(r.command||'')));
  if(hasExit){
   let keptExit=false;
   rows=rows.filter(r=>{
    const command=String(r.command||'').toLowerCase().trim();
    if(command==='back'||command==='b'){
     // If no explicit RETURN exists, relabel this one valid exit.
     if(!rows.some(x=>/^return to (seaport|harbor)$/i.test(String(x.command||'')))&&!keptExit){keptExit=true;return true;}
     return false;
    }
    return true;
   }).map(r=>(['back','b'].includes(String(r.command).toLowerCase())?{...r,label:'RETURN TO SEAPORT'}:r));
  }
 }
 if(seaportRoad&&rows.some(r=>/^(take road to|south|reverse)/i.test(String(r.command||''))))
  rows=rows.filter(r=>!['back','b'].includes(String(r.command||'').toLowerCase().trim()));
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
 box.append(button('✕ CLOSE',close));
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
   close();stage='seaport';port55Menu();return true;
  }
 }
 return beforePet.apply(this,arguments);
};

// Presentation only: generated named equipment uses a qualified save key
// (for example Highway Reaper (L06 RARE)). Show just the display name in
// graphical menus, and color its actual rarity without changing any item IDs.
if(typeof RouteIdentity!=='undefined'){
 const nativePaint=RouteIdentity.paint;
 const nativeRanges=RouteIdentity.ranges;
 const namedGear=typeof EQUIPMENT_CATALOG!=='undefined'?EQUIPMENT_CATALOG.filter(g=>g.name&&g.rarity):[];
 // The catalog is the authoritative source of item rarity. A qualified
 // save key such as Highway Reaper (L06 RARE) is not a player-facing label.
 RouteIdentity.ranges=function(value){
  const str=String(value),ranges=nativeRanges.call(this,str);
  const upper=str.toUpperCase();
  for(const gear of namedGear){
   const needle=gear.name.toUpperCase();let start=0,at;
   while((at=upper.indexOf(needle,start))>=0){
    const before=upper[at-1]||' ',after=upper[at+needle.length]||' ';
    if(!/[A-Z0-9]/.test(before)&&!/[A-Z0-9]/.test(after))
     ranges.push({start:at,end:at+needle.length,kind:gear.rarity});
    start=at+needle.length;
   }
  }
  // The first range wins in the original paint() implementation.
  return ranges.sort((a,b)=>a.start-b.start||(b.end-b.start)-(a.end-a.start));
 };
 RouteIdentity.paint=function(node,raw){
  if(!graphics())return nativePaint.call(this,node,raw);
  // Strip display-only level suffixes; internal item names and transactions
  // remain untouched. Catalog-based rarity styling still works after cleanup.
  const readable=String(raw??'').replace(/\s*\(L\d{1,2}\s+(?:COMMON|UNCOMMON|RARE|EPIC|LEGENDARY)\)/gi,'');
  return nativePaint.call(this,node,readable);
 };
}
// Clearing the previous sublocation's graphical transcript avoids yesterday's
// General Store and fish-market text persisting after leaving the area.
const oldStopMenu=port55StopMenu;
port55StopMenu=function(...a){
 if(graphics()&&screen&&stage==='port55Stop'&&!guest())screen.replaceChildren();
 return oldStopMenu.apply(this,a);
};
const oldHarborMenu=port55Menu;
port55Menu=function(...a){
 if(graphics()&&screen&&stage==='seaport')screen.replaceChildren();
 return oldHarborMenu.apply(this,a);
};
const oldRoadNode=lanternNodeMenu;
lanternNodeMenu=function(...a){
 if(graphics()&&screen&&typeof lanternState==='function'&&lanternState()?.nodeId==='seaport')screen.replaceChildren();
 return oldRoadNode.apply(this,a);
};

// Restore the approved neutral color for the Town Streets location plate;
// a colored wanderer name must never recolor the location heading.
const oldSync=GraphicalUI.sync;
GraphicalUI.sync=function(...a){
 const result=oldSync.apply(this,a);
 const caption=this.element?.caption;
 if(caption){
  if(stage==='port55Stop'&&player.flags?.port55CurrentStop==='Town Streets'){
   caption.textContent='Seaport — Town Streets';
   caption.style.setProperty('color','#eed8b8','important');
  }else caption.style.removeProperty('color');
 }
 return result;
};

// WO30.3: A Market Area location is a real Seaport art context rather
// than a painted harbor fallback. Use a root-relative asset URL so that
// Devtest/Playtest script-base differences cannot change the resolved path.
if(typeof ROUTE127_ART==='object'){
 ROUTE127_ART['seaport-market-area']={
  file:'/route127/devtest/assets/locations/seaport_market_area.png',
  title:'Seaport — Market Area'
 };
}
// Restore the canonical Market Area state from legacy saves before drawing.
// This is presentation-only; don't touch player, turns, quests or save keys.
const previousContext=GraphicalUI.context;
GraphicalUI.context=function(...args){
 if(market())return 'seaport-market-area';
 return previousContext.apply(this,args);
};
// WO30.3: the visitor's availability must match the displayed menu.
// The density roll may choose a wanderer not yet assigned to seaport, and
// a previous menu render can clear the interact option. Resolve the same
// chosen name once, assign its canonical town location, and publish the
// interact action LAST so its numbered button is never silently removed.
const previousStopWithGuest=port55StopMenu;
port55StopMenu=function(...a){
 if(!(stage==='port55Stop'&&player.flags?.port55CurrentStop==='Town Streets'&&player.flags?.seaport55?.freed))
  return previousStopWithGuest.apply(this,a);
 const chosen=globalThis.Route127WandererDensity?.seaportName();
 const eligible=w=>w&&wandererAlive(w)&&!portIsHired(w.name);
 const named=chosen&&wandererByName(chosen);
 const here=named&&eligible(named)?named:null;
 if(here&&wandererLocations[here.name]!=='seaport')
  wandererLocations[here.name]='seaport';
 // Fallback supports old saves that already assigned the town visitor,
 // but does not fabricate a new one after a failed density roll.
 const person=here||(!globalThis.Route127WandererDensity?
   wanderers.find(w=>eligible(w)&&wandererLocations[w.name]==='seaport'):null);
 const patrol=typeof port55PatrolName==='function'&&port55PatrolName()==='Town Streets';
 if(graphics()&&screen)screen.replaceChildren();
 if(person){
  const display=RouteIdentity?.wanderer?.[person.name]||person.name;
  add(display+' is visiting the Town Streets.','bright');
 }
 const options=[
  ...(person?['TALK TO WANDERER — '+person.name.toUpperCase()]:[]),
  ...(patrol?['TALK KAIDEN']:[]),
  'RETURN TO HARBOR'
 ];
 port55Submenu('Town Streets',options);
};

// The patrol includes Docks, but the dedicated Harbor Docks menu did
// not include Kaiden at all. Route through the existing Kaiden dialogue,
// preserving its current patrol-location validation.
const priorPortDocks=port55Command;
function docksMenu(){
 if(typeof port55PatrolTick==='function')port55PatrolTick();
 const present=player.flags?.seaport55?.freed&&port55PatrolName()==='Docks';
 port55Submenu('Harbor Docks',[
  ...(!player.flags?.seaport55?.freed?['FREE RESIDENTS']:[]),
  ...(present?['TALK KAIDEN']:[]),
  'RETURN TO HARBOR'
 ]);
}
port55Command=function(value){
 const cmd=String(value||'').trim().toLowerCase();
 if(stage==='port55Docks'&&cmd==='talk kaiden'){
  if(port55PatrolName()==='Docks'){
   player.flags.port55CurrentStop='Docks';
   stage='port55Kaiden';
   port55Submenu('Kaiden — Harbor Docks',['SMALL TALK','RETURN TO HARBOR']);
  }else docksMenu();
  return true;
 }
 const before=stage;
 const result=priorPortDocks.apply(this,arguments);
 if(stage==='port55Docks'&&before!==stage)docksMenu();
 if(before==='seaport'&&stage==='port55Docks')docksMenu();
 return result;
};
const priorDocksResume=port55Resume;
port55Resume=function(...a){
 if(stage==='port55Docks')return docksMenu();
 return priorDocksResume.apply(this,a);
};

// DEVTEST diagnostics and robust graphical fallback for Seaport Market Area.
// Old saves can restore stage 'port55Market', while newer menus use port55Stop.
const nativeMarketModel=GraphicalUI.model;
GraphicalUI.model=function(...a){
 const model=nativeMarketModel.apply(this,a);
 if(market()){
  model.location='seaport-market-area';
  model.title='Seaport — Market Area';
  model.art='/route127/devtest/assets/locations/seaport_market_area.png';
 }
 return model;
};
// Ensure generated image URL remains absolute and is never reinterpreted
// relative to the shared Playtest engine script.
const marketSync=GraphicalUI.sync;
GraphicalUI.sync=function(...a){
 const result=marketSync.apply(this,a);
 if(market()&&this.element?.img){
  const target=location.origin+'/route127/devtest/assets/locations/seaport_market_area.png';
  if(this.element.img.src!==target){
   this.element.img.src=target;
   this.element.img.hidden=false;
   this.element.figure?.classList.remove('gfx-art-failed');
  }
 }
 return result;
};
// The graphical navigation can inherit BOTH a numbered BACK choice and a
// separate B hotkey. Ignore both whenever Market Area has Return to Seaport.
const marketChoices=GraphicalUI.choices;
GraphicalUI.choices=function(...a){
 const rows=marketChoices.apply(this,a);
 if(!this.active())return rows;
 if(market()||stage==='port55Docks'){
  const exists=rows.some(r=>/return to (harbor|seaport)/i.test(r.command+' '+r.label));
  if(exists)return rows.filter(r=>!(/^back$/i.test(String(r.command).trim())||/^b$/i.test(String(r.command).trim())));
 }
 return rows;
};
})();