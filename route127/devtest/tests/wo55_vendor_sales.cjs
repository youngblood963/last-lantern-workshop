const assert = require('node:assert/strict');
const createGame = require('./helpers/wo33_dom.cjs');

(async()=>{
 const {run,flush}=createGame();
 await flush();
 run(`
  player.handle='vendor fixture';
  player.flags.interfaceUnlocked=true;
  stage='mercy';mercyLocation='mara';activeSaveSlot=0;
  player.pack=[
   {name:'Harbor Guard Cutlass',type:'weapon',qty:1},
   {name:'Crab Meat',type:'material',qty:4},
   {name:'Raw Rat Meat',type:'material',qty:1},
   {name:'Scrap Metal',type:'material',qty:1},
   {name:'Reinforced Jacket',type:'armor',qty:1},
   {name:'Old World Pocket Compass',type:'valuable',qty:1},
   {name:'Crab Meat',type:'quest',qty:1}
  ];
  player.weapon=null;player.armor=null;
  const amounts=player.pack.map(v48SellPrice);
  const startingBolts=player.bolts;
  v48SaleMenu();
 `);
 await flush();
 assert.equal(run('amounts[0]'),run("Math.floor(Economy.value('Harbor Guard Cutlass')*.08)"));
 assert.ok(run('amounts.slice(0,6).every(price=>price>0)&&amounts[6]===0'));
 assert.ok(run(`Object.values(numberedChoices).some(cmd=>cmd.startsWith('sell harbor guard cutlass'))`));
 assert.ok(run(`Object.values(numberedChoices).some(cmd=>cmd.startsWith('sell crab meat'))`));

 run(`player.weapon='Harbor Guard Cutlass'`);
 assert.equal(run('v48SellPrice(player.pack[0])'),0);
 run(`player.weapon=null;v53SaleStart('Harbor Guard Cutlass')`);
 assert.equal(run('player.bolts'),run('startingBolts'));
 run(`v53SaleCommand('confirm sale');v53SaleCommand('confirm sale')`);
 assert.equal(run('player.bolts-startingBolts'),run('amounts[0]'));
 assert.equal(run(`player.pack.some(item=>item.name==='Harbor Guard Cutlass')`),false);

// Single ordinary items should sell directly, without opening quantity menus.
// This covers a basic tool and consumable, including a legacy string quantity.
 run(`player.pack.push({name:'Battered Flashlight',type:'tool',qty:1});`);
 const flashlightPrice=run(`v48SellPrice(player.pack.find(i=>i.name==='Battered Flashlight'))`);
 assert.ok(flashlightPrice>0);
 const flashlightBefore=run('player.bolts');
 run(`v53SaleStart('Battered Flashlight')`);
 assert.equal(run('player.bolts'),flashlightBefore+flashlightPrice);
 assert.equal(run(`player.pack.some(i=>i.name==='Battered Flashlight')`),false);
 assert.equal(run('!!player.flags.v53Sale'),false);

 run(`player.pack.push({name:'Tent',type:'consumable',qty:'1'});`);
 const tentPrice=run(`v48SellPrice(player.pack.find(i=>i.name==='Tent'))`);
 assert.ok(tentPrice>0);
 const tentBefore=run('player.bolts');
 run(`v53SaleStart('Tent')`);
 assert.equal(run('player.bolts'),tentBefore+tentPrice);
 assert.equal(run(`player.pack.some(i=>i.name==='Tent')`),false);
 assert.equal(run('!!player.flags.v53Sale'),false);


 run(`v53SaleStart('Crab Meat');v53SaleCommand('sell 2');v53SaleCommand('confirm sale')`);
 assert.equal(run('player.bolts-startingBolts'),run('amounts[0]+2*amounts[1]'));
 assert.equal(run(`player.pack.find(item=>item.name==='Crab Meat').qty`),2);
 run(`loadGame('auto')`);
 await flush();
 assert.equal(run('player.bolts-startingBolts'),run('amounts[0]+2*amounts[1]'));
 assert.equal(run(`player.pack.find(item=>item.name==='Crab Meat').qty`),2);
 assert.equal(run(`player.pack.find(item=>item.type==='quest').qty`),1);
 console.log('PASS Solace sell list, protected items, rare confirmation, partial sale, duplicate confirmation and reload');
})().catch(error=>{console.error(error);process.exitCode=1;});
