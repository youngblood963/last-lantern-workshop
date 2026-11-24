const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const create=require(process.env.ROUTE127_RELEASE?'./helpers/release_menu.cjs':'./helpers/menu_audit.cjs');
(async()=>{
 const {run,flush,ctx,walk}=create();await flush();run(fs.readFileSync(path.join(__dirname,'support/industrial_stress_profile.js'),'utf8'));
 run('IndustrialStressFixture.prepare();findItem("Bandage").qty=100;GraphicalUI.active=()=>true;GraphicalUI.preferred="graphics";v49FactoryRoom();globalThis.factoryQACommands=0;globalThis.factoryQAWins=0;globalThis.nativeFactoryWin=finishCombatVictory;finishCombatVictory=function(...args){factoryQAWins++;return nativeFactoryWin(...args)}');
 let seed=123456,rooms=0,heals=0,searchGuards=0,reloadChecked=false;const events=[];ctx.Math.random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
 const settle=async()=>{await flush();await run('outputQueue');await flush();};
 async function dismiss(){for(const d of walk(ctx.document.body).filter(n=>n.classList?.contains('r127-scenario-results'))){const b=d.querySelector('button');for(const f of b?.events.click||[])await f({currentTarget:b});}await settle();}
 const choices=()=>run('GraphicalUI.choices()');
 async function act(cmd){await dismiss();const c=choices().find(c=>c.command.toLowerCase()===String(cmd).toLowerCase()||c.key===String(cmd));assert(c,cmd+' not offered '+JSON.stringify(choices()));run('menuAuditMessages=[]');await run('GraphicalUI.dispatch('+JSON.stringify(c)+')');await settle();events.push({cmd,stage:run('stage'),messages:run('menuAuditMessages'),hp:run('player.hp'),combat:run('combatState?.name')});run('factoryQACommands++');if(process.env.INDUSTRIAL_FACTORY_REPORT)fs.writeFileSync(process.env.INDUSTRIAL_FACTORY_REPORT+'.progress',JSON.stringify(events));}
 async function fight(){let rounds=0;while(run('!!combatState')&&rounds++<120){
  if(run('player.hp/player.maxHp<.75&&hasItem("Bandage")')){const enemy=run('JSON.stringify(combatState)'),hp=run('player.hp'),qty=run('findItem("Bandage").qty');await act('use item');const med=choices().find(c=>/bandage/i.test(c.command));assert(med);await act(med.key);assert.equal(run('JSON.stringify(combatState)'),enemy);assert(run('player.hp')>hp);assert.equal(run('findItem("Bandage")?.qty||0'),qty-1);heals++;}
  const attack=choices().find(c=>/^attack(?: |$)/.test(c.command));assert(attack);await act(attack.key);
  if(!reloadChecked&&run('!!combatState&&factoryState().room===FACTORY_FLOORS[factoryState().floor].rooms.length-1')){const saved=run('JSON.stringify({c:combatState,hp:player.hp,f:factoryState()})');run('v49RollingAutosave()');await run("loadGame('auto')");await settle();assert.equal(run('JSON.stringify({c:combatState,hp:player.hp,f:factoryState()})'),saved);reloadChecked=true;}
 }
 assert(rounds<120);assert.notEqual(run('stage'),'fallen',run('JSON.stringify({hp:player.hp,pack:player.pack,floor:factoryState().floor,room:factoryState().room,messages:menuAuditMessages})'));await dismiss();}
 await settle();await act('enter inner factory');await act('4');assert.equal(run('stage'),'factoryDungeonHub');assert(run('menuAuditMessages.some(t=>t.includes("ACCESS DENIED"))'));
 for(let floor=0;floor<4;floor++){
  await act(String(floor+1));assert.equal(run('factoryState().floor'),floor);
  const count=run('FACTORY_FLOORS[factoryState().floor].rooms.length');
  for(let room=0;room<count;room++){
   await act(String(room+1));rooms++;await act('inspect');const puzzle=run('FACTORY_PUZZLES[factoryState().floor+":"+factoryState().room]');if(puzzle)await act(puzzle.answer);
   if(choices().some(c=>c.command==='fight')){await act('fight');await fight();}
   if(choices().some(c=>c.command==='search')){await act('search');const before=run('JSON.stringify({pack:player.pack,bolts:player.bolts,xp:player.xp,turns:player.turns})');await act('search');assert.equal(run('JSON.stringify({pack:player.pack,bolts:player.bolts,xp:player.xp,turns:player.turns})'),before);searchGuards++;}
   await act('return to floor');
  }
  await act('0');assert(run('factoryState().done.includes('+floor+')'));
 }
 assert.equal(run('factoryDone()'),4);assert(reloadChecked);assert(heals>0);
 const before=run('JSON.stringify({pack:player.pack,bolts:player.bolts,xp:player.xp,done:factoryState().done})');run('v49RollingAutosave()');await run("loadGame('auto')");await settle();assert.equal(run('JSON.stringify({pack:player.pack,bolts:player.bolts,xp:player.xp,done:factoryState().done})'),before);
 const report={entry:process.env.ROUTE127_RELEASE?'PLAYTEST':'DEVTEST',rooms,commands:run('factoryQACommands'),combats:run('factoryQAWins'),heals,searchGuards,bosses:run('FACTORY_BOSSES.map(b=>b.name)'),reloadChecked,events};
 if(process.env.INDUSTRIAL_FACTORY_REPORT)fs.writeFileSync(process.env.INDUSTRIAL_FACTORY_REPORT,JSON.stringify(report,null,2));console.log('PASS '+JSON.stringify({...report,events:undefined}));
})().catch(e=>{console.error(e);process.exitCode=1});
