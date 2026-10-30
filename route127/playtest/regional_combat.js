// Owner-approved regional combat expansion, October 29 2026. Append-only saved slots.
(function installRegionalCombat(){
 const r=RoadScenarioRegistry;if(!r.ready||r.regionalCombatExpansion)return;
 const designs=[
 [
  "Mountain Poachers",
  "NORTH",
  "human",
  2,
  0.32,
  "PAY SIX BOLTS",
  "Two poachers demand a toll beside a snared mountain trail.",
  "Cloth"
 ],
 [
  "Territorial Survivalists",
  "NORTH",
  "human",
  2,
  0.34,
  "LOWER YOUR WEAPON",
  "Survivalists guard a marked camp boundary. Lowering your weapon lets you pass.",
  "Wire"
 ],
 [
  "Mountain Lions",
  "NORTH",
  "animal",
  1,
  0.38,
  "GIVE IT SPACE",
  "A mountain lion crouches over its kill. Give it space or challenge it.",
  "Raw Venison"
 ],
 [
  "Carrion Vultures",
  "WEST",
  "animal",
  3,
  0.22,
  "SKIRT THE CARCASS",
  "Vultures defend a carcass. Skirt their feeding ground or drive them off.",
  "Raw Bird Meat"
 ],
 [
  "Rabid Badgers",
  "WEST",
  "animal",
  2,
  0.26,
  "TAKE THE LONG WAY",
  "Badgers snap from a roadside burrow. The far shoulder is clear.",
  "Raw Rat Meat"
 ],
 [
  "Territorial Buck",
  "WEST",
  "animal",
  1,
  0.34,
  "WAIT FOR THE HERD",
  "A buck guards its herd. Wait for the animals to cross or approach.",
  "Raw Venison"
 ],
 [
  "Looters",
  "CENTRAL",
  "human",
  3,
  0.32,
  "INTIMIDATE",
  "Looters surround a stripped cart. A firm threat may make them scatter.",
  "Scrap Metal"
 ],
 [
  "The Hollowed",
  "CENTRAL",
  "human",
  2,
  0.28,
  "OFFER FOOD",
  "Gaunt, desperate people emerge from a shelter, demanding food.",
  "Cloth"
 ],
 [
  "Rabid Raccoons",
  "CENTRAL",
  "animal",
  3,
  0.22,
  "AVOID THE DUMPSTER",
  "Raccoons swarm an overturned dumpster. The opposite sidewalk is clear.",
  "Raw Rat Meat"
 ],
 [
  "Bat Colony",
  "CENTRAL",
  "animal",
  4,
  0.18,
  "WAIT UNTIL THEY SETTLE",
  "Bats pour from a broken underpass. Wait outside or push through.",
  "Raw Bird Meat"
 ],
 [
  "The Squatters",
  "CENTRAL",
  "human",
  2,
  0.29,
  "ASK TO PASS",
  "Squatters defend a ruined storefront. Ask permission to cross their shelter.",
  "Cloth"
 ],
 [
  "Parking Lot Raiders",
  "CENTRAL",
  "human",
  3,
  0.34,
  "CIRCLE THE WRECKS",
  "Raiders wait between parked wrecks. Circle behind the cars or confront them.",
  "Scrap Metal"
 ],
 [
  "Gunshop Owner",
  "CENTRAL",
  "neutral",
  1,
  0.35,
  "TALK",
  "An armed shopkeeper mistakes your approach for a robbery. Explain yourself, retreat, or attack.",
  ""
 ],
 [
  "Payment Required",
  "INDUSTRIAL",
  "machine",
  1,
  0.3,
  "PAY FIVE BOLTS",
  "A malfunctioning adult-service robot blocks the road: PAYMENT REQUIRED. Its damaged arms unfold into weapons.",
  "Electronics"
 ],
 [
  "Industrial Spiders",
  "INDUSTRIAL",
  "animal",
  4,
  0.22,
  "AVOID THE WEB",
  "Oversized spiders web a ruined loading ramp. Go around or disturb the nest.",
  "Raw Bird Meat"
 ],
 [
  "Chemical Burners",
  "INDUSTRIAL",
  "human",
  2,
  0.32,
  "WAIT FOR THE FUMES TO CLEAR",
  "Chemical scavengers burn waste in the road. Wait downwind or confront them.",
  "Scrap Metal"
 ],
 [
  "Junkyard Hermit",
  "INDUSTRIAL",
  "neutral",
  1,
  0.3,
  "OFFER SCRAP",
  "A hermit raises a pipe at the fence. A piece of scrap could buy safe passage.",
  ""
 ],
 [
  "Factory Enforcers",
  "INDUSTRIAL",
  "human",
  3,
  0.36,
  "SHOW EMPTY HANDS",
  "Enforcers stop travelers at an abandoned loading gate. Show empty hands or fight.",
  "Wire"
 ],
 [
  "Scrap Torchers",
  "INDUSTRIAL",
  "human",
  2,
  0.32,
  "TAKE COVER AND PASS",
  "Torch-wielding scavengers strip a fallen girder. Pass behind a concrete barrier or confront them.",
  "Scrap Metal"
 ],
 [
  "Fuel Thieves",
  "INDUSTRIAL",
  "human",
  2,
  0.32,
  "TAKE THE FUEL",
  "Thieves siphon an abandoned tanker. Taking their fuel provokes a fight; leave or confront them.",
  "Fuel"
 ],
 [
  "Alligators",
  "LOWLANDS",
  "animal",
  1,
  0.4,
  "STAY ON DRY GROUND",
  "An alligator guards the flooded shoulder. Stay on dry ground or approach.",
  "Raw Snake Meat"
 ],
 [
  "Water Moccasins",
  "LOWLANDS",
  "animal",
  2,
  0.2,
  "PROBE THE GRASS",
  "Snakes stir in flooded grass. Probe the path from a safe distance or advance.",
  "Raw Snake Meat"
 ],
 [
  "Backwoods Cannibals",
  "LOWLANDS",
  "human",
  3,
  0.36,
  "ESCAPE THROUGH THE REEDS",
  "Armed hunters call you toward a cooking fire. Their hanging trophies are human.",
  "Cloth"
 ],
 [
  "Snapping Turtles",
  "LOWLANDS",
  "animal",
  2,
  0.25,
  "STEP AROUND THEM",
  "Snapping turtles block a muddy crossing. Step around their reach or challenge them.",
  "Raw Snake Meat"
 ],
 [
  "Giant Mosquitoes",
  "LOWLANDS",
  "animal",
  5,
  0.16,
  "SHELTER FROM THE SWARM",
  "A cloud of huge mosquitoes gathers above stagnant water. Wait under cover or cross now.",
  ""
 ],
 [
  "Hostile Swamp Dwellers",
  "LOWLANDS",
  "human",
  2,
  0.32,
  "PAY SIX BOLTS",
  "Swamp dwellers demand a toll at a raised plank crossing.",
  "Rope"
 ],
 [
  "Cornfield Stalkers",
  "EAST",
  "human",
  2,
  0.3,
  "RETREAT TO OPEN GROUND",
  "Figures with blades move between dead corn rows. Retreat into open ground or face them.",
  "Cloth"
 ],
 [
  "Territorial Farmers",
  "EAST",
  "neutral",
  2,
  0.32,
  "EXPLAIN YOU ARE PASSING",
  "Armed farmers warn you away from their crops. Explain yourself, leave, or attack.",
  ""
 ],
 [
  "Feral Bull",
  "EAST",
  "animal",
  1,
  0.42,
  "WAIT BEHIND THE FENCE",
  "A bull paws the broken road. Wait behind a fence or stand in its path.",
  "Raw Boar Meat"
 ],
 [
  "Dockside Pirates",
  "SEAPORT",
  "human",
  3,
  0.35,
  "PAY SIX BOLTS",
  "Pirates demand passage money beside a mooring rope.",
  "Rope"
 ],
 [
  "Shipwreck Scavengers",
  "SEAPORT",
  "human",
  2,
  0.3,
  "YIELD THE CLAIM",
  "Scavengers claim a grounded wreck and warn you off. Yield or dispute their claim.",
  "Scrap Metal"
 ],
 [
  "Aggressive Seagulls",
  "SEAPORT",
  "animal",
  5,
  0.18,
  "GUARD YOUR FOOD",
  "Five gulls dive toward your food. Shield your pack and back away or fight them.",
  "Raw Bird Meat"
 ]
];
 r.regionalCombatExpansion=designs;
 r.regionalCombatFight=function(d){
  const [title,region,type,count,fraction,alternative,text,material]=d;
  const level=Math.max(1,Math.min(50,Number(player.level)||1));
  const each=Math.max(2,Math.round(baseHpForLevel(level)*fraction/count));
  const neutral=type==='neutral';
  if(neutral&&typeof v52Record==='function')v52Record('Assault',title,'Attacked a peaceful roadside resident',25);
  const purse=type==='human'?Math.max(2,Math.round((3+level*.5)*(fraction/.3))):0;
  const enemies=count>1?Array.from({length:count},(_,i)=>({name:title.toUpperCase()+' '+(i+1),hp:each,bolts:type==='human'?purse+(i%2):0,r18Min:1,r18Max:count>=4?2:4})):undefined;
  startCombat({name:title.toUpperCase(),level,hp:each*count,min:count>=4?1:2,max:count>=4?2:5,
   xp:neutral?0:Math.max(8,Math.round(level*5+fraction*25+count*2)),bolts:neutral?0:purse,
   enemies,wo2NoEquipment:type!=='human',regionalCombatLoot:neutral?null:{type,material,count,fraction,invertebrate:['Industrial Spiders','Giant Mosquitoes'].includes(title)},
   end:neutral?'The defender drops their weapon. There is no reward for this attack.':'The threat has passed.'},'encounter');return true;
 };
 r.regionalCombatAward=function(loot){
  if(!loot)return;
  if(loot.type==='animal'){
   if(loot.material){for(let i=0;i<(loot.fraction>=.38?2:1);i++)r18RetainRoadReward(loot.material,'material');}
   // Insects have neither butcherable meat nor bones; spiders use established meat only.
   if(loot.material&&!loot.invertebrate)r18RetainRoadReward(loot.fraction>=.34?'Large Animal Bones':'Small Animal Bones','material');
  }else if(loot.material)r18RetainRoadReward(loot.material,'material');
  if(loot.type==='machine')r18RetainRoadReward('Scrap Metal','material');
 };
 for(const d of designs){
  const [title,region,type,count,fraction,alternative,text,material]=d;
  const encounter={title:title.toUpperCase(),text,exclusive:true,choices:alternative+'   FIGHT   LEAVE',resolve(cmd){
   if(['leave','back away','move on'].includes(cmd)){add('You leave the encounter behind.');return true;}
   if(cmd==='fight'||(title==='Fuel Thieves'&&cmd==='take the fuel'))return r.regionalCombatFight(d);
   if(cmd!==alternative.toLowerCase())return false;
   if(alternative.startsWith('PAY ')){const cost=alternative.includes('FIVE')?5:6;if(player.bolts<cost){add('You do not have '+cost+' Bolts. You can still leave.','system');return false;}player.bolts-=cost;updateHud();}
   if(alternative==='OFFER FOOD'){if(!hasItem('Energy Bars')){add('You need Energy Bars to offer food.','system');return false;}if(!removeItem('Energy Bars'))return false;}
   if(alternative==='OFFER SCRAP'&&!r6ConsumeMaterial('Scrap Metal',1)){add('You need Scrap Metal.','system');return false;}
   if(alternative==='INTIMIDATE'&&Math.random()<.35){add('The looters call your bluff.','danger');return r.regionalCombatFight(d);}
   add(title==='Payment Required'?'The robot accepts payment and powers down its weapons.':title==='Gunshop Owner'?'The owner lowers the gun and lets you pass.':title==='Aggressive Seagulls'?'You shield your supplies and withdraw without losing food.':'You resolve the encounter without combat.');return true;
  }};
  const index=encounters.push(encounter)-1,id='early:'+index;
  r.originalIds.set(encounter,id);
  const metadata={number:null,id,legacyName:encounter.title,name:title,classification:'REGIONAL',regions:[region],encounter,authority:'Owner-approved October 29 regional combat expansion'};
  r.regionalCatalog.push(metadata);r.regionalById.set(id,metadata);r.regionalByTitle.set(encounter.title,metadata);
  const entry={id,canonicalId:id,name:title,classification:'REGIONAL',region,regions:[region],encounter,references:[]};
  for(const road of ['early','east','coast']){const pool=r.pool(road);let i=pool.indexOf(encounter);if(i<0)i=pool.push(encounter)-1;R10_POOLS[road].combat.push(i);entry.references.push({road,category:'combat',index:i});}
  r.entries.push(entry);r.byId[id]=entry;
 }
})();
