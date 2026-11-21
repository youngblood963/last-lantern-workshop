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
run('Math.random=()=>0; Route127MinigameTesting.open()');
click('Launch Game');assert.equal(clocks.size,0);
click('Start Game');assert(text('45 seconds remaining'));
move('UP');assert.match(status(),/scorch you.*99 \/ 100/);
advance(35000);assert(text('10 seconds remaining').className.includes('countdown-low'));
advance(5000);assert(text('5 seconds remaining').className.includes('countdown-last'));
advance(5000);assert(text("TIME'S UP! The salvage attempt failed."));
assert.equal(clocks.size,0);
click('Try Again');assert(text('45 seconds remaining'));assert.match(status(),/99 \/ 100 · Row 2, column 2/);
const originalWalls=()=>find(document.body,n=>n.className==='tire-yard-grid').children
 .filter(n=>n.className==='tire-yard-wall').map(n=>n.style.gridArea).join(',');
const walls=originalWalls();
for(const direction of ['RIGHT','RIGHT','DOWN','DOWN'])move(direction);
assert(text('The burning tire stacks begin to sway…'));
advance(700);assert(text('CRASH! Burning tires tumble into the passage!'));assert.notEqual(originalWalls(),walls);

click('Restart Game');
run("TireMazeHazards.smoke=()=>new Set(['1:2']);");
advance(4000);assert(find(document.body,n=>n.className.includes('tire-yard-smoke')));
move('RIGHT');assert.match(status(),/toxic smoke.*98 \/ 100 · Row 2, column 3/);
advance(2900);assert.match(status(),/98 \/ 100/);assert(!find(document.body,n=>n.className.includes('tire-yard-smoke')));
click('Restart Game');
run('Math.random=()=>.99;');
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

// Sample shifts from every base maze, with the survivor at each walkable tile.
run(`
 const cases=[];
 const steps=[[1,0],[-1,0],[0,1],[0,-1]];
 for(const base of R18_MAZES){
  const grid=base.map(row=>Array.from(row));
  for(let y=1;y<grid.length-1;y++)for(let x=1;x<grid[y].length-1;x++){
   if(grid[y][x]==='#')continue;
   const next=TireMazeHazards.shift(grid,[x,y]);
   if(!next)continue;
   const start=JSON.stringify([x,y]),seen=new Set([start]),queue=[[x,y]];
   for(const [cx,cy] of queue)for(const [dx,dy] of steps){
    const px=cx+dx,py=cy+dy,tile=next[py]?.[px],key=JSON.stringify([px,py]);
    if(tile!==undefined&&tile!=='#'&&!seen.has(key)){seen.add(key);queue.push([px,py]);}
   }
   const changed=grid.flatMap((row,cy)=>row.filter((tile,cx)=>tile!==next[cy][cx]));
   cases.push([queue.some(([cx,cy])=>next[cy][cx]==='G'),next[y][x]!=='#',
    changed.length>=1&&changed.length<=2,changed.every(tile=>tile==='#'||tile==='.'),
    next[0].join('')===base[0]&&next.at(-1).join('')===base.at(-1)&&
     next.every(row=>row[0]==='#'&&row.at(-1)==='#')]);
  }
 }
`);
assert(run('cases.length>50&&cases.every(checks=>checks.every(Boolean))'));
console.log('PASS shifting tire maze countdown, retry HP, shifts, smoke, death, victory, cleanup and save isolation');
