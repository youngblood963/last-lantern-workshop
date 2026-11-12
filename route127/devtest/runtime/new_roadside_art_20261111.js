/* DEVTEST ONLY — owner-approved encounter art. Presentation only; no RNG, saves, turns or combat rules.
 * The scenic PNGs retain their own landscape and use WO45 sky layers behind transparent pixels.
 * OLD BILLBOARD has six distinct fronts and a manual reverse view, with no gameplay cost. */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
 const root=new URL('../devtest/',document.baseURI);
 const scenario=file=>new URL('assets/scenarios/'+file,root).href;
 const enemy=file=>new URL('assets/enemies/'+file,root).href;
 const originalHouse=new URL('../playtest/assets/locations/abandoned_house_interior.png',document.baseURI).href;
 const regionBase=new URL('../assets/regions/',document.baseURI);
 const fronts=['old_billboard_burger.png','old_billboard_mechanic.png','old_billboard_motel.png',
  'old_billboard_emergency_kit.png','old_billboard_soda.png','old_billboard_road_workers.png'];
 const back='old_billboard_back.png';
 const fixed={
  'MAINTENANCE BOX':'maintenance_box.png',
  'MILEPOST CACHE':'milepost_cache.png',
  'CACHE UNDER THE MILEPOST':'milepost_cache.png',
  'ABANDONED SEDAN':'abandoned_sedan.png',
  'ABANDONED SUPPLY TRUCK':'fresh_meat_butcher.png',
  'FRESH MEAT':'fresh_meat_butcher.png'
 };
 // Scene identity is resolved from the original canonical title OR edited encounter display name.
 const name=()=>String(typeof currentEncounter==='function'&&currentEncounter()?
  (currentEncounter().displayName||currentEncounter().title):'').toUpperCase().replace(/^EAST ROAD — /,'').trim();
 const billboard=()=>['OLD BILLBOARD'].includes(name());
 let reverse=false,wasBillboard=false;
 const isHouse=()=>typeof combatState!=='undefined'&&combatState?.source==='houseBoss';
 const isCulvert=()=>{
  const c=typeof combatState!=='undefined'?combatState:null;
  return (['encounter','combat','combatItems'].includes(stage)&&
   (name()==='DRAINAGE STALKER'||name()==='CULVERT CRAWLER'||c?.name==='CULVERT CRAWLER'));
 };
 function sceneFile(){
  if(typeof stage==='undefined'||!['encounter','combat','combatItems'].includes(stage))return null;
  if(billboard()){
   const seen=typeof player!=='undefined'&&Array.isArray(player.flags?.r18BillboardFrontSeen)?
    player.flags.r18BillboardFrontSeen:[];
   const last=seen.length?Number(seen[seen.length-1]):0;
   return reverse?back:fronts[Number.isInteger(last)&&last>=0&&last<fronts.length?last:0];
  }
  return fixed[name()]||fixed[String(currentEncounter()?.title||'').toUpperCase().replace(/^EAST ROAD — /,'').trim()]||null;
 }
 const previousModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const m=previousModel.apply(this,args);
  if(!m.active)return m;
  const file=sceneFile();
  if(file){m.art=scenario(file);m.title=typeof currentEncounter==='function'?
    (currentEncounter()?.displayName||currentEncounter()?.title||m.title):m.title;m.regionalSky=null;}
  if(isHouse()){m.art=originalHouse;m.title='HOUSE SQUATTER';m.regionalSky=null;}
  return m;
 };
 const css=document.createElement('style');
 css.textContent=`
 .gfx-art.r127-new-scenic{position:relative;isolation:isolate}
 .gfx-art.r127-new-scenic>.r127-new-sky{position:absolute;inset:0;z-index:0;background-size:cover;background-position:center;pointer-events:none}
 .gfx-art.r127-new-scenic>.gfx-image{position:relative;z-index:1;object-fit:contain;object-position:center center;background:transparent!important}
 .gfx-art.r127-new-scenic>.gfx-art-caption{z-index:7}
 .gfx-art.r127-new-scenic[data-new-period="night"]>.gfx-image{filter:brightness(.65) saturate(.75)}
 .gfx-art.r127-new-scenic[data-new-period="dawn"]>.gfx-image{filter:brightness(.9) sepia(.12)}
 .gfx-art .r127-new-figure{position:absolute;inset:0;z-index:5;display:flex;align-items:flex-end;justify-content:center;pointer-events:none}
 .gfx-art .r127-new-figure img{display:block;width:75%;height:92%;object-fit:contain;object-position:center bottom;filter:drop-shadow(4px 6px 6px #0009)}
 .gfx-art .r127-billboard-reverse{position:absolute;bottom:7px;right:7px;z-index:9;background:#261b13e9;color:#f5dfb8;border:1px solid #c29a61;padding:6px 10px;border-radius:3px;cursor:pointer;font:700 12px sans-serif}
 `;
 document.head.append(css);
 const oldSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=oldSync.apply(this,args);
  try{
   const e=this.element;if(!e?.figure)return result;
   const active=!e.frame.hidden&&this.preference()==='graphics'&&!e.figure.hidden;
   const showingBillboard=active&&billboard()&&!!sceneFile();
   if(!showingBillboard&&wasBillboard)reverse=false;
   wasBillboard=showingBillboard;
   let toggle=e.figure.querySelector('.r127-billboard-reverse');
   if(showingBillboard&&!toggle){
    toggle=document.createElement('button');toggle.type='button';toggle.className='r127-billboard-reverse';
    toggle.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();reverse=!reverse;this.sync();});
    e.figure.append(toggle);
   }
   if(toggle){toggle.hidden=!showingBillboard;if(showingBillboard)toggle.textContent=reverse?'View billboard front':'View billboard back';}
   const scenic=active&&!!sceneFile();
   e.figure.classList.toggle('r127-new-scenic',scenic);
   let sky=e.figure.querySelector('.r127-new-sky');
   if(!scenic){sky?.remove();delete e.figure.dataset.newPeriod;}
   else{
    if(!sky){sky=document.createElement('div');sky.className='r127-new-sky';sky.setAttribute('aria-hidden','true');e.figure.insertBefore(sky,e.img);}
    const period=typeof Route127RegionalSky?.phase==='function'?
     Route127RegionalSky.phase(player.flags?.worldHour):'day';
    const region=typeof route127CurrentRegion==='function'?route127CurrentRegion(lanternState()):'CENTRAL';
    const regions={CENTRAL:'central',INDUSTRIAL:'industrial',NORTH:'north',EAST:'east',WEST:'west',LOWLANDS:'lowlands',SEAPORT:'seaport'};
    sky.style.backgroundImage='url("'+new URL(period==='dusk'?(regions[region]||'central')+'.png':'sky_'+period+'.png',regionBase).href+'")';
    if(showingBillboard){
     const layers=globalThis.Route127EditorSky?.describe(region,player.flags?.worldHour);
     if(layers)sky.style.backgroundImage='url("'+layers.ground+'"), url("'+layers.sky+'")';
    }
    e.figure.dataset.newPeriod=period;
   }
   let layer=e.figure.querySelector('.r127-new-figure');
   const sprite=active&&(isHouse()?'house_squatter.png':isCulvert()?'culvert_crawler.png':null);
   if(!sprite){layer?.remove();return result;}
   if(layer?.dataset.sprite!==sprite){
    layer?.remove();layer=document.createElement('div');layer.className='r127-new-figure';layer.dataset.sprite=sprite;
    const img=document.createElement('img');img.src=enemy(sprite);img.alt='';
    img.onerror=()=>{layer?.remove();console.warn('Missing DEVTEST sprite: '+sprite);};
    layer.append(img);e.figure.append(layer);
   }
  }catch(err){console.warn('DEVTEST new roadside artwork',err);}
  return result;
 };
})();