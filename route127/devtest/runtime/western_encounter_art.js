/* DEVTEST encounter artwork shared by gameplay and Visual Testing. */
(() => {
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
 const scenery=file=>'assets/scenarios/'+file;
 const sprites=(...files)=>files.map(file=>'assets/enemies/'+file);
 const scene=(variant,composition,background=null,units=[],phase='both',embedded=false)=>({
  variant,composition,background,units,phase,embedded
 });
 const cinematic=(file,embedded=false)=>scene('Cinematic','sky',scenery(file),[],'both',embedded);
 const group=(file,count)=>scene('Individual combatants','regional',null,sprites(...Array(count).fill(file)));
 const indoor=(variant,file,units=[],phase='approach')=>scene(variant,'none',scenery(file),units,phase);
 const locked='the_locked_freezer.png',open='the_open_freezer.png';
 const bunker='buried_bunker_interior.png';
 const scenes=new Map([
  ['CARRION VULTURES',[group('carrion_vulture.png',3)]],
  ['RABID BADGERS',[group('rabid_badger.png',2)]],
  ['TERRITORIAL BUCK',[group('territorial_buck.png',1)]],
  ['STONES UNDER THE OAK',[cinematic('stones_under_the_oak.png')]],
  ['THE ABANDONED TRADING POST',[cinematic('abandoned_trading_post.png')]],
  ['THE FALSE SCARECROW',[cinematic('the_false_scarecrow.png')]],
  ['THE HONEY JAR',[scene('Cinematic','road',scenery('the_honey_jar.png'))]],
  ["THE HUNTER'S TRAP",[cinematic('the_hunters_trap.png')]],
  ['THE STRANDED FAMILY',[cinematic('the_stranded_family.png')]],
  ['THE MISSING STAIRS',[cinematic('the_missing_stairs.png')]],
  ['THE COUNTERFEIT RATIONS',[cinematic('counterfeit_rations.png',true)]],
  ['THE GRAVESIDE GAMBLER',[cinematic('the_graveside_gambler.png',true)]],
  ['THE TRAVELING TAXIDERMIST',[cinematic('the_traveling_taxidermist.png',true)]],
  ['THE ANT COLONY',[scene('Ant colony','road',sprites('ant_colony.png')[0])]],
  ['THE TAR POOL',[scene('Animated tar pool','regional',scenery('the_tar_pool.gif'))]],
  ['THE BURIED BUNKER',[
   scene('Exterior','road',scenery('the_buried_bunker.png'),[],'approach'),
   indoor('Interior and survivor',bunker,sprites('bunker_survivor.png')),
   indoor('Survivor combat',bunker,sprites('bunker_survivor.png'),'combat')
  ]],
  ['THE GARDEN GNOMES',[
   scene('Garden approach','sky',scenery('the_garden_gnomes.png'),[],'approach'),
   scene('Collector revealed','sky',scenery('the_garden_gnomes.png'),sprites('gnome_collector.png'),'approach'),
   scene('Collector combat','sky',scenery('the_garden_gnomes.png'),sprites('gnome_collector.png'),'combat')
  ]],
  ['THE LAST ORCHARD',[
   scene('Orchard','sky',scenery('the_last_orchard.png'),[],'approach'),
   scene('Scavengers','sky',scenery('the_last_orchard.png'),sprites('orchard_scavenger_1.png','orchard_scavenger_2.png'),'combat')
  ]],
  ['THE LOCKED FREEZER',[
   indoor('Locked freezer',locked),
   indoor('Open freezer and prisoner',open,sprites('freezer_prisoner.png')),
   indoor('Prisoner combat',open,sprites('freezer_prisoner.png'),'combat'),
   indoor('Two-raider ambush',open,sprites('restaurant_raider.png','freezer_raider.png'),'combat')
  ]],
  ['THE OIL DERRICK',[
   scene('Dialogue','sky',scenery('the_oil_derrick.png'),[],'approach'),
   scene('Deke combat','sky',scenery('oil_derrick_combat.png'),sprites('oil_saboteur_deke.png'),'combat')
  ]]
 ]);
 const url=path=>new URL('../devtest/'+path,document.baseURI).href;
 function current(){
  const combat=['combat','combatItems'].includes(stage)&&combatState?.source==='encounter'?combatState:null;
  if(stage!=='encounter'&&!combat)return null;
  const encounter=currentEncounter();
  const title=encounter?.title?.replace(/^EAST ROAD — /,'');
  const variants=scenes.get(title);
  if(!variants)return null;
  let index=0;
  if(title==='THE BURIED BUNKER'){
   const bunkerState=player.flags.wo7Scene;
   index=combat?2:bunkerState?.id==='W6'&&bunkerState.entered?1:0;
  }
  if(title==='THE GARDEN GNOMES'){
   const travel=lanternState();
   const key=travel?.sceneId||[day,dailyRoadTurns,roadGoal,roadTurn].join(':');
   index=combat?2:!player.flags.r18GnomeDefeated&&player.flags.r18GnomeRevealKey===key?1:0;
  }
  if(title==='THE LOCKED FREEZER'){
   index=combat?(combat.name==='FREEZER AMBUSH'?3:2):player.flags.r18FreezerScene?.opened?1:0;
  }
  if(combat&&['THE LAST ORCHARD','THE OIL DERRICK'].includes(title))index=1;
  return {title,variant:variants[index],combat};
 }
 function placement(index,total,background){
  if(background)return {x:50,y:50,width:100,height:100,scale:1,z:2,flip:false};
  return {x:(index+.5)*100/total,y:54,width:total===1?54:100/total,height:82,scale:1,z:4,flip:false};
 }
 globalThis.Route127WesternArt=Object.freeze({scenes,current,placement,url});
})();
