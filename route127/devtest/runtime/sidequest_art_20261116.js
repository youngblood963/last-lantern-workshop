/* DEVTEST — Solace/Seaport side-quest artwork.
 * Presentation only: existing quest rewards, save flags, road costs, combat and
 * Classic BBS remain authoritative. No extra turns or repeatable rewards.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
 const root=new URL('../devtest/',document.baseURI);
 const img=name=>new URL('assets/scenarios/'+name,root).href;
 const regionAsset=name=>new URL('../assets/regions/'+name,root).href;
 const graphics=()=>GraphicalUI.preference()==='graphics';
 const scene=()=>{
  if(stage==='r18Fence')return {name:'silas_crowe_fence.png',title:'SILAS THE FENCE',fullscreen:true};
  if(stage==='r11Hollis')return {name:'hollis_reed.png',title:'HOLLIS REED — DOCKS CLERK',region:'SEAPORT'};
  if(stage==='r11Gambler')return {name:'missing_gambler.png',title:'HOUSE RULES — THE MISSING GAMBLER',region:'SEAPORT'};
  if(['combat','combatItems'].includes(stage)&&typeof combatState!=='undefined'&&combatState?.source==='terribleBilly')
   return {name:'terrible_billy.png',title:'TERRIBLE BILLY — WANTED',region:'INDUSTRIAL'};
  return null;
 };
 const previousModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const model=previousModel.apply(this,args),s=graphics()?scene():null;
  if(model?.active&&s){model.art=img(s.name);model.title=s.title;model.regionalSky=null;}
  return model;
 };
 const css=document.createElement('style');css.id='r127-sidequest-art-20261116';
 css.textContent=`
 .gfx-art.r127-sidequest-art{position:relative;isolation:isolate;overflow:hidden;background:#202326!important}
 .gfx-art.r127-sidequest-art>.r127-sidequest-backdrop{position:absolute;inset:0;z-index:0;background-size:cover;background-position:center;background-repeat:no-repeat;pointer-events:none}
 .gfx-art.r127-sidequest-art>.gfx-image{position:relative;z-index:3;max-width:none;width:100%;height:100%;object-fit:contain!important;object-position:center bottom;background:transparent!important;filter:drop-shadow(2px 7px 6px #000a)}
 .gfx-art.r127-sidequest-art.r127-fence-office>.gfx-image{object-fit:cover!important;object-position:center center!important;filter:none!important}
 .gfx-art.r127-sidequest-art>.gfx-art-caption{z-index:10}
 .gfx-art.r127-sidequest-art>.r127-regional-sky{display:none!important}
 .r127-sidequest-dialog{width:min(960px,96vw);max-height:96dvh;overflow:auto;box-sizing:border-box;border:1px solid #ae8355;background:#17130f;color:#f3dfbf;padding:12px}
 .r127-sidequest-dialog::backdrop{background:#000d}
 .r127-sidequest-dialog h2{font:700 clamp(17px,2vw,26px) Georgia,serif;margin:4px 0 10px;color:#f0cb8d}
 .r127-sidequest-canvas{position:relative;width:100%;aspect-ratio:16/9;background:#151a1d;overflow:hidden}
 .r127-sidequest-canvas .r127-sidequest-scene-sky{position:absolute;inset:0;background-size:cover;background-position:center}
 .r127-sidequest-canvas img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center}
 .r127-sidequest-dialog p{font:15px/1.45 Georgia,serif;margin:10px 2px}
 .r127-sidequest-dialog button{display:block;margin-left:auto;background:#37261b;border:1px solid #ae8355;color:#fbe6ca;font:700 14px system-ui;padding:9px 22px;cursor:pointer}
 `;
 document.head.append(css);
 const previousSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=previousSync.apply(this,args);
  try{
   const e=this.element;if(!e?.figure)return result;
   const active=graphics()&&!e.frame.hidden&&!!scene(),s=active?scene():null;
   e.figure.classList.toggle('r127-sidequest-art',active);
   e.figure.classList.toggle('r127-fence-office',!!s?.fullscreen);
   let layer=e.figure.querySelector(':scope > .r127-sidequest-backdrop');
   if(!active||s?.fullscreen){layer?.remove();return result;}
   if(!layer){layer=document.createElement('div');layer.className='r127-sidequest-backdrop';layer.setAttribute('aria-hidden','true');e.figure.insertBefore(layer,e.img);}
   const info=globalThis.Route127EditorSky?.describe?.(s.region,player?.flags?.worldHour);
   if(info)layer.style.backgroundImage='url("'+info.ground+'"),url("'+info.sky+'")';
   else layer.style.backgroundImage='url("'+regionAsset(s.region.toLowerCase()+'.png')+'")';
   if(e.caption)e.caption.textContent=s.title;
  }catch(err){console.warn('DEVTEST side-quest image:',err);}
  return result;
 };
 function showCinematic(title,file,description,coast=false){
  if(!graphics())return;
  const dialog=document.createElement('dialog');dialog.className='r127-sidequest-dialog';
  const header=document.createElement('h2');header.textContent=title;
  const canvas=document.createElement('div');canvas.className='r127-sidequest-canvas';
  if(coast){
   const sky=document.createElement('div');sky.className='r127-sidequest-scene-sky';
   const info=globalThis.Route127EditorSky?.describe?.('CAUSEWAY',player?.flags?.worldHour);
   if(info)sky.style.backgroundImage='url("'+info.ground+'"),url("'+info.sky+'")';
   else sky.style.backgroundImage='url("'+regionAsset('causeway.png')+'")';
   canvas.append(sky);
  }
  const picture=document.createElement('img');picture.src=img(file);picture.alt=title;canvas.append(picture);
  const text=document.createElement('p');text.textContent=description;
  const back=document.createElement('button');back.type='button';back.textContent='BACK';
  back.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  dialog.append(header,canvas,text,back);document.body.append(dialog);
  dialog.showModal();back.focus();
 }
 window.addEventListener('route127:last-shipment-discovered',()=>{
  // The base quest has already committed the single pickup and returned to road.
  queueMicrotask(()=>showCinematic('THE LAST SHIPMENT','last_shipment.png',
   'You uncover the missing relief cargo behind a false loading wall on the Causeway. The forged manifest gives Hollis the evidence he needs.',true));
 });
 if(typeof storyValeReunion==='function'){
  const originalReunion=storyValeReunion;
  storyValeReunion=function(...args){
   const first=originalReunion.apply(this,args);
   if(first&&graphics())queueMicrotask(()=>showCinematic('A FAMILIAR FACE — REUNITED','jen_vale_reunion.png',
    'Vale returns to the Rusty Lantern. Jen sets down a cup beside her, and the old friends share a moment of relief.'));
   return first;
  };
 }
})();