// Route 127 v54 factory expansion. All dungeon progress lives in player.flags and survives normal saves.
const FACTORY_FLOORS=[
 {name:'LOADING & RECEIVING',boss:'SALVAGE KING',rooms:[
 ['Loading Dock','Abandoned trucks stand nose-to-tail beneath a broken crane.','Scrap Metal'],
 ['Shipping Office',"Manifests mark insulated shipments BATCH 47, bound for the coastal freight line. Later entries replace names with tribute tallies; no sender is listed.",'Cloth'],
 ['Storage Warehouse','The stacked containers provide hiding places for scavengers and wildlife.','Wire'],
 ['Forklift Bay','A disabled forklift blocks the passage. A hand-crank release is visible beneath its chassis.','Scrap Metal'],
 ['Scavenger Camp','A half-warm fire and mismatched bedrolls show someone has been here recently.','Energy Bars'],
 ["Salvage King's Office","A throne of pallets faces a ledger of payments for keeping shipments moving. The newest pages bear the New Dominion mark.",'Scrap Metal']]},
 {name:'PRODUCTION & ASSEMBLY',boss:'GRINDER',rooms:[
 ['Assembly Entrance','Conveyors stand motionless beneath rusting warning signs.','Wire'],
 ['Machine Shop','Steel shavings carpet the floor around silent cutting equipment.','Scrap Metal'],
 ['Conveyor Junction','The belt controls spark; a bypass lever sits behind a service panel.','Wire'],
 ['Maintenance Workshop',"Half-repaired motors surround a technician’s notes: communications orders cancelled; sealed coastal shipments take priority. Useful electrical parts remain on the benches.",'Electronics'],
 ['Robotics Testing Bay','A security unit scrapes against a guardrail, its optics twitching.','Electronics'],
 ['Production Control Room','An enormous worker waits beside the control console. Something glints behind his ear.','Scrap Metal']]},
 {name:'CHEMICAL PROCESSING',boss:'THE CHEMIST',rooms:[
 ['Chemical Intake','Pipes sweat beneath faded hazard placards.','Cloth'],
 ['Testing Laboratory','Empty syringes and numbered vials fill the cabinets.','Bandage'],
 ['Containment Corridor','A warning lamp blinks beside a ruptured pressure line.','Wire'],
 ['Mixing Chamber','Three pressure valves surround a leaking mixing tank.','Scrap Metal'],
 ['Observation Room',"Notes mention changes in subject response beside shipment numbers matching BATCH 47. The pages naming the subjects and purpose have been torn out.",'Electronics'],
 ["Chief Chemist's Laboratory",'A trembling figure stands over a cabinet marked BATCH 47.','Bandage']]},
 {name:'RESTRICTED BASEMENT',boss:'THE FOREMAN',rooms:[
 ['Security Checkpoint',"Three supervisor authorization lights guard the basement door. A battered notice reserves the equipment below for the Foreman.",'Wire'],
 ['Underground Storage',"Empty BATCH 47 containers stand beside disturbed stores of metal and blasting supplies. A freight stencil points toward Seaport.",'Scrap Metal'],
 ["Foreman's Quarters","An old employee photograph has several faces scratched away. A newer tribute ledger lies open beneath the New Dominion mark.",'Cloth'],
 ['Central Operations',"Old machinery hums beneath the concrete. The Foreman guards the controls and the blasting-equipment isolation panel.",'Electronics']]}
];
const FACTORY_PUZZLES={'0:3':{hint:'The forklift brake is jammed. A release cable runs under the operator seat.',answer:'release brake',options:'RELEASE BRAKE'},'1:2':{hint:'The conveyor has an emergency isolation lever under the control box.',answer:'isolate power',options:'ISOLATE POWER'},'2:3':{hint:'A safety note says to vent the pressure BEFORE closing the feed.',answer:'vent pressure',options:'VENT PRESSURE'},'3:0':{hint:'The security console accepts the three supervisor authorizations automatically.',answer:'verify authorization',options:'VERIFY AUTHORIZATION'}};
const FACTORY_ENEMIES=[['DOCK LOOTER','FERAL DOG','RUSTED SCAVENGER'],['SCRAP CUTTER','MALFUNCTIONING ROBOT','FACTORY RAT'],['CONTAMINATED RAT','MASKED SCAVENGER','PIPE CRAWLER'],['ROGUE SECURITY UNIT','ARMORED SCAVENGER','MAINTENANCE DRONE']];
const FACTORY_BOSSES=[{name:'SALVAGE KING',level:5,hp:65,min:8,max:13,xp:210,bolts:24},{name:'GRINDER',level:6,hp:80,min:10,max:16,xp:250,bolts:28},{name:'THE CHEMIST',level:7,hp:90,min:12,max:18,xp:290,bolts:26},{name:'THE FOREMAN',level:8,hp:115,min:15,max:22,xp:370,bolts:40}];
function factoryState(){let f=player.flags.factoryDungeon;if(!f||typeof f!=='object'){f={floor:-1,room:-1,done:[],puzzles:[],searched:{},fights:{},pending:null,unlockSeen:false,foremanLore:false};player.flags.factoryDungeon=f;}return f;}
// Derive the legacy journal field from real milestones; never gate access.
function syncFactoryQuest(){
 const f=player.flags,done=f.factoryDungeon?.done||[];
 const complete=f.factoryQuest==='done'||[0,1,2,3].every(n=>done.includes(n))||f.portChargePrepared||f.portRoadCleared||f.seaportRoute?.arrived||f.seaport55?.freed||f.chapterOneComplete;
 if(complete)f.factoryQuest='done';
 else if(f.relayQuest==='complete'||f.v49FactoryMet||f.v49TerminalRead||f.r5ForgeBriefed||done.length)f.factoryQuest='active';
 return f.factoryQuest;
}
const FACTORY_SUPERVISOR_LINES=[
 'SALVAGE KING > Somebody still pays for those sealed shipments. I never asked who.',
 'GRINDER > Production must continue. A tiny metal shape glints behind his ear.',
 'THE CHEMIST > They told me it would help people. I never administered it.',
 'FOREMAN > You have no idea what this place was making.'
];
function factorySupervisorSpeech(){
 const f=factoryState(),floor=f.floor;
 if(!FACTORY_SUPERVISOR_LINES[floor]||f.done.includes(floor)||f.supervisorSpeeches?.[floor])return;
 f.supervisorSpeeches=f.supervisorSpeeches||{};f.supervisorSpeeches[floor]=true;
 add(FACTORY_SUPERVISOR_LINES[floor],'bright');
}
function factoryDone(){return factoryState().done.length;}
function factoryEnter(){factoryState();stage='factoryDungeonHub';add('The sealed door has been removed. Beyond Forge’s workshop, a stairwell descends into the industrial complex.','bright');factoryRender();}
function factoryHub(){const f=factoryState();f.floor=-1;f.room=-1;stage='factoryDungeonHub';factoryRender();}
function factoryRoomDescription(){const f=factoryState(),fl=FACTORY_FLOORS[f.floor];if(f.room===fl.rooms.length-1&&f.done.includes(f.floor))return ['The pallet throne stands empty. The Salvage King has been defeated.', 'The production control console is unguarded. Grinder has been defeated.', 'The cabinet marked BATCH 47 stands unattended. The Chemist has been defeated.', 'The control panel is unguarded. The Foreman has been defeated.'][f.floor];return fl.rooms[f.room][1];}
// Daniel's rescue is a separate overlay in an ordinary upper-floor room. It never
// consumes the room's search, encounter, boss, puzzle, or charge-component state.
function r18DanielAvailable(){return !!player.flags.r18ClaraMet&&player.flags.r18DanielQuest!=='done';}
function r18DanielAtRoom(){const f=factoryState();return stage==='factoryDungeonRoom'&&f.floor===0&&f.room===2&&r18DanielAvailable();}
function r18DanielMenu(){add('Behind a stack of shipping crates, two captors guard Clara Bennett’s brother Daniel.','place');add('FREE DANIEL WITH WIRE   NEGOTIATE RELEASE — 25 BOLTS   FIGHT CAPTORS   RETURN TO FACTORY ROOM','system');}
function r18DanielFinish(){const f=player.flags;if(f.r18DanielQuest==='done')return false;if(!CRAFT_RECIPES.widowmaker||!EQUIPMENT_CATALOG.some(x=>x.id==='weapon-epic-widowmaker')){add('The promised blueprint is unavailable; the rescue remains pending.','danger');return false;}
 f.r11Learned=f.r11Learned||{};if(!f.r11Learned.widowmaker){f.r11Learned.widowmaker=true;add('BLUEPRINT LEARNED — EPIC WIDOWMAKER','reward');}else{const alternative=Object.keys(CRAFT_RECIPES).find(k=>k!=='widowmaker'&&CRAFT_RECIPES[k].type==='weapon'&&GEAR[CRAFT_RECIPES[k].name]?.rarity==='rare'&&!(typeof r11Learned==='function'?r11Learned(k):f.r11Learned[k]));if(alternative){f.r11Learned[alternative]=true;add('BLUEPRINT LEARNED — '+CRAFT_RECIPES[alternative].name.toUpperCase(),'reward');}else{r18RetainRoadReward('Tempered Steel','material');add('Clara shares Rare Tempered Steel; you already know the available weapon blueprints.','reward');}}
 f.r18DanielQuest='done';delete f.r18DanielFocus;gainBolts(100);gainXp(Math.max(60,player.level*12));r18RetainRoadReward('Pre-War Silver Coin','valuable');add('Daniel escapes the Factory. At the entrance Clara embraces him; together they thank you and leave for a safer road.','reward');return true;}
function r18DanielCommand(cmd){if(!r18DanielAtRoom()||!player.flags.r18DanielFocus)return false;
 if(cmd==='return to factory room'||cmd==='back'){delete player.flags.r18DanielFocus;factoryRender();return true;}
 if(cmd==='free daniel with wire'){if(!CRAFT_RECIPES.widowmaker||!EQUIPMENT_CATALOG.some(x=>x.id==='weapon-epic-widowmaker')){add('The promised blueprint is unavailable. No Wire was spent.','danger');r18DanielMenu();return true;}if(!hasItem('Wire')){add('A length of Wire is needed to work the improvised latch.','system');r18DanielMenu();return true;}if(!removeItem('Wire'))return true;if(r18DanielFinish())factoryRender();else r18DanielMenu();return true;}
 if(cmd==='negotiate release — 25 bolts'){if(player.bolts<25){add('You need 25 Bolts to negotiate Daniel’s release.','system');r18DanielMenu();return true;}if(!CRAFT_RECIPES.widowmaker||!EQUIPMENT_CATALOG.some(x=>x.id==='weapon-epic-widowmaker')){add('The promised blueprint is unavailable. No Bolts were spent.','danger');r18DanielMenu();return true;}player.bolts-=25;if(r18DanielFinish())factoryRender();else r18DanielMenu();return true;}
 if(cmd==='fight captors'){const level=Math.max(1,Math.min(50,Number(player.level)||1)),hp=Math.max(12,Math.floor(baseHpForLevel(level)*.14));startCombat({name:'DANIEL’S CAPTORS',level,hp:hp*2,min:2,max:6,xp:Math.max(20,level*5),bolts:0,r18DanielCaptors:true,enemies:[{name:'WAREHOUSE GUARD',hp,bolts:0},{name:'CAPTOR',hp,bolts:0}],end:'The captors drop their weapons and flee.'},'factoryFight');return true;}
 r18DanielMenu();return true;}
function factoryRender(){const f=factoryState();if(player.flags.r18ClaraMet&&!player.flags.r18DanielQuest)player.flags.r18DanielQuest='active';numberedChoices={};currentHotkeys={};
 if(stage==='factoryDungeonHub'){add('FACTORY — CENTRAL STAIRWELL','place');add('Three upper levels branch from a concrete stairwell. Below, a reinforced door waits.');add('FACTORY PROGRESS: '+factoryDone()+'/4 COMPLETED','bright');add('[1] LOADING & RECEIVING   [2] PRODUCTION & ASSEMBLY   [3] CHEMICAL PROCESSING','system');add('[4] RESTRICTED BASEMENT   [5] RETURN TO FORGE\'S WORKSHOP','system');numberedChoices=Object.fromEntries([1,2,3,4,5].map(n=>[String(n),String(n)]));return;}
 if(stage==='factoryDungeonFloor'){const fl=FACTORY_FLOORS[f.floor];add('FACTORY — '+fl.name,'place');add('The stairwell is behind you. Choose a room to explore; moving into a room costs 1 turn.','system');fl.rooms.forEach((r,i)=>add(`[${i+1}] ${r[0]}${f.done.includes(f.floor)&&i===fl.rooms.length-1?' [CLEARED]':''}${f.floor===0&&i===2&&r18DanielAvailable()?' [DANIEL LEAD]':''}`,'system'));add('[0] RETURN TO CENTRAL STAIRWELL — FREE','system');numberedChoices=Object.fromEntries([0,...fl.rooms.map((_,i)=>i+1)].map(n=>[String(n),String(n)]));return;}
 if(stage==='factoryDungeonRoom'){if(r18DanielAtRoom()&&player.flags.r18DanielFocus){r18DanielMenu();return;}const fl=FACTORY_FLOORS[f.floor],r=fl.rooms[f.room],key=f.floor+':'+f.room;add('FACTORY — '+r[0].toUpperCase(),'place');add(factoryRoomDescription());const puzzle=FACTORY_PUZZLES[key];if(puzzle&&!f.puzzles.includes(key)){add('An obstacle interrupts the route. INSPECT for a clue.','system');add('INSPECT   '+puzzle.options+'   RETURN TO FLOOR','system');return;}
 const boss=f.room===fl.rooms.length-1;
 if(boss&&!f.done.includes(f.floor)){add('Someone is waiting. There is no peaceful way past.','danger');add('INSPECT   FIGHT   RETURN TO FLOOR','system');return;}
 const dailyKey=day+':'+key, encounter=f.fights[dailyKey],danielChoice=r18DanielAtRoom()?'   INVESTIGATE DANIEL':'';
 if(!boss&&!encounter){const seed=(day*17+f.floor*31+f.room*13)%6; if(seed<3){add('Movement echoes from somewhere in the room.','danger');add('INSPECT   FIGHT   SEARCH   RETURN TO FLOOR'+danielChoice,'system');}else{add('The room seems quiet for now.','system');add('INSPECT   SEARCH   RETURN TO FLOOR'+danielChoice,'system');}}else{add('No immediate threats remain here.','system');add('INSPECT   SEARCH   RETURN TO FLOOR'+danielChoice,'system');}return;}
}
function factoryBossStart(){const f=factoryState(),boss=FACTORY_BOSSES[f.floor];factorySupervisorSpeech();startCombat({...boss,end:`${boss.name} falls. The machinery does not stop.`},'factoryFight');}
function factoryCombatRetreat(){const f=factoryState();stage='factoryDungeonRoom';add('You retreat from the confrontation.','system');factoryRender();}
// One weapon per first boss defeat. 100% chance keeps the next encounter fair;
// the identity of the weapon is weighted and varies between playthroughs.
const FACTORY_BOSS_LOOT=[
 [{name:"King's Breaker",weight:40},{name:'Dockside Cleaver',weight:35},{name:'Salvage Hook',weight:25}],
 [{name:"Grinder's Cutter",weight:40},{name:'Rotary Tooth',weight:35},{name:'Assembly Maul',weight:25}],
 [{name:"Chemist's Injector",weight:35},{name:'Containment Scalpel',weight:40},{name:'Reactive Prod',weight:25}],
 [{name:"Foreman's Verdict",weight:35},{name:'Command Sledge',weight:40},{name:'Overseer Rail',weight:25}]
];
function factoryRollBossWeapon(floor){
 const pool=FACTORY_BOSS_LOOT[floor];
 const total=pool.reduce((sum,item)=>sum+item.weight,0);
 let roll=Math.random()*total;
 for(const item of pool){roll-=item.weight;if(roll<0)return item.name;}
 return pool[pool.length-1].name;
}
function factoryAwardBossWeapon(floor){
 const f=factoryState();f.weaponAwards=f.weaponAwards||{};
 // Legacy v54.1b saves used true to mark already claimed boss rewards.
 if(Object.prototype.hasOwnProperty.call(f.weaponAwards,floor))return;
 const name=factoryRollBossWeapon(floor),spec=GEAR[name];
 if(!spec||spec.type!=='weapon')throw Error('Invalid factory boss weapon: '+name);
 // Commit the rolled identity before any inventory mutation to prevent duplicate grants.
 f.weaponAwards[floor]=name;
 const old=player.weapon,oldStolen=!!player.flags.r18EquippedStolen?.weapon;
 if(!GEAR[old]||GEAR[old].max<spec.max){
   player.weapon=name;if(player.flags.r18EquippedStolen)player.flags.r18EquippedStolen.weapon=false;
   if(old&&!addPack(old,'weapon',1,true,oldStolen)){
     player.stash=player.stash||[];
     const slot=player.stash.find(i=>i.name===old&&i.type==='weapon'&&!!i.stolen===oldStolen);
     if(slot)slot.qty++;else player.stash.push({name:old,type:'weapon',qty:1,...(oldStolen?{stolen:true}:{})});
     add('Previous weapon moved to bank storage (backpack full).','system');
   }
   add('BOSS WEAPON EQUIPPED — '+gearLabel(name)+' — DMG '+spec.min+'–'+spec.max,'reward');
 }else{
   if(!addPack(name,'weapon',1,true)){
     player.stash=player.stash||[];
     const slot=player.stash.find(i=>i.name===name&&i.type==='weapon'&&!i.stolen);
     if(slot)slot.qty++;else player.stash.push({name:name,type:'weapon',qty:1});
     add('Boss weapon secured in bank storage (backpack full).','reward');
   }
   add('BOSS REWARD — '+gearLabel(name)+' — DMG '+spec.min+'–'+spec.max,'reward');
 }
 updateHud();
}
function factoryCombatWin(c){const f=factoryState(),key=f.floor+':'+f.room;if(c.r18DanielCaptors){if(r18DanielFinish()){stage='factoryDungeonRoom';factoryRender();}else{stage='factoryDungeonRoom';r18DanielMenu();}return;}if(c.name===FACTORY_BOSSES[f.floor]?.name){if(!f.done.includes(f.floor)){f.done.push(f.floor);factoryAwardBossWeapon(f.floor);}if(f.floor<3){add('SUPERVISOR AUTHORIZATION '+(f.floor+1)+' RECOVERED','reward');if(factoryDone()===3)add('From below, three heavy locks disengage. The restricted basement is now accessible.','bright');}else{add('The Foreman collapses against the control panel.','bright');if(!f.foremanLore){add("FOREMAN > The Dominion gave the orders. Those sealed loads went south, toward the harbor. I never met the man above them... They called him USER4387. Even the Dominion feared him.",'bright');f.foremanLore=true;}add("The basement blasting circuit is isolated. Recover any missing charge supplies from the marked rooms, then return to Forge. The way to Seaport can finally be opened.",'reward');} }else f.fights[day+':'+key]=true;syncFactoryQuest();stage='factoryDungeonRoom';factoryRender();}
function factoryCommand(cmd){if(!stage.startsWith('factoryDungeon'))return false;cmd=String(cmd).trim().toLowerCase();
 if(/^(?:save|load)(?: game)?(?: ?[123])?$/.test(cmd)||cmd==='load autosave'||['testing','testing access','test off','disable test mode'].includes(cmd))return false;
 const f=factoryState();
 if(stage==='factoryDungeonHub'){if(['5','return','workshop','return to forge','return to forge\'s workshop','exit'].includes(cmd)){v49FactoryRoom();return true;}const n=Number(cmd);if(Number.isInteger(n)&&n>=1&&n<=4){if(n===4&&factoryDone()<3){add('ACCESS DENIED — RESTRICTED AREA. AUTHORIZED PERSONNEL ONLY.','danger');add('The heavy security door refuses to move.','system');factoryRender();return true;}if(n===4&&!f.unlockSeen){add('ACCESS GRANTED. Three indicators turn green. The locking bolts withdraw with a metallic CLUNK.','reward');f.unlockSeen=true;}f.floor=n-1;f.room=-1;stage='factoryDungeonFloor';factoryRender();return true;}factoryRender();return true;}
 if(stage==='factoryDungeonFloor'){if(['0','back','return','stairwell','return to stairwell'].includes(cmd)){factoryHub();return true;}const n=Number(cmd),rooms=FACTORY_FLOORS[f.floor].rooms;if(Number.isInteger(n)&&n>=1&&n<=rooms.length){if(!spendTurn()){add('NO TURNS LEFT — You can return to the stairwell for free.','danger');factoryRender();return true;}f.room=n-1;
 f.visitedRooms=f.visitedRooms||{};
 const visitKey=f.floor+":"+f.room;
 if(!f.visitedRooms[visitKey]){f.visitedRooms[visitKey]=true;gainXp(22+f.floor*5);}
 stage='factoryDungeonRoom';factoryRender();return true;}factoryRender();return true;}
 if(stage==='factoryDungeonRoom'){if(r18DanielAtRoom()&&cmd==='investigate daniel'){player.flags.r18DanielFocus=true;r18DanielMenu();return true;}if(r18DanielCommand(cmd))return true;if(['return','return to floor','back','b','0'].includes(cmd)){stage='factoryDungeonFloor';factoryRender();return true;}const key=f.floor+':'+f.room,puzzle=FACTORY_PUZZLES[key],boss=f.room===FACTORY_FLOORS[f.floor].rooms.length-1;
 if(cmd==='inspect'){add(puzzle&&!f.puzzles.includes(key)?puzzle.hint:factoryRoomDescription(),'bright');factoryRender();return true;}
 if(puzzle&&!f.puzzles.includes(key)){if(cmd===puzzle.answer){if(!spendTurn()){add('NO TURNS LEFT.','danger');return true;}f.puzzles.push(key);add('The mechanism yields. The way is clear.','reward');factoryRender();return true;}add('The obstacle remains. Inspect the mechanism for a clue.','system');factoryRender();return true;}
 if(cmd==='fight'){if(boss){if(f.done.includes(f.floor)){add('This supervisor has already been defeated.','system');factoryRender();return true;}factoryBossStart();return true;}const dailyKey=day+':'+key;if(f.fights[dailyKey]||(day*17+f.floor*31+f.room*13)%6>=3){add('No enemy is present today.','system');factoryRender();return true;}const names=FACTORY_ENEMIES[f.floor],name=names[(day+f.room)%names.length];startCombat({name,level:Math.max(3,f.floor+3),hp:30+f.floor*12,min:5+f.floor*2,max:9+f.floor*3,xp:42+f.floor*12,bolts:3+f.floor*2,end:`${name} collapses among the wreckage.`},'factoryFight');return true;}
 if(cmd==='search'){const dailyKey=day+':'+key;if(f.searched[dailyKey]){add('You have already searched this room today.','system');factoryRender();return true;}if(!spendTurn()){add('NO TURNS LEFT.','danger');return true;}f.searched[dailyKey]=true;const item=FACTORY_FLOORS[f.floor].rooms[f.room][2];if((day+f.room+f.floor)%4===0){add('Nothing usable turns up this time.','system');}else{if(addPack(item,['Bandage','Energy Bars'].includes(item)?'consumable':'material'))add('SALVAGED: '+item.toUpperCase(),'reward');else add('Your backpack is full. You cannot carry the find.','danger');}factoryRender();return true;}
 factoryRender();return true;}
 return false;}
