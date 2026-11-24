const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const release=!!process.env.ROUTE127_RELEASE;
const create=require(release?'./helpers/release_menu.cjs':'./helpers/menu_audit.cjs');
(async()=>{
 const {run,flush,ctx,walk}=create();await flush();
 run(`resetPlayer();player.handle='Persistence audit';player.level=20;player.maxHp=baseHpForLevel(20);player.hp=player.maxHp;player.turns=30;player.bolts=1234;player.flags.interfaceUnlocked=true;player.flags.murphyRideLevel10Astrid=true;lanternMigrate();GraphicalUI.active=()=>true;GraphicalUI.preferred='graphics';`);
 const rows=JSON.parse(run(`JSON.stringify(RoadScenarioRegistry.regionalCatalog.map(e=>({id:e.id,name:e.encounter.displayName||e.encounter.title,policy:RoadLifecycle.policies[e.id],assignment:e.classification,regions:e.regions,workOrderId:e.workOrderId,choices:RoadLifecycle.labels(e.encounter),references:RoadScenarioRegistry.byId[e.id]?.references})))`));
 const retired=JSON.parse(run(`JSON.stringify([...new Map([...new Set([...encounters,...eastEncounters])].filter(e=>!RoadLifecycle.entry(e)).map(e=>[r10CanonicalTitle(e.title),{name:r10CanonicalTitle(e.title),id:RoadScenarioRegistry.originalIds.get(e),retired:r10Retired(e.title)}])).values()])`));assert.equal(retired.length,7);assert(retired.every(e=>e.retired));
 assert.equal(rows.length,198);assert.equal(new Set(rows.map(e=>e.id)).size,198);assert(rows.every(e=>e.policy));
 // Exercise every policy's storage scope. No rewards, quests or combat are simulated here.
 run(`globalThis.policyChecks=[];for(const [id,p]of Object.entries(RoadLifecycle.policies)){
  lanternState().sceneId='scope-a';const rec=RoadLifecycle.record(id);rec.claims.auditPermanent=true;
  RoadLifecycle.visitClaims(id).auditVisit=true;
  const same=RoadLifecycle.visitClaims(id).auditVisit===true;
  lanternState().sceneId='scope-b';const next=RoadLifecycle.visitClaims(id);
  policyChecks.push({id,same,cleared:!next.auditVisit,permanent:rec.claims.auditPermanent===true,
    shared:p.lifecycle==='Repeatable'?RoadLifecycle.claims(id)===next:RoadLifecycle.claims(id)===rec.claims});
 }`);
 assert(run('policyChecks.length===198&&policyChecks.every(c=>c.same&&c.cleared&&c.permanent&&c.shared)'));
 function visit(id,roll){run(`lanternState().sceneId=${JSON.stringify(id)};Math.random=()=>${roll};stage='encounter';combatState=null;`);}
 for(const [fn,flag,n]of [['r18DogVariant','r18DogScene',4],['r18RoachVariant','r18RoachScene',3],['r18ScavengerVariant','r18ScavengerScene',3]]){
  for(let i=0;i<n;i++){visit(fn+i,(i+.5)/n);assert.equal(run(fn+'()'),i);run('Math.random=()=>.999');assert.equal(run(fn+'()'),i);}
 }
 visit('camp-a',.1);assert(run('r18CampVariant()'));visit('camp-b',.9);assert(!run('r18CampVariant()'));
 visit('scrap-a',.1);run('r18ScrapClaimState().disarmed=true');assert(run('r18ScrapClaimState().disarmed'));visit('scrap-b',.1);assert(!run('r18ScrapClaimState().disarmed'));
 // Actual variants control native choices and artwork, and are stable through public save/load.
 function setup(id,scene,roll){const [region,index]=id.split(':');run(`Object.assign(lanternState(),{nodeId:'house',currentEdgeId:'house--solace-upper-junction',stepIndex:1,direction:1,pending:true,sceneId:${JSON.stringify(scene)},encounterRegion:${JSON.stringify(region)},encounterIndex:${+index}});lanternProject();delete player.encounterDone[roadTurn];roadTurnCharged=true;stage='encounter';combatState=null;busy=false;commandProcessing=false;Math.random=()=>${roll};`);}
 const arts=[];
 for(let i=0;i<4;i++){setup('early:17','dog-'+i,(i+.5)/4);const prompt=run('currentEncounter().prompt()');assert(prompt.includes(i===0?'GIVE THE DEN SPACE':i===3?'THROW FOOD':i===1?'OFFER FOOD':'STAND YOUR GROUND'));arts.push(run('Route127RoadsidePresentation.current().items[0].name'));}
 assert.equal(new Set(arts).size,4);
 for(let i=0;i<4;i++)assert.match(arts[i],[/mother_pups/,/hungry_lone/,/aggressive_lone/,/pack_concept/][i]);
 // Complete a real repeatable choice, then encounter it again without losing that choice.
 for(let i=0;i<2;i++){
  for(const d of walk(ctx.document.body).filter(n=>n.classList?.contains('r127-scenario-results'))){const b=d.querySelector('button');for(const f of b?.events.click||[])f({currentTarget:b});}
  setup('early:17','food-visit-'+i,.1);run(`player.pack=[{name:'Energy Bars',type:'consumable',qty:2}];renderCurrentChoices()`);await flush();
  const choice=run('GraphicalUI.choices().find(c=>c.command==="offer food")');assert(choice,JSON.stringify(run("({stage,choices:GraphicalUI.choices(),prompt:currentEncounter().prompt(),done:[...player.encounterDone[roadTurn]||[]],variant:r18DogVariant()})")));
  await run('GraphicalUI.dispatch('+JSON.stringify(choice)+')');await flush();
  assert.equal(run('findItem("Energy Bars").qty'),1);assert.equal(run('stage'),'lanternRoad');assert.equal(run('player.turns'),30);
 }

 setup('early:17','dog-reload',.9);run('r18DogVariant();globalThis.savedDog=JSON.stringify(player.flags.r18DogScene);saveGame();v49RollingAutosave();Math.random=()=>0');await run("loadGame('auto')");await flush();assert.equal(run('JSON.stringify(player.flags.r18DogScene)'),run('savedDog'));assert.equal(run('r18DogVariant()'),3);
 // Native fight, saved partially wounded enemies, public reload: no reroll or HP reset.
 run("resolveEncounter('fight dogs')");await flush();assert(run('combatState'));run('combatState.hp=Math.max(1,combatState.hp-3);if(combatState.enemies?.length)combatState.enemies[0].hp=Math.max(1,combatState.enemies[0].hp-2);globalThis.savedFight=JSON.stringify(combatState);v49RollingAutosave()');await run("loadGame('auto')");await flush();assert.equal(run('JSON.stringify(combatState)'),run('savedFight'));
 // The two crab encounters are distinct eligible designs, not a sticky random choice.
 for(const [id,key,name]of [['east:62','crabTrap','CRAB SWARM'],['east:64','crabNest','NEST GUARDIAN']]){
  setup(id,'crab-'+key,.1);run(`RoadScenarioRegistry.wo2State()[${JSON.stringify(key)}]=true;resolveEncounter('fight')`);await flush();assert.equal(run('combatState.name'),name);assert(!run('combatState.wo2Reward'),'Unique salvage cannot be paid twice');assert(run('combatState.wo2NoEquipment'));
 }
 // No migration touches permanent character data; per-visit access only changes temporary records.
 run(`combatState=null;globalThis.permanentBefore=JSON.stringify({pack:player.pack,bolts:player.bolts,xp:player.xp,flags:{r18FreezerRescueReward:player.flags.r18FreezerRescueReward,wo2:player.flags.wo2,wo3Corvette:player.flags.wo3Corvette}});for(const id of Object.keys(RoadLifecycle.policies))RoadLifecycle.visitClaims(id);`);
 assert.equal(run('JSON.stringify({pack:player.pack,bolts:player.bolts,xp:player.xp,flags:{r18FreezerRescueReward:player.flags.r18FreezerRescueReward,wo2:player.flags.wo2,wo3Corvette:player.flags.wo3Corvette}})'),run('permanentBefore'));
 // Semantic classification: identical file gets different treatment in a shop and an encounter.
 const role=(model,context)=>run(`Route127ArtworkRole.classify(${JSON.stringify({active:true,art:'assets/locations/shared.png',location:'solace',...model})},${JSON.stringify({stage:'mercy',combat:null,scene:null,...context})})`);
 assert.equal(role({},{}),'location');assert.equal(role({},{stage:'encounter'}),'scenario');assert.equal(role({scenarioBackdrop:{mode:'sky'}},{}),'scenario');assert.equal(role({art:'../assets/regions/central.png'},{}),'regional');assert.equal(role({layout:'motel-casino'},{}),'casino');assert.equal(role({layout:'seaport-poker'},{}),'casino');assert.equal(role({},{stage:'combat',combat:{source:'encounter'}}),'scenario');assert.equal(role({},{stage:'factoryDungeonRoom',scene:{id:'factory:boss:0'}}),'scenario');assert.equal(role({},{scene:{id:'motel:pool'}}),'location');assert.equal(role({scenarioBackdrop:{mode:'none'}},{stage:'wo6FreshMart',scene:{id:'east:67'}}),'location');
 if(!release){
  const randomized=new Set(['early:15','early:17','early:18','early:55','east:8']);
  const hybrid=new Set(['east:62','east:64','early:27','early:65','early:194','east:52']);
  for(const e of rows){const p=e.policy;e.classification=['Fixed','Inactive'].includes(p.lifecycle)?'One-time / '+p.lifecycle:p.lifecycle==='One-time'&&!hybrid.has(e.id)?'One-time':p.lifecycle==='Conditional'||hybrid.has(e.id)?'Hybrid':randomized.has(e.id)?'Repeatable — randomized':p.groups.length>1||e.workOrderId||e.choices.length>2?'Repeatable — branching':'Repeatable — fixed';e.evidence=p.completion;delete e.choices;}
  const out=path.join(__dirname,'../docs/location-persistence-audit');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'scenario-inventory.json'),JSON.stringify(rows,null,2)+'\n');fs.writeFileSync(path.join(out,'retired-legacy.json'),JSON.stringify(retired,null,2)+'\n');
  const cell=s=>'"'+String(s??'').replaceAll('"','""')+'"';fs.writeFileSync(path.join(out,'scenario-inventory.csv'),'ID,Scenario,Classification,Existing policy,Assignment,Explicit regions,Persistence evidence\n'+rows.map(e=>[e.id,e.name,e.classification,e.policy.lifecycle,e.assignment,e.regions?.join('; ')||'GLOBAL',e.evidence].map(cell).join(',')).join('\n')+'\n');
 }
 console.log('PASS '+(release?'PLAYTEST':'DEVTEST')+': 198 policies; temporary visit isolation and permanent claims, all dog/roach/scavenger/camp variants, dog artwork/native choices, public reload/combat HP, both crab encounters/unique salvage, character compatibility and artwork roles');
})().catch(e=>{console.error(e);process.exitCode=1});
