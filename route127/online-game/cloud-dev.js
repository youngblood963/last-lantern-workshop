/* Isolated DEV snapshot adapter. Never included in the R11 Player build. */
(() => {
 'use strict';
 if(new URLSearchParams(location.search).get('offline')==='1')return;
 const apiPrefix=document.currentScript?.dataset.apiPrefix==='/route127/devtest/api/'?'/route127/devtest/api/':'/api/';
 const template=document.getElementById('route127-cloud-login');
 const loginTemplate=template?.tagName==='TEMPLATE'?template:null;
 const storage=localStorage, KEY='r127-dev-pending:';
 let account=null, character=null, revision=0, ready=false, busy=false, blocked=false;
 let last='',timer=null,creating=false,loading=false,started=false,authEpoch=0;
 const latestKey=()=>KEY+account+':latest';
 const normalize=snapshot=>JSON.stringify({...snapshot,savedAt:''});
 let writer=loginTemplate&&crypto.randomUUID();
 const deviceKey='r127-dev-recovery-session';
 const cacheKey=(id,characterId)=>KEY+id+':device:'+characterId;
 const transient=error=>error.offline===true||error.status>=500;
 function read(key){return JSON.parse(storage.getItem(key)||'null');}
 function clearSame(key,raw){if(storage.getItem(key)===raw)storage.removeItem(key);}
 function latest(raw=storage.getItem(latestKey())){
  const entry=JSON.parse(raw||'null');
  if(!entry||entry.snapshot)return entry;
  // Existing journals stored the base revision separately.
  const base=storage.getItem(KEY+account+':base');
  return {snapshot:entry,revision:base===null?null:Number(base)};
 }
 function writeLatest(snapshot){
  if(!loginTemplate){storage.setItem(latestKey(),JSON.stringify(snapshot));return;}
  const previous=latest();
  if(previous?.writer===writer&&previous.revision===revision&&normalize(previous.snapshot)===normalize(snapshot))return;
  if(previous&&previous.writer!==writer&&normalize(previous.snapshot)!==normalize(snapshot))
   storage.setItem(KEY+account+':conflict:'+crypto.randomUUID(),JSON.stringify(previous));
  storage.setItem(latestKey(),JSON.stringify({snapshot,revision,writer}));
 }
 function remember(snapshot,savedRevision=revision){
  if(!loginTemplate)return;
  try{
   const key=cacheKey(account,character.id);
   if((read(key)?.revision??-1)<=savedRevision)
    storage.setItem(key,JSON.stringify({snapshot,character,revision:savedRevision}));
   storage.setItem(deviceKey,JSON.stringify({account,characterId:character.id}));
  }catch{status('Cloud saved. This device could not keep a recovery copy.');}
 }
 const slotCommand=cmd=>/^(?:load(?:\s|$)|autosave$|save(?:\s|$)|v$|new(?:\s|$)|skip intro$)/i.test(cmd);
 if(loginTemplate){
  document.body.classList.add('r127-cloud-game');
  const print=add;
  add=function(text,...args){
   if(typeof text==='string'&&/^(?:INTERFACE ONLINE|\(S\) STATUS)/.test(text))
    text=text.replace(/(?: \/)? +\(V\) SAVE$/,'');
   return print.call(this,text,...args);
  };
  const choices=GraphicalUI.choices;
  GraphicalUI.choices=function(...args){
   return choices.apply(this,args).filter(choice=>!slotCommand(choice.command));
  };
 }
 const originalCommand=handleCommand;
 handleCommand=async function(raw){
  if(!account||loading||creating||blocked||(!character&&!started)||(!ready&&character)){status('Sign in and load your cloud character before playing.');return;}
  let cmd=String(raw).trim().toLowerCase();
  cmd=String(numberedChoices[cmd]||currentHotkeys[cmd]||cmd).toLowerCase();
  if(loginTemplate&&slotCommand(cmd)){
   status('This character saves automatically.');return;
  }
  if(/^(load|new|skip|testing|test|save|v)(?:$| )/.test(cmd)||(stage==='title'&&/^continue(?:$| )/.test(cmd))||['interfaceSave','v49TitleConfirm'].includes(stage)){
   if(/^(save|v)(?:$| )/.test(cmd))await flush();
   else status('Online play uses one cloud character. Use ?offline=1 for legacy QA saves.');
   return;
  }
  if(stage==='handle'&&!['random','autofill'].includes(cmd)&&! /^[A-Za-z][A-Za-z0-9 '-]{2,15}$/.test(String(raw).trim())){status('Use a 3–16 character handle beginning with a letter; letters, digits, spaces, apostrophes and hyphens only.');return;}
  try{return await originalCommand(raw);}finally{await checkpoint();}
 };
 async function checkpoint(){
  if(!account||loading||blocked)return;
  try{
   if(!character){if(player.handle&&stage!=='confirmHandle'&&!creating)await createCharacter();return;}
   if(ready){
    const snapshot=capture();
    if(!loginTemplate||normalize(snapshot)!==last)writeLatest(snapshot);
    if(!loginTemplate||storage.getItem(pendingKey())||normalize(snapshot)!==last)schedule();
   }
  }catch(e){status('Progress could not be secured locally: '+e.message);}
 }
 async function createCharacter(){
  if(creating||busy)return;creating=true;busy=true;
  try{const s=journals(saveSnapshot(),player.characterId);
   storage.setItem(KEY+account+':creation',JSON.stringify(s));
   restore(await api('character',{snapshot:s}));
   storage.removeItem(KEY+account+':creation');if(!loginTemplate)el('cloud-link').hidden=true;
  }catch(e){ready=false;blocked=true;status('Character creation not confirmed: '+e.message+' Sign in again to recover; your draft is retained.');}
  finally{creating=false;busy=false;}
 }
 if(!loginTemplate){
  const bar=document.createElement('section');
  bar.id='cloud-dev';bar.style.cssText='padding:10px;border:1px solid #cf9a55;color:#eee;background:#181818';
  bar.innerHTML=`<strong>ROUTE 127 R13 — ONLINE DEVELOPMENT</strong>
 <p>One account, one cloud character. Gameplay is not server-authoritative. Offline QA: open this page with ?offline=1.</p>
 <form id="cloud-auth"><label>Account <input name="login" autocomplete="username" required minlength="3" maxlength="64"></label>
 <label>Password <input name="password" type="password" autocomplete="current-password" required minlength="12" maxlength="128"></label>
 <button type="submit" name="action" value="login">Sign in</button>
 <button type="submit" name="action" value="register">Register</button></form>
 <button id="cloud-link" hidden>Create new character</button>
 <button id="cloud-resume" hidden>Load cloud character</button>
 <button id="cloud-retry" hidden>Retry pending save</button>
 <button id="cloud-server" hidden>Use cloud version; retain local recovery copy</button>
 <button id="cloud-out" hidden>Sign out</button>
 <p id="cloud-status" role="status">Checking session…</p>`;
  document.body.prepend(bar);
 }else document.body.append(loginTemplate.content.cloneNode(true));
 const loginDialog=loginTemplate&&document.querySelector('.cloud-login');
 const accountPanel=loginTemplate&&document.querySelector('.cloud-account');
 const notice=loginTemplate&&document.querySelector('.cloud-notice');
 // Options rebuilds its body when opened. Keep references even while the account section is detached.
 const controls=loginTemplate&&Object.fromEntries(
  [...loginDialog.querySelectorAll('[id]'),...accountPanel.querySelectorAll('[id]')].map(node=>[node.id,node]));
 const el=id=>controls?.[id]||document.getElementById(id);
 let noticeTimer;
 function status(message, duration=6500){
  const current=el('cloud-status');
  if(notice&&duration===6500&&current.textContent===message)return;
  current.textContent=message;
  if(!notice||loginDialog.open)return;
  clearTimeout(noticeTimer);
  notice.textContent=duration?message:'';
  if(duration)noticeTimer=setTimeout(()=>{notice.textContent='';},duration);
 }
 if(loginDialog){
  loginDialog.addEventListener('cancel',event=>event.preventDefault());
  const options=TravelerPanels.options;
  TravelerPanels.options=function(...args){
   const result=options.apply(this,args);
   if(!account||loginDialog.open)return result;
   const panel=this.body?.querySelector('.traveler-detail');
   if(!panel)return result;
   if(this.which==='options'){
    accountPanel.hidden=false;
    const close=[...panel.children].find(node=>node.matches('button')&&node.textContent==='Close');
    panel.insertBefore(accountPanel,close||null);
   }else if(this.which==='menu'){
    panel.append(this.button('Options',()=>{
     this.close();
     this.open('options');
    }));
   }
   return result;
  };
 }
 function showLogin(show){
  if(!loginDialog)return;
  const feedback=el('cloud-feedback');
  if(show){
   clearTimeout(noticeTimer);
   notice.textContent='';
   if(TravelerPanels.which==='options')TravelerPanels.close();
   loginDialog.querySelector('.cloud-login-feedback').append(feedback);
   accountPanel.hidden=true;
   if(!loginDialog.open)loginDialog.showModal();
  }else{
   accountPanel.append(feedback);
   if(loginDialog.open)loginDialog.close();
  }
 }
 showLogin(true);
 if(loginTemplate)titleScreen=function(){
  showLogin(true);
  if(!account)return;
  status('Restoring your character…');
  if(character)void resume();
  else void startCharacter();
 };
 async function api(path,data){
  let r;
  try{
   r=await fetch(apiPrefix+path,{method:data?'POST':'GET',credentials:'same-origin',
    headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined,
    signal:AbortSignal.timeout(15000)});
  }catch(error){throw Object.assign(error,{offline:true});}
  const b=await r.json().catch(()=>null);
  if(!r.ok||!b)throw Object.assign(Error(b?.error||'Cloud request failed'),{status:r.status});
  return b;
 }
 function pendingKey(){return KEY+account;}
 function journals(s,id){
  const bank=JSON.parse(storage.getItem(R7_ACCOUNTS_KEY)||'{\"accounts\":{}}');
  s.devBankLedger=bank.accounts?.[id]||null;
  s.devCasinoLedger=JSON.parse(storage.getItem('route127-r11-casino-'+id)||'null');
  const round=s.player.flags.r6Game?.id||'none';
  s.devRoundLedger=JSON.parse(storage.getItem('route127-r7-casino-'+id+'-'+round)||'null');
  return s;
 }
 function capture(){
  const s=saveSnapshot();
  if(s.player.characterId!==character.id){ready=false;throw Error('Different local character detected. Load cloud to resume cloud saving.');}
  if(!s.player.handle||['title','wake','handle','confirmHandle'].includes(s.stage))throw Error('Finish the existing character creation first.');
  s.player.characterId=character.id;
  // Preserve the complete local bank period record for faithful DEV backup recovery.
  return journals(s,character.id);
 }
 function restore(b,{device=false,baseline}={}){
  ready=false;character=b.character;revision=b.revision;
  const s=b.snapshot;
  if(!s||s.version!==38||!s.player||s.player.characterId!==character.id||!s.player.flags||typeof s.stage!=='string'||!Number.isSafeInteger(revision)||revision<0)throw Error('Invalid cloud character. Local progress retained.');
  const validate=(v,d=0)=>{if(d>40)throw Error('Cloud snapshot too deep');if(v&&typeof v==='object')for(const [k,x]of Object.entries(v)){if(['__proto__','constructor','prototype'].includes(k))throw Error('Unsafe cloud snapshot');validate(x,d+1);}};validate(s);
  const bankBefore=storage.getItem(R7_ACCOUNTS_KEY);
  const bank=JSON.parse(bankBefore||'{"version":1,"accounts":{}}');
  if(s.devBankLedger)bank.accounts[character.id]=s.devBankLedger;else delete bank.accounts[character.id];
  // Retain existing autosave bytes for manual recovery, without touching any manual slots.
  const prior=storage.getItem(FACTORY_AUTOSAVE_KEY);
  if(prior)storage.setItem('r127-before-cloud-load:'+Date.now(),JSON.stringify({snapshot:prior,bank:bankBefore,casino:storage.getItem('route127-r11-casino-'+character.id),round:storage.getItem('route127-r7-casino-'+character.id+'-'+(s.player.flags.r6Game?.id||'none'))}));
  storage.setItem(R7_ACCOUNTS_KEY,JSON.stringify(bank));
  for(const [key,value]of [['route127-r11-casino-'+character.id,s.devCasinoLedger],['route127-r7-casino-'+character.id+'-'+(s.player.flags.r6Game?.id||'none'),s.devRoundLedger]]){if(value)storage.setItem(key,JSON.stringify(value));else storage.removeItem(key);}
  // Feed the existing loader in memory: never replace the legacy autosave.
  const priorReader=getSaveData;
  getSaveData=function(slot){return slot==='auto'?{...s,manualSlot:0}:priorReader(slot);};
  try{localLoad('auto');}finally{getSaveData=priorReader;}
  activeSaveSlot=0;last=normalize(device?baseline:capture());blocked=false;ready=true;
  if(!device){
   storage.setItem(KEY+account+':base',String(revision));
   remember(s);
  }
  el('cloud-server').hidden=true;el('cloud-retry').hidden=true;
  showLogin(false);
  status(device?'Cloud unavailable. Playing from this device’s recovery copy.':
   loginTemplate?'Cloud character loaded.':'Cloud character loaded. Automatic development backups enabled. Revision '+revision+'.',device?6500:0);
 }
 async function flush(){
  if(!ready||busy||blocked||!character)return;
  busy=true;
  try{
   let pendingRaw=storage.getItem(pendingKey());
   let pending=JSON.parse(pendingRaw||'null');
   const s=capture();
   if(!loginTemplate||normalize(s)!==last)writeLatest(s);
   const latestRaw=storage.getItem(latestKey());
   // savedAt changes every capture; compare game data without the wall-clock stamp.
   const normalized=JSON.stringify({...s,savedAt:''});
   if(!pending&&normalized===last){if(!loginTemplate)clearSame(latestKey(),latestRaw);return;}
   if(!pending){
    pending={revision,requestId:crypto.randomUUID(),snapshot:s,...(writer?{writer}:{})};
    pendingRaw=JSON.stringify(pending);storage.setItem(pendingKey(),pendingRaw);
   }
   if(loginTemplate&&(pending.snapshot?.player?.characterId!==character.id||
    (pending.revision!==revision||pending.writer&&pending.writer!==writer)&&normalize(pending.snapshot)!==normalized))
    throw Object.assign(Error('A different recovery copy is pending'),{status:409});
   const {writer:pendingWriter,...request}=pending;
   const r=await api('save',request);revision=r.revision;
   last=normalize(pending.snapshot);
   clearSame(pendingKey(),pendingRaw);
   storage.setItem(KEY+account+':base',String(revision));
   remember(pending.snapshot);
   const current=capture();
   if(loginTemplate){
    const entry=latest(latestRaw);
    if(entry&&normalize(entry.snapshot)===last)clearSame(latestKey(),latestRaw);
    // A newer checkpoint may have arrived while the request was in flight.
    if(normalize(current)!==last&&latest()?.writer===writer){writeLatest(current);schedule();}
   }else if(normalize(current)===last)clearSame(latestKey(),latestRaw);
   else schedule();
   el('cloud-retry').hidden=true;status(loginTemplate?'Cloud Saved ✓':'Cloud backup saved. Revision '+revision+'.',2800);
  }catch(e){
   if(e.status===409){el('cloud-server').hidden=false;blocked=true;ready=false;status(loginTemplate?'Newer cloud save found. Recovery is in Options → Account.':'Cloud save conflict. Local progress retained. Export or keep this browser’s local save, then load cloud to continue.');}
   else if(e.status===403){el('cloud-auth').hidden=false;blocked=true;ready=false;status('Signed-in account changed. Local progress retained; sign in to the correct account and load cloud.');}
   else if(e.status===401){ready=false;el('cloud-auth').hidden=false;status('Session expired. Local progress and pending backup retained; sign in again.');}
   else status(loginTemplate?'Cloud save unavailable. Retry in Options → Account.':'Cloud unavailable: '+e.message+' Local saves retained; retry will use the same request ID.');
   if(loginTemplate&&[401,403].includes(e.status)){
    storage.removeItem(deviceKey);
    el('cloud-server').hidden=true;
    el('cloud-out').hidden=true;
    showLogin(true);
   }
   el('cloud-retry').hidden=!!loginTemplate&&[401,403,409].includes(e.status);
  }finally{busy=false;}
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(flush,1200);}
 async function resumeDeviceJournal(){
  const pendingRaw=storage.getItem(pendingKey()),latestRaw=storage.getItem(latestKey());
  const pending=JSON.parse(pendingRaw||'null'),entry=latest(latestRaw);
  const matches=snapshot=>snapshot?.player?.characterId===character.id;
  const conflict=()=>Object.assign(Error('Newer cloud progress exists. Local progress was kept.'),{status:409});
  if((pending&&!matches(pending.snapshot))||(entry&&!matches(entry.snapshot)))throw conflict();
  let cloud=await api('save');
  if(cloud.character?.id!==character.id)throw conflict();
  if(pending){
   // An exact retry may acknowledge a write whose response was lost.
   const {writer:pendingWriter,...request}=pending;
   const result=await api('save',request);
   remember(pending.snapshot,result.revision);
   clearSame(pendingKey(),pendingRaw);
   if(entry&&normalize(entry.snapshot)===normalize(pending.snapshot))clearSame(latestKey(),latestRaw);
   else if(entry&&entry.revision===pending.revision&&entry.writer===pendingWriter&&storage.getItem(latestKey())===latestRaw){
    storage.setItem(latestKey(),JSON.stringify({...entry,revision:result.revision}));
   }
   cloud=await api('save');
  }
  const remainingRaw=storage.getItem(latestKey()),remaining=latest(remainingRaw);
  if(remaining){
   if(!matches(remaining.snapshot)||remaining.revision!==cloud.revision)throw conflict();
   if(normalize(remaining.snapshot)!==normalize(cloud.snapshot)){
    const request={revision:cloud.revision,requestId:crypto.randomUUID(),snapshot:remaining.snapshot};
    const raw=JSON.stringify({...request,writer:remaining.writer});
    if(storage.getItem(pendingKey()))throw conflict();
    storage.setItem(pendingKey(),raw);
    const result=await api('save',request);
    remember(remaining.snapshot,result.revision);
    clearSame(pendingKey(),raw);
    cloud=await api('save');
   }
   clearSame(latestKey(),remainingRaw);
  }
  restore(cloud);
 }
 function offerDeviceRecovery(){
  if(!loginTemplate)return false;
  try{
   const marker=read(deviceKey);
   if(!marker||account&&account!==marker.account||character&&character.id!==marker.characterId)return false;
   const cache=read(cacheKey(marker.account,marker.characterId));
   if(cache?.snapshot?.player?.characterId!==marker.characterId)return false;
   el('cloud-local').hidden=false;
   status('Cloud unavailable. You can continue from the copy on this device.');
   return true;
  }catch{return false;}
 }
 if(loginTemplate)el('cloud-local').addEventListener('click',()=>{
  if(busy||loading||signingIn)return;
  try{
   const marker=read(deviceKey);
   if(!marker||account&&account!==marker.account||character&&character.id!==marker.characterId)return;
   account=marker.account;
   const cached=read(cacheKey(account,marker.characterId)),pending=read(pendingKey()),entry=latest();
   const candidate=entry?.snapshot||pending?.snapshot||cached.snapshot;
   const base=entry?.revision??pending?.revision??cached.revision;
   writer=entry?.writer||pending?.writer||writer;
   restore({...cached,snapshot:candidate,revision:base},{device:true,baseline:cached.snapshot});
   el('cloud-local').hidden=true;el('cloud-out').hidden=false;
  }catch(error){status('Could not restore the device copy: '+error.message);}
 });
 async function resume(){
  if(busy)return;busy=true;loading=true;ready=false;
  try{
   if(loginTemplate){await resumeDeviceJournal();return;}
   const pending=JSON.parse(storage.getItem(pendingKey())||'null');
   let latest=JSON.parse(storage.getItem(latestKey())||'null');
   if(pending){await api('save',pending);storage.setItem(KEY+account+':base',String(pending.revision+1));storage.removeItem(pendingKey());}
   const cloud=await api('save');
   if(latest){
    if(latest.player?.characterId!==cloud.character.id)throw Error('Recovery character mismatch');
    const expected=pending?pending.revision+1:revision;
    // Reload/restart needs a persisted base revision, never guess the server revision.
    const rawBase=storage.getItem(KEY+account+':base');
    if(rawBase===null&&!pending)throw Error('Recovery base revision missing');
    const base=Number(rawBase);
    if(cloud.revision!==(pending?expected:base))throw Object.assign(Error('Newer cloud progress exists; local recovery retained'),{status:409});
    const request={revision:cloud.revision,requestId:crypto.randomUUID(),snapshot:latest};
    storage.setItem(pendingKey(),JSON.stringify(request));await api('save',request);
    storage.removeItem(pendingKey());storage.removeItem(latestKey());
   }
   restore(await api('save'));storage.setItem(KEY+account+':base',String(revision));
  }catch(e){
   blocked=true;
   if(transient(e)&&offerDeviceRecovery())return;
   el('cloud-server').hidden=e.status===401&&!!loginTemplate;
   if(e.status===401){
    el('cloud-auth').hidden=false;
    if(loginTemplate)el('cloud-out').hidden=true;
    showLogin(true);
   }
   status('Recovery paused: '+e.message+'. Local recovery retained; no cloud progress was replaced.');
  }
  finally{busy=false;loading=false;}
 }
 async function signedIn(b){
  account=b.accountId;character=b.character;ready=false;blocked=false;started=false;
  el('cloud-auth').hidden=true;el('cloud-out').hidden=false;
  if(loginTemplate){
   try{
    const marker=read(deviceKey);
    if(marker&&(marker.account!==account||marker.characterId!==character?.id))storage.removeItem(deviceKey);
   }catch{storage.removeItem(deviceKey);}
   el('cloud-server').hidden=true;el('cloud-retry').hidden=true;el('cloud-local').hidden=true;
   status(character?'Loading your character…':'Starting character creation…');
   if(character)await resume();
   else await startCharacter();
   return;
  }
  el('cloud-link').hidden=!!character;el('cloud-resume').hidden=!character;
  if(character)await resume();
  else status('Signed in. Create your one persistent character. Existing offline slots are preserved.');
 }
 let signingIn=false;
 el('cloud-auth').addEventListener('submit',async e=>{
  e.preventDefault();if((loginTemplate&&signingIn)||busy||loading){status('Wait for the current cloud operation to finish.');return;}ready=false;const attempt=++authEpoch;
  const form=e.currentTarget,action=e.submitter?.value||'login';
  signingIn=true;
  if(loginTemplate)for(const button of form.querySelectorAll('button'))button.disabled=true;
  try{const b=await api(action,{login:form.elements.login.value,password:form.elements.password.value});form.elements.password.value='';if(attempt===authEpoch)await signedIn(b);}
  catch(err){status(err.message);}
  finally{
   signingIn=false;
   if(loginTemplate)for(const button of form.querySelectorAll('button'))button.disabled=false;
  }
 });
 async function startCharacter(){
  if(busy||character||!account)return;
  const draft=storage.getItem(KEY+account+':creation');
  if(draft){
   busy=true;
   try{restore(await api('character',{snapshot:JSON.parse(draft)}));storage.removeItem(KEY+account+':creation');if(!loginTemplate)el('cloud-link').hidden=true;}
   catch(e){status('Creation recovery failed: '+e.message+'. Sign in again to check for a committed character.');}
   finally{busy=false;}
   return;
  }
  showLogin(false);
  started=true;resetPlayer();activeSaveSlot=0;screen.innerHTML='';stage='wake';
  await intro();status(loginTemplate?'Choose your traveler name to create your cloud character.':'Choose your handle in the game. Your character will be saved automatically.');
 }
 if(!loginTemplate){
  el('cloud-link').addEventListener('click',startCharacter);
  el('cloud-resume').addEventListener('click',resume);
 }
 el('cloud-server').addEventListener('click',async()=>{
  if(busy||!account)return;
  if(!confirm('Resume the server version? Unsynced local progress will be kept as a recovery copy, not merged.'))return;
  busy=true;loading=true;
  try{
   const backup={pending:storage.getItem(pendingKey()),latest:storage.getItem(latestKey()),current:saveSnapshot()};
   storage.setItem(pendingKey()+':conflict:'+crypto.randomUUID(),JSON.stringify(backup));
   // Fetch and validate/load before clearing active recovery records.
   const cloud=await api('save');
   if(loginTemplate&&TravelerPanels.which==='options')TravelerPanels.close();
   restore(cloud);clearSame(pendingKey(),backup.pending);clearSame(latestKey(),backup.latest);
  }catch(e){ready=false;blocked=true;status('Could not load server version: '+e.message+'. Recovery retained.');}
  finally{busy=false;loading=false;}
 });
 el('cloud-retry').addEventListener('click',()=>{if(!blocked){ready=true;return flush();}});
 el('cloud-out').addEventListener('click',async()=>{
  if(busy||(loginTemplate&&(loading||signingIn)))return;
  if(!loginTemplate||ready){await checkpoint();await flush();}
  if(account&&(!loginTemplate||!blocked)&&(storage.getItem(pendingKey())||storage.getItem(latestKey()))){status('Sign out paused: unsaved progress retained. Retry saving first.');return;}
  if(loginTemplate)busy=true;
  try{await api('logout',{});authEpoch++;ready=false;account=null;character=null;el('cloud-auth').hidden=false;
   if(loginTemplate)storage.removeItem(deviceKey);
   for(const id of ['cloud-out','cloud-link','cloud-resume','cloud-retry','cloud-server','cloud-local']){const control=el(id);if(control)control.hidden=true;}
   showLogin(true);
   status(loginTemplate?'Signed out.':'Signed out. Local progress retained.');
  }catch(e){status(e.message);}
  finally{if(loginTemplate)busy=false;}
 });
 for(const name of ['v49Autosave','v49RollingAutosave','saveGame']){
  window[name]=function(){checkpoint();return true;};
 }
 // Covers normal commands that do not call one of the existing autosave helpers.
 setInterval(()=>{if(ready)checkpoint();},5000);
 addEventListener('pagehide',()=>{
  if(!ready||!account)return;
  try{
   const current=capture();
   if(!loginTemplate||storage.getItem(pendingKey())||JSON.stringify({...current,savedAt:''})!==last)
    writeLatest(current);
  }catch{}
 });
 addEventListener('online',()=>{if(ready&&!blocked)flush();});
 addEventListener('beforeunload',e=>{if(account&&(storage.getItem(pendingKey())||storage.getItem(latestKey()))){e.preventDefault();e.returnValue='';}});
 // Switching to a different local character/slot must never overwrite this account.
 const localLoad=loadGame;
 loadGame=function(){status(loginTemplate?'Your cloud character loads automatically.':'Online character uses cloud persistence. Offline slots remain available in ?offline=1.');};
 const initialEpoch=authEpoch;
 api('me').then(b=>{if(initialEpoch===authEpoch)return signedIn(b);}).catch(e=>{if(initialEpoch!==authEpoch)return;
  if(e.status===401&&loginTemplate)storage.removeItem(deviceKey);
  if(!transient(e)||!offerDeviceRecovery())status(e.status===401?'Register or sign in to play your cloud character.':e.message);});
})();
