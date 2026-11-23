/* DEVTEST — Seaport liberation fishermen artwork.
 * Keep the occupied harbor environment and display live HP beneath the fishermen artwork.
 * Presentation only: no combat, quest, save, or encounter-state changes.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='PLAYTEST'||typeof GraphicalUI==='undefined')return;
 const url=new URL('assets/quests/fishermen_enforcers.png',new URL('../devtest/',document.baseURI)).href;
 const inFight=()=>typeof combatState!=='undefined'&&combatState?.source==='seaportLiberation'&&
  ['combat','combatItems'].includes(stage);
 const style=document.createElement('style');
 style.id='r127-fishermen-enforcers-art';
 style.textContent=`
 .gfx-art.r127-fishermen-fight{position:relative;isolation:isolate;overflow:hidden}
 .gfx-art.r127-fishermen-fight>.r127-fishermen-sprite{
  position:absolute;inset:0;width:100%;height:100%;
  object-fit:contain;object-position:center bottom;
  z-index:4;pointer-events:none;background:transparent!important;
  filter:drop-shadow(2px 7px 7px #000b)
 }
 .gfx-frame.r127-fishermen-hp-ready .gfx-main>.gfx-combat{display:none!important}
 .r127-fishermen-hp{
  position:absolute;z-index:8;bottom:5%;left:50%;transform:translateX(-50%);
  white-space:nowrap;color:#ffaaa4;background:#32100e;border:1px solid #aa413b;
  border-radius:4px;padding:3px 6px;font:700 clamp(10px,1.5vw,18px)/1.15 sans-serif;
  pointer-events:none
 }
 .gfx-art.r127-fishermen-fight>.gfx-art-caption{z-index:9}
 .gfx-art.r127-fishermen-fight[data-sky-period="night"]>.r127-fishermen-sprite{
  filter:brightness(.67) saturate(.78) drop-shadow(2px 7px 7px #000c)
 }
 `;
 document.head.append(style);
 const previousSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=previousSync.apply(this,args);
  const figure=this.element?.figure;
  if(!figure)return result;
  const shown=!!inFight()&&this.active()&&!this.element.frame.hidden&&!figure.hidden;
  figure.classList.toggle('r127-fishermen-fight',shown);
  let sprite=figure.querySelector(':scope > .r127-fishermen-sprite');
  let hp=figure.querySelector(':scope > .r127-fishermen-hp');
  if(!shown){
   sprite?.remove();
   hp?.remove();
   this.element.frame.classList.remove('r127-fishermen-hp-ready');
   return result;
  }
  if(!sprite){
   sprite=document.createElement('img');
   sprite.className='r127-fishermen-sprite';
   sprite.addEventListener('load',()=>GraphicalUI.schedule());
   sprite.src=url;
   sprite.alt='';
   sprite.draggable=false;
   sprite.setAttribute('aria-hidden','true');
   figure.insertBefore(sprite,this.element.caption||null);
  }
  if(!hp){
   hp=this.node('span','r127-fishermen-hp');
   figure.insertBefore(hp,this.element.caption||null);
  }
  const ready=sprite.complete&&sprite.naturalWidth>0;
  hp.hidden=!ready;
  hp.textContent=combatState.hp+' / '+combatState.maxHp+' HP';
  this.element.frame.classList.toggle('r127-fishermen-hp-ready',ready);
  return result;
 };
})();