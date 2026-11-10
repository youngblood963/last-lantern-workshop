const assert=require('node:assert/strict');
const {run}=require('./helpers/devtest.cjs')();
run(`
updateHud=()=>{};resetPlayer();player.flags.mercyDiscovered=true;lanternMigrate();
lanternState().nodeId='house';GraphicalUI.preferred='graphics';
stage='encounter';roadTurn=0;player.encounterDone={};combatState=null;
const applicable=RoadScenarioRegistry.entries.filter(e=>e.classification==='GLOBAL'||e.regions?.some(r=>['CENTRAL','INDUSTRIAL','SEAPORT'].includes(r)));
function selectScene(entry){
 const e=entry.encounter, early=encounters.indexOf(e);
 roadGoal=early>=0?'house':'east';
 roadEncounterOrder=[early>=0?early:eastEncounters.indexOf(e)];
 stage='encounter';combatState=null;numberedChoices={};currentHotkeys={};player.encounterDone={};
 return e;
}
`);
const result=run(`applicable.map(entry=>{
 const e=selectScene(entry), expected=encounterChoices(e).split(/\\s{2,}/).filter(Boolean).map(choiceCommand);
 const rows=GraphicalUI.choices();
 if(!rows.length)throw Error('Empty menu '+entry.name);
 if(new Set(rows.map(r=>r.command)).size!==rows.length)throw Error('Duplicates '+entry.name);
 for(const command of expected)if(!rows.some(r=>r.command===command))throw Error('Missing '+command+' in '+entry.name);
 if(!/back away|move on|keep moving|walk away|leave|withdraw|retreat|back down/.test(rows.at(-1).command))throw Error('Exit last '+entry.name);
 return {name:entry.name,count:rows.length};
})`);
assert(result.length>100);
assert.equal(run(`
selectScene(applicable.find(e=>e.name==='THE PAINTED ARROWS'));
Route127RoadsidePresentation.current()
`),null);
assert.equal(run(`
combatState={name:'ARROW AMBUSH',hp:20,enemies:[{hp:10},{hp:10}]};stage='combat';
Route127RoadsidePresentation.current().items.length
`),2);
for(const title of ['HIGHWAY ROBBERS','RABID RACCOONS','BAT COLONY','LOOTERS']){
 assert.equal(run(`combatState={name:${JSON.stringify(title)},hp:10};Route127RoadsidePresentation.current()`),null);
}
assert.equal(run(`
selectScene(applicable.find(e=>e.name==='THE WAX MUSEUM'));
combatState={name:'THE CURATOR',hp:20};stage='combat';
Route127RoadsidePresentation.current().items[0].name
`),'The Curator.png');
assert.equal(run(`
selectScene(applicable.find(e=>e.name==='LONE SCAVENGER'));
combatState={name:'SCAVENGER',hp:20};stage='combat';
Route127RoadsidePresentation.current().title
`),'LONE SCAVENGER');
assert.equal(run(`
selectScene(applicable.find(e=>e.name==='THE STEEL ORCHARD'));
const c=GraphicalUI.choices();combatState=null;stage='combat';GraphicalUI.preferred='classic';
GraphicalUI.preference()
`),'classic');
console.log('PASS '+result.length+' route/global scenario menus, full authored choices, unique commands, exit last, dedicated ownership and staged ambush reveal');
