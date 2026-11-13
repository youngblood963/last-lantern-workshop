/* DEVTEST ONLY — owner's final scenario artwork assignments.
 * Visual-only: no changes to encounter decisions, combat math, rewards, saves or world clock.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
 const base=new URL('../devtest/',document.baseURI);
 const scenario=file=>new URL('assets/scenarios/'+file,base).href;
 const enemy=file=>new URL('assets/enemies/'+file,base).href;
 const region=file=>new URL('../assets/regions/'+file,base).href;
 const normalize=name=>String(name||'').toUpperCase().replace(/^EAST ROAD — /,'').trim();
 const settings={
  'THE MUD CANNON':{art:'the_mud_cannon.gif',backdrop:'standalone'},
  'SHUTTERED ROADSIDE CAFE':{art:'the_last_special.png',backdrop:'standalone'},
  'THE LAST SPECIAL — ROADHOUSE HASH':{art:'the_last_special.png',backdrop:'standalone'},
  'THE HOLLOW STATUE':{art:'the_hollow_statue.png',backdrop:'standalone'},
  'THE IRON CHOIR':{art:'the_iron_choir.png',backdrop:'sky',id:'east:6',
   units:['iron_choir_valve_raider.png','iron_choir_patrol_raider.png']},
  'THE SCRAP DUEL':{art:'the_scrap_duel.png',backdrop:'sky',id:'east:11',
   units:['hubcap_champion.png']},
  'THE GAS STATION':{art:'the_gas_station.png',backdrop:'road'},
  'THE STRANDED HANDCART':{art:'the_last_stop.png',backdrop:'regional'},
  'THE LAST STOP':{art:'the_last_stop.png',backdrop:'regional'}
 };
 // Set the exact Scrap Duel ID from the loaded registry when available; never use
 // display-name changes to mutate canonical save IDs.
 const encounter=()=>typeof currentEncounter==='function'?currentEncounter():null;
 const fighting=()=>typeof combatState!=='undefined'&&combatState&&
   ['combat','combatItems'].includes(typeof stage==='undefined'?'':stage);
 function current(){
  const state=typeof stage==='undefined'?'':stage;
  if(state!=='encounter'&&!fighting())return null;
  const c=fighting()?combatState:null;
  if(c&&normalize(c.name)==='IRON CHOIR RAIDERS')return {title:'THE IRON CHOIR',...settings['THE IRON CHOIR'],fight:true};
  if(c&&normalize(c.name)==='HUBCAP CHAMPION')return {title:'THE SCRAP DUEL',...settings['THE SCRAP DUEL'],fight:true};
  const e=encounter(),title=normalize(e?.title),display=normalize(e?.displayName);
  const key=settings[title]?title:settings[display]?display:null;
  if(!key)return null;
  return {title:key,...settings[key],fight:!!c};
 }
 const oldModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const m=oldModel.apply(this,args),spec=current();
  if(spec&&m.active){m.art=scenario(spec.art);m.regionalSky=null;}
  return m;
 };
 const style=document.createElement('style');
 style.textContent=`
 .gfx-art.r127-finish-art{position:relative;isolation:isolate;overflow:hidden;background:#191a1b!important}
 .gfx-art.r127-finish-art>.r127-finish-sky,
 .gfx-art.r127-finish-art>.r127-finish-ground{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
 .gfx-art.r127-finish-art>.r127-finish-sky{z-index:0;background-size:cover;background-position:center;background-repeat:no-repeat}
 .gfx-art.r127-finish-art>.r127-finish-ground{z-index:1;object-fit:fill}
 .gfx-art.r127-finish-art>.gfx-image{position:relative;z-index:2;width:100%;height:100%;object-fit:contain;object-position:center;background:transparent!important}
 .gfx-art.r127-finish-art>.gfx-art-caption{position:relative;z-index:9}
 .gfx-art.r127-finish-art>.r127-regional-sky{display:none!important}
 .gfx-art.r127-finish-art[data-finish-period="night"]>.gfx-image,
 .gfx-art.r127-finish-art[data-finish-period="night"]>.r127-finish-ground{filter:brightness(.64) saturate(.7)}
 .gfx-art.r127-finish-art[data-finish-period="dawn"]>.gfx-image,
 .gfx-art.r127-finish-art[data-finish-period="dawn"]>.r127-finish-ground{filter:brightness(.91) sepia(.13)}
 .gfx-art.r127-finish-art[data-finish-period="dusk"]>.gfx-image,
 .gfx-art.r127-finish-art[data-finish-period="dusk"]>.r127-finish-ground{filter:brightness(.83) sepia(.16)}
 .gfx-art .r127-finish-fighters{position:absolute;inset:0;z-index:6;pointer-events:none}
 .gfx-art .r127-finish-fighter{position:absolute;left:var(--fx,50%);top:var(--fy,55%);
  width:var(--fw,40%);height:var(--fh,82%);transform:translate(-50%,-50%) scale(var(--fs,1));
  display:flex;flex-direction:column;align-items:center;justify-content:flex-end;
  border:0;background:transparent;box-shadow:none;padding:0;pointer-events:auto;cursor:pointer}
 .gfx-art .r127-finish-fighter[hidden]{display:none!important}
 .gfx-art .r127-finish-fighter img{min-height:0;width:100%;height:calc(100% - 29px);object-fit:contain;object-position:center bottom;
  filter:drop-shadow(3px 6px 5px #000a)}
 .gfx-art .r127-finish-fighter[data-flip="true"] img{transform:scaleX(-1)}
 .gfx-art .r127-finish-fighter .r127-finish-hp{flex:none;display:block;min-height:25px;box-sizing:border-box;
  color:#ffaba4;background:#32100e;border:1px solid #aa413b;border-radius:4px;
  padding:3px 7px;font:700 clamp(12px,1.4vw,17px)/1.2 sans-serif;white-space:nowrap}
 .gfx-frame.r127-finish-combat .gfx-combat{display:none!important}
 @media(max-width:600px){.gfx-art .r127-finish-fighter{height:75%;width:48%}}
 `;
 document.head.append(style);
 const previousSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=previousSync.apply(this,args);
  try{
   const e=this.element;if(!e?.figure)return result;
   const fig=e.figure,spec=current();
   const showing=!!spec&&!e.frame.hidden&&this.preference()==='graphics';
   fig.classList.toggle('r127-finish-art',showing);
   e.frame.classList.remove('r127-finish-combat');
   let sky=fig.querySelector(':scope > .r127-finish-sky');
   let ground=fig.querySelector(':scope > .r127-finish-ground');
   let fighters=fig.querySelector(':scope > .r127-finish-fighters');
   if(!showing){sky?.remove();ground?.remove();fighters?.remove();delete fig.dataset.finishPeriod;return result;}
   const phase=typeof Route127RegionalSky?.phase==='function'?
    Route127RegionalSky.phase(player?.flags?.worldHour):'day';
   fig.dataset.finishPeriod=phase;
   if(spec.backdrop==='standalone'){
    sky?.remove();ground?.remove();
   }else{
    if(!sky){sky=document.createElement('div');sky.className='r127-finish-sky';
     sky.setAttribute('aria-hidden','true');fig.insertBefore(sky,e.img);}
    const skyFile=phase==='dusk'?'sky_dawn.png':'sky_'+phase+'.png';
    sky.style.backgroundImage='url("'+region(skyFile)+'")';
    sky.style.filter=phase==='dusk'?'sepia(.42) hue-rotate(-18deg) saturate(1.4)':'';
    const needsGround=spec.backdrop==='road'||spec.backdrop==='regional';
    if(needsGround){
     if(!ground){ground=document.createElement('img');ground.className='r127-finish-ground';
      ground.alt='';ground.setAttribute('aria-hidden','true');ground.draggable=false;fig.insertBefore(ground,e.img);}
     if(spec.backdrop==='road'){
      const road=region('dirt_road_foreground.png');if(ground.src!==road)ground.src=road;
     }else{
      const area=typeof route127CurrentRegion==='function'?
       route127CurrentRegion(lanternState()):'CENTRAL';
      const layers=globalThis.Route127EditorSky?.describe(area,player?.flags?.worldHour);
      const selected=layers?.ground||region((area||'CENTRAL').toLowerCase()+'.png');
      if(ground.src!==selected)ground.src=selected;
      if(layers?.sky)sky.style.backgroundImage='url("'+layers.sky+'")';
     }
    }else ground?.remove();
   }
   const isCombat=!!spec.fight&&!!spec.units?.length&&fighting();
   if(!isCombat){fighters?.remove();return result;}
   const c=combatState,all=Array.isArray(c?.enemies)&&c.enemies.length?c.enemies:[c];
   if(!fighters||fighters.dataset.scene!==spec.title){
    fighters?.remove();fighters=document.createElement('div');fighters.className='r127-finish-fighters';
    fighters.dataset.scene=spec.title;
    spec.units.forEach((file,i)=>{
     const node=document.createElement('button');node.type='button';node.className='r127-finish-fighter';
     node.dataset.index=String(i);node.dataset.file=file;
     const img=document.createElement('img');img.src=enemy(file);img.alt='';
     img.onerror=()=>console.warn('Missing DEVTEST combat sprite:',file);
     const hp=document.createElement('span');hp.className='r127-finish-hp';node.append(img,hp);
     node.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();
      if(typeof busy!=='undefined'&&busy)return;
      if(typeof handleCommand==='function')handleCommand('attack '+(i+1));
     });
     fighters.append(node);
    });
    fig.append(fighters);
   }
   // Owner editor adjustments and published defaults take priority over centered fallback.
   const layout=globalThis.Route127CombatLayouts;
   const rowId=layout?.rows&&[...layout.rows.values()].find(row=>row.title===spec.title)?.id;
   const placed=rowId?layout.get(rowId,'combat',matchMedia('(max-width:600px)').matches?'phone':'desktop'):{};
   [...fighters.children].forEach((node,i)=>{
    const unit=all[i],hp=node.querySelector('.r127-finish-hp');
    node.hidden=!unit||Number(unit.hp)<=0;
    const file=spec.units[i],pos=placed[i+':'+file]||placed['attachment:'+file];
    const x=pos?.x??(spec.units.length===1?50:i===0?32:68);
    const y=pos?.y??59,w=pos?.width??(spec.units.length===1?54:38),h=pos?.height??82;
    node.style.setProperty('--fx',x+'%');node.style.setProperty('--fy',y+'%');
    node.style.setProperty('--fw',w+'%');node.style.setProperty('--fh',h+'%');
    node.style.setProperty('--fs',pos?.scale??1);node.style.zIndex=String(pos?.z??i+2);
    node.dataset.flip=String(!!pos?.flip);
    if(!node.hidden){
     const now=Math.max(0,Number(unit.hp)||0),max=Math.max(now,Number(unit.maxHp)||now||1);
     hp.textContent=now+' / '+max+' HP';node.setAttribute('aria-label','Attack '+(unit.name||'enemy')+' — '+hp.textContent);
    }
   });
   e.frame.classList.add('r127-finish-combat');
  }catch(err){console.warn('DEVTEST final artwork scene:',err);}
  return result;
 };
})();
