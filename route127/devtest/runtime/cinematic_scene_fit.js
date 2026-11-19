/* DEVTEST full-scene fit. Keep the authored image intact above a muted edge fill. */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;

 const fullScenes=new Set(['daniel_factory_captors.png','seaport_liberation.png','the_scrap_duel.png']);
 // The visual-testing catalog already distinguishes full paintings from sky,
 // terrain and transparent prop compositions. Reuse those classifications.
 for(const row of Route127CombatLayouts.rows.values()){
  for(const variant of row.variants){
   if(variant.background&&(row.fullCinematic||variant.variant==='Full bunker interior'))
    fullScenes.add(Route127CombatLayouts.assetName(variant.background));
  }
 }
 function fill(container,source){
  container.classList.toggle('r127-cinematic-fill',!!source);
  if(source)container.style.setProperty('--r127-cinematic-image','url('+JSON.stringify(source)+')');
  else container.style.removeProperty('--r127-cinematic-image');
 }
 const sync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=sync.apply(this,args);
  const {figure,img,frame}=this.element||{};
  if(figure){
   const source=img?.getAttribute('src');
   const eligible=source&&!frame.hidden&&!figure.hidden&&!img.hidden&&
    fullScenes.has(Route127CombatLayouts.assetName(source));
   fill(figure,eligible?img.src:null);
  }
  // The terminal composites characters independently; apply edge fill to
  // its outer frame using only the actual room or HQ background layer.
  const visual=document.querySelector('.tomorrow-visual');
  if(visual){
   const base=visual.querySelector('.tomorrow-background');
   fill(visual,!visual.hidden&&!base?.hidden?base?.src:null);
  }
  return result;
 };
})();
