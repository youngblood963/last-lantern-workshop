/* DEVTEST ONLY — County Work Truck -> Depot -> Unit 07 artwork.
 * Read existing quest/road/combat flags; no gameplay, encounter odds, rewards,
 * world clock, map geometry, recruit eligibility, or save changes.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
 const asset=(folder,file)=>new URL('assets/'+folder+'/'+file,new URL('../devtest/',document.baseURI)).href;
 const regionBase=new URL('../../assets/regions/',document.currentScript.src);
 const truck=asset('scenarios','county_work_truck.png');
 const exterior=asset('scenarios','county_depot_exterior.png');
 const interior=asset('scenarios','county_depot_interior.png');
 const unit=asset('enemies','county_unit_07.png');
 const title=()=>String(typeof currentEncounter==='function'?currentEncounter()?.title||'':'').toUpperCase();
 const countyRoad=()=>typeof stage!=='undefined'&&stage==='encounter'&&title()==='COUNTY WORK TRUCK';
 const depot=()=>typeof stage!=='undefined'&&stage==='r18Depot';
 const fight=()=>typeof stage!=='undefined'&&['combat','combatItems'].includes(stage)&&
  typeof combatState!=='undefined'&&combatState?.name==='COUNTY UNIT 07';
 const scene=()=>{
  if(fight())return 'fight';
  if(depot())return 'interior';
  if(countyRoad()){
   // Once the worker reveals the county map, the trail leads toward the depot.
   // RETURN TO TRUCK immediately restores the original truck artwork.
   const q=typeof r18CountyTruckScene==='function'?r18CountyTruckScene():null;
   return q?.followed&&player?.flags?.r18CountyMapSeen?'exterior':'truck';
  }
  return null;
 };
 const previousModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const m=previousModel.apply(this,args);
  const mode=scene();
  if(!mode||!m.active)return m;
  m.art=mode==='truck'?truck:mode==='exterior'?exterior:interior;
  m.regionalSky=null; // prevent inherited sky from spilling inside the windowless depot
  m.title=mode==='truck'?'COUNTY WORK TRUCK':mode==='exterior'?'COUNTY MAINTENANCE DEPOT':
    mode==='fight'?'COUNTY UNIT 07':'COUNTY MAINTENANCE DEPOT';
  return m;
 };
 const style=document.createElement('style');
 style.id='r127-county-depot-art';
 style.textContent=`
 .gfx-art.r127-county-art{position:relative;isolation:isolate;background:#211a14!important}
 .gfx-art.r127-county-art>.r127-county-backdrop{position:absolute;inset:0;z-index:0;pointer-events:none;background-position:center;background-size:cover}
 .gfx-art.r127-county-art>.r127-county-backdrop .r127-county-region{position:absolute;inset:0;background-position:center;background-size:cover;pointer-events:none}
 .gfx-art.r127-county-art>.gfx-image{position:relative;z-index:1;object-fit:contain;object-position:center bottom;background:transparent!important}
 .gfx-art.r127-county-art>.gfx-art-caption{z-index:8}
 .gfx-art.r127-county-art[data-county-period="night"]>.gfx-image{filter:brightness(.66) saturate(.75)}
 .gfx-art.r127-county-art[data-county-period="dawn"]>.gfx-image{filter:brightness(.9) sepia(.1)}
 .gfx-art.r127-county-art[data-county-period="dusk"]>.gfx-image{filter:brightness(.83) sepia(.2)}
 .gfx-art.r127-county-art[data-county-mode="interior"]>.gfx-image,
 .gfx-art.r127-county-art[data-county-mode="fight"]>.gfx-image{filter:none!important}
 .gfx-art .r127-county-unit{position:absolute;inset:0;z-index:5;display:flex;justify-content:center;align-items:flex-end;pointer-events:none}
 .gfx-art .r127-county-unit>img{height:91%;width:77%;object-fit:contain;object-position:center bottom;filter:drop-shadow(4px 6px 7px #000b)}
 .gfx-art .r127-county-unit>.r127-county-attack{position:absolute;inset:2% 12% 7%;padding:0;border:0;background:transparent;cursor:pointer;pointer-events:auto;display:flex;align-items:flex-end;justify-content:center}
 .gfx-art .r127-county-unit>.r127-county-attack>img{height:100%;width:100%;object-fit:contain;object-position:center bottom;filter:drop-shadow(4px 6px 7px #000b)}
 .gfx-art .r127-county-hp{position:absolute;bottom:5px;left:50%;transform:translateX(-50%);width:clamp(150px,46%,330px);box-sizing:border-box;background:#1d100fee;border:1px solid #b65c4c;border-radius:4px;padding:4px 7px;color:#ffdbcc;font:700 12px system-ui;text-align:center;pointer-events:none}
 .gfx-art .r127-county-track{height:10px;background:#360d0e;border:1px solid #a34744;border-radius:3px;overflow:hidden;margin:3px 0}
 .gfx-art .r127-county-fill{height:100%;background:#d72e32}
 .gfx-frame.r127-county-unit-fight .gfx-combat{display:none!important}
 @media(max-width:600px){.gfx-art .r127-county-unit>img{width:90%}.gfx-art .r127-county-unit>.r127-county-attack{inset:2% 5% 7%}}
 `;
 document.head.append(style);
 const previousSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=previousSync.apply(this,args);
  try{
   const e=this.element;if(!e?.figure)return result;
   const mode=!e.frame.hidden&&this.preference()==='graphics'&&!e.figure.hidden?scene():null;
   const fig=e.figure;fig.classList.toggle('r127-county-art',!!mode);
   e.frame.classList.toggle('r127-county-unit-fight',mode==='fight');
   let background=fig.querySelector('.r127-county-backdrop');
   let robot=fig.querySelector('.r127-county-unit');
   if(!mode){background?.remove();robot?.remove();delete fig.dataset.countyMode;delete fig.dataset.countyPeriod;return result;}
   fig.dataset.countyMode=mode;
   const period=typeof Route127RegionalSky?.phase==='function'?
    Route127RegionalSky.phase(player.flags?.worldHour):'day';
   fig.dataset.countyPeriod=period;
   if(mode==='truck'||mode==='exterior'){
    if(!background){
     background=document.createElement('div');background.className='r127-county-backdrop';
     background.setAttribute('aria-hidden','true');
     const region=document.createElement('div');region.className='r127-county-region';background.append(region);
     fig.insertBefore(background,e.img);
    }
    // Truck: region landscape + regional sky behind transparent truck pixels.
    // Exterior: sky alone (no region landscape), as requested.
    const regionKey=typeof route127CurrentRegion==='function'?route127CurrentRegion(lanternState()):'CENTRAL';
    const row=Route127RegionalSky?.regions?.[regionKey]||Route127RegionalSky?.regions?.CENTRAL;
    const skyFile=period==='dusk'?'sky_dawn.png':'sky_'+period+'.png';
    background.style.backgroundImage='url("'+new URL(skyFile,regionBase).href+'")';
    background.style.filter=period==='dusk'?'sepia(.35) saturate(.85)':'';
    const ground=background.firstElementChild;
    ground.style.display=mode==='truck'?'':'none';
    if(mode==='truck'&&row){
     const file=period==='dusk'?row[1]:row[0];
     ground.style.backgroundImage='url("'+new URL(file,regionBase).href+'")';
    }
   }else background?.remove();
   const q=player?.flags?.r18CountyDepot;
   const showUnit=(mode==='fight'||mode==='interior'&&q&&!q.neutralized);
   if(!showUnit){robot?.remove();return result;}
   if(!robot){
    robot=document.createElement('div');robot.className='r127-county-unit';
    robot.setAttribute('aria-label','County Unit 07');
    fig.append(robot);
   }
   if(mode==='interior'){
    if(robot.dataset.mode!=='interior'){
     robot.replaceChildren();const img=document.createElement('img');img.src=unit;img.alt='County Unit 07';robot.append(img);
     robot.dataset.mode='interior';
    }
    return result;
   }
   const c=combatState;
   const enemy=Array.isArray(c?.enemies)&&c.enemies.length===1?c.enemies[0]:c;
   const hp=Math.max(0,Number(enemy?.hp)||0),max=Math.max(1,Number(enemy?.maxHp)||Number(c?.maxHp)||1);
   if(hp<=0){robot.remove();return result;}
   if(robot.dataset.mode!=='fight'){
    robot.replaceChildren();robot.dataset.mode='fight';
    const attack=document.createElement('button');attack.className='r127-county-attack';attack.type='button';
    attack.setAttribute('aria-label','Attack County Unit 07');
    const img=document.createElement('img');img.src=unit;img.alt='';attack.append(img);
    attack.addEventListener('click',()=>{if(typeof busy!=='undefined'&&busy)return;if(typeof handleCommand==='function')handleCommand('attack');});
    const meter=document.createElement('div');meter.className='r127-county-hp';
    meter.innerHTML='<span>COUNTY UNIT 07</span><div class="r127-county-track" role="progressbar" aria-valuemin="0"><div class="r127-county-fill"></div></div><span class="r127-county-count"></span>';
    robot.append(attack,meter);
   }
   const bar=robot.querySelector('[role="progressbar"]');
   if(bar){bar.setAttribute('aria-valuemax',String(max));bar.setAttribute('aria-valuenow',String(hp));}
   const fill=robot.querySelector('.r127-county-fill');if(fill)fill.style.width=Math.max(0,Math.min(100,hp/max*100))+'%';
   const count=robot.querySelector('.r127-county-count');if(count)count.textContent=Math.ceil(hp)+' / '+Math.ceil(max)+' HP';
  }catch(err){console.warn('DEVTEST County Depot art:',err);}
  return result;
 };
 GraphicalUI.schedule();
})();
