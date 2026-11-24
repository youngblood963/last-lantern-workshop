/* Targeted regression: execute the real attributed/inline script chain and native slot transactions. */
const assert=require('node:assert/strict'),create=require('./helpers/wo33_dom.cjs');
(async()=>{
 const {run,flush,ctx,storage}=create();await flush();
 assert.deepEqual(JSON.parse(run('JSON.stringify(R6_GAMES)')),['BLACKJACK','SLOTS',"PIRATE'S POKER",'CRAB RACING','KNIFE THROWING']);
 run("resetPlayer();player.handle='Casino Regression';player.level=15;player.turns=30;player.bolts=10000;player.flags.interfaceUnlocked=true;player.flags.portRoadCleared=true;Object.assign(port55State(),{freed:true,stage:'done'});lanternMigrate();Object.assign(lanternState(),{nodeId:'seaport',currentEdgeId:null,pending:false});stage='port55Mia';GraphicalUI.setMode('graphics');port55MiaMenu();");
 await run("handleCommand('gamble')");await flush();
 assert.deepEqual(JSON.parse(run('JSON.stringify(GraphicalUI.choices().map(c=>c.command))')),['blackjack','slots',"pirate's poker",'crab racing','knife throwing','return to mia']);
 await run("GraphicalUI.dispatch(GraphicalUI.choices().find(c=>c.command==='slots'))");await flush();assert.equal(run('r6Round().game'),'SLOTS');
 assert.deepEqual(JSON.parse(run('JSON.stringify(GraphicalUI.choices().map(c=>c.command))')),['wager 10','wager 20','wager 50','back']);
 ctx.Math.random=()=>0; // Controlled supplemental winner; browser spins use natural RNG.
 for(const bet of [10,20,50]){
  run("r6Open('SLOTS')");await flush();const before=run('player.bolts'),turns=run('player.turns');
  assert.equal(run(`r6Wager(${bet})`),true);await flush();
  const round=JSON.parse(run('JSON.stringify(r6Round())'));assert.equal(round.status,'settled');assert.equal(round.bet,bet);assert(round.reels.every(s=>s===round.reels[0]));assert(round.payout>0);
  assert.equal(run('player.bolts'),before-bet+round.payout);assert.equal(run('player.turns'),turns);
  assert.equal(run(`r6Wager(${bet})`),false,'Cannot settle the same committed round twice');
  run('r6CasinoSave()');await flush();const settled=run('JSON.stringify([player.bolts,player.turns,r6Round().id,r6Round().reels,r6Round().payout])');
  for(let i=0;i<3;i++){await run("loadGame('auto')");await flush();assert.equal(run('JSON.stringify([player.bolts,player.turns,r6Round().id,r6Round().reels,r6Round().payout])'),settled,'Reload cannot replay a payout');}
 }
 for(const bet of [1,5,25,100,1000]){run("r6Open('SLOTS')");const wallet=run('player.bolts');assert.equal(run(`r6Wager(${bet})`),false);assert.equal(run('player.bolts'),wallet);}
 run("r6CasinoCommand('back')");await flush();assert.equal(run('stage'),'r6Casino');assert.equal(run('r6Round()'),undefined);
 await run("handleCommand('return to mia')");await flush();assert.equal(run('stage'),'port55Mia');assert.equal(run('player.turns'),30);
 assert([...storage.keys()].some(k=>k.includes('devtest')));console.log('PASS: full script-chain Seaport menu; only 10/20/50; native winning settlements and duplicate rejection; nine reloads; casino/Mia return; unchanged turns');
})().catch(e=>{console.error(e);process.exitCode=1;});
