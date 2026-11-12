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
const owns=d=>player.pack.some(i=>i.type==='quest'&&i.name===d.item&&(Number(i.qty)||0)>0);
const save=()=>{if(typeof v49Autosave==='function')v49Autosave();};
const opts=names=>port55Submenu('Post Office — Tommy Briggs',names);
function office(){
 if(!open()){stage='seaport';port55Menu();return;}
 stage='port55PostOffice';
 const state=saved(),job=current(),dest=destination();
 add('SEAPORT POST OFFICE — TOMMY BRIGGS','place');
 if(job){
  add('HARBOR DISPATCH — '+(dest?.name||'Unknown')+' — '+job.status.toUpperCase(),'bright');
  if(job.status==='active'&&dest)add('DESTINATION — '+dest.place,'system');
  opts(job.status==='delivered'?['CLAIM DELIVERY REWARD','ASK ABOUT THE POST OFFICE','RETURN TO HARBOR']:
       ['CANCEL DELIVERY','ASK ABOUT THE POST OFFICE','RETURN TO HARBOR']);
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
 if(!open()||!available(d)||q.job||q.lastIssuedDay===TODAY())return false;
 if(!addPack(d.item,'quest',1,true)){add('Backpack full. Make room before taking the parcel.','system');return false;}
 q.lastIssuedDay=TODAY();q.job={id:d.id,status:'active'};
 add('HARBOR DISPATCH ACCEPTED — Deliver the sealed parcel to '+d.name+' ('+d.place+').','reward');
 save();return true;
}
function deliver(){
 const q=saved(),d=destination();
 if(!open()||!d||q.job?.status!=='active'||!atDestination(d))return false;
 if(!owns(d)){add('The sealed parcel is missing. Nothing was delivered.','system');return true;}
 const item=player.pack.find(i=>i.type==='quest'&&i.name===d.item&&i.qty>0);
 item.qty--;if(item.qty===0)player.pack.splice(player.pack.indexOf(item),1);
 q.job.status='delivered';updateHud();
 add('DELIVERED TO '+d.name.toUpperCase()+' — Return to Tommy at the Seaport Post Office to collect payment.','reward');
 save();renderCurrentChoices();return true;
}
function cancel(){
 const q=saved(),d=destination();
 if(q.job?.status!=='active')return;
 if(d){const item=player.pack.find(i=>i.type==='quest'&&i.name===d.item&&i.qty>0);
  if(item){item.qty--;if(item.qty<=0)player.pack.splice(player.pack.indexOf(item),1);updateHud();}}
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
  stage='seaport';port55Menu();return true;
 }
 if(cmd==='ask about the post office'){
  add('TOMMY > One sealed delivery per game day. Routes run through Solace, the Factory and Seaport. Take the parcel to its addressee, then collect your pay here.','bright');
  office();return true;
 }
 if(cmd==='claim delivery reward'){claim();office();return true;}
 if(cmd==='cancel delivery'){cancel();office();return true;}
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
globalThis.Route127HarborDispatch=Object.freeze({destinations:DESTINATIONS.map(x=>x.id),dailyLimit:1,unlocked:open});
})();
