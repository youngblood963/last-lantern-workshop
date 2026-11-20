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
 function selection(){
  if(typeof stage==='undefined'||!(stage==='encounter'||phases.has(stage)))return null;
  const encounter=typeof currentEncounter==='function'?currentEncounter():null;
  const combat=typeof combatState!=='undefined'?combatState:null;
  if(phases.has(stage)&&combat?.source!=='encounter')return null;
  const type=aliases[clean(encounter?.title)]||aliases[clean(encounter?.displayName)]||
   (phases.has(stage)?combat?.wo3Drone?'floodlight':combat?.wo4Sniper?'sniper':
    aliases[clean(combat?.name)]:null);
  if(!type)return null;
  // These are original road encounters. Never show art from an unrelated fight.
  if(stage==='encounter'&&!encounter)return null;
  return {type,combat:phases.has(stage)?combat:null,region:typeof route127CurrentRegion==='function'?
   route127CurrentRegion(typeof lanternState==='function'?lanternState():null):'SEAPORT'};
 }
 function period(){return typeof Route127RegionalSky?.phase==='function'?
  Route127RegionalSky.phase(player?.flags?.worldHour):'day';}
 function skyName(){const p=period();return 'sky_'+(p==='dusk'?'dawn':p)+'.png';}
 const previousModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const model=previousModel.apply(this,args),target=selection();
  if(!target||!model?.active)return model;
  if(target.type==='freight'){
   // Buried freight is a scenery cutout over the shared sky AND dirt-road patch.
   model.art=regional(skyName());model.regionalSky=null;model.causewayBacking=false;
  }else{
   // Reuse the exact road-region composite used by normal gameplay.
   const region=['CENTRAL','INDUSTRIAL','NORTH','EAST','WEST','LOWLANDS','SEAPORT','CAUSEWAY'].includes(target.region)?target.region:'SEAPORT';
   const scene=globalThis.Route127EditorSky?.describe(region,player?.flags?.worldHour);
   if(scene){
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
  .gfx-art.r127-final-encounter>.r127-final-road{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;z-index:2;pointer-events:none}
  .gfx-art.r127-final-encounter>.r127-final-sprites{position:absolute;inset:0;z-index:5;pointer-events:none}
  .gfx-art.r127-final-encounter>.r127-final-sprites .r127-final-unit{position:absolute;bottom:3%;transform:translateX(-50%);height:85%;width:40%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;pointer-events:auto}
  .gfx-art.r127-final-encounter>.r127-final-sprites .r127-final-unit>img{width:100%;height:calc(100% - 22px);object-fit:contain;object-position:center bottom;filter:drop-shadow(3px 6px 5px #000a)}
  .gfx-art.r127-final-encounter>.r127-final-sprites .r127-final-unit.r127-final-freight{left:50%;width:94%;height:92%;bottom:0;pointer-events:none}
  .gfx-art.r127-final-encounter>.r127-final-sprites .r127-final-unit.r127-final-freight>img{height:100%;object-fit:contain}
  .gfx-art.r127-final-encounter>.r127-final-sprites .r127-final-hp{font:700 clamp(10px,1.2vw,14px)/1 sans-serif;color:#fff5ef;background:#36140ff0;border:1px solid #d84b39;border-radius:3px;padding:3px 5px;margin-bottom:3px;white-space:nowrap;min-width:45px;text-align:center}
  .gfx-art.r127-final-encounter>.gfx-art-caption{position:relative;z-index:10}
  .gfx-art.r127-final-encounter[data-r127-final-period="night"]>.r127-final-sprites img{filter:brightness(.66) saturate(.72) drop-shadow(3px 6px 5px #000a)}
  .gfx-art.r127-final-encounter[data-r127-final-period="dusk"]>.r127-final-sprites img{filter:brightness(.82) saturate(.85) drop-shadow(3px 6px 5px #000a)}
  @media(max-width:600px){.gfx-art.r127-final-encounter>.r127-final-sprites .r127-final-unit{height:79%;width:42%}.gfx-art.r127-final-encounter>.r127-final-sprites .r127-final-unit.r127-final-freight{height:90%;width:98%}}
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
   const target=selection(),on=!!target&&!e.frame.hidden&&this.preference()==='graphics';
   const figure=e.figure;
   figure.classList.toggle('r127-final-encounter',on);
   let layer=figure.querySelector(':scope > .r127-final-sprites');
   let road=figure.querySelector(':scope > .r127-final-road');
   if(!on){layer?.remove();road?.remove();delete figure.dataset.r127FinalPeriod;return result;}
   figure.dataset.r127FinalPeriod=period();
   if(target.type==='freight'){
    if(!road){road=document.createElement('img');road.className='r127-final-road';road.alt='';road.setAttribute('aria-hidden','true');figure.insertBefore(road,e.img.nextSibling);}
    const src=regional('dirt_road_foreground.png');if(road.src!==src)road.src=src;
   }else road?.remove();
   const art=artwork[target.type];
   const files=art.scenery?[art.file]:target.type==='floodlight'&&target.combat?.wo3LightShot?
    ['floodlight_drone_destroyed.gif']:art.files;
   const identity=target.type+'|'+files.join('|');
   if(!layer||layer.dataset.identity!==identity){
    layer?.remove();layer=document.createElement('div');layer.className='r127-final-sprites';layer.dataset.identity=identity;
    for(const [index,name] of files.entries()){
     const unit=document.createElement('div');unit.className='r127-final-unit'+(art.scenery?' r127-final-freight':'');
     const img=document.createElement('img');img.alt='';img.src=file(art.scenery?'scenarios':'enemies',name);
     img.onerror=()=>console.warn('DEVTEST scenario image failed to load:',name);
     const positions=files.length===3?[20,50,80]:[50];
     unit.dataset.index=String(index);
     unit.style.left=positions[index]+'%';
     if(files.length===3){unit.style.width='31%';unit.style.height='82%';}
     unit.append(img);
     if(!art.scenery){
      const hp=document.createElement('span');hp.className='r127-final-hp';hp.hidden=true;unit.prepend(hp);
     }
     layer.append(unit);
    }
    figure.append(layer);
   }
   const fighters=Array.isArray(target.combat?.enemies)?target.combat.enemies:null;
   [...layer.children].forEach((unit,i)=>{
    globalThis.Route127CombatLayouts?.applyOverlay(unit,i);
    const hp=unit.querySelector('.r127-final-hp');
    if(!hp)return;
    const fighter=fighters?.[i]||(!fighters&&i===0?target.combat:null);
    const show=!!fighter;
    hp.hidden=!show;
    unit.hidden=!!target.combat&&!!fighters&&(!fighter||Number(fighter.hp)<=0);
    if(show){const current=Math.max(0,Number(fighter.hp)||0);hp.textContent=current+' HP';}
   });
  }catch(error){console.warn('DEVTEST final encounter art:',error);}
  return result;
 };
})();