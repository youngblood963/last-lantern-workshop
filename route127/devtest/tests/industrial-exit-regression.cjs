const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const create=require(process.env.ROUTE127_RELEASE?'./helpers/release_menu.cjs':'./helpers/menu_audit.cjs');
(async()=>{
 const {run,flush,walk,ctx}=create();await flush();run(fs.readFileSync(path.join(__dirname,'support/industrial_stress_profile.js'),'utf8'));
 const settle=async()=>{await flush();await run('outputQueue');await flush();};
 async function act(cmd){const c=run('GraphicalUI.choices().find(c=>c.command==='+JSON.stringify(cmd)+')');assert(c,cmd);await run('GraphicalUI.dispatch('+JSON.stringify(c)+')');await settle();}
 for(const poor of [false,true])for(const helped of [false,true]){
  run('IndustrialStressFixture.prepare('+JSON.stringify({poor})+');GraphicalUI.active=()=>true;GraphicalUI.preferred="graphics";player.flags.r18CountyWorkerHelped='+helped+';IndustrialStressFixture.enter("early:0")');await settle();await act(helped?'follow county map':'follow tracks');
  const before=run('JSON.stringify({hp:player.hp,turns:player.turns,bolts:player.bolts,xp:player.xp,pack:player.pack,worker:player.flags.r18CountyWorkerHelped,map:player.flags.r18CountyMapSeen,quest:player.flags.r18CountyQuest,depot:player.flags.r18CountyDepot})');
  await act(helped?'move on':'leave');assert.equal(run('stage'),'lanternRoad');assert(!run('lanternState().pending'));assert.equal(run('JSON.stringify({hp:player.hp,turns:player.turns,bolts:player.bolts,xp:player.xp,pack:player.pack,worker:player.flags.r18CountyWorkerHelped,map:player.flags.r18CountyMapSeen,quest:player.flags.r18CountyQuest,depot:player.flags.r18CountyDepot})'),before);
 }
 console.log('PASS '+(process.env.ROUTE127_RELEASE?'PLAYTEST':'DEVTEST')+': County Truck generated Leave after tracks and Move On after map exit; supplied/empty packs; permanent worker, map and depot state/resources retained; no added travel turn');
})().catch(e=>{console.error(e);process.exitCode=1});
