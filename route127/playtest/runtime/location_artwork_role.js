/* Classify the final scene by its runtime role, including shared artwork assets.
 * Only the primary environment image is styled; sprite/editor layers are untouched. */
(()=>{
'use strict';
if(typeof GraphicalUI==='undefined')return;
const panels=new Set(['inventory','inventoryItem','confirmDrop','quests','interfaceStatus','interfaceMap','interfaceSave','combatItems','r5Loot','r18HorseTravel','corvetteRescue']);
function classify(model,context={}){
 if(!model?.active)return 'inactive';
 const current=context.stage??stage,place=panels.has(current)?(context.returnStage??returnStage):current;
 const combat=context.combat??(typeof combatState==='undefined'?null:combatState);
 // Casino tables keep their own sizing and overlay coordinate system.
 if(/casino|poker|blackjack|slots/i.test(model.layout||'')||/casino|blackjack|slots|roulette|keno/i.test(place))return 'casino';
 // Fresh Mart is an established fixed location, also registered in the art editor.
 if(place==='wo6FreshMart'&&!combat)return 'location';
 if(model.scenarioBackdrop||place==='encounter'||combat?.source==='encounter')return 'scenario';
 // Combat presentations can share location files with an ordinary interior.
 const scene=context.scene===undefined?globalThis.Route127CombatLayouts?.activeScene():context.scene;
 if(scene&&scene.id!=='motel:pool')return 'scenario';
 if(/\/assets\/regions\//.test(model.art||''))return 'regional';
 if(model.location||place==='abandonedMotel'||(typeof lanternState==='function'&&lanternState()?.nodeId==='abandoned-motel'))return 'location';
 return 'illustration';
}
const model=GraphicalUI.model;
GraphicalUI.model=function(...args){const result=model.apply(this,args);result.artworkCategory=classify(result);return result;};
const sync=GraphicalUI.sync;
GraphicalUI.sync=function(...args){const result=sync.apply(this,args),e=this.element;if(e?.figure)e.figure.dataset.artworkCategory=this.model().artworkCategory;return result;};
globalThis.Route127ArtworkRole=Object.freeze({classify});
})();
