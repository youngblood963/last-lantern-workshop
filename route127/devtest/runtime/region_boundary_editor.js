/* Temporary owner-only DEVTEST region boundary sketch tool.
 * Saved drawings are planning annotations, NEVER gameplay region changes.
 * Coordinates are SVG map coordinates; node/pearl reference metadata included in export.
 */
(()=>{
'use strict';
if(!location.pathname.startsWith('/route127/devtest/'))return;
const overlay=globalThis.Route127MapOverlay;
if(!overlay?.open)return;
const NS='http://www.w3.org/2000/svg';
const KEY='route127:devtest:region-boundary-sketch:v1';
const REGIONS={
 CENTRAL:'#f6d470',NORTH:'#a8def7',WEST:'#76ca96',
 EAST:'#e0b1fa',INDUSTRIAL:'#f28b77',LOWLANDS:'#71c3a9',SEAPORT:'#7cb6ed'
};
const make=(tag,attrs={})=>{
 const el=document.createElementNS(NS,tag);
 for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);
 return el;
};
const html=(tag,txt)=>{const el=document.createElement(tag);if(txt!==undefined)el.textContent=txt;return el;};
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
function editor(dialog){
 const svg=dialog.querySelector('.lantern-map svg');
 const fig=dialog.querySelector('.lantern-map');
 const header=dialog.querySelector(':scope > header');
 if(!svg||!fig||!header||svg.querySelector('[data-region-sketch]'))return;
 const v=globalThis.LANTERN_MAP_VISUAL;
 if(!v)return;
 const layer=make('g',{'data-region-sketch':'','pointer-events':'none'});
 const strokes=make('g',{'pointer-events':'none'});
 const hitbox=make('rect',{x:0,y:0,width:v.width,height:v.height,
  fill:'transparent','pointer-events':'all',style:'touch-action:none;cursor:crosshair'});
 hitbox.style.display='none';
 layer.append(strokes,hitbox);
 svg.append(layer); // Above map art, roads and building imagery.
 const button=html('button','Draw Boundaries');
 button.type='button';
 button.title='Open temporary DEVTEST regional boundary sketcher';
 button.style.cssText='background:#463222;border:1px solid #c59a63;border-radius:4px;color:#f9e5c2;padding:5px 8px;cursor:pointer;font:600 12px system-ui;';
 header.insertBefore(button,header.querySelector('button[aria-label="Close map"]')||null);
 const panel=html('div');
 panel.setAttribute('data-region-drawing-controls','');
 panel.style.cssText='display:none;position:absolute;z-index:20;left:12px;top:12px;max-width:min(245px,52%);box-sizing:border-box;padding:10px;background:#21170feb;color:#faebd0;border:1px solid #c29b65;border-radius:7px;box-shadow:0 6px 18px #000b;font:12px/1.4 system-ui;';
 const title=html('strong','REGION BOUNDARY SKETCH');
 title.style.cssText='display:block;margin-bottom:6px;letter-spacing:.06em;';
 const help=html('div','Select a region, then drag across the map to draw its border. Each drag makes one line.');
 help.style.marginBottom='7px';
 const select=html('select');
 select.setAttribute('aria-label','Region to outline');
 select.style.cssText='display:block;width:100%;padding:5px;background:#38261b;color:white;border:1px solid #ac895c;margin-bottom:7px;';
 for(const [region,color] of Object.entries(REGIONS)){
  const opt=html('option',region);opt.value=region;opt.style.color=color;select.append(opt);
 }
 const toolbar=html('div');
 toolbar.style.cssText='display:flex;flex-wrap:wrap;gap:5px;margin:7px 0;';
 const smallButton=(label,action)=>{
  const el=html('button',label);el.type='button';
  el.style.cssText='font:600 11px system-ui;padding:5px 7px;color:#f8e7c9;background:#4e3828;border:1px solid #a38462;border-radius:4px;cursor:pointer;';
  el.addEventListener('click',action);toolbar.append(el);return el;
 };
 const status=html('div');
 status.setAttribute('role','status');
 status.style.cssText='margin-top:6px;font-size:11px;color:#e7cda2;';
 const note=html('div','Planning only: nothing changes in travel, encounters or scenery. Export your boundaries when finished.');
 note.style.cssText='font-size:10px;line-height:1.4;color:#bca98c;margin-top:7px;';
 panel.append(title,help,select,toolbar,status,note);
 fig.append(panel);
 let marks=[];
 try{
  const saved=JSON.parse(localStorage.getItem(KEY)||'[]');
  if(Array.isArray(saved))marks=saved.filter(row=>REGIONS[row.region]&&Array.isArray(row.points)&&row.points.length>1)
   .map(row=>({region:row.region,points:row.points.slice(0,2000).map(p=>[Number(p[0]),Number(p[1])]).filter(p=>p.every(Number.isFinite))}))
   .filter(row=>row.points.length>1).slice(0,300);
 }catch(_){}
 let editing=false,active=null;
 function persist(){
  try{localStorage.setItem(KEY,JSON.stringify(marks));status.textContent=marks.length+' boundary strokes saved on this device.';}
  catch(_){status.textContent='Browser storage blocked: export before closing.';}
 }
 const pointsText=pts=>pts.map(p=>p.join(',')).join(' ');
 function appendStroke(row){
  const path=make('polyline',{points:pointsText(row.points),fill:'none',
   stroke:REGIONS[row.region],'stroke-width':5,
   'stroke-linecap':'round','stroke-linejoin':'round',
   'stroke-opacity':'.96','pointer-events':'none'});
  path.style.filter='drop-shadow(0 0 2px #080505)';
  strokes.append(path);
  return path;
 }
 function redraw(){strokes.replaceChildren();for(const row of marks)appendStroke(row);}
 function setEditing(on){
  editing=on;button.textContent=on?'Finish Drawing':'Draw Boundaries';
  panel.style.display=on?'block':'none';
  layer.style.display=on?'':'none';
  hitbox.style.display=on?'':'none';
  // When editing, disable SVG zoom/pan gestures on the boundary canvas itself.
  hitbox.style.cursor=on?'crosshair':'';
  if(on){redraw();status.textContent=marks.length+' strokes. Draw on the map (not the control panel).';}
 }
 function toPoint(e){
  const ctm=svg.getScreenCTM();if(!ctm)return null;
  const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;
  const p=pt.matrixTransform(ctm.inverse());
  return [Math.round(clamp(p.x,0,v.width)*10)/10,Math.round(clamp(p.y,0,v.height)*10)/10];
 }
 // Capture on the SVG prevents underlying zoom handlers from starting a drag.
 // Boundary events only intercept when drawing mode is active and the hitbox is hit.
 function start(e){
  if(!editing||e.button!==0)return;
  const p=toPoint(e);if(!p)return;
  e.preventDefault();e.stopPropagation();
  active={region:select.value,points:[p]};
  active.el=appendStroke(active);
  hitbox.setPointerCapture(e.pointerId);
 }
 function move(e){
  if(!active||!editing)return;
  e.preventDefault();e.stopPropagation();
  const p=toPoint(e);if(!p)return;
  const last=active.points.at(-1);
  if(Math.hypot(p[0]-last[0],p[1]-last[1])<3)return;
  active.points.push(p);
  active.el.setAttribute('points',pointsText(active.points));
 }
 function end(e){
  if(!active)return;
  e.preventDefault();e.stopPropagation();
  if(active.points.length===1){
   const p=toPoint(e);
   if(p)active.points.push(p);
  }
  if(active.points.length>1)marks.push({region:active.region,points:active.points});
  active=null;redraw();persist();
 }
 // Use capture on the drawing rectangle; prevent any map tooltip/click action.
 for(const [name,fn] of [['pointerdown',start],['pointermove',move],['pointerup',end],['pointercancel',end]]){
  hitbox.addEventListener(name,fn);
 }
 hitbox.addEventListener('click',e=>{if(editing){e.preventDefault();e.stopPropagation();}});
 button.addEventListener('click',()=>setEditing(!editing));
 smallButton('Undo',()=>{marks.pop();redraw();persist();});
 smallButton('Clear All',()=>{if(!marks.length||!confirm('Clear all boundary drawings from this browser?'))return;marks=[];redraw();persist();});
 function pearlReferences(points){
  if(typeof LANTERN_WORLD_GRAPH==='undefined')return [];
  const found=new Map();
  // Each travel pearl has a stable edge id and turn index.
  const edges=LANTERN_WORLD_GRAPH.edges||[];
  const vs=v.edges||{};
  const allPts=Object.values(vs).flat();
  const minY=Math.min(...allPts.map(p=>p[1])),maxY=Math.max(...allPts.map(p=>p[1]));
  const yScale=(v.height-98)/(maxY-minY),yOffset=48-minY*yScale;
  const samples=points.filter((_,i)=>i%Math.max(1,Math.floor(points.length/30))===0);
  for(const point of samples){
   let best=null;
   for(const edge of edges){
    const path=vs[edge.id];if(!path?.length)continue;
    const road=path.map(([x,y])=>[x,y*yScale+yOffset]);
    const segments=road.slice(1).map((p,i)=>Math.hypot(p[0]-road[i][0],p[1]-road[i][1]));
    const total=segments.reduce((a,b)=>a+b,0);
    let used=0;
    for(let i=0;i<segments.length;i++){
     const a=road[i],b=road[i+1],dx=b[0]-a[0],dy=b[1]-a[1];
     const t=clamp(((point[0]-a[0])*dx+(point[1]-a[1])*dy)/(dx*dx+dy*dy||1),0,1);
     const x=a[0]+t*dx,y=a[1]+t*dy;
     const distance=Math.hypot(point[0]-x,point[1]-y);
     if(!best||distance<best.distance)best={edge:edge.id,pearl:Math.round((used+t*segments[i])/(total||1)*edge.distanceTurns),distance};
     used+=segments[i];
    }
   }
   // These are approximate landmarks for review; not automatic cutoffs.
   if(best&&best.distance<35){
    const key=best.edge+':'+best.pearl;
    found.set(key,{edge:best.edge,pearl:best.pearl,approximateDistance:Math.round(best.distance)});
   }
  }
  return [...found.values()];
 }
 smallButton('Export JSON',()=>{
  const payload={version:1,purpose:'owner regional boundary sketch; not gameplay',map:'Route 127 DEVTEST WO5D',
   mapSize:{width:v.width,height:v.height},
   strokes:marks.map(row=>({...row,nearbyPearls:pearlReferences(row.points)}))};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),link=html('a');
  link.href=url;link.download='route127-region-boundaries.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  status.textContent='Boundary sketch exported. Share the JSON for implementation.';
 });
 redraw();setEditing(false);
 dialog.addEventListener('close',()=>{active=null;},{once:true});
}
const previous=overlay.open;
overlay.open=function(...args){
 const result=previous.apply(this,args);
 try{editor(this.dialog||document.querySelector('dialog.route127-map-overlay[open]'));}
 catch(error){console.warn('DEVTEST region sketch editor failed:',error);}
 return result;
};
})();