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
 .gfx-art.r127-causeway-scene>.r127-causeway-scene-base{
  position:absolute;inset:0;z-index:0;pointer-events:none;
  background-size:cover;background-position:center;background-repeat:no-repeat;
 }
 .gfx-art.r127-causeway-scene>.gfx-image{position:relative;z-index:2;background:transparent!important}
 .gfx-art.r127-causeway-scene>.gfx-art-caption{position:relative;z-index:9}
 /* Existing scene-specific backgrounds and combat sprites retain their layers.
    Never alter scene object-fit: the owners' approved layouts take precedence. */
 .gfx-art.r127-causeway-scene[data-causeway-period="dawn"]>.r127-causeway-scene-base{filter:brightness(.91) sepia(.12)}
 .gfx-art.r127-causeway-scene[data-causeway-period="dusk"]>.r127-causeway-scene-base{filter:brightness(.78) sepia(.22)}
 .gfx-art.r127-causeway-scene[data-causeway-period="night"]>.r127-causeway-scene-base{filter:brightness(.58) saturate(.72) hue-rotate(165deg)}
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
   let layer=figure.querySelector(':scope > .r127-causeway-scene-base');
   if(!enabled){
    layer?.remove();delete figure.dataset.causewayPeriod;return result;
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
   figure.dataset.causewayPeriod=typeof Route127RegionalSky?.phase==='function'
    ?Route127RegionalSky.phase(hour):'day';
  }catch(error){console.warn('DEVTEST Causeway scenario backdrop:',error);}
  return result;
 };
 globalThis.Route127CausewayScenarioBackdrop=Object.freeze({region:'CAUSEWAY',asset:causeway});
})();
