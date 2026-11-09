/* DEVTEST only: individual regional human encounter artwork, tied to live enemy HP.
   Preserves the existing combat and lookout reinforcement mechanics. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||typeof GraphicalUI==='undefined')return;
const root=new URL('../devtest/',document.baseURI);
const asset=name=>new URL('assets/enemies/'+name,root).href;
const groups={
 'LOOTERS':{files:['looters_1.png','looters_2.png','looters_3.png'],count:3},
 'PARKING LOT RAIDERS':{files:['parking_lot_raiders-_1.png','parking_lot_raiders_2.png','parking_lot_raiders_3.png'],count:3},
 'GANG LOOKOUT':{files:['gang_lookout.png'],count:1},
 'THE HOLLOWED':{files:['the_hollowed_1.png','the_hollowed_2.png'],count:2},
 'THE SQUATTERS':{files:['the_squatters_1.png','the_squatters_2.png','the_squatters_3.png'],count:3},
 'GUNSHOP OWNER':{files:['gunshop_owner.png'],count:1,solo:true}
};
const placements={
 1:[[50,57,0.72]],
 2:[[35,59,0.66],[67,60,0.66]],
 3:[[24,60,0.63],[51,55,0.69],[77,61,0.62]]
};
const style=document.createElement('style');style.textContent=`
.gfx-art{position:relative}
.r127-human-layer{position:absolute;inset:0;z-index:5;pointer-events:none;overflow:hidden}
.gfx-frame button.r127-human-unit{position:absolute;transform:translate(-50%,-50%);width:32%;padding:0;border:0!important;background:transparent!important;background-image:none!important;box-shadow:none!important;min-height:0;color:#fff;cursor:pointer;pointer-events:auto;filter:drop-shadow(1px 5px 5px #000c)}
.r127-human-unit img{width:100%;height:auto;display:block;max-height:200px;object-fit:contain}
.r127-human-unit .r127-human-hp{display:block;background:#140d0be8;border:1px solid #a58a68;padding:2px 4px;font:700 clamp(9px,1vw,12px) sans-serif;text-shadow:0 1px 2px black}
.r127-human-unit .r127-human-track{display:block;height:5px;background:#4b1c1c}
.r127-human-unit .r127-human-fill{display:block;height:100%;background:linear-gradient(90deg,#8f211d,#d8493e)}
.gfx-frame.r127-human-combat-active .gfx-combat{display:none!important}
.gfx-frame.r127-human-combat-active .gfx-main>.gfx-combat{display:none!important}
.r127-human-unit:hover,.r127-human-unit:focus-visible{outline:2px solid #f5c56d}
@media(max-width:600px){.r127-human-unit{width:39%}.r127-human-unit img{max-height:130px}.r127-human-unit .r127-human-hp{font-size:9px}}
`;document.head.append(style);
function isLookoutEncounter(){
 if(typeof stage==='undefined'||stage!=='encounter'||typeof currentEncounter!=='function')return false;
 return String(currentEncounter()?.title||'').replace(/^EAST ROAD — /,'').toUpperCase()==='GANG LOOKOUT';
}
let signature='';
const original=GraphicalUI.sync;
GraphicalUI.sync=function(...args){
 const result=original.apply(this,args);
 if(this.element?.frame)this.element.frame.classList.remove('r127-human-combat-active');
 if(this.element?.enemies)this.element.enemies.style.removeProperty('display');
 try{
  const e=this.element;if(!e?.figure)return result;
  let layer=e.figure.querySelector('.r127-human-layer');
  const c=typeof combatState!=='undefined'?combatState:null;
  const name=String(c?.name||'').toUpperCase().replace(/^EAST ROAD — /,'');
  let group=groups[name];
  const gang=name==='GANG LOOKOUT';
  // The lookout leaves after whistling; display ONLY the two new gang members.
  if(gang&&c?.reinforcementsArrived)group={files:['gang_lookout_1.png','gang_lookout_2.png'],count:2};
  const active=!!group&&!!c&&!e.frame.hidden&&(group.solo?Number(c.hp)>0:Array.isArray(c.enemies)&&c.enemies.length===group.count);
  // The encounter portrait is always present before the player chooses a tactic.
  // Only fighting adds HP bars and attack controls.
  const preview=!active&&!c&&!e.frame.hidden&&isLookoutEncounter();
  if(preview){
   if(!layer||signature!=='gang-lookout-preview'){
    layer?.remove();layer=document.createElement('div');layer.className='r127-human-layer';e.figure.append(layer);signature='gang-lookout-preview';
    const img=document.createElement('img');img.src=asset('gang_lookout.png');img.alt='Gang lookout';
    img.style.cssText='position:absolute;left:50%;top:57%;transform:translate(-50%,-50%);height:72%;max-width:50%;object-fit:contain;filter:drop-shadow(1px 5px 5px #000c)';
    layer.append(img);
   }
   return result;
  }
  if(!active){layer?.remove();signature='';return result}
  // Individual sprite HP indicators replace the tall, scrollable duplicate combat panel.
  e.frame.classList.add('r127-human-combat-active');
  if(e.enemies)e.enemies.style.setProperty('display','none','important');
  const key=name+':'+(gang&&c.reinforcementsArrived?'reinforcements':'lookout')+':'+group.count;
  if(!layer||signature!==key){layer?.remove();layer=document.createElement('div');layer.className='r127-human-layer';e.figure.append(layer);signature=key}
  const spots=placements[group.count]||placements[3];
  for(let i=0;i<group.count;i++){
   const enemy=group.solo?{name:'GUNSHOP OWNER',hp:c.hp,maxHp:c.maxHp}:c.enemies[i],hp=Math.max(0,Number(enemy.hp)||0),max=Math.max(1,Number(enemy.maxHp)||hp);
   let button=layer.querySelector('[data-human-index="'+i+'"]');
   if(hp<=0){button?.remove();continue}
   if(!button){
    button=document.createElement('button');button.type='button';button.className='r127-human-unit';button.dataset.humanIndex=String(i);
    button.style.left=spots[i][0]+'%';button.style.top=spots[i][1]+'%';button.style.scale=String(spots[i][2]);
    const img=document.createElement('img');img.src=asset(group.files[i]);img.alt='';
    const label=document.createElement('span');label.className='r127-human-hp';
    const track=document.createElement('span');track.className='r127-human-track';
    const fill=document.createElement('span');fill.className='r127-human-fill';track.append(fill);button.append(img,label,track);
    button.addEventListener('click',()=>{if(typeof busy!=='undefined'&&busy)return;if(typeof handleCommand==='function')handleCommand(group.solo?'attack':'attack '+(i+1))});
    layer.append(button)
   }
   const label=String(enemy.name||'ENEMY '+(i+1));
   button.setAttribute('aria-label','Attack '+label+', '+hp+' of '+max+' HP');
   button.querySelector('.r127-human-hp').textContent=label+'  '+hp+'/'+max+' HP';
   button.querySelector('.r127-human-fill').style.width=Math.min(100,100*hp/max)+'%';
  }
 }catch(error){console.warn('DEVTEST human combat visual:',error)}
 return result;
};
})();