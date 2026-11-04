/* Playtest — original 25 wanderer biography/recruitment expansion.
 * Canonical IDs remain the original first names: save, quests, loot and encounter identifiers untouched.
 * Apply existing world-expansion mechanics without changing authoritative Playtest code.
 */
(() => {
 'use strict';
 if(!/^\/route127\/playtest\/(?:index\.html)?$/.test(location.pathname))return;
 if(typeof WandererWorldExpansion==='undefined'||typeof wanderers==='undefined')return;
 const profiles=[
  {
    "name": "Tess",
    "displayName": "Tess Calder",
    "occupation": "Guard",
    "aptitudes": {
      "medicine": 2,
      "trading": 4,
      "mechanics": 2,
      "banking": 5
    },
    "connection": "Lantern Highway; Station Nine",
    "personality": "A watchful former route sentry who counts the quiet stretches between patrols.",
    "introduction": "Tess scans the abandoned mile markers, keeping one hand near a patched field notebook.",
    "dialogue": [
      "A quiet road bothers me more than a loud one.",
      "I used to mark safe shoulders for people traveling alone.",
      "Give Seaport a reliable lookout and I'll take the next shift."
    ],
    "method": "conversation",
    "options": [
      {
        "id": "conversation",
        "label": "OFFER TESS A USEFUL ROLE IN SEAPORT",
        "response": "Tess accepts the offer and heads for Seaport."
      }
    ],
    "conditional": {
      "flag": "station",
      "before": "Station Nine is quiet. Until the relay works, I trust the mile markers more than rumors.",
      "after": "Station Nine is sending again. That gives people on the highway another chance to be found."
    }
  },
  {
    "name": "Patch",
    "displayName": "Patch Ellery",
    "occupation": "Mechanic",
    "aptitudes": {
      "medicine": 2,
      "trading": 2,
      "mechanics": 5,
      "banking": 3
    },
    "connection": "Scrap Yard; Murphy",
    "personality": "A relentlessly cheerful fixer who hoards small fasteners.",
    "introduction": "Patch sorts three intact screws into a jar, grinning at the day's small victory.",
    "dialogue": [
      "Three good screws means the road owed me a favor.",
      "Murphy taught me a bent thread can cost a whole afternoon.",
      "Let me work where useful scraps don't go to waste."
    ],
    "method": "supplies",
    "options": [
      {
        "id": "supplies",
        "label": "PROVIDE 1 SCRAP METAL TO PATCH",
        "item": "Scrap Metal",
        "qty": 1,
        "response": "Patch accepts the supplies and agrees to join the Seaport workforce."
      }
    ]
  },
  {
    "name": "Hollis",
    "displayName": "Hollis Greer",
    "occupation": "Cook",
    "aptitudes": {
      "medicine": 3,
      "trading": 3,
      "mechanics": 2,
      "banking": 4
    },
    "connection": "Rusty Lantern; Solace",
    "personality": "An exhausted cook who remembers how to keep a communal kitchen going.",
    "introduction": "Hollis cups an empty tin mug beside an extinguished cooking fire.",
    "dialogue": [
      "If Solace has coffee, don't tell me.",
      "I can stretch a pot of broth farther than most folks stretch hope.",
      "Offer me a stove and some quiet and I'll work."
    ],
    "method": "conversation",
    "options": [
      {
        "id": "conversation",
        "label": "OFFER HOLLIS A USEFUL ROLE IN SEAPORT",
        "response": "Hollis accepts the offer and heads for Seaport."
      }
    ]
  },
  {
    "name": "Rook",
    "displayName": "Rook Vance",
    "occupation": "Guard",
    "aptitudes": {
      "medicine": 2,
      "trading": 4,
      "mechanics": 3,
      "banking": 2
    },
    "connection": "Industrial Corridor; Lantern Highway",
    "personality": "A guarded sentry who trusts evidence more than promises.",
    "introduction": "Rook checks a trail of bootprints beneath a derelict road sign.",
    "dialogue": [
      "You following me? No? Good.",
      "The industrial road taught me to check my blind spots.",
      "Show me Seaport takes its watches seriously."
    ],
    "method": "bolts",
    "options": [
      {
        "id": "bolts",
        "label": "PAY THE STANDARD HIRING FEE TO ROOK",
        "bolts": true,
        "response": "Rook accepts the agreed hiring fee and heads for Seaport."
      }
    ]
  },
  {
    "name": "June",
    "displayName": "June Whitcomb",
    "occupation": "Medic",
    "aptitudes": {
      "medicine": 5,
      "trading": 2,
      "mechanics": 2,
      "banking": 3
    },
    "connection": "St. Mercy Hospital; Wayne",
    "personality": "A gentle medic who measures a person's pain before asking questions.",
    "introduction": "June folds a clean dressing beneath the shade of a cracked hospital sign.",
    "dialogue": [
      "You bleeding? No? Good day, then.",
      "Wayne needs hands willing to clean wounds without judging people.",
      "One clean Cloth for the clinic will get me moving."
    ],
    "method": "supplies",
    "options": [
      {
        "id": "supplies",
        "label": "PROVIDE 1 CLOTH TO JUNE",
        "item": "Cloth",
        "qty": 1,
        "response": "June accepts the supplies and agrees to join the Seaport workforce."
      }
    ],
    "conditional": {
      "flag": "hospital",
      "before": "St. Mercy still needs clean hands and clear paths before it can help anyone.",
      "after": "You helped clear St. Mercy. That is a real chance to put its supplies back to work."
    }
  },
  {
    "name": "Moss",
    "displayName": "Moss Wilder",
    "occupation": "Scavenger",
    "aptitudes": {
      "medicine": 2,
      "trading": 3,
      "mechanics": 4,
      "banking": 2
    },
    "connection": "Northern Ridge; Solace",
    "personality": "A quiet scavenger skilled at finding shelter without disturbing it.",
    "introduction": "Moss studies a hillside windbreak, tapping two fingers to his brow.",
    "dialogue": [
      "Talking doesn't make a shelter stronger.",
      "There are dry places on the ridge if you know where the water goes.",
      "Make room for a quiet scavenger and I'll come."
    ],
    "method": "conversation",
    "options": [
      {
        "id": "conversation",
        "label": "OFFER MOSS A USEFUL ROLE IN SEAPORT",
        "response": "Moss accepts the offer and heads for Seaport."
      }
    ]
  },
  {
    "name": "Kettle",
    "displayName": "Kettle Brant",
    "occupation": "Cook",
    "aptitudes": {
      "medicine": 3,
      "trading": 2,
      "mechanics": 5,
      "banking": 1
    },
    "connection": "Western roads; Rusty Lantern",
    "personality": "A strange but warmhearted cook who follows old road songs.",
    "introduction": "Kettle taps a dented cooking pot, trying to remember an old tune.",
    "dialogue": [
      "Never trust a road that looks straight.",
      "Jen's bar is one of the few places where stories outlast the food.",
      "Bring some Cloth for a clean cook station, then let's talk."
    ],
    "method": "supplies",
    "options": [
      {
        "id": "supplies",
        "label": "PROVIDE 1 CLOTH TO KETTLE",
        "item": "Cloth",
        "qty": 1,
        "response": "Kettle accepts the supplies and agrees to join the Seaport workforce."
      }
    ]
  },
  {
    "name": "Vera",
    "displayName": "Vera Talbot",
    "occupation": "Trader",
    "aptitudes": {
      "medicine": 2,
      "trading": 5,
      "mechanics": 2,
      "banking": 4
    },
    "connection": "Fresh Mart; Johnny's Trading Post",
    "personality": "A practical trader who prioritizes necessities over bravado.",
    "introduction": "Vera compares the stitching on two patched shoes outside a shuttered storefront.",
    "dialogue": [
      "Boots first. Food second. Pride somewhere around ninth.",
      "Johnny knows everything is worth exactly what someone will trade.",
      "Give me a place to price useful goods fairly."
    ],
    "method": "conversation",
    "options": [
      {
        "id": "conversation",
        "label": "OFFER VERA A USEFUL ROLE IN SEAPORT",
        "response": "Vera accepts the offer and heads for Seaport."
      }
    ]
  },
  {
    "name": "Deke",
    "displayName": "Deke Ransom",
    "occupation": "Guard",
    "aptitudes": {
      "medicine": 1,
      "trading": 3,
      "mechanics": 4,
      "banking": 2
    },
    "connection": "Iron Pit; Lantern Highway",
    "personality": "A cocky guard who hides careful judgment behind jokes.",
    "introduction": "Deke leans beside a battered road barricade, smiling without relaxing.",
    "dialogue": [
      "If I wanted your Bolts, we'd already be negotiating.",
      "I've seen Iron Pit fighters lose because they stopped watching.",
      "Pay the standard fee; I'll keep your gate secure."
    ],
    "method": "bolts",
    "options": [
      {
        "id": "bolts",
        "label": "PAY THE STANDARD HIRING FEE TO DEKE",
        "bolts": true,
        "response": "Deke accepts the agreed hiring fee and heads for Seaport."
      }
    ]
  },
  {
    "name": "Ash",
    "displayName": "Ash Fenwick",
    "occupation": "Scavenger",
    "aptitudes": {
      "medicine": 3,
      "trading": 2,
      "mechanics": 2,
      "banking": 5
    },
    "connection": "Riverdale Cemetery; Eastern roads",
    "personality": "A nervous scavenger who knows when to leave a dangerous site alone.",
    "introduction": "Ash pauses by a broken cemetery gate, already measuring an exit route.",
    "dialogue": [
      "Just passing through. Same as you.",
      "You learn which doors to leave shut in Riverdale.",
      "Let me sort salvage somewhere people don't chase me."
    ],
    "method": "conversation",
    "options": [
      {
        "id": "conversation",
        "label": "OFFER ASH A USEFUL ROLE IN SEAPORT",
        "response": "Ash accepts the offer and heads for Seaport."
      }
    ]
  },
  {
    "name": "Bram",
    "displayName": "Bram Harker",
    "occupation": "Mechanic",
    "aptitudes": {
      "medicine": 2,
      "trading": 3,
      "mechanics": 5,
      "banking": 2
    },
    "connection": "Station Nine; Industrial Corridor",
    "personality": "A gruff mechanic who values clear hands and reliable equipment.",
    "introduction": "Bram tightens a bent latch on a roadside service box.",
    "dialogue": [
      "Keep your weapon low and we'll get along.",
      "A broken station can be repaired. A careless repair is harder.",
      "A bit of Wire will help me get started in Seaport."
    ],
    "method": "supplies",
    "options": [
      {
        "id": "supplies",
        "label": "PROVIDE 1 WIRE TO BRAM",
        "item": "Wire",
        "qty": 1,
        "response": "Bram accepts the supplies and agrees to join the Seaport workforce."
      }
    ],
    "conditional": {
      "flag": "station",
      "before": "Without a working signal, the old station is just another tower collecting rust.",
      "after": "You got Station Nine talking again. Now keep the cables dry and the fittings tight."
    }
  },
  {
    "name": "Lark",
    "displayName": "Lark Holloway",
    "occupation": "Trader",
    "aptitudes": {
      "medicine": 4,
      "trading": 5,
      "mechanics": 2,
      "banking": 3
    },
    "connection": "Relay roads; Station Nine",
    "personality": "A curious trader who notices broadcasts nobody else hears.",
    "introduction": "Lark holds an ear to an old receiver as the wind shifts across the highway.",
    "dialogue": [
      "You hear the relay at night too?",
      "If Station Nine speaks again, the roads will feel smaller.",
      "I'll go where someone still values a good signal."
    ],
    "method": "conversation",
    "options": [
      {
        "id": "conversation",
        "label": "OFFER LARK A USEFUL ROLE IN SEAPORT",
        "response": "Lark accepts the offer and heads for Seaport."
      }
    ],
    "conditional": {
      "flag": "station",
      "before": "I still catch a whisper of the relay when the night is quiet.",
      "after": "So the Station Nine signal really is back. I knew I wasn't imagining it."
    }
  },
  {
    "name": "Flint",
    "displayName": "Flint Carver",
    "occupation": "Mechanic",
    "aptitudes": {
      "medicine": 2,
      "trading": 3,
      "mechanics": 5,
      "banking": 2
    },
    "connection": "Factory; Murphy's workshop",
    "personality": "A methodical mechanic who identifies trouble by sound.",
    "introduction": "Flint holds a grease-dark bearing up to the light beside a stalled engine.",
    "dialogue": [
      "That engine noise? Bad bearing.",
      "Murphy's workshop has the right tools for honest repair.",
      "Bring me one Scrap Metal and I'll make myself useful."
    ],
    "method": "supplies",
    "options": [
      {
        "id": "supplies",
        "label": "PROVIDE 1 SCRAP METAL TO FLINT",
        "item": "Scrap Metal",
        "qty": 1,
        "response": "Flint accepts the supplies and agrees to join the Seaport workforce."
      }
    ],
    "conditional": {
      "flag": "factory",
      "before": "The Factory's machines won't tell you what's broken until you get close enough to listen.",
      "after": "The Factory's finally cleared. Maybe now someone can hear the machinery without gunfire."
    }
  },
  {
    "name": "Sable",
    "displayName": "Sable Quinn",
    "occupation": "Scavenger",
    "aptitudes": {
      "medicine": 2,
      "trading": 4,
      "mechanics": 3,
      "banking": 3
    },
    "connection": "Northern Ridge; Seaport approaches",
    "personality": "A cautious scavenger who reads intersecting tracks.",
    "introduction": "Sable pauses where two sets of footprints cross the same dusty shoulder.",
    "dialogue": [
      "Tracks cross here twice. Someone's circling.",
      "An empty path can still be watched.",
      "Offer me a place to work without looking over my shoulder."
    ],
    "method": "conversation",
    "options": [
      {
        "id": "conversation",
        "label": "OFFER SABLE A USEFUL ROLE IN SEAPORT",
        "response": "Sable accepts the offer and heads for Seaport."
      }
    ]
  },
  {
    "name": "Cricket",
    "displayName": "Cricket Delaney",
    "occupation": "Trader",
    "aptitudes": {
      "medicine": 2,
      "trading": 5,
      "mechanics": 2,
      "banking": 4
    },
    "connection": "Rusty Lantern; Scavenger Camp",
    "personality": "A talkative trader who collects rumors and verifies them.",
    "introduction": "Cricket unfolds a stained route note covered in corrections.",
    "dialogue": [
      "Two roads, three rumors, and not one good.",
      "Jen hears stories. I check which ones were actually true.",
      "A busy market stall is better than a lonely road."
    ],
    "method": "conversation",
    "options": [
      {
        "id": "conversation",
        "label": "OFFER CRICKET A USEFUL ROLE IN SEAPORT",
        "response": "Cricket accepts the offer and heads for Seaport."
      }
    ]
  },
  {
    "name": "Rowan",
    "displayName": "Rowan Pike",
    "occupation": "Scavenger",
    "aptitudes": {
      "medicine": 3,
      "trading": 4,
      "mechanics": 4,
      "banking": 2
    },
    "connection": "Fresh Mart; Scrap Yard",
    "personality": "A resourceful scavenger who recognizes useful salvage.",
    "introduction": "Rowan weighs a rescued door hinge in one palm.",
    "dialogue": [
      "A locked door means someone valued what's behind it.",
      "Fresh Mart and the Scrap Yard have more salvage than people notice.",
      "A coil of Wire will get my workbench started."
    ],
    "method": "supplies",
    "options": [
      {
        "id": "supplies",
        "label": "PROVIDE 1 WIRE TO ROWAN",
        "item": "Wire",
        "qty": 1,
        "response": "Rowan accepts the supplies and agrees to join the Seaport workforce."
      }
    ]
  },
  {
    "name": "Harlow",
    "displayName": "Harlow Reed",
    "occupation": "Medic",
    "aptitudes": {
      "medicine": 5,
      "trading": 2,
      "mechanics": 2,
      "banking": 3
    },
    "connection": "St. Mercy Hospital; Wayne",
    "personality": "A steady medic who prioritizes sanitation and follow-through.",
    "introduction": "Harlow checks a faded medical satchel for clean bandages.",
    "dialogue": [
      "Keep that wound clean.",
      "Wayne's clinic taught me that a clean cloth can save a life.",
      "Give me one Cloth and a clinic where I can work."
    ],
    "method": "supplies",
    "options": [
      {
        "id": "supplies",
        "label": "PROVIDE 1 CLOTH TO HARLOW",
        "item": "Cloth",
        "qty": 1,
        "response": "Harlow accepts the supplies and agrees to join the Seaport workforce."
      }
    ],
    "conditional": {
      "flag": "hospital",
      "before": "The wards at St. Mercy deserve more than hurried scavenging.",
      "after": "St. Mercy is clear. Now the hard part is keeping the dressings clean and the people alive."
    }
  },
  {
    "name": "Bolt",
    "displayName": "Bolt Ferris",
    "occupation": "Mechanic",
    "aptitudes": {
      "medicine": 2,
      "trading": 3,
      "mechanics": 5,
      "banking": 2
    },
    "connection": "Factory outskirts; Solace",
    "personality": "A practical mechanic who builds shelter from overlooked scraps.",
    "introduction": "Bolt sorts fasteners beside a partially collapsed shed.",
    "dialogue": [
      "Most people see junk. I see tomorrow's shelter.",
      "The Factory left enough broken parts to rebuild half of Solace.",
      "Bring me Scrap Metal and I'll build something useful."
    ],
    "method": "supplies",
    "options": [
      {
        "id": "supplies",
        "label": "PROVIDE 1 SCRAP METAL TO BOLT",
        "item": "Scrap Metal",
        "qty": 1,
        "response": "Bolt accepts the supplies and agrees to join the Seaport workforce."
      }
    ],
    "conditional": {
      "flag": "factory",
      "before": "Factory scrap is valuable, but getting to it can cost more than it's worth.",
      "after": "The Factory's cleared? Then we can turn its leftovers into roofs instead of graves."
    }
  },
  {
    "name": "Crowley",
    "displayName": "Crowley Voss",
    "occupation": "Trader",
    "aptitudes": {
      "medicine": 2,
      "trading": 5,
      "mechanics": 2,
      "banking": 4
    },
    "connection": "Scavenger Camp; Johnny's Trading Post",
    "personality": "A suspicious trader who keeps strict accounts.",
    "introduction": "Crowley snaps a battered ledger shut beside a roadside table.",
    "dialogue": [
      "You buy first. Then we can be friends.",
      "Johnny and I disagree on prices, not on counting.",
      "Pay the fee. I'll keep clean books in Seaport."
    ],
    "method": "bolts",
    "options": [
      {
        "id": "bolts",
        "label": "PAY THE STANDARD HIRING FEE TO CROWLEY",
        "bolts": true,
        "response": "Crowley accepts the agreed hiring fee and heads for Seaport."
      }
    ]
  },
  {
    "name": "Mercer",
    "displayName": "Mercer Dane",
    "occupation": "Trader",
    "aptitudes": {
      "medicine": 2,
      "trading": 5,
      "mechanics": 2,
      "banking": 3
    },
    "connection": "Seaport docks; Lantern Highway",
    "personality": "A shrewd trader who knows the difference between need and profit.",
    "introduction": "Mercer studies a caravan's packs before naming a price.",
    "dialogue": [
      "There's a fair price and a road price.",
      "At Seaport, freight is worth more when you know who's waiting.",
      "Pay my usual fee and we'll talk business."
    ],
    "method": "bolts",
    "options": [
      {
        "id": "bolts",
        "label": "PAY THE STANDARD HIRING FEE TO MERCER",
        "bolts": true,
        "response": "Mercer accepts the agreed hiring fee and heads for Seaport."
      }
    ]
  },
  {
    "name": "Finch",
    "displayName": "Finch Rainer",
    "occupation": "Guard",
    "aptitudes": {
      "medicine": 3,
      "trading": 2,
      "mechanics": 2,
      "banking": 5
    },
    "connection": "Northern Ridge; Station Nine",
    "personality": "A reserved guard with a sharp eye for distant movement.",
    "introduction": "Finch watches the skyline from a weathered ridge lookout.",
    "dialogue": [
      "Quiet keeps you breathing.",
      "A watchpost doesn't need a speech. It needs someone awake.",
      "I'll stand watch if Seaport has a place for me."
    ],
    "method": "conversation",
    "options": [
      {
        "id": "conversation",
        "label": "OFFER FINCH A USEFUL ROLE IN SEAPORT",
        "response": "Finch accepts the offer and heads for Seaport."
      }
    ],
    "conditional": {
      "flag": "seaport",
      "before": "Seaport's gates won't be safe until the people inside can choose who's guarding them.",
      "after": "You liberated Seaport. A town that chooses its own guards is worth standing for."
    }
  },
  {
    "name": "Vale",
    "displayName": "Vale Arden",
    "occupation": "Scavenger",
    "aptitudes": {
      "medicine": 2,
      "trading": 3,
      "mechanics": 3,
      "banking": 4
    },
    "connection": "Jen's Rusty Lantern; Dominion",
    "personality": "A guarded traveler whose old map hints at the Dominion's weaknesses.",
    "introduction": "Vale folds a worn map and watches whether anyone noticed.",
    "dialogue": [
      "The Dominion isn't as sure of itself as it pretends.",
      "Some roads have histories that don't belong to me to tell.",
      "I'd rather work where people are free to make their own choices."
    ],
    "method": "bolts",
    "options": [
      {
        "id": "bolts",
        "label": "PAY THE STANDARD HIRING FEE TO VALE",
        "bolts": true,
        "response": "Vale accepts the agreed hiring fee and heads for Seaport."
      }
    ]
  },
  {
    "name": "Bishop",
    "displayName": "Bishop Knox",
    "occupation": "Guard",
    "aptitudes": {
      "medicine": 2,
      "trading": 2,
      "mechanics": 3,
      "banking": 5
    },
    "connection": "Iron Pit; Seaport gates",
    "personality": "A disciplined guard who still follows old patrol habits.",
    "introduction": "Bishop checks the gate line as if waiting for an order.",
    "dialogue": [
      "Hands where I can see them. Nothing personal.",
      "The Iron Pit taught me the cost of a missed watch.",
      "Pay the standard fee and I'll take a gate shift."
    ],
    "method": "bolts",
    "options": [
      {
        "id": "bolts",
        "label": "PAY THE STANDARD HIRING FEE TO BISHOP",
        "bolts": true,
        "response": "Bishop accepts the agreed hiring fee and heads for Seaport."
      }
    ],
    "conditional": {
      "flag": "seaport",
      "before": "An order means nothing if the people giving it don't answer for what it costs.",
      "after": "Seaport is free. I'll follow a watch schedule written by its people."
    }
  },
  {
    "name": "Wren",
    "displayName": "Wren Hartwell",
    "occupation": "Scavenger",
    "aptitudes": {
      "medicine": 3,
      "trading": 3,
      "mechanics": 2,
      "banking": 4
    },
    "connection": "Northern Ridge; Broken Bridge",
    "personality": "An observant scavenger who spots changes before others do.",
    "introduction": "Wren lifts a weathered lookout whistle while studying the far road.",
    "dialogue": [
      "I survived by noticing what others miss.",
      "The broken bridge still tells you where the old traffic went.",
      "Let me put my eyes to work somewhere useful."
    ],
    "method": "conversation",
    "options": [
      {
        "id": "conversation",
        "label": "OFFER WREN A USEFUL ROLE IN SEAPORT",
        "response": "Wren accepts the offer and heads for Seaport."
      }
    ]
  },
  {
    "name": "Cutter",
    "displayName": "Cutter Hale",
    "occupation": "Guard",
    "aptitudes": {
      "medicine": 3,
      "trading": 2,
      "mechanics": 4,
      "banking": 3
    },
    "connection": "Factory; Industrial Corridor",
    "personality": "A hardened guard who survived more fights than wanted.",
    "introduction": "Cutter checks old damage on a scarred shoulder plate.",
    "dialogue": [
      "The road takes the careless first.",
      "The Factory's gates reminded me why people need watchmen.",
      "Pay the ordinary fee; I'll stand between Seaport and trouble."
    ],
    "method": "bolts",
    "options": [
      {
        "id": "bolts",
        "label": "PAY THE STANDARD HIRING FEE TO CUTTER",
        "bolts": true,
        "response": "Cutter accepts the agreed hiring fee and heads for Seaport."
      }
    ],
    "conditional": {
      "flag": "factory",
      "before": "The Factory is no place for someone who mistakes speed for courage.",
      "after": "You lived through the Factory. Maybe your caution is worth something after all."
    }
  }
];
 const expansion=WandererWorldExpansion;
 const originalNames=new Set(wanderers.slice(0,25).map(w=>w.name));
 for(const d of profiles){
   if(!originalNames.has(d.name)||expansion.byName.has(d.name))throw Error('Legacy wanderer profile conflict: '+d.name);
   const w=wandererByName(d.name);
   if(w.occupation!==d.occupation)throw Error('Legacy occupation drift: '+d.name);
   // Keep the established first line; upgrade the brief scene description without changing canonical IDs.
   if(Array.isArray(w.lines)&&w.lines.length>1)w.lines[1]=d.introduction;
   expansion.byName.set(d.name,d);
 }
 globalThis.Route127LegacyProfiles=Object.freeze({profiles:Object.freeze(profiles),byName:Object.freeze(Object.fromEntries(profiles.map(d=>[d.name,d])))});
})();
