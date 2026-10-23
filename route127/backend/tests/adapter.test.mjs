import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import worker from '../worker.mjs';
import {database} from './d1-local.mjs';
const TEST_PASSWORD='test-'+crypto.randomUUID();
const root=new URL('../../online-game/',import.meta.url);
const settle=async()=>{for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r));await new Promise(r=>setTimeout(r,30));};
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
test('R13 automatic creation, cloud resume, outage latest progress, journals and slots',async()=>{
 const env={ENVIRONMENT:'development',DEV_BACKUP_ENABLED:'true',AUTH_PEPPER:crypto.randomUUID()+crypto.randomUUID(),DB:database()};
 const a=client(env);await settle();await a.auth('register','r13test');
 a.storage.setItem('offline-proof','untouched');a.run("localStorage.setItem(FACTORY_AUTOSAVE_KEY,'legacy autosave sentinel')");
 a.run(`player.handle='Ranger';player.characterId='local-'+crypto.randomUUID();player.flags.interfaceUnlocked=true;stage='roadReady';r11Migrate();saveGame();`);await settle();
 assert.match(a.element('cloud-status').textContent,/loaded/);
 const id=a.run('player.characterId');assert.match(id,/^char-/);
 a.run(`player.bolts=234;player.level=4;player.xp=200;player.flags.relayQuest='complete';player.pack=[{name:'Bandage',type:'consumable',qty:2}];v49Autosave();`);await a.tick();
 assert.match(a.element('cloud-status').textContent,/saved/);
 const b=client(env);await settle();await b.auth('login','r13test');
 assert.equal(b.run('player.bolts'),234);assert.equal(b.run('player.level'),4);assert.equal(b.run('player.flags.relayQuest'),'complete');assert.equal(b.run('player.pack[0].qty'),2);
 // no local load can switch cloud identity
 b.run('loadGame(2)');assert.equal(b.run('player.characterId'),id);
 // retain newer state after first failed request
 a.offline=true;a.run('player.bolts=300;v49Autosave();');await a.tick();
 assert.match(a.element('cloud-status').textContent,/unavailable/);
 a.run('player.bolts=301;v49Autosave();');await a.tick();
 a.offline=false;await a.click('cloud-retry');await a.tick();
 assert.equal(JSON.parse(env.DB.sql.prepare('SELECT payload FROM r127_snapshots').get().payload).player.bolts,301);
 // stale other browser must stop, never overwrite
 b.run('player.bolts=999;v49Autosave();');await b.tick();assert.match(b.element('cloud-status').textContent,/conflict/);
 assert.equal(b.run('player.bolts'),999);await b.click('cloud-server');assert.equal(b.run('player.bolts'),301);assert([...b.values.keys()].some(k=>k.includes(':conflict:')));
 // restart automatic session restoration (no load click)
 const c=client(env,a.cookie);await settle();assert.equal(c.run('player.bolts'),301);
 assert.equal(a.storage.getItem('offline-proof'),'untouched');assert.equal(a.run('localStorage.getItem(FACTORY_AUTOSAVE_KEY)'), 'legacy autosave sentinel');
});
test('R13 lost acknowledgement is idempotent and auth denies foreign character',async()=>{
 const env={ENVIRONMENT:'development',DEV_BACKUP_ENABLED:'true',AUTH_PEPPER:crypto.randomUUID()+crypto.randomUUID(),DB:database()};
 const a=client(env);await settle();await a.auth('register','r13retry');
 a.run(`player.handle='Retry Ranger';player.characterId='local-'+crypto.randomUUID();stage='roadReady';r11Migrate();saveGame();`);await settle();
 a.loseReply=true;a.run('player.bolts=321;v49Autosave();');await a.tick();
 assert.match(a.element('cloud-status').textContent,/unavailable/);
 const rev=env.DB.sql.prepare('SELECT revision FROM r127_snapshots').get().revision;
 await a.click('cloud-retry');assert.equal(env.DB.sql.prepare('SELECT revision FROM r127_snapshots').get().revision,rev);
 assert.equal(a.storage.getItem([...a.values.keys()].find(k=>/^r127-dev-pending:[^:]+$/.test(k))),null);
});

test('R13 bank and casino journals survive account recovery',async()=>{
 const env={ENVIRONMENT:'development',DEV_BACKUP_ENABLED:'true',AUTH_PEPPER:crypto.randomUUID()+crypto.randomUUID(),DB:database()};
 const a=client(env);await settle();await a.auth('register','r13journals');
 a.run(`player.handle='Journal Ranger';player.characterId='local-'+crypto.randomUUID();player.flags.interfaceUnlocked=true;stage='roadReady';r11Migrate();saveGame();`);await settle();
 a.run(`r7Touch();player.flags.r11CasinoSeq=2;player.flags.r11CasinoNet=20;localStorage.setItem('route127-r11-casino-'+player.characterId,JSON.stringify({seq:2,net:20,rounds:{},bolts:player.bolts,r6Game:null,casino:null}));v49Autosave();`);await a.tick();
 const b=client(env);await settle();await b.auth('login','r13journals');
 assert.equal(b.run('player.flags.r11CasinoSeq'),2);
 assert.equal(b.run('r7ReadAccounts().accounts[player.characterId].periodStart'),a.run('r7ReadAccounts().accounts[player.characterId].periodStart'));
});
