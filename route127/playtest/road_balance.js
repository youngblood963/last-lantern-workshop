// R10: one weighted selector for eligible random road encounters in either direction.
// Fixed junctions, quest encounters, branch landmarks and first-clear bosses remain scripted.
const R10_WEIGHTS={combat:.50,wanderer:.20,exploration:.15,salvage:.10,environment:.05};
// Keep old array entries stable for in-progress saves; never select these for new events.
const R10_RETIRED_TITLES=new Set(['SOMETHING IN THE DRAIN','THE WASH LINE','THE CRACKED AQUEDUCT','THE COLD FOUNDRY','DOG AT THE DEN','PRINTS IN THE MUD','TORN BACKPACK']);
function r10CanonicalTitle(title){return String(title||'').replace(/^EAST ROAD — /,'');}
function r10Retired(title){return R10_RETIRED_TITLES.has(r10CanonicalTitle(title));}
const {R10_EARLY_TITLES, R10_POOLS, r18ShoesEarly, r18ShoulderEarly, r18WheelEarly, r18HoneyEarly, r18Ridge, r18ScrapClaim, r18RoachEarly, r18CinderIndex, r18PantryEarly, r18OrchardIndex, r18WellIndex, r18FreezerIndex, r18GreenhouseIndex, r18CraneNestIndex, r18SiloIndex, r18GardenIndex, r18TarPoolIndex, r18ReapersIndex, r18HuntersIndex, r18ChainGangIndex, r18HarvestIndex, r18EnforcerIndex, r18ChoirIndex, r18BoneHuntersIndex, r18FurnaceIndex, r18ParadeIndex, r18WardenIndex, r18PeteIndex, r18GnomesIndex, r18WaxIndex, r18RoadEaterIndex, r18WallIndex, r18ArmoryIndex, r18BoneCollectorIndex, r18BlackSnowIndex, r18EnidIndex, r18LibraryIndex, r18ChapelIndex, r18BomberIndex, r18PicnicIndex, r18PaperStormIndex, r18MarthaIndex, r18OilIndex, r18TunnelIndex, r18MaskMarketIndex, r18ScrapDuelIndex, r18MazeIndex, r18ClaraIndex, r18AshIndex, r18HoundIndex} = RoadScenarioRegistry.pools();
function r10Region(){return r6Road()?.active?(r6Road().leg==='coast'?'coast':'east'):'early';}
function r10Pool(region){return typeof RoadScenarioRegistry!=='undefined'?RoadScenarioRegistry.pool(region):(region==='early'?encounters:eastEncounters);}
function r10EligibleWanderers(){return wanderers.filter(w=>wandererAlive(w)&&!portIsHired(w.name));}
// Select only candidates whose story and level restrictions are satisfied.
function r10Candidates(region,kind){
 const objects=r10Pool(region),pool=R10_POOLS[region]?.[kind]||[];
 return pool.filter(i=>{
  const e=objects[i];if(!e||r10Retired(e.title))return false;
  if(e.title==='THE LIMPING HOUND'&&player.flags.r18HoundAdopted)return false;
  if(e.title==='THE TRAVELER'&&!storyValeRoadAvailable())return false;
  if(e.title==='THE DARK CELLAR'&&player.flags.r18CellarResolved)return false;
  if(e.title==='THE TIPPED DELIVERY TRUCK'&&player.flags.r18DeliveryResolved)return false;
  if(e.title==='THE WELDED BUS'&&player.flags.r18PickensResolved)return false;
  if(e.title==='THE QUICKSAND CUT'&&player.flags.r18QuicksandOutcome&&player.flags.r18QuicksandOutcome!=='abandoned'&&player.flags.r18QuicksandSatchel)return false;
  if(e.title==='THE SALT MINERS'&&player.flags.r18SaltWorkersFreed)return false;
  if(e.title==='THE BURNT LIBRARY'&&player.flags.r18LibraryResolved)return false;
  if(e.title==='THE SILENT PICNIC'&&player.flags.r18PicnicClaimed)return false;
  if(e.title==='CEMETERY OF TIRES'&&player.flags.r18MazeClaimed&&!(player.flags.wo3Corvette?.active&&(Number(player.flags.wo3Corvette.tiresRecovered)||0)<4))return false;
  if(e.title==='THE OIL DERRICK'&&player.flags.r18OilOutcome)return false;
  if(e.title==='BROKEN MOTEL'&&player.flags.r18CalebRescued)return false;
  if(r10CanonicalTitle(e.title)==='SECURITY DRONE'&&player.flags.r18DroneDisabled)return false;
  if(e.title==='THE STRAY'&&player.flags.r18StrayReunionDone)return false;
  if(e.title==='THE SPRAINED RUNNER'&&player.flags.r18RunnerReunionDone)return false;
  if(e.minLevel&&player.level<e.minLevel)return false;
  if(e.maxLevel&&player.level>e.maxLevel)return false;
  const spec=e.combat||combatSpecs[e.title];
  if((typeof RoadScenarioRegistry!=='undefined'&&RoadScenarioRegistry.ready?RoadScenarioRegistry.usesEarlyLevelGate(e):region==='early')&&spec&&spec.level>Math.max(3,player.level+1))return false;
  return true;
 });
}
// Renormalize the original weights over categories with eligible candidates.
function r10Category(available,rng=Math.random){
 const kinds=Object.keys(R10_WEIGHTS).filter(k=>available[k]);
 const total=kinds.reduce((sum,k)=>sum+R10_WEIGHTS[k],0);
 if(!total)return null;
 let roll=rng()*total;
 for(const k of kinds){roll-=R10_WEIGHTS[k];if(roll<0)return k;}
 return kinds[kinds.length-1];
}
function r10Pick(region,kind,rng=Math.random){
 const objects=r10Pool(region),candidates=r10Candidates(region,kind);
 if(typeof RoadScenarioRegistry!=='undefined'&&RoadScenarioRegistry.wo3Installed){const priority=RoadScenarioRegistry.wo3Pick(region,kind,candidates,rng);if(priority!==undefined)return priority;}
 const history=player.flags.r10UnifiedHistory||[];
 const fresh=candidates.filter(i=>!history.some(t=>r10CanonicalTitle(t)===r10CanonicalTitle(objects[i].title)));
 const pool=fresh.length?fresh:candidates;
 return pool.length?pool[Math.floor(rng()*pool.length)]:null;
}
function r10Remember(region,kind,index){
 const title=r10Pool(region)[index]?.title;if(!title)return;
 const canonical=r10CanonicalTitle(title);
 player.flags.r10UnifiedHistory=[...(player.flags.r10UnifiedHistory||[]).filter(t=>r10CanonicalTitle(t)!==canonical),canonical].slice(-10);
}
function r10PrepareEncounter(){
 // Loading an in-progress encounter must retain its original scene and costs.
 if(resumeSavedEncounter)return true;
 const eligible=r10EligibleWanderers();
 if(portRecruitUnlocked()&&eligible.some(portRecruitEligible))player.flags.r10RecruitDrySegments=Math.min(100,(player.flags.r10RecruitDrySegments||0)+1);
 else player.flags.r10RecruitDrySegments=0;
 // Every ordinary road segment selects an encounter; no empty travel roll.
 const region=r10Region(),available={wanderer:eligible.length>0};
 for(const k of ['combat','exploration','salvage','environment'])available[k]=r10Candidates(region,k).length>0;
 const kind=r10Category(available);player.flags.r10LastRoadCategory=kind;
 if(!kind){add('No eligible road encounter is available. You return to the road menu.','system');completeRoadTurn();return false;}
 if(kind==='wanderer'){
  showRoadWanderer();
  if(portRecruitUnlocked()&&portRecruitEligible(wandererByName(currentRoadWanderer)))player.flags.r10RecruitDrySegments=0;
  return false;
 }
 const index=r10Pick(region,kind),q=r6Road();
 if(q?.active)q.index=index;
 roadEncounterOrder[currentRoadEncounterIndex()]=index;
 r10Remember(region,kind,index);return true;
}

RoadScenarioRegistry.finishPools();
