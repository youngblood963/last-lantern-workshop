/* DEVTEST: keep cinematic backdrops inside the already-approved foreground.
 * Measure only. Never write artwork positions, sizes, transforms, or saved layouts. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
const layers='.r127-regional-sky,.r127-regional-ground,.r127-demo-sky,.r127-demo-road,.r127-finish-sky,.r127-finish-ground,.r127-approved-sky,.r127-approved-ground,.r127-new-sky,.r127-shipwreck-sky,.r127-final-road';
const regional=src=>/\/assets\/regions\//.test(String(src||''));
function cinematic(model){
 if(!model?.active||regional(model.art))return false;
 if(model.scenarioBackdrop)return ['sky','road','none','standalone'].includes(model.scenarioBackdrop.mode);
 const active=globalThis.Route127CombatLayouts?.activeScene(),row=active&&Route127CombatLayouts.rows.get(active.id);
 if(!row)return false;
 return row.variants.some(v=>v.background&&!regional(v.background)&&v.composition!=='regional');
}
function contain(rect,naturalWidth,naturalHeight){
 if(!rect.width||!rect.height||!naturalWidth||!naturalHeight)return null;
 const scale=Math.min(rect.width/naturalWidth,rect.height/naturalHeight),width=naturalWidth*scale,height=naturalHeight*scale;
 return {left:rect.left+(rect.width-width)/2,top:rect.top+(rect.height-height)/2,right:rect.left+(rect.width+width)/2,bottom:rect.top+(rect.height+height)/2,width,height};
}
function inset(bounds,rect){return [Math.max(0,bounds.top-rect.top),Math.max(0,rect.right-bounds.right),Math.max(0,rect.bottom-bounds.bottom),Math.max(0,bounds.left-rect.left)].map(n=>Math.round(n*100)/100+'px').join(' ');}
const previous=new Map();let figure=null,image=null,observer=null;
function reset(){for(const [node,clip]of previous){if(clip)node.style.clipPath=clip;else node.style.removeProperty('clip-path');}previous.clear();figure?.classList.remove('r127-cinematic-margins');}
function apply(){
 const e=GraphicalUI.element,m=e&&GraphicalUI.model();
 if(!e?.figure||!e.img||!cinematic(m)||e.img.hidden||!e.img.naturalWidth||!GraphicalUI.displaysArtwork(m.art)){reset();return;}
 const bounds=contain(e.img.getBoundingClientRect(),e.img.naturalWidth,e.img.naturalHeight);if(!bounds){reset();return;}
 figure=e.figure;figure.classList.add('r127-cinematic-margins');
 const current=new Set(figure.querySelectorAll(layers));
 for(const [node,clip]of previous)if(!current.has(node)){if(clip)node.style.clipPath=clip;else node.style.removeProperty('clip-path');previous.delete(node);}
 for(const node of current){
  const rect=node.getBoundingClientRect();if(!rect.width||!rect.height)continue;
  if(!previous.has(node))previous.set(node,node.style.clipPath||'');
  node.style.clipPath='inset('+inset(bounds,rect)+')';
 }
}
function watch(){
 const e=GraphicalUI.element;if(!e?.figure||!e.img)return;
 if(image===e.img)return;
 observer?.disconnect();image?.removeEventListener('load',apply);reset();figure=e.figure;image=e.img;image.addEventListener('load',apply);
 if(typeof ResizeObserver==='function'){observer=new ResizeObserver(apply);observer.observe(figure);observer.observe(image);}
}
const sync=GraphicalUI.sync;
GraphicalUI.sync=function(...args){const result=sync.apply(this,args);watch();apply();return result;};
const style=document.createElement('style');style.textContent='.gfx-art.r127-cinematic-margins{background:#191a1b!important}';document.head.append(style);
globalThis.Route127CinematicBounds=Object.freeze({cinematic,contain,inset,apply});
})();
