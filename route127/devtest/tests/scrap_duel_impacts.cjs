const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

let seed=0x127;
const context=vm.createContext({
 ROUTE127_ENV:{name:'DEVTEST'},
 window:{addEventListener(){}},
 crypto:{getRandomValues(values){
  for(let i=0;i<values.length;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   values[i]=seed;
  }
  return values;
 }}
});
const source=fs.readFileSync(path.resolve(__dirname,'../runtime/minigame_testing.js'),'utf8');
vm.runInContext(source.replace(/\}\)\(\);\s*$/,'globalThis.sample=scrapLanding;})();'),context);
const targets={10:[45.7,28.7,5.2,11.6],25:[58.8,27.2,6.2,12.7],50:[75.5,25.3,8.3,15.5]};
const boxes={
 ground:[[35,56,70,85]],truck:[[37,37.6,22,44],[86.6,89,12,16]],crate:[[65,81,84,94]],champion:[[89,92,32,38]]
};
const inside=({x,y},[cx,cy,rx,ry])=>((x-cx)/rx)**2+((y-cy)/ry)**2<=1;

for(const [score,bounds] of Object.entries(targets)){
 let previous;
 const points=new Set(),quadrants=new Set();
 let nearCenter=false,nearEdge=false;
 for(let i=0;i<250;i++){
  const point=context.sample(Number(score),previous);
  assert.equal(point.surface,'target');
  assert(inside(point,bounds));
  const [cx,cy,rx,ry]=bounds;
  const radius=Math.hypot((point.x-cx)/rx,(point.y-cy)/ry);
  nearCenter||=radius<.3;
  nearEdge||=radius>.9;
  quadrants.add((point.x>cx?1:0)+(point.y>cy?2:0));
  points.add(point.x+','+point.y);
  previous=point;
 }
 assert.equal(points.size,250);
 assert.equal(quadrants.size,4);
 assert(nearCenter&&nearEdge);
}

const counts={ground:0,truck:0,crate:0,champion:0};
const missPoints=new Set();
let previous;
for(let i=0;i<1500;i++){
 const point=context.sample(0,previous);
 const {x,y,surface}=point;
 assert(boxes[surface].some(([left,right,top,bottom])=>x>=left&&x<=right&&y>=top&&y<=bottom));
 const width={ground:8,truck:3.7,crate:5.4,champion:6}[surface];
 const height=width*1250/704/(surface==='ground'?170/69:surface==='champion'?1:170/111);
 const halfWidth=width/2+.25; // allow for the short impact wobble
 const top=y-(surface==='ground'?height/2:height)-.25;
 const bottom=y+(surface==='ground'?height/2:0)+.25;
 for(const [cx,cy,rx,ry] of Object.values(targets)){
  const nearest={x:Math.max(x-halfWidth,Math.min(cx,x+halfWidth)),y:Math.max(top,Math.min(cy,bottom))};
  assert(!inside(nearest,[cx,cy,rx,ry]),'Miss sprite overlaps a scoring target');
 }
 counts[surface]++;
 missPoints.add(x+','+y);
 previous=point;
}
assert.equal(missPoints.size,1500);
assert(counts.champion>=390&&counts.champion<=510);
assert([counts.ground,counts.truck,counts.crate].every(count=>count>=285&&count<=415));
assert.equal(context.sample(0,undefined,true).surface,'champion');
for(const score of [10,25,50])assert.equal(context.sample(score,undefined,true).surface,'target');
const spectatorSurfaces=new Set();
for(let i=0;i<300;i++){
 const point=context.sample(0,null,false,true);
 assert.notEqual(point.surface,'champion');
 spectatorSurfaces.add(point.surface);
}
assert.equal(spectatorSurfaces.size,3);
console.log('PASS 250 varied impacts per scoring target and 1,500 misses',counts);
