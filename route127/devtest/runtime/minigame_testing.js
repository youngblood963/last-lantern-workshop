/* DEVTEST practice rounds. Only the board, timing and scoring helpers are shared. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;

const art='../devtest/assets/scenarios/the_scrap_duel.png';
const games=[
 {title:'Cemetery of Tires',status:'Existing',mount:mountMaze},
 {title:'Scrap Duel',status:'New',mount:mountScrapDuel}
];
const THROW_COUNT=5;
function timedScore(elapsed){
 return elapsed<0||elapsed>10000?0:r6Score(r6MeterPosition(elapsed));
}
function totalScore(scores){return scores.reduce((total,score)=>total+score,0);}
const directions={
 ArrowUp:'up',w:'up',ArrowLeft:'left',a:'left',
 ArrowDown:'down',s:'down',ArrowRight:'right',d:'right'
};
let dialog,content,heading,playKey,cleanup;

function element(tag,text,className){
 const node=document.createElement(tag);
 if(text)node.textContent=text;
 if(className)node.className=className;
 return node;
}
function button(text,action){
 const node=element('button',text);
 node.type='button';
 node.addEventListener('click',action);
 return node;
}
function clearGame(){
 playKey=null;
 cleanup?.();
 cleanup=null;
}
function showMenu(){
 clearGame();
 heading.textContent='Minigame Testing';
 const rows=games.map(game=>{
  const row=element('div',null,'minigame-row');
  const launch=button('Launch Game',()=>showGame(game));
  launch.setAttribute('aria-label','Launch '+game.title);
  row.append(element('strong',game.title),element('span',game.status),launch);
  return row;
 });
 content.replaceChildren(...rows,button('Close',()=>dialog.close()));
 content.querySelector('button').focus();
}
function showGame(game,started=false){
 clearGame();
 heading.textContent=game.title;
 const body=element('div',null,'minigame-game');
 const controls=element('div',null,'tire-controls');
 if(!started)controls.append(button('Start Game',()=>showGame(game,true)));
 else controls.append(button('Restart Game',()=>showGame(game,true)));
 controls.append(button('Return to Minigame Menu',showMenu));
 content.replaceChildren(body,controls);
 game.mount(body,started);
 (body.querySelector('button:not([hidden]):not([hidden] *)')||controls.firstElementChild).focus();
}

globalThis.Route127MinigameTesting={
 open(){
  if(!dialog){
   dialog=element('dialog',null,'r127-tire-maze r127-minigame-testing');
   heading=element('h2');heading.id='r127-minigame-title';heading.tabIndex=-1;
   dialog.setAttribute('aria-labelledby',heading.id);
   content=element('div',null,'minigame-content');
   dialog.append(heading,content);
   dialog.addEventListener('close',()=>{if(!dialog.open)clearGame();});
   document.body.append(dialog);
  }
  if(!dialog.open)dialog.showModal();
  showMenu();
 }
};

// Register before the game scripts so modal keystrokes never reach the live
// command handlers, including the casino's window-level Enter shortcut.
window.addEventListener('keydown',event=>{
 if(!dialog?.open)return;
 event.stopImmediatePropagation();
 if(!event.repeat&&!event.ctrlKey&&!event.altKey&&!event.metaKey&&playKey?.(event))
  event.preventDefault();
},true);

const tireYardArt='../devtest/assets/minigames/tire-yard/';
function tireYardSprite(file,className){
 const sprite=element('img',null,className);
 sprite.src=tireYardArt+file+'.webp';
 sprite.alt='';
 sprite.draggable=false;
 return sprite;
}

function createTireYard(grid){
 const board=element('div',null,'tire-yard');
 board.setAttribute('aria-hidden','true');
 const tiles=element('div',null,'tire-yard-grid');
 tiles.style.setProperty('--yard-columns',grid[0].length);
 tiles.style.setProperty('--yard-rows',grid.length);
 const wallAt=(x,y)=>grid[y]?.[x]==='#';
 const crate=tireYardSprite('crate','tire-yard-crate');
 grid.forEach((row,y)=>Array.from(row).forEach((tile,x)=>{
  const cell=element('div',null,tile==='#'?'tire-yard-wall':'tire-yard-path');
  const position=(y+1)+' / '+(x+1);
  cell.style.gridArea=position;
  if(tile==='#'){
   const horizontal=wallAt(x-1,y)||wallAt(x+1,y);
   const vertical=wallAt(x,y-1)||wallAt(x,y+1);
   const pile=tireYardSprite((horizontal||vertical)&&(x+2*y)%3!==0?'embers':'burning','tire-yard-pile');
   if(vertical&&!horizontal)pile.classList.add('tire-yard-pile-vertical');
   cell.append(pile);
  }
  if(tile==='G')crate.style.gridArea=position;
  tiles.append(cell);
 }));
 const survivor=tireYardSprite('survivor','tire-yard-survivor');
 tiles.append(crate,survivor);
 board.append(tiles);
 return {board,survivor,crate};
}

function mountMaze(body,started){
 if(!started){
  body.append(element('p','Stacks of tires form a maze beneath a collapsed overpass. A crate glints inside.'));
  return;
 }
 const level=player.level,maxHp=player.maxHp;
 const q=r18NewMaze(level);
 const corvette=player.flags.wo3Corvette;
 const recoveringTires=Boolean(corvette?.active);
 let tires=Math.max(Number(corvette?.tiresRecovered)||0,Number(corvette?.tiresSubmitted)||0);
 let secondChance=player.accessory==="Niko's Collar"&&Number(player.flags.nikoSecondChanceDay)!==(Number(day)||1);
 let hp=maxHp,lastMove=-Infinity;
 const {board,survivor,crate}=createTireYard(R18_MAZES[q.variant]);
 const status=element('p');status.setAttribute('role','status');
 const movement=element('div',null,'tire-controls');
 const tire=button('Recover Suitable Tire',()=>{
  if(!q.finished||!recoveringTires||tires>=4)return;
  render('You inspect the rubber and recover suitable tire '+(++tires)+' of 4. Simulated quest item.');
 });
 const tireControls=element('div',null,'tire-controls');
 tireControls.append(tire);
 body.append(element('p','Reach the salvage crate. Stay clear of the burning tires. Use the direction buttons, arrow keys, or WASD.'),
  board,status,movement,tireControls);
 for(const direction of ['up','left','down','right'])
  movement.append(button(direction.toUpperCase(),()=>move(direction)));

 function render(message){
  survivor.style.gridArea=(q.y+1)+' / '+(q.x+1);
  crate.hidden=q.finished;
  status.textContent=message+' HP '+hp+' / '+maxHp+' · Row '+(q.y+1)+', column '+(q.x+1);
  movement.hidden=q.finished||hp===0;
  tireControls.hidden=!q.finished||!recoveringTires||tires>=4;
  if(movement.hidden&&movement.contains(document.activeElement))heading.focus();
 }
 function move(direction){
  const now=performance.now();
  if(q.finished||hp===0||now-lastMove<120)return;
  lastMove=now;
  const tile=r18MazeStep(q,direction);
  if(tile==='wall'){
   const damage=environmentalDamage('minor',maxHp);
   hp=Math.max(0,hp-damage);
   survivor.classList.remove('tire-yard-hit');
   // Restart the short impact flash when consecutive inputs hit the wall.
   void survivor.offsetWidth;
   survivor.classList.add('tire-yard-hit');
   let message='The burning tires scorch you! −'+damage+' HP.';
   if(hp===0&&secondChance){
    secondChance=false;
    hp=1;
    message+=" NIKO'S COLLAR FLASHES WARM. You collapse to one knee, alive at 1 HP. The collar's Second Chance is spent for today.";
   }
   render(hp===0?message+' YOU HAVE FALLEN.':message);
  }else if(tile==='goal'){
   q.finished=true;
   const reward=r18MazeReward(level,typeof v555AwardEquipmentDrop==='function');
   const equipment=reward.equipment()?' · Equipment drop roll succeeded':'';
   render('You reach the crate and recover its contents. Simulated rewards · Scrap Metal · '+reward.bolts+' Bolts · '+reward.xp+' XP'+equipment+'.');
  }else render('');
 }
 playKey=event=>{
  const direction=directions[event.key]||directions[event.key.toLowerCase()];
  if(!direction)return false;
  move(direction);
  return true;
 };
 render('Find a path to the crate.');
}

function mountScrapDuel(body,started){
 const scene=element('div',null,'minigame-target');
 const truck=element('img');
 truck.src=art;
 truck.alt='Scrap Duel truck with 10, 25 and 50-point targets';
 scene.append(truck);
 body.append(scene);
 if(!started){
  body.append(element('p','Five throws each. Stop the needle near the center to score. Beat the champion’s total to win.'));
  return;
 }
 const scores=[],champion=Array.from({length:THROW_COUNT},()=>{
  // Match the actual Mia opponent rolls in r6Wager.
  const roll=Math.random();
  return roll<.05?0:roll<.25?10:roll<.65?25:50;
 });
 const status=element('p');status.setAttribute('role','status');
 const opponent=element('p','Champion throws · '+champion.join(' + '));
 const controls=element('div',null,'tire-controls');
 const meter=element('div',null,'minigame-meter');
 const needle=element('span',null,'minigame-needle');
 meter.append(needle);
 meter.setAttribute('aria-hidden','true');
 meter.hidden=true;
 const aim=button('Start Throw',startAim);
 const throwButton=button('Throw',event=>{
  if(event?.detail===0||!window.PointerEvent)throwCap();
 });
 throwButton.hidden=true;
 throwButton.addEventListener('pointerdown',event=>{
  if(event.button!==0||!event.isPrimary)return;
  event.preventDefault();
  throwCap();
 });
 controls.append(aim,throwButton);
 body.append(status,opponent,meter,controls);
 let began,frame,impact,projectile;
 function report(message){
  status.textContent=message+' Score '+totalScore(scores)+' · Throws left '+(THROW_COUNT-scores.length)+'.';
 }
 function finish(message){
  const total=totalScore(scores),opponentTotal=totalScore(champion);
  report(message+' You '+total+' / Champion '+opponentTotal+' — margin '+Math.abs(total-opponentTotal)+'.');
  opponent.textContent='Champion throws · '+champion.join(' + ');
  heading.focus();
 }
 function startAim(){
  projectile?.remove();
  aim.hidden=true;
  throwButton.hidden=false;
  meter.hidden=false;
  needle.style.left='0%';
  throwButton.focus();
  began=performance.now();
  frame=requestAnimationFrame(tick);
 }
 function tick(now){
  needle.style.left=r6MeterPosition(now-began)*100+'%';
  frame=requestAnimationFrame(tick);
 }
 function stopAim(){
  cancelAnimationFrame(frame);
  began=undefined;
  throwButton.hidden=true;
  meter.hidden=true;
 }
 function throwCap(){
  if(began===undefined)return;
  const score=timedScore(performance.now()-began);
  stopAim();
  scores.push(score);
  projectile=element('span',null,'minigame-hubcap');
  projectile.setAttribute('aria-hidden','true');
  // Measured against the uncropped truck image.
  const [x,y]={0:[83,54],10:[45.7,28.7],25:[58.8,27.2],50:[75.5,25.3]}[score];
  projectile.style.left=x+'%';
  projectile.style.top=y+'%';
  scene.append(projectile);
  const landed=()=>{
   const result=score===50?'BULLSEYE! 50 points.':score===0?'MISS — 0 points.':score+' points.';
   if(scores.length===THROW_COUNT){
    const margin=totalScore(scores)-totalScore(champion);
    finish(result+' '+(margin>0?'YOU WIN.':margin===0?'TIE.':'THE CHAMPION WINS.'));
   }else{
    report(result);
    aim.textContent='Next Throw';
    aim.hidden=false;
    aim.focus();
   }
  };
  const motion=typeof projectile.animate==='function'&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(motion){
   projectile.animate([
    {transform:'translate(-350%, 230%) rotate(-420deg) scale(1.55)'},
    {transform:'translate(-50%, -50%) rotate(0) scale(1)'}
   ],{duration:540,easing:'cubic-bezier(.2,.65,.25,1)'});
   impact=setTimeout(landed,540);
  }else landed();
 }
 function forfeit(){
  if(!document.hidden||scores.length===THROW_COUNT)return;
  stopAim();
  clearTimeout(impact);
  aim.hidden=true;
  while(scores.length<THROW_COUNT)scores.push(0);
  finish('Aim interrupted — remaining throws forfeited. THE CHAMPION WINS.');
 }
 document.addEventListener('visibilitychange',forfeit);
 cleanup=()=>{
  cancelAnimationFrame(frame);
  clearTimeout(impact);
  document.removeEventListener('visibilitychange',forfeit);
 };
 playKey=event=>{
  if(event.key!=='Enter'||began===undefined||event.target!==throwButton)return false;
  throwCap();
  return true;
 };
 report('Stop the needle near the center.');
}
})();
