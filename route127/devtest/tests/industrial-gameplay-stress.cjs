/* Active native graphical-command exploration; not a static registry audit.
 * Controlled branch fixtures are separate from browser travel counts. */
const fs=require('node:fs'),path=require('node:path');
const create=require(process.env.ROUTE127_RELEASE?'./helpers/release_menu.cjs':'./helpers/menu_audit.cjs');
const out=path.resolve(process.env.INDUSTRIAL_OUT||path.join(__dirname,'../docs/industrial-gameplay-stress'));
fs.mkdirSync(out,{recursive:true});
const evidence=path.join(out,'native-cases.jsonl');fs.writeFileSync(evidence,'');
(async()=>{
 const game=create(),{run,flush,ctx,walk}=game;await flush();await run('outputQueue');
 run(fs.readFileSync(path.join(__dirname,'support/industrial_stress_profile.js'),'utf8'));
 run("globalThis.industrialVictories=0;const industrialWin=finishCombatVictory;finishCombatVictory=function(...args){industrialVictories++;return industrialWin(...args)};globalThis.industrialInitialWandererLocations=JSON.stringify(wandererLocations)");
 const settle=async()=>{await flush();await run('outputQueue');await flush();};
 async function dismissResults(){for(const d of walk(ctx.document.body).filter(n=>n.classList?.contains('r127-scenario-results'))){const b=d.querySelector('button');for(const f of b?.events.click||[])await f({currentTarget:b,target:b});}await settle();}
 function choices(){const modal=walk(ctx.document.body).filter(n=>n.tagName==='DIALOG'&&n.open).at(-1);if(modal){return walk(modal).filter(n=>n.tagName==='BUTTON'&&!n.hidden&&!n.disabled&&n.events?.click?.length).map((n,i)=>({kind:'dom',command:'@'+n.textContent,label:n.textContent,index:i}));}return JSON.parse(run('JSON.stringify(GraphicalUI.choices())')).map(c=>({...c,kind:'game'}));}
 async function dispatch(c){if(c.kind==='dom'){const modal=walk(ctx.document.body).filter(n=>n.tagName==='DIALOG'&&n.open).at(-1);const b=modal&&walk(modal).filter(n=>n.tagName==='BUTTON'&&!n.hidden&&!n.disabled&&n.events?.click?.length)[c.index];if(!b)throw Error('Missing dialog choice '+c.command);for(const f of b.events.click)await f.call(b,{currentTarget:b,target:b,preventDefault(){}});if(b.type==='submit'){let form=b.parentNode;while(form&&form.tagName!=='FORM')form=form.parentNode;for(const f of form?.events.submit||[])await f({currentTarget:form,target:form,preventDefault(){}});}}else await run('GraphicalUI.dispatch('+JSON.stringify(c)+')');await settle();}
 const state=()=>{const result=JSON.parse(run(`JSON.stringify({stage,location:mercyLocation,hp:player.hp,maxHp:player.maxHp,turns:player.turns,bolts:player.bolts,xp:player.xp,pack:player.pack,flags:player.flags,combat:combatState?{name:combatState.name,hp:combatState.hp,enemies:combatState.enemies?.map(e=>({name:e.name,hp:e.hp}))}:null,pending:lanternState()?.pending,messages:menuAuditMessages,victories:industrialVictories,art:GraphicalUI.model().art,title:GraphicalUI.model().title})`));result.dialogs=walk(ctx.document.body).filter(n=>n.tagName==='DIALOG'&&n.open).map(n=>({text:n.textContent,inputs:walk(n).filter(x=>['INPUT','SELECT'].includes(x.tagName)).map(x=>({value:x.value,required:x.required}))}));return result;};
 async function boot(id,condition,steps=[]){await dismissResults();run('TravelerPanels.close();Route127MapOverlay.close();Route127Community.close();SeaportRoomChest.close()');await settle();
  run('IndustrialStressFixture.prepare('+JSON.stringify(condition)+');wandererLocations=JSON.parse(industrialInitialWandererLocations);GraphicalUI.active=()=>true;GraphicalUI.preferred="graphics";outputQueue=Promise.resolve();');ctx.Math.random=()=>condition.roll;
  run('IndustrialStressFixture.enter('+JSON.stringify(id)+')');await settle();
  for(const step of steps){const c=choices().find(c=>c.command===step);if(!c)throw Error('Replay unavailable: '+step);await dispatch(c);await dismissResults();}
 }
 const roster=JSON.parse(run('JSON.stringify(IndustrialStressFixture.roster().map(e=>({id:e.id,name:e.encounter.displayName||e.encounter.title,policy:RoadLifecycle.policies[e.id].lifecycle})))'));
 fs.writeFileSync(path.join(out,'roster.json'),JSON.stringify(roster,null,2));
 const all=[],issues=[],limits=[],combatStats={completed:0,commands:0,retreats:0,deaths:0};
 const selected=process.env.INDUSTRIAL_IDS?roster.filter(e=>process.env.INDUSTRIAL_IDS.split(',').includes(e.id)):roster;
 const conditions=[{name:'supplied-day-low',roll:.1},{name:'supplied-day-high',roll:.9},{name:'supplied-night',night:true,roll:.45},{name:'empty-day',poor:true,roll:.45}];
 async function combat(){const prior=ctx.Math.random;let seed=123456;ctx.Math.random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};let rounds=0;while(run('!!combatState')&&rounds++<120){let cs=choices(),s=state();let c;
  if(s.hp/s.maxHp<.38&&run('hasItem("Bandage")')&&cs.some(c=>/^(use item|heal|items)$/.test(c.command))){c=cs.find(c=>/^(use item|heal|items)$/.test(c.command));await dispatch(c);combatStats.commands++;const medicine=choices().find(c=>/bandage/i.test(c.command));if(medicine){await dispatch(medicine);combatStats.commands++;continue;}cs=choices();}
  c=cs.find(c=>/^attack(?:$| )/.test(c.command))||cs.find(c=>/^target /.test(c.command))||cs.find(c=>/^strike/.test(c.command));
  if(!c){c=cs.find(c=>/^(back|return|cancel)/.test(c.command));if(!c){issues.push({kind:'combat-menu',stage:s.stage,choices:cs});break;}}
  await dispatch(c);combatStats.commands++;
 }if(run('stage==="fallen"'))combatStats.deaths++;if(rounds>=120)issues.push({kind:'combat-round-limit',state:state()});await dismissResults();ctx.Math.random=prior;}
 for(const entry of selected){let initialTotal=all.length;
  for(const condition of (process.env.INDUSTRIAL_CONDITION?conditions.filter(c=>c.name===process.env.INDUSTRIAL_CONDITION):conditions)){
   if(process.env.INDUSTRIAL_RANGED)condition.ranged=true;
   const queue=[[]],seen=new Set();let menus=0;
   while(queue.length){const steps=queue.shift();try{await boot(entry.id,condition,steps);}catch(e){issues.push({id:entry.id,condition:condition.name,path:steps,kind:'replay',error:String(e)});continue;}
    const start=state(),offered=choices(),signature=JSON.stringify([start.stage,start.location,offered.map(c=>c.command)]);
    if(seen.has(signature))continue;seen.add(signature);
    if(menus++>=Number(process.env.INDUSTRIAL_MENU_LIMIT||10)){limits.push({id:entry.id,condition:condition.name,path:steps});break;}
    for(const c of offered){if(c.command==='type a name for the dog (1–24 characters) or cancel')continue;
     await boot(entry.id,condition,steps);const candidate=choices().find(x=>x.command===c.command);if(!candidate){issues.push({id:entry.id,kind:'vanished-on-replay',command:c.command});continue;}
     run('menuAuditMessages=[]');const before=state();let error;
     try{await dispatch(candidate);}catch(e){error=String(e);}
     const after=state(),next=choices();const labels=new Set([...offered,...next].flatMap(c=>[c.command,c.label]).map(s=>String(s).toLowerCase()));
     const feedback=after.messages.filter(x=>x.trim()&&!/^>/.test(x)&&!x.includes('   ')&&!labels.has(x.toLowerCase())&&!/^AUTOSAVED|^LOCAL CHARACTER|^CLOUD SAVED/i.test(x));
     const changed=JSON.stringify([before.stage,before.location,before.hp,before.bolts,before.xp,before.pack,before.combat,before.dialogs,offered.map(c=>c.command)])!==JSON.stringify([after.stage,after.location,after.hp,after.bolts,after.xp,after.pack,after.combat,after.dialogs,next.map(c=>c.command)]);
     const row={id:entry.id,name:entry.name,condition:condition.name,path:steps,command:c.command,before:before.stage,after:after.stage,feedback,error,changed,hpDelta:after.hp-before.hp,boltsDelta:after.bolts-before.bolts,xpDelta:after.xp-before.xp,turnDelta:after.turns-before.turns,combat:after.combat?.name,art:after.art};all.push(row);fs.appendFileSync(evidence,JSON.stringify(row)+'\n');
     if(error)issues.push({...row,kind:'throw'});
     if(!changed&&!feedback.length&&!(c.kind==='dom'&&c.command==='@All'))issues.push({...row,kind:'no-response'});
     if(feedback.some(t=>/invalid command|not an option|not an available choice|unknown command/i.test(t)))issues.push({...row,kind:'routing'});
     if(after.combat){const wins=run('industrialVictories');await combat();combatStats.completed+=run('industrialVictories')-wins;}
     await dismissResults();const final=state(),afterChoices=choices();
     if(final.pending&&!['combat','fallen','lanternRoad','lanternNode'].includes(final.stage)&&afterChoices.length&&steps.length<Number(process.env.INDUSTRIAL_DEPTH||4)&&JSON.stringify(afterChoices.map(c=>c.command))!==JSON.stringify(offered.map(c=>c.command)))queue.push([...steps,c.command]);
     if(c.command==='leave'&&final.stage==='encounter'&&final.pending)issues.push({...row,kind:'exit-did-not-exit'});
     if(final.stage==='encounter'&&!afterChoices.length)issues.push({...row,kind:'stranded'});
    }
   }
  }
  fs.writeFileSync(path.join(out,'progress.json'),JSON.stringify({scenario:entry.id,tested:selected.indexOf(entry)+1,total:selected.length,cases:all.length,issues:issues.length,combatStats}));console.log(entry.id+' '+entry.name+': '+(all.length-initialTotal)+' cases; issues '+issues.length);
 }
 const report={entry:process.env.ROUTE127_RELEASE?'PLAYTEST':'DEVTEST',scenarios:selected.length,cases:all.length,uniqueCommands:new Set(all.map(r=>r.id+'|'+r.command)).size,branches:new Set(all.map(r=>r.id+'|'+r.condition+'|'+r.path.join('>'))).size,combatStats,issues,limits};fs.writeFileSync(path.join(out,'native-summary.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,issues:issues.slice(0,25),limits:limits.length},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
