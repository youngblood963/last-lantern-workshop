/* Luna DEVTEST map dressing. Decoration only; never edits navigation geometry. */
(()=>{
 'use strict';
 if(!location.pathname.startsWith('/route127/devtest/'))return;
 const overlay=typeof Route127MapOverlay!=='undefined'?Route127MapOverlay:globalThis.Route127MapOverlay;
 if(!overlay||typeof overlay.open!=='function')return;
 const original=overlay.open;
 overlay.open=function(...args){
   const result=original.apply(this,args);
   const fig=this.dialog?.querySelector('.lantern-map');
   if(!fig||fig.querySelector('.route127-map-fieldnote'))return result;
   const note=document.createElement('div');
   note.className='route127-map-fieldnote';
   note.setAttribute('aria-hidden','true');
   note.innerHTML='<span class="route127-map-fieldnote__eyebrow">FIELD NOTES · 127</span><span class="route127-map-fieldnote__line"></span><span>OLD ROADS</span><span>NEW DANGERS</span><span class="route127-map-fieldnote__stamp">SURVIVE<br>THE ROAD</span>';
   fig.append(note);
   return result;
 };
})();