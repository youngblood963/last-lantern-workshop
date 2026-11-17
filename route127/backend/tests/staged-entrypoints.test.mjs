import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../../runtime/cloud-save-bootstrap.js',import.meta.url),'utf8');
const privateOrigin='https://route127-r14-private-playtest.youngblood963.workers.dev';
const publicOrigin='https://lastlanternworkshop.com';

for(const [client,origin,search,enabled] of [
 ['devtest','https://localhost:8787','?cloud=1',true],
 ['devtest',privateOrigin,'?cloud=1',false],
 ['playtest','https://localhost:8788','?cloud=1',true],
 ['playtest','https://localhost:8787','?cloud=1',false],
 ['devtest','https://localhost:8788','?cloud=1',false],
 ['devtest',publicOrigin,'?cloud=1',true],
 ['playtest',publicOrigin,'?cloud=1',false],
 ['playtest',privateOrigin,'?cloud=1',false],
 ['devtest','https://localhost:8787','?cloud=1&offline=1',false],
 ['devtest','https://localhost:8787','',false],
]){
 test(client+' '+origin+search,()=>{
  const scripts=[];
  const document={
   currentScript:{dataset:{route127Client:client},src:origin+'/route127/runtime/cloud-save-bootstrap.js'},
   head:{append(node){scripts.push(node);}},
   createElement(){return {dataset:{}};}
  };
  runInNewContext(source,{document,location:{origin,search,pathname:'/route127/'+client+'/'},
   ROUTE127_ENV:{name:client.toUpperCase()},URL,URLSearchParams});
  assert.deepEqual(scripts.map(node=>node.src),
   enabled?[origin+'/route127/online-game/cloud-dev.js?v=wo61-direct']:[]);
  assert.equal(scripts[0]?.dataset.apiPrefix,enabled&&origin===publicOrigin?'/route127/devtest/api/':undefined);
 });
}
