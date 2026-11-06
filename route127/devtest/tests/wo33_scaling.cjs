const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const create=require('./helpers/devtest.cjs');
const game=create(),{run}=game;
run(`let seed33=127;Math.random=()=>{seed33=(Math.imul(seed33,1664525)+1013904223)>>>0;return seed33/4294967296;};add=()=>{};updateHud=()=>{};renderCombatMenu=()=>{};RoadThreat.show=()=>{};`);
let checks=0;
for(let level=1;level<=50;level++)for(const region of ['NORTH','WEST','CENTRAL','INDUSTRIAL','LOWLANDS','EAST','SEAPORT']){
 const d=run(`WO33Combat.distribution(${level},'${region}')`);
 assert(Math.abs(d.reduce((n,x)=>n+x.probability,0)-1)<1e-12);
 for(const x of d){assert(x.level>=Math.max(1,level-3)&&x.level<=Math.min(50,level+3));checks++;}
}
assert.deepEqual(Array.from(run('WO33Combat.distribution(8).map(x=>x.probability)')),[.05,.1,.2,.3,.2,.1,.05]);
assert(Math.abs(run('WO33Combat.distribution(1)[0].probability')-.65)<1e-12);
assert(Math.abs(run('WO33Combat.distribution(50).at(-1).probability')-.65)<1e-12);
const sample=run(`(()=>{const counts=Array(7).fill(0);for(let i=0;i<100000;i++)counts[WO33Combat.sample(20,'CENTRAL')-17]++;return counts;})()`);
[.05,.1,.2,.3,.2,.1,.05].forEach((p,i)=>assert(Math.abs(sample[i]/100000-p)<.005));
assert(run(`WO33Combat.distribution(20,'NORTH').reduce((n,x)=>n+x.level*x.probability,0)<WO33Combat.distribution(20,'INDUSTRIAL').reduce((n,x)=>n+x.level*x.probability,0)`));
run(`player.level=8;const snapshot33=JSON.stringify({gear:GEAR,hp:HP_MILESTONES,xp:XP_V2_EARLY,heal:HEALING_ITEM_RATES,pools:R10_POOLS,weights:R10_WEIGHTS});`);
const defs=run('Object.values(combatSpecs)');
for(let level=1;level<=50;level++)for(const s of defs){
 const c=run(`player.level=${level};WO33Combat.normalize(${JSON.stringify(s)},'encounter')`);
 assert(c.level>=Math.max(1,level-3)&&c.level<=Math.min(50,level+3));
 assert(c.hp>0&&c.min>0&&c.max>=c.min);assert.equal(c.xp,s.xp);assert.equal(c.bolts,s.bolts);assert.equal(c.armorDef,s.armorDef);
 if(s.enemies){assert.equal(c.enemies.length,s.enemies.length);assert.equal(c.hp,c.enemies.reduce((n,e)=>n+e.hp,0));for(const e of c.enemies)assert.equal(e.level,c.level);}
 checks++;
}
assert(run('snapshot33===JSON.stringify({gear:GEAR,hp:HP_MILESTONES,xp:XP_V2_EARLY,heal:HEALING_ITEM_RATES,pools:R10_POOLS,weights:R10_WEIGHTS})'));
// Normalized stats depend on generated level and definition, never worn gear,
// actual HP, healing supplies or combat success.
assert(run(`(()=>{const s={name:'TEST',level:8,hp:80,min:3,max:7};const a=WO33Combat.normalize(s,'encounter',8);player.weapon='Rusted Pipe';player.armor='Worn Jacket';player.hp=1;player.pack=[];const b=WO33Combat.normalize(s,'encounter',8);return a.hp===b.hp&&a.min===b.min&&a.max===b.max;})()`));
for(const source of ['roadWanderer','townWanderer','serviceBoss','r18TournamentFight','r18StationFight','r11Elephant'])assert(run(`(()=>{const s={name:'SCRIPT',level:1,hp:1,min:0,max:1};return WO33Combat.normalize(s,'${source}')===s;})()`));
// Guard rejects installation outside the actual Devtest environment.
const source=fs.readFileSync(path.join(__dirname,'../runtime/enemy_scaling_wo33.js'),'utf8');
assert.throws(()=>vm.runInNewContext(source,{location:{pathname:'/route127/playtest/'},ROUTE127_ENV:{name:'PLAYTEST'}}),/requires Devtest/);
// Rewards are identical after the unchanged legacy reward/economy wrappers.
const old=create({skipScripts:['enemy_scaling_wo33.js','enemy_reward_compat_wo33.js']});
for(const instance of [game,old])instance.run("add=()=>{};updateHud=()=>{};RoadThreat.show=()=>{};Math.random=()=>.5;player.level=8;player.hp=282;player.maxHp=282;");
for(const spec of defs){const expr=`combatState=null;startCombat(${JSON.stringify(spec)},'encounter');JSON.stringify({xp:combatState.xp,bolts:combatState.bolts,enemies:combatState.enemies?.map(e=>e.bolts)})`;assert.equal(run(expr),old.run(expr),'reward changed: '+spec.name);}
for(let i=0;i<32;i++){
 const expr=`player.flags={};combatState=null;RoadScenarioRegistry.regionalCombatFight(RoadScenarioRegistry.regionalCombatExpansion[${i}]);JSON.stringify({xp:combatState.xp,bolts:combatState.bolts,enemies:combatState.enemies?.map(e=>e.bolts)})`;
 assert.equal(run(expr),old.run(expr),'regional rewards changed at '+i);
}
assert.equal(run('R10_WEIGHTS.combat'),.4);
// Night damage remains the engine's ceil(raw*1.25), and no pressure is added twice.
run(`player.armor='Worn Jacket';player.accessory=null;player.flags={};player.hp=player.maxHp=10000;player.level=8;Math.random=()=>.5;let dark33=false;isDark=()=>dark33;startCombat({name:'TEST',level:8,hp:80,min:3,max:7},'encounter');`);
const day=run('player.hp=10000;combatRetaliation(combatState);10000-player.hp');
const night=run('player.hp=10000;dark33=true;combatRetaliation(combatState);10000-player.hp');
assert(night>day);assert.equal(run('combatState.r18LevelPressure'),false);
// Role flags and armor survive; component groups preserve only one retaliation.
run(`player.level=8;dark33=false;const special33={name:'MACHINE',level:8,hp:90,min:4,max:8,armorDef:3,r18RoadEater:true,enemies:[{name:'CUTTING WHEEL',hp:30},{name:'HYDRAULICS',hp:30},{name:'CONTROL UNIT',hp:30}]};startCombat(special33,'encounter');`);
assert.equal(run('combatState.r18RoadEater'),true);assert.equal(run('combatState.armorDef'),3);assert.equal(run('combatState.enemies.length'),3);
const machineBefore=run('player.hp=10000;combatRetaliation(combatState);10000-player.hp');
const machineAfter=run("combatState.enemies.find(e=>e.name==='CUTTING WHEEL').hp=0;combatState.enemies.find(e=>e.name==='HYDRAULICS').hp=0;player.hp=10000;combatRetaliation(combatState);10000-player.hp");
assert(machineAfter<machineBefore,'destroyed components must weaken the machine');
run("player.hp=player.maxHp=10000;startCombat({name:'WARDEN 1',level:10,hp:150,min:5,max:10,armorDef:2,r18WardenId:1,r18Enforcer:true},'encounter');combatState.hp=combatState.maxHp=100000;");
const wardenArmor=run('combatState.armorDef');
run("handleCombat('attack');handleCombat('attack');handleCombat('attack');");
assert.equal(run('combatState.r18WardenAdapted'),true);assert.equal(run('combatState.armorDef'),wardenArmor+1);
const beforeStim=run('combatState.hp=Math.floor(combatState.maxHp*.39);combatState.hp');run('combatRetaliation(combatState)');
assert.equal(run('combatState.r18EnforcerStim'),true);assert(run('combatState.hp')>beforeStim);
// Lookout reinforcement conversion occurs exactly once at the existing level.
run(`startCombat(combatSpecs['GANG LOOKOUT'],'encounter');combatState.reinforcementsArrived=true;combatState.enemies=[{name:'GANG MEMBER A',hp:24,maxHp:24,bolts:4},{name:'GANG MEMBER B',hp:24,maxHp:24,bolts:4}];combatState.hp=combatState.maxHp=48;player.hp=10000;combatRetaliation(combatState);`);
assert(run('combatState.enemies.every(e=>e.level===combatState.level&&e.maxHp===e.hp)'));
const wave=run('JSON.stringify(combatState.enemies.map(e=>({hp:e.hp,min:e.r18Min,max:e.r18Max})))');run('combatRetaliation(combatState)');assert.equal(run('JSON.stringify(combatState.enemies.map(e=>({hp:e.hp,min:e.r18Min,max:e.r18Max})))'),wave);
// Strong attacks and durable bodies remain distinct; groups split one HP budget.
assert(run(`(()=>{const a=WO33Combat.normalize({name:'weak',level:8,hp:50,min:1,max:3},'encounter',8),b=WO33Combat.normalize({name:'strong',level:8,hp:130,min:6,max:10},'encounter',8);return b.hp>a.hp&&b.max>a.max;})()`));
console.log('PASS WO33: '+checks+' boundary/stat checks; 100k weighted samples; regions, rewards, exclusions, guards, immutable progression/equipment/healing/pools, night, components and reinforcement regression checks');
