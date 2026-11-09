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
.r127-npc-scene .r127-npc-figure{position:absolute;bottom:1%;left:50%;transform:translateX(-50%);height:94%;max-width:75%;width:auto;object-fit:contain;object-position:bottom;filter:drop-shadow(5px 7px 6px #000b);pointer-events:none}
.r127-npc-scene .r127-npc-figure.cage{height:96%;max-width:86%}
.r127-npc-scene .r127-npc-combat{position:absolute;left:50%;top:54%;transform:translate(-50%,-50%);width:35%;border:0;background:transparent;color:#fff;pointer-events:auto;cursor:pointer;padding:0;filter:drop-shadow(4px 6px 6px #000c)}
.r127-npc-scene .r127-npc-combat img{width:100%;max-height:200px;object-fit:contain;display:block}
.r127-npc-scene .r127-npc-label{display:block;background:#170f0de8;border:1px solid #aa9073;padding:3px;font:700 clamp(9px,1vw,12px) sans-serif;text-shadow:0 1px 2px black}
.r127-npc-scene .r127-npc-track{display:block;height:5px;background:#4b1c1c}
.r127-npc-scene .r127-npc-fill{display:block;height:100%;background:#b8cf65}
.r127-npc-scene .r127-npc-combat:focus-visible,.r127-npc-scene .r127-npc-combat:hover{outline:2px solid #f5c56d}
@media(max-width:600px){.r127-npc-scene .r127-npc-combat{width:42%}.r127-npc-scene .r127-npc-combat img{max-height:120px}}
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
  if(!spec){layer?.remove();activeKey='';return result}
  if(!layer||activeKey!==spec.key){layer?.remove();layer=document.createElement('div');layer.className='r127-npc-scene';layer.setAttribute('aria-label',spec.key.replace(/-/g,' '));e.figure.append(layer);activeKey=spec.key}
  if(!spec.fight){
   if(!layer.firstElementChild){
    const img=document.createElement('img');img.className='r127-npc-figure'+(spec.cage?' cage':'');img.src=url(spec.file);img.alt='';layer.append(img);
   }
   return result;
  }
  const fighter=spec.fight==='rivet'?combat?.enemies?.[0]:combat;
  const hp=Math.max(0,Number(fighter?.hp)||0),max=Math.max(1,Number(fighter?.maxHp)||hp);
  if(hp<=0){layer.replaceChildren();return result}
  let button=layer.querySelector('button');
  if(!button){
    button=document.createElement('button');button.className='r127-npc-combat';button.type='button';
    const img=document.createElement('img');img.src=url(spec.file);img.alt='';
    const label=document.createElement('span');label.className='r127-npc-label';
    const track=document.createElement('span');track.className='r127-npc-track';
    const fill=document.createElement('span');fill.className='r127-npc-fill';track.append(fill);
    button.append(img,label,track);
    button.addEventListener('click',()=>{if(typeof busy!=='undefined'&&busy)return;if(typeof handleCommand==='function')handleCommand(spec.fight==='rivet'?'attack 1':'attack')});
    layer.append(button);
  }
  button.setAttribute('aria-label','Attack '+spec.label+', '+hp+' of '+max+' HP');
  button.querySelector('.r127-npc-label').textContent=spec.label+'  '+hp+'/'+max+' HP';
  button.querySelector('.r127-npc-fill').style.width=Math.min(100,100*hp/max)+'%';
 }catch(error){console.warn('DEVTEST roadside NPC art:',error)}
 return result;
};
})();