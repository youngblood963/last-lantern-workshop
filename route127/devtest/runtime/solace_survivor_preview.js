/* DEVTEST portrait preview. Fixture data never enters the cloud or game save. */
(() => {
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||
    !/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||
    new URLSearchParams(location.search).get('survivorPreview')!=='1')return;

 const portrait=new URL('../devtest/assets/players/player_survivor_default.png',document.baseURI).href;
 const fixtures=Object.freeze([
  Object.freeze({id:'wo68-qa-1',name:'Forge QA',level:1,area:'solace'}),
  Object.freeze({id:'wo68-qa-2',name:'Road Scout QA',level:3,area:'solace'})
 ]);
 const onMainStreet=()=>{
  const travel=lanternState();
  return stage==='mercy'&&mercyLocation==='town'&&player.flags.solaceMenu==='town'&&
   !townWandererFocus&&!combatState&&travel?.nodeId==='solace'&&!travel.currentEdgeId;
 };
 const node=(tag,text)=>{
  const element=document.createElement(tag);
  if(text)element.textContent=text;
  return element;
 };
 const image=()=>{
  const img=node('img');
  img.src=portrait;
  img.alt='';
  img.loading='lazy';
  img.decoding='async';
  return img;
 };
 let roster,dialog,shownKey='';
 function closeDetails(){
  if(dialog?.open)dialog.close();
 }
 function inspect(row){
  if(!onMainStreet())return;
  closeDetails();
  const details=node('dialog');
  details.className='r127-survivor-details';
  details.setAttribute('aria-label','Player information for '+row.name);
  const heading=node('h2',row.name);
  const close=node('button','Close');
  close.type='button';
  close.addEventListener('click',()=>details.close());
  details.addEventListener('close',()=>{
   details.remove();
   if(dialog===details)dialog=null;
  });
  details.append(heading,node('p','DEVTEST simulated player'),image(),
   node('p','Level '+row.level+' · Solace'),close);
  document.body.append(details);
  dialog=details;
  details.showModal();
 }
 function refresh(ui){
  const elements=ui.element;
  const visible=elements&&!elements.frame.hidden&&onMainStreet();
  if(!visible){
   roster?.remove();
   roster=null;
   shownKey='';
   closeDetails();
   return;
  }
  const self=player.characterId;
  const rows=fixtures.filter(row=>row.area==='solace'&&row.id!==self);
  const key=rows.map(row=>row.id).join('|');
  if(key===shownKey&&roster?.parentNode===elements.main)return;
  roster?.remove();
  closeDetails();
  shownKey=key;
  if(!rows.length)return;
  roster=node('section');
  roster.className='r127-survivor-preview metal';
  roster.setAttribute('aria-label','Simulated DEVTEST players in Solace');
  roster.append(node('h2','Survivor Preview'),node('p','DEVTEST simulation · No live players shown'));
  const cards=node('div');
  cards.className='r127-survivor-cards';
  for(const row of rows){
   const card=node('button');
   card.type='button';
   card.setAttribute('aria-label','Inspect simulated player '+row.name);
   card.append(image(),node('strong',row.name));
   card.addEventListener('click',()=>inspect(row));
   cards.append(card);
  }
  roster.append(cards);
  elements.main.insertBefore(roster,elements.choices);
 }
 const sync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=sync.apply(this,args);
  refresh(this);
  return result;
 };
 GraphicalUI.schedule();
})();
