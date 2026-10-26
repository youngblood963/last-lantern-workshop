/* Lantern Highway development branch. Graph state lives in existing character flags.
 * No account/backend schema changes; legacy travel fields are projections only. */
const LG_NODES=Object.fromEntries(LANTERN_WORLD_GRAPH.nodes.map(n=>[n.id,n]));
const LG_EDGES=Object.fromEntries(LANTERN_WORLD_GRAPH.edges.map(e=>[e.id,e]));
function lanternState(){return player.flags.lanternTravel;}
function lanternQuestEdge(){return lanternEdge()||LG_EDGES[lanternState()?.markerContext?.edge];}
function lanternEdge(){return LG_EDGES[lanternState()?.currentEdgeId];}
function lanternConnections(node){return LANTERN_WORLD_GRAPH.edges.filter(e=>e.a===node||e.b===node);}
function lanternOther(e,node){return e.a===node?e.b:e.a;}
function lanternAllowed(e){return !e.requires||!!player.flags[e.requires];}
function lanternMark(kind,id){const g=lanternState();if(!g[kind].includes(id))g[kind].push(id);}
function lanternCompass(a,b){const x=b[0]-a[0],y=b[1]-a[1];return (Math.abs(y)>Math.abs(x)*.45?(y>0?'south':'north'):'')+(Math.abs(x)>Math.abs(y)*.45?(x>0?'east':'west'):'');}
function lanternDestination(){const g=lanternState(),e=lanternEdge();return e?LG_NODES[g.direction>0?e.b:e.a].name:LG_NODES[g.nodeId]?.name||'the road';}
function lanternProgressText(){const g=lanternState(),e=lanternEdge();if(!e)return LG_NODES[g.nodeId].name;const to=g.direction>0?e.b:e.a,from=g.direction>0?e.a:e.b;return `${LG_NODES[e.a].name} ↔ ${LG_NODES[e.b].name} — heading ${lanternCompass(LG_NODES[from].anchor,LG_NODES[to].anchor)} toward ${LG_NODES[to].name}. ${g.direction>0?e.distanceTurns-g.stepIndex:g.stepIndex} / ${e.distanceTurns} movement turns remain.`;}
function lanternProject(){const g=lanternState(),e=lanternQuestEdge();if(!g||!e)return;const savedStep=g.currentEdgeId?g.stepIndex:g.markerContext.step;if(r6Road())r6Road().active=false;roadTurnCharged=true;player.flags.eastReturning=g.direction<0;
 const p=(e.offset||0)+savedStep;
 if(e.plot==='house'){roadGoal=g.direction>0?'mercy':'house';roadTripLength=10;roadTurn=Math.max(0,(g.direction>0?savedStep:10-savedStep)-1);}
 else{roadGoal='east';roadTripLength=e.plot==='coast'?5:6;roadTurn=Math.max(0,Math.min(roadTripLength-1,p-1));}
}
function lanternMigrate(saved){
 let g=lanternState();if(g){if(g.version!==1)throw Error('Unsupported Lantern travel version; original save retained.');return g;}
 const s=saved||{stage:gameplayStageForSave(),roadGoal,roadTurn,roadTripLength,roadTurnCharged,player};const f=player.flags;
 let node='house';if(f.mercyDiscovered)node='solace';
 if(/^factory|^eastEnd/.test(s.stage))node='factory';if(/^port|^seaport|^r11/.test(s.stage)&&f.seaportRoute?.arrived)node='seaport';
 if(s.stage==='fork')node='old-service-junction';if(s.stage==='serviceRoad'||s.combatState?.source==='serviceBoss')node='scrap-yard';if(s.stage==='relayBranch')node='old-service-road';
 g=f.lanternTravel={version:1,nodeId:node,currentEdgeId:null,stepIndex:0,direction:1,pending:false,encounterIndex:null,discoveredNodes:['house',...(f.mercyDiscovered?['solace']:[])],discoveredEdges:[],lastSettlement:f.mercyDiscovered?'solace':'house',solaceAdmitted:!!(f.solaceCheckpointSaved||f.mercyDiscovered&&!['settlement'].includes(s.stage)&&!f.solaceGateChallenge&&s.combatState?.source!=='gateGuards'&&s.stage!=='fallen'),approachGate:'north',migrationSource:s.version||'new'};
 if(node==='seaport'){f.portRoadCleared=true;g.lastSettlement='seaport';} // Only an actually arrived legacy harbor proves clearance.
 const q=f.r6Road,roadStages=['encounter','between','turnComplete','wandererRoad','questRoadComplete','r6Road','combat'];
 if(q?.active||roadStages.includes(s.stage)&&!(s.combatState&&['houseBoss','serviceBoss','gateGuards','townWanderer','factoryFight'].includes(s.combatState.source))){
  let id,pos,dir=1;if(q?.active){dir=q.dir;pos=q.pos;id=q.leg==='coast'?(pos<=3?'factory--boulder-junction':'boulder-junction--seaport'):(pos<=3?'solace--works-junction':'works-junction--factory');if(pos>3)pos-=3;}
  else if(s.roadGoal==='east'){dir=f.eastReturning?-1:1;const p=Math.max(0,Math.min(6,(s.roadTurn||0)+(s.roadTurnCharged?1:0)));id=p<=3?'solace--works-junction':'works-junction--factory';pos=p<=3?p:p-3;}
  else{id='house--solace';const len=Math.max(1,s.roadTripLength||9),v=Math.min(len,(s.roadTurn||0)+(s.roadTurnCharged?1:0));pos=Math.round(v/len*10);dir=s.roadGoal==='house'?-1:1;if(dir<0)pos=10-pos;}
  const e=LG_EDGES[id];Object.assign(g,{nodeId:dir>0?e.a:e.b,currentEdgeId:id,stepIndex:Math.max(0,Math.min(e.distanceTurns,pos)),direction:dir,pending:!!(q?.pending||['encounter','wandererRoad','combat'].includes(s.stage)&&s.roadTurnCharged),encounterIndex:q?.pending?q.index:(s.roadEncounterOrder||roadEncounterOrder)[s.roadTurn||0]});
  if(g.pending){g.encounterRegion=q?.active?(q.leg==='coast'?'coast':'east'):s.roadGoal==='east'?'east':'early';}lanternMark('discoveredEdges',id);
 }
 if(q?.active&&q.leg==='coast')f.portRoadCleared=true;
 if(['serviceRoad','relayBranch'].includes(s.stage)&&(s.serviceRoadDepth??serviceRoadDepth)<3){const depth=Math.max(0,s.serviceRoadDepth??serviceRoadDepth),id=s.stage==='serviceRoad'?'works-junction--scrap-yard':'old-service-junction--old-service-road',e=LG_EDGES[id];Object.assign(g,{nodeId:e.a,currentEdgeId:id,stepIndex:Math.round(depth/3*e.distanceTurns),direction:f.branchReturning?-1:1,pending:false,encounterRegion:e.region});lanternMark('discoveredEdges',id);}
 if(q)q.active=false;lanternMark('discoveredNodes',node);lanternProject();return g;
}
function lanternSave(){if(typeof v49Autosave==='function')v49Autosave();}
function lanternNodeMenu(){const g=lanternState();if(g.nodeId==='solace'&&!g.currentEdgeId&&!g.solaceAdmitted)return arriveSettlement();if(g.currentEdgeId)return lanternRoadMenu();stage='lanternNode';const n=LG_NODES[g.nodeId];add(n.name.toUpperCase(),'place');
 if(n.futureInterior)add(n.id==='broken-bridge'?'The broken span is impassable. The approach roads remain open; there is no crossing or interior here.':'You can inspect the exterior and take the connecting roads. The interior is reserved for future expansion.','system');
 if(g.nodeId==='boulder-junction')add(player.flags.portRoadCleared?'The shared harbor passage is clear.':'All harbor approach lanes meet here. One boulder seals the only city passage. Prepare the charge with Forge at the Factory.','system');
 const options=[...renderRoadMarkerActions(),...r11RoadQuestOptions(),...lanternConnections(g.nodeId).map(e=>'TAKE ROAD TO '+LG_NODES[lanternOther(e,g.nodeId)].name.toUpperCase())];
 if(['house','solace','factory','seaport'].includes(g.nodeId))options.unshift('ENTER '+n.name.toUpperCase());
 if(g.nodeId==='scrap-yard')options.unshift('INSPECT SCRAP YARD');if(g.nodeId==='old-service-road')options.unshift('INSPECT SIGNAL CABINET');if(g.nodeId==='boulder-junction'&&!player.flags.portRoadCleared)options.unshift('USE DYNAMITE');
 r5DirectChoices(options);for(const e of lanternConnections(g.nodeId))add(`${LG_NODES[lanternOther(e,g.nodeId)].name}: ${e.distanceTurns} movement turns${lanternAllowed(e)?'':' — BLOCKED BY BOULDER'}`,'system');
}
function lanternRoadMenu(){const g=lanternState();stage='lanternRoad';add(lanternProgressText(),'system');const actions=['CONTINUE ROAD','REVERSE DIRECTION'];if(g.stepIndex===0||g.stepIndex===lanternEdge().distanceTurns)actions.push('RETURN TO JUNCTION');const markers=renderRoadMarkerActions();const branch=lanternBranchContext();if(branch){serviceRoadDepth=branch.depth;actions.push(branch.kind==='service'?(branch.depth===1?'INSPECT TRUCK':'INSPECT WRECKAGE'):(branch.depth===1?'INSPECT DRAINAGE WALL':'INSPECT TRACKS'),branch.kind==='service'?(branch.depth===1?'SEARCH ROADSIDE':'SEARCH DEBRIS'):(branch.depth===1?'SEARCH TOOL CRATE':'SEARCH UTILITY VAN'));}actions.push(...markers,...r11RoadQuestOptions());r5DirectChoices(actions);}
function lanternChoose(id){const g=lanternState(),e=LG_EDGES[id];if(g.nodeId==='solace'&&!g.solaceAdmitted){add('The watch must admit you before you can use the town gates.','system');return false;}if(!e||g.currentEdgeId||![e.a,e.b].includes(g.nodeId)||g.pending)return false;if(!lanternAllowed(e)){add('The single harbor passage is blocked. Clear the boulder at Boulder Junction.','danger');return false;}const dir=e.a===g.nodeId?1:-1;Object.assign(g,{currentEdgeId:id,stepIndex:dir>0?0:e.distanceTurns,direction:dir,pending:false,encounterIndex:null,encounterRegion:e.region});g.markerContext=null;lanternMark('discoveredEdges',id);lanternProject();lanternRoadMenu();lanternSave();return true;}
function lanternStep(){const g=lanternState(),e=lanternEdge();if(!e||g.pending)return false;if(!lanternAllowed(e)){add('The harbor passage is blocked in both directions.','danger');return false;}const next=g.stepIndex+g.direction;if(next<0||next>e.distanceTurns)return lanternArrive(g.direction>0?e.b:e.a);if(!spendTurn()){add('NO MOVEMENT TURNS REMAIN. Reverse, inspect the map, or use the existing overnight options.','danger');noTurnsMenu();return false;}
 g.stepIndex=next;g.moveSerial=(g.moveSerial||0)+1;g.sceneId=e.id+':'+next+':'+g.moveSerial;g.pending=true;g.encounterRegion=e.region;g.encounterIndex=null;lanternProject();delete player.encounterDone[roadTurn];moveWanderers();resumeSavedEncounter=false;
 if(e.plot==='coast'){const s=portState(),p=e.offset+g.stepIndex;s.position=p;if(g.direction>0&&p<5&&!s.seen[p]){s.seen[p]=true;gainXp(48);}if(g.direction>0&&[2,4].includes(p)&&!s.cleared[p]){startCombat(p===2?{name:'COAST ROAD SCAVENGER',level:7,hp:72,min:10,max:16,xp:100,bolts:13}:{name:'HARBOR SECURITY DRONE',level:8,hp:92,min:12,max:19,xp:125,bolts:17},'seaportRoadFight');lanternSave();return true;}port55Travel(s);}
 showEncounter();lanternSave();return true;}
async function lanternArrive(id){const g=lanternState(),e=lanternEdge();if(id==='seaport'&&!player.flags.portRoadCleared){add('The boulder blocks city entry.','danger');return false;}if(id==='solace')g.approachGate=e?.solaceGate||g.approachGate;g.markerContext=e?{edge:e.id,step:g.stepIndex}:null;Object.assign(g,{nodeId:id,currentEdgeId:null,stepIndex:0,pending:false,encounterIndex:null});lanternMark('discoveredNodes',id);if(r6Road())r6Road().active=false;
 if(id==='solace')await arriveSettlement();else if(id==='house')arriveHouse();else if(id==='factory'){g.lastSettlement='factory';r6Crossroads();saveFactoryAutosave();}else if(id==='seaport'){g.lastSettlement='seaport';portArrive();}else lanternNodeMenu();lanternSave();return true;}
const lgRegion=r10Region;r10Region=function(){return lanternEdge()?lanternState().encounterRegion||lanternEdge().region:lgRegion();};
const lgPrepare=r10PrepareEncounter;r10PrepareEncounter=function(){const g=lanternState();if(g?.pending&&resumeSavedEncounter&&Number.isInteger(g.encounterIndex)){roadEncounterOrder[currentRoadEncounterIndex()]=g.encounterIndex;return true;}const result=lgPrepare();if(lanternState()?.pending&&result)lanternState().encounterIndex=roadEncounterOrder[currentRoadEncounterIndex()];return result;};
const lgEncounter=currentEncounter;currentEncounter=function(){const g=lanternState();return g?.pending&&Number.isInteger(g.encounterIndex)?r10Pool(g.encounterRegion||lanternEdge().region)[g.encounterIndex]:lgEncounter();};
const lgRefresh=storyRefreshTravelerEncounter;storyRefreshTravelerEncounter=function(){const g=lanternState(),e=currentEncounter();if(g?.pending&&e?.title==='THE TRAVELER'&&!storyValeRoadAvailable()){g.encounterIndex=r10Pool(r10Region()).findIndex(x=>x.title==='OLD BILLBOARD');roadEncounterOrder[currentRoadEncounterIndex()]=g.encounterIndex;return currentEncounter();}return lgRefresh();};
const lgProgress=updateNewQuestRoadProgress;updateNewQuestRoadProgress=function(){if(lanternState()&&(!lanternQuestEdge()||!['house','factory'].includes(lanternQuestEdge().plot)))return;return lgProgress();};
const lgMarkers=questRoadMarkers;questRoadMarkers=function(){if(lanternState()&&(!lanternQuestEdge()||!['house','factory'].includes(lanternQuestEdge().plot)))return [];return lgMarkers();};
const lgComplete=completeRoadTurn;completeRoadTurn=function(){const g=lanternState();if(!g)return lgComplete();if(!g.pending)return g.currentEdgeId?lanternRoadMenu():lanternNodeMenu();updateNewQuestRoadProgress();g.pending=false;resumeSavedEncounter=false;const e=lanternEdge();if(g.stepIndex===0||g.stepIndex===e.distanceTurns)return lanternArrive(g.stepIndex===0?e.a:e.b);add('──────── TURN COMPLETE ────────','system');lanternRoadMenu();lanternSave();};
const lgRoadMenu=r6RoadMenu;r6RoadMenu=function(){if(lanternState())return lanternEdge()?lanternRoadMenu():lanternNodeMenu();return lgRoadMenu();};
const lgRoadQuests=r11RoadQuestOptions;r11RoadQuestOptions=function(){if(!lanternState())return lgRoadQuests();const g=lanternState();if(!g.currentEdgeId&&g.nodeId==='boulder-junction'&&portRecruitUnlocked()&&r11QuestState().shipment==='active')return ['SEARCH FREIGHT SPUR'];const e=lanternQuestEdge();if(!e||e.plot!=='coast'||!portRecruitUnlocked())return [];const p=e.offset+(g.currentEdgeId?g.stepIndex:g.markerContext.step),s=r11QuestState();return [...(s.shipment==='active'&&p===3?['SEARCH FREIGHT SPUR']:[]),...(s.houseRules==='active'&&p===1?['SEARCH GAMBLER CAMP']:[]),...(s.lights==='active'&&p===4?['SEARCH SERVICE BOX']:[])];};
const lgSettlement=arriveSettlement;arriveSettlement=async function(){const g=lanternMigrate();add(`SOLACE — ${g.approachGate.toUpperCase()} GATE. All four gates answer to the same watch.`,'place');if(!player.flags.mercyDiscovered){stage='settlement';return lgSettlement();}if(!g.solaceAdmitted){stage='settlement';add('GUARD > Same watch, same questions. State your business before you enter.','bright');add('(P) APPROACH GATE','system');return;}g.lastSettlement='solace';return lgSettlement();};
// Add road links after the existing menu has registered its choices. A separate
// queueChoiceLine would clear the town/house/Factory numeric and hotkey bindings.
function lanternAppendChoices(labels){outputQueue=outputQueue.then(()=>{for(const label of labels){const n=Object.keys(numberedChoices).length+1;numberedChoices[String(n)]=label.toLowerCase();addImmediate(`[${n}] ${label}`,'system');}});}
const lgBoundary=v49Boundary;v49Boundary=function(){const g=lanternState();if(g&&['settlement','lanternGate'].includes(gameplayStageForSave()))return 'SOLACE — '+(stage==='lanternGate'?g.selectedGate:g.approachGate).toUpperCase()+' GATE';return lgBoundary();};
const lgTown=mercyMenu;mercyMenu=function(){const g=lanternMigrate();if(g.nodeId==='solace'){g.solaceAdmitted=true;g.lastSettlement='solace';}lgTown();lanternAppendChoices(['NORTH GATE','SOUTH GATE']);};
const lgHouse=arriveHouse;arriveHouse=function(...a){const g=lanternMigrate();if(!g.currentEdgeId)g.nodeId='house';g.lastSettlement='house';lgHouse(...a);lanternAppendChoices(['EXPLORE ROADS']);};
const lgCross=r6Crossroads;r6Crossroads=function(){const g=lanternMigrate();if(g.nodeId==='boulder-junction')return lanternNodeMenu();if(!g.pending)Object.assign(g,{nodeId:'factory',currentEdgeId:null,stepIndex:0});lgCross();lanternAppendChoices(['EXPLORE ROADS']);};showFactory=r6Crossroads;
startRoadTrip=function(goal){const g=lanternMigrate();if(g.currentEdgeId)return lanternRoadMenu();if(g.nodeId==='house')return lanternChoose('house--solace');if(g.nodeId==='solace')return lanternChoose(goal==='house'?'house--solace':'solace--works-junction');return lanternNodeMenu();};
r6Begin=function(){return lanternNodeMenu();};
const lgClear=portClearRoad;portClearRoad=function(){const g=lanternMigrate();if(g.nodeId!=='boulder-junction'||g.currentEdgeId){add('Place the charge at Boulder Junction, where every harbor approach meets.','system');return;}if(player.flags.portRoadCleared){add('The boulder is already gone. No charge is spent.','system');return lanternNodeMenu();}lgClear();lanternNodeMenu();lanternSave();};
portMove=function(){const g=lanternMigrate();if(g.nodeId==='seaport')return lanternChoose('boulder-junction--seaport');return lanternNodeMenu();};
portCombatWin=function(){const e=lanternEdge();if(e?.plot==='coast')portState().cleared[e.offset+lanternState().stepIndex]=true;completeRoadTurn();};
const lgBlocked=portBlockedMenu;portBlockedMenu=function(){if(lanternState())return lanternNodeMenu();return lgBlocked();};
const lgSave=saveSnapshot;saveSnapshot=function(){if(player.flags.interfaceUnlocked)lanternMigrate();return lgSave();};
const lgLoad=loadGame;loadGame=function(slot=activeSaveSlot){
 const originalData=getSaveData(slot);if(!originalData)return lgLoad(slot);
 if(originalData.player?.flags?.lanternTravel&&originalData.player.flags.lanternTravel.version!==1){add('This save uses an unsupported road graph. Load it in its original version; the save has not been altered.','danger');return;}
 let data=originalData;
 // Migrate before legacy rendering: a saved between-segments menu must never spend
 // an unpaid movement turn just because the old loader redraws an encounter.
 if(!data.player?.flags?.lanternTravel){
  const oldFlags=player.flags,oldRoad=[roadGoal,roadTurn,roadTripLength,roadTurnCharged];
  try{player.flags=JSON.parse(JSON.stringify(data.player?.flags||{}));lanternMigrate(data);data={...data,player:{...data.player,flags:player.flags}};}
  finally{player.flags=oldFlags;[roadGoal,roadTurn,roadTripLength,roadTurnCharged]=oldRoad;}
  const g=data.player.flags.lanternTravel;
  if(g.currentEdgeId&&!g.pending&&['turnComplete','r6Road','between','questRoadComplete','serviceRoad','relayBranch'].includes(data.stage))data={...data,stage:'lanternRoad'};
  if(data.stage==='fork')data={...data,stage:'lanternNode'};
 }
 if(!originalData.player?.flags?.lanternTravel&&data.stage==='mercy'&&['gate','eastGate'].includes(data.mercyLocation)){data.player.flags.lanternTravel.selectedGate=data.mercyLocation==='gate'?'north':'south';data={...data,stage:'lanternGate'};}
 if(data.player.flags.lanternTravel.nodeId==='solace'&&!data.player.flags.lanternTravel.currentEdgeId&&!data.player.flags.lanternTravel.solaceAdmitted&&!['combat','fallen','zeroTurns','overnightConfirm'].includes(data.stage))data={...data,stage:'settlement'};
 const reader=getSaveData;getSaveData=function(which){return which===slot?data:reader(which);};
 try{lgLoad(slot);}finally{getSaveData=reader;}
 const g=lanternMigrate(data);lanternProject();
 if(data.stage==='lanternGate')lanternGateMenu(g.selectedGate||g.approachGate);
 else if(['lanternRoad','lanternNode'].includes(data.stage)){g.currentEdgeId?lanternRoadMenu():lanternNodeMenu();}
 else if(g.currentEdgeId&&!g.pending&&['turnComplete','r6Road','between','questRoadComplete'].includes(data.stage))lanternRoadMenu();
};
function lanternEncounterChoices(){const options=encounterChoices(currentEncounter()).split(/\s{2,}/).filter(Boolean).map(choiceCommand);options.push(...questRoadMarkers().map(row=>row[1].toLowerCase()));r5DirectChoices([...new Set(options)]);if(options.includes('back away'))outputQueue=outputQueue.then(()=>{currentHotkeys.b='back away';});}
const lgRender=renderCurrentChoices;renderCurrentChoices=function(){if(stage==='encounter'&&lanternState()?.pending)return lanternEncounterChoices();if(stage==='lanternRoad')return lanternRoadMenu();if(stage==='lanternNode')return lanternNodeMenu();if(stage==='lanternGate')return lanternGateMenu(lanternState().selectedGate);return lgRender();};
function lanternGateMenu(gate){const g=lanternMigrate();g.selectedGate=gate;stage='lanternGate';add(`SOLACE — ${gate.toUpperCase()} GATE`,'place');add(g.solaceAdmitted?'The watch recognizes you. Beyond the gate, the connecting roads remain open.':'The watch is waiting for your answer.','system');r5DirectChoices([...lanternConnections('solace').filter(e=>e.solaceGate===gate).map(e=>'TAKE ROAD TO '+LG_NODES[lanternOther(e,'solace')].name.toUpperCase()),'RETURN TO TOWN']);}
function lanternAtSite(cmd){const g=lanternState();if(g.nodeId==='scrap-yard'&&cmd==='inspect scrap yard'){stage='serviceRoad';serviceRoadDepth=3;add('SCRAP YARD — COUNTY MAINTENANCE ENCLOSURE','place');add(player.flags.serviceBossDead?'The Yardman is gone. The old motor assemblies remain.':'A heavy wrench scrapes concrete behind the fence. The Yardman still holds this yard.','system');add(serviceRoadChoices(),'system');return true;}if(g.nodeId==='old-service-road'&&cmd==='inspect signal cabinet'){stage='relayBranch';serviceRoadDepth=3;add('OLD SERVICE ROAD — SIGNAL CABINET','place');if(player.flags.relayPartsRevealed)awardRelayPart('branch','SHIELDED FEED COUPLER');else add('The feed hardware means little until you have diagnosed the Relay.','system');add(branchLandmarkChoices(),'system');return true;}return false;}
function lanternBranchContext(){const e=lanternEdge(),g=lanternState();if(!e||g.pending)return null;const kind=e.id==='works-junction--scrap-yard'?'service':e.id==='old-service-junction--old-service-road'?'lower':null;return kind&&[1,2].includes(g.stepIndex)?{kind,depth:g.stepIndex}:null;}
const lgServiceChoices=serviceRoadChoices;serviceRoadChoices=function(){if(lanternState()?.nodeId==='scrap-yard'&&!lanternEdge())return [!player.flags.serviceBossDead?'CONTINUE UP ROAD — FACE YARDMAN (1 ACTION TURN)':player.flags.relayPartsRevealed&&!ensureRelayParts().yard||!player.flags.maintenanceYardSearched?'SEARCH MAINTENANCE YARD':'', 'BACK TO SCRAP YARD ROADS (FREE)'].filter(Boolean).join('   ');return lgServiceChoices();};
const lgBranchChoices=branchLandmarkChoices;branchLandmarkChoices=function(){return lanternState()?.nodeId==='old-service-road'&&!lanternEdge()?'BACK TO OLD SERVICE ROAD (FREE)':lgBranchChoices();};
const lgCore=handleCommandCore;handleCommandCore=async function(raw){const cmd=r5Mapped(raw);if(busy)return;const g=player.flags.interfaceUnlocked?lanternMigrate():lanternState();
 // Existing utility controls must reach the shared interface even when an older
 // merchant/crafting handler consumes otherwise-unrecognized commands.
 const utility={inventory:'inventory',status:'status',map:'map',quests:'quests',m:'map',q:'quests'};
 if(g&&stage!=='combatItems'&&utility[cmd])return openInterface(utility[cmd]);
 if(g&&['factoryRusty','r11Craft'].includes(stage)&&['i','s'].includes(cmd))return openInterface(cmd==='i'?'inventory':'status');
 if(g&&stage==='interfaceMap'&&['classic map','graphic map'].includes(cmd)){g.mapMode=cmd.startsWith('classic')?'classic':'graphic';showMap();return;}
 if(g&&stage==='fallen'&&['1','get up','get','continue'].includes(cmd)){if(g.nodeId==='factory')return v49FactoryRoom();if(g.nodeId==='seaport'){stage='seaport';return portMenu();}}
 if(g&&stage==='roadReady'&&/^(r|road|go|south|begin journey)$/.test(cmd)){lanternChoose('house--solace');return lanternStep();}
 if(g&&stage==='house'&&/^(explore roads — north of solace|explore roads|head east.*|head south.*|leave house|road)$/.test(cmd))return lanternNodeMenu();
 if(g&&stage==='mercy'&&g.nodeId==='solace'){
  const gates={'e':'west','g':'east','west gate':'west','east gate':'east','north gate':'north','south gate':'south','gate':'west'};if(gates[cmd])return lanternGateMenu(gates[cmd]);
  if(/^head (east|south).*factory/.test(cmd))return lanternChoose('solace--works-junction');if(/^head (west|north).*house/.test(cmd))return lanternChoose('house--solace');
 }
 if(g&&['eastEnd','factoryWorkshop'].includes(stage)&&['explore roads','head west — solace','head east — seaport','return west','head west','head east','head north — solace','head south — seaport','north','south','road to seaport','west','east','seaport'].includes(cmd))return lanternNodeMenu();
 if(g&&['seaport','port55Harbor'].includes(stage)&&/^(return west|leave seaport|explore roads|head west.*)$/.test(cmd))return lanternNodeMenu();
 if(g&&['serviceRoad','relayBranch'].includes(stage)&&['r','f','back','walk back','return to fork','fast return'].some(x=>cmd===x||cmd.startsWith(x+' ')))return lanternNodeMenu();
 if(g&&['lanternNode','lanternGate','lanternRoad'].includes(stage)){
  if(cmd==='m'||cmd==='map')return openInterface('map');
  if(['use dynamite','place dynamite','use charge','clear road'].includes(cmd))return portClearRoad();if(cmd==='inspect road'){add(g.currentEdgeId?lanternProgressText():LG_NODES[g.nodeId].name,'system');return;}
  if(r11RoadQuest(cmd))return;
  if(questRoadMarkers().some(row=>row[1].toLowerCase()===cmd)){stage='turnComplete';await lgCore(raw);if(stage==='turnComplete')g.currentEdgeId?lanternRoadMenu():lanternNodeMenu();return;}
  if(stage==='lanternGate'&&['return to town','back','b'].includes(cmd)){stage='mercy';mercyLocation='town';return mercyMenu();}
  if(stage==='lanternRoad'){
   const branch=lanternBranchContext();if(branch&&/^(inspect (truck|wreckage|drainage wall|tracks)|search (roadside|debris|tool crate|utility van))$/.test(cmd)){serviceRoadDepth=branch.depth;branchLandmark(branch.kind,cmd);lanternRoadMenu();lanternSave();return;}
   if(['continue road','continue','c'].includes(cmd))return lanternStep();
   if(['reverse direction','reverse','r'].includes(cmd)){if(g.pending)return;g.direction*=-1;lanternProject();lanternRoadMenu();lanternSave();return;}
   if(cmd==='return to junction'&&(g.stepIndex===0||g.stepIndex===lanternEdge().distanceTurns))return lanternArrive(g.stepIndex===0?lanternEdge().a:lanternEdge().b);
   if(r11RoadQuest(cmd))return;
   if(questRoadMarkers().some(row=>String(row[1]).toLowerCase().replace(/^\([^)]*\)\s*/,'')===cmd)||/^search (cart|checkpoint|ambulance)/.test(cmd)){stage='turnComplete';await lgCore(raw);if(stage==='turnComplete')lanternRoadMenu();return;}
  }else{
   if(cmd.startsWith('take road to ')){const target=cmd.slice(13);const e=lanternConnections(g.nodeId).find(e=>LG_NODES[lanternOther(e,g.nodeId)].name.toLowerCase()===target&&(stage!=='lanternGate'||e.solaceGate===g.selectedGate));if(e)return lanternChoose(e.id);}
   if(lanternAtSite(cmd))return;
   if(cmd.startsWith('enter ')){if(g.nodeId==='house')return arriveHouse();if(g.nodeId==='solace')return arriveSettlement();if(g.nodeId==='factory')return v49FactoryRoom();if(g.nodeId==='seaport'){stage='seaport';return portMenu();}}
  }
  // Global inventory, map, status, saves, overnight and other established commands remain delegated.
 }
 await lgCore(raw);
};
function lanternShortest(from,to,cleared=!!player.flags.portRoadCleared){const d={[from]:0},todo=new Set(Object.keys(LG_NODES));while(todo.size){let u=null;for(const id of todo)if(d[id]!==undefined&&(u===null||d[id]<d[u]))u=id;if(u===null)return Infinity;if(u===to)return d[u];todo.delete(u);for(const e of lanternConnections(u)){if(e.requires&&!cleared)continue;const v=lanternOther(e,u),n=d[u]+e.distanceTurns;if(d[v]===undefined||n<d[v])d[v]=n;}}return Infinity;}
function lanternRescuePlan(){const g=lanternState();if(!g)return null;let node=g.lastSettlement||'house';if(node==='factory')node=g.solaceAdmitted?'solace':'house';if(node==='seaport'&&!player.flags.portRoadCleared)node=g.solaceAdmitted?'solace':'house';const e=lanternEdge();const travel=e?Math.min(g.stepIndex+lanternShortest(e.a,node),(e.distanceTurns-g.stepIndex)+lanternShortest(e.b,node)):lanternShortest(g.nodeId,node);return {node,travel:Number.isFinite(travel)?travel:0};}
const lgDeath=handlePlayerDeath;handlePlayerDeath=function(){const plan=lanternRescuePlan();lgDeath();if(plan&&stage==='fallen'){Object.assign(lanternState(),{nodeId:plan.node,currentEdgeId:null,stepIndex:0,pending:false,markerContext:null});lanternSave();}};
function lanternMarker(){const g=lanternMigrate(),e=lanternEdge();if(!e)return LG_NODES[g.nodeId].anchor;const pts=e.polyline,lens=pts.slice(1).map((p,i)=>Math.hypot((p[0]-pts[i][0])*1312,(p[1]-pts[i][1])*1199)),total=lens.reduce((a,b)=>a+b,0);let left=total*g.stepIndex/e.distanceTurns;for(let i=0;i<lens.length;i++){if(left<=lens[i]||i===lens.length-1){const t=lens[i]?left/lens[i]:0;return pts[i].map((v,k)=>v+(pts[i+1][k]-v)*t);}left-=lens[i];}return pts.at(-1);}
showMap=function(){const g=lanternMigrate();add('LANTERN HIGHWAY — WORLD MAP','place');add(g.currentEdgeId?lanternProgressText():'YOU ARE HERE — '+LG_NODES[g.nodeId].name,'bright');add(`Harbor passage: ${player.flags.portRoadCleared?'CLEARED':'BLOCKED — Boulder Junction'}. Amber: current position. Teal: traveled road. Gray: untraveled road. Dashed: blocked road. Hollow sites: future interiors.`,'system');
 if(g.mapMode!=='classic')outputQueue=outputQueue.then(()=>{const figure=document.createElement('figure');figure.className='lantern-map';figure.setAttribute('aria-label','Lantern Highway road map with current position');const p=lanternMarker();const paths=LANTERN_WORLD_GRAPH.edges.map(e=>`<polyline points="${e.polyline.map(q=>q[0]*1312+','+q[1]*1199).join(' ')}" fill="none" stroke="${lanternAllowed(e)?g.discoveredEdges.includes(e.id)?'#37bdae':'#a8b0bb':'#ef7777'}" stroke-width="${g.currentEdgeId===e.id?5:2}" ${lanternAllowed(e)?'':'stroke-dasharray="8 6"'} opacity=".85"><title>${LG_NODES[e.a].name} to ${LG_NODES[e.b].name}: ${e.distanceTurns} turns</title></polyline>`).join('');const dots=LANTERN_WORLD_GRAPH.nodes.map(n=>`<circle cx="${n.anchor[0]*1312}" cy="${n.anchor[1]*1199}" r="5" fill="${n.futureInterior?'#161b22':g.discoveredNodes.includes(n.id)?'#37bdae':'#89929e'}" stroke="#e6edf3" stroke-width="1"><title>${n.name}${n.futureInterior?' — exterior only':''}${g.discoveredNodes.includes(n.id)?' — discovered':''}</title></circle>`).join('');figure.innerHTML=`<svg viewBox="0 0 1312 1199" role="img" aria-label="You are here: ${g.currentEdgeId?lanternProgressText():LG_NODES[g.nodeId].name}"><image href="${LANTERN_WORLD_GRAPH.image}" width="1312" height="1199"/>${paths}${dots}<circle id="lantern-player-marker" cx="${p[0]*1312}" cy="${p[1]*1199}" r="10" fill="#ffbd4a" stroke="#201409" stroke-width="3"/><text x="${p[0]*1312+15}" y="${p[1]*1199-15}" fill="#ffcf70" stroke="#10151c" stroke-width="5" paint-order="stroke" font-size="20" font-weight="bold">YOU ARE HERE</text></svg>`;screen.appendChild(figure);});
 for(const n of LANTERN_WORLD_GRAPH.nodes)if(g.discoveredNodes.includes(n.id)||n.futureInterior)add(`${n.name}${n.futureInterior?' — exterior only, future interior': ' — discovered'}`,'system');const here=g.currentEdgeId?g.direction>0?lanternEdge().b:lanternEdge().a:g.nodeId;for(const e of lanternConnections(here))add(`${LG_NODES[e.a].name} ↔ ${LG_NODES[e.b].name}: ${e.distanceTurns} turns${lanternAllowed(e)?'':' [BLOCKED]'}`,'system');r5DirectChoices(['GRAPHIC MAP','CLASSIC MAP','BACK']);};
const lgLive=v49LiveMap;v49LiveMap=function(){if(lanternState()){const el=document.querySelector('#live-map');if(el)el.textContent=lanternEdge()?lanternProgressText():'YOU ARE HERE — '+LG_NODES[lanternState().nodeId].name;return;}return lgLive();};
