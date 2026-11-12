/* DEVTEST ONLY — Seaport Post Office / global Harbor Dispatch.
 * Opens after Tommy's bandage rescue AND Seaport liberation. The one-a-day
 * Seaport delivery pool spans Solace, Factory, and Seaport starting NPCs.
 * Independent save/quest items and daily counter from Solace/Miles.
 */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
const DESTINATIONS=Object.freeze([
 // Same baseline, non-hireable NPC pool as Miles's established Solace service.
 {id:'tim',name:'Tim',place:'Solace — Town Hall',stage:'mercy',loc:['tim'],item:'Harbor Dispatch — Tim'},
 {id:'jen',name:'Jen',place:'Solace — Rusty Lantern',stage:'mercy',loc:['jen','bar'],item:'Harbor Dispatch — Jen'},
 {id:'johnny',name:'Johnny',place:'Solace — Trading Post',stage:'mercy',loc:['johnny','trader'],item:'Harbor Dispatch — Johnny'},
 {id:'murphy',name:'Murphy',place:'Solace — Motor Works',stage:'mercy',loc:['murphy','workshop'],item:'Harbor Dispatch — Murphy'},
 {id:'wayne',name:'Wayne',place:'Solace — Clinic',stage:'mercy',loc:['wayne','clinic'],item:'Harbor Dispatch — Wayne'},
 {id:'amii',name:'Amii',place:'Solace — Bank',stage:'mercy',loc:['amii','bank'],item:'Harbor Dispatch — Amii'},
 {id:'mara',name:'Mara',place:'Solace — Armory',stage:'mercy',loc:['mara','armory'],item:'Harbor Dispatch — Mara'},
 {id:'forge',name:'Forge',place:'Factory — Workshop',stages:['factoryWorkshop','factoryForge','factoryTerminal'],item:'Harbor Dispatch — Forge'},
 {id:'docks',name:'Harbor Dockmaster',place:'Seaport — Harbor Docks',stage:'port55Docks',item:'Harbor Dispatch — Docks'},
 {id:'kaiden',name:'Kaiden',place:'Seaport — Patrol',stage:'port55Kaiden',item:'Harbor Dispatch — Kaiden'},
 {id:'mia',name:'Mia',place:'Seaport — Rusty Anchor',stage:'port55Mia',item:'Harbor Dispatch — Mia'},
 {id:'nessa',name:'Nessa',place:'Seaport — Pet Vendor',stage:'port55Vendor',item:'Harbor Dispatch — Nessa'},
 {id:'red',name:'Red',place:'Seaport — Rusty Anchor',stage:'r18Red',item:'Harbor Dispatch — Red'}
]);
const TODAY=()=>Math.max(1,Number(day)||1);
const saved=()=>player.flags.r127HarborDispatch||(player.flags.r127HarborDispatch={lastIssuedDay:0,job:null});
const rescued=()=>player.flags.r18RoadsideWO2?.tommyHelp===true||
 (typeof RoadScenarioRegistry?.wo2State==='function'&&RoadScenarioRegistry.wo2State().tommyHelp===true);
const open=()=>player.flags.seaport55?.freed===true&&rescued();
const available=d=>d.id!=='red'||!player.flags.r18Red?.dead;
const current=()=>saved().job;
const destination=()=>DESTINATIONS.find(d=>d.id===current()?.id);
const atDestination=d=>!!d&&(
 (d.stage==='mercy'&&stage==='mercy'&&d.loc.includes(String(mercyLocation||'').toLowerCase()))||
 (d.stages?.includes(stage))||stage===d.stage);
const mailItem=d=>current()?.item||d.item;
const owns=d=>player.pack.some(i=>i.type==='quest'&&i.name===mailItem(d)&&(Number(i.qty)||0)>0);
const postalCrime=()=>typeof v52Crime==='function'&&v52Crime().active?.some(x=>x.type==='Mail Tampering'&&x.victim==='Tommy Briggs');
const blocked=()=>saved().restitutionRequired&&postalCrime();
const suspendUntil=()=>Number(saved().suspendedUntil)||0;
const isSuspended=()=>TODAY()<suspendUntil()||blocked();
const KIND=Object.freeze({letter:'letter',package:'package'});
function kindFor(d){
 // Recipients receive a mix; existing legacy assignments without kind stay packages.
 return Math.random()<.5?KIND.letter:KIND.package;
}
const itemFor=(d,kind)=>kind==='letter'?'Sealed Harbor Letter for '+d.name:'Sealed Harbor Package for '+d.name;
function removeMail(d){
 const i=player.pack.find(i=>i.type==='quest'&&i.name===mailItem(d)&&i.qty>0);
 if(!i)return false;
 i.qty--;if(i.qty<=0)player.pack.splice(player.pack.indexOf(i),1);
 updateHud();return true;
}
function contrabandLoot(kind){
 // Most letters carry little of value; rare cash-filled envelopes are jackpots.
 // This roll happens only AFTER the separate 50/50 tampering success check.
 const r=Math.random();
 if(kind==='letter'){
  if(r<.05){
   const n=200+Math.floor(Math.random()*301);gainBolts(n);
   add('STOLEN MAIL JACKPOT — '+n+' Bolts hidden inside the envelope!','reward');
  }else if(r<.70){
   const n=2+Math.floor(Math.random()*12);gainBolts(n);
   add('STOLEN MAIL — '+n+' Bolts tucked into the envelope.','reward');
  }else add('The letter contains only personal correspondence. No valuables.','system');
  return;
 }
 if(r<.12){
  const level=Math.max(1,Math.min(50,Math.floor(Number(player.level)||1)));
  const pool=EQUIPMENT_CATALOG.filter(x=>x.type==='weapon'&&['uncommon','rare'].includes(x.rarity)&&level>=x.minLevel&&level<=x.maxLevel);
  const chosen=pool[Math.floor(Math.random()*pool.length)];
  if(chosen){
   const name=catalogInstanceName(chosen,level);
   if(!addPack(name,'weapon',1,false,false)){
    (player.flags.pendingEquipmentDrops||(player.flags.pendingEquipmentDrops=[])).push(name);
    add('STOLEN WEAPON HELD — '+name+'. Claim it after freeing backpack space.','system');
   }
   add('STOLEN MAIL — An unexpectedly valuable weapon: '+name+'.','reward');return;
  }
 }
 if(r<.42){
  const name=Math.random()<.3?'Reinforced Bandage':'Bandage';
  if(addPack(name,'consumable',1,false,false))add('STOLEN MAIL — Medical supplies.','reward');
 }else if(r<.72){
  const food=['Fresh Carrot','Fresh Potato','Fresh Apple','Fresh Tomato'][Math.floor(Math.random()*4)];
  if(addPack(food,'consumable',1,false,false))add('STOLEN MAIL — Fresh produce.','reward');
 }else{
  const n=10+Math.floor(Math.random()*36);gainBolts(n);
  add('STOLEN MAIL — '+n+' Bolts hidden in the package.','reward');
 }
}
function tamper(){
 const q=saved(),d=destination(),job=q.job;
 if(!d||job?.status!=='active'||!q.tamperPending)return false;
 delete q.tamperPending;
 if(!removeMail(d)){add('The sealed mail is missing. Nothing was opened.','system');return true;}
 q.job=null;q.suspendedUntil=TODAY()+3;q.restitutionRequired=true;
 if(typeof v52Record==='function')v52Record('Mail Tampering','Tommy Briggs','Opened a Harbor Dispatch '+(job.kind||'package'),100);
 // A package is not guaranteed to open cleanly. Failed opening still destroys the delivery.
 if(Math.random()<.5)contrabandLoot(job.kind||'package');
 else add('The seal breaks, but the contents are crushed and unusable.','danger');
 add('HARBOR DISPATCH CANCELLED — Three-day suspension and a reported bounty.','danger');
 save();return true;
}
const save=()=>{if(typeof v49Autosave==='function')v49Autosave();};
const opts=names=>port55Submenu('Post Office — Tommy Briggs',names);
function office(){
 if(!open()){stage='seaport';port55Menu();return;}
 stage='port55PostOffice';
 const state=saved(),job=current(),dest=destination();
 add('SEAPORT POST OFFICE — TOMMY BRIGGS','place');
 if(job){
  add('HARBOR DISPATCH — '+(dest?.name||'Unknown')+' — '+job.status.toUpperCase(),'bright');
  if(job.status==='active'&&dest)add('DESTINATION — '+dest.place+' — '+(job.kind||'package').toUpperCase(),'system');
  opts(job.status==='delivered'?['CLAIM DELIVERY REWARD','ASK ABOUT THE POST OFFICE','RETURN TO HARBOR']:
       ['OPEN SEALED '+(job.kind==='letter'?'LETTER':'PACKAGE'),'CANCEL DELIVERY','ASK ABOUT THE POST OFFICE','RETURN TO HARBOR']);
 }else if(isSuspended()){
  add('TOMMY > Postal work is suspended'+(blocked()?' until your Mail Tampering bounty is cleared.': ' until day '+suspendUntil()+'.'),'danger');
  opts(['ASK ABOUT THE POST OFFICE','RETURN TO HARBOR']);
 }else if(state.lastIssuedDay===TODAY()){
  add('Harbor Dispatch completed for today. New work tomorrow.','system');
  opts(['ASK ABOUT THE POST OFFICE','RETURN TO HARBOR']);
 }else{
  add('TOMMY > Good to see the mail moving again. One delivery today. Pick a route.','bright');
  opts([...DESTINATIONS.filter(available).map(d=>'ACCEPT '+d.name.toUpperCase()+' DELIVERY'),
   'ASK ABOUT THE POST OFFICE','RETURN TO HARBOR']);
 }
}
function issue(d){
 const q=saved();
 if(!open()||!available(d)||q.job||q.lastIssuedDay===TODAY()||isSuspended())return false;
 const kind=kindFor(d),item=itemFor(d,kind);
 if(!addPack(item,'quest',1,true)){add('Backpack full. Make room before taking the parcel.','system');return false;}
 q.lastIssuedDay=TODAY();q.job={id:d.id,status:'active',kind,item};
 add('HARBOR DISPATCH ACCEPTED — Deliver the sealed '+kind+' to '+d.name+' ('+d.place+').','reward');
 save();return true;
}
function deliver(){
 const q=saved(),d=destination();
 if(!open()||!d||q.job?.status!=='active'||!atDestination(d))return false;
 if(!owns(d)){add('The sealed parcel is missing. Nothing was delivered.','system');return true;}
 if(!removeMail(d))return false;
 q.job.status='delivered';
 add('DELIVERED TO '+d.name.toUpperCase()+' — Return to Tommy at the Seaport Post Office to collect payment.','reward');
 save();renderCurrentChoices();return true;
}
function cancel(){
 const q=saved(),d=destination();
 if(q.job?.status!=='active')return;
 if(d)removeMail(d);
 q.job=null;
 add('TOMMY > I will mark that delivery cancelled. No payment this time. Another assignment will be available tomorrow.','system');
 save();
}
function claim(){
 const q=saved();if(q.job?.status!=='delivered')return;
 const who=destination()?.name||'recipient';
 q.job=null;
 gainBolts(20);gainXp(Math.max(10,(Number(player.level)||1)*2));
 add('HARBOR DISPATCH COMPLETE — '+who+': +20 Bolts and XP.','reward');
 save();
}
function officeCommand(cmd){
 if(['return to harbor','back','b','return','exit'].includes(cmd)){
  delete saved().tamperPending;
  stage='seaport';port55Menu();return true;
 }
 if(cmd==='ask about the post office'){
  delete saved().tamperPending;
  add('TOMMY > One sealed delivery per game day. Routes run through Solace, the Factory and Seaport. Take the parcel to its addressee, then collect your pay here.','bright');
  office();return true;
 }
 if(cmd==='claim delivery reward'){claim();office();return true;}
 if(cmd==='cancel delivery'){cancel();office();return true;}
 if(cmd==='open sealed package'||cmd==='open sealed letter'){
  const q=saved();if(q.job?.status==='active'&&owns(destination())){
   q.tamperPending=true;add('Opening this mail ends the assignment, may reveal loot, and incurs a reported bounty.','danger');
   opts(['CONFIRM MAIL TAMPERING','CANCEL MAIL TAMPERING']);
  }else office();return true;
 }
 if(cmd==='cancel mail tampering'){delete saved().tamperPending;office();return true;}
 if(cmd==='confirm mail tampering'){tamper();office();return true;}
 const match=DESTINATIONS.find(d=>available(d)&&cmd==='accept '+d.name.toLowerCase()+' delivery');
 if(match){issue(match);office();return true;}
 office();return true;
}
// Add handoff to the recipient's real text and graphical menus (Back remains last).
const originalSubmenu=port55Submenu;
port55Submenu=function(name,options){
 const d=destination();
 if(open()&&d&&current()?.status==='active'&&atDestination(d)&&owns(d)){
  const rows=options.filter(x=>x!=='DELIVER HARBOR DISPATCH');
  const back=rows.findIndex(x=>/^RETURN |^BACK$/.test(x));
  rows.splice(back>=0?back:rows.length,0,'DELIVER HARBOR DISPATCH');
  return originalSubmenu.call(this,name,rows);
 }
 return originalSubmenu.apply(this,arguments);
};
// Extend the original Seaport menu after its existing numbered options have been built.
const originalMenu=port55Menu;
port55Menu=function(...args){
 const out=originalMenu.apply(this,args);
 if(open()){
  const index=Object.keys(numberedChoices).filter(k=>/^\d+$/.test(k)).length+1;
  numberedChoices[String(index)]='seaport post office';
  add('['+index+'] SEAPORT POST OFFICE','system');
 }
 return out;
};
const originalCommand=port55Command;
port55Command=function(cmd){
 if(stage==='port55PostOffice')return officeCommand(cmd);
 if(stage==='seaport'&&cmd==='seaport post office'){
  if(open())office();else{add('There is no working post office in Seaport yet.','system');port55Menu();}
  return true;
 }
 return originalCommand.apply(this,arguments);
};
const originalResume=port55Resume;
port55Resume=function(...args){if(stage==='port55PostOffice')return office();return originalResume.apply(this,args);};
// Support save/load and generic context refresh without touching existing states.
const originalRender=renderCurrentChoices;
renderCurrentChoices=function(...args){if(stage==='port55PostOffice')return office();return originalRender.apply(this,args);};
const originalContext=showCurrentContext;
showCurrentContext=function(...args){if(stage==='port55PostOffice')return office();return originalContext.apply(this,args);};
const originalCore=handleCommandCore;
handleCommandCore=async function(raw){
 let cmd=String(raw||'').trim().toLowerCase();
 if(/^\d+$/.test(cmd)&&numberedChoices[cmd])cmd=numberedChoices[cmd];
 if(stage==='port55PostOffice')return officeCommand(cmd);
 const d=destination();
 if(d&&current()?.status==='active'&&atDestination(d)&&
    cmd==='deliver harbor dispatch')return deliver();
 return originalCore.apply(this,arguments);
};
const oldChoices=GraphicalUI.choices;
GraphicalUI.choices=function(...args){
 const rows=oldChoices.apply(this,args),d=destination();
 if(!open()||!d||current()?.status!=='active'||!atDestination(d)||!owns(d))return rows;
 if(rows.some(row=>row.command==='deliver harbor dispatch'))return rows;
 // Do not compete for Miles's 'mail' shortcut if both offices have active routes.
 const handoff={key:'harbor-mail',label:'DELIVER HARBOR DISPATCH TO '+d.name.toUpperCase(),command:'deliver harbor dispatch'};
 const back=rows.findIndex(row=>/^(return|back|leave|exit)\b/i.test(row.label||''));
 const next=[...rows];next.splice(back<0?next.length:back,0,handoff);return next;
};
const model=GraphicalUI.model;
GraphicalUI.model=function(...args){
 const m=model.apply(this,args);
 if(m.active&&stage==='port55PostOffice'&&open()){
  m.art='assets/locations/seaport_post_office.png';
  m.title='SEAPORT POST OFFICE — TOMMY BRIGGS';
  m.regionalSky=null;
 }
 return m;
};
// Solace keeps its existing tampering/bounty/suspension behavior. Add loot
// only when an actual legacy Solace parcel or letter was consumed as a crime.
const previousSolaceCourier=r18CourierCommand;
r18CourierCommand=function(cmd){
 const q=r18CourierState(),wasPending=q.tamperPending===true,job=q.job;
 const kind=job?.destination==='docks'?'package':'letter';
 const before=job&&wasPending&&cmd==='confirm parcel tampering'&&
  job.status==='active'&&r18CourierHas(job.destination);
 const result=previousSolaceCourier.apply(this,arguments);
 if(before&&q.job!==job&&q.restitutionRequired===true){
  if(Math.random()<.5)contrabandLoot(kind);
  else add('The seal tears apart and the contents cannot be salvaged.','danger');
  if(typeof v49Autosave==='function')v49Autosave();
 }
 return result;
};
globalThis.Route127HarborDispatch=Object.freeze({destinations:DESTINATIONS.map(x=>x.id),dailyLimit:1,unlocked:open});
})();
