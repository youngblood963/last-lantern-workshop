/* Focused real-engine equipment/Backpack regression; no public services. */
const assert=require('node:assert/strict'),create=require('./helpers/menu_audit.cjs');
(async()=>{
let cases=0;
for(const base of ['Sawed-Off Shotgun','Double-Barrel Shotgun','Tactical Shotgun','Thunderhead Shotgun'])for(const mode of ['acquired','saved','stolen-stack']){
 const qty=mode==='stolen-stack'?2:1,stolen=mode==='stolen-stack';
 const game=create(),{run,flush,buttons}=game;await flush();
 const settle=async()=>{await flush();await Promise.resolve();await flush();};
 const click=async(label,exact=true)=>{const b=game.walk(run('TravelerPanels.dialog')).filter(b=>b.tagName==='BUTTON'&&!b.disabled).find(b=>exact?b.textContent===label:b.textContent.includes(label));assert(b,'Missing actual Backpack button '+label+' for '+base+'/'+mode);for(const fn of b.events.click||[])await fn({currentTarget:b,target:b,preventDefault(){},stopPropagation(){}});await settle();};
 run(`resetPlayer();player.handle='Shotgun Regression';player.flags.interfaceUnlocked=true;player.flags.mercyDiscovered=true;player.flags.murphyRideLevel10Astrid=true;player.level=20;player.hp=player.maxHp=baseHpForLevel(20);player.packMax=30;player.turns=40;player.weapon='Widowmaker (L50 EPIC)';lanternMigrate();stage='lanternNode';busy=false;commandProcessing=false;GraphicalUI.active=()=>true;GraphicalUI.preferred='graphics';globalThis.gunDef=EQUIPMENT_CATALOG.find(x=>x.name===${JSON.stringify(base)});globalThis.gunName=catalogInstanceName(gunDef,20);globalThis.originalStats=JSON.stringify(GEAR[gunName]);`);
 if(mode==='saved')run("player.pack.push({name:gunName,type:'weapon',qty:1});r5Migrate()");
 else assert(run("addPack(gunName,'weapon',"+qty+",true,"+stolen+")"));
 assert.equal(run('findItem(gunName).type'),'weapon');assert.equal(run('player.weapon'),'Widowmaker (L50 EPIC)');
 run("TravelerPanels.open('inventory')");await settle();await click(base,false);await click('Equip');
 assert.equal(run('player.weapon'),run('gunName'));assert.equal(run('findItem(gunName)?.qty||0'),qty-1);assert.equal(run('player.flags.r18EquippedStolen.weapon'),stolen);assert.equal(run("findItem('Widowmaker (L50 EPIC)').qty"),1);
 assert.equal(run('JSON.stringify(GEAR[gunName])'),run('originalStats'));
 await click('Widowmaker',false);await click('Equip');assert.equal(run('player.weapon'),'Widowmaker (L50 EPIC)');assert.equal(run('findItem(gunName).qty'),qty);
 await click(base,false);await click('Equip');await click('X');assert.equal(run('stage'),'lanternNode');assert.equal(run('player.turns'),40);
 const saved=run('JSON.stringify(saveSnapshot())');run('globalThis.shotgunSnapshot='+saved);assert(run('JSON.stringify(shotgunSnapshot).includes(gunName)'));
 run("saveGame(activeSaveSlot);player.weapon='Rusted Pipe';loadGame('auto')");await settle();assert.equal(run('player.weapon'),run('gunName'));assert.equal(run('player.flags.r18EquippedStolen.weapon'),stolen);
 // Native combat attack, with deterministic damage only in this isolated test.
 run("Math.random=()=>.5;startCombat({name:'Equipment Regression Target',level:20,hp:500,min:0,max:0,xp:0,bolts:0},'encounter');globalThis.enemyBefore=combatState.hp;globalThis.weaponBefore=player.weapon;");await settle();
 await run("handleCommand('attack')");await settle();assert(run('combatState.hp<enemyBefore'),'No shotgun damage '+mode);assert.equal(run('player.weapon'),run('weaponBefore'));assert(run('r18EquippedRanged()'));
 cases++;
}
const fresh=create();await fresh.flush();fresh.run("resetPlayer();stage='lanternNode';player.packMax=30;addPack('Thunderhead Shotgun (L20 EPIC)','weapon',1,true)");assert.equal(fresh.run('player.weapon'),'Thunderhead Shotgun (L20 EPIC)','Normal loot auto-upgrade changed');
console.log('PASS: '+cases+' shotgun cases — canonical acquisition/saved inventory, real Backpack Equip callbacks, stolen stacks, two-way weaker/stronger swaps, native save/reload, native ranged combat, normal pickup auto-upgrade');
})().catch(e=>{console.error(e);process.exitCode=1});
