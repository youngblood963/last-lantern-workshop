/* DEVTEST — THE MASK MARKET
 * Approved transparent stall atop the existing WO45 time-of-day skies.
 * Global encounter; keeps all silent trading choices, prices, discounts,
 * confirmation, item rewards and saves unchanged.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||
    !/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||
    typeof GraphicalUI==='undefined')return;
 const artwork=new URL('../devtest/assets/scenarios/the_mask_market.png',document.baseURI).href;
 const root=new URL('../../assets/regions/',document.currentScript.src);
 const sky=file=>new URL(file,root).href;
 const phase=hour=>globalThis.Route127RegionalSky?.phase
   ?Route127RegionalSky.phase(hour)
   :((h)=>h>=5&&h<7?'dawn':h>=7&&h<18?'day':h>=18&&h<20?'dusk':'night')(((Number(hour??8)%24)+24)%24);
 const visible=()=>typeof stage!=='undefined'&&stage==='encounter'&&
  typeof currentEncounter==='function'&&currentEncounter()?.title==='THE MASK MARKET';
 const oldModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const model=oldModel.apply(this,args);
  if(visible()){
   model.art=artwork;
   model.title='THE MASK MARKET';
   model.regionalSky=null;
  }
  return model;
 };
 const style=document.createElement('style');
 style.textContent=`
 .gfx-art.r127-mask-market{position:relative;isolation:isolate;background:#1c1916!important}
 .gfx-art.r127-mask-market>.r127-mask-market-sky{
  position:absolute;inset:0;z-index:0;pointer-events:none;background-size:cover;background-position:center}
 .gfx-art.r127-mask-market>.gfx-image{
  position:relative;z-index:1;width:100%;height:100%;object-fit:contain;object-position:center bottom;background:transparent!important}
 .gfx-art.r127-mask-market>.gfx-art-caption{z-index:6}
 .gfx-art.r127-mask-market[data-mask-period="night"]>.gfx-image{
  filter:brightness(.65) saturate(.7) hue-rotate(165deg)}
 .gfx-art.r127-mask-market[data-mask-period="dawn"]>.gfx-image{
  filter:brightness(.90) sepia(.15)}
 .gfx-art.r127-mask-market[data-mask-period="dusk"]>.gfx-image{
  filter:brightness(.81) sepia(.17)}
 .gfx-art.r127-mask-market[data-mask-period="dusk"]>.r127-mask-market-sky{
  filter:brightness(.62) sepia(.65) saturate(1.3)}
 `;
 document.head.append(style);
 const oldSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=oldSync.apply(this,args);
  try{
   const e=this.element;if(!e?.figure)return result;
   const active=visible()&&!e.frame.hidden&&this.preference()==='graphics'&&!e.figure.hidden;
   e.figure.classList.toggle('r127-mask-market',active);
   let layer=e.figure.querySelector('.r127-mask-market-sky');
   if(!active){layer?.remove();delete e.figure.dataset.maskPeriod;return result;}
   if(!layer){
    layer=document.createElement('div');layer.className='r127-mask-market-sky';
    layer.setAttribute('aria-hidden','true');e.figure.insertBefore(layer,e.img);
   }
   const time=phase(player.flags?.worldHour);
   // No separate WO45 dusk sky asset. Tint the day sky for a clear horizon
   // rather than placing random regional cars/buildings behind the stall.
   layer.style.backgroundImage='url("'+sky('sky_'+(time==='dusk'?'day':time)+'.png')+'")';
   e.figure.dataset.maskPeriod=time;
  }catch(error){console.warn('Mask Market artwork:',error);}
  return result;
 };
 GraphicalUI.schedule();
})();
