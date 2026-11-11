/* DEVTEST — THE RUST PARADE
 * Display the approved transparent parade artwork over existing regional
 * roadway imagery and WO45 dynamic skies in Central, West, or East.
 * No encounter/choice/reward/turn/save changes. */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||
    !/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||
    typeof GraphicalUI==='undefined')return;
 const source=new URL('../devtest/assets/scenarios/the_rust_parade.png',document.baseURI).href;
 const css=document.createElement('style');
 css.textContent=`
 .gfx-art .r127-rust-parade{
  position:absolute;inset:0;z-index:5;pointer-events:none;
  display:flex;justify-content:center;align-items:flex-end;overflow:hidden;
 }
 .gfx-art .r127-rust-parade img{
  display:block;max-width:99%;width:100%;height:98%;
  object-fit:contain;object-position:center bottom;
  filter:drop-shadow(3px 7px 5px #0009);
 }
 .gfx-art[data-sky-period="dawn"] .r127-rust-parade img{
  filter:brightness(.92) sepia(.12) drop-shadow(3px 7px 5px #000a);
 }
 .gfx-art[data-sky-period="night"] .r127-rust-parade img{
  filter:brightness(.64) saturate(.7) drop-shadow(3px 7px 5px #000b);
 }
 @media(max-width:650px){.gfx-art .r127-rust-parade img{max-width:100%;height:95%}}
 `;
 document.head.append(css);
 const oldSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=oldSync.apply(this,args);
  try{
   const e=this.element;
   if(!e?.figure)return result;
   const shown=!e.frame.hidden&&this.preference()==='graphics'&&!e.figure.hidden&&
     typeof stage!=='undefined'&&stage==='encounter'&&
     typeof currentEncounter==='function'&&currentEncounter()?.title==='THE RUST PARADE';
   let layer=e.figure.querySelector('.r127-rust-parade');
   if(!shown){layer?.remove();return result;}
   if(layer)return result;
   layer=document.createElement('div');
   layer.className='r127-rust-parade';
   layer.setAttribute('aria-hidden','true');
   const img=document.createElement('img');
   img.src=source+'?v=rust-parade-1';img.alt='';img.decoding='async';img.draggable=false;
   img.onerror=()=>{console.warn('Missing Rust Parade transparent art:',source);layer.remove();};
   layer.append(img);e.figure.append(layer);
  }catch(error){console.warn('DEVTEST Rust Parade art:',error);}
  return result;
 };
})();
