/* DEVTEST — Old Man Finn: fixed Causeway supply boat and discovered map site.
   No graph edit, no extra movement turns, no random encounter replacement. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||
   typeof lanternState!=='function'||typeof GraphicalUI==='undefined')return;
const EDGE='boulder-junction--seaport', STEP=6, STAGE='r127FinnStore';
const ART='../devtest/assets/locations/old_man_finn_boat.png';
// Layer static water over the world-hour sky and behind the boat sprite.
const WATER=new URL('../assets/regions/water.png',document.baseURI).href;
const finnArtStyle=document.createElement('style');
finnArtStyle.textContent=`
body.full-graphics .gfx-frame .gfx-art.r127-finn-backdrop{
 position:relative;
 background-color:#080d14!important;
 background-image:url("${WATER}"),var(--r127-finn-sky,none)!important;
 background-size:100% 34%,130% auto!important;
 background-position:center bottom,left center!important;
 background-repeat:no-repeat!important;
}
body.full-graphics .gfx-frame .gfx-art.r127-finn-backdrop > img.gfx-image[src*="old_man_finn_boat.png"]{
 background:transparent!important;
 object-fit:contain!important;
 object-position:center center!important;
 transform:translateY(10%) scale(.78)!important;
 transform-origin:center center!important;
}
`;
document.head.appendChild(finnArtStyle);
const oldFinnSync=GraphicalUI.sync;
GraphicalUI.sync=function(...args){
 const result=oldFinnSync.apply(this,args);
 const figure=this.element?.figure;
 if(figure){
  figure.classList.toggle('r127-finn-backdrop',stage===STAGE);
  if(stage===STAGE){
   const phase=typeof Route127RegionalSky!=='undefined'
    ?Route127RegionalSky.phase(player?.flags?.worldHour):'night';
   const file=phase==='dusk'?'sky_dawn.png':'sky_'+phase+'.png';
   const sky=new URL('../assets/regions/'+file,document.baseURI).href;
   figure.style.setProperty('--r127-finn-sky','url("'+sky+'")');
  }else figure.style.removeProperty('--r127-finn-sky');
 }
 return result;
};

const inventoryTemplate=()=>({
 'Energy Bars':8,'Clean Water':10,'Bandage':6,'Tent':3,'Scrap Metal':8,Wire:6,Cloth:6,'Emergency Trauma Kit':1
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
 if(s&&s.period===period){s.items['Clean Water']??=10;return s.items;}
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
// The map discovery proved travelers are reaching STEP 6, but the optional
// road action is easy to miss among other road/quest buttons. Treat Finn as a
// visible, non-consuming waypoint once per movement arrival (both directions).
// Returning to the Causeway resumes the normal menu without reopening Finn.
const roadMenuBeforeFinn=lanternRoadMenu;
let lastWaypointArrival=null;
lanternRoadMenu=function(...args){
 if(position()){
  const g=lanternState();
  const arrival=[g.currentEdgeId,g.stepIndex,g.moveSerial||0,g.sceneId||''].join(':');
  if(arrival!==lastWaypointArrival){
   lastWaypointArrival=arrival;
   return menu('main');
  }
 }
 return roadMenuBeforeFinn.apply(this,args);
};
const VISIT='VISIT OLD MAN FINN';
globalThis.Route127OldManFinn=Object.freeze({
 roadAction(){
  if(!position())return null;
  discover();
  return VISIT;
 },
 mapMarker(){
  if(!player.flags.r127FinnDiscovered)return '';
  const point=lanternVisualEdgePoint(LG_EDGES[EDGE],STEP);
  const x=Math.round(point[0]*LANTERN_MAP_VISUAL.width);
  const y=Math.round(point[1]*LANTERN_MAP_VISUAL.height);
  const dock=x+62;
  return `<g data-old-man-finn role="img" aria-label="Old Man Finn — supply boat beside the Causeway">
   <line x1="${x}" y1="${y}" x2="${dock}" y2="${y}" stroke="#e4bb68" stroke-width="2" stroke-dasharray="5 4"/>
   <circle cx="${dock}" cy="${y}" r="7" fill="#e4bb68" stroke="#201409" stroke-width="2"/>
   <text x="${dock+13}" y="${y-12}" fill="#ffe0a0" stroke="#10151c" stroke-width="5"
    paint-order="stroke" font-size="18" font-family="monospace">OLD MAN FINN</text>
  </g>`;
 }
});
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
 if(stage==='lanternRoad'&&position()&&cmd===VISIT.toLowerCase())return menu();
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
 if(stage===STAGE){
   result.location='old-man-finn';result.title='Old Man Finn — Causeway';result.art=ART;
   // Finn is a transparent foreground, not the Causeway regional base.
   // Never overlay the regional sky above his face.
   result.regionalSky=null;result.causewayBacking=false;
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