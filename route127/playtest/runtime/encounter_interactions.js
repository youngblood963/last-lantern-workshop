/* DEVTEST shared encounter outcome contract: information is nonterminal, failed requirements are visible. */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='PLAYTEST')return;
 const I=EncounterInteraction;
 const labels=e=>(e.prompt?e.prompt():e.choices||'').split(/\s{2,}/).filter(Boolean);
 const information=label=>/^(?:inspect|examine|look|peek|read|observe|watch|listen|study|investigate)\b/i.test(label)&&!/^investigate the signal$/i.test(label)||/^check (?:.*from a distance|service bay)$/i.test(label)||/^question the curator$/i.test(label);
 I.isInformation=information;
 const seen=new WeakMap();
 function history(){let h=seen.get(player.flags);if(!h){h=new Map();seen.set(player.flags,h);}return h;}
 function token(e,key){return [e.title,RoadLifecycle.occurrence(),choiceCommand(key)].join('|');}
 I.seen=(title,key)=>history().has(token({title},key));
 const xp=gainXp,bolts=gainBolts,pack=addPack,retain=r18RetainRoadReward;
 gainXp=function(...args){if(!I.active?.repeatInformation)return xp(...args);};
 gainBolts=function(...args){if(!I.active?.repeatInformation)return bolts(...args);};
 addPack=function(...args){return I.active?.repeatInformation?true:pack(...args);};
 r18RetainRoadReward=function(...args){return I.active?.repeatInformation?true:retain(...args);};
 for(const e of new Set([...RoadScenarioRegistry.regionalCatalog,...RoadScenarioRegistry.entries].map(row=>row.encounter))){
  const native=e.resolve;
  e.resolve=function(...args){const result=native.apply(this,args);if(I.active?.encounter===this){I.active.called=true;I.active.result=result;}return result;};
 }
 function amountEntry(){
  if(stage!=='encounter')return null;
  const e=currentEncounter(),label=e&&labels(e).find(label=>/^TYPE .*<AMOUNT>/i.test(label));if(!label)return null;
  const range=label.match(/\(1[–-](\d+)\)/),limit=range?Number(range[1]):player.bolts;
  return {key:'encounter-amount:'+e.title,title:'Enter encounter amount',label:'Amount in Bolts',numeric:true,min:1,max:Math.min(player.bolts,limit),
   hint:`Enter a whole-Bolt amount. Available: ${player.bolts} Bolts.`,cancel:labels(e).find(s=>/^CANCEL /i.test(s))?.toLowerCase(),
   format:value=>label.replace(/^TYPE /i,'').replace('<AMOUNT>',value).replace(/\s*\([^)]*\)$/, '').toLowerCase()};
 }
 const oldDescribe=FocusedEntry.describe;
 FocusedEntry.describe=function(){return amountEntry()||oldDescribe.apply(this,arguments);};
 const oldComplete=completeRoadTurn;
 completeRoadTurn=function(...args){if(I.active?.information)return;return oldComplete.apply(this,args);};
 const oldResolve=resolveEncounter;
 resolveEncounter=function(raw,...args){
  const e=currentEncounter();if(!e||I.active)return oldResolve.call(this,raw,...args);
  const offered=labels(e),input=choiceCommand(raw);
  const key=offered.find(label=>choiceCommand(label)===input)||choiceKey(input,e);
  const ctx=I.active={encounter:e,key,information:!!key&&information(key),messages:[],requirements:[]};
  ctx.repeatInformation=ctx.information&&history().has(token(e,key));
  const addBefore=add,immediateBefore=addImmediate;
  const capture=(fn)=>(text,...rest)=>{ctx.messages.push(String(text??''));return fn(text,...rest);};
  add=capture(addBefore);addImmediate=capture(immediateBefore);
  try{
   if(key&&/^TYPE .*<AMOUNT>/i.test(key)){add('Enter a numeric amount using '+key.replace(/^TYPE /i,'')+`. Available: ${player.bolts} Bolts.`,'system');FocusedEntry.schedule();return;}
   if(ctx.information){
    // Run the actual definition and lifecycle/reward wrappers, bypassing legacy exclusive completion.
    resultBuffer=[];const result=e.resolve(input);flushResults();
    if(stage==='encounter'){
     history().set(token(e,key),true);
     if(!ctx.messages.some(text=>text.trim()))add(e.text||'You examine the scene.','system');
    }
    return result;
   }
   return oldResolve.call(this,input,...args);
  }finally{
   add=addBefore;addImmediate=immediateBefore;I.active=null;
   if(stage==='encounter'){
    const menu=labels(e),text=ctx.messages.filter(s=>s.trim()&&!menu.includes(s)&&!s.includes('   ')&&! /^(?:\([A-Z0-9]\)|\[\d+\]) /.test(s)&&!/^RESULT$/.test(s));
    if(!text.length&&!player.flags.devFoodChoice&&offered.join('|')===menu.join('|')&&ctx.result!==true){
     const missing=ctx.requirements.filter(r=>r.have<r.need);
     if(missing.length)add('Missing carried supplies: '+missing.map(r=>`${r.name} (need ${r.need}, have ${r.have})`).join('; ')+'.','system');
     else if(!ctx.information)add('That action cannot be completed yet. Check the encounter requirements and choose another action.','system');
    }
    if(ctx.result===false){
     const missing=[...new Map(ctx.requirements.filter(r=>r.have<r.need).map(r=>[r.name,r])).values()];
     if(missing.length&&text.length&&!text.some(s=>/have \d/.test(s)))
      add('Carried supply check: '+missing.map(r=>`${r.name} (need ${r.need}, have ${r.have})`).join('; ')+'.','system');
     const words={one:1,two:2,three:3,four:4,five:5,ten:10,twenty:20,fifty:50};
     const terms=[...text,/^(?:pay|buy|barter|wager|learn)\b/i.test(key||'')?key:''].join(' ').replace(/\b(one|two|three|four|five|ten|twenty|fifty)(?= Bolts)/gi,w=>words[w.toLowerCase()]);
     const cost=terms.match(/(?:need|asks|requires?|costs?|toll(?: is)?|pay)\D{0,30}(\d+)\s*Bolts/i);
     if(cost&&player.bolts<Number(cost[1]))add(`Required: ${cost[1]} Bolts. Available: ${player.bolts} Bolts.`,'system');
    }
    // Failed actions and information never consume the choice binding or strand the scene.
    renderCurrentChoices();
   }
  }
 };
})();
