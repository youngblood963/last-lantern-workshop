// Local gate + real SQLite-backed API for the same acceptance harness.
import https from 'node:https';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,extname,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import worker from '../worker.mjs';
import backend from '../../backend/worker.mjs';
import {database} from '../../backend/tests/d1-local.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../online-game');
const gate=JSON.parse(readFileSync(process.env.R127_TESTER_CREDENTIAL_FILE,'utf8'));
const env={ENVIRONMENT:'development',DEV_BACKUP_ENABLED:'true',AUTH_PEPPER:process.env.AUTH_PEPPER,DB:database(process.env.R127_LOCAL_DB),
 TESTER_ACCESS_HASHES:JSON.stringify({[gate.username]:{sha256:createHash('sha256').update(gate.username+':'+gate.password).digest('hex'),expiresAt:gate.expiresAt}}),
 API:{fetch(req){return backend.fetch(req,env);}},ASSETS:{async fetch(req){
 const pathname=decodeURIComponent(new URL(req.url).pathname),p=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!p.startsWith(root+'/')||!existsSync(p))return new Response('Not found',{status:404});
 return new Response(readFileSync(p),{headers:{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'})[extname(p)]||'application/octet-stream'}});
 }}};
https.createServer({cert:readFileSync(process.env.R127_DEV_CERT),key:readFileSync(process.env.R127_DEV_KEY)},async(req,res)=>{
 try{
 const r=new Request('https://localhost:8787'+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:req,duplex:'half'}:{})});
 const result=await worker.fetch(r,env);res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
 }catch{res.writeHead(500);res.end('Local test server error');}
}).listen(8787,'127.0.0.1',()=>console.log('Local-only R14 test: https://localhost:8787'));
