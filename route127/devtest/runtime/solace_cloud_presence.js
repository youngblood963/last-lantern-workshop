// Display-only presence from cloud saves. Shared Expedition has its own verified world.
(() => {
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||
    !['https://lastlanternworkshop.com','https://localhost:8787','https://127.0.0.1:8787'].includes(location.origin)||
    new URLSearchParams(location.search).get('offline')==='1')return;
 const api='/route127/devtest/api/presence/';
 const portrait=new URL('../devtest/assets/players/player_survivor_default.png',document.baseURI).href;
 let activeId=null,showRoster=false,rows=[],menu,dialog,profileStatus,selected,running=false,queued=false;
 const inSolace=()=>{
  const travel=lanternState();
  return document.body.classList.contains('r127-cloud-game')&&!document.querySelector('.cloud-login[open]')&&
   travel?.nodeId==='solace'&&travel.solaceAdmitted&&!travel.currentEdgeId&&!travel.pending;
 };
 const onMainStreet=()=>inSolace()&&stage==='mercy'&&mercyLocation==='town'&&
  player.flags.solaceMenu==='town'&&!townWandererFocus&&!combatState;
 const statusLabel=online=>online?'Online':'Offline';
 const node=(tag,value)=>{
  const element=document.createElement(tag);
  if(value!==undefined)element.textContent=value;
  return element;
 };
 function image(){
  const img=node('img');
  img.src=portrait;
  img.alt='';
  img.loading='lazy';
  return img;
 }
 async function request(path,post=false){
  const response=await fetch(api+path,{method:post?'POST':'GET',credentials:'same-origin',cache:'no-store'});
  if(!response.ok)throw Error('Survivor presence is unavailable.');
  return response.json();
 }
 function closeProfile(){
  selected=null;
  profileStatus=null;
  if(dialog){
   dialog.close();
   dialog.remove();
   dialog=null;
  }
 }
 async function inspect(id){
  closeProfile();
  selected=id;
  const view=node('dialog');
  dialog=view;
  view.className='r127-survivor-details';
  view.setAttribute('aria-label','Cloud survivor profile');
  const body=node('section'),close=node('button','Close');
  close.type='button';
  close.addEventListener('click',closeProfile);
  view.addEventListener('close',()=>{if(dialog===view&&!view.open)closeProfile();});
  body.append(node('p','Loading survivor…'));
  view.append(body,close);
  document.body.append(view);
  view.showModal();
  try{
   const {survivor}=await request('survivors/'+encodeURIComponent(id));
   if(dialog!==view||!onMainStreet())return;
   const {equipment}=survivor;
   const gear=name=>Object.hasOwn(GEAR,name)?GEAR[name]:null;
   const weapon=gear(equipment.weapon),armor=gear(equipment.armor),accessory=gear(equipment.accessory);
   const weaponRange=weapon?.type==='weapon'?[weapon.min,weapon.max]:[5,10];
   const attack=(weaponRange[0]+(accessory?.min||0))+'–'+(weaponRange[1]+(accessory?.max||0));
   const defense=(armor?.def||0)+(accessory?.def||0);
   const stats=[
    ['Level',survivor.level??'Unknown'],['HP',(survivor.hp??'?')+' / '+(survivor.maxHp??'?')],
    ['Attack',attack],['Defense',defense],['Equipment',Object.values(equipment).filter(Boolean).join(', ')||'None'],
    ['Location',survivor.location]
   ];
   const list=node('dl');
   profileStatus=node('dd',statusLabel(survivor.online));
   list.append(node('dt','Status'),profileStatus);
   for(const [label,value] of stats)list.append(node('dt',label),node('dd',String(value)));
   body.replaceChildren(node('h2',survivor.name),node('p','Client-reported cloud save'),image(),list);
  }catch(error){
   if(dialog===view)body.replaceChildren(node('p',error.message));
  }
 }
 function render(){
  const elements=GraphicalUI.element;
  if(!elements||!onMainStreet()||!rows.length){
   menu?.remove();
   return;
  }
  if(elements.frame.hidden){
   if(menu.parentNode!==GraphicalUI.home)GraphicalUI.home.append(menu);
  }else if(menu.parentNode!==elements.main||menu.nextElementSibling!==elements.choices){
   elements.main.insertBefore(menu,elements.choices);
  }
 }
 function updateRows(next){
  const survivor=next.find(row=>row.id===selected);
  if(selected&&!survivor)closeProfile();
  if(survivor&&profileStatus)profileStatus.textContent=statusLabel(survivor.online);
  if(JSON.stringify(rows)===JSON.stringify(next))return;
  rows=next;
  menu?.remove();
  menu=node('section');
  menu.className='r127-cloud-survivors';
  menu.setAttribute('aria-label','Survivors from client-reported cloud saves');
  menu.append(node('p','Survivors · client-reported location'));
  const cards=node('div');
  cards.className='r127-survivor-cards';
  for(const {id,name,online} of rows){
   const button=node('button');
   button.type='button';
   button.dataset.cloudSurvivorId=id;
   const label=node('span');
   const status=node('small',statusLabel(online));
   status.className='r127-cloud-survivor-status';
   label.append(node('strong','Talk to '+name),status);
   button.append(image(),label);
   button.addEventListener('click',()=>inspect(id));
   cards.append(button);
  }
  menu.append(cards);
  render();
 }
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
