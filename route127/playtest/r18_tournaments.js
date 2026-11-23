// R18 sanctioned tournaments: separate progress and prizes; shared Iron Pit qualification.
const R18_TOURNAMENTS={ring:{name:'FIGHTING RING',label:'ENTER FIGHTING RING',bare:true,opponents:['SCRAPPER','BRUISER','THE HAMMER'],purse:100,prize:'weapon-rare-steel-fang-machete'},grave:{name:"CHAMPION'S GRAVEYARD",label:'ENTER CHAMPIONS GRAVEYARD',bare:true,opponents:['DRIFTER','IRONBACK','GRAVEKEEPER'],purse:125,prize:'armor-rare-reinforced-riot-armor'},deep:{name:'THE DEEP END',label:'ENTER THE DEEP END',bare:false,opponents:['POOL SCRAPPER','TILE BREAKER','DEEP END CHAMPION'],purse:110,prize:'weapon-rare-industrial-war-hammer'}};
function r18TournamentState(key){const all=player.flags.r18Tournaments||(player.flags.r18Tournaments={});return all[key]||(all[key]={round:0,champion:false});}
function r18TournamentAt(key){const g=lanternState();if(!g)return false;if(key==='deep')return !g.currentEdgeId&&g.nodeId==='abandoned-motel';if(!g.currentEdgeId||!g.pending||!['encounter','r127ArenaLobby'].includes(stage)||typeof currentEncounter!=='function')return false;const title=String(currentEncounter()?.title||'').toUpperCase().replace(/^EAST ROAD — /,'').trim();return key==='ring'?title==='THE FIGHTING RING':key==='grave'?title==='THE FORGOTTEN ARENA':false;}
// Roadside arenas are RANDOM ENCOUNTERS, not persistent navigation destinations.
// Tournament rounds/prizes remain saved; entry is offered only inside the encounter.
function r18TournamentOptions(){return r18TournamentAt('deep')?[R18_TOURNAMENTS.deep.label]:[];}
function r18TournamentRoadCommand(cmd){if(cmd!==R18_TOURNAMENTS.deep.label.toLowerCase()||!r18TournamentAt('deep'))return false;r18TournamentEnter('deep');return true;}
function r18TournamentEnter(key){
 if(!R18_TOURNAMENTS[key]||!r18TournamentAt(key)){
  add('Tournament entry is only available at the active arena encounter.','system');
  return false;
 }
 const q=r18TournamentState(key);
 player.flags.r18TournamentFocus=key;
 stage='r18Tournament';
 if(key!=='deep'&&!q.champion&&!q.victory&&r18TournamentRegistered(q))r18TournamentStart();
 else r18TournamentMenu();
 return true;
}
function r18TournamentRegistered(q){return q.registered||q.round>0||q.champion;}
function r18TournamentReturn(key){
 delete player.flags.r18TournamentFocus;
 if(globalThis.Route127ArenaLobby&&lanternState()?.pending){
  stage='encounter';
  v49Autosave();
  globalThis.Route127ArenaLobby.open(key);
  return;
 }
 return r18TournamentLeave();
}
function r18TournamentRewards(){
 let xp=Number(player.xp)||0;
 for(let level=1;level<player.level;level++)xp+=xpThresholdForLevel(level);
 const items=new Map();
 for(const item of [...(player.pack||[]),...(player.stash||[]),...(player.flags.r5LootQueue||[])]){
  if(item?.name)items.set(item.name,(items.get(item.name)||0)+(Number(item.qty)||0));
 }
 return {xp,bolts:player.bolts,items};
}
function r18TournamentResultLines(key,q){
 const result=q.victory;
 return [result.round===3?'CHAMPIONSHIP VICTORY':'ROUND '+result.round+' VICTORY',
  ...result.rewards,'Remaining HP: '+player.hp+' / '+player.maxHp,
  ...(result.round<3?['Next opponent: '+R18_TOURNAMENTS[key].opponents[result.round]]:[])];
}
function r18TournamentMenu(){const key=player.flags.r18TournamentFocus,info=R18_TOURNAMENTS[key],q=info&&r18TournamentState(key);if(!q){stage='between';return renderCurrentChoices();}add(info.name,'place');
 if(key!=='deep'&&q.victory){
  const lines=r18TournamentResultLines(key,q);
  if(!GraphicalUI.active())for(const line of lines)add(line,'reward');
  return r5DirectChoices(q.champion?['RETURN TO ARENA']:['CONTINUE TO NEXT ROUND','LEAVE ARENA']);
 }
 if(key!=='deep'&&!r18TournamentRegistered(q)){
  add('Registration costs 50 Bolts and covers all three matches.','system');
  return r5DirectChoices(['PAY 50 BOLTS','CANCEL']);
 }
 add(q.champion?'You are this arena’s champion.':'Next match: '+info.opponents[q.round]+' — round '+(q.round+1)+' of 3.','system');if(key==='grave')add('GRAVES > Ready? No. You’re qualified. There’s a difference.','bright');if(info.bare)add('Hand-to-hand rules: weapon, armor and accessory bonuses do not count; no healing during a match.','system');r5DirectChoices([...(q.champion?[]:['START NEXT MATCH']),...(key==='grave'&&!q.trainerDone?['CHALLENGE TRAINING DEVICE']:[]),...(Number(day)>=(Number(q.betNextDay)||0)?['BET 10 BOLTS','BET 25 BOLTS']:[]),'LEAVE ARENA']);}
function r18TournamentStart(){const key=player.flags.r18TournamentFocus,info=R18_TOURNAMENTS[key],q=info&&r18TournamentState(key);if(!q||q.champion||q.victory||(key!=='deep'&&!r18TournamentRegistered(q))||q.round<0||q.round>2)return r18TournamentMenu();const level=Math.max(1,Math.min(50,Math.floor(Number(player.level)||1))),hp=Math.max(20,Math.floor(baseHpForLevel(level)*(.15+q.round*.03)));if(info.bare){player.maxHp=baseHpForLevel(level);player.hp=Math.max(1,Math.min(player.hp,player.maxHp));updateHud();}startCombat({name:info.opponents[q.round],level,hp,min:2+q.round,max:5+q.round,xp:0,bolts:0,r18Bare:!!info.bare,r18TournamentKey:key,r18TournamentRound:q.round,r18ArenaRole:(key==='grave'?['drifter','ironback','gravekeeper']:key==='ring'?['scrapper','bruiser','hammer']:['poolScrapper','tileBreaker','deepChampion'])[q.round],armorDef:0,end:'The referee stops the match.'},'r18TournamentFight');if(key!=='deep')v49Autosave();}
function r18TournamentRestore(c){if(c?.r18Bare){syncLevelMaxHp();updateHud();}}
function r18TournamentVictory(c){r18TournamentRestore(c);if(c.r18TrainingDevice){const q=r18TournamentState('grave');if(!q.trainerDone){q.trainerDone=true;r18RetainRoadReward('Scrap Metal','material');gainXp(Math.max(20,(Number(player.level)||1)*4)+10);gainBolts(10);}stage='r18Tournament';return r18TournamentMenu();}const key=c.r18TournamentKey,info=R18_TOURNAMENTS[key],q=info&&r18TournamentState(key);if(!q||q.champion||q.round!==c.r18TournamentRound){stage='r18Tournament';return r18TournamentMenu();}const before=key==='deep'?null:r18TournamentRewards(),remainingHp=player.hp,alreadyQualified=!!player.flags.r18IronPitQualified;q.round++;gainXp(Math.max(10,(Number(player.level)||1)*2));gainBolts(10+q.round*5);if(q.round>=3){q.champion=true;const f=player.flags,had=!!f.r18IronPitQualified;f.r18IronPitQualified=true;gainBolts(info.purse+(had?50:0));const level=Math.max(1,Math.min(50,Math.floor(Number(player.level)||1))),pool=EQUIPMENT_CATALOG.filter(x=>x.rarity==='rare'&&['weapon','armor'].includes(x.type)&&level>=x.minLevel&&level<=x.maxLevel),def=pool.find(x=>x.id===info.prize)||pool[0];if(def)r18RetainRoadReward(catalogInstanceName(def,level),def.type);add(had?'Championship complete. You already hold Iron Pit qualification; an additional 50 Bolts is included.':'Championship complete. You earn Iron Pit qualification.','reward');}stage='r18Tournament';
 if(before){
  player.hp=Math.min(remainingHp,player.maxHp);
  updateHud();
  const after=r18TournamentRewards(),rewards=[];
  if(after.xp!==before.xp)rewards.push('+'+(after.xp-before.xp)+' XP');
  if(after.bolts!==before.bolts)rewards.push('+'+(after.bolts-before.bolts)+' Bolts');
  for(const [name,qty] of after.items){
   const earned=qty-(before.items.get(name)||0);
   if(earned>0)rewards.push('+'+earned+' '+name);
  }
  if(!alreadyQualified&&q.champion)rewards.push('Iron Pit qualification earned');
  q.victory={round:q.round,rewards};
  v49Autosave();
 }
 r18TournamentMenu();
}
function r18TournamentRetreat(c){r18TournamentRestore(c);stage='r18Tournament';add('The referee stops the fight. You can retry this round.','system');r18TournamentMenu();if(c.r18TournamentKey!=='deep')v49Autosave();}
function r18TournamentDefeat(c){combatState=null;player.hp=1;r18TournamentRestore(c);stage='r18Tournament';add('The referee stops the match at zero. You are alive and can retry after healing.','system');r18TournamentMenu();if(c.r18TournamentKey!=='deep')v49Autosave();}
function r18TournamentLeave(){const g=lanternState();delete player.flags.r18TournamentFocus;if(g?.pending){stage='encounter';const result=completeRoadTurn();v49Autosave();return result;}if(g?.currentEdgeId){stage='lanternRoad';return lanternRoadMenu();}stage='lanternNode';return lanternNodeMenu();}
function r18TournamentCommand(cmd){const key=player.flags.r18TournamentFocus,q=key&&r18TournamentState(key);if(!q)return r18TournamentLeave();
 if(key!=='deep'&&q.victory){
  if(q.champion&&cmd==='return to arena'){
   delete q.victory;
   return r18TournamentReturn(key);
  }
  if(!q.champion&&cmd==='continue to next round'){
   delete q.victory;
   return r18TournamentStart();
  }
  if(['leave arena','back','b'].includes(cmd))return r18TournamentLeave();
  return r18TournamentMenu();
 }
 if(key!=='deep'&&!r18TournamentRegistered(q)){
  if(['cancel','back','b','leave arena'].includes(cmd))return r18TournamentReturn(key);
  if(cmd==='pay 50 bolts'){
   if(player.bolts<50){add('You need 50 Bolts to enter. Earn more or cancel registration.','system');return r18TournamentMenu();}
   player.bolts-=50;
   q.registered=true;
   updateHud();
   return r18TournamentStart();
  }
  return r18TournamentMenu();
 }
 if(['leave arena','back','b'].includes(cmd))return r18TournamentLeave();if(cmd==='start next match')return r18TournamentStart();if(cmd==='challenge training device'&&key==='grave'&&!q.trainerDone){const level=Math.max(1,Math.min(50,Number(player.level)||1));startCombat({name:'CHAMPION TRAINING DEVICE',level,hp:Math.max(20,Math.floor(baseHpForLevel(level)*.2)),min:2,max:6,xp:0,bolts:0,r18TournamentKey:key,r18TrainingDevice:true,end:'The training device powers down.'},'r18TournamentFight');return;}const m=cmd.match(/^bet (10|25) bolts$/);if(m){const stake=Number(m[1]);if((Number(day)||1)<(Number(q.betNextDay)||0))add('The next betting round is not available yet.','system');else if(player.bolts<stake)add('Not enough Bolts for that wager.','system');else{player.bolts-=stake;q.betNextDay=(Number(day)||1)+1;if(Math.random()<.5){gainBolts(stake*2);add('Your chosen NPC wins the exhibition.','reward');}else add('Your chosen NPC loses the exhibition.','system');updateHud();}return r18TournamentMenu();}return r18TournamentMenu();}
for(const [title,key] of [['THE FIGHTING RING','ring'],['THE FORGOTTEN ARENA','grave']]){const e=eastEncounters.find(x=>x.title===title);if(!e)continue;e.text=key==='ring'?'A referee oversees a bare-knuckle ring between wrecked cars. Three sanctioned opponents stand between you and this championship.':'An old stadium banner reads THE UNDEFEATED — 47 VICTORIES. Referee Graves maintains an hand-to-hand qualifying arena and a separate training device.';e.choices='WATCH A ROUND   BET ON A ROUND   ENTER TOURNAMENT   BACK AWAY';e.prompt=()=>e.choices;e.resolve=function(cmd){if(['enter tournament','enter contest','search bleachers'].includes(cmd))return r18TournamentEnter(key);if(['watch a round','read the old match board'].includes(cmd)){add(key==='ring'?'The referee explains the rules: no equipment or healing during a bout; withdraw between rounds.':'Graves points to the board: Drifter, Ironback, Gravekeeper. All bouts are unarmed; the old training device is separate from qualification.','bright');return true;}if(/back|away|leave/.test(cmd))return true;return false;};}

// Preserve exact saved health while a bare-knuckle match is resumed.
const r18TournamentLoad=loadGame;loadGame=function(slot=activeSaveSlot){const snapshot=getSaveData(slot),hp=Number(snapshot?.player?.hp);const out=r18TournamentLoad(slot);if(combatState?.source==='r18TournamentFight'&&combatState.r18Bare){player.maxHp=baseHpForLevel(player.level);if(Number.isFinite(hp))player.hp=Math.max(0,Math.min(hp,player.maxHp));updateHud();}if(stage==='r18Tournament'&&player.flags.r18TournamentFocus)r18TournamentMenu();return out;};
