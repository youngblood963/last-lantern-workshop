/* DEVTEST only — Empty Bus Shelter: four scene paintings keyed to world time.
   No regional sky cutouts, new clock, or change to the underlying encounter odds. */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||typeof GraphicalUI==='undefined')return;
 const title='THE EMPTY BUS SHELTER';
 const assetBase=new URL('../devtest/assets/scenarios/',document.baseURI);
 const asset=period=>new URL('empty_bus_shelter_'+period+'.png',assetBase).href;
 const phase=hour=>typeof Route127RegionalSky?.phase==='function'
   ?Route127RegionalSky.phase(hour)
   :(()=>{const h=((Number(hour??8)%24)+24)%24;return h>=5&&h<7?'dawn':h>=7&&h<18?'day':h>=18&&h<20?'dusk':'night';})();
 const active=()=>typeof stage!=='undefined'&&stage==='encounter'
   &&typeof currentEncounter==='function'&&currentEncounter()?.title===title;
 // Model overrides just the dedicated narrative painting, never a regional road image.
 const previousModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const model=previousModel.apply(this,args);
  if(active()&&model.active){
   const period=phase(typeof player!=='undefined'?player.flags?.worldHour:8);
   model.art=asset(period);
   model.title=title;
   model.regionalSky=null;
  }
  return model;
 };
 // Register via the existing registry, not by rewriting its authored actions.
 const entry=RoadScenarioRegistry?.entries?.find(row=>row.encounter?.title===title);
 if(!entry){console.warn('Empty Bus Shelter: scenario not found; rewards unchanged.');return;}
 const encounter=entry.encounter,original=encounter.resolve;
 const visits=()=>typeof lanternState==='function'?lanternState()?.sceneId:null;
 encounter.resolve=function(cmd){
  const oldFlag=!!player.flags.r18BusStopTalk;
  const ok=original.call(this,cmd);
  if(!ok)return ok;
  // Only a genuine conversation grants Grandma's returning-visitor kindness.
  // Once per scene; cannot repeatedly farm by clicking dialogue in the same encounter.
  const key=visits()||[day,dailyRoadTurns,roadGoal,roadTurn].join(':');
  const conversation=['sit and talk','say the buses are gone'].includes(String(cmd).toLowerCase());
  if(conversation&&oldFlag&&player.flags.r18BusStopClothScene!==key){
   player.flags.r18BusStopClothScene=key;
   r18RetainRoadReward('Cloth','material');
   gainXp(Math.max(3,Math.floor((Number(player.level)||1)/2)));
   add('The woman offers a clean piece of Cloth from her handbag. "For your tears, dear. The road can be cruel."','reward');
  }
  return ok;
 };
 // Image failures should be evident; no fallback to an inconsistent time of day.
 for(const p of ['dawn','day','dusk','night']){
  const img=new Image();
  img.onerror=()=>console.warn('Missing Empty Bus Shelter '+p+' artwork:',asset(p));
  img.src=asset(p);
 }
 globalThis.Route127BusShelter=Object.freeze({phase,asset});
})();
