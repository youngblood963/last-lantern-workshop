/* DEVTEST — THE FALSE SHOULDER
 * Approved animated full-scene GIF: yield sign, unstable asphalt, falling
 * debris. Visual only; leave all crossing odds, damage, XP, warning flags,
 * choices and saves managed by the original encounter.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||
    !/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||
    typeof GraphicalUI==='undefined')return;
 const animation=new URL('../devtest/assets/scenarios/the_false_shoulder.gif',document.baseURI).href;
 const active=()=>typeof stage!=='undefined'&&stage==='encounter'&&
   typeof currentEncounter==='function'&&currentEncounter()?.title==='THE FALSE SHOULDER';
 const oldModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const model=oldModel.apply(this,args);
  if(active()){
   model.art=animation;
   model.title='THE FALSE SHOULDER';
   // Animated scene already contains road, sky, dust and falling debris.
   model.regionalSky=null;
  }
  return model;
 };
 const style=document.createElement('style');
 style.textContent=`
 .gfx-art.r127-false-shoulder{background:#261d19!important}
 .gfx-art.r127-false-shoulder>.gfx-image{
  position:relative;z-index:1;width:100%;height:100%;
  object-fit:contain;object-position:center;background:transparent!important}
 .gfx-art.r127-false-shoulder>.gfx-art-caption{z-index:2}
 `;
 document.head.append(style);
 const oldSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=oldSync.apply(this,args);
  try{
   const e=this.element;if(!e?.figure)return result;
   e.figure.classList.toggle('r127-false-shoulder',
     active()&&!e.frame.hidden&&this.preference()==='graphics'&&!e.figure.hidden);
  }catch(err){console.warn('False Shoulder animation:',err);}
  return result;
 };
 GraphicalUI.schedule();
})();
