import { scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';

const COOKIE='__Host-r127dev', SESSION_MS=7*86400000, MAX_BODY=512*1024;
const enc=new TextEncoder();
const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
export const sha=async s=>hex(await crypto.subtle.digest('SHA-256',enc.encode(s)));
export async function passwordHash(password,salt,pepper){
 // OWASP scrypt alternative: N=2^14, r=8, p=5, ~16 MiB RAM.
 return new Promise((resolve,reject)=>nodeScrypt(password+pepper,salt,32,
  {N:16384,r:8,p:5,maxmem:64*1024*1024},(err,key)=>err?reject(err):resolve(key.toString('hex'))));
}
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(enc.encode(a),enc.encode(b));
function fail(status,error){throw Object.assign(new Error(error),{status});}
const response=(data,status=200,headers={})=>Response.json(data,{status,headers:{
 'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
function cookie(token='',max=SESSION_MS/1000){return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${max}`;}
async function body(req){
 if(!/^application\/json(?:;|$)/i.test(req.headers.get('Content-Type')||''))fail(415,'JSON required');
 const reader=req.body?.getReader();if(!reader)fail(400,'Body required');
 const chunks=[];let n=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>MAX_BODY){await reader.cancel();fail(413,'Body too large');}chunks.push(value);}}
 finally{reader.releaseLock();}
 const bytes=new Uint8Array(n);let pos=0;for(const c of chunks){bytes.set(c,pos);pos+=c.length;}
 let b;try{b=JSON.parse(new TextDecoder().decode(bytes));}catch{fail(400,'Invalid JSON');}
 if(!b||typeof b!=='object'||Array.isArray(b))fail(400,'Object required');return b;
}
function validName(value){
 if(typeof value!=='string'||! /^[A-Za-z][A-Za-z0-9 '-]{2,19}$/.test(value)||value!==value.trim()||/ {2}|'{2}|-{2}/.test(value))fail(400,'Use a 3–20 character name beginning with a letter');return value;
}
export function snapshot(value,id){
 if(!value||value.version!==38||typeof value.stage!=='string'||value.stage.length>80||!value.player||Array.isArray(value.player)||typeof value.player!=='object'||!value.player.flags||typeof value.player.flags!=='object'||Array.isArray(value.player.flags))fail(400,'R11 snapshot required');
 let nodes=0;
 function walk(v,depth=0){
  if(++nodes>30000||depth>40)fail(400,'Snapshot too complex');
  if(typeof v==='number'&&!Number.isFinite(v))fail(400,'Invalid number');
  if(v&&typeof v==='object')for(const [k,x]of Object.entries(v)){if(['__proto__','prototype','constructor'].includes(k))fail(400,'Unsafe snapshot key');walk(x,depth+1);}
 }
 walk(value);
 for(const k of ['bolts','bankBolts','turns','xp','level'])if(value.player[k]!==undefined&&(!Number.isSafeInteger(value.player[k])||value.player[k]<0))fail(400,'Invalid snapshot field: '+k);
 const s=JSON.parse(JSON.stringify(value));
 // Permanent identity is always the authenticated server row, never the upload.
 s.player.characterId=id;delete s.player.legacyCharacterId;
 validName(s.player.handle);
 return s;
}
async function limit(env,req,login){
 const window=Math.floor(Date.now()/60000);
 // Hash rate-limit keys; do not store raw IPs or login identifiers here.
 for(const input of ['ip:'+(req.headers.get('CF-Connecting-IP')||'local'),'login:'+login]){
  const key=await sha(input);
  const row=await env.DB.prepare(`INSERT INTO r127_auth_limits(key,window,attempts) VALUES(?,?,1)
   ON CONFLICT(key) DO UPDATE SET window=excluded.window,
   attempts=CASE WHEN window=excluded.window THEN attempts+1 ELSE 1 END RETURNING attempts`).bind(key,window).first();
  if(row.attempts>10)fail(429,'Too many attempts; wait a minute');
 }
}
async function session(env,req){
 const token=(req.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';
 if(!/^[a-f0-9]{64}$/.test(token))fail(401,'Sign in required');
 const tokenHash=await sha(token);
 const row=await env.DB.prepare('SELECT account_id FROM r127_sessions WHERE token_hash=? AND expires_at>?').bind(tokenHash,Date.now()).first();
 if(!row)fail(401,'Session expired; sign in again');return {...row,tokenHash};
}
async function character(env,account){return env.DB.prepare('SELECT id,name FROM r127_characters WHERE account_id=?').bind(account).first();}
async function handle(req,env){
 const url=new URL(req.url),path=url.pathname;
 if(env.ENVIRONMENT!=='development')return response({error:'Development backend disabled'},503);
 if(!path.startsWith('/api/')){
  if(!env.ASSETS)return response({error:'Not found'},404);
  const asset=await env.ASSETS.fetch(req),h=new Headers(asset.headers);
  h.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  h.set('X-Content-Type-Options','nosniff');return new Response(asset.body,{status:asset.status,headers:h});
 }
 if(path==='/api/health'&&req.method==='GET')return response({environment:'development',phase:1,mode:'untrusted-backup',enabled:env.DEV_BACKUP_ENABLED==='true'});
 if(!env.DB||typeof env.AUTH_PEPPER!=='string'||env.AUTH_PEPPER.length<32)return response({error:'Development configuration incomplete'},503);
 if(req.method!=='GET'&&req.method!=='POST')fail(405,'Method not allowed');
 // Same-origin only. Cookies are HttpOnly and CSRF requests must carry exact Origin.
 if(req.headers.get('Origin')&&req.headers.get('Origin')!==url.origin)fail(403,'Origin not allowed');
 if(req.method==='POST'&&req.headers.get('Origin')!==url.origin)fail(403,'Same-origin request required');
 if(['/api/register','/api/login'].includes(path)&&req.method==='POST'){
  const b=await body(req),login=typeof b.login==='string'?b.login.trim().toLowerCase():'';
  if(!/^[a-z0-9][a-z0-9_.-]{2,63}$/.test(login)||typeof b.password!=='string'||b.password.length<12||b.password.length>128)fail(400,'Use a 3–64 character login and a 12–128 character password');
  await limit(env,req,login);
  const existing=await env.DB.prepare('SELECT * FROM r127_accounts WHERE login=?').bind(login).first();
  const salt=existing?.salt||random();
  const hash=await passwordHash(b.password,salt,env.AUTH_PEPPER);
  let account=existing?.id;
  if(path==='/api/register'){
   if(existing)fail(409,'Login unavailable');account='acct-'+crypto.randomUUID();
   try{await env.DB.prepare('INSERT INTO r127_accounts(id,login,password_hash,salt,created_at) VALUES(?,?,?,?,?)').bind(account,login,hash,salt,Date.now()).run();}
   catch(e){if(/UNIQUE/.test(String(e)))fail(409,'Login unavailable');throw e;}
  }else if(!existing||!equal(existing.password_hash,hash))fail(401,'Invalid login or password');
  const token=random();
  await env.DB.prepare('INSERT INTO r127_sessions(token_hash,account_id,expires_at) VALUES(?,?,?)').bind(await sha(token),account,Date.now()+SESSION_MS).run();
  return response({ok:true,accountId:account,character:await character(env,account)},200,{'Set-Cookie':cookie(token)});
 }
 const auth=await session(env,req);
 if(path==='/api/logout'&&req.method==='POST'){
  await env.DB.prepare('DELETE FROM r127_sessions WHERE token_hash=?').bind(auth.tokenHash).run();return response({ok:true},200,{'Set-Cookie':cookie('',0)});
 }
 if(path==='/api/me'&&req.method==='GET')return response({accountId:auth.account_id,character:await character(env,auth.account_id)});
 if(env.DEV_BACKUP_ENABLED!=='true')fail(503,'Development backup is disabled');
 if(path==='/api/character'&&req.method==='POST'){
  const b=await body(req),id='char-'+crypto.randomUUID(),s=snapshot(b.snapshot,id),name=validName(s.player.handle);
  if(await character(env,auth.account_id))fail(409,'Account already has its permanent character; load it');
  try{await env.DB.batch([
   env.DB.prepare('INSERT INTO r127_characters(id,account_id,name,created_at) VALUES(?,?,?,?)').bind(id,auth.account_id,name,Date.now()),
   env.DB.prepare('INSERT INTO r127_snapshots(character_id,revision,payload,updated_at) VALUES(?,0,?,?)').bind(id,JSON.stringify(s),Date.now()),
   env.DB.prepare('INSERT INTO r127_authority(character_id) VALUES(?)').bind(id)
  ]);}catch(e){if(/UNIQUE/.test(String(e)))fail(409,'Account already has its permanent character');throw e;}
  return response({character:{id,name},revision:0,snapshot:s,mode:'untrusted-backup'},201);
 }
 const ch=await character(env,auth.account_id);if(!ch)fail(404,'Create your permanent character first');
 if(path==='/api/save'&&req.method==='GET'){
  const row=await env.DB.prepare('SELECT revision,payload,updated_at FROM r127_snapshots WHERE character_id=?').bind(ch.id).first();
  if(!row)fail(404,'Snapshot unavailable');return response({character:ch,revision:row.revision,snapshot:JSON.parse(row.payload),updatedAt:row.updated_at,mode:'untrusted-backup'});
 }
 if(path==='/api/save'&&req.method==='POST'){
  const b=await body(req);
  if(!Number.isSafeInteger(b.revision)||b.revision<0||! /^[a-f0-9-]{36}$/.test(b.requestId||''))fail(400,'Revision and request ID required');
  if(b.snapshot?.player?.characterId!==ch.id)fail(403,'Character does not match the signed-in account; sign in and reload cloud');
  const s=snapshot(b.snapshot,ch.id);
  // Name is an owned mutable field, stored with the same atomic snapshot commit.
  const name=validName(s.player.handle),payload=JSON.stringify(s),hash=await sha(payload+':'+b.revision);
  const receipt=()=>env.DB.prepare('SELECT payload_hash,revision FROM r127_receipts WHERE character_id=? AND request_id=?').bind(ch.id,b.requestId).first();
  const replay=await receipt();
  if(replay){if(replay.payload_hash!==hash)fail(409,'Request ID reused with different data');return response({ok:true,revision:replay.revision,replayed:true});}
  const result=await env.DB.batch([
   env.DB.prepare('UPDATE r127_snapshots SET payload=?,revision=revision+1,updated_at=? WHERE character_id=? AND revision=?').bind(payload,Date.now(),ch.id,b.revision),
   env.DB.prepare('INSERT INTO r127_receipts(character_id,request_id,payload_hash,revision,created_at) SELECT ?,?,?,?,? WHERE changes()=1').bind(ch.id,b.requestId,hash,b.revision+1,Date.now()),
   env.DB.prepare('UPDATE r127_characters SET name=? WHERE changes()=1 AND id=? AND EXISTS(SELECT 1 FROM r127_receipts WHERE character_id=? AND request_id=? AND payload_hash=?)').bind(name,ch.id,ch.id,b.requestId,hash)
  ]);
  if(result[0].meta.changes!==1){const r=await receipt();if(r&&r.payload_hash===hash)return response({ok:true,revision:r.revision,replayed:true});fail(409,'Newer save exists; reload cloud before continuing');}
  return response({ok:true,revision:b.revision+1});
 }
 fail(404,'Not found');
}
export default {async fetch(req,env){try{return await handle(req,env);}catch(e){return response({error:e.status?e.message:'Backend temporarily unavailable'},e.status||503);}}};
