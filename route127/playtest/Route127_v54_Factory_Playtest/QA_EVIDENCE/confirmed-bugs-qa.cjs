const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const gameDir=process.env.QA_GAME_DIR||path.join(__dirname,'..');
const el=()=>({addEventListener(){},classList:{add(){},remove(){},toggle(){}},childNodes:[{}],append(){},appendChild(){},querySelectorAll(){return []},style:{},dataset:{},focus(){}});
const storage=new Map();let now=100000,roll=.1;
const c=vm.createContext({console,document:{querySelector:el,createElement:el,createTextNode:el,body:el()},window:{ROUTE127_QA_BUILD:true},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setInterval:()=>1,clearInterval(){},setTimeout,clearTimeout,Date:class extends Date{static now(){return now}},Math:Object.assign(Object.create(Math),{random:()=>roll})});
let src=fs.readFileSync(path.join(gameDir,'app.js'),'utf8').replace(/startRefillTimer\(\);\s*titleScreen\(\);\s*$/,'');vm.runInContext(src,c);vm.runInContext(fs.readFileSync(path.join(gameDir,'casino.js'),'utf8'),c);vm.runInContext(fs.readFileSync(path.join(gameDir,'polish.js'),'utf8'),c);
vm.runInContext(fs.readFileSync(path.join(gameDir,'expansion.js'),'utf8'),c);
vm.runInContext(fs.readFileSync(path.join(gameDir,'factory.js'),'utf8'),c);
vm.runInContext(fs.readFileSync(path.join(gameDir,'crime.js'),'utf8'),c);
vm.runInContext('add=(t)=>logs.push(t);addImmediate=add;queueChoiceLine=(t)=>{currentHotkeys={};numberedChoices={};hotkeyLine(t);logs.push(t)};updateHud=()=>{};resultLine=add;startRefillTimer=()=>{};redrawState=()=>{};showSolaceContext=()=>{};showCurrentContext=()=>{};completeRoadTurn=()=>{stage="turnComplete"};v49LiveMap=()=>{};renderCurrentChoices=()=>{};',c);c.logs=[];
function run(s){return vm.runInContext(s,c)}
function reset(){storage.clear();now=100000;roll=.1;c.logs.length=0;run(`stage='factoryWorkshop';player.flags={interfaceUnlocked:true};player.wandererState={};player.vendorSold=[];player.vendorStock=null;player.pack=[];player.packMax=8;player.bolts=100;player.turns=50;player.hp=40;activeSaveSlot=1;mercyLocation='murphy';currentHotkeys={};numberedChoices={};currentRoadWanderer=null;currentTownWanderer=null;townWandererFocus=null;pendingTownFight=null;combatState=null;player.level=3;player.maxHp=100;player.xp=0;player.nextXp=100;day=1;`)}
const results=[];function test(name,fn){reset();try{fn();results.push({name,pass:true})}catch(e){results.push({name,pass:false,error:e.message})}}
function eq(code,value){assert.deepStrictEqual(JSON.parse(JSON.stringify(run(code))),value)}
function tutorial(){run(`v49Terminal();v49Forge();v49Workbench();v49FactoryCommand('i')`)}
function murphy(key='bandage'){run(`stage='mercy';player.flags.v49RecipeBandage=true;player.pack=[{name:'Cloth',type:'material',qty:4},{name:'Scrap Metal',type:'material',qty:4}];v49MurphyRecipe('${key}');v49MurphyCommand('i')`)}


function june(){run(`stage='wandererRoad';currentRoadWanderer='June';v50Profile(wandererByName('June')).stock.forEach(i=>i.qty=3);ws('June').v52EncounterSerial=1;`)}
test('first trade purchase keeps shared quantities equal',()=>{june();run(`v50Trade(wandererByName('June'));v50TradeCommand('buy bandage')`);eq(`v52Inventory(wandererByName('June')).items.find(i=>i.name==='Cloth').qty`,3);eq(`v52Inventory(wandererByName('June')).items.find(i=>i.name==='Bandage').qty`,2)});
test('sale transfers item and NPC payment',()=>{june();run(`v52Inventory(wandererByName('June'));addPack('Wire','material');v50Trade(wandererByName('June'))`);const before=run(`v52Inventory(wandererByName('June')).bolts`);run(`v50TradeCommand('sell wire');v50TradeCommand('confirm sale')`);eq(`v52Inventory(wandererByName('June')).bolts`,before-3);eq(`v52Inventory(wandererByName('June')).items.find(i=>i.name==='Wire')?.qty`,1)});
test('blocked town attack cannot generate bounty',()=>{june();run(`stage='mercy';currentTownWanderer='June';pendingTownFight='June';player.turns=0;handleTownWanderer('confirm fight')`);eq('v52Crime().bounty',0)});
test('uppercase combat victim still records murder',()=>{june();run(`stage='mercy';currentTownWanderer='June';pendingTownFight='June';handleTownWanderer('confirm fight');combatState.hp=1;handleCombat('attack')`);eq(`v52Crime().history.map(i=>i.type)`,['Assault','Murder'])});
test('stale town target cannot criminalize road kill',()=>{june();run(`player.flags.v52TownFightTarget='June';v50WandererLoot('June')`);eq('v52Crime().bounty',0)});
test('trade menu allows inspect without trapping command',()=>{june();run(`v50Trade(wandererByName('June'));handleRoadWanderer('inspect')`);assert(c.logs.some(s=>s.includes('relative threat')))});
console.log(JSON.stringify(results,null,2));fs.writeFileSync(process.argv[2]||path.join(gameDir,'QA_EVIDENCE','confirmed-bugs-results.json'),JSON.stringify(results,null,2));process.exitCode=results.some(r=>!r.pass)?1:0;
