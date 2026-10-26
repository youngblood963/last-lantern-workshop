// R10: one weighted selector for eligible random road encounters in either direction.
// Fixed junctions, quest encounters, branch landmarks and first-clear bosses remain scripted.
const R10_WEIGHTS={combat:.50,wanderer:.20,exploration:.15,salvage:.10,environment:.05};
const R10_EARLY_TITLES={
 exploration:['COUNTY WORK TRUCK','THE GAS STATION','ABANDONED SEDAN','BROKEN MOTEL','DRAINAGE CULVERT','THE TIPPED DELIVERY TRUCK','PRINTS IN THE MUD','SCRATCHING IN THE SHED','THE SAGGING FARMHOUSE'],
 salvage:['WASHOUT SALVAGE','MAINTENANCE BOX','THE DITCH BACKPACK','STONES UNDER THE OAK','THE LOCKED TOOL CHEST','TORN BACKPACK','BROKEN RADIO'],
 environment:['OLD BILLBOARD','THE TRAVELER','COLD ROAD CAMP','THE EMPTY BUS SHELTER','THE SPRAINED RUNNER','DUST OVER THE SCHOOLYARD']
};
const R10_POOLS={early:{},east:{},coast:{
 combat:R8_COAST_COMBAT,
 exploration:R9_COAST_SCENES.filter(i=>eastEncounters[i].category==='exploration'),
 salvage:R9_COAST_SCENES.filter(i=>eastEncounters[i].category==='salvage'),
 environment:[...R9_COAST_SCENES.filter(i=>['hazard','lore','moral'].includes(eastEncounters[i].category)),R6_FIRE_INDEX]
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
 // Keep lookout reinforcement behavior compatible with its existing combat handler.
 if(title==='GANG LOOKOUT')spec.enemies=[{name:'LOOKOUT',hp,bolts}];
 return eastEncounters.push({title:'EAST ROAD — '+title,text:original.text,combat:spec,exclusive:true,choices:'FIGHT   BACK AWAY',resolve(cmd){if(!['back away','leave'].includes(cmd))return false;add('You take the far shoulder and leave the threat behind.','system');return true;}})-1;
});
function r10Region(){return r6Road()?.active?(r6Road().leg==='coast'?'coast':'east'):'early';}
function r10Pool(region){return region==='early'?encounters:eastEncounters;}
function r10EligibleWanderers(){return wanderers.filter(w=>wandererAlive(w)&&!portIsHired(w.name));}
function r10WandererChance(){
 if(!portRecruitUnlocked()||!r10EligibleWanderers().some(portRecruitEligible))return .20;
 return Math.min(.50,.20+Math.max(0,(player.flags.r10RecruitDrySegments||0)-10)*.03);
}
function r10Category(availableWanderers,rng=Math.random){
 const w=availableWanderers?r10WandererChance():0;
 const roll=rng();if(roll<w)return 'wanderer';
 const x=(roll-w)/(1-w); // redistribute only the remaining categories
 return x<.625?'combat':x<.8125?'exploration':x<.9375?'salvage':'environment';
}
function r10Pick(region,kind){
 const objects=r10Pool(region);
 let candidates=R10_POOLS[region][kind];
 if(region==='early')candidates=candidates.filter(i=>{
  const e=objects[i],spec=e.combat||combatSpecs[e.title];
  return (!spec||spec.level<=Math.max(3,player.level+1))&&(!e.minLevel||player.level>=e.minLevel)&&(!e.maxLevel||player.level<=e.maxLevel);
 });
 // Early discovery content is valid above its tutorial range as a repeat road scene.
 if(!candidates.length)candidates=R10_POOLS[region][kind];
 candidates=candidates.filter(i=>objects[i].title!=='THE TRAVELER'||storyValeRoadAvailable());
 const history=player.flags.r10RoadHistory?.[region+':'+kind]||[];
 const fresh=candidates.filter(i=>!history.includes(objects[i].title));
 const pool=fresh.length?fresh:candidates;
 return pool[Math.floor(Math.random()*pool.length)];
}
function r10Remember(region,kind,index){
 const histories=player.flags.r10RoadHistory||(player.flags.r10RoadHistory={}),key=region+':'+kind;
 const title=r10Pool(region)[index].title;
 histories[key]=[...(histories[key]||[]).filter(t=>t!==title),title].slice(-Math.min(kind==='combat'?5:3,R10_POOLS[region][kind].length-1));
}
function r10PrepareEncounter(){
 // Loading an in-progress encounter must retain its original scene and costs.
 if(resumeSavedEncounter)return true;
 const eligible=r10EligibleWanderers();
 if(portRecruitUnlocked()&&eligible.some(portRecruitEligible))player.flags.r10RecruitDrySegments=Math.min(100,(player.flags.r10RecruitDrySegments||0)+1);
 else player.flags.r10RecruitDrySegments=0;
 // Every ordinary road segment selects an encounter; no empty travel roll.
 const kind=r10Category(eligible.length>0);player.flags.r10LastRoadCategory=kind;
 if(kind==='wanderer'){
  showRoadWanderer();
  if(portRecruitUnlocked()&&portRecruitEligible(wandererByName(currentRoadWanderer)))player.flags.r10RecruitDrySegments=0;
  return false;
 }
 const region=r10Region(),index=r10Pick(region,kind),q=r6Road();
 if(q?.active)q.index=index;
 roadEncounterOrder[currentRoadEncounterIndex()]=index;
 r10Remember(region,kind,index);return true;
}
