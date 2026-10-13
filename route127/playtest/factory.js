// Route 127 v54 factory expansion. All dungeon progress lives in player.flags and survives normal saves.
const FACTORY_FLOORS=[
 {name:'LOADING & RECEIVING',boss:'SALVAGE KING',rooms:[
 ['Loading Dock','Abandoned trucks stand nose-to-tail beneath a broken crane.','Scrap Metal'],
 ['Shipping Office','Manifests list insulated shipments under an unremarkable code: BATCH 47.','Cloth'],
 ['Storage Warehouse','The stacked containers provide hiding places for scavengers and wildlife.','Wire'],
 ['Forklift Bay','A disabled forklift blocks the passage. A hand-crank release is visible beneath its chassis.','Scrap Metal'],
 ['Scavenger Camp','A half-warm fire and mismatched bedrolls show someone has been here recently.','Energy Bars'],
 ["Salvage King's Office",'A throne of pallets faces a ledger of anonymous payments.','Scrap Metal']]},
 {name:'PRODUCTION & ASSEMBLY',boss:'GRINDER',rooms:[
 ['Assembly Entrance','Conveyors stand motionless beneath rusting warning signs.','Wire'],
 ['Machine Shop','Steel shavings carpet the floor around silent cutting equipment.','Scrap Metal'],
 ['Conveyor Junction','The belt controls spark; a bypass lever sits behind a service panel.','Wire'],
 ['Maintenance Workshop','Half-repaired motors and a technician’s notes litter the benches.','Electronics'],
 ['Robotics Testing Bay','A security unit scrapes against a guardrail, its optics twitching.','Electronics'],
 ['Production Control Room','An enormous worker waits beside the control console. Something glints behind his ear.','Scrap Metal']]},
 {name:'CHEMICAL PROCESSING',boss:'THE CHEMIST',rooms:[
 ['Chemical Intake','Pipes sweat beneath faded hazard placards.','Cloth'],
 ['Testing Laboratory','Empty syringes and numbered vials fill the cabinets.','Bandage'],
 ['Containment Corridor','A warning lamp blinks beside a ruptured pressure line.','Wire'],
 ['Mixing Chamber','Three pressure valves surround a leaking mixing tank.','Scrap Metal'],
 ['Observation Room','Notes mention changes in subject response. Several pages have been torn out.','Electronics'],
 ["Chief Chemist's Laboratory",'A trembling figure stands over a cabinet marked BATCH 47.','Bandage']]},
 {name:'RESTRICTED BASEMENT',boss:'THE FOREMAN',rooms:[
 ['Security Checkpoint','Three authorization lights illuminate a reinforced door.','Wire'],
 ['Underground Storage','Empty insulated containers are stacked beside recently disturbed crates.','Scrap Metal'],
 ["Foreman's Quarters",'An employee photograph has several faces scratched away.','Cloth'],
 ['Central Operations','Old machinery hums beneath the concrete. A lone figure guards the controls.','Electronics']]}
];
const FACTORY_PUZZLES={'0:3':{hint:'The forklift brake is jammed. A release cable runs under the operator seat.',answer:'release brake',options:'RELEASE BRAKE'},'1:2':{hint:'The conveyor has an emergency isolation lever under the control box.',answer:'isolate power',options:'ISOLATE POWER'},'2:3':{hint:'A safety note says to vent the pressure BEFORE closing the feed.',answer:'vent pressure',options:'VENT PRESSURE'},'3:0':{hint:'The security console accepts the three supervisor authorizations automatically.',answer:'verify authorization',options:'VERIFY AUTHORIZATION'}};
const FACTORY_ENEMIES=[['DOCK LOOTER','FERAL DOG','RUSTED SCAVENGER'],['SCRAP CUTTER','MALFUNCTIONING ROBOT','FACTORY RAT'],['CONTAMINATED RAT','MASKED SCAVENGER','PIPE CRAWLER'],['ROGUE SECURITY UNIT','ARMORED SCAVENGER','MAINTENANCE DRONE']];
const FACTORY_BOSSES=[{name:'SALVAGE KING',level:5,hp:42,min:5,max:9,xp:65,bolts:24},{name:'GRINDER',level:6,hp:48,min:6,max:10,xp:72,bolts:28},{name:'THE CHEMIST',level:6,hp:38,min:6,max:11,xp:72,bolts:26},{name:'THE FOREMAN',level:7,hp:58,min:7,max:12,xp:110,bolts:40}];
function factoryState(){let f=player.flags.factoryDungeon;if(!f||typeof f!=='object'){f={floor:-1,room:-1,done:[],puzzles:[],searched:{},fights:{},pending:null,unlockSeen:false,foremanLore:false};player.flags.factoryDungeon=f;}return f;}
function factoryDone(){return factoryState().done.length;}
function factoryEnter(){factoryState();stage='factoryDungeonHub';add('The sealed door has been removed. Beyond Forge’s workshop, a stairwell descends into the industrial complex.','bright');factoryRender();}
function factoryHub(){const f=factoryState();f.floor=-1;f.room=-1;stage='factoryDungeonHub';factoryRender();}
function factoryRender(){const f=factoryState();numberedChoices={};currentHotkeys={};
 if(stage==='factoryDungeonHub'){add('FACTORY — CENTRAL STAIRWELL','place');add('Three upper levels branch from a concrete stairwell. Below, a reinforced door waits.');add('FACTORY PROGRESS: '+factoryDone()+'/4 COMPLETED','bright');add('[1] LOADING & RECEIVING   [2] PRODUCTION & ASSEMBLY   [3] CHEMICAL PROCESSING','system');add('[4] RESTRICTED BASEMENT   [5] RETURN TO FORGE\'S WORKSHOP','system');return;}
 if(stage==='factoryDungeonFloor'){const fl=FACTORY_FLOORS[f.floor];add('FACTORY — '+fl.name,'place');add('The stairwell is behind you. Choose a room to explore; moving into a room costs 1 turn.','system');fl.rooms.forEach((r,i)=>add(`[${i+1}] ${r[0]}${f.done.includes(f.floor)&&i===fl.rooms.length-1?' [CLEARED]':''}`,'system'));add('[0] RETURN TO CENTRAL STAIRWELL — FREE','system');return;}
 if(stage==='factoryDungeonRoom'){const fl=FACTORY_FLOORS[f.floor],r=fl.rooms[f.room],key=f.floor+':'+f.room;add('FACTORY — '+r[0].toUpperCase(),'place');add(r[1]);const puzzle=FACTORY_PUZZLES[key];if(puzzle&&!f.puzzles.includes(key)){add('An obstacle interrupts the route. INSPECT for a clue.','system');add('INSPECT   '+puzzle.options+'   RETURN TO FLOOR','system');return;}
 const boss=f.room===fl.rooms.length-1;
 if(boss&&!f.done.includes(f.floor)){add('Someone is waiting. There is no peaceful way past.','danger');add('INSPECT   FIGHT   RETURN TO FLOOR','system');return;}
 const dailyKey=day+':'+key, encounter=f.fights[dailyKey];
 if(!boss&&!encounter){const seed=(day*17+f.floor*31+f.room*13)%6; if(seed<3){add('Movement echoes from somewhere in the room.','danger');add('INSPECT   FIGHT   SEARCH   RETURN TO FLOOR','system');}else{add('The room seems quiet for now.','system');add('INSPECT   SEARCH   RETURN TO FLOOR','system');}}else{add('No immediate threats remain here.','system');add('INSPECT   SEARCH   RETURN TO FLOOR','system');}return;}
}
function factoryBossStart(){const f=factoryState(),boss=FACTORY_BOSSES[f.floor];if(f.floor===0)add('SALVAGE KING > Somebody still pays for those sealed shipments. I never asked who.');if(f.floor===1)add('GRINDER > Production must continue. A tiny metal shape glints behind his ear.');if(f.floor===2)add('THE CHEMIST > They told me it would help people. I never administered it.');if(f.floor===3)add('FOREMAN > You have no idea what this place was making.');startCombat({...boss,end:`${boss.name} falls. The machinery does not stop.`},'factoryFight');}
function factoryCombatRetreat(){const f=factoryState();stage='factoryDungeonRoom';add('You retreat from the confrontation.','system');factoryRender();}
function factoryCombatWin(c){const f=factoryState(),key=f.floor+':'+f.room;if(c.name===FACTORY_BOSSES[f.floor]?.name){if(!f.done.includes(f.floor))f.done.push(f.floor);if(f.floor<3){add('SUPERVISOR AUTHORIZATION '+(f.floor+1)+' RECOVERED','reward');if(factoryDone()===3)add('From below, three heavy locks disengage. The restricted basement is now accessible.','bright');}else{add('The Foreman collapses against the control panel.','bright');if(!f.foremanLore){add('FOREMAN > The Dominion gave the orders. I never met the man... They called him USER4387. Even the Dominion feared him.','bright');f.foremanLore=true;}add('You recover the final component needed for the charge. Return to Forge with it.','reward');player.flags.factoryFinalComponent=true;addPack('Factory Charge Component','quest');} }else f.fights[day+':'+key]=true;stage='factoryDungeonRoom';factoryRender();}
function factoryCommand(cmd){if(!stage.startsWith('factoryDungeon'))return false;const f=factoryState();cmd=String(cmd).trim().toLowerCase();
 if(stage==='factoryDungeonHub'){if(['5','return','workshop','return to forge','return to forge\'s workshop','exit'].includes(cmd)){v49FactoryRoom();return true;}const n=Number(cmd);if(Number.isInteger(n)&&n>=1&&n<=4){if(n===4&&factoryDone()<3){add('ACCESS DENIED — RESTRICTED AREA. AUTHORIZED PERSONNEL ONLY.','danger');add('The heavy security door refuses to move.','system');factoryRender();return true;}if(n===4&&!f.unlockSeen){add('ACCESS GRANTED. Three indicators turn green. The locking bolts withdraw with a metallic CLUNK.','reward');f.unlockSeen=true;}f.floor=n-1;f.room=-1;stage='factoryDungeonFloor';factoryRender();return true;}factoryRender();return true;}
 if(stage==='factoryDungeonFloor'){if(['0','back','return','stairwell','return to stairwell'].includes(cmd)){factoryHub();return true;}const n=Number(cmd),rooms=FACTORY_FLOORS[f.floor].rooms;if(Number.isInteger(n)&&n>=1&&n<=rooms.length){if(!spendTurn()){add('NO TURNS LEFT — You can return to the stairwell for free.','danger');factoryRender();return true;}f.room=n-1;stage='factoryDungeonRoom';factoryRender();return true;}factoryRender();return true;}
 if(stage==='factoryDungeonRoom'){if(['return','return to floor','back','b','0'].includes(cmd)){stage='factoryDungeonFloor';factoryRender();return true;}const key=f.floor+':'+f.room,puzzle=FACTORY_PUZZLES[key],boss=f.room===FACTORY_FLOORS[f.floor].rooms.length-1;
 if(cmd==='inspect'){add(puzzle&&!f.puzzles.includes(key)?puzzle.hint:FACTORY_FLOORS[f.floor].rooms[f.room][1],'bright');factoryRender();return true;}
 if(puzzle&&!f.puzzles.includes(key)){if(cmd===puzzle.answer){if(!spendTurn()){add('NO TURNS LEFT.','danger');return true;}f.puzzles.push(key);add('The mechanism yields. The way is clear.','reward');factoryRender();return true;}add('The obstacle remains. Inspect the mechanism for a clue.','system');factoryRender();return true;}
 if(cmd==='fight'){if(boss){if(f.done.includes(f.floor)){add('This supervisor has already been defeated.','system');factoryRender();return true;}factoryBossStart();return true;}const dailyKey=day+':'+key;if(f.fights[dailyKey]||(day*17+f.floor*31+f.room*13)%6>=3){add('No enemy is present today.','system');factoryRender();return true;}const names=FACTORY_ENEMIES[f.floor],name=names[(day+f.room)%names.length];startCombat({name,level:Math.max(3,f.floor+3),hp:18+f.floor*7,min:3+f.floor,max:6+f.floor*2,xp:14+f.floor*6,bolts:3+f.floor*2,end:`${name} collapses among the wreckage.`},'factoryFight');return true;}
 if(cmd==='search'){const dailyKey=day+':'+key;if(f.searched[dailyKey]){add('You have already searched this room today.','system');factoryRender();return true;}if(!spendTurn()){add('NO TURNS LEFT.','danger');return true;}f.searched[dailyKey]=true;const item=FACTORY_FLOORS[f.floor].rooms[f.room][2];if((day+f.room+f.floor)%4===0){add('Nothing usable turns up this time.','system');}else{if(addPack(item,['Bandage','Energy Bars'].includes(item)?'consumable':'material'))add('SALVAGED: '+item.toUpperCase(),'reward');else add('Your backpack is full. You cannot carry the find.','danger');}factoryRender();return true;}
 factoryRender();return true;}
 return false;}
