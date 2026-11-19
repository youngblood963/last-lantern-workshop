/* DEVTEST scenario catalog and layout editor. Coordinates are percentages of the scene. */
(() => {
 'use strict';
 const L=globalThis.Route127CombatLayouts;
 if(!L)return;
 const regions=['CENTRAL','INDUSTRIAL','NORTH','EAST','WEST','LOWLANDS','SEAPORT','CAUSEWAY'];
 const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 const regionLabel=row=>row.classification==='REGIONAL'?row.regions.join(' + '):
  [row.classification,row.site||row.regions.join(' + ')].filter(Boolean).join(' · ');
 const assets=row=>[...new Set(row.variants.flatMap(v=>[...v.units,...(v.background?[v.background]:[])]))];
 const status=new Map();
 const reviewKey='route127-scenario-reviews-v1';
 const animatedTitles=new Set(['THE LIME FOG','THE RED RAIN','THE GLASS FIELD']);
 // Owner confirmed these Seaport-eligible scenes are complete in Combat Visual Testing.
 const ownerApprovedScenes=new Set(['THE FORGOTTEN ARENA','THE FIGHTING RING']);
 const ownerApproved=row=>ownerApprovedScenes.has(String(row.title||'').toUpperCase())||ownerApprovedScenes.has(String(row.name||'').toUpperCase());
 const industrialApproved=row=>['THE BLACK SNOW','CEMETERY OF TIRES'].includes(String(row.title||'').toUpperCase());
 const ownerIndustrialDone=row=>['LIVE WIRES','THE FURNACE PIT','FURNACE PIT'].includes(String(row.title||'').toUpperCase());
 const liberationApproved=row=>row.id==='seaport:liberation';
 const redApproved=row=>row.id==='scripted:r18redfight';
 const factoryBossApproved=row=>/^factory:boss:[0-3]$/.test(row.id);
 const danielCaptorsApproved=row=>row.id==='factory:captors';
 const lastCallAndBillyApproved=row=>['scripted:jenboss','scripted:terriblebilly'].includes(row.id);
 // These approved compositions contain the character(s) within a complete scene asset.
 // A combat encounter does not require separately registered sprites to review its artwork.
 const embeddedCombatArtwork=new Set(['THE IRON HARVEST','THE DRY FOUNTAIN','IRRADIATED ROACHES',
  'THE KNIFE WIND','BROKEN TOLL CREW','THE YARDMAN','THE LAST PATROL',
  'AGGRESSIVE SEAGULLS','SHIPWRECK SCAVENGERS']);
 // Batch selector is deliberately independent of review state; completed scenes
 // stay in the batch until the owner finishes checking every composition.
 const latestBatch=new Set(['east:38','east:66','east:21','east:6','east:11','early:2','east:78','early:50','early:54','early:61','early:9','early:64',
  'east:33','east:58','scripted:serviceboss','scripted:crazy-steve']);
 const november16Uploads=new Set(['LEAKING FREIGHT TANK','FREIGHT CAR AMBUSH','THE CRANE NEST',
  'THE WASHED-OUT SHOULDER','THE POWDER MONKEY','AGGRESSIVE SEAGULLS','SHIPWRECK SCAVENGERS']);
 const industrialUploads=new Set([
  ...Object.keys(globalThis.Route127RoadsidePresentation?.industrialEncounterSprites||{}),
  'THE PARTS TRUCK','THE MIDNIGHT SHIFT','THE LAST PAYCHECK','THE LAST FAX MACHINE',
  'THE EMPTY ASSEMBLY LINE','THE COLLAPSING CATWALK','THE BATTERY ROOM','THE FACTORY WHISTLE',
  'THE TRAINING VIDEO','THE TRAPPED WORKER','THE WATER SHIPMENT','THE SLEEPING ROBOT',
  'THE LAST AUTONOMOUS TAXI','THE ROAD EATER','THE SALVAGE YARD LEDGER','THE SCRAP CLAIM',
  'LOCKER IN THE CONCRETE PIPE','THE TOOL CRIB','GIDEON BRIGGS'
 ]);
 const sceneLayers=new Map([
  ['east:21','sky'],['east:6','road'],['east:11','sky'],['early:2','road'],['east:78','none'],
  ['early:50','none'],['early:54','road'],['early:61','road'],['early:9','road'],
  ['early:64','none'],['east:33','none'],['east:58','road'],
  ['scripted:serviceboss','sky'],['scripted:crazy-steve','none']
 ]);
 const animated=row=>animatedTitles.has(row.title)||animatedTitles.has(row.name.toUpperCase());
 function readReviews(){
  try{
   const ids=JSON.parse(localStorage.getItem(reviewKey)||'[]');
   const reviews=new Set(Array.isArray(ids)?ids:[]);
   const seededKey=reviewKey+'-environment-v1';
   if(!localStorage.getItem(seededKey)){
    for(const row of L.rows.values())if(animated(row))reviews.add(row.id);
    localStorage.setItem(reviewKey,JSON.stringify([...reviews]));
    localStorage.setItem(seededKey,'1');
   }
   // Owner approved the existing Iron Harvest art and its sky + road composition.
   // Seed only once; thereafter honor the user's manual green/yellow review changes.
   const harvestSeed=reviewKey+'-iron-harvest-approved-v1';
   if(!localStorage.getItem(harvestSeed)){
    for(const row of L.rows.values())if(row.title==='THE IRON HARVEST')reviews.add(row.id);
    localStorage.setItem(reviewKey,JSON.stringify([...reviews]));
    localStorage.setItem(harvestSeed,'1');
   }
   // Owner approved The Mud Cannon standalone GIF; mark it complete once per browser.
   const mudSeed=reviewKey+'-mud-cannon-approved-v1';
   if(!localStorage.getItem(mudSeed)){
    for(const row of L.rows.values())if(row.title==='THE MUD CANNON')reviews.add(row.id);
    localStorage.setItem(reviewKey,JSON.stringify([...reviews]));
    localStorage.setItem(mudSeed,'1');
   }
   // One-time owner approval; preserve later manual Needs Review toggles.
   const arenaSeed=reviewKey+'-arena-and-ring-approved-20261116';
   if(!localStorage.getItem(arenaSeed)){
    for(const row of L.rows.values())if(ownerApproved(row))reviews.add(row.id);
    localStorage.setItem(reviewKey,JSON.stringify([...reviews]));
    localStorage.setItem(arenaSeed,'1');
   }
   // Mark owner-confirmed Seaport Liberation completed once; later manual changes remain possible.
   const liberationSeed=reviewKey+'-seaport-liberation-approved-20261116';
   if(!localStorage.getItem(liberationSeed)){
    for(const row of L.rows.values())if(liberationApproved(row))reviews.add(row.id);
    localStorage.setItem(reviewKey,JSON.stringify([...reviews]));
    localStorage.setItem(liberationSeed,'1');
   }
   // Owner-approved Red's fight uses his existing portrait and an in-combat HP meter.
   const redSeed=reviewKey+'-red-portrait-hp-approved-20261116';
   if(!localStorage.getItem(redSeed)){
    for(const row of L.rows.values())if(redApproved(row))reviews.add(row.id);
    localStorage.setItem(reviewKey,JSON.stringify([...reviews]));
    localStorage.setItem(redSeed,'1');
   }
   // One-time Factory boss cinematic artwork approved by owner.
   // Seed once, retaining the owner's ability to change review status manually.
   const factoryBossSeed=reviewKey+'-factory-bosses-approved-20261116';
   if(!localStorage.getItem(factoryBossSeed)){
    for(const row of L.rows.values())if(factoryBossApproved(row))reviews.add(row.id);
    localStorage.setItem(reviewKey,JSON.stringify([...reviews]));
    localStorage.setItem(factoryBossSeed,'1');
   }
   // Owner confirmed Daniel's Captors complete; seed independently of boss approval.
   const captorsSeed=reviewKey+'-daniel-captors-approved-20261116';
   if(!localStorage.getItem(captorsSeed)){
    for(const row of L.rows.values())if(danielCaptorsApproved(row))reviews.add(row.id);
    localStorage.setItem(reviewKey,JSON.stringify([...reviews]));
    localStorage.setItem(captorsSeed,'1');
   }
   // Owner-reviewed one-time Last Call and Terrible Billy encounter artwork.
   const lastCallBillySeed=reviewKey+'-last-call-and-terrible-billy-approved-20261116';
   if(!localStorage.getItem(lastCallBillySeed)){
    for(const row of L.rows.values())if(lastCallAndBillyApproved(row))reviews.add(row.id);
    localStorage.setItem(reviewKey,JSON.stringify([...reviews]));
    localStorage.setItem(lastCallBillySeed,'1');
   }
   // Owner confirms Black Snow and the Cemetery of Tires (Tire Maze) are complete.
   // Seed this once, retaining the ability to undo the review manually.
   const industrialSeed=reviewKey+'-industrial-black-snow-tire-maze-approved-20261116';
   if(!localStorage.getItem(industrialSeed)){
    for(const row of L.rows.values())if(industrialApproved(row))reviews.add(row.id);
    localStorage.setItem(reviewKey,JSON.stringify([...reviews]));
    localStorage.setItem(industrialSeed,'1');
   }
   // Owner-confirmed Industrial scenes, seeded once in each browser.
   // Subsequent manual review toggles remain authoritative.
   const liveWiresFurnaceSeed=reviewKey+'-live-wires-furnace-pit-approved-20261119';
   if(!localStorage.getItem(liveWiresFurnaceSeed)){
    for(const row of L.rows.values())if(ownerIndustrialDone(row)||['early:186','east:7'].includes(row.id))reviews.add(row.id);
    localStorage.setItem(reviewKey,JSON.stringify([...reviews]));
    localStorage.setItem(liveWiresFurnaceSeed,'1');
   }
   return reviews;
  }catch{return new Set();}
 }
 const progressLabels={green:'🟢 Reviewed / Done',yellow:'🟡 Artwork ready · Needs review',red:'🔴 Missing artwork',checking:'⏳ Checking artwork'};
 function progress(row,reviews){
  // Owner-approved standalone GIF is complete despite its scenario being combat-tagged.
  // No separate combat sprites are required for this fully illustrated scene.
  if(row.title==='THE MUD CANNON'&&reviews.has(row.id))return 'green';
  if(ownerApproved(row))return reviews.has(row.id)?'green':'yellow';
  if(industrialApproved(row))return reviews.has(row.id)?'green':'yellow';
  if(ownerIndustrialDone(row)||['early:186','east:7'].includes(row.id))return reviews.has(row.id)?'green':'yellow';
  if(liberationApproved(row))return reviews.has(row.id)?'green':'yellow';
  if(redApproved(row))return reviews.has(row.id)?'green':'yellow';
  if(factoryBossApproved(row))return reviews.has(row.id)?'green':'yellow';
  if(danielCaptorsApproved(row))return reviews.has(row.id)?'green':'yellow';
  if(lastCallAndBillyApproved(row))return reviews.has(row.id)?'green':'yellow';
  if(animated(row))return reviews.has(row.id)?'green':'yellow';
  const art=state(row);
  if(art==='Checking art')return 'checking';
  if(art!=='Art present'||(row.combat&&!row.fullCinematic&&!embeddedCombatArtwork.has(row.title)&&!row.variants.some(v=>v.units.length)))return 'red';
  return reviews.has(row.id)?'green':'yellow';
 }
 const state=row=>{
  if(animated(row))return 'Art present';
  const files=assets(row);
  if(!files.length)return row.combat?'Art missing / review':'Art unassigned / review';
  if(files.some(file=>status.get(file)==='broken'))return 'Art broken';
  return files.every(file=>status.get(file)==='working')?'Art present':'Checking art';
 };
 function checkAssets(refresh){
  const pending=[...new Set([...L.rows.values()].flatMap(assets))].filter(file=>!status.has(file));
  let running=0;
  function pump(){
   while(running<6&&pending.length){
    const file=pending.shift(),img=new Image();running++;status.set(file,'checking');
    const done=result=>{status.set(file,result);running--;refresh();pump();};
    img.onload=()=>done('working');img.onerror=()=>done('broken');img.src=new URL(file,L.root).href+'?v=wo27-art-fit';
   }
  }
  pump();
 }
 const defaultPlaces={
  'BAT COLONY':[[31,16,27,35],[65,27,27,35],[43,37,27,35],[72,48,27,35]],
  'RABID RACCOONS':[[22,65,30,80],[50,58,30,80,1.05,true],[78,65,30,80]],
  'LOOTERS':[[17,54,30,80],[50,51,30,80,1.06],[83,55,30,80]],
  'PARKING LOT RAIDERS':[[28,45,32,85,.83],[50,50,32,85,1.12],[83,54,32,85,1.02]],
  'THE SQUATTERS':[[24,60,32,80,.63],[51,55,32,80,.69],[77,61,32,80,.62]],
  'HIGHWAY ROBBERS':[[26,53,42,80],[74,53,42,80]],
  'THE HOLLOWED':[[34,57,32,66],[67,59,32,66]],
  'THE CRANE NEST':[[34,45,43,73],[71,61,37,78]],
  'THE POWDER MONKEY':[[50,54,56,89]],
  'FREIGHT CAR AMBUSH':[[50,55,76,89]],
  'THE SHATTERED SILO':[[51,67,46,67,1,false,3],[19,70,31,49,1,false,2],[81,76,23,38,1,false,4]]
 };
 function defaults(row,index,total,background){
  if(background)return {x:50,y:50,width:100,height:100,scale:1,z:1,flip:false};
  const [x,y,width,height,scale=1,flip=false,z=2]=defaultPlaces[row.title]?.[index]||
   [(index+1)*100/(total+1),55,total===1?54:Math.min(38,95/total),82];
  return {x,y,width,height,scale,z,flip};
 }
 const css=el('style');
 css.textContent=`
 .r127-layout-editor{width:min(1120px,96vw);max-height:94dvh;overflow:auto;background:#181411;color:#f5e6cf;border:1px solid #a67f4c;padding:14px}
 .r127-layout-editor::backdrop{background:#000b}
 .r127-layout-editor h2{margin:0 0 10px}
 .r127-layout-editor .layout-controls{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0;align-items:end}
 .r127-layout-editor label{display:grid;gap:3px;font-size:13px}
 .r127-layout-editor input,.r127-layout-editor select,.r127-layout-editor button,.r127-layout-editor textarea{font:inherit;color:#f5e6cf;background:#251e17;border:1px solid #94734d;padding:5px;max-width:100%}
 .r127-layout-editor .layout-picker{width:100%;margin-block:6px}
 .r127-layout-editor .layout-stage{position:relative;isolation:isolate;width:100%;aspect-ratio:16/9;overflow:hidden;background:#0c0b09;margin:auto}
 .r127-layout-editor .layout-stage[data-device=phone]{width:min(100%,390px);aspect-ratio:4/3}
 .r127-layout-editor .layout-base{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
 .r127-layout-editor .layout-dirt-road{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;pointer-events:none}
 .r127-layout-editor .layout-stage .layout-causeway-ground{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;mask-image:linear-gradient(to bottom,transparent 0%,transparent 28%,#000 58%,#000 100%);-webkit-mask-image:linear-gradient(to bottom,transparent 0%,transparent 28%,#000 58%,#000 100%)}
 .r127-layout-editor .layout-stage[data-sky-time=dusk] .layout-base{filter:sepia(.42) hue-rotate(-18deg) saturate(1.4)}
 .r127-layout-editor .layout-stage[data-sky-time=night] .layout-scene-image{filter:brightness(.62) saturate(.68) sepia(.12) hue-rotate(165deg)}
 .r127-layout-editor .layout-stage[data-sky-time=dusk] .layout-scene-image{filter:brightness(.83) saturate(.88) sepia(.18)}
 .r127-layout-editor .layout-stage[data-sky-time=dawn] .layout-scene-image{filter:brightness(.92) saturate(.91) sepia(.13)}
 .r127-layout-editor .layout-unit{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:end;touch-action:none;cursor:grab;transform-origin:center;min-height:0;padding:0;border:0;background:transparent}
 .r127-layout-editor .layout-unit[aria-pressed=true]{outline:1px dashed #f6c87d}
 .r127-layout-editor .layout-unit img{width:100%;height:100%;min-height:0;object-fit:contain;object-position:center bottom;pointer-events:none}
 .r127-layout-editor .layout-unit span{font-size:11px;white-space:nowrap;background:#421714;border:1px solid #b25044;padding:2px 4px;pointer-events:none}
 .r127-layout-editor .layout-unit.layout-scene-image img{flex:none;object-fit:contain;object-position:center}
 .r127-layout-editor .layout-unit.layout-scene-image img[src*="toxic_cargo.png"]{width:100%;height:100%;object-fit:contain!important;object-position:center center!important}
 .r127-layout-editor .layout-unit.layout-scene-image img[src*="shipwreck_scavengers.png"]{object-fit:fill;object-position:center bottom}
 .r127-layout-editor .layout-stage[data-preview=true] .layout-unit{outline:none;pointer-events:none}
 .r127-layout-editor .layout-empty{position:absolute;inset:auto 0 0;background:#130e09dd;padding:8px;text-align:center}
 .r127-layout-editor .layout-fields input[type=number]{width:5.5em}
 .r127-layout-editor textarea{width:100%;box-sizing:border-box}
 .r127-layout-editor .layout-save-indicator{display:inline-block;padding:6px 9px;border:1px solid #94734d;border-radius:4px;font-size:13px}
 .r127-layout-editor .layout-save-indicator[data-state=saved]{color:#9ee8a5;border-color:#51835a}
 .r127-layout-editor .layout-save-indicator[data-state=dirty]{color:#ffd68a;border-color:#b18b41}
 .r127-layout-editor .layout-save-indicator[data-state=unsaved]{color:#ddd0bb}
 `;
 document.head.append(css);
 function show(legacy){
  const dialog=el('dialog');dialog.className='r127-layout-editor';dialog.setAttribute('aria-label','Combat Visual Testing');
  const heading=el('h2','Combat Visual Testing');dialog.append(heading);
  function button(parent,label,action){
   const b=el('button',label);b.type='button';b.addEventListener('click',action);parent.append(b);return b;
  }
  function controls(){const n=el('div');n.className='layout-controls';dialog.append(n);return n;}
  const top=controls();
  const close=button(top,'Close',()=>dialog.close());
  button(top,'Legacy Composition Preview',()=>{dialog.close();legacy?.();});
  const summary=el('p');dialog.append(summary);
  const filters=controls();
  function select(parent,label,values){
   const wrapper=el('label',label),select=el('select');wrapper.append(select);parent.append(wrapper);options(select,values);return select;
  }
  function options(node,values){
   node.replaceChildren(...values.map(value=>{
    const [key,label]=Array.isArray(value)?value:[value,value];
    const option=el('option',label);option.value=key;return option;
   }));
  }
  const searchWrap=el('label','Search encounters'),search=el('input');search.type='search';searchWrap.append(search);filters.append(searchWrap);
  const region=select(filters,'Region',['All regions','CENTRAL + GLOBAL',...regions,'GLOBAL']);
  const classification=select(filters,'Classification',['Active','GLOBAL','REGIONAL','FIXED','INACTIVE']);
  const combat=select(filters,'Scene type',['All','Combat','Noncombat']);
  const coverage=select(filters,'Artwork',['All','Art present','Art missing / review','Art broken','Art unassigned / review','Checking art']);
  const multi=select(filters,'Sprites',['Any','Multiple sprites']);
  const sort=select(filters,'Sort by',['Name','Region','Artwork']);
  const batch=select(filters,'Review batch',[['Industrial & Roadside','Industrial & Roadside uploads'],['New uploads (Nov 16)','New uploads (Nov 16)'],['New uploads (9)','Previous uploads'],['All encounters','All encounters']]);
  if(L.activeScene())batch.value='All encounters';
  const picker=el('select');picker.className='layout-picker';picker.setAttribute('aria-label','Encounter');dialog.append(picker);
  let reviews=readReviews();
  const reviewControls=controls();
  const reviewStatus=el('span');reviewStatus.setAttribute('role','status');reviewControls.append(reviewStatus);
  const reviewButton=button(reviewControls,'Mark Reviewed / Done',()=>{
   if(!row)return;
   const next=readReviews();
   if(reviews.has(row.id))next.delete(row.id);
   else if(progress(row,reviews)==='yellow')next.add(row.id);
   else return;
   try{localStorage.setItem(reviewKey,JSON.stringify([...next]));}
   catch{reviewStatus.textContent='Review status could not be saved in this browser.';return;}
   reviews=next;
   rebuildPicker();
  });
  const metadata=el('p');dialog.append(metadata);
  const variants=controls();
  const phase=select(variants,'State',['approach','combat']);
  const variant=select(variants,'Variant',[]);
  // Backdrop is a preview-only choice, independent of the artwork variant.
  // "None" restores the selected regional background rather than blank sky.
  const backdrop=select(variants,'Backdrop',[
   ['none','None — regional background'],['sky','Sky only'],['road','Sky + dirt road']
  ]);
  const background=select(variants,'Background region',regions);
  const skyTime=select(variants,'Sky preview',['dawn','day','dusk','night']);
  skyTime.value='day';
  const device=select(variants,'Layout',['desktop','phone']);
  const canvas=el('div');canvas.className='layout-stage';dialog.append(canvas);
  const attach=controls();
  const artFile=select(attach,'Existing sprite',[['','Choose artwork'],...[...L.installed.keys()].sort()]);
  button(attach,'Attach Sprite',()=>{
   if(!row||!L.installed.has(artFile.value))return;
   const path=L.installed.get(artFile.value),key='attachment:'+artFile.value;
   if(nodes.has(key))return;
   const record={path,key,index:nodes.size};
   nodes.set(key,record);initial[key]=defaults(row,record.index,1,false);draft[key]={...initial[key]};
   options(units,[...nodes.values()].map(r=>[r.key,L.assetName(r.path)]));units.value=key;paint();
   updateStatus('Sprite attached to this draft. Save Layout on This Browser to apply it.');
  });
  const fields=controls();fields.classList.add('layout-fields');
  const units=select(fields,'Unit',[]);
  const values={};
  for(const [name,min,max,step] of [
   ['x',0,100,.1],['y',0,100,.1],['width',2,150,.1],['height',2,150,.1],['scale',.1,3,.01],['z',0,30,1]
  ]){
   const label=el('label',name==='z'?'Layer':name.toUpperCase()),input=el('input');
   input.type='number';input.min=min;input.max=max;input.step=step;label.append(input);fields.append(label);values[name]=input;
  }
  const flipWrap=el('label','Mirror'),flip=el('input');flip.type='checkbox';flipWrap.append(flip);fields.append(flipWrap);
  const actions=controls(),message=el('p');message.setAttribute('role','status');dialog.append(message);
  const saveIndicator=el('span','Not saved locally');saveIndicator.className='layout-save-indicator';saveIndicator.setAttribute('role','status');saveIndicator.setAttribute('aria-live','polite');actions.append(saveIndicator);
  const transfer=el('textarea');transfer.rows=7;transfer.setAttribute('aria-label','Layout JSON');transfer.hidden=true;dialog.append(transfer);
  let row,spec,initial={},draft={},baseline={},nodes=new Map(),preview=false,closed=false;
  const descriptor=(path,index)=>({path,key:L.unitKey(path,index),index});
  const selected=()=>nodes.get(units.value);
  const updateStatus=text=>{message.textContent=text;};
  const hasOwn=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
  function updateSaveIndicator(){
   if(!row){saveIndicator.textContent='No encounter selected';saveIndicator.dataset.state='unsaved';return;}
   const key=L.sceneKey(row.id,phase.value,device.value),localSaved=hasOwn(L.local(),key);
   const published=typeof L.published==='function'&&hasOwn(L.published(),key);
   const dirty=JSON.stringify(draft)!==JSON.stringify(baseline);
   saveIndicator.dataset.state=dirty?'dirty':localSaved?'saved':'unsaved';
   saveIndicator.textContent=dirty?'● Unsaved changes · '+(localSaved?'saved version exists':'not saved yet'):
    localSaved?'✓ Saved in this browser'+(published?' · Published version also exists':' · Browser only'):
    published?'○ Not saved locally · Published in game':'○ Not saved locally';
   removeLocalSave.disabled=!localSaved;
  }
  function refreshReview(){
   const current=row?progress(row,reviews):null;
   reviewStatus.textContent=current?progressLabels[current]:'No scenario selected';
   reviewButton.textContent=row&&reviews.has(row.id)?'Needs Review':'Mark Reviewed / Done';
   reviewButton.disabled=!row||(!reviews.has(row.id)&&current!=='yellow');
  }
  function rebuildPicker(){
   if(closed)return;
   const keep=picker.value||L.activeScene()?.id;
   const term=search.value.trim().toLowerCase(),all=[...L.rows.values()];
   const visible=all.filter(row=>{
    if(batch.value==='Industrial & Roadside'&&!industrialUploads.has(row.title))return false;
    if(batch.value==='New uploads (9)'&&!latestBatch.has(row.id))return false;
    if(batch.value==='New uploads (Nov 16)'&&!november16Uploads.has(row.title))return false;
    if(classification.value==='Active'?row.classification==='INACTIVE':row.classification!==classification.value)return false;
    const chosen=region.value;
    if(chosen==='GLOBAL'&&row.classification!=='GLOBAL')return false;
    if(!['All regions','GLOBAL'].includes(chosen)&&row.classification!=='GLOBAL'&&!row.regions.includes(chosen.split(' ')[0])&&!(chosen==='CAUSEWAY'&&row.regions.includes('SEAPORT')))return false;
    if(combat.value!=='All'&&(combat.value==='Combat')!==row.combat)return false;
    if(coverage.value!=='All'&&coverage.value!==state(row))return false;
    if(multi.value==='Multiple sprites'&&!row.variants.some(v=>v.units.length>1))return false;
    return (row.name+' '+row.id+' '+regionLabel(row)+' '+assets(row).map(L.assetName).join(' ')).toLowerCase().includes(term);
   });
   const sortKey=row=>sort.value==='Region'?regionLabel(row):sort.value==='Artwork'?state(row):row.name;
   visible.sort((a,b)=>sortKey(a).localeCompare(sortKey(b))||a.name.localeCompare(b.name));
   options(picker,visible.map(row=>[row.id,progressLabels[progress(row,reviews)]+' · '+row.name+' · '+regionLabel(row)+' · '+state(row)]));
   if(visible.some(row=>row.id===keep))picker.value=keep;
   const active=all.filter(row=>row.classification!=='INACTIVE');
   const counts=['GLOBAL','FIXED',...regions].map(region=>region+' '+active.filter(row=>row.classification===region||row.regions.includes(region)).length);
   const art=['Art present','Art broken','Art missing / review','Art unassigned / review','Checking art'].map(label=>label+' '+active.filter(row=>state(row)===label).length);
   summary.textContent=visible.length+' shown / '+active.length+' active · '+counts.join(' · ')+' | '+art.join(' · ');
   const totals=['green','yellow','red','checking'].map(key=>progressLabels[key]+' '+active.filter(row=>progress(row,reviews)===key).length);
   summary.textContent+=' | '+totals.join(' · ');
   if(row?.id!==picker.value)changeScene();
   else refreshReview();
  }
  function changeScene(){
   row=L.rows.get(picker.value);
   refreshReview();
   if(!row){nodes.clear();draft={};initial={};baseline={};metadata.textContent='No encounters match these filters.';canvas.replaceChildren();options(units,[]);updateFields();return;}
   const active=L.activeScene();
   phase.value=active?.id===row.id?active.phase:'approach';
   if(region.value==='CAUSEWAY')background.value='CAUSEWAY';
   else if(row.regions.length)background.value=row.regions[0];
   // Steve is a regional sprite, not an airborne sky composition.
   // Owner-uploaded combat sprites have a regional sky preview; freight uses dirt road.
   const uploadedSprites=new Set(['HARBOR SECURITY DRONE','FLOODLIGHT SWEEP',
     'DOCKSIDE PIRATES','SEAWALL SNIPER','CARGO HIJACKERS','SCRAP CRAB NEST']);
   backdrop.value=row.id==='scripted:crazy-steve'?'none':
     row.title==='THE BURIED FREIGHT'?'road':
     (uploadedSprites.has(row.title)||['SHIPWRECK SCAVENGERS','LEAKING FREIGHT TANK'].includes(row.title))?'sky':(sceneLayers.get(row.id)||'none');
   changePhase();
  }
  function changePhase(){
   if(!row)return;
   const choices=row.variants.flatMap((v,i)=>v.phase==='both'||v.phase===phase.value?[[String(i),v.variant]]:[]);
   options(variant,choices.length?choices:[['','No assigned art in this state']]);
   loadDraft();
  }
  function loadDraft(){
   if(!row)return;
   spec=variant.value===''?null:row.variants[Number(variant.value)];
   const records=(spec?.units||[]).map(descriptor);
   if(spec?.background)records.unshift({path:spec.background,key:'background:'+L.assetName(spec.background),background:true});
   const context={id:row.id,phase:phase.value},live=L.capture(context,device.value),saved=L.get(row.id,phase.value,device.value);
   for(const key of Object.keys(saved))if(key.startsWith('attachment:')&&L.installed.has(key.slice(11))){
    records.push({key,path:L.installed.get(key.slice(11)),index:records.length});
   }
   initial=Object.fromEntries(records.map(record=>[record.key,live[record.key]||
    defaults(row,record.index,spec?.units.length,record.background)]));
   draft=Object.fromEntries(records.map(record=>[record.key,{...saved[record.key]||initial[record.key]}]));
   baseline=JSON.parse(JSON.stringify(draft));
   metadata.textContent=row.name+' · '+row.id+' · '+regionLabel(row)+' · '+(row.combat?'Combat available':'Noncombat')+
    ' · '+(spec?.units.length||0)+' sprites · '+row.variants.length+' variants · '+
    (records.map(record=>L.assetName(record.path)+' ('+(status.get(record.path)||'unchecked')+')').join(', ')||state(row));
   nodes=new Map(records.map(record=>[record.key,record]));
   options(units,records.map(record=>[record.key,record.background?'Scene artwork':(record.index+1)+' · '+L.assetName(record.path)]));
   paint();
  }
  function position(node,key){
   const u=draft[key];
   Object.assign(node.style,{left:u.x+'%',top:u.y+'%',width:u.width+'%',height:u.height+'%',zIndex:String(u.z),
    transform:'translate(-50%,-50%) scale('+u.scale+')'});
   node.firstChild.style.transform=u.flip?'scaleX(-1)':'none';
   node.setAttribute('aria-pressed',String(units.value===key));
  }
  function paint(){
   canvas.dataset.device=device.value;canvas.dataset.preview=String(preview);
   const layers=backdrop.value;
   const regionalRoot=new URL('../assets/regions/',L.root);
   const bg=el('img');bg.className='layout-base';bg.alt='';
   const bridge=layers==='none'&&background.value==='CAUSEWAY';
   bg.src=bridge?new URL('sky_'+(skyTime.value==='dusk'?'dawn':skyTime.value)+'.png',regionalRoot).href:
    layers==='none'?new URL(L.regionArt(background.value),L.root).href:
    new URL('sky_'+(skyTime.value==='dusk'?'dawn':skyTime.value)+'.png',regionalRoot).href;
   const standalone=row?.fullCinematic&&!!spec?.background&&layers==='none';
   canvas.replaceChildren(...(standalone?[]:[bg]));
   if(bridge&&!standalone){
    const causeway=el('img');causeway.className='layout-causeway-ground';causeway.alt='';
    causeway.src=new URL(L.regionArt('CAUSEWAY'),L.root).href;
    canvas.append(causeway);
   }
   // Composite the region's terrain overlay above the time-of-day sky for
   // these owner-provided enemy sprites; do not show only an empty sky.
   const uploadedRegional=new Set(['HARBOR SECURITY DRONE','FLOODLIGHT SWEEP',
     'DOCKSIDE PIRATES','SEAWALL SNIPER','CARGO HIJACKERS','SCRAP CRAB NEST']);
   const showRegional=layers==='sky'&&row&&uploadedRegional.has(row.title);
   if(showRegional){
    const regionArt=globalThis.Route127EditorSky?.describe(background.value,
     {dawn:6,day:12,dusk:18,night:22}[skyTime.value]);
    if(regionArt){
     const ground=el('img');ground.className='layout-region-overlay';ground.alt='';
     ground.src=regionArt.ground;canvas.append(ground);
    }
   }
   if(layers==='road'){
    const dirt=el('img');dirt.className='layout-dirt-road';dirt.alt='';
    dirt.src=new URL('dirt_road_foreground.png',regionalRoot).href;
    canvas.append(dirt);
   }
   canvas.dataset.skyTime=layers==='none'&&!bridge?'none':skyTime.value;
   skyTime.parentElement.hidden=layers==='none'&&!bridge;
   background.parentElement.hidden=standalone||layers!=='none'&&!showRegional;
   if(!nodes.size){const empty=el('p',state(row));empty.className='layout-empty';canvas.append(empty);}
   for(const [key,record] of nodes){
    const node=el('button');node.type='button';node.className='layout-unit'+(record.background?' layout-scene-image':'');
    node.setAttribute('aria-label',L.assetName(record.path));record.element=node;
    const img=el('img');img.draggable=false;img.alt='';img.src=new URL(record.path,L.root).href+'?v=wo27-art-fit';
    img.addEventListener('error',()=>{img.alt='Missing: '+L.assetName(record.path);});
    node.append(img);
    if(phase.value==='combat'&&!record.background)node.append(el('span','HP'));
    node.addEventListener('click',()=>{units.value=key;updateFields();});
    node.addEventListener('pointerdown',event=>{
     if(preview||event.button!==0)return;
     event.preventDefault();units.value=key;updateFields();
     const bounds=canvas.getBoundingClientRect(),origin={...draft[key]},x=event.clientX,y=event.clientY;
     if(!bounds.width||!bounds.height)return;
     node.setPointerCapture(event.pointerId);
     node.onpointermove=move=>{
      draft[key].x=Math.max(0,Math.min(100,origin.x+(move.clientX-x)/bounds.width*100));
      draft[key].y=Math.max(0,Math.min(100,origin.y+(move.clientY-y)/bounds.height*100));
      updateFields();
     };
     node.onlostpointercapture=()=>{node.onpointermove=null;};
    });
    canvas.append(node);position(node,key);
   }
   updateFields();
  }
  function updateFields(){
   const active=selected(),u=active&&draft[units.value];
   for(const [name,input] of Object.entries(values)){
    input.disabled=!u||preview;input.value=u?Number(u[name].toFixed(2)):'';
   }
   flip.disabled=!u||preview;flip.checked=!!u?.flip;
   for(const [key,record] of nodes)if(record.element&&draft[key])position(record.element,key);
   updateSaveIndicator();
  }
  for(const [name,input] of Object.entries(values))input.addEventListener('input',()=>{
   if(!selected()||!input.validity.valid||input.value==='')return;
   draft[units.value][name]=Number(input.value);position(selected().element,units.value);updateSaveIndicator();
  });
  flip.addEventListener('change',()=>{if(selected()){draft[units.value].flip=flip.checked;updateFields();}});
  units.addEventListener('change',updateFields);
  picker.addEventListener('change',changeScene);
  phase.addEventListener('change',changePhase);
  for(const input of [variant,device])input.addEventListener('change',loadDraft);
  background.addEventListener('change',paint);
   region.addEventListener('change',()=>{if(region.value==='CAUSEWAY')background.value='CAUSEWAY';paint();});
  skyTime.addEventListener('change',paint);
  backdrop.addEventListener('change',paint);
  for(const input of [search,region,classification,combat,coverage,multi,sort,batch])input.addEventListener('input',rebuildPicker);
  button(actions,'Reset Unit',()=>{if(selected()){draft[units.value]={...initial[units.value]};updateFields();}});
  button(actions,'Remove Attached Sprite',()=>{
   const key=units.value;
   if(!key.startsWith('attachment:'))return;
   nodes.delete(key);delete initial[key];delete draft[key];
   options(units,[...nodes.values()].map(r=>[r.key,L.assetName(r.path)]));paint();
   updateStatus('Sprite removed from this draft. Save Layout on This Browser to apply it.');
  });
  button(actions,'Reset Scene',()=>{draft=Object.fromEntries(Object.entries(initial).map(([key,value])=>[key,{...value}]));updateFields();});
  const previewButton=button(actions,'Preview Gameplay',()=>{
   if(!row)return;preview=!preview;previewButton.textContent=preview?'Return to editing':'Preview Gameplay';paint();
  });
  button(actions,'Save Layout on This Browser',()=>{
   if(!row)return;
   const key=L.sceneKey(row.id,phase.value,device.value);
   try{
    const previous=Object.fromEntries(Object.entries(L.local()[key]||{}).filter(([unit])=>!unit.startsWith('attachment:')));
    L.save({...L.local(),[key]:{...previous,...draft}});
    baseline=JSON.parse(JSON.stringify(draft));updateSaveIndicator();
    updateStatus('Saved on this browser. Gameplay uses it now and after refresh.');
   }catch(error){updateStatus(error.message);}
  });
  const removeLocalSave=button(actions,'Unsave this layout',()=>{
   if(!row)return;
   const key=L.sceneKey(row.id,phase.value,device.value);
   if(!hasOwn(L.local(),key))return;
   if(!confirm('Remove the browser save for '+row.name+' ('+phase.value+', '+device.value+')? Other layouts and published game artwork will not be changed.'))return;
   try{
    const next={...L.local()};delete next[key];L.save(next);loadDraft();
    updateStatus('Local save removed for this scene/state/device only. Other saved layouts are safe.');
   }catch(error){updateStatus(error.message);}
  });
  button(actions,'Export Layout JSON',()=>{
   transfer.hidden=false;transfer.value=L.json(L.merged());transfer.select();
   updateStatus('Copy this JSON to share exact saved layouts.');
  });
  button(actions,'Import / Apply Layout JSON',()=>{
   if(transfer.hidden){transfer.hidden=false;transfer.focus();updateStatus('Paste layout JSON and select Import / Apply again.');return;}
   try{L.importJSON(transfer.value);loadDraft();updateStatus('Imported layouts are active in gameplay on this browser.');}
   catch(error){updateStatus(error.message);}
  });
  button(actions,'Export Existing Layouts',()=>{
   const older={};
   for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);
    if(!key||!/^(?=.*(?:combat|sprite|encounter))(?=.*(?:layout|composition|visual.?test))/i.test(key)||key==='combat-visual-layouts-v1')continue;
    const value=localStorage.getItem(key);
    try{const parsed=JSON.parse(value);if(parsed&&typeof parsed==='object')older[key]=parsed;}catch{}
   }
   transfer.hidden=false;
   transfer.value=Object.keys(older).length?JSON.stringify({legacyStorage:older},null,2):L.json(L.merged());
   transfer.select();
   updateStatus(Object.keys(older).length?'Copy this legacy data for conversion. The original browser data was preserved.':
    'No recognizable older layout key on this origin. If the older editor still shows your edits, export from that editor and share the JSON.');
  });
  dialog.addEventListener('close',()=>{closed=true;dialog.remove();},{once:true});
  document.body.append(dialog);rebuildPicker();dialog.showModal();close.focus();
  checkAssets(()=>{rebuildPicker();if(row&&spec)metadata.dataset.artStatus=state(row);});
 }
 globalThis.Route127CombatLayoutEditor=Object.freeze({show});
})();
