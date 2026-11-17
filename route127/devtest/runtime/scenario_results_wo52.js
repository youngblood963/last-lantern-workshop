/* DEVTEST acknowledgment for the engine's completed road actions. */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;

 const roadCombat=new Set(['encounter','roadWanderer','jenBoss','terribleBilly','seaportRoadFight']);
 const encounterStages=new Set(['encounter','wandererRoad']);
 const questNotice=/^(?:NEW (?:MAIN )?QUEST|QUEST (?:UPDATED|COMPLETED?|ADDED)|MAIN QUEST COMPLETE|BOUNTY PROOF ACQUIRED)\b/i;
 const retreat=/^(?:back(?: away| off)?|walk away|withdraw|retreat|flee|run)$/i;
 const actionWord=/^(?:search|scavenge|salvage)\b/i;
 const combatStart=new WeakMap();
 let action=null,dialog=null;

 function quantities(items){
  const counts=new Map();
  for(const item of items||[]){
   const name=item.name+(item.stolen?' (stolen)':'');
   counts.set(name,(counts.get(name)||0)+Number(item.qty||0));
  }
  return counts;
 }
 function snapshot(){
  let xp=Number(player.xp)||0;
  for(let level=1;level<player.level;level++)xp+=xpThresholdForLevel(level);
  return {
   xp,hp:player.hp,bolts:player.bolts,turns:player.turns,level:player.level,
   weapon:player.weapon,armor:player.armor,accessory:player.accessory,
   pack:quantities(player.pack),stash:quantities(player.stash),
   held:quantities(player.flags.r5LootQueue)
  };
 }
 function describeChanges(before,after){
  const lines=[];
  const delta=(name,n)=>{if(n)lines.push(name+' '+(n>0?'+':'−')+Math.abs(n));};
  for(const [key,suffix] of [['pack',''],['stash',' (stash)'],['held',' (held loot)']]){
   for(const name of new Set([...before[key].keys(),...after[key].keys()])){
    delta(name+suffix,(after[key].get(name)||0)-(before[key].get(name)||0));
   }
  }
  for(const [key,name] of [['bolts','Bolts'],['xp','XP'],['hp','HP'],['turns','Turns'],['level','Level']]){
   delta(name,after[key]-before[key]);
  }
  for(const key of ['weapon','armor','accessory']){
   if(before[key]!==after[key])lines.push(key[0].toUpperCase()+key.slice(1)+': '+(after[key]||'None'));
  }
  return lines;
 }
 function showResult(title,heading,narrative,changes){
  const node=document.createElement('dialog');
  node.className='r127-scenario-results';
  node.setAttribute('aria-labelledby','r127-scenario-title');
  const append=(parent,tag,text)=>{
   const child=document.createElement(tag);
   child.textContent=text;
   parent.appendChild(child);
   return child;
  };
  const titleNode=append(node,'h2',title);
  titleNode.id='r127-scenario-title';
  append(node,'strong',heading);
  for(const line of narrative)append(node,'p',line);
  if(changes.length){
   const list=append(node,'ul','');
   for(const line of changes)append(list,'li',line);
  }
  const proceed=append(node,'button','Continue');
  proceed.type='button';
  proceed.addEventListener('click',()=>{
   if(dialog!==node)return;
   dialog=null;
   node.close();
   node.remove();
   if(GraphicalUI.active())GraphicalUI.element?.choices?.querySelector('button')?.focus();
   else input.focus();
  });
  node.addEventListener('cancel',event=>event.preventDefault());
  document.body.appendChild(node);
  node.showModal();
  dialog=node;
  proceed.focus();
 }

 const previousAdd=add;
 add=function(text='',cls=''){
  if(action&&typeof text==='string'){
   if(questNotice.test(text))action.quest.add(text);
   else if(!action.completed&&text.trim()&&/^(?:|bright|danger|man|woman)$/.test(cls)&&
      !/^(?:> |[+−-]\d+ HP$|(?:TARGET|GROUP TOTAL|YOU DEAL)\b)/i.test(text)){
    action.story.push(text);
   }
  }
  return previousAdd.apply(this,arguments);
 };

 const previousComplete=completeRoadTurn;
 completeRoadTurn=function(...args){
  if(action)action.completed=true;
  const result=previousComplete.apply(this,args);
  if(action)action.completion=result;
  return result;
 };

 function titleFor(combat){
  if(combat?.source==='roadWanderer')return combat.name;
  if(combat&&combat.source!=='encounter')return combat.name;
  return (stage==='wandererRoad'?currentRoadWanderer:currentEncounter()?.displayName||currentEncounter()?.title)||combat?.name;
 }

 const previousCommand=handleCommand;
 handleCommand=async function(raw){
  if(dialog||action)return;
  const combat=combatState;
  if(busy||(!encounterStages.has(stage)&&!roadCombat.has(combat?.source)))return previousCommand.apply(this,arguments);
  const title=titleFor(combat);
  if(!title)return previousCommand.apply(this,arguments);

  const command=String(r5Mapped(raw)||raw).trim();
  const before=combatStart.get(combat)||snapshot();
  const current=action={before,completed:false,story:[],quest:new Set()};
  try{
   await previousCommand.apply(this,arguments);
   if(current.completion)await current.completion;
   if(roadCombat.has(combatState?.source)&&!combatStart.has(combatState)){
    combatStart.set(combatState,before);
   }
   const finishedRoad=current.completed&&!lanternState()?.pending&&
      !encounterStages.has(stage)&&!combatState;
   if(!finishedRoad&&stage!=='fallen')return;
   const heading=stage==='fallen'?'Defeated':
     retreat.test(command)?'Retreated':
     combat?'Combat victory':
     current.quest.size?'Quest updated':
     actionWord.test(command)?'Scavenging complete':'Encounter resolved';
   const changes=describeChanges(current.before,snapshot());
   // Keep the engine's completed destination as the save state. Reload resumes
   // there directly, so it cannot repeat the resolution or its rewards.
   v49Autosave();
   showResult(title,heading,[...new Set(current.story.slice(-4)),...current.quest],changes);
  }finally{
   action=null;
  }
 };
 globalThis.Route127ScenarioResults=Object.freeze({
  ownsCombat:()=>roadCombat.has(combatState?.source)||!!action?.completed||!!dialog
 });
})();
