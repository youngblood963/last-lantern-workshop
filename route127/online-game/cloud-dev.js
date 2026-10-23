/* Isolated DEV snapshot adapter. Never included in the R11 Player build. */
(() => {
 'use strict';
 const storage=localStorage, KEY='r127-dev-pending:';
 let account=null, character=null, revision=0, ready=false, busy=false, blocked=false;
 let last='',timer=null;
 const bar=document.createElement('section');
 bar.id='cloud-dev';bar.style.cssText='padding:10px;border:1px solid #cf9a55;color:#eee;background:#181818';
 bar.innerHTML=`<strong>ONLINE DEVELOPMENT TEST — separate from public R11</strong>
 <p>Cloud backups are experimental. Gameplay balances and items are not server-authoritative.</p>
 <form id="cloud-auth"><label>Account <input name="login" autocomplete="username" required minlength="3" maxlength="64"></label>
 <label>Password <input name="password" type="password" autocomplete="current-password" required minlength="12" maxlength="128"></label>
 <button type="submit" name="action" value="login">Sign in</button>
 <button type="submit" name="action" value="register">Register</button></form>
 <button id="cloud-link" hidden>Use current character permanently</button>
 <button id="cloud-resume" hidden>Load cloud character</button>
 <button id="cloud-retry" hidden>Retry pending save</button>
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
  if(!s.player.handle||['title','wake','standing','handle'].includes(s.stage))throw Error('Finish the existing character creation first.');
  s.player.characterId=character.id;
  // Preserve the complete local bank period record for faithful DEV backup recovery.
  return journals(s,character.id);
 }
 function restore(b){
  ready=false;character=b.character;revision=b.revision;
  const s=b.snapshot;s.player.characterId=character.id;
  const bankBefore=storage.getItem(R7_ACCOUNTS_KEY);
  const bank=JSON.parse(bankBefore||'{"version":1,"accounts":{}}');
  if(s.devBankLedger)bank.accounts[character.id]=s.devBankLedger;else delete bank.accounts[character.id];
  // Retain existing autosave bytes for manual recovery, without touching any manual slots.
  const prior=storage.getItem(FACTORY_AUTOSAVE_KEY);
  if(prior)storage.setItem('r127-before-cloud-load:'+Date.now(),JSON.stringify({snapshot:prior,bank:bankBefore,casino:storage.getItem('route127-r11-casino-'+character.id),round:storage.getItem('route127-r7-casino-'+character.id+'-'+(s.player.flags.r6Game?.id||'none'))}));
  storage.setItem(R7_ACCOUNTS_KEY,JSON.stringify(bank));
  for(const [key,value]of [['route127-r11-casino-'+character.id,s.devCasinoLedger],['route127-r7-casino-'+character.id+'-'+(s.player.flags.r6Game?.id||'none'),s.devRoundLedger]]){if(value)storage.setItem(key,JSON.stringify(value));else storage.removeItem(key);}
  storage.setItem(FACTORY_AUTOSAVE_KEY,JSON.stringify({...s,manualSlot:0}));
  loadGame('auto');last=JSON.stringify({...capture(),savedAt:''});blocked=false;ready=true;
  status('Cloud character loaded. Automatic development backups enabled. Revision '+revision+'.');
 }
 async function flush(){
  if(!ready||busy||blocked||!character)return;
  busy=true;
  try{
   let pending=JSON.parse(storage.getItem(pendingKey())||'null');
   const s=capture();
   // savedAt changes every capture; compare game data without the wall-clock stamp.
   const normalized=JSON.stringify({...s,savedAt:''});
   if(!pending&&normalized===last)return;
   if(!pending){pending={revision,requestId:crypto.randomUUID(),snapshot:s};storage.setItem(pendingKey(),JSON.stringify(pending));}
   const r=await api('save',pending);revision=r.revision;
   last=JSON.stringify({...pending.snapshot,savedAt:''});storage.removeItem(pendingKey());
   el('cloud-retry').hidden=true;status('Cloud backup saved. Revision '+revision+'.');
  }catch(e){
   if(e.status===409){blocked=true;ready=false;status('Cloud save conflict. Local progress retained. Export or keep this browser’s local save, then load cloud to continue.');}
   else if(e.status===403){blocked=true;ready=false;status('Signed-in account changed. Local progress retained; sign in to the correct account and load cloud.');}
   else if(e.status===401){ready=false;status('Session expired. Local progress and pending backup retained; sign in again.');}
   else status('Cloud unavailable: '+e.message+' Local saves retained; retry will use the same request ID.');
   el('cloud-retry').hidden=false;
  }finally{busy=false;}
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(flush,1200);}
 async function signedIn(b){
  account=b.accountId;character=b.character;ready=false;
  el('cloud-auth').hidden=true;el('cloud-out').hidden=false;
  el('cloud-link').hidden=!!character;el('cloud-resume').hidden=!character;
  status(character?'Signed in. Load your cloud character to begin.':'Signed in. Finish normal R11 character creation, then use current character permanently.');
 }
 el('cloud-auth').addEventListener('submit',async e=>{
  e.preventDefault();ready=false;
  const form=e.currentTarget,action=e.submitter?.value||'login';
  try{const b=await api(action,{login:form.elements.login.value,password:form.elements.password.value});form.elements.password.value='';await signedIn(b);}
  catch(err){status(err.message);}
 });
 el('cloud-link').addEventListener('click',async()=>{
  if(busy)return;
  if(!confirm('This account gets one permanent character. Use your current character?'))return;
  try{
   const s=saveSnapshot();if(!s.player.handle||['title','wake','standing','handle'].includes(s.stage))throw Error('Finish existing character creation first.');
   journals(s,s.player.characterId);
   busy=true;const b=await api('character',{snapshot:s});restore(b);
   el('cloud-link').hidden=true;el('cloud-resume').hidden=false;
  }catch(e){status(e.message);try{await signedIn(await api('me'));}catch{}}finally{busy=false;}
 });
 el('cloud-resume').addEventListener('click',async()=>{
  if(busy)return;
  if(!confirm('Load cloud progress? Your current local autosave will be backed up.'))return;
  try{
   busy=true;ready=false;
   const pending=JSON.parse(storage.getItem(pendingKey())||'null');
   // First recover a potentially committed request, never silently discard it on restart.
   if(pending){try{await api('save',pending);storage.removeItem(pendingKey());}catch(e){if(e.status!==409)throw e;storage.setItem(pendingKey()+':conflict:'+Date.now(),JSON.stringify(pending));storage.removeItem(pendingKey());status('Pending save conflicts; local recovery copy retained.');}}
   restore(await api('save'));
  }catch(e){status(e.message);}finally{busy=false;}
 });
 el('cloud-retry').addEventListener('click',()=>{if(!blocked){ready=true;return flush();}});
 el('cloud-out').addEventListener('click',async()=>{
  if(busy)return;await flush();
  try{await api('logout',{});ready=false;account=null;character=null;el('cloud-auth').hidden=false;
   for(const id of ['cloud-out','cloud-link','cloud-resume','cloud-retry'])el(id).hidden=true;
   status('Signed out. Local progress retained.');
  }catch(e){status(e.message);}
 });
 for(const name of ['v49Autosave','v49RollingAutosave','saveGame']){
  const old=window[name];window[name]=function(...args){const r=old.apply(this,args);schedule();return r;};
 }
 // Covers normal commands that do not call one of the existing autosave helpers.
 setInterval(()=>{if(ready)schedule();},5000);
 // Switching to a different local character/slot must never overwrite this account.
 const localLoad=loadGame;
 loadGame=function(...args){if(ready){ready=false;status('Local character loaded. Cloud saving paused; load cloud to resume.');}return localLoad(...args);};
 api('me').then(signedIn).catch(e=>status(e.status===401?'Register or sign in to test cloud persistence.':e.message));
})();
