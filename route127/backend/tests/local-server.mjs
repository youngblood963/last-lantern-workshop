// Local-only HTTPS server. Install a local dev certificate before browser testing.
import https from 'node:https';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import worker from '../worker.mjs';
import {database} from './d1-local.mjs';
if(!process.env.R127_DEV_CERT||!process.env.R127_DEV_KEY||!process.env.AUTH_PEPPER)throw Error('Set R127_DEV_CERT, R127_DEV_KEY and AUTH_PEPPER locally; never package their values');
const playtest=process.env.R127_PLAYTEST_STAGE==='1';
const port=playtest?8788:8787;
const origin='https://localhost:'+port;
const root=resolve(playtest?'../..':'../online-game');
const env={ENVIRONMENT:'development',DEV_BACKUP_ENABLED:'true',AUTH_PEPPER:process.env.AUTH_PEPPER,DB:database(process.env.R127_LOCAL_DB||'local-test.sqlite'),ASSETS:{async fetch(req){
 const pathname=decodeURIComponent(new URL(req.url).pathname);
 if(playtest&&pathname!=='/route-127-showcase.png'&&
    !/^\/route127\/(?:playtest|devtest|runtime|online-game|assets)\//.test(pathname))
  return new Response('Not found',{status:404});
 const p=resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
 if(!p.startsWith(root+'/')||!existsSync(p))return new Response('Not found',{status:404});
 const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.gif':'image/gif','.json':'application/json'};
 return new Response(readFileSync(p),{headers:{'Content-Type':types[extname(p)]||'application/octet-stream'}});
}}};
https.createServer({cert:readFileSync(process.env.R127_DEV_CERT),key:readFileSync(process.env.R127_DEV_KEY)},async(req,res)=>{
 try{const url=origin+req.url;const r=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:req,duplex:'half'}:{})});
 const result=await worker.fetch(r,env);res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));}
 catch{res.writeHead(500);res.end('Local test server error');}
}).listen(port,'127.0.0.1',()=>console.log(playtest?origin+'/route127/playtest/?cloud=1':origin));
