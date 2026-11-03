/* WO24: presentation geography only. Never alter encounter pools or graph topology. */
const ROUTE127_NODE_REGIONS={
 CENTRAL:[1,34,9,12,8,33,13,18,32],NORTH:[2,3,4,7],WEST:[3,5,7,10,14],
 INDUSTRIAL:[12,13,15,28,21,22,16,17],LOWLANDS:[14,23,25,24,20,15],
 SEAPORT:[24,26,30,29,27,28,19,31],EAST:[4,6,11,18,19]
};
function route127RoadRegion(edge){
 if(!edge)return null;
 const split=LANTERN_WORLD_GRAPH.roadCompletion?.splits?.[edge.id];
 if(split)return route127RoadRegion(LG_EDGES[split.first]);
 const nodes=LANTERN_WORLD_GRAPH.nodes,a=nodes.findIndex(n=>n.id===edge.a)+1,b=nodes.findIndex(n=>n.id===edge.b)+1;
 const shared=Object.entries(ROUTE127_NODE_REGIONS).filter(([,ids])=>ids.includes(a)&&ids.includes(b)).map(([region])=>region);
 return shared.length===1?shared[0]:edge.primaryRegion||null;
}
function route127CurrentRegion(g){
 const active=route127RoadRegion(LG_EDGES[g?.currentEdgeId]);if(active)return active;
 if(g?.regionalContext&&g.regionalContext.nodeId===g.nodeId&&ROUTE127_NODE_REGIONS[g.regionalContext.region])return g.regionalContext.region;
 // Old saves already record their incoming road for site/quest context.
 const marker=LG_EDGES[g?.markerContext?.edge];
 if(marker&&(marker.a===g.nodeId||marker.b===g.nodeId))return route127RoadRegion(marker)||'CENTRAL';
 if(g?.nodeId==='house')return 'CENTRAL';
 const index=LANTERN_WORLD_GRAPH.nodes.findIndex(n=>n.id===g?.nodeId)+1;
 const regions=Object.entries(ROUTE127_NODE_REGIONS).filter(([,ids])=>ids.includes(index));
 return regions.length===1?regions[0][0]:'CENTRAL';
}
function route127RememberRegion(g,edge,nodeId){
 const region=route127RoadRegion(edge);if(region)g.regionalContext={region,nodeId};
}
function route127Compass(from,to){
 const a=LG_NODES[from]?.anchor,b=LG_NODES[to]?.anchor;
 if(!a||!b||![...a,...b].every(Number.isFinite))return null;
 const x=(b[0]-a[0])*LANTERN_WORLD_GRAPH.imageWidth,y=(b[1]-a[1])*LANTERN_WORLD_GRAPH.imageHeight;
 if(!x&&!y)return null;
 const i=(Math.round(Math.atan2(x,-y)/(Math.PI/4))+8)%8;
 return [['↑','N'],['↗','NE'],['→','E'],['↘','SE'],['↓','S'],['↙','SW'],['←','W'],['↖','NW']][i].join(' ');
}
function route127RoadChoiceLabel(command){
 const g=lanternState();if(!g)return command;
 const cmd=String(command).toLowerCase();let edge,from,to,cost;
 if(cmd.startsWith('take road to ')){
  edge=lanternConnections(g.nodeId).find(e=>LG_NODES[lanternOther(e,g.nodeId)].name.toLowerCase()===cmd.slice(13));
  if(edge){from=g.nodeId;to=lanternOther(edge,from);cost=edge.distanceTurns;}
 }else if(['continue road','reverse direction','return to junction'].includes(cmd)){
  edge=lanternEdge();if(edge){
   let dir=g.direction;if(cmd==='reverse direction')dir=-dir;
   if(cmd==='return to junction'){to=g.stepIndex===0?edge.a:g.stepIndex===edge.distanceTurns?edge.b:null;from=to===edge.a?edge.b:edge.a;cost=0;}
   else{from=dir>0?edge.a:edge.b;to=dir>0?edge.b:edge.a;cost=dir>0?edge.distanceTurns-g.stepIndex:g.stepIndex;}
  }
 }
 if(!edge||!to)return command;const compass=route127Compass(from,to);if(!compass)return command;
 const action=cmd==='reverse direction'?'Reverse: ':cmd==='return to junction'?'Return: ':'';
 return `${compass} — ${action}${edge.name} → ${LG_NODES[to].name} (${cost} turns)`;
}
