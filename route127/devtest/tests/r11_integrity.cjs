// Headless integration audit: load every shipped script in index.html order.
const fs=require('fs'),assert=require('assert');
const path=require('path');process.chdir(path.join(__dirname,'..'));
const {run}=require('./helpers/devtest.cjs')();
// r11SteveRoll is now a const registry export; do not overwrite runtime bindings.
run(`let qaLog=[];add=(s)=>qaLog.push(String(s));addImmediate=()=>{};updateHud=()=>{};r5Scene=()=>{};r5DirectChoices=()=>{};v49Autosave=()=>{};updateNewQuestRoadProgress=()=>{};showSteveAnnouncement=()=>{};questRoadEvent=()=>false;isDark=()=>false;timePhase=()=> 'DAY';renderRoadMarkerActions=()=>[];testMode=false;player.flags.portRoadCleared=true;player.turns=1000000;portArrive=()=>{portState().position=5;stage='seaport';};arriveSettlement=()=>{stage='settlement';};arriveHouse=()=>{stage='house';};mercyMenu=()=>{stage='mercy';};player.flags.seaportRoute={position:0,cleared:{2:true,4:true},seen:{},arrived:true};let seed=127;const seeded=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};Math.random=seeded;`);
run(`player.weapon='NONE';player.armor='NONE';player.accessory=null;`);
const original=JSON.parse(fs.readFileSync('tests/fixtures/r10_economy.json','utf8'));
for(const [name,price]of Object.entries(original.sell)){const n=run(`R11_ALIASES[${JSON.stringify(name)}]||${JSON.stringify(name)}`);assert.equal(run(`v48SellPrice({name:${JSON.stringify(n)},type:GEAR[${JSON.stringify(n)}].type,qty:1})`),price,'sale price changed: '+name);}
for(const [name,price]of Object.entries(original.buy)){const n=run(`R11_ALIASES[${JSON.stringify(name)}]||${JSON.stringify(name)}`);assert.equal(run(`VENDOR_BASE[${JSON.stringify(n)}]`),price,'buy price changed: '+name);}
console.log('PASS: all baseline equipment sale prices and vendor buying prices preserved through name/rarity migration.');
