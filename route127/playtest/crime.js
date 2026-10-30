// Route 127 v52: single persistent wanderer inventory, pickpocketing and local bounty foundation.
// Uses existing save snapshot's player.wandererState and player.flags; no separate storage format.
function v52Crime(){return player.flags.v52Crime||(player.flags.v52Crime={bounty:0,lifetime:0,history:[],active:[]});}
function v52Record(type,victim,detail,amount){const c=v52Crime();const entry={day,type,victim,detail,amount,location:v52CrimeLocation()};c.bounty+=amount;c.lifetime+=amount;c.history.push(entry);c.active.push(entry);c.history=c.history.slice(-100);c.active=c.active.slice(-100);add(`!!! CRIME REPORTED — ${type.toUpperCase()} !!!`,'danger');add(`${detail} — BOUNTY +${amount} BOLTS; TOTAL ${c.bounty} BOLTS`,'danger');updateHud();}
function v52Wanted(){const c=v52Crime();if(c.bounty>0){add(`!!! WANTED — ${c.bounty} BOLTS !!!`,'danger');}else add('WANTED STATUS: CLEAR','system');}
function v52WantedBoard(){const c=v52Crime();add('SOLACE — WANTED POSTERS','place');v52Wanted();add(`LIFETIME BOUNTY ACCRUED: ${c.lifetime} BOLTS`,'system');if(c.active.length){c.active.slice(-15).forEach(x=>add(`DAY ${x.day} — ${x.detail} (+${x.amount} BOLTS)`,'danger'));}else add('No active offenses on your record.','system');add('BOUNTY HUNTING CONTRACTS: '+(player.level>=5?'UNLOCKED — NPC CONTRACTS NOT YET AVAILABLE':'LOCKED UNTIL LEVEL 5'),'system');add('TOWN   BOARD','system');}
function v52PayFine(){const c=v52Crime();if(!c.bounty){add('TIM > Your record is clear. Keep it that way.');return;}const fine=c.bounty; if(player.bolts<fine){add(`TIM > Clearing that record costs ${fine} Bolts. You only have ${player.bolts}.`,'danger');return;}player.bolts-=fine;c.bounty=0;c.active=[];add(`TIM > ${fine} Bolts. The active warrants are withdrawn. History stays on file.`,'reward');updateHud();}
// Shared bribe state for Tim and Kaiden. The ordinary legal fine stays available.
function r18BribeOffer(lawman){const c=v52Crime(),f=player.flags,today=Number(day)||1;delete f.r18BribePending;if(!c.bounty){add('There is no outstanding bounty to settle.','system');return false;}if(today<(Number(f.r18BribeNextDay)||0)){add('Another bribe attempt is unavailable until day '+f.r18BribeNextDay+'. You can still pay the legal fine.','system');return false;}const price=Math.ceil(c.bounty*.5);if(player.bolts<price){add('The bribe would cost '+price+' Bolts; you do not have enough.','system');return false;}f.r18BribePending={lawman,price,bounty:c.bounty};add('Offer '+price+' Bolts? Success clears the bounty; failure reports attempted bribery. No payment on failure.','system');return true;}
function r18BribeConfirm(lawman){const f=player.flags,c=v52Crime(),p=f.r18BribePending,today=Number(day)||1;if(!p||p.lawman!==lawman){add('No bribe is awaiting confirmation here.','system');return false;}delete f.r18BribePending;if(today<(Number(f.r18BribeNextDay)||0)||c.bounty!==p.bounty||player.bolts<p.price){add('The offer changed; no bribe was attempted and no Bolts were charged.','system');return false;}f.r18BribeNextDay=today+3;if(Math.random()<.5){player.bolts-=p.price;c.bounty=0;c.active=[];updateHud();add(lawman+' accepts '+p.price+' Bolts and clears the bounty.','reward');}else{v52Record('Attempted bribery',lawman,'Attempted to bribe '+lawman,25);add(lawman+' rejects the offer and reports it. No bribe payment was taken.','danger');}return true;}
function r18BribeCancel(){delete player.flags.r18BribePending;add('You withdraw the offer. No Bolts were spent.','system');}
function r18LegalFine(lawman){const c=v52Crime();if(!c.bounty){add('Your record is clear.','system');return false;}const price=c.bounty;if(player.bolts<price){add('Clearing the bounty costs '+price+' Bolts.','system');return false;}player.bolts-=price;c.bounty=0;c.active=[];delete player.flags.r18BribePending;updateHud();add(lawman+' accepts '+price+' Bolts. Your bounty is cleared.','reward');return true;}
function v52ItemType(name){return GEAR[name]?.type||(['Bandage','Energy Bars','Reinforced Bandage','Emergency Trauma Kit'].includes(name)?'consumable':name==='Tent'?'supply':name==='Battered Flashlight'?'tool':'material');}
function v52CrimeLocation(){const names={town:'Main Street',jen:'The Rusty Lantern Tavern',jenTalk:'The Rusty Lantern Tavern',johnny:"Johnny's Trading Post",murphy:"Murphy's Motor Works",wayne:'Last Chance Clinic',amii:'Solace Savings & Loan',mara:'Scrap & Steel Armory',tim:'Tim',gate:'West Gate',eastGate:'East Gate',relay:'Relay Station'};return 'Solace — '+(names[mercyLocation]||mercyLocation);}
function v52Inventory(w){
 const p=v50Profile(w);let inv=p.v52Inventory;
 if(!inv){inv=p.v52Inventory={bolts:4+p.level*3+Math.floor(Math.random()*12),items:(p.stock||[]).map(x=>({...x,type:v52ItemType(x.name),trade:true})),version:2};}
 // Old v52 snapshots contain independent quantities. Keep the lower remaining count;
 // never resurrect goods already stolen/bought/salvaged. v51 simply seeds from its saved stock.
 if(inv.version!==2){for(const item of inv.items){const stock=(p.stock||[]).find(x=>x.name===item.name);item.type=item.type||v52ItemType(item.name);item.trade=!!stock;if(stock){item.qty=Math.min(item.qty,stock.qty);item.price=stock.price;}}inv.version=2;}
 p.stock=inv.items.filter(x=>x.trade);return inv;
}
function r18TheftAllowed(){const next=Number(player.flags.r18CrimeCooldowns?.theft)||0;if((Number(day)||1)>=next)return true;add('Another theft attempt is unavailable until day '+next+'.','system');return false;}
function r18TheftCaught(victim){(player.flags.r18CrimeCooldowns||(player.flags.r18CrimeCooldowns={})).theft=(Number(day)||1)+3;v52Record('Theft',victim,'The owner reports an explicit theft attempt',25);}
function r18StolenReward(name,type,qty=1){if(['key','quest'].includes(type)||protectedUniqueEquipment(name)||GEAR[name]?.rarity==='legendary')return false;if(addPack(name,type,qty,true,true))return true;(player.flags.r5LootQueue||(player.flags.r5LootQueue=[])).push({name,type,qty,stolen:true});add(name+' (STOLEN) awaits a backpack decision.','system');return true;}
function r18SaleDetected(item,victim){if(!item?.stolen)return false;const f=player.flags,today=Number(day)||1,next=Number(f.r18CrimeCooldowns?.sellStolen)||0;if(today<next){add('Another stolen-goods sale attempt is unavailable until day '+next+'. Nothing sold.','system');return true;}if(Math.random()>=.2)return false;(f.r18CrimeCooldowns||(f.r18CrimeCooldowns={})).sellStolen=today+3;v52Record('Selling Stolen Property',victim,'Attempted to sell stolen property',25);add('The merchant recognizes stolen property. Nothing sold.','danger');return true;}
function v52Pickpocket(w,inTown){if(!w||!wandererAlive(w)){add('Nobody here to steal from.','system');return;}const next=Number(player.flags.r18CrimeCooldowns?.pickpocket)||0;if((Number(day)||1)<next){add('Another pickpocket attempt is unavailable until day '+next+'.','system');return;}const state=ws(w.name),inv=v52Inventory(w),p=v50Profile(w);state.v52EncounterSerial=state.v52EncounterSerial||1;if(!inv.items.some(x=>x.qty>0&&!v53Unstealable(x))&&inv.bolts<=0){add('Nothing left to steal.','system');return;}if(!spendTurn()){add('NO TURNS LEFT FOR THEFT.','danger');return;}state.v52AttemptSerial=state.v52EncounterSerial;const chance=Math.max(.12,Math.min(.78,.54+(player.level-p.level)*.045-(state.v52Suspicion||0)*.04));const success=Math.random()<chance;
 if(success){const possibilities=inv.items.filter(x=>x.qty>0&&!v53Unstealable(x));if(inv.bolts>0)possibilities.push({name:'Bolts',qty:inv.bolts,type:'currency'});if(!possibilities.length){add(`${w.name} has nothing left worth taking.`,'system');return;}const item=possibilities[Math.floor(Math.random()*possibilities.length)];if(item.name==='Bolts'){const n=Math.min(inv.bolts,1+Math.floor(Math.random()*Math.min(8,inv.bolts)));inv.bolts-=n;player.bolts+=n;add(`STOLEN — ${n} Bolts from ${w.name}.`,'reward');}else{if(!addPack(item.name,item.type,1,true,true)){add('Your pack is full; you cannot carry the stolen item.','system');return;}item.qty--;add(`STOLEN — ${item.name} from ${w.name}.`,'reward');}state.v52Suspicion=(state.v52Suspicion||0)+1;updateHud();return;}
 (player.flags.r18CrimeCooldowns||(player.flags.r18CrimeCooldowns={})).pickpocket=(Number(day)||1)+3;state.v52Suspicion=(state.v52Suspicion||0)+2;add(`${w.name} catches your hand. "Keep your hands where I can see them!"`,'danger');v52Record('Attempted theft',w.name,`Attempted to steal from ${w.name} at ${v52CrimeLocation()}`,Math.max(10,p.level*8));if(Math.random()<.35){add(`${w.name} reaches for a weapon! Type FIGHT to retaliate, or leave.`,'danger');}else add(`${w.name} backs away, watching you carefully.`,'system');}
function v52WandererCommand(cmd,inTown){const named=cmd.match(/^steal(?: from)?(?: (.+))?$/);if(!named)return false;const w=inTown?wandererByName(named[1]||townWandererFocus||currentTownWanderer):wandererByName(currentRoadWanderer);if(!w|| (inTown && currentTownWanderer!==w.name)||(!inTown&&named[1]&&named[1].toLowerCase()!==w.name.toLowerCase())){add('Approach a wanderer before trying to steal.','system');return true;}if(inTown)townWandererFocus=w.name;v52Pickpocket(w,inTown);return true;}
const v52OldRoad=handleRoadWanderer;handleRoadWanderer=function(cmd){if(v52WandererCommand(cmd,false))return;return v52OldRoad(cmd);};
const v52OldSolace=handleSolace;handleSolace=function(cmd,raw=cmd){if(v52WandererCommand(cmd,true))return;if(cmd==='wanted'||cmd==='wanted posters'||cmd==='most wanted'||cmd==='view crimes'){v52WantedBoard();return;}if(cmd==='pay fine'||cmd==='clear bounty'){if(mercyLocation!=='tim'){add('Visit Tim to settle your bounty.','system');return;}v52PayFine();return;}return v52OldSolace(cmd,raw);};
const v52OldShow=showWanderer;showWanderer=function(w,context){const state=ws(w.name);v52Inventory(w);v52OldShow(w,context);add(context==='road'?'STEAL   INSPECT   FIGHT   MOVE ON':`STEAL FROM ${w.name.toUpperCase()}   INSPECT ${w.name.toUpperCase()}   TOWN`,'system');};
const v52OldTown=handleTownWanderer;handleTownWanderer=function(cmd){if(v52WandererCommand(cmd,true))return true;return v52OldTown(cmd);};
const v52OldTrade=v50Trade;v50Trade=function(w){if(!w||!wandererAlive(w)){add('Nobody here to trade with.','system');return;}if(stage==='mercy'&&currentTownWanderer===w.name)townWandererFocus=w.name;v52Inventory(w);return v52OldTrade(w);};
const v52OldInspect=v50Inspect;v50Inspect=function(w){v52OldInspect(w);const inv=v52Inventory(w);add(`VISIBLE PACK: ${inv.items.filter(x=>x.qty>0).length} supply types; Bolts and exact contents unknown.`,'system');};
const v52OldBoard=showBulletinBoard;showBulletinBoard=function(){v52OldBoard();add('WANTED POSTERS — Type WANTED to view crime records.','danger');};
const v52OldStatus=showStatus;showStatus=function(){v52OldStatus();v52Wanted();};
const v52OldNpcTalk=npcTalk;npcTalk=function(name){v52OldNpcTalk(name);if(name==='tim'){const c=v52Crime();add(`TIM > Your outstanding bounty is ${c.bounty} Bolts. Type PAY FINE to clear it.`,'system');}};
const v52OldUpdate=updateHud;updateHud=function(){v52OldUpdate();const c=v52Crime();let el=document.querySelector('#v52-wanted');if(!el){el=document.createElement('div');el.id='v52-wanted';el.style.cssText='color:#ef4444;font-weight:900;font-size:1.1em;letter-spacing:1px;text-shadow:0 0 5px #900';const host=document.querySelector('.terminal-header');if(host)host.insertAdjacentElement('afterend',el);}if(el){el.textContent=c.bounty>0?`!!! WANTED — ${c.bounty} BOLTS !!!`:'';el.hidden=c.bounty<=0;}};
// Existing trade uses p.stock. Theft removes from p.stock and the shared inventory; purchases also remove from the shared inventory.
const v52OldTradeCommand=v50TradeCommand;
v50TradeCommand=function(cmd){
 const w=wandererByName(player.flags.v50Trade);if(!w)return false;
 const accessible=stage==='wandererRoad'?currentRoadWanderer===w.name:stage==='mercy'&&currentTownWanderer===w.name;
 if(!accessible||!wandererAlive(w)){delete player.flags.v50Trade;delete player.flags.v50Sale;return false;}
 if(/^(?:inspect|small talk|talk|attack|fight|steal|claim wanderer loot)(?: |$)/.test(cmd)){delete player.flags.v50Trade;delete player.flags.v50Sale;return false;}
 const inv=v52Inventory(w),p=v50Profile(w);
 if(cmd==='confirm sale'&&player.flags.v50Sale){
  const sale=player.flags.v50Sale,i=player.pack.find(x=>x.name.toLowerCase()===sale.name.toLowerCase());if(i&&v48SellPrice(i)===sale.price){
   if(inv.bolts<sale.price){delete player.flags.v50Sale;add(`${w.name} cannot afford that item.`,'system');return true;}
   const type=i.type;delete player.flags.v50Sale;i.qty--;if(i.qty<=0)player.pack.splice(player.pack.indexOf(i),1);inv.bolts-=sale.price;
   let held=inv.items.find(x=>x.name===sale.name&&x.type===type);if(held)held.qty++;else inv.items.push({name:sale.name,type,qty:1,trade:false});gainBolts(sale.price);v50Trade(w);return true;
  }
 }
 const before=player.bolts;const result=v52OldTradeCommand(cmd);
 if(cmd.startsWith('buy ')&&player.bolts<before)inv.bolts+=before-player.bolts;
 return result;
};
// Preserve equipment-drop rules from v50; non-equipped inventory is also removed from living wanderers when stolen.

// One theft opportunity per distinct encounter, not per menu redraw.
const v52OldRoadShow=showRoadWanderer;showRoadWanderer=function(){v52OldRoadShow();const w=wandererByName(currentRoadWanderer);if(w){const st=ws(w.name);st.v52EncounterSerial=(st.v52EncounterSerial||0)+1;}};
const v52OldTownShow=showWanderersAt;showWanderersAt=function(spot){townWandererFocus=null;delete player.flags.v50Trade;delete player.flags.v50Sale;v52OldTownShow(spot);const w=wandererByName(currentTownWanderer);if(w){const st=ws(w.name);st.v52EncounterSerial=(st.v52EncounterSerial||0)+1;}};
// Charges belong to actual combat, not to a sticky victim flag.
const v52OldStartCombat=startCombat;startCombat=function(spec,source,townCost,openingAttack){
 const previous=combatState;v52OldStartCombat(spec,source,townCost,openingAttack);
 if(source==='townWanderer'&&combatState&&combatState!==previous){
  const w=wandererByName(spec.name);if(w){combatState.v52CrimeLocation=v52CrimeLocation();combatState.v52AssaultRecorded=true;v52Record('Assault',w.name,`Attacked ${w.name} at ${combatState.v52CrimeLocation}`,Math.max(20,w.level*12));}
 }
};
let v52CombatContext=null;
const v52OldHandleCombat=handleCombat;handleCombat=function(cmd){const previous=v52CombatContext;v52CombatContext=combatState;try{return v52OldHandleCombat(cmd);}finally{v52CombatContext=previous;delete player.flags.v52TownFightTarget;}};
const v52OldWandererLoot=v50WandererLoot;v50WandererLoot=function(name){
 const w=wandererByName(name),c=v52CombatContext;
 if(w&&c?.source==='townWanderer'&&wandererByName(c.name)===w&&c.hp<=0&&!c.v52MurderRecorded){
  c.v52MurderRecorded=true;const location=c.v52CrimeLocation||v52CrimeLocation();v52Record('Murder',w.name,`Killed ${w.name} at ${location}`,Math.max(50,w.level*30));
  v52Crime().history[v52Crime().history.length-1].location=location;
 }
 return v52OldWandererLoot(name);
};
// Reuse remaining carried goods for post-combat salvage; do not duplicate stolen goods.
const v52LootBeforeInventory=v50WandererLoot;v50WandererLoot=function(name){const w=wandererByName(name);const inv=w?v52Inventory(w):null;v52LootBeforeInventory(name);if(!inv||inv.salvaged)return;inv.salvaged=true;if(inv.bolts>0){player.bolts+=inv.bolts;add(`SALVAGED — ${inv.bolts} carried Bolts from ${name}.`,'reward');inv.bolts=0;updateHud();}const available=inv.items.filter(x=>x.qty>0);if(available.length){const item=available[Math.floor(Math.random()*available.length)];if(addPack(item.name,item.type)){item.qty--;add(`SALVAGED — ${item.name} from ${name}.`,'reward');}}};
const v52OldChoices=renderCurrentChoices;renderCurrentChoices=function(){v52OldChoices();if(stage==='wandererRoad'&&currentRoadWanderer)add('STEAL — one turn per attempt','system');};

const v52OldClaim=v50ClaimLoot;v50ClaimLoot=function(cmd){if(!cmd.startsWith('claim wanderer loot'))return false;const w=wandererByName(cmd.slice('claim wanderer loot'.length).trim());if(w&&wandererAlive(w)){add('There is no defeated wanderer to loot.','system');return true;}return v52OldClaim(cmd);};
// ATTACK is a synonym for the existing FIGHT flow, including town confirmation.
const v52AttackTown=handleTownWanderer;handleTownWanderer=function(cmd){return v52AttackTown(cmd.replace(/^attack(?= |$)/,'fight'));};
const v52TimSmallTalk=smallTalk;smallTalk=function(name){const result=v52TimSmallTalk(name);if(name==='tim')add(`TIM > Your outstanding bounty is ${v52Crime().bounty} Bolts. Type PAY FINE to clear it.`,'system');return result;};
