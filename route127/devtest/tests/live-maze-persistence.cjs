const assert=require('node:assert/strict');
const create=require('./helpers/menu_audit.cjs');
(async()=>{
 const game=create(),{run,ctx,flush,walk}=game;ctx.HTMLDialogElement=function(){};await flush();
 run(`resetPlayer();player.handle='Maze save QA';player.level=20;player.hp=player.maxHp=1000;player.bolts=900;player.turns=20;player.flags.interfaceUnlocked=true;player.flags.murphyRideLevel10Astrid=true;lanternMigrate();Object.assign(lanternState(),{nodeId:'house',currentEdgeId:'house--solace-upper-junction',stepIndex:1,direction:1,pending:true,sceneId:'maze-visit',encounterRegion:'early',encounterIndex:27});lanternProject();roadTurnCharged=true;stage='encounter';busy=false;commandProcessing=false;
 globalThis.mazeNow=100;performance.now=()=>mazeNow;globalThis.Date=class extends Date{static now(){return 1795536000000+mazeNow}};
 TireMazeHazards.generate=()=>({start:[1,1],grid:R18_MAZES[0].map(r=>Array.from(r))});TireMazeHazards.shift=()=>null;TireMazeHazards.smoke=()=>new Set();
 Route127RoadMinigames.openMaze();`);
 const click=label=>{const node=walk(ctx.document.body).find(n=>n.tagName==='BUTTON'&&n.textContent===label);assert(node,label);for(const fn of node.events.click||[])fn({currentTarget:node});};
 run('mazeNow+=130');click('RIGHT');
 assert.equal(run('player.flags.r18MazeScene.attempt.q.x'),2);
 assert.equal(run('player.flags.r18MazeScene.attempt.q.step'),1);
 run('saveGame();v49RollingAutosave();globalThis.mazeSaved=JSON.stringify(player.flags.r18MazeScene.attempt);TireMazeHazards.generate=()=>{throw Error("An active visit must not generate another maze")};');
 // Recreate the dialog as a browser reload would, retaining only serialized save state.
 for(const d of walk(ctx.document.body).filter(n=>n.tagName==='DIALOG'))d.open=false;
 await run("loadGame('auto')");await flush();
 assert.equal(run('JSON.stringify(player.flags.r18MazeScene.attempt)'),run('mazeSaved'));
 run('Route127RoadMinigames.openMaze()');
 assert.equal(run('player.flags.r18MazeScene.attempt.q.x'),2);assert.equal(run('player.flags.r18MazeScene.attempt.q.step'),1);
 assert.equal(run('player.flags.r18MazeScene.attempt.grid.map(r=>r.join("")).join("\\n")'),run('R18_MAZES[0].join("\\n")'));
 assert(Math.abs(run('player.flags.r18MazeScene.attempt.deadline-JSON.parse(mazeSaved).deadline'))<10);
 assert.equal(run('player.bolts'),900);assert.equal(run('player.turns'),20);
 // A genuinely new occurrence generates a new attempt. Permanent crate and quest flags survive.
 for(const d of walk(ctx.document.body).filter(n=>n.tagName==='DIALOG'))d.open=false;
 run(`player.flags.r18MazeClaimed=true;player.flags.wo3Corvette={active:true,found:true,tiresRecovered:2};lanternState().sceneId='maze-new-visit';TireMazeHazards.generate=()=>({start:[1,1],grid:R18_MAZES[0].map(r=>Array.from(r))});TireMazeHazards.shift=()=>null;TireMazeHazards.smoke=()=>new Set();Route127RoadMinigames.openMaze();`);
 assert.equal(run('player.flags.r18MazeScene.attempt.occurrence'),'maze-new-visit');assert.equal(run('player.flags.r18MazeScene.attempt.q.step'),0);assert(run('player.flags.r18MazeClaimed'));assert.equal(run('player.flags.wo3Corvette.tiresRecovered'),2);
 const resources=run('JSON.stringify({bolts:player.bolts,xp:player.xp,pack:player.pack})');
 for(const direction of ['RIGHT','RIGHT','DOWN','DOWN','RIGHT','RIGHT','DOWN','DOWN']){run('mazeNow+=130');click(direction);}
 assert(run('player.flags.r18MazeScene.attempt.q.finished'));
 assert.equal(run('JSON.stringify({bolts:player.bolts,xp:player.xp,pack:player.pack})'),resources,'Previously claimed crate cannot pay again');
 click('Recover Suitable Tire');click('Recover Suitable Tire');click('Recover Suitable Tire');
 assert.equal(run('player.flags.wo3Corvette.tiresRecovered'),4,'Existing four tire cap still applies');
 // A goal snapshot interrupted before its reward callback recovers exactly once.
 for(const d of walk(ctx.document.body).filter(n=>n.tagName==='DIALOG'))d.open=false;
 run(`delete player.flags.r18MazeClaimed;player.flags.r18MazeScene.attempt.phase='won';player.flags.r18MazeScene.attempt.q.finished=true;`);
 // Use a fresh engine instance so no old dialog-local state can contribute.
 const saved=run('JSON.stringify({player,graph:lanternState()})');
 const fresh=create();fresh.ctx.HTMLDialogElement=function(){};await fresh.flush();
 fresh.run(`globalThis.restoreMaze=${saved};Object.assign(player,restoreMaze.player);player.encounterDone={};stage='encounter';roadTurnCharged=true;busy=false;commandProcessing=false;lanternProject();Route127RoadMinigames.openMaze();`);
 assert(fresh.run('player.flags.r18MazeClaimed'));assert.equal(fresh.run('player.bolts'),run('player.bolts')+8);
 console.log('PASS live maze: native movement persisted; public save/reload and dialog recreation preserve layout, position and deadline; new visit resets attempt; crate/Corvette state and resources preserved');
})().catch(e=>{console.error(e);process.exitCode=1});
