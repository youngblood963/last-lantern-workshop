/* DEVTEST — The Welded Bus / Mr. Pickens
 * Single approved image (bus, Pickens, road) under the shared day/night skies.
 * Keep the picture through the Pickens encounter AND its combat; use one live
 * red HP meter below Pickens, not a duplicate combat-panel meter.
 * Visual-only: do not touch encounters, turn economy, saves, or combat rules.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||
    !/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||
    typeof GraphicalUI==='undefined')return;
 const image=new URL('../devtest/assets/scenarios/the_welded_bus.png',document.baseURI).href;
 const skyRoot=new URL('../../assets/regions/',document.currentScript.src);
 const sky=file=>new URL(file,skyRoot).href;
 const phase=hour=>globalThis.Route127RegionalSky?.phase
  ?Route127RegionalSky.phase(hour)
  :((h)=>h>=5&&h<7?'dawn':h>=7&&h<18?'day':h>=18&&h<20?'dusk':'night')(((Number(hour??8)%24)+24)%24);
 function state(){
  const s=typeof stage==='undefined'?'':stage;
  const c=typeof combatState==='undefined'?null:combatState;
  const fighting=!!c&&['combat','combatItems'].includes(s)&&
    (c.r18Pickens===true||String(c.name||'').toUpperCase()==='MR PICKENS');
  const encounter=s==='encounter'&&typeof currentEncounter==='function'&&
    currentEncounter()?.title==='THE WELDED BUS';
  return {shown:encounter||fighting,fighting,combat:c};
 }
 const oldModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const m=oldModel.apply(this,args),s=state();
  if(s.shown){
   m.art=image;m.title='THE WELDED BUS';
   // Existing regional sky hooks no longer paint an old region over the road
   // already painted into this transparent encounter illustration.
   m.regionalSky=null;
  }
  return m;
 };
 const css=document.createElement('style');
 css.textContent=`
 .gfx-art.r127-welded-bus{position:relative;background:#201c1a!important;isolation:isolate}
 .gfx-art.r127-welded-bus>.r127-welded-bus-sky{
  position:absolute;inset:0;z-index:0;pointer-events:none;
  background-size:cover;background-position:center}
 .gfx-art.r127-welded-bus>.gfx-image{
  position:relative;z-index:1;width:100%;height:100%;
  object-fit:contain;object-position:center bottom;background:transparent!important}
 .gfx-art.r127-welded-bus>.gfx-art-caption{z-index:6}
 .gfx-art.r127-welded-bus[data-bus-period="night"]>.gfx-image{
  filter:brightness(.64) saturate(.7) hue-rotate(165deg)}
 .gfx-art.r127-welded-bus[data-bus-period="dawn"]>.gfx-image{
  filter:brightness(.9) sepia(.13)}
 .gfx-art.r127-welded-bus[data-bus-period="dusk"]>.gfx-image{
  filter:brightness(.82) sepia(.14)}
 .gfx-frame.r127-pickens-fight .gfx-main>.gfx-combat{display:none!important}
 .gfx-frame.r127-pickens-fight .gfx-combat{display:none!important}
 .gfx-art .r127-pickens-hp{
  position:absolute;left:43%;bottom:3%;transform:translateX(-50%);
  width:clamp(112px,25%,230px);box-sizing:border-box;z-index:7;
  padding:5px 7px;border:1px solid #a84c41;border-radius:4px;
  background:#1c0b0bed;box-shadow:0 3px 9px #000b;
  text-align:center;color:#fff;font:700 clamp(10px,1.2vw,13px) system-ui,sans-serif;
  pointer-events:none}
 .r127-pickens-hp-name{display:block;letter-spacing:.04em;margin-bottom:4px}
 .r127-pickens-hp-track{
  display:block;height:11px;background:#360909;border:1px solid #bf665b;
  border-radius:3px;overflow:hidden}
 .r127-pickens-hp-fill{display:block;height:100%;width:100%;background:#d42d32;transition:width .15s}
 .r127-pickens-hp-count{display:block;margin-top:3px}
 @media(max-width:600px){.gfx-art .r127-pickens-hp{left:43%;bottom:2%;width:clamp(94px,27%,160px);padding:3px 4px}}
 `;
 document.head.append(css);
 const oldSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=oldSync.apply(this,args);
  try{
   const e=this.element;if(!e?.figure)return result;
   const s=state();
   const shown=s.shown&&!e.frame.hidden&&this.preference()==='graphics'&&!e.figure.hidden;
   e.figure.classList.toggle('r127-welded-bus',shown);
   e.frame.classList.toggle('r127-pickens-fight',shown&&s.fighting);
   let backdrop=e.figure.querySelector('.r127-welded-bus-sky');
   let meter=e.figure.querySelector('.r127-pickens-hp');
   if(!shown){backdrop?.remove();meter?.remove();delete e.figure.dataset.busPeriod;return result;}
   if(!backdrop){
    backdrop=document.createElement('div');backdrop.className='r127-welded-bus-sky';
    backdrop.setAttribute('aria-hidden','true');e.figure.insertBefore(backdrop,e.img);
   }
   const period=phase(player.flags?.worldHour);
   // The transparent scene supplies its own road; sky is the only backdrop.
   // At dusk, the existing WO45 system has no separate dusk sky, so retain
   // its painted regional view behind the transparent bus/road cutout.
   const region=typeof route127CurrentRegion==='function'
    ?route127CurrentRegion(lanternState()):'EAST';
   const files={NORTH:'north.png',EAST:'east.png',CENTRAL:'central.png',WEST:'west.png'};
   backdrop.style.backgroundImage='url("'+sky(period==='dusk'?(files[region]||'east.png'):'sky_'+period+'.png')+'")';
   e.figure.dataset.busPeriod=period;
   if(!s.fighting){meter?.remove();return result;}
   const c=s.combat;
   const enemy=Array.isArray(c.enemies)&&c.enemies.length===1?c.enemies[0]:c;
   const hp=Math.max(0,Number(enemy?.hp)||0);
   const max=Math.max(1,Number(enemy?.maxHp)||Number(c.maxHp)||1);
   if(!meter){
    meter=document.createElement('div');meter.className='r127-pickens-hp';
    meter.innerHTML='<strong class="r127-pickens-hp-name">MR. PICKENS</strong><span class="r127-pickens-hp-track" role="progressbar" aria-valuemin="0"><span class="r127-pickens-hp-fill"></span></span><span class="r127-pickens-hp-count"></span>';
    e.figure.append(meter);
   }
   const track=meter.querySelector('.r127-pickens-hp-track');
   track.setAttribute('aria-valuenow',String(hp));
   track.setAttribute('aria-valuemax',String(max));
   meter.querySelector('.r127-pickens-hp-fill').style.width=Math.min(100,hp/max*100)+'%';
   meter.querySelector('.r127-pickens-hp-count').textContent=Math.ceil(hp)+' / '+Math.ceil(max)+' HP';
  }catch(error){console.warn('Welded Bus DEVTEST artwork:',error);}
  return result;
 };
 GraphicalUI.schedule();
})();
