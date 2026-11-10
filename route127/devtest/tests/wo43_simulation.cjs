const fs=require('fs');
const root=process.env.AUDIT_SRC||require('node:path').resolve(__dirname,'../..');
const {run}=require(root+'/devtest/tests/helpers/devtest.cjs')();
const levels=[1,5,9,15,25,40,50];
run(`
let seed,region='CENTRAL',active=null,who=null;
Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
add=(msg)=>{if(active&&who?.enemies){const m=msg.match(/^(.*) attacks for (\\d+) damage\\.$/);if(m){active.enemyAttacks++;active.struck.add(m[1]);}}};
addImmediate=updateHud=renderCombatMenu=r5DirectChoices=renderCurrentChoices=v49Autosave=()=>{};
isDark=()=>false;timePhase=()=>'DAY';lanternEdge=()=>({primaryRegion:region});
gainXp=gainBolts=()=>{};completeRoadTurn=factoryCombatWin=()=>{stage='turnComplete'};
handlePlayerDeath=()=>{stage='fallen';combatState=null};
RoadScenarioRegistry.regionalCombatAward=()=>{};v555AwardEquipmentDrop=()=>{};
const origDamage=scaledEnemyDamage;
scaledEnemyDamage=function(...args){if(active&&who&&!who.enemies){active.enemyAttacks++;active.struck.add(who.name);}return origDamage(...args);};
RoadThreat.show=()=>{};
const titles=['Rabid Raccoons','Bat Colony','Looters','Mountain Lions','Parking Lot Raiders','SALVAGE KING','THE FOREMAN'];
const def=(type,r,l)=>EQUIPMENT_CATALOG.find(d=>d.type===type&&d.rarity===r&&l>=d.minLevel&&l<=d.maxLevel);
function gear(l,r,t){return catalogInstanceName(def(t,r,l),l)}
function init(l,p){
 const [w,a,variant]=p.split('/');
 player.level=l;player.flags={worldHour:10};player.accessory=null;
 player.weapon=gear(l,w,'weapon');player.armor=gear(l,a,'armor');
 if(variant==='reaper')player.weapon='Iron Reaper';
 if(variant==='plus6'){
  const base=player.weapon;player.weapon=base+' +3';
  player.flags.r127EquipmentUpgrades={[player.weapon]:{base,bonus:6}};
  GraphicalUI.sync();
 }
 syncLevelMaxHp();player.hp=player.maxHp;player.pack=[{name:'Bandage',qty:4,type:'consumable'}];player.turns=100;player.encounterDone={};
}
function fight(title, healAfter){
 combatState=null;stage='between';player.flags.worldHour=10;
 const d=RoadScenarioRegistry.regionalCombatExpansion.find(d=>d[0]===title);
 if(d){region=d[1];RoadScenarioRegistry.regionalCombatFight(d);}else startCombat(FACTORY_BOSSES.find(b=>b.name===title),'factoryFight');
 const c=combatState;who=c;active={enemyAttacks:0,struck:new Set()};
 const units=c.enemies||[c], initial=units.map(e=>[e.name,e.hp,e.r18Min??c.min,e.r18Max??c.max]);
 const totals={att:0,dealt:0,loss:0,heal:0,after:0,pre:0,won:0};
 const byUnit=initial.map(()=>0);
 function heal(){const old=player.hp;if(!player.pack.some(i=>i.name==='Bandage'&&i.qty>0))return false;handleCombat('use bandage');return player.hp>old;}
 while(combatState&&stage==='combat'&&totals.att<150){
  if(player.hp<player.maxHp*.28&&heal()){totals.heal++;continue;}
  const hp=player.hp, enemyHp=c.hp, i=units.findIndex(e=>e.hp>0);if(i>=0)byUnit[i]++;
  handleCombat('attack');totals.att++;totals.loss+=hp-player.hp;totals.dealt+=Math.max(0,enemyHp-c.hp);
 }
 totals.won=+(c.hp<=0&&player.hp>0);
 totals.pre=units.filter(e=>e.hp<=0&&!active.struck.has(e.name)).length;
 const attacks=active.enemyAttacks;active=null;who=null;
 if(healAfter&&totals.won)while(player.hp<player.maxHp*.8){const old=player.hp;if(!useItem('Bandage')||player.hp<=old)break;totals.after++;}
 return {...totals,attacks,pct:100*totals.loss/player.maxHp,defeat:+(player.hp<=0),timeout:+(totals.att===150),duration:totals.att+totals.heal,level:c.level,enemyHp:c.maxHp,initial,byUnit};
}
`);
const rows=[], sequences=[];
const N=+(process.env.N||160);
for(const l of levels){
const out=run(`(()=>{
 const rows=[], seq=[];const l=${l};
 for(const m of ['baseline','challenge']){
 WO43Balance.setEnabled(m==='challenge');
 for(const p of ['common/common','uncommon/common','rare/common','common/rare','uncommon/rare','rare/rare','rare/common/plus6',...(l>=6?['rare/common/reaper']:[])]){
 for(const [j,t] of titles.entries()){
 const agg={}, per=[], h=[], levels=[], attacks=[], raw=new Set(), net=new Set(), modeStats={};let maxLoss=0;
 for(let i=0;i<${N};i++){
 seed=(0x9e3779b9^(Math.imul(i+17,2654435761))^(l*113+j*771))>>>0;init(l,p);
 const b=fight(t,false);for(const k of ['att','dealt','loss','heal','pre','won','attacks','pct','defeat','timeout','duration','enemyHp'])agg[k]=(agg[k]||0)+b[k]/${N};
 b.byUnit.forEach((v,k)=>per[k]=(per[k]||0)+v/${N});h.push(b.initial[0][1]);levels.push(b.level);attacks.push(b.att);raw.add(b.initial[0].slice(2).join('–'));const [lo,hi]=b.initial[0].slice(2);net.add(scaledEnemyDamage(lo,armorDefense(),b.level));net.add(scaledEnemyDamage(hi,armorDefense(),b.level));modeStats[b.level]=[b.initial[0][1],lo,hi];maxLoss=Math.max(maxLoss,b.loss);
 }
 rows.push({l,m,p,t,...agg,per,unitRange:[Math.min(...h),Math.max(...h)],levelRange:[Math.min(...levels),Math.max(...levels)],p95:attacks.sort((a,b)=>a-b)[Math.ceil(.95*${N})-1],raw:[...raw].sort(),net:[Math.min(...net),Math.max(...net)],modeStats,weapon:player.weapon,armor:player.armor});
 }
 for(const policy of ['28% only','restore to 80%']){
 const agg={};
 for(let i=0;i<${N};i++){
 seed=(0x85ebca6b^Math.imul(i+17,2654435761)^l*771)>>>0;init(l,p);
 const a={completed:0,loss:0,heal:0,after:0,defeat:0};
 for(const t of titles.slice(0,5)){const b=fight(t,policy!=='28% only');for(const k of ['loss','heal','after','defeat'])a[k]+=b[k];a.completed+=b.won;if(!b.won)break;}
 a.end=100*player.hp/player.maxHp;
 for(const k in a)agg[k]=(agg[k]||0)+a[k]/${N};
 }
 seq.push({l,m,p,policy,...agg});
 }
 }}
 return {rows,seq};
})()`); rows.push(...out.rows);sequences.push(...out.seq); console.error('level',l);
}
const catalog=run(`(${JSON.stringify(levels)}).map(l=>({l,maxHp:baseHpForLevel(l),gear:EQUIPMENT_QUALITIES.map(r=>{const d=def('weapon',r,l),a=def('armor',r,l);return d?{...GEAR[catalogInstanceName(d,l)],def:a?GEAR[catalogInstanceName(a,l)].def:null}:null})}))`);
const extras=run(`({weights:EQUIPMENT_WEIGHTS, recipes:Object.fromEntries(Object.entries(CRAFT_RECIPES).filter(([k,v])=>v.type==='weapon')),  named:Object.getOwnPropertyNames(GEAR).filter(n=>!n.includes(' (L')&&GEAR[n].type==='weapon').map(n=>[n,GEAR[n]]), regionals:RoadScenarioRegistry.regionalCombatExpansion.filter(d=>titles.includes(d[0]))})`);
const result={N,catalog,extras,rows,sequences};
if(process.env.WO43_OUTPUT)fs.writeFileSync(process.env.WO43_OUTPUT,JSON.stringify(result)+'\n');
console.log(N+' trials per cell; '+rows.length+' isolated cells, '+sequences.length+' chain cells');
