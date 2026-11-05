/* DEVTEST presentation polish: road choices + approved healing percentages.
 * No map edits, movement or turn changes. */
(()=>{'use strict';if(!/\/route127\/playtest\/(?:index\.html)?$/.test(location.pathname))return;
if(typeof HEALING_ITEM_RATES!=='undefined')Object.assign(HEALING_ITEM_RATES,{
 'Fresh Carrot':.05,'Fresh Potato':.05,'Fresh Tomato':.05,'Fresh Cabbage':.05,
 'Roadhouse Hash':.30
});
if(typeof GraphicalUI==='undefined')return;
const oldChoices=GraphicalUI.choices;
function labelFor(command){
 if(!/^take road to /i.test(command)||stage!=='lanternNode')return null;
 const g=lanternState();if(!g||g.currentEdgeId)return null;
 const dest=command.slice(13).toLowerCase();
 const e=lanternConnections(g.nodeId).find(e=>LG_NODES[lanternOther(e,g.nodeId)]?.name.toLowerCase()===dest);
 if(!e)return null;
 const next=lanternOther(e,g.nodeId),points=e.polyline||[],atStart=e.a===g.nodeId;
 let from=LG_NODES[g.nodeId]?.anchor,to=LG_NODES[next]?.anchor;
 if(points.length>=2){from=atStart?points[0]:points[points.length-1];to=atStart?points[1]:points[points.length-2];}
 if(!from||!to)return null;
 const dx=to[0]-from[0],dy=to[1]-from[1];
 const vertical=Math.abs(dy)>Math.abs(dx)*.65;
 const horizontal=Math.abs(dx)>Math.abs(dy)*.65;
 const direction=(vertical?(dy>0?'S':'N'):'')+(horizontal?(dx>0?'E':'W'):'')||'•';
 const arrow={N:'↑',NE:'↗',E:'→',SE:'↘',S:'↓',SW:'↙',W:'←',NW:'↖'}[direction]||'•';
 return arrow+' '+direction+' — '+LG_NODES[next].name.toUpperCase()+' ('+e.distanceTurns+' TURNS)';
}
GraphicalUI.choices=function(...args){
 const choices=oldChoices.apply(this,args);
 return choices.map(c=>{
  const simple=labelFor(String(c.command));
  return simple?{...c,label:simple}:c;
 });
};

/* Equipment identity highlighting: the actual Widowmaker name should be Epic
 * purple, not only the separate EPIC rarity badge. */
if(typeof RouteIdentity!=='undefined'){
 const originalRanges=RouteIdentity.ranges;
 RouteIdentity.ranges=function(label){
  const found=originalRanges.call(this,label),text=String(label);
  for(const m of text.matchAll(/\\bwidowmaker\\b/gi)){
   if(!found.some(r=>r.start<=m.index&&r.end>=m.index+m[0].length))
    found.push({start:m.index,end:m.index+m[0].length,kind:'epic'});
  }
  return found.sort((a,b)=>a.start-b.start||(b.end-b.start)-(a.end-a.start));
 };
}
})();