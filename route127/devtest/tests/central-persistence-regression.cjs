// Targeted Central gameplay regression; does not repeat the global policy audit.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const create=require(process.env.ROUTE127_RELEASE?'./helpers/release_menu.cjs':'./helpers/menu_audit.cjs');
(async()=>{
 const {run,flush,ctx,walk}=create();await flush();
 run(fs.readFileSync(path.join(__dirname,'support/central_stress_profile.js'),'utf8'));
 run('CentralStressFixture.prepare();GraphicalUI.active=()=>true;GraphicalUI.preferred="graphics"');
 const settle=async()=>{await flush();await run('outputQueue');await flush();};
 async function dismiss(){for(const d of walk(ctx.document.body).filter(n=>n.classList?.contains('r127-scenario-results'))){const b=d.querySelector('button');for(const f of b?.events.click||[])await f({currentTarget:b});}await settle();}
 async function enter(id,roll){await dismiss();ctx.Math.random=()=>roll;run('CentralStressFixture.enter('+JSON.stringify(id)+')');await settle();}
 async function command(cmd){const c=run('GraphicalUI.choices().find(c=>c.command==='+JSON.stringify(cmd)+')');assert(c,'Choice unavailable: '+cmd);await run('GraphicalUI.dispatch('+JSON.stringify(c)+')');await settle();}
 const art=[];
 for(let i=0;i<4;i++){await enter('early:17',(i+.5)/4);art.push(run('Route127RoadsidePresentation.current().items[0].name'));}
 assert.equal(new Set(art).size,4,'Four eligible dog variants select distinct artwork');
 for(let i=0;i<2;i++){await enter('early:17',.1);const food=run('findItem("Energy Bars").qty');await command('offer food');assert.equal(run('findItem("Energy Bars").qty'),food-1);assert.equal(run('stage'),'lanternRoad');}
 await enter('early:17',.6);run('globalThis.dogSaved=JSON.stringify(player.flags.r18DogScene);v49RollingAutosave()');ctx.Math.random=()=>0;await run("loadGame('auto')");await settle();assert.equal(run('JSON.stringify(player.flags.r18DogScene)'),run('dogSaved'));
 await command('fight dogs');ctx.Math.random=()=>.5;await command('attack');run('globalThis.fightSaved=JSON.stringify(combatState);globalThis.hpSaved=player.hp;v49RollingAutosave()');await run("loadGame('auto')");await settle();assert.equal(run('JSON.stringify(combatState)'),run('fightSaved'));assert.equal(run('player.hp'),run('hpSaved'));
 run('combatState=null');await enter('east:68',.5);await command('open the cabinet');assert.equal(run('findItem("Damaged Corvette Windshield").qty'),1);
 await enter('east:68',.5);assert(run('player.flags.wo2.windshield'),'Permanent unique claim retained');assert.equal(run('findItem("Damaged Corvette Windshield").qty'),1);assert(!run('GraphicalUI.choices().some(c=>c.command==="open the cabinet")'),'Claimed unique reward is unavailable on a later visit');
 console.log('PASS '+(process.env.ROUTE127_RELEASE?'PLAYTEST':'DEVTEST')+': four dog variants/artwork, repeated food choices/item deductions, active variant reload, real attack combat reload, unique Corvette windshield claim retained');
})().catch(e=>{console.error(e);process.exitCode=1});
