/* WO61 staged wiring for the existing R13 account and snapshot adapter. */
(async()=>{
 'use strict';
 const script=document.currentScript;
 const client=script?.dataset.route127Client;
 const params=new URLSearchParams(location.search);
 if(params.get('offline')==='1')return;

 const origin=location.origin;
 const local=(port)=>origin==='https://localhost:'+port||origin==='https://127.0.0.1:'+port;
 const hostedDev=origin==='https://lastlanternworkshop.com';
 const dev=client==='devtest'&&/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)&&
  globalThis.ROUTE127_ENV?.name==='DEVTEST'&&(hostedDev||local(8787));
 const release=client==='playtest'&&/^\/route127\/playtest\/(?:index\.html)?$/.test(location.pathname)&&
  globalThis.ROUTE127_ENV?.name==='PLAYTEST'&&globalThis.ROUTE127_ENV.backend===true&&
  (hostedDev||local(8788));
 if(!dev&&!release)return;

 const adapter=document.createElement('script');
 const version=release?'wo65':dev&&document.getElementById?.('route127-cloud-login')?'wo64-quota-20261118':'wo61-direct';
 adapter.src=new URL('../online-game/cloud-dev.js?v='+(hostedDev?'scoped-saves-1':version),script.src).href;
 if(dev)adapter.dataset.route127Client='devtest';
 if(hostedDev){
  const base='/route127/devtest/api/';
  const health=await fetch(base+'health',{cache:'no-store',signal:AbortSignal.timeout(5000)})
   .then(r=>r.ok?r.json():null).catch(()=>null);
  adapter.dataset.apiPrefix=health?.saveIsolation===true?base+client+'/':base;
 }
 adapter.onerror=()=>{
  const message=document.createElement('p');
  message.setAttribute('role','status');
  message.textContent='Cloud adapter could not load. Reload before creating or loading a cloud character.';
  document.body.prepend(message);
 };
 document.head.append(adapter);
})();
