/* DEVTEST ONLY — Solace side-quest roadside discoveries.
 * Art + graphical choice labels only; original quest markers, pickup logic,
 * rewards, turns, saves and Classic BBS commands remain authoritative.
 */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
const root=new URL('../devtest/',document.baseURI);
const art=file=>new URL('assets/quests/'+file,root).href;
let lastAutomatic='';
if(typeof questRoadEvent==='function'){
 const originalEvent=questRoadEvent;
 questRoadEvent=function(...args){
  const before={tim:player.flags?.timQuest,murphy:player.flags?.murphyQuest};
  const result=originalEvent.apply(this,args);
  if(result){
   if(before.tim!=='found'&&player.flags?.timQuest==='found')lastAutomatic='tim';
   else if(before.murphy!=='found'&&player.flags?.murphyQuest==='found')lastAutomatic='murphy';
  }
  return result;
 };
}
const discoveries={
 tim:{file:'tim_old_badge.png',title:'THE OLD BADGE'},
 murphy:{file:'murphy_serpentine_belt.png',title:'WRECKED DELIVERY VAN'},
 johnny:{file:'johnny_missing_ledger.png',title:"JOHNNY'S LOST LEDGER"},
 amii:{file:'amii_bank_satchel.png',title:'LOCKED BANK SATCHEL'},
 wayne:{file:'wayne_medical_supplies.png',title:'ABANDONED AMBULANCE'}
};
function selected(){
 if(typeof stage==='undefined'||!['turnComplete','questRoadComplete'].includes(stage))return null;
 if(stage==='questRoadComplete'){
  if(lastAutomatic)return discoveries[lastAutomatic];
  // Recover the visible find after a save/load, without changing a quest flag.
  const output=typeof screen!=='undefined'?screen.textContent||'':'';
  const badge=output.lastIndexOf('SOMETHING IN THE WEEDS'),van=output.lastIndexOf('WRECKED DELIVERY VAN');
  return badge<0&&van<0?null:discoveries[van>badge?'murphy':'tim'];
 }
 const markers=typeof questRoadMarkers==='function'?questRoadMarkers().map(row=>String(row[1]).toUpperCase()):[];
 for(const [command,name] of [['SEARCH AMBULANCE','wayne'],['SEARCH SATCHEL','amii'],['SEARCH LEDGER','johnny']]){
  if(markers.includes(command))return discoveries[name];
 }
 return null;
}
const previousModel=GraphicalUI.model;
GraphicalUI.model=function(...args){
 const model=previousModel.apply(this,args);
 const item=model?.active?selected():null;
 if(item){model.art=art(item.file);model.title=item.title;model.regionalSky=null;}
 return model;
};
const previousChoices=GraphicalUI.choices;
GraphicalUI.choices=function(...args){
 const rows=previousChoices.apply(this,args);
 if(!this.active()||!selected())return rows;
 const names={
  'search ambulance':'Take Medical Supplies',
  'search satchel':'Take Bank Satchel',
  'search ledger':"Take Johnny's Ledger",
  'continue':'Return to Road',
  'continue east':'Return to Road',
  'continue west':'Return to Road',
  'c':'Return to Road'
 };
 return rows.map(row=>({...row,label:names[String(row.command||'').toLowerCase()]||row.label}));
};
const style=document.createElement('style');style.id='r127-quest-discovery-art';
style.textContent=`
.gfx-art.r127-quest-discovery{position:relative;isolation:isolate;overflow:hidden;background:#202326!important}
.gfx-art.r127-quest-discovery>.r127-quest-background{position:absolute;inset:0;z-index:0;background-position:center;background-size:cover;background-repeat:no-repeat;pointer-events:none}
.gfx-art.r127-quest-discovery>.gfx-image{position:relative;z-index:3;width:100%;height:100%;max-width:none;object-fit:contain;object-position:center center;background:transparent!important;filter:drop-shadow(5px 9px 7px #0009)}
.gfx-art.r127-quest-discovery>.gfx-art-caption{z-index:8}
.gfx-art.r127-quest-discovery>.r127-regional-sky{display:none!important}
.gfx-art.r127-quest-discovery[data-quest-period="dawn"]>.gfx-image{filter:brightness(.89) sepia(.13) drop-shadow(5px 9px 7px #0009)}
.gfx-art.r127-quest-discovery[data-quest-period="dusk"]>.gfx-image{filter:brightness(.76) sepia(.19) drop-shadow(5px 9px 7px #0009)}
.gfx-art.r127-quest-discovery[data-quest-period="night"]>.gfx-image{filter:brightness(.57) saturate(.76) drop-shadow(5px 9px 7px #0009)}
`;
document.head.append(style);
const previousSync=GraphicalUI.sync;
GraphicalUI.sync=function(...args){
 const result=previousSync.apply(this,args);
 try{
  const e=this.element;if(!e?.figure)return result;
  const item=!e.frame.hidden&&this.preference()==='graphics'?selected():null;
  e.figure.classList.toggle('r127-quest-discovery',!!item);
  let background=e.figure.querySelector(':scope > .r127-quest-background');
  if(!item){background?.remove();delete e.figure.dataset.questPeriod;return result;}
  if(!background){
   background=document.createElement('div');background.className='r127-quest-background';
   background.setAttribute('aria-hidden','true');e.figure.insertBefore(background,e.img);
  }
  const region=typeof route127CurrentRegion==='function'?route127CurrentRegion(lanternState()):'CENTRAL';
  const hour=player.flags?.worldHour;
  const layers=globalThis.Route127EditorSky?.describe(region,hour);
  if(layers){
   background.style.backgroundImage='url("'+layers.ground+'"), url("'+layers.sky+'")';
   e.figure.dataset.questPeriod=layers.period;
  }else{
   background.style.backgroundImage='url("'+new URL('../assets/regions/'+String(region||'CENTRAL').toLowerCase()+'.png',root).href+'")';
   delete e.figure.dataset.questPeriod;
  }
  e.caption.textContent=item.title;
 }catch(error){console.warn('DEVTEST quest discovery art:',error)}
 return result;
};
})();
