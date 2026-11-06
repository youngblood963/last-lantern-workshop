/* Route 127 — DEVTEST-only knife-throwing artwork and impact animation.
 * The existing r6Throw/r6Score/r6MeterPosition own accuracy, timing,
 * wagers, settlement, anti-forfeit guards, keyboard, and Classic BBS.
 */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined'||
   typeof r6Round!=='function'||typeof r6Throw!=='function')return;
const base='../devtest/assets/locations/';
const art=(name)=>new URL(base+name,document.baseURI).href;
const background=art('seaport_knife_throwing_background.png');
const sprite=art('seaport_throwing_knife.png');
const active=()=>typeof stage!=='undefined'&&stage==='r6Casino'&&
  r6Round()?.game==='KNIFE THROWING'&&GraphicalUI.preference()==='graphics';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const olderModel=GraphicalUI.model;
GraphicalUI.model=function(...args){
 const m=olderModel.apply(this,args);
 if(active()){m.layout='seaport-knife-throwing';m.art='';m.title='Rusty Anchor — Knife Throwing';}
 return m;
};
const css=document.createElement('style');css.dataset.seaportKnife='v1';
css.textContent=`
body.full-graphics .gfx-frame[data-layout="seaport-knife-throwing"] .gfx-main{
 display:flex;flex-direction:column;min-height:0;height:100%;overflow:hidden;gap:6px}
body.full-graphics .gfx-frame[data-layout="seaport-knife-throwing"] .gfx-art{
 display:block;position:relative;flex:1 1 0;min-height:160px;overflow:hidden;background:#100b08!important}
body.full-graphics .gfx-frame[data-layout="seaport-knife-throwing"] .r6-knife{display:none!important}
body.full-graphics .gfx-frame[data-layout="seaport-knife-throwing"] .gfx-image,
body.full-graphics .gfx-frame[data-layout="seaport-knife-throwing"] .gfx-art-caption,
body.full-graphics .gfx-frame[data-layout="seaport-knife-throwing"] .gfx-art-error{display:none!important}
body.full-graphics .gfx-frame[data-layout="seaport-knife-throwing"] .gfx-narrative{
 flex:0 0 auto;max-height:78px;overflow:auto;font-size:13px}
body.full-graphics .gfx-frame[data-layout="seaport-knife-throwing"] .gfx-choices{
 flex:0 0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
 gap:6px;max-height:145px;overflow-y:auto}
body.full-graphics .gfx-frame[data-layout="seaport-knife-throwing"] .gfx-choice{
 min-width:0;min-height:40px;padding:4px 7px}
.r127-knife-stage{position:absolute;inset:0;pointer-events:none;overflow:hidden;
 background:#160c07 url("${background}") center/100% 100% no-repeat}
.r127-knife-stuck{position:absolute;width:29%;height:auto;z-index:3;pointer-events:none;
 transform:translate(-69%,-50%) rotate(-8deg);
 filter:drop-shadow(2px 2px 2px #000a)}
.r127-knife-meter{position:absolute;z-index:8;left:2.2%;bottom:3%;width:min(42%,375px);
 padding:9px 12px 10px;background:#160d09e8;border:1px solid #a77845;
 box-shadow:0 3px 12px #000b;color:#f6d6a5;pointer-events:auto;
 font-family:Georgia,serif}
.r127-knife-meter-title{font-weight:bold;font-size:clamp(11px,1.2vw,15px);
 letter-spacing:.08em;margin-bottom:7px}
.r127-knife-meter-rail{height:15px;position:relative;border:1px solid #a77845;
 background:linear-gradient(90deg,#65271a 0%,#9a5625 25%,#d9bb69 41%,#4b9a52 48%,#4b9a52 52%,#d9bb69 59%,#9a5625 75%,#65271a 100%)}
.r127-knife-meter-rail:after{content:'';position:absolute;inset:-3px auto -3px 50%;
 width:2px;background:#fff9;transform:translateX(-50%)}
.r127-knife-meter-needle{position:absolute;z-index:2;left:0;top:-4px;
 width:3px;height:22px;background:#fff;box-shadow:0 0 5px #fff;
 animation:r127-knife-aim 1.6s linear infinite}
@keyframes r127-knife-aim{0%,100%{left:0}50%{left:100%}}
.r127-knife-meter-throw{display:block;width:100%;margin-top:9px;min-height:35px;
 font-weight:bold;letter-spacing:.12em;color:#fff1c9;background:#8a3019;
 border:1px solid #cb8f52;cursor:pointer;touch-action:manipulation}
.r127-knife-meter-throw:active{background:#c04d22}
.r127-knife-impact-text{position:absolute;z-index:9;top:8%;left:47%;min-width:18%;
 padding:4px 10px;background:#120b06df;color:#ffdc83;text-align:center;
 font-weight:bold;font-size:clamp(13px,2vw,24px);border:1px solid #a57948;
 text-shadow:1px 1px 2px #000;pointer-events:none}
@media(max-width:600px){.r127-knife-meter{width:49%;padding:6px 7px}
 .r127-knife-meter-throw{min-height:32px}}
@media(prefers-reduced-motion:reduce){.r127-knife-meter-needle{animation:none}}
`;
document.head.appendChild(css);
let scene=null,roundKey='',placements=new Map(),lastCount=-1,aimEl=null,impactTimer=0;
let pending=null;
function clear(){
 if(impactTimer){clearTimeout(impactTimer);impactTimer=0}
 scene?.remove();scene=null;roundKey='';lastCount=-1;aimEl=null;
 placements.clear();pending=null;
}
function placeFor(score,index,position){
 // Tip positions measured against the approved target artwork. Score always
 // determines the impact ring; timer position only selects the game score.
 // Target center is approximately 66.5% X, 41.5% Y in the stage.
 const cx=.665,cy=.415;
 const angles=[-.52,Math.PI,.55,2.35,-2.2];
 const radius=score===50?.012:score===25?.057:score===10?.107:.188;
 const angle=angles[index%5];
 return {x:clamp(cx+radius*Math.cos(angle),.22,.94),
         y:clamp(cy+radius*Math.sin(angle)*1.15,.08,.91),score};
}
function createKnife(holder,i,placement){
 const img=document.createElement('img');
 img.className='r127-knife-stuck';img.alt='';img.draggable=false;
 img.setAttribute('aria-hidden','true');img.dataset.throw=String(i);
 img.src=sprite;
 // Source sprite intentionally occupies a small portion of its transparent
 // canvas. Align the visible blade tip (about x=60%) to the target hit point.
 img.style.left=(placement.x*100).toFixed(2)+'%';
 img.style.top=(placement.y*100).toFixed(2)+'%';
 holder.append(img);return img;
}
function create(figure){
 const div=document.createElement('div');div.className='r127-knife-stage';
 div.setAttribute('role','group');div.setAttribute('aria-label','Rusty Anchor knife throwing target');
 figure.append(div);scene=div;return div;
}
function renderMeter(r){
 const playing=r.status==='active'&&Number.isFinite(r.started)&&r.started>0;
 if(!playing){aimEl?.remove();aimEl=null;return;}
 if(!aimEl){
  const box=document.createElement('div');box.className='r127-knife-meter';
  box.setAttribute('aria-label','Knife aim timing meter');
  const title=document.createElement('div');title.className='r127-knife-meter-title';
  title.textContent='THROW '+(r.scores.length+1)+' / 5 — STOP THE NEEDLE';
  const rail=document.createElement('div');rail.className='r127-knife-meter-rail';
  const needle=document.createElement('div');needle.className='r127-knife-meter-needle';
  rail.append(needle);
  const button=document.createElement('button');button.type='button';button.className='r127-knife-meter-throw';
  button.textContent='THROW!';
  // Pointerdown captures the same immediate input timestamp as the old
  // Classic BBS button; avoid async GraphicalUI.dispatch() latency.
  button.addEventListener('pointerdown',e=>{
   if(e.button!==undefined&&e.button!==0)return;
   e.preventDefault();e.stopPropagation();
   const now=performance.now();r6Throw(now);
  });
  button.addEventListener('click',e=>{
   if(e.detail===0){e.preventDefault();r6Throw(performance.now());}
  });
  box.append(title,rail,button);scene.append(box);aimEl=box;
 }
 aimEl.querySelector('.r127-knife-meter-title').textContent=
   'THROW '+(r.scores.length+1)+' / 5 — STOP THE NEEDLE';
 const needle=aimEl.querySelector('.r127-knife-meter-needle');
 if(needle&&needle.dataset.started!==String(r.started)){
  needle.dataset.started=String(r.started);
  needle.style.animationDelay='-'+Math.max(0,performance.now()-r.started)+'ms';
 }
}
function showImpact(score){
 if(!scene)return;
 scene.querySelector('.r127-knife-impact-text')?.remove();
 const banner=document.createElement('div');banner.className='r127-knife-impact-text';
 banner.textContent=score===50?'BULLSEYE! 50':score===0?'MISS — 0':score+' POINTS';
 scene.append(banner);
 if(impactTimer)clearTimeout(impactTimer);
 impactTimer=setTimeout(()=>{banner.remove();impactTimer=0},1400);
}
function renderKnives(r){
 if(!Array.isArray(r.scores))return;
 r.scores.forEach((score,i)=>{
  if(scene.querySelector('[data-throw="'+i+'"]'))return;
  const point=placements.get(i)||placeFor(score,i);
  const knife=createKnife(scene,i,point);
  if(pending?.id===r.id&&pending.index===i){
   const reduce=matchMedia?.('(prefers-reduced-motion: reduce)').matches;
   if(!reduce&&typeof knife.animate==='function'){
    knife.animate([
     {transform:'translate(-250%,-25%) rotate(-65deg) scale(1.45)',opacity:.4},
     {transform:'translate(-120%,-48%) rotate(10deg) scale(1.12)',opacity:1,offset:.77},
     {transform:'translate(-69%,-50%) rotate(-8deg) scale(1)',opacity:1}
    ],{duration:540,easing:'cubic-bezier(.2,.65,.25,1)'});
   }
   showImpact(score);pending=null;
  }
 });
}
const sync=GraphicalUI.sync;
GraphicalUI.sync=function(...args){
 const result=sync.apply(this,args);
 const figure=this.element?.figure;if(!figure)return result;
 if(!active()){if(scene)clear();return result;}
 let existing=figure.querySelector('.r127-knife-stage');
 if(!existing)existing=create(figure);else scene=existing;
 const r=r6Round();if(!r)return result;
 if(roundKey!==r.id){
  scene.querySelectorAll('.r127-knife-stuck,.r127-knife-impact-text').forEach(el=>el.remove());
  placements.clear();roundKey=r.id;lastCount=-1;
 }
 renderKnives(r);renderMeter(r);
 lastCount=Array.isArray(r.scores)?r.scores.length:0;
 return result;
};
const oldStart=r6StartMeter;
r6StartMeter=function(...args){
 const result=oldStart.apply(this,args);
 if(active())GraphicalUI.sync();
 return result;
};
const oldThrow=r6Throw;
r6Throw=function(now){
 const r=r6Round(),qualifies=active()&&r?.status==='active'&&r.started&&
   Array.isArray(r.scores)&&r.scores.length<5;
 const before=qualifies?r.scores.length:-1;
 let point=null;
 if(qualifies){
  const elapsed=now-r.started;
  const p=elapsed<0||elapsed>10000?1:r6MeterPosition(elapsed);
  point=placeFor(elapsed<0||elapsed>10000?0:r6Score(p),before,p);
 }
 // Scores/ledger/forfeit guards are decided immediately, before ANY graphics.
 if(qualifies){
  // The original settlement saves immediately and updateHud() may synchronously
  // render graphics, so arm the flight BEFORE calling the gameplay function.
  placements.set(before,point);
  pending={id:r.id,index:before};
 }
 const result=oldThrow.call(this,now);
 if(qualifies&&r.scores.length===before+1)GraphicalUI.sync();
 else if(qualifies){placements.delete(before);pending=null;}
 return result;
};
GraphicalUI.schedule();
})();
