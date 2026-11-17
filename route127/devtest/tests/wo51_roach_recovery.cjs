const assert = require('node:assert/strict');
const createGame = require('./helpers/wo33_dom.cjs');

async function scene({food = false, persisted = false, title = 'ROACH NEST'} = {}) {
  const {run, flush, ids} = createGame();
  run(`
    GraphicalUI.setMode('graphics');
    player.handle='wo51-fixture';
    player.level=9;
    player.turns=19;
    player.flags.interfaceUnlocked=true;
    player.flags.portRoadCleared=true;
    player.flags.timQuest='active';
    player.pack=${food ? '[{name:"Canned Meat",type:"consumable",qty:2}]' : '[]'};
    const testRoad=lanternMigrate();
    const testPool=['seaport','coast','east','early'].find(region=>
      r10Pool(region).some(e=>e.title===${JSON.stringify(title)}));
    if(!testPool)throw Error('Missing random encounter fixture');
    Object.assign(testRoad,{nodeId:'boulder-junction',currentEdgeId:'boulder-junction--seaport',
      stepIndex:4,direction:1,pending:true,sceneId:'wo51-fixture:4',
      encounterRegion:testPool,encounterIndex:r10Pool(testPool).findIndex(e=>e.title===${JSON.stringify(title)})});
    lanternProject();
    resumeSavedEncounter=true;
    showEncounter();
    if(${persisted}){
      player.flags.devFoodChoice='lure them away';
      stage='between';
      v49Autosave();
      loadGame('auto');
    }
  `);
  await flush();
  assert.equal(run('stage'), 'encounter');
  assert.equal(run('currentEncounter().title'), title);
  const click = async command => {
    const choice=run('GraphicalUI.choices().find(row=>row.command===' + JSON.stringify(command) + ')');
    assert.ok(choice, 'missing graphical choice: ' + command);
    await run('GraphicalUI.dispatch(' + JSON.stringify(choice) + ')');
    await flush();
  };
  return {run,flush,ids,click};
}

(async()=>{
  const fresh=await scene({food:true});
  await fresh.click('lure them away');
  assert.equal(fresh.run('stage'),'lanternRoad');
  assert.equal(fresh.run('player.pack[0].qty'),1);
  assert.equal(fresh.run('player.turns'),19);

  const persisted=await scene({persisted:true});
  await persisted.click('lure them away');
  assert.match(persisted.ids.screen.textContent,/don.t have any food/i);
  assert.equal(persisted.run('stage'),'encounter');
  assert.equal(persisted.run('player.flags.devFoodChoice'),undefined);
  await persisted.click('back away');
  assert.equal(persisted.run('stage'),'lanternRoad');
  assert.equal(persisted.run('lanternState().stepIndex'),4);
  assert.equal(persisted.run('player.turns'),19);

  const search=await scene();
  await search.click('search van');
  assert.equal(search.run('stage'),'lanternRoad');
  assert.equal(search.run('player.pack.find(i=>i.name==="Scrap Metal").qty'),1);
  const fight=await scene();
  await fight.click('fight swarm');
  assert.equal(fight.run('stage'),'combat');
  assert.equal(fight.run('combatState.source'),'encounter');

  const rats=await scene({title:'TUNNEL RATS'});
  rats.run('player.pack=[{name:"Wild Honey",type:"consumable",qty:2}]');
  await rats.click('throw food');
  await rats.click('cancel food');
  await rats.click('throw food');
  await rats.click('use food: wild honey');
  assert.equal(rats.run('stage'),'lanternRoad');
  assert.equal(rats.run('player.pack[0].qty'),1);

  const regular=await scene({title:'DRAINAGE CULVERT'});
  await regular.click('search bank');
  assert.equal(regular.run('stage'),'lanternRoad');
  assert.equal(regular.run('player.pack.find(i=>i.name==="Cloth").qty'),1);

  const rescue=await scene({persisted:true,food:true});
  rescue.run(`
    v49Autosave();
    const original=localStorage.getItem(FACTORY_AUTOSAVE_KEY);
    const originalEl=document.createElement;
    document.createElement=function(tag){
      const element=originalEl(tag);
      element.querySelector=selector=>element.children.find(n=>n.classList.contains(selector.slice(1)))||null;
      element.querySelectorAll=selector=>element.children.filter(n=>n.tagName===selector.toUpperCase());
      return element;
    };
    TravelerPanels.which='options';
    TravelerPanels.body=document.createElement('div');
    TravelerPanels.options();
  `);
  const action=rescue.run(`TravelerPanels.body.children[0].children.find(n=>n.textContent==='Escape Stuck Roach Nest')`);
  assert.ok(action,'missing recovery action in real Options modal');
  action.events.click[0]();
  await rescue.flush();
  assert.equal(rescue.run('stage'),'lanternRoad');
  assert.equal(rescue.run('lanternState().stepIndex'),4);
  assert.equal(rescue.run('player.turns'),19);
  assert.equal(rescue.run('player.pack[0].qty'),2);
  assert.equal(rescue.run('player.flags.timQuest'),'active');
  assert.equal(rescue.run(`localStorage.getItem('route127_devtest_roach_nest_recovery_backup:wo51-fixture:4')===original`),true);
  assert.equal(rescue.run(`
    (() => {
      const expected=JSON.parse(original);
      expected.stage='lanternRoad';
      expected.player.flags.lanternTravel.pending=false;
      expected.player.flags.lanternTravel.encounterIndex=null;
      delete expected.player.flags.devFoodChoice;
      delete expected.player.flags.devFoodSelected;
      return JSON.stringify(expected)===localStorage.getItem(FACTORY_AUTOSAVE_KEY);
    })()
  `),true);
  rescue.run('loadGame("auto")');
  await rescue.flush();
  assert.equal(rescue.run('lanternState().stepIndex'),4);
  await rescue.click('continue road');
  assert.equal(rescue.run('lanternState().stepIndex'),5);
  assert.equal(rescue.run('player.turns'),18);
  console.log('PASS Roach Nest graphical actions, ordinary encounter, backed-up Options recovery and resumed travel');
})().catch(error=>{console.error(error);process.exitCode=1;});
