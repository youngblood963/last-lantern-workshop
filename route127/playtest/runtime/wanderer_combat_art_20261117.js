/* DEVTEST — Wanderer fights use their existing portraits with on-sprite HP.
 * Presentation-only; no changes to combat, retaliation, quests or save state.
 */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='PLAYTEST'||typeof GraphicalUI==='undefined')return;
const root=new URL('../devtest/assets/wanderers/',document.baseURI);
const portraits=globalThis.Route127WandererPortraitFiles||{};
const norm=s=>String(s||'').trim().toUpperCase();
function target(){
 const c=typeof combatState==='undefined'?null:combatState;
 if(!c||!['roadWanderer','townWanderer'].includes(c.source)
   ||(typeof stage!=='undefined'&&!['combat','combatItems'].includes(stage)))return null;
 const key=Object.keys(portraits).find(k=>norm(k)===norm(c.name));
 if(!key)return null;
 return {key,file:portraits[key],hp:Math.max(0,Number(c.hp)||0),
   max:Math.max(1,Number(c.maxHp)||Number(c.hp)||1)};
}
const css=document.createElement('style');css.id='r127-wanderer-combat-art-css';
css.textContent=`
.gfx-frame.r127-wanderer-combat-active .gfx-combat,
.gfx-frame.r127-wanderer-combat-active .gfx-main>.gfx-combat{display:none!important}
.gfx-art.r127-wanderer-combat-image{position:relative;isolation:isolate}
.gfx-art.r127-wanderer-combat-image>.r127-wanderer-combat-overlay{
 position:absolute;inset:0;z-index:8;display:flex;align-items:flex-end;justify-content:center;
 pointer-events:none;overflow:hidden;
}
.gfx-art.r127-wanderer-combat-image .r127-wanderer-combat-unit{
 position:relative;width:min(65%,390px);height:95%;border:0!important;
 background:transparent!important;box-shadow:none!important;padding:0!important;min-height:0!important;
 pointer-events:auto;cursor:pointer;color:#fff;display:flex;align-items:flex-end;justify-content:center;
}
.gfx-art.r127-wanderer-combat-image .r127-wanderer-combat-unit>img{
 height:100%;width:100%;max-width:100%;max-height:none;object-fit:contain;object-position:center bottom;
 filter:drop-shadow(4px 7px 6px #000c);
}
.gfx-art.r127-wanderer-combat-image .r127-wanderer-combat-hp{
 position:absolute;bottom:4%;left:50%;transform:translateX(-50%);z-index:2;
 border:1px solid #a33a30;border-radius:3px;padding:2px 7px;background:#260f0edb;
 font:700 clamp(11px,1.3vw,15px) sans-serif;color:#ffbbb2;white-space:nowrap;
}
.gfx-art.r127-wanderer-combat-image .r127-wanderer-combat-unit:is(:focus-visible,:hover){outline:2px solid #edc48a;outline-offset:-2px}
@media(max-width:600px){.gfx-art.r127-wanderer-combat-image .r127-wanderer-combat-unit{width:78%;height:90%}}
`;
document.head.append(css);
const priorSync=GraphicalUI.sync;
GraphicalUI.sync=function(...args){
 const result=priorSync.apply(this,args);
 try{
  const e=this.element;if(!e?.figure)return result;
  const t=!e.frame.hidden&&this.preference()==='graphics'?target():null;
  e.frame.classList.toggle('r127-wanderer-combat-active',!!t);
  e.figure.classList.toggle('r127-wanderer-combat-image',!!t);
  let layer=e.figure.querySelector(':scope > .r127-wanderer-combat-overlay');
  if(!t||t.hp<=0){layer?.remove();return result;}
  if(!layer||layer.dataset.character!==t.key){
   layer?.remove();
   layer=document.createElement('div');layer.className='r127-wanderer-combat-overlay';
   layer.dataset.character=t.key;
   const b=document.createElement('button');b.type='button';b.className='r127-wanderer-combat-unit';
   const img=document.createElement('img');img.alt='';img.src=new URL(t.file,root).href;
   img.onerror=()=>{img.dataset.failed='true';e.frame.classList.remove('r127-wanderer-combat-active');console.warn('Wanderer combat art failed:',t.file)};
   const hp=document.createElement('span');hp.className='r127-wanderer-combat-hp';
   b.append(img,hp);
   b.addEventListener('click',()=>{if(typeof busy!=='undefined'&&busy)return;
    if(typeof handleCommand==='function')handleCommand('attack');});
   layer.append(b);e.figure.append(layer);
  }
  const button=layer.querySelector('button');
  button.setAttribute('aria-label','Attack '+t.key+', '+t.hp+' of '+t.max+' HP');
  layer.querySelector('.r127-wanderer-combat-hp').textContent=t.hp+'/'+t.max+' HP';
 }catch(err){console.warn('Wanderer combat portrait:',err)}
 return result;
};
})();