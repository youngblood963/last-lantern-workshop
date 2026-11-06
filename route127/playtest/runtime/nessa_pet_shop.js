/* Route 127 — DEVTEST Nessa's pet shop restoration.
 * Restores WO30's browse -> select -> confirm flow, with the approved
 * rusted metal traveler-panel border. All charges use the existing v55
 * purchase command; no prices, item ownership or save formats are changed.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name==='DEVTEST'||typeof GraphicalUI==='undefined')return;
 const graphical=()=>GraphicalUI.active()&&GraphicalUI.preference()==='graphics';
 const atShop=()=>stage==='port55Vendor';
 const available=()=>Object.entries(PORT55_PETS).filter(([,pet])=>!pet.rescueOnly);
 const owned=name=>port55Owned().includes(name);
 const colors={common:'#eee5d8',uncommon:'#8ed393',rare:'#78afff',epic:'#c7a1ea',legendary:'#eaa866'};
 const el=(tag,cls,txt)=>{
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(txt!==undefined)node.textContent=txt;
  return node;
 };
 const btn=(txt,handler,cls='',disabled=false)=>{
  const node=el('button','traveler-button r127-pet-button '+cls,txt);
  node.type='button';node.disabled=disabled;
  node.addEventListener('click',handler);
  return node;
 };
 let dialog=null,selected=null,processing=false,returnFocus=null;
 function close(){
  if(!dialog)return;
  const old=dialog;dialog=null;selected=null;
  if(old.open)old.close();
  old.remove();
  if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
  returnFocus=null;
 }
 function makeDialog(){
  if(dialog)return dialog;
  returnFocus=document.activeElement;
  const d=document.createElement('dialog');
  d.className='traveler-overlay r127-pet-dialog';
  d.setAttribute('aria-label',"Nessa's Pet Shop");
  d.addEventListener('cancel',event=>{event.preventDefault();close();});
  d.addEventListener('click',event=>{if(event.target===d)close();});
  d.addEventListener('close',()=>{if(dialog===d)close();});
  document.body.appendChild(d);dialog=d;
  d.showModal();return d;
 }
 function header(title,subtitle){
  const head=el('header','traveler-header r127-pet-header');
  const info=el('div','r127-pet-heading');
  info.append(el('div','traveler-eyebrow','SEAPORT · NESSA'),el('h1','',title));
  if(subtitle)info.append(el('p','r127-pet-subtitle',subtitle));
  head.append(info,el('strong','r127-pet-wallet',player.bolts+' BOLTS'));
  head.append(btn('✕',close,'traveler-close r127-pet-close'));
  return head;
 }
 function drawCatalog(){
  selected=null;
  if(!atShop()||!graphical()){close();return;}
  const d=makeDialog();
  d.replaceChildren(header('PET SHOP','These strays choose their people. Take a closer look before you decide.'));
  const grid=el('section','r127-pet-grid');
  for(const [name,pet] of available()){
   const card=el('article','r127-pet-card');
   const rarity=el('small','r127-pet-rarity',pet.rarity.toUpperCase());
   rarity.style.color=colors[pet.rarity]||colors.common;
   const h=el('h2','',name);h.style.color=colors[pet.rarity]||colors.common;
   card.append(rarity,h,el('p','r127-pet-ability',pet.ability));
   card.append(el('div','r127-pet-price',pet.price+' BOLTS'));
   const has=owned(name);
   card.append(btn(has?'ALREADY OWNED':'SELECT PET',()=>drawConfirm(name),'r127-pet-select',has));
   grid.append(card);
  }
  d.append(grid);
  const footer=el('footer','r127-pet-footer');
  footer.append(btn('BACK TO NESSA',close));
  d.append(footer);
 }
 function drawConfirm(name){
  const pet=PORT55_PETS[name];
  if(!pet||pet.rescueOnly||!atShop()||!graphical()){close();return;}
  selected=name;
  const d=makeDialog();
  d.replaceChildren(header('CONFIRM PURCHASE','Nessa will only charge you if you confirm.'));
  const panel=el('section','r127-pet-confirm');
  const h=el('h2','',name);h.style.color=colors[pet.rarity]||colors.common;
  panel.append(h,el('p','',pet.ability),el('p','r127-pet-price','PRICE: '+pet.price+' BOLTS'),el('p','','AVAILABLE: '+player.bolts+' BOLTS'));
  const insufficient=player.bolts<pet.price,has=owned(name);
  if(insufficient)panel.append(el('p','r127-pet-warning','Not enough Bolts.'));
  if(has)panel.append(el('p','r127-pet-warning','Already owned.'));
  const actions=el('div','r127-pet-actions');
  actions.append(btn('CONFIRM PURCHASE',()=>{
   if(processing||!atShop()||!graphical()||selected!==name||owned(name)||player.bolts<pet.price){drawCatalog();return;}
   processing=true;
   try{
    // Reach the underlying canonical purchase handler, retaining its
    // checks, bolts deduction, equipment ownership and autosave wrappers.
    const result=previousCommand.call(null,name.toLowerCase());
    close();
    if(graphical()&&atShop())port55Vendor();
    return result;
   }finally{processing=false;}
  },'r127-pet-buy',insufficient||has));
  actions.append(btn('CANCEL',drawCatalog));
  panel.append(actions);d.append(panel);
 }
 const previousVendor=port55Vendor;
 port55Vendor=function(...args){
  if(!graphical())return previousVendor.apply(this,args);
  // This remains the original vendor stage: quest dialogue stays available.
  const rescued=player.flags?.r18SilasOutcome==='released';
  const engine=typeof CorvetteRestoration!=='undefined'?CorvetteRestoration.state():null;
  const extras=rescued?[
   'ASK NESSA ABOUT SILAS','INSPECT NESSA LOCKET',
   ...(engine?.engineQuest&&!engine.engineDelivered&&!engine.locketTaken?['STEAL NESSAS LOCKET']:[])
  ]:[];
  port55Submenu('Pet Vendor — Nessa',['PURCHASE PETS',...extras,'BACK']);
  currentHotkeys.b='back';
 };
 const previousCommand=port55Command;
 port55Command=function(input){
  const cmd=String(input||'').trim().toLowerCase();
  if(atShop()&&graphical()){
   if(cmd==='purchase pets'){drawCatalog();return true;}
   const match=available().find(([name])=>cmd===name.toLowerCase()||
    cmd.startsWith(name.toLowerCase()+' —'));
   if(match){drawConfirm(match[0]);return true;}
   if(['back','b','exit','return','return to harbor','return to seaport'].includes(cmd))close();
  }
  return previousCommand.apply(this,arguments);
 };
 const oldSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  if(dialog&&(!graphical()||!atShop()))close();
  return oldSync.apply(this,args);
 };
 if(globalThis.Route127MenuAuthority){
  Route127MenuAuthority.register('nessa-pet-shop',{
   level:'devtest',
   supports:ctx=>ctx.stage==='port55Vendor'&&graphical(),
   choices:ctx=>ctx.base.map(row=>row.command)
  });
 }
 globalThis.DevtestNessaShop=Object.freeze({open:drawCatalog,close});
})();
