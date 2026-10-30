// WO8: two separate repeatable Industrial machine encounters. Factory Whistle is unchanged.
const WO8={
 entries:[
  {id:'WO8-HOUNDS',title:'AUTONOMOUS SECURITY HOUNDS',text:'Metallic claws click against pavement. Two rusted robotic security dogs emerge behind an overturned delivery vehicle. One scans you: "UNAUTHORIZED PERSONNEL DETECTED." The other lowers its armored head: "SECURITY RESPONSE AUTHORIZED."'},
  {id:'WO8-TAXI',title:'THE LAST AUTONOMOUS TAXI',text:'A battered yellow taxi emerges from the dust without a driver. Its roof sign reads AVAILABLE. "WELCOME TO METRO AUTOMATED TRANSPORTATION! PLEASE SELECT YOUR DESTINATION." A navigation fault blocks pedestrian departure until a fare is paid.'}
 ],
 is(id){return this.entries.some(d=>d.id===id);},
 fare(q){if(!Number.isSafeInteger(q.fare)||q.fare<1)q.fare=WO7.bolts();return q.fare;},
 choices(id){const q=WO7.state(id);if(q.done)return ['LEAVE'];if(id==='WO8-HOUNDS')return ['FIGHT THE HOUNDS','ATTEMPT TO DISABLE THEM','ATTEMPT TO FLEE'];return q.farePending?['CONFIRM FARE PAYMENT','CANCEL FARE PAYMENT','REFUSE AND FIGHT','ATTEMPT TO ESCAPE','ATTEMPT TO DISABLE THE TAXI']:['PAY THE FARE','REFUSE AND FIGHT','ATTEMPT TO ESCAPE','ATTEMPT TO DISABLE THE TAXI'];},
 fight(id,q){const level=WO7.level(),base=baseHpForLevel(level),hounds=id==='WO8-HOUNDS';
  const enemies=hounds?[{name:'SCOUT SECURITY HOUND',hp:Math.max(6,Math.round(base*.16)),bolts:0,r18Min:1,r18Max:3},{name:'ARMORED SECURITY HOUND',hp:Math.max(8,Math.round(base*.20)),bolts:0,r18Min:2,r18Max:4}]:undefined;
  q.combat=true;q.combatReward={xp:WO7.xp(hounds?1.3:1.2),bolts:0,items:hounds?[['Scrap Metal','material',2],['Electronics']]:[['Scrap Metal','material',2],['Electronics'],['Fuel']]};
  if(!hounds)add('"PAYMENT REFUSED. CUSTOMER COMPLIANCE PROCEDURE INITIATED." The taxi surges forward in short, violent bursts.','danger');
  startCombat({name:hounds?'AUTONOMOUS SECURITY HOUNDS':'MALFUNCTIONING AUTONOMOUS TAXI',level,hp:hounds?enemies.reduce((s,e)=>s+e.hp,0):Math.max(14,Math.round(base*.42)),min:hounds?1:3,max:hounds?4:6,xp:0,bolts:0,enemies,wo2Reward:'wo7Victory',wo7Key:q.key,wo7Id:id,wo2NoEquipment:true,end:hounds?'Both security hounds fall silent.':'The taxi stops. Its CUSTOMER FEEDBACK UNIT is offline.'},'encounter');WO7.save();return true;
 },
 act(id,raw){const q=WO7.state(id),cmd=String(raw).trim().toUpperCase();if(q.done){add('This encounter has already ended.','system');if(cmd==='LEAVE')completeRoadTurn();return true;}if(!this.choices(id).includes(cmd)){add('That is not an available choice.','system');return false;}
  const hounds=id==='WO8-HOUNDS';
  if(cmd==='FIGHT THE HOUNDS'||cmd==='REFUSE AND FIGHT')return this.fight(id,q);
  if(cmd==='ATTEMPT TO FLEE'||cmd==='ATTEMPT TO ESCAPE'){
   if(Math.random()<.65)return WO7.finish(q,hounds?'You break away from the hounds\' damaged patrol route. No salvage is collected.':'You escape the taxi\'s blocked route without paying or collecting loot.');
   add(hounds?'The hounds intercept your first move; you can still retreat through the normal combat menu.':'The taxi cuts across your first escape route; the normal combat retreat remains available.','danger');return this.fight(id,q);
  }
  if(cmd==='ATTEMPT TO DISABLE THEM'||cmd==='ATTEMPT TO DISABLE THE TAXI'){
   if(Math.random()<(hounds ? .60 : .55))return WO7.finish(q,hounds?'You exploit a damaged patrol authorization loop. Both hounds shut down; you retrieve limited mechanical salvage.':'You interrupt the taxi\'s damaged controller. It powers down before initiating a compliance response.',{xp:WO7.xp(hounds ? .6 : .7),items:[['Scrap Metal'],['Wire']]});
   add('The damaged controller rejects the shutdown attempt.','danger');return this.fight(id,q);
  }
  if(cmd==='CANCEL FARE PAYMENT'){delete q.farePending;add('Payment cancelled. No Bolts were taken.','system');WO7.save();WO7.render(id);return true;}
  const fare=this.fare(q);
  if(cmd==='PAY THE FARE'){add('FARE: '+fare+' BOLTS. No journey or relocation is included.','system');if(player.bolts<fare){add('You cannot afford the fare. Fight, escape or disabling remain available.','system');WO7.render(id);return false;}q.farePending=true;WO7.save();WO7.render(id);return true;}
  if(cmd==='CONFIRM FARE PAYMENT'){
   if(!q.farePending)return false;if(player.bolts<fare){add('Insufficient Bolts. Nothing was taken; you may cancel or choose another response.','system');WO7.render(id);return false;}
   player.bolts-=fare;q.farePaid=fare;delete q.farePending;return WO7.finish(q,'"TRANSACTION COMPLETE." The taxi releases the blockade. You remain on the same highway segment.');
  }
  return false;
 },
 install(){if(this.installed||!RoadScenarioRegistry.ready)return;this.installed=true;const wo=this,r=RoadScenarioRegistry;
  for(const d of this.entries){if(r.regionalByTitle.has(d.title))throw Error('Duplicate WO8 encounter '+d.title);WO7.definitions.set(d.id,[d.id,d.title,'INDUSTRIAL','combat',d.text,[]]);const e={title:d.title,text:d.text,exclusive:false,wo7:d.id,description(){return d.text+(d.id==='WO8-TAXI'?' FARE: '+wo.fare(WO7.state(d.id))+' BOLTS.':'');},prompt(){return wo.choices(d.id).join('   ');},resolve(cmd){return wo.act(d.id,cmd);}};
   const index=encounters.push(e)-1,key='early:'+index,metadata={number:null,id:key,workOrder8Id:d.id,legacyName:d.title,name:d.title,classification:'REGIONAL',regions:['INDUSTRIAL'],encounter:e,authority:'Owner approved WO8'};r.originalIds.set(e,key);r.regionalCatalog.push(metadata);r.regionalById.set(key,metadata);r.regionalByTitle.set(d.title,metadata);const entry={id:key,canonicalId:key,name:d.title,classification:'REGIONAL',region:'INDUSTRIAL',regions:['INDUSTRIAL'],encounter:e,references:[]};
   for(const road of ['early','east','coast']){const pool=r.pool(road);let i=pool.indexOf(e);if(i<0)i=pool.push(e)-1;R10_POOLS[road].combat.push(i);entry.references.push({road,category:'combat',index:i});}r.entries.push(entry);r.byId[key]=entry;
  }
  const choices=WO7.choices;WO7.choices=function(id){return wo.is(id)?wo.choices(id):choices.call(this,id);};
  const act=WO7.act;WO7.act=function(id,cmd){return wo.is(id)?wo.act(id,cmd):act.call(this,id,cmd);};
 }
};
WO8.install();
