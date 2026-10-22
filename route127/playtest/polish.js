// v48: targeted presentation and inventory/banking polish; no crafting/workshops.
const V48_BACKPACK_PRICE=75;
const V48_LOOT_PRICES={'Scrap Metal':4,Wire:3,Cloth:2,Fuel:4,Electronics:5,Chemicals:4,'Battered Flashlight':5,'Energy Bars':2,Bandage:3,Tent:3};
function v48Visits(){return player.flags.v48Visits||(player.flags.v48Visits={});}
function v48Intro(key,lines,returnText='',entered=false){const visits=v48Visits();if(!visits[key]){visits[key]=true;for(const [text,cls]of lines)add(text,cls||'')}else if(entered&&returnText)add(returnText);}
function v48NpcIntro(key,text,state='',updated=false){const visits=v48Visits(),id='npc_'+key;let first=!visits[id],changed=visits[id]!==state;if(first||changed&&updated){visits[id]=state||'visited';add(text)} }
function v48Migrate(){
 const v=v48Visits();if(player.flags.visited_amii)v.bank=true;if(player.flags.relayVisited)v.relay=true;if(player.flags.factoryAutosaveAtExterior)v.factory=true;
 if(player.flags.casino&&player.flags.casino.nextId>1)v.casino=true;
 if(player.flags.relayQuest==='complete'&&player.flags.factoryQuest!=='done')player.flags.factoryQuest='upcoming';
}
function v48Choices(labels){outputQueue=outputQueue.then(()=>{currentHotkeys={};numberedChoices={};usedHotkeys=new Set();for(const text of labels)addImmediate(hotkeyLine(text),'system');followOutput()});}
function v48Checkpoint(){if(activeSaveSlot)saveGame(activeSaveSlot);}
function v48Ordinary(item){return !!item&&Number.isSafeInteger(item.qty)&&item.qty>0&&!['key','quest'].includes(item.type)&&item.name!==player.weapon&&item.name!==player.armor&&item.name!==player.accessory;}
function v48SellPrice(item){
 if(!v48Ordinary(item))return 0;const gear=GEAR[item.name];
 if(gear){if(gear.rarity==='legendary'||!['common','uncommon','rare','epic'].includes(gear.rarity))return 0;const defaults={common:{weapon:12,armor:10,accessory:18},uncommon:{weapon:50,armor:45,accessory:60},rare:{weapon:125,armor:135,accessory:125},epic:{weapon:320,armor:340,accessory:320}};const base=VENDOR_BASE[item.name]||defaults[gear.rarity][gear.type];return Number.isFinite(base)&&base>0?Math.max(1,Math.floor(base*.25)):0;}
 return ['material','consumable','tool','supply'].includes(item.type)?V48_LOOT_PRICES[item.name]||0:0;
}
function v48SaleMenu(){
 player.flags.v48Shop='sell';add('SELL CARRIED ITEMS','place');
 const pending=player.flags.v48Sale;
 if(pending){add(`SELL ${gearLabel(pending.name)} ×${pending.qty} FOR ${pending.total} BOLTS?`,'system');v48Choices(['CONFIRM SALE','CANCEL SALE']);return;}
 const items=player.pack.filter(i=>v48SellPrice(i)>0);if(!items.length)add('No eligible ordinary loot or unequipped equipment.','system');
 v48Choices([...items.map(i=>`SELL ${i.name.toUpperCase()} ×${i.qty} — ${v48SellPrice(i)*i.qty} BOLTS TOTAL`),'(B) BACK']);
}
function v48Sell(name,confirmed=false){
 const requested=String(name).trim().match(/^(.*?)\s+(?:x|×)([0-9]+)$/i);const saleName=(requested?requested[1]:name).trim();const item=player.pack.find(i=>i.name.toLowerCase()===saleName.toLowerCase()),unit=v48SellPrice(item);const quantity=requested?Number(requested[2]):item?.qty;
 if(!item||unit<=0||!Number.isSafeInteger(quantity)||quantity<=0||quantity>item.qty||!Number.isSafeInteger(unit*quantity)||!Number.isSafeInteger(player.bolts+unit*quantity)){add('That item cannot be sold. Equipped, quest and Legendary items are protected.','system');return false;}
 const quote=player.flags.v48Sale;
 if(confirmed&&(!quote||quote.name!==item.name||quote.type!==item.type||quote.qty!==quantity||quote.total!==unit*quantity)){delete player.flags.v48Sale;add('The sale changed. Nothing sold; choose the item again.','system');return false;}
 if(!confirmed&&['rare','epic'].includes(GEAR[item.name]?.rarity)){player.flags.v48Sale={name:item.name,type:item.type,qty:quantity,total:unit*quantity};v48SaleMenu();return false;}
 const total=unit*quantity;delete player.flags.v48Sale;item.qty-=quantity;if(item.qty===0)player.pack.splice(player.pack.indexOf(item),1);player.bolts+=total;updateHud();add(`SOLD — ${item.name} ×${quantity} / +${total} BOLTS`,'reward');v48Checkpoint();return true;
}
function v48BuyBackpack(){
 if(player.packMax>=10){add('Your backpack already holds at least 10 slots. No purchase needed.','system');return false;}
 if(!Number.isSafeInteger(player.bolts)||player.bolts<V48_BACKPACK_PRICE){add(`INSUFFICIENT BOLTS — 10-slot backpack costs ${V48_BACKPACK_PRICE}.`,'system');return false;}
 const addedSlots=10-player.packMax;player.bolts-=V48_BACKPACK_PRICE;player.packMax=10;updateHud();add(`10-SLOT BACKPACK PURCHASED — +${addedSlots} SLOTS / -${V48_BACKPACK_PRICE} BOLTS`,'reward');v48Checkpoint();showPurchaseComplete();return true;
}
function v48BankCapacity(){return Number.isSafeInteger(player.stashMax)&&player.stashMax>=0?player.stashMax:Infinity;}
function v48Stash(name){
 const item=player.pack.find(i=>i.name.toLowerCase()===name.toLowerCase().trim());if(!v48Ordinary(item)){add('Equipped and quest items cannot be deposited.','system');return false;}
 const existing=player.stash.find(i=>i.name===item.name&&i.type===item.type);
 if(!existing&&player.stash.length>=v48BankCapacity()){add(`COULD NOT FIT — ${item.name}`,'system');return false;}
 if(existing&&!Number.isSafeInteger(existing.qty+item.qty)){add('Invalid storage quantity. Nothing moved.','system');return false;}
 if(existing)existing.qty+=item.qty;else player.stash.push({...item});player.pack.splice(player.pack.indexOf(item),1);updateHud();add(`DEPOSITED ITEM — ${item.name} ×${item.qty}`,'reward');return true;
}
function v48Retrieve(name){
 const item=player.stash.find(i=>i.name.toLowerCase()===name.toLowerCase().trim());if(!item||!Number.isSafeInteger(item.qty)||item.qty<=0){add('No valid stored item with that exact name.','system');return false;}
 const existing=player.pack.find(i=>i.name===item.name&&i.type===item.type);
 if(!existing&&!['key','quest'].includes(item.type)&&packSlotsUsed()>=player.packMax){add('Your backpack is full. Nothing moved.','system');return false;}
 if(existing&&!Number.isSafeInteger(existing.qty+item.qty)){add('Invalid quantity. Nothing moved.','system');return false;}
 if(existing)existing.qty+=item.qty;else player.pack.push({...item});player.stash.splice(player.stash.indexOf(item),1);updateHud();add(`RETRIEVED ITEM — ${item.name} ×${item.qty}`,'reward');return true;
}
function v48BulkStash(){let moved=0,missed=0;for(const item of [...player.pack].filter(v48Ordinary)){if(v48Stash(item.name))moved++;else missed++}add(`DEPOSIT ALL ITEMS — ${moved} STACKS MOVED; ${missed} COULD NOT FIT. Equipped and quest items remain protected.`,'system');return moved;}
function v48BankMain(entered=false){
 mercyLocation='amii';player.flags.solaceMenu='bank48';player.flags.v48BankPage='main';add("SOLACE SAVINGS & LOAN",'place');if(entered)showWanderersAt('amii');
 v48Intro('bank',[["The old municipal records office has been rebuilt into the most secure room in Solace. Plate steel covers the windows and a reinforced cage surrounds the counter."],["Amii looks up and gives you a slightly awkward but friendly wave."],["Two massive junkyard dogs lounge beside the counter. Niko thumps his tail. Alex just watches you."],["AMII > Don't worry. They're friendly.",'bright'],['Alex gives a low rumble.'],['AMII > ...mostly.','bright']],'Amii nods from behind the secure counter.',entered);
 add(`CARRIED BOLTS: ${player.bolts} / BANKED BOLTS: ${player.bankBolts}`,'system');
 add('TALK opens Amii’s conversation topics; existing bank quests remain available through SMALL TALK AMII.','system');
 r7BankStatus();v48Choices(['DEPOSIT BOLTS','WITHDRAW BOLTS','STASH ITEMS','RETRIEVE ITEMS','VIEW STORAGE','TALK','CHANGE NAME — 500 BOLTS','(B) BACK']);
}
function v48BankPage(page){
 player.flags.solaceMenu='bank48';player.flags.v48BankPage=page;add({deposit:'DEPOSIT BOLTS',withdraw:'WITHDRAW BOLTS',stash:'STASH ITEMS',retrieve:'RETRIEVE ITEMS',storage:'VIEW STORAGE'}[page],'place');
 if(page==='deposit'||page==='withdraw'){add(`CARRIED ${player.bolts} / BANKED ${player.bankBolts}`,'system');add('Choose an amount, or CUSTOM AMOUNT to enter a number.','system');v48Choices([`${page.toUpperCase()} 10`,`${page.toUpperCase()} 50`,`${page.toUpperCase()} 100`,...(page==='deposit'?['DEPOSIT ALL BOLTS']:[]),`CUSTOM AMOUNT`,'(B) BACK']);return;}
 add(`BANK STORAGE: ${player.stash.length} / ${v48BankCapacity()===Infinity?'UNLIMITED':v48BankCapacity()} ITEM TYPES`,'system');
 if(page==='storage'){if(!player.stash.length)add('EMPTY','system');for(const i of player.stash)add(`${gearLabel(i.name)} ×${i.qty}`,GEAR[i.name]?.rarity||'system');v48Choices(['(B) BACK']);return;}
 const items=page==='stash'?player.pack.filter(v48Ordinary):player.stash;for(const i of items)add(`${gearLabel(i.name)} ×${i.qty}`,GEAR[i.name]?.rarity||'system');
 v48Choices([...(page==='stash'?['DEPOSIT ALL ITEMS']:[]),...items.map(i=>(page==='stash'?'STASH ':'RETRIEVE ')+i.name.toUpperCase()),'(B) BACK']);
}
function v48BankMoney(action,amount){const source=action==='deposit'?'bolts':'bankBolts',target=action==='deposit'?'bankBolts':'bolts',n=Math.min(amount,player[source]);if(!Number.isSafeInteger(amount)||amount<=0||!Number.isSafeInteger(n)||n<=0||!Number.isSafeInteger(player[target]+n)){add('Invalid amount or no available Bolts.','system');return false;}player[source]-=n;player[target]+=n;updateHud();add(`${action.toUpperCase()} — ${n} BOLTS`,'reward');v48Checkpoint();return true;}
function v48RenderContext(){
 if(player.flags.v48Shop==='sell'&&['johnny','wayne','jen'].includes(mercyLocation)){v48SaleMenu();return true;}
 if(mercyLocation==='amii'&&player.flags.solaceMenu==='bank48'){const page=player.flags.v48BankPage;if(page&&page!=='main')v48BankPage(page);else v48BankMain();return true;}return false;
}
function handleV48Command(cmd){
 if(stage!=='mercy')return false;
 if(player.flags.relayQuest==='complete'&&/relay/.test(cmd)&&['murphy','tim','jen','wayne','johnny','amii'].includes(mercyLocation)&&cmd!=='claim relay reward'){add(`${mercyLocation.toUpperCase()} > The Relay is operational. The Factory is the next objective; its interior is not open yet.`,'bright');return true;}
 if(mercyLocation==='murphy'&&cmd==='ask about relay parts'&&player.flags.relayQuest!=='complete'){add('MURPHY > Johnny has a conductor. Search the maintenance yard, Lower Access Road and the equipment rack by the Factory gate for the other parts.','bright');return true;}
 if(cmd.startsWith('sell ')&&!['johnny','wayne','jen'].includes(mercyLocation)){add('Visit a vendor to sell carried items.','system');return true;}
 const vendor=['johnny','wayne','jen'].includes(mercyLocation);
 if(vendor&&player.flags.v48Shop==='sell'){
  if(['back','b','town','return to town','buy'].includes(cmd)){delete player.flags.v48Sale;delete player.flags.v48Shop;if(cmd.includes('town')){mercyLocation='town';mercyMenu()}else if(mercyLocation==='johnny')johnnyShop();else if(mercyLocation==='jen')showBarActions();else{add('BUY BANDAGE   SELL ITEMS   TALK TO WAYNE   (B) BACK','system')}return true;}
  if(cmd==='cancel sale'||cmd==='no'){delete player.flags.v48Sale;v48SaleMenu();return true;}
  if(cmd==='confirm sale'||cmd==='yes'){const q=player.flags.v48Sale;if(q)v48Sell(`${q.name} x${q.qty}`,true);v48SaleMenu();return true;}
  if(cmd.startsWith('sell ')){v48Sell(cmd==='sell all scrap'?'Scrap Metal':cmd.slice(5).replace(/\s+[—–-]\s+.*$/,'').trim());if(!player.flags.v48Sale)v48SaleMenu();return true;}v48SaleMenu();return true;
 }
 if(vendor&&['sell','sell items'].includes(cmd)){v48SaleMenu();return true;}
 if(vendor&&cmd.startsWith('sell ')){v48Sell(cmd==='sell all scrap'?'Scrap Metal':cmd.slice(5).split(' ×')[0].trim());if(!player.flags.v48Sale)v48SaleMenu();return true;}
 if(vendor&&cmd==='buy'){if(mercyLocation==='johnny')johnnyShop();else if(mercyLocation==='jen')showDrinkMenu();else add('BUY BANDAGE   SELL ITEMS   (B) BACK','system');return true;}
 if(cmd.includes('sell')){add('Choose SELL ITEMS or type SELL followed by an exact listed item name.','system');return true;}
 if(mercyLocation==='johnny'&&/^buy (?:10-slot )?backpack$/.test(cmd)){v48BuyBackpack();return true;}
 if(['bank','bank stash','amii','visit bank'].includes(cmd)){delete player.flags.v48Shop;v48BankMain(true);return true;}
 const bankWords=/^(?:deposit|withdraw|stash|retrieve|view storage|view stash)/.test(cmd);
 if(bankWords&&mercyLocation!=='amii'){add("Visit Amii's bank for transactions.",'system');return true;}
 if(mercyLocation==='amii'&&cmd==='talk'){player.flags.v55AmiiTalk=true;add('AMII — TALK','place');v48Choices(['ASK ABOUT BANKING','ASK ABOUT NIKO AND ALEX','PET NIKO','PET ALEX',...(player.flags.nikoPendingRewards?.length?['CLAIM NIKO GIFT']:[]),'(B) BACK']);return true;}
 if(mercyLocation==='amii'&&player.flags.v55AmiiTalk){
  if(cmd==='b'||cmd==='back'){delete player.flags.v55AmiiTalk;v48BankMain();return true;}
  if(cmd==='ask about banking'){add('AMII > Bolts stored here stay safe, even when the road does not.','bright');return true;}
  if(cmd==='ask about niko and alex'){add('Niko thumps his tail. Alex keeps watching. AMII > They take their jobs seriously. Especially Alex.','bright');return true;}
  if(cmd==='pet alex'){add('Alex sniffs your hand, then gives one sharp, pleased bark. No damage, no fuss. AMII > That is practically a love letter from him.','bright');return true;}
  if(cmd==='claim niko gift'){const pending=player.flags.nikoPendingRewards||[];const item=pending[0];if(!item){add('No Niko gift is waiting.','system');return true;}if(addPack(item,GEAR[item]?.type||'quest')){pending.shift();add(`CLAIMED NIKO'S GIFT — ${gearLabel(item)}`,'reward');if(!pending.length)delete player.flags.nikoPendingRewards;}else add('Make room in your pack before claiming the gift.','system');return true;}
  if(cmd==='pet niko'){
   const f=player.flags;
   if(f.nikoRewardClaimed){add('Niko leans into your hand and thumps his tail. AMII > You already got his gift. He remembers you, though.','bright');return true;}
   f.nikoRewardClaimed=true;
   const roll=Math.random()*100;let reward;
   if(roll<30)reward="Niko's Lucky Vest";else if(roll<55)reward='Giant Dog Bone';else if(roll<80)reward='Rusty License Plate';else if(roll<95){const pool=Object.keys(GEAR).filter(n=>GEAR[n].rarity==='rare'&&['weapon','armor'].includes(GEAR[n].type));reward=pool[Math.floor(Math.random()*pool.length)]||"Niko's Lucky Vest";}else reward="Niko's Collar";
   if(addPack(reward,GEAR[reward]?.type||'quest'))add(`NIKO'S GIFT — ${gearLabel(reward)}`,'reward');
   else{(f.nikoPendingRewards||(f.nikoPendingRewards=[])).push(reward);add(`NIKO'S GIFT — ${reward} is being held until your pack has room.`,'reward');}
   if(reward==="Niko's Collar")add('LEGENDARY EFFECTS — +15 MAX HP, +3 DEF, +2% critical chance, and once per game day a Second Chance at 1 HP.','bright');
   if(typeof v49Autosave==='function')v49Autosave();return true;
  }
  add('Choose a conversation topic or Back.','system');return true;
 }
 if(mercyLocation==='amii'){
  const pages={'deposit bolts':'deposit','withdraw bolts':'withdraw','stash items':'stash','retrieve items':'retrieve','view storage':'storage','view stash':'storage'};
  if(pages[cmd]){v48BankPage(pages[cmd]);return true;}
  if(cmd==='deposit all items'||cmd==='deposit all unequipped gear'){v48BulkStash();v48Checkpoint();v48BankPage('stash');return true;}
  if(cmd==='custom amount'){player.flags.v49BankCustom=player.flags.v48BankPage;add(`ENTER ${String(player.flags.v49BankCustom).toUpperCase()} AMOUNT — type a whole number, or B to cancel.`,'system');return true;}
  if(player.flags.v49BankCustom){const action=player.flags.v49BankCustom;delete player.flags.v49BankCustom;if(/^\d+$/.test(cmd)){v48BankMoney(action,Number(cmd));v48BankPage(action);}else if(cmd==='b'||cmd==='back'){v48BankPage(action);}else{add('Invalid amount. Nothing transferred.','system');v48BankPage(action);}return true;}
  if(cmd==='deposit all'||cmd==='deposit all bolts'){v48BankMoney('deposit',player.bolts);v48BankPage('deposit');return true;}
  const m=cmd.match(/^(deposit|withdraw)(?: bolts)? ([0-9]+)(?: bolts)?$/);if(m){v48BankMoney(m[1],Number(m[2]));v48BankPage(m[1]);return true;}
  if(cmd.startsWith('stash ')){if(v48Stash(cmd.slice(6)))v48Checkpoint();v48BankPage('stash');return true;}
  if(cmd.startsWith('retrieve ')){if(v48Retrieve(cmd.slice(9)))v48Checkpoint();v48BankPage('retrieve');return true;}
  if(bankWords){add('Choose a bank screen or use an exact positive whole Bolt amount.','system');return true;}
  if(player.flags.solaceMenu==='bank48'&&(cmd==='back'||cmd==='b')){if(player.flags.v48BankPage!=='main')v48BankMain();else{mercyLocation='town';mercyMenu()}return true;}
 }
 return false;
}
function applyV48Colors(div,text,cls){
 if(/casino-art|v48-art|title-logo/.test(cls)||/^[─\s]+$/.test(text)||(text.includes(' ── ')&&/^[Xo](?:\s|$)/.test(text)))return;
 const upper=text.toUpperCase(),ranges=[];let base='evo-yellow';
 if(cls.includes('casino-heading'))base='npc-blue';
 for(const m of upper.matchAll(/\b(DOCKS CLERK|NESSA|MIA|KAIDEN|FORGE|MARA|TIM|MURPHY|JEN|WAYNE|JOHNNY|AMII|CRAZY STEVE|WOMAN'S VOICE|MAN'S VOICE|UNKNOWN)(?=\s*>|(?:'S)?\b)/g)){if(m.index===0||upper.slice(m.index+m[0].length).trimStart().startsWith('>'))ranges.push([m.index,m.index+m[0].length,'npc-blue']);}
 if(/^YOU HAVE FALLEN|^DEATH\b/.test(upper))base='v48-loss';
 for(const w of wanderers){if(upper.startsWith(w.name.toUpperCase()))ranges.push([0,w.name.length,'wanderer-green']);}
 for(const name of Object.keys(GEAR)){let i=upper.indexOf(name.toUpperCase());if(i>=0){let end=i+name.length,rarity=GEAR[name].rarity,tail=text.slice(end).match(/^ \[(COMMON|UNCOMMON|RARE|EPIC|LEGENDARY)\]/);if(tail)end+=tail[0].length;ranges.push([i,end,rarity==='common'?'v48-white':'rarity-'+rarity]);}}
 for(const m of upper.matchAll(/\b(THE YARDMAN|YARDMAN|SALVAGE KING|GRINDER|THE CHEMIST|THE FOREMAN|FOREMAN|TERRIBLE BILLY|THE BIG MAN)\b/g))ranges.push([m.index,m.index+m[0].length,'v48-loss']);
 for(const m of text.matchAll(/-\d+\s*HP\b/gi))ranges.push([m.index,m.index+m[0].length,'v48-loss']);
 for(const m of text.matchAll(/(?:YOU TAKE|YOU DEAL)\s+(\d+)/gi)){let start=m.index+m[0].length-m[1].length;ranges.push([start,start+m[1].length,'v48-loss']);}
 for(const m of text.matchAll(/\+\d+(?:\s*(?:HP|XP|BOLTS|SLOTS))?/gi))ranges.push([m.index,m.index+m[0].length,'v48-gain']);
 div.textContent='';let last=null,span=null;for(let i=0;i<text.length;i++){let range=ranges.find(r=>i>=r[0]&&i<r[1]),color=range?range[2]:base;if(color!==last){span=document.createElement('span');span.className=color;span.textContent='';div.append(span);last=color}span.textContent+=text[i];}
}
function renderV48CasinoFrame(box,text,game){
 if(player.level<5||!game){box.textContent=text;return;}
 box.textContent='';const colors={NIB:'v48-rat-nibbles',RUS:'v48-rat-rustbucket',SIR:'v48-rat-squeaks',CHE:'v48-rat-cheeseburger'};
 for(const line of text.split('\n')){const row=document.createElement('div');row.textContent=line;
  if(game==='rats'){let key=line.slice(0,3);if(line.startsWith('WINNER:')){const index=CASINO_RATS.findIndex(n=>line.includes(n));key=['NIB','RUS','SIR','CHE'][index]}if(colors[key])row.className=colors[key];}
  else if(game==='rps')row.className='v48-rps-art';
  else if(game==='slots')row.className=line.includes('BOLTS')?'evo-yellow':line.includes('LANTERN')?'v48-gain':line.includes('SKULL')?'v48-loss':line.includes('BLACKGLASS')?'npc-blue':'';
  box.append(row);
 }
}
function renderV48Blackjack(r,hidden){
 add(`PLAYER TOTAL: ${casinoCardTotal(r.player)} / DEALER TOTAL: ${hidden?'HIDDEN':casinoCardTotal(r.dealer)}`,'system');
 if(player.level<5){add('PLAYER: '+r.player.map(c=>c.rank+c.suit).join(' '),'system');add('DEALER: '+(hidden?r.dealer[0].rank+r.dealer[0].suit+' [HIDDEN]':r.dealer.map(c=>c.rank+c.suit).join(' ')),'system');return;}
 const epoch=casinoAnimationEpoch;outputQueue=outputQueue.then(()=>{if(epoch!==casinoAnimationEpoch)return;for(const [label,cards]of [['PLAYER',r.player],['DEALER',r.dealer]]){const group=document.createElement('div');group.textContent='';group.className='v48-card-hand';const title=document.createElement('div');title.className='v48-card-label';title.textContent=label;group.append(title);cards.forEach((c,i)=>{const face=document.createElement('div');face.textContent='';face.className='v48-card';if(hidden&&label==='DEALER'&&i>0){face.className+=' v48-card-back';face.textContent='??'}else{const rank=document.createElement('span');rank.textContent=c.rank;const suit=document.createElement('span');suit.textContent={H:'♥',D:'♦',C:'♣',S:'♠'}[c.suit];suit.className=['H','D'].includes(c.suit)?'v48-suit-red':'v48-suit-black';face.append(rank,suit)}group.append(face)});screen.appendChild(group)}followOutput()});
}
