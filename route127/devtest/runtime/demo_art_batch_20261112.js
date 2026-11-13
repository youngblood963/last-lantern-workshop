/* DEVTEST ONLY — Owner-selected demo artwork batch.
 * Cosmetic only: preserves encounter logic, rewards, RNG, and existing visual-editor layouts.
 * RIDGELINE: original GIF only.
 * SCRATCHING IN THE SHED: sky + dirt road + correct story-state GIF.
 * THE ROAD ENFORCER / MURPHY'S LOST CORVETTE: sky + road + transparent object.
 * THE EMPTY ARMORY: full cinematic scene only.
 * THE FORGOTTEN GARDEN: transparent upper sky behind authored garden, no extra road.
 * Scripted Solace gate guard combat: actual gate art + guard foreground sprite.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||typeof GraphicalUI==='undefined')return;
 const root=new URL('../devtest/',document.baseURI),regions=new URL('../assets/regions/',root);
 const asset=(category,file)=>new URL('assets/'+category+'/'+file,root).href;
 const sky=file=>new URL(file,regions).href;
 const norm=s=>String(s||'').toUpperCase().replace(/^EAST ROAD — /,'').trim();
 const encounter=()=>typeof currentEncounter==='function'?currentEncounter():null;
 const fight=()=>typeof combatState==='undefined'?null:combatState;
 const period=()=>typeof Route127RegionalSky?.phase==='function'?Route127RegionalSky.phase(player?.flags?.worldHour):'day';
 const isFight=()=>['combat','combatItems'].includes(typeof stage==='undefined'?'':stage);
 const guard=()=>isFight()&&fight()?.source==='gateGuards';
 const enforcer=()=>isFight()&&fight()?.r18Enforcer===true;
 const yardman=()=>isFight()&&(fight()?.source==='serviceBoss'||fight()?.name==='THE YARDMAN');
 const discoveredRabbit=()=>!!(player?.flags?.r18RabbitSeen||player?.flags?.r18RabbitReleased||player?.flags?.r18RabbitAdopted);
 function presentation(){
  if(stage==='r127StevePromo')return {id:'crazy-steve',file:asset('scenarios','crazy_steve.png'),layers:'regional'};
  if(guard())return {id:'solace-guard',file:new URL('../playtest/assets/locations/solace_town_gate.png',root).href,layers:'none',guard:true};
  if(enforcer())return {id:'road-enforcer',file:asset('scenarios','the_road_enforcer.png'),layers:'road'};
  if(yardman())return {id:'the-yardman',file:asset('scenarios','the_yardman.png'),layers:'sky'};
  if(stage!=='encounter')return null;
  const title=norm(encounter()?.title),display=norm(encounter()?.displayName);
  // Owner's latest approved artwork: the first group uses sky only, the
  // second uses sky and dirt foreground. Reapers art lives in enemies,
  // and Old Pete's uploaded filename is normalized to old_pete.png.
  const newlyApproved={
   'THE KNIFE WIND':{id:'the-road-reapers',folder:'enemies',file:'the_road_reapers.png',layers:'regional'},
   'THE LIMPING HOUND':{id:'the-limping-hound',folder:'scenarios',file:'the_limping_hound.png',layers:'regional'},
   'THE WALKING PEDDLER':{id:'old-pete',folder:'scenarios',file:'old_pete.png',layers:'regional'},
   'THE TIPPED DELIVERY TRUCK':{id:'delivery-truck',folder:'scenarios',file:'the_tipped_delivery_truck.png',layers:'road'},
   'THE TRAVELER':{id:'traveler-vale',folder:'scenarios',file:'the_traveler_vale.png',layers:'road'},
   'THE SPRAINED RUNNER':{id:'sprained-runner',folder:'scenarios',file:'the_sprained_runner.png',layers:'road'},
   'BROKEN TOLL CREW':{id:'last-patrol',folder:'scenarios',file:'the_last_patrol.png',layers:'road'},
   'THE LAST PATROL':{id:'last-patrol',folder:'scenarios',file:'the_last_patrol.png',layers:'road'}
  };
  const approved=newlyApproved[title]||newlyApproved[display];
  if(approved)return {id:approved.id,file:asset(approved.folder,approved.file),layers:approved.layers};
  if(title==='RIDGELINE'||display==='RIDGELINE')return {id:'ridgeline',file:asset('scenarios','ridgeline.gif'),layers:'none'};
  if(title==='SCRATCHING IN THE SHED'||display==='SCRATCHING IN THE SHED')return {id:'shed',file:asset('scenarios',discoveredRabbit()?'scratching_in_the_shed_rabbit.gif':'scratching_in_the_shed_empty.gif'),layers:'road'};
  if(title==='THE DRY FOUNTAIN'||display==='THE ROAD ENFORCER')return {id:'road-enforcer',file:asset('scenarios','the_road_enforcer.png'),layers:'road'};
  if(title==='THE EMPTY ARMORY'||display==='THE EMPTY ARMORY')return {id:'armory',file:asset('scenarios','the_empty_armory.png'),layers:'none'};
  if(title==='IRRADIATED ROACHES'||display==='THE FORGOTTEN GARDEN')return {id:'garden',file:asset('scenarios','the_forgotten_garden.png'),layers:'sky'};
  if(title==="MURPHY'S LOST CORVETTE"||display==="MURPHY'S LOST CORVETTE")return {id:'corvette',file:asset('scenarios','murphys_lost_corvette.png'),layers:'road'};
  if(title==='RUINED SIGNAL HUT'||display==='SHATTERED GLASS')return {id:'shattered-glass',file:asset('scenarios','shattered_glass.png'),layers:'road'};
  if(title==='THE DITCH BACKPACK'||display==='THE DITCH')return {id:'ditch-backpack',file:asset('scenarios','abandoned_backpack.png'),layers:'regional'};
  if(title==='BROKEN RADIO'||display==='BROKEN RADIO')return {id:'station-nine-radio',file:asset('scenarios','station_nine_discovery.png'),layers:'regional'};
  return null;
 }
 const oldModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const m=oldModel.apply(this,args),spec=presentation();
  if(spec&&m.active){m.art=spec.file;m.regionalSky=null;}
  return m;
 };
 const css=document.createElement('style');
 css.id='r127-demo-art-batch-20261112';
 css.textContent=`
 .gfx-art.r127-demo-art{position:relative;isolation:isolate;overflow:hidden;background:#1b2530!important}
 .gfx-art.r127-demo-art>.r127-demo-sky,
 .gfx-art.r127-demo-art>.r127-demo-road{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
 .gfx-art.r127-demo-art>.r127-demo-sky{z-index:0;background-size:cover;background-position:center}
 .gfx-art.r127-demo-art>.r127-demo-road{z-index:1;object-fit:fill}
 .gfx-art.r127-demo-art>.gfx-image{position:relative;z-index:2;width:100%;height:100%;object-fit:contain;object-position:center;background:transparent!important}
 .gfx-art.r127-demo-art>.gfx-art-caption{position:relative;z-index:9}
 .gfx-art.r127-demo-art[data-demo-period="dawn"]>.gfx-image,
 .gfx-art.r127-demo-art[data-demo-period="dawn"]>.r127-demo-road{filter:brightness(.92) saturate(.91) sepia(.13)}
 .gfx-art.r127-demo-art[data-demo-period="dusk"]>.gfx-image,
 .gfx-art.r127-demo-art[data-demo-period="dusk"]>.r127-demo-road{filter:brightness(.83) saturate(.88) sepia(.18)}
 .gfx-art.r127-demo-art[data-demo-period="night"]>.gfx-image,
 .gfx-art.r127-demo-art[data-demo-period="night"]>.r127-demo-road{filter:brightness(.62) saturate(.68) sepia(.12) hue-rotate(165deg)}
 .gfx-art.r127-demo-art[data-demo-id="ridgeline"]>.gfx-image,
 .gfx-art.r127-demo-art[data-demo-id="armory"]>.gfx-image{object-fit:cover}
 .gfx-art.r127-demo-art[data-demo-id="solace-guard"]>.gfx-image{object-fit:cover}
 /* Give layered encounter artwork breathing room, preserving complete scenes and combat sprites. */
 .gfx-art.r127-demo-art[data-demo-layers="regional"]>.gfx-image,
 .gfx-art.r127-demo-art[data-demo-layers="road"]>.gfx-image,
 .gfx-art.r127-demo-art[data-demo-layers="sky"]>.gfx-image{
   object-fit:contain!important;
   object-position:center center!important;
   transform:scale(.90);
   transform-origin:center center;
 }

 .gfx-art.r127-demo-art>.r127-demo-guard{position:absolute;z-index:6;left:50%;top:50%;transform:translate(-50%,-50%);width:54%;height:82%;object-fit:contain;object-position:center;pointer-events:none;filter:drop-shadow(4px 6px 5px #000a)}
 .gfx-art.r127-demo-art[data-demo-period="night"]>.r127-demo-guard{filter:brightness(.65) saturate(.7) hue-rotate(165deg) drop-shadow(4px 6px 5px #000a)}
 /* Guard desktop/phone positions come from the Combat Visual Testing layout manifest. */
 `;
 document.head.append(css);
 const oldSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=oldSync.apply(this,args);
  try{
   const e=this.element;if(!e?.figure)return result;
   const fig=e.figure,spec=presentation();
   const active=!!spec&&!e.frame.hidden&&!fig.hidden&&this.preference()==='graphics';
   let skyLayer=fig.querySelector(':scope > .r127-demo-sky'),roadLayer=fig.querySelector(':scope > .r127-demo-road'),guardLayer=fig.querySelector(':scope > .r127-demo-guard');
   fig.classList.toggle('r127-demo-art',active);
   if(!active){
    skyLayer?.remove();roadLayer?.remove();guardLayer?.remove();
    delete fig.dataset.demoId;delete fig.dataset.demoPeriod;delete fig.dataset.demoLayers;
    return result;
   }
   fig.dataset.demoId=spec.id;
   fig.dataset.demoLayers=spec.layers;
   const lit=spec.layers!=='none';
   const phase=period();
   if(lit){
    if(!skyLayer){skyLayer=document.createElement('div');skyLayer.className='r127-demo-sky';skyLayer.setAttribute('aria-hidden','true');fig.insertBefore(skyLayer,e.img);}
    const name=phase==='dusk'?'sky_dawn.png':'sky_'+phase+'.png';
    if(skyLayer.dataset.file!==name){skyLayer.style.backgroundImage='url("'+sky(name)+'")';skyLayer.dataset.file=name;}
    skyLayer.style.filter=phase==='dusk'?'sepia(.42) hue-rotate(-18deg) saturate(1.4)':'';
   }else skyLayer?.remove();
   if(spec.layers==='road'||spec.layers==='regional'){
    if(!roadLayer){roadLayer=document.createElement('img');roadLayer.className='r127-demo-road';roadLayer.alt='';roadLayer.draggable=false;roadLayer.setAttribute('aria-hidden','true');fig.insertBefore(roadLayer,e.img);}
      if(spec.layers==='regional'){
     const area=typeof route127CurrentRegion==='function'?route127CurrentRegion(lanternState()):'CENTRAL';
     const layers=globalThis.Route127EditorSky?.describe(area,player?.flags?.worldHour);
     const selected=layers?.ground||sky((area||'CENTRAL').toLowerCase()+'.png');
     if(roadLayer.src!==selected)roadLayer.src=selected;
     if(layers?.sky)skyLayer.style.backgroundImage='url("'+layers.sky+'")';
   }else{const selected=sky('dirt_road_foreground.png');if(roadLayer.src!==selected)roadLayer.src=selected;}
   }else roadLayer?.remove();
   if(spec.guard){
    if(!guardLayer){guardLayer=document.createElement('img');guardLayer.className='r127-demo-guard';guardLayer.alt='Solace gate guard';guardLayer.draggable=false;guardLayer.src=asset('enemies','solace_gate_guard.png');fig.append(guardLayer);}
   }else guardLayer?.remove();
   // The overlay isn't one of the generic .r127-human-unit sprites, so apply the
   // same saved/published Combat Visual Testing positions directly to the guard.
   if(spec.guard&&guardLayer){
    const layout=globalThis.Route127CombatLayouts?.get('scripted:gateguards','combat',
      typeof matchMedia==='function'&&matchMedia('(max-width:600px)').matches?'phone':'desktop')?.['0:solace_gate_guard.png'];
    if(layout){
     guardLayer.style.left=layout.x+'%';
     guardLayer.style.top=layout.y+'%';
     guardLayer.style.width=layout.width+'%';
     guardLayer.style.height=layout.height+'%';
     guardLayer.style.transform='translate(-50%,-50%) scale('+(layout.flip?-layout.scale:layout.scale)+','+layout.scale+')';
     guardLayer.style.zIndex=String(Math.max(4,layout.z+3));
    }
   }
   fig.dataset.demoPeriod=lit?phase:'none';
  }catch(err){console.warn('DEVTEST demo encounter artwork:',err);}
  return result;
 };
 globalThis.Route127DemoArtBatch=Object.freeze({ids:['ridgeline','shed','solace-guard','road-enforcer','armory','garden','corvette','shattered-glass','station-nine-radio','crazy-steve','the-yardman','the-road-reapers','the-limping-hound','old-pete','delivery-truck','traveler-vale','sprained-runner','last-patrol']});
})();