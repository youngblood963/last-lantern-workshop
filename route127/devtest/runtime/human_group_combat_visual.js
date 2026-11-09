/* DEVTEST only: individual regional human encounter artwork, tied to live enemy HP.
   Preserves the existing combat and lookout reinforcement mechanics. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||typeof GraphicalUI==='undefined')return;
const root=new URL('../devtest/',document.baseURI);
const asset=name=>new URL('assets/enemies/'+name,root).href;
const groups={
 // Interim Highway Robbers sprites reuse approved looter art until unique robber art is supplied.
 'HIGHWAY ROBBERS':{files:['looters_1.png','looters_2.png'],count:2},
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
 3:[[17,54,1],[50,51,1.06],[83,55,1]],
 raiders:[[17,54,1.02],[50,50,1.12],[83,54,1.02]],
 robbers:[[26,53,1.0],[74,53,1.0]],
 hollowed:[[27,51,1.12],[73,53,1.12]]
};
const style=document.createElement('style');style.textContent=`
.gfx-art{position:relative}
.r127-human-layer{position:absolute;inset:0;z-index:5;pointer-events:none;overflow:hidden}
.gfx-frame button.r127-human-unit{position:absolute;transform:translate(-50%,-50%);width:32%;padding:0;border:0!important;background:transparent!important;background-image:none!important;box-shadow:none!important;min-height:0;color:#fff;cursor:pointer;pointer-events:auto;filter:drop-shadow(1px 5px 5px #000c)}
.r127-human-unit img{width:100%;height:auto;display:block;max-height:200px;object-fit:contain}
.r127-human-unit .r127-human-hp{display:block;background:#140d0be8;border:1px solid #a58a68;padding:2px 4px;font:700 clamp(9px,1vw,12px) sans-serif;text-shadow:0 1px 2px black}
/* Looters use three non-overlapping HP columns; sprites occupy more of the scene. */
.gfx-frame button.r127-human-unit.r127-looter-unit{width:30%;z-index:6;filter:drop-shadow(2px 6px 6px #000e)}
.r127-looter-unit img{max-height:255px;object-position:center bottom}
.r127-looter-unit .r127-human-hp{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:clamp(9px,.9vw,12px)}
@media(max-width:600px){.gfx-frame button.r127-human-unit.r127-looter-unit{width:30%}.r127-looter-unit img{max-height:185px}.r127-looter-unit .r127-human-hp{font-size:8px;padding:2px 1px}}
/* Parking Lot Raiders: larger individual figures, with dedicated non-overlapping HP lanes. */
.gfx-frame button.r127-human-unit.r127-raider-unit{width:30%;z-index:6;filter:drop-shadow(2px 6px 6px #000e)}
.r127-raider-unit img{max-height:255px;object-position:center bottom}
.r127-raider-unit .r127-human-hp{box-sizing:border-box;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:clamp(9px,.9vw,12px)}
@media(max-width:600px){.gfx-frame button.r127-human-unit.r127-raider-unit{width:30%}.r127-raider-unit img{max-height:185px}.r127-raider-unit .r127-human-hp{font-size:8px;padding:2px 1px}}
/* Highway robbers share only temporary looter artwork; their two wide lanes prevent HP overlap. */
.gfx-frame button.r127-human-unit.r127-robber-unit{width:42%;min-height:0!important;z-index:6}
.r127-robber-unit img{max-height:275px;object-position:center bottom}
.r127-robber-unit .r127-human-hp{box-sizing:border-box;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:clamp(9px,0.9vw,12px)}
@media(max-width:600px){.gfx-frame button.r127-human-unit.r127-robber-unit{width:43%}.r127-robber-unit img{max-height:175px}.r127-robber-unit .r127-human-hp{font-size:8px;padding:2px 1px}}
/* Hollowed character art needs separate enlargement from its HP badge. */
.gfx-frame button.r127-human-unit.r127-hollowed-unit{width:40%;min-height:0!important;z-index:6}
.r127-hollowed-unit img{max-height:300px;transform:scale(1.55);transform-origin:center bottom;object-position:center bottom}
.r127-hollowed-unit .r127-human-hp{box-sizing:border-box;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:clamp(9px,.9vw,12px)}
@media(max-width:600px){.gfx-frame button.r127-human-unit.r127-hollowed-unit{width:43%}.r127-hollowed-unit img{max-height:170px;transform:scale(1.2)}.r127-hollowed-unit .r127-human-hp{font-size:8px;padding:2px 1px}}
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
 const wasHumanCombat=!!this.element?.frame?.classList.contains('r127-human-combat-active');
 if(this.element?.frame)this.element.frame.classList.remove('r127-human-combat-active');
 // Do not undo the Raccoons/Bats legacy-HP suppression established by prior renderers.
 if(wasHumanCombat&&this.element?.enemies)this.element.enemies.style.removeProperty('display');
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
  // Keep scenario characters visible during the encounter, before a fight begins.
  // No HP meters or attack buttons appear until actual combat.
  const title=typeof currentEncounter==='function'&&typeof stage!=='undefined'&&stage==='encounter'
   ?String(currentEncounter()?.title||'').replace(/^EAST ROAD — /,'').toUpperCase():'';
  const previewGroup=!c&&!e.frame.hidden?groups[title]:null;
  const preview=!!previewGroup;
  if(preview){
   const key='encounter-preview:'+title;
   if(!layer||signature!==key){
    layer?.remove();layer=document.createElement('div');layer.className='r127-human-layer';e.figure.append(layer);signature=key;
    const spots=title==='THE HOLLOWED'?placements.hollowed:title==='HIGHWAY ROBBERS'?placements.robbers:title==='PARKING LOT RAIDERS'?placements.raiders:(previewGroup.count===3&&title!=='LOOTERS'?[[24,60,0.63],[51,55,0.69],[77,61,0.62]]:(placements[previewGroup.count]||placements[3]));
    previewGroup.files.forEach((file,i)=>{
     const img=document.createElement('img');img.src=asset(file);img.alt='';
     img.style.position='absolute';img.style.left=spots[i][0]+'%';img.style.top=spots[i][1]+'%';
     img.style.transform='translate(-50%,-50%) scale('+spots[i][2]+')';
     img.style.width=title==='THE HOLLOWED'?'40%':title==='HIGHWAY ROBBERS'?'42%':previewGroup.count===1?'42%':previewGroup.count===2?'36%':'32%';
     img.style.maxHeight='85%';img.style.objectFit='contain';img.style.filter='drop-shadow(2px 6px 5px #000c)';
     if(title==='THE HOLLOWED')img.style.transform='translate(-50%,-50%) scale(1.75)';
     layer.append(img);
    });
   }
   return result;
  }
  if(!active){layer?.remove();signature='';return result}
  // Individual sprite HP indicators replace the tall, scrollable duplicate combat panel.
  e.frame.classList.add('r127-human-combat-active');
  if(e.enemies)e.enemies.style.setProperty('display','none','important');
  const key=name+':'+(gang&&c.reinforcementsArrived?'reinforcements':'lookout')+':'+group.count;
  if(!layer||signature!==key){layer?.remove();layer=document.createElement('div');layer.className='r127-human-layer';e.figure.append(layer);signature=key}
  const spots=name==='THE HOLLOWED'?placements.hollowed:name==='HIGHWAY ROBBERS'?placements.robbers:name==='PARKING LOT RAIDERS'?placements.raiders:(group.count===3&&name!=='LOOTERS'?[[24,60,0.63],[51,55,0.69],[77,61,0.62]]:(placements[group.count]||placements[3]));
  for(let i=0;i<group.count;i++){
   const enemy=group.solo?{name:'GUNSHOP OWNER',hp:c.hp,maxHp:c.maxHp}:c.enemies[i],hp=Math.max(0,Number(enemy.hp)||0),max=Math.max(1,Number(enemy.maxHp)||hp);
   let button=layer.querySelector('[data-human-index="'+i+'"]');
   if(hp<=0){button?.remove();continue}
   if(!button){
    button=document.createElement('button');button.type='button';button.className='r127-human-unit'+(name==='LOOTERS'?' r127-looter-unit':name==='PARKING LOT RAIDERS'?' r127-raider-unit':name==='HIGHWAY ROBBERS'?' r127-robber-unit':name==='THE HOLLOWED'?' r127-hollowed-unit':'');button.dataset.humanIndex=String(i);
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