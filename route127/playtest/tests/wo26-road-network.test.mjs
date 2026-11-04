/* WO26: static validation of authoritative Playtest road geography.
 * Run: node --test route127/playtest/tests/wo26-road-network.test.mjs
 * No DOM, browser, save migration or backend is required. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const dir=new URL('../',import.meta.url);
const graph=JSON.parse(readFileSync(new URL('../lantern_world_graph.json',import.meta.url),'utf8'));
const nodes=new Map(graph.nodes.map(n=>[n.id,n]));
const dirs=['N','NE','E','SE','S','SW','W','NW'];
function compass(from,to) {
 const a=nodes.get(from).anchor,b=nodes.get(to).anchor;
 const x=(b[0]-a[0])*graph.imageWidth,y=(b[1]-a[1])*graph.imageHeight;
 return (Math.round(Math.atan2(x,-y)/(Math.PI/4))+8)%8;
}
test('authoritative map has 34 unique nodes and 54 unique traversable roads',()=>{
 assert.equal(nodes.size,34);assert.equal(graph.nodes.length,34);
 assert.equal(graph.edges.length,54);
 const ids=new Set(),pairs=new Set();
 for(const edge of graph.edges){
  assert.ok(!ids.has(edge.id),`duplicate id ${edge.id}`);ids.add(edge.id);
  assert.ok(nodes.has(edge.a)&&nodes.has(edge.b),`orphan ${edge.id}`);
  assert.notEqual(edge.a,edge.b);
  const pair=[edge.a,edge.b].sort().join('--');
  assert.ok(!pairs.has(pair),`duplicate road ${pair}`);pairs.add(pair);
  assert.ok(Number.isInteger(edge.distanceTurns)&&edge.distanceTurns>0);
  assert.ok(edge.name&&typeof edge.name==='string');
  assert.ok(!/Lantern Highway/i.test(edge.name));
 }
});
test('every node connects to the Old House through bidirectional roads',()=>{
 const adj=new Map(graph.nodes.map(n=>[n.id,[]]));
 for(const e of graph.edges){adj.get(e.a).push(e.b);adj.get(e.b).push(e.a);}
 const reached=new Set(['house']),queue=['house'];
 while(queue.length){for(const n of adj.get(queue.shift()))if(!reached.has(n)){reached.add(n);queue.push(n);}}
 assert.equal(reached.size,34);
});
test('compass labels reverse correctly and road endpoints align',()=>{
 for(const e of graph.edges){
  assert.equal((compass(e.a,e.b)+4)%8,compass(e.b,e.a),e.id);
  assert.ok(dirs[compass(e.a,e.b)]);
  if(e.polyline?.length){
   for(const [pos,nodeId] of [[e.polyline[0],e.a],[e.polyline.at(-1),e.b]]){
    const anchor=nodes.get(nodeId).anchor;
    assert.ok(Math.hypot(pos[0]-anchor[0],pos[1]-anchor[1])<0.025,`bad endpoint ${e.id}`);
   }
  }
 }
});
test('canonical graph JSON and its JS projection agree',()=>{
 const source=readFileSync(new URL('../lantern_world_graph.js',import.meta.url),'utf8');
 const start=source.indexOf('const LANTERN_WORLD_GRAPH = ');
 assert.ok(start>=0);
 const jsonStart=source.indexOf('{',start);
 const data=JSON.parse(source.slice(jsonStart,source.indexOf(';',jsonStart)));
 assert.deepEqual(data.nodes,graph.nodes);
 assert.deepEqual(data.edges,graph.edges);
});
test('approved Node 10 geography remains WEST',()=>{
 const nav=readFileSync(new URL('../regional_navigation.js',import.meta.url),'utf8');
 assert.match(nav,/WEST:\[3,5,7,10,14\]/);
});
test('player-facing map no longer uses old highway name',()=>{
 const ui=readFileSync(new URL('../graphics.js',import.meta.url),'utf8');
 assert.doesNotMatch(ui,/Lantern Highway/i);
});
