const sender='route127@lastlanternworkshop.com';
const official=['Last Lantern Workshop','Luna'];
const categories=['Report a Bug','Suggest a Feature','Gameplay Balancing','Artwork or Visual Issue','General Feedback'];
const fields='id,parent_id,author,level,identity,title,message,created_at,updated_at,pinned,locked';

export async function communityRoute({req,env,auth,ch,path,body,response,fail}){
 if(!ch)fail(403,'Load your permanent character to use the community board.');
 const account=auth.account_id;
 const admin=(env.COMMUNITY_ADMIN_ACCOUNTS||'').split(',').map(id=>id.trim()).includes(account);
 const url=new URL(req.url);
 const sql=(query,...args)=>env.DB.prepare(query).bind(...args);
 const publicRow=row=>({...row,owned:row.account_id===account,account_id:undefined});
 const now=Date.now();
 const clean=(value,max,multiline=false)=>{
  if(typeof value!=='string'||!value.trim()||value.trim().length>max||
     /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)||(!multiline&&/[\r\n]/.test(value)))fail(400,'Check the required fields and length limits.');
  return value.trim();
 };
 const who=async()=>{
  const row=await sql("SELECT json_extract(payload,'$.player.level') AS level FROM r127_snapshots WHERE character_id=?",ch.id).first();
  return Math.max(1,Math.floor(Number(row?.level)||1));
 };
 if(path==='/api/community/board'&&req.method==='GET'){
  const id=url.searchParams.get('id');
  if(id){
   const post=await sql('SELECT '+fields+',account_id FROM r127_community_posts WHERE id=? AND parent_id IS NULL',id).first();
   if(!post)fail(404,'This notice has been removed.');
   const replyPage=Math.max(0,Math.min(100000,Number.parseInt(url.searchParams.get('page'),10)||0));
   const {results}=await sql('SELECT '+fields+',account_id FROM r127_community_posts WHERE parent_id=? ORDER BY created_at,id LIMIT 51 OFFSET ?',id,replyPage*50).all();
   return response({admin,post:publicRow(post),replies:results.slice(0,50).map(publicRow),more:results.length>50});
  }
  const page=Math.max(0,Math.min(100000,Number.parseInt(url.searchParams.get('page'),10)||0));
  const announcement=url.searchParams.get('kind')==='announcement';
  const {results}=await sql(`SELECT p.id,p.author,p.level,p.identity,p.title,substr(p.message,1,180) AS preview,
   p.created_at,p.updated_at,p.pinned,p.locked,
   (SELECT count(*) FROM r127_community_posts WHERE parent_id=p.id) AS replies
   FROM r127_community_posts p WHERE p.parent_id IS NULL AND p.identity IS ${announcement?'NOT NULL':'NULL'}
   ORDER BY p.pinned DESC,p.created_at DESC,p.id LIMIT 31 OFFSET ?`,page*30).all();
  const latest=await sql(`SELECT max(updated_at) AS latest FROM r127_community_posts
   WHERE parent_id IS NULL AND identity IS ${announcement?'NOT NULL':'NULL'}`).first();
  return response({admin,posts:results.slice(0,30),more:results.length>30,latest:latest?.latest||0,viewer:ch.id});
 }
 if(req.method!=='POST')fail(405,'Method not allowed');
 const data=await body(req);
 if(path==='/api/community/board'){
  if(data.action==='create'){
   const identity=data.identity||null;
   if(identity&&(!admin||!official.includes(identity)||data.parent))fail(403,'Official notices require a studio administrator.');
   const parent=data.parent||null;
   if(parent&&typeof parent!=='string')fail(400,'Invalid notice.');
   const title=parent?'':clean(data.title,100),message=clean(data.message,4000,true);
   const id=clean(data.id,36);
   if(!/^[a-f0-9-]{36}$/.test(id))fail(400,'Invalid request ID.');
   const previous=await sql('SELECT account_id FROM r127_community_posts WHERE id=?',id).first();
   if(previous){if(previous.account_id===account)return response({id});fail(409,'Request ID already used.');}
   const level=await who();
   try{
    const results=await env.DB.batch([
     sql(`INSERT INTO r127_community_posts(id,parent_id,account_id,author,level,identity,title,message,created_at,updated_at)
      SELECT ?,?,?,?,?,?,?,?,?,?
      WHERE ? IS NULL OR EXISTS(SELECT 1 FROM r127_community_posts WHERE id=? AND parent_id IS NULL AND locked=0)`,
      id,parent,account,ch.name,level,identity,title,message,now,now,parent,parent),
     sql('UPDATE r127_community_posts SET updated_at=max(updated_at,?) WHERE id=? AND changes()=1',now,parent)
    ]);
    if(!results[0].meta.changes)fail(409,'This notice is closed to responses or was removed.');
   }catch(error){
    const replay=await sql('SELECT account_id FROM r127_community_posts WHERE id=?',id).first();
    if(replay?.account_id===account)return response({id});
    if(String(error).includes('community cooldown'))fail(429,'Wait ten minutes between public notes or responses.');
    throw error;
   }
   return response({id},201);
  }
  const id=clean(data.id,36);
  const post=await sql('SELECT * FROM r127_community_posts WHERE id=?',id).first();
  if(!post)fail(404,'This notice has been removed.');
  const owned=post.account_id===account;
  if(data.action==='remove'&&(admin||(owned&&!post.identity))){
   await env.DB.batch([sql('DELETE FROM r127_community_posts WHERE id=?',id),
    sql('UPDATE r127_community_posts SET updated_at=max(updated_at,?) WHERE id=?',now,post.parent_id)]);
  }else if(data.action==='edit'&&((owned&&!post.identity)||(admin&&post.identity))){
   const message=clean(data.message,4000,true),title=post.parent_id?'':clean(data.title,100);
   await env.DB.batch([sql('UPDATE r127_community_posts SET title=?,message=?,updated_at=? WHERE id=?',title,message,now,id),
    sql('UPDATE r127_community_posts SET updated_at=max(updated_at,?) WHERE id=?',now,post.parent_id)]);
  }else if(['pinned','locked'].includes(data.action)&&admin&&!post.parent_id&&typeof data.enabled==='boolean'){
   await sql('UPDATE r127_community_posts SET '+data.action+'=?,updated_at=? WHERE id=?',Number(data.enabled),now,id).run();
  }else fail(403,'You do not have permission to change this notice.');
  return response({ok:true});
 }
 if(path!=='/api/community/feedback')fail(404,'Not found');
 if(!categories.includes(data.category))fail(400,'Choose a feedback category.');
 const subject=clean(data.subject,100),message=clean(data.message,4000,true),id=clean(data.id,36);
 if(!/^[a-f0-9-]{36}$/.test(id))fail(400,'Invalid request ID.');
 const recipient=typeof env.WORKSHOP_EMAIL_TO==='string'?env.WORKSHOP_EMAIL_TO.trim():'';
 if(!env.WORKSHOP_EMAIL||recipient.length>254||! /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(recipient))
  fail(503,'Workshop email is temporarily unavailable.');
 const level=await who();
 const existing=await sql('SELECT request_id,sent_at FROM r127_community_feedback WHERE account_id=?',account).first();
 if(existing?.request_id===id&&existing.sent_at)return response({ok:true});
 const reserved=await sql(`INSERT INTO r127_community_feedback VALUES(?,?,?,NULL)
  ON CONFLICT(account_id) DO UPDATE SET request_id=excluded.request_id,reserved_at=excluded.reserved_at,sent_at=NULL
  WHERE (sent_at IS NULL AND reserved_at<=excluded.reserved_at-300000)
     OR (sent_at IS NOT NULL AND sent_at<=excluded.reserved_at-600000)
  RETURNING request_id`,account,id,now).first();
 if(!reserved)fail(429,'A report is sending or was sent recently. Please wait before retrying.');
 const diag=(value,max=120)=>typeof value==='string'?value.replace(/[\x00-\x1f\x7f]/g,' ').trim().slice(0,max):'';
 const report=['ROUTE 127 — WORKSHOP FEEDBACK','',`Category: ${data.category}`,`Character: ${ch.name}`,
  `Character Level: ${level}`,`Location: ${diag(data.location)||'Unknown'}`,
  ...(diag(data.encounter)?[`Encounter: ${diag(data.encounter)}`]:[]),'Environment: DEVTEST',
  `Game Build: ${diag(data.build)||'Unavailable'}`,`Device: ${diag(req.headers.get('User-Agent'),220)||'Unknown'}`,
  `Submitted: ${new Date(now).toISOString()}`,'','PLAYER MESSAGE:','',message,'','END OF REPORT'].join('\n');
 try{
  const receipt=await env.WORKSHOP_EMAIL.send({from:sender,to:recipient,subject:`[ROUTE 127] [${data.category.toUpperCase()}] ${subject}`,text:report});
  if(!receipt?.messageId)throw new Error('Missing email receipt');
 }catch{
  await sql('DELETE FROM r127_community_feedback WHERE account_id=? AND request_id=? AND sent_at IS NULL',account,id).run();
  fail(502,'The Workshop could not accept your message. Your draft is still here.');
 }
 await sql('UPDATE r127_community_feedback SET sent_at=? WHERE account_id=? AND request_id=?',Date.now(),account,id).run();
 return response({ok:true});
}
