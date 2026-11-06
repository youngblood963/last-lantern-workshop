/* Route 127 — DEVTEST Rusty Anchor crab race.
 * Graphical-only presentation of the existing authoritative five-crab outcome.
 * No changes to odds, selected winner, ledger, wagers, or Classic BBS gameplay.
 */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined'||typeof r6Round!=='function')return;
const atRace=()=>stage==='r6Casino'&&r6Round()?.game==='CRAB RACING';
const graphical=()=>GraphicalUI.preference()==='graphics';
const enabled=()=>graphical()&&atRace();
const base='../devtest/assets/locations/crab_racing/';
const image=p=>typeof ROUTE127_ASSET_BASE!=='undefined'&&ROUTE127_ASSET_BASE?new URL(base+p,ROUTE127_ASSET_BASE).href:base+p;
const trackUrl=image('seaport_crab_racing_track.png');
const colors=['Red','Blue','Yellow','Green','Purple'];
const model=GraphicalUI.model;
GraphicalUI.model=function(...args){
 const m=model.apply(this,args);
 if(enabled()){m.layout='seaport-crab-racing';m.art='';m.title='Rusty Anchor — Crab Racing';}
 return m;
};
const style=document.createElement('style');
style.dataset.seaportCrabRace='v1';
style.textContent=`
body.full-graphics .gfx-frame[data-layout="seaport-crab-racing"] .gfx-main{
 display:flex;flex-direction:column;height:100%;min-height:0;gap:6px;overflow:hidden}
body.full-graphics .gfx-frame[data-layout="seaport-crab-racing"] .gfx-art{
 display:block!important;position:relative;flex:1 1 0;min-height:160px;overflow:hidden;
 background:#19120e!important}
body.full-graphics .gfx-frame[data-layout="seaport-crab-racing"] .gfx-image,
body.full-graphics .gfx-frame[data-layout="seaport-crab-racing"] .gfx-art-caption,
body.full-graphics .gfx-frame[data-layout="seaport-crab-racing"] .gfx-art-error{display:none!important}
body.full-graphics .gfx-frame[data-layout="seaport-crab-racing"] .gfx-narrative{
 flex:0 0 auto;max-height:75px;overflow:auto;font-size:13px}
body.full-graphics .gfx-frame[data-layout="seaport-crab-racing"] .gfx-choices{
 flex:0 0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
 gap:6px;max-height:156px;overflow-y:auto}
body.full-graphics .gfx-frame[data-layout="seaport-crab-racing"] .gfx-choice{
 min-height:39px;min-width:0;padding:3px 7px}
.r127-crab-stage{position:absolute;inset:0;display:flex;justify-content:center;align-items:center;
 pointer-events:none;overflow:hidden}
.r127-crab-track{position:relative;overflow:hidden;width:100%;height:100%;
 background:transparent url("${trackUrl}") center/100% 100% no-repeat}
.r127-crab-racer{position:absolute;z-index:2;width:22%;height:25%;object-fit:contain;
 transform:translate(-50%,-50%);filter:drop-shadow(2px 3px 3px #000b);
 will-change:left,top,transform;pointer-events:none}
.r127-crab-racer.is-winner{filter:drop-shadow(0 0 9px #ffdb6a) drop-shadow(2px 3px 3px #000)}
.r127-crab-track.is-running .r127-crab-racer{animation:r127-crab-sway var(--crab-step,.78s) ease-in-out infinite alternate}
@keyframes r127-crab-sway{
 0%{transform:translate(-50%,-50%) rotate(-1deg) scaleY(1)}
 50%{transform:translate(-50%,-53%) rotate(2deg) scaleY(1.01)}
 100%{transform:translate(-50%,-50%) rotate(-2deg) scaleY(.99)}
}
.r127-crab-track.is-running .r127-crab-racer.is-paused{animation-play-state:paused}
.r127-crab-racer.is-winner{animation:r127-crab-victory .33s ease-in-out 4 alternate}
@keyframes r127-crab-victory{
 from{transform:translate(-50%,-50%) rotate(-4deg)}
 to{transform:translate(-50%,-65%) rotate(5deg)}
}
@media(prefers-reduced-motion:reduce){
 .r127-crab-track .r127-crab-racer{animation:none!important}
}
`;
document.head.appendChild(style);
let track=null,lastKey='',frame=0,epoch=0;
const startX=.195,finishX=.84;
// Perspective of the five rope-defined lanes on the approved barrel artwork.
// Lane centers measured against the actual barrel artwork (top lane to bottom).
// Previous values placed most crabs directly on the rope separators.
// Wider lane separation: five independent centers, not two sprites per rope gap.
const startY=[.315,.433,.551,.669,.787];
const endY=[.310,.425,.540,.655,.770];
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function place(lane,progress,sway=0){
 if(!track)return;
 const el=track.querySelector('[data-crab-lane="'+lane+'"]');if(!el)return;
 const p=clamp(progress),x=startX+(finishX-startX)*p;
 const y=startY[lane]+(endY[lane]-startY[lane])*p+sway;
 el.style.left=(x*100).toFixed(3)+'%';
 el.style.top=(y*100).toFixed(3)+'%';
}
function stop(){epoch++;if(frame){cancelAnimationFrame(frame);frame=0}track?.classList.remove('is-running')}
function create(figure){
 const stageEl=document.createElement('div');stageEl.className='r127-crab-stage';
 const surface=document.createElement('div');surface.className='r127-crab-track';
 surface.setAttribute('role','img');surface.setAttribute('aria-label','Five crabs lined up on a wooden barrel race track');
 for(let i=0;i<5;i++){
  const img=document.createElement('img');
  img.className='r127-crab-racer';img.dataset.crabLane=String(i);
  img.src=image('seaport_crab_'+(i+1)+'.png');img.alt='';img.draggable=false;
  img.setAttribute('aria-hidden','true');
  img.style.setProperty('--crab-step',[.78,.92,.84,1.02,.73][i]+'s');
  surface.append(img);
 }
 stageEl.append(surface);figure.append(stageEl);track=surface;
 for(let i=0;i<5;i++)place(i,0);
 return surface;
}
function settled(winner,others){
 stop();if(!track)return;
 for(let i=0;i<5;i++){
  const el=track.querySelector('[data-crab-lane="'+i+'"]');
  place(i,i===winner?1:others[i]);
  el?.classList.toggle('is-winner',i===winner);
  el?.classList.remove('is-paused');
 }
 track.setAttribute('aria-label',(R6_CRABS[winner]||colors[winner])+' wins the five-crab race');
}
function race(r){
 stop();if(!track)return;
 const winner=r.winner;
 const reduces=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const others=[.69,.75,.72,.77,.73];
 const seed=String(r.id||'').split('').reduce((a,c)=>(a*33+c.charCodeAt(0))>>>0,5381);
 for(let i=0;i<5;i++)others[i]=.65+((seed+i*193)%19)/100;
 if(reduces){settled(winner,others);return}
 const token=++epoch,start=performance.now(),duration=8500;
 track.classList.add('is-running');
 track.querySelectorAll('.r127-crab-racer').forEach(el=>el.classList.remove('is-winner'));
 function tick(now){
  if(token!==epoch||!enabled()||!track?.isConnected)return;
  const t=clamp((now-start)/duration);
  for(let i=0;i<5;i++){
   const final=i===winner?1:others[i];
   // Distinct stop/go rhythms with sideways sways and tiny backward steps.
   // Only the already-determined winner can reach the finish line.
   const stopPhase=Math.sin(t*(12+i*1.1)+i*2.3);
   const paused=stopPhase>.72&&t<.87;
   const surge=(Math.sin(t*(8+i*.6)+i*1.6)*.038+
                Math.sin(t*17+i*2.9)*.009)*Math.sin(Math.PI*t);
   const base=t*t*(3-2*t);
   const p=clamp(final*base+surge,0,final);
   const sway=(Math.sin(t*15+i*2.8)*.005+Math.sin(t*8+i)*.003)*
              Math.sin(Math.PI*t);
   place(i,p,sway);
   track.querySelector('[data-crab-lane="'+i+'"]')?.classList.toggle('is-paused',paused);
  }
  if(t<1){frame=requestAnimationFrame(tick);return}
  frame=0;settled(winner,others);
 }
 frame=requestAnimationFrame(tick);
}
const oldRace=r6Race;
r6Race=function(winner){
 if(!enabled())return oldRace.apply(this,arguments);
 // The text animation belongs in Classic BBS; the graphical one draws five
 // sprite crabs and reads the round's already-decided winning index.
 GraphicalUI.sync();
};
const previousSync=GraphicalUI.sync;
GraphicalUI.sync=function(...args){
 const result=previousSync.apply(this,args),figure=this.element?.figure;
 if(!figure)return result;
 let existing=figure.querySelector('.r127-crab-track');
 if(!enabled()){
  stop();existing?.closest('.r127-crab-stage')?.remove();track=null;lastKey='';
  return result;
 }
 if(!existing)existing=create(figure);else track=existing;
 const r=r6Round();if(!r)return result;
 const key=r.id+':'+r.status+':'+String(r.winner);
 if(key===lastKey)return result;
 lastKey=key;
 if(r.status==='settled'&&Number.isInteger(r.winner)&&r.winner>=0&&r.winner<5)race(r);
 else{stop();for(let i=0;i<5;i++)place(i,0);
  track.setAttribute('aria-label','Five crabs await the starting signal');}
 return result;
};
GraphicalUI.schedule();
})();
