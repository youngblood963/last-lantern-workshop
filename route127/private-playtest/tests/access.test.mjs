import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import worker from '../worker.mjs';
import backend from '../../backend/worker.mjs';
const credential='tester-local:'+crypto.randomUUID();
const sha256=createHash('sha256').update(credential).digest('hex');
function setup(){let assets=0;const env={ENVIRONMENT:'development',API:{fetch(request){return backend.fetch(request,env);}},DEV_BACKUP_ENABLED:'true',TESTER_ACCESS_HASHES:JSON.stringify({'tester-local':{sha256,expiresAt:Date.now()+60000}}),ASSETS:{async fetch(){assets++;return new Response('private asset');}}};return {env,assets:()=>assets};}
function req(path='/',auth=credential){return new Request('https://private.test'+path,{headers:auth===null?{}:{Authorization:'Basic '+btoa(auth)}});}
test('all frontend and API paths require access before dispatch',async()=>{
 const {env,assets}=setup();
 for(const path of ['/','/app.js','/api/health','/api/me','/api/save','/docs/secret','/?offline=1']){
  const r=await worker.fetch(req(path,null),env);assert.equal(r.status,401);assert.match(r.headers.get('WWW-Authenticate'),/^Basic /);assert.equal(r.headers.get('Cache-Control'),'no-store');
 }
 assert.equal(assets(),0);
});
test('wrong, unknown, expired, malformed and missing access credentials fail closed',async()=>{
 const {env,assets}=setup();
 for(const auth of ['tester-local:wrong','tester-other:wrong','__proto__:wrong','constructor:wrong','bad'])assert.equal((await worker.fetch(req('/',auth),env)).status,401);
 const malformed=new Request('https://private.test',{headers:{Authorization:'Basic !!!'}});assert.equal((await worker.fetch(malformed,env)).status,401);
 env.TESTER_ACCESS_HASHES=JSON.stringify({'tester-local':{sha256,expiresAt:Date.now()-1}});assert.equal((await worker.fetch(req(),env)).status,401);
 for(const value of [undefined,'','{}','null','[]','{"tester-a":{}}']){env.TESTER_ACCESS_HASHES=value;assert.equal((await worker.fetch(req(),env)).status,503);}
 assert.equal(assets(),0);
});
test('authorized assets and existing API retain independent application authentication',async()=>{
 const {env,assets}=setup();
 const asset=await worker.fetch(req(),env);assert.equal(await asset.text(),'private asset');assert.equal(assets(),1);assert.equal(asset.headers.get('Cache-Control'),'no-store');assert.match(asset.headers.get('Content-Security-Policy'),/connect-src 'self'/);
 const health=await worker.fetch(req('/api/health'),env);assert.equal(health.status,200);assert.equal((await health.json()).environment,'development');
 // A valid tester credential is NOT a game account session.
 env.AUTH_PEPPER='x'.repeat(32);env.DB={};
 assert.equal((await worker.fetch(req('/api/me'),env)).status,401);
 env.ENVIRONMENT='production';assert.equal((await worker.fetch(req(),env)).status,503);
});
