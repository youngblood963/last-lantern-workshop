/* Isolated DEV snapshot adapter. Never included in the R11 Player build. */
(() => {
 'use strict';
 if(new URLSearchParams(location.search).get('offline')==='1')return;
 const storage=localStorage, KEY='r127-dev-pending:';
 let account=null, character=null, revision=0, ready=false, busy=false, blocked=false;
 let last='',timer=null,creating=false,loading=false,started=false,authEpoch=0;
 const latestKey=()=>KEY+account+':latest';
 const originalCommand=handleCommand;
 handleCommand=async function(raw){
  if(!account||loading||creating||blocked||(!character&&!started)||(!ready&&character)){status('Sign in and load your cloud character before playing.');return;}
  let cmd=String(raw).trim().toLowerCase();
  cmd=numberedChoices[cmd]||cmd;
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
   if(ready){storage.setItem(latestKey(),JSON.stringify(capture()));schedule();}
  }catch(e){status('Progress could not be secured locally: '+e.message);}
 }
 async function createCharacter(){
  if(creating||busy)return;creating=true;busy=true;
  try{const s=journals(saveSnapshot(),player.characterId);
   storage.setItem(KEY+account+':creation',JSON.stringify(s));
   restore(await api('character',{snapshot:s}));
   storage.removeItem(KEY+account+':creation');el('cloud-link').hidden=true;
  }catch(e){ready=false;blocked=true;status('Character creation not confirmed: '+e.message+' Sign in again to recover; your draft is retained.');}
  finally{creating=false;busy=false;}
 }
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
 const el=id=>document.getElementById(id),status=t=>{el('cloud-status').textContent=t;};
 async function api(path,data){
  const r=await fetch('/api/'+path,{method:data?'POST':'GET',credentials:'same-origin',
   headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined,
   signal:AbortSignal.timeout(15000)});
  const b=await r.json();if(!r.ok)throw Object.assign(Error(b.error||'Request failed'),{status:r.status});return b;
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
 function restore(b){
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
  activeSaveSlot=0;last=JSON.stringify({...capture(),savedAt:''});blocked=false;ready=true;
  storage.setItem(KEY+account+':base',String(revision));
  el('cloud-server').hidden=true;el('cloud-retry').hidden=true;
  status('Cloud character loaded. Automatic development backups enabled. Revision '+revision+'.');
 }
 async function flush(){
  if(!ready||busy||blocked||!character)return;
  busy=true;
  try{
   let pending=JSON.parse(storage.getItem(pendingKey())||'null');
   const s=capture();storage.setItem(latestKey(),JSON.stringify(s));
   // savedAt changes every capture; compare game data without the wall-clock stamp.
   const normalized=JSON.stringify({...s,savedAt:''});
   if(!pending&&normalized===last){storage.removeItem(latestKey());return;}
   if(!pending){pending={revision,requestId:crypto.randomUUID(),snapshot:s};storage.setItem(pendingKey(),JSON.stringify(pending));}
   const r=await api('save',pending);revision=r.revision;
   last=JSON.stringify({...pending.snapshot,savedAt:''});storage.removeItem(pendingKey());storage.setItem(KEY+account+':base',String(revision));
   if(JSON.stringify({...capture(),savedAt:''})===last)storage.removeItem(latestKey());else schedule();
   el('cloud-retry').hidden=true;status('Cloud backup saved. Revision '+revision+'.');
  }catch(e){
   if(e.status===409){el('cloud-server').hidden=false;blocked=true;ready=false;status('Cloud save conflict. Local progress retained. Export or keep this browser’s local save, then load cloud to continue.');}
   else if(e.status===403){el('cloud-auth').hidden=false;blocked=true;ready=false;status('Signed-in account changed. Local progress retained; sign in to the correct account and load cloud.');}
   else if(e.status===401){ready=false;el('cloud-auth').hidden=false;status('Session expired. Local progress and pending backup retained; sign in again.');}
   else status('Cloud unavailable: '+e.message+' Local saves retained; retry will use the same request ID.');
   el('cloud-retry').hidden=false;
  }finally{busy=false;}
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(flush,1200);}
 async function resume(){
  if(busy)return;busy=true;loading=true;ready=false;
  try{
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
  }catch(e){blocked=true;el('cloud-server').hidden=false;if(e.status===401)el('cloud-auth').hidden=false;status('Recovery paused: '+e.message+'. Local recovery retained; no cloud progress was replaced.');}
  finally{busy=false;loading=false;}
 }
 async function signedIn(b){
  account=b.accountId;character=b.character;ready=false;blocked=false;started=false;
  el('cloud-auth').hidden=true;el('cloud-out').hidden=false;
  el('cloud-link').hidden=!!character;el('cloud-resume').hidden=!character;
  if(character)await resume();
  else status('Signed in. Create your one persistent character. Existing offline slots are preserved.');
 }
 el('cloud-auth').addEventListener('submit',async e=>{
  e.preventDefault();if(busy||loading){status('Wait for the current cloud operation to finish.');return;}ready=false;const attempt=++authEpoch;
  const form=e.currentTarget,action=e.submitter?.value||'login';
  try{const b=await api(action,{login:form.elements.login.value,password:form.elements.password.value});form.elements.password.value='';if(attempt===authEpoch)await signedIn(b);}
  catch(err){status(err.message);}
 });
 el('cloud-link').addEventListener('click',async()=>{
  if(busy||character||!account)return;
  const draft=storage.getItem(KEY+account+':creation');
  if(draft){busy=true;try{restore(await api('character',{snapshot:JSON.parse(draft)}));storage.removeItem(KEY+account+':creation');el('cloud-link').hidden=true;}catch(e){status('Creation recovery failed: '+e.message+'. Sign in again to check for a committed character.');}finally{busy=false;}return;}
  started=true;resetPlayer();activeSaveSlot=0;screen.innerHTML='';stage='wake';
  await intro();status('Choose your handle in the game. Your character will be saved automatically.');
 });
 el('cloud-resume').addEventListener('click',resume);
 el('cloud-server').addEventListener('click',async()=>{
  if(busy||!account)return;
  if(!confirm('Resume the server version? Unsynced local progress will be kept as a recovery copy, not merged.'))return;
  busy=true;loading=true;
  try{
   const backup={pending:storage.getItem(pendingKey()),latest:storage.getItem(latestKey()),current:saveSnapshot()};
   storage.setItem(pendingKey()+':conflict:'+Date.now(),JSON.stringify(backup));
   // Fetch and validate/load before clearing active recovery records.
   restore(await api('save'));storage.removeItem(pendingKey());storage.removeItem(latestKey());
  }catch(e){ready=false;blocked=true;status('Could not load server version: '+e.message+'. Recovery retained.');}
  finally{busy=false;loading=false;}
 });
 el('cloud-retry').addEventListener('click',()=>{if(!blocked){ready=true;return flush();}});
 el('cloud-out').addEventListener('click',async()=>{
  if(busy)return;await checkpoint();await flush();
  if(account&&(storage.getItem(pendingKey())||storage.getItem(latestKey()))){status('Sign out paused: unsaved progress retained. Retry saving first.');return;}
  try{await api('logout',{});authEpoch++;ready=false;account=null;character=null;el('cloud-auth').hidden=false;
   for(const id of ['cloud-out','cloud-link','cloud-resume','cloud-retry','cloud-server'])el(id).hidden=true;
   status('Signed out. Local progress retained.');
  }catch(e){status(e.message);}
 });
 for(const name of ['v49Autosave','v49RollingAutosave','saveGame']){
  window[name]=function(){checkpoint();return true;};
 }
 // Covers normal commands that do not call one of the existing autosave helpers.
 setInterval(()=>{if(ready)checkpoint();},5000);
 addEventListener('pagehide',()=>{if(ready){try{storage.setItem(latestKey(),JSON.stringify(capture()));}catch{} }});
 addEventListener('online',()=>{if(ready&&!blocked)flush();});
 addEventListener('beforeunload',e=>{if(account&&(storage.getItem(pendingKey())||storage.getItem(latestKey()))){e.preventDefault();e.returnValue='';}});
 // Switching to a different local character/slot must never overwrite this account.
 const localLoad=loadGame;
 loadGame=function(){status('Online character uses cloud persistence. Offline slots remain available in ?offline=1.');};
 const initialEpoch=authEpoch;
 api('me').then(b=>{if(initialEpoch===authEpoch)return signedIn(b);}).catch(e=>{if(initialEpoch===authEpoch)status(e.status===401?'Register or sign in to play your cloud character.':e.message);});
})();
