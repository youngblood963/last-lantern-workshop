/* DEVTEST navigation/UI repair batch — no changes to the authoritative graph, save format or other environments. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
const named={
 house:{'west-ridge':['West','Abandoned Motel'],'east-ridge':['East','Scavenger Camp'],'solace-upper-junction':['South','Solace']},
 'solace-upper-junction':{house:['North','Old House'],solace:['South','Solace'],'motel-interior-junction':['West','Abandoned Motel'],'trade-junction':['East','Scavenger Camp']}
};
const destinations=new Set(['house','solace','seaport','factory','abandoned-motel','scavenger-camp','iron-pit-arena','scrap-yard','old-service-road','station-nine','broken-bridge','watchtower-ruins','northern-ridge','lowlands']);
function nearestLandmark(start,previous){
 const distances=new Map([[start,0]]),visited=new Set();
 for(let i=0;i<50;i++){
  const current=[...distances.keys()].filter(n=>!visited.has(n)).sort((a,b)=>distances.get(a)-distances.get(b))[0];
  if(!current)break;
  if(destinations.has(current))return LG_NODES[current]?.name;
  visited.add(current);
  for(const e of lanternConnections(current)){
   const next=lanternOther(e,current);
   if(next===previous||!lanternAllowed(e))continue;
   const d=distances.get(current)+e.distanceTurns;
   if(d<(distances.get(next)??Infinity))distances.set(next,d);
  }
 }
 return LG_NODES[start]?.name||'next junction';
}
function roadLabel(node,edge){
 const next=lanternOther(edge,node),override=named[node]?.[next];
 if(override)return override[0]+' toward '+override[1];
 const compass=lanternCompass(LG_NODES[node].anchor,LG_NODES[next].anchor);
 return compass.charAt(0).toUpperCase()+compass.slice(1)+' toward '+nearestLandmark(next,node);
}
function journeyLabel(command){
 const g=lanternState();
 if(!g)return null;
 if(/^take road to /i.test(command)&&!g.currentEdgeId){
  const target=command.slice(13).toLowerCase();
  const edge=lanternConnections(g.nodeId).find(e=>LG_NODES[lanternOther(e,g.nodeId)]?.name.toLowerCase()===target);
  if(edge)return roadLabel(g.nodeId,edge)+' ('+edge.distanceTurns+' turns)';
 }
 const edge=lanternEdge();
 if(!edge)return null;
 const origin=g.direction>0?edge.a:edge.b;
 const dest=g.direction>0?edge.b:edge.a;
 if(command==='continue road')return 'Continue '+roadLabel(origin,edge)+' ('+Math.abs((g.direction>0?edge.distanceTurns:0)-g.stepIndex)+' turns left)';
 if(command==='reverse direction')return 'Turn around toward '+LG_NODES[origin].name;
 return null;
}
// Menus retain their original executable commands and keyboard shortcuts.
if(typeof GraphicalUI!=='undefined'){
 const oldChoices=GraphicalUI.choices;
 GraphicalUI.choices=function(){
  const options=oldChoices.call(this),seen=new Set();
  return options.filter(c=>{
   const cmd=String(c.command).toLowerCase();
   if(combatState&&['back','b'].includes(cmd))return false;
   if(stage==='lanternRoad'&&cmd==='return to junction')return false;
   if(stage==='lanternRoad'&&['reverse direction','return to junction'].includes(cmd)){
    if(seen.has('road-retreat'))return false;
    seen.add('road-retreat');
   }
   return true;
  }).map(c=>{
   const cmd=String(c.command).toLowerCase();
   const road=journeyLabel(cmd);
   if(road)return {...c,label:road};
   if((/wanderer/i.test(String(stage))||!!townWandererFocus||!!player.flags.v50Trade)&&/^trade(?:\b| with)/i.test(cmd))
    return {...c,label:'Browse Wares'};
   return c;
  });
 };
}
// Remove the secondary zero-turn Return option on road screens. Reverse remains available.
const oldDirectChoices=r5DirectChoices;
r5DirectChoices=function(options){
 if(stage==='lanternRoad'&&lanternEdge()){
  options=options.filter(x=>String(x).toLowerCase()!=='return to junction');
 }
 return oldDirectChoices.call(this,options);
};
// Selecting an exit at a node starts the first travel turn immediately.
// Do not intercept roadReady: its existing handler already performs that first step.
const previousCore=handleCommandCore;
handleCommandCore=async function(raw){
 if(!busy&&['lanternNode','lanternGate'].includes(stage)){
  const cmd=String(r5Mapped(raw)||'').trim().toLowerCase(),g=lanternState();
  if(g&&!g.currentEdgeId&&cmd.startsWith('take road to ')){
   const target=cmd.slice(13);
   const edge=lanternConnections(g.nodeId).find(e=>
    LG_NODES[lanternOther(e,g.nodeId)]?.name.toLowerCase()===target&&
    (stage!=='lanternGate'||e.solaceGate===g.selectedGate));
   if(edge){
    if(!lanternChoose(edge.id))return;
    // The existing lanternStep handles movement cost, encounters and saving.
    return lanternStep();
   }
  }
 }
 return previousCore.apply(this,arguments);
};
// Arrival at the far endpoint should resolve to the node rather than demand
// a zero-cost seventh "Continue" selection. Starting boundaries are excluded.
const oldRoadMenu=lanternRoadMenu;
lanternRoadMenu=function(...args){
 const g=lanternState(),edge=lanternEdge();
 if(g&&edge&&!g.pending&&
   ((g.direction>0&&g.stepIndex===edge.distanceTurns)||
    (g.direction<0&&g.stepIndex===0)))return lanternArrive(g.direction>0?edge.b:edge.a);
 return oldRoadMenu.apply(this,args);
};
globalThis.Route127DevtestNavigationFix=Object.freeze({version:'2026-11-03',roadLabel});
})();