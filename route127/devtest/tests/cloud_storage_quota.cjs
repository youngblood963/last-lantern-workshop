const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const envCode=fs.readFileSync(path.join(root,'devtest/runtime/environment.js'),'utf8');
const adapter=fs.readFileSync(path.join(root,'online-game/cloud-dev.js'),'utf8');
const prefix='route127:devtest:v1:', journal='r127-dev-pending:acct';
const archive='r127-before-cloud-load:', auto='factory-auto';
const initial={version:38,stage:'mercy',player:{characterId:'traveler',handle:'QA',level:8,flags:{}}};
const wait=()=>new Promise(resolve=>setImmediate(resolve));
function fixture({seed={},fail=()=>false,online=true}={}){
 const raw=new Map(Object.entries(seed)), writes=[], requests=[];
 let quota=Infinity, snapshot, cloud={snapshot:initial,character:{id:'traveler'},revision:8};
 let signedIn=online, used=()=>[...raw].reduce((sum,[k,v])=>sum+k.length+v.length,0);
 const backing={get length(){return raw.size;},key:i=>[...raw.keys()][i]??null,
  getItem:k=>raw.get(k)??null,removeItem:k=>raw.delete(k),
  setItem(k,v){
   writes.push(k);
   if(fail(k)||used()+(raw.has(k)?v.length-raw.get(k).length:k.length+v.length)>quota)
    throw Object.assign(Error('Setting the value exceeded the quota'),{name:'QuotaExceededError'});
   raw.set(k,v);
  }};
 const controls={};
 function element(id){
  return {id,open:false,hidden:false,handlers:{},classList:{add(){}},append(){},
   content:{cloneNode(){}},showModal(){this.open=true;},close(){this.open=false;},
   querySelector:()=>element(),querySelectorAll:()=>[],
   addEventListener(name,handler){this.handlers[name]=handler;}};
 }
 for(const id of ['route127-cloud-login','cloud-auth','cloud-status','cloud-feedback','cloud-retry','cloud-server','cloud-local','cloud-out'])controls[id]=element(id);
 controls['route127-cloud-login'].tagName='TEMPLATE';
 const [dialog,panel,notice]=['dialog','panel','notice'].map(element);
 dialog.querySelectorAll=()=>Object.values(controls);
 const document={currentScript:{dataset:{}},body:element('body'),getElementById:id=>controls[id],
  querySelector:selector=>({'.cloud-login':dialog,'.cloud-account':panel,'.cloud-notice':notice}[selector])};
 const response=(data,status=200)=>({ok:status===200,status,json:async()=>structuredClone(data)});
 const ctx=vm.createContext({document,location:new URL('https://lastlanternworkshop.com/route127/devtest/'),URLSearchParams,
  localStorage:backing,crypto:webcrypto,AbortSignal,setTimeout:()=>1,clearTimeout(){},setInterval(){},addEventListener(){},
  TravelerPanels:{options(){}},GraphicalUI:{choices(){return [];}},add(){},handleCommand:async()=>{},titleScreen(){},
  R7_ACCOUNTS_KEY:'bank',FACTORY_AUTOSAVE_KEY:auto,activeSaveSlot:0,
  getSaveData:()=>null,saveSnapshot:()=>structuredClone(snapshot),
  loadGame(slot){snapshot=ctx.getSaveData(slot);delete snapshot.manualSlot;},
  async fetch(url,options){
   const name=url.split('/').at(-1),data=options.body&&JSON.parse(options.body);
   requests.push([name,data]);
   if(name==='logout'){signedIn=false;return response({});}
   if(name==='login')signedIn=true;
   if(!signedIn)return response({error:'Sign in required'},401);
   if(name==='me'||name==='login')return response({accountId:'acct',character:cloud.character});
   if(name==='save'&&!data)return response(cloud);
   if(name==='save'&&data.revision===cloud.revision){
    cloud={...cloud,snapshot:data.snapshot,revision:cloud.revision+1};return response(cloud);
   }
   return response({error:'Conflict'},409);
  }});
 ctx.window=ctx;
 vm.runInContext(envCode,ctx);
 document.currentScript={dataset:{route127Client:'devtest',apiPrefix:'/route127/devtest/api/'}};
 return {raw,writes,requests,controls,dialog,get snapshot(){return snapshot;},
  start:async({full=false}={})=>{if(full)quota=used();vm.runInContext(adapter,ctx);await wait();},
  click:id=>controls[id].handlers.click(),
  login(){return controls['cloud-auth'].handlers.submit({preventDefault(){},submitter:{value:'login'},
   currentTarget:{elements:{login:{value:'qa'},password:{value:'test-password'}},querySelectorAll:()=>[]}});},
  journal:()=>ctx.localStorage.getItem(journal)};
}
(async()=>{
 const seeded={
  [prefix+auto]:'original local save',
  [prefix+archive+'1']:'old'.repeat(300),[prefix+archive+'2']:'recent'.repeat(150),
  [archive+'3']:'legacy archive', ['route127:playtest:cloud:v1:'+archive+'4']:'other environment',
  [prefix+journal+':conflict:protected']:'prior unsynced progress'
 };
 const game=fixture({seed:seeded,fail:key=>key.includes(':device:')||key===prefix+archive+'latest'});
 await game.start({full:true});
 assert.equal(game.snapshot.player.level,8);
 assert.match(game.controls['cloud-status'].textContent,/Cloud character loaded/);
 assert.equal(game.raw.get(prefix+auto),seeded[prefix+auto]);
 for(const key of [prefix+archive+'2',archive+'3','route127:playtest:cloud:v1:'+archive+'4',prefix+journal+':conflict:protected'])
  assert.equal(game.raw.get(key),seeded[key]);
 assert(!game.raw.has(prefix+archive+'1'));
 assert(game.writes.includes(prefix+archive+'latest'));
 assert(!game.writes.includes(prefix+'removed:'+archive+'1'));
 assert(!game.requests.some(([name,data])=>name==='save'&&data));

 const regular=fixture({seed:{[prefix+auto]:'local'} ,online:false});
 await regular.start();
 await regular.login();
 assert.equal(regular.snapshot.player.level,8);
 regular.snapshot.player.level=9;
 await regular.click('cloud-out');
 assert.equal(regular.requests.find(([name,data])=>name==='save'&&data)[1].snapshot.player.level,9);
 assert.equal(regular.requests.at(-1)[0],'logout');
 assert.equal(regular.journal(),null);
 await regular.login();
 assert.equal(regular.snapshot.player.level,9);
 assert(!regular.dialog.open);
 assert.deepEqual([...regular.raw.keys()].filter(key=>key.startsWith(prefix+archive)),[prefix+archive+'latest']);

 const pending={revision:7,requestId:'retained',snapshot:{...initial,player:{...initial.player,level:9}}};
 const fullConflict=fixture({seed:{...seeded,[prefix+journal]:JSON.stringify(pending)}});
 await fullConflict.start({full:true});
 assert.match(fullConflict.controls['cloud-status'].textContent,/Recovery paused/);
 assert.equal(fullConflict.journal(),JSON.stringify(pending));
 assert.equal(fullConflict.raw.get(prefix+auto),seeded[prefix+auto]);
 assert.equal(fullConflict.snapshot,undefined);
 console.log('PASS DEVTEST cloud restore under quota, scoped pruning, protected conflict, login, autosave, logout and reload');
})().catch(error=>{console.error(error);process.exitCode=1;});
