/* DEVTEST: The Hanging Shoes — single transparent clothesline over live regional art.
   Keeps existing encounter choices, regions, turns, rewards, and dynamic skies. */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||typeof GraphicalUI==='undefined')return;
 const src=new URL('../devtest/assets/scenarios/the_hanging_shoes.png',document.baseURI).href;
 const css=document.createElement('style');
 css.textContent=`
 .gfx-art .r127-hanging-shoes{position:absolute;inset:0;z-index:5;pointer-events:none;overflow:hidden;display:flex;align-items:flex-start}
 .gfx-art .r127-hanging-shoes img{display:block;width:100%;height:100%;object-fit:fill;filter:drop-shadow(2px 5px 3px #0008)}
 .gfx-art .r127-hanging-shoes[hidden]{display:none!important}
 `;
 document.head.append(css);
 const previous=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=previous.apply(this,args);
  try{
   const e=this.element;if(!e?.figure)return result;
   let layer=e.figure.querySelector('.r127-hanging-shoes');
   const active=!e.frame.hidden&&this.preference()==='graphics'&&typeof stage!=='undefined'&&stage==='encounter'
    &&typeof currentEncounter==='function'&&currentEncounter()?.title==='THE HANGING SHOES';
   if(!active){layer?.remove();return result;}
   if(!layer){
    layer=document.createElement('div');layer.className='r127-hanging-shoes';layer.setAttribute('aria-hidden','true');
    const img=document.createElement('img');img.src=src+'?v=shoes-1';img.alt='';img.decoding='async';
    img.onerror=()=>{console.warn('Missing Hanging Shoes transparent illustration:',src);layer.remove();};
    layer.append(img);e.figure.append(layer);
   }
   // Existing regional roadway and dynamic sky remain visible behind the transparent image.
  }catch(error){console.warn('Hanging Shoes art:',error);}
  return result;
 };
})();
