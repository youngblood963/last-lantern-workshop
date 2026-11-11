/* DEVTEST — THE SHATTERED SILO
 * The approved ruined silo/road remains the environment, with a shared WO45
 * day/dawn/night sky behind its transparency. Three individual boars retain
 * engine-authoritative HP and attack targeting; defeated boars vanish.
 * Presentation only — no changes to encounter options, RNG, saves or damage.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||
    !/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||
    typeof GraphicalUI==='undefined')return;
 const base=new URL('../devtest/assets/scenarios/',document.baseURI);
 const asset=file=>new URL(file,base).href;
 const silo=asset('the_shattered_silo.png');
 const sprites=[asset('silo_king.png'),asset('razorback.png'),asset('young_boar.png')];
 const skies=new URL('../../assets/regions/',document.currentScript.src);
 const backdrop=file=>new URL(file,skies).href;
 const getPhase=hour=>globalThis.Route127RegionalSky?.phase
  ?Route127RegionalSky.phase(hour)
  :((h)=>h>=5&&h<7?'dawn':h>=7&&h<18?'day':h>=18&&h<20?'dusk':'night')(((Number(hour??8)%24)+24)%24);
 function state(){
  const s=typeof stage==='undefined'?'':stage;
  const combat=typeof combatState==='undefined'?null:combatState;
  const fighting=!!combat&&['combat','combatItems'].includes(s)&&
   (combat.r18SiloBoars===true||String(combat.name||'').toUpperCase()==='SILO KING AND BOARS');
  const encounter=s==='encounter'&&typeof currentEncounter==='function'&&
   currentEncounter()?.title==='THE SHATTERED SILO';
  return {visible:encounter||fighting,fighting,combat};
 }
 const previousModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const m=previousModel.apply(this,args),s=state();
  if(s.visible){
   m.art=silo;m.title='THE SHATTERED SILO';m.regionalSky=null;
  }
  return m;
 };
 const css=document.createElement('style');
 css.textContent=`
 .gfx-art.r127-silo-scene{position:relative;isolation:isolate;background:#1b1b18!important}
 .gfx-art.r127-silo-scene>.r127-silo-sky{position:absolute;inset:0;z-index:0;pointer-events:none;background-size:cover;background-position:center}
 .gfx-art.r127-silo-scene>.gfx-image{position:relative;z-index:1;width:100%;height:100%;object-fit:contain;object-position:center bottom;background:transparent!important}
 .gfx-art.r127-silo-scene>.gfx-art-caption{z-index:8}
 .gfx-art.r127-silo-scene[data-silo-period="night"]>.gfx-image{filter:brightness(.64) saturate(.7) hue-rotate(165deg)}
 .gfx-art.r127-silo-scene[data-silo-period="dawn"]>.gfx-image{filter:brightness(.91) sepia(.13)}
 .gfx-art.r127-silo-scene[data-silo-period="dusk"]>.gfx-image{filter:brightness(.84) sepia(.15)}
 .r127-silo-boars{position:absolute;inset:0;z-index:5;pointer-events:none;overflow:hidden}
 .gfx-frame .r127-silo-boar{position:absolute;display:block;transform:translate(-50%,-50%);padding:0!important;margin:0;border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;background-image:none!important;min-height:0!important;color:#fff;pointer-events:none}
 .r127-silo-boar img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;max-height:none!important;filter:drop-shadow(2px 7px 5px #000c)}
 .gfx-frame .r127-silo-boar.is-combat{cursor:pointer;pointer-events:auto}
 .gfx-frame .r127-silo-boar.is-combat:hover,.gfx-frame .r127-silo-boar.is-combat:focus-visible{outline:2px solid #edb35d!important}
 .r127-silo-boar[data-index="0"]{left:51%;top:67%;width:46%;height:67%;z-index:3}
 .r127-silo-boar[data-index="1"]{left:19%;top:70%;width:31%;height:49%;z-index:2}
 .r127-silo-boar[data-index="2"]{left:81%;top:76%;width:23%;height:38%;z-index:4}
 .gfx-frame.r127-silo-fight .gfx-combat,.gfx-frame.r127-silo-fight .gfx-main>.gfx-combat{display:none!important}
 .r127-silo-hp{position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:90%;max-width:170px;z-index:6;padding:3px 4px;box-sizing:border-box;background:#210a0af0;border:1px solid #b35c51;border-radius:4px;text-align:center;font:700 clamp(9px,1.05vw,12px) system-ui,sans-serif;white-space:nowrap;color:#fff}
 .r127-silo-hp-name{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .r127-silo-hp-track{display:block;height:8px;margin:3px 0;background:#390b0b;border:1px solid #ae504c;border-radius:2px;overflow:hidden}
 .r127-silo-hp-fill{display:block;background:#d42d32;height:100%;width:100%;transition:width .15s}
 @media(max-width:650px){
 .r127-silo-boar[data-index="0"]{width:49%;height:64%}
 .r127-silo-boar[data-index="1"]{width:34%;height:46%}
 .r127-silo-boar[data-index="2"]{width:26%;height:36%}
 .r127-silo-hp{font-size:9px;padding:2px;max-width:100%}
 }
 `;
 document.head.append(css);
 let lastCombat=null;
 const previousSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=previousSync.apply(this,args);
  try{
   const e=this.element;if(!e?.figure)return result;
   const stateNow=state();
   const active=stateNow.visible&&!e.frame.hidden&&this.preference()==='graphics'&&!e.figure.hidden;
   const combatActive=active&&stateNow.fighting;
   e.figure.classList.toggle('r127-silo-scene',active);
   e.frame.classList.toggle('r127-silo-fight',combatActive);
   let skyEl=e.figure.querySelector('.r127-silo-sky');
   let group=e.figure.querySelector('.r127-silo-boars');
   if(!active){
    skyEl?.remove();group?.remove();delete e.figure.dataset.siloPeriod;lastCombat=null;
    return result;
   }
   if(!skyEl){
    skyEl=document.createElement('div');skyEl.className='r127-silo-sky';
    skyEl.setAttribute('aria-hidden','true');e.figure.insertBefore(skyEl,e.img);
   }
   const period=getPhase(player.flags?.worldHour);
   const region=typeof route127CurrentRegion==='function'?route127CurrentRegion(lanternState()):'EAST';
   // WO45 retains original painted region at dusk (no sky_dusk asset).
   const regional={EAST:'east.png',CENTRAL:'central.png'};
   skyEl.style.backgroundImage='url("'+backdrop(period==='dusk'?(regional[region]||'east.png'):'sky_'+period+'.png')+'")';
   e.figure.dataset.siloPeriod=period;
   const c=stateNow.combat;
   if(!group||group.dataset.preview!==(combatActive?'0':'1')||(combatActive&&lastCombat!==c)){
    group?.remove();
    group=document.createElement('div');group.className='r127-silo-boars';
    group.dataset.preview=combatActive?'0':'1';group.setAttribute('aria-label','Silo boars');
    e.figure.append(group);lastCombat=combatActive?c:null;
   }
   for(let i=0;i<3;i++){
    const enemy=combatActive?(Array.isArray(c.enemies)?c.enemies[i]:null):null;
    const hp=enemy?Math.max(0,Number(enemy.hp)||0):0;
    let unit=group.querySelector('[data-index="'+i+'"]');
    if(combatActive&&(!enemy||hp<=0)){unit?.remove();continue;}
    if(!unit){
     unit=document.createElement('button');unit.type='button';
     unit.className='r127-silo-boar'+(combatActive?' is-combat':'');
     unit.dataset.index=String(i);
     if(!combatActive){unit.tabIndex=-1;unit.setAttribute('aria-hidden','true');}
     const img=document.createElement('img');
     img.src=sprites[i]+'?v=silo-1';img.alt='';img.decoding='async';img.draggable=false;
     img.onerror=()=>{console.warn('Missing Silo boar image:',sprites[i]);unit.remove();};
     unit.append(img);
     if(combatActive){
      const meter=document.createElement('span');meter.className='r127-silo-hp';
      meter.innerHTML='<span class="r127-silo-hp-name"></span><span class="r127-silo-hp-track" role="progressbar" aria-valuemin="0"><span class="r127-silo-hp-fill"></span></span><span class="r127-silo-hp-count"></span>';
      unit.append(meter);
      unit.addEventListener('click',()=>{
       if(typeof busy!=='undefined'&&busy)return;
       if(typeof handleCommand==='function')handleCommand('attack '+(i+1));
      });
     }
     group.append(unit);
    }
    if(!combatActive)continue;
    const max=Math.max(1,Number(enemy.maxHp)||hp);
    unit.setAttribute('aria-label','Attack '+enemy.name+', '+hp+' of '+max+' HP');
    const meter=unit.querySelector('.r127-silo-hp');
    meter.querySelector('.r127-silo-hp-name').textContent=enemy.name;
    meter.querySelector('.r127-silo-hp-count').textContent=Math.ceil(hp)+' / '+Math.ceil(max);
    const track=meter.querySelector('.r127-silo-hp-track');
    track.setAttribute('aria-valuenow',String(hp));
    track.setAttribute('aria-valuemax',String(max));
    meter.querySelector('.r127-silo-hp-fill').style.width=Math.min(100,hp/max*100)+'%';
   }
  }catch(error){console.warn('Shattered Silo visual presentation:',error);}
  return result;
 };
 GraphicalUI.schedule();
})();
