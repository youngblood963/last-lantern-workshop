/* Route 127 / DEVTEST: Factory menu consolidation.
 * Keeps the current four-boss playthrough completable without new random parts.
 * No map edge changes, quest reset, re-rolls, backend changes or recipe edits.
 */
(()=>{'use strict';
if(!/\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname))return;
if(typeof v49Forge!=='function'||typeof r11CraftMenu!=='function')return;
const atFactory=()=>{const g=typeof lanternState==='function'?lanternState():null;
 return !!g&&g.nodeId==='factory'&&!g.currentEdgeId;};
const allBosses=()=>[0,1,2,3].every(n=>player.flags.factoryDungeon?.done?.includes(n));
const partsComplete=()=>!player.flags.factoryPartsEnabled||
 (player.flags.factoryDynamiteParts?.caps&&player.flags.factoryDynamiteParts?.compound&&player.flags.factoryDynamiteParts?.detonator);
const ready=()=>allBosses()&&partsComplete()&&!player.flags.portChargePrepared&&!player.flags.portRoadCleared;
let craftCategory=null,craftKey=null;
// The workshop is the ONLY place to access the workbench and terminal.
// Keep Rusty's independently installed shop action intact.
const previousWorkshop=v49FactoryRoom;
v49FactoryRoom=function(...args){
 const result=previousWorkshop.apply(this,args);
 if(stage==='factoryWorkshop'){
  numberedChoices={};currentHotkeys={};
  r5DirectChoices(['TOMORROW PROJECT TERMINAL','TALK TO FORGE','WORKBENCH',
   'RUSTY','ENTER INNER FACTORY','EXIT FACTORY']);
 }
 return result;
};
// Prevent legacy Forge action strip from creating duplicate craft/terminal options.
const previousAdd=add;
add=function(value='',cls=''){
 if(stage==='factoryForge'&&/\(W\) USE WORKBENCH\s+\(T\) TERMINAL\s+\(B\) BACK/.test(String(value)))return;
 return previousAdd.apply(this,arguments);
};
// Don't silently craft a charge upon merely talking: expose a deliberate action.
const previousForge=v49Forge;
v49Forge=function(...args){
 const fn=portForgeDialogue;
 portForgeDialogue=function(){};
 try{previousForge.apply(this,args);}
 finally{portForgeDialogue=fn;}
 numberedChoices={};currentHotkeys={};
 if(ready()){
  add('FORGE > You have everything. Hand me the equipment, and I\'ll prepare the charge.','bright');
  r5DirectChoices(['PREPARE DYNAMITE','BACK']);
 }else r5DirectChoices(['BACK']);
};
// Replace two overlapping exit/crossroads menu layers with the existing graph.
// The real Factory node owns movement and turn costs.
const priorCore=handleCommandCore;
handleCommandCore=async function(raw){
 const cmd=String(typeof r5Mapped==='function'?r5Mapped(raw):raw).toLowerCase().trim();
 if(!busy&&stage==='factoryForge'){
  if(cmd==='prepare dynamite'){
   if(!ready()){add('FORGE > Something is still missing. Check the Factory quest in your journal.','system');v49Forge();return;}
   player.flags.factoryFinalComponent=true;
   portForgeDialogue();
   v49Forge();return;
  }
  if(['workbench','use workbench','terminal','tomorrow project terminal'].includes(cmd)){
   add('Use the workbench or terminal directly in the workshop.','system');
   v49Forge();return;
  }
 }
 if(!busy&&stage==='factoryWorkshop'&&['exit factory','e','exit'].includes(cmd)&&atFactory()){
  lanternNodeMenu();return;
 }
 if(!busy&&stage==='eastEnd'&&atFactory()&&
  ['explore roads','head north — solace','head south — seaport','head north','head south','back'].includes(cmd)){
  lanternNodeMenu();return;
 }
 return priorCore.apply(this,arguments);
};
const materials=r=>({Cloth:r.cloth||0,'Scrap Metal':r.scrap||0,Wire:r.wire||0,
 'Uncommon Electrical Parts':r.parts||0,'Tempered Steel':r.tempered||0,
 'Small Animal Bones':r.smallBones||0,'Animal Bones':r.bones||0,
 'Explosive Components':r.explosives||0,'Animal Hide':r.hide||0,...(r.materials||{})});
const categoryOf=r=>r.type==='weapon'?'weapons':r.type==='armor'?'armor':'items';
const learnedKeys=()=>Object.keys(CRAFT_RECIPES).filter(k=>r11Learned(k));
function renderCraft(){
 if(stage!=='r11Craft')stage='r11Craft';
 // Preserve the original handling for ongoing jobs and interactive recipes.
 if(player.flags.v49MurphyJob||player.flags.devCraftQuote||player.flags.r18FoodDraft)return oldCraftMenu();
 const where=player.flags.r11Bench||'forge';
 const title=where==='forge'?"FORGE'S WORKBENCH":where==='murphy'?"MURPHY'S WORKBENCH":'SEAPORT WORKSHOP';
 numberedChoices={};currentHotkeys={};
 if(!player.flags.v49RecipeBandage){
  add(title+' — CRAFTING','place');
  add('Learn basic crafting from Forge before using the regular crafting station.','system');
  r5DirectChoices(['BACK']);return;
 }
 if(!craftCategory){
  craftKey=null;
  add(title+' — CRAFTING','place');
  add('Choose a category to browse your learned recipes.','system');
  r5DirectChoices(['ITEMS','WEAPONS','ARMOR','BACK']);return;
 }
 if(!craftKey){
  add(title+' — '+craftCategory.toUpperCase(),'place');
  const keys=learnedKeys().filter(k=>categoryOf(CRAFT_RECIPES[k])===craftCategory);
  if(!keys.length)add('No learned recipes in this category.','system');
  r5DirectChoices([...keys.map(k=>'VIEW RECIPE: '+CRAFT_RECIPES[k].name.toUpperCase()),'BACK']);return;
 }
 const r=CRAFT_RECIPES[craftKey];if(!r){craftKey=null;return renderCraft();}
 add('CRAFT — '+r.name.toUpperCase(),'place');
 add('TIME: '+r.seconds+' seconds   SUCCESS: '+Math.round(r.chance*100)+'%','system');
 const required=Object.entries(materials(r)).filter(([,amount])=>amount>0);
 for(const [name,amount] of required)add(name+': '+r6MaterialCount(name)+' / '+amount,'system');
 for(const [name,amount] of Object.entries(r.questInputs||{}))
  add(name+': '+CorvetteRestoration.count(name)+' / '+amount,'system');
 if(r.basicTent)add('Tent: '+(r18ExactTent('Tent')?'1':'0')+' / 1','system');
 if(r.food)add('Ingredients: '+r.food.join(', '),'system');
 if(r.bolts)add('BOLTS: '+player.bolts+' / '+r.bolts,'system');
 if(r.minLevel&&player.level<r.minLevel)add('REQUIRES LEVEL '+r.minLevel,'system');
 const unavailable=required.some(([name,n])=>r6MaterialCount(name)<n)||
  Object.entries(r.questInputs||{}).some(([name,n])=>CorvetteRestoration.count(name)<n)||
  (r.minLevel&&player.level<r.minLevel)||player.bolts<r.bolts||
  (r.basicTent&&!r18ExactTent('Tent'));
 r5DirectChoices([...(unavailable?[]:['CRAFT '+r.name.toUpperCase()]),'BACK']);
}
const oldCraftMenu=r11CraftMenu;
r11CraftMenu=function(where){
 if(where)player.flags.r11Bench=where;
 // Jobs, batch quotes, ingredient pickers keep their native interaction flows.
 if(player.flags.v49MurphyJob||player.flags.devCraftQuote||player.flags.r18FoodDraft)
  return oldCraftMenu.apply(this,arguments);
 if(stage!=='r11Craft'){craftCategory=null;craftKey=null;}
 return renderCraft();
};
const oldCraftCommand=r11CraftCommand;
r11CraftCommand=function(cmd){
 cmd=String(cmd||'').trim().toLowerCase();
 if(player.flags.v49MurphyJob||player.flags.devCraftQuote||player.flags.r18FoodDraft)
  return oldCraftCommand.apply(this,arguments);
 if(['items','weapons','armor'].includes(cmd)){
  craftCategory=cmd;craftKey=null;return renderCraft();
 }
 if(cmd.startsWith('view recipe: ')){
  const name=cmd.slice(13);
  const key=learnedKeys().find(k=>CRAFT_RECIPES[k].name.toLowerCase()===name);
  if(key&&categoryOf(CRAFT_RECIPES[key])===craftCategory){craftKey=key;return renderCraft();}
  return renderCraft();
 }
 if(['back','b'].includes(cmd)&&craftKey){craftKey=null;return renderCraft();}
 if(['back','b'].includes(cmd)&&craftCategory){craftCategory=null;return renderCraft();}
 return oldCraftCommand.apply(this,arguments);
};
// Ensure the source text in Forge's own shop is not duplicated by legacy menus
// while preserving all original merchant buying/selling confirmation rules.
globalThis.DevtestFactoryMenuCleanup={version:'2026-11-04',ready};
})();