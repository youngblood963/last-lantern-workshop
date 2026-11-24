const assert=require('node:assert/strict');
const create=require('./helpers/menu_audit.cjs');
(async()=>{
 const {run,flush,walk,ctx}=create();await flush();await run('outputQueue');
 const settle=async()=>{await flush();await run('outputQueue');await flush();};
 run(`resetPlayer();player.flags.interfaceUnlocked=true;player.flags.mercyDiscovered=true;
 player.hp=50;player.maxHp=100;player.turns=120;lanternMigrate();stage='mercy';
 GraphicalUI.active=()=>true;GraphicalUI.preferred='graphics';`);
 const entries=run('Route127ItemArtwork.entries');assert(entries.length>0,'No item artwork registered');
 assert.equal(new Set(entries.map(e=>e.id)).size,entries.length,'Duplicate artwork identity');
 assert.equal(new Set(entries.map(e=>e.file)).size,entries.length,'Each design has its own file');
 for(const entry of entries){
  assert.equal(run('Route127ItemArtwork.lookup({name:'+JSON.stringify(entry.name)+',qty:1}).id'),entry.id);
  for(const level of [1,10,50]){
   const def=run('EQUIPMENT_CATALOG.find(d=>d.id==='+JSON.stringify(entry.id)+')');
   if(!def)continue;
   const url=run('Route127ItemArtwork.lookup({name:catalogInstanceName(EQUIPMENT_CATALOG.find(d=>d.id==='+JSON.stringify(entry.id)+'),'+level+'),qty:1}).url');
   assert(url.endsWith('/assets/items/'+entry.file),entry.id+' level '+level);
  }
 }
 // Exercise the real modification API on legacy named gear, which does not
 // have a catalog ID. Its existing modification record owns the base identity.
 run('globalThis.artModifiedName=EquipmentMods.createModified("Rusted Pipe","precision")');
 assert.equal(run('Route127ItemArtwork.lookup({name:artModifiedName,qty:1}).id'),'weapon-common-rusted-pipe');
 run('player.pack=Route127ItemArtwork.entries.slice(0,3).map(e=>({name:e.name,type:EQUIPMENT_CATALOG.find(d=>d.id===e.id).type,qty:1}));TravelerPanels.open("inventory")');await settle();
 const body=()=>run('TravelerPanels.body');
 assert(!walk(body()).some(n=>n.classList?.contains('r127-item-portrait')),'Initial backpack stays visible');
 const before=run('JSON.stringify({pack:player.pack,turns:player.turns,weapon:player.weapon,armor:player.armor,bolts:player.bolts})');
 for(let i=0;i<run('player.pack.length');i++){
  await run('TravelerPanels.select(player.pack['+i+'])');await settle();
  const portrait=walk(body()).find(n=>n.classList?.contains('r127-item-portrait'));
  assert(portrait,'Missing selected portrait');assert.equal(portrait.querySelector('img').alt,run('player.pack['+i+'].name'));
 }
 assert.equal(run('JSON.stringify({pack:player.pack,turns:player.turns,weapon:player.weapon,armor:player.armor,bolts:player.bolts})'),before,'Artwork selection must not mutate gameplay');
 const portrait=walk(body()).find(n=>n.classList?.contains('r127-item-portrait')),img=portrait.querySelector('img');
 for(const fn of img.events.error||[])fn({target:img});
 assert(!portrait.classList.contains('r127-item-portrait'),'Broken image restores backpack');
 assert.equal(portrait.getAttribute('aria-label'),'Weathered traveler backpack');
 run('player.pack.push({name:"Unknown future item",type:"quest",qty:1})');
 await run('TravelerPanels.select(player.pack.at(-1))');await settle();
 assert(!walk(body()).some(n=>n.classList?.contains('r127-item-portrait')),'Unmapped item preserves existing backpack');
 run('TravelerPanels.selected=null;TravelerPanels.render()');await settle();
 assert.equal(run('Route127ItemArtwork.lookup({name:Route127ItemArtwork.entries[0].name,qty:0})'),null);
 run('TravelerPanels.close()');assert.equal(run('stage'),'mercy');
 // Artwork must leave the existing Use pipeline and stack depletion intact.
 run('player.pack=[{name:"Bandage",type:"consumable",qty:1}];player.hp=50;player.maxHp=100;TravelerPanels.open("inventory")');await settle();
 await run('TravelerPanels.select(player.pack[0])');await settle();await run('TravelerPanels.action("u")');await settle();
 assert.equal(run('player.hp'),75);assert.equal(run('hasItem("Bandage")'),false);
 assert(!walk(body()).some(n=>n.classList?.contains('r127-item-portrait')),'Consumed last item clears portrait');
 run('TravelerPanels.close()');
 console.log('PASS: '+entries.length+' portraits; stable catalog IDs at levels 1/10/50; actual Backpack selection swaps correct art; no gameplay mutation; image-error, unmapped/empty selection fallback and panel close restore');
})().catch(e=>{console.error(e);process.exitCode=1});
