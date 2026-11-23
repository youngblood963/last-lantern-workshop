/* DEVTEST map exploration. Coordinates and turn accounting remain owned by lantern_world. */
(() => {
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='PLAYTEST')return;
 const namespace='http://www.w3.org/2000/svg';
 let serial=0;
 const svgNode=(name,attrs={})=>{
  const el=document.createElementNS(namespace,name);
  for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);
  return el;
 };
 function recordStep(state,edge,next){
  if(Math.abs(next-state.stepIndex)!==1||next<0||next>edge.distanceTurns)return;
  const index=Math.min(next,state.stepIndex);
  const explored=state.exploredSegments||(state.exploredSegments={});
  const steps=explored[edge.id]||(explored[edge.id]=[]);
  if(!steps.includes(index))steps.push(index);
 }
 function revealData(state,flags){
  const nodes=new Set(['house',...(state.discoveredNodes||[]),state.nodeId,
   ...(flags.mercyDiscovered?['solace']:[]),state.lastSettlement]);
  const roads=[];
  for(const [id,steps] of Object.entries(state.exploredSegments||{})){
   const edge=LG_EDGES[id];
   if(!edge||!Array.isArray(steps))continue;
   const ordered=[...new Set(steps.filter(step=>Number.isInteger(step)&&step>=0&&step<edge.distanceTurns))].sort((a,b)=>a-b);
   let range=null;
   for(const step of ordered){
    if(range&&range.end===step)range.end++;
    else {range={edge,start:step,end:step+1};roads.push(range);}
   }
  }
  const sites=[flags.r18Ash,flags.r18Station].filter(site=>site&&LG_EDGES[site.edge]&&Number.isFinite(site.step));
  return {nodes,roads,sites};
 }
 function apply(figure,state){
  const svg=figure?.querySelector('svg');
  if(!svg||!state||svg.querySelector('[data-exploration-fog]'))return null;
  const id='r127-exploration-fog-'+(++serial);
  const {width:W,height:H}=LANTERN_MAP_VISUAL;
  const data=revealData(state,player.flags);
  const marker=svg.querySelector('#lantern-player-marker');
  const label=[...svg.querySelectorAll('text')].find(el=>el.textContent==='YOU ARE HERE');
  const definitions=svgNode('defs');
  const mask=svgNode('mask',{id,maskUnits:'userSpaceOnUse',maskContentUnits:'userSpaceOnUse',x:0,y:0,width:W,height:H});
  const clear=svgNode('radialGradient',{id:id+'-clear'});
  for(const [offset,opacity] of [[0,1],[.68,1],[1,0]])clear.append(svgNode('stop',{offset,'stop-color':'black','stop-opacity':opacity}));
  const edgeFilter=svgNode('filter',{id:id+'-edge',x:0,y:0,width:W,height:H,filterUnits:'userSpaceOnUse'});
  edgeFilter.append(
   svgNode('feTurbulence',{type:'fractalNoise',baseFrequency:'.025 .036',numOctaves:2,seed:127,result:'wisps'}),
   svgNode('feDisplacementMap',{in:'SourceGraphic',in2:'wisps',scale:9,xChannelSelector:'R',yChannelSelector:'G'}),
   svgNode('feGaussianBlur',{stdDeviation:2.6})
  );
  definitions.append(clear,edgeFilter,mask);svg.append(definitions);
  const fog=svgNode('g',{'data-exploration-fog':'','pointer-events':'none','aria-hidden':'true'});
  const texture=svgNode('g',{mask:'url(#'+id+')'});
  texture.append(
   svgNode('rect',{width:W,height:H,fill:'#34383a'}),
   svgNode('image',{href:'../devtest/assets/map-smoke.svg',width:W,height:H,preserveAspectRatio:'none'})
  );
  fog.append(texture);
  for(const source of [marker,label]){
   if(!source)continue;
   const copy=source.cloneNode(true);copy.removeAttribute('id');fog.append(copy);
  }
  svg.append(fog);
  const originalGroup=marker?.closest('[data-pearl-original]')||
   svg.querySelector('[data-pearl-guide]')?.parentElement?.parentElement;
  const reveal=svgNode('g',{filter:'url(#'+id+'-edge)'});
  mask.append(svgNode('rect',{width:W,height:H,fill:'white'}),reveal);
  const refresh=()=>{
   for(const source of [marker,label])if(source)source.style.visibility='hidden';
   for(const el of svg.querySelectorAll('[data-map-node]'))
    el.style.visibility=!data.nodes.has(el.getAttribute('data-map-node'))?'hidden':'';
   for(const el of svg.querySelectorAll('[data-place],[data-cinematic-place-label]')){
    const place=el.getAttribute('data-place');
    const labelId=el.getAttribute('data-cinematic-place-label');
    const key=place||(labelId==='old_house'?'house':labelId?.replaceAll('_','-'));
    el.style.visibility=LG_NODES[key]&&!data.nodes.has(key)?'hidden':'';
   }

   const matrix=originalGroup?.transform?.baseVal?.[0]?.matrix;
   const project=([x,y])=>[x*W,y*H*(matrix?.d??1)+(matrix?.f??0)];
   const circle=(point,r)=>{const [cx,cy]=project(point);return svgNode('circle',{cx,cy,r,fill:'url(#'+id+'-clear)'});};
   const cuts=[];
   for(const {edge,start,end} of data.roads){
    const points=[];
    for(let n=start*8;n<=end*8;n++)points.push(project(lanternVisualEdgePoint(edge,n/8)).join(','));
    for(const [width,opacity] of [[.105,.18],[.092,.36],[.079,.58],[.068,1]])
     cuts.push(svgNode('polyline',{points:points.join(' '),fill:'none',stroke:'black','stroke-width':W*width,'stroke-opacity':opacity,'stroke-linecap':'round','stroke-linejoin':'round'}));
   }
   for(const node of data.nodes)if(LANTERN_MAP_VISUAL.nodes[node])cuts.push(circle(lanternVisualNode(node),W*.058));
   for(const site of data.sites)cuts.push(circle(lanternVisualEdgePoint(LG_EDGES[site.edge],site.step),W*.087));
   const here=lanternMarker();
   cuts.push(circle(here,W*.048));
   reveal.replaceChildren(...cuts);
   const [x,y]=project(here);
   if(marker){fog.children[1].setAttribute('cx',x);fog.children[1].setAttribute('cy',y);}
   if(label){const copy=fog.lastElementChild;copy.setAttribute('x',x+15);copy.setAttribute('y',y-16);}
  };
  refresh();
  return refresh;
 }
 if(typeof Route127MapOverlay!=='undefined'){
  const open=Route127MapOverlay.open;
  Route127MapOverlay.open=function(...args){
   const result=open.apply(this,args);
   const dialog=this.dialog;
   apply(dialog?.querySelector('.lantern-map'),lanternState());

   return result;
  };
 }
 globalThis.Route127MapFog=Object.freeze({recordStep,apply});
})();
