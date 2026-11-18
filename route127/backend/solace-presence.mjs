// DEVTEST social presence. The snapshot is client-reported and never authorizes gameplay.
const ONLINE_MS=120000;
const INACTIVE_MS=14*86400000;
// Verified automated QA fixtures. The retained Nuts fixture is deliberately omitted.
const archived=[
 'char-867796f8-b080-4a59-bb19-6de79d5a066a','char-97032b90-9d64-4767-ac8e-808b5b984ead',
 'char-3c6f966b-9690-4c74-98cc-e215966c1c42','char-4d646e9f-c813-4ab9-9334-662ed5b08470',
 'char-fe8893fb-c6ca-4c33-8f28-f36e427a3abd','char-e659d321-e17b-49c7-b4fa-9fc64fc5678d',
 'char-beeb2b3f-22e5-4364-876a-47e62ed56dab','char-88e938b2-4712-4a2d-aaee-aade98afdf88'
];
const PAGE_SIZE=50;
const ID=/^char-[a-f0-9-]{36}$/;
const inSolace=`(
 (json_extract(s.payload,'$.player.flags.lanternTravel.nodeId')='solace'
  AND json_extract(s.payload,'$.player.flags.lanternTravel.currentEdgeId') IS NULL
  AND NOT COALESCE(json_extract(s.payload,'$.player.flags.lanternTravel.pending'),0)
  AND json_extract(s.payload,'$.player.flags.lanternTravel.solaceAdmitted')=1)
 OR (json_type(s.payload,'$.player.flags.lanternTravel') IS NULL
  AND json_extract(s.payload,'$.stage')='mercy'
  AND json_extract(s.payload,'$.player.flags.mercyDiscovered')=1)
 )`;
const mainStreet=`${inSolace}
 AND json_extract(s.payload,'$.stage')='mercy'
 AND json_extract(s.payload,'$.mercyLocation')='town'
 AND json_extract(s.payload,'$.player.flags.solaceMenu')='town'
 AND json_extract(s.payload,'$.combatState') IS NULL
 AND json_extract(s.payload,'$.townWandererFocus') IS NULL`;
const online=`EXISTS (SELECT 1 FROM r127_solace_presence p
 JOIN r127_sessions session ON session.token_hash=p.token_hash AND session.account_id=c.account_id
 WHERE p.character_id=c.id AND p.last_seen>? AND session.expires_at>?)`;
const publicFields=`c.id,c.name,
 json_extract(s.payload,'$.player.level') AS level,
 json_extract(s.payload,'$.player.hp') AS hp,
 json_extract(s.payload,'$.player.maxHp') AS maxHp,
 json_extract(s.payload,'$.player.weapon') AS weapon,
 json_extract(s.payload,'$.player.armor') AS armor,
 json_extract(s.payload,'$.player.accessory') AS accessory`;
const number=value=>Number.isSafeInteger(value)&&value>=0?value:null;
const item=value=>typeof value==='string'&&value.length<=120&&!/[\u0000-\u001f]/.test(value)?value:null;

export async function solacePresence({req,env,auth,ch,path,response,fail}){
 const {DB:db}=env;
 if(!ch)fail(404,'Cloud character required');
 const now=Date.now(),cutoff=now-ONLINE_MS;
 const revoke=()=>db.prepare('DELETE FROM r127_solace_presence WHERE character_id=? AND token_hash=?')
  .bind(ch.id,auth.tokenHash).run();
 if(path==='/api/presence/leave'&&req.method==='POST'){
  await revoke();
  return response({ok:true});
 }
 if(path==='/api/presence/activity'&&req.method==='POST'){
  await db.prepare(`INSERT INTO r127_solace_activity(character_id,last_play_at) VALUES(?,?)
   ON CONFLICT(character_id) DO UPDATE SET last_play_at=MAX(last_play_at,excluded.last_play_at)`)
   .bind(ch.id,now).run();
  return response({ok:true});
 }
 const heartbeat=path==='/api/presence/heartbeat'&&req.method==='POST';
 const list=path==='/api/presence/survivors'&&req.method==='GET';
 const inspect=path.startsWith('/api/presence/survivors/')&&req.method==='GET';
 if(!heartbeat&&!list&&!inspect)fail(404,'Presence route unavailable');
 const saved=await db.prepare(`SELECT 1 AS present FROM r127_snapshots s
  WHERE s.character_id=? AND ${heartbeat?inSolace:mainStreet}`).bind(ch.id).first();
 if(!saved){
  if(heartbeat)await revoke();
  fail(403,'Latest cloud save is outside the required Solace area');
 }
 if(heartbeat){
  await db.batch([
   db.prepare('DELETE FROM r127_solace_presence WHERE last_seen<=?').bind(cutoff),
   db.prepare(`INSERT INTO r127_solace_presence(character_id,token_hash,last_seen)
    SELECT s.character_id,?,? FROM r127_snapshots s JOIN r127_sessions session
     ON session.token_hash=? AND session.account_id=? AND session.expires_at>?
    WHERE s.character_id=? AND ${inSolace}
    ON CONFLICT(character_id,token_hash) DO UPDATE SET last_seen=MAX(last_seen,excluded.last_seen)`)
    .bind(auth.tokenHash,now,auth.tokenHash,auth.account_id,now,ch.id)
  ]);
  return response({ok:true});
 }
 // Saved town membership and current session activity are independent.
 const eligible=`FROM r127_characters c JOIN r127_snapshots s ON s.character_id=c.id
  LEFT JOIN r127_solace_activity a ON a.character_id=c.id
  WHERE c.id<>? AND ${inSolace}
  AND c.id NOT IN (${archived.map(()=>'?').join(',')})
  AND MAX(s.updated_at,COALESCE(a.last_play_at,0))>?
  AND EXISTS (SELECT 1 FROM r127_snapshots s WHERE s.character_id=? AND ${mainStreet})`;
 const args=[cutoff,now,ch.id,...archived,now-INACTIVE_MS,ch.id];
 if(list){
  const after=new URL(req.url).searchParams.get('after')||'';
  if(after&&!ID.test(after))fail(400,'Invalid survivor cursor');
  const {results}=await db.prepare(`SELECT c.id,c.name,${online} AS online ${eligible} AND c.id>? ORDER BY c.id LIMIT ?`)
   .bind(...args,after,PAGE_SIZE+1).all();
  const survivors=results.slice(0,PAGE_SIZE).map(row=>({...row,online:!!row.online}));
  return response({survivors,next:results.length>PAGE_SIZE?survivors.at(-1).id:null});
 }
 const id=path.slice('/api/presence/survivors/'.length);
 if(!ID.test(id)||id===ch.id)fail(404,'Survivor unavailable');
 const row=await db.prepare(`SELECT ${publicFields},${online} AS online ${eligible} AND c.id=?`).bind(...args,id).first();
 if(!row)fail(404,'Survivor unavailable');
 return response({survivor:{id:row.id,name:row.name,location:'Solace',online:!!row.online,
  level:number(row.level),hp:number(row.hp),maxHp:number(row.maxHp),
  equipment:{weapon:item(row.weapon),armor:item(row.armor),accessory:item(row.accessory)}}});
}
