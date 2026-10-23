// R7: local-compatible banking and identity. No network writes or cloud authority.
const R7_ACCOUNTS_KEY='route127-local-accounts-v1';
const R7_DAY_MS=86400000;
const R7_LOCAL_ID=/^(?:local|char)-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
let r7PageLock=Promise.resolve();
function r7Identity(){
 if(!player.handle)return null;
 if(!R7_LOCAL_ID.test(player.characterId||'')){
  if(!globalThis.crypto?.randomUUID)throw Error('Secure local identity generation unavailable.');
  player.characterId='local-'+crypto.randomUUID();
 }
 return player.characterId;
}
function r7ReadAccounts(){
 const raw=localStorage.getItem(R7_ACCOUNTS_KEY);
 if(!raw)return {version:1,accounts:{}};
 const db=JSON.parse(raw);
 if(db?.version!==1||!db.accounts||typeof db.accounts!=='object'||Array.isArray(db.accounts))throw Error('Local bank ledger needs recovery; existing data was retained.');
 return db;
}
function r7Rate(){const rating=portRecruitUnlocked()?portStaffRating('bank'):0;return rating>=1?100+(rating-1)*50:100;}
function r7UtcStart(time){return Math.floor(time/R7_DAY_MS)*R7_DAY_MS;}
function r7Validate(r){
 for(const key of ['principal','interest','basis','rate','nextRate','revision','wallet'])if(!Number.isSafeInteger(r[key])||r[key]<0)throw Error('Local bank ledger is invalid; no funds changed.');
 if(r.basis>5000||r.rate<100||r.rate>300||(r.rate-100)%50||r.nextRate<100||r.nextRate>300||(r.nextRate-100)%50||r.revision<1||typeof r.name!=='string'||!r.name.length||r.name.length>40||!Array.isArray(r.nameHistory)||!Number.isFinite(r.periodStart)||r.periodStart%R7_DAY_MS||!Number.isFinite(r.lastObserved))throw Error('Invalid local interest period; no funds changed.');
 if(!Number.isSafeInteger(r.principal+r.interest))throw Error('Bank balance overflow.');
}
function r7Advance(r,now,observedRate){
 r7Validate(r);
 if(!Number.isFinite(now)||now<0)throw Error('Invalid local clock.');
 if(now<r.lastObserved)return {changed:false,rollback:true,paid:0};
 let changed=false,paid=0;
 // Period boundaries are UTC midnights. Deposits join the NEXT period's basis.
 // First current-period payout may differ from later full offline periods.
 const periods=Math.floor((now-r.periodStart)/R7_DAY_MS);
 if(periods>0){
  const first=Math.floor(r.basis*r.rate/10000);
  const nextBasis=Math.min(r.principal,5000);
  const later=Math.floor(nextBasis*r.nextRate/10000);
  paid=first+(periods-1)*later;
  if(!Number.isSafeInteger(paid)||!Number.isSafeInteger(r.principal+r.interest+paid))throw Error('Interest balance overflow.');
  r.interest+=paid;r.periodStart+=periods*R7_DAY_MS;
  r.lastPayment={at:r.periodStart,amount:periods===1?first:later,total:paid,periods};
  r.basis=nextBasis;r.rate=r.nextRate;changed=true;
 }
 if(r.nextRate!==observedRate){r.nextRate=observedRate;changed=true;}
 r.lastObserved=now;
 return {changed,rollback:false,paid};
}
function r7Apply(r,restoreWallet=false){
 if(restoreWallet&&Number(player.flags.r7AccountRevision||0)<r.revision)player.bolts=r.wallet;
 player.bankBolts=r.principal+r.interest;
 player.handle=r.name;
 player.flags.r7AccountRevision=r.revision;
}
function r7Touch(){
 if(player.flags.r7IdentityEphemeral)throw Error('Save this character to a working manual slot before banking.');
 const id=r7Identity();if(!id)return null;
 const db=r7ReadAccounts(),now=Date.now();let r=db.accounts[id],created=false;
 if(!r){
  if(!Number.isSafeInteger(player.bankBolts)||player.bankBolts<0||!Number.isSafeInteger(player.bolts)||player.bolts<0)throw Error('Invalid character balances; no funds changed.');
  r={principal:player.bankBolts,interest:0,basis:0,rate:r7Rate(),nextRate:r7Rate(),periodStart:r7UtcStart(now),lastObserved:now,lastPayment:null,revision:1,wallet:player.bolts,name:player.handle,nameHistory:[]};
  db.accounts[id]=r;created=true;
 }
 r7Validate(r);
 const stale=!created&&Number(player.flags.r7AccountRevision||0)<r.revision;
 // Restoring an older financial snapshot uses the latest account commit, not another payout.
 const wallet=stale?r.wallet:player.bolts;
 const advance=r7Advance(r,now,r7Rate());
 if(created||advance.changed){if(!created)r.revision++;r.wallet=wallet;localStorage.setItem(R7_ACCOUNTS_KEY,JSON.stringify(db));}
 else if(now>=r.lastObserved){localStorage.setItem(R7_ACCOUNTS_KEY,JSON.stringify(db));}
 r7Apply(r,stale);player.bolts=wallet;
 return {...r,rollback:advance.rollback};
}
function r7Commit(mutator){
 r7Touch();const id=r7Identity(),db=r7ReadAccounts(),r=db.accounts[id];
 if(!r)throw Error('Local account is unavailable.');
 const wallet=player.bolts;if(!Number.isSafeInteger(wallet)||wallet<0)throw Error('Invalid carried balance.');
 const result=mutator(r,db,wallet);if(!result)return false;
 r7Validate(r);r.revision++;r.wallet=result.wallet;
 // Single durable JSON write is the commit. Nothing in player changes before success.
 localStorage.setItem(R7_ACCOUNTS_KEY,JSON.stringify(db));
 r7Apply(r);player.bolts=result.wallet;updateHud();v49Autosave();return true;
}
function r7WithAccountLock(fn){
 if(globalThis.navigator?.locks?.request)return navigator.locks.request('route127-local-accounts',fn);
 // Older browsers remain usable locally. This fallback serializes one page only.
 const next=r7PageLock.then(fn,fn);r7PageLock=next.catch(()=>{});return next;
}
function r7BankContext(){return stage==='mercy'&&mercyLocation==='amii'||stage==='port55Service'&&player.flags.portStaffUI?.role==='bank'&&portRecruitUnlocked()&&portStaffRating('bank')>0;}
function r7BankStatus(){
 try{
  const r=r7Touch();if(!r)return;
  add('LOCAL-ONLY BANK — no cloud sync. Other devices have separate local accounts.','system');
  add(`Deposits/withdrawals FREE. Daily rate ${(r.rate/100).toFixed(1)}%${r.nextRate!==r.rate?`; next period ${(r.nextRate/100).toFixed(1)}%`:''}.`,'system');
  add(`Principal ${r.principal} + earned interest ${r.interest}. Eligible this period: ${r.basis}/5000 Bolts.`,'system');
  const stamp=t=>new Date(t).toISOString().slice(0,16).replace('T',' ')+' UTC';
  add(r.lastPayment?`Last payment: ${stamp(r.lastPayment.at)} — ${r.lastPayment.amount} Bolts${r.lastPayment.periods>1?` (${r.lastPayment.total} total for ${r.lastPayment.periods} periods)`:''}.`:'Last payment: none.','system');
  add(`Next payment: ${stamp(r.periodStart+R7_DAY_MS)}.`,'system');
  add(`New deposits: eligible from ${stamp(r.periodStart+R7_DAY_MS)}; first payment ${stamp(r.periodStart+2*R7_DAY_MS)}.`,'system');
  add('Awards round down to whole Bolts. Withdrawals spend earned interest first.','system');
  if(r.rollback)add('Local clock moved backward. New payments wait until the previous observed time is reached. This is not server anti-cheat.','system');
  if(!globalThis.navigator?.locks?.request)add('This browser lacks shared-tab locking. Use one tab for this local bank prototype.','system');
 }catch(e){add('BANK UNAVAILABLE — '+e.message,'danger');}
}
const r7OldBankMoney=v48BankMoney;
v48BankMoney=function(action,amount){
 if(!['deposit','withdraw'].includes(action)||!Number.isSafeInteger(amount)||amount<=0){add('Invalid whole-Bolt amount.','system');return false;}
 try{
  let moved=0;const ok=r7Commit((r,db,wallet)=>{
   const source=action==='deposit'?wallet:r.principal+r.interest,n=Math.min(amount,source);
   if(n<=0)return false;moved=n;
   if(action==='deposit'){
    if(!Number.isSafeInteger(r.principal+r.interest+n))return false;
    r.principal+=n;return {wallet:wallet-n};
   }
   if(!Number.isSafeInteger(wallet+n))return false;
   const earned=Math.min(n,r.interest);r.interest-=earned;r.principal-=n-earned;
   r.basis=Math.min(r.basis,r.principal);
   return {wallet:wallet+n};
  });
  add(ok?`${action.toUpperCase()} — ${moved} BOLTS — NO FEE`:'Invalid amount or no available Bolts.',ok?'system':'danger');return ok;
 }catch(e){add('Bank transaction failed; no transfer committed. '+e.message,'danger');return false;}
};
const r7BankMain=v48BankMain;v48BankMain=function(entered){try{r7Touch();}catch(e){}r7BankMain(entered);};
const r7StaffRender=portStaffRender;portStaffRender=function(){const bank=r7BankContext();if(bank){try{r7Touch();}catch(e){}}r7StaffRender();if(bank&&player.flags.portStaffUI?.page!=='main')r7BankStatus();};
function r7NameError(value){
 if(!/^[A-Za-z][A-Za-z0-9 '\-]{2,19}$/.test(value)||/ {2}|[-']{2}/.test(value)||value!==value.trim())return 'Use 3–20 ASCII letters, digits, spaces, apostrophes or hyphens; begin with a letter.';
 const key=value.toLowerCase().replace(/[ '\-]/g,'');
 if(['admin','administrator','system','server','moderator','unknown','null','undefined','amii','mia','forge','tim','murphy','wayne','johnny','jen','kaiden','nessa'].includes(key)||/fuck|shit|nazi|hitler/.test(key))return 'That name is reserved or unsuitable.';
 if(value.toLowerCase()===player.handle.toLowerCase())return 'That is already your name.';
 return '';
}
function r7NameAvailable(name,db){
 const key=name.toLowerCase(),id=r7Identity();
 if(Object.entries(db.accounts).some(([other,r])=>other!==id&&r.name?.toLowerCase()===key))return false;
 for(const slot of [1,2,3]){const p=getSaveData(slot)?.player;if(p&&p.characterId!==id&&p.handle?.toLowerCase()===key)return false;}
 return true;
}
function r7NameStart(){
 if(!r7BankContext())return false;
 player.flags.r7NameOrigin={stage,mercyLocation,staffUI:player.flags.portStaffUI?{...player.flags.portStaffUI}:null};
 stage='r7Name';delete player.flags.r7ProposedName;
 add(mercyLocation==='amii'?"AMII > Sure, I can change your name. But it's not strictly legal. Five hundred Bolts. Cash. No questions. And a new name won't erase what you've done.":"BANKER > Harbor records wash clean easier than reputations. Five hundred Bolts, cash. Your record stays with you.",'system');
 add(`Current name: ${player.handle}. Cost: 500 carried Bolts. Local-only identity; no global uniqueness is claimed.`,'system');
 add('Enter a proposed name (3–20 characters), or CANCEL.','system');numberedChoices={};currentHotkeys={};return true;
}
function r7NameReturn(){
 const o=player.flags.r7NameOrigin;delete player.flags.r7NameOrigin;delete player.flags.r7ProposedName;
 stage=o?.stage||'mercy';mercyLocation=o?.mercyLocation||'amii';if(o?.staffUI)player.flags.portStaffUI=o.staffUI;
 if(stage==='port55Service')portStaffRender();else v48BankMain();
}
function r7NameCommand(raw){
 const proposed=player.flags.r7ProposedName,cmd=String(raw).trim().toLowerCase();
 if(['cancel','back','b','cancel name change'].includes(cmd)){r7NameReturn();return;}
 if(proposed){
  const action=/^\d+$/.test(cmd)?numberedChoices[cmd]||cmd:cmd;
  if(action==='cancel name change'){r7NameReturn();return;}
  if(action!=='confirm name change'){add('CONFIRM NAME CHANGE or CANCEL NAME CHANGE.','system');return;}
  try{
   const error=r7NameError(proposed);if(error)throw Error(error);
   const ok=r7Commit((r,db,wallet)=>{
    if(wallet<500)throw Error('You need 500 carried Bolts.');
    if(!r7NameAvailable(proposed,db))throw Error('That name belongs to another known local character.');
    r.nameHistory.push({name:r.name,at:Date.now()});r.name=proposed;
    return {wallet:wallet-500};
   });
   if(ok){add('NAME CHANGED — '+proposed+'. 500 Bolts paid. Your permanent character ID and criminal record remain.','system');r7NameReturn();}
  }catch(e){add('Name unchanged; no rename fee charged. '+e.message,'danger');}
  return;
 }
 const value=String(raw).trim(),error=r7NameError(value);
 if(error){add(error,'system');return;}
 player.flags.r7ProposedName=value;
 add(`Change ${player.handle} → ${value} for 500 carried Bolts?`,'system');r5DirectChoices(['CONFIRM NAME CHANGE','CANCEL NAME CHANGE']);
}
const r7Snapshot=saveSnapshot;saveSnapshot=function(){r7Identity();return r7Snapshot();};
const r7Reset=resetPlayer;resetPlayer=function(){r7Reset();delete player.characterId;};
const r7Load=loadGame;loadGame=function(slot){
 const data=getSaveData(slot);
 if(data?.player&&!R7_LOCAL_ID.test(data.player.characterId||'')){
  if(!globalThis.crypto?.randomUUID){add('Local identity migration unavailable; original save retained.','system');return r7Load(slot);}
  const id='local-'+crypto.randomUUID(),key=slot==='auto'?FACTORY_AUTOSAVE_KEY:SAVE_KEYS[slot];
  try{
   const original=localStorage.getItem(key);localStorage.setItem('route127-pre-id-backup-'+id,original||JSON.stringify(data));
   if(data.player.characterId)data.player.legacyCharacterId=data.player.characterId;data.player.characterId=id;localStorage.setItem(key,JSON.stringify(data));
  }catch(e){delete player.characterId;const result=r7Load(slot);player.flags.r7IdentityEphemeral=true;add('Identity could not be persisted; original save retained. Save to a working manual slot before banking.','system');return result;}
 }
 const result=r7Load(slot);
 try{const id=r7Identity(),db=r7ReadAccounts();if(id&&db.accounts[id])r7Touch();}catch(e){add('Local bank ledger could not be loaded; no funds changed.','system');}
 if(stage==='r7Name')r7NameReturn();updateHud();return result;
};
const r7Core=handleCommandCore;handleCommandCore=async function(raw){
 if(stage==='r7Name'){r7NameCommand(raw);return;}
 const cmd=r5Mapped(raw);
 if(r7BankContext()&&cmd.startsWith('change name')){r7NameStart();return;}
 return r7Core(raw);
};
const r7Command=handleCommand;handleCommand=async function(raw){return r7WithAccountLock(async()=>{
 try{const id=r7Identity();if(id&&r7ReadAccounts().accounts[id])r7Touch();}catch(e){if(r7BankContext())add('Local bank ledger unavailable.','system');}
 await r7Command(raw);
 try{const id=r7Identity();if(id&&r7ReadAccounts().accounts[id]){r7Touch();v49Autosave();}}catch(e){}
});};
const r7Choices=renderCurrentChoices;renderCurrentChoices=function(){if(stage==='r7Name'){if(player.flags.r7ProposedName)r5DirectChoices(['CONFIRM NAME CHANGE','CANCEL NAME CHANGE']);else{add('Enter a proposed name, or CANCEL.','system');numberedChoices={};currentHotkeys={};}return;}return r7Choices();};
// Casino identity must survive display-name changes and save-slot copies.
const r7LegacyCasinoKey=r6LedgerKey;r6LedgerKey=function(){return 'route127-r7-casino-'+r7Identity()+'-'+(r6Round()?.id||'none');};
const r7NewCasinoKey=r6LedgerKey;r6LedgerKey=function(){const key=r7NewCasinoKey();try{if(!localStorage.getItem(key)){const previous=localStorage.getItem(r7LegacyCasinoKey());if(previous)localStorage.setItem(key,previous);}}catch(e){}return key;};

const r7Save=saveGame;saveGame=function(slot=activeSaveSlot){const pending=player.flags.r7IdentityEphemeral;delete player.flags.r7IdentityEphemeral;const result=r7Save(slot);if(pending&&getSaveData(slot)?.player?.characterId!==player.characterId)player.flags.r7IdentityEphemeral=true;return result;};
// A save slot is a snapshot of progress, not a separate display-name identity.
// Refresh only the byline when inspecting known same-ID snapshots; never merge slots.
const r7SaveData=getSaveData;getSaveData=function(slot){
 const data=r7SaveData(slot),id=data?.player?.characterId;
 if(R7_LOCAL_ID.test(id||''))try{const r=r7ReadAccounts().accounts[id];if(r){r7Validate(r);data.player.handle=r.name;}}catch(e){}
 return data;
};
