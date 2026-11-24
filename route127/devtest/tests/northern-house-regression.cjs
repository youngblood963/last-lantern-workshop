const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const create=require(process.env.ROUTE127_RELEASE?'./helpers/release_menu.cjs':'./helpers/menu_audit.cjs');
(async()=>{
 const game=create(),{run,flush,ctx,walk,buttons}=game;await flush();run(fs.readFileSync(path.join(__dirname,'support/northern_stress_profile.js'),'utf8'));run('NorthernStressFixture.prepare();GraphicalUI.active=()=>true;GraphicalUI.preferred="graphics";arriveHouse()');
 let commands=0,rounds=0,heals=0;const settle=async()=>{await flush();await run('outputQueue');await flush();};
 async function dismiss(){for(const d of walk(ctx.document.body).filter(n=>n.classList?.contains('r127-scenario-results'))){const b=d.querySelector('button');for(const f of b?.events.click||[])await f({currentTarget:b});}await settle();}
 const choices=()=>run('GraphicalUI.choices()');
 async function act(cmd){await dismiss();const c=choices().find(c=>c.command.toLowerCase()===cmd.toLowerCase()||c.key===cmd);assert(c,cmd+' not offered');await run('GraphicalUI.dispatch('+JSON.stringify(c)+')');commands++;await settle();}
 await settle();const bandages=run('findItem("Bandage").qty');await act('search bathroom cabinet');assert.equal(run('findItem("Bandage").qty'),bandages+1);await act('search bathroom cabinet');assert.equal(run('findItem("Bandage").qty'),bandages+1);await act('check fireplace');
 run('player.flags.houseQuest="active";arriveHouse()');await settle();await act('investigate occupation');assert(run('combatState?.source==="houseBoss"'));
 let seed=13579;ctx.Math.random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
 await act('attack');const saved=run('JSON.stringify({hp:player.hp,c:combatState,quest:player.flags.houseQuest})');run('v49RollingAutosave()');await run("loadGame('auto')");await settle();assert.equal(run('JSON.stringify({hp:player.hp,c:combatState,quest:player.flags.houseQuest})'),saved);
 while(run('!!combatState')&&rounds++<100){if(run('player.hp/player.maxHp<.6&&hasItem("Bandage")')){const enemy=run('JSON.stringify(combatState)');await act('use item');await act(choices().find(c=>/bandage/i.test(c.command)).key);assert.equal(run('JSON.stringify(combatState)'),enemy);heals++;}await act('attack');}
 assert(!run('combatState'));assert.equal(run('player.flags.houseQuest'),'cleared');assert.equal(run('stage'),'house');const xp=run('player.xp');await act('lift floorboard');assert(run('player.flags.houseOwned'));assert.equal(run('player.flags.houseQuest'),'done');assert.equal(run('player.xp'),xp+100);assert(!choices().some(c=>c.command==='lift floorboard'));
 const reward=run('JSON.stringify({xp:player.xp,bolts:player.bolts,pack:player.pack})');await run("handleCommand('lift floorboard')");await settle();assert.equal(run('JSON.stringify({xp:player.xp,bolts:player.bolts,pack:player.pack})'),reward);
 await act('open storage box');await settle();
 if(run('typeof SeaportRoomChest!=="undefined"&&SeaportRoomChest.isOpen()')){
  const click=async label=>{const b=buttons().find(b=>b.textContent===label||b.textContent.startsWith(label));assert(b,'Missing popup '+label);for(const f of b.events.click||[])await f({currentTarget:b,target:b,preventDefault(){}});await settle();};
  await click('Cloth');const input=walk(ctx.document.body).find(n=>n.tagName==='INPUT'&&n.getAttribute('aria-label')==='Quantity to transfer');assert(input);input.value='3';for(const f of input.events.input||[])await f({currentTarget:input,target:input});await click('DEPOSIT 3');assert.equal(run('findItem("Cloth").qty'),7);assert.equal(run('player.houseStorage.find(i=>i.name==="Cloth").qty'),3);assert(!run('findItem("Cloth")===player.houseStorage.find(i=>i.name==="Cloth")'));await click('X');
  run('v49RollingAutosave()');await run("loadGame('auto')");await settle();assert.equal(run('player.houseStorage.find(i=>i.name==="Cloth").qty'),3);assert.equal(run('findItem("Cloth").qty'),7);await act('open storage box');const storedRow=buttons().find(b=>b.textContent.startsWith('Cloth')&&b.textContent.endsWith('×3'));assert(storedRow);for(const f of storedRow.events.click||[])await f({currentTarget:storedRow,target:storedRow});await settle();await click('WITHDRAW 3');await click('X');
 }else{
  await act('deposit items');await act('deposit cloth');assert(!run('hasItem("Cloth")'));assert.equal(run('player.houseStorage.find(i=>i.name==="Cloth").qty'),10);await act('back');await act('withdraw items');await act('withdraw cloth');await act('back');await act('back');
 }
 assert.equal(run('stage'),'house');assert.equal(run('findItem("Cloth").qty'),10);assert.equal(run('player.houseStorage.length'),0);assert.equal(run('player.turns'),150);assert(run('player.flags.houseOwned&&player.flags.houseQuest==="done"'));
 console.log('PASS '+JSON.stringify({entry:process.env.ROUTE127_RELEASE?'PLAYTEST':'DEVTEST',commands,houseCombatCompleted:1,heals,cabinetOnce:true,claimOnce:true,combatReload:true,storageAccounting:true,ownedProgress:true}));
})().catch(e=>{console.error(e);process.exitCode=1});
