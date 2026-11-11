/* DEVTEST — The Silent Picnic: transparent pedestal chessboard over the existing
   Central/West regional background and WO45 dawn/day/dusk/night skies.
   Visual-only: chess puzzle, turn, loot and rewards stay authoritative. */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||typeof GraphicalUI==='undefined')return;
 const artwork=new URL('../devtest/assets/scenarios/the_silent_picnic.png',document.baseURI).href;
 const css=document.createElement('style');
 css.textContent=`
 .gfx-art .r127-silent-picnic{position:absolute;inset:0;z-index:5;pointer-events:none;display:flex;justify-content:center;align-items:flex-end;overflow:hidden}
 .gfx-art .r127-silent-picnic img{display:block;height:96%;max-width:92%;width:auto;object-fit:contain;object-position:center bottom;filter:drop-shadow(3px 9px 5px #000a)}
 .gfx-art .r127-silent-picnic[hidden]{display:none!important}
 .gfx-art[data-sky-period="night"] .r127-silent-picnic img{filter:brightness(.64) saturate(.65) drop-shadow(3px 9px 5px #000b)}
 .gfx-art[data-sky-period="dusk"] .r127-silent-picnic img{filter:brightness(.82) sepia(.15) drop-shadow(3px 9px 5px #000a)}
 @media(max-width:650px){.gfx-art .r127-silent-picnic img{height:93%;max-width:95%}}
 `;
 document.head.append(css);
 const oldSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=oldSync.apply(this,args);
  try{
   const e=this.element;
   if(!e?.figure)return result;
   const shown=!e.frame.hidden&&this.preference()==='graphics'&&
    typeof stage!=='undefined'&&stage==='encounter'&&
    typeof currentEncounter==='function'&&currentEncounter()?.title==='THE SILENT PICNIC';
   let layer=e.figure.querySelector('.r127-silent-picnic');
   if(!shown){layer?.remove();return result;}
   if(layer)return result;
   layer=document.createElement('div');layer.className='r127-silent-picnic';
   layer.setAttribute('aria-hidden','true');
   const img=document.createElement('img');img.src=artwork+'?v=picnic-1';img.alt='';
   img.decoding='async';img.draggable=false;
   img.onerror=()=>{console.warn('Missing Silent Picnic chessboard:',artwork);layer.remove();};
   layer.append(img);e.figure.append(layer);
  }catch(error){console.warn('Silent Picnic artwork:',error);}
  return result;
 };
})();
