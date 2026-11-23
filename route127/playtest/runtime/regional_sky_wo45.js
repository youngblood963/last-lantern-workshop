/* WO45: DEVTEST presentation only. worldHour remains the sole gameplay clock. */
(() => {
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='PLAYTEST'||!/^\/route127\/playtest\/(?:index\.html)?$/.test(location.pathname)||typeof GraphicalUI==='undefined')return;
 const base=new URL('../../assets/regions/',document.currentScript.src);
 const regions=Object.freeze({
  CENTRAL:['central_overlay.png','central.png','Central'],
  INDUSTRIAL:['industrial_overlay.png','industrial.png','Industrial'],
  LOWLANDS:['bayou_overlay.png','lowlands.png','Bayou'],
  WEST:['forest_overlay.png','west.png','Forest'],
  NORTH:['northern_ridge_overlay.png','north.png','Northern Ridge'],
  EAST:['farmland_overlay.png','east.png','Farmland'],
  SEAPORT:['seaport_road_overlay.png','seaport.png','Seaport Coast'],
  CAUSEWAY:['causeway.png','causeway.png','Causeway']
 });
 const url=file=>new URL(file,base).href;
 const phase=hour=>{
  const h=((Number(hour??8)%24)+24)%24;
  const state=timePhase(h);
  return state==='DARK'?'night':state.toLowerCase();
 };
 const assets=new Map();
 function warm(file){
  if(assets.has(file))return assets.get(file);
  const record={ready:false,failed:false},image=new Image();assets.set(file,record);
  image.onload=async()=>{try{if(image.decode)await image.decode();}catch{record.failed=true;return;}record.ready=true;GraphicalUI.sync();};
  image.onerror=()=>{record.failed=true;console.warn('WO45 regional asset failed:',file);};
  image.src=url(file);return record;
 }
 function describe(region,hour){
  const row=regions[region];if(!row)return null;
  const period=phase(hour);return {region,period,overlay:row[0],original:row[1],sky:period==='dusk'?(region==='CAUSEWAY'?'sky_dawn.png':null):'sky_'+period+'.png',title:row[2]};
 }
 globalThis.Route127EditorSky=Object.freeze({
  describe(region,hour){
   const scene=describe(region,hour);
   return scene&&{ground:url(scene.overlay),sky:url(scene.sky||'sky_dawn.png'),period:scene.period};
  }
 });
 function applyRegionalSky(model,region,hour){
  const scene=describe(region,hour);
  // Exact original-art matching preserves every dedicated location/scenario image.
  if(!scene||!model.art||new URL(model.art,ROUTE127_ASSET_BASE||document.baseURI).href!==url(scene.original))return model;
  const overlay=warm(scene.overlay),sky=scene.sky?warm(scene.sky):null;
  if(region==='CAUSEWAY'&&(!overlay.ready||!sky?.ready))model.causewayBacking=true;
  if(overlay.ready&&sky?.ready){model.art=url(scene.overlay);model.regionalSky=scene;}
  return model;
 };
 const western=globalThis.Route127WesternArt;
 const oldModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const region=route127CurrentRegion(lanternState()),hour=player.flags.worldHour;
  const model=applyRegionalSky(oldModel.apply(this,args),region,hour);
  const variant=western?.current()?.variant;
  if(!model.active||!variant)return model;
  const period=phase(hour),outdoor=variant.composition!=='none';
  const sky='sky_'+(period==='dusk'?'dawn':period)+'.png';
  const ground=variant.composition==='regional'?regions[region]?.[0]:
   variant.composition==='road'?'dirt_road_foreground.png':null;
  const art=variant.background?western.url(variant.background):ground&&url(ground);
  if(!art)return model;
  const layers=[art,outdoor&&url(sky),ground&&url(ground)].filter(Boolean);
  if(layers.map(path=>this.sceneArtworkReady(path)).every(Boolean)){
   model.art=art;
   model.causewayBacking=false;
   model.scenarioBackdrop={art,mode:variant.composition};
   model.westernArt=true;
   model.regionalSky=outdoor?{region,period,sky,western:true,ground:variant.background?ground:null}:null;
  }
  return model;
 };
 function paint(figure,img,scene){
  let sky=figure.querySelector('.r127-regional-sky');
  if(scene&&!sky){sky=document.createElement('div');sky.className='r127-regional-sky';sky.setAttribute('aria-hidden','true');figure.insertBefore(sky,img);}
  let ground=figure.querySelector('.r127-regional-ground');
  if(scene?.ground){
   if(!ground){ground=document.createElement('img');ground.className='r127-regional-ground';ground.alt='';figure.insertBefore(ground,img);}
   const source=url(scene.ground);
   if(ground.src!==source)ground.src=source;
  }else ground?.remove();
  if(sky)sky.style.filter=scene?.western&&scene.period==='dusk'?'sepia(.42) hue-rotate(-18deg) saturate(1.4)':'';
  figure.classList.toggle('r127-regional-layered',!!scene);
  if(scene){figure.dataset.skyPeriod=scene.period;figure.dataset.skyRegion=scene.region;sky.style.backgroundImage='url("'+url(scene.sky)+'")';sky.hidden=false;}
  else{delete figure.dataset.skyPeriod;delete figure.dataset.skyRegion;if(sky)sky.hidden=true;}
 }
 const oldSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){const result=oldSync.apply(this,args),e=this.element;if(!e?.figure)return result;
  const model=this.model();
  e.figure.classList.toggle('r127-causeway-backing',!!model.causewayBacking);
  const westernShown=!!model.westernArt&&this.displaysArtwork(model.art);
  e.figure.classList.toggle('r127-western-composition',westernShown);
  e.figure.classList.toggle('r127-western-foreground',westernShown&&!!western.current()?.variant.background);
  paint(e.figure,e.img,model.westernArt&&!westernShown?null:model.regionalSky||null);
  return result;
 };
 const css=document.createElement('style');css.textContent=`
 .gfx-art.r127-causeway-backing>.gfx-image{background:linear-gradient(#55788e,#a9bdc3 53%,#40535b)!important}
 .r127-regional-sky{position:absolute;inset:0;background-size:cover;background-position:center;pointer-events:none;z-index:0}
 .r127-regional-ground{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;pointer-events:none;z-index:1}
 .gfx-frame .gfx-art.r127-western-composition.r127-western-foreground>.gfx-image{position:relative;z-index:2;object-fit:contain;object-position:center;background:transparent!important}
 .gfx-art.r127-western-composition .gfx-art-caption{z-index:9}
 .r127-western-composition[data-sky-period="dusk"]>img{filter:brightness(.83) saturate(.88) sepia(.18)}
 .r127-western-composition.r127-western-foreground[data-sky-period="day"]>img{filter:none}
 .r127-regional-layered.r127-western-composition[data-sky-region="CAUSEWAY"] .r127-regional-sky{z-index:0;mask-image:none;-webkit-mask-image:none;opacity:1}
 .r127-regional-sky[hidden]{display:none}
 /* Causeway art includes a painted sky, so layer the clock's sky state over
    its upper portion rather than hiding the sky asset behind opaque pixels. */
 .r127-regional-layered[data-sky-region="CAUSEWAY"] .r127-regional-sky{z-index:2;opacity:.78;mask-image:linear-gradient(to bottom,#000 0%,#000 17%,transparent 48%);-webkit-mask-image:linear-gradient(to bottom,#000 0%,#000 17%,transparent 48%)}
 .r127-regional-layered[data-sky-region="CAUSEWAY"][data-sky-period="dusk"] .r127-regional-sky{filter:sepia(.42) hue-rotate(-18deg) saturate(1.4);opacity:.58}
 .gfx-frame .gfx-art.r127-regional-layered>.gfx-image,.r127-sky-preview-art.r127-regional-layered>img{position:relative;z-index:1;background:transparent;object-fit:cover;object-position:center}
 .r127-regional-layered[data-sky-period="dawn"]>img{filter:brightness(.94) saturate(.92) sepia(.16)}
 .r127-regional-layered[data-sky-period="day"]>img{filter:brightness(1.04) saturate(1.02)}
 .r127-regional-layered[data-sky-period="night"]>img{filter:brightness(.65) saturate(.65) sepia(.12) hue-rotate(165deg)}
 .gfx-frame .r127-regional-layered>.gfx-art-caption{z-index:2}
 .r127-sky-preview{background:#151a20;color:#f5e5cd;border:1px solid #ae8058;width:min(960px,94vw);max-height:94dvh;overflow:auto;padding:16px}
 .r127-sky-preview::backdrop{background:#000b}
 .r127-sky-preview select,.r127-sky-preview button{margin:4px;min-height:44px;max-width:100%}
 .r127-sky-preview-art{position:relative;margin:10px 0;background:#080a09;aspect-ratio:1670/942;overflow:hidden}
 .r127-sky-preview-art>img{display:block;width:100%;height:100%;object-fit:cover}
 `;document.head.append(css);
 globalThis.Route127RegionalSky=Object.freeze({regions,phase,describe,applyRegionalSky});
 warm('sky_dawn.png');warm('sky_day.png');warm('sky_night.png');warm('causeway.png');
})();
