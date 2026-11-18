const assert = require('node:assert/strict');
const {run,ctx} = require('./helpers/devtest.cjs')();
ctx.crypto = require('node:crypto');

async function main(){
 run(`outputQueue=Promise.resolve();updateHud=()=>{};refreshInterfaceShortcutLabels=()=>{};
  FocusedEntry.sync=()=>{};GraphicalUI.sync=()=>{};GraphicalUI.schedule=()=>{};
  GraphicalUI.preference=()=> 'graphics';GraphicalUI.active=()=>true;
  const saleLines67=[];
  add=(text)=>{saleLines67.push(String(text));};
  addImmediate=add;
  resetPlayer();player.handle='Vendor Tester';player.flags.interfaceUnlocked=true;
  player.flags.mercyDiscovered=true;lanternMigrate();
  lanternState().nodeId='solace';lanternState().solaceAdmitted=true;
  stage='mercy';mercyLocation='johnny';
  player.weapon=null;player.armor=null;
  player.pack=[
   {name:'Battered Flashlight',type:'tool',qty:1},
   {name:'Tent',type:'supply',qty:'1'},
   {name:'Crab Meat',type:'material',qty:'4'},
   {name:'Harbor Guard Cutlass',type:'weapon',qty:1}
  ];
  const prices67=player.pack.map(v48SellPrice);
  const bolts67=player.bolts;
  const epic67=Object.keys(GEAR).find(name=>GEAR[name].rarity==='epic'&&GEAR[name].type==='weapon'&&v48SellPrice({name,type:'weapon',qty:1})>0);
  const choice67=text=>GraphicalUI.choices().find(choice=>choice.command.startsWith(text));
  const snapshot67=()=>JSON.parse(JSON.stringify(saveSnapshot()));
  function reload67(snapshot){
   const read=getSaveData;
   getSaveData=slot=>slot==='auto'?snapshot:read(slot);
   try{loadGame('auto');}finally{getSaveData=read;}
  }
 `);
 const click=async command=>{
  assert.ok(run(`choice67(${JSON.stringify(command)})`), command);
  await run(`GraphicalUI.dispatch(choice67(${JSON.stringify(command)}))`);
  await run('outputQueue');
 };
 await run("handleCommand('sell items')");
 for(const [index,name] of ['Battered Flashlight','Tent'].entries()){
  const previous=run('player.bolts');
  run(`const selected67_${index}=choice67('sell ${name.toLowerCase()}');saleLines67.length=0;`);
  assert.ok(run(`selected67_${index}`));
  await run(`Promise.all([GraphicalUI.dispatch(selected67_${index}),GraphicalUI.dispatch(selected67_${index})])`);
  await run('outputQueue');
  assert.equal(run('player.flags.v53Sale'),undefined);
  assert.equal(run(`player.pack.some(item=>item.name===${JSON.stringify(name)})`),false);
  assert.equal(run('player.bolts')-previous,run(`prices67[${index}]`));
  assert.equal(run("saleLines67.filter(line=>line.startsWith('SOLD ')).length"),1);
  assert.equal(run("saleLines67.filter(line=>line.startsWith('SELL CARRIED ITEMS')).length"),1);
 }
 await click('sell crab meat');
 assert.equal(run('player.flags.v53Sale.mode'),'quantity');
 assert.ok(run("choice67('sell all')&&choice67('custom amount')"));
 await click('sell 1');
 await click('confirm sale');
 assert.equal(run("player.pack.find(item=>item.name==='Crab Meat').qty"),3);
 await click('sell harbor guard cutlass');
 assert.equal(run('player.flags.v53Sale.mode'),'confirm');
 assert.ok(run("choice67('confirm sale')&&!choice67('sell all')"));
 await click('confirm sale');
 run('reload67(snapshot67())');
 await run('outputQueue');
 assert.equal(run('player.bolts'),run('bolts67+prices67.reduce((sum,price)=>sum+price,0)'));
 assert.equal(run("player.pack.map(item=>item.name).join()"),'Crab Meat');
 for(const vendor of ['jen','wayne','mara']){
  run(`stage='mercy';mercyLocation='${vendor}';player.flags.v48Shop='sell';
   player.pack.push({name:'Scrap Metal',type:'material',qty:1});v48SaleMenu();`);
  await run('outputQueue');
  await click('sell scrap metal');
  assert.equal(run("player.pack.some(item=>item.name==='Scrap Metal')"),false,vendor);
 }
 run("mercyLocation='johnny';player.pack.push({name:'Scrap Metal',type:'material',qty:'1'});v48SaleMenu()");
 await run('outputQueue');
 await run("handleCommand('sell scrap metal')");
 assert.equal(run("player.pack.some(item=>item.name==='Scrap Metal')"),false);
 run(`player.pack.push({name:epic67,type:'weapon',qty:1});v48SaleMenu();`);
 await run('outputQueue');
 await click('sell '+run('epic67.toLowerCase()'));
 assert.equal(run('player.flags.v53Sale.mode'),'confirm');
 await click('cancel sale');
 assert.ok(run('player.pack.some(item=>item.name===epic67)'));
 run(`const merchant67=wanderers.find(w=>wandererAlive(w)&&!v50Profile(w).hostile);
  stage='wandererRoad';currentRoadWanderer=merchant67.name;
  delete player.flags.v48Shop;player.pack.push({name:'Tent',type:'supply',qty:1});
  v50Trade(merchant67);
 `);
 await run('outputQueue');
 await click('sell items');
 await click('sell tent');
 assert.equal(run("player.pack.some(item=>item.name==='Tent')"),false);
 assert.ok(run("choice67('sell crab meat')"));
 console.log('PASS WO67 graphical vendor sales, BBS, duplicate clicks, stacks, rare confirmation, and reload');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
