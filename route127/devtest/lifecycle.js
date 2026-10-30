// WO13 explicit canonical lifecycle policy; stable registry IDs are never reordered.
const ROAD_LIFECYCLE={
  "early:4": {
    "name": "ROADBLOCK",
    "lifecycle": "Repeatable",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "CIRCLE THE HILL"
      ],
      [
        "CLIMB AROUND"
      ],
      [
        "FIGHT"
      ],
      [
        "INTIMIDATE"
      ],
      [
        "SURRENDER ITEM"
      ],
      [
        "TAKE THE DITCH"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:6": {
    "name": "THE STRAY",
    "lifecycle": "Conditional",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ],
      [
        "OFFER RATION"
      ],
      [
        "SPARE HIM"
      ],
      [
        "WARN HIM OFF"
      ]
    ],
    "completion": "Terminal flags: r18StrayReunionDone. Existing rewards/quest consequences retained."
  },
  "early:7": {
    "name": "THE DARK CELLAR",
    "lifecycle": "Conditional",
    "regions": [
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ],
      [
        "OFFER SUPPLIES"
      ],
      [
        "REASSURE HIM"
      ],
      [
        "THREATEN HIM"
      ]
    ],
    "completion": "Terminal flags: r18CellarResolved. Existing rewards/quest consequences retained."
  },
  "early:13": {
    "name": "HIGHWAY ROBBERS",
    "lifecycle": "Repeatable",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:15": {
    "name": "ROACH NEST",
    "lifecycle": "Repeatable",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT SWARM"
      ],
      [
        "LURE THEM AWAY"
      ],
      [
        "SEARCH VAN"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:16": {
    "name": "TUNNEL RATS",
    "lifecycle": "Repeatable",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "CLIMB WRECK"
      ],
      [
        "FIGHT PACK"
      ],
      [
        "THROW FOOD"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:17": {
    "name": "FERAL DOG",
    "lifecycle": "Repeatable",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT DOGS"
      ],
      [
        "THROW FOOD"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:18": {
    "name": "LONE SCAVENGER",
    "lifecycle": "Repeatable",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ],
      [
        "TRADE WITH STRANGER"
      ],
      [
        "WATCH HIS HANDS"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:19": {
    "name": "GANG LOOKOUT",
    "lifecycle": "Repeatable",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "INTIMIDATE"
      ],
      [
        "RUSH HIM"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:20": {
    "name": "THE CRAWLER",
    "lifecycle": "Repeatable",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "ARGUE ABOUT THE ROAD"
      ],
      [
        "FIGHT"
      ],
      [
        "TALK TO HIM"
      ],
      [
        "TRADE FOR WIRE"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:21": {
    "name": "SECURITY DRONE",
    "lifecycle": "Conditional",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "ATTEMPT SHUTDOWN"
      ],
      [
        "FIGHT DRONE"
      ],
      [
        "INSPECT BOOTH"
      ],
      [
        "SNEAK PAST"
      ]
    ],
    "completion": "Terminal flags: r18DroneDisabled. Existing rewards/quest consequences retained."
  },
  "early:22": {
    "name": "THE WRECKERS",
    "lifecycle": "Repeatable",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "BARGAIN FOR MEDICINE"
      ],
      [
        "FIGHT WRECKERS"
      ],
      [
        "STEAL SUPPLIES"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:29": {
    "name": "SALT ON THE ROAD",
    "lifecycle": "Repeatable",
    "regions": [
      "NORTH"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "INSPECT CIRCLE"
      ],
      [
        "SCATTER SALT"
      ],
      [
        "SIT IN THE CHAIR"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:39": {
    "name": "THE PAINTED ARROWS",
    "lifecycle": "Repeatable",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FOLLOW BLUE ARROW"
      ],
      [
        "FOLLOW RED ARROW"
      ],
      [
        "FOLLOW YELLOW ARROW"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:46": {
    "name": "IRRADIATED ROACHES",
    "lifecycle": "Repeatable",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FEED THE CHICKENS"
      ],
      [
        "FIGHT CHICKENS"
      ],
      [
        "HARVEST VEGETABLES"
      ],
      [
        "PICK FRUIT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:47": {
    "name": "RATS IN THE PANTRY",
    "lifecycle": "Repeatable",
    "regions": [
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT RATS"
      ],
      [
        "LURE WITH RATION"
      ],
      [
        "SEARCH FOOD CACHE"
      ],
      [
        "TIP THE CART"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:48": {
    "name": "THE SCRAP CLAIM",
    "lifecycle": "Repeatable",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "DISABLE TRAPS"
      ],
      [
        "FIGHT CLAIMANT"
      ],
      [
        "INTIMIDATE"
      ],
      [
        "NEGOTIATE FOUR BOLTS"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:51": {
    "name": "BROKEN CLEANER BOT",
    "lifecycle": "Repeatable",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT CLEANER"
      ],
      [
        "JAM BRUSH WITH STICK"
      ],
      [
        "REPAIR CLEANER"
      ],
      [
        "SALVAGE THE CONTROL CIRCUIT"
      ],
      [
        "WAIT FOR BATTERY"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:44": {
    "name": "THE MILK CRATES",
    "lifecycle": "Repeatable",
    "regions": [
      "CENTRAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "DECEIVE THE HUNTERS"
      ],
      [
        "FIGHT THE HUNTERS"
      ],
      [
        "REFUSE TO ANSWER"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:45": {
    "name": "THE DRY FOUNTAIN",
    "lifecycle": "Repeatable",
    "regions": [
      "CENTRAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT THE ENFORCER"
      ],
      [
        "INTIMIDATE THE ENFORCER"
      ],
      [
        "SNEAK PAST THE ENFORCER"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:11": {
    "name": "THE BIG MAN",
    "lifecycle": "Repeatable",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT HIM"
      ],
      [
        "PAY 6 BOLTS"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:23": {
    "name": "THE CINDER WOLVES",
    "lifecycle": "Repeatable",
    "regions": [
      "NORTH",
      "WEST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "DISTRACT WITH FOOD"
      ],
      [
        "FIGHT THE PACK"
      ],
      [
        "SCARE WITH FIRE OR NOISE"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:36": {
    "name": "THE CRANE NEST",
    "lifecycle": "Repeatable",
    "regions": [
      "SEAPORT"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT THE BIRDS"
      ],
      [
        "SEARCH THE NEST"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:41": {
    "name": "THE SHATTERED SILO",
    "lifecycle": "Repeatable",
    "regions": [
      "CENTRAL",
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "CLIMB THE OUTSIDE LADDER"
      ],
      [
        "DISTRACT THE BOARS WITH FOOD"
      ],
      [
        "FIGHT THE BOARS"
      ],
      [
        "SEARCH SILO SALVAGE"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:33": {
    "name": "THE KNIFE WIND",
    "lifecycle": "Repeatable",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "CHALLENGE LEADER TO DUEL"
      ],
      [
        "FIGHT BOTH REAPERS"
      ],
      [
        "SNEAK PAST"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:12": {
    "name": "THE QUARRY LIFT",
    "lifecycle": "Repeatable",
    "regions": [
      "NORTH"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "DROP THE SUSPENDED BEAM"
      ],
      [
        "FIGHT THE CHAIN GANG"
      ],
      [
        "INTIMIDATE THE GANG"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:0": {
    "name": "THE IRON HARVEST",
    "lifecycle": "Repeatable",
    "regions": [
      "CENTRAL",
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "DISTRACT AND SNEAK"
      ],
      [
        "FIGHT THE COMBINE"
      ],
      [
        "SHUT DOWN GUIDANCE SYSTEM"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:6": {
    "name": "THE IRON CHOIR",
    "lifecycle": "Repeatable",
    "regions": [
      "CENTRAL",
      "INDUSTRIAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT THE RAIDERS"
      ],
      [
        "RING THE VALVES"
      ],
      [
        "SILENCE VALVES WITH ROPE"
      ],
      [
        "SNEAK PAST THE VALVES"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:10": {
    "name": "THE BONE HUNTERS",
    "lifecycle": "Repeatable",
    "regions": [
      "CENTRAL",
      "NORTH",
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT THE HUNTERS"
      ],
      [
        "INSPECT FLAGS AND ENGAGE"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:34": {
    "name": "THE WARDEN",
    "lifecycle": "Repeatable",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "DECEIVE THE WARDEN"
      ],
      [
        "FIGHT THE WARDEN"
      ],
      [
        "SNEAK PAST THE WARDEN"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:22": {
    "name": "THE SALT MINERS",
    "lifecycle": "One-time",
    "regions": [
      "NORTH"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT THE SALTMASTER"
      ],
      [
        "PERSUADE THE GUARDS"
      ],
      [
        "SNEAK THE WORKERS FREE"
      ]
    ],
    "completion": "Terminal flags: r18SaltWorkersFreed. Existing rewards/quest consequences retained."
  },
  "east:14": {
    "name": "THE ROAD EATER",
    "lifecycle": "Repeatable",
    "regions": [
      "INDUSTRIAL",
      "NORTH"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT THE MACHINE"
      ],
      [
        "LURE IT INTO THE TUNNEL"
      ],
      [
        "SHUT DOWN THE CONTROLS"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:30": {
    "name": "THE GATELESS WALL",
    "lifecycle": "Repeatable",
    "regions": [
      "CENTRAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT THE GUARDS"
      ],
      [
        "FIND A BREACH"
      ],
      [
        "SNEAK AND SABOTAGE THE GUN"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:26": {
    "name": "THE BONE COLLECTOR",
    "lifecycle": "Conditional",
    "regions": [
      "NORTH",
      "CENTRAL",
      "EAST"
    ],
    "workOrderId": null,
    "service": true,
    "groups": [
      [
        "FIGHT THE COLLECTOR"
      ],
      [
        "SELL ANIMAL BONES FOR 4 BOLTS"
      ],
      [
        "SELL SMALL BONES FOR 2 BOLTS"
      ]
    ],
    "completion": "Retain existing ongoing service, daily availability, trading or arena activity; finite rewards keep their existing guards."
  },
  "east:38": {
    "name": "THE MUD CANNON",
    "lifecycle": "Repeatable",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT THE BOMBER"
      ],
      [
        "SNEAK PAST THE BOMBER"
      ],
      [
        "TALK DOWN THE BOMBER"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:57": {
    "name": "UNAUTHORIZED CARGO",
    "lifecycle": "One-time",
    "regions": [
      "INDUSTRIAL",
      "SEAPORT"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ],
      [
        "USE THE CARGO BARRIER"
      ]
    ],
    "completion": "Terminal flags: wo2.forklift. Existing rewards/quest consequences retained."
  },
  "east:58": {
    "name": "THE LAST PATROL",
    "lifecycle": "One-time",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "Terminal flags: wo2.patrol. Existing rewards/quest consequences retained."
  },
  "east:59": {
    "name": "MARSH DOG PACK",
    "lifecycle": "One-time",
    "regions": [
      "LOWLANDS"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "DISTRACT WITH FOOD"
      ],
      [
        "FIGHT"
      ],
      [
        "INTIMIDATE THE PACK"
      ]
    ],
    "completion": "Terminal flags: wo2.wo3Dogs. Existing rewards/quest consequences retained."
  },
  "east:60": {
    "name": "FLOODLIGHT SWEEP",
    "lifecycle": "One-time",
    "regions": [
      "INDUSTRIAL",
      "SEAPORT"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ],
      [
        "USE SHIPPING CONTAINERS FOR COVER"
      ]
    ],
    "completion": "Terminal flags: wo2.wo3Drone. Existing rewards/quest consequences retained."
  },
  "east:61": {
    "name": "CULVERT CRAWLER",
    "lifecycle": "One-time",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "EXPOSE THE UNDERSIDE"
      ],
      [
        "FIGHT"
      ]
    ],
    "completion": "Terminal flags: wo2.wo3Stalker. Existing rewards/quest consequences retained."
  },
  "east:62": {
    "name": "THE CRAB TRAP",
    "lifecycle": "One-time",
    "regions": [
      "SEAPORT",
      "LOWLANDS"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "Terminal flags: wo2.crabTrap. Existing rewards/quest consequences retained."
  },
  "east:63": {
    "name": "TACTICAL SNIPER",
    "lifecycle": "One-time",
    "regions": [
      "INDUSTRIAL",
      "SEAPORT"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ],
      [
        "FIND COVER"
      ],
      [
        "FLANK THE SNIPER"
      ]
    ],
    "completion": "Terminal flags: wo2.wo4Sniper. Existing rewards/quest consequences retained."
  },
  "east:64": {
    "name": "SCRAP CRAB NEST",
    "lifecycle": "One-time",
    "regions": [
      "SEAPORT",
      "LOWLANDS"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "Terminal flags: wo2.crabNest. Existing rewards/quest consequences retained."
  },
  "early:0": {
    "name": "COUNTY WORK TRUCK",
    "lifecycle": "Conditional",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "CHECK GLOVEBOX"
      ],
      [
        "SEARCH TRUCK BED"
      ]
    ],
    "completion": "Truck glovebox and bed claimed; county worker helped; county map studied; depot rescue completed. Depot return remains tied to its saved location."
  },
  "early:2": {
    "name": "THE GAS STATION",
    "lifecycle": "One-time",
    "regions": [
      "CENTRAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "SEARCH DRAWER"
      ],
      [
        "SMASH VENDING MACHINE",
        "PRY VENDING MACHINE"
      ],
      [
        "CHECK SERVICE BAY"
      ]
    ],
    "completion": "Retire when every finite reward group is claimed: SEARCH DRAWER; SMASH VENDING MACHINE OR PRY VENDING MACHINE; CHECK SERVICE BAY. Partial returns retain remaining choices."
  },
  "early:3": {
    "name": "ABANDONED SEDAN",
    "lifecycle": "One-time",
    "regions": [
      "NORTH",
      "CENTRAL",
      "SEAPORT"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "SEARCH CABIN"
      ],
      [
        "FORCE TRUNK"
      ],
      [
        "CHECK UNDER CAR"
      ]
    ],
    "completion": "Retire when every finite reward group is claimed: SEARCH CABIN; FORCE TRUNK; CHECK UNDER CAR. Partial returns retain remaining choices."
  },
  "early:12": {
    "name": "BROKEN MOTEL",
    "lifecycle": "Conditional",
    "regions": [
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT HARLAN"
      ],
      [
        "FORCE OFFICE 204"
      ]
    ],
    "completion": "Terminal flags: r18CalebRescued. Existing rewards/quest consequences retained."
  },
  "early:14": {
    "name": "DRAINAGE CULVERT",
    "lifecycle": "Repeatable",
    "regions": [
      "INDUSTRIAL",
      "LOWLANDS"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "ENTER CULVERT"
      ],
      [
        "REACH FROM EDGE"
      ],
      [
        "SEARCH BANK"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:54": {
    "name": "THE TIPPED DELIVERY TRUCK",
    "lifecycle": "One-time",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "INVESTIGATE SHIPMENT"
      ],
      [
        "KEEP SOME FOOD"
      ],
      [
        "RESCUE DRIVER"
      ],
      [
        "STEAL LOCKBOX"
      ]
    ],
    "completion": "Terminal flags: r18DeliveryResolved. Existing rewards/quest consequences retained."
  },
  "early:62": {
    "name": "SCRATCHING IN THE SHED",
    "lifecycle": "Conditional",
    "regions": [
      "CENTRAL",
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FREE THE RABBIT"
      ],
      [
        "HARVEST RABBIT"
      ],
      [
        "PEER THROUGH GAP"
      ],
      [
        "SEARCH THE GARDEN"
      ],
      [
        "SEARCH THE SHED"
      ]
    ],
    "completion": "Rabbit adopted or harvested; garden and shed supplies collected. Freeing alone does not consume adoption opportunity."
  },
  "early:63": {
    "name": "THE SAGGING FARMHOUSE",
    "lifecycle": "Conditional",
    "regions": [
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FORCE THE DOOR"
      ],
      [
        "INVESTIGATE UPSTAIRS"
      ],
      [
        "PEEK THROUGH KEYHOLE"
      ],
      [
        "RISK THE PANTRY"
      ],
      [
        "SEARCH THE PORCH"
      ]
    ],
    "completion": "Retire when every finite reward group is claimed: FORCE THE DOOR; INVESTIGATE UPSTAIRS; PEEK THROUGH KEYHOLE; RISK THE PANTRY; SEARCH THE PORCH. Partial returns retain remaining choices."
  },
  "early:37": {
    "name": "THE MISSING STAIRS",
    "lifecycle": "Conditional",
    "regions": [
      "WEST",
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "KNOCK ON THE DOOR"
      ],
      [
        "SEARCH THE FOUNDATION"
      ],
      [
        "SEARCH THE LANDING"
      ]
    ],
    "completion": "Retire when every finite reward group is claimed: KNOCK ON THE DOOR; SEARCH THE FOUNDATION; SEARCH THE LANDING. Partial returns retain remaining choices."
  },
  "early:40": {
    "name": "THE WHEELBARROW",
    "lifecycle": "Repeatable",
    "regions": [
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "MOVE STONES CAREFULLY"
      ],
      [
        "TIP THE WHEELBARROW"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:10": {
    "name": "RIDGELINE",
    "lifecycle": "Repeatable",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "LOOK AROUND"
      ],
      [
        "SEARCH THE TRUCK"
      ],
      [
        "WATCH THE HORIZON"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:42": {
    "name": "THE COIN WELL",
    "lifecycle": "Conditional",
    "regions": [
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "INSPECT THE WELL ROPE"
      ],
      [
        "REINFORCE AND DESCEND",
        "DESCEND CAREFULLY"
      ]
    ],
    "completion": "Retire when every finite reward group is claimed: INSPECT THE WELL ROPE; REINFORCE AND DESCEND OR DESCEND CAREFULLY. Partial returns retain remaining choices."
  },
  "early:32": {
    "name": "THE LOCKED FREEZER",
    "lifecycle": "Conditional",
    "regions": [
      "WEST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "OPEN FREEZER"
      ]
    ],
    "completion": "Stable freezer variant; rescue reward or ambush combat victory resolves the encounter."
  },
  "early:34": {
    "name": "THE RAIN BARREL",
    "lifecycle": "Repeatable",
    "regions": [
      "EAST",
      "LOWLANDS"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "HARVEST GREENHOUSE PLANTS"
      ],
      [
        "REPAIR IRRIGATION"
      ],
      [
        "SIFT THE MARBLES"
      ],
      [
        "TAKE THE GROWERS FOOD"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:64": {
    "name": "THE WALKING PEDDLER",
    "lifecycle": "Repeatable",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "BUY APPLE FOR 4 BOLTS"
      ],
      [
        "BUY BANDAGE FOR 8 BOLTS"
      ],
      [
        "BUY CARROT FOR 4 BOLTS"
      ],
      [
        "BUY COMPASS FOR 45 BOLTS"
      ],
      [
        "BUY RATION FOR 6 BOLTS"
      ],
      [
        "BUY SCRAP FOR 5 BOLTS"
      ],
      [
        "BUY WIRE FOR 5 BOLTS"
      ],
      [
        "REPAIR BICYCLE"
      ],
      [
        "SELL ONE SCRAP FOR 3 BOLTS"
      ],
      [
        "SELL ONE WIRE FOR 2 BOLTS"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:36": {
    "name": "THE GARDEN GNOMES",
    "lifecycle": "Conditional",
    "regions": [
      "EAST",
      "WEST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "INSPECT THE GNOMES"
      ],
      [
        "PROVOKE THE COLLECTOR"
      ]
    ],
    "completion": "Terminal flags: r18GnomeDefeated. Existing rewards/quest consequences retained."
  },
  "early:43": {
    "name": "THE FENCE ARTIST",
    "lifecycle": "Conditional",
    "regions": [
      "CENTRAL",
      "SEAPORT"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "DISMANTLE THE SCULPTURE"
      ],
      [
        "HELP WITH SCRAP METAL"
      ],
      [
        "TALK TO ENID"
      ]
    ],
    "completion": "Terminal flags: r18EnidSculptureLost OR r18EnidLanternPromised. Existing rewards/quest consequences retained."
  },
  "early:35": {
    "name": "THE BURNT LIBRARY",
    "lifecycle": "One-time",
    "regions": [
      "CENTRAL",
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "SEARCH CHILDRENS BOOKS"
      ],
      [
        "SEARCH MECHANICAL BOOKS"
      ],
      [
        "SEARCH MEDICAL BOOKS"
      ]
    ],
    "completion": "Terminal flags: r18LibraryResolved. Existing rewards/quest consequences retained."
  },
  "early:41": {
    "name": "THE SILENT PICNIC",
    "lifecycle": "One-time",
    "regions": [
      "WEST",
      "CENTRAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "SEARCH HOLLOW PIECE"
      ]
    ],
    "completion": "Terminal flags: r18PicnicClaimed. Existing rewards/quest consequences retained."
  },
  "early:30": {
    "name": "THE PAPER STORM",
    "lifecycle": "Conditional",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "EXAMINE THE WANTED POSTER"
      ],
      [
        "SEARCH THE PAPERS"
      ]
    ],
    "completion": "Retire when every finite reward group is claimed: EXAMINE THE WANTED POSTER; SEARCH THE PAPERS. Partial returns retain remaining choices."
  },
  "early:27": {
    "name": "CEMETERY OF TIRES",
    "lifecycle": "One-time",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [],
    "completion": "Maze crate collected; can reappear for active Corvette tires until the existing four-tire cap."
  },
  "early:50": {
    "name": "THE LIMPING HOUND",
    "lifecycle": "Conditional",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "OFFER FOOD"
      ]
    ],
    "completion": "Terminal flags: r18HoundAdopted. Existing rewards/quest consequences retained."
  },
  "early:66": {
    "name": "MILES THE COURIER",
    "lifecycle": "Conditional",
    "regions": [],
    "workOrderId": null,
    "service": true,
    "groups": [
      [
        "ACCEPT DELIVERY JOB"
      ]
    ],
    "completion": "Retain existing ongoing service, daily availability, trading or arena activity; finite rewards keep their existing guards."
  },
  "east:43": {
    "name": "THE LAST ORCHARD",
    "lifecycle": "Repeatable",
    "regions": [
      "WEST",
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "CONFRONT SCAVENGERS"
      ],
      [
        "HARVEST ALL APPLES"
      ],
      [
        "OFFER FOOD TO SCAVENGERS"
      ],
      [
        "PERSUADE SCAVENGERS"
      ],
      [
        "REINFORCE THE FENCE"
      ],
      [
        "TAKE ONE APPLE"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:17": {
    "name": "THE WAX MUSEUM",
    "lifecycle": "Conditional",
    "regions": [
      "CENTRAL",
      "WEST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT THE CURATOR"
      ],
      [
        "STEAL THE SOLDIER ARMOR"
      ]
    ],
    "completion": "Terminal flags: r18WaxArmorClaimed. Existing rewards/quest consequences retained."
  },
  "east:25": {
    "name": "THE EMPTY ARMORY",
    "lifecycle": "One-time",
    "regions": [
      "CENTRAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FORCE THE CACHE"
      ],
      [
        "TRY CODE 127"
      ]
    ],
    "completion": "Terminal flags: r18ArmoryClaimed. Existing rewards/quest consequences retained."
  },
  "east:13": {
    "name": "THE BLACK SNOW",
    "lifecycle": "Conditional",
    "regions": [
      "INDUSTRIAL",
      "NORTH"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "BUY TWO COINS FOR 35 BOLTS"
      ],
      [
        "FIGHT THE SCAVENGER"
      ],
      [
        "HEAL THE SCAVENGER"
      ],
      [
        "SEARCH THE BURNING TRUCK"
      ],
      [
        "THREATEN THE SCAVENGER"
      ]
    ],
    "completion": "Terminal flags: r18BlackSnowResolved AND r18BlackSnowTruck. Existing rewards/quest consequences retained."
  },
  "east:27": {
    "name": "THE SUNKEN CHAPEL",
    "lifecycle": "Conditional",
    "regions": [
      "WEST",
      "LOWLANDS"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "REPAIR THE PUMP"
      ]
    ],
    "completion": "Terminal flags: r18ChapelBoxClaimed. Existing rewards/quest consequences retained."
  },
  "east:18": {
    "name": "THE STEEL ORCHARD",
    "lifecycle": "Conditional",
    "regions": [],
    "workOrderId": null,
    "service": true,
    "groups": [
      [
        "TALK TO MARTHA"
      ]
    ],
    "completion": "Terminal flags: r18MarthaSettled. Existing rewards/quest consequences retained."
  },
  "east:39": {
    "name": "THE HANGING CAGE",
    "lifecycle": "Conditional",
    "regions": [
      "NORTH",
      "EAST",
      "INDUSTRIAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT SILAS"
      ],
      [
        "INTERROGATE SILAS"
      ],
      [
        "OPEN THE GEAR CHEST"
      ],
      [
        "RELEASE SILAS"
      ]
    ],
    "completion": "Terminal flags: r18SilasOutcome AND r18SilasChestClaimed. Existing rewards/quest consequences retained."
  },
  "east:35": {
    "name": "THE OIL DERRICK",
    "lifecycle": "Conditional",
    "regions": [
      "WEST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "ACCEPT 125 BOLT BRIBE"
      ],
      [
        "FIGHT DEKE"
      ],
      [
        "RESCUE OWEN"
      ]
    ],
    "completion": "Terminal flags: r18OilOutcome. Existing rewards/quest consequences retained."
  },
  "east:8": {
    "name": "THE MASK MARKET",
    "lifecycle": "Repeatable",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:11": {
    "name": "THE SCRAP DUEL",
    "lifecycle": "Repeatable",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "CHALLENGE CHAMPION"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:21": {
    "name": "THE HOLLOW STATUE",
    "lifecycle": "Conditional",
    "regions": [
      "CENTRAL",
      "INDUSTRIAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "SEARCH THE STATUE"
      ],
      [
        "TALK TO CLARA"
      ]
    ],
    "completion": "Daniel rescued/quest done AND statue searched; Clara remains while her quest is unresolved."
  },
  "east:4": {
    "name": "THE ASH PROCESSION",
    "lifecycle": "Conditional",
    "regions": [
      "WEST",
      "LOWLANDS"
    ],
    "workOrderId": null,
    "service": true,
    "groups": [
      [
        "FOLLOW THE PROCESSION"
      ],
      [
        "HELP CARRY THE COFFIN"
      ]
    ],
    "completion": "Cemetery discovered, procession followed and coffin helped; direct cemetery access remains available."
  },
  "east:29": {
    "name": "THE FIGHTING RING",
    "lifecycle": "Conditional",
    "regions": [
      "NORTH",
      "CENTRAL",
      "INDUSTRIAL",
      "LOWLANDS",
      "EAST",
      "SEAPORT"
    ],
    "workOrderId": null,
    "service": true,
    "groups": [],
    "completion": "Retain existing ongoing service, daily availability, trading or arena activity; finite rewards keep their existing guards."
  },
  "east:42": {
    "name": "THE FORGOTTEN ARENA",
    "lifecycle": "Conditional",
    "regions": [
      "NORTH",
      "CENTRAL",
      "INDUSTRIAL",
      "LOWLANDS",
      "EAST",
      "SEAPORT"
    ],
    "workOrderId": null,
    "service": true,
    "groups": [],
    "completion": "Retain existing ongoing service, daily availability, trading or arena activity; finite rewards keep their existing guards."
  },
  "east:65": {
    "name": "FRESH MEAT",
    "lifecycle": "One-time",
    "regions": [
      "NORTH",
      "CENTRAL",
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "CONFRONT THE BUTCHER"
      ]
    ],
    "completion": "Terminal flags: wo2.fresh. Existing rewards/quest consequences retained."
  },
  "east:66": {
    "name": "THE LAST SPECIAL \u2014 ROADHOUSE HASH",
    "lifecycle": "One-time",
    "regions": [
      "WEST",
      "CENTRAL",
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "PRY OPEN THE PANTRY"
      ]
    ],
    "completion": "Terminal flags: wo2.hash. Existing rewards/quest consequences retained."
  },
  "east:67": {
    "name": "CLEANUP ON AISLE NINE",
    "lifecycle": "Fixed",
    "regions": [],
    "workOrderId": null,
    "service": true,
    "groups": [
      [
        "FIGHT HAROLD"
      ]
    ],
    "completion": "Permanent location registration; existing site and reward guards apply, never injected into random roadside pool."
  },
  "east:68": {
    "name": "SHATTERED GLASS",
    "lifecycle": "One-time",
    "regions": [
      "CENTRAL",
      "INDUSTRIAL",
      "SEAPORT"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "OPEN THE CABINET"
      ]
    ],
    "completion": "Terminal flags: wo2.windshield. Existing rewards/quest consequences retained."
  },
  "early:1": {
    "name": "WASHOUT SALVAGE",
    "lifecycle": "Repeatable",
    "regions": [
      "WEST",
      "LOWLANDS"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "HELP SCAVENGER"
      ],
      [
        "OPEN TOOLBOX"
      ],
      [
        "STEAL GENERATOR PART"
      ],
      [
        "STRIP CABLE"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:5": {
    "name": "MAINTENANCE BOX",
    "lifecycle": "Repeatable",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "OPEN BOX"
      ],
      [
        "SEARCH DAMAGED CONTROL"
      ],
      [
        "SEARCH SHOULDER"
      ],
      [
        "STRIP CABLE"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:52": {
    "name": "THE DITCH BACKPACK",
    "lifecycle": "One-time",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "SEARCH POCKETS"
      ],
      [
        "FOLLOW THE TRAIL"
      ],
      [
        "SALVAGE STRAPS"
      ]
    ],
    "completion": "Retire when every finite reward group is claimed: SEARCH POCKETS; FOLLOW THE TRAIL; SALVAGE STRAPS. Partial returns retain remaining choices."
  },
  "early:53": {
    "name": "STONES UNDER THE OAK",
    "lifecycle": "One-time",
    "regions": [
      "WEST",
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "RESPECT THE MEMORIAL",
        "LEAVE ONE BOLT",
        "TAKE OFFERINGS"
      ]
    ],
    "completion": "Retire when every finite reward group is claimed: RESPECT THE MEMORIAL OR LEAVE ONE BOLT OR TAKE OFFERINGS. Partial returns retain remaining choices."
  },
  "early:56": {
    "name": "THE LOCKED TOOL CHEST",
    "lifecycle": "One-time",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "PICK THE LOCK",
        "WORK THE HINGE",
        "SMASH THE LOCK"
      ]
    ],
    "completion": "Terminal flags: r18MechanicChestOpened. Existing rewards/quest consequences retained."
  },
  "early:60": {
    "name": "STATION NINE DISCOVERY STORYLINE",
    "lifecycle": "Conditional",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "INSPECT THE RADIO"
      ],
      [
        "LISTEN TO BROADCAST"
      ],
      [
        "REMOVE THE CASING"
      ],
      [
        "SALVAGE THE CIRCUIT"
      ]
    ],
    "completion": "Radio casing and circuit recovered and actual Station Nine path coordinate recorded; permanent station access remains."
  },
  "early:28": {
    "name": "THE HONEY JAR",
    "lifecycle": "Conditional",
    "regions": [
      "WEST",
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "HARVEST HONEY"
      ],
      [
        "INSPECT BEEKEEPER GEAR"
      ]
    ],
    "completion": "Retire when every finite reward group is claimed: HARVEST HONEY; INSPECT BEEKEEPER GEAR. Partial returns retain remaining choices."
  },
  "early:25": {
    "name": "THE LAST MAIL",
    "lifecycle": "Conditional",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "SEARCH FOR A LETTER"
      ],
      [
        "SORT PARCELS"
      ]
    ],
    "completion": "Retire when every finite reward group is claimed: SEARCH FOR A LETTER; SORT PARCELS. Partial returns retain remaining choices."
  },
  "east:2": {
    "name": "THE BURIED FREIGHT",
    "lifecycle": "One-time",
    "regions": [
      "INDUSTRIAL",
      "SEAPORT"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "OPEN NORMAL CONTAINER"
      ],
      [
        "OPEN SEALED CONTAINER"
      ],
      [
        "OPEN BURIED CONTAINER"
      ]
    ],
    "completion": "Retire when every finite reward group is claimed: OPEN NORMAL CONTAINER; OPEN SEALED CONTAINER; OPEN BURIED CONTAINER. Partial returns retain remaining choices."
  },
  "east:31": {
    "name": "THE TAR POOL",
    "lifecycle": "Conditional",
    "regions": [
      "LOWLANDS"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "USE ROPE OR POLE",
        "WADE TO SEALED CASE"
      ],
      [
        "SEARCH THE SHORELINE"
      ]
    ],
    "completion": "Retire when every finite reward group is claimed: USE ROPE OR POLE OR WADE TO SEALED CASE; SEARCH THE SHORELINE. Partial returns retain remaining choices."
  },
  "east:20": {
    "name": "THE GRINDER CREW",
    "lifecycle": "Repeatable",
    "regions": [
      "WEST",
      "INDUSTRIAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "BUY SCRAP FOR 6 BOLTS"
      ],
      [
        "HELP THE CREW"
      ],
      [
        "SABOTAGE THE CRUSHER"
      ],
      [
        "SELL SCRAP FOR 3 BOLTS"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:53": {
    "name": "FREIGHT WAGON CACHE",
    "lifecycle": "Inactive",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [],
    "completion": "Historical slot preserved; remains excluded from new random roadside selection."
  },
  "east:69": {
    "name": "MILEPOST CACHE",
    "lifecycle": "One-time",
    "regions": [
      "NORTH",
      "CENTRAL",
      "SEAPORT"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "CHECK THE DRAINAGE SLOT"
      ],
      [
        "LIFT THE CACHE LID"
      ]
    ],
    "completion": "Terminal flags: wo2.milepost. Existing rewards/quest consequences retained."
  },
  "east:70": {
    "name": "OVERTURNED MAINTENANCE CART",
    "lifecycle": "Conditional",
    "regions": [
      "NORTH",
      "CENTRAL",
      "INDUSTRIAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "SEARCH THE TOOL TRAY"
      ],
      [
        "STRIP THE BATTERY LEADS"
      ]
    ],
    "completion": "Battery recovered/delivered OR ordinary tray and leads exhausted while no battery quest is active; reopens when the Corvette needs the battery."
  },
  "east:71": {
    "name": "THE SPRING TRAP",
    "lifecycle": "One-time",
    "regions": [
      "INDUSTRIAL",
      "LOWLANDS"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "DISARM THE MECHANISM"
      ],
      [
        "FORCE THE LID"
      ]
    ],
    "completion": "Terminal flags: wo2.wo3TrapLoot. Existing rewards/quest consequences retained."
  },
  "early:8": {
    "name": "OLD BILLBOARD",
    "lifecycle": "One-time",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "SEARCH BASE"
      ],
      [
        "STUDY BACK"
      ],
      [
        "STUDY FRONT"
      ]
    ],
    "completion": "All six distinct front messages read, back symbol learned and base searched; each discovery pays once."
  },
  "early:9": {
    "name": "THE TRAVELER",
    "lifecycle": "Conditional",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "GIVE RATION"
      ],
      [
        "QUESTION HER"
      ],
      [
        "TAKE PACK"
      ],
      [
        "USE BANDAGE"
      ]
    ],
    "completion": "Vale treated and moved to Solace, or existing story availability gate; unresolved assistance remains possible."
  },
  "early:55": {
    "name": "COLD ROAD CAMP",
    "lifecycle": "Repeatable",
    "regions": [
      "NORTH",
      "WEST",
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "READ THE CARVED NAMES"
      ],
      [
        "SEARCH THE CAMPSITE"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:58": {
    "name": "THE EMPTY BUS SHELTER",
    "lifecycle": "One-time",
    "regions": [
      "CENTRAL",
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "OFFER A RATION"
      ],
      [
        "OPEN THE TIN"
      ],
      [
        "SAY THE BUSES ARE GONE"
      ],
      [
        "SEARCH TICKET BOX"
      ],
      [
        "SIT AND TALK"
      ],
      [
        "TAKE THE DRAWING"
      ]
    ],
    "completion": "Retire when every finite reward group is claimed: OFFER A RATION; OPEN THE TIN; SAY THE BUSES ARE GONE; SEARCH TICKET BOX; SIT AND TALK; TAKE THE DRAWING. Partial returns retain remaining choices."
  },
  "early:61": {
    "name": "THE SPRAINED RUNNER",
    "lifecycle": "Conditional",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIX CART"
      ],
      [
        "GIVE BANDAGE"
      ],
      [
        "MAKE WALKING STICK"
      ],
      [
        "STEAL FOOD"
      ]
    ],
    "completion": "Terminal flags: r18RunnerReunionDone. Existing rewards/quest consequences retained."
  },
  "early:65": {
    "name": "DUST OVER THE SCHOOLYARD",
    "lifecycle": "Repeatable",
    "regions": [
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "APPROACH THE BUCK"
      ],
      [
        "FREE THE FAWN"
      ],
      [
        "HUNT AN ADULT DEER"
      ],
      [
        "SEARCH THE SCHOOLYARD"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:24": {
    "name": "THE HANGING SHOES",
    "lifecycle": "One-time",
    "regions": [
      "WEST",
      "CENTRAL",
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "READ THE NOTES"
      ],
      [
        "INSPECT THE BOOTS"
      ],
      [
        "SEARCH THE ROADSIDE"
      ]
    ],
    "completion": "Retire when every finite reward group is claimed: READ THE NOTES; INSPECT THE BOOTS; SEARCH THE ROADSIDE. Partial returns retain remaining choices."
  },
  "early:31": {
    "name": "THE CAROUSEL HORSE",
    "lifecycle": "One-time",
    "regions": [
      "WEST",
      "CENTRAL",
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "RIDE THE HORSE"
      ],
      [
        "INSPECT MUSIC BOX"
      ],
      [
        "SEARCH HOLLOW BODY"
      ]
    ],
    "completion": "Retire when every finite reward group is claimed: RIDE THE HORSE; INSPECT MUSIC BOX; SEARCH HOLLOW BODY. Partial returns retain remaining choices."
  },
  "early:33": {
    "name": "THE BRIDGE TOLL",
    "lifecycle": "Conditional",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "ASK ABOUT BRIDGE"
      ],
      [
        "TELL A FOOD JOKE"
      ],
      [
        "TELL A ROAD JOKE"
      ]
    ],
    "completion": "Retire when every finite reward group is claimed: ASK ABOUT BRIDGE; TELL A FOOD JOKE; TELL A ROAD JOKE. Partial returns retain remaining choices."
  },
  "early:26": {
    "name": "THE FALSE SHOULDER",
    "lifecycle": "Repeatable",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "CROSS THE SHOULDER"
      ],
      [
        "PROBE AND MARK THE GROUND"
      ],
      [
        "REINFORCE WARNING STONES"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:1": {
    "name": "THE GLASS FIELD",
    "lifecycle": "Repeatable",
    "regions": [
      "CENTRAL",
      "INDUSTRIAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "CROSS CAREFULLY"
      ],
      [
        "TAKE THE SAFE DETOUR"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:3": {
    "name": "THE RED RAIN",
    "lifecycle": "Repeatable",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "PUSH THROUGH FOR SALVAGE"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:28": {
    "name": "THE LIME FOG",
    "lifecycle": "Repeatable",
    "regions": [
      "LOWLANDS"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "COVER FACE WITH CLOTH"
      ],
      [
        "SEARCH THE PLANT STASH"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:24": {
    "name": "THE BLADE CART",
    "lifecycle": "Repeatable",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "DODGE BEHIND THE BARRIER"
      ],
      [
        "JAM THE WHEEL"
      ],
      [
        "SALVAGE AFTER IT PASSES"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:5": {
    "name": "THE COLLAPSED DAM",
    "lifecycle": "One-time",
    "regions": [
      "NORTH"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "CROSS THE CABLE",
        "JUMP THE FRACTURE",
        "FIND A SAFE PASSAGE"
      ],
      [
        "SEARCH MAINTENANCE STATION"
      ]
    ],
    "completion": "Retire when every finite reward group is claimed: CROSS THE CABLE OR JUMP THE FRACTURE OR FIND A SAFE PASSAGE; SEARCH MAINTENANCE STATION. Partial returns retain remaining choices."
  },
  "east:15": {
    "name": "THE CHAIN BRIDGE",
    "lifecycle": "Conditional",
    "regions": [
      "NORTH",
      "WEST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "REINFORCE WITH ROPE"
      ],
      [
        "CROSS THE BRIDGE"
      ],
      [
        "SEARCH THE GORGE SHACK"
      ]
    ],
    "completion": "Retire when every finite reward group is claimed: REINFORCE WITH ROPE; CROSS THE BRIDGE; SEARCH THE GORGE SHACK. Partial returns retain remaining choices."
  },
  "east:16": {
    "name": "THE WELDED BUS",
    "lifecycle": "One-time",
    "regions": [
      "WEST",
      "CENTRAL",
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "ASK ABOUT THE SIRENS"
      ],
      [
        "FIGHT MR PICKENS"
      ],
      [
        "PLAY ALONG WITH THE ROUTE"
      ]
    ],
    "completion": "Terminal flags: r18PickensResolved. Existing rewards/quest consequences retained."
  },
  "east:19": {
    "name": "THE QUICKSAND CUT",
    "lifecycle": "One-time",
    "regions": [
      "LOWLANDS"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "RESCUE WITH ROPE"
      ],
      [
        "TAKE THE SATCHEL"
      ],
      [
        "TRY IMPROVISED RESCUE"
      ]
    ],
    "completion": "Terminal flags: r18QuicksandOutcome AND r18QuicksandSatchel. Existing rewards/quest consequences retained."
  },
  "east:7": {
    "name": "THE FURNACE PIT",
    "lifecycle": "Conditional",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "HOOK GLOWING METAL"
      ],
      [
        "SEARCH MAINTENANCE LOCKER"
      ]
    ],
    "completion": "Retire when every finite reward group is claimed: HOOK GLOWING METAL; SEARCH MAINTENANCE LOCKER. Partial returns retain remaining choices."
  },
  "east:32": {
    "name": "THE RUST PARADE",
    "lifecycle": "Conditional",
    "regions": [
      "WEST",
      "CENTRAL",
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "JOIN THE PARADE"
      ],
      [
        "REPAIR THE FLOAT"
      ],
      [
        "SCAVENGE AROUND THE PARADE"
      ]
    ],
    "completion": "Retire when every finite reward group is claimed: JOIN THE PARADE; REPAIR THE FLOAT; SCAVENGE AROUND THE PARADE. Partial returns retain remaining choices."
  },
  "east:40": {
    "name": "THE DUST HORSES",
    "lifecycle": "Conditional",
    "regions": [
      "NORTH",
      "WEST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "CLEAR THE SNAGGED FENCE"
      ],
      [
        "CUT THE GUARDRAIL"
      ],
      [
        "REDIRECT THE HERD"
      ],
      [
        "SEARCH THE SADDLEBAG"
      ]
    ],
    "completion": "Herd helped, saddlebag collected and horse accepted or expressly declined. Failed calming permits return. Owned/used horse cannot be reacquired."
  },
  "east:54": {
    "name": "THE WASHED-OUT SHOULDER",
    "lifecycle": "Repeatable",
    "regions": [
      "EAST",
      "SEAPORT"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "TEST THE GROUND"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:55": {
    "name": "A CUP LEFT WARM",
    "lifecycle": "Inactive",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [],
    "completion": "Historical slot preserved; remains excluded from new random roadside selection."
  },
  "east:56": {
    "name": "A QUIET MILE",
    "lifecycle": "Inactive",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [],
    "completion": "Historical slot preserved; remains excluded from new random roadside selection."
  },
  "east:72": {
    "name": "THE LOST CONVOY",
    "lifecycle": "One-time",
    "regions": [
      "NORTH",
      "WEST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "CROSS THE BROKEN SLAB",
        "FOLLOW THE RAISED CURB"
      ]
    ],
    "completion": "Northern Ridge discovery clue retained; crossing alternatives share one reward; retire after clue and crossing resolution."
  },
  "east:73": {
    "name": "TOXIC CARGO",
    "lifecycle": "One-time",
    "regions": [
      "INDUSTRIAL",
      "SEAPORT"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "CIRCLE UPWIND"
      ],
      [
        "REACH FOR THE SERVICE POUCH"
      ]
    ],
    "completion": "Terminal flags: wo2.toxic. Existing rewards/quest consequences retained."
  },
  "east:74": {
    "name": "COLLAPSING LOOKOUT",
    "lifecycle": "One-time",
    "regions": [
      "NORTH",
      "WEST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "CLIMB THE PLATFORM"
      ],
      [
        "PULL DOWN THE LOOSE CLOTH"
      ]
    ],
    "completion": "Terminal flags: wo2.wo3Lookout. Existing rewards/quest consequences retained."
  },
  "east:75": {
    "name": "WILD BEAR",
    "lifecycle": "One-time",
    "regions": [
      "NORTH",
      "WEST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "ATTEMPT TO SCARE IT AWAY"
      ],
      [
        "FIGHT"
      ]
    ],
    "completion": "Terminal flags: wo2.wo4Bear. Existing rewards/quest consequences retained."
  },
  "east:76": {
    "name": "LETTERS BENEATH A STONE",
    "lifecycle": "Inactive",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [],
    "completion": "Historical slot preserved; remains excluded from new random roadside selection."
  },
  "east:77": {
    "name": "THE BROKEN BRIDGE DISCOVERY",
    "lifecycle": "One-time",
    "regions": [
      "LOWLANDS"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "STUDY THE FAMILY MARKINGS \u2014 8 XP"
      ],
      [
        "SALVAGE THE LOOSE PANEL \u2014 1 SCRAP METAL"
      ],
      [
        "EXAMINE THE MEASUREMENTS"
      ],
      [
        "SEARCH FOR ADDITIONAL EVIDENCE"
      ]
    ],
    "completion": "Retire when every finite reward group is claimed: STUDY THE FAMILY MARKINGS \u2014 8 XP; SALVAGE THE LOOSE PANEL \u2014 1 SCRAP METAL; EXAMINE THE MEASUREMENTS; SEARCH FOR ADDITIONAL EVIDENCE. Partial returns retain remaining choices."
  },
  "east:78": {
    "name": "THE LAST STOP",
    "lifecycle": "Repeatable",
    "regions": [
      "WEST",
      "CENTRAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "OFFER AN ENERGY BAR"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "east:79": {
    "name": "TOMMY BRIGGS \u2014 POSTAL ENCOUNTER",
    "lifecycle": "Conditional",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "OFFER A BANDAGE"
      ]
    ],
    "completion": "Tommy helped with bandage or shelter AND postal clue learned; town postal context is preserved."
  },
  "east:80": {
    "name": "SALT WIND THROUGH THE REEDS",
    "lifecycle": "Inactive",
    "regions": [],
    "workOrderId": null,
    "service": false,
    "groups": [],
    "completion": "Historical slot preserved; remains excluded from new random roadside selection."
  },
  "east:81": {
    "name": "WARD OF THE FORGOTTEN",
    "lifecycle": "Fixed",
    "regions": [
      "EAST"
    ],
    "workOrderId": null,
    "service": true,
    "groups": [
      [
        "ENTER ST MERCY HOSPITAL"
      ]
    ],
    "completion": "Permanent location registration; existing site and reward guards apply, never injected into random roadside pool."
  },
  "east:52": {
    "name": "RIVER OF FIRE",
    "lifecycle": "Repeatable",
    "regions": [
      "LOWLANDS"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "INSPECT THE RED MITTEN"
      ],
      [
        "PICK THROUGH THE CLEAR PATH"
      ],
      [
        "SMOTHER AN EDGE WITH CLOTH"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:139": {
    "name": "MURPHY'S LOST CORVETTE",
    "lifecycle": "Conditional",
    "regions": [],
    "workOrderId": null,
    "service": true,
    "groups": [],
    "completion": "Existing Corvette found flag removes roadside discovery; restoration, location report and timers remain with Murphy."
  },
  "early:140": {
    "name": "Mountain Poachers",
    "lifecycle": "Repeatable",
    "regions": [
      "NORTH"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:141": {
    "name": "Territorial Survivalists",
    "lifecycle": "Repeatable",
    "regions": [
      "NORTH"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:142": {
    "name": "Mountain Lions",
    "lifecycle": "Repeatable",
    "regions": [
      "NORTH"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:143": {
    "name": "Carrion Vultures",
    "lifecycle": "Repeatable",
    "regions": [
      "WEST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:144": {
    "name": "Rabid Badgers",
    "lifecycle": "Repeatable",
    "regions": [
      "WEST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:145": {
    "name": "Territorial Buck",
    "lifecycle": "Repeatable",
    "regions": [
      "WEST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:146": {
    "name": "Looters",
    "lifecycle": "Repeatable",
    "regions": [
      "CENTRAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ],
      [
        "INTIMIDATE"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:147": {
    "name": "The Hollowed",
    "lifecycle": "Repeatable",
    "regions": [
      "CENTRAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ],
      [
        "OFFER FOOD"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:148": {
    "name": "Rabid Raccoons",
    "lifecycle": "Repeatable",
    "regions": [
      "CENTRAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:149": {
    "name": "Bat Colony",
    "lifecycle": "Repeatable",
    "regions": [
      "CENTRAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:150": {
    "name": "The Squatters",
    "lifecycle": "Repeatable",
    "regions": [
      "CENTRAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:151": {
    "name": "Parking Lot Raiders",
    "lifecycle": "Repeatable",
    "regions": [
      "CENTRAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:152": {
    "name": "Gunshop Owner",
    "lifecycle": "Repeatable",
    "regions": [
      "CENTRAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:153": {
    "name": "Payment Required",
    "lifecycle": "Repeatable",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:154": {
    "name": "Industrial Spiders",
    "lifecycle": "Repeatable",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:155": {
    "name": "Chemical Burners",
    "lifecycle": "Repeatable",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:156": {
    "name": "Junkyard Hermit",
    "lifecycle": "Repeatable",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "OFFER SCRAP"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:157": {
    "name": "Factory Enforcers",
    "lifecycle": "Repeatable",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:158": {
    "name": "Scrap Torchers",
    "lifecycle": "Repeatable",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:159": {
    "name": "Fuel Thieves",
    "lifecycle": "Repeatable",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ],
      [
        "TAKE THE FUEL"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:160": {
    "name": "Alligators",
    "lifecycle": "Repeatable",
    "regions": [
      "LOWLANDS"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:161": {
    "name": "Water Moccasins",
    "lifecycle": "Repeatable",
    "regions": [
      "LOWLANDS"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:162": {
    "name": "Backwoods Cannibals",
    "lifecycle": "Repeatable",
    "regions": [
      "LOWLANDS"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:163": {
    "name": "Snapping Turtles",
    "lifecycle": "Repeatable",
    "regions": [
      "LOWLANDS"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:164": {
    "name": "Giant Mosquitoes",
    "lifecycle": "Repeatable",
    "regions": [
      "LOWLANDS"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:165": {
    "name": "Hostile Swamp Dwellers",
    "lifecycle": "Repeatable",
    "regions": [
      "LOWLANDS"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:166": {
    "name": "Cornfield Stalkers",
    "lifecycle": "Repeatable",
    "regions": [
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:167": {
    "name": "Territorial Farmers",
    "lifecycle": "Repeatable",
    "regions": [
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:168": {
    "name": "Feral Bull",
    "lifecycle": "Repeatable",
    "regions": [
      "EAST"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:169": {
    "name": "Dockside Pirates",
    "lifecycle": "Repeatable",
    "regions": [
      "SEAPORT"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:170": {
    "name": "Shipwreck Scavengers",
    "lifecycle": "Repeatable",
    "regions": [
      "SEAPORT"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:171": {
    "name": "Aggressive Seagulls",
    "lifecycle": "Repeatable",
    "regions": [
      "SEAPORT"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:172": {
    "name": "THE STRANDED FAMILY",
    "lifecycle": "Repeatable",
    "regions": [
      "WEST"
    ],
    "workOrderId": "W1",
    "service": false,
    "groups": [],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:173": {
    "name": "THE HUNTER'S TRAP",
    "lifecycle": "Repeatable",
    "regions": [
      "WEST"
    ],
    "workOrderId": "W2",
    "service": false,
    "groups": [],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:174": {
    "name": "THE ABANDONED TRADING POST",
    "lifecycle": "Conditional",
    "regions": [
      "WEST"
    ],
    "workOrderId": "W3",
    "service": false,
    "groups": [],
    "completion": "Successful final reward/combat outcome resolves persistently; observations, resource failures and generic leaving do not."
  },
  "early:175": {
    "name": "THE FALSE SCARECROW",
    "lifecycle": "Repeatable",
    "regions": [
      "WEST"
    ],
    "workOrderId": "W4",
    "service": false,
    "groups": [],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:176": {
    "name": "THE ANT COLONY",
    "lifecycle": "Repeatable",
    "regions": [
      "WEST"
    ],
    "workOrderId": "W5",
    "service": false,
    "groups": [],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:177": {
    "name": "THE BURIED BUNKER",
    "lifecycle": "One-time",
    "regions": [
      "WEST"
    ],
    "workOrderId": "W6",
    "service": false,
    "groups": [],
    "completion": "Successful final reward/combat outcome resolves persistently; observations, resource failures and generic leaving do not."
  },
  "early:178": {
    "name": "THE COUNTERFEIT RATIONS",
    "lifecycle": "Repeatable",
    "regions": [
      "WEST"
    ],
    "workOrderId": "W7",
    "service": false,
    "groups": [],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:179": {
    "name": "THE GRAVESIDE GAMBLER",
    "lifecycle": "Repeatable",
    "regions": [
      "WEST"
    ],
    "workOrderId": "W8",
    "service": false,
    "groups": [],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:180": {
    "name": "THE TRAVELING TAXIDERMIST",
    "lifecycle": "Repeatable",
    "regions": [
      "WEST"
    ],
    "workOrderId": "W9",
    "service": false,
    "groups": [],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:181": {
    "name": "THE EMPTY ASSEMBLY LINE",
    "lifecycle": "One-time",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": "I1",
    "service": false,
    "groups": [],
    "completion": "Successful final reward/combat outcome resolves persistently; observations, resource failures and generic leaving do not."
  },
  "early:182": {
    "name": "THE LAST FAX MACHINE",
    "lifecycle": "One-time",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": "I2",
    "service": false,
    "groups": [],
    "completion": "Successful final reward/combat outcome resolves persistently; observations, resource failures and generic leaving do not."
  },
  "early:183": {
    "name": "EMPLOYEE ENTRANCE ONLY",
    "lifecycle": "One-time",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": "I3",
    "service": false,
    "groups": [],
    "completion": "Successful final reward/combat outcome resolves persistently; observations, resource failures and generic leaving do not."
  },
  "early:184": {
    "name": "THE BATTERY ROOM",
    "lifecycle": "Conditional",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": "I4",
    "service": false,
    "groups": [],
    "completion": "Engine recovery flag resolves; failed flooded approach and saved emergency shutoff persist."
  },
  "early:185": {
    "name": "THE TRAINING VIDEO",
    "lifecycle": "One-time",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": "I5",
    "service": false,
    "groups": [],
    "completion": "Watch video AND search room, or salvage projector; each reward branch once."
  },
  "early:186": {
    "name": "LIVE WIRES",
    "lifecycle": "Repeatable",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": "I6",
    "service": false,
    "groups": [],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:187": {
    "name": "THE COLLAPSING CATWALK",
    "lifecycle": "Repeatable",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": "I7",
    "service": false,
    "groups": [],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:188": {
    "name": "THE PARTS TRUCK",
    "lifecycle": "Conditional",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": "I8",
    "service": false,
    "groups": [],
    "completion": "Existing Corvette Battery recovery/delivery flags resolve; unstable-vehicle progress survives return."
  },
  "early:189": {
    "name": "THE SLEEPING ROBOT",
    "lifecycle": "One-time",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": "I9",
    "service": false,
    "groups": [],
    "completion": "Successful final reward/combat outcome resolves persistently; observations, resource failures and generic leaving do not."
  },
  "early:190": {
    "name": "THE TOOL CRIB",
    "lifecycle": "One-time",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": "I10",
    "service": false,
    "groups": [],
    "completion": "Successful final reward/combat outcome resolves persistently; observations, resource failures and generic leaving do not."
  },
  "early:191": {
    "name": "THE SALVAGE YARD LEDGER",
    "lifecycle": "One-time",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": "I11",
    "service": false,
    "groups": [],
    "completion": "Successful final reward/combat outcome resolves persistently; observations, resource failures and generic leaving do not."
  },
  "early:192": {
    "name": "THE TRAPPED WORKER",
    "lifecycle": "Conditional",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": "I12",
    "service": false,
    "groups": [],
    "completion": "Gideon actually rescued; robbery is once-only and does not substitute for rescue."
  },
  "early:193": {
    "name": "THE WATER SHIPMENT",
    "lifecycle": "Repeatable",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": "I13",
    "service": false,
    "groups": [],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:194": {
    "name": "THE FACTORY WHISTLE",
    "lifecycle": "Repeatable",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": "I14",
    "service": false,
    "groups": [],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:195": {
    "name": "THE LAST PAYCHECK",
    "lifecycle": "One-time",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": "I15",
    "service": false,
    "groups": [],
    "completion": "Successful final reward/combat outcome resolves persistently; observations, resource failures and generic leaving do not."
  },
  "early:196": {
    "name": "THE MIDNIGHT SHIFT",
    "lifecycle": "One-time",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": "I16",
    "service": false,
    "groups": [],
    "completion": "Disable control equipment or defeat security; loading-area salvage alone preserves trapped-worker objective."
  },
  "early:197": {
    "name": "CHEMICAL RUNOFF",
    "lifecycle": "Conditional",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": "I17",
    "service": false,
    "groups": [],
    "completion": "Successful final reward/combat outcome resolves persistently; observations, resource failures and generic leaving do not."
  },
  "early:198": {
    "name": "AUTONOMOUS SECURITY HOUNDS",
    "lifecycle": "Repeatable",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "ATTEMPT TO DISABLE THEM"
      ],
      [
        "ATTEMPT TO FLEE"
      ],
      [
        "FIGHT THE HOUNDS"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  },
  "early:199": {
    "name": "THE LAST AUTONOMOUS TAXI",
    "lifecycle": "Repeatable",
    "regions": [
      "INDUSTRIAL"
    ],
    "workOrderId": null,
    "service": false,
    "groups": [
      [
        "ATTEMPT TO DISABLE THE TAXI"
      ],
      [
        "ATTEMPT TO ESCAPE"
      ],
      [
        "REFUSE AND FIGHT"
      ]
    ],
    "completion": "New road occurrence permits ordinary rewards; duplicate rewarded action/victory blocked within current occurrence. Existing unique sub-reward flags remain permanent."
  }
};
const RoadLifecycle={
 active:null,policies:ROAD_LIFECYCLE,
 state(){const f=player.flags;const q=f.roadLifecycle||(f.roadLifecycle={version:1,records:{}});q.records=q.records||{};if(f.r18HorseOwned){const rec=q.records['east:40']||(q.records['east:40']={claims:{},visit:{key:null,claims:{}}});rec.horseResolved=true;}if(f.r18QuicksandOutcome==='abandoned'){delete f.r18QuicksandOutcome;q.quicksandDeclineMigrated=true;}return q;},
 record(id,create=true){const q=this.state().records;return q[id]||(create?(q[id]={claims:{},visit:{key:null,claims:{}}}):{claims:{},visit:{claims:{}}});},
 entry(e){return e?RoadScenarioRegistry.regionalByTitle?.get(r10CanonicalTitle(e.title)):null;},
 policy(e){return this.policies[typeof e==='string'?e:this.entry(e)?.id];},
 sceneKey(id){return 'WO13:'+id;},
 occurrence(){const g=typeof lanternState==='function'?lanternState():null;return g?.sceneId||[day,dailyRoadTurns,roadGoal,roadTurn].join(':');},
 visitClaims(id){const q=this.record(id),key=this.occurrence();if(q.visit.key!==key)q.visit={key,claims:{}};return q.visit.claims;},
 claims(id){const p=this.policies[id],q=this.record(id);if(p?.lifecycle!=='Repeatable')return q.claims;const key=this.occurrence();if(q.visit.key!==key)q.visit={key,claims:{}};return q.visit.claims;},
 aliases(id,key){if(id==='early:2'&&/SMASH VENDING|PRY VENDING/.test(key))return 'VENDING CONTENTS';if(id==='early:56'&&/PICK THE LOCK|WORK THE HINGE|SMASH THE LOCK/.test(key))return 'CHEST CONTENTS';if(id==='early:42'&&/REINFORCE AND DESCEND|DESCEND CAREFULLY/.test(key))return 'WELL DESCENT';if(id==='east:31'&&/USE ROPE|WADE TO/.test(key))return 'SEALED CASE';const group=this.policies[id]?.groups.find(g=>g.length>1&&g.includes(key));return group?'GROUP:'+group[0]:key;},
 flag(path){return path.split('.').reduce((v,k)=>v?.[k],player.flags);},
 flagRules:{
 'early:6':[['r18StrayReunionDone']],'early:7':[['r18CellarResolved']],'early:12':[['r18CalebRescued']],
 'early:21':[['r18DroneDisabled']],'early:35':[['r18LibraryResolved']],'early:36':[['r18GnomeDefeated']],
 'early:41':[['r18PicnicClaimed']],'early:43':[['r18EnidSculptureLost'],['r18EnidLanternPromised']],
 'early:50':[['r18HoundAdopted']],'early:54':[['r18DeliveryResolved']],'early:56':[['r18MechanicChestOpened']],
 'early:61':[['r18RunnerReunionDone']],'east:13':[['r18BlackSnowResolved','r18BlackSnowTruck']],
 'east:16':[['r18PickensResolved']],'east:17':[['r18WaxArmorClaimed']],'east:18':[['r18MarthaSettled']],
 'east:19':[['r18QuicksandOutcome','r18QuicksandSatchel']],'east:21':[['r18DanielQuest','r18ClaraStatueSearched']],
 'east:22':[['r18SaltWorkersFreed']],'east:25':[['r18ArmoryClaimed']],'east:27':[['r18ChapelBoxClaimed']],
 'east:35':[['r18OilOutcome']],'east:39':[['r18SilasOutcome','r18SilasChestClaimed']],
 'east:57':[['wo2.forklift']],'east:58':[['wo2.patrol']],'east:59':[['wo2.wo3Dogs']],
 'east:60':[['wo2.wo3Drone']],'east:61':[['wo2.wo3Stalker']],'east:62':[['wo2.crabTrap']],
 'east:63':[['wo2.wo4Sniper']],'east:64':[['wo2.crabNest']],'east:65':[['wo2.fresh']],
 'east:66':[['wo2.hash']],'east:68':[['wo2.windshield']],'east:69':[['wo2.milepost']],
 'east:71':[['wo2.wo3TrapLoot']],'east:73':[['wo2.toxic']],'east:74':[['wo2.wo3Lookout']],
 'east:75':[['wo2.wo4Bear']]
 },
 oldClaims:{
 'early:6':{'OFFER RATION':'r18StrayFed'},'early:21':{'INSPECT BOOTH':'r18DroneBadge'},
 'early:60':{'INSPECT THE RADIO':'r18RadioClue','LISTEN TO BROADCAST':'r18RadioHeard','REMOVE THE CASING':'r18RadioCasing','SALVAGE THE CIRCUIT':'r18RadioCircuit'},
 'early:0':{'INSPECT COUNTY MAP':'r18CountyMapXp','HELP WORKER TO SAFETY':'r18CountyWorkerHelped','GIVE WORKER A BANDAGE':'r18CountyWorkerHelped'},
 'early:2':{'CHECK SERVICE BAY':'gasStationWarningHeard'},'early:24':{'READ THE NOTES':'r18ShoesMemorialSeen','INSPECT THE BOOTS':'r18ShoesWarningSeen'},
 'early:25':{'SEARCH FOR A LETTER':'r18MilesLetter'},'early:28':{'HARVEST HONEY':'r18HoneyHarvested','INSPECT BEEKEEPER GEAR':'r18HoneyGearSeen'},
 'early:31':{'INSPECT MUSIC BOX':'r18CarouselMusicSeen'},'early:33':{'TELL A ROAD JOKE':'r18BridgeJokeSeen','TELL A FOOD JOKE':'r18BridgeJokeSeen','ASK ABOUT BRIDGE':'r18BridgeHistorySeen'},
 'early:53':{'RESPECT THE MEMORIAL':'r18MemorialSeen','LEAVE ONE BOLT':'r18MemorialOffering','TAKE OFFERINGS':'r18MemorialTaken'},
 'early:58':{'SIT AND TALK':'r18BusStopTalk','SAY THE BUSES ARE GONE':'r18BusStopTalk','OFFER A RATION':'r18BusStopFed','OPEN THE TIN':'r18BusStopTin','TAKE THE DRAWING':'r18BusStopDrawing','SEARCH TICKET BOX':'r18BusStopTickets'},
 'early:37':{'KNOCK ON THE DOOR':'r18StairsMechanismSeen'},
 'early:30':{'EXAMINE THE WANTED POSTER':'r18RedPosterSeen'},
 'east:32':{'JOIN THE PARADE':'r18ParadeJoined','REPAIR THE FLOAT':'r18ParadeFloatFixed','SCAVENGE AROUND THE PARADE':'r18ParadeSalvage'},
 'east:40':{'CLEAR THE SNAGGED FENCE':'r18HorseHerdHelped','CUT THE GUARDRAIL':'r18HorseHerdHelped','REDIRECT THE HERD':'r18HorseHerdHelped','SEARCH THE SADDLEBAG':'r18HorseSaddleClaimed'},
 'early:63':{'PEEK THROUGH KEYHOLE':'r18FarmKeyhole','SEARCH THE PORCH':'r18FarmPorch','RISK THE PANTRY':'r18FarmPantry','INVESTIGATE UPSTAIRS':'r18FarmNotebook','FORCE THE DOOR':'r18FarmSuitcase'},
 'early:65':{'FREE THE FAWN':'r18FawnFreed','SEARCH THE SCHOOLYARD':'r18SchoolCache'},
 'east:31':{'USE ROPE OR POLE':'r18TarCase','WADE TO SEALED CASE':'r18TarCase','SEARCH THE SHORELINE':'r18TarShore'},
 'east:77':{'EXAMINE THE MEASUREMENTS':'wo2.wo4BrokenBridge','SEARCH FOR ADDITIONAL EVIDENCE':'wo2.wo4BridgeSalvage'}
 },
 horseRetry(id,key){return id==='east:40'&&['CLEAR THE SNAGGED FENCE','CUT THE GUARDRAIL','REDIRECT THE HERD'].includes(key)&&!this.record(id,false).horseResolved&&!player.flags.r18HorseOwned;},
 claimed(id,key){const alias=this.aliases(id,key),q=this.record(id,false);return !!(q.claims[alias]||this.oldClaims[id]?.[key]&&this.flag(this.oldClaims[id][key]));},
 done(e){const id=typeof e==='string'?e:this.entry(e)?.id,p=this.policies[id];if(!p||['Repeatable','Fixed','Inactive'].includes(p.lifecycle))return false;const f=player.flags,q=this.record(id,false),w=f.wo2||{};
  if(id==='early:0')return f.r18CountyQuest==='done'&&!!f.r18CountyWorkerHelped&&!!f.r18CountyMapXp&&this.claimed(id,'CHECK GLOVEBOX')&&this.claimed(id,'SEARCH TRUCK BED');
  if(id==='early:8')return !!f.billboard&&(f.r18BillboardFrontSeen||[]).length>=6&&this.claimed(id,'SEARCH BASE');
  if(id==='early:9')return !!f.travelerInSolace||!!f.helpedTraveler||!!q.resolved;
  if(id==='early:27')return !!f.r18MazeClaimed&&!(f.wo3Corvette?.active&&(Number(f.wo3Corvette.tiresRecovered)||0)<4);
  if(id==='early:32')return !!f.r18FreezerRescueReward||!!q.resolved;
  if(id==='early:60')return !!f.r18RadioCasing&&!!f.r18RadioCircuit&&!!(f.r18Station?.edge||f.r18Station?.node);
  if(id==='early:62')return !!(f.r18RabbitAdopted||f.r18RabbitHarvested)&&!!f.r18RabbitGardenSearched&&!!f.r18RabbitShedSearched;
  if(id==='east:40')return !!f.r18HorseHerdHelped&&!!f.r18HorseSaddleClaimed&&!!(q.horseResolved||f.r18HorseOwned);
  if(id==='east:79')return !!(w.tommyHelp||q.tommySheltered)&&!!w.tommy;
  if(id==='east:21')return f.r18DanielQuest==='done'&&!!f.r18ClaraStatueSearched;
  if(id==='east:72'&&!w.northernRidge)return false;
  if(id==='east:4'&&f.r18Ash&&f.r18AshProcessionHelped&&f.r18AshProcessionSeen)return true;
  if(id==='east:70')return !!f.wo7BatteryRecovered||hasItem('Corvette Battery')||!!w.wo3Battery||!!f.wo3Corvette?.delivered?.battery||!!q.resolved||(!RoadScenarioRegistry.wo3Needs('battery')&&this.claimed(id,'SEARCH THE TOOL TRAY')&&this.claimed(id,'STRIP THE BATTERY LEADS'));
  if(p.workOrderId){const s=q.wo7;if(p.workOrderId==='I4')return !!f.wo7EngineRecovered||!!f.wo3Corvette?.engineDelivered;
   if(p.workOrderId==='I8')return !!w.wo3Battery||!!f.wo7BatteryRecovered||!!f.wo3Corvette?.delivered?.battery;
   if(p.workOrderId==='I12')return !!f.wo7GideonRescued;
   return !!s?.resolved;
  }
  if(q.resolved)return true;
  if(this.flagRules[id]?.some(group=>group.every(path=>!!this.flag(path))))return true;
  if(p.service)return false;
  return !!p.groups.length&&p.groups.every(group=>group.some(key=>this.claimed(id,key)));
 },
 eligible(e){const entry=this.entry(e),p=this.policies[entry?.id];if(!p)return false;if(p.lifecycle==='Inactive'||p.lifecycle==='Fixed')return false;if(this.done(entry.id))return false;
  if(entry.id==='early:0'&&player.flags.r18CountyQuest==='active'&&player.flags.r18CountyDepot&&!r18DepotAtOrigin()&&this.claimed(entry.id,'CHECK GLOVEBOX')&&this.claimed(entry.id,'SEARCH TRUCK BED'))return false;
  return true;
 },
 labels(e){return String((e.wo13Prompt||e.prompt)?.call(e)||e.choices||'').split(/\s{2,}/).filter(Boolean);},
 key(e,cmd){const choices=this.labels(e),c=String(cmd).trim().toLowerCase(),exact=choices.find(x=>choiceCommand(x)===c);if(exact)return exact;for(const x of choices){const words=x.toLowerCase().replace(/[^a-z ]/g,' ').split(/\s+/).filter(w=>w.length>2&&!['the','use','check'].includes(w));if(words.some(w=>c.includes(w)))return x;}return String(cmd).trim().toUpperCase();},
 transaction(key){if(key==='RECOVER SUITABLE TIRE')return true;return /^(?:BUY |SELL |BARTER |WAGER |CONFIRM .*WAGER|CANCEL |RECYCLE |START NEXT MATCH|ENTER TOURNAMENT|CHALLENGE TRAINING)/.test(key);},
 leaving(key){return /^(?:LEAVE$|BACK(?: AWAY)?$|MOVE ON$|KEEP MOVING$|WALK AWAY$|WITHDRAW$|RETREAT$|LEAVE (?:MAZE|CHAPEL|WORKER|DEPOT)|SURFACE AND LEAVE)/.test(key);},
 finiteAction(id,key){const p=this.policies[id];if(!p||this.transaction(key)||this.leaving(key)||['Fixed','Inactive'].includes(p.lifecycle))return false;if(id==='early:8'&&key==='STUDY FRONT')return false;
  if(p.lifecycle!=='Repeatable')return true;
  return !!this.oldClaims[id]?.[key]||id==='east:52'&&key==='INSPECT THE RED MITTEN'||id==='early:194'&&key==='SALVAGE WARNING EQUIPMENT';
 },
 scope(e,cmd,fn){const entry=this.entry(e),p=this.policies[entry?.id];if(!p||['Fixed','Inactive'].includes(p.lifecycle)||this.active?.id===entry.id)return fn();const id=entry.id,key=this.key(e,cmd),finite=this.finiteAction(id,key),claims=finite?this.record(id).claims:this.visitClaims(id),alias=this.aliases(id,key);
  if(!this.leaving(key)&&(this.done(id)||!this.transaction(key)&&!this.horseRetry(id,key)&&(claims[alias]||finite&&this.claimed(id,key)))){add('That part of this encounter has already been completed.','system');return false;}
  const prior=this.active,ctx={id,key,alias,finite,earned:false,scene:this.occurrence(),leaving:this.leaving(key)};this.active=ctx;let result;try{result=fn();return result;}finally{this.active=prior;
   if(ctx.earned&&!combatState&&!ctx.leaving&&!this.transaction(key)){claims[alias]=true;this.updateWO7Outcome(id,key);}
   if(id==='east:79'&&key==='POINT OUT A SHELTERED SPOT'&&result!==false)this.record(id).tommySheltered=true;
   if(id==='east:40'&&(key==='LEAVE THE HORSE'||player.flags.r18HorseOwned))this.record(id).horseResolved=true;
   if(result!==false)v49Autosave();
  }
 },
 updateWO7Outcome(id,key){const p=this.policies[id],q=this.record(id).wo7;if(!q||p.lifecycle==='Repeatable')return;const w=p.workOrderId;if(w==='I4'||w==='I8'||w==='I12')return;
  if(w==='I16'&&key==='SALVAGE THE LOADING AREA')return;
  if(w==='I5'){q.resolved=key==='SALVAGE THE PROJECTOR'||this.claimed(id,'WATCH THE VIDEO')&&this.claimed(id,'SEARCH THE ROOM');return;}
  q.resolved=true;q.outcome=key;
 },
 wo7State(id){const entry=RoadScenarioRegistry.regionalCatalog.find(e=>e.workOrderId===id),p=this.policies[entry?.id],visit=this.occurrence(),key=visit+'|'+id;let q=player.flags.wo7Scene;
  if(!p||p.lifecycle==='Repeatable'){if(!q||q.key!==key)q=player.flags.wo7Scene={id,key,done:false,seen:{}};return q;}
  const rec=this.record(entry.id);if(!rec.wo7){rec.wo7=q?.id===id?q:{id,key,done:false,seen:{}};rec.wo7.visit=rec.wo7.visit||visit;}
  q=rec.wo7;if(q.visit!==visit&&!q.resolved){q.done=false;q.combat=false;delete q.combatReward;q.visit=visit;}
  q.key=key;q.seen=q.seen||{};player.flags.wo7Scene=q;return q;
 },
 battleWon(c){const origin=c.wo13Origin;if(!origin)return;const p=this.policies[origin.id],rec=this.record(origin.id),claims=p.lifecycle==='Repeatable'?this.claims(origin.id):rec.claims;claims['COMBAT:'+c.name]=true;claims[this.aliases(origin.id,origin.key)]=true;
  if(p.workOrderId&&p.lifecycle!=='Repeatable'){const q=rec.wo7;if(q){if(!['I4','I8','I12'].includes(p.workOrderId)){q.resolved=true;q.outcome='COMBAT VICTORY';}}}
  else if(['early:6','early:7','early:32','east:26'].includes(origin.id))rec.resolved=true;
  v49Autosave();
 },
 install(){const life=this;
  const xp=gainXp;gainXp=function(n){if(life.active&&n>0)life.active.earned=true;return xp(n);};
  const bolts=gainBolts;gainBolts=function(n){if(life.active&&n>0)life.active.earned=true;return bolts(n);};
  const pack=addPack;addPack=function(...args){const result=pack(...args);if(result&&life.active)life.active.earned=true;return result;};
  const retain=r18RetainRoadReward;r18RetainRoadReward=function(...args){if(life.active)life.active.earned=true;return retain(...args);};
  for(const encounter of new Set([...encounters,...eastEncounters])){const entry=this.entry(encounter);if(!entry||!this.policies[entry.id]||['Fixed','Inactive'].includes(this.policies[entry.id].lifecycle))continue;
   const resolve=encounter.resolve;encounter.resolve=function(cmd,...args){return life.scope(this,cmd,()=>resolve.call(this,cmd,...args));};
   if(encounter.prompt)encounter.wo13Prompt=encounter.prompt;else encounter.wo13Prompt=function(){return this.choices;};
   encounter.prompt=function(){const p=life.policies[entry.id];return life.labels(this).filter(key=>life.leaving(key)||life.transaction(key)||!life.finiteAction(entry.id,key)||life.horseRetry(entry.id,key)||!life.claimed(entry.id,key)).join('   ');};
  }
  const resolve=resolveEncounter;resolveEncounter=function(cmd,...args){const e=currentEncounter();return life.scope(e,cmd,()=>resolve(cmd,...args));};
  const choices=WO7.choices;WO7.choices=function(id){const entry=RoadScenarioRegistry.regionalCatalog.find(e=>e.workOrderId===id);return choices.call(this,id).filter(key=>!entry||life.leaving(key)||life.transaction(key)||!life.finiteAction(entry.id,key)||!life.claimed(entry.id,key));};
  const act=WO7.act;WO7.act=function(id,cmd){const e=RoadScenarioRegistry.regionalCatalog.find(e=>e.workOrderId===id)?.encounter;return life.scope(e,cmd,()=>act.call(this,id,cmd));};
  const candidates=r10Candidates;r10Candidates=function(pool,kind){return candidates(pool,kind).filter(i=>life.eligible(r10Pool(pool)[i]));};
  const prepare=r10PrepareEncounter;r10PrepareEncounter=function(...args){life.state();if(resumeSavedEncounter&&!combatState){const e=currentEncounter();if(e&&life.done(e)){resumeSavedEncounter=false;delete player.encounterDone[roadTurn];const g=lanternState();if(g)g.encounterIndex=null;}}return prepare(...args);};
  const start=startCombat;startCombat=function(spec,source,...args){const ctx=life.active;const result=start(spec,source,...args);if(combatState&&source==='encounter'&&ctx)combatState.wo13Origin={id:ctx.id,scene:ctx.scene,key:ctx.key};return result;};
  const combat=handleCombat;handleCombat=function(cmd,...args){const c=combatState;if(c&&c.source==='encounter'&&!c.wo13Origin){const entry=life.entry(currentEncounter());if(entry&&life.policies[entry.id]){c.wo13Origin={id:entry.id,scene:life.occurrence(),key:life.key(currentEncounter(),c.action||'fight')};if(life.policies[entry.id].workOrderId)life.wo7State(life.policies[entry.id].workOrderId);}}if(c?.wo13Awarded){combatState=null;return completeRoadTurn();}const result=combat(cmd,...args);if(c&&c.hp<=0&&stage!=='fallen'&&combatState!==c){c.wo13Awarded=true;life.battleWon(c);}return result;};
 }
};
RoadLifecycle.install();
// Uses the established pressure flag only for documented powerful regional threats.
// No common pest, weak scavenger, early fixed opponent, weapon, HP curve or accuracy change.
const RoadThreat={
 pressure:new Set(['MOUNTAIN LIONS','ALLIGATORS','FERAL BULL','FACTORY ENFORCERS','BACKWOODS CANNIBALS','CHEMICAL BURNERS','DOCKSIDE PIRATES']),
 raw:{'MOUNTAIN LIONS':[5,9],ALLIGATORS:[4,8],'FERAL BULL':[5,10],'FACTORY ENFORCERS':[3,7],'BACKWOODS CANNIBALS':[3,6],'CHEMICAL BURNERS':[3,7],'DOCKSIDE PIRATES':[3,7]},
 estimate(c){const attack=Math.max(1,(weaponRange()[0]+weaponRange()[1])/2-(Number(c.armorDef)||0)),pressure=c.r18LevelPressure?Math.floor((Math.max(1,Math.min(50,Number(c.level)||1))-1)*.35):0;
  const enemies=c.enemies?.length?c.enemies.filter(e=>!e.r18WallGun).map(e=>({...e,remaining:e.maxHp||e.hp})): [{...c,remaining:(c.maxHp||c.hp)*(c.r18Enforcer?1.2:1)}];let total=0,rounds=0;const defense=armorDefense()+(!c.r18Bare&&player.flags.equippedPet==='Rust Hound'?1:0);
  while(enemies.some(e=>e.remaining>0)&&rounds++<10000){const target=enemies.find(e=>e.remaining>0);target.remaining-=attack;if(!enemies.some(e=>e.remaining>0))break;for(const e of enemies)if(e.remaining>0){const lo=Number(e.r18Min??c.min)||1,hi=Number(e.r18Max??c.max)||lo;let mean=0;for(let raw=lo;raw<=hi;raw++){const n=raw+pressure;mean+=scaledEnemyDamage(isDark()?Math.ceil(n*1.25):n,defense,c.level);}total+=mean/Math.max(1,hi-lo+1);}}
  const ratio=total/Math.max(1,player.maxHp),label=ratio<.03?'TRIVIAL':ratio<.20?'LOW':ratio<.55?'MODERATE':ratio<.95?'HIGH':'EXTREME';return {label,projectedHpLoss:Math.round(total),ratio,rounds,assumptions:'Baseline sequential targeting, mean raw attacks, equipped defenses; current day/night; before tactics, crits, misses, healing or special reactions.'};
 },
 show(c){if(!c)return;const t=this.estimate(c);add(`COMBAT THREAT — ${t.label}. Baseline estimate with your equipment; tactics and current wounds can change the outcome.`,'system');}
};
const wo13ThreatStart=startCombat;startCombat=function(spec,source,...args){const strong=source==='encounter'&&RoadThreat.pressure.has(spec.name)&&spec.regionalCombatLoot;
 const raw=RoadThreat.raw[spec.name];const corrected=strong?{...spec,min:raw[0],max:raw[1],r18LevelPressure:true,...(spec.enemies?{enemies:spec.enemies.map(e=>({...e,r18Min:raw[0],r18Max:raw[1]}))}:{})}:spec;const result=wo13ThreatStart(corrected,source,...args);RoadThreat.show(combatState);return result;};
const wo13ThreatLoad=loadGame;loadGame=function(...args){const result=wo13ThreatLoad(...args);RoadLifecycle.state();if(combatState)RoadThreat.show(combatState);return result;};
