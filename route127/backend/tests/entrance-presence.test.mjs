import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.mjs';
import {database} from './d1-local.mjs';

test('DEVTEST survivor visibility uses saved locations at Solace and both entrances',async()=>{
 const origin='https://localhost:8787';
 const entry=origin+'/route127/devtest/';
 const env={ENVIRONMENT:'development',DEV_BACKUP_ENABLED:'true',DEVTEST_WORLD_LOCAL:'true',
  AUTH_PEPPER:crypto.randomUUID()+crypto.randomUUID(),DB:database()};
 async function call(path,body,cookie){
  const headers={Referer:entry};
  if(cookie)headers.Cookie=cookie;
  if(body)Object.assign(headers,{Origin:origin,'Content-Type':'application/json'});
  const reply=await worker.fetch(new Request(entry+'api/'+path,{
   headers,method:body?'POST':'GET',body:body&&JSON.stringify(body)
  }),env);
  return {status:reply.status,data:await reply.json(),cookie:reply.headers.get('Set-Cookie')?.split(';')[0]};
 }
 async function character(name,nodeId,stage,travel={}){
  const {cookie}=await call('register',{login:name.toLowerCase(),password:'qa-'+crypto.randomUUID()});
  const snapshot={version:38,stage,mercyLocation:'town',player:{handle:name,level:2,flags:{
   solaceMenu:'town',lanternTravel:{nodeId,solaceAdmitted:true,...travel}
  }}};
  const created=await call('character',{snapshot},cookie);
  assert.equal(created.status,201);
  return {cookie,id:created.data.character.id};
 }
 for(const [node,stage,label] of [
  ['factory','eastEnd','Factory entrance'],['seaport','seaport','Seaport entrance'],['solace','mercy','Solace']
 ]){
  const self=await character(node+'Self',node,stage);
  const visitor=await character(node+'Guest',node,stage);
  await character(node+'Road',node,stage,{currentEdgeId:'road',pending:true});
  assert.equal((await call('presence/heartbeat',{},visitor.cookie)).status,200);
  const list=await call('presence/survivors',null,self.cookie);
  assert.equal(list.status,200);
  assert.equal(list.data.area,node);
  assert.deepEqual(list.data.survivors.map(row=>[row.id,row.online]),[[visitor.id,true]]);
  const detail=await call('presence/survivors/'+visitor.id,null,self.cookie);
  assert.equal(detail.status,200);
  assert.equal(detail.data.survivor.location,label);
 }
});
