// Execute the existing WO18 healing and WO21 tutorial-combat assertion blocks
// verbatim, separately from their unrelated presentation/quest assertions.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
let body=fs.readFileSync(path.resolve(__dirname,'../../playtest/tests/wo21.cjs'),'utf8');
const yard=body.slice(body.indexOf(' const results=[];'),body.indexOf(" run('resetPlayer();player.flags.interfaceUnlocked=true;player.flags.mercyDiscovered=true;lanternMigrate();Object.assign(lanternState()"));
body=fs.readFileSync(path.resolve(__dirname,'../../playtest/tests/wo18.cjs'),'utf8');
const percentages=body.slice(body.indexOf(' for(const max of [100,150,200,310])'),body.indexOf(" run('player.pack=[];player.weapon"));
const paused=body.slice(body.indexOf(" run('var enemyResponses=0;"),body.indexOf(" run('combatState=null;player.flags.wo3Corvette"));
const allHealing=body.slice(body.indexOf(" for(const [name,rate] of Object.entries(run('HEALING_ITEM_RATES')))"),body.indexOf(" await flush();console.log('PASS WO18"));
if(!yard||!percentages||!paused||!allHealing)throw Error('Existing regression block missing');
const test=new Module(__filename,module);test.filename=__filename;test.paths=module.paths;
test._compile(`const assert=require('node:assert/strict');const {run,flush}=require('./helpers/wo33_dom.cjs')();(async()=>{await flush();run('add=()=>{};addImmediate=()=>({});resultLine=()=>{};v49Autosave=()=>{};');${yard}\nconsole.log('PASS existing WO21: 2,000 starting-gear Yardman battles, saved HP/rewards, and source isolation');${percentages}\n${paused}\n${allHealing}\nconsole.log('PASS existing WO18: percentage healing/caps, direct and menu item use, no item retaliation');})().catch(e=>{console.error(e);process.exitCode=1});`,__filename);
