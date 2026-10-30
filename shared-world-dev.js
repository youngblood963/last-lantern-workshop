/* Route 127 shared-world DEV prototype. Opt-in, metadata only. No PvP or inventory writes. */
(()=>{'use strict';
 const urlKey='route127-dev-worker-url',enabledKey='route127-dev-sync-enabled',identityKey='route127-dev-identities';
 const panel=document.createElement('section');panel.id='r127-shared';
 panel.style.cssText='position:fixed;bottom:10px;right:10px;z-index:9999;background:#101a15;color:#e2d59c;border:1px solid #746a3b;padding:10px;max-width:300px;font:12px/1.5 monospace;box-shadow:0 2px 12px #0009';
 panel.innerHTML='<div style="font-weight:bold">SHARED WORLD // DEV</div><label><input id="r127-sync-enable" type="checkbox"> Sync this test character</label><br><button id="r127-sync-now" type="button">SYNC / SCAN</button> <button id="r127-sync-hide" type="button">HIDE</button><div id="r127-sync-status" role="status">Off — local saves unchanged.</div><pre id="r127-sync-players" style="white-space:pre-wrap;max-height:125px;overflow:auto"></pre>';
 document.body.append(panel);
 const status=panel.querySelector('#r127-sync-status'),list=panel.querySelector('#r127-sync-players'),toggle=panel.querySelector('#r127-sync-enable');
 toggle.checked=localStorage.getItem(enabledKey)==='yes';
 panel.querySelector('#r127-sync-hide').onclick=()=>{panel.style.display='none';};
 toggle.onchange=()=>{localStorage.setItem(enabledKey,toggle.checked?'yes':'no');status.textContent=toggle.checked?'Enabled; press SYNC / SCAN.':'Disabled; no character data sent.';};
 const clean=(s,max)=>String(s||'').trim().slice(0,max);
 const getUrl=()=>{const raw=localStorage.getItem(urlKey);if(!raw)throw Error('Set development Worker URL on SHARED_WORLD_PROBE.html first.');const u=new URL(raw);if(u.protocol!=='https:'||!u.hostname.endsWith('.workers.dev')||!u.hostname.startsWith('route127-dev-api.')||u.pathname!=='/'&&u.pathname!=='')throw Error('Development Worker URL invalid.');return u.origin;};
 function current(){if(typeof player==='undefined'||typeof stage==='undefined')return null;const name=clean(player.handle,40);if(!name||stage==='title'||stage==='handle'||stage==='confirmHandle')return null;const slot=typeof activeSaveSlot==='number'?activeSaveSlot:0;const key=slot+':'+name;return {key,character_name:name,level:Math.max(1,Math.min(50,Math.floor(Number(player.level)||1))),location:clean(typeof gameplayStageForSave==='function'?gameplayStageForSave():stage,80)||'Old House'};}
 function identity(key){let map={};try{map=JSON.parse(localStorage.getItem(identityKey)||'{}')}catch(e){}if(!map[key]){const bytes=crypto.getRandomValues(new Uint8Array(48));map[key]={id:'sw-'+crypto.randomUUID(),token:Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('')};localStorage.setItem(identityKey,JSON.stringify(map));}return map[key];}
 let busy=false;
 async function sync(){if(busy||!toggle.checked)return;busy=true;try{const base=getUrl(),c=current();if(c){const i=identity(c.key);const r=await fetch(base+'/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...c,id:i.id,token:i.token}),credentials:'omit'});const data=await r.json();if(!r.ok)throw Error(data.error||'Registration failed');status.textContent='Synced '+c.character_name+' (level '+c.level+').';}else status.textContent='No active character; scan only.';
 const r=await fetch(base+'/players',{cache:'no-store',credentials:'omit'});if(!r.ok)throw Error('Scan HTTP '+r.status);const data=await r.json();if(!Array.isArray(data.players))throw Error('Invalid players response');list.textContent=data.players.length?data.players.map(p=>clean(p.character_name,40)+' — L'+Number(p.level)+' — '+clean(p.location,80)).join('\n'):'No development characters yet.';
 }catch(e){status.textContent='Shared-world: '+e.message;}finally{busy=false;}}
 panel.querySelector('#r127-sync-now').onclick=()=>{if(!toggle.checked){status.textContent='Enable sync first.';return;}sync();};
 setInterval(()=>{if(toggle.checked&&current())sync();},30000);
})();
