// Display-only presence from cloud saves. Shared Expedition has its own verified world.
(() => {
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||
    !['https://lastlanternworkshop.com','https://localhost:8787','https://127.0.0.1:8787'].includes(location.origin)||
    new URLSearchParams(location.search).get('offline')==='1')return;
 const api='/route127/devtest/api/presence/';
 const portrait=new URL('../devtest/assets/players/player_survivor_default.png',document.baseURI).href;
 let activeId=null,showRoster=false,rows=[],sprites=[],spriteKey='',dialog,selected,running=false,queued=false;
 let activityId,activityAt=0,inspection=0;
 const inSolace=()=>{
  const travel=lanternState();
  return document.body.classList.contains('r127-cloud-game')&&!document.querySelector('.cloud-login[open]')&&
   travel?.nodeId==='solace'&&travel.solaceAdmitted&&!travel.currentEdgeId&&!travel.pending;
 };
 const onMainStreet=()=>inSolace()&&stage==='mercy'&&mercyLocation==='town'&&
  player.flags.solaceMenu==='town'&&!townWandererFocus&&!combatState;
 async function request(path,post=false){
  const response=await fetch(api+path,{method:post?'POST':'GET',credentials:'same-origin',cache:'no-store'});
  if(!response.ok)throw Error('Survivor presence is unavailable.');
  return response.json();
 }
 function closeProfile(){
  inspection++;
  selected=null;
  if(dialog?.open)dialog.close();
  dialog=null;
 }
 async function inspect(id){
  if(!onMainStreet()||!rows.some(row=>row.id===id))return;
  closeProfile();
  const attempt=inspection;
  try{
   const {survivor}=await request('survivors/'+encodeURIComponent(id));
   if(attempt!==inspection||!onMainStreet())return;
   const {equipment}=survivor;
   const gear=name=>Object.hasOwn(GEAR,name)?GEAR[name]:null;
   const weapon=gear(equipment.weapon),armor=gear(equipment.armor),accessory=gear(equipment.accessory);
   const range=weapon?.type==='weapon'?[weapon.min,weapon.max]:[5,10];
   const stats=[
    ['Status',survivor.online?'Online':'Offline'],['Level',survivor.level??'Unknown'],
    ['HP',(survivor.hp??'?')+' / '+(survivor.maxHp??'?')],
    ['Attack',(range[0]+(accessory?.min||0))+'–'+(range[1]+(accessory?.max||0))],
    ['Defense',(armor?.def||0)+(accessory?.def||0)],
    ['Equipment',Object.values(equipment).filter(Boolean).join(', ')||'None'],
    ['Location',survivor.location]
   ];
   selected=id;
   dialog=globalThis.Route127WandererInfo.open(survivor.name,portrait,{level:survivor.level,stats});
  }catch{
   if(attempt===inspection&&onMainStreet())add('Survivor information is unavailable.','system');
  }
 }
 function render(){
  const figure=GraphicalUI.active()&&onMainStreet()?GraphicalUI.element?.figure:null;
  const visible=figure&&!figure.hidden?rows.slice(0,matchMedia('(max-width:640px)').matches?2:3):[];
  const key=JSON.stringify(visible.map(({id,name})=>[id,name]));
  if(key===spriteKey&&sprites.every(sprite=>sprite.parentNode===figure))return;
  sprites.forEach(sprite=>sprite.remove());
  sprites=[];
  spriteKey=key;
  visible.forEach(({id,name},index)=>{
   const img=document.createElement('img');
   img.src=portrait;
   img.alt=name;
   img.decoding='async';
   const sprite=globalThis.Route127TownPortrait(name,img,()=>handleCommand('inspect survivor '+id),index+1);
   sprite.dataset.cloudSurvivorId=id;
   sprites.push(sprite);
   figure.appendChild(sprite);
  });
 }
 function updateRows(next){
  const survivor=next.find(row=>row.id===selected);
  if(selected&&!survivor)closeProfile();
  if(survivor&&dialog?.open)dialog.querySelector('.r127-info-value').textContent=survivor.online?'Online':'Offline';
  const identities=list=>JSON.stringify(list.map(({id,name})=>[id,name]));
  const changed=identities(rows)!==identities(next);
  rows=next;
  if(changed&&showRoster)globalThis.Route127RefreshSolaceMenu?.();
  render();
 }
 globalThis.Route127SolaceCloud=Object.freeze({
  choices:()=>onMainStreet()?rows.slice(0,90).map(({id,name})=>[id,'Talk to '+name,true,null,'inspect survivor '+id]):[],
  inspect
 });
 const previousCommand=handleCommand;
 handleCommand=async function(raw){
  const typed=String(raw||'').trim().toLowerCase();
  const command=numberedChoices[typed]||currentHotkeys[typed]||typed;
  if(onMainStreet()&&command.startsWith('inspect survivor '))return inspect(command.slice(17));
  const id=player.characterId;
  if(typed&&!busy&&id&&document.body.classList.contains('r127-cloud-game')&&
     !document.querySelector('.cloud-login[open]')&&(activityId!==id||Date.now()-activityAt>=3600000)){
   activityId=id;
   activityAt=Date.now();
   request('activity',true).catch(()=>{if(activityId===id)activityAt=0;});
  }
  return previousCommand.apply(this,arguments);
 };
 async function refresh(){
  if(running){queued=true;return;}
  running=true;
  const id=activeId;
  try{
   if(!id){
    await request('leave',true);
    return;
   }
   await request('heartbeat',true);
   if(!showRoster||id!==activeId)return;
   const next=[];
   let after=null;
   do{
    const page=await request('survivors'+(after?'?after='+encodeURIComponent(after):''));
    next.push(...page.survivors.filter(row=>row.id!==id));
    after=page.next;
   }while(after&&id===activeId&&showRoster);
   if(id===activeId&&showRoster)updateRows(next);
  }catch{
   if(id===activeId)updateRows([]);
  }finally{
   running=false;
   if(queued){queued=false;refresh();}
  }
 }
 function changed(){
  const id=inSolace()?player.characterId:null;
  const nextShow=!!id&&onMainStreet();
  if(id!==activeId||nextShow!==showRoster){
   activeId=id;
   showRoster=nextShow;
   updateRows([]);
   closeProfile();
   refresh();
  }
 }
 const sync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=sync.apply(this,args);
  changed();
  render();
  return result;
 };
 setInterval(()=>{changed();if(activeId&&!running)refresh();},15000);
 GraphicalUI.schedule();
})();
