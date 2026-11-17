/* Route 127 DEVTEST — Solace Armory equipment comparisons.
 * Presentation only: hovering/focusing a BUY option previews your equipped
 * item beside Mara's stock. Separate Compare button supports touchscreens.
 * No purchase, inventory, save, gear, stock or quest state is changed here.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
 let panel=null,anchor=null,pinned=false,selectedName='';
 const active=()=>stage==='mercy'&&mercyLocation==='mara'&&
  player.flags?.solaceMenu==='equipment'&&GraphicalUI.preference()==='graphics'&&
  !player.flags?.v53Sale&&player.flags?.v48Shop!=='sell';
 const def=name=>GEAR?.[name]||null;
 const value=(v,missing='—')=>Number.isFinite(Number(v))?String(Number(v)):missing;
 const fmt=(name,type)=>{
  const g=name?def(name):null;
  if(!g)return {name:name||'None equipped',rarity:'',stat:type==='weapon'?'DMG —':'DEF —',extra:''};
  const stat=type==='weapon'?'DMG '+value(g.min)+'–'+value(g.max):
   'DEF '+value(g.def, '0');
  const extras=[];
  if(Number(g.maxHpBonus))extras.push('MAX HP '+(g.maxHpBonus>0?'+':'')+g.maxHpBonus);
  if(g.description)extras.push(String(g.description));
  return {name,rarity:String(g.rarity||'common'),stat,extra:extras.join(' · ')};
 };
 const text=(tag,cls,str)=>{const el=document.createElement(tag);el.className=cls;el.textContent=str;return el;};
 function hide(force=false){
  if(pinned&&!force)return;
  if(panel)panel.hidden=true;
  anchor=null;selectedName='';pinned=false;
 }
 function ensure(){
  if(panel)return panel;
  panel=document.createElement('aside');
  panel.id='r127-armory-compare';
  panel.className='r127-armory-compare';
  panel.hidden=true;
  panel.setAttribute('role','region');
  panel.setAttribute('aria-label','Armory equipment comparison');
  document.body.appendChild(panel);
  return panel;
 }
 function place(){
  if(!panel||panel.hidden||!anchor?.isConnected)return;
  const rect=anchor.getBoundingClientRect();
  const width=Math.min(450,Math.max(250,window.innerWidth-16));
  panel.style.width=width+'px';
  const h=panel.getBoundingClientRect().height;
  // Prefer above the shop buttons; never extend outside the viewport.
  const top=rect.top>=h+12?rect.top-h-8:Math.min(window.innerHeight-h-8,rect.bottom+8);
  panel.style.top=Math.max(8,top)+'px';
  panel.style.left=Math.max(8,Math.min(window.innerWidth-width-8,rect.left))+'px';
 }
 function show(name,origin,stick=false){
  if(!active())return;
  const item=def(name);
  if(!item||!['weapon','armor'].includes(item.type))return;
  if(pinned&&!stick&&selectedName!==name)return;
  const type=item.type,equipped=type==='weapon'?player.weapon:player.armor;
  const mine=fmt(equipped,type),theirs=fmt(name,type);
  const own=def(equipped);
  const baseline=type==='weapon'?((Number(own?.min)||0)+(Number(own?.max)||0))/2:Number(own?.def)||0;
  const offered=type==='weapon'?((Number(item.min)||0)+(Number(item.max)||0))/2:Number(item.def)||0;
  const diff=Math.round((offered-baseline)*10)/10;
  const difference=diff===0?'SAME BASE STAT':(diff>0?'+':'')+diff+(type==='weapon'?' AVG DMG':' DEF');
  const box=ensure();box.replaceChildren();
  const header=text('div','r127-compare-header','EQUIPMENT COMPARISON');
  const dismiss=document.createElement('button');dismiss.type='button';dismiss.className='r127-compare-close';dismiss.textContent='×';dismiss.setAttribute('aria-label','Close comparison');dismiss.onclick=e=>{e.stopPropagation();hide(true);};
  header.appendChild(dismiss);box.appendChild(header);
  const columns=document.createElement('div');columns.className='r127-compare-columns';
  for(const [label,data] of [['EQUIPPED',mine],['FOR SALE',theirs]]){
   const col=document.createElement('section');col.className='r127-compare-column';
   col.appendChild(text('small','r127-compare-label',label));
   col.appendChild(text('strong','r127-compare-item',data.name));
   col.appendChild(text('span','r127-compare-stat',data.stat));
   if(data.rarity)col.appendChild(text('small','r127-compare-rarity rarity-'+data.rarity,data.rarity.toUpperCase()));
   if(data.extra)col.appendChild(text('small','r127-compare-extra',data.extra));
   columns.appendChild(col);
  }
  box.appendChild(columns);
  const verdict=text('div','r127-compare-delta '+(diff>0?'better':diff<0?'worse':'equal'),difference);
  box.appendChild(verdict);
  box.appendChild(text('div','r127-compare-hint','Stat comparison only. Previewing never buys or equips an item.'));
  selectedName=name;anchor=origin;pinned=stick;box.hidden=false;
  place();
 }
 const priorSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=priorSync.apply(this,args);
  if(!active()||!this.element?.choices){hide(true);return result;}
  const choices=this.element.choices;
  const buyButtons=[...choices.querySelectorAll('button.gfx-choice')].filter(b=>
   /^buy /i.test(String(b.querySelector('.gfx-choice-label')?.textContent||'')));
  if(!buyButtons.length){hide(true);return result;}
  const seen=new Set();
  for(const b of buyButtons){
   const label=b.querySelector('.gfx-choice-label')?.textContent?.trim()||'';
   // Display labels may include formatted prices ("Buy Crowbar — 1,501 Bolts")
   // and rarity tags. Resolve against the actual command / live shop stock,
   // never the decorative text, so hovering can find the correct GEAR stats.
   const command=String(b.dataset.command||'').trim();
   const labelName=label.replace(/^buy\\s+/i,'')
    .replace(/\\s+[—–-]\\s*[\\d,]+\\s*bolts.*$/i,'')
    .replace(/\\s*\\[(?:common|uncommon|rare|epic|legendary)\\].*$/i,'').trim();
   const commandName=String([...Object.entries(numberedChoices||{})]
    .find(([key])=>key===b.querySelector('.gfx-choice-key')?.textContent?.trim())?.[1]||'')
    .replace(/^buy\\s+/i,'').trim();
   const stock=(player.flags?.regionalEquipment?.solace?.slots||[]);
   const candidates=[commandName,labelName].filter(Boolean);
   const found=stock.find(slot=>candidates.some(v=>slot.name.toLowerCase()===v.toLowerCase()))||
    stock.find(slot=>candidates.some(v=>v.toLowerCase().startsWith(slot.name.toLowerCase())));
   const name=found?.name||Object.keys(GEAR).find(key=>candidates.some(v=>v.toLowerCase()===key.toLowerCase()))||labelName;
   const gear=def(name);
   if(!gear||!['weapon','armor'].includes(gear.type))continue;
   seen.add(name);
   const wrap=document.createElement('div');wrap.className='r127-armory-buy-wrap';
   b.parentNode.insertBefore(wrap,b);wrap.appendChild(b);
   b.removeAttribute('title'); // Prevent browser's tiny native buy-price tooltip masking the comparison.
   b.setAttribute('aria-description','Hover or focus to compare with equipped gear. Use the Compare button on touch devices.');
   b.addEventListener('mouseenter',()=>show(name,b));
   b.addEventListener('focus',()=>show(name,b));
   b.addEventListener('mouseleave',()=>{if(selectedName===name)hide();});
   b.addEventListener('blur',()=>{if(selectedName===name)hide();});
   const info=document.createElement('button');
   info.className='r127-armory-info';info.type='button';info.textContent='ⓘ';
   info.setAttribute('aria-label','Compare '+name+' with equipped '+gear.type);
   info.setAttribute('title','Compare '+name);
   info.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();
    if(pinned&&selectedName===name){hide(true);return;}
    show(name,info,true);
   });
   wrap.appendChild(info);
  }
  if(selectedName&&!seen.has(selectedName))hide(true);
  else if(panel&&!panel.hidden){
   const current=[...choices.querySelectorAll('.r127-armory-buy-wrap')].find(w=>
    (w.querySelector('.gfx-choice-label')?.textContent||'').toLowerCase().includes(selectedName.toLowerCase()));
   if(current)anchor=current.querySelector(pinned?'.r127-armory-info':'.gfx-choice');
   place();
  }
  return result;
 };
 window.addEventListener('resize',place,{passive:true});
 window.addEventListener('scroll',()=>{if(panel&&!panel.hidden)place();},{passive:true,capture:true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel&&!panel.hidden)hide(true);},true);
 const css=document.createElement('style');css.id='r127-armory-compare-css';
 css.textContent=`
 .gfx-choices .r127-armory-buy-wrap{display:flex;align-items:stretch;gap:4px;min-width:0}
 .gfx-choices .r127-armory-buy-wrap>.gfx-choice{flex:1 1 auto;width:auto;min-width:0}
 .gfx-choices .r127-armory-info{flex:0 0 32px;min-width:32px;background:#392b1e;border:1px solid #99744a;border-radius:4px;color:#efd4a4;font-weight:700;cursor:pointer}
 .gfx-choices .r127-armory-info:hover,.gfx-choices .r127-armory-info:focus-visible{background:#684426;outline:2px solid #cba15d}
 .r127-armory-compare{position:fixed;z-index:2147483000;box-sizing:border-box;padding:10px 12px;border:1px solid #c39a5e;border-radius:8px;background:#16120ef5;color:#f2e7ce;box-shadow:0 10px 30px #000c;font:13px/1.35 system-ui,sans-serif;pointer-events:auto}
 .r127-armory-compare[hidden]{display:none!important}
 .r127-compare-header{display:flex;justify-content:space-between;align-items:center;color:#e6c485;font-size:11px;font-weight:800;letter-spacing:.08em;padding-bottom:7px}
 .r127-compare-close{color:#eed6aa;background:transparent;border:1px solid #806443;border-radius:4px;cursor:pointer;font-size:20px;line-height:1;width:26px;height:25px}
 .r127-compare-columns{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}
 .r127-compare-column{display:flex;flex-direction:column;gap:5px;min-width:0;padding:8px;background:#2b2119;border:1px solid #5f4832;border-radius:5px}
 .r127-compare-label{color:#c7a980;font-size:10px;letter-spacing:.08em}
 .r127-compare-item{font-size:13px;overflow-wrap:anywhere}
 .r127-compare-stat{font-size:16px;color:#fff0cf;font-weight:700}
 .r127-compare-rarity{font-weight:700;font-size:10px}
 .r127-compare-rarity.rarity-uncommon{color:#65c77b}.r127-compare-rarity.rarity-rare{color:#78afff}
 .r127-compare-rarity.rarity-epic{color:#b68cdd}.r127-compare-rarity.rarity-legendary{color:#e39a51}
 .r127-compare-extra{color:#d2c8ba;overflow-wrap:anywhere}
 .r127-compare-delta{padding-top:8px;text-align:center;font-weight:800}
 .r127-compare-delta.better{color:#65c77b}.r127-compare-delta.worse{color:#ee8c78}.r127-compare-delta.equal{color:#ddd8c9}
 .r127-compare-hint{margin-top:5px;text-align:center;color:#bcafa0;font-size:10px}
 @media(max-width:620px){.r127-armory-compare{font-size:12px}.r127-compare-columns{gap:5px}.r127-compare-stat{font-size:14px}}
 `;
 document.head.appendChild(css);
 GraphicalUI.schedule?.();
})();
