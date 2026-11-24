/* Outcome-driven presentation; no random draws or money transfers here.
 * Reel translation follows the existing Seaport animated-strip technique. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
const C=MotelCasino,asset=f=>new URL('../devtest/assets/locations/casino/'+f,document.baseURI).href;
const style=document.createElement('style');style.textContent=`
body.full-graphics .gfx-frame[data-layout="motel-casino"] .gfx-main{display:flex;flex-direction:column;min-height:0;gap:6px}
body.full-graphics .gfx-frame[data-layout="motel-casino"] .gfx-art{position:relative;flex:1 1 0;min-height:155px;max-height:none;overflow:hidden;background:#100b08!important}
body.full-graphics .gfx-frame[data-layout="motel-casino"] .gfx-image{object-fit:contain!important}
body.full-graphics .gfx-frame[data-layout="motel-casino"] .gfx-narrative{flex:0 0 auto;max-height:78px;overflow:auto}
body.full-graphics .gfx-frame[data-layout="motel-casino"] .gfx-choices{flex:0 0 auto;max-height:148px;overflow:auto}
body.full-graphics .gfx-frame[data-layout="motel-casino"] .gfx-narrative:has(.r127-slot-feedback) #screen{display:none!important}
.motel-casino-plane{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:6}
.motel-casino-plane img{max-width:none;max-height:none}
.motel-reel{position:absolute;top:29.9%;height:38.5%;width:10.7%;overflow:hidden;background:#d3b77b;border-radius:8%;box-shadow:inset 0 0 8px #000}
.motel-reel[data-reel="0"]{left:23.1%}.motel-reel[data-reel="1"]{left:35.5%}.motel-reel[data-reel="2"]{left:47.7%}
.motel-reel-scroll{position:absolute;left:0;top:0;width:100%}.motel-reel-cell{width:100%;background-repeat:no-repeat}
.motel-reel:after{content:'';position:absolute;inset:0;box-shadow:inset 0 10px 12px #0009,inset 0 -10px 12px #0009;background:linear-gradient(90deg,#0007,transparent 20%,#fff2 50%,transparent 80%,#0007)}
.motel-panel{flex:0 0 auto;max-height:33vh;overflow:auto;background:#1b160f;color:#f5ddb0;padding:8px;border:1px solid #99794c;font:14px/1.3 Georgia,serif}
.motel-ticket{background:linear-gradient(135deg,#d5bd91,#ead8b0 50%,#cdb084);color:#281e10;border:2px dashed #71552c;box-shadow:inset 0 0 18px #6b4c2444}.motel-panel.motel-ticket .motel-feedback{color:#362817}
.motel-panel button,.motel-panel select,.motel-panel input{font:inherit;color:#fff;background:#17130e;border:1px solid #b19159;min-height:36px;padding:5px;box-sizing:border-box}
.motel-panel button{cursor:pointer}.motel-panel button:focus-visible{outline:2px solid #ffd071}.motel-panel label{display:inline-flex;gap:6px;align-items:center}
.motel-panel .ticket-fields{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0}.motel-panel .ticket-fields input{width:54px;color:#21180e;background:#e5cea1;font-weight:bold}
.motel-panel .ticket-fields .hit{background:#6ab77d}.motel-panel .motel-feedback{padding:4px 0;color:#ffe1a0}.motel-panel table{border-collapse:collapse;width:100%;font-size:14px}.motel-panel th,.motel-panel td{border:1px solid #776346;padding:3px;text-align:center}
@media(max-width:650px){
body.full-graphics .gfx-frame[data-layout="motel-casino"] .gfx-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:40px;height:88px;min-height:88px;max-height:176px;gap:4px}
body.full-graphics .gfx-frame[data-layout="motel-casino"] .gfx-choices:has(button:nth-child(5)){height:132px;min-height:132px}
body.full-graphics .gfx-frame[data-layout="motel-casino"] .gfx-choices:has(button:nth-child(7)){height:176px;min-height:176px}
body.full-graphics .gfx-frame[data-layout="motel-casino"] .gfx-narrative{max-height:42px}
.motel-panel{max-height:145px}.motel-panel .ticket-fields input{width:45px}.motel-panel button{min-height:38px}}
`;document.head.appendChild(style);
let scene=null,panel=null,key='',animations=[],observer=null,lastAnimated='';
function stop(){for(const a of animations)try{a.cancel();}catch{}animations=[];}
function clear(){stop();observer?.disconnect();observer=null;scene?.remove();panel?.remove();scene=panel=null;key='';}
function el(tag,cls,parent){const n=document.createElement(tag);if(cls)n.className=cls;if(parent)parent.appendChild(n);return n;}
function button(parent,label,fn){const b=el('button','',parent);b.type='button';b.textContent=label;b.addEventListener('click',fn);return b;}
const dispatch=async cmd=>{await handleCommand(cmd);GraphicalUI.sync();};
function fit(figure){if(!scene)return;const b=figure.getBoundingClientRect(),scale=Math.min(b.width/1671,b.height/941);scene.style.width=1671*scale+'px';scene.style.height=941*scale+'px';}
function buildSlots(){
 for(let i=0;i<3;i++){const win=el('div','motel-reel',scene);win.dataset.reel=i;const scroll=el('div','motel-reel-scroll',win);
  for(let copy=0;copy<5;copy++)for(let index=0;index<6;index++){const cell=el('div','motel-reel-cell',scroll);cell.dataset.index=index;cell.style.backgroundImage=`url("${asset('motel_slot_reel_strip.png')}")`;}
 }
}
// Logical tiers map to printed paytable, not the strip's different source order.
const slotRows=[5,0,1,3,4,2],centers=[140,379,601,822,1062,1340];
function poseSlots(r,animate){
 const ids=(r.reels||['SCRAP','LANTERN','BOLTS']).map(s=>SLOT_SYMBOLS.findIndex(x=>x.name===s));
 scene.setAttribute('aria-label','The Lounge slots: '+ids.map(i=>C.slotNames[i]).join(', '));
 [...scene.querySelectorAll('.motel-reel')].forEach((win,i)=>{
  const width=win.getBoundingClientRect().width,cell=width*.72,full=cell*6,scale=full/1536;
  for(const icon of win.querySelectorAll('.motel-reel-cell')){icon.style.height=cell+'px';icon.style.backgroundSize=(1024*scale)+'px '+full+'px';icon.style.backgroundPosition=(width/2-512*scale)+'px '+(cell/2-centers[slotRows[+icon.dataset.index]]*scale)+'px';}
  const top=(idx,loop)=>win.getBoundingClientRect().height/2-(loop*6+idx+.5)*cell;
  const scroll=win.querySelector('.motel-reel-scroll'),to=top(ids[i],3);scroll.style.transform=`translateY(${to}px)`;
  if(animate&&scroll.animate&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)animations.push(scroll.animate([{transform:`translateY(${top(0,0)}px)`},{transform:`translateY(${to}px)`}],{duration:1450+i*420,easing:'cubic-bezier(.16,.82,.28,1)'}));
 });
}

function buildSix(r){
 const wheel=el('img','motel-six-wheel',scene);wheel.src=asset('motel_bigsix_wheel.png');wheel.alt='Six equal numbered segments';
 Object.assign(wheel.style,{position:'absolute',width:'43%',height:'76.4%',left:'28.5%',top:'15.5%',objectFit:'contain'});
 const pointer=el('img','motel-six-pointer',scene);pointer.src=asset('motel_bigsix_pointer.png');pointer.alt='Fixed wheel pointer';
 Object.assign(pointer.style,{position:'absolute',width:'12%',height:'24%',left:'44%',top:'7%',objectFit:'contain',zIndex:2});
 const target=r.status==='settled'?((6-(r.winner-1))%6)*60:0;
 wheel.style.transform='rotate('+target+'deg)';
 scene.setAttribute('aria-label',r.status==='settled'?'Winning number '+r.winner:'Big Six wheel ready');
 if(r.status==='settled'&&lastAnimated!==r.id){
  if(wheel.animate&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)animations.push(wheel.animate([{transform:'rotate(0deg)',offset:0},{transform:'rotate(90deg)',offset:.18},{transform:'rotate('+(1800+target)+'deg)',offset:1}],{duration:4200,easing:'cubic-bezier(.18,.65,.12,1)'}));
  lastAnimated=r.id;
 }
}


function makePanel(figure){panel=el('div','motel-panel');figure.parentElement.insertBefore(panel,figure.nextSibling);return panel;}
function buildKeno(r,figure){
 const board=el('div','motel-keno-grid',scene);Object.assign(board.style,{position:'absolute',left:'6.1%',top:'17.3%',width:'88.3%',height:'75.2%',display:'grid',gridTemplateColumns:'repeat(10,1fr)',gridTemplateRows:'repeat(8,1fr)'});
 for(let n=1;n<=80;n++){const light=el('div','motel-keno-light',board);light.dataset.number=n;light.setAttribute('aria-label',String(n));}
 makePanel(figure);panel.classList.add('motel-ticket');
 const label=el('label','',panel);label.append('Spots ');const spots=el('select','',label);spots.setAttribute('aria-label','Keno spot count');
 for(let n=2;n<=10;n++){const option=el('option','',spots);option.value=n;option.textContent=n;}spots.value=r.ticket.length;spots.disabled=r.status!=='waiting';
 button(panel,'Quick Pick',()=>{if(r.status!=='waiting')return;C.setTicket(C.drawNumbers(+spots.value));fields();C.render();GraphicalUI.sync();}).disabled=r.status!=='waiting';
 button(panel,'Clear',()=>{if(r.status!=='waiting')return;r.ticket=Array(+spots.value).fill(0);r6CasinoSave();fields();C.render();GraphicalUI.sync();}).disabled=r.status!=='waiting';
 const inputs=el('div','ticket-fields',panel),feedback=el('div','motel-feedback',panel),table=el('div','motel-keno-paytable',panel);
 function fields(){
  inputs.replaceChildren();r.ticket.forEach((n,i)=>{const field=el('input','',inputs);field.type='number';field.min=1;field.max=80;field.value=n||'';field.disabled=r.status!=='waiting';field.setAttribute('aria-label','Keno number '+(i+1));field.classList.toggle('hit',r.hits?.includes(n)||false);
   field.addEventListener('change',()=>{if(r.status!=='waiting')return;r.ticket=[...inputs.querySelectorAll('input')].map(x=>Number(x.value));r6CasinoSave();update();C.render();GraphicalUI.sync();});
  });update();
 }
 function update(){feedback.textContent=C.validTicket(r.ticket)?r.status==='settled'?r.hits.length+' matches':'Ticket ready. Choose a wager below.':'Enter unique numbers from 1 to 80 in every field.';
 table.textContent='Total returns (stake included): '+Object.entries(C.KENO[r.ticket.length]).map(([hits,m])=>hits+' matches = '+m+'×').join(' · ')+' · All other matches pay 0.';}
 spots.addEventListener('change',()=>{if(r.status!=='waiting')return;const count=+spots.value;r.ticket=Array.from({length:count},(_,i)=>r.ticket[i]||0);r6CasinoSave();fields();C.render();GraphicalUI.sync();});fields();
 const css=el('style','',scene);css.textContent='.motel-keno-light{border-radius:12%;box-shadow:inset 0 0 5px #0003}.motel-keno-light.selected{background:#1589ff66;box-shadow:inset 0 0 12px #198aff}.motel-keno-light.drawn{animation:motel-keno-light .2s step-end both}@keyframes motel-keno-light{from{background:var(--before,transparent)}to{background:var(--light,#ffa82488);box-shadow:inset 0 0 14px var(--light,#ffa824)}}';
}
function paintKeno(r){
 for(const light of scene.querySelectorAll('.motel-keno-light')){const n=+light.dataset.number,selected=r.ticket.includes(n),index=r.draw?.indexOf(n)??-1;
 light.classList.toggle('selected',selected);light.style.setProperty('--before',selected?'#1589ff66':'transparent');
 if(index>=0){light.style.setProperty('--light',selected?'#32d66899':'#ffa82499');light.style.animationDelay=(index*.16)+'s';light.classList.add('drawn');}
 }
}

function buildRoulette(r,figure){
 const holder=el('div','motel-roulette-wheel',scene);Object.assign(holder.style,{position:'absolute',left:'3%',top:'27%',width:'31%',height:'55%',transform:'scaleY(.53)'});
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','-110 -110 220 220');svg.style.width='100%';svg.style.height='100%';holder.appendChild(svg);
 const rotor=document.createElementNS(ns,'g');svg.appendChild(rotor);
 function point(radius,angle){const rad=angle*Math.PI/180;return [radius*Math.sin(rad),-radius*Math.cos(rad)];}
 const delta=360/37;
 C.ORDER.forEach((n,i)=>{const a=point(103,i*delta-delta/2),b=point(103,i*delta+delta/2),c=point(67,i*delta+delta/2),d=point(67,i*delta-delta/2);
  const path=document.createElementNS(ns,'path');path.setAttribute('d',`M ${a} A 103 103 0 0 1 ${b} L ${c} A 67 67 0 0 0 ${d} Z`);path.setAttribute('fill',n===0?'#17512a':C.RED.has(n)?'#8f2117':'#17130e');path.setAttribute('stroke','#b7964b');path.setAttribute('stroke-width','1');rotor.appendChild(path);
  const text=document.createElementNS(ns,'text'),pt=point(84,i*delta);text.setAttribute('x',pt[0]);text.setAttribute('y',pt[1]);text.setAttribute('fill','#ffe9af');text.setAttribute('font-size','9');text.setAttribute('font-family','Georgia');text.setAttribute('text-anchor','middle');text.setAttribute('dominant-baseline','middle');text.setAttribute('transform',`rotate(${i*delta} ${pt[0]} ${pt[1]})`);text.textContent=n;rotor.appendChild(text);
 });
 const hub=document.createElementNS(ns,'circle');hub.setAttribute('r','66');hub.setAttribute('fill','#7a4f21');hub.setAttribute('stroke','#c6a556');hub.setAttribute('stroke-width','3');rotor.appendChild(hub);
 const handle=el('img','motel-roulette-handle',scene);handle.src=asset('motel_roulette_handle.png');handle.alt='Brass spindle handle';Object.assign(handle.style,{position:'absolute',left:'10%',top:'39%',width:'17%',height:'28%',objectFit:'contain',zIndex:2});
 const orbit=el('div','motel-ball-orbit',holder);Object.assign(orbit.style,{position:'absolute',inset:'0'});
 const ball=el('img','motel-roulette-ball',orbit);ball.src=asset('motel_roulette_ball.png');ball.alt='Roulette ball';Object.assign(ball.style,{position:'absolute',width:'6%',height:'6%',objectFit:'contain',left:'47%',top:'8%'});
 const idx=r.status==='settled'?C.ORDER.indexOf(r.winner):0,target=(360-idx*delta)%360;rotor.style.transform='rotate('+target+'deg)';rotor.style.transformOrigin='0px 0px';
 // Pockets rotate clockwise. The ball initially runs counterclockwise, then stops at top.
 if(r.status==='settled'&&lastAnimated!==r.id&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&rotor.animate){
  animations.push(rotor.animate([{transform:'rotate(0deg)'},{transform:'rotate('+(1800+target)+'deg)'}],{duration:4600,easing:'cubic-bezier(.12,.5,.18,1)'}));
  animations.push(orbit.animate([{transform:'rotate(0deg)'},{transform:'rotate(-2160deg)'}],{duration:4700,easing:'cubic-bezier(.16,.65,.12,1)'}));lastAnimated=r.id;
 }
 scene.setAttribute('aria-label',r.status==='settled'?'Roulette winning pocket '+r.winner:'European roulette wheel');
 // Correct the AI-printed columns and red/black assignments with an authoritative felt.
 const felt=el('div','motel-felt motel-felt-scene',scene);Object.assign(felt.style,{position:'absolute',left:'39%',top:'42%',width:'57%',height:'35%',pointerEvents:'auto'});
 makePanel(figure);const controls=el('div','motel-felt-controls',panel),label=el('label','',controls);label.append('Inside bet ');
 const mode=el('select','',label);mode.setAttribute('aria-label','Roulette inside bet type');
 for(const [value,text]of [['single','Single number'],['split','Split: click two neighbors'],['street','Street: click a row'],['corner','Corner: click lowest number'],['six','Six-line: click lowest row']]){const op=el('option','',mode);op.value=value;op.textContent=text;}
 mode.value=r.betMode||'single';mode.disabled=r.status!=='waiting';mode.addEventListener('change',()=>{r.betMode=mode.value;delete r.splitFirst;paintChips(r);});
 const help=el('div','motel-feedback',controls);help.textContent='Place chips on the felt. On narrow screens, scroll the enlarged felt below. Payouts are total returns including stake.';
 const scroll=el('div','motel-felt-scroll',panel),large=el('div','motel-felt motel-felt-large',scroll);
 function clickNumber(n){
  if(r.status!=='waiting')return;
  const mode=r.betMode||'single';let id='n'+n;
  if(mode==='split'){
   if(r.splitFirst==null){r.splitFirst=n;help.textContent='Now choose a neighboring number for the split.';paintChips(r);return;}
   const a=Math.min(r.splitFirst,n),b=Math.max(r.splitFirst,n);id='split'+a+'-'+b;delete r.splitFirst;
  }else if(mode==='street')id='street'+(Math.floor((n-1)/3)*3+1);
  else if(mode==='corner')id='corner'+n;
  else if(mode==='six')id='six'+(Math.floor((n-1)/3)*3+1);
  if(!C.BETS.some(b=>b.id===id)){help.textContent='That is not a valid '+mode+' position. Choose neighboring numbers or a valid lowest corner/row.';return;}
  if(C.place(id))help.textContent=C.BETS.find(b=>b.id===id).label+' · '+r.stake+' Bolts';else help.textContent='Not enough Bolts, or combined stakes exceed 1,000.';
  paintChips(r);C.render();GraphicalUI.sync();
 }
 function surface(parent){
  const grid=el('div','motel-number-grid',parent);
  const zero=button(grid,'0',()=>clickNumber(0));zero.dataset.bet='n0';zero.className='motel-number zero';zero.style.gridColumn='1';zero.style.gridRow='1 / 4';
  for(let row=0;row<3;row++){
   for(let col=0;col<12;col++){const n=(col+1)*3-row,b=button(grid,String(n),()=>clickNumber(n));b.dataset.bet='n'+n;b.dataset.number=n;b.className='motel-number '+(C.RED.has(n)?'red':'black');b.style.gridColumn=col+2;b.style.gridRow=row+1;b.title='Number '+n+' — 35:1 net';}
   const column=3-row,b=button(grid,'2:1',()=>{if(C.place('column'+column)){paintChips(r);C.render();GraphicalUI.sync();}});b.dataset.bet='column'+column;b.style.gridColumn=14;b.style.gridRow=row+1;b.setAttribute('aria-label','Column '+column);
  }
  const outside=el('div','motel-outside',parent);
  for(const id of ['dozen1','dozen2','dozen3','low','even','red','black','odd','high']){const def=C.BETS.find(b=>b.id===id),b=button(outside,def.label,()=>{if(C.place(id)){paintChips(r);C.render();GraphicalUI.sync();}});b.dataset.bet=id;b.className=id;b.title=(def.mult-1)+':1 net';}
  for(const b of parent.querySelectorAll('button'))b.disabled=r.status!=='waiting';
 }
 surface(felt);surface(large);
 const list=el('div','motel-chip-list',panel);list.setAttribute('aria-live','polite');
 const payouts=el('div','motel-feedback',panel);payouts.textContent='Net odds: single 35:1 · split 17:1 · street 11:1 · corner 8:1 · six-line 5:1 · dozen/column 2:1 · outside 1:1.';
 const css=el('style','',scene);css.textContent=`.motel-felt{position:relative;background:#153f27;color:#f3d591;border:2px solid #a18a4d;box-sizing:border-box;display:flex;flex-direction:column}.motel-number-grid{display:grid;grid-template-columns:1.1fr repeat(12,1fr) 1.2fr;grid-template-rows:repeat(3,minmax(0,1fr));flex:3;min-height:0}.motel-felt button{position:relative;min-width:0;min-height:0;padding:0;border:1px solid #bdab72;color:#ffe7aa;background:#123e26;border-radius:0;font:700 14px/1 Georgia,serif;cursor:pointer;overflow:hidden}.motel-felt .red{background:#831e1a}.motel-felt .black{background:#131612}.motel-outside{display:grid;grid-template-columns:repeat(6,1fr);grid-template-rows:repeat(2,minmax(0,1fr));min-height:0;flex:2}.motel-outside button:nth-child(-n+3){grid-column:span 2}.motel-felt button:focus-visible{outline:2px solid #fff;z-index:4}.motel-chip{position:absolute;right:0;bottom:0;min-width:15px;border-radius:50%;background:#942f2e;color:white;border:2px dashed #f3e4c0;font:bold 10px Arial;padding:2px;pointer-events:none;box-shadow:0 1px 4px #000}.motel-felt-scroll{overflow-x:auto;margin-top:6px}.motel-felt-large{min-width:640px;height:185px}.motel-felt-scene button{font-size:clamp(8px,1.25vw,20px)}.motel-felt-scene .motel-chip{font-size:8px;padding:0;min-width:12px}.motel-chip-list{padding:5px;color:#ffe6b6}.motel-number.pending{outline:2px solid #56b4ff;z-index:3}.motel-felt-controls{display:flex;flex-wrap:wrap;gap:6px}@media(min-width:951px){.motel-felt-scroll{display:none}}`;
}
function paintChips(r){
 const nodes=[...scene.querySelectorAll('[data-bet]'),...panel.querySelectorAll('[data-bet]')];
 for(const b of nodes){b.querySelector('.motel-chip')?.remove();const total=r.bets.filter(c=>c.id===b.dataset.bet).reduce((s,c)=>s+c.amount,0);if(total){const chip=el('span','motel-chip',b);chip.textContent=total;}
 b.classList.toggle('pending',b.dataset.number!=null&&+b.dataset.number===r.splitFirst);}
 for(const felt of [scene.querySelector('.motel-felt-scene'),panel.querySelector('.motel-felt-large')]){
  for(const chip of felt.querySelectorAll('.motel-group-chip'))chip.remove();
  for(const id of new Set(r.bets.map(c=>c.id).filter(id=>/^(split|street|corner|six)/.test(id)))){
   const def=C.BETS.find(b=>b.id===id),positions=def.numbers.map(n=>n===0?[.5/14,.3]:[(Math.floor((n-1)/3)+1.5)/14,((3-(n%3||3))+.5)/3*.6]);
   const chip=el('span','motel-chip motel-group-chip',felt);chip.textContent=r.bets.filter(c=>c.id===id).reduce((s,c)=>s+c.amount,0);chip.title=def.label;chip.setAttribute('aria-label',def.label+' '+chip.textContent+' Bolts');
   Object.assign(chip.style,{left:positions.reduce((s,p)=>s+p[0],0)/positions.length*100+'%',top:positions.reduce((s,p)=>s+p[1],0)/positions.length*100+'%',right:'auto',bottom:'auto',transform:'translate(-50%,-50%)',zIndex:4});
  }
 }
 const list=panel.querySelector('.motel-chip-list');if(list)list.textContent='Chip: '+r.stake+' Bolts · Total: '+r.bets.reduce((s,c)=>s+c.amount,0)+' / 1,000 · '+(r.bets.map(c=>C.BETS.find(b=>b.id===c.id)?.label+' '+c.amount).join(' · ')||'No bets placed');
}
function refresh(){
 const r=C.round(),figure=GraphicalUI.element?.figure;
 if(!figure||!C.inGame()||GraphicalUI.preference()!=='graphics'||r.game==="PIRATE'S POKER"){clear();return;}
 const next=r.id+':'+r.status;
 if(!scene||scene.parentElement!==figure||key!==next){
  clear();key=next;scene=el('div','motel-casino-plane',figure);scene.setAttribute('role','img');fit(figure);
  if(r.game==='SLOTS')buildSlots();
  if(r.game==='BIG SIX WHEEL')buildSix(r);
  if(r.game==='KENO')buildKeno(r,figure);
  if(r.game==='ROULETTE')buildRoulette(r,figure);
  observer=typeof ResizeObserver==='function'?new ResizeObserver(()=>{fit(figure);if(r.game==='SLOTS')poseSlots(r,false);}):null;observer?.observe(figure);
 }
 if(r.game==='KENO')paintKeno(r);
 if(r.game==='ROULETTE')paintChips(r);
 if(r.game==='SLOTS'){const animate=r.status==='settled'&&lastAnimated!==r.id;poseSlots(r,animate);if(animate)lastAnimated=r.id;}
}
const sync=GraphicalUI.sync;GraphicalUI.sync=function(){const result=sync.apply(this,arguments);refresh();return result;};
globalThis.MotelCasinoGraphics={refresh};
})();
