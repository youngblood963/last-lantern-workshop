/* Route 127 cinematic map dress — DEVTEST only.  Visual overlays; canonical graph untouched. */
(()=>{
 'use strict';
 if(!location.pathname.includes('/route127/devtest/'))return;
 const ns='http://www.w3.org/2000/svg';
 const make=(tag,attrs={})=>{
  const e=document.createElementNS(ns,tag);
  for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);
  if(tag==='image'){
   // Broken-image placeholders must never appear on the world map.
   e.addEventListener('error',()=>{console.warn('[Route127 map] Image not available:',e.getAttribute('href'));e.remove();},{once:true});
  }
  return e;
 };
 const landmarks=[
  ['old_house','house',112,-64,-68],['abandoned_motel','abandoned-motel',112,-37,-80],
  ['scavenger_camp','scavenger-camp',102,36,-73],['solace','solace',122,12,-92],
  ['iron_pit_arena','iron-pit-arena',112,-45,-69],['scrap_yard','scrap-yard',104,42,-69],
  ['factory','factory',131,-36,-109],['broken_bridge','broken-bridge',103,-38,-75],
  ['watchtower_ruins','watchtower-ruins',105,34,-84],
  ['boulder_junction','boulder-junction',115,20,-84],
  ['seaport','seaport',126,62,-104]
 ];
 // Curated road decals on top of the landscape, not a full tiled replacement
 // for all 54 actual paths. Existing pearl roads remain the navigation authority.
 const decals=[
  ['house--solace-upper-junction','paved_straight',90],
  ['west-ridge--abandoned-motel','paved_curve_left',85],
  ['east-ridge--scavenger-camp','dirt_curve',90],
  ['scavenger-camp--trade-junction','dirt_straight',80],
  ['solace--works-junction','cracked_asphalt',88],
  ['works-junction--factory','cracked_asphalt',95],
  ['iron-pit-arena--lowlands','mud_ruts',78],
  ['works-junction--scrap-yard','gravel_road',87],
  ['factory-east--east-coast-junction','paved_curve_right',85],
  ['industrial-junction--east-coast-junction','paved_straight',86],
  ['lowlands--broken-bridge','wooden_bridge',99],
  ['broken-bridge--west-coast-junction','collapsed_bridge',102],
  ['west-coast-junction--west-harbor-approach','makeshift_scrap_bridge',100],
  ['east-coast-lower--east-harbor-approach','concrete_bridge',105],
  ['east-harbor-approach--boulder-junction','steel_truss_bridge',105],
  ['boulder-junction--seaport','concrete_bridge',113],
  ['east-ridge--northern-ridge','paved_curve_right',80],
  ['trade-route--industrial-junction','cracked_asphalt',84]
 ];
 const extra=[
  {name:'st_mercy_hospital',x:785,y:485,ok:f=>!!f?.wo4Hospital?.discovered},
  {name:'fresh_mart_grocery',x:844,y:365,ok:f=>!!(f?.wo2?.freshMartClue||f?.wo2State?.freshMartClue||f?.freshMartClue)},
  {name:'ash_cemetery',x:330,y:624,ok:f=>!!f?.r18Ash},
  {name:'station_nine',x:391,y:247,ok:f=>!!f?.r18Station?.facility?.discovered}
 ];
 function mix(p,q,t){return p+(q-p)*t;}
 function midPoint(raw,expandY){
  if(!raw?.length)return null;
  const pts=raw.map(([x,y])=>[x,expandY(y)]);
  const seg=pts.slice(1).map((p,i)=>Math.hypot(p[0]-pts[i][0],p[1]-pts[i][1]));
  let d=seg.reduce((a,b)=>a+b,0)/2;
  for(let i=0;i<seg.length;i++){
   if(d<=seg[i]||i===seg.length-1){
    const t=seg[i]?d/seg[i]:0;
    return {x:mix(pts[i][0],pts[i+1][0],t),y:mix(pts[i][1],pts[i+1][1],t),
      angle:Math.atan2(pts[i+1][1]-pts[i][1],pts[i+1][0]-pts[i][0])*180/Math.PI+90};
   }
   d-=seg[i];
  }
  return null;
 }
 function draw(){
  const dialog=document.querySelector('dialog.route127-map-overlay[open]');
  const fig=dialog?.querySelector('figure.lantern-map');
  const svg=fig?.querySelector('svg');
  const v=typeof LANTERN_MAP_VISUAL!=='undefined'?LANTERN_MAP_VISUAL:null;
  if(!fig||!svg||!v||svg.querySelector('[data-cinematic-map]'))return;
  // The old SVG filled the full width and painted its spare width dark teal.
  // Constrain the SVG itself to the portrait map aspect so the actual tabletop
  // shows on either side. Inline important beats the legacy !important rules.
  fig.style.setProperty('display','flex','important');
  fig.style.setProperty('align-items','center','important');
  fig.style.setProperty('justify-content','center','important');
  fig.style.setProperty('position','relative','important');
  fig.style.setProperty('overflow','hidden','important');
  fig.style.setProperty('box-sizing','border-box','important');
  fig.style.setProperty('border','8px ridge #7a5432','important');
  fig.style.setProperty('background','repeating-linear-gradient(94deg,transparent 0 95px,#13090635 96px 98px,transparent 99px 180px),radial-gradient(ellipse at center,#694c33,#392417 60%,#140c08)','important');
  svg.style.setProperty('width','auto','important');
  svg.style.setProperty('height','100%','important');
  svg.style.setProperty('max-width','100%','important');
  svg.style.setProperty('aspect-ratio',v.width+' / '+v.height,'important');
  svg.style.setProperty('flex','0 1 auto','important');
  svg.style.setProperty('border','4px solid #ad8754','important');
  svg.style.setProperty('box-shadow','0 0 0 2px #382012,0 12px 29px #000d','important');
  // Side decorations are outside the map; never intercept controls.
  const note=fig.querySelector('.route127-map-fieldnote');
  if(note){note.style.cssText='position:absolute;right:4%;top:18%;z-index:2;pointer-events:none;box-sizing:border-box;width:110px;background:#c6a578;color:#3e2818;border:2px solid #67472b;padding:18px 8px;text-align:center;font:700 11px/1.45 Georgia,serif;box-shadow:4px 6px 15px #0009;transform:rotate(7deg);';}

  // Owner-friendly map magnifier. Zoom is SVG viewBox-only; roads, markers,
  // player position and gameplay coordinates always stay together.
  if(!dialog.querySelector('[data-map-zoom-controls]')){
   const W=v.width,H=v.height;
   const zoomControls=document.createElement('div');
   zoomControls.setAttribute('data-map-zoom-controls','');
   zoomControls.setAttribute('role','group');
   zoomControls.setAttribute('aria-label','World map magnification');
   zoomControls.style.cssText='display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:4px 0 5px;font:12px monospace;';
   let zoom=1,cx=W/2,cy=H/2;
   const box=svg.viewBox.baseVal;
   const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
   function apply(){
    const w=W/zoom,h=H/zoom;
    cx=clamp(cx,w/2,W-w/2);cy=clamp(cy,h/2,H-h/2);
    svg.setAttribute('viewBox',`${cx-w/2} ${cy-h/2} ${w} ${h}`);
    label.textContent=Math.round(zoom*100)+'%';
    svg.style.cursor=zoom>1?'grab':'';
   }
   function setZoom(value){
    zoom=clamp(value,1,3);apply();
   }
   function button(labelText,description,action){
    const b=document.createElement('button');b.type='button';b.textContent=labelText;b.title=description;
    b.setAttribute('aria-label',description);
    b.style.cssText='min-width:35px;min-height:30px;background:#3a291a;color:#ffe0a4;border:1px solid #987148;border-radius:4px;font:bold 17px Georgia,serif;cursor:pointer;padding:2px 9px;';
    b.addEventListener('click',action);zoomControls.append(b);return b;
   }
   button('＋','Enlarge map',()=>setZoom(zoom*1.3));
   button('－','Reduce map',()=>setZoom(zoom/1.3));
   button('⤢','Fit entire map',()=>{cx=W/2;cy=H/2;setZoom(1);});
   const label=document.createElement('span');label.textContent='100%';
   label.style.cssText='color:#e2c79e;min-width:42px;text-align:center;';zoomControls.append(label);
   const hint=document.createElement('span');hint.textContent='Drag to explore when enlarged';
   hint.style.cssText='color:#a99578;font-size:11px;';zoomControls.append(hint);
   const originalViewBox=svg.getAttribute('viewBox');
   let start=null;
   svg.addEventListener('pointerdown',e=>{
    if(zoom<=1||e.button!==0)return;
    start={x:e.clientX,y:e.clientY,cx,cy};
    svg.setPointerCapture(e.pointerId);svg.style.cursor='grabbing';
   });
   svg.addEventListener('pointermove',e=>{
    if(!start)return;
    const rect=svg.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const w=W/zoom,h=H/zoom;
    cx=start.cx-(e.clientX-start.x)*w/rect.width;
    cy=start.cy-(e.clientY-start.y)*h/rect.height;
    apply();svg.style.cursor='grabbing';
   });
   const endDrag=()=>{start=null;svg.style.cursor=zoom>1?'grab':'';};
   svg.addEventListener('pointerup',endDrag);
   svg.addEventListener('pointercancel',endDrag);
   svg.addEventListener('lostpointercapture',endDrag);
   // Insert magnification controls above the artwork; no map modifications.
   fig.before(zoomControls);
   apply();
  }
  // Tracing and the approved landscape are the visual foundation.
  const controls=Array.from(dialog.querySelectorAll('button'));
  const clickIfOff=(needle)=>{const b=controls.find(b=>b.textContent.trim().toLowerCase().startsWith(needle));if(b)b.click();};
  if(controls.some(b=>b.textContent.trim()==='Show tracing guides'))clickIfOff('show tracing guides');
  if(controls.some(b=>b.textContent.trim()==='Show landscape preview'))clickIfOff('show landscape preview');
  const guides=svg.querySelector('[data-pearl-guide]');
  const named=svg.querySelector('[data-forge-landmarks]');
  if(named)named.setAttribute('data-retired-art','true');
  const roadPts=Object.values(v.edges).flat();
  const ys=roadPts.map(p=>p[1]);
  const n=Math.min(...ys),s=Math.max(...ys),scale=(v.height-98)/(s-n),off=48-n*scale;
  const expandY=y=>y*scale+off;
  // Some generated landmark PNGs contain semi-transparent pixels even in solid buildings.
// Increase alpha locally (preserving transparent edges) to stop the map showing through them.
  const defs=svg.querySelector('defs')||make('defs');
  if(!defs.parentNode)svg.insertBefore(defs,svg.firstChild);
  if(!svg.querySelector('#route127-landmark-opacity-fix')){
   const f=make('filter',{id:'route127-landmark-opacity-fix',x:'-15%',y:'-15%',width:'130%',height:'130%', 'color-interpolation-filters':'sRGB'});
   const transfer=make('feComponentTransfer',{});
   transfer.append(make('feFuncA',{type:'linear',slope:'1.75',intercept:'-0.25'}));
   f.append(transfer);defs.append(f);
  }
  const root=make('g',{'data-cinematic-map':'true','pointer-events':'none'});
  const roads=make('g',{'data-cinematic-roads':'true'});
  const places=make('g',{'data-cinematic-landmarks':'true'});
  root.append(roads,places);
  // Below navigation/pearl layer; landmark art above it but non-clickable.
  svg.append(root);
  for(const [edge,name,w] of decals){
   const spot=midPoint(v.edges[edge],expandY);
   if(!spot)continue;
   const h=w*.72;
   const tile=make('svg',{x:spot.x-w/2,y:spot.y-h/2,width:w,height:h,
      viewBox:'0 0 100 75',overflow:'hidden',
      transform:`rotate(${spot.angle} ${spot.x} ${spot.y})`});
   // Crop away the bottom 16% of the baked-in asset-name plaques.
   const img=make('image',{href:`/route127/devtest/assets/map_roads/${name}.png`,x:0,y:0,width:100,height:89,
     preserveAspectRatio:'none'});
   img.setAttribute('filter','url(#route127-landmark-opacity-fix)');
   tile.append(img);
   roads.append(tile);
  }
  for(const [file,id,w,dx,dy] of landmarks){
   const p=v.nodes[id];if(!p)continue;
   const h=w*1.04;
   const x=p[0]+dx-w/2,y=expandY(p[1])+dy-h/2;
   const img=make('image',{href:`/route127/devtest/assets/map_landmarks/${file}.png`,
     x,y,width:w,height:h,preserveAspectRatio:'xMidYMid meet','data-place':id});
   img.append(make('title',{}));img.lastChild.textContent=id.replace(/-/g,' ');
   img.setAttribute('filter','url(#route127-landmark-opacity-fix)');
   places.append(img);
  }
  const f=typeof player!=='undefined'?player?.flags:null;
  for(const item of extra){
   if(!item.ok(f))continue;
   const w=108,h=112;
   const discoveryImage=make('image',{href:`/route127/devtest/assets/map_landmarks/${item.name}.png`,
     x:item.x-w/2,y:expandY(item.y)-h/2,width:w,height:h,preserveAspectRatio:'xMidYMid meet',
     'data-discovery-art':item.name});
   discoveryImage.setAttribute('filter','url(#route127-landmark-opacity-fix)');
   places.append(discoveryImage);
  }
  // Keep player marker clearly above the decorative location imagery.
  const playerDot=svg.querySelector('#lantern-player-marker');
  if(playerDot)root.append(playerDot);
  const all=Array.from(dialog.querySelectorAll('button'));
  const show=make('g'); // just a state holder; no new UI clutter
  function sync(){
   const guideOn=!!guides&&guides.style.display!=='none';
   const landscapeOn=Array.from(dialog.querySelectorAll('button')).some(b=>b.textContent.trim()==='Show original artwork');
   root.style.display=guideOn&&landscapeOn?'':'none';
   if(named)named.style.display='none';
  }
  sync();
  dialog.addEventListener('click',e=>{
   if(e.target?.tagName==='BUTTON')queueMicrotask(sync);
  },{signal:(()=>{const a=new AbortController();dialog.addEventListener('close',()=>a.abort(),{once:true});return a.signal;})()});
 }
 const overlay=typeof Route127MapOverlay!=='undefined'?Route127MapOverlay:globalThis.Route127MapOverlay;
 if(!overlay||typeof overlay.open!=='function')return;
 const open=overlay.open;
 overlay.open=function(...args){const result=open.apply(this,args);try{draw();}catch(err){console.warn('Cinematic map decoration skipped:',err);}return result;};
})();