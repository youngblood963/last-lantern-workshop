/* DEVTEST: canonical, state-driven graphical journal.
 * Presentation only: no quest flags, map positions, rewards or saves mutated.
 * One Relay entry, one location per site, no scraped prose as fake quests.
 */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof TravelerPanels==='undefined')return;
const panel=TravelerPanels;
const done=state=>['done','complete','completed'].includes(String(state||'').toLowerCase());
const visible=state=>state!==undefined&&state!==null&&state!==false&&
  !['','locked','upcoming','new'].includes(String(state).toLowerCase());
const relayNames={
 ask:'Ask Tim, Jen, or Murphy about the Relay Station in Solace.',
 find:'Investigate the Relay Station behind Solace’s north wall.',
 stabilize:'Recover all four Relay components and return to the station.'
};
function relayDetails(){
 const f=player.flags,details=[];
 if(f.relayQuest==='stabilize'){
  const parts=typeof ensureRelayParts==='function'?ensureRelayParts():{};
  const count=['johnny','yard','branch','east'].filter(k=>!!parts[k]).length;
  details.push('Components recovered: '+count+'/4.');
  if(f.relayPartsRevealed&&typeof PlaythroughRepairs?.relayDirections==='function')
   details.push(...PlaythroughRepairs.relayDirections());
  else details.push('Inspect all four Relay systems to identify the missing components.');
  if(count===4)details.push('Return to the Relay Station to stabilize the connection.');
 }else details.push(relayNames[f.relayQuest]||'Investigate the Relay Station in Solace.');
 return details;
}
const descriptions={
 r18CountyQuest:'Follow the county rescue leads to Eli Mercer.',
 r18DanielQuest:'Follow the clues to Daniel Bennett.',
 mainSolaceQuest:'Reach the settlement of Solace.',
 timQuest:'Find Tim’s Old Badge and return it to him in Solace.',
 murphyQuest:'Recover the usable serpentine belt and return it to Murphy.',
 jenQuest:'Track the missing supplies and runner for Jen.',
 johnnyQuest:'Recover Johnny’s missing ledger.',
 amiiQuest:'Recover the missing bank satchel.',
 waynePatientQuest:'Find medicine for Wayne’s patient.',
 houseQuest:'Investigate the occupied abandoned house.',
 timHouseBounty:'Resolve the old-house bounty and report to Tim.',
 terribleBillyBounty:'Find Terrible Billy and return proof to Tim.',
 jenUnpaidTab:'Settle the unpaid tavern tab.',
 jenFamiliarFace:'Follow Jen’s lead on the familiar traveler.'
};
function objective(){
 const f=player.flags;
 if(f.chapterOneComplete)return 'Chapter One completed. Further chapters are in development.';
 if(f.mainSolaceQuest!=='done'&&f.mainSolaceQuest!=='complete')
  return 'Reach Solace and find shelter.';
 if(!done(f.relayQuest)){
  if(f.relayQuest==='stabilize')return 'Restore the Relay — recover the four components ('+
   (typeof ensureRelayParts==='function'?Object.values(ensureRelayParts()).filter(Boolean).length:0)+'/4).';
  return relayNames[f.relayQuest]||'Speak with Tim about restoring the Relay Station.';
 }
 return typeof portQuestObjective==='function'?portQuestObjective():'Continue toward the Factory.';
}
function build(page){
 const f=player.flags,rows=[],seen=new Set();
 function push(title,details){
  const key=title.toLowerCase().replace(/[^a-z0-9]/g,'');
  if(seen.has(key))return;
  seen.add(key);rows.push({title,details:Array.isArray(details)?details:[details]});
 }
 if(page==='locations'){
  if(f.wo4Hospital?.discovered){
   const q=f.wo4Hospital;
   push('St. Mercy Hospital',['Trade Route. '+(q.cleared?'Entrance cleared.':'Entrance still guarded.')]);
  }
  if(f.wo6Sites?.freshMartDiscovered||f.wo2?.freshMartClue)
   push('Fresh Mart',['Industrial Road. Discovered location.']);
  if(f.r18Station?.facility?.discovered)
   push('Station Nine',['West Ridge Road. Discovered location.']);
  if(f.wo2?.wo4BrokenBridge)push('Broken Bridge',['Discovered location. No onward route established.']);
  return rows;
 }
 const completed=page==='completed';
 // Quest flags are authoritative; raw log strings and location breadcrumbs are not.
 if(typeof R5_QUESTS!=='undefined')for(const [key,name] of R5_QUESTS){
  if(key==='relayQuest')continue;
  const state=f[key];if(!visible(state)||done(state)!==completed)continue;
  push(name,[descriptions[key]||'Quest status: '+String(state)+'.',
    ...(completed?['Completed.']:[])]);
 }
 if(visible(f.relayQuest)&&done(f.relayQuest)===completed)
  push('Restore the Relay',completed?['Connection stabilized. The Factory is the next lead.']:relayDetails());
 if(completed){
  if(f.chapterOneComplete)push('The Road to Seaport',['Chapter One completed.']);
  if(f.r18Courier?.delivered?.tim&&f.r18Courier?.delivered?.jen&&f.r18Courier?.delivered?.docks)
   push('Neither Rain Nor Ruin',['Delivered all three items. Solace Post Office opened.']);
  if(f.r18Station?.restored)push('Station Nine',['Communications restored.']);
 }else{
  if(f.r18Courier?.phase==='initial'){
   const d=f.r18Courier.delivered||{};
   const remaining=[['tim','Tim in Solace'],['jen','Jen in Solace'],
    ['docks','Seaport docks (after liberation)']].filter(([k])=>!d[k]).map(([,v])=>v);
   push('Neither Rain Nor Ruin',['Deliver the remaining sealed mail: '+remaining.join('; ')+'.']);
  }
  if(f.r18Courier?.job){
   push('Postal Delivery',['Destination: '+f.r18Courier.job.destination+
      '. Status: '+f.r18Courier.job.status+'.'+(f.r18Courier.job.status==='delivered'?
      ' Return to Solace Post Office for payment.':'')]);
  }
  if(f.r18Station&&!f.r18Station.restored&&f.r18Station.hunters)
   push('Station Nine',['Resolve the Signal Hunters and repair the tower.']);
  if(Number(player.level)>=10&&f.wo3Corvette?.active&&!f.wo3Corvette.complete)
   push('Murphy’s Ride',['Find the Corvette and recover the required restoration components.']);
 }
 if(typeof R11_QUESTS!=='undefined'&&f.r11Quests)for(const [key,state] of Object.entries(f.r11Quests)){
  if(visible(state)&&done(state)===completed&&R11_QUESTS[key])
   push(R11_QUESTS[key].name,completed?['Completed.']:
    [state==='ready'?'Return to '+R11_QUESTS[key].giver+' to report your findings.':'Follow the leads from '+R11_QUESTS[key].giver+'.']);
 }
 return rows;
}
panel.journalOutput=async function(){
 this.working=true;
 if(this.closeButton)this.closeButton.disabled=true;
 try{
  this.questEntries=build(this.page);
  this.questIndex=Math.min(Math.max(0,this.questIndex||0),Math.max(0,this.questEntries.length-1));
  this.mainObjective=objective();
 }finally{
  this.working=false;
  if(this.closeButton)this.closeButton.disabled=false;
 }
};
const previousJournal=panel.journal;
panel.journal=function(){
 if(this.page==='locations'){
  const left=this.node('section','traveler-list-section');
  left.appendChild(this.tabs(['Active','Completed','Locations'],'Locations',
   label=>this.journalPage(label.toLowerCase())));
  left.appendChild(this.node('p','traveler-main-objective','DISCOVERED LOCATIONS — recorded separately from quests.'));
  const list=this.node('div','traveler-list');
  for(const [i,e] of (this.questEntries||[]).entries()){
   const b=this.button(e.title,()=>{this.questIndex=i;this.render();},'traveler-quest');
   b.setAttribute('aria-pressed',String(i===this.questIndex));list.appendChild(b);
  }
  if(!this.questEntries?.length)list.appendChild(this.node('p','traveler-empty','No discovered sites recorded.'));
  left.appendChild(list);this.body.appendChild(left);
  const right=this.node('section','traveler-detail');right.appendChild(this.art('quests'));
  const selected=this.questEntries?.[this.questIndex];
  right.appendChild(this.node('h2','',selected?.title||'Discovered locations'));
  for(const detail of selected?.details||[])right.appendChild(this.node('p','',detail));
  this.body.appendChild(right);return;
 }
 // Existing visual design, with a third tab for actual locations.
 const originalTabs=this.tabs;
 this.tabs=function(labels,selected,fn){
  if(labels.length===2&&labels[0]==='Active'&&labels[1]==='Completed')
   labels=['Active','Completed','Locations'];
  return originalTabs.call(this,labels,selected,fn);
 };
 try{return previousJournal.call(this)}
 finally{this.tabs=originalTabs}
};
globalThis.Route127JournalFix=Object.freeze({build,objective});
})();
