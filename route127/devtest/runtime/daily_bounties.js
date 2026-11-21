/* DEVTEST daily contracts. The turn refill deadline is the rotation identifier. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
const premium=1.5, chances=[.2,.2,.35,.35,.5,.5,.75,.75,1];
const billy={id:'terrible_billy',name:'Terrible Billy',level:5,threat:'Introductory',
 art:'../scenarios/terrible_billy.png',description:'A young gunslinger in a torn duster has been hitting travelers east of Solace.',
 history:'Roadside raids and attacks on travelers.'};
const roster=new Map([billy,...DAILY_BOUNTY_ROSTER].map(target=>[target.id,target]));
const regionName=region=>({NORTH:'Northern Region',EAST:'Eastern Region',WEST:'Western Region',SEAPORT:'Seaport Coast'}[region]||
 String(region).toLowerCase().replace(/^./,letter=>letter.toUpperCase()));
let dialog,source,selected,refresh;
function baseline(level){
 // The existing encounter payout function reads the current level from WO7.
 // Bind only that synchronous quote to the fixed target level.
 const prior=WO7.level;
 try{
  WO7.level=()=>level;
  return Economy.generated.call({entry:()=>null,action:'FIGHT',regionLevel:()=>Economy.regions.CENTRAL});
 }finally{WO7.level=prior;}
}
function quote(target){
 return target.id===billy.id?100:Math.ceil(baseline(target.level)*premium/10)*10;
}
function accessibleRegions(){
 const g=lanternState(),start=g?.nodeId||g?.lastSettlement||'solace';
 const reached=new Set([start]),pending=[start],regions=new Set();
 for(const node of pending){
  for(const edge of lanternConnections(node)){
   if(!lanternAllowed(edge))continue;
   if(!g?.solaceAdmitted&&g?.nodeId==='house'&&(edge.a==='solace'||edge.b==='solace'))continue;
   const other=edge.a===node?edge.b:edge.a;
   if(!reached.has(other)){reached.add(other);pending.push(other);}
   for(let i=1;i<edge.distanceTurns;i++){
    const region=route127CurrentRegion({currentEdgeId:edge.id,stepIndex:i,direction:1});
    if(region)regions.add(region);
   }
  }
 }
 return [...regions].sort();
}
function rngFor(deadline){
 let seed=127;
 for(const ch of String(player.characterId||player.handle||'survivor')+'|'+deadline)seed=(Math.imul(seed,31)+ch.charCodeAt(0))>>>0;
 return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
}
function state(){
 ensureRefillClock();
 const deadline=Number(player.flags.nextRefillAt),prior=player.flags.dailyBounties;
 if(prior?.deadline===deadline)return prior;
 const rng=rngFor(deadline),regions=accessibleRegions();
 const contracts=[];
 if(regions.length)for(const tier of [DAILY_BOUNTY_ROSTER.slice(0,6),DAILY_BOUNTY_ROSTER.slice(6,13),DAILY_BOUNTY_ROSTER.slice(13)]){
  const pool=tier.filter(target=>!machine(target)||regions.some(region=>['CENTRAL','INDUSTRIAL','EAST'].includes(region)));
  const target=pool[Math.floor(rng()*pool.length)];
  if(!target)continue;
  const eligible=machine(target)?regions.filter(region=>['CENTRAL','INDUSTRIAL','EAST'].includes(region)):regions;
  contracts.push({id:deadline+':'+target.id,target:target.id,region:eligible[Math.floor(rng()*eligible.length)],
   payment:quote(target),status:'available',steps:0});
 }
 const next=player.flags.dailyBounties={deadline,contracts,history:prior?.history||[]};
 const g=lanternState();
 if(g?.dailyBountyTarget&&g.dailyBountyTarget!==billy.id){
  delete g.dailyBountyTarget;
  if(stage==='encounter'&&g.pending&&!combatState){completeRoadTurn();add('The previous bounty has expired.','system');}
 }
 v49Autosave();
 return next;
}
function machine(target){return target.id==='unit_06_warrant'||target.id==='repossessor';}
function introductory(){
 return {id:billy.id,target:billy.id,region:'Solace–Factory road',payment:100,
  status:{active:'active',proof:'proof',done:'claimed'}[player.flags.terribleBillyBounty]||'available'};
}
function contracts(){
 processRefill();
 return [introductory(),...state().contracts];
}
function act(id,action,contact){
 const contract=contracts().find(row=>row.id===id);
 if(!contract)return false;
 const intro=id===billy.id;
 if(action==='accept'&&contract.status==='available'){
  if(intro)player.flags.terribleBillyBounty='active';
  else {contract.status='active';contract.steps=0;}
 }else if(action==='abandon'&&contract.status==='active'&&!intro){
  contract.status='available';contract.steps=0;
 }else if(action==='claim'&&contract.status==='proof'&&['tim','kaiden'].includes(contact)){
  if(intro){
   player.flags.terribleBillyBounty='done';
   gainXp(140);
  }else{
   contract.status='claimed';
   state().history.push({target:contract.target,payment:contract.payment,deadline:state().deadline});
  }
  gainBolts(contract.payment);
  add('BOUNTY PAID — '+roster.get(contract.target).name+' · '+contract.payment+' Bolts.','reward');
 }else return false;
 v49Autosave();
 return true;
}
function atCurrentRoad(){
 const g=lanternState();
 if(!g?.pending||!g.currentEdgeId||!g.dailyBountyTarget)return null;
 if(g.dailyBountyTarget===billy.id){const intro=introductory();return intro.status==='active'?intro:null;}
 const today=player.flags.dailyBounties;
 if(today?.deadline<=Date.now())return null;
 return today?.contracts.find(row=>row.id===g.dailyBountyTarget&&row.status==='active')||null;
}
function begin(contract){
 if(atCurrentRoad()?.id!==contract.id)return false;
 const target=roster.get(contract.target);
 if(contract.id===billy.id){
  add('A young gunslinger steps from behind a wreck, fingertips resting on his worn revolver. “Tim sent you?”','system');
  const spec={name:'TERRIBLE BILLY',level:5,hp:42,min:7,max:12,xp:70,bolts:35,
   end:'Terrible Billy drops his weapon and collapses beside the road.'};
  startCombat(WO33Combat.normalize(spec,'terribleBilly',5),'terribleBilly');
 }else{
  const level=target.level;
  const spec={name:target.name.toUpperCase(),level,hp:Math.round(baseHpForLevel(level)*.30),
   min:5,max:9,xp:Math.round(xpThresholdForLevel(level)*.10),bolts:baseline(level),dailyBountyId:contract.id,
   end:target.name+' falls. The road is quiet again.'};
  startCombat(WO33Combat.normalize(spec,'encounter',level),'encounter');
 }
 v49Autosave();
 return true;
}
const priorCurrent=currentEncounter;
currentEncounter=function(...args){
 const contract=atCurrentRoad();
 if(!contract)return priorCurrent.apply(this,args);
 const target=roster.get(contract.target);
 return {title:target.name.toUpperCase(),dailyBounty:true,dailyBountyLevel:target.level,description:()=>target.description,text:target.description,choices:'ENGAGE BOUNTY TARGET   BACK AWAY',exclusive:true,
  resolve(cmd){return cmd==='engage bounty target'&&begin(contract);}};
};

// Runs at the ordinary scenario-selection point, after story and fixed events.
const priorPrepare=r10PrepareEncounter;
r10PrepareEncounter=function(...args){
 const g=lanternState();
 if(!g?.pending||!g.currentEdgeId)return priorPrepare.apply(this,args);
 if(atCurrentRoad())return true;
 if(resumeSavedEncounter||g.bountyRollScene===g.sceneId||player.flags.wo6FixedSite)return priorPrepare.apply(this,args);
 g.bountyRollScene=g.sceneId;
 const edge=lanternEdge(),region=route127CurrentRegion(g);
 const daily=contracts();
 const intro=daily[0],introHere=terribleBillyEligibleRoad();
 const eligible=edge&&g.stepIndex>0&&g.stepIndex<edge.distanceTurns?daily.slice(1).filter(row=>row.status==='active'&&row.region===region):[];
 for(const row of eligible)row.steps++;
 const target=introHere?intro:eligible.sort((a,b)=>b.steps-a.steps).find(row=>Math.random()<chances[Math.min(chances.length,row.steps)-1]);
 if(!target)return priorPrepare.apply(this,args);
 g.dailyBountyTarget=target.id;
 g.encounterIndex=null;
 player.flags.r10LastRoadCategory='combat';
 return true;
};
const priorComplete=completeRoadTurn;
completeRoadTurn=function(...args){
 const g=lanternState();
 if(g?.dailyBountyTarget)delete g.dailyBountyTarget;
 return priorComplete.apply(this,args);
};

const priorVictory=finishCombatVictory;
finishCombatVictory=function(fight){
 if(fight?.dailyBountyId&&!fight.modVictoryProcessed){
  const row=contracts().find(contract=>contract.id===fight.dailyBountyId&&contract.status==='active');
  if(row){
   row.status='proof';row.steps=0;
   add('BOUNTY PROOF — Collect '+row.payment+' Bolts from Tim or Kaiden before the reset.','reward');
  }
 }
 const result=priorVictory.apply(this,arguments);
 if(fight?.dailyBountyId||fight?.source==='terribleBilly')v49Autosave();
 return result;
};
const priorRefill=processRefill;
processRefill=function(...args){
 const deadline=player.flags.nextRefillAt;
 const result=priorRefill.apply(this,args);
 if((player.flags.dailyBounties||deadline&&deadline!==player.flags.nextRefillAt&&player.flags.interfaceUnlocked)&&
    player.flags.dailyBounties?.deadline!==player.flags.nextRefillAt)state();
 return result;
};

function journal(){
 return contracts().slice(1).filter(row=>['active','proof'].includes(row.status)).map(row=>{
  const target=roster.get(row.target);
  return {title:'Daily bounty — '+target.name,detail:(row.status==='proof'?'Ready to claim at Tim or Kaiden':'Search '+regionName(row.region))+
   ' · Level '+target.level+' · '+row.payment+' Bolts · Expires at next reset'};
 });
}
const priorJournal=showQuests;
showQuests=function(...args){
 const result=priorJournal.apply(this,args);
 if(player.flags.r5JournalPage!=='completed')for(const entry of journal()){
  add('SIDE QUEST — '+entry.title,'place');add(entry.detail,'system');
 }
 return result;
};

function element(tag,text,cls){
 const node=document.createElement(tag);
 if(text)node.textContent=text;if(cls)node.className=cls;
 return node;
}
function button(label,action){
 const node=element('button',label);node.type='button';node.addEventListener('click',action);return node;
}
const statusLabel={available:'Available',active:'Active',proof:'Ready to Claim',claimed:'Completed'};
function portrait(target){
 const art=element('img');
 art.alt='';art.loading='lazy';
 const base='../devtest/assets/enemies/';
 art.addEventListener('error',()=>{art.hidden=true;},{once:true});
 art.src=base+target.art;
 return art;
}
function draw(){
 if(!dialog?.open)return;
 const list=source==='preview'?[...roster.values()].map(target=>({
  id:target.id,target:target.id,region:'Rotating',payment:quote(target),status:'available'
 })):contracts();
 const title=element('h2',"Wasteland’s Most Wanted");title.id='r127-wanted-title';
 const time=element('p','Daily bounties expire at the next daily reset. Defeat your target and collect your payment before time runs out.');
 const clock=element('strong',source==='preview'?'Roster preview':refillText());clock.id='r127-wanted-clock';time.append(' Time remaining ',clock);
 const body=element('div',null,'wanted-posters');
 const row=list.find(item=>item.id===selected);
 if(row){
  const target=roster.get(row.target),card=element('article',null,'wanted-poster wanted-detail');
  card.append(portrait(target),element('h3','WANTED — '+target.name),
   element('strong','REWARD — '+row.payment+' BOLTS'),
   element('p','Level '+target.level+' · '+target.threat+' · '+statusLabel[row.status]),
   element('p','Last known location — '+regionName(row.region)),
   element('p',target.appearance||target.description),element('p',target.history));
  if(target.appearance)card.append(element('p',target.description));
  if(row.id===billy.id)card.append(element('p','Introductory contract · No expiration.'));
  const action=source==='preview'?null:row.status==='available'?'accept':row.status==='active'&&row.id!==billy.id?'abandon':row.status==='proof'&&source!=='board'?'claim':null;
  if(action)card.append(button({accept:'Accept Bounty',abandon:'Abandon Contract',claim:'Claim '+row.payment+' Bolts'}[action],()=>{
   if(act(row.id,action,source)&&action==='claim'){
    dialog.close();
    if(source==='tim')v53TimMenu();
    else r18KaidenChoices();
    return;
   }
   draw();
  }));
  if(row.status==='proof'&&source==='board')card.append(element('p','See Tim in Solace or Kaiden in Seaport to collect payment.'));
  body.append(card);
 }else{
  for(const status of Object.keys(statusLabel)){
   const group=element('section',null,'wanted-section');
   group.append(element('h3',statusLabel[status]+' Bounties'));
   const cards=element('div',null,'wanted-grid');
   for(const offer of list.filter(item=>item.status===status)){
    const target=roster.get(offer.target),card=button('',()=>{selected=offer.id;draw();});
    card.className='wanted-poster';
    card.append(portrait(target),element('strong',target.name),element('span','Level '+target.level+' · '+regionName(offer.region)),
     element('strong',offer.payment+' Bolts'));
    cards.append(card);
   }
   if(status==='claimed'&&source!=='preview')for(const entry of state().history.filter(entry=>entry.deadline!==state().deadline).slice(-12).reverse()){
    cards.append(element('p',roster.get(entry.target)?.name+' · '+entry.payment+' Bolts'));
   }
   if(!cards.children.length)cards.append(element('p','None'));
   group.append(cards);body.append(group);
  }
 }
 const controls=element('div',null,'wanted-controls');
 if(row)controls.append(button('Back to Bounties',()=>{selected=null;draw();}));
 controls.append(button('Close',()=>dialog.close()));
 dialog.replaceChildren(title,time,body,controls);
}
function open(contact){
 source=contact;selected=null;
 if(!dialog){
  dialog=element('dialog',null,'r127-wanted-board');
  dialog.setAttribute('aria-labelledby','r127-wanted-title');
  dialog.addEventListener('close',()=>clearInterval(refresh));
  document.body.append(dialog);
 }
 if(!dialog.open)dialog.showModal();
 draw();
 clearInterval(refresh);
 if(contact==='preview')return;
 let deadline=state().deadline;
 refresh=setInterval(()=>{
  if(!dialog.open)return;
  if(source==='preview')return;
  processRefill();
  if(deadline!==state().deadline){deadline=state().deadline;selected=null;draw();}
  else dialog.querySelector('#r127-wanted-clock').textContent=refillText();
 },1000);
}
const priorCommand=handleCommandCore;
handleCommandCore=async function(raw){
 const cmd=r5Mapped(raw);
 if(!busy){
  const f=player.flags;
  if(stage==='mercy'&&mercyLocation==='tim'&&['bounties','view bounties','about bounties'].includes(cmd))return open('tim');
  if(stage==='mercy'&&mercyLocation==='tim'&&cmd==='view warrants')return v52WantedBoard();
  if(stage==='port55Kaiden'&&['bounties','view bounties'].includes(cmd))return open('kaiden');
  if(stage==='mercy'&&f.solaceMenu==='board'&&!f.v53BoardEntry&&f.v53BoardDraft===undefined&&cmd==="wasteland's most wanted")return open('board');
  if(stage==='encounter'){
   const row=atCurrentRoad();
   if(row&&cmd==='engage bounty target')return begin(row);
   if(!row&&cmd==='engage bounty target'){processRefill();add('That bounty is no longer active.','system');return;}
   if(row&&['back away','back','b'].includes(cmd)){completeRoadTurn();v49Autosave();return;}
  }
 }
 return priorCommand.apply(this,arguments);
};
function artTarget(){
 if(!['encounter','combat','combatItems'].includes(stage))return null;
 const id=combatState?.dailyBountyId?.split(':').at(-1)||
  (stage==='encounter'?atCurrentRoad()?.target:null);
 return id&&id!==billy.id?roster.get(id):null;
}
window.addEventListener('keydown',event=>{if(dialog?.open)event.stopImmediatePropagation();},true);
globalThis.DailyBounties={openBoard(onClose){open('board');dialog.addEventListener('close',onClose,{once:true});},artTarget,preview:()=>open('preview'),quote,roster:()=>[...roster.values()]};
})();
