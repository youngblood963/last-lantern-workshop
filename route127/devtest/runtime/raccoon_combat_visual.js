/* DEVTEST: Rabid Raccoons individual combat sprites; no combat rules modified. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||typeof GraphicalUI==='undefined')return;
const art=new URL('../devtest/assets/enemies/rabid_raccoon.png',document.baseURI).href;
const spots=[[22,65,1,false],[50,58,1.05,true],[78,65,1,false]];
const style=document.createElement('style');
style.textContent=`
.gfx-art{position:relative}
.r127-raccoon-layer{position:absolute;inset:0;z-index:4;pointer-events:none;overflow:hidden}
.gfx-frame button.r127-raccoon-unit{position:absolute;width:30%;height:80%;transform:translate(-50%,-50%);background:transparent!important;background-image:none!important;border:0!important;border-radius:0!important;box-shadow:none!important;min-height:0!important;color:white;pointer-events:auto;cursor:pointer;padding:0!important;filter:drop-shadow(-2px -2px 1px rgba(255,198,126,.65)) drop-shadow(3px 8px 5px #000b)}
.r127-raccoon-unit img{width:100%;height:100%;max-height:none;object-fit:contain;display:block}
.r127-raccoon-unit.flipped img{transform:scaleX(-1)}
.gfx-frame.r127-raccoon-combat-active .gfx-combat,.gfx-frame.r127-raccoon-combat-active .gfx-main>.gfx-combat{display:none!important}
.r127-raccoon-unit:hover,.r127-raccoon-unit:focus-visible{outline:2px solid #f5c56d}
@media(max-width:600px){.gfx-frame button.r127-raccoon-unit{width:30%}.r127-raccoon-unit img{max-height:none}}
.gfx-frame .r127-raccoon-label{position:absolute;bottom:0;left:50%;transform:translateX(-50%);z-index:2;white-space:nowrap;background:#32100e;color:#ffaaa4;border:1px solid #aa413b;border-radius:3px;padding:2px 4px;font:700 clamp(9px,1vw,12px) sans-serif}
`;document.head.append(style);
let last=null;const sync=GraphicalUI.sync;
GraphicalUI.sync=function(...args){
 const result=sync.apply(this,args);
 try{
 const e=this.element;if(!e?.figure)return result;
 let layer=e.figure.querySelector('.r127-raccoon-layer');
 const c=typeof combatState!=='undefined'?combatState:null;
 const active=!!c&&/^RABID RACCOONS$/i.test(c.name||'')&&Array.isArray(c.enemies)&&c.enemies.length===3&&!e.frame.hidden;
 e.frame.classList.toggle('r127-raccoon-combat-active',active);
 const title=typeof stage!=='undefined'&&stage==='encounter'&&typeof currentEncounter==='function'
  ?String(currentEncounter()?.title||'').replace(/^EAST ROAD — /,'').toUpperCase():'';
 if(!active&&title==='RABID RACCOONS'&&!c&&!e.frame.hidden){
  if(!layer||layer.dataset.preview!=='1'){
   layer?.remove();layer=document.createElement('div');layer.className='r127-raccoon-layer';layer.dataset.preview='1';e.figure.append(layer);
   spots.forEach((pos)=>{
    const preview=document.createElement('button');preview.type='button';preview.tabIndex=-1;preview.setAttribute('aria-hidden','true');
    preview.className='r127-raccoon-unit'+(pos[3]?' flipped':'');
    preview.style.left=pos[0]+'%';preview.style.top=pos[1]+'%';preview.style.scale=String(pos[2]);preview.style.pointerEvents='none';
    const img=document.createElement('img');img.src=art+'?v=road-repair-1';img.alt='';
    img.onerror=()=>{img.dataset.failed='true';img.hidden=true;GraphicalUI.element?.frame.classList.add('r127-sprite-failed')};preview.append(img);layer.append(preview);
   });
  }
  return result;
 }
 if(!active){layer?.remove();last=null;return result}
 if(!layer||last!==c||layer.dataset.preview==='1'){layer?.remove();layer=document.createElement('div');layer.className='r127-raccoon-layer';e.figure.append(layer);last=c}
 for(let i=0;i<3;i++){
 const enemy=c.enemies[i],hp=Math.max(0,Number(enemy.hp)||0),max=Math.max(1,Number(enemy.maxHp)||hp);
 let b=layer.querySelector('[data-raccoon-index="'+i+'"]');
 if(hp<=0){b?.remove();continue}
 if(!b){
 b=document.createElement('button');b.type='button';b.className='r127-raccoon-unit'+(spots[i][3]?' flipped':'');b.dataset.raccoonIndex=String(i);
 b.style.left=spots[i][0]+'%';b.style.top=spots[i][1]+'%';b.style.scale=String(spots[i][2]);
 const img=document.createElement('img');img.src=art+'?v=road-repair-1';img.alt='';
    img.onerror=()=>{img.dataset.failed='true';img.hidden=true;GraphicalUI.element?.frame.classList.add('r127-sprite-failed')};
 const label=document.createElement('span');label.className='r127-raccoon-label';
 b.append(img,label);
 b.addEventListener('click',()=>{if(typeof busy!=='undefined'&&busy)return;if(typeof handleCommand==='function')handleCommand('attack '+(i+1))});layer.append(b)
 }
 b.setAttribute('aria-label','Attack raccoon '+(i+1)+', '+hp+' of '+max+' HP');
 b.querySelector('.r127-raccoon-label').textContent=hp+'/'+max+' HP';
 }
 }catch(error){console.warn('DEVTEST raccoon combat visual:',error)}
 return result;
};
})();