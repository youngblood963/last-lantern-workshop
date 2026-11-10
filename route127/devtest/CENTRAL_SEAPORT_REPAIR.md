# Central → Seaport encounter repair · issue 18

The existing menu authority now reads each roadside scenario's own prompt and remaining choices directly. All authored choices are retained, quest road marker actions are included, and a supported exit is last. Generic LEAVE uses the engine's existing leave path where an encounter had no explicit navigation. The hound naming input keeps its original handler.

The dedicated bat, raccoon, human and NPC renderers remain their scenes' owners. The generic roadside renderer yields to them before and during fights. Raccoons occupy a bounded 24% width / 42% height frame with the middle animal raised and flipped. HP labels flow below the image, with font and padding at 1.5 times the previous custom labels. Pre-fight views reserve the same space to avoid a scale jump on combat entry. A defeated actor's sprite and label disappear. Legacy combat panels are hidden when all actual enemies have individual sprites. Missing/composite actors use a compact red status fallback below the scene, and an image-load error restores status visibility.

Ten fully opaque PNGs were matted locally, including Curator, Bone Collector, Knife Scavenger, Friendly Scrapper, Big Man, Crawler, Sentry, and the three Robbers. Color-aware background detection and a narrow edge matte replaced the browser flood fill. Original dark character RGB and alpha were kept exactly for pixels below RGB 210, preserving wispy dark hair, faces, clothes and silhouette details. Transparent background RGB was cleared for lossless compression. No character was regenerated. Existing naturally transparent PNGs were left intact. Asset URLs and all changed scripts have a fresh cache key.

## Route and scope

This pass covers CENTRAL, INDUSTRIAL and SEAPORT roadside scenes and eligible GLOBAL entries. The direct road is below. Other regional roads and town/Factory combat sources are excluded from the new roadside menu/layout scope.

| Edge | Region | Turns |
| --- | --- | --- |
| house → solace-upper-junction | CENTRAL | 6 |
| solace-upper-junction → solace | CENTRAL | 4 |
| solace → works-junction | INDUSTRIAL | 3 |
| works-junction → factory | INDUSTRIAL | 3 |
| factory → boulder-junction | SEAPORT | 3 |
| boulder-junction → seaport | SEAPORT | 2 |


## Validation and remaining gaps

- 139 registry entries passed authored-choice preservation, unique graphical commands and exit-last tests. The registry includes historical aliases, so this count is not a count of unique enemy designs.
- Live-renderer DOM tests passed for Raccoons, Bats, Looters, Parking Lot Raiders, Highway Robbers, Curator, Bone Collector and Wreckers. They check individual HP attachment, death removal, exclusive ownership, Lookout reinforcement replacement and Painted Arrows' hidden ambushers.
- All assigned art paths in the checklist below exist with exact capitalization, including root-level dog/roach assets. The list records all variant files even when a particular variant is not currently selected.
- Existing Rusty Lantern, Solace, Seaport, WO33 scaling, Yardman/healing and presentation tests passed. The integrity suite still fails its pre-existing Grinder's Cutter sale-price assertion (102 versus 31). Road-balance still fails an undefined combat spec; both failures were reproduced with the unchanged baseline files.
- Full real-browser desktop and mobile layout acceptance is still pending. Local Chromium could not create its process socket in the sandbox, an escalated browser run was rejected because this environment disables escalation, and the separate browser could not connect to the local server. DOM tests do not prove visual proportions on a phone.
- Rivet has an approved sprite but his second crew member does not. His own HP label is shown below his portrait, and the compact fallback retains the unpictured crew member's status.
- Feral Dog pack art and the pantry-rat art are approved composite pictures. Independent character removal cannot safely be inferred from the overlapping artwork. Their per-unit HP remains available in the compact fallback. Individual approved cutouts are needed to meet full per-actor art removal for those variants.
- Wreckers' original single-state fight contains one aggregate enemy despite two characters in the approved picture. Its two images represent the authored encounter and keep the same aggregate HP semantics. The East-road two-unit variant gets two individual labels.
- The 106 entries marked environment-only below have no assigned scenario-specific character sprite in the repository, rather than a failing sprite URL. Several are object/exploration scenes and may intentionally use only the regional background. Any required new character art remains explicitly absent. No replacement was invented.

## Per-entry completion checklist

Menu PASS means all currently authored scenario choices and a final supported exit were checked. “Sprite HP tested” names the scenes exercised by DOM assertions. Composite/missing cases use the compact fallback. Desktop/mobile visual checks remain pending for every row.

| Registry entry | Region | Menu | Assigned art paths (relative to DEVTEST) | HP/art status |
| --- | --- | --- | --- | --- |
| ROADBLOCK (early:4) | GLOBAL | PASS (8) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE STRAY (early:6) | GLOBAL | PASS (5) | assets/enemies/The Stray.png | Mapped · shared label styling |
| HIGHWAY ROBBERS (early:13) | GLOBAL | PASS (4) | assets/enemies/Tire Iron Robber.png / assets/enemies/Spear Robber.png | Sprite HP tested |
| ROACH NEST (early:15) | GLOBAL | PASS (4) | assets/enemies/../../../../roach_nest_ordinary.png / assets/enemies/roach_nest_contaminated.png / assets/enemies/../../../../roach_nest_aggressive_swarm.png | Mapped · shared label styling |
| TUNNEL RATS (early:16) | GLOBAL | PASS (4) | assets/enemies/Tunnel Rats.png / assets/enemies/Tunnel Rats - Wild Boar.png | Mapped · shared label styling |
| FERAL DOG (early:17) | GLOBAL | PASS (3) | assets/enemies/feral_dog_mother_pups.png / assets/enemies/../../../../feral_dog_hungry_lone.png / assets/enemies/../../../../feral_dog_aggressive_lone.png / assets/enemies/../../../../feral_dog_pack_concept.png | Composite / missing actor · compact fallback |
| LONE SCAVENGER (early:18) | GLOBAL | PASS (4) | assets/enemies/Lone Scavenger - Suspicious Scavenger.png / assets/enemies/Lone Scavenger - Friendly Scrapper.png / assets/enemies/Lone Scavenger - Weary Trader.png | Mapped · shared label styling |
| GANG LOOKOUT (early:19) | GLOBAL | PASS (4) | assets/enemies/gang_lookout.png / assets/enemies/gang_lookout_1.png / assets/enemies/gang_lookout_2.png | Sprite HP tested |
| THE CRAWLER (early:20) | GLOBAL | PASS (5) | assets/enemies/The Crawler.png | Mapped · shared label styling |
| SECURITY DRONE (early:21) | GLOBAL | PASS (6) | assets/enemies/Security Drone.png | Mapped · shared label styling |
| THE WRECKERS (early:22) | INDUSTRIAL | PASS (4) | assets/enemies/The Wreckers - Pipe.png / assets/enemies/The Wreckers - Chain.png | Sprite HP tested |
| THE PAINTED ARROWS (early:39) | GLOBAL | PASS (4) | assets/enemies/Painted Arrows - Club Scavenger.png / assets/enemies/Painted Arrows - Knife Scavenger.png | Hidden until Arrow Ambush · two HP labels tested |
| IRRADIATED ROACHES (early:46) | GLOBAL | PASS (6) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE SCRAP CLAIM (early:48) | INDUSTRIAL | PASS (6) | Environment only · no assigned character sprite | Compact fallback if combat |
| BROKEN CLEANER BOT (early:51) | INDUSTRIAL | PASS (6) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE MILK CRATES (early:44) | CENTRAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE DRY FOUNTAIN (early:45) | CENTRAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE BIG MAN (early:11) | GLOBAL | PASS (3) | assets/enemies/The Big Man.png | Mapped · shared label styling |
| THE CRANE NEST (east:36) | SEAPORT | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE SHATTERED SILO (east:41) | CENTRAL+EAST | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE KNIFE WIND (east:33) | GLOBAL | PASS (6) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE IRON HARVEST (east:0) | CENTRAL+EAST | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE IRON CHOIR (east:6) | CENTRAL+INDUSTRIAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE BONE HUNTERS (east:10) | CENTRAL+NORTH+EAST | PASS (3) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE WARDEN (east:34) | GLOBAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE ROAD EATER (east:14) | INDUSTRIAL+NORTH | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE GATELESS WALL (east:30) | CENTRAL | PASS (6) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE BONE COLLECTOR (east:26) | NORTH+CENTRAL+EAST | PASS (6) | assets/enemies/The Bone Collector.png | Sprite HP tested |
| THE MUD CANNON (east:38) | GLOBAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| UNAUTHORIZED CARGO (east:57) | INDUSTRIAL+SEAPORT | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE LAST PATROL (east:58) | GLOBAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| FLOODLIGHT SWEEP (east:60) | INDUSTRIAL+SEAPORT | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| CULVERT CRAWLER (east:61) | GLOBAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE CRAB TRAP (east:62) | SEAPORT+LOWLANDS | PASS (3) | Environment only · no assigned character sprite | Compact fallback if combat |
| TACTICAL SNIPER (east:63) | INDUSTRIAL+SEAPORT | PASS (6) | Environment only · no assigned character sprite | Compact fallback if combat |
| SCRAP CRAB NEST (east:64) | SEAPORT+LOWLANDS | PASS (3) | Environment only · no assigned character sprite | Compact fallback if combat |
| COUNTY WORK TRUCK (early:0) | GLOBAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE GAS STATION (early:2) | CENTRAL | PASS (6) | Environment only · no assigned character sprite | Compact fallback if combat |
| ABANDONED SEDAN (early:3) | NORTH+CENTRAL+SEAPORT | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| DRAINAGE CULVERT (early:14) | INDUSTRIAL+LOWLANDS | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE TIPPED DELIVERY TRUCK (early:54) | GLOBAL | PASS (6) | Environment only · no assigned character sprite | Compact fallback if combat |
| SCRATCHING IN THE SHED (early:62) | CENTRAL+EAST | PASS (6) | Environment only · no assigned character sprite | Compact fallback if combat |
| RIDGELINE (early:10) | GLOBAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE WALKING PEDDLER (early:64) | GLOBAL | PASS (13) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE FENCE ARTIST (early:43) | CENTRAL+SEAPORT | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE BURNT LIBRARY (early:35) | CENTRAL+EAST | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE SILENT PICNIC (early:41) | WEST+CENTRAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE PAPER STORM (early:30) | GLOBAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| CEMETERY OF TIRES (early:27) | INDUSTRIAL | PASS (3) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE LIMPING HOUND (early:50) | GLOBAL | PASS (3) | Environment only · no assigned character sprite | Compact fallback if combat |
| MILES THE COURIER (early:66) | GLOBAL | PASS (3) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE WAX MUSEUM (east:17) | CENTRAL+WEST | PASS (5) | assets/enemies/The Curator.png | Sprite HP tested |
| THE EMPTY ARMORY (east:25) | CENTRAL | PASS (6) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE BLACK SNOW (east:13) | INDUSTRIAL+NORTH | PASS (6) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE STEEL ORCHARD (east:18) | GLOBAL | PASS (4) | assets/enemies/martha.png | Mapped · shared label styling |
| THE HANGING CAGE (east:39) | NORTH+EAST+INDUSTRIAL | PASS (6) | assets/enemies/silas_crowe_caged.png / assets/enemies/silas_crowe.png | Mapped · shared label styling |
| THE MASK MARKET (east:8) | GLOBAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE SCRAP DUEL (east:11) | GLOBAL | PASS (9) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE HOLLOW STATUE (east:21) | CENTRAL+INDUSTRIAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE FIGHTING RING (east:29) | NORTH+CENTRAL+INDUSTRIAL+LOWLANDS+EAST+SEAPORT | PASS (3) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE FORGOTTEN ARENA (east:42) | NORTH+CENTRAL+INDUSTRIAL+LOWLANDS+EAST+SEAPORT | PASS (3) | Environment only · no assigned character sprite | Compact fallback if combat |
| FRESH MEAT (east:65) | NORTH+CENTRAL+EAST | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE LAST SPECIAL — ROADHOUSE HASH (east:66) | WEST+CENTRAL+EAST | PASS (3) | Environment only · no assigned character sprite | Compact fallback if combat |
| SHATTERED GLASS (east:68) | CENTRAL+INDUSTRIAL+SEAPORT | PASS (3) | Environment only · no assigned character sprite | Compact fallback if combat |
| MAINTENANCE BOX (early:5) | GLOBAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE DITCH BACKPACK (early:52) | GLOBAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE LOCKED TOOL CHEST (early:56) | GLOBAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| STATION NINE DISCOVERY STORYLINE (early:60) | GLOBAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE LAST MAIL (early:25) | GLOBAL | PASS (3) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE BURIED FREIGHT (east:2) | INDUSTRIAL+SEAPORT | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE GRINDER CREW (east:20) | WEST+INDUSTRIAL | PASS (6) | assets/enemies/rivet.png | Composite / missing actor · compact fallback |
| MILEPOST CACHE (east:69) | NORTH+CENTRAL+SEAPORT | PASS (3) | Environment only · no assigned character sprite | Compact fallback if combat |
| OVERTURNED MAINTENANCE CART (east:70) | NORTH+CENTRAL+INDUSTRIAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE SPRING TRAP (east:71) | INDUSTRIAL+LOWLANDS | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| OLD BILLBOARD (early:8) | GLOBAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE TRAVELER (early:9) | GLOBAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE EMPTY BUS SHELTER (early:58) | CENTRAL+EAST | PASS (8) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE SPRAINED RUNNER (early:61) | GLOBAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE HANGING SHOES (early:24) | WEST+CENTRAL+EAST | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE CAROUSEL HORSE (early:31) | WEST+CENTRAL+EAST | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE BRIDGE TOLL (early:33) | GLOBAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE FALSE SHOULDER (early:26) | GLOBAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE GLASS FIELD (east:1) | CENTRAL+INDUSTRIAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE RED RAIN (east:3) | GLOBAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE BLADE CART (east:24) | GLOBAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE WELDED BUS (east:16) | WEST+CENTRAL+EAST | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE FURNACE PIT (east:7) | INDUSTRIAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE RUST PARADE (east:32) | WEST+CENTRAL+EAST | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE WASHED-OUT SHOULDER (east:54) | EAST+SEAPORT | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| TOXIC CARGO (east:73) | INDUSTRIAL+SEAPORT | PASS (3) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE LAST STOP (east:78) | WEST+CENTRAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| TOMMY BRIGGS — POSTAL ENCOUNTER (east:79) | GLOBAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| EAST ROAD — HIGHWAY ROBBERS (east:104) | GLOBAL | PASS (2) | assets/enemies/Tire Iron Robber.png / assets/enemies/Spear Robber.png | Sprite HP tested |
| EAST ROAD — THE CRAWLER (east:105) | GLOBAL | PASS (5) | assets/enemies/The Crawler.png | Mapped · shared label styling |
| EAST ROAD — THE WRECKERS (east:106) | INDUSTRIAL | PASS (4) | assets/enemies/The Wreckers - Pipe.png / assets/enemies/The Wreckers - Chain.png | Sprite HP tested |
| EAST ROAD — GANG LOOKOUT (east:107) | GLOBAL | PASS (2) | assets/enemies/gang_lookout.png / assets/enemies/gang_lookout_1.png / assets/enemies/gang_lookout_2.png | Sprite HP tested |
| EAST ROAD — SECURITY DRONE (east:108) | GLOBAL | PASS (6) | assets/enemies/Security Drone.png | Mapped · shared label styling |
| EAST ROAD — FERAL DOG (east:110) | GLOBAL | PASS (4) | assets/enemies/feral_dog_mother_pups.png / assets/enemies/../../../../feral_dog_hungry_lone.png / assets/enemies/../../../../feral_dog_aggressive_lone.png / assets/enemies/../../../../feral_dog_pack_concept.png | Composite / missing actor · compact fallback |
| EAST ROAD — LONE SCAVENGER (east:111) | GLOBAL | PASS (4) | assets/enemies/Lone Scavenger - Suspicious Scavenger.png / assets/enemies/Lone Scavenger - Friendly Scrapper.png / assets/enemies/Lone Scavenger - Weary Trader.png | Mapped · shared label styling |
| EAST ROAD — THE SCRAP CLAIM (east:121) | INDUSTRIAL | PASS (6) | Environment only · no assigned character sprite | Compact fallback if combat |
| EAST ROAD — ROACH NEST (east:122) | GLOBAL | PASS (4) | assets/enemies/../../../../roach_nest_ordinary.png / assets/enemies/roach_nest_contaminated.png / assets/enemies/../../../../roach_nest_aggressive_swarm.png | Mapped · shared label styling |
| EAST ROAD — IRRADIATED ROACHES (east:127) | GLOBAL | PASS (6) | Environment only · no assigned character sprite | Compact fallback if combat |
| MURPHY'S LOST CORVETTE (early:139) | GLOBAL | PASS (2) | Environment only · no assigned character sprite | Compact fallback if combat |
| Looters (early:146) | CENTRAL | PASS (3) | assets/enemies/looters_1.png / assets/enemies/looters_2.png / assets/enemies/looters_3.png | Sprite HP tested |
| The Hollowed (early:147) | CENTRAL | PASS (3) | assets/enemies/the_hollowed_1.png / assets/enemies/the_hollowed_2.png | Mapped · shared label styling |
| Rabid Raccoons (early:148) | CENTRAL | PASS (3) | assets/enemies/rabid_raccoon.png | Sprite HP tested |
| Bat Colony (early:149) | CENTRAL+NORTH+WEST | PASS (3) | assets/enemies/bat_colony.png | Sprite HP tested |
| The Squatters (early:150) | CENTRAL | PASS (3) | assets/enemies/the_squatters_1.png / assets/enemies/the_squatters_2.png / assets/enemies/the_squatters_3.png | Mapped · shared label styling |
| Parking Lot Raiders (early:151) | CENTRAL | PASS (3) | assets/enemies/parking_lot_raiders-_1.png / assets/enemies/parking_lot_raiders_2.png / assets/enemies/parking_lot_raiders_3.png | Sprite HP tested |
| Gunshop Owner (early:152) | CENTRAL | PASS (3) | assets/enemies/gunshop_owner.png | Mapped · shared label styling |
| Payment Required (early:153) | INDUSTRIAL | PASS (3) | Environment only · no assigned character sprite | Compact fallback if combat |
| Industrial Spiders (early:154) | INDUSTRIAL | PASS (3) | Environment only · no assigned character sprite | Compact fallback if combat |
| Chemical Burners (early:155) | INDUSTRIAL | PASS (3) | assets/enemies/Chemical Burner 1.png / assets/enemies/Chemical Burner 2.png | Mapped · shared label styling |
| Junkyard Hermit (early:156) | INDUSTRIAL | PASS (3) | Environment only · no assigned character sprite | Compact fallback if combat |
| Factory Enforcers (early:157) | INDUSTRIAL | PASS (3) | Environment only · no assigned character sprite | Compact fallback if combat |
| Scrap Torchers (early:158) | INDUSTRIAL | PASS (3) | Environment only · no assigned character sprite | Compact fallback if combat |
| Fuel Thieves (early:159) | INDUSTRIAL | PASS (3) | Environment only · no assigned character sprite | Compact fallback if combat |
| Dockside Pirates (early:169) | SEAPORT | PASS (3) | Environment only · no assigned character sprite | Compact fallback if combat |
| Shipwreck Scavengers (early:170) | SEAPORT | PASS (3) | Environment only · no assigned character sprite | Compact fallback if combat |
| Aggressive Seagulls (early:171) | SEAPORT | PASS (3) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE EMPTY ASSEMBLY LINE (early:181) | INDUSTRIAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE LAST FAX MACHINE (early:182) | INDUSTRIAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| EMPLOYEE ENTRANCE ONLY (early:183) | INDUSTRIAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE BATTERY ROOM (early:184) | INDUSTRIAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE TRAINING VIDEO (early:185) | INDUSTRIAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| LIVE WIRES (early:186) | INDUSTRIAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE COLLAPSING CATWALK (early:187) | INDUSTRIAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE PARTS TRUCK (early:188) | INDUSTRIAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE SLEEPING ROBOT (early:189) | INDUSTRIAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE TOOL CRIB (early:190) | INDUSTRIAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE SALVAGE YARD LEDGER (early:191) | INDUSTRIAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE TRAPPED WORKER (early:192) | INDUSTRIAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE WATER SHIPMENT (early:193) | INDUSTRIAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE FACTORY WHISTLE (early:194) | INDUSTRIAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE LAST PAYCHECK (early:195) | INDUSTRIAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE MIDNIGHT SHIFT (early:196) | INDUSTRIAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |
| CHEMICAL RUNOFF (early:197) | INDUSTRIAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| AUTONOMOUS SECURITY HOUNDS (early:198) | INDUSTRIAL | PASS (4) | Environment only · no assigned character sprite | Compact fallback if combat |
| THE LAST AUTONOMOUS TAXI (early:199) | INDUSTRIAL | PASS (5) | Environment only · no assigned character sprite | Compact fallback if combat |


## Reproduce

Run `node tests/roadside_repair.cjs` and `node tests/roadside_sprites.cjs` from DEVTEST. These tests use the real entry, registry, menu authority and renderer scripts with isolated fixture state. Gameplay formulas, encounter counts, rewards, inventory and save schema were not edited.

Owner route for visual approval is Old House → Solace → Works Junction → Factory road → Boulder Junction → Seaport. Check one solo, one group, a defeated group member, the Lookout's reinforcement wave, Curator hair, and Painted Arrows before/after red-arrow choice, then repeat in Classic and on a phone.
