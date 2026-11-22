/* DEVTEST cosmetic layouts. Gameplay state and save slots are never edited here. */
/* Deployment refresh: include latest Pipe Robber.png upload and Miles rendering adjustment. */
(() => {
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
 const root=new URL('../devtest/',document.baseURI);
 const key='combat-visual-layouts-v1';
 const enemy=name=>'assets/enemies/'+name;
 const scenery=name=>'assets/scenarios/'+name;
 const locationArt=name=>'assets/locations/'+name;
 const sprite=(...names)=>names.map(enemy);
 const regionArt=region=>'../assets/regions/'+region.toLowerCase()+'.png';
 const normalize=name=>String(name||'').toUpperCase().replace(/^EAST ROAD — /,'');
 const assetName=path=>decodeURIComponent(new URL(path,root).pathname.split('/').at(-1));
 const unitKey=(path,index)=>index+':'+assetName(path);
 const states=new Map();
 function register(title,units,phase='both',variant='Standard',background=null,composition=null){
  const rows=states.get(title)||[];
  rows.push({units,phase,variant,background,composition});
  states.set(title,rows);
 }
 const industrialCinematics=new Map([
  ['THE PARTS TRUCK','the_parts_truck.png'],
  ['THE MIDNIGHT SHIFT','the_midnight_shift.png'],
  ['THE LAST PAYCHECK','the_last_paycheck.png'],
  ['THE LAST FAX MACHINE','the_last_fax_machine.png'],
  ['THE EMPTY ASSEMBLY LINE','the_empty_assembly_line.gif'],
  ['THE COLLAPSING CATWALK','the_collapsing_catwalk.gif'],
  ['THE BATTERY ROOM','the_battery_room.png'],
  ['THE FACTORY WHISTLE','the_factory_whistle.gif'],
  ['THE TRAINING VIDEO','the_training_video.png'],
  ['THE TRAPPED WORKER','the_trapped_worker.png'],
  ['THE WATER SHIPMENT','the_water_shipment.png'],
  ['CHEMICAL RUNOFF','chemical_runoff.gif'],
  ['DRAINAGE CULVERT','drainage_culvert.gif'],
  ['EMPLOYEE ENTRANCE ONLY','employee_entrance_only.png']
 ]);
 for(const [title,file] of industrialCinematics)register(title,[],'both','Full cinematic',scenery(file));
 for(const [title,files] of Object.entries({
  'BROKEN CLEANER BOT':['broken_cleaner_bot.png'],
  'AUTONOMOUS SECURITY HOUNDS':['autonomous_security_hound_1.png','autonomous_security_hound_2.png'],
  'FACTORY ENFORCERS':['factory_enforcer_1.png','factory_enforcer_2.png','factory_enforcer_3.png']
 }))register(title,sprite(...files));
 for(const [title,files] of Object.entries(globalThis.Route127RoadsidePresentation?.industrialEncounterSprites||{})){
  register(title,sprite(...files));
 }
 register('TUNNEL RATS',sprite('Tunnel Rat 1.png','Tunnel Rat 2.png'),'both','Two separate rats');
 for(const [title,file] of Object.entries({
  'THE SLEEPING ROBOT':'the_sleeping_robot.png',
  'THE LAST AUTONOMOUS TAXI':'the_last_autonomous_taxi.gif',
  'THE ROAD EATER':'the_road_eater.png',
  'THE SALVAGE YARD LEDGER':'the_salvage_yard_ledger.png',
  'THE SCRAP CLAIM':'the_scrap_claim.png'
 }))register(title,sprite(file));
 register('LOCKER IN THE CONCRETE PIPE',[scenery('the_spring_trap.png')]);
 register('THE TOOL CRIB',[scenery('the_tool_crib.png')]);
 register('THE WATER SHIPMENT',sprite('tanker_scavenger_1.png','tanker_scavenger_2.png'),
  'combat','Tanker Scavengers',scenery('the_water_shipment.png'));
 register('THE WATER SHIPMENT',sprite('settlement_water_guard_1.png','settlement_water_guard_2.png'),
  'combat','Settlement Water Guards',scenery('the_water_shipment.png'));
 for(const [title,files] of Object.entries({
  'BAT COLONY':Array(4).fill('bat_colony.png'),
  'RABID RACCOONS':Array(3).fill('rabid_raccoon.png'),
  'LOOTERS':['looters_1.png','looters_2.png','looters_3.png'],
  'PARKING LOT RAIDERS':['parking_lot_raiders-_1.png','parking_lot_raiders_2.png','parking_lot_raiders_3.png'],
  'GANG LOOKOUT':['gang_lookout.png'],
  'THE HOLLOWED':['the_hollowed_1.png','the_hollowed_2.png'],
  'THE SQUATTERS':['the_squatters_1.png','the_squatters_2.png','the_squatters_3.png'],
  'GUNSHOP OWNER':['gunshop_owner.png'],
  'HIGHWAY ROBBERS':['Tire Iron Robber.png','Spear Robber.png'],
  'THE MILK CRATES':['highway_hunter_rifleman.png','highway_hunter_enforcer.png','highway_hunter_tracker.png'],
  'ROADBLOCK':['Spear Robber.png','Pipe Robber.png'],
  'THE GATELESS WALL':['sentry.png'],
  'THE WARDEN':['warden.png'],
  'THE STRAY':['The Stray.png'],
  'THE CRAWLER':['The Crawler.png'],
  'THE BIG MAN':['The Big Man.png'],
  'THE BONE COLLECTOR':['The Bone Collector.png'],
  'THE BONE FLAGS':['bone_hunter_archer.png','bone_hunter_spearman.png'],
  'SECURITY DRONE':['Security Drone.png'],
  'SOMETHING IN THE DRAIN':['Something in the Drain - Grate and Claw.png'],
  'DRAINAGE STALKER':['culvert_crawler.png'],
  'THE WAX MUSEUM':['The Curator.png'],
  'THE WRECKERS':['Lone Scavenger - Friendly Scrapper.png','The Wreckers - Chain.png'],
  // Replaced below with the pantry-specific scene and combatants.
  'CHEMICAL BURNERS':['Chemical Burner 1.png','Chemical Burner 2.png'],
  'THE GRINDER CREW':['rivet.png','masked_scavenger.png'],
  'THE STEEL ORCHARD':['martha.png']
 }))register(title,sprite(...files));
 // Owner's rural encounter artwork. These variants feed the existing DEVTEST
 // visual editor; the shared scene files remain distinct from movable sprites.
 const ruralScene=(title,background,composition='sky',units=[],phase='approach',variant='Owner artwork')=>
  register(title,units,phase,variant,scenery(background),composition);
 ruralScene('THE COIN WELL','the_coin_well.png','road');
 ruralScene('RATS IN THE PANTRY','rats_in_the_pantry.png','road',[],'approach','Abandoned pantry');
 ruralScene('RATS IN THE PANTRY','rats_in_the_pantry.png','road',sprite('pantry_rat.png','pantry_rat.png','pantry_rat.png'),'combat','Three pantry rats');
 ruralScene('DUST OVER THE SCHOOLYARD','dust_over_the_schoolyard.png','sky',[],'approach','Fawn and mother in scene');
 ruralScene('DUST OVER THE SCHOOLYARD','dust_over_the_schoolyard.png','sky',sprite('schoolyard_deer.png'),'combat','Schoolyard doe');
 ruralScene('DUST OVER THE SCHOOLYARD','dust_over_the_schoolyard.png','sky',sprite('territorial_buck.png'),'combat','Buck fight');
 ruralScene('CORNFIELD STALKERS','cornfield_stalkers_scene.png','sky',sprite('cornfield_stalker_1.png','cornfield_stalker_2.png'),'both','Two independent stalkers');
 ruralScene('THE DARK CELLAR','dark_cellar_scene.png','sky',[],'approach','Frightened resident embedded');
 ruralScene('THE DARK CELLAR','dark_cellar_scene.png','sky',[],'combat','Frightened resident embedded');
 ruralScene('THE SAGGING FARMHOUSE','the_sagging_farmhouse.png','sky',[],'approach','Farmhouse exploration');
 register('THE WHEELBARROW',[scenery('the_wheelbarrow.png')],'approach','Wheelbarrow prop',null,'regional');
 register('THE WHEELBARROW',[scenery('the_wheelbarrow.png'),enemy('wheelbarrow_snake.gif')],'combat','Wheelbarrow and triggered snake',null,'regional');
 register('TERRITORIAL FARMERS',sprite('territorial_farmer_1.png','territorial_farmer_2.png'),'both','Neutral farmers — independent sprites',null,'regional');
 register('FERAL BULL',sprite('feral_bull.png'),'both','Feral bull',null,'regional');
 register('WARD OF THE FORGOTTEN',[],'approach','St. Mercy Hospital discovery',locationArt('st_mercy_hospital.png'),'none');
 register('GANG LOOKOUT',sprite('gang_lookout_1.png','gang_lookout_2.png'),'combat','Reinforcements');
 register('THE PAINTED ARROWS',sprite('Painted Arrows - Club Scavenger.png','Painted Arrows - Knife Scavenger.png'),'combat','Red arrow ambush');
 register('THE HANGING CAGE',sprite('silas_crowe_caged.png'),'approach','Caged');
 register('THE HANGING CAGE',sprite('silas_crowe.png'),'combat','Freed');
 for(const [title,files] of Object.entries({
  'ROACH NEST':[enemy('roach_nest_ordinary.png'),enemy('roach_nest_contaminated.png'),'../../roach_nest_aggressive_swarm.png'],
  'FERAL DOG':[enemy('feral_dog_mother_pups.png'),'../../feral_dog_hungry_lone.png','../../feral_dog_aggressive_lone.png','../../feral_dog_pack_concept.png'],
  'LONE SCAVENGER':sprite('Lone Scavenger - Suspicious Scavenger.png','Lone Scavenger - Friendly Scrapper.png','Lone Scavenger - Weary Trader.png'),
  'TUNNEL RATS':sprite('Tunnel Rats - Wild Boar.png')
 }))for(const path of files)register(title,[path],'both',assetName(path).replace(/\.png$/i,''));
 for(const [title,file] of Object.entries({
  'THE HANGING SHOES':'the_hanging_shoes.png','THE IRON HARVEST':'the_iron_harvest.png',
  'THE FENCE ARTIST':'the_fence_artist.png','THE SILENT PICNIC':'the_silent_picnic.png',
  'MILES THE COURIER':'miles_the_courier.png','THE LAST MAIL':'the_last_mail.png',
  'THE RUST PARADE':'the_rust_parade.png',
 'THE MASK MARKET':'the_mask_market.png',
  'THE PAPER STORM':'the_paper_storm.gif','THE FALSE SHOULDER':'the_false_shoulder.gif',
  'ABANDONED SUPPLY TRUCK':'fresh_meat_butcher.png',
  'COUNTY WORK TRUCK':'county_work_truck.png',
  'THE LOCKED TOOL CHEST':'locked_tool_chest.png',

  'A DRESSING IN THE DUST':'tommy_briggs_roadside.png',
  'THE BLADE CART':'runaway_blade_cart.gif',
  'THE DITCH BACKPACK':'abandoned_backpack.png',
 }))register(title,[],'both','Standard',scenery(file));
 register('THE CAROUSEL HORSE',[],'both','Standard',scenery('the_carousel_horse.png'));
 register('THE WELDED BUS',[],'both','Standard',scenery('the_welded_bus.png'));
 register('THE BURNT LIBRARY',[],'both','Standard',scenery('burnt_library.png'));
 // The overturned maintenance cart is a transparent foreground object, not a complete scene.
 register('OVERTURNED MAINTENANCE CART',[],'both','Standard',scenery('overturned_cart_battery.png'));
 // Bridge Toll has its own environment; only the regional sky sits behind its transparent upper area.
 register('THE BRIDGE TOLL',[],'both','Standard',scenery('bridge_toll.png'));
 // Transparent vehicle: keep regional terrain and dynamic sky behind it.
 register('ABANDONED SEDAN',[],'both','Standard',scenery('abandoned_sedan.png'));
 for(const period of ['dawn','day','dusk','night']){
  register('THE EMPTY BUS SHELTER',[],'approach',period,scenery('empty_bus_shelter_'+period+'.png'));
 }
 // New noncombat scenes: use their actual art files, not the generic regional background as a fake sprite.
 for(const [title,file] of Object.entries({
  'MAINTENANCE BOX':'maintenance_box.png',
  'CACHE UNDER THE MILEPOST':'milepost_cache.png'
 }))register(title,[],'both','Complete environmental scene',scenery(file));
 for(const [variant,file] of [
  ['Burger','old_billboard_burger.png'],
  ['Mechanic','old_billboard_mechanic.png'],
  ['Motel','old_billboard_motel.png'],
  ['Emergency kit','old_billboard_emergency_kit.png'],
  ['Soda','old_billboard_soda.png'],
  ['Road workers','old_billboard_road_workers.png'],
  ['Lantern symbol on back','old_billboard_back.png']
 ])register('OLD BILLBOARD',[],'both',variant,scenery(file));
 register('THE SHATTERED SILO',['silo_king.png','razorback.png','young_boar.png'].map(scenery),'both','Boars',scenery('the_shattered_silo.png'));

 // Newly uploaded owner artwork, DEVTEST Visual Testing registry only.
 // Use the original canonical titles/save identifiers rather than renaming encounters.
 register('RIDGELINE',[],'both','Animated landscape',scenery('ridgeline.gif'));
 register('SCRATCHING IN THE SHED',[],'both','Before discovery — hidden rabbit',scenery('scratching_in_the_shed_empty.gif'));
 register('SCRATCHING IN THE SHED',[],'both','After discovery — rabbit revealed',scenery('scratching_in_the_shed_rabbit.gif'));
 register('THE DRY FOUNTAIN',[],'both','The Road Enforcer — sky + dirt road',scenery('the_road_enforcer.png'));
 register('THE EMPTY ARMORY',[],'both','Full bunker interior',scenery('the_empty_armory.png'));
 register('IRRADIATED ROACHES',[],'both','The Forgotten Garden — sky only',scenery('the_forgotten_garden.png'));
 register("MURPHY'S LOST CORVETTE",[],'both','Blue Corvette — sky + dirt road',scenery('murphys_lost_corvette.png'));
 register('RUINED SIGNAL HUT',[],'both','Shattered Glass — sky + dirt road',scenery('shattered_glass.png'));
 register('BROKEN RADIO',[],'both','Station Nine discovery radio',scenery('station_nine_discovery.png'));
 // Owner-approved visual batch: encounter IDs and gameplay definitions are unchanged.
 // Sky-mode assets use the shared dynamic sky; the gas station additionally uses dirt road.
 for(const [title,file] of [
  ['THE MUD CANNON','the_mud_cannon.gif'],
  ['SHUTTERED ROADSIDE CAFE','the_last_special.png'],
  ['THE HOLLOW STATUE','the_hollow_statue.png'],
  ['THE GAS STATION','the_gas_station.png'],
  ['THE STRANDED HANDCART','the_last_stop.png']
 ])register(title,[],'both','Owner artwork',scenery(file));
 register('THE IRON CHOIR',[],'approach','Hanging valves — regional sky',scenery('the_iron_choir.png'));
 register('THE IRON CHOIR',[enemy('iron_choir_valve_raider.png'),enemy('iron_choir_patrol_raider.png')],
  'combat','Valve and patrol raiders',scenery('the_iron_choir.png'));
 register('THE SCRAP DUEL',[],'approach','Hubcap target game — regional sky',scenery('the_scrap_duel.png'));
 register('THE SCRAP DUEL',[enemy('hubcap_champion.png')],
  'combat','Hubcap Champion',scenery('the_scrap_duel.png'));

 // Newly approved 2026-11-12 batch. Keep original registry titles as keys.
 // These are scene previews, not changes to combat or encounter mechanics.
 register('THE KNIFE WIND',[],'both','The Road Reapers — sky only',enemy('the_road_reapers.png'));
 register('THE LIMPING HOUND',[],'both','Rescue the mastiff — sky only',scenery('the_limping_hound.png'));
 register('THE WALKING PEDDLER',[],'both','Old Pete — sky only',scenery('old_pete.png'));
 register('THE TIPPED DELIVERY TRUCK',[],'both','Delivery truck — sky only',scenery('the_tipped_delivery_truck.png'));
 register('THE TRAVELER',[],'both','Vale — sky and dirt road',scenery('the_traveler_vale.png'));
 register('THE SPRAINED RUNNER',[],'both','Sprained runner — sky and dirt road',scenery('the_sprained_runner.png'));
 register('BROKEN TOLL CREW',[],'both','The Last Patrol — sky and dirt road',scenery('the_last_patrol.png'));



 // November 16 owner uploads. These are DEVTEST combat-visual tool registrations;
 // keep original encounter IDs and gameplay choices intact.
 // Assets were uploaded into assets/enemies/ (including environmental compositions).
 register('LEAKING FREIGHT TANK',[],'both','Toxic Cargo — full scene / sky overlay',enemy('toxic_cargo.png'));
 register('FREIGHT CAR AMBUSH',[enemy('unauthorized_cargo.png')],'both','Unauthorized Cargo — forklift');
 register('THE CRANE NEST',sprite('crane_diving_bird.png','crane_nest_guard.png'),'both','Two crane birds — independent placement');
 register('THE POWDER MONKEY',[enemy('the_powder_monkey.png')],'both','Powder Monkey — individual sprite');
 // A single full-scene composition shows all five birds; do not duplicate the
 // five-bird image as five sprites. Gameplay still tracks five separate enemies.
 register('AGGRESSIVE SEAGULLS',[],'both','Five gulls — one cinematic composition',enemy('aggressive_seagulls.png'));
 register('SHIPWRECK SCAVENGERS',[],'both','Two scavengers and shipwreck — one composition',enemy('shipwreck_scavengers.png'));
 // The washed-out-shoulder GIF was reported uploaded but no matching file was
 // found at the approved filename/path. Keep a visible preview row so the user
 // can spot and correct the unresolved artwork without touching the save ID.
 register('THE WASHED-OUT SHOULDER',[],'both','Washed-out Shoulder — animated scene',scenery('the_washed_out_shoulder.gif'));

 // New Nov 16 owner uploads: preserve canonical scenario IDs and regional backgrounds.
 register('THE BURIED FREIGHT',[],'both','Buried freight — sky + dirt road',scenery('buried_freight.png'));
 register('HARBOR SECURITY DRONE',sprite('harbour_security_drone.png'),'both','Coastal flying drone — regional sky');
 register('FLOODLIGHT SWEEP',sprite('floodlight_drone_active.gif'),'both','Floodlight active — regional sky');
 register('FLOODLIGHT SWEEP',sprite('floodlight_drone_destroyed.gif'),'combat','Floodlight destroyed — regional sky');
 register('DOCKSIDE PIRATES',sprite('dockside_pirate_1.png','dockside_pirate_2.png','dockside_pirate_3.png'),'both','Three pirates — regional sky');
 register('SEAWALL SNIPER',sprite('tactical_sniper.png'),'both','Tactical Sniper — regional sky');
 register('CARGO HIJACKERS',sprite('crab_trap.png'),'both','The Crab Trap — regional sky');
 register('SCRAP CRAB NEST',sprite('scrap_crab_nest.png'),'both','Nest Guardian — regional sky');


 register('COLD ROAD CAMP',[],'approach','Abandoned camp',scenery('cold_road_camp.png'));
 register('COLD ROAD CAMP',[scenery('cold_road_camp_traveler.png')],'approach','Occupied camp',scenery('cold_road_camp.png'));
 register('SALT ON THE ROAD',[],'approach','Salt circle',scenery('salt_on_the_road.png'));
 register('SALT ON THE ROAD',sprite('chair_man.png'),'combat','Chair Man fight',scenery('salt_on_the_road.png'));
 register('FALLING WATCH PLATFORM',[],'approach','Collapsing lookout',scenery('collapsing_lookout.png'));
 register('TERRITORIAL SURVIVALISTS',sprite('territorial_survivalist_rifleman.png','territorial_survivalist_shotgun.png'));
 register('MOUNTAIN POACHERS',sprite('mountain_poacher_rifleman.png','mountain_poacher_trapper.png'));
 register('MOUNTAIN LIONS',sprite('mountain_lion.png'));

 register('THE CINDER WOLVES',[],'both','Cinder wolf pack',enemy('the_cinder_wolves.png'));
 register('THE DUST HORSES',[],'approach','Stampeding herd',scenery('the_dust_horses.png'));
 register('THE DUST HORSES',[scenery('dust_horse_brown.png')],'approach','Horse rescue');
 register('THE COLLAPSED DAM',[],'approach','Collapsed dam',scenery('the_collapsed_dam.png'));
 register('THE CHAIN BRIDGE',[],'approach','Animated chain bridge',scenery('the_chain_bridge.gif'));

 // These scenes are drawn by owner_final_scenarios using canonical IDs.
 // Match its combatant order so saved placement keys reach the correct sprites.
 const northernRuntimeScenes=new Map([
  ['east:22',[
   {units:[],phase:'approach',variant:'Salt quarry',background:scenery('salt_miners.png')},
   {units:[scenery('marlow_vance.png')],phase:'approach',variant:'Rescued Marlow',background:scenery('salt_miners.png')},
   {units:sprite('saltmaster.png','salt_overseer.png'),phase:'combat',variant:'Guard fight',background:scenery('salt_miners.png')}
  ]],
  ['east:12',[
   {units:[],phase:'approach',variant:'Suspended beam',background:scenery('the_quarry_lift.png')},
   {units:sprite('quarry_hookman.png','quarry_chain_swinger.png','quarry_strangler.png'),
    phase:'combat',variant:'Three gang members',background:scenery('the_quarry_lift.png')},
   {units:sprite('quarry_hookman.png','quarry_strangler.png'),
    phase:'combat',variant:'Beam dropped',background:scenery('the_quarry_lift_no_beam.png')}
  ]]
 ]);

 // The owner uploaded these complete scenes under assets/locations.
 const lowlandsCinematics=new Map([
  ['east:27',[
   ['Surface','sunken_chapel_exterior.png','sky'],
   ['Underwater','sunken_chapel_interior.png','none']
  ]],
  ['early:34',[['Greenhouse','rain_barrel.png','none']]],
  ['east:19',[['Quicksand cut','quicksand_cut.gif','sky']]],
  ['east:52',[['River of Fire','river_of_fire.gif','sky']]],
  ['east:77',[['Dominion Survey','dominion_survey.png','none']]],
  ['early:1',[['Washout salvage','washout_salvage.png','sky']]]
 ].map(([id,scenes])=>[id,scenes.map(([variant,file,composition])=>({
  units:[],phase:'approach',variant,background:locationArt(file),composition
 }))]));
 const lowlandsSprites=globalThis.Route127RoadsidePresentation?.lowlandsSprites||{};
 for(const [title,files] of Object.entries(lowlandsSprites)){
  register(title,sprite(...files),'both','Individual combatants');
 }

 const western=globalThis.Route127WesternArt;
 const rows=new Map();
 const byEncounter=new Map();
 const byTitle=new Map();
 for(const entry of [...RoadScenarioRegistry.entries,...RoadScenarioRegistry.regionalCatalog]){
  const id=entry.canonicalId||entry.id;
  if(!id||!entry.encounter)continue;
  const title=normalize(entry.encounter.title);
  byEncounter.set(entry.encounter,id);
  byTitle.set(title,id);
  if(rows.has(id))continue;
  const westernVariants=western?.scenes.get(title);
  const variants=westernVariants||lowlandsCinematics.get(id)||northernRuntimeScenes.get(id)||states.get(title)||[];
  const regionalSprites=Object.hasOwn(lowlandsSprites,title);
  const fight=regionalSprites||!!entry.encounter.combat||entry.references?.some(ref=>ref.category==='combat')||
   variants.some(spec=>spec.phase==='combat'||spec.embedded);
  rows.set(id,{
   id,title,name:id==='east:77'?'The Dominion Survey':title==='MOUNTAIN LIONS'?'Mountain Lion':entry.encounter.displayName||entry.name||entry.encounter.title,
   classification:entry.classification||'GLOBAL',regions:entry.regions||[],
   combat:!!fight,western:!!westernVariants,fullCinematic:industrialCinematics.has(title)||title==='ABANDONED SUPPLY TRUCK',regionalSprites,variants
  });
 }
 const ruralRows=new Map([
  ['THE COIN WELL',{initialPositions:[]}],
  ['RATS IN THE PANTRY',{initialPositions:[[50,61,24,48,1,false,2],[40,67,20,42,.88,false,2],[61,67,20,42,.88,true,3]]}],
  ['DUST OVER THE SCHOOLYARD',{initialPositions:[[50,56,34,64,1,false,2]]}],
  ['CORNFIELD STALKERS',{initialPositions:[[40,59,28,74,.82,false,1],[62,56,28,74,.9,true,3]]}],
  ['THE DARK CELLAR',{initialPositions:[]}],
  ['THE SAGGING FARMHOUSE',{initialPositions:[]}],
  ['THE WHEELBARROW',{nonCombatantAssets:['the_wheelbarrow.png'],initialPositions:[[52,72,45,50,.92,false,2],[55,60,26,58,.8,false,3]]}],
  ['TERRITORIAL FARMERS',{initialPositions:[[36,61,32,76,.92,false,2],[67,61,32,76,.92,true,3]]}],
  ['FERAL BULL',{initialPositions:[[51,67,54,69,.9,false,2]]}],
  ['WARD OF THE FORGOTTEN',{initialPositions:[]}]
 ]);
 for(const row of rows.values()){
  const config=ruralRows.get(row.title);
  if(config){Object.assign(row,config);row.fullCinematic=['THE COIN WELL','RATS IN THE PANTRY','DUST OVER THE SCHOOLYARD','CORNFIELD STALKERS','THE DARK CELLAR','THE SAGGING FARMHOUSE','WARD OF THE FORGOTTEN'].includes(row.title);}
 }
 // The registry retains the older titles for these repurposed encounter IDs.
 for(const [id,variant] of [
  ['east:75',{units:sprite('wild_bear.png'),phase:'both',variant:'Wild bear',background:null}],
  ['east:72',{units:[],phase:'approach',variant:'Lost convoy',background:scenery('the_lost_convoy.png')}]
 ]){
  const row=rows.get(id);
  if(row)row.variants.push(variant);
 }
 // Combat names differ from their saved encounter titles in the reworked scenes.
 for(const [combatName,encounterTitle] of [
  ['MARSH DOG PACK','SALT MARSH HUNTERS'],
  ['MALFUNCTIONING FORKLIFT','FREIGHT CAR AMBUSH'],
  ['CRANE NEST BIRDS','THE CRANE NEST'],
  ['POWDER MONKEY WITH KNIFE','THE POWDER MONKEY']
 ])if(byTitle.has(encounterTitle))byTitle.set(combatName,byTitle.get(encounterTitle));
 for(const [id,site] of [['east:67','Industrial Road — Fresh Mart'],['east:81','East Trade Route — St. Mercy Hospital']]){
  if(rows.has(id))rows.get(id).site=site;
 }
 const bosses=[
  ['SALVAGE KING','factory_salvage_king.png'],['GRINDER','factory_grinder.png'],
  ['THE CHEMIST','factory_chief_chemist.png'],['THE FOREMAN','factory_foreman.png']
 ];
 for(const [i,[title,file]] of bosses.entries()){
  const id='factory:boss:'+i;
  rows.set(id,{id,title,name:title,classification:'FIXED',regions:['INDUSTRIAL'],site:'Factory',
   combat:true,variants:[{units:[],background:locationArt(file),phase:'both',variant:'Boss room'}]});
 }
 const floorFiles=['factory_loading_receiving.png','factory_production_assembly.png',
  'factory_chemical_processing.png','factory_restricted_basement.png'];
 for(const [floor,names] of FACTORY_ENEMIES.entries()){
  for(const [slot,name] of names.entries()){
   const id='factory:floor:'+floor+':'+slot;
   const unit=enemy(name.toLowerCase().replaceAll(' ','_')+'.png');
   rows.set(id,{id,title:name,name,classification:'FIXED',regions:['INDUSTRIAL'],
    site:'Factory — '+FACTORY_FLOORS[floor].name,combat:true,variants:[
     {units:[unit],background:locationArt(floorFiles[floor]),phase:'combat',variant:'Factory enemy'}
    ]});
  }
 }
 const drainIndex=encounters.findIndex(e=>normalize(e.title)==='SOMETHING IN THE DRAIN');
 if(drainIndex>=0&&!byTitle.has('SOMETHING IN THE DRAIN')){
  const title='SOMETHING IN THE DRAIN',id='early:'+drainIndex;
  rows.set(id,{id,title,name:title,classification:'INACTIVE',regions:[],combat:true,variants:states.get(title)});
  byTitle.set(title,id);
  byEncounter.set(encounters[drainIndex],id);
 }
 for(const [id,name,region] of [
  ['house:squatter','House Squatter','CENTRAL'],['seaport:liberation','Seaport Liberation','SEAPORT'],
  ['factory:captors','Daniel’s Captors','INDUSTRIAL']
 ])rows.set(id,{id,name,title:normalize(name),classification:'FIXED',regions:[region],combat:true,variants:id==='seaport:liberation'?
   [{units:[],background:locationArt('seaport_occupied.png'),phase:'both',variant:'Occupied Harbor'}]:
   id==='house:squatter'?[{units:[enemy('house_squatter.png')],background:'../playtest/assets/locations/abandoned_house_interior.png',phase:'combat',variant:'Inside abandoned house'}]:
   id==='factory:captors'?[{units:[],background:scenery('daniel_factory_captors.png'),phase:'both',variant:'Daniel captive rescue scene'}]:[]});

 const scripted=[
  ['serviceBoss','The Yardman','Service Road','CENTRAL'],
  ['gateGuards','Solace Gate Guard','Solace Gate','CENTRAL'],
  ['jenBoss','Raider Captain','Last Call quest'],
  ['terribleBilly','Terrible Billy','Bounty encounter'],
  ['r18StationFight','Signal Hunters','Station Nine storyline'],
  ['r18DepotFight','County Unit 07','County Depot'],
  ['stationNineSecurity','Station Nine Security Unit','Station Nine garage'],
  ['r18RedFight','Red’s Fight','Rusty Anchor','SEAPORT'],
 ];
 const scriptIds=new Map();
 for(const [source,name,site,region] of scripted){
  const key=source;
  const id='scripted:'+key.toLowerCase().replace(/[^a-z0-9:]+/g,'-');
  scriptIds.set(key,id);
  rows.set(id,{id,name,title:normalize(name),classification:'FIXED',site,
   regions:region?[region]:[],combat:true,variants:source==='r18DepotFight'?
    [{units:[enemy('county_unit_07.png')],background:scenery('county_depot_interior.png'),phase:'combat',variant:'County Depot fight'}]:[]});
 }
 // The scripted loop above allocates the canonical serviceBoss row; attach its
 // cinematic art AFTER that loop so it is not overwritten with an empty variant.
 // Red fights in the same fully illustrated Rusty Anchor portrait used in dialogue.
 // Overlay his live HP in gameplay; no separate combatant image required.
 // Coast Road Scavenger is now a random SEAPORT encounter.
 // Keep its previously selected Highway Hunters rifleman artwork.
 for(const row of rows.values()){
  if(row.title==='COAST ROAD SCAVENGER'&&row.classification==='REGIONAL'){
   row.variants=[{units:[enemy('highway_hunter_rifleman.png')],phase:'combat',
    variant:'Highway Hunter rifleman — reused character artwork'}];
  }
 }
 const redRow=rows.get('scripted:r18redfight');
 if(redRow)redRow.variants=[{units:[],background:locationArt('rusty_anchor_red.png'),
   phase:'both',variant:'Red portrait — live HP meter in combat'}];
 const yardmanRow=rows.get('scripted:serviceboss');
 if(yardmanRow)yardmanRow.variants=[{units:[],phase:'both',variant:'Yardman cinematic — sky only',background:scenery('the_yardman.png')}];
 // Terrible Billy already has approved cinematic artwork; expose it to both
 // Combat Visual Testing states rather than reporting the scripted row as missing.
 const billyRow=rows.get('scripted:terriblebilly');
 if(billyRow)billyRow.variants=[{units:[],phase:'both',variant:'Terrible Billy bounty artwork',background:scenery('terrible_billy.png')}];
 // Last Call's Raider Captain already renders from the sidequest art handler.
 // Expose that same existing image to Combat Visual Testing without changing
 // its dynamic-sky/environment backdrop or the quest's combat behavior.
 const captainRow=rows.get('scripted:jenboss');
 if(captainRow)captainRow.variants=[{units:[],phase:'combat',
  variant:'Last Call — Raider Captain (existing combat artwork)',
  background:enemy('last_call_raider_captain.png')}];
 // Crazy Steve is a level-five promotional menu, not a random road registry fight.
 rows.set('scripted:crazy-steve',{id:'scripted:crazy-steve',title:'CRAZY STEVE',
  name:'Crazy Steve — Casino Announcement',classification:'FIXED',regions:['CENTRAL'],
  site:'Roadside · Level 5',combat:false,variants:[{units:[],phase:'approach',
  variant:'Steve introduction — sky only',background:scenery('crazy_steve.png')}]});
 // Existing scripted gate-guard combat: real Solace gate behind a standalone guard sprite.
 const gateGuard=rows.get('scripted:gateguards');
 if(gateGuard)gateGuard.variants=[{units:[enemy('solace_gate_guard.png')],
  background:'../playtest/assets/locations/solace_town_gate.png',
  phase:'combat',variant:'Solace gate — guard emerges'}];
 const gideon='wanderer:Gideon Briggs';
 rows.set(gideon,{id:gideon,title:'GIDEON BRIGGS',name:'Gideon Briggs',classification:'GLOBAL',
  regions:[],site:'Road wanderer',combat:false,variants:[{units:['assets/wanderers/rob_gideon.png'],
   phase:'approach',variant:'Road portrait',background:null}]});
 const installed=new Map([...rows.values()].flatMap(row=>row.variants.flatMap(v=>
  v.units.map(path=>[assetName(path),path]))));
 const bounds={x:[0,100],y:[0,100],width:[2,150],height:[2,150],scale:[.1,3],z:[0,30]};
 function unit(value){
  if(!value||typeof value!=='object')throw new Error('Invalid unit layout');
  const result={};
  for(const [name,[min,max]] of Object.entries(bounds)){
   if(!Number.isFinite(value[name])||value[name]<min||value[name]>max)throw new Error('Invalid '+name);
   result[name]=value[name];
  }
  if(typeof value.flip!=='boolean')throw new Error('Invalid facing');
  return {...result,flip:value.flip};
 }
 const sceneKey=(id,phase,device)=>[id,phase,device].join('/');
 function read(raw){
  const doc=JSON.parse(raw);
  if(doc.version!==1||!doc.scenes||Array.isArray(doc.scenes)||typeof doc.scenes!=='object')throw new Error('Expected Route 127 layout JSON v1');
  const scenes=Object.create(null);
  for(const [scene,units] of Object.entries(doc.scenes)){
   const [id,phase,device,...extra]=scene.split('/');
   if(!rows.has(id)||!['approach','combat'].includes(phase)||!['desktop','phone'].includes(device)||extra.length||
      !units||typeof units!=='object'||Array.isArray(units)||Object.keys(units).length>256)throw new Error('Invalid scene '+scene);
   const safe=Object.create(null);
   for(const [id,layout] of Object.entries(units)){
    if(!/^(?:background|attachment|\d{1,3}):[^/\\]{1,150}$/.test(id))throw new Error('Invalid unit key');
    if(id.startsWith('attachment:')&&!installed.has(id.slice(11)))throw new Error('Unknown attached asset');
    safe[id]=unit(layout);
   }
   scenes[scene]=safe;
  }
  return scenes;
 }
 function load(raw){try{return raw?read(raw):Object.create(null);}catch{return Object.create(null);}}
 const published=load(JSON.stringify(globalThis.Route127PublishedCombatLayouts||{}));
 let local=load(localStorage.getItem(key));
 const merged=()=>Object.fromEntries([...new Set([...Object.keys(published),...Object.keys(local)])].map(scene=>
  [scene,{...published[scene],...local[scene]}]));
 const json=scenes=>JSON.stringify({version:1,scenes},null,2);
 function save(scenes){
  const next=read(json(scenes));
  localStorage.setItem(key,json(next));
  local=next;
  GraphicalUI.schedule();
 }
 function importJSON(raw){
  const input=JSON.parse(raw);
  const documents=input?.legacyStorage?Object.values(input.legacyStorage).filter(doc=>doc?.version===1&&doc?.scenes):[input];
  if(!documents.length)throw new Error('This older layout format needs conversion. Share the exported JSON with Forge.');
  const incoming={};
  for(const doc of documents)for(const [scene,units] of Object.entries(read(JSON.stringify(doc)))){
   incoming[scene]={...incoming[scene],...units};
  }
  const next={...local};
  for(const [scene,units] of Object.entries(incoming))next[scene]={...next[scene],...units};
  save(next);
 }
 function get(id,phase,device){
  const scene=sceneKey(id,phase,device),desktop=sceneKey(id,phase,'desktop');
  const layouts={...published[desktop],...local[desktop],...published[scene],...local[scene]};
  // The Causeway has a narrow paved centerline. Override old published/browser
  // layout coordinates for the Roach Nest while crossing it; preserve custom
  // placements everywhere else and leave encounter/combat logic untouched.
  if(id==='early:15'&&typeof route127CurrentRegion==='function'&&
     typeof lanternState==='function'&&route127CurrentRegion(lanternState())==='CAUSEWAY'){
   for(const file of ['roach_nest_ordinary.png','roach_nest_contaminated.png','roach_nest_aggressive_swarm.png']){
    const key='0:'+file;
    layouts[key]={...layouts[key],x:50,y:70,width:42,height:64,scale:.78,z:2,flip:false};
   }
  }
  // On the narrow Causeway, The Stray's published left-shoulder position
  // places him over water. Shift only his sprite toward the road center.
  // Keep existing scale, depth, facing, and all other regional layouts.
  if(id==='early:6'&&typeof route127CurrentRegion==='function'&&
     typeof lanternState==='function'&&route127CurrentRegion(lanternState())==='CAUSEWAY'){
   const stray='0:The Stray.png';
   if(layouts[stray])layouts[stray]={...layouts[stray],x:52};
  }
  // Scrap Duel is a full cinematic scene, not a reduced sprite over regional sky.
  // Correct old device-saved layouts as well as the published 0.76-scale default.
  if(id==='east:11'&&layouts['background:the_scrap_duel.png']){
   layouts['background:the_scrap_duel.png']={
    ...layouts['background:the_scrap_duel.png'],x:50,y:50,width:100,height:100,scale:1,z:1,flip:false
   };
  }
  return layouts;
 }

 // DEVTEST-only live art mapping: the Visual Testing assignments must also appear
 // in actual encounter play, without editing scenario logic or save identifiers.
 const ownerRoadArt=new Map([
  ['LEAKING FREIGHT TANK','toxic_cargo.png'],
  ['THE WASHED-OUT SHOULDER','../scenarios/the_washed_out_shoulder.gif'],
  ['FREIGHT CAR AMBUSH','unauthorized_cargo.png'],
  ['MALFUNCTIONING FORKLIFT','unauthorized_cargo.png'],
  ['THE POWDER MONKEY','the_powder_monkey.png'],
  ['AGGRESSIVE SEAGULLS','aggressive_seagulls.png'],
  ['SHIPWRECK SCAVENGERS','shipwreck_scavengers.png']
 ]);
 const originalRoadModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const model=originalRoadModel.apply(this,args);
  const c=typeof combatState==='undefined'?null:combatState;
  const onRoad=typeof stage!=='undefined'&&(stage==='encounter'||
   (['combat','combatItems'].includes(stage)&&c?.source==='encounter'));
  if(!onRoad)return model;
  const encounter=typeof currentEncounter==='function'?currentEncounter():null;
  const title=normalize(encounter?.title||c?.name);
  const id=byEncounter.get(encounter);
  const scenes=stage==='encounter'&&lowlandsCinematics.get(id);
  if(scenes&&model.active){
   if(id==='east:77')model.title='THE DOMINION SURVEY';
   const underwater=id==='east:27'&&player.flags.r18ChapelScene?.underwater===true;
   const scene=scenes[underwater?1:0];
   const art=new URL(scene.background,root).href;
   const region=route127CurrentRegion(lanternState());
   const sky=scene.composition==='sky'?Route127EditorSky.describe(region,player.flags.worldHour):null;
   const imageReady=GraphicalUI.sceneArtworkReady(art);
   const skyReady=!sky||GraphicalUI.sceneArtworkReady(sky.sky);
   // Keep the currently available regional presentation until both layers decode.
   if(imageReady&&skyReady){
    model.art=art;
    model.scenarioBackdrop={art,mode:scene.composition};
    model.causewayBacking=false;
    model.regionalSky=sky&&{region,period:sky.period,sky:new URL(sky.sky).pathname.split('/').at(-1)};
   }
   return model;
  }
  const cinematic=industrialCinematics.get(title);
  if(cinematic&&route127CurrentRegion(lanternState())==='INDUSTRIAL'){
   model.art='../devtest/'+scenery(cinematic);
   model.regionalSky=null;
   return model;
  }
  const file=ownerRoadArt.get(title)||ownerRoadArt.get(normalize(c?.name));
  if(file){
   const art='../devtest/assets/'+(file.startsWith('../scenarios/')?'scenarios/'+file.slice('../scenarios/'.length):'enemies/'+file);
   if(['shipwreck_scavengers.png','toxic_cargo.png'].includes(file)){
    const phase=Route127RegionalSky.phase(player.flags.worldHour);
    const sky=new URL('../assets/regions/sky_'+(phase==='dusk'?'dawn':phase)+'.png',root).href;
    if(![art,sky].map(url=>this.sceneArtworkReady(url)).every(Boolean))return model;
    model.scenarioBackdrop={art,mode:'sky'};
    model.regionalSky=null;
   }
   model.art=art;
  }
  return model;
 };

 const selector='.r127-live-wanderer-road,.r127-bat-unit,.r127-raccoon-unit,.r127-human-unit,.r127-npc-figure,.r127-npc-combat,.r127-road-unit,.r127-silo-boar,.r127-final-unit';
 function activeScene(){
  // The level-five Crazy Steve promotional menu is a standalone graphical stage.
  if(typeof stage!=='undefined'&&stage==='r127StevePromo')return {id:'scripted:crazy-steve',phase:'approach'};
  const c=typeof combatState==='undefined'?null:combatState;
  if(!c&&(stage==='wandererRoad'&&currentRoadWanderer==='Gideon Briggs'||
   stage==='port55Recruit'&&player.flags.portHireOffer?.name==='Gideon Briggs'&&
   player.flags.portHireOffer.origin==='wandererRoad'))return {id:gideon,phase:'approach'};
  if(c?.r18DanielCaptors)return {id:'factory:captors',phase:'combat'};
  if(stage==='factoryDungeonRoom'&&!c){
   const f=player.flags.factoryDungeon;
   if(f&&f.room===FACTORY_FLOORS[f.floor]?.rooms.length-1&&!f.done?.includes(f.floor)){
    return {id:'factory:boss:'+f.floor,phase:'approach'};
   }
  }
  if(c?.source==='factoryFight'){
   const index=bosses.findIndex(([name])=>name===normalize(c.name));
   if(index>=0)return {id:'factory:boss:'+index,phase:'combat'};
   const floor=player.flags.factoryDungeon?.floor;
   const slot=FACTORY_ENEMIES[floor]?.indexOf(normalize(c.name))??-1;
   return slot<0?null:{id:'factory:floor:'+floor+':'+slot,phase:'combat'};
  }
  if(c?.source==='houseBoss')return {id:'house:squatter',phase:'combat'};
  const scriptedId=scriptIds.get(c?.source);
  if(scriptedId)return {id:scriptedId,phase:'combat'};
  if(c?.source==='seaportLiberation')return {id:'seaport:liberation',phase:'combat'};
  if(stage==='wo6FreshMart')return {id:'east:67',phase:'approach'};
  if(stage!=='encounter'&&!(c&&c.source==='encounter'&&['combat','combatItems'].includes(stage)))return null;
  const encounter=currentEncounter();
  const id=byEncounter.get(encounter)||byTitle.get(normalize(encounter?.title||c?.name));
  return id?{id,phase:c?'combat':'approach'}:null;
 }
 const getSlot=(node,index)=>node.dataset.batIndex??node.dataset.raccoonIndex??node.dataset.humanIndex??node.dataset.crewSlot??node.dataset.index??index;
 function artworkPlacement(img,scene,index,allowBackdrop=false){
  const name=assetName(img.src);
  // The Mask Market's live composition uses its WebP asset. Keep accepting
  // the published/editor placement key for the same scene artwork.
  const backdropName=name==='the_mask_market.webp'?'the_mask_market.png':name;
  for(const variant of rows.get(scene.id)?.variants||[]){
   if(variant.phase!=='both'&&variant.phase!==scene.phase)continue;
   if(allowBackdrop&&variant.background&&assetName(variant.background)===backdropName)
    return {key:'background:'+backdropName,background:true};
   if(variant.units[index]&&assetName(variant.units[index])===name)
    return {key:unitKey(img.src,index),background:false};
  }
  return null;
 }
 function figureUnits(e,scene){
  const units=[...e.figure.querySelectorAll(selector)].flatMap((node,index)=>{
   const img=node.tagName==='IMG'?node:node.querySelector('img');
   if(!img?.src)return [];
   const slot=getSlot(node,index);
   const placement=node.classList.contains('r127-final-unit')?
    artworkPlacement(img,scene,slot,node.classList.contains('r127-final-freight')):
    {key:unitKey(img.src,slot),background:false};
   return placement?[{node,img,...placement}]:[];
  });
  if(e.img?.src){
   const placement=artworkPlacement(e.img,scene,0,true);
   if(placement)units.push({node:e.img,img:e.img,...placement});
  }
  return units;
 }
 const styled=new Set();
 function apply(node,layout,background=false){
  node.classList.add('r127-layout-unit');
  node.classList.toggle('r127-layout-background',background);
  node.classList.toggle('r127-layout-flipped',layout.flip);
  for(const [name,suffix] of Object.entries({x:'%',y:'%',width:'%',height:'%',scale:'',z:''})){
   node.style.setProperty('--r127-layout-'+name,layout[name]+suffix);
  }
  styled.add(node);
 }
 const viewportDevice=()=>typeof matchMedia==='function'&&matchMedia('(max-width:600px)').matches?'phone':'desktop';
 function applyOverlay(node,index){
  const scene=activeScene(),img=node.querySelector('img');
  if(!scene||!img?.src)return;
  const placement=artworkPlacement(img,scene,index,node.classList.contains('r127-final-freight'));
  const layout=placement&&get(scene.id,scene.phase,viewportDevice())[placement.key];
  if(layout)apply(node,layout);
 }
 const css=document.createElement('style');
 css.textContent=`
 body.full-graphics .gfx-frame .gfx-art > .gfx-image:is(
  [src$="/the_parts_truck.png"],
  [src$="/the_midnight_shift.png"],
  [src$="/the_last_paycheck.png"],
  [src$="/the_last_fax_machine.png"],
  [src$="/the_battery_room.png"],
  [src$="/the_training_video.png"],
  [src$="/the_trapped_worker.png"],
  [src$="/the_water_shipment.png"]
 ){object-fit:contain;object-position:center}
 .gfx-frame .gfx-art>.gfx-image:is([src*="/quicksand_cut.gif"],[src*="/river_of_fire.gif"]){
  object-fit:cover;object-position:right bottom
 }
 .r127-layout-attachments{position:absolute;inset:0;z-index:5;pointer-events:none}
 .r127-layout-attachments img{object-fit:contain}
 .gfx-frame.r127-factory-unit-ready .gfx-main>.gfx-combat{display:none!important}
 .r127-factory-unit>img{display:block;width:100%;height:100%;object-position:center bottom}
 .r127-factory-unit>.r127-road-hp{
  position:absolute;top:100%;left:50%;transform:translateX(-50%);
  white-space:nowrap;color:#ffaaa4;background:#32100e;border:1px solid #aa413b;
  border-radius:4px;padding:3px 6px;font:700 clamp(10px,1.5vw,18px)/1.15 sans-serif
 }
 /* Smaller five-gull composition; leave artwork and regional scenery intact. */
  body.full-graphics .gfx-frame .gfx-art > img.gfx-image[src*="aggressive_seagulls.png"]:not(.r127-layout-unit){
   object-fit:contain!important;
   object-position:center center!important;
   transform:scale(.78)!important;
   transform-origin:center center!important;
  }
  /* Full-scene illustrations must not be cropped as sprite tiles. */
 .gfx-frame .gfx-art img[src*="miles_the_courier.png"],
 .gfx-frame .gfx-art img[src*="the_carousel_horse.png"]{object-fit:contain!important;object-position:center center!important}
 .gfx-frame .gfx-art.r127-layout-has-background{aspect-ratio:16/9;min-height:150px}
 /* Scrap Duel's authored scene fills the complete artwork viewport; no sky margin. */
 .gfx-frame .gfx-art img[src*="the_scrap_duel.png"]{object-fit:cover!important;object-position:center!important}
 .gfx-frame .gfx-art .r127-layout-unit{position:absolute!important;left:var(--r127-layout-x)!important;top:var(--r127-layout-y)!important;width:var(--r127-layout-width)!important;height:var(--r127-layout-height)!important;transform:translate(-50%,-50%) scale(var(--r127-layout-scale))!important;scale:none!important;z-index:var(--r127-layout-z)!important}
 /* Saved coordinates are relative to the scene, rather than a sprite grid cell. */
 .gfx-frame .gfx-art .r127-lowlands-units>.r127-layout-unit{grid-area:auto!important}
 .gfx-frame .gfx-art > img.gfx-image.r127-layout-unit:not(.r127-layout-background){
  max-width:none;max-height:none;object-fit:contain;object-position:center bottom
 }
 .gfx-frame .gfx-art img.r127-live-wanderer-road.r127-layout-unit{right:auto;bottom:auto;max-width:none;object-position:center}
 .gfx-frame .gfx-art .r127-layout-unit:not(.r127-layout-background)>img{transform:none!important}
 .gfx-frame .gfx-art .r127-layout-unit.r127-layout-flipped:not(.r127-layout-background)>img{transform:scaleX(-1)!important}
 .gfx-frame .gfx-art img.r127-layout-flipped{transform:translate(-50%,-50%) scale(calc(-1 * var(--r127-layout-scale)),var(--r127-layout-scale))!important}
 /* Light foreground character art only; never darken scenery, captions, or HP bars. */
 .gfx-frame .gfx-art[data-r127-character-light="dawn"] :is(.r127-bat-unit,.r127-raccoon-unit,.r127-human-unit,.r127-npc-figure,.r127-npc-combat,.r127-road-unit,.r127-silo-boar) img,
 .gfx-frame .gfx-art[data-r127-character-light="dawn"] :is(img.r127-bat-unit,img.r127-raccoon-unit,img.r127-human-unit,img.r127-npc-figure,img.r127-npc-combat,img.r127-road-unit,img.r127-silo-boar),
 .gfx-frame .gfx-art[data-r127-character-light="dawn"] .r127-layout-attachments img{filter:brightness(.94) saturate(.92) sepia(.10)!important}
 .gfx-frame .gfx-art[data-r127-character-light="dusk"] :is(.r127-bat-unit,.r127-raccoon-unit,.r127-human-unit,.r127-npc-figure,.r127-npc-combat,.r127-road-unit,.r127-silo-boar) img,
 .gfx-frame .gfx-art[data-r127-character-light="dusk"] :is(img.r127-bat-unit,img.r127-raccoon-unit,img.r127-human-unit,img.r127-npc-figure,img.r127-npc-combat,img.r127-road-unit,img.r127-silo-boar),
 .gfx-frame .gfx-art[data-r127-character-light="dusk"] .r127-layout-attachments img{filter:brightness(.78) saturate(.82) sepia(.15)!important}
 .gfx-frame .gfx-art[data-r127-character-light="night"] :is(.r127-bat-unit,.r127-raccoon-unit,.r127-human-unit,.r127-npc-figure,.r127-npc-combat,.r127-road-unit,.r127-silo-boar) img,
 .gfx-frame .gfx-art[data-r127-character-light="night"] :is(img.r127-bat-unit,img.r127-raccoon-unit,img.r127-human-unit,img.r127-npc-figure,img.r127-npc-combat,img.r127-road-unit,img.r127-silo-boar),
 .gfx-frame .gfx-art[data-r127-character-light="night"] .r127-layout-attachments img{filter:brightness(.62) saturate(.68) sepia(.12) hue-rotate(165deg)!important}
 `;
 document.head.append(css);
 let attachmentLayer=null;
 const oldSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=oldSync.apply(this,args), e=this.element, scene=activeScene();
  for(const node of styled)node.classList.remove('r127-layout-unit','r127-layout-background','r127-layout-flipped');
  styled.clear();
  e?.frame?.classList.remove('r127-factory-unit-ready');
  if(!scene||!e?.figure||e.frame.hidden){
   attachmentLayer?.remove();attachmentLayer=null;
   e?.figure?.classList.remove('r127-layout-has-background');
   return result;
  }
  // DAY intentionally has no filter: preserve the original bright character artwork.
  e.figure.dataset.r127CharacterLight=typeof Route127RegionalSky?.phase==='function'?Route127RegionalSky.phase(player?.flags?.worldHour):'day';
  const device=viewportDevice();
  const layouts=get(scene.id,scene.phase,device);
  const westernScene=rows.get(scene.id)?.western?western.current()?.variant:null;
  if(westernScene){
   if(westernScene.composition==='none')e.figure.dataset.r127CharacterLight='day';
   westernScene.units.forEach((path,index)=>{
    layouts[unitKey(path,index)]??=western.placement(index,westernScene.units.length,false);
   });
   if(westernScene.background)layouts['background:'+assetName(westernScene.background)]??=western.placement(0,0,true);
  }
  e.figure.classList.toggle('r127-layout-has-background',!!e.img?.src&&!!layouts['background:'+assetName(e.img.src)]);
  if(Object.keys(layouts).length)for(const item of figureUnits(e,scene)){
   if(!item.node.classList.contains('r127-final-unit')&&layouts[item.key])apply(item.node,layouts[item.key],item.background);
  }
  const attachments=Object.entries(layouts).filter(([key])=>key.startsWith('attachment:'));
  // The two crane enemies are individual sprites above the regional Lowlands
  // scenery; each is draggable through the Visual Testing tool and keeps its
  // own combat HP in the existing combat-status panel.
  if(rows.get(scene.id)?.title==='THE CRANE NEST'){
   const files=[enemy('crane_diving_bird.png'),enemy('crane_nest_guard.png')];
   const positions=[[34,45,43,73],[71,61,37,78]];
   files.forEach((path,index)=>{
    const name=assetName(path);
    if(attachments.some(([key])=>key==='attachment:'+name))return;
    const [x,y,width,height]=positions[index];
    attachments.push(['attachment:'+name,layouts[unitKey(path,index)]||
     {x,y,width,height,scale:1,z:4,flip:false}]);
   });
  }
  const factoryEnemy=combatState&&scene.id.startsWith('factory:floor:')?combatState:null;
  let factoryKey;
  if(factoryEnemy){
   // Ordinary Factory encounters have one fighter, identified by the active floor and combat name.
   const [path]=rows.get(scene.id).variants[0].units;
   const key=factoryKey='attachment:'+assetName(path);
   const index=attachments.findIndex(([id])=>id===key);
   if(factoryEnemy.hp>0){
    if(index<0)attachments.push([key,layouts[unitKey(path,0)]||
     {x:50,y:60,width:48,height:70,scale:1,z:4,flip:false}]);
   }else if(index>=0)attachments.splice(index,1);
  }
  const signature=scene.id+'/'+scene.phase+'/'+attachments.map(([key])=>key).join('/');
  if(attachmentLayer?.dataset.signature!==signature){
   attachmentLayer?.remove();attachmentLayer=null;
   if(attachments.length){
    attachmentLayer=document.createElement('div');
    attachmentLayer.className='r127-layout-attachments';
    attachmentLayer.dataset.signature=signature;
    for(const [key] of attachments){
     const image=document.createElement('img');
     image.src=new URL(installed.get(key.slice(11)),root).href;
     image.alt='';
     if(key===factoryKey){
      const unit=document.createElement('div');
      unit.className='r127-factory-unit';
      const hp=document.createElement('span');
      hp.className='r127-road-hp';
      image.addEventListener('load',()=>GraphicalUI.schedule());
      unit.append(image,hp);
      attachmentLayer.append(unit);
     }else attachmentLayer.append(image);
    }
    e.figure.append(attachmentLayer);
   }
  }
  attachments.forEach(([key,layout],index)=>{
   const node=attachmentLayer.children[index];
   apply(node,layout);
   if(key!==factoryKey)return;
   const image=node.querySelector('img'),label=node.querySelector('.r127-road-hp');
   const ready=image.complete&&image.naturalWidth>0;
   label.hidden=!ready;
   label.textContent=factoryEnemy.hp+' / '+factoryEnemy.maxHp+' HP';
   e.frame.classList.toggle('r127-factory-unit-ready',ready);
  });
  return result;
 };
 function capture(scene,device){
  const active=activeScene(),e=GraphicalUI.element;
  if(!active||active.id!==scene.id||active.phase!==scene.phase||!e?.figure?.getBoundingClientRect)return {};
  const phone=typeof matchMedia==='function'&&matchMedia('(max-width:600px)').matches;
  if(phone!==(device==='phone'))return {};
  return Object.fromEntries(figureUnits(e,active).filter(item=>!item.node.hidden).flatMap(item=>{
   const rect=item.node.getBoundingClientRect(), base=item.node.parentElement.getBoundingClientRect();
   if(!base.width||!base.height||!rect.width||!rect.height)return [];
   const style=getComputedStyle(item.node),imgStyle=getComputedStyle(item.img);
   const fit=(n,min,max)=>Math.max(min,Math.min(max,Math.round(n*100)/100));
   return [[item.key,{
    x:fit((rect.left-base.left+rect.width/2)/base.width*100,0,100),
    y:fit((rect.top-base.top+rect.height/2)/base.height*100,0,100),
    width:fit(rect.width/base.width*100,2,150),height:fit(rect.height/base.height*100,2,150),
    scale:1,z:fit(Number(style.zIndex)||2,0,30),flip:/^matrix\(-/.test(imgStyle.transform)
   }]];
  }));
 }
 globalThis.Route127CombatLayouts=Object.freeze({
  rows,installed,root,regionArt,assetName,unitKey,sceneKey,get,applyOverlay,local:()=>local,published:()=>published,merged,json,save,importJSON,capture,activeScene
 });
})();
