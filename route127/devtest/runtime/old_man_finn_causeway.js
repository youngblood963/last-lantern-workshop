/* DEVTEST — Old Man Finn: fixed Causeway supply boat and discovered map site.
   No graph edit, no extra movement turns, no random encounter replacement. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||
   typeof lanternState!=='function'||typeof GraphicalUI==='undefined')return;
const EDGE='boulder-junction--seaport', STEP=6, STAGE='r127FinnStore';
const ART='../devtest/assets/locations/old_man_finn_boat.png';
const inventoryTemplate=()=>({
 'Energy Bars':8,'Bandage':6,'Tent':3,'Scrap Metal':8,Wire:6,Cloth:6,'Emergency Trauma Kit':1
});
const position=()=>{const g=lanternState();return g?.currentEdgeId===EDGE&&g.stepIndex===STEP&&!g.pending;};
function discover(){
 if(!position()||player.flags.r127FinnDiscovered)return;
 player.flags.r127FinnDiscovered=true;
 add('DISCOVERED — OLD MAN FINN. A supply boat is moored beside the Causeway. Its location is now marked on your map.','reward');
 if(typeof v49Autosave==='function')v49Autosave();
}
function stock(){
 const period=Number(player.flags.nextRefillAt)||0;
 const s=player.flags.r127FinnStock;
 if(s&&s.period===period)return s.items;
 const items=inventoryTemplate();
 player.flags.r127FinnStock={period,items};
 return items;
}
const price=name=>Math.max(1,Number(VENDOR_BASE[name]||
  Math.max(1,(V48_LOOT_PRICES[name]||2)*2)));
function leave(){
 delete player.flags.r127FinnSale;
 stage='lanternRoad';
 lanternRoadMenu();
}
function menu(page='main'){
 if(!position())return leave();
 discover();
 stage=STAGE;
 player.flags.r127FinnPage=page;
 add('OLD MAN FINN — CAUSEWAY SUPPLY BOAT','place');
 add('FINN > You look like the crabs have been giving you trouble. Got a few things to keep you breathing.','bright');
 if(page==='buy'){
  const goods=Object.entries(stock()).filter(([,qty])=>qty>0);
  r5DirectChoices([...goods.map(([name,qty])=>
   'BUY '+name.toUpperCase()+' — '+price(name)+' BOLTS ('+qty+' LEFT)'),'BACK']);
 }else if(page==='sell'){
  const goods=(player.pack||[]).filter(item=>v48SellPrice(item)>0);
  r5DirectChoices([...goods.map(item=>'SELL '+r18ItemLabel(item).toUpperCase()+
   ' — '+v48SellPrice(item)+' BOLTS'),'BACK']);
 }else if(page==='confirm'){
  const sale=player.flags.r127FinnSale;
  add('Sell '+(sale?.name||'item')+' for '+(sale?.price||0)+' Bolts?','system');
  r5DirectChoices(['CONFIRM STORE SALE','CANCEL STORE SALE']);
 }else{
  r5DirectChoices(['BUY SUPPLIES','SELL ITEMS','RETURN TO CAUSEWAY']);
 }
}
function buy(command){
 const name=Object.keys(stock()).find(n=>n.toLowerCase()===command.slice(4).split(' —')[0]);
 const amount=name&&price(name);
 if(!name||stock()[name]<1){add('That supply is sold out.','system');return menu('buy');}
 if(player.bolts<amount){add('Not enough Bolts.','system');return menu('buy');}
 if(!addPack(name,v52ItemType(name),1,true)){add('Backpack full. Nothing charged.','system');return menu('buy');}
 player.bolts-=amount;stock()[name]--;
 updateHud();v49Autosave();add('PURCHASED — '+name,'reward');menu('buy');
}
function sell(command){
 const name=command.slice(5).split(' —')[0];
 const item=r18NamedStack(player.pack,name);
 if(!item||v48SellPrice(item)<=0){add('That item cannot be sold.','system');return menu('sell');}
 player.flags.r127FinnSale={name:item.name,type:item.type,stolen:!!item.stolen,price:v48SellPrice(item)};
 menu('confirm');
}
function confirm(){
 const q=player.flags.r127FinnSale;
 const item=q&&(player.pack||[]).find(i=>i.name===q.name&&i.type===q.type&&!!i.stolen===q.stolen);
 if(!item||v48SellPrice(item)!==q.price||!Number.isSafeInteger(player.bolts+q.price)){
  add('Sale changed. Nothing sold.','system');
 }else if(item.stolen&&typeof r18SaleDetected==='function'&&r18SaleDetected(item,'Old Man Finn')){
  add('Finn refuses the stolen goods.','system');
 }else{
  item.qty--;if(item.qty<=0)player.pack.splice(player.pack.indexOf(item),1);
  player.bolts+=q.price;updateHud();v49Autosave();
  add('SOLD '+q.name+' — '+q.price+' BOLTS','reward');
 }
 delete player.flags.r127FinnSale;menu('sell');
}
const oldRoadMenu=lanternRoadMenu;
lanternRoadMenu=function(...args){
 const ready=position();
 if(ready)discover();
 const result=oldRoadMenu.apply(this,args);
 if(ready){
  const action='VISIT OLD MAN FINN';
  // Append through the same native choice registrar, after the road menu.
  outputQueue=outputQueue.then(()=>{
   if(stage!=='lanternRoad'||!position())return;
   if(Object.values(numberedChoices).includes(action.toLowerCase()))return;
   const next=String(Math.max(0,...Object.keys(numberedChoices).map(Number).filter(Number.isFinite))+1);
   numberedChoices[next]=action.toLowerCase();
   addImmediate('['+next+'] '+action,'system');
   GraphicalUI.schedule();
  });
 }
 return result;
};
const oldCore=handleCommandCore;
handleCommandCore=async function(raw){
 const cmd=String(r5Mapped(raw)||'').trim().toLowerCase();
 if(stage===STAGE){
  if(['back','b','return to causeway','leave'].includes(cmd)){
   if(player.flags.r127FinnPage==='main'||cmd==='return to causeway')return leave();
   return menu('main');
  }
  if(cmd==='buy supplies')return menu('buy');
  if(cmd==='sell items')return menu('sell');
  if(cmd.startsWith('buy ')&&player.flags.r127FinnPage==='buy')return buy(cmd);
  if(cmd.startsWith('sell ')&&player.flags.r127FinnPage==='sell')return sell(cmd);
  if(cmd==='confirm store sale'&&player.flags.r127FinnPage==='confirm')return confirm();
  if(cmd==='cancel store sale')return menu('sell');
  return menu(player.flags.r127FinnPage||'main');
 }
 if(stage==='lanternRoad'&&position()&&cmd==='visit old man finn')return menu();
 return oldCore.apply(this,arguments);
};
const oldRender=renderCurrentChoices;
renderCurrentChoices=function(...args){
 if(stage===STAGE)return menu(player.flags.r127FinnPage||'main');
 return oldRender.apply(this,args);
};
const oldModel=GraphicalUI.model;
GraphicalUI.model=function(...args){
 const result=oldModel.apply(this,args);
 if(stage===STAGE){result.location='old-man-finn';result.title='Old Man Finn — Causeway';result.art=ART;}
 return result;
};
// Once discovered, mark Finn on the water beside the Causeway with the map's
// existing amber leader-line/circle/label typography. Do not alter map topology.
const oldMap=showMap;
showMap=function(...args){
 const result=oldMap.apply(this,args);
 if(player.flags.r127FinnDiscovered&&lanternState()?.mapMode!=='classic'){
  outputQueue=outputQueue.then(()=>{
   const svg=screen?.querySelector('.lantern-map svg');
   if(!svg||svg.querySelector('[data-old-man-finn]'))return;
   const ns='http://www.w3.org/2000/svg',g=document.createElementNS(ns,'g');
   g.setAttribute('data-old-man-finn','');g.setAttribute('role','img');
   g.setAttribute('aria-label','Old Man Finn — supply boat beside the Causeway');
   // Causeway center is x=543; offset the dock marker east onto the water.
   const shapes=[
    ['line',{x1:543,y1:814,x2:605,y2:814,stroke:'#e4bb68','stroke-width':2,'stroke-dasharray':'5 4'}],
    ['circle',{cx:605,cy:814,r:7,fill:'#e4bb68',stroke:'#201409','stroke-width':2}],
    ['text',{x:618,y:802,fill:'#ffe0a0',stroke:'#10151c','stroke-width':5,
     'paint-order':'stroke','font-size':18,'font-family':'monospace'},'OLD MAN FINN']
   ];
   for(const [tag,attributes,value] of shapes){
    const el=document.createElementNS(ns,tag);
    for(const [k,v] of Object.entries(attributes))el.setAttribute(k,String(v));
    if(value)el.textContent=value;g.append(el);
   }
   svg.append(g);
  });
 }
 return result;
};
if(typeof TravelerPanels!=='undefined'){
 const journal=TravelerPanels,oldOutput=journal.journalOutput;
 journal.journalOutput=async function(...args){
  await oldOutput.apply(this,args);
  if(this.page==='locations'&&player.flags.r127FinnDiscovered&&
    !this.questEntries.some(x=>x.title==='Old Man Finn')){
   this.questEntries.push({title:'Old Man Finn',details:[
    'Causeway, halfway between Boulder Junction and Seaport.',
    'Permanent supply boat. General supplies available in both directions.'
   ]});
  }
 };
}
})();