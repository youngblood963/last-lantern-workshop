const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=filename=>fs.readFileSync(path.join(root,filename),'utf8');
const app=source('app.js');
const clocks=new Map();
let now=0,clockId=0;
class Element{
 constructor(){
  this.children=[];this.style={setProperty(){}};
  this.events={};this.className='';this.hidden=false;
  this.classList={
   add:name=>this.classList.toggle(name,true),
   remove:name=>this.classList.toggle(name,false),
   toggle:(name,on)=>{
    const names=new Set(this.className.split(' ').filter(Boolean));
    if(on)names.add(name);else names.delete(name);
    this.className=[...names].join(' ');
   }
  };
 }
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=children;}
 get firstElementChild(){return this.children[0];}
 querySelector(){return find(this,node=>Boolean(node.events.click));}
 setAttribute(){}
 addEventListener(name,fn){this.events[name]=fn;}
 contains(node){return this.children.includes(node);}
 focus(){document.activeElement=this;}
 showModal(){this.open=true;}
}
const document={createElement:()=>new Element(),body:new Element()};
const player={level:1,maxHp:100,hp:17,turns:12,bolts:101,bankBolts:300,flags:{}};
const snapshot=JSON.stringify(player);
const context=vm.createContext({
 document,player,day:1,stage:'house',roadTripLength:8,combatState:null,
 ROUTE127_ENV:{name:'DEVTEST'},environmentalDamage:()=>1,
 performance:{now:()=>now},addEventListener(){},
 setInterval(fn){clocks.set(++clockId,fn);return clockId;},
 clearInterval(id){clocks.delete(id);}
});
context.window=context;
const run=code=>vm.runInContext(code,context);
run(app.slice(app.indexOf('function playerRescueRoute'),app.indexOf('function handlePlayerDeath')));
run(app.slice(app.indexOf('function rescueSummaryLines'),app.indexOf('function hurt')));
run(app.slice(app.indexOf('const R18_MAZE_BASE'),app.indexOf('// Station Nine remains attached')));
run(source('runtime/tire_maze_hazards.js'));
run(source('runtime/minigame_testing.js'));

function find(root,match){
 if(root.hidden)return;
 if(match(root))return root;
 for(const child of root.children){
  const found=find(child,match);if(found)return found;
 }
}
const text=value=>find(document.body,n=>n.textContent===value);
const click=value=>{assert(text(value),'Missing '+value);text(value).events.click();};
const status=()=>find(document.body,n=>n.textContent?.includes(' · Row ')).textContent;
function advance(ms){now+=ms;for(const fn of [...clocks.values()])fn();}
function move(label){advance(130);click(label);}
// A fixed path makes the control and clock tests independent of maze seeds.
run(`
 const generateMaze=TireMazeHazards.generate;
 TireMazeHazards.generate=()=>({
  start:[1,1],
  grid:[...R18_MAZES[0].map(row=>Array.from(row.padEnd(13,'#'))),
    ...Array.from({length:6},()=>Array(13).fill('#'))]
 });
 Math.random=()=>0;
 Route127MinigameTesting.open();
`);
click('Launch Game');assert.equal(clocks.size,0);
click('Start Game');assert(text('20 seconds remaining'));
move('UP');assert.match(status(),/scorch you.*99 \/ 100/);
advance(9870);assert(text('10 seconds remaining').className.includes('countdown-low'));
advance(5000);assert(text('5 seconds remaining').className.includes('countdown-last'));
advance(5000);assert(text("TIME'S UP! The salvage attempt failed."));
assert(text('0 seconds remaining'));
assert.equal(clocks.size,0);
advance(1000);assert(text('0 seconds remaining'));
click('Try Again');assert(text('20 seconds remaining'));assert.match(status(),/99 \/ 100 · Row 2, column 2/);
const originalWalls=()=>find(document.body,n=>n.className==='tire-yard-grid').children
 .filter(n=>n.className==='tire-yard-wall').map(n=>n.style.gridArea).join(',');
const survivor=()=>find(document.body,n=>n.className.split(' ').includes('tire-yard-survivor'));
const walls=originalWalls();
// A high RNG draw would fail the 75% roll. The first collapse still occurs.
run('Math.random=()=>.99');
move('RIGHT');assert(!text('The burning tire stacks begin to sway…'));
move('RIGHT');assert(text('The burning tire stacks begin to sway…'));
advance(700);assert(text('CRASH! Burning tires tumble into the passage!'));assert.notEqual(originalWalls(),walls);
assert.equal(survivor().style.gridArea,'2 / 4','Collapse redraw retains the survivor position without movement');

run('Math.random=()=>0');
click('Restart Game');
run("let smokeSpawns=0;const realSmoke=TireMazeHazards.smoke;TireMazeHazards.smoke=()=>new Set(++smokeSpawns===1?['1:2','1:3']:['3:4','3:5']);");
const smokyAt=position=>find(document.body,n=>n.style.gridArea===position&&n.className.includes('tire-yard-smoke'));
advance(999);assert(!smokyAt('2 / 3'));
advance(1);assert(smokyAt('2 / 3'));
move('RIGHT');assert.match(status(),/toxic smoke.*98 \/ 100 · Row 2, column 3/);
advance(1870);assert.equal(run('smokeSpawns'),2);
assert(smokyAt('2 / 3')&&smokyAt('4 / 5'),'Clouds overlap on their independent schedules');
advance(1000);assert(!smokyAt('2 / 3'));assert(smokyAt('4 / 5'));
assert.match(status(),/98 \/ 100/);
run('const actualShift=TireMazeHazards.shift;TireMazeHazards.shift=()=>null;');
click('Restart Game');
for(const direction of ['RIGHT','RIGHT','DOWN','DOWN','RIGHT','RIGHT','DOWN','DOWN'])move(direction);
assert.match(status(),/Scrap Metal · 8 Bolts · 10 XP/);assert.equal(clocks.size,0);

player.accessory="Niko's Collar";player.maxHp=1;
click('Restart Game');move('UP');assert.match(status(),/Second Chance/);
move('UP');assert(text('YOU HAVE FALLEN · SIMULATED RESCUE'));
assert(text('Turns lost: 2 · turns remaining: 10'));
assert.equal(clocks.size,0);
delete player.accessory;player.maxHp=100;
assert.equal(JSON.stringify(player),snapshot);
click('Restart Game');click('Return to Minigame Menu');assert.equal(clocks.size,0);

// Verify independently generated mazes and accepted shifts with an independent BFS.
run(`
 const cases=[],layouts=new Set();
 let seed=127;
 const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 const steps=[[1,0],[-1,0],[0,1],[0,-1]];
 function visit(grid,start){
  const queue=[[...start,0]],seen=new Set([JSON.stringify(start)]);
  for(const [cx,cy,distance] of queue)for(const [dx,dy] of steps){
   const x=cx+dx,y=cy+dy,tile=grid[y]?.[x],key=JSON.stringify([x,y]);
   if(tile!==undefined&&tile!=='#'&&!seen.has(key)){seen.add(key);queue.push([x,y,distance+1]);}
  }
  return queue;
 }
 for(let i=0;i<100;i++){
  const {grid,start}=generateMaze(rng);
  const route=visit(grid,start);
  if(grid.length!==13||grid.some(row=>row.length!==13))throw new Error('unexpected size');
  if(route.find(([x,y])=>grid[y][x]==='G')?.[2]<20)throw new Error('short route');
  if(!route.some(([x,y])=>grid[y][x]==='G'))throw new Error('missing route');
  if(route.length!==grid.flat().filter(tile=>tile!=='#').length)throw new Error('disconnected starting layout');
  layouts.add(grid.map(row=>row.join('')).join(''));
  const cloud=realSmoke(grid,start,rng);
  if(cloud.size<2||cloud.size>4)throw new Error('invalid cloud size');
  const smokeGrid=grid.map((row,y)=>row.map((tile,x)=>cloud.has(y+':'+x)?tile:'#'));
  const [cloudY,cloudX]=[...cloud][0].split(':').map(Number);
  if(visit(smokeGrid,[cloudX,cloudY]).length!==cloud.size)throw new Error('disconnected cloud');
  for(const [x,y] of route.filter((_,idx)=>idx%12===0)){
   const next=actualShift(grid,[x,y],rng);
   if(!next)continue;
   const changed=grid.flatMap((row,cy)=>row.filter((tile,cx)=>tile!==next[cy][cx]));
   cases.push([visit(next,[x,y]).some(([cx,cy])=>next[cy][cx]==='G'),next[y][x]!=='#',
    changed.length>=1&&changed.length<=2,changed.every(tile=>tile==='#'||tile==='.'),
    next[0].every(tile=>tile==='#')&&next.at(-1).every(tile=>tile==='#')&&
     next.every(row=>row[0]==='#'&&row.at(-1)==='#')]);
  }
 }
`);
assert(run('layouts.size===100&&cases.length>500&&cases.every(checks=>checks.every(Boolean))'));
// Exercise real 13×13 board redraws repeatedly with hazards running together.
run('TireMazeHazards.generate=()=>generateMaze(rng);TireMazeHazards.shift=actualShift;TireMazeHazards.smoke=realSmoke;Math.random=rng;Route127MinigameTesting.open();');
click('Launch Game');click('Start Game');
const offsets=[['RIGHT','LEFT',0,1],['LEFT','RIGHT',0,-1],['DOWN','UP',1,0],['UP','DOWN',-1,0]];
for(let i=0;i<24;i++){
 if(i)click('Restart Game');
 const initial=survivor().style.gridArea;
 const [row,col]=initial.split(' / ').map(Number);
 const walls=originalWalls().split(',');
 const [forward,back]=offsets.find(([, ,dy,dx])=>!walls.includes((row+dy)+' / '+(col+dx)));
 move(forward);move(back);
 if(!text('The burning tire stacks begin to sway…'))move(forward);
 const expected=survivor().style.gridArea;
 assert(expected);
 advance(700);
 assert(text('CRASH! Burning tires tumble into the passage!'));
 assert.equal(survivor().style.gridArea,expected);
 advance(1500);
 assert(find(document.body,n=>n.className.includes('tire-yard-smoke')));
 assert.equal(survivor().style.gridArea,expected);
}
click('Return to Minigame Menu');
assert.equal(clocks.size,0);
console.log('PASS 100 expanded layouts, validated shifts, early hazards, timeout and retry, victory, rescue and isolation');
