/* DEVTEST: one regional terrain guard for ordinary road encounter sprites.
 * Keep explicit sky, sky+road, interior, and cinematic compositions untouched.
 * This changes presentation only; it never writes visual-testing layouts.
 */
(() => {
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='PLAYTEST'||typeof GraphicalUI==='undefined')return;
 const regionalOriginals=new Set([
  'central.png','industrial.png','north.png','east.png','west.png',
  'lowlands.png','seaport.png','causeway.png',
  'central_overlay.png','industrial_overlay.png','northern_ridge_overlay.png',
  'farmland_overlay.png','forest_overlay.png','bayou_overlay.png',
  'seaport_road_overlay.png'
 ]);
 const isRegionalBase=art=>{
  if(!art)return false;
  try{
   const filename=decodeURIComponent(new URL(art,document.baseURI).pathname.split('/').pop()).toLowerCase();
   return regionalOriginals.has(filename)||/^sky_(?:day|dawn|dusk|night)\.png$/.test(filename);
  }catch{return false;}
 };
 const originalModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const model=originalModel.apply(this,args);
  if(!model?.active||typeof stage==='undefined')return model;
  const c=typeof combatState!=='undefined'?combatState:null;
  if(stage!=='encounter'&&!(stage==='combat'||stage==='combatItems')||stage!=='encounter'&&c?.source!=='encounter')return model;

  const layouts=globalThis.Route127CombatLayouts;
  const active=layouts?.activeScene();
  const row=active&&layouts.rows.get(active.id);
  if(!row||row.western||row.fullCinematic)return model;
  // Scene-specific artwork wins over this generic sprite-only fallback.
  if(row.variants.some(v=>v.background||['sky','road','none'].includes(v.composition)))return model;
  if(model.westernArt||model.scenarioBackdrop&&model.scenarioBackdrop.mode!=='regional')return model;
  if(!isRegionalBase(model.art))return model;

  const region=typeof route127CurrentRegion==='function'?
   route127CurrentRegion(typeof lanternState==='function'?lanternState():null):null;
  const scene=globalThis.Route127EditorSky?.describe(region,player?.flags?.worldHour);
  if(!scene||!this.sceneArtworkReady(scene.ground)||!this.sceneArtworkReady(scene.sky))return model;
  const period=scene.period||globalThis.Route127RegionalSky?.phase(player?.flags?.worldHour)||'day';
  model.art=scene.ground;
  model.regionalSky={region,period,sky:new URL(scene.sky).pathname.split('/').pop()};
  model.scenarioBackdrop=null;
  model.causewayBacking=false;
  return model;
 };
})();
