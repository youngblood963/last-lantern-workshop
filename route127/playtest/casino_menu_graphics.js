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
   // Dispatch a dedicated visual refresh on the actual roll, even when
   // queued output does not cause a GraphicalUI render immediately.
   if(GraphicalUI.preference()==='graphics')GraphicalUI.sync();
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
 // True 3D cubes: all six faces exist at once; a roll rotates the actual
 // cubes and comes to rest with the selected outcome facing the player.
 // No fake changing digits, no dependency on the BBS animation queue.
 const style=document.createElement('style');
 style.textContent=`
 body.full-graphics .gfx-frame[data-layout="casino-dice"] .gfx-main{display:flex;flex-direction:column;height:100%;min-height:0;overflow:hidden;gap:7px}
 body.full-graphics .gfx-frame[data-layout="casino-dice"] .gfx-art{display:flex;position:relative;flex:1 1 0;min-height:120px;max-height:calc(100% - 165px);overflow:hidden;background:#110e0b!important;border:1px solid #725037}
 body.full-graphics .gfx-frame[data-layout="casino-dice"] .gfx-art-caption,
 body.full-graphics .gfx-frame[data-layout="casino-dice"] .gfx-art-error,
 body.full-graphics .gfx-frame[data-layout="casino-dice"] .gfx-image{display:none!important}
 body.full-graphics .gfx-frame[data-layout="casino-dice"] .gfx-narrative{flex:0 0 auto;max-height:80px;overflow:auto;font-size:13px}
 body.full-graphics .gfx-frame[data-layout="casino-dice"] .gfx-choices{flex:0 0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;min-height:51px;max-height:124px;overflow-y:auto}
 body.full-graphics .gfx-frame[data-layout="casino-dice"] .gfx-choice{min-height:43px;min-width:0;padding:3px 7px}
 body.full-graphics .gfx-frame[data-layout="casino-dice"] .gfx-choice-label{font-size:clamp(12px,1vw,16px);white-space:normal}
 .hl3-table{position:absolute;inset:0;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(4px,1.7%,12px);color:#f5dda7;text-shadow:0 2px 4px #000;padding:10px;background:radial-gradient(ellipse at 50% 57%,#47634c 0%,#293e33 43%,#17281f 75%,#0b100e 100%)}
 .hl3-table:before{content:'';position:absolute;inset:5%;border:9px ridge #61442a;border-radius:36% 36% 29% 29% / 24% 24% 22% 22%;box-shadow:0 0 0 9px #23170f,0 0 18px #000b,inset 0 0 40px #08140cbb;pointer-events:none}
 .hl3-table:after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(105deg,#ffffff06 0 1px,transparent 1px 17px),linear-gradient(180deg,#8d572022,transparent 39%,#0005);pointer-events:none}
 .hl3-heading,.hl3-choice,.hl3-total,.hl3-dice{position:relative;z-index:1}
 .hl3-heading{font:700 clamp(16px,2.4vw,32px)/1.08 Georgia,serif;letter-spacing:.10em;text-align:center;color:#e5bd80}
 .hl3-choice{font:600 clamp(11px,1.25vw,16px)/1.3 system-ui,sans-serif;letter-spacing:.03em;text-align:center;color:#ecd5a9}
 .hl3-dice{display:flex;justify-content:center;align-items:center;gap:clamp(20px,4vw,58px);height:clamp(80px,17vh,174px);width:100%;perspective:900px;perspective-origin:50% 30%;isolation:isolate}
 .hl3-stage{--sz:clamp(55px,8vw,104px);width:var(--sz);height:var(--sz);position:relative;transform-style:preserve-3d;flex:none;filter:drop-shadow(8px 13px 8px #0008)}
 .hl3-cube{height:100%;width:100%;position:relative;transform-style:preserve-3d;transform:rotateX(0deg) rotateY(0deg);will-change:transform}
 .hl3-face{position:absolute;inset:0;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:3px;padding:11%;box-sizing:border-box;border:2px solid #695345;border-radius:12%;background:linear-gradient(145deg,#fff8e6 0%,#dfceab 56%,#a48c6d 100%);backface-visibility:hidden;box-shadow:inset -5px -5px 8px #503b283b,inset 2px 2px 4px #fff7df8c}
 .hl3-pip{border-radius:100%;background:#261c19;box-shadow:inset 1px 1px 2px #0009;opacity:0}
 .hl3-face[data-number="1"] .hl3-pip:nth-child(5),
 .hl3-face[data-number="2"] .hl3-pip:nth-child(1),.hl3-face[data-number="2"] .hl3-pip:nth-child(9),
 .hl3-face[data-number="3"] .hl3-pip:nth-child(1),.hl3-face[data-number="3"] .hl3-pip:nth-child(5),.hl3-face[data-number="3"] .hl3-pip:nth-child(9),
 .hl3-face[data-number="4"] .hl3-pip:nth-child(1),.hl3-face[data-number="4"] .hl3-pip:nth-child(3),.hl3-face[data-number="4"] .hl3-pip:nth-child(7),.hl3-face[data-number="4"] .hl3-pip:nth-child(9),
 .hl3-face[data-number="5"] .hl3-pip:nth-child(1),.hl3-face[data-number="5"] .hl3-pip:nth-child(3),.hl3-face[data-number="5"] .hl3-pip:nth-child(5),.hl3-face[data-number="5"] .hl3-pip:nth-child(7),.hl3-face[data-number="5"] .hl3-pip:nth-child(9),
 .hl3-face[data-number="6"] .hl3-pip:nth-child(1),.hl3-face[data-number="6"] .hl3-pip:nth-child(3),.hl3-face[data-number="6"] .hl3-pip:nth-child(4),.hl3-face[data-number="6"] .hl3-pip:nth-child(6),.hl3-face[data-number="6"] .hl3-pip:nth-child(7),.hl3-face[data-number="6"] .hl3-pip:nth-child(9){opacity:1}
 .hl3-face[data-number="1"]{transform:translateZ(calc(var(--sz) / 2))}
 .hl3-face[data-number="2"]{transform:rotateY(180deg) translateZ(calc(var(--sz) / 2))}
 .hl3-face[data-number="3"]{transform:rotateY(90deg) translateZ(calc(var(--sz) / 2))}
 .hl3-face[data-number="4"]{transform:rotateY(-90deg) translateZ(calc(var(--sz) / 2))}
 .hl3-face[data-number="5"]{transform:rotateX(90deg) translateZ(calc(var(--sz) / 2))}
 .hl3-face[data-number="6"]{transform:rotateX(-90deg) translateZ(calc(var(--sz) / 2))}
 .hl3-total{min-height:29px;font:700 clamp(15px,2vw,25px)/1.2 Georgia,serif;text-align:center;color:#f9dc93}
 .hl3-table.hl3-double .hl3-total{color:#ffe58a;text-shadow:0 0 14px #f7c434}
 @media(max-width:680px){body.full-graphics .gfx-frame[data-layout="casino-dice"] .gfx-choices{grid-template-columns:repeat(2,minmax(0,1fr))}.hl3-table:before{border-width:6px}.hl3-heading{letter-spacing:.025em}}
 `;
 style.textContent += '\n /* Plain illustrated felt board, with ONLY the existing working 3D dice above it.\n    Fit the full artwork inside the current figure; no hotspots or fake controls. */\n body.full-graphics .gfx-frame[data-layout="casino-dice"] .hl3-table{\n   background: #102218 url(\'assets/locations/wasteland_dice_board.png\') center center / 100% 100% no-repeat;\n   padding:0;\n   gap:0;\n }\n body.full-graphics .gfx-frame[data-layout="casino-dice"] .hl3-table::before,\n body.full-graphics .gfx-frame[data-layout="casino-dice"] .hl3-table::after{display:none}\n body.full-graphics .gfx-frame[data-layout="casino-dice"] .hl3-heading,\n body.full-graphics .gfx-frame[data-layout="casino-dice"] .hl3-choice,\n body.full-graphics .gfx-frame[data-layout="casino-dice"] .hl3-total{display:none}\n body.full-graphics .gfx-frame[data-layout="casino-dice"] .hl3-dice{\n   flex:1 1 auto;\n   width:100%;\n   height:100%;\n   min-height:0;\n   display:flex;\n   align-items:center;\n   justify-content:center;\n }\n';
 document.head.appendChild(style);
 const orientation={1:[0,0],2:[0,180],3:[0,-90],4:[0,90],5:[-90,0],6:[90,0]};
 function exactAngle(face){const [x,y]=orientation[face]||orientation[1];return `rotateX(${x}deg) rotateY(${y}deg)`;}
 function buildCube(){
   const stageEl=document.createElement('div');stageEl.className='hl3-stage';
   const cube=document.createElement('div');cube.className='hl3-cube';
   for(let f=1;f<=6;f++){
     const face=document.createElement('div');face.className='hl3-face';face.dataset.number=String(f);
     for(let i=0;i<9;i++){const pip=document.createElement('span');pip.className='hl3-pip';face.appendChild(pip);}
     cube.appendChild(face);
   }
   stageEl.appendChild(cube);return stageEl;
 }
 let rememberedFaces=null, shownKey=null, animToken=0, diceAnimations=[];
 function stopAnimations(){animToken++;diceAnimations.forEach(a=>{try{a.cancel()}catch{}});diceAnimations=[];}
 function showFaces(cubes,faces){cubes.forEach((cube,i)=>{cube.style.transform=exactAngle(faces[i]);cube.setAttribute('aria-label',`Die ${i+1}: ${faces[i]}`);});}
 function createScene(figure){
   const scene=document.createElement('div');scene.className='hl3-table';
   const heading=document.createElement('div');heading.className='hl3-heading';heading.textContent='WASTELAND HIGH / LOW';
   const choice=document.createElement('div');choice.className='hl3-choice';
   const dice=document.createElement('div');dice.className='hl3-dice';dice.append(buildCube(),buildCube());
   const result=document.createElement('div');result.className='hl3-total';result.setAttribute('aria-live','polite');
   scene.append(heading,choice,dice,result);figure.appendChild(scene);
   return scene;
 }
 function playRoll(scene,r,key){
   const cubes=[...scene.querySelectorAll('.hl3-cube')];
   if(cubes.length!==2||!r.dicePair)return;
   stopAnimations();const token=animToken;
   shownKey=key;
   const result=scene.querySelector('.hl3-total');result.textContent='ROLLING…';
   scene.classList.remove('hl3-double');
   const faces=[...r.dicePair],reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
   if(reduced||typeof cubes[0].animate!=='function'){
     showFaces(cubes,faces);scene.classList.toggle('hl3-double',!!r.diceDouble);result.textContent=r.message||'ROUND COMPLETE';return;
   }
   let remaining=2;
   cubes.forEach((cube,i)=>{
     const [x,y]=orientation[faces[i]];
     // The cube really rotates in 3D; the final face, not a text overlay,
     // faces the camera. Each die spins/bounces independently.
     const keyframes=[
       {transform:'translate3d(-15px,-34px,0) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',offset:0},
       {transform:'translate3d(10px,8px,14px) rotateX(260deg) rotateY(380deg) rotateZ(70deg)',offset:.34},
       {transform:'translate3d(-6px,-18px,8px) rotateX(490deg) rotateY(615deg) rotateZ(0deg)',offset:.65},
       {transform:`translate3d(3px,3px,0) rotateX(${720+x}deg) rotateY(${720+y}deg) rotateZ(0deg)`,offset:.9},
       {transform:exactAngle(faces[i]),offset:1}
     ];
     cube.style.transform=exactAngle(1);
     const animation=cube.animate(keyframes,{duration:1050+i*230,iterations:1,easing:'ease-out',fill:'forwards'});
     diceAnimations.push(animation);
     animation.finished.then(()=>{
       if(token!==animToken)return;
       // Explicit inline terminal orientation, so changing screens cannot
       // cause the final image to snap back to 1/1.
       cube.style.transform=exactAngle(faces[i]);
       cube.setAttribute('aria-label',`Die ${i+1}: ${faces[i]}`);
       animation.cancel();
       if(--remaining===0){diceAnimations=[];scene.classList.toggle('hl3-double',!!r.diceDouble);result.textContent=r.message||'ROUND COMPLETE';}
     }).catch(()=>{});
   });
 }
 const previousSync=GraphicalUI.sync;
 GraphicalUI.sync=function(){
   previousSync.call(this);
   const ui=this.element;if(!ui||!ui.figure)return;
   let scene=ui.figure.querySelector('.hl3-table');
   if(!gfx()||!atDice()){
     if(scene)scene.remove();
     if(diceAnimations.length)stopAnimations();
     shownKey=null;return;
   }
   if(!scene){scene=createScene(ui.figure);if(rememberedFaces)showFaces([...scene.querySelectorAll('.hl3-cube')],rememberedFaces);}
   const r=casinoRound();if(!r||r.game!=='dice')return;
   const total=scene.querySelector('.hl3-total'),choice=scene.querySelector('.hl3-choice');
   choice.textContent=valid.has(r.pick)?'YOUR BET: '+(r.pick==='seven'?'LUCKY SEVEN':r.pick.toUpperCase()):'CHOOSE LOW • LUCKY SEVEN • HIGH';
   const settled=r.status==='settled'&&Array.isArray(r.dicePair)&&r.dicePair.length===2;
   const key=settled?`${r.id}:${r.bet}:${r.dicePair.join('-')}`:null;
   if(settled){
     rememberedFaces=[...r.dicePair];
     if(key!==shownKey)playRoll(scene,r,key);
     else if(!diceAnimations.length){showFaces([...scene.querySelectorAll('.hl3-cube')],r.dicePair);total.textContent=r.message||'ROUND COMPLETE';scene.classList.toggle('hl3-double',!!r.diceDouble);}
   }else if(r.status==='waiting'){
     if(diceAnimations.length)stopAnimations();
     shownKey=null;
     if(rememberedFaces)showFaces([...scene.querySelectorAll('.hl3-cube')],rememberedFaces);
     total.textContent=valid.has(r.pick)?'PLACE YOUR WAGER TO ROLL':'CHOOSE LOW, SEVEN OR HIGH TO START';
     scene.classList.remove('hl3-double');
   }
 };
 GraphicalUI.schedule();
})();


/* BLACKJACK GRAPHICS — presentation-only felt board and live dealt cards.
 * The same wasteland_dice_board.png is shared with Wasteland High/Low.
 * Card deck, wager, hit/stand, payout, checkpoints and BBS stay in casino.js.
 * No image hotspots and no replacement game buttons. */
(function(){
 'use strict';
 if(typeof GraphicalUI==='undefined'||typeof casinoRound!=='function')return;
 const isBlackjack=()=>stage==='mercy'&&mercyLocation==='casinoGame'&&casinoRound()?.game==='blackjack';
 const isGraphical=()=>GraphicalUI.preference()==='graphics';
 const prevModel=GraphicalUI.model;
 GraphicalUI.model=function(){
   const model=prevModel.call(this);
   if(isGraphical()&&isBlackjack()){
     model.layout='casino-blackjack';
     model.art='';
     model.title='Rusty Lantern — Blackjack';
   }
   return model;
 };
 const style=document.createElement('style');
 style.dataset.route127Blackjack='v1';
 style.textContent=`
 body.full-graphics .gfx-frame[data-layout="casino-blackjack"] .gfx-main{
   display:flex;flex-direction:column;height:100%;min-height:0;overflow:hidden;gap:7px
 }
 body.full-graphics .gfx-frame[data-layout="casino-blackjack"] .gfx-art{
   display:flex;position:relative;flex:1 1 0;min-height:140px;
   max-height:calc(100% - 165px);overflow:hidden;
   background:#112016!important;border:1px solid #725037
 }
 body.full-graphics .gfx-frame[data-layout="casino-blackjack"] .gfx-art-caption,
 body.full-graphics .gfx-frame[data-layout="casino-blackjack"] .gfx-art-error,
 body.full-graphics .gfx-frame[data-layout="casino-blackjack"] .gfx-image{display:none!important}
 body.full-graphics .gfx-frame[data-layout="casino-blackjack"] .gfx-narrative{
   flex:0 0 auto;max-height:80px;overflow:auto;font-size:13px
 }
 body.full-graphics .gfx-frame[data-layout="casino-blackjack"] .gfx-choices{
   flex:0 0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
   gap:6px;min-height:51px;max-height:124px;overflow-y:auto
 }
 body.full-graphics .gfx-frame[data-layout="casino-blackjack"] .gfx-choice{
   min-width:0;min-height:43px;padding:3px 7px
 }
 body.full-graphics .gfx-frame[data-layout="casino-blackjack"] .gfx-choice-label{
   font-size:clamp(12px,1vw,16px);white-space:normal
 }
 .r127-bj-table{
   position:absolute;inset:0;display:flex;flex-direction:column;
   justify-content:space-evenly;align-items:stretch;overflow:hidden;
   color:#f7e5be;box-sizing:border-box;padding:clamp(8px,2.5%,22px) 5%;
   background:#112016 url('assets/locations/wasteland_dice_board.png') center/100% 100% no-repeat;
   text-shadow:0 2px 3px #000;
 }
 .r127-bj-seat{
   position:relative;z-index:1;flex:1 1 0;min-height:0;
   display:flex;flex-direction:column;justify-content:center;align-items:center;gap:3px
 }
 .r127-bj-label{
   font:bold clamp(11px,1.25vw,17px)/1.2 Georgia,serif;
   letter-spacing:.09em;text-transform:uppercase;
   text-align:center;background:#080c09a8;border:1px solid #aa81585e;
   border-radius:5px;padding:3px 12px
 }
 .r127-bj-hand{
   display:flex;flex-wrap:nowrap;justify-content:center;align-items:center;
   gap:clamp(3px,1.6vw,12px);max-width:100%;min-height:0
 }
 .r127-bj-card{
   --card-h:clamp(58px,13vh,124px);
   width:calc(var(--card-h) * .68);height:var(--card-h);flex:none;
   background:#f5eddb;color:#202022;border:2px solid #e1cba0;
   box-shadow:2px 5px 8px #0008,inset 0 0 0 2px #b4a78c;
   border-radius:7px;position:relative;box-sizing:border-box;
   display:flex;align-items:center;justify-content:center;
   font:bold clamp(20px,3.6vw,38px)/1 Georgia,serif;
   text-shadow:none;transform-origin:50% 50%;
 }
 .r127-bj-card.is-red{color:#a32726}
 .r127-bj-card .r127-bj-corner{
   position:absolute;top:4px;left:5px;font:bold clamp(12px,1.8vw,19px)/1.0 Georgia,serif;
   display:flex;flex-direction:column;align-items:center;gap:1px
 }
 .r127-bj-card .r127-bj-corner-bottom{
   top:auto;left:auto;bottom:4px;right:5px;transform:rotate(180deg)
 }
 .r127-bj-card.is-back{
   color:#ebc990;background:repeating-linear-gradient(45deg,#4f2418 0 7px,#82452c 7px 11px);
   border:3px solid #e9cc96;box-shadow:2px 5px 8px #0008,inset 0 0 0 3px #3e2119
 }
 .r127-bj-card.is-back:before{
   content:'✦';display:grid;place-items:center;
   width:58%;height:66%;border:2px solid #d6aa6b;
   border-radius:4px;background:#3c1e18bb;font-size:clamp(17px,3vw,32px)
 }
 .r127-bj-card.is-dealt{animation:r127-bj-deal .45s cubic-bezier(.19,.85,.3,1.04) both}
 @keyframes r127-bj-deal{
   from{transform:translateY(-26px) rotate(-13deg) scale(.83);opacity:.35}
   to{transform:translateY(0) rotate(0) scale(1);opacity:1}
 }
 .r127-bj-idle{font:italic clamp(12px,1.5vw,18px)/1.3 Georgia,serif;color:#e0cba6}
 @media(max-width:680px){
   body.full-graphics .gfx-frame[data-layout="casino-blackjack"] .gfx-choices{
     grid-template-columns:repeat(2,minmax(0,1fr))
   }
   .r127-bj-card{--card-h:clamp(42px,11vh,76px);border-width:1px}
   .r127-bj-table{padding:5px 3%}
   .r127-bj-label{font-size:11px;padding:2px 7px}
 }
 @media(prefers-reduced-motion:reduce){.r127-bj-card.is-dealt{animation:none}}
 `;
 document.head.appendChild(style);
 let lastRound=null;
 let lastCards=new Set();
 const ranks=new Set(['A','2','3','4','5','6','7','8','9','10','J','Q','K']);
 const suits={H:'♥',D:'♦',C:'♣',S:'♠'};
 function safeCard(card){return card&&ranks.has(card.rank)&&Object.prototype.hasOwnProperty.call(suits,card.suit);}
 function makeSeat(label){
   const seat=document.createElement('section');seat.className='r127-bj-seat';
   const name=document.createElement('div');name.className='r127-bj-label';name.textContent=label;
   const hand=document.createElement('div');hand.className='r127-bj-hand';
   seat.append(name,hand);return seat;
 }
 function makeScene(figure){
   const table=document.createElement('div');table.className='r127-bj-table';
   table.setAttribute('aria-label','Blackjack cards on the Rusty Lantern felt table');
   const dealer=makeSeat('Dealer'),person=makeSeat('Your Hand');
   dealer.classList.add('r127-bj-dealer');person.classList.add('r127-bj-player');
   table.append(dealer,person);figure.appendChild(table);
   return table;
 }
 function makeCard(card,faceDown,deal){
   const el=document.createElement('div');el.className='r127-bj-card';
   if(deal)el.classList.add('is-dealt');
   if(faceDown){el.classList.add('is-back');el.setAttribute('aria-label','Face-down dealer card');return el;}
   if(!safeCard(card)){el.textContent='?';el.setAttribute('aria-label','Unknown card');return el;}
   if(card.suit==='H'||card.suit==='D')el.classList.add('is-red');
   const center=document.createElement('span');center.textContent=suits[card.suit];
   const corner=document.createElement('span');corner.className='r127-bj-corner';
   const cornerBottom=document.createElement('span');cornerBottom.className='r127-bj-corner r127-bj-corner-bottom';
   for(const target of [corner,cornerBottom]){
     const rank=document.createElement('span');rank.textContent=card.rank;
     const suit=document.createElement('span');suit.textContent=suits[card.suit];
     target.append(rank,suit);
   }
   el.append(center,corner,cornerBottom);
   el.setAttribute('aria-label',`${card.rank} of ${{H:'hearts',D:'diamonds',C:'clubs',S:'spades'}[card.suit]}`);
   return el;
 }
 function drawHand(target,cards,hideHole,seatName,roundId){
   const hand=target.querySelector('.r127-bj-hand');
   const items=Array.isArray(cards)?cards:[];
   const nodes=items.map((card,i)=>{
     const hidden=hideHole&&i>0;
     const fingerprint=`${roundId}:${seatName}:${i}:${hidden?'hidden':safeCard(card)?card.rank+card.suit:'unknown'}`;
     const fresh=!lastCards.has(fingerprint);
     lastCards.add(fingerprint);
     return makeCard(card,hidden,fresh);
   });
   if(!nodes.length){const idle=document.createElement('div');idle.className='r127-bj-idle';idle.textContent='Place a wager to deal';nodes.push(idle);}
   hand.replaceChildren(...nodes);
 }
 const priorSync=GraphicalUI.sync;
 GraphicalUI.sync=function(){
   priorSync.call(this);
   const ui=this.element;
   if(!ui?.figure)return;
   let scene=ui.figure.querySelector('.r127-bj-table');
   if(!isGraphical()||!isBlackjack()){
     if(scene)scene.remove();lastRound=null;lastCards.clear();return;
   }
   if(!scene)scene=makeScene(ui.figure);
   const round=casinoRound();if(!round||round.game!=='blackjack')return;
   if(lastRound!==round.id){lastRound=round.id;lastCards.clear();}
   const dealt=Array.isArray(round.player)&&Array.isArray(round.dealer);
   const dealer=scene.querySelector('.r127-bj-dealer');
   const person=scene.querySelector('.r127-bj-player');
   const hidden=round.status!=='settled';
   drawHand(dealer,dealt?round.dealer:[],hidden,'dealer',round.id);
   drawHand(person,dealt?round.player:[],false,'player',round.id);
   dealer.querySelector('.r127-bj-label').textContent=hidden?'DEALER — ?':`DEALER — ${casinoCardTotal(round.dealer||[])}`;
   person.querySelector('.r127-bj-label').textContent=dealt?`YOUR HAND — ${casinoCardTotal(round.player)}`:'YOUR HAND';
 };
  // The blackjack state may change after an output-queue repaint. Explicitly
  // refresh on entry and subsequent deal/hit/stand, not only on text output.
  const previousCasinoOpen=casinoOpen;
  casinoOpen=function(game){
    const result=previousCasinoOpen(game);
    if(game==='blackjack'&&isGraphical())GraphicalUI.sync();
    return result;
  };
  const previousCasinoRender=casinoRender;
  casinoRender=function(){
    const result=previousCasinoRender();
    if(isGraphical()&&isBlackjack())GraphicalUI.schedule();
    return result;
  };
 GraphicalUI.schedule();
})();
