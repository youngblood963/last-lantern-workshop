const assert=require('node:assert/strict'),create=require('./helpers/menu_audit.cjs');
(async()=>{
const game=create(),{run,flush,ctx}=game;await flush();
const settle=async()=>{await flush();await Promise.resolve();await flush();};
run("resetPlayer();player.handle='Motel Regression';player.level=20;player.hp=250;player.maxHp=900;player.turns=100;player.bolts=20000;player.packMax=40;player.flags.interfaceUnlocked=true;player.flags.mercyDiscovered=true;player.flags.murphyRideLevel10Astrid=true;lanternMigrate();Object.assign(lanternState(),{nodeId:'abandoned-motel',currentEdgeId:null,pending:false});GraphicalUI.active=()=>true;GraphicalUI.preferred='graphics';busy=false;commandProcessing=false;lanternNodeMenu()");await settle();
const offered=()=>JSON.parse(run('JSON.stringify(GraphicalUI.choices().map(c=>c.command))'));
const act=async c=>{const row=run('GraphicalUI.choices()').find(x=>x.command===c);assert(row,'Missing graphical command '+c+' in '+offered());await run('GraphicalUI.dispatch('+JSON.stringify(row)+')');await settle();};
const bounded=()=>assert(offered().length<=8,'Oversized navigation '+offered());
assert.deepEqual(offered(),['motel vendors','the lounge','talk to jessica','the pool','behind the motel','bulletin board','leave motel']);
for(const phase of ['new','initial']){run('player.flags.r18Courier={phase:'+JSON.stringify(phase)+'};Route127Motel.open()');await settle();assert(!offered().includes('mail room'));}
run("player.flags.r18Courier={phase:'service'};Route127Motel.open()");await settle();assert.equal(offered().length,8);
await act('mail room');assert.equal(run('stage'),'motelMail');bounded();await act('return to town');assert.equal(run('stage'),'motelHome');
await act('bulletin board');assert(run("document.body.querySelector('.route127-community-board').open"));run("(()=>{const board=document.body.querySelector('.route127-community-board');Route127Community.close();for(const listener of board.events.close||[])listener();})()");await settle();assert.equal(run('stage'),'motelHome');
await act('behind the motel');assert.deepEqual(offered(),['back']);await act('back');
await act('motel vendors');assert.equal(offered().length,7);
for(const role of ['general store','armory','workshop','clinic','bank']){await act(role);assert.equal(run('stage'),'port55Service');bounded();assert(offered().includes('assign staff'));await act('return to motel vendors');}
await act("rani's accessories");assert.deepEqual(offered(),['sell items','back']);
run("addPack('Scrap Metal','material',3,true);Route127Motel.open('rani')");await settle();await act('sell items');const sell=offered().find(c=>c.startsWith('sell scrap metal'));assert(sell);await act(sell);await act('confirm store sale');assert.equal(run("findItem('Scrap Metal').qty"),2);await act('back');assert.equal(run('stage'),'motelRani');await act('back');
await act('the lounge');assert(!offered().some(c=>/casino|gambl/.test(c)));await act('buy drinks');const hp=run('player.hp'),bolts=run('player.bolts');await act(offered()[0]);assert(run('player.hp')>hp);assert(run('player.bolts')<bolts);await act('back');assert.equal(run('stage'),'motelLounge');await act('back');
await act('talk to jessica');await act('small talk');assert.equal(run('player.flags.motelJessica.conversations'),1);bounded();await act('back');
// Exercise the existing bounty dialog callbacks against Jessica's independent ledger.
const click=async label=>{const b=game.buttons().find(b=>b.textContent===label);assert(b,'Missing dialog control '+label);for(const f of b.events.click||[])await f();await settle();};
await act('talk to jessica');await act('bounties');
const sharedBefore=run('JSON.stringify(player.flags.dailyBounties)'),jessicaId=run('player.flags.motelJessicaBounties.contracts[0].id');
let poster=game.buttons().find(b=>b.classList.contains('wanted-poster'));assert(poster);for(const f of poster.events.click||[])await f();await settle();await click('Accept Bounty');
assert.equal(run('player.flags.motelJessicaBounties.contracts[0].status'),'active');assert.equal(run('JSON.stringify(player.flags.dailyBounties)'),sharedBefore);
run("player.flags.motelJessicaBounties.contracts[0].status='proof';document.body.querySelector('.r127-wanted-board').close();DailyBounties.openContact('jessica')");
poster=game.buttons().find(b=>b.classList.contains('wanted-poster')&&b.textContent.includes(run('DailyBounties.roster().find(r=>r.id===player.flags.motelJessicaBounties.contracts[0].target).name')));for(const f of poster.events.click||[])await f();await settle();
const bountyBolts=run('player.bolts'),payment=run('player.flags.motelJessicaBounties.contracts[0].payment');await click('Claim '+payment+' Bolts');assert.equal(run('player.bolts'),bountyBolts+payment);assert.equal(run('stage'),'motelJessica');assert.equal(run('player.flags.motelJessicaBounties.history.length'),1);assert.equal(run('JSON.stringify(player.flags.dailyBounties)'),sharedBefore);await act('back');
run("globalThis.recruitName=wanderers.find(w=>wandererAlive(w)&&!v50Profile(w).hostile&&!portIsHired(w.name)).name;currentRoadWanderer=recruitName;stage='wandererRoad';v53WandererMenu(wandererByName(recruitName),true)");await settle();
await act('recruit');await act('recruit for motel');if(!offered().includes('confirm hire'))await act(offered().find(c=>c!=='cancel hire'&&c!=='back'));const hireBolts=run('player.bolts'),hirePrice=run('portHireCost(wandererByName(recruitName))');await act('confirm hire');assert(run('player.flags.motelStaff.hired.includes(recruitName)'));assert.equal(run('wandererLocations[recruitName]'),'motel');assert.equal(run('player.bolts'),hireBolts-hirePrice);run('Route127Motel.open()');await settle();
// Seed existing hired wanderers in independent settlement storage, then use actual assignment handlers.
run("globalThis.staffNames=wanderers.filter(w=>wandererAlive(w)&&!v50Profile(w).hostile).slice(0,6).map(w=>w.name);player.flags.motelStaff={hired:staffNames,assignments:{}};player.flags.seaportStaff={hired:['Other Seaport Worker'],assignments:{clinic:'Other Seaport Worker'}};globalThis.seaportBefore=JSON.stringify(player.flags.seaportStaff)");
await act('motel vendors');
for(const [index,role]of ['general store','armory','workshop','clinic','bank'].entries()){
 await act(role);await act('assign staff');bounded();
 const name=run('staffNames['+index+']');while(!offered().includes('assign '+name.toLowerCase())){assert(offered().includes('next staff'));await act('next staff');bounded();}
 await act('inspect staff '+name.toLowerCase());await act('assign '+name.toLowerCase());await act('confirm assignment');bounded();
 assert.equal(run('portStaffState().assignments['+JSON.stringify(role)+']'),name);
 await act('return to motel vendors');
}
assert.equal(run('JSON.stringify(player.flags.seaportStaff)'),run('seaportBefore'));
await act('bank');await act('bank bolts');bounded();await act('deposit bolts');run("FocusedEntry.field.value='100'");await run("FocusedEntry.submit()");await settle();assert.equal(run('player.bankBolts'),100);if(run('!!FocusedEntry.dialog')){run('FocusedEntry.cancel()');await run('FocusedEntry.pendingCancellation');await settle();}if(offered().length===1&&offered()[0]==='back')await act('back');await act('return to motel vendors');
await act('clinic');const oldHp=run('player.hp');await act('treat wounds');assert(run('player.hp')>oldHp);await act('return to motel vendors');
await act('armory');await act('buy equipment');assert(run("!!player.flags.regionalEquipment.motel"));assert(!run('!!player.flags.regionalEquipment.seaport'));await act('back');await act('unassign staff');await act('confirm unassignment');assert.equal(run('portStaffState().assignments.armory'),undefined);await act('return to motel vendors');await act('back');
await act('the pool');assert.equal(run('stage'),'r127ArenaLobby');bounded();await act('enter tournament');assert.equal(run('player.flags.r18TournamentFocus'),'deep');assert(run('r18TournamentAt("deep")'));await act('leave arena');assert.equal(run('stage'),'r127ArenaLobby');await act('back away');assert.equal(run('stage'),'motelHome');
// Run native spectator timers in the fixture; wager settlement and controls must return.
const nativeInterval=ctx.setInterval;let tick;ctx.setInterval=f=>{tick=f;return 99;};
await act('the pool');await act('watch a round');for(let i=0;i<100&&!offered().includes('watch a round');i++){tick();await settle();}assert(offered().includes('watch a round'));assert.equal(run('player.turns'),100);
await act('bet on a round');await act(offered()[0]);const wagerBolts=run('player.bolts');await act('wager 10');for(let i=0;i<100&&!offered().includes('watch a round');i++){tick();await settle();}assert([wagerBolts-10,wagerBolts+10].includes(run('player.bolts')));ctx.setInterval=nativeInterval;
await act('enter tournament');await act('start next match');assert.equal(run('combatState.r18TournamentKey'),'deep');assert.equal(run('stage'),'combat');run('r18TournamentDefeat(combatState)');await settle();assert.equal(run('player.hp'),1);assert.equal(run('stage'),'r18Tournament');await act('leave arena');await act('back away');
run("saveGame();player.flags.motelVisited=false;loadGame('auto')");await settle();assert.equal(run('stage'),'motelHome');assert(run('Route127Motel.mailUnlocked()'));assert.equal(run('lanternState().nodeId'),'abandoned-motel');assert.equal(run('player.turns'),100);
await act('leave motel');assert.equal(run('stage'),'lanternNode');assert(offered().some(c=>c.startsWith('take road')));assert.equal(run('player.turns'),100);
console.log('PASS: Motel menus/returns, completed-only mail gating, Rani sale, Lounge drink, Jessica, independent staff/stock, assign/inspect/unassign, bank/clinic, Jessica bounty acceptance/payment, native recruitment, Deep End watch/wager/combat/return, native save/load, unchanged travel turns');
})().catch(e=>{console.error(e);process.exitCode=1});
