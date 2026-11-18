/* DEVTEST — Seaport liberation fishermen artwork.
 * Keep the occupied harbor environment and existing live combat HP display.
 * Presentation only: no combat, quest, save, or encounter-state changes.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
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
  if(!shown){sprite?.remove();return result;}
  if(!sprite){
   sprite=document.createElement('img');
   sprite.className='r127-fishermen-sprite';
   sprite.src=url;
   sprite.alt='';
   sprite.draggable=false;
   sprite.setAttribute('aria-hidden','true');
   figure.insertBefore(sprite,this.element.caption||null);
  }
  return result;
 };
})();