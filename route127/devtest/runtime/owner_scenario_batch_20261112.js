/* DEVTEST ONLY — owner image batch 2026-11-12.
 * Visual wiring only: no quest, RNG, save, combat stats, time, or reward changes.
 * Seaport Post Office is deliberately NOT unlocked here; it requires the Tommy quest.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
 const root=new URL('../devtest/',document.baseURI);
 const scenario=name=>new URL('assets/scenarios/'+name,root).href;
 const enemies=name=>new URL('assets/enemies/'+name,root).href;
 const canonical=()=>String(typeof currentEncounter==='function'?
  (currentEncounter()?.title||''):'').toUpperCase().replace(/^EAST ROAD — /,'').trim();
 const alias=()=>String(typeof currentEncounter==='function'?
  (currentEncounter()?.displayName||''):'').toUpperCase().trim();
 const artByTitle=Object.freeze({
  'THE LOCKED TOOL CHEST':'locked_tool_chest.png',
  'THE BURNT LIBRARY':'burnt_library.png',
  'THE BRIDGE TOLL':'bridge_toll.png',
  'A DRESSING IN THE DUST':'tommy_briggs_roadside.png',
  'TOMMY BRIGGS — POSTAL ENCOUNTER':'tommy_briggs_roadside.png',
  'THE BLADE CART':'runaway_blade_cart.gif',
  'THE DITCH BACKPACK':'abandoned_backpack.png',
  'TORN BACKPACK':'abandoned_backpack.png'
 });
 // Overturned maintenance cart art has not reached DEVTEST: intentionally
 // do not point at an absent asset or substitute unrelated art.
 const previousModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const model=previousModel.apply(this,args);
  if(!model.active||typeof stage==='undefined'||stage!=='encounter')return model;
  const title=canonical(),file=artByTitle[title]||artByTitle[alias()];
  if(file){model.art=scenario(file);model.regionalSky=null;}
  return model;
 };
 const css=document.createElement('style');
 css.textContent=`
 .gfx-art .r127-bone-hunters{position:absolute;inset:0;z-index:6;display:flex;
  align-items:flex-end;justify-content:space-evenly;pointer-events:none;overflow:hidden}
 .gfx-art .r127-bone-unit{height:91%;width:45%;display:flex;flex-direction:column;
  align-items:center;justify-content:flex-end;border:0;background:none;padding:0;
  box-shadow:none;pointer-events:none}
 .gfx-art button.r127-bone-unit{pointer-events:auto;cursor:pointer}
 .gfx-art .r127-bone-unit img{display:block;width:100%;height:calc(100% - 34px);
  object-fit:contain;object-position:center bottom;filter:drop-shadow(3px 6px 5px #000a)}
 .gfx-art .r127-bone-hp{min-height:26px;box-sizing:border-box;display:block;flex:none;
  border:1px solid #aa413b;background:#32100e;color:#ffaaa4;border-radius:4px;
  padding:4px 8px;font:700 clamp(12px,1.45vw,17px)/1 sans-serif;white-space:nowrap}
 .gfx-frame.r127-bone-fight .gfx-combat{display:none!important}
 @media(max-width:600px){.gfx-art .r127-bone-unit{width:49%;height:83%}}
 `;
 document.head.append(css);
 const oldSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=oldSync.apply(this,args);
  try{
   const e=this.element;if(!e?.figure)return result;
   const encounter=canonical(),combat=typeof combatState!=='undefined'?combatState:null;
   const fighting=['combat','combatItems'].includes(stage)&&combat?.r18BoneHunters===true;
   const approach=stage==='encounter'&&(encounter==='THE BONE FLAGS'||alias()==='THE BONE HUNTERS');
   const active=!e.frame.hidden&&this.preference()==='graphics'&&(approach||fighting);
   let layer=e.figure.querySelector('.r127-bone-hunters');
   if(!active){layer?.remove();e.frame.classList.remove('r127-bone-fight');return result;}
   if(!layer){
    layer=document.createElement('div');layer.className='r127-bone-hunters';
    for(const [i,file] of ['bone_hunter_archer.png','bone_hunter_spearman.png'].entries()){
     const unit=document.createElement('div');unit.className='r127-bone-unit';unit.dataset.enemy=String(i);
     const img=document.createElement('img');img.src=enemies(file);img.alt='';
     img.onerror=()=>{layer.remove();e.frame.classList.remove('r127-bone-fight');
      console.warn('Missing Bone Hunter sprite',file);};
     unit.append(img);
     const hp=document.createElement('span');hp.className='r127-bone-hp';hp.hidden=true;
     unit.append(hp);layer.append(unit);
    }
    e.figure.append(layer);
   }
   const pair=Array.isArray(combat?.enemies)?combat.enemies:[];
   e.frame.classList.toggle('r127-bone-fight',fighting&&pair.length===2);
   [...layer.children].forEach((unit,i)=>{
    const fighter=pair[i],hp=unit.querySelector('.r127-bone-hp');
    unit.hidden=!!fighting&&(!fighter||fighter.hp<=0);
    hp.hidden=!fighting||!fighter;
    if(fighting&&fighter){
     const current=Math.max(0,Number(fighter.hp)||0);
     const max=Math.max(current,Number(fighter.maxHp)||current||1);
     hp.textContent=current+'/'+max+' HP';
     if(unit.tagName!=='BUTTON'){
      const button=document.createElement('button');
      button.type='button';button.className=unit.className;button.dataset.enemy=unit.dataset.enemy;
      while(unit.firstChild)button.append(unit.firstChild);
      unit.replaceWith(button);unit=button;
      button.addEventListener('click',()=>{if(typeof busy!=='undefined'&&busy)return;
       if(typeof handleCommand==='function')handleCommand('attack '+(i+1));});
     }
     unit.setAttribute('aria-label','Attack '+fighter.name+'; '+hp.textContent);
    }
   });
  }catch(err){console.warn('DEVTEST owner scenario art:',err);}
  return result;
 };
})();
