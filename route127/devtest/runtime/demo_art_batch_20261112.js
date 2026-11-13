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
 const discoveredRabbit=()=>!!(player?.flags?.r18RabbitSeen||player?.flags?.r18RabbitReleased||player?.flags?.r18RabbitAdopted);
 function presentation(){
  if(guard())return {id:'solace-guard',file:asset('locations','solace_town_gate.png'),layers:'none',guard:true};
  if(enforcer())return {id:'road-enforcer',file:asset('scenarios','the_road_enforcer.png'),layers:'road'};
  if(stage!=='encounter')return null;
  const title=norm(encounter()?.title),display=norm(encounter()?.displayName);
  if(title==='RIDGELINE'||display==='RIDGELINE')return {id:'ridgeline',file:asset('scenarios','ridgeline.gif'),layers:'none'};
  if(title==='SCRATCHING IN THE SHED'||display==='SCRATCHING IN THE SHED')return {id:'shed',file:asset('scenarios',discoveredRabbit()?'scratching_in_the_shed_rabbit.gif':'scratching_in_the_shed_empty.gif'),layers:'road'};
  if(title==='THE DRY FOUNTAIN'||display==='THE ROAD ENFORCER')return {id:'road-enforcer',file:asset('scenarios','the_road_enforcer.png'),layers:'road'};
  if(title==='THE EMPTY ARMORY'||display==='THE EMPTY ARMORY')return {id:'armory',file:asset('scenarios','the_empty_armory.png'),layers:'none'};
  if(title==='IRRADIATED ROACHES'||display==='THE FORGOTTEN GARDEN')return {id:'garden',file:asset('scenarios','the_forgotten_garden.png'),layers:'sky'};
  if(title==="MURPHY'S LOST CORVETTE"||display==="MURPHY'S LOST CORVETTE")return {id:'corvette',file:asset('scenarios','murphys_lost_corvette.png'),layers:'road'};
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
 .gfx-art.r127-demo-art>.r127-demo-guard{position:absolute;z-index:6;left:50%;bottom:0;transform:translateX(-50%);width:auto;max-width:62%;height:90%;object-fit:contain;object-position:center bottom;pointer-events:none;filter:drop-shadow(4px 6px 5px #000a)}
 .gfx-art.r127-demo-art[data-demo-period="night"]>.r127-demo-guard{filter:brightness(.65) saturate(.7) hue-rotate(165deg) drop-shadow(4px 6px 5px #000a)}
 @media(max-width:600px){.gfx-art.r127-demo-art>.r127-demo-guard{height:90%;max-width:72%}}
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
    delete fig.dataset.demoId;delete fig.dataset.demoPeriod;
    return result;
   }
   fig.dataset.demoId=spec.id;
   const lit=spec.layers!=='none';
   const phase=period();
   if(lit){
    if(!skyLayer){skyLayer=document.createElement('div');skyLayer.className='r127-demo-sky';skyLayer.setAttribute('aria-hidden','true');fig.insertBefore(skyLayer,e.img);}
    const name=phase==='dusk'?'sky_dawn.png':'sky_'+phase+'.png';
    if(skyLayer.dataset.file!==name){skyLayer.style.backgroundImage='url("'+sky(name)+'")';skyLayer.dataset.file=name;}
    skyLayer.style.filter=phase==='dusk'?'sepia(.42) hue-rotate(-18deg) saturate(1.4)':'';
   }else skyLayer?.remove();
   if(spec.layers==='road'){
    if(!roadLayer){roadLayer=document.createElement('img');roadLayer.className='r127-demo-road';roadLayer.alt='';roadLayer.draggable=false;roadLayer.setAttribute('aria-hidden','true');roadLayer.src=sky('dirt_road_foreground.png');fig.insertBefore(roadLayer,e.img);}
   }else roadLayer?.remove();
   if(spec.guard){
    if(!guardLayer){guardLayer=document.createElement('img');guardLayer.className='r127-demo-guard';guardLayer.alt='Solace gate guard';guardLayer.draggable=false;guardLayer.src=asset('enemies','solace_gate_guard.png');fig.append(guardLayer);}
   }else guardLayer?.remove();
   fig.dataset.demoPeriod=lit?phase:'none';
  }catch(err){console.warn('DEVTEST demo encounter artwork:',err);}
  return result;
 };
 globalThis.Route127DemoArtBatch=Object.freeze({ids:['ridgeline','shed','solace-guard','road-enforcer','armory','garden','corvette']});
})();