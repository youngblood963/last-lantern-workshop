const assert = require('node:assert/strict');
const scene = require('./wo51_roach_recovery.cjs');

function summary({run}) {
  return run('document.body.children.find(el=>el.classList.contains("r127-scenario-results"))');
}
function acknowledge(game) {
  const node=summary(game);
  assert.ok(node,'expected scenario results');
  const buttons=node.children.filter(child=>child.tagName==='BUTTON');
  assert.deepEqual(buttons.map(button=>button.textContent),['Continue']);
  buttons[0].events.click[0]();
  buttons[0].events.click[0]();
  assert.equal(summary(game),undefined);
  return node.textContent;
}

(async()=>{
  for(const bite of [false,true]){
    const game=await scene();
    game.run('Math.random=()=>'+(bite?'.1':'.9'));
    await game.click('search van');
    assert.equal(game.run('stage'),'lanternRoad');
    const before=game.run('JSON.stringify(getSaveData("auto"))');
    const hpLost=100-game.run('player.hp');
    const log=acknowledge(game);
    assert.match(log,/ROACH NEST.*Scavenging complete/);
    assert.match(log,/Scrap Metal \+1/);
    assert.match(log,/XP \+18/);
    if(bite){
      assert.ok(hpLost>0);
      assert.ok(log.includes('HP −'+hpLost));
    }else assert.doesNotMatch(log,/HP [−+]/);
    assert.equal(game.run('JSON.stringify(getSaveData("auto"))'),before);
    assert.equal(game.run('lanternState().stepIndex'),4);
    assert.equal(game.run('player.turns'),19);
  }

  const saved=await scene();
  saved.run('GraphicalUI.setMode("classic")');
  await saved.run('handleCommand("back away")');
  assert.match(summary(saved).textContent,/Retreated/);
  await saved.run('handleCommand("continue")');
  assert.equal(saved.run('lanternState().stepIndex'),4);
  const checkpoint=saved.run('localStorage.getItem(FACTORY_AUTOSAVE_KEY)');
  const restored=await scene();
  restored.run('localStorage.setItem(FACTORY_AUTOSAVE_KEY,'+JSON.stringify(checkpoint)+');loadGame("auto")');
  await restored.flush();
  assert.equal(summary(restored),undefined);
  assert.equal(restored.run('stage'),'lanternRoad');
  assert.equal(restored.run('lanternState().pending'),false);
  assert.equal(restored.run('lanternState().stepIndex'),4);
  assert.equal(restored.run('player.turns'),19);
  await restored.click('continue road');
  assert.equal(restored.run('lanternState().stepIndex'),5);
  assert.equal(restored.run('player.turns'),18);

  const noFood=await scene();
  await noFood.click('lure them away');
  assert.equal(summary(noFood),undefined);
  const food=await scene({food:true});
  await food.click('lure them away');
  assert.match(acknowledge(food),/Canned Meat −1/);

  const rats=await scene({title:'TUNNEL RATS',food:true});
  rats.run('player.pack=[{name:"Wild Honey",type:"consumable",qty:1}]');
  await rats.click('throw food');
  assert.equal(summary(rats),undefined);
  await rats.click('use food: wild honey');
  assert.match(acknowledge(rats),/Wild Honey −1/);

  for(const outcome of ['Combat victory','Retreated','Defeated']){
    const game=await scene();
    await game.click('fight swarm');
    assert.equal(summary(game),undefined);
    if(outcome==='Retreated')await game.click('back off');
    else{
      game.run(outcome==='Defeated'
        ? 'player.hp=1;combatState.hp=999;rollDamage=()=>1;Math.random=()=>.9'
        : 'combatState.hp=1;rollDamage=()=>100');
      await game.click('attack');
    }
    assert.ok(acknowledge(game).includes(outcome));
    assert.equal(game.run('combatState'),null);
  }
  console.log('PASS WO52 scenario results, acknowledgment, reload, road movement and road combat outcomes');
})().catch(error=>{console.error(error);process.exitCode=1;});
