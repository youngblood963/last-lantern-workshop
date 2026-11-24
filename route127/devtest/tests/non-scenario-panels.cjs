/* Actual DEVTEST overlay buttons and their native callbacks; no service calls. */
const assert=require('node:assert/strict'),create=require('./helpers/menu_audit.cjs');
(async()=>{
 const game=create(),{run,flush,buttons}=game;await flush();
 const settle=async()=>{await flush();await Promise.resolve();await flush();};
 const click=async(label,exact=true)=>{const b=buttons().find(b=>exact?b.textContent===label:b.textContent.includes(label));assert(b,'Missing button '+label);for(const fn of b.events.click||[])await fn({currentTarget:b,target:b,preventDefault(){},stopPropagation(){}});await settle();};
 const seed=()=>run(`resetPlayer();player.handle='Panel Auditor';player.level=10;player.hp=50;player.maxHp=100;player.turns=100;player.bolts=0;player.packMax=20;player.pack=[{name:'Energy Bars',type:'consumable',qty:2},{name:'Cloth',type:'material',qty:2},{name:'Battered Flashlight',type:'tool',qty:1}];player.flags.interfaceUnlocked=true;player.flags.mercyDiscovered=true;player.flags.murphyRideLevel10Astrid=true;lanternMigrate();lanternState().nodeId='solace';lanternState().currentEdgeId=null;stage='mercy';mercyLocation='town';busy=false;commandProcessing=false;GraphicalUI.active=()=>true;GraphicalUI.preferred='graphics';mercyMenu();`);
 seed();await settle();const parent=run('JSON.stringify(GraphicalUI.choices())');
 await run("handleCommand('inventory')");await settle();assert(run('!!TravelerPanels.dialog'));
 await click('Energy Bars',false);await click('Use');assert(run('player.hp>50'));assert.equal(run("findItem('Energy Bars').qty"),1);
 await click('Cloth',false);await click('Drop');await click('Cancel');assert.equal(run("findItem('Cloth').qty"),2);
 await click('X');assert.equal(run('stage'),'mercy');assert.equal(run('mercyLocation'),'town');assert.equal(run('JSON.stringify(GraphicalUI.choices())'),parent);
 await run("handleCommand('status')");await settle();assert(run('!!TravelerPanels.dialog'));await click('X');assert.equal(run('stage'),'mercy');
 await run("handleCommand('quests')");await settle();assert(run('!!TravelerPanels.dialog'));await click('Completed');await click('Active');await click('X');assert.equal(run('stage'),'mercy');
 run("TravelerPanels.open('options')");await settle();assert(run('!!TravelerPanels.dialog'));assert(!buttons().some(b=>b.textContent==='Close'),'Duplicate Options Close and X');assert(buttons().some(b=>b.textContent==='X'));
 await click('Workshop Feedback');assert(!run('!!TravelerPanels.dialog'));assert(run("document.body.textContent.includes('Workshop Feedback')"));run('Route127Community.close()');await settle();assert.equal(run('stage'),'mercy');
 run("TravelerPanels.open('menu')");await settle();assert(!buttons().some(b=>b.textContent==='Close'));await click('X');assert.equal(run('stage'),'mercy');assert.equal(run('mercyLocation'),'town');
 const mapTurns=run('player.turns');await run("handleCommand('map')");await settle();assert(run('!!Route127MapOverlay.dialog'));await click('X');assert(!run('!!Route127MapOverlay.dialog'));assert.equal(run('stage'),'mercy');assert.equal(run('player.turns'),mapTurns);assert.equal(run('mercyLocation'),'town');
 // A room action and chest must preserve the real parent location, controls and turns.
 run("stage='mercy';mercyLocation='jenRoom';player.flags.rustyRoomOwned=true;renderCurrentChoices();");await settle();
 const roomTurns=run('player.turns');await run("handleCommand('look around')");await settle();assert.equal(run('mercyLocation'),'jenRoom');
 await run("GraphicalUI.dispatch(GraphicalUI.choices().find(c=>c.command==='chest'))");await settle();assert(run('SeaportRoomChest.isOpen()'));assert.equal(run('mercyLocation'),'jenRoom');await click('X');assert(!run('SeaportRoomChest.isOpen()'));assert.equal(run('mercyLocation'),'jenRoom');assert.equal(run('player.turns'),roomTurns);assert.equal(run('GraphicalUI.choices().length'),4);
 // Existing focused numeric entry cancellation is the real pending bank transaction.
 run("player.bolts=25;stage='mercy';mercyLocation='amii';bankMenu();");await settle();
 await run("handleCommand('deposit bolts')");await settle();await run("handleCommand('custom amount')");await settle();
 assert(run('!!FocusedEntry.dialog'));assert(buttons().some(b=>b.textContent==='Cancel'));assert(!buttons().some(b=>b.textContent==='X'),'Duplicate entry X and Cancel');await click('Cancel');assert(!run('!!FocusedEntry.dialog'));
 await run("player.bolts=0;handleCommand('custom amount')");await settle();await run("FocusedEntry.pendingCancellation");await settle();assert(!run('!!FocusedEntry.dialog'));assert(!run('!!player.flags.v49BankCustom'));assert(run("menuAuditMessages.some(t=>t.includes('available: 0'))"));
 // Workbench is the existing interactive overlay, not a replacement mock.
 run("stage='r11Craft';player.flags.r11Bench='murphy';player.flags.v49RecipeBandage=true;player.flags.r11Learned={bandage:true};r11CraftMenu('murphy');");await settle();
 await run("GraphicalUI.dispatch(GraphicalUI.choices().find(c=>c.command==='r127 bench craft'))");await settle();assert(run("!!document.body.querySelector('.r127-bench-panel')"));
 await click('Upgrade');await click('Modify');await click('Craft');await click('Close');assert(!run("!!document.body.querySelector('.r127-bench-panel')"));assert.equal(run('stage'),'r11Craft');
 console.log('PASS: Backpack inspect/use/drop cancel and parent restore; Character/Journal; Options single close + feedback; numeric entry single Cancel; Craft/Upgrade/Modify overlay navigation');
})().catch(e=>{console.error(e);process.exitCode=1;});
