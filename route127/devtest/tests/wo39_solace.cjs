const assert=require('node:assert/strict');
const {run,flush}=require('./helpers/wo33_dom.cjs')();
const command=async input=>{await run('handleCommand('+JSON.stringify(input)+')');await flush();};
function check(id,expected){
 const rows=JSON.parse(run('JSON.stringify(GraphicalUI.choices())'));
 assert(rows.length>0,id);
 assert(rows.every(row=>row.id?.startsWith(id+':')),JSON.stringify(rows));
 const commands=rows.map(row=>row.command);
 assert.equal(new Set(commands).size,rows.length);
 if(expected)assert.deepEqual(commands,expected);
 const registered=JSON.parse(run('JSON.stringify([...new Set([...Object.values(numberedChoices),...Object.values(currentHotkeys)])])'));
 assert.deepEqual(commands,id==='solace-gate'?registered.filter(command=>command!=='back'):registered);
}
(async()=>{
 await flush();
 run("resetPlayer();player.handle='WO39';stage='mercy';mercyLocation='town';player.flags.mercyDiscovered=true;lanternMigrate();");
 for(const mode of ['classic','graphics']){
  run("player.pack=[{name:'Energy Bars',type:'consumable',qty:2},{name:'Battered Flashlight',type:'tool',qty:1},{name:'Tent',type:'supply',qty:1}];");
  run(`GraphicalUI.setMode('${mode}');mercyLocation='town';mercyMenu();`);await flush();
  check('solace-town');
  await command('gates');check('solace-gates',['north gate','south gate','east gate','west gate','back to solace']);
  run("lanternMigrate().nodeId='solace';lanternMigrate().currentEdgeId=null;");
  await command('1');check('solace-gate');
  assert.equal(run("GraphicalUI.choices().at(-1).command"),'return to town');
  await command('return to town');check('solace-town');
  run("wandererLocations[wanderers[0].name]='mercy';");
  await command('talk to wanderer');check('solace-wanderers');
  await command('back to solace');check('solace-town');
  const visitor=run("GraphicalUI.choices().find(row=>row.command.startsWith('talk to '))?.command");
  assert(visitor);
  await command(visitor);check('solace-wanderer');
  assert.equal(run("GraphicalUI.choices().at(-1).command"),'leave');
  if(run("GraphicalUI.choices().some(row=>row.command.startsWith('trade '))")){
   await command(run("GraphicalUI.choices().find(row=>row.command.startsWith('trade ')).command"));
   check('solace-wanderer-stock');await command('back');check('solace-wanderer');
  }
  await command('leave');check('solace-town');
  await command('find tim');check('solace-tim',['small talk tim','town']);
  run("player.flags.timQuest='active'");await command('talk tim');
  check('solace-dialogue:tim',['ask about work','ask about relay station','never mind']);
  await command('never mind');check('solace-tim');
  await command('town');await command('shops');
  check('solace-shops',['the rusty lantern',"johnny's trading post","murphy's motor works",'last chance clinic','solace savings & loan','armory','back to solace']);
  await command('2');check('solace-johnny',['view stock','sell items','small talk','back']);
  await command('1');check('solace-johnny-stock',['buy energy bar','buy bandage','buy battered flashlight','buy tent','buy 16-slot backpack','back']);
  await command('b');check('solace-johnny');
  run("mercyLocation='town';mercyMenu();");await flush();await command('shops');
  await command('3');check('solace-murphy',['crafting recipes','crafting','small talk','back']);
  await command('crafting recipes');check('solace-blueprints');
  await command('back');check('solace-murphy');
  await command('small talk');check('solace-murphy-talk',['ask about work','inspect corvette photo','ask about relay station','back']);
  await command('back');check('solace-murphy');
  run("mercyLocation='town';mercyMenu();");await flush();await command('shops');
  await command('6');check('solace-armory');
  assert.deepEqual(JSON.parse(run('JSON.stringify(GraphicalUI.choices().slice(-2).map(row=>row.command))')),['sell items','back']);
  run("mercyLocation='town';mercyMenu();");await flush();await command('shops');
  await command('4');check('solace-clinic');await command('small talk wayne');
  check('solace-dialogue:wayne',['ask about last patient','ask about old house','back']);
  await command('b');
  check('solace-clinic',['treat wounds','buy bandage','sell items','small talk wayne','back']);
  await command('sell items');check('solace-sale',['sell energy bars ×2','sell battered flashlight ×1','sell tent ×1','back']);
  await command('1');check('solace-sale',['sell 1','sell all','custom amount','cancel sale']);
  const bolts=run('player.bolts');
  await command('sell 1');check('solace-sale',['confirm sale','cancel sale']);
  await command('confirm sale');assert(run('player.bolts')>bolts);
  await command('back');check('solace-clinic');
  run("mercyLocation='town';mercyMenu();");await flush();await command('shops');
  await command('5');
  check('solace-bank:main',['deposit bolts','withdraw bolts','stash items','retrieve items','view storage','small talk','change name','back']);
  await command('1');check('solace-bank:deposit',['deposit 10','deposit 50','deposit 100','deposit all bolts','custom amount','back']);
  const carried=run('player.bolts'),banked=run('player.bankBolts');
  await command('1');
  assert.equal(run('player.bolts'),carried-Math.min(10,carried));assert.equal(run('player.bankBolts'),banked+Math.min(10,carried));
  await command('b');check('solace-bank:main');
  await command('5');check('solace-bank:storage',['back']);
  run("mercyLocation='town';mercyMenu();");await flush();await command('shops');
  await command('3');await command('crafting');check('solace-crafting:murphy',['back']);
  await command('b');check('solace-murphy');
  run("stage='mercy';mercyLocation='tim';player.flags.r18BribePending={lawman:'Tim',price:50};v53TimMenu();");await flush();
  check('solace-tim-bribe',['confirm bribe','cancel bribe']);
  await command('2');assert(!run('player.flags.r18BribePending'));
  run("stage='mercy';mercyLocation='jen';player.flags.rustyRoomOwned=true;showBarActions();");await flush();
  await command('your room');check('solace-room',['rest','chest','look around','return']);
  if(mode==='classic'){
   await command('chest');assert.equal(run('mercyLocation'),'jenRoomChest');
   await command('deposit tent');assert.equal(run("player.rustyRoomChest.find(item=>item.name==='Tent').qty"),1);
   await command('withdraw tent');assert(!run("player.rustyRoomChest.some(item=>item.name==='Tent')"));
   await command('back');check('solace-room');
  }
  await command('return');check('rusty-lantern');
  run("stage='settlement';player.flags.solaceGateChallenge=true;showSolaceGateBusiness();");await flush();
  check('solace-guard',['abandoned terminal sent me','looking to trade','looking for the relay station','just passing through','pick a fight','offer guard 50 bolts']);
  await command('2');check('solace-guard');
  run('player.flags.solaceGuardBribeNextDay=day+1');
  const beforeBribe=run('player.bolts');
  await command('6');assert.equal(run('player.bolts'),beforeBribe);check('solace-guard');
  run('v49Forge();');await flush();check('forge-dialogue',['back']);
  run("stage='mercy';mercyLocation='jen';showBarActions();");await flush();
 }
 for(const slot of [1,2,3]){
  run(`activeSaveSlot=${slot};player.bolts=${100+slot};saveGame(${slot});`);
  await flush();
 }
 for(const slot of [1,2,3]){
  run(`loadGame(${slot})`);await flush();
  assert.equal(run('player.bolts'),100+slot);
  assert(run('player.flags.rustyRoomOwned'));
 }
 console.log('PASS WO39 Solace menu ownership and Classic/Graphical binding parity');
})().catch(error=>{console.error(error);process.exitCode=1;});
