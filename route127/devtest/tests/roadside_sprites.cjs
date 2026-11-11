const assert=require('node:assert/strict');
const {run,flush}=require('./helpers/wo33_dom.cjs')();
(async()=>{
 await flush();
 run(`
 const elementPrototype=Object.getPrototypeOf(document.createElement('div'));
 function matches(node,selector){
  const attr=selector.match(/\\[([^=\\]]+)(?:="([^"]*)")?\\]/);
  const simple=selector.replace(/\\[[^\\]]+\\]/g,'');
  const [tag,...classes]=simple.split('.');
  if(tag&&node.tagName!==tag.toUpperCase())return false;
  if(classes.some(c=>!node.classList.contains(c)))return false;
  if(attr){
   const key=attr[1].startsWith('data-')?attr[1].slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()):null;
   const value=key?node.dataset[key]:node.getAttribute(attr[1]);
   if(value==null||attr[2]!=null&&String(value)!==attr[2])return false;
  }
  return true;
 }
 elementPrototype.querySelectorAll=function(selector){
  return this.children.flatMap(child=>[...(matches(child,selector)?[child]:[]),...child.querySelectorAll(selector)]);
 };
 elementPrototype.querySelector=function(selector){return this.querySelectorAll(selector)[0]||null};
 Object.defineProperty(elementPrototype,'firstElementChild',{get(){return this.children[0]||null},configurable:true});
 resetPlayer();player.flags.mercyDiscovered=true;lanternMigrate();lanternState().nodeId='house';
 GraphicalUI.mount();GraphicalUI.preferred='graphics';player.level=9;stage='encounter';roadTurn=0;player.encounterDone={};busy=false;
 function fixture(title){
  const e=RoadScenarioRegistry.entries.find(e=>e.name.toUpperCase()===title).encounter;
  const index=encounters.indexOf(e);roadGoal=index>=0?'house':'east';
  roadEncounterOrder=[index>=0?index:eastEncounters.indexOf(e)];
  stage='encounter';combatState=null;GraphicalUI.sync();
 }
 function makeFight(name,count){
  combatState={name,source:'encounter',level:9,hp:count*10,maxHp:count*10,
   ...(count>1?{enemies:Array.from({length:count},(_,i)=>({name:name+' '+i,hp:10,maxHp:10}))}:{})};
  stage='combat';GraphicalUI.sync();
 }
 `);
 for(const [title,name,count,selector,hp] of [
  ['RABID RACCOONS','RABID RACCOONS',3,'.r127-raccoon-unit','.r127-raccoon-label'],
  ['BAT COLONY','BAT COLONY',4,'.r127-bat-unit','.r127-bat-hp'],
  ['LOOTERS','LOOTERS',3,'.r127-human-unit','.r127-human-hp'],
  ['PARKING LOT RAIDERS','PARKING LOT RAIDERS',3,'.r127-human-unit','.r127-human-hp'],
  ['THE HOLLOWED','THE HOLLOWED',2,'.r127-hollowed-unit','.r127-human-hp'],
  ['HIGHWAY ROBBERS','HIGHWAY ROBBERS',2,'.r127-human-unit','.r127-human-hp'],
  ['THE WAX MUSEUM','THE CURATOR',1,'.r127-road-unit','.r127-road-hp'],
  ['THE BONE COLLECTOR','THE BONE COLLECTOR',1,'.r127-road-unit','.r127-road-hp'],
  ['THE WRECKERS','WRECKERS',2,'.r127-road-unit','.r127-road-hp'],
 ]){
  run(`fixture(${JSON.stringify(title)});makeFight(${JSON.stringify(name)},${count})`);
  assert.equal(run(`GraphicalUI.element.figure.querySelectorAll(${JSON.stringify(selector)}).length`),count,title);
  assert.equal(run(`GraphicalUI.element.figure.querySelectorAll(${JSON.stringify(hp)}).length`),count,title);
  assert.equal(run("GraphicalUI.element.figure.querySelectorAll('.r127-road-art').length"),selector==='.r127-road-unit'?1:0,title+' owns scene');
  run(`if(combatState.enemies)combatState.enemies[0].hp=0;else combatState.hp=0;GraphicalUI.sync();`);
  if(count>1)assert.equal(run(`GraphicalUI.element.figure.querySelectorAll(${JSON.stringify(selector)}).filter(n=>!n.hidden).length`),count-1,title+' dead unit');
  else assert.equal(run(`GraphicalUI.element.figure.querySelector(${JSON.stringify(selector)}).hidden`),true,title+' dead solo');
 }
 run("fixture('THE FORGOTTEN GARDEN')");
 assert.equal(run('GraphicalUI.element.caption.textContent'),'THE FORGOTTEN GARDEN');
 assert.equal(run('currentEncounter().title'),'IRRADIATED ROACHES');
 assert.equal(run('currentEncounter().combat.action'),'FIGHT CHICKENS');
 assert.equal(run('currentEncounter().combat.enemies.length'),3);
 assert.equal(run("eastEncounters.find(e=>e.title==='EAST ROAD — IRRADIATED ROACHES').displayName"),'THE FORGOTTEN GARDEN');
 run("fixture('THE ROAD REAPERS')");
 assert.equal(run('GraphicalUI.element.caption.textContent'),'THE ROAD REAPERS');
 assert.equal(run('currentEncounter().title'),'THE KNIFE WIND');
 assert.match(run('encounterChoices(currentEncounter())'),/FIGHT BOTH REAPERS/);
 run("fixture('THE HOLLOWED')");
 assert.deepEqual(Array.from(run("GraphicalUI.element.figure.querySelectorAll('.r127-hollowed-unit').map(n=>n.style.scale)")),['1','1']);
 assert.equal(run("GraphicalUI.element.figure.querySelectorAll('.r127-human-hp').length"),0);
 run("fixture('THE COUNTY OFFICES')");
 assert.equal(run('GraphicalUI.element.caption.textContent'),'THE COUNTY OFFICES');
 assert.equal(run('currentEncounter().title'),'BROKEN MOTEL');
 assert.match(run('encounterChoices(currentEncounter())'),/INSPECT OFFICE 204/);
 run("fixture('THE SENTRY')");
 assert.match(run("GraphicalUI.element.figure.querySelector('.r127-road-art').querySelector('img').src"),/\/sentry\.png/);
 run("resolveEncounter('fight the guards');GraphicalUI.sync()");
 assert.equal(run('combatState.name'),'WALL GUARDS');
 assert.equal(run('GraphicalUI.element.caption.textContent'),'THE SENTRY');
 assert.match(run("GraphicalUI.element.figure.querySelector('.r127-road-art').querySelector('img').src"),/\/sentry\.png/);
 run("fixture('THE WARDEN')");
 assert.match(run("GraphicalUI.element.figure.querySelector('.r127-road-art').querySelector('img').src"),/Sentry\.png/);
 assert.equal(run("GraphicalUI.element.figure.querySelectorAll('.r127-road-hp').length"),0);
 run("resolveEncounter('fight the warden');GraphicalUI.sync()");
 assert.equal(run('stage'),'combat');
 assert.match(run('combatState.name'),/^WARDEN /);
 assert.match(run("GraphicalUI.element.figure.querySelector('.r127-road-art').querySelector('img').src"),/Sentry\.png/);
 assert.equal(run("GraphicalUI.element.figure.querySelectorAll('.r127-road-hp').length"),1);
 run("fixture('THE PAINTED ARROWS')");
 assert.equal(run("GraphicalUI.element.figure.querySelectorAll('.r127-road-unit').length"),0);
 run("makeFight('ARROW AMBUSH',2)");
 assert.equal(run("GraphicalUI.element.figure.querySelectorAll('.r127-road-unit').length"),2);
 run("fixture('GANG LOOKOUT');makeFight('GANG LOOKOUT',1);combatState.enemies=[{name:'LOOKOUT',hp:10,maxHp:10}];GraphicalUI.sync();");
 assert.equal(run("GraphicalUI.element.figure.querySelectorAll('.r127-human-unit').length"),1);
 run("combatState.reinforcementsArrived=true;combatState.enemies=[{name:'A',hp:10,maxHp:10},{name:'B',hp:10,maxHp:10}];GraphicalUI.sync();");
 assert.equal(run("GraphicalUI.element.figure.querySelectorAll('.r127-human-unit').length"),2);
 console.log('PASS live renderer DOM: individual HP, exclusive owner, death removal, lookout wave, no premature ambush art');
})().catch(error=>{console.error(error);process.exitCode=1});
