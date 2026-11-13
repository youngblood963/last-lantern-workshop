/* DEVTEST scenario catalog and layout editor. Coordinates are percentages of the scene. */
(() => {
 'use strict';
 const L=globalThis.Route127CombatLayouts;
 if(!L)return;
 const regions=['CENTRAL','INDUSTRIAL','NORTH','EAST','WEST','LOWLANDS','SEAPORT'];
 const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 const regionLabel=row=>row.classification==='REGIONAL'?row.regions.join(' + '):
  [row.classification,row.site||row.regions.join(' + ')].filter(Boolean).join(' · ');
 const assets=row=>[...new Set(row.variants.flatMap(v=>[...v.units,...(v.background?[v.background]:[])]))];
 const status=new Map();
 const reviewKey='route127-scenario-reviews-v1';
 const animatedTitles=new Set(['THE LIME FOG','THE RED RAIN','THE GLASS FIELD']);
 // These approved compositions contain the character(s) within a complete scene asset.
 // A combat encounter does not require separately registered sprites to review its artwork.
 const embeddedCombatArtwork=new Set(['THE IRON HARVEST','THE DRY FOUNTAIN','IRRADIATED ROACHES',
  'THE KNIFE WIND','BROKEN TOLL CREW','THE YARDMAN','THE LAST PATROL']);
 // Batch selector is deliberately independent of review state; completed scenes
 // stay in the batch until the owner finishes checking every composition.
 const latestBatch=new Set(['early:50','early:54','early:61','early:9','early:64',
  'east:33','east:58','scripted:serviceboss','scripted:crazy-steve']);
 const sceneLayers=new Map([
  ['early:50','sky'],['early:54','sky'],['early:61','road'],['early:9','road'],
  ['early:64','sky'],['east:33','sky'],['east:58','road'],
  ['scripted:serviceboss','sky'],['scripted:crazy-steve','sky']
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
   return reviews;
  }catch{return new Set();}
 }
 const progressLabels={green:'🟢 Reviewed / Done',yellow:'🟡 Artwork ready · Needs review',red:'🔴 Missing artwork',checking:'⏳ Checking artwork'};
 function progress(row,reviews){
  if(animated(row))return reviews.has(row.id)?'green':'yellow';
  const art=state(row);
  if(art==='Checking art')return 'checking';
  if(art!=='Art present'||(row.combat&&!embeddedCombatArtwork.has(row.title)&&!row.variants.some(v=>v.units.length)))return 'red';
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
 .r127-layout-editor .layout-stage[data-sky-time=dusk] .layout-base{filter:sepia(.42) hue-rotate(-18deg) saturate(1.4)}
 .r127-layout-editor .layout-stage[data-sky-time=night] .layout-scene-image{filter:brightness(.62) saturate(.68) sepia(.12) hue-rotate(165deg)}
 .r127-layout-editor .layout-stage[data-sky-time=dusk] .layout-scene-image{filter:brightness(.83) saturate(.88) sepia(.18)}
 .r127-layout-editor .layout-stage[data-sky-time=dawn] .layout-scene-image{filter:brightness(.92) saturate(.91) sepia(.13)}
 .r127-layout-editor .layout-unit{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:end;touch-action:none;cursor:grab;transform-origin:center;min-height:0;padding:0;border:0;background:transparent}
 .r127-layout-editor .layout-unit[aria-pressed=true]{outline:1px dashed #f6c87d}
 .r127-layout-editor .layout-unit img{width:100%;height:100%;min-height:0;object-fit:contain;object-position:center bottom;pointer-events:none}
 .r127-layout-editor .layout-unit span{font-size:11px;white-space:nowrap;background:#421714;border:1px solid #b25044;padding:2px 4px;pointer-events:none}
 .r127-layout-editor .layout-unit.layout-scene-image img{flex:none;object-fit:contain;object-position:center}
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
  const batch=select(filters,'Review batch',[['New uploads (9)','New uploads (9)'],['All encounters','All encounters']]);
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
    if(batch.value==='New uploads (9)'&&!latestBatch.has(row.id))return false;
    if(classification.value==='Active'?row.classification==='INACTIVE':row.classification!==classification.value)return false;
    const chosen=region.value;
    if(chosen==='GLOBAL'&&row.classification!=='GLOBAL')return false;
    if(!['All regions','GLOBAL'].includes(chosen)&&row.classification!=='GLOBAL'&&!row.regions.includes(chosen.split(' ')[0]))return false;
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
   if(row.regions.length)background.value=row.regions[0];
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
   const layers=sceneLayers.get(row?.id);
   const regionalRoot=new URL('../assets/regions/',L.root);
   const bg=el('img');bg.className='layout-base';bg.alt='';
   bg.src=new URL(layers?'sky_'+(skyTime.value==='dusk'?'dawn':skyTime.value)+'.png':
    L.regionArt(background.value),layers?regionalRoot:L.root).href;
   canvas.replaceChildren(bg);
   if(layers==='road'){
    const dirt=el('img');dirt.className='layout-dirt-road';dirt.alt='';
    dirt.src=new URL('dirt_road_foreground.png',regionalRoot).href;
    canvas.append(dirt);
   }
   canvas.dataset.skyTime=layers?skyTime.value:'none';
   skyTime.parentElement.hidden=!layers;
   background.parentElement.hidden=!!layers;
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
  skyTime.addEventListener('change',paint);
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
