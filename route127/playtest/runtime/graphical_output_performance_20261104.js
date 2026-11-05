/* Route 127 — DEVTEST graphical output optimization.
 * Classic BBS retains the original typewriter animation and terminal output.
 * In graphics mode, text is a data/presentation layer: no character-by-character
 * animation, sleep timers, or extra legacy screen behind traveler overlays.
 * No changes to game state, item actions, quest events, or keyboard commands.
 */
(()=>{'use strict';
if(!/\/route127\/playtest\/(?:index\.html)?$/.test(location.pathname))return;
if(typeof GraphicalUI==='undefined'||typeof TravelerPanels==='undefined')return;
const graphical=()=>GraphicalUI.active();
const previousAdd=add;
const previousTypeLine=typeLine;
const previousQueueChoiceLine=queueChoiceLine;
const MAX_VISIBLE_LINES=160;
function instantRow(rawText='',rawCls=''){
 const normalized=normalizeQuestNotice(String(rawText??''),String(rawCls??''));
 let text=normalized.text,cls=normalized.cls;
 // Replicate the original command/number assignment, even for hidden choices.
 if(cls.includes('place')||(!cls.includes('system')&&text)){
  currentHotkeys={};numberedChoices={};usedHotkeys=new Set();
 }
 if(cls.includes('system'))text=renderNumberedChoices(text);
 if(cls.includes('place'))GraphicalUI.lastPlace=String(text);
 const div=document.createElement('div');
 div.className='line '+choiceOutputClass(text,cls);
 div.textContent=text; // One DOM mutation. No animation or per-character timers.
 screen.appendChild(div);
 // Keep identity/rarity colors for the actual graphical narrative.
 if(typeof applyLevelEvolution==='function')applyLevelEvolution(div,text,cls);
 // The Backpack/Character overlays have their own structured, interactive
 // panels. Item-inspection lines remain available to their existing handlers,
 // but stop rendering a second terminal underneath the modal.
 const overlayOpen=!!TravelerPanels.dialog&&['inventory','status'].includes(TravelerPanels.which);
 if(overlayOpen)div.setAttribute('aria-hidden','true');
 // Prune only the in-graphics historical log. Never discard item-inspection
 // output while a modal is active, since the modal reads those rows as details.
 if(!TravelerPanels.dialog)while(screen.childElementCount>MAX_VISIBLE_LINES)screen.firstElementChild.remove();
 GraphicalUI.schedule();
 return div;
}
add=function(text='',cls=''){
 if(!graphical())return previousAdd.apply(this,arguments);
 instantRow(text,cls);return;
};
typeLine=async function(text='',cls='',speed=18){
 if(!graphical())return previousTypeLine.apply(this,arguments);
 instantRow(text,cls);
};
queueChoiceLine=function(text){
 if(!graphical())return previousQueueChoiceLine.apply(this,arguments);
 // Preserve the original queue ordering and choice registration, without
 // repeatedly animating the menu or waiting after each output line.
 outputQueue=outputQueue.then(()=>{
  currentHotkeys={};numberedChoices={};usedHotkeys=new Set();
  const line=renderNumberedChoices(text);
  const div=document.createElement('div');
  div.className='line '+choiceOutputClass(line,'system');
  div.textContent=line;screen.appendChild(div);GraphicalUI.schedule();
 });
};
// The old text/map strip belongs to Classic BBS and is hidden below the
// graphical frame. Avoid rebuilding it on every HUD update in graphical mode.
const previousLiveMap=v49LiveMap;
v49LiveMap=function(...args){
 if(graphical()){
  const oldMap=document.querySelector('#live-map');
  if(oldMap)oldMap.hidden=true;
  return;
 }
 return previousLiveMap.apply(this,args);
};
// Backpack and Character overlays are already constructed from game state;
// their graphical panel construction should not append legacy text or animate.
// Keep interactive item detail/action flows, which rely on existing commands.
const previousOpen=TravelerPanels.open;
TravelerPanels.open=function(which){
 if(graphical()&&(which==='inventory'||which==='status')){
  // Prevent slow legacy output queued before opening from running while the
  // overlay is displayed: already queued work is not cancelled or rewritten,
  // but new output bypasses animation via instantRow.
  const result=previousOpen.apply(this,arguments);
  if(result&&this.dialog)this.dialog.dataset.graphicalNoLegacyText='true';
  return result;
 }
 return previousOpen.apply(this,arguments);
};
globalThis.Route127GraphicalOutputPerformance={version:'2026-11-04',active:graphical};
})();