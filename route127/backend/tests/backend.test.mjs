import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.mjs';
import {database} from './d1-local.mjs';
const TEST_PASSWORD='test-'+crypto.randomUUID();
const origin='https://dev.route127.test';
const fixture=()=>({version:38,stage:'mercy',day:1,player:{characterId:'local-untrusted',handle:'Test Ranger',flags:{quest:'active',factory:{floor:2},portLiberated:true},bolts:200,bankBolts:50,turns:40,level:3,xp:200,pack:[{name:'Rusted Pipe',qty:1}],wandererState:{Rook:{job:'bank'}}}});
function setup(){
 const env={ENVIRONMENT:'development',DEV_BACKUP_ENABLED:'true',AUTH_PEPPER:crypto.randomUUID()+crypto.randomUUID(),DB:database()};
 const call=async(path,data,token='',headers={})=>{
  const r=await worker.fetch(new Request(origin+'/api/'+path,{method:data?'POST':'GET',headers:{...(data?{'Content-Type':'application/json',Origin:origin}:{}),...(token?{Cookie:token}:{}),...headers},body:data?JSON.stringify(data):undefined}),env);
  return {status:r.status,body:await r.json(),cookie:r.headers.get('Set-Cookie')?.split(';')[0],raw:r};
 };
 return {env,call};
}
async function register(call,login='ranger'){const r=await call('register',{login,password:TEST_PASSWORD});assert.equal(r.status,200);return r;}
test('registration, login, cookie protection, restart, expiry and logout',async()=>{
 const {call,env}=setup(),reg=await register(call);
 assert.match(reg.raw.headers.get('Set-Cookie'),/HttpOnly; Secure; SameSite=Strict/);
 const a=env.DB.sql.prepare('SELECT * FROM r127_accounts').get();assert.notEqual(a.password_hash,TEST_PASSWORD);
 assert.equal(env.DB.sql.prepare('SELECT token_hash FROM r127_sessions').get().token_hash.includes(reg.cookie.split('=')[1]),false);
 assert.equal((await call('register',{login:'RANGER',password:TEST_PASSWORD})).status,409);
 assert.equal((await call('login',{login:'ranger',password:'wrong password 1234567'})).status,401);
 const login=await call('login',{login:'ranger',password:TEST_PASSWORD});assert.equal(login.status,200);
 assert.equal((await call('me',null,login.cookie)).body.accountId,reg.body.accountId);
 assert.equal((await call('me')).status,401);
 assert.equal((await call('logout',{},login.cookie)).status,200);
 assert.equal((await call('me',null,login.cookie)).status,401);
 env.DB.sql.prepare('UPDATE r127_sessions SET expires_at=0').run();assert.equal((await call('me',null,reg.cookie)).status,401);
});
test('one character, immutable server identity, owned snapshot, rename, isolation',async()=>{
 const {call,env}=setup(),a=await register(call),b=await register(call,'other');
 const create=await call('character',{snapshot:fixture()},a.cookie);assert.equal(create.status,201);
 const id=create.body.character.id;assert.match(id,/^char-/);assert.notEqual(id,'local-untrusted');
 assert.equal((await call('character',{snapshot:fixture()},a.cookie)).status,409);
 assert.throws(()=>env.DB.sql.prepare("UPDATE r127_characters SET id='stolen'").run(),/immutable/);
 assert.equal((await call('save',null,b.cookie)).status,404);
 const snap=fixture();snap.player.handle='New Ranger';snap.player.characterId=id;
 assert.equal((await call('save',{revision:0,requestId:crypto.randomUUID(),snapshot:snap,accountId:b.body.accountId},a.cookie)).status,200);
 const forged=fixture();forged.player.characterId='victim';
 assert.equal((await call('save',{revision:1,requestId:crypto.randomUUID(),snapshot:forged},a.cookie)).status,403);
 const restored=(await call('save',null,a.cookie)).body;
 assert.equal(restored.snapshot.player.characterId,id);assert.equal(restored.character.name,'New Ranger');
 assert.deepEqual(restored.snapshot.player.pack,snap.player.pack);assert.deepEqual(restored.snapshot.player.flags,snap.player.flags);
 assert.equal((await call('save',null,b.cookie)).status,404);
 const ledger=env.DB.sql.prepare('SELECT * FROM r127_authority').get();assert.equal(ledger.wallet,0);assert.equal(ledger.bank,0);assert.equal(ledger.turns,0);assert.equal(ledger.authority_ready,0);
 await call('character',{snapshot:fixture()},b.cookie);
 const switched=fixture();switched.player.characterId=id;
 assert.equal((await call('save',{revision:0,requestId:crypto.randomUUID(),snapshot:switched},b.cookie)).status,403);
});
test('idempotent retries, stale device conflict, request key misuse and rollback',async()=>{
 const {call,env}=setup(),a=await register(call);await call('character',{snapshot:fixture()},a.cookie);
 const s=fixture();s.player.characterId=(await call('me',null,a.cookie)).body.character.id;
 const request={revision:0,requestId:crypto.randomUUID(),snapshot:s};
 assert.equal((await call('save',request,a.cookie)).body.revision,1);
 assert.equal((await call('save',request,a.cookie)).body.replayed,true);
 assert.equal((await call('save',{...request,snapshot:{...s,day:2}},a.cookie)).status,409);
 assert.equal((await call('save',{...request,requestId:crypto.randomUUID()},a.cookie)).status,409);
 assert.equal((await call('save',null,a.cookie)).body.revision,1);
 env.DB.sql.exec("CREATE TRIGGER fail_receipt BEFORE INSERT ON r127_receipts BEGIN SELECT RAISE(ABORT,'simulated interruption'); END;");
 assert.equal((await call('save',{...request,revision:1,requestId:crypto.randomUUID()},a.cookie)).status,503);
 assert.equal((await call('save',null,a.cookie)).body.revision,1);
});
test('CSRF, invalid JSON/schema/size, rate limiting and dev fail-closed',async()=>{
 const {call,env}=setup();
 assert.equal((await call('register',{login:'test',password:'password123456789' },'',{Origin:'https://evil.test'})).status,403);
 const a=await register(call);
 assert.equal((await call('character',{snapshot:{version:1}},a.cookie)).status,400);
 const evil=fixture();evil.player.flags=JSON.parse('{"__proto__":{"admin":true}}');
 assert.equal((await call('character',{snapshot:evil},a.cookie)).status,400);
 const bad=fixture();bad.player.bolts=-1;assert.equal((await call('character',{snapshot:bad},a.cookie)).status,400);
 assert.equal((await call('character',{snapshot:fixture(),padding:'x'.repeat(600000)},a.cookie)).status,413);
 for(let i=0;i<10;i++)await call('login',{login:'missing',password:'password123456789'});
 assert.equal((await call('login',{login:'missing',password:'password123456789'})).status,429);
 env.ENVIRONMENT='production';assert.equal((await call('me',null,a.cookie)).status,503);
 env.ENVIRONMENT='development';env.DEV_BACKUP_ENABLED='false';assert.equal((await call('save',null,a.cookie)).status,503);
});
test('D1 outage produces recoverable 503 without error/secret disclosure',async()=>{
 const {call,env}=setup(),a=await register(call);env.DB.prepare=()=>{throw Error('SECRET simulated DB outage');};
 const r=await call('me',null,a.cookie);assert.equal(r.status,503);assert.equal(r.body.error,'Backend temporarily unavailable');
});
test('concurrent character creation and competing device saves have one winner',async()=>{
 const {call,env}=setup(),a=await register(call);
 const created=await Promise.all([call('character',{snapshot:fixture()},a.cookie),call('character',{snapshot:fixture()},a.cookie)]);
 assert.deepEqual(created.map(x=>x.status).sort(),[201,409]);
 assert.equal(env.DB.sql.prepare('SELECT count(*) AS n FROM r127_characters').get().n,1);
 const s1=fixture(),s2=fixture();s1.player.handle='First Ranger';s2.player.handle='Other Ranger';
 s1.player.characterId=s2.player.characterId=(await call('me',null,a.cookie)).body.character.id;
 const result=await Promise.all([call('save',{revision:0,requestId:crypto.randomUUID(),snapshot:s1},a.cookie),call('save',{revision:0,requestId:crypto.randomUUID(),snapshot:s2},a.cookie)]);
 assert.deepEqual(result.map(x=>x.status).sort(),[200,409]);
 const saved=(await call('save',null,a.cookie)).body;
 assert.equal(saved.revision,1);assert.equal(saved.character.name,saved.snapshot.player.handle);
});
