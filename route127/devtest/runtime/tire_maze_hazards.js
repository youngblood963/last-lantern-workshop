/* DEVTEST maze hazard rules. Layouts are copied before a shift is committed. */
const TireMazeHazards=(()=>{
 const settings=Object.freeze({
  size:13,loopOpenings:4,duration:20000,
  firstShift:[2,3],shiftInterval:[2,4],shiftChance:.75,
  maxChangedTiles:2,warning:700,firstSmoke:[1000,2000],smokeInterval:[2000,4000],
  smokeDuration:[3000,5000],smokeCells:[2,4],smokeDamage:.02
 });
 const randomBetween=([min,max],rng=Math.random)=>min+Math.floor(rng()*(max-min+1));
 const neighbors=([x,y])=>[[x+1,y],[x-1,y],[x,y+1],[x,y-1]];
 const key=([x,y])=>y+':'+x;
 const isWall=(grid,[x,y])=>grid[y]?.[x]==='#';
 const walkable=(grid,[x,y])=>grid[y]?.[x]!==undefined&&!isWall(grid,[x,y]);
 function reachable(grid,start){
  const visited=new Set([key(start)]),queue=[start];
  for(let i=0;i<queue.length;i++){
   for(const cell of neighbors(queue[i])){
    if(!walkable(grid,cell)||visited.has(key(cell)))continue;
    visited.add(key(cell));queue.push(cell);
   }
  }
  return queue;
 }
 function shuffled(items,rng){
  const list=[...items];
  for(let i=list.length-1;i>0;i--){
   const j=Math.floor(rng()*(i+1));
   [list[i],list[j]]=[list[j],list[i]];
  }
  return list;
 }
 function generate(rng=Math.random){
  // An odd square leaves a continuous border and an alternating wall lattice.
  const size=settings.size,edge=size-2;
  const grid=Array.from({length:size},()=>Array(size).fill('#'));
  const start=[rng()<.5?1:edge,rng()<.5?1:edge];
  const stack=[start];
  grid[start[1]][start[0]]='S';
  while(stack.length){
   const [x,y]=stack[stack.length-1];
   const options=[[x+2,y],[x-2,y],[x,y+2],[x,y-2]]
    .filter(([cx,cy])=>cx>0&&cx<=edge&&cy>0&&cy<=edge&&grid[cy][cx]==='#');
   if(!options.length){stack.pop();continue;}
   const [cx,cy]=options[Math.floor(rng()*options.length)];
   grid[(y+cy)/2][(x+cx)/2]='.';
   grid[cy][cx]='.';
   stack.push([cx,cy]);
  }
  // Open a few lattice walls to create alternate paths while keeping corridors.
  const bridges=[];
  for(let y=1;y<=edge;y++)for(let x=1;x<=edge;x++){
   if((x+y)%2===1&&grid[y][x]==='#')bridges.push([x,y]);
  }
  for(const [x,y] of shuffled(bridges,rng).slice(0,settings.loopOpenings))grid[y][x]='.';
  const distant=reachable(grid,start).filter(([x,y])=>x%2===1&&y%2===1);
  const [gx,gy]=distant[distant.length-1];
  grid[gy][gx]='G';
  return {grid,start};
 }
 function shift(grid,survivor,rng=Math.random){
  const inner=grid.flatMap((row,y)=>row.map((tile,x)=>[x,y]).filter(([x])=>
   x>0&&x<row.length-1&&y>0&&y<grid.length-1));
  const openings=shuffled(inner.filter(cell=>isWall(grid,cell)&&neighbors(cell).some(next=>walkable(grid,next))),rng);
  const closures=shuffled(inner.filter(([x,y])=>grid[y][x]==='.'&&key([x,y])!==key(survivor)),rng);
  const dist=([x,y])=>Math.abs(x-survivor[0])+Math.abs(y-survivor[1]);
  closures.sort((a,b)=>Math.floor(dist(a)/3)-Math.floor(dist(b)/3));
  for(const [x,y] of closures){
   const nearby=openings.filter(cell=>Math.abs(cell[0]-x)+Math.abs(cell[1]-y)<=3);
   if(settings.maxChangedTiles<2)nearby.length=0;
   // Prefer a nearby opening paired with a collapse. An isolated collapse is
   // allowed only if the survivor can still reach the crate on the new grid.
   for(const opening of [...nearby,null]){
    const proposal=grid.map(row=>[...row]);
    proposal[y][x]='#';
    if(opening)proposal[opening[1]][opening[0]]='.';
    if(reachable(proposal,survivor).some(([cx,cy])=>proposal[cy][cx]==='G'))return proposal;
   }
  }
  return null;
 }
 function smoke(grid,survivor,rng=Math.random){
  const available=reachable(grid,survivor).filter(([x,y])=>grid[y][x]==='.'&&key([x,y])!==key(survivor));
  const adjacent=available.filter(cell=>neighbors(cell).some(next=>isWall(grid,next)));
  // Try nearby wall edges first so smoke affects routes the survivor can use.
  const near=adjacent.slice(0,12);
  const seeds=[...shuffled(near,rng),...shuffled(adjacent.slice(near.length),rng)];
  const count=randomBetween(settings.smokeCells,rng);
  for(const seed of seeds){
   const cloud=[seed],cells=new Set(cloud.map(key));
   while(cloud.length<count){
    const edge=cloud.flatMap(neighbors).filter(([x,y])=>
     grid[y]?.[x]==='.'&&!cells.has(key([x,y]))&&key([x,y])!==key(survivor));
    if(!edge.length)break;
    const next=edge[Math.floor(rng()*edge.length)];
    cloud.push(next);cells.add(key(next));
   }
   if(cloud.length>=settings.smokeCells[0])return cells;
  }
  return new Set();
 }

 return {settings,randomBetween,key,generate,shift,smoke};
})();
