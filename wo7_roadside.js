// WO7: 26 append-only regional roadside scenes. No map, combat-engine or clock changes.
const WO7_DEFINITIONS=[
 [
  "W1",
  "THE STRANDED FAMILY",
  "WEST",
  "exploration",
  "A family fleeing New Dominion territory waits beside a broken vehicle. A parent holds a torn repair strap while a child guards a ration tin.",
  [
   "REPAIR THE VEHICLE",
   "DONATE FOOD",
   "DONATE MEDICINE",
   "DONATE MATERIALS",
   "DEMAND PAYMENT",
   "LEAVE"
  ]
 ],
 [
  "W2",
  "THE HUNTER'S TRAP",
  "WEST",
  "environment",
  "A deer struggles in an abandoned steel trap. The chain has dug a groove through the leaves.",
  [
   "FREE THE ANIMAL",
   "KILL THE ANIMAL",
   "SALVAGE THE TRAP",
   "LEAVE"
  ]
 ],
 [
  "W3",
  "THE ABANDONED TRADING POST",
  "WEST",
  "exploration",
  "Dust covers a roadside stall, but the cache beneath its counter is neatly sorted and recently replenished.",
  [
   "TAKE THE SUPPLIES",
   "LEAVE SUPPLIES UNTOUCHED",
   "DONATE FOOD",
   "DONATE MATERIALS",
   "INVESTIGATE THE OWNER",
   "LEAVE"
  ]
 ],
 [
  "W4",
  "THE FALSE SCARECROW",
  "WEST",
  "exploration",
  "A living prisoner is tied to a post beneath a sign: THIEF. LET THE WASTELAND DECIDE. A medical wrapper lies in the mud.",
  [
   "FREE THE PRISONER",
   "QUESTION THE PRISONER",
   "EXAMINE BELONGINGS",
   "LEAVE RESTRAINED",
   "LEAVE"
  ]
 ],
 [
  "W5",
  "THE ANT COLONY",
  "WEST",
  "combat",
  "Aggressive ants swarm a partially buried backpack. The colony shifts as you approach.",
  [
   "FIGHT THE ANT SWARM",
   "DISTRACT WITH FOOD",
   "GRAB THE BACKPACK",
   "LEAVE"
  ]
 ],
 [
  "W6",
  "THE BURIED BUNKER",
  "WEST",
  "exploration",
  "Erosion exposes a bunker hatch. A survivor below demands your unit and password: the war, apparently, has never ended.",
  [
   "ENTER THE BUNKER",
   "CALL DOWN PEACEFULLY",
   "SEARCH THE ENTRANCE",
   "LEAVE"
  ]
 ],
 [
  "W7",
  "THE COUNTERFEIT RATIONS",
  "WEST",
  "combat",
  "A merchant presses a ration seal flat. The open pack beside him contains spoiled food and sawdust.",
  [
   "CONFRONT THE MERCHANT",
   "DEMAND COMPENSATION",
   "WARN TRAVELERS",
   "IGNORE THE SCAM",
   "LEAVE"
  ]
 ],
 [
  "W8",
  "THE GRAVESIDE GAMBLER",
  "WEST",
  "environment",
  "An elderly gambler deals cards beside three fresh graves. \"Winner takes the pot. Loser digs the next hole.\"",
  [
   "ACCEPT THE WAGER",
   "INVESTIGATE THE GRAVES",
   "THREATEN THE GAMBLER",
   "LEAVE"
  ]
 ],
 [
  "W9",
  "THE TRAVELING TAXIDERMIST",
  "WEST",
  "salvage",
  "Preserved animals crowd a roadside wagon. One specimen wears a human wedding ring. The taxidermist offers to buy meat or bones.",
  [
   "TRADE ANIMAL MATERIAL",
   "QUESTION THE TAXIDERMIST",
   "ACCUSE HIM OF MURDER",
   "LEAVE"
  ]
 ],
 [
  "I1",
  "THE EMPTY ASSEMBLY LINE",
  "INDUSTRIAL",
  "salvage",
  "A conveyor stamps useless brackets and drops them into a recycling chute, then begins again.",
  [
   "INSPECT THE MACHINERY",
   "STOP AND SALVAGE",
   "FOLLOW THE CHUTE",
   "LEAVE"
  ]
 ],
 [
  "I2",
  "THE LAST FAX MACHINE",
  "INDUSTRIAL",
  "environment",
  "A fax machine prints: FINAL NOTICE: YOUR PERFORMANCE REVIEW IS OVERDUE. The Human Resources door hangs open.",
  [
   "INVESTIGATE HUMAN RESOURCES",
   "REPLY TO THE FAX",
   "SALVAGE THE MACHINE",
   "LEAVE"
  ]
 ],
 [
  "I3",
  "EMPLOYEE ENTRANCE ONLY",
  "INDUSTRIAL",
  "exploration",
  "An electronic badge reader guards a maintenance entrance. The speaker clears its throat with a burst of static.",
  [
   "SEARCH FOR A BADGE",
   "FORCE THE ENTRANCE",
   "TAMPER WITH THE READER",
   "LEAVE"
  ]
 ],
 [
  "I4",
  "THE BATTERY ROOM",
  "INDUSTRIAL",
  "salvage",
  "Floodwater surrounds energized battery racks. A maintenance bay beyond them holds a compatible donor engine for Murphy's Corvette.",
  [
   "CROSS THE FLOODED FLOOR",
   "FIND THE EMERGENCY SHUTOFF",
   "SALVAGE BATTERY EQUIPMENT",
   "LEAVE"
  ]
 ],
 [
  "I5",
  "THE TRAINING VIDEO",
  "INDUSTRIAL",
  "environment",
  "A corporate safety video repeats for an empty room. A skeleton in an office chair still faces the screen.",
  [
   "WATCH THE VIDEO",
   "SEARCH THE ROOM",
   "SALVAGE THE PROJECTOR",
   "LEAVE"
  ]
 ],
 [
  "I6",
  "LIVE WIRES",
  "INDUSTRIAL",
  "environment",
  "Energized cables from a collapsed transmission tower surround a utility truck. A service recording insists help is on its way.",
  [
   "CROSS THE CABLES",
   "DISCONNECT THE POWER SOURCE",
   "SEARCH THE TRUCK SAFELY",
   "LEAVE"
  ]
 ],
 [
  "I7",
  "THE COLLAPSING CATWALK",
  "INDUSTRIAL",
  "exploration",
  "A buckled catwalk leads to a service shelf. Its corroded support joint shifts whenever the wind catches the rail.",
  [
   "CROSS THE CATWALK",
   "INSPECT THE SUPPORTS",
   "STABILIZE WITH WIRE",
   "BYPASS THE DAMAGED SECTION",
   "LEAVE"
  ]
 ],
 [
  "I8",
  "THE PARTS TRUCK",
  "INDUSTRIAL",
  "salvage",
  "A truck full of automotive parts is wedged between leaning warehouse walls. A sealed battery crate is visible through the cargo-door gap.",
  [
   "FORCE THE CARGO DOORS",
   "SEARCH THE DRIVERS CAB",
   "STABILIZE THE VEHICLE",
   "LEAVE"
  ]
 ],
 [
  "I9",
  "THE SLEEPING ROBOT",
  "INDUSTRIAL",
  "combat",
  "An inactive maintenance robot slumps against a warehouse wall. Its service panel still shows an unfinished customer request.",
  [
   "SALVAGE THE ROBOT",
   "INSPECT MAINTENANCE RECORDS",
   "REACTIVATE THE ROBOT",
   "LEAVE"
  ]
 ],
 [
  "I10",
  "THE TOOL CRIB",
  "INDUSTRIAL",
  "salvage",
  "A locked tool cage faces an inventory terminal. An overdue-return counter has rolled beyond the edge of its display.",
  [
   "FORCE THE CAGE",
   "SEARCH FOR THE SUPERVISOR CODE",
   "BYPASS THE INVENTORY TERMINAL",
   "LEAVE"
  ]
 ],
 [
  "I11",
  "THE SALVAGE YARD LEDGER",
  "INDUSTRIAL",
  "exploration",
  "A salvage ledger lists human names, shipment weights and payments. Some names are crossed out; others have figures beside them.",
  [
   "INVESTIGATE THE RECORDS",
   "SEARCH FOR SURVIVORS",
   "STEAL THE PAYMENT STASH",
   "DESTROY THE LEDGER",
   "LEAVE"
  ]
 ],
 [
  "I12",
  "THE TRAPPED WORKER",
  "INDUSTRIAL",
  "exploration",
  "Gideon Briggs is pinned beneath a tilted machine. \"Water pump parts,\" he says. \"I came for water pump parts, not a damn burial.\"",
  [
   "LIFT THE MACHINERY",
   "REPAIR THE HYDRAULIC LIFT",
   "ROB GIDEON",
   "QUESTION GIDEON",
   "LEAVE"
  ]
 ],
 [
  "I13",
  "THE WATER SHIPMENT",
  "INDUSTRIAL",
  "combat",
  "Two groups dispute a tanker of clean drinking water. A settlement party claims it; scavengers say finding it settled ownership.",
  [
   "SUPPORT THE SETTLEMENT GROUP",
   "SUPPORT THE SCAVENGERS",
   "NEGOTIATE A COMPROMISE",
   "STEAL WATER",
   "LEAVE"
  ]
 ],
 [
  "I14",
  "THE FACTORY WHISTLE",
  "INDUSTRIAL",
  "combat",
  "A factory whistle cuts across the road. Scavengers abandon their bundles and run as a security charging cradle wakes.",
  [
   "INVESTIGATE THE SIGNAL",
   "QUESTION THE FLEEING SCAVENGERS",
   "HIDE AND OBSERVE",
   "SALVAGE WARNING EQUIPMENT",
   "LEAVE"
  ]
 ],
 [
  "I15",
  "THE LAST PAYCHECK",
  "INDUSTRIAL",
  "exploration",
  "A payroll terminal rattles out Bolts. An elderly former worker shows a faded badge while several survivors argue over the tray.",
  [
   "HELP THE FORMER WORKER",
   "CLAIM THE MONEY",
   "NEGOTIATE A FAIR DIVISION",
   "INVESTIGATE PAYROLL RECORDS",
   "LEAVE"
  ]
 ],
 [
  "I16",
  "THE MIDNIGHT SHIFT",
  "INDUSTRIAL",
  "combat",
  "Workers repeat the same loading motion under malfunctioning control helmets. A security unit watches a silent shift clock.",
  [
   "INVESTIGATE THE WORKERS",
   "DISABLE THE CONTROL EQUIPMENT",
   "FIGHT THE SECURITY SYSTEM",
   "SALVAGE THE LOADING AREA",
   "LEAVE"
  ]
 ],
 [
  "I17",
  "CHEMICAL RUNOFF",
  "INDUSTRIAL",
  "environment",
  "An exposed drainage pipe pours chemical waste across the ground. A maintenance toolbox sits beyond the flooded channel.",
  [
   "CROSS THE CONTAMINATED GROUND",
   "SEARCH FOR A SAFER ROUTE",
   "CLOSE THE LEAKING VALVE",
   "LEAVE"
  ]
 ]
];
const WO7={
 definitions:new Map(WO7_DEFINITIONS.map(d=>[d[0],d])),
 level(){return Math.max(1,Math.min(50,Number(player.level)||1));},
 xp(mult=1){return Math.max(4,Math.round(Math.max(8,Math.round(this.level()*5+.32*25+2))*mult));},
 bolts(mult=1){return Math.max(2,Math.round((3+this.level()*.5)*(.32/.3)))*mult;},
 state(id){if(typeof RoadLifecycle!=='undefined')return RoadLifecycle.wo7State(id);const g=lanternState(),key=(g?.sceneId||[day,dailyRoadTurns,roadGoal,roadTurn].join(':'))+'|'+id;let q=player.flags.wo7Scene;if(!q||q.key!==key)q=player.flags.wo7Scene={id,key,done:false,seen:{}};return q;},
 save(){v49Autosave();},
 has(name,qty=1){return player.pack.filter(i=>i.name===name&&i.qty>0).reduce((n,i)=>n+i.qty,0)>=qty;},
 take(items){if(items.some(([n,q])=>!this.has(n,q))){add('You need '+items.map(([n,q])=>q+' '+n).join(' and ')+'. Nothing was consumed.','system');return false;}for(const [name,qty] of items){let left=qty;for(const i of [...player.pack]){if(i.name!==name)continue;const n=Math.min(left,i.qty);i.qty-=n;left-=n;if(!i.qty)player.pack.splice(player.pack.indexOf(i),1);if(!left)break;}}return true;},
 damage(fraction,message){add(message,'danger');roadHurt(Math.max(2,Math.round((100+10*(this.level()-1))*fraction)));return stage!=='fallen';},
 award(q,reward={}){if(q.done)return false;q.done=true;q.combat=false;if(reward.xp)gainXp(reward.xp);if(reward.bolts)gainBolts(reward.bolts);for(const [name,type='material',qty=1]of reward.items||[])for(let i=0;i<qty;i++)r18RetainRoadReward(name,type);return true;},
 finish(q,message,reward={}){if(!this.award(q,reward))return true;add(message,'reward');this.save();completeRoadTurn();return true;},
 observe(q,key,message){q.seen[key]=true;add(message,'system');this.save();this.render(q.id);return true;},
 render(id){if(stage==='combat'||stage==='fallen')return;stage='encounter';r5DirectChoices(this.choices(id));},
 choices(id){const d=this.definitions.get(id),q=this.state(id);if(q.done)return ['LEAVE'];if(id==='W8'&&q.wager)return ['CONFIRM WAGER','CANCEL WAGER','LEAVE'];let options=[...d[4+1]];
  if(id==='W6'&&q.entered)options=['REASSURE THE SURVIVOR','THREATEN THE SURVIVOR','SEARCH THE ENTRANCE','LEAVE'];
  if(id==='I3'&&q.badge)options.unshift('USE THE FOUND BADGE');
  if(id==='I10'&&q.code)options.unshift('ENTER THE SUPERVISOR CODE');
  if(id==='I7'&&q.braced)options=options.filter(x=>x!=='STABILIZE WITH WIRE');
  if(id==='I8'&&q.safe)options=options.filter(x=>x!=='STABILIZE THE VEHICLE');
  if(id==='I12'&&q.failedLift)options=options.filter(x=>x!=='LIFT THE MACHINERY');
  return options;
 },
 combat(q,name,type='human',count=1,reward={}){
  const level=this.level(),fraction=type==='animal'?.18:.34,each=Math.max(2,Math.round(baseHpForLevel(level)*fraction/count));
  q.combat=true;q.combatReward={xp:this.xp(),...(type==='human'?{bolts:this.bolts(count)}:{}),...reward};
  if(type==='machine'&&!reward.items)q.combatReward.items=[['Scrap Metal'],['Electronics']];
  const enemies=count>1?Array.from({length:count},(_,i)=>({name:name+' '+(i+1),hp:each,bolts:0,r18Min:1,r18Max:count>=4?2:4})):undefined;
  startCombat({name,level,hp:each*count,min:2,max:5,xp:0,bolts:0,enemies,wo2Reward:'wo7Victory',wo7Key:q.key,wo7Id:q.id,wo2NoEquipment:type!=='human',end:'The roadside confrontation ends.'},'encounter');this.save();return true;
 },
 engineAvailable(){return !player.flags.wo7EngineRecovered&&!player.flags.wo3Corvette?.engineDelivered;},
 recoverEngine(){if(!this.engineAvailable())return false;player.flags.wo7EngineRecovered=true;player.flags.wo7EnginePending=true;add('You secure the donor engine for Murphy. Submit Corvette parts at his workshop to accept the recovered engine.','reward');return true;},
 batteryAvailable(){return !RoadScenarioRegistry.wo2State().wo3Battery&&!player.flags.wo3Corvette?.delivered?.battery&&!this.has('Corvette Battery');},
 recoverBattery(){if(!this.batteryAvailable())return false;RoadScenarioRegistry.wo2State().wo3Battery=true;player.flags.wo7BatteryRecovered=true;r18RetainRoadReward('Corvette Battery','quest');add('You secure the existing Corvette Battery for Murphy.','reward');return true;},
 rescue(q){player.flags.wo7GideonRescued=true;this.ensureGideon();return this.finish(q,'You free Gideon Briggs. He can meet you on the road; recruitment still requires liberated Seaport.',{xp:this.xp(1.5),items:[['Wire']]});},
 ensureGideon(){if(!player.flags.wo7GideonRescued)return;let w=wandererByName('Gideon Briggs');if(!w){w={name:'Gideon Briggs',level:7,definitionLevel:7,occupation:'Mechanic',specialty:'Industrial Mechanic',vibe:'practical and stubborn',lines:['GIDEON BRIGGS > You pulled a whole damn machine off me. Least I can do is help keep yours running.','Gideon checks the pump fasteners he carried out of the industrial wreck.']};wanderers.push(w);wandererLocations[w.name]='road';RoadScenarioRegistry.wanderers.push({id:'wanderer:'+w.name,name:w.name,region:'GLOBAL',category:'wanderer',npc:w});}v50EnsureWandererLevel(w);const s=ws(w.name);s.seaportAptitudes=s.seaportAptitudes||{medicine:2,trading:2,mechanics:5,banking:1};},
 act(id,raw){const q=this.state(id),cmd=String(raw).trim().toUpperCase();if(q.done){add('This encounter has already ended.','system');if(cmd==='LEAVE')completeRoadTurn();return true;}if(!this.choices(id).includes(cmd)){add('That is not an available choice.','system');return false;}if(cmd==='LEAVE')return this.finish(q,'You leave the roadside scene behind.');
 const xp=this.xp.bind(this),bolts=this.bolts.bind(this),finish=(text,reward)=>this.finish(q,text,reward),observe=(key,text)=>this.observe(q,key,text),fight=(name,type,count,reward)=>this.combat(q,name,type,count,reward);
 switch(id){
 case 'W1':
  if(cmd==='REPAIR THE VEHICLE'){if(!this.take([['Wire',1],['Scrap Metal',1]]))return false;return finish('The family restarts the vehicle and drives away from Dominion territory.',{xp:xp(1.2)});}
  if(cmd==='DONATE FOOD'||cmd==='DONATE MEDICINE'||cmd==='DONATE MATERIALS'){const item=cmd==='DONATE FOOD'?'Energy Bars':cmd==='DONATE MEDICINE'?'Bandage':'Cloth';if(!this.take([[item,1]]))return false;return finish('The family accepts your '+item+' and thanks you without promising what they cannot afford.',{xp:xp(.8)});}
  if(!this.take([['Wire',1]]))return false;return finish('You agree a price before reconnecting the loose lead. The parent pays; their thanks are careful.',{xp:xp(.6),bolts:bolts(2)});
 case 'W2':
  if(cmd==='FREE THE ANIMAL'){if(Math.random()<.35&&!this.damage(.035,'The animal kicks as the trap opens.'))return true;return finish('The deer limps into cover. The abandoned chain stays behind.',{xp:xp(.9)});}
  if(cmd==='KILL THE ANIMAL')return finish('You put the trapped animal down and use its existing meat and bone resources.',{xp:xp(.4),items:[['Raw Venison'],['Animal Bones']]});
  return finish('You dismantle the trap. The freed deer scrambles away from the broken jaws.',{xp:xp(.5),items:[['Scrap Metal']]});
 case 'W3':
  if(cmd==='INVESTIGATE THE OWNER')return observe('owner','A supply note reads ADA QUILL — COUNT WHAT YOU TAKE. The last letters are smeared, but the tidy figures resemble Ada Quill\'s records. Someone depends on this cache.');
  if(cmd==='TAKE THE SUPPLIES'){if(!r18TheftAllowed())return false;if(Math.random()<.3)r18TheftCaught('Trading post cache keeper');r18StolenReward('Bandage','consumable');return finish('You take a sealed bandage from the maintained cache. The next traveler will find one less.',{xp:xp(.3)});}
  if(cmd==='LEAVE SUPPLIES UNTOUCHED')return finish('You leave the organized cache for its owner.',{xp:xp(.4)});
  if(!this.take([[cmd==='DONATE FOOD'?'Energy Bars':'Scrap Metal',1]]))return false;return finish('You add a useful item and leave a clear count on the cache note.',{xp:xp(.8)});
 case 'W4':
  if(cmd==='QUESTION THE PRISONER')return observe('question','The prisoner admits taking medicine, but says it was for a feverish relative. The label names a different household. There is no witness here to settle either claim.');
  if(cmd==='EXAMINE BELONGINGS')return observe('belongings','An empty food wrapper and a torn medical label lie in the bundle. They prove hunger, perhaps, but not innocence. You leave the belongings where they are.');
  return finish(cmd==='FREE THE PRISONER'?'You cut the restraints without declaring a verdict. The prisoner staggers toward cover.':'You leave the prisoner restrained beneath the accusation.',cmd==='FREE THE PRISONER'?{xp:xp(.9)}:{});
 case 'W5':
  if(cmd==='DISTRACT WITH FOOD'){if(!this.take([['Energy Bars',1]]))return false;return finish('The ants follow the scattered ration. You retrieve the backpack without killing them.',{xp:xp(.8),items:[['Bandage','consumable'],['Cloth']]});}
  if(cmd==='GRAB THE BACKPACK'&&Math.random()>=.45){if(!this.damage(.035,'Ants bite through your cuffs as you pull the pack free.'))return true;return finish('You escape the colony with the abandoned pack.',{xp:xp(.6),items:[['Energy Bars','consumable']]});}
  return fight('ANT SWARM','animal',5,{bolts:0,items:[['Bandage','consumable'],['Cloth']]});
 case 'W6':
  if(cmd==='ENTER THE BUNKER'){q.entered=true;if(Math.random()<.3)return fight('FRIGHTENED BUNKER SURVIVOR');return observe('entered','A rifle rises from below. "Which front? Who sent you?" You can explain yourself or threaten the survivor.');}
  if(cmd==='THREATEN THE SURVIVOR')return fight('BUNKER SURVIVOR');
  if(cmd==='SEARCH THE ENTRANCE')return finish('You salvage a disconnected cable outside the hatch without taking the survivor\'s stores.',{xp:xp(.5),items:[['Wire']]});
  return finish('You explain that you are a traveler, not an assault team. The survivor lowers the rifle but keeps the radio listening for orders.',{xp:xp(.9)});
 case 'W7':
  if(cmd==='CONFRONT THE MERCHANT')return fight('COUNTERFEIT RATION MERCHANT','human',1,{bolts:bolts(3),items:[['Cloth']]});
  if(cmd==='DEMAND COMPENSATION'){if(Math.random()<.35)return fight('COUNTERFEIT RATION MERCHANT');return finish('With travelers watching, the merchant pays compensation and packs up the resealed cartons.',{xp:xp(.7),bolts:bolts(2)});}
  return finish(cmd==='WARN TRAVELERS'?'You show travelers the sawdust and broken seals. They refuse the merchant\'s offer.':'You leave the scam for someone else to discover.',cmd==='WARN TRAVELERS'?{xp:xp(.9)}:{});
 case 'W8':
  if(cmd==='INVESTIGATE THE GRAVES')return observe('graves','The markers have no names. One card is pinned under a fresh stone. The gambler says nothing about who dug first.');
  if(cmd==='THREATEN THE GAMBLER')return fight('GRAVESIDE GAMBLER');
  if(cmd==='ACCEPT THE WAGER'){q.wager=10;return observe('offer','Ten Bolts each. A fair cut of the deck decides the pot. You can confirm or cancel before staking anything.');}
  if(cmd==='CANCEL WAGER'){delete q.wager;return observe('cancel','No stake was taken. The gambler gathers the cards and waits.');}
  if(player.bolts<q.wager){add('You cannot wager more Bolts than you possess. Nothing was taken.','system');return false;}
  {const stake=q.wager;if(!Number.isSafeInteger(stake)||stake<=0)return false;player.bolts-=stake;const win=RoadScenarioRegistry.wo2Roll(0,1)===1;return finish(win?'Your card wins. The gambler pays the pot, then asks whose turn it is to hold the shovel.':'You lose the stake. You scrape loose earth into an empty hole, then leave without learning who it was meant for.',{xp:xp(.4),bolts:win?stake*2:0});}
 case 'W9':
  if(cmd==='QUESTION THE TAXIDERMIST')return observe('ring','"Animals swallow things," he says, covering the ring with a cloth. The specimen\'s glass eyes explain nothing.');
  if(cmd==='ACCUSE HIM OF MURDER')return fight('TRAVELING TAXIDERMIST');
  {const i=player.pack.find(i=>i.type==='material'&&i.qty>0&&!i.protected&&!i.unique&&(/Bones/.test(i.name)||R18_FOOD_GROUPS.meat.includes(i.name)));if(!i){add('You have no eligible existing meat or bones to trade.','system');return false;}if(i.stolen&&r18SaleDetected(i,'Traveling taxidermist'))return finish('The taxidermist refuses the recognized stolen material.');const name=i.name,price=name==='Small Animal Bones'?2:/Bones/.test(name)?4:3;this.take([[name,1]]);return finish('He pays for '+name+' and draws the wagon curtain over the ring.',{xp:xp(.3),bolts:price});}
 case 'I1':
  if(cmd==='INSPECT THE MACHINERY')return observe('mechanism','The off switch is beside a guard rail. The recycling chute returns every useless bracket to the same press.');
  if(cmd==='FOLLOW THE CHUTE'){if(!this.damage(.035,'A falling bracket catches your shoulder as you reach the recycling bin.'))return true;return finish('You recover heavier scrap from the recycling loop and crawl out.',{xp:xp(.9),items:[['Scrap Metal','material',2]]});}
  if(!q.seen.mechanism&&Math.random()<.3&&!this.damage(.04,'The moving belt snags your sleeve before the stop catches.'))return true;return finish('The conveyor stops. You remove recoverable controls instead of the useless stamped parts.',{xp:xp(.8),items:[['Electronics'],['Wire']]});
 case 'I2':
  if(cmd==='REPLY TO THE FAX')return finish('The fax prints: YOUR APPEAL HAS BEEN DENIED. A loose cable comes free as the paper tray falls shut.',{xp:xp(.7),items:[['Wire']]});
  return finish(cmd==='INVESTIGATE HUMAN RESOURCES'?'Human Resources contains blank review forms and a stamp reading SATISFACTORY ABSENCE. You take the clean packing cloth.':'You disconnect the fax. The overdue-review notice is its final performance.',{xp:xp(.7),items:[[cmd==='SALVAGE THE MACHINE'?'Electronics':'Cloth']]});
 case 'I3':
  if(cmd==='SEARCH FOR A BADGE'){q.badge=true;return observe('badge','A cracked badge is still clipped to the inside of a discarded coat. You can use it here without keeping another access card.');}
  if(cmd==='TAMPER WITH THE READER'&&!this.take([['Wire',1]]))return false;
  if(cmd==='FORCE THE ENTRANCE'&&!this.damage(.035,'The door jerks loose and catches your knuckles.'))return true;
  return finish('The door opens. "YOU ARE LATE FOR WORK. THIS INCIDENT HAS BEEN RECORDED." Maintenance supplies wait beyond the reader.',{xp:xp(.8),items:[['Scrap Metal'],['Cloth']]});
 case 'I4':
  if(cmd==='FIND THE EMERGENCY SHUTOFF'){q.safe=true;return observe('shutoff','The disconnect is above the waterline. You cut power; the maintenance bay can now be reached safely.');}
  if(!q.safe&&Math.random()<.6){if(!this.damage(.06,'Current arcs across the flooded floor. You retreat before reaching the maintenance bay.'))return true;return finish('The engine remains in the maintenance bay. It can be recovered on a future visit; nothing unique was claimed.');}
  this.recoverEngine();return finish('You reach the maintenance bay and recover usable battery leads.',{xp:xp(1.1),items:[['Wire'],['Scrap Metal']]});
 case 'I5':
  return finish(cmd==='WATCH THE VIDEO'?'IN THE EVENT OF NUCLEAR WAR, PLEASE REMAIN AT YOUR WORKSTATION UNTIL MANAGEMENT PROVIDES FURTHER INSTRUCTIONS. The tape loops back to workplace punctuality.':cmd==='SEARCH THE ROOM'?'A sealed emergency ration survives behind the training-room chair.':'You salvage the tired video equipment without waiting for further instructions.',{xp:xp(.7),...(cmd==='WATCH THE VIDEO'?{}:{items:[[cmd==='SEARCH THE ROOM'?'Energy Bars':'Electronics',cmd==='SEARCH THE ROOM'?'consumable':'material']]})});
 case 'I6':
  if(cmd==='DISCONNECT THE POWER SOURCE'){q.safe=true;return observe('power','You disconnect a local generator. The speaker announces: SERVICE WILL BE RESTORED IN SIX TO EIGHT BUSINESS DAYS.');}
  if(cmd==='CROSS THE CABLES'&&!q.safe&&!this.damage(.05,'An energized cable lashes the truck\'s frame.'))return true;
  return finish('From the utility truck you hear: SERVICE RESTORATION REQUIRES SIX TO EIGHT BUSINESS DAYS. You recover equipment and leave the cable field.',{xp:xp(.8),items:cmd==='SEARCH THE TRUCK SAFELY'?[['Wire']]:[['Wire'],['Scrap Metal']]});
 case 'I7':
  if(cmd==='INSPECT THE SUPPORTS')return observe('supports','The failure is at a corroded support joint, not the floor panels. One Wire can brace it long enough for a crossing.');
  if(cmd==='STABILIZE WITH WIRE'){if(!this.take([['Wire',1]]))return false;q.braced=true;return observe('brace','You tension the damaged joint with wire. The catwalk stops shifting, but the repair is temporary.');}
  if(cmd==='BYPASS THE DAMAGED SECTION')return finish('You stay below the failed support and retrieve a loose cable from the lower landing.',{xp:xp(.5),items:[['Wire']]});
  if(!q.braced&&Math.random()<.5){if(!this.damage(.065,'The support folds. You catch a lower rail and scramble down without reaching the shelf.'))return true;return finish('The unstable crossing is over. You leave the inaccessible shelf alone.');}
  return finish('You cross the supported span and bring down the maintenance case.',{xp:xp(1.1),items:[['Scrap Metal','material',2],['Electronics']]});
 case 'I8':
  if(cmd==='SEARCH THE DRIVERS CAB'){q.cab=true;return observe('cab','The cargo key and a diagram show how to open the doors without levering against the leaning wall.');}
  if(cmd==='STABILIZE THE VEHICLE'){if(!this.take([['Wire',1]]))return false;q.safe=true;return observe('vehicle','You secure the truck to a surviving anchor. The door can be opened without shifting the warehouse wall.');}
  if(!q.safe&&!q.cab&&Math.random()<.55){if(!this.damage(.055,'A warehouse panel slams against the truck. You back out before opening the crate.'))return true;return finish('The battery remains recoverable. No unique part was claimed by the failed attempt.');}
  this.recoverBattery();return finish('The doors open and you secure the automotive salvage.',{xp:xp(),items:[['Scrap Metal']]});
 case 'I9':
  if(cmd==='INSPECT MAINTENANCE RECORDS')return observe('records','The work order is marked unresolved. "PLEASE RATE YOUR CUSTOMER SATISFACTION AFTER MAINTENANCE," the speaker murmurs. The isolation switch is labelled.');
  if(cmd==='REACTIVATE THE ROBOT'||!q.seen.records&&Math.random()<.4){add('"MAINTENANCE REQUEST ACCEPTED. CUSTOMER SATISFACTION IS MANDATORY."','danger');return fight('MAINTENANCE ROBOT','machine');}
  return finish('You isolate the sleeping robot and recover its existing mechanical materials. No service survey follows.',{xp:xp(.9),items:[['Electronics'],['Scrap Metal']]});
 case 'I10':
  if(cmd==='SEARCH FOR THE SUPERVISOR CODE'){q.code=true;return observe('code','The supervisor wrote the local code inside a drawer: 0417. No access credential needs to be kept.');}
  if(cmd==='BYPASS THE INVENTORY TERMINAL'&&!this.take([['Wire',1]]))return false;
  if(cmd==='FORCE THE CAGE'&&!this.damage(.03,'The cage latch snaps against your wrist.'))return true;
  return finish('The cage opens. "LATE RETURN FEE: EXCEEDS AVAILABLE DISPLAY SPACE." You take tools as ordinary salvage, not a permanent loan.',{xp:xp(.8),items:[['Scrap Metal'],['Wire']]});
 case 'I11':
  if(cmd==='INVESTIGATE THE RECORDS')return observe('ledger','Human names sit beside shipment weights. A Dominion shipping notation appears on an old invoice, but the ledger alone cannot distinguish wages from prices.');
  if(cmd==='SEARCH FOR SURVIVORS')return finish('You open a jammed side door and a frightened scavenger escapes. They cannot tell you what the ledger means.',{xp:xp(1.2),items:[['Cloth']]});
  if(cmd==='STEAL THE PAYMENT STASH'){if(!r18TheftAllowed())return false;if(Math.random()<.35)r18TheftCaught('Salvage yard payment keeper');return finish('You take the payment stash, leaving the names and unanswered questions behind.',{xp:xp(.4),bolts:bolts(3)});}
  return finish('The ledger burns. It may protect the named people from being traced; it may also destroy the only evidence they had.',{xp:xp(.6)});
 case 'I12':
  if(cmd==='QUESTION GIDEON')return observe('gideon','Gideon was scavenging parts for a settlement water pump. "Fix the hydraulics. Do not just shove the thing onto my other leg."');
  if(cmd==='ROB GIDEON'){if(player.flags.wo7GideonRobbed){add('You already took Gideon’s belongings. His rescue remains possible.','system');return false;}if(!r18TheftAllowed())return false;r18TheftCaught('Gideon Briggs');player.flags.wo7GideonRobbed=true;return finish('You rob Gideon while he is trapped. He has not been rescued and is not unlocked for recruitment.',{bolts:bolts(2)});}
  if(cmd==='REPAIR THE HYDRAULIC LIFT'){if(!this.take([['Wire',1],['Scrap Metal',1]]))return false;return this.rescue(q);}
  if(Math.random()<.5)return this.rescue(q);q.failedLift=true;if(!this.damage(.035,'The machine settles back onto its supports. Gideon remains trapped; the hydraulic repair is still possible.'))return true;this.save();this.render(id);return true;
 case 'I13':
  if(cmd==='NEGOTIATE A COMPROMISE')return finish('The tanker manifest names a third settlement that no longer exists. Neither present group inherited it. They divide the water by need and thank you with supplies and Bolts.',{xp:xp(1.4),bolts:bolts(),items:[['Energy Bars','consumable']]});
  if(cmd==='STEAL WATER'){if(!r18TheftAllowed())return false;r18TheftCaught('Water shipment claimants');add('You siphon a share. Both groups notice; scavengers block your escape.','danger');return fight('TANKER SCAVENGERS','human',2,{bolts:bolts(2),items:[['Energy Bars','consumable']]});}
  return fight(cmd==='SUPPORT THE SETTLEMENT GROUP'?'TANKER SCAVENGERS':'SETTLEMENT WATER GUARDS','human',2,{bolts:bolts(2)});
 case 'I14':
  if(cmd==='QUESTION THE FLEEING SCAVENGERS')return observe('warning','"The whistle wakes the security unit. Watch the charging cradle before touching the warning gear."');
  if(cmd==='HIDE AND OBSERVE'){q.observed=true;return observe('patrol','An existing industrial security drone sweeps the yard, then returns to its cradle. The warning cabinet can be approached during its pause.');}
  if(cmd==='SALVAGE WARNING EQUIPMENT'&&q.observed)return finish('You strip the warning cabinet while the drone is docked, then withdraw.',{xp:xp(.9),items:[['Electronics'],['Wire']]});
  return fight('INDUSTRIAL SECURITY DRONE','machine');
 case 'I15':
  if(cmd==='INVESTIGATE PAYROLL RECORDS')return observe('payroll','GROSS PAY: '+bolts(600)+'. DEDUCTIONS: '+(bolts(600)-bolts(6))+'. NET PAY AVAILABLE: '+bolts(6)+'. Almost the entire paycheck vanished before anyone reached the tray.');
  if(cmd==='CLAIM THE MONEY')return fight('PAYROLL CLAIMANTS','human',2,{xp:xp(1.5),bolts:bolts(5)});
  return finish(cmd==='HELP THE FORMER WORKER'?'You help the former worker collect a share. They insist you take a modest amount for your trouble.':'You divide the remaining payroll openly. Everyone loses the argument; nobody has to lose the day to a fight.',{xp:xp(cmd==='HELP THE FORMER WORKER'?1:1.4),bolts:bolts(cmd==='HELP THE FORMER WORKER'?1:2)});
 case 'I16':
  if(cmd==='INVESTIGATE THE WORKERS')return observe('helmets','The helmets repeat a loading instruction. A control cable connects them to the security terminal.');
  if(cmd==='DISABLE THE CONTROL EQUIPMENT'){if(!this.take([['Wire',1]]))return false;return finish('The control circuit opens. A worker removes the helmet: "I\'ve been working this shift for eleven years." They share saved Bolts and escape.',{xp:xp(1.6),bolts:bolts(2),items:[['Electronics']]});}
  if(cmd==='FIGHT THE SECURITY SYSTEM')return fight('INDUSTRIAL SECURITY DRONE','machine',1,{xp:xp(1.7),bolts:0,items:[['Electronics'],['Scrap Metal']],workers:true});
  return finish('You salvage the loading area and leave the still-repeating shift behind.',{xp:xp(.5),items:[['Scrap Metal','material',2]]});
 case 'I17':
  if(cmd==='CLOSE THE LEAKING VALVE'){q.safe=true;return observe('valve','You close the source valve. The drainage level falls, exposing dry maintenance stones across the channel.');}
  if(cmd==='SEARCH FOR A SAFER ROUTE')return finish('You follow the high maintenance ledge and retrieve the toolbox\'s loose cable without entering the runoff.',{xp:xp(.6),items:[['Wire']]});
  if(!q.safe&&!this.damage(.05,'Chemical waste splashes your boots and burns exposed skin as you cross.'))return true;
  return finish(q.safe?'With the source stopped, you bring the maintenance toolbox across dry stones.':'You reach the toolbox and retreat across the contaminated ground.',{xp:xp(q.safe?1:.6),items:q.safe?[['Scrap Metal','material',2],['Wire']]:[['Scrap Metal']]});
 }
 return false;
 },
 install(){if(this.installed||!RoadScenarioRegistry.ready)return;this.installed=true;const wo=this,r=RoadScenarioRegistry;
  for(const [id,title,region,category,text]of WO7_DEFINITIONS){if(r.regionalByTitle.has(title))throw Error('WO7 duplicate title '+title);const e={title,text,exclusive:false,wo7:id,prompt(){return wo.choices(id).join('   ');},resolve(cmd){return wo.act(id,cmd);}};
   const index=encounters.push(e)-1,key='early:'+index,metadata={number:null,id:key,workOrderId:id,legacyName:title,name:title,classification:'REGIONAL',regions:[region],encounter:e,authority:'Owner approved WO7'};r.originalIds.set(e,key);r.regionalCatalog.push(metadata);r.regionalById.set(key,metadata);r.regionalByTitle.set(title,metadata);const entry={id:key,canonicalId:key,name:title,classification:'REGIONAL',region,regions:[region],encounter:e,references:[]};
   for(const road of ['early','east','coast']){const pool=r.pool(road);let i=pool.indexOf(e);if(i<0)i=pool.push(e)-1;R10_POOLS[road][category].push(i);entry.references.push({road,category,index:i});}r.entries.push(entry);r.byId[key]=entry;
  }
  const resolve=resolveEncounter;resolveEncounter=function(cmd){const e=currentEncounter();if(e?.wo7)return wo.act(e.wo7,cmd);return resolve(cmd);};
  const render=renderCurrentChoices;renderCurrentChoices=function(){const e=stage==='encounter'?currentEncounter():null;if(e?.wo7)return wo.render(e.wo7);return render();};
  const victory=r.wo2Award;r.wo2Award=function(key){if(key!=='wo7Victory')return victory.call(this,key);const c=combatState,q=player.flags.wo7Scene;if(!c||!q||q.key!==c.wo7Key||q.done)return false;const reward=q.combatReward;if(reward?.workers)add('"I\'ve been working this shift for eleven years." The workers remove their helmets as the security unit falls silent.','bright');return wo.award(q,reward);};
  const complete=completeRoadTurn;completeRoadTurn=function(...args){const e=stage==='encounter'?currentEncounter():null;if(e?.wo7)wo.state(e.wo7).done=true;const q=player.flags.wo7Scene;if(q?.combat){q.done=true;q.combat=false;}return complete(...args);};
  const death=handlePlayerDeath;handlePlayerDeath=function(...args){const result=death(...args);if(stage==='fallen'&&player.flags.wo7Scene)player.flags.wo7Scene.done=true;return result;};
  const candidates=r10Candidates;r10Candidates=function(pool,kind){return candidates(pool,kind).filter(i=>r10Pool(pool)[i]?.wo7!=='I12'||!player.flags.wo7GideonRescued);};
  const alive=wandererAlive;wandererAlive=function(w){if(w?.name==='Gideon Briggs'&&!player.flags.wo7GideonRescued)return false;return alive(w);};
  const unlocked=portRecruitUnlocked;portRecruitUnlocked=function(){wo.ensureGideon();return unlocked();};
  const dialogue=wandererDialogue;wandererDialogue=function(w){if(w?.name!=='Gideon Briggs')return dialogue(w);const st=ws(w.name),lines=[w.lines[0],"GIDEON BRIGGS > Those parts were for a settlement water pump. After what you did, I would rather help keep Seaport running than leave good people waiting."];const line=lines[st.lastLine===lines[0]?1:0];st.lastLine=line;st.talks++;return line;};
  const cost=portHireCost;portHireCost=function(w){return w?.name==='Gideon Briggs'&&player.flags.wo7GideonRescued?0:cost(w);};
  const deliver=CorvetteRestoration.deliver;CorvetteRestoration.deliver=function(){const q=this.state();if(q.active&&player.flags.wo7EnginePending){if(!q.engineDelivered){q.engineDelivered=true;q.engineDeliveredAt=Date.now();q.engineAcknowledged=true;add('MURPHY > That donor engine you recovered fits the Corvette. I have it safe in the workshop.','reward');}delete player.flags.wo7EnginePending;}return deliver.call(this);};
 }
};
WO7.install();
