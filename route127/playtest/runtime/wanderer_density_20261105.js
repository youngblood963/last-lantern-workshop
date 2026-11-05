/* WO29: make incidental wanderers occasional, stable per visit, not per menu redraw.
 * Keep all 50 characters, hired staff, scripted story encounters and save IDs.
 */
(()=>{
'use strict';
const ROAD_GAP=4;
const TOWN_CHANCE=.35;
const TOWN_GAP=3;
const townSpots=new Set(['mercy','jen','johnny','murphy','wayne','amii','gate']);
const turn=()=>Math.max(0,Number(player?.lifetimeTurns)||0);
function state(){
 const flags=player.flags;
 return flags.wandererDensityV1||(flags.wandererDensityV1={});
}
function available(w){return wandererAlive(w)&&!(typeof portIsHired==='function'&&portIsHired(w.name));}
function visit(city){
 const s=state(),key=String(day)+':'+turn(),old=s[city];
 if(old&&old.key===key)return old;
 let candidate=null;
 if(turn()-(Number.isFinite(s.lastIncidentalTurn)?s.lastIncidentalTurn:-100)>=TOWN_GAP&&Math.random()<TOWN_CHANCE){
  const pool=city==='solace'
   ?wanderers.filter(w=>available(w)&&townSpots.has(wandererLocations[w.name]))
   :wanderers.filter(w=>available(w)&&wandererLocations[w.name]==='seaport');
  if(city==='seaport'&&!pool.length){
   pool.push(...wanderers.filter(w=>available(w)&&![currentRoadWanderer,currentTownWanderer].includes(w.name)));
  }
  if(pool.length){candidate=pool[Math.floor(Math.random()*pool.length)].name;s.lastIncidentalTurn=turn();}
 }
 return s[city]={key,name:candidate};
}
function solaceAt(spot){
 const name=visit('solace').name;
 if(!name)return [];
 return wanderers.filter(w=>w.name===name&&available(w)&&wandererLocations[w.name]===spot);
}
function seaportName(){return visit('seaport').name;}
function seaportAllowed(){return !!seaportName();}
function showTown(spot){
 if(!townSpots.has(spot))return originalShow.apply(this,arguments);
 const here=solaceAt(spot);
 currentTownWanderer=here[0]?.name||null;
 if(currentTownWanderer){
  add(currentTownWanderer+' is here.');
  if(currentTownWanderer==='Vale')storyRecordValeSighting();
 }
}
const originalShow=showWanderersAt;
showWanderersAt=showTown;
// The road selector already has a 20% weight; prevent back-to-back rolls.
const originalEligible=r10EligibleWanderers;
r10EligibleWanderers=function(...args){
 const s=state();
 if(turn()-(Number.isFinite(s.lastRoadTurn)?s.lastRoadTurn:-100)<ROAD_GAP)return [];
 return originalEligible.apply(this,args);
};
const originalRoad=showRoadWanderer;
showRoadWanderer=function(...args){
 const result=originalRoad.apply(this,args);
 if(stage==='wandererRoad'&&currentRoadWanderer){
  state().lastRoadTurn=turn();
  state().lastIncidentalTurn=turn();
 }
 return result;
};
globalThis.Route127WandererDensity=Object.freeze({solaceAt,seaportAllowed,seaportName});
})();
