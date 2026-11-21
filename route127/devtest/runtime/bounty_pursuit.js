/* DEVTEST — NPC pursuit uses the character's existing criminal record. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;

const roster=[
 ['jed_hawkins','Jed "Quickdraw" Hawkins','weapon-common-rusted-revolver','A young gunslinger studies a folded warrant. “Well, I’ll be damned. You’re worth a pretty nice payday.”'],
 ['marcus_delgado','Marcus "Chains" Delgado','weapon-common-sawed-off-shotgun','The biker lets a length of chain drop against his boot. “I’ve got all day. You don’t.”'],
 ['harold_booker','Harold "The Badge" Booker','weapon-uncommon-restored-service-pistol','An old officer squares his shoulders. “Name matches the warrant. Hands where I can see them.”'],
 ['mei_zhang','Mei "The Needle" Zhang','weapon-uncommon-combat-knife','A woman steps quietly into your path, knife already drawn. “You left an easy trail.”'],
 ['dolores_baptiste','Dolores "Mama D" Baptiste','weapon-uncommon-double-barrel-shotgun','The woman in yellow studies your face. “I had hoped you’d make a better choice, sweetheart.”'],
 ['viktor_sokolov','Viktor "The Butcher" Sokolov',null,'A huge man finishes wrapping his hands. “I walked a long way for this.”'],
 ['evelyn_voss','Evelyn "Black Widow" Voss','weapon-uncommon-restored-service-pistol','A woman in a mourning veil draws two pistols. “How fortunate. I was already dressed for the occasion.”'],
 ['samuel_redfeather','Samuel "Ghost" Redfeather','weapon-common-hunting-rifle','A tracker lowers his binoculars. “You crossed the wash twice. I only had to cross it once.”'],
 ['elias_kessler','Dr. Elias "The Surgeon" Kessler','weapon-uncommon-combat-knife','A doctor closes his medical satchel. “Hold still. This will be quicker if you cooperate.”'],
 ['ruth_holloway','Ruth "The Undertaker" Holloway','weapon-rare-ranger-s-revolver','An elderly woman unfastens her coat. “Long walk. Let’s spare each other the speeches.”']
].map(([id,name,weapon,line],rank)=>({id,name,weapon,line,rank,art:'bounty_hunter_'+id+'.png'}));
const generic={id:'enforcement',name:'Wasteland Bounty Enforcer',weapon:'weapon-rare-suppressed-service-pistol',
 rank:9,art:'armored_scavenger.png',line:'An enforcer holds up a worn warrant. “The names change. Your debt doesn’t.”'};
const hunter=id=>roster.find(entry=>entry.id===id)||generic;
const state=()=>player.flags.bountyPursuit||={
 defeated:[],totalDefeated:0,index:0,serial:0,recovery:0,pursuit:null,resolution:null,lastMove:null
};
const record=()=>v52Crime();
const cleared=()=>record().bounty<=0;
const save=()=>v49Autosave();
const threshold=100;
const sheriffGrace=5;
const recoveryTurns=3;

function distance(g=lanternState()){
 if(!g)return Infinity;
 const edge=LG_EDGES[g.currentEdgeId];
 const towns=['solace'];
 if(player.flags.portRoadCleared&&portState().freed)towns.push('seaport');
 if(!edge&&towns.includes(g.nodeId))return 0;
 const distances=towns.map(to=>{
  if(!edge)return lanternShortest(g.nodeId,to);
  if(!lanternAllowed(edge))return Infinity;
  return Math.min(g.stepIndex+lanternShortest(edge.a,to),edge.distanceTurns-g.stepIndex+lanternShortest(edge.b,to));
 });
 return Math.min(...distances);
}
function assign(q){
 const turns=distance();
 if(!Number.isFinite(turns))return false;
 q.index=roster.findIndex(entry=>!q.defeated.includes(entry.id));
 if(q.index<0)q.index=roster.length;
 const next=roster[q.index]||generic;
 q.pursuit={id:next.id,serial:++q.serial,remaining:turns+sheriffGrace,duration:turns+sheriffGrace,
  warned:[],phase:'tracking'};
 return true;
}
function stop(announce){
 const q=player.flags.bountyPursuit;
 if(q){q.pursuit=null;q.recovery=0;q.continuing=false;q.resolution='cleared';}
 if(announce){
  add('BOUNTY CLEARED — Your outstanding warrants have been withdrawn. The bounty hunters have been called off.','reward');
  save();
 }
}
function synchronize(){
 if(cleared()){if(player.flags.bountyPursuit?.pursuit||player.flags.bountyPursuit?.recovery)stop(false);return false;}
 const q=state();
 if(q.pursuit||q.recovery||(!q.continuing&&record().bounty<threshold))return false;
 return assign(q);
}
function warn(p){
 const n=p.remaining;
 if(![5,3,1].includes(n)||p.warned.includes(n))return;
 p.warned.push(n);
 const name=hunter(p.id).name;
 if(n===5){
  add('⚠ RUMORS FROM THE WASTELAND','place');
  add('Word has it that '+name+' has accepted your bounty. Travelers report questions about your whereabouts.','danger');
  add('BOUNTY HUNTER APPROACHING — 5 TURNS','danger');
  add('Outstanding Bounty: '+record().bounty+' Bolts. Better reach Tim or Sheriff Kaiden before the hunter finds you.','danger');
 }else{
  add(n===3?'A passing traveler reports seeing '+name+' following your trail.':'Fresh tracks follow your route. Someone is very close.','danger');
  add(n+(n===1?' TURN REMAINING':' TURNS REMAINING'),'danger');
 }
}
function roadMoved(serial){
 if(cleared()){synchronize();return;}
 const q=state();
 if(q.lastMove===serial)return;
 q.lastMove=serial;
 if(q.recovery){
  if(--q.recovery===0)synchronize();
  return;
 }
 const p=q.pursuit;
 if(!p){synchronize();return;}
 if(p.phase!=='tracking')return;
 // A five-turn assignment in town stays secret until the first road movement.
 warn(p);
 p.remaining--;
 if(p.remaining===0)p.phase='pending';
 else warn(p);
}
function startSpec(p){
 const who=hunter(p.id),level=WO33Combat.level(Number(player.level)+who.rank*2);
 const def=who.weapon&&EQUIPMENT_CATALOG.find(row=>row.id===who.weapon);
 const gear=def&&GEAR[catalogInstanceName(def,level)];
 const spec={name:who.name,level,hp:baseHpForLevel(level)*.30,
  min:gear?.min||5,max:gear?.max||10,
  armorDef:GEAR['Worn Jacket']?.def||0,xp:0,bolts:0,wo2NoEquipment:true,
  pursuitSerial:p.serial,pursuitHunter:p.id,end:who.name+' falls. Word will travel.',r18NoRetreat:true};
 return WO33Combat.normalize(spec,'bountyHunter',level);
}
function intercept(){
 const g=lanternState(),q=player.flags.bountyPursuit,p=q?.pursuit;
 if(cleared()||!p||p.phase!=='pending'||combatState||!g||g.pending)return false;
 const road=stage==='lanternRoad'&&!!g.currentEdgeId;
 const junction=stage==='lanternNode'&&!['solace','seaport','factory','house'].includes(g.nodeId);
 if(!road&&!junction)return false;
 p.phase='combat';
 const who=hunter(p.id);
 add('BOUNTY HUNTER HAS FOUND YOU','danger');
 add('BOUNTY HUNTER — '+who.name,'place');add(who.line,'bright');
 startCombat(startSpec(p),'bountyHunter');
 save();return true;
}
function resolve(c,won){
 const q=state(),p=q.pursuit;
 if(c?.source!=='bountyHunter'||!p||p.phase!=='combat'||p.serial!==c.pursuitSerial)return false;
 q.pursuit=null;q.recovery=recoveryTurns;q.resolution=won?'victory':'defeat';q.continuing=true;
 if(!won)return true;
 if(p.id!==generic.id&&!q.defeated.includes(p.id)){q.defeated.push(p.id);q.index=hunter(p.id).rank+1;}
 q.totalDefeated++;
 const crime=record(),before=crime.bounty;
 // Record the escalation through the same outstanding/lifetime crime ledger.
 v52Record('Bounty escalation',hunter(p.id).name,'Defeated a bounty hunter',before);
 add('BOUNTY HUNTER DEFEATED','reward');
 add('Outstanding Bounty: '+before+' → '+crime.bounty+' Bolts','danger');
 add('Word of another dead bounty hunter spreads across the wasteland.','system');
 return true;
}
function victory(c){
 if(!resolve(c,true))return;
 combatState=null;
 if(lanternEdge())lanternRoadMenu();else lanternNodeMenu();
 save();
}
function report(){
 const crime=record(),q=player.flags.bountyPursuit,p=q?.pursuit;
 add('CRIMINAL STATUS','place');
 add('Outstanding Bounty: '+crime.bounty+' Bolts | Lifetime Bounty: '+crime.lifetime+' Bolts | Hunters Defeated: '+(q?.totalDefeated||0),'system');
 if(crime.bounty>0&&p?.warned.includes(5)){
  add('Current Pursuer: '+hunter(p.id).name+' — '+(p.remaining>0?p.remaining+' travel turns remaining':'interception due'),'danger');
 }else add('No active pursuit reported.','system');
}
globalThis.BountyPursuit=Object.freeze({roadMoved,victory,resolve});

const logCrime=v52Record;
v52Record=function(...args){
 const result=logCrime.apply(this,args);
 if(synchronize())save();
 return result;
};
function watchPayment(handler){
 return function(...args){
  const before=record().bounty,result=handler.apply(this,args);
  if(before>0&&cleared())stop(true);
  return result;
 };
}
v52PayFine=watchPayment(v52PayFine);
r18LegalFine=watchPayment(r18LegalFine);
r18BribeConfirm=watchPayment(r18BribeConfirm);
function roadMenu(handler){
 return function(...args){
  const result=handler.apply(this,args);
  intercept();
  return result;
 };
}
lanternRoadMenu=roadMenu(lanternRoadMenu);
lanternNodeMenu=roadMenu(lanternNodeMenu);
const previousLoad=loadGame;
loadGame=function(...args){
 const result=previousLoad.apply(this,args);
 if(synchronize())save();
 intercept();
 return result;
};
const previousDeath=handlePlayerDeath;
handlePlayerDeath=function(...args){
 const current=combatState,result=previousDeath.apply(this,args);
 if(stage==='fallen'&&current?.source==='bountyHunter'&&resolve(current,false))save();
 return result;
};
const showCharacter=showStatus,showJournal=showQuests;
showStatus=function(...args){const result=showCharacter.apply(this,args);report();return result;};
showQuests=function(...args){const result=showJournal.apply(this,args);report();return result;};

if(typeof GraphicalUI!=='undefined'){
 const css=document.createElement('style');
 css.textContent='.gfx-art>.bounty-hunter-sprite{position:absolute;inset:2% 0 4%;width:100%;height:94%;object-fit:contain;pointer-events:none;z-index:3}.bounty-hunter-sprite.night{filter:brightness(.66) saturate(.82)}';
 document.head.append(css);
 const modelGraphics=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const model=modelGraphics.apply(this,args);
  if(combatState?.source==='bountyHunter'&&['combat','combatItems'].includes(stage)){
   model.art=route127RegionalArt(lanternState());
   model.title=combatState.name;
  }
  return model;
 };
 const syncGraphics=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=syncGraphics.apply(this,args),e=this.element;
  if(!e?.figure)return result;
  let sprite=e.figure.querySelector(':scope > .bounty-hunter-sprite');
  const c=combatState;
  if(e.frame.hidden||!['combat','combatItems'].includes(stage)||c?.source!=='bountyHunter'){
   sprite?.remove();return result;
  }
  const who=hunter(c.pursuitHunter),url=new URL('assets/enemies/'+who.art,document.baseURI).href;
  if(!this.sceneArtworkReady(url)){sprite?.remove();return result;}
  if(!sprite){
   sprite=document.createElement('img');sprite.className='bounty-hunter-sprite';
   e.figure.append(sprite);
  }
  if(sprite.src!==url)sprite.src=url;
  sprite.alt=who.name;sprite.classList.toggle('night',isDark());
  return result;
 };
}
})();
