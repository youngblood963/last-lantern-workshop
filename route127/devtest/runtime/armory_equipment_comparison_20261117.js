/* DEVTEST shop comparisons use the dispatched choice and live vendor stock. */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;

 const normalize=value=>String(value||'').trim().toLowerCase();
 const money=value=>value.toLocaleString('en-US')+' Bolts';
 let panel,selected,anchor,pinned=false,inspect=false,toggle,shop;

 function offer(command){
  const match=/^buy (.+)$/i.exec(normalize(command));
  if(!match)return null;
  const wanted=match[1];
  const ui=player.flags.portStaffUI;
  const region=stage==='mercy'&&mercyLocation==='mara'&&player.flags.solaceMenu==='equipment'?
   'solace':stage==='port55Service'&&ui?.page==='equipment'&&
   ['armory','general store'].includes(ui.role)?'seaport':null;
  let name,price;
  if(region){
   name=player.flags.regionalEquipment?.[region]?.slots.find(slot=>!slot.sold&&(normalize(slot.name)===wanted||normalize(GEAR[slot.name]?.name)===wanted))?.name;
   if(name)price=regionalEquipmentPrice(name,region);
  }else if(stage==='factoryRusty'&&player.flags.r5RustyUI==='buy'){
   name=Object.entries(player.flags.r5Rusty?.stock||{}).find(([item,qty])=>qty>0&&normalize(item)===wanted.split(' —')[0])?.[0];
   if(name)price=r5RustyPrice(name);
  }
  const gear=GEAR[name];
  return ['weapon','armor'].includes(gear?.type)?{name,gear,price}:null;
 }

 function stats(name,type){
  const gear=GEAR[name];
  if(type==='armor')return [['Defense',gear?.def||0],['Max HP bonus',gear?.maxHpBonus||0]];
  const [min,max]=Route127ShopWeaponRange(name);
  return [['Min damage',min],['Max damage',max],['Max HP bonus',gear?.maxHpBonus||0]];
 }
 function comparison(item){
  const type=item.gear.type,equipped=player[type];
  const forSale=stats(item.name,type),current=stats(equipped,type);
  return {equipped,forSale,current,differences:forSale.map(([label,value],i)=>{
   const delta=value-current[i][1];
   return [label,delta>0?'↑ Improved +'+delta:delta<0?'↓ Reduced '+delta:'= Unchanged',delta];
  })};
 }
 function details(name){
  const gear=GEAR[name];
  return gear?[gear.type,gear.rarity,gear.level?'Level '+gear.level:null].filter(Boolean).join(' · '):'';
 }
 function hide(){
  if(panel)panel.hidden=true;
  selected=null;anchor=null;pinned=false;
 }
 function place(){
  if(!anchor?.isConnected||panel?.hidden)return;
  const controls=GraphicalUI.element.choices.getBoundingClientRect();
  const rect=anchor.getBoundingClientRect();
  if(pinned)return;
  const above=Math.max(0,controls.top-12),below=Math.max(0,innerHeight-controls.bottom-12);
  const fitsAbove=above>=below;
  panel.style.maxHeight=Math.max(0,fitsAbove?above:below)+'px';
  panel.style.left=Math.max(8,Math.min(rect.left,innerWidth-panel.offsetWidth-8))+'px';
  panel.style.top=(fitsAbove?Math.max(8,controls.top-panel.offsetHeight-6):controls.bottom+6)+'px';
 }
 function show(item,button,keep){
  if(!panel){
   panel=GraphicalUI.node('aside','r127-armory-compare');
   panel.setAttribute('aria-label','Equipment comparison');
  }
  const {equipped,forSale,current,differences}=comparison(item);
  panel.replaceChildren();
  panel.classList.toggle('r127-compare-pinned',keep);
  const heading=GraphicalUI.node('strong','','Equipment comparison');
  panel.appendChild(heading);
  if(keep)panel.appendChild(GraphicalUI.button('Close comparison',()=>{hide();if(button.isConnected)button.focus();}));
  const columns=GraphicalUI.node('div','r127-compare-columns');
  for(const [label,name,rows] of [['For sale',item.name,forSale],['Equipped',equipped,current]]){
   const col=GraphicalUI.node('section','');
   col.appendChild(GraphicalUI.node('small','',label));
   col.appendChild(GraphicalUI.node('strong','',name||'None Equipped'));
   if(name)col.appendChild(GraphicalUI.node('small','',details(name)));
   for(const [stat,value] of rows)col.appendChild(GraphicalUI.node('span','',stat+' '+value));
   if(label==='For sale')col.appendChild(GraphicalUI.node('strong','',money(item.price)));
   columns.appendChild(col);
  }
  panel.appendChild(columns);
  for(const [label,delta,value] of differences){
   panel.appendChild(GraphicalUI.node('div',value>0?'better':value<0?'worse':'',label+' '+delta));
  }
  const choices=GraphicalUI.element.choices;
  choices.parentNode.insertBefore(panel,choices.nextSibling);
  selected=item.name;anchor=button;pinned=keep;panel.hidden=false;
  place();
  if(keep)panel.scrollIntoView?.({block:'nearest'});
 }

 function bind(button,choice){
  const item=offer(choice.command);
  if(!item)return;
  button.removeAttribute('title');
  let hover=false,focus=false;
  const preview=()=>{if(!pinned)show(item,button,false);};
  const dismiss=()=>{if(!pinned&&!hover&&!focus&&anchor===button)hide();};
  button.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch'){hover=true;preview();}});
  button.addEventListener('pointerleave',()=>{hover=false;dismiss();});
  button.addEventListener('focus',()=>{focus=true;preview();});
  button.addEventListener('blur',()=>{focus=false;dismiss();});
  button.addEventListener('click',event=>{
   if(!inspect)return;
   event.preventDefault();
   event.stopImmediatePropagation();
   show(item,button,true);
  },true);
  if(pinned&&selected===item.name)anchor=button;
 }
 const sync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=sync.apply(this,args);
  const choices=this.element?.choices;
  const inShop=this.active()&&choices&&this.choices().some(choice=>offer(choice.command));
  const context=inShop?[stage,mercyLocation,player.flags.portStaffUI?.role].join(':'):null;
  if(context!==shop){hide();inspect=false;shop=context;}
  if(selected&&!anchor?.isConnected)hide();
  if(!inShop){if(toggle)toggle.hidden=true;return result;}
  if(!toggle){
   toggle=this.button('',()=>{
    inspect=!inspect;
    hide();
    toggle.textContent=inspect?'Exit inspection mode':'Inspect equipment';
    toggle.setAttribute('aria-pressed',String(inspect));
   },'r127-shop-inspect');
  }
  toggle.textContent=inspect?'Exit inspection mode':'Inspect equipment';
  toggle.setAttribute('aria-pressed',String(inspect));
  toggle.hidden=false;
  if(toggle.parentNode!==choices.parentNode)choices.parentNode.insertBefore(toggle,choices);
  return result;
 };

 const command=handleCommand;
 handleCommand=async function(raw){
  const match=/^inspect\s+(.+)$/i.exec(String(raw).trim());
  if(GraphicalUI.preference()==='classic'&&match){
   const choice=r5Mapped(match[1]);
   const item=offer(/^buy /i.test(choice)?choice:'buy '+choice);
   if(item){
    const {equipped,forSale,current,differences}=comparison(item);
    add(item.name+' ('+details(item.name)+') — '+money(item.price),'bright');
    add('EQUIPPED — '+(equipped||'None Equipped'),'bright');
    for(let i=0;i<forSale.length;i++)add(forSale[i][0]+': '+forSale[i][1]+' vs '+current[i][1]+' · '+differences[i][1]);
    return;
   }
  }
  return command.apply(this,arguments);
 };
 globalThis.Route127ShopComparison=Object.freeze({bind,offer,comparison});
 window.addEventListener('resize',place,{passive:true});
 window.addEventListener('scroll',place,{passive:true,capture:true});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')hide();});

 const css=document.createElement('style');
 css.textContent=`
 .r127-shop-inspect{display:none;background:#392b1e;border:1px solid #99744a;border-radius:4px;color:#efd4a4;padding:8px;min-height:44px}
 @media(any-pointer:coarse){.r127-shop-inspect:not([hidden]){display:block}}
 .r127-armory-compare{position:fixed;z-index:1000;width:min(430px,calc(100vw - 16px));box-sizing:border-box;overflow:auto;padding:12px;border:1px solid #c39a5e;border-radius:6px;background:#191510;color:#f2e7ce;font:14px/1.4 system-ui,sans-serif;pointer-events:none}
 .r127-armory-compare[hidden]{display:none}
 .r127-armory-compare.r127-compare-pinned{position:static;max-height:none!important;pointer-events:auto}
 .r127-compare-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:8px 0}
 .r127-compare-columns section{display:grid;gap:3px;background:#2b2119;padding:8px;overflow-wrap:anywhere}
 .r127-compare-columns small{color:#e6c485}
 .r127-armory-compare .better{color:#87d99a}.r127-armory-compare .worse{color:#ff9f8a}
 `;
 document.head.appendChild(css);
 GraphicalUI.schedule();
})();
