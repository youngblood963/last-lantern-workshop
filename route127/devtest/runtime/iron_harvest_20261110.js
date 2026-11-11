/* DEVTEST: Iron Harvest encounter — one transparent combine over existing WO45 skies.
   Visual-only. Preserve authored encounter decisions, 3-target combat, and rewards. */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||typeof GraphicalUI==='undefined')return;
 const image=new URL('../devtest/assets/scenarios/the_iron_harvest.png',document.baseURI).href;
 const skyBase=new URL('../../assets/regions/',document.currentScript.src);
 const skyUrl=file=>new URL(file,skyBase).href;
 const phase=hour=>typeof Route127RegionalSky?.phase==='function'?Route127RegionalSky.phase(hour):
  ((h)=>h>=5&&h<7?'dawn':h>=7&&h<18?'day':h>=18&&h<20?'dusk':'night')(((Number(hour??8)%24)+24)%24);
 const harvest=()=>{
  if(typeof stage==='undefined')return false;
  if(stage==='encounter'&&typeof currentEncounter==='function')
   return currentEncounter()?.title==='THE IRON HARVEST';
  return ['combat','combatItems'].includes(stage)&&typeof combatState!=='undefined'&&
   (combatState?.r18HarvestMachine===true||combatState?.name==='DRIVERLESS COMBINE');
 };
 const prevModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const m=prevModel.apply(this,args);
  if(harvest()&&m.active){m.art=image;m.title='THE IRON HARVEST';m.regionalSky=null;}
  return m;
 };
 const style=document.createElement('style');
 style.textContent=`
 .gfx-art.r127-iron-harvest{background:#333!important;isolation:isolate}
 .gfx-art.r127-iron-harvest>.r127-harvest-sky{position:absolute;inset:0;z-index:0;pointer-events:none;background-position:center;background-size:cover}
 .gfx-art.r127-iron-harvest>.gfx-image{position:relative;z-index:1;width:100%;height:100%;object-fit:contain;object-position:center bottom;background:transparent!important}
 .gfx-art.r127-iron-harvest>.gfx-art-caption{z-index:6}
 .gfx-art.r127-iron-harvest[data-harvest-period="night"]>.gfx-image{filter:brightness(.64) saturate(.65) hue-rotate(165deg)}
 .gfx-art.r127-iron-harvest[data-harvest-period="dawn"]>.gfx-image{filter:brightness(.9) saturate(.9) sepia(.16)}
 .gfx-art.r127-iron-harvest[data-harvest-period="day"]>.gfx-image{filter:brightness(1.03)}
 `;
 document.head.append(style);
 const prevSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=prevSync.apply(this,args);
  try{
   const e=this.element;if(!e?.figure)return result;
   const active=harvest()&&!e.frame.hidden&&this.preference()==='graphics'&&!e.figure.hidden;
   let backdrop=e.figure.querySelector('.r127-harvest-sky');
   e.figure.classList.toggle('r127-iron-harvest',active);
   if(!active){backdrop?.remove();delete e.figure.dataset.harvestPeriod;return result;}
   if(!backdrop){backdrop=document.createElement('div');backdrop.className='r127-harvest-sky';backdrop.setAttribute('aria-hidden','true');e.figure.insertBefore(backdrop,e.img);}
   const period=phase(player.flags?.worldHour);
   const region=typeof route127CurrentRegion==='function'?route127CurrentRegion(lanternState()):'CENTRAL';
   // WO45's dusk shows original painted scenery; other times use its shared sky paintings.
   const file=period==='dusk'?(region==='EAST'?'east.png':'central.png'):'sky_'+period+'.png';
   backdrop.style.backgroundImage='url("'+skyUrl(file)+'")';
   e.figure.dataset.harvestPeriod=period;
  }catch(err){console.warn('DEVTEST Iron Harvest presentation:',err);}
  return result;
 };
})();
