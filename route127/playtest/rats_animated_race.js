/* Route 127: Rat Racing — visual-only cinematic race.
 * Four independent transparent rat sprites over the approved EMPTY track art.
 * Reads casino.js's already-decided winner; does not select winners, change
 * wagers, payouts, checkpoints, game controls, or other casino games.
 * Load AFTER slots_animated_reels.js / rps_object_animation.js.
 */
(function(){
 'use strict';
 if(typeof GraphicalUI==='undefined'||typeof casinoRound!=='function')return;
 const graphical=()=>GraphicalUI.preference()==='graphics';
 const atRace=()=>typeof stage!=='undefined'&&stage==='mercy'&&
    typeof mercyLocation!=='undefined'&&mercyLocation==='casinoGame'&&
    casinoRound()?.game==='rats';
 const names=typeof CASINO_RATS!=='undefined'?CASINO_RATS:['Nibbles','Rustbucket','Sir Squeaks-a-Lot','Cheeseburger'];
 const base='assets/locations/rats/';
 const asset=p=>typeof ROUTE127_ASSET_BASE!=='undefined'&&ROUTE127_ASSET_BASE?
   new URL(base+p,ROUTE127_ASSET_BASE).href:base+p;
 const previousModel=GraphicalUI.model;
 GraphicalUI.model=function(){
   const m=previousModel.call(this);
   if(graphical()&&atRace()){
     m.layout='casino-rat-race';m.art='';m.title='Rusty Lantern — Rat Racing';
   }
   return m;
 };
 const style=document.createElement('style');
 style.dataset.route127RatRace='v1';
 style.textContent=`
 body.full-graphics .gfx-frame[data-layout="casino-rat-race"] .gfx-main{
   display:flex;flex-direction:column;height:100%;min-height:0;overflow:hidden;gap:6px}
 body.full-graphics .gfx-frame[data-layout="casino-rat-race"] .gfx-art{
   display:flex;position:relative;flex:1 1 0;min-height:120px;
   max-height:calc(100% - 156px);overflow:hidden;
   background:#090705!important;border:1px solid #725037}
 body.full-graphics .gfx-frame[data-layout="casino-rat-race"] .gfx-art-caption,
 body.full-graphics .gfx-frame[data-layout="casino-rat-race"] .gfx-art-error,
 body.full-graphics .gfx-frame[data-layout="casino-rat-race"] .gfx-image{display:none!important}
 body.full-graphics .gfx-frame[data-layout="casino-rat-race"] .gfx-narrative{
   flex:0 0 auto;max-height:74px;overflow:auto;font-size:13px}
 body.full-graphics .gfx-frame[data-layout="casino-rat-race"] .gfx-choices{
   flex:0 0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
   gap:6px;min-height:48px;max-height:134px;overflow-y:auto}
 body.full-graphics .gfx-frame[data-layout="casino-rat-race"] .gfx-choice{
   min-height:41px;min-width:0;padding:3px 7px}
 body.full-graphics .gfx-frame[data-layout="casino-rat-race"] .gfx-choice-label{
   font-size:clamp(12px,1vw,16px);white-space:normal}
 .r127-race-viewport{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
   overflow:hidden;pointer-events:none;background:#090705}
 .r127-race-track{position:relative;width:100%;aspect-ratio:3/1;max-height:100%;overflow:hidden;
   background:#090705 url('${asset('rat_race_track.jpg')}') center/100% 100% no-repeat;
   container-type:inline-size}
 .r127-race-rat{position:absolute;z-index:3;width:16%;height:auto;object-fit:contain;
   transform:translate(-50%,-65%) scale(var(--rat-scale,1));transform-origin:50% 50%;
   filter:drop-shadow(3px 5px 3px #000a);will-change:left,top,transform}
 .r127-race-finish{position:absolute;z-index:2;left:79.9%;top:1.5%;width:15.4%;height:13%;
   object-fit:fill;filter:drop-shadow(1px 2px 1px #000a);pointer-events:none}
 .r127-race-rat.is-winner{filter:drop-shadow(0 0 6px #ffbe42) drop-shadow(3px 5px 3px #0009)}
 .r127-race-track.is-running .r127-race-rat{animation:r127-rat-gallop .23s ease-in-out infinite alternate}
 @keyframes r127-rat-gallop{0%{transform:translate(-50%,-65%) scale(var(--rat-scale,1)) translateY(0)}
   100%{transform:translate(-50%,-65%) scale(var(--rat-scale,1)) translateY(-3px)}}
 @media(prefers-reduced-motion:reduce){.r127-race-track.is-running .r127-race-rat{animation:none}}
 `;
 document.head.appendChild(style);
 let lastKey='',raf=0,runToken=0;
 const beginX=.20,endX=.90;
 // Perspective slopes upward: these values anchor each rat in its lane.
 const startY=[.335,.470,.605,.742],finishY=[.245,.365,.485,.605];
 let scene=null;
 function position(i,progress){
   if(!scene)return;
   const img=scene.querySelector('.r127-race-rat[data-lane="'+i+'"]');if(!img)return;
   const t=Math.max(0,Math.min(1,progress));
   const x=beginX+(endX-beginX)*t;
   const y=startY[i]+(finishY[i]-startY[i])*t;
   img.style.left=(x*100).toFixed(3)+'%';img.style.top=(y*100).toFixed(3)+'%';
   img.style.setProperty('--rat-scale',(1-.23*t).toFixed(3));
 }
 function stopAnimation(){runToken++;if(raf){cancelAnimationFrame(raf);raf=0;}scene?.classList.remove('is-running');}
 function create(figure){
   const viewport=document.createElement('div');viewport.className='r127-race-viewport';
   const track=document.createElement('div');track.className='r127-race-track';
   track.setAttribute('role','img');track.setAttribute('aria-label','Four-lane wasteland rat race track');
   const finish=document.createElement('img');finish.src=asset('finish_lettering.png');finish.alt='';
   finish.className='r127-race-finish';track.append(finish);
   for(let i=0;i<4;i++){
     const rat=document.createElement('img');rat.className='r127-race-rat';rat.dataset.lane=String(i);
     rat.src=asset('rat_'+(i+1)+'.png');rat.alt='';rat.draggable=false;
     rat.setAttribute('aria-hidden','true');track.append(rat);
   }
   viewport.append(track);figure.append(viewport);scene=track;
   for(let i=0;i<4;i++)position(i,0);
   return track;
 }
 function renderFinished(winner){
   stopAnimation();if(!scene)return;
   scene.querySelectorAll('.r127-race-rat').forEach(x=>x.classList.remove('is-winner'));
   for(let i=0;i<4;i++)position(i,i===winner?1:.70+(i*.045));
   const img=scene.querySelector('.r127-race-rat[data-lane="'+winner+'"]');
   img?.classList.add('is-winner');
   scene.setAttribute('aria-label',names[winner]+' wins the four-lane rat race');
 }
 function race(round){
   stopAnimation();if(!scene)return;
   const token=++runToken,winner=round.winner;
   const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
   if(reduce){renderFinished(winner);return;}
   const duration=4900;const start=performance.now();
   // Each lane has different bursts/surges; only the actual winner crosses the line.
   const targets=[.75,.77,.76,.78];targets[winner]=1;
   const phases=[.6,2.4,4.1,5.7];
   scene.classList.add('is-running');scene.querySelectorAll('.r127-race-rat').forEach(x=>x.classList.remove('is-winner'));
   function tick(now){
     if(token!==runToken||!scene?.isConnected||!atRace())return;
     const t=Math.min(1,(now-start)/duration);
     const eased=t<.9?t*1.04:.936+(t-.9)*.64;
     for(let i=0;i<4;i++){
       const surge=(Math.sin(t*16+phases[i])*Math.sin(Math.PI*t)*.055);
       let progress=Math.min(targets[i],Math.max(0,eased*targets[i]+surge));
       position(i,progress);
     }
     if(t<1){raf=requestAnimationFrame(tick);return;}
     raf=0;renderFinished(winner);
   }
   raf=requestAnimationFrame(tick);
 }
 const prevSync=GraphicalUI.sync;
 GraphicalUI.sync=function(){
   prevSync.call(this);
   const figure=this.element?.figure;if(!figure)return;
   let current=figure.querySelector('.r127-race-track');
   if(!graphical()||!atRace()){
     if(current)current.closest('.r127-race-viewport')?.remove();
     stopAnimation();scene=null;lastKey='';return;
   }
   if(!current)current=create(figure);else scene=current;
   const round=casinoRound();if(!round)return;
   const key=round.id+':'+round.status+':'+String(round.winner);
   if(key===lastKey)return;
   lastKey=key;
   if(round.status==='settled'&&Number.isInteger(round.winner)&&round.winner>=0&&round.winner<4){
     race(round);
   }else{
     stopAnimation();for(let i=0;i<4;i++)position(i,0);
     scene.setAttribute('aria-label','Four rats at the starting line: '+names.join(', '));
   }
 };
 // The game's resolution may happen before queued text output flushes; refresh
 // the GRAPHICAL layer only when the result exists. BBS still uses its text race.
 const oldResolveRats=casinoResolveRats;
 casinoResolveRats=function(r){
   const result=oldResolveRats(r);
   if(r?.game==='rats'&&graphical())GraphicalUI.sync();
   return result;
 };
 const oldOpen=casinoOpen;
 casinoOpen=function(game){
   const result=oldOpen(game);
   if(game==='rats'&&graphical())GraphicalUI.sync();
   return result;
 };
 GraphicalUI.schedule();
})();
