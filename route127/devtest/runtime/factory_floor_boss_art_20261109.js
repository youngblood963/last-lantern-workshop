/* DEVTEST-only Factory floor backgrounds and four illustrated boss HP overlays.
 * Read existing dungeon completion and live combat HP. No save/combat changes. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||typeof GraphicalUI==='undefined')return;
const floors=[
 {name:'Loading & Receiving',scene:'factory_loading_receiving.png',boss:'SALVAGE KING',art:'factory_salvage_king.png'},
 {name:'Production & Assembly',scene:'factory_production_assembly.png',boss:'GRINDER',art:'factory_grinder.png'},
 {name:'Chemical Processing',scene:'factory_chemical_processing.png',boss:'THE CHEMIST',art:'factory_chief_chemist.png'},
 {name:'Restricted Basement',scene:'factory_restricted_basement.png',boss:'THE FOREMAN',art:'factory_foreman.png'}
];
const root='../devtest/assets/locations/';
function state(){
 const s=String(typeof stage==='undefined'?'':stage);
 const c=typeof combatState==='undefined'?null:combatState;
 const inDungeon=/^factoryDungeon(?:Floor|Room)$/.test(s);
 const inFight=!!c&&c.source==='factoryFight';
 if(!inDungeon&&!inFight)return null;
 const d=player?.flags?.factoryDungeon;
 const floor=Number(d?.floor),room=Number(d?.room);
 if(!Number.isInteger(floor)||floor<0||floor>=floors.length)return null;
 const floorInfo=typeof FACTORY_FLOORS==='undefined'?null:FACTORY_FLOORS[floor];
 const bossRoom=room===floorInfo?.rooms?.length-1;
 const completed=Array.isArray(d?.done)&&d.done.includes(floor);
 const bossCombat=inFight&&String(c.name||'').toUpperCase()===floors[floor].boss;
 const bossScene=bossCombat||(s==='factoryDungeonRoom'&&bossRoom&&!completed);
 return {floor,info:floors[floor],bossScene,bossCombat,combat:c};
}
const previousModel=GraphicalUI.model;
GraphicalUI.model=function(...args){
 const m=previousModel.apply(this,args),f=state();
 if(f){m.art=root+(f.bossScene?f.info.art:f.info.scene);m.title=f.bossScene?f.info.boss:f.info.name;}
 return m;
};
const style=document.createElement('style');
style.textContent=`
.gfx-frame.r127-factory-boss-active .gfx-main>.gfx-combat{display:none!important}
.gfx-frame .r127-factory-boss-hp{position:absolute;z-index:5;bottom:12px;left:50%;transform:translateX(-50%);width:clamp(160px,43%,350px);box-sizing:border-box;background:#1c0d0deb;border:1px solid #b46f54;border-radius:5px;padding:6px 9px;color:#fff;text-align:center;pointer-events:none;box-shadow:0 2px 12px #000a;font-family:system-ui,sans-serif}
.r127-factory-boss-name{display:block;font-weight:800;font-size:clamp(12px,1.6vw,16px);letter-spacing:.05em;text-shadow:0 1px 2px #000}
.r127-factory-boss-track{height:13px;margin-top:5px;border:1px solid #d08a82;background:#330c0c;border-radius:3px;overflow:hidden}
.r127-factory-boss-fill{height:100%;width:100%;background:#d42d32;transition:width .16s ease}
.r127-factory-boss-count{display:block;margin-top:3px;font-weight:700;font-size:clamp(11px,1.3vw,14px)}
`;
document.head.append(style);
const previousSync=GraphicalUI.sync;
GraphicalUI.sync=function(...args){
 const result=previousSync.apply(this,args),e=this.element;
 if(!e?.figure)return result;
 const f=state(),active=!!f?.bossCombat&&!e.frame.hidden;
 e.frame.classList.toggle('r127-factory-boss-active',active);
 let overlay=e.figure.querySelector('.r127-factory-boss-hp');
 if(!active){overlay?.remove();return result;}
 if(!overlay){
  overlay=document.createElement('div');overlay.className='r127-factory-boss-hp';
  overlay.innerHTML='<strong class="r127-factory-boss-name"></strong><div class="r127-factory-boss-track" role="progressbar" aria-valuemin="0"><div class="r127-factory-boss-fill"></div></div><span class="r127-factory-boss-count"></span>';
  e.figure.append(overlay);
 }
 const c=f.combat,enemy=Array.isArray(c.enemies)&&c.enemies.length===1?c.enemies[0]:c;
 const hp=Math.max(0,Number(enemy.hp)||0),max=Math.max(1,Number(enemy.maxHp)||Number(c.maxHp)||1);
 overlay.querySelector('.r127-factory-boss-name').textContent=f.info.boss;
 const track=overlay.querySelector('.r127-factory-boss-track');
 track.setAttribute('aria-valuenow',String(hp));track.setAttribute('aria-valuemax',String(max));
 overlay.querySelector('.r127-factory-boss-fill').style.width=Math.min(100,hp/max*100)+'%';
 overlay.querySelector('.r127-factory-boss-count').textContent=Math.ceil(hp)+' / '+Math.ceil(max)+' HP';
 return result;
};
GraphicalUI.schedule();
})();
