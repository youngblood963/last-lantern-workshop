const assert=require('node:assert/strict');
const {run}=require('./helpers/devtest.cjs')();

const scenes=[
 ['MAINTENANCE BOX','regional','maintenance_box.png'],
 ['CACHE UNDER THE MILEPOST','sky','milepost_cache.png'],
 ['ABANDONED SUPPLY TRUCK','none','fresh_meat_butcher.png'],
 ['THE BURNT LIBRARY','road','burnt_library.png'],
 ['THE COLLAPSED DAM','sky','the_collapsed_dam.png'],
 ['THE SINKING CAUSEWAY','sky','the_lost_convoy.png'],
 ['THE CHAIN BRIDGE','sky','the_chain_bridge.gif'],
 ['THE SUNKEN CHAPEL','sky','sunken_chapel_exterior.png'],
 ['RIVER OF FIRE','sky','river_of_fire.gif']
];
const result=run(`(()=>{
 GraphicalUI.active=()=>true;
 let encounter,ready,region,missing;
 const requests=new Set();
 currentEncounter=()=>encounter;
 route127CurrentRegion=()=>region;
 GraphicalUI.sceneArtworkReady=url=>{
  requests.add(url.split('/').at(-1));
  return ready&&(!missing||!url.endsWith(missing));
 };
 stage='encounter';
 return ${JSON.stringify(scenes)}.flatMap(([title,mode,file])=>{
  encounter=RoadScenarioRegistry.entries.find(entry=>entry.encounter.title===title)?.encounter;
  if(!encounter)throw Error('No encounter '+title);
  return ['CENTRAL','CAUSEWAY'].flatMap(area=>[12,22].map(hour=>{
   region=area;player.flags.worldHour=hour;
   requests.clear();ready=false;missing=null;
   const pending=GraphicalUI.model();
   ready=true;missing='sky_'+(hour===12?'day':'night')+'.png';
   const missingSky=GraphicalUI.model();
   missing=null;
   const model=GraphicalUI.model();
   return {title,mode,file,actual:model.scenarioBackdrop?.mode,
    pending:pending.scenarioBackdrop?.mode,missingSky:missingSky.scenarioBackdrop?.mode,
    requested:[...requests],sky:'sky_'+(hour===12?'day':'night')+'.png'};
  }));
 });
})()`);
for(const row of result){
 assert.equal(row.actual,row.mode,row.title);
 assert.equal(row.pending,undefined,row.title);
 if(row.mode!=='none'){
  assert.ok(row.requested.includes(row.sky),row.title);
  assert.equal(row.missingSky,undefined,row.title);
 }
 assert.ok(row.requested.includes(row.file),row.title);
}
console.log('PASS roadside composition ownership and decode fallback for nine encounters, day and night, Central and Causeway');
