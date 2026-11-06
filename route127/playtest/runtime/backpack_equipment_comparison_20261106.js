/* Route 127 DEVTEST — quick equipment stats directly on Backpack list rows.
 * Pure visual enhancement. No edits to inventory, equip, combat or save logic.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name==='DEVTEST'||typeof TravelerPanels==='undefined'||typeof GEAR==='undefined')return;
 const oldInventory=TravelerPanels.inventory;
 const css=document.createElement('style');css.dataset.r127BagCompare='v1';
 css.textContent=`
 .traveler-item .r127-bag-gear-meta{display:block;margin-top:3px;font-size:12px;
  font-family:Georgia,serif;color:#e8c998;font-weight:700;line-height:1.35}
 .traveler-item .r127-bag-equipped{color:#79d89b;font-weight:800}
 .traveler-item .r127-bag-better{color:#76dca0}
 .traveler-item .r127-bag-worse{color:#d89c8a}
 .traveler-item .r127-bag-same{color:#c7b99d}
 @media(max-width:540px){.traveler-item .r127-bag-gear-meta{font-size:11px;line-height:1.35}}
 `;
 document.head.append(css);
 const fmt=n=>Number.isInteger(n)?String(n):String(Math.round(n*10)/10);
 const compare=(g,b)=>{
  if(!b)return {text:'',cls:''};
  if(g.type==='weapon'&&Number.isFinite(g.min)&&Number.isFinite(g.max)&&
     Number.isFinite(b.min)&&Number.isFinite(b.max)){
   const diff=(g.min+g.max)-(b.min+b.max);
   const sign=diff>0?'+':'';
   return {text:' · '+sign+fmt(diff/2)+' avg vs equipped',
           cls:diff>0?'r127-bag-better':diff<0?'r127-bag-worse':'r127-bag-same'};
  }
  if(g.type==='armor'&&Number.isFinite(g.def)&&Number.isFinite(b.def)){
   const diff=g.def-b.def;
   return {text:' · '+(diff>0?'+':'')+fmt(diff)+' DEF vs equipped',
           cls:diff>0?'r127-bag-better':diff<0?'r127-bag-worse':'r127-bag-same'};
  }
  return {text:'',cls:''};
 };
 const stats=g=>{
  if(!g)return '';
  const atk=Number.isFinite(g.min)&&Number.isFinite(g.max)?'ATK '+g.min+'–'+g.max:'';
  const def=Number.isFinite(g.def)?'DEF '+g.def:'';
  return [atk,def].filter(Boolean).join(' · ');
 };
 TravelerPanels.inventory=function(...args){
  const result=oldInventory.apply(this,args);
  if(this.which!=='inventory'||!this.dialog)return result;
  const list=this.body?.querySelector('.traveler-list');
  if(!list)return result;
  // Match visible rows to the exact underlying stack in the same order.
  // Avoid relying on translated button labels or rarity text.
  const items=this.items(),rows=[...list.querySelectorAll('button.traveler-item')];
  rows.forEach((button,i)=>{
   const stack=items[i],g=stack&&GEAR[stack.name];
   if(!stack)return;
   const healing=typeof HEALING_ITEM_RATES!=='undefined'?HEALING_ITEM_RATES[stack.name]:undefined;
   const equipment=!!g&&['weapon','armor','accessory'].includes(g.type);
   if(!equipment&&!Number.isFinite(healing))return;
   const label=button.querySelector('.traveler-item-label');
   if(!label)return;
   const meta=document.createElement('span');meta.className='r127-bag-gear-meta';
   if(Number.isFinite(healing)){
    const potential=Math.max(1,Math.ceil(player.maxHp*healing));
    meta.textContent='HEALS '+Math.round(healing*100)+'% MAX HP · UP TO '+potential+' HP';
    label.append(meta);return;
   }
   const equipName=player[g.type];
   const equipped=stack.name===equipName;
   const base=stats(g);
   if(equipped){meta.textContent=base+' · EQUIPPED';meta.classList.add('r127-bag-equipped');}
   else{
    const c=compare(g,GEAR[equipName]);
    meta.textContent=base+c.text;
    if(c.cls)meta.classList.add(c.cls);
   }
   label.append(meta);
  });
  return result;
 };
})();
