import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.mjs';

test('direct DEVTEST is disabled by default and restricted to the normal site',async()=>{
 const env={ENVIRONMENT:'development',DEV_BACKUP_ENABLED:'true',DB:{},AUTH_PEPPER:'fixture-only-not-a-deployment-secret'};
 const prefix='/route127/devtest/api/';
 const hit=(origin,path,config={})=>worker.fetch(new Request(origin+prefix+path),{...env,...config});
 const site='https://lastlanternworkshop.com';
 const enabled={WO61_DIRECT_DEVTEST:'true'};
 assert.equal((await hit(site,'health')).status,404);
 assert.equal((await hit('https://unexpected.example','health',enabled)).status,404);
 assert.equal((await hit(site,'health',enabled)).status,200);
 assert.equal((await hit(site,'save',enabled)).status,401);
 const foreign=new Request(site+prefix+'login',{method:'POST',headers:{Origin:'https://unexpected.example'}});
 assert.equal((await worker.fetch(foreign,{...env,...enabled})).status,403);
});
