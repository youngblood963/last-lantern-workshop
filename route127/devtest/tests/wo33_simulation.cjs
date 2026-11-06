// Seeded execution of the real loaded Devtest combat and healing handlers.
const fs=require('node:fs'),path=require('node:path');
const create=require('./helpers/devtest.cjs');
const baseline=process.argv.includes('--baseline'),count=Number(process.env.WO33_SAMPLES)||120;
const {run}=create({skipScripts:baseline?['enemy_scaling_wo33.js','enemy_reward_compat_wo33.js']:[]});
run(`
let wo33Seed=127,wo33Dark=false;
Math.random=()=>{wo33Seed=(Math.imul(wo33Seed,1664525)+1013904223)>>>0;return wo33Seed/4294967296;};
add=()=>{};addImmediate=()=>{};updateHud=()=>{};renderCombatMenu=()=>{};r5DirectChoices=()=>{};renderCurrentChoices=()=>{};v49Autosave=()=>{};
isDark=()=>wo33Dark;timePhase=()=>wo33Dark?'NIGHT':'DAY';
// Isolate each battle from progression/reward routing, without replacing attacks,
// retaliation, weapon generation, armor, damage, healing, or enemy mechanics.
gainXp=()=>{};gainBolts=()=>{};completeRoadTurn=()=>{stage='turnComplete';};
handlePlayerDeath=()=>{stage='fallen';combatState=null;};
factoryCombatWin=portCombatWin=portLiberationVictory=r18DepotCombatWin=r18AshVictory=r18RedVictory=()=>{stage='turnComplete';};
RoadThreat.show=()=>{};
const wo33Fixtures=[];
for(const [title,spec]of Object.entries(combatSpecs))wo33Fixtures.push({id:title,region:'NORTH',kind:'legacy',spec,source:'encounter'});
const wo33Seen=new Set(wo33Fixtures.map(f=>JSON.stringify(f.spec)));
for(const e of new Set([...encounters,...eastEncounters]))if(e.combat&&!wo33Seen.has(JSON.stringify(e.combat))){wo33Seen.add(JSON.stringify(e.combat));wo33Fixtures.push({id:e.title,region:e.title.startsWith('EAST ROAD')?'INDUSTRIAL':'SEAPORT',kind:'catalog',spec:e.combat,source:'encounter'});}
for(const d of RoadScenarioRegistry.regionalCombatExpansion)wo33Fixtures.push({id:d[0],region:d[1],kind:'regional',design:d});
for(let floor=0;floor<4;floor++)for(const name of FACTORY_ENEMIES[floor])wo33Fixtures.push({id:name+' / floor '+floor,region:'INDUSTRIAL',kind:'factory',source:'factoryFight',spec:{name,level:Math.max(3,floor+3),hp:30+floor*12,min:5+floor*2,max:9+floor*3,xp:42+floor*12,bolts:3+floor*2}});
for(const spec of FACTORY_BOSSES)wo33Fixtures.push({id:spec.name,region:'INDUSTRIAL',kind:spec.name==='THE FOREMAN'?'boss':'miniboss',spec,source:'factoryFight'});
wo33Fixtures.push({id:'COAST ROAD SCAVENGER',region:'SEAPORT',kind:'approach',source:'seaportRoadFight',spec:{name:'COAST ROAD SCAVENGER',level:7,hp:72,min:10,max:16,xp:100,bolts:13}},{id:'HARBOR SECURITY DRONE',region:'SEAPORT',kind:'approach',source:'seaportRoadFight',spec:{name:'HARBOR SECURITY DRONE',level:8,hp:92,min:12,max:19,xp:125,bolts:17}});
// These dynamic fixtures use the shipped entry functions/spec builders.
wo33Fixtures.push({id:'DOG PACK',region:'NORTH',kind:'dynamic',build:'dog'}, {id:'RAT PACK',region:'NORTH',kind:'dynamic',build:'rat'}, {id:'CINDER WOLF PACK',region:'INDUSTRIAL',kind:'dynamic',build:'wolf'});
for(const [title,command,kind]of [['THE ROAD EATER','fight the machine','boss'],['THE IRON HARVEST','fight the combine','boss'],['THE WARDEN','fight the warden','boss']])wo33Fixtures.push({id:title,region:'INDUSTRIAL',kind,build:'scene',title,command});
const originalEdge=lanternEdge;let wo33Region='NORTH';lanternEdge=()=>({primaryRegion:wo33Region});
function wo33Gear(level,rarity,type){let defs=EQUIPMENT_CATALOG.filter(d=>d.type===type&&d.rarity===rarity&&level>=d.minLevel&&level<=d.maxLevel);if(!defs.length)defs=EQUIPMENT_CATALOG.filter(d=>d.type===type&&d.rarity==='common'&&level>=d.minLevel&&level<=d.maxLevel);return catalogInstanceName(defs[Math.floor(Math.random()*defs.length)],level);}
function wo33Battle(f,level,profile,night,index){
 wo33Seed=(127+level*100003+index*997+wo33Fixtures.indexOf(f)*7919)>>>0;wo33Dark=night;wo33Region=f.region;
 const gearLevel=profile==='worn'?Math.max(1,level-5):level,rarity=profile==='strong'?'rare':'common';
 combatState=null;stage='between';player.level=level;player.flags={worldHour:night?22:10};player.accessory=null;player.weapon=wo33Gear(gearLevel,rarity,'weapon');player.armor=wo33Gear(gearLevel,rarity,'armor');syncLevelMaxHp();
 player.hp=Math.round(player.maxHp*(profile==='wounded'?.40:1));player.pack=[{name:'Bandage',qty:profile==='scarce'?0:profile==='wounded'?0:2,type:'consumable'},{name:'Energy Bars',qty:profile==='wounded'?0:2,type:'consumable'}];player.bolts=0;player.turns=100;player.encounterDone={};
 roadGoal=f.region==='NORTH'?'house':'east';
 if(f.design)RoadScenarioRegistry.regionalCombatFight(f.design);
 else if(f.build==='scene')encounters.find(e=>e.title===f.title).resolve(f.command);
 else if(f.build==='wolf')r18StartCinderWolves();
 else if(f.build){const h=Math.max(12,Math.floor(baseHpForLevel(level)*.14)),dog=f.build==='dog';startCombat({name:dog?'FERAL DOG PACK':'RAT PACK',level,hp:h*3,min:dog?4:3,max:dog?8:6,r18DogPack:dog,r18RatPack:!dog,enemies:(dog?['PACK LEADER','SCARRED DOG','YOUNG DOG']:['ALPHA RAT','SCAVENGER RAT','GNAWER RAT']).map((name,i)=>({name,hp:h,bolts:0,...(dog?{r18Min:3-i,r18Max:6-i}:{})}))},'encounter');}
 else startCombat(JSON.parse(JSON.stringify(f.spec)),f.source);
 const c=combatState;if(!c)throw Error('Fixture failed to enter combat: '+f.id);
 if(['boss','miniboss'].includes(f.kind)&&profile!=='wounded'&&profile!=='scarce')player.pack=[{name:'Bandage',qty:4,type:'consumable'}];
 const enemyLevel=c.level,enemyHp=c.maxHp,attack=[c.min,c.max],initial=player.hp;let turns=0,damage=0,inCombat=0,after=0;
 function heal(){const item=player.pack.find(i=>i.qty>0&&['Bandage','Energy Bars'].includes(i.name));if(!item)return false;const hp=player.hp;useItem(item.name);return player.hp>hp;}
 while(combatState&&stage==='combat'&&turns<150){
  if(player.hp<player.maxHp*.28&&!c.r18Bare&&heal()){inCombat++;continue;}
  const hp=player.hp;handleCombat('attack');damage+=Math.max(0,hp-player.hp);turns++;
 }
 const won=c.hp<=0&&player.hp>0;
 const remaining=player.hp;
 if(won)while(player.hp<player.maxHp*.8&&heal())after++;
 return {won,turns,damage:damage/player.maxHp,remaining:remaining/player.maxHp,inCombat,after,healing:inCombat+after,enemyLevel,enemyHp,attack,timedOut:turns>=150,recovered:player.hp/player.maxHp,initial:initial/player.maxHp};
}
`);
// Discover the actual Cinder wolf starter name rather than silently mocking it.
if(run("typeof r18StartCinderWolves")!=='function')throw Error('Cinder wolf fixture missing');
const levels=(process.env.WO33_LEVELS||'1,5,8,10,15,20,30,40,50').split(',').map(Number);
if(process.env.WO33_ONLY)run(`wo33Fixtures.splice(0,wo33Fixtures.length,...wo33Fixtures.filter(f=>new RegExp(${JSON.stringify(process.env.WO33_ONLY)}).test(f.id)))`);
const rows=[];
for(const level of levels){
 const results=run(`(()=>{const rows=[];for(const f of wo33Fixtures)for(const profile of ['common','worn','strong','scarce','wounded'])for(const night of [false,true]){const battles=[];for(let i=0;i<${count};i++)battles.push(wo33Battle(f,${level},profile,night,i));rows.push({level:${level},id:f.id,kind:f.kind,region:f.region,profile,night,battles});}return rows;})()`);
 rows.push(...results);process.stderr.write('simulated level '+level+'\n');
}
function summary(b){const n=b.length,avg=k=>b.reduce((s,x)=>s+x[k],0)/n,pct=(k,p)=>b.map(x=>x[k]).sort((a,b)=>a-b)[Math.min(n-1,Math.floor(n*p))];return {n,winRate:avg('won'),turns:avg('turns'),turnsP95:pct('turns',.95),damage:avg('damage'),damageP95:pct('damage',.95),healing:avg('healing'),healingP95:pct('healing',.95),inCombat:avg('inCombat'),after:avg('after'),maxHealing:Math.max(...b.map(x=>x.healing)),recoveryShortfall:b.filter(x=>x.won&&x.recovered<.8).length/n,timeouts:b.filter(x=>x.timedOut).length};}
const aggregates=[];
for(const level of levels)for(const profile of ['common','worn','strong','scarce','wounded'])for(const kind of ['ordinary','bosses'])for(const night of [false,true]){const subset=rows.filter(r=>r.level===level&&r.profile===profile&&r.night===night&&(['boss','miniboss'].includes(r.kind)?'bosses':'ordinary')===kind);aggregates.push({level,profile,kind,night,...summary(subset.flatMap(r=>r.battles))});}
const detail=rows.map(({battles,...r})=>({...r,...summary(battles),enemyLevelMin:Math.min(...battles.map(x=>x.enemyLevel)),enemyLevelMax:Math.max(...battles.map(x=>x.enemyLevel)),enemyHp:battles.reduce((n,b)=>n+b.enemyHp,0)/battles.length}));
const result={baseline,samplesPerCell:count,fixtures:run('wo33Fixtures.map(({id,kind,region})=>({id,kind,region}))'),aggregates,detail};
const out=process.env.WO33_OUTPUT||path.join(__dirname,'../audits/wo33',baseline?'baseline.json':'final.json');fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(aggregates.filter(x=>x.profile==='common'&&x.kind==='ordinary'&&!x.night),null,2));
