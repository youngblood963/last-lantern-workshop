/* DEVTEST: Fence Artist scene and Enid -> Seaport staff lifecycle.
   Uses existing world hour, sky art, saved staff assignment system, star ratings,
   and the existing WandererInfo dossier. Never creates a second shop or skill system. */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||typeof GraphicalUI==='undefined')return;
 const encounterTitle='THE FENCE ARTIST';
 const art=new URL('../devtest/assets/scenarios/the_fence_artist.png',document.baseURI).href;
 const portrait=new URL('../devtest/assets/wanderers/Enid.png',document.baseURI).href;
 const skyBase=new URL('../../assets/regions/',document.currentScript.src);
 const active=()=>typeof stage!=='undefined'&&stage==='encounter'&&
   typeof currentEncounter==='function'&&currentEncounter()?.title===encounterTitle;
 const phase=hour=>typeof Route127RegionalSky?.phase==='function'?Route127RegionalSky.phase(hour):
   ((h)=>h>=5&&h<7?'dawn':h>=7&&h<18?'day':h>=18&&h<20?'dusk':'night')(((Number(hour??8)%24)+24)%24);
 // Enid's one-time Scrap Metal help action already sets r18EnidLanternPromised.
 // Make that decision add her to the actual Seaport assignment pool — no second
 // chance-based encounter/hiring action or fee. If Seaport isn't freed yet, the
 // stored flag is fulfilled when portRecruitUnlocked next runs after liberation.
 const previousUnlock=portRecruitUnlocked;
 portRecruitUnlocked=function(...args){
   const unlocked=previousUnlock.apply(this,args);
   if(!unlocked||!player?.flags?.r18EnidLanternPromised)return unlocked;
   const w=typeof wandererByName==='function'?wandererByName('Enid'):null;
   if(!w)return unlocked;
   const staff=portStaffState();
   if(!staff.hired.includes('Enid')){
     staff.hired.push('Enid');
     if(typeof v49Autosave==='function')v49Autosave();
   }
   wandererLocations.Enid='seaport';
   return unlocked;
 };
 // If a save loads already liberated and with her promise, reconcile immediately
 // through the same engine gate rather than rewriting saved roster data.
 if(typeof player!=='undefined'&&player.flags?.seaport55?.freed&&player.flags?.r18EnidLanternPromised)
   portRecruitUnlocked();

 const previousModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
   const model=previousModel.apply(this,args);
   if(active()&&model.active){
     model.art=art;
     model.title=encounterTitle;
     model.regionalSky=null;
   }
   return model;
 };
 const style=document.createElement('style');
 style.textContent=`
 .gfx-art.r127-enid-scene{isolation:isolate;background:#302b23!important}
 .gfx-art.r127-enid-scene>.r127-enid-sky{position:absolute;inset:0;z-index:0;pointer-events:none;background-size:cover;background-position:center}
 .gfx-art.r127-enid-scene>.gfx-image{position:relative;z-index:1;object-fit:contain;object-position:center bottom;background:transparent!important}
 .gfx-art.r127-enid-scene>.gfx-art-caption{z-index:6}
 .gfx-art.r127-enid-scene[data-enid-period="night"]>.gfx-image{filter:brightness(.64) saturate(.65) hue-rotate(165deg)}
 .gfx-art.r127-enid-scene[data-enid-period="dawn"]>.gfx-image{filter:brightness(.91) saturate(.91) sepia(.15)}
 .gfx-art.r127-enid-scene[data-enid-period="day"]>.gfx-image{filter:brightness(1.03)}
 .r127-enid-abilities{margin:8px 0;border:1px solid #806347;border-radius:4px;background:#201a13;color:#ead7b9;padding:7px 11px;font:13px Georgia,serif}
 .r127-enid-abilities summary{cursor:pointer;min-height:32px;font-weight:700;color:#eabf84;display:list-item}
 .r127-enid-abilities .r127-enid-rows{display:grid;gap:5px;padding-top:8px}
 .r127-enid-abilities .r127-enid-row{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
 .r127-enid-abilities .r127-enid-stars{color:#f0bd69;white-space:nowrap}
 .r127-enid-abilities button{margin-top:9px;padding:8px 12px;background:#49301d;color:#ffe7ba;border:1px solid #ae8756;cursor:pointer;min-height:40px}
 `;
 document.head.append(style);
 const previousSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
   const result=previousSync.apply(this,args);
   try{
     const e=this.element;if(!e?.figure)return result;
     const scene=active()&&!e.frame.hidden&&this.preference()==='graphics'&&!e.figure.hidden;
     let sky=e.figure.querySelector('.r127-enid-sky');
     e.figure.classList.toggle('r127-enid-scene',scene);
     if(!scene){sky?.remove();delete e.figure.dataset.enidPeriod;}
     else{
       if(!sky){sky=document.createElement('div');sky.className='r127-enid-sky';sky.setAttribute('aria-hidden','true');e.figure.insertBefore(sky,e.img);}
       const period=phase(player.flags?.worldHour);
       const region=typeof route127CurrentRegion==='function'?route127CurrentRegion(lanternState()):'CENTRAL';
       const skyFile=period==='dusk'?(region==='EAST'?'east.png':'central.png'):'sky_'+period+'.png';
       sky.style.backgroundImage='url("'+new URL(skyFile,skyBase).href+'")';
       e.figure.dataset.enidPeriod=period;
     }
     // Supplement the current Seaport staff screen with an expandable ability
     // chart, while keeping all its existing Assign/Inspect/Unassign choices.
     const panel=e.main?.querySelector('.r127-enid-abilities');
     const show=!e.frame.hidden&&stage==='port55Service'&&
       typeof portIsHired==='function'&&portIsHired('Enid')&&
       !!(typeof wandererByName==='function'&&wandererByName('Enid'));
     if(!show){panel?.remove();return result;}
     if(panel)return result;
     const w=wandererByName('Enid'),a=portAptitudes(w);
     const details=document.createElement('details');details.className='r127-enid-abilities';
     const summary=document.createElement('summary');summary.textContent='ENID — WANDERER ABILITIES';
     details.append(summary);
     const rows=document.createElement('div');rows.className='r127-enid-rows';
     for(const [key,label]of [['medicine','Medicine / Clinic'],['trading','Trading / General Store'],['mechanics','Mechanics / Workshop'],['banking','Banking / Bank']]){
       const score=Math.max(0,Math.min(5,Number(a[key])||0));
       const row=document.createElement('div');row.className='r127-enid-row';
       const title=document.createElement('span');title.textContent=label;
       const stars=document.createElement('span');stars.className='r127-enid-stars';
       stars.textContent='★'.repeat(score)+'☆'.repeat(5-score)+'  '+score+'/5';
       row.append(title,stars);rows.append(row);
     }
     details.append(rows);
     const full=document.createElement('button');full.type='button';full.textContent='ENID — FULL PROFILE / PORTRAIT';
     full.addEventListener('click',()=>{
       if(globalThis.Route127WandererInfo)globalThis.Route127WandererInfo.open('Enid',portrait);
     });
     details.append(full);
     e.choices.after(details);
   }catch(error){console.warn('DEVTEST Enid rendering/recruitment:',error);}
   return result;
 };
 globalThis.Route127FenceArtist=Object.freeze({art,portrait,phase});
})();
