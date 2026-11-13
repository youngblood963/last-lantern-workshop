/* DEVTEST ONLY — Daniel captive scene and Clara/Daniel reunion.
 * Reuses the Factory miniboss HP bar design. No combat, quest or save mutations.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
 const base=new URL('../devtest/',document.baseURI);
 const hostage=new URL('assets/scenarios/daniel_factory_captors.png',base).href;
 const reunion=new URL('assets/scenarios/clara_daniel_reunion.png',base).href;
 const regional=name=>new URL('../assets/regions/'+name,base).href;
 const fight=()=>typeof combatState!=='undefined'&&!!combatState?.r18DanielCaptors&&
  ['combat','combatItems'].includes(typeof stage==='undefined'?'':stage);
 const inRoom=()=>typeof r18DanielAtRoom==='function'&&r18DanielAtRoom();
 const showing=()=>fight()||inRoom();
 const previousModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const model=previousModel.apply(this,args);
  if(model.active&&showing()){
   model.art=hostage;
   model.regionalSky=null; // indoor location; no artificial exterior sky
   model.title=fight()?'DANIEL — THE CAPTORS':'STORAGE WAREHOUSE — DANIEL';
  }
  return model;
 };
 const style=document.createElement('style');
 style.textContent=`
 .gfx-art.r127-daniel-hostage{position:relative;isolation:isolate}
 .gfx-art.r127-daniel-hostage>.gfx-image{object-fit:contain!important;object-position:center}
 .gfx-frame.r127-daniel-combat .gfx-main>.gfx-combat{display:none!important}
 .gfx-art .r127-daniel-hp-layer{position:absolute;inset:0;z-index:9;pointer-events:none}
 .gfx-art .r127-daniel-hp-unit{position:absolute;bottom:3%;width:min(36%,280px);
  background:#1c0d0deb;border:1px solid #b46f54;border-radius:5px;
  padding:6px 8px;box-sizing:border-box;color:#fff;text-align:center;
  pointer-events:auto;cursor:pointer;box-shadow:0 2px 12px #000a;
  font-family:system-ui,sans-serif}
 .gfx-art .r127-daniel-hp-unit[data-index="0"]{left:5%}
 .gfx-art .r127-daniel-hp-unit[data-index="1"]{right:5%}
 .gfx-art .r127-daniel-hp-unit[hidden]{display:none!important}
 .gfx-art .r127-daniel-hp-unit .r127-factory-boss-name{font-size:clamp(11px,1.4vw,15px)}
 .r127-daniel-reunion-dialog{border:1px solid #aa835b;background:#181410;color:#f9e3c0;
  padding:12px;width:min(960px,96vw);max-height:95dvh;overflow:auto;box-sizing:border-box}
 .r127-daniel-reunion-dialog::backdrop{background:#000d}
 .r127-daniel-reunion-dialog h2{font:700 clamp(18px,2vw,27px) Georgia,serif;margin:4px 0 10px;color:#f2cc98}
 .r127-daniel-reunion-stage{position:relative;aspect-ratio:16/9;width:100%;
  overflow:hidden;background:#23232e}
 .r127-daniel-reunion-sky{position:absolute;inset:0;background-size:cover;background-position:center}
 .r127-daniel-reunion-image{position:absolute;inset:0;width:100%;height:100%;
  object-fit:contain;object-position:center}
 .r127-daniel-reunion-dialog p{margin:10px 2px;font:15px/1.5 Georgia,serif}
 .r127-daniel-reunion-actions{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:10px}
 .r127-daniel-reunion-dialog button{display:block;margin:0;padding:9px 20px;
  background:#3c291e;border:1px solid #b28b5a;color:#f5e4cb;font:700 14px system-ui;cursor:pointer}
 `;
 document.head.append(style);
 const previousSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=previousSync.apply(this,args);
  try{
   const e=this.element;if(!e?.figure)return result;
   const active=!e.frame.hidden&&this.preference()==='graphics'&&showing();
   const combat=active&&fight(),figure=e.figure;
   figure.classList.toggle('r127-daniel-hostage',active);
   e.frame.classList.toggle('r127-daniel-combat',combat);
   let overlay=figure.querySelector(':scope > .r127-daniel-hp-layer');
   if(!combat){overlay?.remove();return result;}
   const all=Array.isArray(combatState?.enemies)?combatState.enemies:[];
   if(!overlay){
    overlay=document.createElement('div');overlay.className='r127-daniel-hp-layer';
    for(let i=0;i<2;i++){
     const button=document.createElement('button');button.type='button';
     button.className='r127-daniel-hp-unit';button.dataset.index=String(i);
     const label=document.createElement('strong');label.className='r127-factory-boss-name';
     const track=document.createElement('div');track.className='r127-factory-boss-track';
     track.setAttribute('role','progressbar');track.setAttribute('aria-valuemin','0');
     const fill=document.createElement('div');fill.className='r127-factory-boss-fill';track.append(fill);
     const count=document.createElement('span');count.className='r127-factory-boss-count';
     button.append(label,track,count);
     button.addEventListener('click',()=>{
      if(typeof busy!=='undefined'&&busy)return;
      if(typeof handleCommand==='function')handleCommand('attack '+(i+1));
     });
     overlay.append(button);
    }
    figure.append(overlay);
   }
   [...overlay.children].forEach((node,i)=>{
    const enemy=all[i],hp=Math.max(0,Number(enemy?.hp)||0);
    node.hidden=!enemy||hp<=0;
    if(node.hidden)return;
    const max=Math.max(1,Number(enemy.maxHp)||hp);
    node.querySelector('.r127-factory-boss-name').textContent=enemy.name||('CAPTOR '+(i+1));
    const track=node.querySelector('.r127-factory-boss-track');
    track.setAttribute('aria-valuenow',String(hp));track.setAttribute('aria-valuemax',String(max));
    node.querySelector('.r127-factory-boss-fill').style.width=Math.min(100,hp/max*100)+'%';
    node.querySelector('.r127-factory-boss-count').textContent=Math.ceil(hp)+' / '+Math.ceil(max)+' HP';
    node.setAttribute('aria-label','Attack '+(enemy.name||'captor')+', '+Math.ceil(hp)+' of '+Math.ceil(max)+' HP');
   });
  }catch(err){console.warn('Daniel rescue presentation:',err);}
  return result;
 };
 function reunionScene(){
  const dialog=document.createElement('dialog');dialog.className='r127-daniel-reunion-dialog';
  const heading=document.createElement('h2');heading.textContent='CLARA & DANIEL — REUNITED';
  const stageEl=document.createElement('div');stageEl.className='r127-daniel-reunion-stage';
  const sky=document.createElement('div');sky.className='r127-daniel-reunion-sky';
  const photo=document.createElement('img');photo.className='r127-daniel-reunion-image';
  photo.src=reunion;photo.alt='Clara and Daniel embrace outside the ruined Factory';
  const phase=typeof Route127RegionalSky?.phase==='function'?
   Route127RegionalSky.phase(player?.flags?.worldHour):'day';
  sky.style.backgroundImage='url("'+regional(phase==='dusk'?'sky_dawn.png':'sky_'+phase+'.png')+'")';
  if(phase==='dusk')sky.style.filter='sepia(.42) hue-rotate(-18deg) saturate(1.4)';
  stageEl.append(sky,photo);
  const detail=document.createElement('p');
  detail.textContent='At the Factory entrance, Clara finds Daniel alive. They embrace, thank you, and leave together for a safer road.';
  // Both controls return to the already-rendered Factory room; neither
  // repeats the rescue, changes quest flags, or awards anything.
  const actions=document.createElement('div');actions.className='r127-daniel-reunion-actions';
  const back=document.createElement('button');back.type='button';back.textContent='BACK';
  const close=document.createElement('button');close.type='button';close.textContent='CONTINUE';
  back.addEventListener('click',()=>dialog.close());
  close.addEventListener('click',()=>dialog.close());
  actions.append(back,close);
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  dialog.append(heading,stageEl,detail,actions);
  document.body.append(dialog);dialog.showModal();close.focus();
 }
 window.addEventListener('route127:daniel-reunion',()=>{
  // Allow the existing Factory transition and reward display to complete first.
  queueMicrotask(()=>{try{reunionScene();}catch(err){console.warn('Daniel reunion cinematic:',err);}});
 });
 GraphicalUI.schedule();
})();