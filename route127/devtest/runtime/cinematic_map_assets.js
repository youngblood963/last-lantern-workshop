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
 // Approved landmark placements exported by the owner on November 12, 2026.
 // Visual positions only; never move gameplay nodes or road coordinates.
 const permanentLayout={"old_house":[503.0733,140.0092,75],"abandoned_motel":[259.2943,194.4677,85],"scavenger_camp":[671.6514,243.0713,85],"solace":[503.3472,326.1782,85],"iron_pit_arena":[314.5482,480.2044,85],"scrap_yard":[697.8964,554.2357,85],"factory":[493.6226,622.7638,85],"broken_bridge":[188.6528,742.016,85],"watchtower_ruins":[918.7223,691.4123,85],"boulder_junction":[518.0302,783.9252,50],"seaport":[440.3602,975.5252,85],"st_mercy_hospital":[816.5544,296.2352,85],"fresh_mart_grocery":[729.9418,372.9903,85],"ash_cemetery":[116.0933,498.2127,85],"station_nine":[301.0719,87.7492,85]};
 const extra=[
  {name:'st_mercy_hospital',x:785,y:485,ok:f=>!!f?.wo4Hospital?.discovered},
  {name:'fresh_mart_grocery',x:844,y:365,ok:f=>!!f?.wo2?.freshMartClue},
  {name:'ash_cemetery',x:330,y:624,ok:f=>!!f?.r18Ash},
  {name:'station_nine',x:391,y:247,ok:f=>!!f?.r18Station?.facility?.discovered}
 ];
 function draw(){
  const dialog=document.querySelector('dialog.route127-map-overlay[open]');
  const fig=dialog?.querySelector('figure.lantern-map');
  const svg=fig?.querySelector('svg');
  const v=typeof LANTERN_MAP_VISUAL!=='undefined'?LANTERN_MAP_VISUAL:null;
  if(!fig||!svg||!v||svg.querySelector('[data-cinematic-map]'))return;
  // Use the freed toolbar height for a larger, still fully visible map.
  dialog.style.setProperty('width','min(98vw,1600px)','important');
  dialog.style.setProperty('max-width','98vw','important');
  dialog.style.setProperty('height','min(94vh,1000px)','important');
  dialog.style.setProperty('max-height','94vh','important');
  dialog.style.setProperty('display','flex','important');
  dialog.style.setProperty('flex-direction','column','important');
  dialog.style.setProperty('box-sizing','border-box','important');
  dialog.style.setProperty('overflow','hidden','important');
  // Cinematic tabletop: replace the old gold outer frame with a quiet dark edge.
  dialog.style.setProperty('border','1px solid #241914','important');
  dialog.style.setProperty('box-shadow','0 14px 40px #000b','important');
  const body=dialog.querySelector('.route127-map-body');
  if(body){body.style.setProperty('min-height','0','important');body.style.setProperty('flex','1 1 auto','important');}
  // Player-facing map: omit the verbose travel-progress line above the map.
  // Travel state, turn counts and navigation remain unchanged elsewhere.
  const progressLine=body?.querySelector(':scope > p:first-child');
  if(progressLine)progressLine.style.display='none';
  // Remove the redundant amber/teal instruction caption below the map.
  // Keep the actual player marker and current-road highlighting intact.
  const legendLine=Array.from(body?.children||[]).find(el=>el.tagName==='P'&&el.textContent.includes('Amber: your position. Teal: current road.'));
  if(legendLine)legendLine.style.display='none';
  // The old SVG filled the full width and painted its spare width dark teal.
  // Constrain the SVG itself to the portrait map aspect so the actual tabletop
  // shows on either side. Inline important beats the legacy !important rules.
  fig.style.setProperty('display','flex','important');
  fig.style.setProperty('align-items','center','important');
  fig.style.setProperty('justify-content','center','important');
  fig.style.setProperty('position','relative','important');
  fig.style.setProperty('overflow','hidden','important');
  fig.style.setProperty('box-sizing','border-box','important');
  fig.style.setProperty('border','0','important');
  fig.style.setProperty('box-shadow','none','important');
  fig.style.setProperty('border-radius','0','important');
  fig.style.setProperty('background','#21140e url("/route127/devtest/assets/picnic_table_background.png") center center / cover no-repeat','important');
  // Subdue legacy decorative grid over the new photo background.
  fig.classList.add('route127-cinematic-picnic');
  if(!document.querySelector('#route127-picnic-cleanup-style')){
   const css=document.createElement('style');css.id='route127-picnic-cleanup-style';
   css.textContent='.route127-map-body .lantern-map.route127-cinematic-picnic::before,.route127-map-body .lantern-map.route127-cinematic-picnic::after{display:none!important;} .route127-map-body .lantern-map.route127-cinematic-picnic .route127-map-fieldnote{display:none!important;}';
   document.head.append(css);
  }
  svg.style.setProperty('width','auto','important');
  svg.style.setProperty('height','100%','important');
  svg.style.setProperty('max-width','100%','important');
  svg.style.setProperty('aspect-ratio',v.width+' / '+v.height,'important');
  svg.style.setProperty('flex','0 1 auto','important');
  svg.style.setProperty('border','0','important');
  svg.style.setProperty('border-radius','0','important');
  svg.style.setProperty('box-shadow','0 9px 22px #000a','important');
  // Side decorations are outside the map; never intercept controls.
  const note=fig.querySelector('.route127-map-fieldnote');
  // Remove old compass plaque and field-notes card; the table is now purely cinematic.
  if(note)note.remove();

  // The static coffee mug replaces the lantern; only its steam is animated.
  // All props remain outside the map SVG and never alter travel/zoom.
  if(!fig.querySelector('[data-table-mug]')){
   if(!document.getElementById('route127-coffee-steam-style')){
    const sheet=document.createElement('style');sheet.id='route127-coffee-steam-style';
    sheet.textContent=`
     .route127-table-mug{position:absolute;right:4%;top:11%;width:clamp(195px,31%,345px);
       aspect-ratio:1;z-index:2;pointer-events:none;}
     .route127-table-mug img{display:block;width:100%;height:100%;object-fit:contain;
       filter:drop-shadow(6px 9px 6px rgba(12,6,3,.55));}
     .route127-table-mug .steam{position:absolute;left:42%;top:7%;width:19%;height:43%;
       transform:translate(-50%,-80%);pointer-events:none;opacity:0;
       background:radial-gradient(ellipse at 50% 70%,rgba(235,229,215,.38),rgba(220,215,203,.16) 34%,transparent 68%);
       filter:blur(8px);border-radius:50% 45% 55% 50%;
       animation:route127-steam-rise 4.6s ease-out infinite;}
     .route127-table-mug .steam:nth-of-type(2){left:51%;animation-delay:-1.7s;animation-duration:5.2s;width:15%;}
     .route127-table-mug .steam:nth-of-type(3){left:45%;animation-delay:-3.2s;animation-duration:4.9s;width:13%;}
     @keyframes route127-steam-rise{
       0%{opacity:0;transform:translate(-50%,-30%) translateX(0) scale(.6,.45)}
       16%{opacity:.38}
       50%{opacity:.27;transform:translate(-50%,-90%) translateX(9px) scale(.9,1.1)}
       82%{opacity:.13}
       100%{opacity:0;transform:translate(-50%,-155%) translateX(-9px) scale(1.3,1.55)}
     }
     @media(prefers-reduced-motion:reduce){.route127-table-mug .steam{display:none!important;}}
    `;
    document.head.append(sheet);
   }
   const mug=document.createElement('div');
   mug.className='route127-table-mug';
   mug.setAttribute('data-table-mug','');
   mug.setAttribute('aria-hidden','true');
   const mugImage=document.createElement('img');
   mugImage.src='/route127/devtest/assets/rusty_smiley_coffee_mug.png';
   mugImage.alt='';mug.append(mugImage);
   for(let i=0;i<3;i++){const plume=document.createElement('span');plume.className='steam';mug.append(plume);}
   fig.append(mug);
   const spider=document.createElement('img');
   spider.setAttribute('data-table-spider','');
   spider.src='/route127/devtest/assets/daddy_longlegs_crawl.gif';
   spider.alt='';spider.setAttribute('aria-hidden','true');
   spider.style.cssText='position:absolute;left:77%;top:110%;width:clamp(96px,13%,180px);height:auto;aspect-ratio:1;object-fit:contain;pointer-events:none;z-index:3;display:none;transform:translate(-50%,-50%);will-change:left,top,transform;';
   fig.append(spider);
   const timers=new Set();
   let stopped=false,walk=null;
   function later(fn,ms){
    const id=setTimeout(()=>{timers.delete(id);if(!stopped&&dialog.open)fn();},ms);
    timers.add(id);
   }
   const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   function scheduleNext(){
    later(()=>{if(Math.random()<.5)appear();else scheduleNext();},180000+Math.random()*120000);
   }
   function appear(){
    if(stopped||!dialog.open||document.hidden){scheduleNext();return;}
    spider.style.display='block';
    // The spider now crosses the paper rather than the coffee cup. Use the
    // actual on-screen paper bounds so this remains correct at any map size.
    // CSS positions are relative to the tabletop figure, not the SVG viewBox.
    const paper=svg.getBoundingClientRect(),table=fig.getBoundingClientRect();
    const at=(u,v)=>({
     left:(((paper.left-table.left)+paper.width*u)/table.width*100).toFixed(3)+'%',
     top:(((paper.top-table.top)+paper.height*v)/table.height*100).toFixed(3)+'%'
    });
    // Enter from below the paper near its right edge and leave above-left.
    // Keep the same image size, movement duration and gentle body wobble.
    const positions=[[.86,1.18],[.80,.99],[.69,.78],[.57,.58],[.45,.39],[.31,.18],[.18,-.19]];
    const tilts=[-5,3,-4,3,-3,2,-3];
    const offsets=[0,.15,.32,.50,.68,.84,1];
    const steps=positions.map(([x,y],i)=>({
     offset:offsets[i],...at(x,y),
     transform:'translate(-50%,-50%) rotate('+tilts[i]+'deg)'
    }));
    walk=spider.animate(steps,{duration:12000,easing:'linear',fill:'forwards'});
    walk.onfinish=()=>{walk=null;spider.style.display='none';scheduleNext();};
   }
   if(!reduced)later(appear,20000+Math.random()*20000);
   dialog.addEventListener('close',()=>{
    stopped=true;walk?.cancel();
    for(const id of timers)clearTimeout(id);
    timers.clear();
   },{once:true});
  }

  // A small paper-corner curl. This overlay tracks the *visible* map boundary,
  // but never moves the SVG, map nodes, turn pearls, or clickable travel controls.
  if(!fig.querySelector('[data-paper-wind-corner]')){
   if(!document.getElementById('route127-map-wind-style')){
    const sheet=document.createElement('style');
    sheet.id='route127-map-wind-style';
    sheet.textContent=`
     .route127-map-wind-corner {
      position:absolute;pointer-events:none;z-index:4;opacity:0;
      width:var(--paper-corner-size,48px);height:var(--paper-corner-size,48px);
      transform-origin:100% 100%;
      filter:drop-shadow(-4px -5px 3px rgba(13,7,2,.55));
      will-change:transform,opacity;
     }
     .route127-map-wind-corner::before {
      content:'';position:absolute;inset:0;
      clip-path:polygon(100% 0%,0% 100%,100% 100%);
      background:linear-gradient(135deg,#b49c78 0%,#e0cda5 34%,#8f7555 68%,#60472e 100%);
      box-shadow:inset 2px 2px 5px rgba(35,20,9,.5);
     }
     .route127-map-wind-corner::after {
      content:'';position:absolute;right:0;bottom:0;width:100%;height:100%;
      clip-path:polygon(100% 0%,96% 100%,0% 100%);
      background:linear-gradient(135deg,transparent 25%,rgba(20,12,5,.2) 80%);
     }
     .route127-map-wind-corner.is-fluttering {
      animation:route127-paper-corner-breeze 2600ms ease-in-out both;
     }
     @keyframes route127-paper-corner-breeze {
      0%,100% {opacity:0;transform:rotate(0deg) scale(.12,.12);}
      9% {opacity:.9;transform:rotate(-1deg) scale(.65,.5);}
      25% {opacity:1;transform:rotate(-4deg) scale(1,.85);}
      38% {opacity:.98;transform:rotate(-2deg) scale(.88,.65);}
      53% {opacity:1;transform:rotate(-6deg) scale(1,.95);}
      69% {opacity:.9;transform:rotate(-2deg) scale(.8,.6);}
      84% {opacity:.65;transform:rotate(-.5deg) scale(.45,.4);}
     }
     @media(prefers-reduced-motion:reduce) {
      .route127-map-wind-corner {display:none!important;animation:none!important;}
     }`;
    document.head.append(sheet);
   }
   const corner=document.createElement('div');
   corner.className='route127-map-wind-corner';
   corner.setAttribute('data-paper-wind-corner','');
   corner.setAttribute('aria-hidden','true');
   fig.append(corner);
   let stopped=false,timer=0;
   const placeCorner=()=>{
    if(stopped||!fig.isConnected)return;
    const paper=svg.getBoundingClientRect(),table=fig.getBoundingClientRect();
    const size=Math.max(26,Math.min(58,paper.width*.055));
    corner.style.setProperty('--paper-corner-size',size+'px');
    corner.style.left=(paper.right-table.left-size)+'px';
    corner.style.top=(paper.bottom-table.top-size)+'px';
   };
   placeCorner();
   const observer=typeof ResizeObserver==='function'?new ResizeObserver(placeCorner):null;
   observer?.observe(svg);observer?.observe(fig);
   window.addEventListener('resize',placeCorner);
   function nextBreeze(){
    timer=setTimeout(()=>{
     if(stopped||!dialog.open)return;
     if(document.hidden){nextBreeze();return;}
     placeCorner();
     corner.classList.remove('is-fluttering');
     void corner.offsetWidth;
     corner.classList.add('is-fluttering');
     timer=setTimeout(()=>{corner.classList.remove('is-fluttering');nextBreeze();},2750);
    },30000+Math.random()*30000);
   }
   if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)nextBreeze();
   dialog.addEventListener('close',()=>{
    stopped=true;clearTimeout(timer);observer?.disconnect();
    window.removeEventListener('resize',placeCorner);
   },{once:true});
  }

  // Owner-friendly map magnifier. Zoom is SVG viewBox-only; roads, markers,
  // player position and gameplay coordinates always stay together.
  if(!dialog.querySelector('[data-map-zoom-controls]')){
   const W=v.width,H=v.height;
   const zoomControls=document.createElement('div');
   zoomControls.setAttribute('data-map-zoom-controls','');
   zoomControls.setAttribute('role','group');
   zoomControls.setAttribute('aria-label','World map magnification');
   zoomControls.style.cssText='display:flex;align-items:center;gap:4px;padding:0 8px;margin-left:12px;border-left:1px solid #765235;font:12px monospace;flex:0 0 auto;';
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
   // Keep zoom controls in the actual map header, beside WORLD MAP.
   // No controls or UI chrome cover the scenic tabletop now.
   const header=dialog.querySelector(':scope > header');
   const headerTitle=header?.querySelector('strong');
   const headerClose=header?.querySelector('button[aria-label="Close map"]');
   if(header){
    header.style.setProperty('display','flex','important');
    header.style.setProperty('align-items','center','important');
    header.style.setProperty('gap','8px','important');
    if(headerTitle)headerTitle.style.setProperty('flex','0 0 auto','important');
    if(headerClose)headerClose.style.setProperty('margin-left','auto','important');
    header.insertBefore(zoomControls,headerClose||null);
   }else fig.append(zoomControls);
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
   // Darken bright artwork midtones without changing its transparent pixels.
   // Strengthen alpha so the landscape doesn't shine through solid buildings.
   const transfer=make('feComponentTransfer',{});
   for(const channel of ['R','G','B'])transfer.append(make('feFunc'+channel,{type:'gamma',amplitude:'0.89',exponent:'1.30',offset:'0'}));
   transfer.append(make('feFuncA',{type:'gamma',amplitude:'1',exponent:'0.28',offset:'0'}));
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
  const discoveryVisibility=new Map();
  for(const item of extra){
   // Keep undiscovered artwork available to the owner's layout editor,
   // without revealing it on the ordinary player-facing map.
   discoveryVisibility.set(item.name,!!item.ok(f));
   const w=108,h=112;
   const discoveryImage=make('image',{href:`/route127/devtest/assets/map_landmarks/${item.name}.png`,
     x:item.x-w/2,y:expandY(item.y)-h/2,width:w,height:h,preserveAspectRatio:'xMidYMid meet',
     'data-discovery-art':item.name});
   discoveryImage.setAttribute('filter','url(#route127-landmark-opacity-fix)');
   places.append(discoveryImage);
   artwork.set(item.name,discoveryImage);
  }

  // Normal gameplay is presentation-only. The owner editor is available
  // separately via DEVTEST ?mapEditor=1 and never appears in the player map.
  const editorMode=new URLSearchParams(location.search).get('mapEditor')==='1';
  // DEVTEST-only visual placement studio. Saves solely to browser localStorage.
  // Does not edit graph nodes, route pearls, travel distances or game state.
  const storeKey='route127:devtest:landmark-layout:v1';
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  let labelsReady=false;
  const coords=new Map();
  for(const [name,img] of artwork){
   coords.set(name,{x:Number(img.getAttribute('x')),y:Number(img.getAttribute('y')),
      width:Number(img.getAttribute('width')),height:Number(img.getAttribute('height'))});
  }
  // Permanent owner-approved layout wins on first load, while the editor can
  // still save subsequent personal refinements in the current browser.
  for(const [name,values] of Object.entries(permanentLayout)){
   const img=artwork.get(name);if(!img)continue;
   const [x,y,width]=values;
   const h0=Number(img.getAttribute('height')),w0=Number(img.getAttribute('width'));
   const height=width*(h0/w0);
   for(const [key,val] of Object.entries({x,y,width,height}))img.setAttribute(key,val);
   coords.set(name,{x,y,width,height});
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
   if(labelsReady)positionLabels();
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
    const discovered=!discoveryVisibility.has(name)||discoveryVisibility.get(name);
    img.style.display=active||discovered?'':'none';
    img.style.opacity=active&&!discovered?'0.7':'1';
    img.style.pointerEvents=active?'all':'none';
    img.style.cursor=active?'move':'';
    img.style.outline='';
    img.setAttribute('tabindex',active?'0':'-1');
    if(active&&name===selected)img.style.filter='drop-shadow(0 0 5px #ffcb68)';
    else img.style.filter='';
   }
   if(labelsReady)positionLabels();
   status.textContent=active?'Drag or resize any landmark; undiscovered locations are preview-only. Changes save on this device.':'Landmark placement is off.';
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
  if(editorMode)fig.before(panel);
  for(const [name,p] of Object.entries(saved))update(name,p,false);
  // Current cinematic landmark names: drawn ABOVE the PNG images, not in retired map art.
  const labelLayer=make('g',{'data-cinematic-location-labels':'true','pointer-events':'none'});
  root.append(labelLayer);
  const locationLabels=new Map();
  const prettyName={
   old_house:'OLD HOUSE',abandoned_motel:'ABANDONED MOTEL',
   scavenger_camp:'SCAVENGER CAMP',solace:'SOLACE',
   iron_pit_arena:'IRON PIT ARENA',scrap_yard:'SCRAP YARD',
   factory:'FACTORY',broken_bridge:'BROKEN BRIDGE',
   watchtower_ruins:'WATCHTOWER RUINS',boulder_junction:'BOULDER JUNCTION',
   seaport:'SEAPORT',st_mercy_hospital:'ST. MERCY HOSPITAL',
   fresh_mart_grocery:'FRESH MART',ash_cemetery:'ASH CEMETERY',
   station_nine:'STATION NINE'
  };
  for(const [name,img] of artwork){
   const label=make('text',{
    'data-cinematic-place-label':name,'text-anchor':'middle',
    'font-family':'Arial, system-ui, sans-serif','font-size':'18',
    'font-weight':'800','letter-spacing':'.25',
    fill:'#fff4d6',stroke:'#20140c','stroke-width':'4.5',
    'stroke-linejoin':'round','paint-order':'stroke','pointer-events':'none'
   });
   label.textContent=prettyName[name]||name.replaceAll('_',' ').toUpperCase();
   labelLayer.append(label);
   locationLabels.set(name,label);
  }
  function positionLabels(){
   for(const [name,label] of locationLabels){
    const p=coords.get(name);if(!p)continue;
    const baseline=p.y+p.height+19;
    label.setAttribute('x',Math.max(95,Math.min(v.width-95,p.x+p.width/2)));
    label.setAttribute('y',Math.min(v.height-12,baseline));
    const discovered=!discoveryVisibility.has(name)||discoveryVisibility.get(name);
    label.style.display=(editorMode||discovered)?'':'none';
    label.style.opacity=editorMode&&!discovered?'.7':'1';
   }
  }
  labelsReady=true;
  positionLabels();
  let drag=null;
  function toMapPoint(e){
   const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;
   const m=svg.getScreenCTM();return m?pt.matrixTransform(m.inverse()):null;
  }
  if(editorMode)for(const [name,img] of artwork){
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
  if(editorMode)refresh();
  // Keep player marker clearly above the decorative location imagery.
  const playerDot=svg.querySelector('#lantern-player-marker');
  if(playerDot)root.append(playerDot);
  const all=Array.from(dialog.querySelectorAll('button'));
  const show=make('g'); // just a state holder; no new UI clutter
  function sync(){
   const guideOn=!!guides&&guides.style.display!=='none';
   const landscapeOn=Array.from(dialog.querySelectorAll('button')).some(b=>b.textContent.trim()==='Show original artwork');
   // Cinematic artwork and its labels must not disappear when pearl guides are hidden.
   root.style.display=landscapeOn?'':'none';
   if(named)named.style.display='none';
   positionLabels();
  }
  sync();
  // Player-facing DEVTEST control: hide only the pearl/road tracing overlay.
  // The scenic map, cinematic locations and readable labels remain visible.
  const mapHeader=dialog.querySelector(':scope > header');
  if(mapHeader){
   const pearlToggle=document.createElement('button');
   pearlToggle.type='button';
   pearlToggle.setAttribute('data-pearl-overlay-toggle','');
   pearlToggle.style.cssText='background:#33251a;color:#f3dfb6;border:1px solid #af8858;border-radius:5px;padding:5px 10px;font:600 12px system-ui,sans-serif;cursor:pointer;white-space:nowrap;';
   let pearlsVisible=true;
   const pearlMarkers=svg.querySelector('[data-pearl-markers]');
   const nodeMarkers=svg.querySelectorAll('[data-map-node]');
   const originalActive=svg.querySelectorAll('[data-active-road]');
   const refreshPearls=()=>{
    // The highway/dirt/asphalt roads stay visible in BOTH modes.
    // Toggle only pearls, turn costs, and numbered junction nodes.
    if(pearlMarkers)pearlMarkers.style.display=pearlsVisible?'':'none';
    nodeMarkers.forEach(el=>el.style.display=pearlsVisible?'':'none');
    originalActive.forEach(el=>el.style.display='none');
    pearlToggle.textContent=pearlsVisible?'Hide Pearls':'Show Pearls';
    pearlToggle.setAttribute('aria-pressed',String(!pearlsVisible));
    // Keep iconic sites and labels on screen independently of tracing guides.
    sync();
   };
   pearlToggle.addEventListener('click',()=>{pearlsVisible=!pearlsVisible;refreshPearls();});
   mapHeader.insertBefore(pearlToggle,mapHeader.querySelector('button[aria-label="Close map"]')||null);
   refreshPearls();
  }
  dialog.addEventListener('click',e=>{
   if(e.target?.tagName==='BUTTON')queueMicrotask(sync);
  },{signal:(()=>{const a=new AbortController();dialog.addEventListener('close',()=>a.abort(),{once:true});return a.signal;})()});
 }
 const overlay=typeof Route127MapOverlay!=='undefined'?Route127MapOverlay:globalThis.Route127MapOverlay;
 if(!overlay||typeof overlay.open!=='function')return;
 const open=overlay.open;
 overlay.open=function(...args){const result=open.apply(this,args);try{draw();}catch(err){console.warn('Cinematic map decoration skipped:',err);}return result;};
})();