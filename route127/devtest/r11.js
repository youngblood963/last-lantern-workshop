// R11 scoped playtest fixes. Persistent additions live in existing player.flags.
const R11_DRINKS={e:['BEER',3,5],beer:['BEER',3,5],o:['SHOT',5,10],shot:['SHOT',5,10],h:['HOUSE SPECIAL',8,15],'house special':['HOUSE SPECIAL',8,15]};
const R11_BOARD="Crazy Steve's Sandwich Board";
const R11_TIMES={common:30,uncommon:120,rare:1800,epic:28800,legendary:43200};
const R11_ALIASES={'Reinforced Belt':'Worn Belt','Rusted Dog Tags':'Reinforced Dog Tags','Scrap Dog':'Rust Hound','Reinforced Combat Machete':'Tempered Combat Machete','Refurbished Service Revolver':'Specialized Service Revolver','Reinforced Relay Vest':'Advanced Relay Vest','Reinforced Leather Armor':'Tempered Leather Armor'};
Object.assign(VENDOR_BASE,{"Niko's Lucky Vest":10,"Chemist's Injector":320});
Object.assign(GEAR["Niko's Lucky Vest"],{rarity:'epic',def:10,questOnly:true});
Object.assign(GEAR["Chemist's Injector"],{rarity:'rare',min:20,max:27,questOnly:true});
for(const row of FACTORY_BOSS_LOOT)for(const item of row)GEAR[item.name].questOnly=true;
Object.assign(GEAR,{
 [R11_BOARD]:{rarity:'legendary',type:'armor',def:15,maxHpBonus:20,questOnly:true,description:'A battered wooden sandwich board covered in warnings about pink elephants. Nobody knows why it works. Least of all Steve.'},
 'Reinforced Salvage Maul':{rarity:'uncommon',type:'weapon',min:11,max:18,questOnly:true},
 'Modified Rotary Cutter':{rarity:'uncommon',type:'weapon',min:12,max:19,questOnly:true},
 'Modified Chemical Sprayer':{rarity:'uncommon',type:'weapon',min:12,max:20,questOnly:true},
 'Advanced Foreman Hammer':{rarity:'rare',type:'weapon',min:20,max:28,questOnly:true},
 'Lantern Keeper’s Coat':{rarity:'epic',type:'armor',def:10},
 'Uncommon Electrical Parts':{rarity:'uncommon',type:'material'}
});
PORT55_PETS['Rust Hound'].rarity='uncommon';PORT55_PETS.Ferret.rarity='rare';PORT55_PETS['Pack Mule'].rarity='epic';
function r11PetRarity(name){return PORT55_PETS[name]?.rarity||(name==='Cheeseburger'?'legendary':'system');}
const R11_LEVELS={Hollis:2,June:2,Ash:2,Moss:3,Vera:3,Lark:3,Rook:4,Kettle:4,Bram:4,Deke:5,Patch:5,Tess:5,Flint:6,Sable:6,Cricket:6,Rowan:7,Harlow:7,Bolt:7,Crowley:8,Mercer:8,Finch:8,Vale:9,Bishop:9,Wren:9,Cutter:10};
wanderers.forEach(w=>w.level=R11_LEVELS[w.name]||w.level);
function r11Migrate(){
 const f=player.flags||(player.flags={});
 const name=n=>R11_ALIASES[n]||n;
 const seen=new WeakSet();function migrateTree(obj){if(!obj||typeof obj!=='object'||seen.has(obj))return;seen.add(obj);for(const k of Object.keys(obj)){if(typeof obj[k]==='string')obj[k]=name(obj[k]);else migrateTree(obj[k]);}}migrateTree(player);
 for(const key of ['weapon','armor','accessory'])player[key]=name(player[key]);
 for(const arr of [player.pack,player.stash,player.houseStorage,player.rustyRoomChest,f.r6AnchorRoomChest,f.r5LootQueue,f.port55PendingRewards])for(const item of arr||[])if(item&&typeof item==='object')item.name=name(item.name);
 for(const key of ['ownedPets'])if(Array.isArray(f[key]))f[key]=[...new Set(f[key].map(name))];f.equippedPet=name(f.equippedPet);
 for(const w of wanderers){const st=ws(w.name);if(st.profile){st.profile.level=R11_LEVELS[w.name];st.profile.weapon=name(st.profile.weapon);st.profile.armor=name(st.profile.armor);}if(st.inventory)for(const i of st.inventory.items||[])i.name=name(i.name);}
 if(!f.r11Learned){f.r11Learned={};if(f.v49RecipeBandage){f.r11Learned.bandage=true;f.r11Learned.pipe=true;if(player.level>=6)f.r11Learned.ironReaper=true;}}
 // R10 pets already persist in flags. Do not grant unsaved past purchases.
 if(!f.r11Migrated){r11CasinoBaseline();f.r11Migrated=true;}
 r11ValidateBoard();
}
let r11Silent=0;
function r11Quiet(fn){r11Silent++;try{return fn();}finally{r11Silent--;}}
const r11Add=add;add=function(text='',cls=''){if(r11Silent&&(/^(?:SAVE [123] —|Game saved\.|UNSAVED GAME)/.test(String(text))))return;return r11Add(text,cls);};
const r11Save=saveGame;saveGame=function(slot){r11Migrate();r11TouchLegendary();return r11Save(slot);};
const r11Auto=v49Autosave;v49Autosave=function(){r11TouchLegendary();return r11Auto();};
const r11Load=loadGame;loadGame=function(slot){const seq=getSaveData(slot)?.player?.flags?.r11CasinoSeq||0;const out=r11Load(slot);r11Migrate();const ledger=r11ReadCasinoLedger();if(ledger&&ledger.seq>seq){r11RestoreCasinoLedger(true);updateHud();if(stage==='r6Casino')r6CasinoRender();}return out;};
casinoCheckpoint=function(){r11CasinoCommit();r11Quiet(()=>{if(activeSaveSlot)saveGame(activeSaveSlot);});};
r6CasinoSave=function(){r11CasinoCommit();r6WriteLedger();updateHud();r11Quiet(()=>{v49Autosave();if(activeSaveSlot)saveGame(activeSaveSlot);});};
// Existing anti-replay casino ledgers stay authoritative; only confirmation output changes.
const r11Evolution=applyLevelEvolution;
applyLevelEvolution=function(div,text,cls=''){
 if(/r5-tone-|r11-card|r11-die/.test(cls))return;
 r11Evolution(div,text,cls);
 if(player.level<5)return;
 const gear=Object.keys(GEAR).some(n=>String(text).toUpperCase().includes(n.toUpperCase()));
 if(gear)return;
 const pet=Object.keys(PORT55_PETS).find(n=>String(text).includes(n));if(pet){const start=String(text).indexOf(pet);colorField(div,String(text),'rarity-'+r11PetRarity(pet),1,start,start+pet.length);}
};
// Common/Uncommon gear uses the existing protected transaction, immediately for one item.
const r11SaleStart=v53SaleStart;
v53SaleStart=function(name,merchant=null){
 const clean=String(name).replace(/\s+[×x]\d+$/i,'').trim(),item=player.pack.find(i=>i.name.toLowerCase()===clean.toLowerCase());
 const cheap=item&&['weapon','armor'].includes(item.type)&&['common','uncommon'].includes(GEAR[item.name]?.rarity);
 if(!cheap)return r11SaleStart(name,merchant);
 const unit=v48SellPrice(item);if(!unit)return r11SaleStart(name,merchant);
 player.flags.v53Sale={name:item.name,type:item.type,available:item.qty,unit,qty:1,merchant,location:mercyLocation,mode:'confirm'};
 return v53SaleCommand('confirm sale');
};
const r11Store=portStaffServiceCommand;
portStaffServiceCommand=function(cmd){
 const ui=player.flags.portStaffUI;
 if(portRecruitUnlocked()&&ui?.role==='general store'&&portStaffRating('general store')&&cmd.startsWith('sell ')){
  const item=player.pack.find(i=>i.name.toLowerCase()===cmd.slice(5));
  if(item&&['weapon','armor'].includes(item.type)&&['common','uncommon'].includes(GEAR[item.name]?.rarity)&&v48SellPrice(item)>0){ui.item=item.name;ui.price=portStoreSellPrice(item);ui.page='saleConfirm';return r11Store('confirm store sale');}
 }
 if(portRecruitUnlocked()&&ui?.role==='workshop'&&cmd==='crafting'){r11CraftMenu('seaport');return true;}
 if(ui?.role==='workshop'&&cmd.startsWith('craft ')){r11CraftMenu('seaport');r11CraftCommand(cmd);return true;}
 return r11Store(cmd);
};
// Exactly one first-clear equipment reward; higher rarity replaces the base item.
factoryAwardBossWeapon=function(floor){
 const f=factoryState();f.weaponAwards??={};if(Object.hasOwn(f.weaponAwards,floor))return;
 const high=Math.random()<(floor===3?.10:.20);
 const names=[['Reinforced Salvage Maul',"King's Breaker"],['Modified Rotary Cutter',"Grinder's Cutter"],['Modified Chemical Sprayer',"Chemist's Injector"],['Advanced Foreman Hammer',"Foreman's Verdict"]];
 const name=names[floor][high?1:0];f.weaponAwards[floor]=name;
 if(!addPack(name,'weapon',1,true)){(player.stash||(player.stash=[])).push({name,type:'weapon',qty:1});add('Boss equipment secured in bank storage; pack full.','system');}
 add('FIRST-CLEAR EQUIPMENT — '+gearLabel(name),GEAR[name].rarity);r11Blueprint('boss');r11Quiet(()=>v49Autosave());
};
// Crafting uses absolute deadlines; existing jobs retain their original deadline/result.
Object.assign(R6_TIMES,R11_TIMES);
Object.assign(CRAFT_RECIPES,{
 reinforcedPipe:{name:'Reinforced Pipe',cloth:1,scrap:4,wire:1,bolts:30,type:'weapon',chance:.90},
 keeperCoat:{name:'Lantern Keeper’s Coat',cloth:8,scrap:6,wire:4,parts:1,bolts:150,type:'armor',chance:.90,minLevel:8}
});
for(const recipe of Object.values(CRAFT_RECIPES))recipe.seconds=R11_TIMES[GEAR[recipe.name]?.rarity||'common'];
function r11Learned(key){r11Migrate();return !!player.flags.r11Learned[key]||(player.flags.v49RecipeBandage&&['bandage','pipe'].includes(key));}
function r11Blueprint(source){
 const rates={combat:.02,exploration:.015,salvage:.025,boss:.10};
 if(!rates[source]||Math.random()>=rates[source])return false;
 const pool=['reinforcedPipe','ironReaper','keeperCoat'].filter(k=>!r11Learned(k));if(!pool.length)return false;
 const key=pool[Math.floor(Math.random()*pool.length)];player.flags.r11Learned[key]=true;add('BLUEPRINT LEARNED — '+CRAFT_RECIPES[key].name,'reward');return true;
}
const r11Drop=v555AwardEquipmentDrop;v555AwardEquipmentDrop=function(){r11Drop();r11Blueprint('combat');};
const r11Resolve=resolveEncounter;resolveEncounter=function(cmd){
 const oldStage=stage,title=currentEncounter()?.title,oldDone=player.encounterDone?.[roadTurn];
 r11Resolve(cmd);
 if(oldStage==='encounter'&&['turnComplete','r6Road'].includes(stage)&&!/^move on|^back away|^leave/.test(cmd)){
  const key=title+'|'+roadGoal+'|'+roadTurn+'|'+(r6Road()?.serial||0);
  if(player.flags.r11LastBlueprintScene!==key){player.flags.r11LastBlueprintScene=key;r11Blueprint(player.flags.r10LastRoadCategory==='salvage'?'salvage':'exploration');}
 }
};
function r11CraftMenu(where=player.flags.r11Bench||'murphy'){
 if(where==='seaport'&&(!portRecruitUnlocked()||!portStaffRating('workshop')))return;
 player.flags.r11Bench=where;stage='r11Craft';add((where==='seaport'?'SEAPORT WORKSHOP':where==='forge'?"FORGE'S WORKBENCH":"MURPHY'S WORKBENCH")+' — CRAFTING','place');
 const job=player.flags.v49MurphyJob;
 if(job){add(CRAFT_RECIPES[job.key].name+' — '+(Date.now()>=job.endsAt?'READY TO COLLECT':Math.ceil((job.endsAt-Date.now())/1000)+' seconds remaining'),'system');r5DirectChoices(['COLLECT CRAFT','BACK']);return;}
 if(!player.flags.v49RecipeBandage){add('Learn introductory crafting from Forge before using found blueprints.','system');r5DirectChoices(['BACK']);return;}
 const keys=Object.keys(CRAFT_RECIPES).filter(k=>r11Learned(k));
 for(const k of keys){const r=CRAFT_RECIPES[k];add(`${r.name} — ${r.seconds}s — ${Math.round(r.chance*100)}% — ${r.cloth||0} Cloth, ${r.scrap||0} Scrap Metal, ${r.wire||0} Wire${r.parts?', '+r.parts+' Uncommon Electrical Parts':''}, ${r.bolts} Bolts${r.minLevel?' — level '+r.minLevel:''}`,GEAR[r.name]?.rarity||'system');}
 r5DirectChoices([...keys.filter(k=>!CRAFT_RECIPES[k].minLevel||player.level>=CRAFT_RECIPES[k].minLevel).map(k=>'CRAFT '+CRAFT_RECIPES[k].name.toUpperCase()),'BACK']);
}
function r11CraftCommand(cmd){
 const where=player.flags.r11Bench;
 if(where==='seaport'&&(!portRecruitUnlocked()||!portStaffRating('workshop'))){stage='seaport';port55Menu();return;}
 if(['back','b'].includes(cmd)){if(where==='seaport'){stage='port55Service';player.flags.portStaffUI={role:'workshop',page:'main'};portStaffRender();}else if(where==='forge')v49FactoryRoom();else{stage='mercy';mercyLocation='murphy';npcTalk('murphy');}return;}
 const job=player.flags.v49MurphyJob;
 if(cmd==='collect craft'&&job){
  if(Date.now()<job.endsAt){add('The work is still in progress.','system');return r11CraftMenu();}
  const r=CRAFT_RECIPES[job.key];if(!job.success){delete player.flags.v49MurphyJob;add('Craft failed; materials were consumed.','system');}
  else if(addPack(r.name,r.type,1,true)){delete player.flags.v49MurphyJob;add('CRAFT COMPLETE — '+gearLabel(r.name),'reward');}
  else add('Finished item held at the workbench. Free a pack slot.','system');
  r11Quiet(()=>v49Autosave());return r11CraftMenu();
 }
 if(!cmd.startsWith('craft ')||job)return r11CraftMenu();
 const key=Object.keys(CRAFT_RECIPES).find(k=>CRAFT_RECIPES[k].name.toLowerCase()===cmd.slice(6));
 const r=CRAFT_RECIPES[key];if(!player.flags.v49RecipeBandage||!r||!r11Learned(key)||r.minLevel&&player.level<r.minLevel){add('That blueprint is not available to craft.','system');return;}
 const mats={Cloth:r.cloth||0,'Scrap Metal':r.scrap||0,Wire:r.wire||0,'Uncommon Electrical Parts':r.parts||0};
 if(player.bolts<r.bolts||Object.entries(mats).some(([n,q])=>r6MaterialCount(n)<q)){add('Not enough materials or Bolts.','danger');return;}
 for(const [n,q]of Object.entries(mats))if(q)r6ConsumeMaterial(n,q);
 player.bolts-=r.bolts;player.flags.v49MurphyJob={key,endsAt:Date.now()+r.seconds*1000,success:Math.random()<r.chance};
 r11Quiet(()=>v49Autosave());updateHud();r11CraftMenu();
}
const r11Bench=v49Workbench;v49Workbench=function(){if(!player.flags.v49RecipeBandage)return r11Bench();r11CraftMenu('forge');};
v49MurphyRecipes=function(){if(!player.flags.v49RecipeBandage){add('Learn your first recipe from Forge.','system');return;}r11CraftMenu('murphy');};
// A character-wide journal supplements the existing per-table journal. Restoring
// an older slot cannot reroll/refund a committed casino transaction in this browser.
function r11ReadCasinoLedger(){if(!player.characterId)return null;try{return JSON.parse(localStorage.getItem('route127-r11-casino-'+player.characterId)||'null');}catch{return null;}}
function r11CasinoCommit(){
 if(!player.characterId)return;
 const old=r11ReadCasinoLedger()||{seq:0,net:0,rounds:{}},rounds=old.rounds||{},seq=Math.max(old.seq||0,player.flags.r11CasinoSeq||0)+1;let net=old.net||0;
 for(const [kind,r]of [['harbor',player.flags.r6Game],['solace',player.flags.casino?.round]]){
  if(!r?.id)continue;const key=kind+':'+r.id,known=rounds[key]||(rounds[key]={});
  if(['active','settled'].includes(r.status)&&r.bet>0&&!known.debited){net-=r.bet;known.debited=true;}
  if(r.status==='settled'&&!known.paid){net+=r.payout||0;known.paid=true;}
 }
 const data={seq,net,rounds,bolts:player.bolts,r6Game:player.flags.r6Game||null,casino:player.flags.casino||null,cheeseburgerOwned:!!player.flags.cheeseburgerOwned};
 try{localStorage.setItem('route127-r11-casino-'+player.characterId,JSON.stringify(data));player.flags.r11CasinoSeq=seq;player.flags.r11CasinoNet=net;}catch{add('Casino checkpoint unavailable. Save progress before closing this page.','danger');}
}
function r11CasinoBaseline(){
 if(!player.characterId||r11ReadCasinoLedger())return;
 const rounds={};for(const [kind,r]of [['harbor',player.flags.r6Game],['solace',player.flags.casino?.round]])if(r?.id)rounds[kind+':'+r.id]={debited:['active','settled'].includes(r.status),paid:r.status==='settled'};
 localStorage.setItem('route127-r11-casino-'+player.characterId,JSON.stringify({seq:0,net:0,rounds,bolts:player.bolts,r6Game:player.flags.r6Game||null,casino:player.flags.casino||null}));
}
function r11RestoreCasinoLedger(force=false){
 const db=r11ReadCasinoLedger();if(!db||!Number.isSafeInteger(db.bolts)||!force&&(player.flags.r11CasinoSeq||0)>=db.seq)return;
 // Carry only casino debits/credits across a rollback, never unrelated quest earnings.
 const balance=player.bolts+(db.net||0)-(player.flags.r11CasinoNet||0);if(!Number.isSafeInteger(balance))throw Error('Casino journal balance requires recovery.');
 player.bolts=Math.max(0,balance);player.flags.r11CasinoSeq=db.seq;player.flags.r11CasinoNet=db.net||0;player.flags.r6Game=db.r6Game;player.flags.casino=db.casino;
 if(db.cheeseburgerOwned&&!player.flags.cheeseburgerOwned){player.flags.cheeseburgerOwned=true;const owned=player.flags.ownedPets||(player.flags.ownedPets=[]);if(!owned.includes('Cheeseburger'))owned.push('Cheeseburger');player.packMax+=6;}
}
// Fixed-odds games can express a true relative probability bonus without changing skill rules.
const R11_LUCK_GAMES=['dice','rps','rats','slots','CRAB RACING'];
function r11BoardEquipped(){return player.armor===R11_BOARD&&r11OwnsBoard();}
function r11LuckyChance(p){return r11BoardEquipped()?Math.min(.95,p*1.25):p;}
function r11LuckyConvert(win,p){return win||r11BoardEquipped()&&Math.random()<p*.25/(1-p);}
function r11LuckReturn(r,payout){return r.r11Lucky&&payout>r.bet?Math.floor(payout*.75):payout;}
function r11LuckNotice(){if(r11BoardEquipped())add("ELEPHANT'S LUCK — 25% more winning outcomes on Dice, RPS, Slots and races. Lucky winning returns use 75% of the posted payout; ties return your stake. Blackjack, poker and skill games keep their rules.",'system');}
const r11CasinoWager=casinoWager;casinoWager=function(cmd,r){r11CasinoBaseline();const ok=r11CasinoWager(cmd,r);if(ok){r.r11Lucky=r11BoardEquipped()&&R11_LUCK_GAMES.includes(r.game);casinoCheckpoint();}return ok;};
const r11Settle=casinoSettle;casinoSettle=function(r,payout,msg){return r11Settle(r,r11LuckReturn(r,payout),msg);};
const r11R6Settle=r6Settle;r6Settle=function(payout,msg){return r11R6Settle(r11LuckReturn(r6Round()||{},payout),msg);};
// Keep a single weighted race draw utility for rats and crabs.
function r11RaceDraw(weights,pick){const probs=[...weights];if(Number.isInteger(pick)&&r11BoardEquipped()){const p=weights[pick],boost=r11LuckyChance(p);for(let i=0;i<probs.length;i++)probs[i]=i===pick?boost:weights[i]*(1-boost)/(1-p);}let x=Math.random();for(let i=0;i<probs.length;i++)if((x-=probs[i])<0)return i;return probs.length-1;}
casinoRatWinner=function(){return r11RaceDraw([.25,.25,.25,.25],casinoRound()?.pick);};
r6CrabWinner=function(){return r11RaceDraw(R6_CRAB_ODDS,r6Round()?.pick);};
const r11CasinoResolve=casinoResolve;
casinoResolve=function(r){
 if(!r.r11Lucky)return r11CasinoResolve(r);
 if(r.game==='dice'){
  const win=Math.random()<r11LuckyChance(1/6);r.roll=win?r.pick:[1,2,3,4,5,6].filter(n=>n!==r.pick)[Math.floor(Math.random()*5)];casinoSettle(r,win?r.bet*6:0,`DIE: ${r.roll} — ${win?'WIN':'LOSS'}`);casinoAnimate([casinoDiceFace(2),casinoDiceFace(5)],casinoDiceFace(r.roll));casinoRender();return;
 }
 if(r.game==='rps'){
  const x=Math.random(),win=r11LuckyChance(1/3),beats={rock:'scissors',paper:'rock',scissors:'paper'},loses={rock:'paper',paper:'scissors',scissors:'rock'};
  r.result=x<win?'win':x<win+1/3?'push':'loss';r.opponent=r.result==='win'?beats[r.pick]:r.result==='push'?r.pick:loses[r.pick];casinoSettle(r,r.result==='win'?2*r.bet:r.result==='push'?r.bet:0,`${r.pick} vs ${r.opponent} — ${r.result}`);casinoRender();return;
 }
 if(r.game==='slots'){
  r.reels=[casinoSlotDraw(),casinoSlotDraw(),casinoSlotDraw()];const p=SLOT_SYMBOLS.reduce((s,a)=>s+(a.weight/100)**3,0);
  if(!r.reels.every(n=>n===r.reels[0])&&r11LuckyConvert(false,p)){
   let x=Math.random()*p;const symbol=SLOT_SYMBOLS.find(a=>(x-=(a.weight/100)**3)<0)||SLOT_SYMBOLS.at(-1);r.reels=[symbol.name,symbol.name,symbol.name];
  }
  casinoSettle(r,casinoSlotPayout(r.reels,r.bet),r.reels.join(' / '));
  // Preserve the independent once-per-character pet jackpot.
  if(!player.flags.cheeseburgerOwned&&Math.random()<.05){player.flags.cheeseburgerOwned=true;const owned=player.flags.ownedPets||(player.flags.ownedPets=[]);if(!owned.includes('Cheeseburger'))owned.push('Cheeseburger');player.packMax+=6;add('CHEESEBURGER joins your companions. +6 backpack slots.','legendary');casinoCheckpoint();}
  casinoAnimate(['[ ? ] [ ? ] [ ? ]'],r.reels.map(s=>'['+s+']').join(' '));casinoRender();return;
 }
 return r11CasinoResolve(r);
};
const r11CasinoRender=casinoRender;casinoRender=function(){r11CasinoRender();if(casinoRound()?.status==='waiting')r11LuckNotice();};
const r11CasinoCmd=handleCasinoCommand;handleCasinoCommand=function(cmd){if(['bet all','all-in'].includes(cmd))cmd='all in';return r11CasinoCmd(cmd);};
const r11CasinoMenu=casinoMenu;casinoMenu=function(entered){if(player.flags.port55Casino&&r11BoardEquipped())add("MIA > What the hell are you wearing? You know what... don't answer that.",'bright');r11CasinoMenu(entered);};
function r11WagerMenu(){casinoWagerMenu();r11LuckNotice();}
function r11CardRows(cards,hidden=false){const box=document.createElement('div');box.className='r11-cards';cards.forEach((c,i)=>{
 const card=document.createElement('pre');const suit=['♣','♦','♥','♠'][Math.floor(c/13)],rank=['2','3','4','5','6','7','8','9','10','J','Q','K','A'][c%13];
 card.className='r11-card '+(hidden?'back':/[♦♥]/.test(suit)?'red':'');card.textContent=hidden?'┌─────┐\n│ ☠ ⚔ │\n│ ⚔ ☠ │\n│ ☠ ⚔ │\n└─────┘':`┌─────┐\n│${rank.padEnd(2)}   │\n│  ${suit}  │\n│   ${rank.padStart(2)}│\n└─────┘`;box.appendChild(card);
 });screen.appendChild(box);}
function r11PokerHands(r,hidden){outputQueue=outputQueue.then(()=>{addImmediate('YOUR CARDS — 1  2  3  4  5','system');r11CardRows(r.hand);addImmediate('MIA’S CARDS','npc-blue');r11CardRows(r.dealer,hidden);followOutput();});}
function r11DiceArt(s){outputQueue=outputQueue.then(()=>{const box=document.createElement('div');box.className='r11-dice';for(const [i,n]of [...s.held,...s.dice].entries()){const die=document.createElement('pre');die.className='r11-die'+(i<s.held.length?' held':'');die.textContent=casinoDiceFace(n);box.appendChild(die);}screen.appendChild(box);followOutput();});}
r6CasinoRender=function(){
 if(!portRecruitUnlocked()){stage='seaport';return port55Menu();}stage='r6Casino';const r=r6Round();if(!r)return casinoMenu();add(r.game,'place');
 if(r.status==='settled'){add(r.message,'reward');add(`WAGER ${r.bet} / RETURN ${r.payout} / NET ${r.payout-r.bet} Bolts`,'system');if(r.game==="PIRATE'S POKER")r11PokerHands(r,false);r5DirectChoices(['PLAY AGAIN','BACK']);return;}
 if(r.status==='waiting'){
  if(r.game==='CRAB RACING'&&!Number.isInteger(r.pick)){add('Pick a crab first. Returns include the stake.','system');r5DirectChoices([...R6_CRABS.map((n,i)=>`CRAB ${i+1} — ${n} — ${Math.round(R6_CRAB_ODDS[i]*100)}% — ${R6_CRAB_RETURNS[i]}×`),'BACK']);return;}
  if(r.game==='CRAB RACING')add('YOUR CRAB: '+R6_CRABS[r.pick],'bright');
  if(r.game==="CAPTAIN'S DICE")add('Roll up to three times. Keep a 6 (ship), then 5 (captain), then 4 (crew). Your last two dice score. Beat Mia. ROLL again or STAND.','system');
  if(r.game==="PIRATE'S POKER")add('Five-card draw. Replace up to three cards once with DRAW 1 3 5, or STAND. The stronger poker hand wins.','system');
  if(r.game==='KNIFE THROWING')add('Five throws. ENTER, THROW, or tap the button to stop your aim. Beat Mia’s total. Her throws: 5% miss, 20% outer, 40% inner, 35% bullseye.','system');
  if(r.custom){add('CUSTOM WAGER — enter an affordable positive whole number, or BACK.','system');r5DirectChoices(['BACK']);return;}
  r11WagerMenu();return;
 }
 if(r.game==="CAPTAIN'S DICE"){add(`Throw ${r.p.throws}/3 — score ${r.p.score} — kept ${r.p.held.join('/')||'none'}`,'bright');r11DiceArt(r.p);r5DirectChoices(['ROLL','STAND','BACK']);}
 if(r.game==="PIRATE'S POKER"){r11PokerHands(r,true);r5DirectChoices(['STAND','BACK']);add('DRAW up to three card numbers, for example DRAW 1 3.','system');}
 if(r.game==='KNIFE THROWING'){add(`YOU ${r.scores.join(' + ')||0} / MIA ${r.mia.join(' + ')}`,'bright');r5DirectChoices([r.readyNext?'NEXT THROW':r.started?'THROW':'START THROW','BACK']);}
};
const r11Wager=r6Wager;r6Wager=function(bet){const r=r6Round();if(!r)return false;r.r11Lucky=r11BoardEquipped()&&R11_LUCK_GAMES.includes(r.game);return r11Wager(bet);};
const r11R6Command=r6CasinoCommand;
r6CasinoCommand=function(cmd){
 const r=r6Round();if(!portRecruitUnlocked())return r11R6Command(cmd);
 if(r?.status==='waiting'){
  if(['back','b'].includes(cmd)&&r.custom){delete r.custom;r6CasinoRender();return;}
  const crab=cmd.match(/^crab ([1-5])(?: —.*)?$/);if(crab&&r.game==='CRAB RACING'){r.pick=+crab[1]-1;r6CasinoSave();r6CasinoRender();return;}
  if(['custom wager','custom','c'].includes(cmd)){r.custom=true;r6CasinoRender();return;}
  if(['all in','bet all','all-in','a'].includes(cmd))cmd='wager '+player.bolts;
  if(r.custom&&/^\d+$/.test(cmd))cmd='wager '+cmd;
  const m=cmd.match(/^(?:wager|bet) (\d+)(?: bolts?)?$/);
  if(m){if(!r6Wager(Number(m[1]))){add(r.game==='CRAB RACING'&&!Number.isInteger(r.pick)?'Choose a crab first.':'Invalid or unaffordable wager.','danger');r6CasinoRender();}return;}
 }
 return r11R6Command(cmd);
};
// Use stronger but still variable Mia throws; the player's timing mechanics are untouched.
// Bulletin boards share the existing local crime/save data and traveler posts.
function r11BountyRows(){
 const rows=new Map();for(const key of Object.values(SAVE_KEYS)){try{const d=JSON.parse(localStorage.getItem(key)||'null'),p=d?.player;if(p){const c=p.flags?.crime||p.flags?.v52Crime;rows.set(p.characterId||p.handle,{handle:p.handle||'TRAVELER',bounty:c?.bounty||0,lifetime:c?.lifetime||0});}}catch{}}
 const c=v52Crime();rows.set(player.characterId||player.handle,{handle:player.handle||'TRAVELER',bounty:c.bounty,lifetime:c.lifetime});return [...rows.values()];
}
function r11SharedBoard(){
 const rows=r11BountyRows();
 add('TOP 3 MOST WANTED','danger');const wanted=rows.filter(r=>r.bounty>0).sort((a,b)=>b.bounty-a.bounty).slice(0,3);if(!wanted.length)add('No active local warrants.','system');wanted.forEach((r,i)=>add(`${i+1}. ${r.handle} — ${r.bounty} Bolts`,'danger'));
 add('TOP 5 MOST NOTORIOUS','place');const notorious=rows.filter(r=>r.lifetime>0).sort((a,b)=>b.lifetime-a.lifetime).slice(0,5);if(!notorious.length)add('No recorded lifetime bounties.','system');notorious.forEach((r,i)=>add(`${i+1}. ${r.handle} — ${r.lifetime} lifetime Bolts`,'system'));
 add('Records shared by the saves in this browser.','system');
 for(const p of getBoardPosts())add(`> ${p.handle||'TRAVELER'} — ${p.text}`,'system');
 for(const note of r11LegendDB().announcements.slice(-5))add(note,'legendary');
}
const r11SolaceBoard=showBulletinBoard;showBulletinBoard=function(){r11SolaceBoard();r11SharedBoard();};
function r11PortBoard(){stage='r11Board';add('SEAPORT — DOCK BULLETIN BOARD','place');
 add('SHIPPING: Register cargo before unloading. Unmarked crates will be held at the quay.');add('DOCKWORKERS: Check mooring ropes after every squall.');add('MISSING CARGO: Report altered freight manifests to the docks clerk.');add('HARBOR HAZARD: The western freight spur has unstable decking.');add('LOCAL NOTICE: Mia wants her cups back. Kaiden wants everyone to stop blaming the gulls.');r11SharedBoard();r5DirectChoices(['POST A MESSAGE','VIEW BOUNTIES','RETURN TO DOCKS']);
}
const r11Docks=r5Docks;r5Docks=function(){if(!portRecruitUnlocked())return r11Docks();stage='port55Docks';add('SEAPORT — HARBOR DOCKS','place');add('A clerk checks water-stained manifests beside the freed quay.','bright');r5DirectChoices(['DOCK BULLETIN BOARD','TALK TO DOCKS CLERK',...(player.flags.port55PendingRewards?.length?['CLAIM PENDING REWARD']:[]),'RETURN TO SEAPORT']);};
port55MiaMenu=function(){stage='port55Mia';port55Submenu('The Rusty Anchor — Mia',['SMALL TALK','BUY DRINKS','GAMBLE',player.flags.r6AnchorRoomOwned?'GO TO ROOM':'RENT ROOM — 500 BOLTS',...(portRecruitUnlocked()?['ASK ABOUT HOUSE RULES']:[]),'RETURN TO HARBOR']);};
function r11Drinks(){stage='r11Drinks';add('MIA — DRINKS','place');r5DirectChoices(['BEER — 3 BOLTS / +5 HP','SHOT — 5 BOLTS / +10 HP','HOUSE SPECIAL — 8 BOLTS / +15 HP','BACK']);}
const R11_QUESTS={shipment:{name:'The Last Shipment',xp:120,bolts:75,giver:'Docks Clerk'},houseRules:{name:'House Rules',xp:100,bolts:100,giver:'Mia'},lights:{name:'Keeping the Lights On',xp:150,bolts:0,giver:'Kaiden'}};
function r11QuestState(){return player.flags.r11Quests||(player.flags.r11Quests={});}
function r11QuestMenu(key){
 if(!portRecruitUnlocked())return;
 stage='r11Quest';player.flags.r11QuestFocus=key;const q=R11_QUESTS[key],state=r11QuestState()[key];add(q.giver.toUpperCase()+' — '+q.name.toUpperCase(),'place');
 const intro={shipment:'The relief cargo was signed over to an empty freight spur. Find the redirected crates and the duplicate manifest before the harbor blames its own workers.',houseRules:'A gambler left owing Mia money, but his room still holds everything he owns. Find his camp by the western freight wagons. Ask why he vanished before deciding what to do.',lights:'The quay lamps keep cutting out. Recover electrical parts from the freight-line service box, then bring them to Kaiden so the harbor can work after dusk.'};
 if(!state){add(intro[key]);r5DirectChoices(['ACCEPT QUEST','BACK']);}
 else if(state==='ready'){add('You have what you need. Report what happened.','system');r5DirectChoices(['COMPLETE QUEST','BACK']);}
 else if(state==='done'){add('This job is finished. The harbor remembers your help.','bright');r5DirectChoices(['BACK']);}
 else{add(key==='shipment'?'Search the freight spur on coast segment 3.':key==='houseRules'?'Search the gambler’s camp on coast segment 1.':'Search the service box on coast segment 4.','system');r5DirectChoices(['BACK']);}
}
function r11QuestReturn(){const k=player.flags.r11QuestFocus;if(k==='shipment')r5Docks();else if(k==='houseRules')port55MiaMenu();else{stage='port55Kaiden';port55Submenu('Kaiden — Town Lawman',['SMALL TALK','ASK ABOUT KEEPING THE LIGHTS ON','RETURN TO HARBOR']);}}
function r11QuestComplete(key){
 if(!portRecruitUnlocked()||r11QuestState()[key]!=='ready')return;
 r11QuestState()[key]='done';const q=R11_QUESTS[key];gainXp(q.xp);if(q.bolts)gainBolts(q.bolts);
 if(key==='lights'){if(!addPack('Uncommon Electrical Parts','material',2,true))(player.stash||(player.stash=[])).push({name:'Uncommon Electrical Parts',type:'material',qty:2});add('Kaiden fits the recovered components. Lamps come on along the quay; two spare Uncommon Electrical Parts are yours.','reward');}
 if(key==='houseRules')add(player.flags.r11GamblerChoice==='forgive'?"MIA > You gave him a chance to come back. I can live with that. Here's your fee.":player.flags.r11GamblerChoice==='work'?"MIA > He offered to work it off? Good. I'll find him a broom.":"MIA > He paid what he could. Next time he wants a room, he talks to me first.",'bright');
 add('QUEST COMPLETE — '+q.name,'reward');r11Quiet(()=>v49Autosave());r11QuestReturn();
}
function r11RoadQuestOptions(){if(!portRecruitUnlocked()||!r6Road()?.active||r6Road().leg!=='coast')return [];const q=r6Road(),s=r11QuestState();return [...(s.shipment==='active'&&q.pos===3?['SEARCH FREIGHT SPUR']:[]),...(s.houseRules==='active'&&q.pos===1?['SEARCH GAMBLER CAMP']:[]),...(s.lights==='active'&&q.pos===4?['SEARCH SERVICE BOX']:[])];}
const r11RoadMenu=r6RoadMenu;r6RoadMenu=function(){r11RoadMenu();if(stage==='r6Road'){const extra=r11RoadQuestOptions();if(extra.length)r5DirectChoices(['CONTINUE '+(r6Road().dir>0?'EAST':'WEST'),'REVERSE DIRECTION','INSPECT ROAD',...extra]);}};
function r11RoadQuest(cmd){
 if(!r11RoadQuestOptions().map(s=>s.toLowerCase()).includes(cmd))return false;
 if(!spendTurn()){add('Searching takes one turn. No turns remain.','danger');return true;}
 if(cmd==='search freight spur'){r11QuestState().shipment='ready';add('The relief crates are intact behind a false loading wall. You recover a manifest with the forged destination. The clerk can redirect a crew now.','reward');r6RoadMenu();}
 if(cmd==='search service box'){r11QuestState().lights='ready';add('You isolate a live lead, then free two intact switching components. Reserved for Kaiden; no pack space needed.','reward');r6RoadMenu();}
 if(cmd==='search gambler camp')r11GamblerMenu();
 updateHud();r11Quiet(()=>v49Autosave());return true;
}
function r11GamblerMenu(){stage='r11Gambler';add('The missing gambler shelters beside a broken handcart. He fled after losing his wages, afraid Mia would have him beaten. He offers his last few Bolts.','bright');r5DirectChoices(['TAKE WHAT HE CAN PAY','ASK HIM TO WORK IT OFF','FORGIVE THE DEBT AND SEND HIM HOME']);}
const r11Quests=showQuests;showQuests=function(){r11Quests();if(!portRecruitUnlocked())return;for(const [k,state]of Object.entries(r11QuestState())){add(`${state==='done'?'COMPLETE':'SIDE QUEST'} — ${R11_QUESTS[k].name}`,'place');add(state==='ready'?'Report to '+R11_QUESTS[k].giver:state==='done'?'Completed.':k==='shipment'?'Search the freight spur on coast segment 3.':k==='houseRules'?'Search the gambler camp on coast segment 1.':'Search the service box on coast segment 4.','system');}};
// Local ownership prototype. No server/global authority is fabricated.
const R11_LEGEND_KEY='route127-local-legendary-r11-v1';
function r11LegendDB(){try{const db=JSON.parse(localStorage.getItem(R11_LEGEND_KEY)||'null');if(db&&db.version===1&&Array.isArray(db.announcements))return db;}catch{}return {version:1,board:null,announcements:[]};}
function r11OwnsBoard(){const row=r11LegendDB().board;return !!row&&row.owner===player.characterId&&row.token===player.flags.r11BoardToken;}
function r11ValidateBoard(){
 const row=r11LegendDB().board,owner=row&&row.owner===player.characterId;
 if(owner)player.flags.r11BoardToken=row.token;
 const arrays=[...new Set([player.pack,player.stash,player.houseStorage,player.rustyRoomChest,player.flags.r6AnchorRoomChest,player.flags.r5LootQueue].filter(Boolean))];
 if(!owner){if(player.armor===R11_BOARD){player.armor='Worn Jacket';player.maxHp=Math.max(1,player.maxHp-20);player.hp=Math.min(player.hp,player.maxHp);}for(const arr of arrays)for(let i=arr.length-1;i>=0;i--)if(arr[i].name===R11_BOARD)arr.splice(i,1);return;}
 let found=player.armor===R11_BOARD;
 for(const arr of arrays)for(let i=arr.length-1;i>=0;i--)if(arr[i].name===R11_BOARD){if(found)arr.splice(i,1);else{arr[i].qty=1;found=true;}}
 if(!found){const item={name:R11_BOARD,type:'armor',qty:1};if(packSlotsUsed()<player.packMax)player.pack.push(item);else(player.stash||(player.stash=[])).push(item);}
}
function r11TouchLegendary(){const db=r11LegendDB();if(r11OwnsBoard()){db.board.lastSeen=Math.max(db.board.lastSeen,Date.now());localStorage.setItem(R11_LEGEND_KEY,JSON.stringify(db));}}
async function r11ClaimBoard(){
 const claim=()=>{const id=r7Identity();if(!id)return false;const db=r11LegendDB(),now=Date.now();if(db.board&&now-db.board.lastSeen<=30*86400000)return false;
 const token=crypto.randomUUID();db.board={owner:id,token,lastSeen:now};db.announcements.push(`${player.handle} claimed Crazy Steve's Sandwich Board.`);db.announcements=db.announcements.slice(-20);localStorage.setItem(R11_LEGEND_KEY,JSON.stringify(db));player.flags.r11BoardToken=token;
 r11ValidateBoard();return true;};
 if(navigator.locks?.request)return navigator.locks.request('route127-legendary-board',claim);
 // Synchronous localStorage commit is safe within one tab; cross-tab guarantees require Web Locks.
 return claim();
}
function r11SteveScene(branchReturn=null){
 player.flags.r11SteveReturn=branchReturn;stage='r11Steve';add("CRAZY STEVE'S PINK ELEPHANTS",'place');add('Crazy Steve staggers across the road in an old wooden sandwich board. He points wildly at something the size of a wheelbarrow.');add("CRAZY STEVE > YOU SEE 'EM?! TELL ME YOU SEE 'EM! THE PINK ELEPHANTS! THEY'RE EVERYWHERE!",'bright');r5DirectChoices(['ASK ABOUT THE ELEPHANTS','FIGHT THE ELEPHANTS','LEAVE STEVE ALONE']);
}
function r11SteveFinish(){const back=player.flags.r11SteveReturn;delete player.flags.r11SteveReturn;if(back){stage=back.stage;serviceRoadDepth=back.depth;renderCurrentChoices();}else completeRoadTurn();}
function r11Elephant(){startCombat({name:'PINK ELEPHANT',level:1,hp:1,min:0,max:1,xp:1,bolts:0,end:'The pink elephant pops like a soap bubble. Steve applauds, then checks behind you.'},'r11Elephant');r6Art('PINK ELEPHANT',[['pink','    __     __'],['pink','  /    \\__/  \\'],['pink',' (  o       o )~~'],['pink','  \\___/\\____/'],['pink','    ||    ||']]);}
function r11SteveVictory(){stage='r11SteveReward';outputQueue=outputQueue.then(async()=>{try{const won=await r11ClaimBoard();add(won?'CRAZY STEVE > THANK YOU! Take the board! It attracts them!':"CRAZY STEVE > I already gave the board away! They said there could only be one. THE ELEPHANTS KNOW.",'bright');if(won)add('LEGENDARY — '+R11_BOARD+' — DEF 15 / MAX HP +20', 'legendary');r11SteveFinish();r11Quiet(()=>v49Autosave());}catch(e){add('Steve cannot secure the reward right now. CLAIM STEVE REWARD to retry.','danger');}});}
function r11SteveRoll(){return Math.random()<.01;}
const r11Prepare=r10PrepareEncounter;r10PrepareEncounter=function(){if(!resumeSavedEncounter&&r11SteveRoll()){player.flags.r10LastRoadCategory='special';r11SteveScene();return false;}return r11Prepare();};
const r11Retreat=handleCombat;handleCombat=function(cmd){if(combatState?.source==='r11Elephant'&&/^(?:b|back|flee|run)/.test(cmd)){combatState=null;add('Steve takes cover behind his sign.','system');r11SteveFinish();return;}return r11Retreat(cmd);};
const r11Choices=renderCurrentChoices;renderCurrentChoices=function(){if(stage==='r11Gambler')return r11GamblerMenu();if(stage==='r11Craft')return r11CraftMenu();if(stage==='r11Drinks')return r11Drinks();if(stage==='r11Board')return r11PortBoard();if(stage==='r11Quest')return r11QuestMenu(player.flags.r11QuestFocus);if(stage==='r11Steve')return r11SteveScene(player.flags.r11SteveReturn);if(stage==='r11SteveReward')return add('CLAIM STEVE REWARD','system');return r11Choices();};
const r11Core=handleCommandCore;
handleCommandCore=async function(raw){
 const cmd=r5Mapped(raw);if(busy)return;
 if(/^save(?: |$)|^load(?: |$)|^testing(?: |$)|^test off$/.test(cmd))return r11Core(raw);
 if(stage==='r11Craft')return r11CraftCommand(cmd);
 if(stage==='mercy'&&mercyLocation==='murphy'&&player.flags.v49MurphyMenu==='recipe'&&['i','insert','insert materials','start','c','check','collect','collect result'].includes(cmd)){const key=player.flags.v49MurphyJob?.key||player.flags.v49MurphyRecipe;r11CraftMenu('murphy');return r11CraftCommand(['i','insert','insert materials','start'].includes(cmd)?'craft '+(CRAFT_RECIPES[key]?.name||'').toLowerCase():'collect craft');}
 if(stage==='r11Steve'){if(cmd==='leave steve alone')return r11SteveFinish();if(['ask about the elephants','fight the elephants'].includes(cmd))return r11Elephant();return renderCurrentChoices();}
 if(stage==='r11SteveReward'&&cmd==='claim steve reward')return r11SteveVictory();
 if(stage==='r11Drinks'){
  if(['back','b'].includes(cmd))return port55MiaMenu();const d=R11_DRINKS[cmd.split(' — ')[0]];
  if(d){if(player.bolts<d[1])add('MIA > Bring the Bolts first, sweetheart.','bright');else if(player.hp>=player.maxHp)add("MIA > You're already at full health.",'bright');else{player.bolts-=d[1];player.hp=Math.min(player.maxHp,player.hp+d[2]);updateHud();add(`${d[0]} — +${d[2]} HP / -${d[1]} BOLTS`,'reward');r11Quiet(()=>v49Autosave());}}return r11Drinks();
 }
 if(stage==='r11Quest'){
  if(['back','b'].includes(cmd))return r11QuestReturn();const key=player.flags.r11QuestFocus;if(!portRecruitUnlocked())return port55Menu();
  if(cmd==='accept quest'&&!r11QuestState()[key]){r11QuestState()[key]='active';r11Quiet(()=>v49Autosave());r11QuestReturn();return;}
  if(cmd==='complete quest')return r11QuestComplete(key);return r11QuestMenu(key);
 }
 if(stage==='r11Gambler'){
  const map={'take what he can pay':'pay','ask him to work it off':'work','forgive the debt and send him home':'forgive'};
  if(map[cmd]){player.flags.r11GamblerChoice=map[cmd];r11QuestState().houseRules='ready';add(map[cmd]==='work'?'He agrees to return and work at the bar.':map[cmd]==='forgive'?'He promises to return and talk to Mia. You leave his last Bolts with him.':'He hands over a small purse, reserved as evidence of repayment for Mia.','bright');r11Quiet(()=>v49Autosave());r6RoadMenu();}return;
 }
 if(stage==='r11Board'){
  if(['return to docks','back','b'].includes(cmd))return r5Docks();if(cmd==='view bounties'){r11SharedBoard();return r5DirectChoices(['RETURN TO DOCKS']);}
  if(cmd==='post a message'){player.flags.r11BoardPosting=true;add('Type POST <message>, or BACK.','system');return;}
  if(cmd.startsWith('post ')){postToBulletinBoard(String(raw).trim().slice(5));return r11PortBoard();}return;
 }
 if(portRecruitUnlocked()){
  if(stage==='port55Docks'&&cmd==='dock bulletin board')return r11PortBoard();
  if(stage==='port55Docks'&&cmd==='talk to docks clerk')return r11QuestMenu('shipment');
  if(stage==='port55Mia'&&cmd==='ask about house rules')return r11QuestMenu('houseRules');
  if(stage==='port55Kaiden'&&cmd==='ask about keeping the lights on')return r11QuestMenu('lights');
  if(stage==='r6Road'&&r11RoadQuest(cmd))return;
  if(stage==='port55Mia'&&cmd==='buy drinks')return r11Drinks();
  if(stage==='port55Mia'&&/^(?:rent room|room)/.test(cmd)&&!player.flags.r6AnchorRoomOwned&&player.bolts<500){add("MIA > You trying to rip me off? That room costs 500 Bolts, sweetheart. Come back when you've got the money.",'bright');return port55MiaMenu();}
 }
 const before=player.lifetimeTurns||0;await r11Core(raw);
 if(stage==='port55Kaiden'&&portRecruitUnlocked())r5DirectChoices(['SMALL TALK','ASK ABOUT KEEPING THE LIGHTS ON','RETURN TO HARBOR']);
 if(['serviceRoad','relayBranch'].includes(stage)&&(player.lifetimeTurns||0)>before&&r11SteveRoll())r11SteveScene({stage,depth:serviceRoadDepth});
};
// Pet purchases/equips are checkpointed; rendering alone never creates a purchase.
const r11PetCmd=port55Command;port55Command=function(cmd){const before=JSON.stringify([port55Owned(),player.flags.equippedPet]);const result=r11PetCmd(cmd);if(before!==JSON.stringify([port55Owned(),player.flags.equippedPet]))r11Quiet(()=>v49Autosave());return result;};
const r11Vendor=port55Vendor;port55Vendor=function(){r11Vendor();for(const [name,p]of Object.entries(PORT55_PETS))if(Number.isFinite(p.price))add(name+' — '+p.rarity.toUpperCase(),p.rarity);};
const r11PetMenu=port55Pets;port55Pets=function(){r11PetMenu();for(const name of port55Owned())add(name+(player.flags.equippedPet===name?' — EQUIPPED':''),r11PetRarity(name));};
// Keep existing aptitudes intact; new profiles use 25 distinct stable rows.
const R11_APTITUDE_ROWS=[[2,4,2,5],[2,2,5,3],[3,3,2,4],[2,4,3,2],[5,2,2,3],[2,3,4,2],[3,2,5,1],[2,5,2,4],[1,3,4,2],[3,2,2,5],[2,3,5,2],[4,5,2,3],[2,3,5,3],[2,4,3,3],[3,5,2,4],[3,4,4,2],[5,3,2,3],[3,3,5,2],[2,5,3,4],[2,5,2,3],[3,2,3,5],[2,3,3,4],[2,2,3,5],[4,3,2,4],[3,2,4,3]];
const r11Aptitudes=portAptitudes;portAptitudes=function(w){const st=ws(w.name);if(st.seaportAptitudes)return st.seaportAptitudes;const row=R11_APTITUDE_ROWS[wanderers.indexOf(w)];if(row)st.seaportAptitudes=Object.fromEntries(['medicine','trading','mechanics','banking'].map((k,i)=>[k,row[i]]));return r11Aptitudes(w);};
const r11StaffRender=portStaffRender;portStaffRender=function(){if(portRecruitUnlocked()&&portStaffRating('workshop')&&player.flags.portStaffUI?.role==='workshop'&&player.flags.portStaffUI.page==='craft')return r11CraftMenu('seaport');return r11StaffRender();};
// Each newly generated wanderer keeps a distinct, persistent equipment combination.
Object.assign(GEAR,{'Crude Shiv':{rarity:'common',type:'weapon',min:4,max:9},'Worn Crowbar':{rarity:'common',type:'weapon',min:5,max:9},'Worn Canvas Coat':{rarity:'common',type:'armor',def:2}});
const R11_WANDERER_KITS={
 Hollis:['Rusted Pipe','Worn Jacket'],June:['Crude Shiv','Worn Canvas Coat'],Ash:['Worn Crowbar','Worn Jacket'],
 Moss:['Rusted Pipe','Padded Jacket'],Vera:['Claw Hammer','Worn Canvas Coat'],Lark:['Crude Shiv','Reinforced Jacket'],
 Rook:['Reinforced Pipe','Padded Jacket'],Kettle:['Heavy Wrench','Reinforced Work Vest'],Bram:['Claw Hammer','Reinforced Jacket'],
 Deke:['Tire Iron','Padded Jacket'],Patch:['Heavy Wrench','Padded Jacket'],Tess:['Reinforced Pipe','Reinforced Work Vest'],
 Flint:['Tempered Steel Pipe','Reinforced Jacket'],Sable:['Balanced Hunting Knife','Tempered Leather Armor'],Cricket:['Claw Hammer','Reinforced Work Vest'],
 Rowan:['Reinforced Pipe','Advanced Relay Vest'],Harlow:['Specialized Service Revolver','Padded Tactical Jacket'],Bolt:['Heavy Wrench','Insulated Patrol Coat'],
 Crowley:['Bluefang Hunting Knife','Hardened Scavenger Coat'],Mercer:['Precision Hunting Rifle',"Highway Warden's Coat"],Finch:['Tempered Combat Machete','Salvaged Security Vest'],
 Vale:['Balanced Hunting Knife','Insulated Patrol Coat'],Bishop:['Tempered Steel Pipe','Salvaged Security Vest'],Wren:['Specialized Service Revolver',"Highway Warden's Coat"],Cutter:['Iron Reaper','Hardened Scavenger Coat']
};
const r11Profile=v50Profile;v50Profile=function(w){
 const old=ws(w.name).profile,p=r11Profile(w);if(old)return p;
 const kit=R11_WANDERER_KITS[w.name];if(kit)[p.weapon,p.armor]=kit;
 const i=wanderers.indexOf(w),goods={Medic:['Bandage','Cloth','Energy Bars'],Mechanic:['Scrap Metal','Wire','Cloth'],Trader:['Energy Bars','Bandage','Tent'],Guard:['Bandage','Scrap Metal','Cloth'],Scavenger:['Scrap Metal','Wire','Cloth'],Cook:['Energy Bars','Cloth','Wire']}[p.occupation]||['Wire','Cloth','Bandage'];
 p.stock=goods.map((name,j)=>({name,qty:1+Math.floor(i/3**j)%3,price:VENDOR_BASE[name]||Math.max(1,(V48_LOOT_PRICES[name]||2)*2)}));return p;
};
const R11_PERSONAL_LINES={
 Hollis:'Count the exits before you count the people. Old habit. Still useful.',June:'A clean needle is worth more than a sharp knife. Usually.',Ash:'Keep your voice down. The road hears enough already.',
 Moss:'That rust is young. Give it another season and the whole axle will bloom.',Vera:'If you want a fair deal, count it with me. Twice.',Lark:'Those tracks have six toes. Or somebody has very expensive boots.',
 Rook:'A wall is just a promise until somebody stands on it.',Kettle:'I can make soup from that. I did not say you would enjoy it.',Bram:'Words are light. Show me what you carried here.',
 Deke:'Never lost a fair fight. Had the sense to avoid most of them.',Patch:'Throw that washer away and I will make you fetch it.',Tess:'People remember a bad edge longer than a good price.',
 Flint:'A broken machine tells you exactly what it needs. People take longer.',Sable:'Never take the brightest path just because somebody lit it for you.',Cricket:'You hear a rattle. I hear a part that has not given up yet.',
 Rowan:'I marked the safe ground with stones. Someone took the stones.',Harlow:'A promise goes in the book at the same price as a lie: nothing, until paid.',Bolt:'Do not touch the bare end. I used to have to explain that less often.',
 Crowley:'The birds leave before the weather turns. I try to learn from professionals.',Mercer:'Everybody has a price. The interesting ones know when to stop counting.',Finch:'I save the thin wire. Strong things do not always look it.',
 Vale:'An old road map makes a good bandage wrapper. It finally gets somebody home.',Bishop:'I do not need the high ground. I need to know who is already on it.',Wren:'Small tools. Quiet work. You can keep the speeches.',Cutter:'Keep the blade oiled. Keep your reasons to yourself.'
};
const r11Dialogue=wandererDialogue;wandererDialogue=function(w){
 if(!R11_PERSONAL_LINES[w.name])return r11Dialogue(w);
 const st=ws(w.name),pool=[...w.lines,`${w.name.toUpperCase()} > ${R11_PERSONAL_LINES[w.name]}`];let line=pool[Math.floor(Math.random()*pool.length)];if(line===st.lastLine)line=pool[(pool.indexOf(line)+1)%pool.length];st.lastLine=line;st.talks++;return line;
};
r11Migrate();
