/* DEVTEST — make post-combat rewards readable without scrolling through
 * location narration. Presentation-only: no combat, XP, loot, save or menu edits.
 */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
const style=document.createElement('style');
style.textContent=`
.r127-last-combat{box-sizing:border-box;position:relative;z-index:5;
 width:100%;flex:none;background:#16100beF;border:1px solid #c18a4d;
 box-shadow:inset 0 0 0 1px #0009;color:#f6d6a8;padding:8px 42px 8px 12px;
 font:12px/1.45 Georgia,serif;max-height:106px;overflow:auto}
.r127-last-combat strong{color:#ffcf87;display:block;letter-spacing:.08em;font-size:13px}
.r127-last-combat .r127-last-combat-line{display:block;white-space:normal}
.r127-last-combat button{position:absolute;right:6px;top:6px;cursor:pointer;
 color:#efd8b9;background:#2c1b12;border:1px solid #9e7549;padding:5px 9px}
body.full-graphics .gfx-main:has(.r127-last-combat) .gfx-narrative{min-height:55px}
`;
document.head.append(style);
let previousCombat=false,result=null,visible=null,watching=false,closeCount=0;
const active=()=>GraphicalUI.active()&&!combatState;
const summaryPattern=/\b(?:you deal|damage|xp|experience|bolts|pack:|pack \+|loot|salvage|reward|victory|won|defeated|killed|result|level up|level-up|item found|you receive|you gain)\b/i;
const isHeading=t=>/^\s*(?:result|combat result|victory|battle won)\s*[:—-]?\s*$/i.test(t);
const squash=t=>String(t||'').replace(/\s+/g,' ').trim();
function findCombatResult(){
 if(!screen)return null;
 const nodes=[...screen.children];
 let anchor=-1;
 for(let i=nodes.length-1;i>=0;i--){
  const t=squash(nodes[i].textContent);
  if(isHeading(t)){anchor=i;break;}
  // Prior combat is out of scope once player has travelled to another stage.
  if(i<nodes.length-12)break;
 }
 if(anchor<0)return null;
 const lines=[];
 // Include preceding combat summary line where damage/XP is printed just
 // before RESULT, and subsequent loot lines until the next location header.
 for(let i=Math.max(0,anchor-2);i<Math.min(nodes.length,anchor+12);i++){
  const row=nodes[i],t=squash(row.textContent);
  if(i>anchor&&(/\bplace\b/.test(row.className)||/^\[\d+\]/.test(t)||/^\s*(?:WORKS JUNCTION|ROUTE 127 TOWARD)/.test(t)))break;
  if(!t||!summaryPattern.test(t)||isHeading(t))continue;
  if(!lines.includes(t))lines.push(t);
 }
 return lines.length?lines.slice(-5):null;
}
function draw(){
 const e=GraphicalUI.element;
 if(!e?.narrative||!e?.frame||!result||!active())return;
 if(visible?.isConnected)return;
 const panel=document.createElement('aside');panel.className='r127-last-combat';
 panel.setAttribute('role','status');panel.setAttribute('aria-label','Recent combat rewards');
 const heading=document.createElement('strong');heading.textContent='LAST COMBAT — RESULTS & LOOT';
 panel.append(heading);
 for(const line of result){const span=document.createElement('span');span.className='r127-last-combat-line';span.textContent=line;panel.append(span);}
 const close=document.createElement('button');close.type='button';close.textContent='×';
 close.setAttribute('aria-label','Dismiss combat results');
 close.addEventListener('click',()=>{result=null;panel.remove();visible=null;});
 panel.append(close);
 e.narrative.parentElement?.insertBefore(panel,e.narrative);
 visible=panel;
}
function update(){
 if(!GraphicalUI.active())return;
 if(combatState){previousCombat=true;visible?.remove();visible=null;return;}
 if(previousCombat){
  previousCombat=false;closeCount=0;
  // Some combat rewards are posted on the next output tick.
  watching=true;
 }
 if(!watching){if(result)draw();return;}
 const lines=findCombatResult();
 if(lines?.length){result=lines;visible?.remove();visible=null;draw();}
 if(++closeCount>10)watching=false;
}
const priorSync=GraphicalUI.sync;
GraphicalUI.sync=function(...args){
 const ret=priorSync.apply(this,args);
 if(!this.rendering)update();
 return ret;
};
// Detect post-combat output produced after the combat state has cleared,
// without requiring the player to scroll or click a second menu.
const mutation=new MutationObserver(()=>{
 if(!watching||!active()||!screen?.isConnected)return;
 const lines=findCombatResult();
 if(lines?.length){result=lines;visible?.remove();visible=null;draw();}
});
if(screen)mutation.observe(screen,{childList:true});
})();
