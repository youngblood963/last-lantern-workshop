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
const TURN_REFILL_AMOUNT = 20;
const REFILL_MS = 24*60*60*1000;
const TEST_ACCESS_CODE = "LANTERN127";
const player = {
  handle: "", level: 1, hp: 100, maxHp: 100, xp: 0, nextXp: 100,
  bolts: 12, bankBolts: 0, turns: 20, maxTurns: 60,
  weapon: "Rusted Pipe", armor: "Worn Jacket",
  pack: [
    {name:"Energy Bars", qty:2, type:"consumable"},
    {name:"Battered Flashlight", qty:1, type:"tool"}
  ], packMax: 8, flags: { maintenanceYardSearched:false, billboard:false, helpedTraveler:false, travelerInSolace:false, houseBandage:false, forkDiscovered:false, mercyDiscovered:false, serviceBossDead:false, serviceReward:false, rentedRoom:false, timQuest:"locked", timQuestSteps:0, murphyQuest:"locked", murphyQuestSteps:0, pendingQuest:"", mainSolaceQuest:"active", relayQuest:"locked", relayUnlocked:false, relayVisited:false, interfaceUnlocked:false, roomSearched:false, introFailed:false, worldHour:8, relayPartsRevealed:false, relayParts:{johnny:false,yard:false,branch:false,east:false}, relayJohnnyAsked:false, relayBranchDiscovered:false, eastRouteDiscovered:false },
  wandererState: {}, recentEncounters: [], deathStreak: 0,
  encounterDone: {},
  stash: [], dailyDeal: "Claw Hammer"
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function looksLikeChoiceLine(text, cls="") {
  if (!cls.includes("system") || !text) return false;
  const parts=text.split(/\s{2,}/).map(x=>x.trim()).filter(Boolean);
  if(parts.length < 2) return false;
  const verbs=/^(?:\([A-Z0-9]\)\s*)?(?:LOOK|STAND|SEARCH|CHECK|INSPECT|MOVE|KEEP|WALK|HEAD|FIGHT|OFFER|WARN|BACK|USE|ENTER|STUDY|READ|WAIT|PAY|FORCE|SMASH|OPEN|STRIP|CLIMB|TAKE|CIRCLE|GIVE|QUESTION|CRUSH|KICK|THROW|HOLD|RUSH|SNEAK|INTIMIDATE|POKE|BARGAIN|STEAL|CONTINUE|RETURN|ATTACK|PLAY|LEAVE|TALK|APPROACH|BAR|TRADER|WORKSHOP|CLINIC|BANK|BULLETIN|RENT|BEER|SHOT|HOUSE SPECIAL|GAMBLE|DEPOSIT|WITHDRAW|SELL|BUY|SAVE|STATUS|INVENTORY|MAP|TESTING|CONFIRM|CANCEL|YES|NO|MAKE CAMP|REMAIN|ASK|TOWN|DECLINE|ACCEPT)/i;
  return parts.filter(p=>verbs.test(p)).length >= 2;
}
// v33: action numbers are assigned once per displayed choice group.
// Full-word commands remain valid for compatibility with older saves.
const RESERVED_INTERFACE_KEYS=new Set(["I","S","M","Q","V","H"]);
function choiceCommand(label){
  const clean=String(label).replace(/^\([A-Z0-9]\)\s*/i,"").trim();
  return clean.split(/\s+[—–]\s+/)[0].trim().toLowerCase();
}
function hotkeyLine(text){
  const parts=String(text??"").split(/\s{2,}/).map(x=>x.trim()).filter(Boolean);
  return parts.map(part=>{
    const command=choiceCommand(part);
    if(!command) return part;
    const index=Object.keys(numberedChoices).length+1;
    if(index>99) return part;
    numberedChoices[String(index)]=command;
    return `[${index}] ${part.replace(/^\([A-Z0-9]\)\s*/i,"")}`;
  }).join("   ");
}
function renderNumberedChoices(text){
  // Choices may be on a single line, with or without legacy letter labels.
  if(!text || !/\s{2,}/.test(text))return text;
  if(!looksLikeChoiceLine(text,"system") && !/^\([A-Z0-9]\)/.test(text))return text;
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
function applyLevelEvolution(div, text, cls="") {
  if(!player || player.level < 2 || !text) return;
  const upper=text.toUpperCase();
  const major=(upper.match(/^(TIM|MURPHY|JEN|WAYNE|JOHNNY|AMII)\b/)||[])[1];
  // Character-name colors do not begin until Level 3. Level 2 is yellow-only.
  if(player.level >= 3 && major){ paintName(div,text,major,"npc-blue"); return; }
  const w=(typeof wanderers!=="undefined"?wanderers:[]).find(x=>upper.startsWith(x.name.toUpperCase()));
  if(player.level >= 3 && w){ paintName(div,text,w.name.toUpperCase(),"wanderer-green"); return; }
  // Level 3 yellow is still sparse: important information begins resolving before whole lines do.
  const m=text.match(/\b(QUEST|FOUND|XP|BOLTS?|SOLACE|TURN|COORDINATES|COMPLETE)\b/i);
  if(m && (cls.includes("reward")||cls.includes("bright")||cls.includes("place"))){
    const i=m.index; div.textContent=""; div.append(document.createTextNode(text.slice(0,i)));
    const word=m[0], yellowCount=player.level===2?1:(player.level<5?Math.max(1,Math.ceil(word.length*0.6)):word.length);
    const pos=stableColorPositions(word,yellowCount); for(let j=0;j<word.length;j++){ if(pos.includes(j)){const sp=document.createElement("span");sp.className="evo-yellow";sp.textContent=word[j];div.append(sp);} else div.append(document.createTextNode(word[j])); } div.append(document.createTextNode(text.slice(i+word.length)));
  }
}
function add(text = "", cls = "") {
  if(cls.includes("place") || (!cls.includes("system") && text)) { currentHotkeys={}; numberedChoices={}; usedHotkeys=new Set(); }
  if(cls.includes("system")) text=renderNumberedChoices(text);
  const div = document.createElement("div");
  div.className = `line ${cls}`;
  const finalText = text;
  // One authoritative gameplay-output path: enqueue once, render once.
  outputQueue = outputQueue.then(async()=>{
    screen.appendChild(div);
    const paced = finalText && !cls.includes("system") && !cls.includes("reward") && !cls.includes("danger");
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
  followOutput();
}
function updateHud() {
  document.querySelector("#hud-level").textContent = String(player.level).padStart(2,"0");
  document.querySelector("#hud-hp").textContent = `${player.hp}/${player.maxHp}`;
  document.querySelector("#hud-xp").textContent = `${player.xp}/${player.nextXp}`;
  document.querySelector("#hud-bolts").textContent = player.bolts;
  document.querySelector("#hud-turns").textContent = testMode ? "∞ TEST" : `${player.turns}/${player.maxTurns}`;
  document.querySelector("#hud-pack").textContent = `${packSlotsUsed()}/${player.packMax}`; const ht=document.querySelector("#hud-time"); if(ht)ht.textContent=timePhase();
  document.querySelector("#side-level").textContent = `LV ${String(player.level).padStart(2,"0")}`;
  document.querySelector(".utility-name").childNodes[0].nodeValue = `${player.handle || "---"} `;
  document.querySelector("#side-hp").textContent = `${player.hp} / ${player.maxHp}`;
  document.querySelector("#side-bolts").textContent = player.bolts;
  document.querySelector("#side-turns").textContent = testMode ? "∞ TEST" : `${player.turns} / ${player.maxTurns}`; const st=document.querySelector("#side-time"); if(st)st.textContent=timePhase();
  updateRefillDisplay();
}
function spendTurn() { dailyRoadTurns++; if(!testMode) player.turns = Math.max(0, player.turns - 1); player.flags.worldHour=((player.flags.worldHour??8)+1)%24; updateHud(); }
function timePhase(){ const h=player.flags.worldHour??8; return h<6?"DARK":h<8?"DAWN":h<17?"DAY":h<20?"DUSK":"DARK"; }
function isDark(){ return timePhase()==="DARK"; }
function ensureRefillClock(){ if(!player.flags) player.flags={}; if(!player.flags.nextRefillAt) player.flags.nextRefillAt=Date.now()+REFILL_MS; }
function processRefill(){ ensureRefillClock(); let t=Number(player.flags.nextRefillAt)||Date.now()+REFILL_MS; const now=Date.now(); let gained=0; while(now>=t){ player.turns=Math.min(player.maxTurns,player.turns+TURN_REFILL_AMOUNT); t+=REFILL_MS; gained+=TURN_REFILL_AMOUNT; } player.flags.nextRefillAt=t; if(gained) dailyRoadTurns=0; if(gained && stage==="zeroTurns" && player.turns>0){ stage="between"; player.flags.overnight=""; player.flags.overnightLocked=false; add(`EXPEDITION TURNS RESTORED — +${gained} TURNS`,"reward"); add("Your overnight state has ended. Route 127 is open again.","system"); } }
function refillText(){ ensureRefillClock(); const ms=Math.max(0,Number(player.flags.nextRefillAt)-Date.now()); const sec=Math.ceil(ms/1000), h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), ss=sec%60; return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(ss).padStart(2,"0")}`; }
function updateRefillDisplay(){ if(!player.flags)return; processRefill(); const txt=testMode?"PAUSED / TEST":refillText(); const h=document.querySelector("#hud-refill"), side=document.querySelector("#side-refill"); if(h)h.textContent=txt;if(side)side.textContent=txt; }
function startRefillTimer(){ if(refillTimer)clearInterval(refillTimer); refillTimer=setInterval(()=>{updateRefillDisplay();},1000); updateRefillDisplay(); }
function resultLine(text, cls="reward") { if(resultBuffer) resultBuffer.push([text,cls]); else add(text,cls); }
function flushResults(){ if(!resultBuffer || !resultBuffer.length){ resultBuffer=null; return; } add("RESULT", "system"); for(const [t,c] of resultBuffer) add(t,c); resultBuffer=null; }
function gainBolts(n) { player.bolts += n; updateHud(); resultLine(`+${n} BOLTS`, "reward"); }
function gainXp(n) {
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
  updateHud();
}
function handlePlayerDeath(){
  if(stage==="fallen") return;
  player.deathStreak=(player.deathStreak||0)+1;
  const inTown=player.flags.mercyDiscovered;
  // Remaining road segments are the minimum rescue travel cost; recovery adds two.
  const travel=inTown ? (roadGoal==="house"?Math.max(0,roadTripLength-roadTurn):roadGoal==="mercy"?Math.max(0,roadTripLength-roadTurn):roadGoal==="east"?Math.max(0,roadTurn+1):0) : Math.max(0,roadTurn+1);
  const penalty=travel+2;
  player.turns=Math.max(0,player.turns-penalty);
  dailyRoadTurns+=travel; // rescue travels the route; recovery itself is not a road turn
  player.hp=Math.max(1,Math.round(player.maxHp*.5));
  combatState=null; currentRoadWanderer=null; updateHud();
  add("YOU HAVE FALLEN","danger");
  add("Your vision fades as the wasteland goes silent.");
  add(inTown?"Hours later, you wake on a cot in Solace.":"Hours later, you wake in the old house.");
  add("Someone dragged you back from the highway. They didn't do it for free.");
  add(`RESCUE TRAVEL: ${travel} TURNS   RECOVERY: 2 TURNS   TOTAL: ${penalty}`, "system");
  add(`HP RESTORED: ${player.hp}/${player.maxHp}   EQUIPMENT AND QUEST ITEMS RETAINED`, "system");
  stage="fallen"; add("[1] GET UP", "system");
}
function hurt(n) { player.hp = Math.max(0, player.hp - n); updateHud(); resultLine(`-${n} HP`, "danger"); if(player.hp<=0) handlePlayerDeath(); }
function armorDefense(){ return ({"Worn Jacket":2,"Reinforced Jacket":4})[player.armor] || 0; }
function weaponRange(){ return ({"Rusted Pipe":[5,10],"Claw Hammer":[7,13],"Tire Iron":[9,16],"Yardman\'s Wrench":[11,18],"Heavy Wrench":[11,18]})[player.weapon] || [5,10]; }
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
  const existing=player.pack.find(i=>i.name===name && i.type===type);
  if(existing){ existing.qty+=qty; updateHud(); resultLine(`PACK: + ${name}${qty>1?` ×${qty}`:""}`,"reward"); return true; }
  if (packSlotsUsed() >= player.packMax) { add(`PACK FULL — You leave ${name} behind.`, "system"); return false; }
  player.pack.push({name,qty,type}); updateHud(); resultLine(`PACK: + ${name}${qty>1?` ×${qty}`:""}`, "reward"); return true;
}
function showStatus() {
  add("────────────────────────────────────────", "system");
  add(`HANDLE ${player.handle || "---"}   LEVEL ${String(player.level).padStart(2,"0")}   HP ${player.hp}/${player.maxHp}   XP ${player.xp}/${player.nextXp}`);
  add(`BOLTS ${player.bolts}   TURNS ${testMode?"∞ TEST":`${player.turns}/${player.maxTurns}`}   PACK ${packSlotsUsed()}/${player.packMax}   TIME ${timePhase()}`);
  add(`NEXT TURN REFILL: ${testMode?"TEST MODE — LIMIT DISABLED":refillText()}`, "system");
  const [dmin,dmax]=weaponRange();
  add(`WEAPON: ${player.weapon==="Heavy Wrench"?"Yardman's Wrench":player.weapon} — DMG ${dmin}–${dmax}   ARMOR: ${player.armor} — DEF ${armorDefense()}`);
  add("(B) BACK", "system");
  add("────────────────────────────────────────", "system");
}
function showQuests(){
  add("──────────────── QUEST LOG ────────────────","system");
  add("ACTIVE","bright"); let active=0;
  if(player.flags.mainSolaceQuest!=="done"){active++;add("MAIN — HEAD TO SOLACE");add("Follow the coordinates logged in the battered GPS and reach Solace.","system");}
  if(["active","found"].includes(player.flags.timQuest)){active++;add("SIDE — THE OLD BADGE");add(player.flags.timQuest==="found"?"Return Tim's old badge to him in Solace.":"Search Route 127 between Solace and the old house.","system");}
  if(["active","found"].includes(player.flags.murphyQuest)){active++;add("SIDE — ONE GOOD BELT");add(player.flags.murphyQuest==="found"?"Return the usable serpentine belt to Murphy.":"Search near the service-road fork toward the old house.","system");}
  if(player.flags.relayQuest==="ask"){active++;add("MAIN — RELAY STATION");add("Ask around Solace about the Relay Station.","system");}
  if(player.flags.relayQuest==="find"){active++;add("MAIN — RELAY STATION");add("Find and investigate the Relay Station in Solace.","system");}
  if(player.flags.relayQuest==="complete"){active++;add("MAIN — RELAY STATION: CONNECTION STABILIZED","reward");}
  if(player.flags.relayQuest==="stabilize"){
    active++; add("MAIN — THE RELAY"); const rp=ensureRelayParts(); const count=Object.values(rp).filter(Boolean).length;
    if(!player.flags.relayPartsRevealed){ add("Inspect all four Relay systems and learn what is failing.","system"); const ri=player.flags.relayInspected||{}; if(ri.console)add("• CONSOLE — Power regulator failed. Johnny hoards old electronics.","system"); if(ri.antenna)add("• ANTENNA — Antenna servo seized. The county maintenance yard had old motor assemblies.","system"); if(ri.cables)add("• CABLES — Shielded feed coupler burned out. A lower utility/access road may still have signal hardware.","system"); if(ri.monitor)add("• MONITOR — Signal-conditioning module is dead. You passed old communications equipment east of Solace.","system"); }
    else { add(`Recover four components needed to stabilize the Relay. PARTS ${count}/4.`,"system"); add(`${rp.johnny?"✓":"□"} POWER REGULATOR — Johnny may have something this old.`,"system"); add(`${rp.yard?"✓":"□"} ANTENNA SERVO — Search the county maintenance yard.`,"system"); add(`${rp.branch?"✓":"□"} SHIELDED FEED COUPLER — Search the Lower Access Road off the fork.`,"system"); add(`${rp.east?"✓":"□"} SIGNAL-CONDITIONING MODULE — Search old communications equipment east of Solace.`,"system"); if(count>=4)add("Return to the Relay Station and stabilize the connection.","bright"); }
  }
  if(!active)add("NONE","system");
  add("");add("COMPLETED","bright"); let completed=0;
  if(player.flags.mainSolaceQuest==="done"){completed++;add("MAIN — HEAD TO SOLACE");add("Reached the settlement of Solace.","system");}
  if(player.flags.timQuest==="done"){completed++;add("SIDE — THE OLD BADGE");add("Returned Tim's old badge. Reward: 70 XP · 30 Bolts","system");}
  if(player.flags.murphyQuest==="done"){completed++;add("SIDE — ONE GOOD BELT");add("Brought Murphy a usable serpentine belt. Reward: 65 XP · 35 Bolts","system");}
  if(!completed)add("NONE","system"); add("(B) BACK","system"); add("────────────────────────────────────────","system");
}
function showInventory() {
  add("──────────────── INVENTORY ────────────────", "system");
  add(`BOLTS — ${player.bolts}`, "bright");
  add(`WORN BACKPACK — ${packSlotsUsed()} / ${player.packMax} SLOTS`, "bright");
  const normal=player.pack.filter(i=>!["key","quest"].includes(i.type));
  const keys=player.pack.filter(i=>["key","quest"].includes(i.type));
  for(let i=0;i<player.packMax;i++){
    const item=normal[i];
    add(`[${i+1}] ${item ? item.name + (item.qty>1?` ×${item.qty}`:"") + `  <${item.type.toUpperCase()}>` : "EMPTY"}`);
  }
  if(keys.length){ add("KEY ITEMS", "bright"); keys.forEach(i=>add(`• ${i.name}${i.qty>1?` ×${i.qty}`:""}`)); }
  add("Select an item by NUMBER. (B) BACK. Full commands still work.", "system");
  add("────────────────────────────────────────", "system");
}
function inspectItem(name){
  const item=findItem(name); if(!item){add("You aren't carrying that.","system"); return;}
  const info={
    "Energy Bars":"ENERGY BAR — Consumable — Restore: 10 HP. Dense, stale, and technically food. USE one to recover health.",
    "Battered Flashlight":"A scratched LED flashlight. Still works. Mostly. Useful anywhere darkness is the problem. Can be dismantled for Bolts and Electronics.",
    "Cloth":"Salvaged fabric. Useful for bandages and basic crafting.",
    "Wire":"Copper wire with enough insulation left to matter.",
    "Scrap Metal":"Bent but usable metal for repairs and crafting.",
    "Bandage":"A clean-enough field dressing. USE to recover 18 HP.",
    "Electronics":"Small reusable electronic components.",
    "Fuel":"A small amount of old but usable fuel."
  };
  add(`${item.name.toUpperCase()} — ${info[item.name]||"Salvage from the road. It may be useful for crafting."}`,"bright");
}
function useItem(name){
  const item=findItem(name); if(!item){add("You aren't carrying that.","system"); return;}
  if(item.name==="Energy Bars") { if(player.hp>=player.maxHp){add("You're already at full health.","system");return;} removeItem("Energy Bars"); player.hp=Math.min(player.maxHp,player.hp+10); updateHud(); add("You eat an energy bar. +10 HP","reward"); }
  else if(item.name==="Bandage") { if(player.hp>=player.maxHp){add("You're already at full health.","system");return;} removeItem("Bandage"); player.hp=Math.min(player.maxHp,player.hp+18); updateHud(); add("You wrap the worst of it. +18 HP","reward"); }
  else if(item.name==="Battered Flashlight") {
    add("The flashlight works. You switch it back off to save the battery.","bright");
  }
  else add("You can't use that directly here.","system");
}
function showCombatItems(){
  const usable=player.pack.filter(i=>i.name==="Bandage"||i.name==="Energy Bars");
  add("──────────── COMBAT ITEMS ────────────","system"); if(!usable.length){add("NO USABLE COMBAT ITEMS","system");add("(B) BACK","system");return;}
  usable.forEach((i,n)=>add(`[${n+1}] ${i.name}${i.qty>1?` ×${i.qty}`:""} — ${i.name==="Bandage"?"+18 HP":"+10 HP"}`)); add("Choose a NUMBER to use it. (B) BACK","system");
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
  const actions = item.type==="weapon" || item.type==="armor" ? "(E) EQUIP   (D) DROP   (B) BACK" : item.name==="Battered Flashlight"
    ? "(D) DISMANTLE   (B) BACK"
    : item.type==="consumable"
      ? "(U) USE   (D) DROP   (B) BACK"
      : (["key","quest"].includes(item.type) ? "(B) BACK" : "(D) DROP   (B) BACK");
  addImmediate(actions,"system");
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
  add("SOLACE BULLETIN BOARD","place");
  add("WANTED: Parts from the old relay station.");
  add("MISSING: Two runners. Last seen eastbound.");
  add("NOTICE: Stop leaving broken glass outside Jen's bar.");
  add("Someone has added underneath: THEN GIVE US BETTER CUPS.","system");
  const posts=getBoardPosts();
  if(posts.length){
    add("— TRAVELER POSTS —","bright");
    posts.forEach(post=>add(`> ${(post.handle||"TRAVELER").toUpperCase()} — DAY ${post.day||1}: ${post.text}`,"system"));
  } else add("No traveler messages yet.","system");
  add(`POST <message> — max ${BOARD_MAX_CHARS} characters   TOWN`,"system");
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
  return allSaveData().filter(x=>x.data).sort((a,b)=>new Date(b.data.savedAt||0)-new Date(a.data.savedAt||0))[0]||null;
}
function saveLocationLabel(data){
  const s=(data&&data.stage)||"unknown";
  if(s==="mercy"||s==="settlement") return "SOLACE";
  if(s==="house"||s==="roadReady") return "OLD HOUSE";
  if(s==="encounter"||s==="between") return "ROUTE 127";
  return s.toUpperCase();
}
function titleScreen(){
  input.placeholder="Command"; pendingNewGameSlot=null; busy=false; input.disabled=false; hud.classList.add("hidden"); screen.innerHTML=""; stage="title"; utilityPanel.classList.add("hidden");
  add("", "system");
  add("ROUTE 127", "title-logo");
  add("LAST LANTERN WORKSHOP", "system");
  add("");
  const newest=newestSave();
  if(newest){
    add("[ CONTINUE ]", "bright"); add("[ NEW GAME ]", "system"); add("");
    allSaveData().forEach(({slot,data})=>{
      if(data) add(`SAVE ${slot} — ${(data.player&&data.player.handle)||"NO HANDLE"} — LV ${String((data.player&&data.player.level)||1).padStart(2,"0")} — ${saveLocationLabel(data)}`, slot===newest.slot?"bright":"system");
      else add(`SAVE ${slot} — EMPTY`, "system");
    });
    add("CONTINUE loads the newest save. LOAD 1 / LOAD 2 / LOAD 3 loads a specific slot.", "system");
  } else {
    add("[ CONTINUE — NO SAVE FOUND ]", "system"); add("[ NEW GAME ]", "bright"); add("[ SKIP INTRO — TESTING ]", "bright"); add("");
    add("No save exists in this build yet. SKIP INTRO starts at the old house so you do not have to replay the transmission while testing.", "system");
  }
  input.focus();
}
function resetPlayer(){
  Object.assign(player,{handle:"",level:1,hp:100,maxHp:100,xp:0,nextXp:100,bolts:12,bankBolts:0,turns:20,maxTurns:60,weapon:"Rusted Pipe",armor:"Worn Jacket",pack:[{name:"Energy Bars",qty:2,type:"consumable"},{name:"Battered Flashlight",qty:1,type:"tool"}],packMax:8,flags:{billboard:false,helpedTraveler:false,travelerInSolace:false,houseBandage:false,forkDiscovered:false,mercyDiscovered:false,serviceBossDead:false,serviceReward:false,rentedRoom:false,timQuest:"locked",timQuestSteps:0,murphyQuest:"locked",murphyQuestSteps:0,pendingQuest:"",mainSolaceQuest:"active",relayQuest:"locked",relayUnlocked:false,relayVisited:false,interfaceUnlocked:false,roomSearched:false,introFailed:false,worldHour:8,relayInspected:{},relayPartsRevealed:false,relayParts:{johnny:false,yard:false,branch:false,east:false},relayJohnnyAsked:false,relayBranchDiscovered:false,eastRouteDiscovered:false},wandererState:{},recentEncounters:[],deathStreak:0,encounterDone:{},stash:[],dailyDeal:["Energy Bars","Bandage","Reinforced Jacket","Claw Hammer","Tire Iron"][Math.floor(Math.random()*5)]});
  roadTurn=0; dailyRoadTurns=0; roadTurnCharged=false; roadGoal="mercy"; roadTripLength=9; mercyLocation="town"; rerollRoad(9); updateHud();
}
function skipIntroForTesting(){
  resetPlayer();
  hud.classList.remove("hidden"); utilityPanel.classList.remove("hidden"); screen.innerHTML=""; signal.textContent="SIGNAL LOGGED";
  add("TEST START — INTRO SKIPPED", "system");
  add("The Solace coordinates are already logged.", "system");
  activeSaveSlot=0;
  arriveHouse();
}

function utilityMenu(){ add("(S) STATUS   (I) INVENTORY   (M) MAP   (Q) QUESTS   (V) SAVE", "system"); }
function mapPosition(){
  const total = Math.max(1, roadTripLength || 5);
  if(stage === "house" || stage === "wake" || stage === "hello" || stage === "listen" || stage === "savecoords" || stage === "roadReady") return {pos:0,total};
  if(stage === "mercy" || stage === "settlement") return {pos:total,total};
  const travelled = Math.max(0, Math.min(total, roadTurn));
  return {pos: roadGoal === "house" ? total-travelled : travelled, total};
}
function showMap(){
  const {pos,total}=mapPosition();
  const nodes=[];
  for(let i=0;i<=total;i++) nodes.push(i===pos?"X":"o");
  const left = pos===0 ? "X HOUSE" : "HOUSE";
  const right = pos===total ? "SOLACE X" : "SOLACE";
  const middle = nodes.slice(1,-1).join("──");
  let route;
  if(total<=1) route=`${left} ── ${right}`;
  else route=`${left} ──${middle?middle+"──":""} ${right}`;
  add("────────────────── MAP ──────────────────", "system");
  add("BATTERED GPS — ROUTE 127 / SOUTHERN STRETCH", "bright");
  add(route);
  if(player.flags.forkDiscovered){ const indent=" ".repeat(Math.max(8,Math.floor(route.length*.45))); add(`${indent}|`); add(`${indent}${serviceRoadDepth>0?"X":"o"}── SERVICE ROAD${player.flags.serviceBossDead?" — CLEARED":""}`); }
  add(`DISTANCE TO HOUSE: ${pos}   DISTANCE TO SOLACE: ${total-pos}`); if(stage==="serviceRoad" || stage==="relayBranch")add("SIDE ROUTE — your main-road marker stays at the fork.","system"); if(player.flags.eastRouteDiscovered)add("SOLACE ──o──o──o──o──o──o── EASTERN ROAD","system"); if(player.flags.relayBranchDiscovered)add("          └──o──o──o  RELAY SALVAGE BRANCH","system");
  add(`TURNS REMAINING: ${testMode?"∞ TEST":`${player.turns}/${player.maxTurns}`}`);
  add(`NEXT REFILL: ${testMode?"TEST MODE":refillText()}`);
  add("X = YOU   Map use costs no turns.", "system");
  add("(B) BACK", "system");
  add("────────────────────────────────────────", "system");
}
function serializablePlayer(){
  const copy=JSON.parse(JSON.stringify(player, (k,v)=>v instanceof Set?[...v]:v));
  copy.encounterDone={};
  for(const [k,v] of Object.entries(player.encounterDone||{})) copy.encounterDone[k]=[...(v instanceof Set?v:new Set(v||[]))];
  return copy;
}
function gameplayStageForSave(){
  // UI overlays are not physical locations. Never persist one as the game stage.
  const overlay=["inventory","inventoryItem","quests","interfaceStatus","interfaceMap","interfaceSave","confirmSaveOverwrite"];
  const candidate=overlay.includes(stage) ? returnStage : stage;
  return candidate && !overlay.includes(candidate) ? candidate : "between";
}
function saveGame(slot=activeSaveSlot){
  if(!slot){ add("UNSAVED GAME — Choose SAVE 1, SAVE 2, or SAVE 3.","system"); return; }
  if(getSaveData(slot) && slot!==activeSaveSlot && pendingSaveSlot!==slot){ pendingSaveSlot=slot; add(`SAVE ${slot} ALREADY EXISTS — OVERWRITE?`,"danger"); add("(Y) YES   (N) NO","system"); stage="confirmSaveOverwrite"; return; }
  pendingSaveSlot=null; activeSaveSlot=slot; const data={version:25.18,day,wandererSerial,savedAt:new Date().toISOString(),stage:gameplayStageForSave(),roadTurn,dailyRoadTurns,roadGoal,roadTripLength,roadTurnCharged,serviceRoadDepth,mercyLocation,roadEncounterOrder,wandererLocations,currentRoadWanderer,currentTownWanderer,player:serializablePlayer()};
  try{ localStorage.setItem(SAVE_KEYS[slot],JSON.stringify(data)); add(`SAVE ${slot} — ${player.handle || "NO HANDLE"}`, "bright"); add("Game saved.", "reward"); }
  catch(e){ add("SAVE FAILED — This browser did not allow local storage for this file.", "danger"); }
}
function loadGame(slot=activeSaveSlot){
  activeSaveSlot=slot; const data=getSaveData(slot);
  if(!data){ add("SAVE GAME 01 is empty.", "system"); return; }
  Object.assign(player,data.player||{}); ensureRelayParts();
  player.flags=player.flags||{};
  const savedFlags=(data.player&&data.player.flags)||{};
  if(player.flags.mainSolaceQuest===undefined && savedFlags.mainMercyQuest!==undefined) player.flags.mainSolaceQuest=savedFlags.mainMercyQuest;
  if(player.flags.travelerInSolace===undefined && savedFlags.travelerInMercy!==undefined) player.flags.travelerInSolace=savedFlags.travelerInMercy;
  const hadInterfaceFlag=savedFlags.interfaceUnlocked!==undefined;
  for(const [k,v] of Object.entries({timQuest:"locked",timQuestSteps:0,murphyQuest:"locked",murphyQuestSteps:0,pendingQuest:"",overnight:"",overnightLocked:false,nextRefillAt:Date.now()+REFILL_MS,wandererRoadCooldown:0,mainSolaceQuest:(player.flags.mercyDiscovered?"done":"active"),relayQuest:"locked",relayUnlocked:false,relayVisited:false,interfaceUnlocked:false,roomSearched:false,introFailed:false,worldHour:8,relayInspected:{}})) if(player.flags[k]===undefined) player.flags[k]=v;
  if(!hadInterfaceFlag) player.flags.interfaceUnlocked=!( ["wake","wakeNamed","handle","confirmHandle","standing","hello","listen","savecoords"].includes(data.stage) );
  if(player.flags.mercyDiscovered && player.flags.relayQuest==="locked") player.flags.relayQuest="ask";
  testMode=false; startRefillTimer();
  player.encounterDone={};
  for(const [k,v] of Object.entries((data.player&&data.player.encounterDone)||{})) player.encounterDone[k]=new Set(v||[]);
  stage=data.stage||"house";
  if(["inventory","inventoryItem","quests","interfaceStatus","interfaceMap","interfaceSave","confirmSaveOverwrite"].includes(stage)) stage="between";
  returnStage=stage;
  day=data.day||1; wandererSerial=data.wandererSerial||0; serviceRoadDepth=data.serviceRoadDepth||0; roadTurn=data.roadTurn||0; dailyRoadTurns=Number(data.dailyRoadTurns)||0; roadTurnCharged=!!data.roadTurnCharged; roadGoal=data.roadGoal||"mercy"; roadTripLength=Math.max(8,data.roadTripLength||8); if(roadTurn>=roadTripLength) roadTurn=Math.max(0,roadTripLength-1);
  mercyLocation=data.mercyLocation||"town"; roadEncounterOrder=Array.isArray(data.roadEncounterOrder)?data.roadEncounterOrder:roadEncounterOrder;
  wandererLocations=(data.wandererLocations&&typeof data.wandererLocations==="object")?data.wandererLocations:rollWandererLocations();
  currentRoadWanderer=data.currentRoadWanderer||null; currentTownWanderer=data.currentTownWanderer||null; pendingTownFight=null; combatState=null;
  if(player.flags.interfaceUnlocked!==false){hud.classList.remove("hidden");utilityPanel.classList.remove("hidden");}else{hud.classList.add("hidden");utilityPanel.classList.add("hidden");} updateHud(); screen.innerHTML="";
  add(`SAVE ${slot} — ${(player.handle||"NO HANDLE")}`, "bright"); add("Save loaded.", "reward");
  if(stage==="house") arriveHouse();
  else if(stage==="mercy"){ add("SOLACE", "place"); mercyMenu(); }
  else if(stage==="settlement"){ add("SOLACE GATE", "place"); add("The settlement waits beyond the barricade."); add("(P) APPROACH GATE", "system"); }
  else if(stage==="encounter" || stage==="between" || stage==="wandererRoad" || stage==="combat"){ stage="between"; showEncounter(); }
  else if(stage==="roadReady"){ add("THE OLD HOUSE", "place"); add("The road east leads toward Solace."); add("STATUS   INVENTORY   MAP   SAVE 1/2/3   ROAD", "system"); }
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
  pendingHandle=h; add(`HANDLE: ${h.toUpperCase()}`,"bright"); add("Is this correct? (Y) YES [ENTER]   (N) CHANGE","system"); stage="confirmHandle"; return true;
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
async function reveal() {
  busy = true; input.disabled = true; add("");
  await typeLine("WOMAN'S VOICE > I'm going to try to send you something.", "woman", 26);
  await typeLine("MAN'S VOICE > That's not going to work.", "man", 28);
  await typeLine("WOMAN'S VOICE > It might.", "woman", 30); add("");
  await typeLine("TRANSFER: 3%", "system", 30); await typeLine("TRANSFER: 17%", "system", 25); await typeLine("TRANSFER: 61%", "system", 20);
  await typeLine("DISPLAY LINK ESTABLISHED", "bright", 22);
  transmission.classList.remove("live"); void transmission.offsetWidth; transmission.classList.add("live");
  transmission.scrollIntoView({behavior:"smooth",block:"center"});
  await sleep(1000); transmission.classList.remove("live");
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
    add("MAIN — HEAD TO SOLACE","bright");
    add("Follow the coordinates logged in the battered GPS and reach Solace.","system");
    queueChoiceLine("(R) ROAD — BEGIN JOURNEY");
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
  {name:"Mara", level:3, vibe:"watchful", lines:["MARA > Road's quieter when it shouldn't be.","Mara gives you a short nod and keeps one hand near her coat."]},
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
function wandererDialogue(w){ const st=ws(w.name); const pools={Mara:["MARA > Still walking? Good.","MARA > Road east smells like rain and trouble.","MARA > You again. Route's getting crowded."],Patch:["PATCH > Found a washer too. Huge day.","PATCH > If it still turns, somebody can use it."],Ash:["ASH > I'm not staying long.","ASH > You ask a lot of questions.","ASH > Seriously. What do you want?"]}; const pool=pools[w.name]||[`${w.name.toUpperCase()} > Road keeps moving. So do I.`,`${w.name} glances toward the horizon. "Seen worse days."`,`"Still here?" ${w.name} almost smiles.`]; let line=pool[Math.floor(Math.random()*pool.length)]; if(pool.length>1&&line===st.lastLine)line=pool[(pool.indexOf(line)+1)%pool.length]; st.lastLine=line; st.talks++; return line; }

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
  const w=pool[Math.floor(Math.random()*pool.length)]; if(!w){stage="between";showEncounter();return;}
  const st=ws(w.name), first=!st.met; st.met=true; st.lastSeen=wandererSerial++; currentRoadWanderer=w.name;
  add(""); add(`ROAD TURN ${dailyRoadTurns} — WANDERER`,"place");
  add(first?"Another stretch of Route 127 disappears behind you. Someone unfamiliar is ahead on the road.":`A familiar figure is ahead. ${w.name} recognizes you too.`);
  showWanderer(w,"road"); stage="wandererRoad";
}
wandererLocations=rollWandererLocations();

const encounters = [
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
    resolve(cmd){ if(cmd.includes("truck")||cmd.includes("search")){gainBolts(8);addPack("Scrap Metal");gainXp(10);add("You make one last salvage stop before the descent.");} else if(cmd.includes("watch")){gainXp(12);add("You count two guards, one gate, and smoke from at least a dozen chimneys.");} else if(cmd.includes("head")||cmd.includes("light")){gainXp(15);add("You tighten your pack straps and start down the hill.");} else if(cmd.includes("wait")){add("You listen for gunfire. None comes. Eventually you move on.");} else return false; return true;} },
  { exclusive:true, title:"THE BIG MAN", text:"A broad-shouldered scavenger steps into the road. He is bigger than you by a lot, wearing a tire-tread vest and carrying a length of chain. He looks at your pack, then at you. 'Toll road.'", choices:"FIGHT HIM   PAY 6 BOLTS   BACK DOWN",
    resolve(cmd){ if(cmd.includes("fight")){ const dealt=rollDamage(); add(`You catch him once with the pipe for ${dealt} damage. It only makes him angry.`,"bright"); enemyHit(34,46); const stolen=Math.min(player.bolts,Math.floor(Math.random()*6)+5); player.bolts-=stolen; updateHud(); add(`You wake in the ditch. He took ${stolen} Bolts, but left you breathing.`,"danger"); gainXp(18);} else if(cmd.includes("pay")){ if(player.bolts<6){add("You don't have 6 Bolts.","system");return false;} player.bolts-=6;updateHud();gainXp(6);add("He weighs the bolts in his palm and waves you through.");} else if(cmd.includes("back")){gainXp(4);add("You swallow your pride and take the long way around. Sometimes surviving is the win.");} else return false; return true;} },
  { title:"BROKEN MOTEL", text:"A six-room roadside motel sags toward the highway. Two doors stand open. A third is chained shut from the outside.", choices:"SEARCH ROOM 2   CHECK OFFICE   INSPECT CHAINED ROOM   MOVE ON",
    resolve(cmd){ if(cmd.includes("room 2")){hurt(5);gainBolts(8);gainXp(10);add("A rotten floorboard gives way, but an old toolbox pays for the bruise.");} else if(cmd.includes("office")){addPack("Energy Bars","consumable");gainXp(8);add("One sealed energy bar survives behind the desk.");} else if(cmd.includes("chain")){gainXp(8);add("A heavy chain loops twice through the handles and a battered padlock holds it tight. The door is reinforced from the outside.");add("Fresh scratches score the bottom of the frame—from the inside.","bright");add("You can’t tell whether something was trying to get in... or get out.");} else return false; return true;} },
  { exclusive:true, title:"HIGHWAY ROBBERS", text:"Two figures rise from behind the guardrail. One has a tire iron. The other has a homemade spear. 'Pack on the ground.'", choices:"FIGHT   THROW 5 BOLTS   RUN",
    resolve(cmd){ if(cmd.includes("fight")){const dealt=rollDamage();add(`Your pipe lands for ${dealt} damage.`,"bright");enemyHit(18,28);gainBolts(9);gainXp(24);add("They break first and disappear into the weeds.");} else if(cmd.includes("throw")){const paid=Math.min(5,player.bolts);player.bolts-=paid;updateHud();gainXp(8);add(`You scatter ${paid} Bolts across the pavement and move while they scramble for them.`);} else if(cmd.includes("run")){hurt(6);gainXp(6);add("You get away, but not before the spear catches your jacket.");} else return false;return true;} },
  { title:"DRAINAGE CULVERT", text:"Rainwater trickles through a concrete culvert beneath the highway. Something reflective glints twenty feet inside. The concrete around the entrance is slick with moss.", choices:"CLIMB INSIDE   REACH FROM EDGE   SEARCH BANK   MOVE ON",
    resolve(cmd){ if(cmd.includes("inside")){hurt(7);gainBolts(13);gainXp(12);add("You slip hard, but the glint is a pouch of machine hardware.");} else if(cmd.includes("reach")){gainBolts(4);gainXp(6);add("You snag only what you can reach without committing to the tunnel.");} else if(cmd.includes("bank")){addPack("Cloth");gainXp(5);add("A weatherproof scrap of fabric is tangled in the brush.");} else return false;return true;} },
  { exclusive:true, title:"ROACH NEST", text:"A rusted delivery van rocks once on its dead suspension. Then fist-sized roaches begin pouring from beneath it, antennae twitching toward you.", choices:"CRUSH THEM   KICK OPEN VAN   BACK AWAY",
    resolve(cmd){ if(cmd.includes("crush")){hurt(5);gainXp(16);gainBolts(3);add("The pipe makes ugly work of the swarm. A few usable bolts lie beneath the nest.");} else if(cmd.includes("kick")||cmd.includes("van")){hurt(9);gainXp(20);gainBolts(7);addPack("Scrap Metal");add("You crack the van open, fight through the nest, and salvage what's left inside.");} else if(cmd.includes("back")){gainXp(3);add("You decide the van belongs to the roaches.");} else return false; return true;} },
  { exclusive:true, title:"TUNNEL RATS", text:"A pack of oversized rats spills from a storm drain and fans across the road. There are too many to ignore if you keep walking straight.", choices:"FIGHT PACK   CLIMB WRECK   THROW FOOD",
    resolve(cmd){ if(cmd.includes("fight")){hurt(12);gainXp(22);gainBolts(4);add("They swarm your boots until the pipe convinces the survivors to scatter.");} else if(cmd.includes("climb")||cmd.includes("wreck")){hurt(4);gainXp(10);add("You scramble onto a wreck and wait them out. One gets a bite in first.");} else if(cmd.includes("food")||cmd.includes("throw")){if(!hasItem("Energy Bars")){add("You don't have food to throw.","system");return false;} removeItem("Energy Bars");gainXp(12);add("The pack follows the food into the weeds. Effective, if expensive.");} else return false; return true;} },
  { exclusive:true, title:"FERAL DOG", text:"A scarred dog steps from the brush with its head low and teeth showing. This one is not asking to be rescued.", choices:"FIGHT DOG   OFFER FOOD   HOLD GROUND",
    resolve(cmd){ if(cmd.includes("fight")){hurt(15);gainXp(24);add("Fast, mean, and desperate. You drive it off before it can do worse.");} else if(cmd.includes("food")||cmd.includes("offer")){if(!hasItem("Energy Bars")){add("You don't have food to offer.","system");return false;} removeItem("Energy Bars");gainXp(16);add("The dog snatches the food and disappears into the brush.");} else if(cmd.includes("hold")){hurt(6);gainXp(14);add("You keep the pipe raised and refuse to run. After a long stare, it backs away.");} else return false; return true;} },
  { exclusive:true, title:"LONE SCAVENGER", text:"A scavenger is stripping copper from a wreck when he spots you. His hand drops to a short blade. Neither of you looks eager to share the shoulder.", choices:"FIGHT   OFFER TRADE   WARN HIM OFF",
    resolve(cmd){ if(cmd.includes("fight")){hurt(14);gainXp(25);gainBolts(8);add("He gives ground after two hard exchanges and leaves a pouch behind.");} else if(cmd.includes("trade")||cmd.includes("offer")){if(player.bolts<4){add("You need 4 Bolts to make the offer.","system");return false;} player.bolts-=4;updateHud();addPack("Wire");gainXp(12);add("Four Bolts buys a coil of stripped wire and a peaceful road.");} else if(cmd.includes("warn")){gainXp(10);add("You tap the pipe against the guardrail. He decides another wreck will do.");} else return false; return true;} },
  { exclusive:true, title:"GANG LOOKOUT", text:"A teenager in a patched road vest watches from an overpass with a hunting knife and a whistle. You spot him a second before he can signal whoever is nearby.", choices:"RUSH HIM   SNEAK AROUND   INTIMIDATE",
    resolve(cmd){ if(cmd.includes("rush")){hurt(10);gainXp(23);gainBolts(5);add("You reach him before the whistle does. He bolts, dropping a small hardware pouch.");} else if(cmd.includes("sneak")){gainXp(14);add("You vanish through the drainage weeds before he gets a clean look at you.");} else if(cmd.includes("intimidate")){gainXp(16);add("You point the pipe at the whistle. He thinks better of testing you.");} else return false; return true;} },
  { exclusive:true, title:"THE CRAWLER", text:"Something pale shifts beneath an overturned station wagon. A long arm reaches into the daylight, followed by a shape that moves too quickly on all fours.", choices:"FIGHT CRAWLER   CLIMB BARRIER   RETREAT",
    resolve(cmd){ if(cmd.includes("fight")){hurt(19);gainXp(30);gainBolts(6);addPack("Chemicals");add("It finally stops moving. A scavenger's torn satchel nearby still holds useful chemicals.");} else if(cmd.includes("climb")||cmd.includes("barrier")){hurt(7);gainXp(15);add("You get over the concrete divider before it reaches you.");} else if(cmd.includes("retreat")){gainXp(5);add("You give the wreck a very wide berth. Whatever it is can keep the car.");} else return false; return true;} },
  { exclusive:true, title:"SECURITY DRONE", text:"A squat pre-collapse highway security unit twitches awake beside a ruined toll booth. One optic burns weak red. 'RESTRICTED... CORRIDOR... PRESENT... AUTHORIZATION.'", choices:"SMASH DRONE   CIRCLE BEHIND   MOVE ON",
    resolve(cmd){ if(cmd.includes("smash")||cmd.includes("drone")){hurt(22);gainXp(34);addPack("Electronics");gainBolts(8);add("The pipe dents more than it breaks, but eventually the old machine dies. Its control board is still salvageable.");} else if(cmd.includes("circle")||cmd.includes("behind")){hurt(6);gainXp(18);addPack("Wire");add("Its damaged optic can't track you through the booth. You pull loose cable on the way past.");} else return false; return true;} },
  { exclusive:true, title:"THE WRECKERS", text:"Two raiders are stripping an ambulance on the shoulder. One notices you and rests a pry bar across his shoulder. 'Plenty here. None of it yours.'", choices:"FIGHT WRECKERS   BARGAIN   STEAL SUPPLIES",
    resolve(cmd){ if(cmd.includes("fight")){hurt(20);gainXp(32);gainBolts(10);addPack("Bandage","consumable");add("They run when the fight stops being easy. The ambulance gives up one clean bandage.");} else if(cmd.includes("bargain")){if(player.bolts<5){add("You need 5 Bolts to bargain.","system");return false;} player.bolts-=5;updateHud();addPack("Bandage","consumable");gainXp(12);add("Five Bolts buys a sealed bandage and no broken teeth.");} else if(cmd.includes("steal")){hurt(11);gainXp(24);addPack("Bandage","consumable");add("You grab a medical pouch and run. The thrown pry bar nearly ruins the plan.");} else return false; return true;} },
  { exclusive:true, title:"SOMETHING IN THE DRAIN", text:"A metal scraping sound follows you beneath a cracked section of highway. A maintenance grate shudders. Something on the other side is breathing.", choices:"OPEN GRATE   POKE WITH PIPE   WALK AROUND",
    resolve(cmd){ if(cmd.includes("open")){hurt(18);gainXp(28);gainBolts(9);add("The thing hits the grate harder than expected. You win the argument and find a dead scavenger's bolt pouch inside.");} else if(cmd.includes("poke")||cmd.includes("pipe")){hurt(8);gainXp(18);add("Bad idea. Useful information, but still a bad idea.","danger");} else if(cmd.includes("walk")||cmd.includes("around")){gainXp(4);add("You decide some mysteries deserve privacy.");} else return false; return true;} },
  {exclusive:true, title:"THE HANGING SHOES", text:"Shoes sway from a cable across the road. One pair has been tied with bright copper wire.", choices:"CUT DOWN SHOES   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("shoes") && !cmd.includes("cut")) return false; gainBolts(5);addPack("Wire","material");gainXp(9);add("You recover a length of copper wire and a small pouch tucked in a boot.");return true;}},
  {exclusive:true, title:"THE LAST MAIL", text:"A postal truck is wedged against a concrete barrier. Hundreds of envelopes carpet the floor.", choices:"SORT PARCELS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("parcels") && !cmd.includes("sort")) return false; gainBolts(5);addPack("Cloth","material");gainXp(9);add("A parcel contains a sealed roll of cloth and a few useful fasteners.");return true;}},
  {exclusive:true, title:"THE FALSE SHOULDER", text:"The asphalt shoulder looks solid until a pebble drops straight through it.", choices:"PROBE GROUND   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("ground") && !cmd.includes("probe")) return false; gainXp(11);add("You find a safe crossing and mark the sinkhole with white stones.");return true;}},
  {exclusive:true, title:"CEMETERY OF TIRES", text:"Stacks of tires form a maze beneath a collapsed overpass. Something metallic glints at its center.", choices:"ENTER MAZE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("maze") && !cmd.includes("enter")) return false; hurt(2);gainBolts(6);addPack("Scrap Metal","material");gainXp(12);add("A forgotten toolbox waits in the middle of the rubber walls.");return true;}},
  {exclusive:true, title:"THE HONEY JAR", text:"A beekeeper suit hangs in a dead orchard. Bees still crowd a hollow tree.", choices:"SMOKE HIVE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("hive") && !cmd.includes("smoke")) return false; hurt(3);gainBolts(10);gainXp(10);add("You coax the swarm aside and find a sealed jar of honey, traded later for Bolts.");return true;}},
  {exclusive:true, title:"SALT ON THE ROAD", text:"A perfect circle of salt surrounds an overturned chair. The tracks outside stop abruptly.", choices:"INSPECT CIRCLE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("circle") && !cmd.includes("inspect")) return false; gainBolts(8);gainXp(10);add("The chair hides a small tin of coins and a message: DO NOT SIT.");return true;}},
  {exclusive:true, title:"THE PAPER STORM", text:"A gust fills the highway with old court records. One sheet carries a map drawn on the back.", choices:"FOLLOW PAPERS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("papers") && !cmd.includes("follow")) return false; gainBolts(4);addPack("Scrap Metal","material");gainXp(11);add("The map leads to a dry culvert containing scrap.");return true;}},
  {exclusive:true, title:"THE CAROUSEL HORSE", text:"A chipped fiberglass horse stands in a ditch, bolted to a concrete slab.", choices:"EXAMINE BASE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("base") && !cmd.includes("examine")) return false; gainBolts(9);gainXp(9);add("The base conceals a rusted cash box full of usable fasteners.");return true;}},
  {exclusive:true, title:"THE LOCKED FREEZER", text:"A restaurant freezer lies in the sun with a padlock on its door. Something knocks inside when the wind blows.", choices:"BREAK PADLOCK   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("padlock") && !cmd.includes("break")) return false; hurt(2);gainBolts(4);addPack("Cloth","material");gainXp(10);add("The knocking was a loose shelf. The insulated lining can be salvaged.");return true;}},
  {exclusive:true, title:"THE BRIDGE TOLL", text:"An old man has painted a toll booth on a sheet of plywood. He insists payment can be a joke.", choices:"(T) TELL JOKE   (B) BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("joke") && !cmd.includes("tell")) return false; gainBolts(3);gainXp(10);add("He laughs at the worst joke he has heard in years and hands over a bolt for the effort.");return true;}},
  {exclusive:true, title:"THE RAIN BARREL", text:"A row of barrels catches runoff beneath a ruined greenhouse. One is filled with glass marbles.", choices:"SIFT MARBLES   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("marbles") && !cmd.includes("sift")) return false; gainBolts(3);addPack("Wire","material");gainXp(10);add("Under the marbles sits a watertight repair kit.");return true;}},
  {exclusive:true, title:"THE BURNT LIBRARY", text:"Books spill from a scorched bookmobile. One shelf has escaped the flames.", choices:"SALVAGE BOOKS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("books") && !cmd.includes("salvage")) return false; addPack("Bandage","consumable");gainXp(13);add("You find a field guide with practical first-aid notes.");return true;}},
  {exclusive:true, title:"THE GARDEN GNOMES", text:"Dozens of painted gnomes face the same empty window. Fresh soil surrounds the smallest.", choices:"DIG NEAR GNOME   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("gnome") && !cmd.includes("dig")) return false; gainBolts(11);gainXp(8);add("Someone buried a stash of Bolts beneath the smallest statue.");return true;}},
  {exclusive:true, title:"THE MISSING STAIRS", text:"A stairwell rises from an empty foundation and ends at a door suspended in air.", choices:"CLIMB STAIRS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("stairs") && !cmd.includes("climb")) return false; hurt(3);gainBolts(4);addPack("Cloth","material");gainXp(12);add("Behind the doorframe is a hook with a forgotten canvas bag.");return true;}},
  {exclusive:true, title:"THE WASH LINE", text:"Clean bedsheets hang between two dead trees. No house stands within sight.", choices:"CHECK CLOTHESLINE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("clothesline") && !cmd.includes("check")) return false; addPack("Cloth","material");gainXp(10);add("The sheets are patched with surprisingly durable cloth.");return true;}},
  {exclusive:true, title:"THE PAINTED ARROWS", text:"Bright arrows have been painted across the pavement, each pointing in a different direction.", choices:"FOLLOW BLUE ARROW   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("arrow") && !cmd.includes("follow")) return false; gainBolts(7);gainXp(12);add("The blue arrow ends at a hidden cache under a guardrail.");return true;}},
  {exclusive:true, title:"THE WHEELBARROW", text:"A wheelbarrow full of stones sits in the center lane. A steel case is buried underneath.", choices:"UNLOAD STONES   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("stones") && !cmd.includes("unload")) return false; hurt(2);gainBolts(5);addPack("Scrap Metal","material");gainXp(12);add("You lift the last stone and claim the case of salvaged fittings.");return true;}},
  {exclusive:true, title:"THE SILENT PICNIC", text:"A picnic blanket holds four empty plates and a chessboard midgame. The food is long gone.", choices:"STUDY CHESSBOARD   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("chessboard") && !cmd.includes("study")) return false; gainBolts(6);gainXp(10);add("A hollow chess piece hides a handful of Bolts.");return true;}},
  {exclusive:true, title:"THE COIN WELL", text:"A roadside wishing well has dried out. Its bottom glitters with offerings.", choices:"(D) DESCEND WELL   (B) BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("well") && !cmd.includes("descend")) return false; hurt(4);gainBolts(12);gainXp(12);add("You climb back up with a fistful of hardware and scraped knuckles.");return true;}},
  {exclusive:true, title:"THE FENCE ARTIST", text:"Someone has woven a giant bird from scrap into a chain-link fence.", choices:"INSPECT SCULPTURE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("sculpture") && !cmd.includes("inspect")) return false; gainBolts(2);addPack("Scrap Metal","material");gainXp(10);add("A removable wing makes a useful strip of metal.");return true;}},
  {exclusive:true, title:"THE MILK CRATES", text:"A pyramid of crates blocks a driveway. A ratty flag marks the top.", choices:"SHIFT CRATES   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("crates") && !cmd.includes("shift")) return false; gainBolts(2);addPack("Energy Bars","consumable");gainXp(10);add("You find a wrapped emergency ration beneath the bottom crate.");return true;}},
  {exclusive:true, title:"THE DRY FOUNTAIN", text:"A cracked fountain holds thousands of bottle caps arranged into a spiral.", choices:"TRACE SPIRAL   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("spiral") && !cmd.includes("trace")) return false; gainBolts(8);gainXp(12);add("The spiral points to a loose stone hiding Bolts.");return true;}}
];

const eastEncounters = [
  {exclusive:true, title:"THE IRON HARVEST", text:"A combine crawls across an empty field, blades still spinning without a driver.", choices:"DISABLE BLADES   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("blades") && !cmd.includes("disable")) return false; hurt(9);gainBolts(12);addPack("Scrap Metal","material");gainXp(23);add("You jam its belt with a fallen branch and strip its casing.");return true;}},
  {exclusive:true, title:"THE GLASS FIELD", text:"An ancient fire fused the soil into jagged green glass. A supply box sits on the far side.", choices:"CROSS GLASS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("glass") && !cmd.includes("cross")) return false; hurt(7);gainBolts(12);addPack("Bandage","consumable");gainXp(20);add("You reach the box but slice your sleeve on the way.");return true;}},
  {exclusive:true, title:"THE BURIED FREIGHT", text:"A freight carriage protrudes from a hillside. Cargo containers lean at impossible angles.", choices:"PRY CARGO   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("cargo") && !cmd.includes("pry")) return false; hurt(8);gainBolts(15);addPack("Scrap Metal","material");gainXp(22);add("You recover a sealed crate of useful salvage.");return true;}},
  {exclusive:true, title:"THE RED RAIN", text:"Rust-colored rain sweeps across the road, stinging exposed skin.", choices:"FIND SHELTER   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("shelter") && !cmd.includes("find")) return false; hurt(4);gainBolts(7);addPack("Cloth","material");gainXp(20);add("You wait beneath a concrete lip and find an old cache there.");return true;}},
  {exclusive:true, title:"THE ASH PROCESSION", text:"Figures in ash-coated protective suits carry an empty coffin toward the hills.", choices:"FOLLOW PROCESSION   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("procession") && !cmd.includes("follow")) return false; gainBolts(14);gainXp(22);add("Their path passes a sheltered supply dump. They never acknowledge you.");return true;}},
  {exclusive:true, title:"THE COLLAPSED DAM", text:"Water surges through a broken spillway beside the highway.", choices:"CROSS SPILLWAY   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("spillway") && !cmd.includes("cross")) return false; hurt(9);gainBolts(13);addPack("Wire","material");gainXp(23);add("You leap a widening crack and find repair materials beyond it.");return true;}},
  {exclusive:true, title:"THE IRON CHOIR", text:"Wind makes hundreds of hanging engine valves ring like bells. A raider patrol is nearby.", choices:"SILENCE BELLS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("bells") && !cmd.includes("silence")) return false; hurt(5);gainBolts(16);gainXp(24);add("You tie off the valves and slip past the patrol to a stash.");return true;}},
  {exclusive:true, title:"THE FURNACE PIT", text:"A smoldering pit burns under an abandoned brickworks. Something valuable shines inside.", choices:"HOOK METAL   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("metal") && !cmd.includes("hook")) return false; hurt(8);gainBolts(10);addPack("Scrap Metal","material");gainXp(21);add("You pull out a forged bracket before the heat drives you away.");return true;}},
  {exclusive:true, title:"THE MASK MARKET", text:"Three masked traders auction items without speaking. Their bids are made with hand signs.", choices:"TRADE HAND SIGNS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("signs") && !cmd.includes("trade")) return false; gainBolts(17);gainXp(20);add("Your clumsy bid earns a laugh and a pouch of Bolts.");return true;}},
  {exclusive:true, title:"THE CRACKED AQUEDUCT", text:"A narrow aqueduct crosses the road overhead. The supports are buckling.", choices:"RUN UNDER ARCH   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("arch") && !cmd.includes("run")) return false; hurt(8);gainBolts(7);addPack("Wire","material");gainXp(24);add("Stone rains down behind you. You salvage a fallen tool pouch.");return true;}},
  {exclusive:true, title:"THE BONE FLAGS", text:"Polished bones hang from red flags at a ravine crossing.", choices:"SEARCH RAVINE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("ravine") && !cmd.includes("search")) return false; hurt(5);gainBolts(11);addPack("Cloth","material");gainXp(22);add("You uncover an abandoned expedition pack.");return true;}},
  {exclusive:true, title:"THE SCRAP DUEL", text:"Two armored scavengers settle a dispute by throwing sharpened hubcaps at targets.", choices:"CHALLENGE WINNER   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("winner") && !cmd.includes("challenge")) return false; hurt(6);gainBolts(20);gainXp(26);add("You win a small wager, though one hubcap clips your arm.");return true;}},
  {exclusive:true, title:"THE QUARRY LIFT", text:"An industrial lift hangs above a flooded quarry. Its hand crank still turns.", choices:"LOWER PLATFORM   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("platform") && !cmd.includes("lower")) return false; hurt(8);gainBolts(14);addPack("Scrap Metal","material");gainXp(23);add("The platform reaches a ledge with forgotten mining supplies.");return true;}},
  {exclusive:true, title:"THE BLACK SNOW", text:"Ash flakes fall like snow from a distant burn. Fresh bootprints appear through the dust.", choices:"TRACK FOOTPRINTS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("footprints") && !cmd.includes("track")) return false; hurt(4);gainBolts(16);gainXp(24);add("The prints lead to a hidden smuggler cache.");return true;}},
  {exclusive:true, title:"THE ROAD EATER", text:"A massive burrowing creature tears through the pavement ahead.", choices:"HIDE FROM BEAST   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("beast") && !cmd.includes("hide")) return false; gainXp(30);add("You survive by lying motionless as the road buckles nearby.");return true;}},
  {exclusive:true, title:"THE CHAIN BRIDGE", text:"A suspension footbridge swings over a dry gorge. Its middle planks are missing.", choices:"CROSS CHAINS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("chains") && !cmd.includes("cross")) return false; hurt(10);gainBolts(13);addPack("Wire","material");gainXp(25);add("You crawl the cables and claim a toolbox on the other side.");return true;}},
  {exclusive:true, title:"THE WELDED BUS", text:"A school bus has been welded into a crude armored bunker.", choices:"OPEN HATCH   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("hatch") && !cmd.includes("open")) return false; hurt(5);gainBolts(10);addPack("Bandage","consumable");gainXp(22);add("The bunker is abandoned, but its storage lockers remain intact.");return true;}},
  {exclusive:true, title:"THE WAX MUSEUM", text:"Life-size wax figures fill a shattered roadside attraction. One wears genuine armor.", choices:"STRIP MANNEQUIN   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("mannequin") && !cmd.includes("strip")) return false; hurt(3);gainBolts(9);addPack("Cloth","material");gainXp(22);add("The figure collapses into fragments as you recover its reinforced cloth.");return true;}},
  {exclusive:true, title:"THE STEEL ORCHARD", text:"Metal stakes stand in perfect rows where fruit trees once grew.", choices:"EXAMINE ROOTS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("roots") && !cmd.includes("examine")) return false; gainBolts(12);addPack("Scrap Metal","material");gainXp(21);add("The stakes conceal buried bolts and fasteners.");return true;}},
  {exclusive:true, title:"THE QUICKSAND CUT", text:"Fine gray silt covers a washed-out road. Half a wagon protrudes from the mud.", choices:"REACH WAGON   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("wagon") && !cmd.includes("reach")) return false; hurt(9);gainBolts(18);gainXp(23);add("You retrieve a pouch but lose your footing in the silt.");return true;}},
  {exclusive:true, title:"THE GRINDER CREW", text:"A salvage crew is feeding whole vehicles into an enormous hand-powered crusher.", choices:"BARGAIN FOR SCRAP   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("scrap") && !cmd.includes("bargain")) return false; gainBolts(8);addPack("Scrap Metal","material");gainXp(22);add("They sell you a box of offcuts for an unexpectedly fair price.");return true;}},
  {exclusive:true, title:"THE HOLLOW STATUE", text:"A giant concrete worker statue has fallen across the highway. Its chest is hollow.", choices:"ENTER STATUE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("statue") && !cmd.includes("enter")) return false; hurt(5);gainBolts(10);addPack("Wire","material");gainXp(24);add("Inside is a stash of tools left by an earlier traveler.");return true;}},
  {exclusive:true, title:"THE SALT MINERS", text:"A mining crew drags sleds of white mineral blocks across the road.", choices:"HELP PULL SLED   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("sled") && !cmd.includes("help")) return false; hurt(5);gainBolts(16);gainXp(24);add("The miners reward your effort with spare fittings.");return true;}},
  {exclusive:true, title:"THE CINDER WOLVES", text:"Heat-scarred predators stalk a charcoal forest, their eyes reflecting orange light.", choices:"SCARE PACK   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("pack") && !cmd.includes("scare")) return false; hurt(12);gainBolts(8);gainXp(28);add("You drive them off with noise but suffer a glancing bite.");return true;}},
  {exclusive:true, title:"THE BLADE CART", text:"A runaway handcart bristling with metal blades rolls downhill toward you.", choices:"DODGE CART   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("cart") && !cmd.includes("dodge")) return false; hurt(7);gainBolts(9);addPack("Scrap Metal","material");gainXp(24);add("It smashes into a barrier. You salvage its wheels.");return true;}},
  {exclusive:true, title:"THE EMPTY ARMORY", text:"A military bunker has been stripped clean except for a welded floor plate.", choices:"LIFT FLOOR PLATE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("plate") && !cmd.includes("lift")) return false; hurt(8);gainBolts(9);addPack("Bandage","consumable");gainXp(23);add("Beneath it sits a waterproof first-aid pouch.");return true;}},
  {exclusive:true, title:"THE BONE COLLECTOR", text:"A masked hunter carries trophies from creatures far larger than you.", choices:"KEEP DISTANCE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("distance") && !cmd.includes("keep")) return false; gainBolts(13);gainXp(27);add("You follow the hunter’s tracks to a dropped supply pouch, then leave quickly.");return true;}},
  {exclusive:true, title:"THE SUNKEN CHAPEL", text:"Only a chapel steeple rises above a muddy reservoir. A rope leads down inside.", choices:"DESCEND ROPE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("rope") && !cmd.includes("descend")) return false; hurt(10);gainBolts(19);gainXp(26);add("A dry alcove contains a sealed metal strongbox.");return true;}},
  {exclusive:true, title:"THE LIME FOG", text:"White industrial dust rolls across the road, hiding a steep drop.", choices:"FEEL FOR EDGE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("edge") && !cmd.includes("feel")) return false; hurt(6);gainBolts(8);addPack("Wire","material");gainXp(25);add("You navigate by touch and find a lost surveyor kit.");return true;}},
  {exclusive:true, title:"THE FIGHTING RING", text:"A circle of wrecked cars surrounds a bare-knuckle contest.", choices:"ENTER CONTEST   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("contest") && !cmd.includes("enter")) return false; hurt(19);gainBolts(24);gainXp(35);add("You survive three brutal rounds and collect the purse.");return true;}},
  {exclusive:true, title:"THE GATELESS WALL", text:"A huge defensive wall runs across the plain, but its gate was removed years ago.", choices:"CLIMB BREACH   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("breach") && !cmd.includes("climb")) return false; hurt(7);gainBolts(13);addPack("Scrap Metal","material");gainXp(24);add("You find abandoned sentry supplies atop the rubble.");return true;}},
  {exclusive:true, title:"THE TAR POOL", text:"A black pool bubbles beside the road. Metal objects protrude from its surface.", choices:"FISH FOR METAL   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("metal") && !cmd.includes("fish")) return false; hurt(10);gainBolts(10);addPack("Scrap Metal","material");gainXp(25);add("You snag a heavy toolbox but burn your hand on the tar.");return true;}},
  {exclusive:true, title:"THE RUST PARADE", text:"Scavengers push elaborate metal floats through the dust, celebrating a victory nobody remembers.", choices:"JOIN PARADE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("parade") && !cmd.includes("join")) return false; gainBolts(17);gainXp(23);add("You help push a float and receive a few Bolts for the effort.");return true;}},
  {exclusive:true, title:"THE KNIFE WIND", text:"A narrow canyon funnels sand sharp enough to strip paint.", choices:"COVER FACE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("face") && !cmd.includes("cover")) return false; hurt(8);gainBolts(12);addPack("Cloth","material");gainXp(25);add("You emerge scratched but recover a lost pack wedged in the rock.");return true;}},
  {exclusive:true, title:"THE WARDEN", text:"An armored enforcer orders everyone on the highway to kneel. His equipment is far beyond yours.", choices:"HIDE FROM WARDEN   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("warden") && !cmd.includes("hide")) return false; gainXp(35);add("You disappear into a drainage crack and wait for his patrol to pass.");return true;}},
  {exclusive:true, title:"THE OIL DERRICK", text:"A pumpjack moves slowly despite its broken drive belt. The ground trembles beneath it.", choices:"SEARCH SHED   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("shed") && !cmd.includes("search")) return false; hurt(7);gainBolts(14);addPack("Wire","material");gainXp(24);add("The shed holds old maintenance tools and a salvage tin.");return true;}},
  {exclusive:true, title:"THE CRANE NEST", text:"Giant birds have nested in the cab of a construction crane. Something shiny hangs from the nest.", choices:"CLIMB CRANE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("crane") && !cmd.includes("climb")) return false; hurt(13);gainBolts(20);gainXp(29);add("You retrieve a cache while the birds circle overhead.");return true;}},
  {exclusive:true, title:"THE COLD FOUNDRY", text:"A foundry floor is littered with unfinished iron castings and shattered molds.", choices:"SEARCH MOLDS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("molds") && !cmd.includes("search")) return false; hurt(5);gainBolts(11);addPack("Scrap Metal","material");gainXp(24);add("You find a usable metal bracket beneath the slag.");return true;}},
  {exclusive:true, title:"THE MUD CANNON", text:"A pressurized pipe erupts from a flooded excavation, hurling mud across the highway.", choices:"CLOSE VALVE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("valve") && !cmd.includes("close")) return false; hurt(9);gainBolts(11);addPack("Wire","material");gainXp(26);add("You shut it down and recover the crew’s forgotten tools.");return true;}},
  {exclusive:true, title:"THE HANGING CAGE", text:"A steel cage swings from a highway gantry. The door is open, and a locked chest sits inside.", choices:"REACH CHEST   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("chest") && !cmd.includes("reach")) return false; hurt(12);gainBolts(22);gainXp(29);add("You retrieve the chest as the cable starts to fray.");return true;}},
  {exclusive:true, title:"THE DUST HORSES", text:"A herd of feral horses races across the road, pursued by a distant fire.", choices:"CLEAR THEIR PATH   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("path") && !cmd.includes("clear")) return false; gainBolts(12);addPack("Cloth","material");gainXp(25);add("You move debris and discover a dropped saddlebag after they pass.");return true;}},
  {exclusive:true, title:"THE SHATTERED SILO", text:"A grain silo split down the middle. Its surviving staircase twists upward.", choices:"CLIMB SILO   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("silo") && !cmd.includes("climb")) return false; hurt(10);gainBolts(11);addPack("Bandage","consumable");gainXp(26);add("A high platform holds an old emergency supply box.");return true;}},
  {exclusive:true, title:"THE FORGOTTEN ARENA", text:"Concrete bleachers surround a pit filled with scavenged armor.", choices:"SEARCH BLEACHERS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("bleachers") && !cmd.includes("search")) return false; hurt(6);gainBolts(18);gainXp(25);add("A spectator cache still holds a pouch of bolts.");return true;}},
  {exclusive:true, title:"THE LAST ORCHARD", text:"A single fruit tree grows inside a barricade of sharpened metal.", choices:"ENTER ORCHARD   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");gainXp(3);return true;} if(!cmd.includes("orchard") && !cmd.includes("enter")) return false; hurt(8);gainBolts(10);addPack("Scrap Metal","material");gainXp(25);add("The fruit is inedible, but the barricade contains useful salvage.");return true;}}
];

const encounterLevels={"THE STRAY":2,"THE BIG MAN":50,"HIGHWAY ROBBERS":4,"ROACH NEST":1,"TUNNEL RATS":2,"FERAL DOG":3,"LONE SCAVENGER":3,"GANG LOOKOUT":4,"THE CRAWLER":5,"SECURITY DRONE":5,"THE WRECKERS":5,"SOMETHING IN THE DRAIN":6};
const combatSpecs={
  "THE STRAY":{name:"THE STRAY",level:2,hp:20,min:2,max:5,xp:22,bolts:6,end:"The scavenger finally breaks and runs, dropping a small pouch behind."},
  "TUNNEL RATS":{name:"RAT PACK",level:2,hp:24,min:3,max:6,xp:22,bolts:4,end:"The last of the rats scatters into the drain."},
  "FERAL DOG":{name:"FERAL DOG",level:3,hp:22,min:4,max:8,xp:24,bolts:0,end:"The dog finally backs away and disappears into the brush."},
  "LONE SCAVENGER":{name:"SCAVENGER",level:3,hp:26,min:4,max:8,xp:25,bolts:8,end:"The scavenger gives ground and finally bolts into the weeds."},
  "HIGHWAY ROBBERS":{name:"HIGHWAY ROBBERS",level:4,hp:30,min:5,max:9,xp:24,bolts:9,end:"The robbers break first and disappear into the weeds."},
  "THE CRAWLER":{name:"CRAWLER",level:5,hp:34,min:6,max:10,xp:30,bolts:6,end:"The crawler spasms once and goes still."},
  "THE WRECKERS":{name:"WRECKERS",level:5,hp:36,min:6,max:10,xp:32,bolts:10,end:"The wreckers decide this stopped being easy and run."},
  "ROACH NEST":{name:"ROACH SWARM",level:1,hp:14,min:1,max:4,xp:16,bolts:3,end:"The surviving roaches vanish beneath the wreck."},
  "GANG LOOKOUT":{name:"GANG LOOKOUT",level:4,hp:28,min:5,max:9,xp:26,bolts:5,end:"The lookout abandons the overpass and runs."},
  "SECURITY DRONE":{name:"SECURITY DRONE",level:5,hp:32,min:5,max:10,xp:30,bolts:7,end:"The drone gives one last electronic whine and goes dark."},
  "SOMETHING IN THE DRAIN":{name:"DRAIN CREATURE",level:6,hp:38,min:7,max:11,xp:34,bolts:9,end:"The scraping stops. Whatever was in the drain is no longer moving."}
};
const combatTriggers={"ROACH NEST":["crush"],"GANG LOOKOUT":["rush"],"SECURITY DRONE":["smash"],"SOMETHING IN THE DRAIN":["open"]};
function startCombat(spec, source="encounter", townCost=false, openingAttack=false){
  if(townCost){ if(player.turns<=0){add("NO EXPEDITION TURNS REMAIN.","danger");return;} player.turns--; updateHud(); }
  combatState={...spec,hp:spec.hp,maxHp:spec.hp,source}; stage="combat";
  busy=true; input.disabled=true;
  add(`${spec.name} — LVL ${String(spec.level).padStart(2,"0")} — HP ${spec.hp}/${spec.hp}`,"bright");
  // Combat entry is a state transition, not a hidden extra attack. Always show the combat menu first.
  outputQueue.then(()=>{
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
  if(cmd==="b"||cmd.includes("back")||cmd.includes("flee")||cmd.includes("run")){ add("You break contact before the fight gets worse."); combatState=null; if(c.source==="roadWanderer"){advanceRoad();} else if(c.source==="townWanderer"){stage="mercy"; showCurrentContext();} else {stage="encounter"; add(encounterChoices(currentEncounter()),"system");} return; }
  if(cmd==="u"||cmd==="i"||cmd.includes("use item")){ showCombatItems(); return; }
  if(cmd.startsWith("use ")){ useItem(cmd.slice(4)); add("(A) ATTACK   (U) USE ITEM   (B) BACK OFF","system"); return; }
  if(cmd==="a"||cmd==="f") cmd="attack"; if(!cmd.includes("attack")&&!cmd.includes("fight")&&!cmd.includes("hit")){add("(A) ATTACK   (U) USE ITEM   (B) BACK OFF","system");return;}
  const dealt=rollDamage(); c.hp=Math.max(0,c.hp-dealt);
  add(`You swing the ${player.weapon.toLowerCase()} and connect.`);
  add("RESULT","system"); add(`YOU DEAL ${dealt}   ${c.name} HP ${c.hp}/${c.maxHp}`,"reward");
  if(c.hp<=0){ add(c.end||`${c.name} is finished.`); resultBuffer=[]; if(c.xp) gainXp(isDark()?Math.ceil(c.xp*1.1):c.xp); if(c.bolts) gainBolts(isDark()?Math.ceil(c.bolts*1.1):c.bolts); flushResults(); const source=c.source; combatState=null; if(source==="serviceBoss"){player.flags.serviceBossDead=true;player.flags.serviceReward=true;const oldWeapon=player.weapon; player.weapon="Yardman\'s Wrench"; addPack(oldWeapon,"weapon"); updateHud();add("YARDMAN\'S WRENCH — DMG 11–18","bright");add(`Equipped. ${oldWeapon} moved to your backpack.`,"reward");add("The maintenance yard is quiet now. Beyond it, the road disappears beneath collapsed trees and concrete.");stage="serviceRoad";serviceRoadDepth=3;add(player.flags.maintenanceYardSearched?"(R) RETURN TO FORK":"(E) SEARCH MAINTENANCE YARD   (R) RETURN TO FORK","system");} else if(source==="roadWanderer"){markWandererDead(c.name); currentRoadWanderer=null; advanceRoad();} else if(source==="townWanderer"){markWandererDead(c.name); currentTownWanderer=null; stage="mercy";showCurrentContext();} else { add("──────── TURN COMPLETE ────────","system"); add("(C) CONTINUE   (R) REVERSE DIRECTION","system"); stage="turnComplete"; } return; }
  const raw=Math.floor(Math.random()*(c.max-c.min+1))+c.min; const nightRaw=isDark()?Math.ceil(raw*1.15):raw; const dmg=Math.max(1,nightRaw-armorDefense()); player.hp=Math.max(0,player.hp-dmg); updateHud();
  const reactions=["They come back at you before you can reset your footing.","The next exchange is fast and ugly.","They hesitate, then commit to another attack."];
  add(reactions[Math.floor(Math.random()*reactions.length)]); add("RESULT","system"); add(`YOU TAKE ${dmg}   YOUR HP ${player.hp}/${player.maxHp}`,"danger");
  if(player.hp<=0){ handlePlayerDeath(); return; }
  add("(A) ATTACK   (U) USE ITEM   (B) BACK OFF","system");
}
// Curated randomness: each road run gets unique encounters from the expanded beginner pool.
let roadEncounterOrder = [...Array(encounters.length).keys()]
  .sort(() => Math.random() - 0.5)
  .slice(0, 9);
function encounterPool(){return roadGoal==="east"?eastEncounters:encounters;}
function rerollRoad(count=9){
  const pool=encounterPool();
  player.recentEncounters=player.recentEncounters||[];
  let ids=[...Array(pool.length).keys()].filter(i=>!player.recentEncounters.includes(`${roadGoal}:${i}`));
  if(ids.length<count) ids=[...Array(pool.length).keys()];
  roadEncounterOrder=ids.sort(()=>Math.random()-0.5).slice(0,count);
  player.recentEncounters=[...player.recentEncounters,...roadEncounterOrder.map(i=>`${roadGoal}:${i}`)].slice(-16);
  roadTurn=0; roadTurnCharged=false; player.encounterDone={};
}
function currentEncounter(){ return encounterPool()[roadEncounterOrder[Math.min(roadTurn, roadEncounterOrder.length-1)]]; }

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
      add("TIM'S OLD BADGE FOUND — Return it to Tim in Solace.","reward");
    } else {
      add(`ROAD TURN ${dailyRoadTurns} — WRECKED DELIVERY VAN`,"place");
      add("Near the service-road fork, an old delivery van rests nose-down in the ditch. The hood is already half open.");
      add("Inside the engine bay, one serpentine belt is cracked at the edges but still flexible.");
      addPack("Usable Serpentine Belt","quest"); f.murphyQuest="found";
      add("USABLE SERPENTINE BELT FOUND — Murphy might actually smile.","reward");
    }
    f.questEventCooldown=2; add("──────── TURN COMPLETE ────────","system"); add("(C) CONTINUE   (R) REVERSE DIRECTION","system"); stage="questRoadComplete"; return true;
  }
  return false;
}
function noTurnsMenu(){
  processRefill(); if(testMode || player.turns>0){ add("TEST MODE ACTIVE — expedition turn limit disabled.","reward"); return; }
  add("NO EXPEDITION TURNS REMAIN.","danger");
  add(`NEXT TURN REFILL: ${refillText()}`,"bright");
  add("Expedition Turns replenish every 24 hours (+20, up to 60).","system");
  add("Night is coming. Choose how you'll spend it.");
  add("(C) MAKE CAMP — lower danger / lower chance of finding loot");
  add("(R) REMAIN ON THE ROAD — higher danger / higher chance of finding loot");
  add("SAVE CURRENT   STATUS   INVENTORY   MAP   TESTING","system");
  stage="zeroTurns";
}
function showEncounter() {
  if((roadGoal==="mercy" && roadTurn===4 || roadGoal==="house" && roadTurn===3) && !roadTurnCharged){ player.flags.forkDiscovered=true; add("","system"); add("THE FORK","place"); add("Route 127 continues east toward Solace. An old service road climbs north through the trees beneath a bent county sign."); add(`CONTINUE TO ${roadGoal==="house"?"OLD HOUSE":"SOLACE"}   CHECK SERVICE ROAD${player.flags.relayPartsRevealed?"   CHECK LOWER ACCESS ROAD":""}`,"system"); stage="fork"; return; }
  if(!roadTurnCharged){ if(!testMode && player.turns<=0){noTurnsMenu();return;} spendTurn(); roadTurnCharged=true; }
  if(isDark()) add("WORSE AFTER DARK — enemies hit harder; road rewards improve.","danger");
  else if(timePhase()==="DUSK") add("LIGHT FADING.","system");
  add(`ROAD PROGRESS — STEP ${Math.min(roadTurn+1,roadTripLength)} / ${roadTripLength} toward ${roadGoal==="mercy"?"Solace":roadGoal==="east"?"the eastern road":"the old house"}.`,"system");
  if(questRoadEvent()) return;
  player.flags.wandererRoadCooldown=player.flags.wandererRoadCooldown||0;
  if(player.flags.wandererRoadCooldown>0) player.flags.wandererRoadCooldown--;
  else if(Math.random()<0.30){ player.flags.wandererRoadCooldown=2; showRoadWanderer(); return; }
  currentRoadWanderer=null;
  const e = currentEncounter();
  if(!player.encounterDone[roadTurn]) player.encounterDone[roadTurn]=new Set();
  const lvl=encounterLevels[e.title] || (roadGoal==="east"? (e.title==="THE WARDEN"?50:5+(roadTurn%6)):null);
  add(""); add(`ROAD TURN ${dailyRoadTurns} — ${e.title}${lvl?` — LVL ${String(lvl).padStart(2,"0")}`:""}`, "place");
  add(e.text); add(""); add(encounterChoices(e), "system");
  if(e.exclusive) add("What do you do?", "system");
  stage = "encounter";
}
function advanceRoad(){
  roadTurn++; roadTurnCharged=false; moveWanderers();
  if (roadTurn >= roadTripLength) {
    if(roadGoal === "mercy") arriveSettlement();
    else if(roadGoal === "east"){ stage="eastEnd"; add("EASTERN ROAD — UTILITY WRECK","place"); add("A pre-collapse communications truck lies on its side beyond the guardrail. Its rear equipment rack is still sealed."); add("SEARCH EQUIPMENT RACK   RETURN TO SOLACE","system"); }
    else arriveHouse();
    return;
  }
  showEncounter();
}
function startRoadTrip(goal, length=5){
  if(!testMode && player.turns<=0){ noTurnsMenu(); return; }
  roadGoal=goal; roadTripLength=length; roadTurn=0; roadTurnCharged=false; rerollRoad(length); stage="between";
  add(goal==="house" ? "You leave Solace and head west toward the old house." : goal==="east" ? "You pass through Solace's east gate and follow Route 127 into unfamiliar country." : "You leave the house and head east toward Solace.","bright");
  showEncounter();
}
function arriveHouse(){
  add(""); add("THE OLD HOUSE", "place");
  add("The ruined house comes into view again. It isn't comfortable, but the walls still stand and nobody else has claimed it.");
  add("For now, this is a SAFE LOCATION. Logging out here will eventually protect you the same way Solace does.","system");
  add("SEARCH BATHROOM CABINET   CHECK FIREPLACE   CHECK PACK   MAP   SAVE GAME 01   HEAD NORTH — SOLACE", "system");
  stage="house";
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
  const spec=combatSpecs[e.title];
  const triggers=combatTriggers[e.title]||["fight"];
  if(spec && triggers.some(t=>cmd.includes(t))){ startCombat(spec,"encounter",false,cmd.includes("fight")); return; }
  const done=player.encounterDone[roadTurn] || (player.encounterDone[roadTurn]=new Set());
  const leaving = ["move on","keep moving","walk away","continue road","continue","leave","head for lights"].some(x=>cmd.includes(x));
  if(leaving){
    // Some labels are actual encounter paths, not generic leave commands. Let them resolve first.
    const pathKey=choiceKey(cmd,e);
    if(pathKey && !/MOVE ON|KEEP MOVING|WALK AWAY|HEAD FOR LIGHTS/.test(pathKey)) { /* fall through */ }
    else if(pathKey && (e.title === "THE TRAVELER" || e.title === "RIDGELINE")) {
      const resolved=e.resolve(cmd);
      if(!resolved){ add(`Choose: ${encounterChoices(e)}`,"system"); return; }
      done.add(pathKey);
      advanceRoad(); return;
    } else {
      add("You leave the location behind and continue along Route 127.");
      advanceRoad(); return;
    }
  }
  const key=choiceKey(cmd,e);
  const doneToken=key?`${e.title}::${key}`:null;
  if(key && done.has(key)){ add("You've already done that here.","system"); add(encounterChoices(e),"system"); return; }
  resultBuffer=[];
  const resolved=e.resolve(cmd);
  if(!resolved){ resultBuffer=null; add(`Choose: ${encounterChoices(e)}`,"system"); add(encounterChoices(e),"system"); return; }
  flushResults();
  if(doneToken) done.add(key);
  if(isPathChoice(e,key) || e.exclusive){
    add("──────── TURN COMPLETE ────────","system"); add("(C) CONTINUE   (R) REVERSE DIRECTION","system"); stage="turnComplete"; return;
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
  add("──────── TURN COMPLETE ────────","system"); add("(C) CONTINUE   (R) REVERSE DIRECTION","system"); stage="turnComplete";
}
function showCurrentContext(){
  add("CURRENT SITUATION","system");
  if(stage==="combat" && combatState){ add(`${combatState.name} — LVL ${String(combatState.level).padStart(2,"0")} — HP ${combatState.hp}/${combatState.maxHp}`,"bright"); add("(A) ATTACK   (U) USE ITEM   (B) BACK OFF","system"); return; }
  if(stage==="wandererRoad" && currentRoadWanderer){ const w=wandererByName(currentRoadWanderer); add(`ROUTE 127 — ${w.name.toUpperCase()} — LVL ${String(w.level).padStart(2,"0")}`,"bright"); add("SMALL TALK   INSPECT   FIGHT   MOVE ON","system"); return; }
  if(stage==="encounter"){ const e=currentEncounter(); const lvl=encounterLevels[e.title] || (roadGoal==="east"? (e.title==="THE WARDEN"?50:5+(roadTurn%6)):null); add(`${e.title}${lvl?` — LVL ${String(lvl).padStart(2,"0")}`:""}`,"bright"); add(encounterChoices(e),"system"); return; }
  if(stage==="mercy"){ add(`SOLACE — ${mercyLocation.toUpperCase()}`,"bright"); if(mercyLocation==="town")mercyMenu(); else if(mercyLocation==="jen")showBarActions(); else if(mercyLocation==="relay")add("INSPECT MONITOR   INSPECT CONSOLE   INSPECT ANTENNA CONTROLS   INSPECT CABLES   (B) BACK","system"); else add("(T) TOWN","system"); return; }
  if(stage==="roadReady") add("OLD HOUSE — ROAD heads east toward Solace.","system");
  else if(stage==="settlement") add("(P) APPROACH GATE","system");
  else if(stage==="house") add("OLD HOUSE — HEAD NORTH — SOLACE","system");
}
function handleRoadWanderer(cmd){
  const w=wandererByName(currentRoadWanderer); if(!w){stage="between";showEncounter();return;}
  if(cmd.includes("small talk")||cmd==="talk"){ ws(w.name); add(wandererDialogue(w),"bright"); add("SMALL TALK   INSPECT   FIGHT   MOVE ON","system"); return; }
  if(cmd.includes("inspect")){ add(`${w.name} looks ${w.vibe}. LVL ${String(w.level).padStart(2,"0")}. Their gear looks used, carried, and very real.`); add("SMALL TALK   INSPECT   FIGHT   MOVE ON","system"); return; }
  if(cmd.includes("fight")||cmd.includes("attack")){ startCombat({name:w.name.toUpperCase(),level:w.level,hp:12+w.level*2,min:2+w.level,max:4+w.level,xp:10+w.level*4,bolts:Math.floor(w.level/2)+2,end:`${w.name} goes down and does not get back up.`},"roadWanderer",false,true); return; }
  if(cmd.includes("move")||cmd.includes("leave")||cmd.includes("continue")){ add(`${w.name} falls behind as you continue toward ${roadGoal==="mercy"?"Solace":"the old house"}.`); currentRoadWanderer=null; advanceRoad(); return; }
  add("SMALL TALK   INSPECT   FIGHT   MOVE ON","system");
}
function handleTownWanderer(cmd){
  const w=wandererByName(currentTownWanderer); if(!w)return false;
  const named=cmd.includes(w.name.toLowerCase());
  if(cmd===`talk to ${w.name.toLowerCase()}` || cmd===w.name.toLowerCase()){
    add(w.name.toUpperCase()+" — WANDERER — LVL "+String(w.level).padStart(2,"0"),"place");
    add(w.lines && w.lines[1] ? w.lines[1] : `${w.name} looks ${w.vibe}.`);
    add(`SMALL TALK ${w.name.toUpperCase()}   INSPECT ${w.name.toUpperCase()}   FIGHT ${w.name.toUpperCase()}   TOWN`,"system"); return true;
  }
  // A wanderer being in town does not own Solace's conversation context.
  // They only respond when explicitly addressed by name (or while confirming their fight).
  if(!named && pendingTownFight!==w.name) return false;
  if((cmd.includes("small talk") && named)||cmd===`talk to ${w.name.toLowerCase()}`){ ws(w.name); add(wandererDialogue(w),"bright"); add("SMALL TALK   INSPECT   FIGHT   LEAVE","system"); return true; }
  if(cmd.includes("inspect") && named){ add(`${w.name} looks ${w.vibe}. LVL ${String(w.level).padStart(2,"0")}. You clock their stance, gear, and exits.`); add("SMALL TALK   INSPECT   FIGHT   LEAVE","system"); return true; }
  if(cmd==="confirm fight" && pendingTownFight===w.name){ pendingTownFight=null; startCombat({name:w.name.toUpperCase(),level:w.level,hp:12+w.level*2,min:2+w.level,max:4+w.level,xp:10+w.level*4,bolts:Math.floor(w.level/2)+2,end:`${w.name} goes down. Solace gets very quiet for a moment.`},"townWanderer",true,true); return true; }
  if(cmd.includes("fight") && named){ pendingTownFight=w.name; add(`START A FIGHT WITH ${w.name.toUpperCase()}?`,"danger"); add("This action will cost 1 TURN.","system"); add("CONFIRM FIGHT   BACK OFF","system"); return true; }
  if(cmd==="back off" && pendingTownFight){ pendingTownFight=null; add("You decide not to start trouble."); add("SMALL TALK   INSPECT   FIGHT   LEAVE","system"); return true; }
  if(cmd==="leave"||cmd==="town"){ add(`You leave ${w.name} to their business.`); return true; }
  return false;
}
async function arriveSettlement() {
  if(player.flags.mercyDiscovered){ stage="mercy"; mercyLocation="town"; add(""); add("SOLACE GATE","place"); add(`The guard recognizes ${player.handle||"you"} and waves you through.`); add("SOLACE — MAIN STREET","bright"); mercyMenu(); return; }
  busy = true; input.disabled = true; add("");
  add(`ARRIVAL — SOLACE GATE (MAIN ROAD STEP ${roadTripLength} / ${roadTripLength})`, "place");
  add("SOLACE DISCOVERED", "bright"); player.flags.mercyDiscovered=true; player.flags.mainSolaceQuest="done"; if(player.flags.relayQuest==="locked") player.flags.relayQuest="ask";
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
  currentTownWanderer=null;
  add("──────────────────── SOLACE ────────────────────", "system"); showWanderersAt("mercy");
  queueChoiceLine(`(B) BAR   (T) TRADER   (W) WORKSHOP   (C) CLINIC   (A) BANK   (U) BULLETIN BOARD${player.flags.relayUnlocked?"   (R) RELAY STATION":""}   (E) WEST GATE   (G) EAST GATE   (L) TALK TO TIM${townVisitorChoice()}`);
}
function bankMenu(){
  mercyLocation="amii";
  add("AMII'S BANK & STASH", "place"); showWanderersAt("amii");
  add("The old municipal records office has been rebuilt into the most secure room in Solace. Plate steel covers the windows and a reinforced cage surrounds the counter.");
  add("Amii looks up and gives you a slightly awkward but friendly wave.");
  add("Two massive junkyard dogs lounge beside the counter. Niko thumps his tail. Alex just watches you.");
  add("AMII > Don't worry. They're friendly.", "bright");
  add("Alex gives a low rumble.");
  add("AMII > ...mostly.", "bright");
  add(`CARRIED BOLTS: ${player.bolts}   BANKED BOLTS: ${player.bankBolts}`, "system");
  add(`STASH: ${player.stash.length} ITEM TYPE${player.stash.length===1?"":"S"}`, "system");
  add("— BACKPACK AVAILABLE TO STASH —","bright"); if(!player.pack.length)add("EMPTY","system"); else player.pack.forEach(i=>add(`${i.name}${i.qty>1?` ×${i.qty}`:""}  <${i.type.toUpperCase()}>`));
  add("— SECURE STASH —","bright"); if(!player.stash.length)add("EMPTY","system"); else player.stash.forEach(i=>add(`${i.name}${i.qty>1?` ×${i.qty}`:""}`));
  add("DEPOSIT <amount>   DEPOSIT ALL   WITHDRAW <amount>   STASH <item>   VIEW STASH   RETRIEVE <item>   TALK TO AMII   TOWN", "system");
}
function stashItem(name){
  const item=findItem(name); if(!item){ add("AMII > I can store it once you actually have it.","system"); return; }
  const existing=player.stash.find(i=>i.name===item.name && i.type===item.type);
  if(existing) existing.qty += item.qty; else player.stash.push({...item});
  player.pack=player.pack.filter(i=>i!==item); updateHud(); add(`${item.name} moved to secure storage.`,"reward");
}
function retrieveItem(name){
  const item=player.stash.find(i=>i.name.toLowerCase().includes(name.toLowerCase()));
  if(!item){ add("AMII > I don't have anything by that name in your stash.","system"); return; }
  const existing=findItem(item.name);
  if(!existing && packSlotsUsed()>=player.packMax){ add("Your backpack is full.","system"); return; }
  if(existing) existing.qty += item.qty; else player.pack.push({...item});
  player.stash=player.stash.filter(i=>i!==item); updateHud(); add(`${item.name} returned to your pack.`,"reward");
}
function townVisitorChoice(){ return currentTownWanderer ? `   TALK TO ${currentTownWanderer.toUpperCase()}` : ""; }
function showBarActions(){
  add(`(B) BUY DRINKS   (G) GAMBLE   (R) RENT ROOM — 12 BOLTS   (J) TALK TO JEN${townVisitorChoice()}   (T) RETURN TO TOWN`,"system");
}
function showDrinkMenu(){ mercyLocation="jenDrinks"; add("DRINKS","bright"); add("(E) BEER — 3 BOLTS — +5 HP   (O) SHOT — 5 BOLTS — +10 HP   (H) HOUSE SPECIAL — 8 BOLTS — +15 HP   (B) BACK","system"); }
function showGambleMenu(){ mercyLocation="jenGames"; add("GAMBLING","bright"); add("(D) DICE   MORE GAMES — COMING LATER   (B) BACK","system"); }
function npcTalk(name){
  const n=name.toLowerCase(); mercyLocation=n;
  if(n==="jen"){
    add("JEN", "place"); add("Jen leans against the bar and gives you her full attention.");
    add(`ASK ABOUT SOLACE   ASK ABOUT ROAD   ASK RUMORS${(!player.flags.relayUnlocked && player.flags.relayQuest==="ask")?"   ASK ABOUT RELAY STATION":""}   SMALL TALK   (B) BACK`, "system"); return;
  }
  if(n==="johnny"){
    add("JOHNNY", "place"); add("Johnny folds his arms, wearing the expression of a man who could turn this conversation into a sale.");
    add(`ASK ABOUT DEALS   ASK ABOUT SUPPLIES   ASK ABOUT ROAD${player.flags.relayPartsRevealed?"   ASK ABOUT RELAY PARTS":""}   SMALL TALK   (B) BACK`, "system"); return;
  }
  if(n==="murphy"){
    add("MURPHY", "place"); add("Murphy wipes his hands on a rag and looks up from the bench.");
    add(`ASK ABOUT WORKSHOP   ASK ABOUT CARS   ASK ABOUT CORVETTE   ASK ABOUT EQUIPMENT${player.flags.relayPartsRevealed?"   ASK ABOUT RELAY PARTS":""}${(!player.flags.relayUnlocked && player.flags.relayQuest==="ask")?"   ASK ABOUT RELAY STATION":""}   SMALL TALK   (B) BACK`, "system"); return;
  }
  if(n==="wayne"){
    add("WAYNE", "place"); add("Wayne looks up like he's already preparing a sarcastic diagnosis.");
    add("ASK ABOUT INJURIES   ASK ABOUT ROAD   ASK ABOUT SOLACE   SMALL TALK   (B) BACK", "system"); return;
  }
  if(n==="amii"){
    add("AMII", "place"); add("Amii smiles. Niko thumps his tail. Alex continues conducting a background check with his eyes.");
    add("ASK ABOUT BANKING   ASK ABOUT NIKO AND ALEX   ASK ABOUT SOLACE   SMALL TALK   (B) BACK", "system"); return;
  }
  if(n==="tim"){
    const spots=["near Solace's gate, checking a repaired hinge","outside Murphy's workshop, talking quietly over the sound of tools","at the end of Jen's bar with a tin cup in one hand","near the bank, scratching Niko behind the ears"];
    const spot=spots[Math.floor(Math.random()*spots.length)];
    add("TIM", "place"); add(`You find Tim ${spot}.`); add("His red hair has gone gray around the temples, but he's still moving like there are six things left to do before dark.");
    add("TIM > Hey. Settling in alright?", "bright");
    add(`ASK ABOUT SOLACE   ASK ABOUT ROUTE 127   ASK ABOUT WORK   ASK ABOUT TIM${(!player.flags.relayUnlocked && player.flags.relayQuest==="ask")?"   ASK ABOUT RELAY STATION":""}   SMALL TALK   TOWN`, "system"); return;
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
function showRelayChoices(){
  add(`(O) INSPECT MONITOR   (C) INSPECT CONSOLE   (A) INSPECT ANTENNA CONTROLS   (P) INSPECT CABLES${relayPartCount()===4 && player.flags.relayQuest!=="complete"?"   INSTALL COMPONENTS":""}   (B) BACK`,"system");
}
function enterRelayStation(){
  mercyLocation="relay";
  add("RELAY STATION","place");
  add("A squat municipal communications building crouches against Solace's north wall, half hidden behind a rusted water tower.");
  add("The antenna mast above it leans a few degrees east. Dead cable hangs from it like black vines.");
  add("Inside, dust blankets banks of switches, cracked meters, and equipment old enough to have forgotten what year it is.");
  add("At the far end of the room sits a single monitor. Its glass is dark.");
  if(!player.flags.relayVisited){
    player.flags.relayVisited=true; player.flags.relayQuest="stabilize";
    add(""); add("CLICK.","bright");
    add("The monitor flickers once. Twice. Static crawls across the glass.","system");
    add("DISPLAY LINK ESTABLISHED","bright");
    add("/\\//\\  ///\\  //\\//  /\\/", "system");
    add(`WOMAN'S VOICE > ${player.handle||"Syn"}? Good. You found it.`,"woman");
    add("Static tears across the screen.","system");
    add("WOMAN'S VOICE > I don't have much time. We're losing the signal again.","woman");
    add("WOMAN'S VOICE > Something here is destabilizing the connection. I need you to find—","woman");
    add("SIGNAL LOSS","bright");
    add("WOMAN'S VOICE > —stabilize it. Then we can talk.","woman");
    add("NO SIGNAL","system");
    add("QUEST UPDATED — RELAY STATION","reward");
    add("Find a way to stabilize the Relay connection.","system");
  }
  add(`(O) INSPECT MONITOR   (C) INSPECT CONSOLE   (A) INSPECT ANTENNA CONTROLS   (P) INSPECT CABLES${relayPartCount()===4 && player.flags.relayQuest!=="complete"?"   INSTALL COMPONENTS":""}   (B) BACK`,"system");
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
function johnnyPrice(item){
  const base={"Energy Bars":8,"Bandage":12,"Reinforced Jacket":45,"Claw Hammer":50,"Tire Iron":80}[item];
  return player.dailyDeal===item ? Math.max(1,Math.round(base*0.72)) : base;
}
function johnnyShop(){
  const deal=player.dailyDeal||"Claw Hammer";
  add("JOHNNY'S STOCK", "bright");
  add(`ENERGY BAR — Restore 10 HP — ${johnnyPrice("Energy Bars")} BOLTS${deal==="Energy Bars"?"  < DEAL":""}`);
  add(`BANDAGE — Restore 18 HP — ${johnnyPrice("Bandage")} BOLTS${deal==="Bandage"?"  < DEAL":""}`);
  add(`REINFORCED JACKET — DEF 4 — ${johnnyPrice("Reinforced Jacket")} BOLTS${deal==="Reinforced Jacket"?"  < DEAL":""}`);
  add(`CLAW HAMMER — DMG 7–13 — ${johnnyPrice("Claw Hammer")} BOLTS${deal==="Claw Hammer"?"  < DEAL":""}`);
  add(`TIRE IRON — DMG 9–16 — ${johnnyPrice("Tire Iron")} BOLTS${deal==="Tire Iron"?"  < DEAL":""}`);
  add(`DEAL OF THE DAY: ${deal.toUpperCase()} — about 28% off`, "bright");
  add("BUY ENERGY BAR   BUY BANDAGE   BUY REINFORCED JACKET   BUY CLAW HAMMER   BUY TIRE IRON", "system");
  const scrap=findItem("Scrap Metal"), sq=scrap?scrap.qty:0; add(`SCRAP ON HAND: ${sq}   VALUE: 4 BOLTS EACH   TOTAL: ${sq*4} BOLTS`,"bright");
  add(`SELL SCRAP   SELL ALL SCRAP   TALK TO JOHNNY${player.flags.relayPartsRevealed?"   ASK ABOUT RELAY PARTS":""}   (B) BACK`, "system");
}
function buyJohnny(item){
  const price=johnnyPrice(item);
  if(player.bolts<price){ add(`JOHNNY > That's ${price} Bolts. Come back when your pockets agree with your taste.`,"system"); return; }
  if(item==="Energy Bars"||item==="Bandage"){
    if(packSlotsUsed()>=player.packMax && !hasItem(item)){add("Your pack is full.","system");return;}
    player.bolts-=price; addPack(item,"consumable");
  } else if(item==="Reinforced Jacket"){ player.bolts-=price; player.armor=item; add("You swap out the Worn Jacket. The reinforced lining actually feels capable of stopping something.","reward"); }
  else { player.bolts-=price; player.weapon=item; add(`You equip the ${item}. The Rusted Pipe has finally been promoted to backup plan.`,"reward"); }
  updateHud(); add(`-${price} BOLTS`,"system"); add("JOHNNY > Pleasure doing business. Allegedly.","bright");
}
function handleSolace(cmd, raw=cmd){
  if(mercyLocation==="johnny" && player.flags.relayPartsRevealed && (cmd.includes("relay")||cmd.includes("regulator"))){ if(!ensureRelayParts().johnny){ add("JOHNNY > That old thing? Yeah, I've got one under the counter somewhere.","bright"); add("Johnny digs through a crate, produces a dust-covered power regulator, and drops it into your hands."); add("JOHNNY > Take it. Seriously. You've improved my inventory by removing it.","bright"); awardRelayPart("johnny","POWER REGULATOR"); } else add("JOHNNY > Already gave you the only one I had. You're welcome twice, apparently.","bright"); johnnyShop(); return; }
  if(mercyLocation==="jen" && cmd==="b") cmd="buy drinks";
  if(mercyLocation==="jen" && cmd==="g") cmd="gamble";
  if(mercyLocation==="jen" && cmd==="r") cmd="rent room";
  if(mercyLocation==="jen" && (cmd==="buy drinks"||cmd==="drinks")){showDrinkMenu();return;}
  if(mercyLocation==="jen" && cmd==="gamble"){showGambleMenu();return;}
  if(mercyLocation==="jenGames"){ if(cmd==="b"||cmd==="back"){mercyLocation="jen";showBarActions();return;} if(cmd==="d"||cmd.includes("dice")){mercyLocation="dice";add("PICK 1 / 2 / 3 / 4 / 5 / 6   (B) BACK","system");return;} add("DICE   (B) BACK","system");return;}
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
  if((cmd.includes("talk to tim")||cmd==="talk tim"||cmd==="tim") && player.flags.timQuest==="found" && hasItem("Tim's Old Badge")){removeItem("Tim's Old Badge");player.flags.timQuest="done";add("Tim turns the badge over in his palm for a long moment.");add(`TIM > Thought I'd lost this part of myself for good. Thanks, ${player.handle}.`,"bright");add("QUEST COMPLETE — THE OLD BADGE","place");gainXp(70);gainBolts(30);return;}
  if((cmd.includes("talk to murphy")||cmd==="talk murphy"||cmd==="murphy") && player.flags.murphyQuest==="found" && hasItem("Usable Serpentine Belt")){removeItem("Usable Serpentine Belt");player.flags.murphyQuest="done";add("Murphy bends the belt, checks the ribs, then actually smiles.");add("MURPHY > That's one good belt. Knew there had to be one left out there.","bright");add("QUEST COMPLETE — ONE GOOD BELT","place");gainXp(65);gainBolts(35);return;}
  // Transactions and contextual actions get first crack so words like ENERGY BAR don't route to Jen's BAR.
  if(mercyLocation==="johnny" && cmd.includes("buy") && cmd.includes("energy")){ buyJohnny("Energy Bars"); return; }
  if(mercyLocation==="johnny" && cmd.includes("buy") && cmd.includes("bandage")){ buyJohnny("Bandage"); return; }
  if(mercyLocation==="johnny" && cmd.includes("buy") && cmd.includes("reinforced")){ buyJohnny("Reinforced Jacket"); return; }
  if(mercyLocation==="johnny" && cmd.includes("buy") && cmd.includes("hammer")){ buyJohnny("Claw Hammer"); return; }
  if(mercyLocation==="johnny" && cmd.includes("buy") && cmd.includes("tire")){ buyJohnny("Tire Iron"); return; }
  if(cmd.includes("buy") && cmd.includes("bandage")){ if(player.bolts<8){add("WAYNE > Eight Bolts. Medicine is cheaper than bleeding to death.","system");return;} if(packSlotsUsed()>=player.packMax && !hasItem("Bandage")){add("Your pack is full.","system");return;} player.bolts-=8; updateHud(); addPack("Bandage","consumable"); add("WAYNE > Try using it before you can see bone.","bright"); return; }
  if(cmd.includes("sell") && cmd.includes("scrap")){ const it=findItem("Scrap Metal"); if(!it){add("JOHNNY > You're trying to sell me scrap you don't have. Bold strategy.","system");return;} const qty=cmd.includes("all")?it.qty:1; removeItem("Scrap Metal",qty); player.bolts+=4*qty; updateHud(); add(`+${4*qty} BOLTS`, "reward"); add(`JOHNNY > ${qty} scrap. Fair enough.`); return; }
  if(cmd.includes("inspect") && (cmd.includes("corvette")||cmd.includes("photo")) || cmd.includes("about corvette")){ add("You step closer to the faded photograph. A bright blue Corvette sits under a sky that looks almost impossibly clean."); add("Murphy glances over and smiles. MURPHY > Blue Corvette. That's what cars were supposed to look like.","bright"); return; }
  if(cmd.includes("upgrade") || cmd.includes("about equipment")){ add("MURPHY > Bring me enough Scrap, Wire, and Bolts and we can make that gear considerably less terrible. Crafting upgrades are coming online soon.","system"); return; }
  if(cmd.includes("treat") || cmd.includes("heal")){ const missing=player.maxHp-player.hp; if(missing<=0){add("WAYNE > You're fine. Go injure yourself first if you're determined to give me money.");return;} const units=Math.ceil(missing/5), cost=Math.min(units,player.bolts); if(cost<=0){add("WAYNE > No Bolts? Fine. Don't bleed on anything. We'll work something out later.");return;} const healed=Math.min(missing,cost*5); player.bolts-=cost; player.hp+=healed; if(player.hp>=player.maxHp)player.deathStreak=0; updateHud(); add(`WAYNE patches you up. +${healed} HP   -${cost} BOLTS`,"reward"); if(player.hp>=player.maxHp)add("DEATH PENALTY RESET — fully recovered in Solace.","system"); return; }

  if(cmd.startsWith("deposit")){ const all=cmd.includes("all"),m=cmd.match(/\d+/),amount=all?player.bolts:(m?parseInt(m[0],10):0); if(amount<=0){add("AMII > Tell me how many Bolts you want to deposit.","system");return;} const n=Math.min(amount,player.bolts); if(n<=0){add("AMII > You don't have any carried Bolts to deposit.","system");return;} player.bolts-=n;player.bankBolts+=n;updateHud();add(`${n} BOLTS DEPOSITED — protected inside Solace.`,"reward");return; }
  if(cmd.startsWith("withdraw")){ const m=cmd.match(/\d+/),amount=m?parseInt(m[0],10):0; if(amount<=0){add("AMII > Tell me how many Bolts you want back.","system");return;} const n=Math.min(amount,player.bankBolts);if(n<=0){add("AMII > There's nothing in your account to withdraw.","system");return;}player.bankBolts-=n;player.bolts+=n;updateHud();add(`${n} BOLTS WITHDRAWN.`,"reward");return; }
  if(cmd.startsWith("stash ")){stashItem(cmd.slice(6));return;} if(cmd.startsWith("retrieve ")){retrieveItem(cmd.slice(9));return;}
  if(cmd==="view stash"||cmd==="stash"){add("SECURE STASH","place");if(!player.stash.length)add("EMPTY","system");else player.stash.forEach((i,n)=>add(`[${n+1}] ${i.name}${i.qty>1?` ×${i.qty}`:""}`));add("STASH <item>   RETRIEVE <item>   BANK   TOWN","system");return;}

  if(cmd.includes("talk to jen")||cmd==="talk jen"){npcTalk("jen");return;} if(cmd.includes("talk to johnny")||cmd==="talk johnny"){npcTalk("johnny");return;} if(cmd.includes("talk to murphy")||cmd==="talk murphy"){npcTalk("murphy");return;} if(cmd.includes("talk to wayne")||cmd==="talk wayne"){npcTalk("wayne");return;} if(cmd.includes("talk to amii")||cmd==="talk amii"){npcTalk("amii");return;} if(cmd.includes("talk to tim")||cmd==="talk tim"){npcTalk("tim");return;}
  if(cmd==="small talk"||cmd==="smalltalk"){
    const who=["jen","johnny","murphy","wayne","amii","tim"].includes(mercyLocation)?mercyLocation:null;
    if(who){ smallTalk(who); return; }
    add("Talk to someone first.","system"); return;
  }
  for(const n of ["jen","johnny","murphy","wayne","amii","tim"]){if(cmd.includes("small talk")&&cmd.includes(n)){smallTalk(n);return;}}

  if(cmd.includes("relay")){ const who=["jen","murphy","tim"].includes(mercyLocation)?mercyLocation:null; if(who){askAboutRelay(who);return;} if(player.flags.relayUnlocked){enterRelayStation();return;} add("Ask someone in Solace about the Relay Station.","system"); return; }
  if(cmd.includes("rumor")){add("JEN > Road's been louder than usual. Travelers disappearing east of the old overpass. Murphy thinks it's raiders. Wayne thinks Murphy watches too many old movies.","bright");return;}
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
  if(cmd.includes("about mercy")){add("TIM > Started as a fuel stop. Then a camp. Then somebody built a wall and suddenly we had opinions about zoning.","bright");return;}
  if(cmd.includes("about road")||cmd.includes("route 127")){add("TIM > Route 127 keeps going east. So do the problems. Get some rest before you decide you need to meet them.","bright");return;}
  if(["jen","jenDrinks"].includes(mercyLocation) && (cmd==="beer"||cmd==="buy beer")){ if(player.bolts<3){add("JEN > Three Bolts.","system");return;} player.bolts-=3; player.hp=Math.min(player.maxHp,player.hp+5);updateHud();add("BEER — +5 HP   -3 BOLTS","reward"); if(mercyLocation==="jenDrinks")showDrinkMenu(); return;}
  if(["jen","jenDrinks"].includes(mercyLocation) && (cmd==="shot"||cmd==="buy shot")){ if(player.bolts<5){add("JEN > Five Bolts.","system");return;} player.bolts-=5; player.hp=Math.min(player.maxHp,player.hp+10);updateHud();add("SHOT — +10 HP   -5 BOLTS","reward"); if(mercyLocation==="jenDrinks")showDrinkMenu(); return;}
  if(["jen","jenDrinks"].includes(mercyLocation) && cmd.includes("house special")){ if(player.bolts<8){add("JEN > Eight Bolts.","system");return;} player.bolts-=8; player.hp=Math.min(player.maxHp,player.hp+15);updateHud();add("HOUSE SPECIAL — +15 HP   -8 BOLTS","reward");add("JEN > This stopped being medicine about two drinks ago.","bright"); if(mercyLocation==="jenDrinks")showDrinkMenu(); return;}
  if(mercyLocation==="jen" && (cmd.includes("rent room")||cmd==="room")){ if(player.bolts<12){add("JEN > Room's twelve Bolts.","system");return;} player.bolts-=12;player.hp=player.maxHp;player.deathStreak=0;player.flags.rentedRoom=true;day++;player.turns=Math.min(player.maxTurns,player.turns+20);updateHud();add("ROOM RENTED — SAFE REST","reward");add(`DAY ${day} — Full HP. Death penalty reset. +20 turns (up to stash cap).`,"system");return;}
  if(mercyLocation==="jen" && cmd==="gamble"){ mercyLocation="dice"; add("DICE TABLE","place"); add("You walk over to a smoke-hazed table in the back corner. Two wastelanders are throwing battered dice against an overturned ammo tin."); add('One looks up. "Bolts talk. Pick a number."',"bright"); add("PICK 1 / 2 / 3 / 4 / 5 / 6   LEAVE TABLE","system"); return; }
  if(mercyLocation==="dice"){
    if(cmd.includes("leave")){mercyLocation="jen";add("You step away from the dice table and return to the bar.");showBarActions();return;}
    let pick=(cmd.match(/[1-6]/)||[])[0]; if(!pick){add("PICK 1 / 2 / 3 / 4 / 5 / 6   LEAVE TABLE","system");return;} player.flags.dicePick=Number(pick); add(`YOUR PICK: ${pick}`); add("WAGER 1 / 5 / 10 BOLTS   LEAVE TABLE","system"); mercyLocation="diceBet"; return;
  }
  if(mercyLocation==="diceBet"){
    if(cmd.includes("leave")){mercyLocation="jen";add("You step away from the dice table and return to the bar.");showBarActions();return;}
    const m=cmd.match(/(?:^|\s)(1|5|10)(?:\s|$)/); if(!m){add("WAGER 1 / 5 / 10 BOLTS   LEAVE TABLE","system");return;} const bet=Number(m[1]); if(player.bolts<bet){add("Not enough Bolts for that wager.","system");return;} player.bolts-=bet; const roll=1+Math.floor(Math.random()*6); add(`DIE: ${roll}`); add(`YOUR PICK: ${player.flags.dicePick}`); if(roll===player.flags.dicePick){const payout=bet*6;player.bolts+=payout;add(`WIN — +${payout-bet} BOLTS NET`,"reward");}else add(`LOSS — ${bet} BOLTS`,"danger"); updateHud(); add("PLAY AGAIN   LEAVE TABLE","system"); mercyLocation="diceAgain"; return;
  }
  if(mercyLocation==="diceAgain"){if(cmd.includes("leave")){mercyLocation="jen";add("You step away from the dice table and return to the bar.");showBarActions();return;} if(cmd.includes("play")||cmd==="p"){mercyLocation="dice";add("PICK 1 / 2 / 3 / 4 / 5 / 6   LEAVE TABLE","system");return;} add("PLAY AGAIN   LEAVE TABLE","system");return;}

  if((cmd==="relay station"||cmd==="relay") && player.flags.relayUnlocked){enterRelayStation();return;}
  if(mercyLocation==="relay" && (cmd.includes("install")||cmd.includes("stabilize")||cmd.includes("repair"))){
    if(relayPartCount()<4){add(`RELAY REPAIR INCOMPLETE — ${relayPartCount()}/4 COMPONENTS RECOVERED`,"system");return;}
    if(player.flags.relayQuest==="complete"){add("The Relay connection is already stable.","system");return;}
    player.flags.relayQuest="complete";
    add("RELAY STATION — CONNECTION STABILIZED","reward");
    add("You fit the four salvaged components into their housings. One by one, the dead meters wake.");
    add("A steady green line crosses the monitor. For the first time, the station holds its signal.");
    add("WOMAN'S VOICE > You did it. We can finally talk.","woman");
    add("MAIN QUEST COMPLETE — THE RELAY STATION","reward");
    add("(B) BACK","system");return;
  }
  if(mercyLocation==="relay" && cmd.includes("inspect")){
    if(cmd.includes("monitor")){add("The monitor is dead again. A faint ozone smell hangs around the vents. A signal-conditioning board behind the display is scorched beyond repair.");add("You remember the pre-collapse communications equipment along Route 127 east of Solace.","bright");inspectRelaySystem("monitor");showRelayChoices();return;}
    if(cmd.includes("console")){add("The main console has power in fits and starts. The old POWER REGULATOR is cooked; SIGNAL STABILITY never rises above the bottom quarter.");add("Johnny keeps shelves of obsolete electronics. If anyone in Solace has one, he might.","bright");inspectRelaySystem("console");showRelayChoices();return;}
    if(cmd.includes("antenna")){add("A bank of antenna controls is frozen halfway through calibration. The ANTENNA SERVO has seized solid.");add("You passed old motor assemblies at the county maintenance yard off the service road.","bright");inspectRelaySystem("antenna");showRelayChoices();return;}
    if(cmd.includes("cable")){add("Most of the cable is brittle but intact, but the SHIELDED FEED COUPLER has burned through at the wall.");add("A faded service diagram marks a lower utility access road near the Route 127 fork.","bright");inspectRelaySystem("cables");showRelayChoices();return;}
  }
  if(cmd==="gate"||cmd==="west gate"||cmd==="leave solace"||cmd==="solace gate"){mercyLocation="gate";add("SOLACE — WEST GATE","place");add("Route 127 runs west toward the old house and the service-road fork.");add("HEAD WEST — OLD HOUSE   (B) BACK","system");return;}
  if(cmd==="g") cmd="east gate";
  if(cmd==="e" && mercyLocation==="town") cmd="west gate";
  if(cmd==="east gate"){mercyLocation="eastGate";player.flags.eastRouteDiscovered=true;add("SOLACE — EAST GATE","place");add("Beyond the barricade, Route 127 continues through country Solace patrols only when it has to.");add("HEAD EAST — ROUTE 127   (B) BACK","system");return;}
  if(mercyLocation==="gate" && (cmd.includes("head west")||cmd.includes("old house")||cmd==="west"||cmd==="h")){startRoadTrip("house",8);return;}
  if(mercyLocation==="eastGate" && (cmd.includes("head east")||cmd==="east"||cmd==="h")){ startRoadTrip("east",16); return; }
  if(cmd.includes("stay in mercy")){mercyLocation="town";mercyMenu();return;}
  if(cmd==="b"||cmd==="back"){ if(mercyLocation==="jenTalk"){mercyLocation="jen";showBarActions();return;} if(["jenDrinks","jenGames"].includes(mercyLocation)){mercyLocation="jen";showBarActions();return;} if(["jen","murphy","johnny","wayne","amii","relay","gate","eastGate"].includes(mercyLocation)){mercyLocation="town";mercyMenu();return;} }
  if(cmd==="t"||cmd==="town"||cmd==="solace"||cmd==="return to town"||cmd.includes("main street")){mercyLocation="town";mercyMenu();return;}
  if(cmd==="j" && mercyLocation==="jen"){npcTalk("jen");return;}
  if(cmd==="bar"||cmd==="jen's bar"||cmd==="visit bar"){mercyLocation="jen";add("JEN'S BAR","place");showWanderersAt("jen");if(!player.flags.visited_jen){player.flags.visited_jen=true;add("Warm light leaks through patched windows. The room smells like wood smoke and something almost resembling dinner.");add("Jen is short, warm, and easy to talk to—the kind of person who makes a hard place feel less hard.");add("As she reaches for a glass, you catch a glimpse of a tiny ladybug tattoo near her wrist.");add("JEN > First one's water. You look like you need it more than anything stronger.","bright");if(player.flags.travelerInSolace)add("The wounded woman from the road is sitting near the end of the bar with a fresh dressing on her arm. She catches your eye and smiles. ‘Didn’t think I’d see you again.’","bright");}else{add("JEN > Back again? What can I get you?", "bright");}showBarActions();return;}
  if(cmd==="trader"||cmd==="trading post"||cmd==="johnny"){mercyLocation="johnny";add("JOHNNY'S TRADING POST","place");showWanderersAt("johnny");if(!player.flags.visited_johnny){player.flags.visited_johnny=true;add("Shelves made from old road signs hold food, tools, ammunition, and objects whose original purpose is no longer obvious.");add("Johnny looks over your pack with the practiced grin of a man already working out three different ways to make a deal.");add("JOHNNY > I'll buy almost anything. Sell almost anything too. And lucky for you, today I happen to be feeling generous.","bright");add("JOHNNY > Generous-ish.","bright");}else{add("JOHNNY > Back for another deal?", "bright");}johnnyShop();return;}
  if(cmd==="workshop"||cmd==="murphy"){mercyLocation="murphy";add("MURPHY'S WORKSHOP","place");showWanderersAt("murphy");if(!player.flags.visited_murphy){player.flags.visited_murphy=true;add("The shop looks chaotic until you notice every tool is exactly where Murphy expects it to be.");add("A faded photograph of a bright blue Corvette is pinned above his workbench, remarkably clean compared with everything around it.");add("MURPHY > Let's see what survived the trip with you.","bright");add("He checks your Rusted Pipe and gives an approving little shrug. MURPHY > Ugly. Reliable. I respect that.");}else{add("MURPHY > Back again? What needs fixing?", "bright");}add(`TALK TO MURPHY   UPGRADES   INSPECT CORVETTE PHOTO${townVisitorChoice()}   (B) BACK`,"system");return;}
  if(cmd==="clinic"||cmd==="wayne"){mercyLocation="wayne";add("WAYNE'S CLINIC","place");showWanderersAt("wayne");if(!player.flags.visited_wayne){player.flags.visited_wayne=true;add("Clean bandages, boiled instruments, labeled jars. Someone here knows what they're doing.");add("A tiny word has been scratched into the underside of one metal shelf: SEX.","system");add("Wayne notices you noticing it and says absolutely nothing.");add(`WAYNE > You're at ${player.hp}/${player.maxHp} HP. I've seen worse. Usually attached to smarter decisions.`,"bright");}else{add("WAYNE > Try not to bleed on the floor.", "bright");}add("TREAT WOUNDS — 1 BOLT PER 5 HP   BUY BANDAGE — 8 BOLTS   TALK TO WAYNE   TOWN","system");return;}
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
  addImmediate(labels.join("   "),"system");
  followOutput();
}
function showInterfaceNav(){ if(player.flags.interfaceUnlocked) add("(S) STATUS   (I) INVENTORY   (M) MAP   (Q) QUESTS   (V) SAVE","system"); }
function openInterface(which){
  if(!player.flags.interfaceUnlocked) return false;
  if(stage!=="inventory"&&stage!=="inventoryItem"&&stage!=="quests"&&stage!=="interfaceStatus"&&stage!=="interfaceMap") returnStage=stage;
  if(which==="inventory"){stage="inventory";inventoryMode=null;showInventory();showInterfaceNav();return true;}
  if(which==="status"){stage="interfaceStatus";showStatus();showInterfaceNav();return true;}
  if(which==="map"){stage="interfaceMap";showMap();showInterfaceNav();return true;}
  if(which==="quests"){stage="quests";showQuests();showInterfaceNav();return true;}
  if(which==="save"){
    stage="interfaceSave"; saveGame(activeSaveSlot);
    add("(B) BACK — RETURN TO GAME", "system");
    return true;
  }
  return false;
}
function redrawState(){
  if(stage==="standing") return showStandingOptions();
  if(stage==="house") return add("SEARCH BATHROOM CABINET   CHECK FIREPLACE   CHECK PACK   MAP   SAVE GAME 01   HEAD NORTH — SOLACE","system");
  if(stage==="mercy"){ if(mercyLocation==="town") return mercyMenu(); if(mercyLocation==="jen") return showBarActions(); if(mercyLocation==="relay") return showRelayChoices(); if(mercyLocation==="eastGate")return add("(H) HEAD EAST — ROUTE 127   (B) BACK","system"); }
  if(stage==="encounter") return add(encounterChoices(currentEncounter()),"system");
  if(stage==="roadReady") return add("(R) ROAD — BEGIN JOURNEY","system");
  showCurrentContext();
}

function renderCurrentChoices(){
  if(stage==="combat") return add("(A) ATTACK   (U) USE ITEM   (B) BACK OFF","system");
  if(stage==="turnComplete"||stage==="questRoadComplete") return add("(C) CONTINUE   (R) REVERSE DIRECTION","system");
  if(stage==="inventory"){ showInventory(); return showInterfaceNav(); }
  if(stage==="inventoryItem"){ const item=findItem(inventoryMode&&inventoryMode.item); if(item && (item.type==="weapon"||item.type==="armor"))return add("(E) EQUIP   (D) DROP   (B) BACK","system"); if(item) return add(item.name==="Battered Flashlight"?"(D) DISMANTLE   (B) BACK":item.type==="consumable"?"(U) USE   (D) DROP   (B) BACK":"(D) DROP   (B) BACK","system"); }
  if(stage==="quests"){showQuests();return showInterfaceNav();} if(stage==="interfaceStatus"){showStatus();return showInterfaceNav();} if(stage==="interfaceMap"){showMap();return showInterfaceNav();} if(stage==="interfaceSave")return add("(B) BACK — RETURN TO GAME", "system");
  if(stage==="serviceRoad")return add(player.flags.serviceBossDead?"(E) SEARCH MAINTENANCE YARD   (R) RETURN TO FORK":"(C) CONTINUE UP ROAD   (R) RETURN TO FORK","system");
  if(stage==="fork")return add(`(C) CONTINUE TO ${roadGoal==="house"?"OLD HOUSE":"SOLACE"}   (S) CHECK SERVICE ROAD${player.flags.relayPartsRevealed?"   CHECK LOWER ACCESS ROAD":""}`,"system");
  if(stage==="mercy"){ if(mercyLocation==="town")return mercyMenu(); if(mercyLocation==="jen")return showBarActions(); if(mercyLocation==="jenDrinks")return showDrinkMenu(); if(mercyLocation==="jenGames")return showGambleMenu(); if(mercyLocation==="relay")return showRelayChoices(); if(mercyLocation==="eastGate")return add("(H) HEAD EAST — ROUTE 127   (B) BACK","system"); if(mercyLocation==="gate")return add("(H) HEAD WEST — OLD HOUSE   (B) BACK","system"); if(["jen","johnny","murphy","wayne","amii","tim"].includes(mercyLocation))return npcTalk(mercyLocation); }
  redrawState();
}
async function handleCommand(raw) {
  autoFollowOutput=true;
  let cmd = raw.trim().toLowerCase();
  if(busy) return;
  if(!cmd && !["confirmNewSlot","confirmHandle"].includes(stage)){ add("> [ENTER]","bright"); renderCurrentChoices(); return; }
  if(player.flags.interfaceUnlocked && stage!=="combat" && stage!=="combatItems") {
    const global={i:"inventory",inventory:"inventory",inv:"inventory",s:"status",status:"status",stats:"status",m:"map",map:"map",q:"quests",quest:"quests",quests:"quests",v:"save",save:"save","save current":"save"};
    if(global[cmd]){ add(`> ${raw}`,"bright"); openInterface(global[cmd]); return; }
  }
  // Opening-room shortcuts are local until the interface is actually unlocked.
  if(!player.flags.interfaceUnlocked && stage==="wake") { if(cmd==="l") cmd="look around"; else if(cmd==="s") cmd="stand up"; }
  if(!player.flags.interfaceUnlocked && stage==="standing") { const k={c:"check cabinet",s:"search room",h:"check pack",i:"inspect computer"}; if(k[cmd]) cmd=k[cmd]; }
  const interfaceStages=["inventory","inventoryItem","quests","interfaceStatus","interfaceMap","interfaceSave"];
  if(stage==="mercy" && mercyLocation!=="town" && cmd==="t" && !numberedChoices[cmd]) cmd="town";
  else if(!interfaceStages.includes(stage) && cmd.length===1 && currentHotkeys[cmd]) cmd=currentHotkeys[cmd].toLowerCase();
  if(/^\d+$/.test(cmd) && numberedChoices[cmd] && !["inventory","inventoryItem","combatItems","confirmNewSlot","title","fallen"].includes(stage)) cmd=numberedChoices[cmd];
  add(`> ${raw||"[ENTER]"}`, "bright");

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
      add("Two energy bars. A battered flashlight. A rusted pipe. And a thick handheld GPS with a tiny green screen.");
      add("RUSTED PIPE — Damage 5–10.   WORN JACKET — Defense 2.","system");
      await outputQueue; showStandingOptions();
    } else if(cmd.includes("computer")||cmd.includes("terminal")||cmd.includes("inspect")){
      await terminalAwakens();
    } else {
      add("That's not an option.","system");
      showStandingOptions();
    }
    return;
  }

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
    else if(cmd === "skip intro" || cmd === "skip" || cmd === "testing") { skipIntroForTesting(); }
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
    if(m){ pendingNewGameSlot=Number(m[1]); stage="confirmNewOverwrite"; const data=getSaveData(pendingNewGameSlot); add(`WARNING — SAVE ${pendingNewGameSlot}: ${(data&&data.player&&data.player.handle)||"NO HANDLE"}`,"danger"); add("This character’s saved progress will be replaced only after you confirm.","system"); add("(Y) CONFIRM OVERWRITE    (N) CANCEL    (B) BACK TO TITLE","bright"); input.placeholder="Type Y to confirm, N to cancel"; }
    else add("Choose SAVE 1, SAVE 2, or SAVE 3, or CANCEL.","system");
    return;
  }
  if(stage === "confirmNewOverwrite") {
    if(cmd === "y" || cmd === "yes" || cmd === "confirm") {
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
      add("Waiting for your choice: (Y) CONFIRM OVERWRITE   (N) CANCEL   (B) BACK", "bright");
    }
    return;
  }
  if(stage === "testingCode"){ if(cmd==="cancel"){ stage=player.turns<=0?"zeroTurns":"between"; add("Testing access cancelled.","system"); return; } if(raw.trim().toUpperCase()===TEST_ACCESS_CODE){ testMode=true; stage=player.turns<=0?"zeroTurns":"between"; updateHud(); add("TEST MODE ACTIVE","reward"); add("Expedition Turn limit disabled. HP, XP, Bolts, loot, quests and combat remain live.","system"); add("Type TEST OFF at any time to restore normal Turn limits.","system"); return; } add("ACCESS DENIED","danger"); return; }
  if(stage === "confirmHandle"){ if(cmd===""||cmd==="y"||cmd==="yes"){player.handle=pendingHandle;pendingHandle="";updateHud();add(`The faded letters read: ${player.handle.toUpperCase()}.`,"bright");add("Still yours. That's something.");stage="standing";await outputQueue;showStandingOptions();} else if(cmd==="n"||cmd==="no"||cmd==="change"){const old=pendingHandle;pendingHandle="";stage="handle";add(`CHANGE HANDLE — current entry: ${old}`,"system");add("Enter a new Handle, or RANDOM for a suggestion.","system");} else add("(Y) YES [ENTER]   (N) CHANGE","system"); return; }
  if(stage === "handle"){ if(cmd==="random"||cmd==="autofill"){ const names=["Drifter","Rook","Rust","Crow","Hollow","Slate","Nomad","Flint"]; const h=names[Math.floor(Math.random()*names.length)]; add(`Suggested Handle: ${h}`,"bright"); add(`Type ${h} to accept, or RANDOM to reroll.`,"system"); } else setHandle(raw); return; }
  if(stage==="confirmSaveOverwrite"){ if(cmd==="y"||cmd==="yes"){const sl=pendingSaveSlot; stage=returnStage||"between"; pendingSaveSlot=sl; saveGame(sl);} else {pendingSaveSlot=null;stage=returnStage||"between";add("SAVE CANCELLED","system");} return; }
  if(stage==="fallen"){ if(cmd==="1"||cmd==="get up"||cmd==="get"||cmd==="continue"){stage=player.flags.mercyDiscovered?"mercy":"house";mercyLocation="town";if(stage==="mercy")mercyMenu();else arriveHouse();}else add("[1] GET UP","system");return;}
  if(stage==="combatItems"){ if(cmd==="b"||cmd==="back"){stage="combat";inventoryMode=null;showCurrentContext();return;} const n=parseInt(cmd,10); if(n&&inventoryMode&&inventoryMode.items[n-1]){useItem(inventoryMode.items[n-1]);stage="combat";inventoryMode=null;showCurrentContext();return;} add("Choose an item NUMBER or (B) BACK.","system");return; }
  if(stage==="inventory"){ if(cmd==="b"||cmd==="back"||cmd==="exit"){stage=returnStage||"between";inventoryMode=null;redrawState();return;} const n=parseInt(cmd,10); const items=player.pack.filter(i=>!["key","quest"].includes(i.type)); if(n&&items[n-1]){await showInventoryItem(items[n-1].name);return;} add("Select an item NUMBER or (B) BACK.","system");return; }
  if(stage==="inventoryItem"){ const name=inventoryMode&&inventoryMode.item; if((cmd==="e"||cmd==="equip") && name){ const item=findItem(name); if(item && (item.type==="weapon"||item.type==="armor")){ const slot=item.type; const previous=player[slot]; removeItem(name); player[slot]=name; if(previous && previous!==name)addPack(previous,slot); updateHud();add(`EQUIPPED — ${name}. Previous ${slot}: ${previous||"none"}.`,"reward");stage="inventory";inventoryMode=null;showInventory();showInterfaceNav();return;} add("That item cannot be equipped.","system");return;} if(cmd==="b"||cmd==="back"){stage="inventory";showInventory();showInterfaceNav();return;} if(cmd==="u"||cmd==="use"||cmd.startsWith("use ")){useItem(name);stage="inventory";inventoryMode=null;showInventory();showInterfaceNav();return;} if(name==="Battered Flashlight" && (cmd==="d"||cmd.includes("dismantle"))){dismantleItem(name);stage="inventory";inventoryMode=null;showInventory();showInterfaceNav();return;} if(cmd==="d"||cmd==="drop"||cmd.startsWith("drop ")){dropItem(name);stage="inventory";inventoryMode=null;showInventory();showInterfaceNav();return;} add(name==="Battered Flashlight"?"Choose (D) DISMANTLE or (B) BACK.":"Choose (U) USE, (D) DROP, or (B) BACK.","system");return; }
  if(["quests","interfaceStatus","interfaceMap","interfaceSave"].includes(stage)){ if(cmd==="b"||cmd==="back"){stage=returnStage||"between";redrawState();} else { if(stage==="quests")showQuests(); else if(stage==="interfaceStatus")showStatus(); else if(stage==="interfaceMap")showMap(); else add("(B) BACK — RETURN TO GAME","system"); if(stage!=="interfaceSave")showInterfaceNav(); } return; }
  if (cmd === "status" || cmd === "stats") { if(player.flags.interfaceUnlocked)openInterface("status"); else showStatus(); return; }
  if (cmd === "quests" || cmd === "quest" || cmd === "quest log") { openInterface("quests"); return; }
  if (cmd === "inventory" || cmd === "inv" || cmd === "pack") { if(stage==="combat"){add("Inventory management is unavailable during combat. Use (I) USE ITEM for consumables.","system");return;} openInterface("inventory"); return; }
  if (cmd === "map" || cmd === "road map") { openInterface("map"); return; }
  if (/^save( game)? ?[123]$/.test(cmd)) { returnStage=stage; saveGame(Number(cmd.match(/[123]$/)[0])); return; }
  if (cmd === "save" || cmd === "save game" || cmd === "save current") { returnStage=stage; saveGame(activeSaveSlot); return; }
  if(cmd === "testing access" || cmd === "testing"){ stage="testingCode"; add("TESTING ACCESS","place"); add("Enter access code. Type CANCEL to return.","system"); return; }
  if(cmd === "test off" || cmd === "disable test mode"){ testMode=false; updateHud(); add("TEST MODE DISABLED — normal Turn limits restored.","system"); if(player.turns<=0)noTurnsMenu(); return; }
  if (/^load( game)? ?[123]$/.test(cmd)) { loadGame(Number(cmd.match(/[123]$/)[0])); return; }
  if (cmd === "load" || cmd === "load game") { loadGame(activeSaveSlot); return; }
  if(stage==="turnComplete" || stage==="questRoadComplete"){
    if(cmd==="r"||cmd.includes("reverse")){ roadGoal=roadGoal==="east"?"east":(roadGoal==="mercy"?"house":"mercy"); roadTurn=Math.max(0,roadTripLength-roadTurn-1); roadTurnCharged=false; add(`You turn back toward ${roadGoal==="mercy"?"Solace":"the old house"}.`,"bright"); showEncounter(); }
    else if(cmd==="c"||cmd.includes("continue")){advanceRoad();} else add("(C) CONTINUE   (R) REVERSE DIRECTION","system"); return; }
  if(stage==="zeroTurns"){
    if(testMode){ add("TEST MODE ACTIVE — Turns are unlimited. Type TEST OFF to restore the real counter.","reward"); stage="between"; showEncounter(); return; }
    if(player.flags.overnightLocked){ add(`OVERNIGHT STATE LOCKED — ${player.flags.overnight==="camp"?"MAKE CAMP":"REMAIN ON ROAD"}`,"bright"); add(`NEXT TURN REFILL: ${refillText()}`,"system"); add("SAVE CURRENT   STATUS   INVENTORY   MAP   TESTING","system"); return; }
    if(cmd==="c"||cmd.includes("camp")){player.flags.pendingOvernight="camp";add("MAKE CAMP?","bright");add("Lower danger / lower chance of finding loot. This choice locks until Turns replenish.","system");add("(Y) CONFIRM   (N) CANCEL","system");stage="overnightConfirm";}
    else if(cmd==="r"||cmd.includes("remain")||cmd.includes("road")){player.flags.pendingOvernight="road";add("REMAIN ON THE ROAD?","bright");add("Higher danger / higher chance of finding loot. This choice locks until Turns replenish.","system");add("(Y) CONFIRM   (N) CANCEL","system");stage="overnightConfirm";}
    else noTurnsMenu(); return; }
  if(stage==="overnightConfirm"){ if(cmd==="n"||cmd==="cancel"||cmd==="no"){player.flags.pendingOvernight="";noTurnsMenu();return;} if(cmd==="y"||cmd==="confirm"||cmd==="yes"){player.flags.overnight=player.flags.pendingOvernight;player.flags.pendingOvernight="";player.flags.overnightLocked=true;stage="zeroTurns"; if(player.flags.overnight==="camp")add("CAMP SET — You settle somewhere defensible. Lower danger, lower loot chance.","reward"); else add("ROAD WATCH SET — You remain active through the night. Higher danger, higher loot chance.","reward"); add(`LOCKED UNTIL REFILL — ${refillText()}`,"system"); add("SAVE CURRENT   STATUS   INVENTORY   MAP   TESTING","system");return;} add("(Y) CONFIRM   (N) CANCEL","system");return; }
  if(stage==="fork"){ if(cmd==="c")cmd="continue"; if(cmd==="s")cmd="check service road"; if(cmd.includes("lower")||cmd.includes("access")){ player.flags.relayBranchDiscovered=true; stage="relayBranch"; serviceRoadDepth=1; add("LOWER ACCESS ROAD","place");add("A narrow three-segment utility road drops away from Route 127 on the opposite side of the fork.");add("CONTINUE DOWN ROAD   RETURN TO FORK","system"); return;} if(cmd.includes("service")||cmd.includes("check")){ if(!testMode && player.turns<=0){noTurnsMenu();return;}spendTurn();serviceRoadDepth=1;stage="serviceRoad";add("SERVICE ROAD — LOWER GRADE","place");add("The cracked lane climbs away from Route 127. Fresh scrape marks score the pavement.");add("(C) CONTINUE UP ROAD   (R) RETURN TO FORK","system"); } else if(cmd.includes("mercy")||cmd.includes("house")||cmd.includes("continue")){ roadTurnCharged=false; advanceRoad(); } else add("(C) CONTINUE TO SOLACE   (S) CHECK SERVICE ROAD","system"); return;}
  if(stage==="eastEnd"){ if(cmd.includes("search")||cmd.includes("rack")){ if(player.flags.relayPartsRevealed) awardRelayPart("east","SIGNAL-CONDITIONING MODULE"); else add("You find a sealed communications module. You have no idea whether it's useful yet, so you leave it protected in the rack.","system"); add("RETURN TO SOLACE","system"); return;} if(cmd.includes("return")||cmd.includes("solace")){ stage="mercy";mercyLocation="town";add("You hike back west to Solace.","bright");mercyMenu();return;} add("SEARCH EQUIPMENT RACK   RETURN TO SOLACE","system");return;}
  if(stage==="relayBranch"){ if(cmd.includes("return")){stage="fork";serviceRoadDepth=0;add("You climb back to the Route 127 fork.");add(`CONTINUE TO ${roadGoal==="house"?"OLD HOUSE":"SOLACE"}   CHECK SERVICE ROAD${player.flags.relayPartsRevealed?"   CHECK LOWER ACCESS ROAD":""}`,"system");return;} if(cmd.includes("continue")||cmd.includes("down")){ serviceRoadDepth++; if(serviceRoadDepth<3){add(`LOWER ACCESS ROAD — SEGMENT ${serviceRoadDepth}`,"place");add(serviceRoadDepth===2?"The road squeezes between dead trees and a collapsed drainage wall. Fresh tool marks show somebody has scavenged here before.":"A rusted utility enclosure appears through the trees.");add("CONTINUE DOWN ROAD   RETURN TO FORK","system");} else {add("ABANDONED SIGNAL CABINET","place");add("A weatherproof roadside cabinet has been ripped open. One shielded feed coupler is still bolted to the backplane."); if(player.flags.relayPartsRevealed)awardRelayPart("branch","SHIELDED FEED COUPLER"); else add("You don't know what you need from this hardware yet.","system");add("(R) RETURN TO FORK","system");} return;} add("CONTINUE DOWN ROAD   RETURN TO FORK","system");return;}
  if(stage==="serviceRoad"){ if(cmd==="e")cmd="search maintenance yard"; if(cmd==="r")cmd="return to fork"; if(cmd==="c")cmd="continue up road"; if(cmd.includes("search")&&player.flags.serviceBossDead){ if(player.flags.maintenanceYardSearched){add("You've already searched the maintenance yard.","system");add("(R) RETURN TO FORK","system");return;} player.flags.maintenanceYardSearched=true; if(player.flags.relayPartsRevealed)awardRelayPart("yard","ANTENNA SERVO"); else add("You find several old motor assemblies, but nothing means much to you yet.","system"); add("(R) RETURN TO FORK","system");return;} if(cmd.includes("return")){ const cost=2; if(!testMode && player.turns<cost){noTurnsMenu();return;} if(!testMode){player.turns-=cost;updateHud();} serviceRoadDepth=0;stage="fork";dailyRoadTurns+=2; add("You hike back to the fork.","system");add(`(C) CONTINUE TO ${roadGoal==="house"?"OLD HOUSE":"SOLACE"}   (S) CHECK SERVICE ROAD`,"system");return;} if(cmd.includes("continue")||cmd.includes("up road")){if(!testMode && player.turns<=0){noTurnsMenu();return;}spendTurn(); if(serviceRoadDepth<2){serviceRoadDepth=2;add("SERVICE ROAD — WASHOUT","place");add("The lane bends around a washed-out culvert. Tire ruts vanish into weeds, then reappear beside an old county equipment fence.");add("(C) CONTINUE UP ROAD   (R) RETURN TO FORK","system");return;} serviceRoadDepth=3;if(player.flags.serviceBossDead){add("The maintenance yard is quiet now. You've already taken what mattered.");add("(R) RETURN TO FORK","system");return;}add("COUNTY MAINTENANCE YARD","place");add("A hulking figure steps from the ruined garage, dragging a heavy wrench across the concrete.");startCombat({name:"THE YARDMAN",level:5,hp:28,min:6,max:10,xp:45,bolts:18,end:"The Yardman drops hard. The maintenance yard finally goes quiet."},"serviceBoss",false);return;} add("(C) CONTINUE UP ROAD   (R) RETURN TO FORK","system");return;}
  if(stage === "combat"){ handleCombat(cmd); return; }
  if(stage === "wandererRoad"){ handleRoadWanderer(cmd); return; }
  if(stage === "mercy" && currentTownWanderer && handleTownWanderer(cmd)) return;
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
  if (cmd.startsWith("drop ")) { dropItem(cmd.slice(5)); return; }

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
    if(cmd.includes("fireplace")){ add("Cold ash shifts under the pipe. Beneath it, you find a boot print that is not yours.","bright"); add("Someone has been here since you left.","system");
    } else if(cmd.includes("medicine")||cmd.includes("bathroom")||cmd.includes("cabinet")||cmd.includes("bandage")){
      if(player.flags.houseBandage){add("The medicine cabinet is empty now.","system");}
      else {player.flags.houseBandage=true;addPack("Bandage","consumable");add("Behind a cracked bottle of antiseptic, one sealed bandage is still usable.","bright");}
    } else if(cmd.includes("north")||cmd.includes("mercy")||cmd.includes("road")){startRoadTrip("mercy",8);}
    else if(cmd.includes("pack")){showInventory();}
    else add("SEARCH BATHROOM CABINET   CHECK FIREPLACE   CHECK PACK   MAP   SAVE GAME 01   HEAD NORTH — SOLACE","system");
    return;
  }
  if (stage === "roadReady") { if (cmd==="r" || cmd.includes("road") || cmd.includes("east") || cmd.includes("go")) showEncounter(); else add("(R) ROAD — BEGIN JOURNEY", "system"); return; }
  if (stage === "encounter") { resolveEncounter(cmd); return; }
  if (stage === "between") { showEncounter(); return; }
  if (stage === "settlement") {
    if(cmd==="p") cmd="approach gate";
    if (cmd.includes("approach") || cmd.includes("gate") || cmd.includes("relay")) {
      add("You raise your empty hand and tell the guard about the transmission.");
      add("Silence. Then bolts grind inside the gate.", "bright");
      add("The buses part just far enough to let you through. Smoke, voices, hammering metal. People.");
      add("An older man with red hair graying at the temples waits inside the gate. He offers his hand.");
      add("TIM > Welcome to Solace. Don't make us regret the name.", "man");
      add("He points down what used to be Main Street.");
      add("BAR   TRADER   WORKSHOP   CLINIC   BANK   BULLETIN BOARD   TALK TO TIM", "system");
      add("TOWN ACTIONS COST 0 TURNS. STARTING A FIGHT COSTS 1 TURN. Type TOWN anytime to see locations.", "system");
      player.flags.mercyDiscovered=true; player.flags.mainSolaceQuest="done"; stage = "mercy"; mercyLocation="town"; if(!player.flags.solaceCheckpointSaved){player.flags.solaceCheckpointSaved=true;saveGame(activeSaveSlot);add("CHECKPOINT REACHED — SOLACE AUTOSAVED","reward");} mercyMenu();
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
