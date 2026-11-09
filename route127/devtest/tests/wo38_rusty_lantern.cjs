const assert=require('node:assert/strict');
const {scripts}=require('./helpers/devtest.cjs')();
const {run,flush}=require('./helpers/wo33_dom.cjs')();

const bar=['buy drinks','gamble','small talk jen','sell items','return to town'];
const dialogue=['ask about work','ask rumors','back'];
const work=['ask about missing shipment','ask about unpaid tab','a familiar face','back to jen'];
const read=expression=>JSON.parse(run('JSON.stringify('+expression+')'));
const command=async input=>{await run('handleCommand('+JSON.stringify(input)+')');await flush();};
function check(expected,screen){
 if(screen==='rusty-lantern'){
  const visitor=run('currentTownWanderer');
  if(visitor){expected=[...expected];expected.splice(expected.indexOf('sell items'),0,'talk to '+visitor.toLowerCase());}
 }
 const rows=read('GraphicalUI.choices()');
 assert.deepEqual(rows.map(row=>row.command),expected);
 assert.deepEqual(rows.map(row=>row.key),expected.map((action,index)=>action==='back'?'b':String(index+1)));
 assert(rows.every(row=>row.id.startsWith(screen+':')));
 assert.equal(new Set(rows.map(row=>row.id)).size,expected.length);
 const text=run("screen.children.filter(row=>row.classList.contains('ui-choice-output')).at(-1).textContent").toLowerCase().replace('jen holloway','jen');
 assert.deepEqual(text.split(/ {2,}/).map(label=>label.replace(/^(?:\[\d+\]|\(b\)) /,'').split(' — ')[0].replace(/^talk jen$/,'small talk jen')),expected);
}
(async()=>{
 assert(!scripts.includes('playtest/runtime/jen_work_menu.js'));
 assert.equal(scripts.filter(script=>script.endsWith('/jen_work_menu.js')).length,1);
 assert(scripts.indexOf('devtest/runtime/menu_model.js')<scripts.indexOf('devtest/runtime/jen_work_menu.js'));
 await flush();
 run("resetPlayer();stage='mercy';mercyLocation='town';player.flags.mercyDiscovered=true;lanternMigrate();player.bolts=1999;");
 for(const mode of ['classic','graphics']){
  run(`GraphicalUI.setMode('${mode}');player.bolts=1999;player.flags.rustyRoomOwned=false;`);
  if(run("player.flags.solaceMenu==='town'")){await command('shops');await command('the rusty lantern');}else await command('bar');check(bar,'rusty-lantern');
  assert(run('player.flags.visited_jen'));
  assert.equal(run('GraphicalUI.active()'),mode==='graphics');
  if(mode==='classic')await command('j');
  else {assert.equal(await run("GraphicalUI.dispatch(GraphicalUI.choices().find(row=>row.command==='small talk jen'))"),true);await flush();}
  check(dialogue,'jen-dialogue');
  await command('1');check(work,'jen-work');
  await command('4');check(dialogue,'jen-dialogue');
  await command('b');check(bar,'rusty-lantern');
  await command('1');assert.equal(run('mercyLocation'),'jenDrinks');
  await command('b');check(bar,'rusty-lantern');
  await command('t');assert.equal(run('mercyLocation'),'town');
  await command('shops');await command('the rusty lantern');check(bar,'rusty-lantern');
 }
 run('player.bolts=2000;showBarActions();');await flush();
 check([...bar.slice(0,2),'buy room',...bar.slice(2)],'rusty-lantern');
 await command('3');assert.equal(run('mercyLocation'),'jenRoom');assert.equal(run('player.bolts'),0);
 assert(run('player.flags.rustyRoomOwned'));
 await command('return');check([...bar.slice(0,2),'your room',...bar.slice(2)],'rusty-lantern');
 assert.equal(await run("GraphicalUI.dispatch(GraphicalUI.choices().find(row=>row.command==='your room'))"),true);await flush();
 assert.equal(run('mercyLocation'),'jenRoom');assert.equal(run('player.bolts'),0);
 await command('return');run("GraphicalUI.setMode('classic')");await command('3');
 assert.equal(run('mercyLocation'),'jenRoom');assert.equal(run('player.bolts'),0);
 run("GraphicalUI.setMode('graphics')");
 await command('return');
 run('player.hp=50;player.maxHp=100;player.bolts=100;');
 await command('1');await command('beer');
 assert.equal(run('player.hp'),55);assert.equal(run('player.bolts'),95);
 await command('b');
 run("Object.assign(player.flags,{jenQuest:'recovered',jenUnpaidTab:'active',r18ClaraMet:true,relayQuest:'ask',relayUnlocked:false});");
 await command('j');await command('1');
 check(["deliver jen's supply crate",work[0],'settle unpaid tab',work[1],work[2],'ask about daniel','ask about relay station',work[3]],'jen-work');
 run("player.flags.jenQuest='rescued';player.flags.jenFamiliarFace='active';player.flags.jenFamiliarFaceSeen=true;player.flags.r18FoodSeen={meat:true,fruit:true,vegetable:true};player.flags.r18Courier={phase:'initial',delivered:{}};r18CourierIssue('jen');npcTalk('jen');");await flush();
 const gated=read('GraphicalUI.choices().map(row=>row.command)');
 assert(gated.includes("deliver runner's token"));assert(!gated.includes("deliver jen's supply crate"));
 assert(gated.includes('tell jen about the familiar face'));assert(gated.includes('ask about wasteland stew'));
 assert(gated.includes('deliver jen letter'));
 await command('back to jen');await command('back');
 run("saveGame(1);player.bolts=0;loadGame(1);");await flush();
 assert.equal(run('player.bolts'),95);
 assert(run("player.flags.rustyRoomOwned&&player.flags.jenQuest==='rescued'"));
 console.log('PASS Rusty Lantern menu publication, Classic/Graphical command parity, room and drink accounting, navigation and quest gates');
})().catch(error=>{console.error(error);process.exitCode=1;});
