/* DEVTEST — Solace Post Office: new interior + expanded, three-per-day courier service.
 * Preserves Neither Rain Nor Ruin opening quest, Miles, existing saved jobs, crime,
 * legacy deliveries/rewards, and the named NPCs' own shop/quest menus.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||
    !/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||
    typeof GraphicalUI==='undefined'||typeof r18CourierState!=='function')return;
 const ROUTES=Object.freeze([
  {id:'tim',name:'Tim',place:'Solace — Town Hall',item:'Sealed Letter for Tim'},
  {id:'jen',name:'Jen',place:'Solace — Rusty Lantern',item:'Sealed Letter for Jen'},
  {id:'johnny',name:'Johnny',place:'Solace — Trading Post',item:'Sealed Letter for Johnny'},
  {id:'murphy',name:'Murphy',place:'Solace — Motor Works',item:'Sealed Letter for Murphy'},
  {id:'wayne',name:'Wayne',place:'Solace — Clinic',item:'Sealed Letter for Wayne'},
  {id:'amii',name:'Amii',place:'Solace — Bank',item:'Sealed Letter for Amii'},
  {id:'mara',name:'Mara',place:'Solace — Armory',item:'Sealed Letter for Mara'},
  {id:'docks',name:'Seaport Dockmaster',place:'Seaport — Docks',item:'Sealed Parcel for Seaport Docks'},
  {id:'kaiden',name:'Kaiden',place:'Seaport — Patrol',item:'Sealed Letter for Kaiden'},
  {id:'mia',name:'Mia',place:'Seaport — Rusty Anchor',item:'Sealed Letter for Mia'},
  {id:'nessa',name:'Nessa',place:'Seaport — Pet Vendor',item:'Sealed Letter for Nessa'},
  {id:'red',name:'Red',place:'Seaport — Rusty Anchor',item:'Sealed Letter for Red'},
  {id:'forge',name:'Forge',place:'Factory — Workshop',item:'Sealed Letter for Forge'}
 ]);
 const map=Object.fromEntries(ROUTES.map(x=>[x.id,x]));
 const POSTAL_LIMIT=3;
 const unlocked=()=>player.flags.r18Courier?.phase==='service';
 const freed=()=>player.flags.seaport55?.freed===true;
 const available=x=>(!['docks','kaiden','mia','nessa','red'].includes(x.id)||freed())&&
  (x.id!=='red'||!player.flags.r18Red?.dead);
 const daily=()=>{
  const q=r18CourierState(),now=Number(day)||1;
  if(!q.route127Daily||q.route127Daily.day!==now){
   q.route127Daily={day:now,issued:0};
  }
  return q.route127Daily;
 };
 const currentJob=()=>unlocked()?r18CourierState().job:null;
 const letter=x=>player.pack.some(i=>i.type==='quest'&&i.name===x.item&&i.qty>0);
 function issue(x){
  if(letter(x))return true;
  return addPack(x.item,'quest',1,true);
 }
 function take(x){
  const i=player.pack.find(i=>i.type==='quest'&&i.name===x.item&&i.qty>0);
  if(!i)return false;
  if(--i.qty<=0)player.pack.splice(player.pack.indexOf(i),1);
  updateHud();return true;
 }
 const originalTake=r18CourierTake;
 r18CourierTake=function(id){
  return map[id]&&!['tim','jen','docks'].includes(id)?
   take(map[id]):originalTake.apply(this,arguments);
 };
 const originalHas=r18CourierHas;
 r18CourierHas=function(id){
  return map[id]&&!['tim','jen','docks'].includes(id)?
   letter(map[id]):originalHas.apply(this,arguments);
 };
 const previousEligible=r18CourierEligible;
 r18CourierEligible=function(id){
  if(!map[id]||['tim','jen','docks'].includes(id))
    return previousEligible.apply(this,arguments);
  const q=r18CourierState();
  return q.phase==='service'&&q.job?.destination===id&&
   q.job.status==='active'&&available(map[id])&&letter(map[id]);
 };
 const oldDeliver=r18CourierDeliver;
 r18CourierDeliver=function(id,...args){
  if(!map[id]||['tim','jen','docks'].includes(id))
   return oldDeliver.call(this,id,...args);
  if(!r18CourierEligible(id)||!take(map[id])){
   add('That sealed delivery is not ready. Nothing was consumed.','system');
   return false;
  }
  const q=r18CourierState();
  q.job.status='delivered';
  add('DELIVERED TO '+map[id].name.toUpperCase()+
      ' — Return to the Solace Post Office for your reward.','reward');
  if(typeof v49Autosave==='function')v49Autosave();
  return true;
 };
 function accept(id){
  const x=map[id],q=r18CourierState(),d=daily();
  if(!unlocked()||!x||!available(x)){add('This route is not available.','system');return;}
  if(q.job){add('Finish your current delivery before accepting another.','system');return;}
  if(d.issued>=POSTAL_LIMIT){
   add('All three deliveries for today have been issued. New routes are available tomorrow.','system');return;
  }
  if(q.restitutionRequired&&typeof v52Crime==='function'&&
     v52Crime().active.some(x=>x.type==='Mail Tampering'&&x.victim==='Miles')){
   add('The postal service is suspended until the mail-tampering bounty is cleared.','system');return;
  }
  if((Number(day)||1)<(Number(q.suspendedUntil)||0)){
   add('Miles has suspended deliveries until day '+q.suspendedUntil+'.','system');return;
  }
  if(!issue(x)){add('No room for another sealed parcel. Free an inventory slot.','system');return;}
  q.job={destination:id,status:'active'};
  d.issued++;
  add('POSTAL DELIVERY ACCEPTED — '+x.name+' ('+x.place+'). '+(POSTAL_LIMIT-d.issued)+' of today’s routes remain.','reward');
  if(typeof v49Autosave==='function')v49Autosave();
 }
 function claim(){
  const q=r18CourierState();
  if(q.job?.status!=='delivered'){add('Deliver your current parcel before collecting payment.','system');return;}
  const who=map[q.job.destination]?.name||q.job.destination;
  delete q.job;
  // Service route payout matches legacy 20 Bolts + scaling XP.
  gainBolts(20);
  gainXp(Math.max(10,(Number(player.level)||1)*2));
  add('PAID DELIVERY — '+who+': +20 Bolts and XP.','reward');
  if(typeof v49Autosave==='function')v49Autosave();
 }
 const previousMenu=r18CourierMenu;
 r18CourierMenu=function(){
  if(!unlocked())return previousMenu.apply(this,arguments);
  const q=r18CourierState(),d=daily();
  mercyLocation='postOffice';player.flags.solaceMenu='postOffice';
  add('SOLACE POST OFFICE','place');
  add('POSTAL ROUTES — '+d.issued+'/'+POSTAL_LIMIT+' assignments issued today.','system');
  let options;
  if(q.job){
   const x=map[q.job.destination];
   add('ACTIVE DELIVERY: '+(x?.name||q.job.destination).toUpperCase()+
       ' — '+q.job.status.toUpperCase()+
       (x?' — '+x.place:''),'bright');
   options=q.job.status==='delivered'?
    ['CLAIM DELIVERY REWARD']:
    ['OPEN SEALED PARCEL'];
  }else if(d.issued>=POSTAL_LIMIT){
   add('No new routes until tomorrow.','system');
   options=[];
  }else{
   options=ROUTES.filter(available).map(x=>'ACCEPT '+x.name.toUpperCase()+' DELIVERY');
  }
  v53Choices([...options,'ASK ABOUT DELIVERIES','RETURN TO TOWN']);
 };
 const oldCommand=r18CourierCommand;
 r18CourierCommand=function(cmd){
  if(!unlocked())return oldCommand.apply(this,arguments);
  cmd=String(cmd||'').trim().toLowerCase();
  const target=ROUTES.find(x=>cmd==='accept '+x.name.toLowerCase()+' delivery'||
    cmd==='accept '+x.id+' delivery'||x.id==='docks'&&cmd==='accept seaport delivery');
  if(target){accept(target.id);return r18CourierMenu();}
  if(cmd==='claim delivery reward'){claim();return r18CourierMenu();}
  if(cmd==='ask about deliveries'){
   const d=daily();
   add('POST OFFICE > Three assignments per game day. Complete each handoff at the named location; claim your pay here before taking the next. Today: '+d.issued+'/'+POSTAL_LIMIT+'.','bright');
   return r18CourierMenu();
  }
  return oldCommand.call(this,cmd);
 };
 function nearRecipient(){
  if(!unlocked()||!currentJob()||currentJob().status!=='active')return null;
  const x=map[currentJob().destination];
  if(!x||!available(x)||!letter(x))return null;
  if(stage==='mercy'){
   const loc=String(mercyLocation||'').toLowerCase();
   return ({tim:'tim',jen:'jen',bar:'jen',johnny:'johnny',trader:'johnny',
    murphy:'murphy',workshop:'murphy',wayne:'wayne',clinic:'wayne',
    amii:'amii',bank:'amii',mara:'mara',armory:'mara'})[loc]===x.id?x:null;
  }
  if(stage==='port55Docks'&&x.id==='docks')return x;
  if(stage==='port55Kaiden'&&x.id==='kaiden')return x;
  if(stage==='port55Mia'&&x.id==='mia')return x;
  if(stage==='port55Vendor'&&x.id==='nessa')return x;
  if(stage==='r18Red'&&x.id==='red')return x;
  if(['factoryWorkshop','factoryForge','factoryTerminal'].includes(stage)&&x.id==='forge')return x;
  return null;
 }
 // Extend an existing menu with one mail-handoff action. There are no new
 // shop menus, NPC random rolls, or changes to their original dialogue.
 const priorChoices=GraphicalUI.choices;
 GraphicalUI.choices=function(...args){
  const x=nearRecipient();
  if(x&&!currentHotkeys.mail)currentHotkeys.mail='deliver mail to '+x.id;
  if(!x&&currentHotkeys.mail?.startsWith('deliver mail to '))delete currentHotkeys.mail;
  const rows=priorChoices.apply(this,args);
  if(!x||rows.some(r=>r.command==='deliver mail to '+x.id))return rows;
  return [...rows,{key:'mail',command:'deliver mail to '+x.id,
    label:'DELIVER MAIL TO '+x.name.toUpperCase()}];
 };
 const priorCore=handleCommandCore;
 handleCommandCore=async function(raw){
  const value=String(raw||'').trim().toLowerCase();
  const cmd=String(numberedChoices?.[value]||currentHotkeys?.[value]||value).toLowerCase();
  if(cmd.startsWith('deliver mail to ')){
   const x=nearRecipient();
   if(!x||cmd!=='deliver mail to '+x.id){
    add('The addressee is not available here. Keep the letter sealed.','system');return;
   }
   r18CourierDeliver(x.id);
   if(typeof v49Autosave==='function')v49Autosave();
   return renderCurrentChoices();
  }
  if(stage==='mercy'&&mercyLocation==='postOffice'&&unlocked()&&
    (/^accept .* delivery$/.test(cmd)||[
     'claim delivery reward','ask about deliveries','open sealed parcel',
     'confirm parcel tampering','cancel parcel tampering'
    ].includes(cmd))){
   return r18CourierCommand(cmd);
  }
  return priorCore.apply(this,arguments);
 };
 const priorModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const model=priorModel.apply(this,args);
  if(stage==='mercy'&&mercyLocation==='postOffice'&&unlocked()&&model.active){
   model.art='assets/locations/solace_post_office.png';
   model.title='SOLACE POST OFFICE';
   model.regionalSky=null;
  }
  return model;
 };
 globalThis.Route127PostOfficeRoutes=Object.freeze({
  routes:ROUTES.map(({id,name,place})=>({id,name,place})),
  dailyLimit:POSTAL_LIMIT
 });
})();
