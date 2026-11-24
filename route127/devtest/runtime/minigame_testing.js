/* DEVTEST practice rounds. Only the board, timing and scoring helpers are shared. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;

const scrapArt='../devtest/assets/minigames/scrap-duel/';
const games=[
 {title:'Cemetery of Tires',status:'Existing',mount:mountMaze},
 {title:'Scrap Duel',status:'Playable',mount:mountScrapDuel},
 {title:'Scrap Duel Spectator',status:'Playable',mount:mountSpectator}
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
let dialog,content,heading,playKey,cleanup,roadGame;

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
// Measure the space left by the controls, then fit the uncut artwork into it.
function fitArt(slot,ratio){
 if(typeof ResizeObserver!=='function')return ()=>{};
 const observer=new ResizeObserver(([entry])=>{
  const {width,height}=entry.contentRect;
  if(width>0&&height>0)slot.style.setProperty('--minigame-art-width',Math.min(width,height*ratio)+'px');
 });
 observer.observe(slot);
 return ()=>observer.disconnect();
}
function surface(mode){
 content.className='minigame-content minigame-content-'+mode;
}
function showMenu(){
 clearGame();
 surface('menu');
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
 surface(started||game.mount===mountScrapDuel?'play':'menu');
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

function showDialog(){
 if(!dialog){
  dialog=element('dialog',null,'r127-tire-maze r127-minigame-testing');
  heading=element('h2');heading.id='r127-minigame-title';heading.tabIndex=-1;
  dialog.setAttribute('aria-labelledby',heading.id);
  content=element('div',null,'minigame-content');
  dialog.append(heading,content);
  dialog.addEventListener('cancel',event=>{if(roadGame?.impactLocked)event.preventDefault();});
  dialog.addEventListener('close',()=>{
   if(dialog.open)return;
   clearGame();
   roadGame?.abandon();
   roadGame=null;
  });
  document.body.append(dialog);
 }
 if(!dialog.open)dialog.showModal();
}

const championReaction=[
 'CRASH! Your hubcap flies wide and strikes the champion beside the truck.',
 '“YOU JUST HIT ME WITH A DAMN HUBCAP!”',
 'The champion cracks his knuckles. “NOW YOU’RE GONNA PAY FOR THAT!”'
];
const missedRoundReaction=[
 'Five throws, zero points. The champion steps away from the truck.',
 '“FIVE MISSES? SHOW ME YOU CAN DO SOMETHING RIGHT.”'
];
function startChampionCombat(allMisses=false){
 for(const line of allMisses?missedRoundReaction:championReaction)add(line,'danger');
 add('THE CHAMPION ATTACKS!','danger');
 // The original Challenge the Champion encounter, including its reward table.
 const level=Math.max(1,Math.min(50,Number(player.level)||1));
 const encounter=currentEncounter();
 const rewards=LegacyEncounterRewards;
 const context=rewards.action(rewards.entry(encounter),encounter,'compete');
 // Restore the encounter scopes that normally surround synchronous combat entry.
 RoadLifecycle.scope(encounter,'compete',()=>rewards.within(context,()=>{
  startCombat({name:'HUBCAP CHAMPION',level,hp:Math.max(22,Math.floor(baseHpForLevel(level)*.28)),
   min:3,max:6,xp:Math.max(20,level*6),bolts:5,end:'The champion yields beside the truck.'},'encounter');
 }));

}

function previewChampionCombat(allMisses){
 clearGame();
 surface('combat');
 heading.textContent='Hubcap Champion · Simulated Combat';
 const frame=element('iframe',null,'minigame-champion-preview');
 frame.title='Isolated Hubcap Champion combat';
 const profile=JSON.parse(JSON.stringify({
  level:player.level,hp:player.hp,maxHp:player.maxHp,turns:player.turns,bolts:player.bolts,
  weapon:player.weapon,armor:player.armor,accessory:player.accessory,pack:player.pack,
  flags:{equipmentMods:player.flags.equipmentMods,equipmentModSerial:player.flags.equipmentModSerial,
   r127EquipmentUpgrades:player.flags.r127EquipmentUpgrades}
 }));
 const notice=element('p','Loading simulated combat…','minigame-champion-reaction');
 frame.addEventListener('load',()=>{
  if(!frame.contentWindow?.Route127ScrapCombatPreview){
   notice.textContent='The combat preview could not load.';
   return;
  }
  try{
   frame.contentWindow.Route127ScrapCombatPreview(profile,allMisses);
   notice.hidden=true;
   frame.focus();
  }catch(error){
   notice.textContent='The combat preview could not start.';
   console.error(error);
  }
 },{once:true});
 frame.src='../devtest/index.html?scrap-combat-preview=1';
 const viewport=element('div',null,'minigame-combat-viewport');
 viewport.append(frame,notice);
 content.replaceChildren(viewport,button('Return to Minigame Menu',showMenu));
 cleanup=()=>{frame.remove();};
}
if(globalThis.ROUTE127_ENV.scrapCombatPreview){
 globalThis.Route127ScrapCombatPreview=(profile,allMisses)=>{
  resetPlayer();
  Object.assign(player,{
   ...JSON.parse(JSON.stringify(profile)),handle:'DEVTEST SURVIVOR',
   flags:{...player.flags,...JSON.parse(JSON.stringify(profile.flags||{}))}
  });
  player.flags.interfaceUnlocked=true;
  EquipmentMods.hydrate();
  globalThis.r127HydrateUpgrades?.();
  activeSaveSlot=0;
  hud.classList.remove('hidden');
  utilityPanel.classList.remove('hidden');
  screen.replaceChildren();
  roadGoal='east';
  roadEncounterOrder=[eastEncounters.findIndex(e=>e.title==='THE SCRAP DUEL')];
  updateHud();
  startChampionCombat(allMisses);
  GraphicalUI.setMode('graphics');
 };
}

globalThis.Route127MinigameTesting={open(){showDialog();showMenu();}};
function openRoadGame(title){
 if(dialog?.open||typeof HTMLDialogElement==='undefined')return null;
 clearGame();
 showDialog();
 surface('play');
 heading.textContent=title;
 return element('div',null,'minigame-game');
}
function rimReaperReward(){
 if(player.flags.scrapDuelRimReaperAwarded)return;
 const level=Math.max(1,Math.min(50,Math.floor(Number(player.level)||1)));
 const base=catalogInstanceName(RIM_REAPER_DEFINITION,level);
 const weapon=EquipmentMods.createModified(base,'serrated');
 if(!routeKeepGear(weapon,'weapon')){
  (player.flags.r5LootQueue||=[]).push({name:weapon,type:'weapon',qty:1});
  add('Rim Reaper is held until you make room.','system');
 }
 player.flags.scrapDuelRimReaperAwarded=true;
 add('FIRST SCRAP DUEL VICTORY — Rim Reaper, with Serrated Edge installed.','reward');
}
globalThis.Route127RoadMinigames={
 openMaze(){
  const body=openRoadGame('Cemetery of Tires');
  if(!body)return false;
  const leave=button('Leave Maze',()=>dialog.close());
  roadGame={abandon(){
   const scene=player.flags.r18MazeScene;
   if(scene?.attempt?.occurrence===RoadLifecycle.occurrence())delete scene.attempt;
   if(stage==='encounter'&&currentEncounter()?.title==='CEMETERY OF TIRES'){completeRoadTurn();v49Autosave();}
  }};
  content.replaceChildren(body,leave);
  mountMaze(body,true,{
   closeForRescue(){dialog.close();},
   won(){
    if(!player.flags.r18MazeClaimed){
     const reward=r18MazeReward(player.level,typeof v555AwardEquipmentDrop==='function');
     r18RetainRoadReward('Scrap Metal','material');
     gainBolts(reward.bolts);gainXp(reward.xp);
     if(reward.equipment())v555AwardEquipmentDrop();
     player.flags.r18MazeClaimed=true;
    }
    add('You reach the crate and recover its contents.','reward');
    v49Autosave();
    if(!CorvetteRestoration.state().active||CorvetteRestoration.state().tiresRecovered>=4)dialog.close();
    else leave.textContent='Return to Road';
   }
  });
  body.querySelector('button')?.focus();
  return true;
 },
 watch(){
  const body=openRoadGame('Scrap Duel · Spectator');
  if(!body)return false;
  roadGame={abandon(){if(stage==='encounter')renderCurrentChoices();}};
  const leave=button('Stop Watching',()=>dialog.close());
  content.replaceChildren(body,leave);
  mountSpectator(body,true,()=>{leave.textContent='Continue';leave.focus();});
  return true;
 },
 openRoadScrapDuel(q,stake){
  const body=openRoadGame('Scrap Duel');
  if(!body){add('Scrap Duel could not open. No wager was taken.','system');return false;}
  const current=()=>stage==='encounter'&&currentEncounter()?.title==='THE SCRAP DUEL'&&
    player.flags.r18ScrapDuelScene===q;
  let settled=false;
  const settle=()=>{
   if(settled||!current())return false;
   settled=true;
   return true;
  };
  const leave=button('Leave Contest',()=>dialog.close());
  roadGame={
   impactLocked:false,
   lockImpact(){this.impactLocked=true;leave.disabled=true;},
   abandon(){
    if(settle()){
     add(stake?'You forfeit the committed wager.':'You leave the throwing contest.','system');
     v49Autosave();
    }
    if(current())renderCurrentChoices();
   },
   finish(total,opponent){
    if(!settle())return;
    if(stake&&total>=opponent)gainBolts(total>opponent?stake*2:stake);
    if(total>opponent)rimReaperReward();
    leave.textContent='Continue';
    leave.focus();
    if(!player.flags.r18ScrapDuelXpSeen){
     player.flags.r18ScrapDuelXpSeen=true;
     gainXp(Math.max(6,player.level));
    }
    v49Autosave();
   },
   champion(allMisses){
    if(!settle()){dialog.close();return;}
    clearGame();
    dialog.close();
    startChampionCombat(allMisses);
   }
  };
  content.replaceChildren(body,leave);
  mountScrapDuel(body,true,roadGame);
  q.phase='idle';q.stake=0;
  // Deduct and persist before the first throw. A refresh never refunds a wager.
  if(stake){player.bolts-=stake;updateHud();}
  v49Autosave();
  body.querySelector('button')?.focus();
  return true;
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
 const paths=[];
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
  else paths.push([cell,TireMazeHazards.key([x,y])]);
  if(tile==='G')crate.style.gridArea=position;
  tiles.append(cell);
 }));
 const survivor=tireYardSprite('survivor','tire-yard-survivor');
 tiles.append(crate,survivor);
 board.append(tiles);
 return {board,paths,survivor,crate};
}

function mountMaze(body,started,road=null){
 if(!started){
  body.append(element('p','Stacks of tires form a maze beneath a collapsed overpass. A crate glints inside.'));
  return;
 }
 const level=player.level,maxHp=player.maxHp;
 const hazards=TireMazeHazards, rules=hazards.settings;
 let q,grid,view;
 const corvette=player.flags.wo3Corvette;
 const recoveringTires=Boolean(corvette?.active);
 let tires=Math.max(Number(corvette?.tiresRecovered)||0,Number(corvette?.tiresSubmitted)||0);
 let secondChance=player.accessory==="Niko's Collar"&&Number(player.flags.nikoSecondChanceDay)!==(Number(day)||1);
 let hp=road?player.hp:maxHp,lastMove=-Infinity;
 const rescueRoute=playerRescueRoute();
 const testResources={maxHp,turns:player.turns,bolts:player.bolts};
 const countdown=element('p',null,'tire-yard-countdown');
 countdown.setAttribute('role','timer');
 const frame=element('div',null,'tire-yard-frame minigame-art-slot');
 const warning=element('p',null,'tire-yard-warning');
 warning.setAttribute('role','status');
 const rescue=element('ul',null,'tire-yard-rescue');
 rescue.hidden=true;
 const retry=button('Try Again',startAttempt);
 retry.hidden=true;
 let clock,deadline,nextSmoke,nextShift,shiftAt,moves,remaining;
 let clouds=[],smoke=new Set(),firstCollapse;
 let phase='ready';
 // The live road maze is one encounter, even when its dialog is recreated.
 // Practice rounds continue to start from scratch.
 const occurrence=road?RoadLifecycle.occurrence():null;
 let savedSecond=null;
 function persist(){
  if(!road||!q||!grid)return;
  const epoch=Date.now()-performance.now();
  const state=player.flags.r18MazeScene||(player.flags.r18MazeScene={scene:RoadLifecycle.sceneKey('early:27')});
  state.attempt={occurrence,q:{...q},grid:grid.map(row=>Array.from(row)),phase,deadline:deadline+epoch,
   nextSmoke:nextSmoke+epoch,nextShift,shiftAt:shiftAt?shiftAt+epoch:0,
   moves,firstCollapse,clouds:clouds.map(c=>({cells:[...c.cells],expires:c.expires+epoch}))};
  v49Autosave();
 }
 const status=element('p');status.setAttribute('role','status');
 const movement=element('div',null,'tire-controls');
 const tire=button('Recover Suitable Tire',()=>{
  if(!q.finished||!recoveringTires||tires>=4)return;
  if(road){
   CorvetteRestoration.tires();
   tires=CorvetteRestoration.state().tiresRecovered;
   render('Tires recovered '+tires+' of 4.');
  }else render('You inspect the rubber and recover suitable tire '+(++tires)+' of 4. Simulated quest item.');
 });
 const tireControls=element('div',null,'tire-controls');
 tireControls.append(tire);
 body.classList.add('minigame-game-active');
 const panel=element('div',null,'minigame-hud');
 panel.append(countdown,status,movement,warning,retry,tireControls,rescue);
 body.append(frame,panel);
 const detachArt=fitArt(frame,1);
 for(const direction of ['up','left','down','right'])
  movement.append(button(direction.toUpperCase(),()=>move(direction)));

 function rebuild(){
  view=createTireYard(grid);
  positionSurvivor();
  frame.replaceChildren(view.board);
  paintSmoke();
 }
 function paintSmoke(){
  for(const [cell,key] of view.paths)cell.classList.toggle('tire-yard-smoke',smoke.has(key));
 }
 function setTime(seconds){
  if(remaining===seconds)return;
  remaining=seconds;
  countdown.textContent=seconds+' seconds remaining';
  countdown.classList.toggle('tire-yard-countdown-low',seconds<=10);
  countdown.classList.toggle('tire-yard-countdown-last',seconds<=5);
 }
 function resetLayout(){
  const layout=hazards.generate();
  const [x,y]=layout.start;
  q={x,y,step:0,finished:false};
  grid=layout.grid;
  rebuild();
 }
 function startAttempt(){
  stopClock();
  phase='playing';
  const now=performance.now();
  deadline=now+rules.duration;
  nextSmoke=now+hazards.randomBetween(rules.firstSmoke);
  nextShift=hazards.randomBetween(rules.firstShift);
  firstCollapse=true;
  moves=0;
  shiftAt=0;
  lastMove=-Infinity;
  retry.hidden=true;
  warning.textContent='';
  resetLayout();
  setTime(rules.duration/1000);
  render('Find a path to the crate.');
  if(document.activeElement===retry)movement.firstElementChild?.focus();
  clock=setInterval(()=>tick(performance.now()),100);
 }
 function stopClock(){
  clearInterval(clock);
  clouds=[];
  smoke.clear();
  if(view)paintSmoke();
 }
 cleanup=()=>{persist();stopClock();detachArt();};
 function tick(now){
  if(phase!=='playing')return false;
  if(now>=deadline){
   phase='timeout';
   stopClock();
   resetLayout();
   setTime(0);
   warning.textContent="TIME'S UP! The salvage attempt failed.";
   retry.hidden=false;
   render('Try again with your remaining HP.');
   retry.focus();
   return false;
  }
  const second=Math.ceil((deadline-now)/1000);
  setTime(second);
  let changed=false;
  if(shiftAt&&now>=shiftAt){
   changed=true;
   shiftAt=0;
   nextShift=moves+hazards.randomBetween(rules.shiftInterval);
   const layout=hazards.shift(grid,[q.x,q.y]);
   warning.textContent='';
   if(layout){
    grid=layout;
    rebuild();
    view.board.classList.add('tire-yard-collapse');
    warning.textContent='CRASH! Burning tires tumble into the passage!';
   }
  }
  const before=clouds.length;
  clouds=clouds.filter(cloud=>now<cloud.expires);
  const spawn=now>=nextSmoke;
  if(spawn){
   clouds.push({cells:hazards.smoke(grid,[q.x,q.y]),expires:now+hazards.randomBetween(rules.smokeDuration)});
   nextSmoke=now+hazards.randomBetween(rules.smokeInterval);
  }
  if(spawn||clouds.length!==before){
   changed=true;
   smoke=new Set(clouds.flatMap(cloud=>[...cloud.cells]));
   paintSmoke();
  }
  if(changed||savedSecond!==second){savedSecond=second;persist();}
  return true;
 }
 function positionSurvivor(){
  view.survivor.style.gridArea=(q.y+1)+' / '+(q.x+1);
 }
 function render(message){
  positionSurvivor();
  view.crate.hidden=q.finished;
  status.textContent=message+' HP '+hp+' / '+maxHp+' · Row '+(q.y+1)+', column '+(q.x+1);
  movement.hidden=phase!=='playing';
  tireControls.hidden=!q.finished||!recoveringTires||tires>=4;
  if(movement.hidden&&movement.contains(document.activeElement))heading.focus();
  persist();
 }
 function takeDamage(damage,message){
  if(road){
   const lethal=damage>=player.hp;
   hurt(damage);
   hp=player.hp;
   v49Autosave();
   if(stage!=='encounter'){
    phase='fallen';
    stopClock();
    road.closeForRescue();
    return message;
   }
   if(lethal)message+=" Niko’s Collar grants a Second Chance.";
  }else hp=Math.max(0,hp-damage);
  view.survivor.classList.remove('tire-yard-hit');
  void view.survivor.offsetWidth;
  view.survivor.classList.add('tire-yard-hit');
  if(!road&&hp===0&&secondChance){
   secondChance=false;
   hp=1;
   message+=" NIKO'S COLLAR FLASHES WARM. You collapse to one knee, alive at 1 HP. The collar's Second Chance is spent for today.";
  }
  if(!road&&hp===0){
   phase='fallen';
   stopClock();
   warning.textContent='YOU HAVE FALLEN · SIMULATED RESCUE';
   const summary=playerRescueOutcome({...testResources,hp},rescueRoute.travel);
   rescue.replaceChildren(element('li',rescueRoute.arrival),...rescueSummaryLines(summary).map(line=>element('li',line)));
   rescue.hidden=false;
  }
  return message;
 }
 function move(direction){
  const now=performance.now();
  if(!tick(now)||now-lastMove<120)return;
  lastMove=now;
  const tile=r18MazeStep(q,direction,grid);
  if(tile==='wall'){
   const damage=environmentalDamage('minor',maxHp);
   render(takeDamage(damage,'The burning tires scorch you! −'+damage+' HP.'));
   return;
  }
  const smoky=smoke.has(hazards.key([q.x,q.y]));
  const damage=Math.max(1,Math.round(maxHp*rules.smokeDamage));
  const message=smoky?takeDamage(damage,'You choke on thick, toxic smoke! −'+damage+' HP.'):'';
  if(phase==='fallen'){render(message);return;}
  if(tile==='goal'){
   q.finished=true;
   phase='won';
   stopClock();
   warning.textContent='';
   if(road){
    render('You reach the crate and recover its contents.');
    road.won();
   }else{
    const reward=r18MazeReward(level,typeof v555AwardEquipmentDrop==='function');
    const equipment=reward.equipment()?' · Equipment drop roll succeeded':'';
    render('You reach the crate and recover its contents. Simulated rewards · Scrap Metal · '+reward.bolts+' Bolts · '+reward.xp+' XP'+equipment+'.');
   }
   return;
  }
  if(++moves>=nextShift&&!shiftAt){
   nextShift=moves+hazards.randomBetween(rules.shiftInterval);
   if(firstCollapse||Math.random()<rules.shiftChance){
    firstCollapse=false;
    shiftAt=now+rules.warning;
    warning.textContent='The burning tire stacks begin to sway…';
   }
  }
  render(message);
 }
 playKey=event=>{
  const direction=directions[event.key]||directions[event.key.toLowerCase()];
  if(!direction)return false;
  move(direction);
  return true;
 };
 const saved=road?player.flags.r18MazeScene?.attempt:null;
 if(saved?.occurrence===occurrence&&saved.q&&Array.isArray(saved.grid)){
  const epoch=Date.now()-performance.now();
  q={...saved.q};grid=[...saved.grid];phase=saved.phase;
  deadline=saved.deadline-epoch;nextSmoke=saved.nextSmoke-epoch;
  nextShift=saved.nextShift;shiftAt=saved.shiftAt?saved.shiftAt-epoch:0;
  moves=saved.moves;firstCollapse=saved.firstCollapse;
  clouds=saved.clouds.map(c=>({cells:c.cells,expires:c.expires-epoch}));
  smoke=new Set(clouds.flatMap(c=>c.cells));
  rebuild();setTime(Math.max(0,Math.ceil((deadline-performance.now())/1000)));
  retry.hidden=phase!=='timeout';
  render(q.finished?'You reached the crate.':'Your current maze attempt resumes.');
  // Recover a goal snapshot taken immediately before the guarded reward callback.
  if(phase==='won'&&q.finished&&!player.flags.r18MazeClaimed)road.won();
  if(phase==='playing'){tick(performance.now());clock=setInterval(()=>tick(performance.now()),100);}
 }else startAttempt();
}

// Positions and radii are percentages of the uncropped image. The three
// painted circles are foreshortened into ellipses on the side of the truck.
const scrapTargets={
 10:[45.7,28.7,5.2,11.6],
 25:[58.8,27.2,6.2,12.7],
 50:[75.5,25.3,8.3,15.5]
};
// Rectangles are inset from scene features to leave room for the full sprite.
const scrapMisses=[
 ['ground',35,56,70,85],
 ['truck',37,37.6,22,44],
 ['crate',65,81,84,94]
];
const upperTruck=[86.6,89,12,16];
const CHAMPION_MISS_CHANCE=.30;
// Inset over the champion’s torso, to the right of the painted 50.
const championBody=[89,92,32,38];
function scrapLanding(score,previous,forceChampion=false,spectator=false){
 // Separate cosmetic draws keep champion rolls and timing untouched.
 const category=score===0?crypto.getRandomValues(new Uint32Array(1))[0]/2**32:0;
 const chance=spectator?0:CHAMPION_MISS_CHANCE;
 const miss=score!==0?null:forceChampion||category<chance
  ?['champion',...championBody]
  :scrapMisses[Math.floor((category-chance)/(1-chance)*scrapMisses.length)];
 let impact;
 for(let attempt=0;attempt<6;attempt++){
  const [a,b]=crypto.getRandomValues(new Uint32Array(2));
  const u=a/2**32,v=b/2**32;
  if(miss){
   const [surface,...zone]=miss;
   const [left,right,top,bottom]=surface==='truck'&&category>chance+(1-chance)/2?upperTruck:zone;
   impact={x:left+(right-left)*u,y:top+(bottom-top)*v,surface};
  }else{
   const [x,y,rx,ry]=scrapTargets[score];
   const angle=2*Math.PI*u,radius=Math.sqrt(v);
   impact={x:x+rx*radius*Math.cos(angle),y:y+ry*radius*Math.sin(angle),surface:'target'};
  }
  if(!previous||impact.surface!==previous.surface||
     Math.hypot(impact.x-previous.x,(impact.y-previous.y)*704/1250)>=2)break;
 }
 return impact;
}

function createScrapStage(body){
 const scene=element('div',null,'minigame-target');
 const truck=element('img');
 truck.className='minigame-scrap-background';
 truck.src=scrapArt+'truck.webp';
 truck.alt='Scrap Duel truck with 10, 25 and 50-point targets';
 scene.append(truck);
 const artwork=element('div',null,'minigame-art-slot');
 artwork.append(scene);
 const panel=element('div',null,'minigame-hud');
 body.classList.add('minigame-game-active');
 body.append(artwork,panel);
 return {scene,panel,detachArt:fitArt(artwork,1250/704)};
}
function npcThrow(){
 const roll=Math.random();
 return roll<.05?0:roll<.25?10:roll<.65?25:50;
}
function flyScrapCap(scene,projectile,{x,y},landed){
 projectile.style.left=x+'%';
 projectile.style.top=y+'%';
 scene.append(projectile);
 const motion=typeof projectile.animate==='function'&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 if(!motion){landed();return;}
 projectile.animate([
  {left:'14%',top:'32%',transform:'translate(-50%, -50%) rotate(-360deg) scale(1.35)'},
  {left:x+'%',top:y+'%',transform:'translate(-50%, -50%) rotate(0) scale(.8)'}
 ],{duration:540,easing:'cubic-bezier(.2,.65,.25,1)'});
 return setTimeout(landed,540);
}
function scrapContact(projectile,surface){
 projectile.className=surface==='ground'
  ?'minigame-hubcap minigame-hubcap-ground'
  :'minigame-hubcap minigame-hubcap-embedded';
 if(surface==='truck')projectile.classList.add('minigame-hubcap-truck');
 if(surface==='crate')projectile.classList.add('minigame-hubcap-crate');
}
function mountSpectator(body,started,onFinish){
 if(!started){body.append(element('p','Watch two scavengers take five turns each.'));return;}
 const {scene,panel,detachArt}=createScrapStage(body);
 const scores=[[],[]];
 const status=element('p');status.setAttribute('role','status');
 panel.append(status);
 let projectile,flight,timer,throws=0;
 function play(){
  projectile?.remove();
  const contestant=throws%2,score=npcThrow();
  const impact=scrapLanding(score,null,false,true);
  projectile=element('span',null,'minigame-hubcap minigame-hubcap-flight');
  projectile.setAttribute('aria-hidden','true');
  flight=flyScrapCap(scene,projectile,impact,()=>{
   scrapContact(projectile,impact.surface);
   scores[contestant].push(score);
   const [a,b]=scores.map(totalScore);
   status.textContent='Scavenger 1: '+a+' · Scavenger 2: '+b+' · Throw '+(++throws)+' / '+(2*THROW_COUNT);
   if(throws===2*THROW_COUNT){
    status.textContent+=' · '+(a===b?'Tie.':'Scavenger '+(a>b?1:2)+' wins!');
    onFinish?.();
   }else timer=setTimeout(play,950);
  });
 }
 cleanup=()=>{detachArt();clearTimeout(flight);clearTimeout(timer);};
 play();
}
function mountScrapDuel(body,started,road=null){
 const {scene,panel,detachArt}=createScrapStage(body);
 if(!started){
  panel.append(element('p','Five throws each. Stop the needle near the center to score. Beat the champion’s total to win.'));
  cleanup=detachArt;
  return;
 }
 const scores=[],champion=Array.from({length:THROW_COUNT},npcThrow);
 const status=element('p');status.setAttribute('role','status');
 const opponent=element('p','Champion '+totalScore(champion)+' · Throws '+champion.join(' + '));
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
 const force=road?null:button('Force Champion Impact',()=>throwCap(true));
 controls.append(aim,throwButton);
 if(force)controls.append(force);
 panel.append(status,opponent,meter,controls);
 const lastLanding=new Map();
 let began,frame,impact,projectile;
 let flying=false,ended=false;
 function report(message){
  status.textContent=message+' Score '+totalScore(scores)+' · Throws left '+(THROW_COUNT-scores.length)+'.';
 }
 function finish(message,completed=true){
  ended=true;
  if(force)force.hidden=true;
  const total=totalScore(scores),opponentTotal=totalScore(champion);
  report(message+' You '+total+' / Champion '+opponentTotal+' — margin '+Math.abs(total-opponentTotal)+'.');
  if(completed)road?.finish(total,opponentTotal);
  if(completed&&!road&&total>opponentTotal)panel.append(element('p','Simulated first-win reward: Rim Reaper with Serrated Edge.'));
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
 function throwCap(forceChampion=false){
  if(ended||flying||(!forceChampion&&began===undefined))return;
  flying=true;
  aim.hidden=true;
  if(force)force.disabled=true;
  projectile?.remove();
  const score=forceChampion?0:timedScore(performance.now()-began);
  stopAim();
  scores.push(score);
  projectile=element('span',null,'minigame-hubcap minigame-hubcap-flight');
  projectile.setAttribute('aria-hidden','true');
  const landing=scrapLanding(score,lastLanding.get(score),forceChampion);
  lastLanding.set(score,landing);
  const {x,y,surface}=landing;
  const allMisses=scores.length===THROW_COUNT&&scores.every(points=>points===0);
  if(surface==='champion'||allMisses)road?.lockImpact();
  const landed=()=>{
   flying=false;
   if(surface==='champion'||allMisses){
    ended=true;
    if(force)force.hidden=true;
    const hit=surface==='champion';
    if(hit)projectile.className='minigame-hubcap minigame-hubcap-champion';
    else scrapContact(projectile,surface);
    const goaded=!hit&&allMisses;
    report((goaded?missedRoundReaction:championReaction).join(' ')+' THE CHAMPION ATTACKS!');
    impact=setTimeout(()=>road?road.champion(goaded):previewChampionCombat(goaded),1100);
    return;
   }
   if(force)force.disabled=false;
   scrapContact(projectile,surface);
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
  const flight=flyScrapCap(scene,projectile,{x,y},landed);
  if(flight!==undefined)impact=flight;
 }
 function forfeit(){
  if(!document.hidden||ended||lastLanding.get(0)?.surface==='champion'||scores.length===THROW_COUNT)return;
  stopAim();
  clearTimeout(impact);
  projectile?.remove();
  aim.hidden=true;
  while(scores.length<THROW_COUNT)scores.push(0);
  road?.abandon();
  finish('Aim interrupted — remaining throws forfeited. THE CHAMPION WINS.',false);
 }
 document.addEventListener('visibilitychange',forfeit);
 cleanup=()=>{
  detachArt();
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
