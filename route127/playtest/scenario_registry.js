// ROUTE 127 — Centralized random road scenario registry (Work Order 1).
// Definition stages run at their original load positions to preserve R18 dependencies.
// GLOBAL scenarios are available across the network. Legacy road keys only
// address saved slots and retain already-established combat variants.
// Historical definitions stay in their original array slots for save compatibility.
const RoadScenarioRegistry = {
 entries: [], byId: Object.create(null), ready: false,
 pool(region){return region==='early'?encounters:eastEncounters;},
 usesEarlyLevelGate(encounter){return this.earlyLevelGated.has(encounter);},
 globalize(){
  if(!this.originalIds){this.originalIds=new Map();encounters.forEach((e,i)=>{if(!this.originalIds.has(e))this.originalIds.set(e,"early:"+i);});eastEncounters.forEach((e,i)=>{if(!this.originalIds.has(e))this.originalIds.set(e,"east:"+i);});}
  // Capture original definition-specific level rules before widening assignment.
  if(!this.earlyLevelGated)this.earlyLevelGated=new Set(Object.values(R10_POOLS.early).flat().map(i=>encounters[i]));
  const catalog=new Map();
  for(const [road,categories] of Object.entries(R10_POOLS))for(const [kind,indices] of Object.entries(categories))for(const index of indices){
   const e=this.pool(road)[index],key=r10CanonicalTitle(e.title);
   if(!catalog.has(key))catalog.set(key,{encounter:e,kind});
  }
  for(const road of Object.keys(R10_POOLS)){
   const slots=this.pool(road),categories=R10_POOLS[road];
   const present=new Set(Object.values(categories).flat().map(i=>r10CanonicalTitle(slots[i].title)));
   // Never duplicate a canonical scenario or replace an established stat variant.
   // Missing designs gain aliases appended after every original saved slot.
   for(const [key,{encounter,kind}] of catalog)if(!present.has(key)){
    let index=slots.indexOf(encounter);if(index<0)index=slots.push(encounter)-1;
    categories[kind].push(index);present.add(key);
   }
  }
 },
 finalize(){
  this.globalize();
  const originalIds=this.originalIds;
  const seen=new Map();
  for(const [road,categories] of Object.entries(R10_POOLS)) for(const [category,indices] of Object.entries(categories)) for(const index of indices){
   const encounter=this.pool(road)[index];
   let entry=seen.get(encounter);
   if(!entry){
    const slot=originalIds.get(encounter);
    entry={id:slot, name:encounter.displayName||encounter.title, region:'GLOBAL', encounter, references:[]};
    seen.set(encounter,entry);this.entries.push(entry);this.byId[slot]=entry;
   }
   entry.references.push({road,category,index});
  }
  this.special={id:'special:steve',name:"CRAZY STEVE'S PINK ELEPHANTS",region:'GLOBAL',category:'special',scene:r11SteveScene,combat:r11Elephant};
  this.wanderers=wanderers.map(w=>({id:'wanderer:'+w.name,name:w.name,region:'GLOBAL',category:'wanderer',npc:w}));
  this.ready=true;
 },

// BEGIN base — formerly app.js
base(){
const encounters = [
  {title:"COUNTY WORK TRUCK",exclusive:false,text:"A county maintenance truck leans into a ditch. Muddy tracks lead toward the tree line.",prompt(){const q=r18CountyTruckScene(),f=player.flags;return q.followed?['INSPECT COUNTY MAP',...(f.r18CountyQuest!=='done'?['ENTER COUNTY DEPOT']:[]),...(!f.r18CountyWorkerHelped?['GIVE WORKER A BANDAGE','HELP WORKER TO SAFETY','LEAVE WORKER']:['MOVE ON']), 'RETURN TO TRUCK'].join('   '):`CHECK GLOVEBOX   SEARCH TRUCK BED${f.r18CountyQuest==='done'?(f.r18CountyMapSeen?'   FOLLOW COUNTY MAP':''):f.r18CountyWorkerHelped?'   FOLLOW COUNTY MAP':'   FOLLOW TRACKS'}   MOVE ON`;},resolve(cmd){const q=r18CountyTruckScene(),f=player.flags;
   if(cmd==='return to truck'){q.followed=false;add('You return to the truck.','system');return true;}
   if(cmd.includes('move on')||cmd.includes('leave worker')){add('You leave the county truck behind.');return true;}
   if(cmd.includes('glove')){if(!addPack('Bandage','consumable'))return false;gainXp(7);add('A sealed first-aid pouch remains.');return true;}
   if(cmd.includes('bed')){gainBolts(6);gainXp(6);add('Six Bolts roll out of an overturned parts bin.');return true;}
   if((cmd.includes('tracks')&&f.r18CountyQuest!=='done')||cmd==='follow county map'&&(f.r18CountyMapSeen||f.r18CountyWorkerHelped)){q.followed=true;add(f.r18CountyWorkerHelped?'The county map points along a trail toward the maintenance depot.':'The tracks lead to an injured county worker holding a folded service map. A trail continues toward the depot.','bright');return true;}
   if(q.followed&&cmd==='enter county depot')return r18DepotEnter();
   if(q.followed&&cmd.includes('map')){f.r18CountyMapSeen=true;add('The county service map marks a maintenance depot and Unit 07. The route is faded.','bright');if(!f.r18CountyMapXp){f.r18CountyMapXp=true;gainXp(Math.max(5,player.level));}return true;}
   if(q.followed&&cmd.includes('worker')){if(f.r18CountyWorkerHelped){add('You have already helped the worker.','system');return true;}if(cmd.includes('bandage')){if(!hasItem('Bandage')){add('You need a Bandage to treat the worker.','system');return false;}if(!removeItem('Bandage'))return false;}f.r18CountyWorkerHelped=true;f.r18CountyMapSeen=true;r18RetainRoadReward('Wire','material');gainXp(Math.max(10,player.level*3));add('You help the worker to safety. They show you the county map and share Wire.','reward');return true;}return false;
  }},
  {title:"WASHOUT SALVAGE",exclusive:true,text:"Rain peeled back the shoulder, revealing a half-buried toolbox and broken utility cable. Drag marks lead to a scavenger struggling to free a generator.",choices:"OPEN TOOLBOX   STRIP CABLE   HELP SCAVENGER   STEAL GENERATOR PART   MOVE ON",resolve(cmd){
    if(cmd.includes("toolbox")){if(!addPack("Scrap Metal","material"))return false;gainBolts(5);gainXp(7);add("The toolbox contains usable metal and a few Bolts.");return true;}
    if(cmd.includes("cable")){if(!addPack("Wire","material"))return false;if(Math.random()<.25){roadHurt(3);add("A sharp cable strand cuts your hand.","danger");}gainXp(7);return true;}
    if(cmd.includes("help")){if(!addPack("Wire","material"))return false;gainXp(Math.max(10,player.level*3));add("Together you free the generator. The scavenger thanks you with a coil of Wire.");return true;}
    if(cmd.includes("steal")){if(!r18TheftAllowed())return false;if(Math.random()<.5){r18TheftCaught("Washout scavenger");roadHurt(5);gainXp(3);add("The scavenger catches you reaching for a part and drives you away.","danger");return true;}if(!r18StolenReward("Scrap Metal","material"))return false;gainXp(5);add("You take a loose metal part while the scavenger struggles with the generator.");return true;}
    if(cmd.includes("move")||cmd.includes("leave")){add("You leave the washout behind.");return true;}return false;
  }},

  { title:"THE GAS STATION", exclusive:true, text:"The old station is nearly bare. A vending machine leans beside a half-open service bay; a steel drawer hangs behind the counter.", choices:"SEARCH DRAWER   SMASH VENDING MACHINE   PRY VENDING MACHINE   INSPECT VENDING MACHINE   CHECK SERVICE BAY   MOVE ON",
    resolve(cmd){
      if(cmd.includes("drawer")){gainBolts(7);gainXp(7);add("A few bolts remain in the steel drawer.");return true;}
      if(cmd.includes("inspect")&&cmd.includes("vending")){add("The payment slot is jammed, but a packet is caught behind the glass. The door's lower hinge has rusted loose.");gainXp(4);return true;}
      if(cmd.includes("smash")&&cmd.includes("vending")){if(!addPack("Energy Bars","consumable")){add("Your pack is full; the sealed snack remains in the machine.","system");return false;} if(Math.random()<.35){roadHurt(3);add("Flying glass nicks your arm.","danger");}gainXp(8);add("The glass breaks. You recover a sealed snack.");return true;}
      if(cmd.includes("pry")&&cmd.includes("vending")){if(!addPack("Energy Bars","consumable")){add("Your pack is full; the sealed snack remains in the machine.","system");return false;}gainXp(6);add("The rusted hinge gives way. You recover a sealed snack.");return true;}
      if(cmd.includes("service")||cmd.includes("bay")){add("A service-bay radio repeats a pre-collapse emergency warning: 'Remain indoors. Await further instructions.' The message begins again.");if(!player.flags.gasStationWarningHeard){player.flags.gasStationWarningHeard=true;gainXp(8);add("You remember the warning for later.","reward");}return true;}
      if(cmd.includes("move")||cmd.includes("leave")){add("You leave the station behind.");return true;}return false;
    } },
  { title:"ABANDONED SEDAN", exclusive:true, text:"A sedan sits nose-first in the ditch. The driver's door hangs open, the trunk is shut tight, and an oil stain runs beneath the rear bumper.", choices:"SEARCH CABIN   FORCE TRUNK   CHECK UNDER CAR   MOVE ON",
    resolve(cmd){
      if(cmd.includes("cabin")){const item=Math.random()<.5?"Cloth":"Energy Bars",type=item==="Cloth"?"material":"consumable";if(!addPack(item,type))return false;gainXp(8);add("You search the cabin and find "+item+" beneath the seat.");return true;}
      if(cmd.includes("trunk")||cmd.includes("force")){const item=Math.random()<.5?"Bandage":"Scrap Metal",type=item==="Bandage"?"consumable":"material";if(!addPack(item,type))return false;gainXp(10);add("The latch gives. Inside the trunk: "+item+".");return true;}
      if(cmd.includes("under")){if(!addPack("Fuel","material"))return false;gainXp(8);add("The stain leads to a fuel line deliberately cut and plugged. Nearby, a sealed maintenance bottle holds a small cache of fuel.");return true;}
      if(cmd.includes("move")||cmd.includes("leave")){add("You leave the sedan behind.");return true;}return false;
    } },
  {exclusive:true,title:"ROADBLOCK",text:"Two robbers block the highway. One points a spear at your pack. 'Leave something useful and walk away.'",choices:"CLIMB AROUND   TAKE THE DITCH   CIRCLE THE HILL   SURRENDER ITEM   INTIMIDATE   RUN   FIGHT",combat:{action:"FIGHT",name:"ROADBLOCK ROBBERS",level:3,hp:42,min:4,max:8,xp:30,bolts:8,enemies:[{name:"SPEAR ROBBER",hp:21,bolts:4},{name:"PIPE ROBBER",hp:21,bolts:4}],end:"The robbers abandon their roadblock."},resolve(cmd){
    if(cmd.includes("climb")||cmd.includes("ditch")||cmd.includes("hill")){gainXp(5);add("You use the terrain to avoid the roadblock and return to the highway.");return true;}
    if(cmd.includes("surrender")){const item=player.pack.find(i=>i.qty>0&&!['key','quest'].includes(i.type)&&i.name!==player.weapon&&i.name!==player.armor&&i.name!==player.accessory&&!protectedUniqueEquipment(i.name)&&!i.protected&&!i.unique&&GEAR[i.name]?.rarity!=='legendary');if(!item){add("You have no ordinary backpack item they can take. Choose another approach.","system");return false;}item.qty--;if(item.qty<=0)player.pack=player.pack.filter(i=>i!==item);updateHud();add("You surrender one "+item.name+". The robbers let you pass.");return true;}
    if(cmd.includes("intimidate")){if(Math.random()<.5){gainXp(8);add("You stand your ground. The robbers decide to find an easier target.");}else{roadHurt(4);add("The bluff fails; a robber clips you as you escape.","danger");}return true;}
    if(cmd.includes("run")){if(Math.random()<.4){roadHurt(4);add("A thrown stone catches you as you run.","danger");}else add("You break away before either robber can catch you.");return true;}return false;
  }},
  { title:"MAINTENANCE BOX", exclusive:true, text:"A county maintenance box survives beneath a bent guardrail. Its lock has rusted away, and an old utility pole has spilled cable into the weeds. Faded lettering reads COUNTY 127.", choices:"OPEN BOX   STRIP CABLE   SEARCH SHOULDER   SEARCH DAMAGED CONTROL   MOVE ON",
    resolve(cmd){
      if(cmd.includes("damaged control")){if(!addPack("Electronics","material",1,true)){add("Backpack full. Make space before salvaging the control.","system");return false;}gainXp(Math.max(4,Math.ceil(player.level*1.5)));add("You remove an intact electronic component from the damaged county control box.",'reward');return true;}
      if(cmd.includes("box")||cmd.includes("open")){if(!addPack("Wire","material"))return false;gainXp(Math.max(4,Math.ceil(player.level*1.5)));add("Inside the box is a usable coil of Wire and a county inspection tag.");return true;}
      if(cmd.includes("cable")||cmd.includes("strip")){if(!addPack("Wire","material"))return false;if(Math.random()<.25){roadHurt(3);add("A sharp strand catches your glove as you pull the cable loose.","danger");}gainXp(Math.max(4,Math.ceil(player.level*1.5)));add("You strip a usable length of Wire from the fallen cable.");return true;}
      if(cmd.includes("shoulder")){if(!addPack("Scrap Metal","material"))return false;gainXp(Math.max(4,Math.ceil(player.level*1.5)));add("You recover a small piece of Scrap Metal from the shoulder.");return true;}
      if(cmd.includes("move")||cmd.includes("leave")){add("You leave the maintenance box behind.");return true;}return false;
    } },
  {exclusive:true,title:"THE STRAY",text:"A thin scavenger steps from behind a burned pickup, knife held low. His eyes keep dropping to your pack.",
    description(){return player.flags.r18StrayFed?"The scavenger you fed steps into view again. His knife is put away, and he holds out a small bundle.":this.text;},
    prompt(){return player.flags.r18StrayFed?"ACCEPT SUPPLIES   ASK FOR INFORMATION   SAY GOODBYE":"FIGHT   OFFER RATION   WARN HIM OFF   SPARE HIM   BACK AWAY";},
    resolve(cmd){
      if(player.flags.r18StrayFed){
        if(cmd.includes("supplies")){if(!addPack("Bandage","consumable"))return false;player.flags.r18StrayReunionDone=true;gainXp(Math.max(5,player.level*2));add("He gives you a Bandage. 'Someone helped me when I needed it. Figured I should pass that along.'");return true;}
        if(cmd.includes("information")){player.flags.r18StrayReunionDone=true;gainXp(Math.max(5,player.level*2));add("He points out a safer shoulder and warns you about trouble near the culvert. You part on friendly terms.");return true;}
        if(cmd.includes("goodbye")){player.flags.r18StrayReunionDone=true;add("You thank him and wish him well on the road.");return true;}return false;
      }
      if(cmd.includes("ration")||cmd.includes("offer")){if(!hasItem("Energy Bars")){add("You don't have an energy bar to spare.","system");return false;}removeItem("Energy Bars");player.flags.r18StrayFed=true;gainXp(Math.max(10,player.level*3));add("He eats slowly and lowers the knife. 'Watch the culvert after dark.'");return true;}
      if(cmd.includes("warn")){gainXp(8);add("You warn him off. After a long moment, he retreats toward the weeds.");return true;}
      if(cmd.includes("spare")){gainXp(8);add("You tell him to put the knife away and let him leave. He takes the chance.");return true;}
      if(cmd.includes("back")||cmd.includes("away")){add("You give him space and continue on your way.");return true;}return false;
    } },
  {title:"THE DARK CELLAR",exclusive:true,text:"A collapsed house has one intact cellar door. A frightened man in a respirator shouts from below: 'SHUT THAT DOOR! The air is poison!'",choices:"REASSURE HIM   OFFER SUPPLIES   QUESTION HIM   THREATEN HIM   FIGHT   WITHDRAW",combat:{action:"FIGHT",name:"FRIGHTENED CELLAR RESIDENT",level:2,hp:22,min:2,max:5,xp:18,bolts:0,r18Cellar:true,end:"The frightened man drops his weapon and retreats deeper into the cellar."},resolve(cmd){
    if(cmd.includes("reassure")){player.flags.r18CellarResolved=true;gainXp(Math.max(8,player.level*2));add("You close the door and speak through the gap. After a long pause he thanks you for listening; he still fears the surface.");return true;}
    if(cmd.includes("supplies")){if(!hasItem("Energy Bars")){add("You need an Energy Bar to offer him.","system");return false;}removeItem("Energy Bars");player.flags.r18CellarResolved=true;gainXp(Math.max(10,player.level*2));add("He takes the food through the gap. No monster, just a man afraid of a world he no longer understands.");return true;}
    if(cmd.includes("question")){add("He describes an old emergency broadcast and says he has stayed below ever since. You leave him with the cellar door closed.");return true;}
    if(cmd.includes("threaten")){player.flags.r18CellarResolved=true;gainXp(4);add("He bolts the cellar door and falls silent. You leave him alone.");return true;}
    if(cmd.includes("withdraw")){add("You leave the cellar door closed.");return true;}return false;
  }},
  {title:"OLD BILLBOARD",exclusive:true,text:"A weathered roadside billboard stands above the shoulder. Its paint has faded, and something has been painted on the back.",choices:"STUDY FRONT   STUDY BACK   SEARCH BASE   MOVE ON",resolve(cmd){
    if(cmd.includes("front")){const scenes=["A smiling burger advert promises a meal long past its expiration date.","A polished car and an old toolbox advertise a mechanic's service.","A motel sign points toward a road that has almost disappeared.","Faded safety instructions warn motorists to keep an emergency kit.","A soda advertisement offers refreshment to travelers who never arrived.","A faded highway notice asks drivers to watch for workers."];const seen=player.flags.r18BillboardFrontSeen||(player.flags.r18BillboardFrontSeen=[]);const fresh=scenes.map((_,i)=>i).filter(i=>!seen.includes(i));const n=fresh.length?fresh[Math.floor(Math.random()*fresh.length)]:Math.floor(Math.random()*scenes.length);add(scenes[n]);if(!seen.includes(n)){seen.push(n);gainXp(3);}return true;}
    if(cmd.includes("back")){add("A lantern inside a broken circle is painted on the BACK, like the symbol on the old computer at home.");if(!player.flags.billboard){player.flags.billboard=true;gainXp(12);}return true;}
    if(cmd.includes("base")){gainBolts(5);gainXp(4);add("A few Bolts lie beneath loose stones at the billboard's base.");return true;}
    if(cmd.includes("move")||cmd.includes("leave")){add("You leave the billboard behind.");return true;}return false;
  }},
  { title:"THE TRAVELER", text:"Vale sits against a mile marker, one sleeve of her patched green coat dark with blood. A silver ring catches the light as she reaches for her pack. She watches you approach without asking for help.", choices:"USE BANDAGE   GIVE RATION   QUESTION HER   TAKE PACK   WALK AWAY",
    resolve(cmd){ if(cmd.includes("bandage")){if(!hasItem("Bandage")){add("You don't have a bandage.","system");return false;} removeItem("Bandage");player.flags.helpedTraveler=true;player.flags.travelerInSolace=true;gainXp(22);add("She tells you the Solace guards trade fair if you don't lie to them. 'Tell Mara that Vale sent you.'");} else if(cmd.includes("ration")||cmd.includes("give")){if(!hasItem("Energy Bars")){add("You don't have an energy bar to spare.","system");return false;} removeItem("Energy Bars");gainXp(15);add("She eats slowly and points east. 'You're close.'");} else if(cmd.includes("question")){gainXp(8);add("She gives you one useful word: Solace. Then closes her eyes.");} else if(cmd.includes("take")||cmd.includes("pack")){gainBolts(14);addPack("Wire");gainXp(8);add("She doesn't stop you. Somehow that makes it worse.","danger");} else if(cmd.includes("walk")||cmd.includes("away")){add("You keep walking. The mile marker disappears behind you.");} else return false; return true;} },
  {title:"RIDGELINE",exclusive:true,text:"The road crests a low ridge. Wind moves through the grass, and the highway stretches beyond a wrecked utility truck.",choices:"WATCH THE HORIZON   SEARCH THE TRUCK   LOOK AROUND   MOVE ON",resolve(cmd){
   if(cmd.includes("horizon")){const g=typeof lanternState==='function'?lanternState():null,e=typeof lanternEdge==='function'?lanternEdge():null;const near=!!g&&!!e&&e.id==='house--solace'&&g.direction>0&&e.distanceTurns-g.stepIndex<=2;if(near&&!player.flags.r18SolaceOverlookSeen){player.flags.r18SolaceOverlookSeen=true;add("Beyond the ridge, smoke rises above the walls of Solace. An old sign reads: SOLACE — 1 MILE.","bright");gainXp(Math.max(10,player.level*3));}else{const scenes=["A utility truck rests below the ridge.","A discarded backpack lies beside a distant fence.","Birds circle above the road.","Smoke curls from a small campsite.","A radio tower stands on the horizon.","Distant survivors tend a fire behind a low wall."];add(scenes[Math.floor(Math.random()*scenes.length)]);gainXp(Math.max(4,player.level));}return true;}
   if(cmd.includes("truck")){if(!addPack("Scrap Metal","material"))return false;gainXp(Math.max(5,player.level));add("A compartment on the truck holds usable Scrap Metal.");return true;}
   if(cmd.includes("around")){add("From here you can watch the road without exposing yourself on the crest.");gainXp(Math.max(4,player.level));return true;}
   if(cmd.includes("move")||cmd.includes("leave")){add("You continue down from the ridge.");return true;}return false;
  }},
  { exclusive:true, title:"THE BIG MAN", text:"A broad-shouldered scavenger steps into the road. He is bigger than you by a lot, wearing a tire-tread vest and carrying a length of chain. He looks at your pack, then at you. 'Toll road.'", choices:"FIGHT HIM   PAY 6 BOLTS   BACK DOWN",
    resolve(cmd){ if(cmd.includes("fight")){ const dealt=rollDamage(); add(`You catch him once with the pipe for ${dealt} damage. It only makes him angry.`,"bright"); enemyHit(34,46); const stolen=Math.min(player.bolts,Math.floor(Math.random()*6)+5); player.bolts-=stolen; updateHud(); add(`You wake in the ditch. He took ${stolen} Bolts, but left you breathing.`,"danger"); gainXp(18);} else if(cmd.includes("pay")){ if(player.bolts<6){add("You don't have 6 Bolts.","system");return false;} player.bolts-=6;updateHud();gainXp(6);add("He weighs the bolts in his palm and waves you through.");} else if(cmd.includes("back")){add("You swallow your pride and take the long way around. Sometimes surviving is the win.");} else return false; return true;} },
  {title:"BROKEN MOTEL",exclusive:false,text:"A former county administration building stands beside the road. A janitor named Harlan guards a chain across its offices.",choices:"TALK TO HARLAN   INSPECT OFFICE 204   ASK FOR SIGNED CLEARANCE   FORCE OFFICE 204   FIGHT HARLAN   BACK AWAY",resolve(cmd){
   const f=player.flags;if(cmd.includes('back')||cmd.includes('away')){add('You leave the building behind.');return true;}
   if(cmd.includes('talk')){add(f.r18HarlanDefeated?'Harlan is no longer guarding the offices.':'HARLAN > No one enters without a signed clearance. The forms are inside.','system');return true;}
   if(cmd.includes('inspect')){add('Office 204 is chained from the outside. Someone inside calls for help.','bright');return true;}
   if(cmd.includes('clearance')){add(f.r18HarlanDefeated?'Harlan is no longer here to sign a clearance.':'HARLAN > I can sign the form after you bring it to me. The forms are inside office 204.','system');return true;}
   if(cmd.includes('force')){if(f.r18CalebRescued){add('Caleb has already been freed.','system');return true;}f.r18CalebRescued=true;gainXp(Math.max(12,player.level*3));add('You break the chain and free Caleb “Dockhand” Reed. He thanks you and heads for the highway.','reward');return true;}
   if(cmd.includes('fight')){if(f.r18HarlanDefeated){add('Harlan has already been defeated.','system');return false;}const level=Math.max(1,Math.min(50,Number(player.level)||1));startCombat({name:'JANITOR HARLAN',level,hp:Math.max(20,Math.floor(baseHpForLevel(level)*.25)),min:2,max:6,xp:Math.max(18,level*5),bolts:4,r18Harlan:true,end:'Harlan drops his keys and retreats from the offices.'},'encounter');return true;}return false;
  }},
  { exclusive:true, title:"HIGHWAY ROBBERS", text:"Two figures rise from behind the guardrail. One has a tire iron. The other has a homemade spear. 'Pack on the ground.'", choices:"FIGHT   THROW 5 BOLTS   RUN",
    resolve(cmd){ if(cmd.includes("fight")){const dealt=rollDamage();add(`Your pipe lands for ${dealt} damage.`,"bright");enemyHit(18,28);gainBolts(9);gainXp(24);add("They break first and disappear into the weeds.");} else if(cmd.includes("throw")){if(player.bolts<5){add("You need 5 Bolts to distract both robbers.","system");return false;}const paid=5;player.bolts-=paid;updateHud();add(`You scatter ${paid} Bolts across the pavement and move while they scramble for them.`);} else if(cmd.includes("run")){if(Math.random()<0.6){add("You break line of sight and escape both robbers without injury.");}else{roadHurt(15);add("The spear catches you hard before you escape.","danger");}} else return false;return true;} },
  {title:"DRAINAGE CULVERT",exclusive:true,text:"Rainwater trickles through a concrete culvert. A reflective object glints inside; moss makes the entrance slick.",choices:"ENTER CULVERT   REACH FROM EDGE   SEARCH BANK   MOVE ON",resolve(cmd){
   if(cmd.includes("enter")||cmd.includes("inside")){if(!addPack("Scrap Metal","material"))return false;if(Math.random()<.3){roadHurt(5);add("Your boot slips on the moss before you recover the cache.","danger");}else add("You cross the damp concrete without slipping.");const n=Math.random();if(n<.33)add("A pair of large roaches scatters into a crack when your shadow crosses the tunnel.");else if(n<.66)add("A sheltering dog watches from a dry ledge. You leave it room to escape.");gainXp(Math.max(7,player.level*2));return true;}
   if(cmd.includes("reach")){if(!addPack("Wire","material"))return false;gainXp(Math.max(5,player.level));add("You hook a coil of Wire from the edge without entering.");return true;}
   if(cmd.includes("bank")){if(!addPack("Cloth","material"))return false;gainXp(Math.max(5,player.level));add("A strip of Cloth lies in the brush. Footprints lead away from the culvert—the kind of place a cautious traveler might avoid after dark.");return true;}
   if(cmd.includes("move")||cmd.includes("leave")){add("You leave the culvert undisturbed.");return true;}return false;
  }},
  {title:"ROACH NEST",exclusive:true,text:"A rusted delivery van rocks on its dead suspension as roaches pour from underneath.",description(){const scenes=["Ordinary large roaches crowd the delivery van, drawn to a torn food carton.","Several unusually large contaminated roaches swarm around leaking containers beneath the van.","An aggressive roach swarm surges from the delivery van across the road."];return scenes[r18RoachVariant()];},choices:"FIGHT SWARM   LURE THEM AWAY   SEARCH VAN   BACK AWAY",combat:{action:"FIGHT SWARM",name:"ROACH SWARM",level:2,hp:20,min:2,max:5,xp:25,bolts:0,r18RoachNest:true,end:"The surviving roaches scatter beneath the van."},resolve(cmd){
   if(cmd.includes("lure")){if(!hasItem("Energy Bars")){add("You need food to lure the swarm away.","system");return false;}removeItem("Energy Bars");gainXp(Math.max(8,player.level*2));add("You toss the ration away from the road. The roaches follow it into the weeds.");return true;}
   if(cmd.includes("search")){if(!addPack("Scrap Metal","material"))return false;if(Math.random()<.3){roadHurt(4);add("A roach bites as you recover a piece of metal from the van.","danger");}else add("You reach the van's cargo and recover Scrap Metal without disturbing the swarm.");gainXp(Math.max(7,player.level*2));return true;}
   if(cmd.includes("back")||cmd.includes("away")){add("You leave the van to the roaches.");return true;}return false;
  }},
  {title:"TUNNEL RATS",exclusive:true,text:"Rats spill from a storm drain and fan across the road.",prompt(){return player.flags.r18TunnelBoarPending?'FIGHT THE BOAR   BACK AWAY':'FIGHT PACK   CLIMB WRECK   THROW FOOD   BACK AWAY';},resolve(cmd){
   if(cmd.includes('back')||cmd.includes('away')){add('You leave the drain behind.');return true;}
   if(cmd.includes('climb')||cmd.includes('wreck')){if(Math.random()<.25){roadHurt(4);add('A rat catches your boot before you reach the wreck.','danger');}else add('You climb the wreck and wait until the rats move on.');gainXp(Math.max(6,player.level));return true;}
   if(cmd.includes('food')||cmd.includes('throw')){if(!hasItem('Energy Bars')){add('You need food to distract the rats.','system');return false;}removeItem('Energy Bars');gainXp(Math.max(6,player.level*2));add('The rats follow the food into the weeds.');return true;}return false;
  }},
  {title:"FERAL DOG",exclusive:true,text:"A dog watches from beside the highway.",description(){const scenes=["A mother dog guards a shallow den. Small pups move behind her.","A hungry lone dog watches your pack from a cautious distance.","An aggressive lone dog blocks the narrow shoulder, teeth bared.","Three feral dogs fan out across the road, watching for an opening."];return scenes[r18DogVariant()];},prompt(){const v=r18DogVariant();return v===0?"GIVE THE DEN SPACE   OFFER FOOD   FIGHT DOGS":v===1?"OFFER FOOD   BACK AWAY   FIGHT DOGS":v===2?"STAND YOUR GROUND   BACK AWAY   FIGHT DOGS":"THROW FOOD   BACK AWAY   FIGHT DOGS";},combat:{action:"FIGHT DOGS",name:"FERAL DOG",level:3,hp:24,min:4,max:8,xp:24,bolts:0,end:"The surviving dogs retreat into the brush."},resolve(cmd){
   if(cmd.includes("food")){if(!hasItem("Energy Bars")){add("You have no food to offer.","system");return false;}removeItem("Energy Bars");gainXp(Math.max(6,player.level*2));add("You leave food and give the dog or dogs enough space to approach it safely.");return true;}
   if(cmd.includes("den")||cmd.includes("space")||cmd.includes("back")||cmd.includes("away")){add("You take a wide path and leave the animals alone.");return true;}
   if(cmd.includes("ground")){if(Math.random()<.6){gainXp(Math.max(5,player.level));add("You hold your ground until the dog backs away.");}else{roadHurt(4);add("The dog lunges and clips your leg as you retreat.","danger");}return true;}return false;
  }},
  {exclusive:true,title:"LONE SCAVENGER",text:"A scavenger stands near a wreck, watching the road.",description(){const scenes=["A suspicious scavenger strips copper from a wreck, one hand close to a knife.","A friendly scrapper struggles with a loose generator component and waves when you approach.","A weary trader offers to show you a handful of small parts, keeping one hand close to your pack."];return scenes[r18ScavengerVariant()];},prompt(){const v=r18ScavengerVariant();return v===0?"FIGHT   TRADE FOR WIRE   INTIMIDATE   BACK AWAY":v===1?"HELP WITH COMPONENT   TALK TO SCRAPPER   FIGHT   BACK AWAY":"WATCH HIS HANDS   TRADE WITH STRANGER   FIGHT   BACK AWAY";},combat:{action:"FIGHT",name:"LONE SCAVENGER",level:3,hp:26,min:4,max:8,xp:25,bolts:8,end:"The scavenger drops the knife and flees."},resolve(cmd){const v=r18ScavengerVariant();
    if(cmd.includes("back")||cmd.includes("away")){add("You give the scavenger room and continue.");return true;}
    if(v===0&&cmd.includes("trade")){if(player.bolts<4){add("The scavenger wants 4 Bolts for Wire.","system");return false;}if(!addPack("Wire","material",1,true)){add("Free a backpack slot before trading. No Bolts spent.","system");return false;}player.bolts-=4;updateHud();add("You trade 4 Bolts for Wire.");return true;}
    if(v===0&&cmd.includes("intimidate")){if(Math.random()<.6){gainXp(Math.max(6,player.level*2));add("The scavenger backs away from the wreck.");}else{roadHurt(4);add("He lunges before retreating and catches your arm.","danger");}return true;}
    if(v===1&&cmd.includes("help")){if(!hasItem("Scrap Metal")){add("One Scrap Metal would help secure the component.","system");return false;}if(!addPack("Wire","material"))return false;removeItem("Scrap Metal");gainXp(Math.max(10,player.level*3));add("Together you secure the generator. The scrapper thanks you with a coil of Wire.","reward");return true;}
    if(v===1&&cmd.includes("talk")){gainXp(Math.max(4,player.level));add("The scrapper shares advice about keeping old machines running and wishes you safe travels.");return true;}
    if(v===2&&cmd.includes("watch")){gainXp(Math.max(6,player.level*2));add("You spot his hand reaching toward your pack. Caught, he mutters an apology and slips away.");return true;}
    if(v===2&&cmd.includes("trade")){const item=player.pack.find(i=>i.qty>0&&!['key','quest'].includes(i.type)&&i.name!==player.weapon&&i.name!==player.armor&&i.name!==player.accessory&&!protectedUniqueEquipment(i.name)&&!i.protected&&!i.unique&&GEAR[i.name]?.rarity!=='legendary');if(item&&Math.random()<.5){item.qty--;if(item.qty<=0)player.pack=player.pack.filter(i=>i!==item);updateHud();add("While showing you his parts, he slips away with one "+item.name+".","danger");}else add("You keep a close hand on your pack; the stranger moves along without taking anything.");return true;}return false;
  }},
  { exclusive:true, title:"GANG LOOKOUT", text:"A teenager in a patched road vest watches from an overpass with a hunting knife and a whistle. You spot him a second before he can signal whoever is nearby.", choices:"RUSH HIM   SNEAK AROUND   INTIMIDATE",
    resolve(cmd){ if(cmd.includes("rush")){roadHurt(10);gainXp(23);gainBolts(5);add("You reach him before the whistle does. He bolts, dropping a small hardware pouch.");} else if(cmd.includes("sneak")){add("You vanish through the drainage weeds before he gets a clean look at you.");} else if(cmd.includes("intimidate")){gainXp(16);add("You point the pipe at the whistle. He thinks better of testing you.");} else return false; return true;} },
  {exclusive:true,title:"THE CRAWLER",text:"A territorial survivor crawls from beneath an overturned station wagon, keeping one hand on a knife. 'This highway and every wreck on it belongs to me.'",choices:"TALK TO HIM   TRADE FOR WIRE   ARGUE ABOUT THE ROAD   FIGHT   RETREAT",resolve(cmd){
   if(cmd.includes("talk")){const lines=["He says he has slept beneath the wagon for years and knows every crack in the shoulder.","He complains about scavengers who leave sharp scrap where travelers step.","He taps the wagon and declares it the finest shelter on the highway."];add(lines[Math.floor(Math.random()*lines.length)]);gainXp(Math.max(4,player.level));return true;}
   if(cmd.includes("trade")){if(player.bolts<4){add("He wants 4 Bolts for a coil of Wire.","system");return false;}if(!addPack("Wire","material"))return false;player.bolts-=4;updateHud();add("He accepts 4 Bolts and hands you the Wire.");return true;}
   if(cmd.includes("argue")){if(Math.random()<.4){roadHurt(4);add("He jabs at you with a makeshift pole before you back off.","danger");}else{gainXp(Math.max(5,player.level));add("He insists the wreck is his, then lets you take the shoulder.");}return true;}
   if(cmd.includes("retreat")){add("You give the man and his wreck plenty of space.");return true;}return false;
  }},
  {title:"SECURITY DRONE",exclusive:false,text:"A rugged pre-collapse security unit waits beside a ruined toll booth. Its optic flickers as it repeats: 'PRESENT AUTHORIZATION.'",choices:"INSPECT BOOTH   PRESENT BADGE   ATTEMPT SHUTDOWN   SNEAK PAST   FIGHT DRONE   BACK AWAY",combat:{action:"FIGHT DRONE",name:"SECURITY DRONE",level:5,hp:32,min:5,max:10,xp:30,bolts:0,r18Drone:true,end:"The security unit powers down for good."},resolve(cmd){
   if(cmd.includes("inspect")||cmd.includes("booth")){if(!player.flags.r18DroneBadge){player.flags.r18DroneBadge=true;gainXp(5);add("A county authorization badge lies inside a cracked booth drawer.","reward");}else add("The badge reader and a service panel sit behind the dusty glass.");return true;}
   if(cmd.includes("badge")||cmd.includes("authorization")){if(!player.flags.r18DroneBadge){add("You need an authorization badge. Inspect the booth or choose another approach.","system");return false;}player.flags.r18DroneDisabled=true;gainXp(Math.max(10,player.level*2));add("The reader accepts the badge. The drone lowers its optic and enters standby.","reward");return true;}
   if(cmd.includes("shutdown")){if(Math.random()<.6){player.flags.r18DroneDisabled=true;gainXp(Math.max(10,player.level*2));add("You isolate the service circuit. The drone powers down.","reward");}else{roadHurt(5);add("The panel sparks and the drone fires a warning shot as you fall back.","danger");}return true;}
   if(cmd.includes("sneak")){if(Math.random()<.7){gainXp(Math.max(6,player.level));add("You slip past the damaged optic without disturbing the unit.");}else{roadHurt(4);add("The optic catches your movement. A shot clips you as you reach cover.","danger");}return true;}
   if(cmd.includes("back")||cmd.includes("away")){add("You withdraw from the toll booth.");return true;}return false;
  }},
  {exclusive:true,title:"THE WRECKERS",text:"Two raiders strip an ambulance on the shoulder. One rests a pry bar across his shoulder. 'Plenty here. None of it yours.'",choices:"FIGHT WRECKERS   BARGAIN FOR MEDICINE   STEAL SUPPLIES   BACK AWAY",combat:{action:"FIGHT WRECKERS",name:"THE WRECKERS",level:5,hp:52,min:5,max:9,xp:40,bolts:8,r18WreckersMedical:true,enemies:[{name:"WRECKER WITH PIPE",hp:26,bolts:4},{name:"WRECKER WITH CHAIN",hp:26,bolts:4}],end:"The raiders abandon the ambulance."},resolve(cmd){
   if(cmd.includes("bargain")){if(player.bolts<8){add("The raiders want 8 Bolts for medicine.","system");return false;}const med=r18WreckersMedical();if(!addPack(med,"consumable",1,true)){add("Free a backpack slot before trading. No Bolts spent.","system");return false;}player.bolts-=8;updateHud();add("You pay 8 Bolts for "+med+".","reward");return true;}
   if(cmd.includes("steal")){if(!r18TheftAllowed())return false;if(Math.random()<.5){r18TheftCaught("Ambulance raiders");add("A raider catches your hand in the medical pouch. Both close in!","danger");startCombat({...this.combat},"encounter");return true;}const med=r18WreckersMedical();if(!r18StolenReward(med,"consumable"))return false;gainXp(Math.max(8,player.level*2));add("You slip a sealed "+med+" from the ambulance and leave unseen.","reward");return true;}
   if(cmd.includes("back")||cmd.includes("away")){add("You leave the ambulance to the raiders.");return true;}return false;
  }},
  { exclusive:true, title:"SOMETHING IN THE DRAIN", text:"A metal scraping sound follows you beneath a cracked section of highway. A maintenance grate shudders. Something on the other side is breathing.", choices:"OPEN GRATE   POKE WITH PIPE   WALK AROUND",
    resolve(cmd){ if(cmd.includes("open")){roadHurt(18);gainXp(28);gainBolts(9);add("The thing hits the grate harder than expected. You win the argument and find a dead scavenger's bolt pouch inside.");} else if(cmd.includes("poke")||cmd.includes("pipe")){roadHurt(8);gainXp(18);add("Bad idea. Useful information, but still a bad idea.","danger");} else if(cmd.includes("walk")||cmd.includes("around")){gainXp(4);add("You decide some mysteries deserve privacy.");} else return false; return true;} },
  {exclusive:true,title:"THE HANGING SHOES",text:"Shoes sway from a cable above the road. Some are old work boots; others were tied there with care.",choices:"READ THE NOTES   INSPECT THE BOOTS   SEARCH THE ROADSIDE   BACK AWAY",resolve(cmd){
   if(cmd.includes("notes")){add("A note tied to a child's shoes reads: 'We made it this far together.' Other names and dates mark the travelers people wanted remembered.");if(!player.flags.r18ShoesMemorialSeen){player.flags.r18ShoesMemorialSeen=true;gainXp(5);}return true;}
   if(cmd.includes("boots")){add("The work boots hang over an old checkpoint. Someone scratched a warning on the heel: 'Keep moving after dark.'");if(!player.flags.r18ShoesWarningSeen){player.flags.r18ShoesWarningSeen=true;gainXp(5);}return true;}
   if(cmd.includes("roadside")){if(!addPack("Wire","material"))return false;gainXp(4);add("A loose length of wire lies in the weeds beneath the memorial. You leave the shoes where they hang.");return true;}
   if(cmd.includes("back")||cmd.includes("away")){add("You leave the memorial undisturbed.");return true;}return false;
  }},
  {exclusive:true, title:"THE LAST MAIL", text:"A postal truck is wedged against a concrete barrier. Hundreds of envelopes carpet the floor.", choices:"SEARCH FOR A LETTER   SORT PARCELS   BACK AWAY", resolve(cmd){
    if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;}
    if(cmd.includes("letter")){const f=player.flags;if(f.r18MilesLetter==='delivered'){add("The letter has already reached Miles.","system");return true;}if(f.r18MilesLetter==='found'||player.pack.some(i=>i.name==='Lost Letter for Miles'&&i.type==='quest'&&i.qty>0)){f.r18MilesLetter='found';add("You already have the letter for Miles.","system");return true;}if(Math.random()<.3&&addPack('Lost Letter for Miles','quest',1,true)){f.r18MilesLetter='found';add("Among the envelopes is a sealed letter addressed to Miles. You keep it safe for him.","reward");}else add("You find no letter addressed to Miles this time.");return true;}
    if(!cmd.includes("parcels")&&!cmd.includes("sort"))return false;gainBolts(5);r18RetainRoadReward("Cloth","material");gainXp(9);add("A parcel contains a sealed roll of cloth and a few useful fasteners.");return true;
  }},
  {exclusive:true,title:"THE FALSE SHOULDER",text:"The asphalt shoulder looks solid until a pebble drops straight through it. Nearby, a few warning stones mark an unstable patch.",choices:"PROBE AND MARK THE GROUND   CROSS THE SHOULDER   REINFORCE WARNING STONES   BACK AWAY",resolve(cmd){
   if(cmd.includes("probe")||cmd.includes("mark")){add("You test the pavement and mark the hidden sinkhole with stones for the next traveler.");if(!player.flags.r18SinkholeMarked){player.flags.r18SinkholeMarked=true;gainXp(Math.max(8,player.level*2));}return true;}
   if(cmd.includes("cross")){if(Math.random()<.35){roadHurt(6);add("The crust collapses under your boot. You scramble back, bruised but clear.","danger");}else{gainXp(Math.max(5,player.level));add("You cross the narrow firm strip without falling.");}return true;}
   if(cmd.includes("reinforce")||cmd.includes("stones")){add("You add stones to the warning so travelers can spot the weak shoulder sooner.");if(!player.flags.r18SinkholeReinforced){player.flags.r18SinkholeReinforced=true;gainXp(Math.max(5,player.level));}return true;}
   if(cmd.includes("back")||cmd.includes("away")){add("You take a wide path around the unstable pavement.");return true;}return false;
  }},
  {title:"CEMETERY OF TIRES",exclusive:false,text:"Stacks of tires form a maze beneath a collapsed overpass. A crate glints inside.",prompt(){const q=r18MazeScene();if(!q.started)return 'ENTER TIRE MAZE   LEAVE MAZE';if(q.finished)return 'LEAVE MAZE';return ['UP','DOWN','LEFT','RIGHT'].map(d=>`MOVE ${d} STEP ${q.step}`).concat(['LEAVE MAZE']).join('   ');},resolve(cmd){const q=r18MazeScene(),f=player.flags;
   if(cmd.includes('leave')){add('You leave the tire maze.','system');return true;}
   if(cmd.includes('enter')&&!q.started){q.started=true;q.step++;add('Reach the crate ◆. You are @. Tires are ■.','system');add(r18MazeDraw(q),'system');return true;}
   if(!q.started||q.finished||!cmd.includes('move'))return false;const d=cmd.includes('up')?[0,-1]:cmd.includes('down')?[0,1]:cmd.includes('left')?[-1,0]:cmd.includes('right')?[1,0]:null;if(!d)return false;const grid=R18_MAZES[q.variant],x=q.x+d[0],y=q.y+d[1];q.step++;
   if(!grid[y]||grid[y][x]==='#'||grid[y][x]===undefined){const amount=Math.max(1,Math.ceil(player.maxHp*.02));hurt(amount);add(`You bump the tire wall and lose up to ${amount} HP.`,'danger');if(stage==='fallen')return true;}else{q.x=x;q.y=y;if(grid[y][x]==='G'&&!f.r18MazeClaimed){r18RetainRoadReward('Scrap Metal','material');gainBolts(8);gainXp(Math.max(10,player.level*3));if(typeof v555AwardEquipmentDrop==='function'&&Math.random()<.25)v555AwardEquipmentDrop();f.r18MazeClaimed=true;q.finished=true;add('You reach the crate and recover its contents.','reward');}}
   add(r18MazeDraw(q),'system');return true;
  }},
  {exclusive:true,title:"THE HONEY JAR",text:"A beekeeper's suit hangs in an old orchard. Bees crowd a hollow tree, and honey glistens inside.",choices:"HARVEST HONEY   INSPECT BEEKEEPER GEAR   BACK AWAY",resolve(cmd){
   if(cmd.includes("harvest")){if(player.flags.r18HoneyHarvested){add("This hive has already been harvested; the bees need time undisturbed.","system");return false;}if(!addPack("Wild Honey","consumable"))return false;player.flags.r18HoneyHarvested=true;if(Math.random()<.35){roadHurt(4);add("A few bees sting as you recover the honey.","danger");}else add("You gather a sealed jar of Wild Honey and leave the hive intact.","reward");gainXp(Math.max(8,player.level*2));return true;}
   if(cmd.includes("gear")||cmd.includes("inspect")){add("The veil and gloves are patched. A note says to move slowly and leave enough for the bees.");if(!player.flags.r18HoneyGearSeen){player.flags.r18HoneyGearSeen=true;gainXp(4);}return true;}
   if(cmd.includes("back")||cmd.includes("away")){add("You leave the hive alone.");return true;}return false;
  }},
  {exclusive:true,title:"SALT ON THE ROAD",text:"A circle of salt surrounds an overturned chair. A hand-painted sign reads: DO NOT SIT.",choices:"INSPECT CIRCLE   SIT IN THE CHAIR   SCATTER SALT   BACK AWAY",resolve(cmd){
   if(cmd.includes("inspect")){add("Under the chair is a note: 'Please leave my place alone.' A small tin holds a few Bolts.");if(!player.flags.r18ChairTinClaimed){player.flags.r18ChairTinClaimed=true;gainBolts(8);gainXp(5);}return true;}
   if(cmd.includes("back")||cmd.includes("away")){add("You leave the chair and salt undisturbed.");return true;}return false;
  }},
  {exclusive:true, title:"THE PAPER STORM", text:"A gust fills the highway with old court records. One sheet carries a map drawn on the back.", choices:"FOLLOW PAPERS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("papers") && !cmd.includes("follow")) return false; gainBolts(4);addPack("Scrap Metal","material");gainXp(11);add("The map leads to a dry culvert containing scrap.");return true;}},
  {exclusive:true,title:"THE CAROUSEL HORSE",text:"A chipped fiberglass carousel horse stands beside the road. A faint spring-powered tune leaks from its base.",choices:"RIDE THE HORSE   INSPECT MUSIC BOX   SEARCH HOLLOW BODY   BACK AWAY",resolve(cmd){
   if(cmd.includes("ride")){if(Math.random()<.25){roadHurt(3);add("The horse rocks unexpectedly and throws you into the grass.","danger");}else add("The horse rocks once. The old tune carries across the empty road.");gainXp(4);return true;}
   if(cmd.includes("music")||cmd.includes("inspect")){add("A wound spring drives a small music box. Its warped melody is entirely mechanical.");if(!player.flags.r18CarouselMusicSeen){player.flags.r18CarouselMusicSeen=true;gainXp(5);}return true;}
   if(cmd.includes("body")||cmd.includes("search")){if(!addPack("Scrap Metal","material"))return false;gainXp(5);add("Inside the hollow body you find a small piece of Scrap Metal.");return true;}
   if(cmd.includes("back")||cmd.includes("away")){add("You leave the carousel horse behind.");return true;}return false;
  }},
  {title:"THE LOCKED FREEZER", text:"A ruined roadside restaurant has a padlocked freezer. Someone knocks from inside.",
   prompt(){return r18FreezerScene().opened?'TALK TO PRISONER   FIGHT PRISONER   BACK AWAY':'INSPECT RESTAURANT   OPEN FREEZER   BACK AWAY';},
   resolve(cmd){const s=r18FreezerScene();
    if(cmd.includes('back')||cmd.includes('away')){add('You leave the restaurant behind.');return true;}
    if(cmd.includes('inspect')&&!s.opened){add(s.ambush?'Two sets of fresh bootprints circle the freezer. Someone else is hiding nearby.':'A weak voice answers from behind the freezer door. A barricade has been built from the outside.','system');return true;}
    if(cmd.includes('open')&&!s.opened){if(s.ambush){const level=Math.max(1,Math.min(50,Number(player.level)||1)),hp=Math.max(14,Math.floor(baseHpForLevel(level)*.16));add('Two raiders spring from cover as the lock breaks.','danger');startCombat({name:'FREEZER AMBUSH',level,hp:hp*2,min:2,max:6,xp:Math.max(20,level*6),bolts:4,enemies:[{name:'RESTAURANT RAIDER',hp,bolts:2},{name:'FREEZER RAIDER',hp,bolts:2}],end:'The raiders retreat from the restaurant.'},'encounter');return true;}s.opened=true;add('A frightened prisoner stumbles into daylight, clutching a broken utensil.','bright');return true;}
    if(!s.opened)return false;
    if(cmd.includes('talk')){add('You lower your weapon and explain that the door is open. The prisoner thanks you and heads for the road.','bright');if(!player.flags.r18FreezerRescueReward){player.flags.r18FreezerRescueReward=true;r18RetainRoadReward('Energy Bars','consumable');gainXp(Math.max(8,player.level*2));add('A sealed ration remains in the restaurant supplies.','reward');}return true;}
    if(cmd.includes('fight')){const level=Math.max(1,Math.min(50,Number(player.level)||1));add('The frightened prisoner panics and lashes out.','danger');startCombat({name:'FRIGHTENED PRISONER',level,hp:Math.max(16,Math.floor(baseHpForLevel(level)*.18)),min:1,max:4,xp:Math.max(12,level*4),bolts:0,end:'The prisoner drops the utensil and flees.'},'encounter');return true;}return false;
   }},
  {exclusive:true,title:"THE BRIDGE TOLL",text:"An old man tends a painted plywood toll booth beside a bridge. 'The toll is a joke,' he says, smiling.",choices:"TELL A ROAD JOKE   TELL A FOOD JOKE   ASK ABOUT BRIDGE   BACK AWAY",resolve(cmd){
   if(cmd.includes("road joke")){add("You tell him the road to the coast has its ups and downs. He groans, then waves you through.");if(!player.flags.r18BridgeJokeSeen){player.flags.r18BridgeJokeSeen=true;gainXp(5);}player.flags.r18BridgeMet=true;return true;}
   if(cmd.includes("food joke")){add("You tell him the pantry's best guard was a cereal killer. He laughs in spite of himself and waves you through.");if(!player.flags.r18BridgeJokeSeen){player.flags.r18BridgeJokeSeen=true;gainXp(5);}player.flags.r18BridgeMet=true;return true;}
   if(cmd.includes("bridge")){add(player.flags.r18BridgeMet?"He recognizes you and recalls the bridge before the collapse, when travelers stopped to watch the river.":"He says the bridge once carried families home. Now a joke gives travelers a reason to pause.");player.flags.r18BridgeMet=true;if(!player.flags.r18BridgeHistorySeen){player.flags.r18BridgeHistorySeen=true;gainXp(5);}return true;}
   if(cmd.includes("back")||cmd.includes("away")){add("He tips his hat as you continue without telling a joke.");return true;}return false;
  }},
  {exclusive:true, title:"THE RAIN BARREL", text:"A row of barrels catches runoff beneath a ruined greenhouse. One is filled with glass marbles.", choices:"SIFT MARBLES   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("marbles") && !cmd.includes("sift")) return false; gainBolts(3);addPack("Wire","material");gainXp(10);add("Under the marbles sits a watertight repair kit.");return true;}},
  {exclusive:true, title:"THE BURNT LIBRARY", text:"Books spill from a scorched bookmobile. One shelf has escaped the flames.", choices:"SALVAGE BOOKS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("books") && !cmd.includes("salvage")) return false; addPack("Bandage","consumable");gainXp(13);add("You find a field guide with practical first-aid notes.");return true;}},
  {exclusive:true, title:"THE GARDEN GNOMES", text:"Dozens of painted gnomes face the same empty window. Fresh soil surrounds the smallest.", choices:"DIG NEAR GNOME   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("gnome") && !cmd.includes("dig")) return false; if(Math.random()<0.3){roadHurt(6);gainXp(4);add("A rusted snare snaps around your wrist beneath the fresh soil. You wrench free before reaching the stash.","danger");}else{gainBolts(11);gainXp(8);add("Someone buried a stash of Bolts beneath the smallest statue.");}return true;}},
  {exclusive:true,title:"THE MISSING STAIRS",text:"A staircase rises from an empty foundation to a wooden door suspended in air. A crooked sign says: KNOCK FIRST.",choices:"KNOCK ON THE DOOR   SEARCH THE LANDING   SEARCH THE FOUNDATION   BACK AWAY",resolve(cmd){
   if(cmd.includes("knock")){add("Your knock is answered from inside. Through a crack you spot a spring and loose hammer: an old mechanical reply, not a person.");if(!player.flags.r18StairsMechanismSeen){player.flags.r18StairsMechanismSeen=true;gainXp(Math.max(6,player.level*2));}return true;}
   if(cmd.includes("landing")){if(!addPack("Cloth","material"))return false;if(Math.random()<.35){roadHurt(6);add("The landing gives under one foot, but you pull free with the bag.","danger");}else add("The landing holds long enough to reach a forgotten canvas bag.");gainXp(Math.max(6,player.level));return true;}
   if(cmd.includes("foundation")){if(!addPack("Scrap Metal","material"))return false;gainXp(Math.max(4,player.level));add("You search the foundation and recover Scrap Metal.");return true;}
   if(cmd.includes("back")||cmd.includes("away")){add("You leave the stairs standing.");return true;}return false;
  }},
  {exclusive:true, title:"THE WASH LINE", text:"Clean bedsheets hang between two dead trees. No house stands within sight.", choices:"CHECK CLOTHESLINE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("clothesline") && !cmd.includes("check")) return false; addPack("Cloth","material");gainXp(10);add("The sheets are patched with surprisingly durable cloth.");return true;}},
  {exclusive:true,title:"THE PAINTED ARROWS",text:"Three arrows cross the pavement: BLUE, RED and YELLOW. Each leads in a different direction.",choices:"FOLLOW BLUE ARROW   FOLLOW RED ARROW   FOLLOW YELLOW ARROW   BACK AWAY",combat:{action:"FOLLOW RED ARROW",name:"ARROW AMBUSH",level:4,hp:44,min:4,max:8,xp:35,bolts:8,enemies:[{name:"SCAVENGER WITH CLUB",hp:22,bolts:4},{name:"SCAVENGER WITH KNIFE",hp:22,bolts:4}],end:"The ambushers abandon the red-marked path."},resolve(cmd){
   if(cmd.includes("blue")){gainBolts(7);gainXp(Math.max(7,player.level*2));add("The blue arrow leads to a small hidden stash under a guardrail.");return true;}
   if(cmd.includes("yellow")){add("The yellow arrow leads to an abandoned campsite. A note describes the highway and a safe place to shelter from storms.");if(!player.flags.r18ArrowCampSeen){player.flags.r18ArrowCampSeen=true;gainXp(Math.max(6,player.level*2));}return true;}
   if(cmd.includes("back")||cmd.includes("away")){add("You leave the arrows behind.");return true;}return false;
  }},
  {exclusive:true,title:"THE WHEELBARROW",text:"A wheelbarrow of stones sits in the lane. Beneath the load is a small steel case; something shifts between the rocks.",choices:"MOVE STONES CAREFULLY   TIP THE WHEELBARROW   BACK AWAY",resolve(cmd){
   if(cmd.includes("carefully")){if(!addPack("Wire","material"))return false;if(Math.random()<.25){roadHurt(4);add("A stone slips and bruises your hand as you lift the case.","danger");}else add("You move the stones slowly and recover Wire from the steel case.");gainXp(Math.max(6,player.level*2));return true;}
   if(cmd.includes("tip")){if(Math.random()<.5){add("A snake coils among the fallen stones and strikes!","danger");startCombat({name:"ROAD SNAKE",level:Math.max(1,player.level),hp:Math.max(18,Math.floor(baseHpForLevel(player.level)*.2)),min:3,max:7,xp:Math.max(15,player.level*5),bolts:0,r18Wheelbarrow:true,end:"The snake withdraws from the wheelbarrow."},"encounter");return true;}if(!addPack("Scrap Metal","material"))return false;gainXp(Math.max(5,player.level));add("The stones scatter. No snake appears, and the case contains Scrap Metal.");return true;}
   if(cmd.includes("back")||cmd.includes("away")){add("You leave the wheelbarrow alone.");return true;}return false;
  }},
  {title:"THE SILENT PICNIC",exclusive:false,text:"A picnic blanket holds four empty plates and a chessboard. A note reads YOUR MOVE.",description(){return this.text+' '+R18_CHESS_PUZZLES[r18PicnicScene().variant].setup;},prompt(){const p=R18_CHESS_PUZZLES[r18PicnicScene().variant];return player.flags.r18PicnicSolved?'OPEN SECRET COMPARTMENT   BACK AWAY':[p.wrong[0],p.answer,p.wrong[1]].map(x=>'PLAY '+x).concat(['SEARCH HOLLOW PIECE','BACK AWAY']).join('   ');},resolve(cmd){
   const f=player.flags,p=R18_CHESS_PUZZLES[r18PicnicScene().variant];if(cmd.includes('back')||cmd.includes('away')){add('You leave the picnic behind.');return true;}
   if(cmd.includes('hollow')){if(!f.r18PicnicPiece){f.r18PicnicPiece=true;gainBolts(6);add('A hollow chess piece hides six Bolts.','reward');}else add('The hollow piece is empty.','system');return true;}
   if(cmd.startsWith('play ')){if(f.r18PicnicSolved)return false;if(cmd.slice(5).toUpperCase()===p.answer){f.r18PicnicSolved=true;add('Checkmate. A hidden compartment clicks open.','bright');}else add('That move is not checkmate. You can try another.','system');return true;}
   if(cmd.includes('compartment')&&f.r18PicnicSolved)return r18PicnicBlueprint();return false;
  }},
  {exclusive:true, title:"THE COIN WELL", text:"A roadside wishing well has dried out. Its bottom glitters with offerings.", choices:"(D) DESCEND WELL   (B) BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("well") && !cmd.includes("descend")) return false; roadHurt(4);gainBolts(12);gainXp(12);add("You climb back up with a fistful of hardware and scraped knuckles.");return true;}},
  {exclusive:true, title:"THE FENCE ARTIST", text:"Someone has woven a giant bird from scrap into a chain-link fence.", choices:"INSPECT SCULPTURE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("sculpture") && !cmd.includes("inspect")) return false; gainBolts(2);addPack("Scrap Metal","material");gainXp(10);add("A removable wing makes a useful strip of metal.");return true;}},
  {exclusive:true, title:"THE MILK CRATES", text:"A pyramid of crates blocks a driveway. A ratty flag marks the top.", choices:"SHIFT CRATES   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("crates") && !cmd.includes("shift")) return false; gainBolts(2);addPack("Energy Bars","consumable");gainXp(10);add("You find a wrapped emergency ration beneath the bottom crate.");return true;}},
  {exclusive:true, title:"THE DRY FOUNTAIN", text:"A cracked fountain holds thousands of bottle caps arranged into a spiral.", choices:"TRACE SPIRAL   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("spiral") && !cmd.includes("trace")) return false; gainBolts(8);gainXp(12);add("The spiral points to a loose stone hiding Bolts.");return true;}}
];

const eastEncounters = [
  {exclusive:true, title:"THE IRON HARVEST", text:"A combine crawls across an empty field, blades still spinning without a driver.", choices:"DISABLE BLADES   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("blades") && !cmd.includes("disable")) return false; roadHurt(9);gainBolts(12);addPack("Scrap Metal","material");gainXp(23);add("You jam its belt with a fallen branch and strip its casing.");return true;}},
  {exclusive:true, title:"THE GLASS FIELD", text:"An ancient fire fused the soil into jagged green glass. A supply box sits on the far side.", choices:"CROSS GLASS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("glass") && !cmd.includes("cross")) return false; roadHurt(7);gainBolts(12);addPack("Bandage","consumable");gainXp(20);add("You reach the box but slice your sleeve on the way.");return true;}},
  {exclusive:true, title:"THE BURIED FREIGHT", text:"A freight carriage protrudes from a hillside. Cargo containers lean at impossible angles.", choices:"PRY CARGO   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("cargo") && !cmd.includes("pry")) return false; roadHurt(8);gainBolts(15);addPack("Scrap Metal","material");gainXp(22);add("You recover a sealed crate of useful salvage.");return true;}},
  {exclusive:true, title:"THE RED RAIN", text:"Rust-colored rain sweeps across the road, stinging exposed skin.", choices:"FIND SHELTER   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("shelter") && !cmd.includes("find")) return false; roadHurt(4);gainBolts(7);addPack("Cloth","material");gainXp(20);add("You wait beneath a concrete lip and find an old cache there.");return true;}},
  {exclusive:true, title:"THE ASH PROCESSION", text:"Figures in ash-coated protective suits carry an empty coffin toward the hills.", choices:"FOLLOW PROCESSION   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("procession") && !cmd.includes("follow")) return false; gainBolts(14);gainXp(22);add("Their path passes a sheltered supply dump. They never acknowledge you.");return true;}},
  {exclusive:true, title:"THE COLLAPSED DAM", text:"Water surges through a broken spillway beside the highway.", choices:"CROSS SPILLWAY   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("spillway") && !cmd.includes("cross")) return false; roadHurt(9);gainBolts(13);addPack("Wire","material");gainXp(23);add("You leap a widening crack and find repair materials beyond it.");return true;}},
  {exclusive:true, title:"THE IRON CHOIR", text:"Wind makes hundreds of hanging engine valves ring like bells. A raider patrol is nearby.", choices:"SILENCE BELLS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("bells") && !cmd.includes("silence")) return false; roadHurt(5);gainBolts(16);gainXp(24);add("You tie off the valves and slip past the patrol to a stash.");return true;}},
  {exclusive:true, title:"THE FURNACE PIT", text:"A smoldering pit burns under an abandoned brickworks. Something valuable shines inside.", choices:"HOOK METAL   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("metal") && !cmd.includes("hook")) return false; roadHurt(8);gainBolts(10);addPack("Scrap Metal","material");gainXp(21);add("You pull out a forged bracket before the heat drives you away.");return true;}},
  {exclusive:true, title:"THE MASK MARKET", text:"Three masked traders auction items without speaking. Their bids are made with hand signs.", choices:"TRADE HAND SIGNS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("signs") && !cmd.includes("trade")) return false; gainBolts(17);gainXp(20);add("Your clumsy bid earns a laugh and a pouch of Bolts.");return true;}},
  {exclusive:true, title:"THE CRACKED AQUEDUCT", text:"A narrow aqueduct crosses the road overhead. The supports are buckling.", choices:"RUN UNDER ARCH   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("arch") && !cmd.includes("run")) return false; roadHurt(8);gainBolts(7);addPack("Wire","material");gainXp(24);add("Stone rains down behind you. You salvage a fallen tool pouch.");return true;}},
  {exclusive:true, title:"THE BONE FLAGS", text:"Polished bones hang from red flags at a ravine crossing.", choices:"SEARCH RAVINE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("ravine") && !cmd.includes("search")) return false; roadHurt(5);gainBolts(11);addPack("Cloth","material");gainXp(22);add("You uncover an abandoned expedition pack.");return true;}},
  {exclusive:true, title:"THE SCRAP DUEL", text:"Two armored scavengers settle a dispute by throwing sharpened hubcaps at targets.", choices:"CHALLENGE WINNER   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("winner") && !cmd.includes("challenge")) return false; roadHurt(6);gainBolts(20);gainXp(26);add("You win a small wager, though one hubcap clips your arm.");return true;}},
  {exclusive:true, title:"THE QUARRY LIFT", text:"An industrial lift hangs above a flooded quarry. Its hand crank still turns.", choices:"LOWER PLATFORM   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("platform") && !cmd.includes("lower")) return false; roadHurt(8);gainBolts(14);addPack("Scrap Metal","material");gainXp(23);add("The platform reaches a ledge with forgotten mining supplies.");return true;}},
  {exclusive:true, title:"THE BLACK SNOW", text:"Ash flakes fall like snow from a distant burn. Fresh bootprints appear through the dust.", choices:"TRACK FOOTPRINTS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("footprints") && !cmd.includes("track")) return false; roadHurt(4);gainBolts(16);gainXp(24);add("The prints lead to a hidden smuggler cache.");return true;}},
  {exclusive:true, title:"THE ROAD EATER", text:"A massive burrowing creature tears through the pavement ahead.", choices:"HIDE FROM BEAST   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("beast") && !cmd.includes("hide")) return false; gainXp(30);add("You survive by lying motionless as the road buckles nearby.");return true;}},
  {exclusive:true, title:"THE CHAIN BRIDGE", text:"A suspension footbridge swings over a dry gorge. Its middle planks are missing.", choices:"CROSS CHAINS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("chains") && !cmd.includes("cross")) return false; roadHurt(10);gainBolts(13);addPack("Wire","material");gainXp(25);add("You crawl the cables and claim a toolbox on the other side.");return true;}},
  {exclusive:true, title:"THE WELDED BUS", text:"A school bus has been welded into a crude armored bunker.", choices:"OPEN HATCH   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("hatch") && !cmd.includes("open")) return false; roadHurt(5);gainBolts(10);addPack("Bandage","consumable");gainXp(22);add("The bunker is abandoned, but its storage lockers remain intact.");return true;}},
  {exclusive:true, title:"THE WAX MUSEUM", text:"Life-size wax figures fill a shattered roadside attraction. One wears genuine armor.", choices:"STRIP MANNEQUIN   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("mannequin") && !cmd.includes("strip")) return false; roadHurt(3);gainBolts(9);addPack("Cloth","material");gainXp(22);add("The figure collapses into fragments as you recover its reinforced cloth.");return true;}},
  {exclusive:true, title:"THE STEEL ORCHARD", text:"Metal stakes stand in perfect rows where fruit trees once grew.", choices:"EXAMINE ROOTS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("roots") && !cmd.includes("examine")) return false; gainBolts(12);addPack("Scrap Metal","material");gainXp(21);add("The stakes conceal buried bolts and fasteners.");return true;}},
  {exclusive:true, title:"THE QUICKSAND CUT", text:"Fine gray silt covers a washed-out road. Half a wagon protrudes from the mud.", choices:"REACH WAGON   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("wagon") && !cmd.includes("reach")) return false; roadHurt(9);gainBolts(18);gainXp(23);add("You retrieve a pouch but lose your footing in the silt.");return true;}},
  {exclusive:true, title:"THE GRINDER CREW", text:"A salvage crew is feeding whole vehicles into an enormous hand-powered crusher.", choices:"BARGAIN FOR SCRAP   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("scrap") && !cmd.includes("bargain")) return false; gainBolts(8);addPack("Scrap Metal","material");gainXp(22);add("They sell you a box of offcuts for an unexpectedly fair price.");return true;}},
  {exclusive:true, title:"THE HOLLOW STATUE", text:"A giant concrete worker statue has fallen across the highway. Its chest is hollow.", choices:"ENTER STATUE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("statue") && !cmd.includes("enter")) return false; roadHurt(5);gainBolts(10);addPack("Wire","material");gainXp(24);add("Inside is a stash of tools left by an earlier traveler.");return true;}},
  {exclusive:true, title:"THE SALT MINERS", text:"A mining crew drags sleds of white mineral blocks across the road.", choices:"HELP PULL SLED   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("sled") && !cmd.includes("help")) return false; roadHurt(5);gainBolts(16);gainXp(24);add("The miners reward your effort with spare fittings.");return true;}},
  {exclusive:true, title:"THE CINDER WOLVES", text:"Heat-scarred predators stalk a charcoal forest, their eyes reflecting orange light.", choices:"SCARE PACK   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("pack") && !cmd.includes("scare")) return false; roadHurt(12);gainBolts(8);gainXp(28);add("You drive them off with noise but suffer a glancing bite.");return true;}},
  {exclusive:true, title:"THE BLADE CART", text:"A runaway handcart bristling with metal blades rolls downhill toward you.", choices:"DODGE CART   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("cart") && !cmd.includes("dodge")) return false; roadHurt(7);gainBolts(9);addPack("Scrap Metal","material");gainXp(24);add("It smashes into a barrier. You salvage its wheels.");return true;}},
  {exclusive:true, title:"THE EMPTY ARMORY", text:"A military bunker has been stripped clean except for a welded floor plate.", choices:"LIFT FLOOR PLATE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("plate") && !cmd.includes("lift")) return false; roadHurt(8);gainBolts(9);addPack("Bandage","consumable");gainXp(23);add("Beneath it sits a waterproof first-aid pouch.");return true;}},
  {exclusive:true, title:"THE BONE COLLECTOR", text:"A masked hunter carries trophies from creatures far larger than you.", choices:"KEEP DISTANCE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("distance") && !cmd.includes("keep")) return false; gainBolts(13);gainXp(27);add("You follow the hunter’s tracks to a dropped supply pouch, then leave quickly.");return true;}},
  {exclusive:true, title:"THE SUNKEN CHAPEL", text:"Only a chapel steeple rises above a muddy reservoir. A rope leads down inside.", choices:"DESCEND ROPE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("rope") && !cmd.includes("descend")) return false; roadHurt(10);gainBolts(19);gainXp(26);add("A dry alcove contains a sealed metal strongbox.");return true;}},
  {exclusive:true, title:"THE LIME FOG", text:"White industrial dust rolls across the road, hiding a steep drop.", choices:"FEEL FOR EDGE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("edge") && !cmd.includes("feel")) return false; roadHurt(6);gainBolts(8);addPack("Wire","material");gainXp(25);add("You navigate by touch and find a lost surveyor kit.");return true;}},
  {exclusive:true, title:"THE FIGHTING RING", text:"A circle of wrecked cars surrounds a bare-knuckle contest.", choices:"ENTER CONTEST   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("contest") && !cmd.includes("enter")) return false; roadHurt(19);gainBolts(24);gainXp(35);add("You survive three brutal rounds and collect the purse.");return true;}},
  {exclusive:true, title:"THE GATELESS WALL", text:"A huge defensive wall runs across the plain, but its gate was removed years ago.", choices:"CLIMB BREACH   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("breach") && !cmd.includes("climb")) return false; roadHurt(7);gainBolts(13);addPack("Scrap Metal","material");gainXp(24);add("You find abandoned sentry supplies atop the rubble.");return true;}},
  {exclusive:true, title:"THE TAR POOL", text:"A black pool bubbles beside the road. Metal objects protrude from its surface.", choices:"FISH FOR METAL   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("metal") && !cmd.includes("fish")) return false; roadHurt(10);gainBolts(10);addPack("Scrap Metal","material");gainXp(25);add("You snag a heavy toolbox but burn your hand on the tar.");return true;}},
  {exclusive:true, title:"THE RUST PARADE", text:"Scavengers push elaborate metal floats through the dust, celebrating a victory nobody remembers.", choices:"JOIN PARADE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("parade") && !cmd.includes("join")) return false; gainBolts(17);gainXp(23);add("You help push a float and receive a few Bolts for the effort.");return true;}},
  {exclusive:true, title:"THE KNIFE WIND", text:"A narrow canyon funnels sand sharp enough to strip paint.", choices:"COVER FACE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("face") && !cmd.includes("cover")) return false; roadHurt(8);gainBolts(12);addPack("Cloth","material");gainXp(25);add("You emerge scratched but recover a lost pack wedged in the rock.");return true;}},
  {exclusive:true, title:"THE WARDEN", text:"An armored enforcer orders everyone on the highway to kneel. His equipment is far beyond yours.", choices:"HIDE FROM WARDEN   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("warden") && !cmd.includes("hide")) return false; gainXp(35);add("You disappear into a drainage crack and wait for his patrol to pass.");return true;}},
  {exclusive:true, title:"THE OIL DERRICK", text:"A pumpjack moves slowly despite its broken drive belt. The ground trembles beneath it.", choices:"SEARCH SHED   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("shed") && !cmd.includes("search")) return false; roadHurt(7);gainBolts(14);addPack("Wire","material");gainXp(24);add("The shed holds old maintenance tools and a salvage tin.");return true;}},
  {exclusive:true, title:"THE CRANE NEST", text:"Giant birds have nested in the cab of a construction crane. Something shiny hangs from the nest.", choices:"CLIMB CRANE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("crane") && !cmd.includes("climb")) return false; roadHurt(13);gainBolts(20);gainXp(29);add("You retrieve a cache while the birds circle overhead.");return true;}},
  {exclusive:true, title:"THE COLD FOUNDRY", text:"A foundry floor is littered with unfinished iron castings and shattered molds.", choices:"SEARCH MOLDS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("molds") && !cmd.includes("search")) return false; roadHurt(5);gainBolts(11);addPack("Scrap Metal","material");gainXp(24);add("You find a usable metal bracket beneath the slag.");return true;}},
  {exclusive:true, title:"THE MUD CANNON", text:"A pressurized pipe erupts from a flooded excavation, hurling mud across the highway.", choices:"CLOSE VALVE   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("valve") && !cmd.includes("close")) return false; roadHurt(9);gainBolts(11);addPack("Wire","material");gainXp(26);add("You shut it down and recover the crew’s forgotten tools.");return true;}},
  {exclusive:true, title:"THE HANGING CAGE", text:"A steel cage swings from a highway gantry. The door is open, and a locked chest sits inside.", choices:"REACH CHEST   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("chest") && !cmd.includes("reach")) return false; roadHurt(12);gainBolts(22);gainXp(29);add("You retrieve the chest as the cable starts to fray.");return true;}},
  {exclusive:true, title:"THE DUST HORSES", text:"A herd of feral horses races across the road, pursued by a distant fire.", choices:"CLEAR THEIR PATH   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("path") && !cmd.includes("clear")) return false; gainBolts(12);addPack("Cloth","material");gainXp(25);add("You move debris and discover a dropped saddlebag after they pass.");return true;}},
  {exclusive:true, title:"THE SHATTERED SILO", text:"A grain silo split down the middle. Its surviving staircase twists upward.", choices:"CLIMB SILO   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("silo") && !cmd.includes("climb")) return false; roadHurt(10);gainBolts(11);addPack("Bandage","consumable");gainXp(26);add("A high platform holds an old emergency supply box.");return true;}},
  {exclusive:true, title:"THE FORGOTTEN ARENA", text:"Concrete bleachers surround a pit filled with scavenged armor.", choices:"SEARCH BLEACHERS   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("bleachers") && !cmd.includes("search")) return false; roadHurt(6);gainBolts(18);gainXp(25);add("A spectator cache still holds a pouch of bolts.");return true;}},
  {exclusive:true, title:"THE LAST ORCHARD", text:"A single fruit tree grows inside a barricade of sharpened metal.", choices:"ENTER ORCHARD   BACK AWAY", resolve(cmd){ if(cmd.includes("back")||cmd.includes("away")){add("You leave the scene undisturbed.");return true;} if(!cmd.includes("orchard") && !cmd.includes("enter")) return false; roadHurt(8);gainBolts(10);addPack("Scrap Metal","material");gainXp(25);add("The fruit is inedible, but the barricade contains useful salvage.");return true;}}
];



return {encounters, eastEncounters};

},
// END base

// BEGIN beginner — formerly app.js
beginner(){
const beginnerAdditions=[
  beginnerEvent("IRRADIATED ROACHES","A forgotten farmhouse garden still grows among the weeds. Three territorial chickens guard a vegetable patch and fruit tree.",{
    "HARVEST VEGETABLES":()=>{if((Number(day)||1)<(Number(player.flags.r18GardenRefreshDay)||0)){add("The patch needs time to grow back.","system");return false;}const vegetables=["Fresh Potato","Fresh Carrot","Fresh Tomato","Fresh Cabbage"],start=Math.floor(Math.random()*vegetables.length);r18RetainRoadReward(vegetables[start],"consumable");r18RetainRoadReward(vegetables[(start+1)%vegetables.length],"consumable");player.flags.r18GardenRefreshDay=(Number(day)||1)+3;add("You gather two portions of fresh vegetables from the garden.","reward");return true;},
    "PICK FRUIT":()=>{if((Number(day)||1)<(Number(player.flags.r18GardenRefreshDay)||0)){add("The garden needs time to grow back.","system");return false;}const fruits=["Fresh Apple","Fresh Pear","Fresh Berries"];r18RetainRoadReward(fruits[Math.floor(Math.random()*fruits.length)],"consumable");player.flags.r18GardenRefreshDay=(Number(day)||1)+3;add("You gather fresh fruit and leave the plants to recover.","reward");return true;},
    "FEED THE CHICKENS":()=>{const food=['Energy Bars','Fresh Apple','Fresh Carrot','Fresh Potato'].find(x=>hasItem(x));if(!food){add("You need food to feed the chickens.","system");return false;}if(!removeItem(food))return false;add("The chickens peck at the food and let you pass.");if(!player.flags.r18GardenFed){player.flags.r18GardenFed=true;gainXp(Math.max(6,player.level));}return true;},
    "SNEAK PAST":()=>{add("You slip around the flock and leave the patch undisturbed.");return true;},
    "FIGHT CHICKENS":()=>true
  },{action:"FIGHT CHICKENS",name:"GARDEN CHICKENS",level:2,hp:45,min:1,max:4,xp:24,bolts:0,r18GardenChickens:true,enemies:[{name:"ROOSTER",hp:15,bolts:0},{name:"HEN",hp:15,bolts:0},{name:"SCRAPPER",hp:15,bolts:0}],end:"The surviving flock scatters from the garden."}),
  Object.assign(beginnerEvent("RATS IN THE PANTRY","A tipped food cart rattles with movement. Three rats circle a food crate.",{
    "FIGHT RATS":()=>true,
    "LURE WITH RATION":()=>{if(!hasItem("Energy Bars")){add("You have no ration to spare.","system");return false;}removeItem("Energy Bars");gainXp(Math.max(8,player.level*2));add("You toss food away from the cart and slip past the rats.");return true;},
    "TIP THE CART":()=>{if(Math.random()<.4){roadHurt(4);add("The cart shifts unexpectedly, but you get clear.","danger");}else add("You tip the cart away from yourself and give the rats room to scatter.");gainXp(Math.max(5,player.level));return true;},
    "WAIT ON ROOF":()=>{add("You wait on the cart's roof until the rats wander away.");return true;},
    "SEARCH FOOD CACHE":()=>{if(player.flags.r18PantryCacheClaimed){add("The food cache has already been searched.","system");return true;}r18RetainRoadReward("Fresh Carrot","consumable");r18RetainRoadReward("Preserved Vegetables","consumable");if(Math.random()<.25)r18RetainRoadReward("Bandage","consumable");player.flags.r18PantryCacheClaimed=true;gainXp(Math.max(8,player.level*2));add("You recover a fresh carrot from a protected crate.","reward");return true;}
  },{action:"FIGHT RATS",name:"PANTRY RAT PACK",level:3,hp:54,min:3,max:6,xp:30,bolts:0,r18RatPack:true,enemies:[{name:"ALPHA RAT",hp:18,bolts:0},{name:"SCAVENGER RAT",hp:18,bolts:0},{name:"GNAWER RAT",hp:18,bolts:0}],end:"The surviving rats scatter from the cart."}),{maxLevel:50}),
  {title:"THE SCRAP CLAIM",minLevel:1,maxLevel:50,exclusive:false,text:"A territorial scavenger guards an overturned vehicle. Thin wire runs between the wreck and a nearby post.",choices:"INSPECT TRAPS   DISABLE TRAPS   NEGOTIATE FOUR BOLTS   INTIMIDATE   FIGHT CLAIMANT   BACK AWAY",combat:{action:"FIGHT CLAIMANT",name:"SCRAP CLAIMANT",level:3,hp:25,min:4,max:7,xp:24,bolts:6,r18ScrapClaim:true,end:"The claimant drops his weapon and leaves the wreck."},resolve(cmd){
    const q=r18ScrapClaimState();
    if(cmd.includes("inspect")){add("A tripwire crosses the approach; the wreck provides the claimant cover.");return true;}
    if(cmd.includes("disable")){q.disarmed=true;add("You carefully unhook the tripwire without setting it off.","reward");gainXp(Math.max(4,player.level));return true;}
    if(cmd.includes("negotiate")){if(!roadTrade("Scrap Metal","material",4))return false;add("Four Bolts buys a strip of metal and an end to the argument.");return true;}
    if(cmd.includes("intimidate")){if(Math.random()<.6){if(!player.flags.r18ScrapWreckLooted){if(!addPack("Scrap Metal","material"))return false;player.flags.r18ScrapWreckLooted=true;}gainXp(Math.max(7,player.level*2));add("The scavenger gives ground. You salvage the exposed wreck.");}else{add("Your bluff fails. The claimant raises his weapon.","danger");startCombat(r18ScrapFight(this.combat),"encounter");}return true;}
    if(cmd.includes("back")||cmd.includes("away")){add("You withdraw from the claim.");return true;}return false;
  }},
  beginnerEvent("DOG AT THE DEN","A brindled dog guards a hollow beneath an old bus. Tiny paws move in the shadows behind her.",{
    "LEAVE A RATION":()=>{if(!hasItem("Energy Bars")){add("You have no food to leave.","system");return false;}removeItem("Energy Bars");add("You leave food and give the den space. She never leaves the pups.");gainXp(15);},
    "CIRCLE THE DEN":()=>{add("You take the far shoulder. She watches until you are gone.");},
    "FIGHT GUARD DOG":()=>true
  },{action:"FIGHT GUARD DOG",name:"DEN GUARD DOG",level:3,hp:24,min:4,max:7,xp:18,bolts:0,end:"She retreats beneath the bus. You leave the den alone."}),
  {title:"THE LIMPING HOUND",exclusive:false,minLevel:1,maxLevel:50,text:"A skinny hound trails you, limping on an injured paw.",
   prompt(){const f=player.flags;if(f.r18HoundNaming)return 'TYPE A NAME FOR THE DOG (1–24 CHARACTERS) OR CANCEL';if(f.r18HoundAdopted)return 'MOVE ON';return [!f.r18HoundFed?'OFFER FOOD':null,!f.r18HoundMetalRemoved?'REMOVE METAL FROM PAW':null,f.r18HoundMetalRemoved&&!f.r18HoundTreated?'TREAT WITH BANDAGE OR CLOTH':null,f.r18HoundFed&&f.r18HoundTreated?'ADOPT HOUND':null,'MOVE ON'].filter(Boolean).join('   ');},
   resolve(cmd){const f=player.flags;if(f.r18HoundAdopted){add('The hound is already part of your companions.','system');return true;}
    if(cmd.includes('food')){if(f.r18HoundFed)return true;const food=['Energy Bars','Raw Rat Meat','Raw Rabbit Meat','Raw Chicken Meat','Raw Boar Meat','Raw Venison','Raw Wolf Meat'].find(n=>player.pack.some(i=>i.name===n&&i.qty>0));if(!food){add('The hound needs a ration or suitable meat.','system');return false;}removeItem(food);f.r18HoundFed=true;add('The hound cautiously accepts the food.');return true;}
    if(cmd.includes('metal')||cmd.includes('paw')){if(!f.r18HoundMetalRemoved){f.r18HoundMetalRemoved=true;add('You gently remove a piece of metal from the injured paw.');}return true;}
    if(cmd.includes('treat')||cmd.includes('bandage')||cmd.includes('cloth')){if(!f.r18HoundMetalRemoved){add('Remove the metal from its paw first.','system');return false;}if(f.r18HoundTreated)return true;const material=['Bandage','Cloth'].find(n=>player.pack.some(i=>i.name===n&&i.qty>0));if(!material){add('You need a Bandage or Cloth to wrap the paw.','system');return false;}removeItem(material);f.r18HoundTreated=true;add('You wrap the paw. The hound settles beside you.');return true;}
    if(cmd.includes('adopt')){if(!f.r18HoundFed||!f.r18HoundTreated)return false;f.r18HoundNaming=true;add('What would you like to name the hound? Type a name of 1–24 characters, or CANCEL.','system');return true;}return false;
   }},
  beginnerEvent("BROKEN CLEANER BOT","A knee-high street-cleaning robot circles a pothole, sweeping the same patch of dust. 'PLEASE KEEP OUR COMMUNITY BEAUTIFUL,' it chirps.",{
    "FIGHT CLEANER":()=>true,
    "JAM BRUSH WITH STICK":()=>{if(Math.random()<.7){if(!roadLoot("Scrap Metal"))return false;add("A fallen stick jams the brush; you salvage the motor housing.");gainXp(Math.max(6,player.level*2));}else{add("The brush snaps the stick. A splinter grazes your arm.","danger");roadHurt(3);}return true;},
    "WAIT FOR BATTERY":()=>{if(!roadLoot("Scrap Metal"))return false;add("You wait until the battery drains and recover a loose housing.");gainXp(4);return true;},
    "SALVAGE THE CONTROL CIRCUIT":()=>{if(!addPack("Electronics","material",1,true)){add("Backpack full. Make space before salvaging the circuit.","system");return false;}gainXp(Math.max(5,player.level));add("You carefully remove a working Electronics component from the cleaner's control circuit.",'reward');return true;},
    "REPAIR CLEANER":()=>{if(player.flags.r18CleanerRepaired){add("You have already repaired this cleaner once. Its replacement keeps sweeping.","system");return true;}if(!hasItem("Scrap Metal")||!hasItem("Wire")){add("Repair needs one Scrap Metal and one Wire.","system");return false;}removeItem("Scrap Metal");removeItem("Wire");player.flags.r18CleanerRepaired=true;gainXp(Math.max(10,player.level*3));add("The cleaner spins happily, drives into the pothole, and announces: 'OBSTRUCTION DETECTED.'");return true;}
  },{action:"FIGHT CLEANER",name:"MALFUNCTIONING CLEANER",level:2,hp:20,min:2,max:6,xp:20,bolts:5,end:"The cleaner tips over. Its brush finally stops."}),
  beginnerEvent("THE DITCH BACKPACK","A torn backpack hangs in a thorn bush. Dried blood marks one strap, and boot prints lead toward a patch of trees.",{
    "SEARCH POCKETS":()=>{const finds=[['Bandage','consumable'],['Energy Bars','consumable'],['Cloth','material'],['Wire','material']];if(Math.random()<.2){gainBolts(5);add("A pocket contains five Bolts.");}else{const [name,type]=finds[Math.floor(Math.random()*finds.length)];if(!roadLoot(name,type))return false;add("You recover "+name+" from a dry pocket.");}gainXp(Math.max(5,player.level));return true;},
    "FOLLOW THE TRAIL":()=>{if(player.flags.r18DitchCampSearched){add("The deserted campsite has already been searched.","system");return true;}if(!roadLoot("Scrap Metal","material"))return false;player.flags.r18DitchCampSearched=true;gainXp(Math.max(8,player.level*2));add("The prints end at a deserted campsite. You recover Scrap Metal from the remains of a stove.");return true;},
    "SALVAGE STRAPS":()=>{if(!roadLoot("Cloth","material"))return false;gainXp(Math.max(4,player.level));add("The canvas is ruined, but the straps provide usable Cloth.");return true;}
  }),
  beginnerEvent("STONES UNDER THE OAK","Three memorial stones beneath an oak read ELLA 8, THOMAS 34, and MARY 32. A biscuit tin holds a note asking travelers to remember them and a family photo marked 'Our last summer together.'",{
    "RESPECT THE MEMORIAL":()=>{add("You read the names and leave the family’s memorial undisturbed.");if(!player.flags.r18MemorialSeen){player.flags.r18MemorialSeen=true;gainXp(Math.max(4,player.level));}return true;},
    "LEAVE ONE BOLT":()=>{if(player.flags.r18MemorialOffering){add("You have already left an offering here.","system");return true;}if(player.bolts<1){add("You need one Bolt to leave an offering.","system");return false;}player.bolts--;updateHud();player.flags.r18MemorialOffering=true;gainXp(Math.max(5,player.level));add("You place one Bolt beside the stones.");return true;},
    "TAKE OFFERINGS":()=>{if(player.flags.r18MemorialTaken){add("The offerings have already been taken.","system");return true;}player.flags.r18MemorialTaken=true;gainBolts(5);add("You take five Bolts from the tin, leaving the photo and note behind.");return true;}
  }),
  {title:"THE TIPPED DELIVERY TRUCK",minLevel:1,maxLevel:50,exclusive:false,text:"A delivery truck hangs above a ditch. Its injured driver says the food was meant for children in a nearby settlement.",choices:"INVESTIGATE SHIPMENT   RESCUE DRIVER   GIVE FOOD TO DRIVER   KEEP SOME FOOD   STEAL LOCKBOX   WALK AWAY",resolve(cmd){
   if(cmd.includes("investigate")){add("The delivery papers do not agree: one lists the food as relief, another bears a crossed-out theft report. The origin remains uncertain.");if(!player.flags.r18DeliveryEvidence){player.flags.r18DeliveryEvidence=true;gainXp(Math.max(5,player.level));}return true;}
   if(cmd.includes("rescue")){if(player.flags.r18DeliveryRescued){add("The driver is already clear of the wreck.");return true;}const tool=hasItem("Rope")||hasItem("Tire Iron")||hasItem("Claw Hammer")||/pipe|crowbar|wrench|hammer/i.test(player.weapon||"");if(!tool){add("You need Rope or a suitable tool to free the driver.","system");return false;}player.flags.r18DeliveryRescued=true;gainXp(Math.max(8,player.level*2));add("You brace the wreck and help the driver clear of the ditch.","reward");return true;}
   if(cmd.includes("give")&&cmd.includes("food")){if(!player.flags.r18DeliveryRescued){add("Free the driver before helping with the crates.","system");return false;}player.flags.r18DeliveryResolved="returned";gainXp(Math.max(12,player.level*3));add("You recover the crates for the driver and refuse payment. The shipment continues toward the settlement.","reward");return true;}
   if(cmd.includes("keep")&&cmd.includes("food")){r18RetainRoadReward("Fresh Carrot","consumable");r18RetainRoadReward("Preserved Vegetables","consumable");player.flags.r18DeliveryResolved="kept";gainXp(Math.max(8,player.level*2));add(player.flags.r18DeliveryRescued?"You help recover the shipment and keep a portion of its food.":"You take a portion of the food while the driver remains trapped.","reward");return true;}
   if(cmd.includes("steal")&&cmd.includes("lockbox")){if(player.flags.r18DeliveryResolved){add("The delivery has already been resolved.","system");return true;}if(!r18TheftAllowed())return false;player.flags.r18DeliveryResolved="lockbox";gainBolts(20);r18StolenReward("Pre-War Silver Coin","valuable");if(Math.random()<.35)r18TheftCaught("Delivery driver");gainXp(Math.max(5,player.level));add("You take the lockbox's Bolts and silver coin and leave the wreck behind.","reward");return true;}
   if(cmd.includes("walk")||cmd.includes("away")){add("You leave the delivery truck behind.");return true;}return false;
  }},
  {title:"COLD ROAD CAMP",minLevel:1,maxLevel:50,exclusive:true,text:"A fire ring, tarp and two mugs mark a roadside camp.",description(){return r18CampVariant()?"An exhausted traveler returns to the fire ring with a handcart of potatoes.":"A tarp and two mugs remain beside an abandoned fire ring.";},prompt(){return r18CampVariant()?"SHARE A MEAL   BARTER FOR POTATO   HELP GATHER WOOD   ROB TRAVELER   BACK AWAY":"SEARCH THE CAMPSITE   READ THE CARVED NAMES   BACK AWAY";},resolve(cmd){
    if(cmd.includes("back")||cmd.includes("away")){add("You leave the camp behind.");return true;}
    if(!r18CampVariant()){
      if(cmd.includes("search")){if(!addPack("Cloth","material"))return false;add("You recover dry Cloth from the edge of the tarp.");return true;}
      if(cmd.includes("names")){add("Two names and a date are carved into a stump. Someone made a home here for a night.");if(!player.flags.r18CampNamesSeen){player.flags.r18CampNamesSeen=true;gainXp(5);}return true;}return false;
    }
    if(cmd.includes("share")||cmd.includes("meal")){if(!hasItem("Energy Bars")){add("You need a ration to share.","system");return false;}removeItem("Energy Bars");add("You share a quiet meal beside the fire.");if(!player.flags.r18CampMealSeen){player.flags.r18CampMealSeen=true;gainXp(Math.max(5,player.level));}return true;}
    if(cmd.includes("barter")||cmd.includes("potato")){if(player.bolts<3){add("The traveler asks 3 Bolts for a potato.","system");return false;}if(!addPack("Fresh Potato","consumable",1,true)){add("Free a backpack slot before trading. No Bolts spent.","system");return false;}player.bolts-=3;updateHud();add("You trade 3 Bolts for a fresh potato.","reward");return true;}
    if(cmd.includes("wood")){add("You gather dry branches, and the traveler builds up the fire.");if(!player.flags.r18CampWoodHelped){player.flags.r18CampWoodHelped=true;gainXp(Math.max(5,player.level));}return true;}
    if(cmd.includes("rob")){if(!r18TheftAllowed())return false;r18TheftCaught("Camp traveler");add("The traveler grips a short knife and refuses to surrender the cart.","danger");startCombat({name:"CAMP TRAVELER",level:Math.max(1,player.level),hp:Math.max(18,Math.floor(baseHpForLevel(player.level)*.2)),min:2,max:5,xp:Math.max(12,player.level*4),bolts:4,end:"The traveler drops the knife and flees the camp."},"encounter");return true;}return false;
  }},
  beginnerEvent("THE LOCKED TOOL CHEST","Inside an abandoned garage, a toolbox bears a scratched warning: IF IT AIN'T YOURS, DON'T TOUCH IT.",{
    "PICK THE LOCK":()=>{if(player.flags.r18MechanicChestOpened)return r18OpenMechanicChest();if(Math.random()<.6)return r18OpenMechanicChest();add("The lock resists your improvised pick. The chest remains closed.");return true;},
    "WORK THE HINGE":()=>{if(player.flags.r18MechanicChestOpened)return r18OpenMechanicChest();if(Math.random()<.65)return r18OpenMechanicChest();add("The hinge holds fast; the chest remains closed.");return true;},
    "SMASH THE LOCK":()=>{if(player.flags.r18MechanicChestOpened)return r18OpenMechanicChest();add("The lock breaks and the fragile contents are scattered, but the plans survive.");return r18OpenMechanicChest();},
    "INVESTIGATE THE GARAGE":()=>{if(player.flags.r18MechanicGarageSearched){add("The garage has already been searched.","system");return true;}r18RetainRoadReward("Scrap Metal","material");player.flags.r18MechanicGarageSearched=true;add("The mechanic's log mentions a stubborn engine. You recover Scrap Metal from the workbench.","reward");return true;}
  }),
  beginnerEvent("PRINTS IN THE MUD","Bare footprints cross the shoulder. Each has six toes. They lead toward a dry ditch, then vanish.",{
    "FOLLOW THE PRINTS":()=>{if(Math.random()<.5){add("A scrap of discarded fabric snags a branch where the trail ends. No creature waits there.");roadLoot("Cloth");gainXp(10);}else{add("The mud gives way beneath your foot. You scramble clear of the ditch, but the trail is lost.");roadHurt(5);gainXp(4);}},
    "STUDY FROM ROAD":()=>{add("The stride is uneven. You identify a safer route around the ditch and keep your distance.");gainXp(3);}
  }),
  beginnerEvent("THE EMPTY BUS SHELTER","An elderly woman waits under a faded sign: ROUTE 127 — LAST DEPARTURE 6:15 PM. A tin rests beneath the seat.",{
    "SIT AND TALK":()=>{add("WOMAN > Sometimes it's nice to pretend there's still somewhere to go. I hope someone's waiting for you.");if(!player.flags.r18BusStopTalk){player.flags.r18BusStopTalk=true;gainXp(Math.max(4,player.level));}return true;},
    "SAY THE BUSES ARE GONE":()=>{add("She nods slowly. 'I know. I just like sitting where people used to come home.'");if(!player.flags.r18BusStopTalk){player.flags.r18BusStopTalk=true;gainXp(Math.max(4,player.level));}return true;},
    "OFFER A RATION":()=>{if(player.flags.r18BusStopFed){add("You have already shared food with her.","system");return true;}if(!hasItem("Energy Bars")){add("You need a ration to share.","system");return false;}if(!removeItem("Energy Bars"))return false;player.flags.r18BusStopFed=true;gainXp(Math.max(5,player.level));add("She thanks you and carefully puts the ration beside her.");return true;},
    "OPEN THE TIN":()=>{if(player.flags.r18BusStopTin){add("The tin has already been searched.","system");return true;}r18RetainRoadReward("Energy Bars","consumable");player.flags.r18BusStopTin=true;add("The tin holds a sealed ration and a child's drawing of a yellow bus. You leave the drawing inside.","reward");return true;},
    "TAKE THE DRAWING":()=>{if(player.flags.r18BusStopDrawing)return true;r18RetainRoadReward("Child's Bus Drawing","valuable");player.flags.r18BusStopDrawing=true;add("You keep the drawing folded flat, away from the damp.","reward");return true;},
    "SEARCH TICKET BOX":()=>{if(player.flags.r18BusStopTickets)return true;r18RetainRoadReward("Old Transit Token","valuable");r18RetainRoadReward("Vintage Bus Driver's Badge","valuable");player.flags.r18BusStopTickets=true;add("A ticket box holds an old transit token and a driver's badge.","reward");return true;},
    "READ THE TIMETABLE":()=>{add("The last departure was scheduled for 6:15 PM. The buses stopped long ago.");return true;}
  }),
  beginnerEvent("TORN BACKPACK","A torn canvas backpack hangs from a guardrail. Its seams are still intact.",{
    "SALVAGE THE STRAPS":()=>{add("You cut free sturdy canvas straps.");roadLoot("Cloth");gainXp(7);},
    "SEARCH HIDDEN POCKET":()=>{if(Math.random()<0.6){add("A concealed lining holds usable wire.");roadLoot("Wire");gainXp(9);}else{add("A rusted needle catches your finger. The pocket is empty.","danger");roadHurt(3);gainXp(3);}}
  }),
  {title:"BROKEN RADIO",exclusive:false,minLevel:1,maxLevel:50,text:"A portable radio crackles on a concrete barrier. Through the static, a voice repeats: 'Station Nine... anyone receiving?'",choices:"LISTEN TO BROADCAST   INSPECT THE RADIO   SALVAGE THE CIRCUIT   REMOVE THE CASING   MOVE ON",resolve(cmd){
    const f=player.flags;
    if(cmd.includes('listen')){add("The old call repeats beneath a newer recording: 'Don't answer that frequency.'");if(!f.r18RadioHeard){f.r18RadioHeard=true;gainXp(Math.max(4,player.level));}return true;}
    if(cmd.includes('inspect')){add("Inside the case, someone has scratched: 'marker 127-B... follow the dirt path.' The radio hisses into silence.");if(!f.r18RadioClue){f.r18RadioClue=true;gainXp(Math.max(5,player.level));}if(r18StationDiscover())add('The dirt path to Station Nine is marked at this road position. Return after the encounter.','reward');return true;}
    if(cmd.includes('circuit')){if(f.r18RadioCircuit){add("The usable circuit has already been recovered.","system");return true;}if(Math.random()<.65){r18RetainRoadReward("Wire","material");f.r18RadioCircuit=true;gainXp(10);add("You recover a coil of wire without disturbing the battery.");}else{add("The corroded battery leaks. You drop the radio before recovering anything.","danger");roadHurt(4);}return true;}
    if(cmd.includes('casing')){if(f.r18RadioCasing){add("The usable casing has already been recovered.","system");return true;}r18RetainRoadReward("Scrap Metal","material");f.r18RadioCasing=true;gainXp(6);add("The metal casing yields a useful piece of scrap.");return true;}return false;
  }},
  {title:"THE SPRAINED RUNNER",minLevel:1,maxLevel:50,exclusive:true,text:"A runner sits beside a broken handcart, rubbing an injured ankle. Sacks of vegetables lie beside the wheel.",description(){return player.flags.r18RunnerResult?"The runner you met before approaches with the repaired handcart.":this.text;},prompt(){return player.flags.r18RunnerResult==='helped'?"ACCEPT RUNNER GIFT   SAY GOODBYE":player.flags.r18RunnerResult==='robbed'?"SPEAK TO RUNNER   LEAVE RUNNER":"GIVE BANDAGE   FIX CART   MAKE WALKING STICK   STEAL FOOD   BACK AWAY";},resolve(cmd){
    if(player.flags.r18RunnerResult==='helped'){if(cmd.includes("gift")){r18RetainRoadReward("Fresh Carrot","consumable");r18RetainRoadReward("Preserved Vegetables","consumable");player.flags.r18RunnerReunionDone=true;add("The runner thanks you again and offers fresh and preserved food.","reward");return true;}if(cmd.includes("goodbye")){player.flags.r18RunnerReunionDone=true;add("The runner waves and continues down the road.");return true;}return false;}
    if(player.flags.r18RunnerResult==='robbed'){if(cmd.includes("speak")||cmd.includes("leave")){player.flags.r18RunnerReunionDone=true;add("The runner recognizes you, pulls the cart close, and withdraws without speaking.");return true;}return false;}
    if(cmd.includes("bandage")){if(!hasItem("Bandage")){add("You need a Bandage to wrap the ankle.","system");return false;}removeItem("Bandage");}
    else if(cmd.includes("fix")||cmd.includes("cart")){const part=hasItem("Wire")?"Wire":hasItem("Scrap Metal")?"Scrap Metal":null;if(!part){add("You need Wire or Scrap Metal to fix the cart.","system");return false;}removeItem(part);}
    else if(cmd.includes("stick")){add("You make a sturdy walking stick from a fallen branch.");}
    else if(cmd.includes("steal")){if(!r18TheftAllowed())return false;r18StolenReward("Fresh Carrot","consumable");r18StolenReward("Preserved Vegetables","consumable");if(Math.random()<.35)r18TheftCaught("Injured runner");player.flags.r18RunnerResult='robbed';add("You take food while the injured runner struggles to stand.","danger");return true;}
    else if(cmd.includes("back")||cmd.includes("away")){add("You leave the runner and the cart behind.");return true;}else return false;
    r18RetainRoadReward("Fresh Carrot","consumable");r18RetainRoadReward("Preserved Vegetables","consumable");player.flags.r18RunnerResult='helped';gainXp(Math.max(10,player.level*3));add("The runner thanks you and shares fresh and preserved food.","reward");return true;
  }},
  {title:"SCRATCHING IN THE SHED",exclusive:false,minLevel:1,maxLevel:50,text:"Something scratches inside a roadside shed. Beside it, a small vegetable patch survives in the dust.",description(){return player.flags.r18RabbitAdopted||player.flags.r18RabbitHarvested?"A quiet roadside shed stands beside a small vegetable patch.":player.flags.r18RabbitReleased?"A rabbit shelters near the roadside shed and its small vegetable patch.":this.text;},prompt(){const f=player.flags;return [!f.r18RabbitAdopted&&!f.r18RabbitHarvested?'PEER THROUGH GAP':null,!f.r18RabbitReleased&&!f.r18RabbitHarvested&&!f.r18RabbitAdopted?'FREE THE RABBIT':null,f.r18RabbitReleased&&!f.r18RabbitAdopted&&!f.r18RabbitHarvested?'FEED AND ADOPT RABBIT':null,!f.r18RabbitAdopted&&!f.r18RabbitHarvested?'HARVEST RABBIT':null,'SEARCH THE SHED','SEARCH THE GARDEN','MOVE ON'].filter(Boolean).join('   ');},resolve(cmd){
    const f=player.flags;
    if(cmd.includes('adopt')&&cmd.includes('rabbit')){if(f.r18RabbitAdopted||f.r18RabbitHarvested||!f.r18RabbitReleased)return false;const food=['Fresh Carrot','Fresh Potato','Preserved Vegetables'].find(n=>player.pack.some(i=>i.name===n&&i.qty>0));if(!food){add('You need a carrot, potato, or preserved vegetables to feed the rabbit.','system');return false;}removeItem(food);if(!port55Owned().includes('Wasteland Rabbit'))port55Owned().push('Wasteland Rabbit');f.r18RabbitAdopted=true;gainXp(Math.max(8,player.level*2));add('The rabbit accepts the food and joins your companions. Equip it from Manage Pets.','reward');return true;}
    if(cmd.includes('harvest')&&cmd.includes('rabbit')){if(f.r18RabbitAdopted||f.r18RabbitHarvested)return false;f.r18RabbitHarvested=true;r18RetainRoadReward('Raw Rabbit Meat','material');r18RetainRoadReward('Small Animal Bones','material');gainXp(Math.max(6,player.level));add('You harvest the rabbit for meat and bones.','reward');return true;}
    if(cmd.includes('free')&&cmd.includes('rabbit')){if(f.r18RabbitHarvested||f.r18RabbitAdopted)return false;if(f.r18RabbitReleased){add("The rabbit is already free.","system");return true;}f.r18RabbitReleased=true;gainXp(Math.max(6,player.level*2));add("You lift the rake and free the rabbit. It hops into the shelter of the garden.","reward");return true;}
    if(cmd.includes('peer')||cmd.includes('gap')){add(f.r18RabbitReleased?"The rabbit shelters near the shed, free of the fallen rake.":"A rabbit is trapped behind a tipped rake. It watches you through the gap.");if(!f.r18RabbitSeen){f.r18RabbitSeen=true;gainXp(Math.max(4,player.level));}return true;}
    if(cmd.includes('shed')){if(f.r18RabbitShedSearched){add("The shed supplies have already been collected.","system");return true;}r18RetainRoadReward("Wire","material");r18RetainRoadReward("Scrap Metal","material");f.r18RabbitShedSearched=true;gainXp(Math.max(5,player.level));add(f.r18RabbitReleased?"A repair pouch holds Wire and Scrap Metal. The freed rabbit shelters nearby.":"A repair pouch holds Wire and Scrap Metal. The rabbit remains sheltered behind the rake.");return true;}
    if(cmd.includes('garden')){if(f.r18RabbitGardenSearched){add("The garden has already been picked over.","system");return true;}r18RetainRoadReward("Fresh Carrot","consumable");f.r18RabbitGardenSearched=true;add("You find a fresh carrot in the little garden.","reward");return true;}return false;
  }},
  beginnerEvent("THE SAGGING FARMHOUSE","A sagging farmhouse leans against its chimney. A warning on the stairs reads DON'T GO UPSTAIRS.",{
    "SEARCH THE PORCH":()=>{if(player.flags.r18FarmPorch){add("The porch has already been searched.","system");return true;}r18RetainRoadReward("Scrap Metal","material");player.flags.r18FarmPorch=true;add("You salvage metal from a broken porch bench.","reward");return true;},
    "RISK THE PANTRY":()=>{if(player.flags.r18FarmPantry){add("The pantry has already been searched.","system");return true;}if(Math.random()<.3){roadHurt(6);add("A joist gives way. You retreat before reaching the pantry.","danger");return true;}r18RetainRoadReward("Preserved Vegetables","consumable");player.flags.r18FarmPantry=true;gainXp(Math.max(6,player.level*2));add("The pantry holds a sealed jar of preserved vegetables.","reward");return true;},
    "INVESTIGATE UPSTAIRS":()=>{if(Math.random()<.25){roadHurt(5);add("A loose stair breaks beneath your foot, but you pull back safely.","danger");return true;}add("A child's notebook reads: 'Dad says we'll be leaving tomorrow. Mom says we should stay. I just want to go home.' A barricaded door says PLEASE DON'T OPEN IT.");if(!player.flags.r18FarmNotebook){player.flags.r18FarmNotebook=true;gainXp(Math.max(6,player.level));}return true;},
    "PEEK THROUGH KEYHOLE":()=>{add("Through the keyhole you see a suitcase beside a skeleton. The door remains closed.");if(!player.flags.r18FarmKeyhole){player.flags.r18FarmKeyhole=true;gainXp(Math.max(4,player.level));}return true;},
    "FORCE THE DOOR":()=>{if(player.flags.r18FarmSuitcase){add("The suitcase has already been searched.","system");return true;}r18RetainRoadReward("Cloth","material");player.flags.r18FarmSuitcase=true;gainXp(Math.max(6,player.level));add("Behind the door, a skeleton lies beside a suitcase containing a strip of Cloth.","reward");return true;}
  }),
  {title:"THE WALKING PEDDLER",minLevel:1,maxLevel:50,exclusive:true,text:"Old Pete pedals a bicycle loaded with tins and pots. His sign reads: PETE'S EMPORIUM — IF I AIN'T GOT IT, YOU DON'T NEED IT.",prompt(){const d=player.flags.r18PeteRepaired?1:0,stock=r18PeteStock();return `BUY APPLE FOR ${4-d} BOLTS   BUY CARROT FOR ${4-d} BOLTS   BUY RATION FOR ${6-d} BOLTS${stock.potato?`   BUY POTATO FOR ${4-d} BOLTS`:""}${stock.equipment&&!stock.equipment.sold?`   BUY ${stock.equipment.name.toUpperCase()} FOR ${stock.equipment.price} BOLTS`:""}   BUY BANDAGE FOR 8 BOLTS   BUY WIRE FOR 5 BOLTS   BUY SCRAP FOR 5 BOLTS${player.flags.r18PeteCompassSold?"":"   BUY COMPASS FOR 45 BOLTS"}   SELL ONE SCRAP FOR 3 BOLTS   SELL ONE WIRE FOR 2 BOLTS   REPAIR BICYCLE   TALK TO PETE   ASK FOR RUMORS   BACK AWAY`;},resolve(cmd){
    const f=player.flags,discount=f.r18PeteRepaired?1:0;f.r18PeteMet=true;
    if(cmd.includes('buy')){const stock=r18PeteStock(),eq=stock.equipment;if(eq&&!eq.sold&&cmd.startsWith('buy '+eq.name.toLowerCase()+' for ')){if(!roadTrade(eq.name,eq.type,eq.price))return false;eq.sold=true;add('Pete hands you '+eq.name+'.','reward');return true;}let item=cmd.includes('potato')&&stock.potato?'Fresh Potato':cmd.includes('apple')?'Fresh Apple':cmd.includes('carrot')?'Fresh Carrot':cmd.includes('ration')?'Energy Bars':cmd.includes('bandage')?'Bandage':cmd.includes('wire')?'Wire':cmd.includes('scrap')?'Scrap Metal':cmd.includes('compass')?'Old World Pocket Compass':null;if(!item)return false;if(item==='Old World Pocket Compass'&&f.r18PeteCompassSold){add('Pete already sold his one compass.','system');return false;}const type=item==='Old World Pocket Compass'?'valuable':['Wire','Scrap Metal'].includes(item)?'material':'consumable',cost=item==='Old World Pocket Compass'?45:item==='Bandage'?8:['Wire','Scrap Metal'].includes(item)?5:(item==='Energy Bars'?6:4)-discount;if(!roadTrade(item,type,cost))return false;if(item==='Old World Pocket Compass')f.r18PeteCompassSold=true;add('Pete counts '+cost+' Bolts and hands you '+item+'.','reward');return true;}
    if(cmd.includes('sell')){const wire=cmd.includes('wire'),name=wire?'Wire':'Scrap Metal',price=wire?2:3;if(!hasItem(name)){add('You have no '+name+' to sell.','system');return false;}if(findItem(name)?.stolen&&r18SaleDetected(findItem(name),'Old Pete'))return true;if(!removeItem(name))return false;gainBolts(price);add('Pete pays '+price+' Bolts for '+name+'.','reward');return true;}
    if(cmd.includes('rumor')){add(f.r18Station?'PETE > You found that dirt path? Evelyn knows more about radios than anyone I have met.':f.r18Ash?'PETE > The families at Ash Cemetery have been waiting a long time for answers.':"PETE > Listen to travelers. Sometimes a broken radio has more to say than the person carrying it.",'bright');return true;}
    if(cmd.includes('repair')){if(f.r18PeteRepaired){add('The bicycle repair is still holding.','system');return true;}if(!hasItem('Wire')){add('The bicycle repair needs one Wire.','system');return false;}if(!removeItem('Wire'))return false;f.r18PeteRepaired=true;gainXp(Math.max(6,player.level*2));add('You repair the bicycle. Pete promises a one-Bolt discount on his food.','bright');return true;}
    if(cmd.includes('talk')){add(f.r18PeteTalked?'PETE > Still got everything you need. Probably.':'PETE > If I ain’t got it, you don’t need it. Keep your socks dry and your arguments short.','bright');f.r18PeteTalked=true;return true;}
    if(cmd.includes('back')||cmd.includes('away')){add('Pete pedals off down the highway.');return true;}return false;
  }},
  beginnerEvent("DUST OVER THE SCHOOLYARD","A herd of deer moves among the old swings. A fawn is tangled in chain-link; its mother watches nearby.",{
    "FREE THE FAWN":()=>{add("You carefully untangle the fawn. It hurries back to its mother.");if(!player.flags.r18FawnFreed){player.flags.r18FawnFreed=true;gainXp(Math.max(8,player.level*2));}return true;},
    "SEARCH THE SCHOOLYARD":()=>{if(player.flags.r18SchoolCache){add("The lunchbox has already been searched.","system");return true;}r18RetainRoadReward("Preserved Vegetables","consumable");player.flags.r18SchoolCache=true;add("You find preserved vegetables in a sealed lunchbox.","reward");return true;},
    "HUNT AN ADULT DEER":()=>{const level=Math.max(1,Math.min(50,Number(player.level)||1));add("An adult deer turns and charges as you approach.","danger");startCombat({name:"SCHOOLYARD DEER",level,hp:Math.max(18,Math.floor(baseHpForLevel(level)*.22)),min:2,max:6,xp:Math.max(20,level*5),bolts:0,r18SchoolDeer:true,end:"The deer falls among the empty swings."},"encounter");return true;},
    "APPROACH THE BUCK":()=>{if(Math.random()<.5){add("The buck watches you, then leads the herd away.");return true;}const level=Math.max(1,Math.min(50,Number(player.level)||1));add("The buck lowers its antlers and charges.","danger");startCombat({name:"SCHOOLYARD BUCK",level,hp:Math.max(24,Math.floor(baseHpForLevel(level)*.3)),min:3,max:7,xp:Math.max(24,level*6),bolts:0,r18SchoolDeer:true,end:"The buck falls near the fence."},"encounter");return true;}
  })
];
encounters.push(...beginnerAdditions);

return {beginnerAdditions};

},
// END beginner

// BEGIN courier — formerly app.js
courier(){
encounters.push({title:'MILES THE COURIER',exclusive:true,text:"A dusty courier with a mailbag walks the shoulder. He introduces himself as Miles 'Postman' Carter.",
 prompt(){return (player.flags.r18MilesLetter!=='delivered'&&player.pack.some(i=>i.name==='Lost Letter for Miles'&&i.type==='quest'&&i.qty>0)?'GIVE MILES HIS LETTER   ':'')+(r18CourierState().phase==='new'?'ACCEPT DELIVERY JOB   ':'')+'TALK TO MILES   BACK AWAY';},
 resolve(cmd){if(cmd==='accept delivery job'){r18CourierStart();return true;}if(cmd.includes('back')||cmd.includes('away')){add('Miles waves and continues along the road.');return true;}
  if(cmd.includes('letter')){const f=player.flags,i=player.pack.find(i=>i.name==='Lost Letter for Miles'&&i.type==='quest'&&i.qty>0);if(f.r18MilesLetter==='delivered'||!i){add('You have no letter to deliver to Miles.','system');return true;}i.qty--;if(i.qty<=0)player.pack=player.pack.filter(x=>x!==i);updateHud();f.r18MilesLetter='delivered';const vest=r18PostmanVestName(player.level);r18RetainRoadReward(vest,'armor');add("Miles reads the address. 'Oh my God! It's from my sister!' He gives you his spare Postman's Vest in thanks.",'reward');return true;}
  if(cmd.includes('talk')){add("Miles adjusts his mailbag. 'People still need their letters. Someone's got to get them through.'");return true;}return false;}});



},
// END courier

// BEGIN combat — formerly app.js
combat(){
const encounterLevels={"THE STRAY":2,"THE BIG MAN":50,"HIGHWAY ROBBERS":4,"ROACH NEST":1,"TUNNEL RATS":2,"FERAL DOG":3,"LONE SCAVENGER":3,"GANG LOOKOUT":4,"THE CRAWLER":5,"SECURITY DRONE":5,"THE WRECKERS":5,"SOMETHING IN THE DRAIN":6};
const combatSpecs={
  "SALT ON THE ROAD":{name:"CHAIR MAN",level:4,hp:32,min:5,max:9,xp:30,bolts:0,end:"The angry man retreats, shouting that the chair was his."},
  "THE STRAY":{name:"THE STRAY",level:2,hp:20,min:2,max:5,xp:22,bolts:6,end:"The scavenger finally breaks and runs, dropping a small pouch behind."},
  "TUNNEL RATS":{name:"TUNNEL RATS",level:2,hp:24,min:3,max:6,xp:22,bolts:0,r18TunnelRat:true,end:"The last of the rats scatters into the drain."},
  "FERAL DOG":{name:"FERAL DOG",level:3,hp:22,min:4,max:8,xp:24,bolts:0,end:"The dog finally backs away and disappears into the brush."},
  "LONE SCAVENGER":{name:"SCAVENGER",level:3,hp:26,min:4,max:8,xp:25,bolts:8,end:"The scavenger gives ground and finally bolts into the weeds."},
  "HIGHWAY ROBBERS":{name:"HIGHWAY ROBBERS",level:4,hp:30,min:5,max:9,xp:24,bolts:9,enemies:[{name:"TIRE IRON ROBBER",hp:16,bolts:4},{name:"SPEAR ROBBER",hp:14,bolts:5}],end:"Both robbers are defeated."},
  "THE CRAWLER":{name:"TERRITORIAL SURVIVOR",level:5,hp:34,min:6,max:10,xp:30,bolts:6,end:"The survivor drops his knife and retreats beneath the wreck."},
  "THE WRECKERS":{name:"WRECKERS",level:5,hp:36,min:6,max:10,xp:32,bolts:10,end:"The wreckers decide this stopped being easy and run."},
  "ROACH NEST":{name:"ROACH SWARM",level:1,hp:14,min:1,max:4,xp:25,bolts:8,end:"The surviving roaches vanish beneath the wreck."},
  "GANG LOOKOUT":{name:"GANG LOOKOUT",level:4,hp:18,min:5,max:9,xp:35,bolts:5,signalRounds:0,reinforcementsArrived:false,enemies:[{name:"LOOKOUT",hp:18,bolts:5}],end:"The gang lookout is defeated."},
  "SECURITY DRONE":{name:"SECURITY DRONE",level:5,hp:32,min:5,max:10,xp:30,bolts:7,end:"The drone gives one last electronic whine and goes dark."},
  "SOMETHING IN THE DRAIN":{name:"DRAIN CREATURE",level:6,hp:38,min:7,max:11,xp:34,bolts:9,end:"The scraping stops. Whatever was in the drain is no longer moving."}
};
const combatTriggers={"SALT ON THE ROAD":["sit","scatter"],"ROACH NEST":["crush"],"GANG LOOKOUT":["rush"],"SECURITY DRONE":["smash"],"SOMETHING IN THE DRAIN":["open"]};

return {encounterLevels, combatSpecs, combatTriggers};

},
// END combat

// BEGIN rework — formerly stabilization.js
rework(){
const R5_ROAD_REWORK={
 'THE HOLLOW STATUE':{options:['TALK TO CLARA','ASK ABOUT DANIEL','SEARCH THE STATUE','BACK AWAY'],run(n){
  const f=player.flags;if(n<2&&f.r18DanielQuest==='done'){add('Clara and Daniel have left together for a safer road.','system');return true;}if(n<2)f.r18DanielQuest='active';if(n===0){add('Clara Bennett is searching the road for her missing brother, Daniel.','bright');if(!f.r18ClaraMet){f.r18ClaraMet=true;gainXp(Math.max(6,player.level));}return true;}
  if(n===1){f.r18ClaraMet=true;add('CLARA > Daniel went toward the Factory. I have not seen him since.','system');return true;}
  if(f.r18ClaraStatueSearched){add('The statue has already been searched.','system');return true;}r18RetainRoadReward('Electronics','material');f.r18ClaraStatueSearched=true;add('Inside the statue you find a small Electronics component.','reward');return true;
 }},
 'THE HANGING CAGE':{options:['INSPECT THE CAGES','INTERROGATE SILAS','RELEASE SILAS','OPEN THE GEAR CHEST','FIGHT SILAS','BACK AWAY'],run(n){
  const f=player.flags;if(n===0){add('One cage contains a gear chest. In the other, Silas Crowe asks to be let down.','system');return true;}
  if(n===1){if(f.r18SilasOutcome){add('Silas is no longer in the cage.','system');return true;}add('Silas admits to robbery but says he also helped captives escape. The evidence leaves his motives uncertain.','bright');if(!f.r18SilasQuestioned){f.r18SilasQuestioned=true;gainXp(Math.max(5,player.level));}return true;}
  if(n===3)return r18SilasChest();
  if(f.r18SilasOutcome){add('Silas is no longer in the cage.','system');return true;}
  if(n===2){f.r18SilasOutcome='released';gainXp(Math.max(8,player.level*2));add('You lower the cage and release Silas. He thanks you and heads down the road.','bright');return true;}
  const level=Math.max(1,Math.min(50,Number(player.level)||1));add('Silas breaks free and draws a knife.','danger');startCombat({name:'SILAS CROWE',level,hp:Math.max(22,Math.floor(baseHpForLevel(level)*.28)),min:3,max:6,xp:Math.max(22,level*6),bolts:5,r18SilasFight:true,end:'Silas falls beside the gantry.'},'encounter');return true;
 }},
 'THE PAPER STORM':{options:['READ COURT RECORDS','EXAMINE THE WANTED POSTER','SEARCH THE PAPERS','BACK AWAY'],run(n){
  if(n===0){add('The records describe an old robbery and a death, but the pages disagree about what happened.','system');return true;}
  if(n===1){add('A faded wanted poster names Elias “Red” Harper. The charges are old; the truth is less clear.','bright');if(!player.flags.r18RedPosterSeen){player.flags.r18RedPosterSeen=true;gainXp(Math.max(6,player.level));}return true;}
  r18RetainRoadReward('Cloth','material');add('You recover a dry scrap of Cloth caught beneath the papers.','reward');return true;
 }},
 'THE MUD CANNON':{options:['TALK DOWN THE BOMBER','SNEAK PAST THE BOMBER','SHOOT THE EXPLOSIVE SATCHEL','FIGHT THE BOMBER','BACK AWAY'],run(n){
  if(n===0&&Math.random()<.45){add('The bomber calms down and shares a weathered plan and spare components.','bright');r18PowderAward(true);gainXp(Math.max(6,player.level));return true;}
  if(n===1&&Math.random()<.6){add('You slip past while the bomber argues with a dud grenade.','bright');gainXp(Math.max(6,player.level));return true;}
  let weakened=false;if(n===2){const weapon=(typeof GEAR!=='undefined'&&GEAR[player.weapon]?.subtype?GEAR[player.weapon]:EQUIPMENT_CATALOG.find(e=>e.name===player.weapon));if(!weapon||!/rifle|revolver|pistol|shotgun|crossbow|smg/i.test(weapon.subtype||'')){add('Equip a ranged weapon to shoot the satchel.','system');return false;}weakened=true;add('The satchel bursts. The bomber abandons the explosives and draws a knife.','danger');}
  if(n===0||n===1)add('The bomber notices you and reaches for a weapon.','danger');const level=Math.max(1,Math.min(50,Number(player.level)||1));startCombat({name:weakened?'POWDER MONKEY WITH KNIFE':'THE POWDER MONKEY',level,hp:Math.max(18,Math.floor(baseHpForLevel(level)*.2)),min:weakened?2:4,max:weakened?4:8,xp:Math.max(22,level*6),bolts:4,r18PowderBlueprint:true,r18PowderSatchelShot:weakened,r18PowderGrenadePending:!weakened,end:'The bomber drops the weapon and leaves the road.'},'encounter');return true;
 }},
 'THE BURNT LIBRARY':{options:['SEARCH MEDICAL BOOKS','SEARCH MECHANICAL BOOKS','SEARCH CHILDRENS BOOKS','BACK AWAY'],run(n){
  const f=player.flags;if(f.r18LibraryResolved){add('The surviving recipe shelves have already been searched.','system');return true;}
  if(n===2){r18RetainRoadReward('Cloth','material');add('The children’s shelf holds a drawing and a usable piece of Cloth.','reward');return true;}
  if(typeof r11Learned!=='function'||!f.r11Learned){if(typeof r11Migrate==='function')r11Migrate();}
  const key=n===0?'bandage':Object.keys(CRAFT_RECIPES).find(k=>CRAFT_RECIPES[k].type==='weapon'&&GEAR[CRAFT_RECIPES[k].name]?.rarity==='rare'&&typeof r11Learned==='function'&&!r11Learned(k));
  if(key&&CRAFT_RECIPES[key]&&typeof r11Learned==='function'&&!r11Learned(key)){f.r11Learned=f.r11Learned||{};f.r11Learned[key]=true;add('BLUEPRINT LEARNED — '+CRAFT_RECIPES[key].name,'reward');}
  else{r18RetainRoadReward(n===0?'Bandage':'Electronics',n===0?'consumable':'material');add('The useful plans are already familiar; you recover supplies instead.','reward');}
  f.r18LibraryResolved=true;gainXp(Math.max(10,player.level*2));return true;
 }},
 'THE FENCE ARTIST':{options:['TALK TO ENID','HELP WITH SCRAP METAL','DISMANTLE THE SCULPTURE','BACK AWAY'],run(n){
  const f=player.flags;if(f.r18EnidSculptureLost){add('The scrap bird is gone. Enid has left the fence.','system');return true;}
  if(n===0){add('ENID > If you ever find a job for me, let me know. I used to make things people needed.','bright');if(!f.r18EnidMet){f.r18EnidMet=true;gainXp(Math.max(5,player.level));}return true;}
  if(n===1){if(f.r18EnidLanternPromised){add('Enid has already set your scrap lantern aside.','system');return true;}if(!hasItem('Scrap Metal')){add('Enid needs one Scrap Metal to finish her work.','system');return false;}if(!removeItem('Scrap Metal'))return false;f.r18EnidMet=true;f.r18EnidLanternPromised=true;if(typeof portRecruitUnlocked==='function')portRecruitUnlocked();gainXp(Math.max(8,player.level*2));add('Enid thanks you and sets a small scrap lantern aside for you.','bright');return true;}
  r18RetainRoadReward('Scrap Metal','material');f.r18EnidSculptureLost=true;add('You take a section of the scrap bird. Enid leaves the damaged sculpture behind.','system');return true;
 }},
 'THE BONE COLLECTOR':{options:['ASK ABOUT THE TROPHIES','SELL SMALL BONES FOR 2 BOLTS','SELL ANIMAL BONES FOR 4 BOLTS','SELL RAW MEAT FOR 3 BOLTS','FIGHT THE COLLECTOR','BACK AWAY'],run(n){
  if(n===0){add('The hunter displays human bones as trophies, but warns you that larger animals nest beyond the road.','danger');return true;}
  if(n>=1&&n<=3){const names=n===1?['Small Animal Bones']:n===2?['Animal Bones','Large Animal Bones']:['Raw Rat Meat','Raw Wolf Meat','Raw Bird Meat','Raw Boar Meat','Raw Chicken Meat','Raw Snake Meat','Raw Rabbit Meat','Raw Venison'];const item=player.pack.find(i=>names.includes(i.name)&&i.type==='material'&&i.qty>0&&!i.protected&&!i.unique);if(!item){add('You have none of the requested animal materials to trade.','system');return false;}if(item.stolen&&r18SaleDetected(item,'Bone Collector'))return true;item.qty--;if(item.qty===0)player.pack=player.pack.filter(i=>i!==item);const price=n===1?2:n===2?4:3;gainBolts(price);updateHud();add('The collector pays '+price+' Bolts for '+item.name+'.','reward');return true;}
  const level=Math.max(1,Math.min(50,(Number(player.level)||1)+1));startCombat({name:'THE BONE COLLECTOR',level,hp:Math.max(28,Math.floor(baseHpForLevel(level)*.35)),min:4,max:8,xp:Math.max(28,level*8),bolts:10,end:'The hunter falls among the trophies.'},'encounter');return true;
 }},
 'THE GATELESS WALL':{options:['ASK THE GUARDS','PAY TEN BOLTS','SNEAK AND SABOTAGE THE GUN','FIND A BREACH','FIGHT THE GUARDS','BACK AWAY'],run(n){
  if(n===0){add('The guards say the wall is their toll post, not a route to any town.','system');return true;}
  if(n===1){if(player.bolts<10){add('The toll is ten Bolts. You do not have enough.','system');return false;}player.bolts-=10;updateHud();add('You pay ten Bolts and the guards let you pass.');return true;}
  if(n===3){add('You find a safe breach and continue along the same road.','bright');gainXp(Math.max(5,player.level));return true;}
  const level=Math.max(1,Math.min(50,Number(player.level)||1)),hp=Math.max(15,Math.floor(baseHpForLevel(level)*.18)),sabotaged=n===2&&Math.random()<.6;
  if(n===2)add(sabotaged?'You disable the machine gun before the guards spot you.':'The gunner spots you before you can disable the weapon.','danger');
  const enemies=[{name:'MARKSMAN',hp,bolts:3},{name:'GUNNER',hp,bolts:3,r18WallGunner:true},...(!sabotaged?[{name:'MACHINE GUN',hp,bolts:0,r18WallGun:true}]:[])];startCombat({name:'WALL GUARDS',level,hp:enemies.reduce((sum,e)=>sum+e.hp,0),min:3,max:6,xp:Math.max(24,level*7),bolts:6,r18WallFight:true,enemies,end:'The surviving guards retreat from the wall.'},'encounter');return true;
 }},
 'THE ROAD EATER':{options:['SHUT DOWN THE CONTROLS','LURE IT INTO THE TUNNEL','FIGHT THE MACHINE','BACK AWAY'],run(n){
  if(n===0&&Math.random()<.5){add('You reach the emergency controls and shut down the tunneling machine.','bright');r18RoadEaterSalvage();gainXp(Math.max(8,player.level*2));return true;}
  if(n===1&&Math.random()<.55){add('The machine follows the vibration into a collapsed tunnel and grinds to a halt.','bright');r18RoadEaterSalvage();gainXp(Math.max(8,player.level*2));return true;}
  if(n!==2)add('The tunneling machine turns toward you.','danger');const level=Math.max(1,Math.min(50,Number(player.level)||1)),hp=Math.max(16,Math.floor(baseHpForLevel(level)*.18));startCombat({name:'THE ROAD EATER',level,hp:hp*3,min:4,max:8,xp:Math.max(30,level*8),bolts:0,r18RoadEater:true,enemies:[{name:'CUTTING WHEEL',hp,bolts:0},{name:'HYDRAULICS',hp,bolts:0},{name:'CONTROL UNIT',hp,bolts:0}],end:'The tunneling machine grinds to a halt.'},'encounter');return true;
 }},
 'THE SALT MINERS':{options:['SNEAK THE WORKERS FREE','PERSUADE THE GUARDS','FIGHT THE SALTMASTER','BACK AWAY'],run(n){
  if(player.flags.r18SaltWorkersFreed){add('The rescued workers have left the salt road.','system');return true;}
  if(n===0&&Math.random()<.6){add('You free the workers while the guards are distracted.','bright');r18FreeSaltWorkers();return true;}
  if(n===1&&Math.random()<.35){add('The guards accept your warning and abandon the sleds.','bright');r18FreeSaltWorkers();return true;}
  if(n!==2)add('The guards spot your attempt and move to stop you.','danger');
  const level=Math.max(1,Math.min(50,Number(player.level)||1)),hp=Math.max(16,Math.floor(baseHpForLevel(level)*.18));startCombat({name:'THE SALTMASTER AND OVERSEER',level,hp:hp*2,min:3,max:7,xp:Math.max(30,level*8),bolts:6,r18SaltGuards:true,enemies:[{name:'THE SALTMASTER',hp,bolts:3},{name:'OVERSEER',hp,bolts:3}],end:'The guards are defeated and the workers gather around the sleds.'},'encounter');return true;
 }},
 'THE GRINDER CREW':{options:['BUY SCRAP FOR 6 BOLTS','SELL SCRAP FOR 3 BOLTS','HELP THE CREW','SABOTAGE THE CRUSHER','BACK AWAY'],run(n){
  if(n===0){if(!roadTrade('Scrap Metal','material',6))return false;add('Rivet sells you Scrap Metal for six Bolts.','reward');return true;}
  if(n===1){if(!hasItem('Scrap Metal')){add('You have no Scrap Metal to sell.','system');return false;}if(findItem('Scrap Metal')?.stolen&&r18SaleDetected(findItem('Scrap Metal'),'Rivet'))return true;if(!removeItem('Scrap Metal'))return false;gainBolts(3);add('Rivet pays three Bolts for the Scrap Metal.','reward');return true;}
  if(n===2){add('You help Rivet clear a jammed feed belt.','bright');if(!player.flags.r18GrinderHelped){player.flags.r18GrinderHelped=true;gainXp(Math.max(8,player.level*2));}return true;}
  add('You interfere with the crusher. Rivet and a crew member move to stop you.','danger');const level=Math.max(1,Math.min(50,Number(player.level)||1)),hp=Math.max(15,Math.floor(baseHpForLevel(level)*.17));startCombat({name:'RIVET AND CREW',level,hp:hp*2,min:3,max:6,xp:Math.max(24,level*7),bolts:6,enemies:[{name:'RIVET',hp,bolts:3},{name:'CREW MEMBER',hp,bolts:3}],end:'Rivet and the crew member retreat from the crusher.'},'encounter');return true;
 }},
 'THE GARDEN GNOMES':{options:['INSPECT THE GNOMES','LOOK FOR SNARES','PROVOKE THE COLLECTOR','BACK AWAY'],run(n){
  if(n===0){add('Painted gnomes surround the house. The smallest is marked GERALD. A tall figure in a red pointed hat watches from the porch.','bright');if(!player.flags.r18GnomesSeen){player.flags.r18GnomesSeen=true;gainXp(Math.max(5,player.level));}return true;}
  if(n===1){add('You find thin lines connected to little bells among the gnomes and step around them.','system');return true;}
  if(player.flags.r18GnomeDefeated){add('The collector you faced is gone; the gnomes remain.','system');return true;}
  const level=Math.max(1,Math.min(50,Number(player.level)||1));add('The collector, dressed in a red hat and blue tunic with a white beard, raises a shovel and blocks your escape.','danger');startCombat({name:'THE GNOME COLLECTOR',level,hp:Math.max(30,Math.floor(baseHpForLevel(level)*.4)),min:3,max:7,xp:Math.max(30,level*8),bolts:0,r18NoRetreat:true,r18GnomeCollector:true,end:'The collector falls among the painted gnomes.'},'encounter');return true;
 }},
 'THE WARDEN':{options:['SNEAK PAST THE WARDEN','SUBMIT TO THE WARDEN','DECEIVE THE WARDEN','FIGHT THE WARDEN','BACK AWAY'],run(n){
  const w=r18WardenScene(),crime=player.flags.crime||player.flags.v52Crime||{};
  if(n===1){add(Number(crime.bounty)>0?'The Warden checks your name against a warrant and orders you off the road.':'The Warden checks your papers and orders you off the road.','system');return true;}
  if(n===0&&Math.random()<.5){add('You wait behind cover until the patrol passes.','bright');gainXp(Math.max(8,player.level*2));return true;}
  if(n===2&&Math.random()<.45){add('Your story satisfies the Warden, who waves you past.','bright');gainXp(Math.max(8,player.level*2));return true;}
  if(n===0||n===2)add('The Warden sees through your attempt and raises a rifle.','danger');
  const level=Math.max(1,Math.min(50,(Number(player.level)||1)+2));startCombat({name:'WARDEN '+w.id,level,hp:Math.max(36,Math.floor(baseHpForLevel(level)*.48)),min:5,max:10,xp:Math.max(40,level*11),bolts:15,armorDef:2,r18Enforcer:true,r18GuaranteeGear:true,r18WardenId:w.id,end:'The Warden falls beside the road.'},'encounter');return true;
 }},
 'THE RUST PARADE':{options:['JOIN THE PARADE','REPAIR THE FLOAT','ASK ABOUT THE VICTORY','SCAVENGE AROUND THE PARADE','BACK AWAY'],run(n){
  const f=player.flags;
  if(n===0){add(f.r18ParadeMet?'The trumpeter recognizes you and plays the same terrible fanfare.':'You join a scrapyard procession celebrating a victory nobody can quite remember. The trumpet sounds like a dying kettle.','bright');f.r18ParadeMet=true;if(!f.r18ParadeJoined){f.r18ParadeJoined=true;gainXp(Math.max(6,player.level));}return true;}
  if(n===1){if(f.r18ParadeFloatFixed){add('You already repaired their float; the repair still holds.','system');return true;}if(!hasItem('Scrap Metal')){add('The float needs one Scrap Metal.','system');return false;}if(!removeItem('Scrap Metal'))return false;f.r18ParadeFloatFixed=true;f.r18ParadeMet=true;if(!f.r18ParadeMedal){f.r18ParadeMedal=true;r18RetainRoadReward('Rust Parade Medal','valuable');}gainXp(Math.max(8,player.level*2));add('You repair the float. The trumpeter honors you with a truly terrible fanfare.','bright');return true;}
  if(n===2){add('Each marcher remembers a different victory. None remembers who won.','system');return true;}
  if(f.r18ParadeSalvage){add('The discarded parade supplies have already been searched.','system');return true;}r18RetainRoadReward('Cloth','material');f.r18ParadeSalvage=true;add('You recover discarded Cloth from behind the floats.','reward');return true;
 }},
 'THE BONE FLAGS':{options:['INSPECT FLAGS AND ENGAGE','FIGHT THE HUNTERS','BACK AWAY'],run(n){
  const found=n===0;if(found)add('You spot a concealed snare beneath the bone flags before the hunters emerge.','bright');else add('Two hunters move into position above the ravine.','danger');
  const level=Math.max(1,Math.min(50,Number(player.level)||1)),hp=Math.max(15,Math.floor(baseHpForLevel(level)*.17));startCombat({name:'THE BONE HUNTERS',level,hp:hp*2,min:3,max:6,xp:Math.max(24,level*7),bolts:6,r18BoneHunters:true,r18BoneKnowledge:found,r18BoneSnareAvailable:found,enemies:[{name:'RAVINE ARCHER',hp,bolts:3},{name:'BONE SPEARMAN',hp,bolts:3}],end:'The hunters abandon the ravine.'},'encounter');return true;
 }},
 'THE DRY FOUNTAIN':{options:['ASK ABOUT THE EMPLOYER','INTIMIDATE THE ENFORCER','SNEAK PAST THE ENFORCER','FIGHT THE ENFORCER','BACK AWAY'],run(n){
  if(n===0){add('The armored mercenary says the contract pays to control the road. A Dominion insignia has been scraped off the vest.','system');return true;}
  if(n===1&&Math.random()<.3){add('The mercenary decides the contract is not worth a fight and lets you pass.','bright');gainXp(Math.max(6,player.level));return true;}
  if(n===2&&Math.random()<.6){add('You use the dry fountain as cover and slip past.','bright');gainXp(Math.max(6,player.level));return true;}
  if(n===1||n===2)add('The mercenary notices and raises a weapon.','danger');
  const level=Math.max(1,Math.min(50,Number(player.level)||1));const names=['ROAD ENFORCER','ARMORED MERCENARY','CONTRACT ENFORCER'];startCombat({name:names[Math.floor(Math.random()*names.length)],level,hp:Math.max(28,Math.floor(baseHpForLevel(level)*.38)),min:4,max:8,xp:Math.max(28,level*9),bolts:8,armorDef:1,r18Enforcer:true,r18GuaranteeGear:true,end:'The mercenary drops their weapon and leaves the road.'},'encounter');return true;
 }},
 'THE MILK CRATES':{options:['QUESTION THE HUNTERS','DECEIVE THE HUNTERS','REFUSE TO ANSWER','FIGHT THE HUNTERS','BACK AWAY'],run(n){
  if(n===0){add('One hunter shows you a photograph. “We are looking for somebody. You seen them?” The other two keep their weapons ready.','system');return true;}
  if(n===1&&Math.random()<.6){add('Your directions send the hunters toward a distant road. They do not stop you.','bright');gainXp(Math.max(6,player.level));return true;}
  if(n===2&&Math.random()<.55){add('You refuse to answer and back away before the hunters can surround you.','system');return true;}
  if(n===1||n===2)add('The hunters close in when your answer does not satisfy them.','danger');
  const level=Math.max(1,Math.min(50,Number(player.level)||1)),hp=Math.max(14,Math.floor(baseHpForLevel(level)*.15));const enemies=[{name:'RIFLEMAN',hp:Math.max(10,Math.floor(hp*.8)),bolts:3,r18Min:3,r18Max:8},{name:'ENFORCER',hp:Math.ceil(hp*1.3),bolts:3,r18Min:2,r18Max:5},{name:'TRACKER',hp,bolts:3,r18Min:2,r18Max:4}];startCombat({name:'THE HIGHWAY HUNTERS',level,hp:enemies.reduce((sum,e)=>sum+e.hp,0),min:3,max:7,xp:Math.max(30,level*8),bolts:9,enemies,end:'The remaining hunters leave the road.'},'encounter');return true;
 }},
 'THE QUARRY LIFT':{options:['DROP THE SUSPENDED BEAM','INTIMIDATE THE GANG','FIGHT THE CHAIN GANG','BACK AWAY'],run(n){
  if(n===1&&Math.random()<.45){add('The gang decides you are not worth the trouble and backs away.','bright');gainXp(Math.max(6,player.level));return true;}
  const level=Math.max(1,Math.min(50,Number(player.level)||1)),hp=Math.max(14,Math.floor(baseHpForLevel(level)*.15));let beam=n===0&&Math.random()<.6;
  if(n===0)add(beam?'The beam crashes down and traps the Chain Swinger before the fight.':'The beam misses. All three gang members charge.','danger');
  const enemies=[{name:'HOOKMAN',hp:Math.ceil(hp*1.3),bolts:3,r18Min:3,r18Max:6},...(!beam?[{name:'CHAIN SWINGER',hp,bolts:3,r18Min:2,r18Max:5}]:[]),{name:'STRANGLER',hp:Math.max(10,Math.floor(hp*.8)),bolts:3,r18Min:2,r18Max:4}];
  startCombat({name:'THE CHAIN GANG',level,hp:enemies.reduce((sum,e)=>sum+e.hp,0),min:3,max:7,xp:Math.max(28,level*8),bolts:enemies.length*3,r18ChainGang:true,enemies,end:'The surviving chain gang members abandon the quarry.'},'encounter');if(n===0&&!beam&&typeof combatState!=='undefined'&&combatState?.r18ChainGang){add('The failed beam drop gives the gang the first exchange.','danger');combatRetaliation(combatState);}return true;
 }},
 'THE KNIFE WIND':{options:['CHALLENGE LEADER TO DUEL','SHOOT THE LEAKING MOTORCYCLE','PAY TEN BOLTS','SNEAK PAST','FIGHT BOTH REAPERS','BACK AWAY'],run(n){
  const level=Math.max(1,Math.min(50,Number(player.level)||1)),hp=Math.max(18,Math.floor(baseHpForLevel(level)*.2));
  if(n===2){if(player.bolts<10){add('The Reapers demand ten Bolts. You cannot pay.','system');return false;}player.bolts-=10;updateHud();add('The Reapers take ten Bolts and let you pass.');return true;}
  if(n===3){if(Math.random()<.65){add('You slip past the motorcycle while the Reapers argue.','bright');gainXp(Math.max(6,level));return true;}add('The Chain Rider spots you before you reach cover.','danger');}
  if(n===1){const weapon=(typeof GEAR!=='undefined'&&GEAR[player.weapon]?.subtype?GEAR[player.weapon]:EQUIPMENT_CATALOG.find(e=>e.name===player.weapon));if(!weapon||!/rifle|revolver|pistol|shotgun|crossbow|smg/i.test(weapon.subtype||'')){add('Equip a ranged weapon before shooting the leaking motorcycle.','system');return false;}add('You shoot the leaking fuel. The Chain Rider abandons the burning motorcycle.','danger');}
  const duel=n===0||n===1;if(n===0)add('The leader accepts your challenge. The Chain Rider steps back to honor the duel.','bright');
  if(duel)startCombat({name:'ROAD REAPER LEADER',level,hp:hp*2,min:3,max:7,xp:Math.max(24,level*7),bolts:6,end:'The leader yields. The Chain Rider lets you leave.'},'encounter');
  else startCombat({name:'THE ROAD REAPERS',level,hp:hp*2,min:3,max:7,xp:Math.max(30,level*8),bolts:8,enemies:[{name:'REAPER LEADER',hp,bolts:4,r18Min:3,r18Max:7},{name:'CHAIN RIDER',hp,bolts:4,r18Min:2,r18Max:5}],end:'The Reapers break off and leave the road.'},'encounter');return true;
 }},
 'THE TAR POOL':{options:['USE ROPE OR POLE','WADE TO SEALED CASE','SEARCH THE SHORELINE','BACK AWAY'],run(n){
  const f=player.flags;if(n===2){if(f.r18TarShore){add('The shoreline has already been searched.','system');return true;}r18RetainRoadReward('Scrap Metal','material');f.r18TarShore=true;add('You recover Scrap Metal from the cool shoreline.','reward');return true;}
  if(f.r18TarCase){add('The sealed case has already been recovered.','system');return true;}
  if(n===0){const rope=hasItem('Rope'),pole=/pipe|pole|staff/i.test(player.weapon||'')||hasItem('Rusted Pipe');if(!rope&&!pole){add('You need Rope or a suitable pole to reach the case.','system');return false;}add(rope?'You snag the case with Rope and recover the line.':'You hook the case with your pole.','bright');}
  if(n===1&&Math.random()<.45){roadHurt(6);add('The tar burns your leg. You pull back to solid ground without the case.','danger');return true;}
  r18RetainRoadReward('Electronics','material');f.r18TarCase=true;gainXp(Math.max(8,player.level*2));add('The sealed case holds dry Electronics.','reward');return true;
 }},
 'THE SHATTERED SILO':{options:['DISTRACT THE BOARS WITH FOOD','CLIMB THE OUTSIDE LADDER','SEARCH SILO SALVAGE','FIGHT THE BOARS','BACK AWAY'],run(n){
  if(n===0){const food=['Energy Bars','Fresh Apple','Fresh Carrot','Fresh Potato'].find(x=>hasItem(x));if(!food){add('You need food to distract the boars.','system');return false;}if(!removeItem(food))return false;add('You toss the food away from the silo and withdraw while the boars follow it.','bright');return true;}
  if(n===1){if(Math.random()<.3){roadHurt(6);add('A rung slips, but you pull yourself back to the ground.','danger');}else{gainXp(Math.max(6,player.level*2));add('You climb above the boars and reach a safe ledge.','bright');}return true;}
  if(n===2){if(player.flags.r18SiloSalvage){add('The silo cache has already been searched.','system');return true;}r18RetainRoadReward('Scrap Metal','material');player.flags.r18SiloSalvage=true;add('You recover usable Scrap Metal from the lower silo store.','reward');return true;}
  const level=Math.max(1,Math.min(50,Number(player.level)||1)),hp=Math.max(16,Math.floor(baseHpForLevel(level)*.18)),enemies=[{name:'SILO KING',hp:Math.ceil(hp*1.3),bolts:0,r18Min:3,r18Max:6},{name:'RAZORBACK',hp:Math.ceil(hp*.85),bolts:0,r18Min:2,r18Max:5},{name:'YOUNG BOAR',hp:Math.ceil(hp*.75),bolts:0,r18Min:1,r18Max:3}];startCombat({name:'SILO KING AND BOARS',level,hp:enemies.reduce((sum,e)=>sum+e.hp,0),min:3,max:7,xp:Math.max(30,level*9),bolts:0,r18SiloBoars:true,r18NoRetreat:true,enemies,end:'The silo falls quiet after the boars are defeated.'},'encounter');return true;
 }},
 'THE CRANE NEST':{options:['WATCH THE BIRDS','SEARCH THE NEST','FIGHT THE BIRDS','BACK AWAY'],run(n){
  if(n===0){add('Two large birds circle the crane, diving whenever you approach their nest.','system');return true;}
  if(n===1){if(player.flags.r18CraneNestLooted){add('The shiny scraps have already been taken from this nest.','system');return true;}if(Math.random()<.5){roadHurt(4);add('A bird clips you as you reach the cab. You pull back without the nest salvage.','danger');return true;}r18RetainRoadReward('Wire','material');player.flags.r18CraneNestLooted=true;gainXp(Math.max(6,player.level*2));add('You recover a shiny piece of Wire from the nest.','reward');return true;}
  const level=Math.max(1,Math.min(50,Number(player.level)||1)),hp=Math.max(12,Math.floor(baseHpForLevel(level)*.14));startCombat({name:'CRANE NEST BIRDS',level,hp:hp*2,min:2,max:5,xp:Math.max(20,level*6),bolts:0,r18CraneBirds:true,enemies:[{name:'DIVING BIRD',hp,bolts:0,r18Min:2,r18Max:5},{name:'NEST GUARD',hp,bolts:0,r18Min:1,r18Max:4}],end:'The birds fall silent around the crane.'},'encounter');return true;
 }},
 'THE RAIN BARREL':{options:['HARVEST GREENHOUSE PLANTS','SIFT THE MARBLES','REPAIR IRRIGATION','TAKE THE GROWERS FOOD','LEAVE THE FOOD','BACK AWAY'],run(n){
  const f=player.flags;
  if(n===0){const g=typeof lanternState==='function'?lanternState():null,scene=g?.sceneId||`${typeof day==='undefined'?1:day}:${typeof dailyRoadTurns==='undefined'?0:dailyRoadTurns}:${typeof roadGoal==='undefined'?'road':roadGoal}:${typeof roadTurn==='undefined'?0:roadTurn}`;if(f.r18GreenhouseHarvestScene===scene){add('You have already harvested this greenhouse visit.','system');return true;}f.r18GreenhouseHarvestScene=scene;const name=Math.random()<.5?'Fresh Apple':'Fresh Carrot';r18RetainRoadReward(name,'consumable');if(f.r18GreenhouseRepaired){r18RetainRoadReward(name==='Fresh Apple'?'Fresh Carrot':'Fresh Apple','consumable');add('The restored irrigation supports a second piece of produce.','reward');}if(Math.random()<.25){r18RetainRoadReward('Wild Honey','consumable');add('A small honeycomb has been stored in a sealed jar.','reward');}add('You harvest '+name+' and leave the rest of the plants growing.','reward');return true;}
  if(n===1){r18RetainRoadReward('Wire','material');add('A waterproof repair kit lies beneath the marbles in the rain barrel.','reward');return true;}
  if(n===2){if(f.r18GreenhouseRepaired){add('The irrigation repair you made is still holding.','system');return true;}if(!hasItem('Wire')){add('You need Wire to repair the irrigation line.','system');return false;}if(!removeItem('Wire'))return false;f.r18GreenhouseRepaired=true;gainXp(Math.max(8,player.level*2));add('You secure the leaking line. Water reaches the surviving plants again.','bright');return true;}
  if(n===3){r18RetainRoadReward('Fresh Potato','consumable');add('You take a potato from a crate marked for the greenhouse grower.','reward');return true;}
  add('You leave the grower’s food where it is.','bright');return true;
 }},
 'THE WELDED BUS':{options:['PLAY ALONG WITH THE ROUTE','ASK ABOUT THE SIRENS','FIGHT MR PICKENS','BACK AWAY'],run(n){
  if(n===2){const level=Math.max(1,Math.min(50,Number(player.level)||1));add('Mr. Pickens grips a tire iron and steps between you and the bus.','danger');startCombat({name:'MR PICKENS',level,hp:Math.max(20,Math.floor(baseHpForLevel(level)*.25)),min:2,max:6,xp:Math.max(18,level*5),bolts:0,r18Pickens:true,end:'Mr. Pickens drops the tire iron. The school bus falls quiet.'},'encounter');return true;}
  if(n===0)add('MR. PICKENS > Next stop, school! Tommy, stop eating the seats.\nA mannequin stares ahead with a mouthful of torn upholstery. Pickens tips his cap as you play along.','bright');
  else add('The smile fades. MR. PICKENS > The sirens started before I could get them home. I kept driving. Somebody had to keep driving.','bright');
  if(!player.flags.r18PickensResolved){player.flags.r18PickensResolved=true;gainXp(Math.max(8,player.level*2));}return true;
 }},
 'THE COIN WELL':{options:['INSPECT THE WELL ROPE','REINFORCE AND DESCEND','DESCEND CAREFULLY','BACK AWAY'],run(n){
  if(n===0){r18RetainRoadReward('Rope','material');add('You inspect the old well and recover a loose length of Rope from beside the rim.','reward');return true;}
  if(n===1&&!hasItem('Rope')){add('You need Rope to reinforce the descent. You can inspect the well for a loose length first.','system');return false;}
  r18RetainRoadReward('Rope','material');const risk=n===1?.12:.35;
  if(Math.random()<risk){roadHurt(4);add('The old footing gives way, but you climb back out with the loose Rope.','danger');}else{gainBolts(6+Math.floor(Math.random()*7));gainXp(Math.max(6,player.level*2));add('You climb back safely with a handful of old offerings and the loose Rope.','reward');}return true;
 }},
 'THE COLLAPSED DAM':{options:['CROSS THE CABLE','JUMP THE FRACTURE','FIND A SAFE PASSAGE','SEARCH MAINTENANCE STATION','BACK AWAY'],run(n){
  if(n===2){add('You trace a maintenance path around the broken spillway and avoid the surging water.','bright');gainXp(Math.max(4,player.level));return true;}
  if(n===3){r18RetainRoadReward('Wire','material');gainXp(Math.max(6,player.level*2));add('The maintenance station contains usable Wire.','reward');return true;}
  const rope=hasItem('Rope'),risk=n===0?(rope?.15:.35):.55;if(Math.random()<risk){roadHurt(n===0?5:9);add('A surge shifts the crossing. You pull clear, bruised but safe.','danger');}else{add(n===0&&rope?'You use your Rope as a safety line and recover it after crossing.':'You cross the fractured spillway before the water surges.','bright');gainXp(Math.max(6,player.level*2));}return true;
 }},
 'THE LAST ORCHARD':{options:['TAKE ONE APPLE','REINFORCE THE FENCE','HARVEST ALL APPLES','OFFER FOOD TO SCAVENGERS','PERSUADE SCAVENGERS','CONFRONT SCAVENGERS','BACK AWAY'],run(n){
  const f=player.flags, today=Number(day)||1;
  if(n===0||n===2){if(today<(Number(f.r18OrchardRegrowsDay)||0)){add(f.r18OrchardBare?'The branches are bare for now. The tree needs time to fruit again.':'The remaining fruit is reserved for other travelers. Check back in a few days.','system');return false;}const count=n===0?1:3;if(!addPack('Fresh Apple','consumable',count)){(f.r5LootQueue||(f.r5LootQueue=[])).push({name:'Fresh Apple',type:'consumable',qty:count});add('The apples await a backpack decision.','system');}f.r18OrchardRegrowsDay=today+(n===0&&f.r18OrchardFenceFixed?2:3);f.r18OrchardBare=n===2;if(f.r18OrchardFenceFixed)add('The repaired fence still protects the tree.','bright');add(n===0?'You take one apple and leave the rest for other travelers.':'You take the remaining apples, leaving bare branches for the next traveler.','reward');return true;}
  if(n===1){if(f.r18OrchardFenceFixed){add('The fence you reinforced is still holding.','system');return true;}const material=['Scrap Metal','Wire','Rope'].find(x=>hasItem(x));if(!material){add('Reinforcing the fence requires Scrap Metal, Wire, or Rope.','system');return false;}if(!removeItem(material))return false;f.r18OrchardFenceFixed=true;gainXp(Math.max(8,player.level*2));add('You mend the broken fence with '+material+'.','reward');return true;}
  if(n===3){const food=['Energy Bars','Fresh Apple','Fresh Carrot','Fresh Potato','Preserved Vegetables'].find(x=>hasItem(x));if(!food){add('You need food to share with the scavengers.','system');return false;}if(!removeItem(food))return false;add('Beyond the broken fence, two hungry scavengers accept the food and let you pass.','bright');}
  if(n===4)add('You persuade the two hungry scavengers to leave some fruit for travelers.','bright');
  if(n===5){const level=Math.max(1,Math.min(50,Number(player.level)||1)),hp=Math.max(15,Math.floor(baseHpForLevel(level)*.18));add('The two scavengers draw their weapons.','danger');startCombat({name:'ORCHARD SCAVENGERS',level,hp:hp*2,min:2,max:6,xp:Math.max(20,level*6),bolts:4,enemies:[{name:'HUNGRY SCAVENGER',hp,bolts:2},{name:'ORCHARD SCAVENGER',hp,bolts:2}],end:'The scavengers retreat from the orchard.'},'encounter');return true;}
  if(!f.r18OrchardStoryXp){f.r18OrchardStoryXp=true;gainXp(Math.max(6,player.level*2));}return true;
 }},
 'THE CINDER WOLVES':{options:['SCARE WITH FIRE OR NOISE','DISTRACT WITH FOOD','FIGHT THE PACK','BACK AWAY'],run(n){if(n===0){if(Math.random()<.65){add('You make noise until the wolves retreat into the trees.','bright');gainXp(Math.max(6,player.level*2));}else{add('The pack ignores the noise and closes around you.','danger');r18StartCinderWolves();}return true;}if(n===1){if(!hasItem('Energy Bars')){add('You need a ration to distract the wolves.','system');return false;}removeItem('Energy Bars');add('The pack follows the food while you withdraw.','system');gainXp(Math.max(6,player.level*2));return true;}r18StartCinderWolves();return true;}},
 'THE IRON CHOIR':{options:['SILENCE VALVES WITH ROPE','SNEAK PAST THE VALVES','RING THE VALVES','FIGHT THE RAIDERS','BACK AWAY'],run(n){
  if(n===0){if(!hasItem('Rope')){add('You need Rope to tie the valves.','system');return false;}if(!removeItem('Rope'))return false;}
  if((n===0&&Math.random()<.8)||(n===1&&Math.random()<.55)){add('You slip past the raiders while the valves stay quiet.','bright');r18ChoirSalvage();gainXp(Math.max(6,player.level*2));return true;}
  add(n===2?'You ring the valves deliberately and draw the raiders from cover.':'The raiders hear you among the hanging valves.','danger');
  const level=Math.max(1,Math.min(50,Number(player.level)||1)),hp=Math.max(15,Math.floor(baseHpForLevel(level)*.17)),opening=n===2?Math.min(hp-1,Math.max(1,rollDamage())):0;if(opening)add('Your ambush strikes the valve raider for '+opening+' damage before combat.','reward');startCombat({name:'IRON CHOIR RAIDERS',level,hp:hp*2-opening,min:3,max:6,xp:Math.max(24,level*7),bolts:6,r18ChoirRaiders:true,r18ChoirValveAvailable:n!==2,enemies:[{name:'VALVE RAIDER',hp:hp-opening,bolts:3},{name:'PATROL RAIDER',hp,bolts:3}],end:'The remaining raiders flee past the valves.'},'encounter');return true;
 }},
 'THE LIME FOG':{options:['COVER FACE WITH CLOTH','WAIT FOR THE WIND','SEARCH THE PLANT STASH','BACK AWAY'],run(n){if(n===0){if(!hasItem('Cloth')){add('You need Cloth to cover your face.','system');return false;}add('You hold Cloth over your face and cross before the cloud thickens.','bright');gainXp(Math.max(4,player.level));return true;}if(n===1){add('You wait until the wind thins the industrial dust.','system');return true;}if(!addPack('Wire','material'))return false;if(Math.random()<.4){roadHurt(6);add('The powder catches your throat before you reach clear air.','danger');}else add('You recover Wire from the plant stash before the wind shifts.','bright');gainXp(Math.max(7,player.level*2));return true;}},
 'THE DUST HORSES':{options:['CLEAR THE SNAGGED FENCE','CUT THE GUARDRAIL','REDIRECT THE HERD','SEARCH THE SADDLEBAG','BACK AWAY'],run(n){
  const f=player.flags;if(n===3){if(f.r18HorseSaddleClaimed){add('The dropped saddlebag has already been searched.','system');return true;}r18RetainRoadReward('Cloth','material');gainBolts(12);f.r18HorseSaddleClaimed=true;add('You recover Cloth and twelve Bolts from the saddlebag.','reward');return true;}
  if(n===1&&!hasItem('Tire Iron')&&!hasItem('Claw Hammer')&&!/pipe|wrench|hammer|iron/i.test(player.weapon||'')){add('You need a suitable tool to cut or bend the guardrail.','system');return false;}
  add(n===0?'You clear the tangled fence and the herd escapes the fire.':n===1?'You open a gap in the guardrail and the herd races through.':'You redirect the herd around the road obstruction.','bright');if(!f.r18HorseHerdHelped){f.r18HorseHerdHelped=true;gainXp(Math.max(8,player.level*2));}return true;
 }},
 'THE BLADE CART':{options:['DODGE BEHIND THE BARRIER','JAM THE WHEEL','SHOOT THE WHEEL','SALVAGE AFTER IT PASSES','BACK AWAY'],run(n){const catalog=(typeof GEAR!=='undefined'&&GEAR[player.weapon]?.subtype?GEAR[player.weapon]:EQUIPMENT_CATALOG.find(e=>e.name===player.weapon)),ranged=!!catalog&&/rifle|revolver|pistol|shotgun|crossbow|smg/i.test(catalog.subtype||'');if(n===2&&!ranged){add('Equip a ranged weapon before trying to shoot the wheel.','system');return false;}if(n===3&&!addPack('Scrap Metal','material'))return false;const chance=[.2,.35,.2,.1][n];if(Math.random()<chance){roadHurt([4,7,5,3][n]);add('A blade clips you as the cart rattles past.','danger');}else add(n===2?'You hit the wheel; the cart skids into the ditch. Benny shouts, “That was my good wheel!”':n===1?'You jam the wheel and the cart stops. Benny says, “I meant to do that.”':n===3?'After the cart passes, you gather a usable piece of Scrap Metal.':'You take cover until the runaway cart passes.','bright');gainXp(Math.max(5,player.level*2));return true;}},
 'THE BURIED FREIGHT':{options:['OPEN NORMAL CONTAINER','OPEN SEALED CONTAINER','OPEN BURIED CONTAINER','BACK AWAY'],run(n){const name=n===0?'Scrap Metal':n===1?'Bandage':'Electronics',type=n===1?'consumable':'material';if(!addPack(name,type))return false;const chance=[.1,.3,.55][n];if(Math.random()<chance){roadHurt([3,6,10][n]);add('The unstable cargo shifts as you recover the supplies.','danger');}else add('You recover the container supplies without disturbing the cargo above.','bright');gainXp(Math.max([5,10,16][n],player.level*[1,2,3][n]));return true;}},
 'THE RED RAIN':{options:['SPRINT TO SHELTER','COVER WITH ARMOR','PUSH THROUGH FOR SALVAGE','BACK AWAY'],run(n){if(n===0){if(Math.random()<.2){roadHurt(3);add('A splash catches your arm before you reach shelter.','danger');}else add('You reach concrete cover before the stinging rain.','system');return true;}const protectedGear=!!GEAR[player.armor]&&player.armor!=='Worn Jacket';if(n===1&&!protectedGear){add('Equip protective armor first, or choose another route.','system');return false;}if(n===2&&!addPack('Cloth','material'))return false;const chance=n===1?.15:.55;if(Math.random()<chance){roadHurt(n===1?3:8);add('Rusty industrial runoff stings exposed skin.','danger');}else add(n===1?'Your armor shields you from the worst of the runoff.':'You recover dry Cloth and escape the runoff.','bright');gainXp(Math.max(5,player.level*2));return true;}},
 'THE STEEL ORCHARD':{options:['TALK TO MARTHA','EXAMINE THE KEEPSAKES','INVITE MARTHA TO SOLACE','BACK AWAY'],run(n){
  const f=player.flags;if(f.r18MarthaSettled){add('Martha has left a note: the trees and their keepsakes will remain here while she opens her counter in Solace.','system');return true;}
  if(n===0){add('MARTHA > I make these trees for the people who cannot come back. I do miss people, though.','bright');if(!f.r18MarthaMet){f.r18MarthaMet=true;gainXp(Math.max(6,player.level));}return true;}
  if(n===1){add('Each metal tree holds small keepsakes and a name. Martha asks that you leave them where they are.','system');return true;}
  f.r18MarthaMet=true;f.r18MarthaSettled=true;add('You suggest Johnny’s shop in Solace. MARTHA > Maybe it is time I looked after people who are still here. I do miss people.','bright');add('Martha leaves a note at the orchard and heads to Solace to open her own counter.','reward');return true;
 }},
 'THE ASH PROCESSION':{options:['FOLLOW THE PROCESSION','HELP CARRY THE COFFIN','OBSERVE FROM THE ROAD','BACK AWAY'],run(n){
  const f=player.flags;
  if(n===0){if(typeof r18AshDiscover==='function')r18AshDiscover();add('Six ash-covered figures carry an empty coffin into the hills. At a weathered cemetery gate, an older undertaker checks a ledger while a frightened survivor stands apart. The group continues beyond your view.','bright');if(!f.r18AshProcessionSeen){f.r18AshProcessionSeen=true;gainXp(Math.max(8,player.level*2));}return true;}
  if(n===1){add('You help the mourners carry the empty coffin across a washout. One thanks you quietly before they continue toward the hills.','bright');if(!f.r18AshProcessionHelped){r18RetainRoadReward('Energy Bars','consumable');f.r18AshProcessionHelped=true;gainXp(Math.max(8,player.level*2));}return true;}
  add('You watch the six figures disappear into the ash, their empty coffin balanced between them.','system');return true;
 }},
 'THE IRON HARVEST':{options:['SHUT DOWN GUIDANCE SYSTEM','DISTRACT AND SNEAK','FIGHT THE COMBINE','BACK AWAY'],run(n){
  if(n===0&&Math.random()<.65){add('You reach the damaged guidance panel and shut down the engine.','bright');r18HarvestSalvage();gainXp(Math.max(8,player.level*2));return true;}
  if(n===1&&Math.random()<.7){add('You draw the combine away and slip past its spinning blades.','bright');return true;}
  if(n!==2)add('The damaged guidance system turns the machine toward you.','danger');
  const level=Math.max(1,Math.min(50,Number(player.level)||1)),hp=Math.max(10,Math.floor(baseHpForLevel(level)*.14)),enemies=[{name:'HARVEST BLADE',hp,bolts:0},{name:'DRIVE ASSEMBLY',hp,bolts:0},{name:'EXHAUST SYSTEM',hp,bolts:0}];startCombat({name:'DRIVERLESS COMBINE',level,hp:hp*3,min:3,max:8,xp:Math.max(25,level*7),bolts:0,r18HarvestMachine:true,enemies,end:'The combine grinds to a halt.'},'encounter');return true;
 }},
 'THE GLASS FIELD':{options:['CROSS CAREFULLY','TAKE THE SAFE DETOUR','CLEAR A PATH WITH TOOL','BACK AWAY'],run(n){if(n===1){add('You take a wide path around the jagged glass.','system');gainXp(Math.max(4,player.level));return true;}if(n===2&&!hasItem('Battered Flashlight')&&!hasItem('Claw Hammer')&&!hasItem('Tire Iron')){add('You need a suitable carried tool to clear the path.','system');return false;}if(!addPack(n===2?'Scrap Metal':'Bandage',n===2?'material':'consumable'))return false;const chance=n===2?.15:.35;if(Math.random()<chance){roadHurt(n===2?3:7);add('The glass shifts and catches you as you cross.','danger');}else add('You pass the broken glass without injury.','bright');gainXp(Math.max(7,player.level*2));return true;}},
 'THE BLACK SNOW':{options:['BUY TWO COINS FOR 110 BOLTS','HEAL THE SCAVENGER','THREATEN THE SCAVENGER','FIGHT THE SCAVENGER','SEARCH THE BURNING TRUCK','BACK AWAY'],run(n){
  if(n===4){if(player.flags.r18BlackSnowTruck){add('The truck has already been searched.','system');return true;}if(Math.random()<.4){roadHurt(5);add('Heat drives you away before you reach the supplies.','danger');return true;}r18RetainRoadReward('Bandage','consumable');player.flags.r18BlackSnowTruck=true;add('You recover a Bandage from the burning truck.','reward');return true;}
  if(player.flags.r18BlackSnowResolved){add('The scavenger and the coins are no longer here.','system');return true;}
  if(n===0){if(player.bolts<110){add('The scavenger asks 110 Bolts for both coins.','system');return false;}if(!addPack('Pre-War Silver Coin','valuable',2,true)){add('Free a backpack slot before trading. No Bolts spent.','system');return false;}player.bolts-=110;updateHud();player.flags.r18BlackSnowResolved=true;add('You buy both silver coins for 110 Bolts.','reward');return true;}
  if(n===1){if(!hasItem('Bandage')){add('You need a Bandage to help.','system');return false;}if(!removeItem('Bandage'))return false;r18BlackSnowCoins(1);gainXp(Math.max(8,player.level*2));add('The scavenger thanks you for the dressing.','bright');return true;}
  if(n===2&&Math.random()<.5){add('The scavenger hands over the coins rather than fight.','danger');r18BlackSnowCoins(2);return true;}
  add('The wounded scavenger draws a knife.','danger');r18BlackSnowFight();return true;
 }},
 'THE CHAIN BRIDGE':{options:['REINFORCE WITH ROPE','CROSS THE BRIDGE','SEARCH THE GORGE SHACK','BACK AWAY'],run(n){
  const f=player.flags;if(n===0){if(f.r18ChainBridgeReinforced){add('The Rope handline you installed is still secure.','system');return true;}if(!hasItem('Rope')){add('You need Rope to reinforce the bridge.','system');return false;}if(!removeItem('Rope'))return false;f.r18ChainBridgeReinforced=true;gainXp(Math.max(8,player.level*2));add('You secure the Rope as a permanent handline. It must stay in place to support the crossing.','reward');return true;}
  if(n===2){r18RetainRoadReward('Wire','material');gainXp(Math.max(5,player.level));add('You find Wire in a small shack above the gorge.','reward');return true;}
  if(Math.random()<(f.r18ChainBridgeReinforced?.1:.4)){roadHurt(7);add('A chain swings loose and catches your arm before you regain your footing.','danger');}else{add(f.r18ChainBridgeReinforced?'The secured handline steadies you across the bridge.':'You cross the swaying bridge carefully.','bright');gainXp(Math.max(5,player.level));}return true;
 }},
 'THE WAX MUSEUM':{options:['INSPECT THE DISPLAY','QUESTION THE CURATOR','STEAL THE SOLDIER ARMOR','FIGHT THE CURATOR','BACK AWAY'],run(n){
  if(n===0){add('The soldier wears real armor. Cracked wax reveals that the exhibits beneath it are human remains.','danger');return true;}
  if(n===1){add('CURATOR > They were forgotten outside. Here, they remain exactly as I found them.','danger');return true;}
  if(player.flags.r18WaxArmorClaimed){add('The soldier’s armor has already been recovered.','system');return true;}
  if(n===2&&!r18TheftAllowed())return false;if(n===2&&Math.random()<.5){add('You quietly free the soldier’s armor while the Curator is distracted.','bright');return r18WaxAward(true);}
  if(n===2){r18TheftCaught('The Curator');add('The Curator catches you touching the exhibit.','danger');}r18WaxFight();return true;
 }}
};
for(const e of [...encounters,...eastEncounters]){const row=R5_ROAD_REWORK[e.title];if(!row)continue;if(e.title==='THE LAST ORCHARD')e.text='A healthy apple tree stands behind a metal-spike fence. A sign reads: ONE APPLE PER TRAVELER. PLEASE LEAVE SOME FOR THE NEXT PERSON. Traveler notes hang beside a broken section of fence.';if(e.title==='THE WELDED BUS')e.text='An armored yellow school bus rests beside the road. Elderly Mr. Pickens checks a route sheet while mannequins occupy the seats.';if(e.title==='THE RAIN BARREL')e.text='Plants survive inside a ruined greenhouse. A rain barrel is full of glass marbles, and a nearby crate is marked for the grower.';if(e.title==='THE KNIFE WIND')e.text='A scythe-bearing road Reaper blocks the cut while his chain-armed partner waits beside a leaking motorcycle.';if(e.title==='THE MILK CRATES')e.text='Three armed hunters block the shoulder. One holds up a photograph and asks whether you have seen the person in it.';if(e.title==='THE QUARRY LIFT')e.text='Three chain-armed scavengers wait near a suspended steel beam above the quarry approach.';if(e.title==='THE DRY FOUNTAIN')e.text='An armored mercenary stands beside a dry fountain, controlling the road with a professional calm.';if(e.title==='THE GARDEN GNOMES')e.text='Painted garden gnomes face an empty window. Thin lines disappear beneath the smallest statue.';if(e.title==='THE WARDEN')e.text='A Dominion Warden in a mirrored visor watches the road, rifle held ready and a stun baton at their belt.';if(e.title==='THE FENCE ARTIST')e.text='An older metalworker named Enid weaves a giant scrap bird into a chain-link fence.';if(e.title==='THE HANGING CAGE')e.text='Two cages hang from a highway gantry. One contains a chest; the other holds a man calling himself Silas Crowe.';if(e.title==='THE STEEL ORCHARD')e.text='An elderly woman named Martha tends an orchard of metal trees hung with keepsakes.';if(e.title==='THE PAPER STORM')e.text='A gust scatters old court records and a faded wanted poster across the highway.';if(e.title==='THE SALT MINERS')e.text='Six enslaved workers drag salt sleds beneath the watch of the Saltmaster and an overseer.';if(e.title==='THE GRINDER CREW')e.text='Rivet and a salvage crew feed old vehicles into a hand-powered crusher.';if(e.title==='THE ROAD EATER')e.text='A pre-collapse tunneling machine breaks through the pavement, its cutting wheel grinding against the road.';if(e.title==='THE MUD CANNON')e.text='A jittery bomber with a satchel of explosives argues with a dud grenade beside the road.';if(e.title==='THE HOLLOW STATUE')e.text='A fallen concrete worker lies across the road. Clara Bennett searches nearby.';if(e.title==='THE BLACK SNOW')e.text='Ash drifts over fresh footprints leading to a wounded scavenger sheltering near a burning truck.';if(e.title==='THE GATELESS WALL')e.text='Two guards watch a toll post at a broken wall. One mans a mounted machine gun.';e.choices=row.options.join('   ');e.exclusive=true;e.resolve=function(cmd){const index=row.options.findIndex(n=>n.toLowerCase()===cmd);if(index<0)return false;if(index===row.options.length-1){add('You withdraw along the safe approach, leaving the scene untouched.','system');return true;}return row.run(index);};}
// The horse offer stays within this encounter until it is accepted or declined.
function r18HorseScene(){const g=typeof lanternState==='function'?lanternState():null,id=g?.sceneId||`${day}:${dailyRoadTurns}:${roadGoal}:${roadTurn}`;if(player.flags.r18HorseScene?.id!==id)player.flags.r18HorseScene={id,phase:'herd'};return player.flags.r18HorseScene;}
const r18HorseEncounter=eastEncounters.find(e=>e.title==='THE DUST HORSES');
if(r18HorseEncounter){r18HorseEncounter.prompt=function(){const q=r18HorseScene();return q.phase==='offer'?`${player.flags.r18HorseOwned?'LEAVE THE HORSE':'CALM THE HORSE   LEAVE THE HORSE'}`:R5_ROAD_REWORK['THE DUST HORSES'].options.join('   ');};r18HorseEncounter.resolve=function(cmd){const q=r18HorseScene(),f=player.flags;if(q.phase==='offer'){if(cmd==='leave the horse'){q.phase='done';add('The horse returns to the herd.','system');return true;}if(cmd==='calm the horse'&&!f.r18HorseOwned){q.phase='done';if(Math.random()<.4){f.r18HorseOwned=true;add('The horse accepts your hand. One free trip is available through Status.','reward');}else add('The horse shies away and runs after the herd.','system');return true;}return false;}const opts=R5_ROAD_REWORK['THE DUST HORSES'].options,i=opts.findIndex(x=>x.toLowerCase()===cmd);if(i<0)return false;if(i===opts.length-1){q.phase='done';add('You leave the herd to find its own way.','system');return true;}const ok=R5_ROAD_REWORK['THE DUST HORSES'].run(i);if(ok){q.phase=i===3?'done':'offer';if(q.phase==='offer')add('A brown horse lingers after the herd escapes.','bright');}return ok;};}

return {R5_ROAD_REWORK, r18HorseEncounter, r18HorseScene};

},
// END rework

// BEGIN discoveries — formerly stabilization.js
discoveries(){
const R5_DISCOVERIES={
 'THE CRACKED AQUEDUCT':['WATCH THE FALLING MORTAR','Falling grit reveals which arch is about to collapse.','Loose masonry strikes your back as you dive clear.','Wire',8],
 'THE FIGHTING RING':['WATCH A ROUND','The champion is tired, but still dangerous. Leaving the crowd is free.','The champion clips your jaw before you can withdraw.',null,8],
 'THE COLD FOUNDRY':['READ THE CASTING MARKS','The unfinished castings bear the same factory markings seen along the road.','An unstable casting topples and bruises your hip.','Scrap Metal',5],
 'THE FORGOTTEN ARENA':['READ THE OLD MATCH BOARD','The names on the board are long gone. Most armor below is rusted through.','A rotten bleacher breaks under you.','Scrap Metal',5],
};
for(const e of eastEncounters){const d=R5_DISCOVERIES[e.title];if(!d)continue;const action=e.choices.split(/\s{2,}/)[0];const choices=[d[0],action,'BACK AWAY'];e.choices=choices.join('   ');e.exclusive=true;e.resolve=function(cmd){const n=choices.findIndex(c=>c.toLowerCase()===cmd);if(n<0)return false;if(n===2){add('You take the safe way around. No reward, no injury.','system');return true;}if(n===0){add(d[1],'bright');gainXp(3);return true;}
 if(e.title==='THE GRINDER CREW'){if(!hasItem('Wire')){add('One Wire required. Nothing traded.','system');return false;}removeItem('Wire');addPack('Scrap Metal','material',2);add('The crew swaps two Scrap Metal for your Wire.','bright');return true;}
 if(e.title==='THE FIGHTING RING'||e.title==='THE CINDER WOLVES'){startCombat({name:e.title==='THE FIGHTING RING'?'RING CHAMPION':'CINDER WOLF',level:5,hp:42,min:6,max:10,xp:38,bolts:e.title==='THE FIGHTING RING'?18:0},'encounter');return true;}
 if(Math.random()<.35){add(d[2],'danger');hurt(d[4]);return true;}
 add(d[1]+' You use what you noticed to make a careful approach.','bright');if(d[3]){addPack(d[3],v52ItemType(d[3]));add('RECOVERED: '+d[3]+' from the remaining supplies.','reward');}else{gainBolts(6);add('A lost travel pouch contains six Bolts.','reward');}gainXp(9);return true;};}
function r18ScrapDuelScene(){const g=typeof lanternState==='function'?lanternState():null,scene=g?.sceneId||`${day}:${dailyRoadTurns}:${roadGoal}:${roadTurn}`,f=player.flags;if(f.r18ScrapDuelScene?.scene!==scene)f.r18ScrapDuelScene={scene,phase:'idle',stake:0,round:1,playerScore:0,opponentScore:0};return f.r18ScrapDuelScene;}
function r18ScrapDuelMenu(){const q=r18ScrapDuelScene(),f=player.flags,today=Number(day)||1;if(q.phase==='custom')return 'TYPE WAGER <AMOUNT> BOLTS (1–100)   CANCEL WAGER   BACK AWAY';if(q.phase==='confirm')return `CONFIRM ${q.stake} BOLT WAGER   CANCEL WAGER   BACK AWAY`;if(q.phase==='playing')return [`ROUND ${q.round} AIM 10`,`ROUND ${q.round} AIM 25`,`ROUND ${q.round} AIM 50`,'BACK AWAY'].join('   ');if(q.phase==='done'||today<(Number(f.r18ScrapDuelNextDay)||0))return 'WATCH THE CONTEST   CHALLENGE CHAMPION   BACK AWAY';return ['WATCH THE CONTEST','WAGER 10 BOLTS','WAGER 25 BOLTS','WAGER 50 BOLTS','WAGER 100 BOLTS','WAGER CUSTOM AMOUNT',...(player.bolts>0&&player.bolts<=100?['WAGER ALL IN']:[]),'CHALLENGE CHAMPION','BACK AWAY'].join('   ');}
const r18ScrapDuel=eastEncounters.find(e=>e.title==='THE SCRAP DUEL');
if(r18ScrapDuel){r18ScrapDuel.text='Two scavengers throw sharpened hubcaps at a stationary truck marked with 10, 25 and 50-point rings.';r18ScrapDuel.exclusive=false;r18ScrapDuel.prompt=r18ScrapDuelMenu;r18ScrapDuel.resolve=function(cmd){const q=r18ScrapDuelScene(),f=player.flags,today=Number(day)||1;
 if(cmd.includes('back')||cmd.includes('away')){if(q.phase==='playing'){q.phase='done';add('You leave the contest; the committed wager is forfeited.','system');}else{q.phase='done';add('You leave the throwing contest behind.','system');}return true;}
 if(cmd.includes('watch')){add('Hubcaps clang against the stationary truck. One thrower grins: “The truck has never won.”','bright');return true;}
 if(cmd.includes('challenge')){if(q.phase==='playing'){add('Finish or leave the contest first.','system');return false;}const level=Math.max(1,Math.min(50,Number(player.level)||1));startCombat({name:'HUBCAP CHAMPION',level,hp:Math.max(22,Math.floor(baseHpForLevel(level)*.28)),min:3,max:6,xp:Math.max(20,level*6),bolts:5,end:'The champion yields beside the truck.'},'encounter');return true;}
 if(cmd.startsWith('wager')&&['idle','custom'].includes(q.phase)&&today>=(Number(f.r18ScrapDuelNextDay)||0)){if(cmd==='wager custom amount'){q.phase='custom';add('Type WAGER <AMOUNT> BOLTS. The champion can cover at most 100 Bolts.','system');return true;}const stake=cmd.includes('all in')?Number(player.bolts):Number((cmd.match(/^wager (\d+) bolts$/)||[])[1]);if(!Number.isSafeInteger(stake)||stake<1||stake>100||player.bolts<stake){add('The wager must be affordable and no more than the champion’s 100-Bolt bankroll.','system');return false;}player.encounterDone?.[roadTurn]?.delete('CANCEL WAGER');player.encounterDone?.[roadTurn]?.delete(`CONFIRM ${stake} BOLT WAGER`);q.stake=stake;q.phase='confirm';add(`Confirm a ${stake}-Bolt wager. A win pays ${stake*2} Bolts total.`,'system');return true;}
 if(cmd.includes('cancel')&&['confirm','custom'].includes(q.phase)){player.encounterDone?.[roadTurn]?.delete(`WAGER ${q.stake} BOLTS`);player.encounterDone?.[roadTurn]?.delete('WAGER ALL IN');player.encounterDone?.[roadTurn]?.delete('WAGER CUSTOM AMOUNT');q.phase='idle';q.stake=0;add('Wager cancelled. No Bolts spent.','system');return true;}
 if(cmd.startsWith('confirm')&&q.phase==='confirm'){if(player.bolts<q.stake){player.encounterDone?.[roadTurn]?.delete(`WAGER ${q.stake} BOLTS`);player.encounterDone?.[roadTurn]?.delete('WAGER ALL IN');q.phase='idle';add('Not enough Bolts. No wager was placed.','system');return true;}player.bolts-=q.stake;updateHud();q.phase='playing';f.r18ScrapDuelNextDay=today+3;add(`Wager placed: ${q.stake} Bolts. Three throws each.`,'system');return true;}
 if(cmd.includes('aim')&&q.phase==='playing'){const match=cmd.match(/aim\s+(10|25|50)/),target=Number(match?.[1]);if(!target)return false;const chance=target===10?.9:target===25?.65:.35,playerHit=Math.random()<chance?target:0,opponentHit=[0,10,25,50][Math.floor(Math.random()*4)];q.playerScore+=playerHit;q.opponentScore+=opponentHit;add(`THROW ${q.round}: You score ${playerHit}; the champion scores ${opponentHit}. TOTAL ${q.playerScore}–${q.opponentScore}.`,'system');q.round++;
  if(q.round>3){if(q.playerScore===q.opponentScore){q.playerScore=0;q.opponentScore=0;add('Tie: sudden death.','bright');}else{if(q.playerScore>q.opponentScore){gainBolts(q.stake*2);add(`You win ${q.stake*2} Bolts total.`,'reward');}else add('The champion wins the wager.','system');if(!f.r18ScrapDuelXpSeen){f.r18ScrapDuelXpSeen=true;gainXp(Math.max(6,player.level));}q.phase='done';}}return true;}
 return false;
 };}
function r18MaskMarketScene(){
 const g=typeof lanternState==='function'?lanternState():null,scene=g?.sceneId||`${day}:${dailyRoadTurns}:${roadGoal}:${roadTurn}`,f=player.flags;if(f.r18MaskMarketScene?.scene===scene)return f.r18MaskMarketScene;
 const level=Math.max(1,Math.min(50,Number(player.level)||1)),rarity=Math.random()<.8?'uncommon':'rare',pool=EQUIPMENT_CATALOG.filter(x=>['weapon','armor'].includes(x.type)&&x.rarity===rarity&&level>=x.minLevel&&level<=x.maxLevel&&!GEAR[x.name]?.questOnly),def=pool[Math.floor(Math.random()*pool.length)];
 f.r18MaskMarketScene={scene,item:def?catalogInstanceName(def,level):null,type:def?.type||null,rarity,base:def?Economy.value(catalogInstanceName(def,level)):0,sold:false,pending:false,gestured:false};return f.r18MaskMarketScene;
}
function r18MaskMarketPrice(q){if(q.item)q.base=Economy.value(q.item);return player.flags.r18MaskDiscount?Math.floor(q.base*.9):q.base;}
const r18MaskMarket=eastEncounters.find(e=>e.title==='THE MASK MARKET');
if(r18MaskMarket){r18MaskMarket.text='Three masked traders communicate entirely through hand signs. Their equipment is displayed with a written price.';r18MaskMarket.exclusive=false;r18MaskMarket.prompt=function(){const q=r18MaskMarketScene(),price=r18MaskMarketPrice(q);return q.pending?`CONFIRM BID ${price} BOLTS   CANCEL BID   LEAVE MARKET`:[...(!q.gestured?['LEARN HAND SIGNS']:[]),...(!q.sold&&q.item?['INSPECT EQUIPMENT',`OFFER ${price} BOLTS`]:[]),'LEAVE MARKET'].join('   ');};r18MaskMarket.resolve=function(cmd){const q=r18MaskMarketScene(),f=player.flags,price=r18MaskMarketPrice(q);
 if(cmd.includes('leave')){q.pending=false;add('The traders return to their silent conversation.','system');return true;}
 if(cmd.includes('cancel')){q.pending=false;player.encounterDone?.[roadTurn]?.delete(`OFFER ${price} BOLTS`);add('You withdraw your offer. No Bolts spent.','system');return true;}
 if(cmd.includes('hand signs')){if(!q.gestured){q.gestured=true;f.r18MaskGestures=(Number(f.r18MaskGestures)||0)+1;if(f.r18MaskGestures>=3)f.r18MaskDiscount=true;}add(f.r18MaskDiscount?'The traders recognize your signs and offer a permanent ten-percent discount.':'You learn another of the traders’ hand signs.','bright');return true;}
 if(cmd.includes('inspect')){if(!q.item||q.sold)return false;const gear=GEAR[q.item];add(`${gearLabel(q.item)} — ${gear?.type==='weapon'?`DMG ${gear.min}–${gear.max}`:`DEF ${gear?.def}`} — ${price} BOLTS`,'system');return true;}
 if(cmd.startsWith('offer')){if(q.sold||!q.item)return false;player.encounterDone?.[roadTurn]?.delete(`CONFIRM BID ${price} BOLTS`);q.pending=true;add(`Confirm purchase of ${gearLabel(q.item)} for ${price} Bolts?`,'system');return true;}
 if(cmd.startsWith('confirm')&&q.pending){if(q.sold||!q.item)return false;if(player.bolts<price){q.pending=false;player.encounterDone?.[roadTurn]?.delete(`OFFER ${price} BOLTS`);add('Not enough Bolts. No purchase made.','system');return true;}if(!addPack(q.item,q.type,1,true)){q.pending=false;player.encounterDone?.[roadTurn]?.delete(`OFFER ${price} BOLTS`);add('Free a backpack slot before trading. No Bolts spent.','system');return true;}player.bolts-=price;updateHud();q.sold=true;q.pending=false;add(`Purchased ${gearLabel(q.item)} for ${price} Bolts.`,'reward');return true;}return false;
 };}
function r18OilRescue(){const f=player.flags;if(f.r18OilOutcome){add('The derrick incident has already been resolved.','system');return false;}f.r18OilOutcome='rescued';if(typeof portRecruitUnlocked==='function')portRecruitUnlocked();gainBolts(75);gainXp(Math.max(15,player.level*4));add('You free Owen Mercer from the tank. The workers pay 75 Bolts and help him away from the derrick.','reward');return true;}
const r18Oil=eastEncounters.find(e=>e.title==='THE OIL DERRICK');
if(r18Oil){r18Oil.text='Supervisor Harlan and worker Sarah argue beside an oil tank. Owen Mercer is trapped inside.';r18Oil.exclusive=false;r18Oil.prompt=function(){const f=player.flags;return ['QUESTION HARLAN','QUESTION SARAH','EXAMINE THE NOTEBOOK',...(!f.r18OilOutcome?['RESCUE OWEN','EXPOSE DEKE','ACCEPT 125 BOLT BRIBE',...(!f.r18OilDekeDefeated?['FIGHT DEKE']:[])]:[]),'BACK AWAY'].join('   ');};r18Oil.resolve=function(cmd){const f=player.flags;
 if(cmd.includes('question harlan')){add('HARLAN > The fuel counts were wrong. Owen went inside to check the tank.','system');return true;}
 if(cmd.includes('question sarah')){add('SARAH > I saw Deke near the hatch after Owen entered. I did not see what he did.','system');return true;}
 if(cmd.includes('notebook')){f.r18OilEvidence=true;add('Owen’s notebook records missing fuel and an unexplained entry signed by Deke.','bright');return true;}
 if(cmd.includes('back')||cmd.includes('away')){add('You leave the derrick without settling the dispute.','system');return true;}
 if(f.r18OilOutcome){add('The derrick incident has already been resolved.','system');return true;}
 if(cmd.includes('bribe')){f.r18OilOutcome='bribed';gainBolts(125);add('Deke pays 125 Bolts. You leave Owen trapped in the tank.','reward');return true;}
 if(cmd.includes('expose')){if(!f.r18OilEvidence){add('You need evidence before confronting Deke.','system');return false;}add('The notebook convinces Harlan to stop Deke and open the tank.','bright');return r18OilRescue();}
 if(cmd.includes('rescue'))return r18OilRescue();
 if(cmd.includes('fight')){if(f.r18OilDekeDefeated){add('Deke has already been defeated.','system');return false;}const level=Math.max(1,Math.min(50,Number(player.level)||1));startCombat({name:'OIL SABOTEUR DEKE',level,hp:Math.max(22,Math.floor(baseHpForLevel(level)*.28)),min:3,max:6,xp:Math.max(20,level*6),bolts:5,r18OilDeke:true,end:'Deke falls beside the oil tank.'},'encounter');return true;}return false;
 };}
function r18ChapelScene(){const g=typeof lanternState==='function'?lanternState():null,scene=typeof RoadLifecycle!=='undefined'?RoadLifecycle.sceneKey('east:27'):g?.sceneId||`${day}:${dailyRoadTurns}:${roadGoal}:${roadTurn}`;if(typeof RoadLifecycle!=='undefined'&&player.flags.r18ChapelScene)player.flags.r18ChapelScene.scene=scene;if(player.flags.r18ChapelScene?.scene!==scene)player.flags.r18ChapelScene={scene,underwater:false,air:0};return player.flags.r18ChapelScene;}
function r18ChapelSpendAir(q){q.air=Math.max(0,q.air-1);if(q.air===0){q.underwater=false;add('OUT OF AIR — you return to the surface before you drown.','danger');}else add('AIR REMAINING: '+q.air,'system');}
function r18ChapelReward(){if(player.flags.r18ChapelBoxClaimed){add('The collection box has already been opened.','system');return true;}const level=Math.max(1,Math.min(50,Number(player.level)||1)),pool=EQUIPMENT_CATALOG.filter(x=>['weapon','armor'].includes(x.type)&&x.rarity==='uncommon'&&level>=x.minLevel&&level<=x.maxLevel&&!GEAR[x.name]?.questOnly);if(!pool.length){add('The collection box cannot be opened yet.','system');return false;}const def=pool[Math.floor(Math.random()*pool.length)],name=catalogInstanceName(def,level);if(!GEAR[name])return false;r18RetainRoadReward(name,def.type);player.flags.r18ChapelBoxClaimed=true;gainXp(Math.max(10,level*3));add('The collection box contains Uncommon equipment.','reward');return true;}
const r18Chapel=eastEncounters.find(e=>e.title==='THE SUNKEN CHAPEL');
if(r18Chapel){r18Chapel.text='A flooded chapel rises from the reservoir. A broken pump and submerged collection box sit beneath the bell tower.';r18Chapel.exclusive=false;r18Chapel.prompt=function(){const q=r18ChapelScene();return q.underwater?`EXAMINE THE BELL   OPEN COLLECTION BOX   WAIT UNDERWATER AIR ${q.air}   SURFACE AND LEAVE`:'REPAIR THE PUMP   DIVE WITH ROPE   DIVE WITHOUT ROPE   LEAVE CHAPEL';};r18Chapel.resolve=function(cmd){const q=r18ChapelScene(),f=player.flags;
 if(cmd.includes('repair')){if(f.r18ChapelPumpRepaired){add('The pump you repaired still works.','system');return true;}if(!hasItem('Wire')||!hasItem('Scrap Metal')){add('The pump needs one Wire and one Scrap Metal.','system');return false;}removeItem('Wire');removeItem('Scrap Metal');f.r18ChapelPumpRepaired=true;add('The pump drains some of the water from the chapel.','bright');return true;}
 if(cmd.includes('dive')){if(cmd.includes('with rope')&&!hasItem('Rope')){add('You need Rope for a secured descent.','system');return false;}q.underwater=true;q.air=f.r18ChapelPumpRepaired?4:3;add('You descend into the chapel. AIR REMAINING: '+q.air,'system');return true;}
 if(cmd.includes('surface')||cmd.includes('leave')){q.underwater=false;add('You return to the road safely.','system');return true;}
 if(!q.underwater)return false;
 if(cmd.includes('examine')){add('The silent bell hangs above the submerged collection box.','bright');r18ChapelSpendAir(q);return true;}
 if(cmd.includes('wait')){add('Your breath is running low.','danger');r18ChapelSpendAir(q);return true;}
 if(cmd.includes('open')){if(!r18ChapelReward())return false;r18ChapelSpendAir(q);return true;}return false;
 };}
function r18ArmoryReward(){
 if(player.flags.r18ArmoryClaimed){add('The bunker cache has already been cleared.','system');return true;}
 const level=Math.max(1,Math.min(50,Number(player.level)||1)),pool=EQUIPMENT_CATALOG.filter(x=>['weapon','armor'].includes(x.type)&&x.rarity==='uncommon'&&level>=x.minLevel&&level<=x.maxLevel&&!GEAR[x.name]?.questOnly);
 if(!pool.length){add('The armory equipment could not be recovered.','system');return false;}const def=pool[Math.floor(Math.random()*pool.length)],name=catalogInstanceName(def,level);if(!GEAR[name])return false;r18RetainRoadReward(name,def.type);r18RetainRoadReward('Bandage','consumable');r18RetainRoadReward('Scrap Metal','material');player.flags.r18ArmoryClaimed=true;gainXp(Math.max(10,level*3));add('The bunker cache holds Uncommon equipment, a Bandage and Scrap Metal.','reward');return true;
}
const r18Armory=eastEncounters.find(e=>e.title==='THE EMPTY ARMORY');
if(r18Armory){r18Armory.text='A welded bunker cache has a combination lock. A roster, journal and wall stencil survived nearby.';r18Armory.exclusive=false;r18Armory.choices='INSPECT ARMORY CLUES   TRY CODE 127   TRY CODE 217   TRY CODE 712   FORCE THE CACHE   BACK AWAY';r18Armory.resolve=function(cmd){
 if(cmd.includes('inspect')){add('The roster marks patrol 1; the journal says the second digit is 2; a wall stencil shows the final digit is 7.','bright');return true;}
 if(cmd.includes('217')||cmd.includes('712')){add('The lock clicks but does not open. You can try another combination.','system');return true;}
 if(cmd.includes('127'))return r18ArmoryReward();
 if(cmd.includes('force')){if(player.flags.r18ArmoryClaimed)return r18ArmoryReward();if(Math.random()<.35){roadHurt(6);add('The heavy plate shifts against your arm.','danger');if(stage==='fallen')return true;}return r18ArmoryReward();}
 if(cmd.includes('back')||cmd.includes('away')){add('You leave the bunker behind.');return true;}return false;
 };}
// The furnace shutdown changes the risk for the remaining choices in this scene.
function r18FurnaceScene(){const g=typeof lanternState==='function'?lanternState():null,scene=typeof RoadLifecycle!=='undefined'?RoadLifecycle.sceneKey('east:7'):g?.sceneId||`${day}:${dailyRoadTurns}:${roadGoal}:${roadTurn}`;if(typeof RoadLifecycle!=='undefined'&&player.flags.r18FurnaceScene)player.flags.r18FurnaceScene.scene=scene;if(player.flags.r18FurnaceScene?.scene!==scene)player.flags.r18FurnaceScene={scene,shutdown:false};return player.flags.r18FurnaceScene;}
const r18Furnace=eastEncounters.find(e=>e.title==='THE FURNACE PIT');
if(r18Furnace){r18Furnace.exclusive=false;r18Furnace.choices='SHUT DOWN FURNACE   HOOK GLOWING METAL   SEARCH MAINTENANCE LOCKER   BACK AWAY';r18Furnace.resolve=function(cmd){const q=r18FurnaceScene();
 if(cmd.includes('shut')){if(q.shutdown){add('The furnace is already shut down.','system');return true;}q.shutdown=true;add('You close the fuel valve. The furnace begins to cool.','bright');return true;}
 if(cmd.includes('back')||cmd.includes('away')){add('You leave the brickworks behind.');return true;}
 if(cmd.includes('hook')||cmd.includes('locker')){const risk=q.shutdown?.12:.45;if(Math.random()<risk){roadHurt(7);add('Heat catches your arm; you pull back without the salvage.','danger');return true;}const item=cmd.includes('hook')?'Tempered Steel':'Wire';r18RetainRoadReward(item,'material');if(cmd.includes('hook')&&CRAFT_RECIPES.temperedPipe&&!(typeof r11Learned==='function'?r11Learned('temperedPipe'):player.flags.r11Learned?.temperedPipe)){(player.flags.r11Learned||(player.flags.r11Learned={})).temperedPipe=true;add('BLUEPRINT LEARNED — TEMPERED STEEL PIPE','reward');}gainXp(Math.max(7,player.level*2));add('You recover '+item+' from the brickworks.','reward');return true;}return false;};}
// Preserve the existing encounter slot while allowing sequential rescue and satchel choices.
const r18Quicksand=eastEncounters.find(e=>e.title==='THE QUICKSAND CUT');
if(r18Quicksand){
 r18Quicksand.text='A scavenger is trapped in gray mud beside a half-sunk wagon. A satchel lies within reach.';
 r18Quicksand.exclusive=false;
 r18Quicksand.prompt=function(){const f=player.flags;return ["INSPECT THE WAGON",...(!f.r18QuicksandOutcome?["RESCUE WITH ROPE","TRY IMPROVISED RESCUE"]:[]),...(!f.r18QuicksandSatchel?["TAKE THE SATCHEL"]:[]),"BACK AWAY"].join('   ');};
 r18Quicksand.resolve=function(cmd){const f=player.flags;
  if(cmd.includes('inspect')){add('The mud is deep around the wagon, but a fallen branch reaches the firmer bank. The scavenger is still breathing.');return true;}
  if(cmd.includes('satchel')){if(f.r18QuicksandSatchel)return false;f.r18QuicksandSatchel=true;gainBolts(12);add('You take twelve Bolts from the satchel.','reward');return true;}
  if(cmd.includes('rescue')){if(f.r18QuicksandOutcome)return false;const rope=cmd.includes('rope');if(rope&&!hasItem('Rope')){add('You need Rope for this rescue.','system');return false;}if(!rope&&Math.random()<.4){roadHurt(5);add('The bank gives way. You pull yourself back, but the scavenger remains trapped.','danger');return true;}f.r18QuicksandOutcome='rescued';r18RetainRoadReward('Wire','material');gainXp(Math.max(10,player.level*3));add(rope?'You pull the scavenger out with Rope, then recover your line. They thank you with Wire.':'You use the fallen branch to pull the scavenger to firm ground. They thank you with Wire.','reward');return true;}
  if(cmd.includes('back')||cmd.includes('away')){if(!f.r18QuicksandOutcome){add('You withdraw from the unstable bank. The rescue remains unresolved.');}else add('You leave the wagon behind.');return true;}return false;
 };
}
// Append (never reorder old save indices) established combat scenes to the
// previously discovery-only East pool. Existing 30% wanderer/cooldown stays intact.
for(const title of ['THE WRECKERS','THE CRAWLER','SECURITY DRONE','HIGHWAY ROBBERS','GANG LOOKOUT','FERAL DOG','LONE SCAVENGER','SOMETHING IN THE DRAIN']){const original=encounters.find(e=>e.title===title),spec=combatSpecs[title];if(original&&spec&&!eastEncounters.some(e=>e.title===title))eastEncounters.push({...original,choices:'FIGHT   BACK AWAY',exclusive:true,combat:{...spec,action:'FIGHT'},resolve(cmd){if(['back away','leave'].includes(cmd)){add('You spot the threat before it closes in and leave without reward.','system');return true;}return false;}});}
// Upgrade the underlying backpack, never confuse an active companion with it.
v48BuyBackpack=function(){r5Capacity();const bonus=player.flags.r5MuleBonus||0,base=player.packMax-bonus;if(base>=10){add('Your underlying backpack already holds at least 10 slots.','system');return false;}if(player.bolts<V48_BACKPACK_PRICE){add('10-slot backpack costs '+V48_BACKPACK_PRICE+' Bolts.','system');return false;}player.bolts-=V48_BACKPACK_PRICE;player.packMax=10+bonus;updateHud();v48Checkpoint();showPurchaseComplete();return true;};
// Storage transfers also count as intake after removing an active Mule.

return {R5_DISCOVERIES, r18ScrapDuel, r18MaskMarket, r18Oil, r18Chapel, r18Armory, r18Furnace, r18Quicksand, r18ScrapDuelScene, r18ScrapDuelMenu, r18MaskMarketScene, r18MaskMarketPrice, r18OilRescue, r18ChapelScene, r18ChapelSpendAir, r18ChapelReward, r18ArmoryReward, r18FurnaceScene};

},
// END discoveries

// BEGIN repeat — formerly final_polish.js
repeat(){
const R6_REPEAT=[
 {title:'FREIGHT WAGON CACHE',text:'A wagon has spilled its load into a drainage ditch. Fresh footprints circle the useful pieces.',choices:'SALVAGE THE LOOSE WIRE   KEEP WALKING',resolve(cmd){if(cmd.includes('salvage')){addPack('Wire','material');gainXp(4);add('One usable length of Wire recovered.','reward');}else if(!cmd.includes('walk'))return false;return true;}},
 {title:'THE WASHED-OUT SHOULDER',text:'Rain has eaten beneath the road. A broken guardrail marks the edge.',choices:'TEST THE GROUND   TAKE THE WIDE PATH',resolve(cmd){if(cmd.includes('test')){if(Math.random()<.35){const d=Math.min(5,Math.max(0,player.hp-1));hurt(d);add(`The shoulder slips. ${d} HP lost; you regain the road.`,'danger');}else{addPack('Scrap Metal','material');add('Stable ground and one loose piece of Scrap Metal.','reward');}}else if(!cmd.includes('wide'))return false;return true;}},
 {title:'A CUP LEFT WARM',text:'Two cups stand beside a cold roadside stove. One has been washed and set out for someone still expected home.',choices:'LEAVE THE CAMP UNDISTURBED   READ THE SCRATCHED MESSAGE',resolve(cmd){if(!/leave|read/.test(cmd))return false;add('BACK BEFORE DARK. Beneath it, a newer hand has written: I WILL WAIT.','bright');return true;}},
 {title:'A QUIET MILE',text:'Wind moves through the reeds. For once, nothing follows your footsteps.',choices:'KEEP WALKING   LISTEN TO THE WIND',resolve(cmd){if(!/walk|listen/.test(cmd))return false;add('You shoulder your pack and carry on.','system');return true;}}
];
const R6_FIRE={title:'RIVER OF FIRE',text:'A ruptured fuel channel burns across the highway. Heat bends the air above blackened ground. A child\'s red mitten hangs from the guardrail; someone has already made it across.',choices:'PICK THROUGH THE CLEAR PATH   SMOTHER AN EDGE WITH CLOTH   TAKE THE SAFE WAY AROUND',resolve(cmd){if(cmd.includes('cloth')){const i=player.pack.find(i=>i.name==='Cloth'&&i.type==='material'&&i.qty>0);if(!i){add('You need 1 carried Cloth. The safe way remains open.','danger');return false;}removeItem('Cloth');addPack('Wire','material');add('Cloth consumed to smother a small edge. You recover 1 Wire from the cooler side.','reward');}else if(cmd.includes('clear path')){const damage=Math.random()<.4?Math.min(8,Math.max(0,player.hp-1)):0;if(damage)hurt(damage);addPack('Scrap Metal','material');add(`You cross the narrow gap: ${damage} HP lost, 1 Scrap Metal recovered.`,'system');}else if(cmd.includes('safe'))add('A concrete drainage ledge carries you around the heat. No damage or salvage.','system');else return false;return true;}};
R6_REPEAT.forEach(e=>e.exclusive=true);R6_FIRE.exclusive=true;
const R6_FIRE_INDEX=eastEncounters.push(R6_FIRE)-1;const R6_REPEAT_INDEX=R6_REPEAT.map(e=>eastEncounters.push(e)-1);

return {R6_REPEAT, R6_FIRE, R6_FIRE_INDEX, R6_REPEAT_INDEX};

},
// END repeat

// BEGIN coastCombat — formerly final_polish.js
coastCombat(){
const R8_COAST_COMBAT = [
 ['FREIGHT CAR AMBUSH','Two scavengers spring from opposite ends of a derailed freight car.', 'FREIGHT CAR SCAVENGERS',7,70,9,15,90,14,['HOOK SCAVENGER','PIPE SCAVENGER']],
 ['BROKEN TOLL CREW','A shield bearer blocks the toll lane while a partner covers the shoulder.', 'TOLL EXTORTIONISTS',8,82,10,16,105,16,['SHIELD BEARER','TOLL GUNMAN']],
 ['SALT MARSH HUNTERS','A pair of lean marsh dogs stalk you through reeds beside the causeway.', 'MARSH DOG PACK',7,64,9,14,85,0,['MARSH DOG','SCARRED MARSH DOG']],
 ['FLOODLIGHT SWEEP','A damaged security drone sweeps a floodlight over an abandoned loading ramp.', 'RAMP SECURITY DRONE',8,88,11,17,110,15,[]],
 ['DRAINAGE STALKER','Scraping follows your footsteps beneath a broken culvert. A plated crawler climbs into the road.', 'CULVERT CRAWLER',8,80,10,17,100,8,[]],
 ['CARGO HIJACKERS','A spotter whistles from a cargo stack. A bruiser steps out with a length of anchor chain.', 'CARGO HIJACKERS',8,86,11,17,110,18,['CARGO SPOTTER','CHAIN BRUISER']],
 ['SEAWALL SNIPER','A glint above the seawall betrays a lone rifle scavenger watching the narrow road.', 'SEAWALL RIFLE SCAVENGER',9,76,12,19,115,17,[]],
 ['SCRAP CRAB NEST','A cracked shipping drum rolls into the lane. Two armored scavenger crabs crawl from beneath it.', 'SCRAP CRABS',7,68,9,15,90,4,['LARGE SCRAP CRAB','SMALL SCRAP CRAB']]
].map(([title,text,name,level,hp,min,max,xp,bolts,names])=>eastEncounters.push({
 title,text,exclusive:true,choices:'FIGHT   BACK AWAY',
 combat:{name,level,hp,min,max,xp,bolts,action:'FIGHT',
 ...(names.length?{enemies:names.map((name,i)=>({name,hp:i?hp-Math.ceil(hp/2):Math.ceil(hp/2),bolts:i?bolts-Math.ceil(bolts/2):Math.ceil(bolts/2)}))}:{}),
 end:'The threat is over. The coast road opens ahead.'},
 resolve(cmd){if(!['back away','leave'].includes(cmd))return false;add('You skirt the threat and regain the highway.','system');return true;}
})-1);

return {R8_COAST_COMBAT};

},
// END coastCombat

// BEGIN coastScenes — formerly final_polish.js
coastScenes(){
const R9_COAST_SCENES=[];
function r9CoastScene(category,title,text,actions){
 const choices=[...actions.map(a=>a[0]),'MOVE ON'];
 const index=eastEncounters.push({category,title,text,exclusive:true,choices:choices.join('   '),resolve(cmd){
  const n=choices.findIndex(c=>c.toLowerCase()===cmd);if(n<0)return false;
  if(n===actions.length){add('You leave the scene behind and follow the freight line.','system');return true;}
  const result=actions[n][1]();return result!==false;
 }})-1;
 R9_COAST_SCENES.push(index);
}
r9CoastScene('exploration','ABANDONED SUPPLY TRUCK','A delivery truck rests against the guardrail. Its cab is dry; the cargo floor sags above the ditch.',[
 ['SEARCH THE CAB',()=>{add('A route sheet ends with the same address crossed out six times. One sealed ration remains beneath the seat.');r9CoastItem('Energy Bars','consumable');}],
 ['INVESTIGATE THE CARGO',()=>{add('The floor shifts under the empty crates. You recover a cable before dropping back to the road.');r9CoastInjury(4);r9CoastItem('Wire');}]
]);
r9CoastScene('exploration','SHUTTERED ROADSIDE CAFE','A cafe sign knocks against its frame. The pantry door is swollen shut; chalk still covers the dining-room wall.',[
 ['PRY OPEN THE PANTRY',()=>{if(Math.random()<.5){add('The shelves have been stripped. A sharp hinge catches your hand.');r9CoastInjury(3);}else{add('A sealed ration survived behind the lowest shelf.');r9CoastItem('Energy Bars','consumable');}}],
 ['READ THE CHALK WALL',()=>add('Meals owed: seventeen. Meals paid: two. Beneath the tally: NOBODY LEAVES HUNGRY. The last line is written in a different hand: THANK YOU.')]
]);
r9CoastScene('exploration','SMOKE BEYOND THE GUARDRAIL','A thin column of smoke rises behind a concrete barrier. No voice answers the wind.',[
 ['INVESTIGATE THE SMOKE',()=>{add('A repair fire smolders beside an empty bedroll. Its owner left in haste; a useful strip of cloth hangs clear of the coals.');r9CoastItem('Cloth');}],
 ['OBSERVE FROM A DISTANCE',()=>add('After several minutes you see it: a tin stove feeding itself from a slow leak. The moving silhouette is only a coat on a pole. You give the fumes a wide berth.')]
]);
r9CoastScene('exploration','RUINED SIGNAL HUT','A railway hut leans toward the freight line. A cabinet rattles inside; bootprints stop at the doorway.',[
 ['OPEN THE CABINET',()=>{add('An animal bolts through the rear wall. The cabinet holds a small roll of insulated wire.');r9CoastItem('Wire');}],
 ['EXAMINE THE BOOTPRINTS',()=>add('The prints overlap in both directions. Someone paced here for hours before writing a departure time on the door. No train came.')]
]);
r9CoastScene('salvage','CACHE UNDER THE MILEPOST','Fresh gravel surrounds a loose milepost. A scrap of red cloth marks a narrow opening beneath it.',[
 ['LIFT THE CACHE LID',()=>{add('Inside a rusted biscuit tin are a few trading Bolts wrapped against the damp.');gainBolts(5);}],
 ['CHECK THE DRAINAGE SLOT',()=>{add('The tin is out of reach from this side, but a clean dressing is wedged above the waterline.');r9CoastItem('Bandage','consumable');}]
]);
r9CoastScene('salvage','OVERTURNED MAINTENANCE CART','A maintenance cart lies across the old rails. Its tool tray and battery cradle are still attached.',[
 ['STRIP THE BATTERY LEADS',()=>{add('The battery is dead. One cable is still worth carrying.');r9CoastItem('Wire');}],
 ['SEARCH THE TOOL TRAY',()=>{add('The tools have rusted together. You salvage one sound piece of metal from the tray.');r9CoastItem('Scrap Metal');}]
]);
r9CoastScene('salvage','LOCKER IN THE CONCRETE PIPE','A dented locker sits inside a dry drainage pipe. Someone has drawn a warning arrow toward its buckled lid.',[
 ['FORCE THE LID',()=>{add('The spring latch snaps against your wrist. A sealed dressing lies inside.');r9CoastInjury(4);r9CoastItem('Bandage','consumable');}],
 ['INSPECT THE WARNING',()=>add('The arrow points to a loaded spring, not an explosive. A penciled note says: IF YOU CAN FIX IT, KEEP IT. You leave the mechanism alone.')]
]);
r9CoastScene('hazard','THE SINKING CAUSEWAY','Water pulses through a split in the highway. The direct crossing is short; the raised curb looks sound.',[
 ['CROSS THE BROKEN SLAB',()=>{if(Math.random()<.5){add('The slab tips. You catch the rail, bruised but above the water.');r9CoastInjury(6);}else add('You cross while the water recedes. The slab holds this time.');}],
 ['FOLLOW THE RAISED CURB',()=>add('You keep your weight above the cracks and regain the road safely. Below you, the water carries scraps of a vanished garden.')]
]);
r9CoastScene('hazard','LEAKING FREIGHT TANK','A sharp chemical smell hangs over a leaking tank. A service pouch dangles beside the valve.',[
 ['REACH FOR THE SERVICE POUCH',()=>{add('The fumes sting your throat. You take a spare cable and scramble back into clean air.');r9CoastInjury(5);r9CoastItem('Wire');}],
 ['CIRCLE UPWIND',()=>add('You circle the tank on dry ground. The warning label is almost gone; the dead reeds need no translation.')]
]);
r9CoastScene('hazard','FALLING WATCH PLATFORM','A wooden lookout platform creaks above the shoulder. Cloth hangs from its broken ladder.',[
 ['PULL DOWN THE LOOSE CLOTH',()=>{add('A rotten rung falls with it. You shield your head and gather the cloth.');r9CoastInjury(3);r9CoastItem('Cloth');}],
 ['PASS UNDER THE CONCRETE EDGE',()=>add('You shelter beneath the concrete abutment until the creaking stops, then pass safely.')]
]);
r9CoastScene('lore','THE REPEATING SIGNAL','Three faint notes repeat from a crushed emergency radio beside the rails. Its receiver still works; the loose coil could be salvaged.',[
 ['DECODE THE SHELTER RECORDING — 8 XP',()=>{add('A recorded voice gives a shelter number, then says to bring a blanket. There is no live voice on the other end. You piece together the old emergency codes and leave the receiver running for the next traveler.');gainXp(8);}],
 ['SALVAGE THE RECEIVER COIL — 1 WIRE',()=>{add('The transmit switch is broken clean off. Someone kept the receiver running with a hand-wound coil. You disconnect its failing battery and recover the wire. The three notes fall silent.');r9CoastItem('Wire');}]
]);
r9CoastScene('lore','LETTERS BENEATH A STONE','A flat stone holds handwritten pages beside an abandoned camp. A blue cup stands near a collapsed supply crate.',[
 ['READ AND PROTECT THE LETTERS — 8 XP',()=>{add('I waited until the frost. I am leaving the blue cup here so you know I made it this far. Beneath a drawing of a dog, a later note describes which ground stays dry. You study it, then tuck the pages beneath the stone, clear of the rain.');gainXp(8);}],
 ['SEARCH THE COLLAPSED CRATE — 1 CLOTH',()=>{add('Two places were cleared for sleeping. Only one has been used recently. You leave the letters and blue cup untouched, recovering a dry strip of packing cloth from beneath the broken crate.');r9CoastItem('Cloth');}]
]);
r9CoastScene('lore','THE ROADSIDE MEASURING WALL','Lines and dates cover a sheltered bridge support. Beside them, a rusted maintenance panel hangs loose.',[
 ['STUDY THE FAMILY MARKINGS — 8 XP',()=>{add('The measurements begin years before the road fell silent. The last date has no height beside it, only: STILL GROWING, SOMEWHERE. Beside the marks, flood lines show how the family kept their shelter above the water. You study their precautions.');gainXp(8);}],
 ['SALVAGE THE LOOSE PANEL — 1 SCRAP METAL',()=>{add('A small shoeprint remains in dried plaster; an adult hand pressed a flower nearby. You leave the memorial intact and lift a loose metal panel from its rusted hinges.');r9CoastItem('Scrap Metal');}]
]);
r9CoastScene('moral','THE STRANDED HANDCART','A traveler grips a handcart with a slipped wheel. A wrapped bundle of household things rests under their coat.',[
 ['HELP RESET THE WHEEL',()=>{add('You brace the axle while they lift. Your shoulder aches, but the wheel seats. They thank you and keep moving without offering payment.');r9CoastInjury(2);}],
 ['OFFER AN ENERGY BAR',()=>{if(!r9CoastGive('Energy Bars'))return false;add('They divide it carefully, saving half for later. For a moment the road is quiet enough to hear someone breathe easier.');}],
 ['CHECK THE LOAD FROM A DISTANCE',()=>add('No weapons or hidden accomplices: a cooking pot, bedding, and a cracked family photograph. They watch you watching, then turn back to the wheel.')]
]);
r9CoastScene('moral','A DRESSING IN THE DUST','A survivor sits beside a wreck, pressing a dirty sleeve against a cut. A sealed satchel rests against their good arm.',[
 ['OFFER A BANDAGE',()=>{if(!r9CoastGive('Bandage'))return false;add('They replace the filthy sleeve with your dressing. They insist on leaving a few Bolts in your palm.');gainBolts(3);}],
 ['ASK ABOUT THE SATCHEL',()=>add('Letters, they say. The kind people write when they think nobody will carry them. They grip the strap until you step back.')],
 ['POINT OUT A SHELTERED SPOT',()=>add('You point to dry ground behind a concrete barrier. They nod and begin the slow work of standing. You cannot carry everyone.')]
]);
// Retain legacy array positions for in-progress saves; R10 never selects these quiet cards.
r9CoastScene('quiet','SALT WIND THROUGH THE REEDS','The freight line runs empty beside a shallow pool. Nothing follows your footsteps.',[
 ['PAUSE AND LISTEN',()=>add('A loose rail ticks as it cools. Farther off, a bird answers another. For a moment there is no demand to do anything.')],
 ['WATCH THE WATER',()=>add('Small fish gather in the shadow of a submerged road sign. Life has found uses for the wreckage.')]
]);
r9CoastScene('quiet','THE LONG SHADOWS','Clouds thin over a stretch of empty pavement. Your shadow crosses old tire marks.',[
 ['LOOK BACK ALONG THE ROAD',()=>add('The places you have passed sit small against the horizon. The road gives no sign of what they cost anyone.')],
 ['KEEP A STEADY PACE',()=>add('Boot after boot, breath after breath. This stretch asks only that you keep going.')]
]);

return {R9_COAST_SCENES, r9CoastScene};

},
// END coastScenes

// BEGIN pools — formerly road_balance.js
pools(){
const R10_EARLY_TITLES={
 exploration:['COUNTY WORK TRUCK','THE GAS STATION','ABANDONED SEDAN','BROKEN MOTEL','DRAINAGE CULVERT','THE TIPPED DELIVERY TRUCK','PRINTS IN THE MUD','SCRATCHING IN THE SHED','THE SAGGING FARMHOUSE'],
 salvage:['WASHOUT SALVAGE','MAINTENANCE BOX','THE DITCH BACKPACK','STONES UNDER THE OAK','THE LOCKED TOOL CHEST','TORN BACKPACK','BROKEN RADIO'],
 environment:['OLD BILLBOARD','THE TRAVELER','COLD ROAD CAMP','THE EMPTY BUS SHELTER','THE SPRAINED RUNNER','DUST OVER THE SCHOOLYARD']
};
const R10_POOLS={early:{},east:{},coast:{
 combat:R8_COAST_COMBAT,
 exploration:R9_COAST_SCENES.filter(i=>eastEncounters[i].category==='exploration'),
 salvage:R9_COAST_SCENES.filter(i=>eastEncounters[i].category==='salvage'),
 environment:[...R9_COAST_SCENES.filter(i=>['hazard','lore','moral','quiet'].includes(eastEncounters[i].category)),R6_FIRE_INDEX]
}};
// Retain established early-road threats, including their food/trade/avoid choices.
R10_POOLS.early.combat=encounters.map((e,i)=>e.combat||combatSpecs[e.title]?i:-1).filter(i=>i>=0);
for(const [kind,titles] of Object.entries(R10_EARLY_TITLES)){
 R10_POOLS.early[kind]=titles.map(t=>encounters.findIndex(e=>e.title===t));
 if(R10_POOLS.early[kind].some(i=>i<0))throw Error('Missing curated road scene: '+kind);
 // Geographic neutral early discoveries also fit the road out of Solace.
 R10_POOLS.east[kind]=R10_POOLS.early[kind].map(i=>eastEncounters.push(encounters[i])-1);
}
// Mid-road versions reuse established enemy types and the existing multi-enemy engine.
R10_POOLS.east.combat=['HIGHWAY ROBBERS','THE CRAWLER','THE WRECKERS','GANG LOOKOUT','SECURITY DRONE','SOMETHING IN THE DRAIN','FERAL DOG','LONE SCAVENGER'].map((title,j)=>{
 const original=encounters.find(e=>e.title===title),base=combatSpecs[title];
 const hp=44+j%3*7,bolts=8+j%4;
 const pair=j===0||j===2||j===6;
 const names=j===6?['FERAL DOG','SCARRED HOUND']:j===2?['WRECKER WITH PIPE','WRECKER WITH CHAIN']:['TIRE IRON ROBBER','SPEAR ROBBER'];
 const spec={...base,action:'FIGHT',level:5+j%3,hp,min:6+j%3,max:11+j%3,xp:40+j*3,bolts,
 ...(pair?{enemies:names.map((name,k)=>({name,hp:k?Math.floor(hp/2):Math.ceil(hp/2),bolts:k?Math.floor(bolts/2):Math.ceil(bolts/2)}))}:{enemies:undefined})};
 if(title==='THE CRAWLER')return eastEncounters.push({...original,title:'EAST ROAD — '+title,combat:{...spec,action:'FIGHT'}})-1;
 if(title==='THE WRECKERS')return eastEncounters.push({...original,title:'EAST ROAD — '+title,combat:{...spec,action:'FIGHT WRECKERS',r18WreckersMedical:true}})-1;
 if(title==='SECURITY DRONE')return eastEncounters.push({...original,title:'EAST ROAD — '+title,combat:{...spec,action:'FIGHT DRONE',r18Drone:true}})-1;
 if(title==='LONE SCAVENGER')return eastEncounters.push({...original,title:'EAST ROAD — '+title,combat:{...spec,action:'FIGHT',enemies:undefined}})-1;
 if(title==='FERAL DOG')return eastEncounters.push({...original,title:'EAST ROAD — '+title,combat:{...original.combat}})-1;
 // Keep lookout reinforcement behavior compatible with its existing combat handler.
 if(title==='GANG LOOKOUT')spec.enemies=[{name:'LOOKOUT',hp,bolts}];
 return eastEncounters.push({title:'EAST ROAD — '+title,text:original.text,combat:spec,exclusive:true,choices:'FIGHT   BACK AWAY',resolve(cmd){if(!['back away','leave'].includes(cmd))return false;add('You take the far shoulder and leave the threat behind.','system');return true;}})-1;
});
// Add the reviewed memorial after legacy registrations so saved indices stay stable.
const r18ShoesEarly=encounters.findIndex(e=>e.title==='THE HANGING SHOES');
if(r18ShoesEarly>=0){
 R10_POOLS.early.environment.push(r18ShoesEarly);
 let eastIndex=eastEncounters.findIndex(e=>e.title==='THE HANGING SHOES');
 if(eastIndex<0)eastIndex=eastEncounters.push(encounters[r18ShoesEarly])-1;
 R10_POOLS.east.environment.push(eastIndex);
}
// Append newly activated reviewed scenes after legacy entries and the shoes.
for(const title of ['THE CAROUSEL HORSE','THE BRIDGE TOLL']){
 const i=encounters.findIndex(e=>e.title===title);if(i<0)continue;
 R10_POOLS.early.environment.push(i);
 let j=eastEncounters.findIndex(e=>e.title===title);if(j<0)j=eastEncounters.push(encounters[i])-1;
 R10_POOLS.east.environment.push(j);
}
// Preserve older indices: reviewed shoulder is registered after existing additions.
const r18ShoulderEarly=encounters.findIndex(e=>e.title==='THE FALSE SHOULDER');
if(r18ShoulderEarly>=0){
 R10_POOLS.early.environment.push(r18ShoulderEarly);
 let j=eastEncounters.findIndex(e=>e.title==='THE FALSE SHOULDER');if(j<0)j=eastEncounters.push(encounters[r18ShoulderEarly])-1;
 R10_POOLS.east.environment.push(j);
}
// Additional reviewed scenes append after previously saved encounter positions.
for(const [title,kind] of [['THE MISSING STAIRS','exploration'],['THE PAINTED ARROWS','combat']]){
 const i=encounters.findIndex(e=>e.title===title);if(i<0)continue;
 if(!R10_POOLS.early[kind].includes(i))R10_POOLS.early[kind].push(i);
 let j=eastEncounters.findIndex(e=>e.title===title);if(j<0)j=eastEncounters.push(encounters[i])-1;
 if(!R10_POOLS.east[kind].includes(j))R10_POOLS.east[kind].push(j);
}
// Re-enable revised eastern scenes by their original indices, without moving saved entries.
for(const [title,kind] of [['THE GLASS FIELD','environment'],['THE RED RAIN','environment'],['THE BURIED FREIGHT','salvage'],['THE LIME FOG','environment'],['THE BLADE CART','environment']]){
 const i=eastEncounters.findIndex(e=>e.title===title);if(i>=0&&!R10_POOLS.east[kind].includes(i))R10_POOLS.east[kind].push(i);
}
// Wheelbarrow is appended after all previously registered encounter entries.
const r18WheelEarly=encounters.findIndex(e=>e.title==='THE WHEELBARROW');
if(r18WheelEarly>=0){R10_POOLS.early.exploration.push(r18WheelEarly);let j=eastEncounters.findIndex(e=>e.title==='THE WHEELBARROW');if(j<0)j=eastEncounters.push(encounters[r18WheelEarly])-1;R10_POOLS.east.exploration.push(j);}
// Register honey after previous additions to preserve old saved indices.
const r18HoneyEarly=encounters.findIndex(e=>e.title==='THE HONEY JAR');
if(r18HoneyEarly>=0){R10_POOLS.early.salvage.push(r18HoneyEarly);let j=eastEncounters.findIndex(e=>e.title==='THE HONEY JAR');if(j<0)j=eastEncounters.push(encounters[r18HoneyEarly])-1;R10_POOLS.east.salvage.push(j);}
// Append the reviewed overlook after older encounter registrations.
const r18Ridge=encounters.findIndex(e=>e.title==='RIDGELINE');
if(r18Ridge>=0){R10_POOLS.early.exploration.push(r18Ridge);let j=eastEncounters.findIndex(e=>e.title==='RIDGELINE');if(j<0)j=eastEncounters.push(encounters[r18Ridge])-1;R10_POOLS.east.exploration.push(j);}
// Retain legacy indices; append the revised scrap claim for eastern roads.
const r18ScrapClaim=encounters.findIndex(e=>e.title==='THE SCRAP CLAIM');
if(r18ScrapClaim>=0){let j=eastEncounters.findIndex(e=>e.title==='EAST ROAD — THE SCRAP CLAIM');if(j<0)j=eastEncounters.push({...encounters[r18ScrapClaim],title:'EAST ROAD — THE SCRAP CLAIM'})-1;R10_POOLS.east.combat.push(j);}
// Roach variants use the original event and append the east copy without shifting saves.
const r18RoachEarly=encounters.findIndex(e=>e.title==='ROACH NEST');
if(r18RoachEarly>=0){let j=eastEncounters.findIndex(e=>e.title==='EAST ROAD — ROACH NEST');if(j<0)j=eastEncounters.push({...encounters[r18RoachEarly],title:'EAST ROAD — ROACH NEST'})-1;R10_POOLS.east.combat.push(j);}
// Existing east wolf scene is selected by its stable index.
const r18CinderIndex=eastEncounters.findIndex(e=>e.title==='THE CINDER WOLVES');
if(r18CinderIndex>=0&&!R10_POOLS.east.combat.includes(r18CinderIndex))R10_POOLS.east.combat.push(r18CinderIndex);
// Append pantry rats only after the previous saved encounter registrations.
const r18PantryEarly=encounters.findIndex(e=>e.title==='RATS IN THE PANTRY');
if(r18PantryEarly>=0){let j=eastEncounters.findIndex(e=>e.title==='EAST ROAD — RATS IN THE PANTRY');if(j<0)j=eastEncounters.push({...encounters[r18PantryEarly],title:'EAST ROAD — RATS IN THE PANTRY'})-1;R10_POOLS.east.combat.push(j);}
// The orchard already exists in the eastern array; reuse its saved index.
const r18OrchardIndex=eastEncounters.findIndex(e=>e.title==='THE LAST ORCHARD');
if(r18OrchardIndex>=0&&!R10_POOLS.east.exploration.includes(r18OrchardIndex))R10_POOLS.east.exploration.push(r18OrchardIndex);
// Existing eastern dam and bridge keep their original saved indices.
for(const title of ['THE COLLAPSED DAM','THE CHAIN BRIDGE','THE WELDED BUS','THE QUICKSAND CUT']){const i=eastEncounters.findIndex(e=>e.title===title);if(i>=0&&!R10_POOLS.east.environment.includes(i))R10_POOLS.east.environment.push(i);}
// The well is a new pool registration; append its eastern copy after prior entries.
const r18WellIndex=encounters.findIndex(e=>e.title==='THE COIN WELL');
if(r18WellIndex>=0){if(!R10_POOLS.early.exploration.includes(r18WellIndex))R10_POOLS.early.exploration.push(r18WellIndex);let i=eastEncounters.findIndex(e=>e.title==='THE COIN WELL');if(i<0)i=eastEncounters.push(encounters[r18WellIndex])-1;if(!R10_POOLS.east.exploration.includes(i))R10_POOLS.east.exploration.push(i);}
const r18FreezerIndex=encounters.findIndex(e=>e.title==='THE LOCKED FREEZER');
if(r18FreezerIndex>=0){if(!R10_POOLS.early.exploration.includes(r18FreezerIndex))R10_POOLS.early.exploration.push(r18FreezerIndex);let i=eastEncounters.findIndex(e=>e.title==='THE LOCKED FREEZER');if(i<0)i=eastEncounters.push(encounters[r18FreezerIndex])-1;if(!R10_POOLS.east.exploration.includes(i))R10_POOLS.east.exploration.push(i);}
const r18GreenhouseIndex=encounters.findIndex(e=>e.title==='THE RAIN BARREL');
if(r18GreenhouseIndex>=0){if(!R10_POOLS.early.exploration.includes(r18GreenhouseIndex))R10_POOLS.early.exploration.push(r18GreenhouseIndex);let i=eastEncounters.findIndex(e=>e.title==='THE RAIN BARREL');if(i<0)i=eastEncounters.push(encounters[r18GreenhouseIndex])-1;if(!R10_POOLS.east.exploration.includes(i))R10_POOLS.east.exploration.push(i);}
const r18CraneNestIndex=eastEncounters.findIndex(e=>e.title==='THE CRANE NEST');
if(r18CraneNestIndex>=0&&!R10_POOLS.east.combat.includes(r18CraneNestIndex))R10_POOLS.east.combat.push(r18CraneNestIndex);
const r18SiloIndex=eastEncounters.findIndex(e=>e.title==='THE SHATTERED SILO');
if(r18SiloIndex>=0&&!R10_POOLS.east.combat.includes(r18SiloIndex))R10_POOLS.east.combat.push(r18SiloIndex);
const r18GardenIndex=encounters.findIndex(e=>e.title==='IRRADIATED ROACHES');
if(r18GardenIndex>=0){let i=eastEncounters.findIndex(e=>e.title==='EAST ROAD — IRRADIATED ROACHES');if(i<0)i=eastEncounters.push({...encounters[r18GardenIndex],title:'EAST ROAD — IRRADIATED ROACHES'})-1;if(!R10_POOLS.east.combat.includes(i))R10_POOLS.east.combat.push(i);}
const r18TarPoolIndex=eastEncounters.findIndex(e=>e.title==='THE TAR POOL');
if(r18TarPoolIndex>=0&&!R10_POOLS.east.salvage.includes(r18TarPoolIndex))R10_POOLS.east.salvage.push(r18TarPoolIndex);
const r18ReapersIndex=eastEncounters.findIndex(e=>e.title==='THE KNIFE WIND');
if(r18ReapersIndex>=0&&!R10_POOLS.east.combat.includes(r18ReapersIndex))R10_POOLS.east.combat.push(r18ReapersIndex);
const r18HuntersIndex=encounters.findIndex(e=>e.title==='THE MILK CRATES');
if(r18HuntersIndex>=0){if(!R10_POOLS.early.combat.includes(r18HuntersIndex))R10_POOLS.early.combat.push(r18HuntersIndex);let i=eastEncounters.findIndex(e=>e.title==='THE MILK CRATES');if(i<0)i=eastEncounters.push(encounters[r18HuntersIndex])-1;if(!R10_POOLS.east.combat.includes(i))R10_POOLS.east.combat.push(i);}
const r18ChainGangIndex=eastEncounters.findIndex(e=>e.title==='THE QUARRY LIFT');
if(r18ChainGangIndex>=0&&!R10_POOLS.east.combat.includes(r18ChainGangIndex))R10_POOLS.east.combat.push(r18ChainGangIndex);
const r18HarvestIndex=eastEncounters.findIndex(e=>e.title==='THE IRON HARVEST');
if(r18HarvestIndex>=0&&!R10_POOLS.east.combat.includes(r18HarvestIndex))R10_POOLS.east.combat.push(r18HarvestIndex);
const r18EnforcerIndex=encounters.findIndex(e=>e.title==='THE DRY FOUNTAIN');
if(r18EnforcerIndex>=0){if(!R10_POOLS.early.combat.includes(r18EnforcerIndex))R10_POOLS.early.combat.push(r18EnforcerIndex);let i=eastEncounters.findIndex(e=>e.title==='THE DRY FOUNTAIN');if(i<0)i=eastEncounters.push(encounters[r18EnforcerIndex])-1;if(!R10_POOLS.east.combat.includes(i))R10_POOLS.east.combat.push(i);}
const r18ChoirIndex=eastEncounters.findIndex(e=>e.title==='THE IRON CHOIR');
if(r18ChoirIndex>=0&&!R10_POOLS.east.combat.includes(r18ChoirIndex))R10_POOLS.east.combat.push(r18ChoirIndex);
const r18BoneHuntersIndex=eastEncounters.findIndex(e=>e.title==='THE BONE FLAGS');
if(r18BoneHuntersIndex>=0&&!R10_POOLS.east.combat.includes(r18BoneHuntersIndex))R10_POOLS.east.combat.push(r18BoneHuntersIndex);
const r18FurnaceIndex=eastEncounters.findIndex(e=>e.title==='THE FURNACE PIT');
if(r18FurnaceIndex>=0&&!R10_POOLS.east.environment.includes(r18FurnaceIndex))R10_POOLS.east.environment.push(r18FurnaceIndex);
const r18ParadeIndex=eastEncounters.findIndex(e=>e.title==='THE RUST PARADE');
if(r18ParadeIndex>=0&&!R10_POOLS.east.environment.includes(r18ParadeIndex))R10_POOLS.east.environment.push(r18ParadeIndex);
const r18WardenIndex=eastEncounters.findIndex(e=>e.title==='THE WARDEN');
if(r18WardenIndex>=0&&!R10_POOLS.east.combat.includes(r18WardenIndex))R10_POOLS.east.combat.push(r18WardenIndex);
const r18PeteIndex=encounters.findIndex(e=>e.title==='THE WALKING PEDDLER');
if(r18PeteIndex>=0){if(!R10_POOLS.early.exploration.includes(r18PeteIndex))R10_POOLS.early.exploration.push(r18PeteIndex);let i=eastEncounters.findIndex(e=>e.title==='THE WALKING PEDDLER');if(i<0)i=eastEncounters.push(encounters[r18PeteIndex])-1;if(!R10_POOLS.east.exploration.includes(i))R10_POOLS.east.exploration.push(i);}
const r18GnomesIndex=encounters.findIndex(e=>e.title==='THE GARDEN GNOMES');
if(r18GnomesIndex>=0){if(!R10_POOLS.early.exploration.includes(r18GnomesIndex))R10_POOLS.early.exploration.push(r18GnomesIndex);let i=eastEncounters.findIndex(e=>e.title==='THE GARDEN GNOMES');if(i<0)i=eastEncounters.push(encounters[r18GnomesIndex])-1;if(!R10_POOLS.east.exploration.includes(i))R10_POOLS.east.exploration.push(i);}
const r18WaxIndex=eastEncounters.findIndex(e=>e.title==='THE WAX MUSEUM');
if(r18WaxIndex>=0&&!R10_POOLS.east.exploration.includes(r18WaxIndex))R10_POOLS.east.exploration.push(r18WaxIndex);
for(const [title,kind] of [['THE SALT MINERS','combat'],['THE GRINDER CREW','salvage']]){const i=eastEncounters.findIndex(e=>e.title===title);if(i>=0&&!R10_POOLS.east[kind].includes(i))R10_POOLS.east[kind].push(i);}
const r18RoadEaterIndex=eastEncounters.findIndex(e=>e.title==='THE ROAD EATER');
if(r18RoadEaterIndex>=0&&!R10_POOLS.east.combat.includes(r18RoadEaterIndex))R10_POOLS.east.combat.push(r18RoadEaterIndex);
const r18WallIndex=eastEncounters.findIndex(e=>e.title==='THE GATELESS WALL');
if(r18WallIndex>=0&&!R10_POOLS.east.combat.includes(r18WallIndex))R10_POOLS.east.combat.push(r18WallIndex);
const r18ArmoryIndex=eastEncounters.findIndex(e=>e.title==='THE EMPTY ARMORY');
if(r18ArmoryIndex>=0&&!R10_POOLS.east.exploration.includes(r18ArmoryIndex))R10_POOLS.east.exploration.push(r18ArmoryIndex);
const r18BoneCollectorIndex=eastEncounters.findIndex(e=>e.title==='THE BONE COLLECTOR');
if(r18BoneCollectorIndex>=0&&!R10_POOLS.east.combat.includes(r18BoneCollectorIndex))R10_POOLS.east.combat.push(r18BoneCollectorIndex);
const r18BlackSnowIndex=eastEncounters.findIndex(e=>e.title==='THE BLACK SNOW');
if(r18BlackSnowIndex>=0&&!R10_POOLS.east.exploration.includes(r18BlackSnowIndex))R10_POOLS.east.exploration.push(r18BlackSnowIndex);
const r18EnidIndex=encounters.findIndex(e=>e.title==='THE FENCE ARTIST');
if(r18EnidIndex>=0){if(!R10_POOLS.early.exploration.includes(r18EnidIndex))R10_POOLS.early.exploration.push(r18EnidIndex);let i=eastEncounters.findIndex(e=>e.title==='THE FENCE ARTIST');if(i<0)i=eastEncounters.push(encounters[r18EnidIndex])-1;if(!R10_POOLS.east.exploration.includes(i))R10_POOLS.east.exploration.push(i);}
const r18LibraryIndex=encounters.findIndex(e=>e.title==='THE BURNT LIBRARY');
if(r18LibraryIndex>=0){if(!R10_POOLS.early.exploration.includes(r18LibraryIndex))R10_POOLS.early.exploration.push(r18LibraryIndex);let i=eastEncounters.findIndex(e=>e.title==='THE BURNT LIBRARY');if(i<0)i=eastEncounters.push(encounters[r18LibraryIndex])-1;if(!R10_POOLS.east.exploration.includes(i))R10_POOLS.east.exploration.push(i);}
const r18ChapelIndex=eastEncounters.findIndex(e=>e.title==='THE SUNKEN CHAPEL');
if(r18ChapelIndex>=0&&!R10_POOLS.east.exploration.includes(r18ChapelIndex))R10_POOLS.east.exploration.push(r18ChapelIndex);
const r18BomberIndex=eastEncounters.findIndex(e=>e.title==='THE MUD CANNON');
if(r18BomberIndex>=0&&!R10_POOLS.east.combat.includes(r18BomberIndex))R10_POOLS.east.combat.push(r18BomberIndex);
const r18PicnicIndex=encounters.findIndex(e=>e.title==='THE SILENT PICNIC');
if(r18PicnicIndex>=0){if(!R10_POOLS.early.exploration.includes(r18PicnicIndex))R10_POOLS.early.exploration.push(r18PicnicIndex);let i=eastEncounters.findIndex(e=>e.title==='THE SILENT PICNIC');if(i<0)i=eastEncounters.push(encounters[r18PicnicIndex])-1;if(!R10_POOLS.east.exploration.includes(i))R10_POOLS.east.exploration.push(i);}
const r18PaperStormIndex=encounters.findIndex(e=>e.title==='THE PAPER STORM');
if(r18PaperStormIndex>=0){if(!R10_POOLS.early.exploration.includes(r18PaperStormIndex))R10_POOLS.early.exploration.push(r18PaperStormIndex);let i=eastEncounters.findIndex(e=>e.title==='THE PAPER STORM');if(i<0)i=eastEncounters.push(encounters[r18PaperStormIndex])-1;if(!R10_POOLS.east.exploration.includes(i))R10_POOLS.east.exploration.push(i);}
const r18MarthaIndex=eastEncounters.findIndex(e=>e.title==='THE STEEL ORCHARD');
if(r18MarthaIndex>=0&&!R10_POOLS.east.exploration.includes(r18MarthaIndex))R10_POOLS.east.exploration.push(r18MarthaIndex);
for(const [title,kind] of [['THE HANGING CAGE','exploration'],['THE DUST HORSES','environment']]){const i=eastEncounters.findIndex(e=>e.title===title);if(i>=0&&!R10_POOLS.east[kind].includes(i))R10_POOLS.east[kind].push(i);}
const r18OilIndex=eastEncounters.findIndex(e=>e.title==='THE OIL DERRICK');
if(r18OilIndex>=0&&!R10_POOLS.east.exploration.includes(r18OilIndex))R10_POOLS.east.exploration.push(r18OilIndex);
const r18TunnelIndex=encounters.findIndex(e=>e.title==='TUNNEL RATS');
if(r18TunnelIndex>=0){let i=eastEncounters.findIndex(e=>e.title==='TUNNEL RATS');if(i<0)i=eastEncounters.push(encounters[r18TunnelIndex])-1;if(!R10_POOLS.east.combat.includes(i))R10_POOLS.east.combat.push(i);}
const r18MaskMarketIndex=eastEncounters.findIndex(e=>e.title==='THE MASK MARKET');
if(r18MaskMarketIndex>=0&&!R10_POOLS.east.exploration.includes(r18MaskMarketIndex))R10_POOLS.east.exploration.push(r18MaskMarketIndex);
const r18ScrapDuelIndex=eastEncounters.findIndex(e=>e.title==='THE SCRAP DUEL');
if(r18ScrapDuelIndex>=0&&!R10_POOLS.east.exploration.includes(r18ScrapDuelIndex))R10_POOLS.east.exploration.push(r18ScrapDuelIndex);
const r18MazeIndex=encounters.findIndex(e=>e.title==='CEMETERY OF TIRES');
if(r18MazeIndex>=0){if(!R10_POOLS.early.exploration.includes(r18MazeIndex))R10_POOLS.early.exploration.push(r18MazeIndex);let i=eastEncounters.findIndex(e=>e.title==='CEMETERY OF TIRES');if(i<0)i=eastEncounters.push(encounters[r18MazeIndex])-1;if(!R10_POOLS.east.exploration.includes(i))R10_POOLS.east.exploration.push(i);}
const r18ClaraIndex=eastEncounters.findIndex(e=>e.title==='THE HOLLOW STATUE');
if(r18ClaraIndex>=0&&!R10_POOLS.east.exploration.includes(r18ClaraIndex))R10_POOLS.east.exploration.push(r18ClaraIndex);
const r18AshIndex=eastEncounters.findIndex(e=>e.title==='THE ASH PROCESSION');
if(r18AshIndex>=0&&!R10_POOLS.east.exploration.includes(r18AshIndex))R10_POOLS.east.exploration.push(r18AshIndex);
// Keep the rescued hound available in both early and eastern road pools until adopted.
const r18HoundIndex=encounters.findIndex(e=>e.title==='THE LIMPING HOUND');
if(r18HoundIndex>=0){if(!R10_POOLS.early.exploration.includes(r18HoundIndex))R10_POOLS.early.exploration.push(r18HoundIndex);let j=eastEncounters.findIndex(e=>e.title==='THE LIMPING HOUND');if(j<0)j=eastEncounters.push(encounters[r18HoundIndex])-1;if(!R10_POOLS.east.exploration.includes(j))R10_POOLS.east.exploration.push(j);}
// Append courier and postal truck registrations without moving established save indexes.
for(const [title,kind] of [['MILES THE COURIER','exploration'],['THE LAST MAIL','salvage']]){
 const i=encounters.findIndex(e=>e.title===title);if(i<0)continue;
 if(!R10_POOLS.early[kind].includes(i))R10_POOLS.early[kind].push(i);
 let j=eastEncounters.findIndex(e=>e.title===title);if(j<0)j=eastEncounters.push(encounters[i])-1;
 if(!R10_POOLS.east[kind].includes(j))R10_POOLS.east[kind].push(j);
}

return {R10_EARLY_TITLES, R10_POOLS, r18ShoesEarly, r18ShoulderEarly, r18WheelEarly, r18HoneyEarly, r18Ridge, r18ScrapClaim, r18RoachEarly, r18CinderIndex, r18PantryEarly, r18OrchardIndex, r18WellIndex, r18FreezerIndex, r18GreenhouseIndex, r18CraneNestIndex, r18SiloIndex, r18GardenIndex, r18TarPoolIndex, r18ReapersIndex, r18HuntersIndex, r18ChainGangIndex, r18HarvestIndex, r18EnforcerIndex, r18ChoirIndex, r18BoneHuntersIndex, r18FurnaceIndex, r18ParadeIndex, r18WardenIndex, r18PeteIndex, r18GnomesIndex, r18WaxIndex, r18RoadEaterIndex, r18WallIndex, r18ArmoryIndex, r18BoneCollectorIndex, r18BlackSnowIndex, r18EnidIndex, r18LibraryIndex, r18ChapelIndex, r18BomberIndex, r18PicnicIndex, r18PaperStormIndex, r18MarthaIndex, r18OilIndex, r18TunnelIndex, r18MaskMarketIndex, r18ScrapDuelIndex, r18MazeIndex, r18ClaraIndex, r18AshIndex, r18HoundIndex};

},
// END pools

// BEGIN finishPools — formerly road_balance.js
finishPools(){
// Restore retained regional definitions omitted by the curated selector. Register
// existing indices only: saved encounter identifiers and regional boundaries stay stable.
for(const [title,kind] of [
 ['THE FIGHTING RING','exploration'],['THE FORGOTTEN ARENA','exploration'],
 ['FREIGHT WAGON CACHE','salvage'],['THE WASHED-OUT SHOULDER','environment'],
 ['A CUP LEFT WARM','environment'],['A QUIET MILE','environment']
]){
 const i=eastEncounters.findIndex(e=>e.title===title);
 if(i>=0&&!R10_POOLS.east[kind].includes(i))R10_POOLS.east[kind].push(i);
}
// The Big Man uses its original scripted resolution rather than combatSpecs.
const r18BigManIndex=encounters.findIndex(e=>e.title==='THE BIG MAN');
if(r18BigManIndex>=0&&!R10_POOLS.early.combat.includes(r18BigManIndex))R10_POOLS.early.combat.push(r18BigManIndex);

// Prune live selection references only. Historical definitions/registration positions
// remain in place so old saved encounter indices can finish without being reordered.
for(const [region,categories] of Object.entries(R10_POOLS)){
 const definitions=r10Pool(region);
 for(const [kind,indices] of Object.entries(categories))categories[kind]=[...new Set(indices)].filter(i=>Number.isInteger(i)&&definitions[i]&&!r10Retired(definitions[i].title));
}

},
// END finishPools

// BEGIN rivet — formerly r18_completion.js
rivet(){
const r18Rivet=eastEncounters.find(e=>e.title==='THE GRINDER CREW');if(r18Rivet){const prior=r18Rivet.resolve.bind(r18Rivet),priorPrompt=r18Rivet.prompt?.bind(r18Rivet);r18Rivet.prompt=()=> (priorPrompt?priorPrompt():r18Rivet.choices)+'   RECYCLE OLD GEAR';r18Rivet.resolve=function(cmd){if(cmd==='recycle old gear'){r18RecycleMenu();return true;}return prior(cmd);};}
},
// END rivet

// BEGIN steve — formerly r11.js
steve(){
function r11SteveScene(branchReturn=null){
 player.flags.r11SteveReturn=branchReturn;stage='r11Steve';add("CRAZY STEVE'S PINK ELEPHANTS",'place');add('Crazy Steve staggers across the road in an old wooden sandwich board. He points wildly at something the size of a wheelbarrow.');add("CRAZY STEVE > YOU SEE 'EM?! TELL ME YOU SEE 'EM! THE PINK ELEPHANTS! THEY'RE EVERYWHERE!",'bright');r5DirectChoices(['ASK ABOUT THE ELEPHANTS','FIGHT THE ELEPHANTS','LEAVE STEVE ALONE']);
}
function r11SteveFinish(){const back=player.flags.r11SteveReturn;delete player.flags.r11SteveReturn;if(back){stage=back.stage;serviceRoadDepth=back.depth;renderCurrentChoices();}else completeRoadTurn();}
function r11Elephant(){startCombat({name:'PINK ELEPHANT',level:1,hp:1,min:0,max:1,xp:1,bolts:0,end:'The pink elephant pops like a soap bubble. Steve applauds, then checks behind you.'},'r11Elephant');r6Art('PINK ELEPHANT',[['pink','    __     __'],['pink','  /    \\__/  \\'],['pink',' (  o       o )~~'],['pink','  \\___/\\____/'],['pink','    ||    ||']]);}
function r11SteveVictory(){stage='r11SteveReward';outputQueue=outputQueue.then(async()=>{try{const won=await r11ClaimBoard();add(won?'CRAZY STEVE > THANK YOU! Take the board! It attracts them!':"CRAZY STEVE > I already gave the board away! They said there could only be one. THE ELEPHANTS KNOW.",'bright');if(won)add('LEGENDARY — '+R11_BOARD+' — DEF 15 / MAX HP +20', 'legendary');r11SteveFinish();r11Quiet(()=>v49Autosave());}catch(e){add('Steve cannot secure the reward right now. CLAIM STEVE REWARD to retry.','danger');}});}
function r11SteveRoll(){return Math.random()<.01;}
const r11Prepare=r10PrepareEncounter;r10PrepareEncounter=function(){if(!resumeSavedEncounter&&r11SteveRoll()){player.flags.r10LastRoadCategory='special';r11SteveScene();return false;}return r11Prepare();};

return {r11SteveScene, r11SteveFinish, r11Elephant, r11SteveVictory, r11SteveRoll, r11Prepare};

},
// END steve

// BEGIN wandererRoster — formerly app.js
wandererRoster(){
const wanderers = [
  {name:"Tess", level:5, vibe:"watchful", lines:["TESS > Road's quieter when it shouldn't be.","Tess gives you a short nod and keeps one hand near her coat."]},
  {name:"Patch", level:5, vibe:"cheerful", lines:["PATCH > Found three good screws today. That's practically a holiday.","Patch grins like the wasteland has personally failed to ruin his mood."]},
  {name:"Hollis", level:2, vibe:"tired", lines:["HOLLIS > If Solace has coffee, don't tell me. I can't afford another disappointment.","Hollis looks exhausted enough to sleep standing up."]},
  {name:"Rook", level:4, vibe:"suspicious", lines:["ROOK > You following me? ...No? Good.","Rook watches you without blinking."]},
  {name:"June", level:2, vibe:"kind", lines:["JUNE > You bleeding? No? Good day, then.","June offers a small wave."]},
  {name:"Moss", level:3, vibe:"quiet", lines:["Moss taps two fingers against his brow. Apparently that's hello.","Moss studies the horizon and says nothing."]},
  {name:"Kettle", level:4, vibe:"odd", lines:["KETTLE > Never trust a road that looks straight.","Kettle is humming a song you almost recognize."]},
  {name:"Vera", level:3, vibe:"practical", lines:["VERA > Boots first. Food second. Pride somewhere around ninth.","Vera checks the stitching on her pack."]},
  {name:"Deke", level:5, vibe:"cocky", lines:["DEKE > Relax. If I wanted your Bolts, we'd already be negotiating.","Deke flashes a grin that does not improve the situation."]},
  {name:"Ash", level:2, vibe:"skittish", lines:["ASH > Just passing through. Same as you.","Ash keeps glancing toward the nearest exit."]},
  {name:"Bram", level:4, vibe:"gruff", lines:["BRAM > Keep your weapon low and we'll get along fine.","Bram grunts. It may have been hello."]},
  {name:"Lark", level:3, vibe:"curious", lines:["LARK > You hear the relay at night too, or is that just me?","Lark looks at your pack, then at you, filing away details."]},
  {name:"Flint", level:6, vibe:"methodical", lines:["FLINT > That engine noise? Bad bearing. Don't ask how I know.","Flint cleans a grease-dark wrench before acknowledging you."]},
  {name:"Sable", level:6, vibe:"cautious", lines:["SABLE > Tracks cross here twice. Someone's circling.","Sable keeps the sun at her back and the brush in sight."]},
  {name:"Cricket", level:6, vibe:"talkative", lines:["CRICKET > Two roads, three rumors, and not one of 'em good.","Cricket talks fast but misses nothing around you."]},
  {name:"Rowan", level:7, vibe:"resourceful", lines:["ROWAN > A locked door just means somebody valued what's behind it.","Rowan tests the weight of a scavenged tool in one hand."]},
  {name:"Harlow", level:7, vibe:"steady", lines:["HARLOW > Keep that wound clean. The road's filthy enough.","Harlow adjusts a faded medic's satchel."]},
  {name:"Bolt", level:7, vibe:"practical", lines:["BOLT > Most people see junk. I see tomorrow's shelter.","Bolt sorts a fistful of usable fasteners by touch."]},
  {name:"Crowley", level:8, vibe:"suspicious", lines:["CROWLEY > You buy first. Then we can be friends.","Crowley closes a battered ledger before you can read it."]},
  {name:"Mercer", level:8, vibe:"shrewd", lines:["MERCER > There's a fair price and a road price. Guess which one's mine.","Mercer eyes your pack like he's already making an offer."]},
  {name:"Finch", level:8, vibe:"reserved", lines:["FINCH > Quiet keeps you breathing.","Finch scans the ridgeline before answering."]},
  {name:"Vale", level:9, vibe:"enigmatic", lines:["VALE > The Dominion isn't as sure of itself as it pretends.","Vale folds an old map before you can glimpse its markings."]},
  {name:"Bishop", level:9, vibe:"disciplined", lines:["BISHOP > Hands where I can see them. Nothing personal.","Bishop stands like someone still waiting for orders."]},
  {name:"Wren", level:9, vibe:"watchful", lines:["WREN > I survived this long by noticing what others miss.","Wren touches a weathered lookout's whistle but doesn't blow it."]},
  {name:"Cutter", level:10, vibe:"hardened", lines:["CUTTER > The road takes the careless first.","Cutter's scarred armor carries marks from fights you wouldn't pick."]}
];

return {wanderers};

},
// END wandererRoster
// Work Order 2: bounded revisions. Legacy titles/slots are save identifiers.
wo2State(){return player.flags.wo2||(player.flags.wo2={});},
wo2Roll(min,max){return min+Math.floor(Math.random()*(max-min+1));},
wo2Item(name,type='material',qty=1){for(let i=0;i<qty;i++)r18RetainRoadReward(name,type);},
wo2Once(key,fn){const f=this.wo2State();if(f[key]){add('This discovery has already been collected.','system');return false;}f[key]=true;fn();return true;},
wo2Award(key){
 const rewards={
  fresh:{xp:100,bolts:[25,40],items:[['Scrap Metal','material',1]],text:'The butcher falls. Bolts and usable supplies remain in the truck, away from the meat.'},
  patrol:{xp:110,bolts:[30,45],items:[['Scrap Metal','material',1],['Wire','material',1]],text:'The checkpoint falls silent. You recover the sergeant’s pay pouch and military salvage.'},
  crabTrap:{xp:100,bolts:[15,30],items:[['Crab Meat','material',this.wo2Roll(3,5)],['Scrap Metal','material',1]],text:'The swarm disperses. Crab Meat comes from the creatures; the Bolts and metal come from the abandoned cargo container.'},
  forklift:{xp:110,bolts:[25,40],items:[['Scrap Metal','material',1],['Wire','material',1]],text:'The forklift stops. An industrial service box holds Bolts, wire and recoverable metal.'},
  harold:{xp:115,bolts:[40,60],items:[['Employee Badge','key',1],['Energy Bars','consumable',this.wo2Roll(2,4)],['Scrap Metal','material',1]],text:'Harold drops his weapon. The manager’s desk holds an Employee Badge, food supplies and a petty-cash tin.'},
  crabNest:{xp:95,bolts:[15,25],items:[['Crab Meat','material',this.wo2Roll(2,3)],['Scrap Metal','material',1]],text:'The Nest Guardian falls. You recover meat from the crab, and Bolts and salvage from the wreckage around its nest.'}
 };
 const reward=rewards[key];if(!reward)return false;
 return this.wo2Once(key,()=>{add(reward.text,'reward');gainXp(reward.xp);gainBolts(this.wo2Roll(...reward.bolts));for(const args of reward.items)this.wo2Item(...args);});
},
wo2Fight(key,spec){
 if(this.wo2State()[key]){add('The confrontation is over; the supplies have already been claimed.','system');return true;}
 startCombat({...spec,xp:0,bolts:0,enemies:spec.enemies?.map(e=>({...e,bolts:0})),wo2Reward:key,wo2NoEquipment:true},'encounter');return true;
},
wo2(){
 // Reserve all WO1 aliases before exclusions, preserving WO1 in-progress saves.
 this.globalize();
 const registry=this;
 const retired=['A CUP LEFT WARM','A QUIET MILE','FREIGHT WAGON CACHE','LETTERS BENEATH A STONE','SALT WIND THROUGH THE REEDS'];
 for(const title of retired)R10_RETIRED_TITLES.add(title);
 for(const [road,cats] of Object.entries(R10_POOLS))for(const kind of Object.keys(cats))cats[kind]=cats[kind].filter(i=>!r10Retired(this.pool(road)[i].title));
 // These item definitions use the existing gear/food/crafting systems.
 Object.assign(GEAR,{
  'The River Before':{type:'accessory',rarity:'epic',questOnly:true,explorationXpBonus:.02,description:'A keepsake of the river before the fire. +2% exploration XP while equipped.'},
  'Roadhouse Hash':{type:'consumable',rarity:'uncommon',description:'A hearty roadhouse meal. Restores 25% maximum HP outside combat.'},
  'Crab Meat':{type:'material',rarity:'common',description:'Crab meat suitable for the existing cooking recipes.'}
 });
 if(!R18_FOOD_GROUPS.meat.includes('Crab Meat'))R18_FOOD_GROUPS.meat.push('Crab Meat');
 CRAFT_RECIPES.roadhouseHash={name:'Roadhouse Hash',rarity:'uncommon',food:['meat','vegetable'],bolts:0,type:'consumable',chance:1,seconds:120};
 function edit(title,name,text,actions,extra={}){
  const e=eastEncounters.find(e=>e.title===title);if(!e)throw Error('WO2 missing scenario: '+title);
  e.displayName=name;e.text=text;e.exclusive=false;e.wo2=true;e.combat=null;
  e.wo2NonTerminal=Object.keys(actions).filter(k=>/^(INSPECT|OBSERVE|SPEAK|ASK|TALK|READ|EXAMINE|SEARCH THE CAB|INVESTIGATE THE CARGO|INVESTIGATE THE SMOKE)/.test(k));
  e.choices=Object.keys(actions).concat('MOVE ON').join('   ');
  e.resolve=function(cmd){if(['move on','back away','leave'].includes(cmd)){add('You leave the scene and return to the road.','system');return true;}const action=actions[cmd.toUpperCase()];return action?action()!==false:false;};
  const rewardKeys={'ABANDONED SUPPLY TRUCK':'fresh','BROKEN TOLL CREW':'patrol','CARGO HIJACKERS':'crabTrap','FREIGHT CAR AMBUSH':'forklift','SMOKE BEYOND THE GUARDRAIL':'harold','SCRAP CRAB NEST':'crabNest'};
  const rewardKey=rewardKeys[title];
  if(rewardKey){const resolve=e.resolve;e.wo2Key=rewardKey;e.description=()=>registry.wo2State()[rewardKey]?name+' — the confrontation is over. The site has already been searched.':e.text;e.prompt=()=>registry.wo2State()[rewardKey]?'INSPECT AFTERMATH   MOVE ON':e.choices;e.resolve=function(cmd){if(registry.wo2State()[rewardKey]){if(['inspect aftermath','move on','leave','back away'].includes(cmd)){add('The site is quiet. There is nothing left to collect.');return true;}return false;}return resolve.call(this,cmd);};}
  Object.assign(e,extra);return e;
 }
 function clue(key,message){registry.wo2Once(key,()=>add(message,'bright'));}
 function salvage(key,xp,lo,hi,items,message){return registry.wo2Once(key,()=>{if(message)add(message,'reward');gainXp(xp);gainBolts(registry.wo2Roll(lo,hi));for(const item of items)registry.wo2Item(...item);});}
 const original=title=>({...eastEncounters.find(e=>e.title===title)?.combat});
 const military=original('BROKEN TOLL CREW'),machine=original('FREIGHT CAR AMBUSH'),swarm=original('CARGO HIJACKERS'),nest=original('SCRAP CRAB NEST');
 // 1. Retain original action keys so pending historical scenes still resolve.
 const courier=eastEncounters.find(e=>e.title==='A DRESSING IN THE DUST'),oldCourier=courier.resolve;
 edit('A DRESSING IN THE DUST','TOMMY BRIGGS — POSTAL ENCOUNTER',
  'A wounded courier guards a sealed mail satchel beside a wreck. “Tommy Briggs. Seaport postmaster—or I will be, when we can open the doors again. Miles Carter still keeps the mail moving.”',{
   'OFFER A BANDAGE':()=>{if(registry.wo2State().tommyHelp){add('Tommy’s wound is already dressed.');return true;}if(!hasItem('Bandage')){add('You need a Bandage.','system');return false;}registry.wo2State().tommyHelp=true;return oldCourier.call(courier,'offer a bandage');},
   'ASK ABOUT THE SATCHEL':()=>{oldCourier.call(courier,'ask about the satchel');clue('tommy','Tommy keeps the letters safe. He knows Miles Carter, and hopes to reopen the Seaport Post Office.');},
   'POINT OUT A SHELTERED SPOT':()=>oldCourier.call(courier,'point out a sheltered spot'),
   'ASK ABOUT MILES':()=>clue('tommy','TOMMY > Miles Carter is still carrying letters. Seaport needs a post office again. For now, I am keeping this mail safe.')
  });
 edit('ABANDONED SUPPLY TRUCK','FRESH MEAT',
  'A supply truck stands open. Hooks, a stained cutting board and scraps of clothing reveal what its butcher has been selling. A lone man grips a heavy cleaver. “Scavenger Camp’s up the road,” he says. “They taught me not to waste scraps.”',{
   'INSPECT THE TRUCK':()=>{add('The clothing among the butcher’s tools leaves no doubt: the meat was human. You can confront him or withdraw.','danger');return true;},
   'CONFRONT THE BUTCHER':()=>registry.wo2Fight('fresh',{...machine,name:'CANNIBAL BUTCHER',enemies:undefined,end:'The butcher collapses beside the truck.'}),
   'SEARCH THE CAB':()=>{add('The butcher blocks the cab. You must face him before searching the truck.');return true;},
   'INVESTIGATE THE CARGO':()=>{add('A butcher steps between you and the open cargo doors, cleaver raised.','danger');return true;}
  });
 edit('BROKEN TOLL CREW','THE LAST PATROL',
  'A surviving military sergeant holds a ruined checkpoint. A military drone jitters beside him, cycling through contradictory orders. He demands that you identify yourself; the drone cannot decide whether to stand down.',{
   'SPEAK TO THE SERGEANT':()=>{add('SERGEANT > This checkpoint still has a duty. The drone repeats his words, then warns him to surrender.','bright');return true;},
   'OBSERVE THE DRONE':()=>{add('The drone’s identification system is malfunctioning. The sergeant keeps his weapon trained on you while it argues with its own orders.');return true;},
   'FIGHT':()=>registry.wo2Fight('patrol',{...military,name:'THE LAST PATROL',enemies:military.enemies?.map((e,i)=>({...e,name:i?'MALFUNCTIONING MILITARY DRONE':'VETERAN SERGEANT'}))})
  });
 edit('CACHE UNDER THE MILEPOST','MILEPOST CACHE',
  'A repeated symbol marks a loose milepost. Beneath it, a dry cache holds wrapped supplies and a small trading tin.',{
   'LIFT THE CACHE LID':()=>{salvage('milepost',35,20,40,[['Bandage','consumable',1],['Wire','material',1]],'The cache contains a Bandage, Wire and trading Bolts.');if(!registry.wo2State().milepostGear){registry.wo2State().milepostGear=true;if(Math.random()<.15)v555AwardEquipmentDrop();}},
   'CHECK THE DRAINAGE SLOT':()=>salvage('milepost',35,20,40,[['Bandage','consumable',1],['Scrap Metal','material',1]],'You reach the cache from its dry drainage opening.')
  });
 edit('CARGO HIJACKERS','THE CRAB TRAP',
  'An abandoned cargo container rattles from within. A swarm of crabs spills through the gap when you approach. A service box lies behind the moving shells.',{
   'OBSERVE THE CONTAINER':()=>{add('The swarm guards the opening. You can fight your way to the abandoned cargo or leave it alone.');return true;},
   'FIGHT':()=>registry.wo2Fight('crabTrap',{...swarm,name:'CRAB SWARM',enemies:swarm.enemies?.map((e,i)=>({...e,name:i?'CRAB SWARM — REAR':'CRAB SWARM — FRONT'}))})
  });
 edit('LEAKING FREIGHT TANK','TOXIC CARGO',
  'Chemical cargo leaks around a freight tank. A service pouch hangs beside the valve; the upwind side offers a safer approach.',{
   'REACH FOR THE SERVICE POUCH':()=>{if(registry.wo2State().toxic){add('The service pouch has already been recovered.');return true;}r9CoastInjury(5);salvage('toxic',40,30,50,[['Wire','material',1],['Electronics','material',1],['Bandage','consumable',1]],'You recover the pouch through the fumes and retreat to clean air.');},
   'CIRCLE UPWIND':()=>{salvage('toxic',40,30,50,[['Wire','material',1],['Electronics','material',1],['Bandage','consumable',1]],'Keeping upwind, you work along the dry edge and recover the service pouch without entering the fumes.');}
  });
 edit('FREIGHT CAR AMBUSH','UNAUTHORIZED CARGO',
  'A driverless industrial forklift jerks out of a derailed freight car. Its warning speaker repeats UNAUTHORIZED CARGO while the forks rise toward you. Exposed service wiring trails behind its counterweight.',{
   'INSPECT THE FORKLIFT':()=>{add('The drive motor is live. There is no driver to reason with; the concrete cargo barriers provide cover.');return true;},
   'FIGHT':()=>registry.wo2Fight('forklift',{...machine,name:'MALFUNCTIONING FORKLIFT',enemies:undefined,end:'The forklift stops with its forks buried in the concrete.'}),
   'USE THE CARGO BARRIER':()=>{add('The forklift strikes the cargo barrier. Its rear housing buckles; you engage the damaged machine.');return registry.wo2Fight('forklift',{...machine,hp:Math.max(1,Math.floor(machine.hp*.9)),name:'MALFUNCTIONING FORKLIFT',enemies:undefined,end:'The forklift shudders to a stop behind the barrier.'});}
  });
 edit('SHUTTERED ROADSIDE CAFE','THE LAST SPECIAL — ROADHOUSE HASH',
  'The old roadhouse menu still advertises its last special: Roadhouse Hash. A grease-stained recipe card rests above a sealed pantry tin.',{
   'READ THE CHALK WALL':()=>{registry.wo2Once('hashRecipe',()=>{(player.flags.r11Learned||(player.flags.r11Learned={})).roadhouseHash=true;add('RECIPE LEARNED — ROADHOUSE HASH. Use the existing workbench with meat and a vegetable.','reward');});return true;},
   'PRY OPEN THE PANTRY':()=>{registry.wo2Once('hashRecipe',()=>{(player.flags.r11Learned||(player.flags.r11Learned={})).roadhouseHash=true;add('RECIPE LEARNED — ROADHOUSE HASH.','reward');});salvage('hash',40,25,40,[['Roadhouse Hash','consumable',registry.wo2Roll(1,2)]],'The pantry tin holds preserved portions of the roadhouse special and a small till pouch.');}
  });
 edit('SMOKE BEYOND THE GUARDRAIL','CLEANUP ON AISLE NINE',
  'Smoke drifts from the abandoned Fresh Mart grocery. Harold, its unstable manager, patrols the ruined aisles. “Employees only,” he says, gripping a weapon. An Employee Badge lies beside the manager’s desk.',{
   'TALK TO HAROLD':()=>{add('HAROLD > We are still open. We are always open. Keep your hands where I can see them.','bright');return true;},
   'ASK ABOUT THE BADGE':()=>{clue('haroldMet','Harold refuses to let anyone approach his desk. The badge is an old employee credential. Harold keeps glancing at it as if the store were still full of staff.');return true;},
   'FIGHT HAROLD':()=>registry.wo2Fight('harold',{...machine,name:'HAROLD — GROCERY MANAGER',enemies:undefined,end:'Harold drops his weapon among the fallen shelves.'}),
   'INVESTIGATE THE SMOKE':()=>{add('Harold blocks the aisle. You can speak to him, confront him or withdraw.');return true;},
   'OBSERVE FROM A DISTANCE':()=>{add('A manager still walks the ruined store. You remember the Fresh Mart sign.');registry.wo2State().freshMartClue=true;}
  });
 // Keep River of Fire's existing crossing and cloth choices, adding only the hidden discovery.
 const fire=eastEncounters.find(e=>e.title==='RIVER OF FIRE'),fireResolve=fire.resolve;
 fire.wo2=true;fire.choices+='   INSPECT THE RED MITTEN';
 fire.resolve=function(cmd){if(cmd!=='inspect the red mitten')return fireResolve.call(this,cmd);
  registry.wo2Once('riverBefore',()=>{add('Inside the mitten is a small keepsake marked 1969: a memory of the Cuyahoga River before the fire.','bright');registry.wo2Item('The River Before','accessory');});return true;};
 edit('RUINED SIGNAL HUT','SHATTERED GLASS',
  'Shattered automotive glass surrounds the ruined hut. Beneath a tarp lies a damaged windshield with the distinctive curve of Murphy’s old Corvette.',{
   'OPEN THE CABINET':()=>{registry.wo2Once('windshield',()=>{registry.wo2Item('Damaged Corvette Windshield','quest');registry.wo2Item('Cloth','material');registry.wo2Item('Scrap Metal','material');add('You protect the damaged windshield for Murphy and recover usable repair materials. It is not roadworthy yet; Murphy will need to examine it.','reward');});},
   'EXAMINE THE BOOTPRINTS':()=>{clue('windshieldClue','The tarp protected a Corvette windshield. Murphy may recognize the part. The glass will need careful work.');return true;}
  });
 edit('SCRAP CRAB NEST','SCRAP CRAB NEST',
  'A large Nest Guardian rises from shipping wreckage. Crab shells and loose metal surround the nesting hollow; a ruined equipment pouch is caught beneath a drum.',{
   'INSPECT THE NEST':()=>{add('One large crab guards the hollow. The metal and equipment pouch belong to the wreck, not the creature.');return true;},
   'FIGHT':()=>registry.wo2Fight('crabNest',{...nest,name:'NEST GUARDIAN',enemies:undefined,end:'The guardian falls among the shipping drums.'})
  });
 // Preserve pre-existing mechanics while adding only documented future clues.
 for(const [title,name,key,message] of [
  ['THE SINKING CAUSEWAY','THE LOST CONVOY','northernRidge','Abandoned convoy markings name Northern Ridge. The trail ends here; you cannot establish a safe onward route.'],
  ['THE STRANDED HANDCART','THE LAST STOP','abandonedMotel','The traveler recalls an Abandoned Motel as the last stop of the journey. You note the name among the clues from the handcart.'],
  ['THE WASHED-OUT SHOULDER','THE WASHED-OUT SHOULDER','watchtowerRuins','Beyond the washed-out shoulder, a broken lookout silhouette suggests Watchtower Ruins. You record the clue without leaving the highway.']
 ]){
  const e=eastEncounters.find(e=>e.title===title),prior=e.resolve;
  e.wo2=true;e.displayName=name;e.text+=' '+message;
  e.choices+='   INSPECT THE DISCOVERY';e.resolve=function(cmd){if(cmd==='inspect the discovery'){clue(key,message);return true;}return prior.call(this,cmd);};
 }
 // Preserve the existing Broken Bridge / New Dominion reference without inventing a mission.
 const bridge=eastEncounters.find(e=>e.title==='THE ROADSIDE MEASURING WALL');
 bridge.wo2Connection=true;bridge.text+=' A faded direction beside the markings names Broken Bridge. New Dominion is mentioned in a later scrawl; the rest is unreadable.';
},
// Work Order 3 — six bounded revisions and their required dependencies.
wo3Needs(part){
 const q=player.flags.wo3Corvette;if(!q?.active)return false;
 if(part==='battery')return !this.wo2State().wo3Battery&&!hasItem('Corvette Battery');
 return !this.wo2State().windshield&&!hasItem('Damaged Corvette Windshield');
},
wo3Pick(region,kind,candidates,rng){
 const desired=kind==='salvage'&&this.wo3Needs('battery')?'OVERTURNED MAINTENANCE CART':kind==='exploration'&&this.wo3Needs('windshield')?'RUINED SIGNAL HUT':null;
 if(!desired)return undefined;
 const index=candidates.find(i=>this.pool(region)[i].title===desired);if(index===undefined)return undefined;
 const q=player.flags.wo3Corvette,key=kind==='salvage'?'batteryDraws':'windshieldDraws';
 q[key]=(Number(q[key])||0)+1;
 // Keep category weights and eligibility. Within the eligible category, use
 // 12x weight and force by its third draw; recent history cannot starve a part.
 if(q[key]>=3)return index;
 let roll=rng()*(candidates.length+11);
 for(const i of candidates){roll-=i===index?12:1;if(roll<0)return i;}
 return candidates[candidates.length-1];
},
wo3Award(key){
 const r=this;
 if(key==='stalker')return this.wo2Once('wo3Stalker',()=>{gainXp(100);gainBolts(r.wo2Roll(20,30));r.wo2Item('Wire');r.wo2Item('Scrap Metal');add('The crawler falls. A culvert maintenance pouch holds Bolts and useful salvage.','reward');});
 if(key==='drone')return this.wo2Once('wo3Drone',()=>{gainXp(110);gainBolts(r.wo2Roll(25,40));r.wo2Item('Electronics');r.wo2Item('Wire');add('The drone stops. You recover electronic components and a service-case cache of Bolts.','reward');});
 if(key==='dogs')return this.wo2Once('wo3Dogs',()=>{gainXp(90);r.wo2Item('Cloth');r.wo2Item('Scrap Metal');if(Math.random()<.5)r.wo2Item('Animal Fat');add('The marsh dogs fall. Their den holds scraps of abandoned supplies; useful fat can be recovered from the animals. No currency comes from the dogs.','reward');});
},
wo3Fight(key,spec){
 const flag={stalker:'wo3Stalker',drone:'wo3Drone',dogs:'wo3Dogs'}[key];
 if(this.wo2State()[flag]){add('This confrontation is already resolved.','system');return true;}
 startCombat({...spec,xp:0,bolts:0,enemies:spec.enemies?.map(e=>({...e,bolts:0})),wo3Reward:key,wo2NoEquipment:true},'encounter');return true;
},
wo3Tactic(cmd,c){
 if(c?.wo3Drone&&cmd==='shoot floodlight'){
  if(c.wo3LightShot){add('The floodlight is already destroyed.');return true;}
  if(!r18EquippedRanged()){add('You need an equipped ranged weapon to shoot the floodlight.','system');return true;}
  c.wo3LightShot=true;add('Your shot destroys the floodlight. The drone loses tracking accuracy.','bright');combatRetaliation(c);return true;
 }
 if(c?.wo3Drone&&cmd==='take container cover'){c.wo3Cover=true;add('You duck behind a shipping container for this exchange.','bright');combatRetaliation(c);return true;}
 if(c?.wo3Crawler&&cmd==='expose underside'){
  if(c.armorDef===0){add('Its underside is already exposed.');return true;}
  c.armorDef=0;add('You draw the crawler across broken concrete, exposing its underside. It strikes while you reposition.','danger');combatRetaliation(c);return true;
 }
 return false;
},
wo3(){
 const r=this;
 function scene(title,name,text,actions,doneFlag){
  const e=eastEncounters.find(e=>e.title===title);if(!e)throw Error('Missing WO3 '+title);
  e.displayName=name;e.text=text;e.wo3=true;e.combat=null;e.exclusive=false;
  e.wo2NonTerminal=Object.keys(actions).filter(k=>/^(INSPECT|OBSERVE|EXAMINE)/.test(k));
  e.choices=Object.keys(actions).concat('MOVE ON').join('   ');
  e.description=()=>doneFlag&&r.wo2State()[doneFlag]?name+' — the site is quiet and the one-time supplies have been collected.':e.text;
  e.prompt=()=>doneFlag&&r.wo2State()[doneFlag]?'INSPECT AFTERMATH   MOVE ON':e.choices;
  e.resolve=function(cmd){if(['move on','back away','leave','leave untouched','inspect aftermath'].includes(cmd)){add('You leave the site undisturbed.');return true;}
   if(doneFlag&&r.wo2State()[doneFlag]){add('There is nothing left to collect.');return true;}
   const action=actions[cmd.toUpperCase()];return action?action()!==false:false;};return e;
 }
 const original=t=>({...eastEncounters.find(e=>e.title===t)?.combat});
 const crawler=original('DRAINAGE STALKER'),drone=original('FLOODLIGHT SWEEP'),dogs=original('SALT MARSH HUNTERS');
 scene('DRAINAGE STALKER','CULVERT CRAWLER',
  'A plated Culvert Crawler hauls itself from the drain. Its armored back blocks the narrow approach; when it climbs broken concrete, its softer underside turns toward you.',{
   'INSPECT THE CRAWLER':()=>{add('The plates blunt attacks. Drawing it over the rubble will expose the underside, but lets it strike while you reposition.');return true;},
   'FIGHT':()=>r.wo3Fight('stalker',{...crawler,name:'CULVERT CRAWLER',armorDef:2,wo3Crawler:true}),
   'EXPOSE THE UNDERSIDE':()=>{add('You draw it over broken concrete and attack the exposed underside.');return r.wo3Fight('stalker',{...crawler,name:'CULVERT CRAWLER',armorDef:0,wo3Crawler:true});}
  },'wo3Stalker');
 function lookoutLoot(risky){
  if(r.wo2State().wo3Lookout){add('The lookout cache is empty.');return true;}
  if(risky&&Math.random()<.35){r9CoastInjury(6);add('A rotten section gives way. You catch the rail, bruised, before reaching the cache.','danger');}
  r.wo2Once('wo3Lookout',()=>{gainXp(35);gainBolts(r.wo2Roll(25,50));r.wo2Item('Cloth','material',risky?r.wo2Roll(2,4):1);r.wo2Item('Bandage','consumable');
   if(risky&&Math.random()<.20){const level=Math.max(1,Math.min(50,Number(player.level)||1)),pool=EQUIPMENT_CATALOG.filter(d=>['common','uncommon'].includes(d.rarity)&&['weapon','armor'].includes(d.type)&&!GEAR[d.name]?.questOnly&&level>=d.minLevel&&level<=d.maxLevel);if(pool.length){const d=pool[Math.floor(Math.random()*pool.length)];r.wo2Item(catalogInstanceName(d,level),d.type);}}
   add('The lookout supply tin holds Bolts, Cloth and a Bandage.','reward');});return true;
 }
 scene('FALLING WATCH PLATFORM','COLLAPSING LOOKOUT',
  'A lookout platform sags above the highway. A supply tin is caught in its upper braces; loose Cloth hangs within reach from the concrete edge.',{
   'INSPECT THE SUPPORTS':()=>{add('Climbing risks a collapse but gives access to more Cloth and possible equipment. Pulling the loose cache down from the concrete edge is safer.');return true;},
   'CLIMB THE PLATFORM':()=>lookoutLoot(true),
   'PULL DOWN THE LOOSE CLOTH':()=>lookoutLoot(false),
   'PASS UNDER THE CONCRETE EDGE':()=>{add('You pass beneath the solid abutment without taking the cache.');return true;}
  },'wo3Lookout');
 scene('FLOODLIGHT SWEEP','FLOODLIGHT SWEEP',
  'An industrial security drone sweeps the loading ramp with a harsh floodlight. Shipping containers offer cover; a precise ranged shot could destroy the light and disrupt its tracking.',{
   'INSPECT THE DRONE':()=>{add('With its floodlight destroyed, tracking damage is reduced and alternate volleys miss. Container cover halves the next tracked volley.');return true;},
   'FIGHT':()=>r.wo3Fight('drone',{...drone,wo3Drone:true}),
   'SHOOT THE FLOODLIGHT':()=>{if(!r18EquippedRanged()){add('Equip a ranged weapon before attempting the shot.','system');return false;}return r.wo3Fight('drone',{...drone,wo3Drone:true,wo3LightShot:true});},
   'USE SHIPPING CONTAINERS FOR COVER':()=>r.wo3Fight('drone',{...drone,wo3Drone:true,wo3Cover:true})
  },'wo3Drone');
 function trapLoot(disarmed){r.wo2Once('wo3TrapLoot',()=>{if(disarmed)gainXp(40);gainBolts(r.wo2Roll(20,35));r.wo2Item('Bandage','consumable');r.wo2Item('Scrap Metal');r.wo2Item('Wire');add('The locker holds a Bandage, mechanical salvage and a small pouch of Bolts.','reward');});return true;}
 scene('LOCKER IN THE CONCRETE PIPE','THE SPRING TRAP',
  'A loaded spring is wired across a locker inside the concrete pipe. Careful disarming can preserve the mechanism; forcing the lid may fire it into your hand.',{
   'INSPECT THE WARNING':()=>{add('The arrow points to a spring trigger. Disarm it carefully, force the lid at risk of injury, or leave it untouched.');return true;},
   'DISARM THE MECHANISM':()=>{if(r.wo2State().wo3TrapSprung){add('The spring has already fired; you recover the contents without a disarming reward.');return trapLoot(false);}if(Math.random()<.65){add('You release the spring safely.','reward');return trapLoot(true);}r.wo2State().wo3TrapSprung=true;r9CoastInjury(4);add('The spring snaps against your wrist. It is now spent, but you have not recovered the contents.','danger');return true;},
   'FORCE THE LID':()=>{if(!r.wo2State().wo3TrapSprung&&Math.random()<.5){r9CoastInjury(6);add('The spring strikes your hand as the lid opens.','danger');}r.wo2State().wo3TrapSprung=true;return trapLoot(false);},
   'LEAVE UNTOUCHED':()=>true
  },'wo3TrapLoot');
 const cart=eastEncounters.find(e=>e.title==='OVERTURNED MAINTENANCE CART'),legacyCart=cart.resolve;
 function battery(cmd){
  if(!r.wo3Needs('battery'))return legacyCart.call(cart,cmd==='recover corvette battery'?'search the tool tray':cmd);
  r.wo2Once('wo3Battery',()=>{r.wo2Item('Corvette Battery','quest');r.wo2Item('Wire');r.wo2Item('Scrap Metal');gainXp(30);gainBolts(r.wo2Roll(15,30));add('The battery matches Murphy’s requested Corvette part. You secure it with the cart’s wire and scrap.','reward');});return true;
 }
 scene('OVERTURNED MAINTENANCE CART','OVERTURNED MAINTENANCE CART',
  'A maintenance cart lies beside the highway. Its battery cradle is intact; tools and recoverable materials remain in the tray.',{
   'STRIP THE BATTERY LEADS':()=>battery('strip the battery leads'),
   'SEARCH THE TOOL TRAY':()=>battery('search the tool tray'),
   'RECOVER CORVETTE BATTERY':()=>{if(!r.wo3Needs('battery')){add('You do not need another battery. The tray still holds ordinary salvage.');return true;}return battery('recover corvette battery');}
  });
 GEAR['Animal Fat']={type:'material',rarity:'common',description:'Recovered animal fat; keep it with other crafting materials.'};
 function food(){const item=player.pack.find(i=>i.qty>0&&i.type==='consumable'&&!i.protected&&!i.unique&&['Energy Bars','Preserved Meat'].includes(i.name));if(!item){add('You need an Energy Bar or Preserved Meat to distract the pack.','system');return false;}if(!removeItem(r18ItemLabel(item)))return false;r.wo2Once('wo3Dogs',()=>{r.wo2Item('Cloth');add('The dogs follow the food away from the den. You recover abandoned Cloth and pass without fighting.');});return true;}
 scene('SALT MARSH HUNTERS','MARSH DOG PACK',
  'Two lean marsh dogs close from opposite sides. One holds your attention while the other circles toward your flank. Their den contains scraps dragged from abandoned roadside supplies.',{
   'OBSERVE THE PACK':()=>{add('The circling dog presses harder while the lead dog is standing. Food may draw them away; intimidation risks provoking an attack.');return true;},
   'FIGHT':()=>r.wo3Fight('dogs',{...dogs,r18DogPack:true,enemies:dogs.enemies.map((e,i)=>({...e,name:i?'MARSH DOG':'PACK LEADER'}))}),
   'INTIMIDATE THE PACK':()=>{if(Math.random()<.5){r.wo2Once('wo3Dogs',()=>{r.wo2Item('Scrap Metal');add('The dogs back away. You take a piece of metal from the abandoned den supplies and keep moving.');});return true;}add('The pack answers your challenge by lunging.','danger');return r.wo3Fight('dogs',{...dogs,r18DogPack:true,enemies:dogs.enemies.map((e,i)=>({...e,name:i?'MARSH DOG':'PACK LEADER'}))});},
   'DISTRACT WITH FOOD':food
  },'wo3Dogs');
 // Extend Murphy's existing conversation, not the vehicle or turn-in systems.
 const priorTalk=murphyTalkMenu;murphyTalkMenu=function(){priorTalk();add('ASK ABOUT CORVETTE PARTS','system');};
 const priorSolace=handleSolace;handleSolace=function(cmd,...args){if(mercyLocation==='murphy'&&cmd==='ask about corvette parts'){
  const q=player.flags.wo3Corvette||(player.flags.wo3Corvette={active:true,batteryDraws:0,windshieldDraws:0});q.active=true;
  add('MURPHY > Keep an eye out for a usable battery and that curved Corvette windshield. I can set parts aside long before she is ready for the road.','bright');
  const needed=[...(r.wo3Needs('battery')?['Corvette Battery']:[]),...(r.wo3Needs('windshield')?['Damaged Corvette Windshield']:[])];add(needed.length?'PARTS STILL NEEDED: '+needed.join(', '):'Requested parts secured.','system');return murphyTalkMenu();}
  return priorSolace(cmd,...args);};
 this.wo3Installed=true;
},
// Work Order 4 — four final revisions and directly required interior/loot hooks.
wo4Equipment(rarities,subtype){
 const level=Math.max(1,Math.min(50,Number(player.level)||1));
 const pool=EQUIPMENT_CATALOG.filter(d=>rarities.includes(d.rarity)&&d.type==='weapon'&&(!subtype||new RegExp(subtype,'i').test(d.subtype||''))&&level>=d.minLevel&&level<=d.maxLevel&&!GEAR[d.name]?.questOnly);
 if(!pool.length)return false;const d=pool[Math.floor(Math.random()*pool.length)];this.wo2Item(catalogInstanceName(d,level),'weapon');return true;
},
wo4Award(key){
 const r=this;
 if(key==='sniper')return this.wo2Once('wo4Sniper',()=>{gainXp(110);gainBolts(r.wo2Roll(30,45));r.wo2Item('Rifle Ammunition','material',r.wo2Roll(3,6));if(Math.random()<.25)r.wo4Equipment(['common','uncommon'],'rifle');add('You recover ammunition and Bolts from the sniper’s belongings.','reward');});
 if(key==='bear')return this.wo2Once('wo4Bear',()=>{gainXp(Math.max(60,Math.max(1,Math.min(50,Number(player.level)||1))*12));r.wo2Item('Bear Meat','material',r.wo2Roll(2,4));r.wo2Item('Animal Hide');r.wo2Item('Animal Bones');(player.flags.r11Learned||(player.flags.r11Learned={})).hideLining=true;add('Bear Meat can be used in your existing cooking recipes. You learn to prepare Animal Hide into Cloth at the existing workbench.','reward');});
 if(key==='hospital'){const q=this.wo4Hospital();q.cleared=true;return this.wo2Once('wo4HospitalEntrance',()=>{gainXp(45);gainBolts(r.wo2Roll(25,50));add('The entrance is secure. A reception cashbox holds old trading Bolts.','reward');});}
},
wo4Retreat(c){
 const odds=c.wo4Sniper?.35:.30;
 if(Math.random()<odds){const damage=scaledEnemyDamage(Math.floor((c.min+c.max)/2),armorDefense(),c.level);hurt(damage);add(c.wo4Sniper?'The sniper fires during your withdrawal.':'The bear lunges as you withdraw.','danger');if(stage==='fallen'||!combatState)return true;}
 combatState=null;add('You escape without combat rewards.','system');completeRoadTurn();return true;
},
wo4Tactic(cmd,c){
 if((c.wo4Sniper||c.wo4Bear)&&['back away','back off','b','retreat','flee','run','back'].includes(cmd))return this.wo4Retreat(c);
 if(!c.wo4Sniper)return false;
 if(cmd==='find cover'){c.wo4SniperCover=true;c.wo4Located=true;add('From behind an abandoned vehicle, you locate the sniper’s firing position.','bright');combatRetaliation(c);return true;}
 if(cmd==='return fire'){
  if(!r18EquippedRanged()){add('Equip a ranged weapon to return fire.','system');return true;}
  c.wo4SniperCover=false;if(Math.random()<.35)c.wo4Suppressed=true;add('You fire from an exposed position, trying to disrupt the sniper.','system');handleCombat('attack');return true;
 }
 if(cmd==='flank sniper'){
  if(c.wo4Closed){add('You have already closed the distance.');return true;}
  if(Math.random()<(c.wo4Located?.80:.60)){c.wo4Closed=true;c.wo4SniperCover=false;add('You move between cover positions and reach the sniper’s level. The rifle loses its range advantage.','bright');}
  else {c.wo4SniperCover=false;add('The sniper tracks you between cover positions.','danger');}combatRetaliation(c);return true;
 }
 return false;
},
wo4Hospital(){return player.flags.wo4Hospital||(player.flags.wo4Hospital={discovered:false,cleared:false,weaponClaimed:false,searchDay:0,searches:{},totalSearches:0});},
wo4HospitalAvailable(){
 const q=player.flags.wo4Hospital;if(!q?.discovered)return false;const g=typeof lanternState==='function'?lanternState():null;
 if(q.edge)return !!g&&g.currentEdgeId===q.edge&&g.stepIndex===q.step;
 if(q.node)return !!g&&!g.currentEdgeId&&g.nodeId===q.node;
 return !g&&q.legacyGoal===roadGoal&&q.legacyTurn===roadTurn;
},
wo4DiscoverHospital(){
 const q=this.wo4Hospital();if(q.discovered)return this.wo4HospitalAvailable();
 const g=typeof lanternState==='function'?lanternState():null;
 Object.assign(q,{discovered:true,...(g?.currentEdgeId?{edge:g.currentEdgeId,step:g.stepIndex}:g?{node:g.nodeId}:{legacyGoal:roadGoal,legacyTurn:roadTurn})});
 add('DISCOVERED — ST. MERCY HOSPITAL. You mark its entrance beside this stretch of highway.','reward');return true;
},
wo4HospitalEnter(fromEncounter=false){
 if(!this.wo4DiscoverHospital()){add('St. Mercy’s entrance is back at the road segment where you marked it.','system');return false;}
 const q=this.wo4Hospital();q.returnStage=fromEncounter?'encounter':stage;q.fromEncounter=fromEncounter;q.interior=true;
 if(!q.cleared)return this.wo4HospitalFight();this.wo4HospitalMenu();return true;
},
wo4HospitalFight(){
 if(this.wo4Hospital().cleared){this.wo4HospitalMenu();return true;}
 const level=Math.max(1,Math.min(50,Number(player.level)||1));
 startCombat({name:'HOSPITAL ENTRANCE SQUATTER',level,hp:Math.max(25,Math.floor(baseHpForLevel(level)*.32)),min:3,max:7,xp:0,bolts:0,wo4Reward:'hospital',end:'The armed squatter abandons the entrance.'},'wo4HospitalEntrance');return true;
},
wo4HospitalMenu(){
 const q=this.wo4Hospital();stage='wo4Hospital';q.interior=true;add('ST. MERCY HOSPITAL — WARD OF THE FORGOTTEN','place');
 add(q.cleared?'The enormous complex stretches beyond the reception hall. Most rooms have been picked over, but sealed cupboards and overlooked supplies remain.':'An armed squatter still holds the entrance. The deeper wards remain inaccessible.','system');
 const date=Math.max(Number(q.searchDay)||0,Number(day)||1);if(q.searchDay!==date){q.searchDay=date;q.searches={};}
 if(q.cleared){add('DAILY SEARCHES: ER '+(q.searches.er||0)+'/2, PHARMACY '+(q.searches.pharmacy||0)+'/2, SECURITY '+(q.searches.security||0)+'/2. Each search costs one action turn.','system');r5DirectChoices(['SEARCH EMERGENCY ROOM','SEARCH PHARMACY','SEARCH SECURITY OFFICE','RETURN TO HIGHWAY']);}
 else r5DirectChoices(['CONFRONT ENTRANCE SQUATTER','RETURN TO HIGHWAY']);
},
wo4HospitalLeave(){
 const q=this.wo4Hospital();q.interior=false;
 if(q.fromEncounter){q.fromEncounter=false;completeRoadTurn();return;}
 if(q.returnStage==='lanternNode')return lanternNodeMenu();if(q.returnStage==='lanternRoad')return lanternRoadMenu();
 stage=q.returnStage||'between';renderCurrentChoices();
},
wo4HospitalSearch(area){
 const q=this.wo4Hospital();if(!q.cleared){add('The entrance is not secure.','danger');return this.wo4HospitalMenu();}
 const today=Math.max(Number(q.searchDay)||0,Number(day)||1);if(q.searchDay!==today){q.searchDay=today;q.searches={};}
 if((q.searches[area]||0)>=2){add('You have searched this area enough today.','system');return this.wo4HospitalMenu();}
 if(!spendTurn()){add('No action turns remain for searching.','danger');return this.wo4HospitalMenu();}
 q.searches[area]=(q.searches[area]||0)+1;q.totalSearches=(Number(q.totalSearches)||0)+1;
 if(area==='security'&&!q.weaponClaimed){
  // Flag remains permanent across day resets. Full packs use the shared queue.
  if(this.wo4Equipment(['uncommon'])){q.weaponClaimed=true;add('The secured locker contains one Uncommon weapon. Its weapon compartment is now empty.','reward');}
 }
 const chance=Math.max(.15,.85-.08*Math.floor((q.totalSearches-1)/3));
 if(Math.random()<chance){
  if(area==='er'){const medical=Math.random()<.70;this.wo2Item(medical?'Bandage':'Cloth',medical?'consumable':'material');}
  else if(area==='pharmacy'){const roll=Math.random();this.wo2Item(roll<.06?'Emergency Trauma Kit':roll<.25?'Reinforced Bandage':'Bandage','consumable');}
  else {this.wo2Item(Math.random()<.5?'Rifle Ammunition':'Scrap Metal');}
  add('You recover an overlooked supply. Most nearby cupboards have already been stripped.','reward');
 }else add('You search carefully, but find nothing usable. The remaining supplies are getting harder to locate.','system');
 this.wo4HospitalMenu();
},
wo4(){
 const r=this,oldSniper={...eastEncounters[63].combat};
 Object.assign(GEAR,{
  'Rifle Ammunition':{type:'material',rarity:'common',description:'Recovered rifle cartridges, packed for safe carrying and trade.'},
  'Bear Meat':{type:'material',rarity:'common',description:'Bear meat usable in existing meat-based cooking recipes.'},
  'Animal Hide':{type:'material',rarity:'common',description:'Prepare into Cloth with the existing workbench recipe.'}
 });
 VENDOR_BASE['Rifle Ammunition']=10;
 if(!R18_FOOD_GROUPS.meat.includes('Bear Meat'))R18_FOOD_GROUPS.meat.push('Bear Meat');
 CRAFT_RECIPES.hideLining={name:'Cloth',rarity:'common',hide:1,bolts:0,type:'material',chance:1,seconds:30};
 function edit(index,name,text,actions,key){
  const e=eastEncounters[index];e.displayName=name;e.text=text;e.combat=null;e.exclusive=false;e.wo4=true;e.wo2NonTerminal=Object.keys(actions).filter(k=>/^(EXAMINE|INSPECT|OBSERVE)/.test(k));
  e.choices=Object.keys(actions).concat('LEAVE').join('   ');if(key){e.prompt=()=>r.wo2State()[key]?'INSPECT AFTERMATH   LEAVE':e.choices;e.description=()=>r.wo2State()[key]?name+' — the confrontation is over.':e.text;}e.resolve=function(cmd){if(['leave','move on','back away'].includes(cmd)){add('You leave the scene.');return true;}if(key&&r.wo2State()[key]){add('This encounter has already been resolved.');return true;}const action=actions[cmd.toUpperCase()];return action?action()!==false:false;};return e;
 }
 function sniper(mode){
  if(mode==='fire'&&!r18EquippedRanged()){add('You need an equipped ranged weapon to return fire.','system');return false;}
  const spec={...oldSniper,xp:0,bolts:0,wo4Reward:'sniper',wo4Sniper:true,wo2NoEquipment:true,wo4SniperCover:mode==='cover',wo4Located:mode==='cover'};
  if(mode==='flank')spec.wo4Closed=Math.random()<.60;
  if(mode==='fire')spec.wo4Suppressed=Math.random()<.35;
  startCombat(spec,'encounter');if(mode==='flank'&&!spec.wo4Closed)combatRetaliation(combatState);return true;
 }
 edit(63,'TACTICAL SNIPER','A rifle shot strikes the pavement beside you. The second shot comes from an elevated firing position. A hostile sniper is tracking you across the open highway.',{
  'FIND COVER':()=>sniper('cover'),'RETURN FIRE':()=>sniper('fire'),'FLANK THE SNIPER':()=>sniper('flank'),
  'RETREAT':()=>{if(Math.random()<.35){hurt(scaledEnemyDamage(Math.floor((oldSniper.min+oldSniper.max)/2),armorDefense(),oldSniper.level));add('A withdrawal shot strikes as you run for cover.','danger');}return true;},'FIGHT':()=>sniper('normal')
 },'wo4Sniper');
 const hospital=edit(81,'WARD OF THE FORGOTTEN','An overgrown access path reveals the faded sign of St. Mercy Hospital. Beyond a damaged entrance stands an enormous, silent medical complex. A human silhouette moves behind the reception desk.',{
  'EXAMINE THE ENTRANCE':()=>{r.wo4DiscoverHospital();add('An armed squatter guards the lobby. Medical cupboards and security doors lie beyond him.');return true;},
  'ENTER ST MERCY HOSPITAL':()=>r.wo4HospitalEnter(true)
 });hospital.category='exploration';
 function bearSpec(){const level=Math.max(1,Math.min(50,Number(player.level)||1));return {name:'WILD BEAR',level,hp:Math.max(60,Math.floor(baseHpForLevel(level)*.65)),min:7,max:13,xp:0,bolts:0,wo4Bear:true,wo4Reward:'bear',wo2NoEquipment:true,end:'The bear falls beside the deserted road.'};}
 function bear(){if(r.wo2State().wo4Bear){add('The bear is gone.');return true;}startCombat(bearSpec(),'encounter');return true;}
 const wild=edit(75,'WILD BEAR','A large wild bear steps into a deserted stretch of road. It lowers its head and advances, powerful shoulders rolling beneath its hide.',{
  'FIGHT':bear,'ATTEMPT TO SCARE IT AWAY':()=>{if(Math.random()<.4){add('The bear backs into the brush. You continue without combat rewards.');return true;}bear();combatRetaliation(combatState);return true;},
  'RETREAT':()=>{if(Math.random()<.30){const spec=bearSpec();hurt(scaledEnemyDamage(10,armorDefense(),spec.level));add('The bear lunges while you withdraw.','danger');}return true;}
 },'wo4Bear');wild.category='combat';wild.futureRegion='Northern Ridge';
 const wall=eastEncounters[77],priorWall=wall.resolve;
 wall.wo4=true;wall.displayName='THE BROKEN BRIDGE DISCOVERY';
 wall.text+=' The marks appear to record changing loads and cracks in damaged infrastructure. Someone has been studying whether Broken Bridge can carry weight.';
 wall.choices+='   EXAMINE THE MEASUREMENTS   SEARCH FOR ADDITIONAL EVIDENCE';
 wall.wo2NonTerminal=['EXAMINE THE MEASUREMENTS'];wall.exclusive=false;
 wall.resolve=function(cmd){if(['examine the measurements','search for additional evidence'].includes(cmd)){
  r.wo2State().wo4BrokenBridge=true;add('DISCOVERY — BROKEN BRIDGE. The measurements chart structural damage; a newer note suggests New Dominion is also watching the site. You record the clue without opening an onward route.','bright');
  if(cmd==='search for additional evidence')r.wo2Once('wo4BridgeSalvage',()=>r.wo2Item('Scrap Metal'));return true;
 }return priorWall.call(this,cmd);};
 // Explicitly approved category replacements, with no slot changes or duplicates.
 for(const [road,cats] of Object.entries(R10_POOLS))for(const [title,kind] of [['THE LONG SHADOWS','exploration'],['THE REPEATING SIGNAL','combat']]){
  const slots=r.pool(road),index=slots.findIndex(e=>e.title===title);for(const k of Object.keys(cats))cats[k]=cats[k].filter(i=>i!==index);cats[kind].push(index);
 }
 const candidates=r10Candidates;r10Candidates=function(road,kind){return candidates(road,kind).filter(i=>!(r.pool(road)[i].title==='THE LONG SHADOWS'&&player.flags.wo4Hospital?.discovered));};
 const roadMenu=lanternRoadMenu;lanternRoadMenu=function(){roadMenu();if(r.wo4HospitalAvailable())lanternAppendChoices(['VISIT ST MERCY HOSPITAL']);};
 const nodeMenu=lanternNodeMenu;lanternNodeMenu=function(){nodeMenu();if(r.wo4HospitalAvailable())lanternAppendChoices(['VISIT ST MERCY HOSPITAL']);};
 const render=renderCurrentChoices;renderCurrentChoices=function(){if(stage==='wo4Hospital')return r.wo4HospitalMenu();return render();};
 const core=handleCommandCore;handleCommandCore=async function(raw){const cmd=r5Mapped(raw);if(!busy&&stage==='wo4Hospital'&&!/^(save|load|inventory|status|map|quests|help|use)(?: |$)/.test(cmd)){
  if(cmd==='return to highway')return r.wo4HospitalLeave();if(cmd==='confront entrance squatter')return r.wo4HospitalFight();
  const area={'search emergency room':'er','search pharmacy':'pharmacy','search security office':'security'}[cmd];if(area)return r.wo4HospitalSearch(area);return r.wo4HospitalMenu();}
  if(!busy&&cmd==='visit st mercy hospital'&&['lanternRoad','lanternNode'].includes(stage)&&r.wo4HospitalAvailable())return r.wo4HospitalEnter(false);return core(raw);};
 const load=loadGame;loadGame=function(slot){const data=getSaveData(slot),result=load(slot);if(data?.stage==='wo4Hospital'&&player.flags.wo4Hospital?.discovered)r.wo4HospitalMenu();return result;};
 const journal=showQuests;showQuests=function(){journal();const q=player.flags.wo4Hospital;if(q?.discovered){const e=q.edge&&LG_EDGES[q.edge],where=e?LG_NODES[e.a].name+' ↔ '+LG_NODES[e.b].name+', position '+q.step+' / '+e.distanceTurns:q.node&&LG_NODES[q.node]?LG_NODES[q.node].name:'its recorded approach';add('DISCOVERED SITE — ST. MERCY HOSPITAL: '+where+'. '+(q.cleared?'Entrance cleared.':'Entrance still guarded.'),'system');}if(r.wo2State().wo4BrokenBridge)add('BROKEN BRIDGE — structural measurements and a New Dominion note. No onward route established.','system');};
 this.wo4Installed=true;
},
};

// WO6 authoritative geographical classification. Definitions above are unchanged.
RoadScenarioRegistry.regionalSpec = {
 "version": 1,
 "regions": [
  "NORTH",
  "WEST",
  "CENTRAL",
  "INDUSTRIAL",
  "LOWLANDS",
  "EAST",
  "SEAPORT"
 ],
 "encounters": [
  {
   "number": 1,
   "id": "early:4",
   "legacyName": "ROADBLOCK",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 2,
   "id": "early:6",
   "legacyName": "THE STRAY",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 3,
   "id": "early:7",
   "legacyName": "THE DARK CELLAR",
   "classification": "REGIONAL",
   "regions": [
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 4,
   "id": "early:13",
   "legacyName": "HIGHWAY ROBBERS",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 5,
   "id": "early:15",
   "legacyName": "ROACH NEST",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 6,
   "id": "early:16",
   "legacyName": "TUNNEL RATS",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 7,
   "id": "early:17",
   "legacyName": "FERAL DOG",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 8,
   "id": "early:18",
   "legacyName": "LONE SCAVENGER",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 9,
   "id": "early:19",
   "legacyName": "GANG LOOKOUT",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 10,
   "id": "early:20",
   "legacyName": "THE CRAWLER",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 11,
   "id": "early:21",
   "legacyName": "SECURITY DRONE",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 12,
   "id": "early:22",
   "legacyName": "THE WRECKERS",
   "classification": "REGIONAL",
   "regions": [
    "INDUSTRIAL"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 13,
   "id": "early:29",
   "legacyName": "SALT ON THE ROAD",
   "classification": "REGIONAL",
   "regions": [
    "NORTH"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 14,
   "id": "early:39",
   "legacyName": "THE PAINTED ARROWS",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 15,
   "id": "early:46",
   "legacyName": "IRRADIATED ROACHES",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 16,
   "id": "early:47",
   "legacyName": "RATS IN THE PANTRY",
   "classification": "REGIONAL",
   "regions": [
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 17,
   "id": "early:48",
   "legacyName": "THE SCRAP CLAIM",
   "classification": "REGIONAL",
   "regions": [
    "INDUSTRIAL"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 18,
   "id": "early:51",
   "legacyName": "BROKEN CLEANER BOT",
   "classification": "REGIONAL",
   "regions": [
    "INDUSTRIAL"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 19,
   "id": "early:44",
   "legacyName": "THE MILK CRATES",
   "classification": "REGIONAL",
   "regions": [
    "CENTRAL"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 20,
   "id": "early:45",
   "legacyName": "THE DRY FOUNTAIN",
   "classification": "REGIONAL",
   "regions": [
    "CENTRAL"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 21,
   "id": "early:11",
   "legacyName": "THE BIG MAN",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 22,
   "id": "east:23",
   "legacyName": "THE CINDER WOLVES",
   "classification": "REGIONAL",
   "regions": [
    "NORTH",
    "WEST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 23,
   "id": "east:36",
   "legacyName": "THE CRANE NEST",
   "classification": "REGIONAL",
   "regions": [
    "SEAPORT"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 24,
   "id": "east:41",
   "legacyName": "THE SHATTERED SILO",
   "classification": "REGIONAL",
   "regions": [
    "CENTRAL",
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 25,
   "id": "east:33",
   "legacyName": "THE KNIFE WIND",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 26,
   "id": "east:12",
   "legacyName": "THE QUARRY LIFT",
   "classification": "REGIONAL",
   "regions": [
    "NORTH"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 27,
   "id": "east:0",
   "legacyName": "THE IRON HARVEST",
   "classification": "REGIONAL",
   "regions": [
    "CENTRAL",
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 28,
   "id": "east:6",
   "legacyName": "THE IRON CHOIR",
   "classification": "REGIONAL",
   "regions": [
    "CENTRAL",
    "INDUSTRIAL"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 29,
   "id": "east:10",
   "legacyName": "THE BONE FLAGS",
   "classification": "REGIONAL",
   "regions": [
    "CENTRAL",
    "NORTH",
    "EAST"
   ],
   "authority": "Recovered completed Syn/Luna regional review, October 28, 2026"
  },
  {
   "number": 30,
   "id": "east:34",
   "legacyName": "THE WARDEN",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 31,
   "id": "east:22",
   "legacyName": "THE SALT MINERS",
   "classification": "REGIONAL",
   "regions": [
    "NORTH"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 32,
   "id": "east:14",
   "legacyName": "THE ROAD EATER",
   "classification": "REGIONAL",
   "regions": [
    "INDUSTRIAL",
    "NORTH"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 33,
   "id": "east:30",
   "legacyName": "THE GATELESS WALL",
   "classification": "REGIONAL",
   "regions": [
    "CENTRAL"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 34,
   "id": "east:26",
   "legacyName": "THE BONE COLLECTOR",
   "classification": "REGIONAL",
   "regions": [
    "NORTH",
    "CENTRAL",
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 35,
   "id": "east:38",
   "legacyName": "THE MUD CANNON",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 36,
   "id": "east:57",
   "legacyName": "FREIGHT CAR AMBUSH",
   "classification": "REGIONAL",
   "regions": [
    "INDUSTRIAL",
    "SEAPORT"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 37,
   "id": "east:58",
   "legacyName": "BROKEN TOLL CREW",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 38,
   "id": "east:59",
   "legacyName": "SALT MARSH HUNTERS",
   "classification": "REGIONAL",
   "regions": [
    "LOWLANDS"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 39,
   "id": "east:60",
   "legacyName": "FLOODLIGHT SWEEP",
   "classification": "REGIONAL",
   "regions": [
    "INDUSTRIAL",
    "SEAPORT"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 40,
   "id": "east:61",
   "legacyName": "DRAINAGE STALKER",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 41,
   "id": "east:62",
   "legacyName": "CARGO HIJACKERS",
   "classification": "REGIONAL",
   "regions": [
    "SEAPORT",
    "LOWLANDS"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 42,
   "id": "east:63",
   "legacyName": "SEAWALL SNIPER",
   "classification": "REGIONAL",
   "regions": [
    "INDUSTRIAL",
    "SEAPORT"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 43,
   "id": "east:64",
   "legacyName": "SCRAP CRAB NEST",
   "classification": "REGIONAL",
   "regions": [
    "SEAPORT",
    "LOWLANDS"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 44,
   "id": "early:0",
   "legacyName": "COUNTY WORK TRUCK",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 45,
   "id": "early:2",
   "legacyName": "THE GAS STATION",
   "classification": "REGIONAL",
   "regions": [
    "CENTRAL"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 46,
   "id": "early:3",
   "legacyName": "ABANDONED SEDAN",
   "classification": "REGIONAL",
   "regions": [
    "NORTH",
    "CENTRAL",
    "SEAPORT"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 47,
   "id": "early:12",
   "legacyName": "BROKEN MOTEL",
   "classification": "REGIONAL",
   "regions": [
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 48,
   "id": "early:14",
   "legacyName": "DRAINAGE CULVERT",
   "classification": "REGIONAL",
   "regions": [
    "INDUSTRIAL",
    "LOWLANDS"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 49,
   "id": "early:54",
   "legacyName": "THE TIPPED DELIVERY TRUCK",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 50,
   "id": "early:62",
   "legacyName": "SCRATCHING IN THE SHED",
   "classification": "REGIONAL",
   "regions": [
    "CENTRAL",
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 51,
   "id": "early:63",
   "legacyName": "THE SAGGING FARMHOUSE",
   "classification": "REGIONAL",
   "regions": [
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 52,
   "id": "early:37",
   "legacyName": "THE MISSING STAIRS",
   "classification": "REGIONAL",
   "regions": [
    "WEST",
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 53,
   "id": "early:40",
   "legacyName": "THE WHEELBARROW",
   "classification": "REGIONAL",
   "regions": [
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 54,
   "id": "early:10",
   "legacyName": "RIDGELINE",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 55,
   "id": "early:42",
   "legacyName": "THE COIN WELL",
   "classification": "REGIONAL",
   "regions": [
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 56,
   "id": "early:32",
   "legacyName": "THE LOCKED FREEZER",
   "classification": "REGIONAL",
   "regions": [
    "WEST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 57,
   "id": "early:34",
   "legacyName": "THE RAIN BARREL",
   "classification": "REGIONAL",
   "regions": [
    "EAST",
    "LOWLANDS"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 58,
   "id": "early:64",
   "legacyName": "THE WALKING PEDDLER",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 59,
   "id": "early:36",
   "legacyName": "THE GARDEN GNOMES",
   "classification": "REGIONAL",
   "regions": [
    "EAST",
    "WEST"
   ],
   "authority": "Recovered completed Syn/Luna regional review, October 28, 2026"
  },
  {
   "number": 60,
   "id": "early:43",
   "legacyName": "THE FENCE ARTIST",
   "classification": "REGIONAL",
   "regions": [
    "CENTRAL",
    "SEAPORT"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 61,
   "id": "early:35",
   "legacyName": "THE BURNT LIBRARY",
   "classification": "REGIONAL",
   "regions": [
    "CENTRAL",
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 62,
   "id": "early:41",
   "legacyName": "THE SILENT PICNIC",
   "classification": "REGIONAL",
   "regions": [
    "WEST",
    "CENTRAL"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 63,
   "id": "early:30",
   "legacyName": "THE PAPER STORM",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 64,
   "id": "early:27",
   "legacyName": "CEMETERY OF TIRES",
   "classification": "REGIONAL",
   "regions": [
    "INDUSTRIAL"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 65,
   "id": "early:50",
   "legacyName": "THE LIMPING HOUND",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 66,
   "id": "early:66",
   "legacyName": "MILES THE COURIER",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 67,
   "id": "east:43",
   "legacyName": "THE LAST ORCHARD",
   "classification": "REGIONAL",
   "regions": [
    "WEST",
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 68,
   "id": "east:17",
   "legacyName": "THE WAX MUSEUM",
   "classification": "REGIONAL",
   "regions": [
    "CENTRAL",
    "WEST"
   ],
   "authority": "Recovered completed Syn/Luna regional review, October 28, 2026"
  },
  {
   "number": 69,
   "id": "east:25",
   "legacyName": "THE EMPTY ARMORY",
   "classification": "REGIONAL",
   "regions": [
    "CENTRAL"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 70,
   "id": "east:13",
   "legacyName": "THE BLACK SNOW",
   "classification": "REGIONAL",
   "regions": [
    "INDUSTRIAL",
    "NORTH"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 71,
   "id": "east:27",
   "legacyName": "THE SUNKEN CHAPEL",
   "classification": "REGIONAL",
   "regions": [
    "WEST",
    "LOWLANDS"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 72,
   "id": "east:18",
   "legacyName": "THE STEEL ORCHARD",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 73,
   "id": "east:39",
   "legacyName": "THE HANGING CAGE",
   "classification": "REGIONAL",
   "regions": [
    "NORTH",
    "EAST",
    "INDUSTRIAL"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 74,
   "id": "east:35",
   "legacyName": "THE OIL DERRICK",
   "classification": "REGIONAL",
   "regions": [
    "WEST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 75,
   "id": "east:8",
   "legacyName": "THE MASK MARKET",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 76,
   "id": "east:11",
   "legacyName": "THE SCRAP DUEL",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 77,
   "id": "east:21",
   "legacyName": "THE HOLLOW STATUE",
   "classification": "REGIONAL",
   "regions": [
    "CENTRAL",
    "INDUSTRIAL"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 78,
   "id": "east:4",
   "legacyName": "THE ASH PROCESSION",
   "classification": "REGIONAL",
   "regions": [
    "WEST",
    "LOWLANDS"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 79,
   "id": "east:29",
   "legacyName": "THE FIGHTING RING",
   "classification": "REGIONAL",
   "regions": [
    "NORTH",
    "CENTRAL",
    "INDUSTRIAL",
    "LOWLANDS",
    "EAST",
    "SEAPORT"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 80,
   "id": "east:42",
   "legacyName": "THE FORGOTTEN ARENA",
   "classification": "REGIONAL",
   "regions": [
    "NORTH",
    "CENTRAL",
    "INDUSTRIAL",
    "LOWLANDS",
    "EAST",
    "SEAPORT"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 81,
   "id": "east:65",
   "legacyName": "ABANDONED SUPPLY TRUCK",
   "classification": "REGIONAL",
   "regions": [
    "NORTH",
    "CENTRAL",
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 82,
   "id": "east:66",
   "legacyName": "SHUTTERED ROADSIDE CAFE",
   "classification": "REGIONAL",
   "regions": [
    "WEST",
    "CENTRAL",
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 83,
   "id": "east:67",
   "legacyName": "SMOKE BEYOND THE GUARDRAIL",
   "classification": "FIXED",
   "regions": [],
   "authority": "Work Order 6 explicit classification",
   "fixedLocation": {
    "name": "Fresh Mart",
    "accessNode": "industrial-road",
    "accessNodeNumber": 17
   }
  },
  {
   "number": 84,
   "id": "east:68",
   "legacyName": "RUINED SIGNAL HUT",
   "classification": "REGIONAL",
   "regions": [
    "CENTRAL",
    "INDUSTRIAL",
    "SEAPORT"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 85,
   "id": "early:1",
   "legacyName": "WASHOUT SALVAGE",
   "classification": "REGIONAL",
   "regions": [
    "WEST",
    "LOWLANDS"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 86,
   "id": "early:5",
   "legacyName": "MAINTENANCE BOX",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 87,
   "id": "early:52",
   "legacyName": "THE DITCH BACKPACK",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 88,
   "id": "early:53",
   "legacyName": "STONES UNDER THE OAK",
   "classification": "REGIONAL",
   "regions": [
    "WEST",
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 89,
   "id": "early:56",
   "legacyName": "THE LOCKED TOOL CHEST",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 90,
   "id": "early:60",
   "legacyName": "BROKEN RADIO",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 91,
   "id": "early:28",
   "legacyName": "THE HONEY JAR",
   "classification": "REGIONAL",
   "regions": [
    "WEST",
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 92,
   "id": "early:25",
   "legacyName": "THE LAST MAIL",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 93,
   "id": "east:2",
   "legacyName": "THE BURIED FREIGHT",
   "classification": "REGIONAL",
   "regions": [
    "INDUSTRIAL",
    "SEAPORT"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 94,
   "id": "east:31",
   "legacyName": "THE TAR POOL",
   "classification": "REGIONAL",
   "regions": [
    "LOWLANDS"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 95,
   "id": "east:20",
   "legacyName": "THE GRINDER CREW",
   "classification": "REGIONAL",
   "regions": [
    "WEST",
    "INDUSTRIAL"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 96,
   "id": "east:53",
   "legacyName": "FREIGHT WAGON CACHE",
   "classification": "INACTIVE",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 97,
   "id": "east:69",
   "legacyName": "CACHE UNDER THE MILEPOST",
   "classification": "REGIONAL",
   "regions": [
    "NORTH",
    "CENTRAL",
    "SEAPORT"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 98,
   "id": "east:70",
   "legacyName": "OVERTURNED MAINTENANCE CART",
   "classification": "REGIONAL",
   "regions": [
    "NORTH",
    "CENTRAL",
    "INDUSTRIAL"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 99,
   "id": "east:71",
   "legacyName": "LOCKER IN THE CONCRETE PIPE",
   "classification": "REGIONAL",
   "regions": [
    "INDUSTRIAL",
    "LOWLANDS"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 100,
   "id": "early:8",
   "legacyName": "OLD BILLBOARD",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 101,
   "id": "early:9",
   "legacyName": "THE TRAVELER",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 102,
   "id": "early:55",
   "legacyName": "COLD ROAD CAMP",
   "classification": "REGIONAL",
   "regions": [
    "NORTH",
    "WEST",
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 103,
   "id": "early:58",
   "legacyName": "THE EMPTY BUS SHELTER",
   "classification": "REGIONAL",
   "regions": [
    "CENTRAL",
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 104,
   "id": "early:61",
   "legacyName": "THE SPRAINED RUNNER",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 105,
   "id": "early:65",
   "legacyName": "DUST OVER THE SCHOOLYARD",
   "classification": "REGIONAL",
   "regions": [
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 106,
   "id": "early:24",
   "legacyName": "THE HANGING SHOES",
   "classification": "REGIONAL",
   "regions": [
    "WEST",
    "CENTRAL",
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 107,
   "id": "early:31",
   "legacyName": "THE CAROUSEL HORSE",
   "classification": "REGIONAL",
   "regions": [
    "WEST",
    "CENTRAL",
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 108,
   "id": "early:33",
   "legacyName": "THE BRIDGE TOLL",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 109,
   "id": "early:26",
   "legacyName": "THE FALSE SHOULDER",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 110,
   "id": "east:1",
   "legacyName": "THE GLASS FIELD",
   "classification": "REGIONAL",
   "regions": [
    "CENTRAL",
    "INDUSTRIAL"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 111,
   "id": "east:3",
   "legacyName": "THE RED RAIN",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 112,
   "id": "east:28",
   "legacyName": "THE LIME FOG",
   "classification": "REGIONAL",
   "regions": [
    "LOWLANDS"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 113,
   "id": "east:24",
   "legacyName": "THE BLADE CART",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 114,
   "id": "east:5",
   "legacyName": "THE COLLAPSED DAM",
   "classification": "REGIONAL",
   "regions": [
    "NORTH"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 115,
   "id": "east:15",
   "legacyName": "THE CHAIN BRIDGE",
   "classification": "REGIONAL",
   "regions": [
    "NORTH",
    "WEST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 116,
   "id": "east:16",
   "legacyName": "THE WELDED BUS",
   "classification": "REGIONAL",
   "regions": [
    "WEST",
    "CENTRAL",
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 117,
   "id": "east:19",
   "legacyName": "THE QUICKSAND CUT",
   "classification": "REGIONAL",
   "regions": [
    "LOWLANDS"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 118,
   "id": "east:7",
   "legacyName": "THE FURNACE PIT",
   "classification": "REGIONAL",
   "regions": [
    "INDUSTRIAL"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 119,
   "id": "east:32",
   "legacyName": "THE RUST PARADE",
   "classification": "REGIONAL",
   "regions": [
    "WEST",
    "CENTRAL",
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 120,
   "id": "east:40",
   "legacyName": "THE DUST HORSES",
   "classification": "REGIONAL",
   "regions": [
    "NORTH",
    "WEST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 121,
   "id": "east:54",
   "legacyName": "THE WASHED-OUT SHOULDER",
   "classification": "REGIONAL",
   "regions": [
    "EAST",
    "SEAPORT"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 122,
   "id": "east:55",
   "legacyName": "A CUP LEFT WARM",
   "classification": "INACTIVE",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 123,
   "id": "east:56",
   "legacyName": "A QUIET MILE",
   "classification": "INACTIVE",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 124,
   "id": "east:72",
   "legacyName": "THE SINKING CAUSEWAY",
   "classification": "REGIONAL",
   "regions": [
    "NORTH",
    "WEST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 125,
   "id": "east:73",
   "legacyName": "LEAKING FREIGHT TANK",
   "classification": "REGIONAL",
   "regions": [
    "INDUSTRIAL",
    "SEAPORT"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 126,
   "id": "east:74",
   "legacyName": "FALLING WATCH PLATFORM",
   "classification": "REGIONAL",
   "regions": [
    "NORTH",
    "WEST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 127,
   "id": "east:75",
   "legacyName": "THE REPEATING SIGNAL",
   "classification": "REGIONAL",
   "regions": [
    "NORTH",
    "WEST"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 128,
   "id": "east:76",
   "legacyName": "LETTERS BENEATH A STONE",
   "classification": "INACTIVE",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 129,
   "id": "east:77",
   "legacyName": "THE ROADSIDE MEASURING WALL",
   "classification": "REGIONAL",
   "regions": [
    "LOWLANDS"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 130,
   "id": "east:78",
   "legacyName": "THE STRANDED HANDCART",
   "classification": "REGIONAL",
   "regions": [
    "WEST",
    "CENTRAL"
   ],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 131,
   "id": "east:79",
   "legacyName": "A DRESSING IN THE DUST",
   "classification": "GLOBAL",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 132,
   "id": "east:80",
   "legacyName": "SALT WIND THROUGH THE REEDS",
   "classification": "INACTIVE",
   "regions": [],
   "authority": "Work Order 6 explicit classification"
  },
  {
   "number": 133,
   "id": "east:81",
   "legacyName": "THE LONG SHADOWS",
   "classification": "FIXED",
   "regions": [
    "EAST"
   ],
   "authority": "Work Order 6 explicit classification",
   "fixedLocation": {
    "name": "St. Mercy Hospital",
    "accessNode": "trade-route",
    "accessNodeNumber": 11,
    "region": "EAST"
   }
  },
  {
   "number": 134,
   "id": "east:52",
   "legacyName": "RIVER OF FIRE",
   "classification": "REGIONAL",
   "regions": [
    "LOWLANDS"
   ],
   "authority": "Work Order 6 explicit classification"
  }
 ],
 "expectedCounts": {
  "GLOBAL": 41,
  "REGIONAL": 86,
  "FIXED": 2,
  "INACTIVE": 5
 },
 "nameOverrides": {
  "east:10": "THE BONE HUNTERS",
  "east:75": "WILD BEAR",
  "east:77": "THE BROKEN BRIDGE DISCOVERY",
  "east:72": "THE LOST CONVOY",
  "east:73": "TOXIC CARGO",
  "east:74": "COLLAPSING LOOKOUT",
  "east:78": "THE LAST STOP",
  "east:79": "TOMMY BRIGGS — POSTAL ENCOUNTER",
  "east:67": "CLEANUP ON AISLE NINE",
  "early:60": "STATION NINE DISCOVERY STORYLINE"
 },
 "roadAuthority": "54 Road Assignments sheet, approved design; implemented by WO6. Eastern Coast/COAST normalized to latest EAST code."
};
// WO6 regional discovery/selection integration. Existing scenario objects remain canonical.
RoadScenarioRegistry.installRegions=function(){
 if(this.wo6Installed)return this.regionalValidation;
 if(!this.ready)throw Error('Finalize the scenario registry before regional installation.');
 const r=this,spec=this.regionalSpec,allowed=new Set(spec.regions),numbers=new Set(),ids=new Set(),counts={GLOBAL:0,REGIONAL:0,FIXED:0,INACTIVE:0};
 const byTitle=new Map(),byReview=new Map(),byCanonicalId=new Map();
 for(const row of spec.encounters){
  if(!Number.isInteger(row.number)||row.number<1||row.number>134||numbers.has(row.number)||ids.has(row.id))throw Error('Duplicate/invalid WO6 review entry '+row.number);
  numbers.add(row.number);ids.add(row.id);if(!Object.prototype.hasOwnProperty.call(counts,row.classification))throw Error('Invalid classification '+row.id);counts[row.classification]++;
  if(row.regions.some(x=>!allowed.has(x))||new Set(row.regions).size!==row.regions.length)throw Error('Invalid regional assignment '+row.id);
  if(row.classification==='REGIONAL'&&!row.regions.length)throw Error('Missing regional assignment '+row.id);
  const [pool,index]=row.id.split(':'),encounter=(pool==='early'?encounters:eastEncounters)[Number(index)];
  if(!encounter||r10CanonicalTitle(encounter.title)!==row.legacyName)throw Error('Review ID/name mismatch '+row.id);
  const item={...row,encounter};byReview.set(row.number,item);byCanonicalId.set(row.id,item);byTitle.set(r10CanonicalTitle(encounter.title),item);
 }
 if(numbers.size!==134||spec.regions.length!==7)throw Error('Incomplete WO6 registry');
 for(const [key,value]of Object.entries(spec.expectedCounts))if(counts[key]!==value)throw Error('WO6 count mismatch '+key);
 for(const e of LANTERN_WORLD_GRAPH.edges)if(!allowed.has(e.primaryRegion)||(e.transitionRegion&&!allowed.has(e.transitionRegion)))throw Error('Missing/invalid geographical road tag '+e.id);
 for(const entry of this.entries){
  const item=byTitle.get(r10CanonicalTitle(entry.encounter.title));if(!item)throw Error('Active encounter missing regional review '+entry.id);
  Object.assign(entry,{reviewNumber:item.number,canonicalId:item.id,classification:item.classification,regions:[...item.regions],region:item.classification==='REGIONAL'?item.regions.join('+'):item.classification});
  const display=spec.nameOverrides[item.id];if(display)entry.encounter.displayName=display;entry.name=entry.encounter.displayName||entry.encounter.title;
 }
 this.regionalCatalog=spec.encounters.map(row=>{const item=byReview.get(row.number);return {...row,name:item.encounter.displayName||item.encounter.title,encounter:item.encounter};});
 this.regionalByReview=byReview;this.regionalById=byCanonicalId;this.regionalByTitle=byTitle;
 this.regionalValidation={valid:true,total:134,counts,roads:LANTERN_WORLD_GRAPH.edges.length};
 // Filter before category availability, category weights and Corvette priority selection.
 const candidates=r10Candidates;r10Candidates=function(legacyPool,kind){const geography=r10Geography();return candidates(legacyPool,kind).filter(i=>r.wo6Eligible(r.pool(legacyPool)[i],geography));};
 this.wo6InstallFixedSites();this.wo6Installed=true;return this.regionalValidation;
};
// Legacy pool keys early/east/coast remain untouched; these are geographical codes.
function r10Geography(){
 const g=typeof lanternState==='function'?lanternState():null,e=typeof lanternEdge==='function'?lanternEdge():null;
 if(e?.primaryRegion)return e.primaryRegion;
 // Old pre-Lantern saves are projected by their existing main-road context only.
 // No invented region boundaries: these exact canonical routes have approved tags.
 if(!g){
  const q=typeof r6Road==='function'?r6Road():null;
  const id=q?.active?(q.leg==='coast'?'factory--boulder-junction':'solace--works-junction'):roadGoal==='east'?'solace--works-junction':['house','mercy'].includes(roadGoal)?'house--solace-upper-junction':null;
  return id?LG_EDGES[id]?.primaryRegion||null:null;
 }
 return null; // No new road selection at a node; GLOBAL-only safety outside known travel.
}
RoadScenarioRegistry.wo6Eligible=function(encounter,geography){
 const item=this.regionalByTitle.get(r10CanonicalTitle(encounter?.title));
 return !!item&&(item.classification==='GLOBAL'||item.classification==='REGIONAL'&&item.regions.includes(geography));
};
RoadScenarioRegistry.wo6FreshAvailable=function(){const g=lanternState();return !!g&&!g.currentEdgeId&&g.nodeId==='industrial-road';};
RoadScenarioRegistry.wo6FreshMenu=function(){
 const e=this.regionalById.get('east:67').encounter;stage='wo6FreshMart';add('FRESH MART — '+(e.displayName||e.title),'place');add(e.description?e.description():e.text,'system');r5DirectChoices((e.prompt?e.prompt():e.choices).split(/\s{2,}/).filter(Boolean).filter(x=>x!=='MOVE ON').concat(['RETURN TO HIGHWAY']));
};
RoadScenarioRegistry.wo6FreshEnter=function(){
 if(!this.wo6FreshAvailable())return false;const e=this.regionalById.get('east:67').encounter;
 if(e.minLevel&&player.level<e.minLevel||e.maxLevel&&player.level>e.maxLevel){add('You do not meet this location’s existing level requirements.','system');return false;}
 (player.flags.wo6Sites||(player.flags.wo6Sites={})).freshMartDiscovered=true;this.wo2State().freshMartClue=true;player.flags.wo6FixedSite='freshMart';this.wo6FreshMenu();lanternSave();return true;
};
RoadScenarioRegistry.wo6FreshLeave=function(){delete player.flags.wo6FixedSite;lanternNodeMenu();lanternSave();return true;};
RoadScenarioRegistry.wo6InstallFixedSites=function(){
 const r=this,oldHospitalAvailable=this.wo4HospitalAvailable;
 // Existing discovered hospital saves keep their old anchor as an additional
 // recovery entrance. All new discoveries use the fixed EAST Trade Route access.
 this.wo4HospitalAvailable=function(){const q=player.flags.wo4Hospital,g=lanternState();return !!q?.discovered&&!!g&&!g.currentEdgeId&&g.nodeId==='trade-route'||oldHospitalAvailable.call(this);};
 const nodeMenu=lanternNodeMenu;lanternNodeMenu=function(){nodeMenu();const g=lanternState();if(!g||g.currentEdgeId)return;
  if(g.nodeId==='industrial-road')lanternAppendChoices([player.flags.wo6Sites?.freshMartDiscovered?'VISIT FRESH MART':'EXAMINE FRESH MART']);
  if(g.nodeId==='trade-route'&&!player.flags.wo4Hospital?.discovered)lanternAppendChoices(['EXAMINE ST MERCY HOSPITAL']);
 };
 const render=renderCurrentChoices;renderCurrentChoices=function(){if(stage==='wo6FreshMart')return r.wo6FreshMenu();return render();};
 const complete=completeRoadTurn;completeRoadTurn=function(){if(player.flags.wo6FixedSite==='freshMart'){r.wo6FreshMenu();lanternSave();return;}return complete();};
 const core=handleCommandCore;handleCommandCore=async function(raw){const cmd=r5Mapped(raw),g=lanternState();if(!busy&&g&&!g.currentEdgeId&&g.nodeId==='industrial-road'&&['examine fresh mart','visit fresh mart'].includes(cmd))return r.wo6FreshEnter();
  if(!busy&&g&&!g.currentEdgeId&&g.nodeId==='trade-route'&&cmd==='examine st mercy hospital'){
   const e=r.regionalById.get('east:81').encounter;if(e.minLevel&&player.level<e.minLevel||e.maxLevel&&player.level>e.maxLevel)return false;
   e.resolve('examine the entrance');lanternNodeMenu();lanternSave();return true;
  }
  if(!busy&&stage==='wo6FreshMart'&&player.flags.wo6FixedSite==='freshMart'){
   if(['return to highway','back','b','leave','move on'].includes(cmd))return r.wo6FreshLeave();
   if(/^(save|load|inventory|status|map|quests|help|use)(?: |$)/.test(cmd))return core(raw);
   const e=r.regionalById.get('east:67').encounter;resultBuffer=[];const done=e.resolve(cmd);flushResults();
   if(!done)add('That is not an available option.','system');if(stage!=='combat'&&stage!=='fallen')r.wo6FreshMenu();lanternSave();return true;
  }
  return core(raw);
 };
 const load=loadGame;loadGame=function(slot){const data=getSaveData(slot),result=load(slot);if(data?.stage==='wo6FreshMart'&&player.flags.wo6FixedSite==='freshMart')r.wo6FreshMenu();return result;};
 const journal=showQuests;showQuests=function(){journal();if(player.flags.wo6Sites?.freshMartDiscovered||r.wo2State().freshMartClue)add('DISCOVERED SITE — FRESH MART: Industrial Road.','system');if(player.flags.wo4Hospital?.discovered)add('DISCOVERED SITE — ST. MERCY HOSPITAL: Trade Route.','system');};
 const death=handlePlayerDeath;handlePlayerDeath=function(...args){delete player.flags.wo6FixedSite;return death(...args);};
};

// Owner-approved follow-up: one new GLOBAL discovery, separate from the 134-entry WO6 review.
RoadScenarioRegistry.installCorvetteDiscovery=function(){
 if(this.corvetteDiscovery)return;
 const encounter={title:"MURPHY'S LOST CORVETTE",displayName:"MURPHY'S LOST CORVETTE",exclusive:false,
  text:"Beyond the broken shoulder, a blue Corvette rests beneath dust and tangled weeds. Its body has survived better than its running gear. The car in Murphy's photograph looked just like this one.",
  description(){CorvetteRestoration.discover();return this.text;},
  choices:'INSPECT THE CORVETTE   LEAVE',resolve(cmd){if(['leave','move on','back away'].includes(cmd)){CorvetteRestoration.discover();add('You leave the car where it rests. Its location is recorded for Murphy.','system');return true;}if(cmd!=='inspect the corvette')return false;const q=CorvetteRestoration.state();if(!q.found){q.found=true;q.active=true;const g=lanternState();q.discovery={edge:g?.currentEdgeId||null,step:g?.stepIndex||0};add('You record the Corvette’s position. Murphy will want to hear about this.','reward');CorvetteRestoration.save();}else add('You have already recorded this Corvette’s location.','system');return true;}};
 const index=encounters.push(encounter)-1,id='early:'+index;
 this.originalIds.set(encounter,id);
 const metadata={number:null,id,legacyName:encounter.title,name:encounter.displayName,classification:'GLOBAL',regions:[],authority:'Owner-approved GLOBAL car discovery, follow-up to WO6',encounter};
 this.regionalCatalog.push(metadata);this.regionalById.set(id,metadata);this.regionalByTitle.set(encounter.title,metadata);
 const entry={id,canonicalId:id,name:encounter.displayName,classification:'GLOBAL',region:'GLOBAL',regions:[],encounter,references:[]};
 for(const road of ['early','east','coast']){const pool=this.pool(road);let i=pool.indexOf(encounter);if(i<0)i=pool.push(encounter)-1;R10_POOLS[road].exploration.push(i);entry.references.push({road,category:'exploration',index:i});}
 this.entries.push(entry);this.byId[id]=entry;this.corvetteDiscovery=metadata;
 this.regionalValidation.followUp={additional:1,classification:'GLOBAL',id,totalCatalog:135};
};
