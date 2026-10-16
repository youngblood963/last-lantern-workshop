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
let roadTripLength = 9;
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
const QA_BUILD = typeof window !== "undefined" && window.ROUTE127_QA_BUILD === true;
const TEST_ACCESS_CODE = "LANTERN127";
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
  document.querySelector("#hud-xp").textContent = `${player.xp}/${player.nextXp}`;
  document.querySelector("#hud-bolts").textContent = player.bolts;
  document.querySelector("#hud-turns").textContent = testMode ? "∞ TEST" : `${player.turns}/${player.maxTurns}`;
  document.querySelector("#hud-pack").textContent = `${packSlotsUsed()}/${player.packMax}`; const ht=document.querySelector("#hud-time"); if(ht)ht.textContent=timePhase();
  document.querySelector("#side-level").textContent = `LV ${String(player.level).padStart(2,"0")}`;
  document.querySelector(".utility-name").childNodes[0].nodeValue = `${player.handle || "---"} `;
  document.querySelector("#side-hp").textContent = `${player.hp} / ${player.maxHp}`;
  const xpBar=document.querySelector("#side-xp");
  if(xpBar){ xpBar.hidden=player.level<5; if(player.level>=5){ const filled=Math.max(0,Math.min(10,Math.floor(10*player.xp/Math.max(1,player.nextXp)))); xpBar.textContent=`XP [${"#".repeat(filled)}${"-".repeat(10-filled)}]`; } }
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
const OVERNIGHT_RISK=Object.freeze({camp:{chance:.08,maxBolts:8,maxItems:1},road:{chance:.30,maxBolts:20,maxItems:2},room:{chance:0,maxBolts:0,maxItems:0}});
function overnightLabel(choice){return choice==="camp"?"MAKE CAMP":choice==="room"?"RENTED ROOM":"REMAIN ON ROAD";}
function overnightRoomAvailable(){const origin=["zeroTurns","overnightConfirm"].includes(stage)?player.flags.turnResumeStage:stage;return origin==="mercy"&&!!player.flags.rentedRoom;}
function overnightChoices(){return ["(C) MAKE CAMP — CONSUMES 1 TENT / LOW LOSS RISK","(R) REMAIN ON ROAD — HIGHER LOSS RISK",...(overnightRoomAvailable()?["(J) USE RENTED ROOM — NO LOSSES"]:[])].join("   ");}
function legacyOvernightRng(){let seed=0;for(const ch of `${player.handle}|${player.flags.nextRefillAt}|${player.flags.overnight||"road"}`)seed=(Math.imul(seed,31)+ch.charCodeAt(0))>>>0;return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function planOvernight(choice,rng=Math.random){
 const config=OVERNIGHT_RISK[choice]||OVERNIGHT_RISK.road,plan={choice,dueAt:player.flags.nextRefillAt,bolts:0,items:[],applied:false};
 if(rng()>=config.chance)return plan;
 plan.bolts=Math.min(player.bolts,config.maxBolts?1+Math.floor(rng()*config.maxBolts):0);
 const candidates=player.pack.filter(i=>!["key","quest"].includes(i.type)&&i.name!==player.weapon&&i.name!==player.armor).map(i=>({...i}));
 let available=candidates.reduce((a,i)=>a+i.qty,0),remaining=Math.min(config.maxItems,Math.max(0,available-1));
 while(remaining>0&&candidates.length){const item=candidates[Math.floor(rng()*candidates.length)];if(item.qty<=0){candidates.splice(candidates.indexOf(item),1);continue;}item.qty--;remaining--;let loss=plan.items.find(i=>i.name===item.name&&i.type===item.type);if(loss)loss.qty++;else plan.items.push({name:item.name,type:item.type,qty:1});}
 return plan;
}
function sealOvernight(choice){
 if(player.flags.overnightLocked)return false;
 if(player.turns>0){add("Turns have already refilled; no overnight choice is needed.","system");return false;}
 if(choice==="camp"&&!hasItem("Tent")){add("MAKE CAMP REQUIRES 1 TENT. Johnny sells replacements.","system");return false;}
 if(choice==="room"&&!overnightRoomAvailable()){add("No paid room is available here. Rent one from Jen while in Solace.","system");return false;}
 if(choice==="camp")removeItem("Tent",1);
 if(choice==="room")player.flags.rentedRoom=false;
 player.flags.overnight=choice;player.flags.overnightPlan=planOvernight(choice);player.flags.overnightLocked=true;player.flags.pendingOvernight="";
 add(`${overnightLabel(choice)} LOCKED — ${choice==="camp"?"1 Tent consumed. Low loss risk.":choice==="room"?"Your paid room guarantees no overnight losses.":"Higher loss risk. No supplies required."} No overnight loot.`,"reward");return true;
}
function resolveOvernight(refillAt){
 const f=player.flags;
 if(!f.overnightPlan&&(f.overnightLocked||player.turns===0)){f.overnight=f.overnight||"road";f.overnightPlan=planOvernight(f.overnight,legacyOvernightRng());}
 const plan=f.overnightPlan;if(!plan||plan.applied||refillAt<plan.dueAt)return;
 const lostBolts=Math.min(player.bolts,Math.max(0,plan.bolts));player.bolts-=lostBolts;
 const losses=[];
 for(const requested of plan.items){const item=player.pack.find(i=>i.name===requested.name&&i.type===requested.type);if(!item||["key","quest"].includes(item.type)||item.name===player.weapon||item.name===player.armor)continue;
 const total=player.pack.filter(i=>!["key","quest"].includes(i.type)&&i.name!==player.weapon&&i.name!==player.armor).reduce((a,i)=>a+i.qty,0),qty=Math.min(item.qty,requested.qty,Math.max(0,total-1));
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
function gainXp(n) {
  if(stage==="fallen")return;
  player.xp += n;
  resultLine(`+${n} XP`, "reward");
  while (player.xp >= player.nextXp) {
    player.xp -= player.nextXp;
    player.level += 1;
    player.nextXp = Math.round(player.nextXp * 1.5);
    player.maxHp += 10;
    player.hp = Math.min(player.maxHp, player.hp + 10);
    add(`LEVEL UP — LEVEL ${String(player.level).padStart(2,"0")}`, "bright");
    add(`MAX HP +10   NEXT LEVEL: ${player.nextXp} XP`, "reward");
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
  player.deathStreak=(player.deathStreak||0)+1;
  const inTown=player.flags.mercyDiscovered;
  const defeatedByGateGuards=!!(combatState&&combatState.source==="gateGuards");
  const jenGateRescue=defeatedByGateGuards&&!player.flags.jenGateRescueUsed;
  if(jenGateRescue)player.flags.jenGateRescueUsed=true;
  // Remaining road segments are the minimum rescue travel cost; recovery adds two.
  const atHouse=stage==="house" || ["houseStorage","houseDeposit","houseWithdraw"].includes(stage) || (combatState&&combatState.source==="houseBoss");
  const travel=atHouse ? (inTown?roadTripLength:0) : inTown ? (roadGoal==="house"?Math.max(0,roadTripLength-roadTurn):roadGoal==="mercy"?Math.max(0,roadTripLength-roadTurn):roadGoal==="east"?Math.max(0,roadTurn+1):0) : Math.max(0,roadTurn+1);
  const penalty=travel+2;
  player.turns=Math.max(0,player.turns-penalty);
  dailyRoadTurns+=travel; // rescue travels the route; recovery itself is not a road turn
  player.hp=Math.max(1,Math.round(player.maxHp*.5));
  if(combatState&&combatState.source==="jenBoss")player.flags.jenQuest="raiders";
  combatState=null; currentRoadWanderer=null; updateHud();
  add("YOU HAVE FALLEN","danger");
  add("Your vision fades as the wasteland goes silent.");
  add(inTown?"Hours later, you wake on a cot in Solace.":"Hours later, you wake in the old house.");
  if(jenGateRescue)add("JEN > The gate guards were going to leave you out there. I brought you back myself. Don't make me do that twice.","bright");
  else add("Someone dragged you back from the highway. They didn't do it for free.");
  add(`RESCUE TRAVEL: ${travel} TURNS   RECOVERY: 2 TURNS   TOTAL: ${penalty}`, "system");
  add(`HP RESTORED: ${player.hp}/${player.maxHp}   EQUIPMENT AND QUEST ITEMS RETAINED`, "system");
  stage="fallen"; add("(1) GET UP", "system");
}
function hurt(n) { player.hp = Math.max(0, player.hp - n); updateHud(); resultLine(`-${n} HP`, "danger"); if(player.hp<=0) handlePlayerDeath(); }
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
 "Reinforced Combat Machete":{rarity:"rare",type:"weapon",min:12,max:23},
 "Refurbished Service Revolver":{rarity:"rare",type:"weapon",min:11,max:24},
 "Reinforced Relay Vest":{rarity:"rare",type:"armor",def:7},
 "Padded Tactical Jacket":{rarity:"rare",type:"armor",def:6},
 "Reinforced Leather Armor":{rarity:"rare",type:"armor",def:6},
 "Salvaged Security Vest":{rarity:"rare",type:"armor",def:8},
 "Insulated Patrol Coat":{rarity:"rare",type:"armor",def:7},
 "Rusted Pipe":{rarity:"common",type:"weapon",min:5,max:10},"Claw Hammer":{rarity:"uncommon",type:"weapon",min:7,max:13},"Tire Iron":{rarity:"rare",type:"weapon",min:13,max:20},"Yardman's Wrench":{rarity:"uncommon",type:"weapon",min:11,max:18},"Heavy Wrench":{rarity:"uncommon",type:"weapon",min:11,max:18},
 "Reinforced Pipe":{rarity:"uncommon",type:"weapon",min:7,max:12},"Tempered Steel Pipe":{rarity:"rare",type:"weapon",min:13,max:21},"Bluefang Hunting Knife":{rarity:"rare",type:"weapon",min:14,max:22},"Devastator's Iron Pipe":{rarity:"epic",type:"weapon",min:17,max:25},
 "Worn Jacket":{rarity:"common",type:"armor",def:2},"Reinforced Jacket":{rarity:"uncommon",type:"armor",def:4},"Padded Jacket":{rarity:"uncommon",type:"armor",def:4},"Reinforced Work Vest":{rarity:"uncommon",type:"armor",def:5},"Hardened Scavenger Coat":{rarity:"rare",type:"armor",def:7},"Highway Warden's Coat":{rarity:"rare",type:"armor",def:8},"Wraith's Reinforced Coat":{rarity:"epic",type:"armor",def:10},
 "Worn Leather Wristband":{rarity:"common",type:"accessory",def:1},
 "Lucky Bottle Cap":{rarity:"common",type:"accessory",min:1,max:1},
 "Reinforced Belt":{rarity:"common",type:"accessory",def:1},
 "Scavenger's Charm":{rarity:"uncommon",type:"accessory",def:1,min:1,max:1},
 "Rusted Dog Tags":{rarity:"uncommon",type:"accessory",def:2},
 "Road Warrior's Bracelet":{rarity:"uncommon",type:"accessory",min:1,max:2},
 "Niko's Lucky Vest":{rarity:"common",type:"armor",def:2},
 "Giant Dog Bone":{rarity:"common",type:"consumable"},
 "Rusty License Plate":{rarity:"common",type:"accessory",def:1},
 "Niko's Collar":{rarity:"legendary",type:"accessory",def:3,maxHpBonus:15,critBonus:0.02,secondChance:true},
 "Iron Reaper":{rarity:"rare",type:"weapon",min:18,max:27,bleedChance:0.10}
};
const RARITY_COLOR={common:"#e5e7eb",uncommon:"#22c55e",rare:"#3b82f6",epic:"#a855f7",legendary:"#f97316"};
function gearLabel(name){const g=GEAR[name];return g?`${name} [${g.rarity.toUpperCase()}]`:name;}
function armorDefense(){return (GEAR[player.armor]?.def||0)+(GEAR[player.accessory]?.def||0);}
function weaponRange(){const g=GEAR[player.weapon],a=GEAR[player.accessory];return g&&g.type==="weapon"?[g.min+(a?.min||0),g.max+(a?.max||0)]:[5+(a?.min||0),10+(a?.max||0)];}
function enemyHit(min,max) {
  const raw = Math.floor(Math.random()*(max-min+1))+min;
  const defense = armorDefense();
  const dmg = Math.max(1, raw-defense);
  hurt(dmg);
  add(`Incoming ${raw} - ${defense} DEF = ${dmg} damage.`, "system");
  return dmg;
}
function rollDamage(min,max){ if(min==null||max==null){[min,max]=weaponRange();} return Math.floor(Math.random()*(max-min+1))+min; }
function packSlotsUsed() { return player.pack.filter(i=>!["key","quest"].includes(i.type)).length; }
function findItem(name) { return player.pack.find(i => i.name.toLowerCase().includes(name.toLowerCase())); }
function hasItem(name) { return !!findItem(name); }
function removeItem(name, qty=1) {
  const item=findItem(name); if(!item) return false;
  item.qty-=qty; if(item.qty<=0) player.pack=player.pack.filter(i=>i!==item); updateHud(); return true;
}
function addPack(name, type="material", qty=1) {
  if(stage==="fallen")return false;
  const existing=player.pack.find(i=>i.name===name && i.type===type);
  if(existing){ existing.qty+=qty; updateHud(); resultLine(`PACK: + ${name}${qty>1?` ×${qty}`:""}`,"reward"); return true; }
  if (!["key","quest"].includes(type) && packSlotsUsed() >= player.packMax) { add(`PACK FULL — You leave ${name} behind.`, "system"); return false; }
  player.pack.push({name,qty,type}); updateHud(); resultLine(`PACK: + ${name}${qty>1?` ×${qty}`:""}`, "reward"); return true;
}
function showStatus() {
  add("────────────────────────────────────────", "system");
  add(`HANDLE ${player.handle || "---"}   LEVEL ${String(player.level).padStart(2,"0")}   HP ${player.hp}/${player.maxHp}   XP ${player.xp}/${player.nextXp}`);
  add(`BOLTS ${player.bolts}   TURNS ${testMode?"∞ TEST":`${player.turns}/${player.maxTurns}`}   PACK ${packSlotsUsed()}/${player.packMax}   TIME ${timePhase()}`);
  add(`NEXT TURN REFILL: ${testMode?"TEST MODE — LIMIT DISABLED":refillText()}`, "system");
  const [dmin,dmax]=weaponRange();
  showEquipmentSummary();
  add("────────────────────────────────────────", "system");
  add("(B) BACK", "system");
}
function jenQuestObjective(){return ({active:"Find the missing runner's supply cart on eastern segment 3.",cart:"SEARCH SUPPLY CART at eastern segment 3. Return the crate to Jen.",recovered:"DELIVER JEN'S SUPPLY CRATE to Jen in Solace.",hideout:"Follow the runner's trail east to segment 5, near the abandoned checkpoint.",raiders:"SEARCH RAIDER CHECKPOINT at eastern segment 5 to rescue the runner.",fight:"Rescue the runner at the eastern checkpoint.",rescued:"DELIVER RUNNER'S TOKEN to Jen in Solace."})[player.flags.jenQuest]||"Find Jen in Solace.";}
function showQuests(){
  add("──────────────── QUEST LOG ────────────────","system");
  add("MAIN QUEST","bright");
  if(player.flags.chapterOneComplete){add('MAIN QUEST: COMPLETE','reward');add('Chapter One — The Road to Seaport','bright');add('Status: Completed','reward');add('Further chapters are in development.','system');add('TYPE: READ CHAPTER ONE to revisit the finale.','system');}
  else if(typeof portQuestObjective==="function")add("THE ROAD TO SEAPORT — "+portQuestObjective(),"system");
  add("ACTIVE SIDE QUESTS","bright"); let active=0;
  for(const [key,title,description] of [["jenQuest","LAST CALL","Search the eastern road for the supply cart; SEARCH SUPPLY CART; DELIVER JEN'S SUPPLY CRATE, then find the raider checkpoint and DELIVER RUNNER'S TOKEN."],["johnnyQuest","A DEAL GONE BAD","Search the western road for the ledger; SEARCH LEDGER; return to Johnny and DELIVER JOHNNY'S LEDGER."],["amiiQuest","THE MISSING DEPOSIT","Search the western road for the satchel; SEARCH SATCHEL; return to Amii and DELIVER BANK SATCHEL."],["waynePatientQuest","THE LAST PATIENT","Search the eastern road for medicine; SEARCH AMBULANCE; return to Wayne and DELIVER CLINIC MEDICINE."]]){if(player.flags[key]&&player.flags[key]!=="done"){active++;add(`SIDE — ${title} [${player.flags[key].toUpperCase()}]`);add(key==="jenQuest"?jenQuestObjective():description,"system");}}
  for(const [key,title,description] of [["jenUnpaidTab","UNPAID TAB","Settle the tavern's outstanding 12-Bolt tab with Jen."],["jenFamiliarFace","A FAMILIAR FACE","Follow up with Jen about the traveler she recognizes."]]){if(player.flags[key]&&player.flags[key]!=="done"){active++;add(`SIDE — ${title} [${player.flags[key].toUpperCase()}]`);add(description,"system");}}
  if(player.flags.mainSolaceQuest!=="done"){active++;add("MAIN — HEAD TO SOLACE");add("Follow the coordinates logged in the battered GPS and reach Solace.","system");}
  if(["active","cleared"].includes(player.flags.houseQuest)){active++;add("SIDE — INVESTIGATE THE ABANDONED HOUSE");add(player.flags.houseQuest==="cleared"?"Lift the loose floorboard in the starting house to claim your wooden storage box.":"Return to the starting house west of Solace and investigate the recent occupation.","system");}
  if(player.flags.timHouseBounty && player.flags.timHouseBounty!=="done"){active++;add(`BOUNTY — TROUBLE AT THE OLD HOUSE [${String(player.flags.timHouseBounty).toUpperCase()}]`);add(player.flags.timHouseBounty==="proof"?"Return to Tim with proof that the old-house squatter has been driven out.":"Investigate the occupied old house after Wayne unlocks the house lead, then defeat the squatter.","system");}
  if(player.flags.terribleBillyBounty && player.flags.terribleBillyBounty!=="done"){active++;add(`BOUNTY — TERRIBLE BILLY [${String(player.flags.terribleBillyBounty).toUpperCase()}]`);add(player.flags.terribleBillyBounty==="proof"?"Return to Tim with proof that Terrible Billy has been stopped.":"On the road, use HUNT TERRIBLE BILLY to confront the wanted raider.","system");}
  if(["active","found"].includes(player.flags.timQuest)){active++;add("SIDE — THE OLD BADGE");add(player.flags.timQuest==="found"?"Return Tim's old badge to him in Solace.":"Search Route 127 between Solace and the old house.","system");}
  if(["active","found"].includes(player.flags.murphyQuest)){active++;add("SIDE — ONE GOOD BELT");add(player.flags.murphyQuest==="found"?"Return the usable serpentine belt to Murphy.":"Search near the service-road fork toward the old house.","system");}
  if(player.flags.relayQuest==="ask"){active++;add("MAIN — RELAY STATION");add("Ask around Solace about the Relay Station.","system");}
  if(player.flags.relayQuest==="find"){active++;add("MAIN — RELAY STATION");add("Find and investigate the Relay Station in Solace.","system");}
  if(player.flags.relayQuest==="complete"){add("MAIN OBJECTIVE","bright");add("THE FACTORY","place");add("The Relay Station is operational.");add("Investigate the abandoned factory beyond Solace's eastern road.");add("STATUS: ACTIVE","system");}
  if(player.flags.relayQuest==="stabilize"){
    active++; add("MAIN — THE RELAY"); const rp=ensureRelayParts(); const count=Object.values(rp).filter(Boolean).length;
    if(!player.flags.relayPartsRevealed){ add("Inspect all four Relay systems and learn what is failing.","system"); const ri=player.flags.relayInspected||{}; if(ri.console)add("• CONSOLE — Power regulator failed. Johnny hoards old electronics.","system"); if(ri.antenna)add("• ANTENNA — Antenna servo seized. The county maintenance yard had old motor assemblies.","system"); if(ri.cables)add("• CABLES — Shielded feed coupler burned out. A lower utility/access road may still have signal hardware.","system"); if(ri.monitor)add("• MONITOR — Signal-conditioning module is dead. You passed old communications equipment east of Solace.","system"); }
    else { add(`Recover four components needed to stabilize the Relay. PARTS ${count}/4.`,"system"); add(`${rp.johnny?"✓":"□"} POWER REGULATOR — Johnny may have something this old.`,"system"); add(`${rp.yard?"✓":"□"} ANTENNA SERVO — Search the county maintenance yard.`,"system"); add(`${rp.branch?"✓":"□"} SHIELDED FEED COUPLER — Search the Lower Access Road off the fork.`,"system"); add(`${rp.east?"✓":"□"} SIGNAL-CONDITIONING MODULE — Search old communications equipment east of Solace.`,"system"); if(count>=4)add("Return to the Relay Station and stabilize the connection.","bright"); }
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
  if(player.flags.relayQuest==="complete"){completed++;add("MAIN — RELAY STATION: CONNECTION STABILIZED","reward");add("The Relay is operational. Contact with the Tomorrow Project established.","system");}
  if(!completed)add("NONE","system"); add("────────────────────────────────────────","system");add("(B) BACK","system");
}
function showEquipmentSummary(){
  const [low,high]=weaponRange();
  add(`WEAPON: ${gearLabel(player.weapon)}`,GEAR[player.weapon]?.rarity||"system");add(`        DMG ${low}–${high}`,"system");add("","system");
  add(`PET: ${player.flags?.equippedPet||"None"} — MANAGE PETS`,"system");
  add(`ARMOR: ${gearLabel(player.armor)}`,GEAR[player.armor]?.rarity||"system");add(`       DEF ${armorDefense()}`,"system");add(`ACCESSORY: ${player.accessory?gearLabel(player.accessory):"None"}`,GEAR[player.accessory]?.rarity||"system");
}
function showInventory() {
  numberedChoices={};currentHotkeys={b:"back"};refreshInterfaceShortcutLabels();
  add("──────────────── INVENTORY ────────────────", "system");
  add(`BOLTS — ${player.bolts}`, "bright");
  add(`${player.packMax>=10?"TRAVELLER BACKPACK":"WORN BACKPACK"} — ${packSlotsUsed()} / ${player.packMax} SLOTS`, "bright");
  showEquipmentSummary();
  const normal=player.pack.filter(i=>!["key","quest"].includes(i.type));
  const keys=player.pack.filter(i=>["key","quest"].includes(i.type));
  for(let i=0;i<player.packMax;i++){
    const item=normal[i];
    add(item?`[${i+1}] ${gearLabel(item.name)}${item.qty>1?` ×${item.qty}`:""}  <${item.type.toUpperCase()}>`:`${i+1}. EMPTY`,item&&GEAR[item.name]?GEAR[item.name].rarity:"system");
  }
  if(keys.length){ add("KEY ITEMS", "bright"); keys.forEach(i=>add(`• ${i.name}${i.qty>1?` ×${i.qty}`:""}`)); }
  // Relay parts are durable quest flags, not physical backpack items.
  if(player.flags.relayPartsRevealed || player.flags.relayQuest==="stabilize" || player.flags.relayQuest==="complete"){
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
    "Tent":"One-use shelter for a lower-risk camp. Consumed only when you confirm MAKE CAMP.","Energy Bars":"ENERGY BAR — Consumable — Restore: 10 HP. Dense, stale, and technically food. USE one to recover health.",
    "Battered Flashlight":"A scratched LED flashlight. Still works. Mostly. Useful anywhere darkness is the problem. Can be dismantled for Bolts and Electronics.",
    "Cloth":"Salvaged fabric. Useful for bandages and basic crafting.",
    "Wire":"Copper wire with enough insulation left to matter.",
    "Scrap Metal":"Bent but usable metal for repairs and crafting.",
    "Bandage":"A clean-enough field dressing. USE to recover 18 HP.",
    "Reinforced Bandage":"Forge-crafted dressing. USE to recover 30 HP.",
    "Electronics":"Small reusable electronic components.",
    "Fuel":"A small amount of old but usable fuel."
  };
  const g=GEAR[item.name]; add(`${gearLabel(item.name).toUpperCase()} — ${g?(g.type==="weapon"?`DMG ${g.min}–${g.max}`:`DEF ${g.def}`):(info[item.name]||"Salvage from the road. It may be useful for crafting.")}`,g?.rarity||"bright");
}
function useItem(name){
  if(String(name).toLowerCase().includes("tent")){add("Use MAKE CAMP when overnight choices appear. Tent is consumed only after confirmation.","system");return;}
  const item=findItem(name); if(!item){add("You aren't carrying that.","system"); return;}
  if(item.name==="Energy Bars") { if(player.hp>=player.maxHp){add("You're already at full health.","system");return;} removeItem("Energy Bars"); player.hp=Math.min(player.maxHp,player.hp+10); updateHud(); add("You eat an energy bar. +10 HP","reward"); }
  else if(item.name==="Reinforced Bandage") { if(player.hp>=player.maxHp){add("You are already at full health.","system");return;} removeItem("Reinforced Bandage");player.hp=Math.min(player.maxHp,player.hp+30);updateHud();add("Reinforced dressing applied. +30 HP","reward"); }
  else if(item.name==="Bandage") { if(player.hp>=player.maxHp){add("You're already at full health.","system");return;} removeItem("Bandage"); player.hp=Math.min(player.maxHp,player.hp+18); updateHud(); add("You wrap the worst of it. +18 HP","reward"); }
  else if(item.name==="Battered Flashlight") {
    add("The flashlight works. You switch it back off to save the battery.","bright");
  }
  else add("You can't use that directly here.","system");
}
function showCombatItems(){
  const usable=player.pack.filter(i=>i.name==="Bandage"||i.name==="Energy Bars"||i.name==="Reinforced Bandage");
  inventoryMode={combat:true,items:usable.map(i=>i.name)};returnStage="combat";stage="combatItems";refreshInterfaceShortcutLabels();
  add("──────────── COMBAT ITEMS ────────────","system"); if(!usable.length){add("NO USABLE COMBAT ITEMS","system");add("(B) BACK","system");return;}
  usable.forEach((i,n)=>add(`[${n+1}] ${i.name}${i.qty>1?` ×${i.qty}`:""} — ${i.name==="Reinforced Bandage"?"+30 HP":i.name==="Bandage"?"+18 HP":"+10 HP"}`)); add("Choose a NUMBER to use it. (B) BACK","system");
  inventoryMode={combat:true,items:usable.map(i=>i.name)}; returnStage="combat"; stage="combatItems";
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
  inventoryMode={item:item.name};
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
  if(item.name==="Battered Flashlight") { removeItem("Battered Flashlight"); const n=5; player.bolts+=n; updateHud(); add(`You strip the flashlight apart. +${n} BOLTS`,"reward"); addPack("Electronics","material"); add("The flashlight is gone.","danger"); }
  else if(item.type==="material"){add("That's already a basic crafting material.","system");}
  else { removeItem(item.name); player.bolts+=2; updateHud(); add(`You break down ${item.name}. +2 BOLTS`,"reward"); }
}
function dropItem(name){ const item=findItem(name); if(!item){add("You aren't carrying that.","system");return;} removeItem(item.name,item.qty); add(`You leave ${item.name} beside the road.`,"system"); }


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
  const posts=getBoardPosts(); posts.push({text,handle:player.handle||"TRAVELER",day,at:new Date().toISOString()});
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
  const overlay=["confirmDrop","inventory","inventoryItem","quests","interfaceStatus","interfaceMap","interfaceSave","v49TitleConfirm","confirmSaveOverwrite","combatItems"];
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
  // v51: the former road Mara is Tess; migrate existing saves without resetting wanderer progress.
  if(player.wandererState?.Mara){if(!player.wandererState.Tess)player.wandererState.Tess=player.wandererState.Mara;delete player.wandererState.Mara;}
  if(Object.prototype.hasOwnProperty.call(wandererLocations,"Mara")){if(!Object.prototype.hasOwnProperty.call(wandererLocations,"Tess"))wandererLocations.Tess=wandererLocations.Mara;delete wandererLocations.Mara;}
  currentRoadWanderer=data.currentRoadWanderer||null; currentTownWanderer=data.currentTownWanderer||null; townWandererFocus=data.townWandererFocus||null; pendingTownFight=null; combatState=data.combatState?{...data.combatState}:null;
  if(currentRoadWanderer==="Mara")currentRoadWanderer="Tess";if(currentTownWanderer==="Mara")currentTownWanderer="Tess";if(townWandererFocus==="Mara")townWandererFocus="Tess";if(player.flags.v50Trade==="Mara")player.flags.v50Trade="Tess";if(combatState?.source==="roadWanderer"&&combatState.name==="MARA")combatState.name="TESS";
  if(player.flags.overnightLocked&&!player.flags.overnightPlan)player.flags.overnightPlan=planOvernight(player.flags.overnight||"road",legacyOvernightRng());
  ensureCasinoState();ensureSteveAnnouncements();v48Migrate();
  startRefillTimer();
  if(player.flags.interfaceUnlocked!==false){hud.classList.remove("hidden");utilityPanel.classList.remove("hidden");}else{hud.classList.add("hidden");utilityPanel.classList.add("hidden");} updateHud(); screen.innerHTML="";
  add(`SAVE ${slot} — ${(player.handle||"NO HANDLE")}`, "bright"); add("Save loaded.", "reward");
  if(stage==="combat" && combatState){
    if(combatState.source==="houseBoss" && player.flags.houseQuest!=="active"){combatState=null;arriveHouse();}
    else showCurrentContext();
  }
  else if(["houseStorage","houseDeposit","houseWithdraw"].includes(stage)){showHouseStorage(stage);}
  else if(stage==="house") arriveHouse();
  else if(["port55Vendor","port55Pets","port55Kaiden","port55Mia","port55Docks","port55Stop"].includes(stage))port55Resume();
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
  await typeLine("WOMAN'S VOICE > If you can still read this, don't answer. Just listen.", "woman", 28);
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
  await typeLine("WOMAN'S VOICE > There's a settlement east of your position. If the relay station is alive, get there.", "woman", 24);
  await typeLine("MAN'S VOICE > Road's bad. Worse after dark.", "man", 28);
  add(""); await typeLine("TRANSMISSION DATA RECEIVED", "bright", 35);
  await typeLine("DESTINATION: SOLACE", "system", 25); await typeLine("ROUTE: 127 EAST", "system", 25); await typeLine("DISTANCE: 6.2 MI", "system", 30); add("");
  await typeLine("WOMAN'S VOICE > We're part of the Tomorrow Project. People trying to make the world a little less dead.", "woman", 25);
  await typeLine("WOMAN'S VOICE > Save the coordinates. We'll try you again.", "woman", 25); add("");
  await typeLine("SIGNAL LOST", "bright", 45); signal.textContent = "NO SIGNAL";
  add(""); add("LOG COORDINATES", "system"); add("Type LOG COORDINATES when you're ready.", "system");
  stage = "savecoords"; input.disabled = false; input.focus(); busy = false;
}
async function leaveHouse() {
  // LOG COORDINATES is an atomic handoff: commit the playable road state first,
  // then render the departure sequence, and ALWAYS restore player control.
  stage = "roadReady";
  roadGoal = "mercy";
  roadTripLength = 9;
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
    await typeLine("The highway cuts east through wet gray country. Weeds split the pavement. Power lines sag between leaning poles, and the shell of a gas station waits a few hundred yards ahead. Beyond it, Route 127 disappears between black hills.");
    await typeLine("Six-point-two miles to a town that may or may not exist.");
    add("NEW QUEST — HEAD TO SOLACE","bright");
    add("Follow the coordinates logged in the battered GPS and reach Solace.","system");

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



const wanderers = [
  {name:"Tess", level:3, vibe:"watchful", lines:["TESS > Road's quieter when it shouldn't be.","Tess gives you a short nod and keeps one hand near her coat."]},
  {name:"Patch", level:2, vibe:"cheerful", lines:["PATCH > Found three good screws today. That's practically a holiday.","Patch grins like the wasteland has personally failed to ruin his mood."]},
  {name:"Hollis", level:2, vibe:"tired", lines:["HOLLIS > If Solace has coffee, don't tell me. I can't afford another disappointment.","Hollis looks exhausted enough to sleep standing up."]},
  {name:"Rook", level:4, vibe:"suspicious", lines:["ROOK > You following me? ...No? Good.","Rook watches you without blinking."]},
  {name:"June", level:2, vibe:"kind", lines:["JUNE > You bleeding? No? Good day, then.","June offers a small wave."]},
  {name:"Moss", level:3, vibe:"quiet", lines:["Moss taps two fingers against his brow. Apparently that's hello.","Moss studies the horizon and says nothing."]},
  {name:"Kettle", level:4, vibe:"odd", lines:["KETTLE > Never trust a road that looks straight.","Kettle is humming a song you almost recognize."]},
  {name:"Vera", level:3, vibe:"practical", lines:["VERA > Boots first. Food second. Pride somewhere around ninth.","Vera checks the stitching on her pack."]},
  {name:"Deke", level:5, vibe:"cocky", lines:["DEKE > Relax. If I wanted your Bolts, we'd already be negotiating.","Deke flashes a grin that does not improve the situation."]},
  {name:"Ash", level:2, vibe:"skittish", lines:["ASH > Just passing through. Same as you.","Ash keeps glancing toward the nearest exit."]},
  {name:"Bram", level:4, vibe:"gruff", lines:["BRAM > Keep your weapon low and we'll get along fine.","Bram grunts. It may have been hello."]},
  {name:"Lark", level:3, vibe:"curious", lines:["LARK > You hear the relay at night too, or is that just me?","Lark looks at your pack, then at you, filing away details."]}
];
const wandererSpots=["road","mercy","jen","johnny","murphy","wayne","amii","gate"];
let wandererLocations={};
function rollWandererLocations(previous={}){
  const out={};
  wanderers.forEach(w=>{ if(!wandererAlive(w)){out[w.name]="dead";return;} const choices=wandererSpots.filter(x=>x!==previous[w.name]); out[w.name]=choices[Math.floor(Math.random()*choices.length)]; });
  return out;
}
function moveWanderers(){ wandererLocations=rollWandererLocations(wandererLocations||{}); }
function wandererByName(name){ return wanderers.find(w=>w.name.toLowerCase()===String(name||"").toLowerCase()); }
function ws(name){ player.wandererState=player.wandererState||{}; return player.wandererState[name]||(player.wandererState[name]={met:false,dead:false,lastSeen:-99,talks:0,lastLine:""}); }
function wandererAlive(w){ return !ws(w.name).dead; }
function markWandererDead(name){ const w=wandererByName(name); const key=w?w.name:name; const st=ws(key); st.dead=true; st.met=true; st.replacementDay=day+1+Math.floor(Math.random()*3); wandererLocations[key]="dead"; }
function wandererDialogue(w){ const st=ws(w.name); const pools={Tess:["TESS > Still walking? Good.","TESS > Road east smells like rain and trouble.","TESS > You again. Route's getting crowded."],Patch:["PATCH > Found a washer too. Huge day.","PATCH > If it still turns, somebody can use it."],Ash:["ASH > I'm not staying long.","ASH > You ask a lot of questions.","ASH > Seriously. What do you want?"]}; const pool=pools[w.name]||[`${w.name.toUpperCase()} > Road keeps moving. So do I.`,`${w.name} glances toward the horizon. "Seen worse days."`,`"Still here?" ${w.name} almost smiles.`]; let line=pool[Math.floor(Math.random()*pool.length)]; if(pool.length>1&&line===st.lastLine)line=pool[(pool.indexOf(line)+1)%pool.length]; st.lastLine=line; st.talks++; return line; }

function showWanderer(w, context="town"){
  if(!w) return;
  if(context==="town") currentTownWanderer=w.name;
  add(`${w.name.toUpperCase()} — WANDERER — LVL ${String(w.level).padStart(2,"0")}`,"bright");
  add(w.lines[Math.floor(Math.random()*w.lines.length)]);
  add(context==="road" ? "SMALL TALK   INSPECT   FIGHT   MOVE ON" : "SMALL TALK   INSPECT   FIGHT   LEAVE", "system");
}
function showWanderersAt(spot){
  const here=wanderers.filter(w=>wandererAlive(w)&&wandererLocations[w.name]===spot);
  currentTownWanderer=null; if(!here.length) return;
  const w=here[Math.floor(Math.random()*here.length)]; currentTownWanderer=w.name;
  add(`${w.name} is here.`);
}
function showRoadWanderer(){
  let pool=wanderers.filter(w=>wandererAlive(w) && wandererSerial-ws(w.name).lastSeen>=6);
  if(!pool.length) pool=wanderers.filter(w=>wandererAlive(w));
  const unseen=pool.filter(w=>!ws(w.name).met); if(unseen.length) pool=unseen;
  const w=v50WeightedWanderer(pool); if(!w){stage="between";showEncounter();return;}
  const st=ws(w.name), first=!st.met; st.met=true; st.lastSeen=wandererSerial++; currentRoadWanderer=w.name;
  add(""); add(`ROAD TURN ${dailyRoadTurns} — WANDERER`,"place");
  add(first?"Another stretch of Route 127 disappears behind you. Someone unfamiliar is ahead on the road.":`A familiar figure is ahead. ${w.name} recognizes you too.`);
  showWanderer(w,"road"); stage="wandererRoad";
}
wandererLocations=rollWandererLocations();

const encounters = [
  {title:"COUNTY WORK TRUCK",text:"A maintenance truck leans into a ditch. Its glovebox is ajar, and muddy tracks run toward the tree line.",choices:"CHECK GLOVEBOX   FOLLOW TRACKS   SEARCH BED   MOVE ON",resolve(cmd){if(cmd.includes("glove")){addPack("Bandage","consumable");gainXp(7);add("A sealed first-aid pouch remains.");}else if(cmd.includes("tracks")||cmd.includes("follow")){gainXp(9);add("Heavy bootprints vanish into the undergrowth. You decide not to follow farther.");}else if(cmd.includes("bed")||cmd.includes("search")){gainBolts(6);gainXp(6);add("Six Bolts roll out of an overturned parts bin.");}else return false;return true;}},
  {title:"WASHOUT SALVAGE",text:"Rain has peeled back the shoulder, revealing a half-buried toolbox and a broken utility cable.",choices:"OPEN TOOLBOX   STRIP CABLE   CHECK MUD   MOVE ON",resolve(cmd){if(cmd.includes("tool")){gainBolts(7);gainXp(7);add("Seven Bolts are packed inside an oily rag.");}else if(cmd.includes("cable")||cmd.includes("strip")){addPack("Wire","material");gainXp(7);add("You recover a usable coil of wire.");}else if(cmd.includes("mud")||cmd.includes("check")){gainXp(8);add("Someone hauled a heavy machine part through here recently.");}else return false;return true;}},

  { title:"THE GAS STATION", text:"The old station has been stripped nearly bare. Behind the counter, a steel drawer hangs open. A vending machine leans against the far wall, and the service bay door is half raised.", choices:"SEARCH DRAWER   SMASH VENDING MACHINE   CHECK SERVICE BAY   MOVE ON",
    resolve(cmd){ if(cmd.includes("drawer")){gainBolts(7);gainXp(8);add("Seven usable bolts rattle into your palm.");} else if(cmd.includes("vending")||cmd.includes("smash")){hurt(3);gainBolts(11);gainXp(10);add("The machine gives up eleven bolts and takes some skin in return.");} else if(cmd.includes("service")||cmd.includes("bay")){addPack("Scrap Metal");gainBolts(3);gainXp(8);add("Mostly junk, but the bay still has salvage.");} else return false; return true;} },
  { title:"ABANDONED SEDAN", text:"A sedan sits nose-first in the ditch. The driver's door hangs open. The trunk is shut tight, and a dark stain disappears beneath the rear bumper.", choices:"SEARCH CABIN   FORCE TRUNK   CHECK UNDER CAR   MOVE ON",
    resolve(cmd){ if(cmd.includes("cabin")){addPack("Cloth");gainBolts(3);gainXp(8);} else if(cmd.includes("trunk")||cmd.includes("force")){hurt(2);gainBolts(6);addPack("Bandage","consumable");gainXp(12);add("The latch finally snaps. Worth it.");} else if(cmd.includes("under")){addPack("Fuel","material");gainXp(8);add("A sealed maintenance bottle is wedged under the frame.");} else return false; return true;} },
  { exclusive:true, title:"ROADBLOCK", text:"Two wrecks have been dragged across the road. Fresh boot prints cross the mud. A drainage ditch skirts the barricade, while the hillside above offers a longer route around.", choices:"CLIMB OVER   TAKE DITCH   CIRCLE HILLSIDE",
    resolve(cmd){ if(cmd.includes("climb")||cmd.includes("over")){hurt(4);gainXp(7);add("Broken glass bites your palm, but you cross quickly.");} else if(cmd.includes("ditch")){add("You stay low and pass unseen, boots filling with filthy water.");gainXp(4);} else if(cmd.includes("hill")||cmd.includes("circle")){add("It takes longer, but you spot the road ahead before anyone spots you.");gainXp(3);} else return false; return true;} },
  { title:"MAINTENANCE BOX", text:"A county maintenance box survives beneath a bent guardrail. The lock has rusted away. Nearby, an old utility pole has spilled cable across the weeds.", choices:"OPEN BOX   STRIP CABLE   SEARCH SHOULDER   MOVE ON",
    resolve(cmd){ if(cmd.includes("box")||cmd.includes("open")){gainBolts(9);addPack("Wire");gainXp(8);} else if(cmd.includes("cable")||cmd.includes("strip")){addPack("Wire","material",2);gainBolts(2);gainXp(8);} else if(cmd.includes("shoulder")){addPack("Scrap Metal");gainXp(8);} else return false; return true;} },
  { exclusive:true, title:"THE STRAY", text:"A thin scavenger steps from behind a burned pickup with a knife held low. He looks more scared than you are. His eyes keep dropping to your pack.", choices:"FIGHT   OFFER RATION   WARN HIM OFF   BACK AWAY",
    resolve(cmd){ if(cmd.includes("fight")){hurt(8);gainXp(22);gainBolts(6);add("One hard swing ends it. He runs. His dropped pouch stays behind.");} else if(cmd.includes("ration")||cmd.includes("offer")){if(!hasItem("Energy Bars")){add("You reach for an energy bar you don't have.","system");return false;} removeItem("Energy Bars");gainXp(18);add("He takes the food, lowers the knife, and mutters: 'Solace gate's east. Avoid the culvert after dark.'");} else if(cmd.includes("warn")){gainXp(12);add("You raise the pipe and don't blink. Eventually, he decides you're not worth it.");} else if(cmd.includes("back")||cmd.includes("away")){add("You give him space. He gives you the road.");} else return false; return true;} },
  { title:"THE DARK CELLAR", text:"A collapsed roadside house has one thing intact: a cellar door. Cold air breathes through the gap. Below it is absolute darkness. Something metallic scrapes once, then stops.", choices:"", 
    prompt(){ return hasItem("Battered Flashlight") ? "USE FLASHLIGHT   ENTER IN DARK   SEARCH OUTSIDE   MOVE ON" : "ENTER IN DARK   SEARCH OUTSIDE   MOVE ON"; },
    resolve(cmd){ if(cmd.includes("flash")){if(!hasItem("Battered Flashlight")) return false; gainBolts(12);addPack("Electronics");gainXp(18);add("The beam catches a broken shelving unit—and the loose sheet metal making the noise. You search safely.");} else if(cmd.includes("dark")||cmd.includes("enter")){hurt(14);gainBolts(7);gainXp(12);add("You find salvage by touch. You also find a jagged stair edge with your shin.");} else if(cmd.includes("outside")||cmd.includes("search")){gainBolts(3);addPack("Scrap Metal");gainXp(6);add("You stick to daylight and salvage the porch instead.");} else return false; return true;} },
  { title:"OLD BILLBOARD", text:"A billboard has collapsed across the shoulder. Someone painted a lantern inside a broken circle on the back. Beneath it: EAST. A second message has been scratched into the support post: SOLACE LIES.", choices:"STUDY LANTERN   READ SCRATCHING   SEARCH BASE   CONTINUE",
    resolve(cmd){ if(cmd.includes("lantern")||cmd.includes("study")){player.flags.billboard=true;gainXp(12);add("The faded symbol looks familiar. Same one you saw on the old computer that contacted you.");} else if(cmd.includes("scratch")||cmd.includes("read")){gainXp(8);add("Different hand. Older message. You file the warning away.");} else if(cmd.includes("base")||cmd.includes("search")){gainBolts(5);gainXp(5);add("Someone hid a few bolts beneath a loose stone.");} else return false; return true;} },
  { title:"THE TRAVELER", text:"A woman sits against a mile marker, one sleeve dark with blood. A small pack lies just beyond her reach. She watches you approach without asking for help.", choices:"USE BANDAGE   GIVE RATION   QUESTION HER   TAKE PACK   WALK AWAY",
    resolve(cmd){ if(cmd.includes("bandage")){if(!hasItem("Bandage")){add("You don't have a bandage.","system");return false;} removeItem("Bandage");player.flags.helpedTraveler=true;player.flags.travelerInSolace=true;gainXp(22);add("She tells you the Solace guards trade fair if you don't lie to them. 'Tell Mara that Vale sent you.'");} else if(cmd.includes("ration")||cmd.includes("give")){if(!hasItem("Energy Bars")){add("You don't have an energy bar to spare.","system");return false;} removeItem("Energy Bars");gainXp(15);add("She eats slowly and points east. 'You're close.'");} else if(cmd.includes("question")){gainXp(8);add("She gives you one useful word: Solace. Then closes her eyes.");} else if(cmd.includes("take")||cmd.includes("pack")){gainBolts(14);addPack("Wire");gainXp(8);add("She doesn't stop you. Somehow that makes it worse.","danger");} else if(cmd.includes("walk")||cmd.includes("away")){add("You keep walking. The mile marker disappears behind you.");} else return false; return true;} },
  { title:"RIDGELINE", text:"The road crests a long hill. For the first time you see walls in the distance—sheet metal, old buses, timber, smoke. A settlement. Off the shoulder, a wrecked utility truck still has one closed compartment.", choices:"HEAD FOR LIGHTS   SEARCH TRUCK   WATCH SETTLEMENT   WAIT",
    resolve(cmd){ if(cmd.includes("truck")||cmd.includes("search")){gainBolts(8);addPack("Scrap Metal");gainXp(10);add("You make one last salvage stop before the descent.");} else if(cmd.includes("watch")){gainXp(12);add("You count two guards, one gate, and smoke from at least a dozen chimneys.");} else if(cmd.includes("head")||cmd.includes("light")){add("You tighten your pack straps and start down the hill.");} else if(cmd.includes("wait")){add("You listen for gunfire. None comes. Eventually you move on.");} else return false; return true;} },
  { exclusive:true, title:"THE BIG MAN", text:"A broad-shouldered scavenger steps into the road. He is bigger than you by a lot, wearing a tire-tread vest and carrying a length of chain. He looks at your pack, then at you. 'Toll road.'", choices:"FIGHT HIM   PAY 6 BOLTS   BACK DOWN",
    resolve(cmd){ if(cmd.includes("fight")){ const dealt=rollDamage(); add(`You catch him once with the pipe for ${dealt} damage. It only makes him angry.`,"bright"); enemyHit(34,46); const stolen=Math.min(player.bolts,Math.floor(Math.random()*6)+5); player.bolts-=stolen; updateHud(); add(`You wake in the ditch. He took ${stolen} Bolts, but left you breathing.`,"danger"); gainXp(18);} else if(cmd.includes("pay")){ if(player.bolts<6){add("You don't have 6 Bolts.","system");return false;} player.bolts-=6;updateHud();gainXp(6);add("He weighs the bolts in his palm and waves you through.");} else if(cmd.includes("back")){add("You swallow your pride and take the long way around. Sometimes surviving is the win.");} else return false; return true;} },
  { title:"BROKEN MOTEL", text:"A six-room roadside motel sags toward the highway. Two doors stand open. A third is chained shut from the outside.", choices:"SEARCH ROOM 2   CHECK OFFICE   INSPECT CHAINED ROOM   MOVE ON",
    resolve(cmd){ if(cmd.includes("room 2")){hurt(5);gainBolts(8);gainXp(10);add("A rotten floorboard gives way, but an old toolbox pays for the bruise.");} else if(cmd.includes("office")){addPack("Energy Bars","consumable");gainXp(8);add("One sealed energy bar survives behind the desk.");} else if(cmd.includes("chain")){gainXp(8);add("A heavy chain loops twice through the handles and a battered padlock holds it tight. The door is reinforced from the outside.");add("Fresh scratches score the bottom of the frame—from the inside.","bright");add("You can’t tell whether something was trying to get in... or get out.");} else return false; return true;} },
  { exclusive:true, title:"HIGHWAY ROBBERS", text:"Two figures rise from behind the guardrail. One has a tire iron. The other has a homemade spear. 'Pack on the ground.'", choices:"FIGHT   THROW 5 BOLTS   RUN",
    resolve(cmd){ if(cmd.includes("fight")){const dealt=rollDamage();add(`Your pipe lands for ${dealt} damage.`,"bright");enemyHit(18,28);gainBolts(9);gainXp(24);add("They break first and disappear into the weeds.");} else if(cmd.includes("throw")){if(player.bolts<5){add("You need 5 Bolts to distract both robbers.","system");return false;}const paid=5;player.bolts-=paid;updateHud();add(`You scatter ${paid} Bolts across the pavement and move while they scramble for them.`);} else if(cmd.includes("run")){if(Math.random()<0.6){add("You break line of sight and escape both robbers without injury.");}else{hurt(15);add("The spear catches you hard before you escape.","danger");}} else return false;return true;} },
  { title:"DRAINAGE CULVERT", text:"Rainwater trickles through a concrete culvert beneath the highway. Something reflective glints twenty feet inside. The concrete around the entrance is slick with moss.", choices:"CLIMB INSIDE   REACH FROM EDGE   SEARCH BANK   MOVE ON",
    resolve(cmd){ if(cmd.includes("inside")){hurt(7);gainBolts(13);gainXp(12);add("You slip hard, but the glint is a pouch of machine hardware.");} else if(cmd.includes("reach")){gainBolts(4);gainXp(6);add("You snag only what you can reach without committing to the tunnel.");} else if(cmd.includes("bank")){addPack("Cloth");gainXp(5);add("A weatherproof scrap of fabric is tangled in the brush.");} else return false;return true;} },
  { exclusive:true, title:"ROACH NEST", text:"A rusted delivery van rocks once on its dead suspension. Then fist-sized roaches begin pouring from beneath it, antennae twitching toward you.", choices:"CRUSH THEM   KICK OPEN VAN   BACK AWAY",
    resolve(cmd){ if(cmd.includes("crush")){hurt(5);gainXp(25);gainBolts(8);add("The pipe makes ugly work of the swarm. A few usable bolts lie beneath the nest.");} else if(cmd.includes("kick")||cmd.includes("van")){hurt(9);gainXp(20);gainBolts(7);addPack("Scrap Metal");add("You crack the van open, fight through the nest, and salvage what's left inside.");} else if(cmd.includes("back")){add("You decide the van belongs to the roaches.");} else return false; return true;} },
  { exclusive:true, title:"TUNNEL RATS", text:"A pack of oversized rats spills from a storm drain and fans across the road. There are too many to ignore if you keep walking straight.", choices:"FIGHT PACK   CLIMB WRECK   THROW FOOD",
    resolve(cmd){ if(cmd.includes("fight")){hurt(12);gainXp(22);gainBolts(4);add("They swarm your boots until the pipe convinces the survivors to scatter.");} else if(cmd.includes("climb")||cmd.includes("wreck")){hurt(4);gainXp(10);add("You scramble onto a wreck and wait them out. One gets a bite in first.");} else if(cmd.includes("food")||cmd.includes("throw")){if(!hasItem("Energy Bars")){add("You don't have food to throw.","system");return false;} removeItem("Energy Bars");gainXp(12);add("The pack follows the food into the weeds. Effective, if expensive.");} else return false; return true;} },
  { exclusive:true, title:"FERAL DOG", text:"A scarred dog steps from the brush with its head low and teeth showing. This one is not asking to be rescued.", choices:"FIGHT DOG   OFFER FOOD   HOLD GROUND",
    resolve(cmd){ if(cmd.includes("fight")){hurt(15);gainXp(24);add("Fast, mean, and desperate. You drive it off before it can do worse.");} else if(cmd.includes("food")||cmd.includes("offer")){if(!hasItem("Energy Bars")){add("You don't have food to offer.","system");return false;} removeItem("Energy Bars");gainXp(16);add("The dog snatches the food and disappears into the brush.");} else if(cmd.includes("hold")){hurt(6);gainXp(14);add("You keep the pipe raised and refuse to run. After a long stare, it backs away.");} else return false; return true;} },
  { exclusive:true, title:"LONE SCAVENGER", text:"A scavenger is stripping copper from a wreck when he spots you. His hand drops to a short blade. Neither of you looks eager to share the shoulder.", choices:"FIGHT   OFFER TRADE   WARN HIM OFF",
    resolve(cmd){ if(cmd.includes("fight")){hurt(14);gainXp(25);gainBolts(8);add("He gives ground after two hard exchanges and leaves a pouch behind.");} else if(cmd.includes("trade")||cmd.includes("offer")){if(player.bolts<4){add("You need 4 Bolts to make the offer.","system");return false;} player.bolts-=4;updateHud();addPack("Wire");gainXp(12);add("Four Bolts buys a coil of stripped wire and a peaceful road.");} else if(cmd.includes("warn")){if(Math.random()<0.6){gainXp(10);add("You tap the pipe against the guardrail. He decides another wreck will do.");}else{hurt(7);gainXp(4);add("He lunges before backing off. The blade catches your arm, and neither of you gets the copper.","danger");}} else return false; return true;} },
  { exclusive:true, title:"GANG LOOKOUT", text:"A teenager in a patched road vest watches from an overpass with a hunting knife and a whistle. You spot him a second before he can signal whoever is nearby.", choices:"RUSH HIM   SNEAK AROUND   INTIMIDATE",
    resolve(cmd){ if(cmd.includes("rush")){hurt(10);gainXp(23);gainBolts(5);add("You reach him before the whistle does. He bolts, dropping a small hardware pouch.");} else if(cmd.includes("sneak")){add("You vanish through the drainage weeds before he gets a clean look at you.");} else if(cmd.includes("intimidate")){gainXp(16);add("You point the pipe at the whistle. He thinks better of testing you.");} else return false; return true;} },
  { exclusive:true, title:"THE CRAWLER", text:"Something pale shifts beneath an overturned station wagon. A long arm reaches into the daylight, followed by a shape that moves too quickly on all fours.", choices:"FIGHT CRAWLER   CLIMB BARRIER   RETREAT",
    resolve(cmd){ if(cmd.includes("fight")){hurt(19);gainXp(30);gainBolts(6);addPack("Chemicals");add("It finally stops moving. A scavenger's torn satchel nearby still holds useful chemicals.");} else if(cmd.includes("climb")||cmd.includes("barrier")){hurt(7);gainXp(15);add("You get over the concrete divider before it reaches you.");} else if(cmd.includes("retreat")){gainXp(5);add("You give the wreck a very wide berth. Whatever it is can keep the car.");} else return false; return true;} },
  { exclusive:true, title:"SECURITY DRONE", text:"A squat pre-collapse highway security unit twitches awake beside a ruined toll booth. One optic burns weak red. 'RESTRICTED... CORRIDOR... PRESENT... AUTHORIZATION.'", choices:"SMASH DRONE   CIRCLE BEHIND   MOVE ON",
    resolve(cmd){ if(cmd.includes("smash")||cmd==="fight drone"){hurt(22);gainXp(34);addPack("Electronics");gainBolts(8);add("The pipe dents more than it breaks, but eventually the old machine dies. Its control board is still salvageable.");} else if(cmd.includes("circle")||cmd.includes("behind")){if(Math.random()<0.65){gainXp(18);addPack("Wire","material");add("You slip behind its damaged optic and recover useful wiring without drawing fire.");}else{hurt(10);gainXp(9);add("The drone catches your movement and fires before you reach cover.","danger");}} else if(cmd.includes("move on")||cmd.includes("leave")){add("You leave the dormant security drone behind without disturbing it.");}else return false; return true;} },
  { exclusive:true, title:"THE WRECKERS", text:"Two raiders are stripping an ambulance on the shoulder. One notices you and rests a pry bar across his shoulder. 'Plenty here. None of it yours.'", choices:"FIGHT WRECKERS   BARGAIN   STEAL SUPPLIES",
    resolve(cmd){ if(cmd.includes("fight")){hurt(20);gainXp(32);gainBolts(10);addPack("Bandage","consumable");add("They run when the fight stops being easy. The ambulance gives up one clean bandage.");} else if(cmd.includes("bargain")){if(player.bolts<5){add("You need 5 Bolts to bargain.","system");return false;} player.bolts-=5;updateHud();addPack("Bandage","consumable");gainXp(12);add("Five Bolts buys a sealed bandage and no broken teeth.");} else if(cmd.includes("steal")){hurt(11);gainXp(24);addPack("Bandage","consumable");add("You grab a medical pouch and run. The thrown pry bar nearly ruins the plan.");} else return false; return true;} },
  { exclusive:true, title:"SOMETHING IN THE DRAIN", text:"A metal scraping sound follows you beneath a cracked section of highway. A maintenance grate shudders. Something on the other side is breathing.", choices:"OPEN GRATE   POKE WITH PIPE   WALK AROUND",
    resolve(cmd){ if(cmd.includes("open")){hurt(18);gainXp(28);gainBolts(9);add("The thing hits the grate harder than expected. You win the argument and find a dead scavenger's bolt pouch inside.");} else if(cmd.includes("poke")||cmd.includes("pipe")){hurt(8);gainXp(18);add("Bad idea. Useful information, but still a bad idea.","danger");} else if(cmd.includes("walk")||cmd.includes("around")){gainXp(4);add("You decide some mysteries deserve privacy.");} else return false; return true;} },
  {exclusive:true, title:"THE HANGING SHOES", text:"Shoes sway from a cable across the road. One pair has been tied with bright copper wire.", choices:"CUT DOWN SHOES   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("shoes") && !cmd.includes("cut")) return false; gainBolts(5);addPack("Wire","material");gainXp(9);add("You recover a length of copper wire and a small pouch tucked in a boot.");return true;}},
  {exclusive:true, title:"THE LAST MAIL", text:"A postal truck is wedged against a concrete barrier. Hundreds of envelopes carpet the floor.", choices:"SORT PARCELS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("parcels") && !cmd.includes("sort")) return false; gainBolts(5);addPack("Cloth","material");gainXp(9);add("A parcel contains a sealed roll of cloth and a few useful fasteners.");return true;}},
  {exclusive:true, title:"THE FALSE SHOULDER", text:"The asphalt shoulder looks solid until a pebble drops straight through it.", choices:"PROBE GROUND   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("ground") && !cmd.includes("probe")) return false; gainXp(11);add("You find a safe crossing and mark the sinkhole with white stones.");return true;}},
  {exclusive:true, title:"CEMETERY OF TIRES", text:"Stacks of tires form a maze beneath a collapsed overpass. Something metallic glints at its center.", choices:"ENTER MAZE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("maze") && !cmd.includes("enter")) return false; hurt(2);gainBolts(6);addPack("Scrap Metal","material");gainXp(12);add("A forgotten toolbox waits in the middle of the rubber walls.");return true;}},
  {exclusive:true, title:"THE HONEY JAR", text:"A beekeeper suit hangs in a dead orchard. Bees still crowd a hollow tree.", choices:"SMOKE HIVE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("hive") && !cmd.includes("smoke")) return false; hurt(3);gainBolts(10);gainXp(10);add("You coax the swarm aside and find a sealed jar of honey, traded later for Bolts.");return true;}},
  {exclusive:true, title:"SALT ON THE ROAD", text:"A perfect circle of salt surrounds an overturned chair. The tracks outside stop abruptly.", choices:"INSPECT CIRCLE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("circle") && !cmd.includes("inspect")) return false; gainBolts(8);gainXp(10);add("The chair hides a small tin of coins and a message: DO NOT SIT.");return true;}},
  {exclusive:true, title:"THE PAPER STORM", text:"A gust fills the highway with old court records. One sheet carries a map drawn on the back.", choices:"FOLLOW PAPERS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("papers") && !cmd.includes("follow")) return false; gainBolts(4);addPack("Scrap Metal","material");gainXp(11);add("The map leads to a dry culvert containing scrap.");return true;}},
  {exclusive:true, title:"THE CAROUSEL HORSE", text:"A chipped fiberglass horse stands in a ditch, bolted to a concrete slab.", choices:"EXAMINE BASE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("base") && !cmd.includes("examine")) return false; gainBolts(9);gainXp(9);add("The base conceals a rusted cash box full of usable fasteners.");return true;}},
  {exclusive:true, title:"THE LOCKED FREEZER", text:"A restaurant freezer lies in the sun with a padlock on its door. Something knocks inside when the wind blows.", choices:"BREAK PADLOCK   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("padlock") && !cmd.includes("break")) return false; hurt(2);gainBolts(4);addPack("Cloth","material");gainXp(10);add("The knocking was a loose shelf. The insulated lining can be salvaged.");return true;}},
  {exclusive:true, title:"THE BRIDGE TOLL", text:"An old man has painted a toll booth on a sheet of plywood. He insists payment can be a joke.", choices:"(T) TELL JOKE   (B) BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("joke") && !cmd.includes("tell")) return false; gainBolts(3);gainXp(10);add("He laughs at the worst joke he has heard in years and hands over a bolt for the effort.");return true;}},
  {exclusive:true, title:"THE RAIN BARREL", text:"A row of barrels catches runoff beneath a ruined greenhouse. One is filled with glass marbles.", choices:"SIFT MARBLES   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("marbles") && !cmd.includes("sift")) return false; gainBolts(3);addPack("Wire","material");gainXp(10);add("Under the marbles sits a watertight repair kit.");return true;}},
  {exclusive:true, title:"THE BURNT LIBRARY", text:"Books spill from a scorched bookmobile. One shelf has escaped the flames.", choices:"SALVAGE BOOKS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("books") && !cmd.includes("salvage")) return false; addPack("Bandage","consumable");gainXp(13);add("You find a field guide with practical first-aid notes.");return true;}},
  {exclusive:true, title:"THE GARDEN GNOMES", text:"Dozens of painted gnomes face the same empty window. Fresh soil surrounds the smallest.", choices:"DIG NEAR GNOME   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("gnome") && !cmd.includes("dig")) return false; if(Math.random()<0.3){hurt(6);gainXp(4);add("A rusted snare snaps around your wrist beneath the fresh soil. You wrench free before reaching the stash.","danger");}else{gainBolts(11);gainXp(8);add("Someone buried a stash of Bolts beneath the smallest statue.");}return true;}},
  {exclusive:true, title:"THE MISSING STAIRS", text:"A stairwell rises from an empty foundation and ends at a door suspended in air.", choices:"CLIMB STAIRS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("stairs") && !cmd.includes("climb")) return false; if(Math.random()<0.4){hurt(12);gainXp(7);add("The rotten landing gives way. You tumble through the floor and crawl out bruised, without reaching the bag.","danger");}else{hurt(3);gainBolts(4);addPack("Cloth","material");gainXp(12);add("The landing creaks but holds. Behind the doorframe you recover a forgotten canvas bag.");}return true;}},
  {exclusive:true, title:"THE WASH LINE", text:"Clean bedsheets hang between two dead trees. No house stands within sight.", choices:"CHECK CLOTHESLINE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("clothesline") && !cmd.includes("check")) return false; addPack("Cloth","material");gainXp(10);add("The sheets are patched with surprisingly durable cloth.");return true;}},
  {exclusive:true, title:"THE PAINTED ARROWS", text:"Bright arrows have been painted across the pavement, each pointing in a different direction.", choices:"FOLLOW BLUE ARROW   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("arrow") && !cmd.includes("follow")) return false; gainBolts(7);gainXp(12);add("The blue arrow ends at a hidden cache under a guardrail.");return true;}},
  {exclusive:true, title:"THE WHEELBARROW", text:"A wheelbarrow full of stones sits in the center lane. A steel case is buried underneath.", choices:"UNLOAD STONES   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("stones") && !cmd.includes("unload")) return false; if(Math.random()<0.35){hurt(9);gainXp(8);add("A snake coils beneath the stones and strikes your hand. You retreat before reaching the case.","danger");}else{hurt(2);gainBolts(5);addPack("Scrap Metal","material");gainXp(12);add("You lift the stones carefully, avoid a sleeping snake, and claim the case of salvaged fittings.");}return true;}},
  {exclusive:true, title:"THE SILENT PICNIC", text:"A picnic blanket holds four empty plates and a chessboard midgame. The food is long gone.", choices:"STUDY CHESSBOARD   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("chessboard") && !cmd.includes("study")) return false; gainBolts(6);gainXp(10);add("A hollow chess piece hides a handful of Bolts.");return true;}},
  {exclusive:true, title:"THE COIN WELL", text:"A roadside wishing well has dried out. Its bottom glitters with offerings.", choices:"(D) DESCEND WELL   (B) BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("well") && !cmd.includes("descend")) return false; hurt(4);gainBolts(12);gainXp(12);add("You climb back up with a fistful of hardware and scraped knuckles.");return true;}},
  {exclusive:true, title:"THE FENCE ARTIST", text:"Someone has woven a giant bird from scrap into a chain-link fence.", choices:"INSPECT SCULPTURE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("sculpture") && !cmd.includes("inspect")) return false; gainBolts(2);addPack("Scrap Metal","material");gainXp(10);add("A removable wing makes a useful strip of metal.");return true;}},
  {exclusive:true, title:"THE MILK CRATES", text:"A pyramid of crates blocks a driveway. A ratty flag marks the top.", choices:"SHIFT CRATES   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("crates") && !cmd.includes("shift")) return false; gainBolts(2);addPack("Energy Bars","consumable");gainXp(10);add("You find a wrapped emergency ration beneath the bottom crate.");return true;}},
  {exclusive:true, title:"THE DRY FOUNTAIN", text:"A cracked fountain holds thousands of bottle caps arranged into a spiral.", choices:"TRACE SPIRAL   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("spiral") && !cmd.includes("trace")) return false; gainBolts(8);gainXp(12);add("The spiral points to a loose stone hiding Bolts.");return true;}}
];

const eastEncounters = [
  {exclusive:true, title:"THE IRON HARVEST", text:"A combine crawls across an empty field, blades still spinning without a driver.", choices:"DISABLE BLADES   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("blades") && !cmd.includes("disable")) return false; hurt(9);gainBolts(12);addPack("Scrap Metal","material");gainXp(23);add("You jam its belt with a fallen branch and strip its casing.");return true;}},
  {exclusive:true, title:"THE GLASS FIELD", text:"An ancient fire fused the soil into jagged green glass. A supply box sits on the far side.", choices:"CROSS GLASS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("glass") && !cmd.includes("cross")) return false; hurt(7);gainBolts(12);addPack("Bandage","consumable");gainXp(20);add("You reach the box but slice your sleeve on the way.");return true;}},
  {exclusive:true, title:"THE BURIED FREIGHT", text:"A freight carriage protrudes from a hillside. Cargo containers lean at impossible angles.", choices:"PRY CARGO   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("cargo") && !cmd.includes("pry")) return false; hurt(8);gainBolts(15);addPack("Scrap Metal","material");gainXp(22);add("You recover a sealed crate of useful salvage.");return true;}},
  {exclusive:true, title:"THE RED RAIN", text:"Rust-colored rain sweeps across the road, stinging exposed skin.", choices:"FIND SHELTER   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("shelter") && !cmd.includes("find")) return false; hurt(4);gainBolts(7);addPack("Cloth","material");gainXp(20);add("You wait beneath a concrete lip and find an old cache there.");return true;}},
  {exclusive:true, title:"THE ASH PROCESSION", text:"Figures in ash-coated protective suits carry an empty coffin toward the hills.", choices:"FOLLOW PROCESSION   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("procession") && !cmd.includes("follow")) return false; gainBolts(14);gainXp(22);add("Their path passes a sheltered supply dump. They never acknowledge you.");return true;}},
  {exclusive:true, title:"THE COLLAPSED DAM", text:"Water surges through a broken spillway beside the highway.", choices:"CROSS SPILLWAY   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("spillway") && !cmd.includes("cross")) return false; hurt(9);gainBolts(13);addPack("Wire","material");gainXp(23);add("You leap a widening crack and find repair materials beyond it.");return true;}},
  {exclusive:true, title:"THE IRON CHOIR", text:"Wind makes hundreds of hanging engine valves ring like bells. A raider patrol is nearby.", choices:"SILENCE BELLS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("bells") && !cmd.includes("silence")) return false; hurt(5);gainBolts(16);gainXp(24);add("You tie off the valves and slip past the patrol to a stash.");return true;}},
  {exclusive:true, title:"THE FURNACE PIT", text:"A smoldering pit burns under an abandoned brickworks. Something valuable shines inside.", choices:"HOOK METAL   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("metal") && !cmd.includes("hook")) return false; hurt(8);gainBolts(10);addPack("Scrap Metal","material");gainXp(21);add("You pull out a forged bracket before the heat drives you away.");return true;}},
  {exclusive:true, title:"THE MASK MARKET", text:"Three masked traders auction items without speaking. Their bids are made with hand signs.", choices:"TRADE HAND SIGNS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("signs") && !cmd.includes("trade")) return false; gainBolts(17);gainXp(20);add("Your clumsy bid earns a laugh and a pouch of Bolts.");return true;}},
  {exclusive:true, title:"THE CRACKED AQUEDUCT", text:"A narrow aqueduct crosses the road overhead. The supports are buckling.", choices:"RUN UNDER ARCH   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("arch") && !cmd.includes("run")) return false; hurt(8);gainBolts(7);addPack("Wire","material");gainXp(24);add("Stone rains down behind you. You salvage a fallen tool pouch.");return true;}},
  {exclusive:true, title:"THE BONE FLAGS", text:"Polished bones hang from red flags at a ravine crossing.", choices:"SEARCH RAVINE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("ravine") && !cmd.includes("search")) return false; hurt(5);gainBolts(11);addPack("Cloth","material");gainXp(22);add("You uncover an abandoned expedition pack.");return true;}},
  {exclusive:true, title:"THE SCRAP DUEL", text:"Two armored scavengers settle a dispute by throwing sharpened hubcaps at targets.", choices:"CHALLENGE WINNER   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("winner") && !cmd.includes("challenge")) return false; hurt(6);gainBolts(20);gainXp(26);add("You win a small wager, though one hubcap clips your arm.");return true;}},
  {exclusive:true, title:"THE QUARRY LIFT", text:"An industrial lift hangs above a flooded quarry. Its hand crank still turns.", choices:"LOWER PLATFORM   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("platform") && !cmd.includes("lower")) return false; hurt(8);gainBolts(14);addPack("Scrap Metal","material");gainXp(23);add("The platform reaches a ledge with forgotten mining supplies.");return true;}},
  {exclusive:true, title:"THE BLACK SNOW", text:"Ash flakes fall like snow from a distant burn. Fresh bootprints appear through the dust.", choices:"TRACK FOOTPRINTS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("footprints") && !cmd.includes("track")) return false; hurt(4);gainBolts(16);gainXp(24);add("The prints lead to a hidden smuggler cache.");return true;}},
  {exclusive:true, title:"THE ROAD EATER", text:"A massive burrowing creature tears through the pavement ahead.", choices:"HIDE FROM BEAST   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("beast") && !cmd.includes("hide")) return false; gainXp(30);add("You survive by lying motionless as the road buckles nearby.");return true;}},
  {exclusive:true, title:"THE CHAIN BRIDGE", text:"A suspension footbridge swings over a dry gorge. Its middle planks are missing.", choices:"CROSS CHAINS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("chains") && !cmd.includes("cross")) return false; hurt(10);gainBolts(13);addPack("Wire","material");gainXp(25);add("You crawl the cables and claim a toolbox on the other side.");return true;}},
  {exclusive:true, title:"THE WELDED BUS", text:"A school bus has been welded into a crude armored bunker.", choices:"OPEN HATCH   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("hatch") && !cmd.includes("open")) return false; hurt(5);gainBolts(10);addPack("Bandage","consumable");gainXp(22);add("The bunker is abandoned, but its storage lockers remain intact.");return true;}},
  {exclusive:true, title:"THE WAX MUSEUM", text:"Life-size wax figures fill a shattered roadside attraction. One wears genuine armor.", choices:"STRIP MANNEQUIN   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("mannequin") && !cmd.includes("strip")) return false; hurt(3);gainBolts(9);addPack("Cloth","material");gainXp(22);add("The figure collapses into fragments as you recover its reinforced cloth.");return true;}},
  {exclusive:true, title:"THE STEEL ORCHARD", text:"Metal stakes stand in perfect rows where fruit trees once grew.", choices:"EXAMINE ROOTS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("roots") && !cmd.includes("examine")) return false; gainBolts(12);addPack("Scrap Metal","material");gainXp(21);add("The stakes conceal buried bolts and fasteners.");return true;}},
  {exclusive:true, title:"THE QUICKSAND CUT", text:"Fine gray silt covers a washed-out road. Half a wagon protrudes from the mud.", choices:"REACH WAGON   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("wagon") && !cmd.includes("reach")) return false; hurt(9);gainBolts(18);gainXp(23);add("You retrieve a pouch but lose your footing in the silt.");return true;}},
  {exclusive:true, title:"THE GRINDER CREW", text:"A salvage crew is feeding whole vehicles into an enormous hand-powered crusher.", choices:"BARGAIN FOR SCRAP   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("scrap") && !cmd.includes("bargain")) return false; gainBolts(8);addPack("Scrap Metal","material");gainXp(22);add("They sell you a box of offcuts for an unexpectedly fair price.");return true;}},
  {exclusive:true, title:"THE HOLLOW STATUE", text:"A giant concrete worker statue has fallen across the highway. Its chest is hollow.", choices:"ENTER STATUE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("statue") && !cmd.includes("enter")) return false; hurt(5);gainBolts(10);addPack("Wire","material");gainXp(24);add("Inside is a stash of tools left by an earlier traveler.");return true;}},
  {exclusive:true, title:"THE SALT MINERS", text:"A mining crew drags sleds of white mineral blocks across the road.", choices:"HELP PULL SLED   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("sled") && !cmd.includes("help")) return false; hurt(5);gainBolts(16);gainXp(24);add("The miners reward your effort with spare fittings.");return true;}},
  {exclusive:true, title:"THE CINDER WOLVES", text:"Heat-scarred predators stalk a charcoal forest, their eyes reflecting orange light.", choices:"SCARE PACK   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("pack") && !cmd.includes("scare")) return false; hurt(12);gainBolts(8);gainXp(28);add("You drive them off with noise but suffer a glancing bite.");return true;}},
  {exclusive:true, title:"THE BLADE CART", text:"A runaway handcart bristling with metal blades rolls downhill toward you.", choices:"DODGE CART   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("cart") && !cmd.includes("dodge")) return false; hurt(7);gainBolts(9);addPack("Scrap Metal","material");gainXp(24);add("It smashes into a barrier. You salvage its wheels.");return true;}},
  {exclusive:true, title:"THE EMPTY ARMORY", text:"A military bunker has been stripped clean except for a welded floor plate.", choices:"LIFT FLOOR PLATE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("plate") && !cmd.includes("lift")) return false; hurt(8);gainBolts(9);addPack("Bandage","consumable");gainXp(23);add("Beneath it sits a waterproof first-aid pouch.");return true;}},
  {exclusive:true, title:"THE BONE COLLECTOR", text:"A masked hunter carries trophies from creatures far larger than you.", choices:"KEEP DISTANCE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("distance") && !cmd.includes("keep")) return false; gainBolts(13);gainXp(27);add("You follow the hunter’s tracks to a dropped supply pouch, then leave quickly.");return true;}},
  {exclusive:true, title:"THE SUNKEN CHAPEL", text:"Only a chapel steeple rises above a muddy reservoir. A rope leads down inside.", choices:"DESCEND ROPE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("rope") && !cmd.includes("descend")) return false; hurt(10);gainBolts(19);gainXp(26);add("A dry alcove contains a sealed metal strongbox.");return true;}},
  {exclusive:true, title:"THE LIME FOG", text:"White industrial dust rolls across the road, hiding a steep drop.", choices:"FEEL FOR EDGE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("edge") && !cmd.includes("feel")) return false; hurt(6);gainBolts(8);addPack("Wire","material");gainXp(25);add("You navigate by touch and find a lost surveyor kit.");return true;}},
  {exclusive:true, title:"THE FIGHTING RING", text:"A circle of wrecked cars surrounds a bare-knuckle contest.", choices:"ENTER CONTEST   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("contest") && !cmd.includes("enter")) return false; hurt(19);gainBolts(24);gainXp(35);add("You survive three brutal rounds and collect the purse.");return true;}},
  {exclusive:true, title:"THE GATELESS WALL", text:"A huge defensive wall runs across the plain, but its gate was removed years ago.", choices:"CLIMB BREACH   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("breach") && !cmd.includes("climb")) return false; hurt(7);gainBolts(13);addPack("Scrap Metal","material");gainXp(24);add("You find abandoned sentry supplies atop the rubble.");return true;}},
  {exclusive:true, title:"THE TAR POOL", text:"A black pool bubbles beside the road. Metal objects protrude from its surface.", choices:"FISH FOR METAL   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("metal") && !cmd.includes("fish")) return false; hurt(10);gainBolts(10);addPack("Scrap Metal","material");gainXp(25);add("You snag a heavy toolbox but burn your hand on the tar.");return true;}},
  {exclusive:true, title:"THE RUST PARADE", text:"Scavengers push elaborate metal floats through the dust, celebrating a victory nobody remembers.", choices:"JOIN PARADE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("parade") && !cmd.includes("join")) return false; gainBolts(17);gainXp(23);add("You help push a float and receive a few Bolts for the effort.");return true;}},
  {exclusive:true, title:"THE KNIFE WIND", text:"A narrow canyon funnels sand sharp enough to strip paint.", choices:"COVER FACE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("face") && !cmd.includes("cover")) return false; hurt(8);gainBolts(12);addPack("Cloth","material");gainXp(25);add("You emerge scratched but recover a lost pack wedged in the rock.");return true;}},
  {exclusive:true, title:"THE WARDEN", text:"An armored enforcer orders everyone on the highway to kneel. His equipment is far beyond yours.", choices:"HIDE FROM WARDEN   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("warden") && !cmd.includes("hide")) return false; gainXp(35);add("You disappear into a drainage crack and wait for his patrol to pass.");return true;}},
  {exclusive:true, title:"THE OIL DERRICK", text:"A pumpjack moves slowly despite its broken drive belt. The ground trembles beneath it.", choices:"SEARCH SHED   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("shed") && !cmd.includes("search")) return false; hurt(7);gainBolts(14);addPack("Wire","material");gainXp(24);add("The shed holds old maintenance tools and a salvage tin.");return true;}},
  {exclusive:true, title:"THE CRANE NEST", text:"Giant birds have nested in the cab of a construction crane. Something shiny hangs from the nest.", choices:"CLIMB CRANE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("crane") && !cmd.includes("climb")) return false; hurt(13);gainBolts(20);gainXp(29);add("You retrieve a cache while the birds circle overhead.");return true;}},
  {exclusive:true, title:"THE COLD FOUNDRY", text:"A foundry floor is littered with unfinished iron castings and shattered molds.", choices:"SEARCH MOLDS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("molds") && !cmd.includes("search")) return false; hurt(5);gainBolts(11);addPack("Scrap Metal","material");gainXp(24);add("You find a usable metal bracket beneath the slag.");return true;}},
  {exclusive:true, title:"THE MUD CANNON", text:"A pressurized pipe erupts from a flooded excavation, hurling mud across the highway.", choices:"CLOSE VALVE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("valve") && !cmd.includes("close")) return false; hurt(9);gainBolts(11);addPack("Wire","material");gainXp(26);add("You shut it down and recover the crew’s forgotten tools.");return true;}},
  {exclusive:true, title:"THE HANGING CAGE", text:"A steel cage swings from a highway gantry. The door is open, and a locked chest sits inside.", choices:"REACH CHEST   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("chest") && !cmd.includes("reach")) return false; hurt(12);gainBolts(22);gainXp(29);add("You retrieve the chest as the cable starts to fray.");return true;}},
  {exclusive:true, title:"THE DUST HORSES", text:"A herd of feral horses races across the road, pursued by a distant fire.", choices:"CLEAR THEIR PATH   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("path") && !cmd.includes("clear")) return false; gainBolts(12);addPack("Cloth","material");gainXp(25);add("You move debris and discover a dropped saddlebag after they pass.");return true;}},
  {exclusive:true, title:"THE SHATTERED SILO", text:"A grain silo split down the middle. Its surviving staircase twists upward.", choices:"CLIMB SILO   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("silo") && !cmd.includes("climb")) return false; hurt(10);gainBolts(11);addPack("Bandage","consumable");gainXp(26);add("A high platform holds an old emergency supply box.");return true;}},
  {exclusive:true, title:"THE FORGOTTEN ARENA", text:"Concrete bleachers surround a pit filled with scavenged armor.", choices:"SEARCH BLEACHERS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("bleachers") && !cmd.includes("search")) return false; hurt(6);gainBolts(18);gainXp(25);add("A spectator cache still holds a pouch of bolts.");return true;}},
  {exclusive:true, title:"THE LAST ORCHARD", text:"A single fruit tree grows inside a barricade of sharpened metal.", choices:"ENTER ORCHARD   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("orchard") && !cmd.includes("enter")) return false; hurt(8);gainBolts(10);addPack("Scrap Metal","material");gainXp(25);add("The fruit is inedible, but the barricade contains useful salvage.");return true;}}
];


// v35: explicit action keys keep these branching events unambiguous.
function beginnerEvent(title, text, actions, combat=null){
  return {title,text,exclusive:true,minLevel:1,maxLevel:10,
    choices:[...Object.keys(actions),"MOVE ON"].join("   "),combat,
    resolve(cmd){const action=actions[cmd.toUpperCase()];return action ? action()!==false : false;}};
}
function roadLoot(name,type="material",qty=1){return addPack(name,type,qty);}
function roadTrade(name,type,cost){
  const existing=player.pack.find(i=>i.name===name&&i.type===type);
  if(player.bolts<cost){add(`You need ${cost} Bolts.`,"system");return false;}
  if(!existing&&packSlotsUsed()>=player.packMax){add("Your backpack is full. Nothing traded.","system");return false;}
  if(!addPack(name,type))return false;
  player.bolts-=cost;updateHud();return true;
}
const beginnerAdditions=[
  beginnerEvent("IRRADIATED ROACHES","Pale, swollen roaches crowd a split flour sack beside a bakery van. The far shoulder is clear.",{
    "FIGHT SWARM":()=>true,
    "DRAW THEM AWAY":()=>{add("You roll the flour sack into the ditch. The swarm follows its dinner.");gainXp(9);},
    "SEARCH FAR SHOULDER":()=>{add("You stay well clear of the nest and find a dropped repair tin.");gainBolts(3);gainXp(5);}
  },{action:"FIGHT SWARM",name:"IRRADIATED ROACH SWARM",level:2,hp:18,min:2,max:5,xp:20,bolts:4,end:"The surviving roaches scatter beneath the van."}),
  beginnerEvent("RATS IN THE PANTRY","A tipped roadside food cart rattles with movement. Thick-tailed rats gnaw at a crate inside.",{
    "FIGHT RATS":()=>true,
    "LURE WITH RATION":()=>{if(!hasItem("Energy Bars")){add("You have no ration to spare.","system");return false;}removeItem("Energy Bars");add("You toss food well away from the cart and salvage a wrapped dressing.");roadLoot("Bandage","consumable");gainXp(14);},
    "WAIT ON ROOF":()=>{add("You wait on the cart's roof. Eventually the rats wander off; the crate is empty.");}
  },{action:"FIGHT RATS",name:"MUTATED PANTRY RATS",level:2,hp:22,min:3,max:6,xp:22,bolts:3,end:"The rats abandon the cart."}),
  beginnerEvent("THE SCRAP CLAIM","A hostile scavenger kicks your boot away from a spilled toolbox. 'My claim. Your problem.'",{
    "FIGHT CLAIMANT":()=>true,
    "OFFER FOUR BOLTS":()=>{if(!roadTrade("Scrap Metal","material",4))return false;add("Four Bolts buys a strip of metal and an end to the argument.");},
    "WARN AND WITHDRAW":()=>{add("You keep the pipe visible while backing out. The toolbox stays his.");gainXp(6);}
  },{action:"FIGHT CLAIMANT",name:"SCRAP CLAIMANT",level:3,hp:25,min:4,max:7,xp:24,bolts:6,end:"He abandons the claim and limps away."}),
  beginnerEvent("DOG AT THE DEN","A brindled dog guards a hollow beneath an old bus. Tiny paws move in the shadows behind her.",{
    "LEAVE A RATION":()=>{if(!hasItem("Energy Bars")){add("You have no food to leave.","system");return false;}removeItem("Energy Bars");add("You leave food and give the den space. She never leaves the pups.");gainXp(15);},
    "CIRCLE THE DEN":()=>{add("You take the far shoulder. She watches until you are gone.");},
    "FIGHT GUARD DOG":()=>true
  },{action:"FIGHT GUARD DOG",name:"DEN GUARD DOG",level:3,hp:24,min:4,max:7,xp:18,bolts:0,end:"She retreats beneath the bus. You leave the den alone."}),
  beginnerEvent("THE LIMPING HOUND","A limping hound trails you at a distance. It stops whenever you turn and makes no move to attack.",{
    "OFFER FOOD":()=>{if(!hasItem("Energy Bars")){add("You have no food to offer.","system");return false;}removeItem("Energy Bars");add("It takes the food, then noses a discarded satchel before slipping into the grass.");gainBolts(4);gainXp(14);},
    "FOLLOW AT DISTANCE":()=>{if(Math.random()<.5){add("Its trail passes a torn coat with one good pocket.");roadLoot("Cloth");gainXp(9);}else{add("The hound beds down beneath a hedge. You let it rest.");gainXp(6);}},
    "HOLD STILL":()=>{add("It sniffs the air, decides you are uninteresting, and moves on.");}
  }),
  beginnerEvent("BROKEN CLEANER BOT","A knee-high street-cleaning robot circles a pothole, sweeping the same patch of dust. Its cracked battery indicator blinks red; the motor is audibly slowing, but its brush still throws sparks on concrete.",{
    "FIGHT CLEANER":()=>true,
    "JAM BRUSH WITH STICK":()=>{if(Math.random()<.7){add("A fallen stick jams the brush. You unbolt the dead motor housing.");roadLoot("Scrap Metal");gainBolts(4);gainXp(13);}else{add("The brush snaps the stick. You step clear of the flying splinter.");hurt(3);gainXp(7);}},
    "WAIT FOR BATTERY":()=>{add("You keep your distance until the failing battery drains. The brush stops; you collect three loose Bolts without a fight.");gainBolts(3);}
  },{action:"FIGHT CLEANER",name:"MALFUNCTIONING CLEANER",level:2,hp:20,min:2,max:6,xp:20,bolts:5,end:"The cleaner tips over. Its brush finally stops."}),
  beginnerEvent("THE DITCH BACKPACK","A faded backpack hangs from a thorn bush. No tracks lead away from it.",{
    "SEARCH POCKETS":()=>{if(Math.random()<.55){add("A waterproof pocket holds a clean bandage.");roadLoot("Bandage","consumable");gainXp(10);}else{add("The pockets hold a few useful fasteners.");gainBolts(5);gainXp(8);}},
    "SALVAGE STRAPS":()=>{add("The canvas is ruined but the straps are sound.");roadLoot("Cloth");gainXp(7);}
  }),
  beginnerEvent("STONES UNDER THE OAK","Three flat stones form a deliberate triangle beneath an oak. One sits on freshly disturbed soil.",{
    "LIFT MARKED STONE":()=>{add("A buried biscuit tin holds someone's spare hardware. No trap, no bones.");gainBolts(6+Math.floor(Math.random()*4));gainXp(11);},
    "LEAVE A MARK":()=>{add("You mark the cache for another traveler and leave it sealed.");gainXp(5);}
  }),
  beginnerEvent("THE TIPPED DELIVERY TRUCK","A delivery truck lies on its side. The cab is stable; its cargo door hangs over a shallow drop.",{
    "SEARCH STABLE CAB":()=>{add("You find a small roll of cloth in the glove box.");roadLoot("Cloth");gainBolts(2);gainXp(8);},
    "PRY CARGO DOOR":()=>{if(Math.random()<.6){add("The door holds. A sealed emergency ration waits in a crate.");roadLoot("Energy Bars","consumable");gainBolts(4);gainXp(14);}else{add("The hinge gives way. You jump back with scraped knuckles and an empty hand.");hurt(5);gainXp(8);}}
  }),
  beginnerEvent("COLD ROAD CAMP","A fire ring, folded tarp, and two empty mugs mark a forgotten roadside camp. Rain has washed the tracks away.",{
    "CHECK FIRE RING":()=>{add("A cooking tin buried in the cold ash holds five Bolts.");gainBolts(5);gainXp(7);},
    "UNFOLD TARP":()=>{add("The tarp is dry beneath the fold. Useful cloth survives.");roadLoot("Cloth");gainXp(8);},
    "READ CARVED NAMES":()=>{add("Two names and a date are carved into a stump. Someone made a home here for a night.");gainXp(6);}
  }),
  beginnerEvent("THE LOCKED TOOL CHEST","A steel tool chest sits on a porch. Its hinge is rusty; its lock is still solid.",{
    "WORK THE HINGE":()=>{if(Math.random()<.65){add("Patient pressure frees the hinge. You recover wire and fasteners.");roadLoot("Wire");gainBolts(5);gainXp(12);}else{add("The hinge will not move. You stop before your pipe bends.");gainXp(5);}},
    "SMASH THE LOCK":()=>{add("The lock breaks, but so does the brittle lid. A sharp edge catches your hand.");hurt(4);gainBolts(7);gainXp(10);}
  }),
  beginnerEvent("PRINTS IN THE MUD","Bare footprints cross the shoulder. Each has six toes. They lead toward a dry ditch, then vanish.",{
    "FOLLOW THE PRINTS":()=>{if(Math.random()<.5){add("A scrap of discarded fabric snags a branch where the trail ends. No creature waits there.");roadLoot("Cloth");gainXp(10);}else{add("The mud gives way beneath your foot. You scramble clear of the ditch, but the trail is lost.");hurt(5);gainXp(4);}},
    "STUDY FROM ROAD":()=>{add("The stride is uneven. You identify a safer route around the ditch and keep your distance.");gainXp(3);}
  }),
  beginnerEvent("THE EMPTY BUS SHELTER","A bus shelter still has three seats and a timetable sun-faded to nothing. A tin sits beneath the middle seat.",{
    "OPEN THE TIN":()=>{add("Inside is a sealed ration and a child's drawing of a bus that never came.");roadLoot("Energy Bars","consumable");gainXp(9);},
    "STUDY TIMETABLE":()=>{add("Every bus once stopped here at 6:15. The ordinary certainty feels stranger than the ruins.");gainXp(6);}
  }),
  beginnerEvent("TORN BACKPACK","A torn canvas backpack hangs from a guardrail. Its seams are still intact.",{
    "SALVAGE THE STRAPS":()=>{add("You cut free sturdy canvas straps.");roadLoot("Cloth");gainXp(7);},
    "SEARCH HIDDEN POCKET":()=>{if(Math.random()<0.6){add("A concealed lining holds usable wire.");roadLoot("Wire");gainXp(9);}else{add("A rusted needle catches your finger. The pocket is empty.","danger");hurt(3);gainXp(3);}}
  }),
  beginnerEvent("BROKEN RADIO","A cracked portable radio rests on a concrete barrier. Its battery compartment is swollen shut.",{
    "SALVAGE THE CIRCUIT":()=>{if(Math.random()<0.65){add("You recover a coil of wire without disturbing the battery.");roadLoot("Wire");gainXp(10);}else{add("The corroded battery leaks. You drop the radio before recovering anything.","danger");hurt(4);gainXp(3);}},
    "REMOVE THE CASING":()=>{add("The metal casing yields a useful piece of scrap.");roadLoot("Scrap Metal");gainXp(6);}
  }),
  beginnerEvent("THE SPRAINED RUNNER","A traveler sits beside a broken handcart, rubbing a swollen ankle. 'Just need it wrapped. No knives, no tricks.'",{
    "GIVE A BANDAGE":()=>{if(!hasItem("Bandage")){add("You have no bandage to give.","system");return false;}removeItem("Bandage");add("You wrap the ankle. The runner gives you spare cart fittings and promises to find shelter.");gainBolts(4);gainXp(18);},
    "MAKE A WALKING STICK":()=>{add("You brace a straight branch against the cart and help the runner stand. The splint takes time, but they can reach shelter without using your medical supplies.");gainXp(9);},
    "IGNORE THE RUNNER":()=>{add("You pass without stopping. The cart's wheel creaks behind you.");}
  }),
  beginnerEvent("SCRATCHING IN THE SHED","Something scratches inside a roadside shed. The roof is sound, and a gap beneath the door admits daylight.",{
    "PEER THROUGH GAP":()=>{add("A rabbit is trapped behind a tipped rake. You lift the door enough for it to escape.");gainXp(10);},
    "OPEN THE DOOR":()=>{if(Math.random()<.5){add("A rabbit bolts between your boots. A repair pouch hangs from a peg.");gainBolts(5);roadLoot("Wire");gainXp(12);}else{add("A loose rake falls across the doorway. Nothing attacks, but you bruise your wrist.");hurt(3);gainXp(8);}}
  }),
  beginnerEvent("THE SAGGING FARMHOUSE","An abandoned farmhouse leans against its own chimney. A pantry is visible beyond a bowed doorway; the porch remains firm.",{
    "SEARCH THE PORCH":()=>{add("You stay outside and salvage a strip of metal from a broken bench.");roadLoot("Scrap Metal");gainXp(7);},
    "RISK THE PANTRY":()=>{if(Math.random()<.55){add("The floor holds long enough to reach a sealed first-aid pouch.");roadLoot("Bandage","consumable");gainBolts(6);gainXp(15);}else{add("A joist cracks. You retreat with a bruised leg before the floor collapses.");hurt(7);gainXp(9);}}
  }),
  beginnerEvent("THE WALKING PEDDLER","A peddler pushes a bicycle loaded with tins. 'Bandage, food, or a little honest conversation. Your choice.'",{
    "BUY RATION":()=>{if(!roadTrade("Energy Bars","consumable",6))return false;add("The ration is sealed. The peddler counts your Bolts once and moves on.");},
    "SELL ONE SCRAP":()=>{if(!hasItem("Scrap Metal")){add("You have no scrap to sell.","system");return false;}removeItem("Scrap Metal");gainBolts(4);add("A fair exchange. No knife appears.");},
    "APPROACH FOR TALK":()=>{add("The peddler recommends dry socks and short arguments. Useful advice from someone still walking.");}
  }),
  beginnerEvent("DUST OVER THE SCHOOLYARD","Dust rolls through an abandoned schoolyard. Beyond it, shapes move between swings that still rock in the wind.",{
    "SHELTER BY THE WALL":()=>{add("You wait behind the wall. The shapes resolve into deer; beneath your boot lies a dropped hardware pouch.");gainBolts(3);},
    "WATCH THE MOVEMENT":()=>{add("Deer cross between the swings. One stops beside a painted hopscotch grid before following the others.");},
    "PUSH THROUGH DUST":()=>{add("You cross quickly, face covered. Grit stings your eyes, but the road is clear.");hurt(10);gainXp(6);}
  })
];
encounters.push(...beginnerAdditions);

const encounterLevels={"THE STRAY":2,"THE BIG MAN":50,"HIGHWAY ROBBERS":4,"ROACH NEST":1,"TUNNEL RATS":2,"FERAL DOG":3,"LONE SCAVENGER":3,"GANG LOOKOUT":4,"THE CRAWLER":5,"SECURITY DRONE":5,"THE WRECKERS":5,"SOMETHING IN THE DRAIN":6};
const combatSpecs={
  "THE STRAY":{name:"THE STRAY",level:2,hp:20,min:2,max:5,xp:22,bolts:6,end:"The scavenger finally breaks and runs, dropping a small pouch behind."},
  "TUNNEL RATS":{name:"RAT PACK",level:2,hp:24,min:3,max:6,xp:22,bolts:4,end:"The last of the rats scatters into the drain."},
  "FERAL DOG":{name:"FERAL DOG",level:3,hp:22,min:4,max:8,xp:24,bolts:0,end:"The dog finally backs away and disappears into the brush."},
  "LONE SCAVENGER":{name:"SCAVENGER",level:3,hp:26,min:4,max:8,xp:25,bolts:8,end:"The scavenger gives ground and finally bolts into the weeds."},
  "HIGHWAY ROBBERS":{name:"HIGHWAY ROBBERS",level:4,hp:30,min:5,max:9,xp:24,bolts:9,enemies:[{name:"TIRE IRON ROBBER",hp:16,bolts:4},{name:"SPEAR ROBBER",hp:14,bolts:5}],end:"Both robbers are defeated."},
  "THE CRAWLER":{name:"CRAWLER",level:5,hp:34,min:6,max:10,xp:30,bolts:6,end:"The crawler spasms once and goes still."},
  "THE WRECKERS":{name:"WRECKERS",level:5,hp:36,min:6,max:10,xp:32,bolts:10,end:"The wreckers decide this stopped being easy and run."},
  "ROACH NEST":{name:"ROACH SWARM",level:1,hp:14,min:1,max:4,xp:25,bolts:8,end:"The surviving roaches vanish beneath the wreck."},
  "GANG LOOKOUT":{name:"GANG LOOKOUT",level:4,hp:18,min:5,max:9,xp:35,bolts:5,signalRounds:0,reinforcementsArrived:false,enemies:[{name:"LOOKOUT",hp:18,bolts:5}],end:"The gang lookout is defeated."},
  "SECURITY DRONE":{name:"SECURITY DRONE",level:5,hp:32,min:5,max:10,xp:30,bolts:7,end:"The drone gives one last electronic whine and goes dark."},
  "SOMETHING IN THE DRAIN":{name:"DRAIN CREATURE",level:6,hp:38,min:7,max:11,xp:34,bolts:9,end:"The scraping stops. Whatever was in the drain is no longer moving."}
};
const combatTriggers={"ROACH NEST":["crush"],"GANG LOOKOUT":["rush"],"SECURITY DRONE":["smash"],"SOMETHING IN THE DRAIN":["open"]};
function v555RollEquipmentDrop(){
  // Approved rarity distribution: Common 55%, Uncommon 30%, Rare 13%, Epic 2%.
  const roll=Math.random()*100;
  const rarity=roll<55?'common':roll<85?'uncommon':roll<98?'rare':'epic';
  const pool=Object.keys(GEAR).filter(name=>GEAR[name]&&GEAR[name].rarity===rarity&&['weapon','armor'].includes(GEAR[name].type));
  if(!pool.length)return null;
  return pool[Math.floor(Math.random()*pool.length)]||null;
}
function v555AwardEquipmentDrop(){
  const item=v555RollEquipmentDrop();
  if(!item)return false;
  if(addPack(item,GEAR[item].type)){
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
  if(addPack(pending[0],GEAR[pending[0]]?.type||'weapon')){
    const name=pending.shift();add(`CLAIMED EQUIPMENT DROP — ${gearLabel(name)}`,'reward');
    if(!pending.length)delete player.flags.pendingEquipmentDrops;
  }
  return true;
}
function startCombat(spec, source="encounter", townCost=false, openingAttack=false){
  if(townCost){ if(player.turns<=0){add("NO EXPEDITION TURNS REMAIN.","danger");return;} player.turns--; player.lifetimeTurns=(Number(player.lifetimeTurns)||0)+1; updateHud(); }
  combatState={...spec,hp:spec.hp,maxHp:spec.hp,source,bolts:Math.max(0,Number(spec.bolts)||0),enemies:spec.enemies?spec.enemies.map(e=>({...e})):undefined}; stage="combat";
  busy=true; input.disabled=true;
  add(`${spec.name} — LVL ${String(spec.level).padStart(2,"0")} — HP ${spec.hp}/${spec.hp}`,"bright");
  // Combat entry is a state transition, not a hidden extra attack. Always show the combat menu first.
  outputQueue=outputQueue.then(()=>{
    if(stage==="combat" && combatState){
      const line=hotkeyLine("ATTACK   USE ITEM   BACK OFF");
      addImmediate(line,"system");
      followOutput();
    }
    busy=false; input.disabled=false; input.focus();
  });
}
function handleCombat(cmd){
  const c=combatState; if(!c){stage="between";return;}
  if(cmd==="b"||cmd.includes("back")||cmd.includes("flee")||cmd.includes("run")){ add("You break contact before the fight gets worse."); combatState=null; if(c.source==="gateGuards"){stage="settlement";player.flags.solaceGateChallenge=true;add("The guard raises his weapon again. State your business or turn around.","man");add("STATE YOUR BUSINESS   (1) TERMINAL   (2) TRADE   (3) RELAY   (4) PASSING THROUGH   (5) FIGHT","system");} else if(c.source==="seaportLiberation"){portLiberationRetreat();} else if(c.source==="seaportRoadFight"){portCombatRetreat(c);} else if(c.source==="factoryFight"){factoryCombatRetreat(c); } else if(c.source==="jenBoss"){player.flags.jenQuest="raiders";completeRoadTurn();} else if(c.source==="houseBoss"){add("You retreat onto the porch. The occupant stays inside.");arriveHouse();} else if(c.source==="serviceBoss"){stage="serviceRoad";add("You retreat to the maintenance-yard fence.");add("CONTINUE UP ROAD   RETURN TO FORK","system");} else if(c.source==="roadWanderer"){currentRoadWanderer=null;completeRoadTurn();} else if(c.source==="townWanderer"){stage="mercy"; showCurrentContext();} else {completeRoadTurn();} return; }
  if(cmd==="u"||cmd==="i"||cmd.includes("use item")){ showCombatItems(); return; }
  if(cmd.startsWith("use ")){ useItem(cmd.slice(4)); add("(A) ATTACK   (U) USE ITEM   (B) BACK OFF","system"); return; }
  if(cmd==="a"||cmd==="f") cmd="attack"; if(!cmd.includes("attack")&&!cmd.includes("fight")&&!cmd.includes("hit")){add("(A) ATTACK   (U) USE ITEM   (B) BACK OFF","system");return;}
  const baseAttackDamage=rollDamage();
  const criticalChance=player.accessory==="Niko's Collar"?(GEAR["Niko's Collar"]?.critBonus||0):0;
  const critical=criticalChance>0 && Math.random()<criticalChance;
  const bleedChance=player.weapon==="Iron Reaper"?(GEAR["Iron Reaper"]?.bleedChance||0):0;
  const bleedProc=bleedChance>0 && Math.random()<bleedChance;
  const dealt=Math.max(1,Math.floor(baseAttackDamage*(critical?1.5:1))+(bleedProc?3:0)-(c.armorDef||0));
  if(critical)add("NIKO'S COLLAR FLARES — CRITICAL HIT!","legendary");
  if(bleedProc)add("IRON REAPER BLEED — the hooked edge opens a wound (+3 damage).","rare");
  let actualDamage=dealt;
  if(c.enemies?.length){
    const target=c.enemies.find(e=>e.hp>0);
    if(target){
      actualDamage=Math.min(dealt,target.hp);
      target.hp-=actualDamage;
      add(`${target.name}: ${target.hp} HP remaining.`,"bright");
      if(target.hp===0){target.defeated=true;add(`${target.name} drops ${target.bolts} Bolts.`,"reward");}
    }else actualDamage=0;
    c.hp=c.enemies.reduce((total,e)=>total+Math.max(0,e.hp),0);
  }else {actualDamage=Math.min(dealt,c.hp);c.hp=Math.max(0,c.hp-dealt);}
  add(`You swing the ${player.weapon.toLowerCase()} and connect.`);
  add("RESULT","system"); add(`YOU DEAL ${actualDamage}   ${c.name} HP ${c.hp}/${c.maxHp}`,"reward");
  if(c.hp<=0){ add(c.end||`${c.name} is finished.`); resultBuffer=[]; if(c.xp) gainXp(isDark()?Math.ceil(c.xp*1.1):c.xp); const victoryBolts=c.enemies?.length?c.enemies.filter(e=>e.defeated||e.hp===0).reduce((sum,e)=>sum+Math.max(0,Number(e.bolts)||0),0):c.bolts; if(victoryBolts) gainBolts(isDark()?Math.ceil(victoryBolts*1.1):victoryBolts); flushResults(); const source=c.source; combatState=null; if(source==="encounter"&&typeof v555AwardEquipmentDrop==="function")v555AwardEquipmentDrop(); if(source==="seaportLiberation"){portLiberationVictory();} else if(source==="seaportRoadFight"){portCombatWin(c);} else if(source==="factoryFight"){factoryCombatWin(c);} else if(source==="jenBoss"){player.flags.jenQuest="rescued";addPack("Runner's Token","quest");add("QUEST UPDATED — LAST CALL: You rescue Jen's runner and recover their token. Return to Jen.","reward");completeRoadTurn();} else if(source==="terribleBilly"){player.flags.terribleBillyBounty="proof";add("BOUNTY PROOF ACQUIRED — TERRIBLE BILLY IS DOWN. Return to Tim in Solace.","reward");completeRoadTurn();} else if(source==="houseBoss"){player.flags.houseQuest="cleared";if(player.flags.timHouseBounty==="active")player.flags.timHouseBounty="proof";stage="house";add("The occupant abandons the house. Beneath his blanket, one floorboard sits loose.");if(player.flags.timHouseBounty==="proof")add("BOUNTY PROOF ACQUIRED — Return to Tim in Solace.","reward");add("QUEST UPDATED — Lift the floorboard to claim the house.","reward");showHouseChoices();} else if(source==="serviceBoss"){player.flags.serviceBossDead=true;player.flags.serviceReward=true;const oldWeapon=player.weapon; player.weapon="Yardman\'s Wrench"; addPack(oldWeapon,"weapon"); updateHud();add("UNCOMMON — YARDMAN\'S WRENCH — DMG 11–18","uncommon");add(`Equipped. ${oldWeapon} moved to your backpack.`,"reward");add("The maintenance yard is quiet now. Beyond it, the road disappears beneath collapsed trees and concrete.");stage="serviceRoad";serviceRoadDepth=3;add(serviceRoadChoices(),"system");} else if(source==="roadWanderer"){v50WandererLoot(c.name);markWandererDead(c.name); currentRoadWanderer=null; completeRoadTurn();} else if(source==="townWanderer"){v50WandererLoot(c.name);markWandererDead(c.name); currentTownWanderer=null; stage="mercy";showCurrentContext();} else if(source==="gateGuards"){player.flags.solaceGateChallenge=false;player.flags.mercyDiscovered=true;player.flags.mainSolaceQuest="done";stage="mercy";mercyLocation="town";add("You force the gate guard to stand down. The gate opens, and Tim steps forward to meet you.","bright");if(!player.flags.solaceCheckpointSaved){player.flags.solaceCheckpointSaved=true;saveGame(activeSaveSlot);add("CHECKPOINT REACHED — SOLACE AUTOSAVED","reward");}mercyMenu();} else { completeRoadTurn(); } return; }
  // The lookout has three player attacks to blow his whistle. Defeating him
  // before that point prevents reinforcements; once signaled, the gang joins.
  if(c.name==="GANG LOOKOUT" && !c.reinforcementsArrived){
    c.signalRounds=(Number(c.signalRounds)||0)+1;
    if(c.signalRounds>=3 && c.enemies?.some(e=>e.name==="LOOKOUT" && e.hp>0)){
      c.reinforcementsArrived=true;
      c.enemies.push({name:"GANG LEADER",hp:35,bolts:9},{name:"GANG MEMBER A",hp:20,bolts:4},{name:"GANG MEMBER B",hp:20,bolts:4});
      c.maxHp+=75;
      c.hp=c.enemies.reduce((sum,e)=>sum+e.hp,0);
      add("The lookout sounds his whistle! Three gang members charge onto the road.","danger");
    }
  }
  if(typeof petCombatRound==="function")petCombatRound(c);
  // Multi-enemy encounters retaliate only with surviving enemies. Individual
  // attacks are capped at two per round; a defeated robber cannot strike.
  const attackers=c.enemies?.length?c.enemies.filter(e=>e.hp>0).slice(0,2):[null];
  let totalDamage=0;
  for(const attacker of attackers){
    // Yardman's slow wrench has a telegraphed heavy swing and a real miss chance.
    // Keep this local to the Service Road boss; Factory and Seaport combat are unchanged.
    if(c.source==="serviceBoss" && Math.random()<0.15){
      add("The Yardman swings wide. The wrench strikes concrete instead of you.","bright");
      continue;
    }
    const heavySwing=c.source==="serviceBoss" && Math.random()<0.20;
    const raw=heavySwing?13+Math.floor(Math.random()*4):Math.floor(Math.random()*(c.max-c.min+1))+c.min;
    if(heavySwing)add("The Yardman winds up a brutal overhead swing!","danger");
    const nightRaw=isDark()?Math.ceil(raw*1.15):raw;
    const dmg=Math.max(1,nightRaw-armorDefense()-(player.flags?.equippedPet==="Scrap Dog"?1:0));
    const inflicted=Math.min(dmg,Math.max(0,player.hp));
    player.hp=Math.max(0,player.hp-inflicted);totalDamage+=inflicted;
    if(attacker)add(`${attacker.name} attacks for ${inflicted} damage.`,"danger");
    if(player.hp===0)break;
  }
  updateHud();
  const reactions=["They come back at you before you can reset your footing.","The next exchange is fast and ugly.","They hesitate, then commit to another attack."];
  if(!c.enemies?.length)add(reactions[Math.floor(Math.random()*reactions.length)]);
  add("RESULT","system"); add(`YOU TAKE ${totalDamage}   YOUR HP ${player.hp}/${player.maxHp}`,"danger");
  if(player.hp<=0){ handlePlayerDeath(); return; }
  add("(A) ATTACK   (U) USE ITEM   (B) BACK OFF","system");
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
  add(`ROAD PROGRESS — STEP ${roadGoal==="east"&&player.flags.eastReturning?roadTripLength-roadTurn-1:Math.min(roadTurn+1,roadTripLength)} / ${roadTripLength} toward ${roadGoal==="mercy"?"Solace":roadGoal==="east"?(player.flags.eastReturning?"Solace":"the Factory"):"the old house"}.`,"system");
  if(!resumeSavedEncounter)showSteveAnnouncement();
  if(!resumeSavedEncounter && questRoadEvent()) return;
  player.flags.wandererRoadCooldown=player.flags.wandererRoadCooldown||0;
  if(player.flags.wandererRoadCooldown>0) player.flags.wandererRoadCooldown--;
  else if(!resumeSavedEncounter && Math.random()<0.30){ player.flags.wandererRoadCooldown=2; showRoadWanderer(); return; }
  resumeSavedEncounter=false;
  currentRoadWanderer=null;
  const e = currentEncounter();
  rememberEncounter(roadEncounterOrder[currentRoadEncounterIndex()]);
  if(!player.encounterDone[roadTurn]) player.encounterDone[roadTurn]=new Set();
  const lvl=(e.combat&&e.combat.level) || encounterLevels[e.title] || (roadGoal==="east"? (e.title==="THE WARDEN"?50:5+(roadTurn%6)):null);
  add(""); add(`ROAD TURN ${dailyRoadTurns} — ${e.title}${lvl?` — LVL ${String(lvl).padStart(2,"0")}`:""}`, "place");
  add(e.text);add("");const markerActions=renderRoadMarkerActions();add([encounterChoices(e),...markerActions].filter(Boolean).join("   "),"system");
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
    add("FORGE > Took you long enough. I've been expecting you.","bright");
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
  add('IDENTITY RECOGNIZED. Your arrival was anticipated.','bright');
  currentHotkeys={};numberedChoices={};queueChoiceLine('PROJECT RECORDS   FACTORY STATUS   PERSONNEL: FORGE   EXIT TERMINAL');
  player.flags.v49TerminalRead=true;
}
function v49TerminalRecord(which){
  if(which===1){
    add('ARCHIVE // TOMORROW PROJECT','place');
    add((player.flags.relayQuest==='complete'?'The Relay Station connection has been restored. ':'')+'This factory once supplied equipment for the Tomorrow Project.');
    add('Surviving records are incomplete. Several sections have been deliberately restricted.');
  }else if(which===2){
    add('FACILITY REPORT // FACTORY','place');
    add('Industrial routines continue despite the collapse. Workers have been observed repeating tasks without rest.');
    add('Some answer to the name NEW DOMINION. Their command structure and conditioning remain unverified.');
    add('EASTERN ROUTE: SEAPORT. ACCESS OBSTRUCTED. Further records are restricted.');
  }else{
    add('PERSONNEL // FORGE','place');
    add('FORMER ROLE: Tomorrow Project engineer. CURRENT LOCATION: workshop, ground floor.');
    add('NOTICE: Forge has been informed of your arrival. Report to him for workshop access.','bright');
  }
  currentHotkeys={};numberedChoices={};queueChoiceLine('PROJECT RECORDS   FACTORY STATUS   PERSONNEL: FORGE   EXIT TERMINAL');
}
function v49Forge(){
  stage='factoryForge';
  add('FORGE — WORKSHOP','place');
  if(!player.flags.v49TerminalRead){add('FORGE > That terminal in the corner woke up when you arrived. Read it first. Then come see me.','bright');}
  else add('FORGE > The terminal sent word you were coming. I used to build Tomorrow Project equipment. There is more to that archive than it is telling you.','bright');
  add('FORGE > The inner works still need to be made safe. Meanwhile, let me show you something useful.','bright');
  if(player.flags.v49RecipeBandage){
    add('FORGE > You know how to make reinforced dressings now. Murphy can help you make more with your own supplies.','system');
  }else if(!player.flags.v49Job && !player.flags.v49Kit){
    player.flags.v49Kit={cloth:2,scrap:1};
    v49Autosave();
    add('FORGE > Here is one practice kit: two Cloth and one Scrap Metal. It stays here on my bench. Insert it and try your hand.','reward');
  }else if(player.flags.v49Kit){add('FORGE > Your practice kit is waiting at the bench.','system');}
  add('(W) USE WORKBENCH   (T) TERMINAL   (B) BACK','system');
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
  if(player.level>=6)add('[3] IRON REAPER — 8 Scrap Metal, 4 Wire, 3 Cloth, 75 Bolts — 30 sec — 90% — LEVEL 6','system');
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
  add(`YOU HAVE: Cloth ${findItem('Cloth')?.qty||0}, Scrap Metal ${findItem('Scrap Metal')?.qty||0}, Wire ${findItem('Wire')?.qty||0}, Bolts ${player.bolts}`,'system');
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
      if((findItem('Cloth')?.qty||0)<recipe.cloth||(findItem('Scrap Metal')?.qty||0)<recipe.scrap||(findItem('Wire')?.qty||0)<(recipe.wire||0)||player.bolts<recipe.bolts){add('NOT ENOUGH MATERIALS OR BOLTS.','danger');v49MurphyRecipe(key);return true;}
      if(recipe.cloth)removeItem('Cloth',recipe.cloth);
      if(recipe.scrap)removeItem('Scrap Metal',recipe.scrap);
      if(recipe.wire)removeItem('Wire',recipe.wire);
      player.bolts-=recipe.bolts;updateHud();
      player.flags.v49MurphyJob={key,endsAt:Date.now()+recipe.seconds*1000,success:Math.random()<recipe.chance};
      v49Autosave();
      add('MURPHY > Materials in. Come back when the timer runs out.','bright');v49MurphyRecipe(key);return true;
    }
    if(['c','check','check timer','collect','collect result'].includes(cmd)){
      if(!job){v49MurphyRecipe(key);return true;}
      if(Date.now()<job.endsAt){v49MurphyRecipe(key);return true;}
      if(job.success){
        if(!addPack(recipe.name,recipe.type)){add('FINISHED ITEM HELD AT WORKBENCH — FREE A PACK SLOT.','danger');v49MurphyRecipe(key);return true;}
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
        if(!addPack('Reinforced Bandage','consumable')){add('FINISHED BANDAGE HELD AT BENCH — FREE A PACK SLOT.','danger');v49Workbench();return true;}
        // Unlock and consume job only AFTER item has been safely delivered.
        player.flags.v49RecipeBandage=true;player.flags.v49CraftCompleted=true;
        add('CRAFT SUCCESS — REINFORCED BANDAGE (+30 HP).','reward');
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
 if(f.jenQuest==="active"&&roadGoal==="east"&&!f.eastReturning&&roadTurn>=2){f.jenQuest="cart";add("QUEST UPDATED — LAST CALL: You spot Jen's missing supply cart. Search it at the eastern road marker.","reward");}
 if(f.jenQuest==="hideout"&&roadGoal==="east"&&!f.eastReturning&&roadTurn>=4){f.jenQuest="raiders";add("QUEST UPDATED — LAST CALL: Raider tracks lead to an abandoned checkpoint. SEARCH RAIDER CHECKPOINT.","reward");}
 if(f.johnnyQuest==="active"&&roadGoal==="house"&&roadTurn>=3){f.johnnyQuest="ledger";add("QUEST UPDATED — A DEAL GONE BAD: A trader's lost ledger lies beside the western road.","reward");}
 if(f.amiiQuest==="active"&&roadGoal==="house"&&roadTurn>=4){f.amiiQuest="deposit";add("QUEST UPDATED — THE MISSING DEPOSIT: You find a locked bank satchel near the old highway.","reward");}
 if(f.waynePatientQuest==="active"&&roadGoal==="east"&&roadTurn>=3){f.waynePatientQuest="supplies";add("QUEST UPDATED — THE LAST PATIENT: An abandoned ambulance holds the needed medicine.","reward");}
}
function questRoadMarkers(){
 const f=player.flags,rows=[];
 if(roadGoal==="east"){if(f.jenQuest==="cart"&&roadTurn===2)rows.push(["JEN'S SUPPLY CART — beside the eastern road","SEARCH SUPPLY CART"]);if(f.jenQuest==="raiders"&&roadTurn===4)rows.push(["ABANDONED RAIDER CHECKPOINT — the runner's trail","SEARCH RAIDER CHECKPOINT"]);if(f.waynePatientQuest==="supplies"&&roadTurn===3)rows.push(["ABANDONED AMBULANCE","SEARCH AMBULANCE"]);}
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
  add(goal==="house" ? "You leave Solace and head west toward the old house." : goal==="east" ? "You pass through Solace's east gate and follow Route 127 into unfamiliar country." : "You leave the house and head east toward Solace.","bright");
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
    if(player.level<3){add("WAYNE > Travelers saw lights at that old house west of here. Get your road legs first; we'll talk when you're ready.","bright");add("HOUSE LEAD — Speak with Wayne again at Level 3.","system");return;}
    player.flags.houseQuest="active";
    add("WAYNE > Funny thing. Couple travelers came through talking about lights moving around that old house west of here. Thought that place was empty. Guess somebody moved in.","bright");
    add("QUEST ADDED — INVESTIGATE THE ABANDONED HOUSE","reward");
    add("Check QUESTS (Q) for this objective. At the house, choose INVESTIGATE OCCUPATION.","system");
    add("Return to your original starting house west of Solace. Suggested level: 3–5.","system");
  }else if(player.flags.houseQuest==="active")add("WAYNE > Check that old house west of town. Preferably without giving me more work.","bright");
  else if(player.flags.houseQuest==="cleared")add("WAYNE > You've cleared it? Take a proper look around before you leave.","bright");
  else add("WAYNE > Your own roof and a place to stash things. That's practically civilization.","bright");
}
function showHouseChoices(){
  ensureHousing();
  const quest=player.flags.houseQuest;
  queueChoiceLine(`SEARCH BATHROOM CABINET   CHECK FIREPLACE${quest==="active"?"   INVESTIGATE OCCUPATION":quest==="cleared"?"   LIFT FLOORBOARD":""}${player.flags.houseOwned?"   OPEN STORAGE BOX":""}   CHECK PACK   HEAD EAST — SOLACE`);
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
  player.houseStorage.forEach((i,n)=>add(`${n+1}. ${i.name} ×${i.qty} <${i.type.toUpperCase()}>`));
  if(!player.houseStorage.length)add("BOX EMPTY","system");
  if(mode==="houseDeposit"||mode==="houseWithdraw"){
    const items=mode==="houseDeposit"?player.pack.filter(i=>!["key","quest"].includes(i.type) && (player.houseStorage.length<player.houseBoxMax||player.houseStorage.some(x=>x.name===i.name&&x.type===i.type))):player.houseStorage.filter(i=>packSlotsUsed()<player.packMax||hasItem(i.name));
    const verb=mode==="houseDeposit"?"DEPOSIT":"WITHDRAW";
    add("Each transfer moves the entire stack. Equipped gear and quest items stay with you.","system");
    if(!items.length)add("NO ITEMS AVAILABLE","system");
    queueChoiceLine([...items.map(i=>`${verb} ${i.name.toUpperCase()}`),"(B) BACK"].join("   "));
  }else queueChoiceLine("DEPOSIT ITEMS   WITHDRAW ITEMS   (B) BACK");
}
function transferHouseItem(name,deposit){
  ensureHousing();
  if(!player.flags.houseOwned||!["houseStorage","houseDeposit","houseWithdraw"].includes(stage))return false;
  const from=deposit?player.pack:player.houseStorage,to=deposit?player.houseStorage:player.pack;
  const item=from.find(i=>i.name.toLowerCase()===name.trim().toLowerCase());
  if(!item){add("That item is not available. Nothing moved.","system");return false;}
  if(["key","quest"].includes(item.type)){add("Quest and key items stay with you.","system");return false;}
  const existing=to.find(i=>i.name===item.name&&i.type===item.type);
  if(!existing && (deposit?to.length>=player.houseBoxMax:packSlotsUsed()>=player.packMax)){add(deposit?"The wooden box is full. Nothing moved.":"Your backpack is full. Nothing moved.","system");return false;}
  // Check every constraint before committing either side. Clone new stacks: no shared references.
  if(existing)existing.qty+=item.qty;else to.push({...item});
  from.splice(from.indexOf(item),1);updateHud();
  add(`${item.name} ×${item.qty} ${deposit?"stored in the house box":"returned to your backpack"}.`,"reward");return true;
}
function isPathChoice(e,key){
  if(e.exclusive) return true;
  if(!key) return false;
  if(e.title === "THE DARK CELLAR" && /USE FLASHLIGHT|ENTER IN DARK/.test(key)) return true;
  if(e.title === "THE TRAVELER" && /TAKE PACK|WALK AWAY/.test(key)) return true;
  if(e.title === "RIDGELINE" && /HEAD FOR LIGHTS|WAIT/.test(key)) return true;
  return false;
}
function resolveEncounter(cmd) {
  const e = currentEncounter();
  if(cmd==="f" && /FIGHT/i.test(e.prompt?e.prompt():e.choices)) cmd="fight";
  const spec=e.combat || combatSpecs[e.title];
  const triggers=e.combat?[e.combat.action.toLowerCase()]:combatTriggers[e.title]||["fight"];
  if(spec && triggers.some(t=>e.combat?cmd===t:cmd.includes(t))){ startCombat(spec,"encounter",false,cmd.includes("fight")); return; }
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
  if(stage==="combat" && combatState){ add(`${combatState.name} — LVL ${String(combatState.level).padStart(2,"0")} — HP ${combatState.hp}/${combatState.maxHp}`,"bright"); add("(A) ATTACK   (U) USE ITEM   (B) BACK OFF","system"); return; }
  if(stage==="wandererRoad" && currentRoadWanderer){ const w=wandererByName(currentRoadWanderer); add(`ROUTE 127 — ${w.name.toUpperCase()} — LVL ${String(w.level).padStart(2,"0")}`,"bright"); add("SMALL TALK   INSPECT   FIGHT   MOVE ON","system"); return; }
  if(stage==="encounter"){ const e=currentEncounter(); const lvl=(e.combat&&e.combat.level) || encounterLevels[e.title] || (roadGoal==="east"? (e.title==="THE WARDEN"?50:5+(roadTurn%6)):null); add(`${e.title}${lvl?` — LVL ${String(lvl).padStart(2,"0")}`:""}`,"bright"); add(encounterChoices(e),"system"); return; }
  if(stage==="mercy"){ add(`SOLACE — ${mercyLocation.toUpperCase()}`,"bright"); if(mercyLocation==="town")mercyMenu(); else if(mercyLocation==="jen")showBarActions(); else if(mercyLocation==="relay")showRelayChoices(); else add("(T) TOWN","system"); return; }
  if(stage==="roadReady") add("OLD HOUSE — ROAD heads east toward Solace.","system");
  else if(stage==="settlement") add("(P) APPROACH GATE","system");
  else if(stage==="house")showHouseChoices();
}
function handleRoadWanderer(cmd){
  const w=wandererByName(currentRoadWanderer); if(!w){stage="between";showEncounter();return;}
  if(cmd.includes("small talk")||cmd==="talk"){ ws(w.name); add(wandererDialogue(w),"bright"); add("SMALL TALK   INSPECT   FIGHT   MOVE ON","system"); return; }
  if(cmd.includes("inspect")){ v50Inspect(w); add("SMALL TALK   INSPECT   FIGHT   MOVE ON","system"); return; }
  if(cmd.includes("fight")||cmd.includes("attack")){ startCombat({...v50WandererCombat(w),name:w.name.toUpperCase(),level:w.level,xp:10+w.level*4,bolts:Math.floor(w.level/2)+2,end:`${w.name} goes down and does not get back up.`},"roadWanderer",false,true); return; }
  if(cmd.includes("move")||cmd.includes("leave")||cmd.includes("continue")){ add(`${w.name} falls behind as you continue toward ${roadGoal==="mercy"?"Solace":roadGoal==="east"?(player.flags.eastReturning?"Solace":"the Factory"):"the old house"}.`); currentRoadWanderer=null; completeRoadTurn(); return; }
  add("SMALL TALK   INSPECT   FIGHT   MOVE ON","system");
}
function handleTownWanderer(cmd){
  const w=wandererByName(currentTownWanderer); if(!w)return false;
  const named=cmd.includes(w.name.toLowerCase()) || (townWandererFocus===w.name && ["small talk","inspect","fight","leave"].includes(cmd));
  if(cmd===`talk to ${w.name.toLowerCase()}` || cmd===w.name.toLowerCase()){
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
  queueChoiceLine(`(B) THE RUSTY LANTERN TAVERN   (T) JOHNNY'S TRADING POST   (W) MURPHY'S MOTOR WORKS   (C) LAST CHANCE CLINIC   (A) SOLACE SAVINGS & LOAN   ARMORY   (U) BULLETIN BOARD${player.flags.relayUnlocked?"   (R) RELAY STATION":""}   (E) WEST GATE   (G) EAST GATE   (L) FIND TIM${townVisitorChoice()}`);
}
function bankMenu(){v48BankMain();}
function showBankActions(){const page=player.flags.v48BankPage;if(page&&page!=="main")v48BankPage(page);else v48BankMain();}
function stashItem(name){return v48Stash(name);}
function retrieveItem(name){return v48Retrieve(name);}
function townVisitorChoice(){ return currentTownWanderer ? `   TALK TO ${currentTownWanderer.toUpperCase()}` : ""; }
function showBarActions(){
  player.flags.solaceMenu="bar";
  player.flags.jenInDialogue=false;
  add(`(B) BUY DRINKS   (G) GAMBLE${player.flags.rustyRoomOwned?"   (R) YOUR ROOM":player.bolts>=500?"   (R) BUY ROOM — 500 BOLTS":""}   (J) SMALL TALK JEN${townVisitorChoice()}   SELL ITEMS   (T) RETURN TO TOWN`,"system");
}
function showDrinkMenu(){
  player.flags.solaceMenu="drinks";mercyLocation="jenDrinks";add("DRINKS","bright");
  add("BEER — 3 BOLTS — +5 HP; SHOT — 5 BOLTS — +10 HP; HOUSE SPECIAL — 8 BOLTS — +15 HP","system");
  const choices=[];if(player.hp<player.maxHp){if(player.bolts>=3)choices.push("(E) BEER — 3 BOLTS — +5 HP");if(player.bolts>=5)choices.push("(O) SHOT — 5 BOLTS — +10 HP");if(player.bolts>=8)choices.push("(H) HOUSE SPECIAL — 8 BOLTS — +15 HP");}choices.push("(B) BACK");add(choices.join("   "),"system");
}
function showGambleMenu(){casinoMenu();}
function npcTalk(name){
  const n=name.toLowerCase(); mercyLocation=n;player.flags.solaceMenu="dialogue";
  if(n==="jen") player.flags.jenInDialogue=true;
  const handins={jen:["jenQuest","Jen's Supply Crate"],johnny:["johnnyQuest","Johnny's Ledger"],amii:["amiiQuest","Bank Satchel"],wayne:["waynePatientQuest","Clinic Medicine"]};
  if(handins[n]&&player.flags[handins[n][0]]==="recovered")add(`DELIVER ${handins[n][1].toUpperCase()} — available now`,"reward");
  if(n==="jen"&&player.flags.jenQuest==="rescued")add("DELIVER RUNNER'S TOKEN — available now","reward");
  if(n==="jen"){
    add("JEN", "place");v48NpcIntro("jen",({active:"Jen keeps glancing toward the east gate. The runner is still missing.",cart:"Jen asks whether you've searched the cart marked on the eastern road.",recovered:"Jen sees the supply crate and rises from behind the bar.",hideout:"Jen has the supplies, but her runner is still out there.",raiders:"Jen waits for news from the abandoned checkpoint.",rescued:"Jen sees the runner's token in your hand and lets out a breath.",done:"Jen smiles. The runner is home. Your drinks still aren't free."})[player.flags.jenQuest]||"Jen leans against the bar and gives you her full attention.",player.flags.jenQuest||"none",true);
    add(`${player.flags.jenQuest==="recovered"?"DELIVER JEN'S SUPPLY CRATE   ":player.flags.jenQuest==="rescued"?"DELIVER RUNNER'S TOKEN   ":""}${player.flags.jenUnpaidTab==="active"?"SETTLE UNPAID TAB   ":""}${player.flags.jenFamiliarFace==="active"?"TELL JEN ABOUT THE FAMILIAR FACE   ":""}ASK ABOUT SOLACE   ASK ABOUT ROAD   ASK ABOUT WORK   ASK RUMORS${(!player.flags.relayUnlocked && player.flags.relayQuest==="ask")?"   ASK ABOUT RELAY STATION":""}   ASK ABOUT UNPAID TAB   A FAMILIAR FACE   SMALL TALK   ASK ABOUT MISSING SHIPMENT   (B) BACK`, "system"); return;
  }
  if(n==="johnny"){
    add("JOHNNY", "place"); v48NpcIntro("johnny","Johnny folds his arms, wearing the expression of a man who could turn this conversation into a sale.");
    add(`${player.flags.johnnyQuest==="recovered"?"DELIVER JOHNNY'S LEDGER   ":""}ASK ABOUT LOST LEDGER   ASK ABOUT DEALS   ASK ABOUT SUPPLIES   ASK ABOUT ROAD${player.flags.relayPartsRevealed&&player.flags.relayQuest!=="complete"?"   ASK ABOUT RELAY PARTS":""}   SMALL TALK   (B) BACK`, "system"); return;
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
    tim:"TIM > Relay station? Yeah. Old communications building behind the north wall. Hasn't worked right in years. I'll have the gate unchained for you.",
    murphy:"MURPHY > The relay? Old comms shack. Half the hardware in there predates me, which is saying something. Tim keeps the access chained. I'll tell him you're looking for it.",
    jen:"JEN > I know the place. North side, past the old water tower. Nobody goes in much. I'll tell the gate guard to let you through.",
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
function revealRelayParts(){ ensureRelayParts(); if(player.flags.relayPartsRevealed)return; player.flags.relayPartsRevealed=true; player.flags.relayBranchDiscovered=true; add("The failures are not one problem. They're four.","bright"); add("RELAY REPAIR — FOUR COMPONENTS REQUIRED","reward"); add("POWER REGULATOR — Johnny may have something this old.","system"); add("ANTENNA SERVO — The county maintenance yard had old motor assemblies.","system"); add("SHIELDED FEED COUPLER — A lower access road branches from the Route 127 fork.","system"); add("SIGNAL-CONDITIONING MODULE — Old communications equipment lies east of Solace.","system"); add("QUEST UPDATED — All four clues recorded in QUESTS. LOWER ACCESS ROAD UNLOCKED.","reward"); }
const RELAY_REWARD_POOL=Object.freeze([
 "Tempered Steel Pipe","Balanced Hunting Knife","Precision Hunting Rifle","Reinforced Combat Machete","Refurbished Service Revolver",
 "Reinforced Relay Vest","Padded Tactical Jacket","Reinforced Leather Armor","Salvaged Security Vest","Insulated Patrol Coat"
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
    add("WOMAN'S VOICE > Something here is destabilizing the connection. I need you to find—","woman");
    add("SIGNAL LOSS","bright");
    add("WOMAN'S VOICE > —stabilize it. Then we can talk.","woman");
    add("NO SIGNAL","system");
    add("QUEST UPDATED — RELAY STATION","reward");
    add("Find a way to stabilize the Relay connection.","system");
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
const VENDOR_BASE={"Battered Flashlight":20,"Rusted Pipe":12,"Worn Jacket":10,"Tent":12,"Energy Bars":8,"Bandage":12,"Reinforced Jacket":45,"Claw Hammer":50,"Tire Iron":80,"Reinforced Pipe":48,"Tempered Steel Pipe":125,"Padded Jacket":45,"Hardened Scavenger Coat":135,"Devastator's Iron Pipe":320,"Wraith's Reinforced Coat":340,"Worn Leather Wristband":18,"Lucky Bottle Cap":15,"Reinforced Belt":22,"Scavenger's Charm":55,"Rusted Dog Tags":60,"Road Warrior's Bracelet":65};
const VENDOR_POOL=["Rusted Pipe","Worn Jacket","Reinforced Jacket","Claw Hammer","Tire Iron","Reinforced Pipe","Tempered Steel Pipe","Padded Jacket","Hardened Scavenger Coat","Devastator's Iron Pipe","Wraith's Reinforced Coat","Worn Leather Wristband","Lucky Bottle Cap","Reinforced Belt","Scavenger's Charm","Rusted Dog Tags","Road Warrior's Bracelet"];
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
  add("VIEW STOCK   SELL ITEMS   TALK   (B) BACK","system");
}
function johnnyShop(){
  ensureVendorStock();player.flags.solaceMenu="shop";
  add("JOHNNY'S STOCK — PERSONAL DAILY SELECTION","place");
  add(`ENERGY BAR — RESTORE 10 HP — ${johnnyPrice("Energy Bars")} BOLTS`,"system");add(`BANDAGE — RESTORE 18 HP — ${johnnyPrice("Bandage")} BOLTS`,"system");
  add(`BATTERED FLASHLIGHT — 20 BOLTS`,"system");
  add(`TENT — ${johnnyPrice("Tent")} BOLTS — one use for overnight camp.`,"system");
  if(player.packMax<10)add(`10-SLOT BACKPACK — ${V48_BACKPACK_PRICE} BOLTS`,"system");
  const scrap=findItem("Scrap Metal"),sq=scrap?scrap.qty:0;add(`SCRAP: ${sq} — ${sq*4} BOLTS. Stock refreshes at daily refill.`,"system");
  add(["BUY ENERGY BAR","BUY BANDAGE","BUY BATTERED FLASHLIGHT","SMALL TALK",...(player.flags.relayPartsRevealed&&player.flags.relayQuest!=="complete"?["ASK ABOUT RELAY PARTS"]:[]),"BUY TENT","BUY","SELL ITEMS",...(player.packMax<10?["BUY 10-SLOT BACKPACK"]:[]),...(sq?["SELL ALL SCRAP"]:[]),"(B) BACK"].join("   "),"system");
}
function showEquipmentShop(){
  ensureVendorStock();player.flags.solaceMenu="equipment";add("SCRAP & STEEL ARMORY — MARA — WEAPONS, ARMOR & ACCESSORIES","place");
  for(const item of player.vendorStock){const g=GEAR[item];add(`${gearLabel(item)} — ${g.type==="weapon"?`DMG ${g.min}–${g.max}`:g.type==="armor"?`DEF ${g.def}`:`ACCESSORY ${g.def?`+${g.def} DEF`:"combat bonus"}`} — ${johnnyPrice(item)} BOLTS${player.vendorSold.includes(item)?" — SOLD OUT":""}`,g.rarity);}
  add([...player.vendorStock.map(x=>`BUY ${x.toUpperCase()}`),"(B) BACK"].join("   "),"system");
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
 if(!addPack(item,g?g.type:item==="Tent"?"supply":item==="Battered Flashlight"?"tool":"consumable")){vendorReturnMenu();return;}
 player.bolts-=price;if(g)player.vendorSold.push(item);updateHud();
 add(`PURCHASED — ${gearLabel(item)} — -${price} BOLTS. ${g?"Open INVENTORY to equip.":""}`,g?.rarity||"reward");showPurchaseComplete();
}
function showPurchaseComplete(){player.flags.solaceMenu="purchaseComplete";add("PURCHASE COMPLETE","reward");add("CONTINUE SHOPPING   RETURN TO TOWN","system");}
function showPersonalQuestOffer(key){
 const intro={jenQuest:["LAST CALL","JEN > My runner was bringing a supply cart back from the eastern road. The cart never arrived, and neither did they. Supplies I can replace. People are harder. Will you look for them?"],johnnyQuest:["A DEAL GONE BAD","JOHNNY > A runner lost my ledger on the western road. Names, debts, promises. Bad hands could turn that book into trouble for half of Solace. Bring it back?"],amiiQuest:["THE MISSING DEPOSIT","AMII > A deposit satchel went missing west of town. Those Bolts belong to people who trusted us. I need it found before I have to tell them. Can you help?"],waynePatientQuest:["THE LAST PATIENT","WAYNE > A patient needs medicine I don't have. An old ambulance on the eastern road might still carry it. I'd ask nicely, but we're running out of time. Will you search?" ]}[key];
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
  if(["2","ask about corvette","about corvette"].includes(cmd)){add("MURPHY > Blue Corvette. One day I'll get her running. No fast-travel tricks until the car is actually roadworthy.","bright");murphyTalkMenu();return;}
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
  if(q.key==="jenQuest"&&f.jenQuest==="recovered"&&mercyLocation==="jen"&&cmd.includes("deliver jen's supply crate")){removeItem("Jen's Supply Crate");f.jenQuest="hideout";gainXp(50);add("JEN > Thank you. But the runner never came home. Tracks led farther east, toward an abandoned checkpoint. Can you find them?", "bright");add("QUEST UPDATED — LAST CALL: Investigate the eastern road again.","reward");return;}
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
    const drinks={e:["BEER",3,5],beer:["BEER",3,5],o:["SHOT",5,10],shot:["SHOT",5,10],h:["HOUSE SPECIAL",8,15],"house special":["HOUSE SPECIAL",8,15]}; const d=drinks[cmd];
    if(d){ if(player.bolts<d[1])add("Not enough Bolts.","system"); else if(player.hp>=player.maxHp)add("You're already at full health.","system"); else {player.bolts-=d[1];player.hp=Math.min(player.maxHp,player.hp+d[2]);updateHud();add(`${d[0]} — +${d[2]} HP   -${d[1]} BOLTS`,"reward");} showDrinkMenu(); return; }
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
  if(mercyLocation==="wayne" && (cmd.includes("treat") || cmd.includes("heal"))){ const missing=player.maxHp-player.hp; if(missing<=0){add("WAYNE > You're fine. Go injure yourself first if you're determined to give me money.");return;} const units=Math.ceil(missing/5), cost=Math.min(units,player.bolts); if(cost<=0){add("WAYNE > No Bolts? Fine. Don't bleed on anything. We'll work something out later.");return;} const healed=Math.min(missing,cost*5); player.bolts-=cost; player.hp+=healed; if(player.hp>=player.maxHp)player.deathStreak=0; updateHud(); add(`WAYNE patches you up. +${healed} HP   -${cost} BOLTS`,"reward"); if(player.hp>=player.maxHp)add("DEATH PENALTY RESET — fully recovered in Solace.","system"); return; }

  if(cmd.startsWith("deposit")){ const all=cmd.includes("all"),m=cmd.match(/\d+/),amount=all?player.bolts:(m?parseInt(m[0],10):0); if(amount<=0){add("AMII > Tell me how many Bolts you want to deposit.","system");return;} const n=Math.min(amount,player.bolts); if(n<=0){add("AMII > You don't have any carried Bolts to deposit.","system");return;} player.bolts-=n;player.bankBolts+=n;updateHud();add(`${n} BOLTS DEPOSITED — protected inside Solace.`,"reward");return; }
  if(cmd.startsWith("withdraw")){ const m=cmd.match(/\d+/),amount=m?parseInt(m[0],10):0; if(amount<=0){add("AMII > Tell me how many Bolts you want back.","system");return;} const n=Math.min(amount,player.bankBolts);if(n<=0){add("AMII > There's nothing in your account to withdraw.","system");return;}player.bankBolts-=n;player.bolts+=n;updateHud();add(`${n} BOLTS WITHDRAWN.`,"reward");return; }
  if(cmd.startsWith("stash ")){stashItem(cmd.slice(6));return;} if(cmd.startsWith("retrieve ")){retrieveItem(cmd.slice(9));return;}
  if(cmd==="view stash"||cmd==="stash"){add("SECURE STASH","place");if(!player.stash.length)add("EMPTY","system");else player.stash.forEach((i,n)=>add(`[${n+1}] ${i.name}${i.qty>1?` ×${i.qty}`:""}`));showBankActions();return;}

  if(cmd.includes("talk to jen")||cmd==="talk jen"){npcTalk("jen");return;} if(cmd.includes("talk to johnny")||cmd==="talk johnny"){npcTalk("johnny");return;} if(cmd.includes("talk to murphy")||cmd==="talk murphy"){npcTalk("murphy");return;} if(cmd.includes("talk to wayne")||cmd==="talk wayne"){npcTalk("wayne");return;} if(cmd.includes("talk to amii")||cmd==="talk amii"){npcTalk("amii");return;} if(cmd.includes("talk to tim")||cmd==="talk tim"){npcTalk("tim");return;}
  if(mercyLocation==="tim" && ["1","about solace","solace"].includes(cmd)){add("TIM > Solace started as a fuel stop, then a camp. Somebody built a wall and we started calling it home.","bright");npcTalk("tim");return;}
  if(mercyLocation==="tim" && ["2","work"].includes(cmd)){add("TIM > Two leads: Terrible Billy, and trouble at the old house. Billy has been hitting travelers east of the fork. Bring me proof he will not do it again.","bright");add(`${player.flags.timHouseBounty?`TROUBLE AT THE OLD HOUSE — ${String(player.flags.timHouseBounty).toUpperCase()}`:"ACCEPT TROUBLE AT THE OLD HOUSE"}   ${player.flags.terribleBillyBounty?`TERRIBLE BILLY — ${String(player.flags.terribleBillyBounty).toUpperCase()}`:"ACCEPT TERRIBLE BILLY CONTRACT"}` ,"system");npcTalk("tim");return;}
  if(mercyLocation==="tim" && (cmd.includes("accept trouble at the old house")||cmd==="trouble at old house")){if(!player.flags.timHouseBounty){player.flags.timHouseBounty="active";add("BOUNTY ACCEPTED — TROUBLE AT THE OLD HOUSE. Find the occupied house west of Solace, defeat the squatter, and bring proof to Tim.","reward");}else add(`TIM > That contract is already ${String(player.flags.timHouseBounty).toUpperCase()}.`,"system");npcTalk("tim");return;}
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
  if(cmd.includes("rumor")){add("JEN > Road's been louder than usual. Travelers disappearing east of the old overpass. Murphy thinks it's raiders. Wayne thinks Murphy watches too many old movies.","bright");return;}
  // Jen's two additional side quests use per-character flags, explicit costs, and journal-visible state.
  if(mercyLocation==="jen" && (cmd.includes("unpaid tab")||cmd.includes("settle tab"))){
    if(!f.jenUnpaidTab){f.jenUnpaidTab="active";add("JEN > One of my regulars left a 12-Bolt tab. Help me square the books and I'll pay you for the trouble.","bright");add("QUEST ACCEPTED — UNPAID TAB. Choose SETTLE UNPAID TAB when ready.","reward");}
    else if(f.jenUnpaidTab==="active"&&(cmd.includes("settle")||cmd.includes("pay"))){if(player.bolts<12){add("You need 12 Bolts to settle the tab.","system");return;}player.bolts-=12;f.jenUnpaidTab="done";gainBolts(20);gainXp(25);updateHud();add("QUEST COMPLETE — UNPAID TAB. The books balance. +25 XP, +8 net Bolts.","reward");}
    else add(`UNPAID TAB — ${String(f.jenUnpaidTab).toUpperCase()}.`,"system");
    npcTalk("jen");return;
  }
  if(mercyLocation==="jen"&&(cmd.includes("familiar face")||cmd.includes("tell jen about the familiar"))){
    if(!f.jenFamiliarFace){f.jenFamiliarFace="active";add("JEN > I swear I saw an old friend pass the east gate. Patched green coat, silver ring on the left hand. If you hear anything, come tell me.","bright");add("QUEST ACCEPTED — A FAMILIAR FACE.","reward");}
    else if(f.jenFamiliarFace==="active"&&cmd.includes("tell")){f.jenFamiliarFace="done";gainXp(30);gainBolts(10);updateHud();add("JEN > That's enough to know they're still out there. Thank you for telling me.","bright");add("QUEST COMPLETE — A FAMILIAR FACE. +30 XP, +10 BOLTS.","reward");}
    else add(`A FAMILIAR FACE — ${String(f.jenFamiliarFace).toUpperCase()}. Jen waits for you to return with news.`,"system");
    npcTalk("jen");return;
  }
  // Jen's dialogue is handled before generic Tim-oriented topics so her responses never route to the wrong NPC.
  if(mercyLocation==="jen" && (cmd.includes("about solace")||cmd.includes("about town"))){add("JEN > Solace is a wall, a warm drink, and a dozen people pretending they're not scared. Some nights, that is enough.","bright");return;}
  if(mercyLocation==="jen" && (cmd.includes("about road")||cmd.includes("route 127"))){add("JEN > East gets rough past the overpass. If you're heading out, tell somebody where you're going. I don't want another empty stool at my bar.","bright");return;}
  if(mercyLocation==="jen" && cmd.includes("about work")){add("JEN > The tavern keeps people fed, watered, and talking. I could use help finding my missing runner and keeping supplies coming in. Start with the shipment if you haven't already.","bright");return;}
  if(mercyLocation==="wayne" && cmd.includes("about work")){add("WAYNE > Work? Keep people alive, keep the clinic stocked, and try not to charge more than they can afford. The Last Patient still needs medicine, if you're willing to help.","bright");return;}
  if(mercyLocation==="wayne" && (cmd.includes("about road")||cmd.includes("route 127"))){add("WAYNE > The road is an injury that never closes. Watch for wreckage, bad footing, and anyone pretending a limp is nothing.","bright");return;}
  if(mercyLocation==="wayne" && (cmd.includes("about solace")||cmd.includes("about town"))){add("WAYNE > Solace is safer than the road, not safe. Keep your wounds clean and your Bolts where you can find them.","bright");return;}
  if(cmd.includes("about deals")){add("JOHNNY > Deals change. If I have something cheap today, buy it today. Tomorrow I may come to my senses.","bright");return;}
  if(cmd.includes("about supplies")){add("JOHNNY > Food, tools, scrap, whatever survives the road. Bring me something useful and I'll make us both pretend the price was fair.","bright");return;}
  if(mercyLocation==="murphy" && player.flags.relayPartsRevealed && cmd.includes("relay") && cmd.includes("part")){ add("MURPHY > Four failures? Figures. Check the old maintenance yard for an antenna servo. County gear used the same mounts. Johnny hoards old regulators. And those lower utility roads near the fork used shielded couplers.","bright"); npcTalk("murphy"); return;}
  if(cmd.includes("about workshop")){add("MURPHY > Anything mechanical comes through here eventually. Sometimes it even leaves better than it arrived.","bright");return;}
  if(cmd.includes("about cars")){add("MURPHY > Before all this? Cars were freedom. Now they're shelter, parts, or trouble. Still love 'em.","bright");return;}
  if(cmd.includes("about injuries")){add("WAYNE > Clean it, close it, don't be stupid twice. That's most field medicine.","bright");return;}
  if(cmd.includes("about banking")){add("AMII > Carried Bolts can disappear out there. Bolts in here don't. Niko and Alex are part of the interest rate.","bright");return;}
  if(cmd.includes("niko")||cmd.includes("alex")){add("Niko thumps his tail immediately. Alex watches for another second before finally doing the same. AMII > See? Friendly. Eventually.","bright");return;}
  if(cmd.includes("about work")){add("TIM > There'll be work. Route 127 keeps inventing new problems. Check the board and talk to people.","bright");return;}
  if(cmd.includes("about tim")){add("TIM > Not much to tell. I was here when Solace needed somebody to keep track of things. Apparently I forgot to stop.","bright");return;}
  if(cmd.includes("about mercy")||cmd.includes("about solace")){add("TIM > Started as a fuel stop. Then a camp. Then somebody built a wall and suddenly we had opinions about zoning.","bright");return;}
  if(cmd.includes("about road")||cmd.includes("route 127")){add("TIM > Route 127 keeps going east. So do the problems. Get some rest before you decide you need to meet them.","bright");return;}
  if(["jen","jenDrinks"].includes(mercyLocation) && (cmd==="beer"||cmd==="buy beer")){ if(player.bolts<3){add("JEN > Three Bolts.","system");return;} player.bolts-=3; player.hp=Math.min(player.maxHp,player.hp+5);updateHud();add("BEER — +5 HP   -3 BOLTS","reward"); if(mercyLocation==="jenDrinks")showDrinkMenu(); return;}
  if(["jen","jenDrinks"].includes(mercyLocation) && (cmd==="shot"||cmd==="buy shot")){ if(player.bolts<5){add("JEN > Five Bolts.","system");return;} player.bolts-=5; player.hp=Math.min(player.maxHp,player.hp+10);updateHud();add("SHOT — +10 HP   -5 BOLTS","reward"); if(mercyLocation==="jenDrinks")showDrinkMenu(); return;}
  if(["jen","jenDrinks"].includes(mercyLocation) && cmd.includes("house special")){ if(player.bolts<8){add("JEN > Eight Bolts.","system");return;} player.bolts-=8; player.hp=Math.min(player.maxHp,player.hp+15);updateHud();add("HOUSE SPECIAL — +15 HP   -8 BOLTS","reward");add("JEN > This stopped being medicine about two drinks ago.","bright"); if(mercyLocation==="jenDrinks")showDrinkMenu(); return;}
  if(mercyLocation==="jenRoomChest"){
    // A stale or edited save location must not grant access to an unpurchased room.
    if(!player.flags?.rustyRoomOwned){mercyLocation="jen";add("ROOM ACCESS REQUIRES OWNERSHIP","system");return;}
    if(!Array.isArray(player.rustyRoomChest))player.rustyRoomChest=[];
    const chest=player.rustyRoomChest;
    const show=()=>{add('RUSTY LANTERN — ROOM CHEST','place');add(`CHEST ${chest.length}/10 STACKS   PACK ${packSlotsUsed()}/${player.packMax}`,'system');chest.forEach((i,n)=>add(`${n+1}. ${i.name} ×${i.qty}`));if(!chest.length)add('CHEST EMPTY','system');add('DEPOSIT <ITEM NAME> [xQTY]   WITHDRAW <ITEM NAME> [xQTY]   BACK','system');};
    if(['back','b','return'].includes(cmd)){mercyLocation='jenRoom';add('THE RUSTY LANTERN','place');add(`${player.name||'PLAYER'}'S ROOM`,'place');add('REST   CHEST   LOOK AROUND   RETURN','system');return;}
    const deposit=cmd.startsWith('deposit '),withdraw=cmd.startsWith('withdraw ');
    if(deposit||withdraw){
      const request=cmd.slice(deposit?8:9).trim();
      const match=request.match(/^(.*?)\s+(?:x|×)(\d+)$/i);
      const name=(match?match[1]:request).trim().toLowerCase();
      const qty=match?Number(match[2]):1;
      const src=deposit?player.pack:chest,dst=deposit?chest:player.pack;
      if(!name||!Number.isSafeInteger(qty)||qty<1){add('INVALID ITEM OR QUANTITY','system');show();return;}
      const item=src.find(i=>i.name.toLowerCase()===name);
      if(!item||!Number.isSafeInteger(item.qty)||item.qty<qty){add('ITEM OR QUANTITY NOT AVAILABLE','system');show();return;}
      if(deposit&&['quest','key'].includes(item.type)){add('QUEST ITEMS CANNOT BE STORED','system');show();return;}
      if(deposit&&(item.name===player.weapon||item.name===player.armor)){add('EQUIPPED GEAR CANNOT BE STORED','system');show();return;}
      const existing=dst.find(i=>i.name===item.name&&i.type===item.type);
      if(!existing&&(deposit?chest.length>=10:packSlotsUsed()>=player.packMax)){add('NO FREE STORAGE SLOTS','system');show();return;}
      if(existing){if(!Number.isSafeInteger(existing.qty)||existing.qty<1||!Number.isSafeInteger(existing.qty+qty)){add('INVALID STORAGE QUANTITY','system');show();return;}existing.qty+=qty;}else dst.push({...item,qty});
      item.qty-=qty;if(item.qty===0)src.splice(src.indexOf(item),1);
      add(`${deposit?'STORED':'RETRIEVED'} — ${item.name} ×${qty}`,'reward');updateHud();show();return;
    }
    show();return;
  }
  if(mercyLocation==="jenRoom"){
    if(["b","back","return","4"].includes(cmd)){mercyLocation="jen";showBarActions();return;}
    if(["rest","1"].includes(cmd)){
      const f=player.flags, today=Number(day)||1;
      if(f.rustyRoomRestDay!==today){f.rustyRoomRestDay=today;f.rustyRoomRestCount=0;}
      const factors=[1,.75,.5,.25,0],factor=factors[Math.min(f.rustyRoomRestCount,4)];
      f.rustyRoomRestCount++;
      const heal=Math.min(player.maxHp-player.hp,Math.ceil(player.maxHp*factor));
      player.hp+=heal; if(heal>0)player.deathStreak=0;
      updateHud();add(`ROOM REST — ${Math.round(factor*100)}% EFFECTIVENESS, +${heal} HP`,'reward');
      add('Rest does not replenish expedition turns.','system');return;
    }
    if(["look around","look","3"].includes(cmd)){add('The door locks from inside. A narrow bed and an old lamp make this a safe place to sleep.','system');return;}
    if(["chest","2"].includes(cmd)){mercyLocation='jenRoomChest';if(!Array.isArray(player.rustyRoomChest))player.rustyRoomChest=[];add('RUSTY LANTERN — ROOM CHEST','place');add('DEPOSIT <ITEM NAME> [xQTY]   WITHDRAW <ITEM NAME> [xQTY]   BACK','system');return;}
    add('REST   CHEST   LOOK AROUND   RETURN','system');return;
  }
  if(mercyLocation==="jen" && ["rent room","buy room","room"].includes(cmd)){
    if(!player.flags.rustyRoomOwned){if(player.bolts<500){add('JEN > A room of your own costs 500 Bolts.','system');return;}player.bolts-=500;player.flags.rustyRoomOwned=true;updateHud();add('ROOM PURCHASED — 500 BOLTS','reward');}
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
    add("WOMAN'S VOICE > You did it. We can finally talk.","woman");
    add("UNKNOWN > You actually did it. The connection is holding.","woman");
    add("SECOND VOICE > We can finally talk. You have already seen the factory east of Solace.","woman");
    add("UNKNOWN > There is something beyond that locked fence. We need you to investigate when the way opens.","woman");
    player.flags.factoryQuest="upcoming";
    saveGame(activeSaveSlot);
    add("MAIN QUEST COMPLETE — THE RELAY STATION","reward");
    add("MAIN OBJECTIVE — THE FACTORY / STATUS: ACTIVE","system");
    add("The factory interior is accessible through Forge’s workshop. The monitor stays online.","system");
    showRelayChoices();return;
  }
  if(mercyLocation==="relay" && player.flags.relayQuest==="complete" && (cmd==="t"||cmd.includes("talk")||cmd.includes("contact")||cmd.includes("monitor")||cmd.includes("project")||cmd.includes("factory"))){add("TOMORROW PROJECT — CONNECTION ACTIVE","place");add("UNKNOWN > The Relay is holding. Keep your eyes open out there.","woman");add("SECOND VOICE > The factory interior is open, but what lies deeper inside matters. We will be here when you return.","woman");add("The monitor remains on. You can contact the group again.","system");showRelayChoices();return;}
  if(mercyLocation==="relay" && player.flags.relayQuest==="complete" && cmd.includes("inspect")){add("All four repaired systems are operating normally. The monitor remains online.","system");showRelayChoices();return;}
  if(mercyLocation==="relay" && cmd.includes("inspect")){
    if(cmd.includes("monitor")){add("The monitor is dead again. A faint ozone smell hangs around the vents. A signal-conditioning board behind the display is scorched beyond repair.");add("You remember the pre-collapse communications equipment along Route 127 east of Solace.","bright");inspectRelaySystem("monitor");showRelayChoices();return;}
    if(cmd.includes("console")){add("The main console has power in fits and starts. The old POWER REGULATOR is cooked; SIGNAL STABILITY never rises above the bottom quarter.");add("Johnny keeps shelves of obsolete electronics. If anyone in Solace has one, he might.","bright");inspectRelaySystem("console");showRelayChoices();return;}
    if(cmd.includes("antenna")){add("A bank of antenna controls is frozen halfway through calibration. The ANTENNA SERVO has seized solid.");add("You passed old motor assemblies at the county maintenance yard off the service road.","bright");inspectRelaySystem("antenna");showRelayChoices();return;}
    if(cmd.includes("cable")){add("Most of the cable is brittle but intact, but the SHIELDED FEED COUPLER has burned through at the wall.");add("A faded service diagram marks a lower utility access road near the Route 127 fork.","bright");inspectRelaySystem("cables");showRelayChoices();return;}
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
  if(cmd==="bar"||cmd==="jen's bar"||cmd==="visit bar"){mercyLocation="jen";add("THE RUSTY LANTERN TAVERN","place");showWanderersAt("jen");if(!player.flags.visited_jen){player.flags.visited_jen=true;add("Warm light leaks through patched windows. The room smells like wood smoke and something almost resembling dinner.");add("Jen is short, warm, and easy to talk to—the kind of person who makes a hard place feel less hard.");add("As she reaches for a glass, you catch a glimpse of a tiny ladybug tattoo near her wrist.");add("JEN > First one's water. You look like you need it more than anything stronger.","bright");if(player.flags.travelerInSolace)add("The wounded woman from the road is sitting near the end of the bar with a fresh dressing on her arm. She catches your eye and smiles. ‘Didn’t think I’d see you again.’","bright");}else{add("JEN > Back again? What can I get you?", "bright");}showBarActions();return;}
  if(cmd==="trader"||cmd==="trading post"||cmd==="johnny"){mercyLocation="johnny";add("JOHNNY'S TRADING POST","place");showWanderersAt("johnny");if(!player.flags.visited_johnny){player.flags.visited_johnny=true;add("Shelves made from old road signs hold food, tools, ammunition, and objects whose original purpose is no longer obvious.");add("Johnny looks over your pack with the practiced grin of a man already working out three different ways to make a deal.");add("JOHNNY > I'll buy almost anything. Sell almost anything too. And lucky for you, today I happen to be feeling generous.","bright");add("JOHNNY > Generous-ish.","bright");}else{add("JOHNNY > Back for another deal?", "bright");}johnnyMainMenu();return;}
  if(cmd==="workshop"||cmd==="murphy"){player.flags.v49MurphyMenu="";player.flags.solaceMenu="workshop";mercyLocation="murphy";add("MURPHY'S MOTOR WORKS","place");showWanderersAt("murphy");if(!player.flags.visited_murphy){player.flags.visited_murphy=true;add("The shop looks chaotic until you notice every tool is exactly where Murphy expects it to be.");add("A faded photograph of a bright blue Corvette is pinned above his workbench, remarkably clean compared with everything around it.");add("MURPHY > Let's see what survived the trip with you.","bright");add("He checks your Rusted Pipe and gives an approving little shrug. MURPHY > Ugly. Reliable. I respect that.");}else{add("MURPHY > Back again? What needs fixing?", "bright");}murphyMainMenu();return;}
  if(cmd==="clinic"||cmd==="wayne"){player.flags.solaceMenu="clinic";mercyLocation="wayne";add("LAST CHANCE CLINIC","place");showWanderersAt("wayne");if(!player.flags.visited_wayne){player.flags.visited_wayne=true;add("Clean bandages, boiled instruments, labeled jars. Someone here knows what they're doing.");add("A tiny word has been scratched into the underside of one metal shelf: SEX.","system");add("Wayne notices you noticing it and says absolutely nothing.");add(`WAYNE > You're at ${player.hp}/${player.maxHp} HP. I've seen worse. Usually attached to smarter decisions.`,"bright");}else{add("WAYNE > Try not to bleed on the floor.", "bright");}add("TREAT WOUNDS — 1 BOLT PER 5 HP   BUY BANDAGE — 8 BOLTS   BUY   SELL ITEMS   SMALL TALK WAYNE   TOWN","system");return;}
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
  if(!player.flags.interfaceUnlocked) return false;
  if(stage!=="inventory"&&stage!=="inventoryItem"&&stage!=="quests"&&stage!=="interfaceStatus"&&stage!=="interfaceMap") returnStage=stage;
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
  if(mercyLocation==="wayne")return add("TREAT WOUNDS — 1 BOLT PER 5 HP   BUY BANDAGE — 8 BOLTS   BUY   SELL ITEMS   SMALL TALK WAYNE   TOWN","system");
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
  if(stage==="combat")return add("(A) ATTACK   (U) USE ITEM   (B) BACK OFF","system");
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
  if(["port55Vendor","port55Pets","port55Kaiden","port55Mia","port55Docks","port55Stop"].includes(stage))return port55Resume();
  if(["portRoad","seaport","portMarket","portClinic","portDocks","portWatch"].includes(stage))return portMenu();
  if(stage==="factoryTerminal")return v49Terminal();
  if(stage==="factoryForge")return v49Forge();
  if(stage==="factoryBench")return v49Workbench();
  if(stage==="serviceRoad")return add(serviceRoadChoices(),"system");
  if(stage==="relayBranch")return add(branchLandmarkChoices(),"system");
  if(stage==="fork")return add(`(C) CONTINUE TO ${roadGoal==="house"?"OLD HOUSE":"SOLACE"}   (S) CHECK SERVICE ROAD${player.flags.relayPartsRevealed?"   CHECK LOWER ACCESS ROAD":""}   (R) REVERSE DIRECTION`,"system");
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
}
async function handleCommandCore(raw) {
  autoFollowOutput=true;
  let cmd = raw.trim().toLowerCase();
  if(cmd==="claim equipment"||cmd==="claim equipment drop"){v555ClaimEquipmentDrop();return;}
  if(busy) return;
  if(!cmd && !["confirmNewSlot","confirmHandle"].includes(stage)){ add("> [ENTER]","bright"); renderCurrentChoices(); return; }
  if(/^\d+$/.test(cmd) && numberedChoices[cmd] && stage!=="factoryTerminal" && !(stage==="mercy" && mercyLocation==="murphy" && player.flags.v49MurphyMenu) && !["inventory","combatItems","fallen"].includes(stage) && !(stage==="mercy"&&player.flags.v49BankCustom) && !["interfaceSave","v49TitleConfirm"].includes(stage)) cmd=numberedChoices[cmd];
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

  if(['manage pets','pets','pet slot'].includes(cmd) && ['inventory','inventoryItem','interfaceStatus'].includes(stage)){stage='port55Pets';port55Pets();return;}
  if(typeof port55CasinoCommand==="function"&&port55CasinoCommand(cmd))return;
  if(cmd==='read chapter one'&&player.flags.chapterOneComplete){port55FinaleText();return;}
  if(['replay harbor art','view harbor art','harbor art'].includes(cmd)&&player.flags.seaport55?.freed){port55LiberationArt(true);return;}
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
  if(QA_BUILD && stage === "testingCode"){ if(cmd==="cancel"){ stage=player.flags.testingReturnStage||(player.turns<=0?"zeroTurns":"between");delete player.flags.testingReturnStage;add("Testing access cancelled.","system"); return; } if(raw.trim().toUpperCase()===TEST_ACCESS_CODE){ testMode=true;stage=player.flags.testingReturnStage||(player.turns<=0?"zeroTurns":"between");delete player.flags.testingReturnStage; updateHud(); add("TEST MODE ACTIVE","reward"); add("Expedition Turn limit disabled. HP, XP, Bolts, loot, quests and combat remain live.","system"); add("Type TEST OFF at any time to restore normal Turn limits.","system"); return; } add("ACCESS DENIED","danger"); return; }
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
  if(stage==="combatItems"){ if(cmd==="b"||cmd==="back"){stage="combat";inventoryMode=null;showCurrentContext();return;} const n=parseInt(cmd,10); if(n&&inventoryMode&&inventoryMode.items[n-1]){useItem(inventoryMode.items[n-1]);stage="combat";inventoryMode=null;showCurrentContext();return;} add("Choose an item NUMBER or (B) BACK.","system");return; }
  if(stage==="inventory"){ if(cmd==="b"||cmd==="back"||cmd==="exit"){stage=returnStage||"between";inventoryMode=null;redrawState();return;} const n=parseInt(cmd,10); const items=player.pack.filter(i=>!["key","quest"].includes(i.type)); if(n&&items[n-1]){await showInventoryItem(items[n-1].name);return;} add("Select an item NUMBER or (B) BACK.","system");return; }
  if(stage==="confirmDrop"){
    if(cmd==="y"||cmd==="yes"||cmd==="confirm drop"){dropItem(inventoryMode.item);}
    else if(cmd!=="n"&&cmd!=="no"&&cmd!=="cancel"&&cmd!=="b"&&cmd!=="back"){add("(Y) CONFIRM DROP   (N) CANCEL","system");return;}
    stage="inventory";inventoryMode=null;showInventory();showInterfaceNav();return;
  }
  if(stage==="inventoryItem"){ const name=inventoryMode&&inventoryMode.item; if((cmd==="e"||cmd==="equip") && name){ const item=findItem(name); if(item && (item.type==="weapon"||item.type==="armor"||item.type==="accessory")){ const slot=item.type; const previous=player[slot]; removeItem(name); player[slot]=name; if(slot==="accessory"){const hpDelta=(GEAR[name]?.maxHpBonus||0)-(GEAR[previous]?.maxHpBonus||0);player.maxHp=Math.max(1,player.maxHp+hpDelta);player.hp=Math.min(player.hp,player.maxHp);} if(previous && previous!==name)addPack(previous,slot); updateHud();add(`EQUIPPED — ${name}. Previous ${slot}: ${previous||"none"}.`,"reward");stage="inventory";inventoryMode=null;showInventory();showInterfaceNav();return;} add("That item cannot be equipped.","system");return;} if(cmd==="b"||cmd==="back"){stage="inventory";showInventory();showInterfaceNav();return;} if(cmd==="u"||cmd==="use"||cmd.startsWith("use ")){useItem(name);stage="inventory";inventoryMode=null;showInventory();showInterfaceNav();return;} if(name==="Battered Flashlight" && (cmd==="d"||cmd.includes("dismantle"))){dismantleItem(name);stage="inventory";inventoryMode=null;showInventory();showInterfaceNav();return;} if(cmd==="d"||cmd==="drop"||cmd.startsWith("drop ")){inventoryMode={item:name};stage="confirmDrop";add(`DROP ${name.toUpperCase()}? This cannot be undone.`,"danger");add("(Y) CONFIRM DROP   (N) CANCEL","system");return;} add(name==="Battered Flashlight"?"Choose (D) DISMANTLE or (B) BACK.":"Choose (U) USE, (D) DROP, or (B) BACK.","system");return; }
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
  if(QA_BUILD && (cmd === "testing access" || cmd === "testing")){ player.flags.testingReturnStage=stage;stage="testingCode"; add("TESTING ACCESS","place"); add("Enter access code. Type CANCEL to return.","system");add("(B) CANCEL","system"); return; }
  if(QA_BUILD && testMode && /^test (?:add|refill) (?:[1-9]\d{0,2})$/.test(cmd)){const amount=Number(cmd.split(" ").pop());player.turns=Math.min(TURN_CAP,player.turns+amount);updateHud();add(`QA TURN REFILL — +${amount} REQUESTED; ${player.turns}/${TURN_CAP} STORED.`,"reward");return;}
  if(QA_BUILD && (cmd === "test off" || cmd === "disable test mode")){ testMode=false; updateHud(); add("TEST MODE DISABLED — normal Turn limits restored.","system"); if(player.turns<=0)noTurnsMenu(); return; }
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
    if(QA_BUILD && (cmd==="testing" || cmd==="testing access")){player.flags.testingReturnStage="zeroTurns";stage="testingCode";add("TESTING ACCESS — ENTER ACCESS CODE","place");add("(B) CANCEL","system");return;}
    if(testMode){ add("TEST MODE ACTIVE — Turns are unlimited. Type TEST OFF to restore the real counter.","reward"); stage="between"; showEncounter(); return; }
    if(player.flags.overnightLocked){ add(`OVERNIGHT STATE LOCKED — ${overnightLabel(player.flags.overnight)}`,"bright"); add(`NEXT TURN REFILL: ${refillText()}`,"system"); add(`SAVE CURRENT   STATUS   INVENTORY   MAP${QA_BUILD?"   TESTING":""}`,"system"); return; }
    const choice=cmd==="c"||cmd.includes("camp")?"camp":cmd==="r"||cmd.includes("remain")||cmd.includes("road")?"road":cmd==="j"||cmd.includes("room")?"room":null;
    if(choice){if(choice==="camp"&&!hasItem("Tent")){add("MAKE CAMP REQUIRES 1 TENT. Choose REMAIN ON ROAD or a paid room in Solace.","system");add(overnightChoices(),"system");return;}if(choice==="room"&&!overnightRoomAvailable()){add("No paid room is available here.","system");add(overnightChoices(),"system");return;}
      player.flags.pendingOvernight=choice;add(`${overnightLabel(choice)}?`,"bright");add(choice==="camp"?"Consumes 1 Tent. Low, nonzero loss risk. No loot.":choice==="room"?"Use your prepaid room. No overnight losses. No loot.":"No supplies required. Higher loss risk. No loot.","system");add("(Y) CONFIRM   (N) CANCEL","system");stage="overnightConfirm";
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
  } if(cmd.includes("continue")||cmd.includes("up road")){if(serviceRoadDepth>=3&&player.flags.serviceBossDead){add("The service road ends at the maintenance yard.","system");add(serviceRoadChoices(),"system");return;}if(!testMode && player.turns<=0){noTurnsMenu();return;}spendTurn();player.flags.branchReturning=false; if(serviceRoadDepth<2){serviceRoadDepth=2;add("SERVICE ROAD — WASHOUT","place");v48Intro("service_washout",[["The lane bends around a washed-out culvert. Tire ruts vanish into weeds, then reappear beside an old county equipment fence."]],"You pass the washed-out culvert again.",true);add(serviceRoadChoices(),"system");return;} serviceRoadDepth=3;if(player.flags.serviceBossDead){add(player.flags.relayPartsRevealed&&!ensureRelayParts().yard?"The Yardman is gone. The motor assemblies needed for the Relay are still here. SEARCH MAINTENANCE YARD to recover the antenna servo.":"The maintenance yard is quiet now. The Yardman is gone.");add(serviceRoadChoices(),"system");return;}add("COUNTY MAINTENANCE YARD","place");add("A hulking figure steps from the ruined garage, dragging a heavy wrench across the concrete.");startCombat({name:"THE YARDMAN",level:5,hp:55,min:7,max:12,xp:65,bolts:28,end:"The Yardman drops hard. The maintenance yard finally goes quiet."},"serviceBoss",false);return;} add("(C) CONTINUE UP ROAD   (R) RETURN TO FORK","system");return;}
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
    add("COORDINATES LOGGED — SOLACE / ROUTE 127 EAST / 6.2 MI","bright"); player.flags.interfaceUnlocked=true; hud.classList.remove("hidden"); utilityPanel.classList.remove("hidden"); updateHud(); add("INTERFACE ONLINE — (S) STATUS / (I) INVENTORY / (M) MAP / (Q) QUESTS / (V) SAVE","system");
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
        startCombat({name:"SOLACE GATE GUARD",level:Math.max(2,player.level),hp:28,damage:7,minDamage:5,maxDamage:9,xp:18,bolts:0,end:"The gate guard lowers his weapon and calls for help."},"gateGuards",true,false);return;
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
