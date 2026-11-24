const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const create=require(process.env.ROUTE127_RELEASE?'./helpers/release_menu.cjs':'./helpers/menu_audit.cjs');
(async()=>{
 const {run,flush,ctx}=create();await flush();run(fs.readFileSync(path.join(__dirname,'support/northern_stress_profile.js'),'utf8'));
 const settle=async()=>{await flush();await run('outputQueue');await flush();};
 async function boot(roll){run('NorthernStressFixture.prepare();GraphicalUI.active=()=>true;GraphicalUI.preferred="graphics"');ctx.Math.random=()=>roll;run('NorthernStressFixture.enter("east:12")');await settle();}
 async function act(cmd){const c=run('GraphicalUI.choices().find(c=>c.command==='+JSON.stringify(cmd)+')');assert(c);await run('GraphicalUI.dispatch('+JSON.stringify(c)+')');await settle();}
 for(const roll of [.1,.9]){await boot(roll);const pack=run('JSON.stringify(player.pack)'),hp=run('player.hp');await act('drop the suspended beam');assert.equal(run('stage'),'combat');assert(run('combatState.r18ChainGang'));assert.equal(run('combatState.enemies.length'),roll<.6?2:3);assert.equal(run('JSON.stringify(player.pack)'),pack);assert.equal(run('player.turns'),150);if(roll<.6)assert.equal(run('player.hp'),hp);else assert(run('player.hp')<hp,'Authored failed beam retaliation retained');}
 await boot(.1);await run("handleCommand('drop bandage')");await settle();assert.equal(run('stage'),'confirmDrop');assert.equal(run('inventoryMode.item'),'Bandage');assert(!run('combatState'));await run("handleCommand('n')");await settle();assert.equal(run('findItem("Bandage").qty'),30);
 await boot(.1);await run("handleCommand('drop missing item')");await settle();assert.equal(run('stage'),'encounter');assert(!run('combatState'));
 console.log('PASS '+(process.env.ROUTE127_RELEASE?'PLAYTEST':'DEVTEST')+': Quarry Lift successful and failed beam branches, authored retaliation, no item/travel charge; ordinary inventory Drop/Cancel and missing item remain intact');
})().catch(e=>{console.error(e);process.exitCode=1});
