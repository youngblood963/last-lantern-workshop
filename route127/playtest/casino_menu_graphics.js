/* Route 127 Casino graphical menu, preserved + Wasteland High/Low upgrade.
 * Runs after casino.js and graphics.js. No map or unrelated game changes. */
(function(){
 'use strict';
 if(typeof GraphicalUI==='undefined'||typeof handleCasinoCommand!=='function')return;
 const graphic=()=>GraphicalUI.preference()==='graphics';
 const atMenu=()=>stage==='mercy'&&mercyLocation==='casino';
 const options=[
   {key:'1',command:'dice',label:'Dice'},
   {key:'2',command:'slots',label:'Slots'},
   {key:'3',command:'rock paper scissors',label:'Rock Paper Scissors'},
   {key:'4',command:'blackjack',label:'Blackjack'},
   {key:'5',command:'rat racing',label:'Rat Racing'},
   {key:'6',command:'back',label:'Back to Bar'}
 ];
 const oldModel=GraphicalUI.model;
 GraphicalUI.model=function(){
   const m=oldModel.call(this);
   if(graphic()&&atMenu()){
     m.layout='casino-menu';
     m.art='assets/locations/rusty_lantern_casino.png';
     m.title=player.flags.port55Casino?'The Rusty Anchor — Casino':'The Rusty Lantern — Casino';
   }
   return m;
 };
 const oldChoices=GraphicalUI.choices;
 GraphicalUI.choices=function(){return graphic()&&atMenu()?options.map(x=>({...x})):oldChoices.call(this);};
 const oldDispatch=GraphicalUI.dispatch;
 GraphicalUI.dispatch=async function(choice){
   if(graphic()&&atMenu()){
     if(busy||!options.some(x=>x.command===choice.command))return false;
     await handleCommand(choice.command);
     this.sync();
     return true;
   }
   return oldDispatch.call(this,choice);
 };
 const oldHandler=handleCasinoCommand;
 handleCasinoCommand=function(cmd){
   if(!graphic()||stage!=='mercy')return oldHandler(cmd);
   if(atMenu()&&(cmd==='slots'||cmd==='rat racing'||cmd==='rats')){
     casinoOpen(cmd==='slots'?'slots':'rats');return true;
   }
   if(mercyLocation!=='casinoGame'||player.level>=5)return oldHandler(cmd);
   const r=casinoRound();
   if(!r||!['slots','rats'].includes(r.game))return oldHandler(cmd);
   if(r.status==='settled'){
     if(cmd==='play again'||cmd==='p')casinoOpen(r.game);
     else if(['b','back','leave','casino'].includes(cmd))casinoMenu();
     else casinoRender();
     return true;
   }
   if(['b','back','leave','leave table','casino','town','return to town'].includes(cmd)){
     if((r.custom||r.allInEven)&&['b','back'].includes(cmd)){
       delete r.custom;delete r.allInEven;casinoRender();return true;
     }
     if(cmd==='town'||cmd==='return to town')return oldHandler(cmd);
     casinoMenu();return true;
   }
   if(r.status==='waiting'){
     if(cmd==='custom wager'||cmd==='custom'||cmd==='c'){
       r.custom=true;delete r.allInEven;casinoRender();return true;
     }
     if(cmd==='all in'||cmd==='a')cmd='wager '+player.bolts;
     if(r.custom&&/^[0-9]+$/.test(cmd))cmd='wager '+cmd;
   }
   if(r.game==='rats'&&r.pick===null){
     const match=cmd.match(/^(?:rat\s+)?([1-4])$/);
     const named=CASINO_RATS.findIndex(n=>n.toLowerCase()===cmd);
     if(match)r.pick=Number(match[1])-1;
     else if(named>=0)r.pick=named;
     else add('Choose one of the four rats.','system');
     casinoRender();return true;
   }
   if(!casinoWager(cmd,r)){
     add('INVALID WAGER — choose positive whole Bolts within your carried balance.','system');
     casinoRender();return true;
   }
   delete r.custom;delete r.allInEven;
   casinoResolve(r);
   return true;
 };
 document.addEventListener('keydown',event=>{
   if(!graphic()||!atMenu()||event.altKey||event.ctrlKey||event.metaKey||event.repeat)return;
   if(!/^[1-6]$/.test(event.key))return;
   const target=event.target;
   if(target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
   if(target?.closest?.('button'))return;
   event.preventDefault();
   const choice=options[Number(event.key)-1];
   if(choice)void GraphicalUI.dispatch(choice);
 });
 GraphicalUI.schedule();
})();

/* HIGH / LOW: replaces only the legacy single-die casino game's presentation
 * and outcome. Uses existing round, wager, payout and save functions. */
(function(){
 'use strict';
 if(typeof casinoRound!=='function'||typeof GraphicalUI==='undefined')return;
 const atDice=()=>stage==='mercy'&&mercyLocation==='casinoGame'&&casinoRound()?.game==='dice';
 const gfx=()=>GraphicalUI.preference()==='graphics';
 const valid=new Set(['low','seven','high']);
 function diceRoll(rng=Math.random){return [1+Math.floor(rng()*6),1+Math.floor(rng()*6)];}
 function payout(bet,pick,a,b){
   const total=a+b,doubles=a===b;
   const win=pick==='low'?total<=6:pick==='high'?total>=8:total===7;
   return win?bet*(pick==='seven'?5:doubles?3:2):0;
 }
 const oldRender=casinoRender;
 casinoRender=function(){
   const r=casinoRound();
   if(!r||r.game!=='dice')return oldRender();
   if(r.status==='waiting'&&!valid.has(r.pick))r.pick=null; // old one-die picks are no longer valid
   mercyLocation='casinoGame';
   add('WASTELAND HIGH / LOW — TWO DICE','place');
   if(r.status==='settled'){
     add(r.message||'ROUND COMPLETE','reward');
     add(`WAGER ${r.bet} / RETURN ${r.payout} / NET ${r.payout-r.bet} BOLTS`,'system');
     casinoChoices('PLAY AGAIN   (B) BACK');return;
   }
   if(r.pick===null){
     add('LOW: totals 2–6 (2×).  LUCKY SEVEN: exactly 7 (5×).  HIGH: 8–12 (2×). Winning doubles on LOW/HIGH pay 3×. All payouts include your stake.','system');
     casinoChoices('(L) LOW   (S) LUCKY SEVEN   (H) HIGH   (B) BACK');
     return;
   }
   add('YOUR PICK: '+(r.pick==='seven'?'LUCKY SEVEN':r.pick.toUpperCase()),'system');
   if(r.custom){add('CUSTOM WAGER — enter a positive whole number of Bolts.','system');casinoChoices('(B) BACK');return;}
   casinoWagerMenu();
 };
 const oldResolve=casinoResolve;
 casinoResolve=function(r){
   if(r.game!=='dice')return oldResolve(r);
   if(r.status!=='active')return;
   const [a,b]=diceRoll(),total=a+b,win=(r.pick==='low'?total<=6:r.pick==='high'?total>=8:total===7);
   const pay=payout(r.bet,r.pick,a,b),doubleWin=win&&a===b&&r.pick!=='seven';
   r.dicePair=[a,b];r.diceSum=total;r.diceDouble=doubleWin;
   const label=doubleWin?' — DOUBLES BONUS!':win?' — WIN!':' — LOSS';
   casinoSettle(r,pay,`DICE ${a} + ${b} = ${total}${label}`);
   casinoRender();
 };
 const oldHandler=handleCasinoCommand;
 handleCasinoCommand=function(cmd){
   if(atDice()){
     const r=casinoRound();
     // Select LOW / SEVEN / HIGH using existing command routing; don't interfere
     // with bets, Back, Custom or Play Again.
     if(r.status==='waiting'&&r.pick===null){
       const picks={l:'low',low:'low',s:'seven',seven:'seven','lucky seven':'seven',h:'high',high:'high'};
       if(Object.prototype.hasOwnProperty.call(picks,cmd)){
         r.pick=picks[cmd];casinoRender();return true;
       }
     }
   }
   return oldHandler(cmd);
 };
 // Only the dice table receives a special visual scene.
 const baseModel=GraphicalUI.model;
 GraphicalUI.model=function(){
   const model=baseModel.call(this);
   if(gfx()&&atDice()){
     model.layout='casino-dice';model.art='';
     model.title='Rusty Lantern — Wasteland High / Low';
   }
   return model;
 };
 const style=document.createElement('style');
 style.textContent=`
 body.full-graphics .gfx-frame[data-layout="casino-dice"] .gfx-main{display:flex;flex-direction:column;min-height:0;height:100%;overflow:hidden;gap:7px}
 body.full-graphics .gfx-frame[data-layout="casino-dice"] .gfx-art{display:flex;flex:1 1 0;min-height:145px;max-height:calc(100% - 165px);overflow:hidden;background:#160f0b!important;border:1px solid #6d4c33}
 body.full-graphics .gfx-frame[data-layout="casino-dice"] .gfx-art-caption,
 body.full-graphics .gfx-frame[data-layout="casino-dice"] .gfx-art-error,
 body.full-graphics .gfx-frame[data-layout="casino-dice"] .gfx-image{display:none!important}
 body.full-graphics .gfx-frame[data-layout="casino-dice"] .gfx-narrative{flex:0 0 auto;max-height:82px;overflow:auto;font-size:13px}
 body.full-graphics .gfx-frame[data-layout="casino-dice"] .gfx-choices{flex:0 0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;min-height:51px;max-height:120px;overflow-y:auto}
 body.full-graphics .gfx-frame[data-layout="casino-dice"] .gfx-choice{min-height:43px;min-width:0;padding:3px 7px}
 body.full-graphics .gfx-frame[data-layout="casino-dice"] .gfx-choice-label{font-size:clamp(12px,1vw,16px);white-space:normal}
 .hl-table{position:absolute;inset:0;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(6px,2%,15px);color:#f5dda7;text-shadow:0 2px 4px #000;padding:12px;background:radial-gradient(ellipse at 50% 57%,#456149 0%,#283c31 45%,#15231e 77%,#0b100e 100%)}
 .hl-table:before{content:'';position:absolute;inset:5%;border:10px ridge #61442a;border-radius:36% 36% 29% 29% / 24% 24% 22% 22%;box-shadow:0 0 0 10px #23170f,0 0 18px #000b,inset 0 0 40px #08140cbb;pointer-events:none}
 .hl-table:after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(105deg,#ffffff07 0 1px,transparent 1px 17px),linear-gradient(180deg,#8d572033,transparent 39%,#0006);pointer-events:none}
 .hl-heading,.hl-choice,.hl-total,.hl-dice{position:relative;z-index:1}
 .hl-heading{font:700 clamp(18px,2.7vw,35px)/1.1 Georgia,serif;letter-spacing:.12em;text-align:center;color:#e5bd80}
 .hl-choice{font:600 clamp(12px,1.3vw,17px)/1.3 system-ui,sans-serif;letter-spacing:.05em;text-align:center;color:#ecd5a9}
 .hl-dice{display:flex;justify-content:center;align-items:center;gap:clamp(20px,3vw,40px);width:100%;height:clamp(82px,18vh,165px)}
 .hl-die{--rot:0deg;width:clamp(60px,9vw,112px);aspect-ratio:1;background:linear-gradient(145deg,#fcf0d8,#bfae91);border:3px solid #6c5342;border-radius:14px;box-shadow:7px 13px 12px #0009,inset -5px -5px 6px #6a503b33;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);padding:11px;gap:4px;transform:rotate(var(--rot))}
 .hl-pip{border-radius:100%;background:#292321;box-shadow:inset 1px 1px 3px #0009;opacity:0}
 .hl-die[data-face="1"] .hl-pip:nth-child(5),.hl-die[data-face="2"] .hl-pip:nth-child(1),.hl-die[data-face="2"] .hl-pip:nth-child(9),.hl-die[data-face="3"] .hl-pip:nth-child(1),.hl-die[data-face="3"] .hl-pip:nth-child(5),.hl-die[data-face="3"] .hl-pip:nth-child(9),.hl-die[data-face="4"] .hl-pip:nth-child(1),.hl-die[data-face="4"] .hl-pip:nth-child(3),.hl-die[data-face="4"] .hl-pip:nth-child(7),.hl-die[data-face="4"] .hl-pip:nth-child(9),.hl-die[data-face="5"] .hl-pip:nth-child(1),.hl-die[data-face="5"] .hl-pip:nth-child(3),.hl-die[data-face="5"] .hl-pip:nth-child(5),.hl-die[data-face="5"] .hl-pip:nth-child(7),.hl-die[data-face="5"] .hl-pip:nth-child(9),.hl-die[data-face="6"] .hl-pip:nth-child(1),.hl-die[data-face="6"] .hl-pip:nth-child(3),.hl-die[data-face="6"] .hl-pip:nth-child(4),.hl-die[data-face="6"] .hl-pip:nth-child(6),.hl-die[data-face="6"] .hl-pip:nth-child(7),.hl-die[data-face="6"] .hl-pip:nth-child(9){opacity:1}
 .hl-die.hl-rolling{animation:hlroll .9s ease-out both}
 .hl-die.hl-rolling:nth-child(2){animation-delay:.1s;animation-duration:1.1s}
 @keyframes hlroll{0%{transform:translateY(-30px) rotate(-105deg) scale(.86);filter:blur(2px)}30%{transform:translateY(17px) rotate(85deg)}60%{transform:translateY(-12px) rotate(235deg)}85%{transform:translateY(5px) rotate(355deg)}100%{transform:translateY(0) rotate(360deg)}}
 .hl-total{min-height:30px;font:700 clamp(16px,2vw,26px)/1.25 Georgia,serif;text-align:center;color:#f9dc93}
 .hl-table.hl-double .hl-total{color:#ffe58a;text-shadow:0 0 14px #f7c434}
 @media(max-width:680px){body.full-graphics .gfx-frame[data-layout="casino-dice"] .gfx-choices{grid-template-columns:repeat(2,minmax(0,1fr))}.hl-table:before{border-width:6px}.hl-heading{letter-spacing:.04em}.hl-die{padding:8px}}
 @media(prefers-reduced-motion:reduce){.hl-die.hl-rolling{animation:none}}
 `;
 document.head.appendChild(style);
 function die(face){const el=document.createElement('div');el.className='hl-die';el.dataset.face=String(face);for(let i=0;i<9;i++){const pip=document.createElement('span');pip.className='hl-pip';el.appendChild(pip);}return el;}
 // Keep the last visible outcome on the felt until the next wager resolves.
 // The prior version set both dice back to 1/1 on every waiting state.
 let shownRoundKey=null, rollTimer=null, settleTimer=null, rollSequence=0;
 let rememberedFaces=null, rememberedMessage='';
 const facePair=(pair)=>Array.isArray(pair)&&pair.length===2&&pair.every(v=>Number.isInteger(v)&&v>=1&&v<=6);
 function setFaces(dice,faces){dice.forEach((d,i)=>{d.dataset.face=String(faces[i]);});}
 function cancelVisualRoll(){rollSequence++;if(rollTimer!==null)clearInterval(rollTimer);if(settleTimer!==null)clearTimeout(settleTimer);rollTimer=null;settleTimer=null;}
 const origSync=GraphicalUI.sync;
 GraphicalUI.sync=function(){
   origSync.call(this);
   const el=this.element;
   if(!el)return;
   let scene=el.figure.querySelector('.hl-table');
   if(!gfx()||!atDice()){
     if(scene)scene.remove();
     cancelVisualRoll();
     shownRoundKey=null;
     return;
   }
   if(!scene){
     scene=document.createElement('div');scene.className='hl-table';scene.setAttribute('role','group');scene.setAttribute('aria-label','Two dice on a weathered green-felt wasteland casino table');
     const heading=document.createElement('div');heading.className='hl-heading';heading.textContent='WASTELAND HIGH / LOW';
     const choice=document.createElement('div');choice.className='hl-choice';
     const dice=document.createElement('div');dice.className='hl-dice';dice.append(die(1),die(1));
     const total=document.createElement('div');total.className='hl-total';total.setAttribute('aria-live','polite');
     scene.append(heading,choice,dice,total);el.figure.appendChild(scene);
     if(facePair(rememberedFaces))setFaces([...scene.querySelectorAll('.hl-die')],rememberedFaces);
   }
   const r=casinoRound();if(!r||r.game!=='dice')return;
   const choice=scene.querySelector('.hl-choice'),total=scene.querySelector('.hl-total');
   choice.textContent=valid.has(r.pick)?'YOUR BET: '+(r.pick==='seven'?'LUCKY SEVEN':r.pick.toUpperCase()):'CHOOSE LOW • LUCKY SEVEN • HIGH';
   const dice=[...scene.querySelectorAll('.hl-die')];
   const settled=r.status==='settled'&&facePair(r.dicePair);
   const roundKey=settled?String(r.id)+'/'+r.dicePair.join('-')+'/'+String(r.bet):null;
   if(settled){
     rememberedFaces=[...r.dicePair];rememberedMessage=r.message||`DICE ${r.dicePair[0]} + ${r.dicePair[1]}`;
     if(shownRoundKey!==roundKey){
       shownRoundKey=roundKey;
       cancelVisualRoll();
       const token=rollSequence;
       scene.classList.toggle('hl-double',false);
       dice.forEach(d=>d.classList.add('hl-rolling'));
       total.textContent='ROLLING...';
       // A moving pair of dice must actually change their pips, not merely
       // rotate two permanent ones.  Results are already settled by casino.js.
       const flicker=()=>{
         if(token!==rollSequence||!scene.isConnected)return;
         setFaces(dice,[1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6)]);
       };
       flicker();
       rollTimer=setInterval(flicker,90);
       settleTimer=setTimeout(()=>{
         if(token!==rollSequence||!scene.isConnected)return;
         clearInterval(rollTimer);rollTimer=null;settleTimer=null;
         dice.forEach(d=>d.classList.remove('hl-rolling'));
         setFaces(dice,rememberedFaces);
         scene.classList.toggle('hl-double',!!r.diceDouble);
         total.textContent=rememberedMessage;
       },1200);
     }else if(rollTimer===null&&settleTimer===null){
       dice.forEach(d=>d.classList.remove('hl-rolling'));
       setFaces(dice,r.dicePair);
       scene.classList.toggle('hl-double',!!r.diceDouble);
       total.textContent=r.message||'ROUND COMPLETE';
     }
   }else if(r.status==='waiting'){
     // A new round starts with the last real faces, NOT two placeholder ones.
     // Do not cancel a display just because a delayed render occurs.
     cancelVisualRoll();
     shownRoundKey=null;
     dice.forEach(d=>d.classList.remove('hl-rolling'));
     if(facePair(rememberedFaces))setFaces(dice,rememberedFaces);
     else setFaces(dice,[1,1]);
     scene.classList.toggle('hl-double',false);
     total.textContent=valid.has(r.pick)?'PLACE YOUR WAGER TO ROLL':'CHOOSE LOW, SEVEN OR HIGH TO START';
   }else{
     total.textContent=r.message||'READY';
   }
 };
 GraphicalUI.schedule();
})();
