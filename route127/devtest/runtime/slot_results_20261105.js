/* DEVTEST only — graphical slot outcomes for Solace and Seaport. */
(()=>{'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
const solace=()=>stage==='mercy'&&mercyLocation==='casinoGame'&&casinoRound()?.game==='slots';
const seaport=()=>stage==='r6Casino'&&r6Round()?.game==='SLOTS';
const on=()=>GraphicalUI.preference()==='graphics'&&(solace()||seaport());
const round=()=>solace()?casinoRound():seaport()?r6Round():null;
const solaceNames={SCRAP:'Scrap',BOLTS:'Bolts',LANTERN:'Lantern',SKULL:'Skull',RAT:'Rat',BLACKGLASS:'Blackglass'};
const portNames={SCRAP:'Bolt',BOLTS:'Crab',LANTERN:'Compass',SKULL:'Treasure Chest',RAT:'Anchor',BLACKGLASS:'Mermaid'};
const style=document.createElement('style');
style.textContent=[
'body.full-graphics .gfx-frame[data-layout="casino-slots"] .gfx-narrative,body.full-graphics .gfx-frame[data-layout="seaport-slots"] .gfx-narrative{min-height:57px;max-height:80px;overflow:hidden;display:flex;align-items:center;padding:5px 10px;box-sizing:border-box}',
'body.full-graphics .gfx-frame[data-layout="casino-slots"] .gfx-narrative #screen,body.full-graphics .gfx-frame[data-layout="seaport-slots"] .gfx-narrative #screen{display:none!important}',
'.r127-slot-feedback{width:100%;text-align:center;color:#e9d4ae;font:600 clamp(12px,1.15vw,16px)/1.3 Georgia,serif;letter-spacing:.03em}',
'.r127-slot-feedback strong{display:block;font-size:clamp(16px,1.5vw,21px);color:#f9e5bf;text-shadow:0 2px 4px #000}',
'.r127-slot-feedback[data-outcome="win"] strong,.r127-slot-feedback[data-outcome="jackpot"] strong{color:#ffe07e;text-shadow:0 0 13px #f6aa3d}',
'.r127-slot-feedback[data-outcome="loss"] strong{color:#d2c1a7}',
'.r127-slot-feedback[data-outcome="jackpot"]{animation:r127-slot-celebrate .7s ease-in-out 3 alternate}',
'@keyframes r127-slot-celebrate{from{filter:brightness(1)}to{filter:brightness(1.65)}}',
'@media(prefers-reduced-motion:reduce){.r127-slot-feedback[data-outcome="jackpot"]{animation:none}}'
].join('\n');document.head.appendChild(style);
let last='',timer=0;
function paint(r,spinning){
 if(!on())return;const box=GraphicalUI.element?.narrative;if(!box)return;
 let el=box.querySelector('.r127-slot-feedback');
 if(!el){el=document.createElement('div');el.className='r127-slot-feedback';el.setAttribute('role','status');el.setAttribute('aria-live','polite');box.prepend(el)}
 let title,detail,kind='ready';
 if(r.status!=='settled'){title='PLACE YOUR WAGER';detail=seaport()?'Bet 10, 20, 50, Custom, or All In.':'Bet 10, 20, 50, Custom, or All In.';}
 else if(spinning){title='REELS SPINNING…';detail='Wager: '+r.bet+' Bolts';kind='spin';}
 else{
  const winning=r.payout>0;const triple=Array.isArray(r.reels)&&r.reels.length===3&&r.reels.every(x=>x===r.reels[0]);
  const names=seaport()?portNames:solaceNames;const symbol=triple?names[r.reels[0]]||r.reels[0]:'';
  const jackpot=winning&&triple&&r.reels[0]==='BLACKGLASS';
  title=jackpot?'JACKPOT! '+symbol.toUpperCase()+'!':winning?(triple?'THREE '+symbol.toUpperCase()+'! YOU WIN!':'YOU WIN!'):'NO MATCH — TRY AGAIN';
  detail='Wager '+r.bet+' · Payout '+r.payout+' · Net '+(r.payout-r.bet)+' Bolts';
  kind=jackpot?'jackpot':winning?'win':'loss';
 }
 el.dataset.outcome=kind;el.replaceChildren();
 const a=document.createElement('strong');a.textContent=title;
 const b=document.createElement('span');b.textContent=detail;el.append(a,b);
}
function reset(){if(timer)clearTimeout(timer);timer=0;last='';GraphicalUI.element?.narrative?.querySelector('.r127-slot-feedback')?.remove()}
function refresh(){
 if(!on()){if(last||timer)reset();return}
 const r=round();if(!r)return;
 const sig=(seaport()?'port':'solace')+':'+r.id+':'+r.status+':'+(r.reels||[]).join('/')+':'+r.payout;
 if(sig===last){if(!GraphicalUI.element?.narrative?.querySelector('.r127-slot-feedback'))paint(r,false);return}
 if(timer){clearTimeout(timer);timer=0}last=sig;
 if(r.status==='settled'&&Array.isArray(r.reels)){
  paint(r,true);const key=sig;
  const ms=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0:2350;
  timer=setTimeout(()=>{timer=0;if(on()&&last===key)paint(r,false)},ms);
 }else paint(r,false);
}
const previous=GraphicalUI.sync;GraphicalUI.sync=function(...args){const result=previous.apply(this,args);refresh();return result};
GraphicalUI.schedule();
})();