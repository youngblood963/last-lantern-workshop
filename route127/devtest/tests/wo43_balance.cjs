const assert=require('node:assert/strict');
const {run,storage}=require('./helpers/devtest.cjs')();
assert.equal(run('WO43Balance.enabled()'),false);
assert.equal(run('baseHpForLevel(50)'),4000);
assert.equal(run(`
(()=>{
 const spec=(name,tier='ordinary',source='encounter')=>({name,wo33:{tier},source});
 return [spec('LOOTERS'),spec('PARKING LOT RAIDERS'),spec('RABID RACCOONS'),spec('BAT COLONY'),
 spec('PANTRY RAT PACK'),spec('FERAL DOG PACK'),spec('MOUNTAIN LIONS'),
 spec('SALVAGE KING','miniboss','factoryFight'),spec('THE FOREMAN','boss','factoryFight'),
 spec('LOOTERS','ordinary','r18TournamentFight'),{name:'LOOTERS',source:'encounter'}].map(WO43Balance.multiplier).join(',');
})()
`),'3,3,3.5,3.5,3.5,3,3,2,1,1,1');
assert.equal(run(`
player.level=9;player.flags={};stage='combat';player.accessory=null;
combatState={};player.weapon='Road Weapon L09 RARE';
const old=JSON.stringify(GEAR[player.weapon]);
const adjusted=weaponRange().join(',');
if(JSON.stringify(GEAR[player.weapon])!==old)throw Error('stored weapon changed');
stage='between';adjusted+'|'+weaponRange().join(',');
`),'15,22|13,20');
assert.equal(run(`
stage='combat'; player.weapon='Road Weapon L09 RARE +3';
player.flags.r127EquipmentUpgrades={[player.weapon]:{base:'Road Weapon L09 RARE',bonus:6}};
GraphicalUI.sync();
weaponRange().join(',')
`),'21,28');
assert.equal(run(`
player.weapon='Iron Reaper';weaponRange().join(',')
`),'19,29');
assert.equal(run(`
player.weapon='Rusted Pipe';weaponRange().join(',')
`),'5,10');
run(`WO43Balance.setEnabled(true)`);
assert.equal(storage.get('route127:devtest:v1:wo43-danger-retaliation'),'on');
assert.equal(storage.has('wo43-danger-retaliation'),false);
assert.equal(run('WO43Balance.enabled()'),true);
console.log('PASS WO43 mappings, default, storage, catalog/named/common ranges, old gear and saved +6 hydration');
assert.equal(run(`
(()=>{
 let dark=false;
 isDark=()=>dark;
 Math.random=()=>0.5;
 add=()=>{};updateHud=()=>{};renderCombatMenu=()=>{};
 player.armor='Road Armor L01 COMMON';player.maxHp=316;
 function strike(challenge,night,source,bleed=0){
  WO43Balance.setEnabled(challenge);dark=night;player.hp=316;
  const c={name:'PANTRY RAT PACK',min:4,max:4,level:9,hp:20,maxHp:20,
   source,wo33:{tier:'ordinary'},r18RatPack:true,r18RatBleed:bleed};
  combatState=c;stage='combat';combatRetaliation(c);return 316-player.hp;
 }
 const baseline=strike(false,false,'encounter');
 const challenge=strike(true,false,'encounter');
 const night=strike(true,true,'encounter');
 const excluded=strike(true,false,'r18TournamentFight');
 const dot=strike(true,false,'encounter',1)-challenge;
 player.pack=[{name:'Bandage',type:'consumable',qty:1}];player.hp=100;
 handleCombat('use bandage');
 return [baseline,challenge,night,excluded,dot,player.hp].join(',');
})()
`),'4,21,27,4,2,179');
console.log('PASS WO43 actual retaliation, night, scripted exclusions, unscaled bleed, healing without retaliation');
