const screen = document.querySelector("#screen");
const form = document.querySelector("#command-form");
const input = document.querySelector("#command");
const signal = document.querySelector("#signal");
const transmission = document.querySelector("#transmission");
const hud = document.querySelector("#hud");
const utilityPanel = document.querySelector("#utility-panel");

let stage = "title";
let busy = false;
let roadTurn = 0;
let dailyRoadTurns = 0; // cumulative road movement, resets at the 24-hour refill
let roadGoal = "mercy";
let roadTripLength = 10;
let mercyLocation = "town";
let currentRoadWanderer = null;
let currentTownWanderer = null;
let pendingTownFight = null;
let combatState = null;
let resultBuffer = null;
let roadTurnCharged = false;
let serviceRoadDepth = 0;
let day = 1;
let wandererSerial = 0;
let testMode = false;
let refillTimer = null;
let currentHotkeys = {};
let numberedChoices = {};
let resumeSavedEncounter = false;
let townWandererFocus = null;
let returnStage = null;
let inventoryMode = null;
let pendingSaveSlot = null;
let pendingNewGameSlot = null;
let introFailureCount = 0;
let usedHotkeys = new Set();
let reservedChoiceKeys = new Set();
let commandProcessing = false;
let autoFollowOutput = true;
screen.addEventListener("scroll",()=>{ const gap=screen.scrollHeight-(screen.scrollTop+screen.clientHeight); autoFollowOutput=gap<140; },{passive:true});
function followOutput(){
  if(!autoFollowOutput) return;
  // Keep the newest output anchored in view immediately. Smooth scrolling queues
  // animations behind fast terminal output and is what made v25.18 feel laggy.
  screen.scrollTop=screen.scrollHeight;
}
function setInputWaiting(waiting){
  form.classList.toggle("waiting", waiting);
  input.disabled=waiting;
}
const TURN_REFILL_AMOUNT = 50;
const TURN_CAP = 150;
const REFILL_MS = 24*60*60*1000;
const QA_BUILD = false;
const TEST_ACCESS_CODE = ''; 
const player = {
  handle: "", level: 1, hp: 100, maxHp: 100, xp: 0, nextXp: 100,
  bolts: 12, bankBolts: 0, turns: 50, maxTurns: TURN_CAP, lifetimeTurns: 0,
  weapon: "Rusted Pipe", armor: "Worn Jacket", accessory: null,
  pack: [
    {name:"Energy Bars", qty:2, type:"consumable"},
    {name:"Battered Flashlight", qty:1, type:"tool"},
    {name:"Tent",qty:1,type:"supply"}
  ], packMax: 8, flags: { maintenanceYardSearched:false, billboard:false, helpedTraveler:false, travelerInSolace:false, houseBandage:false, forkDiscovered:false, mercyDiscovered:false, serviceBossDead:false, serviceReward:false, rentedRoom:false, timQuest:"locked", timQuestSteps:0, murphyQuest:"locked", murphyQuestSteps:0, pendingQuest:"", mainSolaceQuest:"active", relayQuest:"locked", relayUnlocked:false, relayVisited:false, interfaceUnlocked:false, roomSearched:false, introFailed:false, worldHour:8, relayPartsRevealed:false, relayParts:{johnny:false,yard:false,branch:false,east:false}, relayJohnnyAsked:false, relayBranchDiscovered:false, eastRouteDiscovered:false },
  wandererState: {}, recentEncounters: [], deathStreak: 0,
  encounterDone: {},
  houseStorage: [], houseBoxMax: 6,
  stash: [], dailyDeal: "Claw Hammer"
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function looksLikeChoiceLine(text, cls="") {
  if (!cls.includes("system") || !text) return false;
  const parts=text.split(/\s{2,}/).map(x=>x.trim()).filter(Boolean);
  if(parts.length < 2) return false;
  const verbs=/^(?:\([A-Z0-9]\)\s*)?(?:PROJECT|FACTORY|PERSONNEL|EXIT|ARMORY|THE RUSTY|JOHNNY|MURPHY|LAST CHANCE|SOLACE SAVINGS|FIND|SILENCE|HOOK|TRADE|RUN|CHALLENGE|FISH|JOIN|COVER|CLOSE|CUT|SORT|SMOKE|BREAK|SIFT|SALVAGE|DIG|UNLOAD|SHIFT|TRACE|SHELTER|WATCH|PUSH|DISABLE|PRY|TURN|BOARD|HOLD|LOG|LISTEN|LOAD|WAGER|VIEW|STASH|RETRIEVE|SMALL|DICE|MORE|UPGRADES|FOLLOW|REVERSE|CROSS|TRACK|HIDE|REACH|PROBE|EXAMINE|STRIP|HELP|SCARE|DODGE|DESCEND|FEEL|LOWER|CLEAR|LIFT|DIVE|LOOK|STAND|SEARCH|CHECK|INSPECT|MOVE|KEEP|WALK|HEAD|FIGHT|OFFER|WARN|BACK|USE|ENTER|STUDY|READ|WAIT|PAY|FORCE|SMASH|OPEN|STRIP|CLIMB|TAKE|CIRCLE|GIVE|QUESTION|CRUSH|KICK|THROW|HOLD|RUSH|SNEAK|INTIMIDATE|POKE|BARGAIN|STEAL|CONTINUE|RETURN|ATTACK|PLAY|LEAVE|TALK|APPROACH|BAR|TRADER|WORKSHOP|CLINIC|BANK|BULLETIN|RENT|BEER|SHOT|HOUSE SPECIAL|GAMBLE|DEPOSIT|WITHDRAW|SELL|BUY|SAVE|STATUS|INVENTORY|MAP|TESTING|CONFIRM|CANCEL|YES|NO|MAKE CAMP|REMAIN|ASK|TOWN|DECLINE|ACCEPT)/i;
  return parts.filter(p=>verbs.test(p)).length >= 2;
}
// v33: action numbers are assigned once per displayed choice group.
// Full-word commands remain valid for compatibility with older saves.
const RESERVED_INTERFACE_KEYS=new Set(["I","S","M","Q","V","H"]);
function choiceCommand(label){
  const clean=String(label).replace(/^\([A-Z0-9]\)\s*/i,"").trim();
  return clean.split(/\s+[—–]\s+/)[0].replace(/\s*\[ENTER\]/gi,"").trim().toLowerCase();
}
function hotkeyLine(text){
  const parts=String(text??"").split(/\s{2,}/).map(x=>x.trim()).filter(Boolean);
  const line=parts.map(part=>{
    if(/^\(B\)\s*BACK$/i.test(part)){currentHotkeys.b="back";return part;}
    const command=choiceCommand(part);
    const letter=part.match(/^\(([A-Z])\)/);
    if(letter && !["B","I","S","M","Q","V"].includes(letter[1]) && !currentHotkeys[letter[1].toLowerCase()])currentHotkeys[letter[1].toLowerCase()]=command;
    if(!command) return part;
    const index=Object.keys(numberedChoices).length+1;
    if(index>99) return part;
    numberedChoices[String(index)]=command;
    return `[${index}] ${part.replace(/^\([A-Z0-9]\)\s*/i,"")}`;
  }).join("   ");
  refreshInterfaceShortcutLabels();return line;
}
function renderNumberedChoices(text){
  // Choices may be on a single line, with or without legacy letter labels.
  if(!text)return text;
  // Explicit numbered menus already own their labels; register them without renumbering.
  if(/^\[\d+\]\s/.test(text)){
    for(const match of text.matchAll(/\[(\d+)\]\s+(.+?)(?=\s{2,}\[\d+\]|\s{2,}\(B\)|$)/g)){
      numberedChoices[match[1]]=choiceCommand(match[2]);
    }
    if(/\(B\)\s*BACK/.test(text))currentHotkeys.b="back";
    return text;
  }
  if(!/\s{2,}/.test(text) && !/^\([A-Z0-9]\)/.test(text) && !/^(LISTEN|LOG COORDINATES|BUY .+)$/.test(text))return text;
  // Persistent navigation is LETTERS ONLY, never allocate numbered actions.
  if(text.split(/\s{2,}/).every(p=>/^\([SIMQV]\) (STATUS|INVENTORY|MAP|QUESTS|SAVE)$/.test(p.trim())))return text;
  if(!looksLikeChoiceLine(text,"system") && !/^\([A-Z0-9]\)/.test(text) && !/^(LISTEN|LOG COORDINATES|BUY .+)$/.test(text))return text;
  return hotkeyLine(text);
}
let outputQueue = Promise.resolve();
function stableColorPositions(name,count){
  const chars=[...name].map((c,i)=>/[A-Z]/i.test(c)?i:-1).filter(i=>i>=0); if(!chars.length)return [];
  let h=0; for(const c of name) h=(h*31+c.charCodeAt(0))>>>0;
  const out=[]; while(chars.length&&out.length<count){ const idx=h%chars.length; out.push(chars.splice(idx,1)[0]); h=(h*1103515245+12345)>>>0; }
  return out;
}
function paintName(div,text,name,klass){
  const count=player.level<5?Math.min(2,name.length):Math.max(2,Math.min(name.length,Math.ceil(name.length*0.5)));
  const pos=stableColorPositions(name,count); div.textContent="";
  for(let i=0;i<text.length;i++){ if(i<name.length&&pos.includes(i)){const sp=document.createElement("span");sp.className=klass;sp.textContent=text[i];div.append(sp);}else div.append(document.createTextNode(text[i])); }
}
function colorField(div,text,klass,fraction,start=0,end=text.length){
  const part=text.slice(start,end),count=Math.ceil((part.match(/[A-Za-z]/g)||[]).length*fraction),positions=new Set(stableColorPositions(part,count));
  div.textContent="";
  for(let i=0;i<text.length;i++){if(i>=start&&i<end&&positions.has(i-start)){const span=document.createElement("span");span.className=klass;span.textContent=text[i];div.append(span);}else div.append(document.createTextNode(text[i]));}
}
function earlyColorPhase(){
  const turns=Math.max(0,Number(player.lifetimeTurns)||0);
  return turns<6?0:turns<11?1:turns<16?2:turns<21?3:turns<26?4:5;
}
function applyLevelEvolution(div,text,cls=""){
  if(player&&player.level>=5)return applyV48Colors(div,text,cls);
  if(!player||!text)return;
  const phase=earlyColorPhase();
  if(!phase)return;
  if(/system|ui/.test(cls)&&!cls.includes("quest-banner"))return;
  const upper=text.toUpperCase();
  const equipment=Object.keys(GEAR).find(name=>upper.includes(name.toUpperCase()));
  if(equipment){
    const g=GEAR[equipment];
    if(phase>=3&&g.rarity!=="common"){
      const start=upper.indexOf(equipment.toUpperCase());
      colorField(div,text,"rarity-"+g.rarity,phase===3?.12:phase===4?.20:.28,start,start+equipment.length);
    }else if(phase>=1)colorField(div,text,"evo-yellow",phase===1?.035:phase===2?.20:.40);
    return;
  }
  const npcMatch=upper.match(/^(TIM|MURPHY|JEN|WAYNE|JOHNNY|AMII)\b/);
  const named=!!npcMatch;
  const wandererName=(typeof wanderers!=="undefined"?wanderers:[]).find(w=>upper.startsWith(w.name.toUpperCase()) && (upper.length===w.name.length || !/[A-Z0-9]/i.test(text[w.name.length]||"")));
  if((named||wandererName)&&phase>=3){
    // Color only the speaker/name token. Coloring random letters across the full
    // line caused dialogue/description color leakage (notably Hollis).
    const name=named?npcMatch[0]:wandererName.name;
    const klass=named&&phase>=4?"npc-blue":"wanderer-green";
    colorField(div,text,klass,1,0,name.length);
    return;
  }
  colorField(div,text,"evo-yellow",[0,.035,.20,.40,.55,.70][phase]);
}

function normalizeQuestNotice(text,cls){
  text=String(text??"");
  const original=text;
  text=text.replace(/^NEW MAIN QUEST\s*[—–-]\s*/i,"NEW QUEST — ").replace(/^MAIN QUEST COMPLETE\s*[—–-]\s*/i,"QUEST COMPLETED — ").replace(/^QUEST ADDED\s*[—–-]\s*/i,"NEW QUEST — ").replace(/^QUEST COMPLETE\s*[—–-]\s*/i,"QUEST COMPLETED — ").replace(/^LEAD ADDED\s*[—–-]\s*/i,"NEW QUEST — ");
  if(/^(NEW QUEST|QUEST UPDATED|QUEST COMPLETED)\b/.test(text))cls="quest-banner";
  return {text,cls};
}
function add(text = "", cls = "") {
  ({text,cls}=normalizeQuestNotice(text,cls));
  if(cls.includes("place") || (!cls.includes("system") && text)) { currentHotkeys={}; numberedChoices={}; usedHotkeys=new Set(); }
  if(cls.includes("system")) text=renderNumberedChoices(text);
  const div = document.createElement("div");
  div.className = `line ${cls}`;
  const finalText = text;
  // One authoritative gameplay-output path: enqueue once, render once.
  outputQueue = outputQueue.then(async()=>{
    screen.appendChild(div);
    const paced = finalText && !cls.includes("system") && !cls.includes("reward") && !cls.includes("danger") && !cls.includes("quest-banner");
    if(paced){
      const speed = cls.includes("place") ? 24 : 18;
      for(const ch of finalText){ div.append(document.createTextNode(ch)); followOutput(); await sleep(speed); }
      await sleep(cls.includes("place") ? 220 : 145);
    } else { div.textContent = finalText; await sleep(finalText ? 45 : 10); }
    applyLevelEvolution(div, finalText, cls);
    followOutput();
  });
}
function addImmediate(text = "", cls = "") {
  ({text,cls}=normalizeQuestNotice(text,cls));
  const div=document.createElement("div");
  div.className=`line ${cls}`;
  div.textContent=text;
  screen.appendChild(div);
  applyLevelEvolution(div,text,cls);
  return div;
}
function queueChoiceLine(text){
  // Choice text is queued after narrative so the player never gets a naked prompt.
  outputQueue = outputQueue.then(()=>{
    currentHotkeys={}; numberedChoices={}; usedHotkeys=new Set();
    const line=renderNumberedChoices(text);
    addImmediate(line,"system"); followOutput();
  });
}
async function typeLine(text, cls = "", speed = 18) {
  const div = document.createElement("div");
  div.className = `line ${cls}`;
  screen.appendChild(div);
  for (const ch of text) { div.textContent += ch; followOutput(); await sleep(speed); }
  applyLevelEvolution(div,text,cls);
  followOutput();
}
function v49LiveMap(){
 const el=document.querySelector('#live-map');if(!el)return;
 if(player.level<5||!player.flags?.interfaceUnlocked||['title','wake','standing','handle','confirmHandle'].includes(stage)){el.hidden=true;return;}
 el.hidden=false;
 let st=gameplayStageForSave();
 if(st==='port55Pets')st=returnStage||'between';
 if(st==='port55Recruit')st=player.flags.portHireOffer?.origin||'between';
 // Seaport contexts must not fall through to the older Solace/Factory road map.
 const source=st==='combat'?combatState?.source:null;
 if(st==='portObstruction'){el.textContent='SEAPORT ROAD  FACTORY ── [ COLLAPSED OVERPASS <YOU> ] ── SEAPORT';return;}
 if(st==='portRoad'||source==='seaportRoadFight'){
  const pos=Math.max(0,Math.min(5,Number(player.flags.seaportRoute?.position)||0));
  const nodes=Array.from({length:6},(_,i)=>i===pos?'<YOU>':i===0?'FACTORY':i===5?'SEAPORT':'o');
  el.textContent='SEAPORT ROAD  '+nodes.join(' ─ ');return;
 }
 if(st==='seaport'||st.startsWith('port55')||['portMarket','portClinic','portDocks','portWatch'].includes(st)||source==='seaportLiberation'||st==='mercy'&&player.flags.port55Casino){
  const loc={port55Market:'MARKET AREA',port55Vendor:'PET STORE',port55Mia:'THE RUSTY ANCHOR',port55Kaiden:'KAIDEN',port55Docks:'HARBOR DOCKS',portMarket:'MARKET',portClinic:'CLINIC',portDocks:'DOCKS',portWatch:'GATE WATCH',port55Service:player.flags.portStaffUI?.role}[st]||(st==='port55Stop'?player.flags.port55CurrentStop:player.flags.port55Casino?'THE RUSTY ANCHOR':'HARBOR STREETS');
  el.textContent=`SEAPORT  [ ${String(loc||'HARBOR STREETS').toUpperCase()} <YOU> ]`;return;
 }
 const east=roadGoal==='east'||['eastEnd','factoryWorkshop','factoryTerminal','factoryForge','factoryBench'].includes(st);
 const dir=east?(player.flags.eastReturning?'← WEST':'→ EAST'):(roadGoal==='house'?'← WEST':'→ EAST');
 if(st.startsWith('factoryDungeon')){el.textContent='FACTORY  [ FORGE WORKSHOP ] ── [ CENTRAL STAIRWELL ] ── [ INNER WORKS <YOU> ]';return;}
 if(st.startsWith('factory')){el.textContent=`FACTORY  [ ENTRANCE ] ── [ WORKSHOP <YOU> ] ── [ SEALED DOOR ]  |  ${st.replace('factory','').toUpperCase()}`;return;}
 if(st==='eastEnd'){el.textContent='EAST ROAD  SOLACE ── o ── o ── o ── FACTORY <YOU>  |  ← WEST';return;}
 if(st==='mercy'||st==='settlement'){
  const name={town:'MAIN STREET',gate:'WEST GATE',eastGate:'EAST GATE',jen:"THE RUSTY LANTERN TAVERN",johnny:"JOHNNY'S TRADING POST",amii:"SOLACE SAVINGS & LOAN",murphy:"MURPHY'S MOTOR WORKS",wayne:"LAST CHANCE CLINIC",relay:'RELAY STATION',mara:'SCRAP & STEEL ARMORY'}[mercyLocation]||'SOLACE';
  el.textContent=`SOLACE  WEST GATE ── [ ${name} <YOU> ] ── EAST GATE`;return;
 }
 if(st==='house'||st==='roadReady'){el.textContent='WEST ROAD  [ OLD HOUSE <YOU> ] ── o ── o ── SOLACE  |  → EAST';return;}
 if(['serviceRoad','relayBranch'].includes(st)){el.textContent=`${st==='serviceRoad'?'SERVICE ROAD':'LOWER ACCESS ROAD'}  FORK ── ${'o ── '.repeat(Math.max(0,Math.min(3,serviceRoadDepth)))}<YOU>  |  ${player.flags.branchReturning?'← RETURN':'→ OUTBOUND'}`;return;}
 const total=Math.max(1,roadTripLength||8),pos=Math.max(0,Math.min(total,roadTurn+(roadTurnCharged?1:0)));
 const nodes=Array.from({length:total+1},(_,i)=>i===pos?'<YOU>':i===0?(east?'SOLACE':'HOUSE'):i===total?(east?'FACTORY':'SOLACE'):'o');
 el.textContent=`${east?'EAST ROAD':'WEST ROAD'}  ${nodes.join(' ─ ')}  |  ${dir}`;
}
function updateHud() {
  const navUnlocked=player.level>=5 && !!player.flags?.interfaceUnlocked;
  const liveNav=document.querySelector("#live-map");
  if(liveNav && !navUnlocked)liveNav.hidden=true;
  // Level gate is authoritative even when an old save already unlocked the interface.
  document.body.classList.toggle("early-no-nav",!navUnlocked);
  v49LiveMap();
  document.body.classList.toggle("v48-level5",player.level>=5);
  document.querySelector("#hud-level").textContent = String(player.level).padStart(2,"0");
  document.querySelector("#hud-hp").textContent = `${player.hp}/${player.maxHp}`;
  document.querySelector("#hud-xp").textContent = player.level >= 50 ? "MAX LEVEL" : `${player.xp}/${player.nextXp}`;
  document.querySelector("#hud-bolts").textContent = player.bolts;
  document.querySelector("#hud-turns").textContent = testMode ? "∞ TEST" : `${player.turns}/${player.maxTurns}`;
  document.querySelector("#hud-pack").textContent = `${packSlotsUsed()}/${player.packMax}`; const ht=document.querySelector("#hud-time"); if(ht)ht.textContent=timePhase();
  document.querySelector("#side-level").textContent = `LV ${String(player.level).padStart(2,"0")}`;
  document.querySelector(".utility-name").childNodes[0].nodeValue = `${player.handle || "---"} `;
  document.querySelector("#side-hp").textContent = `${player.hp} / ${player.maxHp}`;
  const xpBar=document.querySelector("#side-xp");
  if(xpBar){ xpBar.hidden=player.level<5; if(player.level>=50){xpBar.textContent="MAX LEVEL";} else if(player.level>=5){ const filled=Math.max(0,Math.min(10,Math.floor(10*player.xp/Math.max(1,player.nextXp)))); xpBar.textContent=`XP [${"#".repeat(filled)}${"-".repeat(10-filled)}]`; } }
  document.querySelector("#side-bolts").textContent = player.bolts;
  const inv=document.querySelector("#side-inv");if(inv){inv.textContent=`${packSlotsUsed()}/${player.packMax}`;inv.classList.toggle("pack-full",packSlotsUsed()>=player.packMax);}
  document.querySelector("#side-turns").textContent = testMode ? "∞ TEST" : `${player.turns} / ${player.maxTurns}`; const st=document.querySelector("#side-time"); if(st)st.textContent=timePhase();
  updateRefillDisplay();
}
function spendTurns(count=1){
  if(!Number.isInteger(count)||count<0) return false;
  if(!testMode && player.turns<count) return false;
  if(!testMode)player.turns-=count;
  dailyRoadTurns+=count;
  player.lifetimeTurns=(Number(player.lifetimeTurns)||0)+count;
  player.flags.worldHour=((player.flags.worldHour??8)+count)%24;
  updateHud(); return true;
}
function spendTurn(){ return spendTurns(1); }
function timePhase(){ const h=player.flags.worldHour??8; return h<6?"DARK":h<8?"DAWN":h<17?"DAY":h<20?"DUSK":"DARK"; }
function isDark(){ return timePhase()==="DARK"; }
function ensureRefillClock(){ if(!player.flags) player.flags={}; if(!player.flags.nextRefillAt) player.flags.nextRefillAt=Date.now()+REFILL_MS; }
function restoreTurnLocation(){
  const suspended=gameplayStageForSave();
  if(!["zeroTurns","overnightConfirm"].includes(suspended))return false;
  const resume=player.flags.turnResumeStage||"between";
  if(stage===suspended)stage=resume;else returnStage=resume;
  player.flags.turnResumeStage="";player.flags.overnight="";player.flags.overnightLocked=false;player.flags.pendingOvernight="";
  return true;
}
// Provisional v44 balance constants; percentages/prices are NOT user-approved final balance.
const OVERNIGHT_RISK=Object.freeze({camp:{chance:.08,maxBolts:8,maxItems:1},road:{chance:.30,maxBolts:20,maxItems:2},room:{chance:0,maxBolts:0,maxItems:0},minecamp:{chance:0,maxBolts:0,maxItems:0}});
function overnightLabel(choice){return choice==="minecamp"?"MINE-PROTECTED CAMP":choice==="camp"?"MAKE CAMP":choice==="room"?"RENTED ROOM":"REMAIN ON ROAD";}
function overnightRoomAvailable(){const origin=["zeroTurns","overnightConfirm"].includes(stage)?player.flags.turnResumeStage:stage;return origin==="mercy"&&!!player.flags.rentedRoom;}
function r18ExactTent(name){return player.pack.find(i=>i.name===name&&!['key','quest'].includes(i.type)&&i.qty>0&&!i.protected&&!i.unique);}
function r18MineCampAllowed(){const origin=['zeroTurns','overnightConfirm'].includes(stage)?player.flags.turnResumeStage:stage;const outdoor=['lanternRoad','lanternNode','encounter','between','turnComplete','questRoadComplete','serviceRoad','relayBranch','roadReady'].includes(origin);const g=typeof lanternState==='function'?lanternState():null;return outdoor&&!(g&&!g.currentEdgeId&&['house','solace','factory','seaport'].includes(g.nodeId));}
function r18ConsumeExactTent(name){const i=r18ExactTent(name);if(!i)return false;i.qty--;if(i.qty<=0)player.pack.splice(player.pack.indexOf(i),1);updateHud();return true;}
function overnightChoices(){return ["(C) MAKE CAMP — CONSUMES 1 TENT / LOW LOSS RISK",...(r18ExactTent("Mine-Protected Tent")&&r18MineCampAllowed()?["MAKE CAMP WITH MINE TENT — CONSUMES 1 MINE-PROTECTED TENT / NO LOSS"]:[]),"(R) REMAIN ON ROAD — HIGHER LOSS RISK",...(overnightRoomAvailable()?["(J) USE RENTED ROOM — NO LOSSES"]:[])].join("   ");}
function legacyOvernightRng(){let seed=0;for(const ch of `${player.characterId||player.handle}|${player.flags.nextRefillAt}|${player.flags.overnight||"road"}`)seed=(Math.imul(seed,31)+ch.charCodeAt(0))>>>0;return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function planOvernight(choice,rng=Math.random){
 const config=OVERNIGHT_RISK[choice]||OVERNIGHT_RISK.road,plan={choice,dueAt:player.flags.nextRefillAt,bolts:0,items:[],applied:false};
 if(rng()>=config.chance)return plan;
 plan.bolts=Math.min(player.bolts,config.maxBolts?1+Math.floor(rng()*config.maxBolts):0);
 const candidates=player.pack.filter(i=>!["key","quest"].includes(i.type)&&i.name!==player.weapon&&i.name!==player.armor&&i.name!==player.accessory&&!protectedUniqueEquipment(i.name)).map(i=>({...i}));
 let available=candidates.reduce((a,i)=>a+i.qty,0),remaining=Math.min(config.maxItems,Math.max(0,available-1));
 while(remaining>0&&candidates.length){const item=candidates[Math.floor(rng()*candidates.length)];if(item.qty<=0){candidates.splice(candidates.indexOf(item),1);continue;}item.qty--;remaining--;let loss=plan.items.find(i=>i.name===item.name&&i.type===item.type&&!!i.stolen===!!item.stolen);if(loss)loss.qty++;else plan.items.push({name:item.name,type:item.type,qty:1,...(item.stolen?{stolen:true}:{})});}
 return plan;
}
function sealOvernight(choice){
 if(player.flags.overnightLocked)return false;
 if(player.turns>0){add("Turns have already refilled; no overnight choice is needed.","system");return false;}
 if(choice==="camp"&&!r18ExactTent("Tent")){add("MAKE CAMP REQUIRES 1 TENT. Johnny sells replacements.","system");return false;}
 if(choice==="minecamp"&&(!r18MineCampAllowed()||!r18ExactTent("Mine-Protected Tent"))){add("A Mine-Protected Tent and an outdoor road location are required.","system");return false;}
 if(choice==="room"&&!overnightRoomAvailable()){add("No paid room is available here. Rent one from Jen while in Solace.","system");return false;}
 if(choice==="camp")r18ConsumeExactTent("Tent");
 if(choice==="minecamp")r18ConsumeExactTent("Mine-Protected Tent");
 if(choice==="room")player.flags.rentedRoom=false;
 player.flags.overnight=choice;player.flags.overnightPlan=planOvernight(choice);player.flags.overnightLocked=true;player.flags.pendingOvernight="";
 add(`${overnightLabel(choice)} LOCKED — ${choice==="minecamp"?"1 Mine-Protected Tent consumed. No overnight losses.":choice==="camp"?"1 Tent consumed. Low loss risk.":choice==="room"?"Your paid room guarantees no overnight losses.":"Higher loss risk. No supplies required."} No overnight loot.`,"reward");return true;
}
function resolveOvernight(refillAt){
 const f=player.flags;
 if(!f.overnightPlan&&(f.overnightLocked||player.turns===0)){f.overnight=f.overnight||"road";f.overnightPlan=planOvernight(f.overnight,legacyOvernightRng());}
 const plan=f.overnightPlan;if(!plan||plan.applied||refillAt<plan.dueAt)return;
 const lostBolts=Math.min(player.bolts,Math.max(0,plan.bolts));player.bolts-=lostBolts;
 const losses=[];
 for(const requested of plan.items){const item=player.pack.find(i=>i.name===requested.name&&i.type===requested.type&&!!i.stolen===!!requested.stolen);if(!item||["key","quest"].includes(item.type)||item.name===player.weapon||item.name===player.armor||item.name===player.accessory||protectedUniqueEquipment(item.name))continue;
 const total=player.pack.filter(i=>!["key","quest"].includes(i.type)&&i.name!==player.weapon&&i.name!==player.armor&&i.name!==player.accessory&&!protectedUniqueEquipment(i.name)).reduce((a,i)=>a+i.qty,0),qty=Math.min(item.qty,requested.qty,Math.max(0,total-1));
 if(qty>0){item.qty-=qty;if(item.qty===0)player.pack.splice(player.pack.indexOf(item),1);losses.push({name:item.name,qty});}}
 plan.applied=true;f.lastOvernightResult={choice:plan.choice,at:refillAt,lostBolts,losses};
 add(`OVERNIGHT RESULT — ${overnightLabel(plan.choice)}`,"place");
 if(!lostBolts&&!losses.length)add("Your belongings are intact. No overnight losses.","system");
 else{if(lostBolts)add(`LOST: ${lostBolts} BOLTS`,"system");for(const loss of losses)add(`LOST: ${loss.name} ×${loss.qty}`,"system");}
 f.overnightLocked=false;f.pendingOvernight="";
}

function processRefill(){ ensureRefillClock(); let t=Number(player.flags.nextRefillAt)||Date.now()+REFILL_MS; const now=Date.now(); let gained=0; while(now>=t){ resolveOvernight(t);player.turns=Math.min(player.maxTurns,player.turns+TURN_REFILL_AMOUNT); t+=REFILL_MS; gained+=TURN_REFILL_AMOUNT; } player.flags.nextRefillAt=t; if(gained){dailyRoadTurns=0; refreshVendorStock();} if(gained && player.turns>0 && restoreTurnLocation()){ add(`EXPEDITION TURNS RESTORED — +${gained} TURNS`,"reward"); add("Your overnight state has ended. Route 127 is open again.","system"); } }
function refillText(){ ensureRefillClock(); const ms=Math.max(0,Number(player.flags.nextRefillAt)-Date.now()); const sec=Math.ceil(ms/1000), h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), ss=sec%60; return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(ss).padStart(2,"0")}`; }
function updateRefillDisplay(){ if(!player.flags)return; processRefill(); const txt=testMode?"PAUSED / TEST":refillText(); const h=document.querySelector("#hud-refill"), side=document.querySelector("#side-refill"); if(h)h.textContent=txt;if(side)side.textContent=txt; }
function startRefillTimer(){ if(refillTimer)clearInterval(refillTimer); refillTimer=setInterval(()=>{updateRefillDisplay();},1000); updateRefillDisplay(); }
function resultLine(text, cls="reward") { if(resultBuffer) resultBuffer.push([text,cls]); else add(text,cls); }
function flushResults(){ if(!resultBuffer || !resultBuffer.length){ resultBuffer=null; return; } add("RESULT", "system"); for(const [t,c] of resultBuffer) add(t,c); resultBuffer=null; }
function gainBolts(n) { if(stage==="fallen")return; player.bolts += n; updateHud(); resultLine(`+${n} BOLTS`, "reward"); }
// R17 base HP interpolates deterministically between approved milestones.
const HP_MILESTONES=[[1,100],[5,180],[10,350],[20,900],[30,1700],[40,2750],[50,4000]];
function baseHpForLevel(level){
 const l=Math.max(1,Math.min(50,Math.floor(Number(level)||1)));
 for(let i=1;i<HP_MILESTONES.length;i++){
  const [hi,hp]=HP_MILESTONES[i],[lo,lowHp]=HP_MILESTONES[i-1];
  if(l<=hi)return Math.round(lowHp+(hp-lowHp)*(l-lo)/(hi-lo));
 }
 return 4000;
}
function syncLevelMaxHp(){
 const gearHp=(Number(GEAR[player.armor]?.maxHpBonus)||0)+(Number(GEAR[player.accessory]?.maxHpBonus)||0);
 player.maxHp=baseHpForLevel(player.level)+gearHp;
 player.hp=Math.max(0,Math.min(Number(player.hp)||0,player.maxHp));
}
function migrateHealthProgress(){
 const oldMax=Number(player.maxHp),oldHp=Number(player.hp);
 const ratio=Number.isFinite(oldHp)&&Number.isFinite(oldMax)&&oldMax>0?Math.max(0,Math.min(1,oldHp/oldMax)):0;
 syncLevelMaxHp();
 player.hp=oldHp>0?Math.max(1,Math.min(player.maxHp,Math.round(ratio*player.maxHp))):0;
}
// XP is progress within the current level, not lifetime XP.
const XP_V2_EARLY = [100,150,225,338,507,761,1142,1713,2570];
function xpThresholdForLevel(level) {
  if (level >= 50) return 0;
  if (level < 10) return XP_V2_EARLY[Math.max(0, level - 1)];
  return 3855 + (level - 10) * 500;
}
function migrateXpProgress() {
  // Preserve the stored current-level XP verbatim. No level or heal on load.
  player.nextXp = xpThresholdForLevel(player.level);
}
function gainXp(n) {
  if(stage === "fallen") return;
  if(typeof combatState!=="undefined"&&combatState&&player.accessory==="Keeper's Lantern"&&n>0)n=Math.ceil(n*1.05);
  if(n>0&&player.accessory==="The River Before"&&(typeof combatState==="undefined"||!combatState)&&stage==="encounter"&&player.flags.r10LastRoadCategory==="exploration"){const bonus=n*.02+(Number(player.flags.wo2RiverXpRemainder)||0),whole=Math.floor(bonus+1e-9);player.flags.wo2RiverXpRemainder=bonus-whole;n+=whole;}
  player.xp += n;
  resultLine(`+${n} XP`, "reward");
  // Preserved over-threshold legacy XP is processed only after a positive award.
  while (n > 0 && player.level < 50 && player.xp >= player.nextXp) {
    player.xp -= player.nextXp;
    player.level += 1;
    player.nextXp = xpThresholdForLevel(player.level);
    const previousMaxHp=player.maxHp;
    syncLevelMaxHp();
    player.hp = player.maxHp;
    add(`LEVEL UP — LEVEL ${String(player.level).padStart(2,"0")}`, "bright");
    add(player.level >= 50 ? `MAX HP +${player.maxHp-previousMaxHp}   MAX LEVEL` : `MAX HP +${player.maxHp-previousMaxHp}   NEXT LEVEL: ${player.nextXp} XP`, "reward");
  }
  ensureSteveAnnouncements();
  updateHud();
}
function tryNikoSecondChance(){
  const collarEquipped=player.accessory==="Niko's Collar";
  const today=Number(day)||1;
  if(!collarEquipped || player.hp>0 || Number(player.flags.nikoSecondChanceDay)===today)return false;
  player.flags.nikoSecondChanceDay=today;
  player.hp=1;
  updateHud();
  add("NIKO'S COLLAR FLASHES WARM. You collapse to one knee, alive at 1 HP. The collar's Second Chance is spent for today.","legendary");
  // Use the established retreat routing so a rescued character never remains
  // in the combat stage with an empty combatState (an unplayable softlock).
  if(combatState)handleCombat("flee");
  else if(stage==="combat"){stage="fallen";add("(1) GET UP","system");}
  return true;
}
function handlePlayerDeath(){
  if(stage==="fallen") return;
  if(tryNikoSecondChance())return;
  if(player.flags.r18HorseOwned){delete player.flags.r18HorseOwned;add('The horse runs off during your rescue.','system');}
  player.deathStreak=(player.deathStreak||0)+1;
  const graphRescue=typeof lanternRescuePlan==='function'?lanternRescuePlan():null;
  const inTown=graphRescue?graphRescue.node!=='house':player.flags.mercyDiscovered;
  const defeatedByGateGuards=!!(combatState&&combatState.source==="gateGuards");
  const jenGateRescue=defeatedByGateGuards&&!player.flags.jenGateRescueUsed;
  if(jenGateRescue)player.flags.jenGateRescueUsed=true;
  // Remaining road segments are the minimum rescue travel cost; recovery adds two.
  const atHouse=stage==="house" || ["houseStorage","houseDeposit","houseWithdraw"].includes(stage) || (combatState&&combatState.source==="houseBoss");
  const travel=graphRescue?graphRescue.travel:atHouse ? (inTown?roadTripLength:0) : inTown ? (roadGoal==="house"?Math.max(0,roadTripLength-roadTurn):roadGoal==="mercy"?Math.max(0,roadTripLength-roadTurn):roadGoal==="east"?Math.max(0,roadTurn+1):0) : Math.max(0,roadTurn+1);
  const penalty=travel+2;
  player.turns=Math.max(0,player.turns-penalty);
  dailyRoadTurns+=travel; // rescue travels the route; recovery itself is not a road turn
  player.hp=Math.max(1,Math.round(player.maxHp*.5));
  if(combatState&&combatState.source==="jenBoss")player.flags.jenQuest="raiders";
  combatState=null; currentRoadWanderer=null; updateHud();
  add("YOU HAVE FALLEN","danger");
  add("Your vision fades as the wasteland goes silent.");
  add(graphRescue?`Hours later, you wake in ${LG_NODES[graphRescue.node].name}.`:inTown?"Hours later, you wake on a cot in Solace.":"Hours later, you wake in the old house.");
  if(jenGateRescue)add("JEN > The gate guards were going to leave you out there. I brought you back myself. Don't make me do that twice.","bright");
  else add("Someone dragged you back from the highway. They didn't do it for free.");
  add(`RESCUE TRAVEL: ${travel} TURNS   RECOVERY: 2 TURNS   TOTAL: ${penalty}`, "system");
  add(`HP RESTORED: ${player.hp}/${player.maxHp}   EQUIPMENT AND QUEST ITEMS RETAINED`, "system");
  stage="fallen"; add("(1) GET UP", "system");
}
function hurt(n) { player.hp = Math.max(0, player.hp - n); updateHud(); resultLine(`-${n} HP`, "danger"); if(player.hp<=0) handlePlayerDeath(); }
function roadHazardDamage(raw) {
  // Fixed road-event injuries scale with the player's R17 base HP progression.
  // Combat retaliation uses its separate enemy-level formula; do not double-scale it.
  const level=Math.max(1,Math.min(50,Math.floor(Number(player.level)||1)));
  const oldBase=100+10*(level-1);
  const currentBase=baseHpForLevel(level);
  return Math.max(1,Math.round(Math.max(0,Number(raw)||0)*currentBase/oldBase));
}
function roadHurt(raw) { hurt(roadHazardDamage(raw)); }

const FACTORY_WEAPON_STATS={
 "King's Breaker":{rarity:"rare",type:"weapon",min:17,max:24},
 "Grinder's Cutter":{rarity:"rare",type:"weapon",min:20,max:27},
 "Chemist's Injector":{rarity:"epic",type:"weapon",min:23,max:30},
 "Foreman's Verdict":{rarity:"epic",type:"weapon",min:26,max:34},
 'Dockside Cleaver':{rarity:'rare',type:'weapon',min:16,max:25},
 'Salvage Hook':{rarity:'rare',type:'weapon',min:18,max:23},
 'Rotary Tooth':{rarity:'rare',type:'weapon',min:19,max:28},
 'Assembly Maul':{rarity:'rare',type:'weapon',min:21,max:26},
 'Containment Scalpel':{rarity:'epic',type:'weapon',min:22,max:31},
 'Reactive Prod':{rarity:'epic',type:'weapon',min:24,max:29},
 'Command Sledge':{rarity:'epic',type:'weapon',min:25,max:35},
 'Overseer Rail':{rarity:'epic',type:'weapon',min:27,max:33}
};
const GEAR={
 ...FACTORY_WEAPON_STATS,
 "Balanced Hunting Knife":{rarity:"rare",type:"weapon",min:14,max:20},
 "Precision Hunting Rifle":{rarity:"rare",type:"weapon",min:16,max:22},
 "Tempered Combat Machete":{rarity:"rare",type:"weapon",min:12,max:23},
 "Specialized Service Revolver":{rarity:"rare",type:"weapon",min:11,max:24},
 "Advanced Relay Vest":{rarity:"rare",type:"armor",def:7},
 "Padded Tactical Jacket":{rarity:"rare",type:"armor",def:6},
 "Tempered Leather Armor":{rarity:"rare",type:"armor",def:6},
 "Salvaged Security Vest":{rarity:"rare",type:"armor",def:8},
 "Insulated Patrol Coat":{rarity:"rare",type:"armor",def:7},
 "Rusted Pipe":{rarity:"common",type:"weapon",min:5,max:10},"Claw Hammer":{rarity:"uncommon",type:"weapon",min:7,max:13},"Tire Iron":{rarity:"rare",type:"weapon",min:13,max:20},"Yardman's Wrench":{rarity:"uncommon",type:"weapon",min:11,max:18},"Heavy Wrench":{rarity:"uncommon",type:"weapon",min:11,max:18},
 "Reinforced Pipe":{rarity:"uncommon",type:"weapon",min:7,max:12},"Tempered Steel Pipe":{rarity:"rare",type:"weapon",min:13,max:21},"Bluefang Hunting Knife":{rarity:"rare",type:"weapon",min:14,max:22},"Devastator's Iron Pipe":{rarity:"epic",type:"weapon",min:17,max:25},
 "Worn Jacket":{rarity:"common",type:"armor",def:2},"Reinforced Jacket":{rarity:"uncommon",type:"armor",def:4},"Padded Jacket":{rarity:"uncommon",type:"armor",def:4},"Reinforced Work Vest":{rarity:"uncommon",type:"armor",def:5},"Hardened Scavenger Coat":{rarity:"rare",type:"armor",def:7},"Highway Warden's Coat":{rarity:"rare",type:"armor",def:8},"Wraith's Reinforced Coat":{rarity:"epic",type:"armor",def:10},
 "Worn Leather Wristband":{rarity:"common",type:"accessory",def:1},
 "Lucky Bottle Cap":{rarity:"common",type:"accessory",min:1,max:1},
 "Worn Belt":{rarity:"common",type:"accessory",def:1},
 "Scavenger's Charm":{rarity:"uncommon",type:"accessory",def:1,min:1,max:1},
 "Reinforced Dog Tags":{rarity:"uncommon",type:"accessory",def:2},
 "Road Warrior's Bracelet":{rarity:"uncommon",type:"accessory",min:1,max:2},
 "Niko's Lucky Vest":{rarity:"common",type:"armor",def:2},
 "Giant Dog Bone":{rarity:"common",type:"consumable"},
 "Rusty License Plate":{rarity:"common",type:"accessory",def:1},
 "Niko's Collar":{rarity:"legendary",type:"accessory",def:3,maxHpBonus:15,critBonus:0.02,secondChance:true},
 "Iron Reaper":{rarity:"rare",type:"weapon",min:18,max:27,bleedChance:0.10}
};
// Generated equipment is reconstructed from its stable name before saves load.
// Non-enumerable entries keep the existing named-gear and quest pools unchanged.
const EQUIPMENT_QUALITIES=['common','uncommon','rare','epic','legendary'];
const EQUIPMENT_WEIGHTS=[
 [85,15,0,0,0],[75,23,2,0,0],[60,32,7,1,0],
 [45,37,14,3.9,.1],[35,40,19,5.5,.5],[25,40,25,9,1]
];
function protectedUniqueEquipment(name){return name==="The River Before"||name==="Keeper's Lantern"||name==="Niko's Collar"||name==="Crazy Steve's Sandwich Board"||/^Postman's Vest \(L\d{2} RARE\)$/.test(name);}
function generatedEquipmentName(type,level,rarity){return `Road ${type==='weapon'?'Weapon':'Armor'} L${String(level).padStart(2,'0')} ${rarity.toUpperCase()}`;}
for(let lv=1;lv<=50;lv++)for(let q=0;q<EQUIPMENT_QUALITIES.length;q++)for(const type of ['weapon','armor']){
 const rarity=EQUIPMENT_QUALITIES[q], name=generatedEquipmentName(type,lv,rarity);
 const stat=type==='weapon'?{min:5+Math.floor((lv-1)*.8)+q,max:10+Math.floor((lv-1)*.8)+q*2}:{def:2+Math.floor((lv-1)*.35)+q};
 Object.defineProperty(GEAR,name,{value:{type,rarity,level:lv,...stat},enumerable:false,configurable:false});
}
// The unique courier reward is reconstructed by name before old saves load.
function r18PostmanVestName(level){return `Postman's Vest (L${String(Math.max(1,Math.min(50,Math.floor(Number(level)||1)))).padStart(2,'0')} RARE)`;}
for(let lv=1;lv<=50;lv++)Object.defineProperty(GEAR,r18PostmanVestName(lv),{value:{type:'armor',rarity:'rare',level:lv,def:4+Math.floor((lv-1)*.35)},enumerable:false,configurable:false});
// Stable catalog entries use level-qualified names; existing named and Road gear remain unchanged.
const EQUIPMENT_CATALOG = [{"id":"weapon-common-rusted-pipe","name":"Rusted Pipe","type":"weapon","rarity":"common","subtype":"pipe","minLevel":1,"maxLevel":50,"description":"A pipe carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-common-splintered-club","name":"Splintered Club","type":"weapon","rarity":"common","subtype":"club","minLevel":1,"maxLevel":50,"description":"A club carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-common-tire-iron","name":"Tire Iron","type":"weapon","rarity":"common","subtype":"improvised weapon","minLevel":1,"maxLevel":50,"description":"A improvised weapon carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-common-claw-hammer","name":"Claw Hammer","type":"weapon","rarity":"common","subtype":"hammer","minLevel":1,"maxLevel":50,"description":"A hammer carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-common-kitchen-knife","name":"Kitchen Knife","type":"weapon","rarity":"common","subtype":"knife","minLevel":1,"maxLevel":50,"description":"A knife carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-common-broken-machete","name":"Broken Machete","type":"weapon","rarity":"common","subtype":"machete","minLevel":1,"maxLevel":50,"description":"A machete carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-common-reinforced-stick","name":"Reinforced Stick","type":"weapon","rarity":"common","subtype":"improvised weapon","minLevel":1,"maxLevel":50,"description":"A improvised weapon carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-common-rusted-hatchet","name":"Rusted Hatchet","type":"weapon","rarity":"common","subtype":"hatchet","minLevel":1,"maxLevel":50,"description":"A hatchet carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-common-pipe-wrench","name":"Pipe Wrench","type":"weapon","rarity":"common","subtype":"wrench","minLevel":1,"maxLevel":50,"description":"A wrench carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-common-scrap-metal-shiv","name":"Scrap Metal Shiv","type":"weapon","rarity":"common","subtype":"shiv","minLevel":1,"maxLevel":50,"description":"A shiv carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-common-makeshift-spear","name":"Makeshift Spear","type":"weapon","rarity":"common","subtype":"spear","minLevel":1,"maxLevel":50,"description":"A spear carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-common-wooden-baseball-bat","name":"Wooden Baseball Bat","type":"weapon","rarity":"common","subtype":"bat","minLevel":1,"maxLevel":50,"description":"A bat carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-common-rusted-revolver","name":"Rusted Revolver","type":"weapon","rarity":"common","subtype":"revolver","minLevel":1,"maxLevel":50,"description":"A revolver carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-common-homemade-pistol","name":"Homemade Pistol","type":"weapon","rarity":"common","subtype":"pistol","minLevel":1,"maxLevel":50,"description":"A pistol carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-common-sawed-off-shotgun","name":"Sawed-Off Shotgun","type":"weapon","rarity":"common","subtype":"shotgun","minLevel":1,"maxLevel":50,"description":"A shotgun carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-common-hunting-rifle","name":"Hunting Rifle","type":"weapon","rarity":"common","subtype":"rifle","minLevel":1,"maxLevel":50,"description":"A rifle carried and maintained for life on the wasteland road.","family":"hunting rifle"},{"id":"weapon-common-single-shot-rifle","name":"Single-Shot Rifle","type":"weapon","rarity":"common","subtype":"rifle","minLevel":1,"maxLevel":50,"description":"A rifle carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-common-rusted-crowbar","name":"Rusted Crowbar","type":"weapon","rarity":"common","subtype":"crowbar","minLevel":1,"maxLevel":50,"description":"A crowbar carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-common-heavy-flashlight","name":"Heavy Flashlight","type":"weapon","rarity":"common","subtype":"improvised weapon","minLevel":1,"maxLevel":50,"description":"A improvised weapon carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-common-scrap-cleaver","name":"Scrap Cleaver","type":"weapon","rarity":"common","subtype":"cleaver","minLevel":1,"maxLevel":50,"description":"A cleaver carried and maintained for life on the wasteland road.","family":null},{"id":"armor-common-torn-work-shirt","name":"Torn Work Shirt","type":"armor","rarity":"common","subtype":"shirt","minLevel":1,"maxLevel":50,"description":"A shirt carried and maintained for life on the wasteland road.","family":null},{"id":"armor-common-patched-denim-jacket","name":"Patched Denim Jacket","type":"armor","rarity":"common","subtype":"jacket","minLevel":1,"maxLevel":50,"description":"A jacket carried and maintained for life on the wasteland road.","family":null},{"id":"armor-common-worn-leather-vest","name":"Worn Leather Vest","type":"armor","rarity":"common","subtype":"vest","minLevel":1,"maxLevel":50,"description":"A vest carried and maintained for life on the wasteland road.","family":null},{"id":"armor-common-rusted-shoulder-plates","name":"Rusted Shoulder Plates","type":"armor","rarity":"common","subtype":"plate","minLevel":1,"maxLevel":50,"description":"A plate carried and maintained for life on the wasteland road.","family":null},{"id":"armor-common-scrap-metal-chestplate","name":"Scrap Metal Chestplate","type":"armor","rarity":"common","subtype":"chestplate","minLevel":1,"maxLevel":50,"description":"A chestplate carried and maintained for life on the wasteland road.","family":null},{"id":"armor-common-canvas-work-coat","name":"Canvas Work Coat","type":"armor","rarity":"common","subtype":"coat","minLevel":1,"maxLevel":50,"description":"A coat carried and maintained for life on the wasteland road.","family":null},{"id":"armor-common-roadside-scavenger-vest","name":"Roadside Scavenger Vest","type":"armor","rarity":"common","subtype":"vest","minLevel":1,"maxLevel":50,"description":"A vest carried and maintained for life on the wasteland road.","family":null},{"id":"armor-common-salvaged-police-vest","name":"Salvaged Police Vest","type":"armor","rarity":"common","subtype":"vest","minLevel":1,"maxLevel":50,"description":"A vest carried and maintained for life on the wasteland road.","family":null},{"id":"armor-common-cracked-motorcycle-jacket","name":"Cracked Motorcycle Jacket","type":"armor","rarity":"common","subtype":"jacket","minLevel":1,"maxLevel":50,"description":"A jacket carried and maintained for life on the wasteland road.","family":null},{"id":"armor-common-worn-combat-vest","name":"Worn Combat Vest","type":"armor","rarity":"common","subtype":"vest","minLevel":1,"maxLevel":50,"description":"A vest carried and maintained for life on the wasteland road.","family":null},{"id":"armor-common-highway-patrol-jacket","name":"Highway Patrol Jacket","type":"armor","rarity":"common","subtype":"jacket","minLevel":1,"maxLevel":50,"description":"A jacket carried and maintained for life on the wasteland road.","family":null},{"id":"armor-common-scrap-plate-armor","name":"Scrap Plate Armor","type":"armor","rarity":"common","subtype":"plate","minLevel":1,"maxLevel":50,"description":"A plate carried and maintained for life on the wasteland road.","family":null},{"id":"armor-common-reinforced-work-overalls","name":"Reinforced Work Overalls","type":"armor","rarity":"common","subtype":"overalls","minLevel":1,"maxLevel":50,"description":"A overalls carried and maintained for life on the wasteland road.","family":null},{"id":"armor-common-road-warrior-vest","name":"Road Warrior Vest","type":"armor","rarity":"common","subtype":"vest","minLevel":1,"maxLevel":50,"description":"A vest carried and maintained for life on the wasteland road.","family":null},{"id":"armor-common-dented-security-armor","name":"Dented Security Armor","type":"armor","rarity":"common","subtype":"armor","minLevel":1,"maxLevel":50,"description":"A armor carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-uncommon-reinforced-hunting-rifle","name":"Reinforced Hunting Rifle","type":"weapon","rarity":"uncommon","subtype":"rifle","minLevel":1,"maxLevel":50,"description":"A rifle carried and maintained for life on the wasteland road.","family":"hunting rifle"},{"id":"weapon-uncommon-sharpened-machete","name":"Sharpened Machete","type":"weapon","rarity":"uncommon","subtype":"machete","minLevel":1,"maxLevel":50,"description":"A machete carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-uncommon-balanced-hatchet","name":"Balanced Hatchet","type":"weapon","rarity":"uncommon","subtype":"hatchet","minLevel":1,"maxLevel":50,"description":"A hatchet carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-uncommon-modified-revolver","name":"Modified Revolver","type":"weapon","rarity":"uncommon","subtype":"revolver","minLevel":1,"maxLevel":50,"description":"A revolver carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-uncommon-combat-knife","name":"Combat Knife","type":"weapon","rarity":"uncommon","subtype":"knife","minLevel":1,"maxLevel":50,"description":"A knife carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-uncommon-double-barrel-shotgun","name":"Double-Barrel Shotgun","type":"weapon","rarity":"uncommon","subtype":"shotgun","minLevel":1,"maxLevel":50,"description":"A shotgun carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-uncommon-reinforced-baseball-bat","name":"Reinforced Baseball Bat","type":"weapon","rarity":"uncommon","subtype":"bat","minLevel":1,"maxLevel":50,"description":"A bat carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-uncommon-steel-pipe-maul","name":"Steel Pipe Maul","type":"weapon","rarity":"uncommon","subtype":"pipe","minLevel":1,"maxLevel":50,"description":"A pipe carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-uncommon-restored-service-pistol","name":"Restored Service Pistol","type":"weapon","rarity":"uncommon","subtype":"pistol","minLevel":1,"maxLevel":50,"description":"A pistol carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-uncommon-short-barrel-rifle","name":"Short-Barrel Rifle","type":"weapon","rarity":"uncommon","subtype":"rifle","minLevel":1,"maxLevel":50,"description":"A rifle carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-uncommon-serrated-cleaver","name":"Serrated Cleaver","type":"weapon","rarity":"uncommon","subtype":"cleaver","minLevel":1,"maxLevel":50,"description":"A cleaver carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-uncommon-military-entrenching-tool","name":"Military Entrenching Tool","type":"weapon","rarity":"uncommon","subtype":"improvised weapon","minLevel":1,"maxLevel":50,"description":"A improvised weapon carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-uncommon-tactical-crowbar","name":"Tactical Crowbar","type":"weapon","rarity":"uncommon","subtype":"crowbar","minLevel":1,"maxLevel":50,"description":"A crowbar carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-uncommon-heavy-crossbow","name":"Heavy Crossbow","type":"weapon","rarity":"uncommon","subtype":"crossbow","minLevel":1,"maxLevel":50,"description":"A crossbow carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-uncommon-reconditioned-smg","name":"Reconditioned SMG","type":"weapon","rarity":"uncommon","subtype":"smg","minLevel":1,"maxLevel":50,"description":"A smg carried and maintained for life on the wasteland road.","family":null},{"id":"armor-uncommon-reinforced-leather-jacket","name":"Reinforced Leather Jacket","type":"armor","rarity":"uncommon","subtype":"jacket","minLevel":1,"maxLevel":50,"description":"A jacket carried and maintained for life on the wasteland road.","family":null},{"id":"armor-uncommon-highway-patrol-armor","name":"Highway Patrol Armor","type":"armor","rarity":"uncommon","subtype":"armor","minLevel":1,"maxLevel":50,"description":"A armor carried and maintained for life on the wasteland road.","family":null},{"id":"armor-uncommon-scavenger-s-plated-vest","name":"Scavenger's Plated Vest","type":"armor","rarity":"uncommon","subtype":"plate","minLevel":1,"maxLevel":50,"description":"A plate carried and maintained for life on the wasteland road.","family":null},{"id":"armor-uncommon-military-surplus-vest","name":"Military Surplus Vest","type":"armor","rarity":"uncommon","subtype":"vest","minLevel":1,"maxLevel":50,"description":"A vest carried and maintained for life on the wasteland road.","family":null},{"id":"armor-uncommon-reinforced-motorcycle-armor","name":"Reinforced Motorcycle Armor","type":"armor","rarity":"uncommon","subtype":"armor","minLevel":1,"maxLevel":50,"description":"A armor carried and maintained for life on the wasteland road.","family":null},{"id":"armor-uncommon-road-guard-chestplate","name":"Road Guard Chestplate","type":"armor","rarity":"uncommon","subtype":"chestplate","minLevel":1,"maxLevel":50,"description":"A chestplate carried and maintained for life on the wasteland road.","family":null},{"id":"armor-uncommon-salvaged-tactical-armor","name":"Salvaged Tactical Armor","type":"armor","rarity":"uncommon","subtype":"armor","minLevel":1,"maxLevel":50,"description":"A armor carried and maintained for life on the wasteland road.","family":null},{"id":"armor-uncommon-mechanic-s-reinforced-suit","name":"Mechanic's Reinforced Suit","type":"armor","rarity":"uncommon","subtype":"suit","minLevel":1,"maxLevel":50,"description":"A suit carried and maintained for life on the wasteland road.","family":null},{"id":"armor-uncommon-wasteland-ranger-vest","name":"Wasteland Ranger Vest","type":"armor","rarity":"uncommon","subtype":"vest","minLevel":1,"maxLevel":50,"description":"A vest carried and maintained for life on the wasteland road.","family":null},{"id":"armor-uncommon-scrap-defender-armor","name":"Scrap Defender Armor","type":"armor","rarity":"uncommon","subtype":"armor","minLevel":1,"maxLevel":50,"description":"A armor carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-rare-precision-hunting-rifle","name":"Precision Hunting Rifle","type":"weapon","rarity":"rare","subtype":"rifle","minLevel":1,"maxLevel":50,"description":"A rifle carried and maintained for life on the wasteland road.","family":"hunting rifle"},{"id":"weapon-rare-modified-hunting-rifle","name":"Modified Hunting Rifle","type":"weapon","rarity":"rare","subtype":"rifle","minLevel":1,"maxLevel":50,"description":"A rifle carried and maintained for life on the wasteland road.","family":"hunting rifle"},{"id":"weapon-rare-highway-reaper","name":"Highway Reaper","type":"weapon","rarity":"rare","subtype":"improvised weapon","minLevel":1,"maxLevel":50,"description":"A improvised weapon carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-rare-ranger-s-revolver","name":"Ranger's Revolver","type":"weapon","rarity":"rare","subtype":"revolver","minLevel":1,"maxLevel":50,"description":"A revolver carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-rare-tactical-shotgun","name":"Tactical Shotgun","type":"weapon","rarity":"rare","subtype":"shotgun","minLevel":1,"maxLevel":50,"description":"A shotgun carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-rare-military-marksman-rifle","name":"Military Marksman Rifle","type":"weapon","rarity":"rare","subtype":"rifle","minLevel":1,"maxLevel":50,"description":"A rifle carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-rare-industrial-war-hammer","name":"Industrial War Hammer","type":"weapon","rarity":"rare","subtype":"hammer","minLevel":1,"maxLevel":50,"description":"A hammer carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-rare-steel-fang-machete","name":"Steel Fang Machete","type":"weapon","rarity":"rare","subtype":"machete","minLevel":1,"maxLevel":50,"description":"A machete carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-rare-suppressed-service-pistol","name":"Suppressed Service Pistol","type":"weapon","rarity":"rare","subtype":"pistol","minLevel":1,"maxLevel":50,"description":"A pistol carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-rare-veteran-s-assault-rifle","name":"Veteran's Assault Rifle","type":"weapon","rarity":"rare","subtype":"rifle","minLevel":1,"maxLevel":50,"description":"A rifle carried and maintained for life on the wasteland road.","family":null},{"id":"armor-rare-ranger-combat-armor","name":"Ranger Combat Armor","type":"armor","rarity":"rare","subtype":"armor","minLevel":1,"maxLevel":50,"description":"A armor carried and maintained for life on the wasteland road.","family":null},{"id":"armor-rare-reinforced-riot-armor","name":"Reinforced Riot Armor","type":"armor","rarity":"rare","subtype":"armor","minLevel":1,"maxLevel":50,"description":"A armor carried and maintained for life on the wasteland road.","family":null},{"id":"armor-rare-dominion-tactical-vest","name":"Dominion Tactical Vest","type":"armor","rarity":"rare","subtype":"vest","minLevel":1,"maxLevel":50,"description":"A vest carried and maintained for life on the wasteland road.","family":null},{"id":"armor-rare-salvaged-military-plate","name":"Salvaged Military Plate","type":"armor","rarity":"rare","subtype":"plate","minLevel":1,"maxLevel":50,"description":"A plate carried and maintained for life on the wasteland road.","family":null},{"id":"armor-rare-seaport-marine-armor","name":"Seaport Marine Armor","type":"armor","rarity":"rare","subtype":"armor","minLevel":1,"maxLevel":50,"description":"A armor carried and maintained for life on the wasteland road.","family":null},{"id":"armor-rare-highway-enforcer-armor","name":"Highway Enforcer Armor","type":"armor","rarity":"rare","subtype":"armor","minLevel":1,"maxLevel":50,"description":"A armor carried and maintained for life on the wasteland road.","family":null},{"id":"armor-rare-reinforced-combat-harness","name":"Reinforced Combat Harness","type":"armor","rarity":"rare","subtype":"harness","minLevel":1,"maxLevel":50,"description":"A harness carried and maintained for life on the wasteland road.","family":null},{"id":"armor-rare-wasteland-recon-armor","name":"Wasteland Recon Armor","type":"armor","rarity":"rare","subtype":"armor","minLevel":1,"maxLevel":50,"description":"A armor carried and maintained for life on the wasteland road.","family":null},{"id":"armor-rare-factory-security-armor","name":"Factory Security Armor","type":"armor","rarity":"rare","subtype":"armor","minLevel":1,"maxLevel":50,"description":"A armor carried and maintained for life on the wasteland road.","family":null},{"id":"armor-rare-armored-duster","name":"Armored Duster","type":"armor","rarity":"rare","subtype":"armor","minLevel":1,"maxLevel":50,"description":"A armor carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-epic-widowmaker","name":"Widowmaker","type":"weapon","rarity":"epic","subtype":"rifle","minLevel":1,"maxLevel":50,"description":"A rifle carried and maintained for life on the wasteland road.","family":"hunting rifle"},{"id":"weapon-epic-dead-reckoning","name":"Dead Reckoning","type":"weapon","rarity":"epic","subtype":"rifle","minLevel":1,"maxLevel":50,"description":"A rifle carried and maintained for life on the wasteland road.","family":"hunting rifle"},{"id":"weapon-epic-the-iron-executioner","name":"The Iron Executioner","type":"weapon","rarity":"epic","subtype":"improvised weapon","minLevel":1,"maxLevel":50,"description":"A improvised weapon carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-epic-ghostline-sniper-rifle","name":"Ghostline Sniper Rifle","type":"weapon","rarity":"epic","subtype":"rifle","minLevel":1,"maxLevel":50,"description":"A rifle carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-epic-thunderhead-shotgun","name":"Thunderhead Shotgun","type":"weapon","rarity":"epic","subtype":"shotgun","minLevel":1,"maxLevel":50,"description":"A shotgun carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-epic-dominion-war-rifle","name":"Dominion War Rifle","type":"weapon","rarity":"epic","subtype":"rifle","minLevel":1,"maxLevel":50,"description":"A rifle carried and maintained for life on the wasteland road.","family":null},{"id":"weapon-epic-ashfall-repeater","name":"Ashfall Repeater","type":"weapon","rarity":"epic","subtype":"improvised weapon","minLevel":1,"maxLevel":50,"description":"A improvised weapon carried and maintained for life on the wasteland road.","family":null},{"id":"armor-epic-dominion-elite-combat-armor","name":"Dominion Elite Combat Armor","type":"armor","rarity":"epic","subtype":"armor","minLevel":1,"maxLevel":50,"description":"A armor carried and maintained for life on the wasteland road.","family":null},{"id":"armor-epic-blackglass-assault-armor","name":"Blackglass Assault Armor","type":"armor","rarity":"epic","subtype":"armor","minLevel":1,"maxLevel":50,"description":"A armor carried and maintained for life on the wasteland road.","family":null},{"id":"armor-epic-wasteland-juggernaut-plate","name":"Wasteland Juggernaut Plate","type":"armor","rarity":"epic","subtype":"plate","minLevel":1,"maxLevel":50,"description":"A plate carried and maintained for life on the wasteland road.","family":null},{"id":"armor-epic-tomorrow-project-recon-suit","name":"Tomorrow Project Recon Suit","type":"armor","rarity":"epic","subtype":"suit","minLevel":1,"maxLevel":50,"description":"A suit carried and maintained for life on the wasteland road.","family":null},{"id":"armor-epic-seaport-captain-s-armor","name":"Seaport Captain's Armor","type":"armor","rarity":"epic","subtype":"armor","minLevel":1,"maxLevel":50,"description":"A armor carried and maintained for life on the wasteland road.","family":null}];
function catalogInstanceName(def,level){return `${def.name} (L${String(level).padStart(2,'0')} ${def.rarity.toUpperCase()})`;}
for(const def of EQUIPMENT_CATALOG)for(let lv=def.minLevel;lv<=def.maxLevel;lv++){
 const q=EQUIPMENT_QUALITIES.indexOf(def.rarity),name=catalogInstanceName(def,lv);
 const stat=def.type==='weapon'?{min:5+Math.floor((lv-1)*.8)+q,max:10+Math.floor((lv-1)*.8)+q*2}:{def:2+Math.floor((lv-1)*.35)+q};
 Object.defineProperty(GEAR,name,{value:{...def,level:lv,...stat},enumerable:false});
}
const REGIONAL_EQUIPMENT_CONFIG={solace:{cap:10,rareChance:.10},seaport:{cap:20,rareChance:.10}};
function regionalEquipmentStock(region){
 ensureRefillClock();const config=REGIONAL_EQUIPMENT_CONFIG[region];if(!config)throw Error('Unknown region');
 const stocks=player.flags.regionalEquipment||(player.flags.regionalEquipment={}),period=Number(player.flags.nextRefillAt);
 if(stocks[region]?.period===period)return stocks[region];
 const level=Math.max(1,Math.min(config.cap,Math.floor(Number(player.level)||1))),used=new Set(),slots=[];
 for(const type of ['weapon','weapon','weapon','armor','armor']){
  const rarity=Math.random()<config.rareChance?'rare':'uncommon';
  const pool=EQUIPMENT_CATALOG.filter(x=>x.type===type&&x.rarity===rarity&&!used.has(x.id));
  const def=pool[Math.floor(Math.random()*pool.length)];used.add(def.id);
  const name=catalogInstanceName(def,level);slots.push({name,sold:false});
 }
 stocks[region]={period,slots};
 if(typeof v49Autosave==='function')v49Autosave();
 return stocks[region];
}
function regionalEquipmentPrice(name,region){const g=GEAR[name];if(!g||!g.id)return 0;const base=(50+3*g.level)*(g.rarity==='rare'?2:1);const rating=region==='seaport'&&typeof portStaffRating==='function'?portStaffRating('general store'):1;return Math.max(1,Math.round(base*(1-(Math.max(1,rating)-1)*.02)));}
function regionalEquipmentText(slot,region){const g=GEAR[slot.name];if(!g)return slot.name+' — UNAVAILABLE';return `${gearLabel(slot.name)} — ${g.type==='weapon'?`DMG ${g.min}–${g.max}`:`DEF ${g.def}`} — ${regionalEquipmentPrice(slot.name,region)} BOLTS${slot.sold?' — SOLD OUT':''}`;}
function regionalEquipmentBuy(region,wanted){
 const stock=regionalEquipmentStock(region),slot=stock.slots.find(x=>x.name.toLowerCase()===wanted.toLowerCase());
 if(!slot||slot.sold){add('That equipment is unavailable or sold out.','system');return false;}
 const g=GEAR[slot.name],price=regionalEquipmentPrice(slot.name,region);
 if(!g||!price||player.bolts<price){add('Insufficient Bolts or unavailable equipment.','system');return false;}
 if(!addPack(slot.name,g.type,1,true)){add('Backpack full. No Bolts charged.','system');return false;}
 player.bolts-=price;slot.sold=true;updateHud();add(`PURCHASED — ${gearLabel(slot.name)} — ${price} BOLTS`,'reward');
 if(typeof v49Autosave==='function')v49Autosave();return true;
}
function equipmentRarityRoll(level,roll){
 const band=level<=5?0:level<=10?1:level<=20?2:level<=30?3:level<=40?4:5;
 let cumulative=0;for(let i=0;i<EQUIPMENT_QUALITIES.length;i++){cumulative+=EQUIPMENT_WEIGHTS[band][i];if(roll<cumulative)return EQUIPMENT_QUALITIES[i];}
 return 'legendary';
}
const RARITY_COLOR={common:"#e5e7eb",uncommon:"#22c55e",rare:"#3b82f6",epic:"#a855f7",legendary:"#f97316"};
function gearLabel(name){if(name==="Old World Pocket Compass")return "Old World Pocket Compass [UNCOMMON]";if(name==="Pre-War Silver Coin")return "Pre-War Silver Coin [UNCOMMON]";if(name==="Wild Honey")return "Wild Honey [UNCOMMON]";const g=GEAR[name];return g?`${name} [${g.rarity.toUpperCase()}]`:name;}
function armorDefense(){if(typeof stage!=='undefined'&&stage==='combat'&&typeof combatState!=='undefined'&&combatState?.r18Bare)return 0;return (GEAR[player.armor]?.def||0)+(GEAR[player.accessory]?.def||0);}
function weaponRange(){if(typeof stage!=='undefined'&&stage==='combat'&&typeof combatState!=='undefined'&&combatState?.r18Bare){const l=Math.max(1,Math.min(50,Number(player.level)||1)),n=Math.floor((l-1)*.8);return [5+n,10+n];}const g=GEAR[player.weapon],a=GEAR[player.accessory];return g&&g.type==="weapon"?[g.min+(a?.min||0),g.max+(a?.max||0)]:[5+(a?.min||0),10+(a?.max||0)];}
function enemyHit(min,max) {
  const raw = Math.floor(Math.random()*(max-min+1))+min;
  const defense = armorDefense();
  const dmg = Math.max(1, raw-defense);
  hurt(dmg);
  add(`Incoming ${raw} - ${defense} DEF = ${dmg} damage.`, "system");
  return dmg;
}
function r18EquippedRanged(){const gear=GEAR[player.weapon],def=gear?.subtype?gear:typeof EQUIPMENT_CATALOG!=='undefined'?EQUIPMENT_CATALOG.find(x=>x.name===player.weapon):null;return !!def&&/rifle|revolver|pistol|shotgun|crossbow|smg/i.test(def.subtype||'');}
function rollDamage(min,max){ if(min==null||max==null){[min,max]=weaponRange();} return Math.floor(Math.random()*(max-min+1))+min; }
function packSlotsUsed() { return player.pack.filter(i=>!["key","quest"].includes(i.type)).length; }
function r18ItemLabel(item){return item.name+(item.stolen?' (STOLEN)':'');}
function r18NamedStack(items,label){const value=String(label).trim(),tagged=/ \(stolen\)$/i.test(value),name=value.replace(/ \(stolen\)$/i,'').toLowerCase(),matches=items.filter(i=>i.name.toLowerCase()===name);return tagged?matches.find(i=>!!i.stolen):matches.find(i=>!i.stolen)||matches[0];}
function findItem(name) {const value=String(name).trim(),tagged=/ \(stolen\)$/i.test(value),query=value.replace(/ \(stolen\)$/i,'').toLowerCase(),exact=player.pack.filter(i=>i.name.toLowerCase()===query),matches=exact.length?exact:player.pack.filter(i=>i.name.toLowerCase().includes(query));return tagged?matches.find(i=>!!i.stolen):matches.find(i=>!i.stolen)||matches[0];}
function hasItem(name) { return !!findItem(name); }
function removeItem(name, qty=1) {
  const item=findItem(name); if(!item) return false;
  item.qty-=qty; if(item.qty<=0) player.pack=player.pack.filter(i=>i!==item); updateHud(); return true;
}
// Bonus finds are separate common items, never copies of quest or one-time rewards.
let r18PetBonusBusy=false;
function r18PetRoadFind(name,type){
 if(r18PetBonusBusy||stage!=='encounter'||!player.flags)return;
 const pet=player.flags.equippedPet;if(!['Rescued Hound','Wasteland Rabbit'].includes(pet))return;
 const e=typeof currentEncounter==='function'?currentEncounter():null,title=String(e?.title||'').replace(/^EAST ROAD — /,'');
 const dog=pet==='Rescued Hound'&&type==='material'&&['Scrap Metal','Wire'].includes(name)&&['WASHOUT SALVAGE','MAINTENANCE BOX'].includes(title);
 const rabbit=pet==='Wasteland Rabbit'&&type==='consumable'&&['Fresh Carrot','Fresh Potato','Fresh Apple'].includes(name)&&['IRRADIATED ROACHES','THE LAST ORCHARD'].includes(title);
 if(!dog&&!rabbit)return;
 const g=typeof lanternState==='function'?lanternState():null,scene=g?.sceneId||`${day}:${dailyRoadTurns}:${roadGoal}:${roadTurn}`;
 if(player.flags.r18PetBonusScene===scene)return;player.flags.r18PetBonusScene=scene;
 if(Math.random()>=(dog?.10:.05))return;
 const bonus=dog?'Scrap Metal':'Fresh Carrot',bonusType=dog?'material':'consumable';r18PetBonusBusy=true;
 try{if(!addPack(bonus,bonusType,1,true)){(player.flags.r5LootQueue||(player.flags.r5LootQueue=[])).push({name:bonus,type:bonusType,qty:1});add(bonus+' is held until you make room.','system');}add((dog?(player.flags.r18HoundName||'Your hound'):'Your rabbit')+' finds extra '+bonus+'.','reward');}finally{r18PetBonusBusy=false;}
}
const R18_FOOD_GROUPS={meat:['Raw Rat Meat','Raw Wolf Meat','Raw Bird Meat','Raw Venison','Raw Boar Meat','Raw Chicken Meat','Raw Snake Meat','Raw Rabbit Meat'],fruit:['Fresh Apple','Fresh Pear','Fresh Berries'],vegetable:['Fresh Carrot','Fresh Potato','Fresh Tomato','Fresh Cabbage']};
function r18FoodKind(name){return Object.keys(R18_FOOD_GROUPS).find(k=>R18_FOOD_GROUPS[k].includes(name))||null;}
function r18FoodRecord(name,type){const kind=r18FoodKind(name);if(!kind||type!==(kind==='meat'?'material':'consumable'))return;const f=player.flags.r18FoodSeen||(player.flags.r18FoodSeen={});f[kind]=true;}
function r18FoodSync(){for(const i of player.pack||[])if(i.qty>0)r18FoodRecord(i.name,i.type);}
function r18StewReady(){r18FoodSync();const f=player.flags.r18FoodSeen||{};return !!(f.meat&&f.fruit&&f.vegetable);}
function addPack(name, type="material", qty=1, quietFull=false, stolen=false) {
  if(stage==="fallen")return false;
  const existing=player.pack.find(i=>i.name===name && i.type===type && !!i.stolen===!!stolen);
  if(existing){ existing.qty+=qty; updateHud(); resultLine(`PACK: + ${name}${qty>1?` ×${qty}`:""}`,"reward"); r18FoodRecord(name,type); if(!stolen)r18PetRoadFind(name,type); return true; }
  if (!["key","quest"].includes(type) && packSlotsUsed() >= player.packMax) { if(!quietFull)add(`PACK FULL — You leave ${name} behind.`, "system"); return false; }
  player.pack.push({name,qty,type,...(stolen?{stolen:true}:{})}); updateHud(); resultLine(`PACK: + ${name}${qty>1?` ×${qty}`:""}`, "reward"); r18FoodRecord(name,type); if(!stolen)r18PetRoadFind(name,type); return true;
}
function showStatus() {
  add("────────────────────────────────────────", "system");
  add(`HANDLE ${player.handle || "---"}   LEVEL ${String(player.level).padStart(2,"0")}   HP ${player.hp}/${player.maxHp}   XP ${player.level >= 50 ? "MAX LEVEL" : `${player.xp}/${player.nextXp}`}`);
  add(`BOLTS ${player.bolts}   TURNS ${testMode?"∞ TEST":`${player.turns}/${player.maxTurns}`}   PACK ${packSlotsUsed()}/${player.packMax}   TIME ${timePhase()}`);
  if(player.flags.r18HorseOwned)add('HORSE TRAVEL: 1 AVAILABLE — HORSE TRAVEL','reward');
  add(`NEXT TURN REFILL: ${testMode?"TEST MODE — LIMIT DISABLED":refillText()}`, "system");
  const [dmin,dmax]=weaponRange();
  showEquipmentSummary();
  add("────────────────────────────────────────", "system");
  if(player.flags.r18HorseOwned)r5DirectChoices(["HORSE TRAVEL","BACK"]);else add("(B) BACK", "system");
}
function jenQuestObjective(){return ({active:"Find the missing runner's supply cart on Factory road segment 3.",cart:"SEARCH SUPPLY CART at Factory road segment 3. Return the crate to Jen.",recovered:"DELIVER JEN'S SUPPLY CRATE to Jen in Solace.",hideout:"Follow the runner's trail south to segment 5, near the abandoned checkpoint.",raiders:"SEARCH RAIDER CHECKPOINT at Factory road segment 5 to rescue the runner.",fight:"Rescue the runner at the Factory road checkpoint.",rescued:"DELIVER RUNNER'S TOKEN to Jen in Solace."})[player.flags.jenQuest]||"Find Jen in Solace.";}
function showQuests(){
  add("──────────────── QUEST LOG ────────────────","system");
  add("MAIN QUEST","bright");
  if(player.flags.chapterOneComplete){add('MAIN QUEST: COMPLETE','reward');add('Chapter One — The Road to Seaport','bright');add('Status: Completed','reward');add('Further chapters are in development.','system');add('TYPE: READ CHAPTER ONE to revisit the finale.','system');}
  else if(typeof portQuestObjective==="function")add("THE ROAD TO SEAPORT — "+portQuestObjective(),"system");
  add("ACTIVE SIDE QUESTS","bright"); let active=0;
  for(const [key,title,description] of [["jenQuest","LAST CALL","Search the south gate road to the Factory for the supply cart; SEARCH SUPPLY CART; DELIVER JEN'S SUPPLY CRATE, then find the raider checkpoint and DELIVER RUNNER'S TOKEN."],["johnnyQuest","A DEAL GONE BAD","Search the road north toward House for the ledger; SEARCH LEDGER; return to Johnny and DELIVER JOHNNY'S LEDGER."],["amiiQuest","THE MISSING DEPOSIT","Search the road north toward House for the satchel; SEARCH SATCHEL; return to Amii and DELIVER BANK SATCHEL."],["waynePatientQuest","THE LAST PATIENT","Search the south gate Factory road for medicine; SEARCH AMBULANCE; return to Wayne and DELIVER CLINIC MEDICINE."]]){if(player.flags[key]&&player.flags[key]!=="done"){active++;add(`SIDE — ${title} [${player.flags[key].toUpperCase()}]`);add(key==="jenQuest"?jenQuestObjective():description,"system");}}
  for(const [key,title,description] of [["jenUnpaidTab","UNPAID TAB","Settle the tavern's outstanding 12-Bolt tab with Jen."],["jenFamiliarFace","A FAMILIAR FACE","Follow up with Jen about the traveler she recognizes."]]){if(player.flags[key]&&player.flags[key]!=="done"){active++;add(`SIDE — ${title} [${player.flags[key].toUpperCase()}]`);add(description,"system");}}
  if(player.flags.mainSolaceQuest!=="done"){active++;add("MAIN — HEAD TO SOLACE");add("Follow the GPS coordinates south to Solace. Find shelter, then ask about the Relay Station to restore contact with the Tomorrow Project.","system");}
  if(["active","cleared"].includes(player.flags.houseQuest)){active++;add("SIDE — INVESTIGATE THE ABANDONED HOUSE");add(player.flags.houseQuest==="cleared"?"Lift the loose floorboard in the starting house to claim your wooden storage box.":"Return to the starting house north of Solace and investigate the recent occupation.","system");}
  if(player.flags.timHouseBounty && player.flags.timHouseBounty!=="done"){active++;add(`BOUNTY — TROUBLE AT THE OLD HOUSE [${String(player.flags.timHouseBounty).toUpperCase()}]`);add(player.flags.timHouseBounty==="proof"?"Return to Tim with proof that the old-house squatter has been driven out.":"Investigate the occupied old house after Wayne unlocks the house lead, then defeat the squatter.","system");}
  if(player.flags.terribleBillyBounty && player.flags.terribleBillyBounty!=="done"){active++;add(`BOUNTY — TERRIBLE BILLY [${String(player.flags.terribleBillyBounty).toUpperCase()}]`);add(player.flags.terribleBillyBounty==="proof"?"Return to Tim with proof that Terrible Billy has been stopped.":"On the road, use HUNT TERRIBLE BILLY to confront the wanted raider.","system");}
  if(["active","found"].includes(player.flags.timQuest)){active++;add("SIDE — THE OLD BADGE");add(player.flags.timQuest==="found"?"Return Tim's old badge to him in Solace.":"Search Route 127 between Solace and the old house.","system");}
  if(["active","found"].includes(player.flags.murphyQuest)){active++;add("SIDE — ONE GOOD BELT");add(player.flags.murphyQuest==="found"?"Return the usable serpentine belt to Murphy.":"Search near the service-road fork toward the old house.","system");}
  if(player.flags.relayQuest==="ask"){active++;add("MAIN — RELAY STATION");add("Ask Tim, Jen or Murphy about the Relay Station. The Tomorrow Project needs a reliable line to Solace.","system");}
  if(player.flags.relayQuest==="find"){active++;add("MAIN — RELAY STATION");add("Investigate the Relay Station by Solace's north wall and find out why the Tomorrow Project cannot hold a connection.","system");}
  if(player.flags.relayQuest==="complete"){add("MAIN OBJECTIVE","bright");add("THE FACTORY","place");add("The Relay Station is operational.");add("Follow the southern road to the Factory. Its Tomorrow Project terminal holds the last report from Seaport; find Forge in the entrance workshop.");add("STATUS: ACTIVE","system");}
  if(player.flags.relayQuest==="stabilize"){
    active++; add("MAIN — THE RELAY"); const rp=ensureRelayParts(); const count=Object.values(rp).filter(Boolean).length;
    if(!player.flags.relayPartsRevealed){ add("Inspect all four Relay systems and learn what is failing.","system"); const ri=player.flags.relayInspected||{}; if(ri.console)add("• CONSOLE — Power regulator failed. Johnny hoards old electronics.","system"); if(ri.antenna)add("• ANTENNA — Antenna servo seized. The Scrap Yard had old motor assemblies.","system"); if(ri.cables)add("• CABLES — Shielded feed coupler burned out. A signal cabinet on Old Service Road may still have hardware.","system"); if(ri.monitor)add("• MONITOR — Signal-conditioning module is dead. You passed old communications equipment at the Factory crossroads.","system"); }
    else { add(`Recover four components needed to stabilize the Relay. PARTS ${count}/4.`,"system"); add(`${rp.johnny?"✓":"□"} POWER REGULATOR — Johnny may have something this old.`,"system"); add(`${rp.yard?"✓":"□"} ANTENNA SERVO — Search the Scrap Yard.`,"system"); add(`${rp.branch?"✓":"□"} SHIELDED FEED COUPLER — Search the signal cabinet on Old Service Road.`,"system"); add(`${rp.east?"✓":"□"} SIGNAL-CONDITIONING MODULE — Search old communications equipment at the Factory crossroads.`,"system"); if(count>=4)add("Return to the Relay Station and stabilize the connection.","bright"); }
  }
  if(!active)add("NONE","system");
  add("");add("COMPLETED QUESTS","bright"); let completed=0;
  for(const [key,title] of [["jenQuest","LAST CALL"],["johnnyQuest","A DEAL GONE BAD"],["amiiQuest","THE MISSING DEPOSIT"],["waynePatientQuest","THE LAST PATIENT"]]){if(player.flags[key]==="done"){completed++;add(`SIDE — ${title} — COMPLETE`,"reward");}}
  for(const [key,title] of [["jenUnpaidTab","UNPAID TAB"],["jenFamiliarFace","A FAMILIAR FACE"]]){if(player.flags[key]==="done"){completed++;add(`SIDE — ${title} — COMPLETE`,"reward");}}
  if(player.flags.mainSolaceQuest==="done"){completed++;add("MAIN — HEAD TO SOLACE");add("Reached the settlement of Solace.","system");}
  if(player.flags.timQuest==="done"){completed++;add("SIDE — THE OLD BADGE");add("Returned Tim's old badge. Reward: 120 XP · 30 Bolts","system");}
  if(player.flags.murphyQuest==="done"){completed++;add("SIDE — ONE GOOD BELT");add("Brought Murphy a usable serpentine belt. Reward: 120 XP · 35 Bolts","system");}
  if(player.flags.houseQuest==="done"){completed++;add("SIDE — INVESTIGATE THE ABANDONED HOUSE");add("House claimed. Six-slot wooden storage box unlocked.","system");}
  if(player.flags.timHouseBounty==="done"){completed++;add("BOUNTY — TROUBLE AT THE OLD HOUSE — COMPLETE","reward");add("Returned proof to Tim. Reward: 100 XP · 75 Bolts.","system");}
  if(player.flags.terribleBillyBounty==="done"){completed++;add("BOUNTY — TERRIBLE BILLY — COMPLETE","reward");add("Stopped Terrible Billy and returned proof to Tim. Reward: 140 XP · 100 Bolts.","system");}
  if(player.flags.relayQuest==="complete"){completed++;add("MAIN — RELAY STATION: CONNECTION STABILIZED","reward");add("The Relay is operational. The Tomorrow Project can reach Solace again; the Factory's local archive is the next lead.","system");}
  if(!completed)add("NONE","system"); add("────────────────────────────────────────","system");add("(B) BACK","system");
}
function showEquipmentSummary(){
  const [low,high]=weaponRange();
  const stolenSlots=["weapon","armor","accessory"].filter(k=>player[k]&&player.flags.r18EquippedStolen?.[k]);if(stolenSlots.length)add("STOLEN EQUIPMENT: "+stolenSlots.join(", ").toUpperCase(),"danger");
  add(`WEAPON: ${gearLabel(player.weapon)}`,GEAR[player.weapon]?.rarity||"system");add(`        DMG ${low}–${high}`,"system");add("","system");
  add(`ARMOR: ${gearLabel(player.armor)}`,GEAR[player.armor]?.rarity||"system");add(`       DEF ${armorDefense()}`,"system");add(`PET: ${player.flags?.equippedPet==="Rescued Hound"&&player.flags?.r18HoundName?player.flags.r18HoundName+" (Rescued Hound)":player.flags?.equippedPet||"None"}`,typeof r11PetRarity==='function'?r11PetRarity(player.flags?.equippedPet):"system");add(`ACCESSORY: ${player.accessory?gearLabel(player.accessory):"None"}`,GEAR[player.accessory]?.rarity||"system");
}
function showInventory() {
  numberedChoices={};currentHotkeys={b:"back"};refreshInterfaceShortcutLabels();
  add("──────────────── INVENTORY ────────────────", "system");
  add(`BOLTS — ${player.bolts}`, "bright");
  add(`${player.packMax>=10?"TRAVELLER BACKPACK":"WORN BACKPACK"} — ${packSlotsUsed()} / ${player.packMax} SLOTS`, "bright");
  showEquipmentSummary();
  const normal=player.pack.filter(i=>!["key","quest"].includes(i.type));
  const keys=player.pack.filter(i=>["key","quest"].includes(i.type));
  for(let i=0;i<Math.max(player.packMax,normal.length);i++){
    const item=normal[i];
    add(item?`[${i+1}] ${gearLabel(item.name)}${item.stolen?" (STOLEN)":""}${item.qty>1?` ×${item.qty}`:""}  <${item.type.toUpperCase()}>`:`${i+1}. EMPTY`,item?.name==="Wild Honey"?"uncommon":item&&GEAR[item.name]?GEAR[item.name].rarity:"system");
  }
  if(keys.length){ add("KEY ITEMS", "bright"); keys.forEach(i=>add(`• ${i.name}${i.qty>1?` ×${i.qty}`:""}`)); }
  // Relay parts are durable quest flags, not physical backpack items.
  if(player.flags.relayQuest!=="complete" && (player.flags.relayPartsRevealed || player.flags.relayQuest==="stabilize")){
    const parts=ensureRelayParts();
    add("RELAY COMPONENTS — QUEST STORAGE (NO PACK SLOTS)","bright");
    for(const [key,label] of [["johnny","Power Regulator"],["yard","Antenna Servo"],["branch","Shielded Feed Coupler"],["east","Signal-Conditioning Module"]])
      add(`${parts[key]?"✓":"□"} ${label}`,"system");
  }
  add("Select an item by NUMBER. Full commands still work.", "system");
  add("────────────────────────────────────────", "system");
  add("(B) BACK","system");
}
function inspectItem(name){
  const item=findItem(name); if(!item){add("You aren't carrying that.","system"); return;}
  const info={
    "Mine-Protected Tent":"UNCOMMON — One-use outdoor shelter that prevents overnight losses when selected and confirmed.",
    "Explosive Components":"Salvaged explosive parts used in the Mine-Protected Tent blueprint.",
    "Tent":"One-use shelter for a lower-risk camp. Consumed only when you confirm MAKE CAMP.","Energy Bars":"ENERGY BAR — Restore 10% of maximum HP.",
    "Battered Flashlight":"A scratched LED flashlight. Still works. Mostly. Useful anywhere darkness is the problem. Can be dismantled for Bolts and Electronics.",
    "Cloth":"Salvaged fabric. Useful for bandages and basic crafting.",
    "Wire":"Copper wire with enough insulation left to matter.",
    "Rope":"A length of rope useful for descents and securing crossings.",
    "Scrap Metal":"Bent but usable metal for repairs and crafting.",
    "Wild Honey":"UNCOMMON — Restore 15% of maximum HP, including in combat.",
    "Pre-War Silver Coin":"UNCOMMON — A silver keepsake that can be sold for Bolts.",
    "Bandage":"A clean-enough field dressing. Restore 25% of maximum HP.",
    "Reinforced Bandage":"Forge-crafted dressing. Restore 50% of maximum HP.",
    "Emergency Trauma Kit":"A sealed emergency kit. Restore 75% of maximum HP outside combat.",
    "Tempered Steel":"RARE — Heat-treated metal used in the Tempered Steel Pipe blueprint.",
    "Raw Rat Meat":"Raw rat meat. Use shared cooking and preservation recipes after learning them.",
    "Raw Bird Meat":"Raw bird meat. Use shared cooking and preservation recipes after learning them.",
    "Raw Venison":"Raw deer meat. Use shared cooking and preservation recipes after learning them.",
    "Raw Boar Meat":"Raw boar meat. Use shared cooking and preservation recipes after learning them.",
    "Raw Chicken Meat":"Raw chicken meat. Use shared cooking and preservation recipes after learning them.",
    "Raw Snake Meat":"Raw snake meat. Use shared cooking and preservation recipes after learning them.",
    "Large Animal Bones":"Large animal bones usable for trade.",
    "Small Animal Bones":"Small animal bones used for a Bone Tomahawk and trade.",
    "Fresh Carrot":"A fresh carrot. Restore 10% of maximum HP outside combat.",
    "Fresh Potato":"A fresh potato. Restore 10% of maximum HP outside combat.",
    "Fresh Pear":"Fresh produce. Restore 10% of maximum HP outside combat.",
    "Fresh Berries":"Fresh produce. Restore 10% of maximum HP outside combat.",
    "Fresh Tomato":"Fresh produce. Restore 10% of maximum HP outside combat.",
    "Fresh Cabbage":"Fresh produce. Restore 10% of maximum HP outside combat.",
    "Fresh Apple":"A fresh apple. Restore 10% of maximum HP outside combat.",
    "Preserved Vegetables":"Preserved vegetables. Restore 25% of maximum HP outside combat.",
    "Preserved Meat":"Preserved meat. Restore 25% of maximum HP outside combat.",
    "Wasteland Stew":"A nourishing stew. Restore 40% of maximum HP outside combat.",
    "Raw Wolf Meat":"Raw meat from a wolf. Use shared cooking and preservation recipes after learning them.",
    "Animal Bones":"Animal bones used for Bone Armor and trade.",
    "Electronics":"Small reusable electronic components.",
    "Fuel":"A small amount of old but usable fuel."
  };
  if(item.name==="Keeper's Lantern"){add("KEEPER'S LANTERN — EPIC ACCESSORY — +5% COMBAT XP", "epic");if(player.flags.r18Ash?.inscription)add(player.flags.r18Ash.inscription,"system");return;}
  const g=GEAR[item.name]; add(`${gearLabel(item.name).toUpperCase()} — ${g?(g.type==="weapon"?`DMG ${g.min}–${g.max}`:`DEF ${g.def}`):(info[item.name]||"Salvage from the road. It may be useful for crafting.")}`,(g?.rarity||(item.name==="Wild Honey"?"uncommon":"bright"))); if(g?.description)add(g.description,'system');
}
function useItem(name){
  if(typeof combatState!=='undefined'&&combatState?.r18Bare){add('No items or healing during a bare-knuckle match.','system');return false;}
  if(String(name).toLowerCase().includes("tent")){add("Use MAKE CAMP when overnight choices appear. Tent is consumed only after confirmation.","system");return;}
  const item=findItem(name); if(!item){add("You aren't carrying that.","system"); return;}
  const rates={"Energy Bars":.10,"Bandage":.25,"Reinforced Bandage":.50,"Emergency Trauma Kit":.75,"Wild Honey":.15,"Fresh Carrot":.10,"Fresh Potato":.10,"Fresh Apple":.10,"Fresh Pear":.10,"Fresh Berries":.10,"Fresh Tomato":.10,"Fresh Cabbage":.10,"Preserved Vegetables":.25,"Preserved Meat":.25,"Wasteland Stew":.40,"Roadhouse Hash":.25};
  if(Object.hasOwn(rates,item.name)){
    if(player.hp>=player.maxHp){add("You are already at full health.","system");return;}
    if(['Emergency Trauma Kit','Fresh Carrot','Fresh Potato','Fresh Apple','Fresh Pear','Fresh Berries','Fresh Tomato','Fresh Cabbage','Preserved Vegetables','Preserved Meat','Wasteland Stew','Roadhouse Hash'].includes(item.name)&&['combat','combatItems'].includes(stage)){add('Use this item after leaving combat.','system');return;}
    const heal=Math.min(player.maxHp-player.hp,Math.max(1,Math.ceil(player.maxHp*rates[item.name])));
    if(!removeItem(item.name+(item.stolen?' (STOLEN)':''),1))return false;player.hp+=heal;updateHud();add(`${item.name.toUpperCase()} — +${heal} HP`,"reward");return true;
  }
  else if(item.name==="Battered Flashlight") {
    add("The flashlight works. You switch it back off to save the battery.","bright");
  }
  else add("You can't use that directly here.","system");
}
function showCombatItems(){
  const usable=player.pack.filter(i=>i.name==="Bandage"||i.name==="Energy Bars"||i.name==="Reinforced Bandage"||i.name==="Wild Honey");
  inventoryMode={combat:true,items:usable.map(r18ItemLabel)};returnStage="combat";stage="combatItems";refreshInterfaceShortcutLabels();
  add("──────────── COMBAT ITEMS ────────────","system"); if(!usable.length){add("NO USABLE COMBAT ITEMS","system");add("(B) BACK","system");currentHotkeys.b="back";return;}
  usable.forEach((i,n)=>add(`[${n+1}] ${r18ItemLabel(i)}${i.qty>1?` ×${i.qty}`:""} — ${i.name==="Reinforced Bandage"?"50% MAX HP":i.name==="Bandage"?"25% MAX HP":i.name==="Wild Honey"?"15% MAX HP":"10% MAX HP"}`)); add("Choose a NUMBER to use it. (B) BACK","system");
  inventoryMode={combat:true,items:usable.map(i=>i.name)}; returnStage="combat"; stage="combatItems";
  numberedChoices=Object.fromEntries(usable.map((i,n)=>[String(n+1),r18ItemLabel(i)]));currentHotkeys.b="back";
}
async function showInventoryItem(name){
  const item=findItem(name);
  if(!item){
    add("That item is no longer in your pack.","system");
    stage="inventory";
    await outputQueue;
    showInventory();
    return;
  }
  // Inventory detail follows the same proven ordering as the standing-room fix:
  // description finishes first, then the current actions are rendered, then input returns.
  inventoryMode={item:r18ItemLabel(item)};
  if(item.stolen)add("STOLEN PROPERTY — ordinary merchants may recognize this item.","danger");
  stage="inventoryItem";
  inspectItem(item.name);
  await outputQueue;
  const actions = item.type==="weapon" || item.type==="armor" || item.type==="accessory" ? "(E) EQUIP   (D) DROP   (B) BACK" : item.name==="Battered Flashlight"
    ? "(D) DISMANTLE   (B) BACK"
    : item.type==="consumable"
      ? (player.hp<player.maxHp?"(U) USE   (D) DROP   (B) BACK":"(D) DROP   (B) BACK")
      : (["key","quest"].includes(item.type) ? "(B) BACK" : "(D) DROP   (B) BACK");
  numberedChoices={};
  addImmediate(hotkeyLine(actions),"system");
  followOutput();
}
function dismantleItem(name){
  const item=findItem(name); if(!item){add("You aren't carrying that.","system"); return;}
  if(item.name==="Battered Flashlight") { removeItem(r18ItemLabel(item)); const n=5; player.bolts+=n; updateHud(); add(`You strip the flashlight apart. +${n} BOLTS`,"reward"); addPack("Electronics","material"); add("The flashlight is gone.","danger"); }
  else if(item.type==="material"){add("That's already a basic crafting material.","system");}
  else { removeItem(r18ItemLabel(item)); player.bolts+=2; updateHud(); add(`You break down ${item.name}. +2 BOLTS`,"reward"); }
}
function dropItem(name){ const item=findItem(name); if(!item){add("You aren't carrying that.","system");return;} if(protectedUniqueEquipment(item.name)){add("This unique item cannot be discarded.","system");return;} removeItem(r18ItemLabel(item),item.qty); add(`You leave ${item.name} beside the road.`,"system"); }


const LEGACY_SAVE_KEY = "route127_save_01_v17";
const FACTORY_AUTOSAVE_KEY="route127_factory_autosave_v42";
const SAVE_KEYS = [null, "route127_save_01_v25", "route127_save_02_v25", "route127_save_03_v25"];
const V24_SAVE_KEYS = [null, "route127_save_01_v24", "route127_save_02_v24", "route127_save_03_v24"];
let activeSaveSlot = 1;
const SAVE_KEY = SAVE_KEYS[1]; // legacy alias for older helper paths
const BOARD_KEY = "route127_mercy_board_v25";
const BOARD_MAX_POSTS = 8;
const BOARD_MAX_CHARS = 120;

function getBoardPosts(){
  try { const posts=JSON.parse(localStorage.getItem(BOARD_KEY)||"[]"); return Array.isArray(posts)?posts.slice(-BOARD_MAX_POSTS):[]; }
  catch(e){ return []; }
}
function boardTextForFilter(text){
  return text.toLowerCase().replace(/[@4]/g,"a").replace(/[3]/g,"e").replace(/[1!|]/g,"i").replace(/[0]/g,"o").replace(/[$5]/g,"s").replace(/[7]/g,"t").replace(/[^a-z]/g,"");
}
function boardHasProfanity(text){
  const clean=boardTextForFilter(text);
  const blocked=["fuck","shit","bitch","cunt","asshole","dick","pussy","faggot","nigger"];
  return blocked.some(word=>clean.includes(word));
}
function showBulletinBoard(){
  player.flags.solaceMenu="board";
  add("SOLACE BULLETIN BOARD","place");
  add(player.flags.relayQuest==="complete"?"RESOLVED: The Relay Station is operational.":"WANTED: Parts from the old relay station.");
  add("MISSING: Two runners. Last seen eastbound.");
  add("NOTICE: Stop leaving broken glass outside The Rusty Lantern Tavern.");
  add("Someone has added underneath: THEN GIVE US BETTER CUPS.","system");
  const posts=getBoardPosts();
  if(posts.length){
    add("— TRAVELER POSTS —","bright");
    posts.forEach(post=>add(`> ${(post.handle||"TRAVELER").toUpperCase()} — DAY ${post.day||1}: ${post.text}`,"system"));
  } else add("No traveler messages yet.","system");
  add(`Type POST <message> — max ${BOARD_MAX_CHARS} characters`,"system");add("(T) TOWN","system");
}
function postToBulletinBoard(text){
  text=(text||"").trim().replace(/\s+/g," ");
  if(!text){ add("Write something after POST. Example: POST Road east is rough.","system"); return; }
  if(text.length>BOARD_MAX_CHARS){ add(`BOARD KEEPER > Keep it under ${BOARD_MAX_CHARS} characters. Paper isn't free.`,"danger"); return; }
  if(boardHasProfanity(text)){ add("BOARD KEEPER > Not on Solace's board. Clean it up and try again.","danger"); return; }
  const posts=getBoardPosts(); posts.push({text,handle:player.handle||"TRAVELER",authorId:r7Identity(),day,at:new Date().toISOString()});
  try { localStorage.setItem(BOARD_KEY,JSON.stringify(posts.slice(-BOARD_MAX_POSTS))); add("You pin the note to the board.","reward"); }
  catch(e){ add("The note wouldn't stay put. Local storage is unavailable.","danger"); return; }
  showBulletinBoard();
}

function getSaveData(slot=activeSaveSlot){
  try {
    if(slot==="auto")return JSON.parse(localStorage.getItem(FACTORY_AUTOSAVE_KEY)||"null");
    const current=JSON.parse(localStorage.getItem(SAVE_KEYS[slot]) || "null");
    if(current) return current;
    const v24=JSON.parse(localStorage.getItem(V24_SAVE_KEYS[slot]) || "null");
    if(v24) return v24;
    if(slot===1) return JSON.parse(localStorage.getItem(LEGACY_SAVE_KEY) || "null");
    return null;
  } catch(e) { return null; }
}
function allSaveData(){ return [1,2,3].map(slot=>({slot,data:getSaveData(slot)})); }
function newestSave(){
  return [...allSaveData(),{slot:"auto",data:getSaveData("auto")}].filter(x=>x.data).sort((a,b)=>new Date(b.data.savedAt||0)-new Date(a.data.savedAt||0))[0]||null;
}
function saveLocationLabel(data){
  const s=(data&&data.stage)||"unknown";
  if(s==="mercy"||s==="settlement") return "SOLACE";
  if(s==="house"||s==="roadReady") return "OLD HOUSE";
  if(s==="encounter"||s==="between") return "ROUTE 127";
  if(s.startsWith("factoryDungeon"))return "FACTORY INTERIOR";
  if(s.startsWith("factory"))return "FACTORY WORKSHOP";
  if(s==="eastEnd")return "FACTORY EXTERIOR";
  return s.toUpperCase();
}
function titleScreen(){
  input.placeholder="Command"; pendingNewGameSlot=null; busy=false; input.disabled=false; hud.classList.add("hidden"); screen.innerHTML=""; stage="title"; utilityPanel.classList.add("hidden");v49LiveMap();
  add("", "system");
  add("ROUTE 127", "title-logo");
  add("LAST LANTERN WORKSHOP", "system");
  add("");
  const newest=newestSave();
  if(newest){
    add("(C) CONTINUE   (N) NEW GAME", "system");add("");
    allSaveData().forEach(({slot,data})=>{
      if(data)add(`(L) LOAD ${slot} — ${(data.player&&data.player.handle)||"NO HANDLE"} — LV ${String((data.player&&data.player.level)||1).padStart(2,"0")} — DAY ${data.day||1} — ${saveLocationLabel(data)} — ${new Date(data.savedAt||0).toLocaleString()}`,"system");
      else add(`SAVE ${slot} — EMPTY`, "system");
    });
    if(getSaveData("auto")){const d=getSaveData("auto");add(`(A) AUTOSAVE — ${(d.player&&d.player.handle)||"NO HANDLE"} — LV ${(d.player&&d.player.level)||1} — DAY ${d.day||1} — ${saveLocationLabel(d)} — ${new Date(d.savedAt).toLocaleString()}`,"system");}
    add("CONTINUE loads the newest save. LOAD 1 / LOAD 2 / LOAD 3 loads a specific slot.", "system");
  } else {
    add("NO SAVE FOUND","system");add("(N) NEW GAME   (K) SKIP INTRO","system");add("");
    add("No save exists in this build yet. SKIP INTRO starts at the old house so you do not have to replay the transmission while testing.", "system");
  }
  input.focus();
}
function showV49SaveMenu(){
 add('SAVE / LOAD','place');
 add('[1] SAVE GAME   [2] LOAD GAME   [3] RETURN TO TITLE SCREEN   [4] BACK TO GAME','system');
}
function showV49LoadMenu(){
 add('LOAD GAME — SELECT A SLOT','place');
 for(const {slot,data} of allSaveData())add(`[${slot}] ${data?`${data.player?.handle||'NO HANDLE'} | LV ${data.player?.level||1} | DAY ${data.day||1} | ${saveLocationLabel(data)} | ${new Date(data.savedAt||0).toLocaleString()}`:'EMPTY'}`,'system');
 const auto=getSaveData('auto');if(auto)add(`[A] AUTOSAVE — ${auto.player?.handle||'NO HANDLE'} | LV ${auto.player?.level||1} | DAY ${auto.day||1} | ${saveLocationLabel(auto)} | ${new Date(auto.savedAt||0).toLocaleString()}`,'system');
 add('Type LOAD 1, LOAD 2, LOAD 3, LOAD AUTOSAVE, or 4 to return.','system');
}
function showV49TitleConfirm(){add('RETURN TO TITLE SCREEN? Unsaved progress will be lost.','danger');add('[1] SAVE AND RETURN   [2] RETURN WITHOUT SAVING   [3] CANCEL','system');}
function v49ReturnToTitle(){cancelCasinoOnLoad();currentHotkeys={};numberedChoices={};pendingSaveSlot=null;returnStage=null;titleScreen();}
function resetPlayer(){
  combatState=null;currentRoadWanderer=null;currentTownWanderer=null;returnStage=null;
  Object.assign(player,{handle:"",level:1,hp:100,maxHp:100,xp:0,nextXp:100,bolts:12,bankBolts:0,turns:50,maxTurns:TURN_CAP,lifetimeTurns:0,weapon:"Rusted Pipe",armor:"Worn Jacket",accessory:null,pack:[{name:"Energy Bars",qty:2,type:"consumable"},{name:"Battered Flashlight",qty:1,type:"tool"},{name:"Tent",qty:1,type:"supply"}],packMax:8,flags:{billboard:false,helpedTraveler:false,travelerInSolace:false,houseBandage:false,forkDiscovered:false,mercyDiscovered:false,serviceBossDead:false,serviceReward:false,rentedRoom:false,timQuest:"locked",timQuestSteps:0,murphyQuest:"locked",murphyQuestSteps:0,pendingQuest:"",mainSolaceQuest:"active",relayQuest:"locked",relayUnlocked:false,relayVisited:false,interfaceUnlocked:false,roomSearched:false,introFailed:false,worldHour:8,relayInspected:{},relayPartsRevealed:false,relayParts:{johnny:false,yard:false,branch:false,east:false},relayJohnnyAsked:false,relayBranchDiscovered:false,eastRouteDiscovered:false},wandererState:{},recentEncounters:[],deathStreak:0,encounterDone:{},houseStorage:[],houseBoxMax:6,stash:[],dailyDeal:["Energy Bars","Bandage","Reinforced Jacket","Claw Hammer","Tire Iron"][Math.floor(Math.random()*5)]});
  ensureHousing();
  player.vendorStock=null;player.vendorSold=[];player.vendorRefreshes=0;refreshVendorStock();
  roadTurn=0; dailyRoadTurns=0; roadTurnCharged=false; roadGoal="mercy"; roadTripLength=9; mercyLocation="town"; rerollRoad(9); updateHud();
}
function skipIntroForTesting(){
  resetPlayer();
  player.flags.interfaceUnlocked=true;
  hud.classList.remove("hidden"); utilityPanel.classList.remove("hidden"); screen.innerHTML=""; signal.textContent="SIGNAL LOGGED";
  add("TEST START — INTRO SKIPPED", "system");
  add("The Solace coordinates are already logged.", "system");
  activeSaveSlot=0;
  arriveHouse();
}

function utilityMenu(){ add("(S) STATUS   (I) INVENTORY   (M) MAP   (Q) QUESTS   (V) SAVE", "system"); }
function mapPosition(){
  const locationStage=stage==="interfaceMap"?returnStage:stage;
  const total = roadGoal==="east"?9:Math.max(1, roadTripLength || 5);
  if(locationStage === "house" || locationStage === "wake" || locationStage === "hello" || locationStage === "listen" || locationStage === "savecoords" || locationStage === "roadReady") return {pos:0,total};
  if(locationStage === "mercy" || locationStage === "settlement" || roadGoal==="east") return {pos:total,total};
  // roadTurn indexes the current encounter (zero-based); once its travel turn
  // has been spent the player is already one step beyond the previous node.
  const travelled = Math.max(0, Math.min(total, roadTurn + (roadTurnCharged ? 1 : 0)));
  return {pos: roadGoal === "house" ? total-travelled : travelled, total};
}
function showMap(){
  let location=stage==="interfaceMap"?returnStage:stage;
  if(["zeroTurns","overnightConfirm"].includes(location))location=player.flags.turnResumeStage||"between";
  add("────────────────── LOCAL MAP ──────────────────","system");
  if(location==="mercy"||location==="settlement"){
    add("SOLACE — LOCAL PLACES","system");
    for(const [key,label] of [["town","Main Street"],["jen","The Rusty Lantern Tavern"],["johnny","Johnny's Trading Post"],["murphy","Murphy's Motor Works"],["wayne","Last Chance Clinic"],["amii","Solace Savings & Loan"],["mara","Scrap & Steel Armory"],["gate","West Gate"],["eastGate","East Gate"],...(player.flags.relayUnlocked?[["relay","Relay Station"]]:[])])add(`${mercyLocation===key?"X":"o"} ${label}`,"system");
  }else if(location==="serviceRoad"||location==="relayBranch"){
    const service=location==="serviceRoad",depth=serviceRoadDepth;
    add(service?"SERVICE ROAD — FORK TO MAINTENANCE YARD":"LOWER ACCESS ROAD — FORK TO SIGNAL CABINET","system");
    add(["FORK",...Array.from({length:3},(_,i)=>i===2?(service?"YARD":"CABINET"):"SEGMENT "+(i+1))].map((n,i)=>`${i===depth?"X":"o"} ${n}`).join(" ── "),"system");
    add(`DISTANCE TO FORK: ${depth}   DISTANCE TO END: ${3-depth}`,"system");
    const returning=!!player.flags.branchReturning;add(`CURRENT DIRECTION: ${service?(returning?"↓ DOWNHILL":"↑ UPHILL"):(returning?"↑ UPHILL":"↓ DOWNHILL")}`,"system");
    add(`HEADING TOWARD: ${returning?"ROUTE 127 FORK":service?"MAINTENANCE YARD":"SIGNAL CABINET"}`,"system");
    add("CONNECTION: western Route 127 fork, 4 segments east of the old house.","system");
  }else if(roadGoal==="east"&&!["house","roadReady","wake","standing","hello","listen","savecoords"].includes(location)){
    const total=6,pos=Math.max(0,Math.min(total,location==="eastEnd"?total:roadTurn+(roadTurnCharged?1:0)));
    add("EAST ROAD — SOLACE TO FACTORY","system");add(Array.from({length:total+1},(_,i)=>`${i===pos?"X":"o"}${i===0?" SOLACE":i===total?" FACTORY":""}`).join(" ── "),"system");
    add(`DISTANCE TO SOLACE: ${pos}   DISTANCE TO FACTORY: ${total-pos}`,"system");
    add(`CURRENT DIRECTION: ${player.flags.eastReturning?"← WEST":"→ EAST"}`,"system");add(`HEADING TOWARD: ${player.flags.eastReturning?"SOLACE":"FACTORY"}`,"system");
  }else{
    const {pos,total}=mapPosition();add("WEST ROAD — OLD HOUSE TO SOLACE","system");
    add(Array.from({length:total+1},(_,i)=>`${i===pos?"X":"o"}${i===0?" OLD HOUSE":i===total?" SOLACE":i===4?" FORK":""}`).join(" ── "),"system");
    add(`DISTANCE TO HOUSE: ${pos}   DISTANCE TO SOLACE: ${total-pos}`,"system");
    if(player.flags.forkDiscovered)add(`FORK (NODE 4) → SERVICE ROAD${player.flags.relayPartsRevealed?" / LOWER ACCESS ROAD":""}`,"system");
    add(`CURRENT DIRECTION: ${roadGoal==="house"?"← WEST":"→ EAST"}`,"system");add(`HEADING TOWARD: ${roadGoal==="house"?"OLD HOUSE":"SOLACE"}`,"system");
  }
  add(`TURNS REMAINING: ${testMode?"∞ TEST":`${player.turns}/${player.maxTurns}`}. Map use costs no turns.`,"system");
  add("────────────────────────────────────────","system");
}
function serializablePlayer(){
  const copy=JSON.parse(JSON.stringify(player, (k,v)=>v instanceof Set?[...v]:v));
  copy.encounterDone={};
  for(const [k,v] of Object.entries(player.encounterDone||{})) copy.encounterDone[k]=[...(v instanceof Set?v:new Set(v||[]))];
  return copy;
}
function gameplayStageForSave(){
  if(stage==="combatItems")return "combat";
  // UI overlays are not physical locations. Never persist one as the game stage.
  const overlay=["port55Pets","confirmDrop","inventory","inventoryItem","quests","interfaceStatus","interfaceMap","interfaceSave","r18HorseTravel","v49TitleConfirm","confirmSaveOverwrite","combatItems"];
  const candidate=overlay.includes(stage) ? returnStage : stage;
  return candidate && !overlay.includes(candidate) ? candidate : "between";
}
function saveSnapshot(){return {version:38,combatState:combatState?{...combatState}:null,day,wandererSerial,savedAt:new Date().toISOString(),stage:gameplayStageForSave(),roadTurn,dailyRoadTurns,roadGoal,roadTripLength,roadTurnCharged,serviceRoadDepth,mercyLocation,roadEncounterOrder,wandererLocations,currentRoadWanderer,currentTownWanderer,townWandererFocus,player:serializablePlayer()};}
function saveFactoryAutosave(){v49RollingAutosave('FACTORY EXTERIOR');}
function v49RollingAutosave(label='CHECKPOINT'){
 if(['title','wake','standing','handle'].includes(stage))return false;
 try{
  const data={...saveSnapshot(),manualSlot:activeSaveSlot};
  localStorage.setItem(FACTORY_AUTOSAVE_KEY,JSON.stringify(data));
  add(`AUTOSAVED — ${label}`,'system');return true;
 }catch(e){add('Autosave unavailable — use a manual save.','system');return false;}
}
function v49Boundary(){
 const st=gameplayStageForSave();
 if(['factoryWorkshop','factoryTerminal','factoryForge','factoryBench'].includes(st)||st.startsWith('factoryDungeon'))return 'FACTORY INTERIOR';
 if(st==='eastEnd')return 'FACTORY EXTERIOR';
 if(st==='house'||st==='roadReady')return 'OLD HOUSE';
 if(st==='mercy' && ['gate','eastGate'].includes(mercyLocation))return mercyLocation==='gate'?'WEST GATE':'EAST GATE';
 if(st==='settlement')return 'WEST GATE';
 return null;
}
function saveGame(slot=activeSaveSlot){
  if(!slot){ add("UNSAVED GAME — Choose SAVE 1, SAVE 2, or SAVE 3.","system"); return; }
  if(getSaveData(slot) && slot!==activeSaveSlot && pendingSaveSlot!==slot){ pendingSaveSlot=slot; add(`SAVE ${slot} ALREADY EXISTS — OVERWRITE?`,"danger"); add("(Y) YES   (N) NO","system"); stage="confirmSaveOverwrite"; return; }
  pendingSaveSlot=null; activeSaveSlot=slot; const data=saveSnapshot();
  try{ localStorage.setItem(SAVE_KEYS[slot],JSON.stringify(data)); add(`SAVE ${slot} — ${player.handle || "NO HANDLE"}`, "bright"); add("Game saved.", "reward"); }
  catch(e){ add("SAVE FAILED — This browser did not allow local storage for this file.", "danger"); }
}
function loadGame(slot=activeSaveSlot){
  cancelCasinoOnLoad();
  const data=getSaveData(slot);
  if(slot!=="auto")activeSaveSlot=slot;else if(data)activeSaveSlot=[1,2,3].includes(data.manualSlot)?data.manualSlot:0;
  if(!data){ add("SAVE GAME 01 is empty.", "system"); return; }
  Object.assign(player,data.player||{});
  // Preserve a recipe that old saves already unlocked implicitly before R11.
  const legacyRecipeFlags=data.player?.flags;
  if(legacyRecipeFlags&&legacyRecipeFlags.r11Learned===undefined&&legacyRecipeFlags.v49RecipeBandage&&Number(player.level)>=6){
    player.flags.r11Learned={bandage:true,pipe:true,ironReaper:true};
  }
  if(typeof r11Migrate==='function')r11Migrate();
  if(typeof r11RestoreCasinoLedger==='function')r11RestoreCasinoLedger();
  if(player.accessory===undefined)player.accessory=null;
  player.vendorStock=Array.isArray(data.player&&data.player.vendorStock)?[...data.player.vendorStock]:["Rusted Pipe","Worn Jacket","Claw Hammer"];
  player.vendorSold=Array.isArray(data.player&&data.player.vendorSold)?[...data.player.vendorSold]:[];
  ensureVendorStock();
  player.houseStorage=Array.isArray(data.player&&data.player.houseStorage)?data.player.houseStorage.map(i=>({...i})):[];
  player.rustyRoomChest=Array.isArray(data.player&&data.player.rustyRoomChest)?data.player.rustyRoomChest.map(i=>({...i})):[];
  player.houseBoxMax=6;
  ensureRelayParts();ensureHousing();
  player.flags=player.flags||{};
  const savedFlags=(data.player&&data.player.flags)||{};
  if(player.flags.mainSolaceQuest===undefined && savedFlags.mainMercyQuest!==undefined) player.flags.mainSolaceQuest=savedFlags.mainMercyQuest;
  if(player.flags.travelerInSolace===undefined && savedFlags.travelerInMercy!==undefined) player.flags.travelerInSolace=savedFlags.travelerInMercy;
  const hadInterfaceFlag=savedFlags.interfaceUnlocked!==undefined;
  for(const [k,v] of Object.entries({timQuest:"locked",timQuestSteps:0,murphyQuest:"locked",murphyQuestSteps:0,pendingQuest:"",overnight:"",overnightLocked:false,nextRefillAt:Date.now()+REFILL_MS,wandererRoadCooldown:0,mainSolaceQuest:(player.flags.mercyDiscovered?"done":"active"),relayQuest:"locked",relayUnlocked:false,relayVisited:false,interfaceUnlocked:false,roomSearched:false,introFailed:false,worldHour:8,relayInspected:{}})) if(player.flags[k]===undefined) player.flags[k]=v;
  const openingStages=["wake","wakeNamed","handle","confirmHandle","standing","hello","listen","savecoords"];
  if(!hadInterfaceFlag || (player.flags.interfaceUnlocked===false && !openingStages.includes(data.stage))) player.flags.interfaceUnlocked=!openingStages.includes(data.stage);
  if(player.flags.mercyDiscovered && player.flags.relayQuest==="locked") player.flags.relayQuest="ask";
  if(!Number.isFinite(Number(player.lifetimeTurns))) player.lifetimeTurns=Math.max(0,Number(data.dailyRoadTurns)||0);
  player.maxTurns=TURN_CAP; player.turns=Math.max(0,Math.min(TURN_CAP,Number(player.turns)||0));
  if(player.flags.relayQuest==="complete" && player.flags.factoryQuest===undefined) player.flags.factoryQuest="active";
  testMode=false;
  player.encounterDone={};
  for(const [k,v] of Object.entries((data.player&&data.player.encounterDone)||{})) player.encounterDone[k]=new Set(v||[]);
  stage=data.stage||"house";
  if(["confirmDrop","inventory","inventoryItem","quests","interfaceStatus","interfaceMap","interfaceSave","confirmSaveOverwrite","v49TitleConfirm"].includes(stage)) stage="between";
  returnStage=stage;
  day=data.day||1; wandererSerial=data.wandererSerial||0; serviceRoadDepth=data.serviceRoadDepth||0; roadTurn=data.roadTurn||0; dailyRoadTurns=Number(data.dailyRoadTurns)||0; roadTurnCharged=!!data.roadTurnCharged; roadGoal=data.roadGoal||"mercy"; roadTripLength=roadGoal==="east"?6:Math.max(8,data.roadTripLength||8); if(roadTurn>=roadTripLength && stage!=="eastEnd") roadTurn=Math.max(0,roadTripLength-1);
  // Old westbound saves placed the same fork one segment east. Keep branch saves at the shared intersection.
  if(roadGoal==="house" && ["fork","serviceRoad","relayBranch"].includes(stage))roadTurn=roadTripLength-4;
  mercyLocation=data.mercyLocation||"town"; roadEncounterOrder=Array.isArray(data.roadEncounterOrder)?data.roadEncounterOrder:roadEncounterOrder;
  wandererLocations=(data.wandererLocations&&typeof data.wandererLocations==="object")?data.wandererLocations:rollWandererLocations();
  // Add newly introduced wanderers to legacy saves without resetting existing locations.
  for(const w of wanderers){if(!Object.prototype.hasOwnProperty.call(wandererLocations,w.name)){const options=wandererSpots;wandererLocations[w.name]=options[Math.floor(Math.random()*options.length)];}}
  // v51: the former road Mara is Tess; migrate existing saves without resetting wanderer progress.
  if(player.wandererState?.Mara){if(!player.wandererState.Tess)player.wandererState.Tess=player.wandererState.Mara;delete player.wandererState.Mara;}
  if(Object.prototype.hasOwnProperty.call(wandererLocations,"Mara")){if(!Object.prototype.hasOwnProperty.call(wandererLocations,"Tess"))wandererLocations.Tess=wandererLocations.Mara;delete wandererLocations.Mara;}
  currentRoadWanderer=data.currentRoadWanderer||null; currentTownWanderer=data.currentTownWanderer||null; townWandererFocus=data.townWandererFocus||null; pendingTownFight=null; combatState=data.combatState?{...data.combatState}:null;
  if(currentRoadWanderer==="Mara")currentRoadWanderer="Tess";if(currentTownWanderer==="Mara")currentTownWanderer="Tess";if(townWandererFocus==="Mara")townWandererFocus="Tess";if(player.flags.v50Trade==="Mara")player.flags.v50Trade="Tess";if(combatState?.source==="roadWanderer"&&combatState.name==="MARA")combatState.name="TESS";
  if(player.flags.overnightLocked&&!player.flags.overnightPlan)player.flags.overnightPlan=planOvernight(player.flags.overnight||"road",legacyOvernightRng());
  ensureCasinoState();ensureSteveAnnouncements();v48Migrate();
  migrateHealthProgress(); // Preserve the saved health fraction without a level-up.
  migrateXpProgress();
  startRefillTimer();
  if(player.flags.interfaceUnlocked!==false){hud.classList.remove("hidden");utilityPanel.classList.remove("hidden");}else{hud.classList.add("hidden");utilityPanel.classList.add("hidden");} updateHud(); screen.innerHTML="";
  add(`SAVE ${slot} — ${(player.handle||"NO HANDLE")}`, "bright"); add("Save loaded.", "reward");
  if(stage==="combat" && combatState){
    if(combatState.source==="houseBoss" && player.flags.houseQuest!=="active"){combatState=null;arriveHouse();}
    else showCurrentContext();
  }
  else if(["houseStorage","houseDeposit","houseWithdraw"].includes(stage)){showHouseStorage(stage);}
  else if(stage==="house") arriveHouse();
  else if(["port55Vendor","port55Pets","port55Kaiden","port55Mia","port55Docks","port55Stop","port55Service","port55Recruit"].includes(stage))port55Resume();
  else if(["portRoad","seaport","portMarket","portClinic","portDocks","portWatch"].includes(stage))portMenu();
  else if(stage==="mercy"){if(!(typeof port55CasinoRestore==="function"&&port55CasinoRestore())){add("SOLACE","place");showSolaceContext();}}
  else if(stage==="settlement"){ add("SOLACE GATE", "place"); add("The settlement waits beyond the barricade."); add("(P) APPROACH GATE", "system"); }
  else if(stage==="wandererRoad" && currentRoadWanderer){
    const w=wandererByName(currentRoadWanderer);
    if(w){add(`ROAD TURN ${dailyRoadTurns} — WANDERER`,"place");showWanderer(w,"road");}
    else {stage="between";resumeSavedEncounter=true;showEncounter();}
  }
  else if(stage==="encounter" || stage==="between" || stage==="combat"){
    // Restore the same road event, rather than rolling a new wanderer on load.
    stage="between";resumeSavedEncounter=!!roadTurnCharged;showEncounter();
  }
  else if(stage==="roadReady"){add("THE OLD HOUSE","place");renderCurrentChoices();}
  else { add(`LOCATION RESTORED — ${stage.toUpperCase()}`, "system"); redrawState(); }

}


function sanitizeHandle(raw){ return (raw||"").trim().replace(/[^A-Za-z0-9 _-]/g,"").replace(/\s+/g," ").slice(0,16); }
function askHandle(){
  add("Your pack rests beside the fireplace. A strip of faded tape is stitched across the flap.");
  add("Someone wrote your name on it a long time ago.", "system");
  add("WHAT DOES IT SAY?", "bright");
  add("Enter your Handle — up to 16 characters. Type RANDOM for a suggestion.", "system");
  stage="handle";
}
let pendingHandle="";
function setHandle(raw){
  const h=sanitizeHandle(raw); if(!h){add("Give me something I can write on the pack.","system");return false;}
  pendingHandle=h; add(`HANDLE: ${h.toUpperCase()}`,"bright"); add("Is this correct? ENTER also confirms.","system");add("(Y) YES   (N) CHANGE","system"); stage="confirmHandle"; return true;
}


async function intro() {
  busy = true; input.disabled = true;
  await sleep(350); if(introFailureCount>0){await typeLine("HELLO AGAIN.","bright",55); await typeLine("LET’S TRY THIS AGAIN.","system",35); add("");} await typeLine("Cold.", "bright", 55);
  await sleep(450); await typeLine("That's the first thing you notice.");
  await sleep(500); await typeLine("The fire burned out hours ago.");
  await sleep(500); await typeLine("Rain taps against broken glass somewhere on the other side of the room.");
  add(""); await typeLine("You're lying on the floor beside the dead fireplace. Your pack is a few feet away.");
  add("");
  await outputQueue;
  stage="wake";
  currentHotkeys={l:"LOOK AROUND",s:"STAND UP"}; usedHotkeys=new Set(["L","S"]);
  addImmediate("(L) LOOK AROUND   (S) STAND UP", "system");
  input.disabled = false; input.focus(); busy = false;
}
async function terminalAwakens() {
  busy = true; input.disabled = true; add("");
  await typeLine("You brush dust from the old terminal and press the stiff power switch."); await sleep(350);
  await typeLine("A pale light flickers across the room."); await typeLine("Once."); await typeLine("Darkness."); await typeLine("Again.");
  add(""); await typeLine("An old terminal sits beneath a layer of dust.", "bright");
  signal.textContent = "SIGNAL DETECTED"; await typeLine("SIGNAL DETECTED", "system", 35); add("");
  await typeLine("HELLO?", "bright", 70); await typeLine("IF YOU CAN READ THIS, TYPE SOMETHING.", "system", 30);
  stage = "hello"; input.disabled = false; input.focus(); busy = false;
}
async function answerHello(rawResponse="") {
  busy = true; input.disabled = true; add("");
  const r=rawResponse.trim().toLowerCase();
  const vulgar=/(fuck|shit|bitch|asshole|dick|cunt|motherfucker)/.test(r);
  let reply="MOST PEOPLE JUST SAY HI.";
  if(/^(hello|hi|hey|yo|sup|wassup|what'?s up|whats up)[!.? ]*$/.test(r)) reply=r.includes("what")||r.includes("wassup")||r==="sup"?"NOT MUCH. END OF THE WORLD. YOU?":"HELLO.";
  else if(r.includes("fuck off")) reply="YOUR MOM.";
  else if(vulgar) reply="MOST PEOPLE JUST SAY HI, ASSHOLE.";
  else if(r.includes("who are you")) reply="COMPLICATED.";
  else if(r.includes("where am i")) reply="SOMEWHERE YOU SHOULDN’T STAY.";
  else if(r==="help"||r.includes("help me")) reply="WORKING ON IT.";
  else if(r.includes("are you real")) reply="ARE YOU?";
  else if(r==="why"||r.startsWith("why ")) reply="THAT’S A LARGE QUESTION.";
  else if(r.includes("thank")) reply="DON’T THANK ME YET.";
  else if(r==="lol"||r.includes("haha")) reply="GLAD SOMEONE’S HAVING FUN.";
  else if(r.includes("asshole")) reply="GOOD TALK.";
  else if(r==="shit") reply="YEAH. THERE’S A LOT OF THAT OUTSIDE.";
  else if(r==="die") reply="TRIED THAT.";
  else if(r.includes("banana")) reply="...BANANA?";
  else if(r==="computer"||r.includes("terminal")) reply="OBSERVANT.";
  else if(r.includes("raccoon")) reply="NO RACCOONS DETECTED.";
  else if(r.includes("127")) reply="YOU’LL SEE ENOUGH OF IT SOON.";
  else if(r.includes("luna")) reply="...WHERE DID YOU HEAR THAT NAME?";
  else if(r.includes("syn")) reply="NOTED.";
  await typeLine(reply, "bright", 35);
  await typeLine("...", "system", 120); await typeLine("MAN'S VOICE > Oh shit.", "man", 30);
  await typeLine("MAN'S VOICE > Someone answered.", "man", 30);
  await typeLine("WOMAN'S VOICE > Easy. We don't know who's on the other end.", "woman", 28);
  await typeLine("MAN'S VOICE > Fair.", "man", 35);
  await typeLine("WOMAN'S VOICE > Hold your reply. This line cannot carry both of us at once. Just listen.", "woman", 28);
  add(""); add("LISTEN", "system"); add("Type LISTEN to continue the transmission.", "system");
  stage = "listen"; input.disabled = false; input.focus(); busy = false;
}
async function flashStaticImage(){
  transmission.classList.remove("live");void transmission.offsetWidth;transmission.classList.add("live");
  try{await sleep(1000);}finally{transmission.classList.remove("live");}
}
async function reveal() {
  busy = true; input.disabled = true; add("");
  await typeLine("WOMAN'S VOICE > I'm going to try to send you something.", "woman", 26);
  await typeLine("MAN'S VOICE > That's not going to work.", "man", 28);
  await typeLine("WOMAN'S VOICE > It might.", "woman", 30); add("");
  await typeLine("TRANSFER: 3%", "system", 30); await typeLine("TRANSFER: 17%", "system", 25); await typeLine("TRANSFER: 61%", "system", 20);
  await typeLine("DISPLAY LINK ESTABLISHED", "bright", 22);
  await flashStaticImage();
  screen.lastElementChild?.scrollIntoView({behavior:"smooth",block:"end"});
  await typeLine("SIGNAL ERROR", "system", 35); await typeLine("DISPLAY DRIVER FAILURE", "system", 30); await typeLine("RECOVERING...", "system", 35); add("");
  await typeLine("WOMAN'S VOICE > Signal's degrading. No time for introductions.", "woman", 28);
  await typeLine("WOMAN'S VOICE > Solace is south of you. Its walls still stand, and its Relay Station may give us a line that holds.", "woman", 24);
  await typeLine("MAN'S VOICE > Road's bad. Worse after dark.", "man", 28);
  add(""); await typeLine("TRANSMISSION DATA RECEIVED", "bright", 35);
  await typeLine("DESTINATION: SOLACE", "system", 25); await typeLine("ROUTE: 127 SOUTH", "system", 25); await typeLine("DISTANCE: 6.2 MI", "system", 30); add("");
  await typeLine("WOMAN'S VOICE > We're the Tomorrow Project. We reconnect settlements so food, medicine and warnings can get through. Solace has gone quiet.", "woman", 25);
  await typeLine("WOMAN'S VOICE > Save those coordinates. Get behind Solace's walls, then find the Relay. We will keep listening.", "woman", 25); add("");
  await typeLine("SIGNAL LOST", "bright", 45); signal.textContent = "NO SIGNAL";
  add(""); add("LOG COORDINATES", "system"); add("Type LOG COORDINATES when you're ready.", "system");
  stage = "savecoords"; input.disabled = false; input.focus(); busy = false;
}
async function leaveHouse() {
  // LOG COORDINATES is an atomic handoff: commit the playable road state first,
  // then render the departure sequence, and ALWAYS restore player control.
  stage = "roadReady";
  roadGoal = "mercy";
  roadTripLength = 10;
  busy = true;
  input.disabled = true;
  hud.classList.remove("hidden");
  utilityPanel.classList.remove("hidden");
  updateHud();
  try {
    add("");
    await typeLine("You pull on the worn jacket, slide the rusted pipe through your pack straps, and step outside.");
    add("");
    await typeLine("ROUTE 127 — MILE 0", "place", 40);
    await typeLine("The highway runs south through wet gray country. Weeds split the pavement. Power lines sag between leaning poles, and the shell of a gas station waits a few hundred yards ahead. Beyond it, Route 127 disappears between black hills.");
    await typeLine("Six-point-two miles to walls, clean water, and the only voices that have answered you in days.");
    add("NEW QUEST — HEAD TO SOLACE","bright");
    add("Follow the GPS coordinates south to Solace. Find shelter, then ask about the Relay Station to restore contact with the Tomorrow Project.","system");

  } catch (err) {
    console.error("Departure sequence recovered:", err);
  } finally {
    // Never leave the player stranded if animation/scrolling fails.
    stage = "roadReady";
    busy = false;
    input.disabled = false;
    utilityMenu();
    add("(R) ROAD — BEGIN JOURNEY", "system");
    input.focus();
    followOutput();
  }
}



const {wanderers} = RoadScenarioRegistry.wandererRoster();
const wandererSpots=["road","mercy","jen","johnny","murphy","wayne","amii","gate"];
let wandererLocations={};
function rollWandererLocations(previous={}){
  const out={};
  wanderers.forEach(w=>{ if(typeof portIsHired==="function"&&portIsHired(w.name)){out[w.name]="seaport";return;} if(!wandererAlive(w)){out[w.name]="dead";return;} const choices=wandererSpots.filter(x=>x!==previous[w.name]); out[w.name]=choices[Math.floor(Math.random()*choices.length)]; });
  return out;
}
function moveWanderers(){ wandererLocations=rollWandererLocations(wandererLocations||{}); }
function wandererByName(name){ return wanderers.find(w=>w.name.toLowerCase()===String(name||"").toLowerCase()); }
function ws(name){ player.wandererState=player.wandererState||{}; return player.wandererState[name]||(player.wandererState[name]={met:false,dead:false,lastSeen:-99,talks:0,lastLine:""}); }
function wandererAlive(w){ return !ws(w.name).dead; }
function markWandererDead(name){ const w=wandererByName(name); const key=w?w.name:name; const st=ws(key); st.dead=true; st.met=true; st.replacementDay=day+1+Math.floor(Math.random()*3); wandererLocations[key]="dead"; }
function storyHasValeEvidence(){
 const f=player.flags;
 return f.jenFamiliarFaceSeen===true||player.wandererState?.Vale?.met===true||f.helpedTraveler===true||f.travelerInSolace===true||portIsHired('Vale');
}
function storyRecordValeSighting(){
 const vale=wandererByName('Vale');if(!vale||!wandererAlive(vale))return;
 const f=player.flags;ws('Vale').met=true;
 if(f.jenFamiliarFaceSeen)return;
 f.jenFamiliarFaceSeen=true;
 add('Vale wears a patched green coat, a silver ring on her left hand, and a weathered map tucked beneath the strap of her pack.');
 if(f.jenFamiliarFace==='active')add('CLUE FOUND — A FAMILIAR FACE: You have seen Vale. Return to Jen.','reward');
}
function storyValeRoadAvailable(){
 const vale=wandererByName('Vale'),f=player.flags;
 return !!vale&&wandererAlive(vale)&&!portIsHired('Vale')&&!f.travelerInSolace&&!f.valeRoadResolved;
}
function storyRefreshTravelerEncounter(){
 const e=currentEncounter();if(e?.title!=='THE TRAVELER'||storyValeRoadAvailable())return e;
 // Legacy saves may already point at an unavailable Vale scene. Replace only
 // that stale scene with an established discovery, retaining the paid road turn.
 const region=r10Region(),pool=r10Pool(region),index=pool.findIndex(x=>x.title==='OLD BILLBOARD');
 if(index<0)return e;
 if(r6Road()?.active)r6Road().index=index;
 roadEncounterOrder[currentRoadEncounterIndex()]=index;
 return currentEncounter();
}
function storyValeReunion(){
 const f=player.flags,vale=wandererByName('Vale');
 if(!f.travelerInSolace||f.valeReunionSeen||!vale||!wandererAlive(vale)||portIsHired('Vale'))return false;
 // Commit before queued output: redraws and repeated conversation cannot replay it.
 f.valeReunionSeen=true;f.jenFamiliarFaceSeen=true;ws('Vale').met=true;wandererLocations.Vale='jen';
 add('Vale joins you at the bar, her arm cleanly dressed. Jen sets down a cup beside her.');
 add('VALE > I kept you that seat. Jen says you have been making yourself useful.','bright');
 add('JEN > She told me what you did out there. I am glad you both made it back.','bright');
 return true;
}
function wandererDialogue(w){ const st=ws(w.name); const pools={Tess:["TESS > Still walking? Good.","TESS > Road east smells like rain and trouble.","TESS > You again. Route's getting crowded."],Patch:["PATCH > Found a washer too. Huge day.","PATCH > If it still turns, somebody can use it."],Ash:["ASH > I'm not staying long.","ASH > You ask a lot of questions.","ASH > Seriously. What do you want?"]}; const pool=pools[w.name]||[`${w.name.toUpperCase()} > Road keeps moving. So do I.`,`${w.name} glances toward the horizon. "Seen worse days."`,`"Still here?" ${w.name} almost smiles.`]; let line=pool[Math.floor(Math.random()*pool.length)]; if(pool.length>1&&line===st.lastLine)line=pool[(pool.indexOf(line)+1)%pool.length]; st.lastLine=line; st.talks++; return line; }

function showWanderer(w, context="town"){
  if(!w) return;
  if(w.name==="Vale")storyRecordValeSighting();
  if(context==="town") currentTownWanderer=w.name;
  add(`${w.name.toUpperCase()} — WANDERER — LVL ${String(w.level).padStart(2,"0")}`,"bright");
  add(w.lines[Math.floor(Math.random()*w.lines.length)]);
  add(context==="road" ? "SMALL TALK   INSPECT   FIGHT   MOVE ON" : "SMALL TALK   INSPECT   FIGHT   LEAVE", "system");
}
function showWanderersAt(spot){
  const here=wanderers.filter(w=>wandererAlive(w)&&!(typeof portIsHired==="function"&&portIsHired(w.name))&&wandererLocations[w.name]===spot);
  currentTownWanderer=null; if(!here.length) return;
  const w=here[Math.floor(Math.random()*here.length)]; currentTownWanderer=w.name;
  add(`${w.name} is here.`);
  if(w.name==="Vale")storyRecordValeSighting();
}
function showRoadWanderer(){
  let pool=wanderers.filter(w=>wandererAlive(w) && !(typeof portIsHired==="function"&&portIsHired(w.name)) && wandererSerial-ws(w.name).lastSeen>=6);
  if(!pool.length) pool=wanderers.filter(w=>wandererAlive(w)&&!(typeof portIsHired==="function"&&portIsHired(w.name)));
  const unseen=pool.filter(w=>!ws(w.name).met); if(unseen.length) pool=unseen;
  const w=v50WeightedWanderer(pool); if(!w){stage="between";showEncounter();return;}
  const st=ws(w.name), first=!st.met; st.met=true; st.lastSeen=wandererSerial++; currentRoadWanderer=w.name;
  add(""); add(`ROAD TURN ${dailyRoadTurns} — WANDERER`,"place");
  add(first?"Another stretch of Route 127 disappears behind you. Someone unfamiliar is ahead on the road.":`A familiar figure is ahead. ${w.name} recognizes you too.`);
  showWanderer(w,"road"); stage="wandererRoad";
}
wandererLocations=rollWandererLocations();

function r18ScavengerVariant(){
 const g=typeof lanternState==='function'?lanternState():null;
 const scene=g?.sceneId||`${day}:${dailyRoadTurns}:${roadGoal}:${roadTurn}`;
 const state=player.flags.r18ScavengerScene;
 if(!state||state.scene!==scene)player.flags.r18ScavengerScene={scene,variant:Math.floor(Math.random()*3)};
 return player.flags.r18ScavengerScene.variant;
}
function r18ScrapClaimState(){
 const g=typeof lanternState==='function'?lanternState():null;
 const scene=g?.sceneId||`${day}:${dailyRoadTurns}:${roadGoal}:${roadTurn}`;
 if(player.flags.r18ScrapClaimScene?.scene!==scene)player.flags.r18ScrapClaimScene={scene,disarmed:false};
 return player.flags.r18ScrapClaimScene;
}
function r18DogVariant(){
 const g=typeof lanternState==='function'?lanternState():null;
 const scene=g?.sceneId||`${day}:${dailyRoadTurns}:${roadGoal}:${roadTurn}`;
 const state=player.flags.r18DogScene;
 if(!state||state.scene!==scene)player.flags.r18DogScene={scene,variant:Math.floor(Math.random()*4)};
 return player.flags.r18DogScene.variant;
}
function r18RoachVariant(){
 const g=typeof lanternState==='function'?lanternState():null;
 const scene=g?.sceneId||`${day}:${dailyRoadTurns}:${roadGoal}:${roadTurn}`;
 if(player.flags.r18RoachScene?.scene!==scene)player.flags.r18RoachScene={scene,variant:Math.floor(Math.random()*3)};
 return player.flags.r18RoachScene.variant;
}
function r18ScrapFight(spec){
 const level=Math.max(1,Math.min(50,Number(player.level)||1));
 return {...spec,level,hp:Math.max(25,Math.floor(baseHpForLevel(level)*.32)),xp:Math.max(24,level*7),r18ScrapTrap:!r18ScrapClaimState().disarmed};
}
function r18RetainRoadReward(name,type){
 if(addPack(name,type))return true;
 (player.flags.r5LootQueue||(player.flags.r5LootQueue=[])).push({name,type,qty:1});
 add(name+" is held until you make room.","system");return true;
}
function r18CampVariant(){
 const g=typeof lanternState==='function'?lanternState():null;
 const scene=g?.sceneId||`${day}:${dailyRoadTurns}:${roadGoal}:${roadTurn}`;
 if(player.flags.r18CampScene?.scene!==scene)player.flags.r18CampScene={scene,occupied:Math.random()<.6};
 return player.flags.r18CampScene.occupied;
}
// A scene-scoped stock roll survives redraws and save/load without duplicating purchases.
function r18PeteStock(){const g=typeof lanternState==='function'?lanternState():null,scene=g?.sceneId||`${day}:${dailyRoadTurns}:${roadGoal}:${roadTurn}`,f=player.flags;if(f.r18PeteStock?.scene===scene)return f.r18PeteStock;const stock={scene,potato:Math.random()<.5,equipment:null};if(Math.random()<.25){const pool=EQUIPMENT_CATALOG.filter(x=>x.rarity==='uncommon'&&['weapon','armor'].includes(x.type)),def=pool[Math.floor(Math.random()*pool.length)];if(def){const level=Math.max(def.minLevel,Math.min(def.maxLevel,Math.floor(Number(player.level)||1)));stock.equipment={name:catalogInstanceName(def,level),type:def.type,price:80+level*3,sold:false};}}f.r18PeteStock=stock;return stock;}
function r18FreezerScene(){
 const g=typeof lanternState==='function'?lanternState():null;
 const scene=typeof RoadLifecycle!=='undefined'?RoadLifecycle.sceneKey('early:32'):g?.sceneId||`${day}:${dailyRoadTurns}:${roadGoal}:${roadTurn}`;
 if(typeof RoadLifecycle!=='undefined'&&player.flags.r18FreezerScene)player.flags.r18FreezerScene.scene=scene;if(player.flags.r18FreezerScene?.scene!==scene)player.flags.r18FreezerScene={scene,ambush:Math.random()>=.6,opened:false};
 return player.flags.r18FreezerScene;
}
function r18OpenMechanicChest(){
 if(player.flags.r18MechanicChestOpened){add("The mechanic's chest has already been emptied.","system");return true;}
 const eligible=Object.keys(CRAFT_RECIPES).filter(k=>['uncommon','rare'].includes(CRAFT_RECIPES[k].rarity||GEAR[CRAFT_RECIPES[k].name]?.rarity)&&!GEAR[CRAFT_RECIPES[k].name]?.questOnly&&typeof r11Learned==='function'&&!r11Learned(k)),uncommon=eligible.filter(k=>(CRAFT_RECIPES[k].rarity||GEAR[CRAFT_RECIPES[k].name]?.rarity)==='uncommon'),pool=uncommon.length?uncommon:eligible;
 if(pool.length){const key=pool[Math.floor(Math.random()*pool.length)];player.flags.r11Learned=player.flags.r11Learned||{};player.flags.r11Learned[key]=true;add('BLUEPRINT LEARNED — '+CRAFT_RECIPES[key].name,'reward');}
 else{r18RetainRoadReward('Scrap Metal','material');add('The plans are already familiar, but the chest contains usable Scrap Metal.','reward');}
 r18RetainRoadReward('Wire','material');player.flags.r18MechanicChestOpened=true;gainXp(Math.max(8,player.level*2));return true;
}
const R18_CHESS_PUZZLES=[
 {setup:'White king F6, white queen G6; black king H8. White to move.',answer:'QUEEN G7',wrong:['QUEEN E6','KING E6']},
 {setup:'White king C6, white queen B6; black king A8. White to move.',answer:'QUEEN B7',wrong:['QUEEN D6','KING D6']},
 {setup:'White king F3, white queen G3; black king H1. White to move.',answer:'QUEEN G2',wrong:['QUEEN E3','KING E3']}
];
function r18PicnicScene(){const g=typeof lanternState==='function'?lanternState():null,scene=typeof RoadLifecycle!=='undefined'?RoadLifecycle.sceneKey('early:41'):g?.sceneId||`${day}:${dailyRoadTurns}:${roadGoal}:${roadTurn}`,f=player.flags;if(typeof RoadLifecycle!=='undefined'&&f.r18PicnicScene)f.r18PicnicScene.scene=scene;if(f.r18PicnicScene?.scene!==scene)f.r18PicnicScene={scene,variant:Math.floor(Math.random()*R18_CHESS_PUZZLES.length)};return f.r18PicnicScene;}
function r18PicnicBlueprint(){
 const f=player.flags;if(f.r18PicnicClaimed){add('The compartment has already been opened.','system');return true;}if(typeof r11Migrate==='function')r11Migrate();
 const pool=Object.keys(CRAFT_RECIPES).filter(k=>CRAFT_RECIPES[k].type==='weapon'&&GEAR[CRAFT_RECIPES[k].name]?.rarity==='uncommon'&&typeof r11Learned==='function'&&!r11Learned(k));
 if(pool.length){const key=pool[Math.floor(Math.random()*pool.length)];f.r11Learned=f.r11Learned||{};f.r11Learned[key]=true;add('BLUEPRINT LEARNED — '+CRAFT_RECIPES[key].name,'reward');}
 else{r18RetainRoadReward('Scrap Metal','material');add('The plans are familiar, but the compartment contains usable Scrap Metal.','reward');}f.r18PicnicClaimed=true;gainXp(Math.max(10,player.level*2));return true;
}
const R18_MAZE_BASE=["#######","#S..#.#","#.#.#.#","#.#...#","#...#.#","###..G#","#######"];
const R18_MAZE_ALT=["#######","#S#...#","#.#.#.#","#...#.#","###.#.#","#....G#","#######"];
function r18RotateMaze(grid){return grid[0].split('').map((_,x)=>grid.map(row=>row[x]).reverse().join(''));}
const R18_MAZES=[R18_MAZE_BASE];for(let i=1;i<4;i++)R18_MAZES.push(r18RotateMaze(R18_MAZES[i-1]));R18_MAZES.push(R18_MAZE_ALT);
function r18MazeScene(){const g=typeof lanternState==='function'?lanternState():null,scene=typeof RoadLifecycle!=='undefined'?RoadLifecycle.sceneKey('early:27'):g?.sceneId||`${day}:${dailyRoadTurns}:${roadGoal}:${roadTurn}`,f=player.flags;if(typeof RoadLifecycle!=='undefined'&&f.r18MazeScene)f.r18MazeScene.scene=scene;if(f.r18MazeScene?.scene!==scene){const count=Math.min(5,1+Math.floor((Math.max(1,player.level)-1)/10)),variant=Math.floor(Math.random()*count),grid=R18_MAZES[variant],y=grid.findIndex(row=>row.includes('S')),x=grid[y].indexOf('S');f.r18MazeScene={scene,variant,x,y,step:0,started:false,finished:false};}return f.r18MazeScene;}
function r18MazeDraw(q){const grid=R18_MAZES[q.variant];return grid.map((row,y)=>Array.from(row,(v,x)=>x===q.x&&y===q.y?'@':v==='#'?'■':v==='G'?'◆':'·').join(' ')).join('\n');}
// Station Nine remains attached to the discovered highway segment, preserving the approved map graph.
const R18_STATION_NEEDS={Electronics:2,Wire:3,'Scrap Metal':2};
function r18StationDiscover(){const g=typeof lanternState==='function'?lanternState():null;if(!g?.currentEdgeId)return false;player.flags.r18Station=player.flags.r18Station||{edge:g.currentEdgeId,step:g.stepIndex,parts:{},hunters:'active',restored:false};return true;}
function r18StationAtOrigin(){const q=player.flags.r18Station,g=typeof lanternState==='function'?lanternState():null;if(!q||!g)return false;if(g.currentEdgeId)return q.edge===g.currentEdgeId&&q.step===g.stepIndex;const e=typeof LG_EDGES!=='undefined'&&LG_EDGES[q.edge];return !!e&&(q.step===0&&g.nodeId===e.a||q.step===e.distanceTurns&&g.nodeId===e.b);}
function r18StationAvailable(){const g=typeof lanternState==='function'?lanternState():null;return !!g&&!g.pending&&r18StationAtOrigin();}
function r18StationEnter(){if(!r18StationAtOrigin()){add('The dirt path begins at the marked road segment.','system');return false;}stage='r18Station';r18StationMenu();return true;}
function r18StationMenu(){const q=player.flags.r18Station;if(!q){stage='between';return renderCurrentChoices();}add('STATION NINE — DIRT PATH','place');if(q.restored){add('Evelyn Cross monitors the restored tower. A Tomorrow Network trader tends a supply case.','bright');return r5DirectChoices(['TALK TO EVELYN','TALK TO NETWORK TRADER','LEAVE STATION']);}if(q.hunters==='active'){add('Evelyn Cross is pinned down by Signal Hunters near the tower.','danger');return r5DirectChoices(['TALK TO EVELYN','FIGHT SIGNAL HUNTERS','SABOTAGE SIGNAL HUNTERS','NEGOTIATE WITH SIGNAL HUNTERS','LEAVE STATION']);}add('Tower supplies: '+Object.entries(R18_STATION_NEEDS).map(([k,n])=>k+' '+(q.parts[k]||0)+'/'+n).join('   '),'system');r5DirectChoices(['TALK TO EVELYN',...Object.keys(R18_STATION_NEEDS).filter(k=>(q.parts[k]||0)<R18_STATION_NEEDS[k]).map(k=>'CONTRIBUTE '+k.toUpperCase()),...(Object.entries(R18_STATION_NEEDS).every(([k,n])=>(q.parts[k]||0)>=n)?['RESTORE TOWER']:[]),'LEAVE STATION']);}
function r18StationReturn(){const g=typeof lanternState==='function'?lanternState():null;if(g&&!g.pending){if(g.currentEdgeId){stage='lanternRoad';lanternRoadMenu();}else{stage='lanternNode';lanternNodeMenu();}}else{stage='encounter';completeRoadTurn();}}
function r18StationFight(){const level=Math.max(1,Math.min(50,Number(player.level)||1)),enemyHp=Math.max(15,Math.floor(baseHpForLevel(level)*.2)),integrity=Math.max(5,Math.ceil(enemyHp/Math.max(1,weaponRange()[0]-2))+3);startCombat({name:'SIGNAL HUNTERS',level,hp:Math.max(30,Math.floor(baseHpForLevel(level)*.4)),min:3,max:7,xp:Math.max(30,level*6),bolts:0,r18StationGenerator:integrity,r18StationGeneratorMax:integrity,enemies:[{name:'TRACKER',hp:enemyHp,r18Min:3,r18Max:8,bolts:0},{name:'BREACHER',hp:enemyHp,r18Min:2,r18Max:6,bolts:0}],end:'The remaining Signal Hunters retreat from the tower.'},'r18StationFight');}
function r18StationCoverDamage(c,target,damage){if(c.source==='r18StationFight'&&target?.name==='BREACHER'&&c.enemies?.some(e=>e.name==='TRACKER'&&e.hp>0)){add('The Tracker provides covering fire for the Breacher.','danger');return Math.max(1,damage-2);}return damage;}
function r18StationGeneratorTurn(c){if(c.source!=='r18StationFight'||!c.enemies?.some(e=>e.name==='BREACHER'&&e.hp>0))return false;c.r18StationGenerator=Math.max(0,(Number(c.r18StationGenerator)||0)-1);add('The Breacher attacks the generator. Integrity: '+c.r18StationGenerator+'/'+c.r18StationGeneratorMax+'.','danger');if(c.r18StationGenerator>0)return false;combatState=null;stage='r18Station';add('Evelyn pulls you into cover as the generator fails. The Signal Hunters still hold the tower; you can retry.','danger');r18StationMenu();return true;}
function r18StationCombatWin(){const q=player.flags.r18Station;if(!q)return completeRoadTurn();q.hunters='defeated';stage='r18Station';r18StationMenu();}
function r18StationCombatRetreat(){stage='r18Station';add('You withdraw to cover. The Signal Hunters still hold the approach.','system');r18StationMenu();}
function r18StationTrader(){stage='r18StationTrader';add('TOMORROW NETWORK TRADER','place');const level=Math.max(1,Math.min(50,Math.floor(Number(player.level)||1)));for(const [id,label]of [['weapon-common-pipe-wrench','NETWORK WRENCH'],['armor-common-canvas-work-coat','NETWORK COAT']]){const d=EQUIPMENT_CATALOG.find(x=>x.id===id);add(label+' — '+Economy.value(catalogInstanceName(d,level))+' BOLTS','system');}r5DirectChoices(['BUY ELECTRONICS — 30 BOLTS','BUY WIRE — 8 BOLTS','BUY SCRAP METAL — 5 BOLTS','BUY BANDAGE — 10 BOLTS','BUY NETWORK WRENCH','BUY NETWORK COAT','RETURN TO STATION']);}
function r18StationCommand(cmd){const q=player.flags.r18Station;if(!q){stage='between';return renderCurrentChoices();}if(stage==='r18StationTrader'){if(['return to station','back','b'].includes(cmd)){stage='r18Station';return r18StationMenu();}if(cmd==='buy network wrench'||cmd==='buy network coat'){const level=Math.max(1,Math.min(50,Math.floor(Number(player.level)||1))),id=cmd==='buy network wrench'?'weapon-common-pipe-wrench':'armor-common-canvas-work-coat',def=EQUIPMENT_CATALOG.find(x=>x.id===id),price=def?Economy.value(catalogInstanceName(def,level)):0;if(!def||player.bolts<price)add('Equipment unavailable or insufficient Bolts.','system');else{const name=catalogInstanceName(def,level);if(addPack(name,def.type,1,true)){player.bolts-=price;updateHud();add('Purchased '+name+'.','reward');}else add('Backpack full. No Bolts charged.','system');}return r18StationTrader();}const offers={'buy electronics — 30 bolts':['Electronics','material',30],'buy wire — 8 bolts':['Wire','material',8],'buy scrap metal — 5 bolts':['Scrap Metal','material',5],'buy bandage — 10 bolts':['Bandage','consumable',10]},o=offers[cmd];if(o){if(player.bolts<o[2])add('Not enough Bolts.','system');else if(addPack(o[0],o[1],1)){player.bolts-=o[2];updateHud();add('Purchased '+o[0]+'.','reward');}}return r18StationTrader();}if(['leave station','back','b'].includes(cmd))return r18StationReturn();if(cmd==='talk to evelyn'){add(q.restored?'EVELYN CROSS > Grand City still sends whispers through the static. If anyone there is listening, we will find them.':'EVELYN CROSS > The Hunters want the transmitter silent. Help me keep the road connected.','bright');return r18StationMenu();}if(q.restored&&cmd==='talk to network trader')return r18StationTrader();if(q.hunters==='active'){if(cmd==='fight signal hunters')return r18StationFight();if(cmd==='sabotage signal hunters'){if(!r6ConsumeMaterial('Wire',1))add('One Wire is needed to disrupt their receiver.','system');else{q.hunters='sabotaged';add('You disrupt their receiver; the Signal Hunters withdraw.','reward');}return r18StationMenu();}if(cmd==='negotiate with signal hunters'){if(player.bolts<25)add('Negotiation requires 25 Bolts.','system');else{player.bolts-=25;updateHud();q.hunters='negotiated';add('The Signal Hunters take the payment and leave Evelyn alone.','reward');}return r18StationMenu();}}if(cmd.startsWith('contribute ')&&q.hunters!=='active'&&!q.restored){const k=Object.keys(R18_STATION_NEEDS).find(k=>k.toLowerCase()===cmd.slice(11));if(!k||(q.parts[k]||0)>=R18_STATION_NEEDS[k])return r18StationMenu();if(!r6ConsumeMaterial(k,1))add('You do not have that material.','system');else{q.parts[k]=(q.parts[k]||0)+1;updateHud();add('One '+k+' contributed to the tower.','reward');}return r18StationMenu();}if(cmd==='restore tower'&&!q.restored&&q.hunters!=='active'&&Object.entries(R18_STATION_NEEDS).every(([k,n])=>(q.parts[k]||0)>=n)){q.restored=true;gainBolts(100);gainXp(Math.max(50,(Number(player.level)||1)*10));if(typeof r11Migrate==='function')r11Migrate();const f=player.flags;f.r11Learned=f.r11Learned||{};const key=!r11Learned('relayVest')?'relayVest':Object.keys(CRAFT_RECIPES).find(k=>GEAR[CRAFT_RECIPES[k].name]?.rarity==='rare'&&!r11Learned(k));if(key){f.r11Learned[key]=true;add('RARE BLUEPRINT LEARNED — '+CRAFT_RECIPES[key].name,'reward');}else{r18RetainRoadReward('Tempered Steel','material');add('All available Rare blueprints are already known; Evelyn offers Tempered Steel.','reward');}add('STATION NINE RESTORED — the Tomorrow Network is on the air.','reward');return r18StationMenu();}return r18StationMenu();}
function r18CountyTruckScene(){const g=typeof lanternState==='function'?lanternState():null,scene=typeof RoadLifecycle!=='undefined'?RoadLifecycle.sceneKey('early:0'):g?.sceneId||`${day}:${dailyRoadTurns}:${roadGoal}:${roadTurn}`;if(typeof RoadLifecycle!=='undefined'&&player.flags.r18CountyTruckScene)player.flags.r18CountyTruckScene.scene=scene;if(player.flags.r18CountyTruckScene?.scene!==scene)player.flags.r18CountyTruckScene={scene,followed:false};return player.flags.r18CountyTruckScene;}
// The county depot is a resumable encounter at the original road segment, not a map node.
function r18DepotTrailDescription(){const q=player.flags.r18CountyDepot,e=q?.edge&&typeof LG_EDGES!=='undefined'?LG_EDGES[q.edge]:null;if(!e||typeof LG_NODES==='undefined')return 'Return to the road where you found the county truck.';return 'County depot trail: '+LG_NODES[e.a].name+' ↔ '+LG_NODES[e.b].name+', position '+q.step+' of '+e.distanceTurns+'.';}
function r18DepotAtOrigin(){const q=player.flags.r18CountyDepot,g=typeof lanternState==='function'?lanternState():null;return !!q&&(!q.edge||!!g&&g.currentEdgeId===q.edge&&g.stepIndex===q.step);}
function r18DepotResumeAvailable(){const g=typeof lanternState==='function'?lanternState():null;return player.flags.r18CountyQuest==='active'&&!!g&&!g.pending&&r18DepotAtOrigin();}
function r18DepotEnter(){const f=player.flags,g=typeof lanternState==='function'?lanternState():null;if(f.r18CountyQuest==='done'){add('Eli has already been rescued from the depot.','system');return false;}if(f.r18CountyDepot&&!r18DepotAtOrigin()){add('The depot trail begins at the road segment marked in your quest journal.','system');return false;}f.r18CountyDepot=f.r18CountyDepot||{edge:g?.currentEdgeId||null,step:g?.stepIndex??null,neutralized:false,log:false,locker:false};f.r18CountyQuest='active';stage='r18Depot';r18DepotMenu();return true;}
function r18DepotMenu(){const q=player.flags.r18CountyDepot;if(!q){stage='between';renderCurrentChoices();return;}add('COUNTY MAINTENANCE DEPOT','place');add(q.neutralized?'Unit 07 is still. A trapped mechanic calls from behind a service door.':'Unit 07 patrols a fenced maintenance depot. A voice calls from behind a service door.','system');r5DirectChoices(['INSPECT DEPOT LOG',...(!q.locker?['SEARCH DEPOT LOCKER']:[]),...(!q.neutralized?['DISABLE UNIT WITH TWO WIRE','SNEAK PAST UNIT','FIGHT UNIT 07']:['FREE ELI MERCER']),'LEAVE DEPOT']);}
function r18DepotReturn(){const g=typeof lanternState==='function'?lanternState():null;if(g&&!g.pending&&g.currentEdgeId){stage='lanternRoad';lanternRoadMenu();}else{stage='encounter';completeRoadTurn();}}
function r18DepotFight(){const level=Math.max(1,Math.min(50,Number(player.level)||1));startCombat({name:'COUNTY UNIT 07',level,hp:Math.max(25,Math.floor(baseHpForLevel(level)*.30)),min:3,max:7,xp:Math.max(24,level*6),bolts:0,end:'Unit 07 powers down beside the service door.'},'r18DepotFight');}
function r18DepotCombatRetreat(){stage='r18Depot';add('You retreat into cover at the depot. Unit 07 is still active.','system');r18DepotMenu();}
function r18DepotCombatWin(){const q=player.flags.r18CountyDepot;if(!q){completeRoadTurn();return;}q.neutralized=true;stage='r18Depot';r18DepotMenu();}
function r18DepotCommand(cmd){const f=player.flags,q=f.r18CountyDepot;if(!q){stage='between';renderCurrentChoices();return;}
 if(cmd==='leave depot'||cmd==='back'){add('You mark the depot trail and return to the highway.','system');return r18DepotReturn();}
 if(cmd==='inspect depot log'){add('The log identifies Unit 07 and mechanic Eli Mercer. A repair note describes an exposed two-wire isolation circuit.','bright');if(!q.log){q.log=true;gainXp(Math.max(6,player.level));}return r18DepotMenu();}
 if(cmd==='search depot locker'){if(q.locker){add('The locker has already been searched.','system');return r18DepotMenu();}q.locker=true;r18RetainRoadReward('Electronics','material');add('A service locker contains Electronics.','reward');return r18DepotMenu();}
 if(cmd==='disable unit with two wire'&&!q.neutralized){if(r6MaterialCount('Wire')<2){add('Two Wire are needed to isolate Unit 07.','system');return r18DepotMenu();}if(!r6ConsumeMaterial('Wire',2))return r18DepotMenu();q.neutralized=true;add('You isolate Unit 07’s control circuit. The machine powers down.','reward');return r18DepotMenu();}
 if(cmd==='sneak past unit'&&!q.neutralized){if(Math.random()<.6){q.neutralized=true;add('You slip past the patrol and lock Unit 07 behind a service gate.','bright');return r18DepotMenu();}add('Unit 07 detects movement and turns toward you.','danger');return r18DepotFight();}
 if(cmd==='fight unit 07'&&!q.neutralized)return r18DepotFight();
 if(cmd==='free eli mercer'&&q.neutralized){if(f.r18CountyQuest==='done'){add('Eli has already been rescued.','system');return r18DepotMenu();}f.r18CountyQuest='done';f.r18EliRescued=true;gainBolts(50);gainXp(Math.max(40,player.level*8));r18RetainRoadReward('Wire','material');add('ELI “WRENCH” MERCER > I owe you one. I’m heading for Seaport; perhaps they can use a mechanic.','reward');if(typeof portRecruitUnlocked==='function')portRecruitUnlocked();return r18DepotReturn();}
 r18DepotMenu();}
function r18WreckersMedical(){const options=['Bandage','Reinforced Bandage','Emergency Trauma Kit'];return options[Math.floor(Math.random()*options.length)];}
const {encounters, eastEncounters} = RoadScenarioRegistry.base();
// v35: explicit action keys keep these branching events unambiguous.
function beginnerEvent(title, text, actions, combat=null){
  return {title,text,exclusive:true,minLevel:1,maxLevel:10,
    choices:[...Object.keys(actions),"MOVE ON"].join("   "),combat,
    resolve(cmd){const action=actions[cmd.toUpperCase()];return action ? action()!==false : false;}};
}
function roadLoot(name,type="material",qty=1){return addPack(name,type,qty);}
function roadTrade(name,type,cost){
  const existing=player.pack.find(i=>i.name===name&&i.type===type&&!i.stolen);
  if(player.bolts<cost){add(`You need ${cost} Bolts.`,"system");return false;}
  if(!existing&&packSlotsUsed()>=player.packMax){add("Your backpack is full. Nothing traded.","system");return false;}
  if(!addPack(name,type))return false;
  player.bolts-=cost;updateHud();return true;
}
const {beginnerAdditions} = RoadScenarioRegistry.beginner();
// Postal assignments live in flags and carry protected quest items; legacy encounter IDs are unchanged.
const R18_COURIER_ITEMS={tim:'Sealed Letter for Tim',jen:'Sealed Letter for Jen',docks:'Sealed Parcel for Seaport Docks'};
function r18CourierState(){return player.flags.r18Courier||(player.flags.r18Courier={phase:'new',delivered:{}});}
function r18CourierHas(dest){const name=R18_COURIER_ITEMS[dest];return !!player.pack.find(i=>i.name===name&&i.type==='quest'&&i.qty>0);}
function r18CourierIssue(dest){if(!r18CourierHas(dest))return addPack(R18_COURIER_ITEMS[dest],'quest',1,true);return true;}
function r18CourierTake(dest){const i=player.pack.find(i=>i.name===R18_COURIER_ITEMS[dest]&&i.type==='quest'&&i.qty>0);if(!i)return false;if(--i.qty<=0)player.pack.splice(player.pack.indexOf(i),1);updateHud();return true;}
function r18CourierStart(){const q=r18CourierState();if(q.phase!=='new'){add('Miles already gave you this delivery assignment.','system');return;}if(!r18CourierIssue('tim')||!r18CourierIssue('jen')||!r18CourierIssue('docks')){add('Miles cannot issue the letters right now.','system');return;}q.phase='initial';q.delivered={};add('MILES > Deliver these to Tim and Jen in Solace. Deliver the third parcel to the docks after Seaport is liberated.','reward');}
function r18CourierEligible(dest){const q=r18CourierState();return q.phase==='initial'&&!q.delivered[dest]&&(dest==='docks'?typeof portRecruitUnlocked==='function'&&portRecruitUnlocked()&&r18CourierHas(dest):r18CourierHas(dest))||q.phase==='service'&&q.job?.destination===dest&&q.job.status==='active'&&r18CourierHas(dest);}
function r18CourierDeliver(dest){const q=r18CourierState();if(!r18CourierEligible(dest)){add('No delivery is ready for this recipient.','system');return false;}if(!r18CourierTake(dest)){add('The delivery item is missing; no reward was claimed.','system');return false;}if(q.phase==='initial'){q.delivered[dest]=true;add('Delivery completed: '+dest.toUpperCase()+'.','reward');if(q.delivered.tim&&q.delivered.jen&&q.delivered.docks){q.phase='service';gainBolts(150);gainXp(Math.max(30,(Number(player.level)||1)*8));add('NEITHER RAIN NOR RUIN COMPLETE — the Solace Post Office is open.','reward');}}else{q.job.status='delivered';add('Delivery completed. Return to the Post Office to claim your reward.','reward');}return true;}
function r18CourierMenu(){const q=r18CourierState();mercyLocation='postOffice';player.flags.solaceMenu='postOffice';add('SOLACE POST OFFICE','place');if(q.job)add('ASSIGNMENT: '+q.job.destination.toUpperCase()+' — '+q.job.status.toUpperCase(),'system');else add('Available deliveries: Tim, Jen, and the liberated Seaport docks.','system');const a=q.job?(q.job.status==='delivered'?['CLAIM DELIVERY REWARD']:['OPEN SEALED PARCEL']):['ACCEPT TIM DELIVERY','ACCEPT JEN DELIVERY',...(typeof portRecruitUnlocked==='function'&&portRecruitUnlocked()?['ACCEPT SEAPORT DELIVERY']:[])];v53Choices(a.concat(['ASK ABOUT DELIVERIES','RETURN TO TOWN']));}
function r18CourierCommand(cmd){const q=r18CourierState();if(cmd==='return to town'||cmd==='back'||cmd==='b'){delete q.tamperPending;mercyLocation='town';mercyMenu();return;}if(cmd==='ask about deliveries'){add('POST OFFICE > The roads are safer when people can still reach one another. Deliver the parcel, then come back for your pay.','bright');return r18CourierMenu();}if(cmd.startsWith('accept ')&&cmd.endsWith(' delivery')){const d=cmd.slice(7,-9),dest=d==='seaport'?'docks':d;if(!['tim','jen','docks'].includes(dest)||q.job||(dest==='docks'&&!(typeof portRecruitUnlocked==='function'&&portRecruitUnlocked()))){add('That delivery is unavailable.','system');return r18CourierMenu();}if(q.restitutionRequired&&v52Crime().active.some(x=>x.type==='Mail Tampering'&&x.victim==='Miles')){add('Miles has suspended deliveries until the mail-tampering bounty is cleared.','system');return r18CourierMenu();}delete q.restitutionRequired;if((Number(day)||1)<Math.max(Number(q.suspendedUntil)||0,Number(q.nextJobDay)||0)){add('New deliveries are unavailable until day '+Math.max(Number(q.suspendedUntil)||0,Number(q.nextJobDay)||0)+'.','system');return r18CourierMenu();}if(r18CourierIssue(dest)){q.job={destination:dest,status:'active'};add('Delivery accepted.','reward');}return r18CourierMenu();}if(cmd==='claim delivery reward'&&q.job?.status==='delivered'){delete q.job;q.nextJobDay=(Number(day)||1)+3;gainBolts(20);gainXp(Math.max(10,(Number(player.level)||1)*2));add('Delivery reward claimed.','reward');return r18CourierMenu();}if(cmd==='open sealed parcel'&&q.job?.status==='active'){q.tamperPending=true;add('Opening this parcel ends the delivery and is reported as a crime.','danger');return v53Choices(['CONFIRM PARCEL TAMPERING','CANCEL PARCEL TAMPERING']);}if(cmd==='cancel parcel tampering'){delete q.tamperPending;return r18CourierMenu();}if(cmd==='confirm parcel tampering'&&q.tamperPending&&q.job?.status==='active'){delete q.tamperPending;if(!r18CourierTake(q.job.destination)){add('The parcel is missing; nothing was opened.','system');return r18CourierMenu();}delete q.job;q.suspendedUntil=(Number(day)||1)+3;q.restitutionRequired=true;v52Record('Mail Tampering','Miles','Opened a sealed postal delivery',100);add('New deliveries are suspended for three game days and until the bounty is cleared.','danger');return r18CourierMenu();}return r18CourierMenu();}
// Appended after existing encounters so saved encounter indexes stay stable.
RoadScenarioRegistry.courier();
const {encounterLevels, combatSpecs, combatTriggers} = RoadScenarioRegistry.combat();
function v555RollEquipmentDrop(){
 const level=Math.max(1,Math.min(50,Math.floor(Number(player.level)||1)));
 const rarity=equipmentRarityRoll(level,Math.random()*100);
 if(rarity==='legendary')return 'RESERVED_LEGENDARY_ROLL';
 const type=Math.random()<.5?'weapon':'armor';
 const pool=EQUIPMENT_CATALOG.filter(x=>x.rarity===rarity&&x.type===type&&level>=x.minLevel&&level<=x.maxLevel);
 return catalogInstanceName(pool[Math.floor(Math.random()*pool.length)],level);
}
function v555AwardEquipmentDrop(guaranteeOrdinary=false){
  let item=v555RollEquipmentDrop();
  if(guaranteeOrdinary){
    for(let tries=0;tries<32&&(!item||item==='RESERVED_LEGENDARY_ROLL');tries++)item=v555RollEquipmentDrop();
    if(!item||item==='RESERVED_LEGENDARY_ROLL'){
      const level=Math.max(1,Math.min(50,Math.floor(Number(player.level)||1)));
      const fallback=EQUIPMENT_CATALOG.find(x=>x.rarity==='common'&&['weapon','armor'].includes(x.type)&&level>=x.minLevel&&level<=x.maxLevel);
      if(fallback)item=catalogInstanceName(fallback,level);
    }
  }
  if(item==='RESERVED_LEGENDARY_ROLL'){
    player.flags.reservedLegendaryRolls=(Number(player.flags.reservedLegendaryRolls)||0)+1;
    add('A Legendary equipment roll is reserved for future approved equipment.','system');return true;
  }
  if(!item)return false;
  if(addPack(item,GEAR[item].type,1,false)){
    add(`RANDOM EQUIPMENT DROP — ${gearLabel(item)}`,'reward');
  }else{
    player.flags=player.flags||{};
    player.flags.pendingEquipmentDrops=player.flags.pendingEquipmentDrops||[];
    player.flags.pendingEquipmentDrops.push(item);
    add(`EQUIPMENT DROP HELD — ${gearLabel(item)}. Free a backpack slot, then claim pending equipment.`,'system');
  }
  return true;
}
function v555ClaimEquipmentDrop(){
  const pending=player.flags?.pendingEquipmentDrops;
  if(!Array.isArray(pending)||!pending.length)return false;
  if(addPack(pending[0],GEAR[pending[0]]?.type||'weapon',1,false)){
    const name=pending.shift();add(`CLAIMED EQUIPMENT DROP — ${gearLabel(name)}`,'reward');
    if(!pending.length)delete player.flags.pendingEquipmentDrops;
  }else add('EQUIPMENT DROP STILL HELD — FREE A BACKPACK SLOT.','system');
  return true;
}
function startCombat(spec, source="encounter", townCost=false, openingAttack=false){
  if(townCost){ if(player.turns<=0){add("NO EXPEDITION TURNS REMAIN.","danger");return;} player.turns--; player.lifetimeTurns=(Number(player.lifetimeTurns)||0)+1; updateHud(); }
  combatState={...spec,hp:spec.hp,maxHp:spec.hp,source,bolts:Math.max(0,Number(spec.bolts)||0),enemies:spec.enemies?spec.enemies.map(e=>({...e,maxHp:e.hp})):undefined}; stage="combat";
  busy=true; input.disabled=true;
  add(`${spec.name} — LVL ${String(spec.level).padStart(2,"0")} — HP ${spec.hp}/${spec.hp}`,"bright");
  if(spec.r18PowderGrenadePending)add("The bomber pulls a grenade pin. Dodge, take cover, or keep attacking before it explodes.","danger");
  // Combat entry is a state transition, not a hidden extra attack. Always show the combat menu first.
  outputQueue=outputQueue.then(()=>{
    if(stage==="combat" && combatState){
      renderCurrentChoices();
      followOutput();
    }
    busy=false; input.disabled=false; input.focus();
  });
}
function renderCombatMenu(){
 if(combatState?.wo4Sniper){r5DirectChoices(["ATTACK","FIND COVER","RETURN FIRE","FLANK SNIPER","USE ITEM","BACK OFF"]);return;}
 if(combatState?.wo3Drone){r5DirectChoices(["ATTACK",...(!combatState.wo3LightShot?["SHOOT FLOODLIGHT"]:[]),"TAKE CONTAINER COVER","USE ITEM","BACK OFF"]);return;}
 if(combatState?.wo3Crawler){r5DirectChoices(["ATTACK",...(combatState.armorDef>0?["EXPOSE UNDERSIDE"]:[]),"USE ITEM","BACK OFF"]);return;}
 const living=(combatState?.enemies||[]).map((enemy,index)=>({enemy,index})).filter(x=>x.enemy.hp>0);
 const trapped=!!combatState?.r18NoRetreat||(combatState?.name==='GANG LOOKOUT'&&combatState.reinforcementsArrived);
 if((living.length>1||(living.length&&(combatState?.r18BoneSnareAvailable||combatState?.r18ChoirValveAvailable)))&&typeof r5DirectChoices==='function'){
  r5DirectChoices([...living.map(({enemy,index})=>`ATTACK ${index+1} — ${enemy.name} (${enemy.hp} HP)`),...(combatState?.r18BoneSnareAvailable?['TRIGGER SNARE']:[]),...(combatState?.r18ChoirValveAvailable?['RING VALVES']:[]),'USE ITEM',...(trapped?[]:['BACK OFF'])]);
  return;
 }
 if(combatState?.r18PowderGrenadePending)return r5DirectChoices(['ATTACK','DODGE GRENADE','TAKE COVER','USE ITEM','BACK OFF']);
 add(combatState?.r18Bare?'(A) ATTACK   (B) BACK OFF':trapped?'(A) ATTACK   (U) USE ITEM':'(A) ATTACK   (U) USE ITEM   (B) BACK OFF','system');
}
function handleCombat(cmd){
  const c=combatState; if(!c){stage="between";return;}
  if(c.wo3Reward&&RoadScenarioRegistry.wo3Tactic(cmd,c))return;
  if(c.wo4Reward&&RoadScenarioRegistry.wo4Tactic(cmd,c))return;
  if(["b","back","back off","flee","run","retreat"].includes(cmd) && (c.r18NoRetreat||(c.name==="GANG LOOKOUT"&&c.reinforcementsArrived))){add(c.name==="GANG LOOKOUT"?"The gang has surrounded you. There is no way to retreat until the fight ends.":"You are surrounded. There is no way to retreat until the fight ends.","danger");renderCombatMenu();return;}
  if(["b","back","back off","flee","run","retreat"].includes(cmd)){ if(c.r18BoneHunters&&!c.r18BoneKnowledge&&player.hp>1&&Math.random()<.25){const damage=scaledEnemyDamage(2,armorDefense(),c.level);add("A hunter catches you during the retreat.","danger");hurt(damage);if(stage==="fallen"||!combatState)return;} add("You break contact before the fight gets worse."); combatState=null; if(c.source==="gateGuards"){stage="settlement";player.flags.solaceGateChallenge=true;add("The guard raises his weapon again. He wants an explanation before anyone else gets hurt.","man");add("STATE YOUR BUSINESS   (1) TERMINAL   (2) TRADE   (3) RELAY   (4) PASSING THROUGH   (5) FIGHT","system");} else if(c.source==="wo4HospitalEntrance"){RoadScenarioRegistry.wo4HospitalMenu();} else if(c.source==="seaportLiberation"){portLiberationRetreat();} else if(c.source==="seaportRoadFight"){portCombatRetreat(c);} else if(c.source==="factoryFight"){factoryCombatRetreat(c); } else if(c.source==="r18DepotFight"){r18DepotCombatRetreat();} else if(c.source==="r18StationFight"){r18StationCombatRetreat();} else if(c.source==="r18TournamentFight"){r18TournamentRetreat(c);} else if(c.source==="r18AshFight"){r18AshRetreat();} else if(c.source==="r18RedFight"){r18RedRetreat();} else if(c.source==="jenBoss"){player.flags.jenQuest="raiders";completeRoadTurn();} else if(c.source==="houseBoss"){add("You retreat onto the porch. The occupant stays inside.");arriveHouse();} else if(c.source==="serviceBoss"){stage="serviceRoad";add("You retreat to the maintenance-yard fence.");add("CONTINUE UP ROAD   RETURN TO FORK","system");} else if(c.source==="roadWanderer"){currentRoadWanderer=null;completeRoadTurn();} else if(c.source==="townWanderer"){stage="mercy"; showCurrentContext();} else {completeRoadTurn();} return; }
  if(c.r18Bare&&(cmd==="u"||cmd==="i"||cmd.includes("use item")||cmd.startsWith("use "))){add("No items or healing during a bare-knuckle match.","system");renderCombatMenu();return;}
  if(cmd==="u"||cmd==="i"||cmd.includes("use item")){ showCombatItems(); return; }
  if(cmd.startsWith("use ")){ if(useItem(cmd.slice(4)))combatRetaliation(c);else add("(A) ATTACK   (U) USE ITEM   (B) BACK OFF","system"); return; }
  if(c.r18PowderGrenadePending&&['dodge grenade','take cover'].includes(cmd)){c.r18PowderReaction=cmd;add(cmd==='take cover'?'You duck behind cover.':'You move away from the grenade.','bright');return combatRetaliation(c);}
  if(cmd==='ring valves'&&c.r18ChoirValveAvailable){c.r18ChoirValveAvailable=false;for(const enemy of c.enemies||[])if(enemy.hp>0)enemy.r18Snared=1;add('The clanging valves distract the raiders for this exchange.','bright');return combatRetaliation(c);}
  if(cmd==='trigger snare'&&c.r18BoneSnareAvailable){const target=c.enemies?.find(e=>e.hp>0);if(!target){renderCombatMenu();return;}c.r18BoneSnareAvailable=false;if(Math.random()<.65){target.r18Snared=1;add(`The snare catches ${target.name}, stopping their next attack.`,"bright");}else add("The snare misses and the hunters close in.","danger");combatRetaliation(c);return;}
  if(cmd==="a"||cmd==="f") cmd="attack"; if(!cmd.includes("attack")&&!cmd.includes("fight")&&!cmd.includes("hit")){add("(A) ATTACK   (U) USE ITEM   (B) BACK OFF","system");return;}
  let chosenTarget=null;
  if(c.enemies?.length){
    const match=cmd.match(/^(?:attack|fight|hit)\s+(\d+)(?:\s|$)/);
    if(match){chosenTarget=c.enemies[Number(match[1])-1];if(!chosenTarget||chosenTarget.hp<=0){add("That opponent is unavailable. Choose a living target.","system");renderCombatMenu();return;}}
  }
  const activeTarget=chosenTarget||c.enemies?.find(e=>e.hp>0);
  if(c.r18GardenChickens&&activeTarget?.name==='HEN'&&Math.random()<.15){add('The hen ducks your attack.','bright');return combatRetaliation(c);}
  if(c.r18ChickenDust){delete c.r18ChickenDust;if(Math.random()<.20){add('Dust kicked up by the Scrapper spoils your attack.','danger');return combatRetaliation(c);}}
  if(c.r18PowderSmokePending){delete c.r18PowderSmokePending;if(Math.random()<.2){add('Smoke obscures your target and your attack misses.','danger');return combatRetaliation(c);}add('You find your target through the smoke.','bright');}
  if(['drifter','scrapper','poolScrapper'].includes(c.r18ArenaRole)&&Math.random()<(c.r18ArenaRole==='drifter'?.15:.10)){add(c.name+' slips aside from your strike.','bright');return combatRetaliation(c);}
  if(c.r18ScrapStagger){c.r18ScrapStagger=false;add("You recover your footing instead of attacking.","danger");return combatRetaliation(c);}
  if(c.r18ArenaRole==='gravekeeper'){c.r18GraveCounter=r18EquippedRanged()?'ranged':'melee';add(c.r18GraveCounter==='ranged'?'The Gravekeeper angles a shield against your shot.':'The Gravekeeper steps inside your reach to counter.','system');}
  const baseAttackDamage=rollDamage()+(c.r18CraneBirds&&r18EquippedRanged()?2:0);if(c.r18CraneBirds&&r18EquippedRanged())add('Your ranged weapon reaches the circling birds.','bright');
  const criticalChance=!c.r18Bare&&player.accessory==="Niko's Collar"?(GEAR["Niko's Collar"]?.critBonus||0):0;
  const critical=criticalChance>0 && Math.random()<criticalChance;
  const bleedChance=!c.r18Bare&&player.weapon==="Iron Reaper"?(GEAR["Iron Reaper"]?.bleedChance||0):0;
  const bleedProc=bleedChance>0 && Math.random()<bleedChance;
  const dealt=Math.max(1,Math.floor(baseAttackDamage*(critical?1.5:1))+(bleedProc?3:0)-(c.armorDef||0)-(c.r18GraveCounter==='ranged'?2:0));
  if(critical)add("NIKO'S COLLAR FLARES — CRITICAL HIT!","legendary");
  if(bleedProc)add("IRON REAPER BLEED — the hooked edge opens a wound (+3 damage).","rare");
  let actualDamage=dealt;
  if(c.enemies?.length){
    const target=chosenTarget||c.enemies.find(e=>e.hp>0);
    if(target){
      const targetDamage=c.r18SiloBoars&&target.name==='SILO KING'?Math.max(1,dealt-2):dealt;
      actualDamage=Math.min(c.source==='r18StationFight'?r18StationCoverDamage(c,target,targetDamage):targetDamage,target.hp);
      target.hp-=actualDamage;
      add(`TARGET — ${target.name}: ${target.hp}${target.maxHp!=null?'/'+target.maxHp:''} HP remaining.`,"bright");
      if(target.hp===0){target.defeated=true;if(c.r18RoadEater){const effects={'CUTTING WHEEL':'The cutting wheel stalls. Its strikes lose their cutting edge.','HYDRAULICS':'The hydraulics collapse. The machine can no longer strike at full force.','CONTROL UNIT':'The guidance controls fail. The machine now misses every other attack.'};if(effects[target.name])add(effects[target.name],'bright');}if(target.r18WallGunner){const gun=c.enemies.find(e=>e.r18WallGun&&e.hp>0);if(gun){gun.hp=0;gun.defeated=true;add("The unmanned machine gun falls silent.","bright");}}if(target.r18WallGun)add("The mounted gun is disabled; the gunner draws a sidearm.","bright");else if(target.bolts>0)add(`${target.name} drops ${target.bolts} Bolts.`,"reward");}
    }else actualDamage=0;
    c.hp=c.enemies.reduce((total,e)=>total+Math.max(0,e.hp),0);
  }else {actualDamage=Math.min(dealt,c.hp);c.hp=Math.max(0,c.hp-dealt);add(`${c.name}: ${c.hp}/${c.maxHp} HP remaining.`,"bright");}
  if(c.r18ArenaRole==='gravekeeper'&&c.hp<=0&&!c.r18LastStand){c.r18LastStand=true;c.hp=Math.max(1,Math.ceil(c.maxHp*.2));add('The Gravekeeper makes a last stand and rises again.','danger');}
  add(c.r18Bare?'You land a bare-knuckle punch.':`You swing the ${player.weapon.toLowerCase()} and connect.`);
  add("RESULT","system"); add(`YOU DEAL ${actualDamage}   ${c.enemies?.length?"GROUP TOTAL — ":""}${c.name} HP ${c.hp}/${c.maxHp}`,"reward");
  if(c.hp<=0){ if(c.regionalCombatLoot)RoadScenarioRegistry.regionalCombatAward(c.regionalCombatLoot); if(c.wo2Reward)RoadScenarioRegistry.wo2Award(c.wo2Reward); if(c.wo3Reward)RoadScenarioRegistry.wo3Award(c.wo3Reward); if(c.wo4Reward)RoadScenarioRegistry.wo4Award(c.wo4Reward); if(c.r18BoneHunters&&c.r18BoneKnowledge)r18RetainRoadReward("Rope","material"); if(c.r18PowderBlueprint&&typeof r18PowderAward==='function')r18PowderAward(!c.r18PowderSatchelShot); if(c.r18TunnelBoar){r18RetainRoadReward("Raw Boar Meat","material");r18RetainRoadReward("Large Animal Bones","material");gainXp(Math.ceil(((Number(c.r18TunnelRatXp)||0)+(Number(c.xp)||0))*.5));} if(c.r18Harlan)player.flags.r18HarlanDefeated=true; if(c.r18OilDeke)player.flags.r18OilDekeDefeated=true; if(c.r18SilasFight)player.flags.r18SilasOutcome="defeated"; if(c.r18BlackSnow&&typeof r18BlackSnowCoins==="function")r18BlackSnowCoins(2); if(c.r18RoadEater&&typeof r18RoadEaterSalvage==="function")r18RoadEaterSalvage(); if(c.r18SaltGuards&&typeof r18FreeSaltWorkers==="function")r18FreeSaltWorkers(false); if(c.r18WaxCurator&&typeof r18WaxAward==="function")r18WaxAward(); if(c.r18GnomeCollector)player.flags.r18GnomeDefeated=true; if(c.r18WardenId){(player.flags.r18WardensDefeated||(player.flags.r18WardensDefeated={}))[c.r18WardenId]=true;} if(c.r18ChoirRaiders&&typeof r18ChoirSalvage==="function")r18ChoirSalvage(); if(c.r18HarvestMachine&&typeof r18HarvestSalvage==="function")r18HarvestSalvage(); if(c.r18GardenChickens){r18RetainRoadReward("Raw Chicken Meat","material");r18RetainRoadReward("Small Animal Bones","material");} if(c.r18SiloBoars){r18RetainRoadReward("Raw Boar Meat","material");r18RetainRoadReward("Large Animal Bones","material");} if(c.r18SchoolDeer){r18RetainRoadReward("Raw Venison","material");r18RetainRoadReward("Animal Bones","material");} if(c.r18CraneBirds){r18RetainRoadReward("Raw Bird Meat","material");r18RetainRoadReward("Small Animal Bones","material");} if(c.r18Pickens)player.flags.r18PickensResolved=true; if(c.r18Cellar)player.flags.r18CellarResolved=true; if(c.r18Drone)player.flags.r18DroneDisabled=true; if(c.r18Wheelbarrow){r18RetainRoadReward("Scrap Metal","material");r18RetainRoadReward("Raw Snake Meat","material");r18RetainRoadReward("Small Animal Bones","material");} add(c.end||`${c.name} is finished.`); resultBuffer=[]; if(c.r18WolfPack||c.r18RatPack){for(const name of (c.r18WolfPack?["Raw Wolf Meat","Animal Bones"]:["Raw Rat Meat","Small Animal Bones"])){if(!addPack(name,"material")){(player.flags.r5LootQueue||(player.flags.r5LootQueue=[])).push({name,type:"material",qty:1});add(name+" is held until you make room.","system");}}} if(c.r18ScrapClaim&&!player.flags.r18ScrapWreckLooted){if(!addPack("Scrap Metal","material")){(player.flags.r5LootQueue||(player.flags.r5LootQueue=[])).push({name:"Scrap Metal",type:"material",qty:1});add("The wreck salvage is held until you make room.","system");}player.flags.r18ScrapWreckLooted=true;} if(c.r18WreckersMedical){const med=r18WreckersMedical();addPack(med,"consumable");if(Math.random()<.35)addPack("Cloth","material");} if(c.xp) gainXp(isDark()?Math.ceil(c.xp*1.1):c.xp); const victoryBolts=c.enemies?.length?c.enemies.filter(e=>e.defeated||e.hp===0).reduce((sum,e)=>sum+Math.max(0,Number(e.bolts)||0),0):c.bolts; if(victoryBolts) gainBolts(isDark()?Math.ceil(victoryBolts*1.1):victoryBolts); flushResults(); const source=c.source; combatState=null; if(source==="encounter"&&!c.wo2NoEquipment&&!c.r18WolfPack&&!c.r18RatPack&&!c.r18CraneBirds&&!c.r18SchoolDeer&&!c.r18SiloBoars&&!c.r18GardenChickens&&!c.r18HarvestMachine&&!c.r18RoadEater&&!c.r18TunnelRat&&!c.r18Wheelbarrow&&typeof v555AwardEquipmentDrop==="function")v555AwardEquipmentDrop(!!(c.r18DogPack||c.r18GuaranteeGear)); if(source==="wo4HospitalEntrance"){RoadScenarioRegistry.wo4HospitalMenu();} else if(source==="r11Elephant"){r11SteveVictory();} else if(source==="seaportLiberation"){portLiberationVictory();} else if(source==="seaportRoadFight"){portCombatWin(c);} else if(source==="factoryFight"){factoryCombatWin(c);} else if(source==="r18DepotFight"){r18DepotCombatWin();} else if(source==="r18StationFight"){r18StationCombatWin();} else if(source==="r18TournamentFight"){r18TournamentVictory(c);} else if(source==="r18AshFight"){r18AshVictory();} else if(source==="r18RedFight"){r18RedVictory();} else if(source==="jenBoss"){player.flags.jenQuest="rescued";addPack("Runner's Token","quest");add("QUEST UPDATED — LAST CALL: You rescue Jen's runner and recover their token. Return to Jen.","reward");completeRoadTurn();} else if(source==="terribleBilly"){player.flags.terribleBillyBounty="proof";add("BOUNTY PROOF ACQUIRED — TERRIBLE BILLY IS DOWN. Return to Tim in Solace.","reward");completeRoadTurn();} else if(source==="houseBoss"){player.flags.houseQuest="cleared";if(player.flags.timHouseBounty==="active")player.flags.timHouseBounty="proof";stage="house";add("The occupant abandons the house. Beneath his blanket, one floorboard sits loose.");if(player.flags.timHouseBounty==="proof")add("BOUNTY PROOF ACQUIRED — Return to Tim in Solace.","reward");add("QUEST UPDATED — Lift the floorboard to claim the house.","reward");showHouseChoices();} else if(source==="serviceBoss"){player.flags.serviceBossDead=true;player.flags.serviceReward=true;const oldWeapon=player.weapon,oldStolen=!!player.flags.r18EquippedStolen?.weapon;if(player.flags.r18EquippedStolen)player.flags.r18EquippedStolen.weapon=false; player.weapon="Yardman\'s Wrench"; if(!addPack(oldWeapon,"weapon",1,true,oldStolen)){(player.stash||(player.stash=[])).push({name:oldWeapon,type:"weapon",qty:1,...(oldStolen?{stolen:true}:{})});add("Previous weapon secured in bank storage; pack full.","system");} updateHud();add("UNCOMMON — YARDMAN\'S WRENCH — DMG 11–18","uncommon");add(`Equipped. ${oldWeapon} moved to your backpack.`,"reward");add("Scrap Yard is quiet now. Beyond it, the road disappears beneath collapsed trees and concrete.");stage="serviceRoad";serviceRoadDepth=3;add(serviceRoadChoices(),"system");} else if(source==="roadWanderer"){v50WandererLoot(c.name);markWandererDead(c.name); currentRoadWanderer=null; completeRoadTurn();} else if(source==="townWanderer"){v50WandererLoot(c.name);markWandererDead(c.name); currentTownWanderer=null; stage="mercy";showCurrentContext();} else if(c.r18TunnelRat&&Math.random()<.5){player.flags.r18TunnelBoarPending=true;player.flags.r18TunnelRatXp=Number(c.xp)||0;delete player.encounterDone[roadTurn];stage="encounter";add("A feral boar bursts from the tunnel. Fight or back away.","danger");renderCurrentChoices();} else if(source==="gateGuards"){player.flags.solaceGateChallenge=false;player.flags.mercyDiscovered=true;player.flags.mainSolaceQuest="done";stage="mercy";mercyLocation="town";add("You force the gate guard to stand down. The gate opens, and Tim steps forward to meet you.","bright");if(!player.flags.solaceCheckpointSaved){player.flags.solaceCheckpointSaved=true;saveGame(activeSaveSlot);add("CHECKPOINT REACHED — SOLACE AUTOSAVED","reward");}mercyMenu();} else { completeRoadTurn(); } return; }
  // The lookout has three player attacks to blow his whistle. Defeating him
  // before that point prevents reinforcements; once signaled, the gang joins.
  if(c.name==="GANG LOOKOUT" && !c.reinforcementsArrived){
    c.signalRounds=(Number(c.signalRounds)||0)+1;
    if(c.signalRounds>=3 && c.enemies?.some(e=>e.name==="LOOKOUT" && e.hp>0)){
      c.reinforcementsArrived=true;
      c.enemies=[{name:"GANG MEMBER A",hp:24,maxHp:24,bolts:4},{name:"GANG MEMBER B",hp:24,maxHp:24,bolts:4}];
      c.maxHp=48;
      c.hp=48;
      add("The lookout sounds his whistle and flees. Two gang members surround you; escape is cut off.","danger");
    }
  }
  if(c.r18WardenId&&!c.r18WardenAdapted){c.r18WardenHits=(Number(c.r18WardenHits)||0)+1;if(c.r18WardenHits>=3){c.r18WardenAdapted=true;c.armorDef=(Number(c.armorDef)||0)+1;add('The Warden adjusts their stance and reinforces their defense.','danger');}}
  if(typeof petCombatRound==="function")petCombatRound(c);
  return combatRetaliation(c);
}
// Scaling is tied to the opponent's level, keeping weak enemies weak.
function scaledEnemyDamage(raw,defense,level){
 const l=Math.max(1,Math.min(50,Math.floor(Number(level)||1)));
 const oldMax=100+(l-1)*10, factor=baseHpForLevel(l)/oldMax;
 return Math.max(1,Math.round(Math.max(0,raw-defense)*factor));
}
function combatRetaliation(c){
  if(c.r18Enforcer&&!c.r18EnforcerStim&&c.hp>0&&c.hp<=c.maxHp*.4){c.r18EnforcerStim=true;const heal=Math.max(1,Math.ceil(c.maxHp*.2));c.hp=Math.min(c.maxHp,c.hp+heal);add(`${c.name} uses a stimulant and recovers ${heal} HP.`,"danger");}
  if(c.r18ScrapTrap&&!c.r18ScrapTrapChecked){c.r18ScrapTrapChecked=true;if(Math.random()<.4){roadHurt(3);add("The claimant's tripwire catches your boot and leaves you off balance.","danger");if(stage==="fallen")return;c.r18ScrapStagger=true;}}
  // Each surviving opponent can retaliate; defeated enemies do not strike.
  const attackers=(c.r18RoadEater||c.r18HarvestMachine)?[null]:c.enemies?.length?c.enemies.filter(e=>e.hp>0&&!e.r18WallGun):[null];
  let totalDamage=0;
  for(const attacker of attackers){
    if(attacker?.r18Snared>0){attacker.r18Snared--;add(`${attacker.name} struggles against the snare instead of attacking.`,"bright");continue;}
    // Yardman's slow wrench has a telegraphed heavy swing and a real miss chance.
    // Keep this local to the Service Road boss; Factory and Seaport combat are unchanged.
    if(c.source==="serviceBoss" && Math.random()<0.15){
      add("The Yardman swings wide. The wrench strikes concrete instead of you.","bright");
      continue;
    }
    const heavySwing=c.source==="serviceBoss" && Math.random()<0.20;
    const low=Number.isFinite(attacker?.r18Min)?attacker.r18Min:c.min,high=Number.isFinite(attacker?.r18Max)?attacker.r18Max:c.max;
    let raw=heavySwing?13+Math.floor(Math.random()*4):Math.floor(Math.random()*(high-low+1))+low;
    if(c.wo4Sniper){if(c.wo4Suppressed){c.wo4Suppressed=false;add('Your fire disrupts the sniper’s shot.','bright');continue;}if(c.wo4Closed)raw=Math.max(1,Math.floor(raw*.55));else if(c.wo4SniperCover)raw=Math.max(1,Math.floor(raw*.5));else raw=Math.ceil(raw*1.15);}
    if(c.wo3Drone){c.wo3DroneTurns=(Number(c.wo3DroneTurns)||0)+1;if(c.wo3LightShot){if(c.wo3DroneTurns%2===0){add('The blinded drone sweeps wide and misses.','bright');continue;}raw=Math.max(1,Math.floor(raw*.75));}if(c.wo3Cover){raw=Math.max(1,Math.floor(raw*.5));c.wo3Cover=false;add('The container shields you from part of the volley.','bright');}}
    if(c.r18WardenId&&!c.r18WardenBatonUsed&&Math.random()<.15){c.r18WardenBatonUsed=true;c.r18ScrapStagger=true;add('The Warden lands a stun-baton strike. You will lose your next attack recovering.','danger');}
    if(c.r18ArenaRole==='gravekeeper'&&c.hp<=c.maxHp*.5)raw+=1;
    if(c.r18ArenaRole==='gravekeeper'&&c.r18GraveCounter==='melee')raw+=1;
    if(['hammer','deepChampion'].includes(c.r18ArenaRole)){c.r18ArenaRounds=(Number(c.r18ArenaRounds)||0)+1;if(c.r18ArenaRounds%3===0){raw+=2;add(c.name+' follows through with the telegraphed heavy strike.','danger');}else if(c.r18ArenaRounds%3===2)add(c.name+' sets up a heavy strike for the next exchange.','system');}
    if(c.r18GardenChickens&&attacker?.name==='SCRAPPER'&&!attacker.r18DustUsed&&Math.random()<.15){attacker.r18DustUsed=true;c.r18ChickenDust=true;add('The Scrapper kicks dirt into the air. Your next attack may miss.','danger');}
    if(c.r18DogPack&&attacker?.name!=='PACK LEADER'&&c.enemies?.some(e=>e.name==='PACK LEADER'&&e.hp>0))raw+=1;
    if(c.r18RoachVariant===2){c.r18RoachRounds=(Number(c.r18RoachRounds)||0)+1;if(c.r18RoachRounds%2===0){raw+=1;add('The aggressive swarm surges together.','danger');}}

    let rolePierce=0;
    if(c.name==='CINDER WOLF PACK'){
      // Preserve the role labels required by the final completion work order.
      if(attacker?.name==='SCAVENGER WOLF'&&c.enemies?.some(e=>e.name==='ALPHA WOLF'&&e.hp>0)){rolePierce=1;add('The scavenger wolf circles while the alpha holds your attention.','danger');}
      if(attacker?.name==='GNAWER WOLF'){attacker.r18HuntRounds=(Number(attacker.r18HuntRounds)||0)+1;if(attacker.r18HuntRounds%2===0){raw+=2;add('The gnawer wolf springs from the side of the pack.','danger');}else add('The gnawer wolf crouches for its next lunge.','system');}
    }
    if(c.r18ChainGang){
      if(attacker?.name==='CHAIN SWINGER'&&!attacker.r18Disrupted&&Math.random()<.15){attacker.r18Disrupted=true;c.r18ScrapStagger=true;add('The swinging chain knocks your weapon aside. Recover before your next strike.','danger');}
      if(attacker?.name==='STRANGLER'&&c.enemies?.some(e=>e.name==='CHAIN SWINGER'&&e.hp>0)){raw+=1;add('The Strangler closes behind the swinging chain.','danger');}
    }
    if(c.r18SiloBoars&&attacker?.name==='RAZORBACK'&&Math.random()<.20){raw=Math.ceil(raw*1.5);add('Razorback lunges through your guard — critical strike.','danger');}
    if(c.r18RatPack&&attacker){
      if(attacker.name==='ALPHA RAT'&&!attacker.r18BleedUsed&&Math.random()<.25){attacker.r18BleedUsed=true;c.r18RatBleed=2;add('The alpha rat opens a bleeding bite.','danger');}
      if(attacker.name==='GNAWER RAT'&&!attacker.r18GnawUsed&&Math.random()<.25){attacker.r18GnawUsed=true;c.r18RatGuardBreak=3;add('The gnawer catches your guard. Defense is reduced by 2 briefly.','danger');}
      if(attacker.name==='SCAVENGER RAT'&&!attacker.r18FoodAttempted&&Math.random()<.25){
        attacker.r18FoodAttempted=true;
        const food=(player.pack||[]).find(i=>i.qty>0&&i.type==='consumable'&&!i.protected&&!i.questOnly&&!i.unique&&!i.equipped&&!Object.values({weapon:player.weapon,armor:player.armor,accessory:player.accessory}).includes(i.name)&&['Energy Bars','Canned Meat','Fresh Apple','Fresh Pear','Fresh Berries','Fresh Carrot','Fresh Potato','Fresh Tomato','Fresh Cabbage'].includes(i.name));
        if(food){food.qty--;if(food.qty<=0)player.pack=player.pack.filter(i=>i!==food);add('The scavenger rat steals 1 '+food.name+'.','danger');}
        else add('The scavenger rat finds no exposed ordinary food.','bright');
      }
    }
    if(c.r18SiloBoars&&attacker?.name==='SILO KING'&&attacker.maxHp>0&&attacker.hp<=attacker.maxHp*.4){if(!attacker.r18Enraged){attacker.r18Enraged=true;add('The wounded Silo King roars and charges harder.','danger');}raw+=1;}
    if(c.r18SiloBoars&&attacker?.name==='YOUNG BOAR'&&c.enemies?.some(e=>e.name==='SILO KING'&&e.hp<=0)){if(!attacker.r18Enraged){attacker.r18Enraged=true;add('The young boar lashes out after the Silo King falls.','danger');}raw+=1;}
    if(c.r18RoadEater&&Array.isArray(c.enemies)){
      const part=name=>c.enemies.find(e=>e.name===name),wheel=part('CUTTING WHEEL'),hydraulics=part('HYDRAULICS'),control=part('CONTROL UNIT');
      c.r18RoadEaterRounds=(Number(c.r18RoadEaterRounds)||0)+1;
      if(control&&control.hp<=0&&c.r18RoadEaterRounds%2===0){add('The damaged guidance unit sends the machine wide.','bright');continue;}
      if(wheel&&wheel.hp<=0)raw=Math.max(1,raw-3);
      if(hydraulics&&hydraulics.hp<=0)raw=Math.max(1,Math.ceil(raw*.75));
    }
    if(c.r18PowderBlueprint&&!c.r18PowderSatchelShot){if(c.r18PowderGrenadePending){const reaction=c.r18PowderReaction,misfire=Math.random()<.15,protectedHit=reaction&&Math.random()<(reaction==='take cover'?.85:.65);delete c.r18PowderReaction;c.r18PowderGrenadePending=false;c.r18PowderCooldown=1;if(misfire){add('The grenade sputters and fails to explode.','bright');continue;}raw=protectedHit?2:10;if(!protectedHit)c.r18PowderBleed=2;if(Math.random()<.25){c.r18PowderSmokePending=true;add('Smoke hangs in the air and may spoil your next attack.','danger');}add(protectedHit?'The blast catches only the edge of your cover.':'The grenade explodes; shrapnel cuts you.','danger');}else if(c.r18PowderCooldown>0){c.r18PowderCooldown--;if(!c.r18PowderCooldown)c.r18PowderGrenadePending=true;}else c.r18PowderGrenadePending=true;}
    if(c.r18HarvestMachine&&Array.isArray(c.enemies)){const part=name=>c.enemies.find(e=>e.name===name),blade=part('HARVEST BLADE'),drive=part('DRIVE ASSEMBLY'),exhaust=part('EXHAUST SYSTEM');c.r18HarvestRounds=(Number(c.r18HarvestRounds)||0)+1;if(drive&&drive.hp<=0&&c.r18HarvestRounds%2===0){add('The damaged drive assembly stalls the combine’s advance.','bright');continue;}if(blade&&blade.hp<=0)raw=Math.max(1,raw-3);if(exhaust&&exhaust.hp>0&&c.r18HarvestRounds%3===0){raw+=2;add('The exhaust bursts toward you.','danger');}}
    if(attacker?.r18WallGunner&&c.enemies.some(e=>e.r18WallGun&&e.hp>0)){raw+=3;add("The gunner fires the mounted gun.","danger");}
    if(heavySwing)add("The Yardman winds up a brutal overhead swing!","danger");
    if(c.r18LevelPressure)raw+=Math.floor((Math.max(1,Math.min(50,Number(c.level)||1))-1)*.35);
    const nightRaw=isDark()?Math.ceil(raw*1.25):raw;
    const dmg=scaledEnemyDamage(nightRaw,Math.max(0,armorDefense()+(!c.r18Bare&&player.flags?.equippedPet==="Rust Hound"?1:0)-(c.r18RatPack&&c.r18RatGuardBreak>0?2:0)-rolePierce),c.level);
    const inflicted=Math.min(dmg,Math.max(0,player.hp));
    player.hp=Math.max(0,player.hp-inflicted);totalDamage+=inflicted;
    if(attacker)add(`${attacker.name} attacks for ${inflicted} damage.`,"danger");
    if(player.hp===0)break;
  }
  if(c.r18RatPack&&c.r18RatBleed>0&&player.hp>0){c.r18RatBleed--;const bleed=Math.min(player.hp,scaledEnemyDamage(1,0,c.level));player.hp-=bleed;totalDamage+=bleed;add('The rat bite bleeds for '+bleed+' HP.','danger');}
  if(c.r18RatGuardBreak>0){c.r18RatGuardBreak--;if(!c.r18RatGuardBreak)add('Your guard recovers.','bright');}
  if(c.r18PowderBleed>0&&player.hp>0){c.r18PowderBleed--;const bleed=Math.min(player.hp,scaledEnemyDamage(1,0,c.level));player.hp-=bleed;totalDamage+=bleed;add('Shrapnel wounds cost '+bleed+' HP.','danger');}
  if(c.r18PowderGrenadePending)add('The bomber readies another grenade.','danger');
  updateHud();
  const reactions=["They come back at you before you can reset your footing.","The next exchange is fast and ugly.","They hesitate, then commit to another attack."];
  if(!c.enemies?.length)add(reactions[Math.floor(Math.random()*reactions.length)]);
  add("RESULT","system"); add(`YOU TAKE ${totalDamage}   YOUR HP ${player.hp}/${player.maxHp}`,"danger");
  if(player.hp<=0){if(c.source==='r18TournamentFight'){r18TournamentDefeat(c);return;}handlePlayerDeath();return;}
  if(c.source==='r18StationFight'&&r18StationGeneratorTurn(c))return;
  renderCombatMenu();
}
// v35: shuffle without random-sort bias; both directions share early-road history.
function shuffled(ids){
  const out=[...ids];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;
}
let roadEncounterOrder=shuffled([...Array(encounters.length).keys()]).slice(0,9);
function encounterPool(){return roadGoal==="east"?eastEncounters:encounters;}
function encounterHistoryKey(index){return `${roadGoal==="east"?"east":"early"}:${index}`;}
function rememberEncounter(index){
  const key=encounterHistoryKey(index);
  player.recentEncounters=[...(player.recentEncounters||[]).filter(k=>k!==key),key].slice(-24);
}
function rerollRoad(count=9){
  const pool=encounterPool();
  // Old saves used direction-specific keys; preserve their history when migrating.
  player.recentEncounters=(player.recentEncounters||[]).map(k=>String(k).replace(/^(mercy|house):/,"early:"));
  const eligible=[...Array(pool.length).keys()].filter(i=>(pool[i].minLevel==null || player.level>=pool[i].minLevel) && (pool[i].maxLevel==null || player.level<=pool[i].maxLevel));
  const fresh=eligible.filter(i=>!player.recentEncounters.includes(encounterHistoryKey(i)));
  const recent=eligible.filter(i=>!fresh.includes(i));
  // When the pool is exhausted, recycle the least-recently seen events first.
  // Randomizing the recent group could immediately replay the last encounter.
  const history=player.recentEncounters||[];
  const oldestFirst=recent.sort((a,b)=>history.indexOf(encounterHistoryKey(a))-history.indexOf(encounterHistoryKey(b)));
  roadEncounterOrder=[...shuffled(fresh),...oldestFirst].slice(0,count);
  roadTurn=0;roadTurnCharged=false;player.encounterDone={};
}
function currentRoadEncounterIndex(){return Math.max(0,Math.min(roadTurn+(roadGoal==="east"&&player.flags.eastReturning?1:0),roadEncounterOrder.length-1));}
function currentEncounter(){ return encounterPool()[roadEncounterOrder[currentRoadEncounterIndex()]]; }

function encounterChoices(e){
  const base = e.prompt ? e.prompt() : e.choices;
  const done = player.encounterDone[roadTurn] || new Set();
  const parts = base.split(/\s{2,}/).filter(Boolean);
  const available = parts.filter(choice => !done.has(choice));
  // Turn Complete owns road progression; do not inject a duplicate MOVE ON action.
  return available.join("   ");
}
function choiceKey(cmd,e){
  const choices=(e.prompt?e.prompt():e.choices).split(/\s{2,}/).filter(Boolean);
  const exact=choices.find(c=>choiceCommand(c)===cmd.trim().toLowerCase());
  if(exact)return exact;
  for(const c of choices){
    const words=c.toLowerCase().replace(/[^a-z ]/g," ").split(/\s+/).filter(w=>w.length>2 && !["the","use","check"].includes(w));
    if(words.some(w=>cmd.includes(w))) return c;
  }
  return null;
}
function questRoadEvent(){
  if(roadGoal!=="house") return false;
  const f=player.flags;
  const active=[];
  if(f.timQuest==="active") active.push("tim");
  if(f.murphyQuest==="active") active.push("murphy");
  if(!active.length) return false;
  f.questEventCooldown=f.questEventCooldown||0; if(f.questEventCooldown>0){f.questEventCooldown--; active.forEach(q=>f[q+"QuestSteps"]=(f[q+"QuestSteps"]||0)+1); return false;}
  for(const q of active){
    const key=q+"QuestSteps"; f[key]=(f[key]||0)+1;
    if(f[key]<=1) continue; // always allow at least one ordinary road event after accepting
    const force=f[key]>=3, roll=Math.random()<0.45;
    if(!force && !roll) continue;
    add("");
    if(q==="tim"){
      add(`ROAD TURN ${dailyRoadTurns} — SOMETHING IN THE WEEDS`,"place");
      add("A dull flash catches your eye beside the cracked shoulder. Half buried under dead grass is an old metal badge, scratched nearly smooth.");
      add("You remember Tim saying he lost his old badge somewhere on this stretch of Route 127.","bright");
      addPack("Tim's Old Badge","quest"); f.timQuest="found";
      add("QUEST UPDATED — THE OLD BADGE: Found. Return it to Tim in Solace.","reward");
    } else {
      add(`ROAD TURN ${dailyRoadTurns} — WRECKED DELIVERY VAN`,"place");
      add("Near the service-road fork, an old delivery van rests nose-down in the ditch. The hood is already half open.");
      add("Inside the engine bay, one serpentine belt is cracked at the edges but still flexible.");
      addPack("Usable Serpentine Belt","quest"); f.murphyQuest="found";
      add("QUEST UPDATED — ONE GOOD BELT: Found. Return it to Murphy.","reward");
    }
    f.questEventCooldown=2; add("──────── TURN COMPLETE ────────","system"); add("(C) CONTINUE   (R) REVERSE DIRECTION","system"); stage="questRoadComplete"; return true;
  }
  return false;
}
function noTurnsMenu(){
  processRefill(); if(testMode){add("TEST MODE ACTIVE — expedition turn limit disabled.","reward");return;} if(player.turns>0){add("Not enough turns for that action.","danger");return;}
  add("NO EXPEDITION TURNS REMAIN.","danger");
  add(`NEXT TURN REFILL: ${refillText()}`,"bright");
  add("Expedition Turns replenish every 24 hours (+50, up to 150).","system");
  if(!player.flags.overnightLocked){add("Night is coming. Choose how you'll spend it.");add(overnightChoices(),"system");}else add(`OVERNIGHT STATE LOCKED — ${overnightLabel(player.flags.overnight)}`,"bright");
  add(`SAVE CURRENT   STATUS   INVENTORY   MAP${QA_BUILD?"   TESTING":""}`,"system");
  player.flags.turnResumeStage=["zeroTurns","overnightConfirm"].includes(stage)?(player.flags.turnResumeStage||"between"):stage;
  stage="zeroTurns";
}
function showEncounter() {
  if((roadGoal==="mercy" && roadTurn===4 || roadGoal==="house" && roadTurn===roadTripLength-4) && !roadTurnCharged){ player.flags.forkDiscovered=true; add("","system"); add("THE FORK — FREE (0 TURNS)","place"); add(`Route 127 continues ${roadGoal==="house"?"west toward the old house":"east toward Solace"}. An old service road climbs north through the trees beneath a bent county sign.`); add(`CONTINUE TO ${roadGoal==="house"?"OLD HOUSE":"SOLACE"}   CHECK SERVICE ROAD${player.flags.relayPartsRevealed?"   CHECK LOWER ACCESS ROAD":""}   (R) REVERSE DIRECTION`,"system"); stage="fork"; return; }
  if(!roadTurnCharged){ if(!testMode && player.turns<=0){noTurnsMenu();return;} spendTurn(); roadTurnCharged=true; }
  if(isDark()) add("WORSE AFTER DARK — enemies hit harder; road rewards improve.","danger");
  else if(timePhase()==="DUSK") add("LIGHT FADING.","system");
  const activeRoad=typeof r6Road==='function'?r6Road():null;
  if(typeof lanternState==='function'&&lanternState()?.pending)add(lanternProgressText(),'system');
  else if(activeRoad?.active)add(`ROAD PROGRESS — STEP ${activeRoad.dir>0?activeRoad.pos:activeRoad.n-activeRoad.pos} / ${activeRoad.n} heading ${activeRoad.dir>0?'EAST':'WEST'} toward ${activeRoad.leg==='coast'?(activeRoad.dir>0?'Seaport':'the Factory'):(activeRoad.dir>0?'the Factory':'Solace')}.`,'system');
  else add(`ROAD PROGRESS — STEP ${roadGoal==="east"&&player.flags.eastReturning?roadTripLength-roadTurn-1:Math.min(roadTurn+1,roadTripLength)} / ${roadTripLength} toward ${roadGoal==="mercy"?"Solace":roadGoal==="east"?(player.flags.eastReturning?"Solace":"the Factory"):"the old house"}.`,"system");
  if(!resumeSavedEncounter)showSteveAnnouncement();
  if(!resumeSavedEncounter && questRoadEvent()) return;
  if(typeof r10PrepareEncounter==='function'&&!r10PrepareEncounter())return;
  resumeSavedEncounter=false;
  currentRoadWanderer=null;
  const e = storyRefreshTravelerEncounter();
  if(e.title==="THE TRAVELER")storyRecordValeSighting();
  rememberEncounter(roadEncounterOrder[currentRoadEncounterIndex()]);
  if(activeRoad?.active&&activeRoad.leg==='coast'&&typeof r9CoastRemember==='function')r9CoastRemember(activeRoad.index);
  if(activeRoad?.active&&activeRoad.leg==='coast'&&typeof R8_COAST_COMBAT!=='undefined'&&R8_COAST_COMBAT.includes(activeRoad.index)){
    player.flags.r8CoastCombatHistory=[...(player.flags.r8CoastCombatHistory||[]).filter(t=>t!==e.title),e.title].slice(-5);
  }
  if(!player.encounterDone[roadTurn]) player.encounterDone[roadTurn]=new Set();
  const lvl=(e.combat&&e.combat.level) || encounterLevels[e.title] || (roadGoal==="east"? (e.title==="THE WARDEN"?Math.min(50,player.level+2):5+(roadTurn%6)):null);
  add(""); add(`ROAD TURN ${dailyRoadTurns} — ${e.displayName||e.title}${lvl?` — LVL ${String(lvl).padStart(2,"0")}`:""}`, "place");
  add(typeof e.description==="function"?e.description():e.text);if(typeof lanternState==="function" && lanternState()?.pending && e.title==="RIVER OF FIRE" && typeof r6FireArt==="function")r6FireArt();add("");const markerActions=renderRoadMarkerActions();add([encounterChoices(e),...markerActions].filter(Boolean).join("   "),"system");
  if(e.exclusive) add("What do you do?", "system");
  stage = "encounter";
}
// v39: Fixed branch landmarks are interactive, free to inspect, and one-time rewards.
// Movement alone consumes turns. Repeat visits never duplicate salvage.
function branchReturnCost(depth=serviceRoadDepth){return Math.max(1,Math.floor(Number(depth)||1));}
function serviceRoadChoices(){
  const d=serviceRoadDepth,parts=[];
  if(d<3)parts.push("(C) CONTINUE UP ROAD");
  if(d<3&&!player.flags[`v39_service_${d}_inspect`])parts.push(d===1?"(I) INSPECT TRUCK":"(I) INSPECT WRECKAGE");
  if(d<3&&!player.flags[`v39_service_${d}_search`])parts.push(d===1?"(S) SEARCH ROADSIDE":"(S) SEARCH DEBRIS");
  if(d===3 && !player.flags.serviceBossDead)parts.push("(C) CONTINUE UP ROAD");
  if(d===3 && player.flags.serviceBossDead && (player.flags.relayPartsRevealed&&!ensureRelayParts().yard || !player.flags.maintenanceYardSearched))parts.push("(E) SEARCH MAINTENANCE YARD");
  parts.push("(R) WALK BACK — 1 TURN");if(d>1)parts.push(`(F) FAST RETURN TO FORK — ${branchReturnCost(d)} TURN${branchReturnCost(d)===1?"":"S"}`);
  return parts.join("   ");
}
function branchLandmarkChoices(){
  const d=serviceRoadDepth,parts=[];
  if(d<3){parts.push("(C) CONTINUE DOWN ROAD");if(!player.flags[`v39_lower_${d}_inspect`])parts.push(d===1?"(I) INSPECT DRAINAGE WALL":"(I) INSPECT TRACKS");if(!player.flags[`v39_lower_${d}_search`])parts.push(d===1?"(S) SEARCH TOOL CRATE":"(S) SEARCH UTILITY VAN");}
  parts.push("(R) WALK BACK — 1 TURN");if(d>1)parts.push(`(F) FAST RETURN TO FORK — ${branchReturnCost(d)} TURN${branchReturnCost(d)===1?"":"S"}`);return parts.join("   ");
}
function branchLandmark(kind,cmd){
  if(serviceRoadDepth!==1&&serviceRoadDepth!==2)return false;
  const inspect=cmd==="i"||cmd.startsWith("inspect")||cmd.includes("tracks");
  const search=cmd==="s"||cmd.startsWith("search");
  if(!inspect&&!search)return false;
  const depth=serviceRoadDepth;
  const key=`v39_${kind}_${depth}_${inspect?"inspect":"search"}`;
  if(player.flags[key]){add("You've already investigated this spot. Nothing new remains.","system");add(kind==="service"?serviceRoadChoices():branchLandmarkChoices(),"system");return true;}
  player.flags[key]=true;
  if(kind==="service"){
    if(depth===1&&inspect){add("Scrape marks end beneath a battered county truck. Inside, a torn work order warns that someone has been taking heavy tools from the yard. A first-aid pouch survived in the glovebox.");addPack("Bandage","consumable");gainXp(6);}
    else if(depth===1){add("A rusted reflector marks a shallow roadside cache. You recover five Bolts without disturbing the fresh bootprints nearby.");gainBolts(5);gainXp(4);}
    else if(inspect){add("A snapped axle pins the wreckage against the culvert. You pull a useful length of wire free; deep wrench gouges mark the chassis.");addPack("Wire","material");gainXp(7);}
    else{add("The washout has exposed a buried toolbox. Seven Bolts survive in a sealed tin; something large has recently crossed the mud.");gainBolts(7);gainXp(5);}
  }else{
    if(depth===1&&inspect){add("The drainage wall is scored with fresh pry marks. A faded county stencil points to a utility enclosure farther downhill.");gainXp(6);}
    else if(depth===1){add("Under a broken tool crate lid you find a clean bandage. A second compartment has been emptied recently.");addPack("Bandage","consumable");gainXp(6);}
    else if(inspect){add("Bootprints lead toward the torn-open signal cabinet. Whoever stripped it left in a hurry, dragging something heavy uphill.");gainXp(7);}
    else{add("The utility van's rear doors are jammed. You lever one open and salvage wire and a handful of Bolts.");addPack("Wire","material");gainBolts(5);gainXp(7);}
  }
  add(kind==="service"?serviceRoadChoices():branchLandmarkChoices(),"system");return true;
}
function searchServiceRoad(cmd){return branchLandmark("service",cmd);}
function showFactory(entered=false){
  add("EASTERN ROAD — THE FACTORY","place");
  v48Intro('factory',[["The highway ends at a sprawling factory. Rusted smokestacks rise over broken windows and loading bays choked with weeds."],["The main entrance stands open. Light flickers inside a workshop beyond the doors.","bright"],["A wrecked utility truck beside the fence still has a sealed equipment rack."]],"The Factory entrance stands open. The equipment rack remains beside the fence.",entered);
  add(`(E) ENTER FACTORY — FREE (0 TURNS)${ensureRelayParts().east?"":"   (S) SEARCH EQUIPMENT RACK"}   (R) REVERSE DIRECTION`,"system");
}
function v49Autosave(){
  try{localStorage.setItem(FACTORY_AUTOSAVE_KEY,JSON.stringify({...saveSnapshot(),manualSlot:activeSaveSlot}));}
  catch(e){add("AUTOSAVE UNAVAILABLE — Use a manual slot.","system");}
}
function v49FactoryRoom(){
  stage="factoryWorkshop";
  add("THE FACTORY — FORGE'S WORKSHOP","place");
  if(!player.flags.v49FactoryMet){
    add("A workshop occupies the surviving ground-floor bay. A monitor snaps awake as you step inside.");
    add("FORGE > That terminal just booted up. Have a look, then come see me.","bright");
    add("An old Tomorrow Project terminal glows in the corner. An open passage leads deeper into the factory.");
    player.flags.v49FactoryMet=true;
  }else add("Forge is at his bench. The Tomorrow Project terminal hums in the corner. The passage to the central stairwell stands open.");
  add("(T) TOMORROW PROJECT TERMINAL   (F) TALK TO FORGE   (W) WORKBENCH   (D) ENTER INNER FACTORY — FREE (0 TURNS)   (E) EXIT FACTORY"+(typeof portReady==="function"&&player.flags.portChargePrepared?"   ROAD TO SEAPORT":""),"system");
}
// v49.1: tutorial materials are bench-bound, never added to sellable inventory.
const CRAFT_RECIPES={
  bandage:{name:'Reinforced Bandage',cloth:2,scrap:1,bolts:0,seconds:30,chance:.9,type:'consumable'},
  pipe:{name:'Rusted Pipe',cloth:0,scrap:2,wire:0,bolts:20,seconds:30,chance:.9,type:'weapon'},
  ironReaper:{name:'Iron Reaper',cloth:3,scrap:8,wire:4,bolts:75,seconds:30,chance:.9,type:'weapon',minLevel:6}
};
function v49Terminal(){
  stage='factoryTerminal';
  add('TOMORROW PROJECT // TERMINAL 03','place');
  add('SYSTEM ONLINE — LOCAL ARCHIVE / CONNECTION: PARTIAL','system');
  add("RELAY TRAFFIC DETECTED. Local records available; remote reports may be incomplete.",'bright');
  currentHotkeys={};numberedChoices={};queueChoiceLine('PROJECT RECORDS   FACTORY STATUS   PERSONNEL: FORGE   EXIT TERMINAL');
  player.flags.v49TerminalRead=true;
}
function v49TerminalRecord(which){
  if(which===1){
    add('ARCHIVE // TOMORROW PROJECT','place');
    add((player.flags.relayQuest==='complete'?'The Relay Station connection has been restored. ':'')+"This factory once supplied communications equipment for the Tomorrow Project, linking settlements along Route 127. Its local archive retained reports when the wider network failed.");
    add("Later production records are restricted. Shipping ledgers and supervisor notes inside the works may explain who kept the machinery running after the Project lost access.");
  }else if(which===2){
    add('FACILITY REPORT // FACTORY','place');
    add("LOCAL REPORT: Machinery still runs in the inner works. Workers repeat old routines; supervisors block access to the restricted basement.");
    add("ARCHIVED ASSESSMENT: The New Dominion demanded tribute along the coast. At the time of this report, its connection to Factory production was suspected, not verified.");
    add("EASTERN ROUTE: SEAPORT. A boulder beneath the collapsed overpass blocks ground access. The last harbor report is held in this terminal's transmission log.");
  }else{
    add('PERSONNEL // FORGE','place');
    add('FORMER ROLE: Tomorrow Project engineer. CURRENT LOCATION: workshop, ground floor.');
    add("NOTICE: Forge maintains the entrance workshop. Consult him about the local records, the inner works and the blocked road.",'bright');
  }
  currentHotkeys={};numberedChoices={};queueChoiceLine('PROJECT RECORDS   FACTORY STATUS   PERSONNEL: FORGE   EXIT TERMINAL');
}
function v49Forge(){
  stage='factoryForge';
  add('FORGE — WORKSHOP','place');
  if(!player.flags.v49TerminalRead){add("FORGE > Start with that terminal. It has the harbor report, not just the rumors. Then we can decide what needs doing.",'bright');}
  else add("FORGE > You have seen the report. I kept this workshop running, but I could not open the coast road alone. Now we have something to work with.",'bright');
  if(typeof portForgeDialogue==='function')portForgeDialogue();
  add(typeof factoryDone==='function'&&factoryDone()===4?"FORGE > The supervisors and Foreman are down. That gives us access to the supplies and equipment for the coast-road charge.":"FORGE > The supervisors hold the basement authorizations; the Foreman controls the equipment below. You will need to get past them. First, let me show you how to stay in one piece.",'bright');
  if(player.flags.v49RecipeBandage){
    add('FORGE > You know how to make reinforced dressings now. Murphy can help you make more with your own supplies.','system');
  }else if(!player.flags.v49Job && !player.flags.v49Kit){
    player.flags.v49Kit={cloth:2,scrap:1};
    v49Autosave();
    add('FORGE > Here is one practice kit: two Cloth and one Scrap Metal. It stays here on my bench. Insert it and try your hand.','reward');
  }else if(player.flags.v49Kit){add('FORGE > Your practice kit is waiting at the bench.','system');}
  add((player.flags.r5ChargeJob?'CHECK DYNAMITE   ':'')+'(W) USE WORKBENCH   (T) TERMINAL   (B) BACK','system');
}
function v49Workbench(){
  stage='factoryBench';
  add("FORGE'S WORKBENCH",'place');
  if(player.flags.v49RecipeBandage){add('TUTORIAL COMPLETE — RECIPE LEARNED: REINFORCED BANDAGE','reward');add('(F) TALK TO FORGE   (B) BACK','system');return;}
  const job=player.flags.v49Job;
  if(job){const remaining=Math.max(0,Math.ceil((job.endsAt-Date.now())/1000));
    add(`REINFORCED BANDAGE — ${remaining?`${remaining} SECONDS REMAINING`:'READY TO COLLECT'}`,'system');
    add(remaining?'(C) CHECK TIMER   (B) BACK':'(C) COLLECT RESULT   (B) BACK','system');return;}
  const kit=player.flags.v49Kit||{cloth:0,scrap:0};
  add('RECIPE: REINFORCED BANDAGE   TIME: 30 REAL SECONDS   SUCCESS: 90%','system');
  add(`WORKSHOP KIT: CLOTH ${kit.cloth}/2   SCRAP METAL ${kit.scrap}/1`,'system');
  add('(I) INSERT MATERIALS   (B) BACK','system');
}
function v49MurphyRecipes(){
  player.flags.v49MurphyMenu='recipes';
  add("MURPHY'S MOTOR WORKS — CRAFTING",'place');
  if(!player.flags.v49RecipeBandage){add('NO RECIPES LEARNED. Visit Forge at the Factory for your first lesson.','system');add('(B) BACK','system');return;}
  add('[1] REINFORCED BANDAGE — 2 Cloth, 1 Scrap Metal — 30 sec — 90%','system');
  add('[2] RUSTED PIPE — 2 Scrap Metal, 20 Bolts — 30 sec — 90%','system');
  if(player.level>=6)add('[3] IRON REAPER — 8 Scrap Metal, 4 Wire, 3 Cloth, 75 Bolts — 120 sec — 90% — LEVEL 6','system');
  add('(B) BACK','system');
}
function v49MurphyRecipe(key){
  if(player.flags.v49MurphyJob)key=player.flags.v49MurphyJob.key;
  const recipe=CRAFT_RECIPES[key];if(!recipe)return;
  player.flags.v49MurphyMenu='recipe';player.flags.v49MurphyRecipe=key;
  add(`MURPHY'S WORKBENCH — ${recipe.name.toUpperCase()}`,'place');
  const job=player.flags.v49MurphyJob;
  if(job){const left=Math.max(0,Math.ceil((job.endsAt-Date.now())/1000));
    add(left?`CRAFT IN PROGRESS — ${left} SECONDS REMAINING`:'CRAFT FINISHED — READY TO COLLECT','system');
    add(left?'(C) CHECK TIMER   (B) BACK':'(C) COLLECT RESULT   (B) BACK','system');return;}
  add(`MATERIALS: Cloth ${recipe.cloth}, Scrap Metal ${recipe.scrap}, Wire ${recipe.wire||0}, Bolts ${recipe.bolts}`,'system');
  add(`YOU HAVE: Cloth ${r6MaterialCount('Cloth')}, Scrap Metal ${r6MaterialCount('Scrap Metal')}, Wire ${r6MaterialCount('Wire')}, Bolts ${player.bolts}`,'system');
  add(`TIME: ${recipe.seconds} REAL SECONDS   SUCCESS: 90%`,'system');
  add('(I) INSERT MATERIALS AND START   (B) BACK','system');
}
function v49MurphyCommand(cmd){
  if(stage!=='mercy'||mercyLocation!=='murphy')return false;
  // Preserve existing save/load and QA commands while the recipe menu is open.
  if(/^(?:save|load)(?: game)?(?: ?[123])?$/.test(cmd)||cmd==='load autosave'||['testing','testing access','test off','disable test mode'].includes(cmd))return false;
  if(player.flags.v49MurphyMenu==='recipe'){
    if(['b','back'].includes(cmd)){player.flags.v49MurphyMenu='recipes';v49MurphyRecipes();return true;}
    const job=player.flags.v49MurphyJob,key=job?job.key:player.flags.v49MurphyRecipe,recipe=CRAFT_RECIPES[key];
    if(!recipe){add('UNKNOWN CRAFT RECIPE — RETURN TO RECIPES.','danger');return true;}
    if(['i','insert','insert materials','start'].includes(cmd)){
      if(job){v49MurphyRecipe(key);return true;}
      if(!player.flags.v49RecipeBandage){add('LEARN THE FIRST RECIPE FROM FORGE.','danger');return true;}
      if(recipe.minLevel&&player.level<recipe.minLevel){add(`RECIPE LOCKED — REACH LEVEL ${recipe.minLevel}.`,'danger');return true;}
      if((r6MaterialCount('Cloth'))<recipe.cloth||(r6MaterialCount('Scrap Metal'))<recipe.scrap||(r6MaterialCount('Wire'))<(recipe.wire||0)||player.bolts<recipe.bolts){add('NOT ENOUGH MATERIALS OR BOLTS.','danger');v49MurphyRecipe(key);return true;}
      if(recipe.cloth)r6ConsumeMaterial('Cloth',recipe.cloth);
      if(recipe.scrap)r6ConsumeMaterial('Scrap Metal',recipe.scrap);
      if(recipe.wire)r6ConsumeMaterial('Wire',recipe.wire);
      player.bolts-=recipe.bolts;updateHud();
      player.flags.v49MurphyJob={key,endsAt:Date.now()+recipe.seconds*1000,success:Math.random()<recipe.chance};
      v49Autosave();
      add('MURPHY > Materials in. Come back when the timer runs out.','bright');v49MurphyRecipe(key);return true;
    }
    if(['c','check','check timer','collect','collect result'].includes(cmd)){
      if(!job){v49MurphyRecipe(key);return true;}
      if(Date.now()<job.endsAt){v49MurphyRecipe(key);return true;}
      if(job.success){
        if(!addPack(recipe.name,recipe.type,1,true)){add('FINISHED ITEM HELD AT WORKBENCH — FREE A PACK SLOT.','danger');v49MurphyRecipe(key);return true;}
        add(`CRAFT SUCCESS — ${recipe.name.toUpperCase()}!`,'reward');
      }else add('CRAFT FAILED — MATERIALS LOST. MURPHY > Sometimes the metal wins.','system');
      delete player.flags.v49MurphyJob;v49Autosave();v49MurphyRecipe(key);return true;
    }
    v49MurphyRecipe(key);return true;
  }
  if(player.flags.v49MurphyMenu==='recipes'){
    if(['b','back'].includes(cmd)){player.flags.v49MurphyMenu='';npcTalk('murphy');return true;}
    if(player.flags.v49RecipeBandage&&['1','2','reinforced bandage','rusted pipe'].includes(cmd)){
      v49MurphyRecipe(['1','reinforced bandage'].includes(cmd)?'bandage':'pipe');return true;
    }
    if(player.flags.v49RecipeBandage&&player.level>=6&&['3','iron reaper'].includes(cmd)){v49MurphyRecipe('ironReaper');return true;}
    v49MurphyRecipes();return true;
  }
  if(['craft','crafting','recipes','workbench','use workbench','crafting recipes'].includes(cmd)){v49MurphyRecipes();return true;}
  // Workshop shortcuts do not unlock the future Corvette travel system.
  if(['inspect corvette','inspect corvette photo','corvette photo'].includes(cmd)){
    add('A faded photograph shows Murphy beside a bright blue Corvette, back when roads were roads.','system');
    add('MURPHY > One day, maybe. Not until she is roadworthy.','bright');
    return true;
  }
  if(['ask about corvette','ask about cars'].includes(cmd)){
    add('MURPHY > She needs parts, fuel, and a miracle. Fast travel is not available yet.','bright');return true;
  }
  return false;
}
function v49FactoryCommand(cmd){
  if(stage==='eastEnd' && ['e','enter','enter factory','factory'].includes(cmd)){v49FactoryRoom();v49Autosave();return true;}
  if(!['factoryWorkshop','factoryTerminal','factoryForge','factoryBench'].includes(stage))return false;
  if(/^(?:save|load)(?: game)?(?: ?[123])?$/.test(cmd)||cmd==='load autosave'||['testing','testing access','test off','disable test mode'].includes(cmd))return false;
  if(stage==='factoryWorkshop'){
    if(['t','terminal','inspect terminal','tomorrow project','tomorrow project terminal'].includes(cmd)){v49Terminal();return true;}
    if(['f','forge','talk','talk to forge'].includes(cmd)){v49Forge();return true;}
    if(['w','workbench','bench'].includes(cmd)){v49Workbench();return true;}
    if(['d','door','sealed door','inspect door','enter inner factory','inner factory','enter stairwell'].includes(cmd)){factoryEnter();return true;}
    if(['e','exit','exit factory','back','b'].includes(cmd)){stage='eastEnd';v49Autosave();showFactory();return true;}
  }
  if(stage==='factoryTerminal'){
    if(['1','2','3','project records','factory status','personnel: forge'].includes(cmd)){v49TerminalRecord(['project records','factory status','personnel: forge'].includes(cmd)?['project records','factory status','personnel: forge'].indexOf(cmd)+1:Number(cmd));return true;}
    if(['4','b','back','return','exit','exit terminal'].includes(cmd)){v49FactoryRoom();return true;}
    if(['f','forge','talk to forge'].includes(cmd)){v49Forge();return true;}
    v49Terminal();return true;
  }
  if(stage==='factoryForge'){
    if(['w','workbench','use workbench'].includes(cmd)){v49Workbench();return true;}
    if(['t','terminal'].includes(cmd)){v49Terminal();return true;}
    if(['b','back'].includes(cmd)){v49FactoryRoom();return true;}
  }
  if(stage==='factoryBench'){
    if(['b','back'].includes(cmd)){v49FactoryRoom();return true;}
    if(['f','forge','talk to forge'].includes(cmd)){v49Forge();return true;}
    if(['i','insert','insert materials'].includes(cmd)){
      if(player.flags.v49RecipeBandage){v49Workbench();return true;}
      if(player.flags.v49Job){v49Workbench();return true;}
      const kit=player.flags.v49Kit||{cloth:0,scrap:0};
      if(kit.cloth<2||kit.scrap<1){add('NO PRACTICE KIT AT THE BENCH. TALK TO FORGE.','danger');v49Workbench();return true;}
      // Atomically consume the entire workshop-only kit; no regular inventory ever receives it.
      delete player.flags.v49Kit;
      player.flags.v49Job={endsAt:Date.now()+30000,success:Math.random()<.9};
      v49Autosave();
      add('MATERIALS INSERTED — 30-SECOND REAL-TIME CRAFT STARTED. ZERO TURNS SPENT.','reward');v49Workbench();return true;
    }
    if(['c','check','check timer','collect','collect result'].includes(cmd)){
      const job=player.flags.v49Job;
      if(!job){v49Workbench();return true;}
      if(Date.now()<job.endsAt){v49Workbench();return true;}
      if(job.success){
        if(!addPack('Reinforced Bandage','consumable',1,true)){add('FINISHED BANDAGE HELD AT BENCH — FREE A PACK SLOT.','danger');v49Workbench();return true;}
        // Unlock and consume job only AFTER item has been safely delivered.
        player.flags.v49RecipeBandage=true;player.flags.v49CraftCompleted=true;
        add('CRAFT SUCCESS — REINFORCED BANDAGE (50% MAX HP).','reward');
        add('CRAFTING RECIPE LEARNED: REINFORCED BANDAGE','reward');
        add('FORGE > Nice work. Murphy can make more, but you will need to bring your own materials.','bright');
      }else{
        add('CRAFT FAILED. FORGE > Close, but no cigar. Try again.','bright');
        // Retry only on failure, bench-bound; no sellable or transferable material grant.
        player.flags.v49Kit={cloth:2,scrap:1};
      }
      delete player.flags.v49Job;v49Autosave();v49Workbench();return true;
    }
  }
  add('COMMAND NOT RECOGNIZED.','system');renderCurrentChoices();return true;
}
function updateNewQuestRoadProgress(){
 const f=player.flags;if(!f)return;
 // Events require exploration travel, never free town menu clicks.
 if(f.jenQuest==="active"&&roadGoal==="east"&&!f.eastReturning&&roadTurn>=2){f.jenQuest="cart";add("QUEST UPDATED — LAST CALL: You spot Jen's missing supply cart. Search it at the Factory road marker.","reward");}
 if(f.jenQuest==="hideout"&&roadGoal==="east"&&!f.eastReturning&&roadTurn>=4){f.jenQuest="raiders";add("QUEST UPDATED — LAST CALL: Raider tracks lead to an abandoned checkpoint. SEARCH RAIDER CHECKPOINT.","reward");}
 if(f.johnnyQuest==="active"&&roadGoal==="house"&&roadTurn>=3){f.johnnyQuest="ledger";add("QUEST UPDATED — A DEAL GONE BAD: A trader's lost ledger lies beside the western road.","reward");}
 if(f.amiiQuest==="active"&&roadGoal==="house"&&roadTurn>=4){f.amiiQuest="deposit";add("QUEST UPDATED — THE MISSING DEPOSIT: You find a locked bank satchel near the old highway.","reward");}
 if(f.waynePatientQuest==="active"&&roadGoal==="east"&&roadTurn>=3){f.waynePatientQuest="supplies";add("QUEST UPDATED — THE LAST PATIENT: An abandoned ambulance holds the needed medicine.","reward");}
}
function questRoadMarkers(){
 const f=player.flags,rows=[];
 if(roadGoal==="east"){if(f.jenQuest==="cart"&&roadTurn===2)rows.push(["JEN'S SUPPLY CART — beside the Factory road","SEARCH SUPPLY CART"]);if(f.jenQuest==="raiders"&&roadTurn===4)rows.push(["ABANDONED RAIDER CHECKPOINT — the runner's trail","SEARCH RAIDER CHECKPOINT"]);if(f.waynePatientQuest==="supplies"&&roadTurn===3)rows.push(["ABANDONED AMBULANCE","SEARCH AMBULANCE"]);}
 const westPos=roadGoal==="house"?roadTripLength-roadTurn-(roadTurnCharged?1:0):roadTurn+(roadTurnCharged?1:0);
 if(roadGoal!=="east"){if(f.johnnyQuest==="ledger"&&westPos===roadTripLength-4)rows.push(["LOST TRADER'S LEDGER","SEARCH LEDGER"]);if(f.amiiQuest==="deposit"&&westPos===roadTripLength-5)rows.push(["LOCKED BANK SATCHEL","SEARCH SATCHEL"]);}
 return rows;
}
function renderRoadMarkerActions(){const rows=questRoadMarkers();for(const [text]of rows)add(text,"place");return rows.map(x=>x[1]);}
function completeRoadTurn(){
 updateNewQuestRoadProgress();
  stage="turnComplete";
  add("──────── TURN COMPLETE ────────","system");
  const actions=renderRoadMarkerActions();numberedChoices={};currentHotkeys={};
  add(["(C) CONTINUE","(R) REVERSE DIRECTION",...actions].join("   "),"system");
}
function advanceRoad(){
  if(roadGoal==="east" && player.flags.eastReturning){
    if(roadTurn<0){stage="mercy";mercyLocation="town";player.flags.eastReturning=false;add("You return through Solace's east gate.","bright");mercyMenu();return;}
    if(!testMode&&player.turns<1){noTurnsMenu();return;}
    spendTurn();if(roadTurn===roadTripLength-1)player.flags.factoryAutosaveAtExterior=false;roadTurn--;roadTurnCharged=true;moveWanderers();
    delete player.encounterDone[roadTurn];showEncounter();return;
  }
  roadTurn++; roadTurnCharged=false; delete player.encounterDone[roadTurn];moveWanderers();
  if (roadTurn >= roadTripLength) {
    if(roadGoal === "mercy") arriveSettlement();
    else if(roadGoal === "east"){ stage="eastEnd"; showFactory(true);saveFactoryAutosave(); }
    else arriveHouse();
    return;
  }
  showEncounter();
}
function startRoadTrip(goal, length=5){
  if(!testMode && player.turns<=0){ noTurnsMenu(); return; }
  roadGoal=goal; player.flags.eastReturning=false; roadTripLength=length; roadTurn=0; roadTurnCharged=false; rerollRoad(length); stage="between";
  add(goal==="house" ? "You leave Solace and head west toward the old house." : goal==="east" ? "You pass through Solace's east gate and follow Route 127 into unfamiliar country." : "You leave the house and head south toward Solace.","bright");
  showEncounter();
}
function ensureHousing(){
  if(!Array.isArray(player.houseStorage))player.houseStorage=[];
  player.houseBoxMax=6;
  if(player.flags.houseQuest===undefined)player.flags.houseQuest="locked";
  if(player.flags.houseOwned===undefined)player.flags.houseOwned=false;
}
function offerHouseQuest(){
  ensureHousing();
  if(player.flags.houseQuest==="locked"){
    if(player.level<3){add("WAYNE > Travelers saw lights at that old house north of here. Get your road legs first; we'll talk when you're ready.","bright");add("HOUSE LEAD — Speak with Wayne again at Level 3.","system");return;}
    player.flags.houseQuest="active";
    add("WAYNE > Travelers saw a light in the house you left north of here. Someone moved in after you headed out. Check before you shelter there again; I do not want to patch you up over a surprise at your own doorway.","bright");
    add("QUEST ADDED — INVESTIGATE THE ABANDONED HOUSE","reward");
    add("Check QUESTS (Q) for this objective. At the house, choose INVESTIGATE OCCUPATION.","system");
    add("Return to your original starting house north of Solace. Suggested level: 3–5.","system");
  }else if(player.flags.houseQuest==="active")add("WAYNE > Check that old house north of town. Preferably without giving me more work.","bright");
  else if(player.flags.houseQuest==="cleared")add("WAYNE > You've cleared it? Take a proper look around before you leave.","bright");
  else add("WAYNE > Your own roof and a place to stash things. That's practically civilization.","bright");
}
function showHouseChoices(){
  ensureHousing();
  const quest=player.flags.houseQuest;
  queueChoiceLine(`SEARCH BATHROOM CABINET   CHECK FIREPLACE${quest==="active"?"   INVESTIGATE OCCUPATION":quest==="cleared"?"   LIFT FLOORBOARD":""}${player.flags.houseOwned?"   OPEN STORAGE BOX":""}   CHECK PACK   HEAD SOUTH — SOLACE`);
}
function arriveHouse(fromMenu=false){
  ensureHousing();stage="house";
  add("");add("THE OLD HOUSE","place");
  if(!fromMenu){
  add(player.flags.houseOwned?"Your house stands quiet beside the road. The wooden box waits beneath its loose floorboard.":player.flags.houseQuest==="active"?"Fresh boot prints cross the porch. A blanket covers the broken window; someone has occupied the house since you left.":player.flags.houseQuest==="cleared"?"The occupant is gone. The room is quiet, and a loose floorboard waits beneath the discarded blanket.":"The ruined house comes into view again. It isn't comfortable, but the walls still stand.");
  add("The old computer remains where you left it, silent and undisturbed.");
  }
  showHouseChoices();
}
function investigateHouse(){
  ensureHousing();
  if(player.flags.houseQuest!=="active"){add("No hostile occupant remains to investigate.","system");showHouseChoices();return;}
  add("A lantern guttered out beside a new bedroll. A wiry scavenger rises behind the doorway, swinging a short club.");
  add("'Find your own shelter.' He gives you no room to answer.","bright");
  startCombat({name:"HOUSE SQUATTER",level:3,hp:30,min:4,max:7,xp:30,bolts:6,end:"The squatter drops his club and flees through the rear doorway."},"houseBoss");
}
function claimHouse(){
  ensureHousing();
  if(player.flags.houseQuest!=="cleared"){add(player.flags.houseOwned?"You already claimed the house.":"You cannot search the floorboards while the occupant is here.","system");showHouseChoices();return;}
  player.flags.houseQuest="done";player.flags.houseOwned=true;
  add("Under the floorboard sits a small wooden box. Dry, empty, and yours.");
  gainXp(100);add("QUEST COMPLETE — INVESTIGATE THE ABANDONED HOUSE","reward");
  add("HOUSE CLAIMED — Wooden storage box: 6 item stacks. Stored items use no backpack slots.","reward");showHouseChoices();
}
function showHouseStorage(mode="houseStorage"){
  ensureHousing();
  if(!player.flags.houseOwned){arriveHouse();return;}
  stage=mode;add("WOODEN STORAGE BOX","place");
  add(`HOUSE BOX ${player.houseStorage.length}/${player.houseBoxMax} STACKS   BACKPACK ${packSlotsUsed()}/${player.packMax}`,"system");
  player.houseStorage.forEach((i,n)=>add(`${n+1}. ${r18ItemLabel(i)} ×${i.qty} <${i.type.toUpperCase()}>`));
  if(!player.houseStorage.length)add("BOX EMPTY","system");
  if(mode==="houseDeposit"||mode==="houseWithdraw"){
    const items=mode==="houseDeposit"?player.pack.filter(i=>!["key","quest"].includes(i.type) && (player.houseStorage.length<player.houseBoxMax||player.houseStorage.some(x=>x.name===i.name&&x.type===i.type))):player.houseStorage.filter(i=>packSlotsUsed()<player.packMax||hasItem(i.name));
    const verb=mode==="houseDeposit"?"DEPOSIT":"WITHDRAW";
    add("Each transfer moves the entire stack. Equipped gear and quest items stay with you.","system");
    if(!items.length)add("NO ITEMS AVAILABLE","system");
    queueChoiceLine([...items.map(i=>`${verb} ${r18ItemLabel(i).toUpperCase()}`),"(B) BACK"].join("   "));
  }else queueChoiceLine("DEPOSIT ITEMS   WITHDRAW ITEMS   (B) BACK");
}
function transferHouseItem(name,deposit){
  ensureHousing();
  if(!player.flags.houseOwned||!["houseStorage","houseDeposit","houseWithdraw"].includes(stage))return false;
  const from=deposit?player.pack:player.houseStorage,to=deposit?player.houseStorage:player.pack;
  const item=r18NamedStack(from,name);
  if(!item){add("That item is not available. Nothing moved.","system");return false;}
  if(["key","quest"].includes(item.type)){add("Quest and key items stay with you.","system");return false;}
  const existing=to.find(i=>i.name===item.name&&i.type===item.type&&!!i.stolen===!!item.stolen);
  if(!existing && (deposit?to.length>=player.houseBoxMax:packSlotsUsed()>=player.packMax)){add(deposit?"The wooden box is full. Nothing moved.":"Your backpack is full. Nothing moved.","system");return false;}
  // Check every constraint before committing either side. Clone new stacks: no shared references.
  if(existing)existing.qty+=item.qty;else to.push({...item});
  from.splice(from.indexOf(item),1);updateHud();
  add(`${item.name} ×${item.qty} ${deposit?"stored in the house box":"returned to your backpack"}.`,"reward");return true;
}
function isPathChoice(e,key){
  if(e.wo2NonTerminal)return !e.wo2NonTerminal.includes(key);
  if(e.title==='BROKEN RADIO'||e.title==='SCRATCHING IN THE SHED'||e.title==='THE LIMPING HOUND')return false;
  if(e.title==='COUNTY WORK TRUCK')return ['GIVE WORKER A BANDAGE','HELP WORKER TO SAFETY','LEAVE WORKER','MOVE ON'].includes(key);
  if(e.title==='CEMETERY OF TIRES')return key==='LEAVE MAZE';
  if(e.title==='THE SCRAP DUEL')return ['BACK AWAY','CHALLENGE CHAMPION'].includes(key);
  if(e.title==='THE MASK MARKET')return key==='LEAVE MARKET';
  if(e.title==='BROKEN MOTEL')return !['TALK TO HARLAN','INSPECT OFFICE 204','ASK FOR SIGNED CLEARANCE'].includes(key);
  if(e.title==='THE OIL DERRICK')return !['QUESTION HARLAN','QUESTION SARAH','EXAMINE THE NOTEBOOK'].includes(key);
  if(e.title==='THE SILENT PICNIC')return ['OPEN SECRET COMPARTMENT','BACK AWAY'].includes(key);
  if(e.title==='THE SUNKEN CHAPEL')return ['LEAVE CHAPEL','SURFACE AND LEAVE'].includes(key);
  if(e.title==='THE EMPTY ARMORY')return !['INSPECT ARMORY CLUES','TRY CODE 217','TRY CODE 712'].includes(key);
  if(e.title==='THE FURNACE PIT')return key!=='SHUT DOWN FURNACE';
  if(e.title==='THE QUICKSAND CUT'&&!['INSPECT THE WAGON','RESCUE WITH ROPE','TRY IMPROVISED RESCUE','TAKE THE SATCHEL'].includes(key))return true;
  if(e.title==='THE LOCKED FREEZER'&&!['INSPECT RESTAURANT','OPEN FREEZER'].includes(key))return true;
  if(e.title==="THE TIPPED DELIVERY TRUCK"&&!['INVESTIGATE SHIPMENT','RESCUE DRIVER'].includes(key))return true;
  if((e.title==="THE SCRAP CLAIM"||e.title==="EAST ROAD — THE SCRAP CLAIM") && !["INSPECT TRAPS","DISABLE TRAPS"].includes(key))return true;
  if((e.title==="SECURITY DRONE"||e.title==="EAST ROAD — SECURITY DRONE") && key!=="INSPECT BOOTH")return true;
  if(e.exclusive) return true;
  if(!key) return false;
  if(e.title === "THE DARK CELLAR" && /USE FLASHLIGHT|ENTER IN DARK/.test(key)) return true;
  if(e.title === "THE TRAVELER" && /TAKE PACK|WALK AWAY/.test(key)) return true;
  if(e.title === "RIDGELINE" && /HEAD FOR LIGHTS|WAIT/.test(key)) return true;
  return false;
}
function resolveEncounter(cmd) {
  const e = currentEncounter();
  if((e.title==='TUNNEL RATS'||e.title==='EAST ROAD — TUNNEL RATS')&&player.flags.r18TunnelBoarPending){
    if(cmd.includes('back')||cmd.includes('away')){delete player.flags.r18TunnelBoarPending;delete player.flags.r18TunnelRatXp;add('You retreat from the boar and leave the drain behind.');completeRoadTurn();return;}
    if(cmd.includes('fight')){const level=Math.max(1,Math.min(50,Number(player.level)||1)),ratXp=Number(player.flags.r18TunnelRatXp)||0;delete player.flags.r18TunnelBoarPending;delete player.flags.r18TunnelRatXp;startCombat({name:'FERAL BOAR',level,hp:Math.max(22,Math.floor(baseHpForLevel(level)*.27)),min:3,max:7,xp:Math.max(20,level*6),bolts:0,r18TunnelBoar:true,r18TunnelRatXp:ratXp,r18GuaranteeGear:true,end:'The boar falls beside the drain.'},'encounter');return;}
    add('Choose whether to fight the boar or back away.','system');renderCurrentChoices();return;
  }
  if(cmd==="f" && /FIGHT/i.test(e.prompt?e.prompt():e.choices)) cmd=e.combat?.action?.toLowerCase()||"fight";
  if(cmd==="fight"&&/^fight\b/i.test(e.combat?.action||""))cmd=e.combat.action.toLowerCase();
  const spec=e.combat || combatSpecs[e.title];
  const triggers=e.combat?[e.combat.action.toLowerCase()]:combatTriggers[e.title]||["fight"];
  if(spec && triggers.some(t=>e.combat?cmd===t:cmd.includes(t))){
    let fight=e.title==="SALT ON THE ROAD"?{...spec,level:player.level,hp:Math.max(25,baseHpForLevel(player.level)*.32|0),xp:Math.max(25,player.level*8)}:spec;
    if(e.title==="THE SCRAP CLAIM"||e.title==="EAST ROAD — THE SCRAP CLAIM")fight=r18ScrapFight(spec);
    if(e.title==="IRRADIATED ROACHES"||e.title==="EAST ROAD — IRRADIATED ROACHES"){
      const level=Math.max(1,Math.min(50,Number(player.level)||1)),hp=Math.max(10,Math.floor(baseHpForLevel(level)*.11));
      fight={...spec,level,hp:hp*3,xp:Math.max(20,level*6),bolts:0,enemies:[{name:"ROOSTER",hp:Math.ceil(hp*1.2),bolts:0,r18Min:2,r18Max:4},{name:"HEN",hp:Math.floor(hp*.9),bolts:0,r18Min:1,r18Max:3},{name:"SCRAPPER",hp:hp*3-Math.ceil(hp*1.2)-Math.floor(hp*.9),bolts:0,r18Min:1,r18Max:3}]};
    }
    if(e.title==='TUNNEL RATS'||e.title==='EAST ROAD — TUNNEL RATS')fight={...spec,level:player.level,hp:Math.max(18,Math.floor(baseHpForLevel(player.level)*.2)),xp:Math.max(18,player.level*5),bolts:0,r18TunnelRat:true};
    if(e.title==="RATS IN THE PANTRY"||e.title==="EAST ROAD — RATS IN THE PANTRY"){
      const level=Math.max(1,Math.min(50,Number(player.level)||1)),hp=Math.max(12,Math.floor(baseHpForLevel(level)*.14));
      fight={...spec,level,hp:hp*3,xp:Math.max(30,level*8),bolts:0,enemies:[{name:"ALPHA RAT",hp,bolts:0},{name:"SCAVENGER RAT",hp,bolts:0},{name:"GNAWER RAT",hp,bolts:0}]};
    }
    if(e.title==="ROACH NEST"||e.title==="EAST ROAD — ROACH NEST"){
      const variant=r18RoachVariant(),names=["ROACH SWARM","LARGE CONTAMINATED ROACHES","AGGRESSIVE ROACH SWARM"];
      fight={...spec,name:names[variant],level:player.level,hp:Math.max(16,Math.floor(baseHpForLevel(player.level)*(variant===1?.26:.20))),xp:Math.max(20,player.level*6),bolts:0,r18RoachVariant:variant,min:variant===2?3:2,max:variant===1?6:5,armorDef:variant===1?1:0};
    }
    if(e.title==="FERAL DOG"||e.title==="EAST ROAD — FERAL DOG"){
      const pack=r18DogVariant()===3,each=Math.max(12,Math.floor(baseHpForLevel(player.level)*.14)),xp=Math.max(24,player.level*8);
      fight={...spec,name:pack?"FERAL DOG PACK":"FERAL DOG",level:player.level,hp:pack?each*3:each*2,xp:pack?Math.ceil(xp*1.25):xp,bolts:0,r18DogPack:pack,enemies:pack?[{name:"PACK LEADER",hp:each,bolts:0,r18Min:3,r18Max:6},{name:"SCARRED DOG",hp:each,bolts:0,r18Min:2,r18Max:5},{name:"YOUNG DOG",hp:each,bolts:0,r18Min:1,r18Max:3}]:undefined};
    }
    startCombat(fight,"encounter",false,cmd.includes("fight")); return;
  }
  const done=player.encounterDone[roadTurn] || (player.encounterDone[roadTurn]=new Set());
  const leaving = ["move on","keep moving","walk away","continue road","continue","leave","head for lights"].some(x=>cmd.includes(x));
  if(leaving){
    // Some labels are actual encounter paths, not generic leave commands. Let them resolve first.
    const pathKey=choiceKey(cmd,e);
    if(pathKey==="CONTINUE"){add("You leave the location behind and continue along Route 127.");completeRoadTurn();return;}
    if(pathKey && !/MOVE ON|KEEP MOVING|WALK AWAY|HEAD FOR LIGHTS/.test(pathKey)) { /* fall through */ }
    else if(pathKey && (e.title === "THE TRAVELER" || e.title === "RIDGELINE")) {
      const resolved=e.resolve(cmd);
      if(!resolved){ add("That's not an option.","system"); return; }
      done.add(pathKey);
      completeRoadTurn(); return;
    } else {
      add("You leave the location behind and continue along Route 127.");
      completeRoadTurn(); return;
    }
  }
  const key=choiceKey(cmd,e);
  const doneToken=key?`${e.title}::${key}`:null;
  if(key && done.has(key)){ add("You've already done that here.","system"); add(encounterChoices(e),"system"); return; }
  resultBuffer=[];
  const resolved=e.resolve(cmd);
  if(!resolved){ resultBuffer=null; add("That's not an option.","system"); add(encounterChoices(e),"system"); return; }
  flushResults();
  if(stage==="fallen")return;
  // A choice may enter a real fight; do not also finish the road turn.
  if(stage==="wo4Hospital"||stage==="combat"||stage==="r18Depot"||stage==="r18Station"||stage==="r18Tournament"||stage==="r18Recycle"||player.flags.r18HoundNaming)return;
  if(doneToken) done.add(key);
  if(isPathChoice(e,key) || e.exclusive){
    completeRoadTurn(); return;
  }
  // Exploration encounters allow multiple independent actions in the same turn.
  // Only the action just used disappears; remaining actions redraw after its result finishes.
  const remaining=encounterChoices(e);
  const remainingParts=remaining.split(/\s{2,}/).filter(Boolean);
  const meaningful=remainingParts.filter(x=>!/^(MOVE ON|CONTINUE|KEEP MOVING)$/i.test(x.replace(/^\([A-Z0-9]\)\s*/,"")));
  if(meaningful.length){
    busy=true; input.disabled=true; stage="encounter";
    outputQueue.then(()=>{
      if(stage==="encounter"){
        const line=hotkeyLine(remaining);
        addImmediate(line,"system"); followOutput();
      }
      busy=false; input.disabled=false; input.focus();
    });
    return;
  }
  completeRoadTurn();
}
function showCurrentContext(){
  if(!["combat","wandererRoad","encounter"].includes(stage))return renderCurrentChoices();
  add("CURRENT SITUATION","system");
  if(stage==="combat" && combatState){ add(`${combatState.name} — LVL ${String(combatState.level).padStart(2,"0")} — HP ${combatState.hp}/${combatState.maxHp}`,"bright"); renderCombatMenu(); return; }
  if(stage==="wandererRoad" && currentRoadWanderer){ const w=wandererByName(currentRoadWanderer); add(`ROUTE 127 — ${w.name.toUpperCase()} — LVL ${String(w.level).padStart(2,"0")}`,"bright"); add("SMALL TALK   INSPECT   FIGHT   MOVE ON","system"); return; }
  if(stage==="encounter"){ const e=currentEncounter(); const lvl=(e.combat&&e.combat.level) || encounterLevels[e.title] || (roadGoal==="east"? (e.title==="THE WARDEN"?Math.min(50,player.level+2):5+(roadTurn%6)):null); add(`${e.displayName||e.title}${lvl?` — LVL ${String(lvl).padStart(2,"0")}`:""}`,"bright"); add(encounterChoices(e),"system"); return; }
  if(stage==="mercy"){ add(`SOLACE — ${mercyLocation.toUpperCase()}`,"bright"); if(mercyLocation==="town")mercyMenu(); else if(mercyLocation==="jen")showBarActions(); else if(mercyLocation==="relay")showRelayChoices(); else add("(T) TOWN","system"); return; }
  if(stage==="roadReady") add("OLD HOUSE — ROAD heads south toward Solace.","system");
  else if(stage==="settlement") add("(P) APPROACH GATE","system");
  else if(stage==="house")showHouseChoices();
}
function handleRoadWanderer(cmd){
  const w=wandererByName(currentRoadWanderer); if(!w){stage="between";showEncounter();return;}
  if(cmd.includes("small talk")||cmd==="talk"){ ws(w.name); add(wandererDialogue(w),"bright"); add("SMALL TALK   INSPECT   FIGHT   MOVE ON","system"); return; }
  if(cmd.includes("inspect")){ v50Inspect(w); add("SMALL TALK   INSPECT   FIGHT   MOVE ON","system"); return; }
  if(cmd.includes("fight")||cmd.includes("attack")){ startCombat({...v50WandererCombat(w),name:w.name.toUpperCase(),level:w.level,xp:10+w.level*4,bolts:Math.floor(w.level/2)+2,end:`${w.name} goes down and does not get back up.`},"roadWanderer",false,true); return; }
  if(cmd.includes("move")||cmd.includes("leave")||cmd.includes("continue")){ add(`${w.name} falls behind as you continue toward ${typeof lanternState==='function'&&lanternState()?.currentEdgeId?lanternDestination():roadGoal==="mercy"?"Solace":roadGoal==="east"?(player.flags.eastReturning?"Solace":"the Factory"):"the old house"}.`); currentRoadWanderer=null; completeRoadTurn(); return; }
  add("SMALL TALK   INSPECT   FIGHT   MOVE ON","system");
}
function handleTownWanderer(cmd){
  const w=wandererByName(currentTownWanderer); if(!w)return false;
  const named=cmd.includes(w.name.toLowerCase()) || (townWandererFocus===w.name && ["small talk","inspect","fight","leave"].includes(cmd));
  if(cmd===`talk to ${w.name.toLowerCase()}` || cmd===w.name.toLowerCase()){
    if(w.name==='Vale')storyRecordValeSighting();
    townWandererFocus=w.name;
    add(w.name.toUpperCase()+" — WANDERER — LVL "+String(w.level).padStart(2,"0"),"place");
    add(w.lines && w.lines[1] ? w.lines[1] : `${w.name} looks ${w.vibe}.`);
    add(`SMALL TALK ${w.name.toUpperCase()}   INSPECT ${w.name.toUpperCase()}   FIGHT ${w.name.toUpperCase()}   TOWN`,"system"); return true;
  }
  // A wanderer being in town does not own Solace's conversation context.
  // They only respond when explicitly addressed by name (or while confirming their fight).
  if(!named && pendingTownFight!==w.name) return false;
  if((cmd.includes("small talk") && named)||cmd===`talk to ${w.name.toLowerCase()}`){ ws(w.name); add(wandererDialogue(w),"bright"); add("SMALL TALK   INSPECT   FIGHT   LEAVE","system"); return true; }
  if(cmd.includes("inspect") && named){ v50Inspect(w); add("SMALL TALK   INSPECT   FIGHT   LEAVE","system"); return true; }
  if(cmd==="confirm fight" && pendingTownFight===w.name){ pendingTownFight=null; startCombat({...v50WandererCombat(w),name:w.name.toUpperCase(),level:w.level,xp:10+w.level*4,bolts:Math.floor(w.level/2)+2,end:`${w.name} goes down. Solace gets very quiet for a moment.`},"townWanderer",true,true); return true; }
  if(cmd.includes("fight") && named){ pendingTownFight=w.name; add(`START A FIGHT WITH ${w.name.toUpperCase()}?`,"danger"); add("This action will cost 1 TURN.","system"); add("CONFIRM FIGHT   BACK OFF","system"); return true; }
  if(cmd==="back off" && pendingTownFight){ pendingTownFight=null; add("You decide not to start trouble."); add("SMALL TALK   INSPECT   FIGHT   LEAVE","system"); return true; }
  if(cmd==="leave"||cmd==="town"){ townWandererFocus=null; add(`You leave ${w.name} to their business.`); return true; }
  return false;
}
async function arriveSettlement() {
  if(player.flags.mercyDiscovered){ stage="mercy"; mercyLocation="town"; add(""); add("SOLACE GATE","place"); add(`The guard recognizes ${player.handle||"you"} and waves you through.`); add("SOLACE — MAIN STREET","bright"); mercyMenu(); return; }
  busy = true; input.disabled = true; add("");
  add(`ARRIVAL — SOLACE GATE (MAIN ROAD STEP ${roadTripLength} / ${roadTripLength})`, "place");
  add("SOLACE DISCOVERED", "bright"); player.flags.mercyDiscovered=true; player.flags.mainSolaceQuest="done"; add("QUEST COMPLETED — HEAD TO SOLACE","reward");if(player.flags.relayQuest==="locked"){player.flags.relayQuest="ask";add("NEW QUEST — RELAY STATION: Ask around Solace.","reward");}
  gainXp(20);
  await typeLine("By late afternoon, the road drops toward a barricade built from two school buses, corrugated steel, and the bones of an old service station.");
  await typeLine("A hand-painted sign hangs above the gate:", "system");
  add(""); await typeLine("SOLACE", "anomaly", 90); add("");
  await typeLine("A rifle barrel appears above the wall.");
  await typeLine("VOICE > That's far enough.", "man", 35);
  await typeLine("VOICE > State your business.", "man", 35);
  if(player.flags.helpedTraveler) await typeLine("You remember the wounded traveler saying Solace treats people fair if you do the same.","bright",25);
  add(""); add("You have reached the first settlement. Town actions cost 0 turns. Starting a fight costs 1 turn.", "system");
  add("(P) APPROACH GATE", "system");
  stage = "settlement"; input.disabled = false; input.focus(); busy = false;
}


function mercyMenu(){
  player.flags.solaceMenu="town";
  currentTownWanderer=null;
  add("──────────────────── SOLACE ────────────────────", "system"); showWanderersAt("mercy");
  queueChoiceLine(`(B) THE RUSTY LANTERN TAVERN   (T) JOHNNY'S TRADING POST   (W) MURPHY'S MOTOR WORKS   (C) LAST CHANCE CLINIC   (A) SOLACE SAVINGS & LOAN   ARMORY   (U) BULLETIN BOARD${player.flags.relayUnlocked?"   (R) RELAY STATION":""}   (E) WEST GATE   (G) EAST GATE   (L) FIND TIM${player.flags.r18SaltWorkersFreed?"   TALK TO GIDEON":""}${player.flags.r18Courier?.phase==='service'?"   POST OFFICE":""}${player.flags.r18Ash?.reunionAvailable&&!player.flags.r18Ash?.reunion?"   SEEK ASH SURVIVOR":""}${townVisitorChoice()}`);
}
function bankMenu(){v48BankMain();}
function showBankActions(){const page=player.flags.v48BankPage;if(page&&page!=="main")v48BankPage(page);else v48BankMain();}
function stashItem(name){return v48Stash(name);}
function retrieveItem(name){return v48Retrieve(name);}
function townVisitorChoice(){ return currentTownWanderer ? `   TALK TO ${currentTownWanderer.toUpperCase()}` : ""; }
function showBarActions(){
  storyValeReunion();
  player.flags.solaceMenu="bar";
  player.flags.jenInDialogue=false;
  add(`(B) BUY DRINKS   (G) GAMBLE${player.flags.rustyRoomOwned?"   (R) YOUR ROOM":player.bolts>=2000?"   (R) BUY ROOM — 2000 BOLTS":""}   (J) SMALL TALK JEN${townVisitorChoice()}   SELL ITEMS   (T) RETURN TO TOWN`,"system");
}
function showDrinkMenu(){
  player.flags.solaceMenu="drinks";mercyLocation="jenDrinks";add("DRINKS","bright");
  add("BEER — 5 BOLTS — 5% MAX HP (MIN 5); SHOT — 9 BOLTS — 9% (MIN 10); HOUSE SPECIAL — 15 BOLTS — 15% (MIN 15)","system");
  const choices=[];if(player.hp<player.maxHp){if(player.bolts>=5)choices.push("(E) BEER — 5 BOLTS — 5% MAX HP (MIN 5)");if(player.bolts>=9)choices.push("(O) SHOT — 9 BOLTS — 9% MAX HP (MIN 10)");if(player.bolts>=15)choices.push("(H) HOUSE SPECIAL — 15 BOLTS — 15% MAX HP (MIN 15)");}choices.push("(B) BACK");add(choices.join("   "),"system");
}
function showGambleMenu(){casinoMenu();}
function npcTalk(name){
  const n=name.toLowerCase(); mercyLocation=n;player.flags.solaceMenu="dialogue";
  if(n==="jen"){player.flags.jenInDialogue=true;storyValeReunion();r18FoodSync();}
  const handins={jen:["jenQuest","Jen's Supply Crate"],johnny:["johnnyQuest","Johnny's Ledger"],amii:["amiiQuest","Bank Satchel"],wayne:["waynePatientQuest","Clinic Medicine"]};
  if(handins[n]&&player.flags[handins[n][0]]==="recovered")add(`DELIVER ${handins[n][1].toUpperCase()} — available now`,"reward");
  if(n==="jen"&&player.flags.jenQuest==="rescued")add("DELIVER RUNNER'S TOKEN — available now","reward");
  if(n==="jen"){
    add("JEN", "place");v48NpcIntro("jen",({active:"Jen keeps glancing toward the south gate. The runner is still missing.",cart:"Jen asks whether you've searched the cart marked on the eastern road.",recovered:"Jen sees the supply crate and rises from behind the bar.",hideout:"Jen has the supplies, but her runner is still out there.",raiders:"Jen waits for news from the abandoned checkpoint.",rescued:"Jen sees the runner's token in your hand and lets out a breath.",done:"Jen smiles. The runner is home. Your drinks still aren't free."})[player.flags.jenQuest]||"Jen leans against the bar and gives you her full attention.",player.flags.jenQuest||"none",true);
    add(`${player.flags.jenQuest==="recovered"?"DELIVER JEN'S SUPPLY CRATE   ":player.flags.jenQuest==="rescued"?"DELIVER RUNNER'S TOKEN   ":""}${player.flags.jenUnpaidTab==="active"?"SETTLE UNPAID TAB   ":""}${player.flags.jenFamiliarFace==="active"&&storyHasValeEvidence()?"TELL JEN ABOUT THE FAMILIAR FACE   ":""}${player.flags.r18ClaraMet&&player.flags.r18DanielQuest!=="done"?"ASK ABOUT DANIEL   ":""}${r18StewReady()?"ASK ABOUT WASTELAND STEW   ":""}${r18CourierEligible("jen")?"DELIVER JEN LETTER   ":""}ASK ABOUT SOLACE   ASK ABOUT ROAD   ASK ABOUT WORK   ASK RUMORS${(!player.flags.relayUnlocked && player.flags.relayQuest==="ask")?"   ASK ABOUT RELAY STATION":""}   ASK ABOUT UNPAID TAB   A FAMILIAR FACE   SMALL TALK   ASK ABOUT MISSING SHIPMENT   (B) BACK`, "system"); return;
  }
  if(n==="johnny"){
    add("JOHNNY", "place"); v48NpcIntro("johnny","Johnny folds his arms, wearing the expression of a man who could turn this conversation into a sale.");
    add(`${player.flags.johnnyQuest==="recovered"?"DELIVER JOHNNY'S LEDGER   ":""}${player.flags.r18ClaraMet&&player.flags.r18DanielQuest!=="done"?"ASK ABOUT DANIEL   ":""}ASK ABOUT LOST LEDGER   ASK ABOUT DEALS   ASK ABOUT SUPPLIES   ASK ABOUT ROAD${player.flags.relayPartsRevealed&&player.flags.relayQuest!=="complete"?"   ASK ABOUT RELAY PARTS":""}   SMALL TALK   (B) BACK`, "system"); return;
  }
  if(n==="murphy"){
    add("MURPHY", "place"); v48NpcIntro("murphy","Murphy wipes his hands on a rag and looks up from the bench.");
    add(`${player.flags.murphyQuest==="found"&&hasItem("Usable Serpentine Belt")?"SMALL TALK MURPHY — RETURN BELT   ":""}CRAFTING RECIPES   ASK ABOUT WORKSHOP   ASK ABOUT CARS   ASK ABOUT CORVETTE   ASK ABOUT EQUIPMENT${player.flags.relayPartsRevealed&&player.flags.relayQuest!=="complete"?"   ASK ABOUT RELAY PARTS":""}${(!player.flags.relayUnlocked && player.flags.relayQuest==="ask")?"   ASK ABOUT RELAY STATION":""}   SMALL TALK   (B) BACK`, "system"); return;
  }
  if(n==="wayne"){
    add("WAYNE", "place"); v48NpcIntro("wayne","Wayne looks up like he's already preparing a sarcastic diagnosis.");
    add("ASK ABOUT LAST PATIENT   ASK ABOUT INJURIES   ASK ABOUT WORK   ASK ABOUT ROAD   ASK ABOUT SOLACE   ASK ABOUT OLD HOUSE   SMALL TALK   (B) BACK", "system"); return;
  }
  if(n==="amii"){
    add("AMII", "place"); v48NpcIntro("amii","Amii smiles. Niko thumps his tail. Alex continues conducting a background check with his eyes.");
    add(`${player.flags.amiiQuest==="recovered"?"DELIVER BANK SATCHEL   ":""}ASK ABOUT MISSING DEPOSIT   ASK ABOUT BANKING   ASK ABOUT NIKO AND ALEX   ASK ABOUT SOLACE   SMALL TALK   (B) BACK`, "system"); return;
  }
  if(n==="tim"){
    const spots=["near Solace's gate, checking a repaired hinge","outside Murphy's Motor Works, talking quietly over the sound of tools","at the end of The Rusty Lantern Tavern with a tin cup in one hand","near the bank, scratching Niko behind the ears"];
    const spot=spots[Math.floor(Math.random()*spots.length)];
    add("TIM", "place"); v48NpcIntro("tim",`You find Tim ${spot}.`); v48NpcIntro("tim_hair","His red hair has gone gray around the temples, but he's still moving like there are six things left to do before dark.");
    add("TIM > Hey. Settling in alright?", "bright");
    if(player.flags.timQuest==="found"&&hasItem("Tim's Old Badge"))add("RETURN OLD BADGE — available now","reward");
    add("ASK ABOUT SOLACE   ASK ABOUT WORK   VIEW BOUNTIES   COLLECT BOUNTY   PAY OFF BOUNTY   ASK ABOUT RELAY STATION   NEVER MIND", "system"); return;
  }
}
function askAboutRelay(name){
  const n=name.toLowerCase();
  const replies={
    tim:"TIM > North wall, behind the water tower. Without that Relay, warnings reach us on foot or not at all. If those voices can help us get it working, I will have the gate unchained.",
    murphy:"MURPHY > North-wall comms shack. The transmitter has power, but the old hardware will not hold a signal. Tim keeps it chained so nobody strips the last useful parts. I will tell him you want to repair it.",
    jen:"JEN > North side, past the water tower. Before it failed, people could tell us they were coming. Now I keep setting places for travelers who never arrive. I will tell the guard to let you through.",
    wayne:"WAYNE > Relay station? I treat people, not antennas. Ask Tim. Or Murphy if you want a three-hour answer involving voltage.",
    johnny:"JOHNNY > I know where it is. I also know nobody has bought anything useful out of it in years. Tim can get you inside.",
    amii:"AMII > I've heard people call it that. I think it's near the north wall? Sorry. I mostly know where the bank is. Very confidently."
  };
  add(replies[n]||"They don't know much about the Relay Station.","bright");
  if(["tim","murphy","jen"].includes(n) && !player.flags.relayUnlocked){
    player.flags.relayUnlocked=true;
    if(player.flags.relayQuest==="ask") player.flags.relayQuest="find";
    add("LOCATION UNLOCKED — RELAY STATION","reward");
    add("The Relay Station is now available from Solace.","system");
  }
  npcTalk(n);
}
function ensureRelayParts(){ if(!player.flags.relayParts||typeof player.flags.relayParts!=="object") player.flags.relayParts={johnny:false,yard:false,branch:false,east:false}; return player.flags.relayParts; }
function relayPartCount(){ return Object.values(ensureRelayParts()).filter(Boolean).length; }
function awardRelayPart(key,name){ const rp=ensureRelayParts(); if(rp[key]){add("You've already recovered what the Relay needs from here.","system");return false;} rp[key]=true; add(`RELAY COMPONENT RECOVERED — ${name}`,"reward"); add(`PARTS RECOVERED — ${relayPartCount()}/4`,"system"); if(relayPartCount()>=4){ add("All four components are accounted for. Return to the Relay Station.","bright"); } return true; }
function inspectRelaySystem(key){ player.flags.relayInspected=player.flags.relayInspected||{}; player.flags.relayInspected[key]=true; const n=Object.values(player.flags.relayInspected).filter(Boolean).length; add(`RELAY DIAGNOSTICS — ${n}/4 SYSTEMS INSPECTED`,"system"); if(n>=4) revealRelayParts(); else add("QUEST UPDATED — New Relay clue recorded in QUESTS.","reward"); }
function revealRelayParts(){ ensureRelayParts(); if(player.flags.relayPartsRevealed)return; player.flags.relayPartsRevealed=true; player.flags.relayBranchDiscovered=true; add("The failures are not one problem. They're four.","bright"); add("RELAY REPAIR — FOUR COMPONENTS REQUIRED","reward"); add("POWER REGULATOR — Johnny may have something this old.","system"); add("ANTENNA SERVO — Scrap Yard holds the county motor assemblies; the Yardman guards them.","system"); add("SHIELDED FEED COUPLER — A signal cabinet stands on Old Service Road, west of Works Junction.","system"); add("SIGNAL-CONDITIONING MODULE — Old communications equipment waits at the Factory crossroads, south of Solace.","system"); add("QUEST UPDATED — All four clues recorded in QUESTS. LOWER ACCESS ROAD UNLOCKED.","reward"); }
const RELAY_REWARD_POOL=Object.freeze([
 "Tempered Steel Pipe","Balanced Hunting Knife","Precision Hunting Rifle","Tempered Combat Machete","Specialized Service Revolver",
 "Advanced Relay Vest","Padded Tactical Jacket","Tempered Leather Armor","Salvaged Security Vest","Insulated Patrol Coat"
]);
function selectRelayEquipment(rng=Math.random){return RELAY_REWARD_POOL[Math.floor(rng()*RELAY_REWARD_POOL.length)];}
function claimRelayEquipment(){
 const reward=player.flags.relayEquipmentReward;
 if(player.flags.relayQuest!=="complete"||!reward||reward.claimed)return false;
 const gear=GEAR[reward.item];if(!gear)return false;
 const existing=player.pack.some(i=>i.name===reward.item&&i.type===gear.type);
 if(!existing&&packSlotsUsed()>=player.packMax){
  add(`RELAY REWARD PENDING — ${gearLabel(reward.item)}`,"rare");
  add("Free a backpack slot, then CLAIM RELAY REWARD here. Your selected item is saved.","system");return false;
 }
 if(!addPack(reward.item,gear.type))return false;
 reward.claimed=true;add(`RELAY REWARD CLAIMED — ${gearLabel(reward.item)}`,"rare");return true;
}
function awardRelayEquipment(){
 if(player.flags.relayQuest!=="complete"||player.flags.relayEquipmentReward)return;
 player.flags.relayEquipmentReward={item:selectRelayEquipment(),claimed:false};
 claimRelayEquipment();
}
function showRelayChoices(){
  if(player.flags.relayQuest==="complete"){
    add("MONITOR ONLINE","system");const pending=player.flags.relayEquipmentReward&&!player.flags.relayEquipmentReward.claimed;
    if(pending)add(`PENDING RELAY REWARD — ${gearLabel(player.flags.relayEquipmentReward.item)}`,"rare");
    add(`${pending?"(C) CLAIM RELAY REWARD   ":""}(T) TALK TO TOMORROW PROJECT   (B) BACK`,"system");return;
  }
  add(`(O) INSPECT MONITOR   (C) INSPECT CONSOLE   (A) INSPECT ANTENNA CONTROLS   (P) INSPECT CABLES${relayPartCount()===4 && player.flags.relayQuest!=="complete"?"   INSTALL COMPONENTS":""}   (B) BACK`,"system");
}
function enterRelayStation(){
  mercyLocation="relay";
  add("RELAY STATION","place");
  if(!player.flags.relayVisited){
  add("A squat municipal communications building crouches against Solace's north wall, half hidden behind a rusted water tower.");
  add("The antenna mast above it leans a few degrees east. Dead cable hangs from it like black vines.");
  add("Inside, dust blankets banks of switches, cracked meters, and equipment old enough to have forgotten what year it is.");
  add(player.flags.relayQuest==="complete"?"The monitor glows steadily. The Tomorrow Project connection remains active.":"At the far end of the room sits a single monitor. Its glass is dark.");
  }else add(player.flags.relayQuest==="complete"?"The Relay monitor holds its steady signal.":"You step back into the Relay Station.");
  if(!player.flags.relayVisited){
    player.flags.relayVisited=true; player.flags.relayQuest="stabilize";
    add(""); add("CLICK.","bright");
    add("The monitor flickers once. Twice. Static crawls across the glass.","system");
    add("DISPLAY LINK ESTABLISHED","bright");
    if(player.level>=5)add("/\\//\\  ///\\  //\\//  /\\/", "system");
    add(`WOMAN'S VOICE > ${player.handle||"Syn"}? Good. You found it.`,"woman");
    add("Static tears across the screen.","system");
    outputQueue=outputQueue.then(()=>flashRelayStatic());
    add("WOMAN'S VOICE > I don't have much time. We're losing the signal again.","woman");
    add("WOMAN'S VOICE > The Relay's own hardware is failing. Check the monitor, console, antenna controls and cables. We need this line to find out what happened east of—","woman");
    add("SIGNAL LOSS","bright");
    add("WOMAN'S VOICE > —Solace. Stabilize the connection. Then we can talk.","woman");
    add("NO SIGNAL","system");
    add("QUEST UPDATED — RELAY STATION","reward");
    add("Inspect all four Relay systems. Their faults should tell you which replacement parts to recover.","system");
  }
  showRelayChoices();
}
function smallTalk(name){
  if(name==="tim" && player.flags.timQuest==="locked"){
    player.flags.pendingQuest="tim"; add("TIM > Funny thing. I used to carry an old badge. Lost it somewhere on Route 127 between here and that abandoned house you came from.","bright"); add("TIM > Doesn't mean much to anybody else. Means something to me."); add("ACCEPT — LOOK FOR TIM'S BADGE   DECLINE","system"); return;
  }
  if(name==="murphy" && player.flags.murphyQuest==="locked"){
    player.flags.pendingQuest="murphy"; add("MURPHY > I need one good serpentine belt. Passed a wreck near that service-road fork on the way toward the old house. Didn't have time to crawl through it.","bright"); add("MURPHY > If you're heading that way, keep an eye out."); add("ACCEPT — LOOK FOR A BELT   DECLINE","system"); return;
  }
  const lines={
    jen:["JEN > Sit a while. Road'll still be ugly when you get back to it.","JEN > People talk more after the second drink. Luckily, they talk plenty after water too.","Jen glances toward the door. JEN > Quiet night. I don't trust those."],
    johnny:["JOHNNY > I once sold the same wrench three times. Long story. Excellent wrench.","JOHNNY > You ever find something you don't need, remember: I probably know somebody who suddenly does.","JOHNNY > A bargain is just two people disagreeing politely about who's winning."],
    murphy:["MURPHY > If it rattles, tighten it. If it still rattles, learn to like the sound.","Murphy looks around the shop. MURPHY > I know exactly where everything is. Don't test me on that.","MURPHY > Cars used to complain with dashboard lights. Now they complain with fire."],
    wayne:["WAYNE > My professional recommendation is to stop getting hit.","WAYNE > You'd be amazed how many medical problems begin with somebody saying 'watch this.'", "Wayne looks you over. WAYNE > You're upright. Strong start."],
    amii:["AMII > I practiced saying 'welcome to the bank' without sounding weird. I think that made it weirder.","Niko leans against Amii's leg. AMII > He's subtle about wanting attention. Alex isn't subtle about anything.","AMII > I like numbers. Numbers usually say what they mean."],
    tim:["TIM > Solace isn't perfect. Perfect didn't survive. Good enough did.","TIM > Best part of leading a town? Everybody knows where to find you when something breaks.","Tim looks down Main Street. TIM > Still here. That's a win most days."]
  };
  const a=lines[name]; add(a[Math.floor(Math.random()*a.length)], "bright");
}
// Individual stock is stored with the character, never regenerated by opening the shop.
const VENDOR_BASE={"Emergency Trauma Kit":200,"Battered Flashlight":20,"Rusted Pipe":12,"Worn Jacket":10,"Tent":12,"Energy Bars":8,"Bandage":12,"Reinforced Jacket":45,"Claw Hammer":50,"Tire Iron":80,"Reinforced Pipe":48,"Tempered Steel Pipe":125,"Padded Jacket":45,"Hardened Scavenger Coat":135,"Devastator's Iron Pipe":320,"Wraith's Reinforced Coat":340,"Worn Leather Wristband":18,"Lucky Bottle Cap":15,"Worn Belt":22,"Scavenger's Charm":55,"Reinforced Dog Tags":60,"Road Warrior's Bracelet":65};
const VENDOR_POOL=["Rusted Pipe","Worn Jacket","Reinforced Jacket","Claw Hammer","Tire Iron","Reinforced Pipe","Tempered Steel Pipe","Padded Jacket","Hardened Scavenger Coat","Devastator's Iron Pipe","Wraith's Reinforced Coat","Worn Leather Wristband","Lucky Bottle Cap","Worn Belt","Scavenger's Charm","Reinforced Dog Tags","Road Warrior's Bracelet"];
function refreshVendorStock(){
  const common=VENDOR_POOL.filter(x=>GEAR[x].rarity==="common"),uncommon=VENDOR_POOL.filter(x=>GEAR[x].rarity==="uncommon"),rare=VENDOR_POOL.filter(x=>GEAR[x].rarity==="rare");
  const thirdPool=Math.random()<.05?rare:uncommon;
  const stock=[];for(let i=0;i<2;i++)stock.push(common.splice(Math.floor(Math.random()*common.length),1)[0]);
  stock.push(thirdPool[Math.floor(Math.random()*thirdPool.length)]);
  player.vendorStock=stock;player.vendorSold=[];player.vendorPolicyVersion=44;player.vendorRefreshes=(player.vendorRefreshes||0)+1;
  player.dailyDeal=["Energy Bars","Bandage",...stock][Math.floor(Math.random()*(stock.length+2))];
}
function ensureVendorStock(){
 if(!Array.isArray(player.vendorStock)||player.vendorStock.length!==3)refreshVendorStock();
 else if(player.vendorStock.filter(x=>GEAR[x]?.rarity==="common").length!==2||!["uncommon","rare","epic"].includes(GEAR[player.vendorStock[2]]?.rarity)){
  const retained=player.vendorStock.find(x=>GEAR[x]?.rarity==="uncommon")||"Claw Hammer";player.vendorStock=["Rusted Pipe","Worn Jacket",retained];player.vendorPolicyVersion=44;
 }
 if(!Array.isArray(player.vendorSold))player.vendorSold=[];
}
function johnnyPrice(item){const base=VENDOR_BASE[item];return player.dailyDeal===item?Math.max(1,Math.round(base*.72)):base;}
function johnnyMainMenu(){
  player.flags.solaceMenu="johnnyMain";
  add("JOHNNY'S TRADING POST","place");
  add("JOHNNY > Buying, selling, or talking? Pick your poison.","bright");
  add(["VIEW STOCK","SELL ITEMS","TALK",...(player.flags.r18MarthaSettled?["OLD WORLD COUNTER"]:[]),"(B) BACK"].join("   "),"system");
}
function johnnyShop(){
  ensureVendorStock();player.flags.solaceMenu="shop";
  add("JOHNNY'S STOCK — PERSONAL DAILY SELECTION","place");
  add(`ENERGY BAR — RESTORE 10% MAX HP — ${johnnyPrice("Energy Bars")} BOLTS`,"system");add(`BANDAGE — RESTORE 25% MAX HP — ${johnnyPrice("Bandage")} BOLTS`,"system");
  add(`BATTERED FLASHLIGHT — 20 BOLTS`,"system");
  add(`TENT — ${johnnyPrice("Tent")} BOLTS — one use for overnight camp.`,"system");
  if(player.packMax-(player.flags.r5MuleBonus||0)<10)add(`10-SLOT BACKPACK — ${V48_BACKPACK_PRICE} BOLTS`,"system");
  const scrap=findItem("Scrap Metal"),sq=scrap?scrap.qty:0;add(`SCRAP: ${sq} — ${sq*4} BOLTS. Stock refreshes at daily refill.`,"system");
  add(["BUY ENERGY BAR","BUY BANDAGE","BUY BATTERED FLASHLIGHT","SMALL TALK",...(player.flags.relayPartsRevealed&&player.flags.relayQuest!=="complete"?["ASK ABOUT RELAY PARTS"]:[]),"BUY TENT","BUY","SELL ITEMS",...(player.flags.r18MarthaSettled?["OLD WORLD COUNTER"]:[]),...(player.packMax-(player.flags.r5MuleBonus||0)<10?["BUY 10-SLOT BACKPACK"]:[]),...(sq?["SELL ALL SCRAP"]:[]),"(B) BACK"].join("   "),"system");
}
function showEquipmentShop(){
 player.flags.solaceMenu="equipment";add("SCRAP & STEEL ARMORY — MARA — DAILY EQUIPMENT",'place');
 const stock=regionalEquipmentStock('solace');for(const slot of stock.slots)add(regionalEquipmentText(slot,'solace'),GEAR[slot.name]?.rarity||'system');
 add([...stock.slots.filter(x=>!x.sold).map(x=>`BUY ${x.name.toUpperCase()}`),"(B) BACK"].join('   '),'system');
}
function vendorReturnMenu(){return player.flags.solaceMenu==="equipment"?showEquipmentShop():johnnyShop();}
function buyJohnny(item){
 ensureVendorStock();if(!["Energy Bars","Bandage","Tent","Battered Flashlight",...player.vendorStock].includes(item)){add("JOHNNY > Not in today's stock.","system");vendorReturnMenu();return;}
 if(player.vendorSold.includes(item)){add("JOHNNY > Sold out. Try tomorrow.","system");vendorReturnMenu();return;}
 if(GEAR[item] && mercyLocation!=="mara"){add("Weapons and armor are sold at Scrap & Steel Armory.","system");return;}
 const price=johnnyPrice(item);if(player.bolts<price){add(`INSUFFICIENT BOLTS — ${price} required; you carry ${player.bolts}.`,"system");vendorReturnMenu();return;}
 const g=GEAR[item],stackable=!g;
 if(stackable&&packSlotsUsed()>=player.packMax&&!hasItem(item)){add("Your pack is full.","system");vendorReturnMenu();return;}
 if(g&&packSlotsUsed()>=player.packMax){add("Your pack is full. Free a slot before buying equipment.","system");vendorReturnMenu();return;}

 // Payment only after capacity checks. Gear is carried until explicitly equipped.
 if(!addPack(item,g?g.type:item==="Tent"?"supply":item==="Battered Flashlight"?"tool":"consumable",1,true)){vendorReturnMenu();return;}
 player.bolts-=price;if(g)player.vendorSold.push(item);updateHud();
 add(`PURCHASED — ${gearLabel(item)} — -${price} BOLTS. ${g?"Open INVENTORY to equip.":""}`,g?.rarity||"reward");showPurchaseComplete();
}
function showPurchaseComplete(){player.flags.solaceMenu="purchaseComplete";add("PURCHASE COMPLETE","reward");add("CONTINUE SHOPPING   RETURN TO TOWN","system");}
function showPersonalQuestOffer(key){
 const intro={jenQuest:["LAST CALL","JEN > My runner was bringing a supply cart back from the Factory road. The cart never arrived, and neither did they. Supplies I can replace. People are harder. Will you look for them?"],johnnyQuest:["A DEAL GONE BAD","JOHNNY > A runner lost my ledger on the road north toward House. Names, debts, promises. Bad hands could turn that book into trouble for half of Solace. Bring it back?"],amiiQuest:["THE MISSING DEPOSIT","AMII > A deposit satchel went missing north of town. Those Bolts belong to people who trusted us. I need it found before I have to tell them. Can you help?"],waynePatientQuest:["THE LAST PATIENT","WAYNE > A patient needs medicine I don't have. An old ambulance on the south gate road toward Factory might still carry it. I'd ask nicely, but we're running out of time. Will you search?" ]}[key];
 add(intro[0],"place");add(intro[1],"bright");add("ACCEPT   DECLINE","system");
}
function murphyMainMenu(){
 player.flags.solaceMenu="murphyMain";
 add("MURPHY'S WORKSHOP", "place");
 add("[1] CRAFTING RECIPES   [2] INSPECT CORVETTE   [3] TALK   (B) BACK", "system");
}
function murphyTalkMenu(){
 player.flags.solaceMenu="murphyTalk";
 add("MURPHY — TALK", "place");
 add("[1] ASK ABOUT WORK   [2] ASK ABOUT CORVETTE   [3] ASK ABOUT RELAY STATION   [4] BACK", "system");
}
function handleSolace(cmd, raw=cmd){
 if(mercyLocation==="murphy"&&player.flags.solaceMenu==="murphyMain"){
  if(["1","crafting recipes","recipes"].includes(cmd)){v49MurphyRecipes();return;}
  if(["2","inspect corvette","inspect corvette photo","corvette photo"].includes(cmd)){add("You step closer to the faded photograph. A bright blue Corvette sits under a sky that looks almost impossibly clean.");add("Murphy glances over and smiles. MURPHY > Blue Corvette. That's what cars were supposed to look like.","bright");murphyMainMenu();return;}
  if(["3","talk","small talk","small talk murphy"].includes(cmd)){murphyTalkMenu();return;}
  if(["b","back","return"].includes(cmd)){mercyLocation="town";player.flags.solaceMenu="";mercyMenu();return;}
 }
 if(mercyLocation==="murphy"&&player.flags.solaceMenu==="murphyTalk"){
  if(["1","ask about work","about work"].includes(cmd)){add("MURPHY > Anything mechanical comes through here eventually. I could use a usable serpentine belt; the old one is cracked clean through.","bright");if(player.flags.murphyQuest==="locked")player.flags.murphyQuest="active";murphyTalkMenu();return;}
  if(["2","ask about corvette","about corvette"].includes(cmd)){add("MURPHY > Blue Corvette. One day I will get her running. Right now she is a photograph, a pile of parts, and an unreasonable amount of hope.","bright");murphyTalkMenu();return;}
  if(["3","ask about relay station","about relay station","relay station"].includes(cmd)){askAboutRelay("murphy");return;}
  if(["4","b","back","return"].includes(cmd)){murphyMainMenu();return;}
 }
 if(mercyLocation==="johnny"&&player.flags.solaceMenu==="johnnyMain"){
  if(cmd==="view stock"||cmd==="stock"){johnnyShop();return;}
  if(cmd==="talk"||cmd==="small talk"){npcTalk("johnny");return;}
  if(cmd==="b"||cmd==="back"||cmd==="return"){mercyLocation="town";mercyMenu();return;}
 }
 if(player.flags.pendingQuestOffer){const key=player.flags.pendingQuestOffer;if(cmd==="accept"){player.flags[key]="active";player.flags.pendingQuestOffer="";add(`NEW QUEST — ${ {jenQuest:"LAST CALL",johnnyQuest:"A DEAL GONE BAD",amiiQuest:"THE MISSING DEPOSIT",waynePatientQuest:"THE LAST PATIENT"}[key] }`,"reward");npcTalk(mercyLocation);return;}if(cmd==="decline"||cmd==="back"||cmd==="b"){player.flags.pendingQuestOffer="";add("Maybe another time. The offer remains available.","system");npcTalk(mercyLocation);return;}showPersonalQuestOffer(key);return;}

 if(handleCasinoCommand(cmd))return;
 if(handleV48Command(cmd))return;
 const f=player.flags;
 if(mercyLocation==="johnny"&&cmd==="browse equipment"){v50Armory();return;}
 if(mercyLocation==="johnny"&&f.solaceMenu==="equipment"&&(cmd==="b"||cmd==="back")){johnnyShop();return;}
 const quests=[
  {key:"jenQuest",ask:"missing shipment",npc:"jen",title:"LAST CALL",item:"Jen's Supply Crate",reward:"Bluefang Hunting Knife",xp:180,bolts:35},
  {key:"johnnyQuest",ask:"lost ledger",npc:"johnny",title:"A DEAL GONE BAD",item:"Johnny's Ledger",reward:null,xp:100,bolts:40},
  {key:"amiiQuest",ask:"missing deposit",npc:"amii",title:"THE MISSING DEPOSIT",item:"Bank Satchel",reward:null,xp:120,bolts:45},
  {key:"waynePatientQuest",ask:"last patient",npc:"wayne",title:"THE LAST PATIENT",item:"Clinic Medicine",reward:"Highway Warden's Coat",xp:150,bolts:20}
 ];
 for(const q of quests){
  if(cmd.includes(q.ask)&&mercyLocation===q.npc){
   if(!f[q.key]){f.pendingQuestOffer=q.key;showPersonalQuestOffer(q.key);}
   else add(`${q.title} — ${f[q.key].toUpperCase()}. Check QUESTS for your next objective.`,"system");
   return;
  }
  if(q.key==="jenQuest"&&f.jenQuest==="recovered"&&mercyLocation==="jen"&&cmd.includes("deliver jen's supply crate")){removeItem("Jen's Supply Crate");f.jenQuest="hideout";gainXp(50);add("JEN > You found the cart, but my runner is still missing. Those tracks you found point farther east, toward the abandoned checkpoint. Please check it. I would rather lose every crate than leave them there.", "bright");add("QUEST UPDATED — LAST CALL: Investigate the eastern road again.","reward");return;}
  if(q.key==="jenQuest"&&f.jenQuest==="rescued"&&mercyLocation==="jen"&&cmd.includes("deliver runner's token")){if(packSlotsUsed()>=player.packMax){add("Free a pack slot for Jen's rare reward.","system");return;}removeItem("Runner's Token");f.jenQuest="done";gainXp(180);gainBolts(35);addPack("Bluefang Hunting Knife","weapon");add("QUEST COMPLETE — LAST CALL. Jen rewards you with the RARE BLUEFANG HUNTING KNIFE.","rare");return;}
  if((cmd===`return ${q.item.toLowerCase()}`||cmd.includes(`deliver ${q.item.toLowerCase()}`))&&mercyLocation===q.npc&&f[q.key]==="recovered"&&hasItem(q.item)){
   if(q.reward&&packSlotsUsed()>=player.packMax){add("Make space in your pack before claiming this equipment reward.","system");return;}
   removeItem(q.item);f[q.key]="done";gainXp(q.xp);gainBolts(q.bolts);if(q.reward)addPack(q.reward,GEAR[q.reward].type);
   add(`QUEST COMPLETE — ${q.title}. ${q.reward?`EARNED ${gearLabel(q.reward)}. `:""}+${q.xp} XP, +${q.bolts} BOLTS.`,"reward");return;
  }
 }

  if(mercyLocation==="johnny"&&player.flags.solaceMenu==="purchaseComplete"){
    if(cmd==="continue shopping"){johnnyShop();return;}
    if(cmd==="return to town"||cmd==="town"||cmd==="back"||cmd==="b"){mercyLocation="town";mercyMenu();return;}
    showPurchaseComplete();return;
  }
  if(mercyLocation==="wayne" && cmd.includes("old house")){offerHouseQuest();npcTalk("wayne");return;}
  if(mercyLocation==="johnny" && player.flags.relayPartsRevealed && (cmd.includes("relay")||cmd.includes("regulator"))){ if(!ensureRelayParts().johnny){ add("JOHNNY > That old thing? Yeah, I've got one under the counter somewhere.","bright"); add("Johnny digs through a crate, produces a dust-covered power regulator, and drops it into your hands."); add("JOHNNY > Take it. Seriously. You've improved my inventory by removing it.","bright"); awardRelayPart("johnny","POWER REGULATOR"); } else add("JOHNNY > Already gave you the only one I had. You're welcome twice, apparently.","bright"); johnnyShop(); return; }
  // B is reserved for Back. Buying drinks uses the numbered local action.
  if(mercyLocation==="jen" && cmd==="g") cmd="gamble";
  if(mercyLocation==="jen" && cmd==="r") cmd="room";
  if(mercyLocation==="jen" && (cmd==="buy drinks"||cmd==="drinks")){showDrinkMenu();return;}
  if(mercyLocation==="jen" && cmd==="gamble"){showGambleMenu();return;}
  if(mercyLocation==="jenGames"){ if(cmd==="b"||cmd==="back"){mercyLocation="jen";showBarActions();return;} if(cmd==="d"||cmd.includes("dice")){mercyLocation="dice";add("PICK 1   PICK 2   PICK 3   PICK 4   PICK 5   PICK 6   (B) BACK","system");return;} add("DICE   (B) BACK","system");return;}
  if(mercyLocation==="jenDrinks"){
    if(cmd==="b"||cmd==="back"){mercyLocation="jen";showBarActions();return;}
    const d=R11_DRINKS[cmd.split(" — ")[0]];
    if(d){Economy.drink(d);showDrinkMenu();return;}
    add("That's not an option.","system"); showDrinkMenu(); return;
  }
  if(player.flags.pendingQuest){
    if(cmd.includes("accept")||cmd.includes("look for")){const q=player.flags.pendingQuest; player.flags[q+"Quest"]="active"; player.flags[q+"QuestSteps"]=0; player.flags.pendingQuest=""; add(q==="tim"?"LEAD ADDED — THE OLD BADGE":"LEAD ADDED — ONE GOOD BELT","reward"); add("Check QUESTS anytime to review ACTIVE and COMPLETED objectives.","system"); return;}
    if(cmd.includes("decline")){player.flags.pendingQuest="";add("Maybe another time.","system");return;}
  }
  if((cmd.includes("talk to tim")||cmd==="talk tim"||cmd==="tim") && player.flags.timQuest==="found" && hasItem("Tim's Old Badge")){removeItem("Tim's Old Badge");player.flags.timQuest="done";add("Tim turns the badge over in his palm for a long moment.");add(`TIM > Thought I'd lost this part of myself for good. Thanks, ${player.handle}.`,"bright");add("QUEST COMPLETE — THE OLD BADGE","place");gainXp(120);gainBolts(30);return;}
  if((cmd.includes("talk to murphy")||cmd==="talk murphy"||cmd==="murphy") && player.flags.murphyQuest==="found" && hasItem("Usable Serpentine Belt")){removeItem("Usable Serpentine Belt");player.flags.murphyQuest="done";add("Murphy bends the belt, checks the ribs, then actually smiles.");add("MURPHY > That's one good belt. Knew there had to be one left out there.","bright");add("QUEST COMPLETE — ONE GOOD BELT","place");gainXp(120);gainBolts(35);if(!hasItem("Reinforced Work Vest")&&player.armor!=="Reinforced Work Vest")addPack("Reinforced Work Vest","armor");return;}
  // Match only displayed personal stock, never stale hard-coded items.
  if(mercyLocation==="johnny" && cmd.startsWith("buy ")){ensureVendorStock();const wanted=cmd.slice(4).trim();const item=["Energy Bars","Bandage","Tent","Battered Flashlight",...player.vendorStock].find(x=>x.toLowerCase()===wanted || (x==="Energy Bars"&&wanted==="energy bar"));if(item){buyJohnny(item);return;}add("JOHNNY > I don't have that today.","system");johnnyShop();return;}
  if(mercyLocation==="wayne" && cmd.includes("buy") && cmd.includes("bandage")){ if(player.bolts<8){add("WAYNE > Eight Bolts. Medicine is cheaper than bleeding to death.","system");return;} if(packSlotsUsed()>=player.packMax && !hasItem("Bandage")){add("Your pack is full.","system");return;} player.bolts-=8; updateHud(); addPack("Bandage","consumable"); add("WAYNE > Try using it before you can see bone.","bright"); return; }
  if(cmd.includes("sell") && cmd.includes("scrap")){ const it=findItem("Scrap Metal"); if(!it){add("JOHNNY > You're trying to sell me scrap you don't have. Bold strategy.","system");return;} const qty=cmd.includes("all")?it.qty:1; removeItem("Scrap Metal",qty); player.bolts+=4*qty; updateHud(); add(`+${4*qty} BOLTS`, "reward"); add(`JOHNNY > ${qty} scrap. Fair enough.`); if(mercyLocation==="johnny")johnnyShop(); return; }
  if(cmd.includes("inspect") && (cmd.includes("corvette")||cmd.includes("photo")) || cmd.includes("about corvette")){ add("You step closer to the faded photograph. A bright blue Corvette sits under a sky that looks almost impossibly clean."); add("Murphy glances over and smiles. MURPHY > Blue Corvette. That's what cars were supposed to look like.","bright"); return; }
  if(cmd.includes("upgrade") || cmd.includes("about equipment")){ add("MURPHY > My workbench is open for learned recipes. Use CRAFTING RECIPES to see what you can make.","system"); return; }
  if(mercyLocation==="wayne" && (cmd.includes("treat") || cmd.includes("heal"))){Economy.treat();return;}

  if(cmd.startsWith("deposit")){const m=cmd.match(/\d+/);v48BankMoney('deposit',cmd.includes('all')?player.bolts:m?Number(m[0]):0);return;}
  if(cmd.startsWith("withdraw")){const m=cmd.match(/\d+/);v48BankMoney('withdraw',cmd.includes('all')?player.bankBolts:m?Number(m[0]):0);return;}
  if(cmd.startsWith("stash ")){stashItem(cmd.slice(6));return;} if(cmd.startsWith("retrieve ")){retrieveItem(cmd.slice(9));return;}
  if(cmd==="view stash"||cmd==="stash"){add("SECURE STASH","place");if(!player.stash.length)add("EMPTY","system");else player.stash.forEach((i,n)=>add(`[${n+1}] ${i.name}${i.qty>1?` ×${i.qty}`:""}`));showBankActions();return;}

  if(cmd.includes("talk to jen")||cmd==="talk jen"){npcTalk("jen");return;} if(cmd.includes("talk to johnny")||cmd==="talk johnny"){npcTalk("johnny");return;} if(cmd.includes("talk to murphy")||cmd==="talk murphy"){npcTalk("murphy");return;} if(cmd.includes("talk to wayne")||cmd==="talk wayne"){npcTalk("wayne");return;} if(cmd.includes("talk to amii")||cmd==="talk amii"){npcTalk("amii");return;} if(cmd.includes("talk to tim")||cmd==="talk tim"){npcTalk("tim");return;}
  if(mercyLocation==="tim" && ["1","about solace","solace"].includes(cmd)){add("TIM > Solace started as a fuel stop, then a camp. Somebody built a wall and we started calling it home.","bright");npcTalk("tim");return;}
  if(mercyLocation==="tim" && ["2","work"].includes(cmd)){add("TIM > Two leads: Terrible Billy, and trouble at the old house. Billy has been hitting travelers east of the fork. Bring me proof he will not do it again.","bright");add(`${player.flags.timHouseBounty?`TROUBLE AT THE OLD HOUSE — ${String(player.flags.timHouseBounty).toUpperCase()}`:"ACCEPT TROUBLE AT THE OLD HOUSE"}   ${player.flags.terribleBillyBounty?`TERRIBLE BILLY — ${String(player.flags.terribleBillyBounty).toUpperCase()}`:"ACCEPT TERRIBLE BILLY CONTRACT"}` ,"system");npcTalk("tim");return;}
  if(mercyLocation==="tim" && (cmd.includes("accept trouble at the old house")||cmd==="trouble at old house")){if(!player.flags.timHouseBounty){player.flags.timHouseBounty="active";add("BOUNTY ACCEPTED — TROUBLE AT THE OLD HOUSE. Find the occupied house north of Solace, defeat the squatter, and bring proof to Tim.","reward");}else add(`TIM > That contract is already ${String(player.flags.timHouseBounty).toUpperCase()}.`,"system");npcTalk("tim");return;}
  if(mercyLocation==="tim" && (cmd.includes("accept terrible billy")||cmd==="terrible billy"||cmd==="billy contract")){if(!player.flags.terribleBillyBounty){player.flags.terribleBillyBounty="active";add("BOUNTY ACCEPTED — TERRIBLE BILLY. Find him on the road and use HUNT TERRIBLE BILLY while traveling to confront him.","reward");}else add(`TIM > That contract is already ${String(player.flags.terribleBillyBounty).toUpperCase()}.`,"system");npcTalk("tim");return;}
  if(mercyLocation==="tim" && ["3","bounties","view bounties","about bounties"].includes(cmd)){v52WantedBoard();npcTalk("tim");return;}
  if(mercyLocation==="tim" && ["4","collect bounty"].includes(cmd)){if(player.flags.timHouseBounty==="proof"){player.flags.timHouseBounty="done";gainXp(100);gainBolts(75);updateHud();add("TIM > That's proof enough. The old house is clear.","bright");add("BOUNTY COMPLETE — TROUBLE AT THE OLD HOUSE. +100 XP, +75 BOLTS.","reward");}else if(player.flags.terribleBillyBounty==="proof"){player.flags.terribleBillyBounty="done";gainXp(140);gainBolts(100);updateHud();add("TIM > Billy won't be hunting travelers again. You did good.","bright");add("BOUNTY COMPLETE — TERRIBLE BILLY. +140 XP, +100 BOLTS.","reward");}else add("TIM > Bring me proof from an active bounty contract. The board is informational; it doesn't pay out by itself.","system");npcTalk("tim");return;}
  if(mercyLocation==="tim" && ["5","pay off bounty"].includes(cmd)){if(typeof v52PayFine==="function")v52PayFine();else add("Bounty settlement is unavailable.","system");npcTalk("tim");return;}
  if(mercyLocation==="tim" && ["6","relay station","ask about relay station","about relay station"].includes(cmd)){askAboutRelay("tim");return;}
  if(mercyLocation==="tim" && ["7","never mind","back"].includes(cmd)){mercyLocation="town";mercyMenu();return;}
  if(cmd==="small talk"||cmd==="smalltalk"){
    const who=["jen","johnny","murphy","wayne","amii","tim"].includes(mercyLocation)?mercyLocation:null;
    if(who){ smallTalk(who); return; }
    add("Talk to someone first.","system"); return;
  }
  for(const n of ["jen","johnny","murphy","wayne","amii","tim"]){if(cmd.includes("small talk")&&cmd.includes(n)){smallTalk(n);return;}}

  if(mercyLocation==="relay" && cmd==="claim relay reward"){
    if(!player.flags.relayEquipmentReward||player.flags.relayEquipmentReward.claimed)add("No pending Relay equipment reward.","system");
    else if(claimRelayEquipment())saveGame(activeSaveSlot);showRelayChoices();return;
  }
  if(cmd.includes("relay")){ const who=["jen","murphy","tim"].includes(mercyLocation)?mercyLocation:null; if(who){askAboutRelay(who);return;} if(player.flags.relayUnlocked){enterRelayStation();return;} add("Ask someone in Solace about the Relay Station.","system"); return; }
  if(cmd.includes("rumor")){add("JEN > Travelers brought stories of tribute collectors south of the Factory. Stories travel faster than proof. Murphy blamed raiders; Wayne said guessing would not patch anyone up.","bright");return;}
  // Jen's two additional side quests use per-character flags, explicit costs, and journal-visible state.
  if(mercyLocation==="jen" && (cmd.includes("unpaid tab")||cmd.includes("settle tab"))){
    if(!f.jenUnpaidTab){f.jenUnpaidTab="active";add("JEN > One regular left a 12-Bolt tab. Cover it and I can close that account against my relief fund. There is a twenty-Bolt allowance for settling it, including your trouble.","bright");add("QUEST ACCEPTED — UNPAID TAB. Choose SETTLE UNPAID TAB when ready.","reward");}
    else if(f.jenUnpaidTab==="active"&&(cmd.includes("settle")||cmd.includes("pay"))){if(player.bolts<12){add("You need 12 Bolts to settle the tab.","system");return;}player.bolts-=12;f.jenUnpaidTab="done";gainBolts(20);gainXp(25);updateHud();add("QUEST COMPLETE — UNPAID TAB. The books balance. +25 XP, +8 net Bolts.","reward");}
    else add(`UNPAID TAB — ${String(f.jenUnpaidTab).toUpperCase()}.`,"system");
    npcTalk("jen");return;
  }
  if(mercyLocation==="jen"&&(cmd.includes("familiar face")||cmd.includes("tell jen about the familiar"))){
    if(!f.jenFamiliarFace){f.jenFamiliarFace="active";add("JEN > My old friend Vale passed the south gate. Patched green coat, silver ring on her left hand, always carrying that map. If you see her, tell me how she is doing.","bright");add("QUEST ACCEPTED — A FAMILIAR FACE.","reward");}
    else if(f.jenFamiliarFace==="active"&&cmd.includes("tell")){
      if(!storyHasValeEvidence()){add("JEN > You have not seen Vale yet. Look for the green coat and silver ring; I need news, not a guess.","bright");npcTalk("jen");return;}
      f.jenFamiliarFace="done";gainXp(30);gainBolts(10);updateHud();
      add(player.wandererState?.Vale?.dead?"JEN > Vale did not make it? I needed to know. Thank you for telling me the truth.":"JEN > That is Vale, all right. Thank you for bringing me news of her.","bright");
      add("QUEST COMPLETE — A FAMILIAR FACE. +30 XP, +10 BOLTS.","reward");
    }
    else add(`A FAMILIAR FACE — ${String(f.jenFamiliarFace).toUpperCase()}. Jen waits for you to return with news.`,"system");
    npcTalk("jen");return;
  }
  // Jen's dialogue is handled before generic Tim-oriented topics so her responses never route to the wrong NPC.
  if(mercyLocation==="jen" && (cmd.includes("about solace")||cmd.includes("about town"))){add("JEN > Solace is a wall, a warm drink, and a dozen people pretending they're not scared. Some nights, that is enough.","bright");return;}
  if(mercyLocation==="jen" && (cmd.includes("about road")||cmd.includes("route 127"))){add("JEN > East gets rough past the overpass. If you're heading out, tell somebody where you're going. I don't want another empty stool at my bar.","bright");return;}
  if(mercyLocation==="jen" && cmd.includes("about work")){add("JEN > I keep people fed and give them somewhere to come back to. Ask about the shipment if that job is still open. When you finish a job, there is always somebody else here who needs a hand.","bright");return;}
  if(mercyLocation==="wayne" && cmd.includes("about work")){add("WAYNE > Keep people alive, keep the clinic stocked. In that order. Ask about The Last Patient to check that job; otherwise, keep an eye out for clean medical supplies.","bright");return;}
  if(mercyLocation==="wayne" && (cmd.includes("about road")||cmd.includes("route 127"))){add("WAYNE > The road is an injury that never closes. Watch for wreckage, bad footing, and anyone pretending a limp is nothing.","bright");return;}
  if(mercyLocation==="wayne" && (cmd.includes("about solace")||cmd.includes("about town"))){add("WAYNE > Solace is safer than the road, not safe. Keep your wounds clean and your Bolts where you can find them.","bright");return;}
  if(cmd.includes("about deals")){add("JOHNNY > Deals change. If I have something cheap today, buy it today. Tomorrow I may come to my senses.","bright");return;}
  if(cmd.includes("about supplies")){add("JOHNNY > Food, tools, scrap, whatever survives the road. Bring me something useful and I'll make us both pretend the price was fair.","bright");return;}
  if(mercyLocation==="murphy" && player.flags.relayPartsRevealed && cmd.includes("relay") && cmd.includes("part")){ add("MURPHY > Four failures? Figures. Check the Scrap Yard for an antenna servo. County gear used the same mounts. Johnny hoards old regulators. And those lower utility roads near the fork used shielded couplers.","bright"); npcTalk("murphy"); return;}
  if(cmd.includes("about workshop")){add("MURPHY > Anything mechanical comes through here eventually. Sometimes it even leaves better than it arrived.","bright");return;}
  if(cmd.includes("about cars")){add("MURPHY > Before all this? Cars were freedom. Now they're shelter, parts, or trouble. Still love 'em.","bright");return;}
  if(cmd.includes("about injuries")){add("WAYNE > Clean it, close it, don't be stupid twice. That's most field medicine.","bright");return;}
  if(cmd.includes("about banking")){add("AMII > Carried Bolts can disappear out there. Bolts in here don't. Niko and Alex are part of the interest rate.","bright");return;}
  if(cmd.includes("niko")||cmd.includes("alex")){add("Niko thumps his tail immediately. Alex watches for another second before finally doing the same. AMII > See? Friendly. Eventually.","bright");return;}
  if(cmd.includes("about work")){add("TIM > There'll be work. Route 127 keeps inventing new problems. Check the board and talk to people.","bright");return;}
  if(cmd.includes("about tim")){add("TIM > Not much to tell. I was here when Solace needed somebody to keep track of things. Apparently I forgot to stop.","bright");return;}
  if(cmd.includes("about mercy")||cmd.includes("about solace")){add("TIM > Started as a fuel stop. Then a camp. Then somebody built a wall and suddenly we had opinions about zoning.","bright");return;}
  if(cmd.includes("about road")||cmd.includes("route 127")){add("TIM > The southern road reaches the Factory. Beyond that is the coast, if the overpass is passable. Traders used to bring food back that way. Find out what you can, but come back alive.","bright");return;}
  if(mercyLocation==="jen" && (cmd==="beer"||cmd==="buy beer")){Economy.drink(R11_DRINKS["beer"]);return;}
  if(mercyLocation==="jen" && (cmd==="shot"||cmd==="buy shot")){Economy.drink(R11_DRINKS["shot"]);return;}
  if(mercyLocation==="jen" && (cmd==="house special"||cmd==="buy house special")){Economy.drink(R11_DRINKS["house special"]);return;}
  if(['jenRoom','jenRoomChest'].includes(mercyLocation)){handleInnRoom(cmd);return;}
  if(mercyLocation==="jen" && ["rent room","buy room","room"].includes(cmd)){
    if(!player.flags.rustyRoomOwned){if(player.bolts<2000){add('JEN > A room of your own costs 2000 Bolts.','system');return;}player.bolts-=2000;player.flags.rustyRoomOwned=true;updateHud();add('ROOM PURCHASED — 2000 BOLTS','reward');}
    mercyLocation='jenRoom';add('THE RUSTY LANTERN','place');add(`${player.name||'PLAYER'}'S ROOM`,'place');add('REST   CHEST   LOOK AROUND   RETURN','system');return;
  }
  if(mercyLocation==="jen" && cmd==="gamble"){ mercyLocation="dice"; add("DICE TABLE","place"); add("You walk over to a smoke-hazed table in the back corner. Two wastelanders are throwing battered dice against an overturned ammo tin."); add('One looks up. "Bolts talk. Pick a number."',"bright"); add("PICK 1   PICK 2   PICK 3   PICK 4   PICK 5   PICK 6   LEAVE TABLE","system"); return; }
  if(mercyLocation==="dice"){
    if(cmd==="b"||cmd==="back"||cmd.includes("leave")){mercyLocation="jen";add("You step away from the dice table and return to the bar.");showBarActions();return;}
    let pick=(cmd.match(/[1-6]/)||[])[0]; if(!pick){add("PICK 1   PICK 2   PICK 3   PICK 4   PICK 5   PICK 6   LEAVE TABLE","system");return;} player.flags.dicePick=Number(pick); add(`YOUR PICK: ${pick}`); add("WAGER 1 BOLT   WAGER 5 BOLTS   WAGER 10 BOLTS   (B) BACK","system"); mercyLocation="diceBet"; return;
  }
  if(mercyLocation==="diceBet"){
    if(cmd==="b"||cmd==="back"||cmd.includes("leave")){mercyLocation="jen";add("You step away from the dice table and return to the bar.");showBarActions();return;}
    const m=cmd.match(/(?:^|\s)(1|5|10)(?:\s|$)/); if(!m){add("WAGER 1 BOLT   WAGER 5 BOLTS   WAGER 10 BOLTS   (B) BACK","system");return;} const bet=Number(m[1]); if(player.bolts<bet){add("Not enough Bolts for that wager.","system");return;} player.bolts-=bet; const roll=1+Math.floor(Math.random()*6); add(`DIE: ${roll}`); add(`YOUR PICK: ${player.flags.dicePick}`); if(roll===player.flags.dicePick){const payout=bet*6;player.bolts+=payout;add(`WIN — +${payout-bet} BOLTS NET`,"reward");}else add(`LOSS — ${bet} BOLTS`,"danger"); updateHud(); add("PLAY AGAIN   LEAVE TABLE","system"); mercyLocation="diceAgain"; return;
  }
  if(mercyLocation==="diceAgain"){if(cmd==="b"||cmd==="back"||cmd.includes("leave")){mercyLocation="jen";add("You step away from the dice table and return to the bar.");showBarActions();return;} if(cmd.includes("play")||cmd==="p"){mercyLocation="dice";add("PICK 1   PICK 2   PICK 3   PICK 4   PICK 5   PICK 6   LEAVE TABLE","system");return;} add("PLAY AGAIN   LEAVE TABLE","system");return;}

  if((cmd==="relay station"||cmd==="relay") && player.flags.relayUnlocked){enterRelayStation();return;}
  if(mercyLocation==="relay" && (cmd.includes("install")||cmd.includes("stabilize")||cmd.includes("repair"))){
    if(relayPartCount()<4){add(`RELAY REPAIR INCOMPLETE — ${relayPartCount()}/4 COMPONENTS RECOVERED`,"system");return;}
    if(player.flags.relayQuest==="complete"){add("The Relay connection is already stable.","system");return;}
    player.flags.relayQuest="complete";
    gainXp(150);
    awardRelayEquipment();
    add("RELAY STATION — CONNECTION STABILIZED","reward");
    add("You fit the four salvaged components into their housings. One by one, the dead meters wake.");
    add("A steady green line crosses the monitor. For the first time, the station holds its signal.");
    add("WOMAN'S VOICE > You did it. Solace can hear us again.","woman");
    add("UNKNOWN > We have lost contact with Seaport. Its harbor kept supplies moving between settlements. Without it, Solace is living on what it has left.","woman");
    add("SECOND VOICE > The Factory south of Solace once supplied our equipment. Its terminal kept a local copy of Seaport's last transmission, beyond what this Relay can recover.","woman");
    add("UNKNOWN > Find Forge in the entrance workshop. He was one of our engineers. Read the terminal with him and find out what cut Seaport off before the same thing reaches Solace.","woman");
    syncFactoryQuest();
    saveGame(activeSaveSlot);
    add("MAIN QUEST COMPLETE — THE RELAY STATION","reward");
    add("MAIN OBJECTIVE — THE FACTORY / STATUS: ACTIVE","system");
    add("NEXT: Follow Solace's southern road to the Factory and enter Forge's workshop. The Relay stays online if you need to contact us again.","system");
    showRelayChoices();return;
  }
  if(mercyLocation==="relay" && player.flags.relayQuest==="complete" && (cmd==="t"||cmd.includes("talk")||cmd.includes("contact")||cmd.includes("monitor")||cmd.includes("project")||cmd.includes("factory"))){add("TOMORROW PROJECT — CONNECTION ACTIVE","place");add("UNKNOWN > The Relay is holding. Solace can send warnings again; keep that line open as you follow the Seaport lead.","woman");add("SECOND VOICE > Forge and the Factory's terminal are your next sources. We can carry messages, but we cannot see what you find there. Check their latest information before heading farther east.","woman");add("The monitor remains on. You can contact the group again.","system");showRelayChoices();return;}
  if(mercyLocation==="relay" && player.flags.relayQuest==="complete" && cmd.includes("inspect")){add("All four repaired systems are operating normally. The monitor remains online.","system");showRelayChoices();return;}
  if(mercyLocation==="relay" && cmd.includes("inspect")){
    if(cmd.includes("monitor")){add("The monitor is dead again. A faint ozone smell hangs around the vents. A signal-conditioning board behind the display is scorched beyond repair.");add("You remember the pre-collapse communications equipment at the Factory crossroads south of Solace.","bright");inspectRelaySystem("monitor");showRelayChoices();return;}
    if(cmd.includes("console")){add("The main console has power in fits and starts. The old POWER REGULATOR is cooked; SIGNAL STABILITY never rises above the bottom quarter.");add("Johnny keeps shelves of obsolete electronics. If anyone in Solace has one, he might.","bright");inspectRelaySystem("console");showRelayChoices();return;}
    if(cmd.includes("antenna")){add("A bank of antenna controls is frozen halfway through calibration. The ANTENNA SERVO has seized solid.");add("You passed old motor assemblies at the Scrap Yard beyond Works Junction.","bright");inspectRelaySystem("antenna");showRelayChoices();return;}
    if(cmd.includes("cable")){add("Most of the cable is brittle but intact, but the SHIELDED FEED COUPLER has burned through at the wall.");add("A faded service diagram marks the signal cabinet on Old Service Road, west of Works Junction.","bright");inspectRelaySystem("cables");showRelayChoices();return;}
  }
  if(cmd==="gate"||cmd==="west gate"||cmd==="leave solace"||cmd==="solace gate"){mercyLocation="gate";add("SOLACE — WEST GATE","place");v48Intro("westgate",[["Route 127 runs west toward the old house and the service-road fork."]],"The west gate opens onto the familiar road.",true);add("HEAD WEST — OLD HOUSE   (B) BACK","system");return;}
  if(cmd==="g") cmd="east gate";
  if(cmd==="e" && mercyLocation==="town") cmd="west gate";
  if(cmd==="east gate"){mercyLocation="eastGate";player.flags.eastRouteDiscovered=true;add("SOLACE — EAST GATE","place");v48Intro("eastgate",[["Beyond the barricade, Route 127 continues through country Solace patrols only when it has to."]],"The east gate faces the road toward the Factory.",true);add("HEAD EAST — FACTORY / SIGNAL-CONDITIONING MODULE (6 TURNS)   (B) BACK","system");return;}
  if(mercyLocation==="gate" && (cmd.includes("head west")||cmd.includes("old house")||cmd==="west"||cmd==="h")){startRoadTrip("house",9);return;}
  if(mercyLocation==="eastGate" && (cmd.includes("head east")||cmd==="east"||cmd==="h")){ startRoadTrip("east",6); return; }
  if(cmd.includes("stay in mercy")){mercyLocation="town";mercyMenu();return;}
  if(cmd==="b"||cmd==="back"){ if(mercyLocation==="jen" && player.flags.jenInDialogue){showBarActions();return;} if(mercyLocation==="jenTalk"){mercyLocation="jen";showBarActions();return;} if(["jenDrinks","jenGames"].includes(mercyLocation)){mercyLocation="jen";showBarActions();return;} if(["jen","murphy","johnny","wayne","amii","relay","gate","eastGate"].includes(mercyLocation)){player.flags.v49MurphyMenu="";mercyLocation="town";mercyMenu();return;} }
  if(cmd==="t"||cmd==="town"||cmd==="solace"||cmd==="return to town"||cmd.includes("main street")){mercyLocation="town";mercyMenu();return;}
  if(cmd==="j" && mercyLocation==="jen"){npcTalk("jen");return;}
  if(cmd==="bar"||cmd==="jen's bar"||cmd==="visit bar"){mercyLocation="jen";add("THE RUSTY LANTERN TAVERN","place");showWanderersAt("jen");if(!player.flags.visited_jen){player.flags.visited_jen=true;add("Warm light leaks through patched windows. The room smells like wood smoke and something almost resembling dinner.");add("Jen is short, warm, and easy to talk to—the kind of person who makes a hard place feel less hard.");add("As she reaches for a glass, you catch a glimpse of a tiny ladybug tattoo near her wrist.");add("JEN > First one's water. You look like you need it more than anything stronger.","bright");}else{add("JEN > Back again? What can I get you?", "bright");}showBarActions();return;}
  if(cmd==="trader"||cmd==="trading post"||cmd==="johnny"){mercyLocation="johnny";add("JOHNNY'S TRADING POST","place");showWanderersAt("johnny");if(!player.flags.visited_johnny){player.flags.visited_johnny=true;add("Shelves made from old road signs hold food, tools, ammunition, and objects whose original purpose is no longer obvious.");add("Johnny looks over your pack with the practiced grin of a man already working out three different ways to make a deal.");add("JOHNNY > I'll buy almost anything. Sell almost anything too. And lucky for you, today I happen to be feeling generous.","bright");add("JOHNNY > Generous-ish.","bright");}else{add("JOHNNY > Back for another deal?", "bright");}johnnyMainMenu();return;}
  if(cmd==="workshop"||cmd==="murphy"){player.flags.v49MurphyMenu="";player.flags.solaceMenu="workshop";mercyLocation="murphy";add("MURPHY'S MOTOR WORKS","place");showWanderersAt("murphy");if(!player.flags.visited_murphy){player.flags.visited_murphy=true;add("The shop looks chaotic until you notice every tool is exactly where Murphy expects it to be.");add("A faded photograph of a bright blue Corvette is pinned above his workbench, remarkably clean compared with everything around it.");add("MURPHY > Let's see what survived the trip with you.","bright");add("He checks your equipment and gives an approving little shrug. MURPHY > Ugly. Reliable. I respect that.");}else{add("MURPHY > Back again? What needs fixing?", "bright");}murphyMainMenu();return;}
  if(cmd==="clinic"||cmd==="wayne"){player.flags.solaceMenu="clinic";mercyLocation="wayne";add("LAST CHANCE CLINIC","place");showWanderersAt("wayne");if(!player.flags.visited_wayne){player.flags.visited_wayne=true;add("Clean bandages, boiled instruments, labeled jars. Someone here knows what they're doing.");add("A tiny word has been scratched into the underside of one metal shelf: SEX.","system");add("Wayne notices you noticing it and says absolutely nothing.");add(`WAYNE > You're at ${player.hp}/${player.maxHp} HP. I've seen worse. Usually attached to smarter decisions.`,"bright");}else{add("WAYNE > Try not to bleed on the floor.", "bright");}add("TREAT WOUNDS — 2% MAX HP PER BOLT (MIN 5)   BUY BANDAGE — 8 BOLTS   BUY   SELL ITEMS   SMALL TALK WAYNE   TOWN","system");return;}
  if(cmd==="bank"||cmd==="bank stash"||cmd==="amii"||cmd.includes("visit bank")){bankMenu();return;}
  if(cmd.startsWith("post ")){postToBulletinBoard(raw.trim().slice(5));return;}
  if(cmd==="post"){postToBulletinBoard("");return;}
  if(cmd.includes("bulletin")||cmd==="board"||cmd==="read board"){showBulletinBoard();return;}
  if(cmd==="tim"||cmd.includes("find tim")){npcTalk("tim");return;}
  add("Solace is busy around you.","system");
  if(mercyLocation==="town") mercyMenu(); else { add("(T) RETURN TO TOWN","system"); }
}
function showStandingOptions(){
  const opts=[];
  if(!player.flags.houseBandage) opts.push("CHECK CABINET");
  if(!player.flags.roomSearched) opts.push("SEARCH ROOM");
  opts.push("CHECK PACK","INSPECT COMPUTER");
  const labels=[]; if(opts.includes("CHECK CABINET"))labels.push("(C) CHECK CABINET"); if(opts.includes("SEARCH ROOM"))labels.push("(S) SEARCH ROOM"); labels.push("(H) CHECK PACK","(I) INSPECT COMPUTER");
  // Choice redraws are state, not narrative. Render them synchronously so a
  // completed action can never hand control back before its remaining choices exist.
  numberedChoices={};currentHotkeys={};addImmediate(hotkeyLine(labels.join("   ")),"system");
  followOutput();
}
function localInspectionShortcuts(){return stage==="eastEnd" || (["serviceRoad","relayBranch"].includes(stage)&&serviceRoadDepth<=2);}
function refreshInterfaceShortcutLabels(){
  const local=localInspectionShortcuts(),combat=stage==="combat",blocked=stage==="combatItems";
  const buttons=[["status","S"],["inventory","I"],["map","M"],["quests","Q"],["save current","V"]];
  buttons.forEach(([cmd,key],i)=>{
    const button=document.querySelector(`#utility-panel button:nth-of-type(${i+1})`);if(!button)return;
    const label=cmd==="inventory"&&combat?"USE ITEM":cmd.toUpperCase();
    button.textContent=blocked||(local&&["S","I"].includes(key))?label:`(${key}) ${label}`;
    button.disabled=blocked;
    if(button.dataset)button.dataset.command=cmd==="inventory"&&combat?"use item":cmd;
  });
}
function showInterfaceNav(){if(stage==="interfaceMap"){outputQueue=outputQueue.then(()=>{currentHotkeys.b="back";addImmediate("(B) BACK   (S) STATUS   (I) INVENTORY   (M) MAP   (Q) QUESTS   (V) SAVE","system");followOutput();});return;}if(player.flags.interfaceUnlocked)add(`${localInspectionShortcuts()?"":"(S) STATUS   (I) INVENTORY   "}(M) MAP   (Q) QUESTS   (V) SAVE`,"system");}
function openInterface(which){
  if(which==='inventory'&&typeof combatState!=='undefined'&&combatState?.r18Bare){add('No inventory use during a bare-knuckle match.','system');return false;}
  if(!player.flags.interfaceUnlocked) return false;
  if(stage!=="port55Pets"&&stage!=="inventory"&&stage!=="inventoryItem"&&stage!=="quests"&&stage!=="interfaceStatus"&&stage!=="interfaceMap") returnStage=stage;
  if(which==="inventory"){stage="inventory";inventoryMode=null;showInventory();showInterfaceNav();return true;}
  if(which==="status"){stage="interfaceStatus";showStatus();showInterfaceNav();return true;}
  if(which==="map"){stage="interfaceMap";showMap();showInterfaceNav();return true;}
  if(which==="quests"){stage="quests";showQuests();showInterfaceNav();return true;}
  if(which==="save"){
    stage="interfaceSave"; showV49SaveMenu();
    return true;
  }
  return false;
}
function showSolaceContext(){
  if(mercyLocation==='postOffice'&&player.flags.r18Courier?.phase==='service')return r18CourierMenu();
  if(v48RenderContext())return;
  if(["casino","casinoGame","jenGames","dice","diceBet","diceAgain"].includes(mercyLocation)){if(mercyLocation==="casino"||mercyLocation==="jenGames")casinoMenu();else if(mercyLocation==="casinoGame")casinoRender();else handleCasinoCommand("redraw");return;}
  if(pendingTownFight && currentTownWanderer){add("CONFIRM FIGHT   BACK OFF","system");return;}
  if(townWandererFocus && currentTownWanderer){add(`SMALL TALK ${currentTownWanderer.toUpperCase()}   INSPECT ${currentTownWanderer.toUpperCase()}   FIGHT ${currentTownWanderer.toUpperCase()}   (T) TOWN`,"system");return;}
  if(player.flags.pendingQuestOffer)return showPersonalQuestOffer(player.flags.pendingQuestOffer);
  if(player.flags.pendingQuest){const q=player.flags.pendingQuest;add(q==="tim"?"ACCEPT — LOOK FOR TIM'S BADGE   DECLINE":"ACCEPT — LOOK FOR A BELT   DECLINE","system");return;}
  if(mercyLocation==="johnny"&&player.flags.solaceMenu==="equipment")return showEquipmentShop();
  if(mercyLocation==="johnny"&&player.flags.solaceMenu==="purchaseComplete")return showPurchaseComplete();
  if(player.flags.solaceMenu==="board" && mercyLocation==="town")return showBulletinBoard();
  if(player.flags.solaceMenu==="dialogue" && ["jen","johnny","murphy","wayne","amii","tim"].includes(mercyLocation))return npcTalk(mercyLocation);
  if(mercyLocation==="town")return mercyMenu();
  if(mercyLocation==="jen")return showBarActions();
  if(mercyLocation==="jenDrinks")return showDrinkMenu();
  if(mercyLocation==="jenGames")return showGambleMenu();
  if(mercyLocation==="dice")return add("PICK 1   PICK 2   PICK 3   PICK 4   PICK 5   PICK 6   (B) BACK","system");
  if(mercyLocation==="diceBet")return add("WAGER 1 BOLT   WAGER 5 BOLTS   WAGER 10 BOLTS   (B) BACK","system");
  if(mercyLocation==="diceAgain")return add("PLAY AGAIN   LEAVE TABLE","system");
  if(mercyLocation==="johnny")return johnnyShop();
  if(mercyLocation==="amii")return bankMenu();
  if(mercyLocation==="relay")return showRelayChoices();
  if(mercyLocation==="gate")return add("(H) HEAD WEST — OLD HOUSE   (B) BACK","system");
  if(mercyLocation==="eastGate")return add("(H) HEAD EAST — FACTORY / SIGNAL-CONDITIONING MODULE   (B) BACK","system");
  if(mercyLocation==="murphy")return player.flags.solaceMenu==="murphyTalk"?murphyTalkMenu():murphyMainMenu();
  if(mercyLocation==="wayne")return add("TREAT WOUNDS — 2% MAX HP PER BOLT (MIN 5)   BUY BANDAGE — 8 BOLTS   BUY   SELL ITEMS   SMALL TALK WAYNE   TOWN","system");
  if(mercyLocation==="tim")return npcTalk("tim");
  mercyLocation="town";mercyMenu();
}
function redrawState(){return renderCurrentChoices();}
function renderCurrentChoices(){
  numberedChoices={};currentHotkeys={};usedHotkeys=new Set();
  if(stage==="title")return titleScreen();
  if(stage==="wake")return add("(L) LOOK AROUND   (S) STAND UP","system");
  if(stage==="standing"||stage==="wakeNamed")return showStandingOptions();
  if(stage==="handle")return add("Enter your Handle. Type RANDOM for a suggestion.","system");
  if(stage==="hello")return add("TYPE SOMETHING.","system");
  if(stage==="listen")return add("LISTEN","system");
  if(stage==="savecoords")return add("LOG COORDINATES","system");
  if(stage==="confirmHandle")return add("(Y) YES   (N) CHANGE","system");
  if(stage==="confirmNewSlot")return add("(Y) YES   (N) CANCEL","system");
  if(stage==="selectNewOverwrite")return add("SAVE 1   SAVE 2   SAVE 3   CANCEL","system");
  if(stage==="confirmNewOverwrite")return add("(Y) CONFIRM OVERWRITE   (N) CANCEL   (B) BACK","system");
  if(stage==="confirmSaveOverwrite")return add("(Y) YES   (N) NO","system");
  if(stage==="r18HorseTravel")return r18HorseTravelMenu();
  if(stage==="r18Ash")return r18AshMenu();
  if(stage==="r18Tournament")return r18TournamentMenu();
  if(stage==="r18Depot")return r18DepotMenu();
  if(stage==="r18Station")return r18StationMenu();
  if(stage==="r18StationTrader")return r18StationTrader();
  if(stage==="combat")return renderCombatMenu();
  if(stage==="combatItems")return showCombatItems();
  if(stage.startsWith("factoryDungeon"))return factoryRender();
  if(stage==="turnComplete"||stage==="questRoadComplete")return completeRoadTurn();
  if(stage==="inventory"){showInventory();return showInterfaceNav();}
  if(stage==="confirmDrop")return add("(Y) CONFIRM DROP   (N) CANCEL","system");
  if(stage==="inventoryItem"){const item=findItem(inventoryMode&&inventoryMode.item);if(!item){stage="inventory";return showInventory();}return add(item.type==="weapon"||item.type==="armor"?"(E) EQUIP   (D) DROP   (B) BACK":item.name==="Battered Flashlight"?"(D) DISMANTLE   (B) BACK":item.type==="consumable"?(player.hp<player.maxHp?"(U) USE   (D) DROP   (B) BACK":"(D) DROP   (B) BACK"):["key","quest"].includes(item.type)?"(B) BACK":"(D) DROP   (B) BACK","system");}
  if(stage==="quests"){showQuests();return showInterfaceNav();}
  if(stage==="interfaceStatus"){showStatus();return showInterfaceNav();}
  if(stage==="interfaceMap"){showMap();return showInterfaceNav();}
  if(stage==="interfaceSave")return showV49SaveMenu();
  if(stage==="v49TitleConfirm")return showV49TitleConfirm();
  if(stage==="roadReady")return add("(R) ROAD — BEGIN JOURNEY","system");
  if(stage==="settlement")return add("(P) APPROACH GATE","system");
  if(stage==="house")return showHouseChoices();
  if(["houseStorage","houseDeposit","houseWithdraw"].includes(stage))return showHouseStorage(stage);
  if(stage==="eastEnd")return showFactory();
  if(stage.startsWith("factoryDungeon"))return factoryRender();
  if(stage==="factoryWorkshop")return v49FactoryRoom();
  if(["port55Vendor","port55Pets","port55Kaiden","port55Mia","port55Docks","port55Stop","port55Service","port55Recruit"].includes(stage))return port55Resume();
  if(["portRoad","seaport","portMarket","portClinic","portDocks","portWatch"].includes(stage))return portMenu();
  if(stage==="factoryTerminal")return v49Terminal();
  if(stage==="factoryForge")return v49Forge();
  if(stage==="factoryBench")return v49Workbench();
  if(stage==="serviceRoad")return add(serviceRoadChoices(),"system");
  if(stage==="relayBranch")return add(branchLandmarkChoices(),"system");
  if(stage==="fork")return add(`(C) CONTINUE TO ${roadGoal==="house"?"OLD HOUSE":"SOLACE"}   (S) CHECK SERVICE ROAD${player.flags.relayPartsRevealed?"   CHECK LOWER ACCESS ROAD":""}   (R) REVERSE DIRECTION`,"system");
  if(stage==="mercy" && mercyLocation==="johnny" && player.flags.solaceMenu==="marthaCounter" && player.flags.r18MarthaSettled)return r18MarthaMenu();
  if(stage==="mercy" && mercyLocation==="gideon" && player.flags.r18SaltWorkersFreed)return r18GideonMenu();
  if(stage==="mercy" && mercyLocation==="murphy" && player.flags.v49MurphyMenu==="recipe")return v49MurphyRecipe(player.flags.v49MurphyRecipe||"bandage");
  if(stage==="mercy" && mercyLocation==="murphy" && player.flags.v49MurphyMenu==="recipes")return v49MurphyRecipes();
  if(stage==="mercy")return showSolaceContext();
  if(stage==="encounter"){const actions=renderRoadMarkerActions();return add([encounterChoices(currentEncounter()),...actions].filter(Boolean).join("   "),"system");}
  if(stage==="wandererRoad")return add("SMALL TALK   INSPECT   FIGHT   MOVE ON","system");
  if(stage==="overnightConfirm")return add("(Y) CONFIRM   (N) CANCEL","system");
  if(stage==="zeroTurns"){
    if(!player.flags.overnightLocked)add(overnightChoices(),"system");
    return add(`SAVE CURRENT   STATUS   INVENTORY   MAP${QA_BUILD?"   TESTING":""}`,"system");
  }
  if(stage==="fallen")return add("(1) GET UP","system");
  if(stage==="testingCode"){add("Enter the access code.","system");return add("(B) CANCEL","system");}
}
async function handleCommand(raw){
  const before=v49Boundary();
  await handleCommandCore(raw);
  const after=v49Boundary();
  if(before!==after && (before||after) && !['title','v49TitleConfirm','interfaceSave'].includes(stage) && !/^load(?: |$)/i.test(raw.trim()) && ![before,after].some(x=>x==='FACTORY INTERIOR'||x==='FACTORY EXTERIOR'))v49RollingAutosave(after||`EXIT ${before}`);
  v49LiveMap();await outputQueue;await Promise.resolve();await outputQueue;
  if(!busy && !Object.keys(numberedChoices).length && !Object.keys(currentHotkeys).length && !["handle","hello","testingCode","wakeNamed","between"].includes(stage)){
    renderCurrentChoices();await outputQueue;
  }
  refreshInterfaceShortcutLabels();
}
async function handleCommandCore(raw) {
  autoFollowOutput=true;
  let cmd = raw.trim().toLowerCase();
  if(cmd==="claim equipment"||cmd==="claim equipment drop"){v555ClaimEquipmentDrop();return;}
  if(busy) return;
  if(stage==='encounter'&&player.flags.r18HoundNaming){
    if(cmd==='cancel'){delete player.flags.r18HoundNaming;add('You can name the hound when you are ready.','system');renderCurrentChoices();return;}
    const name=raw.trim().replace(/\s+/g,' ');if(!/^[\p{L}\p{N}][\p{L}\p{N} '\-]{0,23}$/u.test(name)){add('Use 1–24 letters, numbers, spaces, apostrophes or hyphens.','system');return;}
    if(!port55Owned().includes('Rescued Hound'))port55Owned().push('Rescued Hound');player.flags.r18HoundName=name;player.flags.r18HoundAdopted=true;delete player.flags.r18HoundNaming;gainXp(Math.max(8,player.level*2));add(`${name} joins your companions. Equip your hound from Manage Pets.`,'reward');completeRoadTurn();return;
  }
  if(!cmd && !["confirmNewSlot","confirmHandle"].includes(stage)){ add("> [ENTER]","bright"); renderCurrentChoices(); return; }
  if(/^\d+$/.test(cmd) && !(stage==="port55Service"&&player.flags.portStaffUI?.page==="money") && numberedChoices[cmd] && stage!=="factoryTerminal" && !(stage==="mercy" && mercyLocation==="murphy" && player.flags.v49MurphyMenu) && !["inventory","combatItems","fallen"].includes(stage) && !(stage==="mercy"&&player.flags.v49BankCustom) && !["interfaceSave","v49TitleConfirm"].includes(stage)) cmd=numberedChoices[cmd];
  if(player.flags.interfaceUnlocked && stage!=="combatItems" && !["interfaceSave","v49TitleConfirm"].includes(stage)) {
    const global={i:"inventory",inventory:"inventory",inv:"inventory",s:"status",status:"status",stats:"status",m:"map",map:"map",q:"quests",quest:"quests",quests:"quests",v:"save",save:"save","save current":"save"};
    if(global[cmd] && !(cmd==="i" && (stage==="factoryBench" || (stage==="mercy" && mercyLocation==="murphy" && player.flags.v49MurphyMenu==="recipe"))) && !(stage==="combat"&&cmd==="i") && !((stage==="eastEnd" || ((stage==="serviceRoad" || stage==="relayBranch") && serviceRoadDepth<=2)) && ["i","s"].includes(cmd))){ add(`> ${raw}`,"bright"); openInterface(global[cmd]); return; }
  }
  if(cmd==="b"&&stage==="encounter"&&!currentHotkeys.b){const exits=Object.values(numberedChoices).filter(x=>x==="back away");if(exits.length===1)cmd="back away";}
  // Opening-room shortcuts are local until the interface is actually unlocked.
  if(!player.flags.interfaceUnlocked && stage==="wake") { if(cmd==="l") cmd="look around"; else if(cmd==="s") cmd="stand up"; }
  if(!player.flags.interfaceUnlocked && stage==="standing") { const k={c:"check cabinet",s:"search room",h:"check pack",i:"inspect computer"}; if(k[cmd]) cmd=k[cmd]; }
  const interfaceStages=["inventory","inventoryItem","quests","interfaceStatus","interfaceMap","interfaceSave"];
  if(stage==="mercy" && mercyLocation!=="town" && !(mercyLocation==="relay"&&player.flags.relayQuest==="complete") && cmd==="t" && !numberedChoices[cmd]) cmd="town";
  else if(!(stage==="factoryTerminal" && /^\d+$/.test(cmd)) && !interfaceStages.includes(stage) && cmd.length===1 && currentHotkeys[cmd]) cmd=currentHotkeys[cmd].toLowerCase();
  add(`> ${raw||"[ENTER]"}`, "bright");

  if(stage==='r18Ash'){r18AshCommand(cmd);return;}
  if(stage==='r18Tournament'){r18TournamentCommand(cmd);return;}
  if(stage==='r18HorseTravel'){await r18HorseTravelCommand(cmd);return;}
  if(stage==='interfaceStatus'&&cmd==='horse travel'&&player.flags.r18HorseOwned){r18HorseTravelMenu();return;}
  if(stage==='r18Depot'){r18DepotCommand(cmd);return;}
  if(stage==='r18Station'||stage==='r18StationTrader'){r18StationCommand(cmd);return;}
  if(['manage pets','pets','pet slot'].includes(cmd) && ['inventory','inventoryItem','interfaceStatus'].includes(stage)){stage='port55Pets';port55Pets();return;}
  if(typeof port55CasinoCommand==="function"&&port55CasinoCommand(cmd))return;
  if(cmd==='read chapter one'&&player.flags.chapterOneComplete){port55FinaleText();return;}
  if(['replay harbor art','view harbor art','harbor art'].includes(cmd)&&player.flags.seaport55?.freed){port55LiberationArt(true);return;}
  if(typeof portRecruitCommand==="function"&&portRecruitCommand(cmd))return;
  if(portCommand(cmd))return;
  if(factoryCommand(cmd))return;
  if(v49FactoryCommand(cmd))return;
  if(v49MurphyCommand(cmd))return;
  // PRE-INTERFACE OPENING STATES OWN THEIR INPUT. Nothing from the later global/item
  // parsers is allowed to steal LOOK/STAND/INSPECT COMPUTER before coordinates are logged.
  if (stage === "wake") {
    if (cmd.includes("look")) {
      add("From the floor you make out broken furniture, water stains, and your pack near the dead fireplace. Across the room sits an old computer terminal. A crooked medicine cabinet hangs against one wall.");
      add("(S) STAND UP","system");
    } else if (cmd.includes("stand") || cmd.includes("get up")) {
      add("You push yourself upright. Your legs complain, but they hold.");
      askHandle();
    } else {
      add("That's not an option.","system");
      add("(L) LOOK AROUND   (S) STAND UP", "system");
    }
    return;
  }
  if(stage === "standing") {
    if(cmd.includes("cabinet")){
      if(player.flags.houseBandage) add("The cabinet is empty now.","system");
      else { player.flags.houseBandage=true; addPack("Bandage","consumable"); add("One sealed bandage survives behind a cracked bottle of antiseptic.","bright"); }
      await outputQueue; showStandingOptions();
    } else if(cmd.includes("search")&&cmd.includes("room")){
      if(player.flags.roomSearched) add("You've already picked the room clean.","system");
      else { player.flags.roomSearched=true; gainBolts(5+Math.floor(Math.random()*6)); add("Under a collapsed chair you find a small handful of usable Bolts.","bright"); }
      await outputQueue; showStandingOptions();
    } else if(cmd.includes("pack")){
      add("You open the worn pack and take stock of what survived.");
      player.pack.forEach(item=>add(`${item.name} ×${item.qty}${item.name==="Battered Flashlight"?" — battered casing, stubborn little beam":item.name==="Energy Bars"?" — enough to keep your legs moving":item.name==="Bandage"?" — clean cloth for a bad day":""}.`));
      if(!player.pack.length)add("The pack is empty.");
      add("A thick handheld GPS with a tiny green screen hangs beside the pack.");
      const [low,high]=weaponRange();add(`${player.weapon.toUpperCase()} — Damage ${low}–${high}.   ${player.armor.toUpperCase()} — Defense ${armorDefense()}.`,"system");
      await outputQueue; showStandingOptions();
    } else if(cmd.includes("computer")||cmd.includes("terminal")||cmd.includes("inspect")){
      await terminalAwakens();
    } else {
      add("That's not an option.","system");
      showStandingOptions();
    }
    return;
  }

  if(cmd==="load autosave"){loadGame("auto");return;}
  if(stage === "title") {
    if(cmd === "continue" || cmd === "load" || cmd === "load game" || cmd === "load game 01") {
      const latest=newestSave(); if(latest) loadGame(latest.slot); else { add("No save exists yet. Type SKIP INTRO for testing or NEW GAME for the full opening.", "system"); }
    } else if(cmd === "new game" || cmd === "new") {
      const empty = allSaveData().find(x=>!x.data);
      if(empty){
        pendingNewGameSlot=empty.slot; stage="confirmNewSlot";
        add("EXISTING SAVE DATA DETECTED.","bright");
        allSaveData().forEach(({slot,data})=>add(data?`SAVE ${slot} — ${(data.player&&data.player.handle)||"NO HANDLE"} — LV ${String((data.player&&data.player.level)||1).padStart(2,"0")}`:`SAVE ${slot} — EMPTY`,"system"));
        add(""); add(`Start a new game in SAVE ${empty.slot}?`,"bright"); add("(Y) YES [ENTER]    (N) CANCEL","system");
      } else {
        pendingNewGameSlot=null; stage="selectNewOverwrite";
        add("ALL SAVE SLOTS ARE OCCUPIED.","danger");
        allSaveData().forEach(({slot,data})=>add(`SAVE ${slot} — ${(data.player&&data.player.handle)||"NO HANDLE"} — LV ${String((data.player&&data.player.level)||1).padStart(2,"0")}`,"system"));
        add("Choose SAVE 1, SAVE 2, or SAVE 3 to replace, or CANCEL.","system");
      }
    } else if(/^load [123]$/.test(cmd)){ const slot=Number(cmd.slice(-1)); if(getSaveData(slot)) loadGame(slot); else add(`SAVE ${slot} is empty.`,"system"); }
    else if(cmd === "skip intro" || cmd === "skip" || (QA_BUILD && cmd === "testing")) { skipIntroForTesting(); }
    else add("Type CONTINUE, LOAD 1/2/3, NEW GAME, or SKIP INTRO.", "system");
    return;
  }
  if(stage === "confirmNewSlot") {
    if(cmd === "" || cmd === "y" || cmd === "yes" || cmd === String(pendingNewGameSlot)) { const slot=pendingNewGameSlot; pendingNewGameSlot=null; resetPlayer(); activeSaveSlot=slot; screen.innerHTML=""; stage="wake"; hud.classList.add("hidden"); utilityPanel.classList.add("hidden"); updateHud(); add(`NEW GAME — SAVE ${slot}`,"system"); await outputQueue; await intro(); }
    else if(cmd === "n" || cmd === "no" || cmd === "cancel") { pendingNewGameSlot=null; titleScreen(); }
    else add(`Press ENTER, Y, or ${pendingNewGameSlot} to start the new game; N cancels.`,"system");
    return;
  }
  if(stage === "selectNewOverwrite") {
    if(cmd === "cancel" || cmd === "n" || cmd === "no") { titleScreen(); return; }
    const m=cmd.match(/^(?:save\s*)?([123])$/);
    if(m){ pendingNewGameSlot=Number(m[1]); stage="confirmNewOverwrite"; const data=getSaveData(pendingNewGameSlot); add(`WARNING — SAVE ${pendingNewGameSlot}: ${(data&&data.player&&data.player.handle)||"NO HANDLE"}`,"danger"); add("This character’s saved progress will be replaced only after you confirm.","system"); add("(Y) CONFIRM OVERWRITE   (N) CANCEL   (B) BACK","system"); input.placeholder="Type Y to confirm, N to cancel"; }
    else add("Choose SAVE 1, SAVE 2, or SAVE 3, or CANCEL.","system");
    return;
  }
  if(stage === "confirmNewOverwrite") {
    if(cmd === "y" || cmd === "yes" || cmd === "confirm" || cmd === "confirm overwrite") {
      const slot=pendingNewGameSlot;
      if(![1,2,3].includes(slot)){ add("No save slot selected. Returning to title.","danger"); pendingNewGameSlot=null; titleScreen(); return; }
      pendingNewGameSlot=null; input.placeholder="Command";
      resetPlayer(); activeSaveSlot=slot; screen.innerHTML=""; stage="wake";
      hud.classList.add("hidden"); utilityPanel.classList.add("hidden"); updateHud();
      add(`NEW GAME — SAVE ${slot}`,"system");
      add("Old save remains stored until you explicitly save this new character.","system");
      await outputQueue; await intro();
    } else if(["n","no","cancel","b","back"].includes(cmd)) {
      pendingNewGameSlot=null; input.placeholder="Command"; titleScreen();
    } else {
      add("(Y) CONFIRM OVERWRITE   (N) CANCEL   (B) BACK", "system");
    }
    return;
  }
  if(stage === "confirmHandle"){ if(cmd===""||cmd==="y"||cmd==="yes"){player.handle=pendingHandle;pendingHandle="";updateHud();add(`The faded letters read: ${player.handle.toUpperCase()}.`,"bright");add("Still yours. That's something.");stage="standing";await outputQueue;showStandingOptions();} else if(cmd==="n"||cmd==="no"||cmd==="change"){const old=pendingHandle;pendingHandle="";stage="handle";add(`CHANGE HANDLE — current entry: ${old}`,"system");add("Enter a new Handle, or RANDOM for a suggestion.","system");} else add("(Y) YES [ENTER]   (N) CHANGE","system"); return; }
  if(stage === "handle"){ if(cmd==="random"||cmd==="autofill"){ const names=["Drifter","Rook","Rust","Crow","Hollow","Slate","Nomad","Flint"]; const h=names[Math.floor(Math.random()*names.length)]; add(`Suggested Handle: ${h}`,"bright"); add(`Type ${h} to accept, or RANDOM to reroll.`,"system"); } else setHandle(raw); return; }
  if(stage==="confirmSaveOverwrite"){ if(cmd==="y"||cmd==="yes"){const sl=pendingSaveSlot; stage=returnStage||"between"; pendingSaveSlot=sl; saveGame(sl);} else {pendingSaveSlot=null;stage=returnStage||"between";add("SAVE CANCELLED","system");redrawState();} return; }
  if(stage==="fallen"){ if(cmd==="1"||cmd==="get up"||cmd==="get"||cmd==="continue"){stage=player.flags.mercyDiscovered?"mercy":"house";mercyLocation="town";if(stage==="mercy")mercyMenu();else arriveHouse();}else add("[1] GET UP","system");return;}
  if(stage==="combatItems" && /^save(?: game)?(?: current| [123])?$/.test(cmd)){saveGame(Number((cmd.match(/[123]$/)||[])[0])||activeSaveSlot);showCombatItems();return;}
  if(stage==="combatItems" && /^load(?: game)?(?: [123])?$/.test(cmd)){loadGame(Number((cmd.match(/[123]$/)||[])[0])||activeSaveSlot);return;}
  if(["encounter","wandererRoad","turnComplete","questRoadComplete"].includes(stage)&&cmd.startsWith("search ")){
    const f=player.flags;
    const searches=[["jenQuest","cart","supply cart","recovered","Jen's Supply Crate"],["johnnyQuest","ledger","ledger","recovered","Johnny's Ledger"],["amiiQuest","deposit","satchel","recovered","Bank Satchel"],["waynePatientQuest","supplies","ambulance","recovered","Clinic Medicine"]];
    const match=searches.find(([key,status,term])=>f[key]===status&&cmd.includes(term));
    if(f.jenQuest==="raiders"&&cmd.includes("raider checkpoint")&&questRoadMarkers().some(row=>row[1]==="SEARCH RAIDER CHECKPOINT")){f.jenQuest="fight";add("LAST CALL — A raider captain blocks the checkpoint. The missing runner is tied to a railing.","danger");startCombat({name:"RAIDER CAPTAIN",level:5,hp:34,min:4,max:9,xp:45,bolts:15,end:"The captain falls. The runner is safe."},"jenBoss",false);return;}
    if(match){if(!questRoadMarkers().some(row=>row[1].toLowerCase()===cmd)){add("That clue is not at your current road position.","system");renderCurrentChoices();return;}const [key,,term,newStatus,item]=match;f[key]=newStatus;addPack(item,"quest");add(`QUEST UPDATED — Recovered ${item}. Return to Solace.`,"reward");renderCurrentChoices();return;}
  }
  if(stage==="combatItems"){ if(cmd==="b"||cmd==="back"){stage="combat";inventoryMode=null;showCurrentContext();return;} const n=parseInt(cmd,10); if(n&&inventoryMode&&inventoryMode.items[n-1]){const used=useItem(inventoryMode.items[n-1]);stage="combat";inventoryMode=null;if(used&&combatState)combatRetaliation(combatState);else showCurrentContext();return;} add("Choose an item NUMBER or (B) BACK.","system");return; }
  if(stage==="inventory"){ if(cmd==="b"||cmd==="back"||cmd==="exit"){stage=returnStage||"between";inventoryMode=null;redrawState();return;} const n=parseInt(cmd,10); const items=player.pack.filter(i=>!["key","quest"].includes(i.type)); if(n&&items[n-1]){await showInventoryItem(r18ItemLabel(items[n-1]));return;} add("Select an item NUMBER or (B) BACK.","system");return; }
  if(stage==="confirmDrop"){
    if(cmd==="y"||cmd==="yes"||cmd==="confirm drop"){dropItem(inventoryMode.item);}
    else if(cmd!=="n"&&cmd!=="no"&&cmd!=="cancel"&&cmd!=="b"&&cmd!=="back"){add("(Y) CONFIRM DROP   (N) CANCEL","system");return;}
    stage="inventory";inventoryMode=null;showInventory();showInterfaceNav();return;
  }
  if(stage==="inventoryItem"){ const name=inventoryMode&&inventoryMode.item; if((cmd==="e"||cmd==="equip") && name){ const item=findItem(name); if(item && (item.type==="weapon"||item.type==="armor"||item.type==="accessory")){ const slot=item.type,actualName=item.name,previousStolen=!!player.flags.r18EquippedStolen?.[slot]; const previous=player[slot]; const equippedFlags=player.flags.r18EquippedStolen||(player.flags.r18EquippedStolen={});equippedFlags[slot]=!!item.stolen; removeItem(r18ItemLabel(item)); player[slot]=actualName; if(slot==="accessory"||slot==="armor"){const hpDelta=(GEAR[actualName]?.maxHpBonus||0)-(GEAR[previous]?.maxHpBonus||0);player.maxHp=Math.max(1,player.maxHp+hpDelta);player.hp=Math.min(player.hp,player.maxHp);} if(previous && !addPack(previous,slot,1,true,previousStolen)){(player.stash||(player.stash=[])).push({name:previous,type:slot,qty:1,...(previousStolen?{stolen:true}:{})});add(`Previous ${slot} secured in bank storage; pack full.`,"system");} updateHud();add(`EQUIPPED — ${name}. Previous ${slot}: ${previous||"none"}.`,"reward");stage="inventory";inventoryMode=null;showInventory();showInterfaceNav();return;} add("That item cannot be equipped.","system");return;} if(cmd==="b"||cmd==="back"){stage="inventory";showInventory();showInterfaceNav();return;} if(cmd==="u"||cmd==="use"||cmd.startsWith("use ")){useItem(name);stage="inventory";inventoryMode=null;showInventory();showInterfaceNav();return;} if(name==="Battered Flashlight" && (cmd==="d"||cmd.includes("dismantle"))){dismantleItem(name);stage="inventory";inventoryMode=null;showInventory();showInterfaceNav();return;} if(cmd==="d"||cmd==="drop"||cmd.startsWith("drop ")){inventoryMode={item:name};stage="confirmDrop";add(`DROP ${name.toUpperCase()}? This cannot be undone.`,"danger");add("(Y) CONFIRM DROP   (N) CANCEL","system");return;} add(name==="Battered Flashlight"?"Choose (D) DISMANTLE or (B) BACK.":"Choose (U) USE, (D) DROP, or (B) BACK.","system");return; }
  if(stage==="v49TitleConfirm"){
    if(cmd==="1"||cmd==="save and return"){
      if(![1,2,3].includes(activeSaveSlot)){add('Choose a manual save slot before returning, or return without saving.','system');showV49TitleConfirm();return;}
      // Saving the active manual slot never changes another character's slot.
      const previous=getSaveData(activeSaveSlot);
      if(previous && previous.player?.handle && previous.player.handle!==player.handle){add('Active slot belongs to another character. Save to a correct slot first.','danger');showV49TitleConfirm();return;}
      saveGame(activeSaveSlot);if(stage==='confirmSaveOverwrite')return;v49ReturnToTitle();return;
    }
    if(cmd==="2"||cmd==="return without saving"){v49ReturnToTitle();return;}
    if(cmd==="3"||cmd==="cancel"||cmd==="b"||cmd==="back"){stage="interfaceSave";showV49SaveMenu();return;}
    showV49TitleConfirm();return;
  }
  if(stage==="interfaceSave"){
    if(cmd==="1"||cmd==="save game"||/^save(?: game)? ?[123]$/.test(cmd)){const sl=/[123]$/.test(cmd)&&cmd!=="1"?Number(cmd.slice(-1)):activeSaveSlot;stage=returnStage||"between";saveGame(sl);if(stage==="confirmSaveOverwrite")return;stage="interfaceSave";showV49SaveMenu();return;}
    if(cmd==="2"||cmd==="load game"){showV49LoadMenu();return;}
    if(cmd==="3"||cmd==="return to title screen"){stage="v49TitleConfirm";showV49TitleConfirm();return;}
    if(cmd==="4"||cmd==="b"||cmd==="back"){stage=returnStage||"between";redrawState();return;}
    if(/^load [123]$/.test(cmd)){loadGame(Number(cmd.slice(-1)));return;}
    if(cmd==="load autosave"||cmd==="a"){loadGame('auto');return;}
    showV49SaveMenu();return;
  }
  if(["quests","interfaceStatus","interfaceMap"].includes(stage)){ if(cmd==="b"||cmd==="back"){stage=returnStage||"between";redrawState();} else { if(stage==="quests")showQuests(); else if(stage==="interfaceStatus")showStatus(); else if(stage==="interfaceMap")showMap(); else add("(B) BACK — RETURN TO GAME","system"); if(stage!=="interfaceSave")showInterfaceNav(); } return; }
  if (cmd === "status" || cmd === "stats") { if(player.flags.interfaceUnlocked)openInterface("status"); else showStatus(); return; }
  if (cmd === "quests" || cmd === "quest" || cmd === "quest log") { openInterface("quests"); return; }
  if (cmd === "inventory" || cmd === "inv" || cmd === "pack") { if(stage==="combat"){add("Inventory management is unavailable during combat. Use (I) USE ITEM for consumables.","system");return;} openInterface("inventory"); return; }
  if (cmd === "map" || cmd === "road map") { openInterface("map"); return; }
  if (/^save( game)? ?[123]$/.test(cmd)) { returnStage=stage; saveGame(Number(cmd.match(/[123]$/)[0])); return; }
  if (cmd === "save" || cmd === "save game" || cmd === "save current") { returnStage=stage; saveGame(activeSaveSlot); return; }
  if (/^load( game)? ?[123]$/.test(cmd)) { loadGame(Number(cmd.match(/[123]$/)[0])); return; }
  if (cmd === "load" || cmd === "load game") { loadGame(activeSaveSlot); return; }
  if(stage==="turnComplete" || stage==="questRoadComplete"){
    if(cmd==="r"||cmd.includes("reverse")){
      if(roadGoal==="east"){
        player.flags.eastReturning=!player.flags.eastReturning;
        add(`DIRECTION CHANGED — Facing ${player.flags.eastReturning?"WEST toward SOLACE":"EAST toward THE FACTORY"}. ${player.flags.eastReturning?Math.max(1,roadTurn+1):Math.max(1,roadTripLength-roadTurn-1)} road segments remain. No turn spent.`,"bright");
        add(["(C) CONTINUE","(R) REVERSE DIRECTION",...questRoadMarkers().map(x=>x[1])].join("   "),"system");
      }else{
        roadGoal=roadGoal==="mercy"?"house":"mercy";
        roadTurn=roadTripLength-roadTurn-2;roadTurnCharged=true;
        stage="turnComplete";add(`DIRECTION CHANGED — Facing ${roadGoal==="mercy"?"EAST toward SOLACE":"WEST toward OLD HOUSE"}. ${Math.max(1,roadTripLength-roadTurn-1)} segments remain. No turn spent.`,"bright");add(["(C) CONTINUE","(R) REVERSE DIRECTION",...questRoadMarkers().map(x=>x[1])].join("   "),"system");
      }
    }
    else if(cmd==="c"||cmd.includes("continue")){advanceRoad();} else add(["(C) CONTINUE","(R) REVERSE DIRECTION",...questRoadMarkers().map(x=>x[1])].join("   "),"system"); return; }
  if(stage==="zeroTurns"){
    // QA recovery must be processed before the overnight/turn lock, even after a reload.
    if(testMode){ add("TEST MODE ACTIVE — Turns are unlimited. Type TEST OFF to restore the real counter.","reward"); stage="between"; showEncounter(); return; }
    if(player.flags.overnightLocked){ add(`OVERNIGHT STATE LOCKED — ${overnightLabel(player.flags.overnight)}`,"bright"); add(`NEXT TURN REFILL: ${refillText()}`,"system"); add(`SAVE CURRENT   STATUS   INVENTORY   MAP${QA_BUILD?"   TESTING":""}`,"system"); return; }
    const choice=cmd.includes("camp")&&cmd.includes("mine")?"minecamp":cmd==="c"||cmd.includes("camp")?"camp":cmd==="r"||cmd.includes("remain")||cmd.includes("road")?"road":cmd==="j"||cmd.includes("room")?"room":null;
    if(choice){if(choice==="minecamp"&&(!r18ExactTent("Mine-Protected Tent")||!r18MineCampAllowed())){add("A Mine-Protected Tent and an outdoor road location are required.","system");add(overnightChoices(),"system");return;}if(choice==="camp"&&!r18ExactTent("Tent")){add("MAKE CAMP REQUIRES 1 TENT. Choose REMAIN ON ROAD or a paid room in Solace.","system");add(overnightChoices(),"system");return;}if(choice==="room"&&!overnightRoomAvailable()){add("No paid room is available here.","system");add(overnightChoices(),"system");return;}
      player.flags.pendingOvernight=choice;add(`${overnightLabel(choice)}?`,"bright");add(choice==="minecamp"?"Consumes 1 Mine-Protected Tent. No overnight losses. No loot.":choice==="camp"?"Consumes 1 Tent. Low, nonzero loss risk. No loot.":choice==="room"?"Use your prepaid room. No overnight losses. No loot.":"No supplies required. Higher loss risk. No loot.","system");add("(Y) CONFIRM   (N) CANCEL","system");stage="overnightConfirm";
    }else noTurnsMenu();return;
  }
  if(stage==="overnightConfirm"){
    if(cmd==="n"||cmd==="cancel"||cmd==="no"){player.flags.pendingOvernight="";noTurnsMenu();return;}
    if(cmd==="y"||cmd==="confirm"||cmd==="yes"){if(sealOvernight(player.flags.pendingOvernight)){stage="zeroTurns";add(`LOCKED UNTIL REFILL — ${refillText()}`,"system");add("SAVE CURRENT   STATUS   INVENTORY   MAP","system");}else{stage="zeroTurns";add(overnightChoices(),"system");}return;}
    add("(Y) CONFIRM   (N) CANCEL","system");return;
  }
  if(stage==="fork"){ if(cmd==="r"||cmd.includes("reverse")){roadGoal=roadGoal==="house"?"mercy":"house";roadTurn=roadTripLength-roadTurn;roadTurnCharged=false;add(`DIRECTION CHANGED — ${roadGoal==="house"?"WEST toward OLD HOUSE":"EAST toward SOLACE"}. No turn spent.`,"bright");renderCurrentChoices();return;} if(cmd==="c")cmd="continue"; if(cmd==="s")cmd="check service road"; if(cmd.includes("lower")||cmd.includes("access")){ if(!player.flags.relayPartsRevealed){add("The Lower Access Road is not yet unlocked.","system");renderCurrentChoices();return;}if(!testMode&&player.turns<1){noTurnsMenu();return;}spendTurn();player.flags.branchReturning=false;player.flags.relayBranchDiscovered=true; stage="relayBranch"; serviceRoadDepth=1; add("LOWER ACCESS ROAD","place");v48Intro("lower_entry",[["A narrow three-segment utility road drops away from Route 127 on the opposite side of the fork."]],"You descend the familiar Lower Access Road.",true);add(branchLandmarkChoices(),"system"); return;} if(cmd.includes("service")||cmd.includes("check")){ if(!testMode && player.turns<=0){noTurnsMenu();return;}spendTurn();player.flags.branchReturning=false;serviceRoadDepth=1;stage="serviceRoad";add("SERVICE ROAD — LOWER GRADE","place");v48Intro("service_entry",[["The cracked lane climbs away from Route 127. Fresh scrape marks score the pavement."]],"You turn onto the Service Road again.",true);add(serviceRoadChoices(),"system"); } else if(cmd.includes("mercy")||cmd.includes("solace")||cmd.includes("house")||cmd.includes("continue")){ const target=cmd.includes("house")?"house":cmd.includes("solace")||cmd.includes("mercy")?"mercy":roadGoal;if(target!==roadGoal){roadGoal=target;roadTurn=roadTripLength-roadTurn;} if(!testMode&&player.turns<1){noTurnsMenu();return;}spendTurn();roadTurnCharged=true;showEncounter(); } else renderCurrentChoices(); return;}
  if(stage==="eastEnd"){
    if(cmd==="i"||cmd.includes("inspect")||cmd.includes("gate")){add("The main entrance stands open. Forge is working inside.","system");showFactory();return;}
    if(cmd==="s"||cmd.includes("search")||cmd.includes("rack")){if(player.flags.relayPartsRevealed)awardRelayPart("east","SIGNAL-CONDITIONING MODULE");else add("You find a sealed communications module, but leave it in the rack until you know what it is for.","system");showFactory();return;}
    if(cmd==="r"||cmd.includes("reverse")||cmd.includes("return")||cmd.includes("west")){rerollRoad(roadTripLength);player.flags.eastReturning=true;roadTurn=roadTripLength-1;roadTurnCharged=true;stage="turnComplete";add("DIRECTION CHANGED — WEST toward SOLACE. 6 road segments remain. No turn spent.","bright");add("(C) CONTINUE WEST   (R) REVERSE DIRECTION","system");return;}
    showFactory();return;
  }
  if(stage==="relayBranch"){ if(cmd==="f"||cmd.includes("fast return")){const cost=branchReturnCost();if(!testMode&&player.turns<cost){add(`FAST RETURN REQUIRES ${cost} TURNS.`,"danger");return;}for(let i=0;i<cost;i++)spendTurn();serviceRoadDepth=0;stage="fork";add(`FAST RETURN TO FORK — ${cost} TURN${cost===1?"":"S"} SPENT.`,"reward");renderCurrentChoices();return;} if(branchLandmark("lower",cmd))return; if(cmd==="r"||cmd.includes("walk back")||cmd==="return to fork"){
    if(!testMode&&player.turns<1){noTurnsMenu();return;}
    spendTurn();player.flags.branchReturning=true;serviceRoadDepth=Math.max(0,serviceRoadDepth-1);
    if(serviceRoadDepth===0){stage="fork";add("You climb back to the Route 127 fork.");add(`CONTINUE TO ${roadGoal==="house"?"OLD HOUSE":"SOLACE"}   CHECK SERVICE ROAD${player.flags.relayPartsRevealed?"   CHECK LOWER ACCESS ROAD":""}   (R) REVERSE DIRECTION`,"system");}
    else{add(`LOWER ACCESS ROAD — SEGMENT ${serviceRoadDepth}`,"place");add(branchLandmarkChoices(),"system");}
    return;} if(cmd==="c"||cmd.includes("continue")||cmd.includes("down")){ if(serviceRoadDepth>=3){add("The access road ends here.","system");add(branchLandmarkChoices(),"system");return;} if(!testMode&&player.turns<1){noTurnsMenu();return;}spendTurn();player.flags.branchReturning=false;serviceRoadDepth++; if(serviceRoadDepth<3){add(`LOWER ACCESS ROAD — SEGMENT ${serviceRoadDepth}`,"place");v48Intro("lower_segment_"+serviceRoadDepth,[[serviceRoadDepth===2?"The road squeezes between dead trees and a collapsed drainage wall. Fresh tool marks show somebody has scavenged here before.":"A rusted utility enclosure appears through the trees."]],"You retrace the familiar utility road.",true);add(branchLandmarkChoices(),"system");} else {add("ABANDONED SIGNAL CABINET","place");v48Intro("lower_cabinet",[["A weatherproof roadside cabinet has been ripped open. One shielded feed coupler is still bolted to the backplane."]],ensureRelayParts().branch?"The stripped cabinet stands empty now.":"The torn-open cabinet still holds the coupler.",true); if(player.flags.relayPartsRevealed)awardRelayPart("branch","SHIELDED FEED COUPLER"); else add("You don't know what you need from this hardware yet.","system");add(branchLandmarkChoices(),"system");} return;} add(branchLandmarkChoices(),"system");return;}
  if(stage==="serviceRoad"){ if(cmd==="f"||cmd.includes("fast return")){const cost=branchReturnCost();if(!testMode&&player.turns<cost){add(`FAST RETURN REQUIRES ${cost} TURNS.`,"danger");if(player.turns<=0)noTurnsMenu();return;}for(let i=0;i<cost;i++)spendTurn();serviceRoadDepth=0;stage="fork";add(`FAST RETURN COMPLETE — ${cost} TURN${cost===1?"":"S"} SPENT.`,"reward");add("THE FORK — FREE (0 TURNS)","place");renderCurrentChoices();return;} if(cmd==="e")cmd="search maintenance yard"; if(serviceRoadDepth===3 && player.flags.serviceBossDead && cmd.includes("search") && player.flags.relayPartsRevealed && !ensureRelayParts().yard){player.flags.maintenanceYardSearched=true;awardRelayPart("yard","ANTENNA SERVO");add(serviceRoadChoices(),"system");return;} if(searchServiceRoad(cmd))return; if(cmd==="r")cmd="return to fork"; if(cmd==="c")cmd="continue up road"; if(serviceRoadDepth===3 && cmd.includes("search")&&player.flags.serviceBossDead){ if(player.flags.maintenanceYardSearched && (!player.flags.relayPartsRevealed || ensureRelayParts().yard)){add("You've already searched the maintenance yard.","system");add(serviceRoadChoices(),"system");return;} player.flags.maintenanceYardSearched=true; add("You search the old motor assemblies. The Relay may need one once you know which component has failed.","system"); add(serviceRoadChoices(),"system");return;} if(cmd.includes("return")||cmd.includes("walk back")){
    if(!testMode&&player.turns<1){noTurnsMenu();return;}
    spendTurn();player.flags.branchReturning=true;serviceRoadDepth=Math.max(0,serviceRoadDepth-1);
    if(serviceRoadDepth===0){stage="fork";add("You return to the Route 127 fork. No additional intersection charge.","system");renderCurrentChoices();}
    else{add(serviceRoadDepth===1?"SERVICE ROAD — LOWER GRADE":"SERVICE ROAD — WASHOUT","place");add("You retrace one stretch of road. -1 turn.","system");add(serviceRoadChoices(),"system");}
    return;
  } if(cmd.includes("continue")||cmd.includes("up road")){if(serviceRoadDepth>=3&&player.flags.serviceBossDead){add("The enclosure ends at the Scrap Yard fence.","system");add(serviceRoadChoices(),"system");return;}if(!testMode && player.turns<=0){noTurnsMenu();return;}spendTurn();player.flags.branchReturning=false; if(serviceRoadDepth<2){serviceRoadDepth=2;add("SERVICE ROAD — WASHOUT","place");v48Intro("service_washout",[["The lane bends around a washed-out culvert. Tire ruts vanish into weeds, then reappear beside an old county equipment fence."]],"You pass the washed-out culvert again.",true);add(serviceRoadChoices(),"system");return;} serviceRoadDepth=3;if(player.flags.serviceBossDead){add(player.flags.relayPartsRevealed&&!ensureRelayParts().yard?"The Yardman is gone. The motor assemblies needed for the Relay are still here. SEARCH MAINTENANCE YARD to recover the antenna servo.":"Scrap Yard is quiet now. The Yardman is gone.");add(serviceRoadChoices(),"system");return;}add("COUNTY MAINTENANCE YARD","place");add("A hulking figure steps from the ruined garage, dragging a heavy wrench across the concrete.");startCombat({name:"THE YARDMAN",level:5,hp:55,min:7,max:12,xp:65,bolts:28,end:"The Yardman drops hard. The maintenance yard finally goes quiet."},"serviceBoss",false);return;} add("(C) CONTINUE UP ROAD   (R) RETURN TO FORK","system");return;}
  if(stage === "combat"){ handleCombat(cmd); return; }
  if(stage === "wandererRoad"){ handleRoadWanderer(cmd); return; }
  if(stage === "mercy" && currentTownWanderer && handleTownWanderer(cmd)) return;
  if(["houseStorage","houseDeposit","houseWithdraw"].includes(stage)){
    if(cmd==="b"||cmd==="back"){if(stage==="houseStorage")arriveHouse(true);else showHouseStorage();return;}
    if(cmd==="deposit items"){showHouseStorage("houseDeposit");return;}
    if(cmd==="withdraw items"){showHouseStorage("houseWithdraw");return;}
    if(cmd.startsWith("deposit ")){transferHouseItem(cmd.slice(8),true);showHouseStorage("houseDeposit");return;}
    if(cmd.startsWith("withdraw ")){transferHouseItem(cmd.slice(9),false);showHouseStorage("houseWithdraw");return;}
    showHouseStorage(stage);return;
  }
  if(stage==="encounter" && cmd.includes("hunt terrible billy")){if(player.flags.terribleBillyBounty!=="active"){add("You need an active Terrible Billy contract from Tim before you can track him.","system");add(encounterChoices(currentEncounter()),"system");return;}if(!testMode&&player.turns<1){noTurnsMenu();return;}spendTurn();add("TERRIBLE BILLY — WANTED RAIDER","danger");add('A scarred raider steps from behind the wreck, one hand on a battered machete. "Tim sent you?"',"system");startCombat({name:"TERRIBLE BILLY",level:5,hp:42,min:7,max:12,xp:70,bolts:35,end:"Terrible Billy drops his weapon and collapses beside the road."},"terribleBilly",false);return;}
  if (stage === "encounter" && cmd.startsWith("inspect ")) {
    const e=currentEncounter(), key=choiceKey(cmd,e);
    if(key){ resolveEncounter(cmd); return; }
    inspectItem(cmd.slice(8)); return;
  }
  if (stage === "mercy" && cmd.startsWith("inspect ") && (mercyLocation==="relay" || cmd.includes("photo") || cmd.includes("corvette"))) { handleSolace(cmd); return; }
  if (cmd.startsWith("inspect ")) { inspectItem(cmd.slice(8)); return; }
  if (stage === "encounter" && cmd.startsWith("use ")) {
    const e = currentEncounter();
    const key = choiceKey(cmd,e);
    if (key) { resolveEncounter(cmd); return; }
    useItem(cmd.slice(4)); return;
  }
  if (cmd.startsWith("use ")) { useItem(cmd.slice(4)); return; }
  if (cmd.startsWith("dismantle ")) { dismantleItem(cmd.slice(10)); return; }
  if (cmd.startsWith("drop ")) { const item=findItem(cmd.slice(5)); if(!item){add("You are not carrying that.","system");return;} inventoryMode={item:item.name};stage="confirmDrop";add(`DROP ${item.name.toUpperCase()}? This cannot be undone.`,"danger");add("(Y) CONFIRM DROP   (N) CANCEL","system");return; }

  if(stage === "wakeNamed"){ stage="standing"; showStandingOptions(); return; }
  if (stage === "hello") { await answerHello(raw); return; }
  if (stage === "listen") { if(cmd==="listen") await reveal(); else { player.flags.introFailed=true; introFailureCount++; add("...","system"); add("I SAID LISTEN.","danger"); add("GAME OVER","place"); setTimeout(()=>titleScreen(),900); } return; }
  if (stage === "savecoords") { if(cmd.includes("log") || cmd.includes("coordinate")) {
    busy=true; input.disabled=true;
    add("You dig through the pack and pull out the old handheld GPS.");
    add("Thick plastic. Tiny green screen. Buttons that require actual force.");
    add("This thing looks like it was built in the 1970s.","system");
    add("You don't remember GPS existing in the 1970s. Probably not important.","system");
    add("COORDINATES LOGGED — SOLACE / ROUTE 127 SOUTH / 6.2 MI","bright"); player.flags.interfaceUnlocked=true; hud.classList.remove("hidden"); utilityPanel.classList.remove("hidden"); updateHud(); add("INTERFACE ONLINE — (S) STATUS / (I) INVENTORY / (M) MAP / (Q) QUESTS / (V) SAVE","system");
    add("The MAP interface now reads from the battered GPS.","system"); await leaveHouse();
  } else add("Type LOG COORDINATES when you are ready.","system"); return; }
  if (stage === "house") {
    if(cmd==="investigate occupation"){investigateHouse();return;}
    if(cmd==="lift floorboard"){claimHouse();return;}
    if(cmd==="open storage box"){showHouseStorage();return;}
    if(cmd.includes("fireplace")){ add("Cold ash shifts under the pipe. Beneath it, you find a boot print that is not yours.","bright"); add("Someone has been here since you left.","system");
    } else if(cmd.includes("medicine")||cmd.includes("bathroom")||cmd.includes("cabinet")||cmd.includes("bandage")){
      if(player.flags.houseBandage){add("The medicine cabinet is empty now.","system");}
      else {player.flags.houseBandage=true;addPack("Bandage","consumable");add("Behind a cracked bottle of antiseptic, one sealed bandage is still usable.","bright");}
    } else if(cmd.includes("east")||cmd.includes("solace")||cmd.includes("north")||cmd.includes("mercy")||cmd.includes("road")){startRoadTrip("mercy",9);}
    else if(cmd.includes("pack")){showInventory();}
    if(stage==="house")showHouseChoices();
    return;
  }
  if (stage === "roadReady") { if (cmd==="r" || cmd.includes("road") || cmd.includes("east") || cmd.includes("go")) showEncounter(); else add("(R) ROAD — BEGIN JOURNEY", "system"); return; }
  if (stage === "encounter") { resolveEncounter(cmd); return; }
  if (stage === "between") { showEncounter(); return; }
  if (stage === "settlement") {
    if(cmd==="p") cmd="approach gate";
    if(player.flags.solaceGateChallenge && stage==="settlement"){
      if(cmd.includes("terminal")||cmd.includes("transmission")||cmd==="1"){
        add("GUARD > The old terminal sent you? Fine. Keep your hands where I can see them.","man");
        player.flags.solaceGateChallenge=false; player.flags.mercyDiscovered=true; player.flags.mainSolaceQuest="done"; stage="mercy"; mercyLocation="town";
        add("The buses part just far enough to let you through. Smoke, voices, hammering metal. People.");add("TIM > Welcome to Solace. Don't make us regret the name.","man");
        if(!player.flags.solaceCheckpointSaved){player.flags.solaceCheckpointSaved=true;saveGame(activeSaveSlot);add("CHECKPOINT REACHED — SOLACE AUTOSAVED","reward");}mercyMenu();return;
      }
      if(cmd.includes("trade")||cmd==="2"){add("GUARD > Trade happens inside. Leave the weapons pointed at the dirt and you can talk to Johnny.","man");add("STATE YOUR BUSINESS   (1) TERMINAL   (2) TRADE   (3) RELAY   (4) PASSING THROUGH   (5) FIGHT","system");return;}
      if(cmd.includes("relay")||cmd==="3"){add("GUARD > Relay Station? Tim can tell you what Solace knows. Don't expect him to trust a stranger just because you know the name.","man");add("STATE YOUR BUSINESS   (1) TERMINAL   (2) TRADE   (3) RELAY   (4) PASSING THROUGH   (5) FIGHT","system");return;}
      if(cmd.includes("passing")||cmd.includes("just passing")||cmd==="4"){add("GUARD > Nobody just passes through anymore. State your business or turn around.","man");add("STATE YOUR BUSINESS   (1) TERMINAL   (2) TRADE   (3) RELAY   (4) PASSING THROUGH   (5) FIGHT","system");return;}
      if(cmd.includes("fight")||cmd.includes("pick a fight")||cmd==="5"){
        player.flags.solaceGateChallenge=false;
        startCombat({name:"SOLACE GATE GUARD",level:Math.max(2,player.level),hp:28,damage:7,minDamage:5,maxDamage:9,min:5,max:9,xp:18,bolts:0,end:"The gate guard lowers his weapon and calls for help."},"gateGuards",true,false);return;
      }
      add("STATE YOUR BUSINESS   (1) ABANDONED TERMINAL SENT ME   (2) LOOKING TO TRADE   (3) LOOKING FOR THE RELAY STATION   (4) JUST PASSING THROUGH   (5) PICK A FIGHT","system");return;
    }
    if (cmd.includes("approach") || cmd.includes("gate") || cmd.includes("relay")) {
      add("A rifle barrel appears above the barricade. GUARD > State your business.","man");
      player.flags.solaceGateChallenge=true;
      add("STATE YOUR BUSINESS   (1) ABANDONED TERMINAL SENT ME   (2) LOOKING TO TRADE   (3) LOOKING FOR THE RELAY STATION   (4) JUST PASSING THROUGH   (5) PICK A FIGHT","system");
    } else add("The settlement waits beyond the barricade. Try APPROACH GATE.", "system");
    return;
  }
  if (stage === "mercy") { handleSolace(cmd, raw); return; }
}
utilityPanel.addEventListener("click", async e => {
  const btn=e.target.closest("button[data-command]"); if(!btn||busy||commandProcessing) return;
  commandProcessing=true; setInputWaiting(true); try{ await handleCommand(btn.dataset.command); await outputQueue; } finally { commandProcessing=false; setInputWaiting(false); input.focus(); followOutput(); }
});
form.addEventListener("submit", async e => { e.preventDefault(); if(commandProcessing||busy)return; const value=input.value; input.value=""; commandProcessing=true; setInputWaiting(true); try{ await handleCommand(value); await outputQueue; } finally { commandProcessing=false; setInputWaiting(false); input.focus(); followOutput(); } });
startRefillTimer();
titleScreen();

// Shared inn mechanics, routed before generic bank commands.
function handleInnRoom(cmd){
  if(mercyLocation==="jenRoomChest"){
    // A stale or edited save location must not grant access to an unpurchased room.
    if(!player.flags?.rustyRoomOwned){mercyLocation="jen";add("ROOM ACCESS REQUIRES OWNERSHIP","system");return;}
    if(!Array.isArray(player.rustyRoomChest))player.rustyRoomChest=[];
    const chest=player.rustyRoomChest;
    const show=()=>{add('RUSTY LANTERN — ROOM CHEST','place');add(`CHEST ${chest.length}/10 STACKS   PACK ${packSlotsUsed()}/${player.packMax}`,'system');chest.forEach((i,n)=>add(`${n+1}. ${r18ItemLabel(i)} ×${i.qty}`));if(!chest.length)add('CHEST EMPTY','system');add('DEPOSIT <ITEM NAME> [xQTY]   WITHDRAW <ITEM NAME> [xQTY]   BACK','system');};
    if(['back','b','return'].includes(cmd)){mercyLocation='jenRoom';add('THE RUSTY LANTERN','place');add(`${player.name||'PLAYER'}'S ROOM`,'place');add('REST   CHEST   LOOK AROUND   RETURN','system');return;}
    const deposit=cmd.startsWith('deposit '),withdraw=cmd.startsWith('withdraw ');
    if(deposit||withdraw){
      const request=cmd.slice(deposit?8:9).trim();
      const match=request.match(/^(.*?)\s+(?:x|×)(\d+)$/i);
      const name=(match?match[1]:request).trim().toLowerCase();
      const qty=match?Number(match[2]):1;
      const src=deposit?player.pack:chest,dst=deposit?chest:player.pack;
      if(!name||!Number.isSafeInteger(qty)||qty<1){add('INVALID ITEM OR QUANTITY','system');show();return;}
      const item=r18NamedStack(src,name);
      if(!item||!Number.isSafeInteger(item.qty)||item.qty<qty){add('ITEM OR QUANTITY NOT AVAILABLE','system');show();return;}
      if(deposit&&['quest','key'].includes(item.type)){add('QUEST ITEMS CANNOT BE STORED','system');show();return;}
      if(deposit&&(item.name===player.weapon||item.name===player.armor)){add('EQUIPPED GEAR CANNOT BE STORED','system');show();return;}
      const existing=dst.find(i=>i.name===item.name&&i.type===item.type&&!!i.stolen===!!item.stolen);
      if((!deposit&&packSlotsUsed()>player.packMax)||(!existing&&(deposit?chest.length>=10:packSlotsUsed()>=player.packMax))){add('NO FREE STORAGE SLOTS','system');show();return;}
      if(existing){if(!Number.isSafeInteger(existing.qty)||existing.qty<1||!Number.isSafeInteger(existing.qty+qty)){add('INVALID STORAGE QUANTITY','system');show();return;}existing.qty+=qty;}else dst.push({...item,qty});
      item.qty-=qty;if(item.qty===0)src.splice(src.indexOf(item),1);
      add(`${deposit?'STORED':'RETRIEVED'} — ${item.name} ×${qty}`,'reward');updateHud();show();return;
    }
    show();return;
  }
  if(mercyLocation==="jenRoom"){
    if(["b","back","return","4"].includes(cmd)){mercyLocation="jen";showBarActions();return;}
    if(["rest","1"].includes(cmd)){
      if(player.hp>=player.maxHp){add("You are already at full health. No rest allowance used.","system");return;}
      const f=player.flags, today=Number(day)||1;
      if(f.rustyRoomRestDay!==today){f.rustyRoomRestDay=today;f.rustyRoomRestCount=0;}
      const factors=[1,.75,.5,.25,0],factor=factors[Math.min(f.rustyRoomRestCount,4)];
      f.rustyRoomRestCount++;
      const heal=Math.min(player.maxHp-player.hp,Math.ceil(player.maxHp*factor));
      player.hp+=heal; if(player.hp>=player.maxHp)player.deathStreak=0;
      updateHud();add(`ROOM REST — ${Math.round(factor*100)}% EFFECTIVENESS, +${heal} HP`,'reward');
      add('Rest does not replenish expedition turns.','system');return;
    }
    if(["look around","look","3"].includes(cmd)){add('The door locks from inside. A narrow bed and an old lamp make this a safe place to sleep.','system');return;}
    if(["chest","2"].includes(cmd)){mercyLocation='jenRoomChest';if(!Array.isArray(player.rustyRoomChest))player.rustyRoomChest=[];add('RUSTY LANTERN — ROOM CHEST','place');add('DEPOSIT <ITEM NAME> [xQTY]   WITHDRAW <ITEM NAME> [xQTY]   BACK','system');return;}
    add('REST   CHEST   LOOK AROUND   RETURN','system');return;
  }

}
