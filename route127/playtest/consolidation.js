// v53: focused playtest repair layer. Balance constants and save keys remain authoritative.
function v53Unstealable(i){return i.name.toLowerCase()==='blackglass requiem'||GEAR[i.name]?.rarity==='legendary';}
function v53Normalize(cmd){
 let s=String(cmd).trim().toLowerCase();
 if(/^browse wares(?: |$)/.test(s))return s.replace(/^browse wares/,'trade');
 if(/^talk(?: |$)/.test(s)&&!s.startsWith('talk to '))return s.replace(/^talk/,'small talk');
 return s;
}
const v53OldChoice=choiceCommand;choiceCommand=function(label){return v53Normalize(v53OldChoice(label));};
let v53OfficialMenu=false,v53RenderingWanderer=false,v53OutputSerial=0,v53LastMenuSerial=-1,v53LastMenuContext='';
function v53Context(){return stage+'|'+mercyLocation+'|'+townWandererFocus+'|'+currentRoadWanderer+'|'+(combatState?.name||'');}
function v53LegacyMenu(text){return /SMALL TALK|\bTALK\b/.test(text)&&/INSPECT/.test(text)&&/FIGHT/.test(text)&&/MOVE ON|LEAVE|TOWN/.test(text);}
function v53Display(text){let out=String(text??'').replace(/SMALL TALK/gi,'TALK');if(stage==='mercy'&&mercyLocation==='johnny'&&player.flags.solaceMenu==='shop')out=out.split(/\s{2,}/).filter(x=>!/^ASK ABOUT RELAY PARTS$/i.test(x)).join('   ');if(v53RenderingWanderer||stage==='wandererRoad'||stage==='mercy'&&(townWandererFocus||player.flags.v50Trade))out=out.replace(/\bTRADE\b/g,'BROWSE WARES');return out;}
const v53OldAdd=add;add=function(text='',cls=''){
 if(!v53OfficialMenu&&v53LegacyMenu(text)&&(v53RenderingWanderer||stage==='wandererRoad'||stage==='mercy'&&townWandererFocus))return;
 if(!v53OfficialMenu&&stage==='combat'&&/ATTACK/.test(text)&&/USE ITEM/.test(text)&&/BACK OFF/.test(text))return;
 if(!v53OfficialMenu&&(v53RenderingWanderer||stage==='wandererRoad'||stage==='mercy'&&townWandererFocus)&&/^(?:TRADE|STEAL)(?: |$)/.test(text)&&cls==='system')return;
 if(!v53OfficialMenu)v53OutputSerial++;return v53OldAdd(v53Display(text),cls);
};
const v53OldImmediate=addImmediate;addImmediate=function(text='',cls=''){
 if(!v53OfficialMenu&&stage==='combat'&&/ATTACK/.test(text)&&/USE ITEM/.test(text)&&/BACK OFF/.test(text))return;
 if(!v53OfficialMenu)v53OutputSerial++;return v53OldImmediate(v53Display(text),cls);
};
function v53Choices(parts){
 const labels=[...new Set(parts)],serial=v53OutputSerial;
 outputQueue=outputQueue.then(()=>{v53OfficialMenu=true;try{currentHotkeys={};numberedChoices={};usedHotkeys=new Set();addImmediate(hotkeyLine(labels.join('   ')),'system');v53LastMenuSerial=serial;v53LastMenuContext=v53Context();}finally{v53OfficialMenu=false;}});
}
function v53WandererMenu(w,road){
 if(!w||!wandererAlive(w))return;
 const suffix=road?'':' '+w.name.toUpperCase();
 v53Choices(['TALK'+suffix,...(!v50Profile(w).hostile?['BROWSE WARES'+suffix]:[]),'STEAL'+(road?'':' FROM '+w.name.toUpperCase()),'INSPECT'+suffix,'FIGHT'+suffix,road?'MOVE ON':'LEAVE']);
}
const v53OldRender=renderCurrentChoices;
renderCurrentChoices=function(){
 if(player.flags.v53Sale&&['mercy','wandererRoad'].includes(stage))return v53SaleMenu();
 if(player.flags.v53BoardEntry)return v53BoardPrompt();
 if(player.flags.v53BoardDraft!==undefined)return v53BoardConfirm();
 if(stage==='combat'&&combatState)return v53Choices(['ATTACK','USE ITEM','BACK OFF']);
 if(stage==='wandererRoad'&&currentRoadWanderer)return v53WandererMenu(wandererByName(currentRoadWanderer),true);
 if(stage==='mercy'&&pendingTownFight)return v53Choices(['CONFIRM FIGHT','BACK OFF']);
 if(stage==='mercy'&&townWandererFocus&&currentTownWanderer&&!player.flags.v50Trade)return v53WandererMenu(wandererByName(currentTownWanderer),false);
 if(stage==='mercy'&&mercyLocation==='tim'&&player.flags.solaceMenu!=='dialogue'&&!player.flags.pendingQuest)return v53TimMenu();
 return v53OldRender();
};
const v53OldContext=showCurrentContext;showCurrentContext=function(){if(stage==='combat'||stage==='wandererRoad'||stage==='mercy')return renderCurrentChoices();return v53OldContext();};
const v53OldShow=showWanderer;showWanderer=function(w,context){v53RenderingWanderer=true;try{v53OldShow(w,context);}finally{v53RenderingWanderer=false;}v53WandererMenu(w,context==='road');};
function v53TimMenu(){mercyLocation='tim';townWandererFocus=null;player.flags.solaceMenu='tim53';add('TIM — SOLACE','place');v53Choices(['TALK TIM',...(v52Crime().bounty>0?['PAY FINE']:[]),'INSPECT TIM','TOWN']);}
const v53OldSolace=handleSolace;handleSolace=function(cmd,raw=cmd){
 if(v53SaleCommand(cmd))return;
 if(cmd==='tim'||cmd==='find tim'){v53TimMenu();return;}
 if(mercyLocation==='tim'&&['back','b'].includes(cmd)){v53TimMenu();return;}
 if(mercyLocation==='tim'&&['pay fine','clear bounty'].includes(cmd)){v53OldSolace(cmd,raw);v53TimMenu();return;}
 if(mercyLocation==='tim'&&cmd==='inspect tim'){add('Tim studies the battered gate hinge. His red hair has gone gray around the temples. He keeps Solace moving.');v53TimMenu();return;}
 return v53OldSolace(cmd,raw);
};
const v53OldCommand=handleCommand;
handleCommand=async function(raw){
 await v53OldCommand(raw);await outputQueue;
 // Core mappings may be stale after asynchronous notifications. State, not stale
 // shortcut presence, owns the final actionable menu.
 if(!busy&&(stage==='combat'||stage==='mercy'&&!player.flags.v50Trade||stage==='wandererRoad'&&!player.flags.v50Trade)){
  if(stage==='mercy'&&!currentTownWanderer)townWandererFocus=null;
  if(v53LastMenuSerial!==v53OutputSerial||v53LastMenuContext!==v53Context()){renderCurrentChoices();await outputQueue;}
 }
};
const v53OldHud=updateHud;updateHud=function(){v53OldHud();let el=document.querySelector('#v53-bounty');if(!el){el=document.createElement('div');el.id='v53-bounty';el.className='utility-stat';const inv=document.querySelector('#side-inv');if(inv?.parentElement)inv.parentElement.insertAdjacentElement('afterend',el);}if(el){const n=v52Crime().bounty;el.textContent='BOUNTY '+(n>0?n:'NONE');el.style.color=n>0?'#ef4444':'';}};
const v53OldWanted=v52WantedBoard;v52WantedBoard=function(){v53OldWanted();add(`WANTED — ${player.handle||'UNNAMED TRAVELER'}`,'place');add(`CURRENT BOUNTY: ${v52Crime().bounty} BOLTS   LIFETIME BOUNTY: ${v52Crime().lifetime} BOLTS`,'system');add('HISTORICAL OFFENSES (latest retained records; includes paid warrants)','system');v52Crime().history.slice(-15).forEach(x=>add(`DAY ${x.day} — ${x.type} — ${x.victim} — ${x.location}: ${x.detail}`,'system'));v53Choices(['BOARD','TOWN']);};
const v53OldQuests=showQuests;showQuests=function(){v53OldQuests();if(v52Crime().bounty>0)add(`OPTIONAL — CLEAR YOUR NAME: Speak with Tim in Solace and PAY FINE (${v52Crime().bounty} Bolts). No XP or Bolt reward.`,'system');};
const v53OldVendor=johnnyShop;johnnyShop=function(){v53OldVendor();add('NEXT RESTOCK: '+refillText().slice(0,5),'system');};
const v53OldArmory=showEquipmentShop;showEquipmentShop=function(){v53OldArmory();add('NEXT RESTOCK: '+refillText().slice(0,5),'system');};
// Quantity selection and a single transaction commit for all sale outlets.
function v53SaleStart(name,merchant=null){
 const item=player.pack.find(i=>i.name.toLowerCase()===name.toLowerCase().trim()),unit=v48SellPrice(item);
 if(!item||unit<=0){add('That item cannot be sold. Equipped, quest and Legendary items are protected.','system');return false;}
 player.flags.v53Sale={name:item.name,type:item.type,available:item.qty,unit,qty:1,merchant,location:mercyLocation,mode:'quantity'};if(!merchant)player.flags.v48Sale={name:item.name,type:item.type,qty:1,total:unit};v53SaleMenu();return true;
}
function v53SaleMenu(){const q=player.flags.v53Sale;if(!q)return;
 add(`SELL ${q.name} — ${q.available} AVAILABLE — ${q.unit} BOLTS EACH`,'system');
 if(q.mode==='custom'){add(`CUSTOM AMOUNT — enter 1–${q.available}, or CANCEL.`,'system');return;}
 if(q.mode==='confirm'){add(`SELL ${q.qty} × ${q.name} FOR ${q.qty*q.unit} BOLTS TOTAL?`,'system');v53Choices(['CONFIRM SALE','CANCEL SALE']);return;}
 v53Choices(['SELL 1',...(q.available>=5?['SELL 5']:[]),'SELL ALL','CUSTOM AMOUNT','CANCEL SALE']);
}
function v53SaleCommand(cmd){
 const q=player.flags.v53Sale;if(!q)return false;
 if(['cancel sale','cancel','back','b','town','return to town'].includes(cmd)){delete player.flags.v53Sale;delete player.flags.v48Sale;delete player.flags.v50Sale;if(cmd.includes('town')){mercyLocation='town';mercyMenu();}else if(q.merchant)v50Trade(wandererByName(q.merchant));else v48SaleMenu();return true;}
 if(cmd==='custom amount'){q.mode='custom';v53SaleMenu();return true;}
 if(cmd==='confirm sale'){
  const item=player.pack.find(i=>i.name===q.name&&i.type===q.type),total=q.qty*q.unit;
  const w=q.merchant?wandererByName(q.merchant):null,inv=w?v52Inventory(w):null;
  const present=q.merchant?w&&wandererAlive(w)&&(stage==='wandererRoad'?currentRoadWanderer===w.name:stage==='mercy'&&currentTownWanderer===w.name):stage==='mercy'&&mercyLocation===q.location&&['johnny','jen','wayne','mara'].includes(mercyLocation);
  if(!present||!item||!Number.isSafeInteger(q.qty)||q.qty<1||item.qty<q.qty||v48SellPrice(item)!==q.unit||!Number.isSafeInteger(total)||!Number.isSafeInteger(player.bolts+total)||inv&&inv.bolts<total){delete player.flags.v53Sale;delete player.flags.v48Sale;delete player.flags.v50Sale;add('Sale changed or funds insufficient. Nothing sold.','system');if(present&&w)v50Trade(w);else if(present)v48SaleMenu();else{delete player.flags.v50Trade;renderCurrentChoices();}return true;}
  item.qty-=q.qty;if(item.qty===0)player.pack.splice(player.pack.indexOf(item),1);
  if(inv){inv.bolts-=total;const held=inv.items.find(i=>i.name===q.name&&i.type===q.type);if(held)held.qty+=q.qty;else inv.items.push({name:q.name,type:q.type,qty:q.qty,trade:false});}
  delete player.flags.v53Sale;delete player.flags.v48Sale;delete player.flags.v50Sale;gainBolts(total);add(`SOLD ${q.qty} × ${q.name} — ${total} BOLTS TOTAL`,'reward');v48Checkpoint();if(w)v50Trade(w);else v48SaleMenu();return true;
 }
 let n;if(q.mode==='custom'&&/^\d+$/.test(cmd))n=Number(cmd);else if(cmd==='sell all')n=q.available;else if(/^sell \d+$/.test(cmd))n=Number(cmd.slice(5));
 if(Number.isSafeInteger(n)&&n>=1&&n<=q.available){q.qty=n;q.mode='confirm';v53SaleMenu();return true;}
 add('Choose a valid quantity or cancel.','system');v53SaleMenu();return true;
}
v48Sell=function(name,confirmed=false){if(confirmed){if(player.flags.v53Sale)return v53SaleCommand('confirm sale');add('Choose a quantity before confirming.','system');return false;}return v53SaleStart(name);};
v48SaleMenu=function(){player.flags.v48Shop='sell';if(player.flags.v53Sale)return v53SaleMenu();add('SELL CARRIED ITEMS — SELECT AN ITEM (default quantity 1)','place');v53Choices([...player.pack.filter(i=>v48SellPrice(i)>0).map(i=>`SELL ${i.name.toUpperCase()} ×${i.qty} — ${v48SellPrice(i)} BOLTS EACH`),'BACK']);};
const v53OldTradeCommand=v50TradeCommand;v50TradeCommand=function(cmd){if(v53SaleCommand(cmd))return true;const w=wandererByName(player.flags.v50Trade);if(w&&cmd.startsWith('sell ')&&cmd!=='sell items'){v53SaleStart(cmd.slice(5).split(' ×')[0].split(' —')[0],w.name);return true;}return v53OldTradeCommand(cmd);};
// Board content stays local/shared; no per-character Relay completion announcement.
showBulletinBoard=function(){const counter=document.querySelector('#v53-board-counter');if(counter)counter.hidden=true;mercyLocation='town';player.flags.solaceMenu='board';townWandererFocus=null;add('SOLACE BULLETIN BOARD','place');add('MISSING: Two runners. Last seen eastbound.');add('NOTICE: Stop leaving broken glass outside The Rusty Lantern Tavern.');add('Someone has added underneath: THEN GIVE US BETTER CUPS.','system');getBoardPosts().forEach(p=>add(`> ${p.handle||'TRAVELER'} — DAY ${p.day||1}: ${p.text}`,'system'));v53Choices(['POST A MESSAGE','VIEW BOUNTIES','RETURN TO TOWN']);};
function v53BoardPrompt(){add(`WRITE A MESSAGE — MAX ${BOARD_MAX_CHARS} CHARACTERS. ${BOARD_MAX_CHARS-(input.value||'').length} REMAINING. Enter message or CANCEL.`,'system');}
function v53BoardConfirm(){const counter=document.querySelector('#v53-board-counter');if(counter)counter.hidden=true;const text=player.flags.v53BoardDraft;add(`POST AS ${player.handle||'TRAVELER'}: ${text}`,'system');v53Choices(['POST MESSAGE','EDIT MESSAGE','CANCEL MESSAGE']);}
function v53BoardCommand(raw){
 if(player.flags.v53BoardEntry){if(raw.trim().toLowerCase()==='cancel'){delete player.flags.v53BoardEntry;showBulletinBoard();return true;}const text=raw.trim().replace(/\s+/g,' ');if(!text||text.length>BOARD_MAX_CHARS||boardHasProfanity(text)){add('Message is empty, too long, or contains filtered language. Edit and try again.','system');v53BoardPrompt();return true;}delete player.flags.v53BoardEntry;player.flags.v53BoardDraft=text;v53BoardConfirm();return true;}
 if(player.flags.v53BoardDraft!==undefined){const cmd=/^\d+$/.test(raw)?numberedChoices[raw]:raw.toLowerCase();if(cmd==='post message'){const text=player.flags.v53BoardDraft;delete player.flags.v53BoardDraft;postToBulletinBoard(text);}else if(cmd==='edit message'){delete player.flags.v53BoardDraft;player.flags.v53BoardEntry=true;v53BoardPrompt();}else if(['cancel message','cancel'].includes(cmd)){delete player.flags.v53BoardDraft;showBulletinBoard();}else v53BoardConfirm();return true;}
 return false;
}
const v53OldCore=handleCommandCore;handleCommandCore=async function(raw){
 if(v53BoardCommand(raw))return;
 if(player.flags.v53Sale&&!/^(?:save|load|status|inventory|map|quests)(?: |$)/i.test(raw.trim())){const q=player.flags.v53Sale;const cmd=q.mode==='custom'?raw.trim():/^\d+$/.test(raw.trim())?numberedChoices[raw.trim()]||raw.trim():raw.trim().toLowerCase();if(v53SaleCommand(cmd))return;}
 const mapped=/^\d+$/.test(raw.trim())?numberedChoices[raw.trim()]:null;const cmd=v53Normalize(mapped||raw);
 if(stage==='mercy'&&cmd==='post a message'){player.flags.v53BoardEntry=true;v53BoardPrompt();return;}
 if(stage==='mercy'&&cmd==='view bounties'){v52WantedBoard();return;}
 return v53OldCore(/^\d+$/.test(raw.trim())?raw:v53Normalize(raw));
};
input.addEventListener('input',()=>{if(player.flags.v53BoardEntry){let counter=document.querySelector('#v53-board-counter');if(!counter){counter=document.createElement('div');counter.id='v53-board-counter';form.insertAdjacentElement('beforebegin',counter);}counter.textContent=`MESSAGE: ${Math.max(0,BOARD_MAX_CHARS-input.value.length)}/${BOARD_MAX_CHARS} CHARACTERS REMAINING`;counter.hidden=false;}else{const counter=document.querySelector('#v53-board-counter');if(counter)counter.hidden=true;}});

// Approved modest daily wallet replenishment: one existing daily clock, finite cap.
function v53ReplenishWallets(periods){if(!Number.isSafeInteger(periods)||periods<1)return;for(const w of wanderers){if(!wandererAlive(w)||!ws(w.name).profile?.v52Inventory)continue;const inv=v52Inventory(w),cap=15+v50Profile(w).level*3;inv.bolts+=Math.min(periods*4,Math.max(0,cap-inv.bolts));}}
const v53OldRefill=processRefill;processRefill=function(){ensureRefillClock();const due=Number(player.flags.nextRefillAt),periods=Date.now()>=due?Math.floor((Date.now()-due)/REFILL_MS)+1:0;v53OldRefill();if(periods)v53ReplenishWallets(periods);};
