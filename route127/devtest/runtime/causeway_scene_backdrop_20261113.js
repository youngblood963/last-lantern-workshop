/* DEVTEST ONLY — universal Causeway encounter artwork backdrop.
 * Cause: many scenario modules replace the regional base artwork with a
 * transparent scene prop (e.g. THE LOCKED TOOL CHEST), and clear regionalSky.
 * The Causeway is a VISUAL region only; encounter pools remain coastal.
 * Keep the existing scene's image and all specialized sky/road/sprite layers.
 * Never change scenario selection, turn costs, text, combat, saves or loot.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
 const root=new URL('../devtest/',document.baseURI);
 const regionBase=new URL('../assets/regions/',root);
 const causeway=new URL('causeway.png',regionBase).href;
 const sky=file=>new URL(file,regionBase).href;
 function eligible(){
  if(typeof stage==='undefined'||!['encounter','combat','combatItems'].includes(stage))return false;
  if(typeof route127CurrentRegion!=='function'||typeof lanternState!=='function')return false;
  if(route127CurrentRegion(lanternState())!=='CAUSEWAY')return false;
  // Scoped to road encounters. Do not cover standalone factory/town/quest scenes.
  if(['combat','combatItems'].includes(stage)){
   const source=typeof combatState==='undefined'?null:combatState?.source;
   if(source&&source!=='encounter')return false;
  }
  return true;
 }
 const style=document.createElement('style');style.id='r127-causeway-all-encounter-backdrops';
 style.textContent=`
 .gfx-art.r127-causeway-scene{position:relative;isolation:isolate;overflow:hidden}
 .gfx-art.r127-causeway-scene>.r127-causeway-scene-sky,
 .gfx-art.r127-causeway-scene>.r127-causeway-scene-base{
  position:absolute;inset:0;pointer-events:none;
  background-size:cover;background-position:center;background-repeat:no-repeat;
 }
 .gfx-art.r127-causeway-scene>.r127-causeway-scene-sky{z-index:0}
 /* The Causeway asset has a black/empty upper region. Show the time-of-day
    sky over the upper frame, and blend the bridge/sea into the lower frame. */
 .gfx-art.r127-causeway-scene>.r127-causeway-scene-base{
  z-index:1;mask-image:linear-gradient(to bottom,transparent 0%,transparent 28%,#000 58%,#000 100%);
  -webkit-mask-image:linear-gradient(to bottom,transparent 0%,transparent 28%,#000 58%,#000 100%);
 }
 .gfx-art.r127-causeway-scene>.gfx-image{position:relative;z-index:2;background:transparent!important;
  object-fit:contain!important;object-position:center center!important;
  transform:scale(.90)!important;transform-origin:center center!important}
 /* If the normal scene image is itself the Causeway background, don't draw
    it a second time at 90% scale over our full-bleed composite. */
 .gfx-art.r127-causeway-scene.r127-causeway-duplicate-base>.gfx-image{visibility:hidden!important}
 .gfx-art.r127-causeway-scene>.gfx-art-caption{z-index:9}
 /* Existing scene-specific backgrounds and combat sprites retain their layers.
    Never alter scene object-fit: the owners' approved layouts take precedence. */
 .gfx-art.r127-causeway-scene[data-causeway-period="dawn"]>.r127-causeway-scene-base{filter:brightness(.91) sepia(.12)}
 .gfx-art.r127-causeway-scene[data-causeway-period="dusk"]>.r127-causeway-scene-base{filter:brightness(.78) sepia(.22)}
 .gfx-art.r127-causeway-scene[data-causeway-period="night"]>.r127-causeway-scene-base{filter:brightness(.58) saturate(.72) hue-rotate(165deg)}
 .gfx-art.r127-causeway-scene[data-causeway-period="dusk"]>.r127-causeway-scene-sky{filter:sepia(.42) hue-rotate(-18deg) saturate(1.4)}
 `;
 document.head.append(style);
 const previousSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=previousSync.apply(this,args);
  try{
   const e=this.element;
   if(!e?.figure)return result;
   const figure=e.figure,enabled=!e.frame.hidden&&!figure.hidden&&this.preference()==='graphics'&&eligible();
   figure.classList.toggle('r127-causeway-scene',enabled);
   const imageUrl=e.img?.currentSrc||e.img?.src||'';
   const duplicate=enabled&&imageUrl.split(/[?#]/)[0]===causeway;
   figure.classList.toggle('r127-causeway-duplicate-base',duplicate);
   let layer=figure.querySelector(':scope > .r127-causeway-scene-base');
   let skyLayer=figure.querySelector(':scope > .r127-causeway-scene-sky');
   if(!enabled){
    layer?.remove();skyLayer?.remove();delete figure.dataset.causewayPeriod;return result;
   }
   if(!skyLayer){
    skyLayer=document.createElement('div');skyLayer.className='r127-causeway-scene-sky';
    skyLayer.setAttribute('aria-hidden','true');figure.insertBefore(skyLayer,e.img);
   }
   if(!layer){
    layer=document.createElement('div');
    layer.className='r127-causeway-scene-base';
    layer.setAttribute('aria-hidden','true');
    figure.insertBefore(layer,e.img);
   }
   if(layer.dataset.source!==causeway){
    layer.style.backgroundImage='url("'+causeway+'")';
    layer.dataset.source=causeway;
   }
   const hour=player?.flags?.worldHour;
   const phase=typeof Route127RegionalSky?.phase==='function'
    ?Route127RegionalSky.phase(hour):'day';
   const skyFile=phase==='dusk'?'sky_dawn.png':'sky_'+phase+'.png';
   if(skyLayer.dataset.file!==skyFile){
    skyLayer.style.backgroundImage='url("'+sky(skyFile)+'")';skyLayer.dataset.file=skyFile;
   }
   figure.dataset.causewayPeriod=phase;
  }catch(error){console.warn('DEVTEST Causeway scenario backdrop:',error);}
  return result;
 };
 globalThis.Route127CausewayScenarioBackdrop=Object.freeze({region:'CAUSEWAY',asset:causeway});
})();
