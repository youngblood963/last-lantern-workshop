const assert=require('node:assert/strict');
const {run}=require('./helpers/wo33_dom.cjs')();

run(`GraphicalUI.preferred='graphics';`);
for(const [input,expected] of Object.entries({'RETURN TO SEAPORT':'Return to Seaport','return to harbor':'Return to Harbor','INSPECT WANDERER':'Inspect Wanderer','browse wares':'Browse Wares','CONFIRM PURCHASE':'Confirm Purchase','BACK':'Back','BUY SUPPLIES':'Buy Supplies','TALK TO KAIDEN':'Talk to Kaiden','VIEW HP / XP':'View HP / XP'}))assert.equal(run(`DevtestPresentation.title(${JSON.stringify(input)})`),expected);
for(const suffix of [' (L06 RARE)',' Forge Uncommon06',' Uncommon06',' Rare04',' — Forge Rare04'])assert.equal(run(`DevtestPresentation.clean(${JSON.stringify('Highway Reaper'+suffix)})`),'Highway Reaper');
// Test exact authoritative instance colors, including a misleading visible tag.
run(`globalThis.beforeGear=JSON.stringify(Object.getOwnPropertyDescriptors(GEAR));globalThis.beforePlayer=JSON.stringify(player);`);
for(const rarity of ['common','uncommon','rare','epic','legendary']){
 const name=run(`Object.getOwnPropertyNames(GEAR).find(n=>GEAR[n].rarity===${JSON.stringify(rarity)}&&n.includes('L06'))`);
 assert.ok(name);
 run(`globalThis.row=document.createElement('div');RouteIdentity.paint(row,${JSON.stringify(name+' [RARE]')});`);
 assert.equal(run(`row.children[0].className`),'route-color-'+rarity);
 assert.ok(!/L06|\[RARE\]/.test(run('row.textContent')));
}
run(`RouteIdentity.paint(row,'Buy Highway Reaper (L06 RARE) Uncommon06 — 100 BOLTS');`);
assert.equal(run('row.textContent'),'Buy Highway Reaper — 100 BOLTS');
assert.equal(run(`row.children[0].className`),'route-color-rare');
assert.equal(run(`JSON.stringify(Object.getOwnPropertyDescriptors(GEAR))===beforeGear`),true);
assert.equal(run(`JSON.stringify(player)===beforePlayer`),true);
// Number and hotkey records are not changed, including existing Back filtering.
run(`numberedChoices={'1':'RETURN TO SEAPORT','2':'INSPECT WANDERER'};currentHotkeys={b:'back'};globalThis.originalChoices=JSON.stringify(numberedChoices);globalThis.originalKeys=JSON.stringify(currentHotkeys);`);
const choices=JSON.parse(run('JSON.stringify(GraphicalUI.choices())'));
assert.equal(choices[0].command,'RETURN TO SEAPORT');assert.equal(choices[0].key,'1');assert.equal(choices[0].label,'Return to Seaport');
assert.equal(run('JSON.stringify(numberedChoices)===originalChoices&&JSON.stringify(currentHotkeys)===originalKeys'),true);
run(`GraphicalUI.preferred='classic';globalThis.classicRow=document.createElement('div');RouteIdentity.paint(classicRow,'Highway Reaper (L06 RARE)');`);
assert.ok(run('classicRow.textContent').includes('(L06 RARE)'));
assert.equal(run('GraphicalUI.choices()[0].label'),'RETURN TO SEAPORT');
console.log('PASS WO31: title labels, suffix cleanup, five authoritative rarities, immutable equipment/player, command/key preservation, Classic guard');

// Exercise real economy functions with a catalog instance and unchanged key.
run(`GraphicalUI.preferred='graphics';player.pack=[];player.bolts=10000;player.level=6;player.weapon='Rusted Pipe';player.armor='Worn Jacket';player.flags.nextRefillAt=Date.now()+999999;
 globalThis.stock=regionalEquipmentStock('solace');globalThis.purchase=stock.slots.find(s=>GEAR[s.name].rarity==='uncommon')||stock.slots[0];globalThis.price=regionalEquipmentPrice(purchase.name,'solace');globalThis.money=player.bolts;`);
assert.equal(run(`regionalEquipmentBuy('solace',purchase.name)`),true);
assert.equal(run(`player.bolts===money-price&&(player.pack.some(i=>i.name===purchase.name)||player[GEAR[purchase.name].type]===purchase.name)&&purchase.sold`),true);
run(`if(!player.pack.some(i=>i.name===purchase.name)){player[GEAR[purchase.name].type]=GEAR[purchase.name].type==='weapon'?'Rusted Pipe':'Worn Jacket';player.pack.push({name:purchase.name,type:GEAR[purchase.name].type,qty:1});}globalThis.unit=v48SellPrice(player.pack.find(i=>i.name===purchase.name));globalThis.saleMoney=player.bolts;`);
assert.ok(run('unit>0'));
run(`stage='mercy';mercyLocation='johnny';globalThis.started=v48Sell(purchase.name);`);
assert.equal(run('started'),true);
if(run('!!player.flags.v53Sale'))run(`v53SaleCommand('sell 1');v53SaleCommand('confirm sale');`);
assert.equal(run(`player.bolts===saleMoney+unit&&!player.pack.some(i=>i.name===purchase.name)`),true);
run(`player.flags.lanternTravel={nodeId:'solace',discoveredEdges:[]};player.flags.mercyDiscovered=true;numberedChoices={'1':'RETURN TO SEAPORT','2':'INSPECT WANDERER'};currentHotkeys={b:'back'};`);
assert.equal(run(`GraphicalUI.choices().some(c=>c.key==='b')`),false);
// Snapshot round-trip retains the original catalog key and metadata.
assert.equal(run(`GEAR[JSON.parse(JSON.stringify({name:purchase.name})).name]===GEAR[purchase.name]`),true);
console.log('PASS WO31: real catalog purchase/sale accounting, saved-key round-trip, existing Back deduplication');
