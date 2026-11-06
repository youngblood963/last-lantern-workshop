/* DEVTEST: Seaport slot machine reuses Solace odds, payouts, and reel spin technique. */
(function(){
'use strict';
if(globalThis.ROUTE127_ENV?.name==='DEVTEST'||typeof GraphicalUI==='undefined'||typeof r6Round!=='function'||typeof casinoSlotDraw!=='function')return;
const names=['SCRAP','BOLTS','LANTERN','SKULL','RAT','BLACKGLASS'];
const base='../devtest/assets/locations/slots/';
const asset=f=>typeof ROUTE127_ASSET_BASE!=='undefined'&&ROUTE127_ASSET_BASE?new URL(base+f,ROUTE127_ASSET_BASE).href:base+f;
const wall=asset('seaport_slots_background.png'),cabinet=asset('seaport_slot_machine.png'),strip=asset('seaport_slot_reel_strip.png?v=wo-slots-reels-final-20261105');
const isSlot=()=>stage==='r6Casino'&&r6Round()?.game==='SLOTS'&&player.flags?.port55Casino;
const enabled=()=>GraphicalUI.preference()==='graphics'&&isSlot();
const d=R6_GAMES.indexOf("CAPTAIN'S DICE");if(d!==-1&&!R6_GAMES.includes('SLOTS'))R6_GAMES.splice(d,1,'SLOTS');
const wager=r6Wager;
r6Wager=function(bet){
 if(!isSlot())return wager.apply(this,arguments);
 if(!Number.isSafeInteger(bet)||bet<1||bet>Math.floor((Number.MAX_SAFE_INTEGER-player.bolts)/300))return false;
 const round=r6Round(),ok=wager.apply(this,arguments);
 if(!ok)return false;
 round.reels=[casinoSlotDraw(),casinoSlotDraw(),casinoSlotDraw()];
 r6Settle(casinoSlotPayout(round.reels,bet),round.reels.join(' / '));
 r6CasinoRender();return true;
};
// Same native clickable buttons used by the working Solace casino.
// These choices are derived from the casino round, not an asynchronous
// terminal output queue (which previously left the slot UI with no buttons).
// Match Solace: 10 / 20 / 50, Custom, All In, Back.
// Custom hands off to the existing FocusedEntry wager popup.
const slotActions=()=>r6Round()?.custom&&r6Round()?.status==='waiting'?['BACK']
 : ['WAGER 10','WAGER 20','WAGER 50','CUSTOM WAGER','ALL IN','BACK'];
const slotOptions=()=>slotActions().map((command,i)=>({
 key:String(i+1),command:command.toLowerCase(),
 label:command.replace(/^WAGER /,'Wager ').replace(/^PLAY AGAIN$/,'Play Again').replace(/^CUSTOM WAGER$/,'Custom').replace(/^ALL IN$/,'All In')
}));
function slotChoices(){
 numberedChoices=Object.fromEntries(slotOptions().map(c=>[c.key,c.command]));
 currentHotkeys={b:'back'};
 GraphicalUI.schedule();
}
const oldChoices=GraphicalUI.choices;
GraphicalUI.choices=function(){
 return enabled()?slotOptions():oldChoices.call(this);
};
// Native button component, but dispatch the resolved command itself so
// stale numbered-choice registrations cannot route a click elsewhere.
const oldDispatch=GraphicalUI.dispatch;
GraphicalUI.dispatch=async function(choice){
 if(!enabled())return oldDispatch.call(this,choice);
 const current=slotOptions().find(c=>c.key===choice.key&&c.command===choice.command);
 if(!current||busy)return false;
 this.navOpen=false;
 await handleCommand(current.command);
 this.sync();
 return true;
};
// On a settled Seaport spin, choosing a wager starts the next round directly.
const originalCasinoCommand=r6CasinoCommand;
r6CasinoCommand=function(cmd){
 if(isSlot()&&r6Round()?.status==='settled'&&
   (/^wager [0-9]+$/.test(cmd)||['custom wager','custom','all in'].includes(cmd))){
  r6Open('SLOTS');
 }
 return originalCasinoCommand.apply(this,arguments);
};
const render=r6CasinoRender;
r6CasinoRender=function(){
 if(!isSlot())return render.apply(this,arguments);
 const r=r6Round();
 add('RUSTY ANCHOR — SLOTS','place');
 if(r.status==='waiting'){
  add('Match three: Bolt 10x / Crab 18x / Compass 28x / Chest 50x / Anchor 70x / Mermaid 300x.','system');
  slotChoices();
 }else if(r.status==='settled'){
  add('WAGER '+r.bet+' / RETURN '+r.payout+' / NET '+(r.payout-r.bet)+' Bolts','reward');
  slotChoices();
 }else render.apply(this,arguments);
};
const model=GraphicalUI.model;
GraphicalUI.model=function(){
 const m=model.apply(this,arguments);
 if(enabled()){m.layout='seaport-slots';m.art='';m.title='Rusty Anchor — Slots'}
 return m;
};
const style=document.createElement('style');
style.textContent=[
 'body.full-graphics .gfx-frame[data-layout="seaport-slots"] .gfx-main{display:flex;flex-direction:column;height:100%;min-height:0;overflow:hidden;gap:6px}',
 'body.full-graphics .gfx-frame[data-layout="seaport-slots"] .gfx-art{display:block!important;position:relative;flex:1 1 0;min-height:150px;overflow:hidden;background:#241b17 url("'+wall+'") center/cover no-repeat!important}',
 'body.full-graphics .gfx-frame[data-layout="seaport-slots"] .gfx-art-caption,body.full-graphics .gfx-frame[data-layout="seaport-slots"] .gfx-art-error,body.full-graphics .gfx-frame[data-layout="seaport-slots"] .gfx-image{display:none!important}',
 'body.full-graphics .gfx-frame[data-layout="seaport-slots"] .gfx-narrative{flex:0 0 auto;max-height:68px;overflow:auto}',
 'body.full-graphics .gfx-frame[data-layout="seaport-slots"] .gfx-choices{flex:0 0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;max-height:125px;overflow-y:auto}',
 'body.full-graphics .gfx-frame[data-layout="seaport-slots"] .gfx-choice{min-width:0;min-height:40px;padding:3px 7px}',
 '.r127-seaport-slot-stage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;overflow:hidden;pointer-events:none;isolation:isolate}',
 '.r127-seaport-slot-cabinet{position:relative;height:100%;max-width:100%;aspect-ratio:3/2;flex:none;background:url("'+cabinet+'") center/100% 100% no-repeat;filter:drop-shadow(0 5px 10px #000b)}',
 '.r127-seaport-slot-window{position:absolute;top:29%;height:36.5%;width:16%;overflow:hidden;border-radius:6px;background:#a38865;box-shadow:inset 0 0 8px 3px #120a08}',
 '.r127-seaport-slot-window[data-reel="0"]{left:23.7%}',
 '.r127-seaport-slot-window[data-reel="1"]{left:42.5%}',
 '.r127-seaport-slot-window[data-reel="2"]{left:59.8%}',
 '.r127-seaport-slot-scroll{position:absolute;left:0;top:0;width:100%;will-change:transform}',
 '.r127-seaport-slot-symbol{width:100%;background-repeat:no-repeat;background-position-x:center;box-sizing:border-box}',
 '.r127-seaport-slot-glass{position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,#0007,transparent 18%,#fff2 50%,transparent 82%,#0007);box-shadow:inset 0 7px 9px #180e09,inset 0 -7px 9px #180e09}',
 '.r127-seaport-slot-stage.win .r127-seaport-slot-window{filter:brightness(1.23)}',
 '@media(prefers-reduced-motion:reduce){.r127-seaport-slot-scroll{will-change:auto}}'
].join('\n');
document.head.appendChild(style);
let key='',running=[];
function stop(){running.forEach(a=>{try{a.cancel()}catch(e){}});running=[]}
function create(figure){
 const scene=document.createElement('div');scene.className='r127-seaport-slot-stage';scene.setAttribute('role','img');scene.setAttribute('aria-label','Rusty Anchor slot machine');
 const machine=document.createElement('div');machine.className='r127-seaport-slot-cabinet';
 for(let i=0;i<3;i++){
  const windowEl=document.createElement('div');windowEl.className='r127-seaport-slot-window';windowEl.dataset.reel=i;
  const scroll=document.createElement('div');scroll.className='r127-seaport-slot-scroll';
  // Repeat six equal-height view cells. Source artwork icons have uneven
  // natural centers, so each cell crops its own icon without stretching.
  for(let copy=0;copy<5;copy++)for(let index=0;index<6;index++){
   const cell=document.createElement('div');
   cell.className='r127-seaport-slot-symbol';cell.dataset.symbol=String(index);
   cell.style.backgroundImage='url("'+strip+'")';
   scroll.appendChild(cell);
  }
  const glass=document.createElement('div');glass.className='r127-seaport-slot-glass';
  windowEl.append(scroll,glass);machine.append(windowEl);
 }
 scene.append(machine);figure.append(scene);return scene;
}
// The new 1024 x 1536 image has six pictograms with slightly uneven
// visual-center spacing. Align every icon to the center of its equal-height
// cell instead of assuming the artwork was a perfect 6 x 256 sprite grid.
const artworkCenters=[157,383,621,857,1063,1321];
const artworkRatio=1024/1536;
function cellHeight(win){return win.getBoundingClientRect().height/3}
function sizeCells(win){
 const cell=cellHeight(win),fullHeight=cell*6,fullWidth=fullHeight*artworkRatio;
 for(const icon of win.querySelectorAll('.r127-seaport-slot-symbol')){
  const idx=Number(icon.dataset.symbol);
  icon.style.height=cell+'px';
  icon.style.backgroundSize=fullWidth+'px '+fullHeight+'px';
  icon.style.backgroundPositionY=(cell/2-artworkCenters[idx]*fullHeight/1536)+'px';
 }
}
function top(win,index,loop){
 const cell=cellHeight(win),height=win.getBoundingClientRect().height;
 return height/2-((loop*6+index+.5)*cell);
}
function pose(scene,ids){
 [...scene.querySelectorAll('.r127-seaport-slot-window')].forEach((win,i)=>{
  sizeCells(win);
  // Loop 2 leaves full preceding/following cells; no visible strip ends.
  win.querySelector('.r127-seaport-slot-scroll').style.transform=
    'translate3d(0,'+top(win,ids[i],2)+'px,0)';
 });
}
function spin(scene,reels){
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const wins=[...scene.querySelectorAll('.r127-seaport-slot-window')];
 if(reduced||!Element.prototype.animate){pose(scene,reels.map(x=>names.indexOf(x)));return}
 wins.forEach((w,i)=>{
  sizeCells(w);
  const s=w.querySelector('.r127-seaport-slot-scroll'),from=top(w,0,1),to=top(w,names.indexOf(reels[i]),3);
  s.style.transform='translate3d(0,'+to+'px,0)';
  running.push(s.animate([{transform:'translate3d(0,'+from+'px,0)'},{transform:'translate3d(0,'+to+'px,0)'}],{duration:1450+i*420,easing:'cubic-bezier(.16,.82,.28,1)',fill:'none'}));
 });
}
function refresh(){
 const figure=GraphicalUI.element?.figure;if(!figure)return;
 let scene=figure.querySelector('.r127-seaport-slot-stage');
 if(!enabled()){if(scene)scene.remove();key='';stop();return}
 if(!scene){scene=create(figure);key=''}
 const r=r6Round(),reels=Array.isArray(r.reels)&&r.reels.length===3?r.reels:null;
 const next=r.id+':'+r.status+':'+(reels?reels.join('/'):'');
 if(next===key)return;key=next;stop();
 if(r.status==='settled'&&reels&&reels.every(x=>names.includes(x))){
  scene.classList.toggle('win',reels.every(x=>x===reels[0]));scene.setAttribute('aria-label','Rusty Anchor: '+reels.join(', '));
  pose(scene,[0,0,0]);
  requestAnimationFrame(()=>{if(scene.isConnected&&enabled()&&key===next)spin(scene,reels)});
 }else{scene.classList.remove('win');pose(scene,[0,2,1]);scene.setAttribute('aria-label','Rusty Anchor slots ready')}
}
const sync=GraphicalUI.sync;
GraphicalUI.sync=function(){const result=sync.apply(this,arguments);refresh();return result};
GraphicalUI.schedule();
})();