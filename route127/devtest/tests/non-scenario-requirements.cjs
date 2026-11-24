/* Requirement failures and successful native transactions, using the real engine. */
const assert=require('node:assert/strict'),create=require('./helpers/menu_audit.cjs');
(async()=>{
 const {run,flush}=create();await flush();
 const reset=()=>run(`resetPlayer();player.handle='Requirements Auditor';player.level=50;player.turns=100;player.bolts=0;player.packMax=50;player.pack=[];player.flags.v49RecipeBandage=true;player.flags.r11Learned={bandage:true};player.flags.r11Bench='murphy';stage='r11Craft';menuAuditMessages=[];`);
 for(const partial of [false,true]){
  reset();if(partial)run("player.pack=[{name:'Cloth',type:'material',qty:1}];");
  const prior=run('JSON.stringify([player.pack,player.bolts,player.turns])');
  run("r11CraftCommand('craft reinforced bandage');r11CraftCommand('craft 1')");await flush();
  assert.equal(run('JSON.stringify([player.pack,player.bolts,player.turns])'),prior);
  assert(run(`menuAuditMessages.some(t=>t.includes('Cloth (need 2, have ${partial?1:0})')&&t.includes('Scrap Metal (need 1, have 0)'))`));
  assert.equal(run('stage'),'r11Craft');assert(!run('!!player.flags.v49MurphyJob'));assert(run('GraphicalUI.choices().some(c=>c.command===\'back\')'));
 }
 reset();run("player.pack=[{name:'Cloth',type:'material',qty:2},{name:'Scrap Metal',type:'material',qty:1}];player.bolts=0;r11CraftCommand('craft reinforced bandage');r11CraftCommand('craft 1')");await flush();
 assert.equal(run('player.pack.length'),0);assert.equal(run('player.bolts'),0);assert.equal(run('player.turns'),100);assert.equal(run('player.flags.v49MurphyJob.key'),'bandage');
 // A real trader's native stock/price/transfer, with absent, partial and exact funds.
 for(const funds of ['none','partial','exact']){
  reset();run("currentRoadWanderer=wanderers.find(w=>wandererAlive(w)&&!v50Profile(w).hostile).name;stage='wandererRoad';globalThis.auditTrader=wandererByName(currentRoadWanderer);v50Trade(auditTrader);globalThis.auditStock=v50Profile(auditTrader).stock[0];globalThis.auditPrice=auditStock.price;globalThis.auditQty=auditStock.qty;");
  run(`player.bolts=${funds==='none'?'0':funds==='partial'?'auditPrice-1':'auditPrice'};menuAuditMessages=[];`);
  await run("handleCommand('buy '+auditStock.name.toLowerCase())");await flush();
  if(funds==='exact'){assert.equal(run('v50Profile(auditTrader).stock.find(i=>i.name===auditStock.name).qty'),run('auditQty-1'));assert.equal(run('player.bolts'),0);assert(run('player.pack.some(i=>i.name===auditStock.name)'));}
  else{assert.equal(run('v50Profile(auditTrader).stock.find(i=>i.name===auditStock.name).qty'),run('auditQty'));assert.equal(run('player.pack.length'),0);assert(run("menuAuditMessages.some(t=>t.includes('Required: '+auditPrice+' Bolts. Available: '+player.bolts+' Bolts.'))"));assert(run("GraphicalUI.choices().some(c=>c.command.startsWith('buy '))"));}
 }
 reset();run("EquipmentMods.purchase('serrated',3,'Small Animal Bones')");assert(run("menuAuditMessages.some(t=>t.includes('Required: 3 Small Animal Bones. Available: 0 Small Animal Bones.'))"));assert(!run("EquipmentMods.learned('serrated')"));
 run("player.pack=[{name:'Small Animal Bones',type:'material',qty:3}];EquipmentMods.purchase('serrated',3,'Small Animal Bones')");assert(run("EquipmentMods.learned('serrated')"));assert.equal(run("r6MaterialCount('Small Animal Bones')"),0);
 // Canonical consumable water and the approved legacy material name share the
 // same requirement contract; similarly named objects of the wrong type do not.
 reset();run("player.pack=[{name:'Clean Water',type:'consumable',qty:1},{name:'Water',type:'material',qty:1},{name:'Water',type:'quest',qty:5},{name:'Clean Water',type:'tool',qty:5}]");assert.equal(run("r6MaterialCount('Clean Water')"),2);
 assert.equal(run("r6ConsumeMaterial('Clean Water',3)"),false);assert.equal(run("r6MaterialCount('Clean Water')"),2);
 assert.equal(run("r6ConsumeMaterial('Clean Water',2)"),true);assert.equal(run("r6MaterialCount('Clean Water')"),0);assert.equal(run('player.pack.length'),2);
 for(const legacy of [false,true]){
  reset();run(`player.weapon='Claw Hammer';player.flags.modBlueprints={poison:true};player.pack=[{name:'Animal Bones',type:'material',qty:2},{name:'Scrap Metal',type:'material',qty:1},{name:${legacy?"'Water'":"'Clean Water'"},type:${legacy?"'material'":"'consumable'"},qty:1}];globalThis.auditModResult=EquipmentMods.install({name:player.weapon,kind:'weapon',equipped:true},'poison')`);
  assert.equal(run('auditModResult'),'Poison installed.');assert.equal(run('EquipmentMods.installed(player.weapon)'),'poison');assert.equal(run('player.pack.length'),0);assert.equal(run('player.turns'),100);
 }
 console.log('PASS: absent/partial/sufficient native crafting and trader transactions; blueprint material purchase; canonical/legacy water type and quantity checks; no failed-action consumption');
})().catch(e=>{console.error(e);process.exitCode=1;});
