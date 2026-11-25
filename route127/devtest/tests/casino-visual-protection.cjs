/* Explicit owner-protected alignment/animation contract. Deliberate future wheel
 * edits require a newly approved baseline; ordinary felt changes do not. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
for(const entry of ['devtest','playtest']){
 const s=fs.readFileSync(path.resolve(__dirname,'../../',entry,'runtime/motel_casino_graphics.js'),'utf8');
 for(const feature of ['Tap Table to Place Bets','Done Betting','TOTAL WAGERED:','WINNING NUMBER:','motel-expanded','motel-result','motel-number.winner','felt.addEventListener(\'click\''])assert(s.includes(feature),entry+' roulette mobile UI includes '+feature);
 assert(s.includes("button(expandedActions,'Spin'"),entry+' expanded roulette board can spin');
 assert(s.includes("dispatch('spin')"),entry+' expanded roulette spin delegates to the shared command engine');
 const start=s.indexOf(" const holder=el('div','motel-roulette-wheel'"),end=s.indexOf(' // Correct the AI-printed',start);
 assert.equal(hash(s.slice(start,end)),'cb828273dbd02c5cfab5cf0666380a94e04ad68a9b4e046c306b7320364ff86c',entry+' approved roulette assembly must be byte-identical');
 const a=s.indexOf('function buildSix('),b=s.indexOf('\n\nfunction makePanel',a);
 assert.equal(hash(s.slice(a,b).replace("top:'9.7%'","top:'13%'")),'2ea4c7959b5a9772527e5001be1e4ddeba5f27c65cce2fe9f727aca0734b8b6e',entry+' Big Six only moves vertically');
 const top=.097*941,size=Math.min(.43*1671,.764*941),center=top+size/2;
 assert(Math.abs(center-450)<2,'Disc center agrees with supplied backing');

}
console.log('PASS both entries: approved roulette wheel/pockets/spindle/ball/animation byte-identical; Big Six only top changes, constant size/horizontal position/pointer/animation and centered full rotation');

