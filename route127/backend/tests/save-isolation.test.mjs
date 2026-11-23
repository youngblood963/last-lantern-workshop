import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.mjs';
import {database} from './d1-local.mjs';

const origin='https://lastlanternworkshop.com';
const password='local-test-password';
const snapshot=(handle,turns)=>({version:38,stage:'mercy',player:{
 handle,turns,level:9,xp:350,bolts:100,flags:{quest:'started'}
}});

test('legacy save conflict and isolated hosted save lanes',async()=>{
 const publicDb=database(),devDb=database();
 const env={ENVIRONMENT:'development',DEV_BACKUP_ENABLED:'true',WO61_DIRECT_DEVTEST:'true',
  AUTH_PEPPER:crypto.randomUUID()+crypto.randomUUID(),DB:publicDb};
 const call=async(lane,path,data,cookie)=>{
  const r=await worker.fetch(new Request(origin+'/route127/devtest/api/'+(lane?lane+'/':'')+path,{
   method:data?'POST':'GET',headers:{...(data?{Origin:origin,'Content-Type':'application/json'}:{}),
    ...(cookie?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined
  }),env);
  return {status:r.status,body:await r.json(),cookie:r.headers.get('Set-Cookie')?.split(';')[0]};
 };
 const owner={login:'test-owner',password},other={login:'public-player',password};
 const legacy=await call('','register',owner);
 const legacyPlay=await call('','login',owner);
 const publicPlayer=await call('','register',other);
 const publicCharacter=await call('','character',{snapshot:snapshot('Public Ranger',30)},publicPlayer.cookie);
 const original=await call('','character',{snapshot:snapshot('Dev Ranger',1)},legacy.cookie);
 assert.equal(original.status,201);
 const aged={...original.body.snapshot,player:{...original.body.snapshot.player,turns:0}};
 const save=(lane,cookie,revision,snapshot)=>call(lane,'save',{revision,snapshot,requestId:crypto.randomUUID()},cookie);
 assert.equal((await save('',legacyPlay.cookie,0,aged)).status,200);
 assert.equal((await save('',legacy.cookie,0,original.body.snapshot)).status,409);
 const latest=(await call('','save',null,legacy.cookie)).body;
 assert.equal(latest.revision,1);
 assert.equal(latest.snapshot.player.turns,0);
 // Populate an isolated binding from a disposable legacy fixture to exercise
 // the cutover without changing any of the original rows.
 for(const [table,where,id] of [['r127_accounts','id',legacy.body.accountId],
  ['r127_characters','id',original.body.character.id],
  ['r127_snapshots','character_id',original.body.character.id],
  ['r127_authority','character_id',original.body.character.id]]) {
  const row=publicDb.sql.prepare('SELECT * FROM '+table+' WHERE '+where+' = ?').get(id);
  const keys=Object.keys(row);
  devDb.sql.prepare('INSERT INTO '+table+' ('+keys.join(',')+') VALUES ('+keys.map(()=>'?').join(',')+')').run(...Object.values(row));
 }
 Object.assign(env,{ROUTE127_SAVE_ISOLATION:'true',DEVTEST_DB:devDb,DEVTEST_LEGACY_ACCOUNT_ID:legacy.body.accountId});
 assert.equal((await call('','health')).body.saveIsolation,true);
 assert.equal((await call('','save',null,legacy.cookie)).status,409);
 assert.equal((await call('playtest','login',owner)).status,403);
 assert.equal((await call('playtest','save',null,legacyPlay.cookie)).status,403);
 const dev=await call('devtest','login',owner);
 assert.match(dev.cookie,/^__Host-r127dev-isolated=/);
 const existingPublic=await call('playtest','save',null,publicPlayer.cookie);
 assert.deepEqual(existingPublic.body.snapshot,publicCharacter.body.snapshot);
 const separate=await call('playtest','register',{login:'owner-public',password});
 const fresh=await call('playtest','character',{snapshot:snapshot('New Ranger',30)},separate.cookie);
 assert.equal(fresh.status,201);
 assert.notEqual(fresh.body.character.id,original.body.character.id);
 assert.deepEqual((await call('devtest','save',null,dev.cookie)).body,latest);
 assert.equal((await call('devtest','save',null,separate.cookie)).status,401);
 assert.equal((await save('playtest',separate.cookie,0,latest.snapshot)).status,403);
 assert.equal((await save('devtest',dev.cookie,1,original.body.snapshot)).body.revision,2);
 assert.equal((await call('playtest','save',null,separate.cookie)).body.revision,0);
 assert.equal((await save('devtest',dev.cookie,1,latest.snapshot)).status,409);
 assert.equal((await save('playtest',separate.cookie,0,fresh.body.snapshot)).body.revision,1);
 assert.equal((await call('devtest','save',null,dev.cookie)).body.revision,2);
 assert.equal((await call('devtest','logout',{},dev.cookie)).status,200);
 assert.equal((await call('playtest','save',null,separate.cookie)).status,200);
 assert.equal(publicDb.sql.prepare('SELECT revision FROM r127_snapshots WHERE character_id=?').get(original.body.character.id).revision,1);
});
