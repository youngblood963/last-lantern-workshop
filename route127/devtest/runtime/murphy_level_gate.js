/* DEVTEST — Murphy's Ride is a level-10 quest, not early-game free travel.
   Existing premature quest loot/state is held safely, never destroyed.
   This script runs after legacy Corvette and navigation wrappers. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof CorvetteRestoration==='undefined')return;
const LEVEL=10;
const PARTS=new Set(['Corvette Tire','Corvette Battery','Damaged Corvette Windshield',
  'Restored Corvette Windshield','Corvette Brake Lines',"Nessa's Locket"]);
const eligible=()=>Number(player?.level||0)>=LEVEL;
const flags=()=>player.flags||(player.flags={});
const saved=()=>flags().murphyRideLevel10Hold||(flags().murphyRideLevel10Hold={parts:[],quest:null});
const pending=()=>!!flags().wo3Corvette?.active||!!flags().wo3Corvette?.found;
const active=()=>eligible()&&pending();
let adjusting=false;
function holdEarly(){
 if(adjusting||eligible())return;
 adjusting=true;
 try{
  const f=flags(),h=saved();
  if(f.wo3Corvette&&Object.values(f.wo3Corvette).some(Boolean)&&!h.quest) {
    h.quest=JSON.parse(JSON.stringify(f.wo3Corvette));
  }
  if(f.wo3Corvette){
    f.wo3Corvette={active:false,found:false,batteryDraws:0,windshieldDraws:0,
      delivered:{},tiresRecovered:0,tiresSubmitted:0};
  }
  if(Array.isArray(player.pack)){
    const keep=[];
    for(const item of player.pack) {
      if(PARTS.has(item.name))h.parts.push({...item});
      else keep.push(item);
    }
    player.pack=keep;
  }
 }finally{adjusting=false}
}
function start(){
 if(!eligible())return false;
 const f=flags(),h=f.murphyRideLevel10Hold;
 if(h&&!f.murphyRideLevel10Restored){
  if(h.quest)f.wo3Corvette=structuredClone(h.quest);
  if(Array.isArray(h.parts)){
   for(const item of h.parts){
    const existing=player.pack.find(i=>i.name===item.name&&i.type===item.type&&!!i.stolen===!!item.stolen);
    if(existing)existing.qty+=Number(item.qty)||1;
    else player.pack.push({...item});
   }
  }
  f.murphyRideLevel10Restored=true;
  delete f.murphyRideLevel10Hold;
 }
 const q=CorvetteRestoration.state();q.active=true;
 return true;
}
function announce(){
 if(!eligible()||flags().murphyRideLevel10Astrid||!player.flags.interfaceUnlocked||
   ['title','wake','standing','handle','confirmHandle'].includes(stage))return;
 flags().murphyRideLevel10Astrid=true;
 add('ASTRID > Murphy is looking for you. Says he has a special job about an old Corvette. Find him at his workshop, look at his photo, or discover the car on the road.','bright');
}
const restoreState=CorvetteRestoration.state;
CorvetteRestoration.state=function(...args){holdEarly();return restoreState.apply(this,args)};
const prevDiscover=CorvetteRestoration.discover;
CorvetteRestoration.discover=function(...args){
 if(!eligible())return;
 start();return prevDiscover.apply(this,args);
};
const prevOptions=CorvetteRestoration.options;
CorvetteRestoration.options=function(...args){if(!eligible())return [];return prevOptions.apply(this,args)};
const prevMurphy=CorvetteRestoration.murphy;
CorvetteRestoration.murphy=function(cmd){
 if(!eligible()&&/^(ask about corvette parts|check corvette progress|deliver corvette parts|report corvette location|start corvette restoration|name corvette|buy repair)/.test(cmd))
  return true;
 if(eligible()&&cmd==='ask about corvette parts')start();
 if(eligible()&&/^(check corvette progress|deliver corvette parts|report corvette location|start corvette restoration)/.test(cmd)&&!active())
  {add('MURPHY > Ask me about the car first, or find it on the highway.','system');return true;}
 return prevMurphy.call(this,cmd);
};
const prevNeeds=RoadScenarioRegistry.wo3Needs;
RoadScenarioRegistry.wo3Needs=function(...args){return active()&&prevNeeds.apply(this,args)};
const prevChoices=lanternAppendChoices;
lanternAppendChoices=function(choices,...args){
 if(!eligible()&&stage==='mercy'&&mercyLocation==='murphy'&&Array.isArray(choices)){
  choices=choices.filter(c=>!/(?:CORVETTE PARTS|CORVETTE PROGRESS|DELIVER CORVETTE|REPORT CORVETTE|START CORVETTE|NAME CORVETTE|BUY REPAIR)/i.test(c));
 }
 return prevChoices.call(this,choices,...args);
};
const prevCandidates=r10Candidates;
r10Candidates=function(region,kind){
 const candidates=prevCandidates(region,kind);
 if(eligible())return candidates;
 return candidates.filter(i=>r10Pool(region)[i]?.title!=="MURPHY'S LOST CORVETTE");
};
const prevAddPack=addPack;
addPack=function(name,...args){
 if(!eligible()&&PARTS.has(name))return false;
 return prevAddPack.call(this,name,...args);
};
const prevOnce=RoadScenarioRegistry.wo2Once;
RoadScenarioRegistry.wo2Once=function(key,...args){
 if(!eligible()&&['windshield','wo3Battery'].includes(key))return false;
 return prevOnce.call(this,key,...args);
};
const prevCore=handleCommandCore;
handleCommandCore=async function(raw){
 holdEarly();
 const cmd=String(raw||'').toLowerCase().trim();
 if(!eligible()&&stage==='mercy'&&mercyLocation==='murphy'&&
    (/corvette|murphy.s ride/.test(cmd)||cmd==='2'&&['murphyMain','murphyTalk'].includes(flags().solaceMenu))){
   if(cmd==='2'&&flags().solaceMenu==='murphyTalk'){
     // Allow normal dialogue about the car, but never start the quest.
     return prevCore(raw);
   }
   if(cmd==='2'&&flags().solaceMenu==='murphyMain')return prevCore(raw);
   if(/^(ask about corvette parts|check corvette progress|deliver corvette parts|report corvette location|start corvette restoration)/.test(cmd))
     return;
 }
 if(eligible()&&stage==='mercy'&&mercyLocation==='murphy'&&
    (['inspect corvette','inspect corvette photo','corvette photo','ask about corvette parts'].includes(cmd)||
     cmd==='2'&&flags().solaceMenu==='murphyMain'))start();
 return prevCore(raw);
};
const prevQuests=showQuests;
showQuests=function(){holdEarly();return prevQuests.apply(this,arguments)};
const prevSync=GraphicalUI.sync;
GraphicalUI.sync=function(...args){
 holdEarly();
 announce();
 return prevSync.apply(this,args);
};
const prevLevel= gainXp;
gainXp=function(...args){const old=Number(player.level);const v=prevLevel.apply(this,args);if(old<LEVEL&&eligible())announce();return v};
holdEarly();
globalThis.Route127MurphyGate=Object.freeze({eligible,active,start,holdEarly});
})();
