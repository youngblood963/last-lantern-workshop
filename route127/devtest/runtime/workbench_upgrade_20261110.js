/* DEVTEST only — Workbench recipe drawers and permanent equipment upgrading. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!location.pathname.includes('/route127/devtest/'))return;
const tiers=[1,.8,.6,.4,.2],costs=[2,4,6,8,10];
const mats=r=>({Cloth:r.cloth||0,'Scrap Metal':r.scrap||0,Wire:r.wire||0,'Uncommon Electrical Parts':r.parts||0,'Tempered Steel':r.tempered||0,'Small Animal Bones':r.smallBones||0,'Animal Bones':r.bones||0,'Explosive Components':r.explosives||0,'Animal Hide':r.hide||0,...(r.materials||{})});
const state={tab:'Items',selected:null,upgrade:null,open:false};
const baseName=name=>String(name||'').replace(/ \+[1-5]$/,'');
const level=name=>Number(String(name||'').match(/ \+([1-5])$/)?.[1]||0);
function records(){return player.flags.r127EquipmentUpgrades||(player.flags.r127EquipmentUpgrades={});}
function hydrate(){
 const rec=records();
 for(const [name,entry] of Object.entries(rec)){
  const base=GEAR[entry.base];if(!base||!['weapon','armor'].includes(base.type))continue;
  GEAR[name]={...base,...(base.type==='weapon'?{min:base.min+entry.bonus,max:base.max+entry.bonus}:{def:base.def+entry.bonus})};
 }
}
function inventory(){
 hydrate();
 const out=[];
 for(const kind of ['weapon','armor']){
  const name=player[kind];if(name&&GEAR[name]?.type===kind)out.push({name,kind,equipped:true});
 }
 for(const item of player.pack||[])if(['weapon','armor'].includes(item.type)&&GEAR[item.name]?.type===item.type)
  out.push({name:item.name,kind:item.type,equipped:false,item});
 return out;
}
function have(name){return typeof r6MaterialCount==='function'?r6MaterialCount(name):0;}
function consume(name,qty){return typeof r6ConsumeMaterial==='function'?r6ConsumeMaterial(name,qty):false;}
function ready(r){
 if(r.minLevel&&player.level<r.minLevel)return false;
 if(player.bolts<(r.bolts||0))return false;
 if(Object.entries(mats(r)).some(([n,q])=>q>have(n)))return false;
 if(r.questInputs&&Object.entries(r.questInputs).some(([n,q])=>CorvetteRestoration.count(n)<q))return false;
 if(r.basicTent&&!r18ExactTent('Tent'))return false;
 if(r.food)return false; // food recipes require canonical ingredient-selection workflow
 return true;
}
const css=document.createElement('style');css.textContent=`
.r127-bench-shade{position:fixed;inset:0;z-index:9999;background:#050403bb;display:flex;align-items:center;justify-content:center;padding:12px}
.r127-bench-panel{box-sizing:border-box;width:min(760px,96vw);max-height:90dvh;overflow:auto;color:#f1ddbd;background:linear-gradient(130deg,#251b15ec,#0b0c0cef),url('../devtest/assets/locations/crafting_workbench.png') center/cover;border:3px ridge #a26a38;box-shadow:0 15px 65px #000, inset 0 0 50px #000;border-radius:9px;padding:18px;font-family:Georgia,serif}
.r127-bench-panel h2{margin:0 0 12px;color:#e5a563;text-transform:uppercase;letter-spacing:2px}
.r127-bench-panel h3{color:#ffcb88}
.r127-bench-tabs,.r127-bench-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
.r127-bench-panel button,.r127-bench-panel select{background:#241b16;color:#f3d6a7;border:1px solid #9c6637;border-radius:4px;padding:10px;cursor:pointer;font-size:14px}
.r127-bench-panel button:disabled{opacity:.4;cursor:not-allowed}
.r127-bench-panel button.active,.r127-bench-panel button.primary{background:#75421f;color:#fff}
.r127-bench-panel .good{color:#58e58c;font-weight:bold}.r127-bench-panel .bad{color:#ff6767;font-weight:bold}
.r127-bench-panel .r127-bench-list{display:flex;flex-direction:column;gap:5px;max-height:22dvh;overflow:auto}
.r127-bench-panel .r127-bench-list button{text-align:left}
.r127-bench-panel .r127-bench-detail{padding:12px;background:#090807c9;border:1px solid #72512f;min-height:90px}
.r127-bench-panel .r127-bench-row{padding:4px 0}
`;document.head.append(css);
let shade=null;
function button(parent,label,fn,disabled=false,klass=''){const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=disabled;b.className=klass;b.addEventListener('click',fn);parent.append(b);return b}
function el(parent,tag,text,klass=''){const n=document.createElement(tag);n.textContent=text;n.className=klass;parent.append(n);return n}
function close(){shade?.remove();shade=null;state.open=false}
function open(tab='Items'){state.tab=tab;state.open=true;draw()}
function draw(){
 if(!state.open||stage!=='r11Craft'){close();return}
 hydrate();shade?.remove();shade=document.createElement('div');shade.className='r127-bench-shade';
 shade.addEventListener('click',e=>{if(e.target===shade)close()});
 const panel=document.createElement('section');panel.className='r127-bench-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Workbench '+state.tab);shade.append(panel);document.body.append(shade);
 el(panel,'h2',"Workbench — "+state.tab);
 const tabs=el(panel,'div','','r127-bench-tabs');
 for(const tab of ['Items','Weapons','Armor','Upgrade'])button(tabs,tab,()=>{state.tab=tab;state.selected=null;state.upgrade=null;draw()},false,tab===state.tab?'active':'');
 button(tabs,'Close',close);
 if(state.tab==='Upgrade'){drawUpgrade(panel);return}
 const category={Items:['consumable','material','supply','tool'],Weapons:['weapon'],Armor:['armor']}[state.tab];
 const keys=Object.keys(CRAFT_RECIPES).filter(k=>r11Learned(k)&&category.includes(CRAFT_RECIPES[k].type)&&k!=='pipe');
 const list=el(panel,'div','','r127-bench-list');
 for(const key of keys)button(list,CRAFT_RECIPES[key].name,()=>{state.selected=key;draw()},false,state.selected===key?'active':'');
 if(!keys.length)el(panel,'p','No learned recipes in this category.');
 const key=keys.includes(state.selected)?state.selected:keys[0],r=CRAFT_RECIPES[key];
 if(!r)return;
 const detail=el(panel,'div','','r127-bench-detail');
 el(detail,'h3',r.name);
 const gear=GEAR[r.name],desc=gear?.type==='weapon'?'Attack '+gear.min+'–'+gear.max:gear?.type==='armor'?'Defense '+gear.def:r.type==='consumable'?'Consumable item':r.type==='material'?'Crafting material':'Craftable '+r.type;
 el(detail,'p',desc+(r.minLevel?' · Level '+r.minLevel+' required':''));
 el(detail,'p','Time: '+String(Math.floor(r.seconds/60)).padStart(2,'0')+':'+String(r.seconds%60).padStart(2,'0')+' · Success: '+Math.round(r.chance*100)+'%');
 for(const [name,q] of Object.entries(mats(r)))if(q){const n=have(name);el(detail,'div',name+' — '+n+'/'+q,n>=q?'good':'bad')}
 for(const [name,q]of Object.entries(r.questInputs||{})){const n=CorvetteRestoration.count(name);el(detail,'div',name+' — '+n+'/'+q,n>=q?'good':'bad')}
 if(r.basicTent)el(detail,'div','Tent — '+(r18ExactTent('Tent')?'1/1':'0/1'),r18ExactTent('Tent')?'good':'bad');
 if(r.bolts){el(detail,'div','Bolts — '+player.bolts+'/'+r.bolts,player.bolts>=r.bolts?'good':'bad')}
 if(r.food)el(detail,'p','Ingredient selection required — use original crafting menu.','bad');
 if(player.flags.v49MurphyJob)el(detail,'p','A craft is already running. Collect it before starting another.','bad');
 const actions=el(detail,'div','','r127-bench-actions');
 button(actions,'Craft',()=>{close();r11CraftCommand('craft '+r.name.toLowerCase());if(typeof GraphicalUI!=='undefined')GraphicalUI.schedule()},!ready(r)||!!player.flags.v49MurphyJob,'primary');
 button(actions,'Back to Workbench',close);
}
function drawUpgrade(panel){
 const entries=inventory(),list=el(panel,'div','','r127-bench-list');
 for(let i=0;i<entries.length;i++){const e=entries[i];button(list,e.name+(e.equipped?' (EQUIPPED)':''),()=>{state.upgrade=i;draw()},false,state.upgrade===i?'active':'')}
 if(!entries.length){el(panel,'p','No weapons or armor available.');return}
 const index=Number.isInteger(state.upgrade)&&entries[state.upgrade]?state.upgrade:0,e=entries[index],lv=level(e.name),g=GEAR[e.name],material=e.kind==='weapon'?'Scrap Metal':'Cloth',cost=costs[lv],chance=tiers[lv],detail=el(panel,'div','','r127-bench-detail');
 el(detail,'h3',e.name+(e.equipped?' — Equipped':''));
 el(detail,'p',e.kind==='weapon'?'Attack: '+g.min+'–'+g.max:'Defense: '+g.def);
 if(lv>=5){el(detail,'h3','FULLY UPGRADED — MAXIMUM LEVEL REACHED','good');return}
 el(detail,'p','Next: +'+(lv+1)+' · Success chance: '+Math.round(chance*100)+'% · On success: +1–3 '+(e.kind==='weapon'?'Attack':'Defense'));
 el(detail,'div',material+' — '+have(material)+'/'+cost,have(material)>=cost?'good':'bad');
 el(detail,'p','Materials are consumed on every attempt. Failure leaves the equipment and its current stats unchanged.');
 const actions=el(detail,'div','','r127-bench-actions');
 button(actions,'Upgrade',()=>{
  // Resolve again to avoid spending on a stale selection.
  const selected=inventory().find(x=>x.name===e.name&&x.kind===e.kind&&x.equipped===e.equipped);
  if(!selected||level(selected.name)!==lv||have(material)<cost){draw();return}
  if(!consume(material,cost)){draw();return}
  const success=Math.random()<chance;
  if(success){
   const bonus=1+Math.floor(Math.random()*3),name=baseName(e.name)+' +'+(lv+1),old=records()[e.name],total=(old?.bonus||0)+bonus;
   records()[name]={base:old?.base||baseName(e.name),bonus:total};
   hydrate();
   if(selected.equipped)player[selected.kind]=name;
   else selected.item.name=name;
   state.upgrade=null;
  }
  updateHud();if(typeof v49Autosave==='function')v49Autosave();
  draw();const result=el(panel,'p',success?'UPGRADE SUCCESS — +'+(lv+1)+' achieved!':'UPGRADE FAILED — Equipment preserved.',success?'good':'bad');
  result.scrollIntoView({block:'nearest'});
 },have(material)<cost,'primary');
}
const oldMenu=r11CraftMenu;
r11CraftMenu=function(...args){const result=oldMenu.apply(this,args);if(state.open)setTimeout(()=>{if(state.open)draw()},0);return result};
const oldSync=GraphicalUI.sync;
GraphicalUI.sync=function(...args){hydrate();const result=oldSync.apply(this,args);if(state.open&&stage!=='r11Craft')close();return result};
const oldChoices=GraphicalUI.choices;
GraphicalUI.choices=function(...args){
 const choices=oldChoices.apply(this,args);
 if(stage==='r11Craft'&&!player.flags.v49MurphyJob&&!player.flags.r18FoodDraft&&player.flags.v49RecipeBandage){
  return [...['Items','Weapons','Armor','Upgrade'].map((tab,i)=>({key:String(i+1),label:tab,command:'r127 bench '+tab.toLowerCase()})),{key:'5',label:'Back',command:'back'}];
 }
 return choices;
};
const oldDispatch=GraphicalUI.dispatch;
GraphicalUI.dispatch=async function(choice){
 if(stage==='r11Craft'&&/^r127 bench /.test(choice?.command||'')){open(choice.command.slice(11).replace(/^./,x=>x.toUpperCase()));return true}
 return oldDispatch.apply(this,arguments);
};
const oldCore=handleCommandCore;
handleCommandCore=async function(raw){
 const cmd=String(raw||'').trim().toLowerCase();
 if(stage==='r11Craft'&&/^r127 bench (items|weapons|armor|upgrade)$/.test(cmd)){open(cmd.slice(11).replace(/^./,x=>x.toUpperCase()));return true}
 return oldCore.apply(this,arguments);
};
hydrate();
})();
