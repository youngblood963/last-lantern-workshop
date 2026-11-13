/* DEVTEST — Solace quest discovery screens, 2026-11-13.
 * Preserve all canonical quest flags, pickups, road turns, Classic BBS and saves.
 * Graphical mode: five discoveries share a short Take Item / Back interaction.
 */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
const root=new URL('../devtest/',document.baseURI);
const art=file=>new URL('assets/quests/'+file,root).href;
const definitions=Object.freeze({
 tim:{file:'tim_old_badge.png',title:'SOMETHING IN THE WEEDS',take:"TAKE BADGE",item:"Tim's Old Badge",flag:'timQuest',before:'active',after:'found',quest:'THE OLD BADGE',description:'A dull flash among the dead grass reveals Tim’s scratched old badge.'},
 murphy:{file:'murphy_serpentine_belt.png',title:'WRECKED DELIVERY VAN',take:'TAKE BELT',item:'Usable Serpentine Belt',flag:'murphyQuest',before:'active',after:'found',quest:'ONE GOOD BELT',description:'An abandoned van sits nose-down in a ditch. Its open hood reveals a usable serpentine belt.'},
 johnny:{file:'johnny_missing_ledger.png',title:"LOST TRADER'S LEDGER",take:'TAKE LEDGER',item:"Johnny's Ledger",flag:'johnnyQuest',before:'ledger',after:'recovered',quest:'A DEAL GONE BAD',description:'The trader’s missing ledger lies beside the western road.'},
 amii:{file:'amii_bank_satchel.png',title:'LOCKED BANK SATCHEL',take:'TAKE SATCHEL',item:'Bank Satchel',flag:'amiiQuest',before:'deposit',after:'recovered',quest:'THE MISSING DEPOSIT',description:'A weathered, locked bank satchel lies near the old highway.'},
 wayne:{file:'wayne_medical_supplies.png',title:'ABANDONED AMBULANCE',take:'TAKE MEDICAL SUPPLIES',item:'Clinic Medicine',flag:'waynePatientQuest',before:'supplies',after:'recovered',quest:'THE LAST PATIENT',description:'An abandoned ambulance holds medical supplies needed by Wayne’s patient.'}
});
const sceneStage='r127QuestDiscovery';
const graphics=()=>GraphicalUI.preference()==='graphics';
const current=()=>player.flags?.r127QuestDiscovery;
const active=()=>stage===sceneStage&&current()&&definitions[current().key];
const stepKey=key=>String(roadGoal)+'|'+String(roadTurn)+'|'+key;
let dismissed='';
function sceneChoices(){
 const info=active();if(!info)return;
 const def=definitions[info.key];
 const options=info.taken?['BACK']:[def.take,'BACK'];
 if(typeof r5DirectChoices==='function')r5DirectChoices(options);
 else add(options.join('   '),'system');
}
function openDiscovery(key){
 const def=definitions[key];
 if(!def||player.flags?.[def.flag]!==def.before)return false;
 player.flags.r127QuestDiscovery={key,taken:false};
 stage=sceneStage;
 add(def.title,'place');add(def.description);
 sceneChoices();
 if(typeof GraphicalUI.schedule==='function')GraphicalUI.schedule();
 return true;
}
function markerKey(){
 if(!graphics()||typeof questRoadMarkers!=='function')return '';
 const commands=questRoadMarkers().map(row=>String(row[1]).toLowerCase());
 for(const [command,key] of [['search ambulance','wayne'],['search satchel','amii'],['search ledger','johnny']]){
  if(commands.includes(command)&&player.flags[definitions[key].flag]===definitions[key].before&&dismissed!==stepKey(key))return key;
 }
 return '';
}
// The original Tim/Murphy road event automatically deposited quest items,
// which could flash past without giving the new graphical scene any time.
// Keep the same cooldown, chance, quest-step counters and travel turn cost;
// the actual flag/item change now happens only after TAKE.
if(typeof questRoadEvent==='function'){
 const classicEvent=questRoadEvent;
 questRoadEvent=function(...args){
  if(!graphics())return classicEvent.apply(this,args);
  if(roadGoal!=='house')return false;
  const f=player.flags,available=['tim','murphy'].filter(key=>f[definitions[key].flag]==='active');
  if(!available.length)return false;
  f.questEventCooldown=f.questEventCooldown||0;
  if(f.questEventCooldown>0){
   f.questEventCooldown--;
   available.forEach(key=>{const counter=key+'QuestSteps';f[counter]=(f[counter]||0)+1;});
   return false;
  }
  for(const key of available){
   const countKey=key+'QuestSteps';
   f[countKey]=(f[countKey]||0)+1;
   if(f[countKey]<=1)continue;
   if(f[countKey]<3&&Math.random()>=.45)continue;
   f.questEventCooldown=2;
   if(openDiscovery(key))return true;
  }
  return false;
 };
}
if(typeof completeRoadTurn==='function'){
 const previousComplete=completeRoadTurn;
 completeRoadTurn=function(...args){
  const result=previousComplete.apply(this,args);
  if(stage==='turnComplete'&&graphics()){
   const key=markerKey();
   if(key)openDiscovery(key);
  }
  return result;
 };
}
if(typeof renderCurrentChoices==='function'){
 const previousRender=renderCurrentChoices;
 renderCurrentChoices=function(...args){
  if(stage===sceneStage){
   if(!active()){delete player.flags.r127QuestDiscovery;stage='turnComplete';return previousRender.apply(this,args);}
   sceneChoices();return;
  }
  return previousRender.apply(this,args);
 };
}
if(typeof handleCommand==='function'){
 const previousCommand=handleCommand;
 handleCommand=async function(raw,...args){
  if(stage!==sceneStage)return previousCommand.call(this,raw,...args);
  const info=active();
  if(!info){stage='turnComplete';return previousCommand.call(this,raw,...args);}
  const def=definitions[info.key];
  const input=String(raw||'').trim().toLowerCase();
  const take=def.take.toLowerCase();
  if(!info.taken&&(input==='1'||input===take||input==='take'||input==='take item')){
   if(player.flags[def.flag]!==def.before){
    info.taken=true;add('This item has already been recovered.','system');sceneChoices();return;
   }
   // Quest items do not consume normal backpack slots. Do not award twice.
   if(!hasItem(def.item)&&!addPack(def.item,'quest')){
    add('Could not secure the quest item. Try again.','danger');sceneChoices();return;
   }
   player.flags[def.flag]=def.after;
   info.taken=true;
   add('QUEST UPDATED — '+def.quest+': '+def.item+' recovered. Return to '+(info.key==='wayne'?'Wayne':info.key==='murphy'?'Murphy':info.key==='johnny'?'Johnny':info.key==='amii'?'Amii':'Tim')+' in Solace.','reward');
   sceneChoices();GraphicalUI.schedule();return;
  }
  if(input==='2'||input==='back'||input==='b'||input==='return to road'||(info.taken&&input==='1')){
   dismissed=stepKey(info.key);
   delete player.flags.r127QuestDiscovery;
   stage='turnComplete';
   add('RETURN TO ROAD','system');
   // Stay on this road step; no free extra movement or turn cost.
   completeRoadTurn();
   GraphicalUI.schedule();return;
  }
  if(input==='save'||input==='save current'||input==='v')return previousCommand.call(this,raw,...args);
  sceneChoices();GraphicalUI.schedule();
 };
}
const previousModel=GraphicalUI.model;
GraphicalUI.model=function(...args){
 const model=previousModel.apply(this,args),info=active();
 if(model?.active&&info){model.art=art(definitions[info.key].file);model.title=definitions[info.key].title;model.regionalSky=null;}
 return model;
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
  const info=!e.frame.hidden&&graphics()?active():null;
  e.figure.classList.toggle('r127-quest-discovery',!!info);
  let background=e.figure.querySelector(':scope > .r127-quest-background');
  if(!info){background?.remove();delete e.figure.dataset.questPeriod;return result;}
  if(!background){background=document.createElement('div');background.className='r127-quest-background';background.setAttribute('aria-hidden','true');e.figure.insertBefore(background,e.img);}
  const region=typeof route127CurrentRegion==='function'?route127CurrentRegion(lanternState()):'CENTRAL';
  const layers=globalThis.Route127EditorSky?.describe(region,player.flags?.worldHour);
  if(layers){background.style.backgroundImage='url("'+layers.ground+'"),url("'+layers.sky+'")';e.figure.dataset.questPeriod=layers.period;}
  else{background.style.backgroundImage='url("'+new URL('../assets/regions/'+String(region||'CENTRAL').toLowerCase()+'.png',root).href+'")';delete e.figure.dataset.questPeriod;}
  e.caption.textContent=definitions[info.key].title;
 }catch(error){console.warn('DEVTEST quest discovery art:',error)}
 return result;
};
})();
