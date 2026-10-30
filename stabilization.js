// R5 stabilization: explicit transactions and persistent demo state; loaded last.
const R5_RELAY=[['johnny','Power Regulator'],['yard','Antenna Servo'],['branch','Shielded Feed Coupler'],['east','Signal-Conditioning Module']];
function r5Migrate(){
 const f=player.flags;if(!f)return;
 // Old saves can have tutorial completion without the recipe bit.
 if(f.v49CraftCompleted)f.v49RecipeBandage=true;
 const rp=ensureRelayParts();
 for(const [key,name] of R5_RELAY){
  const found=player.pack.some(i=>i.name.toLowerCase()===name.toLowerCase());
  if(found)rp[key]=true;
  // Transfer to durable quest storage even on unfinished saves, never lose progress.
  player.pack=player.pack.filter(i=>i.name.toLowerCase()!==name.toLowerCase());
 }
 // Canonicalize only known material aliases; leave similarly named gear untouched.
 for(const i of player.pack){if(i.type!=='material')continue;const k=i.name.trim().toLowerCase();if(['scrap','scrap metal'].includes(k))i.name='Scrap Metal';else if(k==='cloth')i.name='Cloth';else if(k==='wire')i.name='Wire';}
 const merged=[];for(const i of player.pack){const same=merged.find(x=>x.name===i.name&&x.type===i.type&&!!x.stolen===!!i.stolen);if(same)same.qty+=i.qty;else merged.push(i);}player.pack=merged;
 if(!f.seaport55?.freed&&f.port55Casino){f.port55Casino=false;if(stage==='mercy'&&['casino','casinoGame','jenGames'].includes(mercyLocation))stage='seaport';}
 r5Capacity();
}
function r5Capacity(){const f=player.flags,old=Number(f.r5MuleBonus)||0,bonus=f.equippedPet==='Pack Mule'?2:0;player.packMax=Math.max(0,(Number(player.packMax)||0)-old+bonus);f.r5MuleBonus=bonus;}
const r5OldLoad=loadGame;loadGame=function(slot){r5CloseCredits();const value=r5OldLoad(slot);r5Migrate();updateHud();return value;};
const r5OldInventory=showInventory;showInventory=function(){r5Migrate();r5OldInventory();if(packSlotsUsed()>player.packMax){add('OVER CAPACITY — items kept. Sell, store or discard items before taking anything new.','danger');const extra=player.pack.filter(v48Ordinary).slice(player.packMax);extra.forEach(i=>add(`${i.name} ×${i.qty} — USE ITEM NAME TO SELL/STORE`,'system'));}};
const r5OldAddPack=addPack;
addPack=function(name,type='material',qty=1,quietFull=false,stolen=false){
 r5Capacity();if(!Number.isSafeInteger(qty)||qty<=0)return false;
 if(!['key','quest'].includes(type)&&packSlotsUsed()>player.packMax){if(!quietFull)add('OVER CAPACITY — free space before taking new items.','danger');return false;}
 const stack=player.pack.find(i=>i.name===name&&i.type===type&&!!i.stolen===!!stolen);
 if(!quietFull&&!stack&&!['key','quest'].includes(type)&&packSlotsUsed()>=player.packMax&&stage!=='fallen'){
  (player.flags.r5LootQueue||(player.flags.r5LootQueue=[])).push({name,type,qty,...(stolen?{stolen:true}:{})});
  add(`PACK FULL — ${name} awaits a Leave Behind / Replace an Item decision.`,'system');return true;
 }
 return r5OldAddPack(name,type,qty,quietFull,stolen);
};
function r5LootMenu(){
 const q=player.flags.r5LootQueue?.[0];if(!q)return;
 if(!player.flags.r5LootOrigin)player.flags.r5LootOrigin=stage;stage='r5Loot';
 add(`FOUND: ${gearLabel(q.name)} ×${q.qty} — PACK ${packSlotsUsed()}/${player.packMax}`,'place');
 if(q.candidate){const i=q.candidate;const rare=GEAR[i.name]?.rarity;add(`DISCARD ENTIRE STACK: ${i.name} ×${i.qty}; replace with ${q.name}?${['rare','epic','legendary'].includes(rare)?' WARNING — '+rare.toUpperCase()+' EQUIPMENT WILL BE LOST.':''}`,'danger');v53Choices(['CONFIRM REPLACEMENT','CANCEL REPLACEMENT']);}
 else if(q.select){const eligible=player.pack.filter(i=>v48Ordinary(i)&&!protectedUniqueEquipment(i.name));v53Choices([...eligible.map(i=>'REPLACE '+r18ItemLabel(i).toUpperCase()),'BACK']);if(!eligible.length)add('No eligible items: equipped and quest items are protected.','system');}
 else v53Choices(['LEAVE BEHIND','REPLACE AN ITEM']);
}
function r5LootFinish(){player.flags.r5LootQueue.shift();const origin=player.flags.r5LootOrigin||'between';delete player.flags.r5LootOrigin;stage=origin;v49Autosave();if(player.flags.r5LootQueue.length)r5LootMenu();else renderCurrentChoices();}
function r5LootCommand(cmd){const q=player.flags.r5LootQueue?.[0];if(!q){stage=player.flags.r5LootOrigin||'between';delete player.flags.r5LootOrigin;return;}
 if(cmd==='leave behind'&&protectedUniqueEquipment(q.name)){(player.stash||(player.stash=[])).push({name:q.name,type:q.type,qty:q.qty});add(`${q.name} secured in bank storage.`, 'reward');r5LootFinish();return;}
 if(cmd==='leave behind'){add(`${q.name} left behind. No reward can be collected again from this decision.`,'system');r5LootFinish();return;}
 if(cmd==='replace an item'){q.select=true;delete q.candidate;}
 else if(['back','b','cancel replacement'].includes(cmd)){delete q.candidate;delete q.select;}
 else if(cmd.startsWith('replace ')){const i=r18NamedStack(player.pack,cmd.slice(8));if(i&&v48Ordinary(i)&&!protectedUniqueEquipment(i.name))q.candidate={...i};}
 else if(cmd==='confirm replacement'&&q.candidate){
  const at=player.pack.findIndex(i=>i.name===q.candidate.name&&i.type===q.candidate.type&&i.qty===q.candidate.qty&&!!i.stolen===!!q.candidate.stolen);
  if(at<0||!v48Ordinary(player.pack[at])||protectedUniqueEquipment(player.pack[at].name)||packSlotsUsed()>player.packMax){add('Pack or capacity changed. Nothing discarded. Free excess items first.','danger');delete q.candidate;}
  else{player.pack.splice(at,1);r5OldAddPack(q.name,q.type,q.qty,true,!!q.stolen);add('Replacement complete.','reward');r5LootFinish();return;}
 }
 r5LootMenu();
}
const r5OldSaveStage=gameplayStageForSave;gameplayStageForSave=function(){return stage==='r5Loot'?player.flags.r5LootOrigin||'between':r5OldSaveStage();};
// Learn once, then the Factory bench reuses the established normal recipe system.
const r5OldWorkbench=v49Workbench;v49Workbench=function(){r5Migrate();if(!player.flags.v49RecipeBandage)return r5OldWorkbench();stage='factoryBench';add("FORGE'S WORKBENCH — LEARNED RECIPES",'place');if(player.flags.v49MurphyJob){const j=player.flags.v49MurphyJob;add(`${CRAFT_RECIPES[j.key]?.name} — ${Math.max(0,Math.ceil((j.endsAt-Date.now())/1000))} SECONDS`,'system');v53Choices(['COLLECT CRAFT','BACK']);return;}
 v53Choices(Object.values(CRAFT_RECIPES).filter(r=>!r.minLevel||player.level>=r.minLevel).map(r=>'CRAFT '+r.name.toUpperCase()).concat(['BACK']));
 add(`CARRIED MATERIALS: Cloth ${findItem('Cloth')?.qty||0}, Scrap Metal ${findItem('Scrap Metal')?.qty||0}, Wire ${findItem('Wire')?.qty||0}. Practice kit is tutorial-only.`,'system');};
function r5FactoryCraft(cmd){
 if(cmd==='back'||cmd==='b'){v49FactoryRoom();return;}
 if(cmd.startsWith('craft ')){const key=Object.keys(CRAFT_RECIPES).find(k=>CRAFT_RECIPES[k].name.toLowerCase()===cmd.slice(6)),r=CRAFT_RECIPES[key];if(r&&!player.flags.v49MurphyJob&&(!r.minLevel||player.level>=r.minLevel)){
 const missing=Object.entries({cloth:'Cloth',scrap:'Scrap Metal',wire:'Wire'}).filter(([k,n])=>r6MaterialCount(n)<(r[k]||0));
 if(missing.length||player.bolts<r.bolts)add('MISSING: '+missing.map(([k,n])=>`${n} ${r6MaterialCount(n)}/${r[k]}`).concat(player.bolts<r.bolts?[`${r.bolts} Bolts required`]:[]).join(', '),'danger');
 else{for(const [k,n] of Object.entries({cloth:'Cloth',scrap:'Scrap Metal',wire:'Wire'}))if(r[k])r6ConsumeMaterial(n,r[k]);player.bolts-=r.bolts;player.flags.v49MurphyJob={key,endsAt:Date.now()+r.seconds*1000,success:Math.random()<r.chance};v49Autosave();}
 }}else if(['collect craft','collect','collect result','check timer'].includes(cmd)){const j=player.flags.v49MurphyJob,r=j&&CRAFT_RECIPES[j.key];if(j&&r&&Date.now()>=j.endsAt){if(!j.success){add('Craft failed; materials consumed.','system');delete player.flags.v49MurphyJob;}else if(addPack(r.name,r.type,1,true)){add('CRAFT COMPLETE — '+r.name,'reward');delete player.flags.v49MurphyJob;}else add('Finished craft held at bench. Free a slot.','system');v49Autosave();}}
 v49Workbench();
}
// Compact, discovered-only journal; main objective always first.
const R5_QUESTS=[['r18CountyQuest','Rescue Eli Mercer'],['r18DanielQuest','Find Daniel Bennett'],['mainSolaceQuest','Head to Solace'],['relayQuest','Restore the Relay'],['timQuest','The Old Badge'],['murphyQuest','One Good Belt'],['jenQuest','Last Call'],['johnnyQuest','A Deal Gone Bad'],['amiiQuest','The Missing Deposit'],['waynePatientQuest','The Last Patient'],['houseQuest','Abandoned House'],['timHouseBounty','Trouble at the Old House'],['terribleBillyBounty','Terrible Billy'],['jenUnpaidTab','Unpaid Tab'],['jenFamiliarFace','A Familiar Face']];
showQuests=function(){const f=player.flags;add('QUEST JOURNAL — MAIN: '+portQuestObjective(),'place');const page=f.r5JournalPage||'menu';if(page!=='menu'){const rows=R5_QUESTS.filter(([k])=>f[k]&&!['locked','upcoming'].includes(f[k])&&(['done','complete'].includes(f[k])===(page==='completed')));rows.forEach(([k,n])=>add(`${n} — ${String(f[k]).toUpperCase()}`,'system'));if(page==='active'&&f.r18Station&&!f.r18Station.restored){const q=f.r18Station,e=typeof LG_EDGES!=='undefined'&&LG_EDGES[q.edge];const route=e&&typeof LG_NODES!=='undefined'?LG_NODES[e.a].name+' ↔ '+LG_NODES[e.b].name+', position '+q.step+' of '+e.distanceTurns:'the road where the radio was found';add('STATION NINE — '+route+'; '+(q.hunters==='active'?'resolve the Signal Hunters':'repair the tower: Electronics '+(q.parts.Electronics||0)+'/2, Wire '+(q.parts.Wire||0)+'/3, Scrap Metal '+(q.parts['Scrap Metal']||0)+'/2'),'system');}if(page==='active'&&f.r18Courier?.phase==='initial'){const d=f.r18Courier.delivered||{};add('NEITHER RAIN NOR RUIN — '+['tim','jen','docks'].filter(x=>!d[x]).map(x=>x==='docks'?'Seaport docks (after liberation)':x.toUpperCase()).join(', '),'system');}if(page==='active'&&f.r18Courier?.job)add('POSTAL DELIVERY — '+f.r18Courier.job.destination.toUpperCase()+' — '+f.r18Courier.job.status.toUpperCase(),'system');if(page==='active'&&f.r18CountyQuest==='active'&&f.r18CountyDepot?.edge)add(r18DepotTrailDescription(),'system');if(page==='active'&&f.relayQuest==='stabilize')add('Relay components: '+relayPartCount()+'/4. Inspect Relay systems for clues.','system');if(page==='completed'&&f.chapterOneComplete)add('Chapter One — COMPLETE','reward');if(!rows.length)add('No '+page+' side quests discovered.','system');}
 v53Choices(['ACTIVE QUESTS','COMPLETED QUESTS','BACK']);};
// Four existing materials, recovered deterministically at named exploration sites.
const R5_CHARGE_SITES={'0:1':'Cloth','1:3':'Electronics','2:4':'Wire','3:1':'Scrap Metal'};
function r5Story(){const f=player.flags;if(!f.r5StoryVersion){f.r5StoryVersion=1;f.r5ChargeParts=f.r5ChargeParts||{};if(f.factoryFinalComponent||f.portChargePrepared||f.portRoadCleared){Object.values(R5_CHARGE_SITES).forEach(n=>f.r5ChargeParts[n]=true);}if(f.chapterOneComplete){f.r5TerminalDone=true;f.r5CreditsSeen=true;}}return f.r5ChargeParts||(f.r5ChargeParts={});}
const r5BaseMigrate=r5Migrate;r5Migrate=function(){r5BaseMigrate();r5Story();};
function r5ChargeCount(){return Object.values(R5_CHARGE_SITES).filter(n=>r5Story()[n]).length;}
portQuestObjective=function(){const f=player.flags;r5Story();if(f.chapterOneComplete)return 'COMPLETE — Chapter One. Explore, recruit and rebuild.';if(f.seaport55?.freed)return 'Visit the Tomorrow Project terminal inside Seaport Workshop (no staff required).';if(f.seaportRoute?.arrived)return port55Objective();if(f.portRoadCleared)return 'Follow the freight line east to Seaport.';if(f.portChargePrepared)return 'Destroy the boulder at the collapsed overpass — USE DYNAMITE.';if(f.r5ChargeJob)return 'Return to Forge when the dynamite timer finishes.';if(f.v49FactoryMet){if(!f.v49TerminalRead)return 'Investigate the Factory terminal.';if(!f.r5ForgeBriefed)return 'Speak to Forge about Seaport and the blocked road.';if(r5ChargeCount()<4)return `Recover charge materials in Factory rooms (${r5ChargeCount()}/4): Shipping Office, Maintenance Workshop, Observation Room, Underground Storage.`;if(factoryDone()<4)return 'Defeat the three supervisors to open the basement, then stop the Foreman.';return 'Return to Forge to craft the dynamite.';}if(f.relayQuest==='complete')return 'Travel east from Solace to investigate the Factory.';if(f.mainSolaceQuest!=='done'&&f.mainSolaceQuest!=='complete')return 'Reach Solace using the GPS coordinates.';return f.relayQuest==='stabilize'?`Restore the Relay: recover ${4-relayPartCount()} remaining component(s), then install them.`:'Investigate the Relay Station in Solace.';};
port55Objective=function(){const q=port55State();if(!q.freed)return q.stage==='free'?'Free the survivors at Harbor Docks; the defeated enforcers cannot stop you.':q.stage==='confront'?'Confront the fishermen at Harbor Docks.':'Inspect the fishermen at Harbor Docks.';return player.flags.chapterOneComplete?'MAIN QUEST COMPLETE — Continue exploring.':'Visit the Tomorrow Project terminal inside the Workshop.';};
portForgeDialogue=function(){const f=player.flags;r5Story();if(!f.v49TerminalRead)return;f.r5ForgeBriefed=true;
 if(f.portChargePrepared){add('FORGE > The charge is ready. Clear the boulder and follow the freight line to Seaport.','bright');return;}
 if(f.r5ChargeJob){if(Date.now()<f.r5ChargeJob.endsAt){add(`FORGE > Charge curing: ${Math.ceil((f.r5ChargeJob.endsAt-Date.now())/1000)} seconds. No shortcuts with dynamite.`,'system');return;}delete f.r5ChargeJob;f.portChargePrepared=true;f.factoryFinalComponent=true;addPack('Prepared Dynamite Charge','quest');player.pack=player.pack.filter(i=>i.name!=='Factory Charge Component');add('DYNAMITE READY — Clear the boulder east of the Factory.','reward');v49Autosave();return;}
 add('FORGE > A boulder under the collapsed overpass blocks Seaport. Their last transmission mentioned the New Dominion. We need the harbor supply route, and those people need help.','bright');
 if(r5ChargeCount()<4){add('FORGE > Find Cloth in Shipping Office, Electronics in Maintenance Workshop, Wire in Observation Room and Scrap Metal in Underground Storage. I will set aside each charge component. The basement needs all three supervisor authorizations.','system');return;}
 if(factoryDone()!==4){add('FORGE > Materials are here, but the Foreman controls the charge circuit. Stop him before I arm it.','system');return;}
 f.r5ChargeJob={endsAt:Date.now()+30000};f.r5ChargePartsConsumed=true;add('FORGE > Materials secured in the charge. Give the binder 30 real seconds, then talk to me again.','reward');v49Autosave();};
const r5OldTerminal=v49Terminal;v49Terminal=function(){r5OldTerminal();add('LAST SEAPORT TRANSMISSION: communications ceased after armed Dominion vessels entered the harbor. Ground-floor engineer Forge can open the blocked freight road. Speak with him.','bright');v49Autosave();};
// Rusty is a local quartermaster, distinct from Mia's Rusty Anchor tavern.
function r5RustyStock(){const f=player.flags;const period=Number(f.nextRefillAt)||0;if(!f.r5Rusty||f.r5Rusty.period!==period){const arms=['Claw Hammer','Tire Iron','Reinforced Jacket'].filter(n=>GEAR[n]);const rare=Object.keys(GEAR).filter(n=>GEAR[n].rarity==='uncommon'&&['weapon','armor'].includes(GEAR[n].type));f.r5Rusty={period,bolts:500,stock:{Bandage:10,'Energy Bars':8,Tent:3,Cloth:8,'Scrap Metal':8,Wire:6}};const choice=arms[Math.abs(Math.floor(period/86400000))%arms.length];if(choice)f.r5Rusty.stock[choice]=1;if(rare.length&&Math.floor(period/86400000)%3===0)f.r5Rusty.stock[rare[Math.abs(Math.floor(period/86400000))%rare.length]]=1;}return f.r5Rusty;}
function r5RustyPrice(n){return Math.ceil((VENDOR_BASE[n]||({Bandage:8,Cloth:4,'Scrap Metal':8,Wire:6}[n])||50)*1.2);}
function r5RustyMenu(){stage='factoryRusty';const s=r5RustyStock();add('RUSTY — FACTORY QUARTERMASTER','place');add(`Merchant funds: ${s.bolts} Bolts. Entrance station; no travel turns. Restocks on the daily refill clock. Factory markup: 20%.`,'system');const ui=player.flags.r5RustyUI||'main';if(ui==='buy')v53Choices(Object.entries(s.stock).filter(([,q])=>q>0).map(([n,q])=>`BUY ${n.toUpperCase()} — ${GEAR[n]?.type==='weapon'?`DMG ${GEAR[n].min}–${GEAR[n].max} — `:GEAR[n]?.type==='armor'?`DEF ${GEAR[n].def} — `:''}${r5RustyPrice(n)} BOLTS (${q} LEFT)`).concat(['BACK']));else if(ui==='sell')v53Choices(player.pack.filter(i=>v48SellPrice(i)>0).map(i=>`SELL ${r18ItemLabel(i).toUpperCase()} — ${v48SellPrice(i)} BOLTS`).concat(['BACK']));else if(ui==='confirm'){const q=player.flags.r5RustySale;add(`SELL ONE ${q?.name} FOR ${q?.price} BOLTS? Rare/Epic sales require this confirmation.`,'system');v53Choices(['CONFIRM RUSTY SALE','CANCEL RUSTY SALE']);}else v53Choices(['BUY SUPPLIES','SELL ITEMS','RETURN TO FORGE']);}
function r5RustyCommand(cmd){const s=r5RustyStock();if(['return to forge','exit'].includes(cmd)){delete player.flags.r5RustyUI;v49FactoryRoom();return;}if(['back','b','cancel rusty sale'].includes(cmd)){player.flags.r5RustyUI='main';delete player.flags.r5RustySale;}else if(cmd==='buy supplies')player.flags.r5RustyUI='buy';else if(cmd==='sell items')player.flags.r5RustyUI='sell';else if(cmd.startsWith('buy ')){const n=Object.keys(s.stock).find(n=>n.toLowerCase()===cmd.slice(4).split(' —')[0]);if(!n||s.stock[n]<1)add('Item sold out.','danger');else if(player.bolts<r5RustyPrice(n))add(`Need ${r5RustyPrice(n)} Bolts; you carry ${player.bolts}.`,'danger');else if(addPack(n,v52ItemType(n),1,true)){player.bolts-=r5RustyPrice(n);s.bolts+=r5RustyPrice(n);s.stock[n]--;v49Autosave();}else add('Backpack full. No Bolts charged.','danger');}else if(cmd.startsWith('sell ')){const i=r18NamedStack(player.pack,cmd.slice(5).split(' —')[0]);if(i&&v48SellPrice(i)>0){player.flags.r5RustySale={name:i.name,type:i.type,stolen:!!i.stolen,price:v48SellPrice(i)};player.flags.r5RustyUI='confirm';}}else if(cmd==='confirm rusty sale'&&player.flags.r5RustyUI==='confirm'){const q=player.flags.r5RustySale,i=q&&player.pack.find(i=>i.name===q.name&&i.type===q.type&&!!i.stolen===!!q.stolen);if(!i||v48SellPrice(i)!==q.price)add('Item changed or is protected; nothing sold.','danger');else if(s.bolts<q.price)add(`Rusty has ${s.bolts} Bolts; needs ${q.price}. Nothing sold.`,'danger');else if(!i.stolen||!r18SaleDetected(i,'Rusty')){i.qty--;if(i.qty===0)player.pack.splice(player.pack.indexOf(i),1);player.bolts+=q.price;s.bolts-=q.price;if(!i.stolen)s.stock[q.name]=(s.stock[q.name]||0)+1;v49Autosave();}delete player.flags.r5RustySale;player.flags.r5RustyUI='sell';}updateHud();r5RustyMenu();}
v49FactoryRoom=function(){stage='factoryWorkshop';if(!player.flags.v49FactoryMet){player.flags.v49FactoryMet=true;add('A Tomorrow Project terminal wakes in the corner. Forge looks up from his bench.','bright');}add("THE FACTORY — FORGE'S WORKSHOP",'place');add('RUSTY — Factory supply/trade station, open before and after the Foreman.','system');v53Choices(['TOMORROW PROJECT TERMINAL','TALK TO FORGE','WORKBENCH','RUSTY','ENTER INNER FACTORY','EXIT FACTORY',...(player.flags.portChargePrepared?['ROAD TO SEAPORT']:[])]);r5Scene('factory');};
const r5OldFactoryCommand=factoryCommand;factoryCommand=function(cmd){const f=factoryState(),name=R5_CHARGE_SITES[f.floor+':'+f.room];if(stage==='factoryDungeonRoom'&&cmd==='search'&&name&&!r5Story()[name]&&!player.flags.portChargePrepared&&!player.flags.portRoadCleared){if(!spendTurn()){add('NO TURNS LEFT. Return to the stairwell freely.','danger');return true;}r5Story()[name]=true;f.searched[day+':'+f.floor+':'+f.room]=true;player.flags.factoryFinalComponent=r5ChargeCount()===4;add(`CHARGE COMPONENT SECURED — ${name}. Reserved for Forge (${r5ChargeCount()}/4); no backpack slot used.`,'reward');v49Autosave();factoryRender();return true;}return r5OldFactoryCommand(cmd);};
PORT55_PETS['Pack Mule']={rarity:'uncommon',price:350,ability:'+2 backpack slots while active. No combat bonus. Stubborn, slow, and smells terrible. But it will carry your junk without complaining. Much.'};
const r5OldPets=port55Pets;port55Pets=function(){r5Capacity();r5OldPets();if(packSlotsUsed()>player.packMax)add(`OVER CAPACITY ${packSlotsUsed()}/${player.packMax}. All items retained; no new intake until space is freed.`,'danger');updateHud();};
port55Vendor=function(){r5Capacity();add('NESSA — PET STORE. One active companion; benefits and prices below.','place');const names=Object.keys(PORT55_PETS).filter(n=>Number.isFinite(PORT55_PETS[n].price));names.forEach(n=>add(`${n}: ${PORT55_PETS[n].ability}`,'system'));port55Submenu('Pet Store',names.map(n=>`${n} — ${PORT55_PETS[n].price} BOLTS${port55Owned().includes(n)?' — OWNED':''}${player.flags.equippedPet===n?' — ACTIVE':''}`).concat(['RETURN TO MARKET']));};
port55Menu=function(){const q=port55State();if(q.freed){portRecruitIntro();port55PatrolTick();add('=== SEAPORT ===','place');add('Kaiden is on patrol at '+port55PatrolName()+'.','system');r5DirectChoices(['TOWN STREETS','HARBOR DOCKS','MARKET AREA','RUSTY ANCHOR','RETURN WEST']);}else{add('=== OCCUPIED SEAPORT ===','place');add(q.stage==='free'?'The enforcers are defeated. The survivors are still chained at the docks.':'Dominion-backed fishermen hold the harbor.','system');r5DirectChoices(['HARBOR DOCKS','RETURN WEST']);}r5Scene('seaport');};
function r5DirectChoices(options){numberedChoices={};currentHotkeys={b:'back'};options.forEach((label,i)=>{add(`[${i+1}] ${label}`,'system');numberedChoices[String(i+1)]=label.toLowerCase();});}
function r5Market(){stage='port55Market';add('SEAPORT — MARKET AREA','place');r5DirectChoices(Object.entries(PORT_STAFF_ROLES).map(([k,v])=>v.name.toUpperCase()+(portStaffRating(k)?'':' [VACANT]')).concat(['PET STORE','RETURN TO SEAPORT']));}
function r5Docks(){stage='port55Docks';const q=port55State();add('SEAPORT — HARBOR DOCKS','place');if(q.freed){add('The boat rocks against the liberated quay.','system');r5DirectChoices([...(player.flags.port55PendingRewards?.length?['CLAIM PENDING REWARD']:[]),'RETURN TO SEAPORT']);}else if(q.stage==='free'){add('The defeated enforcers are gone. Two survivors wait behind the chained gate. Winning the fight did not free them.','bright');r5DirectChoices(['FREE THE SURVIVORS','BACK AWAY']);}else r5DirectChoices([q.stage==='confront'?'CONFRONT FISHERMEN':'INSPECT FISHERMEN','RETURN TO SEAPORT']);}
portLiberationVictory=function(){port55State().stage='free';stage='port55Docks';v49Autosave();r5Docks();};
portLiberationRetreat=function(){stage='port55Docks';add('You retreat to cover. The fishermen still hold the gate.','system');r5Docks();};
const r5OldFree=port55Free;port55Free=function(){const q=port55State();if(q.stage!=='free')return false;r5OldFree();q.stage='done';stage='seaport';portStaffSave();return true;};
// Patrol never strands a needed NPC behind a removed menu.
PORT55_PATROL.splice(0,PORT55_PATROL.length,'Town Streets','Town Streets','Market Area','Docks');
port55StopMenu=function(){port55Submenu('Town Streets',['FIND KAIDEN','RETURN TO HARBOR']);add('Kaiden is patrolling '+port55PatrolName()+'. Find him to discuss the town.','system');};
const r5OldPortCommand=port55Command;
port55Command=function(cmd){const q=port55State();
 if(stage==='port55Pets')return r5OldPortCommand(cmd);
 if(stage==='port55Stop'&&q.freed&&['find kaiden','talk kaiden','small talk kaiden'].includes(cmd)){player.flags.port55CurrentStop=port55PatrolName();stage='port55Kaiden';port55Submenu('Kaiden — '+port55PatrolName(),['SMALL TALK','RETURN TO HARBOR']);return true;}
 const portStages=['seaport','port55Market','port55Docks','port55Stop','port55Kaiden','port55Mia','port55Vendor','portMarket','portClinic','portDocks','portWatch'];if(!portStages.includes(stage))return false;
 if(/^(?:save|load)(?: |$)/.test(cmd))return false;
 if(!q.freed){
  if(stage!=='seaport'&&stage!=='port55Docks'){stage='seaport';port55Menu();return true;}
  if(stage==='seaport'){if(['harbor docks','docks'].includes(cmd))r5Docks();else if(['return west','west','back','b','leave'].includes(cmd))portMove(-1);else port55Menu();return true;}
  if(['inspect fishermen','investigate fishermen'].includes(cmd)&&q.stage==='investigate'){q.stage='confront';add('The fishermen collect tribute for the New Dominion. Survivors are chained behind their armed watch.','bright');v49Autosave();r5Docks();return true;}
  if(cmd==='confront fishermen'&&q.stage==='confront'){startCombat({name:'FISHERMEN ENFORCERS',level:9,hp:125,min:13,max:21,xp:180,bolts:38,end:'The last armed fisherman drops his weapon.'},'seaportLiberation');return true;}
  if(['free the survivors','free residents','free captives','break chains'].includes(cmd)&&q.stage==='free'){port55Free();port55Menu();return true;}
  if(['back away','back','b','return to seaport','return to harbor'].includes(cmd)){stage='seaport';port55Menu();return true;}r5Docks();return true;
 }
 if(stage==='port55Market'){
  const role=Object.keys(PORT_STAFF_ROLES).find(k=>cmd===k||cmd===k+' [vacant]');if(role)return portStaffOpen(role);
  if(cmd==='pet store'){stage='port55Vendor';port55Vendor();return true;}
  if(['return to seaport','back','b','return to harbor'].includes(cmd)){stage='seaport';port55Menu();return true;}r5Market();return true;
 }
 if(stage==='port55Vendor'){if(['return to market','return to harbor','back','b','exit'].includes(cmd)){r5Market();return true;}return r5OldPortCommand(cmd);}
 if(stage==='port55Docks'){if(cmd==='claim pending reward'){port55Claim();r5Docks();return true;}if(['back','b','back away','return to seaport','return to harbor'].includes(cmd)){stage='seaport';port55Menu();return true;}r5Docks();return true;}
 if(stage==='seaport'){
  if(['town streets','market area','harbor docks','rusty anchor','the rusty anchor'].includes(cmd)){
   if(cmd==='market area')r5Market();else if(cmd==='harbor docks')r5Docks();else if(cmd.includes('anchor')){stage='port55Mia';port55MiaMenu();}else{stage='port55Stop';player.flags.port55CurrentStop='Town Streets';port55StopMenu();}return true;
  }
  if(['return west','west','back','b','leave'].includes(cmd)){portMove(-1);return true;}
  port55Menu();return true;
 }
 return r5OldPortCommand(cmd);
};
const r5OldRecruitCommand=portRecruitCommand;portRecruitCommand=function(cmd){if(stage==='port55Service'&&player.flags.portStaffUI?.role==='workshop'&&cmd==='tomorrow project terminal'&&portRecruitUnlocked()){r5FinishTerminal();return true;}return r5OldRecruitCommand(cmd);};
port55CompleteChapter=function(){return false;}; // Completion belongs to the Workshop terminal now.
function r5FinishTerminal(){if(!portRecruitUnlocked())return false;const f=player.flags;add('TOMORROW PROJECT — SEAPORT TRANSMITTER','place');add('Seaport is transmitting again… You gave these people a tomorrow.','bright');if(!f.chapterOneComplete){f.chapterOneComplete=true;f.r5TerminalDone=true;f.r5CreditsSeen=true;stage='seaport';portStaffSave();add('MAIN QUEST COMPLETE — THE ROAD TO SEAPORT','reward');outputQueue=outputQueue.then(()=>{r5StartCredits(false);});}else{add('Transmissions are stable. No new reward.','system');portStaffRender();}return true;}
const r5OldResume=port55Resume;port55Resume=function(){if(stage==='port55Market')return r5Market();if(stage==='port55Docks')return r5Docks();if(!portRecruitUnlocked()&&['port55Vendor','port55Mia','port55Stop','port55Kaiden'].includes(stage)){stage='seaport';return port55Menu();}return r5OldResume();};
// R5 art pass: distinct ANSI-inspired scenes, level 5+, no gameplay state changes.
// Artwork is text-only, capped at 39 columns; line colors are decorative only.
let r5LastScene='';
const R5_ART={
 factory:[
 ['sky','        .  .     .   .'],
 ['smoke','       ( )( )  ( ) ( )'],
 ['metal','        || ||    || ||'],
 ['metal','   _____||_||____||_||_____'],
 ['gold','  / [] THE OLD FACTORY []     \\'],
 ['metal',' /____________________________\\'],
 ['metal',' | []  []  []  []  []  []     |'],
 ['red',' |    ! DANGER - KEEP OUT !  |'],
 ['metal',' |____    ____________   ____|'],
 ['metal','     |__|            |__|'],
 ['ground','  _/___\\_  _/___\\_  _/___\\_']
 ],
 seaport:[
 ['sky','       *        .        *'],
 ['gold','          |\\        |'],
 ['metal','       ___|_\\_______|____'],
 ['metal','      /    WRECKED HULL    \\'],
 ['rust','  ___/___[]____[]____[]_____\\_'],
 ['rust','  \\___________________________/'],
 ['water',' ~~~\\~~~~~~~~~~~~~~~~~~~~~/~~~'],
 ['water',' ~~  \\___/~~~~~~\\___/  ~~~~~'],
 ['rust','  ||       HARBOR DOCKS    ||'],
 ['rust',' =||=======================||='],
 ['water',' ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~']
 ],
 road:[
 ['sky','   .       .             .'],
 ['rust','      __                  /\\'],
 ['rust','  ___/  \\___     _       /  \\'],
 ['metal',' /  _  X  _ \\___/ \\___ / /\\ \\'],
 ['metal',' |_/ \\___/ \\___  ____|/    \\|'],
 ['gold','        ROUTE 127'],
 ['ground',' ------  .   | |   .  ------'],
 ['ground','   _  _     | |    __   _'],
 ['ground',' _/ \\/ \\____| |___/  \\_/ \\_']
 ],
 boss:[
 ['red','       .-=========-.'],
 ['metal','      /  [#######]  \\'],
 ['gold','     |  (o)   (o)   |'],
 ['red','     |     /_\\      |'],
 ['metal','    /|  __________  |\\'],
 ['metal','   / | /|  XXXX  |\\ | \\'],
 ['rust','  /__|/ |________| \\|__\\'],
 ['metal','      ||  || ||  ||'],
 ['metal','      ||__|| ||__||'],
 ['ground','     _/___\\_ _/___\\_'],
 ['red','    >>>  FOREMAN  <<<']
 ],
 solace:[
 ['sky','             .    *'],
 ['gold','       ___ SOLACE ___'],
 ['rust','    __|  _      _  |__'],
 ['metal','   |  | |_| [] |_| |  |'],
 ['rust','   |__|____    ____|__|'],
 ['gold','   |  [ JENS BAR ]    |'],
 ['metal','   |  ____    ____    |'],
 ['metal','  _|_|    |__|    |___|_'],
 ['ground','   /  \\  /  \\  /  \\'],
 ['ground',' __/____\\/____\\/____\\__']
 ]
};
function r5Scene(key){
 if(player.level<5||r5LastScene===key)return;
 r5LastScene=key;
 const rows=R5_ART[key]||R5_ART.road;
 outputQueue=outputQueue.then(()=>{
  rows.forEach(([tone,content],i)=>addImmediate(content,'system casino-art r5-scene-row r5-tone-'+tone+(i===0?' r5-scene-first':'')+(i===rows.length-1?' r5-scene-last':'')));
  followOutput();
 });
}
const r5OldEncounter=showEncounter;showEncounter=function(){r5LastScene='';r5Scene('road');return r5OldEncounter();};
const r5OldBoss=factoryBossStart;factoryBossStart=function(){r5LastScene='';r5Scene('boss');return r5OldBoss();};
const r5OldMercy=mercyMenu;mercyMenu=function(){r5Scene('solace');return r5OldMercy();};
STEVE_NEWS[0].title='CASINO GAMES — DICE / RPS / BLACKJACK / SLOTS (LV5+) / RAT RACING (SEAPORT)';
STEVE_NEWS[0].message='CRAZY STEVE > Dice! Rock-paper-scissors! Blackjack! Level five gets slots! Rat racing is at Seaport’s Rusty Anchor. Read the sign; I paid for every letter!';
STEVE_NEWS[0].board=['    o','   /|\\','+----------------------------+','| DICE / RPS / BLACKJACK      |','| SLOTS: LV5+                |','| RAT RACING: SEAPORT        |','+----------------------------+','   / \\     NO REFUNDS'];
// Alternate road approaches use existing items/combat and resolve once per encounter.
function r18StartCinderWolves(){
 const level=Math.max(1,Math.min(50,Number(player.level)||1)),hp=Math.max(15,Math.floor(baseHpForLevel(level)*.16));
 const enemies=[{name:'ALPHA WOLF',hp:Math.ceil(hp*1.2),bolts:0,r18Min:3,r18Max:6},{name:'SCAVENGER WOLF',hp:Math.ceil(hp*.9),bolts:0,r18Min:2,r18Max:4},{name:'GNAWER WOLF',hp:Math.ceil(hp*.9),bolts:0,r18Min:2,r18Max:4}];
 startCombat({name:'CINDER WOLF PACK',level,hp:enemies.reduce((sum,e)=>sum+e.hp,0),min:4,max:8,xp:Math.max(30,level*9),bolts:0,r18WolfPack:true,r18NoRetreat:true,enemies,end:'The surviving wolves scatter into the trees.'},'encounter');
}
function r18HarvestSalvage(){
 const g=typeof lanternState==='function'?lanternState():null,scene=g?.sceneId||`${day}:${dailyRoadTurns}:${roadGoal}:${roadTurn}`;
 if(player.flags.r18HarvestSalvageScene===scene){add('This machine has already been salvaged.','system');return false;}
 r18RetainRoadReward('Scrap Metal','material');player.flags.r18HarvestSalvageScene=scene;add('You recover Scrap Metal from the disabled combine.','reward');return true;
}
function r18ChoirSalvage(){
 const g=typeof lanternState==='function'?lanternState():null,scene=g?.sceneId||`${day}:${dailyRoadTurns}:${roadGoal}:${roadTurn}`;
 if(player.flags.r18ChoirStashScene===scene){add('This patrol stash has already been searched.','system');return false;}
 r18RetainRoadReward('Wire','material');player.flags.r18ChoirStashScene=scene;add('The raiders’ stash holds usable Wire.','reward');return true;
}
function r18WardenScene(){
 const g=typeof lanternState==='function'?lanternState():null,scene=g?.sceneId||`${day}:${dailyRoadTurns}:${roadGoal}:${roadTurn}`,f=player.flags;
 if(f.r18WardenScene?.scene!==scene){f.r18WardenSerial=(Number(f.r18WardenSerial)||0)+1;f.r18WardenScene={scene,id:f.r18WardenSerial};}return f.r18WardenScene;
}
function r18WaxAward(stolen=false){
 if(player.flags.r18WaxArmorClaimed){add('The soldier’s armor has already been taken.','system');return false;}
 const level=Math.max(1,Math.min(50,Number(player.level)||1)),pool=EQUIPMENT_CATALOG.filter(x=>x.type==='armor'&&x.rarity==='rare'&&level>=x.minLevel&&level<=x.maxLevel&&!GEAR[x.name]?.questOnly);
 if(!pool.length){add('The armor could not be recovered.','system');return false;}
 const name=catalogInstanceName(pool[Math.floor(Math.random()*pool.length)],level);if(!GEAR[name])return false;if(stolen)r18StolenReward(name,'armor');else r18RetainRoadReward(name,'armor');player.flags.r18WaxArmorClaimed=true;add('You recover the soldier’s Rare armor.','rare');return true;
}
function r18WaxFight(){const level=Math.max(1,Math.min(50,Number(player.level)||1));startCombat({name:'THE CURATOR',level,hp:Math.max(28,Math.floor(baseHpForLevel(level)*.34)),min:3,max:7,xp:Math.max(24,level*7),bolts:8,r18WaxCurator:true,end:'The Curator falls among the exhibits.'},'encounter');}
function r18FreeSaltWorkers(awardXp=true){
 if(player.flags.r18SaltWorkersFreed)return false;player.flags.r18SaltWorkersFreed=true;if(awardXp)gainXp(Math.max(12,player.level*3));add('The workers are free. Gideon thanks you and says they will seek a safer road to Solace.','reward');return true;
}
function r18RoadEaterSalvage(){const g=typeof lanternState==='function'?lanternState():null,scene=g?.sceneId||`${day}:${dailyRoadTurns}:${roadGoal}:${roadTurn}`;if(player.flags.r18RoadEaterSalvageScene===scene){add('This machine has already been salvaged.','system');return false;}r18RetainRoadReward('Scrap Metal','material');player.flags.r18RoadEaterSalvageScene=scene;add('You recover Scrap Metal from the disabled tunneling machine.','reward');return true;}
function r18BlackSnowCoins(qty){
 if(player.flags.r18BlackSnowResolved)return false;if(!addPack('Pre-War Silver Coin','valuable',qty)){(player.flags.r5LootQueue||(player.flags.r5LootQueue=[])).push({name:'Pre-War Silver Coin',type:'valuable',qty});add('The coins await a backpack decision.','system');}player.flags.r18BlackSnowResolved=true;add('You receive '+qty+' Pre-War Silver Coin'+(qty===1?'':'s')+'.','reward');return true;
}
function r18BlackSnowFight(){const level=Math.max(1,Math.min(50,Number(player.level)||1));startCombat({name:'WOUNDED SCAVENGER',level,hp:Math.max(18,Math.floor(baseHpForLevel(level)*.22)),min:2,max:5,xp:Math.max(18,level*5),bolts:0,r18BlackSnow:true,end:'The scavenger falls beside the shed.'},'encounter');}
function r18SilasChest(){if(player.flags.r18SilasChestClaimed){add('The gear chest has already been opened.','system');return true;}const level=Math.max(1,Math.min(50,Number(player.level)||1)),pool=EQUIPMENT_CATALOG.filter(x=>['weapon','armor'].includes(x.type)&&x.rarity==='uncommon'&&level>=x.minLevel&&level<=x.maxLevel&&!GEAR[x.name]?.questOnly);if(!pool.length){add('The chest cannot be opened yet.','system');return false;}const def=pool[Math.floor(Math.random()*pool.length)],name=catalogInstanceName(def,level);if(!GEAR[name])return false;r18RetainRoadReward(name,def.type);player.flags.r18SilasChestClaimed=true;add('You recover Uncommon equipment from the chest.','reward');return true;}
function r18PowderAward(withComponents){const f=player.flags;if(CRAFT_RECIPES.mineTent&&!f.r11Learned?.mineTent){(f.r11Learned||(f.r11Learned={})).mineTent=true;add('BLUEPRINT LEARNED — MINE-PROTECTED TENT','reward');}if(withComponents){const g=typeof lanternState==='function'?lanternState():null,scene=g?.sceneId||`${day}:${dailyRoadTurns}:${roadGoal}:${roadTurn}`;if(f.r18PowderPartsScene!==scene){f.r18PowderPartsScene=scene;r18RetainRoadReward('Explosive Components','material');add('You recover usable explosive components.','reward');}}}
const {R5_ROAD_REWORK, r18HorseEncounter, r18HorseScene} = RoadScenarioRegistry.rework();
// A combat initiated by an alternative must not be followed by TURN COMPLETE.
const r5OldResolveEncounter=resolveEncounter;
resolveEncounter=function(cmd){const e=currentEncounter(),row=R5_ROAD_REWORK[e.title]||R5_DISCOVERIES[e.title];if(!row)return r5OldResolveEncounter(cmd);const done=player.encounterDone[roadTurn]||(player.encounterDone[roadTurn]=new Set());if(done.has(e.title)){add('This encounter has already been resolved.','system');return;}resultBuffer=[];const resolved=e.resolve(cmd);flushResults();if(!resolved){add(encounterChoices(e),'system');return;}if(['r18Tournament','r18Recycle'].includes(stage))return;if(e.title==='THE RAIN BARREL'&&cmd==='repair irrigation'&&player.flags.r18GreenhouseRepaired){r5DirectChoices(encounterChoices(e).split(/\s{2,}/).filter(Boolean));return;}if(e.title==='THE DUST HORSES'&&r18HorseScene().phase==='offer'){r5DirectChoices(encounterChoices(e).split(/\s{2,}/).filter(Boolean));return;}done.add(e.title);if(stage!=='combat'&&stage!=='fallen')completeRoadTurn();};
// Optional overlay: save state precedes opening; replay is presentation-only.
let r5Credits=null;
const R5_CREDITS=[['ROUTE 127','THE BEGINNING'],['A LAST LANTERN WORKSHOP','PRODUCTION'],['GAME DIRECTOR','SYN'],['LEAD DEVELOPER','FORGE'],['HEAD OF HUMAN RESOURCES','LUNA'],['DIRECTOR OF QUESTIONABLE DECISIONS','SYN'],['CHIEF BUG MANUFACTURER','FORGE'],['DIRECTOR OF BUG COMPLAINTS','LUNA'],['EXECUTIVE DIRECTOR OF MORE FEATURES','SYN'],['EMPLOYEE MOST LIKELY TO NEED A RESTART','FORGE'],['EMPLOYEE OF THE MONTH (SELF-APPOINTED)','LUNA'],['ENTIRE ACCOUNTING DEPARTMENT','SYN'],['UNPAID INTERN','FORGE'],['OFFICE MORALE','CHEESEBURGER'],['SPECIAL THANKS TO EVERYONE WHO BELIEVED','THREE IDIOTS COULD BUILD A WASTELAND.']];
const R5_THANKS="THANK YOU FOR PLAYING THE ROUTE 127 DEMO!\nTHE ROAD DOESN'T END HERE.\nSeaport has been liberated, and there's still more to explore.\nRecruit survivors, rebuild your town, and explore the wasteland.\nMore adventures are coming.\nPRESS ANY KEY / TAP TO CONTINUE";
function r5CloseCredits(){if(!r5Credits)return;clearTimeout(r5Credits.timer);r5Credits.el.remove();r5Credits=null;input.disabled=false;input.focus();}
function r5CreditsThanks(){if(!r5Credits||r5Credits.final)return;clearTimeout(r5Credits.timer);r5Credits.final=true;r5Credits.el.classList.add('r5-final');r5Credits.el.textContent='';const message=document.createElement('p');message.className='r5-thanks';message.textContent=R5_THANKS;const button=document.createElement('button');button.textContent='CONTINUE EXPLORING';button.addEventListener('click',()=>{r5CloseCredits();renderCurrentChoices();});r5Credits.el.appendChild(message);r5Credits.el.appendChild(button);button.focus();}
function r5StartCredits(replay=true){if(!player.flags.chapterOneComplete||r5Credits)return false;const el=document.createElement('section');el.className='r5-credits';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Route 127 end credits');const scroll=document.createElement('div');scroll.className='r5-credit-roll';for(const [title,name] of R5_CREDITS){const row=document.createElement('p'),role=document.createElement('span'),staff=document.createElement('strong');role.textContent=title;staff.textContent=name;row.appendChild(role);row.appendChild(staff);scroll.appendChild(row);}el.appendChild(scroll);
 for(let i=0;i<2;i++){const burger=document.createElement('pre');burger.className='r5-burger r5-run'+i;burger.setAttribute('aria-hidden','true');burger.textContent='  .---.\n (=====)\n  `---\'\n   / \\';el.appendChild(burger);}
 const skip=document.createElement('button');skip.className='r5-skip';skip.textContent='SKIP CREDITS / CONTINUE';skip.addEventListener('click',r5CreditsThanks);el.appendChild(skip);el.addEventListener('click',e=>{if(e.target===el||e.target===scroll){if(r5Credits?.final){r5CloseCredits();renderCurrentChoices();}else r5CreditsThanks();}});document.body.appendChild(el);r5Credits={el,final:false,timer:setTimeout(r5CreditsThanks,20000),started:Date.now(),replay};skip.focus();return true;}
if(document.addEventListener){document.addEventListener('keydown',e=>{if(!r5Credits)return;e.preventDefault();e.stopImmediatePropagation();if(r5Credits.final){r5CloseCredits();renderCurrentChoices();}else r5CreditsThanks();},true);document.addEventListener('visibilitychange',()=>{if(r5Credits&&Date.now()-r5Credits.started>=20000)r5CreditsThanks();});}
// Integrate explicit transient contexts without replacing legacy command routing.
const r5OldRender=renderCurrentChoices;renderCurrentChoices=function(){if(stage==='r5Loot')return r5LootMenu();if(stage==='factoryRusty')return r5RustyMenu();if(stage==='port55Market')return r5Market();return r5OldRender();};
function r5Mapped(raw){let c=String(raw).trim().toLowerCase();return /^\d+$/.test(c)?numberedChoices[c]||c:c.length===1?currentHotkeys[c]||c:c;}
const r5OldCore=handleCommandCore;handleCommandCore=async function(raw){
 if(busy)return;let cmd=r5Mapped(raw);r5Migrate();
 if(r5Credits){if(r5Credits.final)r5CloseCredits();else r5CreditsThanks();return;}
 if(QA_BUILD&&['testing','testing access'].includes(cmd)){player.flags.testingReturnStage=stage;stage='testingCode';add('DEVELOPMENT QA ACCESS — ENTER ACCESS CODE','place');currentHotkeys={b:'back'};numberedChoices={};return;}
 if(cmd==='credits'){if(!r5StartCredits(true))add('Credits unlock after the Seaport Workshop terminal completes Chapter One.','system');return;}
 if(stage==='r5Loot'&&!/^(save|load)(?: |$)/.test(cmd)){r5LootCommand(cmd);return;}
 if(stage==='factoryRusty'&&!/^(save|load)(?: |$)/.test(cmd)){r5RustyCommand(cmd);return;}
 if(stage==='factoryForge'&&['check dynamite','collect charge','talk to forge'].includes(cmd)){v49Forge();return;}
 if(stage==='factoryWorkshop'&&cmd==='rusty'){r5RustyMenu();return;}
 if(stage==='factoryBench'&&player.flags.v49RecipeBandage&&!/^(save|load|inventory|status|map|quests)(?: |$)/.test(cmd)){r5FactoryCraft(cmd);return;}
 if(stage==='quests'&&['active quests','completed quests'].includes(cmd)){player.flags.r5JournalPage=cmd.startsWith('active')?'active':'completed';showQuests();return;}
 if(stage==='quests'&&['back','b'].includes(cmd)){delete player.flags.r5JournalPage;stage=returnStage||'between';renderCurrentChoices();return;}
 // New market is not part of the old parser's port stage allowlist.
 if(stage==='port55Market'&&!['inventory','status','map','quests','i','s','m','q','v','save current'].includes(cmd)&&!/^(save|load)(?: |$)/.test(cmd)){port55Command(cmd);return;}
 await r5OldCore(raw);
};
const r5OldCommand=handleCommand;handleCommand=async function(raw){await r5OldCommand(raw);r5Migrate();updateHud();if(!busy&&!r5Credits&&player.flags.r5LootQueue?.length&&stage!=='r5Loot'&&!['title','fallen','handle','testingCode'].includes(stage)){r5LootMenu();await outputQueue;}if(!['title','wake','standing','handle','confirmHandle','testingCode'].includes(stage))v49Autosave();};
// Complete East Road discovery pass: every previously fixed-injury vignette gets
// a low-risk observation or material-dependent approach as well as its risk path.
const {R5_DISCOVERIES, r18ScrapDuel, r18MaskMarket, r18Oil, r18Chapel, r18Armory, r18Furnace, r18Quicksand, r18ScrapDuelScene, r18ScrapDuelMenu, r18MaskMarketScene, r18MaskMarketPrice, r18OilRescue, r18ChapelScene, r18ChapelSpendAir, r18ChapelReward, r18ArmoryReward, r18FurnaceScene} = RoadScenarioRegistry.discoveries();
const r5OldRetrieve=v48Retrieve;v48Retrieve=function(name){r5Capacity();if(packSlotsUsed()>player.packMax){add('OVER CAPACITY — nothing withdrawn. Sell or store excess first.','danger');return false;}return r5OldRetrieve(name);};
const r5OldHouseTransfer=transferHouseItem;transferHouseItem=function(name,deposit){r5Capacity();if(!deposit&&packSlotsUsed()>player.packMax){add('OVER CAPACITY — nothing withdrawn. Sell or store excess first.','danger');return false;}return r5OldHouseTransfer(name,deposit);};
