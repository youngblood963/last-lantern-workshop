// Seaport rebuilding. All ownership belongs to this player's existing save.
const PORT_STAFF_ROLES={clinic:{name:'Clinic',job:'Medic',skill:'medicine'},'general store':{name:'General Store',job:'Trader',skill:'trading'},workshop:{name:'Workshop',job:'Mechanic',skill:'mechanics'},bank:{name:'Bank',job:'Banker',skill:'banking'}};
function r18EnsureEli(){if(!player.flags.r18EliRescued||player.flags.seaport55?.freed!==true)return;let w=wandererByName('Eli Mercer');if(!w){w={name:'Eli Mercer',level:6,definitionLevel:6,occupation:'Mechanic',vibe:'practical',lines:['ELI > I can keep a machine running if you give me the parts.','Eli checks the tools in his battered county bag.']};wanderers.push(w);}if(!Number.isInteger(w.definitionLevel))w.definitionLevel=6;if(typeof v50EnsureWandererLevel==='function')v50EnsureWandererLevel(w);const st=ws(w.name);if(!st.seaportAptitudes)st.seaportAptitudes={medicine:2,trading:2,mechanics:5,banking:2};if(!Object.prototype.hasOwnProperty.call(wandererLocations,w.name))wandererLocations[w.name]='road';}
function r18QuestNpcAllowed(name){const f=player.flags;if(f.seaport55?.freed!==true)return false;if(name==='Eli Mercer')return !!f.r18EliRescued;if(name==='Enid')return !!f.r18EnidLanternPromised;if(name==='Owen Mercer')return f.r18OilOutcome==='rescued';return true;}
function r18EnsureQuestNpc(name,lines,aptitudes){if(!r18QuestNpcAllowed(name))return;let w=wandererByName(name);if(!w){w={name,level:6,definitionLevel:6,occupation:'Mechanic',vibe:'practical',lines};wanderers.push(w);}if(!Number.isInteger(w.definitionLevel))w.definitionLevel=6;if(typeof v50EnsureWandererLevel==='function')v50EnsureWandererLevel(w);const st=ws(name);if(!st.seaportAptitudes)st.seaportAptitudes={...aptitudes};if(!Object.prototype.hasOwnProperty.call(wandererLocations,name))wandererLocations[name]='road';}
function r18EnsureOtherRescues(){r18EnsureQuestNpc('Enid',['ENID > A little metal and patience can build more than you think.','Enid checks the tools in her bag.'],{medicine:2,trading:3,mechanics:5,banking:2});r18EnsureQuestNpc('Owen Mercer',['OWEN > I know my way around a broken pump.','Owen checks the fasteners on his repair kit.'],{medicine:2,trading:2,mechanics:4,banking:3});}
const r18OldWandererAlive=wandererAlive;wandererAlive=function(w){if(w&&['Eli Mercer','Enid','Owen Mercer'].includes(w.name)&&!r18QuestNpcAllowed(w.name))return false;return r18OldWandererAlive(w);};
function portRecruitUnlocked(){const unlocked=player.flags.seaport55?.freed===true;if(unlocked){r18EnsureEli();r18EnsureOtherRescues();}return unlocked;}
function portStaffState(){return player.flags.seaportStaff||(player.flags.seaportStaff={hired:[],assignments:{}});}
function portIsHired(name){return !!player.flags.seaportStaff?.hired.includes(name);}
function portRecruitEligible(w){return !!w&&wandererAlive(w)&&!portIsHired(w.name);}
function portAptitudes(w){
 if(!Number.isInteger(w.definitionLevel))w.definitionLevel=6;if(typeof v50EnsureWandererLevel==='function')v50EnsureWandererLevel(w);const st=ws(w.name);if(!st.seaportAptitudes){
  // Stable identities, independent of menu redraws/random encounters; persist once.
  const rows=[[2,4,2,5],[2,2,5,3],[3,3,2,4],[2,4,3,2],[5,2,2,3],[2,3,4,2],[3,2,5,1],[2,5,2,4],[1,3,4,2],[3,2,2,5],[2,3,5,2],[4,5,2,3],[2,3,5,2],[2,4,3,3],[2,5,2,4],[3,4,4,2],[5,2,2,3],[2,3,5,2],[2,5,2,4],[2,5,2,3],[3,2,2,5],[2,3,3,4],[2,2,3,5],[3,3,2,4],[3,2,4,3]];
  const row=rows[wanderers.findIndex(x=>x.name===w.name)]||[3,3,3,3];
  st.seaportAptitudes=Object.fromEntries(['medicine','trading','mechanics','banking'].map((k,i)=>[k,row[i]]));
 }return st.seaportAptitudes;
}
function portHireCost(w){if(w?.name==='Enid'&&player.flags.r18EnidLanternPromised)return 0;return 60+v50Profile(w).level*10;}
function portStaffAssignment(name){return Object.keys(portStaffState().assignments).find(k=>portStaffState().assignments[k]===name);}
function portStaffRating(role){const name=portStaffState().assignments[role],w=wandererByName(name);return w&&portIsHired(name)?portAptitudes(w)[PORT_STAFF_ROLES[role].skill]:0;}
function portStaffSave(){updateHud();v49Autosave();}
function portRecruitIntro(){if(!portRecruitUnlocked()||player.flags.seaportRecruitIntro)return;player.flags.seaportRecruitIntro=true;add('Kaiden > Freedom bought us a chance, but four buildings stand empty. Ask the wanderers on the road if they will help. INSPECT reveals their strengths; RECRUIT offers a one-time hiring payment. Bring them here and choose a job.','bright');}
function portStaffChoices(title,options){add(title,'place');v53Choices(options);}
function portHireMenu(){const q=player.flags.portHireOffer;if(!q)return;const w=wandererByName(q.name);if(!w)return;portStaffChoices(`HIRE ${w.name.toUpperCase()} — ${portHireCost(w)} BOLTS ONCE`,['CONFIRM HIRE','CANCEL HIRE']);}
function portStaffOpen(role){if(!portRecruitUnlocked())return false;player.flags.portStaffUI={role,page:'main'};stage='port55Service';portStaffRender();return true;}
function portStaffRender(){
 if(!portRecruitUnlocked()){stage='seaport';port55Menu();return;}
 const ui=player.flags.portStaffUI||(player.flags.portStaffUI={role:'clinic',page:'main'}),role=ui.role,def=PORT_STAFF_ROLES[role];
 if(!def){stage='seaport';port55Menu();return;}
 const state=portStaffState(),assigned=state.assignments[role],rating=portStaffRating(role);
 add(`SEAPORT — ${def.name.toUpperCase()}`,'place');
 add(assigned?`${def.job}: ${assigned} — ${ws(assigned).seaportInspected?def.skill.toUpperCase()+' '+rating+'/5':'APTITUDE UNKNOWN — INSPECT STAFF '+assigned}`:'NEED TO HIRE — Recruit a wanderer, then assign them here.','system');
 if(ui.page==='assign'){
  const available=state.hired.filter(n=>!portStaffAssignment(n)||portStaffAssignment(n)===role);
  available.forEach(n=>{const a=portAptitudes(wandererByName(n));add(`${n} — ${ws(n).seaportInspected?`${def.skill} ${a[def.skill]}/5`:'aptitude unknown — INSPECT STAFF '+n}`, 'bright');});
  portStaffChoices('ASSIGN A WANDERER',[...available.flatMap(n=>['INSPECT STAFF '+n.toUpperCase(),'ASSIGN '+n.toUpperCase()]),'BACK']);return;
 }
 if(ui.page==='unassign'){portStaffChoices(`REMOVE ${assigned} FROM ${def.name.toUpperCase()}?`,['CONFIRM UNASSIGNMENT','CANCEL UNASSIGNMENT']);return;}
 if(ui.page==='replace'){portStaffChoices(`REPLACE ${assigned||'VACANCY'} WITH ${ui.candidate}?`,['CONFIRM ASSIGNMENT','CANCEL ASSIGNMENT']);return;}
 if(!rating){portStaffChoices('STAFFING',[...(role==='workshop'?['TOMORROW PROJECT TERMINAL']:[]),'ASSIGN STAFF','RETURN TO HARBOR']);return;}
 if(ui.page==='saleConfirm'){portStaffChoices(`SELL 1 ${ui.item} — ${ui.price} BOLTS?`,['CONFIRM STORE SALE','CANCEL STORE SALE']);return;}
 if(ui.page==='sell'){const items=player.pack.filter(i=>v48SellPrice(i)>0);portStaffChoices('SELL ONE ITEM — EQUIPPED, QUEST AND LEGENDARY ITEMS PROTECTED',[...items.map(i=>'SELL '+r18ItemLabel(i).toUpperCase()),'BACK']);return;}
 if(ui.page==='equipment'){
  const stock=regionalEquipmentStock('seaport');for(const slot of stock.slots)add(regionalEquipmentText(slot,'seaport'),GEAR[slot.name]?.rarity||'system');
  portStaffChoices('EQUIPMENT — PRICE PER ITEM',[...stock.slots.filter(x=>!x.sold).map(x=>'BUY '+x.name.toUpperCase()),'BACK']);return;
 }
 if(ui.page==='buy'){portStaffChoices('SUPPLIES — PRICE PER ITEM',[...Object.keys(portStoreStock()).filter(n=>portStoreStock()[n]>0).map(n=>`BUY ${n.toUpperCase()} — ${portStorePrice(n)} BOLTS (${portStoreStock()[n]} LEFT)`),'BACK']);return;}
 if(ui.page==='stash'||ui.page==='retrieve'){
  const items=ui.page==='stash'?player.pack.filter(v48Ordinary):player.stash;
  portStaffChoices(ui.page.toUpperCase()+' ITEMS',[...items.map(i=>`${ui.page.toUpperCase()} ${i.name.toUpperCase()} — ×${i.qty}`),'BACK']);return;
 }
 if(ui.page==='money'){add(`CARRIED ${player.bolts} / BANKED ${player.bankBolts}. Enter a positive whole amount, or ALL, or BACK.`,'system');add(`${ui.action.toUpperCase()} — NO FEE`,'system');numberedChoices={};currentHotkeys={b:'back'};return;}
 if(ui.page==='craft'){
  const job=player.flags.v49MurphyJob;
  if(job){const recipe=CRAFT_RECIPES[job.key];add(`${recipe?.name||'Craft'} — ${Math.max(0,Math.ceil((job.endsAt-Date.now())/1000))} SECONDS REMAINING`,'system');portStaffChoices('WORKBENCH',['COLLECT CRAFT','BACK']);return;}
  if(!player.flags.v49RecipeBandage)add('Learn crafting from Forge before using these recipes.','bright');
  const keys=player.flags.v49RecipeBandage?Object.keys(CRAFT_RECIPES).filter(k=>!CRAFT_RECIPES[k].minLevel||player.level>=CRAFT_RECIPES[k].minLevel):[];
  keys.forEach(k=>{const r=CRAFT_RECIPES[k];add(`${r.name}: ${r.cloth||0} Cloth, ${r.scrap||0} Scrap Metal, ${r.wire||0} Wire, ${r.bolts} Bolts; ${portCraftSeconds(r)} sec; ${Math.round(r.chance*100)}% success`,'bright');});
  portStaffChoices('EXISTING CRAFT RECIPES',[...keys.map(k=>'CRAFT '+CRAFT_RECIPES[k].name.toUpperCase()),'BACK']);return;
 }
 let options;
 if(role==='clinic'){add(`Treatment: ${Economy.medicalRate(rating)} HP per Bolt; pay only for needed treatment. Full recovery clears the death penalty.`,'bright');options=['TREAT WOUNDS','BUY BANDAGE — '+portClinicBandagePrice()+' BOLTS'];}
 if(role==='general store'){add(`Trade discount/bonus: ${(rating-1)*2}%. Stock refreshes on the existing daily refill clock.`,'bright');options=['BUY SUPPLIES','BUY EQUIPMENT','SELL ITEMS'];}
 if(role==='workshop'){add(`Crafting time reduction: ${(rating-1)*2}%. Existing recipe gates, materials and success chances apply. Use Inventory to equip or change your gear.`,'bright');options=['TOMORROW PROJECT TERMINAL','CRAFTING','MANAGE EQUIPMENT'];}
 if(role==='bank'){r7BankStatus();add(`CARRIED ${player.bolts} / BANKED ${player.bankBolts}. Shared Solace/Seaport account and storage. No transfer fees.`,'bright');options=['DEPOSIT BOLTS','WITHDRAW BOLTS','STASH ITEMS','RETRIEVE ITEMS','CHANGE NAME — 500 BOLTS'];}
 portStaffChoices('SERVICES',[...options,'INSPECT STAFF '+assigned.toUpperCase(),'ASSIGN STAFF','UNASSIGN STAFF','RETURN TO HARBOR']);
}
function portStoreStock(){
 const state=portStaffState(),period=Number(player.flags.nextRefillAt)||0;
 if(!state.stock||state.stockPeriod!==period){state.stockPeriod=period;state.stock={'Energy Bars':8,Bandage:6,Tent:3,'Scrap Metal':8,Wire:6,Cloth:6,'Emergency Trauma Kit':1};}
 return state.stock;
}
function portStorePrice(n){const base=VENDOR_BASE[n]||Math.max(1,(V48_LOOT_PRICES[n]||2)*2);return Math.max(1,Math.round(base*(1-(portStaffRating('general store')-1)*.02)));}
function portStoreSellPrice(item){return Math.floor(v48SellPrice(item)*(1+(portStaffRating('general store')-1)*.02));}
function portClinicBandagePrice(){return 18-(portStaffRating('clinic')-1)*2;}
function portBankFee(){return 0;}
function portCraftSeconds(recipe){return Math.ceil(recipe.seconds*(1-(portStaffRating('workshop')-1)*.02));}
function portStaffServiceCommand(cmd){
 const ui=player.flags.portStaffUI,role=ui?.role,def=PORT_STAFF_ROLES[role];
 if(!def||!portRecruitUnlocked()){stage='seaport';port55Menu();return true;}
 if(['return to harbor','exit','harbor'].includes(cmd)){stage='seaport';delete player.flags.portStaffUI;port55Menu();return true;}
 if(['back','b','cancel'].includes(cmd)){ui.page='main';delete ui.candidate;portStaffRender();return true;}
 if(cmd==='unassign staff'&&portStaffRating(role)){ui.page='unassign';portStaffRender();return true;}
 if(cmd==='cancel unassignment'){ui.page='main';portStaffRender();return true;}
 if(cmd==='confirm unassignment'&&ui.page==='unassign'){delete portStaffState().assignments[role];ui.page='main';portStaffSave();portStaffRender();return true;}
 if(cmd==='assign staff'){ui.page='assign';portStaffRender();return true;}
 if(cmd.startsWith('inspect staff ')){const w=wandererByName(cmd.slice(14));if(w&&portIsHired(w.name))portInspectAptitudes(w);portStaffRender();return true;}
 if(cmd.startsWith('assign ')&&ui.page==='assign'){
  const w=wandererByName(cmd.slice(7)),at=w&&portStaffAssignment(w.name);
  if(!w||!portIsHired(w.name)||at&&at!==role){add('That wanderer is unavailable.','danger');portStaffRender();return true;}
  ui.candidate=w.name;ui.page='replace';portStaffRender();return true;
 }
 if(cmd==='cancel assignment'){delete ui.candidate;ui.page='assign';portStaffRender();return true;}
 if(cmd==='confirm assignment'&&ui.page==='replace'){
  const n=ui.candidate,at=portStaffAssignment(n);
  if(portIsHired(n)&&(!at||at===role)){portStaffState().assignments[role]=n;add(`${n} is now the ${def.job}. The previous worker remains available for another job.`,'reward');}
  delete ui.candidate;ui.page='main';portStaffSave();portStaffRender();return true;
 }
 if(!portStaffRating(role)){portStaffRender();return true;}
 if(role==='clinic'){
  if(cmd==='treat wounds'){
   Economy.treat(portStaffRating(role));
  }else if(cmd==='buy bandage'){const price=portClinicBandagePrice();if(player.bolts>=price&&addPack('Bandage','consumable',1,true)){player.bolts-=price;portStaffSave();}else add('Insufficient Bolts or backpack space.','system');}
 }else if(role==='general store'){
  if(cmd==='buy supplies')ui.page='buy';else if(cmd==='buy equipment')ui.page='equipment';else if(cmd==='sell items')ui.page='sell';
  else if(cmd.startsWith('buy ')&&ui.page==='equipment'){regionalEquipmentBuy('seaport',cmd.slice(4));}
  else if(cmd.startsWith('buy ')){const n=Object.keys(portStoreStock()).find(n=>n.toLowerCase()===cmd.slice(4)),price=n&&portStorePrice(n);if(n&&portStoreStock()[n]>0&&player.bolts>=price&&addPack(n,v52ItemType(n),1,true)){player.bolts-=price;portStoreStock()[n]--;portStaffSave();}else add('Unavailable stock, insufficient Bolts, or backpack full.','system');}
  else if(cmd.startsWith('sell ')){const i=r18NamedStack(player.pack,cmd.slice(5));if(i&&v48SellPrice(i)>0){ui.item=i.name;ui.stolen=!!i.stolen;ui.price=portStoreSellPrice(i);ui.page='saleConfirm';}}
  else if(cmd==='cancel store sale')ui.page='sell';
  else if(cmd==='confirm store sale'&&ui.page==='saleConfirm'){
   const i=player.pack.find(i=>i.name===ui.item&&!!i.stolen===!!ui.stolen);if(i&&v48SellPrice(i)>0&&portStoreSellPrice(i)===ui.price&&Number.isSafeInteger(player.bolts+ui.price)){if(i.stolen&&r18SaleDetected(i,'Seaport store')){ui.page='sell';delete ui.item;delete ui.price;portStaffSave();portStaffRender();return true;}i.qty--;if(i.qty===0)player.pack.splice(player.pack.indexOf(i),1);player.bolts+=ui.price;add(`SOLD 1 ${ui.item} — ${ui.price} BOLTS`,'reward');ui.page='sell';delete ui.item;delete ui.price;portStaffSave();}else{add('Sale changed. Nothing sold.','system');ui.page='sell';}
  }
 }else if(role==='bank'){
  if(cmd==='deposit bolts'||cmd==='withdraw bolts'){ui.page='money';ui.action=cmd.split(' ')[0];}
  else if(ui.page==='money'){
   const source=ui.action==='deposit'?player.bolts:player.bankBolts,n=cmd==='all'?source:/^\d+$/.test(cmd)?Number(cmd):NaN;
   if(Number.isSafeInteger(n)&&n>0&&n<=source){if(v48BankMoney(ui.action,n))portStaffSave();}
   else add('Invalid amount or insufficient balance. Deposits and withdrawals are free.','system');
  }else if(cmd==='stash items')ui.page='stash';else if(cmd==='retrieve items')ui.page='retrieve';
  else if(cmd.startsWith('stash ')){if(v48Stash(cmd.slice(6)))portStaffSave();}
  else if(cmd.startsWith('retrieve ')){if(v48Retrieve(cmd.slice(9)))portStaffSave();}
 }else if(role==='workshop'){
  if(cmd==='crafting')ui.page='craft';
  else if(cmd==='manage equipment'){openInterface('inventory');return true;}
  else if(cmd.startsWith('craft ')){
   const key=Object.keys(CRAFT_RECIPES).find(k=>CRAFT_RECIPES[k].name.toLowerCase()===cmd.slice(6)),r=CRAFT_RECIPES[key];
   if(r&&player.flags.v49RecipeBandage&&(!r.minLevel||player.level>=r.minLevel)&&!player.flags.v49MurphyJob){
    if(['cloth','scrap','wire'].every(k=>r6MaterialCount({cloth:'Cloth',scrap:'Scrap Metal',wire:'Wire'}[k])>=(r[k]||0))&&player.bolts>=r.bolts){
     for(const [k,n]of Object.entries({cloth:'Cloth',scrap:'Scrap Metal',wire:'Wire'}))if(r[k])r6ConsumeMaterial(n,r[k]);
     player.bolts-=r.bolts;player.flags.v49MurphyJob={key,endsAt:Date.now()+portCraftSeconds(r)*1000,success:Math.random()<r.chance};portStaffSave();
    }else add('Not enough materials or Bolts.','danger');
   }ui.page='craft';
  }else if(cmd==='collect craft'){
   const job=player.flags.v49MurphyJob,r=job&&CRAFT_RECIPES[job.key];
   if(job&&r&&Date.now()>=job.endsAt){if(!job.success){add('Craft failed. Materials were consumed.','system');delete player.flags.v49MurphyJob;portStaffSave();}else if(addPack(r.name,r.type,1,true)){delete player.flags.v49MurphyJob;portStaffSave();}else add('Finished item held at workbench. Free a backpack slot.','system');}
  }
 }
 portStaffRender();return true;
}
function portInspectAptitudes(w){if(!portRecruitUnlocked()||!w)return;ws(w.name).seaportInspected=true;const a=portAptitudes(w);add(`${w.name} — APTITUDES (1 novice, 3 capable, 5 expert): ${Object.entries(a).map(([k,v])=>k+' '+v+'/5').join('; ')}. Strength: ${Object.keys(a).reduce((x,y)=>a[x]>=a[y]?x:y)}; weakness: ${Object.keys(a).reduce((x,y)=>a[x]<=a[y]?x:y)}.`,'bright');}
function portRecruitCommand(cmd){
 if(/^(?:save|load)(?: |$)/.test(cmd)||['testing','test off'].includes(cmd))return false;
 if(stage==='port55Service')return portStaffServiceCommand(cmd);
 if(stage==='port55Recruit'){
  const offer=player.flags.portHireOffer,w=offer&&wandererByName(offer.name);
  if(!portRecruitUnlocked()||!offer||!w){delete player.flags.portHireOffer;stage='seaport';port55Menu();return true;}
  if(cmd==='confirm hire'){
   const present=offer.origin==='wandererRoad'?currentRoadWanderer===w.name:currentTownWanderer===w.name;
   if(present&&portRecruitEligible(w)&&player.bolts>=portHireCost(w)){
    player.bolts-=portHireCost(w);portStaffState().hired.push(w.name);wandererLocations[w.name]='seaport';
    delete player.flags.v50Trade;delete player.flags.v50Sale;delete player.flags.v53Sale;delete player.flags.v48Sale;
    delete player.flags.portHireOffer;add(`${w.name} heads for Seaport. Assign a job at one of the four buildings.`,'reward');
    if(offer.origin==='wandererRoad'){currentRoadWanderer=null;completeRoadTurn();}else{currentTownWanderer=null;townWandererFocus=null;stage='mercy';showCurrentContext();}
    portStaffSave();return true;
   }add('Hiring could not be completed. No Bolts charged.','danger');
  }
  if(['cancel hire','back','b','cancel','exit'].includes(cmd)||cmd==='confirm hire'){
   delete player.flags.portHireOffer;stage=offer.origin;v53WandererMenu(w,stage==='wandererRoad');return true;
  }portHireMenu();return true;
 }
 if(!portRecruitUnlocked())return false;
 if(stage==='seaport'){
  const role=Object.keys(PORT_STAFF_ROLES).find(k=>cmd===k||cmd.startsWith(k+' —'));
  if(role)return portStaffOpen(role);
 }
 if(!['wandererRoad','mercy'].includes(stage)||player.flags.v50Trade||pendingTownFight||player.flags.v53Sale)return false;
 const w=wandererByName(stage==='wandererRoad'?currentRoadWanderer:townWandererFocus);
 if(w&&(cmd==='recruit'||cmd==='recruit '+w.name.toLowerCase())&&portRecruitEligible(w)){
  player.flags.portHireOffer={name:w.name,origin:stage};stage='port55Recruit';portHireMenu();return true;
 }
 return false;
}
// Extend the canonical encounter menu, retaining all established interactions.
const portStaffOldMenu=v53WandererMenu;
v53WandererMenu=function(w,road){
 if(!portRecruitUnlocked()||!portRecruitEligible(w))return portStaffOldMenu(w,road);
 const suffix=road?'':' '+w.name.toUpperCase();
 v53Choices(['TALK'+suffix,...(!v50Profile(w).hostile?['BROWSE WARES'+suffix]:[]),'STEAL'+(road?'':' FROM '+w.name.toUpperCase()),'INSPECT'+suffix,'RECRUIT'+suffix,'FIGHT'+suffix,road?'MOVE ON':'LEAVE']);
};
const portStaffOldInspect=v50Inspect;v50Inspect=function(w){portStaffOldInspect(w);portInspectAptitudes(w);};
