/* DEVTEST ONLY — Seaport Post Office / Harbor Dispatch.
 * Opens only after Tommy's bandage rescue AND Seaport liberation.
 * Independent one-per-game-day postal deliveries; Solace/Miles routes untouched.
 */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
const DESTINATIONS=Object.freeze([
 {id:'docks',name:'Harbor Dockmaster',stage:'port55Docks',item:'Harbor Dispatch — Docks'},
 {id:'kaiden',name:'Sheriff Kaiden',stage:'port55Kaiden',item:'Harbor Dispatch — Kaiden'},
 {id:'mia',name:'Mia',stage:'port55Mia',item:'Harbor Dispatch — Mia'},
 {id:'nessa',name:'Nessa',stage:'port55Vendor',item:'Harbor Dispatch — Nessa'}
]);
const TODAY=()=>Math.max(1,Number(day)||1);
const saved=()=>player.flags.r127HarborDispatch||(player.flags.r127HarborDispatch={lastIssuedDay:0,job:null});
const rescued=()=>player.flags.r18RoadsideWO2?.tommyHelp===true||
 (typeof RoadScenarioRegistry?.wo2State==='function'&&RoadScenarioRegistry.wo2State().tommyHelp===true);
const open=()=>player.flags.seaport55?.freed===true&&rescued();
const current=()=>saved().job;
const destination=()=>DESTINATIONS.find(d=>d.id===current()?.id);
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
  opts(job.status==='delivered'?['CLAIM DELIVERY REWARD','ASK ABOUT THE POST OFFICE','RETURN TO HARBOR']:
       ['ASK ABOUT THE POST OFFICE','RETURN TO HARBOR']);
 }else if(state.lastIssuedDay===TODAY()){
  add('Harbor Dispatch completed for today. New work tomorrow.','system');
  opts(['ASK ABOUT THE POST OFFICE','RETURN TO HARBOR']);
 }else{
  add('TOMMY > Good to see the mail moving again. One delivery today. Pick a route.','bright');
  opts([...DESTINATIONS.map(d=>'ACCEPT '+d.name.toUpperCase()+' DELIVERY'),
   'ASK ABOUT THE POST OFFICE','RETURN TO HARBOR']);
 }
}
function issue(d){
 const q=saved();
 if(!open()||q.job||q.lastIssuedDay===TODAY())return false;
 if(!addPack(d.item,'quest',1,true)){add('Backpack full. Make room before taking the parcel.','system');return false;}
 q.lastIssuedDay=TODAY();q.job={id:d.id,status:'active'};
 add('HARBOR DISPATCH ACCEPTED — Deliver the sealed parcel to '+d.name+'.','reward');
 save();return true;
}
function deliver(){
 const q=saved(),d=destination();
 if(!open()||!d||q.job?.status!=='active'||stage!==d.stage)return false;
 if(!owns(d)){add('The sealed parcel is missing. Nothing was delivered.','system');return true;}
 const item=player.pack.find(i=>i.type==='quest'&&i.name===d.item&&i.qty>0);
 item.qty--;if(item.qty===0)player.pack.splice(player.pack.indexOf(item),1);
 q.job.status='delivered';updateHud();
 add('DELIVERED TO '+d.name.toUpperCase()+' — Return to Tommy at the Seaport Post Office to collect payment.','reward');
 save();renderCurrentChoices();return true;
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
  add('TOMMY > One sealed delivery per game day. Deliver it to the named resident, then collect your pay here. Miles is still keeping Solace in business.','bright');
  office();return true;
 }
 if(cmd==='claim delivery reward'){claim();office();return true;}
 const match=DESTINATIONS.find(d=>cmd==='accept '+d.name.toLowerCase()+' delivery');
 if(match){issue(match);office();return true;}
 office();return true;
}
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
 if(d&&current()?.status==='active'&&stage===d.stage&&
    cmd==='deliver harbor dispatch')return deliver();
 return originalCore.apply(this,arguments);
};
const oldChoices=GraphicalUI.choices;
GraphicalUI.choices=function(...args){
 const rows=oldChoices.apply(this,args),d=destination();
 if(!open()||!d||current()?.status!=='active'||stage!==d.stage||!owns(d))return rows;
 if(rows.some(row=>row.command==='deliver harbor dispatch'))return rows;
 return [...rows,{key:'mail',label:'DELIVER HARBOR DISPATCH',command:'deliver harbor dispatch'}];
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
