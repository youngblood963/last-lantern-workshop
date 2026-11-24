const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const create=require(process.env.ROUTE127_RELEASE?'./helpers/release_menu.cjs':'./helpers/menu_audit.cjs');
(async()=>{
 const {run,flush,ctx,walk}=create();await flush();run(fs.readFileSync(path.join(__dirname,'support/central_stress_profile.js'),'utf8'));
 run('CentralStressFixture.prepare();GraphicalUI.mount();GraphicalUI.preferred="graphics";GraphicalUI.active=()=>true;mercyMenu();GraphicalUI.sync()');await flush();
 // Hold a real town command in flight, as slow narrative output does in-browser.
 run('globalThis.nativeCommand=handleCommand;globalThis.commandGate=new Promise(resolve=>globalThis.releaseCommand=resolve);globalThis.commandCalls=0;handleCommand=async function(raw){commandCalls++;await commandGate;return nativeCommand(raw)};globalThis.selectedCommand=GraphicalUI.choices()[0];globalThis.pendingCommand=GraphicalUI.dispatch(selectedCommand)');
 assert(run('commandProcessing'));
 const buttons=()=>walk(ctx.document.body).filter(n=>n.classList?.contains('gfx-choice'));
 assert(buttons().length&&buttons().every(b=>b.disabled),'Actions must visibly wait during command output');
 assert.equal(await run('GraphicalUI.dispatch(selectedCommand)'),false);assert.equal(run('commandCalls'),1,'A second click cannot enter a running transaction');
 run('releaseCommand()');await run('pendingCommand');await flush();assert(!run('commandProcessing'));assert(buttons().every(b=>!b.disabled),'New menu unlocks after output');
 assert(run('GraphicalUI.choices().some(c=>c.command==="armory")'),'Native Shops routing still executes');
 run('handleCommand=async()=>{throw Error("controlled output failure")};globalThis.failedCommand=GraphicalUI.dispatch(GraphicalUI.choices()[0])');await assert.rejects(run('failedCommand'),/controlled output failure/);assert(!run('commandProcessing'));assert(buttons().every(b=>!b.disabled));run('handleCommand=nativeCommand');
 // Exercise the shipped menu with the optional DEVTEST-only runtime absent.
 run('globalThis.savedRoadGames=globalThis.Route127RoadMinigames;delete globalThis.Route127RoadMinigames;CentralStressFixture.enter("east:11")');await flush();
 for(const command of ['watch the contest','compete','wager 10 bolts','wager custom amount','confirm 100 bolt wager']){
  run('menuAuditMessages=[];player.flags.r18ScrapDuelScene.phase="confirm";player.flags.r18ScrapDuelScene.stake=100');const before=run('player.bolts');
  await run('resolveEncounter('+JSON.stringify(command)+')');await flush();assert.equal(run('player.bolts'),before);assert.equal(run('stage'),'encounter');assert(run('menuAuditMessages.some(t=>t.includes("No wager was taken"))'));assert.equal(run('player.flags.r18ScrapDuelScene.phase'),'idle');
 }
 await run('resolveEncounter("back away")');await flush();assert.equal(run('stage'),'lanternRoad');
 console.log('PASS '+(process.env.ROUTE127_RELEASE?'PLAYTEST':'DEVTEST')+': visible processing lock, single native command, menu re-enable including errors; Scrap Duel missing runtime feedback, zero charges, saved confirmations, exit');
})().catch(e=>{console.error(e);process.exitCode=1});
