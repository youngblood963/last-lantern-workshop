/* DEVTEST — THE PAPER STORM
 * Animated GIF is the complete encounter artwork; do not add the regional
 * sky/road overlay. Keep original investigation, wanted poster, and loot.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||typeof GraphicalUI==='undefined')return;
 const art=new URL('../devtest/assets/scenarios/the_paper_storm.gif',document.baseURI).href;
 const oldModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const model=oldModel.apply(this,args);
  if(typeof stage==='undefined'||stage!=='encounter'||typeof currentEncounter!=='function'||currentEncounter()?.title!=='THE PAPER STORM')return model;
  model.art=art;
  model.title='THE PAPER STORM';
  // This GIF includes its own complete landscape and does not need WO45 sky.
  model.regionalSky=null;
  return model;
 };
 const css=document.createElement('style');
 css.textContent=`
 .gfx-art.r127-paper-storm>.gfx-image{
  position:relative;z-index:1;width:100%;height:100%;object-fit:contain;
  object-position:center;background:transparent!important}
 .gfx-art.r127-paper-storm>.gfx-art-caption{z-index:2}
 .gfx-art.r127-paper-storm{background:#241d18!important}
 `;
 document.head.append(css);
 const oldSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=oldSync.apply(this,args);
  try{
   const e=this.element;if(!e?.figure)return result;
   const active=!e.frame.hidden&&this.preference()==='graphics'&&typeof stage!=='undefined'&&stage==='encounter'&&
    typeof currentEncounter==='function'&&currentEncounter()?.title==='THE PAPER STORM';
   e.figure.classList.toggle('r127-paper-storm',active);
  }catch(err){console.warn('Paper Storm scene:',err);}
  return result;
 };
 GraphicalUI.schedule();
})();