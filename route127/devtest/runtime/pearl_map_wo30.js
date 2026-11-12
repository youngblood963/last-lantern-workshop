/* WO30 Phase B: DEVTEST tracing guides. Edit road paths in lantern_map_visual.js. */
(()=>{
'use strict';
if(!location.pathname.startsWith('/route127/devtest/')||typeof Route127MapOverlay==='undefined')return;

const svgNamespace='http://www.w3.org/2000/svg';
function svgElement(tag,attributes,text){
 const el=document.createElementNS(svgNamespace,tag);
 for(const [name,value] of Object.entries(attributes))el.setAttribute(name,value);
 if(text)el.textContent=text;
 return el;
}

function addTracingControls(dialog){
 const figure=dialog.querySelector('.lantern-map');
 const svg=figure?.querySelector('svg');
 if(!svg||svg.querySelector('[data-pearl-guide]'))return;
 const v=LANTERN_MAP_VISUAL;
 // Expand the occupied latitude band within the existing panel.
 const roadPoints=Object.values(v.edges).flat();
 const north=Math.min(...roadPoints.map(([,y])=>y));
 const south=Math.max(...roadPoints.map(([,y])=>y));
 const topPadding=48;
 const bottomPadding=50;
 const verticalScale=(v.height-topPadding-bottomPadding)/(south-north);
 const verticalOffset=topPadding-north*verticalScale;
 const expandedY=y=>y*verticalScale+verticalOffset;
 const originalNodes=svgElement('g',{});
 originalNodes.append(...Array.from(svg.children));
 svg.append(originalNodes);
 const playerMarker=originalNodes.querySelector('#lantern-player-marker');
 const playerLabel=playerMarker?.nextElementSibling;
 const playerX=Number(playerMarker?.getAttribute('cx'));
 const playerY=Number(playerMarker?.getAttribute('cy'));
 const travel=lanternState();
 const activeEdge=LG_EDGES[travel.currentEdgeId];
 let expandedPosition=[playerX,expandedY(playerY)];
 const guide=svgElement('g',{'data-pearl-guide':'','aria-label':'Road tracing guides'});
 const roads=svgElement('g',{});
 const pearls=svgElement('g',{});
 const costs=svgElement('g',{'pointer-events':'none'});
 guide.append(roads,pearls,costs);
 for(const edge of LANTERN_WORLD_GRAPH.edges){
  const points=(v.edges[edge.id]||edge.polyline.map(([x,y])=>[x*v.width,y*v.height]))
   .map(([x,y])=>[x,expandedY(y)]);
  const segments=points.slice(1).map(([x,y],i)=>Math.hypot(x-points[i][0],y-points[i][1]));
  const length=segments.reduce((sum,segment)=>sum+segment,0);
  function position(step){
   let remaining=length*Math.max(0,Math.min(step,edge.distanceTurns))/edge.distanceTurns;
   for(let i=0;i<segments.length;i++){
    if(remaining<=segments[i]||i===segments.length-1){
     const fraction=segments[i]?remaining/segments[i]:0;
     return points[i].map((value,axis)=>value+(points[i+1][axis]-value)*fraction);
    }
    remaining-=segments[i];
   }
   return points[0];
  }
  if(edge===activeEdge)expandedPosition=position(travel.stepIndex);
  const open=lanternAllowed(edge);
  const line=svgElement('polyline',{
   'data-pearl-road':edge.id,points:points.map(point=>point.join(',')).join(' '),
   fill:'none',stroke:open?'#61dbc9':'#ff8e8e','stroke-width':3,
   'stroke-dasharray':v.approximateEdges[edge.id]?'8 6':'none'
  });
  line.append(svgElement('title',{},LG_NODES[edge.a].name+' ↔ '+LG_NODES[edge.b].name+' · '+edge.distanceTurns+' turns'+(open?'':' · blocked')));
  roads.append(line);
  for(let step=1;step<=edge.distanceTurns;step++){
   const [x,y]=position(step);
   const pearl=svgElement('circle',{'data-pearl-step':step,'data-edge':edge.id,
    cx:x,cy:y,r:4,fill:'#e4fff9',stroke:'#12201f','stroke-width':1.5
   });
   pearl.append(svgElement('title',{},LG_NODES[edge.a].name+' → '+LG_NODES[edge.b].name+' · turn '+step+' of '+edge.distanceTurns));
   pearls.append(pearl);
  }
  const [x,y]=position(edge.distanceTurns/2);
  costs.append(svgElement('text',{x,y:y-8,'text-anchor':'middle',
   fill:'#e4fff9',stroke:'#12201f','stroke-width':3,'paint-order':'stroke','font-size':14
  },String(edge.distanceTurns)));
 }
 // Check marker clearance in artwork pixels, independent of browser zoom.
 const minimumGap=12;
 const crowded=new Set();
 const overlaps=new Set();
 const dots=Array.from(pearls.children);
 for(let i=0;i<dots.length;i++){
  const a=dots[i],edgeA=LG_EDGES[a.getAttribute('data-edge')];
  const stepA=Number(a.getAttribute('data-pearl-step'));
  for(let j=i+1;j<dots.length;j++){
   const b=dots[j],edgeB=LG_EDGES[b.getAttribute('data-edge')];
   const stepB=Number(b.getAttribute('data-pearl-step'));
   if(edgeA===edgeB&&stepB!==stepA+1)continue;
   if(edgeA!==edgeB&&stepA===edgeA.distanceTurns&&stepB===edgeB.distanceTurns&&edgeA.b===edgeB.b)continue;
   const dx=Number(a.getAttribute('cx'))-Number(b.getAttribute('cx'));
   const dy=Number(a.getAttribute('cy'))-Number(b.getAttribute('cy'));
   if(Math.hypot(dx,dy)>=minimumGap)continue;
   const issues=edgeA===edgeB?crowded:overlaps;
   issues.add(a);issues.add(b);
  }
 }
 const diagnostics=svgElement('g',{'pointer-events':'none'});
 for(const dot of new Set([...crowded,...overlaps])){
  diagnostics.append(svgElement('circle',{
   cx:dot.getAttribute('cx'),cy:dot.getAttribute('cy'),r:8,fill:'none',
   stroke:overlaps.has(dot)?'#ff7197':'#ffce78','stroke-width':2
  }));
 }
 guide.append(diagnostics);
 // Layer guides above the artwork and below the existing junctions and marker.
 const firstNode=originalNodes.querySelector('[data-map-node]');
 const guideLayer=svgElement('g',{transform:`matrix(1 0 0 ${1/verticalScale} 0 ${-verticalOffset/verticalScale})`});
 guideLayer.append(guide);
 originalNodes.insertBefore(guideLayer,firstNode);
 const names=svgElement('g',{'pointer-events':'none'});
 for(const node of LANTERN_WORLD_GRAPH.nodes){
  if(node.kind==='junction')continue;
  const [x,y]=v.nodes[node.id];
  names.append(svgElement('rect',{x:x-18,y:y-18,width:36,height:36,rx:5,
   fill:'none',stroke:'#ffce78','stroke-width':2}));
  names.append(svgElement('text',{x,y:y-22,'text-anchor':'middle',fill:'#ffdf99',
   stroke:'#18140e','stroke-width':4,'paint-order':'stroke','font-size':16
  },node.name));
 }
 originalNodes.insertBefore(names,playerMarker);
 const controls=document.createElement('div');
 controls.style.cssText='display:flex;flex-wrap:wrap;gap:.5rem;margin:.5rem 0';
 function toggle(on,off,apply){
  const button=document.createElement('button');button.type='button';
  let active=false;
  function update(){button.textContent=active?off:on;button.setAttribute('aria-pressed',String(active));apply(active);}
  button.addEventListener('click',()=>{active=!active;update();});
  update();controls.append(button);
 }
 toggle('Show tracing guides','Hide tracing guides',active=>{
  guide.style.display=names.style.display=active?'':'none';
  originalNodes.setAttribute('transform',active?`matrix(1 0 0 ${verticalScale} 0 ${verticalOffset})`:'');
  const [x,y]=active?[expandedPosition[0],(expandedPosition[1]-verticalOffset)/verticalScale]:[playerX,playerY];
  if(playerMarker){
   playerMarker.setAttribute('cx',x);
   playerMarker.setAttribute('cy',y);
  }
  if(playerLabel){
   playerLabel.setAttribute('x',x+15);
   playerLabel.setAttribute('y',y-16);
  }
 });
 const art=svg.querySelector('image');
 const landscape=svgElement('image',{
  href:'../devtest/assets/wo34-landscape.webp',width:v.width,height:v.height,
  preserveAspectRatio:'xMidYMid meet','pointer-events':'none'
 });
 landscape.style.display='none';
 svg.insertBefore(landscape,originalNodes);
 let useLandscape=false;
 let hideArtwork=false;
 function updateArtwork(){
  if(art)art.style.visibility=hideArtwork||useLandscape?'hidden':'';
  landscape.style.display=useLandscape&&!hideArtwork?'':'none';
  svg.style.background=hideArtwork||useLandscape?'#14201f':'';
 }
 landscape.addEventListener('error',()=>{
  landscape.remove();
  landscapeButton.disabled=true;
  landscapeButton.textContent='Landscape unavailable';
  useLandscape=false;
  updateArtwork();
 });
 toggle('Show landscape preview','Show original artwork',active=>{
  useLandscape=active;
  updateArtwork();
  const guides=controls.firstElementChild;
  if(active&&guides.getAttribute('aria-pressed')==='false')guides.click();
 });
 const landscapeButton=controls.lastElementChild;
 toggle('Hide artwork','Show artwork',active=>{
  hideArtwork=active;
  updateArtwork();
 });
 const report=document.createElement('p');
 report.textContent='Marker clearance under '+minimumGap+' map pixels. Amber: '+crowded.size+
  ' markers close to the next turn on the same road. Pink: '+overlaps.size+
  ' markers close to another road’s marker.';
 toggle('Show spacing checks','Hide spacing checks',active=>{
  diagnostics.style.display=active?'':'none';
  report.hidden=!active;
  const guides=controls.firstElementChild;
  if(active&&guides.getAttribute('aria-pressed')==='false')guides.click();
 });
 const body=figure.parentElement;
 body.style.cssText+=';display:flex;flex-direction:column;overflow:hidden';
 for(const child of body.children)child.style.flexShrink='0';
 figure.style.setProperty('height','auto','important');
 figure.style.setProperty('min-height','0','important');
 figure.style.flex='1 1 0';
 controls.style.flexShrink='0';
 report.style.flexShrink='0';
 figure.before(controls,report);
}

const open=Route127MapOverlay.open;
Route127MapOverlay.open=function(){
 const result=open.apply(this,arguments);
 if(result&&this.dialog)addTracingControls(this.dialog);
 return result;
};
})();
