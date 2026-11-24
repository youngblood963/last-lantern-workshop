/* Motel cabinet/reel skin. Native six-symbol draws, boosted payout and casino journal. */
(()=>{'use strict';if(!globalThis.MotelCasino)return;const M=MotelCasino;
const symbols=['SCRAP','BOLTS','LANTERN','SKULL','RAT','BLACKGLASS'];
const labels=['Wrenches','Cherries','Classic Car','Dice','Fuel Pump','Record'];
const stripIndex=[5,0,1,3,4,2],centers=[145,378,600,825,1062,1343];
function render(r){M.choices('THE LOUNGE — SLOTS',['WAGER 10','WAGER 20','WAGER 50','BACK']);}
function command(cmd,r){if(M.locked(r))return M.notice('Reels are still spinning.');
 const n=Number(cmd.match(/^wager (10|20|50)$/)?.[1]);if(!n)return M.notice('Slots accept only 10, 20 or 50 Bolts.');
 if(r.status==='settled'){M.open('slots');r=M.round();}
 if(n>player.bolts)return M.notice('You do not have enough Bolts for that wager.');
 // Payout applies the existing Seaport loss-to-triple boost exactly once.
 const reels=[casinoSlotDraw(),casinoSlotDraw(),casinoSlotDraw()],payout=casinoSlotPayout(reels,n);
 return M.commit(r,n,{reels},payout,reels.map(v=>labels[symbols.indexOf(v)]).join(' / '),2350);
}
function pose(win,index,loop){const cell=win.getBoundingClientRect().height/3;return win.getBoundingClientRect().height/2-(loop*6+index+.5)*cell;}
function paint(canvas,panel,r){if(!r)return;
 if(!canvas.children.length){
  for(let i=0;i<3;i++){const win=M.node('div','mc-slot-window');win.style.left=[22.5,35,47.2][i]+'%';const scroll=M.node('div','mc-slot-scroll');
   for(let j=0;j<30;j++){const cell=M.node('div','mc-slot-symbol');cell.dataset.symbol=String(j%6);cell.style.backgroundImage='url("'+M.asset('casino/motel_slot_reel_strip.png')+'")';scroll.append(cell);}win.append(scroll);canvas.append(win);}
  const cabinet=M.node('img','mc-slot-cabinet');cabinet.src=M.asset('casino/motel_slot_machine.png');cabinet.alt='The Lounge slot machine';canvas.append(cabinet);
  const correction=M.node('div','mc-slot-table-symbol');correction.style.backgroundImage='url("'+M.asset('casino/motel_slot_reel_strip.png')+'")';correction.setAttribute('aria-label','Wrenches, 10 times total return');canvas.append(correction);
 }
 const signature=r.id+'|'+r.status,changed=canvas.dataset.round!==signature;canvas.dataset.round=signature;
 const wins=[...canvas.querySelectorAll('.mc-slot-window')];wins.forEach((win,i)=>{
  const h=win.getBoundingClientRect().height/3,fullH=h*6;
  for(const cell of win.querySelectorAll('.mc-slot-symbol')){cell.style.height=h+'px';cell.style.backgroundSize=fullH*1024/1536+'px '+fullH+'px';cell.style.backgroundPositionY=(h/2-centers[Number(cell.dataset.symbol)]*fullH/1536)+'px';}
  const scroll=win.firstChild,idx=r.reels?stripIndex[symbols.indexOf(r.reels[i])]:[5,0,1][i],to=pose(win,idx,3);scroll.style.transform='translateY('+to+'px)';
  if(changed&&r.status==='settled'&&M.liveAnimations.has(r.id)&&scroll.animate&&!window.matchMedia?.('(prefers-reduced-motion:reduce)').matches)scroll.mcAnimation=scroll.animate([{transform:'translateY('+pose(win,0,1)+'px)'},{transform:'translateY('+to+'px)'}],{duration:1450+i*420,easing:'cubic-bezier(.16,.82,.28,1)'});
  if(!M.locked(r))scroll.mcAnimation?.cancel();
 });
 const correction=canvas.querySelector('.mc-slot-table-symbol'),box=correction.getBoundingClientRect(),full=box.height*6;correction.style.backgroundSize=full*1024/1536+'px '+full+'px';correction.style.backgroundPositionY=(box.height/2-centers[5]*full/1536)+'px';
 panel.textContent='';panel.append(M.node('p','casino-status',M.locked(r)?'REELS SPINNING… Wager '+r.bet+' Bolts':M.status(r)),M.node('p','',labels.map((v,i)=>v+' '+SLOT_SYMBOLS[i].mult+'×').join(' · ')+' — center payline: three matching symbols; other combinations return 0.'));
}
M.register('slots',{title:'SLOTS',art:'casino/motel_slot_machine.png',render,command,paint});
const style=M.node('style');style.textContent='.mc-slot-window{position:absolute;top:28.8%;width:11.8%;height:39.6%;overflow:hidden;background:#bca279;z-index:1}.mc-slot-window:after{content:"";position:absolute;left:0;right:0;top:50%;height:33.333%;transform:translateY(-50%);border-top:1px solid #edc77788;border-bottom:1px solid #edc77788;pointer-events:none}.mc-slot-scroll{position:absolute;inset:0 auto auto 0;width:100%;will-change:transform}.mc-slot-symbol{background-repeat:no-repeat;background-position-x:center;width:100%}.motel-casino-canvas>.mc-slot-cabinet{inset:0;width:100%;height:100%;z-index:3}.mc-slot-table-symbol{position:absolute;left:64.3%;top:31.1%;width:9.4%;height:5.4%;z-index:4;background-color:#44160c;background-position-x:center;background-repeat:no-repeat;border-radius:3px}';document.head.append(style);
})();
