/* Devtest-only portrait-matched bios; descriptions do not alter dialogue or gameplay. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname))return;
const bios=Object.freeze({
  "Iona Pike": "A red-haired field medic in a weathered teal jacket and scarf, Iona keeps her medical supplies close and her attention on every injury. Her work traces back to St. Mercy Hospital and Wayne's clinic.",
  "Cal Voss": "Cal's worn road gear and mechanic's kit belong to someone who measures repairs instead of guessing. The Scrap Yard and Murphy's workshop are familiar territory to this methodical fixer.",
  "Ada Quill": "A young Black boy with a trader's sharp eye, Ada is determined to be taken seriously despite his age. He studies Johnny's Trading Post and keeps careful records for the Seaport General Store he hopes to help run.",
  "Merritt Shaw": "An older, free-spirited woman with a lifetime of guard experience, Merritt looks nothing like a rigid uniformed soldier. Her easygoing appearance hides the instincts of someone who knows how to watch Solace's approaches.",
  "Sabine Reed": "Broad-shouldered and unmistakably ex-military, Sabine looks more like a front-line fighter than a cook. He brings that same discipline to keeping portions fair and hungry people fed at Jen's bar and in Seaport.",
  "Orla Finch": "A red-haired medic in a teal jacket and purple scarf, Orla wears the road's grime without losing her gentleness. Her first-aid work is inspired by Wayne's clinic and the people Seaport still needs to care for.",
  "Bex Calder": "With long locs and vividly patched purple-red clothing, Bex stands out from the road's drab scavengers. Her irreverent grin doesn't stop her from handling Scrap Yard salvage with care.",
  "Nolan Rusk": "A stocky, tattooed biker with a battered motorcycle helmet under his arm, Nolan looks rougher than the exacting technician he is. Factory machinery and Forge's workbench keep him thinking about what can still be repaired.",
  "Maeve Kline": "Blonde, bold, and dressed with an almost defiant sense of style, Maeve doesn't look like a conventional banker. She's still the person who reads the fine print and counts every Bolt before trusting an offer.",
  "Galen Ward": "Gray-haired and solidly built, Galen stands with his arms crossed and the patient watchfulness of an experienced guard. At Boulder Junction he studies both routes before deciding which traveler needs help.",
  "Cora Bell": "A brunette with a mischievous expression and an old lantern in hand, Cora brings a little light to the road. She takes the same resourceful attitude into cooking and salvaging useful scraps around Martha's steel orchard.",
  "Dorian Hale": "Bald and marked by an eyepatch, Dorian has the hard-bitten look of a survivor, but his attention stays on circuitry and signal notes. Station Nine and the Tomorrow Network give his mechanical work a purpose.",
  "Petra Sol": "A dark-haired scavenger in layered, practical road gear with a red scarf, Petra carries herself with wry patience. Crazy Steve's stories have taught her to double-check both the road and her own assumptions.",
  "Soren Beck": "Soren's most striking feature is an improvised mechanical arm, assembled for survival rather than show. He approaches guard duty with blunt discipline and little patience for the New Dominion's empty orders.",
  "Leda Marsh": "A young East Asian girl traveling with a medic's determination, Leda is easy to underestimate. Her carefully maintained medical kit and St. Mercy connection speak to how seriously she takes treating other people.",
  "Ansel Crow": "A large, beer-bellied dockside trader with a backward cap, scruffy beard, cigarette and bottle, Ansel hardly looks like a polished accountant. Yet he notices every missing crate and knows exactly what a shipment is worth.",
  "Freya Dunn": "A gray-streaked mechanic in a red bandana and stained work clothes, Freya carries a scarred red toolbox and the confidence of someone who has repaired the impossible. Murphy's workshop is her kind of place.",
  "Otis Weller": "An elderly, thin Black scavenger with a white beard and patched mustard cardigan, Otis leans on a walking stick and keeps his injured hand bandaged. His quiet kindness has served him well in the muddy Southern Lowlands.",
  "Veda Knox": "A cheerful older trader with wild gray curls, glasses, a floral dress and an overstuffed satchel, Veda is rarely without her clipboard. Behind that warm smile is someone who notices every inventory mistake.",
  "Silvie Hart": "A short-statured medic with dwarfism, Silvie wears worn blue scrubs and carries a well-stocked medical bag and small treatment case. Her reassuring manner matters as much to patients as her five-star medical knowledge.",
  "Tobin Flint": "A skinny, freckled teenage dock guard in an oversized navy coat, Tobin carries a coil of rope and a shield made from an old ship's hatch. He may look young, but he takes protecting Seaport seriously.",
  "Elara Moss": "A cheerful, heavyset cook with curly hair under a yellow scarf, Elara carries a battered cooking pot and wooden spoon. Her stained apron is proof she prefers feeding people to giving speeches about it.",
  "Hector Vale": "An elderly Latino mechanic with silver hair, a mustache and reading glasses, Hector scrutinizes a red fuel can while carrying his heavy tool bag. Every cap and seal gets checked twice in the Industrial Corridor.",
  "Nadia Rill": "A lanky young woman in a bright yellow raincoat and purple hoodie, Nadia listens for life in an old portable radio. A notebook and bag of salvaged electronics keep her search for Station Nine's signal moving.",
  "Rhea Tarrant": "An older Indigenous woman with long silver-gray hair, a burgundy jacket, a walking staff and a heavy travel pack, Rhea watches the Lantern Highway with quiet confidence. She knows guarding people can mean simply standing by them."
});
globalThis.Route127VisualBios=bios;
})();
