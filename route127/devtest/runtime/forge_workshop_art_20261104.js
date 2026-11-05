/* DEVTEST-only: Forge workshop and Boulder Junction visuals. No gameplay changes. */
(function(){
 if(typeof GraphicalUI==='undefined')return;
 const oldContext=GraphicalUI.context.bind(GraphicalUI);
 GraphicalUI.context=function(){
  const overlayStages=new Set(['inventory','inventoryItem','confirmDrop','quests','interfaceStatus','interfaceMap','interfaceSave','combatItems','r5Loot','r18HorseTravel','corvetteRescue']);
  const place=overlayStages.has(stage)?returnStage:stage;
  if(['factoryWorkshop','factoryTerminal','factoryForge','factoryBench'].includes(place))return 'factory-workshop';
  const g=typeof lanternState==='function'?lanternState():null;
  if(place==='lanternNode'&&g?.nodeId==='boulder-junction'&&!g.currentEdgeId)return 'boulder-junction-art';
  return oldContext();
 };
 const oldModel=GraphicalUI.model.bind(GraphicalUI);
 GraphicalUI.model=function(){
  const model=oldModel();
  if(model.location==='factory-workshop'){
   model.title="Forge's Workshop";
   model.art='../devtest/assets/locations/forge_workshop.png';
  }
  if(model.location==='boulder-junction-art'){
   const cleared=!!player?.flags?.portRoadCleared;
   model.title=cleared?'Boulder Junction — Road Cleared':'Boulder Junction — Road Blocked';
   model.art='../devtest/assets/locations/seaport_boulder_'+(cleared?'cleared':'blocked')+'.png';
  }
  return model;
 };
 if(typeof GraphicalUI.schedule==='function')GraphicalUI.schedule();
})();