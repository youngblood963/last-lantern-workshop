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
 const guide=svgElement('g',{'data-pearl-guide':'','aria-label':'Road tracing guides'});
 const roads=svgElement('g',{});
 const pearls=svgElement('g',{'pointer-events':'none'});
 const costs=svgElement('g',{'pointer-events':'none'});
 guide.append(roads,pearls,costs);
 for(const edge of LANTERN_WORLD_GRAPH.edges){
  const points=v.edges[edge.id]||edge.polyline.map(([x,y])=>[x*v.width,y*v.height]);
  const open=lanternAllowed(edge);
  const line=svgElement('polyline',{
   'data-pearl-road':edge.id,points:points.map(point=>point.join(',')).join(' '),
   fill:'none',stroke:open?'#61dbc9':'#ff8e8e','stroke-width':3,
   'stroke-dasharray':v.approximateEdges[edge.id]?'8 6':'none'
  });
  line.append(svgElement('title',{},LG_NODES[edge.a].name+' ↔ '+LG_NODES[edge.b].name+' · '+edge.distanceTurns+' turns'+(open?'':' · blocked')));
  roads.append(line);
  for(let step=1;step<=edge.distanceTurns;step++){
   const [x,y]=lanternVisualEdgePoint(edge,step);
   pearls.append(svgElement('circle',{'data-pearl-step':step,'data-edge':edge.id,
    cx:x*v.width,cy:y*v.height,r:4,fill:'#e4fff9',stroke:'#12201f','stroke-width':1.5
   }));
  }
  const [x,y]=lanternVisualEdgePoint(edge,edge.distanceTurns/2);
  costs.append(svgElement('text',{x:x*v.width,y:y*v.height-8,'text-anchor':'middle',
   fill:'#e4fff9',stroke:'#12201f','stroke-width':3,'paint-order':'stroke','font-size':14
  },String(edge.distanceTurns)));
 }
 const firstNode=svg.querySelector('[data-map-node]');
 svg.insertBefore(guide,firstNode);
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
 svg.insertBefore(names,svg.querySelector('#lantern-player-marker'));
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
 });
 const art=svg.querySelector('image');
 toggle('Hide artwork','Show artwork',active=>{
  if(art)art.style.visibility=active?'hidden':'';
  svg.style.background=active?'#14201f':'';
 });
 toggle('Zoom in','Fit map',active=>{
  figure.style.overflowX=active?'auto':'';
  svg.style.width=active?'200%':'';
  svg.style.maxWidth=active?'none':'';
  if(!active)figure.scrollLeft=0;
 });
 figure.before(controls);
}

const open=Route127MapOverlay.open;
Route127MapOverlay.open=function(){
 const result=open.apply(this,arguments);
 if(result&&this.dialog)addTracingControls(this.dialog);
 return result;
};
})();
