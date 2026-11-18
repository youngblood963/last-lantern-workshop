// R15's deliberately small authoritative ruleset. Snapshot uploads are never an input.
const NODES=Object.freeze({
 'old-house':{name:'Old House',region:'Western Wasteland',actions:{depart:'west-road'}},
 'west-road':{name:'Western Road',region:'Western Wasteland',actions:{approach:'solace',return:'old-house'}},
 solace:{name:'Solace',region:'Solace',actions:{leave:'west-road'}}
});
const CATALOG=Object.freeze({
 'rusted-pipe':{name:'Rusted Pipe',slot:'weapon',min:3,max:6},
 'worn-jacket':{name:'Worn Jacket',slot:'armor',defense:1}
});
export const WORLD_ORIGIN='https://route127-r14-private-playtest.youngblood963.workers.dev';
const ONLINE_MS=120000, PAGE_SIZE=50;
export async function worldRoute({req,env,auth,ch,path,body,response,fail,sha,devtest=false}){
 if(!path.startsWith('/api/world/'))return null;
 // The existing development backend also has a public hostname. World play is private-origin only.
 if(!devtest&&![WORLD_ORIGIN,'https://localhost:8787','https://dev.route127.test'].includes(new URL(req.url).origin))fail(403,'Private playtest origin required');
 if(env.R15_WORLD_ENABLED!=='true')fail(503,'Shared world is unavailable');
 if(!ch)fail(404,'Create your permanent character first');
 const now=Date.now(),db=env.DB;
 const get=()=>db.prepare('SELECT * FROM r127_world_characters WHERE character_id=?').bind(ch.id).first();
 const activity=()=>db.prepare(`INSERT INTO r127_world_activity(character_id,token_hash,last_seen) VALUES(?,?,?)
  ON CONFLICT(character_id,token_hash) DO UPDATE SET last_seen=excluded.last_seen`).bind(ch.id,auth.tokenHash,now);
 async function publicProfile(row){
  let weaponKey=row.weapon_key,armorKey=row.armor_key,online=row.is_online;
  if(!Object.hasOwn(row,'weapon_key')){
   const items=(await db.prepare('SELECT item_key,slot FROM r127_world_items WHERE character_id=?').bind(row.character_id).all()).results;
   weaponKey=items.find(i=>i.slot==='weapon')?.item_key;armorKey=items.find(i=>i.slot==='armor')?.item_key;
   online=!!await db.prepare(`SELECT 1 AS active FROM r127_world_activity a JOIN r127_sessions s ON s.token_hash=a.token_hash
    WHERE a.character_id=? AND a.last_seen>? AND s.expires_at>? LIMIT 1`).bind(row.character_id,now-ONLINE_MS,now).first();
  }
  const equipment={};if(weaponKey)equipment.weapon=CATALOG[weaponKey].name;if(armorKey)equipment.armor=CATALOG[armorKey].name;
  return {id:row.character_id,name:row.name,level:row.level,location:row.node,locationName:NODES[row.node].name,
   region:NODES[row.node].region,equipment,stats:{maxHp:row.max_hp,attackMin:weaponKey?CATALOG[weaponKey].min:0,
   attackMax:weaponKey?CATALOG[weaponKey].max:0,defense:armorKey?CATALOG[armorKey].defense:0},
   lastActivity:row.last_activity,online:!!online,ruleset:row.ruleset};
 }
 async function self(extra={}){
  const row=await get();
  if(!row)return response({enrolled:false,ruleset:'r15-expedition-v1'});
  const owned=(await db.prepare('SELECT id,item_key,slot,quantity FROM r127_world_items WHERE character_id=? ORDER BY slot').bind(ch.id).all()).results;
  return response({enrolled:true,character:await publicProfile({...row,name:ch.name}),revision:row.revision,
   actions:Object.keys(NODES[row.node].actions),inventory:owned.map(i=>({id:i.id,name:CATALOG[i.item_key].name,slot:i.slot,quantity:i.quantity})),...extra});
 }
 function exact(b,keys){if(Object.keys(b).some(k=>!keys.includes(k))||keys.some(k=>!Object.hasOwn(b,k)))fail(400,'Unsupported world action fields');}
 if(path==='/api/world/me'&&req.method==='GET')return self();
 if(path==='/api/world/enroll'&&req.method==='POST'){
  exact(await body(req),[]);
  // Repeated enrollment never resets location, replaces inventory, or duplicates grants.
  await db.batch([
   db.prepare('INSERT INTO r127_world_characters(character_id,last_activity) VALUES(?,?) ON CONFLICT(character_id) DO NOTHING').bind(ch.id,now),
   db.prepare(`INSERT INTO r127_world_items(id,character_id,item_key,slot)
    SELECT ?,?,'rusted-pipe','weapon' WHERE changes()=1 UNION ALL SELECT ?,?,'worn-jacket','armor' WHERE changes()=1`).bind('item-'+crypto.randomUUID(),ch.id,'item-'+crypto.randomUUID(),ch.id),
   db.prepare(`INSERT INTO r127_world_events(character_id,request_id,action,request_hash,from_node,to_node,revision,created_at)
    SELECT ?,?,'enroll','server-starter-v1',NULL,'old-house',0,? WHERE changes()=2`).bind(ch.id,crypto.randomUUID(),now),
   activity()
  ]);
  return self();
 }
 const own=await get();if(!own)fail(409,'Join the verified expedition first');
 if(path==='/api/world/heartbeat'&&req.method==='POST'){
  exact(await body(req),[]);
  await db.batch([activity(),db.prepare('UPDATE r127_world_characters SET last_activity=MAX(last_activity,?) WHERE character_id=?').bind(now,ch.id)]);
  return response({ok:true});
 }
 if(path==='/api/world/action'&&req.method==='POST'){
  const b=await body(req);exact(b,['action','revision','requestId']);
  if(!Number.isSafeInteger(b.revision)||b.revision<0||! /^[a-f0-9-]{36}$/.test(b.requestId)||typeof b.action!=='string')fail(400,'Valid action, revision and request ID required');
  const hash=await sha(JSON.stringify([b.action,b.revision]));
  const receipt=()=>db.prepare('SELECT request_hash FROM r127_world_events WHERE character_id=? AND request_id=?').bind(ch.id,b.requestId).first();
  const replay=await receipt();
  if(replay){if(replay.request_hash!==hash)fail(409,'World request ID reused');return self({replayed:true});}
  if(own.revision!==b.revision)fail(409,'World changed; refresh before continuing');
  if(!Object.hasOwn(NODES[own.node].actions,b.action))fail(400,'That travel action is not available here');
  const destination=NODES[own.node].actions[b.action];
  const result=await db.batch([
   db.prepare('UPDATE r127_world_characters SET node=?,revision=revision+1,last_activity=MAX(last_activity,?) WHERE character_id=? AND revision=? AND node=?').bind(destination,now,ch.id,b.revision,own.node),
   db.prepare(`INSERT INTO r127_world_events(character_id,request_id,action,request_hash,from_node,to_node,revision,created_at)
    SELECT ?,?,?,?,?,?,?,? WHERE changes()=1`).bind(ch.id,b.requestId,b.action,hash,own.node,destination,b.revision+1,now)
  ]);
  if(result[0].meta.changes!==1){const r=await receipt();if(r?.request_hash===hash)return self({replayed:true});fail(409,'World changed; refresh before continuing');}
  await activity().run();return self();
 }
 // One bounded query for a population page, rather than queries per survivor.
 const populationSelect=`SELECT w.*,c.name,
  (SELECT item_key FROM r127_world_items WHERE character_id=w.character_id AND slot='weapon') AS weapon_key,
  (SELECT item_key FROM r127_world_items WHERE character_id=w.character_id AND slot='armor') AS armor_key,
  EXISTS(SELECT 1 FROM r127_world_activity a JOIN r127_sessions s ON s.token_hash=a.token_hash
   WHERE a.character_id=w.character_id AND a.last_seen>? AND s.expires_at>?) AS is_online
  FROM r127_world_characters w JOIN r127_characters c ON c.id=w.character_id`;
 if(path==='/api/world/survivors'&&req.method==='GET'){
  if(own.node!=='solace')fail(403,'Visit Solace to meet survivors');
  if([...new URL(req.url).searchParams.keys()].some(k=>k!=='after'))fail(400,'Unsupported population filter');
  const after=new URL(req.url).searchParams.get('after')||'';
  if(after&&!/^char-[a-f0-9-]{36}$/.test(after))fail(400,'Invalid population cursor');
  const rows=(await db.prepare(`${populationSelect} WHERE w.node='solace' ${devtest?'AND is_online=1':''} AND w.character_id<>? AND w.character_id>? ORDER BY w.character_id LIMIT ?`).bind(now-ONLINE_MS,now,ch.id,after,PAGE_SIZE+1).all()).results;
  const page=rows.slice(0,PAGE_SIZE);
  return response({survivors:await Promise.all(page.map(publicProfile)),next:rows.length>PAGE_SIZE?page.at(-1).character_id:null});
 }
 if(path.startsWith('/api/world/survivors/')&&req.method==='GET'){
  if(own.node!=='solace')fail(403,'Visit Solace to meet survivors');
  const id=path.slice('/api/world/survivors/'.length);
  if(!/^char-[a-f0-9-]{36}$/.test(id)||id===ch.id)fail(404,'Survivor is unavailable');
  const row=await db.prepare(`${populationSelect} WHERE w.character_id=? AND w.node='solace' ${devtest?'AND is_online=1':''}`).bind(now-ONLINE_MS,now,id).first();
  if(!row)fail(404,'Survivor is unavailable');return response({survivor:await publicProfile(row)});
 }
 fail(404,'Shared-world action is unavailable');
}
