const assert=require('node:assert/strict');
const {run,flush}=require('./helpers/wo33_dom.cjs')();
const command=async input=>{await run('handleCommand('+JSON.stringify(input)+')');await flush();};
function check(expected,exit){
 const rows=JSON.parse(run('JSON.stringify(GraphicalUI.choices())'));
 const commands=rows.map(row=>row.command);
 assert(rows.length&&rows.every(row=>row.id?.startsWith('seaport:')),JSON.stringify(rows));
 assert.equal(commands.length,new Set(commands).size);
 if(expected)assert.deepEqual(commands,expected);
 if(exit)assert.equal(commands.at(-1),exit);
}
(async()=>{
 await flush();
 run("resetPlayer();player.handle='WO40';stage='seaport';player.flags.portRoadCleared=true;lanternMigrate();lanternState().nodeId='seaport';");
 run("Object.assign(port55State(),{freed:false,stage:'investigate'});port55Menu();");await flush();
 check(['harbor docks','return to road'],'return to road');
 await command('1');check(['inspect fishermen','return to seaport'],'return to seaport');
 await command('inspect fishermen');check(['confront fishermen','return to seaport'],'return to seaport');
 await command('confront fishermen');assert.equal(run('combatState.source'),'seaportLiberation');
 // Exercise the canonical victory transition without simulating a full fight.
 run("combatState=null;portLiberationVictory();");await flush();
 check(['free the survivors','back away'],'back away');
 await command('free the survivors');assert(run('port55State().freed'));check(null,'return to road');
 for(const mode of ['classic','graphics']){
  run(`GraphicalUI.setMode('${mode}');Object.assign(port55State(),{freed:true,stage:'done'});stage='seaport';port55Menu();`);await flush();
  check(null,'return to road');
  await command('town streets');check(null,'return to harbor');
  const visitor=run("GraphicalUI.choices().find(row=>row.command.startsWith('talk to wanderer'))?.command");
  if(visitor){
   await command(visitor);assert.equal(run('stage'),'port55Guest');check(null,'leave');
   await command('leave');assert.equal(run('player.flags.port55CurrentStop'),'Town Streets');
  }
  await command('talk kaiden');check(['ask about seaport','small talk','view bounties','back'],'back');
  if(mode==='graphics'){
   assert.equal(await run("GraphicalUI.dispatch(GraphicalUI.choices().find(row=>row.command==='small talk'))"),true);
   await flush();
  }else await command('2');
  check(['how is seaport holding up?','ask about keeping the lights on','back'],'back');
  await command('2');check(['accept quest','back'],'back');
  await command('back');check(['how is seaport holding up?','ask about keeping the lights on','back'],'back');
  await command('back');await command('back');assert.equal(run('player.flags.port55CurrentStop'),'Town Streets');
  run("stage='seaport';port55Menu()");await flush();
  run('player.flags.r18CalebRescued=true;');
  await command('harbor docks');check(null,'return to seaport');
  assert(run("GraphicalUI.choices().some(row=>row.command==='talk to caleb')"));
  await command('talk to caleb');check(null,'return to seaport');
  await command('return to seaport');
  await command('rusty anchor');check(null,'return to harbor');
  await command('small talk');check(null,'back');
  await command('back');
  run('player.bolts=100;player.hp=50;player.maxHp=100;');
  await command('buy drinks');check(null,'back');
  await command('1');assert.equal(run('player.bolts'),95);assert.equal(run('player.hp'),55);
  await command('back');await command('gamble');check(null,'return to mia');
  await command('return to mia');
  run("player.flags.r6AnchorRoomOwned=true;r6RoomMenu();");await flush();
  check(['rest','chest','look around','return to mia'],'return to mia');
  await command('return to mia');assert.equal(run('stage'),'port55Mia');
  await command('talk to red');check(null,'return to mia');
  await command('ask red his name');check(null,'return to mia');
  await command('return to mia');assert.equal(run('stage'),'port55Mia');
  run("stage='port55Stop';player.flags.port55CurrentStop='Market Area';port55StopMenu();");await flush();
  check(null,'back');
  for(const role of ['clinic','general store','workshop','bank','armory']){
   run(`portStaffOpen(${JSON.stringify(role)});`);await flush();
   check(null,'back to market');
   await command('back to market');check(null,'back');
  }
  run("{const banker=wanderers[0].name;if(!portStaffState().hired.includes(banker))portStaffState().hired.push(banker);portStaffState().assignments.bank=banker;portStaffOpen('bank');}");await flush();
  check(null,'back to market');
  const wallet=run('player.bolts');
  await command('deposit bolts');assert.equal(run('player.flags.portStaffUI.page'),'money');
  if(mode==='classic'){await command('5');assert.equal(run('player.bolts'),wallet-5);}
  run("delete portStaffState().assignments.bank;stage='port55Vendor';delete player.flags.r18SilasOutcome;port55Vendor();");await flush();
  check(['purchase pets','back'],'back');
  if(mode==='classic'){
   await command('1');check(null,'back');
   assert(run("GraphicalUI.choices().some(row=>row.command.startsWith('scrap rat'))"));
   await command('b');check(['purchase pets','back'],'back');
   run('player.bolts=PORT55_PETS["Scrap Rat"].price+10;');
   await command('purchase pets');await command('scrap rat');
   assert(run('port55Owned().includes("Scrap Rat")'));
   assert.equal(run('player.bolts'),10);
   check(['purchase pets','back'],'back');
  }
  assert(!run("GraphicalUI.choices().some(row=>row.command.includes('silas'))"));
  run("player.flags.r18SilasOutcome='released';port55Vendor();");await flush();
  check(null,'back');
  assert(run("GraphicalUI.choices().some(row=>row.command==='ask nessa about silas')"));
 }
 for(const slot of [1,2,3]){
  run(`stage='seaport';player.characterId='local-'+crypto.randomUUID();activeSaveSlot=${slot};player.bolts=${100+slot};saveGame(${slot});`);await flush();
 }
 for(const slot of [1,2,3]){
  run(`loadGame(${slot});`);await flush();
  assert.equal(run('player.bolts'),100+slot);
  assert(run("port55State().freed&&player.flags.r6AnchorRoomOwned&&player.flags.r18SilasOutcome==='released'"));
 }
 console.log('PASS WO40 Seaport shared menu bindings, navigation and liberation gates');
})().catch(error=>{console.error(error);process.exitCode=1;});
