# Route 127 scenario audit — issue #25

Baseline `95d178790f5cb961df161941c7871fbee45029d5`. DEVTEST only.

The loaded registry and catalog yielded 396 records after expansion, representing 195 canonical IDs. They comprise 188 active roadside scenarios, two fixed sites, and five inactive entries. Every record resolved its authored choice text in the headless DEVTEST engine. The table collapses aliases by canonical ID and groups shared regional assignments together.

## Repairs

| ID | Repair | Verification |
|---|---|---|
| early:12 | Broken Motel → The County Offices. Harlan guards Office 204 in a county administration building. | Forced renderer caption, Office 204 choice, original lookup title. |
| early:46 | The Forgotten Farmhouse → The Forgotten Garden, the title specified in issue #25. | Forced renderer caption, original lookup title, chicken combat definition, East Road alias. |
| east:30 | The Sentry now resolves lowercase `sentry.png` during approach and the Wall Guards fight. | Actual Fight the Guards choice, combat caption and case-sensitive asset path. Existing multi-target controls remain available. |
| east:34 | The Warden uses `warden.png` and uses its scenario name as the image caption during combat. | Existing Warden fight and separate case-sensitive asset mapping. |
| east:33 | The Road Reapers title retained under its canonical ID. | Forced caption and existing Fight Both Reapers choice. |

Runtime changes are in `presentation_formatting.js`, `roadside_art_20261110.js`, and `dev_options.js`. The combat art preview exposes The Sentry and The Warden separately. `index.html` versions the scripts and `tests/roadside_sprites.cjs` exercises the live renderer functions in a DOM harness.

## Open review items

- **east:30 visual design.** One Sentry portrait is available for a toll post with a marksman, gunner, and optional machine gun target. Options are to keep the representative Sentry portrait or commission individual art for the other targets. The encounter retains its current mechanics.
- **early:60 naming.** Station Nine Discovery Storyline reads like an internal label. Possible titles are Station Nine or Signal from Station Nine. The current wording is retained pending a decision.
- **early:47 naming.** Rats in the Pantry takes place at a roadside food cart. Possible titles are Rats at the Food Cart or The Rat-Infested Food Cart. The current wording is retained pending a decision.
- Desktop and mobile visual coverage for all scenarios, every conditional action branch, and manual DevTools interaction remain unverified. The local Chromium launcher failed to create a process socket.

## Inventory

### Global

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| early:0 | COUNTY WORK TRUCK | Retained |
| east:61 | DRAINAGE STALKER → CULVERT CRAWLER | Retained |
| early:17 | FERAL DOG | Retained |
| early:19 | GANG LOOKOUT | Retained |
| early:13 | HIGHWAY ROBBERS | Retained |
| early:18 | LONE SCAVENGER | Retained |
| early:5 | MAINTENANCE BOX | Retained |
| early:66 | MILES THE COURIER | Retained |
| early:139 | MURPHY'S LOST CORVETTE | Retained |
| early:8 | OLD BILLBOARD | Retained |
| early:10 | RIDGELINE | Retained |
| early:15 | ROACH NEST | Retained |
| early:4 | ROADBLOCK | Retained |
| early:21 | SECURITY DRONE | Retained |
| early:60 | BROKEN RADIO → STATION NINE DISCOVERY STORYLINE | Owner review — title wording |
| early:11 | THE BIG MAN | Retained |
| east:24 | THE BLADE CART | Retained |
| early:33 | THE BRIDGE TOLL | Retained |
| early:20 | THE CRAWLER | Retained |
| early:52 | THE DITCH BACKPACK | Retained |
| early:26 | THE FALSE SHOULDER | Retained |
| early:46 | IRRADIATED ROACHES → THE FORGOTTEN GARDEN | Repaired — farmhouse garden and chickens |
| early:25 | THE LAST MAIL | Retained |
| east:58 | BROKEN TOLL CREW → THE LAST PATROL | Retained |
| early:50 | THE LIMPING HOUND | Retained |
| early:56 | THE LOCKED TOOL CHEST | Retained |
| east:8 | THE MASK MARKET | Retained |
| east:38 | THE MUD CANNON | Retained |
| early:39 | THE PAINTED ARROWS | Retained |
| early:30 | THE PAPER STORM | Retained |
| east:3 | THE RED RAIN | Retained |
| east:33 | THE KNIFE WIND → THE ROAD REAPERS | Verified existing rename — motorcycle and Reapers |
| east:11 | THE SCRAP DUEL | Retained |
| early:61 | THE SPRAINED RUNNER | Retained |
| east:18 | THE STEEL ORCHARD | Retained |
| early:6 | THE STRAY | Retained |
| early:54 | THE TIPPED DELIVERY TRUCK | Retained |
| early:9 | THE TRAVELER | Retained |
| early:64 | THE WALKING PEDDLER | Retained |
| east:34 | THE WARDEN | Repaired caption — separate Warden art |
| east:79 | A DRESSING IN THE DUST → TOMMY BRIGGS — POSTAL ENCOUNTER | Retained |
| early:16 | TUNNEL RATS | Retained |

### CENTRAL

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| early:152 | GUNSHOP OWNER | Retained |
| early:146 | LOOTERS | Retained |
| early:151 | PARKING LOT RAIDERS | Retained |
| early:148 | RABID RACCOONS | Retained |
| early:45 | THE DRY FOUNTAIN | Retained |
| east:25 | THE EMPTY ARMORY | Retained |
| early:2 | THE GAS STATION | Retained |
| early:147 | THE HOLLOWED | Retained |
| early:44 | THE MILK CRATES | Retained |
| east:30 | THE GATELESS WALL → THE SENTRY | Repaired art — separate toll-post encounter |
| early:150 | THE SQUATTERS | Retained |

### CENTRAL / EAST

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| early:62 | SCRATCHING IN THE SHED | Retained |
| early:35 | THE BURNT LIBRARY | Retained |
| early:58 | THE EMPTY BUS SHELTER | Retained |
| east:0 | THE IRON HARVEST | Retained |
| east:41 | THE SHATTERED SILO | Retained |

### CENTRAL / INDUSTRIAL

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| east:1 | THE GLASS FIELD | Retained |
| east:21 | THE HOLLOW STATUE | Retained |
| east:6 | THE IRON CHOIR | Retained |

### CENTRAL / INDUSTRIAL / SEAPORT

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| east:68 | RUINED SIGNAL HUT → SHATTERED GLASS | Retained |

### CENTRAL / NORTH / EAST

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| east:10 | THE BONE FLAGS → THE BONE HUNTERS | Retained |

### CENTRAL / NORTH / WEST

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| early:149 | BAT COLONY | Retained |

### CENTRAL / SEAPORT

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| early:43 | THE FENCE ARTIST | Retained |

### CENTRAL / WEST

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| east:17 | THE WAX MUSEUM | Retained |

### EAST

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| early:166 | CORNFIELD STALKERS | Retained |
| early:65 | DUST OVER THE SCHOOLYARD | Retained |
| early:168 | FERAL BULL | Retained |
| early:47 | RATS IN THE PANTRY | Owner review — food cart setting |
| early:167 | TERRITORIAL FARMERS | Retained |
| early:42 | THE COIN WELL | Retained |
| early:12 | BROKEN MOTEL → THE COUNTY OFFICES | Repaired — county office setting |
| early:7 | THE DARK CELLAR | Retained |
| early:63 | THE SAGGING FARMHOUSE | Retained |
| early:40 | THE WHEELBARROW | Retained |

### EAST / LOWLANDS

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| early:34 | THE RAIN BARREL | Retained |

### EAST / SEAPORT

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| east:54 | THE WASHED-OUT SHOULDER | Retained |

### EAST / WEST

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| early:36 | THE GARDEN GNOMES | Retained |

### Fixed sites

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| east:67 | SMOKE BEYOND THE GUARDRAIL → CLEANUP ON AISLE NINE | Retained |
| east:81 | THE LONG SHADOWS → WARD OF THE FORGOTTEN | Retained |

### INDUSTRIAL

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| early:198 | AUTONOMOUS SECURITY HOUNDS | Retained |
| early:51 | BROKEN CLEANER BOT | Retained |
| early:27 | CEMETERY OF TIRES | Retained |
| early:155 | CHEMICAL BURNERS | Retained |
| early:197 | CHEMICAL RUNOFF | Retained |
| early:183 | EMPLOYEE ENTRANCE ONLY | Retained |
| early:157 | FACTORY ENFORCERS | Retained |
| early:159 | FUEL THIEVES | Retained |
| early:154 | INDUSTRIAL SPIDERS | Retained |
| early:156 | JUNKYARD HERMIT | Retained |
| early:186 | LIVE WIRES | Retained |
| early:153 | PAYMENT REQUIRED | Retained |
| early:158 | SCRAP TORCHERS | Retained |
| early:184 | THE BATTERY ROOM | Retained |
| early:187 | THE COLLAPSING CATWALK | Retained |
| early:181 | THE EMPTY ASSEMBLY LINE | Retained |
| early:194 | THE FACTORY WHISTLE | Retained |
| east:7 | THE FURNACE PIT | Retained |
| early:199 | THE LAST AUTONOMOUS TAXI | Retained |
| early:182 | THE LAST FAX MACHINE | Retained |
| early:195 | THE LAST PAYCHECK | Retained |
| early:196 | THE MIDNIGHT SHIFT | Retained |
| early:188 | THE PARTS TRUCK | Retained |
| early:191 | THE SALVAGE YARD LEDGER | Retained |
| early:48 | THE SCRAP CLAIM | Retained |
| early:189 | THE SLEEPING ROBOT | Retained |
| early:190 | THE TOOL CRIB | Retained |
| early:185 | THE TRAINING VIDEO | Retained |
| early:192 | THE TRAPPED WORKER | Retained |
| early:193 | THE WATER SHIPMENT | Retained |
| early:22 | THE WRECKERS | Retained |

### INDUSTRIAL / LOWLANDS

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| early:14 | DRAINAGE CULVERT | Retained |
| east:71 | LOCKER IN THE CONCRETE PIPE → THE SPRING TRAP | Retained |

### INDUSTRIAL / NORTH

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| east:13 | THE BLACK SNOW | Retained |
| east:14 | THE ROAD EATER | Retained |

### INDUSTRIAL / SEAPORT

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| east:60 | FLOODLIGHT SWEEP | Retained |
| east:63 | SEAWALL SNIPER → TACTICAL SNIPER | Retained |
| east:2 | THE BURIED FREIGHT | Retained |
| east:73 | LEAKING FREIGHT TANK → TOXIC CARGO | Retained |
| east:57 | FREIGHT CAR AMBUSH → UNAUTHORIZED CARGO | Retained |

### Inactive catalog entries

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| east:55 | A CUP LEFT WARM | Inactive |
| east:56 | A QUIET MILE | Inactive |
| east:53 | FREIGHT WAGON CACHE | Inactive |
| east:76 | LETTERS BENEATH A STONE | Inactive |
| east:80 | SALT WIND THROUGH THE REEDS | Inactive |

### LOWLANDS

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| early:160 | ALLIGATORS | Retained |
| early:162 | BACKWOODS CANNIBALS | Retained |
| early:164 | GIANT MOSQUITOES | Retained |
| early:165 | HOSTILE SWAMP DWELLERS | Retained |
| east:59 | SALT MARSH HUNTERS → MARSH DOG PACK | Retained |
| east:52 | RIVER OF FIRE | Retained |
| early:163 | SNAPPING TURTLES | Retained |
| east:77 | THE ROADSIDE MEASURING WALL → THE BROKEN BRIDGE DISCOVERY | Retained |
| east:28 | THE LIME FOG | Retained |
| east:19 | THE QUICKSAND CUT | Retained |
| east:31 | THE TAR POOL | Retained |
| early:161 | WATER MOCCASINS | Retained |

### NORTH

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| early:142 | MOUNTAIN LIONS | Retained |
| early:140 | MOUNTAIN POACHERS | Retained |
| early:29 | SALT ON THE ROAD | Retained |
| early:141 | TERRITORIAL SURVIVALISTS | Retained |
| east:5 | THE COLLAPSED DAM | Retained |
| east:12 | THE QUARRY LIFT | Retained |
| east:22 | THE SALT MINERS | Retained |

### NORTH / CENTRAL / EAST

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| east:65 | ABANDONED SUPPLY TRUCK → FRESH MEAT | Retained |
| east:26 | THE BONE COLLECTOR | Retained |

### NORTH / CENTRAL / INDUSTRIAL

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| east:70 | OVERTURNED MAINTENANCE CART | Retained |

### NORTH / CENTRAL / INDUSTRIAL / LOWLANDS / EAST / SEAPORT

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| east:29 | THE FIGHTING RING | Retained |
| east:42 | THE FORGOTTEN ARENA | Retained |

### NORTH / CENTRAL / SEAPORT

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| early:3 | ABANDONED SEDAN | Retained |
| east:69 | CACHE UNDER THE MILEPOST → MILEPOST CACHE | Retained |

### NORTH / EAST / INDUSTRIAL

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| east:39 | THE HANGING CAGE | Retained |

### NORTH / WEST

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| east:74 | FALLING WATCH PLATFORM → COLLAPSING LOOKOUT | Retained |
| east:15 | THE CHAIN BRIDGE | Retained |
| east:23 | THE CINDER WOLVES | Retained |
| east:40 | THE DUST HORSES | Retained |
| east:72 | THE SINKING CAUSEWAY → THE LOST CONVOY | Retained |
| east:75 | THE REPEATING SIGNAL → WILD BEAR | Retained |

### NORTH / WEST / EAST

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| early:55 | COLD ROAD CAMP | Retained |

### SEAPORT

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| early:171 | AGGRESSIVE SEAGULLS | Retained |
| early:169 | DOCKSIDE PIRATES | Retained |
| early:170 | SHIPWRECK SCAVENGERS | Retained |
| east:36 | THE CRANE NEST | Retained |

### SEAPORT / LOWLANDS

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| east:64 | SCRAP CRAB NEST | Retained |
| east:62 | CARGO HIJACKERS → THE CRAB TRAP | Retained |

### WEST

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| early:143 | CARRION VULTURES | Retained |
| early:144 | RABID BADGERS | Retained |
| early:145 | TERRITORIAL BUCK | Retained |
| early:174 | THE ABANDONED TRADING POST | Retained |
| early:176 | THE ANT COLONY | Retained |
| early:177 | THE BURIED BUNKER | Retained |
| early:178 | THE COUNTERFEIT RATIONS | Retained |
| early:175 | THE FALSE SCARECROW | Retained |
| early:179 | THE GRAVESIDE GAMBLER | Retained |
| early:173 | THE HUNTER'S TRAP | Retained |
| early:32 | THE LOCKED FREEZER | Retained |
| east:35 | THE OIL DERRICK | Retained |
| early:172 | THE STRANDED FAMILY | Retained |
| early:180 | THE TRAVELING TAXIDERMIST | Retained |

### WEST / CENTRAL

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| east:78 | THE STRANDED HANDCART → THE LAST STOP | Retained |
| early:41 | THE SILENT PICNIC | Retained |

### WEST / CENTRAL / EAST

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| early:31 | THE CAROUSEL HORSE | Retained |
| early:24 | THE HANGING SHOES | Retained |
| east:66 | SHUTTERED ROADSIDE CAFE → THE LAST SPECIAL — ROADHOUSE HASH | Retained |
| east:32 | THE RUST PARADE | Retained |
| east:16 | THE WELDED BUS | Retained |

### WEST / EAST

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| early:53 | STONES UNDER THE OAK | Retained |
| early:28 | THE HONEY JAR | Retained |
| east:43 | THE LAST ORCHARD | Retained |
| early:37 | THE MISSING STAIRS | Retained |

### WEST / INDUSTRIAL

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| east:20 | THE GRINDER CREW | Retained |

### WEST / LOWLANDS

| ID | Legacy → player-facing title | Audit status |
|---|---|---|
| east:4 | THE ASH PROCESSION | Retained |
| east:27 | THE SUNKEN CHAPEL | Retained |
| early:1 | WASHOUT SALVAGE | Retained |

