/* DEVTEST: Abandoned Sedan is a roadside foreground object, not a sky-only backdrop.
 * Use the current region's existing landscape/sky system behind its transparent art.
 * No encounter rules, layout manifest, saved state or global backgrounds changed.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
 const sedan=new URL('assets/scenarios/abandoned_sedan.png',new URL('../devtest/',document.baseURI)).href;
 const active=()=>typeof stage!=='undefined'&&stage==='encounter'&&
  String(typeof currentEncounter==='function'?currentEncounter()?.title||'':'').toUpperCase()==='ABANDONED SEDAN';
 const previousModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const model=previousModel.apply(this,args);
  if(!active()||!model?.active)return model;
  // Let the usual renderer select the region and time-of-day sky, rather than
  // treating the transparent vehicle itself as the whole background.
  const region=route127CurrentRegion(lanternState());
  const scene=Route127RegionalSky.describe(region,player.flags?.worldHour);
  if(scene){
   model.art=new URL(scene.original,new URL('assets/regions/',new URL('../devtest/',document.baseURI))).href;
   model.regionalSky=null;
   Route127RegionalSky.applyRegionalSky(model,region,player.flags?.worldHour);
  }
  return model;
 };
 const style=document.createElement('style');style.textContent=`
 .gfx-art.r127-sedan-regional{position:relative;isolation:isolate}
 .gfx-art.r127-sedan-regional>.r127-sedan-foreground{position:absolute;inset:0;width:100%;height:100%;
  object-fit:contain;object-position:center;z-index:4;pointer-events:none;background:transparent!important}
 .gfx-art.r127-sedan-regional>.gfx-art-caption{z-index:8}
 .gfx-art.r127-sedan-regional[data-sky-period="night"]>.r127-sedan-foreground{
  filter:brightness(.66) saturate(.75) sepia(.1) hue-rotate(165deg)}
 .gfx-art.r127-sedan-regional[data-sky-period="dusk"]>.r127-sedan-foreground{
  filter:brightness(.86) saturate(.9)}
 `;document.head.append(style);
 const previousSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=previousSync.apply(this,args);
  const figure=this.element?.figure;
  if(!figure)return result;
  const show=active()&&!this.element.frame.hidden&&!figure.hidden;
  figure.classList.toggle('r127-sedan-regional',show);
  let foreground=figure.querySelector(':scope > .r127-sedan-foreground');
  if(!show){foreground?.remove();return result;}
  if(!foreground){
   foreground=document.createElement('img');foreground.className='r127-sedan-foreground';
   foreground.src=sedan;foreground.alt='';foreground.draggable=false;
   foreground.setAttribute('aria-hidden','true');figure.insertBefore(foreground,this.element.caption);
  }
  return result;
 };
})();