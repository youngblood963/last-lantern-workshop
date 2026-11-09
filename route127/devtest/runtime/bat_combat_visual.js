/* DEVTEST only: visual projection of live Bat Colony combat state. No combat rules changed. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname))return;
if(typeof GraphicalUI==='undefined')return;
const root=new URL('../devtest/',document.baseURI);
const artwork=new URL('assets/enemies/bat_colony.png',root).href;
const positions=[[31,16],[65,27],[43,37],[72,48]];
const css=document.createElement('style');
css.textContent=`
.gfx-art{position:relative}
.r127-bat-layer{position:absolute;inset:0;z-index:3;pointer-events:none;overflow:hidden}
.r127-bat-unit{position:absolute;width:27%;transform:translate(-50%,-50%);pointer-events:auto;border:0;background:transparent;color:#fff;cursor:pointer;padding:0;filter:drop-shadow(-2px -2px 1px rgba(255,198,126,.65)) drop-shadow(3px 7px 4px rgba(10,6,5,.85))}
.r127-bat-unit img{display:block;width:100%;height:auto;max-height:150px;object-fit:contain}
.r127-bat-unit .r127-bat-hp{display:block;background:#140d0bdc;border:1px solid #a58a68;border-radius:3px;padding:2px 3px;font:700 clamp(9px,1vw,12px) sans-serif;text-shadow:0 1px 2px black}
.r127-bat-unit .r127-bat-track{display:block;height:5px;background:#4b1c1c;margin-top:2px}
.r127-bat-unit .r127-bat-fill{display:block;height:100%;background:#b8cf65}
.gfx-frame.r127-bat-combat-active .gfx-combat{display:none!important}
.r127-bat-unit:focus-visible,.r127-bat-unit:hover{outline:2px solid #f5c56d}
@media(max-width:600px){.r127-bat-unit{width:30%}.r127-bat-unit img{max-height:90px}.r127-bat-unit .r127-bat-hp{font-size:9px}}
`;
document.head.append(css);
let lastCombat=null;
const original=GraphicalUI.sync;
GraphicalUI.sync=function(...args){
 const result=original.apply(this,args);
 try{
  const e=this.element;
  if(!e?.figure)return result;
  let layer=e.figure.querySelector('.r127-bat-layer');
  const c=typeof combatState!=='undefined'?combatState:null;
  const active=!!c&&/^BAT COLONY$/i.test(c.name||'')&&Array.isArray(c.enemies)&&c.enemies.length===4&&!e.frame.hidden;
  e.frame.classList.toggle('r127-bat-combat-active',active);
  const title=typeof stage!=='undefined'&&stage==='encounter'&&typeof currentEncounter==='function'
   ?String(currentEncounter()?.title||'').replace(/^EAST ROAD — /,'').toUpperCase():'';
  if(!active&&title==='BAT COLONY'&&!c&&!e.frame.hidden){
   if(!layer||layer.dataset.preview!=='1'){
    layer?.remove();layer=document.createElement('div');layer.className='r127-bat-layer';layer.dataset.preview='1';e.figure.append(layer);
    positions.forEach((pos,i)=>{const img=document.createElement('img');img.src=artwork;img.alt='';
      img.style.cssText='position:absolute;width:27%;max-height:35%;object-fit:contain;transform:translate(-50%,-50%);filter:drop-shadow(2px 5px 4px #000c)';
      img.style.left=pos[0]+'%';img.style.top=pos[1]+'%';layer.append(img);});
   }
   return result;
  }
  if(!active){layer?.remove();lastCombat=null;return result;}
  if(!layer||lastCombat!==c){
   layer?.remove();layer=document.createElement('div');layer.className='r127-bat-layer';layer.setAttribute('aria-label','Bat Colony enemies');e.figure.append(layer);
   lastCombat=c;
  }
  for(let i=0;i<4;i++){
   const enemy=c.enemies[i],hp=Math.max(0,Number(enemy.hp)||0),max=Math.max(1,Number(enemy.maxHp)||hp);
   let button=layer.querySelector('[data-bat-index="'+i+'"]');
   if(hp<=0){button?.remove();continue;}
   if(!button){
    button=document.createElement('button');button.type='button';button.className='r127-bat-unit';button.dataset.batIndex=String(i);
    button.style.left=positions[i][0]+'%';button.style.top=positions[i][1]+'%';
    const img=document.createElement('img');img.src=artwork;img.alt='';
    const label=document.createElement('span');label.className='r127-bat-hp';
    const track=document.createElement('span');track.className='r127-bat-track';
    const fill=document.createElement('span');fill.className='r127-bat-fill';track.append(fill);button.append(img,label,track);
    button.addEventListener('click',()=>{if(typeof busy!=='undefined'&&busy)return;if(typeof handleCommand==='function')handleCommand('attack '+(i+1));});
    layer.append(button);
   }
   button.setAttribute('aria-label','Attack bat '+(i+1)+', '+hp+' of '+max+' HP');
   button.querySelector('.r127-bat-hp').textContent='BAT '+(i+1)+'  '+hp+'/'+max+' HP';
   button.querySelector('.r127-bat-fill').style.width=Math.min(100,100*hp/max)+'%';
  }
 }catch(error){console.warn('DEVTEST bat combat visual:',error);}
 return result;
};
})();