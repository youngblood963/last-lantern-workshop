const assert=require('node:assert/strict');
const {run}=require('./helpers/devtest.cjs')();

run(`let transcript66=[];
add=(text)=>transcript66.push(String(text));
addImmediate=()=>{};
updateHud=()=>{};
RoadThreat.show=()=>{};
renderCombatMenu=()=>{};
function setup66(title,level,hour){
 resetPlayer();
 player.level=level;player.flags.worldHour=hour;
 player.weapon='Rusted Pipe';player.armor='Worn Jacket';
 lanternMigrate();
 Object.assign(lanternState(),{currentEdgeId:'house--solace-upper-junction',stepIndex:3,
  pending:true,encounterRegion:'early',encounterIndex:encounters.findIndex(e=>e.title===title)});
 stage='encounter';
 Math.random=()=>.999;
 transcript66=[];
}
function attacks66(command){
 transcript66=[];
 const before=player.hp;
 handleCombat(command);
 return {damage:before-player.hp,attackers:transcript66.filter(line=>line.includes(' attacks for ')).map(line=>line.split(' attacks for ')[0])};
}`);
const result=source=>JSON.parse(run(`JSON.stringify(${source})`));

for(const level of [1,2,3]){
 for(const hour of [12,23]){
  run(`setup66('TUNNEL RATS',${level},${hour});resolveEncounter('fight pack');`);
  assert.equal(run('combatState.level'),level);
  assert.deepEqual(result('GraphicalUI.model().enemies.map(e=>e.name)'),['TUNNEL RAT 1','TUNNEL RAT 2']);
  assert.deepEqual(result('combatState.enemies.map(e=>[e.r18Min,e.r18Max])'),[[2,4],[2,4]]);
  const round=result("attacks66('attack 1')");
  assert.deepEqual(round.attackers,['TUNNEL RAT 1','TUNNEL RAT 2']);
  assert.ok(round.damage>0&&round.damage<=(hour===12?10:12));
  run('combatState.enemies[0].hp=1;');
  const finish=result("attacks66('attack 1')");
  assert.deepEqual(finish.attackers,['TUNNEL RAT 2']);
  assert.equal(finish.damage*2,round.damage);
  assert.deepEqual(result('GraphicalUI.model().enemies.map(e=>e.name)'),['TUNNEL RAT 2']);
  assert.deepEqual(result("attacks66('attack 1')"),{damage:0,attackers:[]});
 }
}

run("setup66('RATS IN THE PANTRY',1,23);resolveEncounter('fight rats');");
assert.equal(run('combatState.name'),'PANTRY RAT PACK');
assert.equal(run('combatState.enemies.length'),3);
assert.equal(result("attacks66('attack 1')").attackers.length,3);
run('combatState.enemies[0].hp=1;');
assert.deepEqual(result("attacks66('attack 1')").attackers,['SCAVENGER RAT','GNAWER RAT']);
run("setup66('LONE SCAVENGER',2,12);resolveEncounter('fight');");
assert.equal(run('combatState.enemies?.length||0'),0);
assert.ok(result("attacks66('attack')").damage>0);

const routes=[
 ['house--solace-upper-junction',1,'NORTH'],
 ['house--solace-upper-junction',2,'CENTRAL'],
 ['solace-upper-junction--solace',2,'CENTRAL'],
 ['works-junction--factory',3,'CENTRAL'],
 ['works-junction--factory',4,'INDUSTRIAL'],
 ['industrial-road--industrial-junction',4,'INDUSTRIAL'],
 ['industrial-road--industrial-junction',5,'EAST'],
 ['boulder-junction--seaport',2,'SEAPORT'],
 ['boulder-junction--seaport',3,'CAUSEWAY']
];
run(`resetPlayer();player.level=10;lanternMigrate();
function road66(edge,step,direction){
 Object.assign(lanternState(),{currentEdgeId:edge,stepIndex:step,direction,pending:true,
  encounterRegion:LG_EDGES[edge].region,encounterIndex:null});
}
function draws66(){
 const pool=r10Region();
 const titles=kind=>r10SelectionCandidates(pool,kind).map(index=>r10CanonicalTitle(r10Pool(pool)[index].title));
 return Object.keys(R10_WEIGHTS).filter(kind=>kind!=='wanderer').flatMap(kind=>titles(kind));
}`);
for(const [edge,step,region] of routes){
 for(const direction of [1,-1]){
  run(`road66('${edge}',${step},${direction})`);
  assert.equal(run('r10Geography()'),region);
  const data=result(`draws66().map(title=>{const entry=RoadScenarioRegistry.regionalByTitle.get(title);
   return {title,classification:entry.classification,regions:entry.regions,causeway:entry.causeway===true};
  })`);
  assert.equal(data.some(entry=>entry.title==='THE SCRAP CLAIM'),region==='INDUSTRIAL');
  assert.equal(data.some(entry=>entry.classification==='GLOBAL'),region!=='CAUSEWAY');
  assert.equal(new Set(data.map(entry=>entry.title)).size,data.length);
  assert.ok(data.length&&data.every(entry=>region==='CAUSEWAY'?entry.causeway:
   entry.classification==='GLOBAL'||entry.regions.includes(region)));
 }
}

// A later candidate hook and a priority hook must not let an old eastern alias
// bypass the final filter on a fresh draw.
run(`road66('solace-upper-junction--solace',2,1);
 const before66=r10Candidates;
 const pool66=r10Region(),claim66=r10Pool(pool66).findIndex(e=>r10CanonicalTitle(e.title)==='THE SCRAP CLAIM');
 r10Candidates=(pool,kind)=>[claim66,...before66(pool,kind)];
 RoadScenarioRegistry.wo3Pick=()=>claim66;
`);
assert.ok(run('claim66>=0'));
assert.notEqual(run("r10Pick(pool66,'combat',()=>0)"),run('claim66'));
run("lanternState().encounterIndex=claim66;resumeSavedEncounter=true;");
assert.equal(run('r10PrepareEncounter()'),true);
assert.equal(run('r10CanonicalTitle(currentEncounter().title)'),'THE SCRAP CLAIM');
console.log('PASS WO66 rat attacks and HP bars, day/night, other combat, final regional selection, boundary direction, and saved encounter resume');
