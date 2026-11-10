/* DEVTEST only: Silas, Rivet, Martha scenario art, without altering encounter resolution. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||typeof GraphicalUI==='undefined')return;
const root=new URL('../devtest/',document.baseURI);
const url=file=>new URL('assets/enemies/'+file,root).href;
const css=document.createElement('style');
css.textContent=`
.gfx-art{position:relative}
.r127-npc-scene{position:absolute;inset:0;overflow:hidden;z-index:5;pointer-events:none}
.r127-npc-scene .r127-npc-figure{position:absolute;top:52%;left:50%;transform:translate(-50%,-50%);height:94%;width:75%;object-fit:contain;filter:drop-shadow(5px 7px 6px #000b);pointer-events:none}
.r127-npc-scene .r127-npc-figure.cage{top:auto;bottom:1%;transform:translateX(-50%);height:96%;width:auto;max-width:86%;object-position:bottom}
.gfx-frame .r127-npc-scene button.r127-npc-combat{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);width:75%;height:94%;min-height:0!important;border:0!important;border-radius:0!important;background:transparent!important;background-image:none!important;box-shadow:none!important;color:#fff;pointer-events:auto;cursor:pointer;padding:0!important;filter:drop-shadow(4px 6px 6px #000c)}
.r127-npc-scene .r127-npc-combat img{width:100%;height:100%;max-height:none;object-fit:contain;display:block}

.gfx-frame.r127-npc-combat-active .gfx-combat{display:none!important}
.r127-npc-scene .r127-npc-combat:focus-visible,.r127-npc-scene .r127-npc-combat:hover{outline:2px solid #f5c56d}
@media(max-width:600px){.gfx-frame .r127-npc-scene button.r127-npc-combat{width:75%;height:94%}.r127-npc-scene .r127-npc-combat img{max-height:none}}
.gfx-frame .r127-npc-label{position:absolute;bottom:0;left:50%;transform:translateX(-50%);z-index:2;white-space:nowrap;background:#32100e;color:#ffaaa4;border:1px solid #aa413b;border-radius:3px;padding:2px 4px;font:700 clamp(9px,1vw,12px) sans-serif}
`;document.head.append(css);
let activeKey='';
const previous=GraphicalUI.sync;
GraphicalUI.sync=function(...args){
 const result=previous.apply(this,args);
 try{
  const e=this.element;if(!e?.figure)return result;
  let layer=e.figure.querySelector('.r127-npc-scene');
  const combat=typeof combatState!=='undefined'?combatState:null;
  let spec=null;
  if(!e.frame.hidden&&combat?.name==='SILAS CROWE')spec={key:'silas-fight',file:'silas_crowe.png',fight:'solo',label:'SILAS CROWE'};
  else if(!e.frame.hidden&&combat?.name==='RIVET AND CREW')spec={key:'rivet-fight',file:'rivet.png',fight:'rivet',label:'RIVET'};
  else if(!e.frame.hidden&&stage==='encounter'&&typeof currentEncounter==='function'){
   const title=String(currentEncounter()?.title||'').replace(/^EAST ROAD — /,'');
   if(title==='THE HANGING CAGE'&&!player.flags?.r18SilasOutcome)spec={key:'silas-caged',file:'silas_crowe_caged.png',cage:true};
   if(title==='THE GRINDER CREW')spec={key:'rivet-scene',file:'rivet.png'};
   if(title==='THE STEEL ORCHARD'&&!player.flags?.r18MarthaSettled)spec={key:'martha-orchard',file:'martha.png'};
  }else if(!e.frame.hidden&&stage==='mercy'&&typeof mercyLocation!=='undefined'&&mercyLocation==='johnny'&&player.flags?.r18MarthaSettled&&player.flags?.solaceMenu==='marthaCounter'){
   spec={key:'martha-counter',file:'martha.png'};
  }
  e.frame.classList.toggle('r127-npc-partial',spec?.fight==='rivet'&&combat.enemies?.length>1);
  e.frame.classList.toggle('r127-npc-combat-active',!!spec?.fight&&(spec.fight!=='rivet'||combat.enemies.length===1));
  if(!spec){layer?.remove();activeKey='';return result}
  if(!layer||activeKey!==spec.key){layer?.remove();layer=document.createElement('div');layer.className='r127-npc-scene';layer.setAttribute('aria-label',spec.key.replace(/-/g,' '));e.figure.append(layer);activeKey=spec.key}
  if(!spec.fight){
   if(!layer.firstElementChild){
    const img=document.createElement('img');img.className='r127-npc-figure'+(spec.cage?' cage':'');img.src=url(spec.file)+'?v=road-repair-1';img.alt='';
    img.onerror=()=>{img.dataset.failed='true';img.hidden=true;GraphicalUI.element?.frame.classList.add('r127-sprite-failed')};layer.append(img);
   }
   return result;
  }
  const fighter=spec.fight==='rivet'?combat?.enemies?.[0]:combat;
  const hp=Math.max(0,Number(fighter?.hp)||0),max=Math.max(1,Number(fighter?.maxHp)||hp);
  if(hp<=0){layer.replaceChildren();return result}
  let button=layer.querySelector('button');
  if(!button){
    button=document.createElement('button');button.className='r127-npc-combat';button.type='button';
    const img=document.createElement('img');img.src=url(spec.file)+'?v=road-repair-1';img.alt='';
    img.onerror=()=>{img.dataset.failed='true';img.hidden=true;GraphicalUI.element?.frame.classList.add('r127-sprite-failed')};
    const label=document.createElement('span');label.className='r127-npc-label';
    button.append(img,label);
    button.addEventListener('click',()=>{if(typeof busy!=='undefined'&&busy)return;if(typeof handleCommand==='function')handleCommand(spec.fight==='rivet'?'attack 1':'attack')});
    layer.append(button);
  }
  button.setAttribute('aria-label','Attack '+spec.label+', '+hp+' of '+max+' HP');
  button.querySelector('.r127-npc-label').textContent=hp+'/'+max+' HP';
 }catch(error){console.warn('DEVTEST roadside NPC art:',error)}
 return result;
};
})();