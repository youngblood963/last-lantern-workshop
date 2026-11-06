/* WO50 — DEVTEST-only Pirate's Poker graphical table.
 * Visual layer over R6 five-card draw. Wagers, deck, ranking, settlement,
 * save ledger, input routing and Classic BBS stay owned by gameplay engine.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
 // Read the authoritative round object: Seaport's casino can be restored
 // without the transient port55Casino navigation flag being populated.
 const pokerRound=()=>typeof r6Round==='function'?r6Round():player.flags?.r6Game;
 const isPoker=()=>stage==='r6Casino'&&pokerRound()?.game==="PIRATE'S POKER";
 const faces=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
 const suits=['♣','♦','♥','♠'];
 const symbol=n=>suits[Math.floor(n/13)];
 const rank=n=>faces[n%13];
 let selection=new Set(),roundId=null,signature='',container=null;
 const previousModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const m=previousModel.apply(this,args);
  if(isPoker()&&this.preference()==='graphics'){
   m.layout='seaport-poker';
   m.art='../devtest/assets/locations/seaport_pirates_poker.png?v=wo50';
   m.title="The Rusty Anchor — Pirate's Poker";
  }
  return m;
 };

 const style=document.createElement('style');
 style.dataset.route127SeaportPoker='wo50';
 style.textContent=`
 body.full-graphics .gfx-frame[data-layout="seaport-poker"] .gfx-art{
   position:relative;overflow:hidden;min-height:200px;isolation:isolate
 }
 body.full-graphics .gfx-frame[data-layout="seaport-poker"] .gfx-image{
   object-fit:cover!important;object-position:center 54%!important
 }
 body.full-graphics .gfx-frame[data-layout="seaport-poker"] .gfx-narrative{
   max-height:88px;min-height:32px;overflow-y:auto;flex:0 0 auto
 }
 body.full-graphics .gfx-frame[data-layout="seaport-poker"] .gfx-choices{
   max-height:122px;overflow-y:auto;flex:0 0 auto
 }
 .r127-poker-overlay{position:absolute;inset:0;z-index:6;display:flex;
   flex-direction:column;justify-content:center;align-items:center;
   gap:clamp(5px,1.2vh,12px);padding:8px 3%;box-sizing:border-box;
   pointer-events:none;text-align:center}
 .r127-poker-overlay .poker-row{display:flex;justify-content:center;
   gap:clamp(3px,.8vw,11px);width:100%;min-width:0}
 .r127-poker-overlay .poker-label{
   font:700 clamp(10px,1.05vw,14px)/1.1 Georgia,serif;letter-spacing:.11em;
   color:#ffe5b0;text-shadow:0 2px 3px #000,0 0 9px #000;
   background:#100c09d9;padding:3px 10px;border:1px solid #b18a64a8;
   border-radius:4px}
 .r127-poker-overlay .poker-card{
   position:relative;width:clamp(34px,5.5vw,72px);
   height:clamp(47px,8vw,97px);max-height:19vh;
   border-radius:6px;border:2px solid #d8c8ab;background:#f6efdc;
   color:#201c1c;box-shadow:2px 5px 10px #000c,inset 0 0 0 2px #ad9670;
   display:flex;justify-content:center;align-items:center;flex-direction:column;
   font:700 clamp(17px,2.3vw,29px)/1.04 Georgia,serif;
   animation:r127-poker-deal .35s both;
   pointer-events:none;box-sizing:border-box
 }
 .r127-poker-overlay .poker-card[data-suit="red"]{color:#a01d25}
 .r127-poker-overlay .poker-card.is-hidden{
   color:#d6bb89;background:repeating-linear-gradient(45deg,#45231d 0 7px,#713629 7px 11px);
   border-color:#e1c48d;box-shadow:2px 5px 10px #000c,inset 0 0 0 3px #321c18
 }
 .r127-poker-overlay button.poker-card{pointer-events:auto;cursor:pointer}
 .r127-poker-overlay button.poker-card:hover,.r127-poker-overlay button.poker-card:focus-visible{
   outline:2px solid #e9cb7f;outline-offset:2px}
 .r127-poker-overlay button.poker-card.is-selected{
   transform:translateY(-9px);border-color:#ffcf54;outline:3px solid #db9b3b;
   box-shadow:0 0 18px #ffca4f9c,2px 5px 10px #000c}
 .r127-poker-overlay .poker-index{
   position:absolute;bottom:2px;right:4px;font:700 10px Arial,sans-serif}
 .r127-poker-overlay .poker-controls{display:flex;align-items:center;justify-content:center;
   flex-wrap:wrap;gap:8px;pointer-events:auto}
 .r127-poker-overlay .poker-controls button{
   font:700 clamp(10px,1vw,14px) Georgia,serif;color:#ffe4b5;
   background:#28190feb;border:1px solid #c99c55;border-radius:4px;
   padding:5px 13px;cursor:pointer;box-shadow:0 2px 8px #0009}
 .r127-poker-overlay .poker-controls button:disabled{opacity:.48;cursor:default}
 .r127-poker-overlay .poker-hint{font:italic 12px Georgia,serif;
   color:#ffe8bd;text-shadow:0 2px 5px #000,0 0 8px #000}
 @keyframes r127-poker-deal{
   from{opacity:0;transform:translateY(-15px) rotateY(75deg)}
   to{opacity:1;transform:translateY(0) rotateY(0)}
 }
 @media(prefers-reduced-motion:reduce){
   .r127-poker-overlay .poker-card{animation:none}
 }
 @media(max-width:650px){
  .r127-poker-overlay{gap:4px;padding:5px 2%}
  .r127-poker-overlay .poker-card{width:clamp(27px,11vw,48px);
    height:clamp(39px,15vw,66px);font-size:18px}
  .r127-poker-overlay .poker-label{font-size:10px}
  .r127-poker-overlay .poker-controls button{padding:4px 7px}
 }
 `;
 document.head.appendChild(style);

 const previousSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=previousSync.apply(this,args);
  const art=this.element?.figure;
  if(!art||!isPoker()||this.preference()!=='graphics'){
   if(container)container.remove();
   container=null;signature='';selection.clear();roundId=null;
   return result;
  }
  const r=pokerRound();
  if(roundId!==r.id){roundId=r.id;selection.clear();signature='';}
  const state=[r.id,r.status,(r.hand||[]).join(','),(r.dealer||[]).join(',')].join('|');
  if(container?.parentElement===art&&signature===state)return result;
  signature=state;
  if(container)container.remove();
  container=document.createElement('div');
  container.className='r127-poker-overlay';
  art.appendChild(container);
  const label=(value)=>{const el=document.createElement('strong');el.className='poker-label';el.textContent=value;container.appendChild(el)};
  const row=(cards,hidden,playerHand)=>{
   const holder=document.createElement('div');holder.className='poker-row';
   cards.forEach((n,i)=>{
    const card=document.createElement(playerHand&&r.status==='active'?'button':'div');
    card.className='poker-card'+(hidden?' is-hidden':'');
    card.style.animationDelay=(i*65)+'ms';
    if(hidden){card.textContent='✦';card.setAttribute('aria-label','Mia card face down');}
    else{
     const suit=symbol(n);card.dataset.suit=(suit==='♦'||suit==='♥')?'red':'black';
     const value=document.createElement('span');value.textContent=rank(n);
     const s=document.createElement('span');s.textContent=suit;
     card.append(value,s);
     if(playerHand&&r.status==='active'){
      const num=document.createElement('small');num.className='poker-index';num.textContent=i+1;
      card.appendChild(num);card.type='button';
      card.setAttribute('aria-label','Card '+(i+1)+' '+rank(n)+' '+suit+'; toggle discard');
      card.setAttribute('aria-pressed',String(selection.has(i)));
      if(selection.has(i))card.classList.add('is-selected');
      card.addEventListener('click',()=>{
       if(selection.has(i))selection.delete(i);
       else if(selection.size<3)selection.add(i);
       for(const b of holder.querySelectorAll('button.poker-card')){
        const idx=Number(b.dataset.index);
        b.classList.toggle('is-selected',selection.has(idx));
        b.setAttribute('aria-pressed',String(selection.has(idx)));
       }
       const draw=container?.querySelector('[data-poker-draw]');
       if(draw){draw.disabled=!selection.size;draw.textContent=selection.size?'DRAW '+selection.size+' CARD'+(selection.size===1?'':'S'):'SELECT UP TO 3 CARDS';}
      });
      card.dataset.index=String(i);
     }
    }
    holder.appendChild(card);
   });
   container.appendChild(holder);
  };
  if(r.status==='waiting'){
   label("PIRATE'S POKER");
   const hint=document.createElement('div');hint.className='poker-hint';
   hint.textContent='Place a wager to deal five cards each.';
   container.appendChild(hint);
   return result;
  }
  if(!Array.isArray(r.hand)||!Array.isArray(r.dealer))return result;
  label("MIA'S HAND");
  row(r.dealer,r.status!=='settled',false);
  label('YOUR HAND');
  row(r.hand,false,true);
  if(r.status==='active'){
   const controls=document.createElement('div');controls.className='poker-controls';
   const draw=document.createElement('button');draw.type='button';draw.dataset.pokerDraw='yes';
   draw.disabled=!selection.size;draw.textContent=selection.size?'DRAW '+selection.size+' CARDS':'SELECT UP TO 3 CARDS';
   draw.addEventListener('click',()=>{
    if(!isPoker()||r.status!=='active'||!selection.size)return;
    const cmd='draw '+[...selection].sort((a,b)=>a-b).map(i=>i+1).join(' ');
    selection.clear();void handleCommand(cmd).then(()=>GraphicalUI.sync());
   });
   const stand=document.createElement('button');stand.type='button';stand.textContent='STAND — KEEP HAND';
   stand.addEventListener('click',()=>{
    if(!isPoker()||r.status!=='active')return;
    selection.clear();void handleCommand('stand').then(()=>GraphicalUI.sync());
   });
   controls.append(draw,stand);container.appendChild(controls);
  }else if(r.status==='settled'){
   const msg=document.createElement('div');msg.className='poker-label';
   msg.textContent=r.message||'ROUND COMPLETE';
   container.appendChild(msg);
  }
  return result;
 };
 GraphicalUI.schedule();
})();
