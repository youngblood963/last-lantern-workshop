/* DEVTEST: Miles the Courier portrait, for his Global road encounter and
   scheduled Solace/Seaport conversations. Visual-only: no quest state, courier
   rewards, daily rotation, dialogue, or turn changes. */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||
    !/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||
    typeof GraphicalUI==='undefined')return;
 const src=new URL('../devtest/assets/scenarios/miles_the_courier.png',document.baseURI).href;
 const scene=()=>{
   if(typeof stage==='undefined'||typeof combatState!=='undefined'&&combatState)return null;
   if(stage==='encounter'&&typeof currentEncounter==='function'&&
      currentEncounter()?.title==='MILES THE COURIER')return 'road';
   if(stage==='r18Miles'){
     const place=typeof player!=='undefined'?player.flags?.r18MilesVisit?.place:null;
     if(place==='solace'||place==='seaport')return place;
   }
   return null;
 };
 const oldModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
   const model=oldModel.apply(this,args);
   const place=scene();
   // Conversations initiated in a town are drawn over its own location,
   // not the last road-region illustration.
   if(place==='solace'||place==='seaport'){
     model.art='assets/locations/'+place+'.png';
     model.title='MILES “POSTMAN” CARTER';
     model.regionalSky=null;
   }else if(place==='road'){
     model.title='MILES THE COURIER';
     // The unchanged region art lets WO45 provide its dawn/day/night skies.
   }
   return model;
 };
 const style=document.createElement('style');
 style.textContent=`
 .gfx-art .r127-miles-courier{position:absolute;inset:0;z-index:5;
   pointer-events:none;display:flex;align-items:flex-end;justify-content:center;overflow:hidden}
 .gfx-art .r127-miles-courier img{display:block;height:96%;max-width:78%;width:auto;
   object-fit:contain;object-position:center bottom;filter:drop-shadow(4px 7px 6px #000b)}
 .gfx-art[data-sky-period="night"] .r127-miles-courier img{
   filter:brightness(.65) saturate(.7) drop-shadow(4px 7px 6px #000c)}
 .gfx-art[data-sky-period="dawn"] .r127-miles-courier img{
   filter:brightness(.9) sepia(.12) drop-shadow(4px 7px 6px #000b)}
 @media(max-width:650px){.gfx-art .r127-miles-courier img{height:94%;max-width:92%}}
 `;
 document.head.append(style);
 const oldSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
   const result=oldSync.apply(this,args);
   try{
     const e=this.element;
     if(!e?.figure)return result;
     const place=scene();
     const visible=!!place&&!e.frame.hidden&&this.preference()==='graphics'&&!e.figure.hidden;
     let layer=e.figure.querySelector('.r127-miles-courier');
     if(!visible){layer?.remove();return result;}
     if(layer)return result;
     layer=document.createElement('div');layer.className='r127-miles-courier';
     layer.setAttribute('aria-hidden','true');
     const img=document.createElement('img');
     img.src=src+'?v=miles-1';img.alt='';img.decoding='async';img.draggable=false;
     img.onerror=()=>{console.warn('Miles portrait image missing:',src);layer.remove();};
     layer.append(img);e.figure.append(layer);
   }catch(err){console.warn('DEVTEST Miles artwork:',err);}
   return result;
 };
 globalThis.Route127MilesArtwork=Object.freeze({src});
})();
