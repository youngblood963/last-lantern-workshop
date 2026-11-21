import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.mjs';
import {database} from './d1-local.mjs';

const origin='https://localhost:8787';
const entry=origin+'/route127/devtest/';
const setup=()=>{
 const env={ENVIRONMENT:'development',DEV_BACKUP_ENABLED:'true',DEVTEST_WORLD_LOCAL:'true',
  AUTH_PEPPER:crypto.randomUUID()+crypto.randomUUID(),DB:database()};
 const call=async(path,data,cookie,root=entry+'api/')=>{
  const headers={Referer:entry,'User-Agent':'DEVTEST iPad fixture'};
  if(cookie)headers.Cookie=cookie;
  if(data)Object.assign(headers,{Origin:origin,'Content-Type':'application/json'});
  const r=await worker.fetch(new Request(root+path,{method:data?'POST':'GET',headers,body:data?JSON.stringify(data):undefined}),env);
  return {status:r.status,data:await r.json(),cookie:r.headers.get('Set-Cookie')?.split(';')[0]};
 };
 const player=async(name,level)=>{
  const registered=await call('register',{login:name.toLowerCase(),password:'dev-'+crypto.randomUUID()});
  const created=await call('character',{snapshot:{version:38,stage:'mercy',player:{handle:name,level,flags:{}}}},registered.cookie);
  assert.equal(created.status,201);
  return {id:registered.data.accountId,cookie:registered.cookie,call:(path,data)=>call('community/'+path,data,registered.cookie)};
 };
 return {env,call,player};
};
const post=(extra={})=>({action:'create',id:crypto.randomUUID(),title:'Road report',message:'<script>ordinary text</script>',...extra});

test('DEVTEST community shares notices and enforces author and moderator permissions',async()=>{
 const {env,call,player}=setup();
 const owner=await player('Ranger',12), other=await player('Scout',5), admin=await player('Studio',1);
 env.COMMUNITY_ADMIN_ACCOUNTS=admin.id;
 assert.equal((await call('community/board')).status,401);
 assert.equal((await call('community/board',null,owner.cookie,origin+'/api/')).status,404);
 assert.equal((await owner.call('board',post({identity:'Luna'}))).status,403);
 const original=post();
 const result=await Promise.all([owner.call('board',original),owner.call('board',post())]);
 assert.deepEqual(result.map(row=>row.status).sort(),[201,429]);
 const id=result[0].status===201?original.id:(await other.call('board')).data.posts[0].id;
 const publicList=(await other.call('board')).data.posts;
 assert.equal(publicList[0].author,'Ranger');assert.equal(publicList[0].level,12);
 assert.match(publicList[0].preview,/<script>/);assert.equal(publicList[0].account_id,undefined);
 assert.equal((await other.call('board',{id,action:'remove'})).status,403);
 const reply=post({parent:id});
 assert.equal((await other.call('board',reply)).status,201);
 assert.equal((await other.call('board',reply)).status,200);
 assert.equal((await other.call('board',{id:reply.id,action:'edit',message:'Updated response'})).status,200);
 assert.equal((await owner.call('board?id='+id)).data.replies[0].message,'Updated response');
 const official=post({identity:'Luna'});
 assert.equal((await admin.call('board',official)).status,201);
 assert.equal((await admin.call('board',{id:official.id,action:'edit',title:'Patch notes',message:'Official update'})).status,200);
 for(const action of ['pinned','locked'])assert.equal((await admin.call('board',{id:official.id,action,enabled:true})).status,200);
 assert.equal((await other.call('board',post({parent:official.id}))).status,409);
 assert.equal((await admin.call('board',{id:reply.id,action:'remove'})).status,200);
 assert.equal((await owner.call('board?id='+id)).data.replies.length,0);
 assert.equal((await owner.call('board',{id,action:'remove'})).status,200);
 assert.equal((await owner.call('board?kind=announcement')).data.posts[0].identity,'Luna');
 assert.equal((await admin.call('board',{id:official.id,action:'remove'})).status,200);
});

test('private feedback validates fields, retries delivery failures and allows one successful send per cooldown',async()=>{
 const {env,player}=setup(),owner=await player('Tester',9),messages=[];
 const report={id:crypto.randomUUID(),category:'Report a Bug',subject:'Bounty artwork',message:'Sprite missing.',
  location:'Solace',encounter:'Terrible Billy',build:'fixture',to:'untrusted@example.com'};
 assert.equal((await owner.call('feedback',report)).status,503);
 env.WORKSHOP_EMAIL={send:async()=>{assert.fail('Invalid recipient must fail before sending');}};
 assert.equal((await owner.call('feedback',report)).status,503);
 env.WORKSHOP_EMAIL_TO='invalid@example.test, other@example.test';
 assert.equal((await owner.call('feedback',report)).status,503);
 env.WORKSHOP_EMAIL_TO='verified-inbox@example.test';
 env.WORKSHOP_EMAIL={send:async()=>{throw Error('Simulated email outage');}};
 assert.equal((await owner.call('feedback',report)).status,502);
 env.WORKSHOP_EMAIL={send:async message=>{messages.push(message);return {messageId:'fixture'};}};
 assert.equal((await owner.call('feedback',{...report,subject:'Inject\r\nBcc: arbitrary@example.com'})).status,400);
 assert.equal((await owner.call('feedback',{...report,category:'Other'})).status,400);
 assert.equal((await owner.call('board',post())).status,201);
 const results=await Promise.all([owner.call('feedback',report),owner.call('feedback',report)]);
 assert(results.some(row=>row.status===200));
 assert.equal((await owner.call('feedback',report)).status,200);
 assert.equal((await owner.call('feedback',{...report,id:crypto.randomUUID()})).status,429);
 assert.equal(messages.length,1);assert.equal(messages[0].to,'verified-inbox@example.test');
 assert.equal(messages[0].from,'route127@lastlanternworkshop.com');
 assert.match(messages[0].text,/Character Level: 9/);
 assert.match(messages[0].text,/Encounter: Terrible Billy/);
 assert.match(messages[0].text,/Device: DEVTEST iPad fixture/);
 assert.equal((await owner.call('board')).data.posts.length,1);
 assert(!JSON.stringify((await owner.call('board')).data).includes('Sprite missing'));
});
