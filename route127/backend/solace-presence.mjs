// DEVTEST social presence. The snapshot is client-reported and never authorizes gameplay.
const ONLINE_MS=120000;
const PAGE_SIZE=50;
const ID=/^char-[a-f0-9-]{36}$/;
const mainStreet=`json_extract(s.payload,'$.stage')='mercy'
 AND json_extract(s.payload,'$.mercyLocation')='town'
 AND json_extract(s.payload,'$.player.flags.solaceMenu')='town'
 AND json_extract(s.payload,'$.player.flags.lanternTravel.nodeId')='solace'
 AND json_extract(s.payload,'$.player.flags.lanternTravel.currentEdgeId') IS NULL
 AND NOT COALESCE(json_extract(s.payload,'$.player.flags.lanternTravel.pending'),0)
 AND json_extract(s.payload,'$.combatState') IS NULL
 AND json_extract(s.payload,'$.townWandererFocus') IS NULL`;
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
 const heartbeat=path==='/api/presence/heartbeat'&&req.method==='POST';
 const list=path==='/api/presence/survivors'&&req.method==='GET';
 const inspect=path.startsWith('/api/presence/survivors/')&&req.method==='GET';
 if(!heartbeat&&!list&&!inspect)fail(404,'Presence route unavailable');
 const saved=await db.prepare(`SELECT 1 AS present FROM r127_snapshots s
  WHERE s.character_id=? AND ${mainStreet}`).bind(ch.id).first();
 if(!saved){
  if(heartbeat)await revoke();
  fail(403,'Latest cloud save is outside Solace Main Street');
 }
 if(heartbeat){
  await db.batch([
   db.prepare('DELETE FROM r127_solace_presence WHERE last_seen<=?').bind(cutoff),
   db.prepare(`INSERT INTO r127_solace_presence(character_id,token_hash,last_seen)
    SELECT s.character_id,?,? FROM r127_snapshots s JOIN r127_sessions session
     ON session.token_hash=? AND session.account_id=? AND session.expires_at>?
    WHERE s.character_id=? AND ${mainStreet}
    ON CONFLICT(character_id,token_hash) DO UPDATE SET last_seen=MAX(last_seen,excluded.last_seen)`)
    .bind(auth.tokenHash,now,auth.tokenHash,auth.account_id,now,ch.id)
  ]);
  return response({ok:true});
 }
 // Recheck the latest snapshots for both sides. A departure save invalidates an older heartbeat.
 const eligible=`FROM r127_characters c JOIN r127_snapshots s ON s.character_id=c.id
  WHERE c.id<>? AND ${mainStreet}
  AND EXISTS (SELECT 1 FROM r127_solace_presence p JOIN r127_sessions session ON session.token_hash=p.token_hash
   WHERE p.character_id=c.id AND p.last_seen>? AND session.expires_at>?)
  AND EXISTS (SELECT 1 FROM r127_snapshots s WHERE s.character_id=? AND ${mainStreet})`;
 const args=[ch.id,cutoff,now,ch.id];
 if(list){
  const after=new URL(req.url).searchParams.get('after')||'';
  if(after&&!ID.test(after))fail(400,'Invalid survivor cursor');
  const {results}=await db.prepare(`SELECT c.id,c.name ${eligible} AND c.id>? ORDER BY c.id LIMIT ?`)
   .bind(...args,after,PAGE_SIZE+1).all();
  const survivors=results.slice(0,PAGE_SIZE);
  return response({survivors,next:results.length>PAGE_SIZE?survivors.at(-1).id:null});
 }
 const id=path.slice('/api/presence/survivors/'.length);
 if(!ID.test(id)||id===ch.id)fail(404,'Survivor unavailable');
 const row=await db.prepare(`SELECT ${publicFields} ${eligible} AND c.id=?`).bind(...args,id).first();
 if(!row)fail(404,'Survivor unavailable');
 return response({survivor:{id:row.id,name:row.name,location:'Solace Main Street',
  level:number(row.level),hp:number(row.hp),maxHp:number(row.maxHp),
  equipment:{weapon:item(row.weapon),armor:item(row.armor),accessory:item(row.accessory)}}});
}
