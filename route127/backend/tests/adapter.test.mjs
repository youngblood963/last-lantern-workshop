import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import worker from '../worker.mjs';
import {database} from './d1-local.mjs';
const TEST_PASSWORD='test-'+crypto.randomUUID();
const root=new URL('../../online-game/',import.meta.url);
const settle=async()=>{for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r));};
// Runs actual shipped R11 scripts and adapter in separate JS realms/storages.
// DOM is a test double: this does not replace real-browser/device acceptance.
function client(env,initialCookie=''){
 const elements=new Map(),timeouts=new Map();let serial=0,cookie=initialCookie,offline=false,loseReply=false;
 function element(id){if(elements.has(id))return elements.get(id);const e={style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},children:[],childNodes:[{}],events:{},textContent:'',innerHTML:'',value:'',hidden:false,
  append(){},appendChild(){},prepend(){},remove(){},replaceChildren(){},setAttribute(){},getAttribute(){return null;},focus(){},scrollIntoView(){},addEventListener(type,fn){this.events[type]=fn;},querySelector(){return element('generic');},querySelectorAll(){return [];}};elements.set(id,e);return e;}
 const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
 const doc={getElementById:element,querySelector:element,querySelectorAll:()=>[],createElement:()=>element('created-'+serial++),body:element('body'),documentElement:element('html'),addEventListener(){},hidden:false};
 const ctx=vm.createContext({console,document:doc,localStorage:storage,crypto,AbortSignal,URL,URLSearchParams,Date,Math,Map,Set,JSON,Promise,performance:{now:()=>0},navigator:{},location:{search:'',href:'https://dev.route127.test/'},confirm:()=>true,
  addEventListener(){},matchMedia:()=>({matches:false}),requestAnimationFrame(){},setInterval(){},clearInterval(){},
  setTimeout(fn,ms){const id=serial++;timeouts.set(id,{fn,ms});return id;},clearTimeout(id){timeouts.delete(id);},
  async fetch(path,opts={}){
   if(offline)throw Error('Simulated offline');
   const req=new Request('https://dev.route127.test'+path,{...opts,headers:{...opts.headers,...(cookie?{Cookie:cookie}:{}),...(opts.method==='POST'?{Origin:'https://dev.route127.test'}:{})}});
   const r=await worker.fetch(req,env);const set=r.headers.get('Set-Cookie');if(set)cookie=set.split(';')[0];
   if(loseReply&&path==='/api/save'&&opts.method==='POST'){loseReply=false;throw Error('Simulated lost response after commit');}return r;
  }});
 ctx.window=ctx;
 const run=s=>vm.runInContext(s,ctx);
 for(const [,file]of readFileSync(new URL('index.html',root),'utf8').matchAll(/<script src="([^?]+)\?/g))run(readFileSync(new URL(file,root),'utf8'));
 // Rendering/typewriter timers are not part of the persistence contract here.
 run(`add=()=>{};addImmediate=()=>{};updateHud=()=>{};outputQueue=Promise.resolve();`);
 return {run,storage,element,values,get cookie(){return cookie;},set offline(v){offline=v;},set loseReply(v){loseReply=v;},
  async auth(action='login',login='adaptertest'){
   const form={elements:{login:{value:login},password:{value:TEST_PASSWORD}}};
   await element('cloud-auth').events.submit({preventDefault(){},currentTarget:form,submitter:{value:action}});await settle();
  },async click(id){await element(id).events.click();await settle();},
  async tick(){const jobs=[...timeouts.values()].filter(x=>x.ms===1200);for(const [id,x]of timeouts)if(x.ms===1200)timeouts.delete(id);for(const x of jobs)await x.fn();await settle();}
 };
}
test('real R11 adapter: ownership link, automatic save, separate client recovery and stale conflict',async()=>{
 const env={ENVIRONMENT:'development',DEV_BACKUP_ENABLED:'true',AUTH_PEPPER:crypto.randomUUID()+crypto.randomUUID(),DB:database()};
 const a=client(env);await settle();await a.auth('register');
 a.run(`player.handle='Adapter Ranger';player.characterId='local-'+crypto.randomUUID();player.flags.interfaceUnlocked=true;stage='roadReady';activeSaveSlot=1;r11Migrate();`);
 await a.click('cloud-link');
 assert.match(a.element('cloud-status').textContent,/loaded/,a.element('cloud-status').textContent);
 const id=a.run('player.characterId');assert.match(id,/^char-/);assert.equal(a.run('r7Identity()'),id);
 a.run(`player.bolts=234;player.pack=[{name:'Bandage',type:'consumable',qty:2}];v49Autosave();`);await a.tick();
 assert.match(a.element('cloud-status').textContent,/saved/);
 const b=client(env);await settle();await b.auth();await b.click('cloud-resume');
 assert.equal(b.run('player.characterId'),id);assert.equal(b.run('player.bolts'),234);assert.equal(b.run('player.pack[0].qty'),2);
 a.run('player.bolts=235;v49Autosave();');await a.tick();
 b.run('player.bolts=999;v49Autosave();');await b.tick();assert.match(b.element('cloud-status').textContent,/conflict/);
 assert.equal(b.run('player.bolts'),999);await b.click('cloud-resume');assert.equal(b.run('player.bolts'),235);
 assert([...b.values.keys()].some(k=>k.includes(':conflict:')));
 b.run('player.bolts=236;v49Autosave();');await b.tick();assert.match(b.element('cloud-status').textContent,/saved/);
});
test('adapter outage/retry and lost acknowledgement do not duplicate save; local-slot switching pauses sync',async()=>{
 const env={ENVIRONMENT:'development',DEV_BACKUP_ENABLED:'true',AUTH_PEPPER:crypto.randomUUID()+crypto.randomUUID(),DB:database()};
 const a=client(env);await settle();await a.auth('register','outagetest');
 a.run(`player.handle='Outage Ranger';player.characterId='local-'+crypto.randomUUID();player.flags.interfaceUnlocked=true;stage='roadReady';activeSaveSlot=1;r11Migrate();`);await a.click('cloud-link');
 a.offline=true;a.run('player.bolts=321;v49Autosave();');await a.tick();assert.match(a.element('cloud-status').textContent,/unavailable/);
 const key=[...a.values.keys()].find(k=>k.startsWith('r127-dev-pending:'));const pending=a.storage.getItem(key);assert(pending);
 a.offline=false;a.loseReply=true;await a.click('cloud-retry');assert.equal(a.storage.getItem(key),pending);
 assert.equal(env.DB.sql.prepare('SELECT revision FROM r127_snapshots').get().revision,1);
 await a.click('cloud-retry');assert.equal(a.storage.getItem(key),null);assert.equal(env.DB.sql.prepare('SELECT revision FROM r127_snapshots').get().revision,1);
 a.run('loadGame(2);');assert.match(a.element('cloud-status').textContent,/paused/);
 a.run('player.bolts=666;v49Autosave();');await a.tick();assert.equal(env.DB.sql.prepare('SELECT revision FROM r127_snapshots').get().revision,1);
 // Separate realm with the same cookie simulates browser restart; automatic session lookup.
 const restarted=client(env,a.cookie);await settle();await restarted.click('cloud-resume');assert.equal(restarted.run('player.bolts'),321);
});
test('bank period and casino journals travel with cloud snapshots; stale local journals cannot override recovery',async()=>{
 const env={ENVIRONMENT:'development',DEV_BACKUP_ENABLED:'true',AUTH_PEPPER:crypto.randomUUID()+crypto.randomUUID(),DB:database()};
 const a=client(env);await settle();await a.auth('register','journals');
 a.run(`player.handle='Journal Ranger';player.characterId='local-'+crypto.randomUUID();player.flags.interfaceUnlocked=true;stage='roadReady';activeSaveSlot=1;r11Migrate();r7Touch();`);
 await a.click('cloud-link');
 const id=a.run('player.characterId');
 a.run(`r7Touch();player.flags.r11CasinoSeq=2;player.flags.r11CasinoNet=20;localStorage.setItem('route127-r11-casino-'+player.characterId,JSON.stringify({seq:2,net:20,rounds:{},bolts:player.bolts,r6Game:null,casino:null}));v49Autosave();`);await a.tick();
 assert.match(a.element('cloud-status').textContent,/saved/,a.element('cloud-status').textContent);
 assert.equal(JSON.parse(env.DB.sql.prepare('SELECT payload FROM r127_snapshots').get().payload).player.flags.r11CasinoSeq,2);
 const b=client(env);await settle();await b.auth('login','journals');
 b.storage.setItem('route127-r11-casino-'+id,JSON.stringify({seq:99,net:999999,rounds:{},bolts:999999}));
 await b.click('cloud-resume');
 assert.match(b.element('cloud-status').textContent,/loaded/,b.element('cloud-status').textContent);
 assert.equal(b.run('player.bolts'),a.run('player.bolts'));assert.equal(b.run('player.flags.r11CasinoSeq'),2);
 assert.equal(b.run(`r7ReadAccounts().accounts[player.characterId].periodStart`),a.run(`r7ReadAccounts().accounts[player.characterId].periodStart`));
});
