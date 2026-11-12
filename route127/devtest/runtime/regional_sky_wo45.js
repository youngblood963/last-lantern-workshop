/* WO45: DEVTEST presentation only. worldHour remains the sole gameplay clock. */
(() => {
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||typeof GraphicalUI==='undefined')return;
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
 const phase=hour=>{const h=((Number(hour??8)%24)+24)%24;return h>=5&&h<7?'dawn':h>=7&&h<18?'day':h>=18&&h<20?'dusk':'night';};
 const assets=new Map();
 function warm(file){
  if(assets.has(file))return assets.get(file);
  const record={ready:false,failed:false},image=new Image();assets.set(file,record);
  image.onload=async()=>{try{if(image.decode)await image.decode();}catch{}record.ready=true;GraphicalUI.sync();};
  image.onerror=()=>{record.failed=true;console.warn('WO45 regional asset failed:',file);};
  image.src=url(file);return record;
 }
 function describe(region,hour){
  const row=regions[region];if(!row)return null;
  const period=phase(hour);return {region,period,overlay:row[0],original:row[1],sky:period==='dusk'?(region==='CAUSEWAY'?'sky_dawn.png':null):'sky_'+period+'.png',title:row[2]};
 }
 const oldModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const model=oldModel.apply(this,args),g=lanternState();
  const region=route127CurrentRegion(g),scene=describe(region,player.flags.worldHour);
  // Exact original-art matching preserves every dedicated location/scenario image.
  if(!scene||!model.art||new URL(model.art,ROUTE127_ASSET_BASE||document.baseURI).href!==url(scene.original))return model;
  const overlay=warm(scene.overlay),sky=scene.sky?warm(scene.sky):null;
  if(overlay.ready&&sky?.ready){model.art=url(scene.overlay);model.regionalSky=scene;}
  return model;
 };
 function paint(figure,img,scene){
  let sky=figure.querySelector('.r127-regional-sky');
  if(scene&&!sky){sky=document.createElement('div');sky.className='r127-regional-sky';sky.setAttribute('aria-hidden','true');figure.insertBefore(sky,img);}
  figure.classList.toggle('r127-regional-layered',!!scene);
  if(scene){figure.dataset.skyPeriod=scene.period;figure.dataset.skyRegion=scene.region;sky.style.backgroundImage='url("'+url(scene.sky)+'")';sky.hidden=false;}
  else{delete figure.dataset.skyPeriod;delete figure.dataset.skyRegion;if(sky)sky.hidden=true;}
 }
 let dialog=null,previousFocus=null;
 if(typeof FocusedEntry!=='undefined'){
  const oldKey=FocusedEntry.key;
  FocusedEntry.key=function(event){if(dialog?.open)return;return oldKey.call(this,event);};
 }
 function preview(){
  if(dialog?.open)return;
  previousFocus=document.activeElement;dialog=document.createElement('dialog');dialog.className='r127-sky-preview';dialog.setAttribute('aria-label','Regional sky visual preview');
  const title=document.createElement('h2');title.textContent='Regional skies — visual preview';dialog.append(title);
  const region=document.createElement('select'),period=document.createElement('select');region.setAttribute('aria-label','Preview region');period.setAttribute('aria-label','Preview time of day');
  for(const [key,row]of Object.entries(regions)){const o=document.createElement('option');o.value=key;o.textContent=row[2];region.append(o);}
  for(const [key,label]of [['dawn','DAWN'],['day','DAY'],['dusk','DUSK'],['night','NIGHT']]){const o=document.createElement('option');o.value=key;o.textContent=label;period.append(o);}
  const close=document.createElement('button');close.type='button';close.textContent='Close preview';
  const figure=document.createElement('figure');figure.className='r127-sky-preview-art';const img=document.createElement('img');img.alt='';figure.append(img);
  const note=document.createElement('p');note.textContent='Preview only. Your time, location, turns and save are unchanged.';
  const status=document.createElement('p');status.setAttribute('role','status');
  dialog.append(region,period,close,figure,status,note);let revision=0;
  function update(){const ticket=++revision,scene=describe(region.value,{dawn:6,day:12,dusk:18,night:22}[period.value]);status.textContent='Loading '+scene.title+' '+scene.period+'…';
   const files=scene.sky?[scene.overlay,scene.sky]:[scene.original];
   Promise.all(files.map(file=>new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=reject;image.src=url(file);}))).then(()=>{
    if(ticket!==revision||!dialog)return;img.src=url(scene.sky?scene.overlay:scene.original);img.alt=scene.title+' — '+scene.period;paint(figure,img,scene.sky?scene:null);status.textContent=img.alt;
   },()=>{if(ticket===revision)status.textContent='Artwork could not load. Choose another preview to retry.';});
  }
  function end(){revision++;dialog.close();dialog.remove();dialog=null;previousFocus?.focus();}
  dialog.addEventListener('keydown',event=>event.stopPropagation());
  close.addEventListener('click',end);dialog.addEventListener('cancel',event=>{event.preventDefault();end();});region.addEventListener('change',update);period.addEventListener('change',update);
  document.body.append(dialog);dialog.showModal();region.focus();update();
 }
 const oldSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){const result=oldSync.apply(this,args),e=this.element;if(!e?.figure)return result;
  paint(e.figure,e.img,this.model().regionalSky||null);
  if(this.optionsOpen&&!e.settings.querySelector('[data-sky-preview]')){const b=this.button('REGIONAL SKY PREVIEW',preview);b.dataset.skyPreview='true';e.settings.append(b);}
  return result;
 };
 // The shipped Options button opens TravelerPanels rather than inline settings.
 if(typeof TravelerPanels!=='undefined'){
  const oldOptions=TravelerPanels.options;
  TravelerPanels.options=function(...args){const result=oldOptions.apply(this,args);
   if(this.which==='options'&&this.body&&!this.body.querySelector('[data-sky-preview]')){
    const panel=this.body.querySelector('.traveler-detail');
    if(panel){const b=this.button('Regional Sky Preview',()=>{this.close();preview();});b.dataset.skyPreview='true';panel.appendChild(b);}
   }
   return result;
  };
 }
 const css=document.createElement('style');css.textContent=`
 .r127-regional-sky{position:absolute;inset:0;background-size:cover;background-position:center;pointer-events:none;z-index:0}
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
 globalThis.Route127RegionalSky=Object.freeze({regions,phase,describe,preview});
 warm('sky_dawn.png');warm('sky_day.png');warm('sky_night.png');warm('causeway.png');
})();
