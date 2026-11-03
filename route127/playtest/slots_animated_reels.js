/* Route 127 — Rusty Lantern animated slot machine.
 * Visual-only integration: the existing casino.js selects symbols, deducts
 * wagers, settles payouts and handles Cheeseburger. Never alter the outcome.
 * Six aligned symbols: SCRAP, BOLTS, LANTERN, SKULL, RAT, BLACKGLASS.
 * Uses the ONE approved reel strip for all THREE independent reels.
 */
(function(){
 'use strict';
 if(typeof GraphicalUI==='undefined'||typeof casinoRound!=='function')return;
 const isGraphics=()=>GraphicalUI.preference()==='graphics';
 const atSlots=()=>typeof stage!=='undefined'&&stage==='mercy'&&
   typeof mercyLocation!=='undefined'&&mercyLocation==='casinoGame'&&
   casinoRound()?.game==='slots';
 const SYMBOLS=['SCRAP','BOLTS','LANTERN','SKULL','RAT','BLACKGLASS'];
 const FRAME='assets/locations/slots/slot_machine_frame.png';
 const STRIP='assets/locations/slots/slot_reel_strip.png';
 const reelArt=src=>typeof ROUTE127_ASSET_BASE!=='undefined'&&ROUTE127_ASSET_BASE?
   new URL(src,ROUTE127_ASSET_BASE).href:src;
 const previousModel=GraphicalUI.model;
 GraphicalUI.model=function(){
   const m=previousModel.call(this);
   if(isGraphics()&&atSlots()){
     m.layout='casino-slots';m.art='';m.title='Rusty Lantern — Slots';
   }
   return m;
 };
 const styles=document.createElement('style');
 styles.dataset.route127Slots='animated-reels-v1';
 styles.textContent=`
 body.full-graphics .gfx-frame[data-layout="casino-slots"] .gfx-main{
   display:flex;flex-direction:column;height:100%;min-height:0;overflow:hidden;gap:7px}
 body.full-graphics .gfx-frame[data-layout="casino-slots"] .gfx-art{
   display:block;position:relative;flex:1 1 0;min-height:135px;
   max-height:calc(100% - 150px);overflow:hidden;
   background:radial-gradient(ellipse at 50% 42%,#403020 0%,#1b120e 65%,#0a0908 100%)!important;
   border:1px solid #79502d}
 body.full-graphics .gfx-frame[data-layout="casino-slots"] .gfx-art-caption,
 body.full-graphics .gfx-frame[data-layout="casino-slots"] .gfx-art-error,
 body.full-graphics .gfx-frame[data-layout="casino-slots"] .gfx-image{display:none!important}
 body.full-graphics .gfx-frame[data-layout="casino-slots"] .gfx-narrative{
   flex:0 0 auto;max-height:75px;overflow:auto;font-size:13px}
 body.full-graphics .gfx-frame[data-layout="casino-slots"] .gfx-choices{
   flex:0 0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
   gap:6px;min-height:48px;max-height:124px;overflow-y:auto}
 body.full-graphics .gfx-frame[data-layout="casino-slots"] .gfx-choice{
   min-height:40px;min-width:0;padding:3px 7px}
 body.full-graphics .gfx-frame[data-layout="casino-slots"] .gfx-choice-label{
   font-size:clamp(12px,1vw,16px);white-space:normal}
 .r127-slots-stage{position:absolute;inset:0;display:flex;justify-content:center;
   align-items:center;overflow:hidden;pointer-events:none;isolation:isolate}
 .r127-slots-machine{height:100%;width:auto;max-width:100%;aspect-ratio:750 / 693;
   position:relative;flex:none;background:url('${reelArt(FRAME)}') center/100% 100% no-repeat}
 .r127-slots-window{position:absolute;top:23.7%;height:36.5%;width:18.5%;
   overflow:hidden;border-radius:8% / 4%;background:#a38865;
   box-shadow:inset 0 0 10px 5px #170d09,0 0 1px #0b0806}
 .r127-slots-window:nth-child(1){left:17.8%}
 .r127-slots-window:nth-child(2){left:38.45%}
 .r127-slots-window:nth-child(3){left:59.15%}
 .r127-slots-scroll{position:absolute;left:0;top:0;width:100%;will-change:transform}
 .r127-slots-scroll img{display:block;width:100%;height:auto;max-width:none;user-select:none;
   -webkit-user-drag:none;pointer-events:none}
 .r127-slots-glass{position:absolute;inset:0;z-index:2;
   background:linear-gradient(90deg,#0006 0%,transparent 17%,#fff2 50%,transparent 81%,#0008 100%);
   box-shadow:inset 0 7px 12px #100a08c9,inset 0 -8px 15px #100a08d1;
   border-radius:inherit}
 .r127-slots-win .r127-slots-window{filter:brightness(1.24) saturate(1.22)}
 @media(prefers-reduced-motion:reduce){.r127-slots-scroll{will-change:auto}}
 `;
 document.head.appendChild(styles);
 let stageEl=null,roundKey='',animations=[];
 function stopAnimations(){
   for(const a of animations){try{a.cancel();}catch(_){}}
   animations=[];
 }
 function makeScene(figure){
   const scene=document.createElement('div');scene.className='r127-slots-stage';
   scene.setAttribute('role','img');scene.setAttribute('aria-label','Rusty Lantern three-reel slot machine');
   const machine=document.createElement('div');machine.className='r127-slots-machine';
   for(let i=0;i<3;i++){
     const windowEl=document.createElement('div');windowEl.className='r127-slots-window';
     windowEl.dataset.reel=String(i);
     const scroll=document.createElement('div');scroll.className='r127-slots-scroll';
     for(let copy=0;copy<5;copy++){
       const img=document.createElement('img');img.src=reelArt(STRIP);
       img.width=176;img.height=936;img.alt='';img.draggable=false;
       scroll.appendChild(img);
     }
     const glass=document.createElement('div');glass.className='r127-slots-glass';
     windowEl.append(scroll,glass);machine.appendChild(windowEl);
   }
   scene.appendChild(machine);figure.appendChild(scene);return scene;
 }
 // The artwork is exactly six consecutive 176x156 cells, all aligned.
 function reelTop(windowEl,symbol,loop){
   const cell=windowEl.getBoundingClientRect().width*(156/176);
   const height=windowEl.getBoundingClientRect().height;
   const i=Math.max(0,SYMBOLS.indexOf(symbol));
   return height/2-((loop*SYMBOLS.length+i+.5)*cell);
 }
 function setReel(windowEl,symbol,loop){
   windowEl.querySelector('.r127-slots-scroll').style.transform=
     `translate3d(0,${reelTop(windowEl,symbol,loop)}px,0)`;
 }
 function updateStatic(scene,symbols){
   const windows=[...scene.querySelectorAll('.r127-slots-window')];
   windows.forEach((w,i)=>setReel(w,symbols[i]||'SCRAP',0));
 }
 function doSpin(scene,reels){
   stopAnimations();
   const windows=[...scene.querySelectorAll('.r127-slots-window')];
   const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   if(reduce||!Element.prototype.animate){updateStatic(scene,reels);return;}
   for(let i=0;i<3;i++){
     const win=windows[i],scroll=win.querySelector('.r127-slots-scroll');
     const from=reelTop(win,'SCRAP',0),to=reelTop(win,reels[i],3);
     scroll.style.transform=`translate3d(0,${to}px,0)`;
     const anim=scroll.animate([
       {transform:`translate3d(0,${from}px,0)`,offset:0},
       {transform:`translate3d(0,${to}px,0)`,offset:1}
     ],{duration:1450+i*420,easing:'cubic-bezier(.16,.82,.28,1)',fill:'none'});
     animations.push(anim);
   }
 }
 function refresh(){
   if(!GraphicalUI.element?.figure)return;
   const figure=GraphicalUI.element.figure;
   let scene=figure.querySelector('.r127-slots-stage');
   if(!isGraphics()||!atSlots()){
     if(scene)scene.remove();stageEl=null;roundKey='';stopAnimations();return;
   }
   if(!scene){scene=makeScene(figure);stageEl=scene;roundKey='';}
   const round=casinoRound();if(!round)return;
   const reels=Array.isArray(round.reels)&&round.reels.length===3&&
     round.reels.every(x=>SYMBOLS.includes(x))?round.reels:null;
   const key=`${round.id}:${round.status}:${reels?.join('/')||''}`;
   if(key===roundKey)return;
   roundKey=key;stopAnimations();
   if(round.status==='settled'&&reels){
     scene.classList.toggle('r127-slots-win',reels.every(s=>s===reels[0]));
     scene.setAttribute('aria-label',`Rusty Lantern slots: ${reels.join(', ')}`);
     updateStatic(scene,['SCRAP','SCRAP','SCRAP']);
     // Let the scene paint once before animating, including on immediate wager commands.
     requestAnimationFrame(()=>{if(scene.isConnected&&atSlots()&&roundKey===key)doSpin(scene,reels);});
   }else{
     scene.classList.remove('r127-slots-win');
     scene.setAttribute('aria-label','Rusty Lantern slots, ready for your wager');
     updateStatic(scene,['SCRAP','LANTERN','BOLTS']);
   }
 }
 const previousSync=GraphicalUI.sync;
 GraphicalUI.sync=function(){previousSync.call(this);refresh();};
 // casinoResolve settles the wager synchronously. Display immediately even if
 // classic casino animation output is still queued for the BBS text layer.
 const previousResolve=casinoResolve;
 casinoResolve=function(round){
   const result=previousResolve(round);
   if(round?.game==='slots'&&isGraphics())GraphicalUI.sync();
   return result;
 };
 const previousOpen=casinoOpen;
 casinoOpen=function(game){
   const result=previousOpen(game);
   if(game==='slots'&&isGraphics())GraphicalUI.sync();
   return result;
 };
 GraphicalUI.schedule();
})();
