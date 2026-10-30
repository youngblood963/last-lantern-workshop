// Owner-approved 25-character world integration. Original roster and rules remain authoritative.
const WANDERER_WORLD_DESIGNS=[
 {
  "name": "Iona Pike",
  "level": 10,
  "occupation": "Medic",
  "aptitudes": {
   "medicine": 5,
   "trading": 2,
   "mechanics": 2,
   "banking": 3
  },
  "method": "materials",
  "connection": "St. Mercy Hospital; Wayne",
  "personality": "meticulous, impatient with waste",
  "introduction": "Iona Pike kneels beside a folded dressing roll, separating clean cloth from road grit. St. Mercy is stitched onto her faded sleeve.",
  "dialogue": [
   "St. Mercy's corridors taught me to count clean dressings before I count patients. I still count twice.",
   "Wayne has a clinic to run. I would rather arrive with usable cloth than another speech about helping.",
   "Two Cloth for fresh dressings, then I will take a place in your Seaport workforce."
  ],
  "options": [
   {
    "id": "supplies",
    "label": "PROVIDE 2 CLOTH",
    "item": "Cloth",
    "qty": 2
   }
  ],
  "conditional": null
 },
 {
  "name": "Cal Voss",
  "level": 10,
  "occupation": "Mechanic",
  "aptitudes": {
   "medicine": 2,
   "trading": 3,
   "mechanics": 5,
   "banking": 2
  },
  "method": "bolts",
  "connection": "Murphy's workshop; Scrap Yard",
  "personality": "dry, methodical",
  "introduction": "Cal Voss turns a battered fastener between grease-dark fingers, comparing it with a sketch of the Scrap Yard.",
  "dialogue": [
   "Murphy keeps a workshop. The Scrap Yard keeps proving why a workshop needs patience.",
   "I mark the bolts I tighten. If something near Murphy's place rattles, I want to know whether it was mine.",
   "My tools travel with me. Pay the usual hiring fee and I will work in Seaport."
  ],
  "options": [
   {
    "id": "bolts",
    "label": "PAY THE ONE TIME HIRING FEE",
    "bolts": true
   }
  ],
  "conditional": null
 },
 {
  "name": "Ada Quill",
  "level": 10,
  "occupation": "Trader",
  "aptitudes": {
   "medicine": 2,
   "trading": 5,
   "mechanics": 2,
   "banking": 5
  },
  "method": "conversation",
  "connection": "Johnny's Trading Post; Seaport General Store",
  "personality": "precise, quietly ambitious",
  "introduction": "Ada Quill balances an empty ledger on her knee. A copied heading reads JOHNNY'S TRADING POST.",
  "dialogue": [
   "Johnny's shelves are worth studying: something useful, a fair count, and room for the next customer.",
   "Seaport needs someone who notices a missing unit before it becomes a missing crate. That is my kind of argument.",
   "Tell me you want honest stock records in Seaport. That is an offer I can accept without Bolts."
  ],
  "options": [
   {
    "id": "conversation",
    "label": "OFFER ADA THE CHANCE TO KEEP HONEST SEAPORT RECORDS",
    "response": "Honest counts and a real place to work. Ada closes the ledger and agrees to join."
   }
  ],
  "conditional": null
 },
 {
  "name": "Merritt Shaw",
  "level": 11,
  "occupation": "Guard",
  "aptitudes": {
   "medicine": 2,
   "trading": 2,
   "mechanics": 3,
   "banking": 4
  },
  "method": "bolts",
  "connection": "Tim; Solace gates",
  "personality": "formal, restrained",
  "introduction": "Merritt Shaw checks the straps of a worn guard coat beneath a charcoal sketch of the Solace gates.",
  "dialogue": [
   "Tim can settle trouble in Solace. On the Lantern Highway, you still have to notice trouble before it reaches you.",
   "I count the approaches to Solace before I count the people at them. A guard should know which way to step aside.",
   "A one-time fee buys my time, not permission to bully your customers in Seaport."
  ],
  "options": [
   {
    "id": "bolts",
    "label": "PAY THE ONE TIME HIRING FEE",
    "bolts": true
   }
  ],
  "conditional": null
 },
 {
  "name": "Sabine Reed",
  "level": 11,
  "occupation": "Cook",
  "aptitudes": {
   "medicine": 3,
   "trading": 4,
   "mechanics": 2,
   "banking": 2
  },
  "method": "favor",
  "connection": "Jen's bar; Seaport",
  "personality": "warm, brisk",
  "introduction": "Sabine Reed leans against a crate, one hand on an empty ration wrapper and the other protecting a bundle of kitchen cloths.",
  "dialogue": [
   "Jen has a bar to keep moving. I like people who can listen while their hands are busy.",
   "In a Seaport kitchen I would count the portions first. Hungry people should not have to win an argument for the last one.",
   "I missed a meal on the Lantern Highway. Spare one Energy Bars ration and I will put my hands to work in Seaport."
  ],
  "options": [
   {
    "id": "supplies",
    "label": "SHARE ONE ENERGY BARS RATION WITH SABINE",
    "item": "Energy Bars",
    "qty": 1
   }
  ],
  "conditional": null
 },
 {
  "name": "Orla Finch",
  "level": 12,
  "occupation": "Medic",
  "aptitudes": {
   "medicine": 5,
   "trading": 3,
   "mechanics": 2,
   "banking": 3
  },
  "method": "conversation",
  "connection": "Wayne's clinic; Seaport liberation",
  "personality": "gentle, determined",
  "introduction": "Orla Finch carries a carefully tied first-aid satchel. A small hand-drawn map marks Wayne's clinic in Solace.",
  "dialogue": [
   "Wayne's clinic reminds me what a town ought to offer: somewhere to stop hurting before you have to bargain again.",
   "I want Seaport's clinic to be a doorway people can walk toward, not another reason to hide a wound.",
   "Offer me a place treating Seaport residents, rather than a place counting trophies. I do not need a hiring purse."
  ],
  "options": [
   {
    "id": "conversation",
    "label": "OFFER ORLA A PLACE TREATING SEAPORT RESIDENTS",
    "response": "A clinic for residents. Orla accepts the work without a Bolt payment."
   }
  ],
  "conditional": null
 },
 {
  "name": "Bex Calder",
  "level": 12,
  "occupation": "Scavenger",
  "aptitudes": {
   "medicine": 2,
   "trading": 3,
   "mechanics": 5,
   "banking": 2
  },
  "method": "materials",
  "connection": "Scrap Yard; Junkyard Hermit",
  "personality": "irreverent, careful",
  "introduction": "Bex Calder spreads a broken tool roll on the shoulder, keeping one eye on the road toward the Scrap Yard.",
  "dialogue": [
   "That junkyard hermit has a fence for a reason. A boundary is not an invitation to start a fight.",
   "I sort Scrap Yard metal by what it can hold together. Shiny belongs at the bottom of that list.",
   "Three Scrap Metal will replace my broken tool loops. After that, I can work in Seaport."
  ],
  "options": [
   {
    "id": "supplies",
    "label": "PROVIDE 3 SCRAP METAL",
    "item": "Scrap Metal",
    "qty": 3
   }
  ],
  "conditional": null
 },
 {
  "name": "Nolan Rusk",
  "level": 12,
  "occupation": "Mechanic",
  "aptitudes": {
   "medicine": 2,
   "trading": 2,
   "mechanics": 5,
   "banking": 3
  },
  "method": "materials",
  "connection": "Factory; Forge",
  "personality": "reserved, exacting",
  "introduction": "Nolan Rusk measures a short, frayed wire against a mark on his glove. Factory dust is ground into the seams.",
  "dialogue": [
   "There is a workshop in the Factory. I would rather be useful at a bench than argue with a locked industrial door.",
   "Forge works with recipes and parts. I work the same way: count what you have before promising what you can build.",
   "Two Wire will get my repair kit working again. Supply them and I will join the Seaport workforce."
  ],
  "options": [
   {
    "id": "supplies",
    "label": "PROVIDE 2 WIRE",
    "item": "Wire",
    "qty": 2
   }
  ],
  "conditional": {
   "flag": "factory",
   "before": "I do not know who holds the Factory basement today. Ask Forge about the machinery before trusting a stranger with a route.",
   "after": "You defeated the Factory Foreman. I would rather bring the habits of a careful technician to Seaport than imitate the orders from that basement."
  }
 },
 {
  "name": "Maeve Kline",
  "level": 13,
  "occupation": "Trader",
  "aptitudes": {
   "medicine": 2,
   "trading": 5,
   "mechanics": 3,
   "banking": 5
  },
  "method": "multiple",
  "connection": "Amii's bank; Seaport bank",
  "personality": "practical, suspicious of fine print",
  "introduction": "Maeve Kline checks a page of tidy sums beside a salvaged bank envelope. SOLACE is written across its flap.",
  "dialogue": [
   "Amii's bank is a better place for stored Bolts than a loose pocket on the Lantern Highway.",
   "If Seaport wants a banker, I can count. If it wants a person who calls every subtraction a service, it can keep looking.",
   "Pay my usual fee, or bring two Wire so I can repair the clasp on my records case. Either gets me to Seaport."
  ],
  "options": [
   {
    "id": "bolts",
    "label": "PAY THE ONE TIME HIRING FEE",
    "bolts": true
   },
   {
    "id": "supplies",
    "label": "REPAIR MAEVES RECORDS CASE WITH TWO WIRE",
    "item": "Wire",
    "qty": 2
   }
  ],
  "conditional": null
 },
 {
  "name": "Galen Ward",
  "level": 13,
  "occupation": "Guard",
  "aptitudes": {
   "medicine": 3,
   "trading": 2,
   "mechanics": 3,
   "banking": 4
  },
  "method": "conversation",
  "connection": "Boulder Junction; Lantern Highway",
  "personality": "patient, protective",
  "introduction": "Galen Ward studies both approaches to Boulder Junction from a safe stretch of shoulder, drawing routes in the dust.",
  "dialogue": [
   "Boulder Junction is a place to think before moving. A route on a map does not mean the road is open.",
   "On the Lantern Highway I watch the person at the back of a group. That is usually the person everyone else forgets.",
   "Tell me your Seaport workforce is there to keep people supplied, not to collect another toll. I will join for that."
  ],
  "options": [
   {
    "id": "conversation",
    "label": "PROMISE GALEN USEFUL WORK RATHER THAN ANOTHER TOLL POST",
    "response": "Work that keeps Seaport supplied. Galen offers a steady nod and agrees to join."
   }
  ],
  "conditional": null
 },
 {
  "name": "Cora Bell",
  "level": 14,
  "occupation": "Cook",
  "aptitudes": {
   "medicine": 3,
   "trading": 5,
   "mechanics": 2,
   "banking": 3
  },
  "method": "materials",
  "connection": "Martha's steel orchard; Seaport",
  "personality": "mischievous, frugal",
  "introduction": "Cora Bell wraps a dented cooking pot in a rag. A sketch of Martha's metal trees is tucked beneath its handle.",
  "dialogue": [
   "Martha hangs keepsakes in that steel orchard. I like a person who can look at scrap and still see something worth keeping.",
   "My Seaport workbench would have one rule: wipe the pot before you wipe your boots with the same cloth.",
   "Two Cloth for clean kitchen wraps, and I am ready to join Seaport."
  ],
  "options": [
   {
    "id": "supplies",
    "label": "PROVIDE 2 CLOTH",
    "item": "Cloth",
    "qty": 2
   }
  ],
  "conditional": null
 },
 {
  "name": "Dorian Hale",
  "level": 14,
  "occupation": "Mechanic",
  "aptitudes": {
   "medicine": 2,
   "trading": 3,
   "mechanics": 5,
   "banking": 4
  },
  "method": "materials",
  "connection": "Station Nine; Tomorrow Network",
  "personality": "absorbed, earnest",
  "introduction": "Dorian Hale shields a damaged circuit from the wind. STATION NINE is written in pencil on a page of signal notes.",
  "dialogue": [
   "Station Nine is a place worth keeping on a map. A working voice can connect people a road cannot reach today.",
   "I write Tomorrow Network at the top of my repair notes to remind myself that a circuit ought to do something useful for someone.",
   "One Electronics component will repair my tester. Bring it and I will work in Seaport."
  ],
  "options": [
   {
    "id": "supplies",
    "label": "PROVIDE 1 ELECTRONICS",
    "item": "Electronics",
    "qty": 1
   }
  ],
  "conditional": {
   "flag": "station",
   "before": "I will not call Station Nine restored on the strength of a rumor. A transmitter has to work.",
   "after": "You restored Station Nine. The Tomorrow Network has a working voice there now; that is work worth respecting."
  }
 },
 {
  "name": "Petra Sol",
  "level": 14,
  "occupation": "Scavenger",
  "aptitudes": {
   "medicine": 3,
   "trading": 3,
   "mechanics": 4,
   "banking": 2
  },
  "method": "favor",
  "connection": "Crazy Steve; Lantern Highway",
  "personality": "wry, unusually patient",
  "introduction": "Petra Sol braces a pack against a milepost, trying to settle a twisted shoulder strap without spilling its salvage.",
  "dialogue": [
   "Crazy Steve makes me check what I think I saw on the Lantern Highway. Then I check the ground under my feet again.",
   "If Steve's pink elephants turn up in a story, I listen before laughing. The road has made fools of louder people than me.",
   "Hold this pack steady while I untwist the strap. A little help is enough reason to take your Seaport offer."
  ],
  "options": [
   {
    "id": "conversation",
    "label": "BRACE PETRAS PACK WHILE SHE FIXES THE STRAP",
    "response": "You brace the pack while Petra straightens the strap. She agrees to bring her salvage skills to Seaport."
   }
  ],
  "conditional": null
 },
 {
  "name": "Soren Beck",
  "level": 15,
  "occupation": "Guard",
  "aptitudes": {
   "medicine": 2,
   "trading": 2,
   "mechanics": 4,
   "banking": 4
  },
  "method": "bolts",
  "connection": "New Dominion; Solace",
  "personality": "blunt, disciplined",
  "introduction": "Soren Beck keeps an unmarked guard coat folded over one arm and watches the Lantern Highway without turning his head.",
  "dialogue": [
   "The New Dominion has enough people mistaking orders for reasons. I would rather hear what a job actually needs.",
   "Tim has a name in Solace. If I take your Seaport job, I want people to know my name before they know my weapon.",
   "I charge the normal one-time hiring fee. No other promise is hiding in the price."
  ],
  "options": [
   {
    "id": "bolts",
    "label": "PAY THE ONE TIME HIRING FEE",
    "bolts": true
   }
  ],
  "conditional": null
 },
 {
  "name": "Leda Marsh",
  "level": 15,
  "occupation": "Medic",
  "aptitudes": {
   "medicine": 5,
   "trading": 3,
   "mechanics": 2,
   "banking": 4
  },
  "method": "multiple",
  "connection": "St. Mercy Hospital; Seaport clinic",
  "personality": "soft-spoken, unyielding",
  "introduction": "Leda Marsh closes a medical bag with a length of cloth. A faded St. Mercy patch is sewn carefully over a tear.",
  "dialogue": [
   "St. Mercy Hospital is more than a name on a ruined wall. Supplies left in a hospital ought to reach people who need them.",
   "At a Seaport clinic I would rather explain a bandage than explain why I left someone untreated.",
   "Pay the normal fee, or supply two Bandage for my bag. I can make either arrangement work."
  ],
  "options": [
   {
    "id": "bolts",
    "label": "PAY THE ONE TIME HIRING FEE",
    "bolts": true
   },
   {
    "id": "supplies",
    "label": "STOCK LEDAS BAG WITH TWO BANDAGE",
    "item": "Bandage",
    "qty": 2
   }
  ],
  "conditional": {
   "flag": "hospital",
   "before": "I do not know whether the St. Mercy entrance is secure. Do not mistake my old patch for current information.",
   "after": "You secured the St. Mercy entrance. Getting people through a door safely matters as much as what is behind it."
  }
 },
 {
  "name": "Ansel Crow",
  "level": 16,
  "occupation": "Trader",
  "aptitudes": {
   "medicine": 2,
   "trading": 5,
   "mechanics": 3,
   "banking": 5
  },
  "method": "bolts",
  "connection": "Seaport docks; Nessa",
  "personality": "polished, observant",
  "introduction": "Ansel Crow checks a cargo tally, pausing to rescue its corner from the wind blowing inland from Seaport.",
  "dialogue": [
   "Nessa sells pets in Seaport. I look at a pack rat and immediately start wondering how much it can carry without a complaint.",
   "The Seaport docks taught me to count the crate before I admire the label. I do the same with a job offer.",
   "The usual one-time fee settles my hiring. I bring the tally book; you provide a place to use it."
  ],
  "options": [
   {
    "id": "bolts",
    "label": "PAY THE ONE TIME HIRING FEE",
    "bolts": true
   }
  ],
  "conditional": null
 },
 {
  "name": "Freya Dunn",
  "level": 16,
  "occupation": "Mechanic",
  "aptitudes": {
   "medicine": 3,
   "trading": 3,
   "mechanics": 5,
   "banking": 2
  },
  "method": "conversation",
  "connection": "Murphy's Corvette; Solace workshop",
  "personality": "affectionately sarcastic",
  "introduction": "Freya Dunn cleans a small wrench with a strip of cloth, studying a rough drawing marked MURPHYS WORKSHOP.",
  "dialogue": [
   "Murphy's workshop is the kind of place I stop to look at the tools before I remember to say hello.",
   "Tell me a part cannot be saved and I will ask whether that is a diagnosis or just what the Solace dust made you say.",
   "Offer me a real repair bench in Seaport. I would rather have useful work than a hiring purse."
  ],
  "options": [
   {
    "id": "conversation",
    "label": "OFFER FREYA A REPAIR BENCH FOR SEAPORTS WORKFORCE",
    "response": "A real bench and useful repairs. Freya agrees to join without charging Bolts."
   }
  ],
  "conditional": {
   "flag": "corvette",
   "before": "I will ask Murphy how his work is going when I reach Solace. I will not pretend I know what is on his bench today.",
   "after": "You finished the Corvette with Murphy. Now that is a repair worth bringing up the next time someone calls a part hopeless."
  }
 },
 {
  "name": "Otis Weller",
  "level": 16,
  "occupation": "Scavenger",
  "aptitudes": {
   "medicine": 4,
   "trading": 2,
   "mechanics": 4,
   "banking": 2
  },
  "method": "favor",
  "connection": "Southern Lowlands; Water Moccasins",
  "personality": "laconic, considerate",
  "introduction": "Otis Weller sits on a dry piece of concrete, holding a scratched hand well above the muddy shoulder.",
  "dialogue": [
   "Water Moccasins in the lowlands are a good reason to watch where you reach. Mud does not tell you what is underneath it.",
   "When I sort lowlands salvage, I put the sharp pieces where the next person can see them. It is not complicated kindness.",
   "One Bandage will get this hand covered. Help me with that and I will join your Seaport workers."
  ],
  "options": [
   {
    "id": "supplies",
    "label": "DRESS OTIS HAND WITH ONE BANDAGE",
    "item": "Bandage",
    "qty": 1
   }
  ],
  "conditional": null
 },
 {
  "name": "Veda Knox",
  "level": 17,
  "occupation": "Trader",
  "aptitudes": {
   "medicine": 2,
   "trading": 5,
   "mechanics": 4,
   "banking": 4
  },
  "method": "materials",
  "connection": "Scavenger Camp; Johnny",
  "personality": "direct, cheerful about numbers",
  "introduction": "Veda Knox unfolds a battered stock board. A simple route drawing links Scavenger Camp with Solace.",
  "dialogue": [
   "Scavenger Camp is a place to compare what people carry. Johnny's Trading Post is a place to compare what they will part with.",
   "I keep a Seaport stock list with room for corrections. Anyone claiming their first count is always right should do the second count.",
   "Two Scrap Metal will rebuild this stock-board hinge. Supply them and I will take a Seaport assignment."
  ],
  "options": [
   {
    "id": "supplies",
    "label": "PROVIDE 2 SCRAP METAL",
    "item": "Scrap Metal",
    "qty": 2
   }
  ],
  "conditional": null
 },
 {
  "name": "Silvie Hart",
  "level": 17,
  "occupation": "Medic",
  "aptitudes": {
   "medicine": 5,
   "trading": 3,
   "mechanics": 2,
   "banking": 3
  },
  "method": "conversation",
  "connection": "Wayne; Jen's Rusty Lantern",
  "personality": "calm, perceptive",
  "introduction": "Silvie Hart checks a clean needle case while resting beside a hand-lettered sign pointing toward Solace.",
  "dialogue": [
   "Wayne has the clinic and Jen has the Rusty Lantern. Between a clean dressing and someone who listens, Solace has the right idea.",
   "In Seaport I would like to ask where it hurts before I ask how the person managed to hurt it.",
   "Offer me work where Seaport residents can come for help without a lecture. I will join for that."
  ],
  "options": [
   {
    "id": "conversation",
    "label": "OFFER SILVIE A CLINIC THAT LISTENS BEFORE IT LECTURES",
    "response": "Silvie closes the needle case. A place to help Seaport residents is enough; she agrees to join."
   }
  ],
  "conditional": null
 },
 {
  "name": "Tobin Flint",
  "level": 18,
  "occupation": "Guard",
  "aptitudes": {
   "medicine": 3,
   "trading": 2,
   "mechanics": 4,
   "banking": 4
  },
  "method": "multiple",
  "connection": "Dockside Pirates; Seaport",
  "personality": "skeptical, steadfast",
  "introduction": "Tobin Flint stands beside a coiled mooring line, checking a torn sleeve against the light from the coast.",
  "dialogue": [
   "Dockside Pirates do not become harmless because they can talk about a fair share. Keep your own count near Seaport.",
   "I would rather stand at a Seaport doorway than make another traveler nervous on the Lantern Highway.",
   "Pay the usual hiring fee, or give me two Cloth to mend this coat. I will take either arrangement."
  ],
  "options": [
   {
    "id": "bolts",
    "label": "PAY THE ONE TIME HIRING FEE",
    "bolts": true
   },
   {
    "id": "supplies",
    "label": "MEND TOBINS COAT WITH TWO CLOTH",
    "item": "Cloth",
    "qty": 2
   }
  ],
  "conditional": null
 },
 {
  "name": "Elara Moss",
  "level": 18,
  "occupation": "Cook",
  "aptitudes": {
   "medicine": 4,
   "trading": 5,
   "mechanics": 2,
   "banking": 3
  },
  "method": "conversation",
  "connection": "Jen's bar; Seaport Rusty Anchor",
  "personality": "playful, determined",
  "introduction": "Elara Moss taps a spoon against a folded recipe sheet, looking between the Solace and Seaport directions on her map.",
  "dialogue": [
   "Jen's bar and the Rusty Anchor give people a reason to sit down. I want my cooking to give them a reason to stay a little longer.",
   "If a Seaport customer asks what is in the pot, I intend to answer with ingredients, not a heroic story about the road.",
   "Promise me useful work feeding Seaport, and you can keep the hiring Bolts."
  ],
  "options": [
   {
    "id": "conversation",
    "label": "OFFER ELARA WORK FEEDING SEAPORT RATHER THAN A HIRING PURSE",
    "response": "A place to feed people. Elara puts away the spoon and accepts the Seaport offer."
   }
  ],
  "conditional": null
 },
 {
  "name": "Hector Vale",
  "level": 19,
  "occupation": "Mechanic",
  "aptitudes": {
   "medicine": 2,
   "trading": 3,
   "mechanics": 5,
   "banking": 4
  },
  "method": "bolts",
  "connection": "Fuel Thieves; Industrial Corridor",
  "personality": "stern, painstaking",
  "introduction": "Hector Vale kneels beside a capped fuel bottle, inspecting its seal before putting it away in a reinforced tool bag.",
  "dialogue": [
   "Fuel Thieves in the Industrial Corridor make me check a cap twice. The first check finds a leak; the second reminds me to keep watching.",
   "A Seaport workshop should smell like work, not like someone forgot to close the fuel container.",
   "Pay the standard one-time fee and I will bring my tools to Seaport."
  ],
  "options": [
   {
    "id": "bolts",
    "label": "PAY THE ONE TIME HIRING FEE",
    "bolts": true
   }
  ],
  "conditional": null
 },
 {
  "name": "Nadia Rill",
  "level": 19,
  "occupation": "Scavenger",
  "aptitudes": {
   "medicine": 3,
   "trading": 4,
   "mechanics": 5,
   "banking": 3
  },
  "method": "multiple",
  "connection": "Station Nine; Evelyn Cross",
  "personality": "curious, patient with machinery",
  "introduction": "Nadia Rill listens to a silent radio, then makes a neat mark beside STATION NINE in a pocket notebook.",
  "dialogue": [
   "Evelyn Cross has a tower to care about at Station Nine. I respect a person who gives a broken thing a purpose before asking for its parts.",
   "I can pick useful pieces out of a Seaport salvage pile. I would rather those pieces carry a voice than become another trophy.",
   "Pay the usual fee, or show me that Station Nine is restored. A working signal would be enough reason to join."
  ],
  "options": [
   {
    "id": "bolts",
    "label": "PAY THE ONE TIME HIRING FEE",
    "bolts": true
   },
   {
    "id": "signal",
    "label": "DISCUSS THE RESTORED STATION NINE SIGNAL",
    "requires": "station",
    "response": "Station Nine is restored. Nadia agrees to work in Seaport without a Bolt payment."
   }
  ],
  "conditional": {
   "flag": "station",
   "before": "The Station Nine receiver is quiet from here. I need more than a rumor before I call a signal restored.",
   "after": "You restored Station Nine. There is a Tomorrow Network link worth keeping in working order."
  }
 },
 {
  "name": "Rhea Tarrant",
  "level": 20,
  "occupation": "Guard",
  "aptitudes": {
   "medicine": 3,
   "trading": 3,
   "mechanics": 4,
   "banking": 5
  },
  "method": "favor",
  "connection": "Lantern Highway; Seaport liberation",
  "personality": "quiet, watchful, generous with time",
  "introduction": "Rhea Tarrant stands facing the Lantern Highway while retightening a loose strap on a heavy travel pack.",
  "dialogue": [
   "On the Lantern Highway, helping someone does not always mean drawing a weapon. Sometimes it means keeping an eye on the road while their hands are busy.",
   "Seaport needs people who can finish a task without making every other person feel watched. A guard can learn that too.",
   "Watch the approach while I secure this pack. Do that small kindness and I will join your Seaport workforce."
  ],
  "options": [
   {
    "id": "conversation",
    "label": "WATCH THE LANTERN HIGHWAY WHILE RHEA SECURES HER PACK",
    "response": "You watch the road while Rhea secures her pack. She thanks you and agrees to join Seaport."
   }
  ],
  "conditional": {
   "flag": "seaport",
   "before": "I will make my own judgment about Seaport when its residents can speak freely.",
   "after": "Seaport is liberated. You have given its residents room to build something; I can help with that."
  }
 }
];
const WandererWorldExpansion={
 byName:new Map(WANDERER_WORLD_DESIGNS.map(d=>[d.name,d])),
 definition(w){return this.byName.get(typeof w==='string'?w:w?.name);},
 condition(key){const f=player.flags;return key==='station'?f.r18Station?.restored===true:key==='hospital'?f.wo4Hospital?.cleared===true:key==='corvette'?f.wo3Corvette?.complete===true:key==='seaport'?f.seaport55?.freed===true:key==='factory'?f.factoryDungeon?.done?.includes(3)===true:false;},
 option(w,offer=player.flags.portHireOffer){return offer?.name===w.name?this.definition(w)?.options.find(o=>o.id===offer.worldOption):null;},
 count(name){return player.pack.filter(i=>i.name===name&&i.qty>0&& !['quest','key'].includes(i.type)).reduce((n,i)=>n+i.qty,0);},
 available(o){return !o.requires||this.condition(o.requires);},
 terms(w,o){return o.bolts?(60+10*v50Profile(w).level)+' Bolts once':o.item?o.qty+' '+o.item:'No Bolts or supplies';},
 consume(o){if(!o.item)return;let left=o.qty;for(const i of [...player.pack]){if(i.name!==o.item||['quest','key'].includes(i.type))continue;const n=Math.min(left,i.qty);i.qty-=n;left-=n;if(!i.qty)player.pack.splice(player.pack.indexOf(i),1);if(!left)break;}},
 install(){
  if(this.installed||!RoadScenarioRegistry.ready)return;this.installed=true;
  for(const d of WANDERER_WORLD_DESIGNS){
   if(wandererByName(d.name))throw Error('Duplicate world wanderer '+d.name);
   const w={name:d.name,level:d.level,definitionLevel:d.level,occupation:d.occupation,vibe:d.personality,lines:[d.introduction,d.dialogue[0]]};
   wanderers.push(w);wandererLocations[w.name]='road';
   RoadScenarioRegistry.wanderers.push({id:'wanderer:'+w.name,name:w.name,region:'GLOBAL',category:'wanderer',npc:w});
  }
  const expansion=this,oldAptitudes=portAptitudes;
  portAptitudes=function(w){const d=expansion.definition(w);if(!d)return oldAptitudes(w);return ws(w.name).seaportAptitudes||(ws(w.name).seaportAptitudes={...d.aptitudes});};
  const oldDialogue=wandererDialogue;
  wandererDialogue=function(w){const d=expansion.definition(w);if(!d)return oldDialogue(w);const state=ws(w.name),lines=[...d.dialogue];if(d.conditional)lines.push(expansion.condition(d.conditional.flag)?d.conditional.after:d.conditional.before);let at=Math.floor(Math.random()*lines.length);if(lines[at]===state.lastLine)at=(at+1)%lines.length;state.lastLine=lines[at];state.talks++;return w.name.toUpperCase()+' > '+state.lastLine;};
  const oldCost=portHireCost;
  portHireCost=function(w){const o=expansion.option(w);return o&&!o.bolts?0:oldCost(w);};
  const oldMenu=portHireMenu;
  portHireMenu=function(){const offer=player.flags.portHireOffer,w=offer&&wandererByName(offer.name),d=expansion.definition(w);if(!d)return oldMenu();add(w.name.toUpperCase()+' > '+d.dialogue[2],'bright');const option=expansion.option(w);if(option){add(expansion.terms(w,option),'system');portStaffChoices('CONFIRM ARRANGEMENT',['CONFIRM HIRE','CANCEL HIRE']);}else portStaffChoices('RECRUIT '+w.name.toUpperCase(),[...d.options.filter(o=>expansion.available(o)).map(o=>o.label),'CANCEL HIRE']);};
  const oldCommand=portRecruitCommand;
  portRecruitCommand=function(cmd){
   const offer=player.flags.portHireOffer,w=offer&&wandererByName(offer.name),d=expansion.definition(w);
   if(stage!=='port55Recruit'||!d)return oldCommand(cmd);
   const selected=d.options.find(o=>o.label.toLowerCase()===cmd&&expansion.available(o));
   if(selected){offer.worldOption=selected.id;portHireMenu();v49Autosave();return true;}
   if(cmd!=='confirm hire')return oldCommand(cmd);
   const option=expansion.option(w);if(!option){portHireMenu();return true;}
   const present=offer.origin==='wandererRoad'?currentRoadWanderer===w.name:currentTownWanderer===w.name;
   if(!portRecruitUnlocked()||!present||!portRecruitEligible(w)||!expansion.available(option))return oldCommand('cancel hire');
   if(option.item&&expansion.count(option.item)<option.qty){add('You need '+option.qty+' '+option.item+'. Nothing was taken.','system');portHireMenu();return true;}
   if(option.bolts&&player.bolts<oldCost(w)){add('Insufficient Bolts. Nothing was taken.','system');portHireMenu();return true;}
   // All prerequisites are rechecked before a single synchronous transaction.
   // Original confirmation commits the existing hired/location/save lifecycle.
   const pack=player.pack.map(i=>({...i})),wallet=player.bolts;
   expansion.consume(option);
   const receipts=player.flags.worldWandererRecruitment||(player.flags.worldWandererRecruitment={});
   receipts[w.name]={option:option.id,bolts:option.bolts?oldCost(w):0,...(option.item?{item:option.item,qty:option.qty}:{}),method:d.method};
   const result=oldCommand(cmd);
   if(!portIsHired(w.name)){player.pack=pack;player.bolts=wallet;delete receipts[w.name];v49Autosave();return result;}
   add(option.response||w.name+' accepts the agreed supplies and joins the Seaport workforce.','reward');return result;
  };
  const render=renderCurrentChoices;renderCurrentChoices=function(){if(stage==='port55Recruit'&&expansion.definition(player.flags.portHireOffer?.name))return portHireMenu();return render();};
  const load=loadGame;loadGame=function(slot){const result=load(slot);if(stage==='port55Recruit'&&expansion.definition(player.flags.portHireOffer?.name))portHireMenu();return result;};
 }
};
WandererWorldExpansion.install();
