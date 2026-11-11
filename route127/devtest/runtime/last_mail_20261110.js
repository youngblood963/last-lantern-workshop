/* DEVTEST — THE LAST MAIL: transparent postal truck over existing regional
   scenery and WO45 time-of-day skies. No changes to loot, letter odds,
   courier quest, rewards, world time, or turns. */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||
    !/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||
    typeof GraphicalUI==='undefined')return;
 const source=new URL('../devtest/assets/scenarios/the_last_mail.png',document.baseURI).href;
 const css=document.createElement('style');
 css.textContent=`
 .gfx-art .r127-last-mail{position:absolute;inset:0;z-index:5;pointer-events:none;
   display:flex;align-items:flex-end;justify-content:center;overflow:hidden}
 .gfx-art .r127-last-mail img{display:block;width:98%;height:98%;
   object-fit:contain;object-position:center bottom;filter:drop-shadow(3px 8px 5px #000a)}
 .gfx-art[data-sky-period="night"] .r127-last-mail img{
   filter:brightness(.65) saturate(.7) drop-shadow(3px 8px 5px #000c)}
 .gfx-art[data-sky-period="dawn"] .r127-last-mail img{
   filter:brightness(.9) sepia(.12) drop-shadow(3px 8px 5px #000a)}
 @media(max-width:650px){.gfx-art .r127-last-mail img{width:100%;height:96%}}
 `;
 document.head.append(css);
 const previous=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=previous.apply(this,args);
  try{
   const e=this.element;
   if(!e?.figure)return result;
   const active=!e.frame.hidden&&this.preference()==='graphics'&&!e.figure.hidden&&
     typeof stage!=='undefined'&&stage==='encounter'&&
     typeof currentEncounter==='function'&&currentEncounter()?.title==='THE LAST MAIL';
   let layer=e.figure.querySelector('.r127-last-mail');
   if(!active){layer?.remove();return result;}
   if(layer)return result;
   layer=document.createElement('div');layer.className='r127-last-mail';
   layer.setAttribute('aria-hidden','true');
   const img=document.createElement('img');img.src=source+'?v=last-mail-1';
   img.alt='';img.decoding='async';img.draggable=false;
   img.onerror=()=>{console.warn('Missing The Last Mail artwork:',source);layer.remove();};
   layer.append(img);e.figure.append(layer);
  }catch(err){console.warn('DEVTEST Last Mail artwork:',err);}
  return result;
 };
})();
