/* DEVTEST-only: entrance workshop art before the Inner Factory. No gameplay changes. */
(function(){
 if(typeof GraphicalUI==='undefined')return;
 const oldContext=GraphicalUI.context.bind(GraphicalUI);
 GraphicalUI.context=function(){
  const overlayStages=new Set(['inventory','inventoryItem','confirmDrop','quests','interfaceStatus','interfaceMap','interfaceSave','combatItems','r5Loot','r18HorseTravel','corvetteRescue']);
  const place=overlayStages.has(stage)?returnStage:stage;
  if(['factoryWorkshop','factoryTerminal','factoryForge','factoryBench'].includes(place))return 'factory-workshop';
  return oldContext();
 };
 const oldModel=GraphicalUI.model.bind(GraphicalUI);
 GraphicalUI.model=function(){
  const model=oldModel();
  if(model.location==='factory-workshop'){
   model.title="Forge's Workshop";
   model.art='../devtest/assets/locations/forge_workshop.png';
  }
  return model;
 };
 if(typeof GraphicalUI.schedule==='function')GraphicalUI.schedule();
})();