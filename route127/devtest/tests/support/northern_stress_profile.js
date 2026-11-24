/* Isolated testing fixture. Never referenced by a production entry. Uses the
 * shipped registry, encounter menu, equipment catalog and unlimited-turn mode. */
(()=>{
 let serial=0;
 const api={
  roster(){return RoadScenarioRegistry.regionalCatalog.filter(e=>!['Inactive','Fixed'].includes(RoadLifecycle.policies[e.id]?.lifecycle)&&RoadScenarioRegistry.wo6Eligible(e.encounter,'NORTH'));},
  prepare({poor=false,night=false,level=5,ranged=false}={}){
   resetPlayer();player.handle='Northern Stress Ranger';player.level=level;player.xp=0;migrateXpProgress();player.hp=player.maxHp=baseHpForLevel(level);
   for(const [type,id]of [['weapon',ranged?'weapon-uncommon-restored-service-pistol':'weapon-uncommon-sharpened-machete'],['armor','armor-uncommon-highway-patrol-armor']]){const def=EQUIPMENT_CATALOG.find(e=>e.id===id);player[type]=catalogInstanceName(def,level);}
   player.turns=150;player.bolts=poor?0:5000;player.packMax=80;
   player.pack=poor?[]:[['Bandage','consumable',30],['Energy Bars','consumable',20],['Clean Water','consumable',10],['Cloth','material',10],['Scrap Metal','material',10],['Wire','material',10],['Electronics','material',5],['Rope','material',2],['Dog Food','consumable',3],['Battered Flashlight','tool',1]].map(([name,type,qty])=>({name,type,qty}));
   Object.assign(player.flags,{interfaceUnlocked:true,mercyDiscovered:true,murphyRideLevel10Astrid:true,mainSolaceQuest:'done',timQuest:'active',worldHour:night?0:12,nextRefillAt:Date.now()+86400000});
   lanternMigrate();Object.assign(lanternState(),{nodeId:'house',currentEdgeId:null,stepIndex:0,direction:1,pending:false,solaceAdmitted:true,lastSettlement:'solace'});
   testMode=true;busy=false;commandProcessing=false;combatState=null;returnStage=null;inventoryMode=null;resumeSavedEncounter=false;resultBuffer=null;currentRoadWanderer=null;currentTownWanderer=null;townWandererFocus=null;pendingTownFight=null;
   numberedChoices={};currentHotkeys={};roadTurn=0;dailyRoadTurns=0;roadGoal='east';roadTurnCharged=false;stage='mercy';mercyLocation='town';screen.replaceChildren();
   if(typeof FocusedEntry!=='undefined'){FocusedEntry.close();FocusedEntry.dismissed=null;}
   return player;
  },
  enter(id){
   const entry=this.roster().find(e=>e.id===id);if(!entry)throw Error('Not an Northern eligible scenario: '+id);
   const [region,index]=id.split(':');
   Object.assign(lanternState(),{nodeId:'house',currentEdgeId:'house--east-ridge',stepIndex:1,direction:1,pending:true,sceneId:'northern-controlled-'+Date.now()+'-'+(++serial),encounterRegion:region,encounterIndex:+index});
   lanternProject();delete player.encounterDone[roadTurn];roadTurnCharged=true;resumeSavedEncounter=true;stage='encounter';showEncounter();return entry;
  }
 };
 globalThis.NorthernStressFixture=api;
})();
