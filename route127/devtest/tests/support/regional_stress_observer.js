/* Local browser QA observer. Not loaded by any shipped entry. Records real UI
 * commands; it does not choose actions, change RNG, combat or requirements. */
(()=>{
 if(ROUTE127_ENV.name!=='DEVTEST'||!new URLSearchParams(location.search).has('regional-stress'))return;
 const key='regional-stress-evidence-v2',events=JSON.parse(sessionStorage.getItem(key)||'[]');let messages=[];const counts=JSON.parse(sessionStorage.getItem(key+'-counts')||'{}');
 const snapshot=()=>{const g=lanternState(),c=combatState;return {stage,node:g?.nodeId,edge:g?.currentEdgeId,step:g?.stepIndex,direction:g?.direction,pending:g?.pending,scene:g?.sceneId,region:g?.encounterRegion,title:g?.pending?currentEncounter()?.title:null,level:player.level,hp:player.hp,maxHp:player.maxHp,xp:player.xp,bolts:player.bolts,turns:player.turns,lifetimeTurns:player.lifetimeTurns,hour:player.flags.worldHour,day,weapon:player.weapon,armor:player.armor,pack:player.pack.map(i=>i.name+':'+i.qty).join('|'),combat:c?{name:c.name,hp:c.hp,maxHp:c.maxHp,enemies:c.enemies?.map(e=>({name:e.name,hp:e.hp}))}:null};};
 const node=document.createElement('script');node.type='application/json';node.id='regional-stress-observation';document.body.append(node);
 const draw=()=>{node.dataset.commands=String(counts.command||0);node.textContent=JSON.stringify({state:snapshot(),counts,last:events.at(-1),resources:[...document.images].filter(i=>i.src).map(i=>({src:i.src,complete:i.complete,width:i.naturalWidth})),heap:performance.memory?.usedJSHeapSize,domNodes:document.querySelectorAll('*').length,dialogs:document.querySelectorAll('dialog[open]').length});};
 const record=e=>{const event={at:Date.now(),...e};events.push(event);if(events.length>10)events.shift();counts[e.kind]=(counts[e.kind]||0)+1;sessionStorage.setItem(key,JSON.stringify(events));sessionStorage.setItem(key+'-counts',JSON.stringify(counts));fetch('/__stress-evidence',{method:'POST',body:JSON.stringify(event)}).catch(console.warn);draw();};
 const oldAdd=add;add=function(text,...args){messages.push(String(text));return oldAdd.call(this,text,...args);};
 const oldStep=lanternStep;lanternStep=function(...args){const before=snapshot();const result=oldStep.apply(this,args);if(result===true)record({kind:'travel',before,after:snapshot()});return result;};
 const oldVictory=finishCombatVictory;finishCombatVictory=function(c,...args){const before=snapshot();const result=oldVictory.call(this,c,...args);record({kind:'victory',name:c.name,before,after:snapshot()});return result;};
 const oldStart=startCombat;startCombat=function(spec,...args){const result=oldStart.call(this,spec,...args);record({kind:'combat-start',name:spec.name,state:snapshot()});return result;};
 const oldCommand=handleCommand;handleCommand=async function(raw,...args){const before=snapshot();messages=[];const start=performance.now();try{const result=await oldCommand.call(this,raw,...args);await outputQueue;record({kind:'command',command:raw,before,after:snapshot(),messages:[...messages],elapsed:performance.now()-start});return result;}catch(error){record({kind:'error',command:raw,error:String(error)});throw error;}};
 addEventListener('error',e=>record({kind:'browser-error',error:e.message}));
 addEventListener('unhandledrejection',e=>record({kind:'browser-error',error:String(e.reason)}));
 setTimeout(async()=>{
  await outputQueue;
  if(!sessionStorage.getItem('regional-stress-prepared')){
   resetPlayer();player.handle='Regional Stress Ranger';player.level=15;player.maxHp=baseHpForLevel(15);player.hp=player.maxHp;
   player.xp=0;migrateXpProgress();
   const weapon=EQUIPMENT_CATALOG.find(x=>x.id==='weapon-uncommon-sharpened-machete'),armor=EQUIPMENT_CATALOG.find(x=>x.id==='armor-uncommon-highway-patrol-armor');
   player.weapon=catalogInstanceName(weapon,15);player.armor=catalogInstanceName(armor,15);
   player.turns=150;player.bolts=4000;player.packMax=18;
   player.pack=[{name:'Bandage',type:'consumable',qty:30},{name:'Energy Bars',type:'consumable',qty:20},{name:'Clean Water',type:'consumable',qty:10},{name:'Cloth',type:'material',qty:8},{name:'Scrap Metal',type:'material',qty:8},{name:'Wire',type:'material',qty:5},{name:'Rope',type:'material',qty:2},{name:'Dog Food',type:'consumable',qty:3},{name:'Battered Flashlight',type:'tool',qty:1}];
   Object.assign(player.flags,{interfaceUnlocked:true,mercyDiscovered:true,relayQuest:'complete',relayUnlocked:true,portRoadCleared:true,worldHour:9,murphyRideLevel10Astrid:true});
   lanternMigrate();Object.assign(lanternState(),{nodeId:'lowlands',currentEdgeId:null,stepIndex:0,pending:false,lastSettlement:'factory',solaceAdmitted:true});
   testMode=true;busy=false;commandProcessing=false;stage='lanternNode';GraphicalUI.setMode('graphics');screen.replaceChildren();lanternNodeMenu();updateHud();v49Autosave();sessionStorage.setItem('regional-stress-prepared','1');record({kind:'checkpoint',name:'Lowlands level-15 pre-liberation',state:snapshot()});
  }else record({kind:'page-open',state:snapshot()});draw();
 },1800);
})();
