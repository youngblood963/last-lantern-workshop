// The expedition backend owns location, population and the public character profile.
(() => {
 'use strict';
 const hosts=['https://lastlanternworkshop.com','https://localhost:8787','https://127.0.0.1:8787'];
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!hosts.includes(location.origin)||
    !/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||
    new URLSearchParams(location.search).get('offline')==='1')return;

 const api='/route127/devtest/api/world/';
 const portrait=new URL('../devtest/assets/players/player_survivor_default.png',document.baseURI).href;
 const travelLabels={depart:'Depart for Western Road',approach:'Enter Solace',leave:'Leave Solace',return:'Return to Old House'};
 const onMainStreet=()=>{
  if(!document.body.classList.contains('r127-cloud-game')||!player.characterId||
     stage!=='mercy'||mercyLocation!=='town'||player.flags.solaceMenu!=='town'||
     townWandererFocus||combatState)return false;
  const travel=lanternState();
  return travel?.nodeId==='solace'&&!travel.currentEdgeId;
 };
 function node(tag,text){
  const element=document.createElement(tag);
  if(text)element.textContent=text;
  return element;
 }
 function button(text,action){
  const element=node('button',text);
  element.type='button';
  element.addEventListener('click',action);
  return element;
 }
 function image(){
  const img=node('img');
  img.src=portrait;
  img.alt='';
  img.loading='lazy';
  img.decoding='async';
  return img;
 }
 async function request(panel,path,data){
  const response=await fetch(api+path,{
   credentials:'same-origin',cache:'no-store',signal:panel.abort.signal,
   ...(data&&{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
  });
  if(!response.ok)throw Error(response.status===401?'Sign in to join the shared expedition.':
   response.status===409?'Expedition state changed. Refreshing…':'Shared expedition unavailable.');
  return response.json();
 }

 let panel;
 function openExpedition(){
  if(panel||!onMainStreet())return;
  const dialog=node('dialog'),status=node('p'),controls=node('div'),cards=node('div'),details=node('section');
  dialog.className='r127-survivor-details';
  dialog.setAttribute('aria-label','Solace shared expedition');
  status.setAttribute('role','status');
  cards.className='r127-survivor-cards';
  cards.setAttribute('aria-label','Online survivors in Solace');
  controls.className='r127-survivor-controls';
  const close=button('Close',()=>dialog.close());
  dialog.append(node('h2','Shared Expedition'),
   node('p','Expedition travel and gear are separate from your cloud save.'),
   status,controls,cards,details,close);
  const view={dialog,status,controls,cards,details,abort:new AbortController(),self:player.characterId};
  panel=view;
  dialog.addEventListener('close',()=>{
   clearInterval(view.timer);
   view.abort.abort();
   dialog.remove();
   if(panel===view)panel=null;
  });
  document.body.append(dialog);
  dialog.showModal();
  view.timer=setInterval(()=>run(view),15000);
  run(view);
 }
 function renderControls(view,state){
  const key=state.enrolled?state.character.location:'unenrolled';
  if(view.controlsKey===key)return;
  view.controlsKey=key;
  if(!state.enrolled){
   view.controls.replaceChildren(button('Join expedition',()=>run(view,'enroll',{})));
   return;
  }
  view.controls.replaceChildren(...state.actions.map(action=>button(travelLabels[action],()=>
   run(view,'action',{action,revision:view.state.revision,requestId:crypto.randomUUID()}))));
 }
 function renderRoster(view,rows){
  const key=JSON.stringify(rows.map(({id,name})=>[id,name]));
  if(view.rosterKey!==key){
   view.rosterKey=key;
   view.cards.replaceChildren(...rows.map(row=>{
    const card=button('',()=>inspect(view,row.id));
    card.setAttribute('aria-label','Inspect '+row.name);
    card.dataset.characterId=row.id;
    card.append(image(),node('strong',row.name));
    return card;
   }));
  }
  if(view.selected&&!rows.some(row=>row.id===view.selected)){
   view.selected=null;
   view.details.replaceChildren();
  }
 }
 async function run(view,action,data){
  if(view.running||!view.dialog.open||!onMainStreet()||player.characterId!==view.self)return;
  view.running=true;
  try{
   const state=await request(view,action||'me',data);
   if(state.enrolled&&state.character.id!==view.self){
    view.dialog.close();
    return;
   }
   view.state=state;
   renderControls(view,state);
   const inSolace=state.enrolled&&state.character.location==='solace';
   const rows=[];
   if(inSolace){
    await request(view,'heartbeat',{});
    let next;
    do{
     const page=await request(view,'survivors'+(next?'?after='+encodeURIComponent(next):''));
     rows.push(...page.survivors.filter(row=>row.online&&row.id!==view.self));
     next=page.next;
    }while(next);
   }
   renderRoster(view,rows);
   view.status.textContent=inSolace?(rows.length?'Online survivors in Solace':'No other survivors are online in Solace.'):
    state.enrolled?state.character.locationName:'Join the expedition to meet other survivors.';
  }catch(error){
   if(!view.abort.signal.aborted){
    view.status.textContent=error.message;
    renderRoster(view,[]);
   }
  }finally{view.running=false;}
 }
 async function inspect(view,id){
  view.selected=id;
  view.details.replaceChildren(node('p','Loading survivor…'));
  try{
   const {survivor}=await request(view,'survivors/'+encodeURIComponent(id));
   if(view.selected!==id||!view.dialog.open)return;
   const {equipment,stats}=survivor;
   const values=[
    ['Level',survivor.level],['Location',survivor.locationName],
    ['Equipment',Object.values(equipment).join(', ')||'None'],['Max HP',stats.maxHp],
    ['Attack',stats.attackMin+'–'+stats.attackMax],['Defense',stats.defense]
   ];
   const list=node('dl');
   for(const [label,value] of values)list.append(node('dt',label),node('dd',String(value)));
   view.details.replaceChildren(node('h3',survivor.name),image(),list,button('Close profile',()=>{
    view.selected=null;
    view.details.replaceChildren();
   }));
  }catch(error){
   if(view.selected!==id||view.abort.signal.aborted)return;
   view.details.replaceChildren(node('p',error.message));
   run(view);
  }
 }
 globalThis.Route127SharedExpedition=Object.freeze({available:onMainStreet,open:openExpedition});
 const sync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=sync.apply(this,args);
  if(panel?.dialog.open&&(!onMainStreet()||player.characterId!==panel.self))panel.dialog.close();
  return result;
 };
})();
