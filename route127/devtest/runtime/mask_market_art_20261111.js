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
 const artwork=new URL('../devtest/assets/scenarios/the_mask_market.webp',document.baseURI).href;
 const root=new URL('../../assets/regions/',document.currentScript.src);
 const sky=file=>new URL(file,root).href;
 const phase=hour=>globalThis.Route127RegionalSky?.phase
   ?Route127RegionalSky.phase(hour)
   :((h)=>h>=5&&h<7?'dawn':h>=7&&h<18?'day':h>=18&&h<20?'dusk':'night')(((Number(hour??8)%24)+24)%24);
 const visible=()=>typeof stage!=='undefined'&&stage==='encounter'&&
  typeof currentEncounter==='function'&&currentEncounter()?.title==='THE MASK MARKET';
 // A single request per asset, shared between revisits. Only start when needed.
 const assets=new Map();
 function asset(url){
  if(assets.has(url))return assets.get(url);
  const image=new Image(), state={status:'pending',image};
  assets.set(url,state);
  const finish=status=>{
   if(state.status!=='pending')return;
   clearTimeout(deadline);
   state.status=status;
   state.image=null;
   if(visible())GraphicalUI.schedule();
  };
  const deadline=setTimeout(()=>finish('failed'),15000);
  image.onerror=()=>finish('failed');
  image.onload=()=>typeof image.decode==='function'?
   image.decode().then(()=>finish('ready'),()=>finish('failed')):finish('ready');
  image.src=url;
  return state;
 }
 const sceneSky=()=>{const time=phase(player.flags?.worldHour);return sky('sky_'+(time==='dusk'?'day':time)+'.png');};
 function sceneState(){
  const states=[asset(artwork),asset(sceneSky())].map(entry=>entry.status);
  return states.includes('failed')?'failed':states.includes('pending')?'pending':'ready';
 }
 let statusTimer,showLoading=false,loadingScene;
 const oldModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const model=oldModel.apply(this,args);
  if(visible()&&model.active){
   model.title='THE MASK MARKET';
   if(sceneState()!=='ready')return model;
   model.art=artwork;
   model.causewayBacking=false;
   model.regionalSky=null;
  }
  return model;
 };
 const style=document.createElement('style');
 style.textContent=`
 .r127-market-art-status{position:absolute;top:8px;right:8px;z-index:7;background:#191510e8;color:#fff5df;padding:5px 8px;border-radius:4px;font-size:.8rem;pointer-events:none}
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
   const inScene=visible()&&!e.frame.hidden&&this.preference()==='graphics'&&!e.figure.hidden;
   const state=inScene?sceneState():null;
   const key=inScene?lanternState()?.sceneId||currentEncounter():null;
   if(key!==loadingScene||state!=='pending'){
    clearTimeout(statusTimer);statusTimer=null;showLoading=false;loadingScene=key;
   }
   if(state==='pending'&&!statusTimer&&!showLoading){
    statusTimer=setTimeout(()=>{
     statusTimer=null;showLoading=true;GraphicalUI.schedule();
    },400);
   }
   let status=e.figure.querySelector('.r127-market-art-status');
   const message=state==='failed'?'Scene artwork unavailable':state==='pending'&&showLoading?'Loading scene artwork…':'';
   if(message){
    if(!status){
     status=document.createElement('span');status.className='r127-market-art-status';
     status.setAttribute('role','status');e.figure.appendChild(status);
    }
    if(status.textContent!==message)status.textContent=message;
   }else status?.remove();
   const active=state==='ready';
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
