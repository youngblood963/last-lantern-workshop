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
 // Road illustration tiles removed at owner's request. Existing gameplay/pearl paths remain.
 const extra=[
  {name:'st_mercy_hospital',x:785,y:485,ok:f=>!!f?.wo4Hospital?.discovered},
  {name:'fresh_mart_grocery',x:844,y:365,ok:f=>!!(f?.wo2?.freshMartClue||f?.wo2State?.freshMartClue||f?.freshMartClue)},
  {name:'ash_cemetery',x:330,y:624,ok:f=>!!f?.r18Ash},
  {name:'station_nine',x:391,y:247,ok:f=>!!f?.r18Station?.facility?.discovered}
 ];
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
  const places=make('g',{'data-cinematic-landmarks':'true'});
  const artwork=new Map();
  root.append(places);
  // Below navigation/pearl layer; landmark art above it but non-clickable.
  svg.append(root);
  for(const [file,id,w,dx,dy] of landmarks){
   const p=v.nodes[id];if(!p)continue;
   const h=w*1.04;
   const x=p[0]+dx-w/2,y=expandY(p[1])+dy-h/2;
   const img=make('image',{href:`/route127/devtest/assets/map_landmarks/${file}.png`,
     x,y,width:w,height:h,preserveAspectRatio:'xMidYMid meet','data-place':id});
   img.append(make('title',{}));img.lastChild.textContent=id.replace(/-/g,' ');
   img.setAttribute('filter','url(#route127-landmark-opacity-fix)');
   places.append(img);
   artwork.set(file,img);
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
   artwork.set(item.name,discoveryImage);
  }

  // DEVTEST-only visual placement studio. Saves solely to browser localStorage.
  // Does not edit graph nodes, route pearls, travel distances or game state.
  const storeKey='route127:devtest:landmark-layout:v1';
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const coords=new Map();
  for(const [name,img] of artwork){
   coords.set(name,{x:Number(img.getAttribute('x')),y:Number(img.getAttribute('y')),
      width:Number(img.getAttribute('width')),height:Number(img.getAttribute('height'))});
  }
  const defaults=Object.fromEntries([...coords].map(([name,p])=>[name,{...p}]));
  function readLayout(){
   try{
    const saved=JSON.parse(localStorage.getItem(storeKey)||'{}');
    if(!saved||typeof saved!=='object'||Array.isArray(saved))return {};
    const clean={};
    for(const [name,v] of Object.entries(saved)){
     if(!coords.has(name)||!v||typeof v!=='object')continue;
     const x=Number(v.x),y=Number(v.y),width=Number(v.width);
     if(![x,y,width].every(Number.isFinite))continue;
     clean[name]={x:clamp(x,-250,vizWidth+250),y:clamp(y,-250,vizHeight+250),width:clamp(width,30,310)};
    }
    return clean;
   }catch(e){console.warn('Map landmark layout could not be read',e);return {};}
  }
  const vizWidth=v.width,vizHeight=v.height;
  const saved=readLayout();
  function update(name,p,persist=true){
   const img=artwork.get(name);if(!img||!p)return;
   const first=defaults[name];
   const width=clamp(Number(p.width)||first.width,30,310);
   const height=width*(first.height/first.width);
   const x=clamp(Number(p.x),-250,vizWidth+250);
   const y=clamp(Number(p.y),-250,vizHeight+250);
   if(![x,y].every(Number.isFinite))return;
   const next={x,y,width,height};
   for(const prop of ['x','y','width','height'])img.setAttribute(prop,next[prop]);
   coords.set(name,next);
   if(persist){
    const writes=readLayout();
    writes[name]={x,y,width};
    try{localStorage.setItem(storeKey,JSON.stringify(writes));}catch(e){status.textContent='Browser storage unavailable — export your layout to keep it.';}
   }
  }
  const panel=document.createElement('div');
  panel.className='route127-landmark-editor';
  panel.setAttribute('data-landmark-editor','');
  panel.style.cssText='display:flex;flex-wrap:wrap;align-items:center;gap:7px;padding:5px 8px;margin:3px 0;color:#e8cc9d;background:#24190f;border:1px solid #725135;font:12px/1.4 monospace;';
  const editButton=document.createElement('button');
  editButton.type='button';editButton.textContent='✥ Arrange landmarks';
  const select=document.createElement('select');
  select.setAttribute('aria-label','Select landmark to position');
  select.style.cssText='max-width:180px;background:#352719;color:#ffe4ac;padding:5px;';
  for(const [name] of artwork){
   const opt=document.createElement('option');opt.value=name;
   opt.textContent=name.replaceAll('_',' ').replace(/\b\w/g,ch=>ch.toUpperCase());
   select.append(opt);
  }
  const status=document.createElement('span');status.textContent='Landmark placement is off.';
  status.style.cssText='color:#e6c99e;flex:1 1 170px;';
  const editTools=document.createElement('div');
  editTools.style.cssText='display:none;flex-wrap:wrap;gap:5px;align-items:center;';
  function btn(label,tip,action){
   const b=document.createElement('button');b.type='button';b.textContent=label;b.title=tip;
   b.setAttribute('aria-label',tip);b.addEventListener('click',action);
   b.style.cssText='min-height:31px;min-width:33px;padding:3px 7px;border:1px solid #92714d;background:#483322;color:#ffe6b5;cursor:pointer;';
   return b;
  }
  const widthField=document.createElement('input');widthField.type='number';widthField.min='30';widthField.max='310';widthField.step='5';
  widthField.setAttribute('aria-label','Selected landmark width in map pixels');widthField.style.cssText='width:62px;background:#322419;color:#fff0cf;padding:5px;';
  let active=false;
  let selected=select.value;
  const norm=name=>coords.get(name);
  function refresh(){
   selected=select.value;
   widthField.value=Math.round(norm(selected)?.width||100);
   for(const [name,img] of artwork){
    img.style.pointerEvents=active?'all':'none';
    img.style.cursor=active?'move':'';
    img.style.outline='';
    img.setAttribute('tabindex',active?'0':'-1');
    if(active&&name===selected)img.style.filter='drop-shadow(0 0 5px #ffcb68)';
    else img.style.filter='';
   }
   status.textContent=active?'Drag the selected image, or use arrows. Changes save on this device.':'Landmark placement is off.';
  }
  function nudge(dx,dy){
   const p=norm(selected);if(!p)return;
   update(selected,{...p,x:p.x+dx,y:p.y+dy});refresh();
  }
  select.addEventListener('change',refresh);
  widthField.addEventListener('change',()=>{
   const p=norm(selected);if(!p)return;
   const width=clamp(Number(widthField.value)||p.width,30,310);
   // Resize around the image center, rather than jumping its anchor.
   const change=width-p.width;
   update(selected,{...p,width,x:p.x-change/2,y:p.y-change*(p.height/p.width)/2});refresh();
  });
  editButton.addEventListener('click',()=>{
   active=!active;
   editButton.textContent=active?'✓ Finish arranging':'✥ Arrange landmarks';
   editTools.style.display=active?'flex':'none';
   select.style.display=active?'':'none';
   refresh();
  });
  const label=document.createElement('label');label.textContent='Size ';
  label.append(widthField);
  editTools.append(label,
    btn('←','Move landmark left 5 pixels',()=>nudge(-5,0)),
    btn('↑','Move landmark up 5 pixels',()=>nudge(0,-5)),
    btn('↓','Move landmark down 5 pixels',()=>nudge(0,5)),
    btn('→','Move landmark right 5 pixels',()=>nudge(5,0)),
    btn('Reset one','Reset selected landmark',()=>{update(selected,defaults[selected]);refresh();}),
    btn('Reset all','Restore all landmark positions',()=>{
      if(!confirm('Restore every landmark to its starting position?'))return;
      try{localStorage.removeItem(storeKey);}catch(_){}
      for(const [name,p] of Object.entries(defaults))update(name,p,false);
      refresh();
    }),
    btn('Export','Download landmark layout JSON',()=>{
      const file=new Blob([JSON.stringify({version:1,map:'Route 127 DEVTEST',landmarks:Object.fromEntries(coords)},null,2)],{type:'application/json'});
      const url=URL.createObjectURL(file),link=document.createElement('a');
      link.href=url;link.download='route127-landmark-layout.json';link.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    })
  );
  const importInput=document.createElement('input');importInput.type='file';importInput.accept='.json,application/json';importInput.hidden=true;
  importInput.addEventListener('change',async()=>{
   const file=importInput.files?.[0];if(!file)return;
   try{
    const data=JSON.parse(await file.text());
    if(data.version!==1||!data.landmarks||typeof data.landmarks!=='object')throw Error('Unrecognized layout file');
    let count=0;
    for(const [name,p] of Object.entries(data.landmarks)){
     if(!coords.has(name)||!p||![p.x,p.y,p.width].every(Number.isFinite))continue;
     update(name,p);count++;
    }
    refresh();status.textContent='Imported '+count+' landmark positions.';
   }catch(err){status.textContent='Import failed: '+err.message;}
   importInput.value='';
  });
  editTools.append(btn('Import','Import landmark layout JSON',()=>importInput.click()),importInput);
  panel.append(editButton,select,editTools,status);
  select.style.display='none';
  // Place before the world map while preserving fit-to-screen presentation.
  fig.before(panel);
  for(const [name,p] of Object.entries(saved))update(name,p,false);
  let drag=null;
  function toMapPoint(e){
   const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;
   const m=svg.getScreenCTM();return m?pt.matrixTransform(m.inverse()):null;
  }
  for(const [name,img] of artwork){
   img.addEventListener('pointerdown',e=>{
    if(!active||e.button!==0)return;
    e.preventDefault();e.stopPropagation();
    select.value=name;selected=name;refresh();
    const point=toMapPoint(e);if(!point)return;
    const p=norm(name);
    drag={name,startX:point.x,startY:point.y,x:p.x,y:p.y};
    img.setPointerCapture(e.pointerId);
   });
   img.addEventListener('pointermove',e=>{
    if(!drag||drag.name!==name)return;
    e.preventDefault();e.stopPropagation();
    const point=toMapPoint(e);if(!point)return;
    update(name,{...norm(name),x:drag.x+point.x-drag.startX,y:drag.y+point.y-drag.startY},false);
   });
   const finish=e=>{
    if(drag?.name!==name)return;
    e.stopPropagation();
    const p=norm(name);update(name,p);drag=null;refresh();
   };
   img.addEventListener('pointerup',finish);
   img.addEventListener('pointercancel',finish);
   img.addEventListener('lostpointercapture',finish);
  }
  refresh();
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