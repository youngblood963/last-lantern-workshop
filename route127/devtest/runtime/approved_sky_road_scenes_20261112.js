/* DEVTEST ONLY — Owner-approved seven sky + dirt road scene compositions.
 * Matches the Sky + Dirt Road Image Lab defaults (sky -> dirt road -> original scene).
 * Never reads/writes lab storage, combat layout storage, save games or quest flags.
 */
(() => {
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||typeof GraphicalUI==='undefined')return;
 const scenes=new Map([
  ['THE BRIDGE TOLL','bridge_toll.png'],
  ['THE BURNT LIBRARY','burnt_library.png'],
  ['THE FENCE ARTIST','the_fence_artist.png'],
  ['THE MASK MARKET','the_mask_market.png'],
  ['THE RUST PARADE','the_rust_parade.png'],
  ['THE SHATTERED SILO','the_shattered_silo.png'],
  ['COUNTY WORK TRUCK','county_work_truck.png']
 ]);
 const base=new URL('../devtest/',document.baseURI);
 const regions=new URL('../assets/regions/',base);
 const scenario=file=>new URL('assets/scenarios/'+file,base).href;
 const regional=file=>new URL(file,regions).href;
 const canonical=()=>String(typeof currentEncounter==='function'?currentEncounter()?.title||'':'').toUpperCase().replace(/^EAST ROAD — /,'').trim();
 const fightSilo=()=>typeof combatState!=='undefined'&&combatState&&['combat','combatItems'].includes(typeof stage==='undefined'?'':stage)&&
  (combatState.r18SiloBoars===true||String(combatState.name||'').toUpperCase()==='SILO KING AND BOARS');
 // In the County encounter the depot exterior/interior is different art and MUST stay intact.
 const countyTruck=()=>typeof r18CountyTruckScene==='function'?
  !((r18CountyTruckScene()?.followed)&&player?.flags?.r18CountyMapSeen):true;
 function target(){
  const state=typeof stage==='undefined'?'':stage;
  if(fightSilo())return 'THE SHATTERED SILO';
  if(state!=='encounter')return null;
  const title=canonical();
  if(!scenes.has(title))return null;
  if(title==='COUNTY WORK TRUCK'&&!countyTruck())return null;
  return title;
 }
 const previousModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const model=previousModel.apply(this,args);
  const name=target();
  if(!name||!model?.active)return model;
  model.art=scenario(scenes.get(name));
  model.regionalSky=null;
  return model;
 };
 const style=document.createElement('style');style.id='r127-approved-sky-road-scenes';
 style.textContent=`
 .gfx-art.r127-approved-road{position:relative;isolation:isolate;background:#1b2530!important;overflow:hidden}
 .gfx-art.r127-approved-road>.r127-approved-sky,
 .gfx-art.r127-approved-road>.r127-approved-ground{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
 .gfx-art.r127-approved-road>.r127-approved-sky{z-index:0;background-position:center;background-size:cover;background-repeat:no-repeat}
 .gfx-art.r127-approved-road>.r127-approved-ground{z-index:1;object-fit:fill}
 .gfx-art.r127-approved-road>.gfx-image{position:relative;z-index:2;width:100%;height:100%;object-fit:contain;object-position:center;background:transparent!important}
 .gfx-art.r127-approved-road>.gfx-art-caption{position:relative;z-index:9}
 /* Hide legacy region/sky and duplicated Rust Parade overlay only for these approved scenes. */
 .gfx-art.r127-approved-road>.r127-bridge-toll-sky-layer,
 .gfx-art.r127-approved-road>.r127-enid-sky,
 .gfx-art.r127-approved-road>.r127-mask-market-sky,
 .gfx-art.r127-approved-road>.r127-silo-sky,
 .gfx-art.r127-approved-road>.r127-county-backdrop,
 .gfx-art.r127-approved-road>.r127-rust-parade,
 .gfx-art.r127-approved-road>.r127-regional-sky{display:none!important}
 /* Lighting must affect the ground, art and combat sprites, but not the sky. */
 .gfx-art.r127-approved-road[data-approved-period="dawn"]>.gfx-image,
 .gfx-art.r127-approved-road[data-approved-period="dawn"]>.r127-approved-ground{filter:brightness(.92) saturate(.91) sepia(.13)}
 .gfx-art.r127-approved-road[data-approved-period="dusk"]>.gfx-image,
 .gfx-art.r127-approved-road[data-approved-period="dusk"]>.r127-approved-ground{filter:brightness(.83) saturate(.88) sepia(.18)}
 .gfx-art.r127-approved-road[data-approved-period="night"]>.gfx-image,
 .gfx-art.r127-approved-road[data-approved-period="night"]>.r127-approved-ground{filter:brightness(.62) saturate(.68) sepia(.12) hue-rotate(165deg)}
 .gfx-art.r127-approved-road[data-approved-period="night"]>.r127-silo-boars img{filter:brightness(.64) saturate(.7) hue-rotate(165deg) drop-shadow(2px 7px 5px #000c)}
 .gfx-art.r127-approved-road[data-approved-period="dusk"]>.r127-silo-boars img{filter:brightness(.85) sepia(.16) drop-shadow(2px 7px 5px #000c)}
 `;
 document.head.append(style);
 const previousSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=previousSync.apply(this,args);
  try{
   const e=this.element;if(!e?.figure)return result;
   const fig=e.figure,which=target();
   const shown=!!which&&!e.frame.hidden&&!fig.hidden&&this.preference()==='graphics';
   fig.classList.toggle('r127-approved-road',shown);
   let sky=fig.querySelector(':scope > .r127-approved-sky');
   let road=fig.querySelector(':scope > .r127-approved-ground');
   if(!shown){
    sky?.remove();road?.remove();delete fig.dataset.approvedPeriod;
    return result;
   }
   if(!sky){sky=document.createElement('div');sky.className='r127-approved-sky';sky.setAttribute('aria-hidden','true');fig.insertBefore(sky,e.img);}
   if(!road){road=document.createElement('img');road.className='r127-approved-ground';road.src=regional('dirt_road_foreground.png');road.alt='';road.setAttribute('aria-hidden','true');road.draggable=false;fig.insertBefore(road,e.img);}
   const period=typeof Route127RegionalSky?.phase==='function'?Route127RegionalSky.phase(player.flags?.worldHour):'day';
   const skyFile=period==='dusk'?'sky_dawn.png':'sky_'+period+'.png';
   const skyUrl=regional(skyFile);
   // Match the approved lab preview. Only dusk needs a tint on its dawn sky.
   if(sky.dataset.file!==skyFile){sky.style.backgroundImage='url("'+skyUrl+'")';sky.dataset.file=skyFile;}
   sky.style.filter=period==='dusk'?'sepia(.42) hue-rotate(-18deg) saturate(1.4)':'';
   fig.dataset.approvedPeriod=period;
  }catch(error){console.warn('DEVTEST approved sky-road scenes:',error);}
  return result;
 };
 globalThis.Route127ApprovedRoadScenes=Object.freeze({titles:[...scenes.keys()]});
})();