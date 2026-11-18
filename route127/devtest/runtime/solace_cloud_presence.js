// Display-only presence from cloud saves. Shared Expedition has its own verified world.
(() => {
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||
    !['https://lastlanternworkshop.com','https://localhost:8787','https://127.0.0.1:8787'].includes(location.origin)||
    new URLSearchParams(location.search).get('offline')==='1')return;
 const api='/route127/devtest/api/presence/';
 const portrait=new URL('../devtest/assets/players/player_survivor_default.png',document.baseURI).href;
 let activeId=null,rows=[],menu,dialog,selected,running=false,queued=false;
 const onMainStreet=()=>{
  const travel=lanternState();
  return document.body.classList.contains('r127-cloud-game')&&!document.querySelector('.cloud-login[open]')&&
   stage==='mercy'&&mercyLocation==='town'&&player.flags.solaceMenu==='town'&&
   !townWandererFocus&&!combatState&&travel?.nodeId==='solace'&&!travel.currentEdgeId&&!travel.pending;
 };
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
  const target=elements.frame.hidden?GraphicalUI.home:elements.choices;
  if(menu?.parentNode!==target)target.append(menu);
 }
 function updateRows(next){
  if(selected&&!next.some(row=>row.id===selected))closeProfile();
  if(JSON.stringify(rows)===JSON.stringify(next))return;
  rows=next;
  menu?.remove();
  menu=node('section');
  menu.className='r127-cloud-survivors';
  menu.setAttribute('aria-label','Online survivors from client-reported cloud saves');
  menu.append(node('p','Online survivors · client-reported location'));
  const cards=node('div');
  cards.className='r127-survivor-cards';
  for(const {id,name} of rows){
   const button=node('button');
   button.type='button';
   button.dataset.cloudSurvivorId=id;
   button.append(image(),node('strong','Talk to '+name));
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
   const next=[];
   let after=null;
   do{
    const page=await request('survivors'+(after?'?after='+encodeURIComponent(after):''));
    next.push(...page.survivors.filter(row=>row.id!==id));
    after=page.next;
   }while(after&&id===activeId);
   if(id===activeId)updateRows(next);
  }catch{
   if(id===activeId)updateRows([]);
  }finally{
   running=false;
   if(queued){queued=false;refresh();}
  }
 }
 function changed(){
  const id=onMainStreet()?player.characterId:null;
  if(id!==activeId){
   activeId=id;
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
