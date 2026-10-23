// Local-only HTTPS server. Install a local dev certificate before browser testing.
import https from 'node:https';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import worker from '../worker.mjs';
import {database} from './d1-local.mjs';
if(!process.env.R127_DEV_CERT||!process.env.R127_DEV_KEY||!process.env.AUTH_PEPPER)throw Error('Set R127_DEV_CERT, R127_DEV_KEY and AUTH_PEPPER locally; never package their values');
const root=resolve('../online-game');
const env={ENVIRONMENT:'development',DEV_BACKUP_ENABLED:'true',AUTH_PEPPER:process.env.AUTH_PEPPER,DB:database(process.env.R127_LOCAL_DB||'local-test.sqlite'),ASSETS:{async fetch(req){
 const pathname=decodeURIComponent(new URL(req.url).pathname);const p=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!p.startsWith(root+'/')||!existsSync(p))return new Response('Not found',{status:404});
 const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
 return new Response(readFileSync(p),{headers:{'Content-Type':types[extname(p)]||'application/octet-stream'}});
}}};
https.createServer({cert:readFileSync(process.env.R127_DEV_CERT),key:readFileSync(process.env.R127_DEV_KEY)},async(req,res)=>{
 try{const url='https://localhost:8787'+req.url;const r=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:req,duplex:'half'}:{})});
 const result=await worker.fetch(r,env);res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));}
 catch{res.writeHead(500);res.end('Local test server error');}
}).listen(8787,'127.0.0.1',()=>console.log('Local development test: https://localhost:8787'));
