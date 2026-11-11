/* DEVTEST — THE CAROUSEL HORSE: single transparent horse over regional roadway
   and WO45 dynamic sky. Visual only; preserve encounter logic and rewards. */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||
    !/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||
    typeof GraphicalUI==='undefined')return;
 const artwork=new URL('../devtest/assets/scenarios/the_carousel_horse.png',document.baseURI).href;
 const css=document.createElement('style');
 css.textContent=`
 .gfx-art .r127-carousel-horse{position:absolute;inset:0;z-index:5;pointer-events:none;display:flex;align-items:flex-end;justify-content:center;overflow:hidden}
 .gfx-art .r127-carousel-horse img{display:block;width:auto;height:84%;max-width:80%;object-fit:contain;object-position:center bottom;filter:drop-shadow(3px 8px 5px #0009)}
 .gfx-art[data-sky-period="night"] .r127-carousel-horse img{filter:brightness(.64) saturate(.7) drop-shadow(3px 8px 5px #000b)}
 .gfx-art[data-sky-period="dusk"] .r127-carousel-horse img{filter:brightness(.85) sepia(.1) drop-shadow(3px 8px 5px #000a)}
 @media(max-width:650px){.gfx-art .r127-carousel-horse img{height:81%;max-width:85%}}
 `;
 document.head.append(css);
 const original=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=original.apply(this,args);
  try{
   const e=this.element;if(!e?.figure)return result;
   const shown=!e.frame.hidden&&this.preference()==='graphics'&&
    typeof stage!=='undefined'&&stage==='encounter'&&
    typeof currentEncounter==='function'&&currentEncounter()?.title==='THE CAROUSEL HORSE';
   let layer=e.figure.querySelector('.r127-carousel-horse');
   if(!shown){layer?.remove();return result;}
   if(layer)return result;
   layer=document.createElement('div');layer.className='r127-carousel-horse';
   layer.setAttribute('aria-hidden','true');
   const img=document.createElement('img');
   img.src=artwork+'?v=carousel-1';img.alt='';img.decoding='async';img.draggable=false;
   img.onerror=()=>{console.warn('Missing Carousel Horse art:',artwork);layer.remove();};
   layer.append(img);e.figure.append(layer);
  }catch(error){console.warn('Carousel Horse artwork:',error);}
  return result;
 };
})();
