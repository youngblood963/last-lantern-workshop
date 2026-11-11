/* DEVTEST cosmetic layouts. Gameplay state and save slots are never edited here. */
/* Deployment refresh: include latest Pipe Robber.png upload and Miles rendering adjustment. */
(() => {
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
 const root=new URL('../devtest/',document.baseURI);
 const key='combat-visual-layouts-v1';
 const enemy=name=>'assets/enemies/'+name;
 const scenery=name=>'assets/scenarios/'+name;
 const locationArt=name=>'assets/locations/'+name;
 const sprite=(...names)=>names.map(enemy);
 const regionArt=region=>'../assets/regions/'+region.toLowerCase()+'.png';
 const normalize=name=>String(name||'').toUpperCase().replace(/^EAST ROAD — /,'');
 const assetName=path=>decodeURIComponent(new URL(path,root).pathname.split('/').at(-1));
 const unitKey=(path,index)=>index+':'+assetName(path);
 const states=new Map();
 function register(title,units,phase='both',variant='Standard',background=null){
  const rows=states.get(title)||[];
  rows.push({units,phase,variant,background});
  states.set(title,rows);
 }
 for(const [title,files] of Object.entries({
  'BAT COLONY':Array(4).fill('bat_colony.png'),
  'RABID RACCOONS':Array(3).fill('rabid_raccoon.png'),
  'LOOTERS':['looters_1.png','looters_2.png','looters_3.png'],
  'PARKING LOT RAIDERS':['parking_lot_raiders-_1.png','parking_lot_raiders_2.png','parking_lot_raiders_3.png'],
  'GANG LOOKOUT':['gang_lookout.png'],
  'THE HOLLOWED':['the_hollowed_1.png','the_hollowed_2.png'],
  'THE SQUATTERS':['the_squatters_1.png','the_squatters_2.png','the_squatters_3.png'],
  'GUNSHOP OWNER':['gunshop_owner.png'],
  'HIGHWAY ROBBERS':['Tire Iron Robber.png','Spear Robber.png'],
  'ROADBLOCK':['Spear Robber.png','Pipe Robber.png'],
  'THE GATELESS WALL':['sentry.png'],
  'THE WARDEN':['warden.png'],
  'THE STRAY':['The Stray.png'],
  'THE CRAWLER':['The Crawler.png'],
  'THE BIG MAN':['The Big Man.png'],
  'THE BONE COLLECTOR':['The Bone Collector.png'],
  'SECURITY DRONE':['Security Drone.png'],
  'SOMETHING IN THE DRAIN':['Something in the Drain - Grate and Claw.png'],
  'THE WAX MUSEUM':['The Curator.png'],
  'THE WRECKERS':['The Wreckers - Pipe.png','The Wreckers - Chain.png'],
  'RATS IN THE PANTRY':['Snarling Rats at a Rusted Sewer Drain.png'],
  'CHEMICAL BURNERS':['Chemical Burner 1.png','Chemical Burner 2.png'],
  'THE GRINDER CREW':['rivet.png'],
  'THE STEEL ORCHARD':['martha.png']
 }))register(title,sprite(...files));
 register('GANG LOOKOUT',sprite('gang_lookout_1.png','gang_lookout_2.png'),'combat','Reinforcements');
 register('THE PAINTED ARROWS',sprite('Painted Arrows - Club Scavenger.png','Painted Arrows - Knife Scavenger.png'),'combat','Red arrow ambush');
 register('THE HANGING CAGE',sprite('silas_crowe_caged.png'),'approach','Caged');
 register('THE HANGING CAGE',sprite('silas_crowe.png'),'combat','Freed');
 for(const [title,files] of Object.entries({
  'ROACH NEST':[enemy('roach_nest_ordinary.png'),enemy('roach_nest_contaminated.png'),'../../roach_nest_aggressive_swarm.png'],
  'FERAL DOG':[enemy('feral_dog_mother_pups.png'),'../../feral_dog_hungry_lone.png','../../feral_dog_aggressive_lone.png','../../feral_dog_pack_concept.png'],
  'LONE SCAVENGER':sprite('Lone Scavenger - Suspicious Scavenger.png','Lone Scavenger - Friendly Scrapper.png','Lone Scavenger - Weary Trader.png'),
  'TUNNEL RATS':sprite('Tunnel Rats.png','Tunnel Rats - Wild Boar.png')
 }))for(const path of files)register(title,[path],'both',assetName(path).replace(/\.png$/i,''));
 for(const [title,file] of Object.entries({
  'THE HANGING SHOES':'the_hanging_shoes.png','THE IRON HARVEST':'the_iron_harvest.png',
  'THE FENCE ARTIST':'the_fence_artist.png','THE SILENT PICNIC':'the_silent_picnic.png',
  'MILES THE COURIER':'miles_the_courier.png','THE LAST MAIL':'the_last_mail.png',
  'THE RUST PARADE':'the_rust_parade.png','THE CAROUSEL HORSE':'the_carousel_horse.png',
  'THE WELDED BUS':'the_welded_bus.png','THE MASK MARKET':'the_mask_market.png',
  'THE PAPER STORM':'the_paper_storm.gif','THE FALSE SHOULDER':'the_false_shoulder.gif'
 }))register(title,[],'both','Standard',scenery(file));
 for(const period of ['dawn','day','dusk','night']){
  register('THE EMPTY BUS SHELTER',[],'approach',period,scenery('empty_bus_shelter_'+period+'.png'));
 }
 register('THE SHATTERED SILO',['silo_king.png','razorback.png','young_boar.png'].map(scenery),'both','Boars',scenery('the_shattered_silo.png'));

 const rows=new Map();
 const byEncounter=new Map();
 const byTitle=new Map();
 for(const entry of [...RoadScenarioRegistry.entries,...RoadScenarioRegistry.regionalCatalog]){
  const id=entry.canonicalId||entry.id;
  if(!id||!entry.encounter)continue;
  const title=normalize(entry.encounter.title);
  byEncounter.set(entry.encounter,id);
  byTitle.set(title,id);
  if(rows.has(id))continue;
  const fight=!!entry.encounter.combat||entry.references?.some(ref=>ref.category==='combat')||
   states.get(title)?.some(spec=>spec.phase==='combat');
  rows.set(id,{
   id,title,name:entry.encounter.displayName||entry.name||entry.encounter.title,
   classification:entry.classification||'GLOBAL',regions:entry.regions||[],
   combat:!!fight,variants:states.get(title)||[]
  });
 }
 for(const [id,site] of [['east:67','Industrial Road — Fresh Mart'],['east:81','East Trade Route — St. Mercy Hospital']]){
  if(rows.has(id))rows.get(id).site=site;
 }
 const bosses=[
  ['SALVAGE KING','factory_salvage_king.png'],['GRINDER','factory_grinder.png'],
  ['THE CHEMIST','factory_chief_chemist.png'],['THE FOREMAN','factory_foreman.png']
 ];
 for(const [i,[title,file]] of bosses.entries()){
  const id='factory:boss:'+i;
  rows.set(id,{id,title,name:title,classification:'FIXED',regions:['INDUSTRIAL'],site:'Factory',
   combat:true,variants:[{units:[],background:locationArt(file),phase:'both',variant:'Boss room'}]});
 }
 const floorFiles=['factory_loading_receiving.png','factory_production_assembly.png',
  'factory_chemical_processing.png','factory_restricted_basement.png'];
 for(const [floor,names] of FACTORY_ENEMIES.entries()){
  for(const [slot,name] of names.entries()){
   const id='factory:floor:'+floor+':'+slot;
   rows.set(id,{id,title:name,name,classification:'FIXED',regions:['INDUSTRIAL'],
    site:'Factory — '+FACTORY_FLOORS[floor].name,combat:true,variants:[
     {units:[],background:locationArt(floorFiles[floor]),phase:'combat',variant:'Floor background'}
    ]});
  }
 }
 const drainIndex=encounters.findIndex(e=>normalize(e.title)==='SOMETHING IN THE DRAIN');
 if(drainIndex>=0&&!byTitle.has('SOMETHING IN THE DRAIN')){
  const title='SOMETHING IN THE DRAIN',id='early:'+drainIndex;
  rows.set(id,{id,title,name:title,classification:'INACTIVE',regions:[],combat:true,variants:states.get(title)});
  byTitle.set(title,id);
  byEncounter.set(encounters[drainIndex],id);
 }
 for(const [id,name,region] of [
  ['house:squatter','House Squatter','CENTRAL'],['seaport:liberation','Seaport Liberation','SEAPORT'],
  ['factory:captors','Daniel’s Captors','INDUSTRIAL']
 ])rows.set(id,{id,name,title:normalize(name),classification:'FIXED',regions:[region],combat:true,variants:id==='seaport:liberation'?
   [{units:[],background:locationArt('seaport_occupied.png'),phase:'both',variant:'Occupied Harbor'}]:[]});

 const scripted=[
  ['serviceBoss','The Yardman','Service Road','CENTRAL'],
  ['gateGuards','Solace Gate Guard','Solace Gate','CENTRAL'],
  ['jenBoss','Raider Captain','Last Call quest'],
  ['terribleBilly','Terrible Billy','Bounty encounter'],
  ['r18StationFight','Signal Hunters','Station Nine storyline'],
  ['r18DepotFight','County Unit 07','County Depot'],
  ['stationNineSecurity','Station Nine Security Unit','Station Nine garage'],
  ['r18RedFight','Red’s Fight','Rusty Anchor','SEAPORT'],
  ['seaportRoadFight','Coast Road Scavenger','Seaport Road','SEAPORT'],
  ['seaportRoadFight','Harbor Security Drone','Seaport Road','SEAPORT']
 ];
 const scriptIds=new Map();
 for(const [source,name,site,region] of scripted){
  const key=source==='seaportRoadFight'?source+':'+normalize(name):source;
  const id='scripted:'+key.toLowerCase().replace(/[^a-z0-9:]+/g,'-');
  scriptIds.set(key,id);
  rows.set(id,{id,name,title:normalize(name),classification:'FIXED',site,
   regions:region?[region]:[],combat:true,variants:[]});
 }
 const installed=new Map([...rows.values()].flatMap(row=>row.variants.flatMap(v=>
  v.units.map(path=>[assetName(path),path]))));
 const bounds={x:[0,100],y:[0,100],width:[2,150],height:[2,150],scale:[.1,3],z:[0,30]};
 function unit(value){
  if(!value||typeof value!=='object')throw new Error('Invalid unit layout');
  const result={};
  for(const [name,[min,max]] of Object.entries(bounds)){
   if(!Number.isFinite(value[name])||value[name]<min||value[name]>max)throw new Error('Invalid '+name);
   result[name]=value[name];
  }
  if(typeof value.flip!=='boolean')throw new Error('Invalid facing');
  return {...result,flip:value.flip};
 }
 const sceneKey=(id,phase,device)=>[id,phase,device].join('/');
 function read(raw){
  const doc=JSON.parse(raw);
  if(doc.version!==1||!doc.scenes||Array.isArray(doc.scenes)||typeof doc.scenes!=='object')throw new Error('Expected Route 127 layout JSON v1');
  const scenes=Object.create(null);
  for(const [scene,units] of Object.entries(doc.scenes)){
   const [id,phase,device,...extra]=scene.split('/');
   if(!rows.has(id)||!['approach','combat'].includes(phase)||!['desktop','phone'].includes(device)||extra.length||
      !units||typeof units!=='object'||Array.isArray(units)||Object.keys(units).length>256)throw new Error('Invalid scene '+scene);
   const safe=Object.create(null);
   for(const [id,layout] of Object.entries(units)){
    if(!/^(?:background|attachment|\d{1,3}):[^/\\]{1,150}$/.test(id))throw new Error('Invalid unit key');
    if(id.startsWith('attachment:')&&!installed.has(id.slice(11)))throw new Error('Unknown attached asset');
    safe[id]=unit(layout);
   }
   scenes[scene]=safe;
  }
  return scenes;
 }
 function load(raw){try{return raw?read(raw):Object.create(null);}catch{return Object.create(null);}}
 const published=load(JSON.stringify(globalThis.Route127PublishedCombatLayouts||{}));
 let local=load(localStorage.getItem(key));
 const merged=()=>Object.fromEntries([...new Set([...Object.keys(published),...Object.keys(local)])].map(scene=>
  [scene,{...published[scene],...local[scene]}]));
 const json=scenes=>JSON.stringify({version:1,scenes},null,2);
 function save(scenes){
  const next=read(json(scenes));
  localStorage.setItem(key,json(next));
  local=next;
  GraphicalUI.schedule();
 }
 function importJSON(raw){
  const input=JSON.parse(raw);
  const documents=input?.legacyStorage?Object.values(input.legacyStorage).filter(doc=>doc?.version===1&&doc?.scenes):[input];
  if(!documents.length)throw new Error('This older layout format needs conversion. Share the exported JSON with Forge.');
  const incoming={};
  for(const doc of documents)for(const [scene,units] of Object.entries(read(JSON.stringify(doc)))){
   incoming[scene]={...incoming[scene],...units};
  }
  const next={...local};
  for(const [scene,units] of Object.entries(incoming))next[scene]={...next[scene],...units};
  save(next);
 }
 function get(id,phase,device){
  const scene=sceneKey(id,phase,device),desktop=sceneKey(id,phase,'desktop');
  return {...published[desktop],...local[desktop],...published[scene],...local[scene]};
 }

 const selector='.r127-bat-unit,.r127-raccoon-unit,.r127-human-unit,.r127-npc-figure,.r127-npc-combat,.r127-road-unit,.r127-silo-boar';
 function activeScene(){
  const c=typeof combatState==='undefined'?null:combatState;
  if(c?.r18DanielCaptors)return {id:'factory:captors',phase:'combat'};
  if(stage==='factoryDungeonRoom'&&!c){
   const f=player.flags.factoryDungeon;
   if(f&&f.room===FACTORY_FLOORS[f.floor]?.rooms.length-1&&!f.done?.includes(f.floor)){
    return {id:'factory:boss:'+f.floor,phase:'approach'};
   }
  }
  if(c?.source==='factoryFight'){
   const index=bosses.findIndex(([name])=>name===normalize(c.name));
   if(index>=0)return {id:'factory:boss:'+index,phase:'combat'};
   const floor=player.flags.factoryDungeon?.floor;
   const slot=FACTORY_ENEMIES[floor]?.indexOf(normalize(c.name))??-1;
   return slot<0?null:{id:'factory:floor:'+floor+':'+slot,phase:'combat'};
  }
  if(c?.source==='houseBoss')return {id:'house:squatter',phase:'combat'};
  const scriptedId=scriptIds.get(c?.source==='seaportRoadFight'?c.source+':'+normalize(c.name):c?.source);
  if(scriptedId)return {id:scriptedId,phase:'combat'};
  if(c?.source==='seaportLiberation')return {id:'seaport:liberation',phase:'combat'};
  if(stage==='wo6FreshMart')return {id:'east:67',phase:'approach'};
  if(stage!=='encounter'&&!(c&&c.source==='encounter'&&['combat','combatItems'].includes(stage)))return null;
  const encounter=currentEncounter();
  const id=byEncounter.get(encounter)||byTitle.get(normalize(encounter?.title||c?.name));
  return id?{id,phase:c?'combat':'approach'}:null;
 }
 const getSlot=(node,index)=>node.dataset.batIndex??node.dataset.raccoonIndex??node.dataset.humanIndex??node.dataset.index??index;
 function figureUnits(e,scene){
  const units=[...e.figure.querySelectorAll(selector)].flatMap((node,index)=>{
   const img=node.tagName==='IMG'?node:node.querySelector('img');
   return img?.src?[{node,img,key:unitKey(img.src,getSlot(node,index))}]:[];
  });
  const row=rows.get(scene.id);
  if(e.img?.src&&row?.variants.some(v=>v.background&&assetName(v.background)===assetName(e.img.src))){
   units.push({node:e.img,img:e.img,key:'background:'+assetName(e.img.src),background:true});
  }
  return units;
 }
 const styled=new Set();
 function apply(node,layout,background=false){
  node.classList.add('r127-layout-unit');
  node.classList.toggle('r127-layout-background',background);
  node.classList.toggle('r127-layout-flipped',layout.flip);
  for(const [name,suffix] of Object.entries({x:'%',y:'%',width:'%',height:'%',scale:'',z:''})){
   node.style.setProperty('--r127-layout-'+name,layout[name]+suffix);
  }
  styled.add(node);
 }
 const css=document.createElement('style');
 css.textContent=`
 .r127-layout-attachments{position:absolute;inset:0;z-index:5;pointer-events:none}
 .r127-layout-attachments img{object-fit:contain}
 /* Full-scene illustrations must not be cropped as sprite tiles. */
 .gfx-frame .gfx-art img[src*="miles_the_courier.png"],
 .gfx-frame .gfx-art img[src*="the_carousel_horse.png"]{object-fit:contain!important;object-position:center center!important}
 .gfx-frame .gfx-art.r127-layout-has-background{aspect-ratio:16/9;min-height:150px}
 .gfx-frame .gfx-art .r127-layout-unit{position:absolute!important;left:var(--r127-layout-x)!important;top:var(--r127-layout-y)!important;width:var(--r127-layout-width)!important;height:var(--r127-layout-height)!important;transform:translate(-50%,-50%) scale(var(--r127-layout-scale))!important;scale:none!important;z-index:var(--r127-layout-z)!important}
 .gfx-frame .gfx-art .r127-layout-unit:not(.r127-layout-background)>img{transform:none!important}
 .gfx-frame .gfx-art .r127-layout-unit.r127-layout-flipped:not(.r127-layout-background)>img{transform:scaleX(-1)!important}
 .gfx-frame .gfx-art img.r127-layout-flipped{transform:translate(-50%,-50%) scale(calc(-1 * var(--r127-layout-scale)),var(--r127-layout-scale))!important}
 `;
 document.head.append(css);
 let attachmentLayer=null;
 const oldSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=oldSync.apply(this,args), e=this.element, scene=activeScene();
  for(const node of styled)node.classList.remove('r127-layout-unit','r127-layout-background','r127-layout-flipped');
  styled.clear();
  if(!scene||!e?.figure||e.frame.hidden){
   attachmentLayer?.remove();attachmentLayer=null;
   e?.figure?.classList.remove('r127-layout-has-background');
   return result;
  }
  const device=typeof matchMedia==='function'&&matchMedia('(max-width:600px)').matches?'phone':'desktop';
  const layouts=get(scene.id,scene.phase,device);
  e.figure.classList.toggle('r127-layout-has-background',!!e.img?.src&&!!layouts['background:'+assetName(e.img.src)]);
  if(Object.keys(layouts).length)for(const item of figureUnits(e,scene)){
   if(layouts[item.key])apply(item.node,layouts[item.key],item.background);
  }
  const attachments=Object.entries(layouts).filter(([key])=>key.startsWith('attachment:'));
  const signature=scene.id+'/'+scene.phase+'/'+attachments.map(([key])=>key).join('/');
  if(attachmentLayer?.dataset.signature!==signature){
   attachmentLayer?.remove();attachmentLayer=null;
   if(attachments.length){
    attachmentLayer=document.createElement('div');
    attachmentLayer.className='r127-layout-attachments';
    attachmentLayer.dataset.signature=signature;
    for(const [key] of attachments){
     const image=document.createElement('img');
     image.src=new URL(installed.get(key.slice(11)),root).href;
     image.alt='';
     attachmentLayer.append(image);
    }
    e.figure.append(attachmentLayer);
   }
  }
  attachments.forEach(([,layout],index)=>apply(attachmentLayer.children[index],layout));
  return result;
 };
 function capture(scene,device){
  const active=activeScene(),e=GraphicalUI.element;
  if(!active||active.id!==scene.id||active.phase!==scene.phase||!e?.figure?.getBoundingClientRect)return {};
  const phone=typeof matchMedia==='function'&&matchMedia('(max-width:600px)').matches;
  if(phone!==(device==='phone'))return {};
  return Object.fromEntries(figureUnits(e,active).filter(item=>!item.node.hidden).flatMap(item=>{
   const rect=item.node.getBoundingClientRect(), base=item.node.parentElement.getBoundingClientRect();
   if(!base.width||!base.height||!rect.width||!rect.height)return [];
   const style=getComputedStyle(item.node),imgStyle=getComputedStyle(item.img);
   const fit=(n,min,max)=>Math.max(min,Math.min(max,Math.round(n*100)/100));
   return [[item.key,{
    x:fit((rect.left-base.left+rect.width/2)/base.width*100,0,100),
    y:fit((rect.top-base.top+rect.height/2)/base.height*100,0,100),
    width:fit(rect.width/base.width*100,2,150),height:fit(rect.height/base.height*100,2,150),
    scale:1,z:fit(Number(style.zIndex)||2,0,30),flip:/^matrix\(-/.test(imgStyle.transform)
   }]];
  }));
 }
 globalThis.Route127CombatLayouts=Object.freeze({
  rows,installed,root,regionArt,assetName,unitKey,sceneKey,get,local:()=>local,merged,json,save,importJSON,capture,activeScene
 });
})();
