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
 const roadBeds=svgElement('g',{'pointer-events':'none'});
 const pearls=svgElement('g',{});
 const costs=svgElement('g',{'pointer-events':'none'});
 guide.append(roadBeds,roads,pearls,costs);
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
  const bridge=edge.id==='boulder-junction--seaport'||[edge.a,edge.b].some(id=>['broken-bridge','west-harbor-approach','east-harbor-approach'].includes(id));
  const coordinates=points.map(point=>point.join(',')).join(' ');
  roadBeds.append(svgElement('polyline',{points:coordinates,fill:'none',
   stroke:'#21150f','stroke-width':bridge?11:7,'stroke-linejoin':'round','stroke-linecap':'round'
  }));
  const line=svgElement('polyline',{
   'data-pearl-road':edge.id,points:coordinates,
   fill:'none',stroke:open?(bridge?'#ddbf91':'#c69e64'):'#d67455','stroke-width':bridge?6:3,
   'stroke-dasharray':v.approximateEdges[edge.id]?'8 6':'none'
  });
  line.append(svgElement('title',{},LG_NODES[edge.a].name+' ↔ '+LG_NODES[edge.b].name+' · '+edge.distanceTurns+' turns'+(open?'':' · blocked')));
  roads.append(line);
  if(bridge)roads.append(svgElement('polyline',{points:coordinates,fill:'none',
   stroke:'#503a28','stroke-width':3,'stroke-dasharray':'2 6','pointer-events':'none'
  }));
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
 const names=svgElement('g',{'pointer-events':'none','data-forge-landmarks':'true'});
 const icons={
  house:'M-18 1 0-15 18 1 13 1 13 15-13 15-13 1Z M-3 15V4H4V15',
  solace:'M-20 14V-7H-13V-13H-7V-7H7V-13H13V-7H20V14H5V4H-5V14Z',
  factory:'M-21 15V-3L-9-10V-2L3-10V-2H10V-16H16V-2H21V15Z M-15 6H-9 M-3 6H3 M9 6H15',
  'boulder-junction':'M-22 13-14-4-6-2 2-14 13-10 22 11 11 15-10 16Z M-14 4-5 7 1-2 10 1 13-8',
  seaport:'M-22 8H22L15 15H-14Z M-17 7V-3L-9-10-1-3V7 M3 7V-8L11-15 19-8V7 M-20 20Q-13 16-6 20T8 20T22 20',
  'northern-ridge':'M-22 15-8-8-1 3 9-15 22 15Z M4-5 9-8 14-5',
  'watchtower-ruins':'M-10 15-6-5-10-5-10-13H10V-5H6L10 15 M-7 7H7',
  'broken-bridge':'M-21-2H-6L-2 3 M5 2 9-2H21 M-15-1V13 M15-1V13',
  'abandoned-motel':'M-19 14V-6H19V14Z M-12 0H-5 M2 0H11 M0 14V5H7V14',
  'scavenger-camp':'M-19 14 0-13 19 14Z M-7 14 0 3 7 14',
  'iron-pit-arena':'M-19 0-13-10H13L19 0 13 12H-13Z M-13 0H13',
  'scrap-yard':'M-20 14-16 5-9 4-7-7 2-12 8 0 16 1 20 14Z M-5 2 2 7 9 4',
  'old-service-road':'M-18 11-9-10H9L18 11Z M0-7V-2 M0 2V7'
 };
 const major=new Set(['house','solace','factory','boulder-junction','seaport']);
 for(const node of LANTERN_WORLD_GRAPH.nodes){
  const shape=icons[node.id];
  if(!shape)continue;
  const [x,y]=v.nodes[node.id];
  const coast=node.id==='seaport';
  // Icons stay above the node; names are displayed below their icons.
  const dx=coast?96:0,dy=coast?-52:-49;
  names.append(svgElement('line',{x1:x,y1:y,x2:x+dx,y2:y+dy,stroke:'#ead2a5','stroke-width':2}));
  const icon=svgElement('g',{transform:`translate(${x+dx} ${y+dy}) scale(${major.has(node.id)?1:.75})`});
  icon.append(svgElement('path',{d:shape,fill:node.id==='boulder-junction'?'#947c6e':'#433028',
   stroke:'#ffe1a5','stroke-width':2,'stroke-linejoin':'round','stroke-linecap':'round'}));
  names.append(icon);
  names.append(svgElement('text',{x:x+dx,y:y+dy+37,'text-anchor':'middle',fill:'#fff0cd',
   stroke:'#22160f','stroke-width':5,'paint-order':'stroke','font-size':major.has(node.id)?19:16,
   'font-weight':'bold','font-family':'system-ui, sans-serif'
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
 toggle('Hide turn markers','Show turn markers',active=>{
  pearls.style.display=costs.style.display=active?'none':'';
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
 // These controls were authoring/debug UI, not player-facing map controls.
 // Keep them in the DOM for the visual overlay's setup and sync behavior,
 // but show only when the owner explicitly opens DEVTEST map-editor mode.
 if(new URLSearchParams(location.search).get('mapEditor')!=='1')controls.style.display='none';
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
