const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const make=require('./helpers/devtest.cjs');
const {run,storage}=make();
const result=JSON.parse(run(`JSON.stringify((()=>{
 const L=Route127CombatLayouts;
 const registryIds=new Set([...RoadScenarioRegistry.entries,...RoadScenarioRegistry.regionalCatalog]
  .map(row=>row.canonicalId||row.id));
 return {
  missing:[...registryIds].filter(id=>!L.rows.has(id)),
  rows:[...L.rows.values()],
  duplicate:[...L.rows.values()].flatMap(row=>row.variants.filter(v=>{
   const keys=v.units.map(L.unitKey);
   return new Set(keys).size!==keys.length;
  }))
 };
})())`));
assert.deepEqual(result.missing,[]);
assert.deepEqual(result.duplicate,[]);
for(const row of result.rows)for(const v of row.variants){
 for(const asset of [...v.units,...(v.background?[v.background]:[])]){
  assert.ok(fs.existsSync(path.resolve(__dirname,'..',asset)),row.id+' '+asset);
 }
}
const doc=run(`(()=>{
 const L=Route127CombatLayouts, bat=[...L.rows.values()].find(row=>row.title==='BAT COLONY');
 const key=L.sceneKey(bat.id,'combat','desktop');
 const unit=L.unitKey(bat.variants[0].units[0],0);
 const layout={x:45,y:58,width:24,height:33,scale:1.13,z:5,flip:true};
 const json=L.json({[key]:{[unit]:layout}});
 L.importJSON(json);
 if(JSON.stringify(L.get(bat.id,'combat','phone')[unit])!==JSON.stringify(layout))throw Error('phone fallback');
 return json;
})()`);
assert.throws(()=>run(`Route127CombatLayouts.importJSON(${JSON.stringify(doc.replace('"x": 45','"x": -20'))})`),/Invalid x/);
const persisted=[...storage.entries()].find(([key])=>key.endsWith('combat-visual-layouts-v1'));
assert.ok(persisted);
assert.equal(persisted[1],doc);
const refreshed=make({initialStorage:[persisted]});
assert.equal(refreshed.run('Route127CombatLayouts.json(Route127CombatLayouts.merged())'),doc);
console.log('PASS '+result.rows.length+' catalog entries, file paths, stable unit keys, bounds, export/import, and refresh persistence');
