import {timingSafeEqual} from 'node:crypto';

const policy="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";
function protectedResponse(body,status,challenge=false){
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 if(challenge)headers['WWW-Authenticate']='Basic realm="Route 127 private playtest", charset="UTF-8"';
 return new Response(JSON.stringify({error:body}),{status,headers});
}
async function allowed(request,env){
 let entries;
 try{entries=JSON.parse(env.TESTER_ACCESS_HASHES);}catch{return null;}
 if(!entries||Array.isArray(entries)||typeof entries!=='object'||!Object.keys(entries).length)return null;
 // Only high-entropy, separately issued tester credentials are accepted.
 if(Object.entries(entries).some(([name,e])=>!/^tester-[a-z0-9-]{1,40}$/.test(name)||!e||!/^[a-f0-9]{64}$/.test(e.sha256)||!Number.isSafeInteger(e.expiresAt)))return null;
 const auth=request.headers.get('Authorization')||'';
 if(auth.length>1024||!auth.startsWith('Basic '))return false;
 let decoded;
 try{decoded=atob(auth.slice(6));}catch{return false;}
 const colon=decoded.indexOf(':'),name=decoded.slice(0,colon),entry=entries[name];
 if(colon<0||!Object.hasOwn(entries,name)||entry.expiresAt<=Date.now())return false;
 const actual=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(decoded)));
 const expected=Uint8Array.from(entry.sha256.match(/../g),h=>parseInt(h,16));
 return timingSafeEqual(actual,expected);
}
export default {async fetch(request,env){
 if(env.ENVIRONMENT!=='development')return protectedResponse('Private development host disabled',503);
 const access=await allowed(request,env);
 if(access===null)return protectedResponse('Tester access is not configured',503);
 if(!access)return protectedResponse('Private playtest access required',401,true);
 // The access check runs before BOTH static files and every API route.
 const path=new URL(request.url).pathname;
 const result=path.startsWith('/api/')?await env.API.fetch(request):await env.ASSETS.fetch(request);
 const headers=new Headers(result.headers);
 headers.set('Cache-Control','no-store');
 headers.set('Content-Security-Policy',policy);
 headers.set('X-Content-Type-Options','nosniff');
 headers.set('Referrer-Policy','no-referrer');
 headers.set('X-Frame-Options','DENY');
 return new Response(result.body,{status:result.status,statusText:result.statusText,headers});
}};
