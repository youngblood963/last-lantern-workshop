/* Friday playthrough repairs. Preserve saved graph positions, item identities,
 * working casino accounting, healing rules, and weapon resale calculations. */
const PlaythroughRepairs={
 version:1,
 materialBids:{'Scrap Metal':4,Wire:4,Cloth:3,Rope:4,Fuel:6,Electronics:9,Chemicals:6,'Tempered Steel':16,'Uncommon Electrical Parts':12,'Explosive Components':8,'Small Animal Bones':2,'Animal Bones':3,'Large Animal Bones':4,'Animal Hide':4,'Animal Fat':2,Glass:2,Water:1,Glue:5},
 cleanLabel(value){return String(value).replace(/(?:\s*[-–—|:]\s*|\s*\[\s*|\s*\(\s*|\s+)forge[ _-]*(?:common|uncommon|rare|epic|legendary)[ _-]*\d+\s*[\])]?/gi,'').replace(/\s*\(L\d+\s+(?:COMMON|UNCOMMON|RARE|EPIC|LEGENDARY)\)/gi,'').replace(/\s+L\d+\s+(?:COMMON|UNCOMMON|RARE|EPIC|LEGENDARY)(?=\s*\[|$)/gi,'').trim();},
 relayClues(){
  const f=player.flags;if(!f.relayPartsRevealed||f.relayQuest==='complete')return;
  const parts=ensureRelayParts();
  for(const [key,title,route]of [
   ['johnny','POWER REGULATOR',"Solace: visit Johnny and ask about Relay parts."],
   ['yard','ANTENNA SERVO',"From Solace, take Works Junction, then Scrap Yard. Inspect Scrap Yard, defeat the Yardman, then Search Maintenance Yard."],
   ['branch','SHIELDED FEED COUPLER',"From Works Junction, take the road to Old Service Road. Inspect Signal Cabinet. The marked motel-side roads also reach this location."],
   ['east','SIGNAL-CONDITIONING MODULE',"From Works Junction, continue to the Factory. At the Factory crossroads, Search Equipment Rack."]
  ])add(`${parts[key]?'RECOVERED':'NEEDED'} — ${title}: ${route}`,'system');
 },
 rackAvailable(){const g=lanternState();return !!(g&&!g.currentEdgeId&&g.nodeId==='factory'&&player.flags.relayPartsRevealed&&!ensureRelayParts().east&&['lanternNode','eastEnd'].includes(stage));},
 rackChoice(){if(this.rackAvailable())lanternAppendChoices(['SEARCH EQUIPMENT RACK']);}
};
// The cabinet had a one-line exit without a registered numeric/hotkey binding.
// A real menu label fixes new visits and characters already saved inside it.
const repairBranchChoices=branchLandmarkChoices;
branchLandmarkChoices=function(){return lanternState()?.nodeId==='old-service-road'&&!lanternEdge()?'(B) BACK TO OLD SERVICE ROAD (FREE)':repairBranchChoices();};

// The Scrap Yard has the same singleton-menu problem after its last search.
const repairServiceChoices=serviceRoadChoices;
serviceRoadChoices=function(...args){const text=repairServiceChoices(...args);return !/\s{2,}/.test(text)&&/^BACK TO SCRAP YARD/.test(text)?'(B) '+text:text;};

// The advertised level-5 Rat Racing option must actually open in Jen's casino.
const repairCasinoCommand=handleCasinoCommand;
handleCasinoCommand=function(cmd){
 if(stage==='mercy'&&mercyLocation==='casino'&&['rat racing','rats'].includes(cmd)){
  if(player.level<5){add('RAT RACING — Reach Level 5.','system');casinoMenu();return true;}
  casinoOpen('rats');return true;
 }
 return repairCasinoCommand(cmd);
};

// Lantern travel replaced the legacy safe-stage names used by Steve's queue.
// Announce on the next real road encounter; never interrupt combat or free menus.
const repairSteveAnnouncement=showSteveAnnouncement;
showSteveAnnouncement=function(){
 const g=lanternState();
 if(g?.pending&&g.currentEdgeId&&['lanternRoad','lanternNode'].includes(stage)){
  const actualStage=stage;stage='between';try{return repairSteveAnnouncement();}finally{stage=actualStage;}
 }
 return repairSteveAnnouncement();
};

// Restore a clickable component search at both versions of the Factory exterior.
const repairCrossroads=r6Crossroads;
r6Crossroads=function(...args){const result=repairCrossroads(...args);PlaythroughRepairs.rackChoice();return result;};
showFactory=r6Crossroads;
const repairNodeMenu=lanternNodeMenu;
lanternNodeMenu=function(...args){const result=repairNodeMenu(...args);PlaythroughRepairs.rackChoice();return result;};
const repairCore=handleCommandCore;
handleCommandCore=async function(raw){
 const cmd=r5Mapped(raw);
 if(!busy&&cmd==='search equipment rack'&&PlaythroughRepairs.rackAvailable()){
  awardRelayPart('east','SIGNAL-CONDITIONING MODULE');
  if(stage==='lanternNode')lanternNodeMenu();else r6Crossroads();
  lanternSave();return;
 }
 const relayQuestion=!busy&&stage==='mercy'&&cmd==='ask about relay parts';
 const result=await repairCore(raw);
 if(relayQuestion)PlaythroughRepairs.relayClues();
 return result;
};
const repairRevealRelay=revealRelayParts;
revealRelayParts=function(...args){const first=!player.flags.relayPartsRevealed,result=repairRevealRelay(...args);if(first)PlaythroughRepairs.relayClues();return result;};
const repairJournal=showQuests;
showQuests=function(...args){const result=repairJournal(...args);if(player.flags.r5JournalPage!=='completed')PlaythroughRepairs.relayClues();return result;};

// Display-only cleanup. Keep saved/internal names and command keys untouched.
const repairGearLabel=gearLabel;
gearLabel=function(name){return PlaythroughRepairs.cleanLabel(repairGearLabel(name));};
const repairChoices=GraphicalUI.choices;
GraphicalUI.choices=function(){return repairChoices.call(this).filter(c=>c.command.trim().toLowerCase()!=='nudge').map(c=>({...c,label:PlaythroughRepairs.cleanLabel(c.label)}));};

// Owner's requested encounter target: 40% combat. Available categories are still
// renormalized by the existing selector; scripted fights and quest markers stay put.
Object.assign(R10_WEIGHTS,{combat:.40,wanderer:.20,exploration:.20,salvage:.12,environment:.08});
// Give ordinary road scenes more room between automatic badge/belt interruptions.
// Explicit quest acceptance, discovered clues and fixed quest markers are unchanged.
const repairQuestRoadEvent=questRoadEvent;
questRoadEvent=function(...args){const fired=repairQuestRoadEvent(...args);if(fired)player.flags.questEventCooldown=Math.max(4,Number(player.flags.questEventCooldown)||0);return fired;};

// Modest commodity bids; restore meaningful quotes for rare crafting materials.
// Only known material stacks change. Quest/unique protection, merchant funds,
// sale confirmation, equipment bids and all healing behavior remain authoritative.
const repairSellPrice=v48SellPrice;
v48SellPrice=function(item){
 if(item?.type==='material'&&Object.prototype.hasOwnProperty.call(PlaythroughRepairs.materialBids,item.name)){
  if(!v48Ordinary(item)||protectedUniqueEquipment(item.name))return 0;
  return PlaythroughRepairs.materialBids[item.name];
 }
 return repairSellPrice(item);
};
