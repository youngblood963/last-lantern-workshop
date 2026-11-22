/* DEVTEST ONLY — owner-approved final encounter artwork, with the real world sky.
 * Visual only. Never alters random encounter eligibility, quests, saves, damage or combat actions. */
(() => {
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
 const root=new URL('../devtest/',document.baseURI);
 const regionRoot=new URL('../assets/regions/',root);
 const file=(dir,name)=>new URL('assets/'+dir+'/'+name,root).href;
 const regional=name=>new URL(name,regionRoot).href;
 const phases=new Set(['combat','combatItems']);
 const aliases={
  'THE BURIED FREIGHT':'freight',
  'HARBOR SECURITY DRONE':'harbor',
  'FLOODLIGHT SWEEP':'floodlight',
  'DOCKSIDE PIRATES':'pirates',
  'SEAWALL SNIPER':'sniper','TACTICAL SNIPER':'sniper',
  'CARGO HIJACKERS':'crabTrap','THE CRAB TRAP':'crabTrap',
  'SCRAP CRAB NEST':'crabNest'
 };
 const artwork={
  freight:{file:'buried_freight.png',scenery:true},
  harbor:{files:['harbour_security_drone.png']},
  floodlight:{files:['floodlight_drone_active.gif']},
  pirates:{files:['dockside_pirate_1.png','dockside_pirate_2.png','dockside_pirate_3.png']},
  sniper:{files:['tactical_sniper.png']},
  crabTrap:{files:['crab_trap.png']},
  crabNest:{files:['scrap_crab_nest.png']}
 };
 const clean=v=>String(v||'').toUpperCase().replace(/^EAST ROAD — /,'').trim();
 const ruralByTitle=new Map([
  ['THE COIN WELL',{scene:'the_coin_well.png'}],
  ['RATS IN THE PANTRY',{scene:'rats_in_the_pantry.png',units(combat){return combat?Array(3).fill(0).map((_,index)=>({name:'pantry_rat.png',index,hp:true})):[];}}],
  ['DUST OVER THE SCHOOLYARD',{scene:'dust_over_the_schoolyard.png',units(combat){
   if(combat?.name==='SCHOOLYARD BUCK')return [{name:'territorial_buck.png',index:0,hp:true}];
   if(combat?.name==='SCHOOLYARD DEER')return [{name:'schoolyard_deer.png',index:0,hp:true}];
   return [];
  }}],
  ['CORNFIELD STALKERS',{scene:'cornfield_stalkers_scene.png',units(){return [
   {name:'cornfield_stalker_1.png',index:0,hp:true},{name:'cornfield_stalker_2.png',index:1,hp:true}
  ];}}],
  ['THE DARK CELLAR',{scene:'dark_cellar_scene.png'}],
  ['THE SAGGING FARMHOUSE',{scene:'the_sagging_farmhouse.png'}],
  ['THE WHEELBARROW',{composition:'regional',units(combat){return [
   {name:'the_wheelbarrow.png',dir:'scenarios',index:0,hp:false},
   ...(combat?.r18Wheelbarrow?[{name:'wheelbarrow_snake.gif',index:1,combatIndex:0,hp:true}]:[])
  ];}}],
  ['TERRITORIAL FARMERS',{composition:'regional',units(){return [
   {name:'territorial_farmer_1.png',index:0,hp:true},{name:'territorial_farmer_2.png',index:1,hp:true}
  ];}}],
  ['FERAL BULL',{composition:'regional',units(){return [{name:'feral_bull.png',index:0,hp:true}];}}],
  ['WARD OF THE FORGOTTEN',{scene:'st_mercy_hospital.png',dir:'locations',composition:'none'}]
 ]);
 const ruralById=new Map([
  ['early:7','THE DARK CELLAR'],['early:40','THE WHEELBARROW'],['early:42','THE COIN WELL'],
  ['early:47','RATS IN THE PANTRY'],['early:63','THE SAGGING FARMHOUSE'],['early:65','DUST OVER THE SCHOOLYARD'],
  ['early:166','CORNFIELD STALKERS'],['early:167','TERRITORIAL FARMERS'],['early:168','FERAL BULL'],
  ['east:81','WARD OF THE FORGOTTEN']
 ]);
 function ruralSelection(){
  if(typeof stage==='undefined'||!(stage==='encounter'||phases.has(stage)))return null;
  const combat=typeof combatState!=='undefined'?combatState:null;
  if(phases.has(stage)&&combat?.source!=='encounter')return null;
  const active=globalThis.Route127CombatLayouts?.activeScene();
  const encounter=typeof currentEncounter==='function'?currentEncounter():null;
  const title=ruralById.get(active?.id)||clean(encounter?.title||combat?.name);
  const spec=ruralByTitle.get(title);
  return spec?{title,spec,combat:phases.has(stage)?combat:null,active}:null;
 }
 function selection(){
  if(typeof stage==='undefined'||!(stage==='encounter'||phases.has(stage)))return null;
  const encounter=typeof currentEncounter==='function'?currentEncounter():null;
  const combat=typeof combatState!=='undefined'?combatState:null;
  if(phases.has(stage)&&combat?.source!=='encounter')return null;
  const rural=ruralSelection();
  if(rural)return {type:'rural',...rural,region:typeof route127CurrentRegion==='function'?
   route127CurrentRegion(typeof lanternState==='function'?lanternState():null):'EAST'};
  const type=aliases[clean(encounter?.title)]||aliases[clean(encounter?.displayName)]||
   (phases.has(stage)?combat?.wo3Drone?'floodlight':combat?.wo4Sniper?'sniper':
    aliases[clean(combat?.name)]:null);
  if(!type)return null;
  // These are original road encounters. Never show art from an unrelated fight.
  if(stage==='encounter'&&!encounter)return null;
  return {type,combat:phases.has(stage)?combat:null,region:typeof route127CurrentRegion==='function'?
   route127CurrentRegion(typeof lanternState==='function'?lanternState():null):'SEAPORT'};
 }
 const northernSkyScenes=new Map([
  ['east:5','the_collapsed_dam.png'],['east:72','the_lost_convoy.png'],['east:15','the_chain_bridge.gif']
 ]);
 function northArtwork(){
  const scene=globalThis.Route127CombatLayouts?.activeScene();
  if(!scene)return null;
  const combat=phases.has(stage)?combatState:null;
  const scenery=(name,dir='scenarios')=>({name,dir,scenery:true});
  const sprite=(name,index=0,dir='enemies')=>({name,dir,index});
  const rural=ruralSelection();
  if(rural){
   const {spec}=rural;
   const files=typeof spec.units==='function'?spec.units(combat):[];
   return [...(spec.scene&&spec.dir!=='locations'?[scenery(spec.scene,spec.dir||'scenarios')]:[]),
    ...files.map(asset=>({name:asset.name,index:asset.index||0,dir:asset.dir||'enemies',hp:asset.hp,scenery:false}))];
  }
  switch(scene.id){
   case 'early:55':return combat?null:[scenery('cold_road_camp.png'),
    ...(r18CampVariant()?[sprite('cold_road_camp_traveler.png',0,'scenarios')]:[])];
   case 'early:29':return [scenery('salt_on_the_road.png'),
    ...(combat?.name==='CHAIR MAN'?[sprite('chair_man.png')]:[])];
   case 'east:74':return combat?null:[scenery('collapsing_lookout.png')];
   case 'early:140':return [sprite('mountain_poacher_rifleman.png'),sprite('mountain_poacher_trapper.png',1)];
   case 'early:141':return [sprite('territorial_survivalist_rifleman.png'),sprite('territorial_survivalist_shotgun.png',1)];
   case 'early:142':return [sprite('mountain_lion.png')];
   case 'east:75':return [sprite('wild_bear.png')];
   case 'east:23':return [scenery('the_cinder_wolves.png','enemies')];
   case 'east:40':return combat?null:r18HorseScene().phase==='offer'?
    [sprite('dust_horse_brown.png',0,'scenarios')]:[scenery('the_dust_horses.png')];
   case 'east:5':return combat?null:[scenery('the_collapsed_dam.png')];
   case 'east:72':return combat?null:[scenery('the_lost_convoy.png')];
   case 'east:15':return combat?null:[scenery('the_chain_bridge.gif')];
   case 'east:22':return [scenery('salt_miners.png'),...(combat?.r18MarlowGuards?
    [sprite('saltmaster.png'),sprite('salt_overseer.png',1)]:
    !combat&&player.flags.marlowRescuePending?[sprite('marlow_vance.png',0,'scenarios')]:[])];
   case 'east:12':{
    if(!combat?.r18ChainGang)return [scenery('the_quarry_lift.png')];
    const files={'HOOKMAN':'quarry_hookman.png','CHAIN SWINGER':'quarry_chain_swinger.png','STRANGLER':'quarry_strangler.png'};
    return [scenery(combat.enemies.some(e=>e.name==='CHAIN SWINGER')?'the_quarry_lift.png':'the_quarry_lift_no_beam.png'),
     ...combat.enemies.map((enemy,index)=>sprite(files[enemy.name],index))];
   }
   default:return null;
  }
 }
 function period(){return typeof Route127RegionalSky?.phase==='function'?
  Route127RegionalSky.phase(player?.flags?.worldHour):'day';}
 function skyName(){const p=period();return 'sky_'+(p==='dusk'?'dawn':p)+'.png';}
 const previousModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const model=previousModel.apply(this,args),target=selection();
  if(!model?.active)return model;
  const active=globalThis.Route127CombatLayouts?.activeScene();
  const north=active?.phase==='approach'&&northernSkyScenes.get(active.id);
  if(north){
   const sky=regional(skyName()),art=file('scenarios',north);
   if([sky,art].map(url=>this.sceneArtworkReady(url)).every(Boolean)){
    model.art=sky;model.regionalSky=null;model.causewayBacking=false;
    model.scenarioBackdrop={art:sky,mode:'sky'};
   }
   return model;
  }
  if(target?.type==='rural'){
   const spec=target.spec;
   // Sprite-only rural encounters (including Feral Bull) must use the regional
   // terrain + sky, not inherit a sky-only backdrop from another renderer.
   if(spec.composition==='regional'){
    const region=target.region;
    const scene=globalThis.Route127EditorSky?.describe(region,player?.flags?.worldHour);
    if(scene&&[scene.ground,scene.sky].map(url=>this.sceneArtworkReady(url)).every(Boolean)){
     model.art=scene.ground;
     model.regionalSky={region,period:period(),sky:skyName()};
     model.scenarioBackdrop=null;
     model.causewayBacking=false;
    }
   }else if(spec.scene&&spec.composition==='sky'){
    const sky=regional(skyName()),art=file(spec.dir||'scenarios',spec.scene);
    if([sky,art].map(url=>this.sceneArtworkReady(url)).every(Boolean)){
     model.art=sky;model.regionalSky=null;model.causewayBacking=false;
     model.scenarioBackdrop={art:sky,mode:'sky'};
    }
   }else if(spec.scene&&spec.dir==='locations'){
    const art=file('locations',spec.scene);
    if(this.sceneArtworkReady(art)){
     model.art=art;model.regionalSky=null;model.causewayBacking=false;
    }
   }
   return model;
  }
  if(!target)return model;
  if(target.type==='freight'){
   // Buried freight is a scenery cutout over the shared sky AND dirt-road patch.
   const sky=regional(skyName());
   const dependencies=[sky,regional('dirt_road_foreground.png'),file('scenarios',artwork.freight.file)];
   if(dependencies.map(url=>this.sceneArtworkReady(url)).every(Boolean)){
    model.art=sky;model.regionalSky=null;model.causewayBacking=false;
    model.scenarioBackdrop={art:sky,mode:'road'};
   }
  }else{
   // Reuse the exact road-region composite used by normal gameplay.
   const region=['CENTRAL','INDUSTRIAL','NORTH','EAST','WEST','LOWLANDS','SEAPORT','CAUSEWAY'].includes(target.region)?target.region:'SEAPORT';
   const scene=globalThis.Route127EditorSky?.describe(region,player?.flags?.worldHour);
   if(scene){
    if(![scene.ground,scene.sky].map(url=>this.sceneArtworkReady(url)).every(Boolean))return model;
    model.art=scene.ground;model.regionalSky={region,period:period(),sky:skyName()};
   }
   model.causewayBacking=false;
  }
  return model;
 };
 const style=document.createElement('style');
 style.id='r127-final-encounter-art-style';
 style.textContent=`
  .gfx-art.r127-final-encounter{position:relative;isolation:isolate;overflow:hidden}
  .gfx-art.r127-final-encounter>.gfx-image{position:relative;z-index:1;object-fit:cover;background:transparent!important}
  .gfx-art.r127-final-cinematic>.gfx-image{position:relative;z-index:0;object-fit:cover;background:transparent!important}
  .gfx-art.r127-final-cinematic>.r127-final-sprites .r127-final-unit.r127-final-freight{z-index:1;left:50%;width:94%;height:92%;bottom:0;pointer-events:none}
  .gfx-art.r127-final-cinematic>.r127-final-sprites .r127-final-unit.r127-final-freight>img{height:100%;object-fit:contain;object-position:center}
  .gfx-art.r127-final-cinematic[data-r127-final-period="night"]>.r127-final-sprites .r127-final-freight>img{filter:brightness(.62) saturate(.68) sepia(.12) hue-rotate(165deg)}
  .gfx-art.r127-final-cinematic[data-r127-final-period="dusk"]>.r127-final-sprites .r127-final-freight>img{filter:brightness(.83) saturate(.88) sepia(.18)}
  .gfx-art.r127-final-cinematic[data-r127-final-period="dawn"]>.r127-final-sprites .r127-final-freight>img{filter:brightness(.92) saturate(.91) sepia(.13)}
  .gfx-art.r127-final-encounter>.r127-final-road{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;z-index:2;pointer-events:none}
  .gfx-art:is(.r127-final-encounter,.r127-north-art)>.r127-final-sprites{position:absolute;inset:0;z-index:5;pointer-events:none}
  .gfx-art:is(.r127-final-encounter,.r127-north-art)>.r127-final-sprites .r127-final-unit{position:absolute;bottom:3%;transform:translateX(-50%);height:85%;width:40%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;pointer-events:auto}
  .gfx-art:is(.r127-final-encounter,.r127-north-art)>.r127-final-sprites .r127-final-unit>img{width:100%;height:calc(100% - 22px);object-fit:contain;object-position:center bottom;filter:drop-shadow(3px 6px 5px #000a)}
  .gfx-art:is(.r127-final-encounter,.r127-north-art)>.r127-final-sprites .r127-final-unit.r127-final-freight{left:50%;width:94%;height:92%;bottom:0;pointer-events:none}
  .gfx-art:is(.r127-final-encounter,.r127-north-art)>.r127-final-sprites .r127-final-unit.r127-final-freight>img{height:100%;object-fit:contain}
  .gfx-art:is(.r127-final-encounter,.r127-north-art)>.r127-final-sprites .r127-final-hp{font:700 clamp(10px,1.2vw,14px)/1 sans-serif;color:#fff5ef;background:#36140ff0;border:1px solid #d84b39;border-radius:3px;padding:3px 5px;margin-bottom:3px;white-space:nowrap;min-width:45px;text-align:center}
  .gfx-art.r127-final-encounter>.gfx-art-caption{position:relative;z-index:10}
  .gfx-art:is(.r127-final-encounter,.r127-north-art)[data-r127-final-period="night"]>.r127-final-sprites img{filter:brightness(.66) saturate(.72) drop-shadow(3px 6px 5px #000a)}
  .gfx-art:is(.r127-final-encounter,.r127-north-art)[data-r127-final-period="dusk"]>.r127-final-sprites img{filter:brightness(.82) saturate(.85) drop-shadow(3px 6px 5px #000a)}
  .gfx-art.r127-north-art>.r127-final-sprites .r127-final-unit[data-pair='true']{left:30%;width:34%}
  .gfx-art.r127-north-art>.r127-final-sprites .r127-final-unit[data-pair='true'][data-index='1']{left:70%}
  .gfx-art.r127-north-art>.r127-final-sprites .r127-final-unit:not(.r127-final-freight){z-index:2}
  .gfx-art.r127-north-art>.r127-final-sprites .r127-final-unit[data-pair='false']:not(.r127-final-freight){left:50%}
  .gfx-art.r127-north-art>.gfx-art-caption{z-index:10}
  @media(max-width:600px){.gfx-art:is(.r127-final-encounter,.r127-north-art)>.r127-final-sprites .r127-final-unit{height:79%;width:42%}.gfx-art:is(.r127-final-encounter,.r127-north-art)>.r127-final-sprites .r127-final-unit.r127-final-freight{height:90%;width:98%}}
 `;
 document.head.append(style);
 // Shipwreck Scavengers and Toxic Cargo are complete cinematic paintings, NOT separate sprites.
 // Keep its entire width visible, filling any letterboxing with time-of-day sky.
 const shipwreckStyle=document.createElement('style');
 shipwreckStyle.id='r127-full-cinematic-scene-fit';
 shipwreckStyle.textContent=`
  .gfx-art.r127-shipwreck-full{position:relative;isolation:isolate;overflow:hidden}
  .gfx-art.r127-shipwreck-full>.r127-shipwreck-sky{position:absolute;inset:0;z-index:0;background-position:center;background-size:cover;pointer-events:none}
  .gfx-frame .gfx-art.r127-shipwreck-full>.gfx-image:is([src*="shipwreck_scavengers.png"],[src*="toxic_cargo.png"]){
   position:relative;z-index:1;display:block;width:100%!important;height:100%!important;
   object-fit:contain!important;object-position:center center!important;background:transparent!important;
   transform:none!important;max-width:100%!important;max-height:100%!important;
  }
  .gfx-art.r127-shipwreck-full>.gfx-art-caption{position:relative;z-index:9}
 `;
 document.head.append(shipwreckStyle);
 const priorSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=priorSync.apply(this,args);
  try{
   const e=this.element;if(!e?.figure)return result;
   const wreckActive=!e.frame.hidden&&this.preference()==='graphics'&&
    /(?:shipwreck_scavengers|toxic_cargo)\.png(?:[?#]|$)/i.test(e.img?.src||'');
   e.figure.classList.toggle('r127-shipwreck-full',wreckActive);
   let wreckSky=e.figure.querySelector(':scope > .r127-shipwreck-sky');
   if(wreckActive){
    if(!wreckSky){
     wreckSky=document.createElement('div');wreckSky.className='r127-shipwreck-sky';
     wreckSky.setAttribute('aria-hidden','true');e.figure.insertBefore(wreckSky,e.img);
    }
    wreckSky.style.backgroundImage='url("'+regional(skyName())+'")';
   }else wreckSky?.remove();
   let target=selection(),north=northArtwork();
   const drawsSky=this.displaysArtwork(regional(skyName()));
   const active=globalThis.Route127CombatLayouts?.activeScene();
   if(northernSkyScenes.has(active?.id)&&!drawsSky)north=null;
   if(target?.type==='freight'&&!drawsSky)target=null;
   const on=!!(target||north)&&!e.frame.hidden&&this.preference()==='graphics';
   const figure=e.figure;
   figure.classList.toggle('r127-final-encounter',on&&!!target);
   figure.classList.toggle('r127-north-art',on&&!!north);
   figure.classList.toggle('r127-final-cinematic',on&&target?.type==='rural'&&!!target.spec.scene&&target.spec.composition==='sky');
   let layer=figure.querySelector(':scope > .r127-final-sprites');
   let road=figure.querySelector(':scope > .r127-final-road');
   if(!on){layer?.remove();road?.remove();delete figure.dataset.r127FinalPeriod;return result;}
   figure.dataset.r127FinalPeriod=period();
   if(target?.type==='freight'){
    if(!road){road=document.createElement('img');road.className='r127-final-road';road.alt='';road.setAttribute('aria-hidden','true');figure.insertBefore(road,e.img.nextSibling);}
    const src=regional('dirt_road_foreground.png');if(road.src!==src)road.src=src;
   }else road?.remove();
   const art=artwork[target?.type];
   const files=north||(art.scenery?[art.file]:target.type==='floodlight'&&target.combat?.wo3LightShot?
    ['floodlight_drone_destroyed.gif']:art.files).map((name,index)=>({
     name,index,dir:art.scenery?'scenarios':'enemies',scenery:art.scenery
    }));
   const identity=(target?.type||'north')+'|'+files.map(({name})=>name).join('|');
   if(!layer||layer.dataset.identity!==identity){
    layer?.remove();layer=document.createElement('div');layer.className='r127-final-sprites';layer.dataset.identity=identity;
    const spriteCount=files.filter(asset=>!asset.scenery).length;
    for(const asset of files){
     const {name,index=0,dir,scenery}=asset;
     const unit=document.createElement('div');unit.className='r127-final-unit'+(scenery?' r127-final-freight':'');
     const img=document.createElement('img');img.alt='';img.src=file(dir,name);
     img.onerror=()=>console.warn('DEVTEST scenario image failed to load:',name);
     const positions=files.length===3?[20,50,80]:[50];
     unit.dataset.index=String(index);
     if(asset.combatIndex!==undefined)unit.dataset.combatIndex=String(asset.combatIndex);
     if(north&&!scenery&&spriteCount>1){
      unit.style.left=((index+.5)*100/spriteCount)+'%';
      unit.style.width=(spriteCount===2?'34%':'30%');
     }else if(north)unit.dataset.pair='false';
     else unit.style.left=positions[index]+'%';
     if(target?.type==='rural'&&target.title==='CORNFIELD STALKERS'&&!scenery)unit.style.zIndex=index===0?'2':'3';
     if(!north&&files.length===3){unit.style.width='31%';unit.style.height='82%';}
     unit.append(img);
     if(!scenery&&asset.hp!==false){
      const hp=document.createElement('span');hp.className='r127-final-hp';hp.hidden=true;unit.prepend(hp);
     }
     layer.append(unit);
    }
    figure.append(layer);
   }
   const combat=north&&phases.has(stage)?combatState:target?.combat;
   const fighters=Array.isArray(combat?.enemies)?combat.enemies:null;
   [...layer.children].forEach(unit=>{
    const i=Number(unit.dataset.index);
    globalThis.Route127CombatLayouts?.applyOverlay(unit,i);
    const hp=unit.querySelector('.r127-final-hp');
    if(!hp)return;
    const combatIndex=Number(unit.dataset.combatIndex??i);
    const fighter=fighters?.[combatIndex]||(!fighters&&combatIndex===0?combat:null);
    const show=!!fighter;
    hp.hidden=!show;
    unit.hidden=!!combat&&(fighters?(!fighter||Number(fighter.hp)<=0):!!north&&Number(fighter?.hp)<=0);
    if(show){const current=Math.max(0,Number(fighter.hp)||0);hp.textContent=current+' HP';}
   });
  }catch(error){console.warn('DEVTEST final encounter art:',error);}
  return result;
 };
})();
