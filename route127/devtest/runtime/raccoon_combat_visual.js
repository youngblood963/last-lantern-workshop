/* DEVTEST: Rabid Raccoons individual combat sprites; no combat rules modified. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||typeof GraphicalUI==='undefined')return;
const art=new URL('../devtest/assets/enemies/rabid_raccoon.png',document.baseURI).href;
const spots=[[18,57,1,false],[50,51,1.05,true],[82,57,1,false]];
const style=document.createElement('style');
style.textContent=`
.gfx-art{position:relative}
.r127-raccoon-layer{position:absolute;inset:0;z-index:4;pointer-events:none;overflow:hidden}
.gfx-frame button.r127-raccoon-unit{position:absolute;width:30%;transform:translate(-50%,-50%);background:transparent!important;background-image:none!important;border:0!important;border-radius:0!important;box-shadow:none!important;min-height:0!important;color:white;pointer-events:auto;cursor:pointer;padding:0!important;filter:drop-shadow(-2px -2px 1px rgba(255,198,126,.65)) drop-shadow(3px 8px 5px #000b)}
.r127-raccoon-unit img{width:100%;height:auto;max-height:220px;object-fit:contain;display:block}
.r127-raccoon-unit.flipped img{transform:scaleX(-1)}
.r127-raccoon-label{display:block;box-sizing:border-box;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:#160e0de8;border:1px solid #aa9073;border-radius:3px;padding:2px;font:700 clamp(9px,1vw,12px) sans-serif;text-shadow:0 1px 2px black}
.r127-raccoon-track{display:block;height:5px;background:#4b1c1c;margin-top:2px}
.r127-raccoon-fill{display:block;height:100%;background:linear-gradient(90deg,#8f211d,#d8493e)}
.gfx-frame.r127-raccoon-combat-active .gfx-combat,.gfx-frame.r127-raccoon-combat-active .gfx-main>.gfx-combat{display:none!important}
.r127-raccoon-unit:hover,.r127-raccoon-unit:focus-visible{outline:2px solid #f5c56d}
@media(max-width:600px){.gfx-frame button.r127-raccoon-unit{width:30%}.r127-raccoon-unit img{max-height:140px}.r127-raccoon-label{font-size:8px;padding:2px 1px}}
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
 if(active&&e.enemies)e.enemies.style.setProperty('display','none','important');
 else if(e.enemies)e.enemies.style.removeProperty('display');
 const title=typeof stage!=='undefined'&&stage==='encounter'&&typeof currentEncounter==='function'
  ?String(currentEncounter()?.title||'').replace(/^EAST ROAD — /,'').toUpperCase():'';
 if(!active&&title==='RABID RACCOONS'&&!c&&!e.frame.hidden){
  if(!layer||layer.dataset.preview!=='1'){
   layer?.remove();layer=document.createElement('div');layer.className='r127-raccoon-layer';layer.dataset.preview='1';e.figure.append(layer);
   spots.forEach((pos)=>{const img=document.createElement('img');img.src=art;img.alt='';
    img.style.cssText='position:absolute;width:30%;max-height:80%;object-fit:contain;transform:translate(-50%,-50%);filter:drop-shadow(2px 5px 4px #000c)';
    img.style.left=pos[0]+'%';img.style.top=pos[1]+'%';img.style.scale=String(pos[2]);
    if(pos[3])img.style.transform='translate(-50%,-50%) scaleX(-1)';
    layer.append(img);});
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
 const img=document.createElement('img');img.src=art;img.alt='';
 const label=document.createElement('span');label.className='r127-raccoon-label';
 const track=document.createElement('span');track.className='r127-raccoon-track';
 const fill=document.createElement('span');fill.className='r127-raccoon-fill';track.append(fill);b.append(img,label,track);
 b.addEventListener('click',()=>{if(typeof busy!=='undefined'&&busy)return;if(typeof handleCommand==='function')handleCommand('attack '+(i+1))});layer.append(b)
 }
 b.setAttribute('aria-label','Attack raccoon '+(i+1)+', '+hp+' of '+max+' HP');
 b.querySelector('.r127-raccoon-label').textContent='RACCOON '+(i+1)+'  '+hp+'/'+max+' HP';
 b.querySelector('.r127-raccoon-fill').style.width=Math.min(100,100*hp/max)+'%';
 }
 }catch(error){console.warn('DEVTEST raccoon combat visual:',error)}
 return result;
};
})();