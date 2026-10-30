// v54.1d — demo route extension. State lives in player.flags for save compatibility.
function portState(){return player.flags.seaportRoute||(player.flags.seaportRoute={position:0,cleared:{},seen:{},arrived:false});}
function portReady(){return !!player.flags.portRoadCleared && factoryDone()===4;}
function portQuestObjective(){
 const f=player.flags;
 if(f.seaportRoute?.arrived)return typeof port55Objective==='function'?port55Objective():'Seaport reached.';
 if(!f.factoryFinalComponent)return 'Defeat the Factory Foreman and recover the final charge component.';
 if(!f.portChargePrepared)return 'Return to Forge and prepare the dynamite charge.';
 if(!f.portRoadCleared)return 'Travel to the Boulder Junction and USE DYNAMITE at the obstruction.';
 return "Follow the last recorded distress report south to Seaport. Find out who controls the harbor and whether its residents can be freed.";
}
function portForgeDialogue(){
 const f=player.flags;
 if(!f.factoryFinalComponent||f.portChargePrepared)return;
 if(factoryDone()!==4)return;
 f.portChargePrepared=true;
 add("FORGE > The terminal preserved Seaport’s last report: armed boats, tribute collectors, captives at the docks. Solace needs that supply route, and those people need a way out. The charge is assembled. Clear the boulder beneath the collapsed overpass and find out what happened.",'reward');
 addPack('Prepared Dynamite Charge','quest');
 add('MAIN QUEST UPDATED — Find the obstruction south of the Factory and USE DYNAMITE.','reward');
 v49Autosave();
}
function portBlockedMenu(){
 numberedChoices={};currentHotkeys={};
 add('EASTERN ROAD — COLLAPSED OVERPASS','place');
 add('Concrete and twisted steel seal the route to Seaport. The charge must be placed here.','system');
 add('USE DYNAMITE   RETURN TO FORGE   INSPECT OBSTRUCTION','system');
}
function portClearRoad(){
 const f=player.flags;
 if(!f.portChargePrepared||!f.factoryFinalComponent||factoryDone()!==4){add('The charge is not ready. Return to Forge.','danger');portBlockedMenu();return;}
 if(f.portRoadCleared){add('The obstruction has already been cleared.','system');portMenu();return;}
 f.portRoadCleared=true;
 player.pack=player.pack.filter(i=>i.name!=='Prepared Dynamite Charge');
 add('You set the dynamite beneath the fallen supports and retreat. The blast opens a narrow passage east.','reward');
 add("The terminal repeats its stored report: CIVILIANS DETAINED AT HARBOR. Forge marks the freight line south. The road is open; the report still needs an answer.",'bright');
 f.portTerminalGuidanceSeen=true;
 add('MAIN QUEST UPDATED — Travel south to Seaport.','reward');
 stage='portRoad';portState();updateHud();v49Autosave();portMenu();
}
function portMenu(){
 const s=portState();numberedChoices={};currentHotkeys={};
 if(stage==='portObstruction'){portBlockedMenu();}else if(stage==='portRoad'){
  add('ROUTE 127 — EAST OF THE FACTORY','place');
  add('Cracked pavement follows a salt-stained freight line. Seaport lies '+(5-s.position)+' segments east.','system');
  add('CONTINUE EAST   RETURN WEST   INSPECT ROAD','system');
 }else if(stage==='seaport'){
  if(typeof port55Menu==='function'){port55Menu();return;}
  add('SEAPORT — HARBOR GATE','place');
  add('The last stretch of Route 127 ends beside cranes, seawalls and a guarded harbor. The settlement is occupied and operating.','bright');
  add('MARKET   CLINIC   DOCKS   GATE WATCH   RETURN WEST   DEMO STATUS','system');
 }else if(stage==='portMarket'){
  add('SEAPORT — MARKET','place');add('A trader sorts recovered supplies. Trade routes remain fragile.','system');
  add('BROWSE WARES   SMALL TALK   RETURN TO HARBOR','system');
 }else if(stage==='portClinic'){
  add('SEAPORT — CLINIC','place');add('Treatment requires your assigned medic; the staffed clinic rate applies.','system');
  add('HEAL   SMALL TALK   RETURN TO HARBOR','system');
 }else if(stage==='portDocks'){
  add('SEAPORT — DOCKS','place');add('A line of silent cranes overlooks the water. Beyond the harbor, the route is not yet available.','system');
  add('INSPECT   SMALL TALK   RETURN TO HARBOR','system');
 }else if(stage==='portWatch'){
  add('SEAPORT — GATE WATCH','place');add('A watchkeeper checks travelers entering the settlement.','system');
  add('SMALL TALK   RETURN TO HARBOR','system');
 }
}
function portArrive(){const s=portState();s.position=5;stage='seaport';if(!s.arrived){s.arrived=true;gainXp(190);add('SEAPORT REACHED — OCCUPIED HARBOR','reward');add("The freight line ends beneath silent cranes. The New Dominion mark hangs over a tribute board. Behind the chained dock gate, two residents call out when they see you. The terminal report was no empty echo.",'bright');}if(typeof port55Arrive==='function')port55Arrive();portMenu();}
function portMove(direction){if(!portReady()){stage='portObstruction';portBlockedMenu();return;}const s=portState();if(!spendTurn()){add('NO TURNS LEFT.','danger');portMenu();return;}
 s.position=Math.max(0,Math.min(5,s.position+direction));
 if(s.position===0){stage='factoryWorkshop';add('You return west to Forge’s workshop.','bright');v49FactoryRoom();return;}
 if(s.position===5){portArrive();return;}
 stage='portRoad';updateHud();add('You travel '+(direction>0?'east toward Seaport.':'west toward the Factory.'),'bright');
 if(direction>0&&!s.seen[s.position]){s.seen[s.position]=true;gainXp(48);}
 if(typeof port55Travel==='function'&&direction>0)port55Travel(s);
 const roadAtmosphere={1:'Rusted freight wagons shelter abandoned bedrolls. Someone fled toward the harbor in a hurry.',2:'Spent cartridges litter a makeshift toll barrier. The coast road is being watched.',3:'Salt wind carries the clatter of harbor chains. A faded Dominion tribute notice is nailed to a post.',4:'Floodlights rake the approaches. Beyond the seawall, armed silhouettes patrol the dock gate.'};
 add(direction>0?roadAtmosphere[s.position]:['','The Factory stacks rise beyond the abandoned freight wagons.','You pass the broken toll barrier, heading west.','The harbor chains fade behind you on the road to Forge.','You leave the harbor floodlights behind and follow the freight line west.'][s.position],'system');
 // Fixed one-time threats: no reload farming, no new enemy or combat framework.
 if(direction>0&&!s.cleared[s.position]&&(s.position===2||s.position===4)){
  if(player.flags?.equippedPet==='Stray Cat'&&Math.random()<.10){s.cleared[s.position]=true;add('Your stray cat senses danger and leads you around the patrol.','reward');portMenu();return;}
  const enemy=s.position===2?{name:'COAST ROAD SCAVENGER',level:7,hp:72,min:10,max:16,xp:100,bolts:13,end:'The scavenger retreats from the road.'}:{name:'HARBOR SECURITY DRONE',level:8,hp:92,min:12,max:19,xp:125,bolts:17,end:'The drone crashes into the roadside barrier.'};
  startCombat(enemy,'seaportRoadFight');return;
 }
 portMenu();
}
function portCombatWin(){const s=portState();s.cleared[s.position]=true;stage='portRoad';portMenu();}
function portCombatRetreat(){const s=portState();s.position=Math.max(0,s.position-1);stage=s.position?'portRoad':'factoryWorkshop';add('You retreat west from the threat.','system');if(s.position)portMenu();else v49FactoryRoom();}
function portCommand(cmd){
 if(stage==='factoryWorkshop'&&['seaport','road to seaport','travel east','leave east','east road'].includes(cmd)){
  if(!player.flags.portChargePrepared){add('The east road remains blocked. Talk to Forge after recovering the final component.','system');return true;}
  portState().position=0;stage=portReady()?'portRoad':'portObstruction';
  add('You follow the eastern road toward the collapsed overpass.','bright');portMenu();return true;
 }
 if(stage==='portObstruction'){
  if(['use dynamite','dynamite','use charge','place charge','clear road'].includes(cmd)){portClearRoad();return true;}
  if(['return','back','west','return to forge','forge'].includes(cmd)){stage='factoryWorkshop';v49FactoryRoom();return true;}
  if(['inspect obstruction','inspect','look','examine obstruction'].includes(cmd)){add('The collapsed overpass is packed with concrete and bent steel. A narrow gap can hold the charge; beyond it the highway continues east.','system');portBlockedMenu();return true;}
  portBlockedMenu();return true;
 }
 if(typeof port55Command==='function'&&port55Command(cmd))return true;
 if(!['portObstruction','portRoad','seaport','portMarket','portClinic','portDocks','portWatch'].includes(stage))return false;
 if(/^(save|load)(?: |$)/.test(cmd)||['save current','load autosave'].includes(cmd))return false;
 if(stage==='portRoad'){
  if(['continue','continue east','east','e','forward'].includes(cmd))portMove(1);
  else if(['return','return west','west','w','reverse direction','back'].includes(cmd))portMove(-1);
  else if(['inspect road','inspect','look'].includes(cmd)){add('The eastbound road follows a damaged freight line toward the harbor.','system');portMenu();}
  else portMenu();return true;
 }
 if(stage==='seaport'){
  const dest={'market':'portMarket','clinic':'portClinic','docks':'portDocks','gate watch':'portWatch'}[cmd];
  if(dest){stage=dest;portMenu();return true;}
  if(['return west','west','leave','back'].includes(cmd)){portMove(-1);return true;}
  if(cmd==='demo status'){add('ROUTE 127 — INITIAL DEMO DESTINATION REACHED. Further regions are not yet available.','reward');portMenu();return true;}
  portMenu();return true;
 }
 if(['return to harbor','back','return','harbor','town'].includes(cmd)){stage='seaport';portMenu();return true;}
 if(stage==='portClinic'&&cmd==='heal'){
  if(!portRecruitUnlocked()||!portStaffRating('clinic')){add('Assign a medic at the Seaport clinic before treatment.','system');stage='seaport';port55Menu();return true;}
  Economy.treat(portStaffRating('clinic'));
 }else if(stage==='portMarket'&&cmd==='browse wares')add('The market has limited supplies today. The trader is not accepting new orders.','system');
 else if(cmd==='small talk')add('The locals speak of rough roads and the difficulty of keeping the harbor supplied.','bright');
 else if(cmd==='inspect')add('The docks are weathered but maintained. Nothing beyond the demo route is accessible.','system');
 portMenu();return true;
}
