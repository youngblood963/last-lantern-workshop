/* DEVTEST ONLY — arena backgrounds and six solo tournament combatant sprites.
 * Presentation only. Live HP comes from combatState; the underlying tournament
 * code controls hand-to-hand damage, rounds, payouts, retreat and save states.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
 const base=new URL('../devtest/',document.baseURI);
 const image=file=>new URL('assets/enemies/'+file,base).href;
 const backdrop=key=>new URL(key==='ring'?'../../the_fighting_ring.png':'../../the_forgotten_arena.png',base).href;
 const actors={
  ring:['arena_scrapper.png','arena_bruiser.png','arena_the_hammer.png'],
  grave:['arena_drifter.png','arena_ironback.png','arena_gravekeeper.png']
 };
 const encounterKey=()=>{
  if(typeof stage!=='undefined'&&stage==='encounter'&&typeof currentEncounter==='function'){
   const title=String(currentEncounter()?.title||'').toUpperCase().replace(/^EAST ROAD — /,'');
   if(title==='THE FIGHTING RING')return 'ring';
   if(title==='THE FORGOTTEN ARENA')return 'grave';
  }
  return null;
 };
 const current=()=>{
  const c=typeof combatState==='undefined'?null:combatState;
  if(c?.source==='r18TournamentFight'&&['combat','combatItems'].includes(stage)&&!c.r18TrainingDevice){
   const key=c.r18TournamentKey,round=Number(c.r18TournamentRound);
   if(actors[key]&&Number.isInteger(round)&&round>=0&&round<3)return {key,round,combat:c};
  }
  if(stage==='r18Tournament'&&typeof player!=='undefined'){
   const key=player.flags?.r18TournamentFocus;
   if(key==='ring'||key==='grave')return {key,round:-1,combat:null};
  }
  const key=encounterKey();return key?{key,round:-1,combat:null}:null;
 };
 const oldModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const model=oldModel.apply(this,args),state=current();
  if(model.active&&state){
   model.art=backdrop(state.key);
   model.title=state.key==='ring'?'THE FIGHTING RING':'THE FORGOTTEN ARENA';
   model.regionalSky=null;
  }
  return model;
 };
 const css=document.createElement('style');css.id='r127-arena-combatants-styles';
 css.textContent=`
 .gfx-art.r127-arena-stage{position:relative;isolation:isolate;overflow:hidden}
 .gfx-art.r127-arena-stage>.gfx-image{object-fit:contain!important;object-position:center!important}
 .gfx-art.r127-arena-stage>.r127-arena-fighter{position:absolute;inset:0;z-index:7;display:flex;align-items:flex-end;justify-content:center;pointer-events:none;box-sizing:border-box;padding:2% 2% 4%}
 .gfx-art.r127-arena-stage .r127-arena-target{pointer-events:auto;display:flex;align-items:center;justify-content:flex-end;flex-direction:column;gap:4px;cursor:pointer;border:0!important;background:transparent!important;box-shadow:none!important;padding:0!important;margin:0!important;width:min(72%,560px);height:98%;min-height:0!important;color:#fff}
 .gfx-art.r127-arena-stage .r127-arena-target img{display:block;width:100%;height:calc(100% - 42px);min-height:0;object-fit:contain;object-position:center bottom;filter:drop-shadow(3px 7px 7px #000c)}
 .gfx-art.r127-arena-stage .r127-arena-hp{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:clamp(160px,37%,310px);max-width:100%;box-sizing:border-box;background:#1c0d0deb;border:1px solid #b46f54;border-radius:5px;padding:4px 9px;color:#fff;box-shadow:0 2px 12px #000a;font-family:system-ui,sans-serif}
 .gfx-art.r127-arena-stage .r127-arena-hp .r127-factory-boss-track{width:100%;margin-top:2px}
 .gfx-art.r127-arena-stage .r127-arena-hp .r127-factory-boss-count{margin-top:0}
 .gfx-frame.r127-arena-combat .gfx-main>.gfx-combat{display:none!important}
 .gfx-art.r127-arena-stage>.r127-regional-sky{display:none!important}
 @media(max-width:600px){
  .gfx-art.r127-arena-stage>.r127-arena-fighter{padding:2% 1% 4%}
  .gfx-art.r127-arena-stage .r127-arena-target{width:92%;height:98%}
  .gfx-art.r127-arena-stage .r127-arena-hp{min-width:145px;padding:3px 7px}
 }
 `;
 document.head.append(css);
 const oldSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=oldSync.apply(this,args);
  try{
   const e=this.element;if(!e?.figure)return result;
   const state=current(),shown=!!state&&!e.frame.hidden&&this.preference()==='graphics';
   e.figure.classList.toggle('r127-arena-stage',shown);
   let layer=e.figure.querySelector(':scope > .r127-arena-fighter');
   const fighting=shown&&!!state.combat;
   if(!fighting){
    layer?.remove();e.frame.classList.remove('r127-arena-combat');return result;
   }
   const file=actors[state.key][state.round];
   if(!layer||layer.dataset.file!==file){
    layer?.remove();
    layer=document.createElement('div');layer.className='r127-arena-fighter';layer.dataset.file=file;
    const button=document.createElement('button');button.type='button';button.className='r127-arena-target';
    const sprite=document.createElement('img');sprite.src=image(file);sprite.alt='';
    sprite.onerror=()=>{
     layer?.remove();e.frame.classList.remove('r127-arena-combat');
     console.warn('Arena fighter artwork missing:',file);
    };
    const hp=document.createElement('div');hp.className='r127-arena-hp';
    const name=document.createElement('strong');name.className='r127-factory-boss-name';
    const bar=document.createElement('div');bar.className='r127-factory-boss-track';bar.setAttribute('role','progressbar');bar.setAttribute('aria-valuemin','0');
    const fill=document.createElement('div');fill.className='r127-factory-boss-fill';bar.append(fill);
    const value=document.createElement('span');value.className='r127-factory-boss-count';
    hp.append(name,bar,value);button.append(sprite,hp);layer.append(button);e.figure.append(layer);
    button.addEventListener('click',()=>{if(typeof busy!=='undefined'&&busy)return;if(typeof handleCommand==='function')handleCommand('attack');});
   }
   const c=state.combat,hp=Math.max(0,Number(c.hp)||0),max=Math.max(1,Number(c.maxHp)||1);
   layer.querySelector('.r127-factory-boss-name').textContent=c.name;
   const bar=layer.querySelector('.r127-factory-boss-track');
   bar.setAttribute('aria-valuenow',String(hp));bar.setAttribute('aria-valuemax',String(max));
   layer.querySelector('.r127-factory-boss-fill').style.width=Math.max(0,Math.min(100,hp/max*100))+'%';
   layer.querySelector('.r127-factory-boss-count').textContent=Math.ceil(hp)+' / '+Math.ceil(max)+' HP';
   layer.querySelector('button').setAttribute('aria-label','Attack '+c.name+', '+Math.ceil(hp)+' of '+Math.ceil(max)+' HP');
   e.frame.classList.add('r127-arena-combat');
  }catch(error){console.warn('DEVTEST arena character art:',error);}
  return result;
 };
 GraphicalUI.schedule();
})();
