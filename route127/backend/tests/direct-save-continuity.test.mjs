import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.mjs';
import {database} from './d1-local.mjs';

test('direct DEVTEST restores the same fresh character under a second login',async()=>{
 const origin='https://lastlanternworkshop.com';
 const env={ENVIRONMENT:'development',DEV_BACKUP_ENABLED:'true',WO61_DIRECT_DEVTEST:'true',
  AUTH_PEPPER:crypto.randomUUID()+crypto.randomUUID(),DB:database()};
 const credentials={login:'cross-device-fixture',password:'test-'+crypto.randomUUID()};
 async function call(endpoint,data,cookie){
  const headers=new Headers();
  if(data){headers.set('Origin',origin);headers.set('Content-Type','application/json');}
  if(cookie)headers.set('Cookie',cookie);
  const response=await worker.fetch(new Request(origin+'/route127/devtest/api/'+endpoint,{
   method:data?'POST':'GET',headers,body:data?JSON.stringify(data):undefined
  }),env);
  return {status:response.status,body:await response.json(),cookie:response.headers.get('Set-Cookie')?.split(';')[0]};
 }
 const desktop=await call('register',credentials);
 assert.equal(desktop.status,200);
 const fresh={version:38,stage:'house',day:1,player:{handle:'New Ranger',level:1,xp:0,turns:30,bolts:0,flags:{}}};
 const created=await call('character',{snapshot:fresh},desktop.cookie);
 assert.equal(created.status,201);
 assert.match(created.body.character.id,/^char-/);
 const mobile=await call('login',credentials);
 assert.equal(mobile.status,200);
 assert.notEqual(mobile.cookie,desktop.cookie);
 const initial=await call('save',null,mobile.cookie);
 assert.equal(initial.status,200);
 assert.deepEqual(initial.body.snapshot,created.body.snapshot);

 const pending=structuredClone(initial.body.snapshot);
 pending.stage='r18Tournament';
 pending.player.turns=26;
 pending.player.hp=87;
 pending.player.bolts=15;
 pending.player.pack=[{name:'Scrap Metal',type:'material',qty:1}];
 pending.player.flags.r18TournamentFocus='ring';
 pending.player.flags.r18Tournaments={ring:{round:1,registered:true,victory:{round:1,rewards:['+15 Bolts']}}};
 const write={revision:initial.body.revision,requestId:crypto.randomUUID(),snapshot:pending};
 const saved=await call('save',write,mobile.cookie);
 assert.equal(saved.status,200);
 assert.equal((await call('save',write,mobile.cookie)).body.replayed,true);
 assert.equal((await call('save',{...write,requestId:crypto.randomUUID(),snapshot:initial.body.snapshot},desktop.cookie)).status,409);
 const restored=await call('save',null,desktop.cookie);
 assert.equal(restored.body.revision,saved.body.revision);
 assert.deepEqual(restored.body.snapshot,pending);
});
