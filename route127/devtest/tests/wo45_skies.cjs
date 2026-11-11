const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const create=require('./helpers/devtest.cjs');
(async()=>{
 const {run,ctx}=create();
 assert.equal(run("[0,4.99,5,6.99,7,17.99,18,19.99,20,23.99].map(Route127RegionalSky.phase).join(',')"),'night,night,dawn,dawn,day,day,dusk,dusk,night,night');
 run("updateHud=()=>{};resetPlayer();player.flags.mercyDiscovered=true;player.flags.interfaceUnlocked=true;lanternMigrate();stage='lanternRoad';lanternState().currentEdgeId='house--solace-upper-junction';GraphicalUI.preferred='graphics';");
 const root=path.resolve(__dirname,'../../assets/regions');
 for(const region of run('Object.keys(Route127RegionalSky.regions)')){
  for(const h of [5,7,18,20]){
   run(`route127CurrentRegion=()=>${JSON.stringify(region)};player.flags.worldHour=${h};`);
   const scene=run('Route127RegionalSky.describe(route127CurrentRegion(),player.flags.worldHour)');
   for(const f of [scene.original,scene.overlay,scene.sky].filter(Boolean))assert(fs.existsSync(path.join(root,f)),f);
   run('GraphicalUI.sync();GraphicalUI.model()'); // Initialize existing upstream lazy state first.
   const before=run('JSON.stringify(player)');
   run('GraphicalUI.model()');
   for(const image of ctx.__testImages)if(image.onload)await image.onload();
   const model=run('GraphicalUI.model()');
   assert.equal(model.art.split('/').pop(),h===18?scene.original:scene.overlay);
   assert.equal(model.regionalSky?.period,h===18?undefined:h===5?'dawn':h===7?'day':'night');
   assert.equal(run('JSON.stringify(player)'),before,'Visual updates mutated player state');
  }
 }
 const count=ctx.__testImages.length;
 for(let i=0;i<200;i++)run('GraphicalUI.model()');
 assert.equal(ctx.__testImages.length,count,'Image cache grew during repeated updates');
 // Location art remains authoritative, including its original colors at night.
 run("stage='factoryWorkshop';lanternState().currentEdgeId=null;player.flags.worldHour=23;");
 assert.equal(run('GraphicalUI.model().regionalSky'),undefined);
 assert(!run('GraphicalUI.model().art').includes('_overlay'));
 assert.equal(run("Route127RegionalSky.phase(JSON.parse(JSON.stringify(player)).flags.worldHour)"),'night');
 const entry=fs.readFileSync(path.resolve(__dirname,'../../playtest/index.html'),'utf8');
 assert(!entry.includes('regional_sky_wo45'));
 console.log('PASS WO45: 10 boundary samples, 28 regional/time combinations, asset paths, player-state immutability, bounded image cache, dedicated art exclusions, serialized clock, PLAYTEST isolation');
})().catch(e=>{console.error(e);process.exitCode=1;});
