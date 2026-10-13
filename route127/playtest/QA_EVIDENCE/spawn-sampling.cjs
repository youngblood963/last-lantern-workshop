const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const gameDir=process.env.QA_GAME_DIR||path.join(__dirname,'..');
const el=()=>({addEventListener(){},classList:{add(){},remove(){},toggle(){}},childNodes:[{}],append(){},appendChild(){},querySelectorAll(){return []},style:{},dataset:{},focus(){}});
const storage=new Map();let now=100000,roll=.1;
const nodes={};const shell=el();const header=nodes['.terminal-header']=el();header.parentElement=shell;header.insertAdjacentElement=(pos,e)=>{nodes['#'+e.id]=e;e.parentElement=shell};
const c=vm.createContext({nodes,console,document:{querySelector:s=>s==='#v52-wanted'?nodes[s]||null:nodes[s]||(nodes[s]=el()),createElement:el,createTextNode:el,body:el()},window:{ROUTE127_QA_BUILD:true},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setInterval:()=>1,clearInterval(){},setTimeout,clearTimeout,Date:class extends Date{static now(){return now}},Math:Object.assign(Object.create(Math),{random:()=>c.randoms?.length?c.randoms.shift():roll})});
let src=fs.readFileSync(path.join(gameDir,'app.js'),'utf8').replace(/startRefillTimer\(\);\s*titleScreen\(\);\s*$/,'');vm.runInContext(src,c);vm.runInContext(fs.readFileSync(path.join(gameDir,'casino.js'),'utf8'),c);vm.runInContext(fs.readFileSync(path.join(gameDir,'polish.js'),'utf8'),c);
vm.runInContext(fs.readFileSync(path.join(gameDir,'expansion.js'),'utf8'),c);
vm.runInContext(fs.readFileSync(path.join(gameDir,'crime.js'),'utf8'),c);

vm.runInContext('const auditedHud=updateHud;',c);
vm.runInContext(`add=(t,cls='')=>{if(cls.includes('place')||(!cls.includes('system')&&t)){currentHotkeys={};numberedChoices={}}if(cls.includes('system'))t=renderNumberedChoices(t);logs.push(t)};addImmediate=(t)=>logs.push(t);queueChoiceLine=(t)=>{currentHotkeys={};numberedChoices={};hotkeyLine(t);logs.push(t)};updateHud=()=>{};resultLine=add;startRefillTimer=()=>{};redrawState=()=>{};v49LiveMap=()=>{};`,c);c.logs=[];
vm.runInContext(fs.readFileSync(path.join(gameDir,'consolidation.js'),'utf8'),c);
function run(s){return vm.runInContext(s,c)}
function reset(){storage.clear();now=100000;roll=.1;c.randoms=[];c.logs.length=0;run(`stage='factoryWorkshop';player.flags={interfaceUnlocked:true};player.wandererState={};player.vendorSold=[];player.vendorStock=null;player.pack=[];player.packMax=8;player.bolts=100;player.turns=50;player.hp=40;activeSaveSlot=1;mercyLocation='murphy';currentHotkeys={};numberedChoices={};currentRoadWanderer=null;currentTownWanderer=null;townWandererFocus=null;pendingTownFight=null;combatState=null;busy=false;player.level=3;player.maxHp=100;player.xp=0;player.nextXp=100;day=1;`)}

function eq(code,value){const x=run(code);assert.deepStrictEqual(x===undefined?undefined:JSON.parse(JSON.stringify(x)),value)}
function tutorial(){run(`v49Terminal();v49Forge();v49Workbench();v49FactoryCommand('i')`)}
function murphy(key='bandage'){run(`stage='mercy';player.flags.v49RecipeBandage=true;player.pack=[{name:'Cloth',type:'material',qty:4},{name:'Scrap Metal',type:'material',qty:4}];v49MurphyRecipe('${key}');v49MurphyCommand('i')`)}



let seed=12753;function rng(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
c.samplingRng=rng;run('Math.random=()=>samplingRng()');run('add=()=>{};addImmediate=()=>{};showWanderer=()=>{};outputQueue=Promise.resolve()');
const N=100000,counts={town:{},early:{},east:{}};let occupied=0;
for(let i=0;i<N;i++){run('player.wandererState={};wandererSerial=0;wandererLocations=rollWandererLocations();showWanderersAt("mercy")');const name=run('currentTownWanderer');if(name){occupied++;counts.town[name]=(counts.town[name]||0)+1}}
for(const road of ['early','east']){run(`roadGoal='${road==='east'?'east':'mercy'}';player.wandererState={};wandererSerial=0;`);for(let i=0;i<N;i++){run('showRoadWanderer()');const name=run('currentRoadWanderer');counts[road][name]=(counts[road][name]||0)+1;}}
let cooldown=0,spawns=0,eligible=0;for(let i=0;i<N;i++){if(cooldown>0)cooldown--;else{eligible++;if(rng()<.30){cooldown=2;spawns++}}}
run('player.wandererState={};wandererLocations=rollWandererLocations();markWandererDead("Rook")');let resurrected=false;for(let i=0;i<10000;i++){run('moveWanderers()');if(run('wandererAlive(wandererByName("Rook"))'))resurrected=true}
const report={seed:12753,samplesPerScenario:N,townOccupied:occupied,townObservedPercent:occupied/N*100,counts,roadGate:{samples:N,eligibleRolls:eligible,spawns,observedPercent:spawns/N*100},rookResurrectedAfter10000Moves:resurrected,note:'Seeded controlled sampling; excludes quest/Steve gates for the isolated road gate. Source rates unchanged.'};
fs.writeFileSync(path.join(gameDir,'QA_EVIDENCE','spawn-sampling.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
