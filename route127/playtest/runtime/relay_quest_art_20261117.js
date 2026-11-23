/* DEVTEST Relay Station component discoveries — visual-only artwork.
 * Relay scenario state and awards belong to relay_road_patch.js / WO66.
 * Never infer a relay discovery from the underlying random road encounter.
 */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='PLAYTEST'||typeof GraphicalUI==='undefined')return;

const root=new URL('../devtest/',document.baseURI);
const quest=file=>new URL('assets/quests/'+file,root).href;
const regions=new URL('../assets/regions/',root);
const items=Object.freeze({
 yard:{title:'ANTENNA SERVO',file:'relay_antenna_servo.png',backdrop:'skyDirt'},
 branch:{title:'SHIELDED FEED COUPLER',file:'relay_shielded_feed_coupler.png',backdrop:'regional'},
 east:{title:'SIGNAL-CONDITIONING MODULE',file:'relay_signal_conditioning_module.png',backdrop:'skyDirt'}
});
const selection=()=>{
 const relay=globalThis.DevtestRelayRoad;
 return relay&&stage===relay.sceneStage?items[relay.pending()]||null:null;
};
const graphics=()=>GraphicalUI.preference()==='graphics';
const period=()=>typeof globalThis.Route127RegionalSky?.phase==='function'
 ?globalThis.Route127RegionalSky.phase(player?.flags?.worldHour):'day';
const sky=()=>new URL('sky_'+(period()==='dusk'?'dawn':period())+'.png',regions).href;

const previousModel=GraphicalUI.model;
GraphicalUI.model=function(...args){
 const m=previousModel.apply(this,args),item=selection();
 if(m?.active&&item&&graphics()){
  m.art=quest(item.file);
  m.title='RELAY COMPONENT — '+item.title;
  m.regionalSky=null;
  m.causewayBacking=false;
 }
 return m;
};
const style=document.createElement('style');
style.id='r127-relay-quest-art-style';
style.textContent=`
.gfx-art.r127-relay-quest-art{position:relative;isolation:isolate;overflow:hidden;background:#191d20!important}
.gfx-art.r127-relay-quest-art>:is(.r127-relay-backdrop,.r127-relay-ground){position:absolute;inset:0;z-index:0;background-position:center;background-size:cover;background-repeat:no-repeat;pointer-events:none}
.gfx-art.r127-relay-quest-art>.gfx-image{position:relative;z-index:3!important;width:100%;height:100%;max-width:none;object-fit:contain!important;object-position:center bottom;background:transparent!important;--r127-road-art-shadow:drop-shadow(4px 7px 6px #0009);filter:var(--r127-road-art-shadow)}
.gfx-art.r127-relay-quest-art>.gfx-art-caption{position:relative;z-index:12}
.gfx-art.r127-relay-quest-art>.r127-regional-sky{display:none!important}
/* Random encounter sprites belong to a different event; never overlay a relay discovery. */
.gfx-art.r127-relay-quest-art :is(.r127-raccoon-layer,.r127-road-art,.r127-bat-layer,.r127-human-layer,.r127-road-npc,.r127-npc-scene,.r127-final-sprites,.r127-final-road,.r127-new-figure){display:none!important}
`;
document.head.append(style);

const previousSync=GraphicalUI.sync;
GraphicalUI.sync=function(...args){
 const result=previousSync.apply(this,args);
 try{
  const e=this.element;
  if(!e?.figure)return result;
  const item=!e.frame.hidden&&graphics()?selection():null;
  const on=!!item;
  e.figure.classList.toggle('r127-relay-quest-art',on);
  let layer=e.figure.querySelector(':scope > .r127-relay-backdrop');
  let ground=e.figure.querySelector(':scope > .r127-relay-ground');
  if(!on){layer?.remove();ground?.remove();delete e.figure.dataset.relayPeriod;return result;}
  if(!layer){
   layer=document.createElement('div');layer.className='r127-relay-backdrop';
   layer.setAttribute('aria-hidden','true');e.figure.insertBefore(layer,e.img);
  }
  const region=typeof route127CurrentRegion==='function'
   ?route127CurrentRegion(typeof lanternState==='function'?lanternState():null):'CENTRAL';
  const world=globalThis.Route127EditorSky?.describe?.(region,player?.flags?.worldHour);
  if(!ground){
   ground=document.createElement('div');ground.className='r127-relay-ground';
   ground.setAttribute('aria-hidden','true');layer.after(ground);
  }
  const regional=item.backdrop==='regional';
  const terrain=regional?(world?.ground||new URL(region.toLowerCase()+'.png',regions).href):
   new URL('dirt_road_foreground.png',regions).href;
  layer.style.backgroundImage='url("'+(regional&&world?world.sky:sky())+'")';
  ground.style.backgroundImage='url("'+terrain+'")';
  e.figure.dataset.relayPeriod=world?.period||period();
  if(e.caption)e.caption.textContent='RELAY COMPONENT — '+item.title;
 }catch(error){console.warn('DEVTEST Relay artwork:',error);}
 return result;
};
})();